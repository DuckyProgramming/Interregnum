class city{
    constructor(operation,x,y,type){
        this.operation=operation
        this.position={x:x,y:y}
        this.type=type
        this.data=types.city[this.type]
        this.owner=types.city[this.type].rule
        this.recruits=floor(random(constants.spawn.base-constants.spawn.spend,constants.spawn.base)/constants.spawn.regen)*constants.spawn.regen
        this.fade={main:0,trigger:true}
        this.visibility=0
        this.sieged=0
        this.units=[]
        this.initial()
    }
    save(){
        let composite={
            position:this.position,
            type:this.type,
            owner:this.owner,
            recruits:this.recruits,
            fade:this.fade,
            visibility:this.visibility,
            sieged:this.sieged,
            units:[]
        }
        this.units.forEach(unit=>composite.units.push(unit.save()))
        return composite
    }
    load(composite){
        this.position=composite.position
        this.type=composite.type
        this.owner=composite.owner
        this.recruits=composite.recruits
        this.fade=composite.fade
        this.visibility=composite.visibility
        this.sieged=composite.sieged
        this.data=types.city[this.type]
        this.units=[]
        composite.units.forEach(uni=>{this.units.push(new unit(this,0,0,0));last(this.units).load(uni)})
    }
    initial(){
        this.units.push(new unit(this.city,findName(this.data.rule,types.team),1,round(constants.spawn.garrison*random(0.4,2)/100)*100))
    }
    newTurn(){
        this.recruits=min(this.recruits+constants.spawn.regen*(this.recruits>=constants.spawn.base*0.8?0.5:this.recruits>=constants.spawn.base*0.6?0.75:1),constants.spawn.base)
        let differ=false
        for(let a=0,la=this.units.length;a<la;a++){
            for(let b=a+1;b<la;b++){
                if(this.units[a].team!=this.units[b].team&&!types.team[this.units[a].team].allies.includes(this.units[b].team)){
                    differ=true
                }
            }
        }
        if(differ){
            this.sieged+=0.1
        }else{
            this.sieged=0
        }
        this.units.forEach(unit=>{unit.tempVisible=false;unit.newTurn()})
        if(!this.units.some(unit=>unit.type==1)&&this.owner!=-1){
            let own=findName(this.owner,types.team)
            let aligned=[own,...types.team[own].allies]
            for(let a=0,la=this.units.length;a<la;a++){
                if(this.units[a].type==0&&!aligned.includes(this.units[a].team)){
                    this.units[a].remove=true
                    for(let b=0,lb=this.units.length;b<lb;b++){
                        if(aligned.includes(this.units[b].team)){
                            this.units[b].remove=true
                            this.units.push(new unit(this,this.units[b].team,1-this.units[b].type,this.units[b].value))
                        }
                    }
                    break
                }
            }
        }
    }
    spawn(type){
        let team=type==2?findName(this.owner,types.team):findName(this.data.rule,types.team)
        let num=floor(this.recruits/100/[1,4,2][type])*100
        this.units.push(new unit(this.city,team,0,num))
        this.recruits=max(0,this.recruits-constants.spawn.spend*[1,1,0.5][type])
        if(num==0){
            throw new Error('SPAWN 0')
        }
    }
    getSpawn(type){
        return floor(this.recruits/100/[1,4,2][type])*100
    }
    raided(){
        this.recruits=round(this.recruits/20)*10
    }
    getUnits(teams,type=-1){
        return this.units.filter(unit=>{return teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove})
    }
    getNotUnits(teams,type=-1){
        return this.units.filter(unit=>{return !teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove})
    }
    getUnitsVisible(teams,type=-1){
        return this.units.filter(unit=>{return unit.fade.trigger&&teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove})
    }
    getNotUnitsVisible(teams,type=-1){
        return this.units.filter(unit=>{return unit.fade.trigger&&!teams.includes(unit.team)&&(type==-1||unit.type==type)&&!unit.remove})
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
            return 0
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
        this.visibility=this.units.some(unit=>{return unit.team==turn||this.data.rule==types.team[turn].name})?2:0
        if(turn>=0){
            if(this.visibility==0){
                for(let a=0,la=types.city[this.type].connect.length;a<la;a++){
                    if(this.operation.cities[findName(types.city[this.type].connect[a].name,types.city)].units.some(unit=>{return unit.team==turn})){
                        this.visibility=1
                    }
                }
            }
        }
    }
    display(layer,scene){
        switch(scene){
            case 'main':
                layer.push()
                layer.translate(this.position.x,this.position.y)
                this.units.forEach(unit=>unit.display(layer))
                layer.pop()
            break
            case 'map':
                if(dev.road){
                    layer.stroke(0)
                    layer.strokeWeight(20)
                    for(let a=0,la=types.city[this.type].connect.length;a<la;a++){
                        let cit=this.operation.cities[findName(types.city[this.type].connect[a].name,types.city)]
                        layer.line(this.position.x,this.position.y,cit.position.x*0.5+this.position.x*0.5,cit.position.y*0.5+this.position.y*0.5)
                    }
                }else{
                    layer.push()
                    layer.translate(this.position.x,this.position.y)
                    let img=graphics.load.city[this.data.elect?1:0]
                    layer.image(img,0,0,img.width,img.height)
                    if(this.owner!=-1){
                        img=graphics.load.unit[findName(this.owner,types.team)][2]
                        layer.image(img,0,img.height*0.25-15,img.width*0.5,img.height*0.5)
                    }
                    layer.pop()
                }
            break
        }
    }
    update(layer,scene){
        switch(scene){
            case 'main':
                if(dev.close){
                    for(let a=0,la=this.units.length;a<la;a++){
                        for(let b=0,lb=a;b<lb;b++){
                            if(this.units[a].team==this.units[b].team&&this.units[a].type==this.units[b].type&&!this.units[a].remove&&!this.units[b].remove){
                                this.units[a].remove=true
                                this.units[b].value+=this.units[a].value
                                this.units[b].turns=floor(this.units[a].turns*0.5+this.units[b].turns*0.5)
                            }
                        }
                    }
                }else{
                    this.fade.main=smoothAnim(this.fade.main,this.fade.trigger,0,1,15)
                    let cap=0
                    for(let a=0,la=this.units.length;a<la;a++){
                        if(a!=0&&!this.units[a].remove){
                            cap+=33-this.units[a].type*9
                        }
                        this.units[a].goal.position.y=cap
                        for(let b=0,lb=a;b<lb;b++){
                            if(this.units[a].team==this.units[b].team&&this.units[a].type==this.units[b].type&&!this.units[a].remove&&!this.units[b].remove){
                                this.units[a].goal.position.y=this.units[b].goal.position.y
                                if(distPos(this.units[a],this.units[b])<1||dev.instant){
                                    this.units[a].remove=true
                                    this.units[a].fade.main=0
                                    this.units[b].value+=this.units[a].value
                                    this.units[b].turns=floor(this.units[a].turns*0.5+this.units[b].turns*0.5)
                                }
                            }
                        }
                        this.units[a].update(this.visibility)
                        if(!this.units[a].remove){
                            cap+=33-this.units[a].type*9
                        }
                    }
                }
                for(let a=0,la=this.units.length;a<la;a++){
                    if(this.units[a].remove&&(this.units[a].fade.main<=0||dev.instant||dev.close)){
                        this.units.splice(a,1)
                        a--
                        la--
                    }
                }
                if(!this.units.some(unit=>types.team[unit.team].name==this.owner&&unit.type==1)){
                    let decide=false
                    let supremum=[0,findName(this.data.rule,types.team)]
                    for(let a=0,la=this.units.length;a<la;a++){
                        if(this.units[a].value>supremum[0]&&this.units[a].type==1){
                            supremum[0]=this.units[a].value
                            supremum[1]=types.team[this.units[a].team].name
                            decide=true
                        }
                    }
                    this.owner=supremum[1]
                    if(!decide){
                        supremum=[0,-1]
                        for(let a=0,la=this.units.length;a<la;a++){
                            if(this.units[a].value>supremum[0]){
                                supremum[0]=this.units[a].value
                                supremum[1]=types.team[this.units[a].team].name
                            }
                        }
                        this.owner=supremum[1]
                    }
                }
                if(!this.units.some(unit=>unit.type==0)&&this.owner!=-1){
                    let own=findName(this.owner,types.team)
                    let aligned=[own,...types.team[own].allies]
                    for(let a=0,la=this.units.length;a<la;a++){
                        if(this.units[a].type==1&&!aligned.includes(this.units[a].team)){
                            this.units[a].remove=true
                            this.units.push(new unit(this,this.units[a].team,1-this.units[a].type,this.units[a].value))
                        }
                    }
                }
            break
        }
    }
    onClick(layer,mouse,scene,rel){
        switch(scene){
            case 'main':
                if(distPos(rel,this)<60){
                    this.operation.ui.cityClick(layer,mouse,this.type)
                }
            break
        }
    }
}