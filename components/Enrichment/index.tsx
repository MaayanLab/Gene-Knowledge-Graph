import React from 'react';
import Link from 'next/link';
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
import { fetch_kg_schema } from '@/utils/initialize';
import TooltipComponentGroup from '../TermAndGeneSearch/tooltip';

export interface EnrichmentParams {
    libraries?: Array<{
        name?: string,
        limit?: number,
        library?: string,
        term_limit?: number, 
    }>,
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
    additional_link_tags?: Array<string>,
}


const Enrichment = async ({
    libraries: l,
    sortLibraries,
    searchParams,
    endpoint,
    ...props
}: {
    default_options?: {
        // term_limit?: number,
        gene_limit?: number,
        min_lib?: number,
        gene_degree?: number,
        term_degree?: number,
        libraries: Array<{
            name?: string,
            limit?: number,
            library?: string,
            term_limit?: number
        }>,
    },
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
        fullscreen?: 'true'

    },
    endpoint: string,
    additional_link_relation_tags?: Array<string>

}) => {
    const query_parser = parseAsJson<EnrichmentParams>().withDefault(props.default_options)
    console.log("Getting schema...")
    const schema = await fetch_kg_schema()
    console.log("Schema fetched")
    const libraries_list = sortLibraries ? l.sort(function(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
     }): l


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
        parsedParams.libraries = (parsedParams.libraries || []).map(({name, library, limit, term_limit})=>({
            name: name || library,
            limit: limit || term_limit,
        }))
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
        let input_desc
        if (userListId !==undefined && libraries.length > 0) {
            console.log("Getting description...")
            const desc_request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/view?userListId=${userListId}`)
            if (desc_request.ok) input_desc = (await (desc_request.json())).description
            console.log("Getting shortID...")
            console.log(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/share?userListId=${userListId}`)
            const request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/share?userListId=${userListId}`)
            if (request.ok) shortId = (await (request.json())).link_id
            else console.log(`failed ${process.env.NEXT_PUBLIC_ENRICHR_URL}/share?userListId=${userListId}`)
            console.log(`ShortID: ${shortId}`)
            console.log(`Enrichment ${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/enrichment${parsedParams.augment===true ? '/augment': ''}`)
            const res = await fetch(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/enrichment${parsedParams.augment===true ? '/augment': ''}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        userListId,
                        libraries: libraries.map(({name, limit, library, term_limit})=>({
                            library: library || name,
                            term_limit: limit || term_limit
                        })),
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
            if (!res.ok) {
                console.log(`failed connecting to ${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/enrichment${parsedParams.augment===true ? '/augment': ''}`)
                console.log(await res.text())
            }
            else{
                console.log(`fetched`)
                elements = await res.json()
                genes = ((elements || {}).nodes || []).reduce((acc, i)=>{
                    if (i.data.kind === "Gene" && acc.indexOf(i.data.label) === -1) return [...acc, i.data.label]
                    else return acc
                }, [])
            }
        }
        const payload = {
            'url': `${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}${endpoint}?q=${searchParams.q}`,
            'apikey': process.env.NEXT_PUBLIC_TURL  
        }
        console.log("Getting short url")
        const request = await fetch(process.env.NEXT_PUBLIC_TURL_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
        let short_url=null
        if (request.ok) short_url = (await request.json())['shorturl']
        else console.log("failed turl")
        console.log("Got url")
        return (
            <Grid container spacing={1} alignItems={"flex-start"}>
                <Grid item xs={12}>
                    <Typography variant={"h2"}>{props.title || 'Enrichment Analysis'}</Typography>
                    { props.disableHeader ? <Typography variant={"subtitle1"}>Enter a set of Entrez gene below to perform enrichment analysis.</Typography>:
                        <Typography variant="subtitle1" sx={{marginBottom: 3}}>Submit your gene set for enrichment analysis with &nbsp;
                            <Link href={shortId ? `https://maayanlab.cloud/Enrichr/enrich?dataset=${shortId}` : "https://maayanlab.cloud/Enrichr/"} 
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{color: "black", textDecoration: "none"}}
                            >
                                <span style={{fontSize: 20, fontWeight: 500, letterSpacing: '0.1em'}}>En</span><span style={{color: 'red', fontSize: 20, fontWeight: 500, letterSpacing: '0.1em'}}>rich</span><span style={{fontSize: 20, fontWeight: 500, letterSpacing: '0.1em'}}>r</span>
                            </Link>
                        </Typography>
                    }
                </Grid>
                <Grid item xs={12} md={elements===null?12:3}>
                    <Card elevation={0} sx={{borderRadius: "8px", backgroundColor: (!schema.ui_theme || schema.ui_theme === 'cfde_theme' || elements !== null) ? "tertiary.light": "#FFF"}}>
                        <CardContent>
                            <GeneSetForm 
                                libraries_list={libraries_list.map(l=>l.name)}
                                parsedParams={parsedParams}
                                fullWidth={elements===null}
                                elements={elements}
                                {...props}
                            />
                            <TooltipComponentGroup
                            elements={elements}
                                tooltip_templates_edges={tooltip_templates_edges}
                                tooltip_templates_nodes={tooltip_templates_nodes}
                                schema={schema}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                { elements!==null && 
                    <Grid item xs={12} md={9}>
                        <Stack direction={"column"} alignItems={"flex-start"} spacing={1}>
                            <InteractiveButtons 
                                libraries_list={libraries_list.map(l=>l.name)}
                                disableLibraryLimit={props.disableLibraryLimit}
                                hiddenLinksRelations={hiddenLinksRelations}
                                shortId={shortId}
                                parsedParams={parsedParams}
                                // searchParams={parsedParams}
                                fullscreen={searchParams.fullscreen}
                                gene_count={genes.length}
                                elements={elements}
                                short_url={short_url}
                                additional_link_relation_tags={props.additional_link_relation_tags}
                            >
                                <Summarizer elements={elements} schema={schema} augmented={parsedParams.augment}/>
                            </InteractiveButtons>
                            <Card sx={{borderRadius: "24px", minHeight: 450, width: "100%"}}>
                                <CardContent>
                                    {input_desc && 
                                        <Typography variant='h5' sx={{textAlign: "center"}}><b>{input_desc}</b></Typography>
                                    }
                                    <TermViz
                                        elements={elements} 
                                        schema={schema}
                                        tooltip_templates_edges={tooltip_templates_edges}
                                        tooltip_templates_nodes={tooltip_templates_nodes}
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