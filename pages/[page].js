import { useRouter } from "next/router";
import { init_function, fetch_kg_schema } from '../utils/initialize';
import { get_path } from "../components/markdown";
import { makeTemplate } from "../utils/helper";


import {components} from '../components/ComponentSelector'

export default function Page({schema, component, ...props}){
  const router = useRouter()
  if (components[component] !== undefined){
      return components[component]({schema, ...props})
  } else {
    console.error("Invalid component")
    router.push(`/error`)
  }
}

export async function getStaticPaths() {
    const schema = await fetch_kg_schema()
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
    const schema = await fetch_kg_schema()
    const endpoint = `/${ctx.params.page}`
    const {type, component=null, props={}} = schema.header.tabs.filter(i=>i.endpoint === endpoint)[0] || {}
    const src = props.src
    let markdown
    if (src && type === "markdown") {
      markdown = await (await fetch(get_path(makeTemplate(src, {})))).text()
    }
    const {init_function: init, ...rest} = props
    let initialized={}
    if (init) {
      initialized = await init_function[init]()
    }

    return {
      props: {
        schema,
        markdown: markdown || null,
        component,
        ...rest,
        ...initialized,
      }
    };
  }