import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import { NextResponse } from "next/server"
import { NextRequest } from 'next/server'
import { convert_query } from "@/utils/helper"
import { z } from 'zod'
// This function returns a gene list based on a search term
const gene_query = z.object({
    enzyme: z.boolean().optional(),
    term: z.string().optional(),
    field: z.string().optional(),
})

/**
 * @swagger
 * /api/distillery/genes:
 *   get:
 *     description: Returns drug processing enzyme genes
 *     tags:
 *       - distillery apps
 *     parameters:
 *       - name: enzyme
 *         in: query
 *         type: boolean
 *       - name: field
 *         in: query
 *       - name: term
 *         in: query
 *     responses:
 *       200:
 *         description: Drug processing enzymes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(req: NextRequest) {
    const { enzyme=true, term="", field="label" } = gene_query.parse(convert_query(req))
    try {
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        try {
            if (["ENTREZ", "UNIPROTKB", "label", "HGNC"].indexOf(field) === -1) return NextResponse.json({error: "Invalid field"}, {status: 500})
            let query = "MATCH (a:Gene)"
            if (enzyme) query = "MATCH (a:Gene {is_Enzyme: TRUE})"
            if (term) {
                query = query + ` WHERE a.${field} contains $term`

            }
            query = query + "  RETURN a LIMIT 100"
            const results = await session.readTransaction(txc => txc.run(query, {term: term.toUpperCase().replace("GENE", "gene")}))
            const genes = []
            for (const record of results.records) {
                const a = record.get('a')
                const value = a.properties[field]
                if (value) genes.push(value)
            }
            return NextResponse.json(genes, {status: 200})
        } catch (error) {
            return NextResponse.json(error, {status: 500})
        } finally {
            session.close()
        }
    } catch (error) {
        return NextResponse.json(error, {status: 500})
    }
    
    
}