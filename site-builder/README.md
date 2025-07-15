# Astro Site Builder Service

This service provides an API to build your Astro site and upload it to an S3-compatible storage service.

## Features

- REST API built with Hono to trigger builds
- Automatic upload to S3-compatible storage (MinIO, AWS S3, etc.)
- Dockerized for easy deployment
- Lightweight and fast web server

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

## Getting Started

### Environment Variables

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

Required environment variables:

- `S3_ACCESS_KEY`: S3 access key
- `S3_SECRET_KEY`: S3 secret key
- `S3_BUCKET_NAME`: S3 bucket name (default: astro-site)
- `COMMUNITY_SLUG`: Your community slug for data fetching

### Running with Docker Compose

1. Start the service:

```bash
docker-compose up -d
```

2. The service will be available at http://localhost:3000
3. MinIO console will be available at http://localhost:9001 (login with MINIO_ROOT_USER/MINIO_ROOT_PASSWORD)

### API Usage

#### Trigger a build

```bash
curl -X POST http://localhost:3000/build
```

Response:

```json
{
	"success": true,
	"message": "Build and upload completed successfully",
	"url": "http://localhost:9000/astro-site"
}
```

#### Health check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
	"status": "ok"
}
```

## Accessing the Built Site

After a successful build, your site will be available at:

```
http://localhost:9000/astro-site/
```

## Development

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the server:

```bash
npm start
```

### Building Docker Image Manually

```bash
docker build -t astro-site-builder .
```

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
