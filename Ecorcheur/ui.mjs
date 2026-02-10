import {dev,types} from './variables.mjs'
import {last,smoothAnim,random,round,inPointBox,boxify} from './functions.mjs'
export class ui{
    constructor(operation){
        this.operation=operation
        this.width=200
        this.tabs={active:0,anim:[],record:[]}
        this.select={city:-1}
        this.battle={enemy:0,result:0,circumstance:[]}
        /*
        [0,0] - Attacking City
        [0,1] - Attacking and Besieging City
        [1,0] - Conduct from Siege
        [1,1] - Breakout from Siege
        [2,0] - Rebel Against Enemy Force
        [2,1] - Rebels Besiege City
        */
        this.initial()
    }
    save(){
        let composite={
            tabs:this.tabs,
            select:this.select,
            battle:this.battle,
        }
        return composite
    }
    load(composite){
        this.tabs=composite.tabs
        this.select=composite.select
        this.battle=composite.battle
    }
    initial(){
        for(let a=0,la=3;a<la;a++){
            this.tabs.anim.push(0)
        }
    }
    moveTab(tab){
        this.tabs.active=tab
        this.tabs.record.push(tab)
        if(this.tabs.record.length>100){
            delete this.tabs.record[0]
            this.tabs.record.splice(0,1)
        }
    }
    accept(){
        /*let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
        let cit=[
            this.operation.cities[this.select.targetCity],
            this.operation.cities[this.select.city],
            this.operation.cities[this.select.city]
        ][this.battle.circumstance[0]]
        let totals=[]
        for(let a=0,la=this.battle.result.casualties.length;a<la;a++){
            totals.push(0)
            for(let b=0,lb=this.battle.result.casualties[a].length;b<lb;b++){
                totals[a]+=this.battle.result.casualties[a][b].base
            }
        }
        for(let a=0,la=this.battle.result.casualties.length;a<la;a++){
            for(let b=0,lb=this.battle.result.casualties[a].length;b<lb;b++){
                let left=this.battle.result.casualties[a][b].number
                for(let c=0,lc=cit.units.length;c<lc;c++){
                    if(cit.units[c].team==this.battle.result.casualties[a][b].team&&cit.units[c].type==this.battle.result.casualties[a][b].type&&!cit.units[c].remove){
                        let minus=min(left,cit.units[c].value)
                        left-=minus
                        if(cit.units[c].value<=minus){
                            cit.units[c].remove=true
                        }else{
                            cit.units[c].value-=minus
                        }
                    }
                }
                if(left>0){
                    for(let c=0,lc=cit.units.length;c<lc;c++){
                        if(cit.units[c].team==this.battle.result.casualties[a][b].team&&cit.units[c].type!=this.battle.result.casualties[a][b].type&&!cit.units[c].remove){
                            let minus=min(left,cit.units[c].value)
                            left-=minus
                            if(cit.units[c].value<=minus){
                                cit.units[c].remove=true
                            }else{
                                cit.units[c].value-=minus
                            }
                        }
                    }
                }
                for(let c=0,lc=this.battle.result.casualties[1-a].length;c<lc;c++){
                    this.operation.teams[this.battle.result.casualties[1-a][c].team].kills+=round(this.battle.result.casualties[a][b].number*this.battle.result.casualties[1-a][c].base/totals[1-a]/100+random(-0.5,0.5))*100
                }
                this.operation.teams[this.battle.result.casualties[a][b].team].deaths+=this.battle.result.casualties[a][b].number
            }
        }
        let totalLeft=[0,0]
        for(let a=0,la=cit.units.length;a<la;a++){
            if(!cit.units[a].remove){
                totalLeft[aligned.includes(cit.units[a].team)?0:1]+=cit.units[a].value
            }
        }
        let over=false
        if(totalLeft[0]==0){
            if(totalLeft[1]==0){
                this.battle.result.winner=[3]
            }else{
                this.battle.result.winner=[2]
            }
            this.turn.timer=30
            over=true
        }else if(totalLeft[1]==0){
            this.battle.result.winner=[1]
            this.turn.timer=30
            over=true
        }
        if(this.battle.circumstance[0]==0){
            if(this.battle.circumstance[1]==0){
                if(last(this.battle.result.winner)==1){
                    let rule=this.operation.cities[this.select.targetCity].ruleIndex
                    if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                        this.operation.cities[this.select.targetCity].raided(this.turn.main)
                    }
                    if(this.operation.cities[this.select.targetCity].getNotUnits(aligned).length>0&&!over){
                        this.moveTab(this.operation.cities[this.select.targetCity].getUnits(aligned,1).length>0?12:11)
                        if(types.team[this.turn.main].auto){
                            this.singleVisibility(this.select.targetCity)
                        }
                        this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
                    }else{
                        this.turn.timer=15
                    }
                }else{
                    for(let a=0,la=this.select.moved.length;a<la;a++){
                        if(this.select.moved[a].value<=0){
                            this.select.moved[a].remove=true
                        }else if(!this.select.moved[a].remove){
                            let base=this.select.moved[a]
                            this.operation.cities[this.select.city].units.push(new unit(this.operation.cities[this.select.city],base.team,0,base.value))
                            last(this.operation.cities[this.select.city].units).target=base.target
                            last(this.operation.cities[this.select.city].units).position.x=this.operation.cities[this.select.targetCity].position.x-this.operation.cities[this.select.city].position.x+base.position.x
                            last(this.operation.cities[this.select.city].units).position.y=this.operation.cities[this.select.targetCity].position.y-this.operation.cities[this.select.city].position.y+base.position.y
                            last(this.operation.cities[this.select.city].units).fade.main=1
                            this.select.moved[a].remove=true
                            this.select.moved[a].fade.main=0
                        }
                    }
                    this.turn.timer=30
                }
            }else if(this.battle.circumstance[1]==1){
                if(last(this.battle.result.winner)==1){
                    let rule=this.operation.cities[this.select.targetCity].ruleIndex
                    if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                        this.operation.cities[this.select.targetCity].raided(this.turn.main)
                    }
                    this.operation.cities[this.select.targetCity].getNotUnits(aligned).forEach(unit=>{
                        unit.remove=true
                        this.operation.teams[unit.team].deaths+=unit.value
                        for(let c=0,lc=this.battle.result.casualties[0].length;c<lc;c++){
                            this.operation.teams[this.battle.result.casualties[0][c].team].kills+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/100+random(-0.5,0.5))*100
                            this.operation.teams[this.battle.result.casualties[0][c].team].prisoners[unit.team]+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/100+random(-0.5,0.5))*100
                        }
                    })
                }
                this.turn.timer=15
            }
        }else if(this.battle.circumstance[0]==1){
            if(this.battle.circumstance[1]==0){
                if(last(this.battle.result.winner)==1){
                    this.operation.cities[this.select.city].getNotUnits(aligned).forEach(unit=>{
                        unit.remove=true
                        this.operation.teams[unit.team].deaths+=unit.value
                        for(let c=0,lc=this.battle.result.casualties[0].length;c<lc;c++){
                            this.operation.teams[this.battle.result.casualties[0][c].team].kills+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/100+random(-0.5,0.5))*100
                            this.operation.teams[this.battle.result.casualties[0][c].team].prisoners[unit.team]+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/100+random(-0.5,0.5))*100
                        }
                    })
                }
                this.turn.timer=15
            }else if(this.battle.circumstance[1]==1){
                if(last(this.battle.result.winner)==1&&this.operation.cities[this.select.city].getNotUnits(aligned).length>0){
                    this.moveTab(13)
                    if(types.team[this.turn.main].auto){
                        this.singleVisibility(this.select.city)
                    }
                    if(types.city[this.select.city].connect.length==0){
                        this.moveTab(0)
                    }else{
                        this.select.targetCity=types.cityRef[randin(types.city[this.select.city].connect).name]
                        this.agency.count=0
                    }
                }else{
                    this.turn.timer=15
                }
            }
        }else if(this.battle.circumstance[0]==2){
            if(this.battle.circumstance[1]==0){
                if(last(this.battle.result.winner)==1){
                    if(this.operation.cities[this.select.targetCity].getNotUnits(aligned).length>0){
                        this.moveTab(13)
                        if(types.team[this.turn.main].auto){
                            this.singleVisibility(this.select.city)
                        }
                        if(types.city[this.select.city].connect.length==0){
                            this.moveTab(0)
                        }else{
                            this.select.targetCity=types.cityRef[randin(types.city[this.select.city].connect).name]
                            this.agency.count=0
                        }
                    }else{
                        this.turn.timer=15
                    }
                }else{
                    for(let a=0,la=this.select.moved.length;a<la;a++){
                        this.select.moved[a].remove=true
                    }
                    this.turn.timer=15
                }
            }else if(this.battle.circumstance[1]==1){
                if(last(this.battle.result.winner)==1){
                    this.operation.cities[this.select.targetCity].getNotUnits(aligned).forEach(unit=>{
                        unit.remove=true
                        this.operation.teams[unit.team].deaths+=unit.value
                        for(let c=0,lc=this.battle.result.casualties[0].length;c<lc;c++){
                            this.operation.teams[this.battle.result.casualties[0][c].team].kills+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/100+random(-0.5,0.5))*100
                            this.operation.teams[this.battle.result.casualties[0][c].team].prisoners[unit.team]+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/100+random(-0.5,0.5))*100
                        }
                    })
                }
                this.turn.timer=15
            }
        }
        if(this.tabs.active==7&&this.turn.main==0){
            throw new Error(`Acceptance Stuck: ${this.battle.circumstance}`)
        }
        cit.updateUnits()*/
    }
    cityClick(layer,mouse,scene,city){
        switch(scene){
            case `main`:
                if(mouse.position.x<layer.width-this.width&&!this.select.trigger){
                    if(!this.turn.locked&&!this.turn.pinned&&this.tabs.active==0){
                        this.moveTab(1)
                        this.select.city=city
                    }
                }
            break
        }
    }
    collectUnits(player,enemy){
        this.operation.calc.sides[0].force=[{team:player.team,type:0,number:player.value,dist:0}]
        this.operation.calc.sides[1].force=[{team:enemy.team,type:0,number:enemy.value,dist:0}]
        this.battle.result=this.operation.calc.calc()
        this.operation.calc.reset()
        this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
    }
    display(layer,scene){
        layer.noStroke()
        let tick=0
        let count=0
        let set
        let rows
        switch(scene){
            case `main`:
                layer.fill(120)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                this.tabs.anim.forEach((anim,index)=>{
                    layer.fill(150)
                    layer.rect(layer.width+this.width*0.5-this.width*anim,layer.height*0.5,this.width,layer.height)
                    if(anim>0){
                        layer.push()
                        layer.translate(layer.width+this.width*0.5-this.width*anim,0)
                        let cit
                        tick=75
                        count=1
                        switch(index){
                            case 0:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Money:\n${this.operation.resources.money}`,0,40)
                                layer.fill(0)
                                layer.text(`Food:\n${this.operation.resources.food}`,0,100)
                                layer.fill(0)
                                layer.text(`Time:`,0,145)
                                layer.stroke(0)
                                layer.strokeWeight(1)
                                layer.noFill()
                                layer.rect(0,170,150,10,4)
                                layer.fill(0)
                                layer.rect(-60+60*this.operation.time.total/this.operation.time.base,170,150*this.operation.time.total/this.operation.time.base,10,4)
                                tick+=60

                                /*layer.textSize(18)
                                layer.text(`Turns Left: ${this.turn.count+1}`,0,tick+12.5)
                                tick+=25
                                for(let a=0,la=4;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Pass`,`Alliances`,`Map`,`Recruitments`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }*/
                            break
                            case 1:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Enemy\nContacted`,0,40)
                                for(let a=0,la=2;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Battle`,`Retreat`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 2:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Battle Results`,0,40)

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Accept Results`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50

                                layer.textSize(18)
                                layer.text(`Winner: ${[`Player`,`Opponent`,`Nobody`][last(this.battle.result.winner)-1]}`,0,tick+17.5)
                                tick+=40
                                for(let a=0,la=this.battle.result.casualties.length;a<la;a++){
                                    for(let b=0,lb=this.battle.result.casualties[a].length;b<lb;b++){
                                        let result=this.battle.result.casualties[a][b]
                                        layer.textSize(18)
                                        layer.text(`${types.team[result.team].name}: ${result.number}`,0,tick+12.5)
                                        tick+=25
                                    }
                                    tick+=10
                                }
                            break
                            /*
                            case 1:
                                cit=this.operation.cities[this.select.city]
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Selected City:\n${cit.data.name}`,0,40)

                                layer.textSize(18)
                                layer.text(`Owner: ${cit.owner==-1?`None`:cit.owner}`,0,tick+12.5)
                                tick+=25
                                if(
                                    cit.getUnits([this.turn.main]).length>0||
                                    cit.data.rule==types.team[this.turn.main].name
                                ){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Pass`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                                if(cit.data.type!=7&&cit.data.type!=10){
                                    if(cit.data.rule==types.team[this.turn.main].name){
                                        layer.fill(120)
                                        layer.rect(0,tick+25,160,40,10)
                                        layer.fill(0)
                                        layer.textSize(15)
                                        layer.text(cit.getNotUnits(aligned).length>0?`Rebel With ${cit.getSpawn(1)} Troops`:`Recruit ${cit.getSpawn(0)} Troops`,0,tick+25)
                                        layer.textSize(10)
                                        layer.text(count,70,tick+15)
                                        tick+=50
                                        count++
                                    }else if(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0){
                                        layer.fill(120)
                                        layer.rect(0,tick+25,160,40,10)
                                        layer.fill(0)
                                        layer.textSize(15)
                                        layer.text(`Recruit ${cit.getSpawn(2)} Troops`,0,tick+25)
                                        layer.textSize(10)
                                        layer.text(count,70,tick+15)
                                        tick+=50
                                        count++
                                    }
                                }
                                if(cit.getUnits([this.turn.main]).length>0){
                                    if(cit.getUnits([this.turn.main],0).length>0){
                                        layer.fill(120)
                                        layer.rect(0,tick+25,160,40,10)
                                        layer.fill(0)
                                        layer.textSize(15)
                                        layer.text(`Move Units`,0,tick+25)
                                        layer.textSize(10)
                                        layer.text(count,70,tick+15)
                                        tick+=50
                                        count++
                                    }
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(cit.getNotUnits(aligned).length<=0?`Reorganize`:cit.getUnits([this.turn.main],1).length>0?`Break Out`:`Storm the City`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                    if(cit.getNotUnits(aligned).length>0&&cit.getUnits([this.turn.main],1).length>0){
                                        layer.fill(120)
                                        layer.rect(0,tick+25,160,40,10)
                                        layer.fill(0)
                                        layer.textSize(15)
                                        layer.text(`Surrender`,0,tick+25)
                                        layer.textSize(10)
                                        layer.text(count,70,tick+15)
                                        tick+=50
                                        count++
                                    }
                                }
                                if(cit.owner==types.team[this.turn.main].name&&cit.data.type==3){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`${types.map[this.operation.map].hq[0]==`Imperial Army`?`Imperial`:`Royal`} Diet -\nDelegate Turn`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                                if(cit.owner==types.team[this.turn.main].name&&(cit.data.type==4||cit.data.type==6)){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`${types.map[this.operation.map].hq[0]==`Imperial Army`?`Imperial`:`Royal`} Cathedral -\nForce Rebellion`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                                if(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0&&(cit.data.type==5||cit.data.type==10)){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Hire ${cit.getSpawn(4)} Mercenaries`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                                if(cit.getUnits([this.turn.main]).length>0&&cit.getNotUnits(aligned).length<=0&&cit.owner!=types.team[this.turn.main].name){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Take Control`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 2:
                                cit=this.operation.cities[this.select.city]
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Reorganize\nUnits`,0,40)
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.rect(70,tick+60,20,20,10)
                                    if(cit.units[a].edit.trigger){
                                        layer.fill(120,240,120)
                                    }
                                    layer.rect(-12.5,tick+60,135,20,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`${cit.units[a].value} ${[`Army`,`Garrison`][cit.units[a].type]}\n${types.team[cit.units[a].team].name}`,0,tick+25)
                                    layer.text(cit.units[a].edit.num,-12.5,tick+60)
                                    layer.text(`-`,70,tick+60)
                                    tick+=75
                                }
                            break
                            case 3:
                                cit=this.operation.cities[this.select.city]
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Select Units\nto Move`,0,40)

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Confirm`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Disband`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Escape`,60,tick+15)
                                tick+=50
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    if(
                                        cit.units[a].type==0&&(
                                            cit.units[a].team==this.turn.main||
                                            this.operation.teams[this.turn.main].allies.includes(cit.units[a].team)
                                        )
                                    ){
                                        layer.fill(120)
                                        layer.rect(0,tick+25,160,40,10)
                                        layer.fill(120)
                                        if(cit.units[a].edit.trigger){
                                            layer.fill(120,240,120)
                                        }
                                        layer.rect(0,tick+60,160,20,10)
                                        layer.fill(0)
                                        layer.textSize(15)
                                        layer.text(`${cit.units[a].value} Army\n${types.team[cit.units[a].team].name}`,0,tick+25)
                                        layer.text(cit.units[a].edit.num,0,tick+60)
                                        tick+=75
                                    }
                                }
                            break
                            case 4:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Make or Break\nAlliances`,0,40)

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Make Alliance`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Alliance Grid`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                                if(this.operation.teams.some((team,index)=>this.operation.teams[this.turn.main].prisoners[index]>0&&index!=this.turn.main)){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Release Prisoners`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                                for(let a=0,la=this.operation.teams[this.turn.main].allies.length;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Break Alliance With\n${types.team[this.operation.teams[this.turn.main].allies[a]].name}`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 5:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Next Player:\n${types.team[this.turn.main].name}`,0,40)

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Begin`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                for(let a=0,la=this.operation.teams[this.turn.main].notif.length;a<la;a++){
                                    layer.textSize(15)
                                    layer.text(this.operation.teams[this.turn.main].notif[a],0,tick+20)
                                    tick+=40
                                }
                            break
                            case 6:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Make\nAlliances`,0,40)
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(
                                        a!=this.turn.main&&
                                        !this.operation.teams[this.turn.main].allies.includes(a)&&
                                        this.operation.teams[a].name!=`Free Company`&&
                                        !types.teamKey[0].includes(this.operation.teams[a].name)&&
                                        !types.teamKey[1].includes(this.operation.teams[a].name)
                                    ){
                                        layer.fill(120)
                                        layer.rect(0,tick+12.5,160,25,10)
                                        layer.fill(0)
                                        layer.textSize(12)
                                        layer.text(`${this.operation.teams[a].offers.includes(this.turn.main)?`Accept`:this.operation.teams[a].cores.length>0&&!this.operation.teams[a].cores.some(city=>city.data.type!=7&&(!aligned.includes(types.teamRef[city.owner])||city.units.some(unit=>!aligned.includes(unit.team))))?`Force`:this.operation.teams[this.turn.main].offers.includes(a)?`Pending`:`Offer`}: ${types.team[a].name}`,0,tick+12.5)
                                        layer.textSize(10)
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+10)
                                        tick+=35
                                        count++
                                    }
                                }
                            break
                            case 7:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Select Move\nTarget`,0,40)
                            break
                            case 8:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Pick Defender\nStrategy`,0,40)
                                for(let a=0,la=2;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Battle`,`Siege`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 10:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Pick Attacker\nStrategy`,0,40)
                                for(let a=0,la=2;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Storm the City`,`Siege`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 11:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Pick Defender\nStrategy`,0,40)
                                for(let a=0,la=2;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Retreat`,`Siege`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                            break
                            case 12: case 13:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Select Retreat\nTarget`,0,40)
                            break
                            case 14:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Delegate Turn`,0,40)
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(a!=this.turn.main){
                                        layer.fill(120)
                                        layer.rect(0,tick+12.5,160,25,10)
                                        layer.fill(0)
                                        layer.textSize(12)
                                        layer.text(`Delegate: ${types.team[a].name}`,0,tick+12.5)
                                        layer.textSize(10)
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count],70,tick+10)
                                        tick+=35
                                        count++
                                    }
                                }
                            break
                            case 15:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Select Rebellion\nTarget`,0,40)
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Cancel`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                count++
                            break
                            case 16:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Viewing\nRecruitment`,0,40)
                            break
                            case 17:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Select Retreat\nTarget`,0,40)
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Siege`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                count++
                            break
                            case 18:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Release\nPrisoners`,0,40)

                                layer.textSize(18)
                                layer.text(`Total Held: ${this.operation.teams[this.turn.main].prisoners.reduce((acc,value)=>acc+value,0)}`,0,tick+12.5)
                                tick+=25
                                layer.text(`Total Lost: ${this.operation.teams.reduce((acc,team)=>team.prisoners[this.turn.main]+acc,0)}`,0,tick+12.5)
                                tick+=25

                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=55
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(this.operation.teams[this.turn.main].prisoners[a]>0){
                                        if(a==this.turn.main){
                                            throw new Error(`Self Prisoner Fail`)
                                        }
                                        layer.fill(120)
                                        layer.rect(0,tick+12.5,160,25,10)
                                        layer.fill(0)
                                        layer.textSize(12)
                                        layer.text(`${types.team[a].name}: ${this.operation.teams[this.turn.main].prisoners[a]}`,0,tick+12.5)
                                        layer.textSize(10)
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+10)
                                        tick+=35
                                        count++
                                    }
                                }
                                if(types.team.some((team,index)=>this.operation.teams[this.turn.main].prisoners[index]>0&&this.operation.teams[index].prisoners[this.turn.main]>0&&index!=this.turn.main&&team.auto)){
                                    layer.textSize(18)
                                    layer.text(`Exchange:`,0,tick+12.5)
                                    tick+=25

                                    for(let a=0,la=types.team.length;a<la;a++){
                                        if(this.operation.teams[this.turn.main].prisoners[a]>0&&this.operation.teams[a].prisoners[this.turn.main]>0&&a!=this.turn.main&&types.team[a].auto){
                                            layer.fill(120)
                                            layer.rect(0,tick+12.5,160,25,10)
                                            layer.fill(0)
                                            layer.textSize(12)
                                            layer.text(`${types.team[a].name}: ${min(this.operation.teams[this.turn.main].prisoners[a],this.operation.teams[a].prisoners[this.turn.main])}`,0,tick+12.5)
                                            layer.textSize(10)
                                            layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+10)
                                            tick+=35
                                            count++
                                        }
                                    }
                                }
                            break
                            case 19:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Select Release\nLocation`,0,40)
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                count++
                            break
                            */
                        }
                        layer.pop()
                    }
                })
            break
        }
    }
    update(layer,scene){
        switch(scene){
            case `main`:
                if(!dev.close){
                    this.tabs.anim.forEach((anim,index,array)=>{
                        array[index]=smoothAnim(anim,this.tabs.active==index,0,1,5)
                    })
                }
            break
            
        }
    }
    onClick(layer,mouse,scene){
        let rel
        let tick
        switch(scene){
            case `main`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                switch(this.tabs.active){
                    case 0:
                        if(mouse.position.x<layer.width-this.width){
                            this.operation.units[0].goal.position.x=constrain(mouse.position.x-layer.width*0.5+this.operation.zoom.position.x,0,this.operation.edge.x)
                            this.operation.units[0].goal.position.y=constrain(mouse.position.y-layer.height*0.5+this.operation.zoom.position.y,0,this.operation.edge.y)
                        }
                    break
                }
                let cit
                tick=75
                if(this.operation.time.pass<=0){
                    switch(this.tabs.active){
                        case 1:
                            tick+=25
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(2)
                                this.collectUnits(this.operation.units[0],this.battle.enemy)
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(0)
                                this.battle.enemy.speed.stun=30
                                this.operation.units[0].retreat.speed=4
                            }
                            tick+=50
                        break
                        /*
                        case 2:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                cit=this.operation.cities[this.select.city]
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    if(inPointBox(rel,boxify(70,tick+60,20,20))){
                                        this.turn.locked=true
                                        let move=min(cit.units[a].edit.num,cit.units[a].value)
                                        if(move>0){
                                            cit.units[a].edit.num=0
                                            cit.units[a].edit.trigger=false
                                            cit.units[a].value-=move
                                            cit.units.splice(a+1,0,new unit(cit,cit.units[a].team,1-cit.units[a].type,move))
                                            cit.units[a+1].position.y=cit.units[a].position.y
                                            if(cit.units[a].value<=0){
                                                cit.units[a].remove=true
                                            }
                                        }
                                        break
                                    }
                                    if(inPointBox(rel,boxify(-12.5,tick+60,135,20))){
                                        cit.units[a].edit.trigger=true
                                        cit.units[a].edit.num=0
                                    }else{
                                        cit.units[a].edit.trigger=false
                                    }
                                    cit.updateUnits()
                                    tick+=75
                                }
                            }
                        break
                        case 3:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                cit=this.operation.cities[this.select.city]
                                if(inPointBox(rel,boxify(0,tick+25,160,40))&&cit.units.some(unit=>unit.type==0&&unit.team==this.turn.main&&unit.edit.num>0)){
                                    this.moveTab(7)
                                    this.turn.pinned=true
                                }
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    cit.getUnits([this.turn.main],0).forEach(unit=>{if(unit.edit.num>=unit.value){unit.remove=true;this.operation.teams[this.turn.main].deserters+=unit.value}else{unit.value-=unit.edit.num;this.operation.teams[this.turn.main].deserters+=unit.edit.num}})
                                    this.updateVisibility(this.turn.main)
                                    cit.updateUnits()
                                    this.moveTab(1)
                                }
                                tick+=50
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    if(
                                        cit.units[a].type==0&&(
                                            cit.units[a].team==this.turn.main||
                                            this.operation.teams[this.turn.main].allies.includes(cit.units[a].team)
                                        )
                                    ){
                                        if(inPointBox(rel,boxify(0,tick+60,160,20))){
                                            cit.units[a].edit.trigger=true
                                            cit.units[a].edit.num=0
                                        }else{
                                            cit.units[a].edit.trigger=false
                                        }
                                        tick+=75
                                    }
                                }
                            }
                        break
                        case 4:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(6)
                                }
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.operation.transitionManager.begin(`ally`)
                                }
                                tick+=50
                                if(this.operation.teams.some((team,index)=>this.operation.teams[this.turn.main].prisoners[index]>0&&index!=this.turn.main)){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.moveTab(18)
                                    }
                                    tick+=50
                                }
                                for(let a=0,la=this.operation.teams[this.turn.main].allies.length;a<la;a++){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        if(!dev.close){
                                            this.operation.teams[this.operation.teams[this.turn.main].allies[a]].notif.push(`Alliance Broken\nWith ${this.operation.teams[this.turn.main].name}`)
                                        }
                                        this.operation.teams[this.turn.main].removeAlly(this.operation.teams[this.operation.teams[this.turn.main].allies[a]])
                                        this.updateUnits()
                                        this.updateSiege()
                                        break
                                    }
                                    tick+=50
                                }
                            }
                        break
                        case 5:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(0)
                                    this.updateVisibility()
                                }
                                tick+=50
                            }
                        break
                        case 6:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(
                                        a!=this.turn.main&&
                                        !this.operation.teams[this.turn.main].allies.includes(a)&&
                                        this.operation.teams[a].name!=`Free Company`&&
                                        !types.teamKey[0].includes(this.operation.teams[a].name)&&
                                        !types.teamKey[1].includes(this.operation.teams[a].name)
                                    ){
                                        if(inPointBox(rel,boxify(0,tick+12.5,160,25))){
                                            if(this.operation.teams[a].offers.includes(this.turn.main)){
                                                if(!dev.close){
                                                    this.operation.teams[a].notif.push(`Alliance Made\nWith ${this.operation.teams[this.turn.main].name}`)
                                                }
                                                this.operation.teams[a].addAlly(this.operation.teams[this.turn.main])
                                                this.operation.teams[a].offers.splice(this.operation.teams[a].offers.indexOf(this.turn.main),1)
                                            }else if(this.operation.teams[a].cores.length>0&&!this.operation.teams[a].cores.some(city=>city.data.type!=7&&(!aligned.includes(types.teamRef[city.owner])||city.units.some(unit=>!aligned.includes(unit.team))))){
                                                if(!dev.close){
                                                    this.operation.teams[a].notif.push(`Alliance Forced\nWith ${this.operation.teams[this.turn.main].name}`)
                                                }
                                                this.operation.teams[a].addAlly(this.operation.teams[this.turn.main])
                                                if(this.operation.teams[this.turn.main].offers.includes(a)){
                                                    this.operation.teams[this.turn.main].offers.splice(this.operation.teams[this.turn.main].offers.indexOf(a),1)
                                                }
                                            }else if(!this.operation.teams[this.turn.main].offers.includes(a)){
                                                this.operation.teams[this.turn.main].offers.push(a)
                                            }
                                            this.newTurn()
                                        }
                                        tick+=35
                                    }
                                }
                            }
                        break
                        case 8:
                            playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                            if(!types.team[playing].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.initializeCombat(0)
                                }
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
                                    this.operation.cities[this.select.targetCity].updateUnits()
                                    this.select.city=this.select.targetCity
                                    this.moveTab(10)
                                    this.battle.circumstance[1]=1
                                    let rule=this.operation.cities[this.select.targetCity].ruleIndex
                                    if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                        this.operation.cities[this.select.targetCity].raided(this.turn.main)
                                    }
                                }
                                tick+=50
                            }
                        break
                        case 9:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.accept()
                            }
                            tick+=50
                        break
                        case 10:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.initializeCombat(1)
                                }
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.newTurn()
                                }
                                tick+=50
                            }
                        break
                        case 11:
                            playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                            if(!types.team[playing].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(17)
                                    if(types.team[this.turn.main].auto){
                                        this.singleVisibility(this.select.targetCity)
                                    }
                                    this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
                                    this.agency.count=0
                                }
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
                                    this.operation.cities[this.select.targetCity].updateUnits()
                                    this.operation.cities[this.select.targetCity].sieged+=2
                                    this.moveTab(10)
                                    this.battle.circumstance[1]=1
                                }
                                tick+=50
                            }
                        break
                        case 14:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(a!=this.turn.main){
                                        if(inPointBox(rel,boxify(0,tick+12.5,160,25))){
                                            let ct=this.turn.count
                                            this.turn.count=0
                                            this.newTurn(a)
                                            this.turn.count=ct
                                        }
                                        tick+=35
                                    }
                                }
                            }
                        break
                        case 15:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(0)
                                }
                                tick+=50
                            }
                        break
                        case 17:
                            playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                            if(!types.team[playing].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
                                    this.operation.cities[this.select.targetCity].updateUnits()
                                    this.operation.cities[this.select.targetCity].sieged+=2
                                    this.moveTab(10)
                                    this.battle.circumstance[1]=1
                                }
                                tick+=50
                            }
                        break
                        case 18:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                tick+=50
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(1)
                                }
                                tick+=55
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(this.operation.teams[this.turn.main].prisoners[a]>0&&a!=this.turn.main){
                                        if(inPointBox(rel,boxify(0,tick+12.5,160,25))){
                                            this.releasing.team=a
                                            this.releasing.value=this.operation.teams[this.turn.main].prisoners[this.releasing.team]
                                            this.moveTab(19)
                                        }
                                        tick+=35
                                    }
                                }
                                if(types.team.some((team,index)=>this.operation.teams[this.turn.main].prisoners[index]>0&&this.operation.teams[index].prisoners[this.turn.main]>0&&index!=this.turn.main&&team.auto)){
                                    tick+=25
                                    for(let a=0,la=types.team.length;a<la;a++){
                                        if(this.operation.teams[this.turn.main].prisoners[a]>0&&this.operation.teams[a].prisoners[this.turn.main]>0&&a!=this.turn.main&&types.team[a].auto){
                                            if(inPointBox(rel,boxify(0,tick+12.5,160,25))){
                                                let value=min(this.operation.teams[this.turn.main].prisoners[a],this.operation.teams[a].prisoners[this.turn.main])
                                                let aligned=[a,...this.operation.teams[a].allies]
                                                let possible=[]
                                                for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                    if(this.operation.cities[b].getUnits([a]).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                        possible.push(b)
                                                    }
                                                }
                                                if(possible.length>0){
                                                    this.operation.cities[randin(possible)].summonUnit(a,0,value)
                                                    this.operation.teams[this.turn.main].prisoners[a]-=value
                                                    this.operation.teams[a].prisoners[this.turn.main]-=value
                                                    this.releasing.team=this.turn.main
                                                    this.releasing.value=value
                                                    this.moveTab(19)
                                                }else{
                                                    for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                        if(this.operation.cities[b].getUnits(aligned).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                            possible.push(b)
                                                        }
                                                    }
                                                    if(possible.length>0){
                                                        this.operation.cities[randin(possible)].summonUnit(a,0,value)
                                                        this.operation.teams[this.turn.main].prisoners[a]-=value
                                                        this.operation.teams[a].prisoners[this.turn.main]-=value
                                                        this.releasing.team=this.turn.main
                                                        this.releasing.value=value
                                                        this.moveTab(19)
                                                    }
                                                }
                                            }
                                            tick+=35
                                        }
                                    }
                                }
                            }
                        break
                        case 19:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(18)
                                }
                                tick+=50
                            }
                        break
                        */
                    }
                }
            break
        }
    }
    onKey(layer,key,scene){
        let count=1
        switch(scene){
            case `main`:
                let cit
                switch(this.tabs.active){
                    case 1:
                        if(key==count.toString()){
                            this.moveTab(2)
                            this.collectUnits(this.operation.units[0],this.battle.enemy)
                        }
                        count++
                        if(key==count.toString()){
                            this.moveTab(0)
                            this.battle.enemy.speed.stun=30
                            this.operation.units[0].retreat.speed=4
                        }
                        count++
                    break
                    /*
                    case 2:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            cit=this.operation.cities[this.select.city]
                            for(let a=0,la=cit.units.length;a<la;a++){
                                if(cit.units[a].edit.trigger){
                                    if(`1234567890`.includes(key)){
                                        cit.units[a].edit.num=min(1000000,cit.units[a].edit.num*10+int(key)*100)
                                    }else if(key==`Backspace`){
                                        cit.units[a].edit.num=floor(cit.units[a].edit.num/1000)*100
                                    }
                                }
                            }
                        }
                    break
                    case 3:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            cit=this.operation.cities[this.select.city]
                            for(let a=0,la=cit.units.length;a<la;a++){
                                if(cit.units[a].edit.trigger){
                                    if(`1234567890`.includes(key)){
                                        cit.units[a].edit.num=min(1000000,cit.units[a].edit.num*10+int(key)*100)
                                    }else if(key==`Backspace`){
                                        cit.units[a].edit.num=floor(cit.units[a].edit.num/1000)*100
                                    }
                                }
                            }
                            if(key==`Enter`&&cit.units.some(unit=>unit.type==0&&unit.team==this.turn.main&&unit.edit.num>0)){
                                this.moveTab(7)
                                this.turn.pinned=true
                            }
                            if(key==`Escape`){
                                cit.getUnits([this.turn.main],0).forEach(unit=>{if(unit.edit.num>=unit.value){unit.remove=true;this.operation.teams[this.turn.main].deserters+=unit.value}else{unit.value-=unit.edit.num;this.operation.teams[this.turn.main].deserters+=unit.edit.num}})
                                this.updateVisibility(this.turn.main)
                                cit.updateUnits()
                                this.moveTab(1)
                            }
                        }
                    break
                    case 4:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            if(key==count.toString()){
                                this.moveTab(6)
                            }
                            count++
                            if(key==count.toString()){
                                this.operation.transitionManager.begin(`ally`)
                            }
                            count++
                            if(this.operation.teams.some((team,index)=>this.operation.teams[this.turn.main].prisoners[index]>0&&index!=this.turn.main)){
                                if(key==count.toString()){
                                    this.moveTab(18)
                                }
                                count++
                            }
                            for(let a=0,la=this.operation.teams[this.turn.main].allies.length;a<la;a++){
                                if(key==count.toString()){
                                    if(!dev.close){
                                        this.operation.teams[this.operation.teams[this.turn.main].allies[a]].notif.push(`Alliance Broken\nWith ${this.operation.teams[this.turn.main].name}`)
                                    }
                                    this.operation.teams[this.turn.main].removeAlly(this.operation.teams[this.operation.teams[this.turn.main].allies[a]])
                                    this.updateUnits()
                                    this.updateSiege()
                                    break
                                }
                                count++
                            }
                        }
                    break
                    case 5:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            if(key==`Enter`){
                                this.moveTab(0)
                                this.updateVisibility()
                            }
                        }
                    break
                    case 6:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            for(let a=0,la=types.team.length;a<la;a++){
                                if(
                                    a!=this.turn.main&&
                                    !this.operation.teams[this.turn.main].allies.includes(a)&&
                                    this.operation.teams[a].name!=`Free Company`&&
                                    !types.teamKey[0].includes(this.operation.teams[a].name)&&
                                    !types.teamKey[1].includes(this.operation.teams[a].name)
                                ){
                                    if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                        if(this.operation.teams[a].offers.includes(this.turn.main)){
                                            if(!dev.close){
                                                this.operation.teams[a].notif.push(`Alliance Made\nWith ${this.operation.teams[this.turn.main].name}`)
                                            }
                                            this.operation.teams[a].addAlly(this.operation.teams[this.turn.main])
                                            this.operation.teams[a].offers.splice(this.operation.teams[a].offers.indexOf(this.turn.main),1)
                                        }else if(this.operation.teams[a].cores.length>0&&!this.operation.teams[a].cores.some(city=>city.data.type!=7&&(!aligned.includes(types.teamRef[city.owner])||city.units.some(unit=>!aligned.includes(unit.team))))){
                                            if(!dev.close){
                                                this.operation.teams[a].notif.push(`Alliance Forced\nWith ${this.operation.teams[this.turn.main].name}`)
                                            }
                                            this.operation.teams[a].addAlly(this.operation.teams[this.turn.main])
                                            if(this.operation.teams[this.turn.main].offers.includes(a)){
                                                this.operation.teams[this.turn.main].offers.splice(this.operation.teams[this.turn.main].offers.indexOf(a),1)
                                            }
                                        }else if(!this.operation.teams[this.turn.main].offers.includes(a)){
                                            this.operation.teams[this.turn.main].offers.push(a)
                                        }
                                        this.newTurn()
                                    }
                                    count++
                                }
                            }
                        }
                    break
                    case 8:
                        playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                        if(!types.team[playing].auto||dev.pause){
                            if(key==count.toString()){
                                this.initializeCombat(0)
                            }
                            count++
                            if(key==count.toString()){
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let uni=this.operation.cities[this.select.targetCity].units[a]
                                    if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                        uni.remove=true
                                        this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                    }
                                }
                                this.operation.cities[this.select.targetCity].updateUnits()
                                this.select.city=this.select.targetCity 
                                this.moveTab(10)
                                this.battle.circumstance[1]=1
                                let rule=this.operation.cities[this.select.targetCity].ruleIndex
                                if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                    this.operation.cities[this.select.targetCity].raided(this.turn.main)
                                }
                            }
                            count++
                        }
                    break
                    case 9:
                        if(key==`Enter`){
                            this.accept()
                        }
                        count++
                    break
                    case 10:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            if(key==count.toString()){
                                this.initializeCombat(1)
                            }
                            count++
                            if(key==count.toString()){
                                this.newTurn()
                            }
                            count++
                        }
                    break
                    case 11:
                        playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                        if(!types.team[playing].auto||dev.pause){
                            if(key==count.toString()){
                                this.moveTab(17)
                                if(types.team[this.turn.main].auto){
                                    this.singleVisibility(this.select.targetCity)
                                }
                                this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
                                this.agency.count=0
                            }
                            count++
                            if(key==count.toString()){
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let uni=this.operation.cities[this.select.targetCity].units[a]
                                    if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                        uni.remove=true
                                        this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                    }
                                }
                                this.operation.cities[this.select.targetCity].updateUnits()
                                this.operation.cities[this.select.targetCity].sieged+=2
                                this.moveTab(10)
                                this.battle.circumstance[1]=1
                            }
                            count++
                        }
                    break
                    case 14:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            for(let a=0,la=types.team.length;a<la;a++){
                                if(a!=this.turn.main){
                                    if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                        let ct=this.turn.count
                                        this.turn.count=0
                                        this.newTurn()
                                        this.turn.main=a
                                        this.turn.count=ct
                                    }
                                    count++
                                }
                            }
                        }
                    break
                    case 15:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            if(key==`Enter`){
                                this.moveTab(0)
                            }
                            count++
                        }
                    break
                    case 17:
                        playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                        if(!types.team[playing].auto||dev.pause){
                            if(key==`Enter`){
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let uni=this.operation.cities[this.select.targetCity].units[a]
                                    if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                        uni.remove=true
                                        this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                    }
                                }
                                this.operation.cities[this.select.targetCity].updateUnits()
                                this.operation.cities[this.select.targetCity].sieged+=2
                                this.moveTab(10)
                                this.battle.circumstance[1]=1
                            }
                        }
                    break
                    case 18:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            if(key==`Enter`){
                                this.moveTab(1)
                            }
                            for(let a=0,la=types.team.length;a<la;a++){
                                if(this.operation.teams[this.turn.main].prisoners[a]>0&&a!=this.turn.main){
                                    if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                        this.releasing.team=a
                                        this.moveTab(19)
                                    }
                                    count++
                                }
                            }
                            if(types.team.some((team,index)=>this.operation.teams[this.turn.main].prisoners[index]>0&&this.operation.teams[index].prisoners[this.turn.main]>0&&index!=this.turn.main&&team.auto)){
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(this.operation.teams[this.turn.main].prisoners[a]>0&&this.operation.teams[a].prisoners[this.turn.main]>0&&a!=this.turn.main&&types.team[a].auto){
                                        if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                            let value=min(this.operation.teams[this.turn.main].prisoners[a],this.operation.teams[a].prisoners[this.turn.main])
                                            let aligned=[a,...this.operation.teams[a].allies]
                                            let possible=[]
                                            for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                if(this.operation.cities[b].getUnits([a]).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                    possible.push(b)
                                                }
                                            }
                                            if(possible.length>0){
                                                this.operation.cities[randin(possible)].summonUnit(a,0,value)
                                                this.operation.teams[this.turn.main].prisoners[a]-=value
                                                this.operation.teams[a].prisoners[this.turn.main]-=value
                                                this.releasing.team=this.turn.main
                                                this.releasing.value=value
                                                this.moveTab(19)
                                            }else{
                                                for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                    if(this.operation.cities[b].getUnits(aligned).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                        possible.push(b)
                                                    }
                                                }
                                                if(possible.length>0){
                                                    this.operation.cities[randin(possible)].summonUnit(a,0,value)
                                                    this.operation.teams[this.turn.main].prisoners[a]-=value
                                                    this.operation.teams[a].prisoners[this.turn.main]-=value
                                                    this.releasing.team=this.turn.main
                                                    this.releasing.value=value
                                                    this.moveTab(19)
                                                }
                                            }
                                        }
                                        count++
                                    }
                                }
                            }
                        }
                    break
                    case 19:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            if(key==`Enter`){
                                this.moveTab(18)
                            }
                            count++
                        }
                    break
                    */
                }
            break
        }
        }
}