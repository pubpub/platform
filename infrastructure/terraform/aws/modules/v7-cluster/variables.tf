variable "name" {
  description = "Familiar name of the stack"
  default     = "pubpub"
}

variable "environment" {
  description = "Name of the version/layer of the stack"
}

variable "cidr" {
  description = "The CIDR block for the VPC"
  default = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "a list of CIDRs for private subnets in the VPC, one for each availability zone"
  default     = ["10.0.128.0/20", "10.0.144.0/20"]
}

variable "public_subnets" {
  description = "a list of CIDRs for public subnets in the VPC, one for each availability zone"
  default     = ["10.0.0.0/20", "10.0.16.0/20"]
}

variable "availability_zones" {
  description = "a list of availability zones"
}

variable "region" {
  description = "Region for all resources (MUST agree with provider config)"
  default     = "us-east-1"
}

variable "core_configuration" {
  description = "Container configurations for `core`"
  sensitive = true

  type = object({
    container_port = number

    # This might become too cumbersome, but for now it is nice to
    # make the surface area clear everywhere
    environment = object({
      # DATABASE_URL = string
      API_KEY = string
      # ASSETS_REGION = string
      # ASSETS_UPLOAD_KEY = string
      # ASSETS_UPLOAD_SECRET_KEY = string
      JWT_SECRET = string
      MAILGUN_SMTP_USERNAME = string
      NEXT_PUBLIC_PUBPUB_URL = string
      NEXT_PUBLIC_SUPABASE_URL = string
      SENTRY_AUTH_TOKEN = string
      SUPABASE_SERVICE_ROLE_KEY = string
      SUPABASE_WEBHOOKS_API_KEY = string
    })
  })
}
