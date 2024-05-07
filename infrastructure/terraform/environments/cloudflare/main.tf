# aws terraform provider config

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 2.0"
    }

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  backend "s3" {
    bucket = "pubpub-tfstates"
    key    = "cloudflare.tfstate"
    region = "us-east-1"
  }
}


provider "aws" {
  region = "us-east-1"
}

######
#
## Configuration of routing from Cloudflare to Route53.
#
######

locals {
  duqduq_domain = "duqduq.org"
  pubpub_domain = "pubpub.org"
}

data "cloudflare_zone" "duqduq" {
  name = local.duqduq_domain
}

resource "aws_route53_zone" "duqduq" {
  name = local.duqduq_domain
}

# do this for all subdomains of duqduq that need to be NS'd to v7
resource "cloudflare_record" "ns" {
  for_each = toset(["0", "1", "2", "3"])
  type    = "NS"

  zone_id = data.cloudflare_zone.duqduq.id

  name    = "blake.${local.duqduq_domain}"

  value   = aws_route53_zone.duqduq.name_servers[tonumber(each.key)]
}


data "cloudflare_zone" "pubpub" {
  name = local.pubpub_domain
}

resource "aws_route53_zone" "pubpub" {
  name = local.pubpub_domain
}
resource "cloudflare_record" "ns_pubpub" {
  for_each = toset(["0", "1", "2", "3"])
  type    = "NS"

  zone_id = data.cloudflare_zone.pubpub.id

  name    = "app.${local.pubpub_domain}"

  value   = aws_route53_zone.pubpub.name_servers[tonumber(each.key)]
}
