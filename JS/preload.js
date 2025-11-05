function preload(){
    graphics.load.map=loadImage(`../Assets/gameMapPNG.png`)
    types.team.forEach(team=>{graphics.load.unit.push([loadImage(`../Assets/large/${team.term}.png`),loadImage(`../Assets/garrison/${team.term}.png`)])})
}