import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"
import { toNumber } from "../../../utils/helper"; 

export default async function query(req, res) {
    try {
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        const query = "MATCH (a:Counter) RETURN a.count as count"
        const rs = await session.readTransaction(txc => txc.run(query))
        if (rs.records.length === 0) {
            res.status(200).send({count: 0})
        } else {
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