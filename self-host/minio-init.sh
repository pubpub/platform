/usr/bin/mc alias set myminio http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}";
/usr/bin/mc mb --ignore-existing myminio/"${ASSETS_BUCKET_NAME}";
/usr/bin/mc anonymous set download myminio/"${ASSETS_BUCKET_NAME}";
/usr/bin/mc admin user add myminio "${ASSETS_UPLOAD_KEY}" "${ASSETS_UPLOAD_SECRET_KEY}";
/usr/bin/mc admin policy attach myminio readwrite --user "${ASSETS_UPLOAD_KEY}";