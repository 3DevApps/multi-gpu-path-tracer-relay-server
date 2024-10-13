const { NodeSSH } = require("node-ssh");
const path = require("path");

class PathTracingJobManager {
  constructor() {
    this.ssh = new NodeSSH();
    // this.connect({
    //   host: "ares.cyfronet.pl",
    //   username: "plgpklatka",
    //   // privateKey: path.resolve(__dirname, "../config/id_rsa"),
    //   password: "********",
    // });
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

  dispatchJob({ jobId, modelFilePath }) {
    this.ssh
      .execCommand(
        `sbatch ~/multi-gpu-path-tracer/scripts/run-job.sh ${jobId} ${modelFilePath}`
      )
      .then((result) => {
        // Submitted batch job 10195830
        const jobId = result.stdout.split(" ")[3];
        this.jobs.set(jobId, jobId);
      });
  }

  killJob({ jobId }) {
    this.ssh.execCommand(`scancel ${jobId}`).then((result) => {
      console.log(result);
    });
  }

  async sendFile({ filePath, fileName }) {
    const fileContent = await fs.promises.readFile;
    this.ssh
      .putFiles([
        {
          local: filePath,
          remote: `~/multi-gpu-path-tracer/models/${fileName}`,
        },
      ])
      .then(() => {
        console.log("The File thing is done");
      });
  }
}

module.exports = PathTracingJobManager;
