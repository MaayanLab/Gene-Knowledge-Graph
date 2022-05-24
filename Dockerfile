# Install dependencies only when needed
FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json /app
RUN npm install

# Rebuild the source code only when needed
FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --chown=nextjs:nodejs prisma prisma
RUN npm install @prisma/client
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size 
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/lib/prisma.ts ./lib/prisma.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

COPY ./scripts ./scripts
 
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install -r ./scripts/neo4j/requirements.txt
USER nextjs


ENV NEXT_PUBLIC_DATA_API="https://maayanlab.cloud/sigcom-lincs/data-api"
ENV NEXT_PUBLIC_METADATA_API="https://maayanlab.cloud/sigcom-lincs/metadata-api"
ENV PREFIX=/birthdefects
ENV NEXT_PUBLIC_PREFIX=/birthdefects
ENV PORT=3000
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.


ENV NEXT_TELEMETRY_DISABLED 1
CMD ["node", "server.js"]