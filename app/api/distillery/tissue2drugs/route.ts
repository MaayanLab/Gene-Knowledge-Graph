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
        let q
        if (rel === 'bioactivity') {
            q = `
                MATCH p=(t:\`${type}\` {label: $term})-[rel:expressed_in]-(g:Gene)-[r:is_protein]-(pr:Protein)-[r1:\`${rel}\`]-(a:Compound)
                RETURN p, nodes(p) as n, relationships(p) as r
                ORDER BY rel.evidence_class DESC, r1.evidence ${colors[rel].aggr_type || 'DESC'} 
                LIMIT TOINTEGER($limit)
            `
        } else {
            q = `
                MATCH p=(t:\`${type}\` {label: $term})-[rel:expressed_in]-(g:Gene)-[r1:\`${rel}\`]-(a:Compound)
                RETURN p, nodes(p) as n, relationships(p) as r
                ORDER BY rel.evidence_class DESC, r1.evidence ${colors[rel].aggr_type || 'DESC'} 
                LIMIT TOINTEGER($limit)
            `
        }
        
        queries.push(q)
    }
    const query = queries.join(" UNION ")
    console.log(query, term, limit)
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
/**
 * @swagger
 * /api/distillery/tissue2drugs:
 *   get:
 *     description: Performs tissue2drugs use case
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
 *                  - start
 *                  - start_term
 *                properties:
 *                  start:
 *                    type: string
 *                  start_field:
 *                    type: string
 *                  start_term:
 *                    type: string
 *                  limit:
 *                    type: integer
 *                    default: 5
 *                  relation:
 *                    type: array
 *                    items:
 *                      type: string
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
        const { start, start_term, limit=10, relation=['bioactivity', 'positively_regulates', 'negatively_regulates'], start_field="label" } = InputSchema.parse(f)
        
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
  