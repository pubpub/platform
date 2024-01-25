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

  container_ingress_port = 3000

  availability_zones = ["us-east-1a", "us-east-1c"]
}

module "service_core" {
  source = "./modules/ecs-service"

  service_name = "core"
  cluster_info = module.cluster.cluster_info


  repository_url = module.cluster.ecr_repository_url

  configuration = {
    container_port = 3000
    environment = [
      {name = "API_KEY", value = "undefined"},
      {name = "JWT_SECRET", value = "undefined"},
      {name = "MAILGUN_SMTP_USERNAME", value = "undefined"},
      {name = "NEXT_PUBLIC_PUBPUB_URL", value = "undefined"},
      {name = "NEXT_PUBLIC_SUPABASE_URL", value = "undefined"},
      {name = "SENTRY_AUTH_TOKEN", value = "undefined"},
      {name = "SUPABASE_SERVICE_ROLE_KEY", value = "undefined"},
      {name = "SUPABASE_WEBHOOKS_API_KEY", value = "undefined"},
    ]
  }
}
