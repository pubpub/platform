# Infrastructure operations for pubpub v7

This "Maskfile" is the code AND documentation for common operations
workflows in this `infrastructure` directory. The commands declared
here are automatically available as CLI commands when running [`mask`](https://github.com/jacobdeichert/mask)
in this directory.

To get started, install important command line tools:

`brew bundle`

Then you can call `mask --help` to see these commands in the
familiar command line help format. You can also modify the
invocations here when the required script changes, or copy & paste
the command parts as needed.

See the above-linked Mask repo for more info.

**Notes**

Terraform commands often read info from the local directory, so the
`mask` commands wrap the invocation in a subshell with `cd` to the
directory containing `.terraform`; this way, if the command exits nonzero,
your current shell is not contaminated/changed directory.

Both `act` commands (for container version updates) and `terraform` commands
(for infrastructure changes) require the AWS CLI to be configured locally.
Usually this means setting a file at `~/.aws/credentials` and `~/.aws/config`:
see https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

`terraform` commands for the `global` workspace require write-access API token
to Cloudflare. Since this is one of the highest-security-profile accounts, it
is not assumed all developers have access to this. To run these commands, set
`CLOUDFLARE_API_TOKEN` environment variable.

## tf

> Terraform-related commands to run in one workspace or another

### tf plan

> Runs the plan (diff showing) command interactively using the environment specified.

**OPTIONS**

-   proper_name
    -   flags: -n --proper-name
    -   type: string
    -   desc: proper name of AWS environment (see `./aws` module); e.g. blake
    -   required

<!-- A code block defines the script to be executed -->

```bash
(
    cd terraform/environments/${proper_name}

    export AWS_PAGER=""
    if aws sts get-caller-identity; then
        echo "AWS identity check succeeded."
    else
        echo "AWS CLI misconfigured; see maskfile.md for info"
        exit 1
    fi

    echo "showing env diff for $proper_name from $(pwd)"

    terraform plan \
        -input=false
)
```

### tf apply

> Runs the apply command interactively, still asking for confirmation, using the environment specified.

**OPTIONS**

-   proper_name
    -   flags: -n --proper-name
    -   type: string
    -   desc: proper name of AWS environment (see `./aws` module); e.g. blake
    -   required

<!-- A code block defines the script to be executed -->

```bash
(
    cd terraform/environments/${proper_name}

    export AWS_PAGER=""
    if aws sts get-caller-identity; then
        echo "AWS identity check succeeded."
    else
        echo "AWS CLI misconfigured; see maskfile.md for info"
        exit 1
    fi

    echo "applying $proper_name from $(pwd)"

    terraform apply \
        -input=false
)
```

### tf init

> Runs the initialization for the environment

**OPTIONS**

-   proper_name
    -   flags: -n --proper-name
    -   type: string
    -   desc: proper name of AWS environment (see `./aws` module); e.g. blake
    -   required

```bash

(
    cd terraform/environments/${proper_name}

    terraform init
)
```

## ecs

> commands that manage AWS containers

### ecs deploy:all

> Use `act` CLI to deploy all containers to a given SHA (or HEAD).

**OPTIONS**

-   image_tag_override
    -   flags: -t --tag
    -   type: string
    -   desc: ECR image tag to use for this deploy (usually a Git SHA; default HEAD)
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
( cd ..
    if [[ -z $image_tag_override ]]; then
        echo "Deploying HEAD ($(git rev-parse --dirty HEAD)) ... ensure this tag has been pushed!"
    else
        echo "Deploying override ($image_tag_override) ... ensure this tag has been pushed!"
    fi

    workflow_file=".github/workflows/awsdeploy.yml"

    echo "Procedure will follow workflow $workflow_file ..."
    act \
      -W "$workflow_file" \
      --container-architecture linux/amd64 \
      --input proper-name=${proper_name} \
      --input environment=${environment} \
      --input image-tag-override=${image_tag_override} \
      workflow_call

    echo "Deploy request complete! Visit AWS console to follow progress:"
    echo "https://console.aws.amazon.com/ecs/v2/clusters/${proper_name}-ecs-cluster-${environment}/services"
)
```

### ecs deploy:one

> Use `act` CLI to deploy ONE container/service to a given SHA (or HEAD).

**OPTIONS**

-   image_tag_override
    -   flags: -t --tag
    -   type: string
    -   desc: ECR image tag to use for this deploy (usually a Git SHA; default HEAD)
-   service
    -   flags: -s --service
    -   type: string
    -   desc: service name to update (example: core)
    -   required
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
( cd ..
    if [[ -z $image_tag_override ]]; then
        echo "Deploying HEAD ($(git rev-parse --dirty HEAD)) ... ensure this tag has been pushed!"
    else
        echo "Deploying override ($image_tag_override) ... ensure this tag has been pushed!"
    fi

    workflow_file=".github/workflows/deploy-template.yml"

    echo "Deploy will follow workflow $workflow_file ..."
    act \
      -W "$workflow_file" \
      --container-architecture linux/amd64 \
      --input proper-name=${proper_name} \
      --input environment=${environment} \
      --input service=${service} \
      --input image-tag-override=${image_tag_override} \
      workflow_call

    echo "Deploy request complete! Visit AWS console to follow progress:"
    echo "https://console.aws.amazon.com/ecs/v2/clusters/${proper_name}-ecs-cluster-${environment}/services"
)
```

### ecs build:all

> Use `act` CLI to build and push all containers with local code, tagged with the HEAD (or HEAD-dirty) SHA

No options are required -- the workflow infers them all.

**WARN**: `docker push` invocations will appear to freeze, but that is a display bug in `act`.

```bash

( cd ..
    workflow_file=".github/workflows/ecrbuild-all.yml"

    echo "This may take a few minutes, and output will not stream during upload ..."
    echo "Procedure will follow workflow $workflow_file ..."
    act \
      -W "$workflow_file" \
      --container-architecture linux/amd64 \
      workflow_call

    echo "Done!"
)
```

### ecs bastion

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
      --service ${proper_name}-bastion \
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

<!-- build nginx container -->

### ecs nginx:build

> Builds the nginx container used in AWS ECS for inbound traffic

```bash
echo "building Nginx container..."
docker build \
  --platform linux/amd64 \
  -t pubpub-v7-nginx:latest \
  ./nginx
```

### ecs nginx:push

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
