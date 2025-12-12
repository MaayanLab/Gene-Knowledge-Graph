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
    id: z.string().or(z.number()),
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
        const {type, id} = query_schema.parse(convert_query(req))
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        if (node_properties[type] === undefined) {
            return NextResponse.json({ error: `Invalid node: ${type}` }, { status: 400 })
        }
        const node_query = `MATCH (a:${type})-[r]-(b) WHERE a.id = $id RETURN distinct(labels(b)) as nodes`
        const edge_query = `MATCH (a:${type})-[r]-(b) WHERE a.id = $id RETURN distinct(type(r)) as rel`
        console.log(node_query)
        const node_results = await session.readTransaction(txc => txc.run(node_query, {id}))
        const edge_results = await session.readTransaction(txc => txc.run(edge_query, {id}))
        const records: {nodes: String[], edges:String[]} = {nodes:[], edges:[]}
        for (const record of node_results.records) {
            const nodes = record.get('nodes')
            records.nodes = [...records.nodes, ...nodes]
        }
        for (const record of edge_results.records) {
            const rel = record.get('rel')
            records.edges.push(rel)
        }
        return NextResponse.json(records, { status: 200 })
    } catch (error) {
        return NextResponse.json(error, { status: 400 })
    }
     
}