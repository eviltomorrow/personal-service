# This how we want to name the binary output

# colors compatible setting
CRED:=$(shell tput setaf 1 2>/dev/null)
CGREEN:=$(shell tput setaf 2 2>/dev/null)
CYELLOW:=$(shell tput setaf 3 2>/dev/null)
CEND:=$(shell tput sgr0 2>/dev/null)

MAINVERSION=$(shell cat version | sed 's/^[ \t]*//g')
GITSHA := $(shell git rev-parse HEAD)
BUILDTIME=$(shell date +%FT%T%z)
REGISTRY=registry.cn-beijing.aliyuncs.com
ACCOUNT=eviltomorrow

.PHONY: go_version_check
GO_VERSION_MIN=1.19
# Parse out the x.y or x.y.z version and output a single value x*10000+y*100+z (e.g., 1.9 is 10900)
# that allows the three components to be checked in a single comparison.
VER_TO_INT:=awk '{split(substr($$0, match ($$0, /[0-9\.]+/)), a, "."); print a[1]*10000+a[2]*100+a[3]}'
go_version_check:
	@echo "$(CGREEN)=> Go version check ...$(CEND)"
	@if test $(shell go version | $(VER_TO_INT) ) -lt \
  	$(shell echo "$(GO_VERSION_MIN)" | $(VER_TO_INT)); \
  	then printf "go version $(GO_VERSION_MIN)+ required, found: "; go version; exit 1; \
		else echo "go version check pass";	fi

# Code format
.PHONY: fmt
fmt: go_version_check
	@echo "$(CGREEN)=> Run gofmt on all source files ...$(CEND)"
	@echo "gofmt -l -s -w ..."
	@ret=0 && for d in $$(go list -f '{{.Dir}}' ./... | grep -v /vendor/); do \
		gofmt -l -s -w $$d/*.go || ret=$$? ; \
	done ; exit $$ret


.PHONY: race
race: export CGO_ENABLED=1
race: fmt
	@mkdir -p bin
ifeq (${app},)
	@bash build/app_build.sh
else
	@bash build/app_build.sh ${app}
endif

# build
.PHONY: build
build: export CGO_ENABLED=0
build: fmt
	@mkdir -p bin
ifeq (${app},)
	@bash build/app_build.sh
else
	@bash build/app_build.sh ${app}
endif

# sync release configs from source
.PHONY: sync-config
sync-config:
	@echo "$(CGREEN)=> Syncing configs to deployments/release/conf/...$(CEND)"
	@mkdir -p deployments/release/conf/personal-auth deployments/release/conf/personal-api deployments/release/conf/personal-core
	@cp apps/personal-auth/conf/etc/config.toml deployments/release/conf/personal-auth/config.toml
	@cp apps/personal-api/conf/etc/config.toml deployments/release/conf/personal-api/config.toml
	@cp apps/personal-core/conf/etc/config.toml deployments/release/conf/personal-core/config.toml
	@sed -i 's|127.0.0.1:2379|etcd:2379|g' deployments/release/conf/personal-*/config.toml
	@sed -i 's|127.0.0.1:3306|mysql:3306|g' deployments/release/conf/personal-*/config.toml
	@sed -i 's|127.0.0.1:6379|redis:6379|g' deployments/release/conf/personal-*/config.toml
	@sed -i 's|127.0.0.1:9000|minio:9000|g' deployments/release/conf/personal-*/config.toml
	@echo "$(CGREEN)=> Config sync done$(CEND)"

# docker
.PHONY: docker
docker: vendor
docker: fmt
ifeq (${app},)
	cp -f version deployments/version
	@bash build/docker_build.sh ${MAINVERSION} ${GITSHA} ${BUILDTIME}
	@echo "$(CGREEN)=> Building personal-web-admin...$(CEND)"
	@docker build --target prod -t ${REGISTRY}/${ACCOUNT}/personal-web-admin:${MAINVERSION} apps/personal-web-admin/. --build-arg MAINVERSION=${MAINVERSION} --build-arg GITSHA=${GITSHA} --build-arg BUILDTIME=${BUILDTIME}
	@echo "$(CGREEN)=> Build Success$(CEND)"
else ifeq (${app},personal-web-admin)
	@docker build --target prod -t ${REGISTRY}/${ACCOUNT}/${app}:${MAINVERSION} apps/${app}/. --build-arg MAINVERSION=${MAINVERSION} --build-arg GITSHA=${GITSHA} --build-arg BUILDTIME=${BUILDTIME}
else
	docker build --target prod -t ${REGISTRY}/${ACCOUNT}/${app}:${MAINVERSION} . --build-arg APPNAME=${app} --build-arg MAINVERSION=${MAINVERSION} --build-arg GITSHA=${GITSHA} --build-arg BUILDTIME=${BUILDTIME}
endif

# Compile protobuf
.PHONY: compile	
compile:
	@echo "$(CGREEN)=> Compile protobuf ...$(CEND)"
	@rm -rf lib/grpc/pb/* apps/personal-core/adapter/pb/*
	@bash scripts/protobuf_compile.sh

# clear
.PHONY: clear
clear:
	@echo "$(CGREEN)=> Clear ./bin...$(CEND)"
	@rm -rf bin/personal-*

# mod
.PHONY: mod
mod: export GO111MODULE=on
mod:
	@echo "$(CGREEN)=> go mod tidy$(CEND)"
	@go mod tidy

# vendor
.PHONY: vendor
vendor: export GO111MODULE=on
vendor:
	@echo "$(CGREEN)=> go mod vendor$(CEND)"
	@GOWORK=off go mod vendor

# push
.PHONY: push
push:
	@echo "$(CGREEN)=> docker push image$(CEND)"
	@bash scripts/docker_push.sh ${MAINVERSION}