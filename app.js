const WebSocketServer = require("ws").WebSocketServer;
const WebSocketClientHandler = require("./src/WebSocketClientHandler.js");
const PathTracingJobManager = require("./src/PathTracingJobManager.js");
const WebSocketMessageHandler = require("./src/WebSocketMessageHandler.js");
const WebSocketConnectionStateHandler = require("./src/WebSocketConnectionStateHandler.js");

const PORT = process.env.NODE_ENV === "production" ? 22636 : 8080;

const wss = new WebSocketServer({ port: PORT });
const clients = new WebSocketClientHandler();
const jobManager = new PathTracingJobManager();
const messageHandler = new WebSocketMessageHandler(clients, jobManager);
const connectionStateHandler = new WebSocketConnectionStateHandler(
  clients,
  jobManager
);

wss.on("connection", (ws, req) => {
  connectionStateHandler.handleNewConnection(ws, req);
  ws.on("message", (message) => messageHandler.handleMessage(ws, message));
  ws.on("close", () => connectionStateHandler.handleConnectionClose(ws));
});

console.log(`WebSocket server is listening on ws://localhost:${PORT}!`);
