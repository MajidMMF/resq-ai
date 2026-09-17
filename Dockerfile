FROM node:20-alpine

WORKDIR /app

# Copy backend files
COPY backend ./backend

WORKDIR /app/backend

# Install concurrently globally
RUN npm install -g concurrently

# Install dependencies using --prefix to avoid path issues
RUN npm install --omit=dev && \
    npm --prefix gateway install --omit=dev && \
    npm --prefix services/auth install --omit=dev && \
    npm --prefix services/emergency install --omit=dev && \
    npm --prefix services/incident-service install --omit=dev && \
    npm --prefix services/agent install --omit=dev && \
    npm --prefix services/ambulance-service install --omit=dev && \
    npm --prefix services/hospital-service install --omit=dev && \
    npm --prefix services/location-service install --omit=dev && \
    npm --prefix services/notification-service install --omit=dev && \
    npm --prefix services/socket-service install --omit=dev

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
