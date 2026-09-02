# Production image for app.getbze.com (the v1 BZE dapp). Build from the repo
# root:  docker build -f docker/prod/Dockerfile .
# Mainnet-only: .env.mainnet.dist is baked in at build time (all values are
# public NEXT_PUBLIC_* — no secrets).

FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN cp .env.mainnet.dist .env && yarn build

FROM node:24-alpine
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Next's file tracer misses @swc/helpers under yarn v1 hoisting — copy it in
# explicitly or the server crashes with MODULE_NOT_FOUND at startup.
COPY --from=build /app/node_modules/@swc/helpers ./node_modules/@swc/helpers
USER node
EXPOSE 3000
CMD ["node", "server.js"]
