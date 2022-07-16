FROM node:16-alpine AS runner
WORKDIR /app

COPY . .
 
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN apk add make automake gcc g++ subversion python3-dev
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install -r requirements.txt

COPY ./ingest.sh ./ingest.sh
ENV NEXT_TELEMETRY_DISABLED 1
# CMD ["node", "server.js"]
ENTRYPOINT ["./ingest.sh"]