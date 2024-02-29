import { Grid, Typography, } from "@mui/material"

import ClientSide from "./client_side";

const NodesAndEdges = ({download}: {download: {
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
}}) => {
	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Typography variant={"h2"}>Download Page</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant={"h3"}>Nodes</Typography>
				<Typography variant={"body1"}>
					Each entry below contains a link to a `[node].nodes.csv` file. 
					These files contains metadata of the nodes in this knowlege graph.
				</Typography>
			</Grid>
			<Grid item xs={12}>
				<ClientSide download={download.nodes.map(i=>({id: i.url, ...i}))} type='nodes'/>
			</Grid>
			<Grid item xs={12}>
				<Typography variant={"h3"}>Edges</Typography>
				<Typography variant={"body1"}>
					Each entry below contains a link to a `[source].[relation].[target].edges.csv` file. 
					These files contains the triple source, relation, and target signigfying an edge in the network. 
					Additionally these files may also include associated metadata for the edges.
				</Typography>
			</Grid>
			<Grid item xs={12}>
				<ClientSide download={download.edges.map(i=>({id: i.url, ...i}))} type={download.edges[0].gene_coverage !== undefined ? 'gene edges': 'edges'}/>
			</Grid>
		</Grid>
	)
}

export default NodesAndEdges