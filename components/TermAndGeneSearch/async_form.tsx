'use client'
import React, { ReactNode, useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Selector } from "../misc"
import Link from 'next/link'
import { Typography, TextField, Button, Autocomplete, Grid } from "@mui/material";
import { router_push } from "@/utils/client_side"
import { FormButton } from "./buttons"
const AsyncFormComponent = ({direction,
    button_type,
    nodes, 
    searchParams,
    initial_query
}: {
		direction: string,
        initial_query: {[key: string]: string},
		button_type: 'start'| 'end' | 'none',
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
	const filter = JSON.parse(f || '{}')
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

    useEffect(()=>{
        if (button_type === 'start') {
            if (f === undefined || f === '{}') {
                router_push(router, pathname, {
                    filter: JSON.stringify(initial_query)
                })
            }
        }
    }, [f])
    const type = direction === 'Start' ? start: end
    const field = direction === 'Start' ? start_field: end_field
    const term = (direction === 'Start' ? start_term: end_term) || ''
    const [inputTerm, setInputTerm] = useState<string>(term)
    const [controller, setController] = useState<{signal: AbortSignal, abort: Function} | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [options, setOptions] = useState<{[key:string]: {[key:string]: string|number}} | null>(null)
    const [selected, setSelected] = React.useState(null)
    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
    }

    const resolve_options = async () => {
        try {
            if (type !== undefined){
                const controller = get_controller()
                const query = {
                    type,
                    field,
                    term: ""
                }
                // if (filter) query.filter=JSON.stringify(filter)
                if (inputTerm) query.term = inputTerm
                const query_str = Object.entries(query).map(([k,v])=>(`${k}=${v}`)).join("&")
                const options = await (await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/node_search${query_str ? "?" + query_str : ""}`, {
                    method: 'GET',
                    signal: controller.signal
                })).json()
                if (inputTerm) setSelected(options[inputTerm])
                else if (direction === 'Start') {
                    router_push(router, pathname, {
                        ...rest,
                        filter: JSON.stringify({
                            ...filter,
                            start_term: Object.keys(options)[0],
                        })
                    })
                } else {
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
    if (type === undefined) return null
    return (
        <Grid container spacing={2} justifyContent="flex-start" alignItems="center">
            <Grid item>
                <Typography variant="body1"><b>{direction} with</b></Typography>
            </Grid>
            <Grid item>
                <Selector entries={Object.keys(nodes).sort()} value={type} prefix={direction} onChange={(type:string)=>{
                    if (direction === 'Start') {
                        setInputTerm('')
						router_push(router, pathname,
							{
								...rest,
								filter: JSON.stringify({
									start: type,
									start_field: field,
								})
							}
						)
                    } else {
                        setInputTerm('')
						router_push(router, pathname,
							{
                                ...rest,
                                filter: JSON.stringify({
                                    ...start_filter,
                                    end: type,
                                    end_field: field
                                })
                            }
						)
                    }
                    
                }}/>
            </Grid>
            <Grid item>
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
            <Grid item>
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
                    style={{ width: 220}}
                    renderInput={(params) => (
                    <TextField {...params} 
                        value={inputTerm}
                        style={{
                            width: 220,
                            height: 50,
                            borderRadius: 5,
                            padding: 3
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
                                alignContent: "flex-start"
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
            {direction === "Start" &&<Grid item>
                <Typography variant="body1">Example:</Typography>
            </Grid>}
            {direction === "Start" && ((nodes[type] || {}).example || []).map((e,i)=>(
                <React.Fragment key={e}>
                    <Grid item>
                        <Link
                            href={{
                                pathname,
                                query: {
                                    filter: JSON.stringify({
                                        start: type,
                                        start_field: "label",
                                        start_term: e,
                                    })
                                // relation
                                }
                            }}
                            shallow
                        >
                        <Button style={{height: 45}}><Typography variant="body2" color="secondary">{e}</Typography></Button>
                        </Link> 
                    </Grid>
                    { i < (nodes[type] || {}).example.length - 1 && 
                        <Grid item><Typography>/</Typography></Grid>
                    }
                </React.Fragment>
            ))}
            {button_type !== 'none' && 
                <Grid item>
                    <FormButton type={button_type} nodes={nodes} searchParams={searchParams}/>
                </Grid>
            }
        </Grid>
    )
}

export default AsyncFormComponent