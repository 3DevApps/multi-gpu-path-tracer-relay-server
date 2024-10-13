const WebSocketServer = require("ws").WebSocketServer;
const uuidv4 = require("uuid").v4;
const ClientsPerJobs = require("./src/ClientsPerJob.js");
const SSHClient = require("./src/sshClient.js");
const path = require("path");
const fs = require("fs");

const PORT = 22636;

const wss = new WebSocketServer({ port: PORT });
const clients = new ClientsPerJobs();
const sshClient = new SSHClient();
let LL_JOB;

wss.on("connection", (ws) => {
  ws.on("message", (rawMessage) => {
    // 1. Parse message
    let message;
    try {
      message = rawMessage.toString().split("#");
    } catch (error) {
      console.error("Error parsing message", error, rawMessage);
      return;
    }

    let type = message[0];
    let id;
    switch (type) {
      case "INIT_JOB":
        id = uuidv4();
        clients.addClient(id, ws);
        ws.send(
          JSON.stringify({
            type: "INIT_OK",
            id,
          })
        );
        break;
      case "INIT_CLIENT":
        // We have an id
        id = message[1];
        clients.addClient(id, ws);
        ws.send(
          JSON.stringify({
            type: "INIT_OK",
            id,
          })
        );
        break;
      case "DISPATCH_JOB":
        id = message[1];
        sshClient.dispatchJob({
          jobId: id,
        });

        break;
      case "JOB_MESSAGE":
        // Send the message to all clients
        const clientId = message[1];
        const clientMsg = message[2];
        console.log("gello ", clientId);
        // clients.getClients(clientId).forEach((client) => {
        //   client.send(
        //     JSON.stringify({
        //       type: "JOB_MESSAGE",
        //       message: clientMsg,
        //     })
        //   );
        // });
        break;
      case "FILE":
        console.log(message[3]);
        const filePath = path.join(__dirname, "uploads", message[2]);
        const buffer = Buffer.from(message[3].split(","), "base64");
        fs.writeFile(filePath, buffer, (err) => {
          if (err) {
            console.error("Error saving file:", err);
          }
          // TODO: add confirmation.
        });
        break;
      default:
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
