#!/bin/bash

image_list=$(docker images | grep -v REPOSITORY | awk '{print $1":"$2}' | grep 'registry.cn-beijing.aliyuncs.com/eviltomorrow/' | grep ":$1")
for name in ${image_list}; do
    docker push ${name}
done
