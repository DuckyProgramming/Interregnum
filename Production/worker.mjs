import {parentPort} from "node:worker_threads"
import {dev} from '../JS/variables.mjs'
import {outAgents} from '../JS/functions.mjs'
import {operation} from '../JS/operation.mjs'
function draw(){
    current.update()
    setImmediate(draw)
}
dev.instant=true
dev.training=true
dev.speed=true
dev.close=true
const current=new operation()
draw()
parentPort.on('message',msg=>{
    if(msg.cmd=='output'){
        parentPort.postMessage({cmd:'end',data:outAgents(current)})
    }
})