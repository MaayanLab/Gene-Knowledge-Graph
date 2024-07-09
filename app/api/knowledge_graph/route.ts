import neo4j from "neo4j-driver"
import { neo4jDriver } from "@/utils/neo4j"
import { z } from "zod"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { augment_gene_set, kind_mapper, get_node_color_and_type_augmented } from "@/utils/helper"
import { resolve_results, resolve_node_types } from "./helper"
import { fetch_kg_schema } from "@/utils/initialize"
import { initialize } from "../initialize/helper"
export interface NetworkSchema {
    nodes: Array<{
        data: {
            id: string,
            kind: string,
            label: string,
			pval?: number,
            [key: string]: string | number | boolean,
        }
    }>,
    edges: Array<{
        data: {
            source: string,
            source_label: string,
            target: string,
            target_label: string,
            kind: string,
            label: string,
			relation?: string,
            [key: string]: string | number | boolean,
        }
    }>
}


const resolve_two_terms = async ({
    edges, 
    start, 
    start_field,
    start_term,
    end,
    end_field,
    end_term,
    limit,
    path_length=4,
    relation,          
    aggr_scores, 
    colors, 
    expand: e, 
    remove, 
    gene_links,
	additional_link_tags
}: {
        edges: Array<string>,
        start: string,
        start_field: string,
        start_term: string,
        end: string,
        end_field: string,
        end_term: string,
        limit?: number,
        path_length?: number,
        relation?: Array<{name?: string, limit?: number, end?: string}>,
        aggr_scores?: {[key:string]: {max: number, min: number}},
        colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
        expand?: Array<string>,
        remove?: Array<string>,
        gene_links?: Array<string>,
		additional_link_tags?: Array<string>,
})=> {
	let query = `MATCH p=allShortestPaths((a: \`${start}\` {${start_field}: $start_term})-[*..${path_length}]-(b: \`${end}\` {${end_field}: $end_term}))
		USING INDEX a:\`${start}\`(${start_field})
		USING INDEX b:\`${end}\`(${end_field})
		WHERE all(rel in relationships(p) WHERE rel.hidden IS NULL)
	`		
	if (relation) {
		const rels = []
		for (const i of relation) {
			if (edges.indexOf(i.name) === -1) throw {message: `Invalid relationship ${i.name}`}
			rels.push(`\`${i.name}\``)
		}
		if (rels.length > 0) query = query.replace(`[*..${path_length}]`,`[:${rels.join("|")}*..${path_length}]`)
	}
	const vars = {}
	if ((remove || []).length) {
		query = query + `
			AND NOT a.id in ${JSON.stringify(remove)}
			AND NOT b.id in ${JSON.stringify(remove)}
		`
	} 
	const gl = []
	const q = query
	query = query + `RETURN p, nodes(p) as n, relationships(p) as r LIMIT TOINTEGER($limit)`
	if (gene_links.length > 0 || additional_link_tags.length > 0) {
		query = `CALL {
			${query}
		}
		WITH p as q, n as n1, r as r1
		`
		for (const i of gene_links) {
			if (edges.indexOf(i) === -1) throw {message: `Invalid relationship ${i}`}
			gl.push(`\`${i}\``)
		}
		if (gl.length > 0) {
			query = query + `
				CALL {
					WITH q, n1, r1
					RETURN q as p, n1 as n, r1 as r
					UNION
					WITH q
					MATCH p=(c)-[r:${gl.join("|")}]-(d)
					WHERE c in n1 and d in n1
					${additional_link_tags.length > 0 ?
						`AND r.hidden_tag IN ${JSON.stringify(additional_link_tags)}`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r			
				}
				RETURN p, n, r `
		} else if (additional_link_tags.length > 0){
			const node_types = await  resolve_node_types({query: q, query_params: { start_term, end_term, limit, ...vars }})
			query = query + `
				CALL {
					WITH q, n1, r1
					MATCH p=(c:${node_types})-[r]-(d:${node_types})
					WHERE c in n1 and d in n1
					${additional_link_tags.length > 0 ?
						`AND r.hidden_tag IN ${JSON.stringify(additional_link_tags)}`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r			
					UNION
					WITH q, n1, r1
					RETURN q as p, n1 as n, r1 as r
					
				}
				RETURN p, n, r `
		}
	}
	// else {
	// 	query = query + `RETURN q as p, nodes(q) as n, relationships(q) as r LIMIT TOINTEGER($limit)`
	// }
	// remove has precedence on expand
	const expand = (e || []).filter(i=>(remove || []).indexOf(i) === -1)

	if ((expand || []).length) {
		for (const ind in expand) {
			vars[`expand_${ind}`] = expand[ind]
			query = query + `
				UNION
				MATCH p = (c)--(d)
				WHERE c.id = $expand_${ind}
				RETURN p, nodes(p) as n, relationships(p) as r
				LIMIT 10
			`   
		}
	}
	console.log(query)
	const query_params = { start_term, end_term, limit, ...vars }
	return resolve_results({query, query_params, terms: [start_term, end_term],  aggr_scores, colors, fields: [start_field, end_field]})
}

