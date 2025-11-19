class ui{
    constructor(operation){
        this.operation=operation
        this.width=200
        this.tabs={active:0,anim:[]}
        this.turn={main:-1,total:0,count:0,timer:0,locked:false,pinned:false}
        this.select={city:-1,targetCity:-1,secondaryCity:-1,battleCity:-1,moved:[],trigger:false}
        this.agency={count:0,time:0,reorg:false,lastResult:[]}
        this.battle={result:0,circumstance:[]}
        this.agents=[]
        /*
        [0,0] - Attacking City
        [0,1] - Attacking and Besieging City
        [1,1] - Conduct from Siege
        [1,2] - Breakout from Siege
        [2,0] - Rebel Against Enemy Force
        [2,1] - Rebels Besiege City
        */
        this.initial()
    }
    save(){
        let composite={
            tabs:this.tabs,
            turn:this.turn,
            battle:this.battle,
        }
        return composite
    }
    load(composite){
        this.tabs=composite.tabs
        this.turn=composite.turn
        this.battle=composite.battle
    }
    initial(){
        for(let a=0,la=15;a<la;a++){
            this.tabs.anim.push(0)
        }
    }
    initialAgents(){
        for(let a=0,la=types.team.length;a<la;a++){
            if(types.team[a].auto){
                if(dev.new){
                    this.agents.push(new agent())
                }else{
                    let index=floor(random(0,agentset.length))
                    this.agents.push(new agent(...agentset[index]))
                    agentset.splice(index,1)
                }
            }else{
                this.agents.push(0)
            }
        }
    }
    newTurn(){
        if(dev.assemble&&this.turn.total!=0){
            if(this.turn.total%500==0){
                this.agents.forEach((agent,index)=>agent.record+=this.operation.cities.reduce((acc,city)=>acc+(city.owner==types.team[index].name?1:0)*(city.data.elect?2:1),0)-types.city.reduce((acc,city)=>acc+(city.rule==types.team[index].name?1:0)*(city.elect?2:1),0))
                this.operation.initialComponents()
                this.agents.splice(0,0,last(this.agents))
                this.agents.splice(this.agents.length-1,1)
            }
            if(this.turn.total%10000==0){
                let maximal=this.agents.reduce((acc,agent)=>max(acc,agent.rewards),0)
                this.agents.forEach(agent=>{agent.record+=agent.rewards/maximal*5;agent.rewards=0})
                maximal=this.agents.reduce((acc,agent)=>max(acc,agent.punishments),0)
                this.agents.forEach(agent=>{agent.record-=agent.punishments/maximal*5;agent.punishments=0})
                this.agents.sort((a,b)=>a.record-b.record)
                this.agents.splice(0,5)
                let len=this.agents.length
                for(let a=0,la=this.turn.total>=1000000?5:4;a<la;a++){
                    this.agents.push(new agent(
                        JSON.parse(JSON.stringify(this.agents[len-1-a].sets)),
                        JSON.parse(JSON.stringify(this.agents[len-1-a].constants))
                    ))
                    last(this.agents).mutate()
                }
                if(this.turn.total<1000000){
                    this.agents.push(new agent())
                }
                this.agents=this.agents
                    .map(value=>({value,sort:random(0,1)}))
                    .sort((a,b)=>a.sort-b.sort)
                    .map(({value})=>value)
            }
        }
        let total=0
        types.team.forEach((team,index)=>{if(index!=this.turn.main){total+=team.chance+(team.auto?0:0.5)}})
        if(this.turn.count>0){
            this.turn.count--
            this.tabs.active=0
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
            let len=this.operation.cities.filter(city=>{return city.owner==types.team[this.turn.main].name}).length
            this.turn.count=len==0?0:floor(random(0.5,len*0.25+2.5))
            this.operation.cities.forEach(city=>city.visibility=0)
            this.tabs.active=5
        }
        this.turn.total++
        this.turn.timer=0
        this.turn.locked=false
        this.turn.pinned=false
        this.agency.count++
        this.agency.reorg=false
        this.operation.cities.forEach(city=>city.newTurn())
    }
    accept(){
        let aligned=[this.turn.main,...types.team[this.turn.main].allies]
        let cit=[
            this.operation.cities[this.select.targetCity],
            this.operation.cities[this.select.city],
            this.operation.cities[this.select.city]
        ][this.battle.circumstance[0]]
        for(let a=0,la=this.battle.result.casualties.length;a<la;a++){
            for(let b=0,lb=this.battle.result.casualties[a].length;b<lb;b++){
                let left=this.battle.result.casualties[a][b].number
                for(let c=0,lc=cit.units.length;c<lc;c++){
                    let unit=cit.units[c]
                    if(unit.team==this.battle.result.casualties[a][b].team&&unit.type==this.battle.result.casualties[a][b].type&&unit.type==0){
                        let minus=min(left,unit.value)
                        unit.value-=minus
                        left-=minus
                        if(unit.value<=0){
                            unit.remove=true
                        }
                    }
                }
                if(left>0){
                    for(let c=0,lc=cit.units.length;c<lc;c++){
                        let unit=cit.units[c]
                        if(unit.team==this.battle.result.casualties[a][b].team&&unit.type==this.battle.result.casualties[a][b].type&&unit.type==1){
                            let minus=min(left,unit.value)
                            unit.value-=minus
                            left-=minus
                            if(unit.value<=0){
                                unit.remove=true
                            }
                        }
                    }
                }
            }
        }
        let totalLeft=[0,0]
        for(let a=0,la=cit.units.length;a<la;a++){
            totalLeft[aligned.includes(cit.units[a].team)?0:1]+=cit.units[a].value
        }
        if(totalLeft[0]==0){
            if(totalLeft[1]==0){
                this.battle.result.winner=[3]
                this.turn.timer=30
            }else{
                this.battle.result.winner=[2]
                this.turn.timer=30
            }
        }else if(totalLeft[1]==0){
            this.battle.result.winner=[1]
            this.turn.timer=30
        }else{
            if(this.battle.circumstance[0]==0){
                if(this.battle.circumstance[1]==0){
                    if(last(this.battle.result.winner)==1){
                        let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                        if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                            this.operation.cities[this.select.targetCity].raided()
                        }
                        if(this.operation.cities[this.select.targetCity].getNotUnits(aligned).length>0){
                            this.tabs.active=this.operation.cities[this.select.targetCity].getUnits(aligned,1).length>0?12:11
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
                        let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                        if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                            this.operation.cities[this.select.targetCity].raided()
                        }
                        this.operation.cities[this.select.targetCity].getNotUnits(aligned).forEach(unit=>unit.remove=true)
                        //flag p for prisoner
                    }
                    this.turn.timer=15
                }
            }else if(this.battle.circumstance[0]==1){
                if(this.battle.circumstance[1]==0){
                    if(last(this.battle.result.winner)==1){
                        this.operation.cities[this.select.city].getNotUnits(aligned).forEach(unit=>unit.remove=true)
                        //flag p for prisoner
                    }
                    this.turn.timer=15
                }else if(this.battle.circumstance[1]==1){
                    if(last(this.battle.result.winner)==1&&this.operation.cities[this.select.city].getNotUnits(aligned).length>0){
                        this.tabs.active=13
                        if(types.city[this.select.city].connect.length==0){
                            this.tabs.active=0
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
                            this.tabs.active=13
                            if(types.city[this.select.city].connect.length==0){
                                this.tabs.active=0
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
        }
    }
    cityClick(layer,mouse,city){
        let aligned=[this.turn.main,...types.team[this.turn.main].allies]
        if(mouse.position.x<layer.width-this.width&&!this.select.trigger){
            if(this.tabs.active==7&&types.city[this.select.city].connect.some(connection=>{return connection.name==types.city[city].name})){
                let exists=this.operation.cities[city].units.some(unit=>aligned.includes(unit.team)&&unit.type==0)
                this.select.moved=[]
                this.select.targetCity=city
                this.operation.zoom.shift.position.x=types.city[city].loc[0]
                this.operation.zoom.shift.position.y=types.city[city].loc[1]
                this.operation.zoom.shift.active=true
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
                    this.tabs.active=8
                    this.battle.circumstance=[0]
                    for(let a=0,la=types.city[this.select.city].connect.length;a<la;a++){
                        if(types.city[this.select.city].connect[a].name==types.city[city].name){
                            this.operation.calc.terrain.list=types.city[this.select.city].connect[a].type==1?[1]:[]
                        }
                    }
                    if(this.operation.cities[city].getUnits(aligned,1).length>0){
                        this.tabs.active=9
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
                        this.agency.time=dev.instant?0:10
                    }else if(exists){
                        for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                            let uni=this.operation.cities[this.select.targetCity].units[a]
                            if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                uni.remove=true
                                this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                            }
                        }
                        this.tabs.active=10
                        this.battle.circumstance[1]=1
                        let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                        if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                            this.operation.cities[this.select.targetCity].raided()
                        }
                        this.agency.time=0
                    }
                }else{
                    this.turn.timer=30
                    let rule=findName(this.operation.cities[city].data.rule,types.team)
                    if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                        this.operation.cities[city].raided()
                    }
                }
            }else if(this.tabs.active==12&&types.city[this.select.targetCity].connect.some(connection=>{return connection.name==types.city[city].name})){
                this.select.secondaryCity=city
                this.operation.zoom.shift.position.x=types.city[city].loc[0]
                this.operation.zoom.shift.position.y=types.city[city].loc[1]
                this.operation.zoom.shift.active=true
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
                        a--
                        la--
                    }else{
                        base.remove=true
                    }
                    if(this.operation.cities[city].getNotUnits([base.team,...types.team[base.team].allies]).length>0){
                        last(this.operation.cities[city].units).removeMark=true
                        //flag p for prisoner
                    }
                }
                this.turn.timer=30
            }else if(this.tabs.active==13&&types.city[this.select.city].connect.some(connection=>{return connection.name==types.city[city].name})){
                this.select.targetCity=city
                this.operation.zoom.shift.position.x=types.city[city].loc[0]
                this.operation.zoom.shift.position.y=types.city[city].loc[1]
                this.operation.zoom.shift.active=true
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
                    if(this.operation.cities[city].getNotUnits([base.team,...types.team[base.team].allies]).length>0){
                        last(this.operation.cities[city].units).removeMark=true
                        //flag p for prisoner
                    }
                }
                this.turn.timer=30
            }else if(!this.turn.locked&&!this.turn.pinned&&!(this.tabs.active==1&&this.select.city==city)){
                if(this.tabs.active==5){
                    this.updateVisibility()
                }
                this.tabs.active=1
                this.select.city=city
                this.operation.zoom.shift.position.x=types.city[city].loc[0]
                this.operation.zoom.shift.position.y=types.city[city].loc[1]
                this.operation.zoom.shift.active=true
                this.select.trigger=true
            }
        }
    }
    updateVisibility(){
        this.operation.cities.forEach(city=>city.updateVisibility(this.turn.main))
    }
    display(layer,scene){
        layer.noStroke()
        switch(scene){
            case `setup`:
                layer.fill(150)
                layer.rect(layer.width*0.5,layer.height*0.5,layer.width,layer.height)
                layer.push()
                layer.translate(layer.width*0.5,0)
                layer.fill(0)
                layer.textSize(48)
                layer.text(`Pick Player Factions`,0,100)
                for(let a=0,la=types.team.length;a<la;a++){
                    layer.fill(120,types.team[a].auto?120:200,120)
                    layer.rect(-125+250*(a%2),floor(a/2)*60+180,240,50,10)
                    layer.fill(0)
                    layer.textSize(20)
                    layer.text(`${types.team[a].name}`,-125+250*(a%2),floor(a/2)*60+180)
                    layer.textSize(10)
                    layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[a],100-125+250*(a%2),floor(a/2)*60+165)
                }
                layer.fill(120)
                layer.rect(0,floor((types.team.length+1)/2)*60+210,240,50,10)
                layer.fill(0)
                layer.textSize(20)
                layer.text(`Begin`,0,floor((types.team.length+1)/2)*60+210)
                layer.textSize(10)
                layer.text(`Enter`,100,floor((types.team.length+1)/2)*60+195)
                layer.pop()
            break
            case `main`:
                let aligned=[this.turn.main,...types.team[this.turn.main].allies]
                layer.fill(120)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                this.tabs.anim.forEach((anim,index)=>{
                    layer.fill(150)
                    layer.rect(layer.width+this.width*0.5-this.width*anim,layer.height*0.5,this.width,layer.height)
                    if(anim>0){
                        layer.push()
                        layer.translate(layer.width+this.width*0.5-this.width*anim,0)
                        let cit
                        let tick=75
                        let count=1
                        switch(index){
                            case 0:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Current Player:\n${types.team[this.turn.main].name}`,0,40)

                                layer.textSize(18)
                                layer.text(`Turns Left: ${this.turn.count+1}`,0,tick+12.5)
                                tick+=25
                                for(let a=0,la=3;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text([`Pass`,`Alliances`,`Map`][a],0,tick+25)
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
                                if(cit.owner==types.team[this.turn.main].name&&cit.data.name==`Ulm`){
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
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    if(
                                        cit.units[a].type==0&&(
                                            cit.units[a].team==this.turn.main||
                                            types.team[this.turn.main].allies.includes(cit.units[a].team)
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
                                for(let a=0,la=types.team[this.turn.main].allies.length;a<la;a++){
                                    layer.fill(120)
                                    layer.rect(0,tick+25,160,40,10)
                                    layer.fill(0)
                                    layer.textSize(15)
                                    layer.text(`Break Alliance With\n${types.team[types.team[this.turn.main].allies[a]].name}`,0,tick+25)
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
                            break
                            case 6:
                                layer.fill(0)
                                layer.textSize(24)
                                layer.text(`Make\nAlliances`,0,40)
                                for(let a=0,la=types.team.length;a<la;a++){
                                    if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                                        layer.fill(120)
                                        layer.rect(0,tick+21,160,32,10)
                                        layer.fill(0)
                                        layer.textSize(12)
                                        layer.text(`${types.team[a].offers.includes(this.turn.main)?`Accept Alliance With`:types.team[this.turn.main].offers.includes(a)?`Pending Alliance With`:`Offer Alliance to`}\n${types.team[a].name}`,0,tick+22.5)
                                        layer.textSize(10)
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                        tick+=42
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
                                    if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                                        layer.fill(120)
                                        layer.rect(0,tick+21,160,32,10)
                                        layer.fill(0)
                                        layer.textSize(12)
                                        layer.text(`Delegate to\n${types.team[a].name}`,0,tick+22.5)
                                        layer.textSize(10)
                                        layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count],70,tick+15)
                                        tick+=42
                                        count++
                                    }
                                }
                            break
                        }
                        layer.pop()
                    }
                })
            break
            case `map`:
                layer.fill(150)
                layer.rect(layer.width-this.width*0.5,layer.height*0.5,this.width,layer.height)
                layer.push()
                layer.translate(layer.width-this.width*0.5,0)
                let tick=75
                let count=1
                layer.fill(0)
                layer.textSize(24)
                layer.text(`Viewing Map`,0,40)
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
                layer.pop()
            break
        }
    }
    update(layer,scene){
        switch(scene){
            case `main`:
                this.select.trigger=false
                if(!dev.close){
                    this.tabs.anim.forEach((anim,index,array)=>{
                        array[index]=smoothAnim(anim,this.tabs.active==index,0,1,5)
                    })
                }
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
                let aligned=[this.turn.main,...types.team[this.turn.main].allies]
                let cit
                let playing=this.turn.main
                if(this.agency.time>0){
                    this.agency.time--
                }else if(this.turn.timer<=0&&!dev.pause){
                    switch(this.tabs.active){
                        case 0:
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
                                    this.tabs.active=1
                                    this.select.city=city
                                    this.operation.zoom.shift.position.x=types.city[city].loc[0]
                                    this.operation.zoom.shift.position.y=types.city[city].loc[1]
                                    this.operation.zoom.shift.active=true
                                    this.select.trigger=true
                                    this.agency.time=dev.instant?0:10
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
                                            if(cit.data.rule==types.team[this.turn.main].name){
                                                if(cit.getNotUnits(aligned).length<=0){
                                                    if(cit.getSpawn(0)>0){
                                                        cit.spawn(0)
                                                        this.turn.timer=30
                                                        this.agency.time=dev.instant?0:10
                                                        c=lc
                                                        moved=true
                                                    }
                                                }else{
                                                    if(cit.getSpawn(1)>0){
                                                        this.turn.pinned=true
                                                        this.tabs.active=8
                                                        this.battle.circumstance=[2]
                                                        this.select.targetCity=this.select.city
                                                        if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],0).length>0){
                                                            cit.spawn(1)
                                                            this.select.moved=[last(cit.units)]
                                                            this.tabs.active=10
                                                            this.battle.circumstance[1]=1
                                                            let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                                                            if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                                                                this.operation.cities[this.select.targetCity].raided()
                                                            }
                                                            this.agency.time=0
                                                        }else if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],1).length>0){
                                                            cit.spawn(1)
                                                            this.select.moved=[last(cit.units)]
                                                            this.tabs.active=9
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
                                                        this.agency.time=dev.instant?0:10
                                                        c=lc
                                                        moved=true
                                                    }
                                                }
                                            }else if(cit.owner==types.team[this.turn.main].name){
                                                if(cit.getNotUnits(aligned).length<=0){
                                                    if(cit.getSpawn(2)>0){
                                                        cit.spawn(2)
                                                        this.turn.timer=30
                                                        this.agency.time=dev.instant?0:10
                                                        c=lc
                                                        moved=true
                                                    }
                                                }
                                            }
                                        break
                                        case 1:
                                            if(cit.getUnits([this.turn.main]).length>0){
                                                if(cit.getUnits([this.turn.main],0).length>0){
                                                    this.tabs.active=3
                                                    cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&aligned.includes(unit.team)?unit.value:0;unit.edit.active=false})
                                                    this.agency.time=dev.instant?0:10
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                        case 2:
                                            if(cit.getUnits([this.turn.main]).length>0&&!this.agency.reorg){
                                                if(cit.getNotUnits(aligned).length<=0){
                                                    this.tabs.active=2
                                                    this.agency.reorg=true
                                                    cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                                                    this.agency.time=dev.instant?0:10
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                        case 3:
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
                                                this.tabs.active=1
                                                this.select.city=city
                                                this.operation.zoom.shift.position.x=types.city[city].loc[0]
                                                this.operation.zoom.shift.position.y=types.city[city].loc[1]
                                                this.operation.zoom.shift.active=true
                                                this.select.trigger=true
                                                this.agency.count++
                                            }
                                            this.agency.time=0
                                            c=lc
                                            moved=true
                                        break
                                        case 4:
                                            if(cit.getUnits([this.turn.main]).length>0){
                                                if(cit.getNotUnits(aligned).length>0){
                                                    this.turn.pinned=true
                                                    this.tabs.active=9
                                                    this.select.battleCity=this.select.city
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
                                                    this.agency.time=dev.instant?0:10
                                                    c=lc
                                                    moved=true
                                                }
                                            }
                                        break
                                    }
                                }
                                if(!moved){
                                    if(this.agency.count>=10&&!this.turn.locked&&!this.turn.pinned){
                                        let possible=[]
                                        for(let a=0,la=this.operation.cities.length;a<la;a++){
                                            if(this.operation.cities[a].data.rule==types.team[this.turn.main].name||this.operation.cities[a].owner==types.team[this.turn.main].name&&this.operation.cities[a].getNotUnits(aligned).length<=0){
                                                possible.push(a)
                                            }
                                        }
                                        this.select.city=randin(possible)
                                        cit=this.operation.cities[this.select.city]
                                        let spawned=false
                                        if(types.team[this.turn.main].name!=cit.data.rule&&!(cit.owner==types.team[this.turn.main].name&&cit.getNotUnits(aligned).length<=0)){
                                            print(cit,this.turn.main,types.team[this.turn.main])
                                            throw new Error('Autorebel Alignment Fail')
                                        }
                                        if(cit.data.rule==types.team[this.turn.main].name){
                                            if(cit.getNotUnits(aligned).length<=0){
                                                if(cit.getSpawn(0)>0){
                                                    cit.spawn(0)
                                                    this.turn.timer=30
                                                    spawned=true
                                                }
                                            }else{
                                                if(cit.getSpawn(1)>0){
                                                    this.turn.pinned=true
                                                    this.tabs.active=8
                                                    this.battle.circumstance=[2]
                                                    this.select.targetCity=this.select.city
                                                    if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],0).length>0){
                                                        cit.spawn(1)
                                                        this.select.moved=[last(cit.units)]
                                                        this.tabs.active=10
                                                        this.battle.circumstance[1]=1
                                                        let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                                                        if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                                                            this.operation.cities[this.select.targetCity].raided()
                                                        }
                                                        this.agency.time=0
                                                    }else if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],1).length>0){
                                                        cit.spawn(1)
                                                        this.select.moved=[last(cit.units)]
                                                        this.tabs.active=9
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
                                                    spawned=true
                                                }
                                            }
                                            this.agency.time=dev.instant?0:10
                                        }else if(cit.owner==types.team[this.turn.main].name){
                                            if(cit.getNotUnits(aligned).length<=0){
                                                if(cit.getSpawn(2)>0){
                                                    cit.spawn(2)
                                                    this.turn.timer=30
                                                    spawned=true
                                                }
                                            }
                                            this.agency.time=dev.instant?0:10
                                        }
                                        if(spawned){
                                            this.operation.zoom.shift.position.x=types.city[this.select.city].loc[0]
                                            this.operation.zoom.shift.position.y=types.city[this.select.city].loc[1]
                                            this.operation.zoom.shift.active=true
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
                                            this.tabs.active=1
                                            this.select.city=city
                                            this.operation.zoom.shift.position.x=types.city[city].loc[0]
                                            this.operation.zoom.shift.position.y=types.city[city].loc[1]
                                            this.operation.zoom.shift.active=true
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
                                    for(let a=0,la=cit.units.length;a<la;a++){
                                        if(cit.units[a].type==1&&cit.units[a].team==this.team&&this.agency.lastResult[0]>=100){
                                            this.turn.locked=true
                                            let move=min(round(this.agency.lastResult[0]/100)*100,cit.units[a].value-round(random(2.5,10))*100)
                                            if(move>0){
                                                cit.units[a].edit.trigger=false
                                                cit.units[a].value-=move
                                                cit.units.splice(a+1,0,new unit(cit,cit.units[a].team,1-cit.units[a].type,move))
                                                cit.units[a+1].position.y=cit.units[a].position.y
                                                if(cit.units[a].value<=0){
                                                    cit.units[a].remove=true
                                                }
                                            }
                                            this.agency.lastResult[0]-=move
                                            if(this.agency.lastResult[0]<0){
                                                break
                                            }
                                        }
                                    }
                                    for(let a=0,la=cit.units.length;a<la;a++){
                                        if(cit.units[a].type==1&&aligned.includes(cit.units[a].team)&&this.agency.lastResult[0]>=100){
                                            this.turn.locked=true
                                            let move=min(round(this.agency.lastResult[0]/100)*100,cit.units[a].value-round(random(2.5,10))*100)
                                            if(move>0){
                                                cit.units[a].edit.trigger=false
                                                cit.units[a].value-=move
                                                cit.units.splice(a+1,0,new unit(cit,cit.units[a].team,1-cit.units[a].type,move))
                                                cit.units[a+1].position.y=cit.units[a].position.y
                                                if(cit.units[a].value<=0){
                                                    cit.units[a].remove=true
                                                }
                                            }
                                            this.agency.lastResult[0]-=move
                                            if(this.agency.lastResult[0]<0){
                                                break
                                            }
                                        }
                                    }
                                }else if(this.agency.lastResult[0]<=-100){
                                    for(let a=0,la=cit.units.length;a<la;a++){
                                        if(cit.units[a].type==0&&cit.units[a].team==this.team&&this.agency.lastResult[0]<=-100){
                                            this.turn.locked=true
                                            let move=min(round(-this.agency.lastResult[0]/100)*100,cit.units[a].value)
                                            if(move>0){
                                                cit.units[a].edit.trigger=false
                                                cit.units[a].value-=move
                                                cit.units.splice(a+1,0,new unit(cit,cit.units[a].team,1-cit.units[a].type,move))
                                                cit.units[a+1].position.y=cit.units[a].position.y
                                                if(cit.units[a].value<=0){
                                                    cit.units[a].remove=true
                                                }
                                            }
                                            this.agency.lastResult[0]+=move
                                            if(this.agency.lastResult[0]>0){
                                                break
                                            }
                                        }
                                    }
                                    for(let a=0,la=cit.units.length;a<la;a++){
                                        if(cit.units[a].type==0&&aligned.includes(cit.units[a].team)&&this.agency.lastResult[0]<=-100){
                                            this.turn.locked=true
                                            let move=min(round(-this.agency.lastResult[0]/100)*100,cit.units[a].value)
                                            if(move>0){
                                                cit.units[a].edit.trigger=false
                                                cit.units[a].value-=move
                                                cit.units.splice(a+1,0,new unit(cit,cit.units[a].team,1-cit.units[a].type,move))
                                                cit.units[a+1].position.y=cit.units[a].position.y
                                                if(cit.units[a].value<=0){
                                                    cit.units[a].remove=true
                                                }
                                            }
                                            this.agency.lastResult[0]+=move
                                            if(this.agency.lastResult[0]>0){
                                                break
                                            }
                                        }
                                    }
                                }
                                this.tabs.active=this.turn.locked?1:0
                                this.agency.time=dev.instant?0:10
                            }
                        break
                        case 3:
                            if(types.team[this.turn.main].auto){
                                //this code forces leaving a garrison, but it doesn't seem necessary
                                /*if(!this.operation.cities[this.select.city].units.some(unit=>!aligned.includes(unit.team)||unit.type==1)){
                                    this.operation.cities[this.select.city].units.forEach(unit=>unit.edit.num=ceil((unit.edit.num-min(round(random(2.5,10))*100,unit.edit.num*random(0.25,0.5)))/100yy)*100)
                                }*/
                                this.tabs.active=7
                                this.turn.pinned=true
                                if(!this.operation.cities[this.select.city].units.some(unit=>unit.value>0&&unit.edit.num>0)){
                                    throw new Error('Move 0')
                                }
                                if(types.city[this.select.city].connect.length==0){
                                    this.tabs.active=0
                                }else{
                                    this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                    this.agency.count=0
                                }
                            }
                        break
                        case 4: case 6: case 14:
                            if(types.team[this.turn.main].auto){
                                this.tabs.active=0
                                this.agency.time=0
                            }
                        break
                        case 5:
                            if(types.team[this.turn.main].auto){
                                this.tabs.active=0
                                this.updateVisibility()
                                this.agency.time=0
                                this.agency.count=0
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
                                this.agency.lastResult=this.agents[this.turn.main].execute(1,[
                                    this.agency.count,
                                    this.turn.count,
                                    cit.owner==types.team[this.turn.main].name?1:0,
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
                                    !types.city[cit.type].connect.some(item=>!aligned.includes(this.operation.cities[findName(item.name,types.city)].owner))?1:0
                                ])
                                if(this.agency.lastResult[0]>0){
                                    this.agency.time=dev.instant?0:10
                                    this.cityClick(layer,{position:{x:0,y:0}},this.select.targetCity)
                                }else{
                                    if(this.agency.count>=10){
                                        this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                        this.agency.time=dev.instant?0:10
                                        this.cityClick(layer,{position:{x:0,y:0}},this.select.targetCity)
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
                                    this.tabs.active=9
                                    this.select.battleCity=this.select.targetCity
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==1&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
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
                                    this.agency.time=dev.instant?0:10
                                }else{
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let uni=this.operation.cities[this.select.targetCity].units[a]
                                        if(uni.type==0&&!aligned.includes(uni.team)&&!uni.remove){
                                            uni.remove=true
                                            this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                        }
                                    }
                                    this.tabs.active=10
                                    this.battle.circumstance[1]=1
                                    let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                                    if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                                        this.operation.cities[this.select.targetCity].raided()
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
                                    this.tabs.active=9
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
                                    this.agency.time=dev.instant?0:10
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
                                    this.tabs.active=12
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
                                    this.operation.cities[this.select.targetCity].sieged+=2
                                    this.tabs.active=10
                                    this.battle.circumstance[1]=1
                                    this.agency.time=0
                                }
                            }
                        break
                        case 12:
                            playing=this.operation.cities[this.select.targetCity].getMostNotUnit(aligned)
                            if(types.team[playing].auto){
                                let newAligned=[playing,...types.team[playing].allies]
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
                                    this.agency.time=dev.instant?0:10
                                    this.cityClick(layer,{position:{x:0,y:0}},this.select.secondaryCity)
                                }else{
                                    if(this.agency.count>=10){
                                        this.select.secondaryCity=findName(randin(types.city[this.select.targetCity].connect).name,types.city)
                                        this.agency.time=dev.instant?0:10
                                        this.cityClick(layer,{position:{x:0,y:0}},this.select.secondaryCity)
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
                                let newAligned=[playing,...types.team[playing].allies]
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
                                    this.agency.time=dev.instant?0:10
                                    this.cityClick(layer,{position:{x:0,y:0}},this.select.targetCity)
                                }else{
                                    if(this.agency.count>=10){
                                        this.select.targetCity=findName(randin(types.city[this.select.city].connect).name,types.city)
                                        this.agency.time=dev.instant?0:10
                                        this.cityClick(layer,{position:{x:0,y:0}},this.select.targetCity)
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
                    }
                }
            break
        }
    }
    onClick(layer,mouse,scene){
        let rel
        let tick
        switch(scene){
            case `setup`:
                rel={position:{x:mouse.position.x-layer.width*0.5,y:mouse.position.y}}
                for(let a=0,la=types.team.length;a<la;a++){
                    if(inPointBox(rel,boxify(-125+250*(a%2),floor(a/2)*60+180,240,50,10))){
                        types.team[a].auto=!types.team[a].auto
                    }
                }
                if(inPointBox(rel,boxify(0,floor((types.team.length+1)/2)*60+210,240,50,10))){
                    this.initialAgents()
                    this.newTurn()
                    this.operation.transitionManager.begin(`main`)
                }
            break
            case `main`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                if(mouse.position.x<layer.width-this.width&&!this.turn.pinned){
                    if(this.tabs.active==5){
                        this.updateVisibility()
                    }
                    if(!this.select.trigger){
                        this.tabs.active=this.turn.locked?1:0
                    }
                }
                let aligned=[this.turn.main,...types.team[this.turn.main].allies]
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
                                this.tabs.active=4
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.operation.transitionManager.begin(`map`)
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
                                    this.turn.count=0
                                    this.newTurn()
                                }
                                tick+=50
                            }
                            if(cit.owner==types.team[this.turn.main].name&&cit.data.name==`Ulm`){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    this.tabs.active=14
                                }
                                tick+=50
                            }
                            if(cit.data.rule==types.team[this.turn.main].name){
                                if(cit.getNotUnits(aligned).length<=0){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))&&cit.getSpawn(0)>0){
                                        cit.spawn(0)
                                        this.turn.timer=30
                                    }
                                }else{
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))&&cit.getSpawn(1)>0){
                                        this.turn.pinned=true
                                        this.tabs.active=8
                                        this.battle.circumstance=[2]
                                        this.select.targetCity=this.select.city
                                        if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],0).length>0){
                                            cit.spawn(1)
                                            this.select.moved=[last(cit.units)]
                                            this.tabs.active=10
                                            this.battle.circumstance[1]=1
                                            let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                                            if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                                                this.operation.cities[this.select.targetCity].raided()
                                            }
                                            this.agency.time=0
                                        }else if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],1).length>0){
                                            cit.spawn(1)
                                            this.select.moved=[last(cit.units)]
                                            this.tabs.active=9
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
                                        break
                                    }
                                }
                                tick+=50
                            }else if(cit.owner==types.team[this.turn.main].name){
                                if(cit.getNotUnits(aligned).length<=0){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))&&cit.getSpawn(2)>0){
                                        cit.spawn(2)
                                        this.turn.timer=30
                                    }
                                    tick+=50
                                }
                            }
                            if(cit.getUnits([this.turn.main]).length>0){
                                if(cit.getUnits([this.turn.main],0).length>0){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.tabs.active=3
                                        cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&aligned.includes(unit.team)?unit.value:0;unit.edit.active=false})
                                    }
                                    tick+=50
                                }
                                if(cit.getNotUnits(aligned).length<=0){
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.tabs.active=2
                                        cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                                    }
                                    tick+=50
                                }else{
                                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                        this.turn.pinned=true
                                        this.tabs.active=9
                                        this.select.battleCity=this.select.city
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
                                    }
                                    tick+=50
                                }
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
                                            types.team[this.turn.main].allies.includes(cit.units[a].team)
                                        )&&
                                        cit.units[a].edit.num>0
                                    ){
                                        this.tabs.active=7
                                        this.turn.pinned=true
                                        break
                                    }
                                }
                            }
                            tick+=50
                            for(let a=0,la=cit.units.length;a<la;a++){
                                if(
                                    cit.units[a].type==0&&(
                                        cit.units[a].team==this.turn.main||
                                        types.team[this.turn.main].allies.includes(cit.units[a].team)
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
                                this.tabs.active=6
                            }
                            tick+=50
                            for(let a=0,la=types.team[this.turn.main].allies.length;a<la;a++){
                                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                    types.team[types.team[this.turn.main].allies[a]].allies.splice(types.team[types.team[this.turn.main].allies[a]].allies.indexOf(this.turn.main),1)
                                    types.team[this.turn.main].allies.splice(a,1)
                                }
                                tick+=50
                            }
                        break
                        case 5:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.tabs.active=0
                                this.updateVisibility()
                            }
                            tick+=50
                        break
                        case 6:
                            for(let a=0,la=types.team.length;a<la;a++){
                                if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                                    if(inPointBox(rel,boxify(0,tick+21,160,32))){
                                        if(types.team[a].offers.includes(this.turn.main)){
                                            types.team[a].allies.push(this.turn.main)
                                            types.team[this.turn.main].allies.push(a)
                                            types.team[a].offers.splice(types.team[a].offers.indexOf(this.turn.main),1)
                                        }else{
                                            types.team[this.turn.main].offers.push(a)
                                        }
                                        this.newTurn()
                                    }
                                    tick+=42
                                }
                            }
                        break
                        case 8:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.tabs.active=9
                                this.select.battleCity=this.select.targetCity
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let uni=this.operation.cities[this.select.targetCity].units[a]
                                    if(uni.type==1&&!aligned.includes(uni.team)&&!uni.remove){
                                        uni.remove=true
                                        this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                    }
                                }
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
                                this.tabs.active=10
                                this.battle.circumstance[1]=1
                                let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                                if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                                    this.operation.cities[this.select.targetCity].raided()
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
                                this.tabs.active=9
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
                            }
                            tick+=50
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.newTurn()
                            }
                            tick+=50
                        break
                        case 11:
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.tabs.active=12
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
                                this.operation.cities[this.select.targetCity].sieged+=2
                                this.tabs.active=10
                                this.battle.circumstance[1]=1
                            }
                            tick+=50
                        break
                        case 14:
                            for(let a=0,la=types.team.length;a<la;a++){
                                if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                                    if(inPointBox(rel,boxify(0,tick+21,160,32))){
                                        let ct=this.turn.count
                                        this.turn.count=0
                                        this.newTurn()
                                        this.turn.main=a
                                        this.turn.count=ct
                                    }
                                    tick+=42
                                }
                            }
                        break
                    }
                }
            break
            case `map`:
                rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
                tick=75
                if(inPointBox(rel,boxify(0,tick+25,160,40))){
                    this.operation.transitionManager.begin(`main`)
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
                    this.operation.loadCol()
                }
                tick+=50
            break
        }
    }
    onKey(layer,key,scene){
        let count=1
        switch(scene){
            case `setup`:
                for(let a=0,la=types.team.length;a<la;a++){
                    if(key==`abcdefghijklmnopqrstuvwxyz`[a]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[a]){
                        types.team[a].auto=!types.team[a].auto
                    }
                }
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                    this.initialAgents()
                    this.newTurn()
                }else if(key==`Shift`){
                    types.team.forEach(team=>team.auto=!team.auto)
                }
            break
            case `main`:
                let aligned=[this.turn.main,...types.team[this.turn.main].allies]
                let cit
                switch(this.tabs.active){
                    case 0:
                        if(key==count.toString()){
                            this.turn.count=0
                            this.newTurn()
                        }
                        count++
                        if(key==count.toString()){
                            this.tabs.active=4
                        }
                        count++  
                        if(key==count.toString()){
                            this.operation.transitionManager.begin(`map`)
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
                                this.turn.count=0
                                this.newTurn()
                            }
                            count++
                        }
                        if(cit.owner==types.team[this.turn.main].name&&cit.data.name==`Ulm`){
                            if(key==count.toString()){
                                this.tabs.active=14
                            }
                            count++
                        }
                        if(cit.data.rule==types.team[this.turn.main].name){
                            if(cit.getNotUnits(aligned).length<=0){
                                if(key==count.toString()&&cit.getSpawn(0)>0){
                                    cit.spawn(0)
                                    this.turn.timer=30
                                }
                            }else{
                                if(key==count.toString()&&cit.getSpawn(1)>0){
                                    this.turn.pinned=true
                                    this.tabs.active=8
                                    this.battle.circumstance=[2]
                                    this.select.targetCity=this.select.city
                                    if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],0).length>0){
                                        cit.spawn(1)
                                        this.select.moved=[last(cit.units)]
                                        this.tabs.active=10
                                        this.battle.circumstance[1]=1
                                        let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                                        if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                                            this.operation.cities[this.select.targetCity].raided()
                                        }
                                        this.agency.time=0
                                    }else if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies],1).length>0){
                                        cit.spawn(1)
                                        this.select.moved=[last(cit.units)]
                                        this.tabs.active=9
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
                                    break
                                }
                            }
                            count++
                        }else if(cit.owner==types.team[this.turn.main].name){
                            if(cit.getNotUnits(aligned).length<=0){
                                if(key==count.toString()&&cit.getSpawn(2)>0){
                                    cit.spawn(2)
                                    this.turn.timer=30
                                }
                                count++
                            }
                        }
                        if(cit.getUnits([this.turn.main]).length>0){
                            if(cit.getUnits([this.turn.main],0).length>0){
                                if(key==count.toString()){
                                    this.tabs.active=3
                                    cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&aligned.includes(unit.team)?unit.value:0;unit.edit.active=false})
                                }
                                count++
                            }
                            if(cit.getNotUnits(aligned).length<=0){
                                if(key==count.toString()){
                                    this.tabs.active=2
                                    cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                                }
                                count++
                            }else{
                                if(key==count.toString()){
                                    this.turn.pinned=true
                                    this.tabs.active=9
                                    this.select.battleCity=this.select.city
                                    cit.sieged++
                                    this.operation.calc.terrain.list=cit.getUnits([this.turn.main],1).length>0?[]:[2]
                                    for(let a=0,la=cit.units.length;a<la;a++){
                                        let unit=cit.units[a]
                                        if(unit.remove){
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
                                }
                                count++
                            }
                        }
                    break
                    case 2:
                        cit=this.operation.cities[this.select.city]
                        for(let a=0,la=cit.units.length;a<la;a++){
                            if(cit.units[a].edit.trigger){
                                if(`1234567890`.includes(key)){
                                    cit.units[a].edit.num=min(100000,cit.units[a].edit.num*10+int(key)*100)
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
                                    cit.units[a].edit.num=min(100000,cit.units[a].edit.num*10+int(key)*100)
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
                                        types.team[this.turn.main].allies.includes(cit.units[a].team)
                                    )&&
                                    cit.units[a].edit.num>0
                                ){
                                    this.tabs.active=7
                                    this.turn.pinned=true
                                    break
                                }
                            }
                        }
                    break
                    case 4:
                        if(key==count.toString()){
                            this.tabs.active=6
                        }
                        count++
                        for(let a=0,la=types.team[this.turn.main].allies.length;a<la;a++){
                            if(key==count.toString()){
                                types.team[types.team[this.turn.main].allies[a]].allies.splice(types.team[types.team[this.turn.main].allies[a]].allies.indexOf(this.turn.main),1)
                                types.team[this.turn.main].allies.splice(a,1)
                            }
                            count++
                        }
                    break
                    case 5:
                        if(key==`Enter`){
                            this.tabs.active=0
                            this.updateVisibility()
                        }
                    break
                    case 6:
                        for(let a=0,la=types.team.length;a<la;a++){
                            if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                                if(key==`abcdefghijklmnopqrstuvwxyz`[count-1]||key==`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1]){
                                    if(types.team[a].offers.includes(this.turn.main)){
                                        types.team[a].allies.push(this.turn.main)
                                        types.team[this.turn.main].allies.push(a)
                                        types.team[a].offers.splice(types.team[a].offers.indexOf(this.turn.main),1)
                                    }else{
                                        types.team[this.turn.main].offers.push(a)
                                    }
                                    this.newTurn()
                                }
                                count++
                            }
                        }
                    break
                    case 8:
                        if(key==count.toString()){
                            this.tabs.active=9
                            this.select.battleCity=this.select.targetCity
                            for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                let uni=this.operation.cities[this.select.targetCity].units[a]
                                if(uni.type==1&&!aligned.includes(uni.team)&&!uni.remove){
                                    uni.remove=true
                                    this.operation.cities[this.select.targetCity].units.splice(a,0,new unit(uni.city,uni.team,1-uni.type,uni.value))
                                }
                            }
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
                            this.tabs.active=10
                            this.battle.circumstance[1]=1
                            let rule=findName(this.operation.cities[this.select.targetCity].data.rule,types.team)
                            if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                                this.operation.cities[this.select.targetCity].raided()
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
                            this.tabs.active=9
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
                        }
                        count++
                        if(key==count.toString()){
                            this.newTurn()
                        }
                        count++
                    break
                    case 11:
                        if(key==count.toString()){
                            this.tabs.active=12
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
                            this.operation.cities[this.select.targetCity].sieged+=2
                            this.tabs.active=10
                            this.battle.circumstance[1]=1
                        }
                        count++
                    break
                    case 14:
                        for(let a=0,la=types.team.length;a<la;a++){
                            if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
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
                if(key==`Enter`){
                    this.operation.transitionManager.begin(`main`)
                }
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
                    this.operation.loadCol()
                }
            break
        }
    }
}