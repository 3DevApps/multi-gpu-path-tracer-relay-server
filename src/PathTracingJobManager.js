const { NodeSSH } = require("node-ssh");

class PathTracingJobManager {
  constructor() {
    this.ssh = new NodeSSH();
    this.jobs = new Map();

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

  async dispatchJob(jobId) {
    const result = await this.ssh.execCommand(
      `sbatch ~/multi-gpu-path-tracer/scripts/run_job.sh ${jobId}`
    );
    const sbatchId = result.stdout.split(" ")[3];
    this.jobs.set(jobId, sbatchId);
  }

  async killJob(jobId) {
    if (!this.jobs.has(jobId)) {
      return;
    }
    this.ssh.execCommand(`scancel ${this.jobs.get(jobId)}`);
    this.jobs.delete(jobId);
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
