import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../../utils/neo4j"
import { cors, runMiddleware } from "../../knowledge_graph"

// This function returns a gene list based on a search term
export default async function query(req, res) {
    try {
        await runMiddleware(req, res, cors)
        const node_properties = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/search_properties`)).json()
        const {term="", field="label", filter, limit=100} = await req.query
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        const type = "Disease"
        if (node_properties[type].indexOf(field) === -1) {
            res.status(400).send({message: `Invalid field: ${field}`}) 
            return
        }
        if (filter) JSON.parse(filter)

        let query = `MATCH p=(a:Disease)-[r1:\`gene associated with disease or phenotype\`]-(b:Gene)`
        if (term) {
            query = query + ` WHERE a.${field} =~ $term`

        }
        query = query + "  RETURN a LIMIT TOINTEGER($limit)"
        const results = await session.readTransaction(txc => txc.run(query, {limit, term: `(?i).*${term}.*`}))
        const records = {}
        for (const record of results.records) {
            const a = record.get('a')
            const value = a.properties[field]
            if (value) records[value] = a.properties
        }
        res.status(200).send(records)    
        return
    } catch (error) {
        res.status(400).send(error) 
    }
     
}