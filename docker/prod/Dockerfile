# Production image for app.getbze.com (the v1 BZE dapp). Mainnet-only: CI
# builds it on every push to main. Build from the repo root:
#   docker build -f docker/prod/Dockerfile --secret id=build_env,src=.env.dist .
#
# Build-time env: Next inlines the NEXT_PUBLIC_* values of `.env` into the
# client bundle at build time. That file is .dockerignore'd and comes in as
# the BuildKit secret `build_env`, mounted as /app/.env for the build step
# only — it is never in the build context, an image layer or the build log.
# CI mounts the production values from the private deploy repo
# (bze-deploy/app.getbze.com/build.env); the command above uses the dev
# template for a local build. All values are public NEXT_PUBLIC_* — no secrets.

FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
# Next's output tracing copies .env into the standalone bundle — drop that copy
# so the env file never reaches the final stage.
RUN --mount=type=secret,id=build_env,target=/app/.env,required=true \
    yarn build && rm -f .next/standalone/.env

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
