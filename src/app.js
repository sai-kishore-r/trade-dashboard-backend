import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import marketBreadthRouter from "./controller/market-breadth.js";
import statsRouter from "./controller/stats.js";
import placeOrder from "./controller/place-order.js";
import health from "./controller/health.js";
import mongoConnectionInstance from "./database/mongo.js";
import { connectWsUpstoxs } from "./ws/index.js";
import setupWebSocket from './ws/server.js'
import upstoxs from "./controller/upstoxs.js";
import dotenv from 'dotenv';
dotenv.config();

const app = express();

await mongoConnectionInstance.connect();
connectWsUpstoxs();

app.use(cors());
app.use(express.json());
app.use(health);
app.use(marketBreadthRouter);
app.use(statsRouter);
app.use(placeOrder);
app.use(upstoxs);

const swaggerDocument = YAML.load("./src/swagger.yaml");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;
