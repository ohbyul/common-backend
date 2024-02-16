#!/bin/sh

BASE_DIR="/home/urban"
PROJECT_DIR="stg-be-codipai-external"
PROJECT_NAME="stg-be-external"
PROJECT_RUN_FILE="./dist/main.js"


TODAY=`date +%y-%m-%d`

cd ${BASE_DIR}/${PROJECT_DIR}

echo "7. 배포 전 빌드 파일 백업"
tar -zcvf deploy_backup_$TODAY.tar ./dist ./node_modules 

echo "8. 서비스 중지"
pm2 stop ${PROJECT_NAME}

echo "9. 빌드 파일 제거"
rm -rf ./dist
rm -rf ./node_modules

echo "10. 배포 파일 압축풀기"
tar -zxvf deploy.tar

echo "10. 서비스 시작"
pm2 start ${PROJECT_RUN_FILE} --name ${PROJECT_NAME}
