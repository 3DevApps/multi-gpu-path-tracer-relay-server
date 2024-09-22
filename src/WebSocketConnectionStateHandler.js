const WebSocketMessageUtils = require("./WebSocketMessageUtils");

const uuidv4 = require("uuid").v4;

const DEBUG_JOB_ID = "0";

class WebSocketConnectionStateHandler {
  constructor(clients, jobManager) {
    this.clients = clients;
    this.jobManager = jobManager;
  }

  handleNewConnection(ws, req) {
    const parsedUrl = new URL(req.url, "http://com.example");

    const jobId = parsedUrl.searchParams.get("jobId") || uuidv4();
    ws._jobId = jobId;

    if (
      parsedUrl.searchParams.has("jobId") &&
      parsedUrl.searchParams.has("path-tracing-job")
    ) {
      this.clients.addPathTracingClient(
        parsedUrl.searchParams.get("jobId"),
        ws
      );
      return;
    }

    this.clients.addClientToJob(jobId, ws);
    const isFirstClient = this.clients.isAdmin(jobId, ws);

    ws.send(WebSocketMessageUtils.encodeMessage(["JOB_ID", jobId]));
    ws.send(WebSocketMessageUtils.encodeMessage(["IS_ADMIN", isFirstClient]));

    if (isFirstClient || jobId === DEBUG_JOB_ID) {
      this.jobManager.dispatchJob(ws, jobId);
    }
  }

  handleConnectionClose(ws) {
    const isAdmin = this.clients.isAdmin(ws._jobId, ws);
    this.clients.removeClient(ws);
    if (!this.clients.getClients(ws._jobId)) {
      this.jobManager.killJob(ws._jobId);
    }

    if (isAdmin) {
      this.clients
        .getAdminClient(ws._jobId)
        ?.send(WebSocketMessageUtils.encodeMessage(["IS_ADMIN", true]));
    }
  }
}

module.exports = WebSocketConnectionStateHandler;
