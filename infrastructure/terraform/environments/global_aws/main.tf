# aws terraform provider config

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 2.0"
    }

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  backend "s3" {
    bucket = "pubpub-tfstates"
    key    = "global.tfstate"
    region = "us-east-1"
  }
}


provider "aws" {
  region = "us-east-1"
}

## s3 bucket for terraform state
#
# This resource was created using terraform with these fields.
# However, it is dangerous to manage terraform state files in
# a bucket that is itself Terraform-configured.
#
# it has been removed with `terraform state rm`, but this
# declaration is left here for posterity.
#
#  resource "aws_s3_bucket" "terraform_state" {
#    bucket = "pubpub-tfstates"
#    acl    = "private"
#    versioning {
#      enabled = true
#    }
#  }

module "ecr_repositories" {
  source = "../../modules/ecr-repositories"
}
