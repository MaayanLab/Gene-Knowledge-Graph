import { fetch_kg_schema } from "@/utils/initialize";

export async function get_node_mapping() {
	const schema = await fetch_kg_schema()
	const enrichment = ((schema.header || {}).tabs || []).filter(i=>i.component === "Enrichment")[0] || {props: {libraries: []}}
	const mapping = {}
	for ( const l of enrichment.props.libraries) {
		mapping[l.name] = l.node || l.name    
	}
	return mapping
}