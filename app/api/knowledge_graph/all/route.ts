import { resolve_results } from "../../knowledge_graph/helper";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from 'zod';
import { initialize } from "../../initialize/helper";
import { ArrowShape } from "@/components/Cytoscape";
async function process_query({
    aggr_scores,
    colors,
    arrow_shape}: {
        aggr_scores?: {[key:string]: {max: number, min: number}},
        colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
        arrow_shape?: {[key:string]: ArrowShape},
    }) {
    const query = `MATCH p=()-[]-()
                    RETURN p, nodes(p) as n, relationships(p) as r
    `
    return resolve_results({query, aggr_scores, colors, fields: [], arrow_shape})
}
/**
 * @swagger
 * /api/distillery/disease2exrna:
 *   get:
 *     description: Performs liquid biopsy of condition
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
        
        
        const {aggr_scores, colors, arrow_shape} = await initialize()
        
        try {
            const results = await process_query({ aggr_scores, colors, arrow_shape })
            return NextResponse.json(results, {status: 200})
        } catch (e) {
            return NextResponse.json(e, {status: 400})
        }
    } catch (e) {
        return NextResponse.json(e, {status: 400})
    }
  }
  