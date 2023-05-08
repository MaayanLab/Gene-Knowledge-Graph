import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../../utils/neo4j"
import { default_get_node_color_and_type } from "../index";
import fetch, { FormData } from "node-fetch";

import {resolve_results} from '../index'
import { enrichr_query, compute_colors } from ".";

export const get_node_color_and_type = ({node, terms, color, aggr_scores, field, aggr_field, fields, augmented_genes, gene_list, ...rest }) => {
    if (node.properties.pval === undefined) {
        if (augmented_genes.indexOf(node.properties.label) > -1 && gene_list.indexOf(node.properties.label) === -1) {
            const props = default_get_node_color_and_type(({node, terms, color, aggr_scores, field, aggr_field, fields}))
            props.borderColor = "#ff80ab",
            props.borderWidth = 7
            return props
        } else {
            return default_get_node_color_and_type(({node, terms, color, aggr_scores, field, aggr_field, fields}))
        }
    }
    else {
        const props = compute_colors({properties: node.properties, aggr_scores, color}) 
        for (const i in node.properties.enrichment || []) {
            const v = node.properties.enrichment[i]
            node.properties.enrichment[i] = { ...v, ...compute_colors({properties: v, aggr_scores, color}) }
        }
        return props
    }	
}

const resolve_genes = async ({userListId}) => {
    let counter = 0
    while (counter < 5) {
        const request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/view?userListId=${userListId}`)
        if (! request.ok && counter === 4) {
            setError({message: "Error resolving genes. Try again in a while.", type: "fail"})
        }
        else if (! request.ok && counter < 4) {
            setError({message: `Error resolving genes. Trying again in ${counter + 5} seconds...`, type: "retry"})
            await delay((counter + 5)*1000)
        } 
        else {
            const {genes, description} = await request.json()
            return {
                genes,
                description
            }
        }
        counter = counter + 1
    }
}

export const augment_gene_set = async ({gene_list, augment_limit}) => {
    const request = await fetch(`${process.env.NEXT_PUBLIC_GENESHOT_URL}/api/associate`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            gene_list,
            similarity: "coexpression",
            limit: parseInt(augment_limit)
        }),
    })
    if (!request.ok) {
        throw new Error("Error communicating with GeneShot API")
    } 
    const result = await request.json()
    const augmented_genes = Object.keys(result.association)
    return {
        augmented_genes
    }
}

const add_list = async ({genes, description}) => {
    try {
        const formData = new FormData();
        const gene_list = genes.join("\n")
        formData.append('list', (null, gene_list))
        formData.append('description', (null, description))
        const {shortId, userListId} = await (
            await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/addList`, {
                method: 'POST',
                body: formData
            })
        ).json()
        return ({userListId, shortId})
    } catch (error) {
        console.error(error)
    }
}

export const kind_mapper = ({node, type, augmented_genes, gene_list}) => {
    if (type !== "Gene") return type
    const label = node.properties.label
    if (augmented_genes.indexOf(label) > -1 && gene_list.indexOf(label) == -1) {
        return "Predicted Gene (Co-Expression)"
    } else return "Gene"
    
}

const enrichr_query_wrapper = async ({libraries,  userListId, term_degree, min_lib, gene_degree, node_mapping, gene_limit, augmented_genes, gene_list}) => {
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
    session,
    remove: r,
    expand:e,
    expand_limit=10,
    augment_limit=10,
    res,
    gene_links,
}) => {
    try {
        const nod = await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/enrichment/node_mapping`)
        if (nod.ok !== true) {
            throw new Error(`Error fetching node_map`)
        }
        const node_mapping = await nod.json()
        // const {genes: gene_list, description} = await resolve_genes({userListId: inputUserListId})
        const {genes, terms, max_pval, min_pval, nodes, library_terms} = await enrichr_query_wrapper(({libraries, userListId, term_degree, min_lib, gene_degree, node_mapping, gene_limit}))
        const { augmented_genes } = await augment_gene_set({gene_list: Object.values(genes), augment_limit})
        // const { userListId } = await add_list({
        //     genes: [...gene_list, ...augmented_genes],
        //     description: `${description} (Augmented)`
        // })
        // const {genes, terms, max_pval, min_pval, nodes, library_terms} = await enrichr_query_wrapper(({libraries, userListId, term_degree, min_lib, gene_degree, node_mapping, gene_limit, augmented_genes, gene_list}))
        
        const schema = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/schema`)).json()
        const {aggr_scores, colors} = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/aggregate`)).json()
        aggr_scores.max_pval = max_pval
        aggr_scores.min_pval = min_pval
        const query_list = []
        const vars = {}
        const remove = (JSON.parse(r || "[]"))
        for (const [node, lib_terms] of Object.entries(library_terms)) {
            let query_part = `
                MATCH p = (${node})--(b:Gene) 
                WHERE a.label IN ${JSON.stringify(lib_terms)} 
                AND b.label IN ${JSON.stringify([...genes, ...augmented_genes])}
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
            if (gene_links && gene_links.length > 0) {
                const geneLinksRelations = schema.edges.reduce((acc, i)=>{
                    if (i.gene_link) return [...acc, ...i.match]
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
        }
        if (gene_links && gene_links.length > 0) {
            const geneLinksRelations = schema.edges.reduce((acc, i)=>{
                if (i.gene_link) return [...acc, ...i.match]
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
        const expand = (JSON.parse(e || "[]")).filter(i=>(remove || []).indexOf(i) === -1)
        if ((expand || []).length) {
            for (const ind in expand) {
                vars[`expand_${ind}`] = expand[ind]
                query_list.push( `MATCH p = (c)--(d)
                    WHERE c.id = $expand_${ind}
                    RETURN p, nodes(p) as n, relationships(p) as r
                    LIMIT 10
                `)   
            }
        }
        const query = query_list.join(' UNION ')
        const rs = await session.readTransaction(txc => txc.run(query, {limit: expand_limit, ...vars}))
        fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter/update`)
        return resolve_results({results: rs, schema,  aggr_scores, colors, properties: terms, get_node_color_and_type, kind_mapper, misc_props: {
            augmented_genes,
            gene_list: Object.values(genes),
        }})
    } catch (error) {
        console.error(error)
        throw(error)
    }
}

export default async function query(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).send({ message: 'Only POST requests allowed' })
            return
        } else {
            const session = neo4jDriver.session({
                defaultAccessMode: neo4j.session.READ
            })
            const body = typeof req.body === "string" ? JSON.parse(req.body): req.body
            if (body.userListId === undefined) {
                res.status(400).send("userListId is undefined")
            }
            const results = await enrichment({session, ...body, res})
            res.status(200).send(results)
            
        }
    } catch (error) {
        res.status(500).send(error)
    }
}