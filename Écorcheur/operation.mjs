import {graphics,dev,types,listing,options,constants} from './variables.mjs'
import {findList,findTerm,distPos,randin,randindex,floor,random,last,mapVec} from './functions.mjs'
import {calc} from './calc.mjs'
import {ui} from './ui.mjs'
import {transitionManager} from './../JS/transitionManager.mjs'
import {city} from './city.mjs'
import {unit} from './unit.mjs'
import {team} from './team.mjs'
export class operation{
    constructor(){
        this.map=0
        this.nextMap=this.map
        this.zoom={position:{x:graphics.load.map[this.map].width*0.5,y:graphics.load.map[this.map].height*0.5}}
        this.time={active:0,total:36000}
        this.resources={money:1000,food:500}
        this.id={city:0}
        this.cities=[]
        this.units=[]
        this.teams=[]
        this.ref={team:{}}
        this.scale=2.5
        this.scene=`main`
        this.initial()
        this.loadMap(this.map)
        this.initialComponents()
        constants.init=true
    }
    save(){
        let composite={
            map:types.map[this.map].term,
            zoom:this.zoom,
            cities:[],
            units:[],
            teams:[],
            scene:this.scene,
            ui:this.ui.save(),
            transitionManager:this.transitionManager.save()
        }
        this.cities.forEach(city=>composite.cities.push(city.save()))
        this.units.forEach(unit=>composite.units.push(unit.save()))
        this.teams.forEach(team=>composite.teams.push(team.save()))
        return composite
    }
    saveCol(){
        saveStrings([JSON.stringify(this.save())],'ecorcheurSaveFile','json')
    }
    load(result){
        let composite=JSON.parse(result)

        let map=findTerm(composite.map,types.map)
        let reselect=false
        if(map!=this.map){
            reselect=true
            this.loadMap(map)
        }
        this.map=map
        this.zoom=composite.zoom
        this.scene=composite.scene
        if(composite.cities!=undefined){
            this.cities=[]
            composite.cities.forEach(cit=>{this.cities.push(new city(this,0,{},false));last(this.cities).load(cit)})
        }
        if(composite.units!=undefined){
            this.units=[]
            composite.units.forEach(uni=>{this.units.push(new unit(this,false,0,0,0));last(this.units).load(uni)})
        }
        if(composite.teams!=undefined){
            composite.teams.forEach(tea=>{let index=[types.teamRef[tea.name]];if(index>=0){this.teams[index]=new team(this,0);this.teams[index].load(tea)}})
        }
        this.cities.forEach(city=>city.setCore())
        
        this.ui.load(composite.ui)
        this.transitionManager.load(composite.transitionManager)
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
        switch(this.scene){
            case `setup`:
                switch(scene){
                    case `main`:
                        this.map=this.nextMap
                        this.loadMap(this.map)
                        this.ui.reset()
                    break
                }
            break
        }
    }
    loadMap(map){
        types.city=types.map[map].city
        types.team=types.map[map].team

        types.cityRef={}
        types.teamRef={}

        types.team.forEach(team=>team.loadIndex=findList(team.term,listing.team))
        this.initialElements()
    }
    initial(){
        this.calc=new calc(this)
        this.ui=new ui(this)
        this.transitionManager=new transitionManager(this)
    }
    initialElements(){
        this.teams=[]
        types.team.forEach((tea,index)=>this.teams.push(new team(this,index)))
        this.teams.forEach((team,index)=>this.ref.team[team.name]=index)

        this.cities=[]
        for(let a=0,la=types.city[0].length;a<la;a++){
            this.addCity(types.city[0][a],true)
        }
        let leftover=[]
        let groups=[]
        for(let a=0,la=types.city[1].length;a<la;a++){
            for(let b=0,lb=groups.length+1;b<lb;b++){
                if(b==lb-1){
                    groups.push({cities:[types.city[1][a]],rule:types.city[1][a].rule})
                }else if(groups[b].rule==types.city[1][a].rule){
                    groups[b].cities.push(types.city[1][a])
                    break
                }
            }
        }
        for(let a=0,la=groups.length;a<la;a++){
            this.addCity(groups[a].cities.splice(randindex(groups[a].cities),1)[0],true)
            leftover.push(...groups[a].cities)
        }
        for(let a=0,la=60-this.cities.length;a<la;a++){
            this.addCity(leftover.splice(randindex(leftover),1)[0],true)
        }
        for(let a=0,la=types.city[2].length;a<la;a++){
            this.addCity(types.city[2][a],true)
        }
        for(let a=0,la=121-this.cities.length;a<la;a++){
            this.addCity(types.city[3].splice(randindex(types.city[3]),1)[0],floor(random(0,2))==0)
        }
        for(let a=0,la=125-this.cities.length;a<la;a++){
            this.addCity(types.city[4].splice(randindex(types.city[4]),1)[0],floor(random(0,2))==0)
        }
    }
    initialComponents(){
        this.cities.forEach(city=>city.setCore())
        this.teams.forEach(team=>team.initialPatrols())

        let cit=[randin(this.cities),randin(this.cities),randin(this.cities)]
        while(cit[0].id==cit[1].id||cit[0].id==cit[2].id||cit[1].id==cit[2].id){
            cit=[randin(this.cities),randin(this.cities),randin(this.cities)]
        }
        let interp=[random(0.2,0.8),random(0.2,0.8)]
        let loc=mapVec(mapVec(cit[0].position,cit[1].position,interp[0]),cit[2].position,interp[1])
        while(this.units.some(unit=>distPos(unit,{position:loc})<50)){
            cit=[randin(this.cities),randin(this.cities),randin(this.cities)]
            while(cit[0].id==cit[1].id||cit[0].id==cit[2].id||cit[1].id==cit[2].id){
                cit=[randin(this.cities),randin(this.cities),randin(this.cities)]
            }
            interp=[random(0.2,0.8),random(0.2,0.8)]
            loc=mapVec(mapVec(cit[0].position,cit[1].position,interp[0]),cit[2].position,interp[1])
        }
        this.units.splice(0,0,new unit(this,true,loc.x,loc.y,this.ref.team[`Player`],2,2000))

        this.units.forEach(unit=>unit.fade.main=1)
    }
    addCity(data,fortified){
        this.cities.push(new city(this,data.loc[0]*this.scale,data.loc[1]*this.scale,this.id.city,data,fortified))
        this.id.city++
    }
    outMap(){
        return types.map[this.map].term
    }
    display(layer){
        switch(this.scene){
            case `main`:
                layer.push()
                layer.translate(layer.width*0.5-this.zoom.position.x,layer.height*0.5-this.zoom.position.y)
                layer.scale(options.scale)
                layer.image(
                    graphics.load.map[this.map],
                    graphics.load.map[this.map].width*0.5*this.scale,
                    graphics.load.map[this.map].height*0.5*this.scale,
                    graphics.load.map[this.map].width*this.scale,
                    graphics.load.map[this.map].height*this.scale
                )
                this.cities.forEach(city=>city.display(layer,this.scene))
                this.units.forEach(unit=>unit.display(layer,this.scene))
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
                for(let a=0,la=this.units.length;a<la;a++){
                    if(this.units[a].player||this.time.active){
                        this.units[a].update(layer,this.scene)
                    }
                    if(this.units[a].remove){
                        this.units.splice(a,1)
                        a--
                        la--
                    }
                }
                this.teams.forEach(team=>{if(team.player||this.time.active){team.update(layer,this.scene)}})
                this.ui.update(layer,this.scene)
                if(this.time.active){
                    this.time.total--
                }
                this.zoom.position.x=constrain(this.zoom.position.x,layer.width*0.5,graphics.load.map[this.map].width*options.scale*this.scale+this.ui.width-layer.width*0.5)
                this.zoom.position.y=constrain(this.zoom.position.y,layer.height*0.5,graphics.load.map[this.map].height*options.scale*this.scale-layer.height*0.5)
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
                rel={position:{x:(mouse.position.x+this.zoom.position.x-layer.width*0.5)/options.scale/this.scale,y:(mouse.position.y+this.zoom.position.y-layer.height*0.5)/options.scale/this.scale}}
                this.cities.forEach(city=>city.onClick(layer,mouse,this.scene,rel))
                this.ui.onClick(layer,mouse,this.scene)
            break
        }
        this.zoom.dragging=0
    }
    onKey(layer,key){
        this.ui.onKey(layer,key,this.scene)
    }
}