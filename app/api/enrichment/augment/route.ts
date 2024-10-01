import { resolve_results } from "../../knowledge_graph/helper";
import { enrichr_query } from "../helper";
import { kind_mapper, get_node_color_and_type_augmented as get_node_color_and_type } from "@/utils/helper";
import { NextResponse } from "next/server";
import { NextRequest } from 'next/server'
import { z } from 'zod';
import { augment_gene_set } from "./helper";
import { get_node_mapping } from "../node_mapping/helper";
import { fetch_kg_schema } from "@/utils/initialize";
import { initialize } from "../../initialize/helper";


const enrichr_query_wrapper = async ({
    libraries,
    userListId, 
    term_degree, 
    min_lib, 
    gene_degree, 
    node_mapping, 
    gene_limit, 
    augmented_genes
}: {
    libraries: Array<{library?: string, term_limit?: number}>,
    userListId: string,
    term_degree?: number,
    min_lib?: number,
    gene_degree?: number,
    gene_limit?: number,
    node_mapping: {[key:string]: string},
    augmented_genes?: Array<string>
}) => {
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
    }))
    const gene_counts = {}
    let terms = {}
    const library_terms = {}
    let max_pval = 0
    let min_pval = 1
    for (const {genes: lib_genes, terms: lib_terms, max_pval: lib_max_pval, min_pval: lib_min_pval, library} of results) {
        terms = {...terms, ...lib_terms}
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
        const new_genes = []
        let counter = 0
        for (const gene of genes.sort((a,b)=>gene_counts[b].count - gene_counts[a].count)) {
            if (counter === gene_limit) break
            if (augmented_genes.indexOf(gene) > -1) {
                new_genes.push(gene)
            }
            else {
                new_genes.push(gene)
                counter = counter + 1
            }
        }
        genes = new_genes
        // genes = genes.sort((a,b)=>gene_counts[b].count - gene_counts[a].count).slice(0,gene_limit + augmented_genes.length)
    } 
    return {genes, terms, max_pval, min_pval, nodes, library_terms}
}

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
    augment_limit=10,

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
    augment_limit?: number,
}) => {
    try {
        const node_mapping = await get_node_mapping()
        
        const {genes, terms, max_pval, min_pval, nodes, library_terms} = await enrichr_query_wrapper(({libraries, userListId, term_degree, min_lib, gene_degree, node_mapping, gene_limit}))
        const { augmented_genes } = await augment_gene_set({gene_list: Object.values(genes), augment_limit})
        // const { userListId } = await add_list({
        //     genes: [...gene_list, ...augmented_genes],
        //     description: `${description} (Augmented)`
        // })
        // const {genes, terms, max_pval, min_pval, nodes, library_terms} = await enrichr_query_wrapper(({libraries, userListId, term_degree, min_lib, gene_degree, node_mapping, gene_limit, augmented_genes, gene_list}))
        
        const schema = await fetch_kg_schema()
        const {aggr_scores, colors} = await initialize()
        aggr_scores["pval"] = {max: max_pval, min: min_pval}
        const query_list = []
        const vars = {}
        for (const [node, lib_terms] of Object.entries(library_terms)) {
            let query_part = `
                MATCH p = (${node})--(b:Gene) 
                WHERE a.label IN ${JSON.stringify(lib_terms)} 
                AND b.label IN ${JSON.stringify([...genes, ...augmented_genes])}
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
            if (gene_links && gene_links.length > 0) {
                const geneLinksRelations = schema.edges.reduce((acc, i)=>{
                    if (i.hidden) return [...acc, ...i.match]
                    else return acc
                }, [])
                for (const i of geneLinksRelations) {
                    if (geneLinksRelations.indexOf(i) === -1) throw Error("Invalid gene link")
                }
                let query_part = `
                    MATCH p = (${node})--(b:Gene)-[r]-(c:Gene)--(${node})
                    WHERE a.label IN ${JSON.stringify(lib_terms)}
                    AND b.label IN ${JSON.stringify([...genes, ...augmented_genes])} 
                    AND c.label IN ${JSON.stringify([...genes, ...augmented_genes])}
                    AND r.relation IN ${JSON.stringify(gene_links)}
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
        
        return resolve_results({query, query_params,  aggr_scores, colors, properties: terms, get_node_color_and_type, kind_mapper, misc_props: {
            augmented_genes,
            gene_list: Object.values(genes),
        }})
    } catch (error) {
        console.error(error)
        throw(error)
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
        const {userListId, libraries=[], gene_limit, term_degree, min_lib, gene_degree, remove, expand, gene_links, expand_limit, augment_limit} = EnrichmentInput.parse(await req.json())
        if (userListId === undefined) {
            return NextResponse.json({error: "userListId is undefined"}, {status: 400})
        }
        if (libraries.length === 0) {
            return NextResponse.json({error: "library is empty"}, {status: 400})
        }
        const results = await enrichment({userListId, libraries, gene_limit, term_degree, min_lib, gene_degree, remove, expand, gene_links, expand_limit, augment_limit})
        return NextResponse.json(results, {status: 200})
    } catch (error) {
        console.error(error)
        return NextResponse.json(error, {status: 500})
    }
}