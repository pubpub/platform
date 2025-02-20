locals {
  preview_name = "${var.name_prefix}-${var.pr_number}"
}

module "deployment" {
  source = "../deployment"

  name        = local.preview_name
  environment = "preview"
  region      = var.region

  pubpub_hostname     = "${var.pr_number}.preview.duqduq.org"
  route53_zone_id     = var.route53_zone_id
  ecr_repository_urls = var.ecr_repository_urls

  # Pass through the same config as staging
  MAILGUN_SMTP_USERNAME           = var.MAILGUN_SMTP_USERNAME
  NEXT_PUBLIC_SUPABASE_URL        = var.NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = var.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY
  ASSETS_BUCKET_NAME              = "${local.preview_name}.assets.duqduq.org"
  HOSTNAME                        = "0.0.0.0"
  DATACITE_API_URL                = "https://api.test.datacite.org"
}
