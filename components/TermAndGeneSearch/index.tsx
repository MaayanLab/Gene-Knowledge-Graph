import { FilterSchema } from "@/utils/helper"
import { UISchema } from "@/app/api/schema/route"
import { typed_fetch } from "@/utils/helper"
import { process_relation } from "@/utils/helper"
import ClientTermAndGeneSearch from './client_side'
const get_static_props = async () => {
    const schema = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
    const nodes = {}
	const tooltip_templates_nodes = {}
  	const tooltip_templates_edges = {}
    const edges = []
    const default_relations = []
    const geneLinksRelations = []
	for (const i of schema.nodes) {
		tooltip_templates_nodes[i.node] = i.display
		const {node} = i
		nodes[node] = i
	}
    for (const i of schema.edges) {
        for (const e of i.match) {
            tooltip_templates_edges[e] = i.display
            if (!i["gene_link"]) {
                if (edges.indexOf(e) === -1) {
                    edges.push(e)
                } 
                if (i.selected && default_relations.indexOf(e) === -1) {
                    default_relations.push(e)
                }
            } else if (geneLinksRelations.indexOf(e) === -1) {
                geneLinksRelations.push(i.match)
            }
        }
    }
    return {
        schema,
        nodes,
        tooltip_templates_nodes,
        tooltip_templates_edges,
        edges,
        geneLinksRelations,
        default_relations,
    }
}

const TermAndGeneSearch = async ({searchParams, props}: {
        searchParams?: {
            filter?: string,
            fullscreen?: 'true',
            view?:string,
            tooltip?: 'true',
            edge_labels?: 'true',
            legend?: 'true',
            legend_size?: string,
            layout?: string
        },
        props: {
            title?: string
            description?: string,
            initial_query?: {
                start: string,
                start_term: string,
                start_field?: string,
                [key: string]: string
            },
            coexpression_prediction?: boolean,
            gene_link_button?: boolean,
            neighborCount?: number,
        }
}) => {
    const {
        schema,
        nodes,
        tooltip_templates_nodes,
        tooltip_templates_edges,
        edges
    } = await get_static_props()
    const filter: FilterSchema = searchParams.filter ? JSON.parse(searchParams.filter): {}
    const controller = new AbortController()
    try {
        if (filter.relation) {
            if (!filter.end) {
                console.log(filter.relation)
                if (typeof filter.relation[0] === 'string') {
                    filter.relation = process_relation(filter.relation).map((name)=>({name, limit: filter.limit || 5}))
                } else {
                    filter.relation = process_relation(filter.relation).map(({name, limit})=>({name, limit: limit || filter.limit || 5}))
                }
                delete filter.limit
            } else {
                if (typeof filter.relation[0] === 'string') {
                    filter.relation = process_relation(filter.relation).map((name)=>({name}))
                } else {
                    filter.relation = process_relation(filter.relation).map(({name})=>({name}))
                }
                filter.relation = process_relation(filter.relation).map(({name})=>({name}))
                delete filter.augment
                delete filter.augment_limit
            }
        }
        let elements = null
        console.log(filter)
        if (Object.keys(filter).length > 0) {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/knowledge_graph?filter=${JSON.stringify(filter)}`,
            {
                method: 'GET',
                signal: controller.signal,
            }) 
            if (!res.ok) throw await res.text()
            elements = await res.json()
        }  
        const selected_edges = []
        for (const i of (elements || {}).edges || []) {
            if (i.data.relation && selected_edges.indexOf(i.data.label) === -1) {
                selected_edges.push({name: i.data.label})
            }
        }
        if (!filter.relation || filter.relation.length === 0) {
            filter.relation = selected_edges
        }
        return <ClientTermAndGeneSearch
                searchParams={searchParams}
                elements={elements}
                schema={schema}
                nodes={nodes}
                tooltip_templates_nodes={tooltip_templates_nodes}
                tooltip_templates_edges={tooltip_templates_edges}
                title={props.title}
                description={props.description}
                initial_query={props.initial_query}
                edges={edges}
                {...props}
            />
        // return null
    } catch (error) {
        console.error(error)
        return null
    }
}

export default TermAndGeneSearch