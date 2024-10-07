variable "cluster_info" {
  description = "infrastructure values output from v7-cluster"

  type = object({
    region                       = string
    name                         = string
    vpc_id                       = string
    cluster_arn                  = string
    environment                  = string
    private_subnet_ids           = list(string)
    container_security_group_ids = list(string)
    cloudwatch_log_group_name    = string
    lb_listener_arn              = string
    # service_namespace_arn = string
  })
}

variable "service_name" {
  description = "name for this service"
}

variable "repository_url" {
  description = "url to the image repository (excluding tag)"
  type        = string
}
variable "nginx_image" {
  description = "fully qualified nginx image to pull (including tag)"
  type        = string
  default     = null
}

variable "resources" {
  description = "resources available to this container service"
  type = object({
    cpu           = number
    memory        = number
    desired_count = number
  })

  default = {
    cpu           = 512
    memory        = 1024
    desired_count = 1
  }
}

variable "init_containers" {
  description = "list of init container specs to run before starting"
  type = list(object({
    name    = string
    image   = string
    command = list(string)
  }))
  default = []
}

variable "listener" {
  description = "specification of the inbound network addressibility"
  default     = null

  type = object({
    service_name = string
    # whether to expose this to inbound internet traffic
    public = bool
    # the path prefix for public routes from the ALB hostname
    # - MUST end in a slash.
    path_prefix = string
    # priority, in case this conflicts with other rules.
    # lower numbers are evaluated first, so more specific
    # should have lowest numbers.
    # 100 is a good default when no collision is expected.
    rule_priority = number

    from_port = number
    to_port   = number
    protocol  = string
  })
}

variable "configuration" {
  description = "Container configuration options"

  type = object({

    environment = list(object({
      name  = string
      value = string
    }))
    secrets = list(object({
      name      = string
      valueFrom = string
    }))
  })
}

variable "command" {
  description = "Command to run when the container starts. Overrides the CMD specified by the Dockerfile"
  default     = null
  type        = string
}
