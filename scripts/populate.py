import pandas as pd
import csv
import json
from uuid import UUID , uuid5
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv("../.env")

db_user = os.environ.get("DATABASE_USER")
db_pass = os.environ.get("DATABASE_PASS")
db_host = os.environ.get("DATABASE_HOST")
db_port = os.environ.get("DATABASE_PORT")
db = os.environ.get("DATABASE_DB")

NAMESPACE_URL = UUID(os.environ.get("NAMESPACE"))

# connect with db
con = psycopg2.connect(
    database=db,
    user=db_user,
    password=db_pass,
    host=db_host,
    port=db_port,
)
cur = con.cursor()

# Resources
resources = pd.read_csv("data/resources.tsv", sep="\t")
if "id" not in resources.columns:
	resources["id"] = ""
	for i in resources.index:
		name = resources.at[i, "name"]
		resources.at[i, "id"] = str(uuid5(NAMESPACE_URL, name))
resources = resources.set_index("id")
resources.to_csv("output/resources.psql.tsv", sep="\t", header=False)

# Nodes
nodes = pd.read_csv("data/nodes.tsv", sep="\t")
if "id" not in nodes.columns:
	nodes["id"] = ""
	for i in nodes.index:
		name = nodes.at[i, "name"]
		nodes.at[i, "id"] = str(uuid5(NAMESPACE_URL, name))
nodes = nodes.set_index("id")
nodes.to_csv("output/nodes.psql.tsv", sep="\t", header=False)

# Workflows
workflows = pd.read_csv("data/workflows.tsv", sep="\t")
resources = resources.reset_index()
resources = resources.set_index("name")
nodes = nodes.reset_index()
nodes = nodes.set_index("name")
workflows_resources = pd.DataFrame(columns=["workflow", "start", "end", "resource", "endpoint"])
index = 0
if "id" not in workflows.columns:
	workflows["id"] = ""
for i in workflows.index:
	label = workflows.at[i, "title"]
	endpoint = workflows.at[i, "endpoint"]
	start =  nodes.at[workflows.at[i, "start"], "id"]
	end =  nodes.at[workflows.at[i, "end"], "id"]
	uid = workflows.at[i, "id"]
	if uid == "":
		uid = str(uuid5(NAMESPACE_URL, "%s,%s,%s"%(start, end, endpoint)))
	workflows.at[i, "id"] = uid
	workflows.at[i, "start"] = start
	workflows.at[i, "end"] = end
	
	
	for r in json.loads(workflows.at[i, "resources"]):
		resource = resources.at[r, "id"]
		workflows_resources.loc[index] = [uid, start, end, resource, endpoint]
		index += 1

workflows = workflows.set_index("id")
workflows[[i for i in workflows.columns if not i == "resources"]].to_csv("output/workflows.psql.tsv", sep="\t", header=False)

workflows_resources.to_csv("output/workflows_resources.psql.tsv", sep="\t", header=False, index = False)

# Delete removed entries

