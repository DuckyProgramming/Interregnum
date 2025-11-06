function preload(){
    graphics.load.map=loadImage(`../Assets/gameMapPNG.png`)
    graphics.load.city=[loadImage(`../Assets/cityPNG.png`),loadImage(`../Assets/electorPNG.png`)]
    types.team.forEach(team=>{graphics.load.unit.push([loadImage(`../Assets/large/${team.term}.png`),loadImage(`../Assets/garrison/${team.term}.png`),loadImage(`../Assets/display/${team.term}.png`)])})
}