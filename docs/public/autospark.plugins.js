(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var e=`autospark.notifications.shell`;function t(e){return`autospark.notifications.${e}`}var n={NONE:0,INFO:1,SUCCESS:2,WARN:3,ERROR:4},r=[`none`,`info`,`success`,`warn`,`error`];function i(e){if(typeof e==`number`)return Number.isInteger(e)&&e>=0&&e<=4?e:null;if(typeof e==`string`){let t=r.indexOf(e);return t>=0?t:null}return null}function a(e){return r[e]??`none`}var o={NONE:0,SESSION:1,LOCAL:2,REMOTE:3},s=new Set([`top-left`,`top-center`,`top-right`,`bottom-left`,`bottom-center`,`bottom-right`,`center`]),c={info:`info`,success:`yes`,warn:`warn`,error:`error`},l=[`primary`,`success`,`warning`,`danger`,`plain`];function u(e){return l.includes(e)?e:void 0}var d={pos:`top-right`,delayClose:3e3,showCount:5,closeable:!0,animate:`slide`,level:0,persist:0},f=new Set(`id.type.icon.title.description.delayClose.pos.offset.closeable.link.owner.level.read.status.result.persist.actions.anchor.progress.canStart.canPause.canCancel.canStop.closeWhenDone.animate.className.styles.width.height.minWidth.maxWidth.minHeight`.split(`.`));function p(e,t){let n=typeof e==`string`?{title:e}:e;return typeof n!=`object`||!n||Array.isArray(n)?(t(`engine.notifications.add: 入参须为通知字符串或配置对象，已忽略`),null):n}function m(e){return typeof e==`number`?`${e}px`:e}var ee=`$notifications`,te=null;function h(e){te=e}function ne(){return globalThis.AutoSpark??te}function g(e){let t=ne()?.[e];if(t==null)throw Error(`[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${e}"——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）`);return t}function re(e,t){return g(`shallow`)(e,t)}function _(e){if(e==null||e===!1||e===``)return{enter:null,leave:null};if(typeof e==`string`){let t={name:e};return{enter:t,leave:{...t}}}if(typeof e!=`object`)return{enter:null,leave:null};let t=e,n={};return t.name!=null&&(n.name=String(t.name)),t.duration!=null&&(n.duration=Number(t.duration)),t.delay!=null&&(n.delay=Number(t.delay)),t.easing!=null&&(n.easing=String(t.easing)),{enter:v(t.enter,n),leave:v(t.leave,n)}}function v(e,t){if(e===!1)return null;let n=t.name,{duration:r,delay:i,easing:a}=t;if(typeof e==`string`)n=e;else if(typeof e==`object`){let t=e;t.name!=null&&(n=String(t.name)),t.duration!=null&&(r=Number(t.duration)),t.delay!=null&&(i=Number(t.delay)),t.easing!=null&&(a=String(t.easing))}if(n==null)return null;let o={name:n};return r!=null&&(o.duration=r),i!=null&&(o.delay=i),a!=null&&(o.easing=a),o}function ie(e){return g(`getOverlayContainer`)(e)}function ae(e,t){if(globalThis.document===void 0)return;let{id:n,mode:r=`default`,location:i=`head`,el:a}=t??{},o=()=>typeof e==`function`?e():e,s=oe(n,a);if(!s){let e=document.createElement(`style`);return n&&(e.id=n),e.textContent=o(),a?a.appendChild(e):i==`body`?document.body.appendChild(e):document.head.appendChild(e),e}if(r==`replace`)s.textContent=o();else if(r==`patch`){let e=o();s.textContent!==e&&(s.textContent=e)}else r==`append`&&(s.textContent+=o());return s}function oe(e,t){if(!e)return null;let n=e.replace(/["\\]/g,`\\$&`),r=t?.querySelector(`[id="${n}"]`)??document.getElementById(e);return r?.tagName===`STYLE`?r:null}var se=`autospark-notification-column-styles`,ce=`
.autospark-notification-column {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
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
`;function le(){ae(ce,{id:se})}var y=new WeakMap,ue=`autospark-notifications`,de=`data-autospark-notifications`,b=`data-notification-pos`;function fe(e){if(typeof document>`u`||!document.body)return null;let t=y.get(e);if(!t){let n=ie(e);if(!n)return null;t=document.createElement(`div`),t.className=ue,t.setAttribute(de,``),n.appendChild(t),y.set(e,t),le()}return t}function pe(e,t,n){let r=fe(e);if(!r)return null;let i=r.querySelector(`:scope > [${b}="${t}"]`);return i||(i=document.createElement(`div`),i.className=`autospark-notification-column`,i.setAttribute(b,t),n!=null&&i.style.setProperty(`--autospark-notification-inset`,m(n)),r.appendChild(i)),i}function me(e){let t=y.get(e);t&&(t.remove(),y.delete(e))}var he=class{constructor(e){this.manager=e}get _state(){return this.manager._stateRef}createEntry(e,t,n){let r=this.manager._resolveAnchor(e.anchor),i=Date.now();return{id:t,type:n,record:{id:t,type:n,read:e.read===!0,title:e.title,description:e.description,level:e.level,owner:e.owner,status:e.status,result:e.result,link:e.link,createAt:i,updateAt:i},props:e,icon:this.manager._resolveIcon(e.level,e.icon),actions:this.manager._resolveActions(e.actions,r),state:`queued`,instance:null,scope:null,el:null,anchor:r,confirmResolve:null,timer:null,tickTimer:null,deadline:null,pausedRemaining:null,leave:null,clickHandler:null,enterHandler:null,leaveHandler:null,controlOffs:[],startEmitted:!1,appliedClassName:``,appliedStyles:``}}touch(e){e.record.updateAt=Date.now()}mirrorAdd(e){let t=this._state?.items;t&&t.push({...e.record})}mirrorReplace(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e.id);n>=0&&t.splice(n,1,{...e.record})}mirrorRemove(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e);n>=0&&t.splice(n,1)}evictOverflow(e){let t=this.manager._maxLen;if(t<=0)return;let n=this.manager;for(;n.size>t;){let t=null;for(let r of n.keys()){let i=n._entryOf(r);i&&i!==e&&(t==null||i.record.createAt<t.record.createAt)&&(t=i)}if(!t)break;n._destroyEntry(t)}}restoreRecords(e,t){let n=this.manager,r=[];for(let i of e){if(typeof i!=`object`||!i)continue;let e={...i,persist:t===`local`?o.LOCAL:o.REMOTE},a=e.id!=null&&e.id!==``?String(e.id):`notification-${++n._autoId}`,s=Number(i.createAt),c=Number(i.updateAt),l=Number.isFinite(s)&&s>0?s:Date.now(),u=Number.isFinite(c)&&c>0?c:l,d=n._entryOf(a);if(d){let t=n._mergeProps({...e,id:a}).merged;n._applyEntryConfig(d,t),d.record.createAt=l,d.record.updateAt=u,r.push(d.instance);continue}let{merged:f,type:p}=n._mergeProps({...e,id:a});n._settleLevel(f);let m=this.createEntry(f,a,p);m.record.createAt=l,m.record.updateAt=u,n._materialize(m)&&(m.state=`hidden`,m.instance&&(m.instance.data.closed=!0),r.push(m.instance))}return r}},ge=class{constructor(e,t){this.manager=e,this.pos=t,this.waiting=[],this.shown=new Set}get _showCount(){return this.manager._showCount}offer(e){e.state===`shown`?this.shown.add(e.id):this.shown.size<this._showCount?(this.shown.add(e.id),this.manager._showEntry(e)):this.waiting.push(e)}remove(e){let t=this.waiting.indexOf(e);t>=0&&this.waiting.splice(t,1)}releaseShown(e){this.shown.delete(e)}flush(){for(;this.waiting.length&&this.shown.size<this._showCount;){let e=this.waiting.shift();this.shown.add(e.id),this.manager._showEntry(e)}}clear(){this.waiting.length=0}},_e=`autospark-notifications`;function ve(e){return{...e.record}}function x(e,t){if(typeof localStorage<`u`)try{localStorage.setItem(_e,JSON.stringify(e))}catch(e){t(`engine.notifications: local 持久化写入失败，已忽略: ${e?.message??e}`)}}function ye(e){if(typeof localStorage>`u`)return[];try{let t=localStorage.getItem(_e);if(!t)return[];let n=JSON.parse(t);return Array.isArray(n)?n.filter(e=>e&&typeof e==`object`&&!Array.isArray(e)):(e(`engine.notifications: local 持久化数据格式异常（非数组），已忽略`),[])}catch(t){return e(`engine.notifications: local 持久化读取失败，已忽略: ${t?.message??t}`),[]}}var be=class{constructor(e,t){this.getFetchOptions=e,this.warn=t,this.timer=null,this.pending=null}schedule(e){this.pending=e,this.timer!=null&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null;let e=this.pending;this.pending=null,e&&this.flush(e)},500)}async flush(e,t=!1){this.timer!=null&&(clearTimeout(this.timer),this.timer=null,this.pending=null);let n=this.getFetchOptions();if(typeof fetch<`u`&&n?.url)try{let{url:r,...i}=n,a=await fetch(r,{...i,method:`POST`,headers:{"Content-Type":`application/json`,...i.headers},body:JSON.stringify(e),keepalive:t});a.ok||this.warn(`engine.notifications: remote 持久化失败（HTTP ${a.status}），已忽略`)}catch(e){this.warn(`engine.notifications: remote 持久化失败，已忽略: ${e?.message??e}`)}}cancel(){this.timer!=null&&(clearTimeout(this.timer),this.timer=null),this.pending=null}},xe=class{constructor(e){this.manager=e,this.remote=new be(()=>this.manager._stateRef?.options.fetchOptions??null,e=>this.manager.engine.logger.warn(e))}collect(){let e=[],t=[];for(let n of Array.from(this.manager.keys())){let r=this.manager._entryOf(n);if(!r)continue;let i=ve(r);r.props.persist===o.LOCAL?e.push(i):r.props.persist===o.REMOTE&&t.push(i)}return{locals:e,remotes:t}}schedule(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();x(e,e=>this.manager.engine.logger.warn(e)),this.remote.schedule(t)}flushNow(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();x(e,e=>this.manager.engine.logger.warn(e)),this.remote.flush(t,!0)}async save(){let{locals:e,remotes:t}=this.collect();x(e,e=>this.manager.engine.logger.warn(e)),await this.remote.flush(t)}async load(e){let t=this.manager._stateRef?.options.fetchOptions??null,n=e??t?.url;if(!n||typeof fetch>`u`)return this.manager.engine.logger.warn(`engine.notifications: load 缺少 url（参数与 options.notifications.fetchOptions.url 均未配置），已跳过`),[];try{let e=t?{...t}:{};delete e.url;let r=await fetch(n,e);if(!r.ok)return this.manager.engine.logger.warn(`engine.notifications: load 失败（HTTP ${r.status}），已忽略`),[];let i=await r.json();if(!Array.isArray(i))return this.manager.engine.logger.warn(`engine.notifications: load 响应体格式异常（非数组），已忽略`),[];let a=this.manager.records.restoreRecords(i,`remote`);return this.schedule(),a}catch(e){return this.manager.engine.logger.warn(`engine.notifications: load 失败，已忽略: ${e?.message??e}`),[]}}cancelPending(){this.remote.cancel()}};function Se(e){return g(`markRaw`)(e)}function Ce(){return g(`SCOPES_KEY`)}function we(e){for(let t of Array.from(e.attributes)){let e=t.name;if(e===`x-define:inherit`||e.startsWith(`x-define:inherit.`)||e===`x-define:extends`||e.startsWith(`x-define:extends.`))return(t.value??``).trim()}return null}var Te=[`width`,`height`,`minWidth`,`maxWidth`,`minHeight`];function Ee(t,n){let r=t.engine,i=t=>{let n=r._resolveGlobalComponent(t);if(!n||t!==`autospark.notifications.shell`&&we(n)===null&&(n.setAttribute(`x-define:inherit`,e),r._globalComponentDefs.delete(t),n=r._resolveGlobalComponent(t),!n))return null;let i=r.getComponentDef(n)??r.getGlobalComponentDef(t)??null;return{name:t,snapshot:n,def:i}},a=t._options.types?.[n]?.render?.trim()??``;if(a!==``){let e=i(a);if(e)return e}return i(`autospark.notifications.${n}`)??i(`autospark.notifications.shell`)??null}function De(e,t){if(!t)return null;let n=t;for(;n;){let t=e.engine.findScopeByEl(n);if(t)return t;n=n.parentElement}return null}function S(e,t){let n={};for(let[e,r]of Object.entries(t.props))typeof r!=`function`&&(typeof HTMLElement<`u`&&r instanceof HTMLElement||e!==`progress`&&e!==`state`&&e!==`paused`&&e!==`completed`&&(n[e]=r));let r=t.record;return n.id=r.id,n.type=r.type,n.read=r.read,n.title=r.title,n.description=r.description,n.level=r.level,n.owner=r.owner,n.status=r.status,n.result=r.result,n.link=r.link,n.icon=t.icon,n.actions=t.actions,n.levelName=a(r.level??0),(t.type===`task`||t.props.canCancel===!0)&&(n._abort=t.instance?.data?._abort??Se(new AbortController)),t.type===`task`&&(n.state=t.instance?.data?.state??(t.props.canStart===!0?`pending`:`running`)),n}function C(e,t){for(let n of Te){let r=t[n],i=n.replace(/[A-Z]/g,e=>`-`+e.toLowerCase());r==null||r===``||r===`auto`?e.style.removeProperty(i):e.style.setProperty(i,m(r))}}function Oe(e,t){let n=pe(e.engine,t.props.pos,t.props.offset);if(!n)return!1;let r=e.engine,i=De(e,t.anchor),a=Ee(e,t.type),o=S(e,t);if(!a)return r.logger.warn(`engine.notifications: type "${t.type}" 无可用渲染组件（render 链与 shell 兜底均未命中），已跳过装配`),!1;let s=r.compiler.instantiateDetachedComponent(a.snapshot.cloneNode(!0),i,a.def,o),c=s.el;t.scope=s.scope,t.instance=new(g(`ComponentInstance`))(s.scope),Ae(t.instance,a.def),t.el=c,c.style.display=`none`,c.setAttribute(b,t.props.pos),t.props.className&&(c.classList.add(...String(t.props.className).trim().split(/\s+/)),t.appliedClassName=String(t.props.className)),t.props.styles&&(c.style.cssText=String(t.props.styles),t.appliedStyles=String(t.props.styles)),C(c,t.props),t.clickHandler=n=>e._onCardClick(t,n),t.enterHandler=()=>e._pauseTimer(t),t.leaveHandler=()=>e._resumeTimer(t),c.addEventListener(`click`,t.clickHandler),c.addEventListener(`mouseenter`,t.enterHandler),c.addEventListener(`mouseleave`,t.leaveHandler),n.appendChild(c),t.leave=_(t.props.animate).leave,ke(e,t);let l=t.props.progress;return l!=null&&(t.instance?.data.progress??0)===0&&t.instance&&t.instance.methods.progress?.(Number(l)),!0}function ke(e,t){let n=t.instance?.scope;if(!n)return;let r=e.engine,i=`${Ce()}.${n.id}`,a=()=>t.instance?.data,o=a()?.holdOpen,s=r.store.watch(`${i}.holdOpen`,()=>{let n=a()?.holdOpen;n!==o&&(o=n,n===!0?e._clearTimer(t):t.state===`shown`&&e._startTimer(t))});t.controlOffs.push(()=>s.off());for(let n of[`progress`,`state`]){let o=a()?.[n],s=r.store.watch(`${i}.${n}`,()=>{let r=a()?.[n];r!==o&&(o=r,e._emit(`update`,t))});t.controlOffs.push(()=>s.off())}}function Ae(e,t){let n=new Set([`el`,`name`,`data`,`props`,`globalState`,`methods`,`super`,`scope`,`then`]);for(let t of[`id`,`type`,`read`,`closed`,`status`,`result`,`visible`,`remaining`])Object.defineProperty(e,t,{get:()=>e.data[t],configurable:!0});Object.defineProperty(e,"abortSignal",{get:()=>e.data?._abort?.signal,configurable:!0});let r=t?.setup?.methods;if(!r)return;let i=new Set(n);i.add(`id`),i.add(`type`),i.add(`read`),i.add(`closed`),i.add(`status`),i.add(`result`),i.add(`visible`),i.add(`remaining`),i.add(`abortSignal`);for(let t of Object.keys(r))i.has(t)||Object.defineProperty(e,t,{get:function(){return e.methods[t]},configurable:!0})}function je(e,t){let n=t.el;n&&(t.clickHandler&&n.removeEventListener(`click`,t.clickHandler),t.enterHandler&&n.removeEventListener(`mouseenter`,t.enterHandler),t.leaveHandler&&n.removeEventListener(`mouseleave`,t.leaveHandler),n.remove());for(let e of t.controlOffs.splice(0))try{e()}catch{}let r=t.instance;t.el=null,t.instance=null;let i=t.scope;t.scope=null,i&&i.destroy(),r&&Me(e,r)}function Me(e,t){let n=t=>e.engine.logger.warn(`engine.notifications: 组件实例已销毁（记录已 remove），${t}() 无效（ADR-0083 死会话语义沿用）`);Object.defineProperty(t,"closed",{get:()=>!0,configurable:!0}),Object.defineProperty(t,"visible",{get:()=>!1,configurable:!0});for(let e of Object.getOwnPropertyNames(t)){let r=Object.getOwnPropertyDescriptor(t,e);r?.get&&r.get.name===`flattenMethod`&&Object.defineProperty(t,e,{get(){return n(e),()=>{}},configurable:!0})}}var Ne=new Set([`showCount`,`maxLen`,`fetchOptions`,`icons`,`shell`,`shallow`,`types`]);function Pe(e,t){let{opts:n,frozen:r,typeDefaults:i,warn:a}=t,o=String(e.type??n.type??`toast`),s=n.types?.[o];if(s)for(let e of Object.keys(s))Ne.has(e)&&a(`engine.notifications: types.${o} 不允许管理器级键 "${e}"，已忽略`);let c={...d},l=i?.[o];l&&Object.assign(c,l);for(let e of f)e!==`id`&&e in n&&(c[e]=n[e]),e!==`id`&&(e===`anchor`||e===`actions`)&&r[e]!==void 0&&(c[e]=r[e]),e!==`id`&&s&&e in s&&(c[e]=s[e]);return Object.assign(c,e),{merged:c,type:o}}function Fe(e,t){let r=i(e.level);r==null?(t(`engine.notifications: 未知 level "${e.level}"（0~4 或 none/info/success/warn/error，ADR-0079），已回退 ${n.NONE}`),e.level=n.NONE):e.level=r}function w(e,t){s.has(e.pos)||(t(`engine.notifications: 未知 pos "${e.pos}"，已回退 "${d.pos}"`),e.pos=d.pos)}function T(e,t){e.persist!=null&&![0,1,2,3].includes(e.persist)&&(t(`engine.notifications: 未知 persist "${e.persist}"（0|1|2|3，ADR-0077），已回退 ${o.NONE}`),e.persist=o.NONE)}function E(e){return String(e??``).replace(/[/]/g,`-`).replace(/\*/g,`-`)}function D(e,t,n){return`notifications/${E(e)}/${E(t)}/${n}`}function Ie(e,n){let r=t(n),i=e._resolveGlobalComponent(r);if(i)return(e.getComponentDef(i)??e.getGlobalComponentDef(r)??null)?.defaults}var Le=class extends Map{_entryOf(e){return this._entries.get(e)}get _stateRef(){return this._state}get _options(){return this._state.options}constructor(e){super(),this.PERSIST=o,this._entries=new Map,this._state=null,this._frozen={},this._autoId=0,this._queues=new Map,this._typeDefaultsCache=new Map,this._typeDefaults=new Proxy({},{get:(e,t)=>{if(typeof t==`string`)return this._typeDefaultsCache.has(t)||this._typeDefaultsCache.set(t,Ie(this.engine,t)),this._typeDefaultsCache.get(t)}}),this.engine=e;let t=e.options.notifications;this.enabled=t!==!1;let n=t===!1||t==null?{}:t;if(this._frozen={anchor:n.anchor,actions:n.actions},this.records=new he(this),this.storage=new xe(this),!this.enabled)return;let r={};for(let e of Object.keys(n))e!==`anchor`&&e!==`actions`&&(r[e]=n[e]);for(let e of Object.keys(d))r[e]===void 0&&(r[e]=d[e]);let i=Number(r.shallow)===0?0:1;e.store.state[ee]={items:re([],i),options:r},this._state=e.store.state[ee],this.records.restoreRecords(ye(e=>this.engine.logger.warn(e)),`local`)}add(e,t){if(!this.enabled)return this.engine.logger.warn(`engine.notifications: 通知特性已通过 options.notifications: false 关闭，调用被忽略`),null;if(typeof e==`function`)return this._addAsync(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: add(..., ${typeof t==`string`?`"${t}"`:`props`}) 第二参仅对 factory 形态生效（对象形态请用 type 字段），已忽略`);let n=p(e,e=>this.engine.logger.warn(e));return n?this._enqueueProps(n):null}_addAsync(e,t){let n=typeof t==`object`&&t?t:{},r=t==null?`toast`:typeof t==`string`?String(t).trim()||`toast`:String(n.type??``).trim()||`toast`,{merged:i,type:a}=this._mergeProps({...n,type:r});w(i,e=>this.engine.logger.warn(e)),this._settleLevel(i),T(i,e=>this.engine.logger.warn(e));let o=i.id!=null&&i.id!==``?String(i.id):`notification-${++this._autoId}`;i.id=o,i.type=a;let s=this.records.createEntry(i,o,a);if(!this._materialize(s))return null;let c=s.instance;return(async()=>{try{let t=await e(c);if(!this._entries.has(o)||s.state===`closed`)return;if(t==null){this._destroyEntry(s);return}let n=p(t,e=>this.engine.logger.warn(e));if(!n||!String(n.title??``).trim()){this.engine.logger.warn(`engine.notifications: factory 结果缺少 title（空通知），已销毁`),this._destroyEntry(s);return}n.type!=null&&String(n.type)!==r&&(this.engine.logger.warn(`engine.notifications: factory 声明 type "${r}" 与 return props type "${n.type}" 不一致，以声明为准（类型不可变）`),n.type=r);let i=this._mergeProps({...n,id:o,type:r}).merged;this._applyEntryConfig(s,i),s.state=`queued`,this._emit(`add`,s),this._displayEntry(s),this.storage.schedule()}catch(e){this.engine.logger.warn(`engine.notifications: factory 执行失败，已销毁: ${e?.message??e}`),this._destroyEntry(s)}})(),c}_materialize(e){return Oe(this,e)?(this._bindChoice(e),this._entries.set(e.id,e),super.set(e.id,e.instance),this.records.mirrorAdd(e),this.records.evictOverflow(e),!0):!1}_bindChoice(e){if(e.type!==`confirm`||!e.instance)return;let t=new Promise(t=>{e.confirmResolve=t});Object.defineProperty(e.instance,"then",{value:t.then.bind(t),configurable:!0})}_mergeCtx(){return{opts:this.enabled?this._options:{},frozen:this._frozen,typeDefaults:this._typeDefaults,warn:e=>this.engine.logger.warn(e)}}_mergeProps(e){return Pe(e,this._mergeCtx())}_settleLevel(e){Fe(e,e=>this.engine.logger.warn(e))}_enqueueProps(e){if(!String(e.title??``).trim())return this.engine.logger.warn(`engine.notifications: title 为空，调用被忽略`),null;let{merged:t,type:n}=this._mergeProps(e);w(t,e=>this.engine.logger.warn(e)),this._settleLevel(t),T(t,e=>this.engine.logger.warn(e));let r=t.id!=null&&t.id!==``?String(t.id):`notification-${++this._autoId}`;t.id=r,t.type=n;let i=this._entries.get(r);if(i){if(i.state===`shown`||i.state===`queued`)return this._updateInPlace(i,e),this.get(r)??null;let n=this._mergeProps({...t,id:r}).merged;return this._applyEntryConfig(i,n),i.state=`queued`,this._displayEntry(i),this.storage.schedule(),this.get(r)??null}let a=this.records.createEntry(t,r,n);return this._materialize(a)?(this._emit(`add`,a),this._displayEntry(a),this.storage.schedule(),a.instance):null}get _showCount(){let e=this._state?.options.showCount??d.showCount;return typeof e==`number`&&e>0?Math.floor(e):d.showCount}get _maxLen(){let e=this._state?.options.maxLen;return typeof e==`number`&&e>0?Math.floor(e):0}_resolveIcon(e,t){if(t)return t;if(e===0)return``;let n=a(e);return this._options.icons?.[n]??c[n]??n}_resolveAnchor(e){return e==null?null:e instanceof HTMLElement?e:typeof e==`string`?(typeof document<`u`?document.querySelector(e):null)||(this.engine.logger.warn(`engine.notifications: anchor 选择器 "${e}" 未命中，按无 anchor 处理`),null):null}_resolveActions(e,t){let n=[],r=(e,t)=>{let n=u(e?.type);return e?.type!==void 0&&n===void 0&&this.engine.logger.warn(`engine.notifications: action "${t}" 的 type 须为 ${l.join(`/`)}，已忽略（按钮色回退跟随 level）`),n};for(let i of e??[])if(typeof i==`string`){let e=this._resolveActionByName(i,t);if(!e){this.engine.logger.warn(`engine.notifications: action "${i}" 未命中（全局表${t?`与 anchor scope 链`:``}），按钮已剪枝`);continue}n.push({name:i,title:e.title??i,handle:e.handle,hide:e.hide!==!1,hasValue:!1,value:void 0,type:r(e,i)})}else if(i&&typeof i==`object`){let e=`value`in i;n.push({name:String(i.id??i.title??`action`),title:i.title??`action`,handle:typeof i.handle==`function`?i.handle:null,hide:i.hide!==!1,hasValue:e,value:i.value,type:r(i,String(i.title??`action`))})}else this.engine.logger.warn(`engine.notifications: 非法 action 项，已剪枝`);return n}_resolveActionByName(e,t){if(t){let n=t;for(;n;){let t=this.engine.findScopeByEl(n)?.getAction(e);if(t)return t;n=n.parentElement}}return this.engine.actions[e]}_updateInPlace(e,t){`type`in t&&String(t.type)!==e.type&&this.engine.logger.warn(`engine.notifications: 同 id 更新不支持变更 type，已忽略`);let n={...e.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(n[e]=t[e]);w(n,e=>this.engine.logger.warn(e)),this._applyEntryConfig(e,n),e.state===`shown`&&this._startTimer(e),this._emit(`update`,e),this.storage.schedule()}_applyEntryConfig(e,t){let n=e.appliedClassName,r=e.appliedStyles;this._settleLevel(t),e.props=t;for(let n of[`title`,`description`,`owner`,`status`,`result`,`link`,`read`])n in t&&(e.record[n]=t[n]);e.record.level=t.level,this.records.touch(e),e.icon=this._resolveIcon(e.record.level??0,t.icon),e.actions=this._resolveActions(t.actions,e.anchor);let i=S(this,e);e.instance&&Object.assign(e.instance.data,i),t.progress!=null&&e.instance&&e.instance.methods.progress?.(Number(t.progress));let a=t.className?String(t.className).trim():``,o=t.styles?String(t.styles):``;e.el&&(n&&e.el.classList.remove(...n.split(/\s+/)),a&&e.el.classList.add(...a.split(/\s+/)),o!==r&&(e.el.style.cssText=o),C(e.el,t)),e.appliedClassName=a,e.appliedStyles=o,this.records.mirrorReplace(e)}update(e,t){let n=this._entries.get(e);if(!n||!this._entries.has(e)){this.engine.logger.warn(`engine.notifications: update("${e}") 未命中存活记录，已忽略`);return}p(t,e=>this.engine.logger.warn(e)),`type`in t&&String(t.type)!==n.type&&this.engine.logger.warn(`engine.notifications: update 不支持修改 type，已忽略`);let r=n.props.read===!0,i=n.props.status,a={...n.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(a[e]=t[e]);w(a,e=>this.engine.logger.warn(e)),this._applyEntryConfig(n,a),this._emit(`update`,n),!r&&n.props.read===!0&&this._emit(`read`,n),n.props.status!==i&&this._emit(`status`,n),this.storage.schedule()}_setRead(e){e.props.read!==!0&&(e.props.read=!0,e.record.read=!0,this.records.touch(e),e.instance&&(e.instance.data.read=!0),this.records.mirrorReplace(e),this._emit(`read`,e),this.storage.schedule())}markRead(e){let t=this._entries.get(e);t?this._setRead(t):this.engine.logger.warn(`engine.notifications: markRead("${e}") 未命中存活记录，已忽略`)}markAllRead(e){for(let t of Array.from(this._entries.values()))t.props.read!==!0&&(e==null||t.type===e)&&this._setRead(t)}_queueOf(e){let t=this._queues.get(e);return t||(t=new ge(this,e),this._queues.set(e,t)),t}_displayEntry(e){this._queueOf(e.props.pos).offer(e)}_showEntry(e){e.state!==`shown`&&(e.el&&(e.el.style.display=``),e.state=`shown`,e.instance&&(e.instance.data.visible=!0,e.instance.data.closed=!1),e.el&&this.engine.animate.enter(e.el,_(e.props.animate).enter),this._startTimer(e),this._emit(`show`,e),this._emitTaskAutoStart(e))}_dequeue(e){this._queues.get(e.props.pos)?.remove(e)}_flushQueue(e){this._queueOf(e).flush()}show(e,t){if(typeof e!=`string`)return this.add(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: show("${e}", ...) 第二参仅对 factory 形态生效，已忽略`);let n=this._entries.get(e);return!n||n.state===`closed`?(this.engine.logger.warn(`engine.notifications: show("${e}") 未命中存活记录（persist=0 的已关通知已销毁）`),null):(n.state===`shown`||n.state===`queued`||(n.state=`queued`,this._displayEntry(n)),this.get(e)??null)}hide(e){let t=this._entries.get(e);t&&t.state!==`closed`&&t.state!==`hidden`&&this._dismiss(t,!0)}toast(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`toast`}},`toast`);let t={...typeof e==`string`?{title:e}:e,type:`toast`};return this.show(t)}confirm(e,t){let n=typeof e==`string`?{title:e}:{...e},r=t?.yes??n.yes,i=t?.no??n.no;return delete n.yes,delete n.no,this.show({...n,type:`confirm`,delayClose:n.delayClose??0,actions:(n.actions?.length?n.actions:void 0)??[{title:r??`确定`,value:!0,type:`primary`},{title:i??`取消`,value:!1,type:`plain`}]})}task(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`task`}},`task`);let t={...typeof e==`string`?{title:e}:e,type:`task`};return this.show(t)}_dismiss(e,t){if(e.state===`closed`||e.state===`hidden`)return;e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.instance&&(e.instance.data.visible=!1),this._emit(`hide`,e);let n=()=>this._settleClose(e),r=t?e.leave:null,i=e.el;r&&i&&i.style.display!==`none`?(i.style.boxSizing=`border-box`,i.style.height=`${i.offsetHeight}px`,i.style.overflow=`hidden`,this.engine.animate.leave(i,r,n)?(i.style.transitionProperty=`transform, opacity, height, padding-top, padding-bottom, margin-bottom, border-top-width, border-bottom-width`,i.style.height=`0px`,i.style.paddingTop=`0px`,i.style.paddingBottom=`0px`,i.style.marginBottom=`-10px`,i.style.borderTopWidth=`0px`,i.style.borderBottomWidth=`0px`):n()):n()}_settleClose(e){let t=Number(e.props.persist??o.NONE);this._queueOf(e.props.pos).releaseShown(e.id),t>=o.SESSION&&t<=o.REMOTE?(e.state=`hidden`,e.el&&(e.el.style.display=`none`),e.instance&&(e.instance.data.closed=!0,e.instance.data.visible=!1)):this._destroyEntry(e),this._flushQueue(e.props.pos),this.storage.schedule()}_destroyEntry(e){e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.confirmResolve=null,je(this,e),this._entries.delete(e.id),super.delete(e.id),this.records.mirrorRemove(e.id),this._queueOf(e.props.pos).releaseShown(e.id)}delete(e){let t=this._entries.get(e);return t?((t.state===`shown`||t.state===`queued`)&&this._emit(`hide`,t),this._destroyEntry(t),this._flushQueue(t.props.pos),this.storage.flushNow(),!0):!1}clear(e=!0){for(let e of this._queues.values())e.clear();for(let t of Array.from(this._entries.values()))t.state===`shown`||t.state===`queued`?this._dismiss(t,e):this._destroyEntry(t);this._state&&this._state.items.splice(0),this.storage.flushNow()}dispose(){this.storage.flushNow();for(let e of this._queues.values())e.clear();for(let e of Array.from(this._entries.values()))(e.state===`shown`||e.state===`queued`||e.state===`hidden`)&&this._destroyEntry(e);me(this.engine),this._state&&this._state.items.splice(0)}async load(e){return this.storage.load(e)}async save(){await this.storage.save()}_onCardClick(e,t){this._setRead(e);let n=t.target,r=n?.closest?.(`.autospark-notification-action`);if(r){let t=Number(r.getAttribute(`data-notification-action`)),n=e.actions[Number.isInteger(t)?t:-1];n&&this._fireAction(e,n)}else if(n?.closest?.(`.autospark-notification-close`)){let t=e.instance?.methods??{},n=typeof t.close==`function`?t.close:typeof t.cancel==`function`?t.cancel:null;typeof n==`function`?n():this._dismiss(e,!0)}}_fireAction(e,t){t.hasValue&&(e.props.result=t.value,e.record.result=t.value,this.records.touch(e),e.instance&&(e.instance.data.result=t.value),this.records.mirrorReplace(e)),this._emitAction(e,t),e.confirmResolve&&=(e.confirmResolve(t.hasValue?t.value:void 0),null),t.handle?.(),this.storage.schedule(),t.hide&&this._dismiss(e,!0)}_fireConfirmChoice(e,t){let n=e.actions.find(e=>e.hasValue&&e.value===t);n?this._fireAction(e,n):this.engine.logger.warn(`engine.notifications: type='confirm' 会话缺少 value=${t} 的按钮（actions 已被自定义），选择无效（ADR-0077）`)}respond(e,t){let n=this._entries.get(e);n?this._fireConfirmChoice(n,t):this.engine.logger.warn(`engine.notifications: respond("${e}") 未命中存活记录，已忽略`)}_emitControlAction(e,t){let n=this._entries.get(e);if(!n)return;let r=D(n.type,n.props.id,`actions/${t}`),i={notification:n.instance,el:n.el};this.engine.emit(r,i),n.el?.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0})),n.anchor&&n.anchor.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0}))}_onControlAction(e,t,n){let r=this._entries.get(e),i=D(r?.type??`task`,e,`actions/${t}`),a=this.engine.on(i,n),o=()=>a.off();return r&&r.controlOffs.push(o),o}_emitTaskAutoStart(e){if(e.type!==`task`||e.startEmitted||e.props.canStart===!0)return;let t=e.instance?.data?.state;t!==`stopped`&&t!==`completed`&&(e.startEmitted=!0,this._emitControlAction(e.props.id,`start`))}_emit(e,t){let n=D(t.type,t.props.id,e),r={notification:t.instance,el:t.el};this.engine.emit(n,r),t.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_emitAction(e,t){let n=D(e.type,e.props.id,`actions/${t.name}`),r={notification:e.instance,el:e.el,action:{title:t.title,hide:t.hide},value:t.hasValue?t.value:void 0};this.engine.emit(n,r),e.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0})),e.anchor&&e.anchor.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_startTimer(e){if(this._clearTimer(e),e.instance?.data.holdOpen===!0)return;let t=e.props.delayClose;typeof t==`number`&&t>0?(e.deadline=Date.now()+t,e.pausedRemaining=null,e.instance&&(e.instance.data.remaining=t),e.tickTimer=setInterval(()=>{e.deadline!=null&&e.instance&&(e.instance.data.remaining=Math.max(0,e.deadline-Date.now()))},1e3),e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)):(e.deadline=null,e.instance&&(e.instance.data.remaining=-1))}_pauseTimer(e){e.timer!=null&&e.deadline!=null&&(clearTimeout(e.timer),e.timer=null,e.pausedRemaining=Math.max(0,e.deadline-Date.now()))}_resumeTimer(e){if(e.pausedRemaining==null||e.state!==`shown`)return;let t=e.pausedRemaining;e.pausedRemaining=null,e.deadline=Date.now()+t,e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)}_clearTimer(e){e.timer!=null&&(clearTimeout(e.timer),e.timer=null),e.tickTimer!=null&&(clearInterval(e.tickTimer),e.tickTimer=null),e.pausedRemaining=null}},Re=`ready`,ze=`__AUTOSPARK_PLUGINS__`;function O(e){let t=globalThis.AutoSpark;if(typeof t?.[Re]==`function`){e(t);return}let n=globalThis,r=n[ze]??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var Be=`<div\r
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
    <\/script>\r
    <style global id="autospark-notification-styles">\r
        /* 主题化（ADR-0129）：三级样式回退链 var(--auto-X, var(--autospark-<feature>-X, 校准兜底值))；\r
             语义色命名对齐 theme 侧词汇（warn ↔ warning、error ↔ danger）；\r
             --autospark-notification-mix-bg 是内部中转（语义色混合底，暗色变体只改它一处）；\r
             字号/间距/排版常量保留组件设计；暗色兜底变体见块尾 */\r
        .autospark-notification {\r
            position: relative;\r
            --autospark-notification-mix-bg: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            border-radius: var(--auto-border-radius, var(--autospark-overlay-radius, 0.5rem));\r
            border: 1px solid var(--auto-border-color, var(--autospark-overlay-border, #f0f0f0));\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(240 3.8% 46.1% / 12%)));\r
            display: flex;\r
            flex-direction: column;\r
            padding: 10px 12px;\r
            box-sizing: border-box;\r
            max-width: var(--autospark-notification-max-w, 360px);\r
            font-size: 14px;\r
            line-height: 1.5;\r
            color: var(--auto-color, var(--autospark-notification-fg, #606060));\r
        }\r
        .autospark-notification[data-notification-level="info"] {\r
            --autospark-notification-accent: var(--auto-info-color, var(--autospark-notification-info-color, #71717a));\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-notification-mix-bg)\r
            );\r
        }\r
        .autospark-notification[data-notification-level="success"] {\r
            --autospark-notification-accent: var(--auto-success-color, var(--autospark-notification-success-color, #22c55e));\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-notification-mix-bg)\r
            );\r
        }\r
        .autospark-notification[data-notification-level="warn"] {\r
            --autospark-notification-accent: var(--auto-warning-color, var(--autospark-notification-warn-color, #f59e0b));\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-notification-mix-bg)\r
            );\r
        }\r
        .autospark-notification[data-notification-level="error"] {\r
            --autospark-notification-accent: var(--auto-danger-color, var(--autospark-notification-error-color, #ef4444));\r
            border-color: var(--autospark-notification-accent);\r
            background: color-mix(\r
                in srgb,\r
                var(--autospark-notification-accent) 7%,\r
                var(--autospark-notification-mix-bg)\r
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
            /* 与 title 首行文字中心对齐：10(卡 padding-top) + 21/2(首行 14×1.5) − 17/2(钮高 13+2×2) = 12；\r
               推导自本表写死的排版常量，改 padding/字号/行高须同步重算（无 title 时维持同位——chrome 不读 slot 内容） */\r
            top: 12px;\r
            right: 8px;\r
            display: inline-flex;\r
            align-items: center;\r
            border: none;\r
            background: none;\r
            padding: 2px;\r
            font-size: 13px;\r
            color: var(--auto-color, var(--autospark-notification-fg, #606060));\r
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
            color: var(--autospark-notification-accent, #71717a);\r
            cursor: pointer;\r
        }\r
\r
        /* action 语义变体（ADR-0129 场景化语义色）：按 data-action-type 选 theme 语义色链；\r
           无标记 = 跟随通知 level accent（上方缺省色） */\r
        .autospark-notification-action[data-action-type="primary"] {\r
            color: var(--auto-primary-color, var(--autospark-notification-action-primary, #009aff));\r
        }\r
        .autospark-notification-action[data-action-type="success"] {\r
            color: var(--auto-success-color, var(--autospark-notification-action-success, #22c55e));\r
        }\r
        .autospark-notification-action[data-action-type="warning"] {\r
            color: var(--auto-warning-color, var(--autospark-notification-action-warning, #f59e0b));\r
        }\r
        .autospark-notification-action[data-action-type="danger"] {\r
            color: var(--auto-danger-color, var(--autospark-notification-action-danger, #ef4444));\r
        }\r
        .autospark-notification-action[data-action-type="plain"] {\r
            color: var(--auto-secondary-color, var(--autospark-notification-action-plain, rgba(96, 96, 96, 0.75)));\r
        }\r
\r
        /* 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变）；\r
           语义色混合底只改中转变量一处 */\r
        [dark] .autospark-notification,\r
        [data-dark] .autospark-notification {\r
            --autospark-notification-mix-bg: var(--auto-bgcolor, var(--autospark-overlay-bg, #606060));\r
            border-color: var(--auto-border-color, var(--autospark-overlay-border, #606060));\r
            background: var(--auto-bgcolor, var(--autospark-overlay-bg, #606060));\r
            box-shadow: var(--auto-shadow, var(--autospark-overlay-shadow, 0 2px 4px hsl(0 0% 0% / 50%)));\r
            color: var(--auto-color, var(--autospark-notification-fg, #fafafa));\r
        }\r
        [dark] .autospark-notification-close,\r
        [data-dark] .autospark-notification-close {\r
            color: var(--auto-color, var(--autospark-notification-fg, #fafafa));\r
        }\r
\r
        /* action 语义变体暗色兜底（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值 */\r
        [dark] .autospark-notification-action[data-action-type="primary"],\r
        [data-dark] .autospark-notification-action[data-action-type="primary"] {\r
            color: var(--auto-primary-color, var(--autospark-notification-action-primary, #56baff));\r
        }\r
        [dark] .autospark-notification-action[data-action-type="success"],\r
        [data-dark] .autospark-notification-action[data-action-type="success"] {\r
            color: var(--auto-success-color, var(--autospark-notification-action-success, #5cd07c));\r
        }\r
        [dark] .autospark-notification-action[data-action-type="warning"],\r
        [data-dark] .autospark-notification-action[data-action-type="warning"] {\r
            color: var(--auto-warning-color, var(--autospark-notification-action-warning, #f7d352));\r
        }\r
        [dark] .autospark-notification-action[data-action-type="danger"],\r
        [data-dark] .autospark-notification-action[data-action-type="danger"] {\r
            color: var(--auto-danger-color, var(--autospark-notification-action-danger, #e6696a));\r
        }\r
        [dark] .autospark-notification-action[data-action-type="plain"],\r
        [data-dark] .autospark-notification-action[data-action-type="plain"] {\r
            color: var(--auto-secondary-color, var(--autospark-notification-action-plain, rgba(250, 250, 250, 0.75)));\r
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
                        aria-label="查看详情"\r
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
                :data-action-type="a.type || null"\r
            ></button>\r
        </div>\r
    </div>\r
    <button\r
        class="autospark-notification-close"\r
        type="button"\r
        x-show="closeable"\r
        x-icon="'no'"\r
        aria-label="关闭"\r
    ></button>\r
</div>\r
`,Ve=`<div x-define="autospark.notifications.toast" x-define:inherit="autospark.notifications.shell"></div>\r
`,He=`<div x-define="autospark.notifications.task" x-define:inherit="autospark.notifications.shell">\r
    <script setup>\r
        {\r
            defaults: { width: 300 },\r
            data: () => ({\r
                progress: 0,\r
                // 任务态状态机（ADR-0104）：pending（canStart 手动门控待启动）→ running ⇄\r
                // paused；终态 stopped（中止留卡）/ completed（完成）。声明缺省 pending——\r
                // 自动模式由引擎注水归位 running（挂起/排队期闭包 progress 直写不丢）。\r
                // cancel/close 不入状态机：它们的终态是卡片不可见，不是任务态\r
                state: "pending",\r
                holdOpen: true,\r
                // 控制键默认值（canCancel 缺省 true——取消是任务卡的基本出口；\r
                // canStart/canPause/canStop 缺省 false）：须在 data 域物化——控制钮容器的\r
                // x-show 表达式读取这些键，未物化键参与表达式会使求值抛错（整容器不显示）；\r
                // props 注入（initialData）后覆盖（含显式 canCancel: false）\r
                canStart: false,\r
                canPause: false,\r
                canStop: false,\r
                canCancel: true,\r
            }),\r
            methods: {\r
                // 开始（ADR-0104）：手动门控（canStart）的启动触发——pending → running +\r
                // actions/start 广播；自动模式装配期已 running，此处幂等 no-op\r
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
                // 暂停/恢复切换（模板按钮用）：@click 仅裸标识符/标识符调用形态经 getMethod\r
                // 查找组件 method——三元表达式形态（\`state === 'paused' ? resume() : pause()\`）\r
                // 走表达式兜底路径（with 数据视图求值），methods 不在数据视图内，解析必失败\r
                togglePause() {\r
                    if (this.data.state === "paused") this.resume();\r
                    else this.pause();\r
                },\r
                // 停止（ADR-0104 语义分野）：abort + 「已停止」终态留卡（进度定格、\r
                // closeWhenDone 对 stopped 同生效）——与取消（abort + 立即隐藏）的分野\r
                // = 结果是否留卡可查\r
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
                // 取消：abort（完成守卫沿用 ADR-0102）+ 立即隐藏——不留结果\r
                cancel() {\r
                    if (this.data.state !== "completed") this.data._abort?.abort();\r
                    this.engine.notifications._emitControlAction(this.props.id, "cancel");\r
                    this.engine.notifications.hide(this.props.id);\r
                },\r
                // × 关闭（ADR-0104 独立动词，修订 ADR-0102 × ≡ cancel）：非终态先 abort\r
                // 再关；completed/stopped 终态仅关卡（不发无用 abort）\r
                close() {\r
                    if (this.data.state !== "completed" && this.data.state !== "stopped") this.data._abort?.abort();\r
                    this.engine.notifications._emitControlAction(this.props.id, "close");\r
                    this.engine.notifications.hide(this.props.id);\r
                },\r
                // —— 控制订阅便捷面（ADR-0104）：具体名订阅（回调收裸 payload），返回退订\r
                // 函数；卡销毁时引擎自动清残留侦听（entry.controlOffs）\r
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
                // 终态收口三态（ADR-0102 closeWhenDone → ADR-0104 扩至 stopped 终态）：\r
                // false/缺省 = 终态常驻（delayClose 对 task 彻底无效）；true = 即关；\r
                // number(ms) = 经 update 写入生效配置后翻 holdOpen 交还计时器——\r
                // hover 暂停/remaining 倒计时保留\r
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
    <\/script>\r
    <style>\r
        .autospark-notification-progress {\r
            display: flex;\r
            align-items: center;\r
            gap: 8px;\r
            margin-top: 6px;\r
        }\r
        /* 主题化（ADR-0129）：进度条是活动指示，第一级挂主题主色（--auto-theme-color），\r
             accent 为覆盖位（theme 缺席时跟随 level）；轨道与段同源；暗色兜底变体见块尾 */\r
        .autospark-notification-progress-track {\r
            flex: 1;\r
            height: 6px;\r
            border-radius: 3px;\r
            background: color-mix(\r
                in srgb,\r
                var(--auto-theme-color, var(--autospark-notification-accent, #009aff)) 15%,\r
                var(--auto-bgcolor, var(--autospark-overlay-bg, #fff))\r
            );\r
            overflow: hidden;\r
        }\r
        .autospark-notification-progress-bar {\r
            height: 100%;\r
            border-radius: 3px;\r
            background: var(--auto-theme-color, var(--autospark-notification-accent, #009aff));\r
            transition: width 0.2s;\r
        }\r
        /* 待启动（pending，ADR-0104 手动门控）：短条呼吸——等待用户点「开始」 */\r
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
            color: var(--autospark-notification-accent, #71717a);\r
            cursor: pointer;\r
        }\r
\r
        /* op 语义变体（ADR-0129 场景化语义色，固定控制钮语义恒定）：开始/恢复 = 主操作、\r
           停止 = 危险、暂停/取消 = 中性弱化；无标记 = 跟随 level accent（缺省色） */\r
        .autospark-notification-op[data-op="start"] {\r
            color: var(--auto-primary-color, var(--autospark-notification-op-primary, #009aff));\r
        }\r
        .autospark-notification-op[data-op="pause"],\r
        .autospark-notification-op[data-op="cancel"] {\r
            color: var(--auto-secondary-color, var(--autospark-notification-op-plain, rgba(96, 96, 96, 0.75)));\r
        }\r
        .autospark-notification-op[data-op="stop"] {\r
            color: var(--auto-danger-color, var(--autospark-notification-op-danger, #ef4444));\r
        }\r
\r
        /* 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） */\r
        [dark] .autospark-notification-progress-track,\r
        [data-dark] .autospark-notification-progress-track {\r
            background: color-mix(\r
                in srgb,\r
                var(--auto-theme-color, var(--autospark-notification-accent, #56baff)) 15%,\r
                var(--auto-bgcolor, var(--autospark-overlay-bg, #606060))\r
            );\r
        }\r
        [dark] .autospark-notification-progress-bar,\r
        [data-dark] .autospark-notification-progress-bar {\r
            background: var(--auto-theme-color, var(--autospark-notification-accent, #56baff));\r
        }\r
        [dark] .autospark-notification-op[data-op="start"],\r
        [data-dark] .autospark-notification-op[data-op="start"] {\r
            color: var(--auto-primary-color, var(--autospark-notification-op-primary, #56baff));\r
        }\r
        [dark] .autospark-notification-op[data-op="pause"],\r
        [data-dark] .autospark-notification-op[data-op="pause"],\r
        [dark] .autospark-notification-op[data-op="cancel"],\r
        [data-dark] .autospark-notification-op[data-op="cancel"] {\r
            color: var(--auto-secondary-color, var(--autospark-notification-op-plain, rgba(250, 250, 250, 0.75)));\r
        }\r
        [dark] .autospark-notification-op[data-op="stop"],\r
        [data-dark] .autospark-notification-op[data-op="stop"] {\r
            color: var(--auto-danger-color, var(--autospark-notification-op-danger, #e6696a));\r
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
            x-text="state === 'pending' ? '待启动' : state === 'stopped' ? '已停止' : (progress ?? 0) + '%'"\r
        ></span>\r
    </div>\r
    <div\r
        class="autospark-notification-ops"\r
        x-show="(canStart || canPause || canStop || canCancel) && state !== 'completed' && state !== 'stopped'"\r
    >\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            data-op="start"\r
            x-show="canStart && state === 'pending'"\r
            @click="start()"\r
        >\r
            开始\r
        </button>\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            data-op="pause"\r
            x-show="canPause && (state === 'running' || state === 'paused')"\r
            x-text="state === 'paused' ? '恢复' : '暂停'"\r
            @click="togglePause()"\r
        ></button>\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            data-op="stop"\r
            x-show="canStop && state !== 'completed' && state !== 'stopped'"\r
            @click="stop()"\r
        >\r
            停止\r
        </button>\r
        <button\r
            class="autospark-notification-op"\r
            type="button"\r
            data-op="cancel"\r
            x-show="canCancel && state !== 'completed' && state !== 'stopped'"\r
            @click="cancel()"\r
        >\r
            取消\r
        </button>\r
    </div>\r
</div>\r
`,Ue=`<div x-define="autospark.notifications.confirm" x-define:inherit="autospark.notifications.shell">\r
    <script setup>\r
    {\r
        defaults: {\r
            width: 300,\r
            delayClose: 0,\r
            actions: [\r
                { title: "确定", value: true },\r
                { title: "取消", value: false },\r
            ],\r
        },\r
        methods: {\r
            yes() { this.engine.notifications.respond(this.props.id, true); },\r
            no() { this.engine.notifications.respond(this.props.id, false); },\r
        },\r
    }\r
    <\/script>\r
</div>\r
`,We={[e]:Be,[t(`toast`)]:Ve,[t(`task`)]:He,[t(`confirm`)]:Ue};function k(e){let t=e?.el;return t instanceof HTMLElement?t:null}function Ge(e){return{title:`提示`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type??=`toast`,n.anchor??=k(this)??void 0,e.notifications.add(n)}}}function Ke(e){return{title:`确认`,handle:function(t){let{yes:n,no:r,...i}=typeof t==`string`?{title:t}:{...t??{}};return i.anchor??=k(this)??void 0,e.notifications.show({...i,type:`confirm`,delayClose:i.delayClose??0,actions:[{title:n??`确定`,value:!0,type:`primary`},{title:r??`取消`,value:!1,type:`plain`}]})}}}function qe(e){return{title:`任务`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type=`task`,n.anchor??=k(this)??void 0,e.notifications.show(n)}}}var Je={toast:Ge,confirm:Ke,task:qe};function Ye(e){let t=e.options.builtinComponents??(e.options.builtinComponents={});for(let[e,n]of Object.entries(We))t[e]??(t[e]=n)}function Xe(e){Ye(e);let t=new Le(e);e.notifications=t;for(let[t,n]of Object.entries(Je))t in e.actions||(e.actions[t]=n(e));e.on(`engine/destroy/before`,()=>t.dispose())}function Ze(){O(e=>{h(e),e.ready(Xe)})}Ze();var A=[`hover`,`always`,`click`],j=`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`,M=`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`,Qe=`var(--auto-danger-color, var(--autospark-ripple-badge-color, #ef4444))`,$e=`var(--auto-danger-color, var(--autospark-spin-badge-color, #ef4444))`,et=2147483647,N=3e3;function P(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function F(e,t,n){let r=P(e,`speed`,t,n)??3e3;return r<=0?(t(`${n}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${N}`),N):r}function I(e,t,n){let r=new Set;e?.trigger!==void 0&&(A.includes(e.trigger)?r.add(e.trigger):t(`${n}: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let i of A){let a=e?.[i];a===!0?r.add(i):a!==void 0&&a!==!1&&t(`${n}: ${i} 开关须为布尔值，已忽略`)}return A.find(e=>r.has(e))??`always`}function L(e,t,n,r){let i=new Set;if(!e)return i;for(let a of t){let t=e[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return i}function R(e,t,n,r,i){if(e)for(let a of t){let t=e[a];t!==void 0&&t!==!1&&r(`${i}: ${a} 是 ${n} 的形态键，已忽略`)}}function z(e,t,n){let r=e?.badge;return r===void 0||r===!1?0:r===!0?8:typeof r==`number`&&Number.isFinite(r)&&r>0?r:(t(`${n}: badge 须为 true 或正数字（直径 px），已忽略`),0)}function tt(e,t,n,r,i){if(e!==void 0){if(typeof e==`string`&&e.trim()!==``)return e;r(`${i}: color 须为非空字符串，已回退默认色`)}return n>0?t.badgeColor:t.color}function nt(){return`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`}function rt(e){return`position:absolute;top:${-e/2}px;right:${-e/2}px;width:${e}px;height:${e}px;border-radius:50%;pointer-events:none;display:block;z-index:${et};`}function it(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}var at=class{static{this.probe=it}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??it)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{core:a,halo:o}=t.animations(this.config),s=e=>Math.round(e*10)/10,c=(e,t)=>{e.style.left=`${s(n-i)}px`,e.style.top=`${s(r-i)}px`,e.style.width=`${s(i*2)}px`,e.style.height=`${s(i*2)}px`,e.style.animation=`none`,e.offsetWidth,e.style.animation=t};c(this.insideCarrier.core,a),c(this.insideCarrier.halo,o)}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.core.style.animation=``,this.insideCarrier.halo.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}},B=new WeakMap;function ot(e,t){function n(){if(!this.el)return;let e=new at(t,this.engine,this.info);e.el=this.el,B.set(this,e),e.mounted()}function r(){let e=B.get(this);B.delete(this),e?.unmounted()}function i(e){B.get(this)?.attrChanged(e)}return{name:e,kind:1,priority:0,mounted:n,unmounted:r,attrChanged:i}}function st(e){O(t=>{h(t),t.directive(e)})}var ct=[`glow`,`ring`,`echo`],lt=[`ring`,`glow`,`echo`],ut=[`rotate`,`beam`,`chase`],dt={type:`echo`,trigger:`always`,inside:!1,badge:0,color:j,size:12,speed:3e3,gap:0},V=`x-ripple`,H=`x-ripple-on`,U=`x-ripple-echo`,ft=`x-ripple-layer`,W=`x-ripple-badge`,pt=`x-ripple-inside`,mt=`x-ripple-inside-clip`,ht=`x-ripple-inside-core`,gt=`x-ripple-inside-halo`,_t=600,vt=2,yt=.3,bt=.5,xt=!1,G=new Map,K=null;function St(){if(xt||typeof document>`u`)return;xt=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-ripple`,``),e.textContent=`
:where(.${V}) { position: relative; }
.${V} {
  --x-ripple-color: ${j};
  --x-ripple-size: 12px;
  --x-ripple-duration: 3000ms;
  --x-ripple-anim: x-ripple-echo-3000-0;
  --x-ripple-echo-delay: -1500ms;
  --x-ripple-echo-size: 7.2px;
  --x-ripple-badge-size: 8px;
}
.${V}.${H}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
}
.${V}.${H}.${U}::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* click 触发器双环同时起波：第二环同心缩小（--x-ripple-echo-size），与主环同拍收束；
     always/hover 维持负延迟错相位（同尺寸）——第二环尺寸仅在 click 下有别于主环 */
  --x-ripple-size: var(--x-ripple-echo-size);
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
  animation-delay: var(--x-ripple-echo-delay);
}
.${V}.${W}.${H}::after {
  /* badge 徽标形态：载体缩为宿主右上角正圆（圆心恰在角点），实底圆点 + 波环自圆边扩散 */
  inset: auto;
  top: calc(-1 * var(--x-ripple-badge-size) / 2);
  right: calc(-1 * var(--x-ripple-badge-size) / 2);
  width: var(--x-ripple-badge-size);
  height: var(--x-ripple-badge-size);
  border-radius: 50%;
  background: var(--x-ripple-color);
  z-index: 2147483647;
}
.${V}.${W}.${H}.${U}::before {
  /* echo 第二环同 badge 几何（双环同心，仅 delay/spread 通道区分） */
  inset: auto;
  top: calc(-1 * var(--x-ripple-badge-size) / 2);
  right: calc(-1 * var(--x-ripple-badge-size) / 2);
  width: var(--x-ripple-badge-size);
  height: var(--x-ripple-badge-size);
  border-radius: 50%;
  background: var(--x-ripple-color);
  z-index: 2147483647;
}
@media (prefers-reduced-motion: reduce) {
  .${V}.${H}::after,
  .${V}.${H}.${U}::before { animation: none; }
  /* inside 芯/环动画走内联 style——类规则 !important 压过内联（可访问性底线同家族） */
  .${ht},
  .${gt} { animation: none !important; }
}`,document.head.appendChild(e)}function Ct(e){let t=`${e.type}|${e.speed}|${e.gap}`,n=G.get(t);if(n)return n;let r=`x-ripple-${e.type}-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=i>0?Math.round(e.speed/i*100):100,o;return o=e.type===`glow`?`
  0% { box-shadow: 0 0 0 0 transparent; }
  ${Math.round(a/2)}% { box-shadow: 0 0 var(--x-ripple-size) 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`:`
  0% { box-shadow: 0 0 0 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }`,K||(K=document.createElement(`style`),K.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(K)),K.textContent+=`\n@keyframes ${r} {${o}\n}`,G.set(t,r),r}function wt(e,t){let n=`inside-${t}|${e.speed}|${e.gap}`,r=G.get(n);if(r)return r;let i=`x-ripple-inside-${t}-${e.speed}-${e.gap}`,a=e.speed+e.gap,o=a>0?Math.round(e.speed/a*100):100,s=`
  0% { transform: scale(0); opacity: var(--x-ripple-${t===`core`?`core`:`halo`}-alpha, ${t===`core`?yt:bt}); }
  ${o}% { transform: scale(1); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }`;return K||(K=document.createElement(`style`),K.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(K)),K.textContent+=`\n@keyframes ${i} {${s}\n}`,G.set(n,i),i}function Tt(e,t,n){let r=e.offsetWidth,i=e.offsetHeight,a=r/2,o=i/2;if(n){let t=e.getBoundingClientRect();a=n.clientX-t.left,o=n.clientY-t.top}let s=Math.max(a,r-a),c=Math.max(o,i-o);return{x:a,y:o,r:Math.hypot(s,c)}}function Et(e){return e.trigger===`click`?0:-(e.speed+e.gap)/2}function Dt(e){return e.trigger===`click`?Math.round(e.size*.6*10)/10:e.size}function Ot(e,t){let n={...dt};if(!e)return n;let r=L(e,lt,t,`x-ripple`);e.type!==void 0&&(lt.includes(e.type)?r.add(e.type):t(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let i=ct.find(e=>r.has(e));return i&&(n.type=i),R(e,ut,`x-spin`,t,`x-ripple`),e.inside!==void 0&&(e.inside===!0?n.inside=!0:e.inside!==!1&&t(`x-ripple: inside 开关须为布尔值，已忽略`)),n.trigger=I(e,t,`x-ripple`),n.badge=z(e,t,`x-ripple`),n.inside&&n.badge>0&&(t(`x-ripple: badge 与 inside 互斥，badge 优先（inside 已忽略）`),n.inside=!1),n.color=tt(e.color,{color:j,badgeColor:Qe},n.badge,t,`x-ripple`),n.size=P(e,`size`,t,`x-ripple`)??dt.size,n.speed=F(e,t,`x-ripple`),n.gap=P(e,`gap`,t,`x-ripple`)??0,n.inside&&(r.size>0&&t(`x-ripple: inside 接管渲染，type 形态词表已忽略`),e.size!==void 0&&t(`x-ripple: inside 半径自动几何（起点到最远角），size 已忽略`),e.speed===void 0&&(n.speed=_t)),n}var kt={hostClass:V,activeClass:H,layerClass:ft,ensureStyles:St,normalize:Ot,hostClasses:e=>[...e.badge>0?[W]:[],...e.inside?[pt]:[]],activeClasses:e=>e.type===`echo`&&!e.inside?[U]:[],animName:e=>Ct(e),animationCss:(e,t)=>`${t} ${e.speed+e.gap}ms ease-out infinite`,period:e=>e.speed+e.gap,layerCount:e=>e.type===`echo`?2:1,layerCssText:e=>e.badge>0?`${rt(e.badge)}background:var(--x-ripple-color);`:nt(),applyLayerExtras:(e,t)=>{let n=e[1];n&&(n.style.animationDelay=`${Et(t)}ms`,n.style.setProperty(`--x-ripple-size`,`${Dt(t)}px`))},applyVars:(e,t,n)=>{let r=e.style;r.setProperty(`--x-ripple-color`,t.color||`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`),r.setProperty(`--x-ripple-size`,`${t.size}px`),r.setProperty(`--x-ripple-duration`,`${t.speed+t.gap}ms`),r.setProperty(`--x-ripple-anim`,n),r.setProperty(`--x-ripple-echo-delay`,`${Et(t)}ms`),r.setProperty(`--x-ripple-echo-size`,`${Dt(t)}px`),t.badge>0&&r.setProperty(`--x-ripple-badge-size`,`${t.badge}px`)},inside:{enabled:e=>e.inside,createCarrier:()=>{let e=document.createElement(`span`);e.className=mt,e.style.cssText=`position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;display:block;`;let t=document.createElement(`span`);t.className=ht,t.style.cssText=`position:absolute;border-radius:50%;background:var(--x-ripple-color);pointer-events:none;display:block;`;let n=document.createElement(`span`);return n.className=gt,n.style.cssText=`position:absolute;border-radius:50%;box-sizing:border-box;border:var(--x-ripple-halo-width, ${vt}px) solid var(--x-ripple-color);pointer-events:none;display:block;`,e.append(t,n),{clip:e,core:t,halo:n}},geometry:Tt,animations:e=>({core:`${wt(e,`core`)} ${e.speed+e.gap}ms ease-out infinite`,halo:`${wt(e,`halo`)} ${e.speed+e.gap}ms ease-out infinite`})}};function At(){st(ot(`ripple`,kt))}At();var jt=[`chase`,`rotate`,`beam`],q=[`rotate`,`beam`,`chase`],Mt=[`ring`,`glow`,`echo`],Nt={type:`beam`,trigger:`always`,badge:0,color:M,size:4,speed:3e3},J=`x-spin`,Y=`x-spin-on`,Pt=`x-spin-layer`,Ft=`x-spin-badge`,X=e=>`${J}-${e}`,Z=`x-spin-angle`,It=!1;function Q(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`}}var $=`padding:var(--x-spin-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`;function Lt(){if(It||typeof document>`u`)return;It=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spin`,``),e.textContent=`
@property --x-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${Z} { to { --x-spin-angle: 360deg; } }
:where(.${J}) { position: relative; }
.${J} {
  --x-spin-color: ${M};
  --x-spin-size: 4px;
  --x-spin-duration: 3000ms;
  --x-spin-badge-size: 8px;
}
.${J}.${Y}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* 色环载体（伪元素形态）：conic 渐变环带绕宿主边界匀速旋转——mask 挖出内环
     （padding = 环宽 size，content-box exclude），border-radius 继承贴合宿主圆角。
     渐变 background 不在本公共规则声明——三形态各自由下方规则直写（直接引用角度变量，
     经未注册变量中转的间接链在部分 Chromium 上不触发重绘），并保持置于 badge 规则之后：
     badge+spin 组合下 background 覆盖实底圆点，几何继承 badge 规则（色环画在角标圆内） */
  padding: var(--x-spin-size);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: ${Z} var(--x-spin-duration) linear infinite;
}
.${J}.${Ft}.${Y}::after {
  /* badge 徽标形态：载体缩为宿主右上角正圆（圆心恰在角点），实底圆点 + 色环画在角标圆内 */
  inset: auto;
  top: calc(-1 * var(--x-spin-badge-size) / 2);
  right: calc(-1 * var(--x-spin-badge-size) / 2);
  width: var(--x-spin-badge-size);
  height: var(--x-spin-badge-size);
  border-radius: 50%;
  background: var(--x-spin-color);
  z-index: 2147483647;
}
.${J}.${X(`rotate`)}.${Y}::after {
  background: ${Q(`rotate`)};
}
.${J}.${X(`beam`)}.${Y}::after {
  background: ${Q(`beam`)};
}
.${J}.${X(`chase`)}.${Y}::after {
  background: ${Q(`chase`)};
}
@media (prefers-reduced-motion: reduce) {
  .${J}.${Y}::after { animation: none; }
}`,document.head.appendChild(e)}function Rt(e,t){let n={...Nt};if(!e)return n;let r=L(e,q,t,`x-spin`);e.type!==void 0&&(q.includes(e.type)?r.add(e.type):t(`x-spin: type 取值非法（${JSON.stringify(e.type)}），已回退 "beam"`));let i=jt.find(e=>r.has(e));return i&&(n.type=i),R(e,Mt,`x-ripple`,t,`x-spin`),e.gap!==void 0&&t(`x-spin: gap 仅涟漪支持（x-spin 恒转无静止段），已忽略`),n.trigger=I(e,t,`x-spin`),n.badge=z(e,t,`x-spin`),n.color=tt(e.color,{color:M,badgeColor:$e},n.badge,t,`x-spin`),n.size=P(e,`size`,t,`x-spin`)??Nt.size,n.speed=F(e,t,`x-spin`),n}var zt={hostClass:J,activeClass:Y,layerClass:Pt,ensureStyles:Lt,normalize:Rt,hostClasses:e=>[X(e.type),...e.badge>0?[Ft]:[]],activeClasses:()=>[],animName:()=>Z,animationCss:(e,t)=>`${t} ${e.speed}ms linear infinite`,period:e=>e.speed,layerCount:()=>1,layerCssText:e=>e.badge>0?`${rt(e.badge)}${$}background:${Q(e.type)};`:`${nt()}${$}background:${Q(e.type)};`,applyVars:(e,t)=>{let n=e.style;n.setProperty(`--x-spin-color`,t.color||`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`),n.setProperty(`--x-spin-size`,`${t.size}px`),n.setProperty(`--x-spin-duration`,`${t.speed}ms`),t.badge>0&&n.setProperty(`--x-spin-badge-size`,`${t.badge}px`)}};function Bt(){st(ot(`spin`,zt))}Bt();var Vt=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层元素（插槽出口 span）上，经 :has() 选择器驱动宿主外观；原生 disabled 语义
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。
-->
<button class="asc-button" x-define="autospark.button">
  <script setup>
    {
        data: () => ({
            type: "default",
            size: "md",
            label: "按钮",
            disabled: false
        }),
        mounted() {
            // 原生 disabled 语义同步到宿主（化身后 this.el 即组件根）；
            // 后续 props 变化经 watch 保持同步
            this.el.disabled = !!this.data.disabled;
            this.watch("disabled", (v) => { this.el.disabled = !!v; });
        },
    }
  <\/script>
  <style global id="autospark-components-button">
    /* 主题化（ADR-0129）：三级样式回退链 var(--auto-X, var(--asc-button-X, 校准兜底值))；
         --asc-button-* 前缀保留（既有覆盖面零改名）；语义色底上的白字非映射（恒定设计）；
         暗色兜底变体见块尾 */
    .asc-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      border: 1px solid transparent;
      border-radius: var(--auto-border-radius, var(--asc-button-radius, 0.5rem));
      cursor: pointer;
      font: inherit;
      line-height: 1.4;
      padding: 0.375rem 0.875rem;
      font-size: 0.875rem;
      background: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(245, 245, 245, 0.45)));
      color: var(--auto-color, var(--asc-button-color, #606060));
      transition: filter 0.15s ease;
    }
    .asc-button:hover:not([disabled]) {
      filter: brightness(0.95);
    }
    .asc-button:active:not([disabled]) {
      filter: brightness(0.88);
    }
    .asc-button[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }
    /* type 外观变体（变体数据在内层出口元素上，经 :has() 驱动宿主） */
    .asc-button:has(> .asc-button-label[data-type="primary"]) {
      background: var(--auto-primary-color, var(--asc-button-primary-bg, #009aff));
      color: var(--asc-button-primary-color, #fff);
    }
    .asc-button:has(> .asc-button-label[data-type="success"]) {
      background: var(--auto-success-color, var(--asc-button-success-bg, #22c55e));
      color: var(--asc-button-success-color, #fff);
    }
    .asc-button:has(> .asc-button-label[data-type="danger"]) {
      background: var(--auto-danger-color, var(--asc-button-danger-bg, #ef4444));
      color: var(--asc-button-danger-color, #fff);
    }
    /* size 尺寸变体（md 即基础样式） */
    .asc-button:has(> .asc-button-label[data-size="sm"]) {
      padding: 0.125rem 0.625rem;
      font-size: 0.75rem;
    }
    .asc-button:has(> .asc-button-label[data-size="lg"]) {
      padding: 0.5rem 1.25rem;
      font-size: 1rem;
    }
    /* 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） */
    [dark] .asc-button,
    [data-dark] .asc-button {
      background: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(129, 129, 129, 0.45)));
      color: var(--auto-color, var(--asc-button-color, #fafafa));
    }
    [dark] .asc-button:has(> .asc-button-label[data-type="primary"]),
    [data-dark] .asc-button:has(> .asc-button-label[data-type="primary"]) {
      background: var(--auto-primary-color, var(--asc-button-primary-bg, #56baff));
    }
    [dark] .asc-button:has(> .asc-button-label[data-type="success"]),
    [data-dark] .asc-button:has(> .asc-button-label[data-type="success"]) {
      background: var(--auto-success-color, var(--asc-button-success-bg, #5cd07c));
    }
    [dark] .asc-button:has(> .asc-button-label[data-type="danger"]),
    [data-dark] .asc-button:has(> .asc-button-label[data-type="danger"]) {
      background: var(--auto-danger-color, var(--asc-button-danger-bg, #e6696a));
    }
  </style>
  <!-- 默认插槽出口：未提供内容时显示 {{ label }}（组件自身状态求值）；
         变体数据属性随出口元素承载（见文件头注释） -->
  <span class="asc-button-label" :data-type="type" :data-size="size" x-slot>{{ label }}</span>
</button>
`,Ht=`autospark.button`;function Ut(e){e.components[Ht]=Vt}Wt();function Wt(){O(e=>{h(e),Ut(e)})}};
    if (AutoSpark === undefined) {
        // 插件先于引擎加载（engine ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放
        var queue = (globalThis.__AUTOSPARK_PLUGINS__ ??= []);
        if (Object.isFrozen(queue)) {
            console.error("插件闭包: 预加载队列已消费且全局 AutoSpark 不可达，插件未注册");
            return;
        }
        queue.push(function (engine, ns) { run(ns); });
    } else {
        run(AutoSpark);
    }
})(globalThis.AutoSpark);

//# sourceMappingURL=autospark.plugins.js.map
