'use client'
import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from 'next/link'
import { Typography, TextField, Button, Autocomplete, Grid, Stack, Switch, FormControlLabel } from "@mui/material";
import { process_filter } from "@/utils/helper"
import { FilterSchema } from "@/utils/helper"

const AsyncFormComponent = ({direction,
    nodes, 
    filter,
    initial_query,
    setInputFilter,
    term = '',
    example,
}: {
		direction: string,
        initial_query: {[key: string]: string},
		nodes: {[key:string]: {[key:string]: any}},
		filter: {[key:string]: string},
        setInputFilter: Function,
        term: string,
        example?: Array<{
            node: string,
            field?: string,
            term: string
        }>
	}) => {
	const pathname = usePathname()
	if (Object.keys(filter || {}).length === 0) filter = initial_query
    const {
        start,
        start_term,
        end,
        end_term,
    }: {[key:string]: string} = filter

    const start_filter = {
        start,
        start_field: 'label',
        start_term
    }
    const end_filter = {
        end,
        end_field: 'label',
        end_term
    }

    
    const field = 'label'
    // const term = (direction === 'Start' ? start_term: end_term) || ''
    const type = (direction === 'Start' ? start: end) || ''
    const [inputTerm, setInputTerm] = useState<string>(term)
    const [controller, setController] = useState<{signal: AbortSignal, abort: Function} | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [options, setOptions] = useState<{[key:string]: {label: string, node_type: string}} | null>(null)
    const [selected, setSelected] = useState<{
        label: string,
        node_type: string
    }>(null)
    
    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
    }

    const resolve_options = async () => {
        try {
            const controller = get_controller()
            const query: {term?:string} = {
            }
            // if (filter) query.filter=JSON.stringify(filter)
            if (inputTerm) query.term = inputTerm
            const query_str = Object.entries(query).map(([k,v])=>(`${k}=${v}`)).join("&")
            const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/knowledge_graph/term_search${query_str ? "?" + query_str : ""}`, {
                method: 'GET',
                signal: controller.signal
            })
            let options:{[key:string]: {label: string, node_type: string}} = {}
            if (res.ok) options = await (res).json()
            const key = `${type}: ${inputTerm}`
            if (options[key]) setSelected(options[key])
            setOptions(options)  
        } catch (error) {
            // console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(()=>{
        resolve_options()
    }, [inputTerm])

    useEffect(()=>{
        if (term !== inputTerm) setInputTerm(term)
        setSelected({
            label: term,
            node_type: type
        })
    }, [term])

    useEffect(()=>{
        if (options && Object.keys(options).length) {
            const new_options = {}
            for (const v of Object.values(options || {})) {
                if (v[field]) {
                    new_options[v[field]] = v
                }
            }
            setOptions(new_options)
        }
    }, [field])
    return (
        <Grid container spacing={2} justifyContent="flex-start" alignItems="center">
            <Grid item xs={12}>
                <Typography variant="body1" color="secondary"><b>{direction} with</b></Typography>
            </Grid>
            <Grid item xs={12}>
                <Autocomplete
                    id="my-input" aria-describedby="gene" 
                    options={Object.values(options || {})}
                    groupBy={(option) => option.node_type}
                    getOptionLabel={option=>option.label}
                    value={selected}
                    loading={loading}
                    onChange={(evt, selected) => {
                        if (selected === null) {
                            setInputTerm('')
                            setSelected(selected)
                        }
                        else {
                            if (direction === 'Start') {
                                setSelected(selected)
                                setInputFilter({
                                    start: selected.node_type,
                                    start_field: 'label',
                                    start_term: selected.label,
                                    ...end_filter
                                })
                            } else {
                                setInputFilter({
                                            ...start_filter,
                                            end: selected.node_type,
                                            end_field: "label",
                                            end_term: selected.label,
                                })
                                    
                            }
                        }
                    }}
                    sx={{ width: '100%'}}
                    renderInput={(params) => (
                    <TextField {...params} 
                        value={inputTerm}
                        sx={{
                            width: '100%',
                            height: 50,
                            borderRadius: 5,
                            padding: 0
                        }}
                        onChange={(e)=> setInputTerm(e.target.value)}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: null,
                            style: {
                                fontSize: 16,
                                height: 45,
                                width: "100%",
                                paddingLeft: 5,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignContent: "flex-start",
                                backgroundColor: "#FFF"
                            }
                        }}
                        inputProps={{
                            ...params.inputProps,
                            style: {width: "100%"}
                          }}
                    />
                    )}
                />
            </Grid>
            <Grid item xs={12}>
                <Stack>
                    <Typography variant="caption">Example</Typography>
                    {example !== undefined ? 
                        example.map(({node, field, term})=>{
                            let query = {}
                            if (direction === 'Start') {
                                query = {
                                    start: node,
                                    start_field: field || "label",
                                    start_term: term,
                                }
                                if (end_filter.end) {
                                    query = {
                                        ...query,
                                        ...end_filter
                                    }
                                }
                            } else {
                                query = {
                                    ...start_filter,
                                    end: node,
                                    end_field: field || "label",
                                    end_term: term,
                                }
                            }
                            return (
                                <Link
                                    key={term}
                                    href={{
                                        pathname,
                                        query: {
                                            filter: JSON.stringify(query)
                                        },
                                        // relation
                                    }}
                                    onClick={()=>{
                                        setInputFilter(query)
                                    }}
                                    // shallow
                                >
                                <Button sx={{padding: 0, justifyContent: "flex-start"}}><Typography variant="body2" color="secondary" sx={{textAlign: "left"}}>{term}</Typography></Button>
                            </Link> 
                        )
                        })
                    :((nodes[Object.keys(nodes)[0]] || {}).example || []).map((e,i)=>{
                        let query = {}
                        if (direction === 'Start') {
                            query = {
                                start: Object.keys(nodes)[0],
                                start_field: "label",
                                start_term: e,
                            }
                            if (end_filter.end) {
                                query = {
                                    ...query,
                                    ...end_filter
                                }
                            }
                        } else {
                            query = {
                                ...start_filter,
                                end: Object.keys(nodes)[0],
                                end_field: "label",
                                end_term: e,
                            }
                        }
                        return (
                            <Link
                                key={e}
                                href={{
                                    pathname,
                                    query: {
                                        filter: JSON.stringify(query)
                                    },
                                    // relation
                                }}
                                // shallow
                            >
                            <Button sx={{padding: 0, justifyContent: "flex-start"}}><Typography variant="body2" color="secondary" sx={{textAlign: "left"}}>{e}</Typography></Button>
                        </Link> 
                    )
                    })}
                </Stack>
            </Grid>
            
            {direction === "Start" && 
                <Grid item xs={12}>
                    <Stack direction={'row'} alignItems={"center"} justifyContent={'space-between'}>
                        <Typography variant="caption">End Node</Typography>
                        <Switch 
                            color="secondary" 
                            checked={filter.end !== undefined}
                            onChange={()=>{
                                if (filter.end) {
                                    const {relation, end, end_field, end_term, augment, augment_limit, additional_link_tags, ...filt} = filter
                                    setInputFilter(filt)
                                } else {
                                    const {relation, augment, augment_limit, additional_link_tags, ...f}: {
                                        start?: string,
                                        start_term?: string,
                                        end?: string,
                                        end_term?: string,
                                        relation?: string| Array<string | {name?: string, limit?: string}>,
                                        limit?: number,
                                        page?: number,
                                        filter?: FilterSchema,
                                        [key: string]: any
                                    } = filter
                                    setInputFilter({
                                        ...f,
                                        end: nodes['lncRNA'] !== undefined ? 'lncRNA': Object.keys(nodes)[0],
                                        end_field: 'label',
                                    })
                                }
                            }}
                        />
                    </Stack>
                </Grid>
            }
        </Grid>
    )
}

export default AsyncFormComponent