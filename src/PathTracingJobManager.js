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

  // `sbatch ~/multi-gpu-path-tracer/scripts/run-job.sh ${jobId} ~/multi-gpu-path-tracer/models/cubes.obj`
  async dispatchJob(jobId) {
    const result = await this.ssh.execCommand(
      `sbatch ~/multi-gpu-path-tracer/scripts/run-job.sh ${jobId}`
    );
    const sbatchId = result.stdout.split(" ")[3];
    this.jobs.set(jobId, sbatchId);
  }

  async killJob(jobId) {
    this.ssh.execCommand(`scancel ${jobId}`);
    this.jobs.delete(jobId);
  }

  async sendFile(filePath, fileName) {
    await this.ssh.putFiles([
      {
        local: filePath,
        remote: `files/${fileName}`,
      },
    ]);
  }
}

module.exports = PathTracingJobManager;
