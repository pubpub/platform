# ECS Cluster Environment

## Dependencies

### State file bucket/config

You must have some way of storing terraform state files.
We use and recommend the s3 backend, but you can change
that configuration. In order to keep this code generic, however,
we omit the specific bucket config.

You can fill in your own backend config in a file such as
`demo-env.s3.tfbackend` and supply this config on command-line:

```bash
terraform init -backend-config=demo-env.s3.tfbackend
```

This file is only needed for `terraform init`. Once that is done,
you don't need to supply the backend config to `terraform plan/apply`.
If you need to change the backend, update this file and `init` again.

### Vars file

the module exposes its configuration area, but those configurations
need to be supplied at plan/apply time using the flag `-var-file=demo-env.tfvars`.

## Adding secrets

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
