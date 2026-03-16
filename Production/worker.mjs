import {parentPort,workerData} from "node:worker_threads"
import {dev,training} from '../JS/variables.mjs'
import {outAgents,outTraining} from '../JS/functions.mjs'
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
training.specific=workerData.specific
training.map=workerData.map
if(workerData.mass){
    training.mass=true
    training.parentPort=parentPort
}
//dev.new=true
const current=new operation()
draw()
parentPort.on('message',msg=>{
    switch(msg.cmd){
        case 'output':
            parentPort.postMessage({cmd:'end',status:`\nFinal Status:\n${outTraining(current)}\n`,data:outAgents(current)})
        break
        case 'outputM':
            parentPort.postMessage({cmd:'endM',status:`\nFinal Status:\n${outTraining(current)}\n`,data:current.ui.rings})
        break
        case 'status':
            parentPort.postMessage({cmd:'status',status:`\nCurrent Status:\n${outTraining(current)}`})
        break
        case 'map':
            parentPort.postMessage({cmd:'map',status:`\nCurrent Map:\n${current.outMap()}`})
        break
        case 'merge':
            parentPort.postMessage({cmd:'merged',status:`Agents Merged`,data:current.ui.mergeAgents(msg.data,msg.set)})
        break
        case 'save':
            parentPort.postMessage({cmd:'save',status:`\nSave Status:\n${outTraining(current)}\n`,data:outAgents(current)})
        break
    }
})