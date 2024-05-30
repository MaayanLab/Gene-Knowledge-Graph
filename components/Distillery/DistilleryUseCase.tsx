import React from "react";
import dynamic from "next/dynamic";
import { initialize_kg } from "../TermAndGeneSearch";

import { Grid, Typography, CircularProgress, Stack, Card, CardContent } from '@mui/material'
import AsyncForm from "./AsyncForm";
import Form from "./Form";
import NetworkTable from "../TermAndGeneSearch/network_table";
const Cytoscape = dynamic(()=>import('../Cytoscape'),
    {
        ssr: false,
        loading: ()=><CircularProgress/>
    }
)
async function DistilleryUseCase({
        relations=[],
        title,
        description,
        endpoint,
        type,
        searchParams,
        fields,
        default_term,
        checkbox_filter,
        filter_text,
        options_endpoint
    } : {
        relations?: Array<{name: string, end?:string}>,
        title?: string,
        description?: string,
        endpoint?: string,
        type?: string,
        fields?: Array<string>,
        default_term?: string,
        checkbox_filter?:{[key:string]: any},
        filter_text?: string,
        options_endpoint?: string,
        searchParams: {
            term?: string,
            field?: string,
            limit?: string,
            fullscreen?:'true',
            view?:string,
            type?: string,
        }
    }) {
        const {
            schema,
            tooltip_templates_nodes,
            tooltip_templates_edges,
        } = await initialize_kg()
        const controller = new AbortController()
        try {
            const field = searchParams.field || "label"
            const term = searchParams.term || default_term
            const limit = searchParams.limit || 5
            const node_type = searchParams.type || type
            if (!fields) {
                const current_node = schema.nodes.filter(i=>i.node == node_type)
                if (current_node.length == 0) console.error("Invalid node")
                else {
                    fields = current_node[0].search
                }
            }
            const relation = relations.map(rel=>{
                if (typeof rel === 'string') {
                    return {name: rel, limit: parseInt(searchParams.limit) || 5}
                } else if (typeof rel === "object") {
                    return {limit: parseInt(searchParams.limit)|| 5, ...rel}
                }
            })
            let elements = null
            if (term) {
                const body = {
                    start: node_type,
                    start_term: term,
                    start_field: field,
                    limit
                }
                if (relation.length) body["relation"] = relation
                console.log(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}${endpoint}?filter=${JSON.stringify(body)}`)
                const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}${endpoint}?filter=${JSON.stringify(body)}`,
                    {
                    method: 'GET',
                    signal: controller.signal,
                    }
                ) 
                
                if (res.ok) elements = await res.json()
                else console.error(await res.text())
            }
            
            return (
                <Grid container spacing={2}>
                    {title && <Grid item xs={12}>
                        <Typography variant={"h2"}>{title}</Typography>
                    </Grid>}
                    {description && <Grid item xs={12}>
                        <Typography variant={"subtitle1"}>{description}</Typography>
                    </Grid>}
                    <Grid item xs={12} md={3}>
                        <Card elevation={0} sx={{borderRadius: "8px", backgroundColor: "tertiary.light"}}>
                            <CardContent>
                                <AsyncForm 
                                    default_term={default_term}
                                    checkbox_filter={checkbox_filter}
                                    filter_text={filter_text}
                                    type={node_type}
                                    fields={fields}
                                    options_endpoint={options_endpoint}
                                    searchParams={searchParams}
                                    elements={elements}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={9}>
                        <Stack spacing={2}>
                            <Form
                                elements={elements}
                                searchParams={searchParams}
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

export default DistilleryUseCase