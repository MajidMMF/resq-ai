FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities
COPY shared ./shared

# 2. Copy gateway package files to /app and install dependencies
COPY gateway/package*.json ./
RUN npm install --omit=dev && npm install ioredis

# 3. Setup gateway working directory and source files
WORKDIR /app/gateway
COPY gateway ./

# 4. Expose Gateway port
EXPOSE 8000

# 5. Start Gateway Service
CMD ["node", "index.js"]

