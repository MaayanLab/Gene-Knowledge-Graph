import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import { toNumber } from "@/utils/math"; 
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const read_session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        const write_session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.WRITE
        })
        try {
            const query = "MATCH (a:Counter) RETURN a.count"
            const rs = await read_session.readTransaction(txc => txc.run(query))
            if (rs.records.length === 0) {
                const query = "CREATE (n:Counter {count: 1})"
                const rs = await write_session.run(query)
                return NextResponse.json({count: 1},  {status: 200})
            } else {
                const query = `MATCH (p:Counter)
                SET p.count = p.count + 1
                RETURN p.count as count`
                const rs = await write_session.run(query)
                const results = rs.records.flatMap(record => {
                    const count = toNumber(record.get("count"))
                    return {count}
                })[0]
                return NextResponse.json(results,  {status: 200})
            }
        } catch (e) {
            console.log(e.message)
            return NextResponse.json(e, {status: 400})
        } finally {
            read_session.close()
            write_session.close()
        }
    } catch (error) {
        console.log(error)
        return NextResponse.error()
    }
}

export const revalidate = 0;