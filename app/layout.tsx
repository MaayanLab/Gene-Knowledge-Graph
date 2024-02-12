import { Metadata, ResolvingMetadata } from 'next'
import Script from 'next/script'
import Head from 'next/head'
import ThemeRegistry from './ThemeRegistry'
import { typed_fetch } from '@/utils/helper'
import { UISchema } from './api/schema/route'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Container, Grid } from '@mui/material'
import './global.css'

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}
 
export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const id = params.id
 
  // fetch data
  const {header} = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
 
  // optionally access and extend (rather than replace) parent metadata
 
  return {
    title: header.title,
    description: '',
    icons: {
      icon: header.icon.favicon
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const schema = await typed_fetch<UISchema>(`${process.env.NEXT_PUBLIC_HOST}${process.env.NEXT_PUBLIC_PREFIX}/api/schema`)
  return (
    <html lang="en">
      <body>
        <ThemeRegistry options={{ key: 'mui' }} theme={schema.ui_theme || "cfde_theme"}>
          <Grid container direction={"column"} justifyContent="space-between" sx={{minHeight: "100vh", marginTop: 2}}>
            <Grid item>
              <Container maxWidth="lg" sx={{marginTop: 1}}>
                <Header schema={schema}/>    
                {children}
              </Container>
            </Grid>
            <Grid item>
              <Footer {...schema.footer}/>
            </Grid>
          </Grid>
        </ThemeRegistry>
        {/* <Script src="https://unpkg.com/cytoscape/dist/cytoscape.min.js" strategy='beforeInteractive'/>
        <Script src="https://unpkg.com/layout-base/layout-base.js" strategy='beforeInteractive'/>
        <Script src="https://unpkg.com/avsdf-base/avsdf-base.js" strategy='beforeInteractive'/>
        <Script src="https://unpkg.com/cytoscape-avsdf/cytoscape-avsdf.js" strategy='beforeInteractive'/>
        <Script src="https://unpkg.com/layout-base/layout-base.js" strategy='beforeInteractive'/>
        <Script src="https://unpkg.com/cose-base/cose-base.js" strategy='beforeInteractive'/>
        <Script src="https://unpkg.com/cytoscape-fcose/cytoscape-fcose.js" strategy='beforeInteractive'/> */}
      </body>
    </html>
  )
}
