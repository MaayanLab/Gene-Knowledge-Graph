import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import cache from "memory-cache";
import fetch from "node-fetch";
import { default_color } from "../../../utils/colors";

const aggregates = async ({session, schema}) => {
	const aggr_scores = {}
    const colors = {}
    for (const s of schema.edges) {	
        for (const i of (s.match || [])) {
            colors[i] = {
                color: s.color || default_color,
            }
        }
        if (s.order) {
            const [field, order] = s.order
            let query
            let edge_score_var
            if (order === "DESC") {
                const order_pref = 'max'
                edge_score_var = `${order_pref}_${field}`
                query = `MATCH (st)-[rel]-(en)
                    WHERE rel.${field} IS NOT NULL 
                    RETURN ${order_pref}(rel.${field}) as ${edge_score_var}`	
            } else {
                const order_pref = 'min'
                edge_score_var = `${order_pref}_${field}`
                query = `MATCH (st)-[rel]-(en)
                    RETURN ${order_pref}(rel.${field}) as ${edge_score_var}`
            }
            const results = await session.readTransaction(txc => txc.run(query))
            results.records.flatMap(record => {
                const score = record.get(edge_score_var)
                aggr_scores[edge_score_var] = score
            })
            for (const j of (s.match || [])) {
                colors[j].aggr_field = edge_score_var
                colors[j].field = field
                colors[j].aggr_type = order
            }
        }
    }
    for (const s of schema.nodes) {
        if (s.color) {
            colors[s.node] = {
                color: s.color
            }
        } else {
            colors[s.node] = {}
        }
            
        if (s.order) {
            const [field, order] = s.order
            let score_var
            for (const order_pref of ['max', 'min']) {
                score_var = `${order_pref}_${field}`
                const query = `MATCH (st)
                    WHERE st.${field} IS NOT NULL 
                    RETURN ${order_pref}(st.${field}) as ${score_var}`	
                const results = await session.readTransaction(txc => txc.run(query))
                results.records.flatMap(record => {
                    const score = record.get(score_var)
                    aggr_scores[score_var] = score
                })
            }
            
            
            colors[s.node].aggr_field = score_var
            colors[s.node].aggr_type = order
            colors[s.node].field = field
        }
    }
    console.log(colors)
    console.log(aggr_scores)
    return {aggr_scores, colors}
}

export default async function query(req, res) {
    const cached = cache.get("aggregate")
    if (cached) {
        res.status(200).send(cached) 
    } else {
        try {
            const schema = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/schema`)).json()
            const session = neo4jDriver.session({
                defaultAccessMode: neo4j.session.READ
            })
            const val = await aggregates({session, schema})
            cache.put("aggregate", val);
            res.status(200).send(val) 
        } catch (error) {
            console.log(error)
            res.status(500).send(error) 
        }
    }
}

