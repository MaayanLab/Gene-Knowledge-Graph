import cache from "memory-cache";
import { fetch_kg_schema } from "@/utils/initialize"
import { NextResponse } from "next/server";

export async function GET() {
    const cached = cache.get("node_properties1")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const schema = await fetch_kg_schema()
        const nodes = {}
        for (const i of schema.nodes) {
            nodes[i.node] = i.search
        }
        cache.put("node_properties1", nodes, 10000);
        return NextResponse.json(nodes, {status: 200})
    }
}