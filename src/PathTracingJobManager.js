const { NodeSSH } = require("node-ssh");
const WebSocketMessageUtils = require("./WebSocketMessageUtils");

const JOB_DISCONNECT_TIMEOUT = 20000;

class PathTracingJobManager {
  constructor() {
    this.ssh = new NodeSSH();
    this.jobs = new Map();
    this.jobDisconnectTimeouts = {};

    this.connect({
      host: process.env.SSH_HOST,
      username: process.env.SSH_USERNAME,
      password: process.env.SSH_PASSWORD,
    });
  }

  async connect({ host, username, ...credentials }) {
    try {
      await this.ssh.connect({
        host,
        username,
        ...credentials,
      });
    } catch (err) {
      throw err;
    }
  }

  async dispatchJob(client, jobId) {
    if (this.jobDisconnectTimeouts[jobId]) {
      clearTimeout(this.jobDisconnectTimeouts[jobId]);
      delete this.jobDisconnectTimeouts[jobId];
      return;
    }
    const result = await this.ssh.execCommand(
      `sbatch ~/multi-gpu-path-tracer/scripts/run_job.sh ${jobId}`
    );
    const sbatchId = result.stdout.split(" ")[3];
    this.jobs.set(jobId, sbatchId);
    client.send(
      WebSocketMessageUtils.encodeMessage([
        "NOTIFICATION",
        "LOADING",
        "JOB_INIT",
        "Initiating job...",
      ])
    );
  }

  async killJob(jobId) {
    if (!this.jobs.has(jobId) || this.jobDisconnectTimeouts[jobId]) {
      return;
    }
    this.jobDisconnectTimeouts[jobId] = setTimeout(() => {
      this.ssh.execCommand(`scancel ${this.jobs.get(jobId)}`);
      this.jobs.delete(jobId);
      delete this.jobDisconnectTimeouts[jobId];
    }, JOB_DISCONNECT_TIMEOUT);
  }

  async getJobStatus(jobId) {
    if (!this.jobs.has(jobId)) {
      return "NOT_FOUND";
    }
    const result = await this.ssh.execCommand(
      `hpc-jobs | grep ${this.jobs.get(jobId)} | awk '{ print $4 }'`
    );
    return result.stdout.trim();
  }

  async sendFile(filePath, fileName) {
    await this.ssh.putFiles([
      {
        local: filePath,
        remote: `files/f${fileName}`,
      },
    ]);
  }
}

module.exports = PathTracingJobManager;
