import {types,graphics,listing} from './variables.mjs'
export function preload(){
    let root=`../`
    types.map.forEach(map=>graphics.load.map.push(loadImage(`${root}Assets/map/${map.term}.png`)))
    listing.city.forEach(city=>graphics.load.city.push(loadImage(`${root}Assets/city/numeric/${city}.png`)))
    listing.team.forEach(team=>graphics.load.team.push(loadImage(`${root}Assets/team/${team}.png`)))
    listing.unit.forEach(team=>graphics.load.unit.push(loadImage(`${root}Assets/unit/numeric/${team}.png`)))
}
window.preload=preload
window.graphics=graphics