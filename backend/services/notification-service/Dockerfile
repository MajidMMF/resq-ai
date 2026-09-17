FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install
COPY services/notification-service/package*.json ./
RUN npm install --omit=dev

# 3. Setup notification service working directory and source files
WORKDIR /app/services/notification-service
COPY services/notification-service ./

# 4. Expose Notification Service port
EXPOSE 8009

# 5. Start Notification Service
CMD ["node", "index.js"]

