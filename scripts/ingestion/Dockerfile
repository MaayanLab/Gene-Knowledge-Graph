FROM python:3.8-slim
WORKDIR /app

COPY . .
 
RUN pip3 install -r requirements.txt

COPY ./ingest.sh ./ingest.sh
RUN ["chmod", "+x", "./ingest.sh"]
ENTRYPOINT ["./ingest.sh"]