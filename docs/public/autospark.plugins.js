(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var e=`autospark.notifications.shell`;function t(e){return`autospark.notifications.${e}`}var n={NONE:0,INFO:1,SUCCESS:2,WARN:3,ERROR:4},r=[`none`,`info`,`success`,`warn`,`error`];function i(e){if(typeof e==`number`)return Number.isInteger(e)&&e>=0&&e<=4?e:null;if(typeof e==`string`){let t=r.indexOf(e);return t>=0?t:null}return null}function a(e){return r[e]??`none`}var o={NONE:0,SESSION:1,LOCAL:2,REMOTE:3},s=new Set([`top-left`,`top-center`,`top-right`,`bottom-left`,`bottom-center`,`bottom-right`,`center`]),c={info:`info`,success:`yes`,warn:`warn`,error:`error`},l=[`primary`,`success`,`warning`,`danger`,`plain`];function u(e){return l.includes(e)?e:void 0}var d={pos:`top-right`,delayClose:3e3,showCount:5,closeable:!0,animate:`slide`,level:0,persist:0},ee=new Set(`id.type.icon.title.description.delayClose.pos.offset.closeable.link.owner.level.read.status.result.persist.actions.anchor.progress.canStart.canPause.canCancel.canStop.closeWhenDone.animate.className.styles.width.height.minWidth.maxWidth.minHeight`.split(`.`));function f(e,t){let n=typeof e==`string`?{title:e}:e;return typeof n!=`object`||!n||Array.isArray(n)?(t(`engine.notifications.add: 入参须为通知字符串或配置对象，已忽略`),null):n}function p(e){return typeof e==`number`?`${e}px`:e}var te=`$notifications`,ne=null;function m(e){ne=e}function re(){return globalThis.AutoSpark??ne}function h(e){let t=re()?.[e];if(t==null)throw Error(`[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${e}"——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）`);return t}function ie(e,t){return h(`shallow`)(e,t)}function ae(e){if(e==null||e===!1||e===``)return{enter:null,leave:null};if(typeof e==`string`){let t={name:e};return{enter:t,leave:{...t}}}if(typeof e!=`object`)return{enter:null,leave:null};let t=e,n={};return t.name!=null&&(n.name=String(t.name)),t.duration!=null&&(n.duration=Number(t.duration)),t.delay!=null&&(n.delay=Number(t.delay)),t.easing!=null&&(n.easing=String(t.easing)),{enter:oe(t.enter,n),leave:oe(t.leave,n)}}function oe(e,t){if(e===!1)return null;let n=t.name,{duration:r,delay:i,easing:a}=t;if(typeof e==`string`)n=e;else if(typeof e==`object`){let t=e;t.name!=null&&(n=String(t.name)),t.duration!=null&&(r=Number(t.duration)),t.delay!=null&&(i=Number(t.delay)),t.easing!=null&&(a=String(t.easing))}if(n==null)return null;let o={name:n};return r!=null&&(o.duration=r),i!=null&&(o.delay=i),a!=null&&(o.easing=a),o}function se(e){return h(`getOverlayContainer`)(e)}function ce(e,t){if(globalThis.document===void 0)return;let{id:n,mode:r=`default`,location:i=`head`,el:a}=t??{},o=()=>typeof e==`function`?e():e,s=le(n,a);if(!s){let e=document.createElement(`style`);return n&&(e.id=n),e.textContent=o(),a?a.appendChild(e):i==`body`?document.body.appendChild(e):document.head.appendChild(e),e}if(r==`replace`)s.textContent=o();else if(r==`patch`){let e=o();s.textContent!==e&&(s.textContent=e)}else r==`append`&&(s.textContent+=o());return s}function le(e,t){if(!e)return null;let n=e.replace(/["\\]/g,`\\$&`),r=t?.querySelector(`[id="${n}"]`)??document.getElementById(e);return r?.tagName===`STYLE`?r:null}var ue=`autospark-notification-column-styles`,de=`
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
`;function fe(){ce(de,{id:ue})}var g=new WeakMap,pe=`autospark-notifications`,me=`data-autospark-notifications`,he=`data-notification-pos`;function ge(e){if(typeof document>`u`||!document.body)return null;let t=g.get(e);if(!t){let n=se(e);if(!n)return null;t=document.createElement(`div`),t.className=pe,t.setAttribute(me,``),n.appendChild(t),g.set(e,t),fe()}return t}function _e(e,t,n){let r=ge(e);if(!r)return null;let i=r.querySelector(`:scope > [${he}="${t}"]`);return i||(i=document.createElement(`div`),i.className=`autospark-notification-column`,i.setAttribute(he,t),n!=null&&i.style.setProperty(`--autospark-notification-inset`,p(n)),r.appendChild(i)),i}function ve(e){let t=g.get(e);t&&(t.remove(),g.delete(e))}var ye=class{constructor(e){this.manager=e}get _state(){return this.manager._stateRef}createEntry(e,t,n){let r=this.manager._resolveAnchor(e.anchor),i=Date.now();return{id:t,type:n,record:{id:t,type:n,read:e.read===!0,title:e.title,description:e.description,level:e.level,owner:e.owner,status:e.status,result:e.result,link:e.link,createAt:i,updateAt:i},props:e,icon:this.manager._resolveIcon(e.level,e.icon),actions:this.manager._resolveActions(e.actions,r),state:`queued`,instance:null,scope:null,el:null,anchor:r,confirmResolve:null,timer:null,tickTimer:null,deadline:null,pausedRemaining:null,leave:null,clickHandler:null,enterHandler:null,leaveHandler:null,controlOffs:[],startEmitted:!1,appliedClassName:``,appliedStyles:``}}touch(e){e.record.updateAt=Date.now()}mirrorAdd(e){let t=this._state?.items;t&&t.push({...e.record})}mirrorReplace(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e.id);n>=0&&t.splice(n,1,{...e.record})}mirrorRemove(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e);n>=0&&t.splice(n,1)}evictOverflow(e){let t=this.manager._maxLen;if(t<=0)return;let n=this.manager;for(;n.size>t;){let t=null;for(let r of n.keys()){let i=n._entryOf(r);i&&i!==e&&(t==null||i.record.createAt<t.record.createAt)&&(t=i)}if(!t)break;n._destroyEntry(t)}}restoreRecords(e,t){let n=this.manager,r=[];for(let i of e){if(typeof i!=`object`||!i)continue;let e={...i,persist:t===`local`?o.LOCAL:o.REMOTE},a=e.id!=null&&e.id!==``?String(e.id):`notification-${++n._autoId}`,s=Number(i.createAt),c=Number(i.updateAt),l=Number.isFinite(s)&&s>0?s:Date.now(),u=Number.isFinite(c)&&c>0?c:l,d=n._entryOf(a);if(d){let t=n._mergeProps({...e,id:a}).merged;n._applyEntryConfig(d,t),d.record.createAt=l,d.record.updateAt=u,r.push(d.instance);continue}let{merged:ee,type:f}=n._mergeProps({...e,id:a});n._settleLevel(ee);let p=this.createEntry(ee,a,f);p.record.createAt=l,p.record.updateAt=u,n._materialize(p)&&(p.state=`hidden`,p.instance&&(p.instance.data.closed=!0),r.push(p.instance))}return r}},be=class{constructor(e,t){this.manager=e,this.pos=t,this.waiting=[],this.shown=new Set}get _showCount(){return this.manager._showCount}offer(e){e.state===`shown`?this.shown.add(e.id):this.shown.size<this._showCount?(this.shown.add(e.id),this.manager._showEntry(e)):this.waiting.push(e)}remove(e){let t=this.waiting.indexOf(e);t>=0&&this.waiting.splice(t,1)}releaseShown(e){this.shown.delete(e)}flush(){for(;this.waiting.length&&this.shown.size<this._showCount;){let e=this.waiting.shift();this.shown.add(e.id),this.manager._showEntry(e)}}clear(){this.waiting.length=0}},xe=`autospark-notifications`;function Se(e){return{...e.record}}function Ce(e,t){if(typeof localStorage<`u`)try{localStorage.setItem(xe,JSON.stringify(e))}catch(e){t(`engine.notifications: local 持久化写入失败，已忽略: ${e?.message??e}`)}}function we(e){if(typeof localStorage>`u`)return[];try{let t=localStorage.getItem(xe);if(!t)return[];let n=JSON.parse(t);return Array.isArray(n)?n.filter(e=>e&&typeof e==`object`&&!Array.isArray(e)):(e(`engine.notifications: local 持久化数据格式异常（非数组），已忽略`),[])}catch(t){return e(`engine.notifications: local 持久化读取失败，已忽略: ${t?.message??t}`),[]}}var Te=class{constructor(e,t){this.getFetchOptions=e,this.warn=t,this.timer=null,this.pending=null}schedule(e){this.pending=e,this.timer!=null&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null;let e=this.pending;this.pending=null,e&&this.flush(e)},500)}async flush(e,t=!1){this.timer!=null&&(clearTimeout(this.timer),this.timer=null,this.pending=null);let n=this.getFetchOptions();if(typeof fetch<`u`&&n?.url)try{let{url:r,...i}=n,a=await fetch(r,{...i,method:`POST`,headers:{"Content-Type":`application/json`,...i.headers},body:JSON.stringify(e),keepalive:t});a.ok||this.warn(`engine.notifications: remote 持久化失败（HTTP ${a.status}），已忽略`)}catch(e){this.warn(`engine.notifications: remote 持久化失败，已忽略: ${e?.message??e}`)}}cancel(){this.timer!=null&&(clearTimeout(this.timer),this.timer=null),this.pending=null}},Ee=class{constructor(e){this.manager=e,this.remote=new Te(()=>this.manager._stateRef?.options.fetchOptions??null,e=>this.manager.engine.logger.warn(e))}collect(){let e=[],t=[];for(let n of Array.from(this.manager.keys())){let r=this.manager._entryOf(n);if(!r)continue;let i=Se(r);r.props.persist===o.LOCAL?e.push(i):r.props.persist===o.REMOTE&&t.push(i)}return{locals:e,remotes:t}}schedule(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();Ce(e,e=>this.manager.engine.logger.warn(e)),this.remote.schedule(t)}flushNow(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();Ce(e,e=>this.manager.engine.logger.warn(e)),this.remote.flush(t,!0)}async save(){let{locals:e,remotes:t}=this.collect();Ce(e,e=>this.manager.engine.logger.warn(e)),await this.remote.flush(t)}async load(e){let t=this.manager._stateRef?.options.fetchOptions??null,n=e??t?.url;if(!n||typeof fetch>`u`)return this.manager.engine.logger.warn(`engine.notifications: load 缺少 url（参数与 options.notifications.fetchOptions.url 均未配置），已跳过`),[];try{let e=t?{...t}:{};delete e.url;let r=await fetch(n,e);if(!r.ok)return this.manager.engine.logger.warn(`engine.notifications: load 失败（HTTP ${r.status}），已忽略`),[];let i=await r.json();if(!Array.isArray(i))return this.manager.engine.logger.warn(`engine.notifications: load 响应体格式异常（非数组），已忽略`),[];let a=this.manager.records.restoreRecords(i,`remote`);return this.schedule(),a}catch(e){return this.manager.engine.logger.warn(`engine.notifications: load 失败，已忽略: ${e?.message??e}`),[]}}cancelPending(){this.remote.cancel()}};function De(e){return h(`markRaw`)(e)}function Oe(){return h(`SCOPES_KEY`)}function ke(e){for(let t of Array.from(e.attributes)){let e=t.name;if(e===`x-define:inherit`||e.startsWith(`x-define:inherit.`)||e===`x-define:extends`||e.startsWith(`x-define:extends.`))return(t.value??``).trim()}return null}var Ae=[`width`,`height`,`minWidth`,`maxWidth`,`minHeight`];function je(t,n){let r=t.engine,i=t=>{let n=r._resolveGlobalComponent(t);if(!n||t!==`autospark.notifications.shell`&&ke(n)===null&&(n.setAttribute(`x-define:inherit`,e),r._globalComponentDefs.delete(t),n=r._resolveGlobalComponent(t),!n))return null;let i=r.getComponentDef(n)??r.getGlobalComponentDef(t)??null;return{name:t,snapshot:n,def:i}},a=t._options.types?.[n]?.render?.trim()??``;if(a!==``){let e=i(a);if(e)return e}return i(`autospark.notifications.${n}`)??i(`autospark.notifications.shell`)??null}function Me(e,t){if(!t)return null;let n=t;for(;n;){let t=e.engine.findScopeByEl(n);if(t)return t;n=n.parentElement}return null}function Ne(e,t){let n={};for(let[e,r]of Object.entries(t.props))typeof r!=`function`&&(typeof HTMLElement<`u`&&r instanceof HTMLElement||e!==`progress`&&e!==`state`&&e!==`paused`&&e!==`completed`&&(n[e]=r));let r=t.record;return n.id=r.id,n.type=r.type,n.read=r.read,n.title=r.title,n.description=r.description,n.level=r.level,n.owner=r.owner,n.status=r.status,n.result=r.result,n.link=r.link,n.icon=t.icon,n.actions=t.actions,n.levelName=a(r.level??0),(t.type===`task`||t.props.canCancel===!0)&&(n._abort=t.instance?.data?._abort??De(new AbortController)),t.type===`task`&&(n.state=t.instance?.data?.state??(t.props.canStart===!0?`pending`:`running`)),n}function Pe(e,t){for(let n of Ae){let r=t[n],i=n.replace(/[A-Z]/g,e=>`-`+e.toLowerCase());r==null||r===``||r===`auto`?e.style.removeProperty(i):e.style.setProperty(i,p(r))}}function Fe(e,t){let n=_e(e.engine,t.props.pos,t.props.offset);if(!n)return!1;let r=e.engine,i=Me(e,t.anchor),a=je(e,t.type),o=Ne(e,t);if(!a)return r.logger.warn(`engine.notifications: type "${t.type}" 无可用渲染组件（render 链与 shell 兜底均未命中），已跳过装配`),!1;let s=r.compiler.instantiateDetachedComponent(a.snapshot.cloneNode(!0),i,a.def,o),c=s.el;t.scope=s.scope,t.instance=new(h(`ComponentInstance`))(s.scope),Le(t.instance,a.def),t.el=c,c.style.display=`none`,c.setAttribute(he,t.props.pos),t.props.className&&(c.classList.add(...String(t.props.className).trim().split(/\s+/)),t.appliedClassName=String(t.props.className)),t.props.styles&&(c.style.cssText=String(t.props.styles),t.appliedStyles=String(t.props.styles)),Pe(c,t.props),t.clickHandler=n=>e._onCardClick(t,n),t.enterHandler=()=>e._pauseTimer(t),t.leaveHandler=()=>e._resumeTimer(t),c.addEventListener(`click`,t.clickHandler),c.addEventListener(`mouseenter`,t.enterHandler),c.addEventListener(`mouseleave`,t.leaveHandler),n.appendChild(c),t.leave=ae(t.props.animate).leave,Ie(e,t);let l=t.props.progress;return l!=null&&(t.instance?.data.progress??0)===0&&t.instance&&t.instance.methods.progress?.(Number(l)),!0}function Ie(e,t){let n=t.instance?.scope;if(!n)return;let r=e.engine,i=`${Oe()}.${n.id}`,a=()=>t.instance?.data,o=a()?.holdOpen,s=r.store.watch(`${i}.holdOpen`,()=>{let n=a()?.holdOpen;n!==o&&(o=n,n===!0?e._clearTimer(t):t.state===`shown`&&e._startTimer(t))});t.controlOffs.push(()=>s.off());for(let n of[`progress`,`state`]){let o=a()?.[n],s=r.store.watch(`${i}.${n}`,()=>{let r=a()?.[n];r!==o&&(o=r,e._emit(`update`,t))});t.controlOffs.push(()=>s.off())}}function Le(e,t){let n=new Set([`el`,`name`,`data`,`props`,`globalState`,`methods`,`super`,`scope`,`then`]);for(let t of[`id`,`type`,`read`,`closed`,`status`,`result`,`visible`,`remaining`])Object.defineProperty(e,t,{get:()=>e.data[t],configurable:!0});Object.defineProperty(e,"abortSignal",{get:()=>e.data?._abort?.signal,configurable:!0});let r=t?.setup?.methods;if(!r)return;let i=new Set(n);i.add(`id`),i.add(`type`),i.add(`read`),i.add(`closed`),i.add(`status`),i.add(`result`),i.add(`visible`),i.add(`remaining`),i.add(`abortSignal`);for(let t of Object.keys(r))i.has(t)||Object.defineProperty(e,t,{get:function(){return e.methods[t]},configurable:!0})}function Re(e,t){let n=t.el;n&&(t.clickHandler&&n.removeEventListener(`click`,t.clickHandler),t.enterHandler&&n.removeEventListener(`mouseenter`,t.enterHandler),t.leaveHandler&&n.removeEventListener(`mouseleave`,t.leaveHandler),n.remove());for(let e of t.controlOffs.splice(0))try{e()}catch{}let r=t.instance;t.el=null,t.instance=null;let i=t.scope;t.scope=null,i&&i.destroy(),r&&ze(e,r)}function ze(e,t){let n=t=>e.engine.logger.warn(`engine.notifications: 组件实例已销毁（记录已 remove），${t}() 无效（ADR-0083 死会话语义沿用）`);Object.defineProperty(t,"closed",{get:()=>!0,configurable:!0}),Object.defineProperty(t,"visible",{get:()=>!1,configurable:!0});for(let e of Object.getOwnPropertyNames(t)){let r=Object.getOwnPropertyDescriptor(t,e);r?.get&&r.get.name===`flattenMethod`&&Object.defineProperty(t,e,{get(){return n(e),()=>{}},configurable:!0})}}var Be=new Set([`showCount`,`maxLen`,`fetchOptions`,`icons`,`shell`,`shallow`,`types`]);function Ve(e,t){let{opts:n,frozen:r,typeDefaults:i,warn:a}=t,o=String(e.type??n.type??`toast`),s=n.types?.[o];if(s)for(let e of Object.keys(s))Be.has(e)&&a(`engine.notifications: types.${o} 不允许管理器级键 "${e}"，已忽略`);let c={...d},l=i?.[o];l&&Object.assign(c,l);for(let e of ee)e!==`id`&&e in n&&(c[e]=n[e]),e!==`id`&&(e===`anchor`||e===`actions`)&&r[e]!==void 0&&(c[e]=r[e]),e!==`id`&&s&&e in s&&(c[e]=s[e]);return Object.assign(c,e),{merged:c,type:o}}function He(e,t){let r=i(e.level);r==null?(t(`engine.notifications: 未知 level "${e.level}"（0~4 或 none/info/success/warn/error，ADR-0079），已回退 ${n.NONE}`),e.level=n.NONE):e.level=r}function _(e,t){s.has(e.pos)||(t(`engine.notifications: 未知 pos "${e.pos}"，已回退 "${d.pos}"`),e.pos=d.pos)}function Ue(e,t){e.persist!=null&&![0,1,2,3].includes(e.persist)&&(t(`engine.notifications: 未知 persist "${e.persist}"（0|1|2|3，ADR-0077），已回退 ${o.NONE}`),e.persist=o.NONE)}function We(e){return String(e??``).replace(/[/]/g,`-`).replace(/\*/g,`-`)}function v(e,t,n){return`notifications/${We(e)}/${We(t)}/${n}`}function Ge(e,n){let r=t(n),i=e._resolveGlobalComponent(r);if(i)return(e.getComponentDef(i)??e.getGlobalComponentDef(r)??null)?.defaults}var Ke=class extends Map{_entryOf(e){return this._entries.get(e)}get _stateRef(){return this._state}get _options(){return this._state.options}constructor(e){super(),this.PERSIST=o,this._entries=new Map,this._state=null,this._frozen={},this._autoId=0,this._queues=new Map,this._typeDefaultsCache=new Map,this._typeDefaults=new Proxy({},{get:(e,t)=>{if(typeof t==`string`)return this._typeDefaultsCache.has(t)||this._typeDefaultsCache.set(t,Ge(this.engine,t)),this._typeDefaultsCache.get(t)}}),this.engine=e;let t=e.options.notifications;this.enabled=t!==!1;let n=t===!1||t==null?{}:t;if(this._frozen={anchor:n.anchor,actions:n.actions},this.records=new ye(this),this.storage=new Ee(this),!this.enabled)return;let r={};for(let e of Object.keys(n))e!==`anchor`&&e!==`actions`&&(r[e]=n[e]);for(let e of Object.keys(d))r[e]===void 0&&(r[e]=d[e]);let i=Number(r.shallow)===0?0:1;e.store.state[te]={items:ie([],i),options:r},this._state=e.store.state[te],this.records.restoreRecords(we(e=>this.engine.logger.warn(e)),`local`)}add(e,t){if(!this.enabled)return this.engine.logger.warn(`engine.notifications: 通知特性已通过 options.notifications: false 关闭，调用被忽略`),null;if(typeof e==`function`)return this._addAsync(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: add(..., ${typeof t==`string`?`"${t}"`:`props`}) 第二参仅对 factory 形态生效（对象形态请用 type 字段），已忽略`);let n=f(e,e=>this.engine.logger.warn(e));return n?this._enqueueProps(n):null}_addAsync(e,t){let n=typeof t==`object`&&t?t:{},r=t==null?`toast`:typeof t==`string`?String(t).trim()||`toast`:String(n.type??``).trim()||`toast`,{merged:i,type:a}=this._mergeProps({...n,type:r});_(i,e=>this.engine.logger.warn(e)),this._settleLevel(i),Ue(i,e=>this.engine.logger.warn(e));let o=i.id!=null&&i.id!==``?String(i.id):`notification-${++this._autoId}`;i.id=o,i.type=a;let s=this.records.createEntry(i,o,a);if(!this._materialize(s))return null;let c=s.instance;return(async()=>{try{let t=await e(c);if(!this._entries.has(o)||s.state===`closed`)return;if(t==null){this._destroyEntry(s);return}let n=f(t,e=>this.engine.logger.warn(e));if(!n||!String(n.title??``).trim()){this.engine.logger.warn(`engine.notifications: factory 结果缺少 title（空通知），已销毁`),this._destroyEntry(s);return}n.type!=null&&String(n.type)!==r&&(this.engine.logger.warn(`engine.notifications: factory 声明 type "${r}" 与 return props type "${n.type}" 不一致，以声明为准（类型不可变）`),n.type=r);let i=this._mergeProps({...n,id:o,type:r}).merged;this._applyEntryConfig(s,i),s.state=`queued`,this._emit(`add`,s),this._displayEntry(s),this.storage.schedule()}catch(e){this.engine.logger.warn(`engine.notifications: factory 执行失败，已销毁: ${e?.message??e}`),this._destroyEntry(s)}})(),c}_materialize(e){return Fe(this,e)?(this._bindChoice(e),this._entries.set(e.id,e),super.set(e.id,e.instance),this.records.mirrorAdd(e),this.records.evictOverflow(e),!0):!1}_bindChoice(e){if(e.type!==`confirm`||!e.instance)return;let t=new Promise(t=>{e.confirmResolve=t});Object.defineProperty(e.instance,"then",{value:t.then.bind(t),configurable:!0})}_mergeCtx(){return{opts:this.enabled?this._options:{},frozen:this._frozen,typeDefaults:this._typeDefaults,warn:e=>this.engine.logger.warn(e)}}_mergeProps(e){return Ve(e,this._mergeCtx())}_settleLevel(e){He(e,e=>this.engine.logger.warn(e))}_enqueueProps(e){if(!String(e.title??``).trim())return this.engine.logger.warn(`engine.notifications: title 为空，调用被忽略`),null;let{merged:t,type:n}=this._mergeProps(e);_(t,e=>this.engine.logger.warn(e)),this._settleLevel(t),Ue(t,e=>this.engine.logger.warn(e));let r=t.id!=null&&t.id!==``?String(t.id):`notification-${++this._autoId}`;t.id=r,t.type=n;let i=this._entries.get(r);if(i){if(i.state===`shown`||i.state===`queued`)return this._updateInPlace(i,e),this.get(r)??null;let n=this._mergeProps({...t,id:r}).merged;return this._applyEntryConfig(i,n),i.state=`queued`,this._displayEntry(i),this.storage.schedule(),this.get(r)??null}let a=this.records.createEntry(t,r,n);return this._materialize(a)?(this._emit(`add`,a),this._displayEntry(a),this.storage.schedule(),a.instance):null}get _showCount(){let e=this._state?.options.showCount??d.showCount;return typeof e==`number`&&e>0?Math.floor(e):d.showCount}get _maxLen(){let e=this._state?.options.maxLen;return typeof e==`number`&&e>0?Math.floor(e):0}_resolveIcon(e,t){if(t)return t;if(e===0)return``;let n=a(e);return this._options.icons?.[n]??c[n]??n}_resolveAnchor(e){return e==null?null:e instanceof HTMLElement?e:typeof e==`string`?(typeof document<`u`?document.querySelector(e):null)||(this.engine.logger.warn(`engine.notifications: anchor 选择器 "${e}" 未命中，按无 anchor 处理`),null):null}_resolveActions(e,t){let n=[],r=(e,t)=>{let n=u(e?.type);return e?.type!==void 0&&n===void 0&&this.engine.logger.warn(`engine.notifications: action "${t}" 的 type 须为 ${l.join(`/`)}，已忽略（按钮色回退跟随 level）`),n};for(let i of e??[])if(typeof i==`string`){let e=this._resolveActionByName(i,t);if(!e){this.engine.logger.warn(`engine.notifications: action "${i}" 未命中（全局表${t?`与 anchor scope 链`:``}），按钮已剪枝`);continue}n.push({name:i,title:e.title??i,handle:e.handle,hide:e.hide!==!1,hasValue:!1,value:void 0,type:r(e,i)})}else if(i&&typeof i==`object`){let e=`value`in i;n.push({name:String(i.id??i.title??`action`),title:i.title??`action`,handle:typeof i.handle==`function`?i.handle:null,hide:i.hide!==!1,hasValue:e,value:i.value,type:r(i,String(i.title??`action`))})}else this.engine.logger.warn(`engine.notifications: 非法 action 项，已剪枝`);return n}_resolveActionByName(e,t){if(t){let n=t;for(;n;){let t=this.engine.findScopeByEl(n)?.getAction(e);if(t)return t;n=n.parentElement}}return this.engine.actions[e]}_updateInPlace(e,t){`type`in t&&String(t.type)!==e.type&&this.engine.logger.warn(`engine.notifications: 同 id 更新不支持变更 type，已忽略`);let n={...e.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(n[e]=t[e]);_(n,e=>this.engine.logger.warn(e)),this._applyEntryConfig(e,n),e.state===`shown`&&this._startTimer(e),this._emit(`update`,e),this.storage.schedule()}_applyEntryConfig(e,t){let n=e.appliedClassName,r=e.appliedStyles;this._settleLevel(t),e.props=t;for(let n of[`title`,`description`,`owner`,`status`,`result`,`link`,`read`])n in t&&(e.record[n]=t[n]);e.record.level=t.level,this.records.touch(e),e.icon=this._resolveIcon(e.record.level??0,t.icon),e.actions=this._resolveActions(t.actions,e.anchor);let i=Ne(this,e);e.instance&&Object.assign(e.instance.data,i),t.progress!=null&&e.instance&&e.instance.methods.progress?.(Number(t.progress));let a=t.className?String(t.className).trim():``,o=t.styles?String(t.styles):``;e.el&&(n&&e.el.classList.remove(...n.split(/\s+/)),a&&e.el.classList.add(...a.split(/\s+/)),o!==r&&(e.el.style.cssText=o),Pe(e.el,t)),e.appliedClassName=a,e.appliedStyles=o,this.records.mirrorReplace(e)}update(e,t){let n=this._entries.get(e);if(!n||!this._entries.has(e)){this.engine.logger.warn(`engine.notifications: update("${e}") 未命中存活记录，已忽略`);return}f(t,e=>this.engine.logger.warn(e)),`type`in t&&String(t.type)!==n.type&&this.engine.logger.warn(`engine.notifications: update 不支持修改 type，已忽略`);let r=n.props.read===!0,i=n.props.status,a={...n.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(a[e]=t[e]);_(a,e=>this.engine.logger.warn(e)),this._applyEntryConfig(n,a),this._emit(`update`,n),!r&&n.props.read===!0&&this._emit(`read`,n),n.props.status!==i&&this._emit(`status`,n),this.storage.schedule()}_setRead(e){e.props.read!==!0&&(e.props.read=!0,e.record.read=!0,this.records.touch(e),e.instance&&(e.instance.data.read=!0),this.records.mirrorReplace(e),this._emit(`read`,e),this.storage.schedule())}markRead(e){let t=this._entries.get(e);t?this._setRead(t):this.engine.logger.warn(`engine.notifications: markRead("${e}") 未命中存活记录，已忽略`)}markAllRead(e){for(let t of Array.from(this._entries.values()))t.props.read!==!0&&(e==null||t.type===e)&&this._setRead(t)}_queueOf(e){let t=this._queues.get(e);return t||(t=new be(this,e),this._queues.set(e,t)),t}_displayEntry(e){this._queueOf(e.props.pos).offer(e)}_showEntry(e){e.state!==`shown`&&(e.el&&(e.el.style.display=``),e.state=`shown`,e.instance&&(e.instance.data.visible=!0,e.instance.data.closed=!1),e.el&&this.engine.animate.enter(e.el,ae(e.props.animate).enter),this._startTimer(e),this._emit(`show`,e),this._emitTaskAutoStart(e))}_dequeue(e){this._queues.get(e.props.pos)?.remove(e)}_flushQueue(e){this._queueOf(e).flush()}show(e,t){if(typeof e!=`string`)return this.add(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: show("${e}", ...) 第二参仅对 factory 形态生效，已忽略`);let n=this._entries.get(e);return!n||n.state===`closed`?(this.engine.logger.warn(`engine.notifications: show("${e}") 未命中存活记录（persist=0 的已关通知已销毁）`),null):(n.state===`shown`||n.state===`queued`||(n.state=`queued`,this._displayEntry(n)),this.get(e)??null)}hide(e){let t=this._entries.get(e);t&&t.state!==`closed`&&t.state!==`hidden`&&this._dismiss(t,!0)}toast(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`toast`}},`toast`);let t={...typeof e==`string`?{title:e}:e,type:`toast`};return this.show(t)}confirm(e,t){let n=typeof e==`string`?{title:e}:{...e},r=t?.yes??n.yes,i=t?.no??n.no;return delete n.yes,delete n.no,this.show({...n,type:`confirm`,delayClose:n.delayClose??0,actions:(n.actions?.length?n.actions:void 0)??[{title:r??`确定`,value:!0,type:`primary`},{title:i??`取消`,value:!1,type:`plain`}]})}task(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`task`}},`task`);let t={...typeof e==`string`?{title:e}:e,type:`task`};return this.show(t)}_dismiss(e,t){if(e.state===`closed`||e.state===`hidden`)return;e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.instance&&(e.instance.data.visible=!1),this._emit(`hide`,e);let n=()=>this._settleClose(e),r=t?e.leave:null,i=e.el;r&&i&&i.style.display!==`none`?(i.style.boxSizing=`border-box`,i.style.height=`${i.offsetHeight}px`,i.style.overflow=`hidden`,this.engine.animate.leave(i,r,n)?(i.style.transitionProperty=`transform, opacity, height, padding-top, padding-bottom, margin-bottom, border-top-width, border-bottom-width`,i.style.height=`0px`,i.style.paddingTop=`0px`,i.style.paddingBottom=`0px`,i.style.marginBottom=`-10px`,i.style.borderTopWidth=`0px`,i.style.borderBottomWidth=`0px`):n()):n()}_settleClose(e){let t=Number(e.props.persist??o.NONE);this._queueOf(e.props.pos).releaseShown(e.id),t>=o.SESSION&&t<=o.REMOTE?(e.state=`hidden`,e.el&&(e.el.style.display=`none`),e.instance&&(e.instance.data.closed=!0,e.instance.data.visible=!1)):this._destroyEntry(e),this._flushQueue(e.props.pos),this.storage.schedule()}_destroyEntry(e){e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.confirmResolve=null,Re(this,e),this._entries.delete(e.id),super.delete(e.id),this.records.mirrorRemove(e.id),this._queueOf(e.props.pos).releaseShown(e.id)}delete(e){let t=this._entries.get(e);return t?((t.state===`shown`||t.state===`queued`)&&this._emit(`hide`,t),this._destroyEntry(t),this._flushQueue(t.props.pos),this.storage.flushNow(),!0):!1}clear(e=!0){for(let e of this._queues.values())e.clear();for(let t of Array.from(this._entries.values()))t.state===`shown`||t.state===`queued`?this._dismiss(t,e):this._destroyEntry(t);this._state&&this._state.items.splice(0),this.storage.flushNow()}dispose(){this.storage.flushNow();for(let e of this._queues.values())e.clear();for(let e of Array.from(this._entries.values()))(e.state===`shown`||e.state===`queued`||e.state===`hidden`)&&this._destroyEntry(e);ve(this.engine),this._state&&this._state.items.splice(0)}async load(e){return this.storage.load(e)}async save(){await this.storage.save()}_onCardClick(e,t){this._setRead(e);let n=t.target,r=n?.closest?.(`.autospark-notification-action`);if(r){let t=Number(r.getAttribute(`data-notification-action`)),n=e.actions[Number.isInteger(t)?t:-1];n&&this._fireAction(e,n)}else if(n?.closest?.(`.autospark-notification-close`)){let t=e.instance?.methods??{},n=typeof t.close==`function`?t.close:typeof t.cancel==`function`?t.cancel:null;typeof n==`function`?n():this._dismiss(e,!0)}}_fireAction(e,t){t.hasValue&&(e.props.result=t.value,e.record.result=t.value,this.records.touch(e),e.instance&&(e.instance.data.result=t.value),this.records.mirrorReplace(e)),this._emitAction(e,t),e.confirmResolve&&=(e.confirmResolve(t.hasValue?t.value:void 0),null),t.handle?.(),this.storage.schedule(),t.hide&&this._dismiss(e,!0)}_fireConfirmChoice(e,t){let n=e.actions.find(e=>e.hasValue&&e.value===t);n?this._fireAction(e,n):this.engine.logger.warn(`engine.notifications: type='confirm' 会话缺少 value=${t} 的按钮（actions 已被自定义），选择无效（ADR-0077）`)}respond(e,t){let n=this._entries.get(e);n?this._fireConfirmChoice(n,t):this.engine.logger.warn(`engine.notifications: respond("${e}") 未命中存活记录，已忽略`)}_emitControlAction(e,t){let n=this._entries.get(e);if(!n)return;let r=v(n.type,n.props.id,`actions/${t}`),i={notification:n.instance,el:n.el};this.engine.emit(r,i),n.el?.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0})),n.anchor&&n.anchor.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0}))}_onControlAction(e,t,n){let r=this._entries.get(e),i=v(r?.type??`task`,e,`actions/${t}`),a=this.engine.on(i,n),o=()=>a.off();return r&&r.controlOffs.push(o),o}_emitTaskAutoStart(e){if(e.type!==`task`||e.startEmitted||e.props.canStart===!0)return;let t=e.instance?.data?.state;t!==`stopped`&&t!==`completed`&&(e.startEmitted=!0,this._emitControlAction(e.props.id,`start`))}_emit(e,t){let n=v(t.type,t.props.id,e),r={notification:t.instance,el:t.el};this.engine.emit(n,r),t.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_emitAction(e,t){let n=v(e.type,e.props.id,`actions/${t.name}`),r={notification:e.instance,el:e.el,action:{title:t.title,hide:t.hide},value:t.hasValue?t.value:void 0};this.engine.emit(n,r),e.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0})),e.anchor&&e.anchor.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_startTimer(e){if(this._clearTimer(e),e.instance?.data.holdOpen===!0)return;let t=e.props.delayClose;typeof t==`number`&&t>0?(e.deadline=Date.now()+t,e.pausedRemaining=null,e.instance&&(e.instance.data.remaining=t),e.tickTimer=setInterval(()=>{e.deadline!=null&&e.instance&&(e.instance.data.remaining=Math.max(0,e.deadline-Date.now()))},1e3),e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)):(e.deadline=null,e.instance&&(e.instance.data.remaining=-1))}_pauseTimer(e){e.timer!=null&&e.deadline!=null&&(clearTimeout(e.timer),e.timer=null,e.pausedRemaining=Math.max(0,e.deadline-Date.now()))}_resumeTimer(e){if(e.pausedRemaining==null||e.state!==`shown`)return;let t=e.pausedRemaining;e.pausedRemaining=null,e.deadline=Date.now()+t,e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)}_clearTimer(e){e.timer!=null&&(clearTimeout(e.timer),e.timer=null),e.tickTimer!=null&&(clearInterval(e.tickTimer),e.tickTimer=null),e.pausedRemaining=null}},qe=`ready`,Je=`__AUTOSPARK_PLUGINS__`;function y(e){let t=globalThis.AutoSpark;if(typeof t?.[qe]==`function`){e(t);return}let n=globalThis,r=n[Je]??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var Ye=`<div\r
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
`,Xe=`<div x-define="autospark.notifications.toast" x-define:inherit="autospark.notifications.shell"></div>\r
`,Ze=`<div x-define="autospark.notifications.task" x-define:inherit="autospark.notifications.shell">\r
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
`,Qe=`<div x-define="autospark.notifications.confirm" x-define:inherit="autospark.notifications.shell">\r
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
`,$e={[e]:Ye,[t(`toast`)]:Xe,[t(`task`)]:Ze,[t(`confirm`)]:Qe};function et(e){let t=e?.el;return t instanceof HTMLElement?t:null}function tt(e){return{title:`提示`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type??=`toast`,n.anchor??=et(this)??void 0,e.notifications.add(n)}}}function nt(e){return{title:`确认`,handle:function(t){let{yes:n,no:r,...i}=typeof t==`string`?{title:t}:{...t??{}};return i.anchor??=et(this)??void 0,e.notifications.show({...i,type:`confirm`,delayClose:i.delayClose??0,actions:[{title:n??`确定`,value:!0,type:`primary`},{title:r??`取消`,value:!1,type:`plain`}]})}}}function rt(e){return{title:`任务`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type=`task`,n.anchor??=et(this)??void 0,e.notifications.show(n)}}}var it={toast:tt,confirm:nt,task:rt};function at(e){let t=e.options.builtinComponents??(e.options.builtinComponents={});for(let[e,n]of Object.entries($e))t[e]??(t[e]=n)}function ot(e){at(e);let t=new Ke(e);e.notifications=t;for(let[t,n]of Object.entries(it))t in e.actions||(e.actions[t]=n(e));e.on(`engine/destroy/before`,()=>t.dispose())}function st(){y(e=>{m(e),e.ready(ot)})}st();var ct=class extends Error{constructor(e,t,n,r){super(e),this.name=`ResourceError`,this.status=t,this.url=n,this.method=r}};function b(e={}){let{where:t,...n}=e,r={...n};return typeof t==`object`&&t?Object.assign(r,t):typeof t==`string`&&t!==``&&(r.where=t),r}var lt={get:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`GET`,url:e,query:b(t)}:{method:`GET`,url:`${e}/${t}`},getMany:(e,t={})=>({method:`GET`,url:e,query:b(t)}),add:(e,t)=>({method:`POST`,url:e,body:t}),update:(e,t,n)=>{if(typeof n==`object`&&n)return{method:`PUT`,url:e,query:b(n),body:t};if(Array.isArray(t))return{method:`PUT`,url:e,body:t};let r=t?.id;return r==null?{method:`PUT`,url:e,body:t}:{method:`PUT`,url:`${e}/${r}`,body:t}},delete:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`DELETE`,url:e,query:b(t)}:Array.isArray(t)?{method:`DELETE`,url:e,query:{ids:t.join(`,`)}}:{method:`DELETE`,url:`${e}/${t}`}};function ut(e){let t=[];for(let[n,r]of Object.entries(e)){if(r==null)continue;let e=Array.isArray(r)?r.join(`,`):String(r);t.push(`${encodeURIComponent(n)}=${encodeURIComponent(e)}`)}return t.join(`&`)}async function dt(e,t={}){let n=/^https?:\/\//i.test(e.url)||!t.baseUrl?e.url:`${String(t.baseUrl).replace(/\/+$/,``)}/${e.url.replace(/^\/+/,``)}`,r=e.query?ut(e.query):``,i=r?`${n}${n.includes(`?`)?`&`:`?`}${r}`:n,a={...t.headers},o;e.body!==void 0&&(o=JSON.stringify(e.body),Object.keys(a).some(e=>e.toLowerCase()===`content-type`)||(a[`Content-Type`]=`application/json`));let s=t.fetch??globalThis.fetch,c;try{c=await s(i,{method:e.method,headers:a,body:o})}catch(t){throw new ct(`资源请求网络错误: ${e.method} ${i} (${t?.message??t})`,0,i,e.method)}if(!c.ok)throw new ct(`资源请求失败: ${e.method} ${i} → ${c.status} ${c.statusText}`,c.status,i,e.method);if(c.status===204)return null;let l=await c.text(),u=l===``?null:JSON.parse(l);return t.unwrap?t.unwrap(u,e):u}var ft=new Set([`url`,`mapping`,`baseUrl`,`fetch`,`headers`,`unwrap`]);function pt(e){if(typeof e==`string`)return{url:e,inlineOptions:{},methods:{},inlineMapping:void 0};let t=typeof e.url==`string`?e.url:null,n={},r={},i;for(let[t,a]of Object.entries(e))t===`mapping`?a&&typeof a==`object`&&(i=a):ft.has(t)?a!==void 0&&(n[t]=a):typeof a==`function`&&(r[t]=a);return{url:t,inlineOptions:n,methods:r,inlineMapping:i}}function mt(e,t,n){let r=t?.options?.resources;return{...n,...r,...e}}function ht(e,t,n){return{...lt,...n,...e?.options?.resources?.mapping,...t}}function gt(e,t,n,r={}){let{url:i,inlineOptions:a,methods:o,inlineMapping:s}=pt(t),c=ht(n,s,r.mapping),l={};for(let[t,n]of Object.entries(o))l[`${e}.${t}`]=n;if(i)for(let[t,o]of Object.entries(c))l[`${e}.${t}`]||(l[`${e}.${t}`]=function(...e){return dt(o(i,...e),mt(a,this?.engine??n,r))});else if(Object.keys(l).length===0)return l;return l}var _t=class{constructor(e){this._defs=new Map,this._globalOptions={},this.engine=e}get options(){return this.engine?this.engine.options.resources??={}:this._globalOptions}add(e,t){let n=typeof e==`string`?[[e,t]]:Object.entries(e);for(let[e,t]of n){if(t===void 0)continue;(this._defs.has(e)||this._hasAction(`${e}.`))&&console.warn(`[autospark] resources.add: 资源 "${e}" 重复注册，后者覆盖（ADR-0011）`),this._defs.set(e,t);let n=gt(e,t,this.engine,this._globalOptions);Object.keys(n).length===0?console.warn(`[autospark] resources.add: 资源 "${e}" 定义为空（无 url 也无方法），已跳过`):this._write(n)}}get(e){return this._defs.get(e)}has(e){return this._defs.has(e)||this._hasAction(`${e}.`)}_write(e){let t=this._actionTable();if(!t)console.warn(`[autospark] resources.add: AutoSpark 命名空间不可用（插件未自举？），全局注册未生效`);else for(let[n,r]of Object.entries(e))t[n]=r}_actionTable(){if(this.engine)return this.engine.actions;let e=re();return e&&typeof e==`function`?e.actions:null}_hasAction(e){let t=this._actionTable();return t?Object.keys(t).some(t=>t.startsWith(e)):!1}},vt=null;function x(){return vt??=new _t}var yt=(e,t,n)=>{let r=e.textContent?.trim();if(!r)return;let i;try{let e=Function(`return (${r})`)();if(!e||typeof e!=`object`||Array.isArray(e)){n.logger.error(`<script type="autospark/resources"> 内容须为对象字面量`);return}i=e}catch(e){n.logger.error(`<script type="autospark/resources"> 解析失败: ${e?.message??e}`);return}let a=x().options,o=e.hasAttribute(`global`);for(let[e,r]of Object.entries(i)){let i=gt(e,r,n,a);if(Object.keys(i).length===0)n.logger.warn(`资源 "${e}" 定义为空（无 url 也无方法），已跳过（ADR-0011）`);else if(o)for(let[e,t]of Object.entries(i))n.actions[e]=t;else t?n.actionsManager.registerScoped(t,i):n.logger.warn(`资源 "${e}" 局部声明无祖先 scope（顶层游离）——加 global 属性声明 engine 级，或移入任意容器元素内`)}};function bt(){return{name:`resource`,created(){let e=(this.attr??``).trim();if(!e){this.warn(`x-resource: 缺属性参数（形态 x-resource:<资源名>="<url>"），本声明已忽略`);return}let t=String(this.value??``).trim();if(!t){this.warn(`x-resource:${e}: 缺 url 值，本声明已忽略`);return}let n=gt(e,t,this.engine,x().options);Object.keys(n).length===0?this.warn(`x-resource:${e}: 资源展开为空（映射表不可用？），本声明已忽略`):this.engine.actionsManager.registerScoped(this.binding,n)}}}function xt(){y(e=>{m(e),e.resources||=x(),e.scriptType(`autospark/resources`,yt),e.directive(bt()),e.ready(e=>{e.resources=new _t(e)})})}xt();var{params:St}=AutoSpark,Ct=new WeakMap,wt=new WeakMap;function Tt(e,t){Ct.set(e,{...Ct.get(e),...t})}function Et(e,t){wt.set(e,{...wt.get(e),...t})}function Dt(e){return e.trim().toLowerCase().replace(/_/g,`-`)}function S(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function C(e,t){return Object.prototype.hasOwnProperty.call(e,t)}var Ot=new Set,kt=new Set;function At(e){let t=e.store?.state;if(!t)return;let n=t.$?.language;if(typeof n==`string`&&n!==``)return n;let r=e.options.i18n??{},i=r.language??r.default;if(typeof i==`string`&&i!==``){try{t.$||={},t.$.language=i}catch{}return i}}function jt(e,t,n){let r=[],i=!1,a=t;for(;a;){let e=Ct.get(a);e&&(i=!0,C(e,n)&&S(e[n])&&r.push(e[n])),a=a.parent}let o=wt.get(e);o&&(i=!0,C(o,n)&&S(o[n])&&r.push(o[n]));let s=e.options.i18n?.messages;return S(s)&&(i=!0,C(s,n)&&S(s[n])&&r.push(s[n])),{layers:r,dictPresent:i}}function Mt(e,t){if(!e||!t)return;let n=Dt(t);if(n===``)return;for(let t of Object.keys(e))if(Dt(t)===n)return e[t];let r=n.split(`-`)[0];for(let t of Object.keys(e))if(Dt(t).split(`-`)[0]===r)return e[t]}function Nt(e,t){for(let t of e)if(typeof t==`number`)return t;if(t){for(let[e,n]of Object.entries(t))if(e.startsWith(`$`)&&typeof n==`number`)return n}}function Pt(e,t,n){let r=Nt(t,n);return r===void 0?e[e.length-1]:e[Math.min(Math.max(Math.floor(r),0),e.length-1)]}function Ft(e,t,n,...r){let i=null,a=r;r.length>=1&&S(r[0])&&(i=r[0],a=[],r.length>1&&!kt.has(n)&&(kt.add(n),e.logger?.warn(`t("${n}"): 对象参数与位置参数混用不受支持，复数请用 {$count} 通道——位置参数已忽略（ADR-0136）`)));let{layers:o,dictPresent:s}=jt(e,t,n),c;if(o.length>0){let t=At(e),n=e.options.i18n??{};for(let e of o)if(c=Mt(e,t)??Mt(e,n.fallback),c!==void 0)break}Array.isArray(c)&&(c=Pt(c,a,i));let l=c==null?n:String(c),u=i?St(l,i):St(l,...a);return c==null&&s&&!Ot.has(n)&&(Ot.add(n),e.logger?.warn(`t("${n}"): 字典中无当前语言的翻译（语言链与 fallback 均未命中），已按原文返回（ADR-0136）`)),u}function It(e){return(t,n,...r)=>Ft(e,t,n,...r)}var Lt=`autospark/locales`,Rt=(e,t,n)=>{let r=e.textContent?.trim();if(!r)return;let i;try{if(i=Function(`return (${r})`)(),!i||typeof i!=`object`||Array.isArray(i)){n.logger.error(`<script type="autospark/locales"> 内容须为字典对象字面量`);return}}catch(e){n.logger.error(`<script type="autospark/locales"> 解析失败: ${e?.message??e}`);return}let a=i;e.hasAttribute(`global`)||!t?Et(n,a):Tt(t,a)},{DirectiveKind:zt}=AutoSpark;function Bt(){return{name:`locales`,kind:zt.Compile,created(){let e=this.value;if(e==null||e===``)return;let t=this.binding.read(e);t!=null&&(typeof t!=`object`||Array.isArray(t)?this.engine.logger.warn(`x-locales: 值须为字典对象（原文 → {语言码: 译文}），已忽略: ${typeof t}`):Tt(this.binding,t))}}}function Vt(e){e.translate=It(e),At(e);let t=e.scopes;if(t)for(let e of t.values())e.refresh()}function Ht(){y(e=>{m(e),e.scriptType(Lt,Rt),e.directive(Bt()),e.ready(Vt)})}Ht();function Ut(e,t){return h(`getVal`)(e.store.state,t)}var Wt=[`hover`,`always`,`click`],Gt=`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`,Kt=`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`,qt=`var(--auto-danger-color, var(--autospark-ripple-badge-color, #ef4444))`,Jt=`var(--auto-danger-color, var(--autospark-spin-badge-color, #ef4444))`,Yt=2147483647,Xt=3e3;function w(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function Zt(e,t,n){let r=w(e,`speed`,t,n)??3e3;return r<=0?(t(`${n}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${Xt}`),Xt):r}function Qt(e,t,n){let r=new Set;e?.trigger!==void 0&&(Wt.includes(e.trigger)?r.add(e.trigger):t(`${n}: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let i of Wt){let a=e?.[i];a===!0?r.add(i):a!==void 0&&a!==!1&&t(`${n}: ${i} 开关须为布尔值，已忽略`)}return Wt.find(e=>r.has(e))??`always`}function $t(e,t,n,r){let i=new Set;if(!e)return i;for(let a of t){let t=e[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return i}function en(e,t,n,r,i){if(e)for(let a of t){let t=e[a];t!==void 0&&t!==!1&&r(`${i}: ${a} 是 ${n} 的形态键，已忽略`)}}function tn(e,t,n){let r=e?.badge;return r===void 0||r===!1?0:r===!0?8:typeof r==`number`&&Number.isFinite(r)&&r>0?r:(t(`${n}: badge 须为 true 或正数字（直径 px），已忽略`),0)}function nn(e,t,n,r,i){if(e!==void 0){if(typeof e==`string`&&e.trim()!==``)return e;r(`${i}: color 须为非空字符串，已回退默认色`)}return n>0?t.badgeColor:t.color}function rn(){return`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`}function an(e){return`position:absolute;top:${-e/2}px;right:${-e/2}px;width:${e}px;height:${e}px;border-radius:50%;pointer-events:none;display:block;z-index:${Yt};`}function on(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}var sn=class{static{this.probe=on}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!Ut(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??on)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{circle:a}=t.animations(this.config),o=e=>Math.round(e*10)/10,s=this.insideCarrier.circle;s.style.left=`${o(n-i)}px`,s.style.top=`${o(r-i)}px`,s.style.width=`${o(i*2)}px`,s.style.height=`${o(i*2)}px`,s.style.animation=`none`,s.offsetWidth,s.style.animation=a}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.circle.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}},T=new WeakMap;function cn(e,t){function n(){if(!this.el)return;let e=new sn(t,this.engine,this.info);e.el=this.el,T.set(this,e),e.mounted()}function r(){let e=T.get(this);T.delete(this),e?.unmounted()}function i(e){T.get(this)?.attrChanged(e)}return{name:e,kind:1,priority:0,mounted:n,unmounted:r,attrChanged:i}}function E(e){y(t=>{m(t),t.directive(e)})}var ln=[`glow`,`ring`,`echo`],un=[`ring`,`glow`,`echo`],dn=[`rotate`,`beam`,`chase`],fn={type:`echo`,trigger:`always`,inside:!1,badge:0,color:Gt,size:12,speed:3e3,gap:0},D=`x-ripple`,O=`x-ripple-on`,k=`x-ripple-echo`,pn=`x-ripple-layer`,mn=`x-ripple-badge`,hn=`x-ripple-inside`,gn=`x-ripple-inside-clip`,_n=`x-ripple-inside-circle`,vn=600,yn=.3,bn=!1,A=new Map,j=null;function xn(){if(bn||typeof document>`u`)return;bn=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-ripple`,``),e.textContent=`
:where(.${D}) { position: relative; }
.${D} {
  --x-ripple-color: ${Gt};
  --x-ripple-size: 12px;
  --x-ripple-duration: 3000ms;
  --x-ripple-anim: x-ripple-echo-3000-0;
  --x-ripple-echo-delay: -1500ms;
  --x-ripple-echo-size: 7.2px;
  --x-ripple-badge-size: 8px;
}
.${D}.${O}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* 迭代位变量化：click 经 --x-ripple-iter 注入 forwards（单周期结构化保证，
     ADR-0010 决策 4 修订 2026-11-24）；缺省 infinite（always/hover 循环） */
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out var(--x-ripple-iter, infinite);
}
.${D}.${O}.${k}::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* click 触发器双环同时起波：第二环同心缩小（--x-ripple-echo-size），与主环同拍收束；
     always/hover 维持负延迟错相位（同尺寸）——第二环尺寸仅在 click 下有别于主环 */
  --x-ripple-size: var(--x-ripple-echo-size);
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out var(--x-ripple-iter, infinite);
  animation-delay: var(--x-ripple-echo-delay);
}
.${D}.${mn}.${O}::after {
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
.${D}.${mn}.${O}.${k}::before {
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
  .${D}.${O}::after,
  .${D}.${O}.${k}::before { animation: none; }
  /* inside 填充圆动画走内联 style——类规则 !important 压过内联（可访问性底线同家族） */
  .${_n} { animation: none !important; }
}`,document.head.appendChild(e)}function Sn(e){let t=`${e.type}|${e.speed}|${e.gap}`,n=A.get(t);if(n)return n;let r=`x-ripple-${e.type}-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=i>0?Math.round(e.speed/i*100):100,o;return o=e.type===`glow`?`
  0% { box-shadow: 0 0 0 0 transparent; }
  ${Math.round(a/2)}% { box-shadow: 0 0 var(--x-ripple-size) 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`:`
  0% { box-shadow: 0 0 0 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }`,j||(j=document.createElement(`style`),j.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(j)),j.textContent+=`\n@keyframes ${r} {${o}\n}`,A.set(t,r),r}function Cn(e){let t=`inside|${e.speed}|${e.gap}`,n=A.get(t);if(n)return n;let r=`x-ripple-inside-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=`
  0% { transform: scale(0); opacity: var(--x-ripple-inside-alpha, ${yn}); }
  ${i>0?Math.round(e.speed/i*100):100}% { transform: scale(1); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }`;return j||(j=document.createElement(`style`),j.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(j)),j.textContent+=`\n@keyframes ${r} {${a}\n}`,A.set(t,r),r}function wn(e,t,n){let r=e.offsetWidth,i=e.offsetHeight,a=r/2,o=i/2;if(n){let t=e.getBoundingClientRect();a=n.clientX-t.left,o=n.clientY-t.top}let s=Math.max(a,r-a),c=Math.max(o,i-o);return{x:a,y:o,r:Math.hypot(s,c)}}function Tn(e){return e.trigger===`click`?0:-(e.speed+e.gap)/2}function En(e){return e.trigger===`click`?Math.round(e.size*.6*10)/10:e.size}function Dn(e,t){let n={...fn};if(!e)return n;let r=$t(e,un,t,`x-ripple`);e.type!==void 0&&(un.includes(e.type)?r.add(e.type):t(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let i=ln.find(e=>r.has(e));return i&&(n.type=i),en(e,dn,`x-spin`,t,`x-ripple`),e.inside!==void 0&&(e.inside===!0?n.inside=!0:e.inside!==!1&&t(`x-ripple: inside 开关须为布尔值，已忽略`)),n.trigger=Qt(e,t,`x-ripple`),n.badge=tn(e,t,`x-ripple`),n.inside&&n.badge>0&&(t(`x-ripple: badge 与 inside 互斥，badge 优先（inside 已忽略）`),n.inside=!1),n.color=nn(e.color,{color:Gt,badgeColor:qt},n.badge,t,`x-ripple`),n.size=w(e,`size`,t,`x-ripple`)??fn.size,n.speed=Zt(e,t,`x-ripple`),n.gap=w(e,`gap`,t,`x-ripple`)??0,n.inside&&(r.size>0&&t(`x-ripple: inside 接管渲染，type 形态词表已忽略`),e.size!==void 0&&t(`x-ripple: inside 半径自动几何（起点到最远角），size 已忽略`),e.speed===void 0&&(n.speed=vn)),n}var On={hostClass:D,activeClass:O,layerClass:pn,ensureStyles:xn,normalize:Dn,hostClasses:e=>[...e.badge>0?[mn]:[],...e.inside?[hn]:[]],activeClasses:e=>e.type===`echo`&&!e.inside?[k]:[],animName:e=>Sn(e),animationCss:(e,t)=>`${t} ${e.speed+e.gap}ms ease-out ${e.trigger===`click`?`forwards`:`infinite`}`,period:e=>e.speed+e.gap,layerCount:e=>e.type===`echo`?2:1,layerCssText:e=>e.badge>0?`${an(e.badge)}background:var(--x-ripple-color);`:rn(),applyLayerExtras:(e,t)=>{let n=e[1];n&&(n.style.animationDelay=`${Tn(t)}ms`,n.style.setProperty(`--x-ripple-size`,`${En(t)}px`))},applyVars:(e,t,n)=>{let r=e.style;r.setProperty(`--x-ripple-color`,t.color||`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`),r.setProperty(`--x-ripple-size`,`${t.size}px`),r.setProperty(`--x-ripple-duration`,`${t.speed+t.gap}ms`),r.setProperty(`--x-ripple-anim`,n),r.setProperty(`--x-ripple-echo-delay`,`${Tn(t)}ms`),r.setProperty(`--x-ripple-echo-size`,`${En(t)}px`),t.trigger===`click`&&r.setProperty(`--x-ripple-iter`,`forwards`),t.badge>0&&r.setProperty(`--x-ripple-badge-size`,`${t.badge}px`)},inside:{enabled:e=>e.inside,createCarrier:()=>{let e=document.createElement(`span`);e.className=gn,e.style.cssText=`position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;display:block;`;let t=document.createElement(`span`);return t.className=_n,t.style.cssText=`position:absolute;border-radius:50%;background:var(--x-ripple-color);opacity:0;pointer-events:none;display:block;`,e.append(t),{clip:e,circle:t}},geometry:wn,animations:e=>({circle:`${Cn(e)} ${e.speed+e.gap}ms ease-out ${e.trigger===`click`?`forwards`:`infinite`}`})}};function kn(){E(cn(`ripple`,On))}kn();var An=[`chase`,`rotate`,`beam`],jn=[`rotate`,`beam`,`chase`],Mn=[`ring`,`glow`,`echo`],Nn={type:`beam`,trigger:`always`,badge:0,color:Kt,size:4,speed:3e3},M=`x-spin`,N=`x-spin-on`,Pn=`x-spin-layer`,Fn=`x-spin-badge`,P=e=>`${M}-${e}`,In=`x-spin-angle`,Ln=!1;function F(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`}}var Rn=`padding:var(--x-spin-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`;function zn(){if(Ln||typeof document>`u`)return;Ln=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spin`,``),e.textContent=`
@property --x-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${In} { to { --x-spin-angle: 360deg; } }
:where(.${M}) { position: relative; }
.${M} {
  --x-spin-color: ${Kt};
  --x-spin-size: 4px;
  --x-spin-duration: 3000ms;
  --x-spin-badge-size: 8px;
}
.${M}.${N}::after {
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
  animation: ${In} var(--x-spin-duration) linear infinite;
}
.${M}.${Fn}.${N}::after {
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
.${M}.${P(`rotate`)}.${N}::after {
  background: ${F(`rotate`)};
}
.${M}.${P(`beam`)}.${N}::after {
  background: ${F(`beam`)};
}
.${M}.${P(`chase`)}.${N}::after {
  background: ${F(`chase`)};
}
@media (prefers-reduced-motion: reduce) {
  .${M}.${N}::after { animation: none; }
}`,document.head.appendChild(e)}function Bn(e,t){let n={...Nn};if(!e)return n;let r=$t(e,jn,t,`x-spin`);e.type!==void 0&&(jn.includes(e.type)?r.add(e.type):t(`x-spin: type 取值非法（${JSON.stringify(e.type)}），已回退 "beam"`));let i=An.find(e=>r.has(e));return i&&(n.type=i),en(e,Mn,`x-ripple`,t,`x-spin`),e.gap!==void 0&&t(`x-spin: gap 仅涟漪支持（x-spin 恒转无静止段），已忽略`),n.trigger=Qt(e,t,`x-spin`),n.badge=tn(e,t,`x-spin`),n.color=nn(e.color,{color:Kt,badgeColor:Jt},n.badge,t,`x-spin`),n.size=w(e,`size`,t,`x-spin`)??Nn.size,n.speed=Zt(e,t,`x-spin`),n}var Vn={hostClass:M,activeClass:N,layerClass:Pn,ensureStyles:zn,normalize:Bn,hostClasses:e=>[P(e.type),...e.badge>0?[Fn]:[]],activeClasses:()=>[],animName:()=>In,animationCss:(e,t)=>`${t} ${e.speed}ms linear infinite`,period:e=>e.speed,layerCount:()=>1,layerCssText:e=>e.badge>0?`${an(e.badge)}${Rn}background:${F(e.type)};`:`${rn()}${Rn}background:${F(e.type)};`,applyVars:(e,t)=>{let n=e.style;n.setProperty(`--x-spin-color`,t.color||`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`),n.setProperty(`--x-spin-size`,`${t.size}px`),n.setProperty(`--x-spin-duration`,`${t.speed}ms`),t.badge>0&&n.setProperty(`--x-spin-badge-size`,`${t.badge}px`)}};function Hn(){E(cn(`spin`,Vn))}Hn();var I={axis:`both`,width:12,thumbWidth:5,color:`var(--autospark-scrollbar-color, rgba(0,0,0,0.25))`,delay:300,fadeDuration:200,minSize:20},Un=.25,L=`x-scrollbar`,R=`x-scrollbar-visible`,z=`x-scrollbar-active-x`,B=`x-scrollbar-active-y`,V=`x-scrollbar-rail`,H=`x-scrollbar-rail-x`,U=`x-scrollbar-rail-y`,W=`x-scrollbar-thumb`,G=`x-scrollbar-thumb-drag`,Wn=!1;function Gn(){if(Wn||typeof document>`u`)return;Wn=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-scrollbar`,``),e.textContent=`
:where(.${L}) { position: relative; }
.${L} {
  scrollbar-width: none;
  -ms-overflow-style: none;
  --x-scrollbar-width: 12px;
  --x-scrollbar-thumb: 5px;
  --x-scrollbar-color: rgba(0,0,0,0.25);
  --x-scrollbar-fade: 200ms;
}
.${L}::-webkit-scrollbar { width: 0; height: 0; display: none; }
.${L} .${V} {
  position: absolute;
  display: none;
  opacity: 0;
  transition: opacity var(--x-scrollbar-fade, 200ms) ease;
  pointer-events: none;
  /* 补偿 transform 与合成线程滚动同层应用，减轻 scroll 事件后置补偿的滞后抖动 */
  will-change: transform;
}
.${L}.${B} .${U} { display: block; }
.${L}.${z} .${H} { display: block; }
.${L}.${R} .${V} {
  opacity: 1;
  pointer-events: auto;
}
/* 默认贴宿主内缘全长（thumb 可走满全程）；对向激活时才让位（互向不重叠，点击目标无歧义） */
.${L} .${U} {
  top: 2px;
  right: 2px;
  bottom: 2px;
  width: var(--x-scrollbar-width, 12px);
}
.${L} .${H} {
  left: 2px;
  bottom: 2px;
  right: 2px;
  height: var(--x-scrollbar-width, 12px);
}
.${L}.${z} .${U} {
  bottom: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${L}.${B} .${H} {
  right: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${L} .${W} {
  position: absolute;
  /* 滑块恒无边框——thumb/rail 是裸 span，宿主页面的全局/元素级边框规则可误中，皮肤自持 */
  border: none;
  border-radius: calc(var(--x-scrollbar-thumb, 5px) / 2);
  background: var(--x-scrollbar-color, rgba(0,0,0,0.25));
  user-select: none;
}
.${L} .${U} .${W} {
  right: 0;
  width: var(--x-scrollbar-thumb, 5px);
}
.${L} .${H} .${W} {
  bottom: 0;
  height: var(--x-scrollbar-thumb, 5px);
}
/* hover / 拖拽增粗（+5px，观感反馈内置，perfect-scrollbar 同款节奏） */
.${L} .${U}:hover .${W},
.${L} .${U} .${G} {
  width: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
.${L} .${H}:hover .${W},
.${L} .${H} .${G} {
  height: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
@media (prefers-reduced-motion: reduce) {
  .${L} .${V} { transition: none; }
}`,document.head.appendChild(e)}function Kn(e,t){let n={...I};if(!e)return n;let r=new Set;for(let n of[`x`,`y`]){let i=e[n];i===!0?r.add(n):i!==void 0&&i!==!1&&t(`x-scrollbar: ${n} 开关须为布尔值，已忽略`)}return r.size===1&&(n.axis=r.has(`x`)?`x`:`y`),n.width=w(e,`width`,t,`x-scrollbar`)??I.width,n.thumbWidth=w(e,`thumbWidth`,t,`x-scrollbar`)??I.thumbWidth,n.delay=w(e,`delay`,t,`x-scrollbar`)??I.delay,n.minSize=w(e,`minSize`,t,`x-scrollbar`)??I.minSize,n.fadeDuration=w(e,`fadeDuration`,t,`x-scrollbar`)??I.fadeDuration,e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-scrollbar: color 须为非空字符串，已回退默认色`)),n}var qn=class e{static scheduleFrame(e){return requestAnimationFrame(e)}static cancelFrame(e){cancelAnimationFrame(e)}constructor(e,t){this.alive=!0,this.enabled=!0,this.drag=null,this.railX=null,this.railY=null,this.thumbX=null,this.thumbY=null,this.hideTimer=null,this.ro=null,this.valueOff=null,this.offs=[],this.wheel=null,this.engine=e,this.info=t,this.value=t?.value,this.config=Kn(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(Gn(),this.applyVars(),this.bindValue(),this.enabled&&this.setup())}unmounted(){this.teardown(),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}if(this.value===`false`){this.setEnabled(!1);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!Ut(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.setup():this.teardown())}setup(){let e=this.el;e&&!this.railY&&(e.classList.add(L),this.applyVars(),this.buildRails(),this.bindEvents(),typeof ResizeObserver<`u`&&(this.ro=new ResizeObserver(()=>this.refresh()),this.ro.observe(e)),setTimeout(()=>this.refresh(),0),this.refresh())}teardown(){this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=null,this.wheel&&=(this.wheel.raf&&e.cancelFrame(this.wheel.raf),null),this.ro?.disconnect(),this.ro=null;for(let e of this.offs)e();this.offs=[],this.endDrag(!0),this.railX?.remove(),this.railY?.remove(),this.railX=this.railY=this.thumbX=this.thumbY=null,this.el?.classList.remove(L,R,z,B)}buildRails(){let e=e=>{let t=document.createElement(`span`);t.className=`${V} ${e}`;let n=document.createElement(`span`);return n.className=W,t.appendChild(n),this.el.appendChild(t),{rail:t,thumb:n}},t=e(U);this.railY=t.rail,this.thumbY=t.thumb;let n=e(H);this.railX=n.rail,this.thumbX=n.thumb}applyVars(){let e=this.el.style;e.setProperty(`--x-scrollbar-width`,`${this.config.width}px`),e.setProperty(`--x-scrollbar-thumb`,`${this.config.thumbWidth}px`),e.setProperty(`--x-scrollbar-color`,this.config.color),e.setProperty(`--x-scrollbar-fade`,`${this.config.fadeDuration}ms`)}listen(e,t,n){e.addEventListener(t,n),this.offs.push(()=>e.removeEventListener(t,n))}bindEvents(){let e=this.el;this.listen(e,`mouseenter`,()=>{this.refresh(),this.show()}),this.listen(e,`mouseleave`,()=>this.scheduleHide()),this.listen(e,`scroll`,()=>{this.drag||this.wheel||(this.updateThumb(`y`),this.updateThumb(`x`))}),this.bindWheel(),this.bindRail(`y`,this.railY,this.thumbY),this.bindRail(`x`,this.railX,this.thumbX)}bindWheel(){this.listen(this.el,`wheel`,e=>{if(e.ctrlKey||this.drag)return;let t=this.el,n=e.deltaMode===1?16:1,r=e.deltaY*n,i=e.deltaX*n,a=t.scrollHeight-t.clientHeight,o=t.scrollWidth-t.clientWidth,s=r!==0&&a>0&&!(r<0&&t.scrollTop<=0)&&!(r>0&&t.scrollTop>=a),c=i!==0&&o>0&&!(i<0&&t.scrollLeft<=0)&&!(i>0&&t.scrollLeft>=o);if(!s&&!c)return;e.preventDefault();let l=this.wheel??={tx:t.scrollLeft,ty:t.scrollTop,raf:0};s&&(l.ty=Math.min(Math.max(l.ty+r,0),a)),c&&(l.tx=Math.min(Math.max(l.tx+i,0),o)),l.raf===0&&this.runWheel()})}runWheel(){let t=this.wheel,n=()=>{t.raf=0;let r=this.el;if(!r||!this.enabled||!this.wheel){this.wheel=null;return}let i=!0,a=t.ty-r.scrollTop;Math.abs(a)>=1?(r.scrollTop+=a*Un,i=!1):a!==0&&(r.scrollTop=t.ty);let o=t.tx-r.scrollLeft;Math.abs(o)>=1?(r.scrollLeft+=o*Un,i=!1):o!==0&&(r.scrollLeft=t.tx),this.updateThumb(`y`),this.updateThumb(`x`),i?this.wheel=null:t.raf=e.scheduleFrame(n)};t.raf=e.scheduleFrame(n)}bindRail(e,t,n){this.listen(n,`pointerdown`,r=>this.dragStart(e,r,n,t)),this.listen(n,`pointermove`,e=>this.dragMove(e)),this.listen(n,`pointerup`,e=>this.dragEnd(e)),this.listen(n,`pointercancel`,()=>this.endDrag(!0)),this.listen(t,`pointerdown`,r=>{if(r.button!==0||r.target!==t)return;r.preventDefault();let i=this.el,a=t.getBoundingClientRect(),o=e===`y`?r.clientY-a.top:r.clientX-a.left,s=e===`y`?n.offsetTop:n.offsetLeft,c=e===`y`?i.clientHeight:i.clientWidth;e===`y`?i.scrollTop+=o<s?-c:c:i.scrollLeft+=o<s?-c:c,this.updateThumb(`y`),this.updateThumb(`x`)})}refresh(){if(!this.enabled||!this.el)return;let e=this.el,t=this.config.axis!==`x`&&e.clientHeight>0&&e.scrollHeight>e.clientHeight,n=this.config.axis!==`y`&&e.clientWidth>0&&e.scrollWidth>e.clientWidth;e.classList.toggle(B,t),e.classList.toggle(z,n),t&&this.updateThumb(`y`),n&&this.updateThumb(`x`)}updateThumb(e){let t=this.el,n=e===`y`?this.railY:this.railX,r=e===`y`?this.thumbY:this.thumbX;if(!t||!n||!r)return;let i=e===`y`?t.clientHeight:t.clientWidth,a=e===`y`?t.scrollHeight:t.scrollWidth,o=e===`y`?t.scrollTop:t.scrollLeft;if(a<=i)return;let s=e===`y`?n.offsetHeight:n.offsetWidth;if(s<=0)return;let c=Math.round(Math.min(s,Math.max(this.config.minSize,i/a*s))),l=a-i,u=Math.round(o/l*(s-c));n.style.transform=`translate(${t.scrollLeft}px, ${t.scrollTop}px)`,e===`y`?(r.style.height=`${c}px`,r.style.top=`${u}px`):(r.style.width=`${c}px`,r.style.left=`${u}px`)}show(){this.hideTimer!=null&&(clearTimeout(this.hideTimer),this.hideTimer=null),this.el?.classList.add(R)}scheduleHide(){this.drag||(this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=setTimeout(()=>{this.hideTimer=null,this.el?.classList.remove(R)},this.config.delay))}dragStart(e,t,n,r){if(t.button!==0||this.drag)return;t.preventDefault(),this.show();let i=e===`y`?r.offsetHeight:r.offsetWidth;this.drag={axis:e,pointerId:t.pointerId,start:e===`y`?t.clientY:t.clientX,startScroll:e===`y`?this.el.scrollTop:this.el.scrollLeft,railLen:i,thumbLen:e===`y`?n.offsetHeight:n.offsetWidth,thumb:n},n.classList.add(G);try{n.setPointerCapture(t.pointerId)}catch{}}dragMove(e){let t=this.drag;if(!t||e.pointerId!==t.pointerId)return;let n=this.el,r=t.axis,i=r===`y`?n.clientHeight:n.clientWidth,a=r===`y`?n.scrollHeight:n.scrollWidth,o=t.railLen-t.thumbLen;if(o<=0)return;let s=(r===`y`?e.clientY:e.clientX)-t.start,c=t.startScroll+s/o*(a-i);r===`y`?n.scrollTop=c:n.scrollLeft=c,this.updateThumb(`y`),this.updateThumb(`x`),this.updateThumb(r===`y`?`x`:`y`)}dragEnd(e){if(!this.drag||e.pointerId!==this.drag.pointerId)return;this.endDrag(!1);let t=this.el.getBoundingClientRect();e.clientX>=t.left&&e.clientX<=t.right&&e.clientY>=t.top&&e.clientY<=t.bottom?this.show():this.scheduleHide()}endDrag(e){let t=this.drag;if(t){this.drag=null,t.thumb.classList.remove(G);try{t.thumb.releasePointerCapture(t.pointerId)}catch{}e||this.refresh()}}},K=new WeakMap;function Jn(){function e(){if(!this.el)return;let e=new qn(this.engine,this.info);e.el=this.el,K.set(this,e),e.mounted()}function t(){let e=K.get(this);K.delete(this),e?.unmounted()}function n(e){K.get(this)?.attrChanged(e)}return{name:`scrollbar`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function Yn(){E(Jn())}Yn();var Xn={type:`dot`,overflowCount:99,color:`var(--auto-danger-color, var(--autospark-badge-color, #ef4444))`,ripple:!1},q=`x-badge`,J=`x-badge-mark`,Zn=`x-badge-dot`,Qn=`x-badge-count`,Y=`x-badge-ripple`,$n=`x-badge-waves`,er=!1;function tr(){if(er||typeof document>`u`)return;er=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-badge`,``),e.textContent=`
:where(.${q}) { position: relative; }
.${q} {
  --x-badge-color: var(--auto-danger-color, var(--autospark-badge-color, #ef4444));
}
.${q} .${J} {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(38%, -38%);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  color: var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  box-shadow: 0 0 0 1px var(--autospark-badge-outline, #fff);
  pointer-events: none;
  white-space: nowrap;
  z-index: 1;
}
/* dot：8px 正圆（对齐 decorate badge 载体惯例尺寸；color 通道留给 SVG currentColor 染色） */
.${q} .${J}.${Zn} {
  width: 8px;
  height: 8px;
  padding: 0;
}
/* count：数字胶囊——高 16 / 字号 12 / 水平 padding 4 / min-width 16（单数字正圆、多位自适应） */
.${q} .${J}.${Qn} {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  color: #fff;
}
/* dot + ripple：SMIL 扩散环 SVG——mark 背景即中心点，环自圆边（viewBox r=4）向外扩散 */
.${q} .${$n} {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  overflow: visible;
  pointer-events: none;
}
/* count + ripple：双伪元素 scale 扩散环（错相 1s，同源 x-icon ripple 双环几何） */
.${q} .${J}.${Y}::before,
.${q} .${J}.${Y}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 1px solid var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  animation: x-badge-pulse 2s ease-out infinite;
}
.${q} .${J}.${Y}::after {
  animation-delay: 1s;
}
@keyframes x-badge-pulse {
  from {
    transform: scale(1);
    opacity: 0.7;
  }
  to {
    transform: scale(1.9);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .${q} .${J}.${Y}::before,
  .${q} .${J}.${Y}::after {
    animation: none;
  }
}`,document.head.appendChild(e)}function nr(e,t){let n={...Xn};if(!e)return n;e.type!==void 0&&(e.type===`dot`||e.type===`count`?n.type=e.type:e.type!==!0&&e.type!==!1&&t(`x-badge: type 须为 'dot' | 'count'，已回退默认 '${Xn.type}'`));let r=e.count===!0?`count`:e.dot===!0?`dot`:null;r&&(e.type===void 0||typeof e.type==`boolean`)&&(n.type=r);let i=w(e,`overflowCount`,t,`x-badge`);if(i!==void 0){let e=Math.floor(i);e>0?n.overflowCount=e:t(`x-badge: overflowCount 须为正数，已回退默认 ${Xn.overflowCount}`)}return e.ripple!==void 0&&(typeof e.ripple==`boolean`?n.ripple=e.ripple:t(`x-badge: ripple 须为布尔值，已忽略`)),e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-badge: color 须为非空字符串，已回退默认色`)),n}var rr=class{constructor(e,t){this.alive=!0,this.mark=null,this.valueOff=null,this.reducedMotion=typeof matchMedia==`function`&&matchMedia(`(prefers-reduced-motion: reduce)`).matches,this.engine=e,this.info=t,this.value=t?.value,this.config=nr(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(tr(),this.el.classList.add(q),this.applyVars(),this.bindValue())}unmounted(){this.unmountMark(),this.el?.classList.remove(q),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.render(void 0);return}if(/^\d+$/.test(this.value.trim())){this.render(Number(this.value));return}let e=this.value,t=({value:e})=>{this.alive&&this.render(e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.render(r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.render(Ut(this.engine,e))}}render(e){let t=Number(e);if(e==null||e===``||e===!1||!Number.isFinite(t)||t<=0){this.config.type===`dot`&&this.value==null?this.mountMark():this.unmountMark();return}if(this.config.type===`dot`){this.mountMark();return}this.mountMark();let{overflowCount:n}=this.config;this.mark.textContent=t>n?`${n}+`:String(t)}mountMark(){if(this.mark)return;let{type:e,ripple:t}=this.config,n=document.createElement(`span`);n.className=`${J} ${e===`count`?Qn:Zn}`,n.setAttribute(`aria-hidden`,`true`),t&&n.classList.add(Y),e===`dot`&&t&&!this.reducedMotion&&n.insertAdjacentHTML(`afterbegin`,ir()),this.el.appendChild(n),this.mark=n}unmountMark(){this.mark?.remove(),this.mark=null}applyVars(){this.el.style.setProperty(`--x-badge-color`,this.config.color)}};function ir(){let e=e=>`<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.35"><animate attributeName="r" values="4;11" dur="2s" begin="${e}" repeatCount="indefinite" /><animate attributeName="fill-opacity" values="0.35;0" dur="2s" begin="${e}" repeatCount="indefinite" /></circle>`;return`<svg class="${$n}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`+e(`0s`)+e(`-1s`)+`</svg>`}var X=new WeakMap;function ar(){function e(){if(!this.el)return;let e=new rr(this.engine,this.info);e.el=this.el,X.set(this,e),e.mounted()}function t(){let e=X.get(this);X.delete(this),e?.unmounted()}function n(e){X.get(this)?.attrChanged(e)}return{name:`badge`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function or(){E(ar())}or();function Z(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function Q(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function $(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var sr=`<div
  class="asc-button-group"
  x-define="autospark.button-group"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            gap: 0,
            vertical: false,
            block: false,
            value: "",
            modelBound: false,
        }),
        mounted() {
            const bound = !!this.data.modelBound || (this.data.value != null && this.data.value !== "");
            if (!bound) return;

            const buttons = () => Array.from(this.el.querySelectorAll(".asc-button"));

            let current = "";

            let real = null;

            const applySel = (v) => {
                if (real) real.value = v;
                for (const b of buttons()) b.classList.toggle("asc-group-checked", b.getAttribute("data-value") === v);
            };

            if (this.data.modelBound) {
                real = document.createElement("input");
                real.type = "hidden";
                real.style.display = "none";
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) real.name = nameAttr;
                this.el.appendChild(real);
                const prior = this.el.value;
                if (typeof prior === "string" && prior !== "") current = prior;
                Object.defineProperty(this.el, "value", {
                    get: () => current,
                    set: (v) => { current = String(v ?? ""); applySel(current); },
                    configurable: true,
                });
            }

            setTimeout(() => {
                const dv = this.data.value;
                if (current === "" && dv != null && dv !== "") current = String(dv);
                applySel(current);
            }, 0);

            this.watch("value", ({ value: v }) => {
                if (v == null || v === "") return;
                const s = String(v);
                if (s !== current) { current = s; applySel(s); }
            });

            this.el.addEventListener("click", (e) => {
                const btn = e.target instanceof Element ? e.target.closest(".asc-button") : null;
                if (!btn || !this.el.contains(btn) || btn.disabled) return;
                const v = btn.getAttribute("data-value");
                if (v == null || v === current) return;
                current = v;
                applySel(v);
                if (this.data.modelBound) this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: v } }));
            });
        },
    }
  <\/script>
  <style global id="autospark-components-button-group">
    /* 组为纯布局容器无自有视觉盒：无背景/边框/字色字面值，暗色由子钮各自承担——
       组级无暗色兜底变体（无字面值即无暗色差异） */
    .asc-button-group {
      display: inline-flex;
      vertical-align: middle;
      max-width: 100%;
    }
    /* 布局容器：body 是编译子树内层（绑定可求值），子钮经 items 的 display:contents
         直接成为 body 的 flex 项（x-for 克隆载体同款技巧——出口盒不产生布局盒；
         x-slot 出口元素保留为真实包裹层不剥标签，ADR-0056——无此规则则子钮嵌在
         出口 span 内：融合相邻选择器不命中、gap/等高拉伸全部失效） */
    .asc-button-group-body {
      display: flex;
      align-items: stretch;
      width: 100%;
      min-width: 0;
    }
    .asc-button-group-items {
      display: contents;
    }
    .asc-button-group-body[data-vertical="true"] {
      flex-direction: column;
    }
    .asc-button-group:has(> .asc-button-group-body[data-block="true"]) {
      display: flex;
      width: 100%;
    }
    /* 间隔：gap 经 :style 内联承载（number 按 px / 字符串原样，indent 同款惯例），
         data-fused 仅在 gap 假值（缺省 0）时在场（绑定假值移除） */

    /* 水平：有后邻的钮清尾侧（右）圆角；有前邻的钮清首侧（左）圆角并压叠 1px（后钮边线
         绘制在上——异色分界取后钮色；后钮透明边线时前钮边线透出，分界恒在） */
    .asc-button-group-body[data-fused="true"] .asc-button:has(+ .asc-button) {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
    }
    .asc-button-group-body[data-fused="true"] .asc-button + .asc-button {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
      margin-inline-start: calc(
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))
      );
    }
    .asc-button-group-body[data-fused="true"][data-vertical="true"]
      .asc-button:has(+ .asc-button) {
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }
    .asc-button-group-body[data-fused="true"][data-vertical="true"]
      .asc-button
      + .asc-button {
      border-start-start-radius: 0;
      border-start-end-radius: 0;
      margin-inline-start: 0;
      margin-block-start: calc(
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))
      );
    }
    /* 交互/选中钮浮于压叠之上：负 margin 重叠 1px 会令后钮背景盖前钮边缘（选中实底
         钮右缘被切、hover 边缘错位）——交互中的钮抬层级保边缘干净 */
    .asc-button-group-body[data-fused="true"] .asc-button:hover,
    .asc-button-group-body[data-fused="true"] .asc-button.asc-group-checked {
      position: relative;
      z-index: 1;
    }

    /* 组自有 class 驱动（区别于子钮 checkable 的 asc-checked）；--asc-tone 在子钮作用域
         由其 data-type 决定（组级 type 下发后语义色正确），暗色经变量链自适应无需兜底 */
    .asc-button-group .asc-button.asc-group-checked {
      --asc-bg: var(--asc-tone) !important;
      --asc-ink: #fff !important;
      --asc-line: transparent !important;
    }
  </style>
  <span
    class="asc-button-group-body"
    :data-vertical="vertical"
    :data-block="block"
    :data-fused="!gap"
    :style="gap ? { gap: (typeof gap === 'number' ? gap + 'px' : gap) } : undefined"
  >
    <span class="asc-button-group-items" x-slot></span>
  </span>
</div>
`,cr=`autospark.button-group`,lr=[`variant`,`type`,`disabled`],ur=new Set([`vertical`,`block`]),dr=`x-component:autospark.button`,fr=`button[x-component\\:autospark\\.button]`;function pr(e,t){return RegExp(`[{,]\\s*${t}\\s*:`).test(e)}function mr(e){let t=e.match(/[{,]\s*value:\s*("(?:[^"\\]|\\.)*")/);if(!t)return null;try{let e=JSON.parse(t[1]);return typeof e==`string`?e:String(e)}catch{return null}}function hr(e){e.components[cr]=sr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button-group`))){let e=Array.from(t.querySelectorAll(`x-button, ${fr}`)).filter(e=>e.closest(`x-button-group`)===t),n=new Map;for(let e of lr)t.hasAttribute(e)&&n.set(e,t.getAttribute(e)),t.hasAttribute(`:${e}`)&&n.set(`:${e}`,t.getAttribute(`:${e}`));for(let t of e){if(t.tagName===`X-BUTTON`){let e=t.getAttribute(`value`);e!=null&&t.setAttribute(`data-value`,e);for(let[e,r]of n)t.hasAttribute(e)||t.hasAttribute(`:${e.slice(1)}`)||t.setAttribute(e,e.startsWith(`:`)?r:e===`disabled`?`true`:r);continue}let e=t.getAttribute(dr)??`{ }`,r=[];if(t.getAttribute(`data-value`)==null){let n=mr(e);n!=null&&t.setAttribute(`data-value`,n)}for(let[t,i]of n){let n=t.startsWith(`:`)?t.slice(1):t;pr(e,n)||r.push(`${n}: ${t.startsWith(`:`)?`(${i})`:JSON.stringify(t===`disabled`||$(i))}`)}if(r.length>0){let n=e.replace(/\}\s*$/,``).replace(/\s+$/,``),i=n.endsWith(`{`)?n:`${n},`;t.setAttribute(dr,`${i} ${r.join(`, `)} }`)}}let r=document.createElement(`div`),i=[];for(let e of Array.from(t.attributes)){if(e.name.startsWith(`:`)){i.push(`${Q(Z(e.name.slice(1)))}: (${e.value})`);continue}if(e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)){r.setAttribute(e.name,e.value);continue}let t=Z(e.name),n=e.value===``&&ur.has(t)?!0:$(e.value);i.push(`${Q(t)}: ${JSON.stringify(n)}`)}for(t.hasAttribute(`x-model`)&&i.push(`modelBound: true`),r.setAttribute(`x-component:${cr}`,`{ ${i.join(`, `)} }`);t.firstChild;)r.appendChild(t.firstChild);t.replaceWith(r)}})}gr();function gr(){y(e=>{m(e),hr(e)})}var _r=`<button\r
  class="asc-button"\r
  x-define="autospark.button"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            variant: "default",\r
            type: "primary",\r
            label: "按钮",\r
            labelPos: "right",\r
            icon: "",\r
            loading: false,\r
            ghost: false,\r
            border: false,\r
            block: false,\r
            disabled: false,\r
            ripple: true,\r
            autoInsertSpace: true,\r
            shape: "default",\r
            wrap: false,\r
            align: "center",\r
            indent: 0,\r
            memo: "",\r
            tags: [],\r
            caret: "none",\r
            menu: false,\r
            checkable: false,\r
            value: false,\r
            checkValues: [true, false],\r
            checkStyle: "corner",\r
            checkMark: false,\r
            state: null,\r
            collapsed: false,\r
            hideTags: false,\r
            // floatCaret 值域：false（缺省，不浮动）| 'top' | 'center' | 'bottom'（浮动垂直档位，\r
            // 裸布尔 true 归一为 'center'——绑定通道统一产出三档字符串或 null）\r
            floatCaret: false,\r
            states: null,\r
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label\r
        }),\r
        methods: {\r
            tagCheckValues(tag) {\r
                return [tag.checkValues?.[0] ?? true, tag.checkValues?.[1] ?? false];\r
            },\r
            onTagClick(tag, event) {\r
                event.stopPropagation();\r
                if (tag.checkable) {\r
                    const vals = this.tagCheckValues(tag);\r
                    tag.value = tag.value === vals[0] ? vals[1] : vals[0];\r
                }\r
                this.el.dispatchEvent(new CustomEvent("tag-click", { bubbles: true, detail: { name: tag.name, label: tag.label, value: tag.value, tag } }));\r
            }\r
        },\r
        mounted() {\r
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };\r
            syncDisabled();\r
            this.watch("disabled", ({ value }) => { syncDisabled(); });\r
            this.watch("loading", ({ value }) => { syncDisabled(); });\r
\r
            const syncIconBadge = () => {\r
                const i = this.data.icon;\r
                const span = this.el.querySelector(".asc-button-icon");\r
                if (!span) return;\r
                const hadPad = span.classList.contains("asc-button-icon-badge-pad");\r
                span.classList.remove("asc-button-icon-badge", "asc-button-icon-badge-pad");\r
                if (hadPad && (typeof i !== "object" || !i || i.padding == null || i.padding === "")) {\r
                    span.style.removeProperty("padding");\r
                }\r
                if (typeof i !== "object" || !i) return;\r
                const badge = i.badge;\r
                const on = badge === true\r
                    || typeof badge === "number"\r
                    || (typeof badge === "string" && badge.trim() !== "");\r
                if (!on) return;\r
                span.classList.add("asc-button-icon-badge");\r
                if (typeof badge === "number") {\r
                    span.style.padding = badge + "px";\r
                    span.classList.add("asc-button-icon-badge-pad");\r
                } else if (typeof badge === "string") {\r
                    span.style.padding = badge;\r
                    span.classList.add("asc-button-icon-badge-pad");\r
                }\r
            };\r
            setTimeout(syncIconBadge, 0);\r
            this.watch("icon", () => { setTimeout(syncIconBadge, 0); });\r
\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
            const syncTip = () => {\r
                if (this.data.labelPos === "none") {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return;\r
                    this.el.setAttribute(tipAttr, String(this.data.label ?? ""));\r
                    selfTip = true;\r
                    return;\r
                }\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (!span) return;\r
                if (span.scrollWidth > span.clientWidth) {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return;\r
                    this.el.setAttribute(tipAttr, span.textContent);\r
                    selfTip = true;\r
                } else if (selfTip) {\r
                    this.el.removeAttribute(tipAttr);\r
                    selfTip = false;\r
                }\r
            };\r
            setTimeout(syncTip, 0);\r
            this.watch("label", () => { setTimeout(syncTip, 0); });\r
            this.watch("wrap", () => { setTimeout(syncTip, 0); });\r
            this.watch("labelPos", () => { setTimeout(syncTip, 0); });\r
\r
            if (!this.data.checkable && this.data.checkMark) {\r
                this.el.classList.add("asc-check-" + (this.data.checkStyle || "check"));\r
                this.watch("checkStyle", ({ value: s }) => {\r
                    for (const k of ["solid", "check", "corner", "ripple"]) this.el.classList.remove("asc-check-" + k);\r
                    this.el.classList.add("asc-check-" + (s || "check"));\r
                });\r
            }\r
\r
            if (this.data.checkable) {\r
                this.el.classList.add("asc-check-" + this.data.checkStyle);\r
                const proto = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, "value");\r
                const real = document.createElement("input");\r
                real.type = "checkbox";\r
                real.style.display = "none";\r
                const vals = () => this.data.checkValues;\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) real.name = nameAttr;\r
                this.el.appendChild(real);\r
                let rippleBase = this.data.ripple;\r
                const applyChecked = (on) => {\r
                    const [onV, offV] = vals();\r
                    this.data.value = on ? onV : offV;\r
                    real.checked = !!on;\r
                    this.el.classList.toggle("asc-checked", !!on);\r
                    if (this.data.checkStyle === "ripple") {\r
                        this.data.ripple = on ? { trigger: "always", inside: false, type: "echo" } : rippleBase;\r
                    }\r
                };\r
                Object.defineProperty(this.el, "value", {\r
                    get: () => proto.get.call(this.el),\r
                    set: (v) => { proto.set.call(this.el, v); applyChecked(v === "true"); },\r
                    configurable: true,\r
                });\r
                const resync = () => {\r
                    real.value = String(vals()[0]);\r
                    const raw = proto.get.call(this.el);\r
                    if (raw === "true") applyChecked(true);\r
                    else if (raw === "false") applyChecked(false);\r
                    else if (this.data.value === vals()[0]) applyChecked(true);\r
                    else if (this.data.value === vals()[1]) applyChecked(false);\r
                };\r
                setTimeout(resync, 0);\r
                this.watch("checkValues", () => { setTimeout(resync, 0); });\r
                this.watch("checkStyle", ({ value: s }) => {\r
                    for (const k of ["solid", "check", "corner", "ripple"]) this.el.classList.remove("asc-check-" + k);\r
                    this.el.classList.add("asc-check-" + s);\r
                });\r
                this.watch("value", ({ value: v }) => {\r
                    if (v === vals()[0] || v === vals()[1]) resync();\r
                });\r
                this.el.addEventListener("click", () => {\r
                    if (!this.data.checkable || this.el.disabled) return;\r
                    const [onVal, offVal] = vals();\r
                    const next = this.data.value === onVal ? offVal : onVal;\r
                    this.el.value = String(next === onVal);\r
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                    this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));\r
                });\r
            }\r
\r
            let rippleMountTimer = 0;\r
            const syncRipple = () => {\r
                const conf = this.data.ripple;\r
                clearTimeout(rippleMountTimer);\r
                this.el.removeAttribute("x-ripple");\r
                this.el.removeAttribute("x-ripple-options");\r
                if (conf) {\r
                    this.el.setAttribute("x-ripple-options", JSON.stringify(typeof conf === "object" ? { trigger: "click", inside: true, ...conf } : { trigger: "click", inside: true }));\r
                    rippleMountTimer = setTimeout(() => this.el.setAttribute("x-ripple", ""), 0);\r
                }\r
            };\r
            syncRipple();\r
            this.watch("ripple", () => { syncRipple(); });\r
\r
            // ---------- 命名状态覆盖（state/states + collapsed 快捷糖，2026-11-22 共识） ----------\r
            // state（激活键，唯一真相）命中 states 表时，该键的 props 覆盖集整组 assign 进 data\r
            // 接管按钮渲染；切走时按快照守卫还原（激活期间被外部改过的键外部值赢）。\r
            // collapsed 是 state 的快捷写入糖：true ≡ state='collapsed'、false ≡ state=null。\r
            // menu:false——折叠图标条时退出菜单形态（占满宽/左对齐解除，按钮收缩到内容宽），\r
            // 宽度收窄归消费方 data-state CSS（零几何内建不变）\r
            const BUILTIN_COLLAPSED = { labelPos: "none", indent: 0, hideTags: true, menu: false };\r
            const isOverrideMap = (v) => v != null && typeof v === "object" && !Array.isArray(v);\r
            // 双层合并：表与内置 collapsed 预设浅合并，用户 collapsed 键再与预设浅合并（部分定制\r
            // 保留默认形态），其余自定义键所见即所得（值对象整体生效、未写的键不碰）。\r
            // states 非纯对象（state-button 继承场景的数组）时机制整体静默跳过。\r
            const resolveStates = () => {\r
                const user = this.data.states;\r
                if (user == null) return { collapsed: { ...BUILTIN_COLLAPSED } };\r
                if (!isOverrideMap(user)) return null;\r
                const merged = Object.assign({ collapsed: { ...BUILTIN_COLLAPSED } }, user);\r
                if (user.collapsed != null && isOverrideMap(user.collapsed)) {\r
                    merged.collapsed = Object.assign({ ...BUILTIN_COLLAPSED }, user.collapsed);\r
                }\r
                return merged;\r
            };\r
            let stateSnap = null; // { key, recs: { 键: { orig, applied } } }\r
            const warnedStateKeys = new Set();\r
            const revertState = () => {\r
                if (!stateSnap) return;\r
                for (const [k, rec] of Object.entries(stateSnap.recs)) {\r
                    // 守卫：仅还原「当前值仍严格等于激活时写入值」的键——被外部改过的保持外部值\r
                    if (this.data[k] === rec.applied) this.data[k] = rec.orig;\r
                }\r
                this.el.removeAttribute("data-state");\r
                stateSnap = null;\r
            };\r
            const applyState = (key) => {\r
                const table = resolveStates();\r
                const overrides = table == null ? undefined : table[key];\r
                revertState();\r
                if (table == null) return; // states 非纯对象（数组等，state-button 继承语境）：机制整体静默跳过\r
                if (!isOverrideMap(overrides)) {\r
                    // null/''/undefined = 合法取消（静默恢复）；非空字符串不在表 = miss，warn 一次\r
                    if (typeof key === "string" && key !== "" && !warnedStateKeys.has(key)) {\r
                        warnedStateKeys.add(key);\r
                        console.warn(\`[autospark.button] state="\${key}" 不在 states 表中，已按无状态渲染\`);\r
                    }\r
                    return;\r
                }\r
                const recs = {};\r
                for (const [k, v] of Object.entries(overrides)) {\r
                    recs[k] = { orig: this.data[k], applied: v };\r
                    this.data[k] = v;\r
                }\r
                stateSnap = { key, recs };\r
                this.el.setAttribute("data-state", key);\r
            };\r
            // 初始快捷方式：state 显式声明（非空）赢、collapsed 忽略；否则 collapsed=true 初始化折叠键\r
            if ((this.data.state == null || this.data.state === "") && this.data.collapsed) {\r
                this.data.state = "collapsed";\r
            }\r
            // 初始 apply 走微任务：i18n 插件在场时其 $.ready 换血（构造末尾 scope.refresh 重跑\r
            // 值闭包）会整组重注入 props，把 mounted 同步覆盖的、外部 props 显式声明的键冲回\r
            // 外部值——微任务化使覆盖稳定发生在换血之后；运行时切换走 watch 同步 apply 不受影响\r
            queueMicrotask(() => { applyState(this.data.state ?? null); });\r
            this.watch("state", ({ value }) => { applyState(value ?? null); });\r
            // 激活期间 states 表替换：用新表重放当前键（revert 旧覆盖集 + apply 新覆盖集；\r
            // 键从新表消失走 miss 口径——warn 一次 + 恢复常态）\r
            this.watch("states", () => { if (stateSnap) applyState(stateSnap.key); });\r
            // collapsed 运行时翻转恒写 state（最近操作赢）；值未变的首跑（若有）跳过，\r
            // 保住上方「初始 state 显式声明赢」的优先级\r
            let lastCollapsed = !!this.data.collapsed;\r
            this.watch("collapsed", ({ value }) => {\r
                const on = !!value;\r
                if (on === lastCollapsed) return;\r
                lastCollapsed = on;\r
                this.data.state = on ? "collapsed" : null;\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-button">\r
    .asc-button {\r
      --asc-tone: var(\r
        --auto-primary-color,\r
        var(--asc-button-primary, #009aff)\r
      );\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      --asc-line: transparent;\r
      --asc-pad: var(--auto-padding, var(--asc-button-padding, 0.8rem));\r
      display: inline-flex;\r
      border: var(--auto-border-size, var(--asc-button-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(\r
        --auto-border-radius,\r
        var(--asc-button-radius, 0.5rem)\r
      );\r
      background: var(--asc-bg);\r
      color: var(--asc-ink);\r
      font: inherit;\r
      font-size: var(--auto-font-size, var(--asc-button-font-size, 0.875rem));\r
      line-height: 1.4;\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.8);\r
      cursor: pointer;\r
      user-select: none;\r
      transition:\r
        filter 0.15s ease,\r
        background-color 0.15s ease;\r
    }\r
    .asc-button:has(> .asc-button-body[data-border="true"]) {\r
      --asc-line: var(\r
        --auto-border-color,\r
        var(--asc-button-border-color, #d9d9d9)\r
      );\r
    }\r
\r
    .asc-button:has(> .asc-button-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #009aff));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #22c55e));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f59e0b));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #ef4444));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #71717a));\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="default"]) {\r
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #ffffff));\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
    }\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="success"]\r
    ),\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="warning"]\r
    ),\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="danger"]\r
    ),\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="info"]\r
    ) {\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="primary"]) {\r
      --asc-bg: var(--asc-tone);\r
      --asc-ink: #fff;\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="secondary"]) {\r
      --asc-bg: var(\r
        --auto-secondary-bgcolor,\r
        var(--asc-button-bg, rgba(245, 245, 245, 0.45))\r
      );\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="dashed"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
      border-style: dashed;\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="text"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="link"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      padding: 0;\r
    }\r
\r
    .asc-button:has(> .asc-button-body[data-ghost="true"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
    }\r
\r
    .asc-button:has(> .asc-button-body[data-menu="true"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      display: flex;\r
      width: 100%;\r
      border-radius: var(\r
        --auto-border-radius,\r
        var(--asc-button-radius, 0.375rem)\r
      );\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);\r
      text-align: left;\r
    }\r
\r
    /* ---------- 勾选渲染（checkable / checkStyle 四值，2026-11-13 回归——ADR-0016 修订记：\r
       decorate 四值渲染下沉为组件级 checkStyle）。指示色统一 --asc-tone（theme 主色，type\r
       非默认时语义色）；宿主 class 驱动（.asc-checked 勾选态 + .asc-check-<style> 静态形态类\r
       ——Chromium :active 粘滞期间 :has(属性变化) 不重算，class 是强失效信号） ---------- */\r
    .asc-button.asc-checked.asc-check-solid {\r
      --asc-bg: var(--asc-tone) !important;\r
      --asc-ink: #fff !important;\r
      --asc-line: transparent !important;\r
    }\r
    .asc-button.asc-check-check > .asc-button-body::before {\r
      content: "";\r
      flex: none;\r
      width: 1.2em;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      color: var(--asc-tone);\r
      font-size: 0.9em;\r
      font-weight: bold;\r
    }\r
    /* asc-marked：外部 class 驱动的勾选显影（checkMark 占位列的勾选态，menu v2 写入——\r
       不走 checkable 行为桥，避免与宿主组件的点击处理双写） */\r
    .asc-button.asc-checked.asc-check-check > .asc-button-body::before,\r
    .asc-button.asc-marked.asc-check-check > .asc-button-body::before {\r
      content: "✓";\r
    }\r
    /* corner：勾选 = tone 外描边（box-shadow，视觉等价 outline 且跟随圆角）+ 右上角 tone 小三角\r
         （渐变盒对角线分割）内嵌反白小勾；尺寸 = min(圆角 ×2.5, 2.5em, 高 50%) 随圆角档位与\r
         按钮高度自适应。**无缝贴合**：描边画在 border 外缘，而 absolute 定位基准是 padding\r
         box（border 内缘）——故 border 消隐（--asc-line: transparent，占位保留零布局影响）、\r
         三角 -2px 跨过 1px border 区直抵描边内缘（三角与描边零间隙） */\r
    .asc-button.asc-checked.asc-check-corner {\r
      --asc-corner: min(\r
        calc(var(--auto-border-radius, 0.5rem) * 2.5),\r
        2.5em,\r
        50%\r
      ) !important;\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone) !important;\r
      position: relative !important;\r
    }\r
    .asc-button.asc-checked.asc-check-corner::after {\r
      content: "" !important;\r
      position: absolute !important;\r
      top: -2px !important;\r
      right: -2px !important;\r
      height: calc(var(--asc-corner) + 2px) !important;\r
      aspect-ratio: 1 / 1 !important;\r
      border-top-right-radius: min(\r
        calc(var(--auto-border-radius, 0.5rem) + 1px),\r
        1.4em\r
      );\r
      background: linear-gradient(\r
        to bottom left,\r
        var(--asc-tone) 49.5%,\r
        transparent 50%\r
      );\r
      z-index: 1 !important;\r
    }\r
    .asc-button.asc-checked.asc-check-corner::before {\r
      content: "" !important;\r
      position: absolute !important;\r
      top: calc(var(--asc-corner) * 0.24 - 2px) !important;\r
      right: calc(var(--asc-corner) * 0.14 - 2px) !important;\r
      z-index: 2 !important;\r
      width: calc(var(--asc-corner) * 0.36) !important;\r
      aspect-ratio: 2 / 1 !important;\r
      border-left: 1.5px solid var(--auto-bgcolor, #fff) !important;\r
      border-bottom: 1.5px solid var(--auto-bgcolor, #fff) !important;\r
      transform: rotate(-45deg) !important;\r
    }\r
    /* 按压预览（corner）：未勾选按压即预显描边——松手勾选正式化、按住拖出取消随按压消失；\r
         border 同步消隐防预览描边与 border 间的 1px 间隙（同勾选态无缝口径） */\r
    .asc-button.asc-check-corner:active:not([disabled]):not(.asc-checked) {\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone) !important;\r
    }\r
    /* ripple：勾选视觉 = 宿主整体恒开 echo 双环涟漪（mounted 经 data.ripple 单通道由父\r
       syncRipple 挂载 { trigger: "always", inside: false, type: "echo" }——需页面加载\r
       autospark.ripple.js，未加载静默无指示）；无占位指示器、背景维持原 variant */\r
\r
    .asc-button:has(> .asc-button-body[data-shape="circle"]) {\r
      border-radius: 9999px;\r
      padding: calc(var(--asc-pad) * 0.55);\r
    }\r
\r
    .asc-button:has(> .asc-button-body[data-block="true"]) {\r
      display: flex;\r
      width: 100%;\r
    }\r
\r
    .asc-button:hover:not([disabled]) {\r
      filter: brightness(0.96);\r
    }\r
    .asc-button:active:not([disabled]) {\r
      filter: brightness(0.9);\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(\r
        [disabled]\r
      ),\r
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ),\r
    .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(\r
        [disabled]\r
      ),\r
    .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(\r
        [disabled]\r
      ) {\r
      filter: none;\r
      background: var(\r
        --auto-hover-bgcolor,\r
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))\r
      );\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ) {\r
      text-decoration: underline;\r
    }\r
    .asc-button[disabled] {\r
      opacity: 0.55;\r
      cursor: not-allowed;\r
      filter: none;\r
    }\r
    .asc-button:has(> .asc-button-body[data-loading="true"]) {\r
      opacity: 1;\r
      cursor: progress;\r
    }\r
\r
    .asc-button-body {\r
      display: flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.4em;\r
      width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-button-body[data-align="left"] {\r
      justify-content: flex-start;\r
    }\r
    .asc-button-body[data-align="right"] {\r
      justify-content: flex-end;\r
    }\r
    .asc-button-body[data-menu="true"] {\r
      justify-content: flex-start;\r
    }\r
    .asc-button-body[data-label-pos="top"],\r
    .asc-button-body[data-label-pos="bottom"] {\r
      flex-direction: column;\r
      gap: 0.15em;\r
    }\r
    .asc-button-body[data-label-pos="top"] .asc-button-icon {\r
      order: 2;\r
    }\r
    /* 图标放大内建 1.5×（ADR-0138，2026-11-16 修订：memo 并入统一倍率）：纵排（top/bottom）\r
         或 memo 在场即放大，倍率乘在 --auto-icon-size 上（width/height 覆盖载体，theme 档位\r
         绝对值与 1em 回落两态一致生效——font-size 载体在 theme 在场时撑不动绝对宽高，勿用；\r
         svg 恒 100% 撑满宿主自动跟随）；loading 位同容器天然吃内建 1.5×；caret / tag 独立\r
         容器不命中；显式 size / size×scale 乘积走 x-icon 内联恒压本规则（显式即接管） */\r
    .asc-button-body[data-label-pos="top"] .asc-button-icon.as-icon,\r
    .asc-button-body[data-label-pos="bottom"] .asc-button-icon.as-icon,\r
    .asc-button:has(.asc-button-memo) .asc-button-icon.as-icon {\r
      width: calc(var(--auto-icon-size, 1em) * 1.5);\r
      height: calc(var(--auto-icon-size, 1em) * 1.5);\r
    }\r
\r
    .asc-button-icon {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
    }\r
    /* labelPos left：图标（含 loading 位）移 main 之后即按钮内容右端（2026-11-22 布局\r
         调整：tags/caret 已入标签行随 main，原先「与 tags 互换」的 order 协同不再成立）；\r
         横排 = 右侧、纵排 = 下方 */\r
    .asc-button-body[data-label-pos="left"] .asc-button-icon {\r
      order: 5;\r
    }\r
    /* 图标角标（icon.badge 标量三形态启用）：板 padding 承载留白（缺省 2px，可被显式\r
         badge 数值/字符串或 x-icon 的 padding 选项内联覆盖），伪元素红点取 danger 语义色 */\r
    .asc-button-icon-badge {\r
      position: relative;\r
      padding: 2px;\r
    }\r
    .asc-button-icon-badge::after {\r
      content: "";\r
      position: absolute;\r
      top: 0;\r
      right: 0;\r
      width: 0.4em;\r
      height: 0.4em;\r
      border-radius: 50%;\r
      background: var(--auto-danger-color, var(--asc-button-danger, #ef4444));\r
    }\r
\r
    .asc-button-main {\r
      display: flex;\r
      flex-direction: column;\r
      /* stretch + 占满 body 主轴剩余：行容器（line）满宽——tags/caret 的 auto margin\r
         才能贴到按钮右缘；body 的 justify（内容组对齐）随之让位给 line 的行内 justify */\r
      align-items: stretch;\r
      flex: 1 1 auto;\r
      min-width: 0;\r
    }\r
    /* 标签行：label + tags + caret 恒同一行，memo 独占次行（2026-11-22 布局调整）——\r
         对齐（align / menu 左对齐）派生为行内 justify：tags/caret 的 auto margin 优先于\r
         justify，贴右不受对齐影响（无 tags/caret 时 label 按对齐落位） */\r
    .asc-button-line {\r
      display: flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.4em;\r
      min-width: 0;\r
    }\r
    .asc-button-body[data-align="left"] .asc-button-line,\r
    .asc-button-body[data-menu="true"] .asc-button-line {\r
      justify-content: flex-start;\r
    }\r
    .asc-button-body[data-align="right"] .asc-button-line {\r
      justify-content: flex-end;\r
    }\r
    /* label 单行截断（wrap 默认 false，ADR-0012 补记）：溢出显示省略号——截断只在按钮\r
         宽度受约束时发生（block / menu / 容器挤压；inline-flex 收缩到内容宽永不触发）；\r
         max-width 钳制 + 行内 min-width:0（flex item 默认 min-width:auto 不可收缩）是\r
         关键——nowrap 下 min-content 涨至全文宽，无钳制会被 min-content 抬出可用宽\r
         （截断失效）；截断发生时由 mounted 静态检测自动挂 title；wrap=true 回折行\r
         （按钮高度随行数增长，显式声明才换行，防布局被意外撑开） */\r
    .asc-button-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-button-body[data-wrap="true"] .asc-button-label {\r
      white-space: normal;\r
    }\r
    /* 空内容不占位：纯图标用法（label 空）或 labelPos=none 时，行内无可承载体（无可见\r
         label、无 tags、无 caret）且无 memo 则 main 整体隐藏，消除 body gap/行高占位；\r
         tags/caret 在场则保留（labelPos=none 折叠图标条 + 箭头/小圆钮是合法形态）；\r
         插槽有内容时出口非空不命中，不受影响 */\r
    .asc-button-label:empty {\r
      display: none;\r
    }\r
    .asc-button-body:not([data-label-pos="none"])\r
      .asc-button-main:has(> .asc-button-line > .asc-button-label:empty):not(\r
        :has(.asc-button-memo)\r
      ):not(:has(.asc-button-tags)):not(:has(.asc-button-caret)),\r
    .asc-button-body[data-label-pos="none"]\r
      .asc-button-main:not(:has(.asc-button-tags)):not(\r
        :has(.asc-button-caret)\r
      ):not(:has(.asc-button-memo)) {\r
      display: none;\r
    }\r
\r
    /* 备注：小一号 + 相对内容色的淡化（color-mix 跟随 --asc-ink，实底上自然呈淡白）；\r
         最多两行，超出截断显示省略号（line-clamp） */\r
    .asc-button-memo {\r
      font-size: 0.75em;\r
      line-height: 1.2;\r
      color: color-mix(in srgb, var(--asc-ink, currentColor) 70%, transparent);\r
      display: -webkit-box;\r
      -webkit-box-orient: vertical;\r
      -webkit-line-clamp: 2;\r
      line-clamp: 2;\r
      overflow: hidden;\r
    }\r
    /* memo 视觉配平：图标放大已并入上方统一 1.5× 规则（ADR-0138 修订，原独立 2× 规则废除）；\r
         图标与 label+memo 文本块的垂直居中由 body 的 align-items: center 承担 */\r
\r
    /* tags 小圆钮：恒贴标签行右端（margin-left:auto 吸收剩余空间；按钮收缩到内容宽时\r
         退化为紧跟 label，最小间距由行容器 line 的 gap 保证），独立 hover 反馈 */\r
    .asc-button-tags {\r
      display: inline-flex;\r
      gap: 0.15em;\r
      margin-left: auto;\r
    }\r
    /* 尾部方向箭头（caret）：恒居标签行（line）最右；无 tags 时自身吸收剩余空间贴右，\r
         有 tags 时由 tags 的 auto margin 统一推至右端（两个 auto margin 会分摊剩余空间，\r
         使 tags 落点内缩）。方向经 x-icon 的 rotate 选项旋转同一枚 arrow 图标（svg 载体\r
         自带 transition，切换即连续旋转） */\r
    .asc-button-caret {\r
      display: inline-flex;\r
      margin-left: auto;\r
    }\r
    .asc-button-line:has(> .asc-button-tags) > .asc-button-caret {\r
      margin-left: 0;\r
    }\r
    /* 浮动箭头（floatCaret）：脱离标签行流，绝对定位到按钮**右缘**（right 2px）、垂直\r
         三档可选——'top'（右上角，top 与 right 等距 2px）/ 'center'（缺省档，垂直居中\r
         ——横排下即与图标中心线一致）/ 'bottom'（右下角，bottom 与 right 对称 2px）；\r
         尺寸减半（0.5×，宿主+svg 双载体同 tag 图标手法）；叠加形态：不占行内空间，与\r
         tags 并存时叠于其上、label 截断可用宽不含 caret（尾部可能被压，组合自担）。\r
         裸布尔 true 经绑定通道归一 'center' */\r
    .asc-button:has(> .asc-button-body[data-float-caret]) {\r
      position: relative;\r
    }\r
    .asc-button-body[data-float-caret] .asc-button-caret {\r
      position: absolute;\r
      right: 2px;\r
      margin-left: 0;\r
    }\r
    .asc-button-body[data-float-caret="top"] .asc-button-caret {\r
      top: 2px;\r
    }\r
    .asc-button-body[data-float-caret="center"] .asc-button-caret {\r
      top: 50%;\r
      transform: translateY(-50%);\r
    }\r
    .asc-button-body[data-float-caret="bottom"] .asc-button-caret {\r
      bottom: 2px;\r
    }\r
    .asc-button-body[data-float-caret] .asc-button-caret.as-icon,\r
    .asc-button-body[data-float-caret] .asc-button-caret.as-icon > svg {\r
      width: calc(var(--auto-icon-size, 1em) * 0.5);\r
      height: calc(var(--auto-icon-size, 1em) * 0.5);\r
    }\r
    .asc-button-tag-item {\r
      display: contents;\r
    }\r
    .asc-button-tag {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.25em;\r
      height: 1.8rem;\r
      width: 1.8rem;\r
      padding: 0;\r
      font-size: 1rem;\r
      border-radius: 50%;\r
      color: var(--asc-ink);\r
      cursor: pointer;\r
      background: transparent;\r
      transition: background-color 0.15s ease, transform 0.1s ease;\r
    }\r
    .asc-button-tag:hover {\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-ink, currentColor) 28%,\r
        transparent\r
      );\r
    }\r
    /* shape 底板（默认 none 无背景）：circle 圆形底板 / radius 主题圆角底板——板色按内容色\r
         派生淡底（与按钮主背景形成层次）；胶囊 tag 的 9999px 规则后位覆盖 radius 呈胶囊板 */\r
    .asc-button-tag[data-shape="circle"],\r
    .asc-button-tag[data-shape="radius"] {\r
      background: color-mix(in srgb, var(--asc-ink, currentColor) 12%, transparent);\r
    }\r
    .asc-button-tag[data-shape="radius"] {\r
      border-radius: var(--auto-border-radius, 0.25rem);\r
    }\r
    .asc-button-tag:has(> .asc-button-tag-label) {\r
      width: auto;\r
      padding: 0 0.6rem;\r
      border-radius: 9999px;\r
    }\r
    .asc-button-tag-label {\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
    .asc-button-tag:active {\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-ink, currentColor) 45%,\r
        transparent\r
      );\r
      transform: scale(0.88);\r
    }\r
    /* checkable 勾选态（data-checked 属性绑定通道）：语义色（--asc-tone 随宿主 type）淡底 +\r
         内容色转语义色——与常态 hover（ink 淡灰）形成「点亮」区分；同特异性后位覆盖 shape\r
         底板色，hover 加深一档 */\r
    .asc-button-tag[data-checked] {\r
      color: var(--asc-tone, #009aff);\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-tone, #009aff) 22%,\r
        transparent\r
      );\r
    }\r
    .asc-button-tag[data-checked]:hover {\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-tone, #009aff) 34%,\r
        transparent\r
      );\r
    }\r
    /* tag 图标钉死 1rem：不消费 --auto-icon-size（theme 档位 1.2× 会放大）也不随 data-size——\r
         tag 为紧凑小圆钮图标恒小；.as-icon 双类选择器（0,2,0）压过引擎 .as-icon 基础规则\r
         （同特异性但 icon 样式表惰性后注入），svg 撑满宿主规则一并覆盖 */\r
    .asc-button-tag-icon.as-icon,\r
    .asc-button-tag-icon.as-icon > svg {\r
      width: 1rem;\r
      height: 1rem;\r
    }\r
\r
    [dark] .asc-button,\r
    [data-dark] .asc-button {\r
      /* 只兜字色——bg 不在此兜底：各 variant 的专属 dark 块已承接（default/secondary 有暗色底、\r
         primary 恒 tone）；通配 bg 会以同特异性后位覆盖 primary 形态的 --asc-bg: var(--asc-tone)，\r
         dark 下 secondary-bgcolor 派生为主题系色 → 所有语义色实底钮同色（本次修复的回归根因） */\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-variant="primary"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="primary"]) {\r
      /* bg 走 tone 中转（与 light 一致）——直引 --auto-primary-color 会无视 data-type 的语义色，\r
         dark 下所有语义色实底钮同变主色（本次修复的回归根因之二）；dark 兜底值经 tone 第二级 */\r
      --asc-bg: var(--asc-tone);\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]) {\r
      --asc-bg: var(\r
        --auto-secondary-bgcolor,\r
        var(--asc-button-bg, rgba(129, 129, 129, 0.45))\r
      );\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-variant="default"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="default"]) {\r
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #3a3a3a));\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="primary"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #56baff));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="success"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #5cd07c));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="warning"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f0a03c));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="danger"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #e6696a));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="info"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #a1a1aa));\r
    }\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(\r
        [disabled]\r
      ),\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ),\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(\r
        [disabled]\r
      ),\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(\r
        [disabled]\r
      ) {\r
      background: var(\r
        --auto-hover-bgcolor,\r
        var(--asc-button-hover-bg, rgba(255, 255, 255, 0.08))\r
      );\r
    }\r
  </style>\r
  <span\r
    class="asc-button-body"\r
    :data-variant="variant"\r
    :data-type="type"\r
    :data-ghost="ghost"\r
    :data-border="border"\r
    :data-shape="shape"\r
    :data-wrap="wrap"\r
    :data-align="align"\r
    :data-menu="menu"\r
    :data-block="block"\r
    :data-loading="loading"\r
    :data-label-pos="labelPos"\r
    :data-float-caret="typeof floatCaret === 'string' && floatCaret ? floatCaret : (floatCaret === true ? 'center' : null)"\r
    :style="indent ? { paddingLeft: (typeof indent === 'number' ? indent + 'px' : indent) } : undefined"\r
  >\r
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></span>\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'object' && icon"\r
      x-icon="icon.name"\r
      x-icon-options:size="(labelPos==='top'||labelPos==='bottom'||!!memo) ? (icon.size==null ? (typeof icon.scale==='number'&&icon.scale>0 ? 'calc(var(--auto-icon-size, 1em) * '+icon.scale+')' : undefined) : (typeof icon.size==='number' ? icon.size*(typeof icon.scale==='number'&&icon.scale>0?icon.scale:1.5)+'px' : 'calc('+icon.size+' * '+(typeof icon.scale==='number'&&icon.scale>0?icon.scale:1.5)+')')) : icon.size"\r
      x-icon-options:color="icon.color"\r
      x-icon-options:stroke-width="icon.strokeWidth"\r
      x-icon-options:padding="icon.padding"\r
      x-icon-options:shape="icon.shape"\r
      x-icon-options:button="icon.button"\r
      x-icon-options:pointer="icon.pointer"\r
      x-icon-options:rotate="icon.rotate"\r
    ></span>\r
    <span class="asc-button-main">\r
      <span class="asc-button-line">\r
        <span class="asc-button-label" x-show="labelPos !== 'none'" x-slot>{{ displayLabel }}</span>\r
        <span class="asc-button-tags" x-if="tags && tags.length && !hideTags">\r
          <span\r
            class="asc-button-tag-item"\r
            x-for="tag of tags"\r
            :key="tag.name || tag.icon"\r
          >\r
            <i\r
              class="asc-button-tag"\r
              :class="tag.classes"\r
              :title="tag.tooltip"\r
              :style="tag.styles"\r
              :data-shape="tag.shape"\r
              :data-checked="!tag.checkable ? null : (tag.value === (tag.checkValues?.[0] ?? true) ? '' : null)"\r
              @click="onTagClick(tag, $event)"\r
            >\r
              <i class="asc-button-tag-icon" x-if="tag.icon" x-icon="tag.icon"></i>\r
              <span class="asc-button-tag-label" x-if="tag.label">{{ tag.label }}</span>\r
            </i>\r
          </span>\r
        </span>\r
        <span\r
          class="asc-button-caret"\r
          x-if="caret !== 'none'"\r
          x-icon="'arrow'"\r
          :data-caret="caret"\r
          x-icon-options:rotate="caret === 'left' ? 180 : caret === 'bottom' ? 90 : caret === 'top' ? -90 : 0"\r
        ></span>\r
      </span>\r
      <span class="asc-button-memo" x-if="memo && labelPos !== 'none'">{{ memo }}</span>\r
    </span>\r
  </span>\r
</button>\r
`,vr=`autospark.button`;function yr(e){e.components[vr]=_r,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button`))){let e=/^x-(popover|dialog|drawer)([:.-]|$|-options$)/,n=Array.from(t.attributes).filter(t=>e.test(t.name)),r=null;if(n.length){r=document.createElement(`span`);for(let e of n)r.setAttribute(e.name,e.value),t.removeAttribute(e.name)}let i=document.createElement(`button`),a=[];for(let e of Array.from(t.attributes))e.name.startsWith(`:`)?a.push(`${Q(Z(e.name.slice(1)))}: (${e.value})`):e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)?i.setAttribute(e.name,e.value):a.push(`${Q(Z(e.name))}: ${JSON.stringify($(e.value))}`);i.setAttribute(`x-component:${vr}`,`{ ${a.join(`, `)} }`);let o=[];for(let e of Array.from(t.children))e.hasAttribute(`x-define`)&&o.push(e);if(r){t.replaceWith(r);for(let e of o)r.appendChild(e);r.appendChild(i)}else t.replaceWith(i);for(;t.firstChild;)i.appendChild(t.firstChild)}})}br();function br(){y(e=>{m(e),yr(e)})}var xr=`<button\r
  class="asc-state-button"\r
  x-define="autospark.state-button"\r
  x-define:inherit="autospark.button"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            states: undefined,
            value: undefined,
            autoswitch: true,
        }),\r
        mounted() {\r
            const DEFAULT_STATES = [{ value: false }, { value: true, decorate: "corner" }];\r
            const norm = () => {\r
                const raw = this.data.states;\r
                const arr = raw == null ? DEFAULT_STATES : Array.isArray(raw) ? raw : [];\r
                return arr.map((item, i) =>\r
                    typeof item === "object" && item !== null\r
                        ? { ...item, value: Object.hasOwn(item, "value") ? item.value : i }\r
                        : { value: item },\r
                );\r
            };\r
            const boolPair = (() => {\r
                const l = norm();\r
                return l.length === 2 && l.some((s) => s.value === true) && l.some((s) => s.value === false);\r
            })();\r
            const serialize = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));\r
\r
            const BUTTON_PROPS = [\r
                "variant", "type", "label", "labelPos", "icon", "loading", "ghost", "border",\r
                "block", "disabled", "ripple", "autoInsertSpace", "shape", "wrap", "align",\r
                "indent", "memo", "tags", "menu",\r
            ];\r
\r
            let base = null;\r
            let labelSpan = null;\r
            let labelIsFallback = false;\r
            const deriveLabel = (t) =>\r
                this.data.autoInsertSpace && /^[一-龥]{2}$/.test(t ?? "") ? t[0] + " " + t[1] : String(t ?? "");\r
            let prevCls = [];\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
\r
            const real = document.createElement("input");\r
            real.type = boolPair ? "checkbox" : "hidden";\r
            real.style.display = "none";\r
            const nameAttr = this.el.getAttribute("name");\r
            if (nameAttr != null) real.name = nameAttr;\r
            this.el.appendChild(real);\r
\r
            const syncVisual = () => {\r
                const list = norm();\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                const st = cur ?? {};\r
                for (const k of ["asc-d-solid", "asc-d-check", "asc-d-corner", "asc-d-ripple", "asc-p-check", "asc-p-ripple", "asc-unmatched"]) {\r
                    this.el.classList.remove(k);\r
                }\r
                if (typeof st.decorate === "string" && st.decorate) this.el.classList.add("asc-d-" + st.decorate);\r
                if (list.some((s) => s.decorate === "check")) this.el.classList.add("asc-p-check");\r
                if (list.some((s) => s.decorate === "ripple")) this.el.classList.add("asc-p-ripple");\r
                this.el.classList.toggle("asc-unmatched", cur === null);\r
                this.el.setAttribute("data-value", serialize(this.data.value));\r
                if (boolPair) {\r
                    real.checked = cur !== null && cur.value === true;\r
                    real.value = String(list.find((s) => s.value === true)?.value ?? true);\r
                } else {\r
                    real.value = serialize(this.data.value);\r
                }\r
                if (base) {\r
                    let rippleInjected;\r
                    for (const k of BUTTON_PROPS) {\r
                        if (k === "ripple") {\r
                            rippleInjected = Object.hasOwn(st, k) ? st[k] : base[k];\r
                            continue;\r
                        }\r
                        this.data[k] = Object.hasOwn(st, k) ? st[k] : base[k];\r
                    }\r
                    this.data.ripple = this.el.classList.contains("asc-d-ripple")\r
                        ? { trigger: "always", inside: false, type: "echo" }\r
                        : rippleInjected;\r
                }\r
                if (labelSpan && labelIsFallback) labelSpan.textContent = deriveLabel(Object.hasOwn(st, "label") && st.label != null ? st.label : base?.label ?? "");\r
                this.el.style.cssText = base.cssText + (typeof st.style === "string" && st.style.trim() ? (base.cssText.trim().endsWith(";") || !base.cssText.trim() ? "" : ";") + st.style : "");\r
                if (prevCls.length) for (const c of prevCls) this.el.classList.remove(c);\r
                prevCls = typeof st.class === "string" && st.class.trim() ? st.class.trim().split(/\\s+/) : [];\r
                for (const c of prevCls) this.el.classList.add(c);\r
                if (st.tooltip != null && String(st.tooltip) !== "") {\r
                    if (!selfTip && this.el.getAttribute(tipAttr)) {\r
                    }\r
                    this.el.setAttribute(tipAttr, String(st.tooltip));\r
                    selfTip = true;\r
                } else if (selfTip) {\r
                    this.el.removeAttribute(tipAttr);\r
                    selfTip = false;\r
                }\r
            };\r
\r
            const proto = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, "value");\r
            if (boolPair) {\r
                Object.defineProperty(this.el, "value", {\r
                    get: () => proto.get.call(this.el),\r
                    set: (v) => {\r
                        proto.set.call(this.el, v);\r
                        this.data.value = v === "true";\r
                        setTimeout(syncVisual, 0);\r
                    },\r
                    configurable: true,\r
                });\r
            }\r
\r
            this.el.addEventListener("click", () => {\r
                if (this.el.disabled || this.data.autoswitch === false) return;\r
                const list = norm();\r
                if (list.length < 2) return;
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                if (cur && cur.clickable === false) return;
                const index = cur ? (list.indexOf(cur) + 1) % list.length : 0;\r
                const next = list[index];\r
                this.data.value = next.value;\r
                syncVisual();\r
                if (boolPair) {\r
                    proto.set.call(this.el, String(next.value === true));\r
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                }\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next.value, index, state: next } }));\r
            });\r
\r
            const previewCorner = (on) => {\r
                this.el.classList.toggle("asc-corner-preview", on);\r
            };\r
            this.el.addEventListener("pointerdown", () => {\r
                if (this.el.disabled || this.data.autoswitch === false) return;\r
                const list = norm();\r
                if (list.length < 2) return;\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                if (cur && cur.clickable === false) return;\r
                const next = cur ? list[(list.indexOf(cur) + 1) % list.length] : list[0];\r
                previewCorner(next?.decorate === "corner");\r
            });\r
            this.el.addEventListener("pointerup", () => previewCorner(false));\r
            this.el.addEventListener("pointerleave", () => previewCorner(false));\r
            this.el.addEventListener("pointercancel", () => previewCorner(false));\r
\r
            setTimeout(() => {\r
                const list = norm();\r
                if (boolPair) {\r
                    const raw = proto.get.call(this.el);\r
                    if (raw === "true") this.data.value = true;\r
                    else if (raw === "false") this.data.value = false;\r
                }\r
                if (this.data.value === undefined && list.length > 0) this.data.value = list[0].value;\r
                base = { cssText: this.el.style.cssText };\r
                for (const k of BUTTON_PROPS) base[k] = this.data[k];\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (span && span.textContent === deriveLabel(base.label)) {\r
                    labelSpan = span;\r
                    labelIsFallback = true;\r
                }\r
                syncVisual();\r
            }, 0);\r
            this.watch("value", () => { syncVisual(); });\r
            this.watch("states", () => { setTimeout(syncVisual, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-state-button">\r
    /* ---------- 装饰 solid：当前态佩戴 = tone 实底 + 反白字（覆盖 variant 表达；!important\r
         压过 :has 变体规则族——继承拼接的父样式在前，级联后者胜 + important 双保险） ---------- */\r
    .asc-state-button.asc-d-solid {\r
      --asc-bg: var(--asc-tone) !important;\r
      --asc-ink: #fff !important;\r
      --asc-line: transparent !important;\r
    }\r
\r
    /* ---------- 装饰 check：组内任一态佩戴（asc-p-check）即 body 最前常驻 1.2em 占位\r
         （未佩戴态留空、零布局跳动）；当前态佩戴（asc-d-check）显 tone 色 yes ---------- */\r
    .asc-state-button.asc-p-check > .asc-button-body::before {\r
      content: "";\r
      flex: none;\r
      width: 1.2em;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      color: var(--asc-tone);\r
      font-size: 0.9em;\r
      font-weight: bold;\r
    }\r
    .asc-state-button.asc-d-check > .asc-button-body::before {\r
      content: "✓";\r
    }\r
\r
    /* 三角 = 渐变盒（对角线分割、右上半着色）；尺寸 = min(圆角半径 ×2.5, 2.5em, 按钮高 50%)\r
         ——高度基准 + aspect-ratio 方形推导，圆角档位切换自动跟随；外描边走 box-shadow（视觉\r
         等价 outline、跟随圆角、绘制路径独立，不受涟漪载体播放期色块遮挡）。**无缝贴合**：\r
         描边画在 border 外缘、absolute 定位基准是 padding box（border 内缘）——border 消隐\r
         （--asc-line: transparent，占位保留零布局影响）、三角 -2px 跨过 1px border 区直抵\r
         描边内缘（三角与描边零间隙） */\r
    .asc-state-button.asc-d-corner {\r
      --asc-corner: min(\r
        calc(var(--auto-border-radius, 0.5rem) * 2.5),\r
        2.5em,\r
        50%\r
      );\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone);\r
      position: relative;
    }\r
    .asc-state-button.asc-d-corner::after {\r
      content: "";\r
      position: absolute;\r
      top: -2px;\r
      right: -2px;\r
      height: calc(var(--asc-corner) + 2px);\r
      aspect-ratio: 1 / 1;\r
      border-top-right-radius: min(\r
        calc(var(--auto-border-radius, 0.5rem) + 1px),\r
        1.4em\r
      );\r
      background: linear-gradient(\r
        to bottom left,\r
        var(--asc-tone) 49.5%,\r
        transparent 50%\r
      );\r
      z-index: 1;\r
    }\r
    /* 反白小勾：定位于三角重心（对角线中点向直角方向）——系数基准同 --asc-corner（含 50%\r
         高度上限同步缩放），-2px 补偿三角盒越出量，确保落在三角内部 */\r
    .asc-state-button.asc-d-corner::before {\r
      content: "";\r
      position: absolute;\r
      top: calc(var(--asc-corner) * 0.24 - 2px);\r
      right: calc(var(--asc-corner) * 0.14 - 2px);\r
      z-index: 2;\r
      width: calc(var(--asc-corner) * 0.36);\r
      aspect-ratio: 2 / 1;\r
      border-left: 1.5px solid var(--auto-bgcolor, #fff);\r
      border-bottom: 1.5px solid var(--auto-bgcolor, #fff);\r
      transform: rotate(-45deg);\r
    }\r
    /* 按压预览：下一态佩戴 corner 时 JS 挂 asc-corner-preview 预显描边（松手切换正式化、\r
         按住拖出取消随按压消失——化解「松手才见描边」迟滞感；当前已佩戴则本体描边在场不重复） */\r
    .asc-state-button.asc-corner-preview:not(.asc-d-corner) {\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone);\r
    }\r
\r
    /* ---------- 装饰 ripple：佩戴视觉 = 宿主整体恒开 echo 双环涟漪（mounted 经 data.ripple\r
         单通道由父 syncRipple 挂载 { trigger: "always", inside: false, type: "echo" }——\r
         需页面加载 autospark.ripple.js，未加载静默无指示）；无占位指示器 ---------- */\r
\r
    /* ---------- 灰色无匹配态：中性灰覆盖 variant/type（「未处于任何状态」的元语义不属于\r
         任何形态/语义色表达）；pointer + hover 轻反馈——可点击是硬需求，与 disabled 的\r
         opacity 0.55 + not-allowed 明确分野 ---------- */\r
    .asc-state-button.asc-unmatched {\r
      --asc-bg: transparent;\r
      --asc-ink: color-mix(\r
        in srgb,\r
        var(--auto-color, #606060) 60%,\r
        transparent\r
      ) !important;\r
      --asc-line: color-mix(\r
        in srgb,\r
        var(--auto-color, #606060) 40%,\r
        transparent\r
      ) !important;\r
      cursor: pointer;\r
    }\r
    .asc-state-button.asc-unmatched:hover:not([disabled]) {\r
      filter: none;\r
      background: var(\r
        --auto-hover-bgcolor,\r
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))\r
      );\r
    }\r
    /* 暗色兜底（ADR-0129）：灰阶字色走 dark 校准值（--auto-color 暗色下自动反转，\r
       此处仅兜第三级字面值） */\r
    [dark] .asc-state-button.asc-unmatched,\r
    [data-dark] .asc-state-button.asc-unmatched {\r
      --asc-ink: color-mix(\r
        in srgb,\r
        var(--auto-color, #fafafa) 55%,\r
        transparent\r
      ) !important;\r
    }\r
  </style>\r
</button>\r
`,Sr=`autospark.state-button`;function Cr(e){e.components[Sr]=xr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-state-button`))){let e=document.createElement(`button`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Sr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}wr();function wr(){y(e=>{m(e),Cr(e)})}var Tr=`<span
  class="asc-text"
  x-define="autospark.text"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            label: "",
            type: "default",
            strong: false,
            ellipsis: false,
            copyable: false,
            copied: false,
        }),
        methods: {
            onCopyClick(event) {
                event.stopPropagation();
                const conf = this.data.copyable;
                const text = (typeof conf === "object" && conf && conf.text != null)
                    ? String(conf.text)
                    : String(this.el.querySelector(".asc-text-content")?.textContent ?? "");
                const succeed = () => {
                    this.data.copied = true;
                    this.el.dispatchEvent(new CustomEvent("copy", { bubbles: true, detail: { text } }));
                    setTimeout(() => { this.data.copied = false; }, 1500);
                };
                if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                    navigator.clipboard.writeText(text).then(succeed, (err) => {
                        console.warn("[autospark.text] 复制失败（需安全上下文 https/localhost 且授权剪贴板）：", err);
                    });
                } else {
                    console.warn("[autospark.text] 当前环境不支持 navigator.clipboard（需安全上下文 https/localhost）");
                }
            },
        },
        mounted() {
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";
            let selfTip = false;
            const syncTip = () => {
                const content = this.data.ellipsis ? this.el.querySelector(".asc-text-content") : null;
                if (!content) {
                    if (selfTip) { this.el.removeAttribute(tipAttr); selfTip = false; }
                    return;
                }
                const overflow = this.data.ellipsis === true
                    ? content.scrollWidth > content.clientWidth
                    : content.scrollHeight > content.clientHeight;
                if (overflow) {
                    if (this.el.getAttribute(tipAttr) && !selfTip) return;
                    this.el.setAttribute(tipAttr, content.textContent ?? "");
                    selfTip = true;
                } else if (selfTip) {
                    this.el.removeAttribute(tipAttr);
                    selfTip = false;
                }
            };
            setTimeout(syncTip, 0);
            this.watch("label", () => { setTimeout(syncTip, 0); });
            this.watch("ellipsis", () => { setTimeout(syncTip, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-text">
    .asc-text {
      font-size: var(--auto-font-size, var(--asc-text-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-text-line-height, 1.5));
    }
    /* 变体承载 body：文本层级/语义色（--auto-* 语义变量三级回退链，ADR-0129；
         兜底字面值取 theme 默认 blue 主题 light 校准值，对齐 button 同款色板） */
    .asc-text-body {
      color: var(--auto-color, var(--asc-text-color, #606060));
    }
    .asc-text-body[data-type="secondary"] {
      color: var(--auto-secondary-color, var(--asc-text-secondary, rgba(0, 0, 0, 0.55)));
    }
    .asc-text-body[data-type="third"] {
      color: var(--auto-third-color, var(--asc-text-third, rgba(0, 0, 0, 0.35)));
    }
    .asc-text-body[data-type="primary"] {
      color: var(--auto-primary-color, var(--asc-text-primary, #009aff));
    }
    .asc-text-body[data-type="success"] {
      color: var(--auto-success-color, var(--asc-text-success, #22c55e));
    }
    .asc-text-body[data-type="warning"] {
      color: var(--auto-warning-color, var(--asc-text-warning, #f59e0b));
    }
    .asc-text-body[data-type="danger"] {
      color: var(--auto-danger-color, var(--asc-text-danger, #ef4444));
    }
    .asc-text-body[data-type="info"] {
      color: var(--auto-info-color, var(--asc-text-info, #71717a));
    }
    .asc-text-body[data-strong="true"] {
      font-weight: var(--x-font-weight-large, 600);
    }

    /* 文本出口：ellipsis 单行省略号（inline-block 才可截断；vertical-align 微调
         保持与行内文本基线视觉一致）。截断发生在宽度受约束时（容器挤压/显式限宽） */
    .asc-text-ellipsis {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
    /* 多行截断（line-clamp n 行）：行数经 --asc-text-lines 变量由 :style 内联下发
         （:style 自定义属性键引擎走 setProperty 通道）；标准/前缀双写保兼容 */
    .asc-text-clamp {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: var(--asc-text-lines, 3);
      line-clamp: var(--asc-text-lines, 3);
      overflow: hidden;
    }

    /* 复制按钮：内联小图标（随字号 1em），独立 hover 反馈；复制成功窗内换勾图标 +
         success 语义色点亮（data-copied 属性通道）；复制文本为空仍可点击（反馈不误报） */
    .asc-text-copy {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.25em;
      color: var(--auto-third-color, var(--asc-text-copy-color, rgba(0, 0, 0, 0.35)));
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-text-copy-radius, 0.25rem));
      transition: color 0.15s ease;
    }
    .asc-text-copy:hover {
      color: var(--auto-color, var(--asc-text-color, #606060));
    }
    .asc-text-copy[data-copied] {
      color: var(--auto-success-color, var(--asc-text-success, #22c55e));
    }

    [dark] .asc-text-body,
    [data-dark] .asc-text-body {
      color: var(--auto-color, var(--asc-text-color, #fafafa));
    }
    [dark] .asc-text-body[data-type="secondary"],
    [data-dark] .asc-text-body[data-type="secondary"] {
      color: var(--auto-secondary-color, var(--asc-text-secondary, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-text-body[data-type="third"],
    [data-dark] .asc-text-body[data-type="third"] {
      color: var(--auto-third-color, var(--asc-text-third, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-text-body[data-type="primary"],
    [data-dark] .asc-text-body[data-type="primary"] {
      color: var(--auto-primary-color, var(--asc-text-primary, #56baff));
    }
    [dark] .asc-text-body[data-type="success"],
    [data-dark] .asc-text-body[data-type="success"] {
      color: var(--auto-success-color, var(--asc-text-success, #5cd07c));
    }
    [dark] .asc-text-body[data-type="warning"],
    [data-dark] .asc-text-body[data-type="warning"] {
      color: var(--auto-warning-color, var(--asc-text-warning, #f0a03c));
    }
    [dark] .asc-text-body[data-type="danger"],
    [data-dark] .asc-text-body[data-type="danger"] {
      color: var(--auto-danger-color, var(--asc-text-danger, #e6696a));
    }
    [dark] .asc-text-body[data-type="info"],
    [data-dark] .asc-text-body[data-type="info"] {
      color: var(--auto-info-color, var(--asc-text-info, #a1a1aa));
    }
    [dark] .asc-text-copy,
    [data-dark] .asc-text-copy {
      color: var(--auto-third-color, var(--asc-text-copy-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-text-copy:hover,
    [data-dark] .asc-text-copy:hover {
      color: var(--auto-color, var(--asc-text-color, #fafafa));
    }
    [dark] .asc-text-copy[data-copied],
    [data-dark] .asc-text-copy[data-copied] {
      color: var(--auto-success-color, var(--asc-text-success, #5cd07c));
    }
  </style>
  <span
    class="asc-text-body"
    :data-type="type"
    :data-strong="strong"
    :data-copyable="!!copyable"
  >
    <span
      class="asc-text-content"
      x-class="ellipsis === true ? 'asc-text-ellipsis' : (typeof ellipsis === 'number' && ellipsis > 0 ? 'asc-text-clamp' : null)"
      :style="typeof ellipsis === 'number' && ellipsis > 0 ? { '--asc-text-lines': ellipsis } : undefined"
      x-slot
    >{{ label }}</span>
    <i
      class="asc-text-copy"
      x-if="!!copyable"
      :data-copied="copied ? '' : null"
      x-icon="copied ? 'yes' : 'copy'"
      @click="onCopyClick($event)"
    ></i>
  </span>
</span>
`,Er=`autospark.text`;function Dr(e){e.components[Er]=Tr}Or();function Or(){y(e=>{m(e),Dr(e)})}var kr=`<a
  class="asc-link"
  x-define="autospark.link"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            label: "",
            href: "",
            target: "",
            type: "primary",
            icon: "",
            disabled: false,
            underline: "hover",
        }),
        mounted() {
            const syncNative = () => {
                const el = this.el;
                const d = this.data;
                const explicitRel = el.getAttribute("rel");
                if (d.disabled) {
                    el.removeAttribute("href");
                    el.setAttribute("aria-disabled", "true");
                } else {
                    el.removeAttribute("aria-disabled");
                    if (d.href) el.setAttribute("href", d.href);
                    else el.removeAttribute("href");
                    if (String(d.target).includes("_blank") && !explicitRel) el.setAttribute("rel", "noopener");
                    else if (!explicitRel) el.removeAttribute("rel");
                }
                if (d.target) el.setAttribute("target", d.target);
                else el.removeAttribute("target");
            };
            syncNative();
            this.watch("href", () => { syncNative(); });
            this.watch("target", () => { syncNative(); });
            this.watch("disabled", () => { syncNative(); });

            this.el.addEventListener("click", (e) => {
                if (this.data.disabled) e.preventDefault();
            });
        },
    }
  <\/script>
  <style global id="autospark-components-link">
    .asc-link {
      /* 语义色中转（data-type 注入）+ 排版基线：字号经主题档位通道（data-size →
         --auto-font-size 全跟随，button 同范式 ADR-0012） */
      --asc-tone: var(--auto-primary-color, var(--asc-link-primary, #009aff));
      color: var(--asc-tone);
      font-size: var(--auto-font-size, var(--asc-link-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.15s ease, filter 0.15s ease;
    }
    .asc-link:has(> .asc-link-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-link-primary, #009aff));
    }
    .asc-link:has(> .asc-link-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-link-success, #22c55e));
    }
    .asc-link:has(> .asc-link-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-link-warning, #f59e0b));
    }
    .asc-link:has(> .asc-link-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-link-danger, #ef4444));
    }
    .asc-link:has(> .asc-link-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-link-info, #71717a));
    }
    .asc-link:has(> .asc-link-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-link-color, #606060));
    }

    .asc-link:has(> .asc-link-body[data-underline="hover"]):hover:not([aria-disabled="true"]) {
      text-decoration: underline;
    }
    .asc-link:has(> .asc-link-body[data-underline="always"]) {
      text-decoration: underline;
    }

    .asc-link:hover:not([aria-disabled="true"]) {
      filter: brightness(0.9);
    }
    .asc-link[aria-disabled="true"] {
      color: var(--auto-disable-color, var(--asc-link-disable-color, rgba(0, 0, 0, 0.25)));
      cursor: not-allowed;
      filter: none;
    }
    /* 非链接态（href 空）：呈现为可交互文本提示（无下划线、常规指针），语义色保留；
         禁用态（同无 href）保持 not-allowed 指针——排除以免后位覆盖 */
    .asc-link:not([href]):not([aria-disabled="true"]) {
      cursor: default;
    }
    .asc-link:not([href]):hover {
      filter: none;
    }

    .asc-link-body {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      min-width: 0;
    }
    .asc-link-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .asc-link-label:empty {
      display: none;
    }

    [dark] .asc-link,
    [data-dark] .asc-link {
      --asc-tone: var(--auto-primary-color, var(--asc-link-primary, #56baff));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="success"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-link-success, #5cd07c));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="warning"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-link-warning, #f0a03c));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="danger"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-link-danger, #e6696a));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="info"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-link-info, #a1a1aa));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="default"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-link-color, #fafafa));
    }
    [dark] .asc-link[aria-disabled="true"],
    [data-dark] .asc-link[aria-disabled="true"] {
      color: var(--auto-disable-color, var(--asc-link-disable-color, rgba(255, 255, 255, 0.25)));
    }
  </style>
  <span
    class="asc-link-body"
    :data-type="type"
    :data-underline="underline"
  >
    <i
      class="asc-link-icon"
      x-if="typeof icon === 'string' && icon"
      x-icon="icon"
    ></i>
    <i
      class="asc-link-icon"
      x-if="typeof icon === 'object' && icon && icon.name"
      x-icon="icon.name"
    ></i>
    <span class="asc-link-label" x-slot>{{ label }}</span>
  </span>
</a>
`,Ar=`autospark.link`;function jr(e){e.components[Ar]=kr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-link`))){let e=document.createElement(`a`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`rel`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Ar}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Mr();function Mr(){y(e=>{m(e),jr(e)})}var Nr=`<div\r
  class="asc-divider"\r
  x-define="autospark.divider"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            vertical: false,
            dashed: false,
            align: "center",
            spacing: "",
        }),\r
        mounted() {\r
            const syncSpacing = () => {\r
                const el = this.el;\r
                el.style.removeProperty("margin-top");\r
                el.style.removeProperty("margin-bottom");\r
                el.style.removeProperty("margin-left");\r
                el.style.removeProperty("margin-right");\r
                const s = this.data.spacing;\r
                if (s === "" || s == null) return;\r
                const v = typeof s === "number" ? s + "px" : s;\r
                if (this.data.vertical) {\r
                    el.style.marginLeft = v;\r
                    el.style.marginRight = v;\r
                } else {\r
                    el.style.marginTop = v;\r
                    el.style.marginBottom = v;\r
                }\r
            };\r
            syncSpacing();\r
            this.watch("spacing", () => { syncSpacing(); });\r
            this.watch("vertical", () => { syncSpacing(); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-divider">\r
    .asc-divider {\r
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #d9d9d9));\r
      border: 0;\r
      margin: 0;\r
      font-size: var(--auto-font-size, var(--asc-divider-font-size, 0.875rem));\r
    }\r
    .asc-divider {\r
      display: block;\r
      width: 100%;\r
    }\r
    .asc-divider-body {\r
      display: flex;\r
      align-items: center;\r
      width: 100%;\r
    }\r
    .asc-divider-body::before,\r
    .asc-divider-body::after {\r
      content: "";\r
      flex: 1;\r
      border-top: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);\r
    }\r
    .asc-divider-body[data-dashed="true"]::before,\r
    .asc-divider-body[data-dashed="true"]::after {\r
      border-top-style: dashed;\r
    }\r
\r
    .asc-divider-body[data-align="left"]::before {\r
      flex: 0 0 0.5em;\r
    }\r
    .asc-divider-body[data-align="right"]::after {\r
      flex: 0 0 0.5em;\r
    }\r
\r
    .asc-divider-text {\r
      margin: 0 1em;\r
      color: var(--auto-color, var(--asc-divider-text-color, #606060));\r
      white-space: nowrap;\r
    }\r
    .asc-divider-text:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 垂直态（vertical）：宿主行内化、body 纵排、线段换 border-left；\r
         高度默认 0.9em（--asc-divider-length 可覆盖；flex 容器内由使用者以\r
         class/样式控制满高）---------- */\r
    .asc-divider:has(> .asc-divider-body[data-vertical="true"]) {\r
      display: inline-block;\r
      width: auto;\r
      height: var(--asc-divider-length, 0.9em);\r
      vertical-align: middle;\r
    }\r
    .asc-divider-body[data-vertical="true"] {\r
      display: inline-flex;\r
      flex-direction: column;\r
      align-items: center;\r
      width: auto;\r
      height: 100%;\r
    }\r
    .asc-divider-body[data-vertical="true"]::before,\r
    .asc-divider-body[data-vertical="true"]::after {\r
      flex: 1;\r
      width: 0;\r
      border-top: 0;\r
      border-left: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);\r
    }\r
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::before,\r
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::after {\r
      border-left-style: dashed;\r
    }\r
    .asc-divider-body[data-vertical="true"] .asc-divider-text {\r
      display: none;\r
    }\r
\r
    [dark] .asc-divider,\r
    [data-dark] .asc-divider {\r
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #52525b));\r
    }\r
    [dark] .asc-divider-text,\r
    [data-dark] .asc-divider-text {\r
      color: var(--auto-color, var(--asc-divider-text-color, #fafafa));\r
    }\r
  </style>\r
  <span\r
    class="asc-divider-body"\r
    :data-vertical="vertical"\r
    :data-dashed="dashed"\r
    :data-align="align"\r
  >\r
    <span class="asc-divider-text" x-slot></span>\r
  </span>\r
</div>\r
`,Pr=`autospark.divider`;function Fr(e){e.components[Pr]=Nr}Ir();function Ir(){y(e=>{m(e),Fr(e)})}var Lr=`<div
  class="asc-space"
  x-define="autospark.space"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            size: "medium",
            direction: "horizontal",
            align: "center",
            wrap: false,
        }),
        mounted() {
            const TIERS = ["x-small", "small", "medium", "large", "x-large"];
            const syncSize = () => {
                const body = this.el.querySelector(".asc-space-body");
                if (!body) return;
                body.style.removeProperty("row-gap");
                body.style.removeProperty("column-gap");
                const s = this.data.size;
                if (s == null || (typeof s === "string" && TIERS.includes(s))) return;
                const norm = (v) => (typeof v === "number" ? v + "px" : String(v));
                let row, col;
                if (Array.isArray(s)) {
                    col = norm(s[0]);
                    row = norm(s[1] ?? s[0]);
                } else {
                    row = col = norm(s);
                }
                body.style.rowGap = row;
                body.style.columnGap = col;
            };
            setTimeout(syncSize, 0);
            this.watch("size", () => { setTimeout(syncSize, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-space">
    .asc-space {
      display: block;
    }
    /* body：唯一 flex 容器；缺省间距 medium 档（--auto-spacing 联动 theme spacing
         档位，theme 档位跟随）；--asc-space-gap 为使用者覆盖通道（压全档） */
    .asc-space-body {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--asc-space-gap, var(--auto-spacing, var(--x-spacing-medium)));
      width: 100%;
      min-width: 0;
    }
    .asc-space-body[data-direction="vertical"] {
      flex-direction: column;
      align-items: flex-start;
    }
    .asc-space-body[data-align="start"] {
      align-items: flex-start;
    }
    .asc-space-body[data-align="center"] {
      align-items: center;
    }
    .asc-space-body[data-align="end"] {
      align-items: flex-end;
    }
    .asc-space-body[data-align="baseline"] {
      align-items: baseline;
    }
    .asc-space-body[data-wrap="true"] {
      flex-wrap: wrap;
    }

    /* ---------- 间距档位（CSS 变量档）：--x-spacing-* 标尺五档直取（语义层无间距
         梯度派生变量）；medium 档经 --auto-spacing 接通 theme spacing 档位 ---------- */
    .asc-space-body[data-gap="x-small"] {
      gap: var(--asc-space-gap, var(--x-spacing-x-small));
    }
    .asc-space-body[data-gap="small"] {
      gap: var(--asc-space-gap, var(--x-spacing-small));
    }
    .asc-space-body[data-gap="medium"] {
      gap: var(--asc-space-gap, var(--auto-spacing, var(--x-spacing-medium)));
    }
    .asc-space-body[data-gap="large"] {
      gap: var(--asc-space-gap, var(--x-spacing-large));
    }
    .asc-space-body[data-gap="x-large"] {
      gap: var(--asc-space-gap, var(--x-spacing-x-large));
    }

    .asc-space-slot {
      display: contents;
    }
  </style>
  <div
    class="asc-space-body"
    :data-direction="direction"
    :data-align="align"
    :data-wrap="wrap"
    :data-gap="size"
  >
    <div class="asc-space-slot" x-slot></div>
  </div>
</div>
`,Rr=`autospark.space`;function zr(e){e.components[Rr]=Lr}Br();function Br(){y(e=>{m(e),zr(e)})}var Vr=`<div
  class="asc-grid"
  x-define="autospark.grid"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            cols: 3,
            gap: 0,
            justify: "start",
            align: "stretch",
        }),
        mounted() {
            const TIERS = ["x-small", "small", "medium", "large", "x-large"];
            const syncGap = () => {
                const body = this.el.querySelector(".asc-grid-body");
                if (!body) return;
                body.style.removeProperty("row-gap");
                body.style.removeProperty("column-gap");
                const s = this.data.gap;
                if (s == null || (typeof s === "string" && TIERS.includes(s))) return;
                const norm = (v) => (typeof v === "number" ? v + "px" : String(v));
                let row, col;
                if (Array.isArray(s)) {
                    col = norm(s[0]);
                    row = norm(s[1] ?? s[0]);
                } else {
                    row = col = norm(s);
                }
                body.style.rowGap = row;
                body.style.columnGap = col;
            };

            const BREAKPOINTS = { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 };
            const TIER_ORDER = ["xxl", "xl", "lg", "md", "sm"];
            const MQLS_KEY = "_ascGridMqls";
            const unbindMqls = (body) => {
                for (const { mql, fn } of body[MQLS_KEY] ?? []) {
                    if (mql.removeEventListener) mql.removeEventListener("change", fn);
                    else if (mql.removeListener) mql.removeListener(fn);
                }
                body[MQLS_KEY] = [];
            };
            const tierCols = (cols) => {
                for (const t of TIER_ORDER) {
                    if (cols[t] == null) continue;
                    if (typeof window?.matchMedia === "function"
                        && window.matchMedia(\`(min-width: \${BREAKPOINTS[t]}px)\`).matches) return cols[t];
                }
                return cols.xs ?? 1;
            };
            const syncCols = () => {
                const body = this.el.querySelector(".asc-grid-body");
                if (!body) return;
                body.style.removeProperty("--asc-grid-cols");
                unbindMqls(body);
                const c = this.data.cols;
                if (typeof c === "number") {
                    body.style.setProperty("--asc-grid-cols", String(Math.max(1, Math.floor(c))));
                } else if (c && typeof c === "object") {
                    const pairs = [];
                    if (typeof window?.matchMedia === "function") {
                        for (const t of TIER_ORDER) {
                            if (c[t] == null) continue;
                            const mql = window.matchMedia(\`(min-width: \${BREAKPOINTS[t]}px)\`);
                            const fn = () => { setTimeout(syncCols, 0); };
                            if (mql.addEventListener) mql.addEventListener("change", fn);
                            else if (mql.addListener) mql.addListener(fn);
                            pairs.push({ mql, fn });
                        }
                    }
                    body[MQLS_KEY] = pairs;
                    body.style.setProperty("--asc-grid-cols", String(Math.max(1, Math.floor(tierCols(c)))));
                }
            };
            setTimeout(() => { syncGap(); syncCols(); }, 0);
            this.watch("gap", () => { setTimeout(syncGap, 0); });
            this.watch("cols", () => { setTimeout(syncCols, 0); });
        },
        unmounted() {
            const body = this.el?.querySelector?.(".asc-grid-body");
            if (body) {
                for (const { mql, fn } of body["_ascGridMqls"] ?? []) {
                    if (mql.removeEventListener) mql.removeEventListener("change", fn);
                    else if (mql.removeListener) mql.removeListener(fn);
                }
                body["_ascGridMqls"] = [];
            }
        },
    }
  <\/script>
  <style global id="autospark-components-grid">
    .asc-grid {
      display: block;
    }
    /* body：唯一 grid 容器；列数经 --asc-grid-cols 变量（JS 通道写入，使用者亦可
         在祖先声明同名变量定制——元素级内联优先）；minmax(0, 1fr) 防子项
         min-width:auto 撑破轨道（长文本/媒体不换行陷阱）；--asc-grid-gap 为
         间隙使用者覆盖通道 */
    .asc-grid-body {
      display: grid;
      grid-template-columns: repeat(var(--asc-grid-cols, 3), minmax(0, 1fr));
      gap: var(--asc-grid-gap, 0);
      width: 100%;
    }
    /* 自适应列（cols="auto"）：auto-fill 按容器宽自动列数，最小列宽
         --asc-grid-min（缺省 16rem，使用者覆盖通道） */
    .asc-grid-body[data-cols-mode="auto"] {
      grid-template-columns: repeat(auto-fill, minmax(var(--asc-grid-min, 16rem), 1fr));
    }
    /* ---------- 间隙档位（CSS 变量档）：与 space 同构（--x-spacing-* 标尺五档；
         medium 档经 --auto-spacing 接通 theme spacing 档位）---------- */
    .asc-grid-body[data-gap="x-small"] {
      gap: var(--asc-grid-gap, var(--x-spacing-x-small));
    }
    .asc-grid-body[data-gap="small"] {
      gap: var(--asc-grid-gap, var(--x-spacing-small));
    }
    .asc-grid-body[data-gap="medium"] {
      gap: var(--asc-grid-gap, var(--auto-spacing, var(--x-spacing-medium)));
    }
    .asc-grid-body[data-gap="large"] {
      gap: var(--asc-grid-gap, var(--x-spacing-large));
    }
    .asc-grid-body[data-gap="x-large"] {
      gap: var(--asc-grid-gap, var(--x-spacing-x-large));
    }

    /* ---------- 轨道水平分布（justify，列宽不满容器时有效；缺省 start 即 CSS
         缺省 normal 不写块）---------- */
    .asc-grid-body[data-justify="center"] {
      justify-content: center;
    }
    .asc-grid-body[data-justify="end"] {
      justify-content: end;
    }
    .asc-grid-body[data-justify="between"] {
      justify-content: space-between;
    }
    .asc-grid-body[data-justify="around"] {
      justify-content: space-around;
    }
    .asc-grid-body[data-justify="evenly"] {
      justify-content: space-evenly;
    }

    .asc-grid-body[data-align="start"] {
      align-items: start;
    }
    .asc-grid-body[data-align="center"] {
      align-items: center;
    }
    .asc-grid-body[data-align="end"] {
      align-items: end;
    }
    .asc-grid-body[data-align="baseline"] {
      align-items: baseline;
    }

    .asc-grid-slot {
      display: contents;
    }
  </style>
  <div
    class="asc-grid-body"
    :data-justify="justify"
    :data-align="align"
    :data-gap="gap"
    :data-cols-mode="cols === 'auto' ? 'auto' : null"
  >
    <div class="asc-grid-slot" x-slot></div>
  </div>
</div>
`,Hr=`autospark.grid`;function Ur(e){e.components[Hr]=Vr}Wr();function Wr(){y(e=>{m(e),Ur(e)})}var Gr=`<div
  class="asc-container"
  x-define="autospark.container"
  x-define:inherit="autospark.base"
  x-define-options="{tag:false}"
>
  <script setup>
    {
        data: () => ({
            asidePosition: "start",
        }),
    }
  <\/script>
  <style global id="autospark-components-container">
    /* 宿主：透明块壳（高度语义：满父高——容器壳的价值在四区自分割，父级应给定高度；
         未给定高度时 1fr 主区退化为内容高） */
    .asc-container {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 12rem;
      font-size: var(--auto-font-size, var(--asc-container-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      color: var(--auto-color, var(--asc-container-color, #606060));
    }

    /* ---------- body：四区 grid 版式载体（编译子树内层，绑定可求值） ----------
       区域模板（start 缺省）：header 横贯顶 / aside 左栏 / main 主区 / footer 横贯底 */
    .asc-container-body {
      --asc-line: var(--auto-border-color, var(--asc-container-border-color, #d9d9d9));
      display: grid;
      width: 100%;
      height: 100%;
      grid-template-columns: auto 1fr;
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        "header header"
        "aside main"
        "footer footer";
    }
    .asc-container-body[data-aside="end"] {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "header header"
        "main aside"
        "footer footer";
    }

    .asc-container-header {
      grid-area: header;
      display: flex;
      align-items: center;
      gap: 0.6em;
      min-width: 0;
      padding: calc(var(--auto-padding, var(--asc-container-padding, 0.8rem)) * 0.75)
        var(--auto-padding, var(--asc-container-padding, 0.8rem));
      background: var(--auto-panel-header-bgcolor, var(--auto-secondary-bgcolor, var(--asc-container-header-bg, rgba(245, 245, 245, 0.45))));
      border-bottom: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
      font-weight: var(--x-font-weight-large, 600);
    }
    .asc-container-aside {
      grid-area: aside;
      display: block;
      min-width: 0;
      width: var(--asc-container-aside-width, auto);
      padding: var(--auto-padding, var(--asc-container-padding, 0.8rem));
      background: var(--auto-secondary-bgcolor, var(--asc-container-aside-bg, rgba(245, 245, 245, 0.25)));
      overflow: auto;
    }
    .asc-container-body[data-aside="end"] .asc-container-aside {
      border-left: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
    }
    .asc-container-body:not([data-aside="end"]) .asc-container-aside {
      border-right: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
    }
    .asc-container-main {
      grid-area: main;
      display: block;
      min-width: 0;
      min-height: 0;
      padding: var(--auto-padding, var(--asc-container-padding, 0.8rem));
      overflow: auto;
    }
    .asc-container-footer {
      grid-area: footer;
      display: flex;
      align-items: center;
      gap: 0.6em;
      min-width: 0;
      padding: calc(var(--auto-padding, var(--asc-container-padding, 0.8rem)) * 0.75)
        var(--auto-padding, var(--asc-container-padding, 0.8rem));
      border-top: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
    }
    .asc-container-header:empty,
    .asc-container-aside:empty,
    .asc-container-main:empty,
    .asc-container-footer:empty {
      display: none;
    }

    [dark] .asc-container,
    [data-dark] .asc-container {
      color: var(--auto-color, var(--asc-container-color, #fafafa));
    }
    [dark] .asc-container-body,
    [data-dark] .asc-container-body {
      --asc-line: var(--auto-border-color, var(--asc-container-border-color, #52525b));
    }
    [dark] .asc-container-header,
    [data-dark] .asc-container-header {
      background: var(--auto-panel-header-bgcolor, var(--auto-secondary-bgcolor, var(--asc-container-header-bg, rgba(129, 129, 129, 0.18))));
    }
    [dark] .asc-container-aside,
    [data-dark] .asc-container-aside {
      background: var(--auto-secondary-bgcolor, var(--asc-container-aside-bg, rgba(129, 129, 129, 0.1)));
    }
  </style>
  <div class="asc-container-body" :data-aside="asidePosition">
    <header class="asc-container-header" x-slot:header></header>
    <aside class="asc-container-aside" x-slot:aside></aside>
    <main class="asc-container-main" x-slot></main>
    <footer class="asc-container-footer" x-slot:footer></footer>
  </div>
</div>
`,Kr=`autospark.container`,qr={"x-container-header":`header`,"x-container-aside":`aside`,"x-container-footer":`footer`,"x-container-main":null};function Jr(e){e.components[Kr]=Gr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-container`))){let e=document.createElement(`div`);for(let e of Array.from(t.children)){let t=qr[e.tagName.toLowerCase()];if(t===void 0)continue;if(t===null){e.replaceWith(...Array.from(e.childNodes));continue}let n=document.createElement(`template`);for(n.setAttribute(`x-slot:${t}`,``);e.firstChild;)n.content.appendChild(e.firstChild);e.replaceWith(n)}let n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Kr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Yr();function Yr(){y(e=>{m(e),Jr(e)})}var Xr=`<div
  class="asc-alert"
  x-define="autospark.alert"
  x-define:inherit="autospark.base"
  role="alert"
>
  <script setup>
    {
        data: () => ({
            type: "default",
            title: "",
            description: "",
            closable: false,
            icon: "",
            banner: false,
            closed: false,
            displayIcon: (s) => s.icon === false ? "" : (typeof s.icon === "object" && s.icon) ? (s.icon.name ?? "") : (typeof s.icon === "string" && s.icon ? s.icon : (s.type === "success" ? "success" : s.type === "warning" ? "warn" : s.type === "danger" ? "error" : s.type === "info" ? "info" : "bell"))
        }),
        methods: {
            onCloseClick(event) {
                event.stopPropagation();
                this.data.closed = true;
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
        },
        mounted() {
            const syncClosed = () => {
                if (this.data.closed) this.el.setAttribute("data-closed", "");
                else this.el.removeAttribute("data-closed");
            };
            syncClosed();
            this.watch("closed", () => { syncClosed(); });
        },
    }
  <\/script>
  <style global id="autospark-components-alert">
    /* 语义色基线（ADR-0018 决策 6.4，语义色体系在非 button 组件的首个落地——组织方式
       可复制）：--asc-tone 中转变量 + body data-type 变体属性经 :has() 反驱宿主，
       与 button ADR-0012 同款结构；警示条形态 = 语义色淡底（tone 10%）+ 语义色
       半透明边框（tone 38%）+ 标题/图标取 tone、描述取正文色 */
    .asc-alert {
      --asc-tone: var(--auto-color, var(--asc-alert-default, #606060));
      --asc-pad: var(--auto-padding, var(--asc-alert-padding, 0.8rem));
      display: flex;
      box-sizing: border-box;
      padding: calc(var(--asc-pad) * 0.7) calc(var(--asc-pad) * 0.85);
      border: var(--auto-border-size, var(--asc-alert-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-tone) 38%, transparent);
      border-radius: var(
        --auto-border-radius,
        var(--asc-alert-radius, 0.5rem)
      );
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
      color: var(--auto-color, var(--asc-alert-color, #606060));
      font-size: var(--auto-font-size, var(--asc-alert-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-alert-line-height, 1.5));
    }
    .asc-alert:has(> .asc-alert-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-alert-success, #22c55e));
    }
    .asc-alert:has(> .asc-alert-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-alert-warning, #f59e0b));
    }
    .asc-alert:has(> .asc-alert-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-alert-danger, #ef4444));
    }
    .asc-alert:has(> .asc-alert-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-alert-info, #71717a));
    }

    .asc-alert:has(> .asc-alert-body[data-banner="true"]) {
      border-radius: 0;
    }

    .asc-alert[data-closed] {
      display: none;
    }

    .asc-alert-body {
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      min-width: 0;
    }
    .asc-alert-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25em;
      color: var(--asc-tone);
      flex-shrink: 0;
    }
    .asc-alert-main {
      display: flex;
      flex-direction: column;
      gap: 0.2em;
      flex: 1;
      min-width: 0;
    }
    .asc-alert-title {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
    .asc-alert-desc:empty {
      display: none;
    }
    .asc-alert-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.15em;
      color: var(
        --auto-third-color,
        var(--asc-alert-close-color, rgba(0, 0, 0, 0.35))
      );
      cursor: pointer;
      flex-shrink: 0;
      border-radius: var(
        --auto-border-radius,
        var(--asc-alert-close-radius, 0.25rem)
      );
      transition: color 0.15s ease;
    }
    .asc-alert-close:hover {
      color: var(--auto-color, var(--asc-alert-close-hover, #606060));
    }

    [dark] .asc-alert,
    [data-dark] .asc-alert {
      --asc-tone: var(--auto-color, var(--asc-alert-default, #fafafa));
      color: var(--auto-color, var(--asc-alert-color, #fafafa));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="success"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-alert-success, #5cd07c));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="warning"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-alert-warning, #f0a03c));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="danger"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-alert-danger, #e6696a));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="info"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-alert-info, #a1a1aa));
    }
    [dark] .asc-alert-close,
    [data-dark] .asc-alert-close {
      color: var(
        --auto-third-color,
        var(--asc-alert-close-color, rgba(255, 255, 255, 0.45))
      );
    }
    [dark] .asc-alert-close:hover,
    [data-dark] .asc-alert-close:hover {
      color: var(--auto-color, var(--asc-alert-close-hover, #fafafa));
    }
  </style>
  <div class="asc-alert-body" :data-type="type" :data-banner="banner">
    <i class="asc-alert-icon" x-if="displayIcon" x-icon="displayIcon"></i>
    <div class="asc-alert-main">
      <span class="asc-alert-title" x-if="title">{{ title }}</span>
      <span class="asc-alert-desc" x-slot>{{ description }}</span>
    </div>
    <i
      class="asc-alert-close"
      x-if="closable"
      x-icon="'no'"
      @click="onCloseClick($event)"
    ></i>
  </div>
</div>
`,Zr=`autospark.alert`;function Qr(e){e.components[Zr]=Xr}$r();function $r(){y(e=>{m(e),Qr(e)})}var ei=`<div
  class="asc-progress"
  x-define="autospark.progress"
  x-define:inherit="autospark.base"
  role="progressbar"
>
  <script setup>
    {
        data: () => ({
            percent: 0,
            variant: "line",
            status: "",
            showText: true,
            strokeWidth: 6,
            displayPercent: (s) => Math.min(100, Math.max(0, Number(s.percent) || 0)),
            displayStatus: (s) => s.status ? s.status : (Number(s.percent) >= 100 ? "success" : null),
        }),
        mounted() {
            const syncAria = () => {
                const v = Math.min(100, Math.max(0, Number(this.data.percent) || 0));
                this.el.setAttribute("aria-valuemin", "0");
                this.el.setAttribute("aria-valuemax", "100");
                this.el.setAttribute("aria-valuenow", String(v));
            };
            syncAria();
            this.watch("percent", () => { syncAria(); });

            const syncCircle = () => {
                const svg = this.el.querySelector(".asc-progress-svg");
                if (!svg) return;
                const raw = this.data.strokeWidth;
                const sw = typeof raw === "number" ? raw : parseFloat(String(raw)) || 6;
                const r = Math.max(0, 50 - sw / 2);
                const pct = Math.min(100, Math.max(0, Number(this.data.percent) || 0));
                const c = 2 * Math.PI * r;
                for (const ring of [svg.querySelector(".asc-progress-ring-track"), svg.querySelector(".asc-progress-ring-bar")]) {
                    if (!ring) continue;
                    ring.setAttribute("r", String(r));
                    ring.setAttribute("stroke-width", String(sw));
                }
                const bar = svg.querySelector(".asc-progress-ring-bar");
                if (bar) {
                    bar.setAttribute("stroke-dasharray", String(c));
                    bar.setAttribute("stroke-dashoffset", String(c * (1 - pct / 100)));
                }
            };
            setTimeout(syncCircle, 0);
            this.watch("percent", () => { setTimeout(syncCircle, 0); });
            this.watch("strokeWidth", () => { setTimeout(syncCircle, 0); });
            this.watch("variant", () => { setTimeout(syncCircle, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-progress">
    /* 语义色组织（alert 同款已定型结构，ADR-0018 决策 6.4）：--asc-tone 中转变量 +
       body data-status 变体属性经 :has() 反驱宿主；缺省 tone = 主色（进行中），
       status 三档切对应语义色 */
    .asc-progress {
      --asc-tone: var(--auto-primary-color, var(--asc-progress-primary, #009aff));
      display: flex;
      box-sizing: border-box;
      font-size: var(--auto-font-size, var(--asc-progress-font-size, 0.875rem));
      color: var(--auto-color, var(--asc-progress-color, #606060));
      line-height: var(--auto-line-height, var(--asc-progress-line-height, 1.5));
    }
    .asc-progress:has(> .asc-progress-body[data-status="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-progress-success, #22c55e));
    }
    .asc-progress:has(> .asc-progress-body[data-status="error"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-progress-error, #ef4444));
    }
    .asc-progress:has(> .asc-progress-body[data-status="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-progress-warning, #f59e0b));
    }

    .asc-progress-body {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      min-width: 0;
    }
    .asc-progress-body[data-variant="circle"] {
      display: block;
      width: var(--asc-progress-size, var(--asc-progress-diameter, 7.5rem));
      height: var(--asc-progress-size, var(--asc-progress-diameter, 7.5rem));
      gap: 0;
    }

    .asc-progress-track {
      flex: 1;
      min-width: 0;
      height: var(--asc-progress-sw, 6px);
      border-radius: 9999px;
      overflow: hidden;
      background: var(--auto-third-bgcolor, var(--asc-progress-track, rgba(0, 0, 0, 0.08)));
    }
    .asc-progress-bar {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--asc-tone);
      transition: width 0.3s ease;
    }

    /* ---------- 形态互斥（CSS data-variant 分支）：SVG 元素上的指令不被编译
         （compiler transformer 只认 HTMLElement 的引擎边界），line/circle 切换
         走纯 CSS 显隐——两形态结构恒在场，不重建、无编译依赖 ---------- */
    .asc-progress-svg {
      display: none;
    }
    .asc-progress-body[data-variant="circle"] .asc-progress-svg {
      display: block;
    }
    .asc-progress-body[data-variant="circle"] .asc-progress-track {
      display: none;
    }

    /* rotate(-90deg) 起点转正上方；r / stroke-width / dasharray / dashoffset 的
         几何初值写在静态属性（mounted 一跳内由 JS 通道按 strokeWidth 与 percent 重算） */
    .asc-progress-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .asc-progress-ring-track {
      fill: none;
      stroke: var(--auto-third-bgcolor, var(--asc-progress-track, rgba(0, 0, 0, 0.08)));
    }
    .asc-progress-ring-bar {
      fill: none;
      stroke: var(--asc-tone);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }

    .asc-progress-text {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 2.5em;
      font-size: 0.75em;
      color: var(--auto-secondary-color, var(--asc-progress-text-color, rgba(0, 0, 0, 0.55)));
      white-space: nowrap;
    }
    .asc-progress-icon {
      font-size: 1.1em;
      color: var(--asc-tone);
    }
    .asc-progress-body[data-variant="circle"] .asc-progress-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1em;
      min-width: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-progress-bar,
      .asc-progress-ring-bar {
        transition: none;
      }
    }

    [dark] .asc-progress,
    [data-dark] .asc-progress {
      --asc-tone: var(--auto-primary-color, var(--asc-progress-primary, #56baff));
      color: var(--auto-color, var(--asc-progress-color, #fafafa));
    }
    [dark] .asc-progress:has(> .asc-progress-body[data-status="success"]),
    [data-dark] .asc-progress:has(> .asc-progress-body[data-status="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-progress-success, #5cd07c));
    }
    [dark] .asc-progress:has(> .asc-progress-body[data-status="error"]),
    [data-dark] .asc-progress:has(> .asc-progress-body[data-status="error"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-progress-error, #e6696a));
    }
    [dark] .asc-progress:has(> .asc-progress-body[data-status="warning"]),
    [data-dark] .asc-progress:has(> .asc-progress-body[data-status="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-progress-warning, #f0a03c));
    }
    [dark] .asc-progress-track,
    [dark] .asc-progress-ring-track,
    [data-dark] .asc-progress-track,
    [data-dark] .asc-progress-ring-track {
      background: var(--auto-third-bgcolor, var(--asc-progress-track, rgba(255, 255, 255, 0.12)));
      stroke: var(--auto-third-bgcolor, var(--asc-progress-track, rgba(255, 255, 255, 0.12)));
    }
    [dark] .asc-progress-text,
    [data-dark] .asc-progress-text {
      color: var(--auto-secondary-color, var(--asc-progress-text-color, rgba(255, 255, 255, 0.65)));
    }
  </style>
  <div
    class="asc-progress-body"
    :data-variant="variant"
    :data-status="displayStatus"
    :style="{ '--asc-progress-sw': (typeof strokeWidth === 'number' ? strokeWidth + 'px' : strokeWidth) }"
  >
    <span class="asc-progress-track">
      <span class="asc-progress-bar" :style="{ width: displayPercent + '%' }"></span>
    </span>
    <svg class="asc-progress-svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="asc-progress-ring-track" cx="50" cy="50" r="47" stroke-width="6"></circle>
      <circle
        class="asc-progress-ring-bar"
        cx="50"
        cy="50"
        r="47"
        stroke-width="6"
        stroke-dasharray="295.31"
        stroke-dashoffset="295.31"
      ></circle>
    </svg>
    <span class="asc-progress-text" x-show="showText">
      <i class="asc-progress-icon" x-if="displayStatus === 'success'" x-icon="'success'"></i>
      <i class="asc-progress-icon" x-if="displayStatus === 'error'" x-icon="'error'"></i>
      <i class="asc-progress-icon" x-if="displayStatus === 'warning'" x-icon="'warn'"></i>
      <span class="asc-progress-pct" x-if="!displayStatus">{{ displayPercent + '%' }}</span>
    </span>
  </div>
</div>
`,ti=`autospark.progress`;function ni(e){e.components[ti]=ei}ri();function ri(){y(e=>{m(e),ni(e)})}var ii=`<div
  class="asc-skeleton"
  x-define="autospark.skeleton"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            variant: "text",
            rows: 0,
            loading: true,
            animated: true,
            rowList: (s) => Array.from({ length: (s.variant === "text" ? Math.max(1, Math.floor(Number(s.rows) || 1)) : 1) }, (_, k) => k + 1),
        }),
    }
  <\/script>
  <style global id="autospark-components-skeleton">
    .asc-skeleton {
      --asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 10%, transparent);
      --asc-skel-hi: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 5%, transparent);
      display: flex;
      box-sizing: border-box;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-skeleton-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-skeleton-line-height, 1.5));
    }
    .asc-skeleton-items,
    .asc-skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 0.6em;
      width: 100%;
      min-width: 0;
    }

    .asc-skeleton-item {
      display: block;
      width: 100%;
      height: 1em;
      border-radius: var(--auto-border-radius, var(--asc-skeleton-radius, 0.25rem));
      background: var(--asc-skel-base);
      flex-shrink: 0;
    }
    .asc-skeleton-item[data-last] {
      width: 60%;
    }
    .asc-skeleton-body[data-variant="circle"] .asc-skeleton-item {
      width: 2.5em;
      height: 2.5em;
      border-radius: 50%;
    }
    .asc-skeleton-body[data-variant="rect"] .asc-skeleton-item {
      height: 5em;
      border-radius: var(--auto-border-radius, var(--asc-skeleton-radius, 0.5rem));
    }

    .asc-skeleton-items[data-animated="true"] .asc-skeleton-item {
      background: linear-gradient(
        90deg,
        var(--asc-skel-base) 25%,
        var(--asc-skel-hi) 37%,
        var(--asc-skel-base) 63%
      );
      background-size: 400% 100%;
      animation: asc-skeleton-wave 1.4s ease infinite;
    }
    @keyframes asc-skeleton-wave {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .asc-skeleton-items[data-animated="true"] .asc-skeleton-item {
        animation: none;
      }
    }

    [dark] .asc-skeleton,
    [data-dark] .asc-skeleton {
      --asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #fafafa)) 12%, transparent);
      --asc-skel-hi: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #fafafa)) 6%, transparent);
    }
  </style>
  <div class="asc-skeleton-body" :data-variant="variant">
    <span class="asc-skeleton-content" x-show="!loading" x-slot></span>
    <span class="asc-skeleton-items" x-show="loading" aria-hidden="true" :data-animated="animated">
      <span class="asc-skeleton-row" x-for="i of rowList" :key="i">
        <i class="asc-skeleton-item" :data-last="(i === rowList.length)"></i>
      </span>
    </span>
  </div>
</div>
`,ai=`autospark.skeleton`;function oi(e){e.components[ai]=ii}si();function si(){y(e=>{m(e),oi(e)})}var ci=`<div
  class="asc-message-box"
  x-define="autospark.message-box"
  x-define:inherit="autospark.base"
  role="alertdialog"
  aria-modal="true"
>
  <script setup>
    {
        data: () => ({
            type: "info",
            title: "",
            content: "",
            confirmText: "",
            cancelText: "",
            confirmType: "",
            showCancel: true,
            confirmBtnType: (s) => s.confirmType || (s.type === "danger" ? "danger" : "primary"),
            displayIcon: (s) => (s.type === "success" ? "success" : s.type === "warning" ? "warn" : s.type === "danger" ? "error" : "info"),
        }),
        methods: {
            onAction(event) {
                const btn = event.target instanceof Element ? event.target.closest("[data-mb-action]") : null;
                if (!btn || btn.disabled) return;
                const action = btn.getAttribute("data-mb-action");
                if (action !== "confirm" && action !== "cancel") return;
                this.el.dispatchEvent(new CustomEvent(action, { bubbles: true }));
                this.el.dispatchEvent(new CustomEvent("action:close", { bubbles: true }));
            },
        },
    }
  <\/script>
  <style global id="autospark-components-message-box">
    /* 语义色组织（alert 同款已定型结构，ADR-0018 决策 6.4）：--asc-tone 中转变量 +
       body data-type 变体属性经 :has() 反驱宿主——图标/确认钮色联动单源 */
    .asc-message-box {
      --asc-tone: var(--auto-info-color, var(--asc-message-box-info, #71717a));
      --asc-pad: var(--auto-padding, var(--asc-message-box-padding, 0.8rem));
      display: flex;
      box-sizing: border-box;
      min-width: 22rem;
      max-width: 32rem;
      padding: calc(var(--asc-pad) * 0.9) calc(var(--asc-pad) * 1.1);
      font-size: var(--auto-font-size, var(--asc-message-box-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-message-box-line-height, 1.5));
      color: var(--auto-color, var(--asc-message-box-color, #606060));
    }
    .asc-message-box:has(> .asc-message-box-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-message-box-success, #22c55e));
    }
    .asc-message-box:has(> .asc-message-box-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-message-box-warning, #f59e0b));
    }
    .asc-message-box:has(> .asc-message-box-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-message-box-danger, #ef4444));
    }

    .asc-message-box-body {
      display: flex;
      flex-direction: column;
      gap: calc(var(--asc-pad) * 1.1);
      width: 100%;
      min-width: 0;
    }
    .asc-message-box-main {
      display: flex;
      align-items: flex-start;
      gap: 0.7em;
      min-width: 0;
    }
    .asc-message-box-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      line-height: 1;
      color: var(--asc-tone);
      flex-shrink: 0;
    }
    .asc-message-box-text {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      flex: 1;
      min-width: 0;
      padding-top: 0.1em;
    }
    .asc-message-box-title {
      font-size: 1.1em;
      font-weight: var(--x-font-weight-medium, 500);
      color: var(--auto-color, var(--asc-message-box-title-color, #303030));
    }
    .asc-message-box-content {
      color: var(--auto-secondary-color, var(--asc-message-box-content-color, rgba(0, 0, 0, 0.55)));
      white-space: pre-wrap;
      word-break: break-word;
    }

    .asc-message-box-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.6em;
    }

    [dark] .asc-message-box,
    [data-dark] .asc-message-box {
      --asc-tone: var(--auto-info-color, var(--asc-message-box-info, #a1a1aa));
      color: var(--auto-color, var(--asc-message-box-color, #fafafa));
    }
    [dark] .asc-message-box:has(> .asc-message-box-body[data-type="success"]),
    [data-dark] .asc-message-box:has(> .asc-message-box-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-message-box-success, #5cd07c));
    }
    [dark] .asc-message-box:has(> .asc-message-box-body[data-type="warning"]),
    [data-dark] .asc-message-box:has(> .asc-message-box-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-message-box-warning, #f0a03c));
    }
    [dark] .asc-message-box:has(> .asc-message-box-body[data-type="danger"]),
    [data-dark] .asc-message-box:has(> .asc-message-box-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-message-box-danger, #e6696a));
    }
    [dark] .asc-message-box-title,
    [data-dark] .asc-message-box-title {
      color: var(--auto-color, var(--asc-message-box-title-color, #fafafa));
    }
    [dark] .asc-message-box-content,
    [data-dark] .asc-message-box-content {
      color: var(--auto-secondary-color, var(--asc-message-box-content-color, rgba(255, 255, 255, 0.65)));
    }
  </style>
  <div class="asc-message-box-body" :data-type="type">
    <div class="asc-message-box-main">
      <i class="asc-message-box-icon" x-icon="displayIcon"></i>
      <div class="asc-message-box-text">
        <div class="asc-message-box-title" x-if="title">{{ title }}</div>
        <div class="asc-message-box-content" x-slot>{{ content }}</div>
      </div>
    </div>
    <div class="asc-message-box-actions" @click="onAction($event)">
      <span class="asc-message-box-cancel" x-if="showCancel">
        <button
          x-component:autospark.button="{
            variant: 'default',
            autoInsertSpace: false,
            label: cancelText || (t('message-box.cancel') === 'message-box.cancel' ? '取消' : t('message-box.cancel'))
          }"
          data-mb-action="cancel"
        ></button>
      </span>
      <button
        x-component:autospark.button="{
          variant: 'primary',
          type: confirmBtnType,
          autoInsertSpace: false,
          label: confirmText || (t('message-box.confirm') === 'message-box.confirm' ? '确定' : t('message-box.confirm'))
        }"
        data-mb-action="confirm"
      ></button>
    </div>
  </div>
</div>
`,li=`autospark.message-box`,ui=`message-box`;function di(e){e.components[li]=ci,e.components[ui]=ci}fi();function fi(){y(e=>{m(e),di(e)})}var pi=`<div
  class="asc-result"
  x-define="autospark.result"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "info",
            title: "",
            description: "",
            displayIcon: (s) => (s.type === "success" ? "success" : s.type === "error" ? "error" : s.type === "warning" ? "warn" : "info"),
        }),
    }
  <\/script>
  <style global id="autospark-components-result">
    /* 语义色组织（alert 同款定型结构，ADR-0018 决策 6.4）：--asc-tone 中转变量 +
       body data-type 变体属性经 :has() 反驱宿主——大图标色单源 */
    .asc-result {
      --asc-tone: var(--auto-info-color, var(--asc-result-info, #71717a));
      --asc-pad: var(--auto-padding, var(--asc-result-padding, 0.8rem));
      display: flex;
      justify-content: center;
      box-sizing: border-box;
      width: 100%;
      padding: calc(var(--asc-pad) * 1.5) var(--asc-pad);
      font-size: var(--auto-font-size, var(--asc-result-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      color: var(--auto-color, var(--asc-result-color, #606060));
    }
    .asc-result:has(> .asc-result-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-result-success, #22c55e));
    }
    .asc-result:has(> .asc-result-body[data-type="error"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-result-danger, #ef4444));
    }
    .asc-result:has(> .asc-result-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-result-warning, #f59e0b));
    }

    .asc-result-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.6em;
      max-width: 100%;
      min-width: 0;
    }
    .asc-result-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 4em;
      line-height: 1;
      color: var(--asc-tone);
    }
    .asc-result-title {
      font-size: 1.25em;
      font-weight: var(--x-font-weight-medium, 500);
      color: var(--auto-color, var(--asc-result-title-color, #303030));
    }
    .asc-result-desc {
      max-width: 36em;
      color: var(--auto-secondary-color, var(--asc-result-desc-color, rgba(0, 0, 0, 0.55)));
      word-break: break-word;
    }
    .asc-result-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.6em;
      margin-top: 0.6em;
    }
    .asc-result-actions:empty {
      display: none;
    }

    [dark] .asc-result,
    [data-dark] .asc-result {
      --asc-tone: var(--auto-info-color, var(--asc-result-info, #a1a1aa));
      color: var(--auto-color, var(--asc-result-color, #fafafa));
    }
    [dark] .asc-result:has(> .asc-result-body[data-type="success"]),
    [data-dark] .asc-result:has(> .asc-result-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-result-success, #5cd07c));
    }
    [dark] .asc-result:has(> .asc-result-body[data-type="error"]),
    [data-dark] .asc-result:has(> .asc-result-body[data-type="error"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-result-danger, #e6696a));
    }
    [dark] .asc-result:has(> .asc-result-body[data-type="warning"]),
    [data-dark] .asc-result:has(> .asc-result-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-result-warning, #f0a03c));
    }
    [dark] .asc-result-title,
    [data-dark] .asc-result-title {
      color: var(--auto-color, var(--asc-result-title-color, #fafafa));
    }
    [dark] .asc-result-desc,
    [data-dark] .asc-result-desc {
      color: var(--auto-secondary-color, var(--asc-result-desc-color, rgba(255, 255, 255, 0.65)));
    }
  </style>
  <div class="asc-result-body" :data-type="type">
    <span class="asc-result-icon" x-slot:icon><i class="asc-result-glyph" x-icon="displayIcon"></i></span>
    <div class="asc-result-title" x-if="title">{{ title }}</div>
    <div class="asc-result-desc" x-if="description">{{ description }}</div>
    <div class="asc-result-actions" x-slot></div>
  </div>
</div>
`,mi=`autospark.result`;function hi(e){e.components[mi]=pi}gi();function gi(){y(e=>{m(e),hi(e)})}var _i=`<div\r
  class="asc-card"\r
  x-define="autospark.card"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            title: "",
            bordered: true,
            hoverable: false,
            collapsible: false,
            collapsed: false,
        }),\r
        methods: {\r
            onHeadClick() {\r
                if (!this.data.collapsible) return;\r
                this.data.collapsed = !this.data.collapsed;\r
                this.el.dispatchEvent(new CustomEvent("collapse", { bubbles: true, detail: { collapsed: this.data.collapsed } }));\r
            },\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-card">\r
    /* 宿主：透明块壳（盒子样式全在 inner），仅承载块级排版与字号基线\r
         （--auto-font-size 随 data-size 档位全跟随，button 同范式 ADR-0012） */\r
    .asc-card {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-card-font-size, 0.875rem));\r
    }\r
\r
    .asc-card-inner {\r
      --asc-pad: var(--auto-padding, var(--asc-card-padding, 0.8rem));\r
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #d9d9d9));\r
      display: flex;\r
      flex-direction: column;\r
      background: var(--auto-bgcolor, var(--asc-card-bg, #ffffff));\r
      border: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(--auto-border-radius, var(--asc-card-radius, 0.5rem));\r
      /* 阴影走 theme 手动通道：data-shadow 档位在 theme 在场时覆写 --auto-shadow，\r
           缺省兜底为极轻投影（对齐 theme 默认 medium 档校准值） */\r
      box-shadow: var(--auto-shadow, var(--asc-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04)));\r
      transition: box-shadow 0.2s ease, border-color 0.2s ease;\r
    }\r
    .asc-card-inner[data-borderless="true"] {\r
      --asc-line: transparent;\r
    }\r
    .asc-card-inner[data-hoverable="true"]:hover {\r
      border-color: var(--auto-primary-color, var(--asc-card-primary, #009aff));\r
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));\r
    }\r
\r
    .asc-card-head {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-bottom: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
      font-weight: var(--x-font-weight-large, 600);
      line-height: 1.4;\r
    }\r
    .asc-card-head:has(> .asc-card-toggle > .asc-card-head-main:empty):has(\r
        > .asc-card-extra:empty\r
      ):not(:has(.asc-card-arrow)) {\r
      display: none;\r
    }\r
    .asc-card-toggle {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.4em;\r
      min-width: 0;\r
      flex: 1;\r
    }\r
    .asc-card-head[data-collapsible="true"] .asc-card-toggle {\r
      cursor: pointer;\r
      user-select: none;\r
    }\r
    .asc-card-head-main {\r
      min-width: 0;\r
    }\r
    .asc-card-arrow {\r
      display: inline-flex;\r
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(0, 0, 0, 0.35)));\r
      transform: rotate(90deg);\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-card-head[data-collapsed="true"] .asc-card-arrow {\r
      transform: rotate(0deg);\r
    }\r
    .asc-card-extra {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.4em;\r
    }\r
    .asc-card-extra:empty {\r
      display: none;\r
    }\r
\r
    .asc-card-body {\r
      flex: 1;\r
      padding: var(--asc-pad);\r
    }\r
    .asc-card-body:empty {\r
      display: none;\r
    }\r
\r
    .asc-card-footer {\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-top: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
    }\r
    .asc-card-footer:empty {\r
      display: none;\r
    }\r
\r
    [dark] .asc-card-inner,\r
    [data-dark] .asc-card-inner {\r
      background: var(--auto-bgcolor, var(--asc-card-bg, #3a3a3a));\r
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #52525b));\r
    }\r
    [dark] .asc-card-inner[data-hoverable="true"]:hover,\r
    [data-dark] .asc-card-inner[data-hoverable="true"]:hover {\r
      border-color: var(--auto-primary-color, var(--asc-card-primary, #56baff));\r
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.4));\r
    }\r
    [dark] .asc-card-arrow,\r
    [data-dark] .asc-card-arrow {\r
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(255, 255, 255, 0.45)));\r
    }\r
  </style>\r
  <div\r
    class="asc-card-inner"\r
    :data-borderless="!bordered"\r
    :data-hoverable="hoverable"\r
  >\r
    <div\r
      class="asc-card-head"\r
      :data-collapsible="collapsible"\r
      :data-collapsed="collapsed"\r
    >\r
      <div class="asc-card-toggle" @click="onHeadClick()">\r
        <i class="asc-card-arrow" x-if="collapsible" x-icon="'arrow'"></i>\r
        <div class="asc-card-head-main" x-slot:header>{{ title }}</div>\r
      </div>\r
      <div class="asc-card-extra" x-slot:extra></div>\r
    </div>\r
    <div class="asc-card-body" x-show="!collapsed" x-slot></div>\r
    <div class="asc-card-footer" x-show="!collapsed" x-slot:footer></div>\r
  </div>\r
</div>\r
`,vi=`autospark.card`;function yi(e){e.components[vi]=_i}bi();function bi(){y(e=>{m(e),yi(e)})}var xi=`<span\r
  class="asc-tag"\r
  x-define="autospark.tag"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            type: "default",
            variant: "light",
            icon: "",
            closable: false,
            closed: false,
        }),\r
        methods: {\r
            onCloseClick(event) {\r
                event.stopPropagation();\r
                const ev = new CustomEvent("close", { bubbles: true, cancelable: true, detail: { event } });\r
                this.el.dispatchEvent(ev);\r
                if (!ev.defaultPrevented) this.data.closed = true;\r
            },\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-tag">\r
    /* 宿主即标签盒子：--asc-tone 语义色中转（data-type 注入）+ 三通道变量（data-variant 注入）；\r
         内距以 em 标定——随字号（data-size 档位 → --auto-font-size）自动缩放 */\r
    .asc-tag {\r
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));\r
      --asc-bg: color-mix(in srgb, var(--asc-tone, #606060) 10%, transparent);\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 38%, transparent);\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.25em;\r
      padding: 0.15em 0.6em;\r
      font-size: var(--auto-font-size, var(--asc-tag-font-size, 0.75rem));\r
      line-height: 1.5;\r
      border: var(--auto-border-size, var(--asc-tag-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));\r
      background: var(--asc-bg);\r
      color: var(--asc-ink);\r
      cursor: default;\r
      user-select: none;\r
      transition: filter 0.15s ease;\r
    }\r
\r
    .asc-tag:has(> .asc-tag-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #009aff));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #22c55e));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f59e0b));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #ef4444));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #71717a));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="default"]) {\r
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));\r
    }\r
\r
    .asc-tag:has(> .asc-tag-body[data-variant="solid"]) {\r
      --asc-bg: var(--asc-tone);\r
      --asc-ink: #fff;\r
      --asc-line: transparent;\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-variant="outline"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 55%, transparent);\r
    }\r
\r
    .asc-tag:has(> .asc-tag-body[data-closed="true"]) {\r
      display: none;\r
    }\r
\r
    .asc-tag-body {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.25em;\r
      min-width: 0;\r
    }\r
    .asc-tag-label:empty {\r
      display: none;\r
    }\r
    .asc-tag-close {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-right: -0.15em;\r
      padding: 0.05em;\r
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));\r
      cursor: pointer;\r
      transition: background-color 0.15s ease;\r
    }\r
    .asc-tag-close:hover {\r
      background: color-mix(in srgb, var(--asc-ink, currentColor) 25%, transparent);\r
    }\r
\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #56baff));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="success"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #5cd07c));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f0a03c));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #e6696a));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="info"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #a1a1aa));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="default"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="default"]) {\r
      --asc-tone: var(--auto-color, var(--asc-tag-color, #fafafa));\r
    }\r
  </style>\r
  <span\r
    class="asc-tag-body"\r
    :data-type="type"\r
    :data-variant="variant"\r
    :data-closed="closed"\r
  >\r
    <i\r
      class="asc-tag-icon"\r
      x-if="typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></i>\r
    <i\r
      class="asc-tag-icon"\r
      x-if="typeof icon === 'object' && icon && icon.name"\r
      x-icon="icon.name"\r
    ></i>\r
    <span class="asc-tag-label" x-slot></span>\r
    <i\r
      class="asc-tag-close"\r
      x-if="closable"\r
      x-icon="'no'"\r
      @click="onCloseClick($event)"\r
    ></i>\r
  </span>\r
</span>\r
`,Si=`autospark.tag`;function Ci(e){e.components[Si]=xi}wi();function wi(){y(e=>{m(e),Ci(e)})}var Ti=`<div
  class="asc-empty"
  x-define="autospark.empty"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            description: "",
            icon: "file",
        }),
    }
  <\/script>
  <style global id="autospark-components-empty">
    .asc-empty {
      display: flex;
      justify-content: center;
      padding: var(--auto-padding, var(--asc-empty-padding, 0.8rem));
      font-size: var(--auto-font-size, var(--asc-empty-font-size, 0.875rem));
    }
    .asc-empty-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 100%;
    }
    .asc-empty-image {
      color: var(--auto-third-color, var(--asc-empty-image-color, rgba(0, 0, 0, 0.35)));
      font-size: 2.6em;
      line-height: 1;
    }
    .asc-empty-desc {
      margin-top: 0.6em;
      color: var(--auto-secondary-color, var(--asc-empty-desc-color, rgba(0, 0, 0, 0.55)));
      font-size: 0.875em;
      line-height: 1.5;
    }
    .asc-empty-extra {
      margin-top: 1em;
    }
    .asc-empty-extra:empty {
      display: none;
    }

    [dark] .asc-empty-image,
    [data-dark] .asc-empty-image {
      color: var(--auto-third-color, var(--asc-empty-image-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-empty-desc,
    [data-dark] .asc-empty-desc {
      color: var(--auto-secondary-color, var(--asc-empty-desc-color, rgba(255, 255, 255, 0.65)));
    }
  </style>
  <div class="asc-empty-body">
    <div class="asc-empty-image" x-slot:image>
      <i
        class="asc-empty-icon"
        x-if="typeof icon === 'string' && icon"
        x-icon="icon"
      ></i>
      <i
        class="asc-empty-icon"
        x-if="typeof icon === 'object' && icon && icon.name"
        x-icon="icon.name"
      ></i>
    </div>
    <div class="asc-empty-desc">{{ description || (t('empty.description') === 'empty.description' ? '暂无数据' : t('empty.description')) }}</div>
    <div class="asc-empty-extra" x-slot></div>
  </div>
</div>
`,Ei=`autospark.empty`;function Di(e){e.components[Ei]=Ti}Oi();function Oi(){y(e=>{m(e),Di(e)})}var ki=`<span\r
  class="asc-avatar"\r
  x-define="autospark.avatar"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",
            icon: "",
            label: "",
            shape: "circle",
            failed: false,
            errorArmed: false,
        }),\r
        methods: {\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.failed = true;\r
            },\r
        },\r
        mounted() {\r
            setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            const rearm = () => setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            let lastSrc = String(this.data.src ?? "");\r
            this.watch("src", ({ value }) => {\r
                const v = String(value ?? "");\r
                if (v === lastSrc) return;\r
                lastSrc = v;\r
                this.data.errorArmed = false;\r
                this.data.failed = false;\r
                rearm();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-avatar">\r
    .asc-avatar {\r
      display: inline-flex;\r
      font-size: var(--auto-font-size, var(--asc-avatar-font-size, 0.875rem));\r
      vertical-align: middle;\r
    }\r
\r
    .asc-avatar-inner {\r
      position: relative;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      width: 2.6em;\r
      height: 2.6em;\r
      overflow: hidden;\r
      flex: none;\r
      background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(0, 0, 0, 0.06)));\r
      border-radius: 50%;\r
      color: var(--auto-secondary-color, var(--asc-avatar-color, rgba(0, 0, 0, 0.55)));\r
      user-select: none;\r
    }\r
    .asc-avatar-inner[data-shape="square"] {\r
      border-radius: var(--auto-border-radius, var(--asc-avatar-radius, 0.375rem));\r
    }\r
\r
    .asc-avatar-img {\r
      width: 100%;\r
      height: 100%;\r
      object-fit: cover;\r
    }\r
    .asc-avatar-icon {\r
      display: inline-flex;\r
      font-size: 1.5em;\r
      line-height: 1;\r
    }\r
    .asc-avatar-char {\r
      font-size: 1.1em;\r
      font-weight: var(--x-font-weight-large, 600);\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
\r
    [dark] .asc-avatar-inner,\r
    [data-dark] .asc-avatar-inner {\r
      background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(255, 255, 255, 0.14)));\r
      color: var(--auto-secondary-color, var(--asc-avatar-color, rgba(255, 255, 255, 0.65)));\r
    }\r
  </style>\r
  <span class="asc-avatar-inner" :data-shape="shape">\r
    <img\r
      class="asc-avatar-img"\r
      x-show="src && !failed"\r
      :src="src"\r
      :alt="label"\r
      @error="onImgError()"\r
    />\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></i>\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && typeof icon === 'object' && icon && icon.name"\r
      x-icon="icon.name"\r
    ></i>\r
    <span\r
      class="asc-avatar-char"\r
      x-show="(!src || failed) && !icon && label"\r
      x-text="Array.from(String(label).trim())[0]"\r
    ></span>\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && !icon && !label"\r
      x-icon="'default'"\r
    ></i>\r
  </span>\r
</span>\r
`,Ai=`autospark.avatar`;function ji(e){e.components[Ai]=ki}Mi();function Mi(){y(e=>{m(e),ji(e)})}var Ni=`<div\r
  class="asc-image"\r
  x-define="autospark.image"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",
            alt: "",
            lazy: false,
            fit: "",
            width: "",
            height: "",
            fallback: "file-error",
            loaded: false,
            failed: false,
            errorArmed: false,
        }),\r
        methods: {\r
            onImgLoad() {\r
                this.data.loaded = true;\r
                this.data.failed = false;\r
            },\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.loaded = false;\r
                this.data.failed = true;\r
            },\r
        },\r
        mounted() {\r
            setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            const rearm = () => setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            let lastSrc = String(this.data.src ?? "");\r
            this.watch("src", ({ value }) => {\r
                const v = String(value ?? "");\r
                if (v === lastSrc) return;\r
                lastSrc = v;\r
                this.data.errorArmed = false;\r
                this.data.loaded = false;\r
                this.data.failed = false;\r
                rearm();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-image">\r
    .asc-image {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-image-font-size, 0.875rem));\r
    }\r
\r
    .asc-image-inner {\r
      position: relative;\r
      display: block;\r
      width: 100%;\r
      overflow: hidden;\r
      border-radius: var(--auto-border-radius, var(--asc-image-radius, 0.375rem));\r
      background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(0, 0, 0, 0.04)));\r
      min-height: 1em;\r
    }\r
    .asc-image-img {\r
      display: block;\r
      width: 100%;\r
      height: 100%;\r
    }\r
    .asc-image-img[data-fit="fill"] { object-fit: fill; }\r
    .asc-image-img[data-fit="contain"] { object-fit: contain; }\r
    .asc-image-img[data-fit="cover"] { object-fit: cover; }\r
    .asc-image-img[data-fit="none"] { object-fit: none; }\r
    .asc-image-img[data-fit="scale-down"] { object-fit: scale-down; }\r
\r
    .asc-image-spinner {\r
      display: flex;\r
      position: absolute;\r
      inset: 0;\r
      display: flex;\r
      align-items: center;\r
      justify-content: center;\r
      font-size: 1.6em;\r
      color: var(--auto-third-color, var(--asc-image-spinner-color, rgba(0, 0, 0, 0.35)));\r
      pointer-events: none;\r
    }\r
    .asc-image-fallback {\r
      display: flex;\r
      flex-direction: column;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.5em;\r
      min-height: 4em;\r
      padding: 1em;\r
      color: var(--auto-third-color, var(--asc-image-fallback-color, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-image-fallback-img {\r
      display: block;\r
      max-width: 100%;\r
      max-height: 100%;\r
      object-fit: contain;\r
    }\r
    .asc-image-fallback-icon {\r
      font-size: 2.2em;\r
      line-height: 1;\r
    }\r
    .asc-image-fallback-text {\r
      font-size: 0.875em;\r
      color: var(--auto-secondary-color, var(--asc-image-fallback-hint-color, rgba(0, 0, 0, 0.55)));\r
    }\r
    .asc-image-fallback-text:empty {\r
      display: none;\r
    }\r
\r
    [dark] .asc-image-inner,\r
    [data-dark] .asc-image-inner {\r
      background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(255, 255, 255, 0.1)));\r
    }\r
    [dark] .asc-image-spinner,\r
    [data-dark] .asc-image-spinner {\r
      color: var(--auto-third-color, var(--asc-image-spinner-color, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-image-fallback,\r
    [data-dark] .asc-image-fallback {\r
      color: var(--auto-third-color, var(--asc-image-fallback-color, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-image-fallback-text,\r
    [data-dark] .asc-image-fallback-text {\r
      color: var(--auto-secondary-color, var(--asc-image-fallback-hint-color, rgba(255, 255, 255, 0.65)));\r
    }\r
  </style>\r
  <div class="asc-image-inner">\r
    <img\r
      class="asc-image-img"\r
      x-show="src && !failed"\r
      :src="src"\r
      :alt="alt"\r
      :loading="lazy ? 'lazy' : 'eager'"\r
      :width="width"\r
      :height="height"\r
      :data-fit="fit"\r
      @load="onImgLoad()"\r
      @error="onImgError()"\r
    />\r
    <i\r
      class="asc-image-spinner"\r
      x-show="src && !loaded && !failed"\r
      x-icon="'loading'"\r
    ></i>\r
    <div\r
      class="asc-image-fallback"\r
      x-show="!src || failed"\r
    >\r
      <img\r
        class="asc-image-fallback-img"\r
        x-show="typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback))"\r
        :src="(typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback))) ? fallback : ''"\r
        :alt="alt"\r
      />\r
      <i\r
        class="asc-image-fallback-icon"\r
        x-show="!(typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback)))"\r
        x-icon="fallback"\r
      ></i>\r
      <span class="asc-image-fallback-text" x-text="alt"></span>\r
    </div>\r
  </div>\r
</div>\r
`,Pi=`autospark.image`;function Fi(e){e.components[Pi]=Ni}Ii();function Ii(){y(e=>{m(e),Fi(e)})}var Li=`<div\r
  class="asc-list"\r
  x-define="autospark.list"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],
            virtual: false,
            loading: false,
            bordered: true,
            split: true,
        }),\r
    }\r
  <\/script>\r
  <style global id="autospark-components-list">\r
    .asc-list {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-list-font-size, 0.875rem));\r
    }\r
\r
    .asc-list-inner {\r
      --asc-line: var(--auto-border-color, var(--asc-list-border-color, #d9d9d9));\r
      position: relative;
      display: block;\r
      background: var(--auto-bgcolor, var(--asc-list-bg, #ffffff));\r
      border: var(--auto-border-size, var(--asc-list-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(--auto-border-radius, var(--asc-list-radius, 0.5rem));\r
    }\r
    .asc-list-inner[data-borderless="true"] {\r
      --asc-line: transparent;\r
    }\r
\r
    /* ---------- 行：插槽出口即行容器（投影内容为直接子级；分隔线取相邻行命中——\r
         虚拟垫片（div[aria-hidden]）与空态段不参与相邻判定） ---------- */\r
    .asc-list-item {\r
      display: block;\r
      padding: 0.6em 1em;\r
      min-height: 2.4em;\r
      box-sizing: border-box;\r
    }\r
    .asc-list-inner[data-split="true"] .asc-list-item + .asc-list-item {\r
      border-top: var(--auto-border-size, var(--asc-list-border-size, 1px)) solid\r
        color-mix(in srgb, var(--asc-line, #d9d9d9) 60%, transparent);\r
    }\r
    .asc-list-item-text {\r
      display: block;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-color, var(--asc-list-color, #606060));\r
    }\r
\r
    .asc-list-inner[data-virtual="true"] .asc-list-body {\r
      height: var(--asc-list-virtual-height, 20em);\r
      overflow-y: auto;\r
      overscroll-behavior: contain;\r
    }\r
    /* 等高行假设：行定高与 x-for-options 的 itemHeight 同值（虚拟列表等高约束——\r
         autoDetect 在首渲染容器空时自败，显式声明是唯一稳定通道；自定义行高须同时\r
         覆盖 --asc-list-item-height 与 x-for-options，文档披露）。border-box 含分隔线 */\r
    .asc-list-inner[data-virtual="true"] .asc-list-item {\r
      height: var(--asc-list-item-height, 36px);\r
      min-height: 0;\r
      padding: 0 1em;\r
      line-height: 35px;\r
    }\r
\r
    .asc-list-empty {\r
      padding: 1.2em 1em;\r
    }\r
\r
    [dark] .asc-list-inner,\r
    [data-dark] .asc-list-inner {\r
      background: var(--auto-bgcolor, var(--asc-list-bg, #3a3a3a));\r
      --asc-line: var(--auto-border-color, var(--asc-list-border-color, #52525b));\r
    }\r
    [dark] .asc-list-item-text,\r
    [data-dark] .asc-list-item-text {\r
      color: var(--auto-color, var(--asc-list-color, #fafafa));\r
    }\r
  </style>\r
  <div\r
    class="asc-list-inner"\r
    :data-borderless="!bordered"\r
    :data-split="split"\r
    :data-virtual="virtual"\r
    :x-loading="loading ? 'true' : 'false'"\r
  >\r
    <div x-if="virtual">\r
      <div\r
        class="asc-list-body"\r
        x-for="item of items"\r
        x-for-options="{ virtual: true, itemHeight: 36 }"\r
      >\r
        <div class="asc-list-item" x-slot="{ name: 'row', params: { item, $index } }">\r
          <span\r
            class="asc-list-item-text"\r
            x-text="typeof item === 'object' && item !== null ? (item.label ?? item.title ?? item.name ?? item.value ?? '') : item"\r
          ></span>\r
        </div>\r
        <div class="asc-list-empty" x-empty>\r
          <div class="asc-list-empty-outlet" x-slot="{ name: 'empty' }">\r
            <x-empty></x-empty>\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
    <div x-if="!virtual">\r
      <div class="asc-list-body" x-for="item of items">\r
        <div class="asc-list-item" x-slot="{ name: 'row', params: { item, $index } }">\r
          <span\r
            class="asc-list-item-text"\r
            x-text="typeof item === 'object' && item !== null ? (item.label ?? item.title ?? item.name ?? item.value ?? '') : item"\r
          ></span>\r
        </div>\r
        <div class="asc-list-empty" x-empty>\r
          <div class="asc-list-empty-outlet" x-slot="{ name: 'empty' }">\r
            <x-empty></x-empty>\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
  </div>\r
</div>\r
`,Ri=`autospark.list`;function zi(e){e.components[Ri]=Li}Bi();function Bi(){y(e=>{m(e),zi(e)})}var Vi=`<div
  class="asc-descriptions"
  x-define="autospark.descriptions"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],
            columns: 3,
            bordered: false,
            title: "",
            layout: "horizontal",
        }),
        methods: {
            syncLayout() {
                const body = this.el.querySelector(".asc-descriptions-body");
                if (!body) return;
                const cols = parseInt(this.data.columns, 10);
                body.style.gridTemplateColumns = \`repeat(\${Number.isFinite(cols) && cols > 0 ? cols : 3}, minmax(0, 1fr))\`;
                body.setAttribute("data-layout", this.data.layout === "vertical" ? "vertical" : "horizontal");
                body.setAttribute("data-bordered", this.data.bordered ? "true" : "false");
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空表） */ }
                this.el.removeAttribute("data-items");
            }
            this.syncLayout();
            this.watch("columns", () => this.syncLayout());
            this.watch("layout", () => this.syncLayout());
            this.watch("bordered", () => this.syncLayout());
        },
    }
  <\/script>
  <style global id="autospark-components-descriptions">
    .asc-descriptions {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-descriptions-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-descriptions-head {
      margin-bottom: 0.75em;
      font-weight: var(--x-font-weight-large, 600);
      color: var(--auto-color, var(--asc-descriptions-title-color, #303030));
    }
    .asc-descriptions-head:empty {
      display: none;
    }

    /* ---------- 项位网格：每项一格（span 跨项位经克隆体 :style 内联） ----------
         简洁形态（缺省）：行间距 + 列间距；bordered 形态经 data-bordered 切换为
         gap 1px 间隙显线（容器背景即线色，格子实底遮线——任意 span 布局单线不双线） */
    .asc-descriptions-body {
      display: grid;
      row-gap: 0.75em;
      column-gap: 2em;
    }
    .asc-descriptions-item {
      display: flex;
      align-items: baseline;
      gap: 0.5em;
      min-width: 0;
    }
    .asc-descriptions-body[data-bordered="false"][data-layout="horizontal"] .asc-descriptions-label::after {
      content: "：";
    }
    .asc-descriptions-body[data-layout="vertical"] .asc-descriptions-item {
      flex-direction: column;
      gap: 0.2em;
    }
    .asc-descriptions-label {
      flex-shrink: 0;
      color: var(--auto-secondary-color, var(--asc-descriptions-label-color, rgba(0, 0, 0, 0.55)));
    }
    .asc-descriptions-value {
      min-width: 0;
      overflow-wrap: anywhere;
      color: var(--auto-color, var(--asc-descriptions-value-color, #606060));
    }

    .asc-descriptions-body[data-bordered="true"] {
      --asc-line: var(--auto-border-color, var(--asc-descriptions-border-color, #d9d9d9));
      gap: 1px;
      background: var(--asc-line);
      border: var(--auto-border-size, var(--asc-descriptions-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-descriptions-radius, 0.5rem));
      overflow: hidden;
      row-gap: 1px;
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item {
      display: grid;
      grid-template-columns: minmax(5em, max-content) minmax(0, 1fr);
      gap: 0;
      align-items: stretch;
      background: var(--auto-bgcolor, var(--asc-descriptions-bg, #ffffff));
    }
    .asc-descriptions-body[data-bordered="true"][data-layout="vertical"] .asc-descriptions-item {
      grid-template-columns: minmax(0, 1fr);
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-value {
      padding: 0.55em 1em;
      align-self: stretch;
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label {
      background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #fafafa));
    }

    [dark] .asc-descriptions-head,
    [data-dark] .asc-descriptions-head {
      color: var(--auto-color, var(--asc-descriptions-title-color, #fafafa));
    }
    [dark] .asc-descriptions-label,
    [data-dark] .asc-descriptions-label {
      color: var(--auto-secondary-color, var(--asc-descriptions-label-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-descriptions-value,
    [data-dark] .asc-descriptions-value {
      color: var(--auto-color, var(--asc-descriptions-value-color, #fafafa));
    }
    [dark] .asc-descriptions-body[data-bordered="true"],
    [data-dark] .asc-descriptions-body[data-bordered="true"] {
      --asc-line: var(--auto-border-color, var(--asc-descriptions-border-color, #52525b));
    }
    [dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item,
    [data-dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item {
      background: var(--auto-bgcolor, var(--asc-descriptions-bg, #3a3a3a));
    }
    [dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,
    [data-dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label {
      background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #303030));
    }
  </style>
  <div class="asc-descriptions-inner">
    <div class="asc-descriptions-head">{{ title }}</div>
    <div class="asc-descriptions-body" x-for="item of items">
      <div
        class="asc-descriptions-item"
        :style="'grid-column: span ' + (item.span > 0 ? item.span : 1)"
      >
        <span class="asc-descriptions-label">{{ item.label }}</span>
        <span class="asc-descriptions-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</div>
`,Hi=`autospark.descriptions`;function Ui(e){e.components[Hi]=Vi,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-descriptions`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-descriptions-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={label:e.getAttribute(`label`)??``,value:(e.textContent??``).trim()},n=e.getAttribute(`span`);return n!=null&&n!==``&&(t.span=$(n)),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${Hi}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Wi();function Wi(){y(e=>{m(e),Ui(e)})}var Gi=`<div
  class="asc-timeline"
  x-define="autospark.timeline"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],
            mode: "left",
        }),
        methods: {
            syncMode() {
                const body = this.el.querySelector(".asc-timeline-body");
                if (!body) return;
                const m = this.data.mode;
                body.setAttribute("data-mode", m === "alternate" || m === "right" ? m : "left");
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空线） */ }
                this.el.removeAttribute("data-items");
            }
            this.syncMode();
            this.watch("mode", () => this.syncMode());
        },
    }
  <\/script>
  <style global id="autospark-components-timeline">
    .asc-timeline {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-timeline-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-timeline-body {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .asc-timeline-item {
      position: relative;
      padding: 0 0 1.4em 1.9em;
      min-height: 1em;
    }
    .asc-timeline-item-tail {
      position: absolute;
      left: 0.5em;
      top: 1.3em;
      bottom: -0.1em;
      width: var(--asc-timeline-tail-width, 1px);
      background: var(--auto-border-color, var(--asc-timeline-line, #d9d9d9));
    }
    .asc-timeline-item:last-child .asc-timeline-item-tail {
      display: none;
    }

    .asc-timeline-item-head {
      --asc-dot: var(--auto-primary-color, var(--asc-timeline-primary, #009aff));
      position: absolute;
      left: 0;
      top: 0.22em;
      box-sizing: border-box;
      width: 1em;
      height: 1em;
      border-radius: 50%;
      background: var(--asc-dot);
      z-index: 1;
    }
    .asc-timeline-item-head[data-type="default"] {
      --asc-dot: var(--auto-border-color, var(--asc-timeline-default, #d9d9d9));
    }
    .asc-timeline-item-head[data-type="primary"] {
      --asc-dot: var(--auto-primary-color, var(--asc-timeline-primary, #009aff));
    }
    .asc-timeline-item-head[data-type="success"] {
      --asc-dot: var(--auto-success-color, var(--asc-timeline-success, #22c55e));
    }
    .asc-timeline-item-head[data-type="warning"] {
      --asc-dot: var(--auto-warning-color, var(--asc-timeline-warning, #f59e0b));
    }
    .asc-timeline-item-head[data-type="danger"] {
      --asc-dot: var(--auto-danger-color, var(--asc-timeline-danger, #ef4444));
    }
    .asc-timeline-item-head[data-hollow="true"] {
      background: var(--auto-bgcolor, var(--asc-timeline-dot-bg, #ffffff));
      border: 2px solid var(--asc-dot);
    }
    .asc-timeline-item-head[data-icon="true"] {
      width: auto;
      height: auto;
      top: -0.12em;
      left: -0.2em;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4em;
      color: var(--asc-dot);
    }
    .asc-timeline-item-icon {
      display: inline-flex;
    }

    .asc-timeline-item-content {
      min-width: 0;
    }
    .asc-timeline-item-time {
      color: var(--auto-third-color, var(--asc-timeline-time-color, rgba(0, 0, 0, 0.35)));
      font-size: 0.875em;
      line-height: 1.4;
    }
    .asc-timeline-item-body {
      color: var(--auto-color, var(--asc-timeline-color, #606060));
    }

    .asc-timeline-body[data-mode="alternate"] .asc-timeline-item {
      padding: 0 2.2em 1.4em 50%;
    }
    .asc-timeline-body[data-mode="alternate"] .asc-timeline-item:nth-child(even) {
      padding: 0 50% 1.4em 2.2em;
      text-align: right;
    }
    .asc-timeline-body[data-mode="alternate"] .asc-timeline-item-tail {
      left: 50%;
    }
    .asc-timeline-body[data-mode="alternate"] .asc-timeline-item-head {
      left: 50%;
      transform: translateX(-50%);
    }
    .asc-timeline-body[data-mode="alternate"] .asc-timeline-item-head[data-icon="true"] {
      transform: translateX(-50%);
    }

    .asc-timeline-body[data-mode="right"] .asc-timeline-item {
      padding: 0 1.9em 1.4em 0;
      text-align: right;
    }
    .asc-timeline-body[data-mode="right"] .asc-timeline-item-tail {
      left: auto;
      right: 0.5em;
    }
    .asc-timeline-body[data-mode="right"] .asc-timeline-item-head {
      left: auto;
      right: 0;
    }
    .asc-timeline-body[data-mode="right"] .asc-timeline-item-head[data-icon="true"] {
      left: auto;
      right: -0.2em;
    }

    [dark] .asc-timeline-item-tail,
    [data-dark] .asc-timeline-item-tail {
      background: var(--auto-border-color, var(--asc-timeline-line, #52525b));
    }
    [dark] .asc-timeline-item-head,
    [data-dark] .asc-timeline-item-head {
      --asc-dot: var(--auto-primary-color, var(--asc-timeline-primary, #56baff));
    }
    [dark] .asc-timeline-item-head[data-type="default"],
    [data-dark] .asc-timeline-item-head[data-type="default"] {
      --asc-dot: var(--auto-border-color, var(--asc-timeline-default, #52525b));
    }
    [dark] .asc-timeline-item-head[data-type="primary"],
    [data-dark] .asc-timeline-item-head[data-type="primary"] {
      --asc-dot: var(--auto-primary-color, var(--asc-timeline-primary, #56baff));
    }
    [dark] .asc-timeline-item-head[data-type="success"],
    [data-dark] .asc-timeline-item-head[data-type="success"] {
      --asc-dot: var(--auto-success-color, var(--asc-timeline-success, #5cd07c));
    }
    [dark] .asc-timeline-item-head[data-type="warning"],
    [data-dark] .asc-timeline-item-head[data-type="warning"] {
      --asc-dot: var(--auto-warning-color, var(--asc-timeline-warning, #f0a03c));
    }
    [dark] .asc-timeline-item-head[data-type="danger"],
    [data-dark] .asc-timeline-item-head[data-type="danger"] {
      --asc-dot: var(--auto-danger-color, var(--asc-timeline-danger, #e6696a));
    }
    [dark] .asc-timeline-item-head[data-hollow="true"],
    [data-dark] .asc-timeline-item-head[data-hollow="true"] {
      background: var(--auto-bgcolor, var(--asc-timeline-dot-bg, #3a3a3a));
    }
    [dark] .asc-timeline-item-time,
    [data-dark] .asc-timeline-item-time {
      color: var(--auto-third-color, var(--asc-timeline-time-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-timeline-item-body,
    [data-dark] .asc-timeline-item-body {
      color: var(--auto-color, var(--asc-timeline-color, #fafafa));
    }
  </style>
  <ul class="asc-timeline-body" x-for="item of items">
    <li class="asc-timeline-item">
      <div class="asc-timeline-item-tail" aria-hidden="true"></div>
      <div
        class="asc-timeline-item-head"
        :data-type="item.type || 'default'"
        :data-hollow="item.hollow"
        :data-icon="item.icon ? 'true' : 'false'"
      >
        <i class="asc-timeline-item-icon" x-show="item.icon" x-icon="item.icon"></i>
      </div>
      <div class="asc-timeline-item-content">
        <div class="asc-timeline-item-time" x-show="item.time">{{ item.time }}</div>
        <div class="asc-timeline-item-body">{{ item.content }}</div>
      </div>
    </li>
  </ul>
</div>
`,Ki=`autospark.timeline`;function qi(e){e.components[Ki]=Gi,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-timeline`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-timeline-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={content:(e.textContent??``).trim()};for(let n of[`time`,`icon`,`type`]){let r=e.getAttribute(n);r!=null&&r!==``&&(t[n]=r)}let n=e.getAttribute(`hollow`);return n!=null&&n!==``&&(t.hollow=$(n)),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${Ki}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ji();function Ji(){y(e=>{m(e),qi(e)})}var Yi=`<div
  class="asc-statistic"
  x-define="autospark.statistic"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: 0,
            precision: null,
            grouping: true,
            groupSeparator: "",
            prefix: "",
            suffix: "",
            title: "",
            valueStyle: null,
        }),
        methods: {
            currentLanguage() {
                const g = this.globalState;
                return (g && g.$ && g.$.language) || "zh";
            },
            formatValue() {
                const v = this.data.value;
                if (typeof v === "number" && isFinite(v)) {
                    const opts = { useGrouping: !!this.data.grouping };
                    const p = this.data.precision == null ? NaN : Number(this.data.precision);
                    if (isFinite(p) && p >= 0 && Math.floor(p) === p) {
                        opts.minimumFractionDigits = p;
                        opts.maximumFractionDigits = p;
                    }
                    let nf;
                    try { nf = new Intl.NumberFormat(this.currentLanguage(), opts); }
                    catch { nf = new Intl.NumberFormat("zh", opts); }
                    let text = nf.format(v);
                    const sep = this.data.groupSeparator;
                    if (sep) {
                        const groupPart = nf.formatToParts(v).find((x) => x.type === "group");
                        if (groupPart) text = text.split(groupPart.value).join(sep);
                    }
                    return text;
                }
                return v == null ? "" : String(v);
            },
            syncValue() {
                const el = this.el.querySelector(".asc-statistic-value-text");
                if (el) el.textContent = this.formatValue();
            },
            syncStyle() {
                const el = this.el.querySelector(".asc-statistic-value");
                if (!el) return;
                el.removeAttribute("style");
                const s = this.data.valueStyle;
                if (s && typeof s === "object") {
                    for (const key of Object.keys(s)) {
                        if (key.startsWith("--")) el.style.setProperty(key, String(s[key]));
                        else el.style[key] = s[key];
                    }
                }
            },
        },
        mounted() {
            this.syncValue();
            this.syncStyle();
            this.watch("value", () => this.syncValue());
            this.watch("precision", () => this.syncValue());
            this.watch("grouping", () => this.syncValue());
            this.watch("groupSeparator", () => this.syncValue());
            this.watch("$ && $.language", () => this.syncValue());
            this.watch("valueStyle", () => this.syncStyle());
        },
    }
  <\/script>
  <style global id="autospark-components-statistic">
    .asc-statistic {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-statistic-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-statistic-title {
      color: var(--auto-secondary-color, var(--asc-statistic-title-color, rgba(0, 0, 0, 0.55)));
    }
    .asc-statistic-title:empty {
      display: none;
    }
    .asc-statistic-value {
      display: inline-flex;
      align-items: baseline;
      gap: 0.15em;
      font-size: 1.5em;
      font-weight: var(--x-font-weight-large, 600);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
      color: var(--auto-color, var(--asc-statistic-value-color, #303030));
    }
    .asc-statistic-prefix,
    .asc-statistic-suffix {
      font-size: 0.667em;
    }
    .asc-statistic-prefix:empty,
    .asc-statistic-suffix:empty {
      display: none;
    }
    .asc-statistic-value-text {
      min-width: 0;
    }

    [dark] .asc-statistic-title,
    [data-dark] .asc-statistic-title {
      color: var(--auto-secondary-color, var(--asc-statistic-title-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-statistic-value,
    [data-dark] .asc-statistic-value {
      color: var(--auto-color, var(--asc-statistic-value-color, #fafafa));
    }
  </style>
  <div class="asc-statistic-inner">
    <div class="asc-statistic-title" x-slot:title>{{ title }}</div>
    <div class="asc-statistic-value">
      <span class="asc-statistic-prefix" x-slot:prefix>{{ prefix }}</span>
      <span class="asc-statistic-value-text"></span>
      <span class="asc-statistic-suffix" x-slot:suffix>{{ suffix }}</span>
    </div>
  </div>
</div>
`,Xi=`autospark.statistic`;function Zi(e){e.components[Xi]=Yi}Qi();function Qi(){y(e=>{m(e),Zi(e)})}var $i=`<div
  class="asc-image-viewer"
  x-define="autospark.image-viewer"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            images: [],
            visible: false,
            index: 0,
            scale: 1,
            rotate: 0,
        }),
        methods: {
            onPrev() {
                if (this.data.index <= 0) return;
                this.data.index = this.data.index - 1;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: this.data.index } }));
            },
            onNext() {
                if (this.data.index >= this.data.images.length - 1) return;
                this.data.index = this.data.index + 1;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: this.data.index } }));
            },
            onZoom(delta) {
                const next = Math.min(8, Math.max(0.2, Number(this.data.scale) + delta));
                if (next === this.data.scale) return;
                this.data.scale = next;
            },
            onRotate(delta) {
                this.data.rotate = Number(this.data.rotate) + delta;
            },
            onReset() {
                this.data.scale = 1;
                this.data.rotate = 0;
            },
            onRequestClose() {
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
            onKeydown(e) {
                if (!this.data.visible) return;
                if (e.key === "ArrowLeft") { e.preventDefault(); this.onPrev(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); this.onNext(); }
                else if (e.key === "Escape") { e.preventDefault(); this.onRequestClose(); }
                else if (e.key === "+" || e.key === "=") { e.preventDefault(); this.onZoom(0.2); }
                else if (e.key === "-") { e.preventDefault(); this.onZoom(-0.2); }
            },
        },
        mounted() {
            const preload = (i) => {
                const url = (this.data.images || [])[i];
                if (typeof url === "string" && url !== "") { const img = new Image(); img.src = url; }
            };
            const preloadNeighbors = () => { preload(this.data.index - 1); preload(this.data.index + 1); };
            preloadNeighbors();

            let lastIndex = this.data.index;
            this.watch("index", ({ value: v }) => {
                if (v === lastIndex) return;
                lastIndex = v;
                this.data.scale = 1;
                this.data.rotate = 0;
                preloadNeighbors();
            });

            let wasOpen = !!this.data.visible;
            this.watch("visible", ({ value }) => {
                const open = value === true;
                if (open && !wasOpen) this.onReset();
                wasOpen = open;
            });

            const onDocKey = (e) => this.onKeydown(e);
            document.addEventListener("keydown", onDocKey);
            this.el["_ascImageViewerCleanup"] = () => document.removeEventListener("keydown", onDocKey);
        },
        unmounted() {
            this.el?.["_ascImageViewerCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-image-viewer">
    .asc-image-viewer {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-image-viewer-font-size, 0.875rem));
    }

    .asc-image-viewer-layer {
      position: fixed;
      inset: 0;
      z-index: var(--asc-image-viewer-z, 1000);
      animation: asc-image-viewer-in 0.18s ease;
    }
    @keyframes asc-image-viewer-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .asc-image-viewer-mask {
      position: absolute;
      inset: 0;
      background: var(--asc-image-viewer-mask, rgba(0, 0, 0, 0.72));
    }
    .asc-image-viewer-canvas {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .asc-image-viewer-img {
      max-width: calc(100% - 7rem);
      max-height: calc(100% - 6rem);
      object-fit: contain;
      transition: transform 0.2s ease;
      user-select: none;
    }

    .asc-image-viewer-btn {
      appearance: none;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      box-sizing: border-box;
      border-radius: var(--asc-image-viewer-btn-radius, 0.375rem);
      background: var(--asc-image-viewer-btn-bg, rgba(0, 0, 0, 0.5));
      color: var(--asc-image-viewer-btn-color, #ffffff);
      cursor: pointer;
      transition: background-color 0.15s ease, opacity 0.15s ease;
    }
    .asc-image-viewer-btn:hover {
      background: var(--asc-image-viewer-btn-hover-bg, rgba(0, 0, 0, 0.72));
    }
    .asc-image-viewer-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .asc-image-viewer-btn svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .asc-image-viewer-toolbar {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.375rem;
      z-index: 2;
    }
    .asc-image-viewer-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--asc-image-viewer-nav-radius, 50%);
      z-index: 2;
    }
    .asc-image-viewer-nav svg {
      width: 1.5rem;
      height: 1.5rem;
    }
    .asc-image-viewer-nav[data-nav="prev"] { left: 1rem; }
    .asc-image-viewer-nav[data-nav="next"] { right: 1rem; }
    .asc-image-viewer-counter {
      position: absolute;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      padding: 0.25em 0.9em;
      border-radius: var(--asc-image-viewer-counter-radius, 0.375rem);
      background: var(--asc-image-viewer-counter-bg, rgba(0, 0, 0, 0.5));
      color: var(--asc-image-viewer-counter-color, #ffffff);
      font-size: 0.875em;
      letter-spacing: 0.08em;
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-image-viewer-layer { animation: none; }
      .asc-image-viewer-img { transition: none; }
      .asc-image-viewer-btn { transition: none; }
    }
  </style>
  <div
    class="asc-image-viewer-layer"
    role="dialog"
    aria-modal="true"
    aria-label="图片预览"
    x-show="visible && images.length > 0"
  >
    <div class="asc-image-viewer-mask" @click="onRequestClose()"></div>
    <div class="asc-image-viewer-canvas">
      <img
        class="asc-image-viewer-img"
        :src="images[index] || ''"
        alt=""
        draggable="false"
        :style="'transform: scale(' + scale + ') rotate(' + rotate + 'deg)'"
      />
    </div>
    <div class="asc-image-viewer-toolbar">
      <button type="button" class="asc-image-viewer-btn" title="缩小" aria-label="缩小" @click="onZoom(-0.2)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path><path d="M8 11h6"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="放大" aria-label="放大" @click="onZoom(0.2)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path><path d="M11 8v6"></path><path d="M8 11h6"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="向左旋转" aria-label="向左旋转" @click="onRotate(-90)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="向右旋转" aria-label="向右旋转" @click="onRotate(90)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="重置（1:1）" aria-label="重置" @click="onReset()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="关闭" aria-label="关闭" @click="onRequestClose()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
      </button>
    </div>
    <button
      type="button"
      class="asc-image-viewer-btn asc-image-viewer-nav"
      data-nav="prev"
      title="上一张"
      aria-label="上一张"
      x-show="images.length > 1"
      :disabled="index <= 0"
      @click="onPrev()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
    </button>
    <button
      type="button"
      class="asc-image-viewer-btn asc-image-viewer-nav"
      data-nav="next"
      title="下一张"
      aria-label="下一张"
      x-show="images.length > 1"
      :disabled="index >= images.length - 1"
      @click="onNext()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
    </button>
    <div class="asc-image-viewer-counter" x-text="(index + 1) + ' / ' + images.length"></div>
  </div>
</div>
`,ea=`autospark.image-viewer`;function ta(e){e.components[ea]=$i}na();function na(){y(e=>{m(e),ta(e)})}var ra=`<div
  class="asc-carousel"
  x-define="autospark.carousel"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],
            autoplay: 0,
            loop: false,
            indicator: "bottom",
            arrows: true,
            effect: "scroll",
            current: 0,
            settleTarget: -1,
        }),
        methods: {
            prev() { this.goTo(this.data.current - 1); },
            next() { this.goTo(this.data.current + 1); },
            goTo(i) {
                const len = (this.data.items || []).length;
                if (!len) return;
                let t = Math.round(Number(i) || 0);
                if (this.data.loop) t = ((t % len) + len) % len;
                else t = Math.min(len - 1, Math.max(0, t));
                if (t === this.data.current) return;
                this.data.current = t;
                this.emitChange(t);
                if (this.data.effect === "scroll") this.applyScroll(t);
            },
            emitChange(i) {
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: i } }));
            },
            applyScroll(i) {
                const track = this.el.querySelector(".asc-carousel-track");
                if (!track) return;
                this.data.settleTarget = i;
                const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
                track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
            },
            onKeydown(e) {
                if (e.key === "ArrowLeft") { e.preventDefault(); this.prev(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); this.next(); }
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            Object.defineProperty(this.el, "value", {
                get: () => this.data.current,
                set: (v) => { this.goTo(Number(v)); },
                configurable: true,
            });

            const track = this.el.querySelector(".asc-carousel-track");
            const onScroll = () => {
                const w = track ? track.clientWidth : 0;
                if (!track || w <= 0) return;
                const idx = Math.round(track.scrollLeft / w);
                if (this.data.settleTarget >= 0) {
                    if (idx === this.data.settleTarget) this.data.settleTarget = -1;
                    return;
                }
                if (idx !== this.data.current) {
                    this.data.current = idx;
                    this.emitChange(idx);
                }
            };
            track?.addEventListener("scroll", onScroll);

            const onResize = () => {
                if (this.data.effect !== "scroll" || !track) return;
                this.data.settleTarget = this.data.current;
                track.scrollTo({ left: this.data.current * track.clientWidth, behavior: "auto" });
            };
            window.addEventListener("resize", onResize);

            let timer = null;
            const stopAuto = () => { if (timer) { clearInterval(timer); timer = null; } };
            const startAuto = () => {
                stopAuto();
                const ms = Number(this.data.autoplay) || 0;
                if (ms <= 0) return;
                if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
                timer = setInterval(() => {
                    const len = (this.data.items || []).length;
                    if (!len) return;
                    let n = this.data.current + 1;
                    if (n > len - 1) {
                        if (this.data.loop) n = 0;
                        else { stopAuto(); return; }
                    }
                    this.goTo(n);
                }, ms);
            };
            startAuto();
            this.watch("autoplay", () => startAuto());

            this.el["_ascCarouselCleanup"] = () => {
                stopAuto();
                track?.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onResize);
            };
        },
        unmounted() {
            this.el?.["_ascCarouselCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-carousel">
    .asc-carousel {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-carousel-font-size, 0.875rem));
    }

    .asc-carousel-body {
      position: relative;
    }
    .asc-carousel-stage {
      position: relative;
      overflow: hidden;
      border-radius: var(--auto-border-radius, var(--asc-carousel-radius, 0.5rem));
      background: var(--auto-third-bgcolor, var(--asc-carousel-bg, rgba(0, 0, 0, 0.04)));
    }
    .asc-carousel-stage:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--auto-primary-color, var(--asc-carousel-primary, #009aff)) 30%, transparent);
    }

    .asc-carousel-body[data-effect="scroll"] .asc-carousel-track {
      display: flex;
      width: 100%;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      overscroll-behavior-x: contain;
    }
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-track::-webkit-scrollbar {
      display: none;
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-stage {
      height: var(--asc-carousel-height, 16rem);
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-track {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-item {
      position: absolute;
      inset: 0;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-item[data-active] {
      opacity: 1;
      visibility: visible;
    }

    .asc-carousel-item {
      position: relative;
      box-sizing: border-box;
    }
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-item {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }
    .asc-carousel-item-img {
      display: block;
      width: 100%;
      object-fit: var(--asc-carousel-fit, cover);
      user-select: none;
    }
    /* scroll 档无定高链（stage 高度由内容撑）：图片高度缺省随内容，可经
         --asc-carousel-height 统一定高（与 fade 档同一变量） */
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-item-img {
      height: var(--asc-carousel-height, auto);
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-item-img {
      height: 100%;
    }
    .asc-carousel-item-html {
      width: 100%;
      height: 100%;
      padding: var(--asc-carousel-html-pad, 1.25em);
      box-sizing: border-box;
      overflow: auto;
      color: var(--auto-color, var(--asc-carousel-color, #606060));
    }
    .asc-carousel-item-caption {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 1.6em 1em 0.7em;
      background: linear-gradient(transparent, var(--asc-carousel-caption-veil, rgba(0, 0, 0, 0.55)));
      color: var(--asc-carousel-caption-color, #ffffff);
      font-size: 0.875em;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .asc-carousel-arrow {
      appearance: none;
      border: none;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border-radius: var(--asc-carousel-arrow-radius, 50%);
      background: var(--asc-carousel-arrow-bg, rgba(0, 0, 0, 0.4));
      color: var(--asc-carousel-arrow-color, #ffffff);
      cursor: pointer;
      z-index: 2;
      opacity: 0;
      transition: opacity 0.2s ease, background-color 0.15s ease;
    }
    .asc-carousel-stage:hover .asc-carousel-arrow,
    .asc-carousel-arrow:focus-visible {
      opacity: 1;
    }
    @media (hover: none) {
      .asc-carousel-arrow { opacity: 1; }
    }
    .asc-carousel-arrow:hover {
      background: var(--asc-carousel-arrow-hover-bg, rgba(0, 0, 0, 0.65));
    }
    .asc-carousel-arrow:disabled {
      opacity: 0;
      cursor: not-allowed;
      pointer-events: none;
    }
    .asc-carousel-arrow[data-arrow="prev"] { left: 0.75rem; }
    .asc-carousel-arrow[data-arrow="next"] { right: 0.75rem; }
    .asc-carousel-arrow[data-arrow="prev"] .asc-carousel-arrow-icon {
      display: inline-block;
      transform: rotate(180deg);
    }
    .asc-carousel-arrow-icon {
      font-size: 1.25rem;
      color: inherit;
    }

    .asc-carousel-indicator {
      position: absolute;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      padding: 0.55em 0;
      z-index: 2;
      pointer-events: none;
    }
    .asc-carousel-body[data-indicator="bottom"] .asc-carousel-indicator { bottom: 0; }
    .asc-carousel-body[data-indicator="top"] .asc-carousel-indicator { top: 0; }
    .asc-carousel-dots {
      display: inline-flex;
      gap: 0.4em;
      pointer-events: auto;
    }
    .asc-carousel-dot {
      appearance: none;
      border: none;
      width: 0.5em;
      height: 0.5em;
      min-width: 6px;
      min-height: 6px;
      padding: 0;
      margin: 0;
      border-radius: var(--asc-carousel-dot-radius, 999px);
      background: var(--asc-carousel-dot-bg, rgba(255, 255, 255, 0.55));
      cursor: pointer;
      transition: width 0.2s ease, background-color 0.2s ease;
    }
    .asc-carousel-dot:hover {
      background: var(--asc-carousel-dot-hover-bg, rgba(255, 255, 255, 0.85));
    }
    .asc-carousel-dot[data-active] {
      width: 1.2em;
      background: var(--asc-carousel-dot-active-bg, #ffffff);
    }

    [dark] .asc-carousel-stage,
    [data-dark] .asc-carousel-stage {
      background: var(--auto-third-bgcolor, var(--asc-carousel-bg, rgba(255, 255, 255, 0.1)));
    }
    [dark] .asc-carousel-item-html,
    [data-dark] .asc-carousel-item-html {
      color: var(--auto-color, var(--asc-carousel-color, #fafafa));
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-carousel-body[data-effect="fade"] .asc-carousel-item { transition: none; }
      .asc-carousel-body[data-effect="scroll"] .asc-carousel-track { scroll-behavior: auto; }
      .asc-carousel-dot,
      .asc-carousel-arrow { transition: none; }
    }
  </style>
  <div
    class="asc-carousel-body"
    :data-effect="effect === 'fade' ? 'fade' : 'scroll'"
    :data-indicator="indicator === false ? 'off' : (indicator === 'top' ? 'top' : 'bottom')"
  >
    <div
      class="asc-carousel-stage"
      tabindex="0"
      role="region"
      aria-roledescription="carousel"
      @keydown="onKeydown($event)"
    >
      <div class="asc-carousel-track" x-for="item of items">
        <div class="asc-carousel-item" :data-active="$index === current ? '' : null">
          <img
            class="asc-carousel-item-img"
            x-show="typeof item === 'string' || (item && !!item.src)"
            :src="typeof item === 'string' ? item : (item && item.src) || ''"
            :alt="typeof item === 'object' && item !== null ? (item.alt ?? '') : ''"
            draggable="false"
          />
          <div
            class="asc-carousel-item-html"
            x-show="typeof item === 'object' && item !== null && !item.src && !!item.html"
            x-html="typeof item === 'object' && item !== null ? (item.html ?? '') : ''"
          ></div>
          <div
            class="asc-carousel-item-caption"
            x-show="typeof item === 'object' && item !== null && !!item.caption"
            x-text="typeof item === 'object' && item !== null ? (item.caption ?? '') : ''"
          ></div>
        </div>
      </div>
      <button
        type="button"
        class="asc-carousel-arrow"
        data-arrow="prev"
        x-show="arrows"
        aria-label="上一页"
        :disabled="!loop && current <= 0"
        @click="prev()"
      >
        <i class="asc-carousel-arrow-icon" x-icon="'arrow'"></i>
      </button>
      <button
        type="button"
        class="asc-carousel-arrow"
        data-arrow="next"
        x-show="arrows"
        aria-label="下一页"
        :disabled="!loop && current >= items.length - 1"
        @click="next()"
      >
        <i class="asc-carousel-arrow-icon" x-icon="'arrow'"></i>
      </button>
    </div>
    <div class="asc-carousel-indicator" x-show="indicator !== false">
      <div class="asc-carousel-dots" x-for="item of items">
        <button
          type="button"
          class="asc-carousel-dot"
          :data-active="$index === current ? '' : null"
          :aria-label="'第 ' + ($index + 1) + ' 页'"
          @click="goTo($index)"
        ></button>
      </div>
    </div>
  </div>
</div>
`,ia=`autospark.carousel`;function aa(e){e.components[ia]=ra,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-carousel`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-carousel-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={},n=e.getAttribute(`src`),r=e.getAttribute(`alt`),i=e.getAttribute(`caption`);n!=null&&(t.src=n),r!=null&&(t.alt=r),i!=null&&(t.caption=i);let a=(e.innerHTML||``).trim();return a!==``&&(t.html=a),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``?a.push(`${Q(Z(n.name))}: true`):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);e.setAttribute(`x-component:${ia}`,`{ ${a.join(`, `)} }`),t.replaceWith(e)}})}oa();function oa(){y(e=>{m(e),aa(e)})}var sa=`<div
  class="asc-table"
  x-define="autospark.table"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            columns: [],
            rows: [],
            rowKey: "id",
            selectable: false,
            selection: [],
            remoteSort: false,
            loading: false,
            bordered: true,
            striped: false,
            virtual: false,
            viewRows: [],
            sortKey: "",
            sortOrder: "",
            selectedKeys: [],
            allChecked: false,
            halfChecked: false,
        }),
        methods: {
            keyOf(row, index) {
                const k = row == null ? undefined : row[this.data.rowKey];
                return k === undefined || k === null ? index : k;
            },
            cmpCells(x, y) {
                const a = x == null ? "" : x;
                const b = y == null ? "" : y;
                if (typeof a === "number" && typeof b === "number") return a - b;
                return String(a).localeCompare(String(b));
            },
            rebuildView() {
                const list = Array.isArray(this.data.rows) ? this.data.rows : [];
                const key = this.data.sortKey;
                const order = this.data.sortOrder;
                if (!key || !order || this.data.remoteSort) {
                    this.data.viewRows = [...list];
                    return;
                }
                const sorted = [...list];
                sorted.sort((a, b) => this.cmpCells(a?.[key], b?.[key]) * (order === "asc" ? 1 : -1));
                this.data.viewRows = sorted;
            },
            syncSelection() {
                const rows = Array.isArray(this.data.viewRows) ? this.data.viewRows : [];
                const keys = this.data.selectedKeys ?? [];
                let count = 0;
                for (let i = 0; i < rows.length; i++) {
                    if (keys.includes(this.keyOf(rows[i], i))) count++;
                }
                this.data.allChecked = rows.length > 0 && count === rows.length;
                this.data.halfChecked = count > 0 && count < rows.length;
            },
            onSortClick(column) {
                if (!column || !column.sortable) return;
                const key = column.key;
                if (this.data.sortKey === key && this.data.sortOrder) {
                    this.data.sortOrder = this.data.sortOrder === "asc" ? "desc" : "";
                    if (!this.data.sortOrder) this.data.sortKey = "";
                } else {
                    this.data.sortKey = key;
                    this.data.sortOrder = "asc";
                }
                this.rebuildView();
                this.el.dispatchEvent(
                    new CustomEvent("sort-change", {
                        bubbles: true,
                        detail: { key: this.data.sortKey, order: this.data.sortOrder },
                    }),
                );
            },
            onRowCheck(row, index) {
                const key = this.keyOf(row, index);
                const keys = this.data.selectedKeys ?? [];
                this.data.selectedKeys = keys.includes(key)
                    ? keys.filter((k) => k !== key)
                    : [...keys, key];
                this.syncSelection();
                this.emitSelection();
            },
            onToggleAll() {
                const rows = Array.isArray(this.data.viewRows) ? this.data.viewRows : [];
                if (this.data.allChecked) {
                    this.data.selectedKeys = [];
                } else {
                    this.data.selectedKeys = rows.map((r, i) => this.keyOf(r, i));
                }
                this.syncSelection();
                this.emitSelection();
            },
            emitSelection() {
                this.el.dispatchEvent(
                    new CustomEvent("selection-change", {
                        bubbles: true,
                        detail: { keys: [...(this.data.selectedKeys ?? [])] },
                    }),
                );
            },
            syncGridCols() {
                const cols = Array.isArray(this.data.columns) ? this.data.columns : [];
                const parts = cols.map((c) => {
                    if (c && c.width) return typeof c.width === "number" ? c.width + "px" : String(c.width);
                    return "minmax(6em, 1fr)";
                });
                if (this.data.selectable) parts.unshift("3em");
                this.el.style.setProperty("--asc-table-cols", parts.join(" "));
            },
            bindVHeadSync() {
                this.unbindVHeadSync();
                const vbody = this.el.querySelector(".asc-table-vbody");
                const vhead = this.el.querySelector(".asc-table-vhead");
                if (!vbody || !vhead) return;
                const fn = () => { vhead.scrollLeft = vbody.scrollLeft; };
                vbody.__ascTableHeadSync = fn;
                vbody.addEventListener("scroll", fn, { passive: true });
            },
            unbindVHeadSync() {
                const vbody = this.el?.querySelector(".asc-table-vbody");
                const fn = vbody?.__ascTableHeadSync;
                if (fn) {
                    vbody.removeEventListener("scroll", fn);
                    vbody.__ascTableHeadSync = null;
                }
            },
        },
        mounted() {
            setTimeout(() => {
                const init = Array.isArray(this.data.selection) ? [...this.data.selection] : [];
                if (init.length > 0) this.data.selectedKeys = init;
                this.rebuildView();
                this.syncSelection();
                this.syncGridCols();
                this.bindVHeadSync();
            }, 0);

            this.watch("rows", () => { this.rebuildView(); this.syncSelection(); });
            this.watch("columns", () => {
                if (this.data.sortKey && !(this.data.columns ?? []).some((c) => c && c.key === this.data.sortKey)) {
                    this.data.sortKey = "";
                    this.data.sortOrder = "";
                    this.rebuildView();
                }
                this.syncGridCols();
            });
            this.watch("selectable", () => { this.syncGridCols(); });
            this.watch("selection", ({ value }) => {
                const next = Array.isArray(value) ? [...value] : [];
                const cur = this.data.selectedKeys ?? [];
                if (next.length === cur.length && next.every((k) => cur.includes(k))) return;
                this.data.selectedKeys = next;
                this.syncSelection();
            });
            this.watch("virtual", () => {
                setTimeout(() => { this.syncGridCols(); this.bindVHeadSync(); }, 0);
            });
        },
        unmounted() {
            this.unbindVHeadSync();
        },
    }
  <\/script>
  <style global id="autospark-components-table">
    .asc-table {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-table-font-size, 0.875rem));
    }

    .asc-table-inner {
      --asc-line: var(--auto-border-color, var(--asc-table-border-color, #d9d9d9));
      --asc-tone: var(--auto-primary-color, var(--asc-table-primary, #009aff));
      --asc-pad: var(--auto-padding, var(--asc-table-padding, 0.8rem));
      position: relative;
      display: block;
      background: var(--auto-bgcolor, var(--asc-table-bg, #ffffff));
      border: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-table-radius, 0.5rem));
      overflow: hidden;
    }
    .asc-table-inner[data-borderless="true"] {
      --asc-line: transparent;
    }

    /* ══════════ 普通分叉：CSS display:table 全 div 结构（table-layout:auto 列宽随内容，
       ARIA role 承载语义——happy-dom 语义 <table> 内 <template> content 丢失边界规避）══════════ */
    .asc-table-scroll {
      overflow: auto;
      overscroll-behavior: contain;
    }
    .asc-table-tablebox {
      display: table;
      width: 100%;
      border-collapse: collapse;
    }
    .asc-table-hrow,
    .asc-table-row {
      display: table-row;
    }
    .asc-table-body {
      display: table-row-group;
    }
    .asc-table-th {
      display: table-cell;
      padding: calc(var(--asc-pad, 0.8rem) * 0.7) calc(var(--asc-pad, 0.8rem) * 1.1);
      font-weight: var(--x-font-weight-medium, var(--asc-table-th-weight, 500));
      text-align: left;
      white-space: nowrap;
      background: var(--auto-panel-header-bgcolor, var(--asc-table-head-bg, rgba(245, 245, 245, 0.75)));
      border-bottom: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-table-th[data-sortable] {
      cursor: pointer;
      user-select: none;
    }
    .asc-table-th[data-sortable]:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-head-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-table-td {
      display: table-cell;
      padding: calc(var(--asc-pad, 0.8rem) * 0.65) calc(var(--asc-pad, 0.8rem) * 1.1);
      border-top: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-line, #d9d9d9) 60%, transparent);
    }
    .asc-table-th[data-align="center"],
    .asc-table-td[data-align="center"] {
      text-align: center;
    }
    .asc-table-th[data-align="right"],
    .asc-table-td[data-align="right"] {
      text-align: right;
    }
    /* 排序指示：纯 CSS 三角（SVG 子树指令不编译边界规避，progress 先例）——
       无态淡化提示可排、asc 实心朝上、desc 旋转朝下 */
    .asc-table-sort {
      display: inline-block;
      width: 0;
      height: 0;
      margin-left: 0.35em;
      vertical-align: middle;
      border-left: 0.26em solid transparent;
      border-right: 0.26em solid transparent;
      border-bottom: 0.32em solid
        var(--auto-third-color, var(--asc-table-sort-color, rgba(0, 0, 0, 0.35)));
      opacity: 0.3;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .asc-table-th[data-sortable] .asc-table-sort {
      opacity: 0.35;
    }
    .asc-table-th[data-sort="asc"] .asc-table-sort,
    .asc-table-vh[data-sort="asc"] .asc-table-sort {
      opacity: 1;
      border-bottom-color: var(--auto-primary-color, var(--asc-table-sort-active, #009aff));
    }
    .asc-table-th[data-sort="desc"] .asc-table-sort,
    .asc-table-vh[data-sort="desc"] .asc-table-sort {
      opacity: 1;
      transform: rotate(180deg);
      border-bottom-color: var(--auto-primary-color, var(--asc-table-sort-active, #009aff));
    }
    .asc-table-inner[data-selectable="true"] .asc-table-row:has(.asc-table-td-sel .asc-checkbox-input:checked),
    .asc-table-inner[data-selectable="true"] .asc-table-vrow:has(.asc-table-vtd-sel .asc-checkbox-input:checked) {
      background: color-mix(in srgb, var(--asc-tone) 8%, transparent);
    }
    .asc-table-inner[data-striped="true"] .asc-table-row[data-alt],
    .asc-table-inner[data-striped="true"] .asc-table-vrow[data-alt] {
      background: var(--auto-secondary-bgcolor, var(--asc-table-stripe-bg, rgba(245, 245, 245, 0.45)));
    }
    .asc-table-row:hover,
    .asc-table-vrow:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-row-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-table-td-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-table-color, #606060));
    }
    .asc-table-vtd .asc-table-td-text {
      width: 100%;
    }
    .asc-table-th-sel,
    .asc-table-td-sel,
    .asc-table-vh-sel,
    .asc-table-vtd-sel {
      text-align: center;
      white-space: nowrap;
    }
    .asc-table-th-sel,
    .asc-table-td-sel {
      width: 3em;
    }

    /* ══════════ 虚拟分叉：CSS grid 网格（--asc-table-cols 经 inner 继承贯通；行定高
       40px 与 itemHeight 配套，字号档位解耦——select/list 同款约束）══════════ */
    .asc-table-vhead {
      display: grid;
      grid-template-columns: var(--asc-table-cols, none);
      grid-auto-flow: column;
      grid-auto-columns: minmax(6em, 1fr);
      overflow: hidden;
      background: var(--auto-panel-header-bgcolor, var(--asc-table-head-bg, rgba(245, 245, 245, 0.75)));
      border-bottom: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-table-vbody {
      height: var(--asc-table-virtual-height, 20em);
      overflow: auto;
      overscroll-behavior: contain;
    }
    .asc-table-vrow {
      display: grid;
      grid-template-columns: var(--asc-table-cols, none);
      grid-auto-flow: column;
      grid-auto-columns: minmax(6em, 1fr);
      height: 40px;
      box-sizing: border-box;
      align-items: center;
    }
    .asc-table-vrow + .asc-table-vrow {
      border-top: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-line, #d9d9d9) 60%, transparent);
    }
    .asc-table-vh,
    .asc-table-vtd {
      display: flex;
      align-items: center;
      min-width: 0;
      padding: 0 calc(var(--asc-pad, 0.8rem) * 1.1);
      overflow: hidden;
    }
    .asc-table-vh {
      font-weight: var(--x-font-weight-medium, var(--asc-table-th-weight, 500));
      white-space: nowrap;
    }
    .asc-table-vh[data-sortable] {
      cursor: pointer;
      user-select: none;
    }
    .asc-table-vh[data-sortable]:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-head-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-table-vh[data-align="center"],
    .asc-table-vtd[data-align="center"] {
      justify-content: center;
    }
    .asc-table-vh[data-align="right"],
    .asc-table-vtd[data-align="right"] {
      justify-content: flex-end;
    }

    .asc-table-empty {
      padding: calc(var(--asc-pad, 0.8rem) * 1.5) var(--asc-pad, 0.8rem);
    }

    [dark] .asc-table-inner,
    [data-dark] .asc-table-inner {
      background: var(--auto-bgcolor, var(--asc-table-bg, #3a3a3a));
      --asc-line: var(--auto-border-color, var(--asc-table-border-color, #52525b));
    }
    [dark] .asc-table-th,
    [dark] .asc-table-vhead,
    [data-dark] .asc-table-th,
    [data-dark] .asc-table-vhead {
      background: var(--auto-panel-header-bgcolor, var(--asc-table-head-bg, rgba(80, 80, 80, 0.35)));
    }
    [dark] .asc-table-td-text,
    [data-dark] .asc-table-td-text {
      color: var(--auto-color, var(--asc-table-color, #fafafa));
    }
    [dark] .asc-table-inner[data-striped="true"] .asc-table-row[data-alt],
    [dark] .asc-table-inner[data-striped="true"] .asc-table-vrow[data-alt],
    [data-dark] .asc-table-inner[data-striped="true"] .asc-table-row[data-alt],
    [data-dark] .asc-table-inner[data-striped="true"] .asc-table-vrow[data-alt] {
      background: var(--auto-secondary-bgcolor, var(--asc-table-stripe-bg, rgba(129, 129, 129, 0.25)));
    }
    [dark] .asc-table-row:hover,
    [dark] .asc-table-vrow:hover,
    [data-dark] .asc-table-row:hover,
    [data-dark] .asc-table-vrow:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-row-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-table-sort,
    [data-dark] .asc-table-sort {
      border-bottom-color: var(--auto-third-color, var(--asc-table-sort-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <div
    class="asc-table-inner"
    :data-borderless="!bordered"
    :data-striped="striped"
    :data-selectable="selectable"
    :data-virtual="virtual"
    :x-loading="loading ? 'true' : 'false'"
  >
    <div class="asc-table-wrap" x-if="!virtual">
      <div class="asc-table-scroll">
        <div class="asc-table-tablebox" role="table">
          <div class="asc-table-hrow" role="row">
            <div class="asc-table-th asc-table-th-sel" role="columnheader" x-show="selectable">
              <span
                class="asc-table-check"
                x-component:autospark.checkbox="{ checked: allChecked, indeterminate: halfChecked }"
                @change="onToggleAll()"
              ></span>
            </div>
            <template x-for="column, colIndex of columns" :key="column.key">
              <div
                class="asc-table-th"
                role="columnheader"
                :data-sortable="column.sortable"
                :data-align="column.align"
                :data-sort="sortKey === column.key ? sortOrder : false"
                :style="column.width ? 'width:' + (typeof column.width === 'number' ? column.width + 'px' : column.width) : false"
                @click="onSortClick(column)"
              >
                <span class="asc-table-th-title">{{ column.title || column.key }}</span>
                <i class="asc-table-sort" x-show="column.sortable"></i>
              </div>
            </template>
          </div>
          <div class="asc-table-body" role="rowgroup" x-for="row, rowIndex of viewRows">
            <div class="asc-table-row" role="row" :data-alt="$even">
              <div class="asc-table-td asc-table-td-sel" role="cell" x-show="selectable">
                <span
                  class="asc-table-check"
                  x-component:autospark.checkbox="{ checked: selectedKeys.includes(row[rowKey] ?? rowIndex) }"
                  @change="onRowCheck(row, rowIndex)"
                ></span>
              </div>
              <template x-for="column, colIndex of columns" :key="column.key">
                <div
                  class="asc-table-td"
                  role="cell"
                  :data-align="column.align"
                  x-slot="{ name: 'col-' + column.key, params: { row, column, rowIndex, colIndex } }"
                >
                  <span
                    class="asc-table-td-text"
                    x-text="row[column.key] == null ? '' : (typeof row[column.key] === 'object' ? JSON.stringify(row[column.key]) : row[column.key])"
                  ></span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="asc-table-empty" x-show="!(viewRows && viewRows.length > 0)">
          <div class="asc-table-empty-outlet" x-slot="{ name: 'empty' }">
            <x-empty></x-empty>
          </div>
        </div>
      </div>
    </div>
    <div class="asc-table-vwrap" x-if="virtual">
      <div class="asc-table-vhead" role="row">
        <div class="asc-table-vh asc-table-vh-sel" role="columnheader" x-show="selectable">
          <span
            class="asc-table-check"
            x-component:autospark.checkbox="{ checked: allChecked, indeterminate: halfChecked }"
            @change="onToggleAll()"
          ></span>
        </div>
        <template x-for="column, colIndex of columns" :key="column.key">
          <div
            class="asc-table-vh"
            role="columnheader"
            :data-sortable="column.sortable"
            :data-align="column.align"
            :data-sort="sortKey === column.key ? sortOrder : false"
            @click="onSortClick(column)"
          >
            <span class="asc-table-th-title">{{ column.title || column.key }}</span>
            <i class="asc-table-sort" x-show="column.sortable"></i>
          </div>
        </template>
      </div>
      <div
        class="asc-table-vbody"
        role="rowgroup"
        x-for="row, rowIndex of viewRows"
        x-for-options="{ virtual: true, itemHeight: 40 }"
      >
        <div class="asc-table-vrow" role="row" :data-alt="$even">
          <div class="asc-table-vtd asc-table-vtd-sel" role="cell" x-show="selectable">
            <span
              class="asc-table-check"
              x-component:autospark.checkbox="{ checked: selectedKeys.includes(row[rowKey] ?? rowIndex) }"
              @change="onRowCheck(row, rowIndex)"
            ></span>
          </div>
          <template x-for="column, colIndex of columns" :key="column.key">
            <div
              class="asc-table-vtd"
              role="cell"
              :data-align="column.align"
              x-slot="{ name: 'col-' + column.key, params: { row, column, rowIndex, colIndex } }"
            >
              <span
                class="asc-table-td-text"
                x-text="row[column.key] == null ? '' : (typeof row[column.key] === 'object' ? JSON.stringify(row[column.key]) : row[column.key])"
              ></span>
            </div>
          </template>
        </div>
      </div>
      <div class="asc-table-empty" x-show="!(viewRows && viewRows.length > 0)">
        <div class="asc-table-empty-outlet" x-slot="{ name: 'empty' }">
          <x-empty></x-empty>
        </div>
      </div>
    </div>
  </div>
</div>
`,ca=`autospark.table`;function la(e){e.components[ca]=sa}ua();function ua(){y(e=>{m(e),la(e)})}var da=`<div
  class="asc-collapse"
  x-define="autospark.collapse"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: [],
            items: [],
            accordion: false,
            expandIconPosition: "end",
        }),
        methods: {
            toArray(v) {
                if (v == null) return [];
                if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
                return String(v).split(/[,\\s]+/).map((x) => x.trim()).filter(Boolean);
            },
            toggle(key) {
                if (key == null || String(key) === "") return;
                const k = String(key);
                const cur = this.toArray(this.data.value);
                const next = cur.includes(k) ? cur.filter((x) => x !== k) : (this.data.accordion ? [k] : cur.concat(k));
                this.data.value = next;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));
            },
            syncOpenState() {
                const keys = this.toArray(this.data.value);
                for (const item of Array.from(this.el.querySelectorAll(".asc-collapse-item[data-key]"))) {
                    const k = String(item.getAttribute("data-key"));
                    if (keys.includes(k)) item.setAttribute("data-open", "");
                    else item.removeAttribute("data-open");
                }
                for (const h of Array.from(this.el.querySelectorAll(".asc-collapse-header[data-key]"))) {
                    h.setAttribute("aria-expanded", keys.includes(String(h.getAttribute("data-key"))) ? "true" : "false");
                }
            },
            onRootClick(event) {
                const t = event.target instanceof Element ? event.target : null;
                const header = t ? t.closest(".asc-collapse-header") : null;
                if (!header || !this.el.contains(header)) return;
                this.toggle(header.getAttribute("data-key"));
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) this.data.items = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            this.data.value = this.toArray(this.data.value);

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => this.toArray(this.data.value).slice(),
                set: (v) => { this.data.value = this.toArray(v); },
                configurable: true,
            });

            this.syncOpenState();
            this.watch("value", () => this.syncOpenState());
            this.watch("items", () => setTimeout(() => this.syncOpenState(), 0));

            this.el.addEventListener("click", (e) => this.onRootClick(e));

            setTimeout(() => {
                if (Array.isArray(prior) && prior.length && !this.toArray(this.data.value).length) {
                    this.data.value = this.toArray(prior);
                }
                this.syncOpenState();
            }, 0);
        },
    }
  <\/script>
  <style global id="autospark-components-collapse">
    .asc-collapse {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-collapse-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-collapse-body {
      --asc-line: var(--auto-border-color, var(--asc-collapse-border-color, #d9d9d9));
      display: block;
      border: var(--auto-border-size, var(--asc-collapse-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-collapse-radius, 0.5rem));
      background: var(--auto-bgcolor, var(--asc-collapse-bg, #ffffff));
      overflow: hidden;
    }
    .asc-collapse-items {
      display: contents;
    }
    .asc-collapse-slot {
      display: contents;
    }
    .asc-collapse-slot:empty {
      display: none;
    }
    .asc-collapse-body:not(:has(.asc-collapse-item)) {
      display: none;
    }

    .asc-collapse-item + .asc-collapse-item,
    .asc-collapse-items + .asc-collapse-slot .asc-collapse-item:first-child {
      border-top: var(--auto-border-size, var(--asc-collapse-border-size, 1px)) solid var(--asc-line);
    }
    .asc-collapse-header {
      appearance: none;
      font: inherit;
      line-height: inherit;
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      padding: 0.6em calc(0.8em + 0.2em);
      border: none;
      background: transparent;
      color: var(--auto-color, var(--asc-collapse-color, #606060));
      text-align: start;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .asc-collapse-header:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-collapse-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-collapse-header:disabled {
      color: var(--auto-disable-color, var(--asc-collapse-disable-color, rgba(0, 0, 0, 0.25)));
      cursor: not-allowed;
    }
    .asc-collapse-header:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--auto-primary-color, var(--asc-collapse-primary, #009aff)) 28%, transparent);
    }
    .asc-collapse-title {
      flex: 1;
      min-width: 0;
      font-weight: var(--x-font-weight-medium, 500);
    }
    .asc-collapse-icon {
      display: inline-flex;
      color: var(--auto-third-color, var(--asc-collapse-icon-color, rgba(0, 0, 0, 0.35)));
      transform: rotate(0deg);
      transition: transform 0.2s ease;
    }
    .asc-collapse-item[data-open] .asc-collapse-icon {
      transform: rotate(90deg);
    }
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-header {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-title {
      flex: 0 1 auto;
      text-align: end;
    }

    .asc-collapse-content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.25s ease;
    }
    .asc-collapse-item[data-open] > .asc-collapse-content {
      grid-template-rows: 1fr;
    }
    .asc-collapse-inner {
      overflow: hidden;
      min-height: 0;
      padding: 0 calc(0.8em + 0.2em);
    }
    .asc-collapse-item[data-open] > .asc-collapse-content > .asc-collapse-inner {
      padding-block: 0.6em;
    }
    @media (prefers-reduced-motion: reduce) {
      .asc-collapse-content,
      .asc-collapse-icon {
        transition: none;
      }
    }

    [dark] .asc-collapse-body,
    [data-dark] .asc-collapse-body {
      --asc-line: var(--auto-border-color, var(--asc-collapse-border-color, #52525b));
      background: var(--auto-bgcolor, var(--asc-collapse-bg, #3a3a3a));
    }
    [dark] .asc-collapse-header,
    [data-dark] .asc-collapse-header {
      color: var(--auto-color, var(--asc-collapse-color, #fafafa));
    }
    [dark] .asc-collapse-header:disabled,
    [data-dark] .asc-collapse-header:disabled {
      color: var(--auto-disable-color, var(--asc-collapse-disable-color, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-collapse-header:hover:not(:disabled),
    [data-dark] .asc-collapse-header:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-collapse-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-collapse-icon,
    [data-dark] .asc-collapse-icon {
      color: var(--auto-third-color, var(--asc-collapse-icon-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <div class="asc-collapse-body" :data-expand-position="expandIconPosition">
    <div class="asc-collapse-items" x-for="item of items" :key="String(item.key)">
      <div class="asc-collapse-item" :data-key="String(item.key)">
        <button
          type="button"
          class="asc-collapse-header"
          :data-key="String(item.key)"
          :disabled="item.disabled"
        >
          <span class="asc-collapse-title">{{ item.title }}</span>
          <i class="asc-collapse-icon" x-icon="'arrow'"></i>
        </button>
        <div class="asc-collapse-content">
          <div class="asc-collapse-inner" x-html="item.content"></div>
        </div>
      </div>
    </div>
    <div class="asc-collapse-slot" x-slot></div>
  </div>
</div>
`,fa=`autospark.collapse`;function pa(e){e.components[fa]=da,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-collapse`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-collapse-item`);for(let e of n){let t=e.getAttribute(`key`)??``,n=document.createElement(`div`);n.className=`asc-collapse-item`,n.setAttribute(`data-key`,t);let r=document.createElement(`button`);r.type=`button`,r.className=`asc-collapse-header`,r.setAttribute(`data-key`,t),e.hasAttribute(`disabled`)&&r.setAttribute(`disabled`,``);let i=document.createElement(`span`);i.className=`asc-collapse-title`,i.textContent=e.getAttribute(`title`)??``;let a=document.createElement(`i`);a.className=`asc-collapse-icon`,a.setAttribute(`x-icon`,`'arrow'`),r.appendChild(i),r.appendChild(a);let o=document.createElement(`div`);o.className=`asc-collapse-content`;let s=document.createElement(`div`);for(s.className=`asc-collapse-inner`;e.firstChild;)s.appendChild(e.firstChild);o.appendChild(s),n.appendChild(r),n.appendChild(o),e.replaceWith(n)}let r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),r!=null&&r!==``&&!i&&!n.length)try{Array.isArray(JSON.parse(r))&&e.setAttribute(`data-items`,r)}catch{}let a=[];for(let n of Array.from(t.attributes)){if(n.name.startsWith(`:`)){a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`);continue}if(n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)){e.setAttribute(n.name,n.value);continue}let t=n.name===`accordion`&&n.value===``||$(n.value);a.push(`${Q(Z(n.name))}: ${JSON.stringify(t)}`)}for(e.setAttribute(`x-component:${fa}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}ma();function ma(){y(e=>{m(e),pa(e)})}var ha=`<span\r
  class="asc-field"\r
  x-define="autospark.field"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            status: "",
            disabled: false,
            readonly: false,
            actions: [],
        }),\r
        mounted() {\r
            const control = () => this.el.querySelector("[data-autospark-control]");\r
\r
            const applyStatus = () => {\r
                const v = this.data.status;\r
                if (typeof v === "string" && v !== "") this.el.setAttribute("data-status", v);\r
                else this.el.removeAttribute("data-status");\r
            };\r
\r
            const syncControl = () => {\r
                const c = control();\r
                if (c) {\r
                    c.disabled = !!this.data.disabled;\r
                    if ("readOnly" in c) c.readOnly = !!this.data.readonly;\r
                    if (this.data.status === "error") c.setAttribute("aria-invalid", "true");\r
                    else c.removeAttribute("aria-invalid");\r
                }\r
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);\r
                this.el.toggleAttribute("data-readonly", !!this.data.readonly);\r
            };\r
\r
            this.el.addEventListener("focusin", () => {\r
                this.el.setAttribute("data-focus", "");\r
            });\r
            this.el.addEventListener("focusout", (e) => {\r
                const to = e.relatedTarget;\r
                if (to instanceof Node && this.el.contains(to)) return;\r
                this.el.removeAttribute("data-focus");\r
            });\r
\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t) return;\r
                if (this.data.disabled) return;\r
                if (t.closest("[data-autospark-control]")) return;\r
                if (t.closest("[data-autospark-action]")) return;\r
                const c = control();\r
                if (c && typeof c.focus === "function") c.focus();\r
            });\r
\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t) return;\r
                const btn = t.closest(".asc-field-action");\r
                if (!btn || !this.el.contains(btn)) return;\r
                const wrap = btn.closest(".asc-field-actions");\r
                if (!wrap) return;\r
                const side = wrap.classList.contains("asc-field-actions-before") ? "before" : "after";\r
                const list = (Array.isArray(this.data.actions) ? this.data.actions : [])\r
                    .filter((a) => a && (a.pos || "after") === side);\r
                const i = Array.from(wrap.querySelectorAll(".asc-field-action")).indexOf(btn);\r
                const item = list[i];\r
                if (!item) return;\r
                this.el.dispatchEvent(new CustomEvent("action-click", {\r
                    bubbles: true,\r
                    detail: { index: i, name: item.name, value: item.value, item },\r
                }));\r
            });\r
\r
            const syncAll = () => { applyStatus(); syncControl(); };\r
            setTimeout(syncAll, 0);\r
            this.watch("status", () => { setTimeout(syncAll, 0); });\r
            this.watch("disabled", () => { setTimeout(syncAll, 0); });\r
            this.watch("readonly", () => { setTimeout(syncAll, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-field">\r
    /* ---------- .asc-field 布局基座（无盒饰——chrome 由 .asc-field-box 选配类承担）：\r
         tone 为状态色中转变量（缺省 primary，data-status 派生），焦点环/边框统一消费；\r
         尺寸档位经主题 data-size 通道全跟随（字号/行高/字体族消费 --auto-font-* 基线，\r
         字面级校准 theme-token-baseline.md：无 theme 环境与 theme 默认档观感归一） ---------- */\r
    .asc-field {\r
      --asc-field-tone: var(\r
        --auto-primary-color,\r
        var(--asc-field-primary, #009aff)\r
      );\r
      display: inline-flex;\r
      align-items: center;\r
      font-family: var(\r
        --auto-font-family,\r
        var(--asc-field-font-family, inherit)\r
      );\r
      font-size: var(--auto-font-size, var(--asc-field-font-size, 1rem));\r
      line-height: var(--auto-line-height, var(--asc-field-line-height, 1.5));\r
      color: var(--auto-color, var(--asc-field-color, #606060));\r
    }\r
    .asc-field[data-status="error"] {\r
      --asc-field-tone: var(\r
        --auto-danger-color,\r
        var(--asc-field-danger, #ef4444)\r
      );\r
    }\r
    .asc-field[data-status="success"] {\r
      --asc-field-tone: var(\r
        --auto-success-color,\r
        var(--asc-field-success, #22c55e)\r
      );\r
    }\r
    .asc-field[data-status="warning"] {\r
      --asc-field-tone: var(\r
        --auto-warning-color,\r
        var(--asc-field-warning, #f59e0b)\r
      );\r
    }\r
\r
    /* ---------- .asc-field-box 盒饰选配类（input 类控件 chrome；裸态控件不加）：\r
         高度/内距消费 --auto-input-*（theme data-size/data-spacing 档位联动）；\r
         边框 = 组合令牌打底 + border-color longhand 色通道（ADR-0020 决策 7\r
         2026-11-17 修订）：shorthand 消费 --auto-input-border（theme input 域\r
         组合令牌，size+color 成对校准；缺省回退拆分链保持无 theme 观感），\r
         随后 border-color 接 --asc-field-line 中转（hover/focus/状态/禁用只换\r
         色不动粗——longhand 覆盖 shorthand 色分量，状态重染色机制完整保留） ---------- */\r
    .asc-field-box {\r
      --asc-field-line: var(\r
        --auto-border-color,\r
        var(--asc-field-border-color, #f0f0f0)\r
      );\r
      box-sizing: border-box;\r
      border: var(\r
        --auto-input-border,\r
        var(--asc-field-border-size, 1px) solid\r
          var(--asc-field-border-color, #f0f0f0)\r
      );\r
      border-color: var(--asc-field-line);\r
      border-radius: var(--auto-input-radius, var(--asc-field-radius, 0.5rem));\r
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #ffffff));\r
      /* 高度兜底随字号自适应（≈字号 × 2.57）：theme 档位块引用的 --x-input-height-* 标尺\r
         未定义（theme 侧缺陷），档位容器上 --auto-input-height 失效落此级时仍随档位缩放 */\r
      height: var(\r
        --auto-input-height,\r
        var(--asc-field-height, calc(var(--auto-font-size, 1rem) * 2.57))\r
      );\r
      /* 最小高度守卫（max）：theme 基值 --auto-input-height 实为行高（24px，未含内距预算），\r
         纵向内距在场时固定高度会把控件压扁——令牌不足时以「行内容高 + 纵向距×2 + 边框×2」\r
         兜底（token 为盒高语义保持，theme 补标尺后天然让位；--auto-line-height 为 rem 制\r
         长度，直接作行内容高消费，勿与 font-size 相乘） */\r
      min-height: max(\r
        var(\r
          --auto-input-height,\r
          var(--asc-field-height, calc(var(--auto-font-size, 1rem) * 2.57))\r
        ),\r
        calc(\r
          var(--auto-line-height, 1.5rem) + var(--auto-border-size, 1px) * 2 +\r
            var(--auto-input-padding, var(--asc-field-padding, 0.8rem))\r
        )\r
      );\r
      /* 四向内距（纵向取横向半距——输入框惯例；固定高度形态（border-box）纵向被\r
         高度+flex 居中吸收，height:auto 形态（多行控件 autospark.textarea / theme\r
         在场标尺缺陷回退）由纵向半距撑起呼吸感，全档位随 --auto-input-padding 联动） */\r
      padding: calc(\r
          var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2\r
        )\r
        var(--auto-input-padding, var(--asc-field-padding, 0.8rem));\r
      transition:\r
        border-color 0.15s ease,\r
        box-shadow 0.15s ease,\r
        background-color 0.15s ease;\r
      cursor: text;\r
    }\r
    .asc-field-box:hover:not([data-disabled]):not([data-readonly]):not(\r
        [data-status]\r
      ) {\r
      --asc-field-line: var(\r
        --auto-hover-border-color,\r
        var(--asc-field-hover-border, #009aff)\r
      );\r
    }\r
    .asc-field-box[data-focus] {\r
      --asc-field-line: var(--asc-field-tone);\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    .asc-field-box[data-status="error"],\r
    .asc-field-box[data-status="success"],\r
    .asc-field-box[data-status="warning"] {\r
      --asc-field-line: var(--asc-field-tone);\r
    }\r
    /* 禁用：边框/底色取禁用语义变量 + 禁点光标（控件字色由 opacity 整体淡化）；\r
         状态在场时边框让位状态色（status 是显式意图，禁用仅接管底色/光标） */\r
    .asc-field-box[data-disabled]:not([data-status]) {\r
      --asc-field-line: var(\r
        --auto-disable-border-color,\r
        var(--asc-field-disable-border, #bdbdbd)\r
      );\r
      background: var(\r
        --auto-disable-bgcolor,\r
        var(--asc-field-disable-bg, rgba(96, 96, 96, 0.2))\r
      );\r
      cursor: not-allowed;\r
    }\r
    .asc-field-box[data-disabled][data-status] {\r
      background: var(\r
        --auto-disable-bgcolor,\r
        var(--asc-field-disable-bg, rgba(96, 96, 96, 0.2))\r
      );\r
      cursor: not-allowed;\r
    }\r
    .asc-field-box[data-readonly] {\r
      cursor: default;\r
    }\r
\r
    /* ---------- 具名装饰出口 prefix/suffix（2026-11-15 切 template 载体，ADR-0137）：\r
         出口无包裹层——类经属性活注入落投影内容首根，内容根即骨架 flex 项：\r
         次要色设在内容根（消费方设色自然覆盖）+ 防收缩换行（控件 width:100% 会挤压\r
         装饰至 min-content，flex:none 镜像 .asc-input-prefix 同款保护）与间距（0.4em\r
         镜像 .asc-input-prefix/suffix 惯例）直接落内容根本身。无内容整出口静默消失\r
         （零多余 DOM，裸态控件组件继承亦无害）；多根装饰仅首根得注入类——装饰出口\r
         建议单根，多根后续节点消费方自理 ---------- */\r
    .asc-field-prefix,\r
    .asc-field-suffix {\r
      color: var(\r
        --auto-secondary-color,\r
        var(--asc-field-affix, rgba(96, 96, 96, 0.75))\r
      );\r
    }\r
    .asc-field-prefix {\r
      flex: none;\r
      margin-inline-end: 0.4em;\r
    }\r
    .asc-field-suffix {\r
      flex: none;\r
      margin-inline-start: 0.4em;\r
    }\r
\r
    .asc-field-body {\r
      display: contents;\r
    }\r
\r
    /* ---------- 融合动作 actions（2026-11-16 修订二）：渲染段容器 display:contents\r
         （按钮直接成盒饰 flex 项）；融合仅在盒饰层（.asc-field-box 后代——裸态控件\r
         无盒饰融合线不生效）——复用 button-group 负 margin 边线复用范式（ADR-0014\r
         决策 2）：按钮边框色让位 --asc-field-line 共享线（status/disabled 联动天然\r
         继承——变量定义在 box 上随状态覆盖），相邻按钮侧线压叠单线、组首/尾与盒\r
         边框重合（负距吃掉单侧内距+边框）；首/尾钮外侧圆角匹配盒饰、其余清除。\r
         **上下边框单线让位（2026-11-16 修订三）**：按钮不画自己的上下边框、纵向\r
         负距不吃盒边框（从线内缘起）——盒线独享、连续穿过按钮段。此前「两线对齐」\r
         形态（按钮自带上下线 + 负距全高贴边）在非整数缩放下两条各自取整的 1px 线\r
         会差出 1 物理像素（重合不严），且实心/无边框 variant 的按钮背景会盖住盒线\r
         段；单线让位结构性消灭两类缺陷（线只有一个绘制者）。左右侧线照常由按钮\r
         绘制（--asc-field-line） ---------- */\r
    .asc-field-actions {\r
      display: contents;\r
    }\r
    .asc-field-box .asc-field-action {\r
      /* 内侧分隔线（钮↔钮、钮↔控件）与盒边框同色（--asc-field-line 共享线，随\r
         hover/focus/status/disabled 状态同步染——2026-11-17 回归：variant 缺省\r
         secondary 的半透明衬底（叠盒底成浅罩）已保证与线色的对比，此前「暗色\r
         湮灭」前提（plain 实底与盒线同色）不复存在，独立 divider 分档退役）；\r
         上下线不画（单线让位） */\r
      border-color: var(--asc-field-line);\r
      border-top-width: 0;\r
      border-bottom-width: 0;\r
      border-radius: 0;\r
      align-self: stretch;\r
      margin-block: calc(\r
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2\r
      );\r
    }\r
    /* 外侧竖线让位盒线（首钮左 / 尾钮右不画——盒线独享整圈外框，同上下线单线让位\r
       哲学：防按钮线与状态染色的盒线在贴边处双色并排） */\r
    .asc-field-box .asc-field-actions-before .asc-field-action:first-of-type {\r
      border-left-width: 0;\r
    }\r
    .asc-field-box .asc-field-actions-after .asc-field-action:last-of-type {\r
      border-right-width: 0;\r
    }\r
    /* before 组首钮左贴盒左线（负距吃左内距+边框）+ 外侧圆角匹配盒饰。\r
       首尾用 *-of-type：x-for 的 template 宿主渲染后追加在项元素之后（DOM 序\r
       [钮…, template]），:last-child 会误中 template */\r
    .asc-field-box .asc-field-actions-before .asc-field-action:first-of-type {\r
      margin-inline-start: calc(\r
        -1 *\r
          (\r
            var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) +\r
              var(--auto-border-size, var(--asc-field-border-size, 1px))\r
          )\r
      );\r
      border-start-start-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
      border-end-start-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
    }\r
    .asc-field-box .asc-field-actions-after .asc-field-action:last-of-type {\r
      margin-inline-end: calc(\r
        -1 *\r
          (\r
            var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) +\r
              var(--auto-border-size, var(--asc-field-border-size, 1px))\r
          )\r
      );\r
      border-start-end-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
      border-end-end-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
    }\r
    .asc-field-box .asc-field-action + .asc-field-action {\r
      margin-inline-start: calc(\r
        -1 * var(--auto-border-size, var(--asc-field-border-size, 1px))\r
      );\r
    }\r
    /* 钮组与控件位间距（2026-11-16）：贴盒边融合保留（首/尾钮负距吃盒内距+边框，\r
       控件与钮零距贴死）——组靠控件侧一钮留 0.4em 缝（镜像装饰出口间距标尺）。\r
       伪类须 *-of-type：x-for 的 template 锚点追加在项后（同款坑见上方贴边规则），\r
       :last-child 永不命中（template 在最后） */\r
    .asc-field-box .asc-field-actions-before .asc-field-action:last-of-type {\r
      margin-inline-end: 0.4em;\r
    }\r
    .asc-field-box .asc-field-actions-after .asc-field-action:first-of-type {\r
      margin-inline-start: 0.4em;\r
    }\r
\r
    [dark] .asc-field,\r
    [data-dark] .asc-field {\r
      --asc-field-tone: var(\r
        --auto-primary-color,\r
        var(--asc-field-primary, #56baff)\r
      );\r
      color: var(--auto-color, var(--asc-field-color, #fafafa));\r
    }\r
    [dark] .asc-field[data-status="error"],\r
    [data-dark] .asc-field[data-status="error"] {\r
      --asc-field-tone: var(\r
        --auto-danger-color,\r
        var(--asc-field-danger, #e6696a)\r
      );\r
    }\r
    [dark] .asc-field[data-status="success"],\r
    [data-dark] .asc-field[data-status="success"] {\r
      --asc-field-tone: var(\r
        --auto-success-color,\r
        var(--asc-field-success, #5cd07c)\r
      );\r
    }\r
    [dark] .asc-field[data-status="warning"],\r
    [data-dark] .asc-field[data-status="warning"] {\r
      --asc-field-tone: var(\r
        --auto-warning-color,\r
        var(--asc-field-warning, #f7d352)\r
      );\r
    }\r
    [dark] .asc-field-box:not([data-status]),\r
    [data-dark] .asc-field-box:not([data-status]) {\r
      --asc-field-line: var(\r
        --auto-border-color,\r
        var(--asc-field-border-color, #606060)\r
      );\r
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #3c3c3c));\r
    }\r
    [dark] .asc-field-box[data-disabled]:not([data-status]),\r
    [data-dark] .asc-field-box[data-disabled]:not([data-status]) {\r
      --asc-field-line: var(\r
        --auto-disable-border-color,\r
        var(--asc-field-disable-border, #7a7a7a)\r
      );\r
      background: var(\r
        --auto-disable-bgcolor,\r
        var(--asc-field-disable-bg, rgba(250, 250, 250, 0.2))\r
      );\r
    }\r
    [dark] .asc-field-prefix,\r
    [dark] .asc-field-suffix,\r
    [data-dark] .asc-field-prefix,\r
    [data-dark] .asc-field-suffix {\r
      color: var(\r
        --auto-secondary-color,\r
        var(--asc-field-affix, rgba(250, 250, 250, 0.75))\r
      );\r
    }\r
  </style>\r
  <span\r
    class="asc-field-actions asc-field-actions-before"\r
    x-if="!!(actions && actions.length)"\r
  >\r
    <template x-for="item of actions.filter(a => a && a.pos === 'before')">\r
      <span\r
        class="asc-field-action"\r
        data-autospark-action\r
        x-component:autospark.button="Object.assign({ variant: 'secondary' }, item, { disabled: item.disabled || !!disabled })"\r
      ></span>\r
    </template>\r
  </span>\r
  <template class="asc-field-prefix" x-slot:prefix></template>\r
  <span class="asc-field-body" x-slot></span>\r
  <template class="asc-field-suffix" x-slot:suffix></template>\r
  <span\r
    class="asc-field-actions asc-field-actions-after"\r
    x-if="!!(actions && actions.length)"\r
  >\r
    <template x-for="item of actions.filter(a => !a || a.pos !== 'before')">\r
      <span\r
        class="asc-field-action"\r
        data-autospark-action\r
        x-component:autospark.button="Object.assign({ variant: 'secondary' }, item, { disabled: item.disabled || !!disabled })"\r
      ></span>\r
    </template>\r
  </span>\r
</span>\r
`,ga=`autospark.field`;function _a(e){e.components[ga]=ha}va();function va(){y(e=>{m(e),_a(e)})}var ya=`<span\r
  class="asc-input asc-field-box"\r
  x-define="autospark.input"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            type: "text",
            value: "",
            placeholder: "",
            maxlength: 0,
            clearable: false,
            prefix: "",
            suffix: "",
            hasValue: false,
        }),\r
        methods: {\r
            onClear(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled || this.data.readonly) return;\r
                const n = this.el.querySelector(".asc-input-native");\r
                if (!n) return;\r
                n.value = "";\r
                n.dispatchEvent(new Event("input", { bubbles: true }));\r
                n.focus();\r
            },\r
        },\r
        mounted() {\r
            const native = () => this.el.querySelector(".asc-input-native");\r
            let lastValue = "";\r
\r
            const syncLen = () => {\r
                const n = native();\r
                this.data.hasValue = n ? String(n.value ?? "").length > 0 : false;\r
            };\r
\r
            const syncValue = () => {\r
                const n = native();\r
                if (n) n.value = lastValue;\r
                syncLen();\r
            };\r
\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                const t = String(this.data.type ?? "text");\r
                if (n instanceof HTMLInputElement) {\r
                    n.type = t || "text";\r
                }\r
                n.placeholder = String(this.data.placeholder ?? "");\r
                const ml = Number(this.data.maxlength) || 0;\r
                if (ml > 0) n.setAttribute("maxlength", String(ml));\r
                else n.removeAttribute("maxlength");\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
            const prior = this.el.value;\r
            if (typeof prior === "string" && prior !== "") lastValue = prior;\r
            else if (this.data.value != null) lastValue = String(this.data.value);\r
            const snapshotNorm = String(prior ?? "");\r
            let initDone = false;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const n = native();\r
                    return n ? n.value : lastValue;\r
                },\r
                set: (v) => {\r
                    if (!initDone && String(v ?? "") === snapshotNorm) return;\r
                    lastValue = String(v ?? "");\r
                    const n = native();\r
                    if (n) n.value = lastValue;\r
                    syncLen();\r
                },\r
                configurable: true,\r
            });\r
\r
            this.el.addEventListener("input", () => {\r
                const n = native();\r
                if (n) lastValue = n.value;\r
                syncLen();\r
            });\r
\r
            setTimeout(() => {\r
                syncAttrs();\r
                syncValue();\r
                initDone = true;
            }, 0);\r
\r
            this.watch("type", () => { setTimeout(() => { syncAttrs(); syncValue(); }, 0); });\r
            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });\r
            this.watch("maxlength", () => { setTimeout(syncAttrs, 0); });\r
            let lastPropsValue = String(this.data.value ?? "");\r
            this.watch("value", ({ value }) => {\r
                const v = String(value ?? "");\r
                if (v === lastPropsValue) return;\r
                lastPropsValue = v;\r
                if (v === lastValue) return;\r
                lastValue = v;\r
                const n = native();\r
                if (n) n.value = v;\r
                syncLen();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-input">\r
    .asc-input-native {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      width: 100%;\r
      height: 100%;\r
      border: none;\r
      outline: none;\r
      background: transparent;\r
      padding: 0;\r
      margin: 0;\r
      color: inherit;\r
      font: inherit;\r
      cursor: inherit;\r
    }\r
    .asc-input-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-input-native:disabled {\r
      cursor: not-allowed;\r
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-input-disable-color, inherit));\r
    }\r
\r
    /* ---------- 前后置装饰容器（2026-11-16 装饰上提，ADR-0020 修订）：props 装饰经\r
         template 覆盖段上提 field 出口——次要色/间距/防收缩由出口注入类\r
         .asc-field-prefix/.asc-field-suffix 落本容器（活注入取首个元素根，单根容器\r
         承接防多根裸奔）；容器只管混排内距（图标 + 文本 0.35em）与不换行 ---------- */\r
    .asc-input-affix {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      white-space: nowrap;\r
    }\r
\r
    .asc-input-action {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      cursor: pointer;\r
      border-radius: var(--auto-border-radius, var(--asc-input-action-radius, 0.25rem));\r
      color: var(--auto-third-color, var(--asc-input-action, rgba(0, 0, 0, 0.35)));\r
      transition: color 0.15s ease;\r
    }\r
    .asc-input-action:hover {\r
      color: var(--auto-color, var(--asc-input-action-hover, #606060));\r
    }\r
    .asc-input-action:active {\r
      transform: scale(0.92);\r
    }\r
\r
    [dark] .asc-input-native::placeholder,\r
    [data-dark] .asc-input-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-input-affix,\r
    [data-dark] .asc-input-affix {\r
      color: var(--auto-secondary-color, var(--asc-input-affix, rgba(255, 255, 255, 0.65)));\r
    }\r
    [dark] .asc-input-action,\r
    [data-dark] .asc-input-action {\r
      color: var(--auto-third-color, var(--asc-input-action, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-input-action:hover,\r
    [data-dark] .asc-input-action:hover {\r
      color: var(--auto-color, var(--asc-input-action-hover, #fafafa));\r
    }\r
  </style>\r
  <template x-slot:prefix class="asc-field-prefix">\r
    <span class="asc-input-affix" x-if="!!prefix">\r
      <i class="asc-input-icon" x-if="typeof prefix === 'object' && prefix && !!prefix.icon" x-icon="prefix.icon"></i>\r
      <span class="asc-input-text" x-if="typeof prefix === 'string' && !!prefix">{{ prefix }}</span>\r
    </span>\r
  </template>\r
  <template x-slot:suffix class="asc-field-suffix">\r
    <span class="asc-input-affix" x-if="!!suffix">\r
      <i class="asc-input-icon" x-if="typeof suffix === 'object' && suffix && !!suffix.icon" x-icon="suffix.icon"></i>\r
      <span class="asc-input-text" x-if="typeof suffix === 'string' && !!suffix">{{ suffix }}</span>\r
    </span>\r
  </template>\r
  <input class="asc-input-native" data-autospark-control />\r
  <i\r
    class="asc-input-action asc-input-clear"\r
    data-autospark-action\r
    x-if="clearable && hasValue"\r
    x-icon="'no'"\r
    @click="onClear($event)"\r
  ></i>\r
</span>\r
`,ba=`autospark.input`,xa=new Set([`disabled`,`readonly`,`clearable`]);function Sa(e){e.components[ba]=ya,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-input`))){let e=document.createElement(`span`),n=[];for(let r of Array.from(t.attributes)){if(r.name.startsWith(`:`)){n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`);continue}if(r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)){e.setAttribute(r.name,r.value);continue}let t=Z(r.name);r.value===``&&xa.has(r.name)?n.push(`${Q(t)}: true`):n.push(`${Q(t)}: ${JSON.stringify($(r.value))}`)}let r=t.textContent?.trim()??``,i=n.some(e=>e.startsWith(`value:`)),a=t.children.length>0;for(r!==``&&!i&&!a&&(n.push(`value: ${JSON.stringify(r)}`),t.textContent=``),e.setAttribute(`x-component:${ba}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ca();function Ca(){y(e=>{m(e),Sa(e)})}var wa=`<span class="asc-password" x-define="autospark.password" x-define:inherit="autospark.input">
  <script setup>
    {
        data: () => ({
            type: "password",
            viewable: true,
            minlength: 0,
            autocomplete: "",
            revealed: false,
        }),
        methods: {
            applyRevealed() {
                const n = this.el.querySelector(".asc-input-native");
                if (!(n instanceof HTMLInputElement)) return;
                const start = n.selectionStart;
                const end = n.selectionEnd;
                n.type = this.data.revealed ? "text" : "password";
                if (start != null && end != null) {
                    try {
                        n.setSelectionRange(start, end);
                    } catch {
                    }
                }
            },
            onToggleReveal() {
                if (this.data.disabled) return;
                this.data.revealed = !this.data.revealed;
                this.applyRevealed();
                const n = this.el.querySelector(".asc-input-native");
                if (n && typeof n.focus === "function") n.focus();
            },
        },
        mounted() {
            const native = () => this.el.querySelector(".asc-input-native");

            const normalizeType = () => {
                if (this.data.type !== "password") this.data.type = "password";
            };

            const syncOwnAttrs = () => {
                const n = native();
                if (!n) return;
                const min = Number(this.data.minlength) || 0;
                if (min > 0) n.setAttribute("minlength", String(min));
                else n.removeAttribute("minlength");
                const ac = String(this.data.autocomplete ?? "");
                if (ac) n.setAttribute("autocomplete", ac);
                else n.removeAttribute("autocomplete");
            };

            const hide = () => {
                if (!this.data.revealed) return;
                this.data.revealed = false;
                this.applyRevealed();
            };

            this.el.addEventListener("input", () => {
                const n = native();
                if (!n || String(n.value ?? "") === "") hide();
            });

            setTimeout(() => {
                normalizeType();
                syncOwnAttrs();
                this.applyRevealed();
            }, 0);

            this.watch("minlength", () => { setTimeout(syncOwnAttrs, 0); });
            this.watch("autocomplete", () => { setTimeout(syncOwnAttrs, 0); });
            this.watch("viewable", ({ value }) => { if (!value) hide(); });
            this.watch("type", () => {
                setTimeout(() => {
                    normalizeType();
                    this.applyRevealed();
                }, 0);
            });
        },
    }
  <\/script>
  <style global id="autospark-components-password">
    /* ---------- 抑制浏览器原生密码显露钮（Edge/IE ::-ms-reveal / ::-ms-clear）：
        本组件的眼睛钮 / 清除钮是唯一动作面，若放任 UA 钮并排会出现两套语义相同的
        控件（ADR-0034 决策 3；旧 input 的「原生显示密码钮未协调」边界在此收口） ---------- */
    .asc-password .asc-input-native::-ms-reveal,
    .asc-password .asc-input-native::-ms-clear {
      display: none;
    }
  </style>
  <template x-slot:prefix class="asc-field-prefix">
    <span class="asc-input-affix">
      <i class="asc-input-icon asc-password-key" x-icon="'key'"></i>
      <i class="asc-input-icon" x-if="typeof prefix === 'object' && prefix && !!prefix.icon" x-icon="prefix.icon"></i>
      <span class="asc-input-text" x-if="typeof prefix === 'string' && !!prefix">{{ prefix }}</span>
    </span>
  </template>
  <input class="asc-input-native" data-autospark-control />
  <i
    class="asc-input-action asc-input-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i
    class="asc-input-action asc-password-eye"
    data-autospark-action
    role="button"
    x-if="viewable"
    :aria-label="revealed ? '隐藏密码' : '显示密码'"
    :aria-pressed="revealed ? 'true' : 'false'"
    x-icon="revealed ? 'eye-off' : 'eye'"
    @click="onToggleReveal()"
  ></i>
</span>
`,Ta=`autospark.password`,Ea=new Set([`disabled`,`readonly`,`clearable`,`viewable`]);function Da(e){e.components[Ta]=wa,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-password`))){let e=document.createElement(`span`),n=[];for(let r of Array.from(t.attributes)){if(r.name.startsWith(`:`)){n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`);continue}if(r.name===`type`)continue;if(r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)){e.setAttribute(r.name,r.value);continue}let t=Z(r.name);r.value===``&&Ea.has(r.name)?n.push(`${Q(t)}: true`):n.push(`${Q(t)}: ${JSON.stringify($(r.value))}`)}let r=t.textContent?.trim()??``,i=n.some(e=>e.startsWith(`value:`)),a=t.children.length>0;for(r!==``&&!i&&!a&&(n.push(`value: ${JSON.stringify(r)}`),t.textContent=``),e.setAttribute(`x-component:${Ta}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Oa();function Oa(){y(e=>{m(e),Da(e)})}var ka=`<span
  class="asc-textarea asc-field-box"
  x-define="autospark.textarea"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",
            placeholder: "",
            maxlength: 0,
            rows: 2,
            minRows: 0,
            maxRows: 8,
            autosize: true,
            resize: "",
            clearable: false,
            showCount: false,
            hasValue: false,
            countText: "",
            countVisible: false,
        }),
        methods: {
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.el.querySelector(".asc-textarea-native");
                if (!n) return;
                n.value = "";
                n.dispatchEvent(new Event("input", { bubbles: true }));
                n.focus();
            },
        },
        mounted() {
            const native = () => this.el.querySelector(".asc-textarea-native");
            let lastValue = "";

            const autoResize = () => {
                const n = native();
                if (!n) return;
                if (!this.data.autosize) {
                    n.style.height = "";
                    n.style.overflowY = "auto";
                    return;
                }
                const cs = getComputedStyle(n);
                const lineHeight = parseFloat(cs.lineHeight) || 0;
                const padY =
                    (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
                const borderY =
                    (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
                const minRows = Math.max(
                    1,
                    Number(this.data.minRows) || Number(this.data.rows) || 2,
                );
                const maxRows = Math.max(0, Number(this.data.maxRows) || 0);
                const minHeight = lineHeight > 0 ? lineHeight * minRows + padY + borderY : 0;
                const maxHeight =
                    lineHeight > 0 && maxRows > 0
                        ? lineHeight * maxRows + padY + borderY
                        : Infinity;
                n.style.height = "auto";
                const contentHeight = n.scrollHeight + borderY;
                n.style.height = \`\${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px\`;
                n.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
            };

            const syncLen = () => {
                const n = native();
                const len = n ? String(n.value ?? "").length : 0;
                this.data.hasValue = len > 0;
                const max = Number(this.data.maxlength) || 0;
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;
                this.data.countVisible = !!this.data.showCount || max > 0;
                this.el.toggleAttribute("data-over", max > 0 && len > max);
            };

            const syncValue = () => {
                const n = native();
                if (n) n.value = lastValue;
                syncLen();
                autoResize();
            };

            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                n.placeholder = String(this.data.placeholder ?? "");
                const ml = Number(this.data.maxlength) || 0;
                if (ml > 0) n.setAttribute("maxlength", String(ml));
                else n.removeAttribute("maxlength");
                n.rows = Math.max(1, Number(this.data.rows) || 2);
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
                n.style.resize = this.data.autosize
                    ? "none"
                    : String(this.data.resize) || "vertical";
                autoResize();
            };

            const prior = this.el.value;
            if (typeof prior === "string" && prior !== "") lastValue = prior;
            else if (this.data.value != null) lastValue = String(this.data.value);
            const snapshotNorm = String(prior ?? "");
            let initDone = false;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const n = native();
                    return n ? n.value : lastValue;
                },
                set: (v) => {
                    if (!initDone && String(v ?? "") === snapshotNorm) return;
                    lastValue = String(v ?? "");
                    const n = native();
                    if (n) n.value = lastValue;
                    syncLen();
                    autoResize();
                },
                configurable: true,
            });

            this.el.addEventListener("input", () => {
                const n = native();
                if (n) lastValue = n.value;
                syncLen();
                autoResize();
            });

            if (typeof ResizeObserver !== "undefined") {
                let lastWidth = 0;
                const ro = new ResizeObserver((entries) => {
                    const width = entries[0]?.contentRect?.width ?? 0;
                    if (Math.abs(width - lastWidth) < 1) return;
                    lastWidth = width;
                    autoResize();
                });
                const n = native();
                if (n) ro.observe(n);
            }

            setTimeout(() => {
                syncAttrs();
                syncValue();
                initDone = true;
                if (Array.isArray(this.data.actions) && this.data.actions.length > 0) {
                    this.engine?.logger?.warn("autospark.textarea: 不支持 actions（ADR-0032 修订，多行形态已取消融合动作），注入已忽略");
                }
            }, 0);

            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });
            this.watch("showCount", () => { setTimeout(syncLen, 0); });
            this.watch("rows", () => { setTimeout(() => { syncAttrs(); autoResize(); }, 0); });
            this.watch("minRows", () => { setTimeout(autoResize, 0); });
            this.watch("maxRows", () => { setTimeout(autoResize, 0); });
            this.watch("autosize", () => { setTimeout(syncAttrs, 0); });
            this.watch("resize", () => { setTimeout(syncAttrs, 0); });
            let lastPropsValue = String(this.data.value ?? "");
            this.watch("value", ({ value }) => {
                const v = String(value ?? "");
                if (v === lastPropsValue) return;
                lastPropsValue = v;
                if (v === lastValue) return;
                lastValue = v;
                const n = native();
                if (n) n.value = v;
                syncLen();
                autoResize();
            });
        },
    }
  <\/script>
  <style global id="autospark-components-textarea">
    /* ---------- 满宽惯例：多行输入默认占满可用宽（field 基座 inline-flex 收缩内容宽，
         input 等单行形态靠消费方给宽；textarea 惯例块级满宽——子样式拼接序在骨架后，胜） ---------- */
    .asc-textarea {
      width: 100%;
    }

    .asc-textarea-native {
      box-sizing: border-box;
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      height: auto;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      line-height: inherit;
      cursor: inherit;
      resize: none;
      overflow-y: hidden;
    }
    .asc-textarea-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-textarea-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-textarea-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-textarea-disable-color, inherit));
    }

    .asc-textarea.asc-field-box {
      position: relative;
      height: auto;
      flex-direction: column;
      align-items: stretch;
      cursor: text;
    }

    .asc-textarea-clear {
      position: absolute;
      top: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2);
      inset-inline-end: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2);
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-textarea-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-textarea-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-textarea-clear:hover {
      color: var(--auto-color, var(--asc-textarea-action-hover, #606060));
    }
    .asc-textarea-clear:active {
      transform: scale(0.92);
    }

    /* ---------- 计数器：绝对定位右下角（不占文本行宽；控件底部预留内距避免压字）；
         超限（data-over 由 mounted 同步）染 danger ---------- */
    .asc-textarea-count {
      position: absolute;
      inset-block-end: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 4);
      inset-inline-end: var(--auto-input-padding, var(--asc-field-padding, 0.8rem));
      font-size: 0.75em;
      line-height: 1;
      white-space: nowrap;
      pointer-events: none;
      color: var(--auto-third-color, var(--asc-textarea-count, rgba(0, 0, 0, 0.35)));
    }
    .asc-textarea[data-over] .asc-textarea-count {
      color: var(--auto-danger-color, var(--asc-textarea-count-over, #ef4444));
    }

    .asc-textarea:has(.asc-textarea-clear) .asc-textarea-native {
      padding-inline-end: 1.5em;
    }
    .asc-textarea:has(.asc-textarea-count) .asc-textarea-native {
      padding-block-end: 1.25em;
    }

    /* ---------- actions 不支持（ADR-0032 修订，2026-11-17 取消）：多行形态取消融合
         动作——field 渲染段整段屏蔽（display:none，注入静默忽略；mounted 对非空
         actions warn 一次）。此前「上/下整行布局」方案废止 ---------- */
    .asc-textarea .asc-field-actions {
      display: none;
    }

    [dark] .asc-textarea-native::placeholder,
    [data-dark] .asc-textarea-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-textarea-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-textarea-clear,
    [data-dark] .asc-textarea-clear {
      color: var(--auto-third-color, var(--asc-textarea-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-textarea-clear:hover,
    [data-dark] .asc-textarea-clear:hover {
      color: var(--auto-color, var(--asc-textarea-action-hover, #fafafa));
    }
    [dark] .asc-textarea-count,
    [data-dark] .asc-textarea-count {
      color: var(--auto-third-color, var(--asc-textarea-count, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-textarea[data-over] .asc-textarea-count,
    [data-dark] .asc-textarea[data-over] .asc-textarea-count {
      color: var(--auto-danger-color, var(--asc-textarea-count-over, #e6696a));
    }
  </style>
  <textarea class="asc-textarea-native" data-autospark-control rows="2"></textarea>
  <i
    class="asc-textarea-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <span class="asc-textarea-count" x-if="countVisible">{{ countText }}</span>
</span>
`,Aa=`autospark.textarea`,ja=new Set([`disabled`,`readonly`,`clearable`,`show-count`,`autosize`]);function Ma(e){e.components[Aa]=ka,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-textarea`))){let e=document.createElement(`span`),n=[];for(let r of Array.from(t.attributes)){if(r.name.startsWith(`:`)){n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`);continue}if(r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)){e.setAttribute(r.name,r.value);continue}let t=Z(r.name);r.value===``&&ja.has(r.name)?n.push(`${Q(t)}: true`):n.push(`${Q(t)}: ${JSON.stringify($(r.value))}`)}let r=t.textContent?.trim()??``,i=n.some(e=>e.startsWith(`value:`)),a=t.children.length>0;for(r!==``&&!i&&!a&&(n.push(`value: ${JSON.stringify(r)}`),t.textContent=``),e.setAttribute(`x-component:${Aa}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Na();function Na(){y(e=>{m(e),Ma(e)})}var Pa=`<span\r
  class="asc-checkbox"\r
  x-define="autospark.checkbox"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",
            checked: false,
            indeterminate: false,
        }),\r
        mounted() {\r
            const native = () => this.el.querySelector(".asc-checkbox-input");\r
            let lastChecked = false;\r
\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                n.value = "true";\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
            const prior = this.el.value;\r
            lastChecked = typeof prior === "string" && prior !== ""\r
                ? prior === "true"\r
                : !!this.data.checked;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const n = native();\r
                    return String(!!(n ? n.checked : lastChecked));\r
                },\r
                set: (v) => {\r
                    lastChecked = v === true || v === "true";\r
                    const n = native();\r
                    if (n) n.checked = lastChecked;\r
                },\r
                configurable: true,\r
            });\r
\r
            this.el.addEventListener("change", (e) => {\r
                if (e.target !== native()) return;\r
                const n = native();\r
                if (n) lastChecked = n.checked;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
            });\r
\r
            setTimeout(() => {\r
                const n = native();\r
                if (n) {\r
                    n.checked = lastChecked;\r
                    n.indeterminate = !!this.data.indeterminate;\r
                }\r
                syncAttrs();\r
            }, 0);\r
\r
            let lastPropsChecked = !!this.data.checked;\r
            this.watch("checked", ({ value }) => {\r
                const v = !!value;\r
                if (v === lastPropsChecked) return;\r
                lastPropsChecked = v;\r
                lastChecked = v;\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
            });\r
            this.watch("indeterminate", ({ value }) => {\r
                const n = native();\r
                if (n) n.indeterminate = !!value;\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-checkbox">\r
    /* ---------- 结构：真实 label 包裹（点击文字/盒子任一处原生切换 + 焦点转发），\r
         内层原生 input 透明铺满盒子（点击命中区 = 盒子，键盘焦点承载者） ---------- */\r
    .asc-checkbox-wrap {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.45em;\r
      cursor: pointer;\r
    }\r
    /* 盒子：裸态控件无 chrome，仅自有细边框（ADR-0020 决策 3）；尺寸 em 基准随主题\r
       data-size 档位字号缩放（不设自有尺寸属性，button 同范式 ADR-0012） */\r
    .asc-checkbox-box {\r
      position: relative;\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      box-sizing: border-box;\r
      width: 1.15em;\r
      height: 1.15em;\r
      border: var(--auto-border-size, var(--asc-checkbox-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-checkbox-border, #d9d9d9));\r
      border-radius: var(--asc-checkbox-radius, 0.25em);\r
      background: var(--auto-bgcolor, var(--asc-checkbox-bg, #ffffff));\r
      transition:\r
        background-color 0.15s ease,\r
        border-color 0.15s ease,\r
        box-shadow 0.15s ease;\r
    }\r
    .asc-checkbox-input {\r
      position: absolute;\r
      inset: 0;\r
      width: 100%;\r
      height: 100%;\r
      margin: 0;\r
      padding: 0;\r
      border: none;\r
      opacity: 0;\r
      cursor: inherit;\r
    }\r
\r
    /* ---------- 状态色（骨架通道）：status 在场边框染 tone（裸态控件只消费 tone 不吃 chrome）；\r
             勾选 / 半选底色恒 tone（缺省主色，error/success/warning 随动——开态语义色联动） ---------- */\r
    .asc-checkbox[data-status] .asc-checkbox-box {\r
      border-color: var(--asc-field-tone);\r
    }\r
    .asc-checkbox-box:has(> .asc-checkbox-input:checked),\r
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate) {\r
      background: var(--asc-field-tone);\r
      border-color: var(--asc-field-tone);\r
    }\r
\r
    .asc-checkbox-box::before {\r
      content: "";\r
      width: 0.28em;\r
      height: 0.58em;\r
      border-right: 0.14em solid\r
        var(--asc-checkbox-check, #ffffff);\r
      border-bottom: 0.14em solid\r
        var(--asc-checkbox-check, #ffffff);\r
      margin-top: -0.12em;\r
      transform: rotate(45deg) scale(0);\r
      transition: transform 0.15s ease;\r
    }\r
    .asc-checkbox-box:has(> .asc-checkbox-input:checked)::before {\r
      transform: rotate(45deg) scale(1);\r
    }\r
    .asc-checkbox-box::after {\r
      content: "";\r
      position: absolute;\r
      width: 0.55em;\r
      height: 0;\r
      border-top: 0.14em solid var(--asc-checkbox-check, #ffffff);\r
      opacity: 0;\r
      transition: opacity 0.15s ease;\r
    }\r
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::after {\r
      opacity: 1;\r
    }\r
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::before {\r
      transform: rotate(45deg) scale(0);\r
    }\r
\r
    .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)) {\r
      border-color: var(--auto-hover-border-color, var(--asc-checkbox-hover-border, #4098fc));\r
    }\r
    /* 键盘焦点环（data-focus 由骨架 focusin/focusout 同步——鼠标点击聚焦亦点亮，\r
         与盒饰类控件的焦点语义一致）；禁用不点环 */\r
    .asc-checkbox[data-focus]:not([data-disabled]) .asc-checkbox-box {\r
      border-color: var(--asc-field-tone);\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    .asc-checkbox[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-checkbox[data-disabled] .asc-checkbox-wrap {\r
      cursor: not-allowed;\r
    }\r
\r
    .asc-checkbox-label:empty {\r
      display: none;\r
    }\r
\r
    [dark] .asc-checkbox-box,\r
    [data-dark] .asc-checkbox-box {\r
      border-color: var(--auto-border-color, var(--asc-checkbox-border, #52525b));\r
      background: var(--auto-bgcolor, var(--asc-checkbox-bg, #3a3a3a));\r
    }\r
    [dark] .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)),\r
    [data-dark] .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)) {\r
      border-color: var(--auto-hover-border-color, var(--asc-checkbox-hover-border, #4098fc));\r
    }\r
  </style>\r
  <label class="asc-checkbox-wrap">\r
    <span class="asc-checkbox-box">\r
      <input type="checkbox" class="asc-checkbox-input" data-autospark-control />\r
    </span>\r
    <span class="asc-checkbox-label">{{ label }}</span>\r
  </label>\r
</span>\r
`,Fa=`autospark.checkbox`;function Ia(e){e.components[Fa]=Pa}La();function La(){y(e=>{m(e),Ia(e)})}var Ra=`<span\r
  class="asc-radio"\r
  x-define="autospark.radio"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",
            value: "",
            checked: false,
        }),\r
        mounted() {\r
            const native = () => this.el.querySelector(".asc-radio-input");\r
            const radioValue = () => String(this.data.value ?? "");\r
            let lastChecked = false;\r
\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                n.value = radioValue();\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
            const prior = this.el.value;\r
            lastChecked = typeof prior === "string" && prior !== ""\r
                ? prior === radioValue()\r
                : !!this.data.checked;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => radioValue(),\r
                set: (v) => {\r
                    const n = native();\r
                    if (n) n.checked = String(v) === radioValue();\r
                },\r
                configurable: true,\r
            });\r
\r
            this.el.addEventListener("change", (e) => {\r
                if (e.target !== native()) return;\r
                const n = native();\r
                if (!n || !n.checked) return;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
            });\r
\r
            setTimeout(() => {\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
                syncAttrs();\r
            }, 0);\r
\r
            let lastPropsChecked = !!this.data.checked;\r
            this.watch("checked", ({ value }) => {\r
                const v = !!value;\r
                if (v === lastPropsChecked) return;\r
                lastPropsChecked = v;\r
                lastChecked = v;\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
            });\r
            this.watch("value", () => {\r
                setTimeout(() => {\r
                    syncAttrs();\r
                    const n = native();\r
                    if (n && n.checked) n.checked = n.value === radioValue();\r
                }, 0);\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-radio">\r
    /* ---------- 结构：真实 label 包裹（点击文字/圆环任一处原生切换 + 焦点转发），\r
         内层原生 input 透明铺满圆环（点击命中区 = 圆环，键盘焦点承载者） ---------- */\r
    .asc-radio-wrap {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.45em;\r
      cursor: pointer;\r
    }\r
    /* 圆环：裸态控件无 chrome，仅自有细边框（ADR-0020 决策 3）；尺寸 em 基准随主题\r
       data-size 档位字号缩放（不设自有尺寸属性，button 同范式 ADR-0012） */\r
    .asc-radio-box {\r
      position: relative;\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      box-sizing: border-box;\r
      width: 1.15em;\r
      height: 1.15em;\r
      border: var(--auto-border-size, var(--asc-radio-border-size, 1px)) solid\r
        var(--auto-input-border-color, var(--asc-radio-border, #d9d9d9));\r
      border-radius: 50%;\r
      background: var(--auto-bgcolor, var(--asc-radio-bg, #ffffff));\r
      transition:\r
        border-color 0.15s ease,\r
        box-shadow 0.15s ease;\r
    }\r
    .asc-radio-input {\r
      position: absolute;\r
      inset: 0;\r
      width: 100%;\r
      height: 100%;\r
      margin: 0;\r
      padding: 0;\r
      border: none;\r
      opacity: 0;\r
      cursor: inherit;\r
    }\r
    .asc-radio[data-status] .asc-radio-box {\r
      border-color: var(--asc-field-tone);\r
    }\r
    .asc-radio-box:has(> .asc-radio-input:checked) {\r
      border-color: var(--asc-field-tone);\r
    }\r
\r
    .asc-radio-box::after {\r
      content: "";\r
      width: 0.55em;\r
      height: 0.55em;\r
      border-radius: 50%;\r
      background: var(--asc-field-tone);\r
      transform: scale(0);\r
      transition: transform 0.15s ease;\r
    }\r
    .asc-radio-box:has(> .asc-radio-input:checked)::after {\r
      transform: scale(1);\r
    }\r
\r
    .asc-radio-wrap:hover\r
      .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(\r
        :has(> .asc-radio-input:disabled)\r
      ) {\r
      border-color: var(\r
        --auto-hover-border-color,\r
        var(--asc-radio-hover-border, #4098fc)\r
      );\r
    }\r
    /* 键盘焦点环（data-focus 由骨架 focusin/focusout 同步——鼠标点击聚焦亦点亮，\r
         与盒饰类控件的焦点语义一致）；禁用不点环 */\r
    .asc-radio[data-focus]:not([data-disabled]) .asc-radio-box {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    .asc-radio[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-radio[data-disabled] .asc-radio-wrap {\r
      cursor: not-allowed;\r
    }\r
\r
    .asc-radio-label:empty {\r
      display: none;\r
    }\r
\r
    [dark] .asc-radio-box,\r
    [data-dark] .asc-radio-box {\r
      border-color: var(--auto-border-color, var(--asc-radio-border, #52525b));\r
      background: var(--auto-bgcolor, var(--asc-radio-bg, #3a3a3a));\r
    }\r
    [dark]\r
      .asc-radio-wrap:hover\r
      .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(\r
        :has(> .asc-radio-input:disabled)\r
      ),\r
    [data-dark]\r
      .asc-radio-wrap:hover\r
      .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(\r
        :has(> .asc-radio-input:disabled)\r
      ) {\r
      border-color: var(\r
        --auto-hover-border-color,\r
        var(--asc-radio-hover-border, #4098fc)\r
      );\r
    }\r
  </style>\r
  <label class="asc-radio-wrap">\r
    <span class="asc-radio-box">\r
      <input type="radio" class="asc-radio-input" data-autospark-control />\r
    </span>\r
    <span class="asc-radio-label">{{ label }}</span>\r
  </label>\r
</span>\r
`,za=`autospark.radio`;function Ba(e){e.components[za]=Ra}Va();function Va(){y(e=>{m(e),Ba(e)})}var Ha=`<span\r
  class="asc-switch"\r
  x-define="autospark.switch"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",
            checked: false,
            loading: false,
        }),\r
        mounted() {\r
            const track = () => this.el.querySelector(".asc-switch-track");\r
            const carrier = () => this.el.querySelector(".asc-switch-carrier");\r
\r
            const syncVisual = () => {\r
                const on = !!this.data.checked;\r
                const t = track();\r
                if (t) {\r
                    t.setAttribute("aria-checked", String(on));\r
                    t.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.loading)));\r
                    if (this.data.status === "error") t.setAttribute("aria-invalid", "true");\r
                    else t.removeAttribute("aria-invalid");\r
                }\r
                const c = carrier();\r
                if (c) {\r
                    c.value = String(on);\r
                    c.disabled = !!this.data.disabled;\r
                }\r
                this.el.toggleAttribute("data-checked", on);\r
                this.el.toggleAttribute("data-loading", !!this.data.loading);\r
            };\r
\r
            const prior = this.el.value;\r
            const initChecked = typeof prior === "string" && prior !== ""\r
                ? prior === "true"\r
                : !!this.data.checked;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(!!this.data.checked),\r
                set: (v) => {\r
                    this.data.checked = v === true || v === "true";\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            const toggle = () => {\r
                if (this.data.disabled || this.data.readonly || this.data.loading) return;\r
                this.data.checked = !this.data.checked;\r
                syncVisual();\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.checked } }),\r
                );\r
            };\r
\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (t && t.closest(".asc-switch-wrap")) toggle();\r
            });\r
            this.el.addEventListener("keydown", (e) => {\r
                if (e.key !== " " && e.key !== "Enter") return;\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t || !t.closest(".asc-switch-track")) return;\r
                e.preventDefault();\r
                toggle();\r
            });\r
\r
            setTimeout(() => {\r
                this.data.checked = initChecked;\r
                const c = carrier();\r
                const nameAttr = this.el.getAttribute("name");\r
                if (c && nameAttr != null) c.name = nameAttr;\r
                syncVisual();\r
            }, 0);\r
\r
            this.watch("checked", () => { syncVisual(); });\r
            this.watch("loading", () => { syncVisual(); });\r
            this.watch("status", () => { setTimeout(syncVisual, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-switch">\r
    /* ---------- 结构：纯 span 包裹（自绘控件无原生语义可包——不用 label 防表单载体\r
         转发点击双触发）；轨道 = 交互件（data-autospark-action，点击不转发焦点） ---------- */\r
    .asc-switch-wrap {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.45em;\r
      cursor: pointer;\r
    }\r
    /* 轨道：尺寸 em 基准随主题 data-size 档位字号缩放（不设自有尺寸属性，button 同范式\r
       ADR-0012）；关态中性色（正文色派生淡灰，主题在场自动换肤） */\r
    .asc-switch-track {\r
      --asc-switch-w: 2.6em;\r
      --asc-switch-h: 1.4em;\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      box-sizing: border-box;\r
      width: var(--asc-switch-w);\r
      height: var(--asc-switch-h);\r
      padding: 0.1875em;\r
      border-radius: 9999px;\r
      background: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-switch-off, #606060)) 28%,\r
        transparent\r
      );\r
      transition: background-color 0.2s ease, box-shadow 0.15s ease;\r
    }\r
    .asc-switch-thumb {\r
      flex: none;\r
      width: calc(var(--asc-switch-h) - 0.375em);\r
      height: calc(var(--asc-switch-h) - 0.375em);\r
      border-radius: 50%;\r
      background: var(--asc-switch-thumb, #ffffff);\r
      box-shadow: var(--asc-switch-thumb-shadow, 0 1px 2px rgba(0, 0, 0, 0.25));\r
      transform: translateX(0);\r
      transition: transform 0.2s ease;\r
      box-sizing: border-box;\r
    }\r
\r
    /* ---------- 开态（data-checked 由 mounted JS 通道同步）：主色实底（status 在场随\r
             --asc-field-tone 联动——开态语义色，骨架通道） ---------- */\r
    .asc-switch[data-checked] .asc-switch-track {\r
      background: var(--asc-field-tone);\r
    }\r
    .asc-switch[data-checked] .asc-switch-thumb {\r
      transform: translateX(calc(var(--asc-switch-w) - var(--asc-switch-h)));\r
    }\r
\r
    /* ---------- loading 态（data-loading 由 mounted 同步）：滑块转 CSS 旋转圈（阻断\r
             切换由 JS 判定；视觉优先于 disabled 不淡化，button loading 同款语义） ---------- */\r
    .asc-switch[data-loading] .asc-switch-thumb {\r
      background: transparent;\r
      box-shadow: none;\r
      border: 0.125em solid var(--asc-field-tone);\r
      border-top-color: transparent;\r
      animation: asc-switch-spin 0.7s linear infinite;\r
    }\r
    @keyframes asc-switch-spin {\r
      to {\r
        transform: rotate(360deg);\r
      }\r
    }\r
    .asc-switch[data-loading][data-checked] .asc-switch-thumb {\r
      transform: none;\r
    }\r
\r
    .asc-switch[data-focus]:not([data-disabled]) .asc-switch-track {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    .asc-switch[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-switch[data-disabled] .asc-switch-wrap {\r
      cursor: not-allowed;\r
    }\r
    .asc-switch[data-loading] .asc-switch-wrap {\r
      cursor: progress;\r
    }\r
\r
    .asc-switch-label:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：关态中性色换暗色校准（正文色反转自动偏白灰，\r
             兜底字面值切换；开态 tone 与滑块白色为恒定设计不变） ---------- */\r
    [dark] .asc-switch-track,\r
    [data-dark] .asc-switch-track {\r
      background: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-switch-off, #fafafa)) 32%,\r
        transparent\r
      );\r
    }\r
    [dark] .asc-switch-thumb,\r
    [data-dark] .asc-switch-thumb {\r
      background: var(--asc-switch-thumb, #ffffff);\r
    }\r
  </style>\r
  <span class="asc-switch-wrap">\r
    <input type="hidden" class="asc-switch-carrier" data-autospark-control />\r
    <span\r
      class="asc-switch-track"\r
      role="switch"\r
      tabindex="0"\r
      aria-checked="false"\r
      data-autospark-action\r
    >\r
      <span class="asc-switch-thumb"></span>\r
    </span>\r
    <span class="asc-switch-label">{{ label }}</span>\r
  </span>\r
</span>\r
`,Ua=`autospark.switch`;function Wa(e){e.components[Ua]=Ha}Ga();function Ga(){y(e=>{m(e),Wa(e)})}var Ka=`<span\r
  class="asc-input-number asc-field-box"\r
  x-define="autospark.input-number"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: null,
            min: null,
            max: null,
            step: 1,
            precision: -1,
            controls: true,
            placeholder: "",
        }),\r
        mounted() {\r
            const native = () => this.el.querySelector(".asc-input-number-native");\r
\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const clamp = (n) => {\r
                if (n == null) return null;\r
                const mn = num(this.data.min), mx = num(this.data.max);\r
                if (mn != null && n < mn) return mn;\r
                if (mx != null && n > mx) return mx;\r
                return n;\r
            };\r
            const prec = () => {\r
                const p = num(this.data.precision);\r
                return p != null && p >= 0 ? Math.floor(Math.min(p, 100)) : null;\r
            };\r
            const fix = (n) => {\r
                const p = prec();\r
                return p != null && n != null ? parseFloat(n.toFixed(p)) : n;\r
            };\r
            const fmt = (n) => {\r
                const p = prec();\r
                return p != null && n != null ? n.toFixed(p) : n == null ? "" : String(n);\r
            };\r
\r
            let lastValue = null;\r
\r
            const show = (n) => {\r
                const el = native();\r
                if (!el) return;\r
                const t = fmt(n);\r
                if (el.value !== t) el.value = t;\r
            };\r
\r
            const syncVisual = () => {\r
                const el = native();\r
                if (el) {\r
                    const mn = num(this.data.min), mx = num(this.data.max);\r
                    if (mn != null) el.setAttribute("aria-valuemin", String(mn));\r
                    else el.removeAttribute("aria-valuemin");\r
                    if (mx != null) el.setAttribute("aria-valuemax", String(mx));\r
                    else el.removeAttribute("aria-valuemax");\r
                    if (lastValue != null) el.setAttribute("aria-valuenow", String(lastValue));\r
                    else el.removeAttribute("aria-valuenow");\r
                }\r
                this.el.toggleAttribute("data-has-value", lastValue != null);\r
            };\r
\r
            const commit = (n) => {\r
                lastValue = n;\r
                show(n);\r
                syncVisual();\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: lastValue } }),\r
                );\r
            };\r
\r
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            lastValue = initV != null ? fix(clamp(initV)) : null;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => (lastValue == null ? "" : String(lastValue)),\r
                set: (v) => {\r
                    const n = fix(clamp(num(v)));\r
                    if (n === lastValue) return;
                    lastValue = n;\r
                    show(n);\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            this.el.addEventListener(\r
                "input",\r
                (e) => {\r
                    if (e.target !== native()) return;\r
                    const el = native();\r
                    const t = el ? String(el.value ?? "") : "";\r
                    const n = num(t);\r
                    if (n != null) lastValue = n;\r
                    else if (t === "") lastValue = null;\r
                    syncVisual();\r
                },\r
                true,\r
            );\r
\r
            this.el.addEventListener(\r
                "change",\r
                (e) => {\r
                    if (e.target !== native()) return;\r
                    e.stopPropagation();\r
                    const el = native();\r
                    lastValue = fix(clamp(num(el ? el.value : "")));\r
                    show(lastValue);\r
                    syncVisual();\r
                    this.el.dispatchEvent(\r
                        new CustomEvent("change", {\r
                            bubbles: true,\r
                            detail: { value: lastValue },\r
                        }),\r
                    );\r
                },\r
                true,\r
            );\r
\r
            const stepBy = (dir) => {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const st = num(this.data.step);\r
                const delta = (st != null && st > 0 ? st : 1) * dir;\r
                const base = lastValue != null ? lastValue : (num(this.data.min) ?? 0);\r
                const n = fix(clamp(base + delta));\r
                if (n === lastValue) return;\r
                commit(n);\r
            };\r
\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t) return;\r
                const up = t.closest(".asc-input-number-up");\r
                if (up) {\r
                    e.stopPropagation();\r
                    stepBy(1);\r
                    return;\r
                }\r
                if (t.closest(".asc-input-number-down")) {\r
                    e.stopPropagation();\r
                    stepBy(-1);\r
                }\r
            });\r
            this.el.addEventListener("keydown", (e) => {\r
                if (e.target !== native()) return;\r
                if (e.key === "ArrowUp") {\r
                    e.preventDefault();
                    stepBy(1);\r
                } else if (e.key === "ArrowDown") {\r
                    e.preventDefault();\r
                    stepBy(-1);\r
                }\r
            });\r
\r
            setTimeout(() => {\r
                const el = native();\r
                if (el) {\r
                    el.placeholder = String(this.data.placeholder ?? "");\r
                    el.setAttribute("role", "spinbutton");\r
                    const nameAttr = this.el.getAttribute("name");\r
                    if (nameAttr != null) el.name = nameAttr;\r
                }\r
                show(lastValue);\r
                syncVisual();\r
            }, 0);\r
\r
            let lastPropsN = fix(clamp(num(this.data.value)));\r
            this.watch("value", ({ value: v }) => {\r
                const n = fix(clamp(num(v)));\r
                if (n === lastPropsN) return;\r
                lastPropsN = n;\r
                if (n === lastValue) return;\r
                lastValue = n;\r
                show(n);\r
                syncVisual();\r
            });\r
            const reBound = () => {\r
                lastValue = fix(clamp(lastValue));\r
                show(lastValue);\r
                syncVisual();\r
            };\r
            this.watch("min", () => { setTimeout(reBound, 0); });\r
            this.watch("max", () => { setTimeout(reBound, 0); });\r
            this.watch("precision", () => { setTimeout(reBound, 0); });\r
            this.watch("placeholder", () => {\r
                const el = native();\r
                if (el) el.placeholder = String(this.data.placeholder ?? "");\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-input-number">\r
    .asc-input-number-native {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      width: 100%;\r
      height: 100%;\r
      border: none;\r
      outline: none;\r
      background: transparent;\r
      padding: 0;\r
      margin: 0;\r
      color: inherit;\r
      font: inherit;\r
      cursor: inherit;\r
    }\r
    .asc-input-number-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-number-placeholder, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-input-number-native:disabled {\r
      cursor: not-allowed;\r
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-input-number-disable-color, inherit));\r
    }\r
\r
    /* ---------- 步进钮组（controls 由 x-if 控显隐）：竖排双钮撑满盒高，左侧细分隔线；\r
             钮为自绘图标钮（内嵌 chevron SVG，非原生 button 不抢焦点——点击焦点留控件） ---------- */\r
    .asc-input-number-step {\r
      flex: none;\r
      display: inline-flex;\r
      flex-direction: column;\r
      align-self: stretch;\r
      margin-left: 0.4em;\r
      border-left: var(--auto-border-size, var(--asc-input-number-border-size, 1px)) solid\r
        var(--asc-field-line, var(--auto-border-color, var(--asc-input-number-border, #d9d9d9)));\r
    }\r
    .asc-input-number-btn {\r
      flex: 1 1 0;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      min-width: 1.7em;\r
      padding: 0 0.3em;\r
      cursor: pointer;\r
      user-select: none;\r
      color: var(--auto-third-color, var(--asc-input-number-step, rgba(0, 0, 0, 0.35)));\r
      transition: color 0.15s ease;\r
    }\r
    .asc-input-number-btn svg {\r
      width: 0.85em;\r
      height: 0.85em;\r
    }\r
    .asc-input-number-btn:hover {\r
      color: var(--auto-color, var(--asc-input-number-step-hover, #606060));\r
    }\r
    .asc-input-number-btn:active {\r
      transform: scale(0.9);\r
    }\r
    .asc-input-number-up {\r
      border-bottom: var(--auto-border-size, var(--asc-input-number-border-size, 1px)) solid\r
        color-mix(in srgb, var(--auto-border-color, var(--asc-input-number-border, #d9d9d9)) 55%, transparent);\r
    }\r
    .asc-input-number[data-disabled] .asc-input-number-btn {\r
      cursor: not-allowed;\r
      color: var(--auto-disable-color, var(--asc-input-number-step-disable, rgba(0, 0, 0, 0.25)));\r
    }\r
\r
    [dark] .asc-input-number-native::placeholder,\r
    [data-dark] .asc-input-number-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-number-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-input-number-step,\r
    [data-dark] .asc-input-number-step {\r
      border-left-color: var(--asc-field-line, var(--auto-border-color, var(--asc-input-number-border, #52525b)));\r
    }\r
    [dark] .asc-input-number-btn,\r
    [data-dark] .asc-input-number-btn {\r
      color: var(--auto-third-color, var(--asc-input-number-step, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-input-number-btn:hover,\r
    [data-dark] .asc-input-number-btn:hover {\r
      color: var(--auto-color, var(--asc-input-number-step-hover, #fafafa));\r
    }\r
    [dark] .asc-input-number[data-disabled] .asc-input-number-btn,\r
    [data-dark] .asc-input-number[data-disabled] .asc-input-number-btn {\r
      color: var(--auto-disable-color, var(--asc-input-number-step-disable, rgba(255, 255, 255, 0.25)));\r
    }\r
  </style>\r
  <input\r
    class="asc-input-number-native"\r
    data-autospark-control\r
    type="text"\r
    inputmode="decimal"\r
    autocomplete="off"\r
  />\r
  <span class="asc-input-number-step" x-if="controls !== false">\r
    <i class="asc-input-number-btn asc-input-number-up" data-autospark-action aria-hidden="true">\r
      <svg\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
        fill="none"\r
        stroke="currentColor"\r
        stroke-width="2"\r
        stroke-linecap="round"\r
        stroke-linejoin="round"\r
      >\r
        <path d="m18 15-6-6-6 6" />\r
      </svg>\r
    </i>\r
    <i class="asc-input-number-btn asc-input-number-down" data-autospark-action aria-hidden="true">\r
      <svg\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
        fill="none"\r
        stroke="currentColor"\r
        stroke-width="2"\r
        stroke-linecap="round"\r
        stroke-linejoin="round"\r
      >\r
        <path d="m6 9 6 6 6-6" />\r
      </svg>\r
    </i>\r
  </span>\r
</span>\r
`,qa=`autospark.input-number`;function Ja(e){e.components[qa]=Ka}Ya();function Ya(){y(e=>{m(e),Ja(e)})}var Xa=`<span class="asc-slider" x-define="autospark.slider" x-define:inherit="autospark.field">\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: 0,
            min: 0,
            max: 100,
            step: 1,
            showInput: false,
        }),\r
        mounted() {\r
            const native = () => this.el.querySelector(".asc-slider-native");\r
            const track = () => this.el.querySelector(".asc-slider-track");\r
            const numHost = () => this.el.querySelector(".asc-input-number");\r
\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const bounds = () => {\r
                let mn = num(this.data.min) ?? 0;\r
                let mx = num(this.data.max) ?? 100;\r
                if (mx <= mn) mx = mn + 1;
                return [mn, mx];\r
            };\r
            const clamp = (n) => {\r
                const [mn, mx] = bounds();\r
                return Math.min(mx, Math.max(mn, n));\r
            };\r
            const stepSize = () => {\r
                const s = num(this.data.step);\r
                return s != null && s > 0 ? s : 1;\r
            };\r
\r
            const syncAttrs = () => {\r
                const r = native();\r
                if (!r) return;\r
                const [mn, mx] = bounds();\r
                r.min = String(mn);\r
                r.max = String(mx);\r
                r.step = String(stepSize());\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) r.name = nameAttr;\r
            };\r
\r
            const syncVisual = () => {\r
                const r = native();\r
                const t = track();\r
                if (!r || !t) return;\r
                const [mn, mx] = bounds();\r
                const v = clamp(num(r.value) ?? mn);\r
                const pct = ((v - mn) / (mx - mn)) * 100;\r
                t.style.setProperty("--asc-slider-pos", \`\${pct}%\`);\r
            };\r
\r
            const setVal = (v, { fromNum = false } = {}) => {\r
                const n = clamp(num(v) ?? bounds()[0]);\r
                const r = native();\r
                if (r) r.value = String(n);\r
                syncVisual();\r
                if (!fromNum) {\r
                    const nh = numHost();\r
                    if (nh) nh.value = String(n);
                }\r
            };\r
\r
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const r = native();\r
                    return r ? r.value : String(bounds()[0]);\r
                },\r
                set: (v) => {\r
                    setVal(v);\r
                },\r
                configurable: true,\r
            });\r
\r
            this.el.addEventListener(\r
                "input",\r
                (e) => {\r
                    if (e.target !== native()) return;\r
                    syncVisual();\r
                    const r = native();\r
                    const nh = numHost();\r
                    if (r && nh) nh.value = r.value;\r
                },\r
                true,\r
            );\r
\r
            this.el.addEventListener(\r
                "change",\r
                (e) => {\r
                    if (e.target !== native()) return;\r
                    e.stopPropagation();\r
                    const r = native();\r
                    if (r) setVal(r.value);\r
                    this.el.dispatchEvent(\r
                        new CustomEvent("change", {\r
                            bubbles: true,\r
                            detail: { value: num(this.el.value) ?? bounds()[0] },\r
                        }),\r
                    );\r
                },\r
                true,\r
            );\r
\r
            setTimeout(() => {\r
                syncAttrs();\r
                setVal(initV != null ? initV : bounds()[0]);\r
                const nh = numHost();\r
                if (nh) {\r
                    const r = native();\r
                    if (r) nh.value = r.value;\r
                    nh.addEventListener("input", () => {\r
                        const v = num(nh.value);\r
                        if (v != null) setVal(v, { fromNum: true });\r
                    });\r
                }\r
            }, 0);\r
\r
            this.watch("value", ({ value: v }) => {\r
                const n = num(v);\r
                if (n == null) return;\r
                const r = native();\r
                if (r && num(r.value) === clamp(n)) return;\r
                setVal(n);\r
            });\r
            const reBound = () => {\r
                syncAttrs();\r
                const r = native();\r
                if (r) setVal(r.value);\r
            };\r
            this.watch("min", () => { setTimeout(reBound, 0); });\r
            this.watch("max", () => { setTimeout(reBound, 0); });\r
            this.watch("step", () => { setTimeout(reBound, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-slider">\r
    /* ---------- 结构：组件根占满父宽（块级滑动形态，antd 同惯例；复合选择器稳赢\r
             .asc-field 的 inline-flex 基座，不依赖样式注入顺序）；包裹层横向排布\r
             （showInput 联动框随行）；轨道 = 自绘视觉容器，原生 range 透明铺满承载\r
             交互（覆盖层模式） ---------- */\r
    .asc-field.asc-slider {\r
      display: flex;\r
      width: 100%;\r
    }\r
    .asc-slider-wrap {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.75em;\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      cursor: pointer;\r
    }\r
    /* 轨道：高度 em 基准随主题 data-size 档位字号缩放（不设自有尺寸属性，button 同范式\r
       ADR-0012）；--asc-slider-pos 由 mounted JS 通道维护（填充/滑块同源） */\r
    .asc-slider-track {\r
      --asc-slider-pos: 0%;\r
      position: relative;\r
      display: inline-block;\r
      box-sizing: border-box;\r
      flex: 1 1 auto;\r
      min-width: 8em;\r
      height: 0.3em;\r
      border-radius: 9999px;\r
      background: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-slider-track, #606060)) 18%,\r
        transparent\r
      );\r
      transition: box-shadow 0.15s ease;\r
    }\r
    .asc-slider-fill {\r
      position: absolute;\r
      inset-block: 0;\r
      inset-inline-start: 0;\r
      width: var(--asc-slider-pos);\r
      border-radius: 9999px;\r
      background: var(--asc-field-tone);\r
    }\r
    .asc-slider-thumb {\r
      position: absolute;\r
      top: 50%;\r
      inset-inline-start: var(--asc-slider-pos);\r
      box-sizing: border-box;\r
      width: 1em;\r
      height: 1em;\r
      border-radius: 50%;\r
      border: 0.125em solid var(--asc-field-tone);\r
      background: var(--asc-slider-thumb, #ffffff);\r
      box-shadow: var(--asc-slider-thumb-shadow, 0 1px 2px rgba(0, 0, 0, 0.25));\r
      transform: translate(-50%, -50%);\r
      transition: box-shadow 0.15s ease;\r
      pointer-events: none;
    }\r
    .asc-slider-native {\r
      position: absolute;\r
      inset: -0.5em 0;
      width: 100%;\r
      margin: 0;\r
      padding: 0;\r
      opacity: 0;\r
      cursor: inherit;\r
    }\r
    .asc-slider[data-focus]:not([data-disabled]) .asc-slider-thumb {\r
      box-shadow: 0 0 0 3px\r
        color-mix(in srgb, var(--asc-field-tone) 25%, transparent);\r
    }\r
    .asc-slider[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-slider[data-disabled] .asc-slider-wrap {\r
      cursor: not-allowed;\r
    }\r
    /* 只读：range 无原生 readOnly 语义（属性被忽略），JS 通道经骨架反射的 data-readonly\r
       阻断指针交互（值不可变语义；无禁用淡化） */\r
    .asc-slider[data-readonly] .asc-slider-native {\r
      pointer-events: none;\r
    }\r
    .asc-slider[data-readonly] .asc-slider-wrap {\r
      cursor: default;\r
    }\r
\r
    .asc-slider-input {\r
      flex: none;\r
      width: 7.5em;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变）；\r
             开态 tone 与滑块白底为恒定设计不变 ---------- */\r
    [dark] .asc-slider-track,\r
    [data-dark] .asc-slider-track {\r
      background: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-slider-track, #fafafa)) 22%,\r
        transparent\r
      );\r
    }\r
  </style>\r
  <span class="asc-slider-wrap">\r
    <span class="asc-slider-track">\r
      <span class="asc-slider-fill"></span>\r
      <span class="asc-slider-thumb"></span>\r
      <input type="range" class="asc-slider-native" data-autospark-control />\r
    </span>\r
  </span>\r
  <span class="asc-slider-input" x-if="showInput">\r
    <span x-component:autospark.input-number></span>\r
  </span>\r
</span>\r
`,Za=`autospark.slider`;function Qa(e){e.components[Za]=Xa}$a();function $a(){y(e=>{m(e),Qa(e)})}var eo=`<span\r
  class="asc-rate"\r
  x-define="autospark.rate"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: 0,
            max: 5,
            allowHalf: false,
            clearable: false,
            stars: [],
        }),\r
        mounted() {\r
            const starsEl = () => this.el.querySelector(".asc-rate-stars");\r
            const carrier = () => this.el.querySelector(".asc-rate-carrier");\r
            const items = () => Array.from(this.el.querySelectorAll(".asc-rate-item"));\r
\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const maxNum = () => Math.max(1, Math.floor(num(this.data.max) ?? 5));\r
            const half = () => !!this.data.allowHalf;\r
            const clamp = (n) => Math.max(0, Math.min(maxNum(), num(n) ?? 0));\r
\r
            const rebuild = () => {\r
                this.data.stars = Array.from({ length: maxNum() }, (_, i) => i + 1);\r
            };\r
\r
            let lastValue = 0;\r
            let hoverValue = null;
\r
            const syncVisual = () => {\r
                const v = hoverValue != null ? hoverValue : lastValue;\r
                const s = starsEl();\r
                if (s) {\r
                    s.setAttribute("aria-valuenow", String(v));\r
                    s.setAttribute("aria-valuemax", String(maxNum()));\r
                    s.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.readonly)));\r
                    if (this.data.status === "error") s.setAttribute("aria-invalid", "true");\r
                    else s.removeAttribute("aria-invalid");\r
                }\r
                const c = carrier();\r
                if (c) {\r
                    c.value = String(lastValue);
                    c.disabled = !!this.data.disabled;\r
                }\r
                this.el.toggleAttribute("data-hover", hoverValue != null);\r
                const its = items();\r
                for (let idx = 0; idx < its.length; idx++) {\r
                    const i = idx + 1;\r
                    let fill = 0;\r
                    if (v >= i) fill = 100;\r
                    else if (half() && v >= i - 0.5) fill = 50;\r
                    its[idx].style.setProperty("--asc-rate-fill", \`\${fill}%\`);\r
                }\r
            };\r
\r
            const commit = (v) => {\r
                lastValue = clamp(v);\r
                hoverValue = null;\r
                syncVisual();\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: lastValue } }),\r
                );\r
            };\r
\r
            const posTo = (e) => {\r
                const t = e.target instanceof Element ? e.target.closest(".asc-rate-item") : null;\r
                if (!t || !this.el.contains(t)) return null;\r
                const idx = items().indexOf(t);\r
                if (idx < 0) return null;\r
                const i = idx + 1;\r
                if (!half()) return i;\r
                const rect = t.getBoundingClientRect();\r
                const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 1;\r
                return ratio < 0.5 ? i - 0.5 : i;\r
            };\r
\r
            this.el.addEventListener("mousemove", (e) => {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const v = posTo(e);\r
                if (v == null) {\r
                    if (hoverValue != null) {\r
                        hoverValue = null;\r
                        syncVisual();\r
                    }\r
                    return;\r
                }\r
                if (v !== hoverValue) {\r
                    hoverValue = v;\r
                    syncVisual();\r
                }\r
            });\r
            this.el.addEventListener("mouseleave", () => {\r
                if (hoverValue != null) {\r
                    hoverValue = null;\r
                    syncVisual();\r
                }\r
            });\r
            this.el.addEventListener("click", (e) => {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const v = posTo(e);\r
                if (v == null) return;\r
                if (this.data.clearable && v === lastValue) {\r
                    commit(0);\r
                    return;\r
                }\r
                commit(v);\r
            });\r
\r
            this.el.addEventListener("keydown", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t || !t.closest(".asc-rate-stars")) return;\r
                if (this.data.disabled || this.data.readonly) return;\r
                const d = half() ? 0.5 : 1;\r
                let v;\r
                switch (e.key) {\r
                    case "ArrowRight":\r
                    case "ArrowUp":\r
                        v = lastValue + d;\r
                        break;\r
                    case "ArrowLeft":\r
                    case "ArrowDown":\r
                        v = lastValue - d;\r
                        break;\r
                    case "Home":\r
                        v = 0;\r
                        break;\r
                    case "End":\r
                        v = maxNum();\r
                        break;\r
                    default:\r
                        return;\r
                }\r
                e.preventDefault();\r
                commit(clamp(v));\r
            });\r
\r
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(lastValue),\r
                set: (v) => {\r
                    const n = clamp(v);\r
                    if (n === lastValue) return;
                    lastValue = n;\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            rebuild();\r
            setTimeout(() => {\r
                lastValue = initV != null ? clamp(initV) : 0;\r
                const c = carrier();\r
                if (c) {\r
                    const nameAttr = this.el.getAttribute("name");\r
                    if (nameAttr != null) c.name = nameAttr;\r
                }\r
                const s = starsEl();\r
                if (s) {\r
                    const al = this.el.getAttribute("aria-label");\r
                    if (al != null) s.setAttribute("aria-label", al);\r
                }\r
                syncVisual();\r
            }, 0);\r
\r
            this.watch("value", ({ value: v }) => {\r
                const n = clamp(v);\r
                if (n === lastValue) return;\r
                lastValue = n;\r
                syncVisual();\r
            });\r
            this.watch("max", () => {\r
                rebuild();\r
                lastValue = clamp(lastValue);\r
                setTimeout(syncVisual, 0);\r
            });\r
            this.watch("status", () => { setTimeout(syncVisual, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-rate">\r
    /* ---------- 结构：星组（role=slider 交互件，data-autospark-action 点击不转发\r
             焦点——骨架空白区点击转发逻辑不干扰）；每星双层（off 灰星底层撑尺寸 +\r
             on 亮星覆盖层 clip-path 裁剪） ---------- */\r
    .asc-rate-stars {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      cursor: pointer;\r
      outline: none;\r
    }\r
    .asc-rate-items {\r
      display: contents;\r
    }\r
    /* 星尺寸 em 基准随主题 data-size 档位字号缩放（不设自有尺寸属性，button 同范式\r
       ADR-0012） */\r
    .asc-rate-item {\r
      position: relative;\r
      display: inline-flex;\r
      font-size: 1.4em;\r
      line-height: 1;\r
      --asc-rate-fill: 0%;\r
    }\r
    .asc-rate-off,\r
    .asc-rate-on {\r
      display: flex;\r
    }\r
    .asc-rate-off svg,\r
    .asc-rate-on svg {\r
      width: 1em;\r
      height: 1em;\r
      display: block;\r
    }\r
    .asc-rate-off {\r
      color: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-rate-off, #606060)) 30%,\r
        transparent\r
      );\r
    }\r
    /* 亮星覆盖层：tone 色（缺省主色，status 在场随 --asc-field-tone 联动——骨架\r
       通道）；clip-path 右侧裁剪承载半星（fill 50% 显左半；不影响布局，svg 恒满宽） */\r
    .asc-rate-on {\r
      position: absolute;\r
      inset: 0;\r
      color: var(--asc-field-tone);\r
      clip-path: inset(0 calc(100% - var(--asc-rate-fill)) 0 0);\r
    }\r
\r
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——星组可聚焦即点亮）；\r
       禁用不点环 */\r
    .asc-rate[data-focus]:not([data-disabled]) .asc-rate-stars {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
      border-radius: var(--auto-border-radius, var(--asc-rate-focus-radius, 0.25em));\r
    }\r
    .asc-rate[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-rate[data-disabled] .asc-rate-stars {\r
      cursor: not-allowed;\r
    }\r
    .asc-rate[data-readonly] .asc-rate-stars {\r
      cursor: default;\r
    }\r
    .asc-rate[data-hover] .asc-rate-stars {\r
      cursor: pointer;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：灰星底层兜底字面值切换为 theme 默认暗色\r
             校准（正文色反转自动偏白灰）；点亮 tone 与亮色为骨架通道恒定设计 ---------- */\r
    [dark] .asc-rate-off,\r
    [data-dark] .asc-rate-off {\r
      color: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-rate-off, #fafafa)) 32%,\r
        transparent\r
      );\r
    }\r
  </style>\r
  <input type="hidden" class="asc-rate-carrier" data-autospark-control />\r
  <span\r
    class="asc-rate-stars"\r
    role="slider"\r
    tabindex="0"\r
    aria-valuemin="0"\r
    aria-valuemax="5"\r
    aria-valuenow="0"\r
    data-autospark-action\r
  >\r
    <span class="asc-rate-items" x-for="s of stars" :key="s">\r
      <span class="asc-rate-item">\r
        <i class="asc-rate-off" x-icon="'star'"></i>\r
        <i class="asc-rate-on" x-icon="'star'"></i>\r
      </span>\r
    </span>\r
  </span>\r
</span>\r
`,to=`autospark.rate`;function no(e){e.components[to]=eo}ro();function ro(){y(e=>{m(e),no(e)})}var io=`<span\r
  class="asc-select asc-field-box"\r
  x-define="autospark.select"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: null,
            options: [],
            placeholder: "",
            clearable: false,
            filterable: false,
            loading: false,
            virtual: false,
            uid: "",
            hasValue: false,
            labelText: "",
            filteredOptions: [],
            filterText: "",
            activeIndex: -1,
            activeValue: null,
            open: false,
            pickTick: 0,
            pickValue: null,
            keyTick: 0,
            keyDir: 0,
        }),\r
        methods: {\r
            triggerEl() {\r
                return this.el.querySelector(".asc-select-trigger");\r
            },\r
            carrierEl() {\r
                return this.el.querySelector(".asc-select-carrier");\r
            },\r
            syncValue() {\r
                const v = this.data.value;\r
                const has = v != null && v !== "";\r
                this.data.hasValue = has;\r
                const list = this.data.options ?? [];\r
                const opt = has ? list.find((o) => o && String(o.value) === String(v)) : null;\r
                this.data.labelText = opt ? String(opt.label ?? opt.value) : "";\r
                const c = this.carrierEl();\r
                if (c) {\r
                    c.value = has ? String(v) : "";\r
                    c.disabled = !!this.data.disabled;\r
                }\r
            },\r
            syncActive() {\r
                const list = this.data.filteredOptions ?? [];\r
                const i = this.data.activeIndex;\r
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;\r
                else this.data.activeValue = null;\r
            },\r
            rebuildFiltered() {\r
                const list = this.data.options ?? [];\r
                const kw = String(this.data.filterText ?? "").trim().toLowerCase();\r
                this.data.filteredOptions = kw === ""\r
                    ? [...list]\r
                    : list.filter((o) => String(o?.label ?? "").toLowerCase().includes(kw));\r
                const i = this.data.activeIndex;\r
                if (i < 0 || i >= this.data.filteredOptions.length) this.setActiveToValue();\r
                else this.syncActive();\r
            },\r
            setActiveToValue() {\r
                const list = this.data.filteredOptions ?? [];\r
                this.data.activeIndex = list.findIndex(\r
                    (o) => o && String(o.value) === String(this.data.value),\r
                );\r
                this.syncActive();\r
            },\r
            syncOpen() {\r
                const on = !!this.data.open;\r
                this.el.toggleAttribute("data-open", on);\r
                const t = this.triggerEl();\r
                if (t) t.setAttribute("aria-expanded", String(on));\r
                if (on) {\r
                    this.data.filterText = "";\r
                    this.rebuildFiltered();\r
                    this.setActiveToValue();\r
                }\r
            },\r
            syncInteractive() {\r
                const t = this.triggerEl();\r
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;\r
                const c = this.carrierEl();\r
                if (c) c.disabled = !!this.data.disabled;\r
                this.el.toggleAttribute("data-loading", !!this.data.loading);\r
                if (this.data.disabled && this.data.open) this.closePanel();\r
            },\r
            emitChange() {\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),\r
                );\r
            },\r
            openPanel() {\r
                if (this.data.disabled) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            closePanel() {\r
                if (!this.data.open) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            moveActive(dir) {\r
                const list = this.data.filteredOptions ?? [];\r
                if (list.length === 0) return;\r
                let i = this.data.activeIndex;\r
                for (let step = 0; step < list.length; step++) {\r
                    i = (i + dir + list.length) % list.length;\r
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }\r
                }\r
            },\r
            confirmActive() {\r
                if (this.data.activeValue != null) this.pick(this.data.activeValue);\r
            },\r
            pick(v) {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const list = this.data.options ?? [];\r
                const opt = list.find((o) => o && String(o.value) === String(v));\r
                if (!opt || opt.disabled) return;\r
                if (String(opt.value) === String(this.data.value)) { this.closePanel(); return; }\r
                this.data.value = opt.value;\r
                this.syncValue();\r
                this.emitChange();\r
                this.closePanel();\r
                this.triggerEl()?.focus();\r
            },\r
            onClear(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled || this.data.readonly) return;\r
                if (!this.data.hasValue) return;\r
                this.data.value = null;\r
                this.syncValue();\r
                this.emitChange();\r
                this.triggerEl()?.focus();\r
            },\r
            onTriggerKeydown(event) {\r
                if (this.data.disabled) return;\r
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {\r
                    event.preventDefault();\r
                    if (!this.data.open) { this.openPanel(); return; }\r
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);\r
                } else if (event.key === "Enter") {\r
                    event.preventDefault();\r
                    if (this.data.open) this.confirmActive();\r
                    else this.openPanel();\r
                }\r
            },\r
        },\r
        mounted() {\r
            const prior = this.el.value;\r
            let lastValue = undefined;\r
            if (prior !== undefined && prior !== null && prior !== "") lastValue = prior;\r
            else if (this.data.value != null) lastValue = this.data.value;\r
            const self = this;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const v = self.data.value;\r
                    return v == null ? "" : v;\r
                },\r
                set: (v) => {\r
                    const norm = v == null ? null : v;\r
                    if (norm === lastValue) return;\r
                    lastValue = norm;\r
                    self.data.value = norm;\r
                    self.syncValue();\r
                },\r
                configurable: true,\r
            });\r
            if (lastValue !== undefined) this.data.value = lastValue;\r
\r
            setTimeout(() => {\r
                const nameAttr = this.el.getAttribute("name");\r
                const c = this.carrierEl();\r
                if (c && nameAttr != null) c.name = nameAttr;\r
                this.data.uid = "asc-select-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);\r
                this.el.setAttribute("data-asc-select-uid", this.data.uid);\r
                this.rebuildFiltered();\r
                this.syncValue();\r
                this.syncOpen();\r
                this.syncInteractive();\r
            }, 0);\r
\r
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });\r
            this.watch("options", () => { setTimeout(() => { this.rebuildFiltered(); this.syncValue(); }, 0); });\r
            this.watch("filterText", () => { this.rebuildFiltered(); });\r
            this.watch("activeIndex", () => { this.syncActive(); });\r
            this.watch("open", () => { this.syncOpen(); });\r
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });\r
            this.watch("loading", () => { this.el.toggleAttribute("data-loading", !!this.data.loading); });\r
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });\r
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-select">\r
    .asc-select {\r
      cursor: pointer;\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断\r
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */\r
    .asc-select[data-disabled] {\r
      cursor: not-allowed;\r
      opacity: 0.55;\r
    }\r
    .asc-select[data-disabled] .asc-select-trigger {\r
      pointer-events: none;\r
    }\r
    .asc-select[data-readonly] {\r
      cursor: default;\r
    }\r
\r
    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面，\r
             含盒饰 padding 区域）；可聚焦（tabindex 由 JS 通道维护禁用态） ---------- */\r
    .asc-select-trigger {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      margin-inline: calc(\r
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem))\r
      );\r
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));\r
      align-self: stretch;\r
      outline: none;\r
    }\r
    .asc-select-value {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-color, var(--asc-select-color, #333333));\r
    }\r
    .asc-select-placeholder {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-input-placeholder, var(--asc-select-placeholder, rgba(0, 0, 0, 0.35)));\r
    }\r
\r
    .asc-select-clear {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      cursor: pointer;\r
      border-radius: var(--auto-border-radius, var(--asc-select-action-radius, 0.25rem));\r
      color: var(--auto-third-color, var(--asc-select-action, rgba(0, 0, 0, 0.35)));\r
      transition: color 0.15s ease;\r
    }\r
    .asc-select-clear:hover {\r
      color: var(--auto-color, var(--asc-select-action-hover, #606060));\r
    }\r
    .asc-select-clear:active {\r
      transform: scale(0.92);\r
    }\r
    /* 下拉箭头：开合旋转 180°（data-open 由 JS 通道同步）；loading 态换旋转图标\r
       （图标自带旋转动画，方向旋转停用） */\r
    .asc-select-arrow {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      color: var(--auto-third-color, var(--asc-select-arrow, rgba(0, 0, 0, 0.35)));\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-select[data-open] .asc-select-arrow {\r
      transform: rotate(180deg);\r
    }\r
    .asc-select[data-loading] .asc-select-arrow {\r
      transform: none;\r
      color: var(--asc-field-tone);\r
    }\r
\r
    [dark] .asc-select-value,\r
    [data-dark] .asc-select-value {\r
      color: var(--auto-color, var(--asc-select-color, #fafafa));\r
    }\r
    [dark] .asc-select-placeholder,\r
    [data-dark] .asc-select-placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-select-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-select-clear,\r
    [dark] .asc-select-arrow,\r
    [data-dark] .asc-select-clear,\r
    [data-dark] .asc-select-arrow {\r
      color: var(--auto-third-color, var(--asc-select-action, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-select-clear:hover,\r
    [data-dark] .asc-select-clear:hover {\r
      color: var(--auto-color, var(--asc-select-action-hover, #fafafa));\r
    }\r
\r
    /* ══════════ 下拉面板（autospark-select-panel，渲染进 body 覆盖物容器；样式经\r
       本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════ */\r
    .asc-select-panel {\r
      display: block;\r
      min-width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-select-panel-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, var(--asc-select-panel-line-height, 1.4));\r
      color: var(--auto-color, var(--asc-select-panel-color, #333333));\r
    }\r
    .asc-select-filter {\r
      padding: 0.4em 0.6em;\r
      border-bottom: var(--auto-border-size, var(--asc-select-filter-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-select-filter-border, #f0f0f0));\r
    }\r
    .asc-select-filter-input {\r
      box-sizing: border-box;\r
      width: 100%;\r
      border: none;\r
      outline: none;\r
      background: transparent;\r
      padding: 0.25em 0.1em;\r
      border-bottom: 1px solid transparent;\r
      color: inherit;\r
      font: inherit;\r
    }\r
    .asc-select-filter-input:focus {\r
      border-bottom-color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-select-primary, #009aff)));\r
    }\r
    .asc-select-list {\r
      max-height: var(--asc-select-max-height, 15em);\r
      overflow-y: auto;\r
      padding: 0.25em 0;\r
      box-sizing: border-box;\r
    }\r
    /* 虚拟分支行高固定 32px（虚拟化需确定项高——规范用法显式声明，与字号档位解耦，\r
       ADR-0022 决策 4；与 x-for-options 的 itemHeight: 32 配套） */\r
    .asc-select-virtual .asc-select-option {\r
      height: 32px;\r
      min-height: 0;\r
      box-sizing: border-box;\r
    }\r
    /* 选项：行式热区；悬停/高亮/选中/禁用态经 data-* 属性选择器驱动（绑定通道写\r
       属性——假值整个移除即无态，绑定语义天然契合） */\r
    .asc-select-option {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.4em;\r
      min-height: 2.2em;\r
      padding: 0.3em 0.75em;\r
      cursor: pointer;\r
      transition: background-color 0.12s ease;\r
    }\r
    .asc-select-option-label {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
    }\r
    .asc-select-option-check {\r
      flex: none;\r
      display: none;\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #009aff));\r
    }\r
    .asc-select-option[data-selected] {\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #009aff));\r
    }\r
    .asc-select-option[data-selected] .asc-select-option-check {\r
      display: inline-flex;\r
    }\r
    .asc-select-option[data-active]:not([data-selected]) {\r
      background: var(--auto-hover-bgcolor, var(--asc-select-option-hover-bg, rgba(0, 0, 0, 0.045)));\r
    }\r
    .asc-select-option[data-disabled] {\r
      color: var(--auto-disable-color, var(--asc-select-option-disabled, rgba(0, 0, 0, 0.28)));\r
      cursor: not-allowed;\r
      background: transparent;\r
    }\r
    .asc-select-option[data-disabled]:hover {\r
      background: transparent;\r
    }\r
    .asc-select-empty {\r
      padding: 0.9em 0.75em;\r
      text-align: center;\r
      color: var(--auto-third-color, var(--asc-select-empty, rgba(0, 0, 0, 0.35)));\r
    }\r
    [dark] .asc-select-panel,\r
    [data-dark] .asc-select-panel {\r
      color: var(--auto-color, var(--asc-select-panel-color, #fafafa));\r
    }\r
    [dark] .asc-select-filter,\r
    [data-dark] .asc-select-filter {\r
      border-bottom-color: var(--auto-border-color, var(--asc-select-filter-border, #52525b));\r
    }\r
    [dark] .asc-select-option[data-active]:not([data-selected]),\r
    [data-dark] .asc-select-option[data-active]:not([data-selected]) {\r
      background: var(--auto-hover-bgcolor, var(--asc-select-option-hover-bg, rgba(255, 255, 255, 0.08)));\r
    }\r
    [dark] .asc-select-option[data-selected],\r
    [data-dark] .asc-select-option[data-selected] {\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #56baff));\r
    }\r
    [dark] .asc-select-option[data-disabled],\r
    [data-dark] .asc-select-option[data-disabled] {\r
      color: var(--auto-disable-color, var(--asc-select-option-disabled, rgba(255, 255, 255, 0.25)));\r
    }\r
    [dark] .asc-select-empty,\r
    [data-dark] .asc-select-empty {\r
      color: var(--auto-third-color, var(--asc-select-empty, rgba(255, 255, 255, 0.45)));\r
    }\r
  </style>\r
  <input type="hidden" class="asc-select-carrier" />\r
  <span\r
    class="asc-select-trigger"\r
    x-popover:autospark-select-panel\r
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"\r
    tabindex="0"\r
    role="combobox"\r
    aria-haspopup="listbox"\r
    aria-expanded="false"\r
    data-autospark-control\r
    @keydown="onTriggerKeydown($event)"\r
  >\r
    <span class="asc-select-value" x-if="hasValue" x-text="labelText"></span>\r
    <span\r
      class="asc-select-placeholder"\r
      x-if="!hasValue"\r
      x-text="placeholder || (t('select.placeholder') === 'select.placeholder' ? '请选择' : t('select.placeholder'))"\r
    ></span>\r
  </span>\r
  <i\r
    class="asc-select-clear"\r
    data-autospark-action\r
    x-if="clearable && hasValue"\r
    x-icon="'no'"\r
    @click="onClear($event)"\r
  ></i>\r
  <i\r
    class="asc-select-arrow"\r
    data-autospark-action\r
    x-icon="loading ? 'loading' : 'select-down'"\r
  ></i>\r
</span>\r
`,ao=`<div class="asc-select-panel" x-define="autospark-select-panel">\r
  <script setup>\r
    {\r
        data: () => ({}),\r
        methods: {\r
            onFilterKeydown(event) {\r
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {\r
                    event.preventDefault();\r
                    this.data.keyTick = Number(this.data.keyTick || 0) + 1;\r
                    this.data.keyDir = event.key === "ArrowDown" ? 1 : -1;\r
                } else if (event.key === "Enter") {\r
                    event.preventDefault();\r
                    if (this.data.activeValue != null) {\r
                        this.data.pickTick = Number(this.data.pickTick || 0) + 1;\r
                        this.data.pickValue = this.data.activeValue;\r
                    }\r
                }\r
            },\r
        },\r
        mounted() {\r
            this.data.open = true;\r
            const uid = this.data.uid;\r
            if (uid) {\r
                const box = document.querySelector('[data-asc-select-uid="' + uid + '"]');\r
                const shellPanel = this.el.closest("[data-overlay]");\r
                if (box && shellPanel) {\r
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";\r
                }\r
            }\r
            const scrollActive = () => {\r
                const el = this.el.querySelector(\r
                    ".asc-select-option[data-active], .asc-select-option[data-selected]",\r
                );\r
                el?.scrollIntoView?.({ block: "nearest" });\r
            };\r
            setTimeout(scrollActive, 0);\r
            this.watch("activeValue", () => { setTimeout(scrollActive, 0); });\r
        },\r
        unmounted() {\r
            this.data.open = false;\r
        },\r
    }\r
  <\/script>\r
  <div class="asc-select-filter" x-if="filterable">\r
    <input\r
      class="asc-select-filter-input"\r
      type="text"\r
      x-on:input="filterText = $event.target.value"\r
      x-on:keydown="onFilterKeydown($event)"\r
    />\r
  </div>\r
  <div class="asc-select-list" x-if="!virtual" x-loading="loading">\r
    <template x-for="option of filteredOptions" :key="option.value">\r
      <div\r
        class="asc-select-option"\r
        x-bind:data-selected="String(option.value) === String(value)"\r
        x-bind:data-active="option.value === activeValue"\r
        x-bind:data-disabled="!!option.disabled"\r
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"\r
      >\r
        <span class="asc-select-option-label" x-text="option.label"></span>\r
        <i class="asc-select-option-check" x-icon="'yes'" x-if="String(option.value) === String(value)"></i>\r
      </div>\r
    </template>\r
    <div\r
      class="asc-select-empty"\r
      x-if="!loading && !(filteredOptions && filteredOptions.length > 0)"\r
      x-text="t('select.empty') === 'select.empty' ? '暂无数据' : t('select.empty')"\r
    ></div>\r
  </div>\r
  <div class="asc-select-virtual" x-if="virtual">\r
    <div\r
      class="asc-select-list"\r
      x-for.virtual="option of filteredOptions"\r
      :key="option.value"\r
      x-for-options="{ itemHeight: 32 }"\r
      x-loading="loading"\r
    >\r
      <div\r
        class="asc-select-option"\r
        x-bind:data-selected="String(option.value) === String(value)"\r
        x-bind:data-active="option.value === activeValue"\r
        x-bind:data-disabled="!!option.disabled"\r
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"\r
      >\r
        <span class="asc-select-option-label" x-text="option.label"></span>\r
        <i class="asc-select-option-check" x-icon="'yes'" x-if="String(option.value) === String(value)"></i>\r
      </div>\r
    </div>\r
    <div\r
      class="asc-select-empty"\r
      x-if="!loading && !(filteredOptions && filteredOptions.length > 0)"\r
      x-text="t('select.empty') === 'select.empty' ? '暂无数据' : t('select.empty')"\r
    ></div>\r
  </div>\r
</div>\r
`,oo=`autospark.select`,so=`autospark-select-panel`,co=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;function lo(e){e.icons?.add?.(`select-down`,co),e.components[oo]=io,e.components[so]=ao}uo();function uo(){y(e=>{m(e),lo(e)})}var fo=`<div class="asc-transfer" x-define="autospark.transfer" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            data: [],
            value: [],
            titles: [],
            filterable: false,
            disabled: false,
            name: "",
            sourceItems: [],
            targetItems: [],
            sourceView: [],
            targetView: [],
            sourceFilter: "",
            targetFilter: "",
            pickedKeys: [],
            sourceAll: false,
            sourceHalf: false,
            targetAll: false,
            targetHalf: false,
            canRight: false,
            canLeft: false,
        }),
        methods: {
            items() {
                return Array.isArray(this.data.data) ? this.data.data : [];
            },
            valueKeys() {
                return Array.isArray(this.data.value) ? this.data.value : [];
            },
            rebuild() {
                const valSet = new Set(this.valueKeys().map((k) => String(k)));
                const src = [];
                const tgt = [];
                for (const it of this.items()) {
                    if (it == null) continue;
                    (valSet.has(String(it.key)) ? tgt : src).push(it);
                }
                this.data.sourceItems = src;
                this.data.targetItems = tgt;
                const kwS = String(this.data.sourceFilter ?? "").trim().toLowerCase();
                const kwT = String(this.data.targetFilter ?? "").trim().toLowerCase();
                this.data.sourceView = kwS === ""
                    ? src
                    : src.filter((i) => String(i.label ?? "").toLowerCase().includes(kwS));
                this.data.targetView = kwT === ""
                    ? tgt
                    : tgt.filter((i) => String(i.label ?? "").toLowerCase().includes(kwT));
                this.syncSelection();
            },
            syncSelection() {
                const valid = new Set(this.items().map((i) => String(i?.key)));
                const pickedArr = [...new Set((this.data.pickedKeys ?? []).map(String))]
                    .filter((k) => valid.has(k));
                if (pickedArr.length !== (this.data.pickedKeys ?? []).length) {
                    this.data.pickedKeys = pickedArr;
                }
                const pickSet = new Set(pickedArr);
                const calc = (view) => {
                    const enabled = (view ?? []).filter((i) => i && !i.disabled);
                    const n = enabled.filter((i) => pickSet.has(String(i.key))).length;
                    return [enabled.length > 0 && n === enabled.length, n > 0 && n < enabled.length];
                };
                const [sa, sh] = calc(this.data.sourceView);
                this.data.sourceAll = sa;
                this.data.sourceHalf = sh;
                const [ta, th] = calc(this.data.targetView);
                this.data.targetAll = ta;
                this.data.targetHalf = th;
                const srcKeys = new Set((this.data.sourceItems ?? []).map((i) => String(i.key)));
                const tgtKeys = new Set((this.data.targetItems ?? []).map((i) => String(i.key)));
                const dis = !!this.data.disabled;
                this.data.canRight = !dis && pickedArr.some((k) => srcKeys.has(k));
                this.data.canLeft = !dis && pickedArr.some((k) => tgtKeys.has(k));
            },
            togglePick(key, event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                if (this.data.disabled) return;
                const k = String(key);
                const it = this.items().find((i) => i && String(i.key) === k);
                if (!it || it.disabled) return;
                const picked = this.data.pickedKeys ?? [];
                this.data.pickedKeys = picked.includes(k)
                    ? picked.filter((x) => x !== k)
                    : [...picked, k];
                this.syncSelection();
            },
            onRowClick(item, event) {
                if (event && event.target instanceof Element && event.target.closest(".asc-checkbox")) return;
                if (!item || item.disabled) return;
                this.togglePick(item.key);
            },
            onToggleSourceAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.sourceView);
            },
            onToggleTargetAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.targetView);
            },
            onSourceFilterInput(event) {
                this.data.sourceFilter = event?.target?.value ?? "";
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
            },
            onTargetFilterInput(event) {
                this.data.targetFilter = event?.target?.value ?? "";
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
            },
            toggleAll(view) {
                if (this.data.disabled) return;
                const keys = (view ?? [])
                    .filter((i) => i && !i.disabled)
                    .map((i) => String(i.key));
                if (keys.length === 0) return;
                const picked = new Set(this.data.pickedKeys ?? []);
                const all = keys.every((k) => picked.has(k));
                for (const k of keys) {
                    if (all) picked.delete(k);
                    else picked.add(k);
                }
                this.data.pickedKeys = [...picked];
                this.syncSelection();
            },
            moveRight() { this.moveTo("right"); },
            moveLeft() { this.moveTo("left"); },
            moveTo(dir) {
                if (this.data.disabled) return;
                const picked = new Set((this.data.pickedKeys ?? []).map(String));
                if (picked.size === 0) return;
                const sideKeys = new Set(
                    (dir === "right" ? this.data.sourceItems : this.data.targetItems)
                        .map((i) => String(i.key)),
                );
                const valSet = new Set(this.valueKeys().map((k) => String(k)));
                let moved = false;
                for (const k of picked) {
                    if (!sideKeys.has(k)) continue;
                    if (dir === "right") valSet.add(k);
                    else valSet.delete(k);
                    moved = true;
                }
                if (!moved) return;
                this.data.value = this.items()
                    .filter((i) => i != null && valSet.has(String(i.key)))
                    .map((i) => i.key);
                this.data.pickedKeys = [...picked].filter((k) => !sideKeys.has(k));
                this.rebuild();
                this.syncCarrier();
                this.emitChange();
            },
            syncCarrier() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                c.value = this.valueKeys().map((k) => String(k)).join(",");
                c.disabled = !!this.data.disabled;
            },
            syncName() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            syncInteractive() {
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                this.syncCarrier();
                this.syncSelection();
            },
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
        },
        mounted() {
            const toArr = (v) => {
                if (Array.isArray(v)) return v;
                if (v == null || v === "") return [];
                if (typeof v === "string") return v.split(",").filter((k) => k !== "");
                return [v];
            };
            const prior = this.el.value;
            const initV = prior !== undefined && prior !== null ? toArr(prior) : this.valueKeys();
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => (Array.isArray(self.data.value) ? self.data.value : []),
                set: (v) => {
                    const arr = toArr(v);
                    if (arr === self.data.value) return;
                    self.data.value = arr;
                    self.rebuild();
                },
                configurable: true,
            });
            this.data.value = initV;

            setTimeout(() => {
                this.syncName();
                this.rebuild();
                this.syncInteractive();
            }, 0);

            this.watch("data", () => { setTimeout(() => this.rebuild(), 0); });
            this.watch("value", () => { this.rebuild(); this.syncCarrier(); });
            this.watch("sourceFilter", () => { this.rebuild(); });
            this.watch("targetFilter", () => { this.rebuild(); });
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });
            this.watch("name", () => { this.syncName(); });
        },
    }
  <\/script>
  <style global id="autospark-components-transfer">
    /* ---------- 宿主：块级满宽复合控件（非盒饰单控件，继承 autospark.base 取主题档位）；
             字号 em 基准随 data-size 档位缩放 ---------- */
    .asc-transfer {
      display: flex;
      align-items: center;
      gap: 0.75em;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-transfer-font-size, 0.875rem));
    }
    .asc-transfer[data-disabled] {
      opacity: 0.55;
    }

    /* ---------- 列表盒：与 list 同源（边框/圆角/底色/行距，视觉对齐用户硬性要求）；
             定高 + 滚动体 ---------- */
    .asc-transfer-list {
      --asc-line: var(--auto-border-color, var(--asc-transfer-border-color, #d9d9d9));
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      flex: 1 1 0;
      min-width: 10em;
      height: var(--asc-transfer-height, 17em);
      background: var(--auto-bgcolor, var(--asc-transfer-bg, #ffffff));
      border: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-transfer-radius, 0.5rem));
      overflow: hidden;
    }

    .asc-transfer-header {
      flex: none;
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.55em 0.85em;
      border-bottom: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-transfer-title {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
      color: var(--auto-color, var(--asc-transfer-color, #333333));
    }
    .asc-transfer-title:empty {
      display: none;
    }

    .asc-transfer-search {
      flex: none;
      padding: 0.4em 0.6em;
      border-bottom: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-transfer-search-input {
      box-sizing: border-box;
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0.25em 0.1em;
      color: inherit;
      font: inherit;
      border-bottom: 1px solid transparent;
    }
    .asc-transfer-search-input:focus {
      border-bottom-color: var(--auto-primary-color, var(--asc-transfer-primary, #009aff));
    }
    .asc-transfer-search-input::placeholder {
      color: var(--auto-input-placeholder, var(--asc-transfer-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-transfer[data-disabled] .asc-transfer-search-input {
      cursor: not-allowed;
    }

    .asc-transfer-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .asc-transfer-item {
      display: flex;
      align-items: center;
      gap: 0.5em;
      min-height: 2.2em;
      padding: 0.35em 0.85em;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .asc-transfer-item:hover {
      background: var(
        --auto-hover-bgcolor,
        var(--asc-transfer-item-hover-bg, rgba(0, 0, 0, 0.045))
      );
    }
    .asc-transfer-item[data-disabled] {
      cursor: not-allowed;
    }
    .asc-transfer-item[data-disabled]:hover {
      background: transparent;
    }
    .asc-transfer-item-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-transfer-color, #606060));
    }
    .asc-transfer-item[data-disabled] .asc-transfer-item-label {
      color: var(--auto-disable-color, var(--asc-transfer-item-disable, rgba(0, 0, 0, 0.28)));
    }

    .asc-transfer-empty {
      padding: 1.2em 0.85em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-transfer-empty, rgba(0, 0, 0, 0.35)));
    }

    .asc-transfer-footer {
      flex: none;
      padding: 0.45em 0.85em;
      border-top: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid
        var(--asc-line);
      color: var(--auto-third-color, var(--asc-transfer-footer, rgba(0, 0, 0, 0.45)));
      font-size: 0.9em;
    }

    /* ---------- 穿梭钮：与 button 同档（default 形态 chrome + 亮度反馈 + 禁用淡化）；
             :disabled 由 canRight/canLeft 绑定驱动（选中集联动，用户硬性要求） ---------- */
    .asc-transfer-actions {
      flex: none;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
    }
    .asc-transfer-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 2.2em;
      height: 2.2em;
      padding: 0;
      border: var(--auto-border-size, var(--asc-transfer-btn-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-transfer-btn-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-transfer-btn-radius, 0.5rem));
      background: var(--auto-bgcolor, var(--asc-transfer-btn-bg, #ffffff));
      color: var(--auto-color, var(--asc-transfer-btn-color, #606060));
      font: inherit;
      cursor: pointer;
      user-select: none;
      transition: filter 0.15s ease;
    }
    .asc-transfer-btn svg {
      width: 1em;
      height: 1em;
    }
    .asc-transfer-btn:hover:not([disabled]) {
      filter: brightness(0.96);
    }
    .asc-transfer-btn:active:not([disabled]) {
      filter: brightness(0.9);
    }
    .asc-transfer-btn[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }

    [dark] .asc-transfer-list,
    [data-dark] .asc-transfer-list {
      --asc-line: var(--auto-border-color, var(--asc-transfer-border-color, #52525b));
      background: var(--auto-bgcolor, var(--asc-transfer-bg, #3a3a3a));
    }
    [dark] .asc-transfer-title,
    [data-dark] .asc-transfer-title {
      color: var(--auto-color, var(--asc-transfer-color, #fafafa));
    }
    [dark] .asc-transfer-search-input::placeholder,
    [data-dark] .asc-transfer-search-input::placeholder {
      color: var(
        --auto-input-placeholder,
        var(--asc-transfer-placeholder, rgba(255, 255, 255, 0.4))
      );
    }
    [dark] .asc-transfer-item:hover,
    [data-dark] .asc-transfer-item:hover {
      background: var(
        --auto-hover-bgcolor,
        var(--asc-transfer-item-hover-bg, rgba(255, 255, 255, 0.08))
      );
    }
    [dark] .asc-transfer-item-label,
    [data-dark] .asc-transfer-item-label {
      color: var(--auto-color, var(--asc-transfer-color, #fafafa));
    }
    [dark] .asc-transfer-item[data-disabled] .asc-transfer-item-label,
    [data-dark] .asc-transfer-item[data-disabled] .asc-transfer-item-label {
      color: var(--auto-disable-color, var(--asc-transfer-item-disable, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-transfer-empty,
    [data-dark] .asc-transfer-empty {
      color: var(--auto-third-color, var(--asc-transfer-empty, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-transfer-footer,
    [data-dark] .asc-transfer-footer {
      color: var(--auto-third-color, var(--asc-transfer-footer, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-transfer-btn,
    [data-dark] .asc-transfer-btn {
      border-color: var(--auto-border-color, var(--asc-transfer-btn-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-transfer-btn-bg, #3a3a3a));
      color: var(--auto-color, var(--asc-transfer-btn-color, #fafafa));
    }
  </style>
  <input type="hidden" class="asc-transfer-carrier" />
  <div class="asc-transfer-list">
    <div class="asc-transfer-header">
      <span
        class="asc-transfer-check"
        x-component:autospark.checkbox="{ checked: sourceAll, indeterminate: sourceHalf, disabled: disabled }"
        @change="onToggleSourceAll($event)"
      ></span>
      <span class="asc-transfer-title" x-text="(titles && titles[0]) || ''"></span>
    </div>
    <div class="asc-transfer-search" x-if="filterable">
      <input
        class="asc-transfer-search-input"
        type="text"
        :placeholder="t('transfer.search') === 'transfer.search' ? '请输入搜索内容' : t('transfer.search')"
        x-on:input="onSourceFilterInput($event)"
      />
    </div>
    <div class="asc-transfer-body">
      <template x-for="item of sourceView" :key="item.key">
        <div
          class="asc-transfer-item"
          :data-disabled="!!item.disabled"
          @click="onRowClick(item, $event)"
        >
          <span
            class="asc-transfer-item-check"
            x-component:autospark.checkbox="{ checked: pickedKeys.includes(String(item.key)), disabled: disabled || !!item.disabled }"
            @change="togglePick(item.key, $event)"
          ></span>
          <span class="asc-transfer-item-label" x-text="item.label"></span>
        </div>
      </template>
      <div
        class="asc-transfer-empty"
        x-if="!(sourceView && sourceView.length > 0)"
        x-text="t('transfer.empty') === 'transfer.empty' ? '暂无数据' : t('transfer.empty')"
      ></div>
    </div>
    <div class="asc-transfer-footer">
      <span
        x-text="sourceItems.length + ' / ' + data.length + (t('transfer.total') === 'transfer.total' ? ' 项' : ' ' + t('transfer.total'))"
      ></span>
    </div>
  </div>
  <div class="asc-transfer-actions">
    <button
      type="button"
      class="asc-transfer-btn"
      :disabled="!canRight"
      @click="moveRight()"
      aria-label="移入目标"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
    <button
      type="button"
      class="asc-transfer-btn"
      :disabled="!canLeft"
      @click="moveLeft()"
      aria-label="移回源"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  </div>
  <div class="asc-transfer-list">
    <div class="asc-transfer-header">
      <span
        class="asc-transfer-check"
        x-component:autospark.checkbox="{ checked: targetAll, indeterminate: targetHalf, disabled: disabled }"
        @change="onToggleTargetAll($event)"
      ></span>
      <span class="asc-transfer-title" x-text="(titles && titles[1]) || ''"></span>
    </div>
    <div class="asc-transfer-search" x-if="filterable">
      <input
        class="asc-transfer-search-input"
        type="text"
        :placeholder="t('transfer.search') === 'transfer.search' ? '请输入搜索内容' : t('transfer.search')"
        x-on:input="onTargetFilterInput($event)"
      />
    </div>
    <div class="asc-transfer-body">
      <template x-for="item of targetView" :key="item.key">
        <div
          class="asc-transfer-item"
          :data-disabled="!!item.disabled"
          @click="onRowClick(item, $event)"
        >
          <span
            class="asc-transfer-item-check"
            x-component:autospark.checkbox="{ checked: pickedKeys.includes(String(item.key)), disabled: disabled || !!item.disabled }"
            @change="togglePick(item.key, $event)"
          ></span>
          <span class="asc-transfer-item-label" x-text="item.label"></span>
        </div>
      </template>
      <div
        class="asc-transfer-empty"
        x-if="!(targetView && targetView.length > 0)"
        x-text="t('transfer.empty') === 'transfer.empty' ? '暂无数据' : t('transfer.empty')"
      ></div>
    </div>
    <div class="asc-transfer-footer">
      <span
        x-text="targetItems.length + ' / ' + data.length + (t('transfer.total') === 'transfer.total' ? ' 项' : ' ' + t('transfer.total'))"
      ></span>
    </div>
  </div>
</div>
`,po=`autospark.transfer`;function mo(e){e.components[po]=fo}ho();function ho(){y(e=>{m(e),mo(e)})}var go=`<span
  class="asc-color-picker asc-field-box"
  x-define="autospark.color-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "#000000",
            presets: [],
            name: "",
            committed: "#000000",
            h: 0,
            s: 0,
            v: 0,
            hueColor: "#ff0000",
            liveHex: "#000000",
            open: false,
            pickTick: 0,
            pickValue: "",
            applyTick: 0,
            applyHex: "",
            commitTick: 0,
        }),
        methods: {
            normalizeHex(v) {
                if (typeof v !== "string") return "#000000";
                let t = v.trim().replace(/^#/, "");
                if (/^[0-9a-fA-F]{3}$/.test(t)) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
                if (!/^[0-9a-fA-F]{6}$/.test(t)) return "#000000";
                return "#" + t.toLowerCase();
            },
            hexToRgb(hex) {
                const t = hex.slice(1);
                return [
                    parseInt(t.slice(0, 2), 16),
                    parseInt(t.slice(2, 4), 16),
                    parseInt(t.slice(4, 6), 16),
                ];
            },
            rgbToHsv(r, g, b) {
                r /= 255; g /= 255; b /= 255;
                const mx = Math.max(r, g, b);
                const mn = Math.min(r, g, b);
                const d = mx - mn;
                let h = 0;
                if (d !== 0) {
                    if (mx === r) h = ((g - b) / d) % 6;
                    else if (mx === g) h = (b - r) / d + 2;
                    else h = (r - g) / d + 4;
                    h *= 60;
                    if (h < 0) h += 360;
                }
                return [h, mx === 0 ? 0 : d / mx, mx];
            },
            hsvToRgb(h, s, v) {
                const c = v * s;
                const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
                const m = v - c;
                let r = 0, g = 0, b = 0;
                if (h < 60) { r = c; g = x; }
                else if (h < 120) { r = x; g = c; }
                else if (h < 180) { g = c; b = x; }
                else if (h < 240) { g = x; b = c; }
                else if (h < 300) { r = x; b = c; }
                else { r = c; b = x; }
                return [
                    Math.round((r + m) * 255),
                    Math.round((g + m) * 255),
                    Math.round((b + m) * 255),
                ];
            },
            hsvToHex(h, s, v) {
                const parts = this.hsvToRgb(h, s, v);
                const p = (n) => n.toString(16).padStart(2, "0");
                return "#" + p(parts[0]) + p(parts[1]) + p(parts[2]);
            },
            recomputeLive() {
                const h = Number(this.data.h) || 0;
                const s = Number(this.data.s) || 0;
                const v = Number(this.data.v) || 0;
                this.data.liveHex = this.hsvToHex(h, s, v);
                this.data.hueColor = this.hsvToHex(h, 1, 1);
            },
            applyExternal(v) {
                const norm = this.normalizeHex(v);
                if (norm === this.data.committed) return;
                this.data.committed = norm;
                const rgb = this.hexToRgb(norm);
                const hsv = this.rgbToHsv(rgb[0], rgb[1], rgb[2]);
                this.data.h = hsv[0];
                this.data.s = hsv[1];
                this.data.v = hsv[2];
                this.data.liveHex = norm;
                this.data.hueColor = this.hsvToHex(hsv[0], 1, 1);
                this.syncCarrier();
            },
            commit() {
                this.data.committed = this.data.liveHex;
                this.data.value = this.data.liveHex;
                this.syncCarrier();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.committed } }),
                );
            },
            syncCarrier() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                c.value = String(this.data.committed ?? "");
                c.disabled = !!this.data.disabled;
            },
            syncName() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            triggerEl() {
                return this.el.querySelector(".asc-color-picker-trigger");
            },
            syncOpen() {
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(!!this.data.open));
            },
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                this.syncCarrier();
            },
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.openPanel();
                }
            },
        },
        mounted() {
            const prior = this.el.value;
            const initV = typeof prior === "string" && prior !== "" ? prior : this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => self.data.committed,
                set: (v) => {
                    const norm = self.normalizeHex(v);
                    if (norm === self.data.committed) return;
                    self.applyExternal(v);
                },
                configurable: true,
            });
            this.applyExternal(initV);

            setTimeout(() => {
                this.syncName();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            let lastPropsValue = this.data.value;
            this.watch("value", ({ value: v }) => {
                if (v === lastPropsValue) return;
                lastPropsValue = v;
                this.applyExternal(v);
            });
            this.watch("h", () => { this.recomputeLive(); });
            this.watch("s", () => { this.recomputeLive(); });
            this.watch("v", () => { this.recomputeLive(); });
            const sentineled = (key, fn) => {
                let last = this.data[key];
                this.watch(key, () => {
                    if (this.data[key] === last) return;
                    last = this.data[key];
                    fn();
                });
            };
            sentineled("pickTick", () => {
                const norm = this.normalizeHex(this.data.pickValue);
                if (norm === this.data.committed) return;
                this.applyExternal(norm);
                this.commit();
            });
            sentineled("applyTick", () => {
                const norm = this.normalizeHex(this.data.applyHex);
                if (norm === this.data.committed) return;
                this.applyExternal(norm);
                this.commit();
            });
            sentineled("commitTick", () => {
                if (this.data.liveHex !== this.data.committed) this.commit();
            });
            this.watch("open", () => { this.syncOpen(); });
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-color-picker">
    .asc-color-picker {
      cursor: pointer;
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */
    .asc-color-picker[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-color-picker[data-disabled] .asc-color-picker-trigger {
      pointer-events: none;
    }

    .asc-color-picker-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      margin-inline: calc(-1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem)));
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      align-self: stretch;
      outline: none;
    }
    .asc-color-picker-swatch {
      flex: none;
      box-sizing: border-box;
      width: 1.35em;
      height: 1.35em;
      border: var(--auto-border-size, var(--asc-color-picker-swatch-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-color-picker-swatch-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-color-picker-swatch-radius, 0.25rem));
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    }
    .asc-color-picker-hex {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-color-picker-color, #333333));
    }

    [dark] .asc-color-picker-hex,
    [data-dark] .asc-color-picker-hex {
      color: var(--auto-color, var(--asc-color-picker-color, #fafafa));
    }

    /* ══════════ 取色面板（autospark-color-panel，渲染进 body 覆盖物容器；样式经
       本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════
       注：SV 面板白/黑叠加与 H 条七色谱为 HSV 色彩模型常数（非语义色，不参与主题化） */
    .asc-color-panel {
      display: block;
      box-sizing: border-box;
      width: var(--asc-color-panel-width, 15em);
      padding: 0.8em;
      font-size: var(--auto-font-size, var(--asc-color-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-color-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-color-panel-color, #333333));
    }
    /* SV 面板：底色 = hueColor（内联绑定）+ 双层渐变叠加（横向白→透明 / 纵向透明→黑）；
       touch-action 拖拽防页面滚动 */
    .asc-color-sv {
      position: relative;
      height: 10em;
      border-radius: var(--auto-border-radius, var(--asc-color-sv-radius, 0.375rem));
      background-image:
        linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0)),
        linear-gradient(to top, #000000, rgba(0, 0, 0, 0));
      cursor: crosshair;
      touch-action: none;
    }
    .asc-color-sv-thumb {
      position: absolute;
      box-sizing: border-box;
      width: 0.9em;
      height: 0.9em;
      border: 0.14em solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .asc-color-hue {
      position: relative;
      margin-top: 0.7em;
      height: 0.7em;
      border-radius: 9999px;
      background: linear-gradient(
        to right,
        #ff0000 0%,
        #ffff00 17%,
        #00ff00 33%,
        #00ffff 50%,
        #0000ff 67%,
        #ff00ff 83%,
        #ff0000 100%
      );
      cursor: crosshair;
      touch-action: none;
    }
    .asc-color-hue-thumb {
      position: absolute;
      top: 50%;
      box-sizing: border-box;
      width: 0.9em;
      height: 0.9em;
      border: 0.14em solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .asc-color-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4em;
      margin-top: 0.7em;
    }
    .asc-color-preset {
      box-sizing: border-box;
      width: 1.4em;
      height: 1.4em;
      padding: 0;
      border: var(--auto-border-size, var(--asc-color-preset-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-color-preset-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-color-preset-radius, 0.25rem));
      cursor: pointer;
      transition: transform 0.12s ease;
    }
    .asc-color-preset:hover {
      transform: scale(1.12);
    }
    .asc-color-preset[data-active] {
      box-shadow: 0 0 0 2px
        color-mix(
          in srgb,
          var(--auto-primary-color, var(--asc-color-panel-primary, #009aff)) 55%,
          transparent
        );
    }
    .asc-color-hexrow {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-top: 0.7em;
    }
    .asc-color-hex-swatch {
      flex: none;
      box-sizing: border-box;
      width: 1.6em;
      height: 1.6em;
      border: var(--auto-border-size, var(--asc-color-preset-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-color-preset-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-color-swatch-radius, 0.3rem));
    }
    .asc-color-hex-input {
      flex: 1 1 auto;
      min-width: 0;
      box-sizing: border-box;
      border: none;
      outline: none;
      background: transparent;
      padding: 0.2em 0.1em;
      color: inherit;
      font: inherit;
      border-bottom: 1px solid transparent;
    }
    .asc-color-hex-input:focus {
      border-bottom-color: var(--auto-primary-color, var(--asc-color-panel-primary, #009aff));
    }
    [dark] .asc-color-panel,
    [data-dark] .asc-color-panel {
      color: var(--auto-color, var(--asc-color-panel-color, #fafafa));
    }
    [dark] .asc-color-preset,
    [dark] .asc-color-hex-swatch,
    [data-dark] .asc-color-preset,
    [data-dark] .asc-color-hex-swatch {
      border-color: var(--auto-border-color, var(--asc-color-preset-border, #52525b));
    }
  </style>
  <input type="hidden" class="asc-color-picker-carrier" />
  <span
    class="asc-color-picker-trigger"
    x-popover:autospark-color-panel
    x-popover-options="{ trigger: 'click', padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="dialog"
    aria-expanded="false"
    aria-label="选择颜色"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-color-picker-swatch" :style="'background-color:' + liveHex"></span>
    <span class="asc-color-picker-hex" x-text="liveHex"></span>
  </span>
</span>
`,_o=`<div class="asc-color-panel" x-define="autospark-color-panel">
  <script setup>
    {
        data: () => ({}),
        methods: {
            bindDrag(e, selector, apply, doneKey) {
                const el = e.target instanceof Element ? e.target.closest(selector) : null;
                if (!el) return;
                e.preventDefault();
                const move = (ev) => { apply(ev, el); };
                const up = () => {
                    el.removeEventListener("pointermove", move);
                    el.removeEventListener("pointerup", up);
                    el.removeEventListener("pointercancel", up);
                    this.data[doneKey] = Number(this.data[doneKey] || 0) + 1;
                };
                el.setPointerCapture?.(e.pointerId);
                el.addEventListener("pointermove", move);
                el.addEventListener("pointerup", up);
                el.addEventListener("pointercancel", up);
                apply(e, el);
            },
            onSvDown(e) {
                if (this.data.disabled) return;
                this.bindDrag(e, ".asc-color-sv", (ev, el) => {
                    const rect = el.getBoundingClientRect();
                    const x = rect.width > 0 ? (ev.clientX - rect.left) / rect.width : 0;
                    const y = rect.height > 0 ? (ev.clientY - rect.top) / rect.height : 0;
                    this.data.s = Math.min(1, Math.max(0, x));
                    this.data.v = 1 - Math.min(1, Math.max(0, y));
                }, "commitTick");
            },
            onHueDown(e) {
                if (this.data.disabled) return;
                this.bindDrag(e, ".asc-color-hue", (ev, el) => {
                    const rect = el.getBoundingClientRect();
                    const x = rect.width > 0 ? (ev.clientX - rect.left) / rect.width : 0;
                    this.data.h = Math.min(1, Math.max(0, x)) * 360;
                }, "commitTick");
            },
            onPresetClick(color) {
                if (this.data.disabled) return;
                this.data.pickTick = Number(this.data.pickTick || 0) + 1;
                this.data.pickValue = color;
            },
            onHexChange(e) {
                if (this.data.disabled) return;
                const input = e.target instanceof Element ? e.target : null;
                const t = String(input?.value ?? "").trim();
                const raw = t.replace(/^#/, "");
                const ok = /^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw);
                if (!ok) {
                    if (input) input.value = this.data.liveHex;
                    return;
                }
                this.data.applyTick = Number(this.data.applyTick || 0) + 1;
                this.data.applyHex = t;
            },
        },
        mounted() {
            this.data.open = true;
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <div class="asc-color-sv" :style="'background-color:' + hueColor" @pointerdown="onSvDown($event)">
    <span
      class="asc-color-sv-thumb"
      :style="'left:' + (s * 100) + '%;top:' + ((1 - v) * 100) + '%'"
    ></span>
  </div>
  <div class="asc-color-hue" @pointerdown="onHueDown($event)">
    <span class="asc-color-hue-thumb" :style="'left:' + (h / 360 * 100) + '%'"></span>
  </div>
  <div class="asc-color-presets" x-if="presets && presets.length > 0">
    <template x-for="color of presets" :key="color">
      <button
        type="button"
        class="asc-color-preset"
        :style="'background-color:' + color"
        :data-active="String(color).toLowerCase() === liveHex"
        @click="onPresetClick(color)"
      ></button>
    </template>
  </div>
  <div class="asc-color-hexrow">
    <span class="asc-color-hex-swatch" :style="'background-color:' + liveHex"></span>
    <input
      class="asc-color-hex-input"
      type="text"
      spellcheck="false"
      :value="liveHex"
      @change="onHexChange($event)"
    />
  </div>
</div>
`,vo=`autospark.color-picker`,yo=`autospark-color-panel`;function bo(e){e.components[vo]=go,e.components[yo]=_o}xo();function xo(){y(e=>{m(e),bo(e)})}var So=`<span
  class="asc-date-picker asc-field-box"
  x-define="autospark.date-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",
            placeholder: "",
            clearable: false,
            name: "",
            hasValue: false,
            open: false,
            viewYear: 0,
            viewMonth: 0,
            days: [],
            weekdayLabels: [],
            headerText: "",
            todayValue: "",
            todayText: "今天",
            activeValue: "",
            pickTick: 0,
            pickValue: null,
            monthTick: 0,
            monthDelta: 0,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-date-picker-trigger");
            },
            carrierEl() {
                return this.el.querySelector(".asc-date-picker-carrier");
            },
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            parseYmd(s) {
                if (typeof s !== "string") return null;
                const p = s.split("-");
                if (p.length !== 3) return null;
                const y = Number(p[0]), m = Number(p[1]) - 1, d = Number(p[2]);
                if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
                if (m < 0 || m > 11 || d < 1 || d > 31) return null;
                return { y: y, m: m, d: d };
            },
            fmtYmd(y, m, d) {
                return y + "-" + this.pad2(m + 1) + "-" + this.pad2(d);
            },
            tOr(key, fallback, namedArgs) {
                try {
                    const engine = this.engine;
                    if (engine && typeof engine.translate === "function") {
                        const out = namedArgs
                            ? engine.translate(this.scope, key, namedArgs)
                            : engine.translate(this.scope, key);
                        if (out !== key) return String(out);
                    }
                } catch (e) { /* 查表异常回退 */ }
                return fallback;
            },
            refreshLocale() {
                const wd = this.tOr("date-picker.weekdays", "日,一,二,三,四,五,六");
                this.data.weekdayLabels = String(wd).split(",");
                this.data.todayText = this.tOr("date-picker.today", "今天");
                const n = new Date();
                this.data.todayValue = this.fmtYmd(n.getFullYear(), n.getMonth(), n.getDate());
            },
            rebuild() {
                const y = this.data.viewYear, m = this.data.viewMonth;
                if (!Number.isFinite(y) || !Number.isFinite(m) || m < 0 || m > 11) return;
                const first = new Date(y, m, 1);
                const start = new Date(y, m, 1 - first.getDay());
                const today = this.data.todayValue;
                const cells = [];
                for (let i = 0; i < 42; i++) {
                    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                    const v = this.fmtYmd(d.getFullYear(), d.getMonth(), d.getDate());
                    cells.push({ value: v, day: d.getDate(), out: d.getMonth() !== m, today: v === today });
                }
                this.data.days = cells;
                this.data.headerText = this.tOr(
                    "date-picker.month-format",
                    y + "年" + (m + 1) + "月",
                    { y: y, m: m + 1 },
                );
            },
            syncValue() {
                const has = this.data.value != null && this.data.value !== "";
                this.data.hasValue = has;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(this.data.value) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) {
                    this.refreshLocale();
                    const v = this.parseYmd(this.data.value);
                    const n = new Date();
                    const base = v || { y: n.getFullYear(), m: n.getMonth() };
                    this.data.viewYear = base.y;
                    this.data.viewMonth = base.m;
                    this.data.activeValue = v ? this.data.value : this.data.todayValue;
                    this.rebuild();
                }
            },
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            shiftMonth(delta) {
                let y = this.data.viewYear, m = this.data.viewMonth + (delta > 0 ? 1 : -1);
                if (m > 11) { y += 1; m = 0; }
                if (m < 0) { y -= 1; m = 11; }
                this.data.viewYear = y;
                this.data.viewMonth = m;
                this.rebuild();
            },
            moveActive(deltaDays) {
                const cur = this.parseYmd(this.data.activeValue) || this.parseYmd(this.data.todayValue);
                if (!cur) return;
                const t = new Date(cur.y, cur.m, cur.d + deltaDays);
                const vy = t.getFullYear(), vm = t.getMonth();
                if (vy !== this.data.viewYear || vm !== this.data.viewMonth) {
                    this.data.viewYear = vy;
                    this.data.viewMonth = vm;
                }
                this.data.activeValue = this.fmtYmd(vy, vm, t.getDate());
                this.rebuild();
            },
            confirmActive() {
                if (this.data.activeValue) this.pick(this.data.activeValue);
            },
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                if (typeof v !== "string" || v === "") return;
                if (v === this.data.value) { this.closePanel(); return; }
                this.data.value = v;
                this.syncValue();
                const p = this.parseYmd(v);
                if (p) {
                    this.data.viewYear = p.y;
                    this.data.viewMonth = p.m;
                    this.rebuild();
                }
                this.emitChange();
                this.closePanel();
                this.triggerEl()?.focus();
            },
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                const k = event.key;
                if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.moveActive(k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : k === "ArrowUp" ? -7 : 7);
                } else if (k === "PageUp" || k === "PageDown") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.shiftMonth(k === "PageUp" ? -1 : 1);
                } else if (k === "Enter") {
                    event.preventDefault();
                    if (this.data.open) this.confirmActive();
                    else this.openPanel();
                }
            },
        },
        mounted() {
            const prior = this.el.value;
            let lastValue = undefined;
            if (prior !== undefined && prior !== null && prior !== "") lastValue = prior;
            else if (this.data.value != null && this.data.value !== "") lastValue = this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const v = self.data.value;
                    return v == null ? "" : v;
                },
                set: (v) => {
                    const norm = v == null ? "" : String(v);
                    if (norm === lastValue) return;
                    lastValue = norm;
                    self.data.value = norm;
                    self.syncValue();
                },
                configurable: true,
            });
            if (lastValue !== undefined) this.data.value = lastValue;

            setTimeout(() => {
                if (this.data.clearable === "") this.data.clearable = true;
                if (this.data.disabled === "") this.data.disabled = true;
                if (this.data.readonly === "") this.data.readonly = true;
                const nameProp = this.data.name;
                const nameAttr = typeof nameProp === "string" && nameProp !== ""
                    ? nameProp
                    : this.el.getAttribute("name");
                const c = this.carrierEl();
                if (c && nameAttr != null && nameAttr !== "") c.name = nameAttr;
                this.refreshLocale();
                const v = this.parseYmd(this.data.value);
                const n = new Date();
                const base = v || { y: n.getFullYear(), m: n.getMonth() };
                this.data.viewYear = base.y;
                this.data.viewMonth = base.m;
                this.rebuild();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("viewYear", () => this.rebuild());
            this.watch("viewMonth", () => this.rebuild());
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("monthTick", () => { this.shiftMonth(Number(this.data.monthDelta) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-date-picker">
    .asc-date-picker {
      cursor: pointer;
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */
    .asc-date-picker[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-date-picker[data-disabled] .asc-date-picker-trigger {
      pointer-events: none;
    }
    .asc-date-picker[data-readonly] {
      cursor: default;
    }

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面）；
             可聚焦（tabindex 由 JS 通道维护禁用态） ---------- */
    .asc-date-picker-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      margin-inline: calc(
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem))
      );
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      align-self: stretch;
      outline: none;
    }
    .asc-date-picker-value {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-date-picker-color, #333333));
    }
    .asc-date-picker-placeholder {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-input-placeholder, var(--asc-date-picker-placeholder, rgba(0, 0, 0, 0.35)));
    }

    .asc-date-picker-clear {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-date-picker-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-date-picker-clear:hover {
      color: var(--auto-color, var(--asc-date-picker-action-hover, #606060));
    }
    .asc-date-picker-clear:active {
      transform: scale(0.92);
    }
    .asc-date-picker-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      color: var(--auto-third-color, var(--asc-date-picker-icon, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-date-picker[data-open] .asc-date-picker-icon {
      color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-date-picker-primary, #009aff)));
    }

    [dark] .asc-date-picker-value,
    [data-dark] .asc-date-picker-value {
      color: var(--auto-color, var(--asc-date-picker-color, #fafafa));
    }
    [dark] .asc-date-picker-placeholder,
    [data-dark] .asc-date-picker-placeholder {
      color: var(--auto-input-placeholder, var(--asc-date-picker-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-date-picker-clear,
    [dark] .asc-date-picker-icon,
    [data-dark] .asc-date-picker-clear,
    [data-dark] .asc-date-picker-icon {
      color: var(--auto-third-color, var(--asc-date-picker-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-date-picker-clear:hover,
    [data-dark] .asc-date-picker-clear:hover {
      color: var(--auto-color, var(--asc-date-picker-action-hover, #fafafa));
    }

    /* ══════════ 日历面板（autospark-date-picker-panel，渲染进 body 覆盖物容器；
       样式经本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════
       语义色组织（ADR-0025 视觉对齐）：--asc-tone 中转变量（alert/tag 定型结构），
       选中实底 tone + 白字，hover/active 走 color-mix 派生 */
    .asc-date-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-date-picker-primary, #009aff));
      display: block;
      padding: 0.6em;
      font-size: var(--auto-font-size, var(--asc-date-picker-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-date-picker-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-date-picker-panel-color, #333333));
    }
    .asc-date-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4em;
    }
    .asc-date-picker-nav {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2em;
      height: 2em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-nav-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-date-picker-nav, rgba(0, 0, 0, 0.45)));
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-date-picker-nav:hover {
      background: var(--auto-hover-bgcolor, var(--asc-date-picker-nav-hover-bg, rgba(0, 0, 0, 0.045)));
      color: var(--auto-color, var(--asc-date-picker-nav-hover, #333333));
    }
    .asc-date-picker-nav-prev {
      transform: rotate(180deg);
    }
    .asc-date-picker-title {
      flex: 1 1 auto;
      text-align: center;
      font-weight: var(--auto-font-weight, var(--asc-date-picker-title-weight, 500));
      color: var(--auto-color, var(--asc-date-picker-title, #333333));
    }
    .asc-date-picker-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 2.4em);
      justify-content: center;
    }
    .asc-date-picker-weekday {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.2em;
      color: var(--auto-third-color, var(--asc-date-picker-weekday, rgba(0, 0, 0, 0.45)));
    }
    /* 日格：单层 42 格扁平数组（不嵌套 x-for——内层渲染晚一跳边界规避），CSS 七列
       自然分行；**固定 em 轨道**（面板是 auto 宽弹层，1fr 轨道会塌到内容宽——面板
       宽度由 7×2.4em 定形，随字号档位 em 基准缩放） */
    .asc-date-picker-grid {
      display: grid;
      grid-template-columns: repeat(7, 2.4em);
      justify-content: center;
      row-gap: 0.1em;
    }
    .asc-date-picker-day {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.2em;
      width: 100%;
      border-radius: var(--x-border-radius-circle, var(--asc-date-picker-day-radius, 50%));
      cursor: pointer;
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-date-picker-day:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    .asc-date-picker-day[data-active] {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--asc-tone) 45%, transparent);
    }
    .asc-date-picker-day[data-selected] {
      background: var(--asc-tone);
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-selected]:hover {
      background: var(--asc-tone);
    }
    .asc-date-picker-day[data-today] {
      color: var(--asc-tone);
      font-weight: var(--auto-font-weight, var(--asc-date-picker-today-weight, 500));
    }
    .asc-date-picker-day[data-today]:not([data-selected]) {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--asc-tone) 35%, transparent);
    }
    .asc-date-picker-day[data-today][data-selected] {
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-out] {
      color: var(--auto-third-color, var(--asc-date-picker-day-out, rgba(0, 0, 0, 0.28)));
    }
    .asc-date-picker-day[data-out][data-today],
    .asc-date-picker-day[data-out][data-selected] {
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-out][data-today] {
      color: var(--asc-tone);
    }
    .asc-date-picker-footer {
      display: flex;
      justify-content: center;
      margin-top: 0.4em;
      padding-top: 0.4em;
      border-top: var(--auto-border-size, var(--asc-date-picker-footer-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-date-picker-footer-border, #f0f0f0));
    }
    .asc-date-picker-today {
      border: none;
      background: transparent;
      padding: 0.25em 0.75em;
      cursor: pointer;
      font: inherit;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-today-radius, 0.25rem));
      color: var(--asc-tone);
      transition: background-color 0.12s ease;
    }
    .asc-date-picker-today:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    [dark] .asc-date-picker-panel,
    [data-dark] .asc-date-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-date-picker-primary, #56baff));
      color: var(--auto-color, var(--asc-date-picker-panel-color, #fafafa));
    }
    [dark] .asc-date-picker-nav,
    [dark] .asc-date-picker-weekday,
    [data-dark] .asc-date-picker-nav,
    [data-dark] .asc-date-picker-weekday {
      color: var(--auto-third-color, var(--asc-date-picker-nav, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-date-picker-nav:hover,
    [data-dark] .asc-date-picker-nav:hover {
      background: var(--auto-hover-bgcolor, var(--asc-date-picker-nav-hover-bg, rgba(255, 255, 255, 0.08)));
      color: var(--auto-color, var(--asc-date-picker-nav-hover, #fafafa));
    }
    [dark] .asc-date-picker-day[data-out],
    [data-dark] .asc-date-picker-day[data-out] {
      color: var(--auto-third-color, var(--asc-date-picker-day-out, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-date-picker-footer,
    [data-dark] .asc-date-picker-footer {
      border-top-color: var(--auto-border-color, var(--asc-date-picker-footer-border, #52525b));
    }
  </style>
  <input type="hidden" class="asc-date-picker-carrier" />
  <span
    class="asc-date-picker-trigger"
    x-popover:autospark-date-picker-panel
    x-popover-options="{ trigger: 'click', padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="grid"
    aria-expanded="false"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-date-picker-value" x-if="hasValue" x-text="value"></span>
    <span
      class="asc-date-picker-placeholder"
      x-if="!hasValue"
      x-text="placeholder || (t('date-picker.placeholder') === 'date-picker.placeholder' ? '请选择日期' : t('date-picker.placeholder'))"
    ></span>
  </span>
  <i
    class="asc-date-picker-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i class="asc-date-picker-icon" data-autospark-action x-icon="'date-calendar'"></i>
</span>
`,Co=`<div class="asc-date-picker-panel" x-define="autospark-date-picker-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <div class="asc-date-picker-header">
    <i
      class="asc-date-picker-nav asc-date-picker-nav-prev"
      @click="monthTick = monthTick + 1, monthDelta = -1"
      x-icon="'arrow'"
    ></i>
    <span class="asc-date-picker-title" x-text="headerText"></span>
    <i
      class="asc-date-picker-nav"
      @click="monthTick = monthTick + 1, monthDelta = 1"
      x-icon="'arrow'"
    ></i>
  </div>
  <div class="asc-date-picker-weekdays">
    <template x-for="w of weekdayLabels" :key="w">
      <span class="asc-date-picker-weekday" x-text="w"></span>
    </template>
  </div>
  <div class="asc-date-picker-grid" role="grid">
    <template x-for="day of days" :key="day.value">
      <span
        class="asc-date-picker-day"
        role="gridcell"
        x-bind:data-out="day.out"
        x-bind:data-today="day.today"
        x-bind:data-selected="day.value === value"
        x-bind:data-active="day.value === activeValue"
        x-on:click="pickTick = pickTick + 1, pickValue = day.value"
        x-text="day.day"
      ></span>
    </template>
  </div>
  <div class="asc-date-picker-footer">
    <button
      type="button"
      class="asc-date-picker-today"
      x-text="todayText"
      @click="pickTick = pickTick + 1, pickValue = todayValue"
    ></button>
  </div>
</div>
`,wo=`autospark.date-picker`,To=`autospark-date-picker-panel`,Eo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`;function Do(e){e.icons?.add?.(`date-calendar`,Eo),e.components[wo]=So,e.components[To]=Co}Oo();function Oo(){y(e=>{m(e),Do(e)})}var ko=`<span
  class="asc-time-picker asc-field-box"
  x-define="autospark.time-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",
            placeholder: "",
            clearable: false,
            name: "",
            hasValue: false,
            open: false,
            curHour: -1,
            curMinute: -1,
            hourList: [],
            minuteList: [],
            hTick: 0,
            hVal: null,
            mTick: 0,
            mVal: null,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-time-picker-trigger");
            },
            carrierEl() {
                return this.el.querySelector(".asc-time-picker-carrier");
            },
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            parseHm(s) {
                if (typeof s !== "string") return null;
                const p = s.split(":");
                if (p.length !== 2) return null;
                const h = Number(p[0]), mi = Number(p[1]);
                if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
                if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
                return { h: h, mi: mi };
            },
            fmtHm(h, mi) {
                return this.pad2(h) + ":" + this.pad2(mi);
            },
            buildLists() {
                const hours = [], minutes = [];
                for (let i = 0; i < 24; i++) hours.push({ v: i, label: this.pad2(i) });
                for (let i = 0; i < 60; i++) minutes.push({ v: i, label: this.pad2(i) });
                this.data.hourList = hours;
                this.data.minuteList = minutes;
            },
            syncValue() {
                const v = this.data.value;
                const has = v != null && v !== "";
                this.data.hasValue = has;
                const p = has ? this.parseHm(String(v)) : null;
                this.data.curHour = p ? p.h : -1;
                this.data.curMinute = p ? p.mi : -1;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(v) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
            },
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            applyPart(isHour, v) {
                if (this.data.disabled || this.data.readonly) return;
                if (v == null || v === "") return;
                const n = Number(v);
                if (!Number.isFinite(n)) return;
                if (isHour && (n < 0 || n > 23)) return;
                if (!isHour && (n < 0 || n > 59)) return;
                const h = isHour ? n : (this.data.curHour >= 0 ? this.data.curHour : 0);
                const mi = !isHour ? n : (this.data.curMinute >= 0 ? this.data.curMinute : 0);
                const next = this.fmtHm(h, mi);
                if (next === this.data.value) return;
                this.data.value = next;
                this.syncValue();
                this.emitChange();
            },
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "Enter" || event.key === "ArrowDown") {
                    event.preventDefault();
                    if (this.data.open) this.closePanel();
                    else this.openPanel();
                }
            },
        },
        mounted() {
            const prior = this.el.value;
            let lastValue = undefined;
            if (prior !== undefined && prior !== null && prior !== "") lastValue = prior;
            else if (this.data.value != null && this.data.value !== "") lastValue = this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const v = self.data.value;
                    return v == null ? "" : v;
                },
                set: (v) => {
                    const norm = v == null ? "" : String(v);
                    if (norm === lastValue) return;
                    lastValue = norm;
                    self.data.value = norm;
                    self.syncValue();
                },
                configurable: true,
            });
            if (lastValue !== undefined) this.data.value = lastValue;

            setTimeout(() => {
                if (this.data.clearable === "") this.data.clearable = true;
                if (this.data.disabled === "") this.data.disabled = true;
                if (this.data.readonly === "") this.data.readonly = true;
                const nameProp = this.data.name;
                const nameAttr = typeof nameProp === "string" && nameProp !== ""
                    ? nameProp
                    : this.el.getAttribute("name");
                const c = this.carrierEl();
                if (c && nameAttr != null && nameAttr !== "") c.name = nameAttr;
                this.buildLists();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            const sentineled = (key, fn) => {
                let last = this.data[key];
                this.watch(key, () => {
                    if (this.data[key] === last) return;
                    last = this.data[key];
                    fn();
                });
            };
            sentineled("hTick", () => { this.applyPart(true, this.data.hVal); });
            sentineled("mTick", () => { this.applyPart(false, this.data.mVal); });
        },
    }
  <\/script>
  <style global id="autospark-components-time-picker">
    .asc-time-picker {
      cursor: pointer;
    }
    .asc-time-picker[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-time-picker[data-disabled] .asc-time-picker-trigger {
      pointer-events: none;
    }
    .asc-time-picker[data-readonly] {
      cursor: default;
    }

    .asc-time-picker-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      margin-inline: calc(
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem))
      );
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      align-self: stretch;
      outline: none;
    }
    .asc-time-picker-value {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-time-picker-color, #333333));
    }
    .asc-time-picker-placeholder {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-input-placeholder, var(--asc-time-picker-placeholder, rgba(0, 0, 0, 0.35)));
    }

    .asc-time-picker-clear {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-time-picker-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-time-picker-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-picker-clear:hover {
      color: var(--auto-color, var(--asc-time-picker-action-hover, #606060));
    }
    .asc-time-picker-clear:active {
      transform: scale(0.92);
    }
    .asc-time-picker-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      color: var(--auto-third-color, var(--asc-time-picker-icon, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-picker[data-open] .asc-time-picker-icon {
      color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-time-picker-primary, #009aff)));
    }

    [dark] .asc-time-picker-value,
    [data-dark] .asc-time-picker-value {
      color: var(--auto-color, var(--asc-time-picker-color, #fafafa));
    }
    [dark] .asc-time-picker-placeholder,
    [data-dark] .asc-time-picker-placeholder {
      color: var(--auto-input-placeholder, var(--asc-time-picker-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-time-picker-clear,
    [dark] .asc-time-picker-icon,
    [data-dark] .asc-time-picker-clear,
    [data-dark] .asc-time-picker-icon {
      color: var(--auto-third-color, var(--asc-time-picker-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-time-picker-clear:hover,
    [data-dark] .asc-time-picker-clear:hover {
      color: var(--auto-color, var(--asc-time-picker-action-hover, #fafafa));
    }

    /* ══════════ 时间面板（autospark-time-picker-panel，渲染进 body 覆盖物容器）══════════
       语义色组织（ADR-0025 视觉对齐）：--asc-tone 中转（alert/tag 定型结构），选中实底
       tone + 白字，hover 走 color-mix 派生——与 select 选项 / date-picker 日格同源 */
    .asc-time-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-time-picker-primary, #009aff));
      display: block;
      padding: 0.25em;
      font-size: var(--auto-font-size, var(--asc-time-picker-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-time-picker-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-time-picker-panel-color, #333333));
    }
    /* 两列布局：时/分等宽列（固定 em 轨道定形面板宽——auto 宽弹层内 flex 收缩防护），
       各自纵向滚动（select 列表同款 max-height 限档） */
    .asc-time-picker-cols {
      display: flex;
      gap: 0.25em;
    }
    .asc-time-picker-col {
      flex: 1 1 5.5em;
      width: 5.5em;
      max-height: var(--asc-time-picker-max-height, 15em);
      overflow-y: auto;
      padding: 0.25em 0;
      box-sizing: border-box;
    }
    .asc-time-picker-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 2.2em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-time-picker-cell-radius, 0.25rem));
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-time-picker-cell:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    .asc-time-picker-cell[data-selected] {
      background: var(--asc-tone);
      color: var(--asc-time-picker-cell-selected-ink, #ffffff);
      font-weight: var(--auto-font-weight, var(--asc-time-picker-selected-weight, 500));
    }
    .asc-time-picker-cell[data-selected]:hover {
      background: var(--asc-tone);
    }
    [dark] .asc-time-picker-panel,
    [data-dark] .asc-time-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-time-picker-primary, #56baff));
      color: var(--auto-color, var(--asc-time-picker-panel-color, #fafafa));
    }
  </style>
  <input type="hidden" class="asc-time-picker-carrier" />
  <span
    class="asc-time-picker-trigger"
    x-popover:autospark-time-picker-panel
    x-popover-options="{ trigger: 'click', padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded="false"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-time-picker-value" x-if="hasValue" x-text="value"></span>
    <span
      class="asc-time-picker-placeholder"
      x-if="!hasValue"
      x-text="placeholder || (t('time-picker.placeholder') === 'time-picker.placeholder' ? '请选择时间' : t('time-picker.placeholder'))"
    ></span>
  </span>
  <i
    class="asc-time-picker-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i class="asc-time-picker-icon" data-autospark-action x-icon="'time-clock'"></i>
</span>
`,Ao=`<div class="asc-time-picker-panel" x-define="autospark-time-picker-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
            const scrollCol = (col) => {
                const sel = col.querySelector(".asc-time-picker-cell[data-selected]");
                (sel || col.querySelector(".asc-time-picker-cell"))?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(() => {
                this.el.querySelectorAll(".asc-time-picker-col").forEach(scrollCol);
            }, 0);
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <div class="asc-time-picker-cols">
    <div class="asc-time-picker-col" role="listbox">
      <template x-for="h of hourList" :key="h.v">
        <span
          class="asc-time-picker-cell"
          role="option"
          x-bind:data-selected="h.v === curHour"
          x-on:click="hTick = hTick + 1, hVal = h.v"
          x-text="h.label"
        ></span>
      </template>
    </div>
    <div class="asc-time-picker-col" role="listbox">
      <template x-for="m of minuteList" :key="m.v">
        <span
          class="asc-time-picker-cell"
          role="option"
          x-bind:data-selected="m.v === curMinute"
          x-on:click="mTick = mTick + 1, mVal = m.v"
          x-text="m.label"
        ></span>
      </template>
    </div>
  </div>
</div>
`,jo=`autospark.time-picker`,Mo=`autospark-time-picker-panel`,No=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;function Po(e){e.icons?.add?.(`time-clock`,No),e.components[jo]=ko,e.components[Mo]=Ao}Fo();function Fo(){y(e=>{m(e),Po(e)})}var Io=`<span
  class="asc-time-select asc-field-box"
  x-define="autospark.time-select"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",
            placeholder: "",
            clearable: false,
            start: "00:00",
            end: "23:00",
            step: "00:30",
            name: "",
            uid: "",
            hasValue: false,
            open: false,
            options: [],
            activeIndex: -1,
            activeValue: null,
            pickTick: 0,
            pickValue: null,
            keyTick: 0,
            keyDir: 0,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-time-select-trigger");
            },
            carrierEl() {
                return this.el.querySelector(".asc-time-select-carrier");
            },
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            parseHmMinutes(s) {
                if (typeof s !== "string") return null;
                const p = s.split(":");
                if (p.length !== 2) return null;
                const h = Number(p[0]), mi = Number(p[1]);
                if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
                if (h < 0 || mi < 0) return null;
                return h * 60 + mi;
            },
            fmtMinutes(total) {
                const t = ((total % 1440) + 1440) % 1440;
                return this.pad2(Math.floor(t / 60)) + ":" + this.pad2(t % 60);
            },
            rebuildOptions() {
                const s = this.parseHmMinutes(this.data.start);
                const e = this.parseHmMinutes(this.data.end);
                if (s == null || e == null || s > e) {
                    this.data.options = [];
                } else {
                    const stepRaw = this.parseHmMinutes(this.data.step);
                    const stepMin = stepRaw != null && stepRaw > 0 ? stepRaw : 30;
                    const list = [];
                    for (let t = s; t <= e && list.length < 2000; t += stepMin) {
                        const label = this.fmtMinutes(t);
                        list.push({ label: label, value: label });
                    }
                    this.data.options = list;
                }
                this.setActiveToValue();
            },
            syncActive() {
                const list = this.data.options ?? [];
                const i = this.data.activeIndex;
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;
                else this.data.activeValue = null;
            },
            setActiveToValue() {
                const list = this.data.options ?? [];
                let i = list.findIndex((o) => o && String(o.value) === String(this.data.value));
                if (i < 0 && list.length > 0) i = 0;
                this.data.activeIndex = i;
                this.syncActive();
            },
            syncValue() {
                const has = this.data.value != null && this.data.value !== "";
                this.data.hasValue = has;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(this.data.value) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) this.setActiveToValue();
            },
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            moveActive(dir) {
                const list = this.data.options ?? [];
                if (list.length === 0) return;
                const i = this.data.activeIndex;
                this.data.activeIndex = (i + dir + list.length) % list.length;
                this.syncActive();
            },
            confirmActive() {
                if (this.data.activeValue != null) this.pick(this.data.activeValue);
            },
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                const list = this.data.options ?? [];
                const opt = list.find((o) => o && String(o.value) === String(v));
                if (!opt) return;
                if (String(opt.value) === String(this.data.value)) { this.closePanel(); return; }
                this.data.value = opt.value;
                this.syncValue();
                this.emitChange();
                this.closePanel();
                this.triggerEl()?.focus();
            },
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (this.data.open) this.confirmActive();
                    else this.openPanel();
                }
            },
        },
        mounted() {
            const prior = this.el.value;
            let lastValue = undefined;
            if (prior !== undefined && prior !== null && prior !== "") lastValue = prior;
            else if (this.data.value != null && this.data.value !== "") lastValue = this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const v = self.data.value;
                    return v == null ? "" : v;
                },
                set: (v) => {
                    const norm = v == null ? "" : String(v);
                    if (norm === lastValue) return;
                    lastValue = norm;
                    self.data.value = norm;
                    self.syncValue();
                },
                configurable: true,
            });
            if (lastValue !== undefined) this.data.value = lastValue;

            setTimeout(() => {
                if (this.data.clearable === "") this.data.clearable = true;
                if (this.data.disabled === "") this.data.disabled = true;
                if (this.data.readonly === "") this.data.readonly = true;
                const nameProp = this.data.name;
                const nameAttr = typeof nameProp === "string" && nameProp !== ""
                    ? nameProp
                    : this.el.getAttribute("name");
                const c = this.carrierEl();
                if (c && nameAttr != null && nameAttr !== "") c.name = nameAttr;
                this.data.uid = "asc-time-select-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
                this.el.setAttribute("data-asc-time-select-uid", this.data.uid);
                this.rebuildOptions();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("start", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("end", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("step", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-time-select">
    .asc-time-select {
      cursor: pointer;
    }
    .asc-time-select[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-time-select[data-disabled] .asc-time-select-trigger {
      pointer-events: none;
    }
    .asc-time-select[data-readonly] {
      cursor: default;
    }

    .asc-time-select-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      margin-inline: calc(
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem))
      );
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      align-self: stretch;
      outline: none;
    }
    .asc-time-select-value {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-time-select-color, #333333));
    }
    .asc-time-select-placeholder {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-input-placeholder, var(--asc-time-select-placeholder, rgba(0, 0, 0, 0.35)));
    }

    .asc-time-select-clear {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-time-select-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-time-select-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-select-clear:hover {
      color: var(--auto-color, var(--asc-time-select-action-hover, #606060));
    }
    .asc-time-select-clear:active {
      transform: scale(0.92);
    }
    .asc-time-select-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      color: var(--auto-third-color, var(--asc-time-select-icon, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-select[data-open] .asc-time-select-icon {
      color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-time-select-primary, #009aff)));
    }

    [dark] .asc-time-select-value,
    [data-dark] .asc-time-select-value {
      color: var(--auto-color, var(--asc-time-select-color, #fafafa));
    }
    [dark] .asc-time-select-placeholder,
    [data-dark] .asc-time-select-placeholder {
      color: var(--auto-input-placeholder, var(--asc-time-select-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-time-select-clear,
    [dark] .asc-time-select-icon,
    [data-dark] .asc-time-select-clear,
    [data-dark] .asc-time-select-icon {
      color: var(--auto-third-color, var(--asc-time-select-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-time-select-clear:hover,
    [data-dark] .asc-time-select-clear:hover {
      color: var(--auto-color, var(--asc-time-select-action-hover, #fafafa));
    }

    /* ══════════ 时间点列表面板（autospark-time-select-panel，渲染进 body 覆盖物
       容器）——select 下拉面板同款观感（fit + uid 配对 min-width + 同 hover/选中
       token，ADR-0025 视觉对齐）══════════ */
    .asc-time-select-panel {
      display: block;
      min-width: 100%;
      font-size: var(--auto-font-size, var(--asc-time-select-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-time-select-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-time-select-panel-color, #333333));
    }
    .asc-time-select-list {
      max-height: var(--asc-time-select-max-height, 15em);
      overflow-y: auto;
      padding: 0.25em 0;
      box-sizing: border-box;
    }
    /* 选项：行式热区（select 选项同款）；悬停/高亮/选中态经 data-* 属性选择器驱动
       （x-bind 假值整属性移除 = 无态）；选中标记 check 图标纯 CSS 父选择器驱动
       （克隆体内零 x-if——共享快照串台规避，ADR-0021 边界 3） */
    .asc-time-select-option {
      display: flex;
      align-items: center;
      gap: 0.4em;
      min-height: 2.2em;
      padding: 0.3em 0.75em;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .asc-time-select-option-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* 选中标记 check 图标：DOM 恒渲染（克隆体内零 x-if），显隐走 :not(data-selected)
       高特异性选择器——压制 x-icon 注入的 .as-icon 基类 display（同为单类特异性时
       运行时注入序在后者胜出，实证） */
    .asc-time-select-option:not([data-selected]) .asc-time-select-option-check {
      display: none;
    }
    .asc-time-select-option[data-selected] .asc-time-select-option-check {
      display: inline-flex;
    }
    .asc-time-select-option-check {
      flex: none;
      color: var(--auto-primary-color, var(--asc-time-select-panel-primary, #009aff));
    }
    .asc-time-select-option[data-selected] {
      color: var(--auto-primary-color, var(--asc-time-select-panel-primary, #009aff));
    }
    .asc-time-select-option[data-selected] .asc-time-select-option-check {
      display: inline-flex;
    }
    .asc-time-select-option[data-active]:not([data-selected]) {
      background: var(--auto-hover-bgcolor, var(--asc-time-select-option-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-time-select-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-time-select-empty, rgba(0, 0, 0, 0.35)));
    }
    [dark] .asc-time-select-panel,
    [data-dark] .asc-time-select-panel {
      color: var(--auto-color, var(--asc-time-select-panel-color, #fafafa));
    }
    [dark] .asc-time-select-option[data-active]:not([data-selected]),
    [data-dark] .asc-time-select-option[data-active]:not([data-selected]) {
      background: var(--auto-hover-bgcolor, var(--asc-time-select-option-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-time-select-option[data-selected],
    [data-dark] .asc-time-select-option[data-selected] {
      color: var(--auto-primary-color, var(--asc-time-select-panel-primary, #56baff));
    }
    [dark] .asc-time-select-empty,
    [data-dark] .asc-time-select-empty {
      color: var(--auto-third-color, var(--asc-time-select-empty, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <input type="hidden" class="asc-time-select-carrier" />
  <span
    class="asc-time-select-trigger"
    x-popover:autospark-time-select-panel
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded="false"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-time-select-value" x-if="hasValue" x-text="value"></span>
    <span
      class="asc-time-select-placeholder"
      x-if="!hasValue"
      x-text="placeholder || (t('time-select.placeholder') === 'time-select.placeholder' ? '请选择时间' : t('time-select.placeholder'))"
    ></span>
  </span>
  <i
    class="asc-time-select-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i class="asc-time-select-icon" data-autospark-action x-icon="'time-clock'"></i>
</span>
`,Lo=`<div class="asc-time-select-panel" x-define="autospark-time-select-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-time-select-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
            const scrollActive = () => {
                const el = this.el.querySelector(
                    ".asc-time-select-option[data-active], .asc-time-select-option[data-selected]",
                );
                el?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(scrollActive, 0);
            this.watch("activeValue", () => { setTimeout(scrollActive, 0); });
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <div class="asc-time-select-list">
    <template x-for="option of options" :key="option.value">
      <div
        class="asc-time-select-option"
        x-bind:data-selected="String(option.value) === String(value)"
        x-bind:data-active="option.value === activeValue"
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"
      >
        <span class="asc-time-select-option-label" x-text="option.label"></span>
        <i class="asc-time-select-option-check" x-icon="'yes'"></i>
      </div>
    </template>
    <div
      class="asc-time-select-empty"
      x-if="!(options && options.length > 0)"
      x-text="t('time-select.empty') === 'time-select.empty' ? '暂无数据' : t('time-select.empty')"
    ></div>
  </div>
</div>
`,Ro=`autospark.time-select`,zo=`autospark-time-select-panel`,Bo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;function Vo(e){e.icons?.add?.(`time-clock`,Bo),e.components[Ro]=Io,e.components[zo]=Lo}Ho();function Ho(){y(e=>{m(e),Vo(e)})}var Uo=`<span
  class="asc-autocomplete asc-field-box"
  x-define="autospark.autocomplete"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        debounceTimer: null,
        fetchSeq: 0,
        silent: false,
        lastHostClickAt: 0,
        composing: false,
        focused: false,
        lastValue: "",
        initDone: false,
        data: () => ({
            value: "",
            suggestions: [],
            fetch: null,
            debounce: 300,
            placeholder: "",
            clearable: false,
            uid: "",
            items: [],
            activeIndex: -1,
            activeValue: null,
            loading: false,
            hasValue: false,
            open: false,
            pickTick: 0,
            pickValue: null,
            hoverTick: 0,
            hoverValue: null,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-autocomplete-trigger");
            },
            nativeEl() {
                return this.el.querySelector(".asc-autocomplete-native");
            },
            normalizeList(list) {
                return (Array.isArray(list) ? list : []).map((s) => {
                    if (typeof s === "object" && s !== null) {
                        return {
                            value: s.value,
                            label: s.label != null ? s.label : s.value,
                            disabled: !!s.disabled,
                        };
                    }
                    return { value: s, label: s, disabled: false };
                });
            },
            filterLocal(query) {
                const kw = String(query ?? "").trim().toLowerCase();
                const src = this.normalizeList(this.data.suggestions);
                if (kw === "") return src;
                return src.filter(
                    (o) =>
                        String(o.label ?? "").toLowerCase().includes(kw) ||
                        String(o.value ?? "").toLowerCase().includes(kw),
                );
            },
            hasFetch() {
                return !!this.resolveFetch();
            },
            applyItems(list) {
                this.data.items = list;
                this.data.activeIndex = -1;
                this.syncActive();
                if (list.length > 0) {
                    if (this.focused) this.openPanel();
                } else {
                    this.closePanel();
                }
            },
            resolveFetch() {
                const raw = this.data.fetch;
                if (typeof raw === "function") return raw;
                if (typeof raw === "string" && raw.trim() !== "") {
                    const act = this.scope.getAction(raw.trim());
                    if (act && typeof act.handle === "function") return act.handle;
                }
                return null;
            },
            resolveNow(query) {
                if (this.data.disabled || this.data.readonly) return;
                const fn = this.resolveFetch();
                if (fn) {
                    const cur = ++this.fetchSeq;
                    this.data.loading = true;
                    Promise.resolve()
                        .then(() => fn.call(null, query))
                        .then((r) => {
                            if (cur !== this.fetchSeq) return;
                            this.data.loading = false;
                            this.applyItems(this.normalizeList(r));
                        })
                        .catch(() => {
                            if (cur !== this.fetchSeq) return;
                            this.data.loading = false;
                            this.applyItems([]);
                        });
                } else {
                    this.applyItems(this.filterLocal(query));
                }
            },
            scheduleResolve(immediate) {
                const n = this.nativeEl();
                if (!n || this.data.disabled || this.data.readonly) return;
                const q = String(n.value ?? "");
                this.cancelPending();
                const ms = Math.max(0, Number(this.data.debounce) || 0);
                const self = this;
                const run = () => {
                    self.debounceTimer = null;
                    const now = self.nativeEl();
                    if (!now || String(now.value ?? "") !== q) return;
                    self.resolveNow(q);
                };
                if (immediate || ms === 0) run();
                else this.debounceTimer = setTimeout(run, ms);
            },
            cancelPending() {
                if (this.debounceTimer !== null) {
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = null;
                }
                this.fetchSeq++;
            },
            openPanel() {
                if (this.data.disabled || this.data.readonly) return;
                if (this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            syncActive() {
                const list = this.data.items ?? [];
                const i = this.data.activeIndex;
                this.data.activeValue = i >= 0 && i < list.length ? (list[i].value ?? null) : null;
            },
            moveActive(dir) {
                const list = this.data.items ?? [];
                if (list.length === 0) return;
                let i = this.data.activeIndex;
                for (let step = 0; step < list.length; step++) {
                    i = (i + dir + list.length) % list.length;
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }
                }
            },
            emitInput(n) {
                this.silent = true;
                try {
                    n.dispatchEvent(new Event("input", { bubbles: true }));
                } finally {
                    this.silent = false;
                }
            },
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                const list = this.data.items ?? [];
                const item = list.find((o) => String(o.value) === String(v));
                if (!item || item.disabled) return;
                const n = this.nativeEl();
                if (!n) return;
                this.cancelPending();
                n.value = String(item.value);
                this.emitInput(n);
                this.data.hasValue = n.value !== "";
                this.data.activeIndex = -1;
                this.syncActive();
                this.emit("change", { value: item.value });
                this.emit("select", { value: item.value });
                this.closePanel();
                n.focus();
            },
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.nativeEl();
                if (!n || n.value === "") return;
                this.cancelPending();
                n.value = "";
                this.emitInput(n);
                this.data.hasValue = false;
                this.data.items = [];
                this.data.activeIndex = -1;
                this.syncActive();
                this.closePanel();
                n.focus();
            },
            onInputKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!this.data.open) {
                        if ((this.data.items ?? []).length > 0) this.openPanel();
                        else this.scheduleResolve(true);
                        return;
                    }
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                    if (this.data.open) {
                        event.preventDefault();
                        if (this.data.activeValue != null) this.pick(this.data.activeValue);
                        else this.closePanel();
                    }
                }
            },
        },
        mounted() {
            const native = () => this.el.querySelector(".asc-autocomplete-native");

            const syncLen = () => {
                const n = native();
                this.data.hasValue = !!n && String(n.value ?? "") !== "";
            };

            const prior = this.el.value;
            if (typeof prior === "string" && prior !== "") this.lastValue = prior;
            else if (this.data.value != null) this.lastValue = String(this.data.value);
            const snapshotNorm = String(prior ?? "");
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const n = native();
                    return n ? n.value : this.lastValue;
                },
                set: (v) => {
                    if (!this.initDone && String(v ?? "") === snapshotNorm) return;
                    this.lastValue = String(v ?? "");
                    const n = native();
                    if (n) n.value = this.lastValue;
                    syncLen();
                },
                configurable: true,
            });

            this.el.addEventListener("input", (e) => {
                if (this.silent) return;
                const n = native();
                if (!n || e.target !== n) return;
                this.lastValue = n.value;
                syncLen();
                if (e.isComposing || this.composing) return;
                this.scheduleResolve();
            });
            this.el.addEventListener("compositionstart", (e) => {
                if (e.target === native()) this.composing = true;
            });
            this.el.addEventListener("compositionend", (e) => {
                if (e.target !== native()) return;
                this.composing = false;
                this.scheduleResolve();
            });

            this.el.addEventListener(
                "click",
                () => { this.lastHostClickAt = Date.now(); },
                true,
            );

            this.el.addEventListener("focusin", (e) => {
                if (e.target !== native()) return;
                this.focused = true;
                setTimeout(() => {
                    if (this.data.open) return;
                    if (Date.now() - this.lastHostClickAt < 400) return;
                    if ((this.data.items ?? []).length > 0) {
                        this.openPanel();
                        return;
                    }
                    if (!this.hasFetch()) this.scheduleResolve(true);
                }, 0);
            });
            this.el.addEventListener("focusout", (e) => {
                if (e.target !== native()) return;
                const to = e.relatedTarget;
                if (to instanceof Node && this.el.contains(to)) return;
                this.focused = false;
            });

            setTimeout(() => {
                const n = native();
                if (n) {
                    const nameAttr = this.el.getAttribute("name");
                    if (nameAttr != null) n.name = nameAttr;
                    n.value = this.lastValue;
                }
                syncLen();
                this.data.uid =
                    "asc-ac-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
                this.el.setAttribute("data-asc-autocomplete-uid", this.data.uid);
                this.initDone = true;
                if (!this.hasFetch()) this.scheduleResolve(true);
            }, 0);

            this.watch("value", ({ value }) => {
                const v = String(value ?? "");
                if (v === this.lastValue) return;
                this.lastValue = v;
                const n = native();
                if (n) n.value = v;
                syncLen();
            });
            let lastSuggestions = this.data.suggestions;
            this.watch("suggestions", () => {
                if (this.data.suggestions === lastSuggestions) return;
                lastSuggestions = this.data.suggestions;
                setTimeout(() => {
                    if (!this.hasFetch()) this.resolveNow(String(native()?.value ?? ""));
                }, 0);
            });
            let lastFetch = this.data.fetch;
            this.watch("fetch", () => {
                if (this.data.fetch === lastFetch) return;
                lastFetch = this.data.fetch;
                setTimeout(() => this.resolveNow(String(native()?.value ?? "")), 0);
            });
            this.watch("activeIndex", () => { this.syncActive(); });
            this.watch("open", () => {
                this.el.toggleAttribute("data-open", !!this.data.open);
            });
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("hoverTick", () => {
                const list = this.data.items ?? [];
                const i = list.findIndex(
                    (o) => String(o.value) === String(this.data.hoverValue),
                );
                if (i >= 0 && !list[i].disabled) this.data.activeIndex = i;
            });
        },
    }
  <\/script>
  <style global id="autospark-components-autocomplete">
    .asc-autocomplete-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      align-self: stretch;
      outline: none;
    }
    .asc-autocomplete-native {
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: inherit;
    }
    .asc-autocomplete-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-autocomplete-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-autocomplete-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-autocomplete-disable-color, inherit));
    }
    /* 禁用（骨架通道 [data-disabled]）：触发器 pointer-events 阻断 popover 点击
       toggle（popover 宿主监听不知禁用态，CSS 层拦截，select 同款） */
    .asc-autocomplete[data-disabled] .asc-autocomplete-trigger {
      pointer-events: none;
    }

    .asc-autocomplete-action {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-autocomplete-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-autocomplete-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-autocomplete-action:hover {
      color: var(--auto-color, var(--asc-autocomplete-action-hover, #606060));
    }
    .asc-autocomplete-action:active {
      transform: scale(0.92);
    }
    .asc-autocomplete-loading {
      cursor: default;
    }

    [dark] .asc-autocomplete-native::placeholder,
    [data-dark] .asc-autocomplete-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-autocomplete-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-autocomplete-action,
    [data-dark] .asc-autocomplete-action {
      color: var(--auto-third-color, var(--asc-autocomplete-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-autocomplete-action:hover,
    [data-dark] .asc-autocomplete-action:hover {
      color: var(--auto-color, var(--asc-autocomplete-action-hover, #fafafa));
    }

    /* ══════════ 建议面板（autospark-autocomplete-panel，渲染进 body 覆盖物容器；
       外壳边框/阴影/定位归 popover-shell；样式与 select 下拉面板同款，ADR-0027 决策 9 ══════════ */
    .asc-autocomplete-panel {
      display: block;
      min-width: 100%;
      font-size: var(--auto-font-size, var(--asc-autocomplete-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-autocomplete-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-autocomplete-panel-color, #333333));
    }
    .asc-autocomplete-list {
      max-height: var(--asc-autocomplete-max-height, 15em);
      overflow-y: auto;
      padding: 0.25em 0;
      box-sizing: border-box;
    }
    /* 建议项：行式热区；悬停/高亮/禁用态经 data-* 属性选择器驱动（绑定通道写属性——
       假值整个移除即无态，绑定语义天然契合） */
    .asc-autocomplete-option {
      display: flex;
      align-items: center;
      gap: 0.4em;
      min-height: 2.2em;
      padding: 0.3em 0.75em;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .asc-autocomplete-option-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .asc-autocomplete-option[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-autocomplete-option-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-autocomplete-option[data-disabled] {
      color: var(--auto-disable-color, var(--asc-autocomplete-option-disabled, rgba(0, 0, 0, 0.28)));
      cursor: not-allowed;
      background: transparent;
    }
    .asc-autocomplete-option[data-disabled]:hover {
      background: transparent;
    }
    .asc-autocomplete-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-autocomplete-empty, rgba(0, 0, 0, 0.35)));
    }
    [dark] .asc-autocomplete-panel,
    [data-dark] .asc-autocomplete-panel {
      color: var(--auto-color, var(--asc-autocomplete-panel-color, #fafafa));
    }
    [dark] .asc-autocomplete-option[data-active],
    [data-dark] .asc-autocomplete-option[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-autocomplete-option-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-autocomplete-option[data-disabled],
    [data-dark] .asc-autocomplete-option[data-disabled] {
      color: var(--auto-disable-color, var(--asc-autocomplete-option-disabled, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-autocomplete-empty,
    [data-dark] .asc-autocomplete-empty {
      color: var(--auto-third-color, var(--asc-autocomplete-empty, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <span
    class="asc-autocomplete-trigger"
    x-popover:autospark-autocomplete-panel
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
  >
    <input
      class="asc-autocomplete-native"
      data-autospark-control
      type="text"
      role="combobox"
      aria-haspopup="listbox"
      aria-autocomplete="list"
      :aria-expanded="open ? 'true' : 'false'"
      :placeholder="placeholder || (t('autocomplete.placeholder') === 'autocomplete.placeholder' ? '请输入' : t('autocomplete.placeholder'))"
      @keydown="onInputKeydown($event)"
    />
  </span>
  <i
    class="asc-autocomplete-action asc-autocomplete-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i
    class="asc-autocomplete-action asc-autocomplete-loading"
    x-if="loading"
    x-icon="'loading'"
  ></i>
</span>
`,Wo=`<div class="asc-autocomplete-panel" x-define="autospark-autocomplete-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-autocomplete-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
            const scrollActive = () => {
                const el = this.el.querySelector(".asc-autocomplete-option[data-active]");
                el?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(scrollActive, 0);
            this.watch("activeValue", () => { setTimeout(scrollActive, 0); });
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <div class="asc-autocomplete-list" x-loading="loading">
    <template x-for="option of items" :key="option.value">
      <div
        class="asc-autocomplete-option"
        x-bind:data-active="activeValue != null && String(option.value) === String(activeValue)"
        x-bind:data-disabled="!!option.disabled"
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"
        x-on:mouseenter="hoverTick = hoverTick + 1, hoverValue = option.value"
      >
        <span class="asc-autocomplete-option-label" x-text="option.label"></span>
      </div>
    </template>
    <div
      class="asc-autocomplete-empty"
      x-if="!loading && !(items && items.length > 0)"
      x-text="t('autocomplete.empty') === 'autocomplete.empty' ? '暂无建议' : t('autocomplete.empty')"
    ></div>
  </div>
</div>
`,Go=`autospark.autocomplete`,Ko=`autospark-autocomplete-panel`,qo=new Set([`disabled`,`readonly`,`clearable`]);function Jo(e){e.components[Go]=Uo,e.components[Ko]=Wo,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-autocomplete`))){let e=document.createElement(`span`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):r.value===``&&qo.has(r.name)?n.push(`${Q(Z(r.name))}: true`):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Go}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Yo();function Yo(){y(e=>{m(e),Jo(e)})}var Xo=`<nav\r
  class="asc-breadcrumb"\r
  x-define="autospark.breadcrumb"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],
            separator: "/",
        }),\r
        mounted() {\r
            const raw = this.el.getAttribute("data-items");\r
            if ((!this.data.items || !this.data.items.length) && raw) {\r
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空路径） */ }\r
                this.el.removeAttribute("data-items");\r
            }\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-breadcrumb">\r
    .asc-breadcrumb {\r
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012）；\r
         缺省文案色为次要色（路径导航的视觉降噪惯例），当前页项另覆正文色 */\r
      display: inline-flex;\r
      max-width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-breadcrumb-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, 1.5);\r
      color: var(--auto-secondary-color, var(--asc-breadcrumb-color, rgba(0, 0, 0, 0.55)));\r
    }\r
    .asc-breadcrumb-list {\r
      display: flex;\r
      flex-wrap: wrap;\r
      align-items: center;\r
      list-style: none;\r
      margin: 0;\r
      padding: 0;\r
      min-width: 0;\r
    }\r
    .asc-breadcrumb-item {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      min-width: 0;\r
    }\r
    .asc-breadcrumb-link {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      min-width: 0;\r
      color: var(--auto-primary-color, var(--asc-breadcrumb-link, #009aff));\r
      text-decoration: none;\r
      cursor: pointer;\r
      transition: color 0.15s ease, filter 0.15s ease;\r
    }\r
    .asc-breadcrumb-link:hover {\r
      filter: brightness(0.9);\r
    }\r
    .asc-breadcrumb-current {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      min-width: 0;\r
      color: var(--auto-color, var(--asc-breadcrumb-current, #606060));\r
    }\r
    .asc-breadcrumb-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
    }\r
    .asc-breadcrumb-sep {\r
      display: inline-flex;\r
      align-items: center;\r
      color: var(--auto-third-color, var(--asc-breadcrumb-sep, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-breadcrumb-item:last-child .asc-breadcrumb-sep {\r
      display: none;\r
    }\r
\r
    [dark] .asc-breadcrumb,\r
    [data-dark] .asc-breadcrumb {\r
      color: var(--auto-secondary-color, var(--asc-breadcrumb-color, rgba(255, 255, 255, 0.65)));\r
    }\r
    [dark] .asc-breadcrumb-link,\r
    [data-dark] .asc-breadcrumb-link {\r
      color: var(--auto-primary-color, var(--asc-breadcrumb-link, #56baff));\r
    }\r
    [dark] .asc-breadcrumb-current,\r
    [data-dark] .asc-breadcrumb-current {\r
      color: var(--auto-color, var(--asc-breadcrumb-current, #fafafa));\r
    }\r
    [dark] .asc-breadcrumb-sep,\r
    [data-dark] .asc-breadcrumb-sep {\r
      color: var(--auto-third-color, var(--asc-breadcrumb-sep, rgba(255, 255, 255, 0.45)));\r
    }\r
  </style>\r
  <ol class="asc-breadcrumb-list" x-for="item of items" :key="item.label">\r
    <li class="asc-breadcrumb-item">\r
      <a class="asc-breadcrumb-link" x-show="item.href" :href="item.href" :aria-current="$index === items.length - 1 ? 'page' : null">\r
        <i class="asc-breadcrumb-icon" x-show="item.icon" x-icon="item.icon"></i>\r
        <span class="asc-breadcrumb-label">{{ item.label }}</span>\r
      </a>\r
      <span class="asc-breadcrumb-current" x-show="!item.href" :aria-current="$index === items.length - 1 ? 'page' : null">\r
        <i class="asc-breadcrumb-icon" x-show="item.icon" x-icon="item.icon"></i>\r
        <span class="asc-breadcrumb-label">{{ item.label }}</span>\r
      </span>\r
      <span class="asc-breadcrumb-sep" aria-hidden="true">\r
        <i class="asc-breadcrumb-sep-icon" x-show="separator === 'arrow'" x-icon="'arrow'"></i>\r
        <span class="asc-breadcrumb-sep-text" x-show="separator !== 'arrow'">{{ separator }}</span>\r
      </span>\r
    </li>\r
  </ol>\r
</nav>\r
`,Zo=`autospark.breadcrumb`;function Qo(e){e.components[Zo]=Xo,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-breadcrumb`))){let e=document.createElement(`nav`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-breadcrumb-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={label:e.getAttribute(`label`)??``},n=e.getAttribute(`href`);n!=null&&(t.href=n);let r=e.getAttribute(`icon`);return r!=null&&(t.icon=r),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${Zo}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}$o();function $o(){y(e=>{m(e),Qo(e)})}var es=`<div\r
  class="asc-tabs"\r
  x-define="autospark.tabs"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: "",
            items: [],
            variant: "line",
        }),\r
        methods: {\r
            onTabClick(item) {\r
                if (!item || item.disabled) return;\r
                const k = String(item.key ?? "");\r
                if (k === "" || k === String(this.data.value ?? "")) return;\r
                this.data.value = k;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: k } }));\r
            },\r
        },\r
        mounted() {\r
            const raw = this.el.getAttribute("data-items");\r
            if ((!this.data.items || !this.data.items.length) && raw) {\r
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }\r
                this.el.removeAttribute("data-items");\r
            }\r
\r
            const prior = this.el.value;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(this.data.value ?? ""),\r
                set: (v) => { this.data.value = String(v ?? ""); },\r
                configurable: true,\r
            });\r
\r
            setTimeout(() => {\r
                if (!this.data.value && typeof prior === "string" && prior !== "") {\r
                    this.data.value = prior;\r
                }\r
                if (!this.data.value) {\r
                    const first = (this.data.items || []).find((it) => it && it.key != null && String(it.key) !== "" && !it.disabled);\r
                    if (first) this.data.value = String(first.key);\r
                }\r
            }, 0);\r
\r
            this.el.addEventListener("keydown", (e) => {\r
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;\r
                const t = e.target instanceof Element ? e.target : null;\r
                const tab = t ? t.closest(".asc-tabs-tab") : null;\r
                if (!tab || !this.el.contains(tab)) return;\r
                e.preventDefault();\r
                const tabs = Array.from(this.el.querySelectorAll(".asc-tabs-tab")).filter((b) => !b.disabled);\r
                if (!tabs.length) return;\r
                const idx = tabs.indexOf(tab);\r
                let next = 0;\r
                if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;\r
                else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;\r
                else if (e.key === "Home") next = 0;\r
                else next = tabs.length - 1;\r
                tabs[next].focus();\r
                tabs[next].click();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-tabs">\r
    .asc-tabs {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-tabs-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, 1.5);\r
    }\r
\r
    .asc-tabs-bar {\r
      display: flex;\r
      align-items: stretch;\r
      max-width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-tabs-tab {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tabs-primary, #009aff));\r
      appearance: none;\r
      border: none;\r
      background: transparent;\r
      font: inherit;\r
      line-height: inherit;\r
      color: var(--auto-secondary-color, var(--asc-tabs-tab-color, rgba(0, 0, 0, 0.55)));\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      padding: 0.5em 1em;\r
      margin: 0;\r
      cursor: pointer;\r
      position: relative;\r
      white-space: nowrap;\r
      transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;\r
    }\r
    .asc-tabs-tab:focus-visible {\r
      outline: none;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-focus-radius, 0.25em));\r
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);\r
    }\r
    .asc-tabs-tab:disabled {\r
      color: var(--auto-disable-color, var(--asc-tabs-disable-color, rgba(0, 0, 0, 0.25)));\r
      cursor: not-allowed;\r
    }\r
    .asc-tabs-tab-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      max-width: 100%;\r
    }\r
\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-bar {\r
      border-bottom: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab::after {\r
      content: "";\r
      position: absolute;\r
      left: 0;\r
      right: 0;\r
      bottom: calc(-1 * var(--auto-border-size, var(--asc-tabs-border-size, 1px)));\r
      height: 2px;\r
      background: var(--asc-tone);\r
      transform: scaleX(0);\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tone);\r
      font-weight: var(--x-font-weight-large, 600);
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active]::after {\r
      transform: scaleX(1);\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--asc-tone);\r
    }\r
\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-bar {\r
      border-bottom: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab {\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid transparent;\r
      border-bottom: none;\r
      border-radius: 0.375em 0.375em 0 0;\r
      margin-bottom: calc(-1 * var(--auto-border-size, var(--asc-tabs-border-size, 1px)));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--asc-tone);\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(0, 0, 0, 0.04)));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tone);\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #ffffff));\r
      border-color: var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
      position: relative;\r
      z-index: 1;
    }\r
\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar {\r
      display: inline-flex;\r
      gap: 0.125em;\r
      padding: 0.1875em;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-seg-radius, 0.5em));\r
      background: var(--auto-secondary-bgcolor, var(--asc-tabs-seg-bg, rgba(245, 245, 245, 0.45)));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab {\r
      padding: 0.3125em 0.875em;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-seg-tab-radius, 0.375em));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--auto-color, var(--asc-tabs-color, #606060));\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(0, 0, 0, 0.04)));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tabs-seg-ink, #ffffff);\r
      background: var(--asc-tone);\r
    }\r
\r
    .asc-tabs-content {\r
      padding: 0.75em 0.125em;\r
    }\r
    .asc-tabs-content:empty {\r
      display: none;\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-content {\r
      padding: var(--asc-tabs-content-pad, 0.8em 1em);\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
      border-top: none;\r
      border-radius: 0 0 0.375em 0.375em;\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #ffffff));\r
    }\r
\r
    [dark] .asc-tabs-tab,\r
    [data-dark] .asc-tabs-tab {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tabs-primary, #56baff));\r
      color: var(--auto-secondary-color, var(--asc-tabs-tab-color, rgba(255, 255, 255, 0.65)));\r
    }\r
    [dark] .asc-tabs-tab:disabled,\r
    [data-dark] .asc-tabs-tab:disabled {\r
      color: var(--auto-disable-color, var(--asc-tabs-disable-color, rgba(255, 255, 255, 0.25)));\r
    }\r
    [dark] .asc-tabs-body[data-variant="line"] .asc-tabs-bar,\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="line"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-bar {\r
      border-bottom-color: var(--auto-border-color, var(--asc-tabs-border, #52525b));\r
    }\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(255, 255, 255, 0.08)));\r
    }\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--auto-color, var(--asc-tabs-color, #fafafa));\r
    }\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active],\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-content,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active],\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-content {\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #3a3a3a));\r
      border-color: var(--auto-border-color, var(--asc-tabs-border, #52525b));\r
    }\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar {\r
      background: var(--auto-secondary-bgcolor, var(--asc-tabs-seg-bg, rgba(129, 129, 129, 0.45)));\r
    }\r
  </style>\r
  <div class="asc-tabs-body" :data-variant="variant">\r
    <div class="asc-tabs-bar" role="tablist" x-for="item of items" :key="item.key">\r
      <button\r
        type="button"\r
        class="asc-tabs-tab"\r
        role="tab"\r
        :data-active="String(item.key) === String(value) ? '' : null"\r
        :aria-selected="String(item.key) === String(value) ? 'true' : 'false'"\r
        :tabindex="String(item.key) === String(value) ? '0' : '-1'"\r
        :disabled="item.disabled"\r
        @click="onTabClick(item)"\r
      >\r
        <i class="asc-tabs-tab-icon" x-show="item.icon" x-icon="item.icon"></i>\r
        <span class="asc-tabs-tab-label">{{ item.label }}</span>\r
      </button>\r
    </div>\r
    <div class="asc-tabs-content" x-slot></div>\r
  </div>\r
</div>\r
`,ts=`autospark.tabs`;function ns(e){e.components[ts]=es,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-tabs`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-tab`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);return n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${ts}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}rs();function rs(){y(e=>{m(e),ns(e)})}var is=`<div
  class="asc-menu"
  x-define="autospark.menu"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: "",
            items: [],
            expandLevel: 1,
            popLevel: 0,
            openKeys: {},
            collapsed: false,
            trigger: "hover",
            mode: "vertical",
            slotDir: "vertical",
            width: 200,
            collapsedWidth: 48,
            tree: [],
            openView: {},
            activeKey: "",
            markedMap: {},
            wantFocusAt: 0,
            // 生效宽度（px 数值；0 = 自适应填充父容器 / 水平模式不适用）：仅正有限数生效，
            // 否则展开态回落自适应、折叠态回落 48（折叠态必须窄）
            effWidth: (s) => {
                if (s.mode === "horizontal") return 0;
                const fold = !!s.collapsed;
                const raw = fold ? s.collapsedWidth : s.width;
                return typeof raw === "number" && isFinite(raw) && raw > 0 ? raw : fold ? 48 : 0;
            },
            // 宽度 inline（0 = 不写，回落样式表 width:100%）——落内层 body：模板根动态绑定不求值
            boxStyle: (s) => (s.effWidth > 0 ? { width: s.effWidth + "px" } : null),
            // 激活项（影子树条目引用；数组勾选形态 / 未激活为 null）
            activeItem: (s) => {
                if (s.activeKey === "") return null;
                let found = null;
                const walk = (list) => {
                    for (const e of list) {
                        if (found) return;
                        if (e.kind === "item" && e.key === s.activeKey) {
                            found = e;
                            return;
                        }
                        if (e.kids && e.kids.length) walk(e.kids);
                    }
                };
                walk(s.tree || []);
                return found;
            },
            // 激活项祖先链（根 → 自身；未激活为空数组）
            activePath: (s) => {
                const path = [];
                if (s.activeKey === "") return path;
                const walk = (list) => {
                    for (const e of list) {
                        if (e.kind !== "item") continue;
                        path.push(e);
                        if (e.key === s.activeKey) return true;
                        if (e.kids && e.kids.length && walk(e.kids)) return true;
                        path.pop();
                    }
                    return false;
                };
                return walk(s.tree || []) ? path : [];
            },
            // 插槽形参（作用域插槽）：header / footer 出口全集，调用方按需解构（只读）
            slotParams: (s) => ({
                collapsed: !!s.collapsed,
                width: s.effWidth,
                activeKey: s.activeKey,
                activeItem: s.activeItem,
                activePath: s.activePath,
                mode: s.mode,
                value: s.value,
                items: s.items,
                openKeys: s.openKeys,
                expandLevel: s.expandLevel,
                popLevel: s.popLevel,
                trigger: s.trigger,
                slotDir: s.slotDir,
            }),
        }),
        methods: {
            normalize(list, parentDisabled) {
                const raw = Array.isArray(list) ? list.filter((x) => x != null) : [];
                const entries = [];
                for (const entry of raw) {
                    if (entry === "-" || (entry && entry.type === "separator")) {
                        entries.push({ kind: "sep" });
                        continue;
                    }
                    if (entry && entry.type === "group") {
                        entries.push({ kind: "group", title: String(entry.title ?? ""), icon: entry.icon ?? "" });
                        continue;
                    }
                    const it = entry && typeof entry === "object" ? entry : {};
                    const kidsRaw = Array.isArray(it.children)
                        ? it.children
                        : (it.children && Array.isArray(it.children.children) ? it.children.children : []);
                    const conf = Array.isArray(it.children) ? {} : (it.children ?? {});
                    const disabled = !!it.disabled || !!parentDisabled;
                    const key = it.key == null ? null : String(it.key);
                    if (key == null && (kidsRaw.length > 0 || it.checkable) && typeof console !== "undefined") {
                        console.warn("[autospark.menu] 无 key 的项不可被 value/openKeys 引用：", it.label ?? it);
                    }
                    entries.push({ ...it, kind: "item", key, disabled, kids: this.normalize(kidsRaw, disabled), conf });
                }
                const items = entries.filter((e) => e.kind === "item");
                const hasIcon = items.some((e) => !!e.icon);
                const hasCheck = items.some((e) => !!e.checkable);
                for (const e of entries) {
                    if (e.kind !== "item") continue;
                    e.iconPh = hasIcon && !e.icon;
                    e.checkPh = hasCheck;
                }
                while (entries.length && entries[0].kind === "sep") entries.shift();
                while (entries.length && entries[entries.length - 1].kind === "sep") entries.pop();
                return entries;
            },
            // 弹层起始层级：折叠态（垂直 = 子级全弹层）与水平模式（子级全弹层）恒为 1
            popFromNow() {
                if (this.data.collapsed || this.data.mode === "horizontal") return 1;
                const pl = Number(this.data.popLevel);
                return pl > 0 ? pl + 1 : Infinity;
            },
            recomputeView() {
                const open = this.data.openKeys ?? {};
                const popFrom = this.popFromNow();
                const view = {};
                const walk = (list, depth) => {
                    for (const e of list) {
                        if (e.kind !== "item") { e._fold = false; e._pop = false; e._leaf = false; continue; }
                        const hasKids = !!(e.kids && e.kids.length);
                        e._fold = hasKids && depth < popFrom;
                        e._pop = hasKids && depth >= popFrom;
                        e._leaf = !hasKids;
                        if (!hasKids || e.key == null) continue;
                        view[e.key] = e.key in open ? !!open[e.key] : depth <= Number(this.data.expandLevel ?? 1);
                        e._open = !!view[e.key];
                        walk(e.kids, depth + 1);
                    }
                };
                walk(this.data.tree || [], 1);
                this.data.openView = view;
            },
            recomputeMarks() {
                const v = this.data.value;
                const tree = this.data.tree || [];
                if (Array.isArray(v)) {
                    this.data.activeKey = "";
                    const m = {};
                    for (const k of v) m[String(k)] = true;
                    this.data.markedMap = m;
                    const walk = (list) => {
                        for (const e of list) {
                            if (e.kind !== "item") continue;
                            e._marked = !!m[e.key];
                            e._active = false;
                            if (e.kids && e.kids.length) walk(e.kids);
                        }
                    };
                    walk(tree);
                } else {
                    const active = v == null ? "" : String(v);
                    this.data.activeKey = active;
                    this.data.markedMap = {};
                    const walk = (list) => {
                        for (const e of list) {
                            if (e.kind !== "item") continue;
                            e._active = e.key != null && e.key === active && active !== "";
                            e._marked = false;
                            if (e.kids && e.kids.length) walk(e.kids);
                        }
                    };
                    walk(tree);
                }
            },
            findItem(key) {
                if (key == null) return null;
                const target = String(key);
                let found = null;
                const walk = (list) => {
                    for (const e of list) {
                        if (found) return;
                        if (e.kind === "item" && e.key === target) { found = e; return; }
                        if (e.kids && e.kids.length) walk(e.kids);
                    }
                };
                walk(this.data.tree || []);
                return found;
            },
            onRelay(event) {
                const d = event.detail || {};
                if (d.kind === "toggle") this.onToggle(d.key);
                else if (d.kind === "pick") this.onPick(d.key);
            },
            closeAllPanels() {
                document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            onPick(key) {
                const item = this.findItem(key);
                if (!item || item.disabled) return;
                if (Array.isArray(this.data.value)) {
                    if (!item.checkable || item.key == null) return;
                    const arr = (this.data.value || []).map(String);
                    const next = arr.indexOf(item.key) >= 0 ? arr.filter((k) => k !== item.key) : arr.concat(item.key);
                    this.data.value = next;
                    this.recomputeMarks();
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));
                    this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));
                    return;
                }
                if (item.kids.length || item.key == null || item.key === String(this.data.value ?? "")) return;
                this.data.value = item.key;
                this.recomputeMarks();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: item.key } }));
                this.closeAllPanels();
            },
            onToggle(key) {
                if (key == null) return;
                const open = { ...(this.data.openKeys ?? {}) };
                // 目标态按当前**实际**展开态取反：openKeys 未覆盖的项其展开态来自 expandLevel
                // 默认、不在 openKeys 里——按原值取反会把「默认展开」误判成「要展开」（首次点击无效）
                const current = key in open ? !!open[key] : !!this.data.openView[key];
                const expanded = !current;
                // 显式三态：收起写 false（不 delete）——删键会落入 recomputeView 的 expandLevel
                // 回退分支，depth ≤ expandLevel 的父项收不起
                open[key] = expanded;
                this.data.openKeys = open;
                this.el.dispatchEvent(new CustomEvent("expand", { bubbles: true, detail: { key, expanded } }));
            },
            expandTo(key) {
                const target = String(key ?? "");
                if (target === "" || Array.isArray(this.data.value)) return;
                let chain = null;
                const walk = (list, parents) => {
                    for (const e of list) {
                        if (chain) return true;
                        if (e.kind !== "item") continue;
                        if (e.key === target && !e.kids.length) { chain = parents.slice(); return true; }
                        if (e.kids.length && walk(e.kids, parents.concat(e.key))) return true;
                    }
                    return false;
                };
                if (!walk(this.data.tree || [], [])) return;
                const open = { ...(this.data.openKeys ?? {}) };
                let dirty = false;
                for (const k of chain) {
                    if (!open[k]) { open[k] = true; dirty = true; }
                }
                if (dirty) this.data.openKeys = open;
            },
            onKeydown(event) {
                const k = event.key;
                if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
                const btn = event.target && event.target.closest ? event.target.closest(".asc-menu-entry > .asc-button") : null;
                const currentEntry = btn ? btn.closest(".asc-menu-entry") : null;
                const focusables = (list) => Array.from(list.querySelectorAll(":scope > .asc-menu-entry > .asc-button:not([disabled])"));
                if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
                    const list = currentEntry ? currentEntry.parentElement : this.el.querySelector(".asc-menu-list");
                    const arr = list ? focusables(list) : [];
                    if (!arr.length) return;
                    event.preventDefault();
                    let next = null;
                    if (k === "Home") next = arr[0];
                    else if (k === "End") next = arr[arr.length - 1];
                    else {
                        const i = arr.indexOf(btn);
                        const dir = k === "ArrowDown" ? 1 : -1;
                        next = i < 0 ? arr[0] : arr[(i + dir + arr.length) % arr.length];
                    }
                    if (next) next.focus();
                    return;
                }
                if (!btn || !currentEntry) return;
                if (k === "ArrowRight") {
                    const mode = currentEntry.getAttribute("data-mode");
                    if (mode === "fold") {
                        event.preventDefault();
                        const pkey = currentEntry.getAttribute("data-key");
                        if (pkey && !this.data.openView[pkey]) this.onToggle(pkey);
                        setTimeout(() => {
                            const first = currentEntry.querySelector(".asc-menu-sub .asc-menu-entry > .asc-button:not([disabled])");
                            if (first) first.focus();
                        }, 0);
                        return;
                    }
                    if (mode === "pop") {
                        event.preventDefault();
                        this.openPophost(currentEntry);
                        this.data.wantFocusAt = Date.now();
                    }
                    return;
                }
                const sub = currentEntry.closest(".asc-menu-sub");
                if (sub) {
                    event.preventDefault();
                    const parentEntry = sub.closest(".asc-menu-entry");
                    const pkey = parentEntry ? parentEntry.getAttribute("data-key") : null;
                    if (pkey && this.data.openView[pkey]) this.onToggle(pkey);
                    const pbtn = parentEntry ? parentEntry.querySelector(":scope > .asc-button") : null;
                    if (pbtn) pbtn.focus();
                }
            },
            openPophost(popEl) {
                if (String(this.data.trigger) === "click") {
                    popEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    popEl.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
                }
            },
        },
        mounted() {

            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            this.data.tree = this.normalize(this.data.items, false);
            this.recomputeMarks();
            this.recomputeView();

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => (Array.isArray(this.data.value) ? this.data.value.join(",") : String(this.data.value ?? "")),
                set: (v) => {
                    this.data.value = String(v ?? "");
                    this.recomputeMarks();
                    this.expandTo(v);
                },
                configurable: true,
            });

            setTimeout(() => {
                if ((this.data.value === "" || this.data.value == null) && typeof prior === "string" && prior !== "") {
                    this.data.value = prior;
                }
                this.recomputeMarks();
                this.expandTo(this.data.value);
            }, 0);

            this.watch("items", () => {
                this.data.tree = this.normalize(this.data.items, false);
                this.recomputeMarks();
                this.recomputeView();
            });
            this.watch("value", () => {
                this.recomputeMarks();
                this.expandTo(this.data.value);
            });
            this.watch("openKeys", () => { this.recomputeView(); });
            this.watch("expandLevel", () => { this.recomputeView(); });
            this.watch("popLevel", () => { this.recomputeView(); });
            this.watch("collapsed", () => { this.recomputeView(); });
            this.watch("mode", () => { this.recomputeView(); });
        },
    }
  <\/script>
  <style global id="autospark-components-menu">
    .asc-menu {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-menu-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-menu-body {
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #009aff));
      display: flex;
      flex-direction: column;
      outline: none;
      min-width: 0;
      transition: width 0.2s ease;
    }
    .asc-menu-body:focus-visible {
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    .asc-menu-header,
    .asc-menu-footer {
      padding: 0.4em 0.25em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      min-width: 0;
    }
    /* 垂直折叠态：header/footer 保留（可经插槽形参切换内容）并裁剪溢出——只在分区上裁，
       根上裁会连带裁掉子树内定位的弹层 */
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-header,
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-footer {
      overflow: hidden;
    }
    .asc-menu-slot {
      display: block;
      min-width: 0;
    }
    .asc-menu-main {
      min-width: 0;
    }

    .asc-menu-list {
      list-style: none;
      margin: 0;
      padding: 0;
      min-width: 0;
    }
    .asc-menu-entry {
      position: relative;
      min-width: 0;
    }
    .asc-menu-sep {
      margin: 0.35em 0.75em;
      border-top: var(--auto-border-size, var(--asc-menu-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-menu-border, #f0f0f0));
    }
    .asc-menu-group {
      display: flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.6em 0.75em 0.25em;
      font-size: 0.85em;
      color: var(--auto-third-color, var(--asc-menu-aux-color, rgba(0, 0, 0, 0.35)));
      white-space: nowrap;
    }
    /* 折叠态：分组标题只留图标，无图标的整标题不渲染（文字在图标列里无处安放） */
    .asc-menu-body[data-collapsed] .asc-menu-group-title {
      display: none;
    }
    .asc-menu-body[data-collapsed] .asc-menu-group:not([data-icon]) {
      display: none;
    }
    .asc-menu-group-icon {
      display: inline-flex;
      flex: none;
    }
    .asc-menu-group-title {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* button 化身载体是 div（content-box，异于 <button> 的 UA border-box）：block 的
       width:100% 须含 padding 与边框，否则每行撑出菜单宽度一个内边距的量 */
    .asc-menu-entry > .asc-button {
      box-sizing: border-box;
    }
    .asc-menu-entry[data-active] > .asc-button {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-large, 600);
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    /* 勾选项（数组形态，checkMark 占位列的显影——button 自有 ✓ 规则需 asc-marked 类，
       menu 侧经 entry 标记命中，不经 class 通道） */
    .asc-menu-entry[data-marked] > .asc-button.asc-check-check > .asc-button-body::before {
      content: "✓";
    }
    /* 图标占位列：仅展开态隐藏（同级图标对齐）；折叠态只剩图标列，占位图标须可见 */
    .asc-menu-body:not([data-collapsed]) .asc-menu-entry[data-icon-ph] > .asc-button .asc-button-icon {
      visibility: hidden;
    }
    /* 折叠态：激活 / 勾选 = 图标染激活色（label 不在场，仅此一处可表达） */
    .asc-menu-body[data-collapsed] .asc-menu-entry[data-active] > .asc-button .asc-button-icon,
    .asc-menu-body[data-collapsed] .asc-menu-entry[data-marked] > .asc-button .asc-button-icon {
      color: var(--asc-tone);
      visibility: visible;
    }

    .asc-menu-subwrap {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.2s ease;
    }
    .asc-menu-subwrap[data-open] {
      grid-template-rows: 1fr;
    }
    .asc-menu-subwrap > .asc-menu-sub {
      overflow: hidden;
      min-height: 0;
      /* 子级缩进基准 = 父项内容起点：1.5em 使子项文字与父项图标列起点对齐，逐级累计 */
      padding-inline-start: var(--asc-menu-indent, 1.5em);
    }

    .asc-menu-body[data-mode="horizontal"] {
      flex-direction: column;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-list {
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      row-gap: 0.125em;
      column-gap: 0.125em;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-entry + .asc-menu-entry {
      margin-left: 0.125em;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-sep {
      margin: 0.35em 0.25em;
      border-top: none;
      border-left: var(--auto-border-size, var(--asc-menu-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-menu-border, #f0f0f0));
      align-self: stretch;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-group {
      align-items: center;
      padding: 0.6em 0.5em 0.25em;
    }

    .asc-menu-body[data-slot-dir="horizontal"] {
      flex-direction: row;
      align-items: stretch;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-header {
      order: 0;
      align-self: center;
      padding-inline: 0.5em;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-main {
      order: 1;
      flex: 1 1 auto;
      min-width: 0;
    }
    .asc-menu-body[data-slot-dir="horizontal"] > .asc-menu-footer {
      order: 2;
      align-self: center;
      padding-inline: 0.5em;
    }

    .asc-menu-panel {
      min-width: max-content;
      max-width: 18em;
      font-size: var(--auto-font-size, var(--asc-menu-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      color: var(--auto-color, var(--asc-menu-color, #606060));
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #009aff));
      outline: none;
    }

    [dark] .asc-menu-body,
    [data-dark] .asc-menu-body {
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #56baff));
    }
    [dark] .asc-menu .asc-menu-entry > .asc-button,
    [data-dark] .asc-menu .asc-menu-entry > .asc-button {
      color: var(--auto-color, var(--asc-menu-color, #fafafa));
    }
    [dark] .asc-menu-sep,
    [data-dark] .asc-menu-sep {
      border-color: var(--auto-border-color, var(--asc-menu-border, #52525b));
    }
    [dark] .asc-menu-group,
    [dark] .asc-menu-header,
    [dark] .asc-menu-footer,
    [dark] .asc-menu-panel,
    [data-dark] .asc-menu-group,
    [data-dark] .asc-menu-header,
    [data-dark] .asc-menu-footer,
    [data-dark] .asc-menu-panel {
      color: var(--auto-color, var(--asc-menu-color, #fafafa));
    }
  </style>
  <div
    class="asc-menu-body"
    :data-mode="mode"
    :data-collapsed="!!collapsed ? '' : null"
    :data-slot-dir="!!collapsed && mode !== 'horizontal' ? 'vertical' : slotDir"
    :style="boxStyle"
    tabindex="0"
    @keydown="onKeydown($event)"
    @menu-relay="onRelay($event)"
  >
    <div class="asc-menu-header">
      <div class="asc-menu-slot" x-slot:header="slotParams"></div>
    </div>
    <div class="asc-menu-main">
      <div
        x-component:autospark-menu-node="{
            list: tree,
            depth: 1,
            mode: mode,
            trigger: trigger,
            collapsed: !!collapsed,
            effWidth: effWidth
        }"
      ></div>
    </div>
    <div class="asc-menu-footer">
      <div class="asc-menu-slot" x-slot:footer="slotParams"></div>
    </div>
  </div>
</div>
`,as=`<!--
    autospark.menu 级列表渲染节点（autospark-menu-node，ADR-0033 决策 7·2026-11-24 重写）：
    三分支（fold / pop / leaf，每项 3 个 button 化身）收敛为**单项单实例**结构——
    div.asc-menu-entry 四职合一：缩进 / 状态标记 / 点击中继 / 弹层宿主。

    - 弹层模式（item._pop）：entry 即 x-popover 宿主，options 经 spread 合并
      \`{ 基座, ...(item.conf || {}) }\`（item.conf 的 popover 键显式赢——chrome/at/trigger 逐级覆盖），
      props 注入 \`{ submenu: { children: item.kids, ...conf }, effWidth, collapsed, mode }\`
      （2026-11-24 实测：props 对象包数组完好、面板内 x-component 正常，链读废弃）；
    - 缩进模式（item._fold）：entry > subwrap > sub > 递归 node（grid 0fr/1fr 展开动画）；
    - 叶子：entry 单按钮。三态经 :data-mode 表达，popover 的 disabled 门禁
      （\`disabled: !item._pop\`）关闭缩进模式的弹层触发——弹层宿主恒挂、触发按态分派。

    点击经 onEntryClick 风格的中继表达式沿链写 relay 哨兵（落最近声明层 = 宿主 node data，
    node mounted watch → menu-relay 冒泡 → menu 本体）。克隆体求值域：绑定 / 事件 / 值对象
    只能读 x-for locals（item）与自身 props。
-->
<div class="asc-menu-node" x-define.open="autospark-menu-node">
  <script setup>
    {
        data: () => ({
            list: [],
            depth: 1,
            mode: "vertical",
            trigger: "hover",
            collapsed: false,
            effWidth: 0,
            relayTick: 0,
            relayKey: null,
            relayKind: "",
        }),
        methods: {
            /**
             * 单项点击中继（冒泡隔离）：仅响应**本 entry 自身按钮**的点击——后代 entry
             * 的点击（嵌套缩进 / 弹层项）会冒泡穿过本 entry，closest 判定不等即忽略，
             * 防祖先误 toggle。弹层模式（item._pop）的开关归 popover click toggle。
             */
            onEntryClick(item, e) {
                const btnEntry = e.target instanceof Element ? e.target.closest(".asc-menu-entry") : null;
                if (!btnEntry || btnEntry !== e.currentTarget) return;
                if (item._pop) return;
                this.data.relayKey = item.key;
                this.data.relayKind = item.kids && item.kids.length ? "toggle" : "pick";
                this.data.relayTick = this.data.relayTick + 1;
            },
        },
        mounted() {
            this.watch("relayTick", () => {
                this.el.dispatchEvent(new CustomEvent("menu-relay", {
                    bubbles: true,
                    detail: { key: this.data.relayKey, kind: this.data.relayKind },
                }));
            });
        },
    }
  <\/script>
  <div class="asc-menu-list" role="menu" x-for="item of list">
    <div class="asc-menu-sep" x-show="item.kind === 'sep'" role="separator"></div>
    <div class="asc-menu-group" x-show="item.kind === 'group'" :data-icon="item.icon ? '' : null" role="group">
      <i class="asc-menu-group-icon" x-show="item.icon" x-icon="item.icon"></i>
      <span class="asc-menu-group-title">{{ item.title }}</span>
    </div>
    <div
      class="asc-menu-entry"
      x-show="item.kind === 'item'"
      role="menuitem"
      :data-key="item.key != null ? String(item.key) : null"
      :data-mode="item._pop ? 'pop' : (item._fold ? 'fold' : 'leaf')"
      :data-active="item._active ? '' : null"
      :data-marked="item._marked ? '' : null"
      :data-disabled="item.disabled ? '' : null"
      :data-icon-ph="item.iconPh ? '' : null"
      :aria-expanded="item._fold ? (item._open ? 'true' : 'false') : null"
      :aria-disabled="item.disabled ? 'true' : null"
      :aria-haspopup="item._pop ? 'menu' : null"
      @click="onEntryClick(item, $event)"
      x-popover:autospark-menu-panel
      x-popover-options="{ padding: 0, trigger: trigger, at: { arrow: false, offset: 4, placement: (mode === 'horizontal' && depth === 1) ? 'bottom-start' : 'right-start' }, disabled: !item._pop, ...(item.conf || {}) }"
      x-popover-options.props="{ submenu: { ...(item.conf || {}), children: item.kids }, effWidth: effWidth, collapsed: !!collapsed, mode: mode }"
    >
      <div
        x-component:autospark.button="{
            block: true,
            menu: !collapsed,
            collapsed: !!collapsed,
            label: item.label,
            icon: item.iconPh ? 'default' : (item.icon || ''),
            disabled: item.disabled,
            caret: collapsed ? 'none' : (item._pop ? ((mode === 'horizontal' && depth === 1) ? 'bottom' : 'right') : (item._fold ? (item._open ? 'bottom' : 'right') : (item.caret || 'none'))),
            checkMark: collapsed ? false : item.checkPh,
            checkStyle: item.checkStyle || 'check',
            memo: item.memo,
            loading: item.loading,
            type: item.type,
            variant: item.variant,
            indent: collapsed ? 0 : item.indent,
            labelPos: collapsed ? 'none' : 'right',
            hideTags: !!collapsed,
            tags: item.tags
        }"
      ></div>
      <div class="asc-menu-subwrap" x-show="item._fold" :data-open="item._open ? '' : null">
        <div
          class="asc-menu-sub"
          :style="item.conf && item.conf.indent != null ? { paddingInlineStart: (typeof item.conf.indent === 'number' ? item.conf.indent + 'px' : item.conf.indent) } : null"
        >
          <div
            x-component:autospark-menu-node="{
                list: item.kids,
                depth: depth + 1,
                mode: mode,
                trigger: trigger,
                collapsed: collapsed,
                effWidth: effWidth
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</div>
`,os=`<!--
    autospark-menu-panel 弹层面板（ADR-0033 决策 7·2026-11-24 重写）：**纯列表容器**——
    骨架 chrome（title / icon / actions / closeable / shell）全部下放 popover（经
    x-popover-options 的 item.conf 继承键配置，或 popover 的 slots 重载），menu 不再自绘
    head / title / foot，也不再有 slotDir 弹层内分区（slotDir 收缩为仅根菜单本体）。

    数据经 props 注入（2026-11-24 实测：props 对象包数组完好、面板内 x-component 正常，
    v2 的「沿宿主链读」废弃）：\`{ submenu: { children, ...popover 键 }, effWidth, collapsed, mode }\`。
    面板仍是纯桥：data 不接业务键，业务数据全部走 props 注入域。

    子项弹层递归：子项 entry 直接引用同一组件（x-popover:autospark-menu-panel），
    props 逐层下传 \`{ submenu: { children: child.kids, ...child.conf } }\`（克隆体内
    x-popover-options.props 求值——2026-11-24 两层递归实验通过）。子项点击沿宿主链
    写 relay 哨兵（落宿主 node data）。
-->
<div x-define="autospark-menu-panel">
  <script setup>
    {
        data: () => ({}),
        methods: {
            closeSelf() {
                if (typeof this.close === "function") { this.close(); return; }
                if (this._instClose) this._instClose();
            },
            focusFirst() {
                setTimeout(() => {
                    const first = this.el.querySelector(".asc-menu-entry > .asc-button:not([disabled])");
                    if (first) first.focus();
                }, 30);
            },
            openPophost(popEl) {
                if (String(trigger) === "click") {
                    popEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    popEl.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
                }
            },
            onKeydown(event) {
                const k = event.key;
                if (k !== "ArrowDown" && k !== "ArrowUp" && k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
                const btn = event.target && event.target.closest ? event.target.closest(".asc-menu-entry > .asc-button") : null;
                const currentEntry = btn ? btn.closest(".asc-menu-entry") : null;
                const focusables = (list) => Array.from(list.querySelectorAll(":scope > .asc-menu-entry > .asc-button:not([disabled])"));
                if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
                    const list = currentEntry ? currentEntry.parentElement : this.el.querySelector(".asc-menu-list");
                    const arr = list ? focusables(list) : [];
                    if (!arr.length) return;
                    event.preventDefault();
                    let next = null;
                    if (k === "Home") next = arr[0];
                    else if (k === "End") next = arr[arr.length - 1];
                    else {
                        const i = arr.indexOf(btn);
                        const dir = k === "ArrowDown" ? 1 : -1;
                        next = i < 0 ? arr[0] : arr[(i + dir + arr.length) % arr.length];
                    }
                    if (next) next.focus();
                    return;
                }
                if (!btn || !currentEntry) return;
                if (k === "ArrowRight") {
                    if (currentEntry.getAttribute("data-mode") === "pop") {
                        event.preventDefault();
                        this.openPophost(currentEntry);
                    }
                    return;
                }
                event.preventDefault();
                this.closeSelf();
            },
        },
        mounted() {
            if (Date.now() - Number(this.data.wantFocusAt || 0) < 600) this.focusFirst();
            this.watch("wantFocusAt", () => { this.focusFirst(); });
            this.el.addEventListener("overlay:open", (e) => {
                const inst = e.detail && e.detail.instance;
                if (inst && typeof inst.close === "function") this._instClose = () => inst.close();
            });
        },
    }
  <\/script>
  <div
    class="asc-menu-panel"
    tabindex="0"
    :style="mode !== 'horizontal' && !collapsed && effWidth > 0 ? { width: effWidth + 'px', minWidth: effWidth + 'px', maxWidth: effWidth + 'px' } : null"
    @keydown="onKeydown($event)"
  >
    <div class="asc-menu-list" role="menu" x-for="child of submenu.children">
      <div class="asc-menu-sep" x-show="child.kind === 'sep'" role="separator"></div>
      <div class="asc-menu-group" x-show="child.kind === 'group'" :data-icon="child.icon ? '' : null" role="group">
        <i class="asc-menu-group-icon" x-show="child.icon" x-icon="child.icon"></i>
        <span class="asc-menu-group-title">{{ child.title }}</span>
      </div>
      <div
        class="asc-menu-entry"
        x-show="child.kind === 'item'"
        role="menuitem"
        :data-key="child.key != null ? String(child.key) : null"
        :data-mode="child.kids && child.kids.length ? 'pop' : 'leaf'"
        :data-active="child._active ? '' : null"
        :data-marked="child._marked ? '' : null"
        :data-disabled="child.disabled ? '' : null"
        :data-icon-ph="child.iconPh ? '' : null"
        :aria-haspopup="child.kids && child.kids.length ? 'menu' : null"
        :aria-disabled="child.disabled ? 'true' : null"
        @click="child.kids && child.kids.length ? 0 : (relayKey = child.key, relayKind = 'pick', relayTick = relayTick + 1)"
        x-popover:autospark-menu-panel
        x-popover-options="{ padding: 0, trigger: trigger, at: { arrow: false, offset: 4, placement: 'right-start' }, disabled: !(child.kids && child.kids.length), ...(child.conf || {}) }"
        x-popover-options.props="{ submenu: { ...(child.conf || {}), children: child.kids }, effWidth: effWidth, collapsed: !!collapsed, mode: mode }"
      >
        <div
          x-component:autospark.button="{
              block: true,
              menu: true,
              label: child.label,
              icon: child.iconPh ? 'default' : (child.icon || ''),
              disabled: child.disabled,
              caret: child.kids && child.kids.length ? 'right' : (child.caret || 'none'),
              checkMark: child.checkPh,
              checkStyle: child.checkStyle || 'check',
              memo: child.memo,
              loading: child.loading,
              type: child.type,
              variant: child.variant,
              indent: child.indent,
              labelPos: 'right',
              tags: child.tags
          }"
        ></div>
      </div>
    </div>
  </div>
</div>
`,ss=`autospark.menu`,cs=`autospark-menu-node`,ls=`autospark-menu-panel`;function us(e){e.components[ss]=is,e.components[cs]=as,e.components[ls]=os,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-menu`))){let e=document.createElement(`div`);for(let e of Array.from(t.children))e.tagName.toLowerCase()===`x-menu-item`&&e.remove();for(let e of Array.from(t.children))if(e.tagName.toLowerCase()===`template`)for(let t of[`header`,`footer`]){if(!e.hasAttribute(t))continue;let n=e.getAttribute(t);e.removeAttribute(t),e.hasAttribute(`x-slot:${t}`)||e.setAttribute(`x-slot:${t}`,n??``)}let n=t.getAttribute(`items`),r=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),n!=null&&n!==``&&!r)try{let t=JSON.parse(n);Array.isArray(t)&&e.setAttribute(`data-items`,JSON.stringify(t))}catch{}let i=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?i.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``?i.push(`${Q(Z(n.name))}: true`):i.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${ss}`,`{ ${i.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}ds();function ds(){y(e=>{m(e),us(e)})}var fs=`<div
  class="asc-steps"
  x-define="autospark.steps"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            current: 0,
            items: [],
            status: "process",
            direction: "horizontal",
            clickable: false,
        }),
        methods: {
            onStepClick(i) {
                if (!this.data.clickable) return;
                const n = Math.max(0, Math.round(Number(i) || 0));
                if (n === this.data.current) return;
                this.data.current = n;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { current: n } }));
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            const normalize = (v) => {
                const n = Math.round(Number(v));
                return Number.isFinite(n) && n > 0 ? n : 0;
            };
            this.data.current = normalize(this.data.current);

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => normalize(this.data.current),
                set: (v) => { this.data.current = normalize(v); },
                configurable: true,
            });

            setTimeout(() => {
                if (normalize(this.data.current) === 0 && typeof prior === "string" && prior !== "" && Number(prior) > 0) {
                    this.data.current = normalize(prior);
                }
            }, 0);
            this.watch("current", ({ value }) => {
                if (typeof value !== "number") this.data.current = normalize(value);
            });
        },
    }
  <\/script>
  <style global id="autospark-components-steps">
    .asc-steps {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-steps-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-steps-body {
      --asc-tone: var(--auto-primary-color, var(--asc-steps-primary, #009aff));
      --asc-danger: var(--auto-danger-color, var(--asc-steps-danger, #ef4444));
    }
    .asc-steps-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .asc-steps-body[data-clickable] .asc-step {
      cursor: pointer;
    }
    .asc-steps-body[data-clickable] .asc-step:hover .asc-step-title {
      color: var(--asc-tone);
    }

    .asc-step {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      align-items: flex-start;
      gap: 0.5em;
    }
    .asc-step-dot {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75em;
      height: 1.75em;
      border-radius: 50%;
      border: var(--asc-steps-dot-border, 1px) solid var(--auto-border-color, var(--asc-steps-border, #d9d9d9));
      color: var(--auto-third-color, var(--asc-steps-wait-color, rgba(0, 0, 0, 0.45)));
      font-weight: var(--x-font-weight-large, 600);
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    .asc-step[data-state="process"] .asc-step-dot {
      border-color: var(--asc-tone);
      background: var(--asc-tone);
      color: var(--asc-steps-dot-ink, #ffffff);
    }
    .asc-step[data-state="finish"] .asc-step-dot {
      border-color: var(--asc-tone);
      color: var(--asc-tone);
    }
    .asc-step[data-state="error"] .asc-step-dot {
      border-color: var(--asc-danger);
      background: var(--asc-danger);
      color: var(--asc-steps-dot-ink, #ffffff);
    }
    .asc-step-check,
    .asc-step-error,
    .asc-step-custom {
      font-size: 0.9em;
    }

    .asc-step-info {
      flex: 0 1 auto;
      min-width: 0;
    }
    .asc-step-title {
      font-weight: var(--x-font-weight-large, 600);
      color: var(--auto-color, var(--asc-steps-title-color, #303133));
      transition: color 0.2s ease;
    }
    .asc-step[data-state="wait"] .asc-step-title {
      color: var(--auto-secondary-color, var(--asc-steps-wait-title, rgba(0, 0, 0, 0.55)));
      font-weight: var(--auto-font-weight, var(--x-font-weight-medium, 400));
    }
    .asc-step[data-state="process"] .asc-step-title {
      color: var(--asc-tone);
    }
    .asc-step[data-state="error"] .asc-step-title {
      color: var(--asc-danger);
    }
    .asc-step-desc {
      margin-top: 0.125em;
      font-size: 0.85em;
      color: var(--auto-third-color, var(--asc-steps-desc-color, rgba(0, 0, 0, 0.45)));
    }

    .asc-step-line {
      flex: 1 1 1em;
      align-self: flex-start;
      margin-top: calc((1.75em - 1px) / 2);
      height: 1px;
      background: var(--auto-border-color, var(--asc-steps-border, #d9d9d9));
      transition: background-color 0.3s ease;
    }
    .asc-step[data-state="finish"] .asc-step-line {
      background: var(--asc-tone);
    }
    .asc-step:last-child .asc-step-line {
      display: none;
    }

    .asc-steps-body[data-direction="vertical"] .asc-steps-list {
      flex-direction: column;
    }
    .asc-steps-body[data-direction="vertical"] .asc-step {
      flex: 0 0 auto;
      position: relative;
      gap: 0.75em;
      padding-bottom: 1.25em;
    }
    .asc-steps-body[data-direction="vertical"] .asc-step:last-child {
      padding-bottom: 0;
    }
    .asc-steps-body[data-direction="vertical"] .asc-step-line {
      position: absolute;
      left: calc(1.75em / 2);
      top: calc(1.75em + 0.375em);
      bottom: -0.625em;
      width: 1px;
      height: auto;
      margin: 0;
      flex: none;
      align-self: auto;
    }

    [dark] .asc-steps-body,
    [data-dark] .asc-steps-body {
      --asc-tone: var(--auto-primary-color, var(--asc-steps-primary, #56baff));
      --asc-danger: var(--auto-danger-color, var(--asc-steps-danger, #e6696a));
    }
    [dark] .asc-step-dot,
    [data-dark] .asc-step-dot {
      border-color: var(--auto-border-color, var(--asc-steps-border, #52525b));
      color: var(--auto-third-color, var(--asc-steps-wait-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-step-title,
    [data-dark] .asc-step-title {
      color: var(--auto-color, var(--asc-steps-title-color, #fafafa));
    }
    [dark] .asc-step[data-state="wait"] .asc-step-title,
    [data-dark] .asc-step[data-state="wait"] .asc-step-title {
      color: var(--auto-secondary-color, var(--asc-steps-wait-title, rgba(255, 255, 255, 0.55)));
    }
    [dark] .asc-step-desc,
    [data-dark] .asc-step-desc {
      color: var(--auto-third-color, var(--asc-steps-desc-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-step-line,
    [data-dark] .asc-step-line {
      background: var(--auto-border-color, var(--asc-steps-border, #52525b));
    }
    [dark] .asc-step[data-state="finish"] .asc-step-line,
    [data-dark] .asc-step[data-state="finish"] .asc-step-line {
      background: var(--asc-tone);
    }
  </style>
  <div class="asc-steps-body" :data-direction="direction" :data-clickable="clickable ? '' : null">
    <ol class="asc-steps-list" x-for="item of items" :key="item.title">
      <li
        class="asc-step"
        :data-state="$index < current ? 'finish' : ($index === current ? (status === 'error' ? 'error' : (status === 'finish' ? 'finish' : 'process')) : 'wait')"
        :aria-current="$index === current ? 'step' : null"
        @click="onStepClick($index)"
      >
        <div class="asc-step-dot">
          <i class="asc-step-check" x-show="$index < current || ($index === current && status === 'finish')" x-icon="'yes'"></i>
          <i class="asc-step-error" x-show="$index === current && status === 'error'" x-icon="'no'"></i>
          <i class="asc-step-custom" x-show="item.icon && ($index > current || ($index === current && status === 'process'))" x-icon="item.icon"></i>
          <span class="asc-step-num" x-show="!item.icon && ($index > current || ($index === current && status === 'process'))">{{ $index + 1 }}</span>
        </div>
        <div class="asc-step-info">
          <div class="asc-step-title">{{ item.title }}</div>
          <div class="asc-step-desc" x-show="item.description">{{ item.description }}</div>
        </div>
        <div class="asc-step-line" aria-hidden="true"></div>
      </li>
    </ol>
  </div>
</div>
`,ps=`autospark.steps`;function ms(e){e.components[ps]=fs,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-steps`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-step`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={title:e.getAttribute(`title`)??``},n=e.getAttribute(`description`);n!=null&&(t.description=n);let r=e.getAttribute(`icon`);return r!=null&&(t.icon=r),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``?a.push(`${Q(Z(n.name))}: true`):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${ps}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}hs();function hs(){y(e=>{m(e),ms(e)})}var gs=`<div
  class="asc-page-header"
  x-define="autospark.page-header"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            title: "",
            subtitle: "",
            back: false,
        }),
        methods: {
            onBack() {
                this.el.dispatchEvent(new CustomEvent("back", { bubbles: true }));
            },
        },
    }
  <\/script>
  <style global id="autospark-components-page-header">
    .asc-page-header {
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012）；
         标题以 em 相对放大（1.375em，随档位整体缩放）；主色经 --asc-tone 中转（tabs 同款约定） */
      --asc-tone: var(--auto-primary-color, var(--asc-page-header-primary, #009aff));
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-page-header-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-page-header-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75em;
      min-height: 2.5em;
      padding-bottom: 0.625em;
      border-bottom: var(--auto-border-size, var(--asc-page-header-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-page-header-border, #d9d9d9));
    }
    .asc-page-header-main {
      display: flex;
      align-items: center;
      gap: 0.5em;
      min-width: 0;
      flex: 1 1 auto;
    }
    /* 返回钮：自绘轻量图标钮（quiet 形态——透明底 + hover 浅底，button 范式的
       ghost 视觉近亲；不嵌套消费 autospark.button，保按需加载自包含） */
    .asc-page-header-back {
      appearance: none;
      border: none;
      background: transparent;
      font: inherit;
      line-height: inherit;
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      flex: none;
      margin: 0;
      padding: 0.3em;
      border-radius: var(--auto-border-radius, var(--asc-page-header-radius, 0.375em));
      color: var(--auto-secondary-color, var(--asc-page-header-back-color, rgba(0, 0, 0, 0.55)));
      cursor: pointer;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .asc-page-header-back:hover {
      color: var(--auto-color, var(--asc-page-header-color, #303133));
      background: var(--auto-hover-bgcolor, var(--asc-page-header-hover-bg, rgba(0, 0, 0, 0.06)));
    }
    .asc-page-header-back:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    .asc-page-header-back-icon {
      display: inline-flex;
      transform: rotate(180deg);
    }
    .asc-page-header-back-text {
      color: var(--auto-secondary-color, var(--asc-page-header-back-color, rgba(0, 0, 0, 0.55)));
    }
    .asc-page-header-titles {
      display: flex;
      align-items: baseline;
      gap: 0.625em;
      flex-wrap: wrap;
      min-width: 0;
    }
    .asc-page-header-title {
      margin: 0;
      min-width: 0;
      font-size: 1.375em;
      font-weight: var(--x-font-weight-large, 600);
      line-height: 1.3;
      color: var(--auto-color, var(--asc-page-header-title-color, #303133));
    }
    .asc-page-header-subtitle {
      min-width: 0;
      color: var(--auto-secondary-color, var(--asc-page-header-subtitle, rgba(0, 0, 0, 0.55)));
    }
    .asc-page-header-extra {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      margin-left: auto;
    }
    .asc-page-header-extra:empty {
      display: none;
    }
    .asc-page-header-content {
      padding-top: 0.75em;
    }
    .asc-page-header-content:empty {
      display: none;
    }

    [dark] .asc-page-header,
    [data-dark] .asc-page-header {
      --asc-tone: var(--auto-primary-color, var(--asc-page-header-primary, #56baff));
    }
    [dark] .asc-page-header-row,
    [data-dark] .asc-page-header-row {
      border-bottom-color: var(--auto-border-color, var(--asc-page-header-border, #52525b));
    }
    [dark] .asc-page-header-back,
    [data-dark] .asc-page-header-back {
      color: var(--auto-secondary-color, var(--asc-page-header-back-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-page-header-back:hover,
    [data-dark] .asc-page-header-back:hover {
      color: var(--auto-color, var(--asc-page-header-color, #fafafa));
      background: var(--auto-hover-bgcolor, var(--asc-page-header-hover-bg, rgba(255, 255, 255, 0.1)));
    }
    [dark] .asc-page-header-back-text,
    [dark] .asc-page-header-subtitle,
    [data-dark] .asc-page-header-back-text,
    [data-dark] .asc-page-header-subtitle {
      color: var(--auto-secondary-color, var(--asc-page-header-subtitle, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-page-header-title,
    [data-dark] .asc-page-header-title {
      color: var(--auto-color, var(--asc-page-header-title-color, #fafafa));
    }
  </style>
  <div class="asc-page-header-row">
    <div class="asc-page-header-main">
      <button
        type="button"
        class="asc-page-header-back"
        x-show="back"
        :aria-label="typeof back === 'string' && back ? back : title"
        @click="onBack()"
      >
        <i class="asc-page-header-back-icon" x-icon="'arrow'"></i>
        <span class="asc-page-header-back-text" x-show="typeof back === 'string' && back">{{ back }}</span>
      </button>
      <div class="asc-page-header-titles">
        <h1 class="asc-page-header-title">{{ title }}</h1>
        <span class="asc-page-header-subtitle" x-show="subtitle">{{ subtitle }}</span>
      </div>
    </div>
    <div class="asc-page-header-extra" x-slot:extra></div>
  </div>
  <div class="asc-page-header-content" x-slot></div>
</div>
`,_s=`autospark.page-header`;function vs(e){e.components[_s]=gs}ys();function ys(){y(e=>{m(e),vs(e)})}var bs=`<div
  class="asc-pagination"
  x-define="autospark.pagination"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            page: 1,
            pageSize: 10,
            total: 0,
            pageSizes: [],
            simple: false,
            pages: [],
            pageCount: (s) => Math.max(1, Math.ceil((Number(s.total) || 0) / (Number(s.pageSize) || 10)) || 1),
        }),
        methods: {
            applyPage(n) {
                const pc = Number(this.data.pageCount) || 1;
                const target = Math.min(Math.max(1, Number(n) || 1), pc);
                if (target === Number(this.data.page)) return false;
                this.data.page = target;
                return true;
            },
            onGo(n) {
                if (!this.applyPage(n)) return;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: Number(this.data.page), pageSize: Number(this.data.pageSize) } }));
            },
            onSizeChange(event) {
                event.stopPropagation();
                const size = Number(event.target.value);
                if (!size || size === Number(this.data.pageSize)) return;
                this.data.pageSize = size;
                this.data.page = 1;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: 1, pageSize: size } }));
            },
            computePages() {
                const pc = Number(this.data.pageCount) || 1;
                const page = Number(this.data.page) || 1;
                const items = [];
                if (pc <= 7) {
                    for (let i = 1; i <= pc; i++) items.push({ type: "page", page: i, key: "p" + i });
                } else {
                    items.push({ type: "page", page: 1, key: "p1" });
                    const start = Math.max(2, page - 2);
                    const end = Math.min(pc - 1, page + 2);
                    if (start > 2) items.push({ type: "more", key: "ml" });
                    for (let i = start; i <= end; i++) items.push({ type: "page", page: i, key: "p" + i });
                    if (end < pc - 1) items.push({ type: "more", key: "mr" });
                    items.push({ type: "page", page: pc, key: "p" + pc });
                }
                const sig = JSON.stringify(items);
                if (sig !== this._pagesSig) {
                    this._pagesSig = sig;
                    this.data.pages = items;
                }
            },
        },
        mounted() {
            const rawSizes = this.el.getAttribute("data-page-sizes");
            if ((!this.data.pageSizes || !this.data.pageSizes.length) && rawSizes) {
                try {
                    const arr = JSON.parse(rawSizes);
                    if (Array.isArray(arr)) this.data.pageSizes = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省无条数切换） */ }
                this.el.removeAttribute("data-page-sizes");
            }

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => Number(this.data.page) || 1,
                set: (v) => { this.applyPage(v); },
                configurable: true,
            });

            this.computePages();
            this.watch("page", () => this.computePages());
            this.watch("pageCount", () => { this.applyPage(this.data.page); this.computePages(); });

            setTimeout(() => {
                this.applyPage(typeof prior === "number" && prior > 0 ? prior : this.data.page);
                this.computePages();
            }, 0);
        },
    }
  <\/script>
  <style global id="autospark-components-pagination">
    .asc-pagination {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-pagination-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-pagination-body {
      --asc-tone: var(--auto-primary-color, var(--asc-pagination-primary, #009aff));
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 0.5em;
      color: var(--auto-color, var(--asc-pagination-color, #606060));
    }
    .asc-pagination-body[data-simple="true"] {
      justify-content: flex-start;
      gap: 0.375em;
    }

    .asc-pagination-total {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      white-space: nowrap;
    }

    .asc-pagination-sizes {
      display: inline-flex;
      align-items: center;
    }
    .asc-pagination-select {
      font: inherit;
      color: inherit;
      padding: 0.2em 0.5em;
      border: var(--auto-border-size, var(--asc-pagination-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-pagination-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-pagination-radius, 0.375em));
      background: var(--auto-bgcolor, var(--asc-pagination-bg, #ffffff));
      cursor: pointer;
    }
    .asc-pagination-select:focus-visible {
      outline: none;
      border-color: var(--asc-tone);
    }

    .asc-pagination-pages,
    .asc-pagination-simple {
      display: inline-flex;
      align-items: center;
      gap: 0.3125em;
    }
    .asc-pagination-item {
      display: inline-flex;
    }
    .asc-pagination-btn {
      appearance: none;
      font: inherit;
      line-height: inherit;
      color: var(--auto-color, var(--asc-pagination-color, #606060));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.0625em;
      min-width: 2em;
      height: 2em;
      padding: 0 0.375em;
      margin: 0;
      border: none;
      background: transparent;
      border-radius: var(--auto-border-radius, var(--asc-pagination-radius, 0.375em));
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .asc-pagination-btn:hover:not(:disabled) {
      color: var(--asc-tone);
      background: var(--auto-hover-bgcolor, var(--asc-pagination-hover-bg, rgba(0, 0, 0, 0.04)));
    }
    .asc-pagination-btn:disabled {
      color: var(--auto-disable-color, var(--asc-pagination-disable-color, rgba(0, 0, 0, 0.25)));
      cursor: not-allowed;
    }
    .asc-pagination-btn:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    .asc-pagination-btn[data-active] {
      color: var(--asc-pagination-active-ink, #ffffff);
      background: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
    .asc-pagination-icon {
      font-size: 1em;
      line-height: 1;
    }
    .asc-pagination-icon-flip {
      transform: rotate(180deg);
    }
    /* 省略号：辅助色不可点（折叠区段占位；显隐由克隆体 x-show 内联驱动——基样式
       不得写 display:none，否则样式表恒压过 x-show 的显示态） */
    .asc-pagination-ellipsis {
      display: inline-block;
      min-width: 1.5em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-pagination-ellipsis-color, rgba(0, 0, 0, 0.35)));
      letter-spacing: 0.125em;
    }
    .asc-pagination-simple-text {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      padding: 0 0.25em;
      white-space: nowrap;
    }

    [dark] .asc-pagination-body,
    [data-dark] .asc-pagination-body {
      --asc-tone: var(--auto-primary-color, var(--asc-pagination-primary, #56baff));
      color: var(--auto-color, var(--asc-pagination-color, #fafafa));
    }
    [dark] .asc-pagination-total,
    [dark] .asc-pagination-simple-text,
    [data-dark] .asc-pagination-total,
    [data-dark] .asc-pagination-simple-text {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-pagination-select,
    [data-dark] .asc-pagination-select {
      border-color: var(--auto-border-color, var(--asc-pagination-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-pagination-bg, #3a3a3a));
    }
    [dark] .asc-pagination-btn:disabled,
    [data-dark] .asc-pagination-btn:disabled {
      color: var(--auto-disable-color, var(--asc-pagination-disable-color, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-pagination-btn:hover:not(:disabled),
    [data-dark] .asc-pagination-btn:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-pagination-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-pagination-ellipsis,
    [data-dark] .asc-pagination-ellipsis {
      color: var(--auto-third-color, var(--asc-pagination-ellipsis-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <div class="asc-pagination-body" :data-simple="simple">
    <span class="asc-pagination-total" x-show="!simple">
      {{ t('pagination.total', { n: total }) === 'pagination.total' ? ('共 ' + total + ' 条') : t('pagination.total', { n: total }) }}
    </span>
    <span class="asc-pagination-sizes" x-show="!simple && pageSizes && pageSizes.length">
      <select
        class="asc-pagination-select"
        x-for="s of pageSizes"
        :key="String(s)"
        @change="onSizeChange($event)"
      >
        <option
          class="asc-pagination-option"
          :value="String(s)"
          :selected="Number(s) === Number(pageSize) ? true : null"
        >{{ t('pagination.pageSize', { n: s }) === 'pagination.pageSize' ? (s + ' 条/页') : t('pagination.pageSize', { n: s }) }}</option>
      </select>
    </span>
    <span class="asc-pagination-pages" x-show="!simple">
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) <= 1"
        :aria-label="t('pagination.first') === 'pagination.first' ? '首页' : t('pagination.first')"
        @click="onGo(1)"
      >
        <i class="asc-pagination-icon asc-pagination-icon-flip" x-icon="'arrow'"></i><i
          class="asc-pagination-icon asc-pagination-icon-flip"
          x-icon="'arrow'"
        ></i>
      </button>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) <= 1"
        :aria-label="t('pagination.prev') === 'pagination.prev' ? '上一页' : t('pagination.prev')"
        @click="onGo(Number(page) - 1)"
      >
        <i class="asc-pagination-icon asc-pagination-icon-flip" x-icon="'arrow'"></i>
      </button>
      <span class="asc-pagination-item" x-for="p of pages" :key="p.key">
        <button
          type="button"
          class="asc-pagination-btn"
          x-show="p.type === 'page'"
          :data-active="String(p.page) === String(page) ? '' : null"
          @click="onGo(p.page)"
        >{{ p.page }}</button>
        <span class="asc-pagination-ellipsis" x-show="p.type === 'more'">···</span>
      </span>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) >= Number(pageCount)"
        :aria-label="t('pagination.next') === 'pagination.next' ? '下一页' : t('pagination.next')"
        @click="onGo(Number(page) + 1)"
      >
        <i class="asc-pagination-icon" x-icon="'arrow'"></i>
      </button>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) >= Number(pageCount)"
        :aria-label="t('pagination.last') === 'pagination.last' ? '末页' : t('pagination.last')"
        @click="onGo(pageCount)"
      >
        <i class="asc-pagination-icon" x-icon="'arrow'"></i><i
          class="asc-pagination-icon"
          x-icon="'arrow'"
        ></i>
      </button>
    </span>
    <span class="asc-pagination-simple" x-show="simple">
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) <= 1"
        :aria-label="t('pagination.prev') === 'pagination.prev' ? '上一页' : t('pagination.prev')"
        @click="onGo(Number(page) - 1)"
      >
        <i class="asc-pagination-icon asc-pagination-icon-flip" x-icon="'arrow'"></i>
      </button>
      <span class="asc-pagination-simple-text">{{ page }} / {{ pageCount }}</span>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) >= Number(pageCount)"
        :aria-label="t('pagination.next') === 'pagination.next' ? '下一页' : t('pagination.next')"
        @click="onGo(Number(page) + 1)"
      >
        <i class="asc-pagination-icon" x-icon="'arrow'"></i>
      </button>
    </span>
  </div>
</div>
`,xs=`autospark.pagination`;function Ss(e){e.components[xs]=bs,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-pagination`))){let e=t.getAttribute(`page-sizes`);e!=null&&e!==``&&!t.hasAttribute(`:page-sizes`)&&t.setAttribute(`data-page-sizes`,e),t.removeAttribute(`page-sizes`)}})}Cs();function Cs(){y(e=>{m(e),Ss(e)})}var ws=`<nav
  class="asc-anchor"
  x-define="autospark.anchor"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            current: "",
            items: [],
            offset: 0,
            affix: false,
        }),
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            const resolveTarget = (item) => {
                if (!item || item.key == null) return null;
                const href = String(item.href || \`#\${item.key}\`);
                if (href.startsWith("#")) {
                    const id = href.slice(1);
                    if (!id) return null;
                    return document.getElementById(id) ?? null;
                }
                try { return document.querySelector(href); } catch { return null; }
            };

            const computeCurrent = () => {
                const offset = Number(this.data.offset) || 0;
                let cur = "";
                for (const it of (this.data.items || [])) {
                    const target = resolveTarget(it);
                    if (!target || typeof target.getBoundingClientRect !== "function") continue;
                    if (target.getBoundingClientRect().top - offset <= 1) cur = String(it.key);
                }
                return cur;
            };

            const syncActive = () => {
                const k = computeCurrent();
                if (k === String(this.data.current ?? "")) return;
                this.data.current = k;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { key: k } }));
            };

            const onScroll = () => { syncActive(); };
            const onResize = () => { syncActive(); };
            window.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("resize", onResize, { passive: true });
            this.el["_ascAnchorCleanup"] = () => {
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onResize);
            };

            setTimeout(() => { syncActive(); }, 0);

            this.el.addEventListener("click", (e) => {
                const link = e.target instanceof Element ? e.target.closest(".asc-anchor-link") : null;
                if (!link || !this.el.contains(link)) return;
                e.preventDefault();
                const key = link.getAttribute("data-key") ?? "";
                const item = (this.data.items || []).find((it) => it && String(it.key) === key);
                const target = item ? resolveTarget(item) : null;
                if (!target) return;
                const offset = Number(this.data.offset) || 0;
                const top = target.getBoundingClientRect().top + (window.scrollY || 0) - offset;
                const reduced = typeof window?.matchMedia === "function"
                    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
                if (key !== String(this.data.current ?? "")) {
                    this.data.current = key;
                    this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { key } }));
                }
            });
        },
        unmounted() {
            const cleanup = this.el?.["_ascAnchorCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascAnchorCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-anchor">
    .asc-anchor {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-anchor-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-anchor:has(> .asc-anchor-body[data-affix]) {
      position: fixed;
      top: var(--asc-anchor-affix-top, 5rem);
      right: var(--asc-anchor-affix-right, 2rem);
      z-index: var(--asc-anchor-affix-z, 100);
      width: auto;
      max-width: min(30vw, 14rem);
    }

    .asc-anchor-link {
      --asc-tone: var(--auto-primary-color, var(--asc-anchor-primary, #009aff));
      display: flex;
      align-items: center;
      padding: 0.375em 0.75em;
      border-left: 2px solid var(--auto-border-color, var(--asc-anchor-ink, #d9d9d9));
      color: var(--auto-secondary-color, var(--asc-anchor-link-color, rgba(0, 0, 0, 0.55)));
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease;
    }
    .asc-anchor-link:not([data-active]):hover {
      color: var(--asc-tone);
    }
    .asc-anchor-link[data-active] {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-large, 600);
      border-left-color: var(--asc-tone);
    }
    .asc-anchor-label {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    [dark] .asc-anchor-link,
    [data-dark] .asc-anchor-link {
      --asc-tone: var(--auto-primary-color, var(--asc-anchor-primary, #56baff));
      color: var(--auto-secondary-color, var(--asc-anchor-link-color, rgba(255, 255, 255, 0.65)));
      border-left-color: var(--auto-border-color, var(--asc-anchor-ink, #52525b));
    }
    [dark] .asc-anchor-link[data-active],
    [data-dark] .asc-anchor-link[data-active] {
      color: var(--asc-tone);
      border-left-color: var(--asc-tone);
    }
  </style>
  <div class="asc-anchor-body" :data-affix="affix ? '' : null">
    <div class="asc-anchor-list" x-for="item of items" :key="item.key">
      <a
        class="asc-anchor-link"
        :data-key="String(item.key)"
        :href="item.href || ('#' + item.key)"
        :data-active="String(item.key) === String(current) ? '' : null"
        :aria-current="String(item.key) === String(current) ? 'true' : null"
      >
        <span class="asc-anchor-label">{{ item.label }}</span>
      </a>
    </div>
  </div>
</nav>
`,Ts=`autospark.anchor`;function Es(e){e.components[Ts]=ws,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-anchor`))){let e=document.createElement(`nav`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-anchor-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`href`);return n!=null&&(t.href=n),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify(n.value===``||$(n.value))}`);for(e.setAttribute(`x-component:${Ts}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ds();function Ds(){y(e=>{m(e),Es(e)})}var Os=`<div
  class="asc-dropdown"
  x-define="autospark.dropdown"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],
            trigger: "hover",
            placement: "bottom-start",
            disabled: false,
            open: false,
            activeKey: null,
            pickTick: 0,
            pickKey: null,
            hoverTick: 0,
            hoverKey: null,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-dropdown-trigger");
            },
            triggerMode() {
                return String(this.data.trigger ?? "hover") === "click" ? "click" : "hover";
            },
            openPanel() {
                if (this.data.disabled) return;
                if (this.data.open) return;
                const t = this.triggerEl();
                if (!t) return;
                if (this.triggerMode() === "click") {
                    t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    t.dispatchEvent(new MouseEvent("mouseenter"));
                }
            },
            closePanel() {
                if (!this.data.open) return;
                const t = this.triggerEl();
                if (!t) return;
                if (this.triggerMode() === "click") {
                    t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    t.dispatchEvent(new MouseEvent("mouseleave"));
                }
            },
            setActive(key) {
                const list = this.data.items ?? [];
                const i = list.findIndex((o) => o && String(o.key) === String(key));
                if (i >= 0 && !list[i].disabled) this.data.activeKey = list[i].key;
            },
            moveActive(dir) {
                const list = this.data.items ?? [];
                if (list.length === 0) return;
                let i = list.findIndex((o) => o && String(o.key) === String(this.data.activeKey));
                for (let step = 0; step < list.length; step++) {
                    i = (i + dir + list.length) % list.length;
                    if (!list[i].disabled) { this.data.activeKey = list[i].key; return; }
                }
            },
            pick(key) {
                if (this.data.disabled) return;
                const list = this.data.items ?? [];
                const item = list.find((o) => o && String(o.key) === String(key));
                if (!item || item.disabled) return;
                this.emit("select", { key: item.key, item: { ...item } });
                this.data.activeKey = null;
                this.closePanel();
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                    if (this.data.open) {
                        event.preventDefault();
                        if (this.data.activeKey != null) this.pick(this.data.activeKey);
                        else this.closePanel();
                    }
                }
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            setTimeout(() => {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
            }, 0);

            this.watch("open", () => {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) this.data.activeKey = null;
            });
            this.watch("disabled", () => {
                setTimeout(() => {
                    const t = this.triggerEl();
                    if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                    this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                }, 0);
                if (this.data.disabled) this.closePanel();
            });
            this.watch("pickTick", () => { this.pick(this.data.pickKey); });
            this.watch("hoverTick", () => { this.setActive(this.data.hoverKey); });
        },
    }
  <\/script>
  <style global id="autospark-components-dropdown">
    .asc-dropdown {
      display: inline-flex;
      font-size: var(--auto-font-size, var(--asc-dropdown-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    /* 触发器包裹层（popover 宿主 + 键盘监听点）：紧贴插槽内容；tabindex 聚焦位（文本
       触发区键盘可达——JS 通道维护禁用态退出焦点序） */
    .asc-dropdown-trigger {
      display: inline-flex;
      align-items: center;
      outline: none;
      border-radius: var(--auto-border-radius, var(--asc-dropdown-trigger-radius, 0.375rem));
    }
    .asc-dropdown-trigger:focus-visible {
      box-shadow: inset 0 0 0 2px
        color-mix(in srgb, var(--auto-primary-color, var(--asc-dropdown-primary, #009aff)) 28%, transparent);
    }
    /* 出口即触发器本体：使用者内容直接成为宿主子级（出口与宿主同元素的成因见
       模板尾注——ADR-0056 决策十的覆盖物内容标记判定），无须额外包裹层 */
    /* 禁用：整体淡化 + 触发器 pointer-events 阻断开面板（popover 宿主监听不知禁用态，
       CSS 层拦截——click 与 hover 两模型一并阻断） */
    .asc-dropdown[data-disabled] {
      opacity: 0.55;
    }
    .asc-dropdown[data-disabled] .asc-dropdown-trigger {
      pointer-events: none;
    }

    /* ══════════ 菜单面板（autospark-dropdown-panel，渲染进 body 覆盖物容器；外壳
       边框/阴影/定位归 popover-shell；菜单项语义色 token 与 menu 同源、面板结构与
       select 下拉面板同款，ADR-0027 决策 9 ══════════ */
    .asc-dropdown-panel {
      display: block;
      min-width: max-content;
      font-size: var(--auto-font-size, var(--asc-dropdown-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-dropdown-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-dropdown-panel-color, #333333));
    }
    .asc-dropdown-menu {
      list-style: none;
      margin: 0;
      padding: 0.25em 0;
      max-height: var(--asc-dropdown-max-height, 15em);
      overflow-y: auto;
      box-sizing: border-box;
    }
    /* 菜单项：行式热区；高亮/禁用/分隔线/危险态经 data-* 属性选择器驱动（绑定通道写
       属性——假值整个移除即无态，绑定语义天然契合）；语义色 token 与 menu 同源 */
    .asc-dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5em;
      min-height: 2.2em;
      padding: 0.3em 0.75em;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-dropdown-item[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-dropdown-item-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-dropdown-item-icon {
      display: inline-flex;
      flex: none;
      color: var(--auto-third-color, var(--asc-dropdown-item-icon, rgba(0, 0, 0, 0.35)));
    }
    .asc-dropdown-item[data-active] .asc-dropdown-item-icon {
      color: var(--auto-secondary-color, var(--asc-dropdown-item-icon-active, rgba(0, 0, 0, 0.55)));
    }
    .asc-dropdown-item-label {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
    }
    .asc-dropdown-item[data-divided] {
      border-top: var(--auto-border-size, var(--asc-dropdown-item-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-dropdown-item-border, #f0f0f0));
    }
    .asc-dropdown-item[data-danger] {
      color: var(--auto-danger-color, var(--asc-dropdown-item-danger, #ef4444));
    }
    .asc-dropdown-item[data-danger]:not([data-disabled])[data-active] {
      background: color-mix(
        in srgb,
        var(--auto-danger-color, var(--asc-dropdown-item-danger, #ef4444)) 8%,
        transparent
      );
    }
    .asc-dropdown-item[data-disabled] {
      color: var(--auto-disable-color, var(--asc-dropdown-item-disabled, rgba(0, 0, 0, 0.28)));
      cursor: not-allowed;
      background: transparent;
    }
    .asc-dropdown-item[data-disabled]:hover {
      background: transparent;
    }
    .asc-dropdown-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-dropdown-empty, rgba(0, 0, 0, 0.35)));
    }

    [dark] .asc-dropdown,
    [data-dark] .asc-dropdown {
      color: var(--auto-color, var(--asc-dropdown-color, #fafafa));
    }
    [dark] .asc-dropdown-trigger:focus-visible,
    [data-dark] .asc-dropdown-trigger:focus-visible {
      box-shadow: inset 0 0 0 2px
        color-mix(in srgb, var(--auto-primary-color, var(--asc-dropdown-primary, #56baff)) 28%, transparent);
    }
    [dark] .asc-dropdown-panel,
    [data-dark] .asc-dropdown-panel {
      color: var(--auto-color, var(--asc-dropdown-panel-color, #fafafa));
    }
    [dark] .asc-dropdown-item[data-active],
    [data-dark] .asc-dropdown-item[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-dropdown-item-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-dropdown-item-icon,
    [data-dark] .asc-dropdown-item-icon {
      color: var(--auto-third-color, var(--asc-dropdown-item-icon, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-dropdown-item[data-active] .asc-dropdown-item-icon,
    [data-dark] .asc-dropdown-item[data-active] .asc-dropdown-item-icon {
      color: var(--auto-secondary-color, var(--asc-dropdown-item-icon-active, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-dropdown-item[data-divided],
    [data-dark] .asc-dropdown-item[data-divided] {
      border-top-color: var(--auto-border-color, var(--asc-dropdown-item-border, #52525b));
    }
    [dark] .asc-dropdown-item[data-danger],
    [data-dark] .asc-dropdown-item[data-danger] {
      color: var(--auto-danger-color, var(--asc-dropdown-item-danger, #e6696a));
    }
    [dark] .asc-dropdown-item[data-disabled],
    [data-dark] .asc-dropdown-item[data-disabled] {
      color: var(--auto-disable-color, var(--asc-dropdown-item-disabled, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-dropdown-empty,
    [data-dark] .asc-dropdown-empty {
      color: var(--auto-third-color, var(--asc-dropdown-empty, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <span
    class="asc-dropdown-trigger"
    tabindex="0"
    aria-haspopup="menu"
    aria-expanded="false"
    x-popover:autospark-dropdown-panel
    x-popover-options="{ padding: 0, closeable: false, at: { arrow: false, offset: 4 } }"
    x-popover-options.trigger="trigger"
    x-popover-options.at="{ placement: placement }"
    @keydown="onTriggerKeydown($event)"
    x-slot
  ></span>
</div>
`,ks=`<div class="asc-dropdown-panel" x-define="autospark-dropdown-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
            const scrollActive = () => {
                const el = this.el.querySelector(".asc-dropdown-item[data-active]");
                el?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(scrollActive, 0);
            this.watch("activeKey", () => { setTimeout(scrollActive, 0); });
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <ul class="asc-dropdown-menu" role="menu" x-for="item of items" :key="item.key">
    <li
      class="asc-dropdown-item"
      role="menuitem"
      x-bind:data-active="activeKey != null && String(item.key) === String(activeKey)"
      x-bind:data-disabled="!!item.disabled"
      x-bind:data-divided="!!item.divided"
      x-bind:data-danger="!!item.danger"
      x-bind:aria-disabled="item.disabled ? 'true' : null"
      x-on:click="pickTick = pickTick + 1, pickKey = item.key"
      x-on:mouseenter="hoverTick = hoverTick + 1, hoverKey = item.key"
    >
      <i class="asc-dropdown-item-icon" x-show="item.icon" x-icon="item.icon"></i>
      <span class="asc-dropdown-item-label">{{ item.label }}</span>
    </li>
  </ul>
  <div
    class="asc-dropdown-empty"
    x-if="!(items && items.length > 0)"
    x-text="t('dropdown.empty') === 'dropdown.empty' ? '暂无数据' : t('dropdown.empty')"
  ></div>
</div>
`,As=`autospark.dropdown`,js=`autospark-dropdown-panel`,Ms=new Set([`disabled`]);function Ns(e){let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);return n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0),e.hasAttribute(`divided`)&&(t.divided=!0),e.hasAttribute(`danger`)&&(t.danger=!0),t}function Ps(e){e.components[As]=Os,e.components[js]=ks,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-dropdown`))){let e=document.createElement(`span`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-dropdown-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(Ns);else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``&&Ms.has(n.name)?a.push(`${Q(Z(n.name))}: true`):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${As}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Fs();function Fs(){y(e=>{m(e),Ps(e)})}var Is=`<button
  type="button"
  class="asc-float-button"
  x-define="autospark.float-button"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "default",
            icon: "",
            visibilityHeight: 400,
            right: 40,
            bottom: 40,
            shape: "circle",
        }),
        mounted() {
            const el = this.el;

            const toPos = (v) => {
                if (typeof v === "number" && isFinite(v)) return \`\${v}px\`;
                if (typeof v === "string" && v.trim() !== "") return v.trim();
                return null;
            };
            const syncPos = () => {
                const r = toPos(this.data.right);
                const b = toPos(this.data.bottom);
                if (r) el.style.setProperty("right", r);
                else el.style.removeProperty("right");
                if (b) el.style.setProperty("bottom", b);
                else el.style.removeProperty("bottom");
            };

            const scrollTop = () =>
                (typeof window.scrollY === "number" ? window.scrollY : 0)
                || (document.documentElement ? document.documentElement.scrollTop : 0)
                || 0;
            const syncVisible = () => {
                const threshold = Number(this.data.visibilityHeight);
                const visible = scrollTop() >= (isFinite(threshold) ? threshold : 0);
                if (visible) el.setAttribute("data-visible", "");
                else el.removeAttribute("data-visible");
            };

            let cleanupScroll = null;
            const bindScroll = () => {
                if (cleanupScroll) { cleanupScroll(); cleanupScroll = null; }
                if (String(this.data.type) !== "back-to-top") {
                    el.removeAttribute("data-visible");
                    return;
                }
                const onScroll = () => { syncVisible(); };
                window.addEventListener("scroll", onScroll, { passive: true });
                cleanupScroll = () => window.removeEventListener("scroll", onScroll);
                syncVisible();
            };

            syncPos();
            setTimeout(() => { bindScroll(); }, 0);
            this.watch("right", () => { syncPos(); });
            this.watch("bottom", () => { syncPos(); });
            this.watch("type", () => { setTimeout(bindScroll, 0); });
            this.watch("visibilityHeight", () => { syncVisible(); });

            el.addEventListener("click", () => {
                if (String(this.data.type) !== "back-to-top") return;
                const reduced = typeof window?.matchMedia === "function"
                    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
            });

            el["_ascFloatButtonCleanup"] = () => {
                if (cleanupScroll) cleanupScroll();
            };
        },
        unmounted() {
            const cleanup = this.el?.["_ascFloatButtonCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascFloatButtonCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-float-button">
    .asc-float-button {
      /* 阴影走 theme 手动通道：data-shadow 档位在 theme 在场时覆写 --auto-shadow，
         缺省兜底为悬浮钮档投影（对齐 theme 默认档校准值，card 同款注释） */
      position: fixed;
      right: var(--asc-float-button-right, 40px);
      bottom: var(--asc-float-button-bottom, 40px);
      z-index: var(--asc-float-button-z, 100);
      appearance: none;
      border: var(--auto-border-size, var(--asc-float-button-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-float-button-border, #d9d9d9));
      background: var(--auto-bgcolor, var(--asc-float-button-bg, #ffffff));
      color: var(--auto-color, var(--asc-float-button-color, #606060));
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.12)));
      border-radius: var(--x-border-radius-circle, 50%);
      width: var(--asc-float-button-size, 2.5rem);
      height: var(--asc-float-button-size, 2.5rem);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375em;
      padding: 0;
      margin: 0;
      font: inherit;
      line-height: 1;
      font-size: var(--auto-font-size, var(--asc-float-button-font-size, 0.875rem));
      cursor: pointer;
      transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease,
        box-shadow 0.15s ease, opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
    }
    .asc-float-button:focus-visible {
      outline: none;
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.12))),
        inset 0 0 0 2px color-mix(in srgb, var(--auto-primary-color, var(--asc-float-button-primary, #009aff)) 28%, transparent);
    }
    .asc-float-button:not(:disabled):hover {
      color: var(--auto-primary-color, var(--asc-float-button-primary, #009aff));
      border-color: color-mix(in srgb, var(--auto-primary-color, var(--asc-float-button-primary, #009aff)) 45%, transparent);
    }

    .asc-float-button:has(> .asc-float-button-body[data-shape="square"]) {
      border-radius: var(--auto-border-radius, var(--asc-float-button-radius, 0.5rem));
    }

    .asc-float-button:has(.asc-float-button-label:not(:empty)) {
      width: auto;
      min-width: var(--asc-float-button-size, 2.5rem);
      padding: 0 0.875em;
    }

    .asc-float-button:has(> .asc-float-button-body[data-type="back-to-top"]):not([data-visible]) {
      opacity: 0;
      visibility: hidden;
      transform: translateY(0.5rem);
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-float-button {
        transition: none;
      }
    }

    .asc-float-button-icon {
      display: inline-flex;
      font-size: 1.25em;
    }
    .asc-float-button-body[data-type="back-to-top"] .asc-float-button-icon[data-default-icon] {
      transform: rotate(-90deg);
    }
    .asc-float-button-label:empty {
      display: none;
    }

    [dark] .asc-float-button,
    [data-dark] .asc-float-button {
      background: var(--auto-bgcolor, var(--asc-float-button-bg, #3a3a3a));
      color: var(--auto-color, var(--asc-float-button-color, #fafafa));
      border-color: var(--auto-border-color, var(--asc-float-button-border, #52525b));
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.4)));
    }
  </style>
  <span class="asc-float-button-body" :data-type="type" :data-shape="shape">
    <i
      class="asc-float-button-icon"
      :data-default-icon="icon ? null : ''"
      x-icon="icon || (type === 'back-to-top' ? 'arrow' : '')"
    ></i>
    <span class="asc-float-button-label" x-slot></span>
  </span>
</button>
`,Ls=`autospark.float-button`;function Rs(e){e.components[Ls]=Is,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-float-button`))){let e=document.createElement(`button`);e.setAttribute(`type`,`button`);let n=t.hasAttribute(`back-to-top`);t.removeAttribute(`back-to-top`);let r=t.hasAttribute(`type`)||t.hasAttribute(`:type`),i=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?i.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):i.push(`${Q(Z(n.name))}: ${JSON.stringify(n.value===``||$(n.value))}`);for(n&&!r&&i.push(`type: ${JSON.stringify(`back-to-top`)}`),e.setAttribute(`x-component:${Ls}`,`{ ${i.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}zs();function zs(){y(e=>{m(e),Rs(e)})}var Bs=`<div
  class="asc-affix"
  x-define="autospark.affix"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            offset: 0,
            position: "top",
        }),
        mounted() {
            const el = this.el;
            let fixed = false;

            const scrollTop = () =>
                (typeof window.scrollY === "number" ? window.scrollY : 0)
                || (document.documentElement ? document.documentElement.scrollTop : 0)
                || 0;

            const computeFixed = () => {
                const off = Number(this.data.offset);
                return scrollTop() >= (isFinite(off) ? off : 0);
            };

            const syncOffset = () => {
                const off = Number(this.data.offset);
                el.style.setProperty("--asc-affix-off", \`\${isFinite(off) ? off : 0}px\`);
            };

            const syncFixed = () => {
                const should = computeFixed();
                if (should === fixed) return;
                fixed = should;
                if (should) {
                    const rect = el.getBoundingClientRect();
                    el.style.setProperty("--asc-affix-left", \`\${rect.left}px\`);
                    el.style.setProperty("--asc-affix-width", \`\${rect.width}px\`);
                    el.style.height = \`\${rect.height}px\`;
                    el.setAttribute("data-fixed", "");
                } else {
                    el.style.removeProperty("--asc-affix-left");
                    el.style.removeProperty("--asc-affix-width");
                    el.style.height = "";
                    el.removeAttribute("data-fixed");
                }
                el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { fixed: should } }));
            };

            const onScroll = () => {
                if (!el.isConnected) { el["_ascAffixCleanup"]?.(); return; }
                syncFixed();
            };
            const onResize = () => {
                if (!el.isConnected || !fixed) return;
                const rect = el.getBoundingClientRect();
                el.style.setProperty("--asc-affix-left", \`\${rect.left}px\`);
                el.style.setProperty("--asc-affix-width", \`\${rect.width}px\`);
            };
            const bindListeners = () => {
                window.addEventListener("scroll", onScroll, { passive: true });
                window.addEventListener("resize", onResize, { passive: true });
                el["_ascAffixCleanup"] = () => {
                    window.removeEventListener("scroll", onScroll);
                    window.removeEventListener("resize", onResize);
                };
            };

            syncOffset();
            this.watch("offset", () => { syncOffset(); syncFixed(); });
            this.watch("position", () => { /* 吸附边纯 CSS 分支（data-position），无 JS 重算面 */ });

            setTimeout(() => {
                if (!el.isConnected) return;
                bindListeners();
                syncFixed();
            }, 0);
        },
        unmounted() {
            const cleanup = this.el?.["_ascAffixCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascAffixCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-affix">
    /* 纯定位件：零色面/零字号面（三级回退链只作用于定位通道覆盖变量），
       无暗色兜底变体（暗色下定位语义不变）；吸附层级 --asc-affix-z 覆盖通道（缺省 100） */
    .asc-affix {
      position: relative;
      display: block;
    }

    .asc-affix[data-fixed] > .asc-affix-body {
      position: fixed;
      left: var(--asc-affix-left, 0px);
      width: var(--asc-affix-width, auto);
      z-index: var(--asc-affix-z, 100);
    }
    .asc-affix[data-fixed] > .asc-affix-body[data-position="top"] {
      top: var(--asc-affix-off, 0px);
    }
    .asc-affix[data-fixed] > .asc-affix-body[data-position="bottom"] {
      bottom: var(--asc-affix-off, 0px);
    }
    .asc-affix-body {
      position: relative;
    }
  </style>
  <div class="asc-affix-body" :data-position="position">
    <div class="asc-affix-inner" x-slot></div>
  </div>
</div>
`,Vs=`autospark.affix`;function Hs(e){e.components[Vs]=Bs,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-affix`))){let e=document.createElement(`div`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify(r.value===``||$(r.value))}`);for(e.setAttribute(`x-component:${Vs}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Us();function Us(){y(e=>{m(e),Hs(e)})}var Ws=`<div
  class="asc-watermark"
  x-define="autospark.watermark"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            content: "",
            font: "",
            fontSize: 16,
            color: "",
            opacity: 1,
            rotate: -22,
            gap: null,
            zIndex: 9,
            fullPage: false,
        }),
        mounted() {
            const el = this.el;
            let layer = null;
            let layerInBody = false;
            let lastSign = null;

            const normLines = (v) => {
                if (Array.isArray(v)) return v.map((x) => String(x ?? "")).filter((s) => s !== "");
                if (typeof v === "string" && v.trim() !== "") {
                    const t = v.trim();
                    if (t.startsWith("[")) {
                        try {
                            const parsed = JSON.parse(t);
                            if (Array.isArray(parsed)) {
                                return parsed.map((x) => String(x ?? "")).filter((s) => s !== "");
                            }
                        } catch { /* 非法 JSON 当普通文本 */ }
                    }
                    return [v];
                }
                return [];
            };

            const normGap = (v) => {
                if (typeof v === "number" && isFinite(v)) return [v, v];
                if (Array.isArray(v) && v.length === 2) {
                    const gx = Number(v[0]), gy = Number(v[1]);
                    return [isFinite(gx) ? gx : 100, isFinite(gy) ? gy : 100];
                }
                return [100, 100];
            };

            const seedDeclared = () => {
                const rawContent = el.getAttribute("data-content");
                if (rawContent != null && (this.data.content == null || this.data.content === "")) {
                    try { this.data.content = JSON.parse(rawContent); } catch { /* 非法 JSON 静默忽略 */ }
                    el.removeAttribute("data-content");
                }
                const rawGap = el.getAttribute("data-gap");
                if (rawGap != null && this.data.gap == null) {
                    try { this.data.gap = JSON.parse(rawGap); } catch { /* 非法 JSON 静默忽略 */ }
                    el.removeAttribute("data-gap");
                }
            };

            const syncContainer = () => {
                if (!layer) return;
                const wantFull = !!this.data.fullPage;
                if (wantFull && !layerInBody) {
                    document.body.appendChild(layer);
                    layerInBody = true;
                } else if (!wantFull && layerInBody) {
                    el.appendChild(layer);
                    layerInBody = false;
                }
                if (wantFull) layer.style.setProperty("position", "fixed");
                else layer.style.removeProperty("position");
            };

            const draw = () => {
                if (!layer || !el.isConnected) return;
                const lines = normLines(this.data.content);
                const rotate = Number(this.data.rotate);
                const rot = isFinite(rotate) ? rotate : 0;
                const [gx, gy] = normGap(this.data.gap);
                const fontSize = Number(this.data.fontSize);
                const fs = isFinite(fontSize) && fontSize > 0 ? fontSize : 16;
                const sign = JSON.stringify([lines, String(this.data.font ?? ""), fs, String(this.data.color ?? ""), this.data.opacity, rot, gx, gy, !!this.data.fullPage]);
                if (sign === lastSign) return;
                lastSign = sign;

                syncContainer();
                if (this.data.color) layer.style.setProperty("color", String(this.data.color));
                else layer.style.removeProperty("color");
                const op = Number(this.data.opacity);
                layer.style.opacity = String(isFinite(op) ? op : 1);
                const z = Number(this.data.zIndex);
                layer.style.zIndex = String(isFinite(z) ? z : 9);

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext ? canvas.getContext("2d") : null;
                if (!ctx || !lines.length) {
                    layer.style.backgroundImage = "";
                    layer.style.backgroundSize = "";
                    return;
                }
                const computed = getComputedStyle(layer);
                const family = (computed.fontFamily && String(computed.fontFamily).trim()) || "sans-serif";
                const font = this.data.font
                    ? String(this.data.font)
                    : \`\${fs}px \${family}\`;
                ctx.font = font;
                const widths = lines.map((line) => ctx.measureText(line).width);
                const textW = Math.ceil(Math.max(...widths, 1));
                const lineH = Math.ceil(fs * 1.3);
                const textH = lineH * lines.length;
                const rad = (rot * Math.PI) / 180;
                const cos = Math.abs(Math.cos(rad));
                const sin = Math.abs(Math.sin(rad));
                const w = Math.ceil(textW * cos + textH * sin) + 8;
                const h = Math.ceil(textW * sin + textH * cos) + 8;
                canvas.width = w;
                canvas.height = h;
                ctx.font = font;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = (computed.color && String(computed.color).trim()) || "rgba(0, 0, 0, 0.15)";
                ctx.translate(w / 2, h / 2);
                ctx.rotate(rad);
                lines.forEach((line, i) => {
                    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineH);
                });
                layer.style.backgroundImage = \`url(\${canvas.toDataURL("image/png")})\`;
                layer.style.backgroundRepeat = "repeat";
                layer.style.backgroundSize = \`\${w + gx}px \${h + gy}px\`;
                layer.style.backgroundPosition = "0 0";
            };

            const redraw = () => { draw(); };
            setTimeout(() => {
                if (!el.isConnected) return;
                seedDeclared();
                layer = el.querySelector(":scope > .asc-watermark-layer");
                this.watch("content", redraw);
                this.watch("font", redraw);
                this.watch("fontSize", redraw);
                this.watch("color", redraw);
                this.watch("opacity", redraw);
                this.watch("rotate", redraw);
                this.watch("gap", redraw);
                this.watch("zIndex", redraw);
                this.watch("fullPage", redraw);
                draw();
            }, 0);

            el["_ascWatermarkCleanup"] = () => {
                if (layer && layerInBody) layer.remove();
            };
        },
        unmounted() {
            const cleanup = this.el?.["_ascWatermarkCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascWatermarkCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-watermark">
    .asc-watermark {
      position: relative;
      display: block;
    }
    .asc-watermark:has(> .asc-watermark-body[data-full-page]) {
      display: contents;
    }

    .asc-watermark-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      color: var(--auto-secondary-color, var(--asc-watermark-color, rgba(0, 0, 0, 0.15)));
      font-family: var(--auto-font-family, var(--asc-watermark-font-family, sans-serif));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变）。
       fullPage 层挂 body 时仅 [dark] 全局通道命中（data-dark 局部容器域不覆盖 body 子树——边界声明） */
    [dark] .asc-watermark-layer,
    [data-dark] .asc-watermark-layer {
      color: var(--auto-secondary-color, var(--asc-watermark-color, rgba(255, 255, 255, 0.18)));
    }
  </style>
  <div class="asc-watermark-body" :data-full-page="fullPage ? '' : null">
    <div class="asc-watermark-content" x-slot></div>
  </div>
  <div class="asc-watermark-layer"></div>
</div>
`,Gs=`autospark.watermark`;function Ks(e){e.components[Gs]=Ws,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-watermark`))){let e=document.createElement(`div`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):(r.name===`content`||r.name===`gap`)&&r.value.trim().startsWith(`[`)?e.setAttribute(`data-${r.name}`,r.value):r.name===`class`||r.name===`style`||r.name===`id`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify(r.value===``||$(r.value))}`);for(e.setAttribute(`x-component:${Gs}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}qs();function qs(){y(e=>{m(e),Ks(e)})}var Js=`<div class="asc-tour" x-define="autospark.tour" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            steps: [],
            visible: false,
            current: 0,
            stepCount: (s) => (s.steps || []).length,
            curStep: (s) => (s.steps || [])[s.current] || null,
            isLast: (s) => s.current >= (s.steps || []).length - 1,
        }),
        methods: {
            resolveTarget(step) {
                if (!step || typeof step.target !== "string" || !step.target) return null;
                try { return document.querySelector(step.target); }
                catch { return null; }
            },
            syncPosition() {
                if (!this.data.visible) return;
                const steps = this.data.steps || [];
                if (!steps.length) return;
                const hi = this.el.querySelector(".asc-tour-highlight");
                const bubble = this.el.querySelector(".asc-tour-bubble");
                if (!hi || !bubble) return;
                const step = steps[this.data.current];
                const target = this.resolveTarget(step);
                if (!target) {
                    console.warn("[autospark.tour] 步骤 " + (this.data.current + 1) + " 的目标选择器未命中："
                        + (step ? JSON.stringify(step.target) : "(步骤缺席)") + "——已跳过");
                    if (this.data.current < steps.length - 1) {
                        this.data.current = this.data.current + 1;
                        this.emitChange();
                        return this.syncPosition();
                    }
                    this.closeTour();
                    return;
                }
                const rect = target.getBoundingClientRect();
                const pad = 6;
                hi.style.left = (rect.left - pad) + "px";
                hi.style.top = (rect.top - pad) + "px";
                hi.style.width = (rect.width + pad * 2) + "px";
                hi.style.height = (rect.height + pad * 2) + "px";
                hi.setAttribute("data-placed", "");
                const bw = bubble.offsetWidth;
                const bh = bubble.offsetHeight;
                const gap = 12;
                const viewW = window.innerWidth || document.documentElement.clientWidth;
                const viewH = window.innerHeight || document.documentElement.clientHeight;
                let top = rect.bottom + pad + gap;
                let side = "bottom";
                if (top + bh > viewH - 8 && rect.top - pad - gap - bh >= 8) {
                    top = rect.top - pad - gap - bh;
                    side = "top";
                }
                let left = rect.left - pad;
                left = Math.max(8, Math.min(left, viewW - bw - 8));
                bubble.style.left = left + "px";
                bubble.style.top = top + "px";
                bubble.setAttribute("data-side", side);
                bubble.setAttribute("data-placed", "");
            },
            scheduleSync() {
                setTimeout(() => this.syncPosition(), 0);
            },
            emitChange() {
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { current: this.data.current } }));
            },
            closeTour() {
                if (!this.data.visible) return;
                this.data.visible = false;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
            onPrev() {
                if (this.data.current <= 0) return;
                this.data.current = this.data.current - 1;
                this.emitChange();
                this.scheduleSync();
            },
            onNext() {
                const len = (this.data.steps || []).length;
                if (this.data.current >= len - 1) { this.closeTour(); return; }
                this.data.current = this.data.current + 1;
                this.emitChange();
                this.scheduleSync();
            },
            onSkip() {
                this.closeTour();
            },
        },
        mounted() {
            Object.defineProperty(this.el, "value", {
                get: () => !!this.data.visible,
                set: (v) => { this.data.visible = !!v; },
                configurable: true,
            });

            this.watch("visible", () => { if (this.data.visible) this.scheduleSync(); });
            this.watch("current", () => this.scheduleSync());
            this.watch("steps", () => this.scheduleSync());
            if (this.data.visible) this.scheduleSync();

            const onTrack = () => { if (this.data.visible) this.syncPosition(); };
            window.addEventListener("scroll", onTrack, true);
            window.addEventListener("resize", onTrack);

            let ro = null;
            if (typeof ResizeObserver !== "undefined") {
                ro = new ResizeObserver(() => { if (this.data.visible) this.syncPosition(); });
                ro.observe(document.documentElement);
            }

            this.el["_ascTourCleanup"] = () => {
                window.removeEventListener("scroll", onTrack, true);
                window.removeEventListener("resize", onTrack);
                if (ro) ro.disconnect();
            };
        },
        unmounted() {
            this.el?.["_ascTourCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-tour">
    .asc-tour {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-tour-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-tour-highlight {
      position: fixed;
      left: 0;
      top: 0;
      z-index: var(--asc-tour-z, 1000);
      border-radius: var(--auto-border-radius, var(--asc-tour-highlight-radius, 0.375rem));
      /* 大投影即全页遮罩（100vmax 任意页面尺寸全覆盖）；遮罩色恒半透明黑（明暗通吃，
         非主题映射——遮罩语境恒暗，image-viewer 同款声明） */
      box-shadow: 0 0 0 100vmax var(--asc-tour-mask, rgba(0, 0, 0, 0.55));
      pointer-events: none;
      visibility: hidden;
      transition:
        left 0.25s ease,
        top 0.25s ease,
        width 0.25s ease,
        height 0.25s ease;
    }
    .asc-tour-highlight[data-placed] {
      visibility: visible;
    }

    .asc-tour-bubble {
      position: fixed;
      left: 0;
      top: 0;
      z-index: calc(var(--asc-tour-z, 1000) + 1);
      box-sizing: border-box;
      width: min(20rem, calc(100vw - 1rem));
      padding: var(--auto-padding, var(--asc-tour-padding, 0.9rem));
      background: var(--auto-bgcolor, var(--asc-tour-bg, #ffffff));
      border-radius: var(--auto-border-radius, var(--asc-tour-radius, 0.5rem));
      box-shadow: var(--auto-shadow, var(--asc-tour-shadow, 0 4px 16px rgba(0, 0, 0, 0.16)));
      color: var(--auto-color, var(--asc-tour-color, #606060));
      visibility: hidden;
      transition:
        left 0.25s ease,
        top 0.25s ease;
    }
    .asc-tour-bubble[data-placed] {
      visibility: visible;
    }
    .asc-tour-bubble-body {
      display: flex;
      flex-direction: column;
      gap: 0.6em;
      min-width: 0;
    }
    .asc-tour-title {
      font-size: 1.1em;
      font-weight: var(--x-font-weight-medium, 500);
      color: var(--auto-color, var(--asc-tour-title-color, #303030));
    }
    .asc-tour-title:empty {
      display: none;
    }
    .asc-tour-content {
      color: var(--auto-secondary-color, var(--asc-tour-content-color, rgba(0, 0, 0, 0.55)));
      word-break: break-word;
    }

    .asc-tour-footer {
      display: flex;
      align-items: center;
      gap: 0.6em;
    }
    .asc-tour-skip {
      appearance: none;
      border: none;
      background: transparent;
      padding: 0.2em 0.1em;
      font-size: 0.875em;
      color: var(--auto-secondary-color, var(--asc-tour-skip-color, rgba(0, 0, 0, 0.55)));
      cursor: pointer;
    }
    .asc-tour-skip:hover {
      color: var(--auto-color, var(--asc-tour-skip-color, #606060));
    }
    .asc-tour-indicator {
      flex: 1;
      text-align: center;
      font-size: 0.875em;
      color: var(--auto-third-color, var(--asc-tour-indicator-color, rgba(0, 0, 0, 0.45)));
      font-variant-numeric: tabular-nums;
    }
    .asc-tour-btn {
      appearance: none;
      border: var(--auto-border-size, var(--asc-tour-btn-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-tour-btn-border-color, #d9d9d9));
      background: var(--auto-bgcolor, var(--asc-tour-btn-bg, #ffffff));
      color: var(--auto-color, var(--asc-tour-btn-color, #606060));
      border-radius: var(--auto-border-radius, var(--asc-tour-btn-radius, 0.375rem));
      padding: 0.25em 0.9em;
      font-size: 0.875em;
      line-height: 1.5;
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        background-color 0.15s ease,
        color 0.15s ease;
    }
    .asc-tour-btn:hover:not(:disabled) {
      border-color: var(--auto-hover-border-color, var(--asc-tour-btn-hover-border, #2563eb));
      color: var(--auto-hover-color, var(--asc-tour-btn-hover-color, #2563eb));
    }
    .asc-tour-btn:disabled {
      color: var(--auto-disable-color, var(--asc-tour-btn-disable-color, rgba(0, 0, 0, 0.3)));
      border-color: var(
        --auto-disable-border-color,
        var(--asc-tour-btn-disable-border, rgba(0, 0, 0, 0.15))
      );
      cursor: not-allowed;
    }
    .asc-tour-btn-primary {
      border-color: transparent;
      background: var(--auto-primary-color, var(--asc-tour-primary, #2563eb));
      color: var(--asc-tour-primary-color, #ffffff);
    }
    .asc-tour-btn-primary:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-tour-primary-hover, #1d4ed8));
      color: var(--asc-tour-primary-color, #ffffff);
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-tour-highlight,
      .asc-tour-bubble {
        transition: none;
      }
    }

    [dark] .asc-tour-bubble,
    [data-dark] .asc-tour-bubble {
      background: var(--auto-bgcolor, var(--asc-tour-bg, #1f1f1f));
      box-shadow: var(--auto-shadow, var(--asc-tour-shadow, 0 4px 16px rgba(0, 0, 0, 0.4)));
      color: var(--auto-color, var(--asc-tour-color, #fafafa));
    }
    [dark] .asc-tour-title,
    [data-dark] .asc-tour-title {
      color: var(--auto-color, var(--asc-tour-title-color, #fafafa));
    }
    [dark] .asc-tour-content,
    [data-dark] .asc-tour-content {
      color: var(--auto-secondary-color, var(--asc-tour-content-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-tour-skip,
    [data-dark] .asc-tour-skip {
      color: var(--auto-secondary-color, var(--asc-tour-skip-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-tour-skip:hover,
    [data-dark] .asc-tour-skip:hover {
      color: var(--auto-color, var(--asc-tour-skip-color, #fafafa));
    }
    [dark] .asc-tour-indicator,
    [data-dark] .asc-tour-indicator {
      color: var(--auto-third-color, var(--asc-tour-indicator-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-tour-btn,
    [data-dark] .asc-tour-btn {
      background: var(--auto-bgcolor, var(--asc-tour-btn-bg, #1f1f1f));
      color: var(--auto-color, var(--asc-tour-btn-color, #fafafa));
      border-color: var(
        --auto-border-color,
        var(--asc-tour-btn-border-color, rgba(255, 255, 255, 0.25))
      );
    }
    [dark] .asc-tour-btn:disabled,
    [data-dark] .asc-tour-btn:disabled {
      color: var(--auto-disable-color, var(--asc-tour-btn-disable-color, rgba(255, 255, 255, 0.3)));
      border-color: var(
        --auto-disable-border-color,
        var(--asc-tour-btn-disable-border, rgba(255, 255, 255, 0.15))
      );
    }
  </style>
  <div class="asc-tour-highlight" x-show="visible && stepCount > 0"></div>
  <div
    class="asc-tour-bubble"
    role="dialog"
    aria-label="漫游引导"
    x-show="visible && stepCount > 0"
  >
    <div class="asc-tour-bubble-body">
      <div class="asc-tour-title">{{ curStep && curStep.title ? curStep.title : '' }}</div>
      <div class="asc-tour-content">{{ curStep ? (curStep.content || "") : "" }}</div>
      <div class="asc-tour-footer">
        <button type="button" class="asc-tour-skip" @click="onSkip()">
          {{ t('tour.skip') === 'tour.skip' ? '跳过' : t('tour.skip') }}
        </button>
        <span class="asc-tour-indicator">{{ (current + 1) + ' / ' + stepCount }}</span>
        <button type="button" class="asc-tour-btn" :disabled="current <= 0" @click="onPrev()">
          {{ t('tour.prev') === 'tour.prev' ? '上一步' : t('tour.prev') }}
        </button>
        <button type="button" class="asc-tour-btn asc-tour-btn-primary" @click="onNext()">
          {{ isLast ? (t('tour.finish') === 'tour.finish' ? '完成' : t('tour.finish')) :
          (t('tour.next') === 'tour.next' ? '下一步' : t('tour.next')) }}
        </button>
      </div>
    </div>
  </div>
</div>
`,Ys=`autospark.tour`;function Xs(e){e.components[Ys]=Js}Zs();function Zs(){y(e=>{m(e),Xs(e)})}var Qs=`<div class="asc-countdown" x-define="autospark.countdown" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            time: 0,
            format: "",
        }),
        methods: {
            deadline() { return this.el["_ascCdDeadline"] || 0; },
            setDeadline(v) { this.el["_ascCdDeadline"] = v; },
            timer() { return this.el["_ascCdTimer"] || 0; },
            setTimer(v) { this.el["_ascCdTimer"] = v; },
            finished() { return !!this.el["_ascCdFinished"]; },
            setFinished(v) { this.el["_ascCdFinished"] = v; },
            formatText() {
                const fmt = this.data.format || "{h}:{m}:{s}";
                const remain = Math.max(0, this.deadline() - Date.now());
                const totalSec = Math.ceil(remain / 1000);
                const hasDay = fmt.indexOf("{d}") >= 0;
                const d = Math.floor(totalSec / 86400);
                const h = hasDay ? Math.floor((totalSec % 86400) / 3600) : Math.floor(totalSec / 3600);
                const m = Math.floor((totalSec % 3600) / 60);
                const s = totalSec % 60;
                const pad2 = (n) => String(n).padStart(2, "0");
                return fmt
                    .split("{d}").join(String(d))
                    .split("{h}").join(pad2(h))
                    .split("{m}").join(pad2(m))
                    .split("{s}").join(pad2(s));
            },
            syncValue() {
                const el = this.el.querySelector(".asc-countdown-value");
                if (el) el.textContent = this.formatText();
            },
            stop() {
                if (this.timer()) { clearTimeout(this.timer()); this.setTimer(0); }
            },
            fireFinish() {
                if (this.finished()) return;
                this.setFinished(true);
                this.stop();
                this.syncValue();
                this.el.dispatchEvent(new CustomEvent("finish", { bubbles: true }));
            },
            tickOn() {
                const remain = this.deadline() - Date.now();
                const delay = Math.min(1000, Math.max(16, remain % 1000 || 1000));
                this.setTimer(setTimeout(() => {
                    this.syncValue();
                    if (Date.now() >= this.deadline()) { this.fireFinish(); return; }
                    this.tickOn();
                }, delay));
            },
            start() {
                this.stop();
                this.setFinished(false);
                const ms = Number(this.data.time) || 0;
                this.setDeadline(Date.now() + ms);
                this.syncValue();
                if (ms <= 0) { this.fireFinish(); return; }
                this.tickOn();
            },
        },
        mounted() {
            this.start();
            this.watch("time", () => this.start());
            this.watch("format", () => this.syncValue());

            const onVis = () => {
                if (document.visibilityState === "visible" && !this.finished()) {
                    this.syncValue();
                    if (Date.now() >= this.deadline()) this.fireFinish();
                }
            };
            document.addEventListener("visibilitychange", onVis);

            this.el["_ascCountdownCleanup"] = () => {
                this.stop();
                document.removeEventListener("visibilitychange", onVis);
            };
        },
        unmounted() {
            this.el?.["_ascCountdownCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-countdown">
    .asc-countdown {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-countdown-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    /* 数值区：statistic 数值排版语言复用（ADR-0031 边界声明）——tabular-nums 等宽数字
       （走秒不跳宽）+ 1.5em 大字重 + em 基准随 data-size 档位全跟随 */
    .asc-countdown-value {
      display: inline-block;
      font-size: 1.5em;
      font-weight: var(--x-font-weight-large, 600);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
      color: var(--auto-color, var(--asc-countdown-value-color, #303030));
    }

    [dark] .asc-countdown-value,
    [data-dark] .asc-countdown-value {
      color: var(--auto-color, var(--asc-countdown-value-color, #fafafa));
    }
  </style>
  <div class="asc-countdown-body">
    <span class="asc-countdown-value"></span>
  </div>
</div>
`,$s=`autospark.countdown`;function ec(e){e.components[$s]=Qs}tc();function tc(){y(e=>{m(e),ec(e)})}};
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
