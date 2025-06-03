'use client'
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { CircularProgress, Box } from "@mui/material";
import { router_push } from "@/utils/client_side";

export default function QueryTranslator ({children}: {children: React.ReactNode}) {
	const [loading, setLoading] = useState(true)
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()
	useEffect(()=>{
		const queryParams: {
			libraries?: string,
			userListId?: string,
			term_limit?: string,
			gene_limit?: string,
			min_lib?: string,
			gene_degree?: string,
			term_degree?: string,
			augment?: string,
			augment_limit?: string,
			gene_links?: string,
			search?: string,
			expand?: string,
			remove?: string,
			start?: string,
			start_field?: string,
			start_term?: string,
			end?: string,
			end_field?: string,
			end_term?: string,
			relation?: string,
			limit?: string,
		} = {}
		searchParams.forEach((value, key) => {
			queryParams[key] = value;
		});
		if (queryParams.libraries !== undefined) {
			const {
				libraries,
				userListId,
				term_limit,
				gene_limit,
				min_lib,
				gene_degree,
				term_degree,
				augment,
				augment_limit,
				gene_links,
				search,
				expand,
				remove,
				...rest
			} = queryParams
			const params = {
				libraries: libraries ? JSON.parse(libraries).map(i=>({library: i["library"] || i["name"], term_limit: i["term_limit"] || i["limit"] || 5})): undefined,
				userListId,
				term_limit: term_limit ? parseInt(term_limit): undefined,
				gene_limit: gene_limit? parseInt(gene_limit): undefined,
				min_lib: min_lib? parseInt(min_lib): undefined,
				gene_degree: gene_degree? parseInt(gene_degree): undefined,
				term_degree: term_degree? parseInt(term_degree): undefined,
				augment: augment!==undefined,
				augment_limit: augment_limit ? parseInt(augment_limit): undefined,
				gene_links: gene_links ? JSON.parse(gene_links): undefined,
				search: search!==undefined,
				expand: expand ? JSON.parse(expand): undefined,
				remove: remove ? JSON.parse(remove): undefined,
			}
			const q = {}
			for (const [k,v] of Object.entries(params)) {
				if (v !== undefined) q[k] = v
			}
			const query = {
				q: JSON.stringify(q),
				...rest,
				u: true
			}
			console.log(query, pathname)
			router_push(router, pathname, query)
			router.refresh()
			setLoading(false)

		} else if (queryParams.start !== undefined) {
			const {
				start,
				start_field,
				start_term,
				end,
				end_field,
				end_term,
				relation,
				limit,
				augment,
				augment_limit,
				gene_links,
				search,
				expand,
				remove,
				...rest
			} = queryParams
			const params = {
				start,
				start_field,
				start_term,
				end,
				end_field,
				end_term,
				relation: relation? relation.split(",").map(name=>({name})): undefined,
				limit: limit? parseInt(limit): undefined,
				augment,
				augment_limit,
				gene_links,
				search,
				expand,
				remove,
			}
			const filter = {}
			for (const [k,v] of Object.entries(params)) {
				if (v !== undefined) filter[k] = v
			}
			const query = {
				filter: JSON.stringify(filter),
				...rest,
			}
			router_push(router, pathname, query)
			setLoading(false)
		} else {
			setLoading(false)
		}
	}, [searchParams])
	if (loading) {
		return (
			<Box sx={{height: '90vh'}}>
				<CircularProgress />
			</Box>
		)
	} else {
		return <>{children}</>
	}
}