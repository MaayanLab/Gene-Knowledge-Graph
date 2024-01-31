import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import {process_properties} from "@/utils/helper"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'

// This function returns a gene list based on a search term
export async function GET(req: NextRequest) {
    try {
        const node_properties = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/search_properties`)).json()
        const type = req.nextUrl.searchParams.get("type")
        const term = req.nextUrl.searchParams.get("term") || ""
        const field = req.nextUrl.searchParams.get("field") || "label"
        const limit:number = parseInt(req.nextUrl.searchParams.get("limit")) || 100
        const filter = JSON.stringify(JSON.parse(req.nextUrl.searchParams.get("filter") || "{}"))
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        if (node_properties[type] === undefined) {
            return NextResponse.json({ error: `Invalid node: ${type}` }, { status: 400 })
        }
        if (node_properties[type].indexOf(field) === -1) {
            return NextResponse.json({ error: `Invalid field: ${field}` }, { status: 400 })
        }
        let query = `MATCH (a:\`${type}\`${filter ? " "+filter.replace(/"/g, "`"): ""})`
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
        return NextResponse.error()
    }
     
}