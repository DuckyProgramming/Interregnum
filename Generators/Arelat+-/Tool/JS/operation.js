class operation{
    constructor(layer){
        this.layer=layer
        this.page={main:0,anim:[0,0,0,0,0,0]}
        this.time=0
    }
    nameColor(name){
        switch(name){
            case `Barcelona`: case `Provence`: case `Lower Burgundy`:
                return [218,106,81]
            case `Andechs`: case `Saône`: case `Franche-Comté`: case `Upper Burgundy`:
                return [156,142,199]
            case `Hohenzollern`:
                return [110,148,204]
            case `Thoire`: case `Île-de-Bourgogne`:
                return [184,54,117]
            case `Sabran`: case 'Forcalquier':
                return [150,114,229]
            case `Wittelsbach`:
                return [84,189,126]
            case `Knights`:
                return [194,154,183]
            case `Lillebonne`:
                return [160,65,72]
            case `Zähringen-Savoy`:
                return [199,106,140,49,167,185]
            case `Württemberg`:
                return [196,154,39]
            case `Arduinici`: case 'Bresse':
                return [206,165,158]
            case `Lorraine`: case `Haut-Lorraine`:
                return [229,152,152]
            case `Albon`: case `Cisjurania`: case `Dauphiné`:
                return [228,153,70]
            case `Rouergue`: case `Drôme`:
                return [114,142,101]
            case `Zähringen`: case `Transjurania`: case `Helvetie`:
                return [199,106,140]
            case `Republic`: case `Tellgovie`:
                return [161,161,161]
            case `Habsburg`:
                return [229,173,67]
            case `Savoy`: case `Alpes`:
                return [49,167,185]
            case `Romandie`:
                return [108,173,184]
            case `Minor`:
                return [220,201,166]
            case `Burghers`: case `Alsace`:
                return [218,24,30]
            case `Ecclesiastical`:
                return [145,78,154]
            case `La Marck-Arenberg`:
                return [41,150,163]
            case `Orange`:
                return [254,135,133]
            case `Gruyères`:
                return [193,144,112]
            default:
                return [150]
        }
    }
    getStats(type){
        this.stats={items:[],max:0}
        let sets=[]
        switch(type){
            case 0: case 1: case 2: case 3: case 7: case 8: case 9: case 10: case 12:
                let set=['district','district','rule','title','','','','rule','district','district','district','','district'][type]
                let term=['state','state','state','state','','','','diet','diet','diet','state','','diet'][type]
                for(let a=0,la=types[term].length;a<la;a++){
                    let account=false
                    for(let b=0,lb=sets.length;b<lb;b++){
                        if(sets[b].name==types[term][a][set]){
                            sets[b].states++
                            account=true
                            b=lb
                        }
                    }
                    if(!account){
                        sets.push({name:types[term][a][set],states:1})
                    }
                }
                if(type==1||type==9){
                    let oversets=[]
                    for(let a=0,la=sets.length;a<la;a++){
                        let num=findName(sets[a].name,types.district)
                        if(num>=0){
                            let account=false
                            for(let b=0,lb=oversets.length;b<lb;b++){
                                if(oversets[b].name==types.district[num].region){
                                    oversets[b].states+=sets[a].states
                                    account=true
                                    b=lb
                                }
                            }
                            if(!account){
                                oversets.push({name:types.district[num].region,states:sets[a].states})
                            }
                        }else{
                            print('Fail',sets[a].name)
                        }
                    }
                    let hypersets=[]
                    for(let a=0,la=oversets.length;a<la;a++){
                        let num=findName(oversets[a].name,types.region)
                        if(num>=0){
                            let account=false
                            for(let b=0,lb=hypersets.length;b<lb;b++){
                                if(hypersets[b].name==types.region[num].circle){
                                    hypersets[b].states+=oversets[a].states
                                    account=true
                                    b=lb
                                }
                            }
                            if(!account){
                                hypersets.push({name:types.region[num].circle,states:oversets[a].states})
                            }
                        }else{
                            print('Fail',sets[a].name)
                        }
                    }
                    for(let a=0,la=hypersets.length;a<la;a++){
                        this.stats.items.push({name:hypersets[a].name,base:hypersets[a].states})
                        this.stats.max=max(this.stats.max,hypersets[a].states)
                    }
                }else if(type==10||type==11||type==12){
                    let oversets=[]
                    for(let a=0,la=sets.length;a<la;a++){
                        let num=findName(sets[a].name,types.district)
                        if(num>=0){
                            let account=false
                            for(let b=0,lb=oversets.length;b<lb;b++){
                                if(oversets[b].name==types.district[num].region){
                                    oversets[b].states+=sets[a].states
                                    account=true
                                    b=lb
                                }
                            }
                            if(!account){
                                oversets.push({name:types.district[num].region,states:sets[a].states})
                            }
                        }else{
                            print('Fail',sets[a].name)
                        }
                    }
                    for(let a=0,la=oversets.length;a<la;a++){
                        this.stats.items.push({name:oversets[a].name,base:oversets[a].states})
                        this.stats.max=max(this.stats.max,oversets[a].states)
                    }
                }else{
                    for(let a=0,la=sets.length;a<la;a++){
                        this.stats.items.push({name:type==4?['Immediate','Magnate','Elector'][sets[a].name]:sets[a].name,base:sets[a].states})
                        this.stats.max=max(this.stats.max,sets[a].states)
                    }
                }
            break
            case 4:
                this.stats.items.push({name:`States`,base:types.state.length})
                this.stats.items.push({name:`Diet Seats`,base:types.diet.length})
                this.stats.max=types.state.length
            break
            case 5:
                for(let a=0,la=types.district.length;a<la;a++){
                    this.stats.items.push({name:types.district[a].name,base:types.district[a].area})
                    this.stats.max=max(this.stats.max,types.district[a].area)
                }
            break
            case 6:
                for(let a=0,la=types.district.length;a<la;a++){
                    let account=false
                    for(let b=0,lb=sets.length;b<lb;b++){
                        if(sets[b].name==types.district[a].region){
                            sets[b].area+=types.district[a].area
                            account=true
                            b=lb
                        }
                    }
                    if(!account){
                        sets.push({name:types.district[a].region,area:types.district[a].area})
                    }
                }
                let oversets=[]
                for(let a=0,la=sets.length;a<la;a++){
                    let num=findName(sets[a].name,types.region)
                    if(num>=0){
                        let account=false
                        for(let b=0,lb=oversets.length;b<lb;b++){
                            if(oversets[b].name==types.region[num].circle){
                                oversets[b].area+=sets[a].area
                                account=true
                                b=lb
                            }
                        }
                        if(!account){
                            oversets.push({name:types.region[num].circle,area:sets[a].area})
                        }
                    }else{
                        print('Fail',sets[a].name)
                    }
                }
                for(let a=0,la=oversets.length;a<la;a++){
                    this.stats.items.push({name:oversets[a].name,base:oversets[a].area})
                    this.stats.max=max(this.stats.max,oversets[a].area)
                }
            break
            case 11:
                for(let a=0,la=types.district.length;a<la;a++){
                    let account=false
                    for(let b=0,lb=sets.length;b<lb;b++){
                        if(sets[b].name==types.district[a].region){
                            sets[b].area+=types.district[a].area
                            account=true
                            b=lb
                        }
                    }
                    if(!account){
                        sets.push({name:types.district[a].region,area:types.district[a].area})
                    }
                }
                for(let a=0,la=sets.length;a<la;a++){
                    this.stats.items.push({name:sets[a].name,base:sets[a].area})
                    this.stats.max=max(this.stats.max,sets[a].area)
                }
            break
        }
        this.stats.items.sort((a,b)=>{return a.base-b.base})

        let total=0
        for(let a=0,la=this.stats.items.length;a<la;a++){
            total+=this.stats.items[a].base
        }
        this.image=createGraphics(400,400)
        setupLayer(this.image)
        this.image.translate(200,200)
        this.image.noStroke()
        let tick=0
        let pos=0
        for(let a=0,la=this.stats.items.length;a<la;a++){
            let value=this.stats.items[a].base
            if(value>0){
                tick++
                let color=this.nameColor(this.stats.items[a].name)
                switch(color.length){
                    case 1:
                        this.image.fill(color[0]+a%2*30)
                        this.image.arc(0,0,400,400,-180+pos,-180+pos+value/total*360)
                    break
                    case 3:
                        this.image.fill(...color)
                        this.image.arc(0,0,400,400,-180+pos,-180+pos+value/total*360)
                    break
                    case 6:
                        this.image.fill(color[0],color[1],color[2])
                        this.image.arc(0,0,400,400,-180+pos,-180+pos+value/total*360)
                        this.image.fill(color[3],color[4],color[5])
                        this.image.arc(0,0,300,300,-180+pos,-180+pos+value/total*360)
                    break
                }
                pos+=value/total*360
            }
        }
        this.image.fill(0)
        this.image.textSize(12)
        for(let a=0,la=this.stats.items.length;a<la;a++){
            let value=this.stats.items[a].base
            if(value>0){
                this.image.rotate(value/total*180)
                this.image.text(this.stats.items[a].name,-125,0)
                this.image.rotate(value/total*180)
            }
        }
    }
    display(){
        this.layer.background(225)
        this.layer.push()
        this.layer.translate(this.layer.width/2,this.layer.height/2)
        this.layer.scale(1.5)
        let ticker
        for(let a=0,la=this.page.anim.length;a<la;a++){
            if(this.page.anim[a]>0){
                switch(a){
                    case 0:
                        this.layer.noFill()
                        this.layer.stroke(0,this.page.anim[a])
                        this.layer.strokeWeight(4)
                        for(let b=0,lb=6;b<lb;b++){
                            for(let c=0,lc=b<3?3:b<4?2:1;c<lc;c++){
                                this.layer.rect(c*180-lc*90+90,b*54-83,160,36,10)
                            }
                        }
                        this.layer.noStroke()
                        this.layer.fill(0,this.page.anim[a])
                        this.layer.textSize(48)
                        this.layer.text('Arelat+- Tool',0,-143)
                        this.layer.textSize(20)
                        this.layer.text('District States',-180,-83)
                        this.layer.text('District Land',0,-83)
                        this.layer.text('District Diet',180,-83)
                        this.layer.text('Region States',-180,-29)
                        this.layer.text('Region Land',0,-29)
                        this.layer.text('Region Diet',180,-29)
                        this.layer.text('Circle States',-180,25)
                        this.layer.text('Circle Land',0,25)
                        this.layer.text('Circle Diet',180,25)
                        this.layer.text('Ruler Stats',-90,79)
                        this.layer.text('Ruler Diet',90,79)
                        this.layer.text('Title Stats',0,133)
                        this.layer.text('Level Stats',0,187)
                    break
                    case 1:
                        this.layer.noStroke()
                        for(let b=0,lb=this.stats.items.length;b<lb;b++){
                            let color=this.nameColor(this.stats.items[b].name)
                            switch(color.length){
                                case 1:
                                    this.layer.fill(color[0],this.page.anim[a])
                                    this.layer.rect(20*even(b,lb),250-200*this.stats.items[b].base/this.stats.max,17.5,400*this.stats.items[b].base/this.stats.max)
                                break
                                case 3:
                                    this.layer.fill(...color,this.page.anim[a])
                                    this.layer.rect(20*even(b,lb),250-200*this.stats.items[b].base/this.stats.max,17.5,400*this.stats.items[b].base/this.stats.max)
                                break
                                case 6:
                                    this.layer.fill(color[0],color[1],color[2],this.page.anim[a])
                                    this.layer.rect(20*even(b,lb)-4.875,250-200*this.stats.items[b].base/this.stats.max,8.75,400*this.stats.items[b].base/this.stats.max)
                                    this.layer.fill(color[3],color[4],color[5],this.page.anim[a])
                                    this.layer.rect(20*even(b,lb)+4.875,250-200*this.stats.items[b].base/this.stats.max,8.75,400*this.stats.items[b].base/this.stats.max)
                                break
                            }
                        }
                        this.layer.fill(0,this.page.anim[a])
                        this.layer.textSize(14)
                        let total=[this.stats.items.reduce((acc,item)=>acc+item.base,0)]
                        for(let b=0,lb=this.stats.items.length;b<lb;b++){
                            this.layer.textAlign(LEFT,CENTER)
                            this.layer.push()
                            switch(this.stats.type){
                                default:
                                    this.layer.translate(20*even(b,lb),240-400*this.stats.items[b].base/this.stats.max)
                                break
                            }
                            this.layer.rotate(-90)
                            this.layer.text(this.stats.items[b].name,0,1)
                            this.layer.pop()
                            this.layer.textAlign(CENTER,CENTER)
                            if(this.stats.items[b].base>=1000){
                                this.layer.textAlign(RIGHT,CENTER)
                                this.layer.push()
                                this.layer.translate(20*even(b,lb),255)
                                this.layer.rotate(-90)
                                this.layer.text(round(this.stats.items[b].base/total*10000)/100,0,1)
                                this.layer.pop()
                                this.layer.textAlign(CENTER,CENTER)
                            }else if(this.stats.items[b].base<1000){
                                this.layer.text(this.stats.items[b].base,20*even(b,lb),265)
                            }
                        }
                        this.layer.textSize(24)
                        this.layer.text(`${total[0]} Total`,0,-240)
                        this.layer.stroke(0,this.page.anim[a])
                        this.layer.strokeWeight(4)
                        this.layer.line(-this.stats.items.length*10,250,this.stats.items.length*10,250)
                        this.layer.noFill()
                        this.layer.stroke(0,this.page.anim[a])
                        this.layer.strokeWeight(4)
                        this.layer.rect(-500,-250,160,36,10)
                        this.layer.noStroke()
                        this.layer.fill(0,this.page.anim[a])
                        this.layer.textSize(20)
                        this.layer.text('Format',-500,-250)
                    break
                    case 2:
                        this.layer.push()
                        this.layer.translate(0,40)
                        this.layer.rotate(this.time*0.5)
                        this.layer.image(this.image,0,0)
                        this.layer.pop()
                        this.layer.fill(50)
                        this.layer.triangle(-5,-160,5,-160,0,-120)
                        this.layer.pop()
                        this.layer.noFill()
                        this.layer.stroke(0,this.page.anim[a])
                        this.layer.strokeWeight(4)
                        this.layer.rect(-500,-250,160,36,10)
                        this.layer.noStroke()
                        this.layer.fill(0,this.page.anim[a])
                        this.layer.textSize(20)
                        this.layer.text('Format',-500,-250)
                    break
                }
            }
        }
        this.layer.pop()
    }
    update(){
        for(let a=0,la=this.page.anim.length;a<la;a++){
            this.page.anim[a]=smoothAnim(this.page.anim[a],this.page.main==a,0,1,30)
        }
        this.time++
    }
    async onClick(mouse){
        let at={position:{x:(mouse.position.x-this.layer.width/2)/1.5,y:(mouse.position.y-this.layer.height/2)/1.5}}
        switch(this.page.main){
            case 0:
                if(inPointBox(at,boxify(-180,-83,160,36))){
                    this.page.main=1
                    this.getStats(0)
                }else if(inPointBox(at,boxify(0,-83,160,36))){
                    this.page.main=1
                    this.getStats(5)
                }else if(inPointBox(at,boxify(180,-83,160,36))){
                    this.page.main=1
                    this.getStats(8)
                }else if(inPointBox(at,boxify(-180,-29,160,36))){
                    this.page.main=1
                    this.getStats(10)
                }else if(inPointBox(at,boxify(0,-29,160,36))){
                    this.page.main=1
                    this.getStats(11)
                }else if(inPointBox(at,boxify(180,-29,160,36))){
                    this.page.main=1
                    this.getStats(12)
                }else if(inPointBox(at,boxify(-180,25,160,36))){
                    this.page.main=1
                    this.getStats(1)
                }else if(inPointBox(at,boxify(0,25,160,36))){
                    this.page.main=1
                    this.getStats(6)
                }else if(inPointBox(at,boxify(180,25,160,36))){
                    this.page.main=1
                    this.getStats(9)
                }else if(inPointBox(at,boxify(-90,79,160,36))){
                    this.page.main=1
                    this.getStats(2)
                }else if(inPointBox(at,boxify(90,79,160,36))){
                    this.page.main=1
                    this.getStats(7)
                }else if(inPointBox(at,boxify(0,133,160,36))){
                    this.page.main=1
                    this.getStats(3)
                }else if(inPointBox(at,boxify(0,187,160,36))){
                    this.page.main=1
                    this.getStats(4)
                }
            break
            case 1:
                if(inPointBox(at,boxify(-500,-250,160,36))){
                    this.page.main=2
                }
            break
            case 2:
                if(inPointBox(at,boxify(-500,-250,160,36))){
                    this.page.main=1
                }
            break
        }
    }
    onKey(key){
    }
}