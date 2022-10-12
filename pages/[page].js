import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import * as default_schema from '../public/schema.json'
import { fetch_kg_schema } from '../utils/initialize';
import { get_path } from "../components/markdown";
import { makeTemplate } from "../utils/helper";

const Markdown = dynamic(()=>import("../components/markdown"), {ssr: false});
const Enrichment = dynamic(()=>import("../components/Enrichment"));

const components = {
  Enrichment: (props) => <Enrichment {...props}/>
}

const ExtraPage = ({schema, markdown, type, component, props}) => {
    if (!schema) schema=default_schema  
    const router = useRouter()
    const {asPath: endpoint} = router
    if (type === 'markdown') {
        return <Markdown markdown={markdown}/>
    } else if (type === "page" && components[component] !== undefined){
        return components[component]({schema, ...props})
    } else {
      console.error("Invalid component")
      router.push(`/${endpoint[0]}`)
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
    const endpoint = `/${ctx.params.page}`
    const {type, src, markdown: md, component=null, props=null} = schema.header.tabs.filter(i=>i.endpoint === endpoint)[0] || {}
    let markdown = md
    if (src && type === "markdown") {
      markdown = await (await fetch(get_path(makeTemplate(src, {})))).text()
    }
    return {
        props: {
          schema: s,
          markdown: markdown || null,
          component,
          props,
          type,
      },
      };
  }

export default ExtraPage