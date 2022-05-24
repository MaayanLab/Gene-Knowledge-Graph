import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import Color from 'color'
import { fetch_schema } from "../../../utils/initialize"

let schema = null
let color_map = null
const get_color_map = ({node, darken}) => {
	if (!color_map) {
		const c = schema.nodes.reduce((acc, it)=>({
			...acc,
			[it.node]: Color(it.node_color)
		}), {})
		color_map = c
	}
	if (darken) return color_map[node].darken((darken)*0.65).hex()
	else return color_map[node].hex()
}

const default_color = '#48ACF0'
const highlight_color = '#F8333C'
const edge_color = Color('#e0e0e0')

const get_node_color_and_type = ({node, label, schema, order, max_scores, terms}) => {
	if (terms.indexOf(node.properties.label) > -1) {
		return {color: highlight_color, node_type: 1}
	} else if (schema){
		if (order) {
			const {on, field} = schema[order]
			if (on === "node" && node.properties[field[0]]) {
				return {
					color: get_color_map({node: label, darken: 1-(node.properties[field[0]]/max_scores[`max_${field[0]}`])}),
					node_type: 0
				}
			}
		}
		for (const [k, {on, field}] of Object.entries(schema.order)) {
			if (on === "node" && node.properties[field[0]]) {
				return {
					color: get_color_map({node: label, darken: 1-(node.properties[field[0]]/max_scores[`max_${field[0]}`])}),
					node_type: 0
				}
			} 
		}
		return {
			color: get_color_map({node: label}),
			node_type: 0
		}
	} else {
		return {
			color: get_color_map({node: label}),
			node_type: 0
		}
	}				
}

const get_edge_color = ({relation, schema, order, max_scores}) => {
	const {on, field} = schema.order[order]
	if (on === "edge") {
		return {
			lineColor: edge_color.darken((relation.properties[field[0]]/max_scores[`max_${field[0]}`])*0.8).hex()
		}
	}
	return {
		lineColor: edge_color.hex()
	}
}

const resolve_results = ({results, start_term, end_term, term, schema, order, score_fields=[]}) => (
	results.records.flatMap(record => {
		const relations = record.get('r')
		const nodes = record.get('n').reduce((acc, i)=>({
			...acc,
			[i.identity]: i
		}), {})
		const path = []
		const max_scores = score_fields.reduce((acc, it)=>({
			...acc,
			[it]: record.get(it)
		}),{})
		
		for (const relation of relations) {
			const start_node = nodes[relation.start]
			const end_node = nodes[relation.end]
			const relation_type = relation.type
			const start_label = start_node.labels.filter(i=>i!=="id")[0]
			const end_label = end_node.labels.filter(i=>i!=="id")[0]
			path.push({ 
				data: {
					id: start_node.properties.id,
					kind: start_label,
					// weight: (start_node.properties.label === start_term || start_node.properties.label === end_term || start_node.properties.label === term) ? 100 : 50,
					label: start_node.properties.label || start_node.properties.id,
					properties: start_node.properties,
					...(get_node_color_and_type({node: start_node, label: start_label, schema, max_scores, terms: [start_term, end_term, term]}))
				} 
			})
			path.push({ 
				data: {
					source: start_node.properties.id,
					target: end_node.properties.id,
					label: relation_type,
					properties: {
						source_label: start_node.properties.label,
						target_label: end_node.properties.label,
						...relation.properties,
					},
					...(get_edge_color({relation, schema, order, max_scores}))
				} 
			})
			path.push({ 
				data: {
					id: end_node.properties.id,
					kind: end_label,
					label: end_node.properties.label || end_node.properties.id,
					properties: end_node.properties,
					...(get_node_color_and_type({node: end_node, label: end_label, order: schema.order, max_scores, terms: [start_term, end_term, term]}))
				} 
			})
		}
		return path
	  })
)

