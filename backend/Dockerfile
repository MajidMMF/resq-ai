FROM node:22-alpine

WORKDIR /app

# Copy backend files
COPY . .

# Install concurrently globally
RUN npm install -g concurrently

# Install dependencies using --prefix to avoid directory issues
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

# Railway exposes port 8000 for public Gateway
ENV PORT=8000
EXPOSE 8000

# Run all 10 microservices on their distinct ports
CMD ["npx", "concurrently", "-k", "-p", "[{name}]", \
  "-n", "GATEWAY,AUTH,EMERG,INCIDENT,AGENT,AMBULANCE,HOSPITAL,LOCATION,NOTIFY,SOCKET", \
  "-c", "cyan,blue,red,yellow,magenta,green,white,gray,pink,brightBlue", \
  "PORT=8000 node gateway/index.js", \
  "PORT=8001 node services/auth/index.js", \
  "PORT=8002 node services/emergency/index.js", \
  "PORT=8003 node services/incident-service/index.js", \
  "PORT=8004 node services/agent/index.js", \
  "PORT=8007 node services/ambulance-service/index.js", \
  "PORT=8006 node services/hospital-service/index.js", \
  "PORT=8005 node services/location-service/index.js", \
  "PORT=8009 node services/notification-service/index.js", \
  "PORT=8010 node services/socket-service/index.js" \
]
