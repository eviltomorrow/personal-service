FROM node:22-alpine3.21 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:22-alpine3.21 AS builder
WORKDIR /app
ARG NEXT_PUBLIC_ENABLE_REGISTER=true
ENV NEXT_PUBLIC_ENABLE_REGISTER=${NEXT_PUBLIC_ENABLE_REGISTER}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine3.21 AS prod
WORKDIR /app
ARG MAINVERSION=unknown
ARG GITSHA=unknown
ARG BUILDTIME=unknown
ENV MAINVERSION=${MAINVERSION} \
    GITSHA=${GITSHA} \
    BUILDTIME=${BUILDTIME} \
    NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN apk add --no-cache tzdata ca-certificates
EXPOSE 3000
ENTRYPOINT ["node", "server.js"]
