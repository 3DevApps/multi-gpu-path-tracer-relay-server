const Buffer = require("buffer").Buffer;

class WebSocketMessageHandler {
  constructor(clients, sshClient) {
    this.clients = clients;
    this.sshClient = sshClient;
  }

  parseMessage(rawMessage) {
    try {
      return rawMessage.toString().split("#");
    } catch (error) {
      console.error("Error parsing message", error, rawMessage);
      return null;
    }
  }

  encodeMessage(message) {
    return message.join("#");
  }

  handleMessage(ws, rawMessage) {
    const message = parseMessage(rawMessage);
    if (!message) {
      return;
    }
    const type = message[0];
    const jobId = this.clients.getClientJobId(ws);
    switch (type) {
      case "DISPATCH_JOB":
        if (!jobId) {
          console.error("Client is not associated with a job");
          return;
        }
        sshClient.dispatchJob({
          jobId,
        });
        break;
      case "KILL_JOB":
        if (!jobId) {
          console.error("Client is not associated with a job");
          return;
        }
        sshClient.killJob({
          jobId,
        });
        break;
      case "JOB_MESSAGE":
        const jobIdFromMessage = message[1];
        const messageToPass = this.encodeMessage(message.slice(2));
        this.clients.getClients(jobIdFromMessage).forEach((client) => {
          client.send(messageToPass);
        });
        break;
      case "UPLOAD_FILE":
        const filePath = path.join(__dirname, "uploads", message[2]);
        const buffer = Buffer.from(message[3].split(","), "base64");
        fs.writeFile(filePath, buffer, (err) => {
          if (err) {
            console.error("Error saving file:", err);
            return;
          }

          sshClient.sendFile({
            filePath,
            fileName: message[2],
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
