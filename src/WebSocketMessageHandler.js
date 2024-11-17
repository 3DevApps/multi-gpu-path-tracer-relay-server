class WebSocketMessageHandler {
  constructor(clients, jobManager) {
    this.clients = clients;
    this.jobManager = jobManager;
  }

  handleMessage(ws, rawMessage) {
    const jobId = ws._jobId;
    this.clients
      .getPathTracingClients(jobId)
      ?.forEach((client) => client.send(rawMessage));
    return;
  }
}

module.exports = WebSocketMessageHandler;
