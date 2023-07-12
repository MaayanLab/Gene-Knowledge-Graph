#!/bin/sh

export NEO4J_URL=$(python -c "import os, socket, urllib.parse; u = urllib.parse.urlparse(os.environ['NEO4J_URL']); print(u._replace(netloc=u.netloc.replace(u.hostname, socket.gethostbyname(u.hostname))).geturl())")
if [ $INGEST ]
then
	cd scripts/ingestion
	python populate.py $OPTIONS
	cd ../..
else
   echo "skipping ingestion..."
fi
cd scripts/ingestion
python indexing.py schema.json
cd ../..
npm run build
npm start