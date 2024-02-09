import Link from "next/link"
import { Grid } from '@mui/material'
import { typed_fetch } from "@/utils/helper"
import { UISchema } from "../../api/schema/route"
import { Component } from "../../component_selector"
export default async function Page({params, searchParams}: {
    searchParams: {
      filter?: string,
      fullscreen?: 'true',
      view?:string,
  	} | {
        term: string,
        field?: string,
        limit?: string,
        fullscreen?:'true',
        view?:string
    },
	params: {
		page: string,
		subpage: string
	}
}) {
  const schema = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
  const root_tab = {component: '', props: {}}
  const page = params.page
  const subpage = params.subpage
  for (const tab of schema.header.tabs) {
    if (tab.endpoint === `/${page}`) {
		if (tab.props.pages) {
			for (const p of tab.props.pages) {
				if (p.endpoint === `/${page}/${subpage}`) {
					root_tab.component = p.component
      				root_tab.props = p.props
				}
			}
		}
    }
  }
  console.log(root_tab)
  return (
    <main className="mt-8 mb-8">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Component searchParams={searchParams} {...root_tab}/>
        </Grid>
      </Grid>
    </main>
  )
}
