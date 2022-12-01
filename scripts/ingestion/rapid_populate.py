import sys
import os
import json
import argparse
import glob
from py2neo import Graph, Node, Relationship
import boto3
import requests
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

class GraphEx:
  ''' A convenient wrapper around Graph which regularly
  commits intermediately (this seems to improve performance)
  '''
  chunk_size = 100000

  def __init__(self, *args, **kwargs):
    self.graph = Graph(*args, **kwargs)
    self.n = 0
    self.tx = None

  def delete_all(self):
    self.graph.delete_all()

  def _begin(self):
    if self.tx is None:
      self.n = 0
      self.tx = self.graph.begin()

  def commit(self):
    if self.tx is not None:
      self.graph.commit(self.tx)
      self.tx = None

  def _periodic_commit(self):
    self.n += 1
    if self.n % GraphEx.chunk_size == 0:
      self.commit()

  def create(self, obj):
    self._begin()
    self.tx.create(obj)
    self._periodic_commit()

  def delete(self, id):
    self._begin()
    self.graph.run("MATCH (n {id: '%s'}) DETACH DELETE n"%id.replace("'","\'"))
    self._periodic_commit()
  
  def merge(self, obj):
    self._begin()
    self.tx.merge(obj, primary_label="id", primary_key="id")
    self._periodic_commit()
  
  def run(self, parameters=None, **kwparameters):
    return self.graph.run(parameters=parameters, **kwparameters)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-d', '--dir', help='comma separeated directories to ingest. Input aws to use aws credentials. Use file if using an ingestion file', required=True)
    parser.add_argument('-i', '--ingest-file', help='Clean nodes', default='n')
    parser.add_argument('-c', '--clean', help='Clean nodes', default='n')
    parser.add_argument('-C', '--clean-all', help='Clean nodes', default='n')
    parser.add_argument('-m', '--merge', help='Merge nodes with similar ids?', default='n')
    args = parser.parse_args()
    return [args.dir, args.ingest_file, args.clean, args.clean_all, args.merge]

neo4graph = GraphEx(os.environ['NEO4J_URL'], auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD']))

dir, ingest_file, clean, clean_all, merge = parse_args()

if clean_all == 'y':
  print("Clean install")
  neo4graph.delete_all()

def delete_nodes(serialized):
  for i in serialized["nodes"]:
    neo4graph.delete(i)

def process_serialized(serialized, merge):
    # Ingest Nodes
    nodes = {}
    for k,v in tqdm(serialized["nodes"].items()):
        node_properties = v.get("properties", {})
        node_type = v["type"]
        node_id = node_properties["id"]
        node = Node(node_type, **node_properties)
        nodes[node_id] = node
        if merge:
            neo4graph.merge(node)
        else:
            neo4graph.create(node)
    print("Ingested nodes")
    for i in tqdm(serialized["edges"]):
        source = i["source"]
        source_node = nodes[source]
        target = i["target"]
        target_node = nodes[target]
        relation = i["relation"]
        relation_properties_dict = i.get("properties", {})
        if merge:
           neo4graph.merge(Relationship(source_node, relation, target_node, **relation_properties_dict))
        else:
           neo4graph.create(Relationship(source_node, relation, target_node, **relation_properties_dict))


try:
    serialized = {
        "nodes": {},
        "edges": []
    }
    for directory in dir.split(","):
      for filename in glob.glob(directory + "/*.valid.json"):
        with open(filename) as o:
          print("Ingesting %s..."%filename)
          s = json.loads(o.read())
          serialized["nodes"] = {
            **serialized["nodes"],
            **s["nodes"],
          }
          serialized["edges"] = serialized["edges"] + s["edges"]

    if clean == 'y':
      delete_nodes(serialized)
    print("Ingesting...")
    process_serialized(serialized, merge=merge=="y")
    neo4graph.commit()
except Exception as e:
    print(e)