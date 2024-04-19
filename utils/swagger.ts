import { createSwaggerSpec } from 'next-swagger-doc';
import { fetch_kg_schema } from './initialize';

export const getApiDocs = async () => {
	const schema = await fetch_kg_schema()
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
return spec;
};