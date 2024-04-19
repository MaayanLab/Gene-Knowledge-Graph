import { createSwaggerSpec } from 'next-swagger-doc';
import { fetch_kg_schema } from './initialize';

const swagger_tag = {
	'DistilleryLanding': 'distillery apps',
	'KnowledgeGraph': 'term search',
	'Enrichment': 'enrichment'
}
export const getApiDocs = async () => {
	const schema = await fetch_kg_schema()
	const tags = []
	for (const i of schema.header.tabs) {
		const tag = swagger_tag[i.component]
		if (tag && tags.indexOf(tag) === -1) {
			tags.push(tag)
		}
	}
	const spec = createSwaggerSpec({
	apiFolder: 'app/api', // define api folder under app folder
	definition: {
		openapi: '3.0.0',
		info: {
		title: `${schema.header.title} API`,
		version: '1.0',
		},
		components: {
		securitySchemes: {
			BearerAuth: {
			type: 'http',
			scheme: 'bearer',
			bearerFormat: 'JWT',
			},
		},
		},
		security: [],
	},
	});
const new_path = {}
for (const [k,v] of Object.entries(spec['paths'])) {
	const new_sub_path = {}
	for (const [key, val] of Object.entries(v)) {
		let add = true
		for (const i of val['tags'] || []) {
			if (tags.indexOf(i) === -1) {
				add = false
				break
			}
		}
		if (add) {
			new_sub_path[key] = val
		}
	}
	if (Object.keys(new_sub_path).length > 0) new_path[k] = new_sub_path
}
spec['paths'] = new_path

return spec;
};