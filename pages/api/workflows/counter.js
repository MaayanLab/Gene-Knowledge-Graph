import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
	const { id, start, end} = req.query
	if (id, start, end) {
		const w = await prisma.workflow.findFirst({
			where: {
				id,
				start_node: start,
				end_node: end,
			}
		})

		if (w) {
			const workflow = await prisma.workflow.updateMany({
				where: {
					id,
					start_node: start,
					end_node: end,
				},
				data: {
					counter: w.counter + 1
				}
			})
			const wf = await prisma.workflow.findFirst({
				where: {
					id,
					start_node: start,
					end_node: end,
				},
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
			})
			res.status(200).json(wf)
		}
	} else {
		res.status(400).json({error: "Invalid input"})
	}
  }