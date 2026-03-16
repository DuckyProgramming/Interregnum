import {Worker} from "node:worker_threads"
import {writeFile} from "fs/promises"
if(process.argv.slice()[2]==undefined){
    console.log('Specify Map')
}else{
    const worker=new Worker("./worker.mjs",{workerData:{specific:-1,map:process.argv.slice()[2],mass:false}})
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
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    process.stdin.on('data',async (input)=>{
        const trimmed=input.trim()
        const trimmedL=trimmed.toLowerCase()
        if(trimmedL=='status'||trimmedL=='map'){
            worker.postMessage({cmd:trimmedL})
            const report=await new Promise(resolve=>{
                worker.once('message',msg=>{
                    if(msg.cmd==trimmedL){
                        resolve(msg)
                    }
                })
            })
            console.log(report.status)
        }else if(trimmedL=='save'){
            worker.postMessage({cmd:'save'})
            const report=await new Promise(resolve=>{
                worker.once('message',msg=>{
                    if(msg.cmd=='save'){
                        resolve(msg)
                    }
                })
            })
            console.log(report.status)
            await writeFile('agentset.mjs',report.data,{encoding:'utf8'})
        }
    })
}