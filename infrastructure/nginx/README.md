# Nginx sidecar for pubpub v7

This simple container runs nginx, listening on a port (typically 8080), and forwarding
all traffic to another host (typically 127.0.0.1:<service port>). In ECS, all containers
in the same task are hosted on the same network interface and therefore have the same IP.

The specific reason this container is needed in Pubpub-v7 is that:

1. we have one DNS name that serves the whole application, which is backed by multiple ECS containers.
2. these containers are routed to based on path prefixes.
3. the container code, served by Next.js, is not itself aware of these path prefixes, so expect requests at `/`.
4. ALBs support path-based routing, but does not modify the requests.

So we introduce nginx as a mediator to strip out the path prefixes.

### Quirks

The nginx configuration in this directory is automatically templated in by nginx because
of where it lives in `templates` directory -- you can run this container and look for the
`include` directive in the default `/etc/nginx/nginx.conf`.

The syntax of rewrite rules is nuanced. Some subtleties, such as the slash in `/$1`, are
required for edge cases like when the path prefix is exactly `/`.

#### /legacy_healthcheck

The `/legacy_healthcheck` path is present to prevent ALB healthchecks, which can't be turned
off, from killing containers if we have not yet written a healthcheck endpoint. Generally,
we should implement a real, no-auth healthcheck endpoint that meaningfully indicates health
and serve it at `/healthcheck` in application code, so it is handled by the `$NGINX_PREFIX`
location block.

### Building & change management

This container is not built automatically since it changes so rarely. Unlike the other
services defined in this repo, the tasks are configured to refer to `latest` of this image.

The following commands are captured in the [`maskfile.md`](../maskfile.md) infrastructure
control convenience.

If you need to update it but don't want to set up more automation, you can run this:

```bash
AWS_REGION=us-east-1 # set region
AWS_ACCOUNT=$(
  aws sts get-caller-identity \
    --query Account \
    --output text
)
AWS_REGISTRY=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# may need to sign in to ECR on your workstation
aws ecr get-login-password \
  --region $AWS_REGION \
  | docker login \
      --username AWS \
      --password-stdin \
      $AWS_REGISTRY

docker build --platform linux/amd64 -t $AWS_REGISTRY/nginx:latest . # path to this directory
docker push $AWS_REGISTRY/nginx:latest
```
