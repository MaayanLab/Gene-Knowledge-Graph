import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import Color from 'color'
import { process_properties } from "@/utils/helper"
import {default_color, mui_colors} from '@/utils/colors'
import { NetworkSchema } from "./route"
import { e } from "next-usequerystate/dist/serializer-5da93b5e"
import { ArrowShape } from "@/components/Cytoscape"

let color_map = {}
let score_fields
const get_color = ({color, darken}: {color: string, darken?: number}) => {
	if (!color_map[color]) color_map[color] = Color(color)

	if (darken) return color_map[color].darken((darken)*0.65).hex()
	else return color_map[color].hex()
}

const highlight_color = '#ff8a80'

export const default_get_node_color_and_type = ({node, terms, color=default_color, aggr_scores, field, aggr_field, aggr_type, fields=[]}: {
    node: {[key:string]: any},
    terms?: Array<string>,
    color?: string,
    aggr_scores?: {[key:string]: {max: number, min: number}},
    field?: string,
    aggr_field?: string,
    aggr_type?: string,
    fields?: Array<string>
}): {
    color: string,
    node_type: number,
    borderColor?: string,
    borderWidth?: number
} => {
	if (fields.filter(i=>i && terms.indexOf(node[i]) > -1).length > 0) {
		return {color: highlight_color, node_type: 1}
	} else if (node[field] && aggr_field!==undefined && aggr_type!==undefined) {
		const max = aggr_scores[field].max || 0
		const min = aggr_scores[field].min || 0
		const score = node[field]
		// it's not neg to pos
		if ((min >= 0 && max >= 0) || (min < 0 && max <= 0)) {
			const ext_diff = Math.abs(max-min)
			const comp = aggr_type === "max" ? max: min
			const val_diff = Math.abs(score-comp)
			return {
				color: get_color({color, darken: 1-(val_diff/ext_diff)}),
				node_type: 0
			}
		} else {
			// two sided
			const comp = score > 0 ? max: min
			const val_diff = Math.abs(score-comp)
			const ext_diff = Math.abs(comp)
			return {
				color: get_color({color, darken: 1-(val_diff/ext_diff)}),
				node_type: 0
			}
		}
	}
	return {
		color: get_color({color}),
		node_type: 0
	}		
}

export const default_get_edge_color = ({relation, color, aggr_field, field, aggr_scores}) => {
	if (relation[field] && aggr_field) {
		const aggr_score = aggr_scores[aggr_field]
		return {
			lineColor: get_color({color, darken: Math.abs(relation[field]/aggr_score)}),
			node_type: 0
		}
	}
	return {
		lineColor: color
	}
}

export const resolve_node_types = async ({
    query,
    query_params
}: {
    query: string,
    query_params?: {[key:string]: any},
}) => {
    try {
        const session = neo4jDriver.session({
            defaultAccessMode: neo4j.session.READ
        })
        const q = query + `
            WITH p limit TOINTEGER($limit)
            UNWIND NODES(p) as n
            RETURN DISTINCT labels(n)[0] as node_types LIMIT TOINTEGER($limit)
        `
        const results = await session.readTransaction(txc => txc.run(q, query_params))
        const node_types = []
        for (const record of results.records) {
            node_types.push(record.get('node_types'))
        }
        console.log(node_types.map(i=>(`\`${i}\``)).join("|"))
        return node_types.map(i=>(`\`${i}\``)).join("|")
    }
    catch (error) {
        console.log(error)
        throw error
    }
}

