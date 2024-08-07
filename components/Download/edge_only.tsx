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
				<Typography variant={"h2"}>Download</Typography>
			</Grid>
			<Grid item xs={12}>
				<Typography variant={"body1"}>
					Each dataset below contains a link to `[source].new_archive.zip` file. 
					This zip file contains 1. a '[source].nodes.csv' file containing the terms' information; 2. edges files containing
					the triple source, relation, and target signifying an edge in the network, and 3. a '[genes].nodes.csv' file containing the genes that are covered in the dataset.
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