class ClientsPerJobs {
  constructor() {
    this.clients = {}; // job <-> clients
  }

  getClients(jobId) {
    return this.clients[jobId];
  }

  addClient(jobId, client) {
    if (!this.clients[jobId]) {
      this.clients[jobId] = [];
    }

    this.clients[jobId].push(client);
  }

  removeJob(jobId) {
    delete this.clients[jobId];
  }

  removeClient(client, cb) {
    // TODO: Fix performance
    for (const jobId in this.clients) {
      this.clients[jobId] = this.clients[jobId].filter((c) => {
        if (c === client) {
          cb(jobId);
          return false;
        }

        return true;
      });
    }
  }
}

module.exports = ClientsPerJobs;