# aws terraform provider config

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
  assets_bucket_url_name = var.ASSETS_BUCKET_NAME
  HONEYCOMB_API_KEY = var.HONEYCOMB_API_KEY
}

module "service_core" {
  source = "./modules/container-generic"

  service_name = "core"
  cluster_info = module.cluster.cluster_info

  repository_url = module.cluster.ecr_repository_urls.core

  set_lb_target = true

  init_containers = [{
    name = "migrations"
    image = "${module.cluster.ecr_repository_urls.root}:latest"
    command = [
      "pnpm", "--filter", "core", "migrate-docker",
    ]
  }]

  configuration = {
    container_port = 3000
    environment = [
      # { name = "DATABASE_URL", value = module.core_dependency_services.rds_connection_string_sans_password },
      { name = "PGUSER", value = module.core_dependency_services.rds_connection_components.user },
      { name = "PGDATABASE", value = module.core_dependency_services.rds_connection_components.database },
      { name = "PGHOST", value = module.core_dependency_services.rds_connection_components.host },
      { name = "PGPORT", value = module.core_dependency_services.rds_connection_components.port },
      { name = "ASSETS_REGION", value = var.region },
      { name = "ASSETS_BUCKET_NAME", value = var.ASSETS_BUCKET_NAME },
      { name = "ASSETS_UPLOAD_KEY", value = module.core_dependency_services.asset_uploader_key_id },
      { name = "MAILGUN_SMTP_USERNAME", value = var.MAILGUN_SMTP_USERNAME },
      { name = "MAILGUN_SMTP_HOST", value = var.MAILGUN_SMTP_HOST },
      { name = "MAILGUN_SMTP_PORT", value = var.MAILGUN_SMTP_PORT },
      { name = "NEXT_PUBLIC_PUBPUB_URL", value = var.pubpub_url },
      { name = "NEXT_PUBLIC_SUPABASE_URL", value = var.NEXT_PUBLIC_SUPABASE_URL },
      { name = "NEXT_PUBLIC_SUPABASE_PUBLIC_KEY", value = var.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY },
    ]

    secrets = [
      { name = "PGPASSWORD", valueFrom = module.core_dependency_services.secrets.rds_db_password },
      { name = "API_KEY", valueFrom = module.core_dependency_services.secrets.api_key },
      { name = "JWT_SECRET", valueFrom = module.core_dependency_services.secrets.jwt_secret },
      { name = "ASSETS_UPLOAD_SECRET_KEY", valueFrom = module.core_dependency_services.secrets.asset_uploader_secret_key },

      { name = "SENTRY_AUTH_TOKEN", valueFrom = module.core_dependency_services.secrets.sentry_auth_token },
      { name = "SUPABASE_WEBHOOKS_API_KEY", valueFrom = module.core_dependency_services.secrets.supabase_webhooks_api_key },
      { name = "SUPABASE_SERVICE_ROLE_KEY", valueFrom = module.core_dependency_services.secrets.supabase_service_role_key },
      { name = "HONEYCOMB_API_KEY", valueFrom = module.core_dependency_services.secrets.honeycomb_api_key },
      { name = "MAILGUN_SMTP_PASSWORD", valueFrom = module.core_dependency_services.secrets.mailgun_smtp_password },
    ]
  }
}

module "service_flock" {
  source = "./modules/container-generic"

  service_name = "jobs"
  cluster_info = module.cluster.cluster_info

  repository_url = module.cluster.ecr_repository_urls.jobs

  configuration = {
    container_port = 3000
    environment = [
      { name = "PUBPUB_URL", value = var.pubpub_url },
      { name = "PGUSER", value = module.core_dependency_services.rds_connection_components.user },
      { name = "PGDATABASE", value = module.core_dependency_services.rds_connection_components.database },
      { name = "PGHOST", value = module.core_dependency_services.rds_connection_components.host },
      { name = "PGPORT", value = module.core_dependency_services.rds_connection_components.port },
    ]

    secrets = [
      { name = "PGPASSWORD", valueFrom = module.core_dependency_services.secrets.rds_db_password },
      { name = "API_KEY", valueFrom = module.core_dependency_services.secrets.api_key },
      { name = "HONEYCOMB_API_KEY", valueFrom = module.core_dependency_services.secrets.honeycomb_api_key },
    ]
  }
}

module "observability_honeycomb_integration" {
  source = "./modules/honeycomb-integration"

  cluster_info = module.cluster.cluster_info
  HONEYCOMB_API_KEY = var.HONEYCOMB_API_KEY
}
