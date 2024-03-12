import { initialize } from "../../initialize/helper";
import { resolve_results } from "../../knowledge_graph/helper";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from 'zod';
async function process_query({
    term, 
    limit, 
    aggr_scores, 
    colors, 
    field 
}: {
    term: string,
    limit: number,
    aggr_scores?: {[key:string]: {max: number, min: number}},
    colors?: {[key:string]: {color?: string, aggr_field?: string, field?: string, aggr_type?: string}},
    field: string
}) {
    const query = `
      MATCH p=(a:Disease {label: $term})-[r1:\`gene associated with disease or phenotype\`]-(b:Gene)-[r2:\`predicted in\`]-(c:\`Body Substance\`)-[r3:\`correlated in\`]-(d:\`ENCODE RBS 150 NO OVERLAP\`)-[r4: overlaps]-(e: Gene)
      RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
      ORDER BY r1.evidence DESC, r2.evidence DESC
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
    try {
        const filter = req.nextUrl.searchParams.get("filter")
        if (!filter) return NextResponse.json({error: "No filter inputted"}, {status: 400})
        const { start_term, limit=10, start_field="label" } = InputSchema.parse(JSON.parse(filter))
        const {aggr_scores, colors} = await initialize()
        if (start_term === undefined) return NextResponse.json({error: "No term inputted"}, {status: 400})
        else { 
            try {
                const results = await process_query({term:start_term, limit, aggr_scores, colors, field:start_field })
                fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter/update`)
                return NextResponse.json(results, {status: 200})
            } catch (e) {
                console.log(e)
                return NextResponse.json(e, {status: 500})
            }
        }
    } catch (error) {
        console.log(error)
        return NextResponse.json(error, {status: 500})
    }
  }
  