import { get_regex } from "./get_regex/helper"
export const enrichr_query = async ({
    userListId,
    library,
    term_limit,
    term_degree
}: {
    userListId: string,
    library: string,
    term_limit: number,
    term_degree?: number
}) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/enrich?userListId=${userListId}&backgroundType=${library}`)
    if (res.ok !== true) {
        console.log(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/enrich?userListId=${userListId}&backgroundType=${library}`)
        throw new Error(`Error communicating with Enrichr`)
    }
    const regex = {}
    const reg:{[key:string]: string} = await get_regex()
    for (const [k,v] of Object.entries(reg)) {
        regex[k] = new RegExp(v)
    }
    const results = await res.json()

    const terms = {}
    const genes = {}
    let max_pval = 0
    let min_pval = 1
    for (const i of results[library].slice(0,term_limit)) {
        const enrichr_label = i[1]
        const label = regex[library] !== undefined ? regex[library].exec(enrichr_label).groups.label:enrichr_label
        const direction = regex[library] !== undefined ? regex[library].exec(enrichr_label).groups.direction:undefined
        const pval = i[2]
        const zscore = i[3]
        const combined_score = i[4]
        const overlapping_genes = i[5]
        const qval = i[6]
        if (term_degree===undefined || overlapping_genes.length >= term_degree) {
            if (terms[label] === undefined) terms[label] = {library, label}
            if (pval > max_pval) max_pval = pval
            if (pval < min_pval) min_pval = pval

            // if there is no existing term just put it on top
            if (terms[label].pval === undefined) {
                terms[label].enrichr_label = enrichr_label
                terms[label].pval = pval
                terms[label].zscore = zscore
                terms[label].combined_score = combined_score
                terms[label].qval = qval
                terms[label].logpval = -Math.log(pval)
                terms[label].overlap = overlapping_genes.length
                terms[label].overlapping_set = overlapping_genes
            } else {
                // if it appeared before (e.g. drug up, drug down) then use the one with lower pvalue 
                // as default and push alternative enrichment to enrichment
                if (terms[label].enrichment === undefined) {
                    const {library, label: l, ...rest} = terms[label]
                    terms[label].enrichment = [rest]
                }
                terms[label].enrichment.push({
                    enrichr_label,
                    pval,
                    zscore,
                    combined_score,
                    qval,
                    logpval: -Math.log(pval),
                    overlap: overlapping_genes.length,
                    overlapping_set: overlapping_genes
                })
                if (terms[label].pval > pval) {
                    terms[label].enrichr_label = enrichr_label
                    terms[label].pval = pval
                    terms[label].zscore = zscore
                    terms[label].combined_score = combined_score
                    terms[label].qval = qval
                    terms[label].logpval = -Math.log(pval)
                    terms[label].overlap = overlapping_genes.length
                    terms[label].overlapping_set = overlapping_genes

                }
            }
            for (const gene of overlapping_genes) {
                genes[gene] = (genes[gene] || 0) + 1
            }
        }
    }
    return {genes, terms, max_pval, min_pval, library}
}