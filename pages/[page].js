import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import * as default_schema from '../public/schema.json'
import { fetch_kg_schema } from '../utils/initialize';
import { get_path } from "../components/markdown";
import { makeTemplate } from "../utils/helper";

const Markdown = dynamic(()=>import("../components/markdown"), {ssr: false});

const ExtraPage = ({schema, markdown}) => {
    if (!schema) schema=default_schema  
    const router = useRouter()
    const {asPath: endpoint} = router
    const {type, src} = schema.header.tabs.filter(i=>i.endpoint === endpoint)[0] || {}
    if (type !== 'markdown') {
        console.error("Component must be a markdown")
        router.push(`/${endpoint[0]}`)
    } else {
        return <Markdown markdown={markdown} src={src}/>
    }
}

export async function getStaticPaths() {
    let schema = default_schema
    let s = null
    if (process.env.NEXT_PUBLIC_SCHEMA) {
      schema = await fetch_kg_schema()
      s = schema
    }
    const endpoints = ((schema || {}).header || {}).tabs || []
    const paths = endpoints.filter(e=>e.endpoint!=="/").map(e=>({
        params: {
            page: e.endpoint.replace("/", "")
        }
    }))
    return {
      paths,
      fallback: false // false or 'blocking'
    };
  }
  

export async function getStaticProps(ctx) {
    let schema = default_schema
    let s = null
    if (process.env.NEXT_PUBLIC_SCHEMA) {
      schema = await fetch_kg_schema()
      s = schema
    }
    console.log(ctx.res)
    const endpoint = `/${ctx.params.page}`
    const {type, src, markdown: md} = schema.header.tabs.filter(i=>i.endpoint === endpoint)[0] || {}
    let markdown = md
    if (src && type === "markdown") {
      markdown = await (await fetch(get_path(makeTemplate(src, {})))).text()
    }
    return {
        props: {
          schema: s,
          markdown
      },
      };
  }

export default ExtraPage