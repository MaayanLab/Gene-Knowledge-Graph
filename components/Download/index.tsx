import { typed_fetch } from "@/utils/helper"
import EdgeOnly from "./edge_only"
import NodesAndEdges from "./node_and_edges"

const Download = async ({src}: {src?: string}) => {
	const download = await typed_fetch<Array<{
		source: string,
		description?: string,
		terms: number,
		edges: number,
		url: string,
		size: string
	}>| {
		nodes: Array<{
			node_type: string,
			resource: string,
			description?: string,
			terms: number,
			url: string,
			size: string
		}>,
		edges: Array<{
			resource: string,
			source: string,
			relation: string,
			target: string,
			description?: string,
			edges: number,
			gene_coverage?: number,
			url: string,
			size: string
		}>
	}>(src)
	if (Array.isArray(download))  return <EdgeOnly download={download}/>
	else return <NodesAndEdges download={download}/>
}

export default Download