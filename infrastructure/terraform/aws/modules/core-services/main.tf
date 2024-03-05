# aws terraform provider config

terraform {
  required_version = ">= 0.12.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

# Static secrets
resource "random_password" "api_key" {
  length           = 32
  special          = true
  override_special = "-_.~!#$&'()*+,/:;=?@[]"
}

resource "aws_secretsmanager_secret" "api_key" {
  name = "api-key-${var.cluster_info.name}-${var.cluster_info.environment}"
}

resource "aws_secretsmanager_secret_version" "api_key" {
  secret_id     = aws_secretsmanager_secret.api_key.id
  secret_string = random_password.api_key.result
}

resource "aws_secretsmanager_secret" "honeycomb_api_key" {
  name = "honeycombio-apikey-${var.cluster_info.name}-${var.cluster_info.environment}"
}

# N.B. since we have to tell terraform about this secret in order to
#   configure the Honeycomb module, we might as well set it up automatically
#   for Secrets Manager too. This pattern is not ideal design on the part of
#   Honeycomb.
resource "aws_secretsmanager_secret_version" "honeycomb_api_key" {
  secret_id     = aws_secretsmanager_secret.honeycomb_api_key.id
  secret_string = var.HONEYCOMB_API_KEY
}

# generate password and make it accessible through aws secrets manager
resource "random_password" "rds_db_password" {
  length           = 16
  special          = false
}

resource "aws_secretsmanager_secret" "rds_db_password" {
  name = "rds-db-password-${var.cluster_info.name}-${var.cluster_info.environment}"
}

resource "aws_secretsmanager_secret_version" "password" {
  secret_id     = aws_secretsmanager_secret.rds_db_password.id
  secret_string = random_password.rds_db_password.result
}

# network config
resource "aws_db_subnet_group" "ecs_dbs" {
  name       = "${var.cluster_info.name}_ecs_db_${var.cluster_info.environment}"
  subnet_ids         = var.cluster_info.private_subnet_ids

  tags = {
    Name = "subnet group for ECS RDS instances"
  }
}

resource "aws_security_group" "ecs_tasks_rds_instances" {
  name = "${var.cluster_info.name}-sg-rds-${var.cluster_info.environment}"
  vpc_id = var.cluster_info.vpc_id

  ingress {
    protocol = "tcp"
    from_port = 5432
    to_port = 5432
    security_groups = var.cluster_info.container_security_group_ids
  }
}

# the actual database instance
resource "aws_db_instance" "core_postgres" {
  identifier                  = "${var.cluster_info.name}-core-postgres-${var.cluster_info.environment}"
  allocated_storage           = 20
  db_name                     = "${var.cluster_info.name}_${var.cluster_info.environment}_core_postgres"
  db_subnet_group_name        = aws_db_subnet_group.ecs_dbs.name
  engine                      = "postgres"
  engine_version              = "14"
  instance_class              = "db.t3.small"
  vpc_security_group_ids      = [aws_security_group.ecs_tasks_rds_instances.id]
  username                    = var.cluster_info.name
  password                    = random_password.rds_db_password.result
  parameter_group_name        = "default.postgres14"
  skip_final_snapshot         = true

}

## Secrets that must be put into AWS Secrets manager by hand
resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "jwt-secret-${var.cluster_info.name}-${var.cluster_info.environment}"
}
resource "aws_secretsmanager_secret" "sentry_auth_token" {
  name = "sentry-auth-token-${var.cluster_info.name}-${var.cluster_info.environment}"
}
resource "aws_secretsmanager_secret" "supabase_service_role_key" {
  name = "supabase-service-role-key-${var.cluster_info.name}-${var.cluster_info.environment}"
}
resource "aws_secretsmanager_secret" "supabase_webhooks_api_key" {
  name = "supabase-webhooks-api-key-${var.cluster_info.name}-${var.cluster_info.environment}"
}
