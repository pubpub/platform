module "ecs_service" {
  source = "terraform-aws-modules/ecs/aws//modules/service"
  name = "${var.cluster_info.name}-${var.service_name}"

  cluster_arn = var.cluster_info.cluster_arn
  enable_execute_command = true

  # allow github actions to update the service without confusing TF
  ignore_task_definition_changes = true

  cpu    = var.resources.cpu
  memory = var.resources.memory
  desired_count = var.resources.desired_count
  # execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  # task_role_arn            = aws_iam_role.ecs_task_role.arn

  # TEMPLATE Container definition(s).
  container_definitions = merge({

    "${var.service_name}" = {
      essential = true
      image     = "${var.repository_url}:latest"
      port_mappings = var.listener != null ? [{
        name = var.listener.service_name
        protocol = var.listener.protocol
        hostPort = var.listener.from_port
        containerPort = var.listener.to_port
      }] : []

      environment = concat(
        var.configuration.environment,
        [{ name = "OTEL_SERVICE_NAME", value = "${var.service_name}.${var.service_name}" }],
      )
      secrets = var.configuration.secrets

      readonly_root_filesystem = false
      dependencies = [for ic in var.init_containers: {
        containerName = ic.name
        condition     = "SUCCESS"
      }]


      log_configuration = {
        logDriver = "awslogs",
        options = {
          awslogs-group = var.cluster_info.cloudwatch_log_group_name,
          awslogs-region = var.cluster_info.region,
          awslogs-stream-prefix = "ecs"
        }
      }
      # memory_reservation = 100
    }
  },
  {
    for ic in var.init_containers: ic.name => {
      essential = false
      image     = ic.image
      command = ic.command

      environment = concat(
        var.configuration.environment,
        [{ name = "OTEL_SERVICE_NAME", value = "${var.service_name}.${ic.name}" }],
      )
      secrets = var.configuration.secrets

      readonly_root_filesystem = false

      log_configuration = {
        logDriver = "awslogs",
        options = {
          awslogs-group = var.cluster_info.cloudwatch_log_group_name,
          awslogs-region = var.cluster_info.region,
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  })

  load_balancer = var.listener != null ? var.listener.public ? {
    service = {
      target_group_arn = aws_lb_target_group.this[0].arn
      # note that this is may not match the listener's service name
      container_name   = var.service_name
      container_port   = var.listener.to_port
    }
  } : {} : {}


  subnet_ids = var.cluster_info.private_subnet_ids
  security_group_ids = var.cluster_info.container_security_group_ids
  # TODO: set this to true to make the outbound traffic non-NAT, aka cheaper but unstable.
  assign_public_ip = false

  tags = {
    Environment = "${var.cluster_info.name}-${var.cluster_info.environment}"
    Project     = "Pubpub-v7"
  }
}

resource "aws_lb_target_group" "this" {
  count = var.listener != null ? var.listener.public ? 1 : 0 : 0
  name        = "tg-${var.cluster_info.name}-${var.service_name}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.cluster_info.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200,307"
    timeout             = "5"
    unhealthy_threshold = "3"
    healthy_threshold   = "5"
  }
}

resource "aws_lb_listener_rule" "http" {
  count = var.listener != null ? var.listener.public ? 1 : 0 : 0
  listener_arn = var.cluster_info.lb_listener_arn
  priority     = var.listener.rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this[count.index].arn
  }

  condition {
    path_pattern {
      values = [var.listener.rule_path_pattern]
    }
  }
}
