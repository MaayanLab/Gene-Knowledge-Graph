export const augment_gene_set = async ({gene_list, augment_limit}: {
    gene_list: Array<string>,
    augment_limit: number
}) => {
    const request = await fetch(`${process.env.NEXT_PUBLIC_GENESHOT_URL}/api/associate`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            gene_list,
            similarity: "coexpression",
            limit: augment_limit
        }),
    })
    if (!request.ok) {
        throw new Error("Error communicating with GeneShot API")
    } 
    const result = await request.json()
    
    const augmented_genes = (result["association"] !== undefined) ? Object.keys(result["association"]): []
    return {
        augmented_genes
    }
}