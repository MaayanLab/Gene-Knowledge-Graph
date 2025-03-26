env = {
	"APP_NAME":'knowledge_graph',
	"VERSION":'2.2.9',
	"NEXT_PUBLIC_HOST":'http://localhost:3000',
	"DOCKERHUB_NAME":'maayanlab',
	"OFFLINE": False,
	"NEXT_PUBLIC_PREFIX": ""
}
with open('../.env') as o:
	for line in o:
		if line.strip() and not line.startswith("#"):
			key,val = line.strip().split("=")
			if key in env:
				print(key)
				env[key] = val

print(env)	
if env['APP_NAME'] == 'distillery':
	filename = '../docker-compose-template-distillery-offline.yml' if env['OFFLINE'] else '../docker-compose-template-distillery.yml'
else:	
	filename = '../docker-compose-template-offline.yml' if env['OFFLINE'] else '../docker-compose-template.yml'
with open(filename) as o:
	compose = o.read()
	compose = compose.replace('${APP_NAME}', env['APP_NAME'])
	compose = compose.replace('${VERSION}', env['VERSION'])
	compose = compose.replace('${NEXT_PUBLIC_HOST}', env['NEXT_PUBLIC_HOST'])
	compose = compose.replace('${NEXT_PUBLIC_PREFIX}', env['NEXT_PUBLIC_PREFIX'])
	compose = compose.replace('${DOCKERHUB_NAME}', env['DOCKERHUB_NAME'])
	print(compose)
	
with open('../docker-compose.yml', 'w') as w:
	w.write(compose)