set -euxo pipefail

CI=true

npm i -g pnpm@8.7.0
pnpm install
pnpm p:build
pnpm --filter "$1" build