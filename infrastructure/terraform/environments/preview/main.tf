terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  backend "s3" {
    bucket = "pubpub-tfstates"
    key    = "preview.tfstate"
    region = "us-east-1"
    # Workspaces will be automatically managed
  }
}

provider "aws" {
  region = local.region
}

# get the preview zone ID from the Cloudflare state
data "terraform_remote_state" "cloudflare" {
  backend = "s3"
  config = {
    bucket = "pubpub-tfstates"
    key    = "cloudflare.tfstate"
    region = "us-east-1"
  }
}

locals {
  region = "us-east-1"
  ecr_repository_urls = {
    core  = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-core"
    jobs  = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7-jobs"
    nginx = "246372085946.dkr.ecr.us-east-1.amazonaws.com/nginx"
    root  = "246372085946.dkr.ecr.us-east-1.amazonaws.com/pubpub-v7"
  }
  # use unique prefixes for all resources
  prefix = "preview-${var.pr_number}"
}

module "preview" {
  source = "../../modules/preview-environment"

  # all resources will be prefixed
  name_prefix         = local.prefix
  pr_number           = var.pr_number
  region              = local.region
  route53_zone_id     = data.terraform_remote_state.cloudflare.outputs.preview_zone_id
  ecr_repository_urls = local.ecr_repository_urls

  # Using same config as blake environment
  MAILGUN_SMTP_USERNAME           = "v7@mg.pubpub.org"
  NEXT_PUBLIC_SUPABASE_URL        = "https://dsleqjuvzuoycpeotdws.supabase.co"
  NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbGVxanV2enVveWNwZW90ZHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODIzNTE0MjEsImV4cCI6MTk5NzkyNzQyMX0.3HHC0f7zlFXP77N0U8cS3blr7n6hhjqdYI6_ciQJams"
}
