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
      port_mappings = [{
        protocol      = "tcp"
        containerPort = var.configuration.container_port
        hostPort      = var.configuration.container_port
      }]

      environment = var.configuration.environment
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

      environment = var.configuration.environment
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

  load_balancer = var.set_lb_target ? {
    service = {
      target_group_arn = var.cluster_info.lb_target_group_arn
      container_name   = var.service_name
      container_port   = var.configuration.container_port
    }
  } : {}

  subnet_ids = var.cluster_info.private_subnet_ids
  security_group_ids = var.cluster_info.container_security_group_ids
  assign_public_ip = false

  tags = {
    Environment = "${var.cluster_info.name}-${var.cluster_info.environment}"
    Project     = "Pubpub-v7"
  }
}
