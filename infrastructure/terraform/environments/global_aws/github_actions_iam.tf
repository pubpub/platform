# iam user for Github Actions

resource "aws_iam_user" "github_actions" {
  name = "github_actions"
  path = "/"
}

resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}

resource "aws_iam_policy" "lightsail" {
  name = "lightsail"
  policy = jsonencode({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "lightsail:*"
        ],
        Resource: "*"
      }
    ]
  })
}

resource "aws_iam_policy" "ecr" {
  name = "ECRAdmin"
  policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Sid : "EcrAdmin",
        Effect : "Allow",
        Action : [
          "ecr:*"
        ],
        Resource : [
          "*"
        ]
      }
    ]
  })
}

// iam policy to allow aws ecs update-service
resource "aws_iam_policy" "ecs" {
  name = "ECSUpdateService"
  policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Sid : "AllowPassRole",
        Effect : "Allow",
        Action : [
          "iam:PassRole"
        ],
        Resource : [
          "*"
        ]
      },
      {
        Sid : "EcsUpdateService",
        Effect : "Allow",
        Action : [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeClusters",
          "ecs:DescribeTaskDefinition",
          "ecs:CreateTaskSet",
          "ecs:RegisterTaskDefinition",
          "ecs:DeleteTaskDefinitions",
          "ecs:DeleteService",
          "ecs:UpdateServicePrimaryTaskSet",
          "ecs:StopTask",
          "ecs:StartTask",
          "ecs:RunTask",
          "ecs:CreateService",
          "ecs:DescribeTasks",
          "ecs:ListServices",
          "ecs:ListTaskDefinitions",
        ],
        Resource : [
          "*"
        ]
      }
    ]
  })
}

// read access to all the secrets that github actions needs
resource "aws_iam_policy" "github_actions_secrets" {
  name = "GithubActionsSecrets"
  policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Effect : "Allow",
        Action : [
          "secretsmanager:GetSecretValue"
        ],
        Resource : [
          # necessary to set during build in order to upload source maps to sentry
          "arn:aws:secretsmanager:*:*:secret:sentry-auth-token-*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "github_actions_role" {
  name = "github_actions_role"

  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sts:AssumeRole",
          "sts:TagSession", // specifically used by AWS provided GH action modules
        ]
        Effect = "Allow"
        Principal = {
          AWS = [aws_iam_user.github_actions.arn]
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "gha_attach_ecr" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.ecr.arn
}

resource "aws_iam_role_policy_attachment" "gha_attach_ecs" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.ecs.arn
}

resource "aws_iam_role_policy_attachment" "gha_attach_secrets" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_actions_secrets.arn
}

resource "aws_iam_role_policy_attachment" "gha_attach_lightsail" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.lightsail.arn
}
