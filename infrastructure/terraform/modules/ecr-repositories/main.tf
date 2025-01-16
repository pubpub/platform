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


# ecr repositories for all containers
resource "aws_ecr_repository" "pubpub_v7" {
  name                 = "pubpub-v7"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}

resource "aws_ecr_repository" "pubpub_v7_core" {
  name                 = "pubpub-v7-core"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}

resource "aws_ecr_repository" "pubpub_v7_jobs" {
  name                 = "pubpub-v7-jobs"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}

# tiny image that just removes the a path prefix
resource "aws_ecr_repository" "nginx" {
  name                 = "nginx"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}

