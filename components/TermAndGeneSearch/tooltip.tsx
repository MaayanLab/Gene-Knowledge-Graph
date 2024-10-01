'use client'
import { useEffect, useState } from "react"
import AsyncFormComponent from "./async_form"
import { router_push } from "@/utils/client_side"
import { usePathname, useRouter, useSearchParams, } from "next/navigation"
import { Stack, 
	Typography, 
	Card, 
	CardContent, 
	CardActions, 
	Button, 
	IconButton,
	Tooltip
 } from "@mui/material"
import { NetworkSchema } from "@/app/api/knowledge_graph/route"
import { useQueryState, parseAsJson } from 'next-usequerystate';
import { makeTemplate } from "@/utils/helper"
import { precise } from "@/utils/math"
import { FilterSchema } from "@/utils/helper"
import DeleteIcon from '@mui/icons-material/Delete';
import HubIcon from '@mui/icons-material/Hub';
import AllOutIcon from '@mui/icons-material/AllOut';
import { UISchema } from "@/app/api/schema/route"

export const TooltipComponent = ({data, tooltip_templates, schema}: {
	data: {
		id: string,
		label?: string,
		relation?: string,
		kind: string,
		[key: string]: string | number
	},
	tooltip_templates: {[key: string]: Array<{[key: string]: string}>}, 
	schema: UISchema
}) => {
	const [selected, setSelected] = useQueryState('selected',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	const [hovered, setHovered] = useQueryState('hovered',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	const router = useRouter()
	const elements = []
	const field = data.kind === "Relation" ? data.label : data.kind.replace("Co-expressed Gene", "Gene")
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
	return (
		<Card sx={{marginTop: 2}}>
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
                <IconButton
                  onClick={()=>{
                    // setSelected(null)
					// setHovered(null)
					const pathname = (schema.header.tabs.filter(i=>i.component === 'KnowledgeGraph')[0] || {}).endpoint || '/'
					const filter = JSON.stringify({
                        start: data.kind,
                        start_term: data.label
                      })
					router_push(router, pathname, {filter})
                  }}
                ><HubIcon sx={{transform: "scaleX(-1)"}}/></IconButton>
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
	schema,
}: {
		elements: null | NetworkSchema,
		tooltip_templates_edges: {[key: string]: Array<{[key: string]: string}>},
        tooltip_templates_nodes: {[key: string]: Array<{[key: string]: string}>},
		schema: UISchema
	}) => {
	

	const [selected, setSelected] = useQueryState('selected',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	const [hovered, setHovered] = useQueryState('hovered',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
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
	const user_input = selected || hovered
	if (user_input !== null && elementMapper[user_input.type][user_input.id] !== undefined) {
		return (
			<TooltipComponent 
					data={elementMapper[user_input.type][user_input.id]} 
					tooltip_templates={user_input.type === 'nodes' ? tooltip_templates_nodes: tooltip_templates_edges}
					schema={schema}
				/>
		)
	}
	else return null
	
}

export default TooltipComponentGroup