const WebSocketServer = require("ws").WebSocketServer;
const uuidv4 = require("uuid").v4;
const ClientsPerJobs = require("./ClientsPerJob.js");

const PORT = 22636;

const wss = new WebSocketServer({ port: PORT });
const clients = new ClientsPerJobs();
let LL_JOB;

wss.on("connection", (ws) => {
  ws.on("message", (rawMessage) => {
    // 1. Parse message
    let message;
    try {
      console.log(rawMessage);
      message = JSON.parse(rawMessage);
    } catch (error) {
      console.error("Error parsing message", error, rawMessage);
      return;
    }

    console.log("Message received", message);

    switch (message?.type) {
      case "INIT_LL":
        LL_JOB = ws;
        ws.send(
          JSON.stringify({
            type: "INIT_OK",
          })
        );
        break;
      case "INIT_JOB":
        var id = uuidv4();
        clients.addClient(id, ws);
        ws.send(
          JSON.stringify({
            type: "INIT_OK",
            id,
          })
        );

        // Inform LL_JOB about the new job
        LL_JOB?.send(
          JSON.stringify({
            type: "INIT_JOB",
            id,
          })
        );
        break;
      case "INIT_CLIENT":
        // We have an id
        var id = message.id;
        clients.addClient(id, ws);
        ws.send(
          JSON.stringify({
            type: "INIT_OK",
            id,
          })
        );

        // Inform LL_JOB about the new job
        LL_JOB?.send(
          JSON.stringify({
            type: "INIT_JOB",
            id,
          })
        );
        break;
      case "JOB_MESSAGE":
        // Send the message to all clients
        clients.getClients(message.id).forEach((client) => {
          client.send(
            JSON.stringify({
              type: "JOB_MESSAGE",
              message: message.message,
            })
          );
        });
        break;
      default:
        // Pass the message to the LL job
        LL_JOB?.send(rawMessage);
        break;
    }
  });

  ws.on("close", () => {
    // Remove the client from the list of clients
    clients.removeClient(ws, (jobId) => {
      // Inform the LL job about the client disconnection
      LL_JOB?.send(
        JSON.stringify({
          type: "CLIENT_DISCONNECTED",
          id: jobId,
        })
      );
    });
  });
});

console.log("WebSocket server is listening on ws://localhost:8080");
