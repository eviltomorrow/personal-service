#!/bin/bash

set -eo pipefail 

root_dir=$(pwd)
app_dir=${root_dir}/apps

registry="registry.cn-beijing.aliyuncs.com"
account="eviltomorrow"

for name in $(ls ${app_dir}); do
    if [ -e ${app_dir}/${name}/.docker_skip ]; then
        continue
    fi
    echo -e "\033[32m=> Building docker image(${name})...\033[0m"
    docker buildx build --platform linux/amd64 --target prod -t ${registry}/${account}/${name}:${1} . --build-arg APPNAME=${name} --build-arg MAINVERSION=${1} --build-arg GITSHA=${2} --build-arg BUILDTIME=${3} --load
    echo -e "\033[32m=> Build Success\033[0m"
done

