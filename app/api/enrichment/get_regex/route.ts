import cache from "memory-cache";
import { typed_fetch } from "@/utils/helper";
import { NextResponse } from "next/server";
import { UISchema } from "../../schema/route";




export async function GET() {
    const cached = cache.get("regex")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const schema = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
        const enrichment = ((schema.header || {}).tabs || []).filter(i=>i.component === "Enrichment")[0] || {props: {libraries: []}}
        const libraries = {}
        for ( const l of enrichment.props.libraries) {
            if (l.regex) {
                libraries[l.name] = l.regex
            }
            }
        cache.put("regex", libraries);
        return NextResponse.json(libraries, {status: 200})  
    }
}