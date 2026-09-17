FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install (including ioredis for shared/)
COPY services/emergency/package*.json ./
RUN npm install --omit=dev && npm install ioredis

# 3. Setup emergency service working directory and source files
WORKDIR /app/services/emergency
COPY services/emergency ./

# 4. Expose Emergency Service port
EXPOSE 8002

# 5. Start Emergency Service
CMD ["node", "index.js"]

