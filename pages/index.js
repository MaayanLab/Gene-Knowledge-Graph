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
const FormHelperText = dynamic(() => import('@mui/material/FormHelperText'));
const Button = dynamic(() => import('@mui/material/Button'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const ToggleButton = dynamic(() => import('@mui/material/ToggleButton'));
const ToggleButtonGroup = dynamic(() => import('@mui/material/ToggleButtonGroup'));
const Switch = dynamic(() => import('@mui/material/Switch'));
const Card = dynamic(() => import('@mui/material/Card'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Slider = dynamic(() => import('@mui/material/Slider'));
const Cytoscape = dynamic(() => import('../components/Cytoscape'), { ssr: false })
const CameraAltOutlinedIcon  = dynamic(() => import('@mui/icons-material/CameraAltOutlined'));
const NetworkTable =  dynamic(() => import('../components/network_table'))

const layouts = {
  "Force-directed": {
    name: 'fcose',
    animate: true,
    nodeRepulsion: node => 10000,
    // Ideal edge (non nested) length
    idealEdgeLength: edge => 150
  },
  Geometric: {
    name: 'avsdf',
    nodeSeparation: 150
  },
  "Hierarchical Layout": {
    name: "breadthfirst",
    animate: true,
    spacingFactor: 1,
    padding: 15
  }
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

const TooltipCard = ({node, tooltip_templates, setFocused, router}) => {
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
              pathname: schema.endpoint,
              query: {
                start: node.kind,
                start_term: node.label
              }
            }, undefined, { shallow: true })
          }}
        >Expand</Button>}
      </CardContent>
    </Card>
  )
}

