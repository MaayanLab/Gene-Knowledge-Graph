import dynamic from 'next/dynamic'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

import Tooltip from '@mui/material/Tooltip';
import { usePrevious, delay } from '.';
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'

import Grid from '@mui/material/Grid';

// const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormLabel = dynamic(()=>import('@mui/material/FormLabel'))
const FormGroup = dynamic(()=>import('@mui/material/FormGroup'))
const FormControlLabel = dynamic(()=>import('@mui/material/FormControlLabel'))
const Stack = dynamic(()=>import('@mui/material/Stack'))

const TextField = dynamic(() => import('@mui/material/TextField'));


const GeneSetForm = ({default_options, setLoading, libraries_list, get_controller, loading, setError, ...props}) => {
    const router = useRouter()
    const default_term_limit = default_options.term_limit
    const {page, ...query} = router.query
    const [input, setInput] = useState({genes: [], description: ''})
    const [inputError, setInputError] = useState(false)
    const [libStart, setLibStart] = useState(0)

    const {
        userListId,
        gene_limit=default_options.gene_limit,
        min_lib=default_options.min_lib,
        gene_degree=default_options.gene_degree,
        term_degree=default_options.term_degree,
    } = query
    
    const libraries = query.libraries ? JSON.parse(query.libraries) : []
    
    const prevInput = usePrevious(input)

    const same_prev_input = async () => {
        if (!userListId) return false
        let counter = 0
        while (counter < 5) {
            const request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/view?userListId=${userListId}`)
            if (! request.ok && counter === 4) {
                setError({message: "Error resolving previous input. Try again in a while.", type: "fail"})
            }
            else if (! request.ok && counter < 4) {
                setError({message: `Error resolving previous input. Trying again in ${counter + 5} seconds...`, type: "retry"})
                await delay((counter + 5)*1000)
            } 
            else {    
                const {genes, description} = await request.json()
                setError(null)
                if (genes.join("\n") !== input.genes.join('\n')) return false
                if (description !== input.description) return false
                if (prevInput.genes.join('\n')!==input.genes.join('\n')) return false
                if (prevInput.description !== input.description) return false
                else return true
            }
            counter = counter + 1
        }
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
            if (query.libraries === undefined) query.libraries = JSON.stringify(default_options.selected)
            router.push({
                pathname: `/${page || ''}`,
                query: {
                    ...query,
                    userListId
                },
                }, undefined, { shallow: true })
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(()=> {
        const resolve_genes = async () => {
            let counter = 0
            while (counter < 5) {
                const request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/view?userListId=${userListId}`)
                if (! request.ok && counter === 4) {
                    setError({message: "Error resolving genes. Try again in a while.", type: "fail"})
                }
                else if (! request.ok && counter < 4) {
                    setError({message: `Error resolving genes. Trying again in ${counter + 5} seconds...`, type: "retry"})
                    await delay((counter + 5)*1000)
                } 
                else {
                    const {genes, description} = await request.json()
                    setError(null)
                    setInput({
                        genes,
                        description
                    })
                    break
                }
                counter = counter + 1
            }
        }
        if (userListId) {
            resolve_genes()
        } else {
            setInput({genes: [], description: ''})
        }
        // setCollapsed(userListId!==undefined)
    }, [userListId])


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
                        <Grid item xs={12}>
                            <TextField multiline
                                rows={10}
                                placeholder={"Paste a set of valid Entrez gene symbols (e.g. STAT3) on each row in the text-box"}
                                fullWidth
                                value={input.genes.join("\n")}
                                onChange={(e)=>{
                                    setInput({
                                        ...input,
                                        genes: e.target.value.split(/[\t\r\n;]+/)
                                    })
                                }}
                                InputProps={{
                                    style: {
                                      fontSize: 14,
                                    },
                                  }}
                            />
                        </Grid>
                        <Grid item xs={12} align="left">
                            <Button 
                                onClick={()=>{
                                    const {gene_set, libraries, ...query} = props.example
                                    setInput({
                                        genes: gene_set.split(/[\t\r\n;]+/),
                                        description: "Sample Input"
                                    })
                                    query.libraries = JSON.stringify(libraries)
                                    if (Object.keys(query).length > 0) {
                                        router.push({
                                            pathname: `/${page || ''}`,
                                            query,
                                            }, undefined, { shallow: true }
                                        )
                                    }
                                }}
                                
                            ><Typography variant='subtitle2'>Try an example</Typography></Button>
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
                                InputProps={{
                                    style: {
                                      fontSize: 14,
                                    },
                                  }}
                            />
                        </Grid>
                        <Grid item>
                            <Button 
                                onClick={async ()=>{
                                    if (!(await same_prev_input())) {
                                        if (input.genes.length > 0 && libraries.length > 0) {
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
                                disabled={loading}
                                variant="contained"
                                // disabled={input.genes.length === 0}
                            >{loading ? "Searching...": "Submit"}</Button>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                                <Grid item><Typography variant='subtitle2'>Minimum libraries per gene</Typography></Grid>
                                <Grid item style={{ flexGrow: 1 }}>
                                    <Tooltip title={`Filter out genes that are not in multiple libraries.`}>
                                        <Slider 
                                            value={min_lib || 1}
                                                onChange={(e, nv)=>{
                                                router.push({
                                                    pathname: `/${page || ''}`,
                                                    query: {
                                                        ...query,
                                                        min_lib: nv
                                                    },
                                                }, undefined, { shallow: true })
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
                                    <Typography variant='subtitle2'>
                                        {min_lib || 1}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                            <Grid item><Typography variant='subtitle2'>Minimum links per gene</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Tooltip title={`Filter out genes with fewer connections`}>
                                    <Slider 
                                        value={gene_degree || 1}
                                        onChange={(e, nv)=>{
                                            router.push({
                                                pathname: `/${page || ''}`,
                                                query: {
                                                    ...query,
                                                    gene_degree: nv
                                                },
                                            }, undefined, { shallow: true })
                                        }}
                                        style={{width: "100%"}}
                                        min={1}
                                        max={libraries.reduce((acc, i)=>(acc+i.term_limit), 0) || 5}
                                        marks
                                        valueLabelDisplay='auto'
                                        aria-labelledby="degree-slider" />
                                    </Tooltip>
                            </Grid>
                            <Grid item xs={1}>
                                <Typography variant='subtitle2'>
                                    {gene_degree || 1}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                            <Grid item><Typography variant='subtitle2'>Minimum links per term</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Tooltip title={`Filter out terms with fewer connections`}>
                                    <Slider 
                                        value={term_degree || 1}
                                        onChange={(e, nv)=>{
                                            router.push({
                                                pathname: `/${page || ''}`,
                                                query: {
                                                    ...query,
                                                    term_degree: nv
                                                },
                                            }, undefined, { shallow: true })
                                        }}
                                        style={{width: "100%"}}
                                        min={1}
                                        max={20}
                                        marks
                                        valueLabelDisplay='auto'
                                        aria-labelledby="degree-slider" />
                                    </Tooltip>
                            </Grid>
                            <Grid item xs={1}>
                                <Typography variant='subtitle2'>
                                    {term_degree || 1}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                            <Grid item><Typography variant='subtitle2'>Subgraph size limit</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Tooltip title={`How many genes should the knowledge graph return? (Prioritized by gene connectivity)`}>
                                    <Slider 
                                        value={query.gene_limit || input.genes.length || 100}
                                        onChange={(e, nv)=>{
                                            router.push({
                                                pathname: `/${page || ''}`,
                                                query: {
                                                    ...query,
                                                    gene_limit: nv
                                                },
                                            }, undefined, { shallow: true })
                                        }}
                                        style={{width: "100%"}}
                                        min={1}
                                        max={input.genes.length || 100}
                                        valueLabelDisplay='auto'
                                        aria-labelledby="top-gene-slider" />
                                    </Tooltip>
                            </Grid>
                            <Grid item xs={1}>
                                <Typography variant='subtitle2'>
                                    {query.gene_limit || input.genes.length || 100}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Grid container spacing={1} justifyContent="flex-end">
                        <Grid item xs={12} md={6} align="left">
                            <FormLabel error={inputError}><Typography variant="subtitle2">Select maximum of five libraries</Typography></FormLabel>
                            {libraries_list.length > 10 && <FormLabel error={inputError}><Typography variant="subtitle2">(Scroll for more)</Typography></FormLabel>}
                        </Grid>
                        <Grid item xs={12} md={6} align="left">
                            <FormLabel><Typography variant="subtitle2">Top terms to include</Typography></FormLabel>
                        </Grid>
                        <Grid item xs={12} sx={{height: 420,}}>
                            <Grid container  sx={{maxHeight: 420, overflowY: "scroll", paddingRight: 5}} alignItems="flex-start">
                                {libraries_list.map(library=>(
                                    <Grid item xs={12} key={library}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox checked={checked_libraries[library] !== undefined} 
                                                        onChange={()=>{
                                                            if (checked_libraries[library]) {
                                                                if (libraries.length > 0) {     
                                                                    router.push({
                                                                        pathname: `/${page || ''}`,
                                                                        query: {
                                                                            ...query,
                                                                            libraries: JSON.stringify(libraries.filter(i=>i.library !== library))
                                                                        },
                                                                    }, undefined, { shallow: true })
                                                                }
                                                            } else if (libraries.length < 5 ){
                                                                router.push({
                                                                    pathname: `/${page || ''}`,
                                                                    query: {
                                                                        ...query,
                                                                        libraries: JSON.stringify([...libraries, {
                                                                            library,
                                                                            term_limit: default_term_limit
                                                                        }])
                                                                    },
                                                                }, undefined, { shallow: true })
                                                            } else {
                                                                setInputError(true)
                                                            }
                                                        }} 
                                                        name={library}
                                                    />
                                                }
                                                label={
                                                <Typography variant='subtitle2' align='left'>
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
                                                                router.push({
                                                                    pathname: `/${page || ''}`,
                                                                    query: {
                                                                        ...query,
                                                                        libraries: JSON.stringify(new_libraries)
                                                                    },
                                                                }, undefined, { shallow: true })
                                                            }}
                                                            style={{width: "100%"}}
                                                            valueLabelDisplay='auto'
                                                            min={1}
                                                            max={50}
                                                            aria-labelledby="limit-slider" />
                                                    </Tooltip>   
                                                    <Typography variant='subtitle2'>{checked_libraries[library] || default_term_limit}</Typography>
                                                </React.Fragment>
                                            }
                                        </Stack>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                        {/* {(unchecked.length > 10) && <Grid item align="right"><IconButton onClick={()=>{{
                            setLibStart(libStart - 5)
                        }}} variant="outlined" disabled={(libStart) === 0}><ArrowLeftIcon sx={{height: 40, width: 40}}/></IconButton></Grid>}  
                        {(unchecked.length > 10) && <Grid item align="right"><IconButton onClick={()=>{{
                            setLibStart(libStart + 5)
                        }}} variant="outlined" disabled = {(libStart + 5) >= unchecked.length}><ArrowRightIcon sx={{height: 40, width: 40}}/></IconButton></Grid>}   */}
                    </Grid>
                </Grid>
            </Grid>
        </FormGroup>
    )
}

export default GeneSetForm