'use client'
import { useRef, useState, useEffect } from 'react';
import { useSWRConfig } from 'swr'
// import dynamic from 'next/dynamic';
import { NetworkSchema } from '@/app/api/knowledge_graph/route';
import CytoscapeComponent from 'react-cytoscapejs';
import { TooltipCard } from '../misc/client_side';
import { Legend } from '../misc';
import { UISchema } from '@/app/api/schema/route';
import { useQueryState, parseAsString, parseAsJson } from 'next-usequerystate';
import HubIcon from '@mui/icons-material/Hub';
import { mdiFamilyTree,  mdiDotsCircle} from '@mdi/js';
import Icon from '@mdi/react';
import fileDownload from 'js-file-download';
export const layouts = {
    "Force-directed": {
      name: 'cola',
      quality: 'proof',
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
      name: 'circle',
      nodeSeparation: 150,
      icon: ()=><Icon path={mdiDotsCircle} size={0.8} />
    },
  }


  export type ArrowShape =
  | "tee"
  | "vee"
  | "triangle"
  | "triangle-tee"
  | "circle-triangle"
  | "triangle-cross"
  | "triangle-backcurve"
  | "square"
  | "circle"
  | "diamond"
  | "chevron"
  | "none";

export default function Cytoscape ({
	elements,
	schema,
	tooltip_templates_edges,
	tooltip_templates_nodes,
	search,
}: {
	elements: null | NetworkSchema, 
	search?:boolean,
	schema: UISchema,
	tooltip_templates_edges: {[key: string]: Array<{[key: string]: string}>}, 
	tooltip_templates_nodes: {[key: string]: Array<{[key: string]: string}>}, 
}) {
	const cyref = useRef(null);
	const networkRef = useRef(null);
	const [id, setId] = useState<number>(0)
	
	const [edge_labels, setEdgeLabels] = useQueryState('edge_labels')
	const [tooltip, setTooltip] = useQueryState('tooltip')
	const [layout, setLayout] = useQueryState('layout', parseAsString.withDefault('Force-directed'))
	const [legend, setLegend] = useQueryState('legend')
	const [legend_size, setLegendSize] = useQueryState('legend_size')
	const [download_image, setDownloadImage] = useQueryState('download_image')
	const [selected, setSelected] = useQueryState('selected',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	const [hovered, setHovered] = useQueryState('hovered',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	const edgeStyle = edge_labels ? {label: 'data(label)'} : {}

	const { mutate } = useSWRConfig()
	useEffect(()=>{
		const cytoscape = require('cytoscape')
		const svg = require('cytoscape-svg')
		cytoscape.use(svg)
	},[])

	useEffect(()=>{
		if (download_image === 'svg') {
			fileDownload(cyref.current.svg({output: "blob"}), "network.svg")
		} else if (download_image === 'png') {
			fileDownload(cyref.current.png({output: "blob"}), "network.png")
		} else if (download_image === 'jpg') {
			fileDownload(cyref.current.jpg({output: "blob"}), "network.jpg")
		}
		setDownloadImage(null)
	}, [download_image])

	useEffect(()=>{
		const update_counter = async () => {
			await fetch(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/counter/update`)
			mutate('/api/counter')
		}
		if (elements && elements.nodes.length > 0) update_counter()
		setId(id+1)
	}, [elements])


	useEffect(()=>{
		setId(id+1)
	},[layout, elements])
	// if (!ready) return <CircularProgress/>
	return (
		<div id="kg-network" style={{minHeight: 500, position: "relative"}} ref={networkRef}>
			{(elements === null) ? (
				// <Backdrop
				//     sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
				//     open={elements === null}
				// >
				//     <CircularProgress/>
				// </Backdrop> 
				null
			) : elements.nodes.length === 0 ? (
				<div>No results</div>
			) : 
				<CytoscapeComponent
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
								"text-margin-x": 0,
								"text-margin-y": 0,
								'font-size': '12px',
								'target-arrow-shape': `data(directed)` as ArrowShape,
								'target-endpoint': 'outside-to-node',
								'source-endpoint': 'outside-to-node',
								'target-arrow-color': 'data(lineColor)',
								'line-style': ( ele )=>{
									return(ele.data('hidden') ? "dotted": "solid")
								},
								...edgeStyle
							}
						}
					]}
					elements={[...elements.nodes, ...elements.edges]}
					layout={layouts[layout]}
					cy={(cy:cytoscape.Core):void => {
						cyref.current = cy
						cy.on('click', 'node', function (evt) {
						// setAnchorEl(null)
						const node = evt.target.data()

						if (selected && node.id === selected.id) {
							const sel = evt.target;
							cy.elements().removeClass('focusedSemitransp');
							sel.removeClass('focused').outgoers().removeClass('focusedColored')
							sel.incomers().removeClass('focusedColored')
							setSelected(null)
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
							setSelected({id: node.id, type: 'nodes'})
							setTimeout(()=>{
								const sel = evt.target;
								cy.elements().removeClass('focusedSemitransp');
								sel.removeClass('focused').outgoers().removeClass('focusedColored')
								sel.incomers().removeClass('focusedColored')
								setSelected(null)
							}, 5000)
						}
						})

						
					}}
				/> 
			}
			{ (elements && legend) &&
				<Legend search={search} elements={elements} legendSize={parseInt(legend_size || "0")}/>
			}
		</div>
	)
}