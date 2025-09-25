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

  name        = var.name
  environment = var.environment
  region      = var.region

  pubpub_hostname = var.pubpub_hostname
  route53_zone_id = var.route53_zone_id

  container_ingress_port = 8080

  availability_zones = ["us-east-1a", "us-east-1c"]
}

module "core_dependency_services" {
  source = "../core-services"

  cluster_info           = module.cluster.cluster_info
  assets_bucket_url_name = var.ASSETS_BUCKET_NAME
}

locals {
  PUBPUB_URL       = "https://${var.pubpub_hostname}"
  SITE_BUILDER_URL = "https://${var.site_builder_hostname}"
}

module "service_core" {
  source = "../container-generic"

  service_name = "core"
  cluster_info = module.cluster.cluster_info

  repository_url    = var.ecr_repository_urls.core
  nginx_image       = "${var.ecr_repository_urls.nginx}:latest"
  health_check_path = "/api/health"

  listener = {
    service_name  = "core"
    public        = true
    path_prefix   = "/"
    rule_priority = 100
    from_port     = 3000
    to_port       = 3000
    protocol      = "tcp"
  }

  init_containers = [{
    name  = "migrations"
    image = "${var.ecr_repository_urls.root}:latest"
    command = [
      "pnpm", "--filter", "core", "migrate-docker",
    ]
  }]

  resources = {
    cpu           = 1024
    memory        = 2048
    desired_count = 1
  }

  configuration = {
    container_port = 3000
    environment = [
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
      { name = "PUBPUB_URL", value = local.PUBPUB_URL },
      { name = "HOSTNAME", value = var.HOSTNAME },
      { name = "DATACITE_API_URL", value = var.DATACITE_API_URL },
      { name = "VALKEY_HOST", value = module.core_dependency_services.valkey_host },
      { name = "SITE_BUILDER_ENDPOINT", value = local.SITE_BUILDER_URL }
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
      { name = "GCLOUD_KEY_FILE", valueFrom = module.core_dependency_services.secrets.gcloud_key_file },
      { name = "DATACITE_REPOSITORY_ID", valueFrom = module.core_dependency_services.secrets.datacite_repository_id },
      { name = "DATACITE_PASSWORD", valueFrom = module.core_dependency_services.secrets.datacite_password },
    ]
  }
}

module "service_flock" {
  source = "../container-generic"

  service_name = "jobs"
  cluster_info = module.cluster.cluster_info

  repository_url = var.ecr_repository_urls.jobs

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

module "service_bastion" {
  source = "../container-generic"

  service_name = "bastion"
  cluster_info = module.cluster.cluster_info

  repository_url = var.ecr_repository_urls.root
  # Make bastion idle indefinitely, so we can ssh into it when needed
  # If this is not here, the task will exit and try to restart immediately.
  # TODO: Maybe there's a less hacky way to do this?
  command = ["sh", "-c", "trap : TERM INT; sleep infinity & wait"]

  configuration = {
    environment = [
      { name = "PGUSER", value = module.core_dependency_services.rds_connection_components.user },
      { name = "PGDATABASE", value = module.core_dependency_services.rds_connection_components.database },
      { name = "PGHOST", value = module.core_dependency_services.rds_connection_components.host },
      { name = "PGPORT", value = module.core_dependency_services.rds_connection_components.port },
      { name = "HOSTNAME", value = var.HOSTNAME },
      { name = "PAGER", value = "less -S" },
      { name = "VALKEY_HOST", value = module.core_dependency_services.valkey_host }
    ]

    secrets = [
      { name = "PGPASSWORD", valueFrom = module.core_dependency_services.secrets.rds_db_password },

      # Bastion needs  supabase creds in case of seed script
      { name = "SUPABASE_SERVICE_ROLE_KEY", valueFrom = module.core_dependency_services.secrets.supabase_service_role_key },
    ]
  }

  resources = {
    cpu    = 1024
    memory = 2048 # need slightly beefier machine for the bastion

    # TODO: disable autoscaling, which makes no sense for a bastion
    desired_count = 1
  }
}

module "service_site_builder" {
  source = "../container-generic"

  service_name      = "site-builder"
  cluster_info      = module.cluster.cluster_info
  repository_url    = var.ecr_repository_urls.site_builder
  nginx_image       = "${var.ecr_repository_urls.nginx}:latest"
  health_check_path = "/health"

  listener = {
    service_name  = "site-builder"
    public        = true
    path_prefix   = "/"
    rule_priority = 100
    from_port     = 4000
    to_port       = 4000
    protocol      = "tcp"
  }

  configuration = {
    container_port = 4000

    environment = [
      { name = "PUBPUB_URL", value = local.PUBPUB_URL },
      { name = "PORT", value = 4000 },
      { name = "S3_ACCESS_KEY", value = module.core_dependency_services.asset_uploader_key_id },
      { name = "S3_BUCKET_NAME", value = var.ASSETS_BUCKET_NAME },
      { name = "S3_REGION", value = var.region },
      // don't need to set S3_ENDPOINT, if empty will use s3
    ]

    secrets = [
      { name = "S3_SECRET_KEY", valueFrom = module.core_dependency_services.secrets.asset_uploader_secret_key },
    ]
  }

  resources = {
    cpu           = 1024
    memory        = 2048
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

  cluster_info      = module.cluster.cluster_info
  HONEYCOMB_API_KEY = data.aws_secretsmanager_secret_version.honeycomb_api_key.secret_string
}
