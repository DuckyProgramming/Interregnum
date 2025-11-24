class team{
    constructor(type){
        this.type=type
        this.name=types.team[this.type].name
        this.allies=[]
        this.offers=[]
    }
    save(){
        let composite={
            name:this.name,
            allies:this.allies,
            offers:this.offers,
        }
        return composite
    }
    load(composite){
        this.allies=composite.allies
        this.offers=composite.offers
    }
}