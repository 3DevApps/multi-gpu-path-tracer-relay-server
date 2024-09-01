const Buffer = require("buffer").Buffer;

class WebSocketMessageHandler {
  constructor(clients, jobManager) {
    this.clients = clients;
    this.jobManager = jobManager;
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
    const message = this.parseMessage(rawMessage);
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
            client.send(this.encodeMessage(message.slice(1)));
          }
        });
        break;
      case "CLIENT_MESSAGE":
        this.clients
          .getPathTracingClients(jobId)
          ?.forEach((client) =>
            client.send(this.encodeMessage(message.slice(1)))
          );
        break;
      case "DISPATCH_JOB":
        if (!jobId) {
          console.error("Client is not associated with a job");
          return;
        }
        jobManager.dispatchJob({
          jobId,
        });
        break;
      case "KILL_JOB":
        if (!jobId) {
          console.error("Client is not associated with a job");
          return;
        }
        jobManager.killJob({
          jobId,
        });
        break;
      case "UPLOAD_FILE":
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
