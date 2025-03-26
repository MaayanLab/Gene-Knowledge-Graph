'use client'
import { precise } from "@/utils/math";
import { useQueryState } from "next-usequerystate";
import EnrichmentBar from "./EnrichmentBar";
import { NetworkSchema } from "@/app/api/knowledge_graph/route";
import { UISchema } from "@/app/api/schema/route";
import NetworkTable from "./NetworkTable";
import { Typography, CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import Cytoscape from "../Cytoscape";

const TermViz = ({elements, schema, tooltip_templates_edges, tooltip_templates_nodes, view}:
	{
		elements:NetworkSchema,
		schema: UISchema,
		tooltip_templates_edges: {[key: string]: Array<{[key: string]: string}>}, 
		tooltip_templates_nodes: {[key: string]: Array<{[key: string]: string}>}, 
		view?: string
	}) => {
	console.log(elements)
	// const [view, setView] = useQueryState('view')
	const entries:{[key:string]: {library: string, value: number, color:string, pval: number, [key: string]: number | string | boolean}} = {}
	const columns:{[key:string]: boolean} = {}
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
				entries[id] = {
					id,
					label,
					enrichr_label,
					...properties,
					library: `${library}`,
					pval: typeof pval === 'number' ? parseFloat(`${precise(pval)}`): undefined,
					qval: typeof qval === 'number' ? precise(qval): undefined,
					zscore: typeof zscore === 'number' ? precise(zscore): undefined,
					combined_score: typeof combined_score === 'number' ? precise(combined_score): undefined,
					value: typeof logpval === 'number'?  logpval : 10000,
					color: `${color}`,
					gradient_color
				}
				for (const [k,v] of Object.entries(entries[id])) {
					if (v !== undefined) columns[k] = true
				}
			}
			
		}
	}
	const sorted_entries = Object.values(entries).sort((a,b)=>a["pval"]-b["pval"])
	if (sorted_entries.length === 0) return <Typography variant="h5">No Results Found</Typography>
	else {
		if (view === 'network' || !view) return (
			<Cytoscape 
				elements={elements}
				schema={schema}
				tooltip_templates_edges={tooltip_templates_edges}
				tooltip_templates_nodes={tooltip_templates_nodes}
				search={false}
			/> 
		) 
		else if (view === "table") return (
			<NetworkTable sorted_entries={sorted_entries} columns={columns}/>
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