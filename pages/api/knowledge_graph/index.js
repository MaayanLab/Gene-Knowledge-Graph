import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import Color from 'color'
import { fetch_kg_schema } from "../../../utils/initialize"
import * as default_schema from "../../../public/schema.json"

let schema = null
let color_map = {}
let aggr_scores = null
let score_fields
let colors
const get_color = ({color, darken}) => {
	if (!color_map[color]) color_map[color] = Color(color)

	if (darken) return color_map[color].darken((darken)*0.65).hex()
	else return color_map[color].hex()
}

const default_color = '#48ACF0'
const highlight_color = '#F8333C'
const default_edge_color = '#e0e0e0'

const get_node_color_and_type = ({node, terms, color=default_color, record, field, aggr_field}) => {
	if (terms.indexOf(node.properties.label) > -1) {
		return {color: highlight_color, node_type: 1}
	} else if (node.properties[field] && aggr_field!==undefined) {
		const aggr_score = aggr_scores[aggr_field]
		return {
			color: get_color({color, darken: 1-Math.abs(node.properties[field]/aggr_score)}),
			node_type: 0
		}
	}
	return {
		color: get_color({color}),
		node_type: 0
	}		
}

const get_edge_color = ({relation, color, record, aggr_field, field}) => {
	if (relation.properties[field] && aggr_field) {
		const aggr_score = aggr_scores[aggr_field]
		return {
			lineColor: get_color({color, darken: Math.abs(relation.properties[field]/aggr_score)}),
			node_type: 0
		}
	}
	return {
		lineColor: color
	}
}

const resolve_results = ({results, start_term, end_term, term, colors}) => (
	results.records.flatMap(record => {
		const relations = record.get('r')
		const nodes = record.get('n').reduce((acc, i)=>({
			...acc,
			[i.identity]: i
		}), {})
		const path = []
		for (const relation of relations) {
			const start_node = nodes[relation.start]
			const end_node = nodes[relation.end]
			const relation_type = relation.type
			const start_type = start_node.labels.filter(i=>i!=="id")[0]
			const end_type = end_node.labels.filter(i=>i!=="id")[0]
			path.push({ 
				data: {
					id: start_node.properties.id,
					kind: start_type,
					label: start_node.properties.label || start_node.properties.id,
					properties: start_node.properties,
					...(get_node_color_and_type({node: start_node, terms: [start_term, end_term, term], record,
						 ...colors[start_type]}))
				} 
			})
			path.push({ 
				data: {
					source: start_node.properties.id,
					target: end_node.properties.id,
					kind: "Relation",
					relation: relation_type,
					label: relation_type,
					properties: {
						id: `${start_node.properties.label}_${relation_type}_${end_node.properties.label}`,
						label: relation_type,
						source_label: start_node.properties.label,
						target_label: end_node.properties.label,
						...relation.properties,
					},
					...(get_edge_color({relation, record, ...colors[relation_type]})),
					directed: relation.properties.directed ? 'triangle': 'none'
				} 
			})
			path.push({ 
				data: {
					id: end_node.properties.id,
					kind: end_type,
					label: end_node.properties.label || end_node.properties.id,
					properties: end_node.properties,
					...(get_node_color_and_type({node: end_node, terms: [start_term, end_term, term], record,
						...colors[end_type]}))
				} 
			})
		}
		return path
	  })
)

