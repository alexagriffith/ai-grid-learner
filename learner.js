/* Public example UI. All example resources come from the public chart reference. */
(function () {
 'use strict';
 const reference=window.demoReference;
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={basic:'Basic · one cluster',combined:'Two clusters',shared:'Shared consumer',entries:'Multiple entry gateways'};
 const state={page:'platform',view:'overview',layout:'basic',entry:'a',provider:'a',mode:'request',requestView:'walkthrough',resourceKey:'a|Deployment|grid|consumer-gateway',step:0,selected:{role:'consumer',site:'a'}};
 function topology(layout='shared'){
  if(layout==='multiple')layout='entries';
  if(!labels[layout])throw new Error('Unknown example topology');
  const letters=layout==='basic'?['a']:layout==='combined'?['a','b']:['a','b','c','d'];
  const entries=layout==='shared'?[{key:'edge',site:'edge',identity:'edge',cluster:'Gateway cluster',label:'Shared consumer'}]:(layout==='basic'?['a']:layout==='combined'?['a','b']:['a','b','c','d','e']).map(key=>({key,site:['basic','combined'].includes(layout)?key:'entry-'+key,identity:['basic','combined'].includes(layout)?'site-'+key:'entry-'+key,cluster:layout==='basic'?'One cluster':layout==='combined'?'Cluster '+key.toUpperCase():'Entry gateway '+key.toUpperCase(),label:layout==='basic'?'Consumer gateway':'Consumer '+key.toUpperCase()}));
  const providers=letters.map(key=>({key,site:key,identity:'site-'+key,cluster:layout==='basic'?'One cluster':layout==='combined'?'Cluster '+key.toUpperCase():'Provider cluster '+key.toUpperCase(),label:layout==='basic'?'Provider gateway':'Provider '+key.toUpperCase()}));
  return {layout,entries,providers,requestEdges:entries.flatMap(entry=>providers.map(provider=>({from:'consumer:'+entry.site,to:'provider:'+provider.site}))) };
 }
 function chosen(){const model=topology(state.layout);return {model,entry:model.entries.find(x=>x.key===state.entry)||model.entries[0],provider:model.providers.find(x=>x.key===state.provider)||model.providers[0]};}
 function route(layout,entryKey,providerKey){const model=topology(layout),entry=model.entries.find(x=>x.key===entryKey),provider=model.providers.find(x=>x.key===providerKey);if(!entry||!provider)throw new Error('Unknown entry or provider');return ['litellm:front','consumer:'+entry.site,'provider:'+provider.site,'envoy:'+provider.site,'sim:'+provider.site];}
 function newScene(width,height){return {width,height,nodes:[],boundaries:[],edges:[],notes:[]};}
 function node(scene,role,site,x,y,w,h,title,sub='',boundary=''){const item={id:role+':'+site,role,site,x,y,w,h,title,sub,boundary};scene.nodes.push(item);return item;}
 function box(scene,id,x,y,w,h,title,footer=false){scene.boundaries.push({id,x,y,w,h,title,footer:false});}
 const port=(n,side)=>side==='top'?[n.x+n.w/2,n.y]:side==='bottom'?[n.x+n.w/2,n.y+n.h]:side==='left'?[n.x,n.y+n.h/2]:[n.x+n.w,n.y+n.h/2];
 function connect(scene,from,to,points,kind='request',selected=true,both=false,label=''){scene.edges.push({from:from.id,to:to.id,points,kind,selected,both,label});}
 function direct(scene,from,to,sideA='right',sideB='left',kind='request',selected=true){connect(scene,from,to,[port(from,sideA),port(to,sideB)],kind,selected);}
 function overviewScene(layout,entryKey,providerKey,narrow=false){
  const model=topology(layout),entry=model.entries.find(x=>x.key===entryKey)||model.entries[0],provider=model.providers.find(x=>x.key===providerKey)||model.providers[0];
  if(narrow&&['shared','entries'].includes(layout))return requestScene(layout,entryKey,providerKey,true);
  if(narrow){
   const s=newScene(380,650),same=layout==='basic'||layout==='combined'&&entry.key===provider.key;
   if(layout==='basic')box(s,'entry',10,10,360,620,'One cluster');
   else if(layout==='shared')box(s,'entry',10,10,360,275,'Gateway cluster');
   else box(s,'entry',10,145,360,same?485:130,entry.cluster);
   if(!same)box(s,'provider',10,340,360,290,provider.cluster,true);
   const l=node(s,'litellm','front',85,65,210,56,'AI gateway','LiteLLM (example)',['basic','shared'].includes(layout)?'entry':'');
   const c=node(s,'consumer',entry.site,85,185,210,56,entry.label,'Grid identity: '+entry.identity,'entry');
   const p=node(s,'provider',provider.site,80,375,220,56,provider.label,'Grid identity: '+provider.identity,same?'entry':'provider');
   const serving=node(s,'serving',provider.site,80,505,220,56,'llm-d serving','Local server selection',same?'entry':'provider');
   direct(s,l,c,'bottom','top');direct(s,c,p,'bottom','top');direct(s,p,serving,'bottom','top');
   
   return s;
  }
  if(layout==='entries'){
   const s=newScene(940,655),l=node(s,'litellm','front',370,20,200,56,'AI gateway','LiteLLM (example)'),consumers={};
   for(const [index,item] of model.entries.entries()){
    const c=consumers[item.key]=node(s,'consumer',item.site,15+index*185,160,170,56,item.label,'Entry gateway');
    connect(s,l,c,[port(l,'bottom'),[470,110],[c.x+85,110],port(c,'top')],'request',item.key===entry.key);
   }
   for(const [index,item] of model.providers.entries()){
    const x=10+index*235,id='provider-'+item.key;box(s,id,x,340,215,290,item.cluster);
    const p=node(s,'provider',item.site,x+15,395,185,56,item.label,'Provider gateway',id),serving=node(s,'serving',item.site,x+15,515,185,56,'llm-d serving','Local server selection',id),c=consumers[entry.key];
    connect(s,c,p,[port(c,'bottom'),[c.x+85,285],[p.x+p.w-20,285],[p.x+p.w-20,p.y]],'request',item.key===provider.key);direct(s,p,serving,'bottom','top','request',item.key===provider.key);
   }
   return s;
  }
  if(layout==='basic'){
   const s=newScene(940,410);box(s,'entry',10,20,920,365,'One cluster');
   const l=node(s,'litellm','front',40,100,180,56,'AI gateway','LiteLLM (example)','entry');
   const c=node(s,'consumer','a',280,100,220,56,'Consumer gateway','Provider selection','entry');
   const p=node(s,'provider','a',590,100,220,56,'Provider gateway','Serving access','entry');
   const serving=node(s,'serving','a',590,245,220,56,'llm-d serving','Local server selection','entry');
   node(s,'operator','a',40,245,220,56,'Grid control','Site identity and configuration','entry');
   node(s,'enrollment','edge',300,245,220,56,'Enrollment','Shared identity service','entry');
   direct(s,l,c);direct(s,c,p);direct(s,p,serving,'bottom','top');return s;
  }
  if(layout==='combined'){
   const s=newScene(940,635),l=node(s,'litellm','front',370,20,200,56,'AI gateway','LiteLLM (example)');
   const consumers={},providers={};
   for(const [i,site] of ['a','b'].entries()){
    const x=15+i*475,id='site-'+site;box(s,id,x,150,440,460,'Cluster '+site.toUpperCase()+' · '+id);
    consumers[site]=node(s,'consumer',site,x+110,220,220,56,'Consumer '+site.toUpperCase(),id,id);
    providers[site]=node(s,'provider',site,x+110,360,220,56,'Provider '+site.toUpperCase(),'Provider gateway',id);
    const serving=node(s,'serving',site,x+110,475,220,56,'llm-d serving','Local server selection',id);
    node(s,'operator',site,x+35,557,170,34,'Grid control','',id);node(s,'identity',site,x+235,557,170,34,'Site identity','',id);
    connect(s,l,consumers[site],[port(l,'bottom'),[470,115],[consumers[site].x+110,115],port(consumers[site],'top')],'request',site===entry.key);
    direct(s,providers[site],serving,'bottom','top','request',site===provider.key);
   }
   for(const p of model.providers){const from=consumers[entry.key],to=providers[p.key];connect(s,from,to,[port(from,'bottom'),[from.x+110,315],[to.x+110,315],port(to,'top')],'request',p.key===provider.key);}
   return s;
  }
  const s=newScene(940,635),shared=layout==='shared';
  if(shared)box(s,'entry',10,20,920,225,'Gateway cluster');
  else {box(s,'entry',245,20,265,225,entry.cluster+' · '+entry.identity);box(s,'enrollment',540,20,390,225,'Shared Grid enrollment');}
  const l=node(s,'litellm','front',40,95,165,56,'AI gateway','LiteLLM (example)',shared?'entry':'');
  const c=node(s,'consumer',entry.site,shared?260:272,95,210,56,entry.label,'Grid identity: '+entry.identity,'entry');
  node(s,'access-db','front',40,185,165,36,'Access database','',shared?'entry':'');
  if(shared){node(s,'operator',entry.site,550,80,340,50,'Grid control + edge identity','Configuration and provider signals','entry');node(s,'enrollment','edge',550,165,340,44,'Shared enrollment','Certificate issuance','entry');}
  else {node(s,'operator',entry.site,272,185,210,36,'Grid control + identity','','entry');node(s,'enrollment','edge',565,95,340,56,'Enrollment service','Shared certificate issuance','enrollment');node(s,'enrollment-db','edge',565,185,340,36,'Enrollment database','','enrollment');}
  direct(s,l,c);
  for(const [i,p] of model.providers.entries()){
   const x=10+i*235,id='provider-'+p.key;box(s,id,x,350,215,260,p.cluster,true);
   const gateway=node(s,'provider',p.site,x+15,405,185,56,p.label,'Grid identity: '+p.identity,id);
   const serving=node(s,'serving',p.site,x+15,511,185,56,'llm-d serving','Local server selection',id);
   connect(s,c,gateway,shared?[port(c,'bottom'),[c.x+c.w/2,285],[gateway.x+gateway.w-20,285],[gateway.x+gateway.w-20,gateway.y]]:[port(c,'right'),[525,c.y+c.h/2],[525,285],[gateway.x+gateway.w-20,285],[gateway.x+gateway.w-20,gateway.y]],'request',p.key===provider.key);
   direct(s,gateway,serving,'bottom','top','request',p.key===provider.key);
  }
  return s;
 }
 function controlScene(layout,entryKey,providerKey,narrow=false){
  const model=topology(layout),entry=model.entries.find(x=>x.key===entryKey)||model.entries[0],provider=model.providers.find(x=>x.key===providerKey)||model.providers[0],same=layout==='basic'||layout==='combined'&&entry.key===provider.key;
  const s=newScene(narrow?380:940,narrow?570:565);
  if(narrow){
   box(s,'host',10,10,360,150,layout==='basic'?'One cluster · enrollment':layout==='shared'?'Gateway cluster · shared enrollment':'Shared enrollment host');
   const e=node(s,'enrollment','edge',80,65,220,56,'Enrollment service','Certificate issuance','host');
   const a=node(s,'operator',entry.site,20,245,155,58,'Entry control',entry.identity);
   const b=same?a:node(s,'operator',provider.site,205,245,155,58,'Provider control',provider.identity);
   const c=node(s,'consumer',entry.site,20,435,155,58,'Consumer',entry.identity);
   const p=node(s,'provider',provider.site,205,435,155,58,'Provider gateway',provider.identity);
   connect(s,e,a,[port(e,'bottom'),[190,190],[97.5,190],port(a,'top')],'certificate',true,true);
   if(!same)connect(s,e,b,[port(e,'bottom'),[190,190],[282.5,190],port(b,'top')],'certificate',true,true);
   direct(s,a,c,'bottom','top','control');
   if(same)connect(s,a,p,[port(a,'bottom'),[97.5,365],[282.5,365],port(p,'top')],'certificate');else {direct(s,b,p,'bottom','top','certificate');connect(s,a,b,[port(a,'right'),port(b,'left')],'control',true,true);}
   s.notes.push({x:190,y:337,text:same?'One site operator':'Peer signals'});
  }else{
   box(s,'host',300,15,340,140,layout==='basic'?'Hosted in the same cluster':layout==='shared'?'Hosted in gateway / control cluster':'Shared enrollment host');
   const e=node(s,'enrollment','edge',335,70,270,56,'Enrollment service','Certificate issuance','host');
   const a=node(s,'operator',entry.site,85,245,250,58,'Entry Grid operator',entry.identity);
   const b=same?a:node(s,'operator',provider.site,605,245,250,58,'Provider Grid operator',provider.identity);
   const c=node(s,'consumer',entry.site,85,445,250,56,'Consumer gateway',entry.identity);
   const p=node(s,'provider',provider.site,605,445,250,56,'Provider gateway',provider.identity);
   connect(s,e,a,[port(e,'bottom'),[470,190],[210,190],port(a,'top')],'certificate',true,true);
   if(!same)connect(s,e,b,[port(e,'bottom'),[470,190],[730,190],port(b,'top')],'certificate',true,true);
   direct(s,a,c,'bottom','top','control');
   if(same)connect(s,a,p,[port(a,'bottom'),[210,365],[730,365],port(p,'top')],'certificate');else {direct(s,b,p,'bottom','top','certificate');connect(s,a,b,[port(a,'right'),port(b,'left')],'control',true,true);}
   s.notes.push({x:470,y:267,text:same?'One site operator':'Peer provider signals'});
  }
  return s;
 }
 function requestScene(layout,entryKey,providerKey,narrow=false){
  const model=topology(layout),entry=model.entries.find(x=>x.key===entryKey)||model.entries[0],provider=model.providers.find(x=>x.key===providerKey)||model.providers[0],same=layout==='basic'||layout==='combined'&&entry.key===provider.key;
  if(layout==='shared'||layout==='entries'){
   const shared=layout==='shared',base=narrow?430:340,s=newScene(narrow?380:940,narrow?2460:910),consumers={},providers={};
   if(shared)box(s,'entry',10,narrow?10:20,narrow?360:920,narrow?280:230,'Gateway cluster');
   const l=node(s,'litellm','front',narrow?85:370,shared?65:20,narrow?210:200,56,'AI gateway','LiteLLM (example)',shared?'entry':'');
   for(const [index,item] of model.entries.entries()){
    const x=shared?(narrow?80:360):(narrow?25+(index%2)*180:15+index*185),y=shared?(narrow?185:160):(narrow?130+Math.floor(index/2)*80:155),w=shared?220:(narrow?150:170);
    const c=consumers[item.key]=node(s,'consumer',item.site,x,y,w,56,item.label,'Entry gateway',shared?'entry':'');
    const points=shared?[port(l,'bottom'),port(c,'top')]:narrow?[port(l,'bottom'),[190,105],[index%2?375:0,105],[index%2?375:0,c.y+28],port(c,index%2?'right':'left')]:[port(l,'bottom'),[470,110],[c.x+c.w/2,110],port(c,'top')];
    connect(s,l,c,points,'request',item.key===entry.key);
   }
   for(const [index,item] of model.providers.entries()){
    const x=narrow?10:10+index*235,y=narrow?base+index*500:base,id='provider-'+item.key;box(s,id,x,y,narrow?360:215,narrow?450:540,item.cluster,true);
    const p=providers[item.key]=node(s,'provider',item.site,narrow?80:x+15,y+35,narrow?220:185,56,item.label,'Provider gateway',id);
    const e=node(s,'envoy',item.site,narrow?25:x+22,y+(narrow?190:160),170,56,'Envoy','Forward request',id);
    const picker=node(s,'picker',item.site,narrow?225:x+22,y+(narrow?190:275),narrow?130:170,56,'Endpoint Picker','Select server',id);
    const sim=node(s,'sim',item.site,narrow?25:x+22,y+(narrow?330:410),170,56,'Simulator','CPU completion',id);
    const c=consumers[entry.key];
    const points=narrow?[port(c,'bottom'),[c.x+c.w/2,c.y+70],[190,c.y+70],[190,395],[375,395],[375,p.y+28],port(p,'right')]:[port(c,'bottom'),[c.x+c.w/2,290],[p.x+p.w-20,290],[p.x+p.w-20,p.y]];
    connect(s,c,p,points,'request',item.key===provider.key);
    connect(s,p,e,[port(p,'bottom'),[p.x+p.w/2,y+125],[e.x+85,y+125],port(e,'top')],'request',item.key===provider.key);
    if(narrow){direct(s,e,sim,'bottom','top','request',item.key===provider.key);connect(s,e,picker,[[195,e.y+15],[225,picker.y+15]],'picker',item.key===provider.key);connect(s,picker,e,[[225,picker.y+41],[195,e.y+41]],'picker',item.key===provider.key);}
    else {connect(s,e,sim,[port(e,'right'),[x+205,e.y+28],[x+205,sim.y+28],port(sim,'right')],'request',item.key===provider.key);connect(s,e,picker,[[x+65,e.y+56],[x+65,picker.y]],'picker',item.key===provider.key);connect(s,picker,e,[[x+145,picker.y],[x+145,e.y+56]],'picker',item.key===provider.key);}
   }
   return s;
  }
  if(layout==='combined'){
   const s=newScene(narrow?380:940,narrow?1470:790),consumers={},providers={},l=node(s,'litellm','front',narrow?85:370,20,narrow?210:200,56,'AI gateway','LiteLLM (example)');
   for(const [index,site] of ['a','b'].entries()){
    const x=narrow?10:15+index*475,y=narrow?150+index*670:150,w=narrow?360:440,id='site-'+site;box(s,id,x,y,w,narrow?610:610,'Cluster '+site.toUpperCase()+' · '+id,true);
    const c=consumers[site]=node(s,'consumer',site,narrow?80:x+110,y+60,220,56,'Consumer '+site.toUpperCase(),'Entry gateway',id);
    const p=providers[site]=node(s,'provider',site,narrow?80:x+110,y+180,220,56,'Provider '+site.toUpperCase(),'Provider gateway',id);
    const e=node(s,'envoy',site,narrow?25:x+30,y+310,170,56,'Envoy','Forward selected request',id);
    const picker=node(s,'picker',site,narrow?225:x+235,y+310,narrow?130:170,56,'Endpoint Picker','Select server',id);
    const sim=node(s,'sim',site,narrow?25:x+30,y+470,170,56,'Simulator','CPU completion',id);
    connect(s,l,c,narrow?[port(l,'bottom'),[190,110],[0,110],[0,c.y+28],port(c,'left')]:[port(l,'bottom'),[470,115],[c.x+110,115],port(c,'top')],'request',site===entry.key);
    connect(s,p,e,[port(p,'bottom'),[p.x+110,y+275],[e.x+85,y+275],port(e,'top')],'request',site===provider.key);
    direct(s,e,sim,'bottom','top','request',site===provider.key);
    connect(s,e,picker,[[e.x+170,e.y+15],[picker.x,picker.y+15]],'picker',site===provider.key);
    connect(s,picker,e,[[picker.x,picker.y+41],[e.x+170,e.y+41]],'picker',site===provider.key);
   }
   for(const p of model.providers){const c=consumers[entry.key],to=providers[p.key];
    const points=narrow?(entry.key===p.key?[port(c,'bottom'),port(to,'top')]:[port(c,'right'),[375,c.y+28],[375,to.y+28],port(to,'right')]):[port(c,'bottom'),[c.x+110,465-150],[to.x+110,465-150],port(to,'top')];
    connect(s,c,to,points,'request',p.key===provider.key);
   }
   return s;
  }
  if(narrow){
   const s=newScene(380,760);
   if(layout==='basic')box(s,'entry',10,10,360,725,'One cluster');else if(layout==='shared')box(s,'entry',10,10,360,270,'Gateway cluster');else box(s,'entry',10,145,360,same?590:135,entry.cluster);
   if(!same)box(s,'provider',10,305,360,430,provider.cluster,true);
   const l=node(s,'litellm','front',85,65,210,56,'AI gateway','LiteLLM (example)',['basic','shared'].includes(layout)?'entry':'');
   const c=node(s,'consumer',entry.site,85,185,210,56,'Consumer gateway','Grid identity: '+entry.identity,'entry');
   const p=node(s,'provider',provider.site,80,350,220,56,'Provider gateway','Grid identity: '+provider.identity,same?'entry':'provider');
   const e=node(s,'envoy',provider.site,25,495,170,56,'Envoy','Forward selected request',same?'entry':'provider');
   const picker=node(s,'picker',provider.site,225,495,130,56,'Endpoint Picker','Choose server',same?'entry':'provider');
   const sim=node(s,'sim',provider.site,25,655,170,56,'Simulator','CPU completion',same?'entry':'provider');
   direct(s,l,c,'bottom','top');direct(s,c,p,'bottom','top');connect(s,p,e,[port(p,'bottom'),[190,450],[110,450],port(e,'top')]);direct(s,e,sim,'bottom','top');
   connect(s,e,picker,[[195,510],[225,510]],'picker');connect(s,picker,e,[[225,536],[195,536]],'picker');return s;
  }
  const s=newScene(1000,445);
  if(layout==='basic')box(s,'entry',5,20,990,360,'One cluster');else if(layout==='shared')box(s,'entry',5,205,395,175,'Gateway cluster',true);else box(s,'entry',195,same?20:205,same?800:200,same?360:175,entry.cluster+' · '+entry.identity,true);
  if(!same)box(s,'provider',425,20,570,360,provider.cluster+' · '+provider.identity);
  const l=node(s,'litellm','front',20,250,160,58,'AI gateway','LiteLLM (example)',['basic','shared'].includes(layout)?'entry':'');
  const c=node(s,'consumer',entry.site,210,250,170,58,'Consumer','Grid identity: '+entry.identity,'entry');
  const p=node(s,'provider',provider.site,440,250,170,58,'Provider gateway','Grid identity: '+provider.identity,same?'entry':'provider');
  const e=node(s,'envoy',provider.site,650,250,140,58,'Envoy','Forward',same?'entry':'provider');
  const picker=node(s,'picker',provider.site,630,90,180,58,'Endpoint Picker','Select server',same?'entry':'provider');
  const sim=node(s,'sim',provider.site,830,250,160,58,'Simulator','CPU completion',same?'entry':'provider');
  direct(s,l,c);direct(s,c,p);direct(s,p,e);direct(s,e,sim);
  connect(s,e,picker,[[690,250],[690,148]],'picker');connect(s,picker,e,[[750,148],[750,250]],'picker');
  return s;
 }
 function curvePath(raw,{roundOnly=false}={}){
  const points=raw.filter((p,i)=>!i||p[0]!==raw[i-1][0]||p[1]!==raw[i-1][1]).filter((p,i,all)=>!i||i===all.length-1||!((all[i-1][0]===p[0]&&p[0]===all[i+1][0])||(all[i-1][1]===p[1]&&p[1]===all[i+1][1])));
  if(points.length<2)return '';const start=points[0],end=points.at(-1);let d='M'+start.join(' ');
  if(!roundOnly&&points.length===4){const vertical=start[0]===points[1][0]&&end[0]===points[2][0]&&(points[1][1]-start[1])*(end[1]-points[2][1])>0,horizontal=start[1]===points[1][1]&&end[1]===points[2][1]&&(points[1][0]-start[0])*(end[0]-points[2][0])>0;if(vertical||horizontal)return d+' C'+points[1].join(' ')+', '+points[2].join(' ')+', '+end.join(' ');}
  for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],before=Math.hypot(b[0]-a[0],b[1]-a[1]),after=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(32,before/2,after/2),p=[b[0]+(a[0]-b[0])*r/before,b[1]+(a[1]-b[1])*r/before],q=[b[0]+(c[0]-b[0])*r/after,b[1]+(c[1]-b[1])*r/after];d+=' L'+p.join(' ')+' Q'+b.join(' ')+', '+q.join(' ');}
  return d+' L'+end.join(' ');
 }
 function sceneSVG(scene,{response=false,step=0,interactive=true}={}){
  const activeRoles=step===0?[]:step===1?['litellm']:step===2?['consumer']:step===3?['provider']:step===4?['envoy','picker']:step===5?['sim']:['litellm','consumer','provider','envoy','sim'];
  const marker=(name,color)=>`<marker id="${name}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${color}"/></marker>`;
  let html=`<svg class="diagram topology-diagram" data-response="${response}" viewBox="0 0 ${scene.width} ${scene.height}" role="group" aria-label="Architecture diagram"><defs>${marker('request-arrow','#27836c')}${marker('control-arrow','#7964a7')}${marker('alternative-arrow','#7e8b9c')}</defs>`;
  html+=scene.boundaries.map(b=>`<rect class="boundary" data-boundary="${escape(b.id)}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10"/><text class="boundary-label" x="${b.x+15}" y="${b.footer?b.y+b.h-17:b.y+27}">${escape(b.title)}</text>`).join('');
  for(const edge of [...scene.edges].sort((a,b)=>Number(a.selected)-Number(b.selected))){const control=edge.kind!=='request',marker=control?'control-arrow':edge.selected?'request-arrow':'alternative-arrow',d=curvePath(edge.points);html+=`<path data-from="${escape(edge.from)}" data-to="${escape(edge.to)}" data-flow="${edge.kind}" class="wire ${control?'control ':''}${edge.kind==='certificate'?'certificate ':''}${edge.selected?'chosen':'alternative'}" d="${d}" ${response&&!control&&edge.selected?'marker-start':'marker-end'}="url(#${marker})" ${edge.both?'marker-start="url(#'+marker+')"':''}/>`;}
  for(const n of scene.nodes){const kind=['envoy','picker','sim','serving'].includes(n.role)?'serving':['consumer','provider','operator','identity','enrollment','ca'].includes(n.role)?'grid':n.role.endsWith('-db')?'db':'entry',pressed=state.selected.role===n.role&&state.selected.site===n.site,active=activeRoles.includes(n.role)&&(n.role==='litellm'||n.role==='consumer'&&n.site===chosen().entry.site||n.role!=='consumer'&&n.site===chosen().provider.site);html+=`<g class="node ${active?'active':''}" data-kind="${kind}" data-component="${escape(n.role)}" data-site="${escape(n.site)}" ${interactive?'role="button" tabindex="0"':''} aria-label="${escape(n.title+' · '+n.sub)}" aria-pressed="${pressed}">${kind==='db'?`<path d="M${n.x} ${n.y+7} C${n.x} ${n.y-2},${n.x+n.w} ${n.y-2},${n.x+n.w} ${n.y+7} V${n.y+n.h-7} C${n.x+n.w} ${n.y+n.h+2},${n.x} ${n.y+n.h+2},${n.x} ${n.y+n.h-7} Z"/><ellipse cx="${n.x+n.w/2}" cy="${n.y+7}" rx="${n.w/2}" ry="7"/>`:`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="7"/>`}<text class="node-title" x="${n.x+n.w/2}" y="${n.y+n.h/2+(n.sub?-4:5)}" text-anchor="middle">${escape(n.title)}</text>${n.sub?`<text class="node-sub" x="${n.x+n.w/2}" y="${n.y+n.h/2+17}" text-anchor="middle">${escape(n.sub)}</text>`:''}</g>`;}
  html+=scene.notes.map(n=>`<text class="scene-note" x="${n.x}" y="${n.y}" text-anchor="middle">${escape(n.text)}</text>`).join('');return html+'</svg>';
 }
 // Expose the semantic graph and geometry for independent, read-only contract checks.
 window.publicLearnerModel={topology,route,overviewScene,controlScene,requestScene,curvePath};
 if(typeof document==='undefined')return;
 const q=selector=>document.querySelector(selector),content=q('#content');
 function facts(rows){return `<table class="facts">${rows.map(([key,val])=>`<tr><th scope="row">${escape(key)}</th><td>${escape(val)}</td></tr>`).join('')}</table>`;}
 function lesson(role,site){if(window.publicLessons)return window.publicLessons.detail(role,{site,layout:state.layout});return `<h2>${escape(role)}</h2><p>${escape(site)}</p>`;}
 function focusInspector(){const heading=q('#inspector h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:innerWidth>=1180});}}
 function inspect(role,site){state.selected={role,site};const model=chosen().model;if(role==='consumer'){const entry=model.entries.find(x=>x.site===site);if(entry){if(state.entry!==entry.key)state.step=0;state.entry=entry.key;render();focusInspector();return;}}if(role==='provider'||role==='serving'){const p=model.providers.find(x=>x.site===site);if(p){if(state.provider!==p.key)state.step=0;state.provider=p.key;render();focusInspector();return;}}renderInspector();focusInspector();document.querySelectorAll('[data-component]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.component===role&&el.dataset.site===site)));}
 function renderInspector(){const panel=q('#inspector');if(!panel)return;panel.innerHTML=lesson(state.selected.role,state.selected.site);if(window.publicLessons)window.publicLessons.bind(panel);}
 function bindComponents(root){root.querySelectorAll('[data-component]').forEach(el=>{el.onclick=()=>inspect(el.dataset.component,el.dataset.site);if(el.tagName.toLowerCase()==='g')el.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();inspect(el.dataset.component,el.dataset.site);}};});}
 function legend(mode='request',alternatives=true){const items=mode==='control'?'<span><i class="control-swatch"></i>Configuration / signals</span><span><i class="certificate-swatch"></i>Enrollment / identity</span>':'<span><i></i>Selected request</span>'+(alternatives?'<span><i class="alternative-swatch"></i>Other permitted choices</span>':'');return `<div class="diagram-legend" aria-label="Diagram legend">${items}</div>`;}
 function overview(){const {entry,provider}=chosen(),control=state.mode==='control',narrow=innerWidth<700,scene=control?controlScene(state.layout,entry.key,provider.key,narrow):overviewScene(state.layout,entry.key,provider.key,narrow);return `<div class="explorer"><section class="canvas"><div class="canvas-toolbar"><div class="mode-tabs" role="group" aria-label="Diagram connections"><button data-connections="request" aria-pressed="${!control}">Request</button><button data-connections="control" aria-pressed="${control}">Grid control</button></div></div>${sceneSVG(scene)}${legend(control?'control':'request',state.layout!=='basic')}</section><aside id="inspector" class="inspector" aria-live="polite"></aside></div>`;}
 function componentKind(role){return ['envoy','picker','sim','serving','inferencepool'].includes(role)?'serving':['consumer','provider','operator','identity','config','gridsite','inferenceprovider','inferencepool','enrollment','ca'].includes(role)?'grid':role.endsWith('-db')?'db':'entry';}
 function chip(role,site,label){return `<button data-kind="${componentKind(role)}" data-component="${escape(role)}" data-site="${escape(site)}" aria-pressed="${state.selected.role===role&&state.selected.site===site}">${escape(label)}</button>`;}
 function components(){
  const {entry,model}=chosen(),section=(title,body)=>`<section class="component-section"><h2>${title}</h2><div class="chips">${body}</div></section>`,cluster=(title,body)=>`<fieldset><legend>${escape(title)}</legend>${body}</fieldset>`;
  const caller=chip('litellm','front','AI gateway')+chip('access-db','front','LiteLLM database');
  const control=site=>chip('operator',site,'Grid operator')+chip('identity',site,'Site identity')+chip('config',site,'Serving configuration');
  const serving=site=>chip('provider',site,'Provider gateway')+chip('envoy',site,'Envoy')+chip('picker',site,'Endpoint Picker')+chip('sim',site,'Simulators');
  const types=site=>chip('gridsite',site,'GridSite')+chip('inferenceprovider',site,'InferenceProvider')+chip('inferencepool',site,'InferencePool');
  const enrollment=chip('enrollment','edge','Enrollment')+chip('enrollment-db','edge','Enrollment database')+chip('ca','edge','Grid CA');
  let groups='';
  if(state.layout==='basic')groups=cluster('One cluster',section('Caller entry',caller+chip('consumer','a','Consumer gateway'))+section('Grid control',control('a'))+section('Serving',serving('a'))+section('Resource types',types('a'))+section('Enrollment service',enrollment));
  else if(state.layout==='combined'){
   groups=cluster('Caller access','<div class="chips">'+caller+'</div>');
   groups+=model.providers.map(p=>cluster(p.cluster+' · '+p.identity,section('Consumer role',chip('consumer',p.site,'Consumer gateway'))+section('Provider and serving roles',serving(p.site))+section('Grid control',control(p.site))+section('Resource types',types(p.site))+(p.key==='a'?section('Shared enrollment service',enrollment):''))).join('');
  }else{
   groups=cluster('Shared services',section('Caller access',caller)+section('Enrollment and trust',enrollment));
   groups+=cluster(state.layout==='shared'?'Entry gateway':'Entry gateways','<div class="chips">'+model.entries.map(e=>chip('consumer',e.site,e.label)).join('')+'</div>'+`<details class="entry-control"><summary>Control and identity</summary>${section('Selected entry',control(entry.site))}</details>`);
   groups+=cluster('Provider clusters',model.providers.map(p=>`<details class="component-cluster" ${['provider','envoy','picker','sim','serving'].includes(state.selected.role)&&state.selected.site===p.site?'open':''}><summary><span>${escape(p.cluster)}</span><span class="cluster-identity">${escape(p.identity)}</span></summary><div class="cluster-detail">${section('Serving',serving(p.site))+section('Grid control',control(p.site))+section('Resource types',types(p.site))}</div></details>`).join(''));
  }
  return `<div class="explorer"><section class="canvas catalog">${groups}</section><aside id="inspector" class="inspector" aria-live="polite"></aside></div>`;
 }
 function resourceTone(name){return /(?:database|db)/i.test(name)?'db':/(?:envoy|llmd|vllm|simulator|inferencepool)/i.test(name)?'serving':/(?:consumer|provider|grid|enrollment)/i.test(name)?'grid':'entry';}
 function resourceTree(letter,site){return `<details class="cluster-group" ${letter==='a'?'open':''}><summary><span class="tree-title">Cluster ${letter.toUpperCase()}</span><span class="tree-context">${escape(site.name)}</span><span class="count">${site.resources.length}</span></summary><div class="tree-children">${[...new Set(site.resources.map(x=>x.namespace||''))].sort().map(ns=>`<details class="namespace-group" ${ns==='grid'?'open':''}><summary>${ns?'Namespace · '+escape(ns):'Cluster-scoped'}</summary><div class="tree-children">${[...new Set(site.resources.filter(x=>(x.namespace||'')===ns).map(x=>x.kind))].sort().map(kind=>{const objects=site.resources.filter(x=>(x.namespace||'')===ns&&x.kind===kind);return `<details class="kind-group" ${kind==='Deployment'?'open':''}><summary><span>${escape(kind)}</span><span class="count">${objects.length}</span></summary><ul>${objects.map(x=>{const key=[letter,kind,ns,x.name].join('|');return `<li><button data-resource="${escape(key)}" data-kind="${resourceTone(x.name)}" aria-pressed="${state.resourceKey===key}"><span class="resource-dot" aria-hidden="true"></span>${escape(x.name)}</button></li>`;}).join('')}</ul></details>`;}).join('')}</div></details>`).join('')}<details class="kind-group"><summary><span>API types</span><span class="count">${site.crds.length}</span></summary><ul>${site.crds.map(crd=>`<li><button data-crd="${letter}|${escape(crd.kind)}" data-kind="grid" aria-pressed="false"><span class="resource-dot" aria-hidden="true"></span>${escape(crd.kind)}</button></li>`).join('')}</ul></details></div></details>`;}
 function resources(){return `<div class="explorer resource-explorer"><section class="canvas resource-sites" aria-label="Resource browser">${Object.entries(reference.sites).map(([letter,site])=>resourceTree(letter,site)).join('')}</section><aside id="inspector" class="inspector resource-inspector" aria-live="polite"><h2>Resources</h2></aside></div>`;}
 function showResource(key,focus=true){
  const [letter,kind,namespace,name]=key.split('|'),site=reference.sites[letter],obj=site?.resources.find(x=>x.kind===kind&&x.name===name&&(x.namespace||'')===namespace),panel=q('#inspector');if(!obj||!panel)return;state.resourceKey=key;
  const roles={'consumer-gateway':'Selects a provider for the requested model','provider-gateway':'Checks Grid peer identity and forwards to serving','envoy':'Consults Endpoint Picker and forwards the request','llmd-epp':'Chooses a server from the local pool','vllm-sim':'Produces CPU-simulated completions','grid-operator':'Reconciles Grid resources and publishes configuration'},rows=[];
  if(roles[name])rows.push(['Role',roles[name]]);rows.push(['Cluster','Cluster '+letter.toUpperCase()],['Namespace',namespace||'Cluster-scoped']);
  if(obj.spec?.replicas!==undefined)rows.push(['Replicas',String(obj.spec.replicas)]);
  if(obj.spec?.selector)rows.push(['Selector',Object.entries(obj.spec.selector.matchLabels||obj.spec.selector).map(([k,v])=>k+'='+v).join(', ')]);
  if(kind==='Deployment'){
   const labels=obj.spec.template_labels||{},services=site.resources.filter(x=>x.kind==='Service'&&x.namespace===namespace&&Object.keys(x.spec?.selector||{}).length&&Object.entries(x.spec.selector).every(([k,v])=>labels[k]===v));
   rows.push(['Example Pods',site.resources.filter(x=>x.kind==='Pod'&&x.namespace===namespace&&x.name.startsWith(name+'-example-')).map(x=>x.name).join(', ')||'None in this example']);
   if(services.length)rows.push(['Services',services.map(x=>x.name).join(', ')]);
  }
  if(obj.keys)rows.push(['Keys',obj.keys.join(', ')]);const values=site.values[obj.helm_release];
  panel.innerHTML=`<div class="resource-heading"><span class="kind-badge">${escape(kind)}</span><h2>${escape(name)}</h2></div>${facts(rows)}<details class="resource-record"><summary>Example configuration</summary><p>Illustrative fields; not a deployable manifest.</p><pre class="resource-code">${escape(JSON.stringify(obj,null,2))}</pre></details>${values?`<details class="resource-record"><summary>Helm values</summary><p>Documentation addresses and identity placeholders.</p><pre class="resource-code">${escape(values.yaml)}</pre></details>`:''}`;
  content.querySelectorAll('[data-resource]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.resource===key)));content.querySelectorAll('[data-crd]').forEach(el=>el.setAttribute('aria-pressed','false'));if(focus)focusInspector();
 }
 function bindResources(){content.querySelectorAll('[data-resource]').forEach(el=>el.onclick=()=>showResource(el.dataset.resource));content.querySelectorAll('[data-crd]').forEach(el=>el.onclick=()=>{const [letter,kind]=el.dataset.crd.split('|'),crd=reference.sites[letter].crds.find(x=>x.kind===kind),panel=q('#inspector');panel.innerHTML=`<div class="resource-heading"><span class="kind-badge">API type</span><h2>${escape(kind)}</h2></div>${facts([['API type',crd.name],['Scope',crd.scope],['Group',crd.group]])}${lesson(kind.toLowerCase(),letter).replace(/<h2>[^<]*<\/h2>/,'').replace(/<tr><th scope="row">Scope<\/th><td>[^<]*<\/td><\/tr>/,'')}`;content.querySelectorAll('[data-resource]').forEach(item=>item.setAttribute('aria-pressed','false'));content.querySelectorAll('[data-crd]').forEach(item=>item.setAttribute('aria-pressed',String(item===el)));if(window.publicLessons)window.publicLessons.bind(panel);focusInspector();});showResource(state.resourceKey,false);}
 function request(rolesOnly=false){const {entry,provider}=chosen(),texts=['','The AI gateway validates caller access; LiteLLM is used in this example.','The '+entry.identity+' consumer selects '+provider.identity+' using its provider snapshot.','The provider verifies the incoming '+entry.identity+' Grid identity and peer access.','Envoy exchanges the request body and headers with the Endpoint Picker, then receives a server address.','Envoy forwards to the selected simulator, which produces the completion.','The response returns through Envoy, the provider, the consumer and the AI gateway.'];const scene=requestScene(state.layout,entry.key,provider.key,innerWidth<700);return `<div class="explorer"><section class="canvas">${sceneSVG(scene,{step:rolesOnly?0:state.step,response:state.step===6&&!rolesOnly})}<div class="diagram-legend"><span><i></i>Inference forwarding</span><span><i class="control-swatch"></i>Picker consultation</span>${state.layout!=='basic'?'<span><i class="alternative-swatch"></i>Other permitted choices</span>':''}</div></section><aside class="inspector">${rolesOnly?'':`<div class="controls"><button id="requestReset">Reset</button><button id="requestBack" ${state.step===0?'disabled':''}>Back</button><button id="requestNext" ${state.step===6?'disabled':''}>${state.step===0?'Follow request →':'Next →'}</button></div>${state.step?`<div class="step-count">${state.step} / 6</div><p class="request-step">${escape(texts[state.step])}</p>`:''}`}<section id="inspector"></section></aside></div>`;}
 function stepTo(next){state.step=Math.max(0,Math.min(6,next));const {entry,provider}=chosen(),roles=['client','litellm','consumer','provider','envoy','sim','sim'];state.selected={role:roles[state.step],site:state.step===1?'front':state.step===2?entry.site:provider.site};render();const announcement=q('#learner-status');if(announcement)announcement.textContent=state.step?'Step '+state.step+' of 6. '+q('.request-step').textContent:'Request walkthrough reset.';}
 function render(){
  const announcement=q('#learner-status');if(announcement)announcement.textContent='';
  const active=document.activeElement,focusKey=['page','view','requestView','layout','connections','entry','provider'].find(key=>active?.dataset?.[key]!==undefined),focusSelector=active?.id?'#'+active.id:focusKey?'[data-'+focusKey.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+'="'+active.dataset[focusKey]+'"]':null;
  const restoreFocus=()=>{if(!focusSelector)return;const target=q(focusSelector);if(target&&!target.disabled)target.focus({preventScroll:true});else if(focusSelector==='#requestNext')q('#requestBack')?.focus({preventScroll:true});};
  q('#pages').innerHTML=[['platform','Platform'],['request','Request explorer']].map(([id,label])=>`<button data-page="${id}" aria-pressed="${state.page===id}">${label}</button>`).join('');
  q('#views').setAttribute('aria-label',state.page==='platform'?'Platform views':'Request views');q('#views').hidden=false;q('#views').innerHTML=state.page==='platform'?['overview','components','resources','setup','helm'].map(id=>`<button data-view="${id}" aria-pressed="${state.view===id}">${id==='helm'?'Helm walkthrough':id[0].toUpperCase()+id.slice(1)}</button>`).join(''):[['walkthrough','Walkthrough'],['roles','Gateway roles']].map(([id,label])=>`<button data-request-view="${id}" aria-pressed="${state.requestView===id}">${label}</button>`).join('');
  q('.topologies').hidden=state.page==='platform'&&['resources','setup','helm'].includes(state.view);q('.topologies').innerHTML=`<label>Configuration<select data-layout aria-label="Configuration">${Object.entries(labels).map(([id,label])=>`<option value="${id}" ${state.layout===id?'selected':''}>${label}</option>`).join('')}</select></label>`;
  q('.configuration-bar').hidden=state.page==='platform'&&['resources','setup','helm'].includes(state.view);
  q('#pages').querySelectorAll('[data-page]').forEach(el=>el.onclick=()=>{state.page=el.dataset.page;render();});q('#views').querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{state.view=el.dataset.view;render();});q('#views').querySelectorAll('[data-request-view]').forEach(el=>el.onclick=()=>{state.requestView=el.dataset.requestView;render();});q('.topologies').querySelectorAll('[data-layout]').forEach(el=>el.onchange=()=>{state.layout=el.value;state.entry=topology(state.layout).entries[0].key;state.provider=state.layout==='combined'?'b':'a';state.step=0;state.selected={role:'consumer',site:chosen().entry.site};render();});
  if(!(state.page==='platform'&&state.view==='helm'))window.publicLessons?.stopHelm();
  if(state.page==='platform'&&['setup','helm'].includes(state.view)){const continuingHelm=!!content.querySelector('.helm-walkthrough');content.innerHTML='<div class="setup-host"></div>';if(window.publicLessons)window.publicLessons[state.view==='helm'?'renderHelm':'renderSetup'](content.firstElementChild,{autoplay:!continuingHelm});restoreFocus();return;}
  content.innerHTML=state.page==='platform'?(state.view==='overview'?overview():state.view==='components'?components():resources()):request(state.requestView==='roles');
  bindComponents(content);if(!(state.page==='platform'&&state.view==='resources'))renderInspector();
  if(state.page==='platform'&&state.view==='resources')bindResources();
  content.querySelectorAll('[data-connections]').forEach(el=>el.onclick=()=>{state.mode=el.dataset.connections;render();});
  if(q('#requestNext')){q('#requestNext').onclick=()=>stepTo(state.step+1);q('#requestBack').onclick=()=>stepTo(state.step-1);q('#requestReset').onclick=()=>stepTo(0);}
  restoreFocus();
 }
 let narrow=innerWidth<700;
 window.addEventListener('resize',()=>{const next=innerWidth<700;if(next!==narrow){narrow=next;render();}});
 render();
})();
