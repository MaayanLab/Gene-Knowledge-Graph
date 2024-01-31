import JSZip from "jszip";
import fileDownload from "js-file-download";
import {toNumber} from './math'

export function makeTemplate(
    templateString: string,
    templateVariables: string,
) {
  const keys = [...Object.keys(templateVariables).map((key) => key.replace(/ /g, '_')), 'PREFIX']
  const values = [...Object.values(templateVariables), process.env.NEXT_PUBLIC_PREFIX]
  try {
    const templateFunction = new Function(...keys, `return \`${templateString}\`;`)
    return templateFunction(...values)
  } catch (error) {
    return 'undefined'
  }
}

export const isIFrame = () => {
	try {
		if ( window.location !== window.parent.location ) return true
    	else false	
	} catch (error) {
		return false
	}
}

export const process_tables = async (results) => {
	console.log(results)
	const node_columns = ["id", "label"]
	const nodes = []
	const relation_columns = ["source", "target", "relation"]
	const relations = []
	const ids = []
	for (const {data: props} of results.nodes) {
		const row = []
		if (ids.indexOf(props["id"]) === -1) {
			ids.push(props["id"])
		
			for (const i of node_columns) {
				row.push(props[i] || '')
			}
			for (const [k,v] of Object.entries(props)) {
				if (node_columns.indexOf(k) === -1) {
					node_columns.push(k)
					row.push(v || '')
				}
			}
			nodes.push(row)
		}
	}
	for (const {data} of results.edges) {
		const {source, target, relation, properties={}} = data
		const {id, label, ...rest} = properties
		const props = {
			source,
			target,
			relation,
			...rest
		}
		const row = []
		for (const i of relation_columns) {
			row.push(props[i] || '')
		}
		for (const [k,v] of Object.entries(rest)) {
			if (relation_columns.indexOf(k) === -1) {
				relation_columns.push(k)
				row.push(v || '')
			}
		}
		relations.push(row)
	}
	let node_text = node_columns.join("\t") + "\n"
	for (const node of nodes) {
		if (node.length < node_columns.length) {
			const line = [...node, ...Array(node_columns.length-node.length).fill("")]
			node_text = node_text + line.join("\t") + "\n"
		} else {
			node_text = node_text + node.join("\t") + "\n"
		}
	}
	let relation_text= relation_columns.join("\t") + "\n"
	for (const relation of relations) {
		if (relation.length < relation_columns.length) {
			const line = [...relation, ...Array(relation_columns.length-relation.length).fill("")]
			relation_text = relation_text + line.join("\t") + "\n"
		} else {
			relation_text = relation_text + relation.join("\t") + "\n"
		}
	}
	const zip = new JSZip();
	zip.file("nodes.tsv", node_text);
	zip.file("edges.tsv", relation_text);


	zip.generateAsync({type:"blob"}).then(function(content) {
		// see FileSaver.js
		fileDownload(content, "subnetwork.zip");
	});
}

export const process_properties = (properties) => {
	const props = {}
	for ( const k of Object.keys(properties)) {
		const v:string | number | {low: number, high: number} = properties[k]
		if (typeof v === "object") {
			props[k] = toNumber(v)
		} else {
			props[k] = v
		}
	}
	return props
}
