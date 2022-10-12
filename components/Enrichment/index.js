import dynamic from 'next/dynamic'
import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import { layouts } from '../../pages';
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery';
import fileDownload from 'js-file-download'
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton'
import InfoIcon from '@mui/icons-material/Info'

const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormLabel = dynamic(()=>import('@mui/material/FormLabel'))
const FormControl = dynamic(()=>import('@mui/material/FormControl'))
const FormGroup = dynamic(()=>import('@mui/material/FormGroup'))
const FormControlLabel = dynamic(()=>import('@mui/material/FormControlLabel'))
const Stack = dynamic(()=>import('@mui/material/Stack'))
const Switch = dynamic(()=>import('@mui/material/Switch'))
const Button = dynamic(() => import('@mui/material/Button'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));

const TextField = dynamic(() => import('@mui/material/TextField'));
const Slider = dynamic(() => import('@mui/material/Slider'));
const Snackbar = dynamic(() => import('@mui/material/Snackbar'));
const Alert = dynamic(() => import('@mui/material/Alert'));

const CameraAltOutlinedIcon  = dynamic(() => import('@mui/icons-material/CameraAltOutlined'));
const HighlightOffIcon = dynamic(()=>import('@mui/icons-material/HighlightOff'));

const Cytoscape = dynamic(() => import('../Cytoscape'), { ssr: false })
const TooltipCard = dynamic(async () => (await import('../misc')).TooltipCard);
const Legend = dynamic(async () => (await import('../misc')).Legend);
const Selector = dynamic(async () => (await import('../misc')).Selector);

const Markdown = dynamic(()=>import("../markdown"), {ssr: false});
const NetworkTable =  dynamic(() => import('../network_table'))

const delay = ms => new Promise(res => setTimeout(res, ms));

