import { neo4jDriver } from "@/utils/neo4j"
import neo4j from "neo4j-driver"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server' 
import { z } from 'zod'

const verify_input = async (input:Array<string>) => {
    try{
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        try {
            const query = `MATCH (n)
                WHERE n.label IN ${JSON.stringify(input)}
                RETURN n
            `
            
            const rs = await session.readTransaction(txc => txc.run(query))
            const valid = []
            rs.records.flatMap(record => {
                const node = record.get('n')
                if (valid.indexOf(node.properties.label) === -1) valid.push(node.properties.label)
            })

            return valid
                
        } catch (error) {
            throw error
        } finally {
            session.close()
        }
        
    } catch (error) {
        throw error
    }
}

const input_schema = z.object({
    input: z.array(z.string())
})
export async function POST(req: NextRequest) {
    try {
        const {input} = input_schema.parse(await req.json())
        const results = await verify_input(input)
        return NextResponse.json(results, {status: 200})
    } catch (error) {
        console.log("error", error)
        return NextResponse.json(error, {status: 400})
    }
}