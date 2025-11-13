class operation{
    constructor(){
        this.zoom={position:{x:graphics.load.map.width*0.5,y:graphics.load.map.height*0.5},map:0,shift:{position:{x:0,y:0},active:false}}
        this.cities=[]
        this.scene=`setup`
        this.initial()
    }
    save(){
        let composite={
            zoom:this.zoom,
            cities:[],
            scene:this.scene,
            ui:this.ui.save(),
            transitionManager:this.transitionManager.save()
        }
        this.cities.forEach(city=>composite.cities.push(city.save()))
        return composite
    }
    saveCol(){
        saveStrings([JSON.stringify(this.save())],'interregnumSaveFile','json')
    }
    load(result){
        let composite=JSON.parse(result)

        this.zoom=composite.zoom
        this.cities=[]
        this.scene=composite.scene
        composite.cities.forEach(cit=>{this.cities.push(new city(this,0,0,0));last(this.cities).load(cit)})
        this.ui.load(composite.ui)
        this.transitionManager.load(composite.transitionManager)
    }
    loadStp(input){
        let file=input.files[0]
        let reader=new FileReader()
        reader.battle=this
        reader.readAsText(file)
        reader.onload=function(){
            this.battle.load(reader.result);
        }
    }
    loadCol(){
        let input=document.createElement('input')
        input.type='file'
        input.battle=this
        input.click()
        input.addEventListener('change',function(){this.battle.loadStp(this)},false)
    }
    initial(){
        types.team.forEach(team=>{team.allies=[];team.offers=[]})
        this.calc=new calc()
        this.ui=new ui(this)
        this.initialComponents()
        this.transitionManager=new transitionManager(this)
        constants.init=true
    }
    initialComponents(){
        this.cities=[]
        types.city.forEach((item,index)=>this.cities.push(new city(this,item.loc[0],item.loc[1],index)))
        for(let a=0,la=types.team.length;a<la;a++){
            let cit=[]
            for(let b=0,lb=types.city.length;b<lb;b++){
                if(types.city[b].rule==types.team[a].name){
                    cit.push(b)
                }
            }
            if(floor(random(0,2))==0||cit.length>=2){
                let loc=this.cities[cit[floor(random(0,cit.length))]]
                loc.units.push(new unit(loc,a,0,(cit.length*5+floor(random(0,6)))*100))
            }
        }
    }
    display(layer){
        switch(this.scene){
            case `main`:
                layer.push()
                layer.translate(layer.width*0.5-this.zoom.position.x,layer.height*0.5-this.zoom.position.y)
                layer.image(graphics.load.map,graphics.load.map.width*0.5,graphics.load.map.height*0.5)
                this.cities.forEach(city=>city.display(layer,this.scene))
                layer.pop()
            break
            case `map`:
                layer.push()
                layer.translate(layer.width*0.5-this.ui.width*0.5,layer.height*0.5)
                layer.scale(max((layer.width-this.ui.width)/graphics.load.map.width,layer.height/graphics.load.map.height))
                layer.translate(-graphics.load.map.width*0.5,-graphics.load.map.height*0.5-this.zoom.map)
                layer.image(graphics.load.map,graphics.load.map.width*0.5,graphics.load.map.height*0.5)
                this.cities.forEach(city=>city.display(layer,this.scene))
                layer.pop()
            break
        }
        this.ui.display(layer,this.scene)
        this.transitionManager.display(layer)
    }
    update(layer){
        switch(this.scene){
            case `main`:
                this.cities.forEach(city=>city.update(layer,this.scene))
                if(this.zoom.shift.active){
                    this.zoom.shift.position.x=constrain(this.zoom.shift.position.x,layer.width*0.5,graphics.load.map.width+this.ui.width-layer.width*0.5)
                    this.zoom.shift.position.y=constrain(this.zoom.shift.position.y,layer.height*0.5,graphics.load.map.height-layer.height*0.5)
                    if(distPos(this.zoom,this.zoom.shift)<0.5){
                        this.zoom.shift.active=false
                    }else{
                        this.zoom.position=moveTowardVecDynamic(this.zoom,this.zoom.shift,0.5,0.125)
                    }
                }
            break
        }
        this.ui.update(layer,this.scene)
        this.transitionManager.update()
    }
    onClick(layer,mouse){
        let rel={position:{x:mouse.position.x+this.zoom.position.x-layer.width*0.5,y:mouse.position.y+this.zoom.position.y-layer.height*0.5}}
        this.cities.forEach(city=>city.onClick(layer,mouse,this.scene,rel))
        this.ui.onClick(layer,mouse,this.scene)
    }
    onDrag(layer,mouse,previous,button){
        switch(this.scene){
            case `main`:
                this.zoom.position.x=constrain(this.zoom.position.x-(mouse.position.x-previous.position.x)*(button==`right`?3:1),layer.width*0.5,graphics.load.map.width+this.ui.width-layer.width*0.5)
                this.zoom.position.y=constrain(this.zoom.position.y-(mouse.position.y-previous.position.y)*(button==`right`?3:1),layer.height*0.5,graphics.load.map.height-layer.height*0.5)
            break
            case `map`:
                this.zoom.map=constrain(
                    this.zoom.map-(mouse.position.y-previous.position.y)*(button==`right`?3:1),
                    -(graphics.load.map.height*0.5-layer.height*0.5/max((layer.width-this.ui.width)/graphics.load.map.width,layer.height/graphics.load.map.height)),
                    (graphics.load.map.height*0.5-layer.height*0.5/max((layer.width-this.ui.width)/graphics.load.map.width,layer.height/graphics.load.map.height)),
                )
            break
        }
    }
    onKey(layer,key){
        this.ui.onKey(layer,key,this.scene)
    }
}