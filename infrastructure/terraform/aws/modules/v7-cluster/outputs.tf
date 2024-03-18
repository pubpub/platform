output "ecr_repository_urls" {
  value = {
    root = aws_ecr_repository.pubpub_v7.repository_url
    core = aws_ecr_repository.pubpub_v7_core.repository_url
    intg_submissions = aws_ecr_repository.pubpub_v7_intg_submissions.repository_url
    intg_evaluations = aws_ecr_repository.pubpub_v7_intg_evaluations.repository_url
    jobs = aws_ecr_repository.pubpub_v7_jobs.repository_url
  }
}

output "cluster_info" {
  value = {
    region = var.region
    name = var.name
    vpc_id = aws_vpc.main.id
    environment = var.environment
    cluster_arn = module.ecs_cluster.arn
    private_subnet_ids = aws_subnet.private.*.id
    container_security_group_ids = [aws_security_group.ecs_tasks.id]
    cloudwatch_log_group_name = aws_cloudwatch_log_group.ecs.name
    lb_listener_arn = aws_lb_listener.main.arn
  }
}
