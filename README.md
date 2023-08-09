# PubPub

## Monorepo approach

## Installing

Built using node `v18.16.0` (captured in `/.nvmrc`). Use [nvm](https://github.com/nvm-sh/nvm) to ensure you're using at least `18.16.0` before installing to avoid inconsistencies at the node level.

```
pnpm install
```

Individual packages (e.g. `core`) may have specific installation instruction in their associated READMEs.

## Developing

Your first time getting started with this repo, run

```
pnpm build
```

Running build first is important to make sure the any prebuild scripts run (e.g. Prisma generate), and to make sure packages have dist files ready for consumption. Dev scripts disable tsup clean to avoid clearing out the dist directory going forward to avoid race conditions where an app is looking for a package, but it's `dist` has just been cleaned out.

Afterwards, simply run:

```
pnpm dev
```

Use filters to select specific packages

```
pnpm dev --filter core    // Runs just the `core` packages dev script
pnpm dev --filter core... // Runs just the `core` package and its dependencies dev scripts
```
