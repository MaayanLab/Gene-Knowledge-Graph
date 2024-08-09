import neo4j from 'neo4j-driver'

const neo4jDriverFunc = () => {
  const prod_url = process.env.NEO4J_VERSION === '5' ? process.env.NEXT_PUBLIC_NEO4J_V5_URL: process.env.NEXT_PUBLIC_NEO4J_URL
  const NEO4J_URL = process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_NEO4J_DEV_URL: prod_url
  return neo4j.driver(
    NEO4J_URL,
    neo4j.auth.basic(process.env.NEXT_PUBLIC_NEO4J_USER, process.env.NEXT_PUBLIC_NEO4J_PASSWORD)
  )
}
export const neo4jDriver = neo4jDriverFunc()
// export const neo4jDriver = neo4j.driver(
//   NEO4J_URL,
//   neo4j.auth.basic(process.env.NEXT_PUBLIC_NEO4J_USER, process.env.NEXT_PUBLIC_NEO4J_PASSWORD)
// )
