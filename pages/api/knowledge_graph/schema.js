import cache from "memory-cache";
import * as default_schema from "../../../public/schema.json"
import { fetch_kg_schema } from "../../../utils/initialize"

export default async function query(req, res) {
    const cached = cache.get("schema")
    if (cached) {
        res.status(200).send(cached) 
    } else {
        let schema = default_schema
        if (process.env.NEXT_PUBLIC_SCHEMA) {
            schema = await fetch_kg_schema()
        }
        cache.put("schema", schema);
        res.status(200).send(schema)    
    }
}