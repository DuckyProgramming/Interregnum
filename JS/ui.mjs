import {dev,types,options,constants} from './variables.mjs'
import {findName,last,distPos,randin,inPointBox,boxify,smoothAnim,floor,ceil,random,min,round,constrain} from './functions.mjs'
import {agent} from './agent.mjs'
import {agentset} from './agentset.mjs'
import {unit} from './unit.mjs'
export class ui{
    constructor(operation){
        this.operation=operation
        this.width=200
        this.tabs={active:0,anim:[],record:[],mapActive:0,mapAnim:[],editActive:0,editAnim:[]}
        this.turn={main:-1,total:0,count:0,timer:0,locked:false,pinned:false}
        this.select={city:-1,targetCity:-1,secondaryCity:-1,battleCity:-1,moved:[],trigger:false,edit:0,auto:[]}
        this.agency={count:0,time:0,reorg:false,lastResult:[]}
        this.battle={result:0,circumstance:[]}
        this.agents=[]
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
            tabs:{
                active:this.tabs.active,
                mapActive:this.tabs.mapActive,
                editActive:this.tabs.editActive,
            },
            turn:this.turn,
            battle:this.battle,
        }
        return composite
    }
    load(composite){
        this.tabs.active=composite.tabs.active==undefined?0:composite.tabs.active
        this.tabs.mapActive=composite.tabs.mapActive==undefined?0:composite.tabs.mapActive
        this.tabs.editActive=composite.tabs.editActive==undefined?0:composite.tabs.editActive
        this.turn=composite.turn
        this.battle=composite.battle
    }
    initial(){
        for(let a=0,la=17;a<la;a++){
            this.tabs.anim.push(0)
        }
        for(let a=0,la=2;a<la;a++){
            this.tabs.mapAnim.push(0)
        }
        for(let a=0,la=2;a<la;a++){
            this.tabs.editAnim.push(0)
        }
    }
    initialAgents(){
        if(dev.training){
            this.rings=[]
            for(let a=0,la=types.teamType.length;a<la;a++){
                this.rings.push([])
                for(let b=0,lb=24;b<lb;b++){
                    if(dev.new||agentset[a].length==0){
                        this.rings[a].push(new agent())
                    }else{
                        let index=floor(random(0,agentset[a].length))
                        this.rings[a].push(new agent(...agentset[a][index]))
                        agentset[a].splice(index,1)
                    }
                }
            }
            this.agents=[]
            for(let a=0,la=types.team.length;a<la;a++){
                let type=findName(types.team[a].type,types.teamType)
                this.agents.push(this.rings[type][0])
                this.rings[type].push(this.rings[type][0])
                this.rings[type].splice(0,1)
            }
        }else{
            this.agents=[]
            for(let a=0,la=types.team.length;a<la;a++){
                if(types.team[a].auto){
                    let type=findName(types.team[a].type,types.teamType)
                    if(dev.new||agentset[type].length==0){
                        this.agents.push(new agent())
                    }else{
                        let index=floor(random(0,agentset[type].length))
                        this.agents.push(new agent(...agentset[type][index]))
                        agentset[type].splice(index,1)
                    }
                }else{
                    this.agents.push(0)
                }
            }
        }
        /*if(dev.assemble2){
            for(let a=0,la=2;a<la;a++){
                for(let b=0,lb=24;b<lb;b++){
                    let term=[`main`,`large`][types.team[a].bot]
                    if(dev.new||agentset[term].length==0){
                        this.agents.push(new agent())
                    }else{
                        let index=floor(random(0,agentset[term].length))
                        this.agents.push(new agent(...agentset[term][index]))
                        agentset[term].splice(index,1)
                    }
                }
            }
        }else{
            for(let a=0,la=types.team.length;a<la;a++){
                if(types.team[a].auto){
                    let term=[`main`,`large`][types.team[a].bot]
                    if(dev.new||agentset[term].length==0){
                        this.agents.push(new agent())
                    }else{
                        let index=floor(random(0,agentset[term].length))
                        this.agents.push(new agent(...agentset[term][index]))
                        agentset[term].splice(index,1)
                    }
                }else{
                    this.agents.push(0)
                }
            }
        }*/
    }
    moveTab(tab){
        if(this.tabs.active==16){
            this.updateVisibility()
        }
        this.tabs.active=tab
        this.tabs.record.push(tab)
        if(this.tabs.record.length>100){
            delete this.tabs.record[0]
            this.tabs.record.splice(0,1)
        }
    }
    reset(){
        this.turn.total=0
        this.turn.count=0
        this.newTurn()
    }
    newTurn(){
        if(dev.training&&this.turn.total!=0){
            if(this.turn.total%1000==0){
                this.agents.forEach((agent,index)=>{if(index<this.operation.teams.length){agent.record+=this.operation.cities.reduce((acc,city)=>acc+(city.owner==types.team[index].name?1:0)*types.cityType[city.data.type].value,0)-types.city.reduce((acc,city)=>acc+(city.rule==types.team[index].name?1:0)*types.cityType[city.type].value,0)}})
                this.operation.initialElements()
                this.operation.initialComponents()
                this.agents=[]
                for(let a=0,la=types.team.length;a<la;a++){
                    let type=findName(types.team[a].type,types.teamType)
                    this.agents.push(this.rings[type][0])
                    this.rings[type].push(this.rings[type][0])
                    this.rings[type].splice(0,1)
                }
            }
            if(this.turn.total%(1000*24*20)==0){//1000 turns, 24 agents per ring, 10 runs per agent per team
                for(let a=0,la=this.rings.length;a<la;a++){
                    //print(types.team.some(team=>findName(types.team[a].type,types.teamType)==a))
                    if(types.team.some(team=>findName(types.team[a].type,types.teamType)==a)){
                        let maximal=this.rings[a].reduce((acc,agent)=>max(acc,agent.rewards),0)
                        this.rings[a].forEach(agent=>{agent.record+=agent.rewards/maximal*5;agent.rewards=0})
                        maximal=this.rings[a].reduce((acc,agent)=>max(acc,agent.punishments),0)
                        this.rings[a].forEach(agent=>{agent.record-=agent.punishments/maximal*5;agent.punishments=0})
                        this.rings[a].sort((a,b)=>a.record-b.record)
                        this.rings[a].splice(0,5)
                        let len=this.rings[a].length
                        for(let b=0,lb=this.turn.total>=100000000?5:4;b<lb;b++){
                            this.rings[a].push(new agent(
                                JSON.parse(JSON.stringify(this.rings[a][len-1-b].sets)),
                                JSON.parse(JSON.stringify(this.rings[a][len-1-b].constants))
                            ))
                            last(this.rings[a]).mutate()
                        }
                        if(this.turn.total<100000000){
                            this.rings[a].push(new agent())
                        }
                        this.rings[a]=this.rings[a]
                            .map(value=>({value,sort:random(0,1)}))
                            .sort((a,b)=>a.sort-b.sort)
                            .map(({value})=>value)
                    }
                }
            }
            if(this.turn.total>=constants.threshold){
                let nums=[floor(process.uptime().toFixed(3)/3600),floor(process.uptime().toFixed(3)/60)%60,floor(process.uptime().toFixed(3))%60]
                console.log(`Time at ${constants.threshold} Turns: ${nums[0]<10?`0`:``}${nums[0]}:${nums[1]<10?`0`:``}${nums[1]}:${nums[2]<10?`0`:``}${nums[2]}`)
                constants.threshold*=2
            }
        }
        if(dev.assemble&&this.turn.total!=0){
            //assemble is deprecated!
            if(this.turn.total%500==0){
                this.agents.forEach((agent,index)=>{if(index<this.operation.teams.length){agent.record+=this.operation.cities.reduce((acc,city)=>acc+(city.owner==types.team[index].name?1:0)*types.cityType[city.data.type].value,0)-types.city.reduce((acc,city)=>acc+(city.rule==types.team[index].name?1:0)*types.cityType[city.type].value,0)}})
                this.operation.initialElements()
                this.operation.initialComponents()
                if(dev.assemble2){
                    this.agents.splice(0,0,this.agents[23])
                    this.agents.splice(24,1,this.agents[47])
                    this.agents.splice(48,1)
                }else{
                    this.agents.splice(0,0,last(this.agents))
                    this.agents.splice(this.agents.length-1,1)
                }
            }
            if(dev.assemble2){
                if(this.turn.total%(500*24*5)==0){
                    let splits=[this.agents.slice(0,24),this.agents.slice(24,48)]
                    for(let a=0,la=splits.length;a<la;a++){
                        let maximal=splits[a].reduce((acc,agent)=>max(acc,agent.rewards),0)
                        splits[a].forEach(agent=>{agent.record+=agent.rewards/maximal*0.5;agent.rewards=0})
                        maximal=splits[a].reduce((acc,agent)=>max(acc,agent.punishments),0)
                        splits[a].forEach(agent=>{agent.record-=agent.punishments/maximal*0.5;agent.punishments=0})
                        splits[a].sort((a,b)=>a.record-b.record)
                        splits[a].splice(0,5)
                        let len=splits[a].length
                        for(let b=0,lb=this.turn.total>=100000000?5:4;b<lb;b++){
                            splits[a].push(new agent(
                                JSON.parse(JSON.stringify(splits[a][len-1-b].sets)),
                                JSON.parse(JSON.stringify(splits[a][len-1-b].constants))
                            ))
                            last(splits[a]).mutate()
                        }
                        if(this.turn.total<100000000){
                            splits[a].push(new agent())
                        }
                        splits[a]=splits[a]
                            .map(value=>({value,sort:random(0,1)}))
                            .sort((a,b)=>a.sort-b.sort)
                            .map(({value})=>value)
                    }
                    this.agents=[...splits[0],...splits[1]]
                }
            }else{
                if(this.turn.total%(500*this.operation.teams.length*5)==0){
                    let maximal=this.agents.reduce((acc,agent)=>max(acc,agent.rewards),0)
                    this.agents.forEach(agent=>{agent.record+=agent.rewards/maximal*5;agent.rewards=0})
                    maximal=this.agents.reduce((acc,agent)=>max(acc,agent.punishments),0)
                    this.agents.forEach(agent=>{agent.record-=agent.punishments/maximal*5;agent.punishments=0})
                    this.agents.sort((a,b)=>a.record-b.record)
                    this.agents.splice(0,5)
                    let len=this.agents.length
                    for(let a=0,la=this.turn.total>=100000000?5:4;a<la;a++){
                        this.agents.push(new agent(
                            JSON.parse(JSON.stringify(this.agents[len-1-a].sets)),
                            JSON.parse(JSON.stringify(this.agents[len-1-a].constants))
                        ))
                        last(this.agents).mutate()
                    }
                    if(this.turn.total<100000000){
                        this.agents.push(new agent())
                    }
                    this.agents=this.agents
                        .map(value=>({value,sort:random(0,1)}))
                        .sort((a,b)=>a.sort-b.sort)
                        .map(({value})=>value)
                }
            }
            if(this.turn.total>=constants.threshold){
                let nums=[floor(millis()/3600000),floor(millis()/60000)%60,floor(millis()/1000)%60]
                print(`Time at ${constants.threshold} Turns: ${nums[0]<10?`0`:``}${nums[0]}:${nums[1]<10?`0`:``}${nums[1]}:${nums[2]<10?`0`:``}${nums[2]}`)
                constants.threshold*=10
            }
        }
        let total=0
        types.team.forEach((team,index)=>{if(index!=this.turn.main){total+=team.chance+(team.auto?0:1)}})
        if(this.turn.count>0){
            this.turn.count--
            this.moveTab(0)
            this.updateVisibility()
        }else{
            let roll=random(0,total)
            let ticker=0
            while(roll>=types.team[ticker].chance+(types.team[ticker].auto?0:1)||ticker==this.turn.main){
                if(ticker!=this.turn.main){
                    roll-=types.team[ticker].chance+(types.team[ticker].auto?0:1)
                }
                ticker++
            }
            this.turn.main=ticker
            let len=this.operation.cities.filter(city=>{return city.owner==types.team[this.turn.main].name}).length*(types.team[this.turn.main].name==`Ecclesiastical`?0.75:1)
            this.turn.count=len==0?0:floor(random(0.5,len*0.25+2.5))
            this.operation.cities.forEach(city=>city.visibility=0)
            this.moveTab(5)
            if(types.team[this.turn.main].auto){
                if(random(0,types.team[this.turn.main].chance*5)<1){
                    this.updateVisibility()
                    this.moveTab(4)
                }
            }else{
                let total=[0,0,0]
                this.operation.cities.forEach(city=>{if(city.data.rule==types.team[this.turn.main].name){total[0]+=city.position.x;total[1]+=city.position.y;total[2]++}})
                if(!dev.close){
                    this.operation.zoom.shift.position.x=total[0]/total[2]
                    this.operation.zoom.shift.position.y=total[1]/total[2]
                    this.operation.zoom.shift.active=true
                }
            }
            this.operation.cities.forEach(city=>city.newTurnTick())
        }
        this.turn.total++
        this.turn.timer=0
        this.turn.locked=false
        this.turn.pinned=false
        this.agency.count++
        this.agency.reorg=false
        this.operation.cities.forEach(city=>city.newTurn())
        if(this.turn.total!=1){
            this.updateUnits()
        }
    }
    accept(){
        let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
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
                    let unit=cit.units[c]
                    if(unit.team==this.battle.result.casualties[a][b].team&&unit.type==this.battle.result.casualties[a][b].type&&unit.type==0){
                        let minus=min(left,unit.value)
                        left-=minus
                        if(unit.value<=minus){
                            unit.remove=true
                        }else{
                        unit.value-=minus
                        }
                    }
                }
                if(left>0){
                    for(let c=0,lc=cit.units.length;c<lc;c++){
                        let unit=cit.units[c]
                        if(unit.team==this.battle.result.casualties[a][b].team&&unit.type==this.battle.result.casualties[a][b].type&&unit.type==1){
                            let minus=min(left,unit.value)
                            left-=minus
                            if(unit.value<=minus){
                                unit.remove=true
                            }else{
                                unit.value-=minus
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
                        this.select.secondaryCity=findName(randin(types.city[this.select.targetCity].connect).name,types.city)
                    }else{
                        this.turn.timer=15
                    }
                }else{
                    for(let a=0,la=this.select.moved.length;a<la;a++){
                        if(this.select.moved[a].value<=0){
                            this.select.moved[a].remove=true
                        }else{
                            let base=this.select.moved[a]
                            this.operation.cities[this.select.city].units.push(new unit(this.operation.cities[this.select.city],base.team,0,base.value))
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
                        }
                    })
                    //flag p for prisoner
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
                        }
                    })
                    //flag p for prisoner
                }
                this.turn.timer=15
            }else if(this.battle.circumstance[1]==1){
                if(last(this.battle.result.winner)==1&&this.operation.cities[this.select.city].getNotUnits(aligned).length>0){
                    this.moveTab(13)
                    if(types.city[this.select.city].connect.length==0){
                        this.moveTab(0)
                    }else{
                        this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
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
                        if(types.city[this.select.city].connect.length==0){
                            this.moveTab(0)
                        }else{
                            this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
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
                    this.operation.cities[this.select.targetCity].getNotUnits(aligned).forEach(unit=>unit.remove=true)
                    //flag p for prisoner
                }
                this.turn.timer=15
            }
        }
        if(this.tabs.active==7&&this.turn.main==0){
            throw new Error(`Acceptance Stuck: ${this.battle.circumstance}`)
        }
        cit.updateUnits()
    }
    cityClick(layer,mouse,scene,city){
        switch(scene){
            case `title`: case `setup`: case `main`:
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                if(dev.close||mouse.position.x<layer.width-this.width&&!this.select.trigger){
                    if(this.tabs.active==7&&types.city[this.select.city].connect.some(connection=>{return connection.name==types.city[city].name})){
                        let exists=this.operation.cities[city].getUnits(aligned,0).length>0
                        this.select.moved=[]
                        this.select.targetCity=city
                        if(!dev.close){
                            this.operation.zoom.shift.position.x=types.city[city].loc[0]
                            this.operation.zoom.shift.position.y=types.city[city].loc[1]
                            this.operation.zoom.shift.active=true
                        }
                        let leave=false
                        for(let a=0,la=this.operation.cities[this.select.city].units.length;a<la;a++){
                            let base=this.operation.cities[this.select.city].units[a]
                            if(base.edit.num>0){
                                let move=min(base.value,base.edit.num)
                                base.value-=move
                                this.operation.cities[city].units.push(new unit(this.operation.cities[city],base.team,0,move))
                                last(this.operation.cities[city].units).position.x=this.operation.cities[this.select.city].position.x-this.operation.cities[city].position.x+base.position.x
                                last(this.operation.cities[city].units).position.y=this.operation.cities[this.select.city].position.y-this.operation.cities[city].position.y+base.position.y
                                last(this.operation.cities[city].units).fade.main=1-base.type
                                this.select.moved.push(last(this.operation.cities[city].units))
                                this.operation.cities[city].updateVisibility(this.turn.main)
                                if(base.value<=0){
                                    if(base.type==0){
                                        this.operation.cities[this.select.city].units.splice(a,1)
                                        a--
                                        la--
                                    }else{
                                        base.remove=true
                                    }
                                }
                            }else{
                                leave=true
                            }
                        }
                        if(!leave&&types.team[this.turn.main].auto){
                            this.agents[this.turn.main].punishments++
                        }
                        if(this.operation.cities[city].getNotUnits(aligned).length>0){
                            if(types.team[this.turn.main].auto){
                                this.agents[this.turn.main].rewards++
                            }
                            this.moveTab(8)
                            this.battle.circumstance=[0]
                            for(let a=0,la=types.city[this.select.city].connect.length;a<la;a++){
                                if(types.city[this.select.city].connect[a].name==types.city[city].name){
                                    this.operation.calc.terrain.list=types.city[this.select.city].connect[a].type==2?[3]:types.city[this.select.city].connect[a].type==1?[1]:[]
                                }
                            }
                            if(this.operation.cities[city].getUnits(aligned,1).length>0){
                                this.moveTab(9)
                                this.select.battleCity=this.select.targetCity
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let unit=this.operation.cities[this.select.targetCity].units[a]
                                    if(!unit.remove){
                                        let side=aligned.includes(unit.team)?0:1
                                        let fail=true
                                        for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                            if(this.operation.calc.sides[side].force[b].team==unit.team&&this.operation.calc.sides[side].force[b].type==unit.type){
                                                this.operation.calc.sides[side].force[b].number+=unit.value
                                                fail=false
                                                break
                                            }
                                        }
                                        if(fail){
                                            this.operation.calc.sides[side].force.push({team:unit.team,type:unit.type,number:unit.value,dist:0})
                                        }
                                    }
                                }
                                this.operation.calc.sides[1].strategy=1
                                this.battle.result=this.operation.calc.calc()
                                this.operation.calc.reset()
                                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
                                this.battle.circumstance[1]=0
                                this.agency.time=dev.instant?0:5
                            }else if(exists){
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let uni=this.operation.cities[this.select.targetCity].units[a]
                                    if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                        uni.remove=true
                                        this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                    }
                                }
                                this.moveTab(10)
                                this.battle.circumstance[1]=1
                                let rule=this.operation.cities[this.select.targetCity].ruleIndex
                                if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                    this.operation.cities[this.select.targetCity].raided(this.turn.main)
                                }
                                this.agency.time=0
                            }
                        }else{
                            this.turn.timer=30
                            let rule=this.operation.cities[city].ruleIndex
                            if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                this.operation.cities[city].raided(this.turn.main)
                            }
                        }
                        this.operation.cities[this.select.city].updateUnits()
                        this.operation.cities[this.select.targetCity].updateUnits()
                    }else if(this.tabs.active==12&&types.city[this.select.targetCity].connect.some(connection=>{return connection.name==types.city[city].name})){
                        this.select.secondaryCity=city
                        if(!dev.close){
                            this.operation.zoom.shift.position.x=types.city[city].loc[0]
                            this.operation.zoom.shift.position.y=types.city[city].loc[1]
                            this.operation.zoom.shift.active=true
                        }
                        let set=this.operation.cities[this.select.targetCity].getNotUnits(aligned)
                        for(let a=0,la=set.length;a<la;a++){
                            let base=set[a]
                            this.operation.cities[city].units.push(new unit(this.operation.cities[city],base.team,0,base.value))
                            last(this.operation.cities[city].units).position.x=this.operation.cities[this.select.targetCity].position.x-this.operation.cities[city].position.x+base.position.x
                            last(this.operation.cities[city].units).position.y=this.operation.cities[this.select.targetCity].position.y-this.operation.cities[city].position.y+base.position.y
                            last(this.operation.cities[city].units).fade.main=1-base.type
                            last(this.operation.cities[city].units).tempVisible=true
                            if(base.type==0){
                                this.operation.cities[this.select.targetCity].units.splice(this.operation.cities[this.select.targetCity].units.indexOf(base),1)
                                set.splice(a,1)
                                a--
                                la--
                            }else{
                                base.remove=true
                            }
                            if(this.operation.cities[city].getNotUnits([base.team,...this.operation.teams[base.team].allies]).length>0){
                                last(this.operation.cities[city].units).removeMark=true
                                //flag p for prisoner
                            }
                        }
                        this.turn.timer=30
                        this.operation.cities[this.select.targetCity].updateUnits()
                        this.operation.cities[this.select.secondaryCity].updateUnits()
                    }else if(this.tabs.active==13&&types.city[this.select.city].connect.some(connection=>{return connection.name==types.city[city].name})){
                        this.select.targetCity=city
                        if(!dev.close){
                            this.operation.zoom.shift.position.x=types.city[city].loc[0]
                            this.operation.zoom.shift.position.y=types.city[city].loc[1]
                            this.operation.zoom.shift.active=true
                        }
                        let set=this.operation.cities[this.select.city].getNotUnits(aligned)
                        for(let a=0,la=set.length;a<la;a++){
                            let base=set[a]
                            this.operation.cities[city].units.push(new unit(this.operation.cities[city],base.team,0,base.value))
                            last(this.operation.cities[city].units).position.x=this.operation.cities[this.select.city].position.x-this.operation.cities[city].position.x+base.position.x
                            last(this.operation.cities[city].units).position.y=this.operation.cities[this.select.city].position.y-this.operation.cities[city].position.y+base.position.y
                            last(this.operation.cities[city].units).fade.main=1-base.type
                            last(this.operation.cities[city].units).tempVisible=true
                            if(base.type==0){
                                this.operation.cities[this.select.city].units.splice(this.operation.cities[this.select.city].units.indexOf(base),1)
                                a--
                                la--
                            }else{
                                base.remove=true
                            }
                            if(this.operation.cities[city].getNotUnits([base.team,...this.operation.teams[base.team].allies]).length>0){
                                last(this.operation.cities[city].units).removeMark=true
                                //flag p for prisoner
                            }
                        }
                        this.turn.timer=30
                        this.operation.cities[this.select.city].updateUnits()
                        this.operation.cities[this.select.targetCity].updateUnits()
                    }else if(this.tabs.active==15){
                        this.select.city=city
                        let cit=this.operation.cities[this.select.city]
                        let turn=this.turn.main
                        if(cit.getSpawn(3)>0){
                            this.turn.pinned=true
                            this.moveTab(8)
                            this.battle.circumstance=[2]
                            this.select.targetCity=this.select.city
                            if(cit.getUnits([turn,...this.operation.teams[turn].allies],0).length>0){
                                cit.spawn(3)
                                cit.updateUnits()
                                this.select.moved=[last(cit.units)]
                                this.moveTab(10)
                                this.battle.circumstance[1]=1
                                let rule=this.operation.cities[this.select.targetCity].ruleIndex
                                if(rule!=turn&&!this.operation.teams[turn].allies.includes(rule)){
                                    this.operation.cities[this.select.targetCity].raided(this.turn.main)
                                }
                                this.agency.time=0
                            }else if(cit.getUnits([turn,...this.operation.teams[turn].allies],1).length>0){
                                cit.spawn(3)
                                cit.updateUnits()
                                this.select.moved=[last(cit.units)]
                                this.moveTab(9)
                                this.select.battleCity=this.select.targetCity
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let unit=this.operation.cities[this.select.targetCity].units[a]
                                    if(!unit.remove){
                                        let side=aligned.includes(unit.team)?0:1
                                        let fail=true
                                        for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                            if(this.operation.calc.sides[side].force[b].team==unit.team&&this.operation.calc.sides[side].force[b].type==unit.type){
                                                this.operation.calc.sides[side].force[b].number+=unit.value
                                                fail=false
                                                break
                                            }
                                        }
                                        if(fail){
                                            this.operation.calc.sides[side].force.push({team:unit.team,type:unit.type,number:unit.value,dist:0})
                                        }
                                    }
                                }
                                this.operation.calc.sides[1].strategy=1
                                this.battle.result=this.operation.calc.calc()
                                this.operation.calc.reset()
                                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
                                this.battle.circumstance[1]=0
                            }else{
                                cit.spawn(3)
                                this.select.moved=[last(cit.units)]
                            }
                        }else{
                            this.moveTab(15)
                        }
                        this.updateVisibility()
                    }else if(!this.turn.locked&&!this.turn.pinned&&!(this.tabs.active==1&&this.select.city==city)){
                        if(this.tabs.active==5){
                            this.updateVisibility()
                        }
                        this.moveTab(1)
                        this.select.city=city
                        if(!dev.close){
                            this.operation.zoom.shift.position.x=types.city[city].loc[0]
                            this.operation.zoom.shift.position.y=types.city[city].loc[1]
                            this.operation.zoom.shift.active=true
                        }
                        this.select.trigger=true
                    }
                }
            break
            case `edit`:
                this.operation.cities[city].setOwner(types.team[this.select.edit].name)
                this.operation.cities[city].units=[]
            break
        }
    }
    spawnVariant(cit,turn){
        let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
        if(cit.data.rule==types.team[turn].name){
            if(cit.getNotUnits(aligned).length<=0){
                return 0
            }else{
                return 1
            }
        }else if(cit.owner==types.team[turn].name&&cit.getNotUnits(aligned).length<=0){
            return 2
        }
        return -1
    }
    spawn(cit,turn){
        let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
        if(cit.data.rule==types.team[turn].name){
            if(cit.getNotUnits(aligned).length<=0){
                if(cit.getSpawn(0)>0){
                    cit.spawn(0)
                    cit.updateUnits()
                    this.turn.timer=30
                    return true
                }
            }else{
                if(cit.getSpawn(1)>0){
                    this.turn.pinned=true
                    this.moveTab(8)
                    this.battle.circumstance=[2]
                    this.select.targetCity=this.select.city
                    if(cit.getUnits([turn,...this.operation.teams[turn].allies],0).length>0){
                        cit.spawn(1)
                        cit.updateUnits()
                        this.select.moved=[last(cit.units)]
                        this.moveTab(10)
                        this.battle.circumstance[1]=1
                        let rule=this.operation.cities[this.select.targetCity].ruleIndex
                        if(rule!=turn&&!this.operation.teams[turn].allies.includes(rule)){
                            this.operation.cities[this.select.targetCity].raided(this.turn.main)
                        }
                        this.agency.time=0
                    }else if(cit.getUnits([turn,...this.operation.teams[turn].allies],1).length>0){
                        cit.spawn(1)
                        cit.updateUnits()
                        this.select.moved=[last(cit.units)]
                        this.moveTab(9)
                        this.select.battleCity=this.select.targetCity
                        for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                            let unit=this.operation.cities[this.select.targetCity].units[a]
                            if(!unit.remove){
                                let side=aligned.includes(unit.team)?0:1
                                let fail=true
                                for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                    if(this.operation.calc.sides[side].force[b].team==unit.team&&this.operation.calc.sides[side].force[b].type==unit.type){
                                        this.operation.calc.sides[side].force[b].number+=unit.value
                                        fail=false
                                        break
                                    }
                                }
                                if(fail){
                                    this.operation.calc.sides[side].force.push({team:unit.team,type:unit.type,number:unit.value,dist:0})
                                }
                            }
                        }
                        this.operation.calc.sides[1].strategy=1
                        this.battle.result=this.operation.calc.calc()
                        this.operation.calc.reset()
                        this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
                        this.battle.circumstance[1]=0
                    }else{
                        cit.spawn(1)
                        this.select.moved=[last(cit.units)]
                    }
                    return true
                }
            }
        }else if(cit.owner==types.team[turn].name){
            if(cit.getNotUnits(aligned).length<=0){
                if(cit.getSpawn(2)>0){
                    cit.spawn(2)
                    cit.updateUnits()
                    this.turn.timer=30
                    return true
                }
            }
        }
    }
    collectUnits(cit){
        let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
        for(let a=0,la=this.operation.cities[cit].units.length;a<la;a++){
            let unit=this.operation.cities[cit].units[a]
            if(!unit.remove){
                let side=aligned.includes(unit.team)?0:1
                let fail=true
                for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                    if(this.operation.calc.sides[side].force[b].team==unit.team&&this.operation.calc.sides[side].force[b].type==unit.type){
                        this.operation.calc.sides[side].force[b].number+=unit.value
                        fail=false
                        break
                    }
                }
                if(fail){
                    this.operation.calc.sides[side].force.push({team:unit.team,type:unit.type,number:unit.value,dist:0})
                }
            }
        }
    }
    initializeCombat(type){
        let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
        switch(type){
            case 0:
                this.moveTab(9)
                this.select.battleCity=this.select.targetCity
                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                    let uni=this.operation.cities[this.select.targetCity].units[a]
                    if(uni.type==1&&!aligned.includes(uni.team)&&!uni.remove){
                        uni.remove=true
                        this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                    }
                }
                this.collectUnits(this.select.targetCity)
                this.operation.calc.sides[1].strategy=1
                this.battle.result=this.operation.calc.calc()
                this.operation.calc.reset()
                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
                this.battle.circumstance[1]=0
            break
            case 1:
                this.moveTab(9)
                this.select.battleCity=this.select.targetCity
                this.operation.calc.terrain.list=[2]
                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                    let unit=this.operation.cities[this.select.targetCity].units[a]
                    if(!unit.remove){
                        let side=aligned.includes(unit.team)?0:1
                        let fail=true
                        for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                            if(this.operation.calc.sides[side].force[b].team==unit.team&&this.operation.calc.sides[side].force[b].type==unit.type){
                                this.operation.calc.sides[side].force[b].number+=unit.value
                                fail=false
                                break
                            }
                        }
                        if(fail){
                            this.operation.calc.sides[side].force.push({team:unit.team,type:unit.type,number:unit.value,dist:side==1?ceil(this.operation.cities[this.select.targetCity].sieged):0})
                        }
                    }
                }
                this.operation.calc.sides[1].strategy=1
                this.battle.result=this.operation.calc.calc()
                this.operation.calc.reset()
                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
            break
            case 2:
                this.turn.pinned=true
                this.moveTab(9)
                this.select.battleCity=this.select.city
                let cit=this.operation.cities[this.select.city]
                cit.sieged++
                this.operation.calc.terrain.list=cit.getUnits([this.turn.main],1).length>0?[]:[2]
                for(let a=0,la=cit.units.length;a<la;a++){
                    let unit=cit.units[a]
                    if(!unit.remove){
                        let side=aligned.includes(unit.team)?0:1
                        let fail=true
                        for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                            if(this.operation.calc.sides[side].force[b].team==unit.team&&this.operation.calc.sides[side].force[b].type==unit.type){
                                this.operation.calc.sides[side].force[b].number+=unit.value
                                fail=false
                                break
                            }
                        }
                        if(fail){
                            this.operation.calc.sides[side].force.push({team:unit.team,type:unit.type,number:unit.value,dist:side==(cit.getUnits([this.turn.main],1).length>0?0:1)?ceil(cit.sieged):0})
                        }
                    }
                }
                this.operation.calc.sides[1].strategy=1
                this.battle.result=this.operation.calc.calc()
                this.operation.calc.reset()
                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
                this.battle.circumstance=[1,cit.getUnits([this.turn.main],1).length>0?1:0]
            break
        }
    }
    updateVisibility(){
        this.operation.cities.forEach(city=>city.updateVisibility(this.turn.main))
    }
    updateUnits(){
        this.operation.cities.forEach(city=>city.updateUnits())
    }
    display(layer,scene){
        layer.noStroke()
        let tick=0
        let count=0
        let set
        let rows
        switch(scene){
            case `title`:
                let groups=[]
                for(let a=0,la=types.map.length;a<la;a++){
                    if(!types.map[a].stack){
                        groups.push([])
                    }
                    last(groups).push(a)
                }
                layer.push()
                layer.translate(layer.width*0.5,0)
                layer.fill(150)
                layer.rect(0,400-groups.length*30,560,180,20)
                layer.rect(0,560,300,90+groups.length*60,20)
                for(let a=0,la=15;a<la;a++){
                    layer.fill(20+a*2,20+a*2.5,20+a*3)
                    layer.textSize(100)
                    layer.text(`Interregnum`,a*0.2,380-groups.length*30+a*0.5)
                    layer.textSize(40)
                    layer.text(`DuckyProgramming`,a*0.1,450-groups.length*30+a*0.25)
                }
                layer.fill(0)
                layer.textSize(40)
                layer.text(`Select Map:`,0,552.5-groups.length*30)
                for(let a=0,la=groups.length;a<la;a++){
                    layer.fill(120)
                    layer.rect(0,a*60+610-la*30,240,50,10)
                    if(groups[a].length>1){
                        layer.fill(100)
                        for(let b=0,lb=groups[a].length-1;b<lb;b++){
                            layer.rect((b+1)/(lb+1)*240-120,a*60+610-la*30,3,50)
                        }
                    }
                    layer.fill(0)
                    layer.textSize(20)
                    layer.text(types.map[groups[a][0]].name[0],0,a*60+610-la*30)
                    for(let b=0,lb=groups[a].length;b<lb;b++){
                        layer.textSize(10)
                        layer.text(count+1,(b+1)/lb*240-120-20,a*60+595-la*30)
                        layer.textSize(12)
                        if(types.map[groups[a][b]].name.length>=2){
                            layer.text(types.map[groups[a][b]].name[1],(b+0.5)/lb*240-120,a*60+628-la*30)
                        }
                        count++
                    }
                }
                layer.pop()
            break
            case `setup`:
                set=types.map[this.operation.nextMap].teamSet
                rows=ceil(this.select.auto.length/set)
                layer.push()
                layer.translate(layer.width*0.5,0)
                layer.fill(150)
                layer.rect(0,450,set*250+50,280+rows*60,20)
                layer.fill(0)
                layer.textSize(48)
                layer.text(`Pick Player Factions`,0,375-rows*30)
                for(let a=0,la=this.select.auto.length;a<la;a++){
                    layer.fill(120,this.select.auto[a]?120:200,120)
                    layer.rect(-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+445,240,50,10)
                    layer.fill(0)
                    layer.textSize(20)
                    layer.text(`${types.map[this.operation.nextMap].team[a].name}`,-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+445)
                    layer.textSize(10)
                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[a],100-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+430)
                }
                layer.fill(120)
                layer.rect(-125,rows*30+475,240,50,10)
                layer.rect(125,rows*30+475,240,50,10)
                layer.rect(-125,rows*30+535,240,50,10)
                layer.rect(125,rows*30+535,240,50,10)
                layer.fill(100)
                layer.rect(125,rows*30+475,3,50)
                layer.fill(0)
                layer.rect(30,rows*30+475,18,2.4)
                layer.rect(220,rows*30+475,18,2.4)
                layer.rect(220,rows*30+475,2.4,18)
                layer.textSize(20)
                layer.text(`Select Random`,-125,rows*30+475)
                layer.text(`Difficulty: ${options.strength}`,125,rows*30+475)
                layer.text(`Begin`,-125,rows*30+535)
                layer.text(`Edit Map`,125,rows*30+535)
                layer.textSize(10)
                layer.rect(25,rows*30+460,6,0.8)
                layer.rect(225,rows*30+460,6,0.8)
                layer.rect(225,rows*30+460,0.8,6)
                layer.text(`#`,-25,rows*30+460)
                layer.text(`Enter`,-25,rows*30+520)
                layer.text(`Slash`,225,rows*30+520)
                layer.pop()
            break
            case `pick`:
                set=types.map[this.operation.map].teamSet
                rows=ceil(types.team.length/set)
                layer.fill(180)
                layer.rect(layer.width*0.5,layer.height*0.5,layer.width,layer.height)
                layer.push()
                layer.translate(layer.width*0.5,0)
                layer.fill(150)
                layer.rect(0,450,set*250+50,220+rows*60,20)
                layer.fill(0)
                layer.textSize(48)
                layer.text(`Pick Player Factions`,0,405-rows*30)
                for(let a=0,la=types.team.length;a<la;a++){
                    layer.fill(120,types.team[a].auto?120:200,120)
                    layer.rect(-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+475,240,50,10)
                    layer.fill(0)
                    layer.textSize(20)
                    layer.text(`${types.team[a].name}`,-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+475)
                    layer.textSize(10)
                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[a],100-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+460)
                }
                layer.fill(120)
                layer.rect(-125,rows*30+505,240,50,10)
                layer.rect(125,rows*30+505,240,50,10)
                layer.fill(0)
                layer.textSize(20)
                layer.text(`Begin`,-125,rows*30+505)
                layer.text(`Edit Map`,125,rows*30+505)
                layer.textSize(10)
                layer.text(`Enter`,-25,rows*30+490)
                layer.text(`Slash`,225,rows*30+490)
                layer.pop()
            break
            case `main`:
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
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
                                layer.text(`Current Player:\n${types.team[this.turn.main].name}`,0,40)

                                layer.textSize(18)
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
                                }
                            break
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
                                }
                                if(cit.owner==types.team[this.turn.main].name&&cit.data.type==3){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Imperial Diet -\nDelegate Turn`,0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
                                if(cit.owner==types.team[this.turn.main].name&&cit.data.type==4){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Imperial Cathedral -\nForce Rebellion`,0,tick+25)
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
                                    if(a!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(a)){
                                        layer.fill(120)
                                        layer.rect(0,tick+12.5,160,25,10)
                                        layer.fill(0)
                                        layer.textSize(12)
                                        layer.text(`${this.operation.teams[a].offers.includes(this.turn.main)?`Accept`:this.operation.teams[this.turn.main].offers.includes(a)?`Pending`:`Offer`}: ${types.team[a].name}`,0,tick+12.5)
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
                            case 9:
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
                                        layer.text(`${types.team[result.team].name}${this.battle.result.casualties.some(group=>group.some(res=>res.team==result.team&&res.type==1-result.type))?[` Army`,` Garrison`][result.type]:``}: ${result.number}`,0,tick+12.5)
                                        tick+=25
                                    }
                                    tick+=10
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
                                    if(a!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(a)){
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
                            break
                            case 16:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Viewing\nRecruitment`,0,40)
                            break
                        }
                        layer.pop()
                    }
                })
            break
            case `map`:
                layer.fill(120)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                this.tabs.mapAnim.forEach((anim,index)=>{
                    layer.fill(150)
                    layer.rect(layer.width+this.width*0.5-this.width*anim,layer.height*0.5,this.width,layer.height)
                    if(anim>0){
                        layer.push()
                        layer.translate(layer.width+this.width*0.5-this.width*anim,0)
                        tick=75
                        count=1
                        switch(index){
                            case 0:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Viewing Map`,0,40)
                                layer.textSize(18)
                                layer.text(`Total Turns: ${this.turn.total}`,0,tick+7.5)
                                tick+=25
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Stats`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Save`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Load`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                            break
                            case 1:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Viewing Map`,0,40)
                                layer.textSize(18)
                                layer.text(`Total Turns: ${this.turn.total}`,0,tick+7.5)
                                tick+=25
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=52
                                for(let a=0,la=types.team.length;a<la;a++){
                                    layer.fill(120,120,120)
                                    layer.rect(0,tick+12.5,160,22,10)
                                    layer.fill(0)
                                    layer.textSize(12)
                                    layer.textAlign(RIGHT,CENTER)
                                    layer.text(`${this.operation.teams[a].kills}/${this.operation.teams[a].deaths}/${this.operation.teams[a].deserters}`,75,tick+12.5)
                                    layer.textAlign(CENTER,CENTER)
                                    let img=[graphics.load.team[types.team[a].loadIndex],graphics.load.unit[2]]
                                    layer.image(img[0],-64,tick+12.5,img[1].width*0.15,img[1].height*0.15)
                                    layer.image(img[1],-64,tick+12.5,img[1].width*0.15,img[1].height*0.15)
                                    tick+=30
                                    count++
                                }
                            break
                        }
                        layer.pop()
                    }
                })
            break
            case `edit`:
                layer.fill(120)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                this.tabs.editAnim.forEach((anim,index)=>{
                    layer.fill(150)
                    layer.rect(layer.width+this.width*0.5-this.width*anim,layer.height*0.5,this.width,layer.height)
                    if(anim>0){
                        layer.push()
                        layer.translate(layer.width+this.width*0.5-this.width*anim,0)
                        tick=75
                        count=1
                        switch(index){
                            case 0:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Editing Map`,0,40)
                                layer.textSize(18)
                                layer.text(`Placing: ${types.team[this.select.edit].name}`,0,tick+7.5)
                                tick+=25
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Place`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,60,tick+15)
                                tick+=50
                                count++
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Load`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,60,tick+15)
                                tick+=50
                                count++
                            break
                            case 1:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Pick Placer`,0,40)
                                layer.textSize(18)
                                layer.text(`Placing: ${types.team[this.select.edit].name}`,0,tick+7.5)
                                tick+=25
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=52
                                for(let a=0,la=types.team.length;a<la;a++){
                                    layer.fill(120,120,120)
                                    layer.rect(0,tick+12.5,160,22,10)
                                    layer.fill(0)
                                    layer.textSize(12)
                                    layer.text(`${types.team[a].name}`,0,tick+12.5)
                                    layer.textSize(10)
                                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+10)
                                    tick+=30
                                    count++
                                }
                            break
                        }
                        layer.pop()
                    }
                })
            break
            case `ally`:
                layer.fill(180)
                layer.rect(layer.width*0.5,layer.height*0.5,layer.width,layer.height)
                layer.fill(150)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                tick=75
                layer.push()
                layer.translate(layer.width-this.width*0.5,0)
                layer.fill(0)
                layer.textSize(24)
                layer.text(`Viewing\nAlliance Grid`,0,40)
                layer.fill(120)
                layer.rect(0,tick+25,160,40,10)
                layer.fill(0)
                layer.textSize(15)
                layer.text(`Exit`,0,tick+25)
                layer.textSize(10)
                layer.text(`Enter`,60,tick+15)
                tick+=50
                layer.pop()
                layer.noFill()
                layer.stroke(0)
                layer.strokeWeight(15)
                for(let a=0,la=this.operation.teams.length;a<la;a++){
                    for(let b=0,lb=this.operation.teams[a].allies.length;b<lb;b++){
                        if(a<this.operation.teams[a].allies[b]){
                            layer.bezier(
                                layer.width*0.5-this.width*0.5+lsin((a+1)/la*360)*360,layer.height*0.5-lcos((a+1)/la*360)*360,
                                layer.width*0.5-this.width*0.5+lsin((a+1)/la*360)*180+lsin((this.operation.teams[a].allies[b]+1)/la*360)*90,layer.height*0.5-lcos((a+1)/la*360)*180-lcos((this.operation.teams[a].allies[b]+1)/la*360)*90,
                                layer.width*0.5-this.width*0.5+lsin((a+1)/la*360)*90+lsin((this.operation.teams[a].allies[b]+1)/la*360)*180,layer.height*0.5-lcos((a+1)/la*360)*90-lcos((this.operation.teams[a].allies[b]+1)/la*360)*180,
                                layer.width*0.5-this.width*0.5+lsin((this.operation.teams[a].allies[b]+1)/la*360)*360,layer.height*0.5-lcos((this.operation.teams[a].allies[b]+1)/la*360)*360
                            )
                        }
                    }
                }
                for(let a=0,la=types.team.length;a<la;a++){
                    let img=[graphics.load.team[types.team[a].loadIndex],graphics.load.unit[2]]
                    layer.image(img[0],layer.width*0.5-this.width*0.5+lsin((a+1)/la*360)*360,layer.height*0.5-lcos((a+1)/la*360)*360,img[1].width*0.5,img[1].height*0.5)
                    layer.image(img[1],layer.width*0.5-this.width*0.5+lsin((a+1)/la*360)*360,layer.height*0.5-lcos((a+1)/la*360)*360,img[1].width*0.5,img[1].height*0.5)
                }
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
            case `title`: case `setup`:
                this.select.trigger=false
                if(this.turn.timer>0){
                    if(dev.instant){
                        this.turn.timer=0
                        this.newTurn()
                    }else{
                        this.turn.timer--
                        if(this.turn.timer<=0){
                            this.newTurn()
                        }
                    }
                }
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                let cit
                let playing=this.turn.main
                if(this.agency.time>0){
                    this.agency.time--
                }else if(this.turn.timer<=0&&!dev.pause){
                    switch(this.tabs.active){
                        case 0:
                            if(!dev.close&&this.tabs.anim[0]>=1){
                                this.operation.teams[this.turn.main].notif=[]
                            }
                            if(types.team[this.turn.main].auto){
                                let possible=[]
                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                    if(
                                        this.operation.cities[a].getUnits([this.turn.main]).length>0||
                                        this.operation.cities[a].data.rule==types.team[this.turn.main].name
                                    ){
                                        possible.push(a)
                                    }
                                }
                                if(possible.length==0){
                                    this.newTurn()
                                }else{
                                    let city=possible[floor(random(0,possible.length))]
                                    this.moveTab(1)
                                    this.select.city=city
                                    if(!dev.close){
                                        this.operation.zoom.shift.position.x=types.city[city].loc[0]
                                        this.operation.zoom.shift.position.y=types.city[city].loc[1]
                                        this.operation.zoom.shift.active=true
                                    }
                                    this.select.trigger=true
                                    this.agency.time=dev.instant?0:5
                                    this.agency.count++
                                }
                            }
                        break
                        case 1:
                            if(types.team[this.turn.main].auto){
                                let moved=false
                                cit=this.operation.cities[this.select.city]
                                let totals=[0,0,0,0,0]
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    if(aligned.includes(cit.units[a].team)){
                                        totals[cit.units[a].type]+=cit.units[a].value
                                    }else{
                                        totals[cit.units[a].type+2]+=cit.units[a].value
                                    }
                                }
                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                    for(let b=0,lb=this.operation.cities[a].units.length;b<lb;b++){
                                        if(aligned.includes(this.operation.cities[a].units[b].team)){
                                            totals[4]+=this.operation.cities[a].units[b].value
                                        }
                                    }
                                }
                                this.agency.lastResult=this.agents[this.turn.main].execute(0,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[this.turn.main].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(findName(cit.owner,types.team))?1:0,
                                    cit.data.rule==types.team[this.turn.main].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.getNotUnits(aligned).length>0?1:0,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)&&city.data.rule==types.team[this.turn.main].name}).length,
                                    cit.data.connect.length,
                                    cit.data.connect.filter(connect=>{return aligned.includes(this.operation.cities[findName(connect.name,types.city)].owner)}).length,
                                    totals[0]>0?1:0,
                                    totals[1]>0?1:0,
                                    totals[2]>0?1:0,
                                    totals[3]>0?1:0,
                                    totals[0]/1000,
                                    totals[1]/1000,
                                    totals[2]/1000,
                                    totals[3]/1000,
                                    totals[4]/10000,
                                    (cit.data.rule==types.team[this.turn.main].name?(cit.getNotUnits(aligned).length<=0?cit.getSpawn(0):cit.getSpawn(1)):cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0?cit.getSpawn(2):0)/1000,
                                    cit.sieged,
                                ])
                                for(let c=0,lc=this.agency.lastResult.length;c<lc;c++){
                                    let maximal=[this.agency.lastResult[0],0]
                                    for(let a=1,la=this.agency.lastResult.length;a<la;a++){
                                        if(this.agency.lastResult[a]>maximal[0]){
                                            maximal[0]=this.agency.lastResult[a]
                                            maximal[1]=a
                                        }
                                    }
                                    this.agency.lastResult.splice(maximal[1],1)
                                    switch(maximal[1]){
                                        case 0:
                                            if(cit.getNotUnits(aligned).reduce((acc,unit)=>acc+unit.value,0)<10000&&this.spawn(cit,this.turn.main)){
                                                this.agency.time=dev.instant?0:5
                                                c=lc
                                                moved=true
                                            }
                                        break
                                        case 1:
                                            if(cit.getUnits([this.turn.main]).length>0){
                                                if(cit.getUnits([this.turn.main],0).length>0){
                                                    this.moveTab(3)
                                                    cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&aligned.includes(unit.team)?unit.value:0;unit.edit.active=false})
                                                    this.agency.time=dev.instant?0:5
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                        case 2:
                                            if(cit.getUnits([this.turn.main]).length>0&&!this.agency.reorg){
                                                if(cit.getNotUnits(aligned).length<=0){
                                                    this.moveTab(2)
                                                    this.agency.reorg=true
                                                    cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                                                    this.agency.time=dev.instant?0:5
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                        case 3:
                                            if(this.agency.count<10){
                                                let possible=[]
                                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                                    if(
                                                        this.tabs.active!=a&&(
                                                            this.operation.cities[a].getUnits([this.turn.main]).length>0||
                                                            this.operation.cities[a].data.rule==types.team[this.turn.main].name
                                                        )
                                                    ){
                                                        possible.push(a)
                                                    }
                                                }
                                                if(possible.length==0){
                                                    this.newTurn()
                                                }else{
                                                    let city=possible[floor(random(0,possible.length))]
                                                    this.moveTab(1)
                                                    this.select.city=city
                                                    if(!dev.close){
                                                        this.operation.zoom.shift.position.x=types.city[city].loc[0]
                                                        this.operation.zoom.shift.position.y=types.city[city].loc[1]
                                                        this.operation.zoom.shift.active=true
                                                    }
                                                    this.select.trigger=true
                                                    this.agency.count++
                                                }
                                                this.agency.time=0
                                                c=lc
                                                moved=true
                                            }
                                        break
                                        case 4:
                                            if(cit.getUnits([this.turn.main]).length>0){
                                                if(cit.getNotUnits(aligned).length>0){
                                                    this.initializeCombat(2)
                                                    this.agency.time=dev.instant?0:5
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                    }
                                }
                                if(!moved){
                                    if(this.agency.count>=10){
                                        if(!this.turn.locked&&!this.turn.pinned){
                                            let maximal={type:-1,recruits:0}
                                            for(let a=0,la=this.operation.cities.length;a<la;a++){
                                                if(this.operation.cities[a].data.rule==types.team[this.turn.main].name||this.operation.cities[a].owner==types.team[this.turn.main].name&&this.operation.cities[a].getNotUnits(aligned).length<=0&&this.operation.cities[a].recruits>maximal.recruits){
                                                    maximal=this.operation.cities[a]
                                                }
                                            }
                                            if(maximal.type!=-1){
                                                this.select.city=maximal.type
                                                cit=maximal
                                                if(types.team[this.turn.main].name!=cit.data.rule&&!(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0)){
                                                    print(cit,this.turn.main,types.team[this.turn.main])
                                                    throw new Error('Autorebel Alignment Fail')
                                                }
                                            }
                                        }
                                        if(cit.type!=-1){
                                            if(cit.getNotUnits(aligned).reduce((acc,unit)=>acc+unit.value,0)<10000&&this.spawn(cit,this.turn.main)){
                                                this.operation.zoom.shift.position.x=types.city[this.select.city].loc[0]
                                                this.operation.zoom.shift.position.y=types.city[this.select.city].loc[1]
                                                this.operation.zoom.shift.active=true
                                            }else{
                                                this.newTurn()
                                            }
                                        }else{
                                            this.newTurn()
                                        }
                                    }else{
                                        let possible=[]
                                        for(let a=0,la=this.operation.cities.length;a<la;a++){
                                            if(
                                                this.tabs.active!=a&&(
                                                    this.operation.cities[a].getUnits([this.turn.main]).length>0||
                                                    this.operation.cities[a].data.rule==types.team[this.turn.main].name
                                                )
                                            ){
                                                possible.push(a)
                                            }
                                        }
                                        if(possible.length==0||this.agency.count>=10){
                                            this.newTurn()
                                        }else{
                                            let city=possible[floor(random(0,possible.length))]
                                            this.moveTab(1)
                                            this.select.city=city
                                            if(!dev.close){
                                                this.operation.zoom.shift.position.x=types.city[city].loc[0]
                                                this.operation.zoom.shift.position.y=types.city[city].loc[1]
                                                this.operation.zoom.shift.active=true
                                            }
                                            this.select.trigger=true
                                            this.agency.time=0
                                            this.agency.count++
                                        }
                                    }
                                }
                            }
                        break
                        case 2:
                            if(types.team[this.turn.main].auto){
                                cit=this.operation.cities[this.select.city]
                                let totals=[0,0,0]
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    if(aligned.includes(cit.units[a].team)){
                                        totals[cit.units[a].type]+=cit.units[a].value
                                    }
                                }
                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                    for(let b=0,lb=this.operation.cities[a].units.length;b<lb;b++){
                                        if(aligned.includes(this.operation.cities[a].units[b].team)){
                                            totals[2]+=this.operation.cities[a].units[b].value
                                        }
                                    }
                                }
                                this.agency.lastResult=this.agents[this.turn.main].execute(2,[
                                    this.turn.count,
                                    totals[0]>0?1:0,
                                    totals[1]>0?1:0,
                                    totals[0]>1000?1:0,
                                    totals[1]>1000?1:0,
                                    random(0,1),
                                    totals[0]/1000,
                                    totals[1]/1000,
                                    totals[2]/10000,
                                ])
                                if(this.agency.lastResult[0]>=100){
                                    for(let a=aligned.includes(cit.ruleIndex)?1:0,la=3;a<la;a++){
                                        if(this.agency.lastResult[0]>=100){
                                            for(let b=0,lb=cit.units.length;b<lb;b++){
                                                if(
                                                    cit.units[b].type==1&&this.agency.lastResult[0]>=100&&(
                                                        a==0&&this.operation.teams[this.turn.main].allies.includes(cit.units[b].team)&&cit.units[b].team==cit.ruleIndex||
                                                        a==1&&cit.units[b].team==this.turn.main||
                                                        a==2&&this.operation.teams[this.turn.main].allies.includes(cit.units[b].team)
                                                    )
                                                ){
                                                    this.turn.locked=true
                                                    let move=min(round(this.agency.lastResult[0]/100)*100,min(cit.units[b].value-round(random(2.5,10))*100,round(cit.units[b].value*0.005)*100))
                                                    if(move>0){
                                                        cit.units[b].edit.trigger=false
                                                        cit.units[b].value-=move
                                                        cit.units.splice(b+1,0,new unit(cit,cit.units[b].team,1-cit.units[b].type,move))
                                                        cit.units[b+1].position.y=cit.units[b].position.y
                                                        if(cit.units[b].value<=0){
                                                            cit.units[b].remove=true
                                                        }
                                                    }
                                                    this.agency.lastResult[0]-=move
                                                    if(this.agency.lastResult[0]<=0){
                                                        break
                                                    }
                                                }
                                            }
                                        }else{
                                            break
                                        }
                                    }
                                }else if(this.agency.lastResult[0]<=-100){
                                    for(let a=0,la=2;a<la;a++){
                                        if(this.agency.lastResult[0]<=-100){
                                            for(let b=0,lb=cit.units.length;b<lb;b++){
                                                if(
                                                    cit.units[b].type==0&&this.agency.lastResult[0]<=-100&&(
                                                        a==0&&cit.units[b].team==this.turn.main||
                                                        a==1&&this.operation.teams[this.turn.main].allies.includes(cit.units[b].team)
                                                    )
                                                ){
                                                    this.turn.locked=true
                                                    let move=min(round(-this.agency.lastResult[0]/100)*100,min(cit.units[b].value-round(random(2.5,10))*100,round(cit.units[b].value*0.005)*100))
                                                    if(move>0){
                                                        cit.units[b].edit.trigger=false
                                                        cit.units[b].value-=move
                                                        cit.units.splice(b+1,0,new unit(cit,cit.units[b].team,1-cit.units[b].type,move))
                                                        cit.units[b+1].position.y=cit.units[b].position.y
                                                        if(cit.units[b].value<=0){
                                                            cit.units[b].remove=true
                                                        }
                                                    }
                                                    this.agency.lastResult[0]+=move
                                                    if(this.agency.lastResult[0]>=0){
                                                        break
                                                    }
                                                }
                                            }
                                        }else{
                                            break
                                        }
                                    }
                                }
                                cit.updateUnits()
                                this.moveTab(this.turn.locked?1:0)
                                this.agency.time=dev.instant?0:5
                            }
                        break
                        case 3:
                            if(types.team[this.turn.main].auto){
                                //this code forces leaving a garrison, but it doesn't seem necessary
                                /*if(!this.operation.cities[this.select.city].units.some(unit=>!aligned.includes(unit.team)||unit.type==1)){
                                    this.operation.cities[this.select.city].units.forEach(unit=>unit.edit.num=ceil((unit.edit.num-min(round(random(2.5,10))*100,unit.edit.num*random(0.25,0.5)))/100yy)*100)
                                }*/
                                this.moveTab(7)
                                this.turn.pinned=true
                                if(!this.operation.cities[this.select.city].units.some(unit=>unit.value>0&&unit.edit.num>0)){
                                    throw new Error('Move 0')
                                }
                                if(types.city[this.select.city].connect.length==0){
                                    this.moveTab(0)
                                }else{
                                    this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                    this.agency.count=0
                                }
                            }
                        break
                        case 4:
                            if(types.team[this.turn.main].auto){
                                for(let a=0,la=this.operation.teams[this.turn.main].allies.length;a<la;a++){
                                    if(floor(random(0,types.team[this.turn.main].allies.includes(types.team[this.operation.teams[this.turn.main].allies[a]].name)?15:5))<=1){
                                        this.operation.teams[this.operation.teams[this.turn.main].allies[a]].notif.push(`Alliance Broken\nWith ${this.operation.teams[this.turn.main].name}`)
                                        this.operation.teams[this.operation.teams[this.turn.main].allies[a]].allies.splice(this.operation.teams[this.operation.teams[this.turn.main].allies[a]].allies.indexOf(this.turn.main),1)
                                        this.operation.teams[this.turn.main].allies.splice(a,1)
                                        a--
                                        la--
                                        this.updateUnits()
                                    }
                                }
                                this.moveTab(6)
                                this.agency.time=dev.instant?0:5
                            }
                        break
                        case 5:
                            if(types.team[this.turn.main].auto){
                                this.moveTab(0)
                                this.updateVisibility()
                                this.agency.time=0
                                this.agency.count=0
                            }
                        break
                        case 6:
                            if(types.team[this.turn.main].auto){
                                let mix=[]
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(a!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(a)&&!this.operation.teams[this.turn.main].offers.includes(a)){
                                        let distance=10000
                                        for(let b=0,lb=this.operation.teams[this.turn.main].cities.length;b<lb;b++){
                                            for(let c=0,lc=this.operation.teams[a].cities.length;c<lc;c++){
                                                distance=min(distance,distPos(this.operation.teams[this.turn.main].cities[b],this.operation.teams[a].cities[c]))
                                            }
                                        }
                                        let distMult=constrain(1.5-distance/1000,0,1)
                                        if(distMult>0){
                                            for(let b=0,lb=(this.operation.teams[a].offers.includes(this.turn.main)?(types.team[a].auto?10:5-this.operation.teams[a].allies.length):(types.team[a].auto?1:0))*types.teamType[findName(types.team[this.turn.main].type,types.teamType)].affinity[findName(types.team[a].type,types.teamType)]*distMult;b<lb;b++){
                                                mix.push(a)
                                            }
                                        }
                                        if(floor(random(0,5))==0){
                                            mix.push(-1)
                                        }
                                    }
                                }
                                let roll=randin(mix)
                                if(roll>=0){
                                    if(this.operation.teams[roll].offers.includes(this.turn.main)){
                                        this.operation.teams[roll].notif.push(`Alliance Made\nWith ${this.operation.teams[this.turn.main].name}`)
                                        this.operation.teams[roll].allies.push(this.turn.main)
                                        this.operation.teams[this.turn.main].allies.push(roll)
                                        this.operation.teams[roll].offers.splice(this.operation.teams[roll].offers.indexOf(this.turn.main),1)
                                    }else if(!this.operation.teams[this.turn.main].offers.includes(roll)){
                                        this.operation.teams[this.turn.main].offers.push(roll)
                                    }
                                    this.newTurn()
                                }else{
                                    this.moveTab(0)
                                    this.agency.time=dev.instant?0:5
                                }
                            }
                        break
                        case 7:
                            if(types.team[this.turn.main].auto){
                                cit=this.operation.cities[this.select.targetCity]
                                let totals=[0,0,0,0]
                                for(let a=0,la=this.operation.cities[this.select.city].units.length;a<la;a++){
                                    if(aligned.includes(this.operation.cities[this.select.city].units[a].team)){
                                        totals[this.operation.cities[this.select.city].units[a].type]+=this.operation.cities[this.select.city].units[a].value
                                    }
                                }
                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                    for(let b=0,lb=this.operation.cities[a].units.length;b<lb;b++){
                                        if(aligned.includes(this.operation.cities[a].units[b].team)){
                                            totals[2]+=this.operation.cities[a].units[b].value
                                        }
                                    }
                                }
                                for(let a=0,la=this.operation.cities[this.select.city].units.length;a<la;a++){
                                    if(aligned.includes(this.operation.cities[this.select.city].units[a].team)){
                                        totals[3]+=this.operation.cities[this.select.city].units[a].value
                                    }
                                }
                                let type=-1
                                for(let a=0,la=types.city[this.operation.cities[this.select.city].type].connect.length;a<la;a++){
                                    if(types.city[this.operation.cities[this.select.city].type].connect[a].name==types.city[this.select.targetCity].name){
                                        type=types.city[this.operation.cities[this.select.city].type].connect[a].type
                                    }
                                }
                                this.agency.lastResult=this.agents[this.turn.main].execute(1,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[this.turn.main].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(findName(cit.owner,types.team))?1:0,
                                    cit.data.rule==types.team[this.turn.main].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.data.connect.length,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)&&city.data.rule==types.team[this.turn.main].name}).length,
                                    totals[3]/1000,
                                    totals[0]>0?1:0,
                                    totals[1]>0?1:0,
                                    totals[0]/1000,
                                    totals[1]/1000,
                                    cit.getNotUnits(aligned,0).length>0?1:0,
                                    cit.getNotUnits(aligned,1).length>0?1:0,
                                    totals[2]/10000,
                                    !types.city[cit.type].connect.some(item=>!aligned.includes(this.operation.cities[findName(item.name,types.city)].owner))?1:0,
                                    type
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.agency.time=dev.instant?0:5
                                    this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity)
                                }else{
                                    if(this.agency.count>=10){
                                        this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                        this.agency.time=dev.instant?0:5
                                        this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity)
                                    }else if(types.city[this.select.city].connect.length==0){
                                        this.newTurn()
                                    }else{
                                        this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                        this.agency.count++
                                    }
                                    this.agency.time=0
                                }
                            }
                        break
                        case 8:
                            playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                            if(types.team[playing].auto){
                                cit=this.operation.cities[this.select.targetCity]
                                let totals=[0,0]
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    totals[aligned.includes(cit.units[a].team)?1:0]+=cit.units[a].value
                                }
                                this.agency.lastResult=this.agents[playing].execute(3,[
                                    this.turn.count,
                                    cit.data.rule==types.team[playing].name?1:0,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                    totals[0]/1000,
                                    totals[1]/1000,
                                    this.battle.circumstance[0]==2?1:0,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.initializeCombat(0)
                                    this.agency.time=dev.instant?0:5
                                }else{
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
                                    cit.updateUnits()
                                    this.moveTab(10)
                                    this.battle.circumstance[1]=1
                                    let rule=this.operation.cities[this.select.targetCity].ruleIndex
                                    if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                        this.operation.cities[this.select.targetCity].raided(this.turn.main)
                                    }
                                    this.agency.time=0
                                }
                            }
                        break
                        case 9:
                            playing=this.operation.cities[this.select.battleCity].getMostNotUnit(aligned)
                            if(types.team[this.turn.main].auto&&!this.operation.cities[this.select.battleCity].getNotUnits(aligned).some(unit=>!types.team[unit.team].auto)){
                                this.accept()
                                this.agency.time=0
                            }
                        break
                        case 10:
                            if(types.team[this.turn.main].auto){
                                cit=this.operation.cities[this.select.targetCity]
                                let totals=[0,0]
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    totals[aligned.includes(cit.units[a].team)?1:0]+=cit.units[a].value
                                }
                                this.agency.lastResult=this.agents[this.turn.main].execute(4,[
                                    this.turn.count,
                                    cit.data.rule==types.team[this.turn.main].name?1:0,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                    totals[0]/1000,
                                    totals[1]/1000,
                                    this.battle.circumstance[0]==2?1:0,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.initializeCombat(1)
                                    this.agency.time=dev.instant?0:5
                                }else{
                                    this.newTurn()
                                    this.agency.time=0
                                }
                            }
                        break
                        case 11:
                            playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                            if(types.team[playing].auto){
                                cit=this.operation.cities[this.select.targetCity]
                                let totals=[0,0]
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    totals[aligned.includes(cit.units[a].team)?1:0]+=cit.units[a].value
                                }
                                this.agency.lastResult=this.agents[playing].execute(5,[
                                    this.turn.count,
                                    cit.data.rule==types.team[playing].name?1:0,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                    totals[0]/1000,
                                    totals[1]/1000,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.moveTab(12)
                                    this.select.secondaryCity=findName(randin(types.city[this.select.targetCity].connect).name,types.city)
                                    this.agency.count=0
                                    this.agency.time=0
                                }else{
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
                                    cit.updateUnits()
                                    this.operation.cities[this.select.targetCity].sieged+=3
                                    this.moveTab(10)
                                    this.battle.circumstance[1]=1
                                    this.agency.time=0
                                }
                            }
                        break
                        case 12:
                            playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                            if(types.team[playing].auto){
                                let newAligned=[playing,...this.operation.teams[playing].allies]
                                cit=this.operation.cities[this.select.secondaryCity]
                                let totals=[0,0,0,0]
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    if(newAligned.includes(this.operation.cities[this.select.targetCity].units[a].team)){
                                        totals[this.operation.cities[this.select.targetCity].units[a].type]+=this.operation.cities[this.select.targetCity].units[a].value
                                    }
                                }
                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                    for(let b=0,lb=this.operation.cities[a].units.length;b<lb;b++){
                                        if(newAligned.includes(this.operation.cities[a].units[b].team)){
                                            totals[2]+=this.operation.cities[a].units[b].value
                                        }
                                    }
                                }
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    if(newAligned.includes(this.operation.cities[this.select.targetCity].units[a].team)){
                                        totals[3]+=this.operation.cities[this.select.targetCity].units[a].value
                                    }
                                }
                                this.agency.lastResult=this.agents[playing].execute(6,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[playing].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(findName(cit.owner,types.team))?1:0,
                                    cit.data.rule==types.team[playing].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.data.connect.length,
                                    cit.visibility>0?1:0,
                                    totals[3]/1000,
                                    cit.getUnits(newAligned,0).length>0?1:0,
                                    cit.getUnits(newAligned,1).length>0?1:0,
                                    totals[0]/1000,
                                    totals[1]/1000,
                                    cit.getNotUnitsVisible(newAligned,0).length>0?1:0,
                                    cit.getNotUnitsVisible(newAligned,1).length>0?1:0,
                                    totals[2]/10000,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.agency.time=dev.instant?0:5
                                    this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.secondaryCity)
                                }else{
                                    if(this.agency.count>=10){
                                        this.select.secondaryCity=findName(randin(types.city[this.select.targetCity].connect).name,types.city)
                                        this.agency.time=dev.instant?0:5
                                        this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.secondaryCity)
                                    }else if(types.city[this.select.targetCity].connect.length==0){
                                        this.newTurn()
                                    }else{
                                        this.select.secondaryCity=findName(randin(types.city[this.select.targetCity].connect).name,types.city)
                                        this.agency.count++
                                    }
                                    this.agency.time=0
                                }
                            }
                        break
                        case 13:
                            playing=this.operation.cities[this.select.city].getMostNotUnit(aligned)
                            if(types.team[playing].auto){
                                let newAligned=[playing,...this.operation.teams[playing].allies]
                                cit=this.operation.cities[this.select.targetCity]
                                let totals=[0,0,0,0]
                                for(let a=0,la=this.operation.cities[this.select.city].units.length;a<la;a++){
                                    if(newAligned.includes(this.operation.cities[this.select.city].units[a].team)){
                                        totals[this.operation.cities[this.select.city].units[a].type]+=this.operation.cities[this.select.city].units[a].value
                                    }
                                }
                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                    for(let b=0,lb=this.operation.cities[a].units.length;b<lb;b++){
                                        if(newAligned.includes(this.operation.cities[a].units[b].team)){
                                            totals[2]+=this.operation.cities[a].units[b].value
                                        }
                                    }
                                }
                                for(let a=0,la=this.operation.cities[this.select.city].units.length;a<la;a++){
                                    if(newAligned.includes(this.operation.cities[this.select.city].units[a].team)){
                                        totals[3]+=this.operation.cities[this.select.city].units[a].value
                                    }
                                }
                                this.agency.lastResult=this.agents[playing].execute(6,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[playing].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(findName(cit.owner,types.team))?1:0,
                                    cit.data.rule==types.team[playing].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.data.connect.length,
                                    cit.visibility>0?1:0,
                                    totals[3]/1000,
                                    totals[0]>0?1:0,
                                    totals[1]>0?1:0,
                                    totals[0]/1000,
                                    totals[1]/1000,
                                    cit.getNotUnitsVisible(newAligned,0).length>0?1:0,
                                    cit.getNotUnitsVisible(newAligned,1).length>0?1:0,
                                    totals[2]/10000,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.agency.time=dev.instant?0:5
                                    this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity)
                                }else{
                                    if(this.agency.count>=10){
                                        this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                        this.agency.time=dev.instant?0:5
                                        this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity)
                                    }else if(types.city[this.select.city].connect.length==0){
                                        this.newTurn()
                                    }else{
                                        this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                        this.agency.count++
                                    }
                                    this.agency.time=0
                                }
                            }
                        break
                        case 14: case 15:
                            if(types.team[this.turn.main].auto){
                                this.moveTab(0)
                                this.agency.time=0
                            }
                        break
                    }
                }
            break
            case `map`:
                this.tabs.mapAnim.forEach((anim,index,array)=>{
                    array[index]=smoothAnim(anim,this.tabs.mapActive==index,0,1,5)
                })
            break
            case `edit`:
                this.tabs.editAnim.forEach((anim,index,array)=>{
                    array[index]=smoothAnim(anim,this.tabs.editActive==index,0,1,5)
                })
            break
        }
    }
    onClick(layer,mouse,scene){
        let rel
        let tick
        let set
        let rows
        switch(scene){
            case `title`:
                rel={position:{x:mouse.position.x-layer.width*0.5,y:mouse.position.y}}
                let groups=[]
                for(let a=0,la=types.map.length;a<la;a++){
                    if(!types.map[a].stack){
                        groups.push([])
                    }
                    last(groups).push(a)
                }
                for(let a=0,la=groups.length;a<la;a++){
                    for(let b=0,lb=groups[a].length;b<lb;b++){
                        if(inPointBox(rel,boxify((b+0.5)/lb*240-120,a*60+610-la*30,240/lb,50))){
                            this.operation.transitionManager.begin(`setup`)
                            this.operation.nextMap=groups[a][b]
                            this.select.auto=[]
                            types.map[groups[a][b]].team.forEach(item=>this.select.auto.push(true))
                        }
                    }
                }
            break
            case `setup`:
                set=types.map[this.operation.nextMap].teamSet
                rows=ceil(this.select.auto.length/set)
                rel={position:{x:mouse.position.x-layer.width*0.5,y:mouse.position.y}}
                for(let a=0,la=this.select.auto.length;a<la;a++){
                    if(inPointBox(rel,boxify(-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+445,240,50))){
                        this.select.auto[a]=!this.select.auto[a]
                    }
                }
                if(inPointBox(rel,boxify(-125,rows*30+475,240,50))){
                    let possible=[]
                    for(let a=0,la=this.select.auto.length;a<la;a++){
                        if(this.select.auto[a]){
                            possible.push(a)
                        }
                    }
                    if(possible.length>0){
                        let index=randin(possible)
                        this.select.auto[index]=!this.select.auto[index]
                    }
                }
                if(inPointBox(rel,boxify(65,rows*30+475,120,50))&&options.strength>0.2){
                    options.strength=round(options.strength*10-1)/10
                    options.strengthEdit=true
                }
                if(inPointBox(rel,boxify(185,rows*30+475,120,50))&&options.strength<2){
                    options.strength=round(options.strength*10+1)/10
                    options.strengthEdit=true
                }
                if(inPointBox(rel,boxify(-125,rows*30+535,240,50))){
                    this.operation.transitionManager.begin(`main`)
                }
                if(inPointBox(rel,boxify(125,rows*30+535,240,50))){
                    this.operation.transitionManager.begin(`edit`)
                }
            break
            case `pick`:
                set=types.map[this.operation.map].teamSet
                rows=ceil(types.team.length/set)
                rel={position:{x:mouse.position.x-layer.width*0.5,y:mouse.position.y}}
                for(let a=0,la=types.team.length;a<la;a++){
                    if(inPointBox(rel,boxify(-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+475,240,50))){
                        types.team[a].auto=!types.team[a].auto
                    }
                }
                if(inPointBox(rel,boxify(-125,rows*30+505,240,50))){
                    this.operation.transitionManager.begin(`main`)
                }
                if(inPointBox(rel,boxify(125,rows*30+505,240,50))){
                    this.operation.transitionManager.begin(`edit`)
                }
            break
            case `main`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                if(mouse.position.x<layer.width-this.width&&!this.turn.pinned&&this.tabs.active!=16){
                    if(this.tabs.active==5){
                        this.updateVisibility()
                    }
                    if(!this.select.trigger){
                        this.moveTab(this.turn.locked?1:0)
                    }
                }
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                let cit
                tick=75
                if(this.turn.timer<=0){
                    switch(this.tabs.active){
                        case 0:
                            tick+=25
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.turn.count=0
                                this.newTurn()
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(4)
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.operation.transitionManager.begin(`map`)
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(16)
                                this.operation.cities.forEach(city=>city.visibility=0)
                            }
                            tick+=50
                        break
                        case 1:
                            tick+=25
                            cit=this.operation.cities[this.select.city]
                            if(
                                cit.getUnits([this.turn.main]).length>0||
                                cit.data.rule==types.team[this.turn.main].name
                            ){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    //cit.minorRegen()
                                    this.turn.count=0
                                    this.newTurn()
                                }
                                tick+=50
                            }
                            if(cit.data.rule==types.team[this.turn.main].name||(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0)){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.spawn(cit,this.turn.main)
                                }
                                tick+=50
                            }
                            if(cit.getUnits([this.turn.main]).length>0){
                                if(cit.getUnits([this.turn.main],0).length>0){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.moveTab(3)
                                        cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&aligned.includes(unit.team)?unit.value:0;unit.edit.active=false})
                                    }
                                    tick+=50
                                }
                                if(cit.getNotUnits(aligned).length<=0){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.moveTab(2)
                                        cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                                    }
                                    tick+=50
                                }else{
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.initializeCombat(2)
                                    }
                                    tick+=50
                                }
                            }
                            if(cit.owner==types.team[this.turn.main].name&&cit.data.type==3){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(14)
                                }
                                tick+=50
                            }
                            if(cit.owner==types.team[this.turn.main].name&&cit.data.type==4){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(15)
                                }
                                tick+=50
                            }
                            if(cit.getUnits([this.turn.main]).length>0&&cit.getNotUnits(aligned).length<=0&&cit.owner!=types.team[this.turn.main].name){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    cit.setOwner(types.team[this.turn.main].name)
                                }
                                tick+=50
                            }
                        break
                        case 2:
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
                        break
                        case 3:
                            cit=this.operation.cities[this.select.city]
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    if(
                                        cit.units[a].type==0&&(
                                            cit.units[a].team==this.turn.main||
                                            this.operation.teams[this.turn.main].allies.includes(cit.units[a].team)
                                        )&&
                                        cit.units[a].edit.num>0
                                    ){
                                        this.moveTab(7)
                                        this.turn.pinned=true
                                        break
                                    }
                                }
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
                        break
                        case 4:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(6)
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.operation.transitionManager.begin(`ally`)
                            }
                            tick+=50
                            for(let a=0,la=this.operation.teams[this.turn.main].allies.length;a<la;a++){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.operation.teams[this.operation.teams[this.turn.main].allies[a]].notif.push(`Alliance Broken\nWith ${this.operation.teams[this.turn.main].name}`)
                                    this.operation.teams[this.operation.teams[this.turn.main].allies[a]].allies.splice(this.operation.teams[this.operation.teams[this.turn.main].allies[a]].allies.indexOf(this.turn.main),1)
                                    this.operation.teams[this.turn.main].allies.splice(a,1)
                                    this.updateUnits()
                                    break
                                }
                                tick+=50
                            }
                        break
                        case 5:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(0)
                                this.updateVisibility()
                            }
                            tick+=50
                        break
                        case 6:
                            for(let a=0,la=types.team.length;a<la;a++){
                                if(a!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(a)){
                                    if(inPointBox(rel,boxify(0,tick+12.5,160,25))){
                                        if(this.operation.teams[a].offers.includes(this.turn.main)){
                                            this.operation.teams[a].notif.push(`Alliance Made\nWith ${this.operation.teams[this.turn.main].name}`)
                                            this.operation.teams[a].allies.push(this.turn.main)
                                            this.operation.teams[this.turn.main].allies.push(a)
                                            this.operation.teams[a].offers.splice(this.operation.teams[a].offers.indexOf(this.turn.main),1)
                                        }else if(!this.operation.teams[this.turn.main].offers.includes(a)){
                                            this.operation.teams[this.turn.main].offers.push(a)
                                        }
                                        this.newTurn()
                                    }
                                    tick+=35
                                }
                            }
                        break
                        case 8:
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
                                this.moveTab(10)
                                this.battle.circumstance[1]=1
                                let rule=this.operation.cities[this.select.targetCity].ruleIndex
                                if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                    this.operation.cities[this.select.targetCity].raided(this.turn.main)
                                }
                            }
                            tick+=50
                        break
                        case 9:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.accept()
                            }
                            tick+=50
                        break
                        case 10:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.initializeCombat(1)
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.newTurn()
                            }
                            tick+=50
                        break
                        case 11:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.moveTab(12)
                                this.select.secondaryCity=findName(randin(types.city[this.select.targetCity].connect).name,types.city)
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
                                this.operation.cities[this.select.targetCity].sieged+=3
                                this.moveTab(10)
                                this.battle.circumstance[1]=1
                            }
                            tick+=50
                        break
                        case 14:
                            for(let a=0,la=types.team.length;a<la;a++){
                                if(a!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(a)){
                                    if(inPointBox(rel,boxify(0,tick+12.5,160,25))){
                                        let ct=this.turn.count
                                        this.turn.count=0
                                        this.newTurn()
                                        this.turn.main=a
                                        this.turn.count=ct
                                    }
                                    tick+=35
                                }
                            }
                        break
                    }
                }
            break
            case `map`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                tick=100
                switch(this.tabs.mapActive){
                    case 0:
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.operation.transitionManager.begin(`main`)
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.mapActive=1
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            if(this.tabs.active!=0){
                                this.turn.count=0
                                this.newTurn()
                            }
                            this.operation.saveCol()
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            if(this.tabs.active!=0){
                                this.turn.count=0
                                this.newTurn()
                            }
                            this.operation.loadCol(`map`)
                        }
                        tick+=50
                    break
                    case 1:
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.mapActive=0
                        }
                        tick+=52
                    break
                }
            break
            case `edit`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                tick=100
                switch(this.tabs.editActive){
                    case 0:
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.operation.initialComponents()
                            this.operation.transitionManager.begin(`main`)
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.editActive=1
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.operation.loadCol(`edit`)
                        }
                        tick+=50
                    break
                    case 1:
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.editActive=0
                        }
                        tick+=52
                        for(let a=0,la=types.team.length;a<la;a++){
                            if(inPointBox(rel,boxify(0,tick+12.5,160,22,10))){
                                this.select.edit=a
                                this.tabs.editActive=0
                            }
                            tick+=30
                        }
                    break
                }
            break
            case `ally`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                tick=75
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.operation.transitionManager.begin(`main`)
                }
                tick+=50
            break
        }
    }
    onKey(layer,key,scene){
        let count=1
        switch(scene){
            case `title`:
                for(let a=0,la=types.map.length;a<la;a++){
                    if(key==(a+1).toString()){
                        this.operation.transitionManager.begin(`setup`)
                        this.operation.nextMap=a
                        this.select.auto=[]
                        types.map[a].team.forEach(item=>this.select.auto.push(true))
                    }
                }
            break
            case `setup`:
                for(let a=0,la=this.select.auto.length;a<la;a++){
                    if(key==`abcdefghijklmnopqrstuvwxyz`[a]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[a]){
                        this.select.auto[a]=!this.select.auto[a]
                    }
                }
                if(key==`#`){
                    let possible=[]
                    for(let a=0,la=this.select.auto.length;a<la;a++){
                        if(this.select.auto[a]){
                            possible.push(a)
                        }
                    }
                    if(possible.length>0){
                        let index=randin(possible)
                        this.select.auto[index]=!this.select.auto[index]
                    }
                }else if(key==`+`&&options.strength>0.2){
                    options.strength=round(options.strength*10-1)/10
                    options.strengthEdit=true
                }else if(key==`-`&&options.strength<2){
                    options.strength=round(options.strength*10+1)/10
                    options.strengthEdit=true
                }else if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }else if(key==`/`){
                    this.operation.transitionManager.begin(`edit`)
                }else if(key==`Shift`){
                    this.select.auto.forEach((item,index,array)=>array[index]=!item)
                }
            break
            case `pick`:
                for(let a=0,la=types.team.length;a<la;a++){
                    if(key==`abcdefghijklmnopqrstuvwxyz`[a]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[a]){
                        types.team[a].auto=!types.team[a].auto
                    }
                }
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }else if(key==`/`){
                    this.operation.transitionManager.begin(`edit`)
                }else if(key==`Shift`){
                    types.team.forEach(team=>team.auto=!team.auto)
                }
            break
            case `main`:
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                let cit
                switch(this.tabs.active){
                    case 0:
                        if(key==count.toString()){
                            this.turn.count=0
                            this.newTurn()
                        }
                        count++
                        if(key==count.toString()){
                            this.moveTab(4)
                        }
                        count++
                        if(key==count.toString()){
                            this.operation.transitionManager.begin(`map`)
                        }
                        count++
                        if(key==count.toString()){
                            this.moveTab(16)
                            this.operation.cities.forEach(city=>city.visibility=0)
                        }
                        count++
                    break
                    case 1:
                        cit=this.operation.cities[this.select.city]
                        if(
                            cit.getUnits([this.turn.main]).length>0||
                            cit.data.rule==types.team[this.turn.main].name
                        ){
                            if(key==count.toString()){
                                //cit.minorRegen()
                                this.turn.count=0
                                this.newTurn()
                            }
                            count++
                        }
                        if(cit.data.rule==types.team[this.turn.main].name||(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0)){
                            if(key==count.toString()){
                                this.spawn(cit,this.turn.main)
                            }
                            count++
                        }
                        if(cit.getUnits([this.turn.main]).length>0){
                            if(cit.getUnits([this.turn.main],0).length>0){
                                if(key==count.toString()){
                                    this.moveTab(3)
                                    cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&aligned.includes(unit.team)?unit.value:0;unit.edit.active=false})
                                }
                                count++
                            }
                            if(cit.getNotUnits(aligned).length<=0){
                                if(key==count.toString()){
                                    this.moveTab(2)
                                    cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                                }
                                count++
                            }else{
                                if(key==count.toString()){
                                    this.initializeCombat(2)
                                }
                                count++
                            }
                        }
                        if(cit.owner==types.team[this.turn.main].name&&cit.data.type==3){
                            if(key==count.toString()){
                                this.moveTab(14)
                            }
                            count++
                        }
                        if(cit.owner==types.team[this.turn.main].name&&cit.data.type==4){
                            if(key==count.toString()){
                                this.moveTab(15)
                            }
                            count++
                        }
                        if(cit.getUnits([this.turn.main]).length>0&&cit.getNotUnits(aligned).length<=0&&cit.owner!=types.team[this.turn.main].name){
                            if(key==count.toString()){
                                cit.setOwner(types.team[this.turn.main].name)
                            }
                            count++
                        }
                    break
                    case 2:
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
                    break
                    case 3:
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
                        if(key==`Enter`){
                            for(let a=0,la=cit.units.length;a<la;a++){
                                if(
                                    cit.units[a].type==0&&(
                                        cit.units[a].team==this.turn.main||
                                        this.operation.teams[this.turn.main].allies.includes(cit.units[a].team)
                                    )&&
                                    cit.units[a].edit.num>0
                                ){
                                    this.moveTab(7)
                                    this.turn.pinned=true
                                    break
                                }
                            }
                        }
                        if(key==`Escape`){
                            cit.getUnits([this.turn.main],0).forEach(unit=>{if(unit.edit.num>=unit.value){unit.remove=true;this.operation.teams[this.turn.main].deserters+=unit.value}else{unit.value-=unit.edit.num;this.operation.teams[this.turn.main].deserters+=unit.edit.num}})
                            this.updateVisibility(this.turn.main)
                            cit.updateUnits()
                            this.moveTab(1)
                        }
                    break
                    case 4:
                        if(key==count.toString()){
                            this.moveTab(6)
                        }
                        count++
                        if(key==count.toString()){
                            this.operation.transitionManager.begin(`ally`)
                        }
                        count++
                        for(let a=0,la=this.operation.teams[this.turn.main].allies.length;a<la;a++){
                            if(key==count.toString()){
                                this.operation.teams[this.operation.teams[this.turn.main].allies[a]].notif.push(`Alliance Broken\nWith ${this.operation.teams[this.turn.main].name}`)
                                this.operation.teams[this.operation.teams[this.turn.main].allies[a]].allies.splice(this.operation.teams[this.operation.teams[this.turn.main].allies[a]].allies.indexOf(this.turn.main),1)
                                this.operation.teams[this.turn.main].allies.splice(a,1)
                                this.updateUnits()
                                break
                            }
                            count++
                        }
                    break
                    case 5:
                        if(key==`Enter`){
                            this.moveTab(0)
                            this.updateVisibility()
                        }
                    break
                    case 6:
                        for(let a=0,la=types.team.length;a<la;a++){
                            if(a!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(a)){
                                if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                    if(this.operation.teams[a].offers.includes(this.turn.main)){
                                        this.operation.teams[a].notif.push(`Alliance Made\nWith ${this.operation.teams[this.turn.main].name}`)
                                        this.operation.teams[a].allies.push(this.turn.main)
                                        this.operation.teams[this.turn.main].allies.push(a)
                                        this.operation.teams[a].offers.splice(this.operation.teams[a].offers.indexOf(this.turn.main),1)
                                    }else if(!this.operation.teams[this.turn.main].offers.includes(a)){
                                        this.operation.teams[this.turn.main].offers.push(a)
                                    }
                                    this.newTurn()
                                }
                                count++
                            }
                        }
                    break
                    case 8:
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
                            this.moveTab(10)
                            this.battle.circumstance[1]=1
                            let rule=this.operation.cities[this.select.targetCity].ruleIndex
                            if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                this.operation.cities[this.select.targetCity].raided(this.turn.main)
                            }
                        }
                        count++
                    break
                    case 9:
                        if(key==`Enter`){
                            this.accept()
                        }
                        count++
                    break
                    case 10:
                        if(key==count.toString()){
                            this.initializeCombat(1)
                        }
                        count++
                        if(key==count.toString()){
                            this.newTurn()
                        }
                        count++
                    break
                    case 11:
                        if(key==count.toString()){
                            this.moveTab(12)
                            this.select.secondaryCity=findName(randin(types.city[this.select.targetCity].connect).name,types.city)
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
                            this.operation.cities[this.select.targetCity].sieged+=3
                            this.moveTab(10)
                            this.battle.circumstance[1]=1
                        }
                        count++
                    break
                    case 14:
                        for(let a=0,la=types.team.length;a<la;a++){
                            if(a!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(a)){
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
                    break
                }
            break
            case `map`:
                count=1
                switch(this.tabs.mapActive){
                    case 0:
                        if(key==`Enter`){
                            this.operation.transitionManager.begin(`main`)
                        }
                        if(key==count.toString()){
                            this.tabs.mapActive=1
                        }
                        count++
                        if(key==count.toString()){
                            if(this.tabs.active!=0){
                                this.turn.count=0
                                this.newTurn()
                            }
                            this.operation.saveCol()
                        }
                        count++
                        if(key==count.toString()){
                            if(this.tabs.active!=0){
                                this.turn.count=0
                                this.newTurn()
                            }
                            this.operation.loadCol(`map`)
                        }
                        count++
                    break
                    case 1:
                        if(key==`Enter`){
                            this.tabs.mapActive=0
                        }
                    break
                }
            break
            case `edit`:
                count=1
                switch(this.tabs.editActive){
                    case 0:
                        if(key==`Enter`){
                            this.operation.initialComponents()
                            this.operation.transitionManager.begin(`main`)
                        }
                        if(key==count.toString()){
                            this.tabs.editActive=1
                        }
                        count++
                        if(key==count.toString()){
                            this.operation.loadCol(`edit`)
                        }
                        count++
                    break
                    case 1:
                        if(key==`Enter`){
                            this.tabs.editActive=0
                        }
                        for(let a=0,la=types.team.length;a<la;a++){
                            if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                this.select.edit=a
                                this.tabs.editActive=0
                            }
                            count++
                        }
                    break
                }
            break
            case `ally`:
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }
            break
        }
    }
}