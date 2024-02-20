variable "region" {
  description = "AWS region shortname"
  type = string
  default = "us-east-1"
}

variable "name" {
  description = "Proper name for this environment"
  type = string
}

variable "environment" {
  description = "Functional name for this environment"
  type = string
}

variable "pubpub_url" {
  description = "URL where pubpub will be addressable (include https://)"
  type = string
}

variable "MAILGUN_SMTP_USERNAME" {
  description = "SMTP Username for Mailgun service"
  type = string
}

variable "NEXT_PUBLIC_SUPABASE_URL" {
  description = "URL to Supabase public address for this install"
  type = string
}
variable "NEXT_PUBLIC_SUPABASE_PUBLIC_KEY" {
  description = "Supabase anon public key"
  type = string
}

# TODO deprecate this in favor of a Terraformed bucket
variable "ASSETS_BUCKET_NAME" {
  description = "Name of the S3 bucket to store assets"
  type = string
}

# TODO: deprecate this in favor of terraformed iam/service roles
variable "ASSETS_UPLOAD_KEY" {
  description = "AWS access key ID for uploading to s3"
  type = string
}
