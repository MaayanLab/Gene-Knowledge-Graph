import cache from "memory-cache";
import { NextResponse } from "next/server";
import { fetch_kg_schema } from "@/utils/initialize";

export const get_regex = async () => {
	const schema = await fetch_kg_schema()
	const enrichment = ((schema.header || {}).tabs || []).filter(i=>i.component === "Enrichment")[0] || {props: {libraries: []}}
	const libraries = {}
	for ( const l of enrichment.props.libraries) {
		if (l.regex) {
			libraries[l.name] = l.regex
		}
	}
	return libraries
}