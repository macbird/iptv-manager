MAIN=apps/api/dist/main.js
MEMORY=1024
VERSION=recommended
DISPLAY_NAME=iptv-manager-api
DESCRIPTION=Client Manager API (Fastify + Prisma)
SUBDOMAIN=iptv-manager-api
AUTORESTART=true
START=npx prisma generate --schema apps/api/prisma/schema.prisma && npm run start -w apps/api
