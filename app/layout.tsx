import { Metadata, ResolvingMetadata } from 'next'
import ThemeRegistry from './ThemeRegistry'
import Header from '@/components/Header'
import Subheader from '@/components/Subheader'
import Footer from '@/components/Footer'
import { Container, Grid } from '@mui/material'
import './global.css'
import { fetch_kg_schema } from '@/utils/initialize'


 
export async function generateMetadata(
  { params, searchParams }: {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const id = params.id
 
  // fetch data
  const {header} = await fetch_kg_schema()
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
  const schema = await fetch_kg_schema()
  return (
    <html lang="en">
      <body>
        <ThemeRegistry options={{ key: 'mui' }} theme={schema.ui_theme || "cfde_theme"}>
          <Grid container direction={"column"} justifyContent="space-between" sx={{minHeight: "100vh", marginTop: 2}}>
            <Grid item>
              <Container maxWidth="lg" sx={{marginTop: 1}}>
                <Header schema={schema}/>
                <Subheader schema={schema}/>  
                {children}
              </Container>
            </Grid>
            <Grid item>
              <Footer {...schema.footer}/>
            </Grid>
          </Grid>
        </ThemeRegistry>
      </body>
    </html>
  )
}
