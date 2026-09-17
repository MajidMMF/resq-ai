FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install (including ioredis for shared/)
COPY services/agent/package*.json ./
RUN npm install --omit=dev && npm install ioredis

# 3. Setup agent service working directory and source files
WORKDIR /app/services/agent
COPY services/agent ./

# 4. Expose Agent Service port
EXPOSE 8004

# 5. Start Agent Service
CMD ["node", "index.js"]

