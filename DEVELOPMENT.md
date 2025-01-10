# Development

## Docker Compose

Docker-compose provides a means to run all the code components as containers. It has these advantages:

-   more realistically emulating the setting where this code is run in production.
-   less contamination of environment, so spurious failures (or successes) can be avoided.
-   easy to boot from nothing without system dependencies except Docker

With disadvantages:

-   doesn't support hot-reloading
-   slightly slower iteration due to `docker build` between runs

With these properties, this is useful for end-to-end tests and locally verifying that the code works when removed from some of the fast-iteration features of `next.js`, such as
JIT compilation. Because a `docker build` is needed to build the containers to run, hot-reloading is not available in this environment; so faster iteration
with `pnpm dev` is recommended until you are ready to run battery of tests or need to verify behavior in an isolated environment.

A slightly modified version of `.env.local` is required, where we remove the DATABASE_URL (this is built out of parts in docker envs):

```
grep -v DATABASE_URL \
    <./core/.env.local \
    >./.env.docker-compose
```

This cluster will address the local supabase and postgres just like when you are running with `pnpm dev`, so no need to take extra steps for migrations (though the same ones are needed).

To run the full cluster as local docker-compose, first initialize supabase as you would for development; then do:

```
docker compose -f docker-compose.dev.yml up
```

you can now address on `localhost:3000` as before. note that `pnpm dev` uses the same ports and cannot be running at the same time.

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

## Building and deploying for AWS environments

All change management to Knowledge Futures' production environment is done through github actions.
This environment runs on AWS ECS and leverages terraform to allow reproducible, parametric environments.

Services running in AWS ECS are scheduled using "Task Definitions", which are CRUDdy resources
including all details for a container. We don't want to tie code releases to terraform "infrastructure" changes,
but the service "declaration" relies on this Task Definition to exist.

Therefore based on community patterns we have seen, the flow is roughly this:

1. The infrastructure code in terraform declares a "template" Task Definition.
2. Terraform is told not to change the "service" based on changes to the Task Definition.
3. Any changes to the template will be picked up by the next deploy, which is done outside of Terraform.
4. Github Actions builds new containers on merge, and will use AWS-provided Actions to template the literal correct Task Definition and update the Service.

### Updating deployment topology and/or environment variables/container settings

To change "infrastructure settings", which include anything from networking to env vars,
make changes to `./infrastructure/terraform/aws`. Use `terraform apply` there to update
the infrastructure and/or Task Definition Template. See that directory for more info.

Then you must perform a Github Actions Deploy, either by pushing your changes to main or
with local `act` CLI.

### Updating container versions with github actions

The core automation workflow can be examined in [`awsdeploy.yml`](./.github/workflows/awsdeploy.yml)

There is a Dockerfile in this repository that builds a container for one package. You can use it like:

```
docker build \
            --platform linux/amd64 \
            --build-arg PACKAGE=core \
            --build-arg PACKAGE_DIR=core \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            .
```

Note how this matches the invocation used in the Actions workflow file.

We automatically build and push a container to AWS ECR with the github SHA as a tag.

### Using `act` to run the deploy events locally

If you need to build or validate a change and deploy to production, you can use the [`act` cli](https://github.com/nektos/act):

```
act \
    -W .github/workflows/awsdeploy.yml \
    --container-architecture linux/amd64 \
    --secret-file ~/.aws/pubpub.secrets \
    -j deploy
```

**AWS CLI access in `act`:**
When you setup `act` locally for the first time, you can choose whether to do a Small, Medium, or Large install.
The Large install is _very large_, but the medium install does not include the AWS CLI.

If you choose to work with the medium install, you will need to customize afterward by editing your `~/.actrc` file
to use an image that includes the AWS CLI, for example your .actrc might look like:

```
-P ubuntu-latest=eveships/act-plusplus:latest
-P ubuntu-22.04=catthehacker/ubuntu:full-22.04
-P ubuntu-20.04=catthehacker/ubuntu:full-20.04
-P ubuntu-18.04=catthehacker/ubuntu:full-18.04
```

**Secrets:** Though you will have an `~/.aws/credentials` file, this is not the format for secrets access that
`act` requires, so I copy the key-value pairs in that file into a file that matches the Github
secrets called `~/.aws/pubpub.secrets`:

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY...
```

**Dirty worktree:** If you run `act` like this, the image will be conveniently tagged with the latest SHA plus `-dirty`.
Images tagged with a SHA alone should be idempotently built, but `-dirty` can be changed/overwritten.

**TODO:**

-   [ ] allow deploying without a rebuild, so that a rollback is convenient
