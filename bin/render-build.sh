set -euxo pipefail

npm i -g pnpm@8.7.0
pnpm install; pnpm --filter "$1"... build