import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const services = [
  { name: "GATEWAY", dir: "gateway", file: "index.js", port: 8000 },
  { name: "AUTH", dir: "services/auth", file: "index.js", port: 8001 },
  { name: "EMERG", dir: "services/emergency", file: "index.js", port: 8002 },
  { name: "INCIDENT", dir: "services/incident-service", file: "index.js", port: 8003 },
  { name: "AGENT", dir: "services/agent", file: "index.js", port: 8004 },
  { name: "LOCATION", dir: "services/location-service", file: "index.js", port: 8005 },
  { name: "HOSPITAL", dir: "services/hospital-service", file: "index.js", port: 8006 },
  { name: "AMBULANCE", dir: "services/ambulance-service", file: "index.js", port: 8007 },
  { name: "NOTIFY", dir: "services/notification-service", file: "index.js", port: 8009 },
  { name: "SOCKET", dir: "services/socket-service", file: "index.js", port: 8010 },
];

console.log("🚀 Launching ResQ AI Unified Backend microservices...");

for (const s of services) {
  const serviceDir = path.join(__dirname, s.dir);
  const serviceEnv = {
    ...process.env,
    PORT: String(s.port),
  };

  console.log(`▶️ Starting [${s.name}] on port ${s.port}...`);

  const child = spawn("node", [s.file], {
    cwd: serviceDir,
    env: serviceEnv,
    stdio: "inherit",
  });

  child.on("error", (err) => {
    console.error(`❌ [${s.name}] Failed to start:`, err.message);
  });

  child.on("exit", (code, signal) => {
    if (code !== 0) {
      console.error(`⚠️ [${s.name}] Exited with code ${code || signal}`);
    }
  });
}

