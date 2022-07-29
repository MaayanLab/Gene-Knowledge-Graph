import sys
import os
import json
import requests
from py2neo import Graph, Node, Relationship
from tqdm import tqdm

from dotenv import load_dotenv

load_dotenv()


with open(sys.argv[1]) as o:
	schema = json.loads(o.read())
if os.environ['NEXT_PUBLIC_SCHEMA'] and not os.environ['NEXT_PUBLIC_SCHEMA']=="" and "http" in  os.environ['NEXT_PUBLIC_SCHEMA']:
	res = requests.get(os.environ['NEXT_PUBLIC_SCHEMA'])
	schema = res.json()

graph = Graph(os.environ['NEO4J_URL'], auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD']))

for i in schema["nodes"]:
	print("Indexing %s"%i["node"])
	graph.run("""
		CREATE BTREE INDEX `%s_id_index` IF NOT EXISTS
		FOR (n:`%s`)
		ON (n.id)
	"""%(i["node"], i["node"]))
	graph.run("""
		CREATE BTREE INDEX `%s_label_index` IF NOT EXISTS
		FOR (n:`%s`)
		ON (n.label)
	"""%(i["node"], i["node"]))
	for k in (i["search"] or []):
		print("Indexing %s"%k)
		graph.run("""
			CREATE BTREE INDEX `%s_%s_index` IF NOT EXISTS
			FOR (n:`%s`)
			ON (n.`%s`)
		"""%(i["node"], k, i["node"], k))
		 
	
