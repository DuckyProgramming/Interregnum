function mouseClicked(){
    current.onClick(graphics.main,{position:{...inputs.mouse.rel}})
}
function mouseDragged(){
    current.onDrag(graphics.main,{position:{...inputs.mouse.rel}},{position:{...inputs.mouse.previous.rel}})
}