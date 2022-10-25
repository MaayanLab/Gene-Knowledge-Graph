import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import { toNumber } from "../../../utils/helper";

export default async function query(req, res) {
    try {
        const read_session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        const write_session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.WRITE
        })
        const query = "MATCH (a:Counter) RETURN a.count"
        const rs = await read_session.readTransaction(txc => txc.run(query))
        if (rs.records.length === 0) {
            const query = "CREATE (n:Counter {count: 1})"
            const rs = await write_session.run(query)
            res.status(200).send({count: 1})
            
        } else {
            const query = `MATCH (p:Counter)
            SET p.count = p.count + 1
            RETURN p.count as count`
            const rs = await write_session.run(query)
            res.status(200).send(rs.records.flatMap(record => {
                const count = toNumber(record.get("count"))
                return {count}
            })[0])
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}