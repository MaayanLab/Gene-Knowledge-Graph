import fetch from "node-fetch";
import { resolve_results } from "../../knowledge_graph/helper";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from 'zod';
import { Initialize_Type } from "../../initialize/route";
import { typed_fetch } from "@/utils/helper";
async function process_query({
    term, 
    limit,
    aggr_scores, 
    colors, 
    field }: {
        term: string,
        limit: number,
        aggr_scores?: {[key:string]: {max: number, min: number}},
        colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
        field: string
    }) {
    const query = `
        MATCH p=(a:Disease {${field}: $term})-[r1:\`correlated with condition\`]-(b)-[r2:\`bioactivity\`]-(c:Gene)
        RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
        ORDER BY r1.evidence DESC, r2.evidence DESC
        LIMIT TOINTEGER($limit)
        UNION
        MATCH p=(a:Disease {${field}: $term})-[r1:\`correlated with condition\`]-(b)-[r2:\`bioactivity\`]-(c:Gene)-[r3:\`expresses\`]-(d:Tissue)
        RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
        ORDER BY r1.evidence DESC, r2.evidence DESC, r3.evidence DESC
        LIMIT TOINTEGER($limit)
        UNION
        MATCH p=(a:Disease {${field}: $term})-[r1:\`correlated with condition\`]-(b:Drug)-[r2:\`causally influences\`]-(c:Gene)-[r3:\`bioactivity\`]-(d:Drug)
        RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
        ORDER BY r1.evidence DESC, r2.evidence DESC, r3.evidence DESC
        LIMIT TOINTEGER($limit)
        UNION
        MATCH p=(a:Disease {${field}: $term})-[r1:\`correlated with condition\`]-(b:Drug)-[r2:\`causally influences\`]-(c:Gene)-[r3:\`expresses\`]-(d:Tissue)
        RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
        ORDER BY r1.evidence DESC, r2.evidence DESC, r3.evidence DESC
        LIMIT TOINTEGER($limit)
    `
    const query_params = { term, limit }
    return resolve_results({query, query_params, terms: [term],  aggr_scores, colors, fields: [field]})
}

const InputSchema = z.object({
    start_term: z.string(),
    limit: z.number().optional(),
    start_field: z.string().optional()
})

export async function GET(req: NextRequest) {
    const filter = req.nextUrl.searchParams.get("filter")
    if (!filter) return NextResponse.json({error: "No filter inputted"}, {status: 400})
    const { start_term, limit=10, start_field="label" } = InputSchema.parse(JSON.parse(filter))
        
    const {aggr_scores, colors} = await typed_fetch<Initialize_Type>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/initialize`)
    // const nodes = schema.nodes.map(i=>i.node)
    if (start_term === undefined) return NextResponse.json({error: "No term inputted"}, {status: 400})
    else { 
        try {
            const results = await process_query({term:start_term, limit, aggr_scores, colors, field:start_field })
            fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter/update`)
            return NextResponse.json(results, {status: 200})
        
        } catch (e) {
            return NextResponse.json({error:e.message}, {status: 400})
        }
      }
  }
  