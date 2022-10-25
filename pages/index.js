import React from 'react';
import dynamic from 'next/dynamic'
import { fetch_kg_schema, get_terms } from '../utils/initialize';
import * as default_schema from '../public/schema.json'
import Color from 'color'

const KnowledgeGraph = dynamic(() => import('../components/kg'));

export default function Home(props){
  return <KnowledgeGraph {...props}/>
}

export async function getStaticProps(ctx) {
	const entries = {}
  const palettes = {}
  const nodes = {}
  let edges = []
  let default_relations = []
  let schema = default_schema
  let s = null
  if (process.env.NEXT_PUBLIC_SCHEMA) {
    schema = await fetch_kg_schema()
    s = schema
  }
	for (const i of schema.nodes) {
		const {node, example, palette, search} = i
		const results = await get_terms(node, search)
    entries[node] = results
    nodes[node] = i
    const {name, main, light, dark, contrastText} = palette
    palettes[name] = {
      main,
      light: light || Color(main).lighten(0.25).hex(),
      dark: dark || Color(main).darken(0.25).hex(),
      contrastText: contrastText || "#000"
    }
	}
  for (const i of schema.edges) {
    edges = [...edges, ...(i.match || [])]
    if (i.selected) {
      default_relations = [...default_relations,  ...(i.match || [])]
    }
  }
  
  return {
	  props: {
  	    entries,
        nodes,
        schema: s,
        palettes,
        edges,
        default_relations
    },
	};
}