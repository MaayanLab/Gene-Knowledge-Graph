import { Metadata } from 'next'
import ThemeRegistry from './ThemeRegistry'
import './global.css'
import { fetch_kg_schema } from '@/utils/initialize'

 
export async function generateMetadata(): Promise<Metadata> {
 
  // fetch data
  const {header} = await fetch_kg_schema()
  // optionally access and extend (rather than replace) parent metadata
 
  return {
    title: header.icon.faviconTitle || header.title,
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
