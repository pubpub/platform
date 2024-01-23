output "ecr_repository_url" {
  value = aws_ecr_repository.pubpub_v7.repository_url
}

output "rds_db_password_id" {
  value = aws_secretsmanager_secret.rds_db_password.id
}
