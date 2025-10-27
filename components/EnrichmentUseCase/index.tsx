import React, { Suspense } from "react";
import {
    Grid,
    Stack,
    Typography,
    Card,
    CardContent,
    CircularProgress
} from "@mui/material";
import TermViz from "@/components/Chea3Enrichment/TermViz";
import { NetworkSchema } from "@/app/api/knowledge_graph/route";
import { parseAsJson } from "next-usequerystate";
import InteractiveButtons from "@/components/Chea3Enrichment/InteractiveButtons";
import { fetch_kg_schema, fetch_atlas_schema } from "@/utils/initialize";
import QueryForm from "./QueryForm";
import { get_element } from "../Chea3Enrichment/element_resolver";
import { UISchema } from "@/app/api/schema/route";

export interface EnrichmentParams {
    group_name?: string,
    userListId?: string,
    term?: string,
    term_limit?: number,
    gene_limit?: number,
    min_lib?: number,
    gene_degree?: number,
    term_degree?: number,
    augment?: boolean,
    augment_limit?: number,
    gene_links?: Array<string>,
    search?: boolean,
    expand?: Array<string>,
    remove?: Array<string>,
    additional_link_tags?: Array<string>,
    pvalue?: number,
    zscore?: number,
    add_nodes?: number,
    limit?: number,
}

const Enrichment = async ({
    libraries: l,
    sortLibraries,
    searchParams,
    endpoint,
    ...props
}: {
    example?: {
        gene_set?: string,
    },
    libraries?: Array<{name: string, node: string, regex?: string}>,
    sortLibraries?: boolean,
    disableLibraryLimit?: boolean,
    disableHeader?: boolean,
    title?: string,
    description?: string,
    searchParams: {
        q?:string,
        fullscreen?: "true",
        view?: string,
        collapse?: "true"
    },
    endpoint: string,
    additional_link_relation_tags?: Array<string>,
    default_options?: {
        group_name?: string,
        term?: string,
    }

}) => {
    const query_parser = parseAsJson<EnrichmentParams>().withDefault(props.default_options)
    console.log("Getting schema...")
    const schema = await fetch_kg_schema()
    console.log("Schema fetched")

    console.log("Getting atlas schema...")
    const cellschema = await fetch_atlas_schema()
    console.log("Cell type schema fetched")

    const celltype_info = {}
    for (const i of cellschema.celltype){
        celltype_info[i.type] = {
            tissue: i.tissue,
            term: i.term,
            library: i.library,
            url: i.url
        }
    }


    const tooltip_templates_nodes = {}
    const tooltip_templates_edges = {}
    for (const i of schema.nodes) {
        tooltip_templates_nodes[i.node] = i.display
    }

    for (const e of schema.edges) {
        for (const i of e.match) {
        tooltip_templates_edges[i] = e.display
        }
    }
    const hiddenLinksRelations = schema.edges.reduce((acc, i)=>{
        if (i.hidden) return [...acc, ...i.match]
        else return acc
    }, [])
    
    const parsedParams: EnrichmentParams = query_parser.parseServerSide(searchParams.q)
    
    try {
        const cell_types = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment/get_gene_sets`)).json()
        
        const default_group = props.default_options.group_name || Object.keys(cell_types)[0]
        const default_term = props.default_options.term || Object.keys(cell_types[default_group])[0]
        
        const {
            term=default_term,
            group_name=default_group,
        } = parsedParams

        let elements:NetworkSchema = null
        let shortId = ""
        let min_p = 1
        let max_p = 0
        let min_z = 100
        let max_z = 0
        let input_desc
        let userListId = parsedParams.userListId
        if (term !==undefined && group_name !== undefined) {
            const formData = new FormData();
            // const gene_list = geneStr.trim().split(/[\t\r\n;]+/).join("\n")
            const genes = cell_types[group_name][term]
            const gene_list = genes.join('\n')
            formData.append('list', gene_list)
            formData.append('description', `${group_name}: ${term}`)
            userListId = (await (
                await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment/addList`, {
                    method: 'POST',
                    body: formData,
                })
            ).json()).userListId
            // parsedParams.userListId = userListId
            const parsed = await get_element({...parsedParams, userListId})
            elements = parsed.elements
            min_z = parsed.min_z
            max_z = parsed.max_z
        }
        
        const payload = {
            "url": `${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: "/"}${endpoint}${searchParams.q ? '?q=' + searchParams.q: ''}`,
            "apikey": process.env.TURL  
        }
        console.log("Getting short url")
        const request = await fetch(process.env.TURL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
        let short_url=null
        if (request.ok) short_url = (await request.json())["shorturl"]
        else console.log("failed turl")
        console.log("Got url")
        console.log(elements.nodes.length)
        return (
            <Grid container spacing={2} >
                <Grid item xs={12}>
                    <Typography variant={"h2"}>{props.title || "Enrichment Analysis"}</Typography>
                    </Grid>
                {props.description && <Grid item xs={12}>
                    <Typography variant={"subtitle1"}>{props.description}</Typography>
                </Grid>}

                <Grid item xs={12} md={3}>
                    <QueryForm 
                        elements={elements}
                        parsedParams={parsedParams}
                        cell_types={cell_types}
                        cell_info = {celltype_info}
                        genes = {cell_types[group_name][term]}
                        description={`${group_name}: ${term}`}
                    />
                </Grid>
                <Grid item xs={12} md={9}>
                    <Stack direction={"column"} alignItems={"flex-start"} spacing={1}>
                        <InteractiveButtons 
                            hiddenLinksRelations={hiddenLinksRelations}
                            shortId={shortId}
                            elements={elements}
                            parsedParams={parsedParams}
                            // searchParams={parsedParams}
                            fullscreen={searchParams.fullscreen}
                            short_url={short_url}
                            additional_link_relation_tags={props.additional_link_relation_tags}
                            min_p={min_p}
                            max_p={max_p}
                            min_z={min_z}
                            max_z={max_z}
                        {...props}/>
                        <Card sx={{borderRadius: "24px", minHeight: 450, width: "100%"}}>
                            <CardContent>
                                {(userListId === undefined || (term === undefined && group_name === undefined)) ?
                                    <Typography variant="subtitle1">Please add a gene set</Typography>:
                                    <> 
                                        
                                        <Typography variant="h5" sx={{textAlign: "center"}}><b>{group_name}: {term}</b></Typography>
                                        {<Suspense fallback={<CircularProgress/>}>
                                            <TermViz
                                                elements={elements}
                                                view={searchParams.view}
                                                header_endpoint={(schema.header.tabs.filter(i=>i.component === 'KnowledgeGraph')[0] || {}).endpoint || '/'}
                                                tooltip_templates_edges={tooltip_templates_edges}
                                                tooltip_templates_nodes={tooltip_templates_nodes}
                                                /*enrichment_results = {enrichment_results}*/
                                            />
                                        </Suspense>}
                                    </>
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

export default Enrichment