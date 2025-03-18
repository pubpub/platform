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

  pubpub_hostname = "blake.duqduq.org"
  route53_zone_id = "Z059164612717GL8VGM95"
  ecr_repository_urls = {
    core       = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-core"
    jobs       = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-jobs"
    nginx      = "246372085946.dkr.ecr.us-east-1.amazonaws.com/nginx"
    migrations = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-migrations"
  }

  MAILGUN_SMTP_USERNAME           = "v7@mg.pubpub.org"
  NEXT_PUBLIC_SUPABASE_URL        = "https://dsleqjuvzuoycpeotdws.supabase.co"
  NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGVxanV2enVveWNwZW90ZHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODIzNTE0MjEsImV4cCI6MTk5NzkyNzQyMX0.3HHC0f7zlFXP77N0U8cS3blr7n6hhjqdYI6_ciQJams"
  ASSETS_BUCKET_NAME              = "assets.blake.pubpub.org"
  HOSTNAME                        = "0.0.0.0"
  DATACITE_API_URL                = "https://api.test.datacite.org"
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

  pubpub_hostname     = local.pubpub_hostname
  route53_zone_id     = local.route53_zone_id
  ecr_repository_urls = local.ecr_repository_urls

  MAILGUN_SMTP_USERNAME           = local.MAILGUN_SMTP_USERNAME
  NEXT_PUBLIC_SUPABASE_URL        = local.NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = local.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY
  ASSETS_BUCKET_NAME              = local.ASSETS_BUCKET_NAME
  HOSTNAME                        = local.HOSTNAME
  DATACITE_API_URL                = local.DATACITE_API_URL
}
