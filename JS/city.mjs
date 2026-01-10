import {types,constants,dev,options,graphics} from './variables.mjs'
import {smoothAnim,distPos,round,random,max,min,floor} from './functions.mjs'
import {unit} from './unit.mjs'
export class city{
    constructor(operation,x,y,type){
        this.operation=operation
        this.position={x:x,y:y}
        this.type=type
        this.data=types.city[this.type]
        this.owner=-1
        this.recruits=floor(random(constants.spawn.base-constants.spawn.spend,constants.spawn.base)/constants.spawn.regen)*constants.spawn.regen
        this.mercenaries=floor(random(constants.spawn.base-constants.spawn.spend,constants.spawn.base)/constants.spawn.regen)*constants.spawn.regen
        this.visibility=0
        this.sieged=0
        this.units=[]
        this.ruleIndex=types.teamRef[this.data.rule]
        this.number=0
        this.pathfind={num:0,predecessor:0}
    }
    save(){
        let composite={
            name:this.data.name,
            owner:this.owner,
            recruits:this.recruits,
            mercenaries:this.mercenaries,
            visibility:this.visibility,
            sieged:this.sieged,
            units:[]
        }
        this.units.forEach(unit=>composite.units.push(unit.save()))
        return composite
    }
    load(composite){
        this.setOwner(composite.owner)
        this.recruits=composite.recruits
        this.mercenaries=composite.mercenaries
        this.visibility=composite.visibility
        this.sieged=composite.sieged
        this.data=types.city[this.type]
        this.units=[]
        composite.units.forEach(uni=>{this.units.push(new unit(this,0,0,0));last(this.units).load(uni)})
    }
    setOwner(owner){
        let team
        if(this.owner!=-1){
            team=this.operation.teams[types.teamRef[this.owner]]
            if(team.cities.indexOf(this)>=0){
                team.cities.splice(team.cities.indexOf(this),1)
            }
        }
        this.owner=owner
        if(this.owner!=-1){
            team=this.operation.teams[types.teamRef[this.owner]]
            team.cities.push(this)
        }
    }
    setCore(owner){
        let team=this.operation.teams[types.teamRef[owner]]
        team.cores.push(this)
    }
    initial(){
        if(this.units.length==0&&this.owner!=-1){
            this.units.push(new unit(this,types.teamRef[this.owner],1,round(constants.spawn.garrison*random(0.4,2)/100)*100))
            if(this.owner!=this.data.rule){
                this.recruits-=floor(random(15,21))*100
            }
        }
    }
    newTurn(){
        this.recruits=min(this.recruits+constants.spawn.regen*(this.recruits>=constants.spawn.base*0.8?0.5:this.recruits>=constants.spawn.base*0.6?0.75:1),constants.spawn.base)
        this.mercenaries=min(this.mercenaries+constants.spawn.regen*(this.mercenaries>=constants.spawn.base*0.8?0.4:this.mercenaries>=constants.spawn.base*0.6?0.6:0.8),constants.spawn.base)
        this.updateSiege()
    }
    newTurnTick(){
        let differ=0
        for(let a=0,la=this.units.length;a<la;a++){
            for(let b=a+1;b<la;b++){
                if(this.units[a].team!=this.units[b].team&&!this.operation.teams[this.units[a].team].allies.includes(this.units[b].team)){
                    if(this.units[a].value>=this.units[b].value*0.1&&this.units[b].value>=this.units[a].value*0.1){
                        differ=1
                        a=la
                        b=la
                    }else{
                        differ+=0.1
                    }
                }
            }
        }
        if(differ){
            this.sieged+=differ/10
        }else{
            this.sieged=0
        }
        this.units.forEach(unit=>{unit.tempVisible=false;unit.newTurn()})
    }
    minorRegen(){
        this.recruits=min(this.recruits+constants.spawn.regen*10,constants.spawn.base)
        this.mercenaries=min(this.mercenaries+constants.spawn.regen*10,constants.spawn.base)
    }
    spawn(type){
        let set=[`recruits`,`recruits`,`recruits`,`recruits`,`mercenaries`][type]
        let team=type==4?types.teamRef[`Free Company`]:type==3?this.operation.ui.turn.main:type==2?types.teamRef[this.owner]:this.ruleIndex
        let mult=types.team[team].auto?options.strength:1
        let num=floor(this[set]/100/[1,4,2,4,1.25][type]*mult)*100
        this.units.push(new unit(this,team,0,num))
        this[set]=type==0?max(0,this[set]-constants.spawn.spend*[1,1,0.75,1,1.5][type]):this[set]-constants.spawn.spend*[1,1,0.75,1,1.5][type]*(type==1&&types.team[team].auto?2:1)
        if(num==0){
            throw new Error(`Spawn 0`)
        }
        if(types.team[team].name==`Royal Army`||types.team[team].name==`Imperial Army`){
            throw new Error(`Headquarters Spawn`)
        }
    }
    getSpawn(type){
        let set=[`recruits`,`recruits`,`recruits`,`recruits`,`mercenaries`][type]
        let team=type==4?types.teamRef[`Free Company`]:type==3?this.operation.ui.turn.main:type==2?types.teamRef[this.owner]:this.ruleIndex
        let mult=types.team[team].auto?options.strength:1
        let num=floor(this[set]/100/[1,4,2,4,1.25][type]*mult)*100
        return max(0,num)
    }
    summonUnit(team,type,value){
        this.units.push(new unit(this,team,type,value))
    }
    raided(raider){
        let num=round(this.recruits/20+10)*10
        this.recruits-=num
        let total=0
        let send=[]
        for(let a=0,la=types.city[this.type].connect.length;a<la;a++){
            let target=types.cityRef[types.city[this.type].connect[a].name]
            let mult=[1,0.6,0.4][types.city[this.type].connect[a].type]*(types.city[target].rule==types.team[raider].name?2:1)
            total+=mult
            send.push([target,mult])
        }
        for(let a=0,la=send.length;a<la;a++){
            this.operation.cities[send[a][0]].recruits+=round(num*send[a][1]/total/10*0.5)*10
        }
    }
    getUnits(teams,type=-1){
        return this.units.filter(unit=>{return teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove&&!unit.removeMark})
    }
    getNotUnits(teams,type=-1){
        return this.units.filter(unit=>{return !teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove&&!unit.removeMark})
    }
    getUnitsVisible(teams,type=-1){
        return this.units.filter(unit=>{return unit.fade.trigger&&teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove&&!unit.removeMark})
    }
    getNotUnitsVisible(teams,type=-1){
        return this.units.filter(unit=>{return unit.fade.trigger&&!teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove&&!unit.removeMark})
    }
    getMostNotUnit(teams,type=-1){
        let result=this.getNotUnits(teams,type)
        let ledger=[]
        for(let a=0,la=result.length;a<la;a++){
            let done=false
            for(let b=0,lb=ledger.length;b<lb;b++){
                if(ledger[b][0]==result[a].team){
                    ledger[b][1]+=result[a].value
                    done=true
                    break
                }
            }
            if(!done){
                ledger.push([result[a].team,result[a].value])
            }
        }
        if(ledger.length==0){
            throw new Error('No Enemy Fail')
        }
        let supremum=[ledger[0][0],ledger[0][1]]
        for(let a=1,la=ledger.length;a<la;a++){
            if(ledger[a][1]>supremum[1]){
                supremum[1]=ledger[a][1]
                supremum[0]=ledger[1][0]
            }
        }
        return supremum[0]
    }
    updateVisibility(turn){
        this.visibility=this.units.some(unit=>{return unit.team==turn&&!unit.remove})||this.data.rule==types.team[turn].name?2:0
        if(turn>=0){
            if(this.visibility==0){
                for(let a=0,la=types.city[this.type].connect.length;a<la;a++){
                    if(this.operation.cities[types.cityRef[types.city[this.type].connect[a].name]].units.some(unit=>{return unit.team==turn&&!unit.remove})){
                        this.visibility=1
                    }
                }
            }
        }
    }
    updateUnits(){
        if(dev.close){
            for(let a=0,la=this.units.length;a<la;a++){
                if(!this.units[a].remove){
                    for(let b=0,lb=a;b<lb;b++){
                        if(this.units[a].team==this.units[b].team&&this.units[a].type==this.units[b].type&&!this.units[b].remove){
                            this.units[a].remove=true
                            this.units[b].turns=(this.units[a].turns*this.units[a].value+this.units[b].turns*this.units[b].value)/(this.units[a].value+this.units[b].value)
                            this.units[b].value+=this.units[a].value
                            this.units[b].edit.num+=this.units[a].edit.num
                        }
                    }
                }
                if(!this.units[a].remove){
                    this.units[a].update(this.visibility)
                }
            }
        }
        if(this.owner==-1||!this.units.some(unit=>types.team[unit.team].name==this.owner&&(unit.type==1||!this.units.some(subunit=>![unit.team,this.operation.teams[unit.team].allies].includes(subunit.team)&&subunit.type==1))&&!unit.remove)){
            let fail=true
            for(let a=0,la=this.units.length;a<la;a++){
                if(this.units[a].type==1&&!this.units[a].remove){
                    this.setOwner(types.team[this.units[a].team].name)
                    fail=false
                    break
                }
            }
            if(fail){
                for(let a=0,la=this.units.length;a<la;a++){
                    if(this.units[a].type==0&&!this.units[a].remove){
                        this.setOwner(types.team[this.units[a].team].name)
                        fail=false
                        break
                    }
                }
            }
            if(fail){
                this.setOwner(-1)
            }
        }
        if(!this.units.some(unit=>unit.type==0)&&this.owner!=-1&&this.units.length>=1){
            let own=types.teamRef[this.owner]
            let aligned=[own,...this.operation.teams[own].allies]
            for(let a=0,la=this.units.length;a<la;a++){
                if(this.units[a].type==1&&!aligned.includes(this.units[a].team)&&!this.units[a].remove){
                    this.units[a].remove=true
                    this.units.push(new unit(this,this.units[a].team,1-this.units[a].type,this.units[a].value))
                }
            }
        }
    }
    updateSiege(){
        if(this.owner!=-1){
            let own=types.teamRef[this.owner]
            let aligned=[own,...this.operation.teams[own].allies]
            if(this.units.some(unit=>!aligned.includes(unit.team)&&unit.type==0)){
                for(let b=0,lb=this.units.length;b<lb;b++){
                    if(aligned.includes(this.units[b].team)&&this.units[b].type==0&&!this.units[b].remove){
                        this.units[b].remove=true
                        this.units.splice(0,0,new unit(this,this.units[b].team,1-this.units[b].type,this.units[b].value))
                    }
                }
            }
        }
    }
    display(layer,scene){
        switch(scene){
            case `title`: case `setup`:
                layer.push()
                layer.translate(this.position.x,this.position.y)
                this.units.forEach(unit=>unit.display(layer))
                layer.pop()
            break
            case `main`:
                layer.push()
                layer.translate(this.position.x,this.position.y)
                this.units.forEach(unit=>unit.display(layer))
                if(this.number>0){
                    let variant=this.operation.ui.spawnVariant(this,this.operation.ui.turn.main)
                    if(variant>=0){
                        layer.fill(0,this.number)
                        layer.stroke(255,this.number)
                        layer.strokeWeight(2)
                        layer.textSize(40)
                        layer.text(this.getSpawn(variant),0,2)
                    }
                }
                layer.pop()
            break
            case `map`: case `edit`:
                if(dev.road){
                    layer.strokeWeight(20)
                    for(let a=0,la=types.city[this.type].connect.length;a<la;a++){
                        layer.stroke(...[[0,0,0],[0,0,100],[0,100,200]][types.city[this.type].connect[a].type])
                        try{
                            let cit=this.operation.cities[types.cityRef[types.city[this.type].connect[a].name]]
                            layer.line(this.position.x,this.position.y,cit.position.x*0.5+this.position.x*0.5,cit.position.y*0.5+this.position.y*0.5)
                        }catch(e){
                            print(types.city[this.type].connect[a].name)
                        }
                    }
                }else{
                    layer.push()
                    layer.translate(this.position.x,this.position.y)
                    layer.scale(0.5/this.operation.zoom.scaling)
                    let img=graphics.load.city[types.cityType[this.data.type].term]
                    layer.image(img,0,0,img.width,img.height)
                    if(this.owner!=-1){
                        img=[graphics.load.team[types.team[types.teamRef[this.owner]].loadIndex],graphics.load.unit[2]]
                        layer.image(img[0],0,img[1].height*0.25-10,img[1].width*0.5,img[1].height*0.5)
                        layer.image(img[1],0,img[1].height*0.25-10,img[1].width*0.5,img[1].height*0.5)
                    }
                    layer.pop()
                }
            break
        }
    }
    update(layer,scene){
        switch(scene){
            case `title`: case `setup`:
                this.visibility=2
            case 'main':
                if(!dev.close){
                    let cap=0
                    for(let a=0,la=this.units.length;a<la;a++){
                        if(a!=0&&!this.units[a].remove&&!this.units[a].combining){
                            cap+=(33-this.units[a].type*9)*(this.data.name==`Ulm`&&types.map[this.operation.map].term==`minim`?-1:1)
                        }
                        this.units[a].goal.position.y=cap
                        if(this.units[a].combining){
                            let fail=true
                            for(let b=0,lb=a;b<lb;b++){
                                if(this.units[a].team==this.units[b].team&&this.units[a].type==this.units[b].type){
                                    fail=false
                                    break
                                }
                            }
                            if(fail){
                                this.units[a].combining=false
                            }
                        }
                        for(let b=0,lb=a;b<lb;b++){
                            if(this.units[a].team==this.units[b].team&&this.units[a].type==this.units[b].type&&!this.units[a].remove&&!this.units[b].remove&&!this.units[a].removeMark&&!this.units[b].removeMark){
                                this.units[a].goal.position.y=this.units[b].goal.position.y
                                this.units[a].combining=true
                                if(distPos(this.units[a],this.units[b])<1||dev.instant){
                                    this.units[a].remove=true
                                    this.units[a].fade.main=0
                                    this.units[b].turns=(this.units[a].turns*this.units[a].value+this.units[b].turns*this.units[b].value)/(this.units[a].value+this.units[b].value)
                                    this.units[b].value+=this.units[a].value
                                    this.units[b].edit.num+=this.units[a].edit.num
                                }
                            }
                        }
                        if(this.units[a].fade.main>0||!this.units[a].remove){
                            this.units[a].update(this.visibility)
                        }
                        if(!this.units[a].remove&&!this.units[a].combining){
                            cap+=(33-this.units[a].type*9)*(this.data.name==`Ulm`&&types.map[this.operation.map].term==`minim`?-1:1)
                        }
                    }
                    this.number=smoothAnim(this.number,this.operation.ui.tabs.active==16,0,1,15)
                }
                for(let a=0,la=this.units.length;a<la;a++){
                    if(this.units[a].remove&&(this.units[a].fade.main<=0||dev.instant||dev.close)){
                        this.units.splice(a,1)
                        a--
                        la--
                    }
                }
            break
        }
    }
    onClick(layer,mouse,scene,rel){
        switch(scene){
            case 'main':
                if(distPos(rel,this)<60){
                    this.operation.ui.cityClick(layer,mouse,scene,this.type)
                }
            break
            case 'edit':
                if(distPos(rel,this)<120){
                    this.operation.ui.cityClick(layer,mouse,scene,this.type)
                }
            break
        }
    }
}