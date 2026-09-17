FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install
COPY services/incident-service/package*.json ./
RUN npm install --omit=dev

# 3. Setup incident service working directory and source files
WORKDIR /app/services/incident-service
COPY services/incident-service ./

# 4. Expose Incident Service port
EXPOSE 8003

# 5. Start Incident Service
CMD ["node", "index.js"]

