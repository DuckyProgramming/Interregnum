function mouseClicked(){
    if(constants.init&&!dev.close){
        current.onClick(graphics.main,{position:{...inputs.mouse.rel}})
    }
}
function mouseDragged(){
    if(constants.init&&!dev.close){
        current.onDrag(graphics.main,{position:{...inputs.mouse.rel}},{position:{...inputs.mouse.previous.rel}},mouseButton)
    }
}