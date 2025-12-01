import http from "http";
import app from "./app.js";
import setupWebSocket from "./ws/server.js";
import setupCronJobs from "./cron/index.js";
import { intiateAccessTokenReq } from "./ws/utils.js";

const PORT = 3015;

const server = http.createServer(app);

setupWebSocket(server);
setupCronJobs();

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ User routes should be available at /api/users`);
  if (process.env.LOWER_ENV === "false") intiateAccessTokenReq();
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
