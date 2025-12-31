import {dev} from '../JS/variables.mjs'
import {operation} from '../JS/operation.mjs'
function draw(){
    current.update()
    setImmediate(draw)
}
dev.instant=true
dev.training=true
dev.speed=true
dev.close=true
var current
current=new operation()
draw()