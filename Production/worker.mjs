import {parentPort} from "node:worker_threads"
import {dev} from '../JS/variables.mjs'
import {outAgents,outTraining,modifex} from '../JS/functions.mjs'
import {operation} from '../JS/operation.mjs'
//modifex(2)
function draw(){
    current.update()
    setImmediate(draw)
}
dev.instant=true
dev.training=true
dev.speed=true
dev.close=true
//dev.new=true
const current=new operation()
draw()
parentPort.on('message',msg=>{
    if(msg.cmd=='output'){
        parentPort.postMessage({cmd:'end',status:`\nFinal Status:\n${outTraining(current)}\n`,data:outAgents(current)})
    }else if(msg.cmd){
        parentPort.postMessage({cmd:'status',status:`\nCurrent Status:\n${outTraining(current)}`})
    }
})