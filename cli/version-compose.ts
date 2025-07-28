import fs from 'fs'
import path from 'path'

let filename = 'docker-compose-template.yml'
if (process.env.NEO4J_VERSION === '5') {
	filename = 'docker-compose-v5-template.yml'
}
if (process.env.OFFLINE === 'true') {
	filename = 'docker-compose-template-offline.yml'
	if (process.env.NEO4J_VERSION === '5') {
		filename = 'docker-compose-template-v5-offline.yml'
	}
}
let compose = fs.readFileSync(path.join(__dirname, '..', filename), { encoding: 'utf-8' })
compose = compose.replaceAll(/\$\{APP_NAME\}/g, process.env.APP_NAME)
compose = compose.replaceAll(/\$\{VERSION\}/g, process.env.npm_package_version)
compose = compose.replaceAll(/\$\{NEXT_PUBLIC_HOST\}/g, process.env.NEXT_PUBLIC_HOST)
compose = compose.replaceAll(/\$\{NEXT_PUBLIC_PREFIX\}/g, process.env.NEXT_PUBLIC_PREFIX)
compose = compose.replaceAll(/\$\{DOCKERHUB_NAME\}/g, process.env.DOCKERHUB_NAME)
fs.writeFileSync(path.join(__dirname, '..', `docker-compose.yml`), compose)
