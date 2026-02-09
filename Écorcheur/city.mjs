import {types,options,graphics} from './variables.mjs'
import {smoothAnim,distPos} from './functions.mjs'
export class city{
    constructor(operation,x,y,id,data,fortified){
        this.operation=operation
        this.position={x:x,y:y}
        this.id=id
        this.name=data.name
        this.type=data.type
        this.rule=this.operation.ref.team[data.rule]
        this.owner=this.operation.ref.team[data.rule]
        this.fortified=fortified
        this.sieged=0
        this.fade={main:0,trigger:true}
        this.remove=false
    }
    save(){
        let composite={
            id:this.id,
            name:this.name,
            type:this.type,
            position:this.position,
            rule:this.rule,
            owner:this.owner,
            fortified:this.fortified,
            sieged:this.sieged
        }
        return composite
    }
    load(composite){
        this.id=composite.id
        this.name=composite.name
        this.type=composite.type
        this.position=composite.position
        this.rule=composite.rule
        this.owner=composite.owner
        this.fortified=composite.fortified
        this.sieged=composite.sieged
        this.operation.teams[this.rule].cities.push(this)
        this.operation.teams[this.rule].cores.push(this)
    }
    setCore(){
        this.operation.teams[this.rule].cities.push(this)
        this.operation.teams[this.rule].cores.push(this)
    }
    display(layer,scene){
        switch(scene){
            case `main`:
                layer.push()
                layer.translate(this.position.x,this.position.y)
                layer.scale(5/options.scale*this.operation.scale)
                let img=graphics.load.city[types.cityType[this.type].term[0]]
                layer.image(img,0,0,img.width*0.1,img.height*0.1)
                if(this.fortified){
                    let img2=graphics.load.city[7]
                    layer.image(img2,0,0,img.width*0.1,img.height*0.1)
                }
                if(types.cityType[this.type].term[1]!=-1){
                    img=graphics.load.city[types.cityType[this.type].term[1]]
                    layer.image(img,0,0,img.width*0.1,img.height*0.1)
                }
                layer.fill(255)
                layer.textSize(img.height*0.04)
                layer.textAlign(LEFT,CENTER)
                layer.text(this.name,img.width*0.05,img.height*0.004)
                layer.textAlign(CENTER,CENTER)
                layer.pop()
            break
        }
    }
    update(layer,scene){
        switch(scene){
            case 'main':
                this.fade.main=smoothAnim(this.fade.main,this.fade.trigger,0,1,60)
            break
        }
    }
    onClick(layer,mouse,scene,rel){
        switch(scene){
            case 'main':
                if(distPos(rel,this)<60){
                    this.operation.ui.cityClick(layer,mouse,scene,this.type,false)
                }
            break
        }
    }
}