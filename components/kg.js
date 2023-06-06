import React, { useRef } from 'react';
import dynamic from 'next/dynamic'
import Link from 'next/link'
import useAsyncEffect from 'use-async-effect'
import { useRouter } from 'next/router'
import fileDownload from 'js-file-download'
import * as default_schema from '../public/schema.json'
import { isIFrame } from '../utils/helper';
import { usePrevious, shouldUpdateId } from './Enrichment';
import { process_tables } from '../utils/helper';

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
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';

import HubIcon from '@mui/icons-material/Hub';
import { mdiFamilyTree, mdiDotsCircle, mdiDna, mdiLinkVariant, mdiLinkVariantOff } from '@mdi/js';
import Icon from '@mdi/react';

import { toPng, toBlob, toSvg } from 'html-to-image';
import download from 'downloadjs'

const Grid = dynamic(() => import('@mui/material/Grid'));
const Box = dynamic(() => import('@mui/material/Box'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const Button = dynamic(() => import('@mui/material/Button'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Backdrop = dynamic(() => import('@mui/material/Backdrop'));
const Stack = dynamic(() => import('@mui/material/Stack'));

const ListItemText = dynamic(() => import('@mui/material/ListItemText'));
const ListItemIcon = dynamic(() => import('@mui/material/ListItemIcon'));

const Slider = dynamic(() => import('@mui/material/Slider'));
const Cytoscape = dynamic(() => import('./Cytoscape'), { ssr: false })
const AddBoxIcon  = dynamic(() => import('@mui/icons-material/AddBox'));
const IndeterminateCheckBoxIcon = dynamic(() => import('@mui/icons-material/IndeterminateCheckBox'));
const TooltipCard = dynamic(async () => (await import('./misc')).TooltipCard);
const Legend = dynamic(async () => (await import('./misc')).Legend);
const Selector = dynamic(async () => (await import('./misc')).Selector);
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormControlLabel = dynamic(() => import('@mui/material/FormControlLabel'));


const NetworkTable =  dynamic(() => import('./network_table'))
export const layouts = {
  "Force-directed": {
    name: 'fcose',
    quality: 'proof',
    randomize: 'false',
    animate: true,
    idealEdgeLength: edge => 150,
    icon: ()=><HubIcon/>
  },
  "Hierarchical Layout": {
    name: "breadthfirst",
    animate: true,
    spacingFactor: 1,
    padding: 15,
    avoidOverlap: true,
    icon: ()=><Icon path={mdiFamilyTree} size={0.8} />
  },
  Geometric: {
    name: 'avsdf',
    nodeSeparation: 150,
    icon: ()=><Icon path={mdiDotsCircle} size={0.8} />
  },
}




export default function KnowledgeGraph({entries, edges=[], default_relations, nodes, schema, initial_query={}, tooltip_viz, coexpression_prediction, gene_link_button}) {
  if (!schema) schema=default_schema  
  const router = useRouter()
  const {page,
        start_term,
        end_term,
        start_field="label",
        end_field="label",
        limit=25,
        path_length,
        relation,
        order=(Object.keys(schema.order || {}))[0],
        remove,
        expand,
        fullscreen=false,
        start=initial_query.start || schema.nodes[0].node,
        end=initial_query.end || initial_query.start || schema.nodes[0].node
      } = router.query
  const current_node = nodes[start] || Object.values(nodes)[0]
  const [allStartTerms, setAllStartTerms] = React.useState([])
  const [startTermInput, setStartTermInput] = React.useState(start_term || '')
  const [allEndTerms, setAllEndTerms] = React.useState([])
  const [endTermInput, setEndTermInput] = React.useState(end_term || '')
  const [node, setNode] = React.useState(null)
  const [edge, setEdge] = React.useState(null)
  const [data, setData] = React.useState(null)
  const [focused, setFocused] = React.useState(null)
  const [layout, setLayout] = React.useState(Object.keys(layouts)[0])
  const [edgeStyle, setEdgeStyle] = React.useState({})
  const [id, setId] = React.useState(0)
  const [tab, setTab] = React.useState('network')
  const [showTooltip, setShowTooltip] = React.useState(tooltip_viz!== undefined ? tooltip_viz: false)
  const [elements, setElements] = React.useState(undefined)
  const [controller, setController] = React.useState(null)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [anchorElLayout, setAnchorElLayout] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState([])
  const [legendVisibility, setLegendVisibility] = React.useState(false)
  const [legendSize, setLegendSize] = React.useState(0)
  const [augmentOpen, setAugmentOpen] = React.useState(false)
  const [augmentLimit, setAugmentLimit] = React.useState(10)
  const [geneLinksOpen, setGeneLinksOpen] = React.useState(false)
  const [geneLinks, setGeneLinks] = React.useState(JSON.parse(router.query.gene_links || '[]'))
  const [neighborCount, setNeighborCount] = React.useState(150)
  const [legendCount, setLegendCount] = React.useState(0)

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
  const networkref = useRef(null);
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
    if (start && entries[start]) {
      setAllStartTerms(entries[start])
      const {page, start: s, ...query} = router.query
      if (Object.keys(query).length === 0) {
        router.push({
          pathname: `/${page || ''}`,
          query: {
            start,
            start_term: initial_query.start_term || current_node.example[0],
          }
        }, undefined, {shallow: true})
      }  
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

  const handleClickMenu = (e, setter) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter) => {
		setter(null);
	};
  
  const resolve_elements = async (isActive) => {
    try {
      const controller = get_controller()
      reset_tooltip()
      const body = {
        start,
        start_term: start_term.replace(/\+/g, "%2B"),
        start_field,
        limit: router.query.limit || 25,
      }
      if (router.query.end) {
        body.end = router.query.end
      }
      if (end_term) {
        body.end_term = end_term.replace(/\+/g, "%2B")
        body.end_field = end_field
      }
      if (path_length) {
        body.path_length = path_length
      }
      if (relation) {
        body.relation = relation
      } else if (!end_term){
        body.relation = current_node.relation.join(",") || default_relations.join(",")
      } else if (end_term) {
        body.relation = edges.join(",")
      }
      if (remove) {
        body.remove = remove
      }
      if (expand) {
        body.expand = expand
      }
      if (router.query.augment) {
        body.augment = router.query.augment
      }
      if (router.query.augment_limit) {
        body.augment_limit = router.query.augment_limit
      }
      if (router.query.gene_links) {
        body.gene_links = router.query.gene_links
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
      setId(id+1)
    } catch (error) {
      console.error(error)
    }
  }

  const resolve_single_count = async (isActive) => {
    try {
      const controller = get_controller()
      reset_tooltip()
      const body = {
        start,
        start_term: start_term.replace(/\+/g, "%2B"),
        start_field,
        limit
      }
      if (!router.query.end) {
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
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/count?${body_str}`,
        {
          method: 'GET',
          signal: controller.signal,
        }) 
        if (!isActive) return
        const results = await res.json()
        if (!isActive) return
        const count = results.reduce((acc,i)=>(
          acc + i.count
        ), 0)
        if (count < 150) setNeighborCount(count)
        else setNeighborCount(150)
      }
    } catch (error) {
      console.error(error)
    }
  }

  React.useEffect(() => {
    const {page, ...query} = router.query
    if (Object.keys(query || {}).length === 0) {
      if (Object.keys(initial_query || {}).length > 0) {
        router.push({
          pathname: `/${page || ''}`,
          query: initial_query
        }, undefined, {shallow: true})
      } else {
        router.push({
          pathname: `/${page || ''}`,
          query: {
            start,
            start_term: current_node.example[0],
          }
        }, undefined, {shallow: true})
      }
    } else {
      resolve_elements(true)
      resolve_single_count(true)
    }
  }, [router.query])

  React.useEffect(()=>{
    setId(id+1)
  },[elements])

  React.useEffect(()=>{
    setGeneLinks(JSON.parse(router.query.gene_links || '[]'))
  }, [router.query])

  const geneLinksRelations = schema.edges.reduce((acc, i)=>{
      if (i.gene_link) return [...acc, ...i.match]
      else return acc
  }, [])
  
  const genes = (elements || []).reduce((acc, i)=>{
      if (i.data.kind === "Gene" && acc.indexOf(i.data.label) === -1) return [...acc, i.data.label]
      else return acc
  }, [])

  return (
    <Grid container justifyContent="space-around" spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2} justifyContent="flex-start" alignItems="center" >
          <Grid item>
            <Typography variant="body1"><b>Start with</b></Typography>
          </Grid>
          <Grid item>
            <Selector entries={Object.keys(entries).sort()} value={start} prefix={"Start"} onChange={(e)=>redirect({start: e})}/>
          </Grid>
          <Grid item>
            <Selector entries={Object.keys(entries[start])} value={start_field} prefix={"StartField"} onChange={(e)=>{
              setStartTermInput('')
              const {page, ...query} = router.query
              redirect({...query, start_field: e, start_term: (entries || {})[start][e][0]})
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
                  Find Shortest Paths between Two Nodes
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
              <Selector entries={Object.keys(entries).sort()} value={end} prefix={"End"} onChange={(e)=>{
                redirect({start, start_term, end: e, limit})
              }}/>
            </Grid>
            <Grid item>
              <Selector entries={Object.keys(entries[end])} value={end_field} prefix={"EndField"} onChange={(e)=>{
                setEndTermInput(e)
                const {page, ...query} = router.query
                redirect({...query, end_field: e, end_term: (entries || {})[end][e][0]})
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
                  Collapse to Focus the Search on a Single Node
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
                value={parseInt(limit)}
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
                max={(router.query.end || router.query.start === "Gene") ? 150: neighborCount}
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
            <Tooltip title={"Save subnetwork"}>
                <IconButton
                    disabled={elements===null}
                    onClick={()=>{
                        if (elements) process_tables(elements)
                    }}
                    style={{marginLeft: 5, borderRadius: 5, background: tab === "bar" ? "#e0e0e0": "none"}}
                >
                    <SaveIcon/>
                </IconButton>
            </Tooltip>
          </Grid>
          {tab === "network" &&
          <React.Fragment>
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
                      <MenuItem key={'png'} onClick={()=> {
                          setLayout(label)
                          handleCloseMenu(setAnchorElLayout)
                      }}>
                        <ListItemIcon>
                            {icon()}
                        </ListItemIcon>
                        <ListItemText>{label}</ListItemText>
                      </MenuItem>
                    ))}
                </Menu>
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
            </Grid>
            { (gene_link_button) &&
                <Grid item>
                    <Tooltip title={"Gene-gene connections"}>
                        <IconButton variant='contained'
                            onClick={()=>{
                            setGeneLinksOpen(!geneLinksOpen)
                            setAugmentOpen(false)
                            }}
                            style={{marginLeft: 5}}
                        >
                            <Icon path={router.query.gene_links ? mdiLinkVariantOff: mdiLinkVariant} size={0.8} />
                        </IconButton>
                    </Tooltip>
                </Grid>
            }
            { (!router.query.end && router.query.start !== "Gene" && coexpression_prediction) && 
              <Grid item>
                  <Tooltip title={router.query.augment ? "Reset network": "Augment network using co-expressed genes"}>
                      <IconButton
                          disabled={genes.length > 100}
                          onClick={()=>{
                              setGeneLinksOpen(false)
                              setAugmentOpen(!augmentOpen)
                          }}
                          style={{marginLeft: 5, borderRadius: 5, background: augmentOpen ? "#e0e0e0": "none"}}
                      >
                          <Icon path={mdiDna} size={0.8} />
                      </IconButton>
                  </Tooltip>
              </Grid>
            }
          </React.Fragment>
          }
          {tab === "network" &&
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
          }
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
                value={parseInt(limit)}
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
                max={(router.query.end || router.query.start === "Gene") ? 150: neighborCount}
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
                    Find Shortest Paths between Two Nodes
                </Button>
              </Grid>
            }
          </Grid>
        </Grid>
      }
      {(elements && geneLinksOpen) &&
                <Grid item xs={12}>
                    <Stack direction="row" alignItems="center" justifyContent={"flex-end"}>
                        <Typography variant='subtitle2' style={{marginRight: 5}}>Select relationships:</Typography>
                        {geneLinksRelations.map(i=>(
                              <FormControlLabel key={i} control={<Checkbox checked={geneLinks.indexOf(i)>-1} onChange={()=>{
                                if (geneLinks.indexOf(i)===-1) setGeneLinks([...geneLinks, i])
                                else setGeneLinks(geneLinks.filter(l=>l!==i))
                              }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                        ))}
                        <Tooltip title="Show gene links">
                            <IconButton
                                onClick={()=>{
                                    const {gene_links, page, ...query} = router.query
                                    router.push({
                                        pathname: `/${page || ''}`,
                                        query: {
                                            ...query,
                                            gene_links: JSON.stringify(geneLinks)
                                        }
                                    }, undefined, { shallow: true })
                                    setGeneLinksOpen(false)
                                }}
                            >
                                <SendIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset network">
                            <IconButton disabled={!router.query.gene_links}
                                onClick={()=>{
                                    const {gene_links, page, ...query} = router.query
                                    router.push({
                                        pathname: `/${page || ''}`,
                                        query
                                    }, undefined, { shallow: true })
                                    setGeneLinksOpen(false)
                                }}
                            >
                                <UndoIcon/>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Grid>
            }
            {(elements && augmentOpen) && 
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent={"flex-end"}>
                    <Typography variant='subtitle2'>Top co-expressed genes:</Typography>
                    <Slider 
                        value={augmentLimit || 10}
                        onChange={(e, nv)=>{
                            setAugmentLimit(nv)
                            // router.push({
                            //     pathname: `/${page || ''}`,
                            //     query: {
                            //         ...query,
                            //         augment: 'true',
                            //         augment_limit: nv
                            //     }
                            // }, undefined, { shallow: true })
                        }}
                        min={1}
                        max={50}
                        valueLabelDisplay='auto'
                        aria-labelledby="augment-limit-slider"
                        style={{width: 100}}
                    />
                    <Typography variant='subtitle2'>{augmentLimit}</Typography>
                    <Tooltip title="Augment genes">
                        <IconButton
                            disabled={genes.length > 100}
                            onClick={()=>{
                                const {augment, augment_limit, page, ...query} = router.query
                                router.push({
                                    pathname: `/${page || ''}`,
                                    query: {
                                        ...query,
                                        augment: 'true',
                                        augment_limit: augmentLimit || 10
                                    }
                                }, undefined, { shallow: true })
                                setAugmentOpen(false)
                            }}
                        >
                            <SendIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset network">
                        <IconButton disabled={!router.query.augment}
                            onClick={()=>{
                                const {augment, augment_limit, page, ...query} = router.query
                                router.push({
                                    pathname: `/${page || ''}`,
                                    query
                                }, undefined, { shallow: true })
                                setAugmentOpen(false)
                            }}
                        >
                            <UndoIcon/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Grid>
        }
      {tab === 'network' &&
        <Grid item xs={12} id="kg-network" style={{minHeight: 500, position: "relative"}} ref={networkref}>
          {(elements === undefined) ? (
            <Backdrop
              sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
              open={elements === undefined}
            >
              <CircularProgress/>
            </Backdrop> 
          ) : elements.length === 0 ? (
            <div>No results</div>
          ) : loading ? 
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress/>
            </Backdrop> 
          :
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
