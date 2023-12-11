import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'

import Link from 'next/link'
import { withRouter } from 'next/router';


const Grid = dynamic(() => import('@mui/material/Grid'));

// const Chip = dynamic(() => import('@mui/material/Chip'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const Button = dynamic(() => import('@mui/material/Button'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));

const Selector = dynamic(async () => (await import('../misc')).Selector);

const AsyncFormComponent = ({direction,
    router, 
    button_component,
    nodes, 
    selected, 
    setSelected}) => {
    const {
        filter:f,
        page,
        ...rest
    } = router.query
    const filter = JSON.parse(f || '{}')
    const {
        start,
        start_field='label',
        start_term,
        end,
        end_field='label',
        end_term,
    } = filter

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
    const type = direction === 'Start' ? start: end
    const field = direction === 'Start' ? start_field: end_field
    const term = (direction === 'Start' ? start_term: end_term) || ''
    const [inputTerm, setInputTerm] = useState(term)
    const [controller, setController] = useState(null)
    const [loading, setLoading] = useState(false)
    const [options, setOptions] = useState(null)

    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
    }
  
    const resolve_options = async () => {
        try {
            const controller = get_controller()
            const query = {
                type,
                field,
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
                router.push({
                    pathname: `/${page || ''}`,
                    query: {
                        ...rest,
                        filter: JSON.stringify({
                            ...filter,
                            start_term: Object.keys(options)[0],
                        })
                    }
                }, undefined, {shallow: true})
            } else {
                setSelected(null)
            }
            setOptions(options)  
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
    if (!router.isReady || type === undefined) return null
    return (
        <Grid container spacing={2} justifyContent="flex-start" alignItems="center">
            <Grid item>
                <Typography variant="body1"><b>{direction} with</b></Typography>
            </Grid>
            <Grid item>
                <Selector entries={Object.keys(nodes).sort()} value={type} prefix={direction} onChange={(type)=>{
                    if (direction === 'Start') {
                        setInputTerm('')
                        router.push({
                            pathname: `/${page || ''}`,
                            query: {
                                ...rest,
                                filter: JSON.stringify({
                                    start: type,
                                    start_field: field,
                                })
                            }
                        }, undefined, {shallow: true})
                    } else {
                        setInputTerm('')
                        router.push({
                            pathname: `/${page || ''}`,
                            query: {
                                ...rest,
                                filter: JSON.stringify({
                                    ...start_filter,
                                    end: type,
                                    end_field: field
                                })
                            }
                        }, undefined, {shallow: true})
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
                            ...end_filter
                        }
                        if (new_term) f.start_term = new_term
                        router.push({
                            pathname: `/${page || ''}`,
                            query: {
                                ...rest,
                                filter: JSON.stringify(f)
                            }
                        }, undefined, {shallow: true})
                    } else {
                        const f = {
                            ...start_filter,
                            end: type,
                            end_field: field,
                        }
                        if (new_term) f.end_term = new_term
                        router.push({
                            pathname: `/${page || ''}`,
                            query: {
                                ...rest,
                                filter: JSON.stringify(f)
                            }
                        }, undefined, {shallow: true})
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
                            router.push({
                                pathname: `/${page || ''}`,
                                query: {
                                    ...rest,
                                    filter: JSON.stringify({
                                        start: type,
                                        start_field: field,
                                        start_term: term,
                                        ...end_filter
                                    })
                                }
                            }, undefined, {shallow: true})
                        } else {
                            router.push({
                                pathname: `/${page || ''}`,
                                query: {
                                    ...rest,
                                    filter: JSON.stringify({
                                        ...start_filter,
                                        end: type,
                                        end_field: field,
                                        end_term: term,
                                    })
                                }
                            }, undefined, {shallow: true})
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
                                fontSize: 12,
                                height: 45,
                                width: "100%",
                                paddingLeft: 5
                            }
                        }}
                        inputProps={{
                            ...params.inputProps,
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
                                pathname: `/${page || ''}`,
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
            {button_component && 
                <Grid item>
                    {button_component()}
                </Grid>
            }
        </Grid>
    )
}

export default withRouter(AsyncFormComponent)