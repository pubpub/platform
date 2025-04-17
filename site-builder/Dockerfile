FROM node:22-alpine as base



RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}


FROM base as fetch-deps

# Copy pnpm-lock.yaml so that we can use pnpm to install dependencies
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Could possibly be sped up using `turbo prune` 
# https://turbo.build/repo/docs/guides/tools/docker
RUN pnpm fetch

# Install dependencies we only need to run pnpm install
RUN apk add g++ make py3-pip 

WORKDIR /app

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .


RUN pnpm --filter site-builder --prod deploy dist

FROM base as prod

COPY --from=fetch-deps /app/dist ./dist

# Expose the port our server will run on
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"] 