const resolve_term_and_end_type = async (
    {
        edges, 
        start, 
        start_field,
        start_term,
        end,
        limit,
        path_length=4,
        relation,          
        aggr_scores, 
        colors, 
        expand: e, 
        remove, 
        gene_links,
		additional_link_tags
	}: {
            edges: Array<string>,
            start: string,
            start_field: string,
            start_term: string,
            end: string,
            limit?: number,
            path_length?: number,
            relation?: Array<{name?: string, limit?: number, end?: string}>,
            aggr_scores?: {[key:string]: {max: number, min: number}},
            colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
            expand?: Array<string>,
            remove?: Array<string>,
            gene_links?: Array<string>,
			additional_link_tags?: Array<string>,
    })=> {
	
	let query = `MATCH p=allShortestPaths((a: \`${start}\` {${start_field}: $start_term})-[*..${path_length}]-(b: \`${end}\`))
		USING INDEX a:\`${start}\`(${start_field})
		WHERE all(rel in relationships(p) WHERE rel.hidden IS NULL)
	`
	  if (relation) {
		const rels = []
		for (const i of relation) {
			if (edges.indexOf(i.name) === -1) throw {message: `Invalid relationship ${i.name}`}
			rels.push(`\`${i.name}\``)
		}
		if (rels.length > 0) query = query.replace(`[*..${path_length}]`,`[:${rels.join("|")}*..${path_length}]`)
	}
	const vars = {}
	if ((remove || []).length) {
		query = query + `
			WHERE NOT a.id in ${JSON.stringify(remove)}
			AND NOT b.id in ${JSON.stringify(remove)}
		`
	} 
	if (start === end) {
		if (query.includes('WHERE')) {
			query = query + `
				AND NOT b.label = $start_term
			`
		} else {
			query = query + `
				WHERE NOT b.label = $start_term
			`
		}
	}
	const q = query
	const gl = []
	query = query + `RETURN p, nodes(p) as n, relationships(p) as r LIMIT TOINTEGER($limit)`
	if (gene_links.length > 0 || additional_link_tags.length > 0) {
		query = `CALL {
			${query}
		}
			WITH p as q, n as n1, r as r1
		`
		for (const i of gene_links) {
			if (edges.indexOf(i) === -1) throw {message: `Invalid relationship ${i}`}
			gl.push(`\`${i}\``)
		}
		if (gl.length > 0) {
			query = query + `
				CALL {
					WITH q, n1, r1
					RETURN q as p, n1 as n, r1 as r
					UNION
					WITH q, n1, r1
					MATCH p=(c:Gene)-[r:${gl.join("|")}]-(d:Gene)
					WHERE c in n1 and d in n1
					${additional_link_tags.length > 0 ?
						`AND r.hidden_tag IN ${JSON.stringify(additional_link_tags)}`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r			
				}
				RETURN p, n, r `
		} else if (additional_link_tags.length > 0){
			const node_types = await  resolve_node_types({query: q, query_params: { start_term, limit, ...vars }})
			query = query + `
				CALL {
					WITH q, n1, r1
					MATCH p=(c:${node_types})-[r]-(d:${node_types})
					WHERE c in n1 and d in n1
					${additional_link_tags.length > 0 ?
						`AND r.hidden_tag IN ${JSON.stringify(additional_link_tags)}`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r			
					UNION
					WITH q, n1, r1
					RETURN q as p, n1 as n, r1 as r
					
				}
				RETURN p, n, r `
		}
		
	}
	// else {
	// 	query = query + `RETURN q as p, nodes(q) as n, relationships(q) as r LIMIT TOINTEGER($limit)`
	// }
	// remove has precedence on expand
	const expand = (e || []).filter(i=>(remove || []).indexOf(i) === -1)

	if ((expand || []).length) {
		for (const ind in expand) {
			vars[`expand_${ind}`] = expand[ind]
			query = query + `
				UNION
				MATCH p = (c)--(d)
				WHERE c.id = $expand_${ind}
				RETURN p, nodes(p) as n, relationships(p) as r
				LIMIT 10
			`   
		}
	}
	
	// if (score_fields.length) query = query + `, ${score_fields.join(", ")}`
	// query = `${query} RETURN * ORDER BY rand() LIMIT ${limit}`
    const query_params = { start_term, limit, ...vars }
	console.log(query)
	return resolve_results({query, query_params, terms: [start_term],  aggr_scores, colors, fields:[start_field]})
}


