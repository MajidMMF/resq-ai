FROM node:20-alpine

WORKDIR /app

# 1. Copy shared utilities used across services
COPY shared ./shared

# 2. Copy service dependencies to /app and install so shared/ has direct access to node_modules
COPY services/auth/package*.json ./
RUN npm install --omit=dev

# 3. Setup auth service working directory and source files
WORKDIR /app/services/auth
COPY services/auth ./

# 4. Expose Auth Service port
EXPOSE 8001

# 5. Start Auth Service
CMD ["node", "index.js"]

