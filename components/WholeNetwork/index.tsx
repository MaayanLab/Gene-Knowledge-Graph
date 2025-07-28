import dynamic from "next/dynamic"
// import ClientTermAndGeneSearch from './client_side'
import { Grid, Typography, CircularProgress, Card, CardContent, Stack } from "@mui/material"
import Form from "./form"
import { fetch_kg_schema } from "@/utils/initialize"
const Cytoscape = dynamic(()=>import('../Cytoscape'),
    {
        ssr: false,
        loading: ()=><CircularProgress/>
    }
)
export const initialize_kg = async () => {
    const schema = await fetch_kg_schema()
    const nodes = {}
	const tooltip_templates_nodes = {}
  	const tooltip_templates_edges = {}
    const edges = []
    const default_relations = []
    const hiddenLinksRelations = []
	for (const i of schema.nodes) {
		tooltip_templates_nodes[i.node] = i.display
		const {node} = i
		nodes[node] = i
	}
    for (const i of schema.edges) {
        for (const e of i.match) {
            tooltip_templates_edges[e] = i.display
            if (!i["gene_link"]) {
                if (edges.indexOf(e) === -1) {
                    edges.push(e)
                } 
                if (i.selected && default_relations.indexOf(e) === -1) {
                    default_relations.push(e)
                }
            } else if (hiddenLinksRelations.indexOf(e) === -1) {
                for (const j of i.match) hiddenLinksRelations.push(j)
            }
        }
    }
    return {
        schema,
        nodes,
        tooltip_templates_nodes,
        tooltip_templates_edges,
        edges,
        hiddenLinksRelations,
        default_relations,
    }
}

const WholeNetwork = async ({props}: {
        props: {
            title?: string
            description?: string,
            [key:string]: any
        }
}) => {
    const {
        schema,
        nodes,
        tooltip_templates_nodes,
        tooltip_templates_edges,
        edges,
        hiddenLinksRelations,
    } = await initialize_kg()
    const controller = new AbortController()
    try {
        let elements = null
        console.log(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/knowledge_graph/all`)
        const res = await fetch(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/knowledge_graph/all`,
        {
            method: 'GET',
            signal: controller.signal,
        }) 
        if (!res.ok) console.log(await res.text())
        else elements = await res.json()
        return (
            <Grid container spacing={2}>
                {props.title && <Grid item xs={12}>
                    <Typography variant={"h2"}>{props.title}</Typography>
                </Grid>}
                {props.description && <Grid item xs={12}>
                    <Typography variant={"subtitle1"}>{props.description}</Typography>
                </Grid>}
                <Grid item xs={12}>
                    <Stack>
                        <Form 
                            elements={elements}
                        />
                        <Card sx={{borderRadius: "24px"}}>
                            <CardContent>
                                <Cytoscape 
                                    elements={elements}
                                    schema={schema}
                                    tooltip_templates_edges={tooltip_templates_edges}
                                    tooltip_templates_nodes={tooltip_templates_nodes}
                                /> 
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        )
    } catch (error) {
        console.error(error)
        return null
    }
}

export default WholeNetwork