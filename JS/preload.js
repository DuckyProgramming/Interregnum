function preload(){
    let root=INNER_INDEX?`../`:``
    types.map.forEach(map=>graphics.load.map.push(loadImage(`${root}Assets/map/${map.term}.png`)))
    types.cityType.forEach(city=>graphics.load.city.push(loadImage(`${root}Assets/city/${city.term}.png`)))
    types.teamListing.forEach(team=>{graphics.load.unit.push([loadImage(`${root}Assets/large/${team}.png`),loadImage(`${root}Assets/garrison/${team}.png`),loadImage(`${root}Assets/display/${team}.png`)])})
}