function setup(){
    createCanvas(windowWidth-50,windowHeight-50)
    setupGraphics()
    current=new operation()
}
function windowResized(){
    resizeCanvas(windowWidth-50,windowHeight-50)
}