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
}

# provider "aws" {
#   region = var.region
# }

module "cluster" {
  source = "../v7-cluster"

  name = var.name
  environment = var.environment
  region = var.region

  pubpub_hostname = var.pubpub_hostname

  route53_zone_id = var.route53_zone_id

  container_ingress_port = 8080

  availability_zones = ["us-east-1a", "us-east-1c"]
}

module "core_dependency_services" {
  source = "../core-services"

  cluster_info = module.cluster.cluster_info
  assets_bucket_url_name = var.ASSETS_BUCKET_NAME
}

locals {
  PUBPUB_URL = "https://${var.pubpub_hostname}"
}

module "service_core" {
  source = "../container-generic"

  service_name = "core"
  cluster_info = module.cluster.cluster_info

  repository_url = module.cluster.ecr_repository_urls.core
  nginx_image = "${module.cluster.ecr_repository_urls.nginx}:latest"

  listener = {
    service_name = "core"
    public = true
    path_prefix = "/"
    rule_priority = 100
    from_port = 3000
    to_port = 3000
    protocol = "tcp"
  }

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
      { name = "NEXT_PUBLIC_PUBPUB_URL", value = local.PUBPUB_URL },
      { name = "NEXT_PUBLIC_SUPABASE_URL", value = var.NEXT_PUBLIC_SUPABASE_URL },
      { name = "NEXT_PUBLIC_SUPABASE_PUBLIC_KEY", value = var.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY },
      { name = "PUBPUB_URL", value = local.PUBPUB_URL },
      { name = "SUPABASE_URL", value = var.NEXT_PUBLIC_SUPABASE_URL },
      { name = "SUPABASE_PUBLIC_KEY", value = var.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY },
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
  source = "../container-generic"

  service_name = "jobs"
  cluster_info = module.cluster.cluster_info

  repository_url = module.cluster.ecr_repository_urls.jobs

  configuration = {
    container_port = 3000
    environment = [
      { name = "PUBPUB_URL", value = local.PUBPUB_URL },
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

 module "service_intg_submissions" {
   source = "../container-generic"

   service_name = "integration-submissions"
   cluster_info = module.cluster.cluster_info

   repository_url = module.cluster.ecr_repository_urls.intg_submissions
  nginx_image = "${module.cluster.ecr_repository_urls.nginx}:latest"

   listener = {
     service_name = "submissions"
     public = true
     path_prefix = "/intg/submissions/"
     # lower number means this will be evaluated BEFORE the catch-all to core.
     rule_priority = 80
     from_port = 3000
     to_port = 3000
     protocol = "tcp"
   }

   configuration = {
     environment = [
       { name = "PUBPUB_URL", value = local.PUBPUB_URL },
     ]

     secrets = [
       { name = "SENTRY_AUTH_TOKEN", valueFrom = module.core_dependency_services.secrets.sentry_auth_token },
       { name = "API_KEY", valueFrom = module.core_dependency_services.secrets.api_key },
       { name = "HONEYCOMB_API_KEY", valueFrom = module.core_dependency_services.secrets.honeycomb_api_key },
     ]
   }
 }

 module "service_intg_evaluations" {
   source = "../container-generic"

   service_name = "integration-evaluations"
   cluster_info = module.cluster.cluster_info

   repository_url = module.cluster.ecr_repository_urls.intg_evaluations
  nginx_image = "${module.cluster.ecr_repository_urls.nginx}:latest"

   listener = {
     service_name = "evaluations"
     public = true
     path_prefix = "/intg/evaluations/"
     # these may not be equal, so just set it adjacent to non-conflicting rule for submissions
     rule_priority = 81
     from_port = 3000
     to_port = 3000
     protocol = "tcp"
   }

   configuration = {
     environment = [
       { name = "PUBPUB_URL", value = local.PUBPUB_URL },
     ]

     secrets = [
       { name = "SENTRY_AUTH_TOKEN", valueFrom = module.core_dependency_services.secrets.sentry_auth_token },
       { name = "API_KEY", valueFrom = module.core_dependency_services.secrets.api_key },
       { name = "HONEYCOMB_API_KEY", valueFrom = module.core_dependency_services.secrets.honeycomb_api_key },
     ]
   }
 }

 module "service_bastion" {
   source = "../container-generic"

   service_name = "bastion"
   cluster_info = module.cluster.cluster_info

   repository_url = module.cluster.ecr_repository_urls.root
   # TODO: add command

   configuration = {
     environment = [
       # { name = "DATABASE_URL", value = module.core_dependency_services.rds_connection_string_sans_password },
       { name = "PGUSER", value = module.core_dependency_services.rds_connection_components.user },
       { name = "PGDATABASE", value = module.core_dependency_services.rds_connection_components.database },
       { name = "PGHOST", value = module.core_dependency_services.rds_connection_components.host },
       { name = "PGPORT", value = module.core_dependency_services.rds_connection_components.port },
     ]

     secrets = [
       { name = "PGPASSWORD", valueFrom = module.core_dependency_services.secrets.rds_db_password },
     ]
   }

   resources = {
     cpu = 1024
     memory = 2048 # need slightly beefier machine for the bastion

     # TODO: disable autoscaling, which makes no sense for a bastion
     desired_count = 1
   }
 }


# N.B. This invocation means that the deployment including honeycomb cannot succeed
#   until after you have inserted the secret into the AWS console. This only happens
#   in this one case because with things like ECS, you can successfully "apply"
#   even if secrets are not present; the containers will simply fail to start.
#   However, this last section of TF code can be commented out for a first apply,
#   then go and insert secret in console, then reapply with this.
#
#   This is the result of an awkward design pattern, where instead of the
#   Honeycomb provider being configured to search for an API key in the env,
#   the modules themselves expect an API key as an inline var and fail if
#   it is not set. This is probably because the API keys are different for
#   different environments, rather than per account/user/etc.
data "aws_secretsmanager_secret_version" "honeycomb_api_key" {
  secret_id = module.core_dependency_services.secrets.honeycomb_api_key
}

module "observability_honeycomb_integration" {
  source = "../honeycomb-integration"

  cluster_info = module.cluster.cluster_info
  HONEYCOMB_API_KEY = data.aws_secretsmanager_secret_version.honeycomb_api_key.secret_string
}
