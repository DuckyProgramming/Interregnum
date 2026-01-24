function setupGraphics(){
    setupBase()
    setupTrig()
    graphics.main=createGraphics(1900,900)
    setupLayer(graphics.main)
}
function setupBase(){
    noStroke()
    angleMode(DEGREES)
	textAlign(CENTER,CENTER)
	rectMode(CENTER)
	colorMode(RGB,255,255,255,1)
	imageMode(CENTER)
    strokeJoin(ROUND)
}
function setupLayer(layer){
    layer.noStroke()
    layer.angleMode(DEGREES)
	layer.textAlign(CENTER,CENTER)
	layer.rectMode(CENTER)
	layer.colorMode(RGB,255,255,255,1)
	layer.imageMode(CENTER)
    layer.strokeJoin(ROUND)
}
function displayMain(layer){
    let scale=min(width/layer.width,height/layer.height)
    image(layer,width/2,height/2,layer.width*scale,layer.height*scale)
	updateMouse(layer,scale)
}
function setupTrig(){
	for(let a=0,la=360;a<la;a++){
		constants.trig[0].push(sin(a/2))
		constants.trig[1].push(cos(a/2))
		if(abs(constants.trig[0][a])<0.001){
			constants.trig[0][a]=0
		}
		if(abs(constants.trig[1][a])<0.001){
			constants.trig[1][a]=0
		}
	}
	for(let a=0,la=360;a<la;a++){
		constants.trig[0].push(-constants.trig[0][a])
		constants.trig[1].push(-constants.trig[1][a])
	}
}
function lsin(direction){
	return constants.trig[0][floor((direction%360+360)%360*2)]
}
function lcos(direction){
	return constants.trig[1][floor((direction%360+360)%360*2)]
}