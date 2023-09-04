import express from "express";
import cors from "cors";
import { router } from "./routes/router.js";
import pkg from "ws";
import http from "http";

const { Server } = pkg;

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(router);
const PORT = process.env.PORT || 80;

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT} `);
});

const httpServer = http.createServer(app);
const wss = new Server({ server });

const clients = new Set();
process.on("uncaughtException", (error, origin) => {
  console.log("----- Uncaught exception -----");
  console.log(error);
  console.log("----- Exception origin -----");
  console.log(origin);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("----- Unhandled Rejection at -----");
  console.log(promise);
  console.log("----- Reason -----");
  console.log(reason);
});

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("message", (mess) => {
    console.log(mess);
    const data = JSON.parse(mess);
    clients.forEach((client) => {
      client.send(JSON.stringify(data));
    });
  });
  ws.on("close", () => {
    console.log("kutasisko");
    clients.delete(ws);
  });
});
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);
