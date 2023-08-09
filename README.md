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

### Turborepo race conditions

We currently have a race condition where dev will sometimes fail because we can't specify the order of dependency builds. Tied to the fact that we clean out the dist folder on build, but upstream packages are watching dist.

-   https://github.com/vercel/turbo/discussions/1299?sort=top?sort=top
-   https://github.com/vercel/turbo/issues/460

`core` depends on `ui` which depends on `utils`. `utils` often takes longer to build than it does for `ui` to start building, which causes an error to be thrown because `utils` d.ts file has been cleared out during its build and hasn't been replaced yet. This generates an error, but is quick to resolve, so doesn't break actual dev work from beginning. It does make the console output messier though.
