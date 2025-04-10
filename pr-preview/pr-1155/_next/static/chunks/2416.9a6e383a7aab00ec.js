"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2416],{11154:(t,e,r)=>{r.d(e,{m:()=>o});var a=r(35303),o=class{constructor(t){this.init=t,this.records=this.init()}static{(0,a.K2)(this,"ImperativeState")}reset(){this.records=this.init()}}},42416:(t,e,r)=>{r.d(e,{diagram:()=>tp});var a=r(77683),o=r(11154),i=r(32733),c=r(35303),s=r(55257),n=r(13483),h={NORMAL:0,REVERSE:1,HIGHLIGHT:2,MERGE:3,CHERRY_PICK:4},d=c.UI.gitGraph,l=(0,c.K2)(()=>(0,i.$t)({...d,...(0,c.zj)().gitGraph}),"getConfig"),m=new o.m(()=>{let t=l(),e=t.mainBranchName,r=t.mainBranchOrder;return{mainBranchName:e,commits:new Map,head:null,branchConfig:new Map([[e,{name:e,order:r}]]),branches:new Map([[e,null]]),currBranch:e,direction:"LR",seq:0,options:{}}});function $(){return(0,i.yT)({length:7})}function g(t,e){let r=Object.create(null);return t.reduce((t,a)=>{let o=e(a);return r[o]||(r[o]=!0,t.push(a)),t},[])}(0,c.K2)($,"getID"),(0,c.K2)(g,"uniqBy");var y=(0,c.K2)(function(t){m.records.direction=t},"setDirection"),p=(0,c.K2)(function(t){c.Rm.debug("options str",t),t=(t=t?.trim())||"{}";try{m.records.options=JSON.parse(t)}catch(t){c.Rm.error("error while parsing gitGraph options",t.message)}},"setOptions"),x=(0,c.K2)(function(){return m.records.options},"getOptions"),f=(0,c.K2)(function(t){let e=t.msg,r=t.id,a=t.type,o=t.tags;c.Rm.info("commit",e,r,a,o),c.Rm.debug("Entering commit:",e,r,a,o);let i=l();r=c.Y2.sanitizeText(r,i),e=c.Y2.sanitizeText(e,i),o=o?.map(t=>c.Y2.sanitizeText(t,i));let s={id:r||m.records.seq+"-"+$(),message:e,seq:m.records.seq++,type:a??h.NORMAL,tags:o??[],parents:null==m.records.head?[]:[m.records.head.id],branch:m.records.currBranch};m.records.head=s,c.Rm.info("main branch",i.mainBranchName),m.records.commits.set(s.id,s),m.records.branches.set(m.records.currBranch,s.id),c.Rm.debug("in pushCommit "+s.id)},"commit"),u=(0,c.K2)(function(t){let e=t.name,r=t.order;if(e=c.Y2.sanitizeText(e,l()),m.records.branches.has(e))throw Error(`Trying to create an existing branch. (Help: Either use a new name if you want create a new branch or try using "checkout ${e}")`);m.records.branches.set(e,null!=m.records.head?m.records.head.id:null),m.records.branchConfig.set(e,{name:e,order:r}),E(e),c.Rm.debug("in createBranch")},"branch"),b=(0,c.K2)(t=>{let e=t.branch,r=t.id,a=t.type,o=t.tags,i=l();e=c.Y2.sanitizeText(e,i),r&&(r=c.Y2.sanitizeText(r,i));let s=m.records.branches.get(m.records.currBranch),n=m.records.branches.get(e),d=s?m.records.commits.get(s):void 0,g=n?m.records.commits.get(n):void 0;if(d&&g&&d.branch===e)throw Error(`Cannot merge branch '${e}' into itself.`);if(m.records.currBranch===e){let t=Error('Incorrect usage of "merge". Cannot merge a branch to itself');throw t.hash={text:`merge ${e}`,token:`merge ${e}`,expected:["branch abc"]},t}if(void 0===d||!d){let t=Error(`Incorrect usage of "merge". Current branch (${m.records.currBranch})has no commits`);throw t.hash={text:`merge ${e}`,token:`merge ${e}`,expected:["commit"]},t}if(!m.records.branches.has(e)){let t=Error('Incorrect usage of "merge". Branch to be merged ('+e+") does not exist");throw t.hash={text:`merge ${e}`,token:`merge ${e}`,expected:[`branch ${e}`]},t}if(void 0===g||!g){let t=Error('Incorrect usage of "merge". Branch to be merged ('+e+") has no commits");throw t.hash={text:`merge ${e}`,token:`merge ${e}`,expected:['"commit"']},t}if(d===g){let t=Error('Incorrect usage of "merge". Both branches have same head');throw t.hash={text:`merge ${e}`,token:`merge ${e}`,expected:["branch abc"]},t}if(r&&m.records.commits.has(r)){let t=Error('Incorrect usage of "merge". Commit with id:'+r+" already exists, use different custom Id");throw t.hash={text:`merge ${e} ${r} ${a} ${o?.join(" ")}`,token:`merge ${e} ${r} ${a} ${o?.join(" ")}`,expected:[`merge ${e} ${r}_UNIQUE ${a} ${o?.join(" ")}`]},t}let y={id:r||`${m.records.seq}-${$()}`,message:`merged branch ${e} into ${m.records.currBranch}`,seq:m.records.seq++,parents:null==m.records.head?[]:[m.records.head.id,n||""],branch:m.records.currBranch,type:h.MERGE,customType:a,customId:!!r,tags:o??[]};m.records.head=y,m.records.commits.set(y.id,y),m.records.branches.set(m.records.currBranch,y.id),c.Rm.debug(m.records.branches),c.Rm.debug("in mergeBranch")},"merge"),w=(0,c.K2)(function(t){let e=t.id,r=t.targetId,a=t.tags,o=t.parent;c.Rm.debug("Entering cherryPick:",e,r,a);let i=l();if(e=c.Y2.sanitizeText(e,i),r=c.Y2.sanitizeText(r,i),a=a?.map(t=>c.Y2.sanitizeText(t,i)),o=c.Y2.sanitizeText(o,i),!e||!m.records.commits.has(e)){let t=Error('Incorrect usage of "cherryPick". Source commit id should exist and provided');throw t.hash={text:`cherryPick ${e} ${r}`,token:`cherryPick ${e} ${r}`,expected:["cherry-pick abc"]},t}let s=m.records.commits.get(e);if(void 0===s||!s)throw Error('Incorrect usage of "cherryPick". Source commit id should exist and provided');if(o&&!(Array.isArray(s.parents)&&s.parents.includes(o)))throw Error("Invalid operation: The specified parent commit is not an immediate parent of the cherry-picked commit.");let n=s.branch;if(s.type===h.MERGE&&!o)throw Error("Incorrect usage of cherry-pick: If the source commit is a merge commit, an immediate parent commit must be specified.");if(!r||!m.records.commits.has(r)){if(n===m.records.currBranch){let t=Error('Incorrect usage of "cherryPick". Source commit is already on current branch');throw t.hash={text:`cherryPick ${e} ${r}`,token:`cherryPick ${e} ${r}`,expected:["cherry-pick abc"]},t}let t=m.records.branches.get(m.records.currBranch);if(void 0===t||!t){let t=Error(`Incorrect usage of "cherry-pick". Current branch (${m.records.currBranch})has no commits`);throw t.hash={text:`cherryPick ${e} ${r}`,token:`cherryPick ${e} ${r}`,expected:["cherry-pick abc"]},t}let i=m.records.commits.get(t);if(void 0===i||!i){let t=Error(`Incorrect usage of "cherry-pick". Current branch (${m.records.currBranch})has no commits`);throw t.hash={text:`cherryPick ${e} ${r}`,token:`cherryPick ${e} ${r}`,expected:["cherry-pick abc"]},t}let d={id:m.records.seq+"-"+$(),message:`cherry-picked ${s?.message} into ${m.records.currBranch}`,seq:m.records.seq++,parents:null==m.records.head?[]:[m.records.head.id,s.id],branch:m.records.currBranch,type:h.CHERRY_PICK,tags:a?a.filter(Boolean):[`cherry-pick:${s.id}${s.type===h.MERGE?`|parent:${o}`:""}`]};m.records.head=d,m.records.commits.set(d.id,d),m.records.branches.set(m.records.currBranch,d.id),c.Rm.debug(m.records.branches),c.Rm.debug("in cherryPick")}},"cherryPick"),E=(0,c.K2)(function(t){if(t=c.Y2.sanitizeText(t,l()),m.records.branches.has(t)){m.records.currBranch=t;let e=m.records.branches.get(m.records.currBranch);void 0!==e&&e?m.records.head=m.records.commits.get(e)??null:m.records.head=null}else{let e=Error(`Trying to checkout branch which is not yet created. (Help try using "branch ${t}")`);throw e.hash={text:`checkout ${t}`,token:`checkout ${t}`,expected:[`branch ${t}`]},e}},"checkout");function B(t,e,r){let a=t.indexOf(e);-1===a?t.push(r):t.splice(a,1,r)}function k(t){let e=t.reduce((t,e)=>t.seq>e.seq?t:e,t[0]),r="";t.forEach(function(t){t===e?r+="	*":r+="	|"});let a=[r,e.id,e.seq];for(let t in m.records.branches)m.records.branches.get(t)===e.id&&a.push(t);if(c.Rm.debug(a.join(" ")),e.parents&&2==e.parents.length&&e.parents[0]&&e.parents[1]){let r=m.records.commits.get(e.parents[0]);B(t,e,r),e.parents[1]&&t.push(m.records.commits.get(e.parents[1]))}else if(0==e.parents.length)return;else if(e.parents[0]){let r=m.records.commits.get(e.parents[0]);B(t,e,r)}k(t=g(t,t=>t.id))}(0,c.K2)(B,"upsert"),(0,c.K2)(k,"prettyPrintCommitHistory");var C=(0,c.K2)(function(){c.Rm.debug(m.records.commits),k([R()[0]])},"prettyPrint"),L=(0,c.K2)(function(){m.reset(),(0,c.IU)()},"clear"),T=(0,c.K2)(function(){return[...m.records.branchConfig.values()].map((t,e)=>null!==t.order&&void 0!==t.order?t:{...t,order:parseFloat(`0.${e}`)}).sort((t,e)=>(t.order??0)-(e.order??0)).map(({name:t})=>({name:t}))},"getBranchesAsObjArray"),K=(0,c.K2)(function(){return m.records.branches},"getBranches"),M=(0,c.K2)(function(){return m.records.commits},"getCommits"),R=(0,c.K2)(function(){let t=[...m.records.commits.values()];return t.forEach(function(t){c.Rm.debug(t.id)}),t.sort((t,e)=>t.seq-e.seq),t},"getCommitsArray"),v={commitType:h,getConfig:l,setDirection:y,setOptions:p,getOptions:x,commit:f,branch:u,merge:b,cherryPick:w,checkout:E,prettyPrint:C,clear:L,getBranchesAsObjArray:T,getBranches:K,getCommits:M,getCommitsArray:R,getCurrentBranch:(0,c.K2)(function(){return m.records.currBranch},"getCurrentBranch"),getDirection:(0,c.K2)(function(){return m.records.direction},"getDirection"),getHead:(0,c.K2)(function(){return m.records.head},"getHead"),setAccTitle:c.SV,getAccTitle:c.iN,getAccDescription:c.m7,setAccDescription:c.EI,setDiagramTitle:c.ke,getDiagramTitle:c.ab},P=(0,c.K2)((t,e)=>{for(let r of((0,a.S)(t,e),t.dir&&e.setDirection(t.dir),t.statements))I(r,e)},"populate"),I=(0,c.K2)((t,e)=>{let r={Commit:(0,c.K2)(t=>e.commit(A(t)),"Commit"),Branch:(0,c.K2)(t=>e.branch(G(t)),"Branch"),Merge:(0,c.K2)(t=>e.merge(q(t)),"Merge"),Checkout:(0,c.K2)(t=>e.checkout(O(t)),"Checkout"),CherryPicking:(0,c.K2)(t=>e.cherryPick(z(t)),"CherryPicking")}[t.$type];r?r(t):c.Rm.error(`Unknown statement type: ${t.$type}`)},"parseStatement"),A=(0,c.K2)(t=>({id:t.id,msg:t.message??"",type:void 0!==t.type?h[t.type]:h.NORMAL,tags:t.tags??void 0}),"parseCommit"),G=(0,c.K2)(t=>({name:t.name,order:t.order??0}),"parseBranch"),q=(0,c.K2)(t=>({branch:t.branch,id:t.id??"",type:void 0!==t.type?h[t.type]:void 0,tags:t.tags??void 0}),"parseMerge"),O=(0,c.K2)(t=>t.branch,"parseCheckout"),z=(0,c.K2)(t=>({id:t.id,targetId:"",tags:t.tags?.length===0?void 0:t.tags,parent:t.parent}),"parseCherryPicking"),H={parse:(0,c.K2)(async t=>{let e=await (0,s.qg)("gitGraph",t);c.Rm.debug(e),P(e,v)},"parse")},S=(0,c.D7)(),D=S?.gitGraph,Y=new Map,N=new Map,_=new Map,j=[],W=0,F="LR",U=(0,c.K2)(()=>{Y.clear(),N.clear(),_.clear(),W=0,j=[],F="LR"},"clear"),V=(0,c.K2)(t=>{let e=document.createElementNS("http://www.w3.org/2000/svg","text");return("string"==typeof t?t.split(/\\n|\n|<br\s*\/?>/gi):t).forEach(t=>{let r=document.createElementNS("http://www.w3.org/2000/svg","tspan");r.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve"),r.setAttribute("dy","1em"),r.setAttribute("x","0"),r.setAttribute("class","row"),r.textContent=t.trim(),e.appendChild(r)}),e},"drawText"),J=(0,c.K2)(t=>{let e,r,a;return"BT"===F?(r=(0,c.K2)((t,e)=>t<=e,"comparisonFunc"),a=1/0):(r=(0,c.K2)((t,e)=>t>=e,"comparisonFunc"),a=0),t.forEach(t=>{let o="TB"===F||"BT"==F?N.get(t)?.y:N.get(t)?.x;void 0!==o&&r(o,a)&&(e=t,a=o)}),e},"findClosestParent"),Q=(0,c.K2)(t=>{let e="",r=1/0;return t.forEach(t=>{let a=N.get(t).y;a<=r&&(e=t,r=a)}),e||void 0},"findClosestParentBT"),X=(0,c.K2)((t,e,r)=>{let a=r,o=r,i=[];t.forEach(t=>{let r=e.get(t);if(!r)throw Error(`Commit not found for key ${t}`);r.parents.length?o=Math.max(a=tt(r),o):i.push(r),te(r,a)}),a=o,i.forEach(t=>{tr(t,a,r)}),t.forEach(t=>{let r=e.get(t);if(r?.parents.length){let t=Q(r.parents);(a=N.get(t).y-40)<=o&&(o=a);let e=Y.get(r.branch).pos,i=a-10;N.set(r.id,{x:e,y:i})}})},"setParallelBTPos"),Z=(0,c.K2)(t=>{let e=J(t.parents.filter(t=>null!==t));if(!e)throw Error(`Closest parent not found for commit ${t.id}`);let r=N.get(e)?.y;if(void 0===r)throw Error(`Closest parent position not found for commit ${t.id}`);return r},"findClosestParentPos"),tt=(0,c.K2)(t=>Z(t)+40,"calculateCommitPosition"),te=(0,c.K2)((t,e)=>{let r=Y.get(t.branch);if(!r)throw Error(`Branch not found for commit ${t.id}`);let a=r.pos,o=e+10;return N.set(t.id,{x:a,y:o}),{x:a,y:o}},"setCommitPosition"),tr=(0,c.K2)((t,e,r)=>{let a=Y.get(t.branch);if(!a)throw Error(`Branch not found for commit ${t.id}`);let o=a.pos;N.set(t.id,{x:o,y:e+r})},"setRootPosition"),ta=(0,c.K2)((t,e,r,a,o,i)=>{if(i===h.HIGHLIGHT)t.append("rect").attr("x",r.x-10).attr("y",r.y-10).attr("width",20).attr("height",20).attr("class",`commit ${e.id} commit-highlight${o%8} ${a}-outer`),t.append("rect").attr("x",r.x-6).attr("y",r.y-6).attr("width",12).attr("height",12).attr("class",`commit ${e.id} commit${o%8} ${a}-inner`);else if(i===h.CHERRY_PICK)t.append("circle").attr("cx",r.x).attr("cy",r.y).attr("r",10).attr("class",`commit ${e.id} ${a}`),t.append("circle").attr("cx",r.x-3).attr("cy",r.y+2).attr("r",2.75).attr("fill","#fff").attr("class",`commit ${e.id} ${a}`),t.append("circle").attr("cx",r.x+3).attr("cy",r.y+2).attr("r",2.75).attr("fill","#fff").attr("class",`commit ${e.id} ${a}`),t.append("line").attr("x1",r.x+3).attr("y1",r.y+1).attr("x2",r.x).attr("y2",r.y-5).attr("stroke","#fff").attr("class",`commit ${e.id} ${a}`),t.append("line").attr("x1",r.x-3).attr("y1",r.y+1).attr("x2",r.x).attr("y2",r.y-5).attr("stroke","#fff").attr("class",`commit ${e.id} ${a}`);else{let c=t.append("circle");if(c.attr("cx",r.x),c.attr("cy",r.y),c.attr("r",e.type===h.MERGE?9:10),c.attr("class",`commit ${e.id} commit${o%8}`),i===h.MERGE){let i=t.append("circle");i.attr("cx",r.x),i.attr("cy",r.y),i.attr("r",6),i.attr("class",`commit ${a} ${e.id} commit${o%8}`)}i===h.REVERSE&&t.append("path").attr("d",`M ${r.x-5},${r.y-5}L${r.x+5},${r.y+5}M${r.x-5},${r.y+5}L${r.x+5},${r.y-5}`).attr("class",`commit ${a} ${e.id} commit${o%8}`)}},"drawCommitBullet"),to=(0,c.K2)((t,e,r,a)=>{if(e.type!==h.CHERRY_PICK&&(e.customId&&e.type===h.MERGE||e.type!==h.MERGE)&&D?.showCommitLabel){let o=t.append("g"),i=o.insert("rect").attr("class","commit-label-bkg"),c=o.append("text").attr("x",a).attr("y",r.y+25).attr("class","commit-label").text(e.id),s=c.node()?.getBBox();if(s&&(i.attr("x",r.posWithOffset-s.width/2-2).attr("y",r.y+13.5).attr("width",s.width+4).attr("height",s.height+4),"TB"===F||"BT"===F?(i.attr("x",r.x-(s.width+16+5)).attr("y",r.y-12),c.attr("x",r.x-(s.width+16)).attr("y",r.y+s.height-12)):c.attr("x",r.posWithOffset-s.width/2),D.rotateCommitLabel)){if("TB"===F||"BT"===F)c.attr("transform","rotate(-45, "+r.x+", "+r.y+")"),i.attr("transform","rotate(-45, "+r.x+", "+r.y+")");else{let t=-7.5-(s.width+10)/25*9.5,e=10+s.width/25*8.5;o.attr("transform","translate("+t+", "+e+") rotate(-45, "+a+", "+r.y+")")}}}},"drawCommitLabel"),ti=(0,c.K2)((t,e,r,a)=>{if(e.tags.length>0){let o=0,i=0,c=0,s=[];for(let a of e.tags.reverse()){let e=t.insert("polygon"),n=t.append("circle"),h=t.append("text").attr("y",r.y-16-o).attr("class","tag-label").text(a),d=h.node()?.getBBox();if(!d)throw Error("Tag bbox not found");i=Math.max(i,d.width),c=Math.max(c,d.height),h.attr("x",r.posWithOffset-d.width/2),s.push({tag:h,hole:n,rect:e,yOffset:o}),o+=20}for(let{tag:t,hole:e,rect:o,yOffset:n}of s){let s=c/2,h=r.y-19.2-n;if(o.attr("class","tag-label-bkg").attr("points",`
      ${a-i/2-2},${h+2}  
      ${a-i/2-2},${h-2}
      ${r.posWithOffset-i/2-4},${h-s-2}
      ${r.posWithOffset+i/2+4},${h-s-2}
      ${r.posWithOffset+i/2+4},${h+s+2}
      ${r.posWithOffset-i/2-4},${h+s+2}`),e.attr("cy",h).attr("cx",a-i/2+2).attr("r",1.5).attr("class","tag-hole"),"TB"===F||"BT"===F){let c=a+n;o.attr("class","tag-label-bkg").attr("points",`
        ${r.x},${c+2}
        ${r.x},${c-2}
        ${r.x+10},${c-s-2}
        ${r.x+10+i+4},${c-s-2}
        ${r.x+10+i+4},${c+s+2}
        ${r.x+10},${c+s+2}`).attr("transform","translate(12,12) rotate(45, "+r.x+","+a+")"),e.attr("cx",r.x+2).attr("cy",c).attr("transform","translate(12,12) rotate(45, "+r.x+","+a+")"),t.attr("x",r.x+5).attr("y",c+3).attr("transform","translate(14,14) rotate(45, "+r.x+","+a+")")}}}},"drawCommitTags"),tc=(0,c.K2)(t=>{switch(t.customType??t.type){case h.NORMAL:return"commit-normal";case h.REVERSE:return"commit-reverse";case h.HIGHLIGHT:return"commit-highlight";case h.MERGE:return"commit-merge";case h.CHERRY_PICK:return"commit-cherry-pick";default:return"commit-normal"}},"getCommitClassType"),ts=(0,c.K2)((t,e,r,a)=>{let o={x:0,y:0};if(t.parents.length>0){let r=J(t.parents);if(r){let i=a.get(r)??o;return"TB"===e?i.y+40:"BT"===e?(a.get(t.id)??o).y-40:i.x+40}}else{if("TB"===e)return 30;if("BT"===e)return(a.get(t.id)??o).y-40}return 0},"calculatePosition"),tn=(0,c.K2)((t,e,r)=>{let a="BT"===F&&r?e:e+10,o="TB"===F||"BT"===F?a:Y.get(t.branch)?.pos,i="TB"===F||"BT"===F?Y.get(t.branch)?.pos:a;if(void 0===i||void 0===o)throw Error(`Position were undefined for commit ${t.id}`);return{x:i,y:o,posWithOffset:a}},"getCommitPosition"),th=(0,c.K2)((t,e,r)=>{if(!D)throw Error("GitGraph config not found");let a=t.append("g").attr("class","commit-bullets"),o=t.append("g").attr("class","commit-labels"),i=30*("TB"===F||"BT"===F),s=[...e.keys()],n=D?.parallelCommits??!1,h=s.sort((0,c.K2)((t,r)=>{let a=e.get(t)?.seq,o=e.get(r)?.seq;return void 0!==a&&void 0!==o?a-o:0},"sortKeys"));"BT"===F&&(n&&X(h,e,i),h=h.reverse()),h.forEach(t=>{let c=e.get(t);if(!c)throw Error(`Commit not found for key ${t}`);n&&(i=ts(c,F,i,N));let s=tn(c,i,n);if(r){let t=tc(c),e=c.customType??c.type,r=Y.get(c.branch)?.index??0;ta(a,c,s,t,r,e),to(o,c,s,i),ti(o,c,s,i)}"TB"===F||"BT"===F?N.set(c.id,{x:s.x,y:s.posWithOffset}):N.set(c.id,{x:s.posWithOffset,y:s.y}),(i="BT"===F&&n?i+40:i+40+10)>W&&(W=i)})},"drawCommits"),td=(0,c.K2)((t,e,r,a,o)=>{let i=("TB"===F||"BT"===F?r.x<a.x:r.y<a.y)?e.branch:t.branch,s=(0,c.K2)(t=>t.branch===i,"isOnBranchToGetCurve"),n=(0,c.K2)(r=>r.seq>t.seq&&r.seq<e.seq,"isBetweenCommits");return[...o.values()].some(t=>n(t)&&s(t))},"shouldRerouteArrow"),tl=(0,c.K2)((t,e,r=0)=>{let a=t+Math.abs(t-e)/2;if(r>5)return a;if(j.every(t=>Math.abs(t-a)>=10))return j.push(a),a;let o=Math.abs(t-e);return tl(t,e-o/5,r+1)},"findLane"),tm=(0,c.K2)((t,e,r,a)=>{let o;let i=N.get(e.id),c=N.get(r.id);if(void 0===i||void 0===c)throw Error(`Commit positions not found for commits ${e.id} and ${r.id}`);let s=td(e,r,i,c,a),n="",d="",l=0,m=0,$=Y.get(r.branch)?.index;if(r.type===h.MERGE&&e.id!==r.parents[0]&&($=Y.get(e.branch)?.index),s){n="A 10 10, 0, 0, 0,",d="A 10 10, 0, 0, 1,",l=10,m=10;let t=i.y<c.y?tl(i.y,c.y):tl(c.y,i.y),r=i.x<c.x?tl(i.x,c.x):tl(c.x,i.x);"TB"===F?i.x<c.x?o=`M ${i.x} ${i.y} L ${r-l} ${i.y} ${d} ${r} ${i.y+m} L ${r} ${c.y-l} ${n} ${r+m} ${c.y} L ${c.x} ${c.y}`:($=Y.get(e.branch)?.index,o=`M ${i.x} ${i.y} L ${r+l} ${i.y} ${n} ${r} ${i.y+m} L ${r} ${c.y-l} ${d} ${r-m} ${c.y} L ${c.x} ${c.y}`):"BT"===F?i.x<c.x?o=`M ${i.x} ${i.y} L ${r-l} ${i.y} ${n} ${r} ${i.y-m} L ${r} ${c.y+l} ${d} ${r+m} ${c.y} L ${c.x} ${c.y}`:($=Y.get(e.branch)?.index,o=`M ${i.x} ${i.y} L ${r+l} ${i.y} ${d} ${r} ${i.y-m} L ${r} ${c.y+l} ${n} ${r-m} ${c.y} L ${c.x} ${c.y}`):i.y<c.y?o=`M ${i.x} ${i.y} L ${i.x} ${t-l} ${n} ${i.x+m} ${t} L ${c.x-l} ${t} ${d} ${c.x} ${t+m} L ${c.x} ${c.y}`:($=Y.get(e.branch)?.index,o=`M ${i.x} ${i.y} L ${i.x} ${t+l} ${d} ${i.x+m} ${t} L ${c.x-l} ${t} ${n} ${c.x} ${t-m} L ${c.x} ${c.y}`)}else n="A 20 20, 0, 0, 0,",d="A 20 20, 0, 0, 1,",l=20,m=20,"TB"===F?(i.x<c.x&&(o=r.type===h.MERGE&&e.id!==r.parents[0]?`M ${i.x} ${i.y} L ${i.x} ${c.y-l} ${n} ${i.x+m} ${c.y} L ${c.x} ${c.y}`:`M ${i.x} ${i.y} L ${c.x-l} ${i.y} ${d} ${c.x} ${i.y+m} L ${c.x} ${c.y}`),i.x>c.x&&(n="A 20 20, 0, 0, 0,",d="A 20 20, 0, 0, 1,",l=20,m=20,o=r.type===h.MERGE&&e.id!==r.parents[0]?`M ${i.x} ${i.y} L ${i.x} ${c.y-l} ${d} ${i.x-m} ${c.y} L ${c.x} ${c.y}`:`M ${i.x} ${i.y} L ${c.x+l} ${i.y} ${n} ${c.x} ${i.y+m} L ${c.x} ${c.y}`),i.x===c.x&&(o=`M ${i.x} ${i.y} L ${c.x} ${c.y}`)):"BT"===F?(i.x<c.x&&(o=r.type===h.MERGE&&e.id!==r.parents[0]?`M ${i.x} ${i.y} L ${i.x} ${c.y+l} ${d} ${i.x+m} ${c.y} L ${c.x} ${c.y}`:`M ${i.x} ${i.y} L ${c.x-l} ${i.y} ${n} ${c.x} ${i.y-m} L ${c.x} ${c.y}`),i.x>c.x&&(n="A 20 20, 0, 0, 0,",d="A 20 20, 0, 0, 1,",l=20,m=20,o=r.type===h.MERGE&&e.id!==r.parents[0]?`M ${i.x} ${i.y} L ${i.x} ${c.y+l} ${n} ${i.x-m} ${c.y} L ${c.x} ${c.y}`:`M ${i.x} ${i.y} L ${c.x-l} ${i.y} ${n} ${c.x} ${i.y-m} L ${c.x} ${c.y}`),i.x===c.x&&(o=`M ${i.x} ${i.y} L ${c.x} ${c.y}`)):(i.y<c.y&&(o=r.type===h.MERGE&&e.id!==r.parents[0]?`M ${i.x} ${i.y} L ${c.x-l} ${i.y} ${d} ${c.x} ${i.y+m} L ${c.x} ${c.y}`:`M ${i.x} ${i.y} L ${i.x} ${c.y-l} ${n} ${i.x+m} ${c.y} L ${c.x} ${c.y}`),i.y>c.y&&(o=r.type===h.MERGE&&e.id!==r.parents[0]?`M ${i.x} ${i.y} L ${c.x-l} ${i.y} ${n} ${c.x} ${i.y-m} L ${c.x} ${c.y}`:`M ${i.x} ${i.y} L ${i.x} ${c.y+l} ${d} ${i.x+m} ${c.y} L ${c.x} ${c.y}`),i.y===c.y&&(o=`M ${i.x} ${i.y} L ${c.x} ${c.y}`));if(void 0===o)throw Error("Line definition not found");t.append("path").attr("d",o).attr("class","arrow arrow"+$%8)},"drawArrow"),t$=(0,c.K2)((t,e)=>{let r=t.append("g").attr("class","commit-arrows");[...e.keys()].forEach(t=>{let a=e.get(t);a.parents&&a.parents.length>0&&a.parents.forEach(t=>{tm(r,e.get(t),a,e)})})},"drawArrows"),tg=(0,c.K2)((t,e)=>{let r=t.append("g");e.forEach((t,e)=>{let a=e%8,o=Y.get(t.name)?.pos;if(void 0===o)throw Error(`Position not found for branch ${t.name}`);let i=r.append("line");i.attr("x1",0),i.attr("y1",o),i.attr("x2",W),i.attr("y2",o),i.attr("class","branch branch"+a),"TB"===F?(i.attr("y1",30),i.attr("x1",o),i.attr("y2",W),i.attr("x2",o)):"BT"===F&&(i.attr("y1",W),i.attr("x1",o),i.attr("y2",30),i.attr("x2",o)),j.push(o);let c=V(t.name),s=r.insert("rect"),n=r.insert("g").attr("class","branchLabel").insert("g").attr("class","label branch-label"+a);n.node().appendChild(c);let h=c.getBBox();s.attr("class","branchLabelBkg label"+a).attr("rx",4).attr("ry",4).attr("x",-h.width-4-30*(D?.rotateCommitLabel===!0)).attr("y",-h.height/2+8).attr("width",h.width+18).attr("height",h.height+4),n.attr("transform","translate("+(-h.width-14-30*(D?.rotateCommitLabel===!0))+", "+(o-h.height/2-1)+")"),"TB"===F?(s.attr("x",o-h.width/2-10).attr("y",0),n.attr("transform","translate("+(o-h.width/2-5)+", 0)")):"BT"===F?(s.attr("x",o-h.width/2-10).attr("y",W),n.attr("transform","translate("+(o-h.width/2-5)+", "+W+")")):s.attr("transform","translate(-19, "+(o-h.height/2)+")")})},"drawBranches"),ty=(0,c.K2)(function(t,e,r,a,o){return Y.set(t,{pos:e,index:r}),e+=50+40*!!o+("TB"===F||"BT"===F?a.width/2:0)},"setBranchPosition"),tp={parser:H,db:v,renderer:{draw:(0,c.K2)(function(t,e,r,a){if(U(),c.Rm.debug("in gitgraph renderer",t+"\n","id:",e,r),!D)throw Error("GitGraph config not found");let o=D.rotateCommitLabel??!1,s=a.db;_=s.getCommits();let h=s.getBranchesAsObjArray();F=s.getDirection();let d=(0,n.Ltv)(`[id="${e}"]`),l=0;h.forEach((t,e)=>{let r=V(t.name),a=d.append("g"),i=a.insert("g").attr("class","branchLabel"),c=i.insert("g").attr("class","label branch-label");c.node()?.appendChild(r);let s=r.getBBox();l=ty(t.name,l,e,s,o),c.remove(),i.remove(),a.remove()}),th(d,_,!1),D.showBranches&&tg(d,h),t$(d,_),th(d,_,!0),i._K.insertTitle(d,"gitTitleText",D.titleTopMargin??0,s.getDiagramTitle()),(0,c.mj)(void 0,d,D.diagramPadding,D.useMaxWidth)},"draw")},styles:(0,c.K2)(t=>`
  .commit-id,
  .commit-msg,
  .branch-label {
    fill: lightgrey;
    color: lightgrey;
    font-family: 'trebuchet ms', verdana, arial, sans-serif;
    font-family: var(--mermaid-font-family);
  }
  ${[0,1,2,3,4,5,6,7].map(e=>`
        .branch-label${e} { fill: ${t["gitBranchLabel"+e]}; }
        .commit${e} { stroke: ${t["git"+e]}; fill: ${t["git"+e]}; }
        .commit-highlight${e} { stroke: ${t["gitInv"+e]}; fill: ${t["gitInv"+e]}; }
        .label${e}  { fill: ${t["git"+e]}; }
        .arrow${e} { stroke: ${t["git"+e]}; }
        `).join("\n")}

  .branch {
    stroke-width: 1;
    stroke: ${t.lineColor};
    stroke-dasharray: 2;
  }
  .commit-label { font-size: ${t.commitLabelFontSize}; fill: ${t.commitLabelColor};}
  .commit-label-bkg { font-size: ${t.commitLabelFontSize}; fill: ${t.commitLabelBackground}; opacity: 0.5; }
  .tag-label { font-size: ${t.tagLabelFontSize}; fill: ${t.tagLabelColor};}
  .tag-label-bkg { fill: ${t.tagLabelBackground}; stroke: ${t.tagLabelBorder}; }
  .tag-hole { fill: ${t.textColor}; }

  .commit-merge {
    stroke: ${t.primaryColor};
    fill: ${t.primaryColor};
  }
  .commit-reverse {
    stroke: ${t.primaryColor};
    fill: ${t.primaryColor};
    stroke-width: 3;
  }
  .commit-highlight-outer {
  }
  .commit-highlight-inner {
    stroke: ${t.primaryColor};
    fill: ${t.primaryColor};
  }

  .arrow { stroke-width: 8; stroke-linecap: round; fill: none}
  .gitTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.textColor};
  }
`,"getStyles")}},77683:(t,e,r)=>{function a(t,e){t.accDescr&&e.setAccDescription?.(t.accDescr),t.accTitle&&e.setAccTitle?.(t.accTitle),t.title&&e.setDiagramTitle?.(t.title)}r.d(e,{S:()=>a}),(0,r(35303).K2)(a,"populateCommonDb")}}]);