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

# variable "container_port" {
#   description = "The port the containers are listening on"
#   default     = 5050
# }
#
# variable "container_environment" {
#   description = "Environment variables for the containers"
#   default = []
# }
#
# variable "health_check_path" {
#   description = "The path for the health check"
#   default     = "/v1/debug/health"
# }
#
# variable "hosted_zone_id" {
#   description = "The ID of the hosted zone for the domain"
# }
#
# variable "subdomain" {
#   description = "Prefix to domain name of hosted zone above, so serve app from"
# }

variable "region" {
  description = "Region for all resources (MUST agree with provider config)"
  default     = "us-east-1"
}

variable "container_ingress_port" {
  description = "port to allow traffic in private security group"
  type = number
}

variable "pubpub_hostname" {
  description = "domain name where this will be served by ALB"
  type = string
}

variable "route53_zone_id" {
  description = "Zone ID of route53 zone that is already configured as the NS for your subdomain"
  type = string
}
