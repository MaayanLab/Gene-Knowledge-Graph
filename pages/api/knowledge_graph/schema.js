import cache from "memory-cache";
import { fetch_kg_schema } from "../../../utils/initialize"

export default async function query(req, res) {
    const cached = cache.get("schema")
    if (cached) {
        res.status(200).send(cached) 
    } else {
        const schema = await fetch_kg_schema()
        cache.put("schema", schema);
        res.status(200).send(schema)    
    }
}