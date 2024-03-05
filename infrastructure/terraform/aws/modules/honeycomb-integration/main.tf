locals {
  failure_logs_bucket_name = "pubpub-v7-${var.cluster_info.name}-${var.cluster_info.environment}-honeycomb-tf-integrations-failures"
}

# see https://github.com/terraform-aws-modules/terraform-aws-s3-bucket/tree/v4.1.0
module "firehose_failure_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket        = local.failure_logs_bucket_name
  force_destroy = true

  lifecycle_rule = [{
    id = "expiration-30-days"
    enabled = true
    expiration = {
      days = 30
    }
  }]
}

module "honeycomb-aws-cloudwatch-metrics-integration" {
  source = "honeycombio/integrations/aws//modules/cloudwatch-metrics"

  name = "${var.cluster_info.name}-${var.cluster_info.environment}-cw-metrics"

  honeycomb_api_key      = var.HONEYCOMB_API_KEY // Honeycomb API key.
  honeycomb_dataset_name = "cloudwatch-metrics" // Your Honeycomb dataset name that will receive the metrics.

  s3_failure_bucket_arn = module.firehose_failure_bucket.s3_bucket_arn
}

# see https://github.com/honeycombio/terraform-aws-integrations/tree/main/modules/cloudwatch-logs
module "honeycomb-aws-cloudwatch-logs-integration" {
  source = "honeycombio/integrations/aws//modules/cloudwatch-logs"

  name = "${var.cluster_info.name}-${var.cluster_info.environment}-cw-logs"

  #aws cloudwatch integration
  cloudwatch_log_groups = [var.cluster_info.cloudwatch_log_group_name] // CloudWatch Log Group names to stream to Honeycomb.
  s3_failure_bucket_arn = module.firehose_failure_bucket.s3_bucket_arn

  #honeycomb
  honeycomb_api_key      = var.HONEYCOMB_API_KEY // Honeycomb API key.
  honeycomb_dataset_name = "cloudwatch-logs" // Your Honeycomb dataset name that will receive the logs.
}
