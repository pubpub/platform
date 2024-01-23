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

