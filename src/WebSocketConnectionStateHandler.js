const uuidv4 = require("uuid").v4;

class WebSocketConnectionStateHandler {
  constructor(clients, jobManager) {
    this.clients = clients;
    this.jobManager = jobManager;
  }

  handleNewConnection(ws, req) {
    const parsedUrl = new URL(req.url, "http://com.example");

    if (parsedUrl.searchParams.has("jobId")) {
      const jobId = parsedUrl.searchParams.get("jobId");
      ws._jobId = jobId;
      if (parsedUrl.searchParams.has("path-tracing-job")) {
        this.clients.addPathTracingClient(
          parsedUrl.searchParams.get("jobId"),
          ws
        );
        return;
      }

      this.clients.addClientToJob(jobId, ws);
      return;
    }

    const jobId = uuidv4();
    ws._jobId = jobId;
    this.clients.addClientToJob(jobId, ws);
    ws.send("JOB_ID#" + jobId);
  }

  handleConnectionClose(ws) {
    this.clients.removeClient(ws);
  }
}

module.exports = WebSocketConnectionStateHandler;
