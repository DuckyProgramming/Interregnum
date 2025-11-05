class operation{
    constructor(){
        this.zoom={position:{x:graphics.load.map.width*0.5,y:graphics.load.map.height*0.5}}
        this.cities=[]
        this.initial()
    }
    initial(){
        types.team.forEach(team=>{team.allies=[];team.offers=[]})
        this.calc=new calc()
        this.ui=new ui(this)
        types.city.forEach((item,index)=>this.cities.push(new city(this,item.loc[0],item.loc[1],index)))
    }
    display(layer){
        layer.push()
        layer.translate(layer.width*0.5-this.zoom.position.x,layer.height*0.5-this.zoom.position.y)
        layer.image(graphics.load.map,graphics.load.map.width*0.5,graphics.load.map.height*0.5)
        this.cities.forEach(city=>city.display(layer))
        layer.pop()
        this.ui.display(layer)
    }
    update(layer){
        this.cities.forEach(city=>city.update())
        this.ui.update(layer)
    }
    onClick(layer,mouse){
        this.ui.onClick(layer,mouse)
        let rel={position:{x:mouse.position.x+this.zoom.position.x-layer.width*0.5,y:mouse.position.y+this.zoom.position.y-layer.height*0.5}}
        this.cities.forEach(city=>city.onClick(layer,mouse,rel))
    }
    onDrag(layer,mouse,previous){
        this.zoom.position.x=constrain(this.zoom.position.x-(mouse.position.x-previous.position.x),layer.width*0.5,graphics.load.map.width+this.ui.width-layer.width*0.5)
        this.zoom.position.y=constrain(this.zoom.position.y-(mouse.position.y-previous.position.y),layer.height*0.5,graphics.load.map.height-layer.height*0.5)
    }
    onKey(layer,key){
        this.ui.onKey(layer,key)
    }
}