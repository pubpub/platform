# Infrastructure operations for pubpub v7

<!-- build nginx container -->

## nginx:build

> Builds the nginx container used in AWS ECS for inbound traffic

<!-- A code block defines the script to be executed -->

```bash
echo "building Nginx container..."
docker build \
  --platform linux/amd64 \
  -t pubpub-v7-nginx:latest \
  ./nginx
```

## nginx:push

> Pushes the locally built latest nginx container

**OPTIONS**

-   region
    -   flags: -r --region
    -   type: string
    -   desc: Which AWS region to use (default us-east-1)

```bash
echo "Determining AWS Account ID..."

AWS_REGION=${region:-us-east-1}
AWS_ACCOUNT=$(
  aws sts get-caller-identity \
    --query Account \
    --output text
)
AWS_REGISTRY=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

echo "Logging docker daemon in to ECR"
aws ecr get-login-password \
  --region $AWS_REGION \
  | docker login \
      --username AWS \
      --password-stdin \
      $AWS_REGISTRY

echo "renaming container to ECR repository..."
docker tag \
  pubpub-v7-nginx:latest \
  $AWS_REGISTRY/nginx:latest

echo "pushing Nginx container..."
docker push \
  $AWS_REGISTRY/nginx:latest
```

## aws:tf:apply

> Runs the named infrastructure script interactively using the environment specified.

**OPTIONS**

-   proper_name
    -   flags: -n --proper-name
    -   type: string
    -   desc: proper name of AWS environment (see `./aws` module); e.g. blake
    -   required

```bash
(
    cd terraform/aws

    echo "checking for environment configuration files..."

    tf_var_file="./environments/${proper_name}/variables.tfvars"
    tf_secrets_file="./environments/${proper_name}/secrets.tfvars"

    if [ ! -f ${tf_var_file} ]; then
        echo "REQUIRED var file missing: ${tf_var_file}"
        exit 1
    fi

    if [ ! -f ${tf_secrets_file} ]; then
        echo "REQUIRED secrets file missing: ${tf_secrets_file}"
        exit 1
    fi

    echo "applying $proper_name from $(pwd)"

    terraform apply \
        -input=false \
        -var-file=${tf_var_file} \
        -var-file=${tf_secrets_file} \
)
```

## aws:tf:init

> Runs the initialization for the environment

**OPTIONS**

-   proper_name
    -   flags: -n --proper-name
    -   type: string
    -   desc: proper name of AWS environment (see `./aws` module); e.g. blake
    -   required

```bash

(
    cd terraform/aws
    echo "checking for environment configuration files..."

    tf_backend_file="./environments/${proper_name}/${proper_name}.s3.tfbackend"

    if [ ! -f ${tf_backend_file} ]; then
        echo "REQUIRED backend file missing: ${tf_backend_file}"
        exit 1
    fi

    terraform init \
        -backend-config ${tf_backend_file}
)
```

## aws:bastion

> Opens an interactive shell on the bastion container in AWS

**OPTIONS**

-   region
    -   flags: -r --region
    -   type: string
    -   desc: Which AWS region to use (default us-east-1)
-   proper_name
    -   flags: -n --proper-name
    -   type: string
    -   desc: proper name of AWS environment (see `./aws` module); e.g. blake
    -   required
-   environment
    -   flags: -e --environment
    -   type: string
    -   desc: environment name of AWS environment (see `./aws` module) e.g. staging
    -   required

```bash
AWS_REGION=${region:-us-east-1}

echo "fetching task ID of running bastion ..."
TASK=$(
    aws ecs \
      list-tasks \
      --region ${AWS_REGION} \
      --cluster ${proper_name}-ecs-cluster-${environment} \
      --service blake-bastion \
        | jq -r \
            '.taskArns[0]' \
        | cut \
            -d'/' \
            -f 3 \
)

echo "starting shell with task $TASK ..."
aws ecs \
  execute-command \
  --interactive \
  --command "/bin/sh" \
  --region ${AWS_REGION} \
  --container "bastion" \
  --cluster ${proper_name}-ecs-cluster-${environment} \
  --task $TASK
```
