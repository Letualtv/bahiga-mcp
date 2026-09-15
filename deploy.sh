#!/bin/bash
set -e
cd /var/www/mcp
git pull origin main
npm ci --omit=dev
npm run build
pm2 reload bahiga-mcp || pm2 start ecosystem.config.cjs
echo "bahiga-mcp desplegado correctamente"
