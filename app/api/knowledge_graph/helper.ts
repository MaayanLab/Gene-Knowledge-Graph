import Color from 'color'
import {default_color} from '@/utils/colors'

let color_map = {}
let score_fields
const get_color = ({color, darken}: {color: string, darken?: number}) => {
	if (!color_map[color]) color_map[color] = Color(color)

	if (darken) return color_map[color].darken((darken)*0.65).hex()
	else return color_map[color].hex()
}

export const highlight_color = '#ff8a80'

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