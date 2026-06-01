#!/bin/bash

set -eo pipefail

root_dir=$(pwd)

for name in $(ls ${root_dir}/apps); do
    if echo "${name}" | grep -q -E '\-web$'; then
        continue
    fi

    adapter_dir=${root_dir}/apps/${name}/adapter
    if [ ! -d "${adapter_dir}" ]; then
        continue
    fi

    proto_files=$(ls ${adapter_dir}/*.proto 2>/dev/null || true)
    if [ -z "${proto_files}" ]; then
        continue
    fi

    pb_dir=${adapter_dir}/pb
    rm -rf ${pb_dir}
    mkdir -p ${pb_dir}

    for proto in ${proto_files}; do
        protoc --proto_path="${root_dir}" \
            --go_opt=module=github.com/eviltomorrow/personal-service \
            --go_out="${root_dir}" \
            --go-grpc_opt=module=github.com/eviltomorrow/personal-service \
            --go-grpc_out="${root_dir}" \
            "${proto}"
        echo -e "编译文件: ${proto} => [\033[32m成功\033[0m] "
    done
done
