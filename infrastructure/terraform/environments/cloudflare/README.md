# Global Cloudflare configuration

This module should generally be created by an admin,
and assumees the following permissions which are sensitive:

**Cloudflare read-write token** set at `CLOUDFLARE_API_TOKEN`. In general, this
secret can be used for very nefarious things and should be extra sensitively protected.

**AWS read-write permissions**: in `~/.aws/credentials`. see `../maskfile.md` for more info.

## Relationship to AWS environments

AWS environments assume existence of the Route53 zone and DNS NS records that refer authority
to that zone. If you are not using Cloudflare this module is not needed for those environments,
but in general to create a new env it is expected to augment this module with NS records referring
to this route53 configuration for domains subordinate to that new AWS env.

Therefore updates to this module, which should happen very infrequently, should be applied before
you attempt to create the new AWS-ECS environment, otherwise that will fail due to the AWS Certificate
Manager being unsuccessful in validating your ownership of the DNS.
