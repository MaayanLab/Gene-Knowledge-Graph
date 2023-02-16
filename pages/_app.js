import '../styles/globals.css'
import dynamic from 'next/dynamic';
import Head from 'next/head'
import { GoogleAnalytics } from "nextjs-google-analytics";
import { useRouter } from 'next/router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import * as default_schema from '../public/schema.json'
import { makeTemplate } from '../utils/helper';
import { isIFrame } from '../utils/helper';
import withCookie from '../components/CookieWrapper';
import '../styles/kg.css'
const Container = dynamic(() => import('@mui/material/Container'));
const Header = dynamic(() => import('../components/header'));
const Footer = dynamic(() => import('../components/footer'));
const ConsentCookie = dynamic(() => import('../components/ConsentCookie'));


const theme_object = {
  palette: {
    default: {
      main: "#e0e0e0",
      dark: "#9e9e9e",
      light: "#eeeeee"
    },
    primary: {
      main: "#3f51b5",
      dark: "#303f9f",
      light: "#7986cb",
      contrastText: "#FFF"
    },
    secondary: {
      main: "#ffb74d",
      dark: "#fb8c00",
      light: "#ffe0b2"
    },
    blues: {
      main: "#3f51b5",
      dark: "#303f9f",
      light: "#7986cb",
      contrastText: "#FFF"
    },
    blacks: {
      main: "#000",
      dark: "#000",
      light: "#000",
      contrastText: "#FFF"
    },
    greens: {
      main: "#aed581",
      dark: "#33691e",
      light: "#33691e"
    },
    oranges: {
      main: "#ffb74d",
      dark: "#f57c00",
      light: "#ffcc80"
    },
    pinks: {
      main: "#ec407a",
      dark: "#c2185b",
      light: "#f8bbd0"
    }
  },
  typography: {
    button: {
      textTransform: "none"
    }
  }
};



function MyApp({ Component, pageProps, consentCookie, setConsentCookie, resetCookie }) {
  const palettes = pageProps.palettes
  const schema = pageProps.schema
  theme_object.palette = {...theme_object.palette, ...palettes}
  const theme = createTheme({...theme_object, ...(schema.theme || {})})
  const router = useRouter()
  const {fullscreen="false"} = router.query
  return (
      <ThemeProvider theme={theme}>
        <Head>
          <meta charSet="utf-8" />
          <title>{((pageProps.schema || default_schema).header || {}).icon.faviconTitle}</title>
          <link rel="shortcut icon" type="image/x-icon" alt={((pageProps.schema || default_schema).header || {}).icon.faviconTitle} href={makeTemplate((((pageProps.schema || default_schema).header || {}).icon).favicon || '', {})} />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <script async defer src="https://buttons.github.io/buttons.js"></script>
        </Head>
        <div>
          <ConsentCookie consentCookie={consentCookie} setConsentCookie={setConsentCookie} resetCookie={resetCookie}/>
        </div>
        {(fullscreen.toLowerCase() !== "false" || isIFrame())  ? 
          <Container id={"main"} maxWidth={"xl"} style={{background: "#fff", marginTop: 10}}>
            <Component 
              {...pageProps}
            />
          </Container>
          :
          <div style={{backgroundColor: ((schema || {}).ui || {}).background || "#C5F8F8"}}  id={"main"}>
            <Container maxWidth={"lg"} style={{background: "#fff", padding: 0, flexGrow: 1, display: "flex", flexDirection: "column"}}>
              <Header {...pageProps}/>
              <div className='container'>
                <Component 
                  {...pageProps}
                />
              </div>
              <Footer {...pageProps} consentCookie={consentCookie} setConsentCookie={setConsentCookie} resetCookie={resetCookie}/>
            </Container>
          </div>
        }
        {consentCookie === "allow" && <GoogleAnalytics trackPageViews />}
      </ThemeProvider>
  )
}

export default withCookie(MyApp)
