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
    <Grid container direction={"column"} justifyContent="space-between" sx={{minHeight: "100vh", backgroundColor: (!schema.ui_theme || schema.ui_theme === 'cfde_theme') ? '#FFF': 'tertiary.main'}}>
      <Grid item>
        <Container maxWidth={searchParams.fullscreen ?"xl": "lg"} sx={{backgroundColor: "#FFF"}} style={{paddingLeft: 0, paddingRight: 0}}>
          {!searchParams.fullscreen && <Header schema={schema}/>}
          {!searchParams.fullscreen &&<Suspense><Subheader schema={schema}/></Suspense>}
          <main className="mt-8 pb-8 pl-10 pr-10">
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
