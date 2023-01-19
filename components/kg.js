import React, { useRef } from 'react';
import dynamic from 'next/dynamic'
import Link from 'next/link'
import useAsyncEffect from 'use-async-effect'
import { useRouter } from 'next/router'
import fileDownload from 'js-file-download'
import * as default_schema from '../public/schema.json'
import { isIFrame } from '../utils/helper';
import { usePrevious, shouldUpdateId } from './Enrichment';

import Tooltip from '@mui/material/Tooltip';

import IconButton from '@mui/material/IconButton'

import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Box = dynamic(() => import('@mui/material/Box'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const Button = dynamic(() => import('@mui/material/Button'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Slider = dynamic(() => import('@mui/material/Slider'));
const Cytoscape = dynamic(() => import('./Cytoscape'), { ssr: false })
const AddBoxIcon  = dynamic(() => import('@mui/icons-material/AddBox'));
const IndeterminateCheckBoxIcon = dynamic(() => import('@mui/icons-material/IndeterminateCheckBox'));
const TooltipCard = dynamic(async () => (await import('./misc')).TooltipCard);
const Legend = dynamic(async () => (await import('./misc')).Legend);
const Selector = dynamic(async () => (await import('./misc')).Selector);

const NetworkTable =  dynamic(() => import('./network_table'))
export const layouts = {
  "Force-directed": {
    name: 'fcose',
    quality: 'proof',
    randomize: 'false',
    animate: true,
    idealEdgeLength: edge => 150,
  },
  "Hierarchical Layout": {
    name: "breadthfirst",
    animate: true,
    spacingFactor: 1,
    padding: 15,
    avoidOverlap: true,
  },
  Geometric: {
    name: 'avsdf',
    nodeSeparation: 150
  },
}




export default function KnowledgeGraph({entries, edges=[], default_relations, nodes, schema, initial_query, tooltip_viz}) {
  if (!schema) schema=default_schema  
  const router = useRouter()
  const {page, start_term, end_term, start_field="label", end_field="label", limit=25, path_length, relation, order=(Object.keys(schema.order || {}))[0], remove, expand, fullscreen=false} = router.query
  let start = router.query.start
  let end = router.query.end
  if (!start) start = schema.nodes[0].node
  if (!end) end = schema.nodes[0].node
  const current_node = nodes[start] || Object.values(nodes)[0]
  const [allStartTerms, setAllStartTerms] = React.useState([])
  const [startTermInput, setStartTermInput] = React.useState(start_term || '')
  const [allEndTerms, setAllEndTerms] = React.useState([])
  const [endTermInput, setEndTermInput] = React.useState(end_term || '')
  const [node, setNode] = React.useState(null)
  const [edge, setEdge] = React.useState(null)
  const [data, setData] = React.useState(null)
  const [focused, setFocused] = React.useState(null)
  const [layout, setLayout] = React.useState(0)
  const [edgeStyle, setEdgeStyle] = React.useState({label: 'data(label)'})
  const [id, setId] = React.useState(0)
  const [tab, setTab] = React.useState('network')
  const [showTooltip, setShowTooltip] = React.useState(tooltip_viz!== undefined ? tooltip_viz: true)
  const [elements, setElements] = React.useState(undefined)
  const [controller, setController] = React.useState(null)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState([])
  const [legendVisibility, setLegendVisibility] = React.useState(false)
  const [legendSize, setLegendSize] = React.useState(0)

  const firstUpdate = useRef(true);
  const prevQuery = usePrevious(router.query)
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
  const reset_tooltip = () => {
    setNode(null)
    setFocused(null)
  }
  const tableref = useRef(null);
  const redirect = (query) => {
    router.push({
      pathname: `/${page || ''}`,
      query
    }, undefined, {shallow: true})
  }
  React.useEffect(() => {
    setStartTermInput(start_term || '')
    reset_tooltip()
  }, [start_term])

  React.useEffect(() => {
    setEndTermInput(end_term || '')
    reset_tooltip()
  }, [end_term])

  React.useEffect(()=>{
    if (current_node && !start_term) {
      const query = initial_query || {
        start,
        start_term: current_node.example[0],
        // relation  
      }
      redirect(query)
    } else if (start && entries[start]) {
      setAllStartTerms(entries[start])
    }
  }, [start])

  React.useEffect(()=>{
	if (end && entries[end]) {
		setAllEndTerms(entries[end])
	}
  }, [end])

  const cyref = useRef(null);
  
  const get_controller = () => {
    if (controller) controller.abort()
    const c = new AbortController()
    setController(c)
    return c
  }

  const handleClickMenu = (e) => {
		setAnchorEl(e.currentTarget);
	  };
	const handleCloseMenu = () => {
		setAnchorEl(null);
	};
  
  const resolve_elements = async (isActive) => {
    try {
      const controller = get_controller()
      reset_tooltip()
      const body = {
        start,
        start_term,
        start_field,
        limit
      }
      if (end && end_term) {
        body.end = end
        body.end_term = end_term
        body.end_field = end_field
      }
      if (path_length) {
        body.path_length = path_length
      }
      if (relation) {
        body.relation = relation
      } else if (!end_term){
        body.relation = current_node.relation.join(",") || default_relations.join(",")
      }
      if (remove) {
        body.remove = remove
      }
      if (expand) {
        body.expand = expand
      }
      
      const body_str = Object.entries(body).map(([k,v])=>`${k}=${v}`).join("&")
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph?${body_str}`,
      {
        method: 'GET',
        signal: controller.signal,
      }) 
      if (!isActive) return
      const results = await res.json()
      if (!isActive) return
      const selected_edges = []
      for (const i of results) {
        if (i.data.relation && selected_edges.indexOf(i.data.relation) === -1) {
          selected_edges.push(i.data.relation)
        }
      }
      setSelected(selected_edges)
      setElements(results)
      setLoading(false)
      setData(results)
      if (shouldUpdateId(router.query, prevQuery)) setId(id+1)
    } catch (error) {
      console.error(error)
    }
  }

  useAsyncEffect(async (isActive) => {
    if (current_node && !start_term) {
      const query = initial_query || {
        start,
        start_term: current_node.example[0],
        // relation
      }
      router.push({
        pathname: `/${page || ''}`,
        query
      }, undefined, {shallow: true})
    } else {
      setLoading(true)
      await  resolve_elements(isActive)
    }
  }, [start_term, limit])

  useAsyncEffect(async (isActive) => {
    // if (end_term) {
    //   await  resolve_elements(isActive)
    // }
    setLoading(true)
    await  resolve_elements(isActive)
  }, [end_term])

  useAsyncEffect(async (isActive) => {
    // if (end_term) {
    //   await  resolve_elements(isActive)
    // }
    if (remove || expand) await  resolve_elements(isActive)
  }, [remove, expand])

  useAsyncEffect(async (isActive) => {
    if (firstUpdate.current && relation===undefined) {
      firstUpdate.current = false
    } else {
      setLoading(true)
      await  resolve_elements(isActive)
    }
  }, [relation, path_length])

                      
  return (
    <Grid container justifyContent="space-around" spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2} justifyContent="flex-start" alignItems="center" >
          <Grid item>
            <Typography variant="body1"><b>Start with</b></Typography>
          </Grid>
          <Grid item>
            <Selector entries={Object.keys(entries)} value={start} prefix={"Start"} onChange={(e)=>redirect({start: e})}/>
          </Grid>
          <Grid item>
            <Selector entries={Object.keys(entries[start])} value={start_field} prefix={"StartField"} onChange={(e)=>{
              setStartTermInput('')
              redirect({...router.query, start_field: e})
            }}/>
          </Grid>
          <Grid item>
            <Autocomplete
                id="my-input" aria-describedby="gene" 
                freeSolo
                options={(entries || {})[start][start_field] || []}
                value={startTermInput}
                onChange={(evt, value) => {
                  if (value === null) value = ''
                  setStartTermInput(value)
                  if (value !== '') {
                    const query = {
                      start,
                      start_term: value,
                      start_field,
                      limit
                    }
                    if (router.query.end) {
                      query.end = end
                      query.end_field = end_field
                    }
                    if (relation) {
                      query.relation = relation
                    }
                    router.push({
                      pathname: `/${page || ''}`,
                      query
                    }, undefined, { shallow: true })
                  }
                  
                }}
                style={{ width: 220}}
                renderInput={(params) => (
                  <TextField {...params} 
                    style={{
                      width: 220,
                      height: 50,
                      borderRadius: 5,
                      padding: 3
                    }}
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
                  />
                )}
              />
          </Grid>
          <Grid item>
            <Typography variant="body1">Example:</Typography>
          </Grid>
          {((current_node || {}).example || []).map((e,i)=>(
            <React.Fragment key={e}>
              <Grid item>
                <Link
                  href={{
                    pathname: `/${page || ''}`,
                    query: {
                      start,
                      start_term: e,
                      // relation
                    }
                  }}
                  shallow
                >
                  <Button style={{height: 45}}><Typography variant="body2">{e}</Typography></Button>
                </Link> 
              </Grid>
              { i < current_node.example.length - 1 && 
                <Grid item>
                  <Typography>/</Typography>
                </Grid> 
              }
            </React.Fragment>
          ))}
          {(!router.query.end && !isIFrame()) && 
            <Grid item>
              <Button onClick={()=>{
                const {path_length, ...rest} = router.query
                redirect({...rest, end})
              }} startIcon={<AddBoxIcon />}>
                  Add End Filter
              </Button>
            </Grid>
          }
        </Grid>
      </Grid>
      {router.query.end &&
        <Grid item xs={12}>
          <Grid container spacing={2} justifyContent="flex-start" alignItems="center" >
            <Grid item>
              <Typography variant="body1"><b>End with</b></Typography>
            </Grid>
            <Grid item>
              <Selector entries={Object.keys(entries)} value={end} prefix={"End"} onChange={(e)=>{
                redirect({start, start_term, end: e, limit})
              }}/>
            </Grid>
            <Grid item>
              <Selector entries={Object.keys(entries[end])} value={end_field} prefix={"StartField"} onChange={(e)=>{
                setEndTermInput(e)
                redirect({...router.query, end_field: e})
              }}/>
            </Grid>
            <Grid item>
              <Autocomplete
                id="my-input" aria-describedby="gene"
                freeSolo 
                options={(entries || {})[end][end_field] ||[]}
                getOptionLabel={(option) => option[end_field] ?? option}
                placeholder="Optional"
                value={endTermInput}
                onChange={(evt, value) => {
                  if (value === null) value = ''
                  setEndTermInput(value)
                  const query = {
                    start,
                    start_term,
                    start_field,
                    end,
                    end_term: value,
                    end_field,
                    limit
                  }
                  if (relation) query.relation = relation
                  router.push({
                    pathname: `/${page || ''}`,
                    query,
                  }, undefined, { shallow: true })
                }}
                style={{ width: 220 }}
                renderInput={(params) => (
                  <TextField {...params} 
                    style={{
                      width: 220,
                      height: 50,
                      borderRadius: 5,
                      padding: 3
                    }}
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
                  />
                )}
              />
            </Grid>
            <Grid item>
              <Button onClick={()=>{
                const {end, end_term, end_field, ...query} = router.query
                redirect({...query})}
              } startIcon={<IndeterminateCheckBoxIcon />}>
                  Remove End Filter
              </Button>
            </Grid>
          </Grid>
        </Grid>
      }
      <Grid item xs={12}>
        <Grid container spacing={1} alignItems="center" justifyContent="flex-start">
          {edges.length && <Grid item><Typography variant="body1"><b>Select relation:</b></Typography></Grid>}
          {edges.length && 
            <Grid item>
              <Selector entries={edges}
                value={relation ? relation.split(","): selected.length > 0 ? selected: current_node.relation || default_relations}
                prefix={"edge"}
                onChange={(e)=>{
                  const relation = e.filter(i=>i!=="").join(",")
                  if (relation === "") {
                    const {relation, ...query} = router.query
                    redirect(query)
                  } else {
                    redirect({...router.query, relation})
                  }
                }}
                renderValue={(selected) => (
                  <Box sx={{width: 180}}>
                    <Typography noWrap>{selected.join(", ")}</Typography>
                  </Box>
                )}
                multiple={true}/>
            </Grid>
          }
          {isIFrame() ? null:
          <React.Fragment>
            <Grid item>
              <Typography variant="body1"><b>Size:</b></Typography>
            </Grid>
            <Grid item xs={1}>
              <Slider 
                value={limit}
                color="blues"
                onChange={(e, nv)=>{
                  router.push({
                    pathname: `/${page || ''}`,
                    query: {
                      ...router.query,
                      limit: nv
                    }
                  }, undefined, { shallow: true })
                }}
                style={{marginBottom: -5}}
                min={10}
                max={100}
                aria-labelledby="continuous-slider" />
            </Grid>
            <Grid item>
              <Typography variant="body1">{limit}</Typography>
            </Grid>
          </React.Fragment>}
          <Grid item>
            <Tooltip title={fullscreen ? "Exit full screen": "Full screen"}>
                <IconButton variant='contained'
                    onClick={()=>{
                      const {fullscreen=false, ...query} = router.query
                      if (!fullscreen) query.fullscreen = 'true'
                      router.push({
                          pathname: `/${page || ''}`,
                          query
                        }, undefined, { shallow: true })
                      }}
                    style={{marginLeft: 5}}
                >
                    {fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                </IconButton>
            </Tooltip>
          </Grid>
          <Grid item>
              <Tooltip title={"Network view"}>
                  <IconButton
                      disabled={elements===null}
                      onClick={()=>{
                          setTab('network')
                      }}
                      style={{marginLeft: 5, borderRadius: 5, background: tab === "network" ? "#e0e0e0": "none"}}
                  >
                      <span className='mdi mdi-graph'/>
                  </IconButton>
              </Tooltip>
          </Grid>
          <Grid item>
              <Tooltip title={"Table view"}>
                  <IconButton
                      disabled={elements===null}
                      onClick={()=>{
                          setTab('table')
                      }}
                      style={{marginLeft: 5, borderRadius: 5, background: tab === "table" ? "#e0e0e0": "none"}}
                  >
                      <span className='mdi mdi-table'/>
                  </IconButton>
              </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title={showTooltip ? "Hide tooltip": "Show tooltip"}>
                <IconButton variant='contained'
                    disabled={elements===null}
                    onClick={()=>{
                        setShowTooltip(!showTooltip)
                    }}
                    style={{marginLeft: 5}}
                >
                    {showTooltip ? <span className='mdi mdi-tooltip-remove'/>: <span className='mdi mdi-tooltip'/>}
                </IconButton>
            </Tooltip>
          </Grid>  
          <Grid item>
            <Tooltip title="Switch Graph Layout">
                <IconButton variant='contained'
                    disabled={elements===null}
                    onClick={()=>{
                        setLayout(layout + 1 === Object.keys(layouts).length ? 0: layout+1)
                    }}
                    style={{marginLeft: 5}}
                >
                    <FlipCameraAndroidIcon/>
                </IconButton>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title={edgeStyle.label ? "Hide edge labels": "Show edge labels"}>
                <IconButton variant='contained'
                    disabled={elements===null}
                    onClick={()=>{
                        if (edgeStyle.label) setEdgeStyle({})
                        else setEdgeStyle({label: 'data(label)'})
                    }}
                    style={{marginLeft: 5}}
                >
                    {edgeStyle.label ? <VisibilityOffIcon/>: <VisibilityIcon/>}
                </IconButton>
            </Tooltip>
          </Grid>          
          <Grid item>
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
          </Grid>
          <Grid item>
              <Tooltip title={!legendVisibility ? "Show legend": "Hide legend"}>
                  <IconButton variant='contained'
                      disabled={elements===null}
                      onClick={()=>{
                          setLegendVisibility(!legendVisibility)
                      }}
                      style={{marginLeft: 5}}
                  >
                      {!legendVisibility ? <LabelIcon />: <LabelOffIcon />}
                  </IconButton>
              </Tooltip>
          </Grid>
          {legendVisibility &&
              <Grid item>
                  <Tooltip title="Adjust legend size">
                      <IconButton variant='contained'
                          disabled={elements===null}
                          onClick={()=>{
                              setLegendSize((legendSize+1)%5)
                          }}
                          style={{marginLeft: 5}}
                      >
                          {legendSize < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
                      </IconButton>
                  </Tooltip>
              </Grid>
          }
        </Grid>
          
          
      </Grid>
      {isIFrame() && 
        <Grid item xs={12}>
          <Grid container spacing={1} alignItems="center" justifyContent="flex-start">
            <Grid item>
              <Typography variant="body1"><b>Size:</b></Typography>
            </Grid>
            <Grid item xs={2}>
              <Slider 
                value={limit}
                color="blues"
                onChange={(e, nv)=>{
                  router.push({
                    pathname: `/${page || ''}`,
                    query: {
                      ...router.query,
                      limit: nv
                    }
                  }, undefined, { shallow: true })
                }}
                style={{marginBottom: -5}}
                min={10}
                max={100}
                aria-labelledby="continuous-slider" />
            </Grid>
            <Grid item>
              <Typography variant="body1">{limit}</Typography>
            </Grid>
            {(!router.query.end) && 
              <Grid item>
                <Button onClick={()=>{
                  const {path_length, ...rest} = router.query
                  redirect({...rest, end})
                }} startIcon={<AddBoxIcon />}>
                    Add End Filter
                </Button>
              </Grid>
            }
          </Grid>
        </Grid>
      }
      {tab === 'network' &&
        <Grid item xs={12} style={{minHeight: 500, position: "relative"}}>
          {(elements === undefined) ? (
            <CircularProgress/>
          ) : elements.length === 0 ? (
            <div>No results</div>
          ) : loading ? <CircularProgress/>:
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
              layout={Object.values(layouts)[layout]}
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
          {(elements && legendVisibility) && <Legend elements={elements} legendSize={legendSize}/>}
          {(focused === null && showTooltip && node) && <TooltipCard 
              node={node}
              schema={schema}
              tooltip_templates={ tooltip_templates_node}
              setFocused={setFocused}
              router={router}
              endpoint={`/${page || ''}`}
              expand={false}
              reset={()=>{
                setEdge(null)
                setNode(null)
                setFocused(null)
              }}
              />
          }
          {(showTooltip && focused) && <TooltipCard 
              node={focused}
              schema={schema}
              tooltip_templates={ tooltip_templates_node}
              setFocused={setFocused}
              router={router}
              endpoint={`/${page || ''}`}
              expand={false}
              reset={()=>{
                setEdge(null)
                setNode(null)
                setFocused(null)
              }}
              />
          }
          {(focused === null && showTooltip && edge) && <TooltipCard 
              node={edge}
              schema={schema}
              tooltip_templates={tooltip_templates_edges}
              setFocused={setFocused}
              router={router}
              endpoint={`/${page || ''}`}
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
      {tab === 'table' && 
      <Grid item xs={12} sx={{minHeight: 700}}>
        <div ref={tableref}>
          <NetworkTable data={data} schema={schema}/>
        </div>
      </Grid>
      }
    </Grid>
  )
}
