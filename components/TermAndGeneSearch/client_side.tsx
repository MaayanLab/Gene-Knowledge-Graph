'use client'
import React, { useRef, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { process_tables } from '../../utils/helper';
import { usePrevious } from '@/utils/client_side';
import { 
    Typography,
    Grid,
    Container,
    CircularProgress,
    Backdrop,
} from '@mui/material';
import { TooltipCard } from '../misc/client_side';
import { Legend } from '../misc';
import { StartButton, EndButton } from './buttons';
import Form from './form';
import AsyncFormComponent from './async_form';
import NetworkTable from './network_table';
import { router_push } from '@/utils/client_side';

import { layouts } from './form';
import { UISchema } from '@/app/api/schema/route';
import { NetworkSchema } from '@/app/api/knowledge_graph/route';
import dynamic from 'next/dynamic';

const Cytoscape = dynamic(()=>import('../Cytoscape'),
    {
        ssr: false,
        loading: ()=><CircularProgress/>
    }
)
export default function ClientTermAndGeneSearch(props: {
    title: string,
    description: string,
    schema: UISchema,
	nodes: {[key: string]: any},
    edges: Array<string>,
    initial_query: {[key: string]: string}
    searchParams: {
        filter?: string,
        fullscreen?: 'true',
        view?:string,
        tooltip?: 'true',
        edge_labels?: 'true',
        legend?: 'true',
        legend_size?: string,
        layout?: string,
    },
    elements: null | NetworkSchema,
    tooltip_templates_edges?: {[key: string]: string},
    tooltip_templates_nodes?: {[key: string]: string},
    coexpression_prediction?: boolean,
    gene_link_button?: boolean,
    neighborCount?: number,
    geneLinksRelations: Array<string>,
},){
    const {
        title, 
        description, 
        schema, 
        nodes, 
        initial_query={}, 
        searchParams,
        tooltip_templates_edges,
        tooltip_templates_nodes,
        elements,
        edges,
        coexpression_prediction,
        gene_link_button,
        neighborCount,
        geneLinksRelations
    } = props
    const pathname = usePathname()
    const router = useRouter()
    const {
        filter:f,
        edge_labels,
        view = "network",
        tooltip,
        layout="Hierarchical Layout",
        legend,
        legend_size=0,
    } = searchParams
    const tableref = useRef(null);
    const networkref = useRef(null);
    
    const [node, setNode] = React.useState(null)
    const [edge, setEdge] = React.useState(null)
    const [focused, setFocused] = React.useState(null)
    const [startSelected, setStartSelected] = React.useState(null)
    const [endSelected, setEndSelected] = React.useState(null)
    const filter = JSON.parse(f || '{}')
    useEffect(()=>{
        if (f === undefined || f === '{}') {
            router_push(router, pathname, {
                filter: JSON.stringify(initial_query)
            })
        }
    }, [f])

    
    const genes = ((elements || {}).nodes || []).reduce((acc, i)=>{
        if (i.data.kind === "Gene" && acc.indexOf(i.data.label) === -1) return [...acc, i.data.label]
        else return acc
    }, [])
    // if (!elements) return null
    return (
        <Grid container spacing={1}>
            <Grid item xs={12}>
                <AsyncFormComponent 
                    nodes={nodes}
                    direction={'Start'}
                    button_component={()=>(!filter.end && <StartButton nodes={nodes}/>)}
                    selected={startSelected}
                    setSelected={setStartSelected}
                    searchParams={searchParams}
                />
            </Grid>
            {filter.end && <Grid item xs={12}>
                <AsyncFormComponent 
                    nodes={nodes}
                    direction={'End'}
                    button_component={()=><EndButton/>}
                    selected={endSelected}
                    setSelected={setEndSelected}
                    searchParams={searchParams}
                />
            </Grid>}
            <Grid item xs={12}>
                <Form searchParams={searchParams}
                    edges={edges}
                    genes={genes}
                    coexpression_prediction={coexpression_prediction}
                    gene_link_button={gene_link_button}
                    neighborCount={neighborCount}
                    geneLinksRelations={geneLinksRelations}
                    elements={elements}
                />
            </Grid>
            {view === "network" && 
                <Grid item xs={12} id="kg-network" style={{minHeight: 500, position: "relative"}} ref={networkref}>
                    {(elements === null) ? (
                        // <Backdrop
                        //     sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        //     open={elements === null}
                        // >
                        //     <CircularProgress/>
                        // </Backdrop> 
                        null
                    ) : elements.nodes.length === 0 ? (
                        <div>No results</div>
                    ) : 
                       <Cytoscape elements={elements}
                        setNode={setNode}
                        setEdge={setEdge}
                        setFocused={setFocused}
                        edge_labels={edge_labels}
                        layout={layout}
                        focused={focused}
                        node={node}
                        edge={edge}
                       /> 
                    }
                </Grid>
            }
            {view === 'table' && 
                <Grid item xs={12} sx={{minHeight: 700}}>
                    <div ref={tableref}>
                        <NetworkTable data={elements} schema={schema}/>
                    </div>
                </Grid>
                }
        </Grid>
    )
} 