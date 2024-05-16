import { Grid, Container } from '@mui/material'
import { Component } from "../../component_selector"
import { fetch_kg_schema } from "@/utils/initialize"
import { Suspense } from 'react'
import Header from '@/components/Header'
import Subheader from '@/components/Subheader'
import Footer from '@/components/Footer'

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
  const schema = await fetch_kg_schema()
  const page = params.page
  const subpage = params.subpage
  const root_tab = {component: '', props: {}, endpoint: `${page}/${subpage}`}
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
  return (
    <Grid container direction={"column"} justifyContent="space-between" sx={{minHeight: "100vh"}}>
      <Grid item>
        <Container maxWidth={searchParams.fullscreen ?"xl": "lg"} sx={{backgroundColor: "#FFF"}}>
          {!searchParams.fullscreen && <Header schema={schema}/>}
          <Suspense><Subheader schema={schema}/></Suspense>
          <main className="mt-8 mb-8">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Suspense>
                  <Component searchParams={searchParams} {...root_tab}/>
                </Suspense>
              </Grid>
            </Grid>
          </main>
        </Container>
      </Grid>
      {!searchParams.fullscreen && <Grid item>
        <Footer {...schema.footer}/>
      </Grid>}
    </Grid>
  )
}
