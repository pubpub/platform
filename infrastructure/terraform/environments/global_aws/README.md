# Global configurations

This module should generally be created by an admin,
and not applied or updated by a machine user.

## Creation of the terraform state bucket

1. Uncomment the code creating this bucket; comment the backend block
1. terraform init
1. Set the bucket name
1. terraform apply
1. `terraform state rm aws_s3_bucket.terraform_state`
1. comment the bucket definition; uncomment the backend block
1. terraform init ("yes" to copying the state file)
1. destroy local copies of the state file

This bucket name can now be in your s3.tfbackend files everywhere.