export const resolve_results = async ({
    query,
    query_params,
	terms,
	fields,
	colors,
	aggr_scores,
	get_node_color_and_type=default_get_node_color_and_type,
	get_edge_color=default_get_edge_color,
	properties = {},
	kind_properties = {},
	misc_props = {},
	kind_mapper = null, 
    arrow_shape = {}
}: {
    query: string,
    query_params?: {[key:string]: any},
    terms?: Array<string | number>,
    fields?: Array<string>,
    colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string, border_color?: string, ring_label?: string, edge_suffix?: string }},
    aggr_scores?: {[key:string]: {max: number, min: number}},
    get_node_color_and_type?: Function,
    get_edge_color?: Function,
    properties?: {[key: string]: any},
    kind_properties?: {[key: string]: any},
    misc_props?: {[key: string]: any},
    kind_mapper?: Function,
    arrow_shape?: {[key:string]: ArrowShape}
}):Promise<NetworkSchema> => {
        try {
            const session = neo4jDriver.session({
                defaultAccessMode: neo4j.session.READ
            })
            const results = await session.readTransaction(txc => txc.run(query, query_params))
            const color_values = {}
            let color_index = 0
            let shade_index = 0
            const shade = ["A100", 200, "A700", "400", "A400"]
            const colors_func = (type) => {
                if (colors[type] && colors[type].color) {
                    color_values[type] = colors[type]
                }else if (color_values[type] === undefined) {
                    const c = Object.values(mui_colors)[color_index][shade[shade_index]]
                    if (color_index < Object.keys(mui_colors).length) color_index = color_index + 1
                    else {
                        color_index = 0
                        if (shade_index === shade.length) {
                            shade_index = 0
                        } else {
                            shade_index = shade_index + 1
                        }
                    }
                    color_values[type] = {color: c}
                }
                return {...color_values[type]}
            }
            const nodes = {}
            const edges = {}
            for (const record of results.records) {
                const node_list = record.get('n')
                for (const node of node_list) {
                    if (nodes[node.identity] === undefined) {
                        const type = node.labels.filter(i=>i!=="id")[0]
                        const kind = kind_mapper ? kind_mapper({node, type, ...misc_props})  : type
                        const node_properties = {
                            id: node.properties.id,
                            kind,
                            label: node.properties.label || node.properties.id,
                            ...process_properties(node.properties),
                            ...properties[node.properties.label || node.properties.id] || {},
                            ...(kind_properties[kind] || {})[node.properties.label] || {},
                        }
                        const node_color = get_node_color_and_type({node: node_properties, 
                            terms,
                            fields,
                            aggr_scores,
                            ...colors_func(type), 
                            ...misc_props
                        })
                        if (colors[type] && colors[type].border_color && !node_color.borderColor && node_color.color !== highlight_color) {
                            node_color.borderColor = colors[type].border_color
                            node_color.borderWidth = 7
                        }
                        if (colors[type] && colors[type].ring_label && node_color.color !== highlight_color) {
                            node_color.ring_label = colors[type].ring_label
                        }
                        nodes[node.identity] = {
                            data: {
                                ...node_properties,
                                ...node_color
                            }
                        }
                    }	
                }
                const relations = record.get('r')
                for (const relation of relations) {
                    const relation_id = `${nodes[relation.start].data.id}_${nodes[relation.end].data.id}`
                    if (edges[relation_id] === undefined) {
                        const relation_type = relation.type
                        if (colors[relation_type] === undefined) {
                            console.log(`${relation_type} is undefined`)
                        }
                        edges[relation_id] = {
                            data: {
                                source: nodes[relation.start].data.id,
                                target: nodes[relation.end].data.id,
                                source_label: nodes[relation.start].data.label,
                                target_label: nodes[relation.end].data.label,
                                kind: "Relation",
                                label: relation_type,
                                ...properties[relation_type] || {},
                                ...process_properties(relation.properties),
                                ...(get_edge_color({relation, record, aggr_scores, ...(colors[relation_type] || {})})),
                                relation: (colors[relation_type] || {}).edge_suffix ? `${relation_type} ${colors[relation_type].edge_suffix}`:relation_type,
                                directed: arrow_shape[relation_type] || 'none'
                            }
                        }
                    }
                }
            }
            return {
                nodes: Object.values(nodes),
                edges: Object.values(edges)
            }
        } catch (error) {
            console.log(error)
            throw error
        }
	}


    