import neo4j from "neo4j-driver"
import { neo4jDriver } from "./neo4j"
import fetch from 'isomorphic-unfetch'
import * as default_schema from '../public/schema.json'
import { toNumber } from "./math"
import Color from 'color'
import { UISchema } from "@/app/api/schema/route"

export async function get_terms(node, search) {
  try {
    const session = neo4jDriver.session({
      defaultAccessMode: neo4j.session.READ
    })
	let query = `MATCH (g: \`${node}\`) RETURN *`
	if (process.env.NODE_ENV==="development") {
		console.log("Dev mode")
		const entries = search.reduce((acc, i)=>({
			...acc,
			[i]: new Set()
		}), {})
		let skip = 0
		const limit = 500
		while (skip < 1000) {
			const results = await session.readTransaction(txc => txc.run(`${query} SKIP ${skip} LIMIT ${limit}`))
			for (const record of results.records) {
				const g = record.get('g')
				for (const i of search) {
					const val = toNumber(g.properties[i])
					if (val!==undefined) entries[i].add(val)
				}
			}
			skip = skip + limit	
		}
		for (const i of search) {
			entries[i] = Array.from(entries[i])
		}
		return entries
	} else {
		console.log("Starting...")
		const count_r = await session.readTransaction(txc => txc.run(`MATCH (g: \`${node}\`) RETURN count(g) as count`))
		// const count = count_r.get('count')
		const count = toNumber(count_r.records[0].get('count'))
		console.log("Total:",count)
		const entries = search.reduce((acc, i)=>({
			...acc,
			[i]: new Set()
		}), {})
		let skip = 0
		const limit = 500
		while (skip < count) {
			const results = await session.readTransaction(txc => txc.run(`${query} SKIP ${skip} LIMIT ${limit}`))
			for (const record of results.records) {
				const g = record.get('g')
				for (const i of search) {
					const val = toNumber(g.properties[i])
					if (val!==undefined) entries[i].add(val)
				}
			}
			skip = skip + limit	
		}
		for (const i of search) {
			entries[i] = Array.from(entries[i])
		}
		return entries
	}
	
  } catch (e) {
    console.error(e)
  }
}

export const fetch_kg_schema = async () => {
	let schema:UISchema 
	if (process.env.NEXT_PUBLIC_SCHEMA) {
		const r = await fetch(`${process.env.NEXT_PUBLIC_SCHEMA}`, { next: { revalidate: process.env.NODE_ENV === 'development'? 0: 3600 } })
		if (!r.ok) {
			throw new Error(`Error communicating with ${process.env.NEXT_PUBLIC_SCHEMA}`)
		}
		schema = await r.json()
	}
	
	return schema
  }


export const initialize_kg = async () => {
	const entries = {}
	const palettes = {}
	const nodes = {}
	const edges = []
	let default_relations = []
	let schema = await fetch_kg_schema()
	const tooltip_templates_node = {}
  	const tooltip_templates_edges = {}
  
  
	for (const i of schema.nodes) {
		tooltip_templates_node[i.node] = i.display
		const {node} = i
		// const results = await get_terms(node, search)
		// entries[node] = results
		nodes[node] = i
		// const {name, main, light, dark, contrastText} = palette
		// palettes[name] = {
		// main,
		// light: light || Color(main).lighten(0.25).hex(),
		// dark: dark || Color(main).darken(0.25).hex(),
		// contrastText: contrastText || "#000"
		// }
	}

  let geneLinksRelations = []
  for (const i of schema.edges) {
	for (const e of i.match) {
		tooltip_templates_edges[e] = i.display
	  }
	if (!i["gene_link"]) {
		for (const e of i.match) {
			if (edges.indexOf(e) === -1) edges.push(e)
		}
		if (i.selected) {
		  default_relations = [...default_relations,  ...(i.match || [])]
		}
	} else {
		geneLinksRelations = [...geneLinksRelations, ...i.match]
	}
  }
  

  
  return {
  	    entries,
        nodes,
        schema,
        palettes,
        edges: edges.sort(function(a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		 }),
		tooltip_templates_node,
		tooltip_templates_edges,
        default_relations,
		geneLinksRelations
	}
}

export const initialize_enrichment = async () => {
	const schema = await fetch_kg_schema()
	const icon_picker = {}
	for (const i of schema.header.subheader) {
		icon_picker[i.label] = i.props["libraries"].map((j:{library:string})=>j.library)
	}
	return {
		icon_picker
	}
}
export const init_function = {
	initialize_kg,
	initialize_enrichment
}