var AutoSparkNotifications=(function(exports){'use strict';var At=Object.create;var Y=Object.defineProperty;var St=Object.getOwnPropertyDescriptor;var wt=Object.getOwnPropertyNames;var Et=Object.getPrototypeOf,Ct=Object.prototype.hasOwnProperty;var Ot=(n,i)=>()=>(i||n((i={exports:{}}).exports,i),i.exports);var Tt=(n,i,t,e)=>{if(i&&typeof i=="object"||typeof i=="function")for(let o of wt(i))!Ct.call(n,o)&&o!==t&&Y(n,o,{get:()=>i[o],enumerable:!(e=St(i,o))||e.enumerable});return n};var k=(n,i,t)=>(t=n!=null?At(Et(n)):{},Tt(Y(t,"default",{value:n,enumerable:true}),n));var N=Ot((se,v)=>{v.exports={};Object.defineProperty(v.exports,"ComponentInstance",{enumerable:true,get:function(){var n=globalThis.AutoSpark;return n?n.ComponentInstance:void 0}});Object.defineProperty(v.exports,"shallow",{enumerable:true,get:function(){var n=globalThis.AutoSpark;return n?n.shallow:void 0}});Object.defineProperty(v.exports,"markRaw",{enumerable:true,get:function(){var n=globalThis.AutoSpark;return n?n.markRaw:void 0}});Object.defineProperty(v.exports,"getOverlayContainer",{enumerable:true,get:function(){var n=globalThis.AutoSpark;return n?n.getOverlayContainer:void 0}});Object.defineProperty(v.exports,"SCOPES_KEY",{enumerable:true,get:function(){var n=globalThis.AutoSpark;return n?n.SCOPES_KEY:void 0}});});var h="autospark.notifications.shell";function g(n){return `autospark.notifications.${n}`}var D={NONE:0,INFO:1,SUCCESS:2,WARN:3,ERROR:4},B=["none","info","success","warn","error"];function G(n){if(typeof n=="number")return Number.isInteger(n)&&n>=0&&n<=4?n:null;if(typeof n=="string"){let i=B.indexOf(n);return i>=0?i:null}return null}function S(n){return B[n]??"none"}var d={NONE:0,SESSION:1,LOCAL:2,REMOTE:3},Q=new Set(["top-left","top-center","top-right","bottom-left","bottom-center","bottom-right","center"]),J={info:"info",success:"yes",warn:"warn",error:"error"},m={pos:"top-right",delayClose:3e3,showCount:5,closeable:true,animate:"slide",level:0,persist:0},X=new Set(["id","type","icon","title","description","delayClose","pos","offset","closeable","link","owner","level","read","status","result","persist","actions","anchor","progress","canStart","canPause","canCancel","canStop","closeWhenDone","animate","className","styles","width","height","minWidth","maxWidth","minHeight"]);function w(n,i){let t=typeof n=="string"?{title:n}:n;return t==null||typeof t!="object"||Array.isArray(t)?(i("engine.notifications.add: \u5165\u53C2\u987B\u4E3A\u901A\u77E5\u5B57\u7B26\u4E32\u6216\u914D\u7F6E\u5BF9\u8C61\uFF0C\u5DF2\u5FFD\u7565"),null):t}function E(n){return typeof n=="number"?`${n}px`:n}var H="$notifications";var ht=k(N());function C(n){if(n==null||n===false||n==="")return {enter:null,leave:null};if(typeof n=="string"){let e={name:n};return {enter:e,leave:{...e}}}if(typeof n!="object")return {enter:null,leave:null};let i=n,t={};return i.name!=null&&(t.name=String(i.name)),i.duration!=null&&(t.duration=Number(i.duration)),i.delay!=null&&(t.delay=Number(i.delay)),i.easing!=null&&(t.easing=String(i.easing)),{enter:Z(i.enter,t),leave:Z(i.leave,t)}}function Z(n,i){if(n===false)return null;let t=i.name,{duration:e,delay:o,easing:s}=i;if(typeof n=="string")t=n;else if(typeof n=="object"){let r=n;r.name!=null&&(t=String(r.name)),r.duration!=null&&(e=Number(r.duration)),r.delay!=null&&(o=Number(r.delay)),r.easing!=null&&(s=String(r.easing));}if(t==null)return null;let a={name:t};return e!=null&&(a.duration=e),o!=null&&(a.delay=o),s!=null&&(a.easing=s),a}k(N());var it=k(N());function tt(n,i){if(globalThis.document===void 0)return;let{id:t,mode:e="default",location:o="head",el:s}=i??{},a=()=>typeof n=="function"?n():n,r=Pt(t,s);if(!r){let c=document.createElement("style");return t&&(c.id=t),c.textContent=a(),s?s.appendChild(c):o=="body"?document.body.appendChild(c):document.head.appendChild(c),c}if(e=="replace")r.textContent=a();else if(e=="patch"){let c=a();r.textContent!==c&&(r.textContent=c);}else e=="append"&&(r.textContent+=a());return r}function Pt(n,i){if(!n)return null;let t=n.replace(/["\\]/g,"\\$&"),e=i?.querySelector(`[id="${t}"]`)??document.getElementById(n);return e?.tagName==="STYLE"?e:null}var It="autospark-notification-column-styles",$=10,Rt=`
.autospark-notification-column {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${$}px;
  z-index: var(--autospark-notification-z, 1100);
  pointer-events: none;
}
.autospark-notification-column > * { pointer-events: auto; }
.autospark-notification-column[data-notification-pos="top-left"] {
  top: var(--autospark-notification-inset, 16px);
  left: var(--autospark-notification-inset, 16px);
  align-items: flex-start;
}
.autospark-notification-column[data-notification-pos="top-center"] {
  top: var(--autospark-notification-inset, 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.autospark-notification-column[data-notification-pos="top-right"] {
  top: var(--autospark-notification-inset, 16px);
  right: var(--autospark-notification-inset, 16px);
  align-items: flex-end;
}
.autospark-notification-column[data-notification-pos="bottom-left"] {
  bottom: var(--autospark-notification-inset, 16px);
  left: var(--autospark-notification-inset, 16px);
  align-items: flex-start;
}
.autospark-notification-column[data-notification-pos="bottom-center"] {
  bottom: var(--autospark-notification-inset, 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.autospark-notification-column[data-notification-pos="bottom-right"] {
  bottom: var(--autospark-notification-inset, 16px);
  right: var(--autospark-notification-inset, 16px);
  align-items: flex-end;
}
.autospark-notification-column[data-notification-pos="center"] {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  align-items: center;
}
`;function et(){tt(Rt,{id:It});}var O=new WeakMap,Lt="autospark-notifications",Mt="data-autospark-notifications",T="data-notification-pos";function Dt(n){if(typeof document>"u"||!document.body)return null;let i=O.get(n);if(!i){let t=(0, it.getOverlayContainer)(n);if(!t)return null;i=document.createElement("div"),i.className=Lt,i.setAttribute(Mt,""),t.appendChild(i),O.set(n,i),et();}return i}function ot(n,i,t){let e=Dt(n);if(!e)return null;let o=e.querySelector(`:scope > [${T}="${i}"]`);return o||(o=document.createElement("div"),o.className="autospark-notification-column",o.setAttribute(T,i),t!=null&&o.style.setProperty("--autospark-notification-inset",E(t)),e.appendChild(o)),o}function nt(n){let i=O.get(n);i&&(i.remove(),O.delete(n));}var P=class{constructor(i){this.manager=i;}get _state(){return this.manager._stateRef}createEntry(i,t,e){let o=this.manager._resolveAnchor(i.anchor),s=Date.now();return {id:t,type:e,record:{id:t,type:e,read:i.read===true,title:i.title,description:i.description,level:i.level,owner:i.owner,status:i.status,result:i.result,link:i.link,createAt:s,updateAt:s},props:i,icon:this.manager._resolveIcon(i.level,i.icon),actions:this.manager._resolveActions(i.actions,o),state:"queued",instance:null,scope:null,el:null,anchor:o,confirmResolve:null,timer:null,tickTimer:null,deadline:null,pausedRemaining:null,leave:null,clickHandler:null,enterHandler:null,leaveHandler:null,controlOffs:[],startEmitted:false,appliedClassName:"",appliedStyles:""}}touch(i){i.record.updateAt=Date.now();}mirrorAdd(i){let t=this._state?.items;t&&t.push({...i.record});}mirrorReplace(i){let t=this._state?.items;if(!t)return;let e=t.findIndex(o=>o.id===i.id);e>=0&&t.splice(e,1,{...i.record});}mirrorRemove(i){let t=this._state?.items;if(!t)return;let e=t.findIndex(o=>o.id===i);e>=0&&t.splice(e,1);}evictOverflow(i){let t=this.manager._maxLen;if(t<=0)return;let e=this.manager;for(;e.size>t;){let o=null;for(let s of e.keys()){let a=e._entryOf(s);a&&a!==i&&(o==null||a.record.createAt<o.record.createAt)&&(o=a);}if(!o)break;e._destroyEntry(o);}}restoreRecords(i,t){let e=this.manager,o=[];for(let s of i){if(s==null||typeof s!="object")continue;let a={...s,persist:t==="local"?d.LOCAL:d.REMOTE},r=a.id!=null&&a.id!==""?String(a.id):`notification-${++e._autoId}`,c=Number(s.createAt),p=Number(s.updateAt),l=Number.isFinite(c)&&c>0?c:Date.now(),f=Number.isFinite(p)&&p>0?p:l,u=e._entryOf(r);if(u){let xt=e._mergeProps({...a,id:r}).merged;e._applyEntryConfig(u,xt),u.record.createAt=l,u.record.updateAt=f,o.push(u.instance);continue}let{merged:A,type:M}=e._mergeProps({...a,id:r});e._settleLevel(A);let y=this.createEntry(A,r,M);y.record.createAt=l,y.record.updateAt=f,e._materialize(y)&&(y.state="hidden",y.instance&&(y.instance.data.closed=true),o.push(y.instance));}return o}};var I=class{constructor(i,t){this.manager=i;this.pos=t;this.waiting=[];this.shown=new Set;}get _showCount(){return this.manager._showCount}offer(i){if(i.state==="shown"){this.shown.add(i.id);return}this.shown.size<this._showCount?(this.shown.add(i.id),this.manager._showEntry(i)):this.waiting.push(i);}remove(i){let t=this.waiting.indexOf(i);t>=0&&this.waiting.splice(t,1);}releaseShown(i){this.shown.delete(i);}flush(){for(;this.waiting.length&&this.shown.size<this._showCount;){let i=this.waiting.shift();this.shown.add(i.id),this.manager._showEntry(i);}}clear(){this.waiting.length=0;}};var st="autospark-notifications",Ht=500;function $t(n){return {...n.record}}function F(n,i){if(!(typeof localStorage>"u"))try{localStorage.setItem(st,JSON.stringify(n));}catch(t){i(`engine.notifications: local \u6301\u4E45\u5316\u5199\u5165\u5931\u8D25\uFF0C\u5DF2\u5FFD\u7565: ${t?.message??t}`);}}function at(n){if(typeof localStorage>"u")return [];try{let i=localStorage.getItem(st);if(!i)return [];let t=JSON.parse(i);return Array.isArray(t)?t.filter(e=>e&&typeof e=="object"&&!Array.isArray(e)):(n("engine.notifications: local \u6301\u4E45\u5316\u6570\u636E\u683C\u5F0F\u5F02\u5E38\uFF08\u975E\u6570\u7EC4\uFF09\uFF0C\u5DF2\u5FFD\u7565"),[])}catch(i){return n(`engine.notifications: local \u6301\u4E45\u5316\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u5FFD\u7565: ${i?.message??i}`),[]}}var j=class{constructor(i,t){this.getFetchOptions=i;this.warn=t;this.timer=null;this.pending=null;}schedule(i){this.pending=i,this.timer!=null&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null;let t=this.pending;this.pending=null,t&&this.flush(t);},Ht);}async flush(i,t=false){this.timer!=null&&(clearTimeout(this.timer),this.timer=null,this.pending=null);let e=this.getFetchOptions();if(!(typeof fetch>"u"||!e?.url))try{let{url:o,...s}=e,a=await fetch(o,{...s,method:"POST",headers:{"Content-Type":"application/json",...s.headers},body:JSON.stringify(i),keepalive:t});a.ok||this.warn(`engine.notifications: remote \u6301\u4E45\u5316\u5931\u8D25\uFF08HTTP ${a.status}\uFF09\uFF0C\u5DF2\u5FFD\u7565`);}catch(o){this.warn(`engine.notifications: remote \u6301\u4E45\u5316\u5931\u8D25\uFF0C\u5DF2\u5FFD\u7565: ${o?.message??o}`);}}cancel(){this.timer!=null&&(clearTimeout(this.timer),this.timer=null),this.pending=null;}},R=class{constructor(i){this.manager=i;this.remote=new j(()=>this.manager._stateRef?.options.fetchOptions??null,t=>this.manager.engine.logger.warn(t));}collect(){let i=[],t=[];for(let e of Array.from(this.manager.keys())){let o=this.manager._entryOf(e);if(!o)continue;let s=$t(o);o.props.persist===d.LOCAL?i.push(s):o.props.persist===d.REMOTE&&t.push(s);}return {locals:i,remotes:t}}schedule(){if(!this.manager.enabled)return;let{locals:i,remotes:t}=this.collect();F(i,e=>this.manager.engine.logger.warn(e)),this.remote.schedule(t);}flushNow(){if(!this.manager.enabled)return;let{locals:i,remotes:t}=this.collect();F(i,e=>this.manager.engine.logger.warn(e)),this.remote.flush(t,true);}async save(){let{locals:i,remotes:t}=this.collect();F(i,e=>this.manager.engine.logger.warn(e)),await this.remote.flush(t);}async load(i){let t=this.manager._stateRef?.options.fetchOptions??null,e=i??t?.url;if(!e||typeof fetch>"u")return this.manager.engine.logger.warn("engine.notifications: load \u7F3A\u5C11 url\uFF08\u53C2\u6570\u4E0E options.notifications.fetchOptions.url \u5747\u672A\u914D\u7F6E\uFF09\uFF0C\u5DF2\u8DF3\u8FC7"),[];try{let o=t?{...t}:{};delete o.url;let s=await fetch(e,o);if(!s.ok)return this.manager.engine.logger.warn(`engine.notifications: load \u5931\u8D25\uFF08HTTP ${s.status}\uFF09\uFF0C\u5DF2\u5FFD\u7565`),[];let a=await s.json();if(!Array.isArray(a))return this.manager.engine.logger.warn("engine.notifications: load \u54CD\u5E94\u4F53\u683C\u5F0F\u5F02\u5E38\uFF08\u975E\u6570\u7EC4\uFF09\uFF0C\u5DF2\u5FFD\u7565"),[];let r=this.manager.records.restoreRecords(a,"remote");return this.schedule(),r}catch(o){return this.manager.engine.logger.warn(`engine.notifications: load \u5931\u8D25\uFF0C\u5DF2\u5FFD\u7565: ${o?.message??o}`),[]}}cancelPending(){this.remote.cancel();}};var q=k(N()),ct=k(N());var lt=k(N());function rt(n){for(let i of Array.from(n.attributes)){let t=i.name;if(t==="x-define:inherit"||t.startsWith("x-define:inherit.")||t==="x-define:extends"||t.startsWith("x-define:extends."))return (i.value??"").trim()}return null}var Ft=["width","height","minWidth","maxWidth","minHeight"];function jt(n,i){let t=n.engine,e=s=>{let a=t._resolveGlobalComponent(s);if(!a||s!==h&&rt(a)===null&&(a.setAttribute("x-define:inherit",h),t._globalComponentDefs.delete(s),a=t._resolveGlobalComponent(s),!a))return null;let r=t.getComponentDef(a)??t.getGlobalComponentDef(s)??null;return {name:s,snapshot:a,def:r}},o=n._options.types?.[i]?.render?.trim()??"";if(o!==""){let s=e(o);if(s)return s}return e(`autospark.notifications.${i}`)??e(h)??null}function qt(n,i){if(!i)return null;let t=i;for(;t;){let e=n.engine.findScopeByEl(t);if(e)return e;t=t.parentElement;}return null}function z(n,i){let t={};for(let[o,s]of Object.entries(i.props))typeof s!="function"&&(typeof HTMLElement<"u"&&s instanceof HTMLElement||o==="progress"||o==="state"||o==="paused"||o==="completed"||(t[o]=s));let e=i.record;return t.id=e.id,t.type=e.type,t.read=e.read,t.title=e.title,t.description=e.description,t.level=e.level,t.owner=e.owner,t.status=e.status,t.result=e.result,t.link=e.link,t.icon=i.icon,t.actions=i.actions,t.levelName=S(e.level??0),(i.type==="task"||i.props.canCancel===true)&&(t._abort=i.instance?.data?._abort??(0, ct.markRaw)(new AbortController)),i.type==="task"&&(t.state=i.instance?.data?.state??(i.props.canStart===true?"pending":"running")),t}function W(n,i){for(let t of Ft){let e=i[t],o=t.replace(/[A-Z]/g,s=>"-"+s.toLowerCase());e==null||e===""||e==="auto"?n.style.removeProperty(o):n.style.setProperty(o,E(e));}}function pt(n,i){let t=ot(n.engine,i.props.pos,i.props.offset);if(!t)return  false;let e=n.engine,o=qt(n,i.anchor),s=jt(n,i.type),a=z(n,i);if(!s)return e.logger.warn(`engine.notifications: type "${i.type}" \u65E0\u53EF\u7528\u6E32\u67D3\u7EC4\u4EF6\uFF08render \u94FE\u4E0E shell \u515C\u5E95\u5747\u672A\u547D\u4E2D\uFF09\uFF0C\u5DF2\u8DF3\u8FC7\u88C5\u914D`),false;let r=e.compiler.instantiateDetachedComponent(s.snapshot.cloneNode(true),o,s.def,a),c=r.el;i.scope=r.scope,i.instance=new lt.ComponentInstance(r.scope),Wt(i.instance,s.def),i.el=c,c.style.display="none",c.setAttribute(T,i.props.pos),i.props.className&&(c.classList.add(...String(i.props.className).trim().split(/\s+/)),i.appliedClassName=String(i.props.className)),i.props.styles&&(c.style.cssText=String(i.props.styles),i.appliedStyles=String(i.props.styles)),W(c,i.props),i.clickHandler=f=>n._onCardClick(i,f),i.enterHandler=()=>n._pauseTimer(i),i.leaveHandler=()=>n._resumeTimer(i),c.addEventListener("click",i.clickHandler),c.addEventListener("mouseenter",i.enterHandler),c.addEventListener("mouseleave",i.leaveHandler),t.appendChild(c);let p=C(i.props.animate);i.leave=p.leave,zt(n,i);let l=i.props.progress;return l!=null&&(i.instance?.data.progress??0)===0&&i.instance&&i.instance.methods.progress?.(Number(l)),true}function zt(n,i){let t=i.instance?.scope;if(!t)return;let e=n.engine,o=`${q.SCOPES_KEY}.${t.id}`,s=()=>i.instance?.data,a=s()?.holdOpen;e.store.watch(`${o}.holdOpen`,()=>{let r=s()?.holdOpen;r!==a&&(a=r,r===true?n._clearTimer(i):i.state==="shown"&&n._startTimer(i));});for(let r of ["progress","state"]){let c=s()?.[r];e.store.watch(`${o}.${r}`,()=>{let p=s()?.[r];p!==c&&(c=p,n._emit("update",i));});}}function Wt(n,i){let t=new Set(["el","name","data","props","globalState","methods","super","scope","then"]);for(let s of ["id","type","read","closed","status","result","visible","remaining"])Object.defineProperty(n,s,{get:()=>n.data[s],configurable:true});Object.defineProperty(n,"abortSignal",{get:()=>n.data?._abort?.signal,configurable:true});let e=i?.setup?.methods;if(!e)return;let o=new Set(t);o.add("id"),o.add("type"),o.add("read"),o.add("closed"),o.add("status"),o.add("result"),o.add("visible"),o.add("remaining"),o.add("abortSignal");for(let s of Object.keys(e)){if(o.has(s))continue;Object.defineProperty(n,s,{get:function(){return n.methods[s]},configurable:true});}}function ft(n,i){let t=i.el;t&&(i.clickHandler&&t.removeEventListener("click",i.clickHandler),i.enterHandler&&t.removeEventListener("mouseenter",i.enterHandler),i.leaveHandler&&t.removeEventListener("mouseleave",i.leaveHandler),t.remove());for(let s of i.controlOffs.splice(0))try{s();}catch{}let e=i.instance;i.el=null,i.instance=null;let o=i.scope;if(i.scope=null,o){let s=o.id;o.destroy();let a=n.engine.store.state[q.SCOPES_KEY];a&&delete a[s];}e&&Vt(n,e);}function Vt(n,i){let t=e=>n.engine.logger.warn(`engine.notifications: \u7EC4\u4EF6\u5B9E\u4F8B\u5DF2\u9500\u6BC1\uFF08\u8BB0\u5F55\u5DF2 remove\uFF09\uFF0C${e}() \u65E0\u6548\uFF08ADR-0083 \u6B7B\u4F1A\u8BDD\u8BED\u4E49\u6CBF\u7528\uFF09`);Object.defineProperty(i,"closed",{get:()=>true,configurable:true}),Object.defineProperty(i,"visible",{get:()=>false,configurable:true});for(let e of Object.getOwnPropertyNames(i)){let o=Object.getOwnPropertyDescriptor(i,e);!o?.get||o.get.name!=="flattenMethod"||Object.defineProperty(i,e,{get(){return t(e),()=>{}},configurable:true});}}var Ut=new Set(["showCount","maxLen","fetchOptions","icons","shell","shallow","types"]);function ut(n,i){let{opts:t,frozen:e,typeDefaults:o,warn:s}=i,a=String(n.type??t.type??"toast"),r=t.types?.[a];if(r)for(let l of Object.keys(r))Ut.has(l)&&s(`engine.notifications: types.${a} \u4E0D\u5141\u8BB8\u7BA1\u7406\u5668\u7EA7\u952E "${l}"\uFF0C\u5DF2\u5FFD\u7565`);let c={...m},p=o?.[a];p&&Object.assign(c,p);for(let l of X)l!=="id"&&l in t&&(c[l]=t[l]),l!=="id"&&(l==="anchor"||l==="actions")&&e[l]!==void 0&&(c[l]=e[l]),l!=="id"&&r&&l in r&&(c[l]=r[l]);return Object.assign(c,n),{merged:c,type:a}}function dt(n,i){let t=G(n.level);t==null?(i(`engine.notifications: \u672A\u77E5 level "${n.level}"\uFF080~4 \u6216 none/info/success/warn/error\uFF0CADR-0079\uFF09\uFF0C\u5DF2\u56DE\u9000 ${D.NONE}`),n.level=D.NONE):n.level=t;}function _(n,i){Q.has(n.pos)||(i(`engine.notifications: \u672A\u77E5 pos "${n.pos}"\uFF0C\u5DF2\u56DE\u9000 "${m.pos}"`),n.pos=m.pos);}function V(n,i){n.persist!=null&&![0,1,2,3].includes(n.persist)&&(i(`engine.notifications: \u672A\u77E5 persist "${n.persist}"\uFF080|1|2|3\uFF0CADR-0077\uFF09\uFF0C\u5DF2\u56DE\u9000 ${d.NONE}`),n.persist=d.NONE);}function mt(n){return String(n??"").replace(/[/]/g,"-").replace(/\*/g,"-")}function L(n,i,t){return `notifications/${mt(n)}/${mt(i)}/${t}`}function Kt(n,i){let t=g(i),e=n._resolveGlobalComponent(t);return e?(n.getComponentDef(e)??n.getGlobalComponentDef(t)??null)?.defaults:void 0}var x=class extends Map{constructor(t){super();this._entries=new Map;this._state=null;this._frozen={};this._autoId=0;this._queues=new Map;this._typeDefaultsCache=new Map;this._typeDefaults=new Proxy({},{get:(t,e)=>{if(typeof e=="string")return this._typeDefaultsCache.has(e)||this._typeDefaultsCache.set(e,Kt(this.engine,e)),this._typeDefaultsCache.get(e)}});this.engine=t;let e=t.options.notifications;this.enabled=e!==false;let o=e===false||e==null?{}:e;if(this._frozen={anchor:o.anchor,actions:o.actions},this.records=new P(this),this.storage=new R(this),!this.enabled)return;let s={};for(let r of Object.keys(o))r!=="anchor"&&r!=="actions"&&(s[r]=o[r]);for(let r of Object.keys(m))s[r]===void 0&&(s[r]=m[r]);let a=Number(s.shallow)===0?0:1;t.store.state[H]={items:(0, ht.shallow)([],a),options:s},this._state=t.store.state[H],this.records.restoreRecords(at(r=>this.engine.logger.warn(r)),"local");}_entryOf(t){return this._entries.get(t)}get _stateRef(){return this._state}get _options(){return this._state.options}add(t,e){if(!this.enabled)return this.engine.logger.warn("engine.notifications: \u901A\u77E5\u7279\u6027\u5DF2\u901A\u8FC7 options.notifications: false \u5173\u95ED\uFF0C\u8C03\u7528\u88AB\u5FFD\u7565"),null;if(typeof t=="function")return this._addAsync(t,e);e!=null&&this.engine.logger.warn(`engine.notifications: add(..., ${typeof e=="string"?`"${e}"`:"props"}) \u7B2C\u4E8C\u53C2\u4EC5\u5BF9 factory \u5F62\u6001\u751F\u6548\uFF08\u5BF9\u8C61\u5F62\u6001\u8BF7\u7528 type \u5B57\u6BB5\uFF09\uFF0C\u5DF2\u5FFD\u7565`);let o=w(t,s=>this.engine.logger.warn(s));return o?this._enqueueProps(o):null}_addAsync(t,e){let o=e!=null&&typeof e=="object"?e:{},s=e==null?"toast":typeof e=="string"?String(e).trim()||"toast":String(o.type??"").trim()||"toast",{merged:a,type:r}=this._mergeProps({...o,type:s});_(a,f=>this.engine.logger.warn(f)),this._settleLevel(a),V(a,f=>this.engine.logger.warn(f));let c=a.id!=null&&a.id!==""?String(a.id):`notification-${++this._autoId}`;a.id=c,a.type=r;let p=this.records.createEntry(a,c,r);if(!this._materialize(p))return null;let l=p.instance;return (async()=>{try{let f=await t(l);if(!this._entries.has(c)||p.state==="closed")return;if(f==null){this._destroyEntry(p);return}let u=w(f,M=>this.engine.logger.warn(M));if(!u||!String(u.title??"").trim()){this.engine.logger.warn("engine.notifications: factory \u7ED3\u679C\u7F3A\u5C11 title\uFF08\u7A7A\u901A\u77E5\uFF09\uFF0C\u5DF2\u9500\u6BC1"),this._destroyEntry(p);return}u.type!=null&&String(u.type)!==s&&(this.engine.logger.warn(`engine.notifications: factory \u58F0\u660E type "${s}" \u4E0E return props type "${u.type}" \u4E0D\u4E00\u81F4\uFF0C\u4EE5\u58F0\u660E\u4E3A\u51C6\uFF08\u7C7B\u578B\u4E0D\u53EF\u53D8\uFF09`),u.type=s);let A=this._mergeProps({...u,id:c,type:s}).merged;this._applyEntryConfig(p,A),p.state="queued",this._emit("add",p),this._displayEntry(p),this.storage.schedule();}catch(f){this.engine.logger.warn(`engine.notifications: factory \u6267\u884C\u5931\u8D25\uFF0C\u5DF2\u9500\u6BC1: ${f?.message??f}`),this._destroyEntry(p);}})(),l}_materialize(t){return pt(this,t)?(this._bindChoice(t),this._entries.set(t.id,t),super.set(t.id,t.instance),this.records.mirrorAdd(t),this.records.evictOverflow(t),true):false}_bindChoice(t){if(t.type!=="confirm"||!t.instance)return;let e=new Promise(o=>{t.confirmResolve=o;});Object.defineProperty(t.instance,"then",{value:e.then.bind(e),configurable:true});}_mergeCtx(){return {opts:this.enabled?this._options:{},frozen:this._frozen,typeDefaults:this._typeDefaults,warn:t=>this.engine.logger.warn(t)}}_mergeProps(t){return ut(t,this._mergeCtx())}_settleLevel(t){dt(t,e=>this.engine.logger.warn(e));}_enqueueProps(t){if(!String(t.title??"").trim())return this.engine.logger.warn("engine.notifications: title \u4E3A\u7A7A\uFF0C\u8C03\u7528\u88AB\u5FFD\u7565"),null;let{merged:e,type:o}=this._mergeProps(t);_(e,c=>this.engine.logger.warn(c)),this._settleLevel(e),V(e,c=>this.engine.logger.warn(c));let s=e.id!=null&&e.id!==""?String(e.id):`notification-${++this._autoId}`;e.id=s,e.type=o;let a=this._entries.get(s);if(a){if(a.state==="shown"||a.state==="queued")return this._updateInPlace(a,t),this.get(s)??null;let c=this._mergeProps({...e,id:s}).merged;return this._applyEntryConfig(a,c),a.state="queued",this._displayEntry(a),this.storage.schedule(),this.get(s)??null}let r=this.records.createEntry(e,s,o);return this._materialize(r)?(this._emit("add",r),this._displayEntry(r),this.storage.schedule(),r.instance):null}get _showCount(){let t=this._state?.options.showCount??m.showCount;return typeof t=="number"&&t>0?Math.floor(t):m.showCount}get _maxLen(){let t=this._state?.options.maxLen;return typeof t=="number"&&t>0?Math.floor(t):0}_resolveIcon(t,e){if(e)return e;if(t===0)return "";let o=S(t);return this._options.icons?.[o]??J[o]??o}_resolveAnchor(t){if(t==null)return null;if(t instanceof HTMLElement)return t;if(typeof t=="string"){let e=typeof document<"u"?document.querySelector(t):null;return e||(this.engine.logger.warn(`engine.notifications: anchor \u9009\u62E9\u5668 "${t}" \u672A\u547D\u4E2D\uFF0C\u6309\u65E0 anchor \u5904\u7406`),null)}return null}_resolveActions(t,e){let o=[];for(let s of t??[])if(typeof s=="string"){let a=this._resolveActionByName(s,e);if(!a){this.engine.logger.warn(`engine.notifications: action "${s}" \u672A\u547D\u4E2D\uFF08\u5168\u5C40\u8868${e?"\u4E0E anchor scope \u94FE":""}\uFF09\uFF0C\u6309\u94AE\u5DF2\u526A\u679D`);continue}o.push({name:s,title:a.title??s,handle:a.handle,hide:a.hide!==false,hasValue:false,value:void 0});}else if(s&&typeof s=="object"){let a="value"in s;o.push({name:String(s.id??s.title??"action"),title:s.title??"action",handle:typeof s.handle=="function"?s.handle:null,hide:s.hide!==false,hasValue:a,value:s.value});}else this.engine.logger.warn("engine.notifications: \u975E\u6CD5 action \u9879\uFF0C\u5DF2\u526A\u679D");return o}_resolveActionByName(t,e){if(e){let o=e;for(;o;){let a=this.engine.findScopeByEl(o)?.getAction(t);if(a)return a;o=o.parentElement;}}return this.engine.actions[t]}_updateInPlace(t,e){"type"in e&&String(e.type)!==t.type&&this.engine.logger.warn("engine.notifications: \u540C id \u66F4\u65B0\u4E0D\u652F\u6301\u53D8\u66F4 type\uFF0C\u5DF2\u5FFD\u7565");let o={...t.props};for(let s of Object.keys(e))s==="id"||s==="type"||s==="pos"||s==="offset"||(o[s]=e[s]);_(o,s=>this.engine.logger.warn(s)),this._applyEntryConfig(t,o),t.state==="shown"&&this._startTimer(t),this._emit("update",t),this.storage.schedule();}_applyEntryConfig(t,e){let o=t.appliedClassName,s=t.appliedStyles;this._settleLevel(e),t.props=e;for(let p of ["title","description","owner","status","result","link","read"])p in e&&(t.record[p]=e[p]);t.record.level=e.level,this.records.touch(t),t.icon=this._resolveIcon(t.record.level??0,e.icon),t.actions=this._resolveActions(e.actions,t.anchor);let a=z(this,t);t.instance&&Object.assign(t.instance.data,a),e.progress!=null&&t.instance&&t.instance.methods.progress?.(Number(e.progress));let r=e.className?String(e.className).trim():"",c=e.styles?String(e.styles):"";t.el&&(o&&t.el.classList.remove(...o.split(/\s+/)),r&&t.el.classList.add(...r.split(/\s+/)),c!==s&&(t.el.style.cssText=c),W(t.el,e)),t.appliedClassName=r,t.appliedStyles=c,this.records.mirrorReplace(t);}update(t,e){let o=this._entries.get(t);if(!o||!this._entries.has(t)){this.engine.logger.warn(`engine.notifications: update("${t}") \u672A\u547D\u4E2D\u5B58\u6D3B\u8BB0\u5F55\uFF0C\u5DF2\u5FFD\u7565`);return}w(e,c=>this.engine.logger.warn(c)),"type"in e&&String(e.type)!==o.type&&this.engine.logger.warn("engine.notifications: update \u4E0D\u652F\u6301\u4FEE\u6539 type\uFF0C\u5DF2\u5FFD\u7565");let s=o.props.read===true,a=o.props.status,r={...o.props};for(let c of Object.keys(e))c==="id"||c==="type"||c==="pos"||c==="offset"||(r[c]=e[c]);_(r,c=>this.engine.logger.warn(c)),this._applyEntryConfig(o,r),this._emit("update",o),!s&&o.props.read===true&&this._emit("read",o),o.props.status!==a&&this._emit("status",o),this.storage.schedule();}_setRead(t){t.props.read!==true&&(t.props.read=true,t.record.read=true,this.records.touch(t),t.instance&&(t.instance.data.read=true),this.records.mirrorReplace(t),this._emit("read",t),this.storage.schedule());}markRead(t){let e=this._entries.get(t);if(!e){this.engine.logger.warn(`engine.notifications: markRead("${t}") \u672A\u547D\u4E2D\u5B58\u6D3B\u8BB0\u5F55\uFF0C\u5DF2\u5FFD\u7565`);return}this._setRead(e);}markAllRead(t){for(let e of Array.from(this._entries.values()))e.props.read!==true&&(t==null||e.type===t)&&this._setRead(e);}_queueOf(t){let e=this._queues.get(t);return e||(e=new I(this,t),this._queues.set(t,e)),e}_displayEntry(t){this._queueOf(t.props.pos).offer(t);}_showEntry(t){t.state!=="shown"&&(t.el&&(t.el.style.display=""),t.state="shown",t.instance&&(t.instance.data.visible=true,t.instance.data.closed=false),t.el&&this.engine.animate.enter(t.el,C(t.props.animate).enter),this._startTimer(t),this._emit("show",t),this._emitTaskAutoStart(t));}_dequeue(t){this._queues.get(t.props.pos)?.remove(t);}_flushQueue(t){this._queueOf(t).flush();}show(t,e){if(typeof t!="string")return this.add(t,e);e!=null&&this.engine.logger.warn(`engine.notifications: show("${t}", ...) \u7B2C\u4E8C\u53C2\u4EC5\u5BF9 factory \u5F62\u6001\u751F\u6548\uFF0C\u5DF2\u5FFD\u7565`);let o=this._entries.get(t);return !o||o.state==="closed"?(this.engine.logger.warn(`engine.notifications: show("${t}") \u672A\u547D\u4E2D\u5B58\u6D3B\u8BB0\u5F55\uFF08persist=0 \u7684\u5DF2\u5173\u901A\u77E5\u5DF2\u9500\u6BC1\uFF09`),null):o.state==="shown"||o.state==="queued"?this.get(t)??null:(o.state="queued",this._displayEntry(o),this.get(t)??null)}hide(t){let e=this._entries.get(t);e&&e.state!=="closed"&&e.state!=="hidden"&&this._dismiss(e,true);}toast(t){if(typeof t=="function")return this.show(async o=>{let s=await t(o);return s==null?void 0:{...s,type:"toast"}},"toast");let e={...typeof t=="string"?{title:t}:t,type:"toast"};return this.show(e)}confirm(t,e){let o=typeof t=="string"?{title:t}:{...t},s=e?.yes??o.yes,a=e?.no??o.no;return delete o.yes,delete o.no,this.show({...o,type:"confirm",delayClose:o.delayClose??0,actions:(o.actions?.length?o.actions:void 0)??[{title:s??"\u786E\u5B9A",value:true},{title:a??"\u53D6\u6D88",value:false}]})}task(t){if(typeof t=="function")return this.show(async o=>{let s=await t(o);return s==null?void 0:{...s,type:"task"}},"task");let e={...typeof t=="string"?{title:t}:t,type:"task"};return this.show(e)}_dismiss(t,e){if(t.state==="closed"||t.state==="hidden")return;t.state==="queued"&&this._dequeue(t),t.state="closed",this._clearTimer(t),t.instance&&(t.instance.data.visible=false),this._emit("hide",t);let o=()=>this._settleClose(t),s=e?t.leave:null,a=t.el;s&&a&&a.style.display!=="none"?(a.style.boxSizing="border-box",a.style.height=`${a.offsetHeight}px`,a.style.overflow="hidden",this.engine.animate.leave(a,s,o)?(a.style.transitionProperty="transform, opacity, height, padding-top, padding-bottom, margin-bottom, border-top-width, border-bottom-width",a.style.height="0px",a.style.paddingTop="0px",a.style.paddingBottom="0px",a.style.marginBottom=`${-$}px`,a.style.borderTopWidth="0px",a.style.borderBottomWidth="0px"):o()):o();}_settleClose(t){let e=Number(t.props.persist??d.NONE);this._queueOf(t.props.pos).releaseShown(t.id),e>=d.SESSION&&e<=d.REMOTE?(t.state="hidden",t.el&&(t.el.style.display="none"),t.instance&&(t.instance.data.closed=true,t.instance.data.visible=false)):this._destroyEntry(t),this._flushQueue(t.props.pos),this.storage.schedule();}_destroyEntry(t){t.state==="queued"&&this._dequeue(t),t.state="closed",this._clearTimer(t),t.confirmResolve=null,ft(this,t),this._entries.delete(t.id),super.delete(t.id),this.records.mirrorRemove(t.id),this._queueOf(t.props.pos).releaseShown(t.id);}delete(t){let e=this._entries.get(t);return e?((e.state==="shown"||e.state==="queued")&&this._emit("hide",e),this._destroyEntry(e),this._flushQueue(e.props.pos),this.storage.flushNow(),true):false}clear(t=true){for(let e of this._queues.values())e.clear();for(let e of Array.from(this._entries.values()))e.state==="shown"||e.state==="queued"?this._dismiss(e,t):this._destroyEntry(e);this._state&&this._state.items.splice(0),this.storage.flushNow();}dispose(){this.storage.flushNow();for(let t of this._queues.values())t.clear();for(let t of Array.from(this._entries.values()))(t.state==="shown"||t.state==="queued"||t.state==="hidden")&&this._destroyEntry(t);nt(this.engine),this._state&&this._state.items.splice(0);}async load(t){return this.storage.load(t)}async save(){await this.storage.save();}_onCardClick(t,e){this._setRead(t);let o=e.target,s=o?.closest?.(".autospark-notification-action");if(s){let a=Number(s.getAttribute("data-notification-action")),r=t.actions[Number.isInteger(a)?a:-1];r&&this._fireAction(t,r);return}if(o?.closest?.(".autospark-notification-close")){let a=t.instance?.methods??{},r=typeof a.close=="function"?a.close:typeof a.cancel=="function"?a.cancel:null;typeof r=="function"?r():this._dismiss(t,true);}}_fireAction(t,e){e.hasValue&&(t.props.result=e.value,t.record.result=e.value,this.records.touch(t),t.instance&&(t.instance.data.result=e.value),this.records.mirrorReplace(t)),this._emitAction(t,e),t.confirmResolve&&(t.confirmResolve(e.hasValue?e.value:void 0),t.confirmResolve=null),e.handle?.(),this.storage.schedule(),e.hide&&this._dismiss(t,true);}_fireConfirmChoice(t,e){let o=t.actions.find(s=>s.hasValue&&s.value===e);if(!o){this.engine.logger.warn(`engine.notifications: type='confirm' \u4F1A\u8BDD\u7F3A\u5C11 value=${e} \u7684\u6309\u94AE\uFF08actions \u5DF2\u88AB\u81EA\u5B9A\u4E49\uFF09\uFF0C\u9009\u62E9\u65E0\u6548\uFF08ADR-0077\uFF09`);return}this._fireAction(t,o);}respond(t,e){let o=this._entries.get(t);if(!o){this.engine.logger.warn(`engine.notifications: respond("${t}") \u672A\u547D\u4E2D\u5B58\u6D3B\u8BB0\u5F55\uFF0C\u5DF2\u5FFD\u7565`);return}this._fireConfirmChoice(o,e);}_emitControlAction(t,e){let o=this._entries.get(t);if(!o)return;let s=L(o.type,o.props.id,`actions/${e}`),a={notification:o.instance,el:o.el};this.engine.emit(s,a),o.el?.dispatchEvent(new CustomEvent(s,{detail:a,bubbles:true})),o.anchor&&o.anchor.dispatchEvent(new CustomEvent(s,{detail:a,bubbles:true}));}_onControlAction(t,e,o){let s=this._entries.get(t),a=L(s?.type??"task",t,`actions/${e}`),r=this.engine.on(a,o),c=()=>r.off();return s&&s.controlOffs.push(c),c}_emitTaskAutoStart(t){if(t.type!=="task"||t.startEmitted||t.props.canStart===true)return;let e=t.instance?.data?.state;e==="stopped"||e==="completed"||(t.startEmitted=true,this._emitControlAction(t.props.id,"start"));}_emit(t,e){let o=L(e.type,e.props.id,t),s={notification:e.instance,el:e.el};this.engine.emit(o,s),e.el?.dispatchEvent(new CustomEvent(o,{detail:s,bubbles:true}));}_emitAction(t,e){let o=L(t.type,t.props.id,`actions/${e.name}`),s={notification:t.instance,el:t.el,action:{title:e.title,hide:e.hide},value:e.hasValue?e.value:void 0};this.engine.emit(o,s),t.el?.dispatchEvent(new CustomEvent(o,{detail:s,bubbles:true})),t.anchor&&t.anchor.dispatchEvent(new CustomEvent(o,{detail:s,bubbles:true}));}_startTimer(t){if(this._clearTimer(t),t.instance?.data.holdOpen===true)return;let e=t.props.delayClose;typeof e=="number"&&e>0?(t.deadline=Date.now()+e,t.pausedRemaining=null,t.instance&&(t.instance.data.remaining=e),t.tickTimer=setInterval(()=>{t.deadline!=null&&t.instance&&(t.instance.data.remaining=Math.max(0,t.deadline-Date.now()));},1e3),t.timer=setTimeout(()=>{t.timer=null,this._dismiss(t,true);},e)):(t.deadline=null,t.instance&&(t.instance.data.remaining=-1));}_pauseTimer(t){t.timer==null||t.deadline==null||(clearTimeout(t.timer),t.timer=null,t.pausedRemaining=Math.max(0,t.deadline-Date.now()));}_resumeTimer(t){if(t.pausedRemaining==null||t.state!=="shown")return;let e=t.pausedRemaining;t.pausedRemaining=null,t.deadline=Date.now()+e,t.timer=setTimeout(()=>{t.timer=null,this._dismiss(t,true);},e);}_clearTimer(t){t.timer!=null&&(clearTimeout(t.timer),t.timer=null),t.tickTimer!=null&&(clearInterval(t.tickTimer),t.tickTimer=null),t.pausedRemaining=null;}};var gt=`<div\r
    class="autospark-notification"\r
    x-define="autospark.notifications.shell"\r
    :data-notification-type="type"\r
    :data-notification-level="levelName"\r
>\r
    <script setup>\r
        {\r
            data: () => ({\r
                holdOpen: false,\r
                visible: false,\r
                closed: false,\r
                remaining: -1,\r
            }),\r
            methods: {\r
                hide() { this.engine.notifications.hide(this.props.id); },\r
                show() { this.engine.notifications.show(this.props.id); },\r
                remove() { this.engine.notifications.delete(this.props.id); },\r
                cancel() { this.engine.notifications.hide(this.props.id); },\r
                update(p) { this.engine.notifications.update(this.props.id, p); },\r
                markRead() { this.engine.notifications.markRead(this.props.id); },\r
                respond(v) { this.engine.notifications.respond(this.props.id, v); },\r
            },\r
        }\r
    </script>\r
    <style global id="autospark-notification-styles">\r
        .autospark-notification {\r
            position: relative;\r
            border-radius: var(--autospark-overlay-radius, 8px);\r
            border: 1px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));\r
            background: var(--autospark-overlay-bg, #fff);\r
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\r
            display: flex;\r
            flex-direction: column;\r
            padding: 10px 12px;\r
            box-sizing: border-box;\r
            max-width: var(--autospark-notification-max-w, 360px);\r
            font-size: 14px;\r
            line-height: 1.5;\r
            color: var(--autospark-notification-fg, #1f2329);\r
        }\r
        .autospark-notification[data-notification-level="info"] {\r
            --autospark-notification-accent: var(--autospark-notification-info-color, #409eff);\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-overlay-bg, #fff)\r
            );\r
        }\r
        .autospark-notification[data-notification-level="success"] {\r
            --autospark-notification-accent: var(--autospark-notification-success-color, #67c23a);\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-overlay-bg, #fff)\r
            );\r
        }\r
        .autospark-notification[data-notification-level="warn"] {\r
            --autospark-notification-accent: var(--autospark-notification-warn-color, #e6a23c);\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-overlay-bg, #fff)\r
            );\r
        }\r
        .autospark-notification[data-notification-level="error"] {\r
            --autospark-notification-accent: var(--autospark-notification-error-color, #f56c6c);\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-overlay-bg, #fff)\r
            );\r
        }\r
        .autospark-notification-header {\r
            display: flex;\r
            align-items: flex-start;\r
            padding-right: 22px;\r
        }\r
        .autospark-notification-main {\r
            display: flex;\r
            align-items: flex-start;\r
            gap: 8px;\r
            flex: 1;\r
            min-width: 0;\r
        }\r
        .autospark-notification-icon {\r
            flex: none;\r
            display: inline-flex;\r
            font-size: 17px;\r
            color: var(--autospark-notification-accent, transparent);\r
        }\r
        .autospark-notification-content {\r
            flex: 1;\r
            min-width: 0;\r
        }\r
        .autospark-notification-title-row {\r
            display: flex;\r
            align-items: baseline;\r
            gap: 6px;\r
        }\r
        .autospark-notification-title {\r
            font-weight: 500;\r
            overflow-wrap: break-word;\r
        }\r
        .autospark-notification-link {\r
            flex: none;\r
            text-decoration: none;\r
            font-size: 12px;\r
            color: var(--autospark-notification-accent, inherit);\r
        }\r
        .autospark-notification-link-icon {\r
            display: inline-flex;\r
            font-size: 13px;\r
        }\r
        .autospark-notification-description {\r
            font-size: 12px;\r
            opacity: 0.75;\r
            margin-top: 2px;\r
            overflow-wrap: break-word;\r
        }\r
        .autospark-notification-close {\r
            position: absolute;\r
            /* \u4E0E title \u9996\u884C\u6587\u5B57\u4E2D\u5FC3\u5BF9\u9F50\uFF1A10(\u5361 padding-top) + 21/2(\u9996\u884C 14\xD71.5) \u2212 17/2(\u94AE\u9AD8 13+2\xD72) = 12\uFF1B\r
               \u63A8\u5BFC\u81EA\u672C\u8868\u5199\u6B7B\u7684\u6392\u7248\u5E38\u91CF\uFF0C\u6539 padding/\u5B57\u53F7/\u884C\u9AD8\u987B\u540C\u6B65\u91CD\u7B97\uFF08\u65E0 title \u65F6\u7EF4\u6301\u540C\u4F4D\u2014\u2014chrome \u4E0D\u8BFB slot \u5185\u5BB9\uFF09 */\r
            top: 12px;\r
            right: 8px;\r
            display: inline-flex;\r
            align-items: center;\r
            border: none;\r
            background: none;\r
            padding: 2px;\r
            font-size: 13px;\r
            color: var(--autospark-notification-fg, #1f2329);\r
            opacity: 0.5;\r
            cursor: pointer;\r
        }\r
        .autospark-notification-close:hover {\r
            opacity: 1;\r
        }\r
        .autospark-notification-actions {\r
            display: flex;\r
            flex-wrap: wrap;\r
            align-items: center;\r
            gap: 12px;\r
            margin-top: 6px;\r
        }\r
        .autospark-notification-action {\r
            flex: none;\r
            border: none;\r
            background: none;\r
            padding: 0;\r
            font: inherit;\r
            font-size: 13px;\r
            color: var(--autospark-notification-accent, #409eff);\r
            cursor: pointer;\r
        }\r
    </style>\r
    <div class="autospark-notification-header" x-slot:header>\r
        <div class="autospark-notification-main">\r
            <i\r
                class="autospark-notification-icon"\r
                x-icon="icon"\r
                x-show="icon"\r
                aria-hidden="true"\r
            ></i>\r
            <div class="autospark-notification-content">\r
                <div class="autospark-notification-title-row">\r
                    <span class="autospark-notification-title" x-html="title"></span>\r
                    <a\r
                        class="autospark-notification-link"\r
                        x-show="link"\r
                        :href="link"\r
                        target="_blank"\r
                        rel="noopener noreferrer"\r
                        aria-label="\u67E5\u770B\u8BE6\u60C5"\r
                        ><i\r
                            class="autospark-notification-link-icon"\r
                            x-icon="'external'"\r
                            aria-hidden="true"\r
                        ></i\r
                    ></a>\r
                </div>\r
                <div\r
                    class="autospark-notification-description"\r
                    x-html="description"\r
                    x-show="description"\r
                ></div>\r
            </div>\r
        </div>\r
    </div>\r
    <div x-slot></div>\r
    <div x-slot:actions>\r
        <div\r
            class="autospark-notification-actions"\r
            x-show="actions.length > 0"\r
            x-for="a of actions"\r
        >\r
            <button\r
                class="autospark-notification-action"\r
                type="button"\r
                x-text="a.title"\r
                :data-notification-action="actions.indexOf(a)"\r
            ></button>\r
        </div>\r
    </div>\r
    <button\r
        class="autospark-notification-close"\r
        type="button"\r
        x-show="closeable"\r
        x-icon="'no'"\r
        aria-label="\u5173\u95ED"\r
    ></button>\r
</div>\r
`;var yt=`<div x-define="autospark.notifications.toast" x-define:inherit="autospark.notifications.shell"></div>\r
`;var vt=`<div x-define="autospark.notifications.task" x-define:inherit="autospark.notifications.shell">\r
    <script setup>\r
        {\r
            defaults: { width: 300 },\r
            data: () => ({\r
                progress: 0,\r
                // \u4EFB\u52A1\u6001\u72B6\u6001\u673A\uFF08ADR-0104\uFF09\uFF1Apending\uFF08canStart \u624B\u52A8\u95E8\u63A7\u5F85\u542F\u52A8\uFF09\u2192 running \u21C4\r
                // paused\uFF1B\u7EC8\u6001 stopped\uFF08\u4E2D\u6B62\u7559\u5361\uFF09/ completed\uFF08\u5B8C\u6210\uFF09\u3002\u58F0\u660E\u7F3A\u7701 pending\u2014\u2014\r
                // \u81EA\u52A8\u6A21\u5F0F\u7531\u5F15\u64CE\u6CE8\u6C34\u5F52\u4F4D running\uFF08\u6302\u8D77/\u6392\u961F\u671F\u95ED\u5305 progress \u76F4\u5199\u4E0D\u4E22\uFF09\u3002\r
                // cancel/close \u4E0D\u5165\u72B6\u6001\u673A\uFF1A\u5B83\u4EEC\u7684\u7EC8\u6001\u662F\u5361\u7247\u4E0D\u53EF\u89C1\uFF0C\u4E0D\u662F\u4EFB\u52A1\u6001\r
                state: "pending",\r
                holdOpen: true,\r
                // \u63A7\u5236\u952E\u9ED8\u8BA4\u503C\uFF08canCancel \u7F3A\u7701 true\u2014\u2014\u53D6\u6D88\u662F\u4EFB\u52A1\u5361\u7684\u57FA\u672C\u51FA\u53E3\uFF1B\r
                // canStart/canPause/canStop \u7F3A\u7701 false\uFF09\uFF1A\u987B\u5728 data \u57DF\u7269\u5316\u2014\u2014\u63A7\u5236\u94AE\u5BB9\u5668\u7684\r
                // x-show \u8868\u8FBE\u5F0F\u8BFB\u53D6\u8FD9\u4E9B\u952E\uFF0C\u672A\u7269\u5316\u952E\u53C2\u4E0E\u8868\u8FBE\u5F0F\u4F1A\u4F7F\u6C42\u503C\u629B\u9519\uFF08\u6574\u5BB9\u5668\u4E0D\u663E\u793A\uFF09\uFF1B\r
                // props \u6CE8\u5165\uFF08initialData\uFF09\u540E\u8986\u76D6\uFF08\u542B\u663E\u5F0F canCancel: false\uFF09\r
                canStart: false,\r
                canPause: false,\r
                canStop: false,\r
                canCancel: true,\r
            }),\r
            methods: {\r
                // \u5F00\u59CB\uFF08ADR-0104\uFF09\uFF1A\u624B\u52A8\u95E8\u63A7\uFF08canStart\uFF09\u7684\u542F\u52A8\u89E6\u53D1\u2014\u2014pending \u2192 running +\r
                // actions/start \u5E7F\u64AD\uFF1B\u81EA\u52A8\u6A21\u5F0F\u88C5\u914D\u671F\u5DF2 running\uFF0C\u6B64\u5904\u5E42\u7B49 no-op\r
                start() {\r
                    if (this.data.state !== "pending") return;\r
                    this.data.state = "running";\r
                    this.engine.notifications._emitControlAction(this.props.id, "start");\r
                },\r
                progress(n) {\r
                    if (this.data.state !== "running") return;\r
                    const v = Math.min(100, Math.max(0, Math.round(Number(n) || 0)));\r
                    this.data.progress = v;\r
                    if (v >= 100) this.complete();\r
                },\r
                pause() {\r
                    if (this.data.state !== "running") return;\r
                    this.data.state = "paused";\r
                    this.engine.notifications._emitControlAction(this.props.id, "pause");\r
                },\r
                resume() {\r
                    if (this.data.state !== "paused") return;\r
                    this.data.state = "running";\r
                    this.engine.notifications._emitControlAction(this.props.id, "resume");\r
                },\r
                // \u6682\u505C/\u6062\u590D\u5207\u6362\uFF08\u6A21\u677F\u6309\u94AE\u7528\uFF09\uFF1A@click \u4EC5\u88F8\u6807\u8BC6\u7B26/\u6807\u8BC6\u7B26\u8C03\u7528\u5F62\u6001\u7ECF getMethod\r
                // \u67E5\u627E\u7EC4\u4EF6 method\u2014\u2014\u4E09\u5143\u8868\u8FBE\u5F0F\u5F62\u6001\uFF08\`state === 'paused' ? resume() : pause()\`\uFF09\r
                // \u8D70\u8868\u8FBE\u5F0F\u515C\u5E95\u8DEF\u5F84\uFF08with \u6570\u636E\u89C6\u56FE\u6C42\u503C\uFF09\uFF0Cmethods \u4E0D\u5728\u6570\u636E\u89C6\u56FE\u5185\uFF0C\u89E3\u6790\u5FC5\u5931\u8D25\r
                togglePause() {\r
                    if (this.data.state === "paused") this.resume();\r
                    else this.pause();\r
                },\r
                // \u505C\u6B62\uFF08ADR-0104 \u8BED\u4E49\u5206\u91CE\uFF09\uFF1Aabort + \u300C\u5DF2\u505C\u6B62\u300D\u7EC8\u6001\u7559\u5361\uFF08\u8FDB\u5EA6\u5B9A\u683C\u3001\r
                // closeWhenDone \u5BF9 stopped \u540C\u751F\u6548\uFF09\u2014\u2014\u4E0E\u53D6\u6D88\uFF08abort + \u7ACB\u5373\u9690\u85CF\uFF09\u7684\u5206\u91CE\r
                // = \u7ED3\u679C\u662F\u5426\u7559\u5361\u53EF\u67E5\r
                stop() {\r
                    if (this.data.state === "stopped" || this.data.state === "completed") return;\r
                    this.data.state = "stopped";\r
                    this.data._abort?.abort();\r
                    this.engine.notifications._emitControlAction(this.props.id, "stop");\r
                    this._settleCloseWhenDone();\r
                },\r
                complete() {\r
                    if (this.data.state === "completed" || this.data.state === "stopped") return;\r
                    this.data.progress = 100;\r
                    this.data.state = "completed";\r
                    this._settleCloseWhenDone();\r
                },\r
                // \u53D6\u6D88\uFF1Aabort\uFF08\u5B8C\u6210\u5B88\u536B\u6CBF\u7528 ADR-0102\uFF09+ \u7ACB\u5373\u9690\u85CF\u2014\u2014\u4E0D\u7559\u7ED3\u679C\r
                cancel() {\r
                    if (this.data.state !== "completed") this.data._abort?.abort();\r
                    this.engine.notifications._emitControlAction(this.props.id, "cancel");\r
                    this.engine.notifications.hide(this.props.id);\r
                },\r
                // \xD7 \u5173\u95ED\uFF08ADR-0104 \u72EC\u7ACB\u52A8\u8BCD\uFF0C\u4FEE\u8BA2 ADR-0102 \xD7 \u2261 cancel\uFF09\uFF1A\u975E\u7EC8\u6001\u5148 abort\r
                // \u518D\u5173\uFF1Bcompleted/stopped \u7EC8\u6001\u4EC5\u5173\u5361\uFF08\u4E0D\u53D1\u65E0\u7528 abort\uFF09\r
                close() {\r
                    if (this.data.state !== "completed" && this.data.state !== "stopped") this.data._abort?.abort();\r
                    this.engine.notifications._emitControlAction(this.props.id, "close");\r
                    this.engine.notifications.hide(this.props.id);\r
                },\r
                // \u2014\u2014 \u63A7\u5236\u8BA2\u9605\u4FBF\u6377\u9762\uFF08ADR-0104\uFF09\uFF1A\u5177\u4F53\u540D\u8BA2\u9605\uFF08\u56DE\u8C03\u6536\u88F8 payload\uFF09\uFF0C\u8FD4\u56DE\u9000\u8BA2\r
                // \u51FD\u6570\uFF1B\u5361\u9500\u6BC1\u65F6\u5F15\u64CE\u81EA\u52A8\u6E05\u6B8B\u7559\u4FA6\u542C\uFF08entry.controlOffs\uFF09\r
                onStart(cb) {\r
                    return this._onControl("start", cb);\r
                },\r
                onPause(cb) {\r
                    return this._onControl("pause", cb);\r
                },\r
                onResume(cb) {\r
                    return this._onControl("resume", cb);\r
                },\r
                onStop(cb) {\r
                    return this._onControl("stop", cb);\r
                },\r
                onCancel(cb) {\r
                    return this._onControl("cancel", cb);\r
                },\r
                onClose(cb) {\r
                    return this._onControl("close", cb);\r
                },\r
                _onControl(verb, cb) {\r
                    return this.engine.notifications._onControlAction(this.props.id, verb, cb);\r
                },\r
                // \u7EC8\u6001\u6536\u53E3\u4E09\u6001\uFF08ADR-0102 closeWhenDone \u2192 ADR-0104 \u6269\u81F3 stopped \u7EC8\u6001\uFF09\uFF1A\r
                // false/\u7F3A\u7701 = \u7EC8\u6001\u5E38\u9A7B\uFF08delayClose \u5BF9 task \u5F7B\u5E95\u65E0\u6548\uFF09\uFF1Btrue = \u5373\u5173\uFF1B\r
                // number(ms) = \u7ECF update \u5199\u5165\u751F\u6548\u914D\u7F6E\u540E\u7FFB holdOpen \u4EA4\u8FD8\u8BA1\u65F6\u5668\u2014\u2014\r
                // hover \u6682\u505C/remaining \u5012\u8BA1\u65F6\u4FDD\u7559\r
                _settleCloseWhenDone() {\r
                    const cw = this.props.closeWhenDone;\r
                    if (cw === true) {\r
                        this.hide();\r
                    } else if (typeof cw === "number" && cw > 0) {\r
                        this.update({ delayClose: cw });\r
                        this.data.holdOpen = false;\r
                    }\r
                },\r
            },\r
        }\r
    </script>\r
    <style>\r
        .autospark-notification-progress {\r
            display: flex;\r
            align-items: center;\r
            gap: 8px;\r
            margin-top: 6px;\r
        }\r
        .autospark-notification-progress-track {\r
            flex: 1;\r
            height: 6px;\r
            border-radius: 3px;\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent, #999) 15%,\r
                var(--autospark-overlay-bg, #fff)\r
            );\r
            overflow: hidden;\r
        }\r
        .autospark-notification-progress-bar {\r
            height: 100%;\r
            border-radius: 3px;\r
            background: var(--autospark-notification-accent, #409eff);\r
            transition: width 0.2s;\r
        }\r
        /* \u5F85\u542F\u52A8\uFF08pending\uFF0CADR-0104 \u624B\u52A8\u95E8\u63A7\uFF09\uFF1A\u77ED\u6761\u547C\u5438\u2014\u2014\u7B49\u5F85\u7528\u6237\u70B9\u300C\u5F00\u59CB\u300D */\r
        .autospark-notification-progress-pending {\r
            width: 30%;\r
            animation: autospark-notification-pending-pulse 1.2s ease-in-out infinite;\r
        }\r
        @keyframes autospark-notification-pending-pulse {\r
            0%,\r
            100% {\r
                opacity: 0.25;\r
            }\r
            50% {\r
                opacity: 1;\r
            }\r
        }\r
        .autospark-notification-progress-text {\r
            flex: none;\r
            font-size: 12px;\r
            opacity: 0.75;\r
            min-width: 34px;\r
            text-align: right;\r
        }\r
        .autospark-notification-ops {\r
            display: flex;\r
            flex-wrap: wrap;\r
            align-items: center;\r
            gap: 12px;\r
            margin-top: 6px;\r
        }\r
        .autospark-notification-op {\r
            flex: none;\r
            border: none;\r
            background: none;\r
            padding: 0;\r
            font: inherit;\r
            font-size: 13px;\r
            color: var(--autospark-notification-accent, #409eff);\r
            cursor: pointer;\r
        }\r
    </style>\r
    <div class="autospark-notification-progress">\r
        <div class="autospark-notification-progress-track">\r
            <div\r
                class="autospark-notification-progress-bar"\r
                :class="state === 'pending' ? 'autospark-notification-progress-pending' : ''"\r
                :style="state === 'pending' ? '' : 'width:' + (progress ?? 0) + '%'"\r
            ></div>\r
        </div>\r
        <span\r
            class="autospark-notification-progress-text"\r
            x-text="state === 'pending' ? '\u5F85\u542F\u52A8' : state === 'stopped' ? '\u5DF2\u505C\u6B62' : (progress ?? 0) + '%'"\r
        ></span>\r
    </div>\r
    <div\r
        class="autospark-notification-ops"\r
        x-show="(canStart || canPause || canStop || canCancel) && state !== 'completed' && state !== 'stopped'"\r
    >\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            x-show="canStart && state === 'pending'"\r
            @click="start()"\r
        >\r
            \u5F00\u59CB\r
        </button>\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            x-show="canPause && (state === 'running' || state === 'paused')"\r
            x-text="state === 'paused' ? '\u6062\u590D' : '\u6682\u505C'"\r
            @click="togglePause()"\r
        ></button>\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            x-show="canStop && state !== 'completed' && state !== 'stopped'"\r
            @click="stop()"\r
        >\r
            \u505C\u6B62\r
        </button>\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            x-show="canCancel && state !== 'completed' && state !== 'stopped'"\r
            @click="cancel()"\r
        >\r
            \u53D6\u6D88\r
        </button>\r
    </div>\r
</div>\r
`;var Nt=`<div x-define="autospark.notifications.confirm" x-define:inherit="autospark.notifications.shell">\r
    <script setup>\r
    {\r
        defaults: {\r
            width: 300,\r
            delayClose: 0,\r
            actions: [\r
                { title: "\u786E\u5B9A", value: true },\r
                { title: "\u53D6\u6D88", value: false },\r
            ],\r
        },\r
        methods: {\r
            yes() { this.engine.notifications.respond(this.props.id, true); },\r
            no() { this.engine.notifications.respond(this.props.id, false); },\r
        },\r
    }\r
    </script>\r
</div>\r
`;var U={[h]:gt,[g("toast")]:yt,[g("task")]:vt,[g("confirm")]:Nt};function b(n){let i=n?.el;return i instanceof HTMLElement?i:null}function kt(n){return {title:"\u63D0\u793A",handle:function(i){let t=typeof i=="string"?{title:i}:{...i??{}};return t.type==null&&(t.type="toast"),t.anchor==null&&(t.anchor=b(this)??void 0),n.notifications.add(t)}}}function bt(n){return {title:"\u786E\u8BA4",handle:function(i){let t=typeof i=="string"?{title:i}:{...i??{}},{yes:e,no:o,...s}=t;return s.anchor==null&&(s.anchor=b(this)??void 0),n.notifications.show({...s,type:"confirm",delayClose:s.delayClose??0,actions:[{title:e??"\u786E\u5B9A",value:true},{title:o??"\u53D6\u6D88",value:false}]})}}}function _t(n){return {title:"\u4EFB\u52A1",handle:function(i){let t=typeof i=="string"?{title:i}:{...i??{}};return t.type="task",t.anchor==null&&(t.anchor=b(this)??void 0),n.notifications.show(t)}}}var Jt={toast:kt,confirm:bt,task:_t};function Xt(n){let i=n.options.builtinComponents??(n.options.builtinComponents={});for(let[t,e]of Object.entries(U))i[t]==null&&(i[t]=e);}function Zt(n){Xt(n);let i=new x(n);n.notifications=i;for(let[t,e]of Object.entries(Jt))t in n.actions||(n.actions[t]=e(n));n.on("engine/destroy/before",()=>i.dispose());}function K(){let n=e=>{e.ready(Zt);},i=globalThis.AutoSpark;if(typeof i?.ready=="function"){n(i);return}(globalThis.__AUTOSPARK_PLUGINS__??=[]).push((e,o)=>n(o));}K();exports.NOTIFICATION_COMPONENTS=U;exports.NOTIFICATION_DEFAULTS=m;exports.NOTIFICATION_LEVEL=D;exports.NOTIFICATION_LEVEL_ICONS=J;exports.NOTIFICATION_LEVEL_NAMES=B;exports.NOTIFICATION_PERSIST=d;exports.NOTIFICATION_POS=Q;exports.NOTIFICATION_RESERVED_KEYS=X;exports.NotificationManager=x;exports.SHELL_PRESET_NAME=h;exports.bootstrapNotificationsPlugin=K;exports.formatNotificationSize=E;exports.normalizeNotificationLevel=G;exports.notificationLevelName=S;exports.parseNotificationProps=w;exports.presetComponentName=g;return exports;})({});//# sourceMappingURL=index.global.js.map
//# sourceMappingURL=index.global.js.map