import fetch from "node-fetch";
import { neo4jDriver } from "../../../../utils/neo4j"
import neo4j from "neo4j-driver"

const verify_input = async ({input, session}) => {
    const query = `MATCH (n)
        WHERE n.label IN ${JSON.stringify(input)}
        RETURN n
    `
    
    const rs = await session.readTransaction(txc => txc.run(query))
    const valid = []
    rs.records.flatMap(record => {
        const node = record.get('n')
        if (valid.indexOf(node.properties.label) === -1) valid.push(node.properties.label)
    })

    return valid
}

export default async function query(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).send({ message: 'Only POST requests allowed' })
            return
        } else {
            const session = neo4jDriver.session({
                defaultAccessMode: neo4j.session.READ
            })
            const body = typeof req.body === "string" ? JSON.parse(req.body): req.body
            const results = await verify_input({session, ...body, res})
            res.status(200).send(results)
            
        }
    } catch (error) {
        res.status(500).send(error)
    }
}