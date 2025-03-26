import dynamic from "next/dynamic"
import { FilterSchema } from "@/utils/helper"
import { process_relation } from "@/utils/helper"
// import ClientTermAndGeneSearch from './client_side'
import { Grid, Typography, CircularProgress, Card, CardContent, Stack } from "@mui/material"
import { parseAsJson } from "next-usequerystate"
import AsyncFormComponent from "./async_form"
import TooltipComponentGroup from "./tooltip"
import Form from "./form"
import NetworkTable from "./network_table"
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

const TermAndGeneSearch = async ({searchParams, props}: {
        searchParams?: {
            filter?: string,
            fullscreen?: 'true',
            view?:string,
        },
        props: {
            title?: string
            description?: string,
            initial_query?: {
                start: string,
                start_term: string,
                start_field?: string,
                [key: string]: string
            },
            coexpression_prediction?: boolean,
            additional_link_button?: boolean,
            additional_link_relation_tags?: Array<string>,
            neighborCount?: number,
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
    const query_parser = parseAsJson<FilterSchema>().withDefault(props.initial_query)
    const filter: FilterSchema = query_parser.parseServerSide(searchParams.filter)
    const controller = new AbortController()
    try {
        if (filter.relation) {
            filter.relation = process_relation(filter.relation)
            // if (!filter.end) {
            //     if (typeof filter.relation[0] === 'string') {
            //         filter.relation = process_relation(filter.relation).map((name)=>({name, limit: filter.limit || 5}))
            //     } else {
            //         filter.relation = process_relation(filter.relation).map(({name, limit})=>({name, limit: limit || filter.limit || 5}))
            //     }
            //     delete filter.limit
            // } else {
            //     if (typeof filter.relation[0] === 'string') {
            //         filter.relation = process_relation(filter.relation).map((name)=>({name}))
            //     } else {
            //         filter.relation = process_relation(filter.relation).map(({name, limit})=>({name, limit}))
            //     }
            //     // filter.relation = process_relation(filter.relation).map(({name})=>({name}))
            //     delete filter.augment
            //     delete filter.augment_limit
            // }
        }
        let elements = null
        const selected_edges = []
        const genes = []
        if (Object.keys(filter).length > 0) {
            console.log(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/knowledge_graph?filter=${JSON.stringify(filter)}`)
            const res = await fetch(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/knowledge_graph?filter=${JSON.stringify(filter)}`,
            {
                method: 'GET',
                signal: controller.signal,
            }) 
            if (!res.ok) console.log(await res.text())
            else elements = await res.json()        
        
            for (const i of (elements || {}).edges || []) {
                if (i.data.relation && selected_edges.indexOf(i.data.label) === -1) {
                    selected_edges.push({name: i.data.label})
                }
            }
            for (const i of (elements || {}).nodes || []) {
                if (i.data.kind === "Gene" && genes.indexOf(i.data.label) === -1) {
                    genes.push(i.data.label)
                }
            }
        }
        // if (!filter.relation || filter.relation.length === 0) {
        //     filter.relation = selected_edges
        // }
         
        // return <ClientTermAndGeneSearch
        //         searchParams={searchParams}
        //         elements={elements}
        //         schema={schema}
        //         nodes={nodes}
        //         tooltip_templates_nodes={tooltip_templates_nodes}
        //         tooltip_templates_edges={tooltip_templates_edges}
        //         title={props.title}
        //         description={props.description}
        //         initial_query={props.initial_query}
        //         edges={edges}
        //         geneLinksRelations={geneLinksRelations}
        //         {...props}
        //     />
        return (
            <Grid container spacing={2}>
                {props.title && <Grid item xs={12}>
                    <Typography variant={"h2"}>{props.title}</Typography>
                </Grid>}
                {props.description && <Grid item xs={12}>
                    <Typography variant={"subtitle1"}>{props.description}</Typography>
                </Grid>}
                <Grid item xs={12} md={4} lg={3}>
                    <Card elevation={0} sx={{borderRadius: "8px", backgroundColor: "tertiary.light"}}>
                        <CardContent>
                            <Stack>
                                <AsyncFormComponent 
                                    nodes={nodes}
                                    initial_query={props.initial_query}
                                    direction={'Start'}
                                    searchParams={searchParams}
                                />
                                {filter.end && 
                                <AsyncFormComponent 
                                    initial_query={props.initial_query}
                                    nodes={nodes}
                                    direction={'End'}
                                    searchParams={searchParams}
                                />}
                            </Stack>
                        </CardContent>
                    </Card>
                    <TooltipComponentGroup
                            elements={elements}
                            tooltip_templates_edges={tooltip_templates_edges}
                            tooltip_templates_nodes={tooltip_templates_nodes}
                            schema={schema}
                        />
                </Grid>
                <Grid item xs={12} md={8} lg={9}>
                    <Stack>
                        <Form searchParams={searchParams}
                            edges={edges}
                            genes={genes}
                            coexpression_prediction={props.coexpression_prediction}
                            additional_link_button={props.additional_link_button}
                            additional_link_relation_tags={props.additional_link_relation_tags}
                            neighborCount={props.neighborCount}
                            hiddenLinksRelations={hiddenLinksRelations}
                            elements={elements}
                            initial_query={props.initial_query}
                        />
                        <Card sx={{borderRadius: "24px"}}>
                            <CardContent>
                            {(searchParams.view === "table") ? 
                                <div style={{minHeight: 700}}><NetworkTable data={elements} schema={schema}/></div>:
                                <Cytoscape 
                                    elements={elements}
                                    schema={schema}
                                    tooltip_templates_edges={tooltip_templates_edges}
                                    tooltip_templates_nodes={tooltip_templates_nodes}
                                /> 
                            }
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

export default TermAndGeneSearch