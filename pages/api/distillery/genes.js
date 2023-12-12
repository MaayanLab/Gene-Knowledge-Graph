import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import { cors, runMiddleware } from "../knowledge_graph"

// This function returns a gene list based on a search term
export default async function query(req, res) {
    await runMiddleware(req, res, cors)
    const { enzyme, term="", field="label" } = await req.query
    const session = neo4jDriver.session({
        defaultAccessMode: neo4j.session.READ
    })
    if (["ENTREZ", "UNIPROTKB", "label", "HGNC"].indexOf(field) === -1) res.status(404).send({message: `Invalid field: ${field}`}) 
    let query = "MATCH (a:Gene)"
    if (enzyme && enzyme.toLowerCase() === 'true') query = "MATCH (a:Gene {is_Enzyme: TRUE})"
    if (term) {
        query = query + ` WHERE a.${field} contains $term`

    }
    query = query + "  RETURN a LIMIT 100"
    const results = await session.readTransaction(txc => txc.run(query, {term: term.toUpperCase().replace("GENE", "gene")}))
    const genes = []
    for (const record of results.records) {
        const a = record.get('a')
        const value = a.properties[field]
        if (value) genes.push(value)
    }
    res.status(200).send(genes) 
}