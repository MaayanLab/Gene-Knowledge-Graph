import '../styles/globals.css'
import dynamic from 'next/dynamic';
import Head from 'next/head'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import * as default_schema from '../public/schema.json'
import { makeTemplate } from '../utils/helper';

const Container = dynamic(() => import('@mui/material/Container'));
const Header = dynamic(() => import('../components/header'));
const Footer = dynamic(() => import('../components/footer'));

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



function MyApp({ Component, pageProps }) {
  const palettes = pageProps.palettes
  theme_object.palette = {...theme_object.palette, ...palettes}
  const theme = createTheme(theme_object)
  return (
      <ThemeProvider theme={theme}>
        <Head>
          <meta charSet="utf-8" />
          <title>{((pageProps.schemas || default_schema).header || {}).title}</title>
          <link rel="shortcut icon" type="image/x-icon" alt={((pageProps.schemas || default_schema).header || {}).title} href={makeTemplate((((pageProps.schemas || default_schema).header || {}).icon).src || '', {})} />
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
          <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.9.55/css/materialdesignicons.min.css" rel="stylesheet" />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <script async defer src="https://buttons.github.io/buttons.js"></script>
        </Head>
        <Container style={{marginTop: 20}} maxWidth="xl">
          <Header {...pageProps}/>
          <Component 
            {...pageProps}
          />
        </Container>
        <Footer {...pageProps}/>
      </ThemeProvider>
  )
}

export default MyApp
