/* use geojson cause why not
 */
// TODO: for zoom support, do something to preserve position on page as pts
// function pixelsToPt(piX, piY){
//   // do something
//   // opt ? asString : asInt
//   var ptX, ptY;
//   return [ptX, ptY];
// }

function point(x, y,radius){
  //
  return {
    type:'Feature',
    properties: {radius},
    geometry: { 
      type:'Point',
      coordinates:[ x, y ]
    }
  };
}
function box(x, y, radius){
  //
}
function text(x, y, text){
  //
}

// draw:
// document.getElementById('canvas-id').addEventListener('mousedown', (e)=>f(e.clientX, e.clientY))
// .addEventListener('mouseup', (e)=>f(e.clientX, e.clientY))

// target uri-encoded obj structure {pg#:[markers]}

export { point, box, text };
