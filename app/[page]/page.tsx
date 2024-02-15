import Link from "next/link"
import { Grid } from '@mui/material'
import { typed_fetch } from "@/utils/helper"
import { UISchema } from "../api/schema/route"
import { Component } from "../component_selector"
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
		page: string
	}
}) {
  const schema = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
  const page = params.page
  const root_tab = {component: '', props: {}, endpoint: `${page}`}
  for (const tab of schema.header.tabs) {
    if (tab.endpoint === `/${page}`) {
      root_tab.component = tab.component
      root_tab.props = tab.props
    }
  }
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
