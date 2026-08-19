'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import Tooltip from '@mui/material/Tooltip';
import { router_push, usePrevious } from '@/utils/client_side';
import { delay } from '@/utils/helper';
import Button from '@mui/material/Button'
import EnrichrTermSearch from './EnrichrTermSearch';
import LibraryPicker from './LibraryPicker';
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid';
import ErrorIcon from '@mui/icons-material/Error';
import { 
    Card, 
    CardContent,  
    FormGroup, 
    Stack, 
    TextField,
    Snackbar,
    Alert,
    Breakpoint,
    Theme,
    useTheme,
    Switch
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { NetworkSchema } from '@/app/api/knowledge_graph/route';
import { useQueryState, parseAsJson } from 'next-usequerystate';
import { EnrichmentParams } from '.';


export function useWidth() {
  const theme: Theme = useTheme();
  const keys: readonly Breakpoint[] = [...theme.breakpoints.keys].reverse();
  return (
    keys.reduce((output: Breakpoint | null, key: Breakpoint) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const matches = useMediaQuery(theme.breakpoints.up(key));
      return !output && matches ? key : output;
    }, null) || 'xs'
  );
}

const GeneSetForm = ({
    disableLibraryLimit,
    example,
    parsedParams,
    fullWidth,
    elements, 
    ui_theme,
    libraries_list,
}: {
    disableLibraryLimit?: boolean,  
    fullWidth?:boolean,
    elements: NetworkSchema,
    example?: {
        gene_set?: string,
        description?:string
    },
    parsedParams: EnrichmentParams,
    ui_theme?: string,
    libraries_list: Array<string>,
}) => {
    const router = useRouter()
    const [query, setQuery] = useQueryState('query', parseAsJson<EnrichmentParams>().withDefault({}))
        
    const pathname = usePathname()
    const [input, setInput] = useState<{genes: Array<string>, description: string}>({genes: [], description: ''})
    const [verified, setVerified] = useState<Array<string>>([])
    const [inputError, setInputError] = useState<boolean>(false)
    const [isFocused, setIsFocused] = useState<boolean>(false)
    const [loading, setLoading] = useQueryState('loading')
    const [verifying, setVerifying] = useState<boolean>(false)
    const [controller, setController] = useState<AbortController>(null)
    const [error, setError] = useState<{message: string, type: string}>(null)
    const width = useWidth()
    const [showForm, setShowForm] = useState<boolean>(false)
    const [formVisibility, setFormVisibility] = useState<boolean>(false)
    const combined_query = {...parsedParams, ...query}
    const {
        userListId,
        gene_limit,
        min_lib,
        gene_degree,
        term_degree,
    } = combined_query


    useEffect(()=>{
        if ((width === 'xs' || width == 'sm') && elements) setFormVisibility(false)
        else setFormVisibility(true)
    },[width, elements])
    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
      }
    
    const libraries = query.libraries || parsedParams.libraries
    const prevInput = usePrevious(input) || {genes: [], description: ''}

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
                const results = await request.json()
                // const results = JSON.parse(res)
                setError(null)
                const genes = results.genes
                const description = results.description
                
                if (genes.join('\n') !== input.genes.join('\n')) return false
                if (description !== input.description) return false
                if (prevInput.genes.join('\n')!==input.genes.join('\n')) return false
                if (prevInput.description !== input.description) return false
                else return true
            }
            counter = counter + 1
        }
    }
    const addList = async () => {
        try {
            setLoading('true')
            const formData = new FormData();
            // const gene_list = geneStr.trim().split(/[\t\r\n;]+/).join("\n")
            const {genes = [], description=''} = input
            const gene_list = genes.join('\n').toUpperCase()
            formData.append('list', gene_list)
            formData.append('description', description)
            const controller = get_controller()
            const {userListId} = await (
                await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/addList`, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                })
            ).json()
            const query = {...combined_query}
            // if (query.libraries === undefined) query.libraries = JSON.stringify(default_options.libraries)
            // setSubmitted(false)
            const {augment, augment_limit, gene_links, ...rest} = query
            router_push(router, pathname, {
                q: JSON.stringify({
                    ...rest,
                    userListId: `${userListId}`,
                    search: true
                })
            })
        } catch (error) {
            console.error(error)
        }
    }

    const verifyList = async (input: Array<string>) => {
        try {
            setVerifying(true)
            const controller = get_controller()
            const verified:Array<string> = await (
                await fetch(`${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/enrichment/terms_and_genes`, {
                    method: 'POST',
                    body: JSON.stringify({
                        input
                    }),
                    signal: controller.signal
                })
            ).json()
            setVerified(verified.map(i => i.trim()))
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(()=>{
        setVerifying(false)
    },[verified])

    useEffect(()=>{
        setLoading(null)
        setQuery(null)
    }, [elements])

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
                    const results = await request.json()
                    // const results = JSON.parse(res)
                    setError(null)
                    setInput(results)
    
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

    useEffect(()=>{
        if (input.genes.length === 0) setVerified([])
        else verifyList(input.genes.map(i=>i.toUpperCase()))
    }, [input.genes])

    if (!formVisibility) return <Button color="secondary" variant="outlined" onClick={()=>setFormVisibility(!formVisibility)}>{formVisibility ? 'Hide' : 'Show'} Form</Button>
    return (
        <Card elevation={0} sx={{borderRadius: "8px", backgroundColor: (!ui_theme || ui_theme === "cfde_theme" || elements !== null) ? "tertiary.light": "#FFF", display: {md: 'flex', xs: formVisibility ? 'flex': 'none'}}}>
            <CardContent sx={{width: "100%"}}>
                <FormGroup>
                    <Snackbar open={error!==null}
                            anchorOrigin={{ vertical:"bottom", horizontal:"left" }}
                            autoHideDuration={4500}
                            onClose={()=>{
                                if ((error || {} ).type === "fail") {
                                    router_push(router, pathname, {})
                                    setQuery(null)
                                    setError(null)
                                } else {
                                    setError(null)
                                }
                            }}
                        >
                            <Alert 
                                onClose={()=>{
                                    if ((error || {} ).type === "fail") {
                                        router_push(router, pathname, {})
                                        setQuery(null)
                                        setError(null)
                                    } else {
                                        setError(null)
                                    }
                                }}
                                severity={(error || {} ).type === "fail" ? "error": "warning"}
                                sx={{ width: '100%' }} 
                                variant="filled"
                                elevation={6}
                            >
                                <Typography>{( error || {}).message || ""}</Typography>
                            </Alert>
                        </Snackbar>
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={fullWidth ?6: 12}>
                            <Grid container alignItems={"center"} spacing={1}>
                                <Grid item xs={12}>
                                    <div tabIndex={0}>
                                        {!isFocused ? 
                                            <Card sx={{height: 235, overflowY: "auto", boxShadow: "none", border: "1px solid black"}} onClick={() => setIsFocused(true)}>
                                                {input.genes.length === 0 && <Typography variant="subtitle2" align='left' sx={{paddingLeft: 1, paddingTop: 2, fontSize: 13.75, color: "#bdbdbd"}}>Paste a set of valid Entrez gene symbols (e.g. STAT3) on each row in the text-box</Typography> }
                                                <CardContent>
                                                    {input.genes.map(i=>{
                                                        if (verified.indexOf(i.trim().toUpperCase()) > -1) return <Typography key={i} color="secondary" align='left' sx={{fontSize: 14}}>{i}</Typography>
                                                        else {
                                                            if (i === '') return null
                                                            else return <Stack direction='row' key={i} spacing={1} alignItems={"center"} justifyContent="flex-start"><Typography align='left' color={verified.length > 0 ? 'error': 'default'} sx={{fontSize: 14}}>{i}</Typography><ErrorIcon color="error" sx={{width: 15}}/></Stack>
                                                        }
                                                    })}
                                                </CardContent>
                                            </Card>:
                                            <TextField
                                                onBlur={() => setIsFocused(!isFocused)}
                                                multiline
                                                className='EnrichmentForm'
                                                rows={10}
                                                placeholder={"Paste a set of valid Entrez gene symbols (e.g. STAT3) on each row in the text-box"}
                                                fullWidth
                                                value={input.genes.join('\n')}
                                                // value = {input.genes}
                                                onChange={(e)=>{
                                                    setInput({
                                                        ...input,
                                                        genes: e.target.value.split(/[\t\r\n,;]+/)
                                                    })
                                                }}
                                                InputProps={{
                                                    sx: {
                                                        fontSize: 14,
                                                    },
                                                }}
                                                inputProps={{
                                                    sx: {
                                                        paddingRight: 0
                                                    }
                                                }}
                                            />
                                        }
                                    </div>
                                </Grid>
                                <Grid item xs={fullWidth? 6: 12} sx={{textAlign: "left"}}>
                                    <Grid container direction={"row"} spacing={1} alignItems="center">
                                        <Grid item>
                                            <Tooltip title={input.genes.length === 0 ? "Input gene set": libraries.length === 0 ? "Select libraries": (loading || verifying) ? "Loading...": "Submit"}>
                                                <Button 
                                                    onClick={async ()=>{
                                                        // setSubmitted('true')
                                                        if (!(await same_prev_input())) {
                                                            if (input.genes.length > 0 && libraries.length > 0) {
                                                                addList()
                                                            }
                                                        } else {
                                                            const {search, augment, augment_limit, gene_links, ...rest} = combined_query
                                                            // setSubmitted(false)
                                                            router_push(router, pathname, {
                                                                q: JSON.stringify({
                                                                    ...rest,
                                                                    libraries: libraries,
                                                                    search: true
                                                                })
                                                            })
                                                        }
                                                    }}
                                                    disabled={loading == 'true' || verifying || libraries.length === 0 || input.genes.length === 0}
                                                    size="large"
                                                    variant="contained"
                                                    sx={{
                                                        padding: "15px 30px",
                                                    }}
                                                    // disabled={input.genes.length === 0}
                                                >{loading || verifying ? "Searching...": "Submit"}</Button>
                                            </Tooltip>
                                        </Grid>
                                        {(verified.length > 0 && input.genes.length > 0) && <Grid item><Typography color={'secondary'} variant='caption'> {`${verified.length} matched genes`}</Typography></Grid>}
                                    </Grid>
                                </Grid>
                                { fullWidth && 
                                    <Grid item xs={fullWidth? 6: 12} sx={{textAlign: "right"}}>
                                        <Button 
                                            onClick={()=>{
                                                console.log("example", example)
                                                const {gene_set, description} = example
                                                setInput({genes: gene_set.split('\n'), description: description})
                                            }}
                                            
                                        ><Typography color={'secondary'} variant='subtitle2'>Try a gene set example</Typography></Button>
                                    </Grid>
                                }
                                <Grid item sx={{ flexGrow: 1, marginTop: 3 }}>
                                    <TextField
                                        variant='outlined'
                                        value={input.description}
                                        size="small"
                                        onChange={e=>setInput({...input, description: e.target.value || ''})}
                                        placeholder="Description"
                                        label="Description"
                                        sx={{width: "100%", backgroundColor: "#FFF"}}
                                        InputProps={{
                                            style: {
                                            fontSize: 14,
                                            },
                                        }}
                                    />
                                </Grid>
                                
                                {['xs' , 'sm'].indexOf(width) > -1 && <Grid item xs={12}><Button color="secondary" variant="outlined" onClick={()=>setFormVisibility(!formVisibility)}>{formVisibility ? 'Hide' : 'Show'} Form</Button></Grid>}
                                
                                <Grid item xs={12}>
                                    <Stack direction={'row'} alignItems={"center"} justifyContent={'space-between'}>
                                        <Typography variant="caption">Advanced Options</Typography>
                                            <Switch 
                                                color="secondary" 
                                                checked={showForm}
                                                onChange={()=>{setShowForm(!showForm)}}
                                            />
                                        </Stack>
                                </Grid>
                            </Grid>
                            { showForm && 
                            <>
                                <Grid item xs={12}>
                                    <Grid container alignItems={"stretch"} spacing={2}>
                                        <Grid item><Typography variant='subtitle2'>Minimum libraries per gene</Typography></Grid>
                                        <Grid item sx={{ flexGrow: 1 }}>
                                            <Tooltip title={`Filter out genes that are not in multiple libraries.`}>
                                                <Slider 
                                                    color="secondary"
                                                    value={min_lib || 3}
                                                        onChange={(e, nv:number)=>{
                                                        // const {search, augment, augment_limit, gene_links, ...rest} = combined_query
                                                        setQuery({
                                                            ...query,
                                                            min_lib: nv
                                                        })
                                                        // router_push(router, pathname, {
                                                        //     ...rest,
                                                        //     min_lib: nv
                                                        // })
                                                    }}
                                                    sx={{width: "100%"}}
                                                    min={1}
                                                    max={6}
                                                    marks
                                                    valueLabelDisplay='auto'
                                                    aria-labelledby="gene-slider" />
                                                </Tooltip>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant='subtitle2'>
                                                {min_lib || 3}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            
                                <Grid item xs={12}>
                                    <Grid container alignItems={"stretch"} spacing={2}>
                                        <Grid item><Typography variant='subtitle2'>Minimum links per gene</Typography></Grid>
                                        <Grid item sx={{ flexGrow: 1 }}>
                                            <Tooltip title={`Filter out genes with fewer connections`}>
                                                <Slider 
                                                    value={gene_degree || 1}
                                                    color="secondary"
                                                    onChange={(e, nv:number)=>{
                                                        // const {search, augment, augment_limit, gene_links, ...rest} = searchParams
                                                        // router_push(router, pathname, {
                                                        //     ...rest,
                                                        //     gene_degree: nv
                                                        // })
                                                        setQuery({
                                                            ...query,
                                                            gene_degree: nv
                                                        })
                                                    }}
                                                    sx={{width: "100%"}}
                                                    min={1}
                                                    max={libraries.reduce((acc, i)=>(acc+i.limit), 0) || 5}
                                                    marks
                                                    valueLabelDisplay='auto'
                                                    aria-labelledby="degree-slider" />
                                                </Tooltip>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant='subtitle2'>
                                                {gene_degree || 1}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12}>
                                    <Grid container alignItems={"stretch"} spacing={2}>
                                        <Grid item><Typography variant='subtitle2'>Minimum links per term</Typography></Grid>
                                        <Grid item sx={{ flexGrow: 1 }}>
                                            <Tooltip title={`Filter out terms with fewer connections`}>
                                                <Slider 
                                                    color="secondary"
                                                    value={term_degree || 1}
                                                    onChange={(e, nv:number)=>{
                                                        // const {search, augment, augment_limit, gene_links, ...rest} = searchParams
                                                        // router_push(router, pathname, {
                                                        //     ...rest,
                                                        //     term_degree: nv
                                                        // })
                                                        setQuery({
                                                            ...query,
                                                            term_degree: nv
                                                        })
                                                    }}
                                                    sx={{width: "100%"}}
                                                    min={1}
                                                    max={20}
                                                    marks
                                                    valueLabelDisplay='auto'
                                                    aria-labelledby="degree-slider" />
                                                </Tooltip>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant='subtitle2'>
                                                {term_degree || 1}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12}>
                                    <Grid container alignItems={"stretch"} spacing={2}>
                                        <Grid item><Typography variant='subtitle2'>Subgraph size limit</Typography></Grid>
                                        <Grid item sx={{ flexGrow: 1 }}>
                                            <Tooltip title={`How many genes should the knowledge graph return? (Prioritized by gene connectivity)`}>
                                                <Slider 
                                                    color="secondary"
                                                    value={combined_query.gene_limit || verified.length || input.genes.length || 100}
                                                    onChange={(e, nv:number)=>{
                                                        // const {search, augment, augment_limit, gene_links, ...rest} = searchParams
                                                        // router_push(router, pathname, {
                                                        //     ...rest,
                                                        //     gene_limit: nv
                                                        // })
                                                        setQuery({
                                                            ...query,
                                                            gene_limit: nv
                                                        })
                                                    }}
                                                    sx={{width: "100%"}}
                                                    min={1}
                                                    max={verified.length || input.genes.length || 100}
                                                    valueLabelDisplay='auto'
                                                    aria-labelledby="top-gene-slider" />
                                                </Tooltip>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant='subtitle2'>
                                                {combined_query.gene_limit || verified.length || input.genes.length || 100}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </> 
                        }
                        </Grid>
                        { fullWidth &&
                            <Grid item xs={12} md={6}>
                                <Grid container spacing={1} justifyContent="flex-end">
                                    <Grid item xs={12}>
                                        <EnrichrTermSearch setInput={setInput}/>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant={'subtitle2'}>
                                            Select libraries to include
                                        </Typography>
                                        <LibraryPicker parsedParams={parsedParams}
                                            libraries_list={libraries_list}
                                            fullWidth={fullWidth}
                                            disableLibraryLimit={disableLibraryLimit || true}
                                        />
                                    </Grid> 
                                </Grid>    
                            </Grid>
                        }
                    {/* </Grid> */}
                    </Grid>
                </FormGroup>
            </CardContent>
        </Card>
    )
}

export default GeneSetForm