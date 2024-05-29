'use client'
import React, { ReactNode, useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Selector } from "../misc"
import Link from 'next/link'
import { Typography, TextField, Button, Autocomplete, Grid, Stack, Switch, FormControlLabel } from "@mui/material";
import { router_push } from "@/utils/client_side"
import { process_filter } from "@/utils/helper"
import { FilterSchema } from "@/utils/helper"

const AsyncFormComponent = ({direction,
    nodes, 
    searchParams,
    initial_query
}: {
		direction: string,
        initial_query: {[key: string]: string},
		nodes: {[key:string]: {[key:string]: any}},
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
	}) => {
	const router = useRouter()
	const {filter: f, ...rest} = searchParams
	const pathname = usePathname()
    let filter = JSON.parse(f || '{}')
	if (Object.keys(filter).length === 0) filter = initial_query
    const {
        start,
        start_field='label',
        start_term,
        end,
        end_field='label',
        end_term,
    }: {[key:string]: string} = filter

    const start_filter = {
        start,
        start_field,
        start_term
    }
    const end_filter = {
        end,
        end_field,
        end_term
    }

    
    const field = direction === 'Start' ? start_field: end_field
    const term = (direction === 'Start' ? start_term: end_term) || ''
    const [inputTerm, setInputTerm] = useState<string>(term)
    const [type, setType] = useState<string>('')
    const [controller, setController] = useState<{signal: AbortSignal, abort: Function} | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [options, setOptions] = useState<{[key:string]: {[key:string]: string|number}} | null>(null)
    const [selected, setSelected] = React.useState(null)

    useEffect(()=>{
        if (Object.keys(filter).length===0) {
            if (direction === 'Start') {
                router_push(router, pathname, {
                    filter: JSON.stringify(initial_query)
                })
            }
        } else {
            const type = direction === 'Start' ? start: end
            if (type) setType(type)
        }
    }, [filter])
    
    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
    }

    const resolve_options = async () => {
        try {
            if (type !== ''){
                const controller = get_controller()
                const query = {
                    type,
                    field,
                    term: ""
                }
                // if (filter) query.filter=JSON.stringify(filter)
                if (inputTerm) query.term = inputTerm
                const query_str = Object.entries(query).map(([k,v])=>(`${k}=${v}`)).join("&")
                const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/node_search${query_str ? "?" + query_str : ""}`, {
                    method: 'GET',
                    signal: controller.signal
                })
                let options:{[key:string]: {[key:string]: string|number}} = {}
                if (res.ok) options = await (res).json()
                if (inputTerm) setSelected(options[inputTerm])
                // else if (direction === 'Start') {
                //     router_push(router, pathname, {
                //         ...rest,
                //         filter: JSON.stringify({
                //             ...filter,
                //             start_term: Object.keys(options)[0],
                //         })
                //     })
                // } 
                else {
                    setSelected(null)
                }
                setOptions(options)  
            }
        } catch (error) {
            // console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(()=>{
        if (term !== inputTerm) setInputTerm(term)
    }, [term])

    useEffect(()=>{
        if (inputTerm !== (selected || {})[field]) resolve_options()
    }, [inputTerm, type])

    useEffect(()=>{
        if (options && Object.keys(options).length) {
            const new_options = {}
            for (const v of Object.values(options)) {
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
                <Selector 
                    entries={Object.keys(nodes).sort()} 
                    value={type} 
                    prefix={direction} 
                    onChange={(type:string)=>{
                        if (direction === 'Start') {
                            setInputTerm('')
                            router_push(router, pathname,
                                {
                                    // ...rest,
                                    filter: JSON.stringify({
                                        start: type,
                                        start_field: field,
                                        start_term: nodes[type].example[0]
                                    })
                                }
                            )
                        } else {
                            setInputTerm('')
                            router_push(router, pathname,
                                {
                                    // ...rest,
                                    filter: JSON.stringify({
                                        ...start_filter,
                                        end: type,
                                        end_field: field,
                                        // end_term: nodes[type].example[0]
                                    })
                                }
                            )
                        }
                }}/>
            </Grid>
            <Grid item xs={12}>
                <Selector entries={(nodes[type] || {}).search || []} value={field} prefix={`${type}field`} onChange={(field)=>{
                    const new_term = (selected || {})[field]
                    if (direction === 'Start') {
                        const f = {
                            start: type,
                            start_field: field,
							start_term: '',
                            ...end_filter
                        }
                        if (new_term) f.start_term = new_term
						router_push(router, pathname,
							{
                                ...rest,
                                filter: JSON.stringify(f)
                            }
						)
                    } else {
                        const f = {
                            ...start_filter,
                            end: type,
                            end_field: field,
							end_term: ''
                        }
                        if (new_term) f.end_term = new_term
                        router_push(router, pathname,
							{
                                ...rest,
                                filter: JSON.stringify(f)
                            }
						)
                    }
                    
                }}/>
            </Grid>
            <Grid item xs={12}>
                <Autocomplete
                    id="my-input" aria-describedby="gene" 
                    options={Object.keys(options || {})}
                    value={term}
                    loading={loading}
                    onChange={(evt, term) => {
                        if (term === null) term = ''
                        setInputTerm(term)
                        if (direction === 'Start') {
							router_push(router, pathname,
								{
                                    ...rest,
                                    filter: JSON.stringify({
                                        start: type,
                                        start_field: field,
                                        start_term: term,
                                        ...end_filter
                                    })
                                }
							)
                        } else {
							router_push(router, pathname,
								{
                                    ...rest,
                                    filter: JSON.stringify({
                                        ...start_filter,
                                        end: type,
                                        end_field: field,
                                        end_term: term,
                                    })
                                }
							)
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
                    {((nodes[type] || {}).example || []).map((e,i)=>{
                        let query = {}
                        if (direction === 'Start') {
                            query = {
                                start: type,
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
                                end: type,
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
                            <Button sx={{padding: 0}}><Typography variant="body2" color="secondary">{e}</Typography></Button>
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
                                    // const {filter, ...rest} = searchParams
                                    // c
                                    const {relation, end, end_term, end_field, ...filt} = filter
                            
                                    const query = process_filter({
                                        ...rest,
                                        filter: filt
                                    })
                                    router_push(router, pathname, query)
                                } else {
                                    // const {filter, ...rest} = searchParams
                                    const {relation, ...f}: {
                                        start?: string,
                                        start_field?: string,
                                        start_term?: string,
                                        end?: string,
                                        end_field?: string,
                                        end_term?: string,
                                        relation?: string| Array<string | {name?: string, limit?: string}>,
                                        limit?: number,
                                        page?: number,
                                        filter?: FilterSchema,
                                        [key: string]: any
                                    } = filter
                                    const query = process_filter({
                                        ...rest,
                                        filter: {
                                            ...f,
                                            end: nodes['Gene'] !== undefined ? 'Gene': Object.keys(nodes)[0],
                                            end_field: 'label',
                                        }
                                    })
                                    router_push(router, pathname, query)
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