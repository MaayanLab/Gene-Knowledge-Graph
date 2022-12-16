import os
import sys
import pandas as pd
from itertools import islice
import re

from glob import glob
from py2neo import Graph
from py2neo.bulk import create_nodes, create_relationships
from dotenv import load_dotenv
load_dotenv()


def df_parser_node(df):
    for i in df.iterrows():
        props = i[1].dropna().to_dict()
        props["id"] = str(props["id"])
        yield props

def df_parser_edge(df):
    for i in df.iterrows():
        props = i[1].dropna().to_dict()
        source = str(props.pop('source'))
        target = str(props.pop('target'))
        yield (source, props, target)

chunk_size = os.getenv('CHUNK_SIZE', default=100000)
# comma separated directories
directories = sys.argv[1:]

class GraphEx:
  ''' A convenient wrapper around Graph which regularly
  commits intermediately (this seems to improve performance)
  '''

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

  def transaction(self):
    self._begin()
    return self.tx

  def run(self, query):
    return self.graph.run(query)

graph = GraphEx(os.environ['NEO4J_URL'], auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD']))

node_pattern = "(?P<directory>.+)/(?P<label>.+)\.(?P<entity>.+)\.csv"
edge_pattern = "(?P<directory>.+)/(?P<source_type>.+)\.(?P<relation>.+)\.(?P<target_type>.+)\.(?P<entity>.+)\.csv"
for directory in directories:
    directory = directory.strip()
    for filename in glob(directory + "/*.nodes.csv"):
        match = re.match(node_pattern, filename).groupdict()
        entity = match["entity"]
        label = match["label"].replace("_", " ")
        print("Ingesting %s nodes..."%label)
        # add constraint
        graph.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n: `%s`) REQUIRE n.id IS UNIQUE"%label)
        graph.run("CREATE INDEX IF NOT EXISTS FOR (n: `%s`) ON (n.label)"%label)
        df = pd.read_csv(filename)
        stream = iter(df_parser_node(df))
        while True:
            batch = list(islice(stream, chunk_size))
            if batch:
                create_nodes(graph.transaction(), batch, labels={label})
                graph.commit()
            else:
                print("Ingested")
                break
    for filename in glob(directory + "/*.edges.csv"):
        match = re.match(edge_pattern, filename).groupdict()
        entity = match["entity"]
        source_type = match["source_type"].replace("_", " ")
        relation = match["relation"].replace("_", " ")
        print("Ingesting %s edges..."%relation)
        target_type = match["target_type"].replace("_", " ")
        # add constraint
        df = pd.read_csv(filename)
        stream = iter(df_parser_edge(df))
        while True:
            batch = list(islice(stream, chunk_size))
            if batch:
                create_relationships(graph.transaction(), batch, relation, start_node_key=(source_type, "id"), end_node_key=(target_type, "id"))
                graph.commit()
            else:
                break

        