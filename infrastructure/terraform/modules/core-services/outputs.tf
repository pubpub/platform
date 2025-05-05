locals {
  db_user = aws_db_instance.core_postgres.username
  db_name = aws_db_instance.core_postgres.db_name
  db_host = aws_db_instance.core_postgres.address
}

output "secrets" {
  value = {
    api_key                   = aws_secretsmanager_secret.api_key.id
    asset_uploader_secret_key = aws_secretsmanager_secret.uploader_iam_secret_key.id
    rds_db_password           = aws_secretsmanager_secret.rds_db_password.id
    jwt_secret                = aws_secretsmanager_secret.jwt_secret.id
    honeycomb_api_key         = aws_secretsmanager_secret.honeycomb_api_key.id
    sentry_auth_token         = aws_secretsmanager_secret.sentry_auth_token.id
    supabase_service_role_key = aws_secretsmanager_secret.supabase_service_role_key.id
    supabase_webhooks_api_key = aws_secretsmanager_secret.supabase_webhooks_api_key.id
    mailgun_smtp_password     = aws_secretsmanager_secret.mailgun_smtp_password.id
    gcloud_key_file           = aws_secretsmanager_secret.gcloud_key_file.id
    datacite_repository_id    = aws_secretsmanager_secret.datacite_repository_id.id
    datacite_password         = aws_secretsmanager_secret.datacite_password.id
  }
}

output "asset_uploader_key_id" {
  value = aws_iam_access_key.asset_uploader.id
}

output "rds_connection_components" {
  value = {
    user     = local.db_user
    database = local.db_name
    host     = local.db_host
    port     = "5432"
    id       = aws_db_instance.core_postgres.id
  }
}

output "valkey_host" {
  value = aws_elasticache_replication_group.core_valkey.primary_endpoint_address
}
