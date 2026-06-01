#!/bin/bash
set -e

cd "$(dirname "$0")"
# shellcheck disable=SC1091
source ./profile
export DATA_HOME mysql_version redis_version minio_version

docker compose down
