# ECS Cluster Environment

## Dependencies

### State file bucket/config

You must have some way of storing terraform state files.
We use and recommend the s3 backend, but you can change
that configuration. See `./environments` for examples of
configuring backend.

We store our terraform state in an S3 bucket created by
the `./environments/global_aws` directory, which has an
interactive setup, see that readme for more info.

## Change management and workflows

This code is here to make infrastructure declarative rather than imperative.
It secondarily includes modularization to make it hard for configuration to drift
between preproduction / production or open source deployments.
These are two separate concerns.

Declarative code changes are still managed imperatively with `terraform apply`,
which can be made partially or fully automatic.

In general, production changes are applied manually after we are satisfied with
preproduction, which may or may not be automatic. Developers should  expect a flow like:

1. make a change to a shared module code
2. make matching change to configuration in ALL environment directories, so they can be reviewed together
3. apply this new SHA to staging and do validation as desired
4. apply this same SHA to production.

Now there is no drift between code, staging, and production - we are converged.

## Rollbacks

Generally, rollbacks are done in emergencies and are done first in prod. (If done first in staging, this is
really no different a process than a roll-forward).  Rollbacks are the only situation in which we should expect
to deploy production from an off-main branch. Changes may be infrastructure or code. In the infrastructure workflow:

1. make changes to terraform code that seems to fix  the issue and apply it  to production
2. if it resolves the issue, figure out how it needs to be applied to pre-prod  for consistency and open a PR
3. when  this PR is merged, it deploys to pre-prod and we are converged.

In general, code rollbacks can be done without a re-build, by deploying an old SHA, but it is preferable
if there is time, to do a revert & roll-forward flow,
because some operations (primarily database migrations) operate on assumptions of monotonic time. Additionally
this flow makes it easier for rollbacks to include reverts of  specific changes in the middle of the commit history
without reverting everything more recent.

## Adding/updating variables and configuration

Variables are the things that distinguish one environment from another. These include container variables and
certain extra values such as infrastructure scaling / footprint parameters. There is a tradeoff between ease
of configuration change and strength of guarantees given by similarity between staging and prod. First decide if
your change should be applied identically to each environment, or warrants an increase in drift.

To add a variable, modify some terraform resource that depends on it and then thread your way back up. The most
common case will be to add an environment variable to a container so will use that as example here:

1. modify `modules/deployment/main.tf` to add a variable to the appropriate invocation of `container-generic`.
1. modify `modules/deployment/variables.tf` to add the variable declaration. (This step is not needed if your new env var can be computed based on changes to the upstream infrastructure, such as a database URL.)
1. modify each invocation in `environments/*/main.tf` to add this new variable.

Proceed as above. Note that changes to task  definitions (which include container configs) are not actually applied until you then trigger a new `deploy` using `act`/`mask` or the Github console.

## Adding secrets

Secrets are a special variety of environment variable, whose process is just like the above but with an extra step after `terraform apply` and before `mask ecs deploy`:

To provide secrets to ECS containers, you should put them in AWS Secrets Manager.
To do this, replicate the setup in `modules/core-services/main.tf`: create a resource
that declares the existence of the secret. Since the purpose of this model is to
avoid having copies of the secrets exist anywhere persistently except the single
locked-down place, naturally the secret value itself (the "version") can't be passed through terraform.

So you must one-time only, or when changing the secret,

1. go to the AWS Secrets Manager console
2. and choose your new secret
3. select "Retrieve secret value" (unintuitive, because there is no value yet)
4. Console says "Value does not yet exist" and button you just clicked becomes "Set secret value".
5. Probably, paste your secret in the "plain text" box (you can also do key-value pairs, but then must use the key in the address when retrieving.)
