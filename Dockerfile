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
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ARG NEXT_PUBLIC_ADMIN_BUILD_ID=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1
# Her image build’de benzersiz id — tarayıcıdaki admin oturumları düşer.
RUN BUILD_ID="$NEXT_PUBLIC_ADMIN_BUILD_ID"; \
    if [ -z "$BUILD_ID" ]; then BUILD_ID="$(date -u +%Y%m%d%H%M%S)-$RANDOM"; fi; \
    echo "NEXT_PUBLIC_ADMIN_BUILD_ID=$BUILD_ID"; \
    NEXT_PUBLIC_ADMIN_BUILD_ID="$BUILD_ID" ./node_modules/.bin/next build

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
