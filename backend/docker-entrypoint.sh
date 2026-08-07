#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running seed script..."
node dist/seed.js

echo "Starting server..."
node dist/server.js
