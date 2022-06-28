#!/bin/sh

if [ $INGEST ]
then
	cd scripts/ingestion
	python populate.py $CLEAN data
	cd ../..
else
   echo "skipping ingestion..."
fi
node server.js