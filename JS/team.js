class team{
    constructor(type){
        this.type=type
        this.name=types.team[this.type].name
        this.allies=[]
        this.offers=[]
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
}