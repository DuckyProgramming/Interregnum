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
    let misc=[]
    for(let a=0,la=titles.length;a<la;a++){
        if(titles[a].names.length==1){
            misc.push(titles[a].name+` of `+titles[a].names[0])
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
    if(misc.length>0){
        build+=`\nMisc: ${misc.join(`, `)}`
    }
    print(build)
}
function outStats(){
    let build=``
    current.stats.items.forEach((stat,index)=>build+=`${index>0?`, `:``}${stat.name}: ${stat.base}`)
    print(build)
}