'use client'
import { precise } from "@/utils/math";
import { DataGrid, GridToolbar, GridColDef } from "@mui/x-data-grid";
import EnrichmentBar from "./EnrichmentBar";
import { NetworkSchema } from "@/app/api/knowledge_graph/route";
import Cytoscape from "../misc/Cytoscape";
import { UISchema } from "@/app/api/schema/route";
const header: GridColDef[] = [
    {
        field: 'enrichr_label',
        headerName: "Term",
        flex: 1,
        // style: {flexDirection: "row"},
        align: "left"
    },
	{
        field: 'library',
        headerName: "Library",
        flex: 1,
        // style: {flexDirection: "row"},
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

const TermViz = ({elements, view, schema, tooltip_templates_edges, tooltip_templates_nodes}:
	{
		elements:NetworkSchema,
		view: string,
		schema: UISchema,
		tooltip_templates_edges: {[key: string]: Array<{[key: string]: string}>}, 
		tooltip_templates_nodes: {[key: string]: Array<{[key: string]: string}>}, 
	}) => {
	const entries:{[key:string]: {library: string, value: number, color:string, pval: number, [key: string]: number | string | boolean}} = {}
	for (const dt of [...elements.nodes, ...elements.edges]) {
		const {label, id: i, kind, color, gradient_color, ...properties} = dt.data
		if (dt.data.pval !== undefined) {
			const {enrichr_label} = properties
			const id = `${properties.library}: ${enrichr_label} (${i})`
			if (entries[id] === undefined && kind !== "Gene") {
				const {
					pval,
					qval,
					zscore,
					combined_score,
					library,
					logpval
				} = properties
				if (typeof library === "string" && 
					typeof pval === 'number' && 
					typeof qval === 'number' && 
					typeof zscore === 'number' && 
					typeof combined_score === 'number' &&
					typeof logpval === 'number'
				){
					entries[id] = {
						id,
						label,
						enrichr_label,
						...properties,
						library: library,
						pval: parseFloat(`${precise(pval)}`),
						qval: precise(qval),
						zscore: precise(zscore),
						combined_score: precise(combined_score),
						value: logpval || 10000,
						color: `${color}`,
						gradient_color
					}
				}
			}
			
		}
	}
	const sorted_entries = Object.values(entries).sort((a,b)=>a["pval"]-b["pval"])
	if (sorted_entries.length === 0) return null
	else {
		if (view === 'network' || !view) return (
			<Cytoscape 
				elements={elements}
				schema={schema}
				tooltip_templates_edges={tooltip_templates_edges}
				tooltip_templates_nodes={tooltip_templates_nodes}
			/> 
		) 
		else if (view === "table") return (
			<DataGrid
				components={{ Toolbar: GridToolbar }}
				sortingOrder={['desc', 'asc']}
				rows={sorted_entries}
				columns={header}
				autoPageSize
				disableColumnMenu
				autoHeight
				pageSize={10}
				rowsPerPageOptions={[5, 10, 25]}
			/>
		) 
		else if (view === "bar") return(
			<EnrichmentBar data={sorted_entries}
				max={sorted_entries[0]["value"]}
				min={sorted_entries[sorted_entries.length - 1]["value"]}
				width={900}
			/>
		)
	}
}

export default TermViz