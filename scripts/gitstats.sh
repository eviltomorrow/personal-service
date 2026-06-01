#!/bin/bash
# 统计每个作者的代码贡献

echo "开发者代码贡献统计:"
echo "=================="

# 获取所有作者
authors=$(git shortlog -sn --all | awk '{print $2 " " $3 " " $4}')

while read author; do
    if [ -n "$author" ]; then
        echo -e "\n作者: $author"
        
        # 统计提交次数
        commits=$(git log --all --author="$author" --oneline | wc -l)
        echo "提交次数: $commits"
        
        # 统计代码行数变化
        git log --all --author="$author" --pretty=tformat: --numstat | \
        awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "添加行数: %s, 删除行数: %s, 净增行数: %s\n", add, subs, loc }'
    fi
done <<< "$authors"
