import fetch from "node-fetch";
import neo4j from "neo4j-driver"
import { neo4jDriver } from "../../../utils/neo4j"

const enrichment = async ({genes, description, library}) => {
    const formData = new FormData();
    formData.append('list', (null, genes.join("\n")))
    formData.append('description', (null, description))
    console.log(`${process.env.NEXT_ENRICHR_URL}/addList`)
    const {shortId, userListId} = await (
        await fetch(`${process.env.NEXT_ENRICHR_URL}/addList`, {
            method: 'POST',
            body: formData
        })
    ).json()

    const results = await (
        await fetch(`${process.env.NEXT_ENRICHR_URL}/enrich?userListId=${userListId}&backgroundType=${library}`)
    ).json()
    const gene_counts = {}
    const links = {}
    const nodes = []
    for (const i of results[library].slice(0,5)) {
        const label = i[1]
        const pval = i[2]
        const genes = i[5]
        nodes.push({
            label,
            pval
        })
        for (const gene of genes) {
            nodes.push({
                label: gene
            })
            if (gene_counts[gene]) {
                gene_counts[gene] = gene_counts[gene] + 1
                links[gene].push({
                    label,
                    gene,
                })
            } 
            else {
                gene_counts[gene] = 1
                links[gene] = [{
                    label,
                    gene,
                }]
            }
        }
    }
    const edges = []
    for (const [gene,] of Object.entries(gene_counts).sort((a,b) => b[1]-a[1]).slice(0,10)) {
        edges.push(links[gene])
    }
    
    return {url: `https://maayanlab.cloud/Enrichr/enrich?dataset=${shortId}`, nodes, edges}
}

export default async function query(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).send({ message: 'Only POST requests allowed' })
            return
        } else {
            const results = await enrichment(req.body)
            res.status(200).send(results)
        }
    } catch (error) {
        res.status(500).send(error)
    }
}