# Workflow resources
try:
	cur.execute('''
		DELETE FROM workflowresources
	''')

	# Workflows
	input_file = "output/workflows.psql.tsv"
	cur.execute('''
		create table workflows_tmp
		as table workflows
		with no data;
	''')

	with open(input_file, 'r') as fr:
		cur.copy_from(fr, 'workflows_tmp',
		columns=("id", "start_node", "end_node", "name", "description", "endpoint", "priority", "type", "icon"),
		null='',
		sep='\t',
		)

	cur.execute('''
		DELETE FROM workflows w
		WHERE NOT EXISTS(SELECT NULL
							FROM workflows_tmp wt
						WHERE w.id = wt.id)
	''')

	cur.execute('drop table workflows_tmp;')

	# Resources
	input_file = "output/resources.psql.tsv"
	cur.execute('''
		create table resources_tmp
		as table resources
		with no data;
	''')

	with open(input_file, 'r') as fr:
		cur.copy_from(fr, 'resources_tmp',
		columns=("id", "name", "description", "priority", "icon"),
		null='',
		sep='\t',
		)

	cur.execute('''
		DELETE FROM workflows w
		WHERE NOT EXISTS(SELECT NULL
							FROM resources_tmp wt
						WHERE w.id = wt.id)
	''')

	cur.execute('drop table resources_tmp;')

	# Nodes
	input_file = "output/nodes.psql.tsv"
	cur.execute('''
		create table nodes_tmp
		as table nodes
		with no data;
	''')

	with open(input_file, 'r') as fr:
		cur.copy_from(fr, 'nodes_tmp',
		columns=("id", "name", "priority", "icon"),
		null='',
		sep='\t',
		)

	cur.execute('''
		DELETE FROM workflows w
		WHERE NOT EXISTS(SELECT NULL
							FROM nodes_tmp wt
						WHERE w.id = wt.id)
	''')

	cur.execute('drop table nodes_tmp;')

	# Ingestion

	# Resources
	input_file = "output/resources.psql.tsv"
	cur.execute('''
		create table resources_tmp
		as table resources
		with no data;
	''')

	with open(input_file, 'r') as fr:
		cur.copy_from(fr, 'resources_tmp',
		columns=("id", "name", "description", "priority", "icon"),
		null='',
		sep='\t',
		)

	cur.execute('''
		insert into resources (id, name, description, priority, icon)
		select id, name, description, priority, icon
		from resources_tmp
		on conflict (id)
			do update
			set 
			name = excluded.name,
			description = excluded.description,
			priority = excluded.priority,
			icon = excluded.icon
		;
	''')

	cur.execute('drop table resources_tmp;')

	# Nodes
	input_file = "output/nodes.psql.tsv"
	cur.execute('''
		create table nodes_tmp
		as table nodes
		with no data;
	''')

	with open(input_file, 'r') as fr:
		cur.copy_from(fr, 'nodes_tmp',
		columns=("id", "name", "priority", "icon"),
		null='',
		sep='\t',
		)

	cur.execute('''
		insert into nodes (id, name, priority, icon)
		select id, name, priority, icon
		from nodes_tmp
		on conflict (id)
			do update
			set 
			name = excluded.name,
			priority = excluded.priority,
			icon = excluded.icon
		;
	''')

	cur.execute('drop table nodes_tmp;')

	# Workflows
	input_file = "output/workflows.psql.tsv"
	cur.execute('''
		create table workflows_tmp
		as table workflows
		with no data;
	''')

	with open(input_file, 'r') as fr:
		cur.copy_from(fr, 'workflows_tmp',
		columns=("id", "start_node", "end_node", "name", "description", "endpoint", "priority", "type", "icon"),
		null='',
		sep='\t',
		)

	cur.execute('''
		insert into workflows (id, start_node, end_node, name, description, endpoint, priority, type, icon)
		select id, start_node, end_node, name, description, endpoint, priority, type, icon
		from workflows_tmp
		on conflict (id)
			do update
			set 
			type = excluded.type,
			name = excluded.name,
			endpoint = excluded.endpoint,
			description = excluded.description,
			priority = excluded.priority,
			icon = excluded.icon
		;
	''')

	cur.execute('drop table workflows_tmp;')

	input_file = "output/workflows_resources.psql.tsv"
	cur.execute('''
		create table workflowresources_tmp
		as table workflowresources
		with no data;
	''')

	with open(input_file, 'r') as fr:
		cur.copy_from(fr, 'workflowresources_tmp',
		columns=("workflow", "start_node", "end_node", "resource", "endpoint"),
		null='',
		sep='\t',
		)

	cur.execute('''
		insert into workflowresources (workflow, start_node, end_node, resource, endpoint)
		select workflow, start_node, end_node, resource, endpoint
		from workflowresources_tmp
		on conflict (start_node, end_node, resource, workflow)
			do nothing
		;
	''')

	cur.execute('drop table workflowresources_tmp;')
	con.commit()
	print("Done!")
except Exception as e:
	print(e)
	con.rollback()
con.close()