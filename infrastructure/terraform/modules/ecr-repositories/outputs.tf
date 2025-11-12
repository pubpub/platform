output "ecr_repository_urls" {
  value = {
    core             = aws_ecr_repository.pubpub_v7_core.repository_url
    jobs             = aws_ecr_repository.pubpub_v7_jobs.repository_url
    site-builder     = aws_ecr_repository.pubpub_v7_site_builder.repository_url
    nginx            = aws_ecr_repository.nginx.repository_url
    root             = aws_ecr_repository.pubpub_v7.repository_url
  }
}

