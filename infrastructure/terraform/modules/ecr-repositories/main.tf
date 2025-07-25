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

data "aws_ecr_lifecycle_policy_document" "default_policy" {
  rule {
    priority    = 1
    description = "Only keep 10 images at a time"

    selection {
      tag_status   = "any"
      count_type   = "imageCountMoreThan"
      count_number = 10
    }
  }
}

# ecr repositories for all containers
resource "aws_ecr_repository" "pubpub_v7" {
  name                 = "pubpub-v7"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}
resource "aws_ecr_lifecycle_policy" "pubpub_v7" {
  repository = aws_ecr_repository.pubpub_v7.name

  policy = data.aws_ecr_lifecycle_policy_document.default_policy.json
}
resource "aws_ecr_repository" "pubpub_v7_core" {
  name                 = "pubpub-v7-core"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}

resource "aws_ecr_lifecycle_policy" "pubpub_v7_core" {
  repository = aws_ecr_repository.pubpub_v7_core.name

  policy = data.aws_ecr_lifecycle_policy_document.default_policy.json
}

resource "aws_ecr_repository" "pubpub_v7_jobs" {
  name                 = "pubpub-v7-jobs"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}

resource "aws_ecr_lifecycle_policy" "pubpub_v7_jobs" {
  repository = aws_ecr_repository.pubpub_v7_jobs.name

  policy = data.aws_ecr_lifecycle_policy_document.default_policy.json
}

# tiny image that just removes the a path prefix
resource "aws_ecr_repository" "nginx" {
  name                 = "nginx"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}

resource "aws_ecr_lifecycle_policy" "nginx" {
  repository = aws_ecr_repository.nginx.name

  policy = data.aws_ecr_lifecycle_policy_document.default_policy.json
}
