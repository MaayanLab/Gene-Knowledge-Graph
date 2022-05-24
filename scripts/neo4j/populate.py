import pandas as pd
import os

df = pd.read_csv(os.environ['NEO4J_TSV'], sep="\t")
human_df = df[(df["Taxid Interactor A"] == 'taxid:9606') & (df["Taxid Interactor B"] == 'taxid:9606')]
human_df = human_df[(human_df["Interaction Types"] == 'psi-mi:"MI:0407"(direct interaction)') | (human_df["Interaction Types"] ==  'psi-mi:"MI:0915"(physical association)')]
human_df = human_df[~(human_df["Confidence Values"] == "-")]
for i in human_df.index:
    human_df.at[i, "Confidence Values"] = float(human_df.at[i, "Confidence Values"].replace("score:", ""))
human_df = human_df.sort_values("Confidence Values", ascending=False)
human_df = human_df.head(150000)

from py2neo import Graph, Node, Relationship
from tqdm import tqdm

class GraphEx:
  ''' A convenient wrapper around Graph which regularly
  commits intermediately (this seems to improve performance)
  '''
  chunk_size = 2000

  def __init__(self, *args, **kwargs):
    self.graph = Graph(*args, **kwargs)
    self.graph.delete_all()
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
  
  def merge(self, obj):
    self._begin()
    if obj["id"]:
      self.tx.merge(obj, primary_label="id", primary_key="id")
    else:
      self.tx.merge(obj, primary_label="symbol", primary_key="symbol")
    self._periodic_commit()
  
  def run(self, parameters=None, **kwparameters):
    return self.graph.run(parameters=parameters, **kwparameters)


neo4graph = GraphEx(os.environ['NEO4J_URL'], auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD']))

for i in tqdm(human_df.index):
    gene_id_a = human_df.at[i, "#ID Interactor A"].split(":")[1]
    gene_name_a = human_df.at[i, "Alt IDs Interactor A"].split("|")[1].split(":")[1]
    gene_a_property = {
        "id": gene_id_a,
        "label": gene_name_a,
        "Alt_IDs" : human_df.at[i, "Alt IDs Interactor A"],
        "Aliases" : human_df.at[i, "Aliases Interactor A"],
        "Taxon": human_df.at[i, "Taxid Interactor A"]
    }
    node_a = Node("Gene", **gene_a_property)
    neo4graph.merge(node_a)
    
    gene_name_b = human_df.at[i, "Alt IDs Interactor B"].split("|")[1].split(":")[1]
    gene_id_b = human_df.at[i, "ID Interactor B"].split(":")[1]
    gene_b_property = {
        "id": gene_id_b,
        "label": gene_name_b,
        "Alt_IDs" : human_df.at[i, "Alt IDs Interactor B"],
        "Aliases" : human_df.at[i, "Aliases Interactor B"],
        "Taxon": human_df.at[i, "Taxid Interactor B"]
    }
    node_b = Node("Gene", **gene_b_property)
    neo4graph.merge(node_b)
    relation_id = human_df.at[i, "Interaction Types"].split('"')[1].split(":")[1]
    relation = human_df.at[i, "Interaction Types"].split('(')[1].replace(")", "")
    relation_property_dict = {
        "id": human_df.at[i, "Interaction Identifiers"],
        "label": relation,
        "Publication_Identifiers": human_df.at[i, "Publication Identifiers"],
        "Interaction_Detection_Method": human_df.at[i, "Interaction Detection Method"],
        "Publication_1st_Author": human_df.at[i, "Publication 1st Author"],
        "Source_Database": human_df.at[i, "Source Database"],
        "Relation_ID": relation_id,
        "Confidence_Values": human_df.at[i, "Confidence Values"]
    }
    neo4graph.merge(Relationship(node_a, relation, node_b, **relation_property_dict))
