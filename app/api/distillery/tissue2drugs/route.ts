import fetch from "node-fetch";
import { resolve_results } from "../../knowledge_graph/helper";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from 'zod';
import { initialize } from "../../initialize/helper";
async function process_query({
    term,
    limit,
    relation,
    aggr_scores,
    colors,
    field,
    type}: {
        term: string,
        limit: number,
        aggr_scores?: {[key:string]: {max: number, min: number}},
        colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
        field: string,
        type: string,
        relation: Array<string>
    }) {
    const queries = []
    for (const rel of relation) {
        const q = `
                MATCH p=(t:\`${type}\` {label: $term})-[rel:expresses]-(g:Gene)-[r1:\`${rel}\`]-(a:Drug)
                RETURN p, nodes(p) as n, relationships(p) as r
                ORDER BY rel.evidence DESC, r1.evidence ${colors[rel].aggr_type} 
                LIMIT TOINTEGER($limit)
            `
            queries.push(q)
    }
    const query = queries.join(" UNION ")
    const query_params = { term, limit }
    return resolve_results({query, query_params, terms: [term],  aggr_scores, colors, fields: [field]})
}

const InputSchema = z.object({
    start: z.string(),
    start_term: z.string(),
    limit: z.number().optional(),
    start_field: z.string().optional(),
    relation: z.array(z.string()).optional()
})
export async function GET(req: NextRequest) {
    try {
        const filter = req.nextUrl.searchParams.get("filter")
        if (!filter) return NextResponse.json({error: "No filter inputted"}, {status: 400})
        const { start, start_term, limit=10, relation=['bioactivity', 'positively regulates', 'negatively regulates'], start_field="label" } = InputSchema.parse(JSON.parse(filter))
        
        const {aggr_scores, colors} = await initialize()
        
        if (start_term === undefined) return NextResponse.json({error: "No term inputted"}, {status: 400})
        else { 
            try {
                const results = await process_query({type:start, term:start_term, limit, relation, aggr_scores, colors, field:start_field })
                fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter/update`)
                return NextResponse.json(results, {status: 200})
            } catch (e) {
                return NextResponse.json(e, {status: 400})
            }
        }
    } catch (e) {
        return NextResponse.json(e, {status: 400})
    }
  }
  