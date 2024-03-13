import fs from 'fs'
import path from 'path'

let filename = 'docker-compose-template.yml'
if (process.env.OFFLINE === 'true') {
	console.log("Using offline config")
	filename = 'docker-compose-template-offline.yml'
}
let compose = fs.readFileSync(path.join(__dirname, '..', filename), { encoding: 'utf-8' })
compose = compose.replaceAll(/\$\{APP_NAME\}/g, process.env.APP_NAME)
compose = compose.replaceAll(/\$\{VERSION\}/g, process.env.npm_package_version)
compose = compose.replaceAll(/\$\{NEXT_PUBLIC_HOST\}/g, process.env.NEXT_PUBLIC_HOST)
fs.writeFileSync(path.join(__dirname, '..', `docker-compose.yml`), compose)
