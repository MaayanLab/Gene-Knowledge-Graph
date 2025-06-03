import { createSwaggerSpec } from 'next-swagger-doc';
import { fetch_kg_schema } from './initialize';

const swagger_tag = {
	'DistilleryLanding': 'distillery apps',
	'KnowledgeGraph': 'term search',
	'Enrichment': 'enrichment'
}
export const getApiDocs = async (title?:string) => {
	const spec = createSwaggerSpec({
	apiFolder: 'app/api', // define api folder under app folder
	definition: {
		openapi: '3.0.0',
		info: {
		title: "API Documentation",
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
		new_sub_path[key] = val
	}
	
	if (Object.keys(new_sub_path).length > 0) new_path[k] = new_sub_path
}
spec['paths'] = new_path
return spec;
};