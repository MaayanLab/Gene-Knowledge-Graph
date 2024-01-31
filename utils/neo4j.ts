import neo4j from 'neo4j-driver'

const NEO4J_URL = process.env.NODE_ENV === 'development' ? (process.env.NEO4J_DEV_URL || process.env.NEO4J_URL): process.env.NEO4J_URL
export const neo4jDriver = neo4j.driver(
  NEO4J_URL,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
)
