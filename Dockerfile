# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

ARG NODE_VERSION=20.17.0

ARG PACKAGE
ARG PORT=3000

ARG PNPM_VERSION=9.10.0

# this is necessary in order to be able to build the test image with 
# something other than `alpine` as the base image
# in order to be able to run `playwright` tests
ARG BASE_IMAGE=alpine

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-${BASE_IMAGE} as base

# these are necessary to be able to use them inside of `base`
ARG BASE_IMAGE
ARG PNPM_VERSION


ENV dependencies="g++ make py3-pip ca-certificates curl postgresql"
# Install python deps for node-gyp and postgres

RUN if [[ ${BASE_IMAGE} == alpine ]]; then \
  apk add ${dependencies}; \
  else \
  apt update && apt install -y python3 curl postgresql make g++; \
  fi


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

################################################################################
# Create a stage for building the application.
FROM base as monorepo

# if booting without a command, just sit and wait forever for a term signal
CMD exec /bin/sh -c "trap : TERM INT; sleep infinity & wait"

# # Copy pnpm-lock.yaml so that we can use pnpm to install dependencies
# COPY ./pnpm-lock.yaml ./

# RUN pnpm fetch 

ADD . ./

RUN pnpm install -r --frozen-lockfile

RUN pnpm p:build

################################################################################
# FROM fetch-deps as monorepo


################################################################################
FROM monorepo AS withpackage

WORKDIR /usr/src/app

ARG PACKAGE

RUN test -n "$PACKAGE" || (echo "PACKAGE  not set, required for this target" && false)

ENV DOCKERBUILD=1

RUN pnpm --filter $PACKAGE build 

# Necessary, perhaps, due to https://github.com/prisma/prisma/issues/15852
# RUN if [[ ${PACKAGE} == core ]]; \
#   then \
#   find . -path '*/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client' \
#   | xargs -r -I{} sh -c " \
#   rm -rf /tmp/app/{} && \
#   mkdir -p /tmp/app/{} && \
#   cp -a {}/. /tmp/app/{}/" ; \
#   fi

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


FROM prod-setup AS next-app-integration-submissions
WORKDIR /usr/src/app
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/submissions/.next/standalone .
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/submissions/.next/static ./integrations/evaluations/.next/static
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/submissions/public ./integrations/evaluations/public


CMD node integrations/submissions/server.js

FROM prod-setup AS next-app-integration-evaluations
WORKDIR /usr/src/app
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/evaluations/.next/standalone ./
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/evaluations/.next/static ./integrations/submissions/.next/static
COPY --from=withpackage --chown=node:node /usr/src/app/integrations/evaluations/public ./integrations/submissions/public

CMD node integrations/evaluations/server.js

FROM prod-setup AS next-app-core
WORKDIR /usr/src/app
COPY --from=withpackage --chown=node:node /usr/src/app/core/.next/standalone ./
COPY --from=withpackage --chown=node:node /usr/src/app/core/.next/static ./core/.next/static
COPY --from=withpackage --chown=node:node /usr/src/app/core/public ./core/public

CMD node core/server.js

################################################################################
# Create the final image for next apps
# FROM next-app-${PACKAGE} as next-app

# ARG PORT

# # Use production node environment by default.
# ENV NODE_ENV production

# # Run the application as a non-root user.
# USER node

# # Expose the port that the application listens on.
# EXPOSE $PORT

# # Use production node environment by default.
# ENV NODE_ENV production

# CMD server.js

################################################################################
# to be used in `docker-compose.test.yml`
FROM monorepo as test-setup

RUN pnpm --filter core prisma generate

# install playwright
RUN pnpm --filter core exec playwright install chromium --with-deps 
