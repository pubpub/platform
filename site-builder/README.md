# Astro Site Builder Service

This service provides an API to build your Astro site and upload it to an S3-compatible storage service.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

## Getting Started

There are two "modes" to run this package in for development:

1. "Site mode": Running `pnpm site:dev` to run the Astro site in development mode, this is to actually construct the site and see the results in the browser
2. "Server mode": Running `pnpm server:dev` to run the server in development mode, this is to test the API and the site-building capabilities themselves.

When running in production we only run the server mode, we don't use Astro as a server.

Currently there is no seed in `core` that works properly with the site-builder.

You will need to import a community.

### Environment Variables

Use the `.env.development` and `.env.server.development` files as a baseline to set your environment variables.

You can set `.env.development.local` and `.env.server.development.local` to override the environment variables for local development.

### Running with Docker Compose

This is to test production-like behavior.

1. Start the service:

```bash
docker-compose up -d
```

2. The service will be available at http://localhost:4000
3. MinIO console will be available at http://localhost:9001 (login with MINIO_ROOT_USER/MINIO_ROOT_PASSWORD)
