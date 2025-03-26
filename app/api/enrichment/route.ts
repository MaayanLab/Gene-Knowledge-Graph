import { resolve_results, default_get_node_color_and_type } from "../knowledge_graph/helper";
import { compute_colors } from "@/utils/helper";
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server'
import { z } from 'zod';
import { enrichr_query } from "./helper";
import { fetch_kg_schema } from "@/utils/initialize";
import { initialize } from "../initialize/helper";
const get_node_color_and_type = ({node,
    terms,
    color,
    aggr_scores,
    field,
    aggr_field,
    fields
}: {
    node: {[key:string]: any},
    terms?: Array<string>,
    color?: string,
    aggr_scores?: {[key:string]: {max: number, min: number}},
    field?: string,
    aggr_field?: string,
    aggr_type?: string,
    fields?: Array<string>,
}) => {
    if (node.pval === undefined) return default_get_node_color_and_type(({node, terms, color, aggr_scores, field, aggr_field, fields}))
    else {
        const props = compute_colors({properties: node, aggr_scores: aggr_scores.pval, color}) 
        for (const i in node.enrichment || []) {
            const v = node.enrichment[i]
            node.enrichment[i] = { ...v, ...compute_colors({properties: v, aggr_scores: aggr_scores.pval, color}) }
        }
        return props
    }	
}


