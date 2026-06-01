FROM --platform=$BUILDPLATFORM golang:latest AS builder
WORKDIR /personal-service
COPY [".", "./"]
ARG APPNAME=unknown
ARG MAINVERSION=unknown
ARG GITSHA=unknown
ARG BUILDTIME=unknown
ENV MAINVERSION=${MAINVERSION} \
    GITSHA=${GITSHA} \
    BUILDTIME=${BUILDTIME} 
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags "-X main.AppName=${APPNAME} -X main.MainVersion=${MAINVERSION} -X main.GitSha=${GITSHA} -X main.BuildTime=${BUILDTIME} -s -w" -gcflags "all=-trimpath=$(go env GOPATH)" -o bin/${APPNAME}/bin/${APPNAME} apps/${APPNAME}/main.go


FROM --platform=$BUILDPLATFORM alpine:latest AS prod
WORKDIR /app
ARG APPNAME=unknown
ENV APPNAME=${APPNAME} 
COPY --from=builder ["/personal-service/bin/${APPNAME}","."]
COPY --from=builder ["/personal-service/apps/${APPNAME}/conf/etc","./etc"]
ENTRYPOINT ["sh","-c","./bin/${APPNAME}"]