#!/bin/bash
set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Check for required environment variables
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
    exit 1
fi

# Run migrations and init admin
docker compose run --rm platform-migrations node core/prisma/initAdmin.js

echo "✨ Setup complete! You can now start the application with:"
echo "docker compose up -d"