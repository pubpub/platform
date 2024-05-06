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
    lb_listener_arn = string
  })
}

variable "HONEYCOMB_API_KEY" {
  description = "API key for the honeycomb environment"
  type = string
  sensitive = true
}
