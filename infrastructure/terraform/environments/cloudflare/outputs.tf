output "route53_zones" {
  value = {
    "pubpub.org" = aws_route53_zone.pubpub.zone_id
    "duqduq.org" = aws_route53_zone.duqduq.zone_id
  }
}
