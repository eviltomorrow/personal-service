#!/bin/bash

set -eo pipefail
#存放目录
backup_dir=/root/db
#数据库库名
db_name=personal_service
#日期命名
date_tag=`date +%Y%m%d`
#sql脚本名字
sqlfile=$db_name'_'$date_tag'.'sql
#压缩文件名字
zipfile=$sqlfile'.'zip
#备份
/usr/local/app/mysql/bin/mysqldump -h 127.0.0.1 -P 3306 -uroot -proot --databases $db_name > $backup_dir/$sqlfile 
#进行压缩并删除原文件
cd $backup_dir
zip -rq $zipfile $sqlfile
rm -rf $sqlfile
#定时清除文件，以访长期堆积占用磁盘空间(删除5天以前带有.zip文件)
find $backup_dir -mtime +5 -name '*.zip' -exec rm -rf {} \;



# 01 5 * * 2,3,4,5,6 cd /root/bash; ./db_backup.sh