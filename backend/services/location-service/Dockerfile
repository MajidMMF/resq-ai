FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install
COPY services/location-service/package*.json ./
RUN npm install --omit=dev

# 3. Setup location service working directory and source files
WORKDIR /app/services/location-service
COPY services/location-service ./

# 4. Expose Location Service port
EXPOSE 8005

# 5. Start Location Service
CMD ["node", "index.js"]

