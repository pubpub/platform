# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

ARG NODE_VERSION=20.6.0
ARG PNPM_VERSION=8.14.3

ARG PACKAGE
ARG PORT=3000

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Install python deps for node-gyp
RUN apk add g++ make py3-pip

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

################################################################################
# Create a stage for building the application.
FROM base as monorepo
ARG PACKAGE

# Copy the rest of the source files into the image.
COPY . .

# Run the build script.
RUN pnpm install --frozen-lockfile
RUN pnpm p:build

RUN if [[ ! -z $PACKAGE ]]; \
    then \
      pnpm --filter $PACKAGE build ; \
      pnpm --filter $PACKAGE --prod deploy /tmp/app ; \
      cp core/next.docker.config.js /tmp/app/next.config.js ; \
      cp core/.env.docker /tmp/app/.env ; \
    fi

# Necessary, perhaps, due to https://github.com/prisma/prisma/issues/15852
RUN if [[ ${PACKAGE} == core ]]; \
    then \
      find . -path '*/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client' \
      | xargs -r -I{} sh -c " \
        rm -rf /tmp/app/{} && \
        mkdir -p /tmp/app/{} && \
        cp -a {}/. /tmp/app/{}/" ; \
    fi

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base AS app
ARG PORT

# # needed so that the CMD can use this var
# ENV PACKAGE=$PACKAGE

# Use production node environment by default.
ENV NODE_ENV production

# Copy package.json so that package manager commands can be used.
COPY --from=monorepo /tmp/app \
     ./

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE $PORT
# Run the application.
CMD pnpm start
