'use client'
import { useEffect, useState } from "react"
import { useRouter, useSearchParams, } from "next/navigation"
import { 
	Typography, 
	Card, 
	CardContent, 
	CardActions, 
	Button, 
	IconButton,
	Tooltip,
	Popper,
 } from "@mui/material"
import { NetworkSchema } from "@/app/api/knowledge_graph/route"
import { makeTemplate } from "@/utils/helper"
import { precise } from "@/utils/math"
import HubIcon from '@mui/icons-material/Hub';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';

import Link from "next/link"
import { FilterSchema } from "@/utils/helper"
import { usePathname } from "next/navigation"
export const TooltipComponent = ({data, float, tooltip_templates, header_endpoint, filter_field}: {
	data: {
		id: string | number,
		label?: string,
		relation?: string,
		kind: string,
		[key: string]: string | number
	},
	tooltip_templates: {[key: string]: Array<{[key: string]: string}>}, 
	header_endpoint: string,
	float?: boolean,
	filter_field: 'q' | 'filter'
}) => {
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const queryParams = {}
	let filter:FilterSchema = {}
	searchParams.forEach((value, key) => {
		if (['filter', 'q', 'selected', 'hovered'].indexOf(key) === -1) queryParams[key] = value;
		else if (['filter', 'q'].indexOf(key) > -1) {
			filter = JSON.parse(value)
		}
	});
	const router = useRouter()
	const elements = []
	const field = data.kind === "Relation" ? data.label : data.kind.replace(/Queried TFs that are also enriched|Top Ranked TFs|Expanded TFs/g, "Transcription Factor")
	//const [selected, setSelected] = useQueryState('selected',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	//const [hovered, setHovered] = useQueryState('hovered',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	for (const i of tooltip_templates[field] || []) {
		if (i.type === "link") {
			const text = makeTemplate(i.text, data)
			const href = makeTemplate(i.href, data)
			if (text !== 'undefined') {
			  elements.push(
				<Typography key={i.label} variant="subtitle2" sx={{wordWrap: "break-word"}}>
				  <b>{i.label}:</b> <Button size='small' 
					color="secondary"
					  sx={{padding: 0, textDecoration: "underline"}} 
					  href={href}
									  target="_blank"
									  rel="noopener noreferrer"
				  >{text}</Button>
				</Typography>  
			  )
			}
		  } else {
			let e = makeTemplate(i.text, data)
			if (e !== 'undefined') {
			  elements.push(
				<Typography key={i.label} sx={{wordWrap: "break-word"}} variant="subtitle2">
				  <b>{i.label}:</b> {i.type === "text" ? e: precise(e)}
				</Typography>  
			  )
			}
		  }
	}
	const extrasx = {}
	if (float) {
		extrasx["position"] = "absolute"
		extrasx["top"] = 0
		extrasx["left"] = 0
		extrasx["zIndex"] = 100
	}
	return (
		<Card sx={{marginTop: 2, zIndex: 10000, ...extrasx}}>
			<CardContent sx={{padding: 2}}>
				{elements}
			</CardContent>
			<CardActions>
				{!filter.end_term && <Tooltip title="Delete Node">
				<Link href={`${pathname}?${filter_field}=${JSON.stringify({
					...filter,
					remove: [...(filter["remove"] || []), data.id]
				})}${Object.keys(queryParams).length ? "&" + Object.entries(queryParams).map(([k,v])=>`${k}=${v}`).join("&"): ""}`}>
					<IconButton>
						<DeleteIcon/>
					</IconButton> 
				</Link>
              </Tooltip>}
			  <Tooltip title="Expand Node">
				<Link href={`${pathname}?${filter_field}=${JSON.stringify({
					...filter,
					expand: [...(filter["expand"] || []), data.id]
				})}${Object.keys(queryParams).length ? "&" + Object.entries(queryParams).map(([k,v])=>`${k}=${v}`).join("&"): ""}`}>
					<IconButton>
						<HubIcon/>
					</IconButton> 
				</Link>
              </Tooltip>
			  <Tooltip title="Open node in new page">
				<Link href={`${header_endpoint}?filter=${JSON.stringify({
                        start: data.kind.replace(/Queried TFs that are also enriched|Top Ranked TFs|Search TFs/g, "Transcription Factor"),
                        start_term: data.label
                      })}`}>
					<IconButton>
						<SendIcon sx={{transform: "scaleX(-1)"}}/>
					</IconButton>
				</Link>
              </Tooltip>
			</CardActions>
		</Card>
	)
}

const TooltipComponentGroup = ({
	elements,
	tooltip_templates_nodes,
    tooltip_templates_edges,
	header_endpoint,
	float,
	filter_field,
	anchorEl,
	kind,
	id
}: {
		elements: null | NetworkSchema,
		tooltip_templates_edges: {[key: string]: Array<{[key: string]: string}>},
        tooltip_templates_nodes: {[key: string]: Array<{[key: string]: string}>},
		header_endpoint: string,
		float?: boolean,
		filter_field: 'q' | 'filter',
		anchorEl?: HTMLElement,
		kind?: 'nodes' | 'edges', 
		id?: string | number
	}) => {
	
	const [elementMapper, setElementMapper] = useState({nodes: {}, edges: {}})


	useEffect(()=>{
        if (elements) {
			const nodes = elements.nodes.reduce((acc, i)=>({
				...acc,
				[i.data.id]: i.data
			}), {})

			const edges = elements.edges.reduce((acc, i)=>({
				...acc,
				[`${i.data.source}_${i.data.relation}_${i.data.target}`]: i.data
			}), {})
			setElementMapper({nodes, edges})
		}
    }, [elements])
	if (anchorEl && id !== undefined && elementMapper[kind][id] !== undefined) {
		return (
			<Popper sx={{zIndex: 100}} open={anchorEl!==undefined} anchorEl={anchorEl}>
				<TooltipComponent 
						data={elementMapper[kind][id]} 
						tooltip_templates={kind === 'nodes' ? tooltip_templates_nodes: tooltip_templates_edges}
						// header_endpoint={(schema.header.tabs.filter(i=>i.component === 'KnowledgeGraph')[0] || {}).endpoint || '/'}
						header_endpoint={header_endpoint}
						float={float}
						filter_field={filter_field}
					/>
			</Popper>
		)
	}
	else return null
	
}

export default TooltipComponentGroup