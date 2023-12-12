import { withRouter } from "next/router";
import { init_function, fetch_kg_schema } from '../../utils/initialize';
import { get_path } from "../../components/markdown";
import { makeTemplate } from "../../utils/helper";


import {components} from '../../components/ComponentSelector'

function Page({router, schema, component, ...props}){
  if (components[component] !== undefined){
      return components[component]({schema, ...props})
  } else {
    console.error("Invalid component")
    router.push(`/error`)
  }
}

export async function getStaticPaths() {
    const schema = await fetch_kg_schema()
    const paths = []
    for (const path of ((schema || {}).header || {}).tabs || []) {
        if (path.type === 'group') {
            for (const p of (path.props || {}).pages || []) {
                const endpoints = p.endpoint.split("/")
                paths.push({
                    params: {
                        page: endpoints[1],
                        group_page: endpoints[2]
                    }
                })
            }
        }
    }
    return {
      paths,
      fallback: false // false or 'blocking'
    };
  }
  

export async function getStaticProps(ctx) {
    const schema = await fetch_kg_schema()
    const group_endpoint = `/${ctx.params.page}`
    const endpoint = `/${ctx.params.page}/${ctx.params.group_page}`
    let vals 
    for (const page of schema.header.tabs) {
      if (page.endpoint === group_endpoint) {
        for (const i of page.props.pages) {
          if (i.endpoint === endpoint) {
            vals = i
            break
          }
        }
        break
      }
    }
    const {type, component=null, props={}} = vals
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
        endpoint: rest.endpoint,
      }
    };
  }

export default withRouter(Page)