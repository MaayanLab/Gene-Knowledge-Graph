import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { makeTemplate } from "../utils/helper";
import { precise } from "../utils/helper";
const Grid = dynamic(() => import('@mui/material/Grid'));
const Button = dynamic(() => import('@mui/material/Button'));
const DataGrid = dynamic(async () => (await import('@mui/x-data-grid')).DataGrid);
const GridToolbar = dynamic(async () => (await import('@mui/x-data-grid')).GridToolbar);
const Tabs = dynamic(() => import('@mui/material/Tabs'));
const Tab = dynamic(() => import('@mui/material/Tab'));
const Card = dynamic(() => import('@mui/material/Card'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));

const NetworkTable = ({data, schema}) => {
	const [processedData, setProcessedData] = useState(null)
	const [mapper, setMapper] = useState({})
	const [tab, setTab] = useState(null)
	const [tabs, setTabs] = useState(null)
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
			for (const d of data) {
				const {kind, relation, properties, source, target, label} = d.data
				const key = relation || kind
				if (key) { 
					if ( processed[key] === undefined) {
						if (relation) edge_tabs.push(key)
						else node_tabs.push(key)
						processed[key] = {header: [], data: {}, columnVisibilityModel: {}}
						const header = []
						const columnVisibilityModel = {}
						if (display[key]) {
							// header.push({
							// 	field: 'label',
							// 	headerName: "Label",
							// 	// flex: 1,
							// 	style: {flexDirection: "row"},
							// 	align: "left",
							// 	type: relation ? "edge": "node",
							// })
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
						} else {
							const {id, label, symbol, ref, ...rest} = properties
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
						processed[key].data[properties.id] = {id: properties.id || `${source}_${target}`}
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
				// else {
				// 	if (processed["Relationships"] === undefined) {
				// 		processed["Relationships"] = {header: [], data: []}
				// 		const header = [
				// 			{
				// 				field: 'label',
				// 				headerName: "Label",
				// 				flex: 1,
				// 				style: {flexDirection: "row"},
				// 				align: "left",
				// 			}
				// 		]
				// 		const {id, label, ...rest} = properties
				// 		for (const field of Object.keys(rest)) {
				// 			const headerName = field.replaceAll(".", " ")
				// 			header.push({
				// 				field,
				// 				headerName: headerName.charAt(0).toUpperCase() + headerName.slice(1),
				// 				flex: 1,
				// 				style: {flexDirection: "row"},
				// 				align: "left",
				// 			})
				// 		}
				// 		processed["Relationships"].header= header
				// 	}
				// 	const id = `${d.data.source}_${d.data.target}`
				// 	if (processed["Relationships"].data[id] === undefined)
				// 		processed["Relationships"].data[id] = {
				// 			id: `${d.data.source}_${d.data.target}`,
				// 			...d.data.properties,
				// 		}
				// }
			}
			setMapper(id_mapper)
			setTabs([...node_tabs, ...edge_tabs])
			setTab(node_tabs[0])
			setProcessedData(processed)	
		}
	}, [data])
	if (processedData === null) return null
	else {
		const {data={}, header=[], columnVisibilityModel} = processedData[tab] || {}
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
								fullWidth
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
								columns={header.filter(i=>i.count === undefined || i.count > 0)}
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