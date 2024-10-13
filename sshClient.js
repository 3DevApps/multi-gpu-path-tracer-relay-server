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
    
    dispatchJob({jobId}) {
        // prepare command
        this.ssh.execCommand(command).then((result) => {
            console.log(result)
        })
    
    }

}

module.exports = SSHClient