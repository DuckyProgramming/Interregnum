class ui{
    constructor(operation){
        this.operation=operation
        this.width=200
        this.tabs={active:0,anim:[]}
        this.turn={main:-1,total:0,timer:0,locked:false,pinned:false}
        this.select={city:-1,targetCity:-1,secondaryCity:-1,moved:[]}
        this.battle={result:0,circumstance:[]}
        /*
        [0,0] - Attacking City
        [0,1] - Attacking and Besieging City
        [1,1] - Conduct from Siege
        [1,2] - Breakout from Siege
        [2,0] - Rebel Against Enemy Force
        [2,1] - Rebels Besiege City
        */
        for(let a=0,la=15;a<la;a++){
            this.tabs.anim.push(0)
        }
        this.newTurn()
    }
    newTurn(){
        let total=0
        types.team.forEach((team,index)=>{if(index!=this.turn.main){total+=team.chance}})
        let roll=random(0,total)
        let ticker=0
        while(roll>=types.team[ticker].chance||ticker==this.turn.main){
            if(ticker!=this.turn.main){
                roll-=types.team[ticker].chance
            }
            ticker++
        }
        this.turn.main=ticker
        this.turn.total++
        this.turn.timer=0
        this.turn.locked=false
        this.turn.pinned=false
        this.tabs.active=5
        this.operation.cities.forEach(city=>city.nextTurn())
        this.operation.cities.forEach(city=>city.visibility=0)
    }
    accept(){
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
                    if(unit.team==this.battle.result.casualties[a][b].team&&unit.type==0){
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
                        if(unit.team==this.battle.result.casualties[a][b].team&&unit.type==1){
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
        if(this.battle.circumstance[0]==0){
            if(this.battle.circumstance[1]==0){
                if(last(this.battle.result.winner)==1){
                    if(this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length>0){
                        this.tabs.active=11
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
                    this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).forEach(unit=>unit.remove=true)
                    //flag p for prisoner
                }
                this.turn.timer=15
            }
        }else if(this.battle.circumstance[0]==1){
            if(this.battle.circumstance[1]==0){
                if(last(this.battle.result.winner)==1){
                    this.operation.cities[this.select.city].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).forEach(unit=>unit.remove=true)
                    //flag p for prisoner
                }
                this.turn.timer=15
            }else if(this.battle.circumstance[1]==1){
                if(last(this.battle.result.winner)==1&&this.operation.cities[this.select.city].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length>0){
                    this.tabs.active=13
                }else{
                    this.turn.timer=15
                }
            }
        }else if(this.battle.circumstance[0]==2){
            if(this.battle.circumstance[1]==0){
                if(last(this.battle.result.winner)==1){
                    if(this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length>0){
                        this.tabs.active=13
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
                    this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).forEach(unit=>unit.remove=true)
                    //flag p for prisoner
                }
                this.turn.timer=15
            }
        }
    }
    cityClick(layer,mouse,city){
        if(mouse.position.x<layer.width-this.width){
            if(this.tabs.active==7&&types.city[this.select.city].connect.some(connection=>{return connection.name==types.city[city].name})){
                this.select.moved=[]
                this.select.targetCity=city
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
                    }
                }
                if(this.operation.cities[city].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length>0){
                    this.tabs.active=8
                    this.battle.circumstance=[0]
                    for(let a=0,la=types.city[this.select.city].connect.length;a<la;a++){
                        if(types.city[this.select.city].connect[a].name==types.city[city].name){
                            this.operation.calc.terrain.list=types.city[this.select.city].connect[a].type==1?[1]:[]
                        }
                    }
                }else{
                    this.turn.timer=30
                    let rule=findName(this.operation.cities[city].data.rule,types.team)
                    print(rule)
                    if(rule!=this.turn.main&&!types.team[this.turn.main].allies.includes(rule)){
                        this.operation.cities[city].raided()
                    }
                }
            }else if(this.tabs.active==12&&types.city[this.select.targetCity].connect.some(connection=>{return connection.name==types.city[city].name})){
                this.select.secondaryCity=city
                let set=this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies])
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
                let set=this.operation.cities[this.select.city].getNotUnits([this.turn.main,...types.team[this.turn.main].allies])
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
            }else if(!this.turn.locked&&!this.turn.pinned){
                if(this.tabs.active==5){
                    this.operation.cities.forEach(city=>city.updateVisibility(this.turn.main))
                }
                this.tabs.active=1
                this.select.city=city
            }
        }
    }
    display(layer){
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

                        layer.fill(120)
                        layer.rect(0,tick+25,160,40,10)
                        layer.fill(0)
                        layer.textSize(15)
                        layer.text(`Pass`,0,tick+25)
                        layer.textSize(10)
                        layer.text(count,70,tick+15)
                        tick+=50
                        count++

                        layer.fill(120)
                        layer.rect(0,tick+25,160,40,10)
                        layer.fill(0)
                        layer.textSize(15)
                        layer.text(`Alliances`,0,tick+25)
                        layer.textSize(10)
                        layer.text(count,70,tick+15)
                        tick+=50
                        count++
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
                        if(cit.data.name==`Ulm`){
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
                        if(
                            cit.data.rule==types.team[this.turn.main].name
                        ){
                            layer.fill(120)
                            layer.rect(0,tick+25,160,40,10)
                            layer.fill(0)
                            layer.textSize(15)
                            layer.text(cit.getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length>0?`Rebel With ${cit.getSpawn(1)} Troops`:`Recruit ${cit.getSpawn(0)} Troops`,0,tick+25)
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
                            layer.text(cit.getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length<=0?`Reorganize`:cit.getUnits([this.turn.main],1).length>0?`Break Out`:`Storm the City`,0,tick+25)
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
                            layer.text(`${cit.units[a].value} ${['Army','Garrison'][cit.units[a].type]}\n${types.team[cit.units[a].team].name}`,0,tick+25)
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
                        layer.text('Enter',60,tick+15)
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
                        layer.text('Enter',60,tick+15)
                        tick+=50
                    break
                    case 6:
                        layer.fill(0)
                        layer.textSize(24)
                        layer.text(`Make\nAlliances`,0,40)
                        for(let a=0,la=types.team.length;a<la;a++){
                            if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                                layer.fill(120)
                                layer.rect(0,tick+22.5,160,35,10)
                                layer.fill(0)
                                layer.textSize(12)
                                layer.text(`${types.team[a].offers.includes(this.turn.main)?`Accept Alliance With`:types.team[this.turn.main].offers.includes(a)?`Pending Alliance With`:`Offer Alliance to`}\n${types.team[a].name}`,0,tick+22.5)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count-1],70,tick+15)
                                tick+=45
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
                        layer.text(`Winner: ${[`Player`,`Opponent`][last(this.battle.result.winner)-1]}`,0,tick+17.5)
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
                                layer.rect(0,tick+22.5,160,35,10)
                                layer.fill(0)
                                layer.textSize(12)
                                layer.text(`Delegate to\n${types.team[a].name}`,0,tick+22.5)
                                layer.textSize(10)
                                layer.text(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`[count],70,tick+15)
                                tick+=45
                                count++
                            }
                        }
                    break
                }
                layer.pop()
            }
        })
    }
    update(layer){
        this.tabs.anim.forEach((anim,index,array)=>{
            array[index]=smoothAnim(anim,this.tabs.active==index,0,1,5)
        })
        if(this.turn.timer>0){
            this.turn.timer--
            if(this.turn.timer<=0){
                this.newTurn()
            }
        }
    }
    onClick(layer,mouse){
        let rel={position:{x:mouse.position.x-layer.width+this.width*0.5,y:mouse.position.y}}
        if(mouse.position.x<layer.width-this.width&&!this.turn.pinned){
            if(this.tabs.active==5){
                this.operation.cities.forEach(city=>city.updateVisibility(this.turn.main))
            }
            this.tabs.active=this.turn.locked?1:0
        }
        let cit
        let tick=75
        if(this.turn.timer<=0){
            switch(this.tabs.active){
                case 0:
                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                        this.newTurn()
                    }
                    tick+=50
                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                        this.tabs.active=4
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
                            this.newTurn()
                        }
                        tick+=50
                    }
                    if(cit.data.name==`Ulm`){
                        if(inPointBox(rel,boxify(0,tick+25,160,40))){
                            this.tabs.active=14
                        }
                        tick+=50
                    }
                    if(
                        cit.data.rule==types.team[this.turn.main].name
                    ){
                        if(cit.getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length<=0){
                            if(inPointBox(rel,boxify(0,tick+25,160,40))&&cit.getSpawn(0)>0){
                                cit.spawn(0)
                                this.turn.timer=30
                            }
                        }else{
                            if(inPointBox(rel,boxify(0,tick+25,160,40))&&cit.getSpawn(1)>0){
                                cit.spawn(1)
                                this.select.moved=[last(cit.units)]
                                this.turn.pinned=true
                                this.tabs.active=8
                                this.battle.circumstance=[2]
                                this.select.targetCity=this.select.city
                                if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies,1]).length>0){
                                    this.tabs.active=9
                                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                        let unit=this.operation.cities[this.select.targetCity].units[a]
                                        let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                                        let fail=true
                                        for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                            if(this.operation.calc.sides[side].force[b].team==unit.team){
                                                this.operation.calc.sides[side].force[b].number+=unit.value
                                                fail=false
                                                break
                                            }
                                        }
                                        if(fail){
                                            this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:0})
                                        }
                                    }
                                    this.operation.calc.sides[1].strategy=1
                                    this.battle.result=this.operation.calc.calc()
                                    this.operation.calc.reset()
                                    this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
                                    this.battle.circumstance[1]=0
                                }
                                break
                            }
                        }
                        tick+=50
                    }
                    if(cit.getUnits([this.turn.main]).length>0){
                        if(cit.getUnits([this.turn.main],0).length>0){
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.tabs.active=3
                                cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&(unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team))?unit.value:0;unit.edit.active=false})
                            }
                            tick+=50
                        }
                        if(cit.getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length<=0){
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.tabs.active=2
                                cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                            }
                            tick+=50
                        }else{
                            if(inPointBox(rel,boxify(0,tick+25,160,40))){
                                this.turn.pinned=true
                                this.tabs.active=9
                                this.operation.calc.terrain.list=cit.getUnits([this.turn.main],1).length>0?[]:[2]
                                for(let a=0,la=cit.units.length;a<la;a++){
                                    let unit=cit.units[a]
                                    let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                                    let fail=true
                                    for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                        if(this.operation.calc.sides[side].force[b].team==unit.team){
                                            this.operation.calc.sides[side].force[b].number+=unit.value
                                            fail=false
                                            break
                                        }
                                    }
                                    if(fail){
                                        this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:side==(cit.getUnits([this.turn.main],1).length>0?0:1)?ceil(cit.sieged):0})
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
                            cit.units[a].edit.num=0
                            cit.units[a].edit.trigger=false
                            cit.units[a].value-=move
                            cit.units.splice(a+1,0,new unit(cit,cit.units[a].team,1-cit.units[a].type,move))
                            cit.units[a+1].position.y=cit.units[a].position.y
                            if(cit.units[a].value<=0){
                                cit.units[a].remove=true
                            }
                            break
                        }
                        cit.units[a].edit.trigger=inPointBox(rel,boxify(-12.5,tick+60,135,20))
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
                            cit.units[a].edit.trigger=inPointBox(rel,boxify(0,tick+60,160,20))
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
                        this.operation.cities.forEach(city=>city.updateVisibility(this.turn.main))
                    }
                    tick+=50
                break
                case 6:
                    for(let a=0,la=types.team.length;a<la;a++){
                        if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                            if(inPointBox(rel,boxify(0,tick+22.5,160,35))){
                                if(types.team[a].offers.includes(this.turn.main)){
                                    types.team[a].allies.push(this.turn.main)
                                    types.team[this.turn.main].allies.push(a)
                                    types.team[a].offers.splice(types.team[a].offers.indexOf(this.turn.main),1)
                                }else{
                                    types.team[this.turn.main].offers.push(a)
                                }
                                this.newTurn()
                            }
                            tick+=45
                        }
                    }
                break
                case 8:
                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                        this.tabs.active=9
                        for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                            let unit=this.operation.cities[this.select.targetCity].units[a]
                            let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                            let fail=true
                            for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                if(this.operation.calc.sides[side].force[b].team==unit.team){
                                    this.operation.calc.sides[side].force[b].number+=unit.value
                                    fail=false
                                    break
                                }
                            }
                            if(fail){
                                this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:0})
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
                        this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).forEach(unit=>unit.type=1)
                        this.tabs.active=10
                        this.battle.circumstance[1]=1
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
                        this.operation.calc.terrain.list=[2]
                        for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                            let unit=this.operation.cities[this.select.targetCity].units[a]
                            let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                            let fail=true
                            for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                if(this.operation.calc.sides[side].force[b].team==unit.team){
                                    this.operation.calc.sides[side].force[b].number+=unit.value
                                    fail=false
                                    break
                                }
                            }
                            if(fail){
                                this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:side==1?ceil(this.operation.cities[this.select.targetCity].sieged):0})
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
                    }
                    tick+=50
                    if(inPointBox(rel,boxify(0,tick+25,160,40))){
                        this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).forEach(unit=>unit.type=1)
                        this.operation.cities[this.select.targetCity].sieged+=2
                        this.tabs.active=10
                        this.battle.circumstance[1]=1
                    }
                    tick+=50
                break
                case 14:
                    for(let a=0,la=types.team.length;a<la;a++){
                        if(a!=this.turn.main&&!types.team[this.turn.main].allies.includes(a)){
                            if(inPointBox(rel,boxify(0,tick+22.5,160,35))){
                                this.newTurn()
                                this.turn.main=a
                            }
                            tick+=45
                        }
                    }
                break
            }
        }
    }
    onKey(){
        let cit
        let count=1
        switch(this.tabs.active){
            case 0:
                if(key==count.toString()){
                    this.newTurn()
                }
                count++
                if(key==count.toString()){
                    this.tabs.active=4
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
                        this.newTurn()
                    }
                    count++
                }
                if(cit.data.name==`Ulm`){
                    if(key==count.toString()){
                        this.tabs.active=14
                    }
                    count++
                }
                if(
                    cit.data.rule==types.team[this.turn.main].name
                ){
                    if(cit.getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length<=0){
                        if(key==count.toString()){
                            cit.spawn(0)
                            this.turn.timer=30
                        }
                    }else{
                        if(key==count.toString()){
                            cit.spawn(1)
                            this.select.moved=[last(cit.units)]
                            this.turn.pinned=true
                            this.tabs.active=8
                            this.battle.circumstance=[2]
                            this.select.targetCity=this.select.city
                            if(cit.getUnits([this.turn.main,...types.team[this.turn.main].allies,1]).length>0){
                                this.tabs.active=9
                                for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                                    let unit=this.operation.cities[this.select.targetCity].units[a]
                                    let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                                    let fail=true
                                    for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                        if(this.operation.calc.sides[side].force[b].team==unit.team){
                                            this.operation.calc.sides[side].force[b].number+=unit.value
                                            fail=false
                                            break
                                        }
                                    }
                                    if(fail){
                                        this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:0})
                                    }
                                }
                                this.operation.calc.sides[1].strategy=1
                                this.battle.result=this.operation.calc.calc()
                                this.operation.calc.reset()
                                this.battle.result.casualties.forEach(set=>set.forEach(item=>item.number=round(item.number/100+random(-0.5,0.5))*100))
                                this.battle.circumstance[1]=0
                            }
                            break
                        }
                    }
                    count++
                }
                if(cit.getUnits([this.turn.main]).length>0){
                    if(cit.getUnits([this.turn.main],0).length>0){
                        if(key==count.toString()){
                            this.tabs.active=3
                            cit.units.forEach(unit=>{unit.edit.num=unit.type==0&&(unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team))?unit.value:0;unit.edit.active=false})
                        }
                        count++
                    }
                    if(cit.getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).length<=0){
                        if(key==count.toString()){
                            this.tabs.active=2
                            cit.units.forEach(unit=>{unit.edit.num=0;unit.edit.active=false})
                        }
                        count++
                    }else{
                        if(key==count.toString()){
                            this.turn.pinned=true
                            this.tabs.active=9
                            this.operation.calc.terrain.list=cit.getUnits([this.turn.main],1).length>0?[]:[2]
                            for(let a=0,la=cit.units.length;a<la;a++){
                                let unit=cit.units[a]
                                let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                                let fail=true
                                for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                                    if(this.operation.calc.sides[side].force[b].team==unit.team){
                                        this.operation.calc.sides[side].force[b].number+=unit.value
                                        fail=false
                                        break
                                    }
                                }
                                if(fail){
                                    this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:side==(cit.getUnits([this.turn.main],1).length>0?0:1)?ceil(cit.sieged):0})
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
                    this.operation.cities.forEach(city=>city.updateVisibility(this.turn.main))
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
                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                        let unit=this.operation.cities[this.select.targetCity].units[a]
                        let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                        let fail=true
                        for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                            if(this.operation.calc.sides[side].force[b].team==unit.team){
                                this.operation.calc.sides[side].force[b].number+=unit.value
                                fail=false
                                break
                            }
                        }
                        if(fail){
                            this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:0})
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
                    this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).forEach(unit=>unit.type=1)
                    this.tabs.active=10
                    this.battle.circumstance[1]=1
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
                    this.operation.calc.terrain.list=[2]
                    for(let a=0,la=this.operation.cities[this.select.targetCity].units.length;a<la;a++){
                        let unit=this.operation.cities[this.select.targetCity].units[a]
                        let side=unit.team==this.turn.main||types.team[this.turn.main].allies.includes(unit.team)?0:1
                        let fail=true
                        for(let b=0,lb=this.operation.calc.sides[side].force.length;b<lb;b++){
                            if(this.operation.calc.sides[side].force[b].team==unit.team){
                                this.operation.calc.sides[side].force[b].number+=unit.value
                                fail=false
                                break
                            }
                        }
                        if(fail){
                            this.operation.calc.sides[side].force.push({team:unit.team,number:unit.value,dist:side==1?ceil(this.operation.cities[this.select.targetCity].sieged):0})
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
                }
                count++
                if(key==count.toString()){
                    this.operation.cities[this.select.targetCity].getNotUnits([this.turn.main,...types.team[this.turn.main].allies]).forEach(unit=>unit.type=1)
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
                            this.newTurn()
                            this.turn.main=a
                        }
                        count++
                    }
                }
            break
        }
    }
}