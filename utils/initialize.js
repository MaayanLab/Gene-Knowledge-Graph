import neo4j from "neo4j-driver"
import { neo4jDriver } from "./neo4j"
import fetch from 'isomorphic-unfetch'

export default async function get_terms(node) {
  try {
    const session = neo4jDriver.session({
      defaultAccessMode: neo4j.session.READ
    })
	let query = `MATCH (g: ${node}) RETURN *`
	if (process.env.NODE_ENV==="development") {
		console.log("Dev mode")
		query = `${query} LIMIT 500`
	}
    const results = await session.readTransaction(txc => txc.run(query))
	const entries = results.records.reduce((acc, record) => {
	const g = record.get('g')
		return {...acc, [g.properties.label]: g.properties}
	}, {})
	return entries
  } catch (e) {
    console.error(e)
  }
}

export const fetch_schema = async () => {
	const r = await fetch(process.env.NEXT_PUBLIC_SCHEMA)
	if (!r.ok) {
		throw new Error(`Error communicating with ${process.env.NEXT_PUBLIC_SCHEMA}`)
	}
	return await r.json()
}