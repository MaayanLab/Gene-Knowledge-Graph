//pages/api/workflows/index.js
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
	const { start, end } = req.query
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
	const workflows = await prisma.workflow.findMany({
		where,
		select:{
			id: true,
			name: true,
			endpoint: true,
			description: true,
			icon: true,
			type: true,
			start: true,
			end: true,
			counter: true,
		},
		orderBy: [
			{
			  priority: 'asc',
			}
		  ]
	})
	const start_ids = []
	const end_ids = []
	for (const i of workflows) {
		if (start_ids.indexOf(i.start.id) === -1) start_ids.push(i.start.id)
		if (end_ids.indexOf(i.end.id) === -1) end_ids.push(i.end.id)
	}
	res.status(200).json({
		start: start_ids,
		end: end_ids,
		workflows
	})
  }