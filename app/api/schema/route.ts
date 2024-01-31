import cache from "memory-cache";
import { fetch_kg_schema } from "@/utils/initialize"
import { NextResponse } from "next/server";

export async function GET() {
    const cached = cache.get("schema")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const schema = await fetch_kg_schema()
        cache.put("schema", schema);
        return NextResponse.json(schema, {status: 200})
    }
}