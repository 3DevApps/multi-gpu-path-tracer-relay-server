const {NodeSSH} = require('node-ssh')
const path = require('path')

class SSHClient {
    constructor() {
        this.ssh = new NodeSSH()
        this.connect({
            host: "ares.plgrid.pl",
            username: "plgpklatka",
            privateKeyPath: path.resolve(__dirname, "config/id_rsa")
        })
    }
    
    async connect({host, username, password}) {
        try{
            await this.ssh.connect({
                host,
                username,
                privateKey: path.resolve(__dirname, "config/id_rsa")
            })
        }catch(err){
            console.log(err)
        }
    }
    
    dispatchJob({jobId, modelFilePath}) {
        // prepare command
        // 

        this.ssh.execCommand(`sbatch ~/multi-gpu-path-tracer/scripts/run-job.sh ${jobId} ~/multi-gpu-path-tracer/models/cubes.obj`).then((result) => {
            // Submitted batch job 10195830
            console.log(result)
        })
    
    }

    killJob({jobId}) {
        this.ssh.execCommand(`scancel ${jobId}`).then((result) => {
            console.log(result)
        })
    }

    async sendFile({filePath, fileName}) {
        const fileContent = await fs.promises.readFile
        this.ssh.putFiles([{local: filePath, remote: `~/multi-gpu-path-tracer/models/${fileName}`}]).then(() => {
            console.log("The File thing is done")
        })
    }

}

module.exports = SSHClient