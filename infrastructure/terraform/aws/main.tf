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

module "core_dependency_services" {
  source = "./modules/core-services"

  cluster_info = module.cluster.cluster_info
}

module "service_core" {
  source = "./modules/ecs-service"

  service_name = "core"
  cluster_info = module.cluster.cluster_info

  repository_url = module.cluster.ecr_repository_urls.core

  configuration = {
    container_port = 3000
    environment = [
      { name = "DATABASE_URL", value = module.core_dependency_services.rds_connection_string_sans_password },
      { name = "ASSETS_REGION", value = var.region },
      { name = "ASSETS_BUCKET_NAME", value = var.ASSETS_BUCKET_NAME },
      { name = "ASSETS_UPLOAD_KEY", value = var.ASSETS_UPLOAD_KEY },
      { name = "NEXT_PUBLIC_PUBPUB_URL", value = var.pubpub_url },
      { name = "MAILGUN_SMTP_USERNAME", value = var.MAILGUN_SMTP_USERNAME },
      { name = "NEXT_PUBLIC_SUPABASE_URL", value = var.NEXT_PUBLIC_SUPABASE_URL },
    ]

    secrets = [
      { name = "DATABASE_PASSWORD", valueFrom = module.core_dependency_services.rds_db_password_id },
      { name = "API_KEY", valueFrom = module.core_dependency_services.api_key_secret_id },
    ]
  }
}

module "service_flock" {
  source = "./modules/ecs-service"

  service_name = "jobs"
  cluster_info = module.cluster.cluster_info

  repository_url = module.cluster.ecr_repository_urls.jobs

  configuration = {
    container_port = 3000
    environment = [
      {name = "PUBPUB_URL", value = var.pubpub_url },
      {name = "DATABASE_URL", value = module.core_dependency_services.rds_connection_string_sans_password },
      # Secrets - TODO move these to aws secrets
    ]

    secrets = [
      { name = "DATABASE_PASSWORD", valueFrom = module.core_dependency_services.rds_db_password_id },
      { name = "API_KEY", valueFrom = module.core_dependency_services.api_key_secret_id },
    ]
  }
}
