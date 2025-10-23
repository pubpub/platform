(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,34348,e=>{"use strict";var t=e.i(24708),i=(0,t.__name)((e,i,a,l)=>{e.attr("class",a);let{width:o,height:n,x:c,y:d}=r(e,i);(0,t.configureSvgSize)(e,n,o,l);let g=s(c,d,o,n,i);e.attr("viewBox",g),t.log.debug(`viewBox configured: ${g} with padding: ${i}`)},"setupViewPortForSVG"),r=(0,t.__name)((e,t)=>{let i=e.node()?.getBBox()||{width:0,height:0,x:0,y:0};return{width:i.width+2*t,height:i.height+2*t,x:i.x,y:i.y}},"calculateDimensionsWithPadding"),s=(0,t.__name)((e,t,i,r,s)=>`${e-s} ${t-s} ${i} ${r}`,"createViewBox");e.s(["setupViewPortForSVG",()=>i])},61249,e=>{"use strict";var t=e.i(24708);e.i(91577);var i=e.i(92423),r=(0,t.__name)((e,t)=>{let r;return"sandbox"===t&&(r=(0,i.select)("#i"+e)),("sandbox"===t?(0,i.select)(r.nodes()[0].contentDocument.body):(0,i.select)("body")).select(`[id="${e}"]`)},"getDiagramElement");e.s(["getDiagramElement",()=>r])},79766,e=>{"use strict";var t=(0,e.i(24708).__name)(()=>`
  /* Font Awesome icon styling - consolidated */
  .label-icon {
    display: inline-block;
    height: 1em;
    overflow: visible;
    vertical-align: -0.125em;
  }
  
  .node .label-icon path {
    fill: currentColor;
    stroke: revert;
    stroke-width: revert;
  }
`,"getIconStyles");e.s(["getIconStyles",()=>t])},81273,e=>{"use strict";var t=e.i(85232);e.i(79766),e.i(61249),e.i(34348),e.i(35106),e.i(20518),e.i(72106),e.i(84946),e.i(21838),e.i(19720),e.i(7),e.i(77969);var i=e.i(24708),r={parser:t.classDiagram_default,get db(){return new t.ClassDB},renderer:t.classRenderer_v3_unified_default,styles:t.styles_default,init:(0,i.__name)(e=>{e.class||(e.class={}),e.class.arrowMarkerAbsolute=e.arrowMarkerAbsolute},"init")};e.s(["diagram",()=>r])}]);