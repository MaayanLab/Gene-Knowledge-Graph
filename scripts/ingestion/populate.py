import sys
import os
import json
import glob
from py2neo import Graph, Node, Relationship
from tqdm import tqdm

from dotenv import load_dotenv

load_dotenv()

class GraphEx:
  ''' A convenient wrapper around Graph which regularly
  commits intermediately (this seems to improve performance)
  '''
  chunk_size = 2000

  def __init__(self, *args, **kwargs):
    self.graph = Graph(*args, **kwargs)
    self.n = 0
    self.tx = None

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
    self.graph.run("MATCH (n {id: '%s'}) DETACH DELETE n"%id)
    self._periodic_commit()
  
  def merge(self, obj):
    self._begin()
    if obj["id"]:
      self.tx.merge(obj, primary_label="id", primary_key="id")
    else:
      self.tx.merge(obj, primary_label="symbol", primary_key="symbol")
    self._periodic_commit()
  
  def run(self, parameters=None, **kwparameters):
    return self.graph.run(parameters=parameters, **kwparameters)




# python populate.py clean (optional) /path/to/files/to/ingest
vals = sys.argv[1:]
clean = False
if vals[0] == "clean":
  clean = True
  directories = vals[1:]
else:
  directories = vals
  
try:
  neo4graph = GraphEx(os.environ['NEO4J_URL'], auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD']))
  if clean:
    print("Clean install...")
    deleted_nodes = set()
    for directory in directories:
      for filename in glob.glob(directory + "/*.valid.json"):
          with open(filename) as o:
            print("Deleting %s"%filename)
            serialized = json.loads(o.read())
            for i in tqdm(serialized["edges"]):
              source = i["source"]
              if source not in deleted_nodes:
                deleted_nodes.add(source)
                # node_a_props = serialized["nodes"][source]
                # node_a_properties = node_a_props.get("properties", {})
                # node_a_type = node_a_props["type"]
                # node_a = Node(node_a_type, **node_a_properties)
                neo4graph.delete(source)

              target = i["target"]
              if target not in deleted_nodes:
                deleted_nodes.add(target)
                # node_b_props = serialized["nodes"][target]
                # node_b_properties = node_b_props.get("properties", {})
                # node_b_type = node_b_props["type"]
                # node_b = Node(node_b_type, **node_b_properties)
                neo4graph.delete(target)
          neo4graph.commit()
  print("Ingesting...")
  for directory in directories:
    for filename in glob.glob(directory + "/*.valid.json"):
      with open(filename) as o:
        print("Ingesting %s"%filename)
        serialized = json.loads(o.read())
        for i in tqdm(serialized["edges"]):
          source = i["source"]
          node_a_props = serialized["nodes"][source]
          node_a_properties = node_a_props.get("properties", {})
          node_a_type = node_a_props["type"]
          node_a = Node(node_a_type, **node_a_properties)
          neo4graph.merge(node_a)

          target = i["target"]
          node_b_props = serialized["nodes"][target]
          node_b_properties = node_b_props.get("properties", {})
          node_b_type = node_b_props["type"]
          node_b = Node(node_b_type, **node_b_properties)
          neo4graph.merge(node_b)

          relation = i["relation"]
          relation_properties_dict = i.get("properties", {})
          neo4graph.merge(Relationship(node_a, relation, node_b, **relation_properties_dict))
  neo4graph.commit()
except Exception as e:
  print(e)