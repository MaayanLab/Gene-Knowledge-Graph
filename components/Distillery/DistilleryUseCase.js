import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { withRouter
 } from "next/router";

import { layouts } from "../kg";
import { usePrevious } from "../Enrichment";

const Grid = dynamic(() => import('@mui/material/Grid'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Container = dynamic(() => import('@mui/material/Container'));

const Typography = dynamic(() => import('@mui/material/Typography'));
const Cytoscape = dynamic(() => import('../Cytoscape'), { ssr: false })
const TooltipCard = dynamic(async () => (await import('../misc')).TooltipCard);
const Legend = dynamic(async () => (await import('../misc')).Legend);
const NetworkTable =  dynamic(() => import('../network_table'))

const AsyncForm = dynamic(()=> import("./AsyncForm"));

function DistilleryUseCase({
        schema,
        router, 
        tooltip_templates_node,
        tooltip_templates_edges,
        relations=[],
        title,
        description,
        endpoint,
        type,
        ...props
    }){
    const [selected, setSelected] = useState(null)
    const [term, setTerm] = useState(router.query.term)
    const [loading, setLoading] = useState(false)
    const [controller, setController] = useState(null)
    const [elements, setElements] = useState(null)
    const [id, setId] = useState(0)
    const [node, setNode] = React.useState(null)
    const [edge, setEdge] = React.useState(null)
    const [focused, setFocused] = React.useState(null)
    const field = router.query.field || "label"
    const cyref = useRef(null);
    const tableref = useRef(null);
    const edgeStyle = router.query.edge_labels ? {label: 'data(label)'} : {}
    const prev_limit = usePrevious(router.query.limit)
    let fields = props.fields
    if (!fields) {
        const current_node = schema.nodes.filter(i=>i.node == type)
        if (current_node.length == 0) console.error("Invalid node")
        else {
            fields = current_node[0].search
        }
    }
    
    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
      }

      const search_term = async (term) => {
        try {
            setLoading(true)
            setElements(null)
            const controller = get_controller()
            const relation = relations.map(name=>({name, limit: router.query.limit || 5}))
            const body = {
                start: type,
                start_term: term,
                start_field: field,
              }
              if (relation.length) body.relation = relation
            const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}${endpoint}?filter=${JSON.stringify(body)}`,
                {
                method: 'GET',
                signal: controller.signal,
                }
            ) 
            const results = await res.json()
            setElements(results)
            setLoading(false)
            setId(id+1)
            // if (Object.keys(options).length === 0) await resolve_options()
            
        } catch (error) {
            console.error(error)
            setLoading(false)
        } 
    }

    useEffect(()=>{
        if (router.query.term) {
            if (!selected || selected[field] !== router.query.term || prev_limit !== router.query.limit) {
                search_term(router.query.term)
            }
        }
        else if (props.default_term && !router.query.term) {
            router.push({
                pathname: `/${router.query.page}/${router.query.group_page}`,
                query: {
                    term: props.default_term
                }
            }, undefined, {shallow: true})
        }
        // else setElements(null)
    }, [router.query.term, router.query.limit])

    // useEffect(()=>{
    //     search_term(router.query.term)
    // }, [router.query.limit])
    return (
        <Grid container alignItems={"center"} sx={{marginTop: -6}}>
            <Grid item xs={12} align="center" sx={{marginBottom: 5, marginTop: 5}}>
                <Container maxWidth="md">
                    <Typography variant="h5">
                        <b>{title}</b>
                    </Typography>
                    <Typography>
                        {description}
                    </Typography>
                </Container>
            </Grid>
            <Grid item xs={12}>
                <AsyncForm setSelected={setSelected} selected={selected} type={type} fields={fields} {...props}/>
            </Grid>
            {loading && <Grid item xs={12}><CircularProgress/></Grid>}
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
                                    'text-wrap': 'ellipsis',
                                    'text-max-width': '200px'
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

export default withRouter(DistilleryUseCase)