'use client'
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { makeTemplate } from "@/utils/helper";
import { precise } from "@/utils/math";
import { Grid, Button, Tabs, Tab, Card, CardContent } from "@mui/material";
import { DataGrid, GridToolbar, GridColDef } from "@mui/x-data-grid";
import { UISchema } from "@/app/api/schema/route";
import { NetworkSchema } from "@/app/api/knowledge_graph/route";
const NetworkTable = ({data, schema}: {data: NetworkSchema, schema: UISchema}) => {
	const [processedData, setProcessedData] = useState<{
		[key:string]: {
			header: Array<{field: string, headerName: string, count: number, [key: string]: string | number | {[key:string]: any}}>, 
			data: {[key: string]: {[key: string]: any}}, 
			columnVisibilityModel: {[key: string]: boolean}
		}
	} | null>(null)
	// const [mapper, setMapper] = useState({})
	const [tab, setTab] = useState<null | string>(null)
	const [tabs, setTabs] = useState<Array<string>>(null)
	const display = {}
	for (const i of schema.nodes) {
		display[i.node] = i.display
	}
	for (const i of schema.edges) {
		for (const m of i.match) {
			display[m] = i.display
		}
	}

	useEffect(()=>{
		if (data) {
			const processed = {}
			const id_mapper = {}
			const node_tabs = []
			const edge_tabs = []
			for (const d of [...data.nodes, ...data.edges]) {
				const {kind, relation, source, target, label, "Unnamed: 0": _, ...properties} = d.data
				const key = relation || kind
				if (key && typeof key === 'string') { 
					if ( processed[key] === undefined) {
						if (relation) edge_tabs.push(key)
						else node_tabs.push(key)
						processed[key] = {header: [], data: {}, columnVisibilityModel: {}}
						const header = []
						const columnVisibilityModel = {}
						if (display[key]) {
							for (const prop of display[key]) {
								const field = prop.label
								columnVisibilityModel[field] = !(prop.hide)
								if (prop.type === "link") {
									header.push({
										field,
										headerName: field,
										flex: 1,
										style: {flexDirection: "row"},
										align: "left",
										text: prop.text,
										href: prop.href,
										renderCell: ({row, field})=>{
											return <Button href={row[field].href}>{row[field].text}</Button>
										},
										count: 0
									})

								} else {
									header.push({
										field,
										headerName: field,
										flex: 1,
										style: {flexDirection: "row"},
										align: "left",
										text: prop.text,
										count: 0
									})
								}
							}
						} else if (typeof properties.id === 'string') {
							const {id, symbol, ref, ...rest} = properties
							id_mapper[id] = label
							header.push({
								field: 'id',
								headerName: "ID",
								flex: 1,
								style: {flexDirection: "row"},
								align: "left",
								type: relation ? "edge": "node",
							})
							header.push({
								field: 'label',
								headerName: "Label",
								flex: 1,
								style: {flexDirection: "row"},
								align: "left",
								type: relation ? "edge": "node",
							})
							for (const field of Object.keys(rest)) {
								const headerName = field.replaceAll(".", " ")
								header.push({
									field,
									headerName: headerName.charAt(0).toUpperCase() + headerName.slice(1),
									// flex: 1,
									style: {flexDirection: "row"},
									align: "left",
									type: relation ? "edge": "node",
									count: 0
								})
							}
						}
						processed[key].header = header
						processed[key].columnVisibilityModel = columnVisibilityModel
					}
					if (processed[key].data[properties.id] === undefined) {
						processed[key].data[properties.id] = {id: properties.id !== "" ? properties.id: `${source}_${target}`}
					}
					for (const i of processed[key].header) {
						if (i.href) {
							const val = makeTemplate(i.text, properties)
							const href = makeTemplate(i.href, properties)
							processed[key].data[properties.id][i.field] = {
								text: val === "undefined" ? "": val,
								href: href === "undefined" ? "": href
							}
							if (val !== "undefined") {
								i.count = i.count + 1
							}
						} else {
							
							const val = makeTemplate(i.text, properties)

							processed[key].data[properties.id][i.field] = val === "undefined" ? "": precise(val)
							if (val !== "undefined") {
								i.count = i.count + 1
							}
						}
					}
					if (processed[key].data[properties.id]["label"] === "") processed[key].data[properties.id]["label"] = label
				} 
			}
			// setMapper(id_mapper)
			setTabs([...node_tabs, ...edge_tabs])
			setTab(node_tabs[0])
			setProcessedData(processed)	
		}
	}, [data])
	
	if (processedData === null) return null
	else {
		const {data={}, header=[], columnVisibilityModel} = processedData[tab] || {}
		const columns: GridColDef[] = header.filter(i=>i.count === undefined || i.count > 0)
	
		return (
			<Card style={{marginBottom: 10}}>
				<CardContent>
					<Grid container justifyContent={"center"} style={{paddingBottom: 10}}>
						<Grid item xs={12}>
							<Tabs
								value={tab}
								variant="scrollable"
								scrollButtons="auto"
								onChange={(e, val)=>setTab(val)}
								aria-label="tab"
							>
							{tabs.map(k=>(
								<Tab value={k} aria-label="left aligned" key={`tab-${k}`} label={k}/>
							))}
							</Tabs>
						</Grid>
						<Grid item xs={12}>
							<DataGrid
								key={tab}
								initialState={{
									columns: {
									columnVisibilityModel
									},
								}}
								components={{ Toolbar: GridToolbar }}
								sortingOrder={['desc', 'asc']}
								rows={Object.values(data)}
								columns={columns}
								autoPageSize
								disableColumnMenu
								autoHeight
								pageSize={10}
								rowsPerPageOptions={[5, 10, 25]}
							/>
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		)
	}
}

export default NetworkTable