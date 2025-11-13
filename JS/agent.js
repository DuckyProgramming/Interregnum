class agent{
    constructor(sets=[],constants=[]){
        this.sets=sets
        this.constants=constants
        if(this.sets.length==0||this.constants.lenght==0){
            this.sets=[
                [[],[]],
                [[],[]],
                [[]],
                [[]],
                [[]],
                [[]],
                [[],[]],
            ]
            this.constants=[[],[],[],[],[],[],[]]
            for(let a=0,la=5;a<la;a++){
                this.sets[0][0].push([])
                for(let b=0,lb=15;b<lb;b++){
                    this.sets[0][0][a].push(random(-100,100))
                }
            }
            for(let a=0,la=5;a<la;a++){
                this.sets[0][0].push([floor(random(0,13)),floor(random(0,13))])
            }
            for(let a=0,la=4;a<la;a++){
                this.sets[0][1].push([])
                for(let b=0,lb=10;b<lb;b++){
                    this.sets[0][1][a].push(random(-100,100))
                }
            }
            for(let c=0,lc=2;c<lc;c++){
                for(let a=0,la=5;a<la;a++){
                    this.sets[1+c*5][0].push([])
                    for(let b=0,lb=14-c*2;b<lb;b++){
                        this.sets[1+c*5][0][a].push(random(-100,100))
                    }
                }
                for(let a=0,la=5;a<la;a++){
                    this.sets[1+c*5][0].push([floor(random(0,14-c*2)),floor(random(0,14-c*2))])
                }
                for(let a=0,la=2;a<la;a++){
                    this.sets[1+c*5][1].push([])
                    for(let b=0,lb=10;b<lb;b++){
                        this.sets[1+c*5][1][a].push(random(-100,100))
                    }
                }
            }
            this.sets[2][0].push([])
            for(let b=0,lb=4;b<lb;b++){
                this.sets[2][0][0].push(random(-100,100))
            }
            for(let c=0,lc=3;c<lc;c++){
                for(let a=0,la=2;a<la;a++){
                    this.sets[3+c][0].push([])
                    for(let b=0,lb=5;b<lb;b++){
                        this.sets[3+c][0][a].push(random(-100,100))
                    }
                }
            }
            for(let a=0,la=10;a<la;a++){
                this.constants[0].push(random(-100,100))
                this.constants[1].push(random(-100,100))
                this.constants[6].push(random(-100,100))
            }
        }
        this.record=0
    }
    execute(mode,data){
        let working=data
        working.forEach(item=>{if(item<-1000||item>1000||item!=item){print(working);throw new Error("weird inputs")}})
        for(let a=0,la=this.sets[mode].length;a<la;a++){
            let summa=[]
            for(let b=0,lb=this.sets[mode][a].length;b<lb;b++){
                summa.push(a==0&&la==2?this.constants[mode][b]:0)
                for(let c=0,lc=this.sets[mode][a][b].length;c<lc;c++){
                    if(b>=5){
                        summa[b]*=working[c]**(this.sets[mode][a][b][c])
                    }else{
                        summa[b]+=this.sets[mode][a][b][c]*working[c]
                    }
                }
                if(b>=5){
                    summa[b]=constrain(summa[b],-100,100)
                }
            }
            working=summa
        }
        working.forEach(item=>{if(item<-1000000||item>1000000||item!=item){print(working);throw new Error("weird outputs")}})
        return working
    }
    mutate(){
        for(let a=0,la=this.sets.length;a<la;a++){
            for(let b=0,lb=this.sets[a].length;b<lb;b++){
                for(let c=0,lc=this.sets[a][b].length;c<lc;c++){
                    for(let d=0,ld=this.sets[a][b][c].length;d<ld;d++){
                        if(floor(random(0,10))==0){
                            if(c>=5){
                                this.sets[a][b][c][d]=floor(random(a==0?13:a==1?12:9))
                            }else{
                                this.sets[a][b][c][d]=floor(random(0,5))==0?-this.sets[a][b][c][d]:constrain(this.sets[a][b][c][d]*random(0.8,1.25),-100,100)
                            }
                        }else if(floor(random(0,3))==0&&c<5){
                            this.sets[a][b][c][d]=constrain(this.sets[a][b][c][d]*random(0.95,20/19),-100,100)
                        }
                    }
                }
            }
        }
        for(let a=0,la=this.constants.length;a<la;a++){
            for(let b=0,lb=this.constants[a].length;b<lb;b++){
                if(floor(random(0,10))==0){
                    this.constants[a][b]=floor(random(0,5))==0?-this.constants[a][b]:constrain(this.constants[a][b]*random(0.8,1.25),-100,100)
                }else if(floor(random(0,3))==0){
                    this.constants[a][b]=constrain(this.constants[a][b]*random(0.95,20/19),-100,100)
                }
            }
        }
    }
}