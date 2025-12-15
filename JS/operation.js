class operation{
    constructor(){
        this.map=0
        this.nextMap=0
        this.zoom={position:{x:graphics.load.map[this.map].width*0.5,y:graphics.load.map[this.map].height*0.5},map:0,shift:{position:{x:0,y:0},active:false},dragging:0,scaling:1}
        this.speed={main:dev.speed?5000:1,move:true}
        this.cities=[]
        this.teams=[]
        this.scene=`title`
        this.initial()
        this.loadMap(findName(`Tiny`,types.map))
        this.initialComponents()
        this.ui.reset()
    }
    save(){
        let composite={
            map:types.map[this.map].name,
            zoom:this.zoom,
            cities:[],
            teams:[],
            scene:this.scene,
            ui:this.ui.save(),
            transitionManager:this.transitionManager.save()
        }
        this.cities.forEach(city=>composite.cities.push(city.save()))
        this.teams.forEach(team=>composite.teams.push(team.save()))
        return composite
    }
    saveCol(){
        saveStrings([JSON.stringify(this.save())],'interregnumSaveFile','json')
    }
    load(result){
        let composite=JSON.parse(result)

        let map=composite.map==undefined?findName(`HRE`,types.map):findName(typeof(composite.map)==`number`?convert[1][composite.map]:composite.map,types.map)
        let reselect=false
        if(map!=this.map){
            reselect=true
            this.loadMap(map)
        }
        this.map=map
        this.zoom=composite.zoom
        this.scene=composite.scene
        if(composite.cities!=undefined){
            this.cities.forEach(cit=>cit.units=[])
            composite.cities.forEach(cit=>{let index=findName(cit.name,types.city);if(index>=0){this.cities[index]=new city(this,this.cities[index].position.x,this.cities[index].position.y,this.cities[index].type);this.cities[index].load(cit)}})
        }
        if(composite.teams!=undefined){
            composite.teams.forEach(tea=>{let index=findName(tea.name,types.team);if(index>=0){this.teams[index]=new team(0);this.teams[index].load(tea)}})
        }
        this.ui.load(composite.ui)
        this.transitionManager.load(composite.transitionManager)
        if(reselect){
            this.transitionManager.begin(`pick`)
        }
    }
    loadStp(input,scene){
        let file=input.files[0]
        let reader=new FileReader()
        reader.operation=this
        reader.scene=scene
        reader.readAsText(file)
        reader.onload=function(){this.operation.load(reader.result);this.operation.scene=scene}
    }
    loadCol(scene){
        let input=document.createElement('input')
        input.type='file'
        input.operation=this
        input.scene=scene
        input.click()
        input.addEventListener('change',function(){this.operation.loadStp(this,this.scene)},false)
    }
    transitionComplete(scene){
        let set
        switch(this.scene){
            case `setup`:
                switch(scene){
                    case `main`:
                        set=this.ui.select.auto.slice()
                        this.map=this.nextMap
                        this.loadMap(this.map)
                        set.forEach((item,index)=>types.team[index].auto=item)
                        this.initialComponents()
                        this.ui.reset()
                    break
                    case `edit`:
                        set=this.ui.select.auto.slice()
                        this.map=this.nextMap
                        this.loadMap(this.map)
                        set.forEach((item,index)=>types.team[index].auto=item)
                        this.ui.reset()
                    break
                }
            break
        }
    }
    loadMap(map){
        constants.spawn=types.map[map].constants.spawn
        types.city=types.map[map].city
        types.team=types.map[map].team
        types.team.forEach(team=>{team.auto=true;team.loadIndex=findList(team.term,listing.team)})
        this.initialElements()
        this.ui.initialAgents()
    }
    initial(){
        this.calc=new calc()
        this.ui=new ui(this)
        this.transitionManager=new transitionManager(this)
        constants.init=true
    }
    initialElements(){
        this.cities=[]
        types.city.forEach((item,index)=>this.cities.push(new city(this,item.loc[0],item.loc[1],index)))
        this.teams=[]
        types.team.forEach((item,index)=>{this.teams.push(new team(index));item.allies.forEach(ally=>this.teams[index].allies.push(findName(ally,types.team)))})
    }
    initialComponents(){
        let units=this.cities.some(city=>city.units.length>0)
        this.cities.forEach(city=>city.initial())
        if(!units){
            for(let a=0,la=this.teams.length;a<la;a++){
                let cit=[]
                for(let b=0,lb=this.cities.length;b<lb;b++){
                    if(this.cities[b].owner==this.teams[a].name){
                        cit.push(b)
                    }
                }
                if(cit.length>0&&(floor(random(0,2))==0||cit.length>=2||!types.team[a].auto)){
                    let loc=this.cities[cit[floor(random(0,cit.length))]]
                    loc.units.push(new unit(loc,a,0,round(cit.length*(this.teams[a].name==`Ecclesiastical`?2.5:5)+random(0,5))*100))
                }
            }
        }
        this.zoom.position.x=graphics.load.map[this.map].width*0.5
        this.zoom.position.y=graphics.load.map[this.map].height*0.5
    }
    display(layer){
        switch(this.scene){
            case `title`: case `setup`:
                layer.image(graphics.load.map[this.map],graphics.load.map[this.map].width*0.5,graphics.load.map[this.map].height*0.5)
                this.cities.forEach(city=>city.display(layer,this.scene))
            break
            case `main`:
                layer.push()
                layer.translate(layer.width*0.5-this.zoom.position.x,layer.height*0.5-this.zoom.position.y)
                layer.image(graphics.load.map[this.map],graphics.load.map[this.map].width*0.5,graphics.load.map[this.map].height*0.5)
                this.cities.forEach(city=>city.display(layer,this.scene))
                layer.pop()
            break
            case `map`:
                this.zoom.scaling=max((layer.width-this.ui.width)/graphics.load.map[this.map].width,layer.height/graphics.load.map[this.map].height)
                layer.push()
                layer.translate(layer.width*0.5-this.ui.width*0.5,layer.height*0.5)
                layer.scale(this.zoom.scaling)
                layer.translate(-graphics.load.map[this.map].width*0.5,-graphics.load.map[this.map].height*0.5-this.zoom.map)
                layer.image(graphics.load.map[this.map],graphics.load.map[this.map].width*0.5,graphics.load.map[this.map].height*0.5)
                this.cities.forEach(city=>city.display(layer,this.scene))
                layer.pop()
            break
            case `edit`:
                this.zoom.scaling=max((layer.width-this.ui.width)/graphics.load.map[this.map].width,layer.height/graphics.load.map[this.map].height)
                layer.push()
                layer.translate(layer.width*0.5-this.ui.width*0.5,layer.height*0.5)
                layer.scale(this.zoom.scaling)
                layer.translate(-graphics.load.map[this.map].width*0.5,-graphics.load.map[this.map].height*0.5-this.zoom.map)
                layer.image(graphics.load.map[this.map],graphics.load.map[this.map].width*0.5,graphics.load.map[this.map].height*0.5)
                this.cities.forEach(city=>city.display(layer,this.scene))
                layer.pop()
            break
        }
        this.ui.display(layer,this.scene)
        this.transitionManager.display(layer)
    }
    update(layer){        
        if(this.ui.turn.main!=-1&&!dev.speed&&this.speed.move){
            this.speed.main=smoothAnim(this.speed.main,types.team[this.ui.turn.main].auto,1,4,0.05)
        }
        switch(this.scene){
            case `title`: case `setup`:
                for(let a=0,la=2;a<la;a++){
                    this.cities.forEach(city=>city.update(layer,this.scene))
                    this.ui.update(layer,this.scene)
                }
            break
            case `main`:
                for(let a=0,la=this.speed.main;a<la;a++){
                    this.cities.forEach(city=>city.update(layer,this.scene))
                    this.ui.update(layer,this.scene)
                }
                if(this.zoom.shift.active&&!dev.close){
                    this.zoom.shift.position.x=constrain(this.zoom.shift.position.x,layer.width*0.5,graphics.load.map[this.map].width+this.ui.width-layer.width*0.5)
                    this.zoom.shift.position.y=constrain(this.zoom.shift.position.y,layer.height*0.5,graphics.load.map[this.map].height-layer.height*0.5)
                    if(distPos(this.zoom,this.zoom.shift)<0.5){
                        this.zoom.shift.active=false
                    }else{
                        this.zoom.position=moveTowardVecDynamic(this.zoom,this.zoom.shift,1,0.125)
                    }
                }
            break
            default:
                this.ui.update(layer,this.scene)
            break
        }
        if(!dev.close){
            this.transitionManager.update()
        }
    }
    onClick(layer,mouse){
        let rel
        switch(this.scene){
            case `main`:
                rel={position:{x:mouse.position.x+this.zoom.position.x-layer.width*0.5,y:mouse.position.y+this.zoom.position.y-layer.height*0.5}}
                if(this.zoom.dragging<5){
                    this.cities.forEach(city=>city.onClick(layer,mouse,this.scene,rel))
                    this.ui.onClick(layer,mouse,this.scene)
                }
            break
            case `edit`:
                rel={position:{
                    x:(mouse.position.x-layer.width*0.5+this.ui.width*0.5)/this.zoom.scaling+graphics.load.map[this.map].width*0.5,
                    y:(mouse.position.y-layer.height*0.5)/this.zoom.scaling+graphics.load.map[this.map].height*0.5+this.zoom.map
                }}
                if(this.zoom.dragging<5){
                    this.cities.forEach(city=>city.onClick(layer,mouse,this.scene,rel))
                    this.ui.onClick(layer,mouse,this.scene)
                }
            break
            default:
                this.ui.onClick(layer,mouse,this.scene)
            break
        }
        this.zoom.dragging=0
    }
    onDrag(layer,mouse,previous,button){
        switch(this.scene){
            case `main`:
                this.zoom.position.x=constrain(this.zoom.position.x-(mouse.position.x-previous.position.x)*(button==`right`?3:1),layer.width*0.5,graphics.load.map[this.map].width+this.ui.width-layer.width*0.5)
                this.zoom.position.y=constrain(this.zoom.position.y-(mouse.position.y-previous.position.y)*(button==`right`?3:1),layer.height*0.5,graphics.load.map[this.map].height-layer.height*0.5)
            break
            case `map`: case `edit`:
                this.zoom.map=constrain(
                    this.zoom.map-(mouse.position.y-previous.position.y)*(button==`right`?6:2),
                    -(graphics.load.map[this.map].height*0.5-layer.height*0.5/this.zoom.scaling),
                    (graphics.load.map[this.map].height*0.5-layer.height*0.5/this.zoom.scaling),
                )
            break
        }
        this.zoom.dragging++
    }
    onKey(layer,key){
        this.ui.onKey(layer,key,this.scene)
    }
}