variable "name_prefix" {
  description = "Prefix to add to all resource names"
  type        = string
}

variable "pr_number" {
  description = "The PR number this preview is for"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 zone ID for DNS records"
  type        = string
}

variable "ecr_repository_urls" {
  description = "URLs for ECR repositories"
  type = object({
    core  = string
    jobs  = string
    nginx = string
    root  = string
  })
}

variable "MAILGUN_SMTP_USERNAME" {
  type = string
}

variable "NEXT_PUBLIC_SUPABASE_URL" {
  type = string
}

variable "NEXT_PUBLIC_SUPABASE_PUBLIC_KEY" {
  type = string
} 
