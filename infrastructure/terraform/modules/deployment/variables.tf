variable "region" {
  description = "AWS region shortname"
  type        = string
  default     = "us-east-1"
}

variable "name" {
  description = "Proper name for this environment"
  type        = string
}

variable "environment" {
  description = "Functional name for this environment"
  type        = string
}

variable "pubpub_hostname" {
  description = "hostname where pubpub will be addressable (DO NOT include https://)"
  type        = string
}

variable "site_builder_hostname" {
  description = "hostname where site builder will be addressable (DO NOT include https://)"
  type        = string
}

variable "route53_zone_id" {
  description = "Zone ID of route53 zone that is already configured as the NS for your subdomain"
  type        = string
}

variable "ecr_repository_urls" {
  description = "URLs for ECR repositories created at a global level"
  type = object({
    core         = string
    jobs         = string
    nginx        = string
    root         = string
    site_builder = string
  })
}

variable "MAILGUN_SMTP_USERNAME" {
  description = "SMTP Username for Mailgun service"
  type        = string
}

variable "MAILGUN_SMTP_HOST" {
  description = "SMTP Hostname for Mailgun service"
  type        = string
  default     = "smtp.mailgun.org"
}

variable "MAILGUN_SMTP_PORT" {
  description = "SMTP Network Port for Mailgun service"
  type        = string
  default     = "465"
}

variable "HOSTNAME" {
  description = "Hostname used by standalone Next app"
}

# TODO deprecate this in favor of a Terraformed bucket
variable "ASSETS_BUCKET_NAME" {
  description = "Name of the S3 bucket to store assets"
  type        = string
}

variable "DATACITE_API_URL" {
  description = "DataCite API URL used by the DataCite action to deposit pubs and allocate DOIs"
  type        = string
}
