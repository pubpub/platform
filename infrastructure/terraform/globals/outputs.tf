# if resources are needed in an environment's inputs,
# then you can use terraform_remote_state to get this module's output

# put these creds in github actions secrets config
output "github_actions_user_credential" {
  value = {
    id = aws_iam_access_key.github_actions.id
    secret = aws_iam_access_key.github_actions.secret
  }

  # prevents this secret value from appearing accidentally
  # NOTE - it is still saved in the state file.
  sensitive = true
}

# Provide this value to github actions
output "github_actions_role_to_assume_arn" {
  value = aws_iam_role.github_actions_role.arn
}

