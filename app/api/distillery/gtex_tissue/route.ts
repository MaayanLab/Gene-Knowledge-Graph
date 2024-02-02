import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../../utils/neo4j"
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from 'zod';
import { convert_query } from "@/utils/helper";

const InputSchema = z.object({
    term: z.string().optional(),
    field: z.string().optional(),
    limit: z.number().optional()
})
export async function GET(req: NextRequest) {
    try {
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        try {
            const {term="", field="label", limit=100} = InputSchema.parse(convert_query(req))
            const types = ["Tissue", "Body Part, Organ, or Organ Component", "Body Location or Region"]
            
            const queries = []
            for (const type of types) {
                let q = `MATCH (a:\`${type}\`)-[r:expresses]-(b:Gene)`
                if (term) {
                    q = q + ` WHERE a.${field} =~ $term`

                }
                q = q + "  RETURN DISTINCT(a) LIMIT TOINTEGER($limit)"
                queries.push(q)
            }
            const query = queries.join(" UNION ")
            const results = await session.readTransaction(txc => txc.run(query, {limit, term: `(?i).*${term}.*`}))
            const records = {}
            for (const record of results.records) {
                const a = record.get('a')
                const value = a.properties[field]
                if (value) records[value] = a.properties
            }
            return NextResponse.json(records, {status: 200})    
        } catch (error) {
            return NextResponse.json(error, {status: 400})    
        } finally {
            session.close()
        }
    } catch (error) {
        return NextResponse.json(error, {status: 400})    
    }
     
}