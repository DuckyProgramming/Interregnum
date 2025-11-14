function draw(){
    if(!dev.close){
        current.display(graphics.main)
    }
    for(let a=0,la=dev.speed;a<la;a++){
        current.update(graphics.main)
    }
    displayMain(graphics.main)
}