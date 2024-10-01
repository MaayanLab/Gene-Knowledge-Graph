import { fetch_kg_schema } from "@/utils/initialize"
import { NextResponse } from "next/server";

export async function GET() {
    const schema = await fetch_kg_schema()
    const nodes = {}
    for (const i of schema.nodes) {
        nodes[i.node] = i.search
    }
    
    return NextResponse.json(nodes, {status: 200})
}