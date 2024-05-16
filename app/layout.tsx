import { Metadata, ResolvingMetadata } from 'next'
import ThemeRegistry from './ThemeRegistry'
import Header from '@/components/Header'
import Subheader from '@/components/Subheader'
import Footer from '@/components/Footer'
import { Container, Grid } from '@mui/material'
import './global.css'
import { fetch_kg_schema } from '@/utils/initialize'
import { Suspense } from 'react'

 
export async function generateMetadata(
  { params, searchParams }: {
    params: { id: string }
    searchParams: { [key: string]: any }
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const id = params.id
 
  // fetch data
  const {header} = await fetch_kg_schema()
  // optionally access and extend (rather than replace) parent metadata
 
  return {
    title: header.header || header.title,
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
          {children}
        </ThemeRegistry>
      </body>
    </html>
  )
}
