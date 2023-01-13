import fetch from "node-fetch";

export default async function query(req, res) {
    try {
        if (req.method !== 'POST') {
            res.status(405).send({ message: 'Only POST requests allowed' })
            return
        } else {
            const formData = new FormData();
            const body = typeof req.body === "string" ? JSON.parse(req.body): req.body
            const {genes, description=""} = body
            const gene_list = genes.join("\n")
            formData.append('list', (null, gene_list))
            formData.append('description', (null, description))
            const {shortId, userListId} = await (
                await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/addList`, {
                    method: 'POST',
                    body: formData
                })
            ).json()
            
            res.status(200).send({shortId, userListId})
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}