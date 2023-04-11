import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import { toNumber } from "../../../utils/helper"
import fetch from "node-fetch"

const resolve_one_term = async ({session, start, field, term, relation, limit, order, path_length=1, schema, aggr_scores, colors, expand: e, remove}) => {
	if (!parseInt(path_length)) throw {message: "Path length is not a number"}
	let query = `
		MATCH p=(st:\`${start}\` { ${field}: $term })-[*${path_length}]-(en)
		USING INDEX st:\`${start}\`(${field})
		WITH p, st, en
		`
	if (relation) {
		const edges = schema.edges.reduce((acc, i)=>([
			...acc,
			...i.match
		  ]), [])
		for (const i of relation.split(",")) {
			if (edges.indexOf(i) === -1) throw {message: `Invalid relationship ${i}`}
		}
		const rels = relation.split(",").map(i=>`\`${i}\``).join("|")
		query = query.replace(`[*${path_length}]`,`[:${rels}*${path_length}]`)
	}
	const vars = {}
	if ((remove || []).length) {
		for (const ind in remove) {
			vars[`remove_${ind}`] = remove[ind]
			if (ind === "0") {
				query = query + `
					WHERE NOT st.id = $remove_${ind}
					AND NOT en.id = $remove_${ind}
				`
			}
			else {
				query = query + `
					AND NOT st.id = $remove_${ind}
					AND NOT en.id = $remove_${ind}
				`
			}
		}
	}
	query = query + `RETURN COUNT(p) as count`
	const results = await session.readTransaction(txc => txc.run(query, { term, limit, ...vars }))
	const res = results.records.flatMap(record => {
		return {count: toNumber(record.get('count'))}
	  })
	return res
}

export default async function query(req, res) {
  const { start, start_field="label", start_term, end, end_field="label", end_term, relation, limit=25, path_length, order, remove, expand } = await req.query
  const schema = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/schema`)).json()
  const {aggr_scores, colors} = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/aggregate`)).json()
  const nodes = schema.nodes.map(i=>i.node)
  if (nodes.indexOf(start) < 0) res.status(400).send("Invalid start node")
  else if (end && nodes.indexOf(end) < 0) res.status(400).send("Invalid end node")
  else { 
  	try {
		const session = neo4jDriver.session({
			defaultAccessMode: neo4j.session.READ
		})
		try {
			if (start && !end) {
				const results = await resolve_one_term({session, start, field: start_field, term: start_term, relation, limit, path_length, schema, order, aggr_scores, colors, remove: remove ?  JSON.parse(remove): [], expand: expand ? JSON.parse(expand) : []})
				// fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter/update`)
				res.status(200).send(results)
			} else {
				res.status(400).send("Invalid input")
			}
		  } catch (e) {
			console.log(e.message)
			res.status(400).send(e.message)
		  } finally {
			session.close()
		  }
		} catch (e) {
			res.status(400).send(e.message)
		}
	}
}
