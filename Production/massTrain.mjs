import {Worker} from "node:worker_threads"
import {writeFile} from "fs/promises"
var workers=[]
const set=[0,1,2,6]
for(let a=0,la=set.length;a<la;a++){
    workers.push(new Worker("./worker.mjs",{workerData:{specific:set[a],map:process.argv.slice()[2]}}))
}
process.on('SIGINT',async ()=>{
    workers.forEach(worker=>worker.postMessage({cmd:'outputM'}))
    const report=await Promise.all(workers.map(worker=>new Promise(resolve=>{
        worker.once('message',msg=>{
            if(msg.cmd=='endM'){
                resolve(msg)
            }
        })
    })))
    workers[0].postMessage({cmd:'merge',data:report.map(set=>set.data),set:set})
    const finalReport=await new Promise(resolve=>{
        workers[0].once('message',msg=>{
            if(msg.cmd=='merged'){
                resolve(msg)
            }
        })
    })
    await writeFile('agentset.mjs',finalReport.data,{encoding:'utf8'})
    process.exit(0)
})
process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin.on('data',async (input)=>{
    const trimmed=input.trim()
    const trimmedL=trimmed.toLowerCase()
    if(trimmedL=='status'||trimmedL=='map'){
        workers.forEach(worker=>worker.postMessage({cmd:trimmedL}))
        const report=await Promise.all(workers.map(worker=>new Promise(resolve=>{
            worker.once('message',msg=>{
                if(msg.cmd==trimmedL){
                    resolve(msg)
                }
            })
        })))
        console.log(report.map(set=>set.status).join(`\n`))
    }
})