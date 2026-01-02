import {Worker} from "node:worker_threads"
import {writeFile} from "fs/promises"
const worker=new Worker("./worker.mjs",{workerData:{}})
process.on('SIGINT',async ()=>{
    worker.postMessage({cmd:'output'})
    const report=await new Promise(resolve=>{
        worker.once('message',msg=>{
            if(msg.cmd=='end'){
                resolve(msg)
            }
        })
    })
    console.log(report.status)
    await writeFile('agentset.mjs',report.data,{encoding:'utf8'})
    process.exit(0)
})