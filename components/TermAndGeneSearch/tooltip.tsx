'use client'
import { useEffect, useState } from "react"
import AsyncFormComponent from "./async_form"
import { router_push } from "@/utils/client_side"
import { useRouter, } from "next/navigation"
import { Stack, 
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
import { useQueryState, parseAsJson } from 'next-usequerystate';
import { makeTemplate } from "@/utils/helper"
import { precise } from "@/utils/math"
import HubIcon from '@mui/icons-material/Hub';
import { UISchema } from "@/app/api/schema/route"
import Link from "next/link"

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
	const router = useRouter()
	const elements = []
	const field = data.kind === "Relation" ? data.label : data.kind.replace("Co-expressed Gene", "lncRNA")
	for (const i of tooltip_templates[field] || []) {
		if (i.href) {
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
				  <b>{i.label}:</b> {precise(e)}
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
	const pathname = (schema.header.tabs.filter(i=>(i.component === 'KnowledgeGraph' || i.component === 'SimpleKnowledgeGraph'))[0] || {}).endpoint || '/'
	const filter = JSON.stringify({
		start: data.kind,
		start_term: data.label
		})
	return (
		<Card sx={{marginTop: 2, zIndex: 10000, ...extrasx}}>
			<CardContent sx={{padding: 2}}>
				{elements}
			</CardContent>
			{data.kind !== "Relation" &&
            <CardActions>
              {/* {!filter.end_term && <Tooltip title="Delete Node">
                <IconButton
                  onClick={()=>{
                    setSelected(null)
					setHovered(null)
                    const queryParams: {filter: string, [key:string]: string} = {filter: '{}'}
          searchParams.forEach((value, key) => {
						queryParams[key] = value;
					});
					const f = JSON.stringify({
                        ...filter,
                        remove: [...(filter.remove || []), data.id]
                      })
					router_push(router, pathname, {...queryParams, filter: f})
          }}><DeleteIcon/></IconButton>
              </Tooltip>} */}
              <Tooltip title="Expand Node">
				<Link href={`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/${pathname}?filter=${filter}`}>
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
          }
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