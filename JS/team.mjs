import {types} from './variables.mjs'
export class team{
    constructor(type){
        this.type=type
        this.name=types.team[this.type].name
        this.allies=[]
        this.offers=[]
        this.cities=[]
        this.cores=[]
        this.notif=[]
        this.kills=0
        this.deaths=0
        this.deserters=0
    }
    save(){
        let composite={
            name:this.name,
            allies:this.allies,
            offers:this.offers,
            kills:this.kills,
            deaths:this.deaths,
            deserters:this.deserters,
        }
        return composite
    }
    load(composite){
        this.allies=composite.allies
        this.offers=composite.offers
        this.kills=composite.kills
        this.deaths=composite.deaths
        this.deserters=composite.deserters
    }
    addAlly(other){
        if(this.allies.includes(other.type)||other.allies.includes(this.type)){
            throw new Error(`Repeat Alliance`)
        }
        this.allies.push(other.type)
        other.allies.push(this.type)
        if(this==other){
            throw new Error(`Self Alliance`)
        }
    }
    removeAlly(other){
        if(this.allies.includes(other.type)){
            this.allies.splice(this.allies.indexOf(other.type))
        }
        if(other.allies.includes(this.type)){
            other.allies.splice(other.allies.indexOf(this.type))
        }
        if(this==other){
            throw new Error(`Self Alliance Removal`)
        }
    }
}