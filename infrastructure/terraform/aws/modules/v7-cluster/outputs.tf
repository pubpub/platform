locals {
  db_user = aws_db_instance.core_postgres.username
  db_name = aws_db_instance.core_postgres.db_name
  db_host = aws_db_instance.core_postgres.address
  db_sslmode = "require"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.pubpub_v7.repository_url
}

output "rds_db_password_id" {
  value = aws_secretsmanager_secret.rds_db_password.id
}

output "rds_connection_string_sans_password" {
  value = "postgresql://${local.db_user}@${local.db_host}:5432/${local.db_name}?sslmode=${local.db_sslmode}"
}

output "cluster_info" {
  value = {
    region = var.region
    name = var.name
    environment = var.environment
    cluster_arn = module.ecs_cluster.arn
    private_subnet_ids = aws_subnet.private.*.id
    container_security_group_ids = [aws_security_group.ecs_tasks.id]
    cloudwatch_log_group_name = aws_cloudwatch_log_group.ecs.name
    lb_target_group_arn = aws_lb_target_group.main.arn
  }
}
