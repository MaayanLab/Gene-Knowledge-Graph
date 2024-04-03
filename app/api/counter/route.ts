import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import { toNumber } from "@/utils/math"; 
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        try {
            const query = "MATCH (a:Counter) RETURN a.count as count"
            const rs = await session.readTransaction(txc => txc.run(query))
            if (rs.records.length === 0) {
                return NextResponse.json({count: 0},  {status: 200})
            } else {
                const result = rs.records.flatMap(record => {
                    const count = toNumber(record.get("count"))
                    return {count}
                })[0]
                return NextResponse.json(result, {
                    status: 200,
                });
            }
        } catch (e) {
            console.log(e.message)
            return NextResponse.json(e, {status: 400})
        } finally {
            session.close()
        }
    } catch (error) {
        console.log(error)
        return NextResponse.error()
    }
}