const resolve_one_term = async ({
    edges, 
    start, 
    field,
    term, 
    relation, 
    limit, 
    path_length=1, 
    aggr_scores, 
    colors, 
    expand: e, 
    remove, 
    gene_links,
	additional_link_tags, 
    augment, 
    augment_limit=10}: {
        edges: Array<string>,
        start: string,
        field: string,
        term: string,
        relation?: Array<{name?: string, limit?: number, end?: string}>,
        limit?: number,
        path_length?: number,
        aggr_scores?: {[key:string]: {max: number, min: number}},
        colors?: {[key: string]: {color?: string, field?: string, aggr_type?: string}},
        expand?: Array<string>,
        remove?: Array<string>,
        gene_links?: Array<string>,
		additional_link_tags?: Array<string>,
        augment?: Boolean,
        augment_limit?: number
    }) => {
	const rels = []
	const valid_relations = []
	const vars = {}
	if (relation) {
		for (const r of relation) {
			if (edges.indexOf(r.name) === -1) throw {message: `Invalid relationship ${r.name}`}
			else {
				valid_relations.push(`\`${r.name}\``)
				const color_order = colors[r.name]
				let q = `
					MATCH p=(st:\`${start}\` { ${field}: $term })-[r1:\`${r.name}\`*${path_length}]-(en${r.end? ": " + r.end :""})
					USING INDEX st:\`${start}\`(${field})
					WITH p, st
					
				`
				if (color_order.field) {
					q = q + `, REDUCE(acc = 0.0, r in r1 |
						CASE WHEN TYPE(r) = '${r.name}' THEN acc + r.${color_order.field} ELSE acc END) as ${color_order.field}
						ORDER BY  ${color_order.field} ${color_order.aggr_type}	
					`
				}
				q = q + `LIMIT ${r.limit || 5} `
				if ((remove || []).length) {
					q = q + `
						WHERE NOT st.id in ${JSON.stringify(remove)}
						AND NOT en.id in ${JSON.stringify(remove)}
					`
				}
				q = q + `RETURN p, nodes(p) as n, relationships(p) as r, st`
				rels.push(q)
			}
		}
	}
	let query = `MATCH p=(st:\`${start}\` { ${field}: $term })-[*${path_length}]-(en) USING INDEX st:\`${start}\`(${field})
		WHERE all(rel in relationships(p) WHERE rel.hidden IS NULL)
	`
	if ((remove || []).length) {
		query= query + `
			AND NOT st.id in ${JSON.stringify(remove)}
			AND NOT en.id in ${JSON.stringify(remove)}
		`
	}
	query = query + ` RETURN p, nodes(p) as n, relationships(p) as r, st  LIMIT TOINTEGER($limit)`
	
	if (rels.length > 0) {
		query = rels.join("\nUNION\n")
	}
	const gl = []
	if (gene_links.length > 0 || additional_link_tags.length > 0) {
		for (const i of gene_links) {
			if (edges.indexOf(i) === -1) throw {message: `Invalid relationship ${i}`}
			gl.push(`\`${i}\``)
		}
		query = `CALL {
			${query}
		}
			WITH p as q, st
		`
		if (gene_links.length === 0 && additional_link_tags.length > 0) {
			query = query + `CALL {
				WITH q, st
					MATCH p=(c:Gene)-[r]-(d:Gene)-[${valid_relations.length ? ":" + valid_relations.join("|"): ""}]-(st)
					WHERE r.hidden_tag IN ${JSON.stringify(additional_link_tags)}
					AND c in NODES(q)
					RETURN p, nodes(p) as n, relationships(p) as r
				UNION
				WITH q
					RETURN q as p, nodes(q) as n, relationships(q) as r
				UNION
				WITH q, st
					MATCH p=(st)-[r]->(d:Gene)
					WHERE r.hidden_tag IN ${JSON.stringify(additional_link_tags)}
					RETURN p, nodes(p) as n, relationships(p) as r				
			}
			RETURN p, n, r`

		} else if (gene_links.length > 0) {
			query = query + `CALL {
				WITH q, st
					MATCH p=(c:Gene)-[r:${gl.join("|")}]-(d:Gene)-[${valid_relations.length ? "r1:" + valid_relations.join("|"): "r1"}]-(st)
					WHERE c in NODES(q)
					${additional_link_tags.length > 0 ?
						`AND r.hidden_tag IN ${JSON.stringify(additional_link_tags)}
						AND r1.hidden_tag IN ${JSON.stringify(additional_link_tags)}
						`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r
				UNION
					WITH q
					RETURN q as p, nodes(q) as n, relationships(q) as r
				UNION
					WITH q, st
					MATCH p=(st)-[r:${gl.join("|")}]->(d:Gene)
					${additional_link_tags.length > 0 ?
						`WHERE r.hidden_tag IN ${JSON.stringify(additional_link_tags)}`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r				
			}
			RETURN p, n, r`
		}
			
	}
	// remove has precedence on expand
	const expand = (e || []).filter(i=>(remove || []).indexOf(i) === -1)
	if ((expand || []).length) {
		for (const ind in expand) {
			vars[`expand_${ind}`] = expand[ind]
			query = query + `
				UNION
				MATCH p = (c)--(d)
				WHERE c.id = $expand_${ind}
				RETURN p, nodes(p) as n, relationships(p) as r
				LIMIT 10
			`   
		}
	}
    const query_params = { term, limit, ...vars }
	// const results = await session.readTransaction(txc => txc.run(query, { term, limit, ...vars }))
	if (!augment) {
		console.log(query)
		return await resolve_results({query, query_params, terms: [term],  aggr_scores, colors, fields: [field]})
	} else {
		const initial_results = await resolve_results({query, query_params, terms: [term],  aggr_scores, colors, fields: [field]})
		const gene_list = []
		let gene_nodes = []
		let start_node
		for (const i of initial_results.nodes) {
			if (i.data[field] === term && i.data.kind === start) {
				start_node = i
			}
			if (i.data.kind === "Gene") {
				const gene = i.data.label
				if (gene_list.indexOf(gene) === -1) {
					gene_list.push(gene)
					gene_nodes.push(i)
				}
			}
		}
		const { augmented_genes } = await augment_gene_set({gene_list, augment_limit})
		let q
		if (gene_links.length > 0 || additional_link_tags.length > 0) {
			if (gene_links.length > 0){
				q = `
					MATCH p=(a: Gene)-[r:${gl.join("|")}]-(b: Gene)
					WHERE a.label IN ${JSON.stringify(augmented_genes)} AND b.label IN ${JSON.stringify(augmented_genes)}
					${additional_link_tags.length > 0 ?
						`AND r.hidden_tag IN ${JSON.stringify(additional_link_tags)}`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r
				`
			} else if (additional_link_tags.length > 0) {
				q = `
					MATCH p=(a: Gene)-[r]-(b: Gene)
					WHERE a.label IN ${JSON.stringify(augmented_genes)} AND b.label IN ${JSON.stringify(augmented_genes)}
					${additional_link_tags.length > 0 ?
						`AND r.hidden_tag IN ${JSON.stringify(additional_link_tags)}`:
						""
					}
					RETURN p, nodes(p) as n, relationships(p) as r
				`
			}
		} else {
			q = `
				MATCH p=(a: Gene)
				WHERE a.label IN ${JSON.stringify(augmented_genes)}
				RETURN p, nodes(p) as n, relationships(p) as r
			` 
		}	
		const augmented_results = await resolve_results({query: q, query_params: { term, limit, ...vars }, terms: [term],  aggr_scores, get_node_color_and_type: get_node_color_and_type_augmented, colors, fields: [field], kind_mapper, misc_props: {augmented_genes, augment, gene_list}})
		const augmented_edges = []
		for (const i of augmented_results.nodes) {
			if (i.data.kind !== "Relation") {
				augmented_edges.push({
					"data": {
					"source": start_node.data.id,
					"target": i.data.id,
					"kind": "Relation",
					"relation": "Augmented Co-expression Gene",
					"label": "Augmented Co-expression Gene",
					"properties": {
						"id": `${start_node.data.id}-${i.data.id}`,
						"label": "Augmented Co-expression Gene",
						"source_label": start_node.data.label,
						"target_label": i.data.label,
					},
					"lineColor": "#81c784",
					"directed": "none"
					}
				})
			}
		}
		return {
			nodes: [...initial_results.nodes, ...augmented_results.nodes],
			edges: [...initial_results.edges, ...augmented_edges]
		}
		// return [...initial_results, ...augmented_results, ...augmented_edges]

	}
}


