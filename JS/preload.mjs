import {types,graphics,listing} from './variables.mjs'
export function preload(){
    let root=INNER_INDEX?`../`:``
    types.map.forEach((map,index)=>{graphics.load.map.push(index==0?loadImage(`${root}Assets/map/${map.term}.png`):0);graphics.load.team.push([])})
    types.map[0].team.forEach(team=>graphics.load.team[0].push(loadImage(`${root}Assets/team/${team.term}.png`)))
    listing.city.forEach(city=>graphics.load.city.push(loadImage(`${root}Assets/city/${city}.png`)))
    listing.unit.forEach(team=>graphics.load.unit.push(loadImage(`${root}Assets/unit/${team}.png`)))
}
window.preload=preload
window.graphics=graphics