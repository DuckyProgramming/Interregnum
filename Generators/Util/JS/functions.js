function checkDupeStates(){
	for(let a=0,la=types.state.length;a<la;a++){
		for(let b=a+1;b<la;b++){
			if(types.state[a].name==types.state[b].name){
				print(types.state[a].name)
			}
		}
	}
}
/*function checkMagnates(){
    let set=[]
    for(let a=0,la=types.state.length;a<la;a++){
        if(types.state[a].level>=1){
            if(set.includes(types.state[a].district)){
                print(types.state[a].district,'Double')
            }else{
                set.push(types.state[a].district)
            }
        }
    }
    for(let a=0,la=types.district.length;a<la;a++){
        if(!set.includes(types.district[a].name)){
            print(types.district[a].name,'Miss')
        }
    }
    print(set.length)
}*/
function outStates(){
    let titles=[]
    let conv=(state)=>{
        return `${state.name}${state.prestige.length>0?` (`:``}${state.prestige.join(`, `)}${state.prestige.length>0?`)`:``}`
    }
    for(let a=0,la=types.state.length;a<la;a++){
        let fail=true
        for(let b=0,lb=titles.length;b<lb;b++){
            if(titles[b].name==types.state[a].title){
                titles[b].names.push(conv(types.state[a]))
                fail=false
            }
        }
        if(fail){
            titles.push({name:types.state[a].title,names:[conv(types.state[a])]})
        }
    }
    let misc=[[],[]]
    for(let a=0,la=titles.length;a<la;a++){
        if(titles[a].names.length==1){
            misc[[`Valley`,`Escarton`,`Republic`,`Condominium`,`Amt`].includes(titles[a].name)?0:1].push(titles[a].name+` of `+titles[a].names[0])
            titles.splice(a,1)
            a--
            la--
        }
    }
    let build=``
    for(let a=0,la=titles.length;a<la;a++){
        if(a>0){
            build+=`\n`
        }
        build+=`${last(titles[a].name)==`y`&&titles[a].name.slice(-2)!=`ey`?`${titles[a].name.slice(0,-1)}ies`:`${titles[a].name}s`}: ${titles[a].names.join(`, `)}`
    }
    if(misc[0].length>0){
        build+=`\nFree Peasants: ${misc[0].join(`, `)}`
    }
    if(misc[1].length>0){
        build+=`\nMisc: ${misc[1].join(`, `)}`
    }
    print(build)
}
function outStatesDistrict(){
    let key=`district`
    let term=`state`
    let sets=[]
    for(let a=0,la=types[term].length;a<la;a++){
        let account=false
        for(let b=0,lb=sets.length;b<lb;b++){
            if(sets[b][0][key]==types[term][a][key]){
                sets[b].push(types[term][a])
                account=true
                b=lb
            }
        }
        if(!account){
            sets.push([types[term][a]])
        }
    }
    sets.sort((a,b)=>a.length-b.length)
    let conv=(state)=>{
        return `${state.name}${state.prestige.length>0?` (`:``}${state.prestige.join(`, `)}${state.prestige.length>0?`)`:``}`
    }
    sets.forEach(set=>{
        let titles=[]
        for(let a=0,la=set.length;a<la;a++){
            let fail=true
            for(let b=0,lb=titles.length;b<lb;b++){
                if(titles[b].name==set[a].title){
                    titles[b].names.push(conv(set[a]))
                    fail=false
                }
            }
            if(fail){
                titles.push({name:set[a].title,names:[conv(set[a])]})
            }
        }
        let misc=[[],[]]
        for(let a=0,la=titles.length;a<la;a++){
            if(titles[a].names.length==1){
                misc[[`Valley`,`Escarton`,`Republic`,`Condominium`,`Amt`].includes(titles[a].name)?0:1].push(titles[a].name+` of `+titles[a].names[0])
                titles.splice(a,1)
                a--
                la--
            }
        }
        let build=``
        for(let a=0,la=titles.length;a<la;a++){
            if(a>0){
                build+=`\n`
            }
            build+=`${last(titles[a].name)==`y`&&titles[a].name.slice(-2)!=`ey`?`${titles[a].name.slice(0,-1)}ies`:`${titles[a].name}s`}: ${titles[a].names.join(`, `)}`
        }
        if(misc[0].length>0){
            build+=`\nFree Peasants: ${misc[0].join(`, `)}`
        }
        if(misc[1].length>0){
            build+=`\nMisc: ${misc[1].join(`, `)}`
        }
        print(`${set[0][key]} (${set.length}):\n${build}`)
    })
}
function outStatesRegion(){
    let key=[`district`,`region`]
    let term=[`state`,`district`]
    let sets=[]
    for(let a=0,la=types[term[0]].length;a<la;a++){
        let account=false
        for(let b=0,lb=sets.length;b<lb;b++){
            if(types[term[1]][findName(sets[b][0][key[0]],types[term[1]])][key[1]]==types[term[1]][findName(types[term[0]][a][key[0]],types[term[1]])][key[1]]){
                sets[b].push(types[term[0]][a])
                account=true
                b=lb
            }
        }
        if(!account){
            sets.push([types[term[0]][a]])
        }
    }
    sets.sort((a,b)=>a.length-b.length)
    let conv=(state)=>{
        return `${state.name}${state.prestige.length>0?` (`:``}${state.prestige.join(`, `)}${state.prestige.length>0?`)`:``}`
    }
    sets.forEach(set=>{
        let titles=[]
        for(let a=0,la=set.length;a<la;a++){
            let fail=true
            for(let b=0,lb=titles.length;b<lb;b++){
                if(titles[b].name==set[a].title){
                    titles[b].names.push(conv(set[a]))
                    fail=false
                }
            }
            if(fail){
                titles.push({name:set[a].title,names:[conv(set[a])]})
            }
        }
        let misc=[[],[]]
        for(let a=0,la=titles.length;a<la;a++){
            if(titles[a].names.length==1){
                misc[[`Valley`,`Escarton`,`Republic`,`Condominium`,`Amt`].includes(titles[a].name)?0:1].push(titles[a].name+` of `+titles[a].names[0])
                titles.splice(a,1)
                a--
                la--
            }
        }
        let build=``
        for(let a=0,la=titles.length;a<la;a++){
            if(a>0){
                build+=`\n`
            }
            build+=`${last(titles[a].name)==`y`&&titles[a].name.slice(-2)!=`ey`?`${titles[a].name.slice(0,-1)}ies`:`${titles[a].name}s`}: ${titles[a].names.join(`, `)}`
        }
        if(misc[0].length>0){
            build+=`\nFree Peasants: ${misc[0].join(`, `)}`
        }
        if(misc[1].length>0){
            build+=`\nMisc: ${misc[1].join(`, `)}`
        }
        print(`${types[term[1]][findName(set[0][key[0]],types[term[1]])][key[1]]} (${set.length}):\n${build}`)
    })
}
function outDiet(){
    types.diet.forEach((diet,index)=>print(`${index+1}: ${diet.title}${diet.name!=``?` of `:``}${diet.name}`))
}
function outDietDistrict(){
    let key=`district`
    let term=`diet`
    let sets=[]
    for(let a=0,la=types[term].length;a<la;a++){
        let account=false
        for(let b=0,lb=sets.length;b<lb;b++){
            if(sets[b][0][key]==types[term][a][key]){
                sets[b].push(types[term][a])
                account=true
                b=lb
            }
        }
        if(!account){
            sets.push([types[term][a]])
        }
    }
    sets.sort((a,b)=>a.length-b.length)
    sets.forEach(set=>{
        print(`\n${set[0][key]}:`)
        set.forEach((diet,index)=>print(`${index+1}: ${diet.title}${diet.name!=``?` of `:``}${diet.name}`))
    })
}
function outDietRegion(){
    let key=[`district`,`region`]
    let term=[`diet`,`district`]
    let sets=[]
    for(let a=0,la=types[term[0]].length;a<la;a++){
        let account=false
        for(let b=0,lb=sets.length;b<lb;b++){
            if(types[term[1]][findName(sets[b][0][key[0]],types[term[1]])][key[1]]==types[term[1]][findName(types[term[0]][a][key[0]],types[term[1]])][key[1]]){
                sets[b].push(types[term[0]][a])
                account=true
                b=lb
            }
        }
        if(!account){
            sets.push([types[term[0]][a]])
        }
    }
    sets.sort((a,b)=>a.length-b.length)
    sets.forEach(set=>{
        print(`\n${types[term[1]][findName(set[0][key[0]],types[term[1]])][key[1]]}:`)
        set.forEach((diet,index)=>print(`${index+1}: ${diet.title}${diet.name!=``?` of `:``}${diet.name}`))
    })
}
function outStats(){
    let build=``
    current.stats.items.forEach((stat,index)=>build+=`${index>0?`, `:``}${stat.name}: ${stat.base}`)
    print(build)
}
//major
function smoothAnim(anim,trigger,minPoint,maxPoint,speed){
	if(trigger&&anim<maxPoint){
		return min(round(anim*speed+1)/speed,maxPoint)
	}
	if(!trigger&&anim>minPoint){
		return max(round(anim*speed-1)/speed,minPoint)
	}
	return anim
}
function updateMouse(layer,scale){
    /*inputs.mouse.previous.base.x=inputs.mouse.base.x
    inputs.mouse.previous.base.y=inputs.mouse.base.y
    inputs.mouse.previous.rel.x=inputs.mouse.rel.x
    inputs.mouse.previous.rel.y=inputs.mouse.rel.y*/
	inputs.mouse.base.x=mouseX
	inputs.mouse.base.y=mouseY
	inputs.mouse.rel.x=(inputs.mouse.base.x-width/2)/scale+layer.width/2
	inputs.mouse.rel.y=(inputs.mouse.base.y-height/2)/scale+layer.height/2
}
function even(pos,total){
    return pos-total*0.5+0.5
}
function boxify(x,y,width,height){
	return {position:{x:x,y:y},width:width,height:height}
}
function inPointBox(point,box){
    return point.position.x>box.position.x-box.width/2&&point.position.x<box.position.x+box.width/2&&point.position.y>box.position.y-box.height/2&&point.position.y<box.position.y+box.height/2
}
function findName(name,list){
	for(let a=0,la=list.length;a<la;a++){
		if(list[a].name==name){
			return a
		}
	}
    throw new Error(`findName Fail: ${name}`)
	return -1
}
function last(array){
    return array[array.length-1]
}
//holdover