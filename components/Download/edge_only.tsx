import { typed_fetch } from "@/utils/helper"
import { Grid, Typography, } from "@mui/material"

import ClientSide from "./client_side";

const EdgeOnly = ({download}: {download: Array<{
	source: string,
	description?: string,
	terms: number,
	edges: number,
	url: string,
	size: string
}>}) => {
	return (
		<Grid container spacing={2}>
			<Grid item xs={12}>
				<Typography variant={"h2"}>Download Page</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant={"body1"}>
					Each entry below contains a link to `[source].edges.csv` file. 
					These files contains the triple source, relation, and target signigfying an edge in the network. 
					Additionally these files may also include associated metadata for the source and target nodes as well as the edges.
				</Typography>
			</Grid>
			<Grid item xs={12}>
				<ClientSide download={download.map(i=>({id: i.source, ...i}))} type='default'/>
			</Grid>
		</Grid>
	)
}

export default EdgeOnly