# Quick Install

Local development requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) to be installed and running on your machine.

To setup the development environment, run:

```
pnpm dev:setup
```

Choose yes on prompted questions.

This will

1. Install dependencies
2. Start a postgres docker container on port 54322
3. Start an inbucket docker container on port 54324 (for receiving emails)
4. Build all the dependencies once
5. Run the database migrations

With this, you should be all setup.

Then, start the dev server with

```
pnpm -w run dev
```

It's somewhat important to run the dev server from the root (the `-w` flag) such that at least the jobs runners are also running.

# Running

After install you can start the dev server with

```
pnpm run dev
```

## Folder structure

- `/actions` Configuration/lib for the action framework.
- `/app` The Next.JS [app directory](https://nextjs.org/docs/app/building-your-application/routing).
- `/lib` Functions that are re-used in multiple locations throughout the codebase. Akin to a `/utils` folder.
- `/seed` Commands for seeding the db
- `/kysely` Config and functions for using Kysely
- `/public` Static files that will be publicly available at `https://[URL]/<filename>`.
- `/playwright` End-to-end tests

## Authentication

We are using [Lucia](https://github.com/lucia-auth/lucia) for authentication.

It is a very minimal session-based authentication system.

See [core/lib/authentication/README.md](core/lib/authentication/README.md) for more information.

# Testing

## Playwright (E2E)

```bash
cd core
cp .env.development .env.production.local

pnpm playwright:test
```

You can also run the tests in `dev` mode, which is faster as you don't have to build the app before running the tests, but more flaky.

```bash
pnpm playwright:test:dev
```

You can also see what `playwright` is doing by running `pnpm playwright:ui` or `pnpm playwright:ui:dev`.
