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

variable "assets_bucket_url_name" {
  description = "Name for the asset bucket -- typically a domain like assets.v7.pubpub.org"
  type = string
}

# TODO: Possibly, this factoring could be improved
# by making it easier to deploy the Core without a honeycomb
# account.
variable "HONEYCOMB_API_KEY" {
  description = "API key for the honeycomb environment"
  type = string
  sensitive = true
}
