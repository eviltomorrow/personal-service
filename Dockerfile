FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS builder
WORKDIR /personal-service
COPY [".", "./"]
ARG APPNAME=unknown
ARG MAINVERSION=unknown
ARG GITSHA=unknown
ARG BUILDTIME=unknown
ENV MAINVERSION=${MAINVERSION} \
    GITSHA=${GITSHA} \
    BUILDTIME=${BUILDTIME} 
RUN CGO_ENABLED=0 GOOS=linux go build -mod=vendor -ldflags "-X main.AppName=${APPNAME} -X main.MainVersion=${MAINVERSION} -X main.GitSha=${GITSHA} -X main.BuildTime=${BUILDTIME} -s -w" -gcflags "all=-trimpath=$(go env GOPATH)" -o bin/${APPNAME}/bin/${APPNAME} apps/${APPNAME}/main.go

FROM alpine:3.21 AS prod
WORKDIR /app
ARG APPNAME=unknown
ENV APPNAME=${APPNAME} 
COPY --from=builder ["/personal-service/bin/${APPNAME}", "."]
COPY --from=builder ["/personal-service/apps/${APPNAME}/conf/etc", "./etc"]
RUN apk add --no-cache tzdata ca-certificates
ENTRYPOINT ["sh", "-c", "./bin/${APPNAME}"]
