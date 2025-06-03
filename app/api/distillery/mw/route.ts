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
    field }: {
        term: string,
        limit: number,
        aggr_scores?: {[key:string]: {max: number, min: number}},
        colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
        field: string
    }) {
    // const query = `
    //     MATCH p=(a:\`Disease or Phenotype\` {${field}: $term})-[r1]-(b:Metabolite)-[r2:\`bioactivity\`]-(c:Protein)-[r3:is_protein]-(g:Gene)
    //     RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
    //     ORDER BY r1.evidence DESC, r2.evidence DESC
    //     LIMIT TOINTEGER($limit)
    //     UNION
    //     MATCH p=(a:\`Disease or Phenotype\` {${field}: $term})-[r1]-(b:Metabolite)-[r2:\`bioactivity\`]-(c:Protein)-[r3:is_protein]-(g:Gene)-[r4:\`expresses\`]-(d:Anatomy)
    //     RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
    //     ORDER BY r1.evidence DESC, r2.evidence DESC, r3.evidence DESC
    //     LIMIT TOINTEGER($limit)
    //     UNION
    //     MATCH p=(a:\`Disease or Phenotype\` {${field}: $term})-[r1]-(b:Metabolite)-[r2:\`causally influences\`]-(c:Gene)-[r3:\`bioactivity\`]-(d:Drug)
    //     RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
    //     ORDER BY r1.evidence DESC, r2.evidence DESC, r3.evidence DESC
    //     LIMIT TOINTEGER($limit)
    //     UNION
    //     MATCH p=(a:\`Disease or Phenotype\` {${field}: $term})-[r1]-(b:Metabolite)-[r2:\`causally influences\`]-(c:Gene)-[r3:\`expresses\`]-(d:Tissue)
    //     RETURN p, NODES(p) as n, RELATIONSHIPS(p) as r
    //     ORDER BY r1.evidence DESC, r2.evidence DESC, r3.evidence DESC
    //     LIMIT TOINTEGER($limit)
    // `
    const query = `MATCH p1=(d:\`Disease or Phenotype\` {${field}: $term})-[r1: indication]-(a: Compound)
    WITH p1, a LIMIT TOINTEGER($limit)
    CALL {
        WITH p1, a
        MATCH q=(a)-[:bioactivity]-(b:Protein)-[:is_protein]-(g:Gene)
        OPTIONAL MATCH q2=(g)-[r:expressed_in]-(a:Anatomy)
        WITH apoc.path.combine(p1,q) as comb, q2
        ORDER BY r.evidence_class DESC
        RETURN apoc.path.combine(comb, q2) as p
    }
    RETURN p, nodes(p) as n, relationships(p) as r LIMIT TOINTEGER($limit)
    UNION
    MATCH p1=(d:\`Disease or Phenotype\` {${field}: $term})-[r2:correlated_with_condition]-(m:Metabolite)-[:bioactivity]-(b:Protein)-[:is_protein]-(g:Gene)
    WITH p1, g LIMIT TOINTEGER($limit)
    CALL {
        WITH p1, g
        MATCH q=(g)-[r:expressed_in]-(a:Anatomy)
        RETURN apoc.path.combine(p1,q) as p
        ORDER BY r.evidence_class DESC
        LIMIT 5
    }
    RETURN p, nodes(p) as n, relationships(p) as r LIMIT TOINTEGER($limit)
    `
    const query_params = { term, limit }
    return resolve_results({query, query_params, terms: [term],  aggr_scores, colors, fields: [field]})
}

const InputSchema = z.object({
    start_term: z.string(),
    limit: z.number().optional(),
    start_field: z.string().optional()
})


/**
 * @swagger
 * /api/distillery/mw:
 *   get:
 *     description: Resolves MW usecase
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
    const filter = req.nextUrl.searchParams.get("filter")
    if (!filter) return NextResponse.json({error: "No filter inputted"}, {status: 400})
    const f = JSON.parse(filter)
    if (f.limit && !isNaN(f.limit) && typeof f.limit === 'string') f.limit = parseInt(f.limit)
    
    const { start_term, limit=10, start_field="label" } = InputSchema.parse(f)
        
    const {aggr_scores, colors} = await initialize()
    // const nodes = schema.nodes.map(i=>i.node)
    if (start_term === undefined) return NextResponse.json({error: "No term inputted"}, {status: 400})
    else { 
        try {
            const results = await process_query({term:start_term, limit, aggr_scores, colors, field:start_field })
            return NextResponse.json(results, {status: 200})
        
        } catch (e) {
            return NextResponse.json({error:e.message}, {status: 400})
        }
      }
  }
  