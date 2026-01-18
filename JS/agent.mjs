import {training} from './variables.mjs'
import {constrain,floor,random} from './functions.mjs'
export class agent{
    constructor(sets=[],constants=[]){
        this.sets=sets
        this.constants=constants
        if(this.sets.length==0||this.constants.length==0){
            let inputLen=[22,19,10,6,7,5,16]
            let outputLen=[6,1,1,1,1,1,1]
            this.sets=[
                [[],[]],
                [[],[]],
                [[],[]],
                [[]],
                [[]],
                [[]],
                [[],[]],
            ]
            this.constants=[
                [[],[]],
                [[],[]],
                [[],[]],
                [[]],
                [[]],
                [[]],
                [[],[]],
            ]
            for(let a=0,la=this.sets.length;a<la;a++){
                if(this.sets[a].length==2){
                    for(let b=0,lb=5;b<lb;b++){
                        this.sets[a][0].push([])
                        for(let c=0,lc=inputLen[a];c<lc;c++){
                            this.sets[a][0][b].push(random(-10,10))
                        }
                    }
                    for(let b=0,lb=5;b<lb;b++){
                        this.sets[a][0].push([floor(random(0,inputLen[a])),floor(random(0,inputLen[a]))])
                    }
                    for(let b=0,lb=outputLen[a];b<lb;b++){
                        this.sets[a][1].push([])
                        for(let c=0,lc=10;c<lc;c++){
                            this.sets[a][1][b].push(random(-10,10))
                        }
                    }
                    for(let b=0,lb=10;b<lb;b++){
                        this.constants[a][0].push(random(-10,10))
                    }
                    for(let b=0,lb=outputLen[a];b<lb;b++){
                        this.constants[a][1].push(random(-10,10))
                    }
                }else{
                    this.sets[a][0].push([])
                    for(let b=0,lb=inputLen[a];b<lb;b++){
                        this.sets[a][0][0].push(random(-10,10))
                    }
                    for(let b=0,lb=outputLen[a];b<lb;b++){
                        this.constants[a][0].push(random(-10,10))
                    }
                }
            }
        }else{
            this.sets.forEach(module=>module.forEach(layer=>layer.forEach(keyvalue=>keyvalue.forEach(mult=>{if(mult==null){throw new Error(`Null Agent Value`)}}))))
            this.constants.forEach(module=>module.forEach(mult=>{if(mult==null){throw new Error(`Null Agent Value`)}}))
        }
        this.record=0
        this.rewards=0
        this.punishments=0
        this.benchmrk=false
    }
    execute(mode,data){
        let working=data
        working.forEach(item=>{if(item<-1000||item>1000||item!=item){print(working,this.sets[mode],this.constants[mode]);throw new Error("Weird Inputs")}})
        for(let a=0,la=this.sets[mode].length;a<la;a++){
            let summa=[]
            for(let b=0,lb=this.sets[mode][a].length;b<lb;b++){
                summa.push(a==0&&la==2&&b>=5?1:0)
                for(let c=0,lc=this.sets[mode][a][b].length;c<lc;c++){
                    if(lc!=working.length&&!(a==0&&la==2&&b>=5)){
                        print(mode,a,this.sets[mode][a][b],working)
                        throw new Error(`Execute Fail`)
                    }
                    if(a==0&&la==2&&b>=5){
                        summa[b]*=working[this.sets[mode][a][b][c]]
                    }else{
                        summa[b]+=this.sets[mode][a][b][c]*working[c]
                    }
                }
                summa[b]+=this.constants[mode][a][b]
            }
            working=summa
        }
        working.forEach(item=>{if(item<-10000000||item>10000000||item!=item){print(working,this.sets[mode],this.constants[mode]);throw new Error("Weird Outputs")}})
        return working
    }
    mutate(){
        /*
        a-module
        b-layer
        c-keyvalue
        d-mult
        */
        for(let a=0,la=this.sets.length;a<la;a++){
            if(a==training.specific||training.specific==-1){
                if(floor(random(0,1000))==0){
                    for(let b=0,lb=this.sets[a].length;b<lb;b++){
                        for(let c=0,lc=this.sets[a][b].length;c<lc;c++){
                            for(let d=0,ld=this.sets[a][b][c].length;d<ld;d++){
                                if(c>=5&&b==0&&lb>1){
                                    this.sets[a][b][c][d]=floor(random(0,this.sets[a][b][0].length))
                                }else{
                                    this.sets[a][b][c][d]=random(-10,10)
                                }
                            }
                        }
                    }
                }else{
                    for(let b=0,lb=this.sets[a].length;b<lb;b++){
                        for(let c=0,lc=this.sets[a][b].length;c<lc;c++){
                            for(let d=0,ld=this.sets[a][b][c].length;d<ld;d++){
                                if(floor(random(0,1000))==0&&!(c>=5&&b==0&&lb>1)){
                                    this.sets[a][b][c][d]=random(-10,10)
                                }else if(floor(random(0,training.specific!=-1?20:50))==0){
                                    if(c>=5&&b==0&&lb>1){
                                        this.sets[a][b][c][d]=floor(random(0,this.sets[a][b][0].length))
                                    }else{
                                        this.sets[a][b][c][d]=floor(random(0,5))==0?-this.sets[a][b][c][d]:constrain(this.sets[a][b][c][d]*(floor(random(0,2))==0?random(1,2):1/random(1,2)),-10,10)
                                    }
                                }else if(floor(random(0,training.specific!=-1?10:20))==0&&c<5){
                                    this.sets[a][b][c][d]=constrain(this.sets[a][b][c][d]*(floor(random(0,2))==0?random(1,1.2):1/random(1,1.2)),-10,10)
                                }
                            }
                        }
                    }
                }
            }
        }
        for(let a=0,la=this.constants.length;a<la;a++){
            if(a==training.specific||training.specific==-1){
                if(floor(random(0,1000))==0){
                    for(let b=0,lb=this.constants[a].length;b<lb;b++){
                        for(let c=0,lc=this.constants[a][b].length;c<lc;c++){
                            this.constants[a][b][c]=random(-10,10)
                        }
                    }
                }else{
                    for(let b=0,lb=this.constants[a].length;b<lb;b++){
                        for(let c=0,lc=this.constants[a][b].length;c<lc;c++){
                            if(floor(random(0,1000))==0){
                                this.constants[a][b][c]=random(-10,10)
                            }else if(floor(random(0,training.specific!=-1?20:50))==0){
                                this.constants[a][b][c]=floor(random(0,5))==0?-this.constants[a][b][c]:constrain(this.constants[a][b][c]*(floor(random(0,2))==0?random(1,2):1/random(1,2)),-10,10)
                            }else if(floor(random(0,training.specific!=-1?10:20))==0){
                                this.constants[a][b][c]=constrain(this.constants[a][b][c]*(floor(random(0,2))==0?random(1,1.2):1/random(1,1.2)),-10,10)
                            }
                        }
                    }
                }
            }
        }
    }
}