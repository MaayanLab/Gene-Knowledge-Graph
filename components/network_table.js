import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const DataGrid = dynamic(async () => (await import('@mui/x-data-grid')).DataGrid);
const GridToolbar = dynamic(async () => (await import('@mui/x-data-grid')).GridToolbar);
const ToggleButton = dynamic(() => import('@mui/material/ToggleButton'));
const ToggleButtonGroup = dynamic(() => import('@mui/material/ToggleButtonGroup'));

const NetworkTable = ({data}) => {
	const [processedData, setProcessedData] = useState(null)
	const [mapper, setMapper] = useState({})
	const [tab, setTab] = useState(null)
	const [tabs, setTabs] = useState(null)

	useEffect(()=>{
		if (data) {
			const processed = {}
			const id_mapper = {}
			for (const d of data) {
				const {kind, properties, source, target} = d.data
				if (kind) {
					if (processed[kind] === undefined) {
						processed[kind] = {header: [], data: {}}
						const header = []
						const {id, label, symbol, ref, ...rest} = properties
						id_mapper[id] = label
						header.push({
							field: 'id',
							headerName: "ID",
							flex: 1,
							style: {flexDirection: "row"},
							align: "left",
						})
						header.push({
							field: 'label',
							headerName: "Label",
							flex: 1,
							style: {flexDirection: "row"},
							align: "left",
						})
						for (const field of Object.keys(rest)) {
							const headerName = field.replaceAll(".", " ")
							header.push({
								field,
								headerName: headerName.charAt(0).toUpperCase() + headerName.slice(1),
								flex: 1,
								style: {flexDirection: "row"},
								align: "left",
							})
						}
						processed[kind].header = header
					}
					if (processed[kind].data[properties.id] === undefined)
						processed[kind].data[properties.id] = properties
				} else {
					if (processed["Relationships"] === undefined) {
						processed["Relationships"] = {header: [], data: []}
						const header = [
							{
								field: 'label',
								headerName: "Label",
								flex: 1,
								style: {flexDirection: "row"},
								align: "left",
							}
						]
						const {id, label, ...rest} = properties
						for (const field of Object.keys(rest)) {
							const headerName = field.replaceAll(".", " ")
							header.push({
								field,
								headerName: headerName.charAt(0).toUpperCase() + headerName.slice(1),
								flex: 1,
								style: {flexDirection: "row"},
								align: "left",
							})
						}
						processed["Relationships"].header= header
					}
					const id = `${d.data.source}_${d.data.target}`
					if (processed["Relationships"].data[id] === undefined)
						processed["Relationships"].data[id] = {
							...d.data.properties,
							id: `${d.data.source}_${d.data.target}`
						}
				}
			}
			setMapper(id_mapper)
			setTabs(Object.keys(processed))
			setTab(Object.keys(processed)[0])
			setProcessedData(processed)	
		}
	}, [data])
	if (processedData === null) return null
	else {
		const {data={}, header=[]} = processedData[tab] || {}
		return (
			<Grid container>
				<Grid item xs={12}>
					<ToggleButtonGroup
						value={tab}
						exclusive
						onChange={(e, val)=>setTab(val)}
						aria-label="tab"
					>
					{tabs.map(k=>(
						<ToggleButton value={k} aria-label="left aligned" key={`tab-${k}`}>
							<Typography>{k}</Typography>
						</ToggleButton>
					))}
					</ToggleButtonGroup>
				</Grid>
				<Grid item xs={12}>
					<DataGrid
						key={tab}
						components={{ Toolbar: GridToolbar }}
						sortingOrder={['desc', 'asc']}
						rows={Object.values(data)}
						columns={header}
						autoPageSize
						disableColumnMenu
						autoHeight
						pageSize={10}
						rowsPerPageOptions={[5, 10, 25]}
					/>
				</Grid>
			</Grid>
		)
	}
}

export default NetworkTable