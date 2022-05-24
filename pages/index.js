import React, { useRef } from 'react';
import dynamic from 'next/dynamic'
import Link from 'next/link'
import useAsyncEffect from 'use-async-effect'
import { useRouter } from 'next/router'
import { precise, makeTemplate } from '../utils/helper';
import fileDownload from 'js-file-download'
import fetch from 'isomorphic-unfetch'
import get_terms, { fetch_schema } from '../utils/initialize';

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
const Slider = dynamic(() => import('@mui/material/Slider'));
const Cytoscape = dynamic(() => import('../components/Cytoscape'), { ssr: false })
const CameraAltOutlinedIcon  = dynamic(() => import('@mui/icons-material/CameraAltOutlined'));
const NetworkTable =  dynamic(() => import('../components/network_table'))

const route_mapper = {
  Gene: "genes",
}

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
        pathname:`/`,
        query: {
			start: "Gene",
			start_term: "CAND2",
		  }
      },
	  color: "greens"

  } 
}

const TooltipCard = ({node, schema}) => {
  const elements = []
  for (const i of schema.tooltip[node.kind]) {
    const e = makeTemplate(i.text, node.properties)
    if (e !== 'undefined') {
      elements.push(
        <Typography key={i.label} variant="subtitle2">
          <b>{i.label}</b> {precise(e)}
        </Typography>  
      )
    }
  }
  return(
    <Card>
      <CardContent>
        <Typography variant="h6">
          <b>{node.label}</b>
        </Typography>
        {elements}
      </CardContent>
    </Card>
  )
}

