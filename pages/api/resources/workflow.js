import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
	const { start, end, endpoint } = req.query
	const where = {}
	if (start) {
		where.start = {
			id: start
		}
	}
	if (end) {
		where.end = {
			id: end
		}
	}
	console.log(where)
	if (endpoint) {
		where.endpoint = {startsWith: endpoint}
	}
	const workflows = await prisma.workflowResource.findMany({
		where,
		select:{
			resouceWorkflow: true
		},
		distinct: ["resource"],
	})
	console.log(workflows)
	res.status(200).json(workflows.map(i=>i.resouceWorkflow.id))
  }