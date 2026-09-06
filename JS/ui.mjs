import {dev,types,options,constants,graphics,training} from './variables.mjs'
import {findName,last,distPos,randin,inPointBox,boxify,smoothAnim,floor,ceil,random,min,max,round,constrain,nameColor,even} from './functions.mjs'
import {lsin,lcos} from './graphics.mjs'
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
        this.hq={num:-1,baseNum:0,tick:0,interval:0,baseInterval:0,players:0,playerCities:0,active:false}
        this.raiders={active:types.city.some(cit=>cit.type==8),tick:floor(random(20*types.map[this.operation.map].constants.raid,80*types.map[this.operation.map].constants.raid+1))}
        this.releasing={team:0,value:0}
        this.graph={active:0}
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
        if(options.hq){
            this.hq.players=types.team.filter(team=>!team.auto).length
            this.hq.playerCities=types.city.filter(city=>!types.team[types.teamRef[city.rule]].auto).length
            this.hq.tick=max(this.turn.total+100,[1000,1000,800,700,650,600][min(5,this.hq.players)])
            this.hq.num=-2
        }
    }
    async loadMap(id,set){
        let root=INNER_INDEX?`../`:``
        if(id!=0){
            graphics.load.team[id]=[]
            set.forEach(async (team,index)=>graphics.load.team[id][index]=await new Promise((resolve)=>{loadImage(`${root}Assets/team/${team.term}.png`,img=>resolve(img))}))
        }
        graphics.load.map[id]=await new Promise((resolve)=>{loadImage(`${root}Assets/map/${types.map[id].term}.png`,img=>resolve(img))})
    }
    initial(){
        for(let a=0,la=20;a<la;a++){
            this.tabs.anim.push(0)
        }
        for(let a=0,la=4;a<la;a++){
            this.tabs.mapAnim.push(0)
        }
        for(let a=0,la=2;a<la;a++){
            this.tabs.editAnim.push(0)
        }
    }
    initialAgents(){
        if(dev.training){
            let build=agentset.map(set=>set.slice())
            this.rings=[]
            for(let a=0,la=types.teamType.length;a<la;a++){
                this.rings.push([])
                for(let b=0,lb=24;b<lb;b++){
                    if(dev.new||build[a].length==0){
                        this.rings[a].push(new agent())
                    }else{
                        let index=floor(random(0,build[a].length))
                        this.rings[a].push(new agent(...build[a][index]))
                        build[a].splice(index,1)
                    }
                }
            }
            build=agentset.map(set=>set.slice())
            this.static=[]
            for(let a=0,la=types.teamType.length;a<la;a++){
                this.static.push([])
                for(let b=0,lb=24;b<lb;b++){
                    if(build[a].length==0){
                        this.static[a].push(new agent())
                    }else{
                        let index=floor(random(0,build[a].length))
                        this.static[a].push(new agent(...build[a][index]))
                        build[a].splice(index,1)
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
    mergeAgents(agents,set){
        let rings=[]
        for(let a=0,la=types.teamType.length;a<la;a++){
            rings.push([])
            for(let b=0,lb=24;b<lb;b++){
                rings[a].push(new agent())
                for(let c=0,lc=agents.length;c<lc;c++){
                    rings[a][b].sets[set[c]]=agents[c][a][b].sets[set[c]]
                    rings[a][b].constants[set[c]]=agents[c][a][b].constants[set[c]]
                }
            }
        }
        let out=`export var agentset=[\n\t`
        rings.forEach(ring=>{
            out+=`[`
            ring.forEach(agent=>out+=`\n\t\t`+JSON.stringify([agent.sets,agent.constants],(key,val)=>{return typeof val==`number`?Number(val.toFixed(3)):val})+`,`)
            out+=`\n\t],`
        })
        out+=`\n]`
        return out
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
        this.hq={num:-1,tick:0,interval:0,players:0,playerCities:0}
        this.raiders={active:types.city.some(cit=>cit.type==8),tick:floor(random(20*types.map[this.operation.map].constants.raid,80*types.map[this.operation.map].constants.raid+1))}
        this.newTurn()
    }
    newTurn(turn=-1){
        if(dev.training&&this.turn.total!=0){
            if(this.turn.total%(training.turns*24*training.runs)==0){
                for(let a=0,la=this.rings.length;a<la;a++){
                    //print(types.team.some(team=>findName(types.team[a].type,types.teamType)==a))
                    if(types.team.some(team=>findName(team.type,types.teamType)==a)&&(training.grouping.length==0||training.grouping.includes(a))){
                        switch(training.benchmark){
                            case 0: case 1:
                                let maximal=this.rings[a].reduce((acc,agent)=>max(acc,agent.rewards),0)
                                this.rings[a].forEach(agent=>{agent.record+=agent.rewards/maximal*training.runs/10;agent.rewards=0})
                                maximal=this.rings[a].reduce((acc,agent)=>max(acc,agent.punishments),0)
                                this.rings[a].forEach(agent=>{agent.record-=agent.punishments/maximal*training.runs/10;agent.punishments=0})
                                this.rings[a].sort((a,b)=>a.record-b.record)
                                let failures=this.rings[a].splice(0,4)
                                let len=this.rings[a].length
                                let newer=this.turn.total<training.inserter&&training.specific==-1&&training.grouping.length==0
                                for(let b=0,lb=newer?3:4;b<lb;b++){
                                    let newSets
                                    let newConstants
                                    if(training.specific==-1){
                                        newSets=JSON.parse(JSON.stringify(this.rings[a][len-1-b].sets))
                                        newConstants=JSON.parse(JSON.stringify(this.rings[a][len-1-b].constants))
                                    }else{
                                        newSets=JSON.parse(JSON.stringify(failures[b].sets))
                                        newConstants=JSON.parse(JSON.stringify(failures[b].constants))
                                        newSets[training.specific]=JSON.parse(JSON.stringify(this.rings[a][len-1-b].sets[training.specific]))
                                        newConstants[training.specific]=JSON.parse(JSON.stringify(this.rings[a][len-1-b].constants[training.specific]))
                                    }
                                    this.rings[a].push(new agent(newSets,newConstants))
                                    last(this.rings[a]).mutate()
                                }
                                this.rings[a].forEach(agent=>agent.record=0)
                                if(newer){
                                    this.rings[a].push(new agent())
                                }
                                this.rings[a]=this.rings[a]
                                    .map(value=>({value,sort:random(0,1)}))
                                    .sort((a,b)=>a.sort-b.sort)
                                    .map(({value})=>value)
                            break
                            case 2:
                                let total=0
                                this.rings[a].forEach(agent=>total+=agent.record)
                                this.static[a].forEach(agent=>total-=agent.record)
                                if(!training.mass){
                                    console.log(`${types.teamType[a].name} Average Performance: ${round(total/this.rings[a].length/training.runs*1000)/1000}`)
                                }
                            break
                        }
                    }else{
                        this.rings[a].forEach(agent=>agent.record=0)
                    }
                }
                switch(training.benchmark){
                    case 0:
                        training.generations++
                    break
                    case 1:
                        training.benchmark=2
                        training.generations++
                    break
                    case 2:
                        let total=[0,0]
                        this.rings.forEach(set=>set.forEach(agent=>{total[0]+=agent.record;total[1]++}))
                        this.static.forEach(set=>set.forEach(agent=>{total[0]-=agent.record;agent.record=0}))
                        if(training.mass){
                            training.parentPort.postMessage({cmd:`performance`,status:`Total Average Performance: ${round(total[0]/total[1]/training.runs*1000)/1000}`})
                        }else{
                            console.log(`Total Average Performance: ${round(total[0]/total[1]/training.runs*1000)/1000}`)
                        }
                        training.benchmark=0
                    break
                }
            }
            if(this.turn.total%training.turns==0){
                this.agents.forEach((agent,index)=>{if(index<this.operation.teams.length){agent.record+=this.operation.cities.reduce((acc,city)=>acc+(city.owner==types.team[index].name?1:0)*types.cityType[city.data.type].value*(city.data.rule==types.team[index].name?1:1.125),0)-types.city.reduce((acc,city)=>acc+(city.rule==types.team[index].name?1:0)*types.cityType[city.type].value,0)}})
                //currently am offering a slight bonus to the bots if they choose to prioritize taking cities rather than not losing them
                //this code may not be valuable in the long run
                this.operation.initialElements()
                this.operation.initialComponents()
                this.agents=[]
                for(let a=0,la=types.team.length;a<la;a++){
                    if(training.benchmark==2&&floor(random(0,2))==0){
                        let type=findName(types.team[a].type,types.teamType)
                        this.agents.push(this.static[type][0])
                        this.static[type].push(this.static[type].shift())
                    }else{
                        let type=findName(types.team[a].type,types.teamType)
                        this.agents.push(this.rings[type][0])
                        this.rings[type].push(this.rings[type].shift())
                        if(this.turn.total%(training.turns*24)==0){
                            for(let b=0,lb=a;b<lb;b++){
                                this.rings[type].push(this.rings[type].shift())
                            }
                        }
                    }
                }
            }
            if(this.turn.total>=constants.threshold){
                let nums=[floor(process.uptime().toFixed(3)/3600),floor(process.uptime().toFixed(3)/60)%60,floor(process.uptime().toFixed(3))%60]
                if(training.mass){
                    training.parentPort.postMessage({cmd:`time`,status:`\nTime at ${constants.threshold} Turns: ${nums[0]<10?`0`:``}${nums[0]}:${nums[1]<10?`0`:``}${nums[1]}:${nums[2]<10?`0`:``}${nums[2]}`})
                }else{
                    console.log(`\nTime at ${constants.threshold} Turns: ${nums[0]<10?`0`:``}${nums[0]}:${nums[1]<10?`0`:``}${nums[1]}:${nums[2]<10?`0`:``}${nums[2]}`)
                }
                constants.threshold*=constants.thresholdTick%3==2?2.5:2
                constants.thresholdTick++
                if(training.benchmark==0){
                    training.benchmark=1
                }
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
        if(!dev.close&&this.turn.total%10==0){
            this.operation.teams.forEach(team=>{team.history.units.push(0);team.history.cities.push(0)})
            this.operation.cities.forEach(city=>{
                if(types.teamRef[city.owner]>=0){this.operation.teams[types.teamRef[city.owner]].history.cities[this.operation.teams[types.teamRef[city.owner]].history.cities.length-1]++};
                city.units.forEach(unit=>this.operation.teams[unit.team].history.units[this.operation.teams[unit.team].history.units.length-1]+=unit.value)
            })
        }
        if(options.respawn&&this.turn.total%5==0){
            this.operation.teams.forEach(team=>{
                let aligned=[team.type,...team.allies]
                if(!this.operation.cities.some(city=>city.getUnits([team.type]).length>0)&&!team.cores.some(city=>city.owner==team.name||city.getUnits(aligned).length>0)&&!types.teamKey[0].includes(team.name)&&!types.teamKey[1].includes(team.name)&&team.name!=`Free Company`){
                    let total=0
                    team.cores.forEach(core=>{
                        total++
                        let adj=this.operation.cities[types.cityRef[randin(types.city[core.type].connect).name]].owner
                        let set=this.operation.cities.filter(cit=>cit.owner!=-1)
                        core.modifCore(core.owner==-1?(adj==-1?(set.length==0?randin(this.operation.teams).name:randin(set).owner):adj):core.owner)
                    })
                    team.cores=[]
                    total=max(total,1)
                    let cits=[]
                    let cit=randin(this.operation.cities)
                    for(let a=0,la=total;a<la;a++){
                        cit.editCore(team.name)
                        cits.push(cit)
                        cit.units.forEach(unit=>unit.team=team.type)
                        let conn=types.city[cit.type].connect.filter(connect=>!cits.some(cit2=>connect.name==cit2.name))
                        if(conn.length==0){
                            break
                        }
                        cit=this.operation.cities[types.cityRef[randin(conn).name]]
                    }
                }
            })
        }
        if(options.hq){
            if(this.hq.num==-1){
                this.hq.players=types.team.filter(team=>!team.auto).length
                this.hq.playerCities=types.city.filter(city=>!types.team[types.teamRef[city.rule]].auto).length
                this.hq.tick=[1000,1000,800,700,650,600][min(5,this.hq.players)]
                this.hq.num=-2
            }
            if(this.hq.active){
                for(let a=0,la=this.operation.teams.length;a<la;a++){
                    if(types.team[a].auto&&a!=la-1){
                        if(this.operation.teams[a].allies.some(ally=>!types.team[ally].auto)){
                            if(this.operation.teams[a].allies.includes(types.team.length-1)){
                                this.operation.teams[a].removeAlly(this.operation.teams[types.team.length-1])
                            }
                        }else{
                            if(!this.operation.teams[a].allies.includes(types.team.length-1)){
                                this.operation.teams[a].addAlly(this.operation.teams[types.team.length-1])
                            }
                        }
                    }
                }
            }
        }
        if(options.hq&&this.turn.total>=this.hq.tick&&this.hq.num!=0){
            if(this.hq.num<0){
                this.operation.addTeam({name:types.map[this.operation.map].hq[0],term:types.map[this.operation.map].hq[1],type:`Headquarters`,allies:[],quality:1,chance:1.5+this.hq.players*0.5})
                let type=types.teamType.length-1
                if(dev.new||agentset[type].length==0){
                    this.agents.push(new agent())
                }else{
                    let index=floor(random(0,agentset[type].length))
                    this.agents.push(new agent(...agentset[type][index]))
                    agentset[type].splice(index,1)
                }
                this.hq.interval=this.hq.players==0?25:max(10,[50,35,30,25,20][min(4,this.hq.players-1)]-5*round(max(1,2-(this.hq.players-1)*0.375)*this.hq.playerCities/this.hq.players/4))
                this.hq.baseInterval=this.hq.interval
                this.hq.num=this.hq.players==0?50:this.hq.players+this.hq.playerCities
                this.hq.baseNum=this.hq.num
                this.hq.active=true
                for(let a=0,la=this.operation.teams.length;a<la;a++){
                    if(types.team[a].auto&&a!=la-1){
                        if(this.operation.teams[a].allies.some(ally=>!types.team[ally].auto)){
                            if(this.operation.teams[a].allies.includes(types.team.length-1)){
                                this.operation.teams[a].removeAlly(this.operation.teams[types.team.length-1])
                            }
                        }else{
                            if(!this.operation.teams[a].allies.includes(types.team.length-1)){
                                this.operation.teams[a].addAlly(this.operation.teams[types.team.length-1])
                            }
                        }
                    }
                }
            }
            this.turn.main=types.team.length-1
            if(this.hq.num>0){
                this.hq.num--
                this.hq.tick+=round(this.hq.interval)
                this.hq.interval+=this.hq.baseInterval/this.hq.baseNum
            }
            for(let a=0,la=this.operation.cities.length;a<la;a++){
                if(types.city[a].type==3){
                    let cit=this.operation.cities[a]
                    let num=12000*options.strength
                    this.instantArmy(cit,this.turn.main,num)
                    break
                }
            }
            let len=this.operation.cities.filter(city=>{return city.owner==types.team[this.turn.main].name}).length*(types.team[this.turn.main].name==`Ecclesiastical`?0.75:1)
            this.turn.count=types.teamKey[0].includes(types.team[this.turn.main].name)?floor(random(0.5,3+this.hq.playerCities/this.hq.players*0.5)):
                types.teamKey[1].includes(types.team[this.turn.main].name)?floor(random(0.5,3.5)):                
                len==0?0:
                floor(random(0.5,len*0.25+2.5))
            this.operation.cities.forEach(city=>city.newTurnTick())
        }else if(this.raiders.active&&this.turn.total>=this.raiders.tick){
            this.raiders.tick+=floor(random(40*types.map[this.operation.map].constants.raid,160*types.map[this.operation.map].constants.raid+1))
            this.turn.main=types.team.findIndex(team=>types.teamKey[1].includes(team.name))
            if(this.hq.num>0){
                this.hq.num--
                this.hq.tick+=round(this.hq.interval)
                this.hq.interval+=this.hq.baseInterval/this.hq.baseNum
            }
            let cit=randin(this.operation.cities.filter(cit=>cit.data.type==8))
            let num=round(floor(random(20,101))*options.strength)*constants.unit
            this.instantArmy(cit,this.turn.main,num)
            let len=this.operation.cities.filter(city=>{return city.owner==types.team[this.turn.main].name}).length*(types.team[this.turn.main].name==`Ecclesiastical`?0.75:1)
            this.turn.count=types.teamKey[0].includes(types.team[this.turn.main].name)?floor(random(0.5,3+this.hq.playerCities/this.hq.players*0.5)):
                types.teamKey[1].includes(types.team[this.turn.main].name)?floor(random(0.5,3.5)):                
                len==0?0:
                floor(random(0.5,len*0.25+2.5))
            this.operation.cities.forEach(city=>city.newTurnTick())
        }else if(this.turn.count>0){
            this.turn.count--
            this.moveTab(0)
            this.updateVisibility()
            this.turn.pinned=false
        }else{
            this.turn.main=turn==-1?this.pickTurn():turn
            let len=this.operation.cities.filter(city=>{return city.owner==types.team[this.turn.main].name}).length*(types.team[this.turn.main].name==`Ecclesiastical`?0.75:1)
            this.turn.count=types.teamKey[0].includes(types.team[this.turn.main].name)?floor(random(0.5,3+this.hq.playerCities/this.hq.players)):
                types.teamKey[1].includes(types.team[this.turn.main].name)?floor(random(0.5,3.5)):                
                len==0?0:
                floor(random(0.5,len*0.25+2.5))
            this.operation.cities.forEach(city=>city.visibility=0)
            this.moveTab(5)
            if(types.team[this.turn.main].auto&&!types.teamKey[0].includes(types.team[this.turn.main].name)&&!types.teamKey[1].includes(types.team[this.turn.main].name)){
                if(random(0,types.team[this.turn.main].chance*(types.team[this.turn.main].name==`Free Company`?2:4))<1){
                    this.updateVisibility()
                    this.moveTab(4)
                }else if(random(0,types.team[this.turn.main].chance*(types.team[this.turn.main].name==`Free Company`?4:10))<1){
                    this.updateVisibility()
                    this.moveTab(18)
                }
            }else{
                if(!dev.close){
                    let total=[0,0,0]
                    this.operation.cities.forEach(city=>{if(city.data.rule==types.team[this.turn.main].name){total[0]+=city.position.x;total[1]+=city.position.y;total[2]++}})
                    if(total[2]<=0){
                        this.operation.cities.forEach(city=>{if(city.units.some(unit=>unit.team==this.turn.main)){total[0]+=city.position.x;total[1]+=city.position.y;total[2]++}})
                    }
                    if(total[2]>0){
                        this.operation.zoom.shift.position.x=total[0]/total[2]*options.scale
                        this.operation.zoom.shift.position.y=total[1]/total[2]*options.scale
                        this.operation.zoom.shift.active=true
                    }else if(constants.rebel){
                        this.operation.cities.forEach(city=>{if(city.data.rebel==types.team[this.turn.main].name){total[0]+=city.position.x;total[1]+=city.position.y;total[2]++}})
                        if(total[2]>0){
                            this.operation.zoom.shift.position.x=total[0]/total[2]*options.scale
                            this.operation.zoom.shift.position.y=total[1]/total[2]*options.scale
                            this.operation.zoom.shift.active=true
                        }
                    }
                }
            }
            this.operation.cities.forEach(city=>city.newTurnTick())
            this.turn.pinned=false
        }
        this.turn.total++
        this.turn.timer=0
        this.turn.locked=false
        this.agency.count++
        this.agency.reorg=false
        this.operation.cities.forEach(city=>city.newTurn())
        if(this.turn.total!=1){
            this.updateUnits()
        }
    }
    pickTurn(){
        let total=0
        types.team.forEach((team,index)=>{if(index!=this.turn.main){total+=team.auto?team.chance:max(team.chance,1.5)}})
        let roll=random(0,total)
        let ticker=0
        while(roll>=(types.team[ticker].auto?types.team[ticker].chance:max(types.team[ticker].chance,1.5))||ticker==this.turn.main){
            if(ticker!=this.turn.main){
                roll-=(types.team[ticker].auto?types.team[ticker].chance:max(types.team[ticker].chance,1.5))
            }
            ticker++
        }
        if(!constants.rebel&&!this.operation.cities.some(city=>
            city.ruleIndex==ticker||
            city.units.some(unit=>unit.team==ticker&&(unit.type==0||!types.teamKey[0].includes(types.team[ticker].name)||!types.teamKey[1].includes(types.team[ticker].name)))
        )){
            ticker=this.pickTurn()
        }
        return ticker
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
                    this.operation.teams[this.battle.result.casualties[1-a][c].team].kills+=round(this.battle.result.casualties[a][b].number*this.battle.result.casualties[1-a][c].base/totals[1-a]/constants.unit+random(-0.5,0.5))*constants.unit
                }
                this.operation.teams[this.battle.result.casualties[a][b].team].deaths+=this.battle.result.casualties[a][b].number
                if(this.battle.circumstance[0]==0&&this.battle.circumstance[1]==0&&last(this.battle.result.winner)==2-a){
                    let num=round(this.battle.result.casualties[a][b].number*random(10,30))/constants.unit
                    if(num>0){
                        for(let c=0,lc=this.battle.result.casualties[1-a].length;c<lc;c++){
                            this.operation.teams[this.battle.result.casualties[1-a][c].team].prisoners[this.battle.result.casualties[a][b].team]+=round(num*this.battle.result.casualties[1-a][c].base/totals[1-a]/constants.unit+random(-0.5,0.5))*constants.unit
                        }
                    }
                }
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
                            this.operation.teams[this.battle.result.casualties[0][c].team].kills+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/constants.unit+random(-0.5,0.5))*constants.unit
                            this.operation.teams[this.battle.result.casualties[0][c].team].prisoners[unit.team]+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/constants.unit+random(-0.5,0.5))*constants.unit
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
                            this.operation.teams[this.battle.result.casualties[0][c].team].kills+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/constants.unit+random(-0.5,0.5))*constants.unit
                            this.operation.teams[this.battle.result.casualties[0][c].team].prisoners[unit.team]+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/constants.unit+random(-0.5,0.5))*constants.unit
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
                            this.operation.teams[this.battle.result.casualties[0][c].team].kills+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/constants.unit+random(-0.5,0.5))*constants.unit
                            this.operation.teams[this.battle.result.casualties[0][c].team].prisoners[unit.team]+=round(unit.value*this.battle.result.casualties[0][c].base/totals[0]/constants.unit+random(-0.5,0.5))*constants.unit
                        }
                    })
                }
                this.turn.timer=15
            }
        }
        if(this.tabs.active==7&&this.turn.main==0){
            throw new Error(`Acceptance Stuck: ${this.battle.circumstance}`)
        }
        cit.updateUnits()
    }
    cityClick(layer,mouse,scene,city,bypass){
        switch(scene){
            case `title`: case `setup`: case `main`:
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                let playing=this.turn.main
                if(dev.close||mouse.position.x<layer.width-this.width&&!this.select.trigger){
                    if(this.tabs.active==7&&types.city[this.select.city].connect.some(connection=>{return connection.name==types.city[city].name})){
                        if(!types.team[this.turn.main].auto||bypass){
                            let exists=this.operation.cities[city].getUnits(aligned,0).length>0
                            this.select.moved=[]
                            this.select.targetCity=city
                            if(!dev.close){
                                this.operation.zoom.shift.position.x=types.city[city].loc[0]*options.scale
                                this.operation.zoom.shift.position.y=types.city[city].loc[1]*options.scale
                                this.operation.zoom.shift.active=true
                            }
                            let leave=false
                            for(let a=0,la=this.operation.cities[this.select.city].units.length;a<la;a++){
                                let base=this.operation.cities[this.select.city].units[a]
                                if(base.edit.num>0){
                                    let move=min(base.value,base.edit.num)
                                    base.value-=move
                                    this.operation.cities[city].units.push(new unit(this.operation.cities[city],base.team,0,move))
                                    last(this.operation.cities[city].units).target=base.target
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
                                if(types.team[this.turn.main].auto){
                                    this.singleVisibility(this.select.targetCity)
                                }
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
                                    this.operation.calc.sides[1].salient=1
                                    this.battle.result=this.operation.calc.calc()
                                    this.operation.calc.reset()
                                    this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/constants.unit+random(-0.5,0.5))*constants.unit))
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
                        }
                    }else if((this.tabs.active==12||this.tabs.active==17)&&types.city[this.select.targetCity].connect.some(connection=>{return connection.name==types.city[city].name})){
                        playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                        if(!types.team[playing].auto||bypass){
                            this.select.secondaryCity=city
                            if(!dev.close){
                                this.operation.zoom.shift.position.x=types.city[city].loc[0]*options.scale
                                this.operation.zoom.shift.position.y=types.city[city].loc[1]*options.scale
                                this.operation.zoom.shift.active=true
                            }
                            let set=this.operation.cities[this.select.targetCity].getNotUnits(aligned)
                            for(let a=0,la=set.length;a<la;a++){
                                let enemy=this.operation.cities[city].getNotUnits([set[a].team,...this.operation.teams[set[a].team].allies])
                                let totalEnemy=enemy.reduce((acc,enemy)=>acc+enemy.value,0)
                                if(enemy.length>0){
                                    set[a].removeMark=true
                                    enemy.forEach(enemy=>{
                                        this.operation.teams[enemy.team].prisoners[set[a].team]+=round(set[a].value*enemy.value/totalEnemy/constants.unit+random(-0.5,0.5))*constants.unit
                                    })
                                }
                            }
                            for(let a=0,la=set.length;a<la;a++){
                                let base=set[a]
                                let mult=1
                                for(let b=0,lb=types.city[this.select.city].connect.length;b<lb;b++){
                                    if(types.city[this.select.city].connect[b].name==types.city[city].name){
                                        switch(types.city[this.select.city].connect[b].type){
                                            case 1:
                                                mult*=0.95
                                            break
                                            case 2:
                                                mult*=0.75
                                            break
                                        }
                                    }
                                }
                                let value=ceil(base.value/constants.unit*mult)*constants.unit
                                this.operation.cities[city].units.push(new unit(this.operation.cities[city],base.team,0,value))
                                last(this.operation.cities[city].units).target=base.target
                                last(this.operation.cities[city].units).position.x=this.operation.cities[this.select.targetCity].position.x-this.operation.cities[city].position.x+base.position.x
                                last(this.operation.cities[city].units).position.y=this.operation.cities[this.select.targetCity].position.y-this.operation.cities[city].position.y+base.position.y
                                last(this.operation.cities[city].units).fade.main=1-base.type
                                last(this.operation.cities[city].units).tempVisible=true
                                last(this.operation.cities[city].units).removeMark=base.removeMark
                                if(base.type==0){
                                    this.operation.cities[this.select.targetCity].units.splice(this.operation.cities[this.select.targetCity].units.indexOf(base),1)
                                    set.splice(a,1)
                                    a--
                                    la--
                                }else{
                                    base.remove=true
                                }
                            }
                            this.turn.timer=30
                            this.operation.cities[this.select.targetCity].updateUnits()
                            this.operation.cities[this.select.secondaryCity].updateUnits()
                            this.updateVisibility()
                        }
                    }else if(this.tabs.active==13&&types.city[this.select.city].connect.some(connection=>{return connection.name==types.city[city].name})){
                        playing=this.operation.cities[this.select.city].getMostNotUnit(aligned)
                        if(!types.team[playing].auto||bypass){
                            this.select.targetCity=city
                            if(!dev.close){
                                this.operation.zoom.shift.position.x=types.city[city].loc[0]*options.scale
                                this.operation.zoom.shift.position.y=types.city[city].loc[1]*options.scale
                                this.operation.zoom.shift.active=true
                            }
                            let set=this.operation.cities[this.select.city].getNotUnits(aligned)
                            for(let a=0,la=set.length;a<la;a++){
                                let enemy=this.operation.cities[city].getNotUnits([set[a].team,...this.operation.teams[set[a].team].allies])
                                let totalEnemy=enemy.reduce((acc,enemy)=>acc+enemy.value,0)
                                if(enemy.length>0){
                                    set[a].removeMark=true
                                    enemy.forEach(enemy=>{
                                        this.operation.teams[enemy.team].prisoners[set[a].team]+=round(set[a].value*enemy.value/totalEnemy/constants.unit+random(-0.5,0.5))*constants.unit
                                    })
                                }
                            }
                            for(let a=0,la=set.length;a<la;a++){
                                let base=set[a]
                                let mult=1
                                for(let b=0,lb=types.city[this.select.city].connect.length;b<lb;b++){
                                    if(types.city[this.select.city].connect[b].name==types.city[city].name){
                                        switch(types.city[this.select.city].connect[b].type){
                                            case 1:
                                                mult*=0.95
                                            break
                                            case 2:
                                                mult*=0.75
                                            break
                                        }
                                    }
                                }
                                let value=ceil(base.value/constants.unit*mult)*constants.unit
                                this.operation.cities[city].units.push(new unit(this.operation.cities[city],base.team,0,value))
                                last(this.operation.cities[city].units).target=base.target
                                last(this.operation.cities[city].units).position.x=this.operation.cities[this.select.city].position.x-this.operation.cities[city].position.x+base.position.x
                                last(this.operation.cities[city].units).position.y=this.operation.cities[this.select.city].position.y-this.operation.cities[city].position.y+base.position.y
                                last(this.operation.cities[city].units).fade.main=1-base.type
                                last(this.operation.cities[city].units).tempVisible=true
                                last(this.operation.cities[city].units).removeMark=base.removeMark
                                if(base.type==0){
                                    this.operation.cities[this.select.city].units.splice(this.operation.cities[this.select.city].units.indexOf(base),1)
                                    a--
                                    la--
                                }else{
                                    base.remove=true
                                }
                            }
                            this.turn.timer=30
                            this.operation.cities[this.select.city].updateUnits()
                            this.operation.cities[this.select.targetCity].updateUnits()
                            this.updateVisibility()
                        }
                    }else if(this.tabs.active==15){
                        if(!types.team[this.turn.main].auto||bypass){
                            this.select.city=city
                            let cit=this.operation.cities[this.select.city]
                            let turn=this.turn.main
                            if(cit.data.type!=7&&cit.data.type!=10&&cit.getSpawn(3,turn)>0){
                                if(!dev.close){
                                    this.operation.zoom.shift.position.x=cit.position.x*options.scale
                                    this.operation.zoom.shift.position.y=cit.position.y*options.scale
                                    this.operation.zoom.shift.active=true
                                }
                                this.turn.pinned=true
                                this.moveTab(8)
                                if(types.team[this.turn.main].auto){
                                    this.singleVisibility(this.select.city)
                                }
                                this.battle.circumstance=[2]
                                this.select.targetCity=this.select.city
                                if(cit.getNotUnits([turn,...this.operation.teams[turn].allies]).length<=0){
                                    cit.spawn(3,this.turn.main)
                                    this.newTurn()
                                }else if(cit.getUnits([turn,...this.operation.teams[turn].allies],0).length>0){
                                    cit.spawn(3,this.turn.main)
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
                                    cit.spawn(3,this.turn.main)
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
                                    this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/constants.unit+random(-0.5,0.5))*constants.unit))
                                    this.battle.circumstance[1]=0
                                }else{
                                    cit.spawn(3,this.turn.main)
                                    this.select.moved=[last(cit.units)]
                                }
                            }
                            if(!types.team[this.turn.main].auto){
                                this.updateVisibility()
                            }
                        }
                    }else if(this.tabs.active==19){
                        let enemy=this.operation.cities[city].units.filter(unit=>!aligned.includes(unit.team)&&unit.team!=this.releasing.team&&!this.operation.teams[this.releasing.team].allies.includes(unit.team))
                        let totalEnemy=enemy.reduce((acc,enemy)=>acc+enemy.value,0)
                        if(enemy.length>0){
                            enemy.forEach(enemy=>{
                                this.operation.teams[types.teamRef[this.operation.cities[city].owner]].prisoners[this.releasing.team]+=round(this.releasing.value*enemy.value/totalEnemy/constants.unit+random(-0.5,0.5))*constants.unit
                            })
                        }else{
                            this.operation.cities[city].summonUnit(this.releasing.team,0,this.releasing.value)
                        }
                        this.operation.teams[this.turn.main].prisoners[this.releasing.team]=0
                        this.moveTab(18)
                    }else if(!this.turn.locked&&!this.turn.pinned&&!(this.tabs.active==1&&this.select.city==city)){
                        if(this.tabs.active==5){
                            this.updateVisibility()
                        }
                        this.moveTab(1)
                        this.select.city=city
                        if(!dev.close){
                            this.operation.zoom.shift.position.x=types.city[city].loc[0]*options.scale
                            this.operation.zoom.shift.position.y=types.city[city].loc[1]*options.scale
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
        if(
            cit.data.rule==types.team[turn].name||
            constants.rebel&&cit.data.rebel==types.team[turn].name
        ){
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
        let aligned=[turn,...this.operation.teams[turn].allies]
        if(
            cit.owner==types.team[turn].name&&cit.getNotUnits(aligned).length<=0&&(cit.data.type==5||cit.data.type==10)&&
            types.team[turn].auto&&cit.getSpawn(4,types.teamRef[`Free Company`])>cit.getSpawn(this.spawnVariant(cit,turn),turn)&&
            !types.teamKey[1].includes(types.team[turn].name)
        ){
            cit.spawn(4,this.turn.main)
            cit.updateUnits()
            this.turn.timer=30
            if(!this.operation.teams[types.teamRef[`Free Company`]].allies.includes(turn)&&this.operation.teams[turn].name!=`Free Company`){
                this.operation.teams[types.teamRef[`Free Company`]].addAlly(this.operation.teams[turn])
            }
            return true
        }else if(cit.data.type!=7&&cit.data.type!=10){
            if(
                cit.data.rule==types.team[turn].name||
                constants.rebel&&cit.data.rebel==types.team[turn].name
            ){
                if(cit.getNotUnits(aligned).length<=0){
                    if(cit.getSpawn(0,turn)>0){
                        cit.spawn(0,turn)
                        cit.updateUnits()
                        this.turn.timer=30
                        return true
                    }
                }else{
                    if(cit.getSpawn(1,turn)>0){
                        this.turn.pinned=true
                        this.moveTab(8)
                        if(types.team[this.turn.main].auto){
                            this.singleVisibility(this.select.city)
                        }
                        this.battle.circumstance=[2]
                        this.select.targetCity=this.select.city
                        if(cit.getUnits([turn,...this.operation.teams[turn].allies],0).length>0){
                            cit.spawn(1,turn)
                            cit.updateUnits()
                            this.select.moved=[last(cit.units)]
                            this.moveTab(10)
                            this.battle.circumstance[1]=1
                            let rule=this.operation.cities[this.select.targetCity].ruleIndex
                            if(rule!=turn&&!this.operation.teams[turn].allies.includes(rule)){
                                this.operation.cities[this.select.targetCity].raided(turn)
                            }
                            this.agency.time=0
                        }else if(cit.getUnits([turn,...this.operation.teams[turn].allies],1).length>0){
                            cit.spawn(1,turn)
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
                            this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/constants.unit+random(-0.5,0.5))*constants.unit))
                            this.battle.circumstance[1]=0
                        }else{
                            cit.spawn(1,turn)
                            this.select.moved=[last(cit.units)]
                        }
                        return true
                    }
                }
            }else if(cit.owner==types.team[turn].name){
                if(cit.getNotUnits(aligned).length<=0){
                    if(cit.getSpawn(2,turn)>0){
                        cit.spawn(2,turn)
                        cit.updateUnits()
                        this.turn.timer=30
                        return true
                    }
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
    initializeCombat(type,args){
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
                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/constants.unit+random(-0.5,0.5))*constants.unit))
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
                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/constants.unit+random(-0.5,0.5))*constants.unit))
            break
            case 2:
                this.turn.pinned=true
                this.moveTab(9)
                this.select.battleCity=this.select.city
                let cit=this.operation.cities[this.select.city]
                cit.sieged+=2
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
                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/constants.unit+random(-0.5,0.5))*constants.unit))
                this.battle.circumstance=[1,cit.getUnits([this.turn.main],1).length>0?1:0]
            break
        }
    }
    instantArmy(cit,turn,num){
        let aligned=[turn,...this.operation.teams[turn].allies]
        if(cit.getNotUnits(aligned).length<=0){
            this.turn.pinned=false
            this.moveTab(5)
            cit.summonUnit(turn,0,num)
            this.operation.cities.forEach(city=>city.visibility=0)
        }else{
            this.turn.pinned=true
            this.moveTab(8)
            if(types.team[this.turn.main].auto){
                this.singleVisibility(this.select.city)
            }
            this.battle.circumstance=[2]
            this.select.city=cit.type
            this.select.targetCity=cit.type
            if(cit.getUnits(aligned,0).length>0){
                cit.summonUnit(turn,0,num)
                cit.updateUnits()
                this.select.moved=[]
                this.moveTab(10)
                this.battle.circumstance[1]=1
                let rule=this.operation.cities[this.select.targetCity].ruleIndex
                if(rule!=turn&&!this.operation.teams[turn].allies.includes(rule)){
                    this.operation.cities[this.select.targetCity].raided(turn)
                }
                this.agency.time=0
            }else if(cit.getUnits(aligned,1).length>0){
                cit.summonUnit(turn,0,num)
                cit.updateUnits()
                this.select.moved=[]
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
                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/constants.unit+random(-0.5,0.5))*constants.unit))
                this.battle.circumstance[1]=0
            }else{
                cit.summonUnit(turn,0,num)
                cit.updateUnits()
                this.select.moved=[]
            }
            this.updateVisibility()
        }
        this.operation.zoom.shift.position.x=cit.position.x*options.scale
        this.operation.zoom.shift.position.y=cit.position.y*options.scale
        this.operation.zoom.shift.active=true
    }
    updateVisibility(){
        this.operation.cities.forEach(city=>city.updateVisibility(this.turn.main))
    }
    singleVisibility(type){
        this.operation.cities.forEach(city=>city.singleVisibility(type))
    }
    updateUnits(){
        this.operation.cities.forEach(city=>city.updateUnits())
    }
    updateSiege(){
        this.operation.cities.forEach(city=>city.updateSiege())
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
                layer.rect(0,560,360,90+groups.length*60,20)
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
                    layer.rect(0,a*60+610-la*30,300,50,10)
                    if(groups[a].length>1){
                        layer.fill(100)
                        for(let b=0,lb=groups[a].length-1;b<lb;b++){
                            layer.rect((b+1)/(lb+1)*300-150,a*60+610-la*30,3,50)
                        }
                    }
                    layer.fill(0)
                    layer.textSize(20)
                    layer.text(types.map[groups[a][0]].name[0],0,a*60+610-la*30)
                    for(let b=0,lb=groups[a].length;b<lb;b++){
                        layer.textSize(10)
                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count],(b+1)/lb*300-150-20,a*60+595-la*30)
                        layer.textSize(12)
                        if(types.map[groups[a][b]].name.length>=2){
                            layer.text(types.map[groups[a][b]].name[1],(b+0.5)/lb*300-150,a*60+628-la*30)
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
                    let name=types.map[this.operation.nextMap].name[1]==`Randomized`?types.holdTeam[a].name:types.map[this.operation.nextMap].team[a].name
                    layer.textSize(name.length>25?18:20)
                    layer.text(name,-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+445)
                    layer.textSize(10)
                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[a],100-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+430)
                }
                layer.fill(120)
                layer.rect(-250,rows*30+475,240,50,10)
                layer.rect(0,rows*30+475,240,50,10)
                layer.rect(-125,rows*30+535,240,50,10)
                layer.rect(125,rows*30+535,240,50,10)
                layer.fill(120,options.hq?200:120,120)
                layer.rect(250,rows*30+475,240,50,10)
                layer.fill(100)
                layer.rect(0,rows*30+475,3,50)
                layer.fill(0)
                layer.rect(-95,rows*30+475,18,2.4)
                layer.rect(95,rows*30+475,18,2.4)
                layer.rect(95,rows*30+475,2.4,18)
                layer.textSize(20)
                layer.text(`Select Random`,-250,rows*30+475)
                layer.text(`Difficulty: ${options.strength}`,0,rows*30+475)
                layer.text(`Headquarters Mode`,250,rows*30+475)
                layer.text(`Begin`,-125,rows*30+535)
                layer.text(`Edit Map`,125,rows*30+535)
                layer.textSize(10)
                layer.text(`@`,-150,rows*30+460)
                layer.text(`#`,350,rows*30+460)
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
                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[a],100-125*(min(set,la-floor(a/set)*set)-1)+250*(a%set),floor(a/set)*60-rows*30+460)
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
                                layer.textSize(types.team[this.turn.main].name.length>25?16:types.team[this.turn.main].name.length>20?20:24)
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
                                layer.textSize(cit.data.name.length>20?20:24)
                                layer.text(`Selected City:\n${cit.data.name}`,0,40)

                                layer.textSize(cit.owner!=-1&&cit.owner.length>20?14:cit.owner!=-1&&cit.owner.length>16?16:18)
                                layer.text(`Owner: ${cit.owner==-1?`None`:cit.owner}`,0,tick+12.5)
                                tick+=25
                                if(
                                    cit.getUnits([this.turn.main]).length>0||
                                    cit.data.rule==types.team[this.turn.main].name||
                                    constants.rebel&&cit.data.rebel==types.team[this.turn.main].name
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
                                    if(
                                        cit.data.rule==types.team[this.turn.main].name||
                                        constants.rebel&&cit.data.rebel==types.team[this.turn.main].name
                                    ){
                                        layer.fill(120)
                                        layer.rect(0,tick+25,160,40,10)
                                        layer.fill(0)
                                        layer.textSize(15)
                                        layer.text(cit.getNotUnits(aligned).length>0?`Rebel With ${cit.getSpawn(1,this.turn.main)} Troops`:`Recruit ${cit.getSpawn(0,this.turn.main)} Troops`,0,tick+25)
                                        layer.textSize(10)
                                        layer.text(count,70,tick+15)
                                        tick+=50
                                        count++
                                    }else if(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0){
                                        layer.fill(120)
                                        layer.rect(0,tick+25,160,40,10)
                                        layer.fill(0)
                                        layer.textSize(15)
                                        layer.text(`Recruit ${cit.getSpawn(2,this.turn.main)} Troops`,0,tick+25)
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
                                    layer.text(`Hire ${cit.getSpawn(4,types.teamRef[`Free Company`])} Mercenaries`,0,tick+25)
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
                                    //layer.text(`${cit.units[a].value} ${[`Army`,`Garrison`][cit.units[a].type]}\n${types.team[cit.units[a].team].name}`,0,tick+25)
                                    layer.text(`${cit.units[a].value} ${[`Army`,`Garrison`][cit.units[a].type]}`,0,tick+16)
                                    layer.textSize(types.team[cit.units[a].team].name.length>25?12:15)
                                    layer.text(`${types.team[cit.units[a].team].name}`,0,tick+34)
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
                                layer.textSize(types.team[this.turn.main].name.length>25?16:types.team[this.turn.main].name.length>20?20:24)
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
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1],70,tick+10)
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
                                for(let a=0,la=3;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Battle`,`Siege`,`Retreat`][a],0,tick+25)
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
                                        layer.textSize(types.team[result.team].name.length>25?15:18)
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
                                    if(a!=this.turn.main){
                                        layer.fill(120)
                                        layer.rect(0,tick+12.5,160,25,10)
                                        layer.fill(0)
                                        layer.textSize(12)
                                        layer.text(`Delegate: ${types.team[a].name}`,0,tick+12.5)
                                        layer.textSize(10)
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count],70,tick+10)
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
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1],70,tick+10)
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
                                            layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1],70,tick+10)
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
                                if(options.hq){
                                    layer.textSize(15)
                                    layer.text(this.hq.num==0?`Headquarters Complete`:`Headquarters: Turn ${this.hq.tick}`,0,tick+7.5)
                                    tick+=25
                                }
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Exit`,0,tick+25)
                                layer.textSize(10)
                                layer.text(`Enter`,60,tick+15)
                                tick+=50
                                for(let a=0,la=7;a<la;a++){
                                    layer.fill(120,a==0&&options.core?200:120,120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`View Cores`,`Settings`,`Stats`,`Records`,`Graph`,`Save`,`Load`][a],0,tick+25)
                                    layer.textSize(10)
                                    layer.text(count,70,tick+15)
                                    tick+=50
                                    count++
                                }
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
                                    let img=[graphics.load.team[this.operation.map][types.team[a].loadIndex],graphics.load.unit[2]]
                                    layer.image(img[0],-64,tick+12.5,img[1].width*0.15,img[1].height*0.15)
                                    layer.image(img[1],-64,tick+12.5,img[1].width*0.15,img[1].height*0.15)
                                    tick+=30
                                    count++
                                }
                            break
                            case 2:
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
                                layer.text(`Edit Player`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                                layer.fill(120,options.respawn?200:120,120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(0)
                                layer.textSize(15)
                                layer.text(`Respawn Mode`,0,tick+25)
                                layer.textSize(10)
                                layer.text(count,70,tick+15)
                                tick+=50
                                count++
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(100)
                                layer.rect(0,tick+25,3,40)
                                layer.fill(0)
                                layer.rect(-55,tick+25,18,2.4)
                                layer.rect(55,tick+25,18,2.4)
                                layer.rect(55,tick+25,2.4,18)
                                layer.textSize(15)
                                layer.text(`Difficulty: ${options.strength}`,0,tick+25)
                                tick+=50
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(100)
                                layer.rect(0,tick+25,3,40)
                                layer.fill(0)
                                layer.rect(-55,tick+25,18,2.4)
                                layer.rect(55,tick+25,18,2.4)
                                layer.rect(55,tick+25,2.4,18)
                                layer.textSize(15)
                                layer.text(`Unit Size: ${options.unitSize}`,0,tick+25)
                                tick+=50
                                layer.fill(120)
                                layer.rect(0,tick+25,160,40,10)
                                layer.fill(100)
                                layer.rect(0,tick+25,3,40)
                                layer.fill(0)
                                layer.rect(-55,tick+25,18,2.4)
                                layer.rect(55,tick+25,18,2.4)
                                layer.rect(55,tick+25,2.4,18)
                                layer.textSize(15)
                                layer.text(`Map Size: ${options.scale}`,0,tick+25)
                                tick+=50
                            break
                            case 3:
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
                                for(let a=0,la=this.operation.records.length;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+35,160,60,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(this.operation.records[a].name,0,tick+17.5)
                                    if(typeof this.operation.records[a].value==`number`){
                                        layer.text(this.operation.records[a].value,0,tick+32.5)
                                    }else{
                                        layer.text(`${this.operation.records[a].value[0]} vs ${this.operation.records[a].value[1]}`,0,tick+32.5)
                                    }
                                    for(let b=0,lb=this.operation.records[a].team.length;b<lb;b++){
                                        let img=[graphics.load.team[this.operation.map][types.team[this.operation.records[a].team[b]].loadIndex],graphics.load.unit[2]]
                                        layer.image(img[0],even(b,lb)*36,tick+50,img[1].width*0.18,img[1].height*0.18)
                                        layer.image(img[1],even(b,lb)*36,tick+50,img[1].width*0.18,img[1].height*0.18)
                                    }
                                    tick+=70
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
                                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1],70,tick+10)
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
                for(let a=0,la=this.operation.teams.length-(this.raiders.active?1:0);a<la;a++){
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
                for(let a=0,la=types.team.length-(this.raiders.active?1:0);a<la;a++){
                    let img=[graphics.load.team[this.operation.map][types.team[a].loadIndex],graphics.load.unit[2]]
                    layer.image(img[0],layer.width*0.5-this.width*0.5+lsin((a+1)/la*360)*360,layer.height*0.5-lcos((a+1)/la*360)*360,img[1].width*0.5,img[1].height*0.5)
                    layer.image(img[1],layer.width*0.5-this.width*0.5+lsin((a+1)/la*360)*360,layer.height*0.5-lcos((a+1)/la*360)*360,img[1].width*0.5,img[1].height*0.5)
                }
            break
            case `graph`:
                layer.fill(180)
                layer.rect(layer.width*0.5,layer.height*0.5,layer.width,layer.height)
                layer.fill(150)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                tick=75
                count=1
                layer.push()
                layer.translate(layer.width-this.width*0.5,0)
                layer.fill(0)
                layer.textSize(24)
                layer.text(`Viewing\nGraphs`,0,40)
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
                layer.text([`Army Size`,`Cities Owned`][this.graph.active],0,tick+25)
                layer.textSize(10)
                layer.text(count,60,tick+15)
                tick+=50
                count++
                layer.fill(120)
                layer.rect(0,tick+25,160,40,10)
                layer.fill(0)
                layer.textSize(15)
                layer.text(`Player Only`,0,tick+25)
                layer.textSize(10)
                layer.text(count,60,tick+15)
                tick+=52
                count++
                for(let a=0,la=types.team.length;a<la;a++){
                    layer.fill(120,this.operation.teams[a].history.display?200:120,120)
                    layer.rect(0,tick+12.5,160,22,10)
                    layer.fill(0)
                    layer.textSize(12)
                    layer.text(`${types.team[a].name}`,0,tick+12.5)
                    layer.textSize(10)
                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[a],70,tick+10)
                    tick+=30
                    count++
                }
                count++
                layer.pop()
                layer.noFill()
                set=[`units`,`cities`][this.graph.active]
                let maximal=this.operation.teams.reduce((acc,team)=>team.history.display?max(acc,team.history[set].reduce((acc,value)=>max(acc,value),0)):acc,0)
                let power=[0.7,1][this.graph.active]
                let maximalS=maximal**power
                if(maximal>0){
                    let bar=10
                    let barTick=0
                    while(bar<this.turn.total){
                        bar*=(barTick%3==2)?2.5:2
                        barTick++
                    }
                    barTick--
                    bar/=(barTick%3==2)?2.5:2
                    let newBar=bar/5
                    while(newBar<this.turn.total){
                        layer.noStroke()
                        layer.fill(0)
                        layer.textSize(20)
                        layer.text(newBar,100+(layer.width-this.width-280)*newBar/this.turn.total,layer.height-75)
                        layer.stroke(0)
                        layer.strokeWeight(6)
                        layer.line(
                            100+(layer.width-this.width-280)*newBar/this.turn.total,layer.height-100,
                            100+(layer.width-this.width-280)*newBar/this.turn.total,layer.height-90
                        )
                        layer.stroke(150)
                        layer.strokeWeight(2)
                        layer.line(
                            100+(layer.width-this.width-280)*newBar/this.turn.total,layer.height-100,
                            100+(layer.width-this.width-280)*newBar/this.turn.total,100
                        )
                        layer.noStroke()
                        newBar+=bar/5
                    }
                    layer.textAlign(RIGHT,CENTER)
                    switch(this.graph.active){
                        case 0:
                            bar=1000
                            barTick=0
                            while(bar<maximal){
                                bar*=(barTick%3==2)?2.5:2
                                barTick++
                            }
                            while(bar>1000&&bar/maximal>0.01){
                                barTick--
                                bar/=(barTick%3==2)?2.5:2
                                let barS=bar**power
                                layer.noStroke()
                                layer.fill(0)
                                layer.textSize(20)
                                layer.text(bar,70,layer.height-100-(layer.height-200)*barS/maximalS)
                                layer.stroke(0)
                                layer.strokeWeight(6)
                                layer.line(
                                    90,layer.height-100-(layer.height-200)*barS/maximalS,
                                    100,layer.height-100-(layer.height-200)*barS/maximalS
                                )
                                layer.stroke(150)
                                layer.strokeWeight(2)
                                layer.line(
                                    layer.width-this.width-180,layer.height-100-(layer.height-200)*barS/maximalS,
                                    100,layer.height-100-(layer.height-200)*barS/maximalS
                                )
                                layer.noStroke()
                            }
                        break
                        case 1:
                            for(let a=0,la=maximal+1;a<la;a++){
                                let barS=a**power
                                layer.noStroke()
                                layer.fill(0)
                                layer.textSize(20)
                                layer.text(a,70,layer.height-100-(layer.height-200)*barS/maximalS)
                                layer.stroke(0)
                                layer.strokeWeight(6)
                                layer.line(
                                    90,layer.height-100-(layer.height-200)*barS/maximalS,
                                    100,layer.height-100-(layer.height-200)*barS/maximalS
                                )
                                layer.stroke(150)
                                layer.strokeWeight(2)
                                layer.line(
                                    layer.width-this.width-180,layer.height-100-(layer.height-200)*barS/maximalS,
                                    100,layer.height-100-(layer.height-200)*barS/maximalS
                                )
                                layer.noStroke()
                            }
                        break
                    }
                    layer.textAlign(LEFT,CENTER)
                    this.operation.teams.forEach(team=>team.ys=[])
                    for(let a=0,la=this.operation.teams[0].history[set].length;a<la;a++){
                        let values=[]
                        this.operation.teams.forEach(team=>{if(team.history.display){values.push({team:team.type,y:(layer.height-200)*(team.history[set][a]**power)/maximalS})}})
                        values.sort((a,b)=>a.y-b.y)
                        values[0].y=max(4,values[0].y)
                        for(let b=1,lb=values.length;b<lb;b++){
                            if(values[b].y<values[b-1].y+4){
                                values[b].y=values[b-1].y+4
                            }
                        }
                        values.forEach(value=>this.operation.teams[value.team].ys.push(value.y))
                    }
                    for(let a=0,la=this.operation.teams.length;a<la;a+=ceil(la/500)){
                        if(this.operation.teams[a].history.display){
                            if(last(this.operation.teams[a].history[set])!=0){
                                let slide=0
                                for(let b=a+1,lb=la;b<lb;b++){
                                    if(this.operation.teams[b].history.display&&last(this.operation.teams[a].history[set])==last(this.operation.teams[b].history[set])){
                                        slide++
                                    }
                                }
                                layer.noStroke()
                                layer.fill(...(this.operation.teams[a].name==`Valais`||this.operation.teams[a].name==`Winterstätten`?nameColor(this.operation.teams[a].name).map(a=>a*1.2):this.operation.teams[a].name==`Junior Wittelsbach`||this.operation.teams[a].name==`Wittelsbach`||this.operation.teams[a].name==`Ludovingian`||this.operation.teams[a].name==`Avesnes`||this.operation.teams[a].name==`Harcourt`?nameColor(this.operation.teams[a].name):nameColor(this.operation.teams[a].name).map(a=>a*0.8)))
                                layer.textSize(20)
                                layer.text(this.operation.teams[a].name,layer.width-this.width-160,layer.height-100-(layer.height-200)*(last(this.operation.teams[a].history[set])**power)/maximalS+slide*18)
                            }
                            layer.stroke(...nameColor(this.operation.teams[a].name))
                            layer.strokeWeight(4)
                            for(let b=0,lb=this.operation.teams[a].ys.length-1;b<lb;b++){
                                layer.line(
                                    100+(layer.width-this.width-280)*b/lb,layer.height-100-this.operation.teams[a].ys[b],
                                    100+(layer.width-this.width-280)*(b+1)/lb,layer.height-100-this.operation.teams[a].ys[b+1]
                                )
                            }
                        }
                    }
                    layer.textAlign(CENTER,CENTER)
                }
                layer.stroke(0)
                layer.strokeWeight(10)
                layer.line(100-2,layer.height-100+2,layer.width-this.width-180,layer.height-100+2)
                layer.line(100-2,layer.height-100+2,100,100+2)
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
                                        this.operation.cities[a].getUnits([this.turn.main]).length>0&&(
                                            types.teamKey[0].includes(types.team[this.turn.main].name)||
                                            types.teamKey[1].includes(types.team[this.turn.main].name)||!(
                                                this.operation.cities[a].getUnits([this.turn.main],0).length<=0&&
                                                this.operation.cities[a].getUnits([this.turn.main],1).length<=0||this.operation.cities[a].getUnits([this.turn.main],1).length>0&&this.operation.cities[a].getUnits([this.turn.main],1)[0].value<10*constants.unit&&
                                                this.operation.cities[a].getNotUnits(aligned).length<=0
                                            )
                                        )||
                                        this.operation.cities[a].data.rule==types.team[this.turn.main].name||
                                        constants.rebel&&this.operation.cities[a].data.rebel==types.team[this.turn.main].name
                                    ){
                                        possible.push(a)
                                    }
                                }
                                if(possible.length==0){
                                    this.newTurn()
                                }else if(possible.includes(this.select.city)){
                                    this.moveTab(1)
                                    if(!dev.close){
                                        this.operation.zoom.shift.position.x=types.city[this.select.city].loc[0]*options.scale
                                        this.operation.zoom.shift.position.y=types.city[this.select.city].loc[1]*options.scale
                                        this.operation.zoom.shift.active=true
                                    }
                                    this.select.trigger=true
                                    this.agency.time=dev.instant?0:5
                                    this.agency.count++
                                }else if(possible.includes(this.select.targetCity)){
                                    this.moveTab(1)
                                    this.select.city=this.select.targetCity
                                    if(!dev.close){
                                        this.operation.zoom.shift.position.x=types.city[this.select.city].loc[0]*options.scale
                                        this.operation.zoom.shift.position.y=types.city[this.select.city].loc[1]*options.scale
                                        this.operation.zoom.shift.active=true
                                    }
                                    this.select.trigger=true
                                    this.agency.time=dev.instant?0:5
                                    this.agency.count++
                                }else if(possible.includes(this.select.secondaryCity)){
                                    this.moveTab(1)
                                    this.select.city=this.select.secondaryCity
                                    if(!dev.close){
                                        this.operation.zoom.shift.position.x=types.city[this.select.city].loc[0]*options.scale
                                        this.operation.zoom.shift.position.y=types.city[this.select.city].loc[1]*options.scale
                                        this.operation.zoom.shift.active=true
                                    }
                                    this.select.trigger=true
                                    this.agency.time=dev.instant?0:5
                                    this.agency.count++
                                }else{
                                    let city=randin(possible)
                                    this.moveTab(1)
                                    this.select.city=city
                                    if(!dev.close){
                                        this.operation.zoom.shift.position.x=types.city[city].loc[0]*options.scale
                                        this.operation.zoom.shift.position.y=types.city[city].loc[1]*options.scale
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
                                let get=[cit.getUnits([this.turn.main],0),cit.getUnits([this.turn.main],1)]
                                this.agency.lastResult=types.teamKey[0].includes(types.team[this.turn.main].name)?[
                                    0,
                                    get[0].length>0&&get[0][0].value<10*constants.unit?0:get[0].length>0&&get[0][0].value<20*constants.unit?-1+this.agency.count*0.1:1,
                                    get[1].length>0&&get[1][0].value>=20*constants.unit||cit.getUnits(this.operation.teams[this.turn.main].allies).length<=0&&get[1].length==0?3:0,
                                    0.25,
                                    floor(random(0.75,2))*2,
                                    get[1].length>0&&get[1][0].value<10*constants.unit?0:floor(random(0,2))*2,
                                ]:types.teamKey[1].includes(types.team[this.turn.main].name)?[
                                    (floor(random(0,10))==0?0:1)*2,
                                    1,
                                    0,
                                    0.5,
                                    0,
                                    0,
                                ]:this.agents[this.turn.main].execute(0,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[this.turn.main].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(types.teamRef[cit.owner])?1:0,
                                    cit.data.rule==types.team[this.turn.main].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.getNotUnits(aligned).length>0?1:0,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                    this.operation.cities.filter(city=>{return aligned.includes(city.owner)&&city.data.rule==types.team[this.turn.main].name}).length,
                                    cit.data.connect.length,
                                    cit.data.connect.filter(connect=>{return aligned.includes(this.operation.cities[types.cityRef[connect.name]].owner)}).length,
                                    totals[0]>0?1:0,
                                    totals[1]>0?1:0,
                                    totals[2]>0?1:0,
                                    totals[3]>0?1:0,
                                    totals[0]/10/constants.unit,
                                    totals[1]/10/constants.unit,
                                    totals[2]/10/constants.unit,
                                    totals[3]/10/constants.unit,
                                    totals[4]/100/constants.unit,
                                    (cit.data.rule==types.team[this.turn.main].name?(cit.getNotUnits(aligned).length<=0?cit.getSpawn(0,this.turn.main):cit.getSpawn(1,this.turn.main)):cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0?cit.getSpawn(2,this.turn.main):0)/10/constants.unit,
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
                                            if(cit.getNotUnits(aligned).reduce((acc,unit)=>acc+unit.value,0)<100*constants.unit&&!(types.teamKey[0].includes(types.team[this.turn.main].name))){
                                                if(cit.owner==types.team[this.turn.main].name&&(cit.data.type==4||cit.data.type==6)&&floor(random(0,1.5))==0){
                                                    this.moveTab(15)
                                                    c=lc
                                                    moved=true
                                                }else if(this.spawn(cit,this.turn.main)){
                                                    this.agency.time=dev.instant?0:5
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                        case 1:
                                            if(cit.getUnits([this.turn.main],0).length>0){
                                                this.moveTab(3)
                                                cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&aligned.includes(unit.team)&&!(unit.team!=this.turn.main&&(types.teamKey[0].includes(types.team[this.turn.main].name)||types.teamKey[1].includes(types.team[this.turn.main].name)))?unit.value:0;unit.edit.active=false})
                                                this.agency.time=dev.instant?0:5
                                                c=lc
                                                moved=true
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
                                            if(this.agency.count<20){
                                                let possible=[]
                                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                                    if(
                                                        this.select.city!=a&&this.operation.cities[a].getUnits([this.turn.main]).length>0&&(
                                                            types.teamKey[0].includes(types.team[this.turn.main].name)||types.teamKey[1].includes(types.team[this.turn.main].name)||!(
                                                                this.operation.cities[a].getUnits([this.turn.main],0).length<=0&&
                                                                this.operation.cities[a].getUnits([this.turn.main],1).length<=0||this.operation.cities[a].getUnits([this.turn.main],1).length>0&&this.operation.cities[a].getUnits([this.turn.main],1)[0].value<10*constants.unit&&
                                                                this.operation.cities[a].getNotUnits(aligned).length<=0
                                                            )
                                                        )||
                                                        this.operation.cities[a].data.rule==types.team[this.turn.main].name||
                                        constants.rebel&&this.operation.cities[a].data.rebel==types.team[this.turn.main].name
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
                                                        this.operation.zoom.shift.position.x=types.city[city].loc[0]*options.scale
                                                        this.operation.zoom.shift.position.y=types.city[city].loc[1]*options.scale
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
                                            if(cit.getUnits([this.turn.main],0).length>0){
                                                if(cit.getNotUnits(aligned).length>0){
                                                    this.initializeCombat(2)
                                                    if(types.team[this.turn.main].auto){
                                                        this.singleVisibility(this.select.city)
                                                    }
                                                    this.agency.time=dev.instant?0:5
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                        case 5:
                                            if(cit.getUnits([this.turn.main],1).length>0){
                                                if(cit.getNotUnits(aligned).length>0){
                                                    this.initializeCombat(2)
                                                    if(types.team[this.turn.main].auto){
                                                        this.singleVisibility(this.select.city)
                                                    }
                                                    this.agency.time=dev.instant?0:5
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                    }
                                }
                                if(!moved){
                                    if(this.agency.count>=20){
                                        if(types.teamKey[0].includes(types.team[this.turn.main].name)||types.teamKey[1].includes(types.team[this.turn.main].name)){
                                            this.newTurn()
                                        }else{
                                            if(!this.turn.locked&&!this.turn.pinned){
                                                let maximal={type:-1,recruits:0}
                                                for(let a=0,la=this.operation.cities.length;a<la;a++){
                                                    if(
                                                        (this.operation.cities[a].data.rule==types.team[this.turn.main].name||this.operation.cities[a].owner==types.team[this.turn.main].name)&&
                                                        this.operation.cities[a].getNotUnits(aligned).length<=0&&
                                                        this.operation.cities[a].recruits>maximal.recruits&&
                                                        this.operation.cities[a].data.type!=7
                                                    ){
                                                        maximal=this.operation.cities[a]
                                                    }
                                                }
                                                if(maximal.type!=-1){
                                                    this.select.city=maximal.type
                                                    cit=maximal
                                                    if(types.team[this.turn.main].name!=cit.data.rule&&!(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0)){
                                                        print(cit,this.turn.main,types.team[this.turn.main])
                                                        throw new Error(`Autorebel Alignment Fail`)
                                                    }
                                                }
                                            }
                                            if(cit.type!=-1){
                                                if(cit.getNotUnits(aligned).reduce((acc,unit)=>acc+unit.value,0)<100*constants.unit&&this.spawn(cit,this.turn.main)){
                                                    if(!dev.close){
                                                        this.operation.zoom.shift.position.x=types.city[this.select.city].loc[0]*options.scale
                                                        this.operation.zoom.shift.position.y=types.city[this.select.city].loc[1]*options.scale
                                                        this.operation.zoom.shift.active=true
                                                    }
                                                }else{
                                                    this.newTurn()
                                                }
                                            }else{
                                                this.newTurn()
                                            }
                                        }
                                    }else{
                                        let possible=[]
                                        for(let a=0,la=this.operation.cities.length;a<la;a++){
                                            if(
                                                this.select.city!=a&&this.operation.cities[a].getUnits([this.turn.main]).length>0&&(
                                                    types.teamKey[0].includes(types.team[this.turn.main].name)||types.teamKey[1].includes(types.team[this.turn.main].name)||!(
                                                        this.operation.cities[a].getUnits([this.turn.main],0).length<=0&&
                                                        this.operation.cities[a].getUnits([this.turn.main],1).length<=0||this.operation.cities[a].getUnits([this.turn.main],1).length>0&&this.operation.cities[a].getUnits([this.turn.main],1)[0].value<10*constants.unit&&
                                                        this.operation.cities[a].getNotUnits(aligned).length<=0
                                                    )
                                                )||
                                                this.operation.cities[a].data.rule==types.team[this.turn.main].name
                                            ){
                                                possible.push(a)
                                            }
                                        }
                                        if(possible.length==0||this.agency.count>=20){
                                            this.newTurn()
                                        }else{
                                            let city=possible[floor(random(0,possible.length))]
                                            this.moveTab(1)
                                            this.select.city=city
                                            if(!dev.close){
                                                this.operation.zoom.shift.position.x=types.city[city].loc[0]*options.scale
                                                this.operation.zoom.shift.position.y=types.city[city].loc[1]*options.scale
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
                                this.agency.lastResult=types.teamKey[0].includes(types.team[this.turn.main].name)?[-round(random(5,15))*constants.unit]:
                                    types.teamKey[1].includes(types.team[this.turn.main].name)?0:
                                    this.agents[this.turn.main].execute(2,[
                                        this.turn.count,
                                        totals[0]>0?1:0,
                                        totals[1]>0?1:0,
                                        totals[0]>10*constants.unit?1:0,
                                        totals[1]>10*constants.unit?1:0,
                                        random(0,1),
                                        totals[0]/10/constants.unit,
                                        totals[1]/10/constants.unit,
                                        totals[2]/100/constants.unit,
                                        cit.data.connect.length,
                                    ])
                                this.agency.lastResult[0]*=constants.unit/100
                                this.agency.lastResult[0]+=cit.getUnits(aligned,1).reduce((acc,unit)=>acc+unit.value,0)
                                if(this.agency.lastResult[0]>=constants.unit){
                                    for(let a=aligned.includes(cit.ruleIndex)&&!types.teamKey[0].includes(types.team[this.turn.main].name)?1:0,la=3;a<la;a++){
                                        if(this.agency.lastResult[0]>=constants.unit){
                                            for(let b=0,lb=cit.units.length;b<lb;b++){
                                                if(
                                                    cit.units[b].type==1&&this.agency.lastResult[0]>=constants.unit&&(
                                                        a==0&&this.operation.teams[this.turn.main].allies.includes(cit.units[b].team)&&cit.units[b].team==cit.ruleIndex||
                                                        a==1&&cit.units[b].team==this.turn.main||
                                                        a==2&&this.operation.teams[this.turn.main].allies.includes(cit.units[b].team)
                                                    )
                                                ){
                                                    this.turn.locked=true
                                                    let move=min(round(this.agency.lastResult[0]/constants.unit)*constants.unit,min(cit.units[b].value-round(random(2.5,10))*constants.unit,round(cit.units[b].value*0.5/constants.unit)*constants.unit))
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
                                }else if(this.agency.lastResult[0]<=-constants.unit){
                                    for(let a=aligned.includes(cit.ruleIndex)&&!types.teamKey[0].includes(types.team[this.turn.main].name)?1:0,la=3;a<la;a++){
                                        if(this.agency.lastResult[0]<=-constants.unit){
                                            for(let b=0,lb=cit.units.length;b<lb;b++){
                                                if(
                                                    cit.units[b].type==0&&this.agency.lastResult[0]<=-constants.unit&&(
                                                        a==0&&this.operation.teams[this.turn.main].allies.includes(cit.units[b].team)&&cit.units[b].team==cit.ruleIndex||
                                                        a==1&&cit.units[b].team==this.turn.main||
                                                        a==2&&this.operation.teams[this.turn.main].allies.includes(cit.units[b].team)
                                                    )
                                                ){
                                                    this.turn.locked=true
                                                    let move=min(round(-this.agency.lastResult[0]/constants.unit)*constants.unit,min(cit.units[b].value-round(random(2.5,10))*constants.unit,round(cit.units[b].value*0.5/constants.unit)*constants.unit))
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
                                this.moveTab(1)
                                this.agency.time=dev.instant?0:5
                            }
                        break
                        case 3:
                            if(types.team[this.turn.main].auto){
                                //this code forces leaving a garrison, but it doesn't seem necessary
                                /*if(!this.operation.cities[this.select.city].units.some(unit=>!aligned.includes(unit.team)||unit.type==1)){
                                    this.operation.cities[this.select.city].units.forEach(unit=>unit.edit.num=ceil((unit.edit.num-min(round(random(2.5,10))*100,unit.edit.num*random(0.25,0.5)))/100)*100)
                                }*/
                                this.moveTab(7)
                                this.turn.pinned=true
                                if(!this.operation.cities[this.select.city].units.some(unit=>unit.value>0&&unit.edit.num>0)){
                                    throw new Error(`Move 0`)
                                }
                                if(types.city[this.select.city].connect.length==0){
                                    this.moveTab(0)
                                }else{
                                    this.select.targetCity=types.cityRef[randin(types.city[this.select.city].connect).name]
                                    this.agency.count=0
                                }
                            }
                        break
                        case 4:
                            if(types.team[this.turn.main].auto){
                                for(let a=0,la=this.operation.teams[this.turn.main].allies.length;a<la;a++){
                                    if(a>=this.operation.teams[this.turn.main].allies.length){
                                        throw new Error(`Overallied`)
                                    }
                                    if(floor(random(0,types.team[this.turn.main].name==`Free Company`?3:types.team[this.turn.main].allies.includes(types.team[this.operation.teams[this.turn.main].allies[a]].name)?15:5))<=1){
                                        if(!dev.close){
                                            this.operation.teams[this.operation.teams[this.turn.main].allies[a]].notif.push(`Alliance Broken\nWith ${this.operation.teams[this.turn.main].name}`)
                                        }
                                        let num=this.operation.teams[this.turn.main].allies.length
                                        this.operation.teams[this.turn.main].removeAlly(this.operation.teams[this.operation.teams[this.turn.main].allies[a]])
                                        a--
                                        la--
                                        this.updateUnits()
                                        this.updateSiege()
                                    }
                                }
                                this.moveTab(types.team[this.turn.main].name==`Free Company`?0:6)
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
                                    if(
                                        a!=this.turn.main&&
                                        !this.operation.teams[this.turn.main].allies.includes(a)&&
                                        (!this.operation.teams[this.turn.main].offers.includes(a)||this.operation.teams[a].offers.includes(this.turn.main))&&
                                        this.operation.teams[a].name!=`Free Company`&&
                                        !types.teamKey[0].includes(this.operation.teams[a].name)&&
                                        !types.teamKey[1].includes(this.operation.teams[a].name)
                                    ){
                                        let distance=[2500,2500,2500]
                                        for(let b=0,lb=this.operation.teams[this.turn.main].cities.length;b<lb;b++){
                                            for(let c=0,lc=this.operation.teams[a].cities.length;c<lc;c++){
                                                let inst=distPos(this.operation.teams[this.turn.main].cities[b],this.operation.teams[a].cities[c])
                                                for(let d=0,ld=distance.length;d<ld;d++){
                                                    if(inst<distance[d]){
                                                        distance.splice(d,0,inst)
                                                        distance.splice(distance.length-1,1)
                                                        break
                                                    }
                                                }
                                            }
                                        }
                                        let distMult=constrain(1.5-(distance[0]+distance[1]+distance[2])/3/1000,0,1)
                                        if(distMult>0){
                                            for(let b=0,lb=(this.operation.teams[a].offers.includes(this.turn.main)?(types.team[a].auto?10:4-this.operation.teams[a].allies.length):(types.team[a].auto?1:0))*types.teamType[findName(types.team[this.turn.main].type,types.teamType)].affinity[findName(types.team[a].type,types.teamType)]*distMult;b<lb;b++){
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
                                        if(!dev.close){
                                            this.operation.teams[roll].notif.push(`Alliance Made\nWith ${this.operation.teams[this.turn.main].name}`)
                                        }
                                        this.operation.teams[roll].addAlly(this.operation.teams[this.turn.main])
                                        this.operation.teams[roll].offers.splice(this.operation.teams[roll].offers.indexOf(this.turn.main),1)
                                    }else if(this.operation.teams[roll].cores.length>0&&!this.operation.teams[roll].cores.some(city=>city.data.type!=7&&(!aligned.includes(types.teamRef[city.owner])||city.units.some(unit=>!aligned.includes(unit.team))))){
                                        if(!dev.close){
                                            this.operation.teams[roll].notif.push(`Alliance Forced\nWith ${this.operation.teams[this.turn.main].name}`)
                                        }
                                        this.operation.teams[roll].addAlly(this.operation.teams[this.turn.main])
                                        if(this.operation.teams[this.turn.main].offers.includes(roll)){
                                            this.operation.teams[this.turn.main].offers.splice(this.operation.teams[this.turn.main].offers.indexOf(roll),1)
                                        }
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
                                let pathfind=0
                                if(types.teamKey[0].includes(types.team[this.turn.main].name)){
                                    pathfind=1
                                }else if(types.teamKey[1].includes(types.team[this.turn.main].name)){
                                    pathfind=2
                                }
                                if(pathfind>0){
                                    cit=this.operation.cities[this.select.city]
                                    this.operation.cities.forEach(cit=>cit.pathfind.num=-1)
                                    cit.pathfind.num=0
                                    let active=[cit.type]
                                    let next=[]
                                    let target=[]
                                    let patrol=[]
                                    let citTarget
                                    if(cit.getUnits([this.turn.main]).length>0){
                                        for(let a=0,la=cit.getUnits([this.turn.main])[0].target.length;a<la;a++){
                                            if(cit.getUnits([this.turn.main])[0].target[a]==cit.type){
                                                cit.getUnits([this.turn.main])[0].target[a]=floor(random(0,this.operation.cities.length))
                                            }
                                        }
                                        citTarget=cit.getUnits([this.turn.main])[0].target
                                    }
                                    while(active.length>0&&target.length==0){
                                        active=active
                                            .map(value=>({value,sort:random(0,1)}))
                                            .sort((a,b)=>a.sort-b.sort)
                                            .map(({value})=>value)
                                        for(let a=0,la=active.length;a<la;a++){
                                            for(let b=0,lb=types.city[active[a]].connect.length;b<lb;b++){
                                                let see=types.cityRef[types.city[active[a]].connect[b].name]
                                                if(this.operation.cities[see].pathfind.num==-1){
                                                    this.operation.cities[see].pathfind.num=this.operation.cities[active[a]].pathfind.num+1
                                                    this.operation.cities[see].pathfind.predecessor=this.operation.cities[active[a]].type
                                                    next.push(see)
                                                    if(
                                                        pathfind==1&&(
                                                            this.operation.cities[see].owner!=-1&&!types.team[types.teamRef[this.operation.cities[see].owner]].auto||
                                                            this.operation.cities[see].units.some(unit=>!types.team[unit.team].auto)
                                                        )||
                                                        pathfind==2&&citTarget.includes(see)
                                                    ){
                                                        target.push(see)
                                                    }
                                                    if(this.operation.cities[see].owner!=-1&&types.teamRef[this.operation.cities[see].owner]==this.turn.main){
                                                        patrol.push(see)
                                                    }
                                                }
                                            }
                                        }
                                        active=next
                                        next=[]
                                    } 
                                    if(target.length<=0){
                                        if(this.hq.players>0){
                                            target=patrol
                                        }
                                        if(target.length<=0){
                                            types.city[cit.type].connect.forEach(connect=>{if(this.operation.cities[types.cityRef[connect.name]].getUnits([this.turn.main],0).length==0){target.push(types.cityRef[connect.name])}})
                                            if(target.length<=0){
                                                types.city[cit.type].connect.forEach(connect=>target.push(types.cityRef[connect.name]))
                                            }
                                        }
                                    }
                                    if(target.length>0){
                                        let select=randin(target)
                                        while(this.operation.cities[select].pathfind.num>1){
                                            select=this.operation.cities[select].pathfind.predecessor
                                        }
                                        this.select.targetCity=select
                                        this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity,true)
                                    }else{
                                        this.newTurn()
                                        this.agency.time=0
                                    }
                                }else{
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
                                        cit.owner!=-1&&this.operation.teams[playing].allies.includes(types.teamRef[cit.owner])?1:0,
                                        cit.data.rule==types.team[this.turn.main].name?1:0,
                                        cit.data.elect?1:0,
                                        cit.data.connect.length,
                                        this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                        this.operation.cities.filter(city=>{return aligned.includes(city.owner)&&city.data.rule==types.team[this.turn.main].name}).length,
                                        totals[3]/10/constants.unit,
                                        totals[0]>0?1:0,
                                        totals[1]>0?1:0,
                                        totals[0]/10/constants.unit,
                                        totals[1]/10/constants.unit,
                                        cit.getNotUnits(aligned,0).length>0?1:0,
                                        cit.getNotUnits(aligned,1).length>0?1:0,
                                        totals[2]/100/constants.unit,
                                        !types.city[cit.type].connect.some(item=>!aligned.includes(this.operation.cities[types.cityRef[item.name]].owner))?1:0,
                                        type
                                    ])
                                    if(this.agency.lastResult[0]>0){
                                        this.agency.time=dev.instant?0:5
                                        this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity,true)
                                    }else{
                                        if(this.agency.count>=20){
                                            this.select.targetCity=types.cityRef[randin(types.city[this.select.city].connect).name]
                                            this.agency.time=dev.instant?0:5
                                            this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity,true)
                                        }else if(types.city[this.select.city].connect.length==0){
                                            this.newTurn()
                                        }else{
                                            this.select.targetCity=types.cityRef[randin(types.city[this.select.city].connect).name]
                                            this.agency.count++
                                        }
                                        this.agency.time=0
                                    }
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
                                this.agency.lastResult=types.teamKey[0].includes(types.team[playing].name)?[1,0,0]:
                                    types.teamKey[1].includes(types.team[playing].name)?[1]:
                                    this.agents[playing].execute(3,[
                                        this.turn.count,
                                        cit.data.rule==types.team[playing].name?1:0,
                                        this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                        totals[0]/10/constants.unit,
                                        totals[1]/10/constants.unit,
                                        this.battle.circumstance[0]==2?1:0,
                                    ])
                                let maximal=max(this.agency.lastResult[0],this.agency.lastResult[1],this.agency.lastResult[2])
                                if(this.agency.lastResult[0]==maximal&&!(this.raiders.active&&!types.teamKey[1].includes(types.team[playing].name)&&cit.units.some(unit=>types.teamKey[1].includes(types.team[unit.team].name)&&unit.value>=20*constants.unit)&&floor(random(0,1.25))==0)){
                                    this.initializeCombat(0)
                                    this.agency.time=dev.instant?0:5
                                }else if(this.agency.lastResult[1]==maximal){
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
                                    cit.updateUnits()
                                    this.select.city=this.select.targetCity
                                    this.moveTab(10)
                                    this.battle.circumstance[1]=1
                                    let rule=this.operation.cities[this.select.targetCity].ruleIndex
                                    if(rule!=this.turn.main&&!this.operation.teams[this.turn.main].allies.includes(rule)){
                                        this.operation.cities[this.select.targetCity].raided(this.turn.main)
                                    }
                                    this.agency.time=0
                                }else{
                                    this.moveTab(17)
                                    if(types.team[this.turn.main].auto){
                                        this.singleVisibility(this.select.targetCity)
                                    }
                                    this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
                                    this.agency.count=0
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
                                this.agency.lastResult=types.teamKey[0].includes(types.team[this.turn.main].name)?[1]:
                                    types.teamKey[1].includes(types.team[this.turn.main].name)?[floor(random(0,1.25))]:
                                    this.agents[this.turn.main].execute(4,[
                                        this.turn.count,
                                        cit.data.rule==types.team[this.turn.main].name?1:0,
                                        this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                        totals[0]/10/constants.unit,
                                        totals[1]/10/constants.unit,
                                        this.battle.circumstance[0]==2?1:0,
                                        cit.sieged,
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
                                this.agency.lastResult=types.teamKey[0].includes(types.team[playing].name)?[0]:
                                    types.teamKey[1].includes(types.team[playing].name)?[1]:
                                    this.agents[playing].execute(5,[
                                        this.turn.count,
                                        cit.data.rule==types.team[playing].name?1:0,
                                        this.operation.cities.filter(city=>{return aligned.includes(city.owner)}).length,
                                        totals[0]/10/constants.unit,
                                        totals[1]/10/constants.unit,
                                    ])
                                if(this.agency.lastResult[0]>0){
                                    this.moveTab(17)
                                    if(types.team[this.turn.main].auto){
                                        this.singleVisibility(this.select.targetCity)
                                    }
                                    this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
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
                                    this.operation.cities[this.select.targetCity].sieged+=2
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
                                let reveal=cit.getUnits([playing]).length>0
                                this.agency.lastResult=this.agents[playing].execute(6,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[playing].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(types.teamRef[cit.owner])?1:0,
                                    cit.data.rule==types.team[playing].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.data.connect.length,
                                    cit.visibility>0?1:0,
                                    totals[3]/10/constants.unit,
                                    cit.getUnits(newAligned,0).length>0?1:0,
                                    cit.getUnits(newAligned,1).length>0?1:0,
                                    totals[0]/10/constants.unit,
                                    totals[1]/10/constants.unit,
                                    (reveal?cit.getNotUnits(newAligned,0):cit.getNotUnitsVisible(newAligned,0).length)>0?1:0,
                                    (reveal?cit.getNotUnits(newAligned,1):cit.getNotUnitsVisible(newAligned,1).length)>0?1:0,
                                    totals[2]/100/constants.unit,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.agency.time=dev.instant?0:5
                                    this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.secondaryCity,true)
                                }else{
                                    if(this.agency.count>=20){
                                        this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
                                        this.agency.time=dev.instant?0:5
                                        this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.secondaryCity,true)
                                    }else if(types.city[this.select.targetCity].connect.length==0){
                                        this.newTurn()
                                    }else{
                                        this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
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
                                let reveal=cit.getUnits([playing]).length>0
                                this.agency.lastResult=this.agents[playing].execute(6,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[playing].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(types.teamRef[cit.owner,types.team])?1:0,
                                    cit.data.rule==types.team[playing].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.data.connect.length,
                                    cit.visibility>0?1:0,
                                    totals[3]/10/constants.unit,
                                    totals[0]>0?1:0,
                                    totals[1]>0?1:0,
                                    totals[0]/10/constants.unit,
                                    totals[1]/10/constants.unit,
                                    (reveal?cit.getNotUnits(newAligned,0):cit.getNotUnitsVisible(newAligned,0).length)>0?1:0,
                                    (reveal?cit.getNotUnits(newAligned,1):cit.getNotUnitsVisible(newAligned,1).length)>0?1:0,
                                    totals[2]/100/constants.unit,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.agency.time=dev.instant?0:5
                                    this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity,true)
                                }else{
                                    if(this.agency.count>=20){
                                        this.select.targetCity=types.cityRef[randin(types.city[this.select.city].connect).name]
                                        this.agency.time=dev.instant?0:5
                                        this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.targetCity,true)
                                    }else if(types.city[this.select.city].connect.length==0){
                                        this.newTurn()
                                    }else{
                                        this.select.targetCity=types.cityRef[randin(types.city[this.select.city].connect).name]
                                        this.agency.count++
                                    }
                                    this.agency.time=0
                                }
                            }
                        break
                        case 14: case 19:
                            if(types.team[this.turn.main].auto){
                                this.moveTab(0)
                                this.agency.time=0
                            }
                        break
                        case 15:
                            if(types.team[this.turn.main].auto){
                                let possible=[]
                                for(let a=0,la=this.operation.teams[this.turn.main].cities.length;a<la;a++){
                                    for(let b=0,lb=types.city[this.operation.teams[this.turn.main].cities[a].type].connect.length;b<lb;b++){
                                        let cit=types.cityRef[types.city[this.operation.teams[this.turn.main].cities[a].type].connect[b].name]
                                        if(
                                            !aligned.includes(types.teamRef[this.operation.cities[cit].owner])&&
                                            !aligned.includes(types.teamRef[this.operation.cities[cit].rule])&&
                                            this.operation.cities[cit].getSpawn(3,this.turn.main)>0&&this.operation.cities[cit].data.type!=7&&this.operation.cities[cit].data.type!=10
                                        ){
                                            possible.push(cit)
                                        }
                                        for(let c=0,lc=types.city[cit].connect.length;c<lc;c++){
                                            let cit2=types.cityRef[types.city[cit].connect[c].name]
                                            if(
                                                !aligned.includes(types.teamRef[this.operation.cities[cit2].owner])&&
                                                !aligned.includes(types.teamRef[this.operation.cities[cit2].rule])&&
                                                this.operation.cities[cit2].getSpawn(3,this.turn.main)>0&&this.operation.cities[cit2].data.type!=7&&this.operation.cities[cit2].data.type!=10
                                            ){
                                                possible.push(cit2)
                                            }
                                        }
                                    }
                                }
                                if(possible.length>0){
                                    this.select.city=randin(possible)
                                    this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.city,true)
                                }else{
                                    this.moveTab(0)
                                }
                            }
                        break
                        case 17:
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
                                let reveal=cit.getUnits([playing]).length>0
                                this.agency.lastResult=this.agents[playing].execute(6,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[playing].name?1:0,
                                    cit.owner!=-1&&this.operation.teams[playing].allies.includes(types.teamRef[cit.owner])?1:0,
                                    cit.data.rule==types.team[playing].name?1:0,
                                    cit.data.elect?1:0,
                                    cit.data.connect.length,
                                    cit.visibility>0?1:0,
                                    totals[3]/10/constants.unit,
                                    cit.getUnits(newAligned,0).length>0?1:0,
                                    cit.getUnits(newAligned,1).length>0?1:0,
                                    totals[0]/10/constants.unit,
                                    totals[1]/10/constants.unit,
                                    (reveal?cit.getNotUnits(newAligned,0):cit.getNotUnitsVisible(newAligned,0).length)>0?1:0,
                                    (reveal?cit.getNotUnits(newAligned,1):cit.getNotUnitsVisible(newAligned,1).length)>0?1:0,
                                    totals[2]/100/constants.unit,
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.agency.time=dev.instant?0:5
                                    this.cityClick(layer,{position:{x:0,y:0}},scene,this.select.secondaryCity,true)
                                }else{
                                    if(this.agency.count>=20){
                                        for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                            let uni=this.operation.cities[this.select.targetCity].units[a]
                                            if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                                uni.remove=true
                                                this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                            }
                                        }
                                        cit.updateUnits()
                                        this.operation.cities[this.select.targetCity].sieged+=2
                                        this.moveTab(10)
                                        this.battle.circumstance[1]=1
                                        this.agency.time=0
                                    }else{
                                        this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
                                        this.agency.count++
                                    }
                                    this.agency.time=0
                                }
                            }
                        break
                        case 18:
                            if(types.team[this.turn.main].auto){
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(this.operation.teams[this.turn.main].prisoners[a]>0&&this.operation.teams[a].prisoners[this.turn.main]>0&&a!=this.turn.main&&types.team[a].auto){
                                        if(floor(random(0,10))==0){
                                            let value=min(this.operation.teams[this.turn.main].prisoners[a],this.operation.teams[a].prisoners[this.turn.main])
                                            let cits=[]

                                            let aligned=[a,...this.operation.teams[a].allies]
                                            let possible=[]
                                            for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                if(this.operation.cities[b].getUnits([a]).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                    possible.push(b)
                                                }
                                            }
                                            if(possible.length>0){
                                                cits.push(randin(possible))
                                            }else{
                                                for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                    if(this.operation.cities[b].getUnits(aligned).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                        possible.push(b)
                                                    }
                                                }
                                                if(possible.length>0){
                                                    cits.push(randin(possible))
                                                }
                                            }
                                            if(cits.length==1){
                                                aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                                                possible=[]
                                                for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                    if(this.operation.cities[b].getUnits([this.turn.main]).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                        possible.push(b)
                                                    }
                                                }
                                                if(possible.length>0){
                                                    cits.push(randin(possible))
                                                }else{
                                                    for(let b=0,lb=this.operation.cities.length;b<lb;b++){
                                                        if(this.operation.cities[b].getUnits(aligned).length>0&&this.operation.cities[b].getNotUnits(aligned).length==0){
                                                            possible.push(b)
                                                        }
                                                    }
                                                    if(possible.length>0){
                                                        cits.push(randin(possible))
                                                    }
                                                }
                                            }
                                            if(cits.length==2){
                                                this.operation.cities[cits[0]].summonUnit(a,0,value)
                                                this.operation.cities[cits[1]].summonUnit(this.turn.main,0,value)
                                                this.operation.teams[this.turn.main].prisoners[a]-=value
                                                this.operation.teams[a].prisoners[this.turn.main]-=value
                                            }
                                        }
                                    }
                                }
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
                        if(inPointBox(rel,boxify((b+0.5)/lb*300-150,a*60+610-la*30,300/lb,50))){
                            this.operation.transitionManager.begin(`setup`)
                            this.operation.nextMap=groups[a][b]
                            this.select.auto=[]
                            if(types.map[groups[a][b]].name[1]==`Randomized`){
                                this.operation.randomizeMap(groups[a][b])
                                types.holdTeam.forEach(item=>this.select.auto.push(true))
                                this.loadMap(groups[a][b],types.holdTeam)
                            }else{
                                types.map[groups[a][b]].team.forEach(item=>this.select.auto.push(true))
                                this.loadMap(groups[a][b],types.map[groups[a][b]].team)
                            }
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
                if(inPointBox(rel,boxify(-250,rows*30+475,240,50))){
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
                if(inPointBox(rel,boxify(-60,rows*30+475,120,50))&&options.strength>0.2){
                    options.strength=round(options.strength*10-1)/10
                }
                if(inPointBox(rel,boxify(60,rows*30+475,120,50))&&options.strength<2){
                    options.strength=round(options.strength*10+1)/10
                }
                if(inPointBox(rel,boxify(250,rows*30+475,240,50))){
                    options.hq=!options.hq
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
                if(mouse.position.x<layer.width-this.width&&!this.turn.pinned&&this.tabs.active!=15&&this.tabs.active!=16&&this.tabs.active!=19){
                    if(this.tabs.active==5){
                        this.updateVisibility()
                    }
                    if(!this.select.trigger){
                        this.moveTab(this.turn.locked?1:0)
                    }
                }
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                let cit
                let playing=this.turn.main
                tick=75
                if(this.turn.timer<=0){
                    switch(this.tabs.active){
                        case 0:
                            if(!types.team[this.turn.main].auto||dev.pause){
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
                            }
                        break
                        case 1:
                            if(!types.team[this.turn.main].auto||dev.pause){
                                tick+=25
                                cit=this.operation.cities[this.select.city]
                                if(
                                    cit.getUnits([this.turn.main]).length>0||
                                    cit.data.rule==types.team[this.turn.main].name||
                                    constants.rebel&&cit.data.rebel==types.team[this.turn.main].name
                                ){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        //cit.minorRegen()
                                        this.turn.count=0
                                        this.newTurn()
                                    }
                                    tick+=50
                                }
                                if(cit.data.type!=7&&cit.data.type!=10){
                                    if(
                                        cit.data.rule==types.team[this.turn.main].name||
                                        constants.rebel&&cit.data.rebel==types.team[this.turn.main].name||
                                        (cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0)
                                    ){
                                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                            this.spawn(cit,this.turn.main)
                                        }
                                        tick+=50
                                    }
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
                                        if(cit.getNotUnits(aligned).length>0&&cit.getUnits([this.turn.main],1).length>0){
                                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                                cit.units.forEach(unit=>{if(unit.team==this.turn.main){
                                                    unit.remove=true
                                                    let enemy=cit.getNotUnits([unit.team,...this.operation.teams[unit.team].allies],0)
                                                    if(enemy.length==0){
                                                        enemy=cit.getNotUnits([unit.team,...this.operation.teams[unit.team].allies])
                                                    }
                                                    let totalEnemy=enemy.reduce((acc,enemy)=>acc+enemy.value,0)
                                                    enemy.forEach(enemy=>{
                                                        this.operation.teams[enemy.team].prisoners[unit.team]+=round(unit.value*enemy.value/totalEnemy/constants.unit+random(-0.5,0.5))*constants.unit
                                                    })
                                                }})
                                            }
                                            tick+=50
                                        }
                                    }
                                }
                                if(cit.owner==types.team[this.turn.main].name&&cit.data.type==3){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.moveTab(14)
                                    }
                                    tick+=50
                                }
                                if(cit.owner==types.team[this.turn.main].name&&(cit.data.type==4||cit.data.type==6)){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.moveTab(15)
                                    }
                                    tick+=50
                                }
                                if(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0&&(cit.data.type==5||cit.data.type==10)){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        if(cit.getSpawn(4,types.teamRef[`Free Company`])>0){
                                            cit.spawn(4,types.teamRef[`Free Company`])
                                            cit.updateUnits()
                                            this.turn.timer=30
                                            if(!this.operation.teams[types.teamRef[`Free Company`]].allies.includes(this.turn.main)&&this.operation.teams[this.turn.main].name!=`Free Company`){
                                                this.operation.teams[types.teamRef[`Free Company`]].addAlly(this.operation.teams[this.turn.main])
                                            }
                                        }
                                    }
                                    tick+=50
                                }
                                if(cit.getUnits([this.turn.main]).length>0&&cit.getNotUnits(aligned).length<=0&&cit.owner!=types.team[this.turn.main].name){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        cit.setOwner(types.team[this.turn.main].name)
                                    }
                                    tick+=50
                                }
                            }
                        break
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
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.moveTab(17)
                                    if(types.team[this.turn.main].auto){
                                        this.singleVisibility(this.select.targetCity)
                                    }
                                    this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
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
                    }
                }
            break
            case `map`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                tick=100
                switch(this.tabs.mapActive){
                    case 0:
                        if(options.hq){
                            tick+=25
                        }
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.operation.transitionManager.begin(`main`)
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            options.core=!options.core
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.mapActive=2
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.mapActive=1
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.mapActive=3
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.operation.transitionManager.begin(`graph`)
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
                    case 1: case 3:
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.mapActive=0
                        }
                        tick+=52
                    break
                    case 2:
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.mapActive=0
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.operation.transitionManager.begin(`pick`)
                        }
                        tick+=50
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            options.respawn=!options.respawn
                        }
                        tick+=50
                        for(let a=0,la=3;a<la;a++){
                            let set=[`strength`,`unitSize`,`scale`][a]
                            if(inPointBox(rel,boxify(-40,tick+25,80,50))&&options[set]>0.2){
                                options[set]=round(options[set]*10-1)/10
                            }
                            if(inPointBox(rel,boxify(40,tick+25,80,50))&&options[set]<2){
                                options[set]=round(options[set]*10+1)/10
                            }
                            tick+=50
                        }
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
            case `graph`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                tick=75
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.operation.transitionManager.begin(`map`)
                }
                tick+=50
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.graph.active=(this.graph.active+1)%2
                }
                tick+=50
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.operation.teams.forEach(team=>team.history.display=!types.team[team.type].auto)
                }
                tick+=52
                for(let a=0,la=types.team.length;a<la;a++){
                    if(inPointBox(rel,boxify(0,tick+12.5,160,22,10))){
                        this.operation.teams[a].history.display=!this.operation.teams[a].history.display
                    }
                    tick+=30
                }
            break
        }
    }
    onKey(layer,key,scene){
        let count=1
        switch(scene){
            case `title`:
                let ticker=0
                for(let a=0,la=types.map.length;a<la;a++){
                    if(key==`abcdefghijklmnopqrstuvwxyz`[ticker]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[ticker]){
                        this.operation.transitionManager.begin(`setup`)
                        this.operation.nextMap=a
                        this.select.auto=[]
                        if(types.map[a].name[1]==`Randomized`){
                            this.operation.randomizeMap(a)
                            types.holdTeam.forEach(item=>this.select.auto.push(true))
                            this.loadMap(a,types.holdTeam)
                        }else{
                            types.map[a].team.forEach(item=>this.select.auto.push(true))
                            this.loadMap(a,types.map[a].team)
                        }
                    }
                    ticker++
                }
            break
            case `setup`:
                for(let a=0,la=this.select.auto.length;a<la;a++){
                    if(key==`abcdefghijklmnopqrstuvwxyz`[a]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[a]){
                        this.select.auto[a]=!this.select.auto[a]
                    }
                }
                if(key==`@`){
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
                }else if(key==`-`&&options.strength>0.2){
                    options.strength=round(options.strength*10-1)/10
                }else if(key==`+`&&options.strength<2){
                    options.strength=round(options.strength*10+1)/10
                }else if(key==`#`){
                    options.hq=!options.hq
                }else if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }else if(key==`/`){
                    this.operation.transitionManager.begin(`edit`)
                }else if(key==`!`){
                    this.select.auto.forEach((item,index,array)=>array[index]=!item)
                }
            break
            case `pick`:
                for(let a=0,la=types.team.length;a<la;a++){
                    if(key==`abcdefghijklmnopqrstuvwxyz`[a]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[a]){
                        types.team[a].auto=!types.team[a].auto
                    }
                }
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }else if(key==`/`){
                    this.operation.transitionManager.begin(`edit`)
                }else if(key==`!`){
                    types.team.forEach(team=>team.auto=!team.auto)
                }
            break
            case `main`:
                let aligned=[this.turn.main,...this.operation.teams[this.turn.main].allies]
                let cit
                let playing=this.turn.main
                switch(this.tabs.active){
                    case 0:
                        if(!types.team[this.turn.main].auto||dev.pause){
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
                        }
                    break
                    case 1:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            cit=this.operation.cities[this.select.city]
                            if(
                                cit.getUnits([this.turn.main]).length>0||
                                cit.data.rule==types.team[this.turn.main].name||
                                constants.rebel&&cit.data.rebel==types.team[this.turn.main].name
                            ){
                                if(key==count.toString()){
                                    //cit.minorRegen()
                                    this.turn.count=0
                                    this.newTurn()
                                }
                                count++
                            }
                            if(cit.data.type!=7&&cit.data.type!=10){
                                if(
                                    cit.data.rule==types.team[this.turn.main].name||
                                    constants.rebel&&cit.data.rebel==types.team[this.turn.main].name||
                                    (cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0)
                                ){
                                    if(key==count.toString()){
                                        this.spawn(cit,this.turn.main)
                                    }
                                    count++
                                }
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
                                    if(cit.getNotUnits(aligned).length>0&&cit.getUnits([this.turn.main],1).length>0){
                                        if(key==count.toString()){
                                            cit.units.forEach(unit=>{if(unit.team==this.turn.main){
                                                unit.remove=true
                                                let enemy=cit.getNotUnits([unit.team,...this.operation.teams[unit.team].allies],0)
                                                if(enemy.length==0){
                                                    enemy=cit.getNotUnits([unit.team,...this.operation.teams[unit.team].allies])
                                                }
                                                let totalEnemy=enemy.reduce((acc,enemy)=>acc+enemy.value,0)
                                                enemy.forEach(enemy=>{
                                                    this.operation.teams[enemy.team].prisoners[unit.team]+=round(unit.value*enemy.value/totalEnemy/constants.unit+random(-0.5,0.5))*constants.unit
                                                })
                                            }})
                                        }
                                        count++
                                    }
                                }
                            }
                            if(cit.owner==types.team[this.turn.main].name&&cit.data.type==3){
                                if(key==count.toString()){
                                    this.moveTab(14)
                                }
                                count++
                            }
                            if(cit.owner==types.team[this.turn.main].name&&(cit.data.type==4||cit.data.type==6)){
                                if(key==count.toString()){
                                    this.moveTab(15)
                                }
                                count++
                            }
                            if(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0&&(cit.data.type==5||cit.data.type==10)){
                                if(key==count.toString()){
                                    if(cit.getSpawn(4,types.teamRef[`Free Company`])>0){
                                        cit.spawn(4,types.teamRef[`Free Company`])
                                        cit.updateUnits()
                                        this.turn.timer=30
                                        if(!this.operation.teams[types.teamRef[`Free Company`]].allies.includes(this.turn.main)&&this.operation.teams[this.turn.main].name!=`Free Company`){
                                            this.operation.teams[types.teamRef[`Free Company`]].addAlly(this.operation.teams[this.turn.main])
                                        }
                                    }
                                }
                                count++
                            }
                            if(cit.getUnits([this.turn.main]).length>0&&cit.getNotUnits(aligned).length<=0&&cit.owner!=types.team[this.turn.main].name){
                                if(key==count.toString()){
                                    cit.setOwner(types.team[this.turn.main].name)
                                }
                                count++
                            }
                        }
                    break
                    case 2:
                        if(!types.team[this.turn.main].auto||dev.pause){
                            cit=this.operation.cities[this.select.city]
                            for(let a=0,la=cit.units.length;a<la;a++){
                                if(cit.units[a].edit.trigger){
                                    if(`1234567890`.includes(key)){
                                        cit.units[a].edit.num=min(10000*constants.unit,cit.units[a].edit.num*10+int(key)*constants.unit)
                                    }else if(key==`Backspace`){
                                        cit.units[a].edit.num=floor(cit.units[a].edit.num/10/constants.unit)*constants.unit
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
                                        cit.units[a].edit.num=min(10000*constants.unit,cit.units[a].edit.num*10+int(key)*constants.unit)
                                    }else if(key==`Backspace`){
                                        cit.units[a].edit.num=floor(cit.units[a].edit.num/10/constants.unit)*constants.unit
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
                                    if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1]){
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
                            if(key==count.toString()){
                                this.moveTab(17)
                                if(types.team[this.turn.main].auto){
                                    this.singleVisibility(this.select.targetCity)
                                }
                                this.select.secondaryCity=types.cityRef[randin(types.city[this.select.targetCity].connect).name]
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
                                    if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1]){
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
                                    if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1]){
                                        this.releasing.team=a
                                        this.moveTab(19)
                                    }
                                    count++
                                }
                            }
                            if(types.team.some((team,index)=>this.operation.teams[this.turn.main].prisoners[index]>0&&this.operation.teams[index].prisoners[this.turn.main]>0&&index!=this.turn.main&&team.auto)){
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(this.operation.teams[this.turn.main].prisoners[a]>0&&this.operation.teams[a].prisoners[this.turn.main]>0&&a!=this.turn.main&&types.team[a].auto){
                                        if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[count-1]){
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
                            options.core=!options.core
                        }
                        count++
                        if(key==count.toString()){
                            this.tabs.mapActive=2
                        }
                        count++
                        if(key==count.toString()){
                            this.tabs.mapActive=1
                        }
                        count++
                        if(key==count.toString()){
                            this.tabs.mapActive=3
                        }
                        count++
                        if(key==count.toString()){
                            this.operation.transitionManager.begin(`graph`)
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
                    case 1: case 3:
                        if(key==`Enter`){
                            this.tabs.mapActive=0
                        }
                    break
                    case 2:
                        if(key==`Enter`){
                            this.tabs.mapActive=0
                        }
                        if(key==count.toString()){
                            this.operation.transitionManager.begin(`pick`)
                        }
                        count++
                        if(key==count.toString()){
                            options.respawn=!options.respawn
                        }
                        count++
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
                            if(key==`abcdefghijklmnopqrstuvwxyz`[a]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[a]){
                                this.select.edit=a
                                this.tabs.editActive=0
                            }
                        }
                    break
                }
            break
            case `ally`:
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }
            break
            case `graph`:
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`map`)
                }
                if(key==count.toString()){
                    this.graph.active=(this.graph.active+1)%2
                }
                count++
                if(key==count.toString()){
                    this.operation.teams.forEach(team=>team.history.display=!types.team[team.type].auto)
                }
                count++
                for(let a=0,la=types.team.length;a<la;a++){
                    if(key==`abcdefghijklmnopqrstuvwxyz`[a]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`[a]){
                        this.operation.teams[a].history.display=!this.operation.teams[a].history.display
                    }
                }
            break
        }
    }
}