import cache from "memory-cache";
import { NextResponse } from "next/server";
import { get_regex } from "./helper";



export async function GET() {
    const cached = cache.get("regex")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const libraries = await get_regex()
        cache.put("regex", libraries);
        return NextResponse.json(libraries, {status: 200})  
    }
}