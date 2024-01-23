locals {
  db_user = aws_db_instance.core_postgres.username
  db_pw = random_password.rds_db_password.result
  db_name = aws_db_instance.core_postgres.db_name
  db_host = aws_db_instance.core_postgres.address
  db_sslmode = "require"
}

module "ecs_cluster" {
  source = "terraform-aws-modules/ecs/aws//modules/cluster"

  cluster_name = "${var.name}-ecs-cluster-${var.environment}"

  cluster_configuration = {
    execute_command_configuration = {
      logging = "OVERRIDE"
      log_configuration = {
        cloud_watch_log_group_name = "/aws/ecs/aws-ec2"
      }
    }
  }

  tags = {
    Environment = "${var.name}-${var.environment}"
    Project     = "Pubpub-v7"
  }
}

module "ecs_service_core" {
  source = "terraform-aws-modules/ecs/aws//modules/service"
  name = "${var.name}-core"

  cluster_arn = module.ecs_cluster.arn
  enable_execute_command = true

  cpu    = 512
  memory = 1024
  desired_count = 1
  # execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  # task_role_arn            = aws_iam_role.ecs_task_role.arn

  # Container definition(s)
  container_definitions = {

    core = {
      essential = true
      image     = "${aws_ecr_repository.pubpub_v7.repository_url}:latest"
      port_mappings = [{
        protocol      = "tcp"
        containerPort = var.core_configuration.container_port
        hostPort      = var.core_configuration.container_port
      }]

      environment = [
        # watch out for issues with a string-wrapped number in this context
        { name = "PORT"
          value = "${var.core_configuration.container_port}"
        },
        { name = "DATABASE_URL"
          value = "postgresql://${
              local.db_user}:${local.db_pw
            }@${
              local.db_host
            }:5432/${local.db_name}?sslmode=${local.db_sslmode}"
        },
        { name = "API_KEY" , value = var.core_configuration.environment.API_KEY },
        # { name = ASSETS_REGION , value = var.core_configuration.environment.ASSETS_REGION
        # { name = ASSETS_UPLOAD_KEY , value = var.core_configuration.environment.ASSETS_UPLOAD_KEY
        # { name = ASSETS_UPLOAD_SECRET_KEY , value = var.core_configuration.environment.ASSETS_UPLOAD_SECRET_KEY
        { name = "JWT_SECRET" , value = var.core_configuration.environment.JWT_SECRET},
        { name = "MAILGUN_SMTP_USERNAME" , value = var.core_configuration.environment.MAILGUN_SMTP_USERNAME},
        { name = "NEXT_PUBLIC_PUBPUB_URL" , value = var.core_configuration.environment.NEXT_PUBLIC_PUBPUB_URL},
        { name = "NEXT_PUBLIC_SUPABASE_URL" , value = var.core_configuration.environment.NEXT_PUBLIC_SUPABASE_URL},
        { name = "SENTRY_AUTH_TOKEN" , value = var.core_configuration.environment.SENTRY_AUTH_TOKEN},
        { name = "SUPABASE_SERVICE_ROLE_KEY" , value = var.core_configuration.environment.SUPABASE_SERVICE_ROLE_KEY},
        { name = "SUPABASE_WEBHOOKS_API_KEY" , value = var.core_configuration.environment.SUPABASE_WEBHOOKS_API_KEY},
      ]


      # Example image used requires access to write to root filesystem
      readonly_root_filesystem = false

      log_configuration = {
        logDriver = "awslogs",
        options = {
          awslogs-group = aws_cloudwatch_log_group.ecs.name,
          awslogs-region = var.region,
          awslogs-stream-prefix = "ecs"
        }
      }
      # memory_reservation = 100
    }
  }


  load_balancer = {
    service = {
      target_group_arn = aws_lb_target_group.main.arn
      container_name   = "core" # TODO: validate
      container_port   = var.core_configuration.container_port
    }
  }

  subnet_ids = aws_subnet.private.*.id
  security_group_ids = [aws_security_group.ecs_tasks.id]
  assign_public_ip = false

  tags = {
    Environment = "${var.name}-${var.environment}"
    Project     = "Pubpub-v7"
  }

  # this lifecycle property allows us to update the version of the container image without terraform clobbering it later
  # changing the container image creates a "revision" of the task definition
  # lifecycle {
  #   ignore_changes = [services.core.container_definitions.core.image]
  # }
}
