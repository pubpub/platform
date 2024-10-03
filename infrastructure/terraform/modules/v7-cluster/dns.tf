module "alb_certificate" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 4.0"

  domain_name = var.pubpub_hostname
  zone_id     = var.route53_zone_id

  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.pubpub_hostname}",
  ]

  wait_for_validation = true

  tags = {
    Name        = var.pubpub_hostname
    Environment = var.environment
  }
}

resource "aws_route53_record" "alb" {
  zone_id = var.route53_zone_id
  name    = var.pubpub_hostname
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = false
  }
}
