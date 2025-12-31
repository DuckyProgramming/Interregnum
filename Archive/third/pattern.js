
p5.Gradient=class{
	constructor(){}
	setAngle(angle){
		if(_angleMode=="degrees"){
			this.angle=radians(angle)
		}else{
			this.angle=angle
		}
	}
	colors(){
		let stops
		if(Array.isArray(arguments[0])){
			stops=arguments[0]
		}else{
			stops=arguments
		}
		for(let a=0,la=stops.length;a<la;a+=2){
			const pos=stops[a]
			const col=stops[a+1].toString()
			this.gradient.addColorStop(pos,col)
		}
	}
}
p5.LinearGradient=class LinearGradient extends p5.Gradient{
	constructor(angle,width){
		super()
		this.setAngle(angle||0)
		this.width=width||100
		const x=lcos(this.angle)*this.width
		const y=lsin(this.angle)*this.width
		this.gradient=drawingContext.createLinearGradient(0,0,x,y)
	}
}
p5.RadialGradient=class RadialGradient extends p5.Gradient{
	constructor(innerRadius,outerRadius,x,y){
		super()
		this.innerRadius=innerRadius||0
		this.outerRadius=outerRadius||100
		this.x=x||0
		this.y=y||0
		this.gradient=drawingContext.createRadialGradient(this.x,this.y,this.innerRadius,this.x,this.y,this.outerRadius)
	}
}
p5.ConicGradient=class ConicGradient extends p5.Gradient{
	constructor(angle,x,y){
	  super()
	  this.setAngle(angle||0)
	  this.x=x||0
	  this.y=y||0
	  this.gradient=drawingContext.createConicGradient(this.angle,this.x,this.y)
	}
}
p5.prototype.createLinearGradient=(angle,width)=>{
	return new p5.LinearGradient(angle,width)
}
p5.prototype.createConicGradient=(angle,x,y)=>{
	return new p5.ConicGradient(angle,x,y)
}
p5.prototype.createRadialGradient=(innerRadius,outerRadius,x,y)=>{
	return new p5.RadialGradient(innerRadius,outerRadius,x,y)
}
p5.prototype.createPattern=(patternElement,repeat)=>{
	if(patternElement.canvas){
		patternElement=patternElement.canvas
	}else if(patternElement.elt){
		patternElement=patternElement.elt
	}
	return this.drawingContext.createPattern(patternElement,repeat||"repeat")
}
p5.prototype.createSimplePattern=(func,w,h,repeat)=>{ 
	let buffer=this.createGraphics(w||5,h||5)
	buffer.pixelDensity(1)
	buffer.background(255)
	func(buffer)
	return this.drawingContext.createPattern(buffer.canvas,repeat||"repeat")
}
p5.prototype.fillGradient=(gradient)=>{
	this.drawingContext.fillStyle=gradient.gradient?gradient.gradient:gradient
}
p5.prototype.strokeGradient=(gradient)=>{
	this.drawingContext.strokeStyle=gradient.gradient?gradient.gradient:gradient
}
p5.prototype.backgroundPattern=(pattern)=>{
	this.drawingContext.fillStyle=pattern
	this.drawingContext.fillRect(0,0,width,height)
}