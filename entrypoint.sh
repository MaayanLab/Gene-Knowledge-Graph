#!/bin/sh

cd scripts/ingestion
python validation.py data
python populate.py clean data

cd ../..
node server.js