# Admin panel — multi-stage Next.js (Yarn 4 + standalone)
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false
RUN yarn install

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=https://api.museticket.com
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
# yarn build lockfile'ı yeniden çözümler; next'i doğrudan çalıştır
RUN ./node_modules/.bin/next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
