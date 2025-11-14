function keyPressed(){
    if(constants.init&&!dev.close){
        current.onKey(graphics.main,key)
    }
}