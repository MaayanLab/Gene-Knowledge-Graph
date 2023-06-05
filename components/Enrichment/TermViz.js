import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { precise } from "../../utils/helper";
const Grid = dynamic(() => import('@mui/material/Grid'));
const Card = dynamic(() => import('@mui/material/Card'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));

const DataGrid = dynamic(async () => (await import('@mui/x-data-grid')).DataGrid);
const GridToolbar = dynamic(async () => (await import('@mui/x-data-grid')).GridToolbar);
const Tabs = dynamic(() => import('@mui/material/Tabs'));
const Tab = dynamic(() => import('@mui/material/Tab'));
const EnrichmentBar = dynamic(() => import('./EnrichmentBar'));

const header = [
    {
        field: 'enrichr_label',
        headerName: "Term",
        flex: 1,
        style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'library',
        headerName: "Library",
        flex: 1,
        style: {flexDirection: "row"},
        align: "left"
    },
    {
        field: 'pval',
        headerName: "p-value",
        align: "left"
    },
    {
        field: 'qval',
        headerName: "q-value",
        align: "left"
    },
    {
        field: 'zscore',
        headerName: "z-score",
        align: "left"
    },
    {
        field: 'combined_score',
        headerName: "combined score",
        align: "left"
    }
]

const tabs = {
	bar: {
		label: "Enrichment Bar Charts",
		component: ({entries})=><EnrichmentBar data={entries}
			max={entries[0].value}
			min={entries[entries.length - 1].value}
			width={900}
		/>
	},
	table: {
		label: "Enrichment Table",
		component: ({entries}) => <DataGrid
			components={{ Toolbar: GridToolbar }}
			sortingOrder={['desc', 'asc']}
			rows={entries}
			columns={header}
			autoPageSize
			disableColumnMenu
			autoHeight
			pageSize={10}
			rowsPerPageOptions={[5, 10, 25]}
		/>
	},
}

const TermViz = ({data, tab, setTab}) => {
	const [entries, setEntries] = useState(null)
	useEffect(()=>{
		if (data) {
			const entries = {}
            
			for (const dt of data) {
				const {label, id: i, kind, color, gradient_color} = dt.data
                if (dt.data.properties.pval !== undefined) {
					for (const properties of dt.data.properties.enrichment || [dt.data.properties]) {
						const {enrichr_label} = properties
						const id = `${properties.library}: ${enrichr_label} (${i})`
						if (entries[id] === undefined && kind !== "Gene") {
							entries[id] = {
								id,
								label,
								enrichr_label,
								...properties,
								library: dt.data.properties.library,
								pval: parseFloat(precise(properties.pval)),
								qval: parseFloat(precise(properties.qval)),
								zscore: parseFloat(precise(properties.zscore)),
								combined_score: parseFloat(precise(properties.combined_score)),
								value: properties.logpval || 10000,
								color,
								gradient_color
							}
						}
					}
                }
			}
			setEntries(Object.values(entries).sort((a,b)=>a.pval-b.pval))
		}
	}, [data])
	if (tab === null) return null
	if (entries === null) return null
	else if (entries.length === 0) return null
	else {
		return (
			<Card>
				<CardContent>
					<Grid container justifyContent={"center"} spacing={2}>
						<Grid item xs={12}>
							<Tabs
								value={tab}
								variant="scrollable"
								scrollButtons="auto"
								onChange={(e, val)=>setTab(val)}
								aria-label="tab"
								fullWidth
								centered
							>
							{Object.entries(tabs).map(([k,v])=>(
								<Tab value={k} aria-label="left aligned" key={`tab-${k}`} label={v.label}/>
							))}
							</Tabs>
						</Grid>
						<Grid item xs={12} align="center">
							{tabs[tab].component({entries})}
						</Grid>
					</Grid>
				</CardContent>
			</Card>
		)
	}
}

export default TermViz