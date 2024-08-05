import JSZip from "jszip";
import fileDownload from "js-file-download";
import {toNumber} from './math'
import type { NextRequest } from 'next/server'
import Color from 'color'
import { default_get_node_color_and_type } from '@/app/api/knowledge_graph/helper'

export function makeTemplate(
    templateString: string,
    templateVariables: {[key:string]: string|number|boolean},
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

const convert_int = (v) => {
    try {
        if (isNaN(v)) return v
        else return parseInt(v)
    } catch (error) {
        return v
    }
}

export const convert_query = (req: NextRequest) => {
    const input_query = {}
    for (const [k,v] of req.nextUrl.searchParams.entries()) {
        input_query[k] = convert_int(v)
    }
    return input_query
}

export const kind_mapper = ({node, type, augmented_genes, gene_list}) => {
    if (type !== "Gene") return type
    const label = node.label
    if (augmented_genes.indexOf(label) > -1 && gene_list.indexOf(label) == -1) {
        return "Predicted Gene (Co-Expression)"
    } else return "Gene"
    
}

export const augment_gene_set = async ({gene_list, augment_limit}) => {
    const request = await fetch(`${process.env.NEXT_PUBLIC_GENESHOT_URL}/api/associate`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            gene_list,
            similarity: "coexpression",
            limit: parseInt(augment_limit)
        }),
    })
    if (!request.ok) {
        throw new Error("Error communicating with GeneShot API")
    } 
    const result = await request.json()
    const augmented_genes = Object.keys(result.association)
    return {
        augmented_genes
    }
}


export function typed_fetch<T>(url: string, controller?:AbortController): Promise<T> {
    const params = {}
    if (controller) params["signal"] = controller.signal
    params["revalidate"] = 3600
    return fetch(url, params)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json() as Promise<T>
      })
  }

const color_map = {}
const get_color = ({color, darken}) => {
	if (!color_map[color]) color_map[color] = Color(color)

	if (darken) return color_map[color].darken(darken*0.2).hex()
	else return color_map[color].hex()
}

export const compute_colors = ({properties, aggr_scores, color}:{
    properties: {[key: string]: any},
    aggr_scores: {max: number, min: number},
    color: string,
  }) => {
    const props: {
        node_type: number,
        borderWidth: number,
        borderColor?: string,
        gradient_color?:string,
        borderStyle?:string,
        color?: string
    } = {node_type: 0, borderWidth: 0}
    if (properties.pval > 0.05) {
        props.borderColor = "#757575",
        props.borderWidth = 7
    }
    const max_pval = aggr_scores.max //aggr_scores.max_pval > 0.05 ? aggr_scores.max_pval: 0.05
    const min_pval = aggr_scores.min
    const darken =  Math.abs((properties.pval - min_pval)/(max_pval-min_pval))
    props.gradient_color = get_color({color, darken})
    props.color = color

    return props
}

export const get_node_color_and_type_augmented = ({node,
    terms,
    color,
    aggr_scores,
    field,
    aggr_field,
    fields,
    augmented_genes,
    gene_list}:
    {
        node: {[key:string]: any},
        terms?: Array<string>,
        color?: string,
        aggr_scores?: {[key:string]: {max: number, min: number}},
        field?: string,
        aggr_field?: string,
        aggr_type?: string,
        fields?: Array<string>,
        augmented_genes?: Array<string>,
        gene_list?: Array<string>
    }) => {
    if (node.pval === undefined) {
        if (augmented_genes.indexOf(node.label) > -1 && gene_list.indexOf(node.label) === -1) {
            const props = default_get_node_color_and_type(({node, terms, color, aggr_scores, field, aggr_field, fields}))
            props.borderColor = "#ff80ab",
            props.borderWidth = 7
            return props
        } else {
            return default_get_node_color_and_type(({node, terms, color, aggr_scores, field, aggr_field, fields}))
        }
    }
    else {
        const props = compute_colors({properties: node, aggr_scores: aggr_scores.pval, color}) 
        for (const i in node.enrichment || []) {
            const v = node.enrichment[i]
            node.enrichment[i] = { ...v, ...compute_colors({properties: v, aggr_scores: aggr_scores.pval, color}) }
        }
        return props
    }	
}

// support old queries
export interface FilterSchema {
    start?: string,
    start_field?: string,
    start_term?: string,
    end?: string,
    end_field?: string,
    end_term?: string,
    relation?: string| Array<string | {name?: string, limit?: string}>,
    limit?: number,
    page?: number,
    gene_links?: Array<string>,
    augment?: boolean,
    augment_limit?: number,
    remove?: Array<string>,
    expand?: Array<string>,
    additional_link_tags?: Array<string>
}

export const process_relation = (r:Array<string | {name?: string, limit?: string}>|string, limit?:number) => {
    if (Array.isArray(r)) {
        if (r.length === 0) return r
        else if (typeof r[0] === 'string') return r.map(name=>({name, limit: limit || 5}))
        else if (r[0]["name"]!==undefined) return r
    } else if (typeof r === 'string') {
        try {
            const relations  = JSON.parse(r || '[]')
            if (typeof relations[0] === 'string') return relations.map(name=>({name, limit: limit || 5}))
            else if (r["name"]!==undefined) return relations
        } catch (error) {
            return r.split(",").map(name=>({name, limit: limit || 5}))
        }
    }
}

export const process_filter = (query: {
    start?: string,
    start_field?: string,
    start_term?: string,
    end?: string,
    end_field?: string,
    end_term?: string,
    relation?: string| Array<string | {name?: string, limit?: string}>,
    limit?: number,
    page?: number,
    filter?: FilterSchema,
    [key: string]: any
}) => {
    const {
        start,
        start_field,
        start_term,
        end,
        end_field,
        end_term,
        relation,
        limit,
        page,
        filter={},
        ...rest
    } = query
    return {
        filter: JSON.stringify({
            start,
            start_field,
            start_term,
            end,
            end_field,
            end_term,
            relation: process_relation(relation),
            limit,
            ...filter
        }),
        ...rest
    }

}
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));