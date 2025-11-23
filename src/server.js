import http from "http";
import app from "./app.js";
import setupWebSocket from "./ws/server.js";

const PORT = 3015;

const server = http.createServer(app);

setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  console.log(`⚠️ Received ${signal}. Closing server...`);
  server.close(() => {
    console.log("🛑 Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
