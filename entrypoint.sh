#!/bin/sh

if [ $INGEST ]
then
	cd scripts/ingestion
	python populate.py $CLEAN data
	cd ../..
else
   echo "skipping ingestion..."
fi
cd scripts/ingestion
python indexing.py schema.json
cd ../..
node server.js