import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import {process_properties} from "@/utils/helper"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { z } from "zod"
import { zu } from 'zod_utilz'
import { convert_query } from "@/utils/helper"

const query_schema = z.object({
    type: z.string(),
    field: z.optional(z.string()),
    term: z.optional(z.string().or(z.number())),
    limit: z.optional(z.number()),
    filter: z.optional(zu.stringToJSON())
})
// This function returns a gene list based on a search term
/**
 * @swagger
 * /api/knowledge_graph/node_search:
 *   get:
 *     description: Full text search of neo4j nodes for matching terms
 *     tags:
 *       - term search
 *     parameters:
 *       - name: type
 *         in: query
 *         required: true
 *       - name: field
 *         in: query
 *       - name: term
 *         in: query
 *       - name: limit
 *         type: integer
 *         in: query
 *       - name: filter
 *         in: query
 *         content:
 *            application/json:
 *              schema: 			
 *                type: object
 *     responses:
 *       200:
 *         description: UI Schema
 */
export async function GET(req: NextRequest) {
    try {
        const node_properties = await (await fetch(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/knowledge_graph/search_properties`)).json()
        const {type, field="label", term, limit=100, filter={}} = query_schema.parse(convert_query(req))
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        if (node_properties[type] === undefined) {
            return NextResponse.json({ error: `Invalid node: ${type}` }, { status: 400 })
        }
        if (node_properties[type].indexOf(field) === -1) {
            return NextResponse.json({ error: `Invalid field: ${field}` }, { status: 400 })
        }
        let query = `MATCH (a:\`${type}\`${filter ? " "+JSON.stringify(filter).replace(/"/g, "`"): ""})`
        // if (enzyme && enzyme.toLowerCase() === 'true') query = `MATCH (a:Gene ${filter})`
        if (term) {
            query = query + ` WHERE a.${field} =~ $term`

        }
        query = query + "  RETURN a LIMIT TOINTEGER($limit)"
        const results = await session.readTransaction(txc => txc.run(query, {limit, term: `(?i).*${term}.*`}))
        const records = {}
        for (const record of results.records) {
            const a = record.get('a')
            const value = a.properties[field]
            if (value) records[value] = process_properties(a.properties)
        }
        return NextResponse.json(records, { status: 200 })
    } catch (error) {
        return NextResponse.json(error, { status: 400 })
    }
     
}