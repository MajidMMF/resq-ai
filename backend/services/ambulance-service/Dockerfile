FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install
COPY services/ambulance-service/package*.json ./
RUN npm install --omit=dev

# 3. Setup ambulance service working directory and source files
WORKDIR /app/services/ambulance-service
COPY services/ambulance-service ./

# 4. Expose Ambulance Service port
EXPOSE 8007

# 5. Start Ambulance Service
CMD ["node", "index.js"]

