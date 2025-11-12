######
##
##  Terraform-meta configurations
##
######

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }

    honeycombio = {
      source  = "honeycombio/honeycombio"
      version = ">= 0.22.0"
    }
  }
  backend "s3" {
    bucket = "pubpub-tfstates"
    key    = "ecs-stevie-PROD.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = local.region
}

######
##
##  Environment-specific configuration
##
######

locals {
  name        = "stevie"
  environment = "production"
  region      = "us-east-1"

  pubpub_hostname       = "app.pubpub.org"
  site_builder_hostname = "bob.pubpub.org" # get it, like the builder

  route53_zone_id = "Z00255803PJ09HVWNKPVY"
  ecr_repository_urls = {
    core         = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-core"
    jobs         = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-jobs"
    nginx        = "246372085946.dkr.ecr.us-east-1.amazonaws.com/nginx"
    root         = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7"
    site_builder = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-site-builder"
  }

  MAILGUN_SMTP_USERNAME = "v7@mg.pubpub.org"
  ASSETS_BUCKET_NAME    = "assets.app.pubpub.org"
  HOSTNAME              = "0.0.0.0"
  DATACITE_API_URL      = "https://api.datacite.org"
}


######
##
##  Complete generic environment
##
######

module "deployment" {
  source = "../../modules/deployment"

  name        = local.name
  environment = local.environment
  region      = local.region

  pubpub_hostname       = local.pubpub_hostname
  site_builder_hostname = local.site_builder_hostname
  route53_zone_id       = local.route53_zone_id
  ecr_repository_urls   = local.ecr_repository_urls

  MAILGUN_SMTP_USERNAME = local.MAILGUN_SMTP_USERNAME
  ASSETS_BUCKET_NAME    = local.ASSETS_BUCKET_NAME
  HOSTNAME              = local.HOSTNAME
  DATACITE_API_URL      = local.DATACITE_API_URL
}
