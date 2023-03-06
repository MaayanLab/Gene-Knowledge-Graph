import fetch from "node-fetch";
import cache from "memory-cache";




export default async function query(req, res) {
    const cached = cache.get("node_mapping")
    if (cached) {
        res.status(200).send(cached) 
    } else {
        const schema = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/schema`)).json()
        const enrichment = ((schema.header || {}).tabs || []).filter(i=>i.component === "Enrichment")[0] || {}
        const mapping = {}
        for ( const l of ((enrichment.props || {}).libraries || [])) {
            mapping[l.name] = l.node || l.name    
        }
        cache.put("node_mapping", mapping);
        res.status(200).send(mapping)    
    }
}