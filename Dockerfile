FROM node:20-alpine

WORKDIR /app

# Copy backend files
COPY backend ./backend

WORKDIR /app/backend

# Install all service dependencies
RUN npm install && \
    npm install -g concurrently && \
    cd gateway && npm install --omit=dev && cd .. && \
    cd services/auth && npm install --omit=dev && cd .. && \
    cd services/emergency && npm install --omit=dev && cd .. && \
    cd services/incident-service && npm install --omit=dev && cd .. && \
    cd services/agent && npm install --omit=dev && cd .. && \
    cd services/ambulance-service && npm install --omit=dev && cd .. && \
    cd services/hospital-service && npm install --omit=dev && cd .. && \
    cd services/location-service && npm install --omit=dev && cd .. && \
    cd services/notification-service && npm install --omit=dev && cd .. && \
    cd services/socket-service && npm install --omit=dev && cd ..

# Expose Gateway port
ENV PORT=8000
EXPOSE 8000

# Run all 10 microservices concurrently
CMD ["npx", "concurrently", "-k", "-p", "[{name}]", \
  "-n", "GATEWAY,AUTH,EMERG,INCIDENT,AGENT,AMBULANCE,HOSPITAL,LOCATION,NOTIFY,SOCKET", \
  "-c", "cyan,blue,red,yellow,magenta,green,white,gray,pink,brightBlue", \
  "node gateway/index.js", \
  "node services/auth/index.js", \
  "node services/emergency/index.js", \
  "node services/incident-service/index.js", \
  "node services/agent/index.js", \
  "node services/ambulance-service/index.js", \
  "node services/hospital-service/index.js", \
  "node services/location-service/index.js", \
  "node services/notification-service/index.js", \
  "node services/socket-service/index.js" \
]
