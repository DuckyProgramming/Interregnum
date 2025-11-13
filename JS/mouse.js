function mouseClicked(){
    if(constants.init){
        current.onClick(graphics.main,{position:{...inputs.mouse.rel}})
    }
}
function mouseDragged(){
    if(constants.init){
        current.onDrag(graphics.main,{position:{...inputs.mouse.rel}},{position:{...inputs.mouse.previous.rel}},mouseButton)
    }
}