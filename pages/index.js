import React, { useRef } from 'react';
import dynamic from 'next/dynamic'
import Link from 'next/link'
import useAsyncEffect from 'use-async-effect'
import { useRouter } from 'next/router'
import { fetch_kg_schema, get_terms } from '../utils/initialize';
import { precise, makeTemplate } from '../utils/helper';
import fileDownload from 'js-file-download'
import * as default_schema from '../public/schema.json'
import Color from 'color'

const Grid = dynamic(() => import('@mui/material/Grid'));
const Box = dynamic(() => import('@mui/material/Box'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const FormControl = dynamic(() => import('@mui/material/FormControl'));
const Select = dynamic(() => import('@mui/material/Select'));
const MenuItem = dynamic(() => import('@mui/material/MenuItem'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const Button = dynamic(() => import('@mui/material/Button'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const Switch = dynamic(() => import('@mui/material/Switch'));
const Card = dynamic(() => import('@mui/material/Card'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Slider = dynamic(() => import('@mui/material/Slider'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const Cytoscape = dynamic(() => import('../components/Cytoscape'), { ssr: false })
const CameraAltOutlinedIcon  = dynamic(() => import('@mui/icons-material/CameraAltOutlined'));
const AddBoxIcon  = dynamic(() => import('@mui/icons-material/AddBox'));
const IndeterminateCheckBoxIcon = dynamic(() => import('@mui/icons-material/IndeterminateCheckBox'));
const NetworkTable =  dynamic(() => import('../components/network_table'))
const layouts = {
  "Force-directed": {
    name: 'fcose',
    animate: true,
    nodeRepulsion: node => 10000,
    // Ideal edge (non nested) length
    idealEdgeLength: edge => 150
  },
  "Hierarchical Layout": {
    name: "breadthfirst",
    animate: true,
    spacingFactor: 1,
    padding: 15
  },
  Geometric: {
    name: 'avsdf',
    nodeSeparation: 150
  },
}

const default_examples = {
  Gene: {
	  href: {
        pathname: "/knowledge_graph",
        query: {
			start: "Gene",
			start_term: "CAND2",
		  }
      },
	  color: "greens"

  } 
}

const TooltipCard = ({node, tooltip_templates, setFocused, router, schema}) => {
  const elements = []
  const field = node.kind === "Relation" ? node.label : node.kind
  for (const i of tooltip_templates[field] || []) {
    if (i.type === "link") {
      const text = makeTemplate(i.text, node.properties)
      const href = makeTemplate(i.href, node.properties)
      if (text !== 'undefined') {
        elements.push(
          <Typography key={i.label} variant="subtitle2">
            <b>{i.label}</b> <Button size='small' 
                style={{padding: 0}} 
                href={href}
								target="_blank"
								rel="noopener noreferrer"
            >{text}</Button>
          </Typography>  
        )
      }
    } else {
      const e = makeTemplate(i.text, node.properties)
      if (e !== 'undefined') {
        elements.push(
          <Typography key={i.label} variant="subtitle2">
            <b>{i.label}</b> {i.type === "text" ? e: precise(e)}
          </Typography>  
        )
      }
    }
  }
  return(
    <Box sx={{
        zIndex: 'tooltip',
        position: 'absolute',
        top: '40%',
        right: '10%',
      }}>
      <Card>
        <CardContent>
          <Typography variant="h6">
            <b>{node.label}</b>
          </Typography>
          {elements}
          {node.kind !== "Relation" && <Button
            variant="outlined"
            onClick={()=>{
              setFocused(null)
              router.push({
                pathname: schema.endpoint || '',
                query: {
                  start: node.kind,
                  start_term: node.label
                }
              }, undefined, { shallow: true })
            }}
          >Expand</Button>}
        </CardContent>
      </Card>
    </Box>
  )
}

const Selector = ({entries, value, onChange, prefix, ...props }) => {
  if (entries.length === 1) return null
  else return (
    <FormControl>
      <Select
        labelId={`${prefix}layouts-select`}
        id={`${prefix}-label`}
        value={value}
        onChange={(e,v)=>onChange(e.target.value)}
        variant="outlined"
        disableUnderline={true}
        style={{width: 215, padding: 0, height: 45}}
        {...props}
        >
        {entries.map(val=>(
          <MenuItem key={val} value={val}>{props.multiple && <Checkbox checked={value.indexOf(val)>-1}/>}{val.replace(/_/g," ")}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )

}

export default function KnowledgeGraph({entries, edges=[], examples=default_examples, schema}) {
  if (!schema) schema=default_schema  
  const router = useRouter()
  const {start_term, end_term, start_field="label", end_field="label", relation, limit=25, order=(Object.keys(schema.order || {}))[0]} = router.query
  let start = router.query.start
  let end = router.query.end
  if (!start) start = schema.nodes[0].node
  if (!end) end = schema.nodes[0].node
  const [allStartTerms, setAllStartTerms] = React.useState([])
  const [startTermInput, setStartTermInput] = React.useState(start_term || '')
  const [allEndTerms, setAllEndTerms] = React.useState([])
  const [endTermInput, setEndTermInput] = React.useState(end_term || '')
  const [node, setNode] = React.useState(null)
  const [data, setData] = React.useState(null)
  const [focused, setFocused] = React.useState(null)
  const [layout, setLayout] = React.useState(Object.keys(layouts)[0])
  const [edgeStyle, setEdgeStyle] = React.useState({label: 'data(label)'})
  const [id, setId] = React.useState(0)
  const [elements, setElements] = React.useState(undefined)
  const [controller, setController] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  const firstUpdate = useRef(true);
  const tooltip_templates = {}
  for (const i of schema.nodes) {
    tooltip_templates[i.node] = i.display
  }

  for (const e of schema.edges) {
    for (const i of e.match) {
      tooltip_templates[i] = e.display
    }
  }

  const tableref = useRef(null);
  const redirect = (query) => {
    router.push({
      pathname: schema.endpoint || '',
      query
    }, undefined, {shallow: true})
  }

  React.useEffect(() => {
    setStartTermInput(start_term || '')
    setFocused(null)
  }, [start_term])

  React.useEffect(() => {
    setEndTermInput(end_term || '')
    setFocused(null)
  }, [end_term])

  React.useEffect(()=>{
    if (!start) {
      const query = examples[Object.keys(examples)[0]].href.query
      redirect(query)
    } else if (!start_term) {
      const query = examples[start].href.query
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
  
  const resolve_elements = async (isActive) => {
    try {
      setLoading(true)
      const controller = get_controller()
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
      if (relation) {
        body.relation = relation
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
      setElements(results)
      setLoading(false)
      setData(results)
      setId(id => id+1)
    } catch (error) {
      console.error(error)
    }
  }

  useAsyncEffect(async (isActive) => {
    if (!start_term) {
      if (elements === undefined) {
        router.push({
          pathname: schema.endpoint || '',
          query: {
            start,
            start_term: examples[start].href.query.start_term
          }
        }, undefined, {shallow: true})
      }
    } else {
      await  resolve_elements(isActive)
    }
  }, [start_term, limit])

  useAsyncEffect(async (isActive) => {
    if (end_term) {
      await  resolve_elements(isActive)
    }
  }, [end_term])

  useAsyncEffect(async (isActive) => {
    if (firstUpdate.current) {
      firstUpdate.current = false
    } else {
      await  resolve_elements(isActive)
    }
  }, [relation])

  const example = examples[start]
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
                    if (end) {
                      query.end = end
                      query.end_field = end_field
                    }
                    if (relation) {
                      query.relation = relation
                    }
                    router.push({
                      pathname:  schema.endpoint || '',
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
          { example &&
            <React.Fragment>
              <Grid item>
                <Typography variant="body1">Example:</Typography>
              </Grid>
              <Grid item>
                <Link
                  href={example.href}
                  shallow
                >
                  <Button color={example.palette.name} style={{height: 45}}><Typography variant="body2">{example.href.query.start_term}</Typography></Button>
                </Link> 
              </Grid>
            </React.Fragment> 
          }
          {!router.query.end && 
            <Grid item>
              <Button onClick={()=>redirect({...router.query, end})} startIcon={<AddBoxIcon />}>
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
                    pathname:  schema.endpoint || '',
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
                value={(relation || "").split(",")}
                prefix={"edge"}
                onChange={(e)=>{
                  console.log(e)
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
          <Grid item><Typography variant="body1"><b>Layout:</b></Typography></Grid>
          <Grid item>
            <Selector entries={Object.keys(layouts)}
              value={layout}
              prefix={"layout"}
              onChange={(e, v)=>setLayout(e.target.value)}
              />
          </Grid>
          <Grid item>
            <Typography variant="body1"><b>Edge labels:</b><Switch
                color="blues"
                checked={edgeStyle.label}
                onChange={()=>{
                  if (edgeStyle.label) setEdgeStyle({})
                  else setEdgeStyle({label: 'data(label)'})
                }}
                name="checkedA"
                inputProps={{ 'aria-label': 'secondary checkbox' }}
              /></Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1"><b>Size:</b></Typography>
          </Grid>
          <Grid item xs={2}>
            <Slider 
              value={limit}
              color="blues"
              onChange={(e, nv)=>{
                router.push({
                  pathname: schema.endpoint || '',
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
          <Grid item>
            <Button color="blues" onClick={()=>{
              fileDownload(cyref.current.png({output: "blob"}), "network.png")
            }}>
              <CameraAltOutlinedIcon/>
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} style={{minHeight: 500}}>
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
        {(focused || node) && <TooltipCard node={focused || node} schema={schema} tooltip_templates={tooltip_templates} setFocused={setFocused} router={router}/>}
      </Grid>
      <Grid item xs={12}>
        <div ref={tableref}>
          <NetworkTable data={data} schema={schema}/>
        </div>
      </Grid>
    </Grid>
  )
}


export async function getStaticProps(ctx) {
  const examples = {}
	const entries = {}
  const palettes = {}
  const nodes = []
  let edges = []
  let schema = default_schema
  let s = null
  if (process.env.NEXT_PUBLIC_SCHEMA) {
    schema = await fetch_kg_schema()
    s = schema
  }
	for (const i of schema.nodes) {
		const {node, example, palette, search} = i
		const results = await get_terms(node, search)
    entries[node] = results
		examples[node] = {...example, palette}
    nodes.push(node)
    const {name, main, light, dark, contrastText} = palette
    palettes[name] = {
      main,
      light: light || Color(main).lighten(0.25).hex(),
      dark: dark || Color(main).darken(0.25).hex(),
      contrastText: contrastText || "#000"
    }
	}
  for (const i of schema.edges) {
    edges = [...edges, ...(i.match || [])]
  }

  return {
	  props: {
        examples,
  	    entries,
        nodes,
        schema: s,
        palettes,
        edges,
    },
	};
}