const resolve_two_terms = async ({session, start_term, start, end_term, end, limit, order, schema}) => {
	const score_fields = []	
	const ordering = Object.entries(schema.order).map(([key, {on, field}])=> {
		if (on === "edge") {
			const q = `MATCH (st)-[rel]-(en)
				WITH ${score_fields.join(", ")}${score_fields.length > 0 ? ",": ""}
				max(rel.${field[0]}) as max_${field[0]}`
			score_fields.push(`max_${field[0]}`)
			return q
		} else if (on === "node") {
			const q = `MATCH (st)
				WITH ${score_fields.join(", ")}${score_fields.length > 0 ? ",": ""}
				max(st.${field[0]}) as max_${field[0]}`
			score_fields.push(`max_${field[0]}`)
			return (q)
		}
	})
	let query = `${ordering.join("\n")}
		MATCH p=(a: ${start} {label: $start_term})-[*1..4]-(b: ${end} {label: $end_term})
		`

	if (order) {
		const {on, field} = schema.order[order]
		if (on === "edge") {
			query = `${query}
				WITH nodes(p) as n, relationships(p) as r, 
				reduce(acc=0, i in relationships(p) | acc + COALESCE(i.${field[0]}, 0))/length(p) as score,
				${score_fields.join(", ")}
				RETURN *
				LIMIT ${limit}
			`
		} else {
			query = `${query}
				WITH nodes(p) as n, relationships(p) as r, 
				reduce(acc=0, i in nodes(p) | acc + COALESCE(i.${field[0]}, 0))/length(p) as score,
				${score_fields.join(", ")}
				RETURN *
				LIMIT ${limit}
			`
		}
	} else {
		query = `${query} 
			WITH a, b, nodes(p) as n, relationships(p) as r, ${score_fields.join(", ")}
			LIMIT ${limit}
		`
	}
	const results = await session.readTransaction(txc => txc.run(query, { start_term, end_term }))
	
	return resolve_results({results, start_term, end_term, order, score_fields, schema})
}

const resolve_one_term = async ({session, start, term, limit, order, schema}) => {
	const score_fields = []	
	const ordering = Object.entries(schema.order).map(([key, {on, field}])=> {
		if (on === "edge") {
			const q = `MATCH (st)-[rel]-(en)
				WITH ${score_fields.join(", ")}${score_fields.length > 0 ? ",": ""}
				max(rel.${field[0]}) as max_${field[0]}`
			score_fields.push(`max_${field[0]}`)
			return q
		} else if (on === "node") {
			const q = `MATCH (st)
				WITH ${score_fields.join(", ")}${score_fields.length > 0 ? ",": ""}
				max(st.${field[0]}) as max_${field[0]}`
			score_fields.push(`max_${field[0]}`)
			return (q)
		}
	})
	let query = `${ordering.join("\n")}
		MATCH p=(st:${start} { label: $term })-[r1]-(it)-[r2]-(en)
		WITH nodes(p) as n, relationships(p) as r, ${score_fields.join(", ")}`
	
	if (order) {
		const {on, field} = schema.order[order]
		if (on === "edge") {
			query = `${query},
				reduce(acc=0, i in relationships(p) | acc + COALESCE(i.${field[0]}, 0))/length(p) as score
				RETURN *
				ORDER BY score ${field[1]} 
			`
		} else {
			query = `${query},
				reduce(acc=0, i in nodes(p) | acc + COALESCE(i.${field[0]}, 0))/length(p) as score
				RETURN *
				ORDER BY score ${field[1]} 
			`
		}
	}
	query = query +  `LIMIT ${limit}`
	const results = await session.readTransaction(txc => txc.run(query, { term }))
	return resolve_results({results, term, schema, order, score_fields})
}

export default async function query(req, res) {
  const { start, start_term, end, end_term, limit=25, order="Confidence_Values" } = await req.query
  if (!schema) schema = await fetch_schema()
  get_color_map({node: start})
  if (color_map[start] === undefined) res.status(400).send("Invalid start node")
  else if (end && color_map[end] === undefined) res.status(400).send("Invalid end node")
  else { 
  	try {
		const session = neo4jDriver.session({
			defaultAccessMode: neo4j.session.READ
		})
		try {
			if (start && end && start_term && end_term) {
				const results = await resolve_two_terms({session, start_term, start, end_term, end, limit, schema, order})
				res.status(200).send(results)
			} else if (start) {
				const results = await resolve_one_term({session, start, term: start_term, limit, schema, order})
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
