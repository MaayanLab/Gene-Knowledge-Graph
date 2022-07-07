from rdflib import  Graph, RDF, RDFS
import sys
import json
import glob

def get_id(value):
    for prefix, val in rdfgraph.namespaces():
        v = value.replace(val, "")
        if not v == value:
            return prefix.replace('relationship', "Relation").replace('relation', "Relation"), v
    else:
        return "Literal", value

    
def graph_to_json(rdfgraph):
    nodes = {}
    edges = {}
    # IDs
    for subj, pred, obj in rdfgraph.triples((None, RDF.type, None)):
        _, node_id = get_id(str(subj))
        _, pred = get_id(str(pred))
        _,  node_type = get_id(str(obj))
        if node_type == "Relation":
            edges[node_id] = {
                "type": node_type,
                "properties": {
                    "id": node_id
                }
            }
        else:
            nodes[node_id] = {
                "type": node_type,
                "properties": {
                    "id": node_id
                }
            }
    for subj, pred, obj in rdfgraph.triples((None, RDFS.label, None)):
        node_type, node_id = get_id(str(subj))
        _, pred = get_id(str(pred))
        _, node_label = get_id(str(obj))
        if node_id in nodes:
            nodes[node_id]["properties"]["label"] = node_label
            if "type" not in nodes[node_id]:
                nodes[node_id]["type"] = node_type
        if node_id in edges:
            edges[node_id]["relation"] = node_label
            if "type" not in edges[node_id]:
                edges[node_id]["type"] = node_type
    count = 0
    edgeset = set()
    for subj, pred, obj in rdfgraph.triples((None, None, None)):
        subj_prefix, subj = get_id(str(subj))
        pred_prefix, pred = get_id(str(pred))
        obj_prefix, obj = get_id(str(obj))
        edge_id = "%s_%s_%s"%(subj, pred, obj)
        if not pred == "type" and not pred == "label":
            count += 1
            edgeset.add(edge_id)
            if pred_prefix == "Relation":
                    edges[edge_id] = {
                        "source": subj,
                        "relation": pred,
                        "target": obj,
                    }
            elif pred in edges:
                edges[pred]["source"] = subj
                edges[pred]["target"] = obj
            elif subj in nodes:
                nodes[subj]["properties"][pred] = obj
            elif subj in edges:
                edges[subj]["properties"][pred] = obj
                    
            if subj not in nodes:
                nodes[subj] = {
                    "type": subj_prefix,
                    "properties": {
                        "id": subj,
                        "label": subj
                    }
                }

            if obj not in nodes:
                if not obj_prefix == "Literal":
                    nodes[obj] = {
                        "type": obj_prefix,
                        "properties": {
                            "id": obj,
                            "label": obj
                        }
                    }
                else:
                    nodes[subj]["properties"][pred] = obj
            if pred not in edges and edge_id not in edges:
                # if subj is in nodes then it is probably a node
                if subj not in nodes:
                # If it is a literal then it may be describing a property
                    if not pred_prefix == "Literal":
                        edges[pred] = {
                            "source": subj,
                            "relation": pred,
                            "target": obj,
                            "type": "Relation",
                            "properties": {
                                "id": "%s_%s_%s"%(subj, pred, obj)
                            }
                        }
                    else:
                        edges[subj] = {
                            "relation": subj,
                            "type": "Relation",
                            "properties": {
                                pred: obj
                            }
                        }
#     for i in edgeset:
#         if i not in edges:
#             print(i)
    return {"nodes": nodes, "edges": list(edges.values())}

directory = sys.argv[1]

for filename in glob.glob(directory + "/*.ttl"):
	rdfgraph = Graph()
	rdfgraph.parse(filename, format='ttl')

	serialization = graph_to_json(rdfgraph)
	with open(filename.replace(".ttl", ".v1.json"), "w") as o:
		o.write(json.dumps(serialization, indent=2))
