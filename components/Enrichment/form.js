import dynamic from 'next/dynamic'
import React, { useEffect, useState, useRef } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { usePrevious, delay } from '.';
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'

import InfoIcon from '@mui/icons-material/Info'
import Grid from '@mui/material/Grid';

// const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormLabel = dynamic(()=>import('@mui/material/FormLabel'))
const FormGroup = dynamic(()=>import('@mui/material/FormGroup'))
const FormControlLabel = dynamic(()=>import('@mui/material/FormControlLabel'))
const Stack = dynamic(()=>import('@mui/material/Stack'))

const TextField = dynamic(() => import('@mui/material/TextField'));



const GeneSetForm = ({router, default_options, setLoading, libraries_list, get_controller, ...props}) => {
    const default_term_limit = default_options.term_limit
    const {page, ...rest} = router.query
    const [query, setQuery] = useState(rest||{})
    const [input, setInput] = useState({genes: [], description: ''})
    const [inputError, setInputError] = useState(false)

    const {
        userListId,
        gene_limit=default_options.gene_limit,
        min_lib=default_options.min_lib,
        gene_degree=default_options.gene_degree} = query
    
    const libraries = query.libraries ? JSON.parse(query.libraries) : default_options.selected
    
    
    const prevInput = usePrevious(input)

    const same_prev_input = async () => {
        if (!userListId) return false
        const {genes, description} = await (
            await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/view?userListId=${userListId}`)
        ).json()
        if (genes.join("\n") !== input.genes.join('\n')) return false
        if (description !== input.description) return false
        if (prevInput.genes.join('\n')!==input.genes.join('\n')) return false
        if (prevInput.description !== input.description) return false
        else return true
    }

    const checked_libraries = libraries.reduce((acc, i)=>({
        ...acc,
        [i.library]: i.term_limit
    }), {})

    const addList = async () => {
        try {
            setLoading(true)
            const formData = new FormData();
            // const gene_list = geneStr.trim().split(/[\t\r\n;]+/).join("\n")
            const {genes, description} = input
            const gene_list = genes.join("\n")
            formData.append('list', gene_list)
            formData.append('description', description)
            const controller = get_controller()
            const {shortId, userListId} = await (
                await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/addList`, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                })
            ).json()
            router.push({
                pathname: `/${page || ''}`,
                query: {...query, userListId},
                }, undefined, { shallow: true })
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(()=> {
        const resolve_genes = async () => {
            const {genes, description} = await (
                await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/view?userListId=${userListId}`)
            ).json()
            setInput({
                genes,
                description
            })
        }
        if (userListId) {
            resolve_genes()
        } else {
            setInput({genes: [], description: ''})
        }
        // setCollapsed(userListId!==undefined)
    }, [userListId])


    useEffect(()=>{    
        const {page, ...rest} = router.query
        setQuery(rest)
    }, [router.query])

    useEffect(()=>{
        const delayed_reset = async () => {
            await delay(1000)
            setInputError(false)
        }
        if (inputError) {
            delayed_reset()
        }
    }, [inputError])

    return (
        <FormGroup>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Grid container alignItems={"stretch"} spacing={1}>
                        <Grid item xs={12} sx={{marginBottom: 2}}>
                            <TextField multiline
                                rows={10}
                                placeholder={props.placeholder}
                                fullWidth
                                value={input.genes.join("\n")}
                                label="Gene Set"
                                onChange={(e)=>{
                                    setInput({
                                        ...input,
                                        genes: e.target.value.split(/[\t\r\n;]+/)
                                    })
                                }}
                            />
                        </Grid>
                        <Grid item style={{ flexGrow: 1 }}>
                            <TextField
                                variant='outlined'
                                value={input.description}
                                size="small"
                                onChange={e=>setInput({...input, description: e.target.value.trim().split(/[\t\r\n;]+/)})}
                                placeholder="Description"
                                label="Description"
                                style={{width: "100%"}}
                            />
                        </Grid>
                        <Grid item>
                            <Button 
                                onClick={async ()=>{
                                    if (!(await same_prev_input())) {
                                        if (input.genes.length > 0) {
                                            addList()
                                        }
                                    } else {
                                        router.push({
                                            pathname: `/${page || ''}`,
                                            query,
                                            }, undefined, { shallow: true }
                                        )
                                    }
                                }}
                                variant="contained"
                                // disabled={input.genes.length === 0}
                            >Submit</Button>
                        </Grid>
                        <Grid item xs={12} align="center">
                            <Button 
                                onClick={()=>{
                                    setInput({
                                        genes: props.example.split(/[\t\r\n;]+/),
                                        description: "Sample Input"
                                    })
                                }}
                                
                            >Try an Example</Button>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                                <Grid item><Typography>Gene Library Connectivity</Typography></Grid>
                                <Grid item style={{ flexGrow: 1 }}>
                                    <Tooltip title={`Filter out genes that are not in multiple libraries.`}>
                                        <Slider 
                                            value={min_lib || 1}
                                                onChange={(e, nv)=>{
                                                const new_query = {...query}
                                                new_query.min_lib = nv
                                                setQuery(new_query)
                                            }}
                                            style={{width: "100%"}}
                                            min={1}
                                            max={libraries_list.length}
                                            marks
                                            valueLabelDisplay='auto'
                                            aria-labelledby="gene-slider" />
                                        </Tooltip>
                                </Grid>
                                <Grid item xs={1}>
                                    <Typography>
                                        {min_lib || 1}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                            <Grid item><Typography>Gene Connectivity</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Tooltip title={`Filter out genes with fewer connections`}>
                                    <Slider 
                                        value={gene_degree || 1}
                                        onChange={(e, nv)=>{
                                            const new_query = {...query}
                                            new_query.gene_degree = nv
                                            setQuery(new_query)
                                        }}
                                        style={{width: "100%"}}
                                        min={1}
                                        max={libraries.reduce((acc, i)=>(acc+i.term_limit), 0)}
                                        marks
                                        valueLabelDisplay='auto'
                                        aria-labelledby="degree-slider" />
                                    </Tooltip>
                            </Grid>
                            <Grid item xs={1}>
                                <Typography>
                                    {gene_degree || 1}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                            <Grid item><Typography>Gene Limit</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Tooltip title={`How many genes should the knowledge graph return? (Prioritized by gene connectivity)`}>
                                    <Slider 
                                        value={query.gene_limit || input.genes.length || 100}
                                        onChange={(e, nv)=>{
                                            const new_query = {...query}
                                            new_query.gene_limit = nv
                                            setQuery(new_query)
                                        }}
                                        style={{width: "100%"}}
                                        min={1}
                                        max={input.genes.length || 100}
                                        valueLabelDisplay='auto'
                                        aria-labelledby="top-gene-slider" />
                                    </Tooltip>
                            </Grid>
                            <Grid item xs={1}>
                                <Typography>
                                    {query.gene_limit || input.genes.length || 100}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} md={6} align="left">
                    <FormLabel error={inputError}>Pick up to five libraries</FormLabel>
                    <Grid container>
                    {libraries_list.map(library=>(
                        <Grid item xs={12} key={library}>
                            <Stack direction="row" spacing={1}>
                                <FormControlLabel
                                    control={
                                        <Checkbox checked={checked_libraries[library] !== undefined} 
                                            onChange={()=>{
                                                if (checked_libraries[library]) {
                                                    if (libraries.length > 1) {
                                                        const new_query = {...query}
                                                        new_query.libraries = JSON.stringify(libraries.filter(i=>i.library !== library))
                                                        setQuery(new_query)
                                                    }
                                                } else if (libraries.length < 5 ){
                                                    const new_query = {...query}
                                                    new_query.libraries = JSON.stringify([...libraries, {
                                                        library,
                                                        term_limit: default_term_limit
                                                    }])
                                                    setQuery(new_query)
                                                } else {
                                                    setInputError(true)
                                                }
                                            }} 
                                            name={library}
                                        />
                                    }
                                    label={
                                    <Typography>
                                        {library.replaceAll("_", " ")}
                                    </Typography>}
                                    style={{width: "100%"}}
                                />
                                {checked_libraries[library] !== undefined &&
                                    <React.Fragment>
                                        <Tooltip title={`Top ${library.replaceAll("_", " ")} terms to include`}>
                                            <Slider 
                                                value={checked_libraries[library]}
                                                            onChange={(e, nv)=>{
                                                    const new_libraries = []
                                                    for (const i of libraries) {
                                                        if (i.library === library) new_libraries.push({
                                                            library,
                                                            term_limit: nv
                                                        })
                                                        else new_libraries.push(i)
                                                    }
                                                    const new_query = {...query}
                                                    new_query.libraries = JSON.stringify(new_libraries)
                                                    setQuery(new_query)
                                                }}
                                                style={{width: "100%"}}
                                                valueLabelDisplay='auto'
                                                min={1}
                                                max={50}
                                                aria-labelledby="limit-slider" />
                                        </Tooltip>   
                                        <Typography>{checked_libraries[library] || default_term_limit}</Typography>
                                    </React.Fragment>
                                }
                            </Stack>
                        </Grid>
                    ))}
                    </Grid>
                </Grid>
            </Grid>
        </FormGroup>
    )
}

export default GeneSetForm