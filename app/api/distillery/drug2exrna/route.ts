import { resolve_results } from "../../knowledge_graph/helper";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from 'zod';
import { initialize } from "../../initialize/helper";
async function process_query({
    term,
    limit,
    aggr_scores,
    colors,
    field,
    }: {
        term: string,
        limit: number,
        aggr_scores?: {[key:string]: {max: number, min: number}},
        colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
        field: string,
    }) {

    const query = `MATCH q=(a:Compound {${field}: $term})-[r1: \`positively_regulates\`]-(b: Gene)
            WITH q, a, r1, b
            ORDER BY r1.evidence DESC 
            CALL {
                WITH q, a, r1, b
                MATCH p=(a)-[r1]-(b)-[r2: overlaps]-(c: \`exRNA Loci\`)-[r3: \`correlated_in\`]-(d:Biofluid)-[r4:predicted_in]-(e)-[r5:molecularly_interacts_with]-(f)
                RETURN p, nodes(p) as n, relationships(p) as r LIMIT 1
            }
            RETURN p, nodes(p) as n, relationships(p) as r
            LIMIT 10
    `
    const query_params = { term, limit }
    return resolve_results({query, query_params, terms: [term],  aggr_scores, colors, fields: [field]})
}

const InputSchema = z.object({
    start_term: z.string(),
    limit: z.number().optional(),
    start_field: z.string().optional(),
})
/**
 * @swagger
 * /api/distillery/drug2exrna:
 *   get:
 *     description: Performs liquid biopsy of drug response
 *     tags:
 *       - distillery apps
 *     parameters:
 *       - name: filter
 *         in: query
 *         required: true
 *         content:
 *            application/json:
 *              schema: 			
 *                type: object
 *                required:
 *                  - start_term
 *                properties:
 *                  start_field:
 *                    type: string
 *                  start_term:
 *                    type: string
 *                  limit:
 *                    type: integer
 *                    default: 5
 *     responses:
 *       200:
 *         description: Subnetwork
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       data:
 *                         type: object
 *                 edges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       data:
 *                         type: object
 */
export async function GET(req: NextRequest) {
    try {
        const filter = req.nextUrl.searchParams.get("filter")
        if (!filter) return NextResponse.json({error: "No filter inputted"}, {status: 400})
        const f = JSON.parse(filter)
        if (f.limit && !isNaN(f.limit) && typeof f.limit === 'string') f.limit = parseInt(f.limit)
        const { start_term, limit=10, start_field="label" } = InputSchema.parse(f)
        
        const {aggr_scores, colors} = await initialize()
        
        if (start_term === undefined) return NextResponse.json({error: "No term inputted"}, {status: 400})
        else { 
            try {
                const results = await process_query({term:start_term, limit, aggr_scores, colors, field:start_field })
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
  