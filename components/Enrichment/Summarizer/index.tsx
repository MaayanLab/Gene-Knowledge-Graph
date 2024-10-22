import React, { useState, useEffect } from 'react'
import Icon from '@mdi/react';
import { mdiBookOpenPageVariant } from '@mdi/js';
import { makeTemplate } from '@/utils/helper';
import Box from '@mui/material/Box';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import ClientSummarizer from './Client';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "60%",
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerFirst(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

export const Summarizer = ({elements, schema, augmented}) => {

	const templates = {}
	for (const i of schema.edges){
		const template = i.templates
		for (const j of i.match) {
			const edge = i.edge_suffix ? j + " " + i.edge_suffix: j
			templates[edge] = template
		}
	}

    const node_type = {}
	for (const i of elements.nodes) {
		if (i.data.kind !== "Relation") {
			node_type[i.data.id] = i.data.kind
		}
	}
	const resource_relations = {}
	for (const i of elements.edges) {
		if (i.data.kind === "Relation") {
			const source = i.data.source
			const relation = i.data.relation
			const target = i.data.target
			const source_type = (node_type[source] !== "Gene" && node_type[source] !== "Predicted Gene (Co-Expression)") ? "term": (node_type[target] !== "Gene" && node_type[target] !== "Predicted Gene (Co-Expression)") ? "gene": "gene_1"
			const target_type = (node_type[target] !== "Gene" && node_type[target] !== "Predicted Gene (Co-Expression)") ? "term": (node_type[source] !== "Gene" && node_type[source] !== "Predicted Gene (Co-Expression)") ? "gene": "gene_2"
			const resource = i.data.resource || `${relation} associations`
			const source_label = i.data.source_label
			const target_label = i.data.target_label
			
			if (resource_relations[resource] === undefined) resource_relations[resource] = {}
			const data = {
				[source_type]: source_label,
				[target_type]: target_label,
				relation
			}
			if (data.term) {
				if (resource_relations[resource][data.term] === undefined) resource_relations[resource][data.term] = data
				else {
					const {gene, genes=[], ...rest} = resource_relations[resource][data.term]
					if (gene) genes.push(gene)
					if (genes.indexOf(data.gene) === -1) {
						rest["genes"] = [...genes, data.gene]
						resource_relations[resource][data.term] = rest
					} else {
						resource_relations[resource][data.term] = data
					}
					
				}
			} else if (data.gene_1) {
				if (resource_relations[resource][data.gene_1] === undefined) resource_relations[resource][data.gene_1] = data
				else {
					const {gene_2: gene, ...rest} = resource_relations[resource][data.gene_1]
					const gene_2 = typeof gene === "string" ? [gene]: gene
					if (gene_2.indexOf(data.gene_2) === -1) {
						rest["gene_2"] = [...gene_2, data.gene_2]
						resource_relations[resource][data.gene_1] = rest
					} else {
						resource_relations[resource][data.gene_1] = data
					}
				}
			}
		}
	}
	let summary = `The ${augmented ? "augmented ": ""}subnetwork shows the following associations: `
	for (const [resource, relationships] of Object.entries(resource_relations)) {
		summary = `${summary}From ${resource}: `
		for (const i in Object.values(relationships)) {
			const index = parseInt(i)
			const {relation, ...data} = Object.values(relationships)[index]
			const template_object = templates[relation]
			let text = ''
			if (template_object && template_object.multiple && template_object.singular) {
				if (data.gene !== undefined) {
					text = makeTemplate(template_object.singular, data)
				} else if (data.genes !== undefined) {
					data.genes = `${data.genes.slice(0, -1).join(", ")}, and ${data.genes[data.genes.length - 1]}`
					text = makeTemplate(template_object.multiple, data)
				} else if (data.gene_2 !== undefined) {
					if (typeof data.gene_2 === "string") {
						text = makeTemplate(template_object.singular, data)
					} else {
						data.gene_2 = `${data.gene_2.slice(0, -1).join(", ")}, and ${data.gene_2[data.gene_2.length - 1]}`
						text = makeTemplate(template_object.multiple, data)
					}
				}
			}
			summary = `${summary} ${text} `
		}
	}

    if (Object.keys(templates).length === 0) return null
    return  (
		<ClientSummarizer>
			<Box sx={style}>
				<Typography variant="h5">{augmented ? "Free text summary of the augmented subnetwork": "Free text summary of the subnetwork"}</Typography>
				{summary === "null" ? <CircularProgress/>: 
					<Box sx={{padding: 10, border: "1px solid", marginTop: 10, height: 400, overflow: "auto"}}>
						<Typography variant="subtitle1">{summary}</Typography>
					</Box>
				}
			</Box>
		</ClientSummarizer>
	)
}
export default Summarizer
