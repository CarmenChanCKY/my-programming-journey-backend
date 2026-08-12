#!/bin/sh

echo "Initializing RDS Database if not exists..."

# 1. 透過 MYSQL_PWD 防止特殊字元被 Shell 轉譯
export MYSQL_PWD="$DB_PASSWORD"
mariadb -h "$DB_HOST" -u "${DB_USER:-admin}" -P "${DB_PORT:-3306}" --ssl=0 < init_db_aws.sql || echo "DB Init script failed or already executed"

echo "Running Better Auth database migrations..."
npx @better-auth/cli migrate --config ./dist/index.js --yes

echo "Creating admin account..."
DISABLE_SIGN_UP=false node dist/create-admin.js || echo "Admin creation skipped (may already exist)"

echo "Starting backend server..."
exec node dist/index.js