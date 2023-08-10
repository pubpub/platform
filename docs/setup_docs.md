---
title: Setup
---

# Documentation Setup

## Installation
1. Clone the [v7 repo](https://github.com/pubpub/V7)
1. Install pnpm, likely `npm install -g pnpm`, or else follow [pnpm's instructions](https://pnpm.io/installation)
1. Run `pnpm install` in the `/docs` directory, this will install only [VitePress](https://vitepress.dev/) to the `docs` workspace.

## Development
1. Run `pnpm run docs:dev` in the `/docs` workspace to start up vitepress dev server. The docs site will be visible locally at something like [`localhost:5173`](localhost:5173).
1. Per the rewrites in `/docs/.vitepress/config.ts`, files named with the convention `[supplementary_name]_docs.md` will be rewritten into routes which drop the `docs` portion of the file, e.g. `/integrations/datacite/datacite_docs.md
