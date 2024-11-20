# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

ARG NODE_VERSION=20.17.0

ARG PACKAGE
ARG PORT=3000

ARG PNPM_VERSION=9.10.0


################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# these are necessary to be able to use them inside of `base`
ARG BASE_IMAGE
ARG PNPM_VERSION


# Instll dependencies we need at the end
RUN apk add ca-certificates curl postgresql

# Setup RDS CA Certificates
RUN curl -L \
  -o  /usr/local/share/ca-certificates/rds-global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  && update-ca-certificates

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
  npm install -g pnpm@${PNPM_VERSION}


FROM base as fetch-deps


# Copy pnpm-lock.yaml so that we can use pnpm to install dependencies
COPY pnpm-lock.yaml ./

# Could possibly be sped up using `turbo prune` 
# https://turbo.build/repo/docs/guides/tools/docker
RUN pnpm fetch

# Install dependencies we only need to run pnpm install
RUN apk add g++ make py3-pip 

################################################################################
# Create a stage for building the application.
FROM fetch-deps as monorepo

# Copy over the rest of the files
ADD . ./

# Install from the fetched store
RUN pnpm install -r --prefer-offline

RUN pnpm p:build

################################################################################
FROM monorepo AS withpackage

WORKDIR /usr/src/app

ARG PACKAGE

RUN test -n "$PACKAGE" || (echo "PACKAGE  not set, required for this target" && false)

ENV DOCKERBUILD=1

RUN pnpm --filter $PACKAGE build 

FROM withpackage as prepare-jobs

ARG PACKAGE

RUN pnpm --filter $PACKAGE --prod deploy /tmp/app


FROM base as jobs

WORKDIR /usr/src/app

COPY --from=prepare-jobs --chown=node:node /tmp/app .

USER node

CMD pnpm start

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
# this is separated by package to make it slightly more clear what happens
# and because you cannot conditionally copy from a different folder
# based on the argument (because e.g. `integration-submissions` does not match `integrations/submissions`, so we can't just use PACKAGE as the arg)
# we do the condiiton instead by doing a conditional $FROM
FROM base as prod-setup
ARG PORT

# Use production node environment by default.
ENV NODE_ENV production

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE $PORT

# Use production node environment by default.
ENV NODE_ENV production

# otherwise it will use the strange default docker hostname
ENV HOSTNAME "0.0.0.0"

### Core

FROM prod-setup AS next-app-core
WORKDIR /usr/src/app
COPY --from=withpackage --chown=node:node /usr/src/app/core/.next/standalone ./
COPY --from=withpackage --chown=node:node /usr/src/app/core/.next/static ./core/.next/static
COPY --from=withpackage --chown=node:node /usr/src/app/core/public ./core/public
# needed to set the database url correctly based on PGHOST variables
COPY --from=withpackage --chown=node:node /usr/src/app/core/.env.docker ./core/.env

CMD node core/server.js

### Integration Submissions

FROM prod-setup AS next-app-integration-submissions
WORKDIR /usr/src/app
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/submissions/.next/standalone .
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/submissions/.next/static ./integrations/submissions/.next/static
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/submissions/public ./integrations/submissions/public
# needed to set the database url correctly based on PGHOST variables
COPY --from=withpackage --chown=node:node /usr/src/app/core/.env.docker ./integrations/submissions/.env

CMD node integrations/submissions/server.js

### Integration Evaluations

FROM prod-setup AS next-app-integration-evaluations
WORKDIR /usr/src/app
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/evaluations/.next/standalone ./
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/evaluations/.next/static ./integrations/evaluations/.next/static
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/evaluations/public ./integrations/evaluations/public
# needed to set the database url correctly based on PGHOST variables
COPY --from=withpackage --chown=node:node /usr/src/app/core/.env.docker ./integrations/evaluations/.env

CMD node integrations/evaluations/server.js