const Enrichment = ({default_options, libraries: libraries_list, schema, ...props}) => {
    const router = useRouter()
    const default_term_limit = default_options.term_limit
    const {userListId, gene_limit=default_options.gene_limit, min_lib=default_options.min_lib, page} = router.query
    const libraries = router.query.libraries ? JSON.parse(router.query.libraries) : default_options.selected
    const [genes, setGenes] = useState([])
    const [geneStr, setGeneStr] = useState('')
    const [error, setError] = useState(null)
    const [openError, setOpenError] = useState(false)
    const [elements, setElements] = useState(undefined)
    const [node, setNode] = useState(null)
    const [focused, setFocused] = useState(null)
    const [loading, setLoading] = useState(false)
    const [description, setDescription] = useState('')
    const [edgeStyle, setEdgeStyle] = useState({label: 'data(label)'})
    const [layout, setLayout] = React.useState(Object.keys(layouts)[0])
    const cyref = useRef(null);
    const tableref = useRef(null);

    const [controller, setController] = React.useState(null)

    const theme = useTheme();
    const matches = useMediaQuery(theme.breakpoints.up('lg'));
    const sm = useMediaQuery(theme.breakpoints.down('md'));

    const tooltip_templates = {}
    for (const i of schema.nodes) {
        tooltip_templates[i.node] = i.display
    }

    for (const e of schema.edges) {
        for (const i of e.match) {
        tooltip_templates[i] = e.display
        }
    }

    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
      }

    const checked_libraries = libraries.reduce((acc, i)=>({
        ...acc,
        [i.library]: i.term_limit
    }), {})
    const addList = async () => {
        setLoading(true)
        // const {userListId} = await (await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/enrichment/addList`, {
        //     method: "POST",
        //     body: JSON.stringify({
        //         genes
        //     })
        // })).json()
        const formData = new FormData();
        const gene_list = genes.join("\n")
        formData.append('list', (null, gene_list))
        formData.append('description', (null, description))
        const controller = get_controller()
        const {shortId, userListId} = await (
            await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/addList`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            })
        ).json()
        const {page, ...query} = router.query
        query.userListId = userListId
        router.push({
            pathname: `/${page}`,
            query,
            }, undefined, { shallow: true })
    }

    useEffect(()=> {
        const resolve_genes = async () => {
            const {genes, description} = await (
                await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/view?userListId=${userListId}`)
            ).json()
            setDescription(description)
            setGeneStr(genes.join("\n"))
            setGenes(genes)
        }
        if (userListId) resolve_genes()
    }, [userListId])

    useEffect(()=>{
        const fetch_kg = async () => {
            try {
                if (error !== null) {
                    await delay(5000);
                }
                const controller = get_controller()
                const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/enrichment`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        userListId,
                        libraries,
                        min_lib,
                        gene_limit,
                    }),
                    signal: controller.signal
                })
                const results = (await res.json())
                setOpenError(false)
                setError(null)
                setLoading(false)
                setElements(results)
            } catch (error) {
                console.error(error)
                setError({message: "Error connecting to Enrichr, trying again...", type: "error"})
                setOpenError(true)
            }
        }
        if (userListId || (error !== null && error.type === "error")) {
            setLoading(true)
            fetch_kg()
         }
    }, [router.query, error])
    return (
        <Grid container spacing={2} style={{marginBottom: 10}}>
            <Grid item xs={12} md={3}>
                <Snackbar open={openError}
					anchorOrigin={{ vertical:"top", horizontal:"right" }}
					autoHideDuration={3000}
					onClose={()=>setOpenError(false)}
					message={(error || {}).message}
					action={
                        <IconButton size="small" onClick={()=>setOpenError(false)}>
                            <HighlightOffIcon/>
                        </IconButton>
					}
				/>
                <Markdown markdown={props.description || ''}/>
                <TextField multiline
                    rows={10}
                    placeholder={props.placeholder}
                    fullWidth
                    value={geneStr}
                    onChange={(e)=>{
                        setGenes(e.target.value.split(/[\t\r\n;]+/))
                    }}
                />
                <div align="center">
                    <Button 
                        onClick={()=>{
                            setGeneStr(props.example)
                            setGenes(props.example.split(/[\t\r\n;]+/))
                        }}
                        
                    >Try an Example</Button>
                </div>
                <FormControl sx={{ marginTop: 2 }} component="fieldset" variant="standard">
                    <Grid container alignItems={"stretch"}>
                        <Grid item style={{ flexGrow: 1 }}>
                            <TextField
                                variant='outlined'
                                value={description}
                                size="small"
                                onChange={e=>setDescription(e.target.value)}
                                placeholder="Description"
                                style={{width: "100%"}}
                            />
                        </Grid>
                        <Grid item>
                            <Button 
                                onClick={()=>{
                                    if (genes.length > 0) {
                                        addList()
                                    }
                                }}
                                variant="contained"
                            >Submit</Button>
                        </Grid>
                    </Grid>
                    <FormGroup>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5, marginTop: 5}}>
                            <Grid item><Typography>Minimum Libraries</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Slider 
                                    value={min_lib || 1}
                                    color="blues"
                                    onChange={(e, nv)=>{
                                        const {page, ...query} = router.query
                                        query.min_lib = nv
                                        router.push({
                                            pathname: `/${page}`,
                                            query,
                                            }, undefined, { shallow: true })
                                    }}
                                    style={{width: "100%"}}
                                    min={1}
                                    max={libraries.length}
                                    aria-labelledby="continuous-slider" />
                            </Grid>
                            <Grid item>
                                <Typography>
                                    {min_lib || 1}
                                    <Tooltip title={`Set this parameter to prioritize genes that appear on multiple libraries.`}>
                                        <IconButton size="small">
                                            <InfoIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                            <Grid item><Typography>Top Gene Limit</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Slider 
                                    value={gene_limit || genes.length || 100}
                                    color="blues"
                                    onChange={(e, nv)=>{
                                        const {page, ...query} = router.query
                                        query.gene_limit = nv
                                        router.push({
                                            pathname: `/${page}`,
                                            query,
                                            }, undefined, { shallow: true })
                                    }}
                                    style={{width: "100%"}}
                                    min={1}
                                    max={genes.length || 100}
                                    aria-labelledby="continuous-slider" />
                            </Grid>
                            <Grid item>
                                <Typography>
                                    {gene_limit || genes.length || 100}
                                    <Tooltip title={`Set this parameter to prioritize the top genes with most connections. (Set to all genes by default)`}>
                                        <IconButton size="small">
                                            <InfoIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Typography>
                            </Grid>
                        </Grid>
                        <FormLabel>Pick up to five libraries</FormLabel>
                        {libraries_list.map(library=>(
                            <React.Fragment>
                                <FormControlLabel
                                    control={
                                            <Checkbox checked={checked_libraries[library] !== undefined} 
                                                onChange={()=>{
                                                    if (checked_libraries[library]) {
                                                        if (libraries.length > 1) {
                                                            const {page, ...query} = router.query
                                                            query.libraries = JSON.stringify(libraries.filter(i=>i.library !== library))
                                                            router.push({
                                                                pathname: `/${page}`,
                                                                query,
                                                            }, undefined, { shallow: true })
                                                        }
                                                    } else {
                                                        const {page, ...query} = router.query
                                                        query.libraries = JSON.stringify([...libraries, {
                                                            library,
                                                            term_limit: default_term_limit
                                                        }])
                                                        router.push({
                                                            pathname: `/${page}`,
                                                            query,
                                                          }, undefined, { shallow: true })
                                                    }
                                                }} 
                                                name={library}
                                            />
                                    }
                                    label={
                                    <Typography>
                                        {library.replaceAll("_", " ")}
                                        { checked_libraries[library] !== undefined && 
                                            <Tooltip title={`Number of top ${library.replaceAll("_", " ")} terms to include`}>
                                                <IconButton size="small">
                                                    <InfoIcon />
                                                </IconButton>
                                            </Tooltip>
                                        }
                                    </Typography>}
                                />
                                { checked_libraries[library] !== undefined && 
                                    <Grid container alignItems={"center"} spacing={2}>
                                        <Grid item><Typography>Term Limit :</Typography></Grid>
                                        <Grid item style={{ flexGrow: 1 }}>
                                            <Slider 
                                                value={checked_libraries[library]}
                                                color="blues"
                                                onChange={(e, nv)=>{
                                                    const new_libraries = []
                                                    for (const i of libraries) {
                                                        if (i.library === library) new_libraries.push({
                                                            library,
                                                            term_limit: nv
                                                        })
                                                        else new_libraries.push(i)
                                                    }
                                                    const {page, ...query} = router.query
                                                    query.libraries = JSON.stringify(new_libraries)
                                                    router.push({
                                                        pathname: `/${page}`,
                                                        query,
                                                    }, undefined, { shallow: true })
                                                }}
                                                style={{marginBottom: -5, width: "100%"}}
                                                min={1}
                                                max={50}
                                                aria-labelledby="continuous-slider" />
                                        </Grid>
                                        <Grid item>
                                            <Typography>{checked_libraries[library] || default_term_limit}</Typography>
                                        </Grid>
                                    </Grid>
                                }
                            </React.Fragment>
                        ))}

                    </FormGroup>
                    <FormGroup>
                        <Stack>
                            <Typography variant="body1"><b>Relationship labels:</b><Switch
                                color="blues"
                                checked={edgeStyle.label}
                                onChange={()=>{
                                if (edgeStyle.label) setEdgeStyle({})
                                else setEdgeStyle({label: 'data(label)'})
                                }}
                                name="checkedA"
                                inputProps={{ 'aria-label': 'secondary checkbox' }}
                            /></Typography>
                        </Stack>
                        <Stack>
                            <Typography>Graph Layout:</Typography>
                            <Selector entries={Object.keys(layouts)}
                                value={layout}
                                prefix={"layout"}
                                onChange={(e, v)=>setLayout(e)}
                                sx={{width: "100%", marginBottom: 2}}
                            />
                        </Stack>
                    </FormGroup>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={9} style={{height: 1000}}>
                <Button color="blues" onClick={()=>{
                fileDownload(cyref.current.png({output: "blob"}), "network.png")
                }}>
                <CameraAltOutlinedIcon/>
                </Button>
                { (userListId === undefined) ? null 
                : (elements === undefined) ? (
                <CircularProgress/>
                ) : elements.length === 0 ? (
                <div>No results</div>
                ) : loading ? 
                <CircularProgress/>:
                    <Cytoscape
                        key={JSON.stringify(router.query)}
                        wheelSensitivity={0.1}
                        style={{
                        width: '100%',
                        height: '100%',
                        }}
                        stylesheet={[
                        {
                            selector: 'node',
                            style: {
                            'background-color': 'data(color)',
                            'label': 'data(label)',
                            "text-valign": "center",
                            "text-halign": "center",
                            'width': `mapData(node_type, 0, 1, 70, 150)`,
                            'height': `mapData(node_type, 0, 1, 70, 150)`,
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                            'curve-style': 'straight',
                            // 'opacity': '0.5',
                            'line-color': 'data(lineColor)',
                            'width': '3',
                            // 'label': 'data(label)',
                            "text-rotation": "autorotate",
                            "text-margin-x": "0px",
                            "text-margin-y": "0px",
                            'font-size': '12px',
                            'target-arrow-shape': `data(directed)`,
                            'target-endpoint': 'outside-to-node',
                            'source-endpoint': 'outside-to-node',
                            'target-arrow-color': 'data(lineColor)',
                            ...edgeStyle
                            }
                        },
                        {
                            selector: 'node.highlight',
                            style: {
                                'border-color': 'gray',
                                'border-width': '2px',
                                'font-weight': 'bold',
                                'font-size': '18px',
                                'width': `mapData(node_type, 0, 1, 90, 170)`,
                                'height': `mapData(node_type, 0, 1, 90, 170)`,
                            }
                        },
                        {
                            selector: 'node.focused',
                            style: {
                                'border-color': 'gray',
                                'border-width': '2px',
                                'font-weight': 'bold',
                                'font-size': '18px',
                                'width': `mapData(node_type, 0, 1, 90, 170)`,
                                'height': `mapData(node_type, 0, 1, 90, 170)`,
                            }
                        },
                        {
                            selector: 'edge.focusedColored',
                            style: {
                                'line-color': '#F8333C',
                                'width': '6'
                            }
                        },
                        {
                            selector: 'node.semitransp',
                            style:{ 'opacity': '0.5' }
                        },
                        {
                            selector: 'node.focusedSemitransp',
                            style:{ 'opacity': '0.5' }
                        },
                        {
                            selector: 'edge.colored',
                            style: {
                                'line-color': '#F8333C',
                                'target-arrow-color': '#F8333C',
                                'width': '6'
                            }
                        },
                        {
                            selector: 'edge.semitransp',
                            style:{ 'opacity': '0.5' }
                        },
                        {
                            selector: 'edge.focusedSemitransp',
                            style:{ 'opacity': '0.5' }
                        }
                        ]}
                        elements={elements}
                        layout={layouts[layout]}
                        cy={(cy) => {
                        cyref.current = cy
                        cy.on('click', 'node', function (evt) {
                        // setAnchorEl(null)
                        const node = evt.target.data()

                        if (focused && node.id === focused.id) {
                            const sel = evt.target;
                            cy.elements().removeClass('focusedSemitransp');
                            sel.removeClass('focused').outgoers().removeClass('focusedColored')
                            sel.incomers().removeClass('focusedColored')
                            // setNode({node: null, type: "focused"})
                            setFocused(null)
                        } else{
                            const sel = evt.target;
                            cy.elements().removeClass('focused');
                            cy.elements().removeClass('focusedSemitransp');
                            cy.elements().removeClass('focusedColored');
                            cy.elements().not(sel).addClass('focusedSemitransp');
                            sel.addClass('focused').outgoers().addClass('focusedColored')
                            sel.incomers().addClass('focusedColored')
                            sel.incomers().removeClass('focusedSemitransp')
                            sel.outgoers().removeClass('focusedSemitransp')
                            // setNode({node, type: "focused"})
                            setFocused(node)
                            setTimeout(()=>{
                            const sel = evt.target;
                            cy.elements().removeClass('focusedSemitransp');
                            sel.removeClass('focused').outgoers().removeClass('focusedColored')
                            sel.incomers().removeClass('focusedColored')
                            // setNode({node: null, type: "focused"})
                            setFocused(null)
                            }, 3000)
                        }
                        })

                        cy.nodes().on('mouseover', (evt) => {
                        const n = evt.target.data()
                        const sel = evt.target;
                        cy.elements().not(sel).addClass('semitransp');
                        sel.addClass('highlight').outgoers().addClass('colored')
                        sel.incomers().addClass('colored')
                        sel.incomers().removeClass('semitransp')
                        sel.outgoers().removeClass('semitransp')
                        if (n.id !== (node || {}).id) {
                            // setAnchorEl(evt.target.popperRef())
                            // setNode({node: n})
                            setNode(n)
                        }
                        });

                        cy.nodes().on('mouseout', (evt) => {
                        const sel = evt.target;
                        cy.elements().removeClass('semitransp');
                        sel.removeClass('highlight').outgoers().removeClass('colored')
                        sel.incomers().removeClass('colored')
                        // setAnchorEl(null)
                        // setNode({node: null})
                        setNode(null)
                        });
                        cy.edges().on('mouseover', (evt) => {
                        const n = evt.target.data()
                        const sel = evt.target;
                        cy.elements().not(sel).addClass('semitransp');
                        sel.addClass('colored').connectedNodes().addClass('highlight')
                        sel.connectedNodes().removeClass('semitransp')
                        if (n.id !== (node || {}).id) {
                            // setAnchorEl(evt.target.popperRef())
                            // setNode({node: n})
                            setNode(n)
                        }
                        });
                        cy.edges().on('mouseout', (evt) => {
                        const sel = evt.target;
                        cy.elements().removeClass('semitransp');
                        sel.removeClass('colored').connectedNodes().removeClass('highlight')
                        // setAnchorEl(null)
                        // setNode({node: null})
                        setNode(null)
                        });
                    }}
                    />
                }
                {elements && <Legend elements={elements} left={sm ? "10%": "30%"} top={sm ? 2000: 550}/>}
                {(focused || node) && <TooltipCard 
                    node={focused || node}
                    schema={schema}
                    tooltip_templates={tooltip_templates} 
                    setFocused={setFocused}
                    router={router}
                    top={sm ? 1500: 550}
                    />}
            </Grid>
            <Grid item xs={12}>
                <div ref={tableref}>
                <NetworkTable data={elements} schema={schema}/>
                </div>
            </Grid>
        </Grid>
    )
}

export default Enrichment