const Selector = ({entries, value, onChange, prefix}) => {
  if (Object.keys(entries).length === 1) return null
  else if (Object.keys(entries).length < 4) {
    return (
      <ToggleButtonGroup
        value={value}
        exclusive
        /*  */
        onChange={(e,n)=>onChange(n)}
        aria-label={`${prefix}selector`}
      >
        {Object.keys(entries).map(k=>(
          <ToggleButton value={k} aria-label="left aligned" key={`${prefix}-${k}`}>
            <Typography variant="caption" style={{textTransform: "none"}}>{k}</Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    )
  } else {
    return (
      <FormControl>
        <Select
          labelId={`${prefix}layouts-select`}
          id={`${prefix}-label`}
          value={value}
          label={`${prefix} with`}
          onChange={(e,v)=>onChange(e.target.value)}
          variant="standard"
          disableUnderline={true}
          style={{width: 215, padding: 0}}
        >
          {Object.keys(entries).map(val=>(
            <MenuItem key={val} value={val}>{val}</MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

}

export default function KnowledgeGraph({entries, nodes, examples=default_examples, schema}) {
  if (!schema) schema=default_schema  
  const router = useRouter()
  const {start_term, end_term, limit=25, order=(Object.keys(schema.order || {}))[0]} = router.query
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
      pathname: schema.endpoint,
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
  return (
    <Grid container justifyContent="space-around">
      <Grid item md={3} xs={12} style={{minHeight: 600}}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid container justifyContent="flex-start" alignItems="center" spacing={1}>
              <Grid item xs={12}>
                <Typography variant="body1">Start with</Typography>
                <Selector entries={entries} value={start} prefix={"Start"} onChange={(e)=>redirect({start: e})}/>
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <Autocomplete
                    id="my-input" aria-describedby="gene" 
                    freeSolo
                    options={Object.keys(entries[start] || {})}
                    value={startTermInput}
                    onChange={(evt, value) => {
                      if (value === null) value = ''
                      setStartTermInput(value)
                      if (value !== '') {
                        const query = {
                          start,
                          start_term: value,
                          limit
                        }
                        if (end) {
                          query.end = end
                        }
                        router.push({
                          pathname:  schema.endpoint,
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
                  <FormHelperText id="gene">Search Term</FormHelperText>
                </FormControl> 
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">End with</Typography>
                <Selector entries={entries} value={end} prefix={"End"} onChange={(e)=>{
                  redirect({start, start_term, end: e, limit})
                }}/>
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <Autocomplete
                    id="my-input" aria-describedby="gene"
                    freeSolo 
                    options={Object.keys(allEndTerms || {})}
                    placeholder="Optional"
                    value={endTermInput}
                    onChange={(evt, value) => {
                      if (value === null) value = ''
                      setEndTermInput(value)
                      router.push({
                        pathname:  schema.endpoint,
                        query: {
                          start,
                          start_term,
                          end,
                          end_term: value,
                          limit
                        }
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
                  <FormHelperText id="gene">Search another term (optional)</FormHelperText>
                </FormControl> 
              </Grid>
              {Object.entries(examples).map(([k, v])=>{
                const {href, palette} = v
                return (
                  <Grid item xs={12} key={href.query.start_term}>
                    <Typography variant="caption" style={{marginRight: 10}}>{k} Example:</Typography>
                    <Link
                      href={href}
                      shallow
                    >
                      <Button variant="outlined" color={palette.name}><Typography variant="caption">{href.query.start_term}</Typography></Button>
                    </Link> 
                  </Grid>
                )
              })}
            </Grid>
          </Grid>
          {start_term &&
            <Grid item xs={12}>
              <Button variant='outlined' onClick={()=>{
                tableref.current.scrollIntoView();
              }}>Go to table</Button>
            </Grid>
          }
        </Grid>
      </Grid>
      <Grid item md={7} xs={12}>
        {(start && nodes.indexOf(start) > -1) && 
          <KnowledgeGraphViz 
            start_term={start_term}
            start={start}
            end_term={end_term}
            end={end}
            setNode={({node, type="node"})=> {
              if (focused === null && type === "node") {
                setNode(node)
              } else if (type === "focused") {
                setNode(null)
                setFocused(node)
              }
            }}
            node={node}
            limit={limit}
            setData={setData}
			      examples={examples}
            schema={schema}
            order={order}
            focused={focused}
          />
        }
      </Grid>
      <Grid item md={2} xs={12}>
        {(focused || node) && <TooltipCard node={focused || node} tooltip_templates={tooltip_templates} setFocused={setFocused} router={router}/>}
      </Grid>
      <Grid item xs={12}>
        <div ref={tableref}>
          <NetworkTable data={data}/>
        </div>
      </Grid>
    </Grid>
  )
}

function KnowledgeGraphViz(props) {
  const {start_term, start, end_term, end, limit, setNode, node, setData, examples, schema, focused} = props
  const router = useRouter()
  const [id, setId] = React.useState(0)
  const [elements, setElements] = React.useState(undefined)
  const [edgeStyle, setEdgeStyle] = React.useState({label: 'data(label)'})
  const [controller, setController] = React.useState(null)
  const [layout, setLayout] = React.useState(Object.keys(layouts)[0])
  const [loading, setLoading] = React.useState(false)

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
        limit
      }
      if (end && end_term) {
        body.end = end
        body.end_term = end_term
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
          pathname: schema.endpoint,
          query: {
            start,
            start_term: examples[start].href.query.start_term
          }
        }, undefined, {shallow: true})
      }
    } else {
      await  resolve_elements(isActive)
    }
  }, [start_term, end_term, limit])

  return (
    <Box>
      {(elements === undefined) ? (
        <CircularProgress/>
      ) : elements.length === 0 ? (
        <div>No results</div>
      ) : (
        <Grid container spacing={1} alignItems="center" justifyContent="flex-start">
          <Grid item><Typography variant="subtitle2"><b>Layout:</b></Typography></Grid>
          <Grid item>
            <FormControl>
              <Select
                labelId="layouts-select"
                id="layouts-label"
                value={layout}
                label="Select Layout"
                onChange={(e, v)=>setLayout(e.target.value)}
                variant="standard"
                disableUnderline={true}
              >
                {Object.keys(layouts).map(val=>(
                  <MenuItem key={val} value={val}>{val}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* {schema.order && <Grid item><Typography variant="subtitle2"><b>Order by:</b></Typography></Grid>}
          {schema.order && <Grid item>
            <FormControl>
              <Select
                labelId="layouts-select"
                id="layouts-label"
                value={order}
                label="Order by"
                onChange={(e, nv)=>{
                  router.push({
                    pathname:  schema.endpoint,
                    query: {
                      ...router.query,
                      order: e.target.value
                    }
                  }, undefined, { shallow: true })
                }}
                variant="standard"
                disableUnderline={true}
              >
                {Object.keys(schema.order).map(val=>(
                  <MenuItem key={val} value={val}>{val}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          } */}
          <Grid item>
            <Typography variant="subtitle2"><b>Edge labels:</b><Switch
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
            <Typography variant="subtitle2"><b>Size:</b></Typography>
          </Grid>
          <Grid item xs={2}>
            <Slider 
              value={limit}
              color="blues"
              onChange={(e, nv)=>{
                router.push({
                  pathname: schema.endpoint,
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
            <Typography variant="subtitle2">{limit}</Typography>
          </Grid>
          <Grid item>
            <Button color="blues" onClick={()=>{
              fileDownload(cyref.current.png({output: "blob"}), "network.png")
            }}>
              <CameraAltOutlinedIcon/>
            </Button>
          </Grid>
          <Grid item xs={12}>
            {loading ? <CircularProgress/>:
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
                    setNode({node: null, type: "focused"})
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
                    setNode({node, type: "focused"})
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
                    setNode({node: n})
                  }
                });

                cy.nodes().on('mouseout', (evt) => {
                  const sel = evt.target;
                  cy.elements().removeClass('semitransp');
                  sel.removeClass('highlight').outgoers().removeClass('colored')
                  sel.incomers().removeClass('colored')
                  // setAnchorEl(null)
                  setNode({node: null})
                
                });
                cy.edges().on('mouseover', (evt) => {
                  const n = evt.target.data()
                  const sel = evt.target;
                  cy.elements().not(sel).addClass('semitransp');
                  sel.addClass('colored').connectedNodes().addClass('highlight')
                  sel.connectedNodes().removeClass('semitransp')
                  if (n.id !== (node || {}).id) {
                    // setAnchorEl(evt.target.popperRef())
                    setNode({node: n})
                  }
                });
                cy.edges().on('mouseout', (evt) => {
                  const sel = evt.target;
                  cy.elements().removeClass('semitransp');
                  sel.removeClass('colored').connectedNodes().removeClass('highlight')
                  // setAnchorEl(null)
                  setNode({node: null})
                });
              }}
              />
            }
          </Grid>        
        </Grid>
      )}
    </Box>
  )
}

export async function getStaticProps(ctx) {
  const examples = {}
	const entries = {}
  const palettes = {}
  const nodes = []
  let schema = default_schema
  let s = null
  if (process.env.NEXT_PUBLIC_SCHEMA) {
    schema = await fetch_kg_schema()
    s = schema
  }
	for (const i of schema.nodes) {
		const {node, example, palette} = i
		const results = await get_terms(node)
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
	return {
	  props: {
      examples,
		  entries,
      nodes,
      schema: s,
      palettes
    },
    revalidate: 10,
	};
}