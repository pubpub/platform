locals {
  # null-guard here is annoying but necessary
  public = var.listener != null ? var.listener.public : false

  # a shortname for placaes where name lengths are constrained
  shortname = substr(sha1(var.service_name), 0, 4)

  # a block to DRY out
  log_configuration = {
    logDriver = "awslogs",
    options = {
      awslogs-group         = var.cluster_info.cloudwatch_log_group_name,
      awslogs-region        = var.cluster_info.region,
      awslogs-stream-prefix = "ecs"
    }
  }
}

module "ecs_service" {
  source  = "terraform-aws-modules/ecs/aws//modules/service"
  version = "~> 5.0"

  name = "${var.cluster_info.name}-${var.service_name}"

  cluster_arn            = var.cluster_info.cluster_arn
  enable_execute_command = true

  # allow github actions to update the service without confusing TF
  ignore_task_definition_changes = false

  cpu           = var.resources.cpu
  memory        = var.resources.memory
  desired_count = var.resources.desired_count
  # execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  # task_role_arn            = aws_iam_role.ecs_task_role.arn



  # TEMPLATE Container definition(s).
  container_definitions = merge({

    "${var.service_name}" = {
      essential = true
      image     = "${var.repository_url}:latest"

      # don't open ports unless inbound network is configured
      port_mappings = var.listener != null ? [{
        name          = var.listener.service_name
        protocol      = var.listener.protocol
        hostPort      = var.listener.from_port
        containerPort = var.listener.to_port
      }] : []

      restartPolicy = {
        enabled              = true
        restartAttemptPeriod = 60
      }

      # use concat() to add a computible variable
      environment = concat(
        var.configuration.environment,
        [{ name = "OTEL_SERVICE_NAME", value = "${var.service_name}.${var.service_name}" }],
      )
      secrets = var.configuration.secrets

      readonly_root_filesystem = false

      # wait for the init containers to finish
      # (this behavior is true for migrations, might need to be more
      # configurable if we have other init containers later)
      # Note 20251016: we don't use this anymore after moving migrations to instrumentation.ts
      # keeping around in case
      dependencies = [for ic in var.init_containers : {
        containerName = ic.name
        condition     = "SUCCESS"
      }]

      log_configuration = local.log_configuration

      command = var.command
    }
    },
    {
      for ic in var.init_containers : ic.name => {
        essential = false
        image     = ic.image
        command   = ic.command

        environment = concat(
          var.configuration.environment,
          [{ name = "OTEL_SERVICE_NAME", value = "${var.service_name}.${ic.name}" }],
        )
        secrets = var.configuration.secrets

        readonly_root_filesystem = false

        log_configuration = local.log_configuration
      }
    },
    local.public ? { # optional Nginx container
      nginx = {
        essential = true
        image     = var.nginx_image
        port_mappings = var.listener != null ? [{
          name          = "${var.service_name}-nginx"
          protocol      = "tcp"
          hostPort      = 8080
          containerPort = 8080
        }] : []

        environment = [
          { name = "OTEL_SERVICE_NAME",
          value = "${var.service_name}.nginx" },
          { name = "NGINX_LISTEN_PORT",
          value = "8080" },
          { name = "NGINX_PREFIX",
          value = var.listener.path_prefix },
          { name = "NGINX_UPSTREAM_HOST",
            # Containers in the same Task share one network interface:
            # https://aws.amazon.com/blogs/compute/task-networking-in-aws-fargate/
          value = "127.0.0.1" },
          { name = "NGINX_UPSTREAM_PORT",
          value = var.listener.from_port },
        ]

        readonly_root_filesystem = false

        log_configuration = local.log_configuration
      }
  } : {})

  load_balancer = local.public ? {
    service = {
      target_group_arn = aws_lb_target_group.this[0].arn
      # note that this is may not match the listener's service name
      container_name = "nginx"
      container_port = 8080
    }
  } : {}


  subnet_ids         = var.cluster_info.private_subnet_ids
  security_group_ids = var.cluster_info.container_security_group_ids
  # TODO: set this to true to make the outbound traffic non-NAT, aka cheaper but unstable.
  assign_public_ip = false

  tags = {
    Environment         = "${var.cluster_info.name}-${var.cluster_info.environment}"
    Project             = "Pubpub-v7"
    LogicalName         = var.service_name
    Shortname           = local.shortname
    ShortnameAnnotation = "Shortname is calculated as first four characters of the sha1sum of the Logical Name."
  }
}

resource "aws_lb_target_group" "this" {
  count = local.public ? 1 : 0
  # use shortname here because this string is max 32 chars
  name        = "${var.cluster_info.name}-${local.shortname}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.cluster_info.vpc_id
  target_type = "ip"

  # this healthcheck is specified on the nginx container
  # amd always passes, so is only useful as a fallback
  # when the container does not provide a more meaningful
  # one.
  health_check {
    path                = coalesce(var.health_check_path, "/legacy_healthcheck")
    interval            = "5"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "2"
    unhealthy_threshold = "3"
    healthy_threshold   = "3"
  }
}

resource "aws_lb_listener_rule" "http" {
  count        = local.public ? 1 : 0
  listener_arn = var.cluster_info.lb_listener_arn
  priority     = var.listener.rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this[count.index].arn
  }

  condition {
    path_pattern {
      values = ["${var.listener.path_prefix}*"]
    }
  }
}
