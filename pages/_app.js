import { useState } from 'react';
import '../styles/globals.css'
import dynamic from 'next/dynamic'
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    default: {
      main: "#e0e0e0",
      dark: "#9e9e9e",
      light: "#eeeeee"
    },
    primary: {
      main: "#c5e1a5",
      dark: "#8bc34a",
      light: "#f1f8e9"
    },
    secondary: {
      main: "#ffb74d",
      dark: "#fb8c00",
      light: "#ffe0b2"
    }
  }
});

const Base = dynamic(import('../components/base'));

function MyApp({ Component, pageProps }) {
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [active, setActive] = useState(null)
  const [activeResource, setActiveResource] = useState(null)
  return (
      <ThemeProvider theme={theme}>
        <Base 
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
          setActive={setActive}
          activeResource={activeResource}
          setActiveResource={setActiveResource}
          {...pageProps}
        >
          <Component 
            start={start}
            setStart={setStart}
            end={end}
            setEnd={setEnd}
            active={active}
            setActive={setActive}
            setActiveResource={setActiveResource}
            activeResource={activeResource}
            {...pageProps}
          />
        </Base>
      </ThemeProvider>
  )
}

export default MyApp
