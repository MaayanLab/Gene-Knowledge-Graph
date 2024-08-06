import { Grid, Container } from '@mui/material'
import { Component } from "../component_selector"
import { fetch_kg_schema } from "@/utils/initialize"
import { Suspense } from 'react'
import Header from '@/components/Header'
import Subheader from '@/components/Subheader'
import Footer from '@/components/Footer'
import QueryTranslator from '@/components/QueryTranslator'
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
    <Grid container direction={"column"} justifyContent="space-between" sx={{minHeight: "100vh", backgroundColor: (!schema.ui_theme || schema.ui_theme === 'cfde_theme') ? '#FFF': 'tertiary.main'}}>
      <Grid item>
        {(!searchParams.fullscreen && schema.header.fullWidth) && <Header schema={schema}/>}
        <Container maxWidth={searchParams.fullscreen ?"xl": "lg"} sx={{backgroundColor: "#FFF"}} style={{paddingLeft: 0, paddingRight: 0}}>
          {(!searchParams.fullscreen && !schema.header.fullWidth) && <Header schema={schema}/>}
          {!searchParams.fullscreen &&<Suspense><Subheader schema={schema}/></Suspense>}
          <main className="mt-8 pb-8 pl-10 pr-10">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Suspense>
                  <QueryTranslator>
                    <Component searchParams={searchParams} {...root_tab}/>
                  </QueryTranslator>
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