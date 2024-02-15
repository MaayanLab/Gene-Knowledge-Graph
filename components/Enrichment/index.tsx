import dynamic from 'next/dynamic'
import React from 'react';

import { typed_fetch } from '../../utils/helper';
import {
    Grid,
    Stack,
    Typography,
    Card,
    CardContent
} from '@mui/material';
import GeneSetForm from './form';
import TermViz from './TermViz';
import { Summarizer } from './Summarizer';
import { UISchema } from '@/app/api/schema/route';
import { NetworkSchema } from '@/app/api/knowledge_graph/route';
import { parseAsJson } from 'next-usequerystate';
import InteractiveButtons from './InteractiveButtons';

export interface EnrichmentParams {
    libraries?: Array<{library: string, term_limit: number}>,
    userListId?: string,
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
    fullscreen?: boolean
}


const Enrichment = async ({
    libraries: l,
    sortLibraries,
    searchParams,
    ...props
}: {
    default_options?: {
        term_limit?: number,
        gene_limit?: number,
        min_lib?: number,
        gene_degree?: number,
        term_degree?: number,
        libraries: Array<{
            library: string,
            term_limit: number
        }>,
    },
    example?: {
        gene_set?: string,
    },
    libraries?: Array<{name: string, node: string, regex?: string}>,
    sortLibraries?: boolean,
    disableLibraryLimit?: boolean,
    title?: string,
    description?: string,
    searchParams: {
        q?:string
    }

}) => {
    const query_parser = parseAsJson<EnrichmentParams>().withDefault(props.default_options)
    const schema = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
    const libraries_list = sortLibraries ? l.sort(function(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
     }): l


    const tooltip_templates_node = {}
    const tooltip_templates_edges = {}
    for (const i of schema.nodes) {
        tooltip_templates_node[i.node] = i.display
    }

    for (const e of schema.edges) {
        for (const i of e.match) {
        tooltip_templates_edges[i] = e.display
        }
    }
    const geneLinksRelations = schema.edges.reduce((acc, i)=>{
        if (i.gene_link) return [...acc, ...i.match]
        else return acc
    }, [])    
    try {
        const parsedParams: EnrichmentParams = query_parser.parseServerSide(searchParams.q)
        const {
            userListId,
            gene_limit=props.default_options.gene_limit,
            min_lib=props.default_options.min_lib,
            gene_degree=props.default_options.gene_degree,
            term_degree=props.default_options.term_degree,
            expand,
            remove,
            augment_limit,
            gene_links
        } = parsedParams
        const libraries = parsedParams.libraries || []
        let elements:NetworkSchema = null
        let shortId = ''
        let genes = []
        if (userListId !==undefined && libraries.length > 0) {
            const request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/share?userListId=${userListId}`)
            if (request.ok) shortId = (await (request.json())).link_id
            console.log(JSON.stringify({
                userListId,
                libraries,
                min_lib,
                gene_limit,
                gene_degree,
                term_degree,
                expand,
                remove,
                augment_limit,
                gene_links
            }))
            const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/enrichment${parsedParams.augment===true ? '/augment': ''}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        userListId,
                        libraries,
                        min_lib,
                        gene_limit,
                        gene_degree,
                        term_degree,
                        expand,
                        remove,
                        augment_limit,
                        gene_links
                    }),
                })
            if (!res.ok) console.log(await res.text())
            else{
                elements = await res.json()
                genes = ((elements || {}).nodes || []).reduce((acc, i)=>{
                    if (i.data.kind === "Gene" && acc.indexOf(i.data.label) === -1) return [...acc, i.data.label]
                    else return acc
                }, [])
            }
        }
        return (
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Typography variant={"h2"}>{props.title || 'Enrichment Analysis'}</Typography>
                    <Typography variant={"subtitle1"}>Enter a set of Entrez gene below to perform enrichment analysis.</Typography>
                </Grid>
                <Grid item xs={12} md={elements===null?12:3}>
                    <Card elevation={0} sx={{borderRadius: "8px", backgroundColor: "tertiary.light"}}>
                        <CardContent>
                            <GeneSetForm 
                                libraries_list={libraries_list.map(l=>l.name)}
                                parsedParams={parsedParams}
                                fullWidth={elements===null}
                                elements={elements}
                                {...props}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                { elements!==null && 
                    <Grid item xs={12} md={9}>
                        <Stack direction={"column"} spacing={1}>
                            <InteractiveButtons 
                                default_libraries={props.default_options.libraries}
                                libraries_list={libraries_list.map(l=>l.name)}
                                disableLibraryLimit={props.disableLibraryLimit}
                                geneLinksRelations={geneLinksRelations}
                                shortId={shortId}
                                parsedParams={parsedParams}
                                // searchParams={parsedParams}
                                gene_count={genes.length}
                                elements={elements}
                            >
                                <Summarizer elements={elements} schema={schema} augmented={parsedParams.augment}/>
                            </InteractiveButtons>
                            <Card sx={{borderRadius: "24px"}}>
                                <CardContent>
                                    <TermViz
                                        elements={elements} 
                                        schema={schema}
                                        tooltip_templates_edges={tooltip_templates_edges}
                                        tooltip_templates_nodes={tooltip_templates_node}
                                    />
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                }
            </Grid>
        )
    } catch (error) {
        console.error(error)
        return null
    }
}

export default Enrichment