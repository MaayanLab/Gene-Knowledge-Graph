import cache from "memory-cache";
import { fetch_kg_schema } from "../../../utils/initialize"

export default async function query(req, res) {
    const cached = cache.get("node_properties")
    if (cached) {
        res.status(200).send(cached) 
    } else {
        const schema = await fetch_kg_schema()
        const nodes = {}
        for (const i of schema.nodes) {
            nodes[i.node] = i.search
        }
        cache.put("properties", nodes);
        res.status(200).send(nodes)    
    }
}