/**
 * @swagger
 * /api/knowledge_graph:
 *   post:
 *     description: Performs enrichment analysis
 *     tags:
 *       - enrichment analysis
 *     parameters:
 *       - name: userListId
 *         type: string
 *         required: true
 *       - name: libraries
 *         required: true
 *         content:
 *            application/json:
 *              schema: 			
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                      library:
 *                         type: string
 *                      term_limit:
 *                         type: number
 *       - name: gene_limit
 *         type: number
 *       - name: term_degree
 *         type: number
 *       - name: min_lib
 *         type: number
 *       - name: gene_degree
 *         type: number
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

// gene_limit: limits top genes
// min_lib: Filters for genes that appear on multiple libraries
const enrichment = async ({
    userListId,
    libraries,
    gene_limit,
    term_degree,
    min_lib,
    gene_degree,
    remove=[],
    expand=[],
    gene_links,
    expand_limit=10,
}: {
    userListId: string,
    libraries: Array<{library?: string, term_limit?: number}>,
    gene_limit?: number,
    term_degree?: number,
    min_lib?: number,
    gene_degree?: number,
    remove?: Array<string>,
    expand?: Array<string>,
    gene_links?: Array<string>,
    expand_limit?: number,
}) => {
    try {
        const nod = await fetch(`${process.env.NODE_ENV==="development" ? process.env.NEXT_PUBLIC_HOST_DEV : process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ''}/api/enrichment/node_mapping`)
        if (nod.ok !== true) {
            throw new Error(`Error fetching node_map`)
        }
        const node_mapping = await nod.json()
        const nodes = []
        const node_library = {}
        const results = await Promise.all(libraries.map(async ({library, term_limit})=> {
            if (node_mapping[library]) {
                const node = `a:\`${node_mapping[library]}\``
                if (nodes.indexOf(node) === -1) {
                    nodes.push(node)
                    node_library[library] = node
                }
            }
            return await enrichr_query({userListId, term_limit, library, term_degree})
        }
            
        ))
        const gene_counts = {}
        let terms = {}
        const library_terms = {}
        let max_pval = 0
        let min_pval = 1
        for (const {genes: lib_genes, terms: lib_terms, max_pval: lib_max_pval, min_pval: lib_min_pval, library} of results) {
            terms[node_mapping[library]] = lib_terms
            library_terms[node_library[library]] = Object.keys(lib_terms)
            if (max_pval < lib_max_pval) max_pval = lib_max_pval
            if (min_pval > lib_min_pval) min_pval = lib_min_pval
            for (const gene in lib_genes) {
                if (gene_counts[gene] === undefined) {
                    gene_counts[gene] = {
                        libraries: 1,
                        count: lib_genes[gene]
                    }
                } else {
                    gene_counts[gene].libraries = gene_counts[gene].libraries + 1
                    gene_counts[gene].count = gene_counts[gene].count + lib_genes[gene]
                }
            }
        }
        let genes = Object.keys(gene_counts)
        if (min_lib) {
            genes = Object.keys(gene_counts).filter(gene=>gene_counts[gene].libraries >= min_lib)
        } 
        if (gene_degree) {
            genes = genes.filter(gene=>gene_counts[gene].count >= gene_degree)
        }
        if (gene_limit) {
            genes = genes.sort((a,b)=>gene_counts[b].count - gene_counts[a].count).slice(0,gene_limit)
        } 
        const schema = await fetch_kg_schema()
        const {aggr_scores, colors} = await initialize()
        aggr_scores["pval"] = {max: max_pval, min: min_pval}
        const query_list = []
        const vars = {}
        for (const [node, lib_terms] of Object.entries(library_terms)) {
            let query_part = `
                MATCH p = (${node})--(b:Gene) 
                WHERE a.label IN ${JSON.stringify(lib_terms)} 
                AND b.label IN ${JSON.stringify(genes)}
            `
            for (const ind in remove) {
                vars[`remove_${ind}`] = remove[ind]
                query_part = query_part + `
                    AND NOT a.id = $remove_${ind}
                    AND NOT b.id = $remove_${ind}
                `
            }
            query_part = query_part + `RETURN p, nodes(p) as n, relationships(p) as r`
            query_list.push(query_part)   
        }
        if (gene_links && gene_links.length > 0) {
            const geneLinksRelations = schema.edges.reduce((acc, i)=>{
                if (i.hidden) return [...acc, ...i.match]
                else return acc
            }, [])
            for (const i of geneLinksRelations) {
                if (geneLinksRelations.indexOf(i) === -1) throw Error("Invalid gene link")
            }
            let query_part = `
                MATCH p = (a:Gene)-[r]-(b:Gene) 
                WHERE a.label IN ${JSON.stringify(genes)} 
                AND b.label IN ${JSON.stringify(genes)}
                AND r.relation IN ${JSON.stringify(gene_links)}
            `
            if ((remove || []).length) {
                for (const ind in remove) {
                    vars[`remove_${ind}`] = remove[ind]
                    query_part = query_part + `
                        AND NOT a.id = $remove_${ind}
                        AND NOT b.id = $remove_${ind}
                    `
                }
                 
            }
            query_part = query_part + `RETURN p, nodes(p) as n, relationships(p) as r`
            query_list.push(query_part)  
        }
        // remove has precedence on expand
        // TODO: ensure that expand is checked
        
        for (const ind in expand) {
            vars[`expand_${ind}`] = expand[ind]
            query_list.push( `MATCH p = (c)--(d)
                WHERE c.id = $expand_${ind}
                RETURN p, nodes(p) as n, relationships(p) as r
                LIMIT 10
            `)   
        }
        const query = query_list.join(' UNION ')
        const query_params = {limit: expand_limit, ...vars}
        return resolve_results({query, query_params, aggr_scores, colors, kind_properties: terms, get_node_color_and_type})
    } catch (error) {
        throw error
    }
}

const EnrichmentInput = z.object({
    userListId: z.string(),
    libraries: z.array(z.object({library: z.string(), term_limit: z.number()})),
    gene_limit: z.number().optional(),
    term_degree: z.number().optional(),
    min_lib: z.number().optional(),
    gene_degree: z.number().optional(),
    remove: z.array(z.string()).optional(),
    expand: z.array(z.string()).optional(),
    gene_links: z.array(z.string()).optional(),
    expand_limit: z.number().optional(),
    augment_limit: z.number().optional()
})



export async function POST(req: NextRequest) {
    try {
        const {userListId, libraries=[], gene_limit, term_degree, min_lib, gene_degree, remove, expand, gene_links, expand_limit} = EnrichmentInput.parse(await req.json())
        if (userListId === undefined) {
            return NextResponse.json({error: "userListId is undefined"}, {status: 400})
        }
        if (libraries.length === 0) {
            return NextResponse.json({error: "library is empty"}, {status: 400})
        }
        const results = await enrichment({userListId, libraries, gene_limit, term_degree, min_lib, gene_degree, remove, expand, gene_links, expand_limit})
        return NextResponse.json(results, {status: 200})
    } catch (error) {
        console.error(error)
        return NextResponse.json(error, {status: 500})
    }
}