#!/bin/sh

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