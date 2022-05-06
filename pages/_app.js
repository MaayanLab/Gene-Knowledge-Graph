import '../styles/globals.css'
import dynamic from 'next/dynamic'

const Base = dynamic(import('../components/base'));

function MyApp({ Component, pageProps }) {
  return (
      <Base {...pageProps}>
        <Component {...pageProps} />
      </Base>
  )
}

export default MyApp
