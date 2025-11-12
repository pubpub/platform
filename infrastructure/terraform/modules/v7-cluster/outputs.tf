output "cluster_info" {
  value = {
    region      = var.region
    name        = var.name
    vpc_id      = aws_vpc.main.id
    environment = var.environment
    cluster_arn                  = module.ecs_cluster.arn
    private_subnet_ids           = aws_subnet.private.*.id
    container_security_group_ids = [aws_security_group.ecs_tasks.id]
    cloudwatch_log_group_name    = aws_cloudwatch_log_group.ecs.name
    lb_listener_arn              = aws_lb_listener.main.arn
    alb_dns_name                 = aws_lb.main.dns_name
  }
}
