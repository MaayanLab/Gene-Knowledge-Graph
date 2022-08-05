import os
import sys
from py2neo import Graph, Node, Relationship
from tqdm import tqdm
import requests
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


def process_serialized(serialized):
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

def delete_nodes(serialized):
  for i in tqdm(serialized["nodes"]):
    if not serialized["nodes"][i]["type"] == "Gene":
      neo4graph.delete(i)

# python populate.py clean (optional) /path/to/files/to/ingest

files = [
    "https://s3.amazonaws.com/maayan-kg/ingestion/glygen.valid.json",
    "https://s3.amazonaws.com/maayan-kg/ingestion/metabolomics.valid.json",
    "https://s3.amazonaws.com/maayan-kg/ingestion/HuBMAP.valid.json",
    "https://s3.amazonaws.com/maayan-kg/ingestion/sigcom_lincs_serialization.valid.json",
    "https://s3.amazonaws.com/maayan-kg/ingestion/biogrid_150K.valid.json",
    "https://s3.amazonaws.com/maayan-kg/ingestion/archs4_coexpression.valid.json",
    "https://s3.amazonaws.com/maayan-kg/ingestion/GTEx.valid.json",
]
neo4graph = GraphEx(os.environ['NEO4J_URL'], auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD']))


try:
    clean = sys.argv[1]
    for url in files:       
        print("Ingesting %s..."%url)
        res = requests.get(url)
        serialized = res.json()
        if (clean == "clean"):
          delete_nodes(serialized)
        process_serialized(serialized)
    neo4graph.commit()
except Exception as e:
    print(e)