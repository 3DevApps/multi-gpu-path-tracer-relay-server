const WebSocketMessageUtils = require("./WebSocketMessageUtils");
const Buffer = require("buffer").Buffer;

class WebSocketMessageHandler {
  constructor(clients, jobManager) {
    this.clients = clients;
    this.jobManager = jobManager;
  }

  handleMessage(ws, rawMessage) {
    const message = WebSocketMessageUtils.parseMessage(rawMessage);
    if (!message) {
      return;
    }
    const type = message[0];
    const jobId = ws._jobId;
    switch (type) {
      case "JOB_MESSAGE":
        this.clients.getClients(jobId)?.forEach((client) => {
          if (message[1] === "RENDER") {
            client.send(rawMessage.slice(19));
          } else {
            client.send(WebSocketMessageUtils.encodeMessage(message.slice(1)));
          }
        });
        break;
      case "CLIENT_MESSAGE":
        if (!this.clients.isAdmin(jobId, ws)) {
          return;
        }
        this.clients
          .getPathTracingClients(jobId)
          ?.forEach((client) =>
            client.send(WebSocketMessageUtils.encodeMessage(message.slice(1)))
          );
        break;
      case "UPLOAD_FILE":
        if (!this.clients.isAdmin(jobId, ws)) {
          return;
        }
        const filePath = path.join(__dirname, "tmp", message[1]);
        const buffer = Buffer.from(message[2].split(","), "base64");
        fs.writeFile(filePath, buffer, (err) => {
          if (err) {
            console.error("Error saving file:", err);
            return;
          }

          jobManager.sendFile({
            filePath,
            fileName: message[1],
          });

          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
              return;
            }
          });
        });
        break;
      default:
        break;
    }
  }
}

module.exports = WebSocketMessageHandler;
