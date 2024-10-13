const uuidv4 = require("uuid").v4;

class WebSocketConnectionStateHandler {
  constructor(clients, sshClient) {
    this.clients = clients;
    this.sshClient = sshClient;
  }

  handleNewConnection(ws, req) {
    const parsedUrl = new URL(req.url, "http://com.example");

    if (parsedUrl.searchParams.has("jobId")) {
      if (parsedUrl.searchParams.has("path-tracing-job")) {
        this.clients.addPathTracingClient(
          parsedUrl.searchParams.get("jobId"),
          ws
        );
        return;
      }

      this.clients.addClientToJob(parsedUrl.searchParams.get("jobId"), ws);
      return;
    }

    const jobId = uuidv4();
    this.clients.addClientToJob(jobId, ws);
    ws.send("JOB_ID#" + jobId);
  }

  handleConnectionClose(ws) {
    this.clients.removeClient(ws);
  }
}

module.exports = WebSocketConnectionStateHandler;
