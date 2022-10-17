import dynamic from 'next/dynamic'
import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import { layouts } from '../../pages';
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery';
import fileDownload from 'js-file-download'
import Tooltip from '@mui/material/Tooltip';
import ShareIcon from '@mui/icons-material/Share';

import IconButton from '@mui/material/IconButton'
import InfoIcon from '@mui/icons-material/Info'
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LinkIcon from '@mui/icons-material/Link';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Grid';

// const Grid = dynamic(() => import('@mui/material/Grid'));
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

const CameraAltOutlinedIcon  = dynamic(() => import('@mui/icons-material/CameraAltOutlined'));

const Cytoscape = dynamic(() => import('../Cytoscape'), { ssr: false })
const TooltipCard = dynamic(async () => (await import('../misc')).TooltipCard);
const Legend = dynamic(async () => (await import('../misc')).Legend);
const Selector = dynamic(async () => (await import('../misc')).Selector);

const Markdown = dynamic(()=>import("../markdown"), {ssr: false});
const NetworkTable =  dynamic(() => import('../network_table'))

const delay = ms => new Promise(res => setTimeout(res, ms));

// https://blog.logrocket.com/accessing-previous-props-state-react-hooks/
const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value; //assign the value of ref to the argument
    },[value]); //this code will run when the value of 'value' changes
    return ref.current; //in the end, return the current ref value.
  }

