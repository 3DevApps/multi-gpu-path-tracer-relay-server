class WebSocketMessageHandler {
  constructor(clients, jobManager) {
    this.clients = clients;
    this.jobManager = jobManager;
  }

  handleMessage(ws, rawMessage) {
    const jobId = ws._jobId;
    const isPathTracingClient = ws._isPathTracingClient;

    if (isPathTracingClient) {
      this.clients.getClients(jobId)?.forEach((client) => {
        client.send(rawMessage);
      });
      return;
    }

    if (this.clients.isAdmin(jobId, ws)) {
      this.clients
        .getPathTracingClients(jobId)
        ?.forEach((client) => client.send(rawMessage));
      return;
    }
  }
}

module.exports = WebSocketMessageHandler;
