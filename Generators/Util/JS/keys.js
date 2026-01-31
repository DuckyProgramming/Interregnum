function keyPressed(){
    switch(key){
        case 'ArrowLeft': inputs.keys[0][0]=true; break
        case 'ArrowRight': inputs.keys[0][1]=true; break
        case 'ArrowUp': inputs.keys[0][2]=true; break
        case 'ArrowDown': inputs.keys[0][3]=true; break
        case 'Shift': inputs.keys[0][4]=true; break
    }
    current.onKey(key)
}
function keyReleased(){
    switch(key){
        case 'ArrowLeft': inputs.keys[0][0]=false; break
        case 'ArrowRight': inputs.keys[0][1]=false; break
        case 'ArrowUp': inputs.keys[0][2]=false; break
        case 'ArrowDown': inputs.keys[0][3]=false; break
        case 'Shift': inputs.keys[0][4]=false; break
    }
}