import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import Color from 'color'
import { fetch_kg_schema } from "../../../utils/initialize"
import { toNumber } from "../../../utils/helper"
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

const get_node_color_and_type = ({node, terms, color=default_color, record, field, aggr_field, fields}) => {
	// if(terms.indexOf(node.properties.label) > -1){
	if (fields.filter(i=>i && terms.indexOf(node.properties[i]) > -1).length > 0) {
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
const process_properties = (properties) => {
	const props = {}
	for ( const[k,v] of Object.entries(properties)) {
		if (typeof v === "object") {
			props[k] = toNumber(v)
		} else {
			props[k] = v
		}
	}
	return props
}

const resolve_results = ({results, terms, colors, field, start_field, end_field}) => (
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
					properties: process_properties(start_node.properties),
					...(get_node_color_and_type({node: start_node, terms, record, fields: [field, start_field, end_field],
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
						...process_properties(relation.properties),
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
					properties: process_properties(end_node.properties),
					...(get_node_color_and_type({node: end_node, terms, record, fields: [field, start_field, end_field],
						...colors[end_type]}))
				} 
			})
		}
		return path
	  })
)

const aggregates = async ({session, schema}) => {
	try {
		if (aggr_scores === null) {
			aggr_scores = {}
			score_fields = []	
			colors = {}
			for (const s of schema.edges) {	
				for (const i of (s.match || [])) {
					colors[i] = {
						color: (s.palette || {}).main || default_edge_color,
					}
				}
				if (s.order) {
					const [field, order] = s.order
					let query
					let score_var
					if (order === "DESC") {
						const order_pref = 'max'
						score_var = `${order_pref}_${field}`
						query = `MATCH (st)-[rel]-(en)
							WHERE rel.${field} IS NOT NULL 
							RETURN ${order_pref}(rel.${field}) as ${score_var}`	
					} else {
						const order_pref = 'min'
						score_var = `${order_pref}_${field}`
						query = `MATCH (st)-[rel]-(en)
							RETURN ${order_pref}(rel.${field}) as ${score_var}`
					}
					console.log(query)
					const results = await session.readTransaction(txc => txc.run(query))
					results.records.flatMap(record => {
						const score = record.get(score_var)
						aggr_scores[score_var] = score
					})
					for (const j of (s.match || [])) {
						colors[j].aggr_field = score_var
						colors[j].field = field
					}
				}
			}
			for (const s of schema.nodes) {
				colors[s.node] = {
					color: (s.palette || {}).main || default_edge_color,
				}
				if (s.order) {
					const [field, order] = s.order
					let query
					let score_var
					if (order === "DESC") {
						const order_pref = 'max'
						score_var = `${order_pref}_${field}`
						query = `MATCH (st)
							WHERE st.${field} IS NOT NULL 
							RETURN ${order_pref}(st.${field}) as ${score_var}`	
					} else {
						const order_pref = 'min'
						score_var = `${order_pref}_${field}`
						query = `MATCH (st)
							RETURN ${order_pref}(st.${field}) as ${score_var}`
					}
					const results = await session.readTransaction(txc => txc.run(query))
					results.records.flatMap(record => {
						const score = record.get(score_var)
						aggr_scores[score_var] = score
					})
					
					colors[s.node].aggr_field = score_var
					colors[s.node].field = field
				}
			}
			console.log(aggr_scores)
		} else {
			console.log(aggr_scores)
			console.log("Aggregate score is already cached!")
		}	
	} catch (error) {
		aggr_scores = null
	}
}


const resolve_two_terms = async ({session, start_term, start_field, start, end_term, end_field, end, limit, order, path_length=4, schema, relation}) => {
	await aggregates({session, schema})
	if (!parseInt(path_length)) throw {message: "Path length is not a number"}
	let query = `MATCH p=(a: \`${start}\` {${start_field}: $start_term})-[*${path_length}]-(b: \`${end}\` {${end_field}: $end_term})
		USING INDEX a:\`${start}\`(${start_field})
		USING INDEX b:\`${end}\`(${end_field})
		WITH nodes(p) as n, relationships(p) as r
		RETURN * LIMIT TOINTEGER($limit)`
		
	if (relation) {
		const edges = schema.edges.reduce((acc, i)=>([
			...acc,
			...i.match
		  ]), [])
		for (const i of relation.split(",")) {
			if (edges.indexOf(i) === -1) throw {message: "Invalid relationship"}
		}
		const rels = relation.split(",").map(i=>`\`${i}\``).join("|")
		query = query.replace(`[*${path_length}]`,`[:${rels}*${path_length}]`)
		// query = `MATCH p=(a: \`${start}\` {${start_field}: $start_term})-[:${rels}]-()-[]-()-[:${rels}]-(b: \`${end}\` {${end_field}: $end_term})
		// USING INDEX a:\`${start}\`(${start_field})
		// USING INDEX b:\`${end}\`(${end_field})
		// WITH nodes(p) as n, relationships(p) as r
		// RETURN * LIMIT ${limit}`
	} 
	
	// if (score_fields.length) query = query + `, ${score_fields.join(", ")}`
	// query = `${query} RETURN * ORDER BY rand() LIMIT ${limit}`
	const results = await session.readTransaction(txc => txc.run(query, { start_term, end_term, limit }))
	return resolve_results({results, terms: [start_term, end_term], schema, order, score_fields, colors, start_field, end_field})
}

const resolve_one_term = async ({session, start, field, term, relation, limit, order, path_length=1, schema}) => {
	if (!parseInt(path_length)) throw {message: "Path length is not a number"}
	await aggregates({session, schema})
	let query = `
		MATCH p=(st:\`${start}\` { ${field}: $term })-[*${path_length}]-(en)
		USING INDEX st:\`${start}\`(${field})
		WITH nodes(p) as n, relationships(p) as r
		RETURN * LIMIT TOINTEGER($limit)
		`
	if (relation) {
		const edges = schema.edges.reduce((acc, i)=>([
			...acc,
			...i.match
		  ]), [])
		for (const i of relation.split(",")) {
			if (edges.indexOf(i) === -1) throw {message: "Invalid relationship"}
		}
		const rels = relation.split(",").map(i=>`\`${i}\``).join("|")
		query = query.replace(`[*${path_length}]`,`[:${rels}*${path_length}]`)
	}

	const results = await session.readTransaction(txc => txc.run(query, { term, limit }))
	return resolve_results({results, terms: [term], schema, order, score_fields, colors, field})
}

export default async function query(req, res) {
  const { start, start_field="label", start_term, end, end_field="label", end_term, relation, limit=25, path_length, order } = await req.query
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
				const results = await resolve_two_terms({session, start_term, start_field, start, end_term, end_field, end, relation, limit, path_length, schema, order})
				res.status(200).send(results)
			} else if (start) {
				const results = await resolve_one_term({session, start, field: start_field, term: start_term, relation, limit, path_length, schema, order})
				res.status(200).send(results)
			} else {
				res.status(400).send("Invalid input")
			}
		  } catch (e) {
			console.log(e)
			res.status(400).send(e.message)
		  } finally {
			session.close()
		  }
		} catch (e) {
			res.status(400).send(e.message)
		}
	}
}
