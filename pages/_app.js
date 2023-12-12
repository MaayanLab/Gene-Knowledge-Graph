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
import { cfde_theme } from '../themes/cfde';
const Grid = dynamic(() => import('@mui/material/Grid'));

const Container = dynamic(() => import('@mui/material/Container'));
const Header = dynamic(() => import('../components/header'));
const Footer = dynamic(() => import('../components/footer'));
const ConsentCookie = dynamic(() => import('../components/ConsentCookie'));
const Background = dynamic(() => import('../components/background'));


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
      <ThemeProvider theme={cfde_theme}>
        <Head>
          <meta charSet="utf-8" />
          <title>{((pageProps.schema || default_schema).header || {}).icon.faviconTitle}</title>
          <link rel="shortcut icon" type="image/x-icon" alt={((pageProps.schema || default_schema).header || {}).icon.faviconTitle} href={makeTemplate((((pageProps.schema || default_schema).header || {}).icon).favicon || '', {})} />
          {/* font */}
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin/>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,500;9..40,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>
          {/* font end */}
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <script async defer src="https://buttons.github.io/buttons.js"></script>
        </Head>
        <div>
          <ConsentCookie consentCookie={consentCookie} setConsentCookie={setConsentCookie} resetCookie={resetCookie}/>
        </div>
        <Grid container direction={"column"} justifyContent={"space-between"} sx={{minHeight: "100vh"}}>
           {(fullscreen.toLowerCase() === "false" && !isIFrame()) ? 
            <>
            <Grid item>
              <Header {...pageProps}/>
            </Grid>
              <Grid item style={{flexGrow: 1}}>
                <Background>
                  <Container maxWidth={"lg"} style={{padding: 0, display: "flex", flexDirection: "column"}}>
                
                    <div className='container'>
                      <Component 
                        {...pageProps}
                      />
                    </div>
                    
                  </Container>
                </Background>
            </Grid>
            </>:
            <Grid item style={{flexGrow: 1}}>
              <Container id={"main"} maxWidth={"xl"} sx={{background: "linear-gradient(180deg, #FFFFFF 26.13%, #DBE0ED 104.21%)", marginTop: 10}}>
                <Component 
                  {...pageProps}
                />
              </Container>
            </Grid>
           }
          <Grid item>
            <Footer {...pageProps} consentCookie={consentCookie} setConsentCookie={setConsentCookie} resetCookie={resetCookie}/>
            {consentCookie === "allow" && <GoogleAnalytics trackPageViews />}
          </Grid>
        </Grid>
      </ThemeProvider>
  )
}

export default withCookie(MyApp)