const Enrichment = ({default_options, libraries: libraries_list, schema, ...props}) => {
    const router = useRouter()
    const default_term_limit = default_options.term_limit
    const {page, ...rest} = router.query
    const [error, setError] = useState(null)
    const [openError, setOpenError] = useState(false)
    const [elements, setElements] = useState(null)
    const [node, setNode] = useState(null)
    const [focused, setFocused] = useState(null)
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState({genes: [], description: ''})
    const [edgeStyle, setEdgeStyle] = useState({label: 'data(label)'})
    const [layout, setLayout] = useState(Object.keys(layouts)[0])
    const [anchorEl, setAnchorEl] = useState(null)
    const [collapsed, setCollapsed] = useState(false)
    const [shortId, setShortId] = useState(null)
    const [openShare, setOpenShare] = useState(false)
    const [query, setQuery] = useState({})
    const [inputError, setInputError] = useState(false)
    const {
        userListId,
        gene_limit=default_options.gene_limit,
        min_lib=default_options.min_lib,
        gene_degree=default_options.gene_degree} = query
    const libraries = query.libraries ? JSON.parse(query.libraries) : default_options.selected
    
    const cyref = useRef(null);
    const tableref = useRef(null);
    const prevInput = usePrevious(input)

    const [controller, setController] = React.useState(null)

    const theme = useTheme();
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

    const same_prev_input = () => {
        if (prevInput.genes.join('\n')!==input.genes.join('\n')) return false
        else if (prevInput.description !== input.description) return false
        else return true
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
        try {
            setLoading(true)
            const formData = new FormData();
            // const gene_list = geneStr.trim().split(/[\t\r\n;]+/).join("\n")
            const {genes, description} = input
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
            setShortId(shortId)
            router.push({
                pathname: `/${page}`,
                query: {...query, userListId},
                }, undefined, { shallow: true })
        } catch (error) {
            console.error(error)
        }
    }

    const handleClickMenu = (e) => {
		setAnchorEl(e.currentTarget);
	  };
	const handleCloseMenu = () => {
		setAnchorEl(null);
	};

    const fetch_kg = async (userListId) => {
        try {
            if (error !== null) {
                await delay(5000);
            }
            setCollapsed(true)
            setInputError(false)
            const controller = get_controller()
            const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/enrichment`,
            {
                method: "POST",
                body: JSON.stringify({
                    userListId,
                    libraries,
                    min_lib,
                    gene_limit,
                    gene_degree,
                }),
                signal: controller.signal
            })
            const results = (await res.json())
            if (results.message) {
                setError({message: "Error connecting to Enrichr, trying again...", type: "error"})
                setOpenError(true)
            } else {
                setOpenError(false)
                setError(null)
                setLoading(false)
                setElements(results)
            }
        } catch (error) {
            setError({message: "Error connecting to Enrichr, trying again...", type: "error"})
            setOpenError(true)
        }
    }

    // useEffect(()=>{
    //     const {page, ...rest} = router.query
    //     setQuery(rest)
    // }, [router.query])

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

        const get_shortId = async () => {
            const {link_id} = await (
                await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/share?userListId=${userListId}`)
            ).json()
            setShortId(link_id)
        }
        if (userListId) {
            resolve_genes()
            get_shortId()
        }
        // setCollapsed(userListId!==undefined)
    }, [userListId])

    useEffect(()=>{    
        const {page, ...rest} = router.query
        setQuery(rest)
        const userListId = rest.userListId
        if (userListId) {
            setLoading(true)
            fetch_kg(userListId)
         }
    }, [router.query])

    useEffect(()=>{ 
        const {page, ...rest} = router.query
        setQuery(rest)
        const userListId = rest.userListId
        if (userListId && (error !== null && error.type === "error")) {
            setLoading(true)
            fetch_kg(userListId)
         }
    }, [error])

    return (
        <Grid container spacing={2} style={{marginBottom: 10}}>
            {!collapsed && <Grid item xs={12} md={3}>
                <Markdown markdown={props.description || ''}/>
                <TextField multiline
                    rows={10}
                    placeholder={props.placeholder}
                    fullWidth
                    value={input.genes.join("\n")}
                    onChange={(e)=>{
                        setInput({
                            ...input,
                            genes: e.target.value.split(/[\t\r\n;]+/)
                        })
                    }}
                />
                <div align="center">
                    <Button 
                        onClick={()=>{
                            setInput({
                                genes: props.example.split(/[\t\r\n;]+/),
                                description: "Sample Input"
                            })
                        }}
                        
                    >Try an Example</Button>
                </div>
                <FormControl sx={{ marginTop: 2 }} component="fieldset" variant="standard">
                    <Grid container alignItems={"stretch"}>
                        <Grid item style={{ flexGrow: 1 }}>
                            <TextField
                                variant='outlined'
                                value={input.description}
                                size="small"
                                onChange={e=>setInput({...input, description: e.target.value.trim().split(/[\t\r\n;]+/)})}
                                placeholder="Description"
                                style={{width: "100%"}}
                            />
                        </Grid>
                        <Grid item>
                            <Button 
                                onClick={()=>{
                                    if (!same_prev_input()) {
                                        if (input.genes.length > 0) {
                                            addList()
                                        }
                                    } else {
                                        router.push({
                                            pathname: `/${page}`,
                                            query,
                                            }, undefined, { shallow: true }
                                        )
                                    }
                                }}
                                variant="contained"
                                disabled={input.genes.length === 0}
                            >Submit</Button>
                        </Grid>
                    </Grid>
                    <FormGroup>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5, marginTop: 5}}>
                            <Grid item><Typography>Gene Library Connectivity</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Slider 
                                    value={min_lib || 1}
                                    color="blues"
                                    onChange={(e, nv)=>{
                                        const new_query = {...query}
                                        new_query.min_lib = nv
                                        setQuery(new_query)
                                    }}
                                    style={{width: "100%"}}
                                    min={1}
                                    max={libraries_list.length}
                                    aria-labelledby="continuous-slider" />
                            </Grid>
                            <Grid item>
                                <Typography>
                                    {min_lib || 1}
                                    <Tooltip title={`Filter out genes that are not in multiple libraries.`}>
                                        <IconButton size="small">
                                            <InfoIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Typography>
                            </Grid>
                        </Grid>
                        <Grid container alignItems={"stretch"} spacing={2} style={{marginBottom: 5}}>
                            <Grid item><Typography>Gene Connectivity</Typography></Grid>
                            <Grid item style={{ flexGrow: 1 }}>
                                <Slider 
                                    value={gene_degree || 1}
                                    color="blues"
                                    onChange={(e, nv)=>{
                                        const new_query = {...query}
                                        new_query.gene_degree = nv
                                        setQuery(new_query)
                                    }}
                                    style={{width: "100%"}}
                                    min={1}
                                    max={libraries.reduce((acc, i)=>(acc+i.term_limit), 0)}
                                    aria-labelledby="continuous-slider" />
                            </Grid>
                            <Grid item>
                                <Typography>
                                    {gene_degree || 1}
                                    <Tooltip title={`Filter out genes with fewer connections`}>
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
                                    value={gene_limit || input.genes.length || 100}
                                    color="blues"
                                    onChange={(e, nv)=>{
                                        const new_query = {...query}
                                        new_query.gene_limit = nv
                                        setQuery(new_query)
                                    }}
                                    style={{width: "100%"}}
                                    min={1}
                                    max={input.genes.length || 100}
                                    aria-labelledby="continuous-slider" />
                            </Grid>
                            <Grid item>
                                <Typography>
                                    {gene_limit || input.genes.length || 100}
                                    <Tooltip title={`Set this parameter to prioritize the top genes with most connections. (Set to all genes by default)`}>
                                        <IconButton size="small">
                                            <InfoIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Typography>
                            </Grid>
                        </Grid>
                        <FormLabel error={inputError}>Pick up to five libraries</FormLabel>
                        {libraries_list.map(library=>(
                            <React.Fragment key="library">
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
                                                    const new_query = {...query}
                                                    new_query.libraries = JSON.stringify(new_libraries)
                                                    setQuery(new_query)
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
                <Button variant='contained'
                    disabled={elements===null}
                    onClick={()=>{
                        setElements(null)
                        setInput({})
                        router.push({
                            pathname: `/${page}`,
                        }, undefined, { shallow: true })
                    }}
                >
                    Clear Graph
                </Button>
            </Grid>
            }
            <Grid item xs={12} md={collapsed ? 12: 9} style={{height: 1000}}>
                {/* <Snackbar open={openError}
					anchorOrigin={{ vertical:"top", horizontal:"right" }}
					autoHideDuration={3000}
					onClose={()=>setOpenError(false)}
					message={(error || {}).message}
					action={
                        <IconButton size="small" onClick={()=>setOpenError(false)}>
                            <HighlightOffIcon/>
                        </IconButton>
					}
				/> */}
                {elements && 
                    <React.Fragment>
                        <Tooltip title={collapsed ? "Show filters": "Hide filters"}>
                            <IconButton onClick={()=>setCollapsed(!collapsed)}>
                                {collapsed ? <VisibilityIcon/> : <VisibilityOffIcon/>}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Download graph as an image file"}>
                            <IconButton onClick={handleClickMenu}
                                aria-controls={anchorEl!==null ? 'basic-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={anchorEl!==null ? 'true' : undefined}
                            ><CameraAltOutlinedIcon/></IconButton>
                        </Tooltip>
                        <Menu
                            id="basic-menu"
                            anchorEl={anchorEl}
                            open={anchorEl!==null}
                            onClose={handleCloseMenu}
                            MenuListProps={{
                                'aria-labelledby': 'basic-button',
                            }}
                        >
                            <MenuItem key={'png'} onClick={()=> {
                                handleCloseMenu()
                                fileDownload(cyref.current.png({output: "blob"}), "network.png")
                            }}>PNG</MenuItem>
                            <MenuItem key={'jpg'} onClick={()=> {
                                handleCloseMenu()
                                fileDownload(cyref.current.jpg({output: "blob"}), "network.jpg")
                            }}>JPG</MenuItem>
                            <MenuItem key={'svg'} onClick={()=> {
                                handleCloseMenu()
                                fileDownload(cyref.current.svg({output: "blob"}), "network.svg")
                            }}>SVG</MenuItem>
                        </Menu>
                        <Tooltip title={"View in Enrichr"}>
                            <IconButton 
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://maayanlab.cloud/Enrichr/enrich?dataset=${shortId}`}
                            >
                                <LinkIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Share"}>
                            <IconButton onClick={()=>setOpenShare(true)}>
                                <ShareIcon/>
                            </IconButton>
                        </Tooltip>
                        <Modal
                            open={openShare}
                            onClose={()=>{
                                setOpenShare(false)}
                            }
                            aria-labelledby="child-modal-title"
                            aria-describedby="child-modal-description"
                        >
                        <Grid container
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 800,
                                bgcolor: 'background.paper',
                                border: '1px solid #000',
                                boxShadow: 15,
                                pt: 2,
                                px: 4,
                                pb: 3,
                              }}
                        >
                            <Grid item xs={12}>
                                <Typography variant='h6'><b>Share Link</b></Typography>
                            </Grid>
                            <Grid item xs={11}>
                                <TextField size='small'
                                    value={window.location}
                                    style={{width: "100%"}}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <IconButton onClick={()=>setOpenShare(false)}><HighlightOffIcon/></IconButton>
                            </Grid>
                        </Grid>
                    </Modal>
                    </React.Fragment>
                }
                { (userListId === undefined) ? null 
                : (elements === null) ? (
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
                {elements && <Legend elements={elements} left={(sm || collapsed) ? "10%": "30%"} top={sm ? 2000: 550}/>}
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