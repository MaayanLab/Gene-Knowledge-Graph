import { Grid } from '@mui/material'
import { Component } from "../component_selector"
import { fetch_kg_schema } from "@/utils/initialize"
import { Suspense } from 'react'
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
  const schema = await fetch_kg_schema()
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
          <Suspense>
            <Component searchParams={searchParams} {...root_tab}/>
          </Suspense>
        </Grid>
      </Grid>
    </main>
  )
}