import neo4j from "neo4j-driver"
import { neo4jDriver } from "./neo4j"
import fetch from 'isomorphic-unfetch'
import * as default_schema from '../public/schema.json'
import { toNumber } from "./helper"

export async function get_terms(node, search) {
  try {
	console.log(`Connecting to ${process.env.NEO4J_URL}`)
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
		const count_r = await session.readTransaction(txc => txc.run(`MATCH (g: ${node}) RETURN count(g) as count`))
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
					entries[i].add(g.properties[i])
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
	const r = await fetch(process.env.NEXT_PUBLIC_SCHEMA)
	if (!r.ok) {
		throw new Error(`Error communicating with ${process.env.NEXT_PUBLIC_SCHEMA}`)
	}
	return await r.json()
  }
export const fetch_schema = async () => {
	let schema = default_schema
	if (process.env.NEXT_PUBLIC_SCHEMA) {
		schema = await fetch_kg_schema()
	}
	return schema
}