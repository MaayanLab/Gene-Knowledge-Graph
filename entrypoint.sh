#!/bin/sh

export NEO4J_URL=$(python -c "import os, socket, urllib.parse; u = urllib.parse.urlparse(os.environ['NEO4J_URL']); print(u._replace(netloc=u.netloc.replace(u.hostname, socket.gethostbyname(u.hostname))).geturl())")
echo $NEO4J_URL
if [ $INGEST ]
then
	cd scripts/ingestion
	python populate.py $OPTIONS
	python indexing.py schema.json
	cd ../..
else
   echo "skipping ingestion..."
fi
npm run build
npm start