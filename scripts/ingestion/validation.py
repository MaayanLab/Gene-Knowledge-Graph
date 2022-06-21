import sys
import json
import glob

# python validation /path/to/v2/files

type_mapper = {
    "int": int,
    "number": float,
    "string": str,
    "object": dict,
    "array": list,
    "bool": bool
}

def validation(entry):
    if '@type' not in entry:
        raise Exception("@type not found in %s"%json.dumps(entry))
    if '@value' not in entry:
        raise Exception("@value not found in %s"%json.dumps(entry))
    valid = isinstance(entry["@value"], type_mapper[entry["@type"]])
    if not valid:
        raise Exception("Invalid @type %s: %s"%(entry["@type"],entry["@value"]))
    elif entry["@type"] == "array" and len(entry["@value"]) > 0:
        valid_array = []
        for i in entry["@value"]:
            valid_array.append(validation(i))
        return(valid_array)
    elif entry["@type"] == "object" and len(entry["@value"]) > 0:
        valid_object = {}
        for k,v in entry["@value"].items():
            valid_object[k] = validation(v)
        return valid_object
    
    return entry["@value"]


def validate(unvalidated_json):
    try:
        if not unvalidated_json["version"] == '2':
            raise Exception("Please enter KG Serialization version 2")
        validated_json = {
            "version": "1"
        }

        nodes = {}
        for k,v in unvalidated_json["nodes"].items():
            n = validation(v)
            nodes[k] = n
        validated_json["nodes"] = nodes
        edges = []
        for i in unvalidated_json["edges"]:
            e = validation(i)
            if not e["source"] in nodes:
                raise Exception("Cannot find source %s on nodes"%e["source"])
            if not e["target"] in nodes:
                raise Exception("Cannot find target %s on nodes"%e["target"])
            edges.append(e)
        validated_json["edges"] = edges  
        return validated_json
    except Exception as e:
        print(e)
        return False

directory = sys.argv[1]

for filename in glob.glob(directory + "/*.v2.json"):
	with open(filename) as o:
		unvalidated_json = json.loads(o.read())
	if not unvalidated_json == False:
		print("Validated %s"%filename)
		with open(filename.replace(".v2.json", ".valid.json"), 'w') as o:
			o.write(json.dumps(validate(unvalidated_json)))