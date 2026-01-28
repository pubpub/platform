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

resource "aws_secretsmanager_secret" "gcloud_key_file" {
  name = "gcloud-key-file-${var.cluster_info.name}-${var.cluster_info.environment}"
}

resource "aws_secretsmanager_secret" "datacite_repository_id" {
  name = "datacite-repository-id-${var.cluster_info.name}-${var.cluster_info.environment}"
}

resource "aws_secretsmanager_secret" "datacite_password" {
  name = "datacite-password-${var.cluster_info.name}-${var.cluster_info.environment}"
}

# generate password and make it accessible through aws secrets manager
resource "random_password" "rds_db_password" {
  length  = 16
  special = false
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
  subnet_ids = var.cluster_info.private_subnet_ids

  tags = {
    Name = "subnet group for ECS RDS instances"
  }
}

resource "aws_security_group" "ecs_tasks_rds_instances" {
  name   = "${var.cluster_info.name}-sg-rds-${var.cluster_info.environment}"
  vpc_id = var.cluster_info.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = 5432
    to_port         = 5432
    security_groups = var.cluster_info.container_security_group_ids
  }
}

resource "aws_elasticache_subnet_group" "core_valkey" {
  name       = "${var.cluster_info.name}-core-valkey-${var.cluster_info.environment}"
  subnet_ids = var.cluster_info.private_subnet_ids

  tags = {
    Name = "subnet group for core valkey cache instances"
  }
}

resource "aws_security_group" "core_valkey" {
  name   = "${var.cluster_info.name}-sg-core-valkey-${var.cluster_info.environment}"
  vpc_id = var.cluster_info.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = 6379
    to_port         = 6379
    security_groups = var.cluster_info.container_security_group_ids
  }
}

# cache service for core app
resource "aws_elasticache_replication_group" "core_valkey" {
  replication_group_id = "${var.cluster_info.name}-core-valkey-${var.cluster_info.environment}"
  description          = "Core cache instance"
  node_type            = "cache.t4g.medium"
  engine               = "valkey"
  subnet_group_name    = aws_elasticache_subnet_group.core_valkey.name

  num_cache_clusters   = 1
  parameter_group_name = "default.valkey8"
  port                 = 6379
  security_group_ids   = [aws_security_group.core_valkey.id]
}

# resource "aws_elasticache_parameter_group" "core_valkey" {
#   name   = "core-valkey-params"
#   family = "valkey8"
#   parameter {
#   }
# }

# the actual database instance
resource "aws_db_instance" "core_postgres" {
  identifier             = "${var.cluster_info.name}-core-postgres-${var.cluster_info.environment}"
  allocated_storage      = 20
  db_name                = "${var.cluster_info.name}_${var.cluster_info.environment}_core_postgres"
  db_subnet_group_name   = aws_db_subnet_group.ecs_dbs.name
  engine                 = "postgres"
  engine_version         = "14"
  instance_class         = "db.t3.small"
  vpc_security_group_ids = [aws_security_group.ecs_tasks_rds_instances.id]
  username               = var.cluster_info.name
  password               = random_password.rds_db_password.result
  parameter_group_name   = "default.postgres14"

  backup_retention_period   = 7
  backup_window             = "03:00-04:00"
  maintenance_window        = "mon:04:00-mon:05:00"
  copy_tags_to_snapshot     = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.cluster_info.name}-core-postgres-${var.cluster_info.environment}-final-snapshot"
}

# see https://github.com/terraform-aws-modules/terraform-aws-s3-bucket/tree/v4.1.0
module "assets_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  block_public_acls        = false
  block_public_policy      = false
  ignore_public_acls       = false
  restrict_public_buckets  = false
  bucket                   = var.assets_bucket_url_name
  control_object_ownership = true
  object_ownership         = "ObjectWriter"
  acl                      = "public-read"

  cors_rule = [{
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET", "HEAD", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag", "Location"]
    max_age_seconds = 3000
  }]

  lifecycle_rule = [
    {
      id      = "expire-temporary"
      enabled = true
      filter = {
        prefix = "temporary/"
      }
      expiration = {
        days = 90
      }
  }]
}

# cloudfront for serving static sites from s3
# sites are uploaded to the assets bucket under the /sites prefix
resource "aws_cloudfront_origin_access_control" "sites" {
  name                              = "${var.cluster_info.name}-sites-oac-${var.cluster_info.environment}"
  description                       = "OAC for static sites"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "sites" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "Static sites distribution for ${var.cluster_info.name}-${var.cluster_info.environment}"

  origin {
    domain_name              = module.assets_bucket.s3_bucket_bucket_regional_domain_name
    origin_id                = "S3-sites"
    origin_path              = "/sites"
    origin_access_control_id = aws_cloudfront_origin_access_control.sites.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-sites"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # custom error response for spa-style routing (serve index.html for 404s)
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.cluster_info.name}-sites-${var.cluster_info.environment}"
    Environment = var.cluster_info.environment
  }
}

# bucket policy to allow cloudfront access to sites prefix
resource "aws_s3_bucket_policy" "sites_cloudfront_access" {
  bucket = module.assets_bucket.s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.assets_bucket.s3_bucket_arn}/sites/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.sites.arn
          }
        }
      },
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${module.assets_bucket.s3_bucket_arn}/*"
      }
    ]
  })
}

# TODO: replace this with a role-based system for ECS containers
resource "aws_iam_user" "asset_uploader" {
  name = "${var.cluster_info.name}-${var.cluster_info.environment}-asset-uploader"
  path = "/"
}

resource "aws_iam_access_key" "asset_uploader" {
  user = aws_iam_user.asset_uploader.name
}

data "aws_iam_policy_document" "asset_uploads" {
  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:PutObjectTagging", "s3:GetObjectTagging", "s3:DeleteObject"]
    effect    = "Allow"
    resources = ["${module.assets_bucket.s3_bucket_arn}/*"]
  }
}
resource "aws_iam_policy" "asset_uploads" {
  name        = "${var.cluster_info.name}-${var.cluster_info.environment}-asset-uploader"
  description = "Allow core app to manage files in the assets bucket"
  policy      = data.aws_iam_policy_document.asset_uploads.json
}

resource "aws_iam_user_policy_attachment" "attachment_asset_uploader" {
  user       = aws_iam_user.asset_uploader.name
  policy_arn = aws_iam_policy.asset_uploads.arn
}

resource "aws_secretsmanager_secret" "uploader_iam_secret_key" {
  name = "asset-uploader-secret-key-${var.cluster_info.name}-${var.cluster_info.environment}"
}

resource "aws_secretsmanager_secret_version" "uploader_iam_secret_key" {
  secret_id     = aws_secretsmanager_secret.uploader_iam_secret_key.id
  secret_string = aws_iam_access_key.asset_uploader.secret
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
resource "aws_secretsmanager_secret" "mailgun_smtp_password" {
  name = "mailgun-smtp-password-${var.cluster_info.name}-${var.cluster_info.environment}"
}
