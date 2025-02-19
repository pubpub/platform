#!/bin/bash
set -e

# Prompt for admin credentials
read -p "Enter admin email: " ADMIN_EMAIL
read -s -p "Enter admin password: " ADMIN_PASSWORD
echo
read -p "Enter admin first name: " ADMIN_FIRSTNAME
read -p "Enter admin last name: " ADMIN_LASTNAME

# Run the admin creation script
docker compose run --rm \
    -e ADMIN_EMAIL="$ADMIN_EMAIL" \
    -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    -e ADMIN_FIRSTNAME="$ADMIN_FIRSTNAME" \
    -e ADMIN_LASTNAME="$ADMIN_LASTNAME" \
    platform-migrations pnpm --filter core exec tsx prisma/create-admin-user.cts

echo "✨ Done! You can now start the application with:"
echo "docker compose up -d"