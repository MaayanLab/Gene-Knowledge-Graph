'use client'
import Image from "next/image";
import { Grid, Button, Tooltip, Snackbar, Alert, Typography } from "@mui/material";
import { UISchema } from "@/app/api/schema/route";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { router_push } from "@/utils/client_side";
import { parseAsJson } from "next-usequerystate";
import { EnrichmentParams } from "../Enrichment";
import { FilterSchema } from "@/utils/helper";
import { useState } from "react";

const styles = {
	disabled: {
		opacity: .7,
		height: 70
	},
	enabled: {
		opacity: 1,
		height: 70
	},
	active: {
		opacity: 1,
		height: 70,
		background: "#e0e0e0",
		"&:hover": {
			background: "#9e9e9e",
		},
		"&:focus": {
			background: "#9e9e9e",
		},
		"&:enabled": {
			background: "#e0e0e0",
		},
		verticalAlign: "center",
	}
  }

function contains(superset:Array<string>, subset:Array<string>) {
	for (const i of subset || []) {
		if ((superset || []).indexOf(i) > -1) return true
	}
	return false
}

const Subheader = ({schema}:{schema:UISchema}) => {
	const pathname = usePathname()
	const router = useRouter()
	const subheader = schema.header.subheader
	const searchParams = useSearchParams()
	const [error, setError] = useState<{message: string, type:string}>(null)
	const subpaths = (pathname.split("/")).slice(1)
	if (typeof subheader === 'undefined') return null
	else {
		let subheader_props = null
		let default_options = null
		let disableLibraryLimit = false
		const subpaths = (pathname.split("/")).slice(1)
		for (const tab of schema.header.tabs) {
			if (pathname === tab.endpoint) subheader_props = tab.props.subheader

			if (tab.endpoint === `/${subpaths[0]}`) {
				for (const page of tab.props.pages || []) {
					if (page.endpoint === pathname) {
						subheader_props = page.props.subheader
						if (page.props.default_term) {
							default_options = {term: page.props.default_term}
						}
						break
					}
				}
				if (subheader_props === null) subheader_props = tab.props.subheader
				if (default_options === null) {
					default_options = tab.props.initial_query
				}
				if (tab.props.disableLibraryLimit) disableLibraryLimit = true
			}
		}
		if (subheader_props === null) return null
		return (
			<Grid container spacing={1} justifyContent={'center'} alignItems={"center"}>
				<Snackbar open={error!==null}
					anchorOrigin={{ vertical:"bottom", horizontal:"left" }}
					autoHideDuration={4500}
					onClose={()=>{
                        setError(null)
                    }}
				>
                    <Alert 
                        onClose={()=>{
                            setError(null)
                        }}
                        severity={(error || {} ).type === "fail" ? "error": "warning"}
                        sx={{ width: '100%' }} 
                        variant="filled"
                        elevation={6}
                    >
                        <Typography>{( error || {}).message || ""}</Typography>
                    </Alert>
                </Snackbar>
				{subheader.map(i=>{
					const {url_field, query_field} = subheader_props || {}
					const query_parser = parseAsJson<EnrichmentParams | FilterSchema>()
					const query = query_parser.parse(searchParams.get(url_field)) || default_options || {}
					const selected = query[query_field] || []
					const active = contains(selected.map(({name})=>name), i.props[query_field])
					const enabled = selected.length === 0
					let style = {}
					if (enabled) styles.enabled
					else if (active) style = styles.active
					else style = styles.disabled
					return (
						<Grid item key={i.label}>
							<Tooltip title={i.label} placement="top">
								<Button
									disabled={!subheader_props}
									className="flex items-center justify-center relative" 
									sx={{padding: 1, ...style}}
									onClick={()=>{
										// delete

										if (contains(selected.map(({name})=>name), i.props[query_field])) {
											const new_selected = []
											for (const s of selected) {
												if (i.props[query_field].indexOf(s.name) === -1) new_selected.push(s)
											}
											query[query_field] = new_selected
											router_push(router, pathname, {
												[url_field]: JSON.stringify(query)
											})
										} else { // add
											if (selected.length >= 5 && !disableLibraryLimit) setError({message: `A maximum of only five ${query_field} can selected`, type: "fail"})
											else {
												query[query_field] = [...selected, ...i.props[query_field].map((name:string)=>({name, limit: 5}))]
												router_push(router, pathname, {
													[url_field]: JSON.stringify(query)
												})
											}
										}	
									}}
								>
									<Image  src={i.icon || ''} alt={i.label} width={i.width} height={i.height}/>
								</Button>
							</Tooltip>
						</Grid>
					)
				})}
			</Grid>
		)
	}
}

export default Subheader