const input_query_schema = z.object({
    start: z.string(),
    start_field: z.optional(z.string()),
    start_term: z.string(),
    end: z.optional(z.string()),
    end_field: z.optional(z.string()),
    end_term: z.optional(z.string()),
    limit: z.optional(z.number()),
    relation: z.optional(z.array(z.object({
        name: z.string(),
        limit: z.optional(z.number()),
        end: z.optional(z.string())
    }))),
    path_length: z.optional(z.number()),
    remove: z.optional(z.array(z.string())),
    expand: z.optional(z.array(z.string())),
    gene_links: z.optional(z.array(z.string())),
    augment: z.optional(z.boolean()),
    augment_limit: z.optional(z.number()),
	additional_link_tags: z.optional(z.array(z.string())),
})

/**
 * @swagger
 * /api/knowledge_graph:
 *   get:
 *     description: Performs single or two term search
 *     tags:
 *       - term search
 *     parameters:
 *       - name: filter
 *         in: query
 *         required: true
 *         content:
 *            application/json:
 *              schema: 			
 *                type: object
 *                required:
 *                  - start
 *                  - start_term
 *                properties:
 *                  start:
 *                    type: string
 *                  start_field:
 *                    type: string
 *                    default: label
 *                  start_term:
 *                    type: string
 *                  end:
 *                    type: string
 *                  end_field:
 *                    type: string
 *                  end_term:
 *                    type: string
 *                  relation:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        name:
 *                          type: string
 *                        limit:
 *                          type: integer
 *                          default: 5
 *                        end:
 *                          type: string
 *                  path_length:
 *                    type: integer
 *                    default: 1
 *                  remove:
 *                    type: array
 *                    items:
 *                      type: string
 *                  expand:
 *                    type: array
 *                    items:
 *                      type: string
 *                  gene_links:
 *                    type: array
 *                    items:
 *                      type: string
 *                  augment:
 *                    type: boolean
 *                    default: false
 *                  augment_limit:
 *                    type: integer
 *                    default: 5
 *     responses:
 *       200:
 *         description: Subnetwork
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       data:
 *                         type: object
 *                 edges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       data:
 *                         type: object
 */

