# Install dependencies only when needed
FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json /app
RUN npm install

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV production

# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nextjs -u 1001

# You only need to copy next.config.js if you are NOT using the default configuration
COPY . .
RUN npm run build

COPY ./public/schema.json ./scripts/ingestion
 
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN apk add make automake gcc g++ subversion python3-dev
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install -r ./scripts/ingestion/requirements.txt
# USER nextjs


ENV PREFIX=/
ENV NEXT_PUBLIC_PREFIX=/
ENV PORT=3000
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.

# COPY --chown=nextjs:nodejs ./entrypoint.sh ./entrypoint.sh
ENV NEXT_TELEMETRY_DISABLED 1
# CMD ["node", "server.js"]
RUN set -x && chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]