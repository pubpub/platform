# Setup

In a `main.tf` file for a workspace that needs a cluster,
you can use this module like:

```
module "cluster" {
    source = "../path/to/this/directory"
    // version is disallowed when using path-based modules

    environment = "staging"
    region = "us-east-2"
    hosted_zone_id = "SOME-ZONE-ID"
    // all other variables are optional
}
```

then

```
terraform init
terraform apply
```

You will see these resources under `module.cluster.xyz`.

## Managing the ECS Task Definition

Working with ECS task definitions in Terraform
is kind of awkward.

This module creates an ECS task definition,
so that it can set up the ECS service that uses that task definition,
but expects that future task revisions will be created by a CI pipeline
as new images are created and pushed.
The `deploy_on_merge.yml` has an example of such a pipeline.
In this pipeline,
we get the ECS task definition from a file,
and interpolate the image,
to create a new revision.
Terraform ignores changes
made by the pipeline,
due to the `lifecycle` setting
on the ECS service resource.

If you make changes to the task definition resource in this module,
and run `terraform apply` in the `ecs-staging` directory,
Terraform will update the task,
but the next time a new commit is pushed to git,
that change will be overwritten
by the definition in the `ecs-staging` directory,
that's used by the pipeline.

Ideally these definitions would come from the same source
so if you're reading this
perhaps today is the day
to make that refactor!

More information about the general wonkiness
of managing ECS with Terraform
can be found in [this Terraform issue.](https://github.com/hashicorp/terraform-provider-aws/issues/632)

## Rotating the RDS Password

The RDS password is retrieved from AWS Secrets Manager
but that password is managed manually,
and rotating it requires downtime.

To rotate it, you'll need to perform the following steps:

- Update the value of the Secrets Manager entry through the AWS console
- Update the value in the RDS instance through the AWS console. (At this point, the core container will stop being able to access the database.)
- Recreate the core container's service with `aws update-service cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment`

In the future the RDS should probably [manage its own password](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html)
which will probably require changing the service's code
to fetch the password from Secrets Manager itself
rather than getting it passed in from an environment variable.

## Rotating the ACM Certificate

ACM issues certs that last for 1 year. They send you an email prior to renewing, but will automatically rotate the cert.

Since we rely on DNS validation, it is necessary that our validation CNAMEs are present in route53, provided by this module.
The required records MAY not change, but if they have changed behind the scenes, this will catch up our terraform state:

```bash
# from clean state , no changes to code

# updates our state file's records of the Domain Validation Options on the cert (DVOs).
terraform apply

# should show that new DNS records need to be created/updated, matching the DVOs.
terraform plan -out TMP.tfplan
terraform apply TMP.tfplan
```

For more info: see [AWS Docs](https://docs.aws.amazon.com/acm/latest/userguide/dns-renewal-validation.html).

## Development

When you change the resources in this directory, you must run `terraform apply` in the calling workspace to see changes.

More info on developing [terraform modules](https://developer.hashicorp.com/terraform/language/modules/develop).
