import cache from "memory-cache";
import { NextResponse } from "next/server";
import { get_node_mapping } from "./helper";
export async function GET() {
    const cached = cache.get("node_mapping")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const mapping = await get_node_mapping()
        cache.put("node_mapping", mapping);
        return NextResponse.json(mapping, {status: 200})
    }
}