export default function KnowledgeGraph({entries, examples=default_examples, schema}) {
  const router = useRouter()
  const {start="Gene", start_term, end_term, end="Gene", limit=25, order=(Object.keys(schema.order || {}))[0]} = router.query
  const [allStartTerms, setAllStartTerms] = React.useState([])
  const [startTermInput, setStartTermInput] = React.useState(start_term || '')
  const [allEndTerms, setAllEndTerms] = React.useState([])
  const [endTermInput, setEndTermInput] = React.useState(end_term || '')
  const [node, setNode] = React.useState(null)
  const [data, setData] = React.useState(null)
  const tableref = useRef(null);
  const redirect = (query) => {
    router.push({
      pathname: `/`,
      query
    }, undefined, {shallow: true})
  }

  React.useEffect(() => {
    setStartTermInput(start_term || '')
  }, [start_term])

  React.useEffect(() => {
    setEndTermInput(end_term || '')
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
      <Grid item xs={3}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid container justifyContent="flex-start" alignItems="center" spacing={1}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Start with</Typography>
                {Object.keys(entries).length > 1 && <ToggleButtonGroup
                  value={start}
                  exclusive
                  onChange={(e, new_start)=>redirect({start: new_start})}
                  aria-label="start node"
                >
                  {Object.keys(entries).map(k=>(
                    <ToggleButton value={k} aria-label="left aligned" key={`start-${k}`}>
                      <Typography variant="caption" style={{textTransform: "none"}}>{k.replace("BirthDefects", "Birth Defects")}</Typography>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>}
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <Autocomplete
                    id="my-input" aria-describedby="gene" 
                    freeSolo
                    options={Object.keys(allStartTerms)}
                    value={startTermInput}
                    onChange={(evt, value) => {
                      if (value === null) value = ''
                      setStartTermInput(value)
                      const query = {
                        start,
                        start_term: value,
                        limit
                      }
                      if (end) {
                        query.end = end
                      }
                      router.push({
                        pathname: `/`,
                        query
                      }, undefined, { shallow: true })
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
                <Typography variant="subtitle2">End with</Typography>
                {Object.keys(entries).length > 1 && <ToggleButtonGroup
                  value={end}
                  exclusive
                  onChange={(e, new_end)=>redirect({start, start_term, end: new_end, limit})}
                  aria-label="end node"
                >
                  {Object.keys(entries).map(k=>(
                    <ToggleButton value={k} aria-label="left aligned" key={`end-${k}`}>
                      <Typography variant="caption" style={{textTransform: "none"}}>{k.replace("BirthDefects", "Birth Defects")}</Typography>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>}
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <Autocomplete
                    id="my-input" aria-describedby="gene"
                    freeSolo 
                    options={Object.keys(allEndTerms)}
                    placeholder="Optional"
                    value={endTermInput}
                    onChange={(evt, value) => {
                      if (value === null) value = ''
                      setEndTermInput(value)
                      router.push({
                        pathname: `/`,
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
                      <Button variant="outlined" color={palette}><Typography variant="caption">{href.query.start_term}</Typography></Button>
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
          <Grid item xs={12} style={{minHeight: 300}}>
            {node && <TooltipCard node={node} schema={schema}/>}
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={9}>
        {(start && route_mapper[start]) && 
          <KnowledgeGraphViz 
            start_term={start_term}
            start={start}
            end_term={end_term}
            end={end}
            setNode={setNode}
            node={node}
            limit={limit}
            setData={setData}
			      examples={examples}
            schema={schema}
            order={order}
          />
        }
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
  const {start_term, start, end_term, end, limit, setNode, node, setData, examples, schema, order} = props
  const router = useRouter()
  const [id, setId] = React.useState(0)
  const [elements, setElements] = React.useState(undefined)
  const [edgeStyle, setEdgeStyle] = React.useState({label: 'data(label)'})
  const [controller, setController] = React.useState(null)
  const [layout, setLayout] = React.useState(Object.keys(layouts)[0])
  const cyref = useRef(null);
  
  const get_controller = () => {
    if (controller) controller.abort()
    const c = new AbortController()
    setController(c)
    return c
  }
  
  const resolve_elements = async (isActive) => {
    try {
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
          pathname: `/`,
          query: {
            start,
            start_term: examples[start].href.query.start_term
          }
        }, undefined, {shallow: true})
      }
    } else {
      await  resolve_elements(isActive)
    }
  }, [start_term])

  useAsyncEffect(async (isActive) => {
    if (start_term && end_term) {
      await  resolve_elements(isActive)
    }
  }, [end_term])

  useAsyncEffect(async (isActive) => {
    if (start_term) {
      await  resolve_elements(isActive)
    }
  }, [limit])
  return (
    <Box>
      {elements === undefined ? (
        <div>Loading...</div>
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
                    pathname: `/`,
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
                  pathname: `/`,
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
                    'curve-style': 'haystack',
                    // 'opacity': '0.5',
                    'line-color': 'data(lineColor)',
                    'width': '4',
                    // 'label': 'data(label)',
                    "text-rotation": "autorotate",
                    "text-margin-x": "0px",
                    "text-margin-y": "0px",
                    'font-size': '12px',
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
                  selector: 'node.semitransp',
                  style:{ 'opacity': '0.5' }
                },
                {
                  selector: 'edge.colored',
                  style: {
                      'line-color': '#F8333C',
                      'width': '6'
                  }
                },
                {
                  selector: 'edge.semitransp',
                  style:{ 'opacity': '0.5' }
                },
              ]}
              elements={elements}
              layout={layouts[layout]}
              cy={(cy) => {
                cyref.current = cy
                cy.on('click', 'node', function (evt) {
                // setAnchorEl(null)
                setNode(null)
                const node = evt.target.data()
                if (node.kind === 'Gene' || node.kind === 'Drug' || node.kind === 'BirthDefect') {
                  router.push({
                    pathname: `/`,
                    query: {
                      start: node.kind,
                      start_term: node.label
                    }
                  }, undefined, { shallow: true })
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
                  setNode(n)
                }
              });

              cy.nodes().on('mouseout', (evt) => {
                const sel = evt.target;
                cy.elements().removeClass('semitransp');
                sel.removeClass('highlight').outgoers().removeClass('colored')
                sel.incomers().removeClass('colored')
                // setAnchorEl(null)
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
                  setNode(n)
                }
              });
              cy.edges().on('mouseout', (evt) => {
                const sel = evt.target;
                cy.elements().removeClass('semitransp');
                sel.removeClass('colored').connectedNodes().removeClass('highlight')
                // setAnchorEl(null)
                setNode(null)
              });
            }}
            />
          </Grid>        
        </Grid>
      )}
    </Box>
  )
}

export async function getStaticProps(ctx) {
	const schema = await fetch_schema()
	const examples = {}
	const entries = {}
	for (const i of schema.nodes) {
		const {node, example} = i
		const results = await get_terms(node)
		entries[node] = results
		examples[node] = example
	}
	return {
	  props: {
		  examples,
		  entries,
      schema,
	  }
	};
}