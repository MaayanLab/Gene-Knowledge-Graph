'use client'
import React, {useState, useEffect} from "react";
import { useRouter, usePathname } from "next/navigation";

import { 
    Autocomplete,
    Typography,
    TextField,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Stack,
    Button,
    Card,
    CardContent,
    CardActions,
    Tooltip,
    IconButton
} from "@mui/material";
import { Selector } from "../misc";
import { router_push } from "@/utils/client_side";
import { NetworkSchema } from "@/app/api/knowledge_graph/route";
import { useQueryState, parseAsJson } from "next-usequerystate";
import { makeTemplate, FilterSchema } from "@/utils/helper";
import { UISchema } from "@/app/api/schema/route";
import { useSearchParams } from "next/navigation";
import { precise } from "@/utils/math";
import HubIcon from "@mui/icons-material/Hub";
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


const AsyncForm = ({ 
    default_term, 
    checkbox_filter,
    filter_text,
    type,
    fields,
    options_endpoint,
    searchParams,
    elements,
    tooltip_templates_edges,
    tooltip_templates_nodes,
    schema
}: {
    default_term: string,
    checkbox_filter?: {[key:string]: any},
    filter_text?: string,
    type: string,
    fields: Array<string>,
    options_endpoint: string,
    searchParams: {
        term?: string,
        field?: string,
        limit?: string,
        fullscreen?:'true',
        view?:string
    },
    elements: NetworkSchema,
    tooltip_templates_edges: {[key: string]: Array<{[key: string]: string}>},
    tooltip_templates_nodes: {[key: string]: Array<{[key: string]: string}>},	
    schema: UISchema

}) => {
    const router = useRouter()
    const pathname = usePathname()
    const [options, setOptions] = useState<{[key:string]: {[key:string]:any}}>({})
    const [term, setTerm] = useState<string>(searchParams.term || default_term)
    const [filter, setFilter] = useState(checkbox_filter)
    const [open, setOpen] = useState(false)
    const [controller, setController] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [querySelected, setQuerySelected] = useQueryState('selected',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	const [hovered, setHovered] = useQueryState('hovered',  parseAsJson<{id: string, type: 'nodes' | 'edges'}>().withDefault(null))
	const [elementMapper, setElementMapper] = useState({nodes: {}, edges: {}})
	
    const {
        field='label',
        limit,
        fullscreen,
        view,
    } = searchParams

    useEffect(()=>{
        if (searchParams.term === undefined) {    
            router_push(router, pathname, {
                type,
                field,
                term, 
            })
        } 
    }, [searchParams.term])

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

    const resolve_options = async () => {
        try {
            const controller = get_controller() 
            const query = {
                field,
            }
            if (options_endpoint === '/api/knowledge_graph/node_search') query["type"] = type
            if (filter) query["filter"]=JSON.stringify(filter)
            if (term) query["term"] = term
            if (limit) query["limit"] = limit
            setTerm(term)
            const query_str = Object.entries(query).map(([k,v])=>(`${k}=${v}`)).join("&")
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}${options_endpoint}${query_str ? "?" + query_str : ""}`, {
                method: 'GET',
                signal: controller.signal
            })
            let options:{[key:string]: {[key:string]: string|number}} = {}
            if (res.ok) options = await (res).json()
            setSelected(options[term])
            setOptions(options)  
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    useEffect(()=>{
        setTerm(default_term)
        setFilter(checkbox_filter)
    },[pathname])

    useEffect(()=>{
        setTerm(searchParams.term)
    }, [searchParams.term])

    useEffect(()=>{
        setLoading(true)
        resolve_options()
    }, [term, filter])

    useEffect(()=>{
        const opts = {}
        for (const i of Object.values(options)) {
            opts[i[field]] = i
        }   
        setOptions(opts)
        if (selected) {        
            setTerm(selected[field])
            router_push(router, pathname, {
                term: selected[field],
                field
            })
        }
    }, [field])

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

    const user_input = querySelected || hovered
    return (
        <Stack direction={"column"} spacing={1}>
            <Typography><b>Select {type}:</b></Typography>
            <Autocomplete
                sx={{ width: '100%' }}
                value={selected}
                open={open}
                onOpen={() => {
                    setOpen(true);
                }}
                onClose={() => {
                    setOpen(false);
                }}
                options={Object.keys(options)}
                loading={loading}
                filterOptions={(x) => x}
                onChange={(e, value)=> {
                    const {term, ...query} = searchParams
                    if (!value) {
                        setTerm('')
                    }
                    else {
                        setTerm(value)
                        router_push(router, pathname, {...query, term: value, type: options[value].type})
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        onChange={(e)=> {
                            {
                                setTerm(e.target.value)
                            }
                        }}
                        sx={{
                            height: 50,
                            borderRadius: 5,
                        }}
                        InputProps={{
                            ...params.InputProps,
                            sx: {
                                fontSize: 12,
                                height: 45,
                                width: "100%",
                                paddingLeft: 5,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignContent: "flex-start",
                                backgroundColor: "#FFF"
                            },
                            endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                            ),
                        }}
                        inputProps={{
                            ...params.inputProps,
                            style: {width: "100%"}
                        }}
                    />
                )}
            />
            {fields.length > 1 && <Typography><b>Select Field:</b></Typography>}
            <Selector entries={fields} 
                value={field ||"label"} 
                prefix={"Field"} onChange={(e)=>{
                    const {field="label", ...query} = searchParams
                    router_push(router, pathname, {
                        ...query,
                        field: e
                    })
                }}/>

            {checkbox_filter && <FormControlLabel control={<Checkbox checked={filter!==null} onClick={()=>{
                if (filter) setFilter(null)
                else setFilter(checkbox_filter)
            }}/>} label={filter_text} />}
            {(user_input !== null && elementMapper[user_input.type][user_input.id] !== undefined) &&
				<TooltipComponent 
					data={elementMapper[user_input.type][user_input.id]} 
					tooltip_templates={user_input.type === 'nodes' ? tooltip_templates_nodes: tooltip_templates_edges}
					schema={schema}
				/>
			}
        </Stack>
    )

}

export default AsyncForm