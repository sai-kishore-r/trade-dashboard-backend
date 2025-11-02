import http from "http";
import app from "./app.js";
import setupWebSocket from "./ws/server.js";

const PORT = process.env.PORT || 3015;

const server = http.createServer(app);

setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
