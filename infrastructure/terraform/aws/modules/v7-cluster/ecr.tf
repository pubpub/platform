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

resource "aws_ecr_repository" "pubpub_v7_intg_submissions" {
  name                 = "pubpub-v7-integration-submissions"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false # can set this to true if we want
  }
}
