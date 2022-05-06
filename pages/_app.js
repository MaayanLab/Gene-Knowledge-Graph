import '../styles/globals.css'
import dynamic from 'next/dynamic'
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    default: {
      main: "#e0e0e0",
      dark: "#9e9e9e",
      light: "#eeeeee"
    }
  }
});

const Base = dynamic(import('../components/base'));

function MyApp({ Component, pageProps }) {
  return (
      <ThemeProvider theme={theme}>
        <Base {...pageProps}>
          <Component {...pageProps} />
        </Base>
      </ThemeProvider>
  )
}

export default MyApp
