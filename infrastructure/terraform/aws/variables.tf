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
