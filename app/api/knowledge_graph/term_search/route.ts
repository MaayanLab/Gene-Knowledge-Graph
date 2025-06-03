import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import {process_properties} from "@/utils/helper"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { z } from "zod"
import { zu } from 'zod_utilz'
import { convert_query } from "@/utils/helper"
import { fetch_kg_schema } from "@/utils/initialize"
const query_schema = z.object({
    term: z.optional(z.string().or(z.number())),
    limit: z.optional(z.number()),
})
// This function returns a gene list based on a search term
/**
 * @swagger
 * /api/knowledge_graph/term_search:
 *   get:
 *     description: Full text search of neo4j nodes for matching terms
 *     tags:
 *       - term search
 *     parameters:
 *       - name: term
 *         in: query
 *       - name: limit
 *         type: integer
 *         in: query
 *     responses:
 *       200:
 *         description: List of nodes
 */
export async function GET(req: NextRequest) {
    try {
        const node_properties = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/knowledge_graph/search_properties`)).json()
        const {term, limit=5} = query_schema.parse(convert_query(req))
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        const {nodes} = await fetch_kg_schema()
        const q = nodes.map(({node})=>{
            if (term) {
                return  `MATCH (a:\`${node}\`) WHERE a.label  =~ $term RETURN a LIMIT TOINTEGER($limit)`
            } else {
                return  `MATCH (a:\`${node}\`) RETURN a LIMIT TOINTEGER($limit)`
            }
        })
        const query = q.join(" UNION ")
        console.log(query)
        const results = await session.readTransaction(txc => txc.run(query, {limit, term: `(?i).*${term}.*`}))
        const records = {}
        for (const record of results.records) {
            const a = record.get('a')
            const value = a.properties.label
            const node_type = a.labels[a.labels.length-1]
            if (value) records[node_type +": " + value] = {
                ...process_properties(a.properties),
                node_type,
            }
        }
        return NextResponse.json(records, { status: 200 })
    } catch (error) {
        return NextResponse.json(error, { status: 400 })
    }
     
}