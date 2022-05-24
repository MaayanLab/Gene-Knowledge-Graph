import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"

export default async function query_genes(req, res) {
  try {
    const session = neo4jDriver.session({
      defaultAccessMode: neo4j.session.READ
    })
    try {
      const { node } = await req.query
      const results = await session.readTransaction(txc => txc.run(`
        MATCH (g: ${node})
        RETURN *
      `))
      res.status(200).send(results.records.reduce((acc, record) => {
        const g = record.get('g')
        return {...acc, [g.properties.label]: g.properties}
      }, {}))
    } catch (e) {
      res.status(400).send(e.message)
    } finally {
      session.close()
    }
  } catch (e) {
    res.status(400).send(error.message)
  }
}
