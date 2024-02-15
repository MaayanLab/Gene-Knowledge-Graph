import neo4j from 'neo4j-driver'

const NEO4J_URL = process.env.NEXT_PUBLIC_NEO4J_URL
// const neo4jDriverFunc = () => {
  
//   console.log("NEO")
//   console.log(NEO4J_URL, process.env.NEXT_PUBLIC_NEO4J_USER, process.env.NEXT_PUBLIC_NEO4J_PASSWORD)
//   return neo4j.driver(
//     NEO4J_URL,
//     neo4j.auth.basic(process.env.NEXT_PUBLIC_NEO4J_USER, process.env.NEXT_PUBLIC_NEO4J_PASSWORD)
//   )

// }
// export const neo4jDriver = neo4jDriverFunc()
export const neo4jDriver = neo4j.driver(
  NEO4J_URL,
  neo4j.auth.basic(process.env.NEXT_PUBLIC_NEO4J_USER, process.env.NEXT_PUBLIC_NEO4J_PASSWORD)
)
