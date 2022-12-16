import fetch from "node-fetch";
import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../../utils/neo4j"
import { default_get_node_color_and_type } from "../index";
import Color from 'color'
import { mui_colors } from "../../../../utils/colors";

import {resolve_results} from '../index'

const color_map = {}

const get_color = ({color, darken}) => {
	if (!color_map[color]) color_map[color] = Color(color)

	if (darken) return color_map[color].darken(darken*0.5).hex()
	else return color_map[color].hex()
}

const get_node_color_and_type = ({node, terms, color, aggr_scores, field, aggr_field, fields}) => {
    if (node.properties.pval === undefined) return default_get_node_color_and_type(({node, terms, color, aggr_scores, field, aggr_field, fields}))
    else {
        if (node.properties.pval > 0.05) return {node_type: 0, color: "#bdbdbd"}
        else {
            const max_pval = aggr_scores.max_pval //aggr_scores.max_pval > 0.05 ? aggr_scores.max_pval: 0.05
            const min_pval = aggr_scores.min_pval
            const darken =  Math.abs((node.properties.pval - min_pval)/(max_pval-min_pval))
            return {
                color: get_color({color, darken}),
                node_type: 0
            }
        }
    }	
}

const enrichr_query = async ({userListId, library, term_limit, term_degree}) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/enrich?userListId=${userListId}&backgroundType=${library}`)
    if (res.ok !== true) {
        throw new Error(`Error communicating with Enrichr`)
    }
    const regex = {}
    const reg = await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/enrichment/getRegex`)
    if (reg.ok !== true) {
        throw new Error(`Error fetching Regex`)
    }
    for (const [k,v] of Object.entries(await reg.json())) {
        regex[k] = new RegExp(v)
    }
    const results = await res.json()
        
    const genes = {}
    const terms = {}
    let max_pval = 0
    let min_pval = 1
    for (const i of results[library].slice(0,term_limit)) {
        const label = regex[library] !== undefined ? regex[library].exec(i[1]).groups.label:i[1]
        const pval = i[2]
        const zscore = i[3]
        const combined_score = i[4]
        const overlapping_genes = i[5]
        const qval = i[6]
        if (term_degree===undefined || overlapping_genes.length >= term_degree) {
            if (terms[label] === undefined){
                if (pval > max_pval) max_pval = pval
                if (pval < min_pval) min_pval = pval
                terms[label] ={
                    pval,
                    zscore,
                    combined_score,
                    qval,
                    logpval: -Math.log(pval),
                    overlap: overlapping_genes.length,
                }
            }
            for (const gene of overlapping_genes) {
                genes[gene] = (genes[gene] || 0) + 1
            }
        }
    }
    return {genes, terms, max_pval, min_pval}
}

// gene_limit: limits top genes
// min_lib: Filters for genes that appear on multiple libraries
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
    res
}) => {
    try {
        const results = await Promise.all(libraries.map(async ({library, term_limit})=>
            await enrichr_query({userListId, term_limit, library, term_degree})
        ))
        const gene_counts = {}
        let terms = {}
        let max_pval = 0
        let min_pval = 1
        for (const {genes: lib_genes, terms: lib_terms, max_pval: lib_max_pval, min_pval: lib_min_pval} of results) {
            terms = {...terms, ...lib_terms}
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
        const schema = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/schema`)).json()
        const {aggr_scores, colors} = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/aggregate`)).json()
        aggr_scores.max_pval = max_pval
        aggr_scores.min_pval = min_pval
        let query = `
            MATCH p = (a)--(b) 
            WHERE a.label IN ${JSON.stringify(Object.keys(terms))} 
            AND b.label IN ${JSON.stringify(genes)}
        `
        const vars = {}
        const remove = (JSON.parse(r || "[]"))
        if ((remove || []).length) {
            for (const ind in remove) {
                vars[`remove_${ind}`] = remove[ind]
                query = query + `
                AND NOT a.id = $remove_${ind}
                AND NOT b.id = $remove_${ind}
            `
            }
            
        }
        query = query + `RETURN p, nodes(p) as n, relationships(p) as r`

        // remove has precedence on expand
        // TODO: ensure that expand is checked
        const expand = (JSON.parse(e || "[]")).filter(i=>(remove || []).indexOf(i) === -1)
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
        const rs = await session.readTransaction(txc => txc.run(query, {limit: expand_limit, ...vars}))
        fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/counter/update`)
        return resolve_results({results: rs, schema,  aggr_scores, colors, properties: terms, get_node_color_and_type})
    } catch (error) {
        console.log(error)
        res.status(500).send({message: error.message})
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
            const results = await enrichment({session, ...body, res})
            res.status(200).send(results)
            
        }
    } catch (error) {
        res.status(500).send(error)
    }
}