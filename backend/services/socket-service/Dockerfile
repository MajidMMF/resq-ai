FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install
COPY services/socket-service/package*.json ./
RUN npm install --omit=dev

# 3. Setup socket service working directory and source files
WORKDIR /app/services/socket-service
COPY services/socket-service ./

# 4. Expose Socket Service port
EXPOSE 8010

# 5. Start Socket Service
CMD ["node", "index.js"]

