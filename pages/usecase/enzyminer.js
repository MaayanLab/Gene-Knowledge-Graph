import React, { useState, useEffect, useRef } from "react";
import { fetch_kg_schema } from '../../utils/initialize';
import dynamic from "next/dynamic";
import { withRouter
 } from "next/router";

import { layouts } from "../../components/kg";
import Tooltip from "@mui/material/Tooltip";
import IconButton from '@mui/material/IconButton'
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SaveIcon from '@mui/icons-material/Save';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import { process_tables } from "../../utils/helper";
import { toPng, toBlob, toSvg } from 'html-to-image';
import download from 'downloadjs'
import fileDownload from 'js-file-download'

const Grid = dynamic(() => import('@mui/material/Grid'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormControlLabel = dynamic(() => import('@mui/material/FormControlLabel'));
const Stack = dynamic(() => import('@mui/material/Stack'));
const Slider = dynamic(() => import('@mui/material/Slider'), {ssr: false});
const Cytoscape = dynamic(() => import('../../components/Cytoscape'), { ssr: false })
const TooltipCard = dynamic(async () => (await import('../../components/misc')).TooltipCard);
const Legend = dynamic(async () => (await import('../../components/misc')).Legend);
const NetworkTable =  dynamic(() => import('../../components/network_table'))

const Selector = dynamic(async () => (await import('../../components/misc')).Selector);
const ListItemIcon = dynamic(() => import('@mui/material/ListItemIcon'));
const ListItemText = dynamic(() => import('@mui/material/ListItemText'));


const relations = ["positively regulates", "negatively regulates", "expresses"]  
function Enzyme2Drugs({
        schema,
        router, 
        tooltip_templates_node,
        tooltip_templates_edges}){
    const [options, setOptions] = useState({})
    const [selected, setSelected] = useState(null)
    const [term, setTerm] = useState(router.query.term || 'CES1 gene')
    const [enzyme, setEnzyme] = useState(true)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [optionsController, setOptionsController] = useState(null)
    const [resolverController, setResolverController] = useState(null)
    const [elements, setElements] = useState(null)
    const [id, setId] = useState(0)
    const [node, setNode] = React.useState(null)
    const [edge, setEdge] = React.useState(null)
    const [focused, setFocused] = React.useState(null)
    const [anchorEl, setAnchorEl] = React.useState(null)
    const [anchorElLayout, setAnchorElLayout] = React.useState(null)
    const field = router.query.field || "label"
    const cyref = useRef(null);
    const tableref = useRef(null);
    const edgeStyle = router.query.edge_labels ? {label: 'data(label)'} : {}
    
    const get_controller = (controller, setController) => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
      }

    const handleClickMenu = (e, setter) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter) => {
		setter(null);
	};

    const resolve_options = async () => {
        try {
            const controller = get_controller(optionsController, setOptionsController)
            const {limit} = router.query 
            const query = {
                field,
            }
            
            query.type = "Gene"
            if (enzyme) query.filter=`{"is_Enzyme":true}`
            if (term) query.term = term
            if (limit) query.limit = limit
            const query_str = Object.entries(query).map(([k,v])=>(`${k}=${v}`)).join("&")
            const options = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/node_search${query_str ? "?" + query_str : ""}`, {
                method: 'GET',
                signal: controller.signal
            })).json()  
            setSelected(options[term])
            setOptions(options)  
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    useEffect(()=>{
        setLoading(true)
        resolve_options()
    }, [term, enzyme])

    useEffect(()=>{
        const opts = {}
        for (const i of Object.values(options)) {
            opts[i[field]] = i
        }   
        setOptions(opts)
        if (selected) {        
            setTerm(selected[field])
            router.push({
                query: {
                    term: selected[field],
                    field
                }
            }, undefined, {shallow: true})
        }
    }, [field])

    useEffect(()=>{
        const search_term = async (term) => {
            try {
                const controller = get_controller(resolverController, setResolverController)
                const relation = relations.map(name=>({name, limit: router.query.limit || 5}))
                const body = {
                    start: "Gene",
                    start_term: term,
                    start_field: field,
                    relation
                  }
                const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph?filter=${JSON.stringify(body)}`,
                    {
                    method: 'GET',
                    signal: controller.signal,
                    }
                ) 
                const results = await res.json()
                setElements(results)
                setId(id+1)
                // if (Object.keys(options).length === 0) await resolve_options()
                
            } catch (error) {
                console.error(error)
            } 
        }
        if (router.query.term) {
            if (!selected || selected[field] !== router.query.term) {
                search_term(router.query.term)
            }
        }
        else if (term && !router.query.term) {
            router.push({
                query: {
                    term
                }
            }, undefined, {shallow: true})
        }
        // else setElements(null)
    }, [router.query.term])

    return (
        <Grid container alignItems={"center"} sx={{marginTop: -8}}>
            <Grid item xs={12}>
                <Typography variant="h5">
                    <b>Use Case 4: EnzyMiner</b>
                </Typography>
                <Typography>
                    Select a gene to view drugs that up or down regulate it as well as tissues that highly expresses it.
                </Typography>
            </Grid>
            <Grid item xs={12}>
                <Stack direction={"row"} spacing={1} alignItems={"center"}>
                    <Typography><b>Select Gene:</b></Typography>
                    <Autocomplete
                        sx={{ width: 300 }}
                        value={term}
                        open={open}
                        onOpen={() => {
                            setOpen(true);
                        }}
                        onClose={() => {
                            setOpen(false);
                        }}
                        options={Object.keys(options)}
                        loading={loading}
                        filterOptions={(x) => x}
                        onChange={(e, value)=> {
                            const {term, ...query} = router.query
                            if (!value) {
                                setTerm('')
                            }
                            else {
                                setTerm(value)
                                router.push({
                                    query: {...query, term: value}
                                }, undefined, {shallow: true})
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                            {...params}
                            onChange={(e)=> {
                                {
                                    setTerm(e.target.value)
                                }
                            }}
                            style={{
                                height: 50,
                                borderRadius: 5,
                                padding: 3
                            }}
                            InputProps={{
                                ...params.InputProps,
                                style: {
                                    fontSize: 12,
                                    height: 45,
                                    width: "100%",
                                    paddingLeft: 5
                                },
                                endAdornment: (
                                <React.Fragment>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </React.Fragment>
                                ),
                            }}
                            />
                        )}
                    />
                    <FormControlLabel control={<Checkbox checked={enzyme} onClick={()=>{
                        setEnzyme(!enzyme)
                    }}/>} label="Enzyme" />
                    <Typography><b>Select Field:</b></Typography>
                    <Selector entries={["ENTREZ", "UNIPROTKB", "label", "HGNC"]} 
                        value={router.query.field ||"label"} 
                        prefix={"Field"} onChange={(e)=>{
                            const {field="label", ...query} = router.query
                            router.push({
                                query: {
                                    ...query,
                                    field: e
                                }
                            }, undefined, {shallow: true})
                        }}/>
                    <Typography><b>Limit per relation:</b></Typography>
                    <Slider 
                        value={router.query.limit || 5}
                        color="blues"
                        onChange={(e, nv)=>{
                            const {limit, ...query} = router.query
                            query.limit = nv || 5
                            router.push({
                                query
                            }, undefined, {shallow: true})
                        }}
                        min={1}
                        max={25}
                        sx={{width: 100}}
                        aria-labelledby="continuous-slider"
                    />
                    <Typography>{router.query.limit || 5}</Typography>
                </Stack>
            </Grid>
            <Grid item xs={12} sx={{marginTop: 1}}>
                <Stack direction={"row"} spacing={1} alignItems={"center"} justifyContent={"flex-end"}>
                    <Tooltip title={router.query.fullscreen ? "Exit full screen": "Full screen"}>
                        <IconButton variant='contained'
                            onClick={()=>{
                                const {fullscreen, ...query} = router.query
                                if (!fullscreen) query.fullscreen = 'true'
                                router.push({
                                    query
                                }, undefined, {shallow: true})
                            }}
                            style={{marginLeft: 5}}
                        >
                            {router.query.fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Network view"}>
                        <IconButton
                            onClick={()=>{
                                const {view, ...query} = router.query
                                // query.view = 'network'
                                router.push({
                                    query
                                }, undefined, {shallow: true})
                            }}
                            style={{marginLeft: 5, borderRadius: 5, background: (!router.query.view) ? "#e0e0e0": "none"}}
                        >
                            <span className='mdi mdi-graph'/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Table view"}>
                        <IconButton
                            onClick={()=>{
                                router.push({
                                    query: {
                                        ...router.query,
                                        view: "table"
                                    }
                                }, undefined, {shallow: true})
                            }}
                            style={{marginLeft: 5, borderRadius: 5, background: router.query.view === "table" ? "#e0e0e0": "none"}}
                        >
                            <span className='mdi mdi-table'/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Save subnetwork"}>
                        <IconButton
                            onClick={()=>process_tables(elements)}
                            style={{marginLeft: 5, borderRadius: 5}}
                        >
                            <SaveIcon/>
                        </IconButton>
                    </Tooltip>
                    {(!router.query.view) &&
                        <React.Fragment>
                            <Tooltip title={router.query.tooltip ? "Hide tooltip": "Show tooltip"}>
                                <IconButton variant='contained'
                                    onClick={()=>{
                                        const {tooltip, ...query} = router.query
                                        if (!tooltip) query.tooltip = true
                                        router.push({
                                            query
                                        }, undefined, {shallow: true})
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    {router.query.tooltip ? <span className='mdi mdi-tooltip-remove'/>: <span className='mdi mdi-tooltip'/>}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Switch Graph Layout">
                                <IconButton variant='contained'
                                    onClick={(e)=>handleClickMenu(e, setAnchorElLayout)}
                                    aria-controls={anchorEl!==null ? 'basic-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={anchorEl!==null ? 'true' : undefined}
                                    style={{marginLeft: 5}}
                                >
                                    <FlipCameraAndroidIcon/>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                id="basic-menu"
                                anchorEl={anchorElLayout}
                                open={anchorElLayout!==null}
                                onClose={()=>handleCloseMenu(setAnchorElLayout)}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                { Object.entries(layouts).map(([label, {icon}])=>(
                                <MenuItem key={label} onClick={()=> {
                                    const {layout, ...query} = router.query
                                    query.layout = label
                                    router.push({
                                        query
                                    }, undefined, {shallow: true})
                                    handleCloseMenu(setAnchorElLayout)
                                }}>
                                    <ListItemIcon>
                                        {icon()}
                                    </ListItemIcon>
                                    <ListItemText>{label}</ListItemText>
                                </MenuItem>
                                ))}
                            </Menu>
                            <Tooltip title={router.query.edge_labels ? "Hide edge labels": "Show edge labels"}>
                                <IconButton variant='contained'
                                    onClick={()=>{
                                        // if (edgeStyle.label) setEdgeStyle({})
                                        // else setEdgeStyle({label: 'data(label)'})
                                        const {edge_labels, ...query} = router.query
                                        if (!edge_labels) query.edge_labels = true
                                        router.push({
                                            query
                                        }, undefined, {shallow: true})
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    {router.query.edge_labels ? <VisibilityOffIcon/>: <VisibilityIcon/>}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={"Download graph as an image file"}>
                                    <IconButton onClick={(e)=>handleClickMenu(e, setAnchorEl)}
                                        aria-controls={anchorEl!==null ? 'basic-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={anchorEl!==null ? 'true' : undefined}
                                    ><CameraAltOutlinedIcon/></IconButton>
                                </Tooltip>
                                <Menu
                                    id="basic-menu"
                                    anchorEl={anchorEl}
                                    open={anchorEl!==null}
                                    onClose={()=>handleCloseMenu(setAnchorEl)}
                                    MenuListProps={{
                                        'aria-labelledby': 'basic-button',
                                    }}
                                >
                                    <MenuItem key={'png'} onClick={()=> {
                                        handleCloseMenu(setAnchorEl)
                                        // fileDownload(cyref.current.png({output: "blob"}), "network.png")
                                        toPng(document.getElementById('kg-network'))
                                        .then(function (fileUrl) {
                                            download(fileUrl, "network.png");
                                        });
                                    }}>PNG</MenuItem>
                                    <MenuItem key={'jpg'} onClick={()=> {
                                        handleCloseMenu(setAnchorEl)
                                        // fileDownload(cyref.current.jpg({output: "blob"}), "network.jpg")
                                        toBlob(document.getElementById('kg-network'))
                                        .then(function (blob) {
                                            fileDownload(blob, "network.jpg");
                                        });
                                    }}>JPG</MenuItem>
                                    <MenuItem key={'svg'} onClick={()=> {
                                        handleCloseMenu(setAnchorEl)
                                        // fileDownload(cyref.current.svg({output: "blob"}), "network.svg")
                                        toSvg(document.getElementById('kg-network'))
                                        .then(function (dataUrl) {
                                            download(dataUrl, "network.svg")
                                        });
                                    }}>SVG</MenuItem>
                                </Menu>
                                <Tooltip title={!router.query.legend ? "Show legend": "Hide legend"}>
                                    <IconButton variant='contained'
                                        onClick={()=>{
                                            const {legend, legend_size, ...query} = router.query
                                            if (!legend) query.legend = true
                                            router.push({
                                                query
                                            }, undefined, {shallow: true})
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {!router.query.legend ? <LabelIcon />: <LabelOffIcon />}
                                    </IconButton>
                                </Tooltip>
                                {router.query.legend &&
                                    <Tooltip title="Adjust legend size">
                                        <IconButton variant='contained'
                                            onClick={()=>{
                                                const {legend_size=0, ...query} = router.query
                                                query.legend_size = (parseInt(legend_size) +1)%5
                                                router.push({
                                                    query
                                                }, undefined, {shallow: true})
                                            }}
                                            style={{marginLeft: 5}}
                                        >
                                            {router.query.legend_size < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
                                        </IconButton>
                                    </Tooltip>
                                }
                        </React.Fragment>
                    }
                </Stack>
            </Grid>
            { (!router.query.view || router.query.view === "network") &&
                <Grid item xs={12} id="kg-network" style={{minHeight: 500, position: "relative"}}>
                    {(elements) && 
                        <Cytoscape
                            key={id}
                            wheelSensitivity={0.1}
                            style={{
                                width: '100%',
                                height: 700,
                            }}
                            stylesheet={[
                                {
                                selector: 'node',
                                style: {
                                    'background-color': 'data(color)',
                                    'border-color': 'data(borderColor)',
                                    'border-width': 'data(borderWidth)',
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
                            elements={[...elements.nodes, ...elements.edges]}
                            layout={layouts[router.query.layout || 'Force-directed']}
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
                                    setEdge(null)
                                    setNode(null)
                                    setFocused(node)
                                    setTimeout(()=>{
                                        const sel = evt.target;
                                        cy.elements().removeClass('focusedSemitransp');
                                        sel.removeClass('focused').outgoers().removeClass('focusedColored')
                                        sel.incomers().removeClass('focusedColored')
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
                                    if (focused === null && n.id !== (node || {}).id) {
                                        setEdge(null)
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
                                    const e = evt.target.data()
                                    const sel = evt.target;
                                    cy.elements().not(sel).addClass('semitransp');
                                    sel.addClass('colored').connectedNodes().addClass('highlight')
                                    sel.connectedNodes().removeClass('semitransp')
                                    if (focused === null && e.id !== (edge || {}).id) {
                                        // setAnchorEl(evt.target.popperRef())
                                        // setNode({node: n})
                                        setNode(null)
                                        setEdge(e)
                                    }
                                });
                                cy.edges().on('mouseout', (evt) => {
                                    const sel = evt.target;
                                    cy.elements().removeClass('semitransp');
                                    sel.removeClass('colored').connectedNodes().removeClass('highlight')
                                    // setAnchorEl(null)
                                    // setNode({node: null})
                                    setEdge(null)
                                });
                            }}
                        />
                    }

                    { (elements && router.query.legend) &&
                        <Legend elements={elements} legendSize={router.query.legend_size}/>
                    }
                    { (focused === null && router.query.tooltip && node) && <TooltipCard 
                        node={node}
                        schema={schema}
                        tooltip_templates={tooltip_templates_node}
                        setFocused={setFocused}
                        router={router}
                        expand={false}
                        endpoint={`/`}
                        reset={()=>{
                            setEdge(null)
                            setNode(null)
                            setFocused(null)
                        }}
                        />
                    }
                    {(focused === null && router.query.tooltip && edge) && <TooltipCard 
                        node={edge}
                        schema={schema}
                        tooltip_templates={tooltip_templates_edges}
                        setFocused={setFocused}
                        router={router}
                        endpoint={`/`}
                        expand={false}
                        reset={()=>{
                            setEdge(null)
                            setNode(null)
                            setFocused(null)
                        }}
                        />
                    }
                </Grid>
            }
            {router.query.view === 'table' && 
                <Grid item xs={12} sx={{minHeight: 700}}>
                    <div ref={tableref}>
                        <NetworkTable data={elements} schema={schema}/>
                    </div>
                </Grid>
            }
            
        </Grid>
    )
}

export async function getStaticProps(ctx) {
    const schema = await fetch_kg_schema()
    const tooltip_templates_node = {}
    const tooltip_templates_edges = {}
    for (const i of schema.nodes) {
        tooltip_templates_node[i.node] = i.display
    }

    for (const e of schema.edges) {
        for (const i of e.match) {
            tooltip_templates_edges[i] = e.display
        }
    }
    return {
      props: {
        schema,
        tooltip_templates_node,
        tooltip_templates_edges
      }
    };
  }

export default withRouter(Enzyme2Drugs)