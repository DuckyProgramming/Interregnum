class operation{
    constructor(layer){
        this.layer=layer
        this.page={main:0,anim:[0,0,0,0,0,0]}
        this.time=0
        this.menuMap=[
            [{name:`State Land`,id:13}],
            [{name:`District States`,id:0},{name:`District Land`,id:5},{name:`District Diet`,id:8}],
            [{name:`Region States`,id:10},{name:`Region Land`,id:11},{name:`Region Diet`,id:12}],
            [{name:`Ruler Stats`,id:2},{name:`Ruler Land`,id:14},{name:`Ruler Diet`,id:7}],
            [{name:`Title Stats`,id:3},{name:`Title Land`,id:15}],
            [{name:`Level Stats`,id:4}],
        ]
    }
    nameColor(name){
        switch(name){
            case `Barcelona`: case `Provence`: case `Lower Burgundy`:
                return [218,106,81]
            case `Andechs`: case `Saône`: case `Franche-Comté`: case `Upper Burgundy`:
                return [156,142,199]
            case `Hohenzollern`: case `Fenis`:
                return [110,148,204]
            case `Thoire`: case `Île-de-Bourgogne`: case `Léman`:
                return [184,54,117]
            case `Sabran`: case `Forcalquier`: case `Cottia`:
                return [150,114,229]
            case `Wittelsbach`:
                return [84,189,126]
            case `Knights`:
                return [194,154,183]
            case `Lillebonne`:
                return [160,65,72]
            case `Zähringen-Savoy`:
                return [199,106,140,49,167,185]
            case `Württemberg`: case `Montfaucon`:
                return [196,154,39]
            case `Arduinici`: case 'Bresse':
                return [206,165,158]
            case `Lorraine`: case `Haut-Lorraine`:
                return [229,152,152]
            case `Albon`: case `Cisjurania`: case `Dauphiné`: case `County Palatine`:
                return [228,153,70]
            case `Rouergue`: case `Drôme`:
                return [114,142,101]
            case `Zähringen`: case `Transjurania`: case `Helvetie`: case `Landgraviate`:
                return [199,106,140]
            case `Republic`: case `Tellgovie`: case `Valley`: 
                return [161,161,161]
            case `Habsburg`:
                return [229,173,67]
            case `Savoy`: case `Alpes`: case `Margraviate`:
                return [49,167,185]
            case `Romandie`:
                return [108,173,184]
            case `Minor`:
                return [220,201,166]
            case `Burghers`: case `Alsace`: case `Free City`: case `Village Concord`:
                return [218,24,30]
            case `Ecclesiastical`: case `Archbishopric`: case `Bishopric`: case `Abbey`:
                return [145,78,154]
            case `La Marck-Arenberg`:
                return [41,150,163]
            case `Orange`:
                return [254,135,133]
            case `Gruyères`:
                return [193,144,112]
            case `Ivrea`:
                return [231,125,221]
            case `Thoire-Republic`: case `Condominium`:
                return [184,54,117,161,161,161]
            case `Albon-Republic`: case `Escarton`:
                return [228,153,70,161,161,161]
            case `Raron`:
                return [234,109,125]
            case `La Baume`:
                return [103,100,162]
            default:
                return [150]
        }
    }
    getStats(type){
        this.stats={items:[],max:0}
        let sets=[]
        switch(type){
            case 0: case 1: case 2: case 3: case 7: case 8: case 9: case 10: case 12: case 14: case 15:
                let set=['district','district','rule','title','','','','rule','district','district','district','','district','','rule','title'][type]
                let term=['state','state','state','state','','','','diet','diet','diet','state','','diet','','state','state'][type]
                for(let a=0,la=types[term].length;a<la;a++){
                    let account=false
                    let value=type==14||type==15?types[term][a].area:1
                    for(let b=0,lb=sets.length;b<lb;b++){
                        if(sets[b].name==types[term][a][set]){
                            sets[b].states+=value
                            account=true
                            b=lb
                        }
                    }
                    if(!account){
                        sets.push({name:types[term][a][set],states:value})
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
                this.stats.items.push({name:`Electors`,base:types.state.filter(state=>state.prestige.includes(`Elector`)).length})
                this.stats.items.push({name:`Dukes`,base:types.state.filter(state=>state.prestige.includes(`Duke`)).length})
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
            case 13:
                for(let a=0,la=types.state.length;a<la;a++){
                    this.stats.items.push({name:`${types.state[a].title} of ${types.state[a].name}`,base:types.state[a].area,color:types.state[a].rule})
                    this.stats.max=max(this.stats.max,types.state[a].area)
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
                let color=this.nameColor(this.stats.items[a].color!=undefined?this.stats.items[a].color:this.stats.items[a].name)
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
                        let baseline=20-27*this.menuMap.length
                        this.layer.noFill()
                        this.layer.stroke(0,this.page.anim[a])
                        this.layer.strokeWeight(4)
                        for(let b=0,lb=this.menuMap.length;b<lb;b++){
                            for(let c=0,lc=this.menuMap[b].length;c<lc;c++){
                                this.layer.rect(even(c,lc)*180,baseline+60+b*54,160,36,10)
                            }
                        }
                        this.layer.noStroke()
                        this.layer.fill(0,this.page.anim[a])
                        this.layer.textSize(48)
                        this.layer.text('Arelat Tool',0,baseline)
                        this.layer.textSize(20)
                        for(let b=0,lb=this.menuMap.length;b<lb;b++){
                            for(let c=0,lc=this.menuMap[b].length;c<lc;c++){
                                this.layer.text(this.menuMap[b][c].name,even(c,lc)*180,baseline+60+b*54)
                            }
                        }
                    break
                    case 1:
                        let bar=this.stats.items.length>=50?10:20
                        this.layer.noStroke()
                        for(let b=0,lb=this.stats.items.length;b<lb;b++){
                            let color=this.nameColor(this.stats.items[b].color!=undefined?this.stats.items[b].color:this.stats.items[b].name)
                            let height=this.stats.items.length>=50?400*sqrt(this.stats.items[b].base)/sqrt(this.stats.max):400*this.stats.items[b].base/this.stats.max
                            switch(color.length){
                                case 1:
                                    this.layer.fill(color[0],this.page.anim[a])
                                    this.layer.rect(bar*even(b,lb),250-height/2,bar*0.875,height)
                                break
                                case 3:
                                    this.layer.fill(...color,this.page.anim[a])
                                    this.layer.rect(bar*even(b,lb),250-height/2,bar*0.875,height)
                                break
                                case 6:
                                    this.layer.fill(color[0],color[1],color[2],this.page.anim[a])
                                    this.layer.rect(bar*even(b,lb)-bar*0.21875,250-height/2,bar*0.4375,height)
                                    this.layer.fill(color[3],color[4],color[5],this.page.anim[a])
                                    this.layer.rect(bar*even(b,lb)+bar*0.21875,250-height/2,bar*0.4375,height)
                                break
                            }
                        }
                        this.layer.fill(0,this.page.anim[a])
                        this.layer.textSize(2+bar*0.6)
                        let total=[this.stats.items.reduce((acc,item)=>acc+item.base,0)]
                        for(let b=0,lb=this.stats.items.length;b<lb;b++){
                            this.layer.textAlign(LEFT,CENTER)
                            this.layer.push()
                            let height=this.stats.items.length>=50?400*sqrt(this.stats.items[b].base)/sqrt(this.stats.max):400*this.stats.items[b].base/this.stats.max
                            switch(this.stats.type){
                                default:
                                    this.layer.translate(bar*even(b,lb),250-bar*0.5-height)
                                break
                            }
                            this.layer.rotate(-90)
                            this.layer.text(this.stats.items[b].name,0,1)
                            this.layer.pop()
                            this.layer.textAlign(CENTER,CENTER)
                            if(this.stats.max>=1000){
                                this.layer.textAlign(RIGHT,CENTER)
                                this.layer.push()
                                this.layer.translate(bar*even(b,lb),255)
                                this.layer.rotate(-90)
                                this.layer.text(round(this.stats.items[b].base/total*10000)/100,0,1)
                                this.layer.pop()
                                this.layer.textAlign(CENTER,CENTER)
                            }else if(this.stats.max<1000){
                                this.layer.text(this.stats.items[b].base,bar*even(b,lb),265)
                            }
                        }
                        this.layer.textSize(24)
                        this.layer.text(`${total[0]} Total`,0,-240)
                        this.layer.stroke(0,this.page.anim[a])
                        this.layer.strokeWeight(4)
                        this.layer.line(-this.stats.items.length*bar/2,250,this.stats.items.length*bar/2,250)
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
                let baseline=20-27*this.menuMap.length
                for(let b=0,lb=this.menuMap.length;b<lb;b++){
                    for(let c=0,lc=this.menuMap[b].length;c<lc;c++){
                        if(inPointBox(at,boxify(even(c,lc)*180,baseline+60+b*54,160,36))){
                            this.page.main=1
                            this.getStats(this.menuMap[b][c].id)
                        }
                    }
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