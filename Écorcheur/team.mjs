import {types} from './variables.mjs'
import {randindex,last} from './functions.mjs'
import {unit} from './unit.mjs'
export class team{
    constructor(operation,type){
        this.operation=operation
        this.type=type
        this.player=type==types.team.length-1
        this.name=types.team[this.type].name
        this.cities=[]
        this.cores=[]
        this.prisoners={lost:0,gained:0}
        this.spawn={strength:0,next:{price:0,type:0,value:0},patrols:0}
    }
    save(){
        let composite={
            type:this.type,
            player:this.player,
            name:this.name,
            prisoners:this.prisoners,
        }
        return composite
    }
    load(composite){
        this.type=composite.type
        this.player=composite.player
        this.name=composite.name
        this.prisoners=composite.prisoners
    }
    initialPatrols(){
        this.spawn.patrols=round(this.cores.length/2-random(0,1))
        let possible=[]
        this.cores.forEach((core,index)=>{
            possible.push(index);
            this.operation.units.push(new unit(this.operation,false,core.position.x,core.position.y,this.type,0,round(random(2.5,10)*(1+this.cities.length*0.05))*100))
        })
        for(let a=0,la=this.spawn.patrols;a<la;a++){
            let cit=[this.cores[possible.splice(randindex(possible),1)],this.cores[possible.splice(randindex(possible),1)]]
            this.operation.units.push(new unit(this.operation,false,cit[0].position.x,cit[0].position.y+60,this.type,1,round(random(5,20)*(1+this.cities.length*0.05))*100))
            last(this.operation.units).goal.nodes=[cit[0],cit[1]]
            last(this.operation.units).goal.tick=0
        }
    }
    cityLost(name){
        for(let a=0,la=this.cities.length;a<la;a++){
            if(this.cities[a].name==name){
                this.cities.splice(a,1)
                a--
                la--
            }
        }
    }
    update(layer,scene){
        switch(scene){
            case 'main':
            break
        }
    }
}