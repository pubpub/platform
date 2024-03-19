# Nginx sidecar for pubpub v7

This simple container runs nginx, listening on a port (typically 8080), and forwarding
all traffic to another host (typically 127.0.0.1:<service port>). In ECS, all containers
in the same task are hosted on the same network interface and therefore have the same IP.

### Building

This container is not built automatically since it changes so rarely. Unlike the other
services defined in this repo, the tasks are configured to refer to `latest` of this image.

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

### /legacy_healthcheck

This special route is present to prevent AWS ALB healthchecks from killing the
task which is fronted by this nginx. In general we should serve a genuine healthcheck
from all containers and forward rather than using this path.