export async function GET(req: NextRequest) {
    const schema = await fetch_kg_schema()
    try {
		const f = JSON.parse(req.nextUrl.searchParams.get("filter"))
		
        if (f.limit && !isNaN(f.limit) && typeof f.limit === 'string') f.limit = parseInt(f.limit)
        const { start,
                start_field="label",
                start_term,
                end,
                end_field="label",
                end_term,
                relation,
                limit=5,
                path_length,
                remove = [],
                expand = [],
                gene_links = [],
                augment,
                augment_limit,
				additional_link_tags = []
			 } = input_query_schema.parse(f)
        const {aggr_scores, colors, edges} = await initialize()
        const nodes = schema.nodes.map(i=>i.node)
        if (nodes.indexOf(start) < 0) return NextResponse.json({error: "Invalid start node"}, {status: 400})
        else if (end && nodes.indexOf(end) < 0) return NextResponse.json({error: "Invalid end node"}, {status: 400})
        else { 
            try {
                const session = neo4jDriver.session({
                    defaultAccessMode: neo4j.session.READ
                })
                try {
                    if (start && end && start_term && end_term) {
                        if(augment)  return NextResponse.json({error: "You can only augment on single search"}, {status: 400})
                        const results = await resolve_two_terms({edges, start, start_field, start_term, end, end_field, end_term, relation, limit, path_length, aggr_scores, colors, remove: remove ?  remove: [], expand: expand ? expand : [], gene_links, additional_link_tags})
                        fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/counter/update`)
                        return NextResponse.json(results, {status: 200})
                    } else if (start && end && start_term ) {
                        if(augment)  return NextResponse.json({error: "You can only augment on single search"}, {status: 400})
                        const results = await resolve_term_and_end_type({edges, start_term, start_field, start, end, relation, limit, path_length, aggr_scores, colors, remove, expand: expand, gene_links, additional_link_tags})
                        fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/counter/update`)
                        return NextResponse.json(results, {status: 200})
                    } else if (start) {
                        const results = await resolve_one_term({edges, start, field: start_field, term: start_term, relation, limit, path_length, aggr_scores, colors, remove, expand, gene_links, additional_link_tags, augment, augment_limit })
                        fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/counter/update`)
                        return NextResponse.json(results, {status: 200})
                    } else {
                        return NextResponse.json({error: "Invalid Input"}, {status: 400})
                    }
                } catch (e) {
                    console.log(e.message)
                    return NextResponse.json(e, {status: 400})
                } finally {
                    session.close()
                }
                } catch (e) {
                    return NextResponse.json(e, {status: 400})
                }
            }
        } catch (error) {
            return NextResponse.json(error, {status: 400})
        }
}
