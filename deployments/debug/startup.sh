#!/bin/bash
set -e

cd "$(dirname "$0")"
# shellcheck disable=SC1091
source ./profile
export DATA_HOME mysql_version redis_version minio_version

mkdir -p "${DATA_HOME}"/{etcd/data,mysql/data,redis/data,minio/data}

docker network inspect net-personal &>/dev/null || docker network create net-personal

docker compose up -d
