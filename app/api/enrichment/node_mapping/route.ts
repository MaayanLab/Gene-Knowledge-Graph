import cache from "memory-cache";
import { typed_fetch } from "@/utils/helper";
import { NextResponse } from "next/server";
import { UISchema } from "../../schema/route";

export async function GET() {
    const cached = cache.get("node_mapping")
    if (cached) {
        return NextResponse.json(cached, {status: 200})
    } else {
        const schema = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
        const enrichment = ((schema.header || {}).tabs || []).filter(i=>i.component === "Enrichment")[0] || {props: {libraries: []}}
        const mapping = {}
        for ( const l of enrichment.props.libraries) {
            mapping[l.name] = l.node || l.name    
        }
        cache.put("node_mapping", mapping);
        return NextResponse.json(mapping, {status: 200})
    }
}