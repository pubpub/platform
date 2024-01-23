# generate password and make it accessible through aws secrets manager
resource "random_password" "rds_db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "rds_db_password" {
  name = "rds-db-password-${var.name}-${var.environment}"
}

resource "aws_secretsmanager_secret_version" "password" {
  secret_id     = aws_secretsmanager_secret.rds_db_password.id
  secret_string = random_password.rds_db_password.result
}

# network config
resource "aws_db_subnet_group" "ecs_dbs" {
  name       = "${var.name}_ecs_db_${var.environment}"
  subnet_ids         = aws_subnet.private.*.id

  tags = {
    Name = "subnet group for ECS RDS instances"
  }
}

resource "aws_security_group" "ecs_tasks_rds_instances" {
  name = "${var.name}-sg-rds-${var.environment}"
  vpc_id = aws_vpc.main.id

  ingress {
    protocol = "tcp"
    from_port = 5432
    to_port = 5432
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}

# the actual database instance
resource "aws_db_instance" "core_postgres" {
  identifier                  = "${var.name}-core-postgres-${var.environment}"
  allocated_storage           = 20
  db_name                     = "${var.name}_${var.environment}_core_postgres"
  db_subnet_group_name        = aws_db_subnet_group.ecs_dbs.name
  engine                      = "postgres"
  engine_version              = "14"
  instance_class              = "db.t3.small"
  vpc_security_group_ids      = [aws_security_group.ecs_tasks_rds_instances.id]
  username                    = var.name
  password                    = random_password.rds_db_password.result
  parameter_group_name        = "default.postgres14"
  skip_final_snapshot         = true

  lifecycle {
    ignore_changes = [
       password,
    ]
  }
}
