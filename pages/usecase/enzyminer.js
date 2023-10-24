import React, { useState, useEffect, useRef } from "react";
import { fetch_kg_schema } from '../../utils/initialize';
import { useRouter } from "next/router";
import {components} from '../../components/ComponentSelector'

function Enzyme2Drugs(props) {
    const router = useRouter()
    const component = "DistilleryUseCase"
    if (components[component] !== undefined){
        return components[component](props)
    } else {
        console.error("Invalid component")
        router.push(`/error`)
    }
}


export async function getStaticProps(ctx) {
    const schema = await fetch_kg_schema()
    const tooltip_templates_node = {}
    const tooltip_templates_edges = {}
    for (const i of schema.nodes) {
        tooltip_templates_node[i.node] = i.display
    }

    for (const e of schema.edges) {
        for (const i of e.match) {
            tooltip_templates_edges[i] = e.display
        }
    }
    return {
      props: {
        schema,
        tooltip_templates_node,
        tooltip_templates_edges
      }
    };
  }

export default Enzyme2Drugs