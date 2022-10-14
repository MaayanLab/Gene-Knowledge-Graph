import fetch from "node-fetch";
import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../../utils/neo4j"

import {resolve_results} from '../index'

const enrichr_query = async ({userListId, library, term_limit}) => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/enrich?userListId=${userListId}&backgroundType=${library}`)
        const results = await res.json()
        const genes = {}
        const terms = {}
        for (const i of results[library].slice(0,term_limit)) {
            const label = i[1]
            const pval = i[2]
            const zscore = i[3]
            const combined_score = i[4]
            const overlapping_genes = i[5]
            const qval = i[6]
            if (terms[label] === undefined){
                terms[label] ={
                    pval,
                    zscore,
                    combined_score,
                    qval
                }
            }
            for (const gene of overlapping_genes) {
                genes[gene] = (genes[gene] || 0) + 1
            }
        }
        return {genes, terms}
    } catch (error) {
        console.log(error)
    }
}

// gene_limit: limits top genes
// min_lib: Filters for genes that appear on multiple libraries
const enrichment = async ({userListId, libraries, gene_limit, min_lib, gene_degree, session, res}) => {
    try {
        const results = await Promise.all(libraries.map(async ({library, term_limit})=>
            await enrichr_query({userListId, term_limit, library})
        ))
        const gene_counts = {}
        let terms = {}
        for (const {genes: lib_genes, terms: lib_terms} of results) {
            terms = {...terms, ...lib_terms}
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
            console.log(genes)
        } 
        const schema = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/schema`)).json()
        const {aggr_scores, colors} = await (await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/aggregate`)).json()
        const query = `
            MATCH p = (a)--(b) 
            WHERE a.label IN ${JSON.stringify(Object.keys(terms))} 
            AND b.label IN ${JSON.stringify(genes)}
            RETURN p, nodes(p) as n, relationships(p) as r
        `
        const rs = await session.readTransaction(txc => txc.run(query))
        return resolve_results({results: rs, schema,  aggr_scores, colors, properties: terms})
    } catch (error) {
        console.log(error)
        res.status(500).send({message: 'Error communicating with Enrichr'})
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