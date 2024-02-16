import Link from "next/link"
import { Grid } from '@mui/material'
import { Component } from "./component_selector"
import { fetch_kg_schema } from "@/utils/initialize"
export default async function Home({searchParams}: {
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
  }
}) {
  const schema = await fetch_kg_schema()
  const root_tab = {component: '', props: {}, endpoint: ""}
  for (const tab of schema.header.tabs) {
    if (tab.endpoint === "/") {
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
