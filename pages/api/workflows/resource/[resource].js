import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
	const { position, id } = req.query
	const start = await prisma.workflowResource.findMany({
		where: { 
			resource: id
		},
		select:{
			start: true,
		},
		distinct: ["start_node"],
	})
	const end = await prisma.workflowResource.findMany({
		where: { 
			resource: id
		},
		select:{
			end: true,
		},
		distinct: ["end_node"],
	})
	res.status(200).json({start: start.map(i=>i.start), end: end.map(i=>i.end)})
  }