import dynamic from 'next/dynamic'
import Head from 'next/head'

const Container = dynamic(()=>import('@mui/material/Container'))
const Header = dynamic(()=>import('./header'))
const Footer = dynamic(()=>import('./footer'))


const Base = ({children, ...pageProps}) => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh"
  }}>
    <Head>
        <meta charSet="utf-8" />
        <title>CFDE KnowledgeXchange</title>
        <link rel="shortcut icon" type="image/x-icon" alt={"CFDE Knowledge Exchange"} href={`${process.env.NEXT_PUBLIC_PREFIX}/static/icons/kx-logo.png`} />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.9.55/css/materialdesignicons.min.css" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <script async defer src="https://buttons.github.io/buttons.js"></script>
      </Head>
      <Container style={{marginTop: 10, flexGrow: 1}} maxWidth={"lg"}>      
        <Header
          {...pageProps}
        />
        {children}
      </Container>
      <Footer/>
  </div> 
)
export default Base