
import { NetworkSchema } from '@/app/api/knowledge_graph/route'
import { EnrichmentParams } from '.'
export const get_element = async(parsedParams:EnrichmentParams)=>{
	let elements:NetworkSchema = null
	let shortId = ""
	let input_desc
	let min_p = 1
	let max_p = 0
	let min_z = 100
	let max_z = 0
	const {
		userListId,
		gene_limit,
		min_lib,
		gene_degree,
		term_degree,
		expand = [],
		remove = [],
		augment_limit,
		gene_links,
		libraries,
	} = parsedParams
	if (userListId !==undefined) {
		//const request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/share?userListId=${userListId}`)
		//if (request.ok) shortId = (await (request.json())).link_id
		//else console.log(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment/view?userListId=${userListId}`)
		console.log("Getting description...")
		const desc_request = await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment/view?userListId=${userListId}`)
		console.log((`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment/view?userListId=${userListId}`))
		if (desc_request.ok) input_desc = (await (desc_request.json())).desc
		console.log(input_desc)
		shortId = userListId
		console.log(`Enrichment ${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment${parsedParams.augment===true ? "/augment": ""}`)
		const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment${parsedParams.augment===true ? "/augment": ""}`,
			{
				method: "POST",
				body: JSON.stringify({
					userListId,
					libraries,
					min_lib,
					gene_limit,
					gene_degree,
					term_degree,
					expand,
					remove,
					augment_limit,
					gene_links,
				}),
			})
		console.log(res.ok)
		if (!res.ok) {
			console.log(`failed connecting to ${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX ? process.env.NEXT_PUBLIC_PREFIX: ""}/api/enrichment${parsedParams.augment===true ? "/augment": ""}`)
			console.log(await res.text())
		}
		else{
			console.log(`fetched`)
			elements = await res.json()
			
			for (const i of (elements || {}).edges) {
				if (typeof i.data.p_value == 'number' && min_p > i.data.p_value) min_p = i.data.p_value
				if (typeof i.data.p_value == 'number' && max_p < i.data.p_value) max_p = i.data.p_value
				if (typeof i.data.z_score == 'number' && min_z > i.data.z_score) min_z = i.data.z_score
				if (typeof i.data.z_score == 'number' && max_z < i.data.z_score) max_z = i.data.z_score
				
			}
		}
	}
	return {elements, min_z, max_z}
}