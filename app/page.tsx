import Link from "next/link"
import { Grid } from '@mui/material'


export default async function Home() {
  return (
    <main className="mt-24">
      <Grid container spacing={2}>
        <Grid item xs={6} className="flex items-center justify-center">
          <Link href="/info">Info Page</Link>
        </Grid>
        <Grid item xs={6} className="flex items-center justify-center">
          <Link href="/data">Data Page</Link>
        </Grid>
      </Grid>
    </main>
  )
}