const aggregates = async ({session, schema}) => {
	if (aggr_scores === null) {
		score_fields = []	
		colors = {}
		let edge_query = ""
		const edge_aggr = []
		for (const s of schema.edges) {
			
			for (const i of (s.match || [])) {
				colors[i] = {
					color: (s.palette || {}).main || default_edge_color,
				}
			}
			if (s.order) {
				const [field, order] = s.order
				const order_pref = order === "DESC" ? 'max': 'min'
				// const q = `WITH ${score_fields.join(", ")}${score_fields.length > 0 ? ",": ""}
				// 		${order_pref}(rel.${field}) as ${order_pref}_${field}`
				edge_aggr.push(`${order_pref}(rel.${field}) as ${order_pref}_${field}`)
				score_fields.push(`${order_pref}_${field}`)
				for (const i of (s.match || [])) {
					colors[i].aggr_field = `${order_pref}_${field}`
					colors[i].field = field
				}
			}
		}
		if (edge_aggr.length > 0) {
			edge_query = `MATCH (st)-[rel]-(en) WITH ${edge_aggr.join(", ")}`
		}

		let node_query = ""
		const node_aggr = []
		for (const s of schema.nodes) {
			colors[s.node] = {
				color: (s.palette || {}).main || default_edge_color,
			}
			if (s.order) {
				const [field, order] = s.order
				const order_pref = order === "DESC" ? 'max': 'min'
				const q = `MATCH (st)
						WITH ${score_fields.join(", ")}${score_fields.length > 0 ? ",": ""}
						${order_pref}(st.${field}) as ${order_pref}_${field}`
				node_aggr.push(`${order_pref}(rel.${field}) as ${order_pref}_${field}`)
				score_fields.push(`${order_pref}_${field}`)
						
				colors[i].aggr_field = `${order_pref}_${field}`
				colors[i].field = field
			}
		}

		if (node_aggr.length > 0) {
			node_query = `MATCH (st) WITH ${score_fields.join(", ")}${score_fields.length > 0 ? ",": ""} ${node_aggr.join(", ")}`
		}
		aggr_scores = {}
		if (score_fields.length > 0) {
			const query = `${[edge_query, node_query].join("\t")} RETURN *`
			const results = await session.readTransaction(txc => txc.run(query))
			
			results.records.flatMap(record => {
				for (const i of score_fields) {
					const score = record.get(i)
					aggr_scores[i] = score
				}
			})
		}
	} else {
		console.log("Aggregate score is already cached!")
	}
}

const resolve_two_terms = async ({session, start_term, start_field, start, end_term, end_field, end, limit, order, schema, relation}) => {
	await aggregates({session, schema})
	let query = `MATCH p=(a: \`${start}\` {${start_field}: $start_term})-[*1..4]-(b: \`${end}\` {${end_field}: $end_term})
		USING INDEX a:\`${start}\`(${start_field})
		USING INDEX b:\`${end}\`(${end_field})
		WITH nodes(p) as n, relationships(p) as r
		RETURN * LIMIT ${limit}`
	if (relation) query = query.replace("[*1..4]",`:\`${relation}\`[*1..4]`)
	
	// if (score_fields.length) query = query + `, ${score_fields.join(", ")}`
	// query = `${query} RETURN * ORDER BY rand() LIMIT ${limit}`
	const results = await session.readTransaction(txc => txc.run(query, { start_term, end_term }))
	return resolve_results({results, start_term, end_term, schema, order, score_fields, colors})
}

const resolve_one_term = async ({session, start, field, term, relation, limit, order, schema}) => {
	await aggregates({session, schema})
	let query = `
		MATCH p=(st:\`${start}\` { ${field}: $term })-[rel]-(en)
		USING INDEX st:\`${start}\`(${field})
		WITH nodes(p) as n, relationships(p) as r
		RETURN * LIMIT ${limit}
		`
	if (relation) query = query.replace("[rel]",`:[rel:\`${relation}\`]`)
	console.log(query)
	// if (score_fields.length) query = query + `, ${score_fields.join(", ")}`

	const results = await session.readTransaction(txc => txc.run(query, { term }))
	return resolve_results({results, term, schema, order, score_fields, colors})
}

export default async function query(req, res) {
  const { start, start_field="label", start_term, end, end_field="label", end_term, relation, limit=25, order } = await req.query
  if (!schema) {
	schema = default_schema
	if (process.env.NEXT_PUBLIC_SCHEMA) {
	  schema = await fetch_kg_schema()
	}
  }
  const nodes = schema.nodes.map(i=>i.node)
  if (nodes.indexOf(start) < 0) res.status(400).send("Invalid start node")
  else if (end && nodes.indexOf(end) < 0) res.status(400).send("Invalid end node")
  else { 
  	try {
		const session = neo4jDriver.session({
			defaultAccessMode: neo4j.session.READ
		})
		try {
			if (start && end && start_term && end_term) {
				const results = await resolve_two_terms({session, start_term, start_field, start, end_term, end_field, end, relation, limit, schema, order})
				res.status(200).send(results)
			} else if (start) {
				const results = await resolve_one_term({session, start, field: start_field, term: start_term, relation, limit, schema, order})
				res.status(200).send(results)
			} else {
				res.status(400).send("Invalid input")
			}
		  } catch (e) {
			res.status(400).send(e.message)
		  } finally {
			session.close()
		  }
		} catch (e) {
			res.status(400).send(e.message)
		}
	}
}
