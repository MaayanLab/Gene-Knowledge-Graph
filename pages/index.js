import prisma from '../lib/prisma'
export default function Home(props) {
  console.log(props)
  return (
    null
  )
}

export async function getStaticProps(ctx) {
	const resources = await prisma.resource.findMany({
		orderBy: [
			{
			  priority: 'asc',
			}
		]
	})
	const nodes = await prisma.node.findMany({
		orderBy: [
			{
			  priority: 'asc',
			}
		]
	})
	return {
	  props: {
      resources,
      nodes
    }
	};
  }