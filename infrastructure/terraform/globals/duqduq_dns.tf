locals {
  duqduq_domain = "duqduq.org"
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
