<img src="./core/app/icon.svg" width="32px">

# PubPub

PubPub is a publishing platform for community review of digital artifacts. The platform enables teams to orchestrate the tailored process they need to meet the complex demands of communicating knowledge. Over 4,000 knowledge-sharing communities use PubPub to publish books, articles, journals, open educational resources, and other documents.

## Development

This repo is built as a monorepo that holds first-party components of PubPub. There are three primary sections:

```
root
├── core/
├── integrations/
├── packages/
└── ...
```

-   `core` holds the primary app that is hosted on `v7.pubpub.org`.
-   `integrations` holds the integrations developed by the PubPub team. 3rd party integrations may be developed and hosted elsewhere.
-   `packages` holds libraries and npm packages that are used by `core`, `integrations`, and 3rd party integration developers.

To avoid inconsistencies and difficult-to-track errors, we specify a particular version of node in `/.nvmrc` (currently `v18.16.0`). Please use [nvm](https://github.com/nvm-sh/nvm) to ensure you're using the same version.

All following commands are run from the root of this package.

To get started, run:

```
pnpm install
pnpm build
```

Running build when getting started with this repo is important to make sure the any prebuild scripts run (e.g. Prisma generate).

Depending on which app or package you are doing work on, you may need to create a .env.local file. See each package's individual README.md file for further details.

To run all packages in the monorepo workspace, simply run:

```
pnpm dev
```

Often, you'll only want to run a specific package's dev script. In that case, use pnpm [filters](https://pnpm.io/filtering):

```
pnpm dev --filter core    // Runs just the `core` packages dev script
pnpm dev --filter core... // Runs just the `core` package and its dependencies dev scripts
```

Note that the term following `--filter` is the name of the package as specified in `package.json`, not the folder name (even though those may sometimes be identical).

You can also use [filters](https://pnpm.io/filtering) to run package-specific commands, by placing the `--filter` flag before the script name:

```
pnpm --filter core reset
pnpm --filter core migrate-dev
```

## Prettier

At the moment, the repo simply uses prettier before adding any additional complexity with ESLint configs. Just auto-format (either on save, or on commit), and let the .prettierrc hold the small subset of decisions.

For a nicer DX, bind `Format Document` to a familiar keyboard shortcut so you can format the doc as you go (similar to format-on-save and then saving frequently).

## Git Hooks

Two hooks are defined using `husky` and stored in `.husky`.

-   The first runs Prettier on commit
-   The second runs a type-check before pushing. Since our deployment setup builds on each push, the intent here is to not trigger a build with known type errors.

Sometimes you want to push up changes even though there is a type error. To do so, include `--no-verify` at the end of your command. For example: `git push origin main --no-verify`.

## Turborepo race conditions

We currently have a race condition where dev will sometimes fail because we can't specify the order of dependency builds. Tied to the fact that we clean out the dist folder on build, but upstream packages are watching dist.

-   https://github.com/vercel/turbo/discussions/1299?sort=top?sort=top
-   https://github.com/vercel/turbo/issues/460

`core` depends on `ui` which depends on `utils`. `utils` often takes longer to build than it does for `ui` to start building, which causes an error to be thrown because `utils` d.ts file has been cleared out during its build and hasn't been replaced yet. This generates an error, but is quick to resolve, so doesn't break actual dev work from beginning. It does make the console output messier though.
