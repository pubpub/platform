# aws terraform provider config

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  backend "s3" {
    # contents provided in NAME.s3.tfbackend
  }
}

provider "aws" {
  region = var.region
}

module "cluster" {
  source = "./modules/v7-cluster"

  name = var.name
  environment = var.environment
  region = var.region

  availability_zones = ["us-east-1a", "us-east-1c"]

  core_configuration = {
    container_port = 3000
    environment = {
      API_KEY = "undefined"
      JWT_SECRET = "undefined"
      MAILGUN_SMTP_USERNAME = "undefined"
      NEXT_PUBLIC_PUBPUB_URL = "undefined"
      NEXT_PUBLIC_SUPABASE_URL = "undefined"
      SENTRY_AUTH_TOKEN = "undefined"
      SUPABASE_SERVICE_ROLE_KEY = "undefined"
      SUPABASE_WEBHOOKS_API_KEY = "undefined"
    }
  }
}
