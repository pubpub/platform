variable "cluster_info" {
  description = "infrastructure values output from v7-cluster"

  type = object({
    region = string
    name = string
    vpc_id = string
    cluster_arn = string
    environment = string
    private_subnet_ids = list(string)
    container_security_group_ids = list(string)
    cloudwatch_log_group_name = string
    lb_target_group_arn = string
  })
}

variable "service_name" {
  description = "name for this service"
}

variable "repository_url" {
  description = "url to the image repository (excluding tag)"
}

variable "resources" {
  description = "resources available to this container service"
  type = object({
    cpu = number
    memory = number
    desired_count = number
  })

  default = {
    cpu = 512
    memory = 1024
    desired_count = 1
  }
}

variable "set_lb_target" {
  description = "whether this service is addressible from the main Load Balancer"
  type = bool
  default = false
}

variable "init_containers" {
  description = "list of init container specs to run before starting"
  type = list(object({
    name = string
    image = string
    command = list(string)
  }))
  default = []
}

variable "configuration" {
  description = "Container configuration options"

  type = object({
    container_port = number

    environment = list(object({
      name = string
      value = string
    }))
    secrets = list(object({
      name = string
      valueFrom = string
    }))
  })
}
