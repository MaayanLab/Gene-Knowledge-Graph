import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic'

import { useRouter } from 'next/router'
import { process_tables } from '../../utils/helper';
import { usePrevious } from '../Enrichment';
import HubIcon from '@mui/icons-material/Hub';
import { mdiFamilyTree, mdiDotsCircle } from '@mdi/js';
import Icon from '@mdi/react';
import { process_filter } from './form';

const Grid = dynamic(() => import('@mui/material/Grid'));

const Button = dynamic(() => import('@mui/material/Button'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Backdrop = dynamic(() => import('@mui/material/Backdrop'));
const TooltipCard = dynamic(async () => (await import('../misc')).TooltipCard);
const Legend = dynamic(async () => (await import('../misc')).Legend);

const StartButton  = dynamic(async () => (await (import('./buttons'))).StartButton);
const EndButton  = dynamic(async () => (await (import('./buttons'))).EndButton);
const IndeterminateCheckBoxIcon = dynamic(() => import('@mui/icons-material/IndeterminateCheckBox'));

const Form = dynamic(() => import('./async_form'));
const AsyncFormComponent = dynamic(() => import('./async_form_component'));

const Cytoscape = dynamic(() => import('../Cytoscape'), { ssr: false })
const NetworkTable =  dynamic(() => import('../network_table'))

export const redirect = ({router, page, ...query}) => {
    router.push({
        pathname: `/${page || ''}`,
        query: process_filter(query)
    }, undefined, {shallow: true})
}

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
  


export default function TermAndGeneSearch(props){
    const {entries, edges=[], default_relations, nodes, schema, initial_query={}, tooltip_viz, coexpression_prediction, gene_link_button} = props
    const router = useRouter()
    const page = router.query.page
    const [elements, setElements] = useState(null)
    const [controller, setController] = React.useState(null)
    const [error, setError] = useState(null)
    const [selectedEdges, setSelectedEdges] = useState(null)
    const [loading, setLoading] = useState(false)
    const [id, setId] = React.useState(0)
    const [node, setNode] = React.useState(null)
    const [edge, setEdge] = React.useState(null)
    const [focused, setFocused] = React.useState(null)
    const [startSelected, setStartSelected] = useState(null)
    const [endSelected, setEndSelected] = useState(null)
    const {
        filter:f,
        edge_labels,
        view = "network",
        tooltip,
        layout="Force-directed",
        legend,
        legend_size=0,
    } = router.query

    const filter = JSON.parse(f || '{}')
    const {
        start,
        start_field='label',
        start_term,
        end,
        end_field='label',
        end_term,
        relation=[],
        limit,
        gene_links,
        augment,
    } = filter
    const prevFilter = usePrevious(filter)
    const cyref = useRef(null);
    const tableref = useRef(null);
    const edgeStyle = edge_labels ? {label: 'data(label)'} : {}

    const networkref = useRef(null);
    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
      }
    
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


    // useEffect(()=>{
    //     const resolve_elements = async(filter) => {
    //         try {
    //             const controller = get_controller()
    //             if (!filter.start_field) filter.start_field = "label"
    //             if (filter.end && !filter.end_field) filter.end_field = "label"
    //             if (filter.relation) {
    //                 if (!filter.end) {
    //                     filter.relation = filter.relation.map(name=>({name, limit: filter.limit || 5}))
    //                     delete filter.limit
    //                 } else {
    //                     filter.relation = filter.relation.map(name=>({name}))
    //                     delete filter.augment
    //                     delete filter.augment_limit
    //                 }
    //             }
    //             const res = await fetch(`${window.location.origin}/api/knowledge_graph?filter=${JSON.stringify(filter)}`,
    //             {
    //                 method: 'GET',
    //                 signal: controller.signal,
    //                 "Content-Type": "application/json"
    //             }) 
    //             if (!res.ok) setError(await res.text())
    //             else {
    //                 const results = await res.json()
    //                 const selected_edges = []
    //                 for (const i of results.edges) {
    //                     if (i.data.relation && selected_edges.indexOf(i.data.label) === -1) {
    //                         selected_edges.push(i.data.label)
    //                     }
    //                 }
    //                 setElements(results)
    //                 setLoading(false)
    //                 setId(id+1)
    //                 if (!filter.relation || filter.relation.length === 0) {
    //                     setSelectedEdges(selected_edges)
    //                     const {page, filter: f, ...rest} = router.query
    //                     const filter = JSON.parse(f || '{}')
    //                     filter.relation = selected_edges
    //                     // if (selected_edges.length === 1) {
    //                     //     filter.limit = results.edges.length
    //                     // }
    //                     redirect({router, page, filter, ...rest})
    //                 }
    //             }
    //         } catch (error) {
    //             console.error(error)
    //         }
    //     }
    //     if(!router.isReady) return;
    //     const filter = JSON.parse(f || '{}')
    //     if (selectedEdges !== null) {
    //         setSelectedEdges(null)
    //     } 
    //     if (Object.keys(f).length > 0 && f.start && f.start_term) {
    //         setLoading(true)
    //         resolve_elements(f)
    //     } else if (initial_query.start) {
    //         redirect({
    //             router, 
    //             page,
    //             filter: initial_query
    //         })
    //     } else {
    //         const start = nodes['Gene'] !== undefined ? 'Gene': Object.keys(nodes).sort()[0]
    //         redirect({
    //             router, 
    //             page,
    //             filter: {
    //                 start,
    //                 start_field: 'label'
    //             }
    //         })
    //     }
    // }, [filter])

    const resolve_elements = async(filter) => {
                try {
                    const controller = get_controller()
                    if (!filter.start_field) filter.start_field = "label"
                    if (filter.end && !filter.end_field) filter.end_field = "label"
                    if (filter.relation) {
                        if (!filter.end) {
                            filter.relation = filter.relation.map(name=>({name, limit: filter.limit || 5}))
                            delete filter.limit
                        } else {
                            filter.relation = filter.relation.map(name=>({name}))
                            delete filter.augment
                            delete filter.augment_limit
                        }
                    }
                    const res = await fetch(`${window.location.origin}/api/knowledge_graph?filter=${JSON.stringify(filter)}`,
                    {
                        method: 'GET',
                        signal: controller.signal,
                        "Content-Type": "application/json"
                    }) 
                    if (!res.ok) setError(await res.text())
                    else {
                        const results = await res.json()
                        const selected_edges = []
                        for (const i of results.edges) {
                            if (i.data.relation && selected_edges.indexOf(i.data.label) === -1) {
                                selected_edges.push(i.data.label)
                            }
                        }
                        setElements(results)
                        setLoading(false)
                        setId(id+1)
                        if (!filter.relation || filter.relation.length === 0) {
                            setSelectedEdges(selected_edges)
                            const {page, filter: f, ...rest} = router.query
                            const filter = JSON.parse(f || '{}')
                            filter.relation = selected_edges
                            redirect({router, page, filter, ...rest})
                        }
                    }
                } catch (error) {
                    console.error(error)
                }
            }

    useEffect(()=>{
        if(!router.isReady) return;
        if (selectedEdges !== null) {
            setSelectedEdges(null)
        }
        // default
        if (!filter.start) {
            console.log("Here")
            const page = router.query.page
            if (Object.keys(initial_query).length > 0) {
                redirect({
                    router, 
                    page,
                    filter: initial_query
                })
            } else {
                redirect({
                    router, 
                    page,
                    filter: {
                        start: nodes.Gene !== undefined ? 'Gene': Object.keys(nodes)[0],
                        start_field: 'label'
                    }
                })
            }          
        } else if (Object.keys(filter).length > 0 && filter.start && filter.start_term) {
            let resolve = true
            if ((prevFilter || {}).start_field !== start_field &&
                startSelected !== null && 
                startSelected[start_field] === start_term
            ) {
                if ((prevFilter || {}).end !== end) resolve = true
                else resolve = false
            } else if ((prevFilter || {}).end_field !== end_field &&
                endSelected !== null && 
                endSelected[end_field] === end_term
            ) {
                resolve = false
            }
            
            if (resolve) {
                setLoading(true)
                resolve_elements(filter)
            }
        }
    }, [router.query.filter])

    const genes = ((elements || {}).nodes || []).reduce((acc, i)=>{
        if (i.data.kind === "Gene" && acc.indexOf(i.data.label) === -1) return [...acc, i.data.label]
        else return acc
    }, [])

    
    return (
        <Grid container spacing={1}>
            <Grid item xs={12}>
                <Grid container justifyContent="space-around" spacing={1}>
                    <Grid item xs={12}>
                        <AsyncFormComponent 
                            nodes={nodes}
                            direction={'Start'}
                            button_component={()=>(!end && <StartButton nodes={nodes}/>)}
                            selected={startSelected}
                            setSelected={setStartSelected}
                        />
                    </Grid>
                    {end && <Grid item xs={12}>
                        <AsyncFormComponent 
                            nodes={nodes}
                            direction={'End'}
                            button_component={()=><EndButton/>}
                            selected={endSelected}
                            setSelected={setEndSelected}
                        />
                    </Grid>}
                    <Grid item xs={12}>
                        <Form 
                            {...props} 
                            layouts={layouts}
                            genes={genes}
                            process_tables={()=>process_tables(elements)}
                            elements={elements}
                        />
                    </Grid>
                </Grid>
            </Grid>
            {view === "network" && 
                <Grid item xs={12} id="kg-network" style={{minHeight: 500, position: "relative"}} ref={networkref}>
                    {(elements === null) ? (
                        // <Backdrop
                        //     sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        //     open={elements === null}
                        // >
                        //     <CircularProgress/>
                        // </Backdrop> 
                        null
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
                            elements={[...elements.nodes, ...elements.edges]}
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
                    { (elements && legend) &&
                        <Legend elements={elements} legendSize={legend_size}/>
                    }
                    { (focused === null && tooltip && node) && <TooltipCard 
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
                    {(focused === null && tooltip && edge) && <TooltipCard 
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
            {view === 'table' && 
                <Grid item xs={12} sx={{minHeight: 700}}>
                    <div ref={tableref}>
                        <NetworkTable data={elements} schema={schema}/>
                    </div>
                </Grid>
                }
        </Grid>
    )
} 