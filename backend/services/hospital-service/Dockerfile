FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install
COPY services/hospital-service/package*.json ./
RUN npm install --omit=dev

# 3. Setup hospital service working directory and source files
WORKDIR /app/services/hospital-service
COPY services/hospital-service ./

# 4. Expose Hospital Service port
EXPOSE 8006

# 5. Start Hospital Service
CMD ["node", "index.js"]

