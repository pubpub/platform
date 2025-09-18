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
    key    = "ecs-blake.tfstate"
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
  name        = "blake"
  environment = "staging"
  region      = "us-east-1"

  pubpub_hostname       = "blake.duqduq.org"
  site_builder_hostname = "bob.duqduq.org" # get it, like the builder

  route53_zone_id = "Z059164612717GL8VGM95"
  ecr_repository_urls = {
    core         = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-core"
    jobs         = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-jobs"
    nginx        = "246372085946.dkr.ecr.us-east-1.amazonaws.com/nginx"
    root         = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7"
    site_builder = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-site-builder"
  }

  MAILGUN_SMTP_USERNAME = "v7@mg.pubpub.org"
  ASSETS_BUCKET_NAME    = "assets.blake.pubpub.org"
  HOSTNAME              = "0.0.0.0"
  DATACITE_API_URL      = "https://api.test.datacite.org"
}


######
##
##  Complete generic environment
##
######
