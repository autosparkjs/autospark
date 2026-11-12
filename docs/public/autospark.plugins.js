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
`,$e={[e]:Ye,[t(`toast`)]:Xe,[t(`task`)]:Ze,[t(`confirm`)]:Qe};function et(e){let t=e?.el;return t instanceof HTMLElement?t:null}function tt(e){return{title:`提示`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type??=`toast`,n.anchor??=et(this)??void 0,e.notifications.add(n)}}}function nt(e){return{title:`确认`,handle:function(t){let{yes:n,no:r,...i}=typeof t==`string`?{title:t}:{...t??{}};return i.anchor??=et(this)??void 0,e.notifications.show({...i,type:`confirm`,delayClose:i.delayClose??0,actions:[{title:n??`确定`,value:!0,type:`primary`},{title:r??`取消`,value:!1,type:`plain`}]})}}}function rt(e){return{title:`任务`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type=`task`,n.anchor??=et(this)??void 0,e.notifications.show(n)}}}var it={toast:tt,confirm:nt,task:rt};function at(e){let t=e.options.builtinComponents??(e.options.builtinComponents={});for(let[e,n]of Object.entries($e))t[e]??(t[e]=n)}function ot(e){at(e);let t=new Ke(e);e.notifications=t;for(let[t,n]of Object.entries(it))t in e.actions||(e.actions[t]=n(e));e.on(`engine/destroy/before`,()=>t.dispose())}function st(){y(e=>{m(e),e.ready(ot)})}st();var ct=class extends Error{constructor(e,t,n,r){super(e),this.name=`ResourceError`,this.status=t,this.url=n,this.method=r}};function b(e={}){let{where:t,...n}=e,r={...n};return typeof t==`object`&&t?Object.assign(r,t):typeof t==`string`&&t!==``&&(r.where=t),r}var lt={get:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`GET`,url:e,query:b(t)}:{method:`GET`,url:`${e}/${t}`},getMany:(e,t={})=>({method:`GET`,url:e,query:b(t)}),add:(e,t)=>({method:`POST`,url:e,body:t}),update:(e,t,n)=>{if(typeof n==`object`&&n)return{method:`PUT`,url:e,query:b(n),body:t};if(Array.isArray(t))return{method:`PUT`,url:e,body:t};let r=t?.id;return r==null?{method:`PUT`,url:e,body:t}:{method:`PUT`,url:`${e}/${r}`,body:t}},delete:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`DELETE`,url:e,query:b(t)}:Array.isArray(t)?{method:`DELETE`,url:e,query:{ids:t.join(`,`)}}:{method:`DELETE`,url:`${e}/${t}`}};function ut(e){let t=[];for(let[n,r]of Object.entries(e)){if(r==null)continue;let e=Array.isArray(r)?r.join(`,`):String(r);t.push(`${encodeURIComponent(n)}=${encodeURIComponent(e)}`)}return t.join(`&`)}async function dt(e,t={}){let n=/^https?:\/\//i.test(e.url)||!t.baseUrl?e.url:`${String(t.baseUrl).replace(/\/+$/,``)}/${e.url.replace(/^\/+/,``)}`,r=e.query?ut(e.query):``,i=r?`${n}${n.includes(`?`)?`&`:`?`}${r}`:n,a={...t.headers},o;e.body!==void 0&&(o=JSON.stringify(e.body),Object.keys(a).some(e=>e.toLowerCase()===`content-type`)||(a[`Content-Type`]=`application/json`));let s=t.fetch??globalThis.fetch,c;try{c=await s(i,{method:e.method,headers:a,body:o})}catch(t){throw new ct(`资源请求网络错误: ${e.method} ${i} (${t?.message??t})`,0,i,e.method)}if(!c.ok)throw new ct(`资源请求失败: ${e.method} ${i} → ${c.status} ${c.statusText}`,c.status,i,e.method);if(c.status===204)return null;let l=await c.text(),u=l===``?null:JSON.parse(l);return t.unwrap?t.unwrap(u,e):u}var ft=new Set([`url`,`mapping`,`baseUrl`,`fetch`,`headers`,`unwrap`]);function pt(e){if(typeof e==`string`)return{url:e,inlineOptions:{},methods:{},inlineMapping:void 0};let t=typeof e.url==`string`?e.url:null,n={},r={},i;for(let[t,a]of Object.entries(e))t===`mapping`?a&&typeof a==`object`&&(i=a):ft.has(t)?a!==void 0&&(n[t]=a):typeof a==`function`&&(r[t]=a);return{url:t,inlineOptions:n,methods:r,inlineMapping:i}}function mt(e,t,n){let r=t?.options?.resources;return{...n,...r,...e}}function ht(e,t,n){return{...lt,...n,...e?.options?.resources?.mapping,...t}}function gt(e,t,n,r={}){let{url:i,inlineOptions:a,methods:o,inlineMapping:s}=pt(t),c=ht(n,s,r.mapping),l={};for(let[t,n]of Object.entries(o))l[`${e}.${t}`]=n;if(i)for(let[t,o]of Object.entries(c))l[`${e}.${t}`]||(l[`${e}.${t}`]=function(...e){return dt(o(i,...e),mt(a,this?.engine??n,r))});else if(Object.keys(l).length===0)return l;return l}var _t=class{constructor(e){this._defs=new Map,this._globalOptions={},this.engine=e}get options(){return this.engine?this.engine.options.resources??={}:this._globalOptions}add(e,t){let n=typeof e==`string`?[[e,t]]:Object.entries(e);for(let[e,t]of n){if(t===void 0)continue;(this._defs.has(e)||this._hasAction(`${e}.`))&&console.warn(`[autospark] resources.add: 资源 "${e}" 重复注册，后者覆盖（ADR-0011）`),this._defs.set(e,t);let n=gt(e,t,this.engine,this._globalOptions);Object.keys(n).length===0?console.warn(`[autospark] resources.add: 资源 "${e}" 定义为空（无 url 也无方法），已跳过`):this._write(n)}}get(e){return this._defs.get(e)}has(e){return this._defs.has(e)||this._hasAction(`${e}.`)}_write(e){let t=this._actionTable();if(!t)console.warn(`[autospark] resources.add: AutoSpark 命名空间不可用（插件未自举？），全局注册未生效`);else for(let[n,r]of Object.entries(e))t[n]=r}_actionTable(){if(this.engine)return this.engine.actions;let e=re();return e&&typeof e==`function`?e.actions:null}_hasAction(e){let t=this._actionTable();return t?Object.keys(t).some(t=>t.startsWith(e)):!1}},vt=null;function x(){return vt??=new _t}var yt=(e,t,n)=>{let r=e.textContent?.trim();if(!r)return;let i;try{let e=Function(`return (${r})`)();if(!e||typeof e!=`object`||Array.isArray(e)){n.logger.error(`<script type="autospark/resources"> 内容须为对象字面量`);return}i=e}catch(e){n.logger.error(`<script type="autospark/resources"> 解析失败: ${e?.message??e}`);return}let a=x().options,o=e.hasAttribute(`global`);for(let[e,r]of Object.entries(i)){let i=gt(e,r,n,a);if(Object.keys(i).length===0)n.logger.warn(`资源 "${e}" 定义为空（无 url 也无方法），已跳过（ADR-0011）`);else if(o)for(let[e,t]of Object.entries(i))n.actions[e]=t;else t?n.actionsManager.registerScoped(t,i):n.logger.warn(`资源 "${e}" 局部声明无祖先 scope（顶层游离）——加 global 属性声明 engine 级，或移入任意容器元素内`)}};function bt(){return{name:`resource`,created(){let e=(this.attr??``).trim();if(!e){this.warn(`x-resource: 缺属性参数（形态 x-resource:<资源名>="<url>"），本声明已忽略`);return}let t=String(this.value??``).trim();if(!t){this.warn(`x-resource:${e}: 缺 url 值，本声明已忽略`);return}let n=gt(e,t,this.engine,x().options);Object.keys(n).length===0?this.warn(`x-resource:${e}: 资源展开为空（映射表不可用？），本声明已忽略`):this.engine.actionsManager.registerScoped(this.binding,n)}}}function xt(){y(e=>{m(e),e.resources||=x(),e.scriptType(`autospark/resources`,yt),e.directive(bt()),e.ready(e=>{e.resources=new _t(e)})})}xt();var{params:St}=AutoSpark,Ct=new WeakMap,wt=new WeakMap;function Tt(e,t){Ct.set(e,{...Ct.get(e),...t})}function Et(e,t){wt.set(e,{...wt.get(e),...t})}function Dt(e){return e.trim().toLowerCase().replace(/_/g,`-`)}function S(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Ot(e,t){return Object.prototype.hasOwnProperty.call(e,t)}var kt=new Set,At=new Set;function jt(e){let t=e.store?.state;if(!t)return;let n=t.$?.language;if(typeof n==`string`&&n!==``)return n;let r=e.options.i18n??{},i=r.language??r.default;if(typeof i==`string`&&i!==``){try{t.$||={},t.$.language=i}catch{}return i}}function Mt(e,t,n){let r=[],i=!1,a=t;for(;a;){let e=Ct.get(a);e&&(i=!0,Ot(e,n)&&S(e[n])&&r.push(e[n])),a=a.parent}let o=wt.get(e);o&&(i=!0,Ot(o,n)&&S(o[n])&&r.push(o[n]));let s=e.options.i18n?.messages;return S(s)&&(i=!0,Ot(s,n)&&S(s[n])&&r.push(s[n])),{layers:r,dictPresent:i}}function Nt(e,t){if(!e||!t)return;let n=Dt(t);if(n===``)return;for(let t of Object.keys(e))if(Dt(t)===n)return e[t];let r=n.split(`-`)[0];for(let t of Object.keys(e))if(Dt(t).split(`-`)[0]===r)return e[t]}function Pt(e,t){for(let t of e)if(typeof t==`number`)return t;if(t){for(let[e,n]of Object.entries(t))if(e.startsWith(`$`)&&typeof n==`number`)return n}}function Ft(e,t,n){let r=Pt(t,n);return r===void 0?e[e.length-1]:e[Math.min(Math.max(Math.floor(r),0),e.length-1)]}function It(e,t,n,...r){let i=null,a=r;r.length>=1&&S(r[0])&&(i=r[0],a=[],r.length>1&&!At.has(n)&&(At.add(n),e.logger?.warn(`t("${n}"): 对象参数与位置参数混用不受支持，复数请用 {$count} 通道——位置参数已忽略（ADR-0136）`)));let{layers:o,dictPresent:s}=Mt(e,t,n),c;if(o.length>0){let t=jt(e),n=e.options.i18n??{};for(let e of o)if(c=Nt(e,t)??Nt(e,n.fallback),c!==void 0)break}Array.isArray(c)&&(c=Ft(c,a,i));let l=c==null?n:String(c),u=i?St(l,i):St(l,...a);return c==null&&s&&!kt.has(n)&&(kt.add(n),e.logger?.warn(`t("${n}"): 字典中无当前语言的翻译（语言链与 fallback 均未命中），已按原文返回（ADR-0136）`)),u}function Lt(e){return(t,n,...r)=>It(e,t,n,...r)}var Rt=`autospark/locales`,zt=(e,t,n)=>{let r=e.textContent?.trim();if(!r)return;let i;try{if(i=Function(`return (${r})`)(),!i||typeof i!=`object`||Array.isArray(i)){n.logger.error(`<script type="autospark/locales"> 内容须为字典对象字面量`);return}}catch(e){n.logger.error(`<script type="autospark/locales"> 解析失败: ${e?.message??e}`);return}let a=i;e.hasAttribute(`global`)||!t?Et(n,a):Tt(t,a)},{DirectiveKind:Bt}=AutoSpark;function Vt(){return{name:`locales`,kind:Bt.Compile,created(){let e=this.value;if(e==null||e===``)return;let t=this.binding.read(e);t!=null&&(typeof t!=`object`||Array.isArray(t)?this.engine.logger.warn(`x-locales: 值须为字典对象（原文 → {语言码: 译文}），已忽略: ${typeof t}`):Tt(this.binding,t))}}}function Ht(e){e.translate=Lt(e),jt(e);let t=e.scopes;if(t)for(let e of t.values())e.refresh()}function Ut(){y(e=>{m(e),e.scriptType(Rt,zt),e.directive(Vt()),e.ready(Ht)})}Ut();function Wt(e,t){return h(`getVal`)(e.store.state,t)}var Gt=[`hover`,`always`,`click`],Kt=`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`,C=`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`,qt=`var(--auto-danger-color, var(--autospark-ripple-badge-color, #ef4444))`,Jt=`var(--auto-danger-color, var(--autospark-spin-badge-color, #ef4444))`,Yt=2147483647,Xt=3e3;function w(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function Zt(e,t,n){let r=w(e,`speed`,t,n)??3e3;return r<=0?(t(`${n}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${Xt}`),Xt):r}function Qt(e,t,n){let r=new Set;e?.trigger!==void 0&&(Gt.includes(e.trigger)?r.add(e.trigger):t(`${n}: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let i of Gt){let a=e?.[i];a===!0?r.add(i):a!==void 0&&a!==!1&&t(`${n}: ${i} 开关须为布尔值，已忽略`)}return Gt.find(e=>r.has(e))??`always`}function $t(e,t,n,r){let i=new Set;if(!e)return i;for(let a of t){let t=e[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return i}function en(e,t,n,r,i){if(e)for(let a of t){let t=e[a];t!==void 0&&t!==!1&&r(`${i}: ${a} 是 ${n} 的形态键，已忽略`)}}function tn(e,t,n){let r=e?.badge;return r===void 0||r===!1?0:r===!0?8:typeof r==`number`&&Number.isFinite(r)&&r>0?r:(t(`${n}: badge 须为 true 或正数字（直径 px），已忽略`),0)}function nn(e,t,n,r,i){if(e!==void 0){if(typeof e==`string`&&e.trim()!==``)return e;r(`${i}: color 须为非空字符串，已回退默认色`)}return n>0?t.badgeColor:t.color}function rn(){return`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`}function an(e){return`position:absolute;top:${-e/2}px;right:${-e/2}px;width:${e}px;height:${e}px;border-radius:50%;pointer-events:none;display:block;z-index:${Yt};`}function on(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}var sn=class{static{this.probe=on}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!Wt(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??on)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{circle:a}=t.animations(this.config),o=e=>Math.round(e*10)/10,s=this.insideCarrier.circle;s.style.left=`${o(n-i)}px`,s.style.top=`${o(r-i)}px`,s.style.width=`${o(i*2)}px`,s.style.height=`${o(i*2)}px`,s.style.animation=`none`,s.offsetWidth,s.style.animation=a}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.circle.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}},T=new WeakMap;function cn(e,t){function n(){if(!this.el)return;let e=new sn(t,this.engine,this.info);e.el=this.el,T.set(this,e),e.mounted()}function r(){let e=T.get(this);T.delete(this),e?.unmounted()}function i(e){T.get(this)?.attrChanged(e)}return{name:e,kind:1,priority:0,mounted:n,unmounted:r,attrChanged:i}}function E(e){y(t=>{m(t),t.directive(e)})}var ln=[`glow`,`ring`,`echo`],un=[`ring`,`glow`,`echo`],dn=[`rotate`,`beam`,`chase`],fn={type:`echo`,trigger:`always`,inside:!1,badge:0,color:Kt,size:12,speed:3e3,gap:0},D=`x-ripple`,O=`x-ripple-on`,k=`x-ripple-echo`,pn=`x-ripple-layer`,mn=`x-ripple-badge`,hn=`x-ripple-inside`,gn=`x-ripple-inside-clip`,_n=`x-ripple-inside-circle`,vn=600,yn=.3,bn=!1,A=new Map,j=null;function xn(){if(bn||typeof document>`u`)return;bn=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-ripple`,``),e.textContent=`
:where(.${D}) { position: relative; }
.${D} {
  --x-ripple-color: ${Kt};
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
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
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
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
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
  100% { transform: scale(1); opacity: 0; }`;return j||(j=document.createElement(`style`),j.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(j)),j.textContent+=`\n@keyframes ${r} {${a}\n}`,A.set(t,r),r}function wn(e,t,n){let r=e.offsetWidth,i=e.offsetHeight,a=r/2,o=i/2;if(n){let t=e.getBoundingClientRect();a=n.clientX-t.left,o=n.clientY-t.top}let s=Math.max(a,r-a),c=Math.max(o,i-o);return{x:a,y:o,r:Math.hypot(s,c)}}function Tn(e){return e.trigger===`click`?0:-(e.speed+e.gap)/2}function En(e){return e.trigger===`click`?Math.round(e.size*.6*10)/10:e.size}function Dn(e,t){let n={...fn};if(!e)return n;let r=$t(e,un,t,`x-ripple`);e.type!==void 0&&(un.includes(e.type)?r.add(e.type):t(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let i=ln.find(e=>r.has(e));return i&&(n.type=i),en(e,dn,`x-spin`,t,`x-ripple`),e.inside!==void 0&&(e.inside===!0?n.inside=!0:e.inside!==!1&&t(`x-ripple: inside 开关须为布尔值，已忽略`)),n.trigger=Qt(e,t,`x-ripple`),n.badge=tn(e,t,`x-ripple`),n.inside&&n.badge>0&&(t(`x-ripple: badge 与 inside 互斥，badge 优先（inside 已忽略）`),n.inside=!1),n.color=nn(e.color,{color:Kt,badgeColor:qt},n.badge,t,`x-ripple`),n.size=w(e,`size`,t,`x-ripple`)??fn.size,n.speed=Zt(e,t,`x-ripple`),n.gap=w(e,`gap`,t,`x-ripple`)??0,n.inside&&(r.size>0&&t(`x-ripple: inside 接管渲染，type 形态词表已忽略`),e.size!==void 0&&t(`x-ripple: inside 半径自动几何（起点到最远角），size 已忽略`),e.speed===void 0&&(n.speed=vn)),n}var On={hostClass:D,activeClass:O,layerClass:pn,ensureStyles:xn,normalize:Dn,hostClasses:e=>[...e.badge>0?[mn]:[],...e.inside?[hn]:[]],activeClasses:e=>e.type===`echo`&&!e.inside?[k]:[],animName:e=>Sn(e),animationCss:(e,t)=>`${t} ${e.speed+e.gap}ms ease-out infinite`,period:e=>e.speed+e.gap,layerCount:e=>e.type===`echo`?2:1,layerCssText:e=>e.badge>0?`${an(e.badge)}background:var(--x-ripple-color);`:rn(),applyLayerExtras:(e,t)=>{let n=e[1];n&&(n.style.animationDelay=`${Tn(t)}ms`,n.style.setProperty(`--x-ripple-size`,`${En(t)}px`))},applyVars:(e,t,n)=>{let r=e.style;r.setProperty(`--x-ripple-color`,t.color||`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`),r.setProperty(`--x-ripple-size`,`${t.size}px`),r.setProperty(`--x-ripple-duration`,`${t.speed+t.gap}ms`),r.setProperty(`--x-ripple-anim`,n),r.setProperty(`--x-ripple-echo-delay`,`${Tn(t)}ms`),r.setProperty(`--x-ripple-echo-size`,`${En(t)}px`),t.badge>0&&r.setProperty(`--x-ripple-badge-size`,`${t.badge}px`)},inside:{enabled:e=>e.inside,createCarrier:()=>{let e=document.createElement(`span`);e.className=gn,e.style.cssText=`position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;display:block;`;let t=document.createElement(`span`);return t.className=_n,t.style.cssText=`position:absolute;border-radius:50%;background:var(--x-ripple-color);pointer-events:none;display:block;`,e.append(t),{clip:e,circle:t}},geometry:wn,animations:e=>({circle:`${Cn(e)} ${e.speed+e.gap}ms ease-out infinite`})}};function kn(){E(cn(`ripple`,On))}kn();var An=[`chase`,`rotate`,`beam`],jn=[`rotate`,`beam`,`chase`],Mn=[`ring`,`glow`,`echo`],Nn={type:`beam`,trigger:`always`,badge:0,color:C,size:4,speed:3e3},M=`x-spin`,N=`x-spin-on`,Pn=`x-spin-layer`,Fn=`x-spin-badge`,P=e=>`${M}-${e}`,In=`x-spin-angle`,Ln=!1;function F(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`}}var Rn=`padding:var(--x-spin-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`;function zn(){if(Ln||typeof document>`u`)return;Ln=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spin`,``),e.textContent=`
@property --x-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${In} { to { --x-spin-angle: 360deg; } }
:where(.${M}) { position: relative; }
.${M} {
  --x-spin-color: ${C};
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
}`,document.head.appendChild(e)}function Bn(e,t){let n={...Nn};if(!e)return n;let r=$t(e,jn,t,`x-spin`);e.type!==void 0&&(jn.includes(e.type)?r.add(e.type):t(`x-spin: type 取值非法（${JSON.stringify(e.type)}），已回退 "beam"`));let i=An.find(e=>r.has(e));return i&&(n.type=i),en(e,Mn,`x-ripple`,t,`x-spin`),e.gap!==void 0&&t(`x-spin: gap 仅涟漪支持（x-spin 恒转无静止段），已忽略`),n.trigger=Qt(e,t,`x-spin`),n.badge=tn(e,t,`x-spin`),n.color=nn(e.color,{color:C,badgeColor:Jt},n.badge,t,`x-spin`),n.size=w(e,`size`,t,`x-spin`)??Nn.size,n.speed=Zt(e,t,`x-spin`),n}var Vn={hostClass:M,activeClass:N,layerClass:Pn,ensureStyles:zn,normalize:Bn,hostClasses:e=>[P(e.type),...e.badge>0?[Fn]:[]],activeClasses:()=>[],animName:()=>In,animationCss:(e,t)=>`${t} ${e.speed}ms linear infinite`,period:e=>e.speed,layerCount:()=>1,layerCssText:e=>e.badge>0?`${an(e.badge)}${Rn}background:${F(e.type)};`:`${rn()}${Rn}background:${F(e.type)};`,applyVars:(e,t)=>{let n=e.style;n.setProperty(`--x-spin-color`,t.color||`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`),n.setProperty(`--x-spin-size`,`${t.size}px`),n.setProperty(`--x-spin-duration`,`${t.speed}ms`),t.badge>0&&n.setProperty(`--x-spin-badge-size`,`${t.badge}px`)}};function Hn(){E(cn(`spin`,Vn))}Hn();var I={axis:`both`,width:12,thumbWidth:5,color:`var(--autospark-scrollbar-color, rgba(0,0,0,0.25))`,delay:300,fadeDuration:200,minSize:20},Un=.25,L=`x-scrollbar`,R=`x-scrollbar-visible`,z=`x-scrollbar-active-x`,B=`x-scrollbar-active-y`,V=`x-scrollbar-rail`,H=`x-scrollbar-rail-x`,U=`x-scrollbar-rail-y`,W=`x-scrollbar-thumb`,G=`x-scrollbar-thumb-drag`,Wn=!1;function Gn(){if(Wn||typeof document>`u`)return;Wn=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-scrollbar`,``),e.textContent=`
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
}`,document.head.appendChild(e)}function Kn(e,t){let n={...I};if(!e)return n;let r=new Set;for(let n of[`x`,`y`]){let i=e[n];i===!0?r.add(n):i!==void 0&&i!==!1&&t(`x-scrollbar: ${n} 开关须为布尔值，已忽略`)}return r.size===1&&(n.axis=r.has(`x`)?`x`:`y`),n.width=w(e,`width`,t,`x-scrollbar`)??I.width,n.thumbWidth=w(e,`thumbWidth`,t,`x-scrollbar`)??I.thumbWidth,n.delay=w(e,`delay`,t,`x-scrollbar`)??I.delay,n.minSize=w(e,`minSize`,t,`x-scrollbar`)??I.minSize,n.fadeDuration=w(e,`fadeDuration`,t,`x-scrollbar`)??I.fadeDuration,e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-scrollbar: color 须为非空字符串，已回退默认色`)),n}var qn=class e{static scheduleFrame(e){return requestAnimationFrame(e)}static cancelFrame(e){cancelAnimationFrame(e)}constructor(e,t){this.alive=!0,this.enabled=!0,this.drag=null,this.railX=null,this.railY=null,this.thumbX=null,this.thumbY=null,this.hideTimer=null,this.ro=null,this.valueOff=null,this.offs=[],this.wheel=null,this.engine=e,this.info=t,this.value=t?.value,this.config=Kn(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(Gn(),this.applyVars(),this.bindValue(),this.enabled&&this.setup())}unmounted(){this.teardown(),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}if(this.value===`false`){this.setEnabled(!1);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!Wt(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.setup():this.teardown())}setup(){let e=this.el;e&&!this.railY&&(e.classList.add(L),this.applyVars(),this.buildRails(),this.bindEvents(),typeof ResizeObserver<`u`&&(this.ro=new ResizeObserver(()=>this.refresh()),this.ro.observe(e)),setTimeout(()=>this.refresh(),0),this.refresh())}teardown(){this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=null,this.wheel&&=(this.wheel.raf&&e.cancelFrame(this.wheel.raf),null),this.ro?.disconnect(),this.ro=null;for(let e of this.offs)e();this.offs=[],this.endDrag(!0),this.railX?.remove(),this.railY?.remove(),this.railX=this.railY=this.thumbX=this.thumbY=null,this.el?.classList.remove(L,R,z,B)}buildRails(){let e=e=>{let t=document.createElement(`span`);t.className=`${V} ${e}`;let n=document.createElement(`span`);return n.className=W,t.appendChild(n),this.el.appendChild(t),{rail:t,thumb:n}},t=e(U);this.railY=t.rail,this.thumbY=t.thumb;let n=e(H);this.railX=n.rail,this.thumbX=n.thumb}applyVars(){let e=this.el.style;e.setProperty(`--x-scrollbar-width`,`${this.config.width}px`),e.setProperty(`--x-scrollbar-thumb`,`${this.config.thumbWidth}px`),e.setProperty(`--x-scrollbar-color`,this.config.color),e.setProperty(`--x-scrollbar-fade`,`${this.config.fadeDuration}ms`)}listen(e,t,n){e.addEventListener(t,n),this.offs.push(()=>e.removeEventListener(t,n))}bindEvents(){let e=this.el;this.listen(e,`mouseenter`,()=>{this.refresh(),this.show()}),this.listen(e,`mouseleave`,()=>this.scheduleHide()),this.listen(e,`scroll`,()=>{this.drag||this.wheel||(this.updateThumb(`y`),this.updateThumb(`x`))}),this.bindWheel(),this.bindRail(`y`,this.railY,this.thumbY),this.bindRail(`x`,this.railX,this.thumbX)}bindWheel(){this.listen(this.el,`wheel`,e=>{if(e.ctrlKey||this.drag)return;let t=this.el,n=e.deltaMode===1?16:1,r=e.deltaY*n,i=e.deltaX*n,a=t.scrollHeight-t.clientHeight,o=t.scrollWidth-t.clientWidth,s=r!==0&&a>0&&!(r<0&&t.scrollTop<=0)&&!(r>0&&t.scrollTop>=a),c=i!==0&&o>0&&!(i<0&&t.scrollLeft<=0)&&!(i>0&&t.scrollLeft>=o);if(!s&&!c)return;e.preventDefault();let l=this.wheel??={tx:t.scrollLeft,ty:t.scrollTop,raf:0};s&&(l.ty=Math.min(Math.max(l.ty+r,0),a)),c&&(l.tx=Math.min(Math.max(l.tx+i,0),o)),l.raf===0&&this.runWheel()})}runWheel(){let t=this.wheel,n=()=>{t.raf=0;let r=this.el;if(!r||!this.enabled||!this.wheel){this.wheel=null;return}let i=!0,a=t.ty-r.scrollTop;Math.abs(a)>=1?(r.scrollTop+=a*Un,i=!1):a!==0&&(r.scrollTop=t.ty);let o=t.tx-r.scrollLeft;Math.abs(o)>=1?(r.scrollLeft+=o*Un,i=!1):o!==0&&(r.scrollLeft=t.tx),this.updateThumb(`y`),this.updateThumb(`x`),i?this.wheel=null:t.raf=e.scheduleFrame(n)};t.raf=e.scheduleFrame(n)}bindRail(e,t,n){this.listen(n,`pointerdown`,r=>this.dragStart(e,r,n,t)),this.listen(n,`pointermove`,e=>this.dragMove(e)),this.listen(n,`pointerup`,e=>this.dragEnd(e)),this.listen(n,`pointercancel`,()=>this.endDrag(!0)),this.listen(t,`pointerdown`,r=>{if(r.button!==0||r.target!==t)return;r.preventDefault();let i=this.el,a=t.getBoundingClientRect(),o=e===`y`?r.clientY-a.top:r.clientX-a.left,s=e===`y`?n.offsetTop:n.offsetLeft,c=e===`y`?i.clientHeight:i.clientWidth;e===`y`?i.scrollTop+=o<s?-c:c:i.scrollLeft+=o<s?-c:c,this.updateThumb(`y`),this.updateThumb(`x`)})}refresh(){if(!this.enabled||!this.el)return;let e=this.el,t=this.config.axis!==`x`&&e.clientHeight>0&&e.scrollHeight>e.clientHeight,n=this.config.axis!==`y`&&e.clientWidth>0&&e.scrollWidth>e.clientWidth;e.classList.toggle(B,t),e.classList.toggle(z,n),t&&this.updateThumb(`y`),n&&this.updateThumb(`x`)}updateThumb(e){let t=this.el,n=e===`y`?this.railY:this.railX,r=e===`y`?this.thumbY:this.thumbX;if(!t||!n||!r)return;let i=e===`y`?t.clientHeight:t.clientWidth,a=e===`y`?t.scrollHeight:t.scrollWidth,o=e===`y`?t.scrollTop:t.scrollLeft;if(a<=i)return;let s=e===`y`?n.offsetHeight:n.offsetWidth;if(s<=0)return;let c=Math.round(Math.min(s,Math.max(this.config.minSize,i/a*s))),l=a-i,u=Math.round(o/l*(s-c));n.style.transform=`translate(${t.scrollLeft}px, ${t.scrollTop}px)`,e===`y`?(r.style.height=`${c}px`,r.style.top=`${u}px`):(r.style.width=`${c}px`,r.style.left=`${u}px`)}show(){this.hideTimer!=null&&(clearTimeout(this.hideTimer),this.hideTimer=null),this.el?.classList.add(R)}scheduleHide(){this.drag||(this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=setTimeout(()=>{this.hideTimer=null,this.el?.classList.remove(R)},this.config.delay))}dragStart(e,t,n,r){if(t.button!==0||this.drag)return;t.preventDefault(),this.show();let i=e===`y`?r.offsetHeight:r.offsetWidth;this.drag={axis:e,pointerId:t.pointerId,start:e===`y`?t.clientY:t.clientX,startScroll:e===`y`?this.el.scrollTop:this.el.scrollLeft,railLen:i,thumbLen:e===`y`?n.offsetHeight:n.offsetWidth,thumb:n},n.classList.add(G);try{n.setPointerCapture(t.pointerId)}catch{}}dragMove(e){let t=this.drag;if(!t||e.pointerId!==t.pointerId)return;let n=this.el,r=t.axis,i=r===`y`?n.clientHeight:n.clientWidth,a=r===`y`?n.scrollHeight:n.scrollWidth,o=t.railLen-t.thumbLen;if(o<=0)return;let s=(r===`y`?e.clientY:e.clientX)-t.start,c=t.startScroll+s/o*(a-i);r===`y`?n.scrollTop=c:n.scrollLeft=c,this.updateThumb(`y`),this.updateThumb(`x`),this.updateThumb(r===`y`?`x`:`y`)}dragEnd(e){if(!this.drag||e.pointerId!==this.drag.pointerId)return;this.endDrag(!1);let t=this.el.getBoundingClientRect();e.clientX>=t.left&&e.clientX<=t.right&&e.clientY>=t.top&&e.clientY<=t.bottom?this.show():this.scheduleHide()}endDrag(e){let t=this.drag;if(t){this.drag=null,t.thumb.classList.remove(G);try{t.thumb.releasePointerCapture(t.pointerId)}catch{}e||this.refresh()}}},K=new WeakMap;function Jn(){function e(){if(!this.el)return;let e=new qn(this.engine,this.info);e.el=this.el,K.set(this,e),e.mounted()}function t(){let e=K.get(this);K.delete(this),e?.unmounted()}function n(e){K.get(this)?.attrChanged(e)}return{name:`scrollbar`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function Yn(){E(Jn())}Yn();var Xn={type:`dot`,overflowCount:99,color:`var(--auto-danger-color, var(--autospark-badge-color, #ef4444))`,ripple:!1},q=`x-badge`,J=`x-badge-mark`,Zn=`x-badge-dot`,Qn=`x-badge-count`,Y=`x-badge-ripple`,$n=`x-badge-waves`,er=!1;function tr(){if(er||typeof document>`u`)return;er=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-badge`,``),e.textContent=`
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
}`,document.head.appendChild(e)}function nr(e,t){let n={...Xn};if(!e)return n;e.type!==void 0&&(e.type===`dot`||e.type===`count`?n.type=e.type:e.type!==!0&&e.type!==!1&&t(`x-badge: type 须为 'dot' | 'count'，已回退默认 '${Xn.type}'`));let r=e.count===!0?`count`:e.dot===!0?`dot`:null;r&&(e.type===void 0||typeof e.type==`boolean`)&&(n.type=r);let i=w(e,`overflowCount`,t,`x-badge`);if(i!==void 0){let e=Math.floor(i);e>0?n.overflowCount=e:t(`x-badge: overflowCount 须为正数，已回退默认 ${Xn.overflowCount}`)}return e.ripple!==void 0&&(typeof e.ripple==`boolean`?n.ripple=e.ripple:t(`x-badge: ripple 须为布尔值，已忽略`)),e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-badge: color 须为非空字符串，已回退默认色`)),n}var rr=class{constructor(e,t){this.alive=!0,this.mark=null,this.valueOff=null,this.reducedMotion=typeof matchMedia==`function`&&matchMedia(`(prefers-reduced-motion: reduce)`).matches,this.engine=e,this.info=t,this.value=t?.value,this.config=nr(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(tr(),this.el.classList.add(q),this.applyVars(),this.bindValue())}unmounted(){this.unmountMark(),this.el?.classList.remove(q),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.render(void 0);return}if(/^\d+$/.test(this.value.trim())){this.render(Number(this.value));return}let e=this.value,t=({value:e})=>{this.alive&&this.render(e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.render(r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.render(Wt(this.engine,e))}}render(e){let t=Number(e);if(e==null||e===``||e===!1||!Number.isFinite(t)||t<=0){this.config.type===`dot`&&this.value==null?this.mountMark():this.unmountMark();return}if(this.config.type===`dot`){this.mountMark();return}this.mountMark();let{overflowCount:n}=this.config;this.mark.textContent=t>n?`${n}+`:String(t)}mountMark(){if(this.mark)return;let{type:e,ripple:t}=this.config,n=document.createElement(`span`);n.className=`${J} ${e===`count`?Qn:Zn}`,n.setAttribute(`aria-hidden`,`true`),t&&n.classList.add(Y),e===`dot`&&t&&!this.reducedMotion&&n.insertAdjacentHTML(`afterbegin`,ir()),this.el.appendChild(n),this.mark=n}unmountMark(){this.mark?.remove(),this.mark=null}applyVars(){this.el.style.setProperty(`--x-badge-color`,this.config.color)}};function ir(){let e=e=>`<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.35"><animate attributeName="r" values="4;11" dur="2s" begin="${e}" repeatCount="indefinite" /><animate attributeName="fill-opacity" values="0.35;0" dur="2s" begin="${e}" repeatCount="indefinite" /></circle>`;return`<svg class="${$n}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`+e(`0s`)+e(`-1s`)+`</svg>`}var X=new WeakMap;function ar(){function e(){if(!this.el)return;let e=new rr(this.engine,this.info);e.el=this.el,X.set(this,e),e.mounted()}function t(){let e=X.get(this);X.delete(this),e?.unmounted()}function n(e){X.get(this)?.attrChanged(e)}return{name:`badge`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function or(){E(ar())}or();function Z(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function Q(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function $(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var sr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主，根上的动态
    绑定不会求值——布局变体绑定全部落在编译子树内层 body 上（:data-vertical /
    :data-block / :data-fused / :style gap），宿主级 block 布局经 :has() 驱动。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - change：选中模式（x-model 在场）点击子钮切换后冒泡，detail = { value: 新组值 }——
      表单同步惯用法：外层包裹元素 @change="v = $event.detail.value"
-->
<!-- 元素名快速写法 <x-button-group> 由 index.ts 的 precompile DOM 变换承载：组变换
     须先于 button 变换执行（聚合入口 import 顺序 + 脚本加载顺序契约），承担子钮
     缺省下发（variant/type/disabled）与 data-value stamp（选中模式子钮身份） -->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键，名即通道）——宿主化身根物化为同名 data-* 属性，级联整组子钮形成局部主题
     （正好承担「一组统一档位」通道）。组件 data() 不得声明这六键；组无自有视觉盒
     （布局容器），无暗色兜底字面值需求——视觉全由子钮承担 -->
<div
  class="asc-button-group"
  x-define="autospark.button-group"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            gap: 0,            // 子钮间隔（number 按 px / 字符串原样作 CSS gap 值）；0（缺省）即融合
            vertical: false,   // 垂直组合（融合轴自动换上下边线/上下圆角）
            block: false,      // 容器占满父宽（不强制子钮等分——等分需求使用者自行 CSS）
            value: "",         // 受控选中值（选中模式的当前子钮 data-value；props 单向驱动视觉）
            modelBound: false, // x-model 在场标记（precompile 检测 x-model 属性塞入——内部键非公开 API；
                               // true 时激活选中协调：单选排他 + 组值桥 + 隐藏 input）
        }),
        mounted() {
            // 选中协调激活（ADR-0014 决策 4/6——ADR-0012 决策 3 checkable 半双工家族范式移植）：
            // x-model 在场（modelBound）**或**显式受控 value（props 单向 + 点击翻转 + change
            // 冒泡）——两者皆无 = 纯布局组（工具栏用法），本块整体不激活：无选中态、无点击协调。
            // el.value 劫持桥与隐藏 input 仅 modelBound 场景（组值回写 state 与表单提交载体）。
            const bound = !!this.data.modelBound || (this.data.value != null && this.data.value !== "");
            if (!bound) return;

            // 子钮查询（data-value stamp 通道，index.ts precompile 落的属性）
            const buttons = () => Array.from(this.el.querySelectorAll(".asc-button"));

            // 当前选中值（字符串语域——组值是子钮 data-value 字符串，区别于 button checkable
            // 桥的布尔语域）
            let current = "";

            // 隐藏 input（仅 modelBound）：表单提交载体（name 有则透传、value = 选中值、display:none）
            let real = null;

            // 选中标记迁移：组自有 class（不碰子钮 checkable 的 asc-checked 通道，两机制零冲突）；
            // 选中视觉 = tone 实底反白（CSS 内消费子钮作用域已算好的 --asc-tone）
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
                // el.value 劫持：div 无原生 value，劫持前快照 expando（x-model 编译期可能已写入初值）
                const prior = this.el.value;
                if (typeof prior === "string" && prior !== "") current = prior;
                Object.defineProperty(this.el, "value", {
                    get: () => current,
                    set: (v) => { current = String(v ?? ""); applySel(current); },
                    configurable: true,
                });
            }

            // 一跳首对齐（mounted 时化身子树与 props 均可能未就位，button 家族惯例）：
            // current 为空（无 x-model 初值）时重读 props value（晚注入场景），再迁移选中标记
            setTimeout(() => {
                const dv = this.data.value;
                if (current === "" && dv != null && dv !== "") current = String(dv);
                applySel(current);
            }, 0);

            // props value 受控通道（无 x-model 时亦生效）：单向驱动视觉——同值短路防循环；
            // 空值跳过（x-model 场景未声明 value prop，data.value 缺省 "" 不得清空选中）
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法）
            this.watch("value", ({ value: v }) => {
                if (v == null || v === "") return;
                const s = String(v);
                if (s !== current) { current = s; applySel(s); }
            });

            // 点击选中（组根委托）：命中子钮读 data-value；无值钮不参与；已选不反选（radio 语义）；
            // 翻转后 modelBound 场景派发 input（x-model 回写，监听在宿主自身），恒派发 change
            // （冒泡 detail={value}，外层 @change="v = $event.detail.value" 一行回写）
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
      vertical-align: middle; /* inline-flex 行内基线对齐修正（子钮行内元素惯例） */
      max-width: 100%;
    }
    /* 布局容器：body 是编译子树内层（绑定可求值），子钮经 items 的 display:contents
         直接成为 body 的 flex 项（x-for 克隆载体同款技巧——出口盒不产生布局盒；
         x-slot 出口元素保留为真实包裹层不剥标签，ADR-0056——无此规则则子钮嵌在
         出口 span 内：融合相邻选择器不命中、gap/等高拉伸全部失效） */
    .asc-button-group-body {
      display: flex;
      align-items: stretch; /* 水平融合等高 / 垂直融合等宽 */
      width: 100%;
      min-width: 0;
    }
    /* 默认插槽出口盒不产生布局盒：子钮穿透为 body 的直接 flex 项 */
    .asc-button-group-items {
      display: contents;
    }
    /* 垂直组合：换轴（融合轴随 data-vertical 自动切换，见下方融合规则） */
    .asc-button-group-body[data-vertical="true"] {
      flex-direction: column;
    }
    /* block：容器占满父宽（子钮不强制等分——等分需求使用者自行 CSS） */
    .asc-button-group:has(> .asc-button-group-body[data-block="true"]) {
      display: flex;
      width: 100%;
    }
    /* 间隔：gap 经 :style 内联承载（number 按 px / 字符串原样，indent 同款惯例），
         data-fused 仅在 gap 假值（缺省 0）时在场（绑定假值移除） */

    /* ---------- 融合（gap=0，ADR-0014 决策 2）：相邻子钮侧圆角清除 + 负 margin 边线复用 ---------- */
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
    /* 垂直：融合轴换上下（有后邻清下侧、有前邻清上侧并压叠） */
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

    /* ---------- 选中视觉（选中模式，ADR-0014 决策 7）：tone 实底反白（solid 语义） ---------- */
    /* 组自有 class 驱动（区别于子钮 checkable 的 asc-checked）；--asc-tone 在子钮作用域
         由其 data-type 决定（组级 type 下发后语义色正确），暗色经变量链自适应无需兜底 */
    .asc-button-group .asc-button.asc-group-checked {
      --asc-bg: var(--asc-tone) !important;
      --asc-ink: #fff !important;
      --asc-line: transparent !important;
    }
  </style>
  <!-- 布局变体绑定全在本层（根上动态绑定不求值，T4=B）；gap 双形态经 :style 内联
         （number 按 px / 字符串原样）；data-fused 绑定假值（gap=0 时 !gap 为 true） -->
  <span
    class="asc-button-group-body"
    :data-vertical="vertical"
    :data-block="block"
    :data-fused="!gap"
    :style="gap ? { gap: (typeof gap === 'number' ? gap + 'px' : gap) } : undefined"
  >
    <!-- 默认插槽出口：子钮（x-button 变换后的 button 元素）投影于此；display:contents
             使子钮直接成为 body 的 flex 项（融合/间隔/stretch 作用于子钮本身） -->
    <span class="asc-button-group-items" x-slot></span>
  </span>
</div>
`,cr=`autospark.button-group`,lr=[`variant`,`type`,`disabled`],ur=new Set([`vertical`,`block`]);function dr(e){e.components[cr]=sr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button-group`))){let e=Array.from(t.querySelectorAll(`x-button`)).filter(e=>e.closest(`x-button-group`)===t),n=new Map;for(let e of lr)t.hasAttribute(e)&&n.set(e,t.getAttribute(e)),t.hasAttribute(`:${e}`)&&n.set(`:${e}`,t.getAttribute(`:${e}`));for(let t of e){let e=t.getAttribute(`value`);e!=null&&t.setAttribute(`data-value`,e);for(let[e,r]of n)t.hasAttribute(e)||t.hasAttribute(`:${e.slice(1)}`)||t.setAttribute(e,e.startsWith(`:`)?r:e===`disabled`?`true`:r)}let r=document.createElement(`div`),i=[];for(let e of Array.from(t.attributes)){if(e.name.startsWith(`:`)){i.push(`${Q(Z(e.name.slice(1)))}: (${e.value})`);continue}if(e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)){r.setAttribute(e.name,e.value);continue}let t=Z(e.name),n=e.value===``&&ur.has(t)?!0:$(e.value);i.push(`${Q(t)}: ${JSON.stringify(n)}`)}for(t.hasAttribute(`x-model`)&&i.push(`modelBound: true`),r.setAttribute(`x-component:${cr}`,`{ ${i.join(`, `)} }`);t.firstChild;)r.appendChild(t.firstChild);t.replaceWith(r)}})}fr();function fr(){y(e=>{m(e),dr(e)})}var pr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层元素上：宿主级外观（底色/边框/圆角等）经 body 上的 data-* 变体属性以 :has()
    驱动，body 自身的布局变体（对齐/纵排）直接命中 body 选择器；原生 disabled 语义
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - tag-click：tags 小圆钮点击冒泡，detail = { name, label, value, tag }（tag 元素上
      stopPropagation 阻断冒泡）。勾选/多态切换类需求由 autospark.state-button 承接
    （ADR-0016：button 已取消 checkable 特性，迁移动作见该 ADR 后果节）
-->
<!-- 元素名快速写法 <x-button variant="primary" label="..."> 由 index.ts 的 precompile
     DOM 变换承载（ADR-0117 元名形态对全局表惰性组件有时序缺口，见 index.ts 注释） -->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）——宿主化身根物化为同名 data-* 属性，接通 @autospark/theme 手动通道 CSS
     形成局部主题；base 缺省不写属性（继承祖先档位），theme 不在场静默无效。
     button 不得在 data() 重复声明这六键（子胜会静默击穿主题通道），裸名 size/dark 等留作
     组件自有语义；组件内部变体属性亦禁用这六个通道名（theme 在场时会被档位块意外命中） -->
<button
  class="asc-button"
  x-define="autospark.button"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            variant: "default",     // 形态：default 常规描边 | primary 实底 | secondary 次底 | dashed 虚线 | text 文本 | link 链接
            type: "primary",        // 语义色：primary | success | warning | danger | info（default 形态不消费）
            label: "按钮",          // 兜底文案（插槽无内容时显示；labelPos none 时隐藏并自动转入悬停提示）
            labelPos: "right",       // label 在 icon 的哪侧：right 左图标右文字（默认）| left 右图标左文字（与 tags 互换）| top 文字上 | bottom 文字下 | none 不显示文字（label 转悬停提示）
            icon: "",               // 图标名或图标选项对象 { name, size, color, strokeWidth, padding, button, pointer }（对齐 x-icon-options 词面，ADR-0135 后不含 shape）+ 自有角标键 badge（伪元素红点，标量三形态控板距；loading 时被替换）
            loading: false,         // 加载态：左图标位转圈并禁点（优先于 disabled 视觉）
            ghost: false,           // 幽灵：背景透明、内容取语义色（常用在有色背景上）
            border: false,          // 装饰性附加边框（不干预 dashed / ghost 的固有边框形态）
            block: false,           // 适配父宽度
            disabled: false,
            ripple: true,           // 点击涟漪（默认开启；页面需已加载 autospark.ripple.js，未加载时静默跳过；ADR-0010）
            autoInsertSpace: true,  // label 恰为两个汉字时自动插入空格
            shape: "default",       // default | circle（纯图标呈正圆，带文字自动呈胶囊）
            wrap: false,            // label 换行：false 单行溢出省略号（截断时自动挂 title，宿主显式 title 优先）；true 折行（按钮高度随行数增长）
            align: "center",        // 内容水平对齐：left | center | right
            indent: 0,              // 内容额外左缩进（数字 px 或任意 CSS 值如 "2em"）；菜单层级缩进常用
            memo: "",               // label 下方的备注（小一号、淡色）
            tags: [],               // 右侧小圆钮 {icon?, label?, tooltip?, styles?(cssText), classes?, value?, checkable?, checkValues?, shape?}[]——label 呈胶囊（图标与文字恒 1rem）；value 原样透传进 tag-click detail（checkable 时兼勾选载体：=== 真值即 checked，点击翻转）；checkValues 缺省 [true,false] 真值在前；shape 默认 none 无背景，circle/radius 呈底板
            menu: false,            // 菜单项形态：占满宽、透明底、左对齐、hover 淡底
            // computed 简写（普通函数值即计算属性，仅限单表达式）：autoInsertSpace 开启且
            // label 恰为两个汉字时中间插入空格
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label
        }),
        methods: {
            // tag 勾选值域：checkValues 逐项回退 [true, false]（真值在前）；
            // ?? 只对 null/undefined 回退——checkValues: [0, 1] 的假值真值 0 不受影响，
            // 残缺（如仅 [x]）时缺的项单独回退。模板 :data-checked 为内联表达式同款判定：
            // 属性绑定求值域不含组件 methods（宽松求值 undefined → 静默移除），方法仅供事件通道
            tagCheckValues(tag) {
                return [tag.checkValues?.[0] ?? true, tag.checkValues?.[1] ?? false];
            },
            // tag 小圆钮点击：阻断冒泡，冒泡 tag-click——detail 平铺
            // name（标识）/ label（文字）/ value（使用者数据，原样透传不做处理）+ tag 整对象。
            // checkable：点击翻转 value（真值 ↔ 假值）——tag 为 tags 数组项的响应式代理，
            // 赋值穿透到外部状态（tags 为引用注入），data-checked 绑定随之重算；tag-click
            // 的 detail.value 即切换后新值
            onTagClick(tag, event) {
                event.stopPropagation();
                if (tag.checkable) {
                    const vals = this.tagCheckValues(tag);
                    tag.value = tag.value === vals[0] ? vals[1] : vals[0];
                }
                this.el.dispatchEvent(new CustomEvent("tag-click", { bubbles: true, detail: { name: tag.name, label: tag.label, value: tag.value, tag } }));
            }
        },
        mounted() {
            // 原生 disabled 同步（loading 即禁点）；后续 props 变化经 watch 保持同步
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法见 overlay/foldable.ts）
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };
            syncDisabled();
            this.watch("disabled", ({ value }) => { syncDisabled(); });
            this.watch("loading", ({ value }) => { syncDisabled(); });

            // icon 对象形态的视觉透传（与 x-icon 原生内联实现等价）：size/color/padding 直写内联样式、
            // strokeWidth 经 --as-icon-sw 变量、badge 走角标类（CSS 伪元素红点 + 板 padding）；
            // watch 回调一跳后写（x-if 渲染与回调的 flush 时序不保证先后）
            const syncIconStyle = () => {
                const i = this.data.icon;
                const span = this.el.querySelector(".asc-button-icon");
                if (!span) return;
                for (const k of ["width", "height", "color", "padding"]) span.style.removeProperty(k);
                span.style.removeProperty("--as-icon-sw");
                span.classList.remove("asc-button-icon-badge");
                if (typeof i !== "object" || !i) return;
                if (i.size != null) {
                    const px = typeof i.size === "number" ? i.size + "px" : i.size;
                    span.style.width = px;
                    span.style.height = px;
                }
                if (typeof i.color === "string" && i.color.trim() !== "") span.style.color = i.color;
                if (i.strokeWidth != null) span.style.setProperty("--as-icon-sw", String(i.strokeWidth));
                if (i.padding != null) span.style.padding = typeof i.padding === "number" ? i.padding + "px" : i.padding;
                // badge（x-icon 同款标量三形态）：true（缺省板距）/ number 板距 px / string CSS 值——形态即启用
                if (i.badge === true) { span.classList.add("asc-button-icon-badge"); span.style.padding = "2px"; }
                else if (typeof i.badge === "number") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge + "px"; }
                else if (typeof i.badge === "string" && i.badge.trim() !== "") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge; }
            };
            setTimeout(syncIconStyle, 0); // mounted 时化身子树可能尚未挂载（span 不可查），一跳后再同步
            this.watch("icon", () => { setTimeout(syncIconStyle, 0); });

            // label 溢出自动挂提示（ADR-0012 补记，双轨修订）：纯静态检测——mounted 一跳首查 +
            // label / wrap 变化时重查，不引入 ResizeObserver（按钮为高频组件，零观察资源；容器宽度
            // 单独变化后提示可能过期为已知温和妥协，CSS 截断本身自适应不受影响）。
            // 挂载属性双轨（与 x-bind title 重定向同判定口径）：tooltip 特性在场（engine.tooltip?.enabled，
            // autospark.tooltip.js 已加载）→ 挂 data-tooltip（插件接管、样式统一）；缺席 → 挂原生 title
            // （浏览器黄框兜底）。挂/摘规则：仅截断态挂（scrollWidth > clientWidth）、宿主显式
            // title/data-tooltip 永不覆盖、溢出消失只摘自挂的（闭包标记）
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";
            let selfTip = false;
            const syncTip = () => {
                // labelPos none：label 不渲染（main 整体隐藏）——宿主无显式提示时 label 文本转挂（双轨同 attr）
                if (this.data.labelPos === "none") {
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖
                    this.el.setAttribute(tipAttr, String(this.data.label ?? ""));
                    selfTip = true;
                    return;
                }
                const span = this.el.querySelector(".asc-button-label");
                if (!span) return;
                if (span.scrollWidth > span.clientWidth) {
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖
                    this.el.setAttribute(tipAttr, span.textContent); // label 变文本后仍溢出 → 同步换新文本
                    selfTip = true;
                } else if (selfTip) {
                    this.el.removeAttribute(tipAttr);
                    selfTip = false;
                }
            };
            setTimeout(syncTip, 0);
            this.watch("label", () => { setTimeout(syncTip, 0); });
            this.watch("wrap", () => { setTimeout(syncTip, 0); });
            this.watch("labelPos", () => { setTimeout(syncTip, 0); });

            // checkable 桥已随 ADR-0016 整体移除（button 取消 checkable 特性——机制由
            // autospark.state-button 继承骨架后自持，迁移动作见 ADR-0016 后果节）

            // 涟漪动态挂载（ADR-0010 运行时契约：不经编译、直接写属性即生效）；
            // 配置走 x-ripple-options 通道（裸 x-ripple 的值只参与三态判定、不承载配置）；
            // ripple 即该配置的 props 值：false 不启用；启用时缺省 { trigger: "click", inside: true }
            // （点击播一个周期自止、约束按钮内部），对象形态全键可覆盖缺省；
            // options 运行时改值无效（ADR-0010 决策 7）——变化时先摘 x-ripple 触发重挂再重读；
            // 需页面已加载 autospark.ripple.js，未加载时属性无人消费、静默无害
            const syncRipple = () => {
                const conf = this.data.ripple;
                this.el.removeAttribute("x-ripple");
                this.el.removeAttribute("x-ripple-options");
                if (conf) {
                    this.el.setAttribute("x-ripple-options", JSON.stringify(typeof conf === "object" ? { trigger: "click", inside: true, ...conf } : { trigger: "click", inside: true }));
                    this.el.setAttribute("x-ripple", "");
                }
            };
            syncRipple();
            this.watch("ripple", () => { syncRipple(); });
        },
    }
  <\/script>
  <style global id="autospark-components-button">
    .asc-button {
      --asc-tone: var(
        --auto-primary-color,
        var(--asc-button-primary, #009aff)
      ); /* 语义色中转（data-type 注入） */
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      --asc-line: transparent;
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-button-padding, 0.8rem));
      display: inline-flex;
      border: var(--auto-border-size, var(--asc-button-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(
        --auto-border-radius,
        var(--asc-button-radius, 0.5rem)
      );
      background: var(--asc-bg);
      color: var(--asc-ink);
      font: inherit;
      font-size: var(--auto-font-size, var(--asc-button-font-size, 0.875rem));
      line-height: 1.4;
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.8);
      cursor: pointer;
      user-select: none;
      transition:
        filter 0.15s ease,
        background-color 0.15s ease;
    }
    .asc-button:has(> .asc-button-body[data-border="true"]) {
      --asc-line: var(
        --auto-border-color,
        var(--asc-button-border-color, #d9d9d9)
      );
    }

    .asc-button:has(> .asc-button-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #009aff));
    }
    .asc-button:has(> .asc-button-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #22c55e));
    }
    .asc-button:has(> .asc-button-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f59e0b));
    }
    .asc-button:has(> .asc-button-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #ef4444));
    }
    .asc-button:has(> .asc-button-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #71717a));
    }
    .asc-button:has(> .asc-button-body[data-variant="default"]) {
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #ffffff));
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
    }
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="success"]
    ),
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="warning"]
    ),
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="danger"]
    ),
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="info"]
    ) {
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
    }
    .asc-button:has(> .asc-button-body[data-variant="primary"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
    }
    /* secondary：次级底 + 正文色（描边交给 border 开关） */
    .asc-button:has(> .asc-button-body[data-variant="secondary"]) {
      --asc-bg: var(
        --auto-secondary-bgcolor,
        var(--asc-button-bg, rgba(245, 245, 245, 0.45))
      );
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
    }
    /* dashed：透明底 + 语义色虚线边 + 语义色字 */
    .asc-button:has(> .asc-button-body[data-variant="dashed"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
      border-style: dashed;
    }
    /* text：透明底 + 正文色 */
    .asc-button:has(> .asc-button-body[data-variant="text"]) {
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);
    }
    /* link：透明底 + 语义色字、无内距（inline 链接感） */
    .asc-button:has(> .asc-button-body[data-variant="link"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      padding: 0;
    }

    /* ---------- 幽灵（ghost）：透明底 + 语义色内容/描边，可与任意形态组合 ---------- */
    .asc-button:has(> .asc-button-body[data-ghost="true"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
    }

    /* ---------- 菜单项形态（menu）：占满宽、透明底、左对齐、hover 淡底 ---------- */
    .asc-button:has(> .asc-button-body[data-menu="true"]) {
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      display: flex;
      width: 100%;
      border-radius: var(
        --auto-border-radius,
        var(--asc-button-radius, 0.375rem)
      );
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);
      text-align: left;
    }

    /* ---------- 勾选渲染（checkStyle 四形态）已随 ADR-0016 整体移除 ----------
       装饰渲染（solid/icon/corner/ripple）由 autospark.state-button 的 styles 自持
       （decorate 项键语义，宿主 class 通道），本组件不再携带任何勾选视觉 */

    /* ---------- 形状（shape）：circle 恒胶囊半径——纯图标时内容等宽高自然呈正圆，带文字自动胶囊 ---------- */
    .asc-button:has(> .asc-button-body[data-shape="circle"]) {
      border-radius: 9999px;
      padding: calc(var(--asc-pad) * 0.55);
    }

    /* ---------- 适配父宽度 ---------- */
    .asc-button:has(> .asc-button-body[data-block="true"]) {
      display: flex;
      width: 100%;
    }

    /* ---------- 交互态 ---------- */
    .asc-button:hover:not([disabled]) {
      filter: brightness(0.96);
    }
    .asc-button:active:not([disabled]) {
      filter: brightness(0.9);
    }
    /* text / link / ghost / menu 淡形态：亮度反馈无感，改用悬停淡底 */
    .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(
        [disabled]
      ),
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ),
    .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(
        [disabled]
      ),
    .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(
        [disabled]
      ) {
      filter: none;
      background: var(
        --auto-hover-bgcolor,
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))
      );
    }
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ) {
      text-decoration: underline;
    }
    .asc-button[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
      filter: none;
    }
    /* loading 即禁点但视觉不淡化（优先于 disabled，Q9） */
    .asc-button:has(> .asc-button-body[data-loading="true"]) {
      opacity: 1;
      cursor: progress;
    }

    /* ---------- body 布局（body 是编译子树内层，绑定可求值，直接命中选择器） ---------- */
    .asc-button-body {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      width: 100%;
      min-width: 0;
    }
    .asc-button-body[data-align="left"] {
      justify-content: flex-start;
    }
    .asc-button-body[data-align="right"] {
      justify-content: flex-end;
    }
    .asc-button-body[data-menu="true"] {
      justify-content: flex-start;
    } /* 菜单项恒左对齐 */
    .asc-button-body[data-menu="true"] .asc-button-main {
      align-items: flex-start;
    } /* label/memo 文本亦居左（与 memo 折行/短 label 对齐左缘） */
    .asc-button-body[data-label-pos="top"],
    .asc-button-body[data-label-pos="bottom"] {
      flex-direction: column;
      gap: 0.15em;
    } /* label 纵排（top = 文字上/图标下；bottom = 图标上/文字下） */
    /* labelPos top：文字在图标上方（main 排 icon 前） */
    .asc-button-body[data-label-pos="top"] .asc-button-icon {
      order: 2;
    }

    /* 图标位：尺寸随字号（x-icon 默认 1em），loading 转圈自带 SMIL 动画 */
    .asc-button-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    /* labelPos left：图标（含 loading 位）移内容区末尾并与 tags 互换（icon 恒最末）；
         横排 = 右侧、纵排 = 下方 */
    .asc-button-body[data-label-pos="left"] .asc-button-icon {
      order: 5;
    }
    /* 图标角标（icon.badge 标量三形态启用）：板 padding 承载留白，伪元素红点取 danger 语义色 */
    .asc-button-icon-badge {
      position: relative;
    }
    .asc-button-icon-badge::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 0.4em;
      height: 0.4em;
      border-radius: 50%;
      background: var(--auto-danger-color, var(--asc-button-danger, #ef4444));
    }

    /* 主文本组：label 与 memo 恒纵排（memo 在 label 下方） */
    .asc-button-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 0;
    }
    /* label 单行截断（wrap 默认 false，ADR-0012 补记）：溢出显示省略号——截断只在按钮
         宽度受约束时发生（block / menu / 容器挤压；inline-flex 收缩到内容宽永不触发）；
         max-width 钳制是关键——nowrap 下 min-content 涨至全文宽，column flex 的
         align-items 非 stretch 使 label 取 fit-content，无钳制会被 min-content 抬出
         可用宽（截断失效）；截断发生时由 mounted 静态检测自动挂 title；wrap=true 回
         折行（按钮高度随行数增长，显式声明才换行，防布局被意外撑开） */
    .asc-button-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .asc-button-body[data-wrap="true"] .asc-button-label {
      white-space: normal;
    }
    /* 空内容不占位：纯图标用法（label 空）时出口与主文本组整体隐藏，消除 gap/行高占位；
         插槽有内容时出口非空不命中，不受影响 */
    .asc-button-label:empty {
      display: none;
    }
    .asc-button-main:has(> .asc-button-label:empty):not(
        :has(> .asc-button-memo)
      ) {
      display: none;
    }
    .asc-button-body[data-align="left"] .asc-button-main {
      align-items: flex-start;
    }
    .asc-button-body[data-align="right"] .asc-button-main {
      align-items: flex-end;
    }

    /* 备注：小一号 + 相对内容色的淡化（color-mix 跟随 --asc-ink，实底上自然呈淡白）；
         最多两行，超出截断显示省略号（line-clamp） */
    .asc-button-memo {
      font-size: 0.75em;
      line-height: 1.2;
      color: color-mix(in srgb, var(--asc-ink, currentColor) 70%, transparent);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
    }
    /* memo 在场时图标默认 2 倍大（与 label+memo 双行文本块视觉配平）；
         图标与文本块的垂直居中由 body 的 align-items: center 承担 */
    .asc-button:has(.asc-button-memo) .asc-button-icon {
      font-size: 2em;
    }

    /* tags 小圆钮：右侧小一号圆形，独立 hover 反馈 */
    .asc-button-tags {
      display: inline-flex;
      gap: 0.15em;
      margin-left: 0.35em;
    }
    /* x-for 克隆载体盒消失，圆钮直接成为容器 flex 项 */
    .asc-button-tag-item {
      display: contents;
    }
    .asc-button-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25em;
      height: 1.8rem;
      width: 1.8rem; /* 无 label 恒正圆（等宽高）；带 label 被胶囊规则放开 */
      padding: 0;
      font-size: 1rem; /* 图标与 label 恒 1rem——不随 data-size 档位（视觉稳定优先） */
      border-radius: 50%;
      color: var(--asc-ink);
      cursor: pointer;
      /* 常态即与按钮主背景形成色差：按内容色派生淡底（实底上呈淡白、透明底上呈淡灰/淡语义色） */
      background: transparent; /* 常态无背景（shape 默认 none）；shape 板色见后续规则 */
      transition: background-color 0.15s ease, transform 0.1s ease;
    }
    .asc-button-tag:hover {
      background: color-mix(
        in srgb,
        var(--asc-ink, currentColor) 28%,
        transparent
      );
    }
    /* shape 底板（默认 none 无背景）：circle 圆形底板 / radius 主题圆角底板——板色按内容色
         派生淡底（与按钮主背景形成层次）；胶囊 tag 的 9999px 规则后位覆盖 radius 呈胶囊板 */
    .asc-button-tag[data-shape="circle"],
    .asc-button-tag[data-shape="radius"] {
      background: color-mix(in srgb, var(--asc-ink, currentColor) 12%, transparent);
    }
    .asc-button-tag[data-shape="radius"] {
      border-radius: var(--auto-border-radius, 0.25rem);
    }
    /* 带 label 的 tag 呈胶囊：放开定宽随内容、横向 padding 撑开；label 恒 1rem 继承 */
    .asc-button-tag:has(> .asc-button-tag-label) {
      width: auto;
      padding: 0 0.6rem;
      border-radius: 9999px;
    }
    .asc-button-tag-label {
      line-height: 1;
      white-space: nowrap;
    }
    /* 按压反馈：底色加深 + 轻微缩放（松手经 transition 弹回） */
    .asc-button-tag:active {
      background: color-mix(
        in srgb,
        var(--asc-ink, currentColor) 45%,
        transparent
      );
      transform: scale(0.88);
    }
    /* checkable 勾选态（data-checked 属性绑定通道）：语义色（--asc-tone 随宿主 type）淡底 +
         内容色转语义色——与常态 hover（ink 淡灰）形成「点亮」区分；同特异性后位覆盖 shape
         底板色，hover 加深一档 */
    .asc-button-tag[data-checked] {
      color: var(--asc-tone, #009aff);
      background: color-mix(
        in srgb,
        var(--asc-tone, #009aff) 22%,
        transparent
      );
    }
    .asc-button-tag[data-checked]:hover {
      background: color-mix(
        in srgb,
        var(--asc-tone, #009aff) 34%,
        transparent
      );
    }
    /* tag 图标钉死 1rem：不消费 --auto-icon-size（theme 档位 1.2× 会放大）也不随 data-size——
         tag 为紧凑小圆钮图标恒小；.as-icon 双类选择器（0,2,0）压过引擎 .as-icon 基础规则
         （同特异性但 icon 样式表惰性后注入），svg 撑满宿主规则一并覆盖 */
    .asc-button-tag-icon.as-icon,
    .asc-button-tag-icon.as-icon > svg {
      width: 1rem;
      height: 1rem;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-button,
    [data-dark] .asc-button {
      /* 只兜字色——bg 不在此兜底：各 variant 的专属 dark 块已承接（default/secondary 有暗色底、
         primary 恒 tone）；通配 bg 会以同特异性后位覆盖 primary 形态的 --asc-bg: var(--asc-tone)，
         dark 下 secondary-bgcolor 派生为主题系色 → 所有语义色实底钮同色（本次修复的回归根因） */
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="primary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="primary"]) {
      /* bg 走 tone 中转（与 light 一致）——直引 --auto-primary-color 会无视 data-type 的语义色，
         dark 下所有语义色实底钮同变主色（本次修复的回归根因之二）；dark 兜底值经 tone 第二级 */
      --asc-bg: var(--asc-tone);
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]) {
      --asc-bg: var(
        --auto-secondary-bgcolor,
        var(--asc-button-bg, rgba(129, 129, 129, 0.45))
      );
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="default"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="default"]) {
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #3a3a3a));
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="primary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #56baff));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="success"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #5cd07c));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="warning"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f0a03c));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="danger"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #e6696a));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="info"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #a1a1aa));
    }
    [dark]
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(
        [disabled]
      ),
    [dark]
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ),
    [dark]
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(
        [disabled]
      ),
    [dark]
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(
        [disabled]
      ) {
      background: var(
        --auto-hover-bgcolor,
        var(--asc-button-hover-bg, rgba(255, 255, 255, 0.08))
      );
    }
  </style>
  <!-- 变体数据属性全部承载在 body（编译子树内层元素，经 :has() 驱动宿主外观——见文件头注释）；
         indent（原始值）经 :style 加性内联（body 无 padding，不影响宿主内距） -->
  <span
    class="asc-button-body"
    :data-variant="variant"
    :data-type="type"
    :data-ghost="ghost"
    :data-border="border"
    :data-shape="shape"
    :data-wrap="wrap"
    :data-align="align"
    :data-menu="menu"
    :data-block="block"
    :data-loading="loading"
    :data-label-pos="labelPos"
    :style="indent ? { paddingLeft: (typeof indent === 'number' ? indent + 'px' : indent) } : undefined"
  >
    <!-- loading 图标替换左图标位（字面量须带引号——裸 loading 会命中 data.loading 布尔值） -->
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>
    <!-- icon 双形态：字符串 = 图标名；对象 = { name, size, color, strokeWidth, padding }——name 经 x-icon 值消费，
         视觉键由 mounted 的 syncIconStyle 以内联样式透传（与 x-icon 原生内联实现等价；
         绑定表达式通道对 props 晚注入不重算，故走 JS 同步通道） -->
    <span
      class="asc-button-icon"
      x-if="!loading && typeof icon === 'string' && icon"
      x-icon="icon"
    ></span>
    <span
      class="asc-button-icon"
      x-if="!loading && typeof icon === 'object' && icon"
      x-icon="icon.name"
    ></span>
    <span class="asc-button-main" x-show="labelPos !== 'none'">
      <!-- 默认插槽出口：未提供内容时显示 {{ displayLabel }}（组件自身状态求值） -->
      <span class="asc-button-label" x-slot>{{ displayLabel }}</span>
      <span class="asc-button-memo" x-if="memo">{{ memo }}</span>
    </span>
    <span class="asc-button-tags" x-if="tags && tags.length">
      <!-- x-for 宿主自身的绑定不被编译（ownsChildren 接管子树编译），故宿主为纯克隆载体，
             tag 圆钮与绑定（title/点击）在内层元素上，x-for locals（tag）在内层可见。
             data-checked 为内联表达式（非方法调用）——属性绑定求值域不含组件 methods，
             方法形态会宽松求值 undefined 而静默移除；checkValues 逐项 ?? 回退（假值真值如 0 不受影响） -->
      <span
        class="asc-button-tag-item"
        x-for="tag of tags"
        :key="tag.name || tag.icon"
      >
        <i
          class="asc-button-tag"
          :class="tag.classes"
          :title="tag.tooltip"
          :style="tag.styles"
          :data-shape="tag.shape"
          :data-checked="!tag.checkable ? null : (tag.value === (tag.checkValues?.[0] ?? true) ? '' : null)"
          @click="onTagClick(tag, $event)"
        >
          <i class="asc-button-tag-icon" x-if="tag.icon" x-icon="tag.icon"></i>
          <span class="asc-button-tag-label" x-if="tag.label">{{ tag.label }}</span>
        </i>
      </span>
    </span>
  </span>
</button>
`,mr=`autospark.button`;function hr(e){e.components[mr]=pr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button`))){let e=document.createElement(`button`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${mr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}gr();function gr(){y(e=>{m(e),hr(e)})}var _r=`<!--
    继承骨架 + 机制自治（ADR-0016）：x-define:inherit 复用 autospark.button 的纯按钮
    视觉全套（快照克隆，模板/CSS 骨架单份），状态机制全套自持于本组件的 setup 与
    styles——button 已取消 checkable 特性，本组件是其承接者（迁移动作见 ADR-0016）。

    x-button-options（2026-11-11 泛化，即 <x-button> 的选项集）= **button props 全集**（variant/type/ghost/border/shape/
    loading/icon/label/memo/ripple/wrap/... 切态整组注入 data——每态可完全自定义按钮的
    渲染与形态）+ 状态机制键（value 状态值 / clickable 出边锁 / decorate 额外装饰 /
    tooltip 双轨提示 / style cssText / class 附加类——机制键不走 props 注入通道）。

    事件与数据出口：
    - change：切换实际发生后冒泡，detail = { value, index, state }（新态三元组）
    - 原生 click：恒触发（不派发自定义 click——与原生同名双触发不可接受）；state 数据
      经宿主常驻 data-value dataset 反射读取（外层 @click="v = $event.currentTarget.dataset.value"）
    - 表单桥：布尔二元组（缺省组即此）内嵌 input[type=checkbox]（el.value 布尔语域，
      配 x-model.boolean 保真，未勾选不提交）；其余形态内嵌 input[type=hidden]
      （value = String(当前值)、name 透传宿主）；N>2 受控通道 = @change（x-model 对
      非布尔组字符串化固有，自担）

    装饰渲染（states 项键 decorate，取代 button 旧组件级 checkStyle）：
    - solid = tone 实底反白 / icon = 最左 yes 占位 / corner = 右上角越界打勾三角 /
      ripple = 最左 CSS 自绘涟漪动画占位（mounted 注入的 DOM 无编译通道，x-icon 不可用，
      视觉对齐内置 ripple 图标动效语言）——宿主 class 通道：asc-d-<x> 当前态佩戴、
      asc-p-check / asc-p-ripple 组内任一佩戴即常驻占位（防布局跳动）
    - 灰色无匹配态（asc-unmatched）：value 不在 states 值域——中性灰覆盖 variant/type、
      pointer + hover 可点击（与 disabled 的 opacity+not-allowed 明确分野）
-->
<!-- 子模板不含覆盖段（裸子节点会被收为默认段替换父 label 出口 fallback）——仅资源节点 -->
<button
  class="asc-state-button"
  x-define="autospark.state-button"
  x-define:inherit="autospark.button"
>
  <script setup>
    {
        data: () => ({
            states: undefined,   // 状态集：x-button-options[] | (number|string)[]——x-button-options = button props 全集（variant/type/ghost/shape/loading/icon/label/ripple... 切态整组注入，每态完全自定义按钮渲染与形态）+ 机制键（value/clickable/decorate/tooltip/style/class）；标量即 {value} 简写、对象缺 value 回退下标；undefined 落缺省组
            value: undefined,    // 当前状态值（受控真相，组件不擅改——仅点击翻转/缺省初始化写入）；undefined 缺省初始化为 states[0].value（初始态即首态）
            autoswitch: true,    // true：点击自动切下一态（change + 原生 click）；false：纯受控（仅原生 click，切换由外部回写 value）
        }),
        mounted() {
            // —— 归一化（幂等纯函数，不写回 data——写回会触发 watch 自环）——
            // undefined/null 落缺省组 [{value:false},{value:true,decorate:'corner'}]（零配置即
            // 传统双态 check 按钮）；非数组/空数组 → []（无效状态集，恒无匹配灰、不可切态，静默退化）
            const DEFAULT_STATES = [{ value: false }, { value: true, decorate: "corner" }];
            const norm = () => {
                const raw = this.data.states;
                const arr = raw == null ? DEFAULT_STATES : Array.isArray(raw) ? raw : [];
                return arr.map((item, i) =>
                    typeof item === "object" && item !== null
                        ? { ...item, value: Object.hasOwn(item, "value") ? item.value : i }
                        : { value: item },
                );
            };
            // 布尔二元组判定（缺省组即此）：checkbox 布尔语域桥的前提（el.value 只取 "true"/"false"，
            // 配 x-model.boolean 类型保真——对齐原生 checkbox 语义）；非布尔组不劫持 el.value
            const boolPair = (() => {
                const l = norm();
                return l.length === 2 && l.some((s) => s.value === true) && l.some((s) => s.value === false);
            })();
            // 值序列化（dataset 反射 / hidden input 共用）：对象 JSON 化、其余 String
            const serialize = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));

            // button props 键面（态注入的键清单）：**显式清单驱动**——this.data 是挂链数据视图，
            // Object.keys 枚举出的是根 state 键（含 $scopes/$ 框架保留键），不能用于枚举组件
            // props 面（读穿透组件域可用、枚举不可用）；清单与 button 的 data() 键面一一对应
            // （theme 六键不在 data 域、不参与态注入——档位不随态切换）
            const BUTTON_PROPS = [
                "variant", "type", "label", "labelPos", "icon", "loading", "ghost", "border",
                "block", "disabled", "ripple", "autoInsertSpace", "shape", "wrap", "align",
                "indent", "memo", "tags", "menu",
            ];

            // 底值快照（态注入的回退基准）：一跳后 states/value 注入落定，遍历 data 快照
            // **全部 button props 键**（排除状态机制 props 与 computed 函数值——displayLabel
            // 等不可被态覆盖）+ 宿主原样式；init 前为 null（syncVisual 注入段守卫跳过）
            let base = null;
            // label 覆盖直写通道：{{ displayLabel }} 是父的 computed（组件域 computed 对后续
            // data.label 赋值不重算——仅初始化首求值生效，ADR-0016 实施注记），故态 label
            // 变化直写 span 文本；**fallback 特征探测**——初始文本与底值 label 的派生一致
            // （含两字插空格）才视为 fallback 在场，插槽内容在场时跳过直写（插槽优先）
            let labelSpan = null;
            let labelIsFallback = false;
            const deriveLabel = (t) =>
                this.data.autoInsertSpace && /^[一-龥]{2}$/.test(t ?? "") ? t[0] + " " + t[1] : String(t ?? "");
            // 态 class 上次写入（切态摘旧加新，不碰使用者宿主 class）
            let prevCls = [];
            // 态 tooltip 自挂标记（仅摘自挂的，宿主显式提示永不覆盖）
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";
            let selfTip = false;

            // —— 表单载体：内嵌隐藏 input（display:none、name 透传宿主）——
            const real = document.createElement("input");
            real.type = boolPair ? "checkbox" : "hidden";
            real.style.display = "none";
            const nameAttr = this.el.getAttribute("name");
            if (nameAttr != null) real.name = nameAttr;
            this.el.appendChild(real);

            // —— 全视觉同步（按 data.value 现值求当前态，幂等）——
            const syncVisual = () => {
                const list = norm();
                const cur = list.find((s) => s.value === this.data.value) ?? null;
                const st = cur ?? {};
                // 1. 装饰 class：当前态佩戴 → asc-d-<x>；组内任一佩戴 check/ripple → 常驻占位标记
                for (const k of ["asc-d-solid", "asc-d-check", "asc-d-corner", "asc-d-ripple", "asc-p-check", "asc-p-ripple", "asc-unmatched"]) {
                    this.el.classList.remove(k);
                }
                if (typeof st.decorate === "string" && st.decorate) this.el.classList.add("asc-d-" + st.decorate);
                if (list.some((s) => s.decorate === "check")) this.el.classList.add("asc-p-check");
                if (list.some((s) => s.decorate === "ripple")) this.el.classList.add("asc-p-ripple");
                // 1.5 ripple 指示器在场性 = 组内任一态佩戴（佩戴才注入、无佩戴即移除——运行时
                //     states 整体替换随本函数重跑自动修正；注入的 DOM 无编译通道（x-icon 不可用），
                //     CSS 自绘呼吸点 + 扩散环；恒插 body 最前（指示器恒最前纪律））
                {
                    const body = this.el.querySelector(".asc-button-body");
                    const checkEl = body?.querySelector(":scope > .asc-state-check") ?? null;
                    const hasRipple = list.some((s) => s.decorate === "ripple");
                    if (hasRipple && body && !checkEl) {
                        const el = document.createElement("span");
                        el.className = "asc-state-check";
                        body.prepend(el);
                    } else if (!hasRipple && checkEl) {
                        checkEl.remove();
                    }
                }
                // 2. 灰色无匹配态（无效状态集亦恒无匹配）
                this.el.classList.toggle("asc-unmatched", cur === null);
                // 3. dataset 反射（外层 @click 读取当前值的通道——原生 click 无 detail）
                this.el.setAttribute("data-value", serialize(this.data.value));
                // 4. 表单载体同步：布尔组 checkbox 按真值勾选（提交值 = String(true 态 value)）；
                //    其余 hidden 恒随提交（value 是受控真相，域外值原样提交）
                if (boolPair) {
                    real.checked = cur !== null && cur.value === true;
                    real.value = String(list.find((s) => s.value === true)?.value ?? true);
                } else {
                    real.value = serialize(this.data.value);
                }
                // 5. 态注入（button props 透传，仅当前态生效）：当前态在场的 button props 键
                //    （BUTTON_PROPS 清单内）写入 data（触发父模板既有绑定 :data-variant/:data-type/
                //    x-icon… 与父 mounted 的 watch（disabled/loading/icon/ripple/label）重算），
                //    未声明键回退底值——每态可完全自定义按钮渲染与形态；机制键（clickable/
                //    decorate/tooltip/style/class）不在清单天然不注入；label 另走直写通道
                //    （displayLabel computed 对后续赋值不重算，见上方注释）
                if (base) {
                    for (const k of BUTTON_PROPS) {
                        this.data[k] = Object.hasOwn(st, k) ? st[k] : base[k];
                    }
                }
                if (labelSpan && labelIsFallback) labelSpan.textContent = deriveLabel(Object.hasOwn(st, "label") && st.label != null ? st.label : base?.label ?? "");
                // 6. 态 style（cssText，对齐 tags.styles 通道）：宿主原样式为基底整写（追加态样式）
                this.el.style.cssText = base.cssText + (typeof st.style === "string" && st.style.trim() ? (base.cssText.trim().endsWith(";") || !base.cssText.trim() ? "" : ";") + st.style : "");
                // 7. 态 class：摘旧加新（不碰使用者宿主 class）
                if (prevCls.length) for (const c of prevCls) this.el.classList.remove(c);
                prevCls = typeof st.class === "string" && st.class.trim() ? st.class.trim().split(/\\s+/) : [];
                for (const c of prevCls) this.el.classList.add(c);
                // 8. 态 tooltip（双轨）：当前态佩戴则挂（无条件挂——优先级高于父的溢出自动提示，
                //    ADR-0016 决策 8）；态消失只摘自挂的；宿主显式提示优先（未自挂且在场则不动）
                if (st.tooltip != null && String(st.tooltip) !== "") {
                    if (!selfTip && this.el.getAttribute(tipAttr)) {
                        // 在场的可能是父挂的溢出自动提示（低优先级，覆盖之）或宿主显式提示——
                        // 无法可靠区分，按「态佩戴意图明确」覆盖（已知温和竞争，ADR-0016 注记）
                    }
                    this.el.setAttribute(tipAttr, String(st.tooltip));
                    selfTip = true;
                } else if (selfTip) {
                    this.el.removeAttribute(tipAttr);
                    selfTip = false;
                }
            };

            // —— el.value 劫持（布尔组化身 checkbox，x-model 桥）：布尔语域 "true"/"false" ——
            // x-model 写 el.value → data.value 落真布尔（默认组与注入组的字符串解释一致，
            // props 晚注入时序天然免疫）；非布尔组不劫持（x-model 字符串化固有语义自担）
            const proto = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, "value");
            if (boolPair) {
                Object.defineProperty(this.el, "value", {
                    get: () => proto.get.call(this.el),
                    set: (v) => {
                        proto.set.call(this.el, v);
                        this.data.value = v === "true";
                        setTimeout(syncVisual, 0);
                    },
                    configurable: true,
                });
            }

            // —— 点击切换（循环 next + 四重判定链，ADR-0016 决策 4/5/6）——
            // 生效条件：autoswitch !== false && 当前态 clickable !== false && !disabled && !loading
            // （disabled 由原生 button 物理拦截 click，无需判）；命中 states[i] → states[(i+1)%N]
            // （无匹配 → states[0]），写 value + syncVisual 后派发 change（新态三元组）；
            // 布尔组另派发 input（x-model 回写监听在宿主自身）
            this.el.addEventListener("click", () => {
                if (this.el.disabled || this.data.autoswitch === false) return;
                const list = norm();
                if (list.length < 2) return; // 无效状态集：不可切态
                const cur = list.find((s) => s.value === this.data.value) ?? null;
                if (cur && cur.clickable === false) return; // 出边锁：该态点击零效果
                const index = cur ? (list.indexOf(cur) + 1) % list.length : 0;
                const next = list[index];
                this.data.value = next.value;
                syncVisual();
                // 布尔组：写底层 el.value（布尔语域）后派发 input——x-model 监听在宿主自身，
                // 读 el.value 回写 state（配 .boolean 类型保真）
                if (boolPair) {
                    proto.set.call(this.el, String(next.value === true));
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));
                }
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next.value, index, state: next } }));
            });

            // —— corner 按压预览（下一态佩戴 corner 时预显描边——松手切换正式化）——
            const previewCorner = (on) => {
                this.el.classList.toggle("asc-corner-preview", on);
            };
            this.el.addEventListener("pointerdown", () => {
                if (this.el.disabled || this.data.autoswitch === false) return;
                const list = norm();
                if (list.length < 2) return;
                const cur = list.find((s) => s.value === this.data.value) ?? null;
                if (cur && cur.clickable === false) return;
                const next = cur ? list[(list.indexOf(cur) + 1) % list.length] : list[0];
                previewCorner(next?.decorate === "corner");
            });
            this.el.addEventListener("pointerup", () => previewCorner(false));
            this.el.addEventListener("pointerleave", () => previewCorner(false));
            this.el.addEventListener("pointercancel", () => previewCorner(false));

            // —— 一跳后初始化：states/value 注入落定 → 缺省 value = states[0].value、底值快照、
            // 首次视觉同步（mounted 时化身子树与 props 均可能未就位，家族惯用法）——
            setTimeout(() => {
                const list = norm();
                // 重对齐（布尔组）：底层 el.value（x-model 编译期已写，布尔语域）优先于缺省初始化
                if (boolPair) {
                    const raw = proto.get.call(this.el);
                    if (raw === "true") this.data.value = true;
                    else if (raw === "false") this.data.value = false;
                }
                if (this.data.value === undefined && list.length > 0) this.data.value = list[0].value;
                base = { cssText: this.el.style.cssText };
                for (const k of BUTTON_PROPS) base[k] = this.data[k];
                // label 直写通道探测：首帧插值已完成（显示底值 label 派生），特征匹配即许可直写
                const span = this.el.querySelector(".asc-button-label");
                if (span && span.textContent === deriveLabel(base.label)) {
                    labelSpan = span;
                    labelIsFallback = true;
                }
                syncVisual();
            }, 0);
            // 受控通道：外部改 value → 视觉跟随（states 替换同理重对齐——value 不在新值域时
            // 保持无匹配回灰，value 是受控真相不被擅改）
            this.watch("value", () => { syncVisual(); });
            this.watch("states", () => { setTimeout(syncVisual, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-state-button">
    /* ---------- 装饰 solid：当前态佩戴 = tone 实底 + 反白字（覆盖 variant 表达；!important
         压过 :has 变体规则族——继承拼接的父样式在前，级联后者胜 + important 双保险） ---------- */
    .asc-state-button.asc-d-solid {
      --asc-bg: var(--asc-tone) !important;
      --asc-ink: #fff !important;
      --asc-line: transparent !important;
    }

    /* ---------- 装饰 check：组内任一态佩戴（asc-p-check）即 body 最前常驻 1.2em 占位
         （未佩戴态留空、零布局跳动）；当前态佩戴（asc-d-check）显 tone 色 yes ---------- */
    .asc-state-button.asc-p-check > .asc-button-body::before {
      content: "";
      flex: none;
      width: 1.2em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--asc-tone);
      font-size: 0.9em;
      font-weight: bold;
    }
    .asc-state-button.asc-d-check > .asc-button-body::before {
      content: "✓";
    }

    /* ---------- 装饰 corner：当前态佩戴 = tone 外描边 + 右上角 tone 小三角内嵌反白小勾 ---------- */
    /* 三角 = 渐变盒（对角线分割、右上半着色）越出盒外 1px 与外描边同色融合（弧线无缝相接）；
         尺寸 = min(圆角半径 ×2.5, 2.5em, 按钮高 50%)——高度基准 + aspect-ratio 方形推导，
         圆角档位切换自动跟随；外描边走 box-shadow（视觉等价 outline、跟随圆角、绘制路径独立，
         不受涟漪载体播放期色块遮挡） */
    .asc-state-button.asc-d-corner {
      --asc-corner: min(
        calc(var(--auto-border-radius, 0.5rem) * 2.5),
        2.5em,
        50%
      );
      box-shadow: 0 0 0 1px var(--asc-tone);
      position: relative; /* 三角/描边定位上下文（x-ripple 载体另有 relative 兜底，此处显式自持） */
    }
    .asc-state-button.asc-d-corner::after {
      content: "";
      position: absolute;
      top: -1px;
      right: -1px;
      height: calc(var(--asc-corner) + 1px);
      aspect-ratio: 1 / 1;
      border-top-right-radius: min(
        calc(var(--auto-border-radius, 0.5rem) + 1px),
        1.4em
      );
      background: linear-gradient(
        to bottom left,
        var(--asc-tone) 49.5%,
        transparent 50%
      );
      z-index: 1;
    }
    /* 反白小勾：定位于三角重心（对角线中点向直角方向）——系数基准同 --asc-corner（含 50%
         高度上限同步缩放），-1px 补偿三角盒越出量，确保落在三角内部 */
    .asc-state-button.asc-d-corner::before {
      content: "";
      position: absolute;
      top: calc(var(--asc-corner) * 0.24 - 1px);
      right: calc(var(--asc-corner) * 0.14 - 1px);
      z-index: 2;
      width: calc(var(--asc-corner) * 0.36);
      aspect-ratio: 2 / 1;
      border-left: 1.5px solid var(--auto-bgcolor, #fff);
      border-bottom: 1.5px solid var(--auto-bgcolor, #fff);
      transform: rotate(-45deg);
    }
    /* 按压预览：下一态佩戴 corner 时 JS 挂 asc-corner-preview 预显描边（松手切换正式化、
         按住拖出取消随按压消失——化解「松手才见描边」迟滞感；当前已佩戴则本体描边在场不重复） */
    .asc-state-button.asc-corner-preview:not(.asc-d-corner) {
      box-shadow: 0 0 0 1px var(--asc-tone);
    }

    /* ---------- 装饰 ripple：最左 1.2em 常驻占位（组内任一态佩戴），当前态佩戴显
         tone 色 CSS 自绘涟漪动画（呼吸点 + 扩散环错峰——mounted 注入的 DOM 无编译通道，
         x-icon 不可用，视觉对齐内置 ripple 图标动效语言，ADR-0016 实施注记） ---------- */
    .asc-state-check {
      display: none; /* 缺省隐藏（组内无 ripple 佩戴零占位） */
    }
    .asc-state-button.asc-p-ripple > .asc-button-body > .asc-state-check {
      display: inline-flex;
      flex: none;
      width: 1.2em;
      align-items: center;
      justify-content: center;
      position: relative;
      visibility: hidden; /* 未佩戴态留空占位 */
    }
    .asc-state-button.asc-d-ripple > .asc-button-body > .asc-state-check {
      visibility: visible;
    }
    .asc-state-button.asc-d-ripple .asc-state-check::before {
      content: "";
      position: absolute;
      width: 0.28em;
      height: 0.28em;
      border-radius: 50%;
      background: var(--asc-tone); /* 指示色统一 tone（与 icon/corner 同口径） */
      animation: asc-state-check-dot 1.6s ease-in-out infinite;
    }
    .asc-state-button.asc-d-ripple .asc-state-check::after {
      content: "";
      position: absolute;
      width: 0.9em;
      height: 0.9em;
      border-radius: 50%;
      border: 1.5px solid var(--asc-tone);
      animation: asc-state-check-ring 1.6s ease-out infinite;
    }
    /* primary 实底下 --asc-tone 与背景同色（指示器隐形），改取反白内容色保对比
       （实底反白字语境；default 面板底 / secondary 淡底的 tone 指示器对比充分不受限） */
    .asc-state-button.asc-d-ripple:has(
        > .asc-button-body[data-variant="primary"]
      )
      .asc-state-check::before {
      background: var(--asc-ink, #fff);
    }
    .asc-state-button.asc-d-ripple:has(
        > .asc-button-body[data-variant="primary"]
      )
      .asc-state-check::after {
      border-color: var(--asc-ink, #fff);
    }
    @keyframes asc-state-check-dot {
      0%,
      100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(0.55);
        opacity: 0.6;
      }
    }
    @keyframes asc-state-check-ring {
      0% {
        transform: scale(0.3);
        opacity: 0.9;
      }
      100% {
        transform: scale(1.25);
        opacity: 0;
      }
    }

    /* ---------- 灰色无匹配态：中性灰覆盖 variant/type（「未处于任何状态」的元语义不属于
         任何形态/语义色表达）；pointer + hover 轻反馈——可点击是硬需求，与 disabled 的
         opacity 0.55 + not-allowed 明确分野 ---------- */
    .asc-state-button.asc-unmatched {
      --asc-bg: transparent;
      --asc-ink: color-mix(
        in srgb,
        var(--auto-color, #606060) 60%,
        transparent
      ) !important;
      --asc-line: color-mix(
        in srgb,
        var(--auto-color, #606060) 40%,
        transparent
      ) !important;
      cursor: pointer;
    }
    .asc-state-button.asc-unmatched:hover:not([disabled]) {
      filter: none;
      background: var(
        --auto-hover-bgcolor,
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))
      );
    }
    /* 暗色兜底（ADR-0129）：灰阶字色走 dark 校准值（--auto-color 暗色下自动反转，
       此处仅兜第三级字面值） */
    [dark] .asc-state-button.asc-unmatched,
    [data-dark] .asc-state-button.asc-unmatched {
      --asc-ink: color-mix(
        in srgb,
        var(--auto-color, #fafafa) 55%,
        transparent
      ) !important;
    }
  </style>
</button>
`,vr=`autospark.state-button`;function yr(e){e.components[vr]=_r,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-state-button`))){let e=document.createElement(`button`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${vr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}br();function br(){y(e=>{m(e),yr(e)})}var xr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定全部落在编译子树的内层 body 上；文本组件无宿主级底色/边框
    （外观即文本本身），body 直接承载变体样式即可，无需 :has() 反驱宿主。溢出提示
    （title/data-tooltip）与剪贴板写入等原生语义在 mounted 钩子经 JS 通道同步。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - copy：copyable 复制成功冒泡，detail = { text }（写入剪贴板的文本原文）
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道 data-size 全跟随（--auto-font-size 基线），
     text 不设自有字号属性（button 同范式 ADR-0012）；data() 不得声明主题六键，
     组件内部变体属性亦禁用六个通道名 -->
<span
  class="asc-text"
  x-define="autospark.text"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            label: "",            // 兜底文案（插槽无内容时显示；text 无内置文案、不接 i18n，ADR-0018 决策 1 备注）
            type: "default",      // 文本层级/语义色：default 正文 | secondary 次要 | third 辅助 | primary/success/warning/danger 语义色
            strong: false,        // 加粗（--x-font-weight-large 档位标尺）
            ellipsis: false,      // 溢出省略：false 不省略 | true 单行省略号 | number n 多行截断（line-clamp n 行）
            copyable: false,      // 复制：false 无 | true 复制渲染文本 | { text } 复制指定文本（显式文本优先）
            copied: false,        // 内部状态：复制成功反馈窗（图标换勾 + success 色，约 1.5s 自复原）
        }),
        methods: {
            // 复制图标点击：取复制文本（copyable.text 显式指定优先，否则取插槽出口
            // 渲染文本）→ navigator.clipboard 写入 → 成功反馈（copied 置位 + copy 事件
            // 冒泡）；写入失败（非安全上下文 / 权限拒绝）console.warn 响而不哑，不误报成功
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
            // 溢出自动挂提示（对齐 button 范式 ADR-0012 补记的双轨判定）：ellipsis 启用时
            // 静态检测——单行查 scrollWidth > clientWidth、多行查 scrollHeight > clientHeight；
            // tooltip 特性在场挂 data-tooltip（插件接管、样式统一），缺席挂原生 title。
            // 挂/摘规则：仅截断态挂、宿主显式提示永不覆盖、溢出消失只摘自挂的（闭包标记）。
            // 纯静态检测（mounted 一跳首查 + ellipsis 变化重查），不引入 ResizeObserver；
            // 插槽内容后续变化不重查为已知温和妥协（文本组件无 label 变化通道）
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
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖
                    this.el.setAttribute(tipAttr, content.textContent ?? "");
                    selfTip = true;
                } else if (selfTip) {
                    this.el.removeAttribute(tipAttr);
                    selfTip = false;
                }
            };
            setTimeout(syncTip, 0);
            this.watch("label", () => { setTimeout(syncTip, 0); }); // label 经 props 引用外部状态，变化重查
            this.watch("ellipsis", () => { setTimeout(syncTip, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-text">
    /* 排版基线：字号经主题档位通道（宿主 data-size → --auto-font-size 全跟随，button 同范式） */
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
    /* 加粗：--x-font-weight-large 标尺档（语义层无字重派生变量，直取基础标尺） */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 变体数据属性承载在 body（编译子树内层元素）；
         多行 clamp 行数经 --asc-text-lines 变量内联下发（:style 自定义属性键走 setProperty） -->
  <span
    class="asc-text-body"
    :data-type="type"
    :data-strong="strong"
    :data-copyable="!!copyable"
  >
    <!-- 文本出口：插槽内容优先，无内容回退 {{ label }}（组件自身状态求值）；
         ellipsis 经类切换：true 单行省略号 / number 多行截断。
         类切换走 x-class 指令通道（:class 简写与静态 class 同元素共存时不生效，
         x-class 指令与静态 class 拼接正常——引擎绑定通道差异，实测定夺） -->
    <span
      class="asc-text-content"
      x-class="ellipsis === true ? 'asc-text-ellipsis' : (typeof ellipsis === 'number' && ellipsis > 0 ? 'asc-text-clamp' : null)"
      :style="typeof ellipsis === 'number' && ellipsis > 0 ? { '--asc-text-lines': ellipsis } : undefined"
      x-slot
    >{{ label }}</span>
    <!-- 复制按钮（copyable 启用）：图标 copy ↔ 复制成功换勾（copied 置位窗内） -->
    <i
      class="asc-text-copy"
      x-if="!!copyable"
      :data-copied="copied ? '' : null"
      x-icon="copied ? 'yes' : 'copy'"
      @click="onCopyClick($event)"
    ></i>
  </span>
</span>
`,Sr=`autospark.text`;function Cr(e){e.components[Sr]=xr}wr();function wr(){y(e=>{m(e),Cr(e)})}var Tr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定落在编译子树的内层 body 上，宿主外观经 :has() 驱动；href /
    target / rel 等原生属性在 mounted 钩子同步到宿主（this.el 即化身后的 a 元素——
    原生导航语义保真，元素名快速写法经 precompile 变换为真 a，见 index.ts）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - click：原生点击冒泡（disabled 态被拦截 preventDefault，不导航）
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道 data-size 全跟随；link 不在 data() 声明
     主题六键，内部变体属性亦禁用六个通道名 -->
<a
  class="asc-link"
  x-define="autospark.link"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            label: "",           // 兜底文案（插槽无内容时显示；无内置文案、不接 i18n）
            href: "",            // 链接地址（空 = 非链接态：宿主无 href 不导航不指针）
            target: "",          // 打开方式（"_blank" 等；_blank 时自动补 rel="noopener"，显式 rel 优先）
            type: "primary",     // 语义色（对齐 button 范式 ADR-0012）：primary 缺省 | success | warning | danger | info | default 正文色
            icon: "",            // 图标名或 { name }（外链提示常用 'external'）
            disabled: false,     // 禁用：摘 href + aria-disabled + 拦截点击（视觉淡化、不可聚焦）
            underline: "hover",  // 下划线档位：hover 悬停显示（缺省）| always 恒显示 | none 恒不显示
        }),
        mounted() {
            // 原生属性同步（化身路径约束：JS 通道）：href / target / rel 写宿主 a 元素；
            // disabled 态摘 href（不可达）+ aria-disabled 标注可访问性；target 含 _blank
            // 时自动补 rel="noopener"（新窗口安全默认，宿主显式 rel 永不覆盖）。
            // watch 回调收 { value } 信封对象，此处统一按整组重同步（键间有联动，无需解构）
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

            // disabled 拦截点击（键盘 Enter 同走 click 通道）；正常态放行原生导航
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
    /* default：正文色链接（中性档——纯样式件以中性为主，语义色按需映射） */
    .asc-link:has(> .asc-link-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-link-color, #606060));
    }

    /* ---------- 下划线档位（underline）：hover 悬停（缺省）| always 恒显示 | none 恒不显示 ---------- */
    .asc-link:has(> .asc-link-body[data-underline="hover"]):hover:not([aria-disabled="true"]) {
      text-decoration: underline;
    }
    .asc-link:has(> .asc-link-body[data-underline="always"]) {
      text-decoration: underline;
    }

    /* ---------- 交互态与禁用 ---------- */
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

    /* ---------- body 布局（编译子树内层，绑定可求值） ---------- */
    .asc-link-body {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      min-width: 0;
    }
    /* 文案出口：单行截断（宽度受约束时省略号），插槽内容优先、无内容回退 label */
    .asc-link-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .asc-link-label:empty {
      display: none;
    }
    /* 图标位：随字号（x-icon 默认 1em） */

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 变体数据属性承载在 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->
  <span
    class="asc-link-body"
    :data-type="type"
    :data-underline="underline"
  >
    <!-- icon 双形态：字符串 = 图标名；对象 = { name }（经 x-icon 值消费） -->
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
    <!-- 默认插槽出口：未提供内容时显示 {{ label }} -->
    <span class="asc-link-label" x-slot>{{ label }}</span>
  </span>
</a>
`,Er=`autospark.link`;function Dr(e){e.components[Er]=Tr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-link`))){let e=document.createElement(`a`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`rel`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Er}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Or();function Or(){y(e=>{m(e),Dr(e)})}var kr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——方向/虚线/对齐变体绑定落在编译子树的内层 body 上，宿主的
    块级/行内切换经 :has() 驱动；spacing（宿主 margin）在 mounted 钩子经 JS 通道
    同步（vertical 切换会换 margin 轴，故 vertical 变化时一并重同步）。

    布局结构：body 为 flex 线容器，两段线由 body 的 ::before / ::after 伪元素
    承担（flex:1 满铺）；文字（默认插槽）居中嵌入，空插槽时出口隐藏、两段线
    自然连成整线，无文字态与带文字态共用同一结构。垂直态不带文字（文字被忽略
    不渲染——对齐 antd 5 边界，垂直分割线场景为纯分隔）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark /
     data-colorized 六键）自动获得；divider 不在 data() 声明主题六键——间距走
     自有 spacing prop（JS 通道写 margin，不占用 data-spacing 主题通道名） -->
<div
  class="asc-divider"
  x-define="autospark.divider"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            vertical: false,   // 垂直分割线（缺省水平）；垂直态文字不渲染（纯分隔场景）
            dashed: false,     // 虚线（缺省实线）
            align: "center",   // 文字位置（水平态带文字时生效）：left | center | right
            spacing: "",       // 与相邻内容的间距：number px 或任意 CSS 值；水平态 = 上下 margin、垂直态 = 左右 margin（缺省无边距）
        }),
        mounted() {
            // 间距同步（化身路径约束：宿主级样式走 JS 通道）：number 归一为 px 字符串，
            // 按方向写宿主 margin 对应轴；vertical 切换换轴重写（watch 回调收 { value }
            // 信封对象，此处读整组状态无需解构）
            const syncSpacing = () => {
                const el = this.el;
                el.style.removeProperty("margin-top");
                el.style.removeProperty("margin-bottom");
                el.style.removeProperty("margin-left");
                el.style.removeProperty("margin-right");
                const s = this.data.spacing;
                if (s === "" || s == null) return;
                const v = typeof s === "number" ? s + "px" : s;
                if (this.data.vertical) {
                    el.style.marginLeft = v;
                    el.style.marginRight = v;
                } else {
                    el.style.marginTop = v;
                    el.style.marginBottom = v;
                }
            };
            syncSpacing();
            this.watch("spacing", () => { syncSpacing(); });
            this.watch("vertical", () => { syncSpacing(); });
        },
    }
  <\/script>
  <style global id="autospark-components-divider">
    /* 线色基准（--auto-* 语义变量三级回退链，ADR-0129；兜底值对齐 button 边框校准值） */
    .asc-divider {
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #d9d9d9));
      border: 0;
      margin: 0;
      font-size: var(--auto-font-size, var(--asc-divider-font-size, 0.875rem));
    }
    /* 水平态（缺省）：块级满宽，body 承载 flex 线容器 */
    .asc-divider {
      display: block;
      width: 100%;
    }
    .asc-divider-body {
      display: flex;
      align-items: center;
      width: 100%;
    }
    /* 两段线：伪元素 border-top 承担（dashed 切 border-style），flex:1 满铺 */
    .asc-divider-body::before,
    .asc-divider-body::after {
      content: "";
      flex: 1;
      border-top: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);
    }
    .asc-divider-body[data-dashed="true"]::before,
    .asc-divider-body[data-dashed="true"]::after {
      border-top-style: dashed;
    }

    /* ---------- 文字位置（align，带文字时生效）：短线侧 flex 收窄 ---------- */
    /* left：文字靠左（首段短线 0.5em，尾段满铺） */
    .asc-divider-body[data-align="left"]::before {
      flex: 0 0 0.5em;
    }
    .asc-divider-body[data-align="right"]::after {
      flex: 0 0 0.5em;
    }

    /* 文字出口：插槽内容；空插槽隐藏（两段线连成整线，无 gap 占位） */
    .asc-divider-text {
      margin: 0 1em;
      color: var(--auto-color, var(--asc-divider-text-color, #606060));
      white-space: nowrap;
    }
    .asc-divider-text:empty {
      display: none;
    }

    /* ---------- 垂直态（vertical）：宿主行内化、body 纵排、线段换 border-left；
         高度默认 0.9em（--asc-divider-length 可覆盖；flex 容器内由使用者以
         class/样式控制满高）---------- */
    .asc-divider:has(> .asc-divider-body[data-vertical="true"]) {
      display: inline-block;
      width: auto;
      height: var(--asc-divider-length, 0.9em);
      vertical-align: middle;
    }
    .asc-divider-body[data-vertical="true"] {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      width: auto;
      height: 100%;
    }
    .asc-divider-body[data-vertical="true"]::before,
    .asc-divider-body[data-vertical="true"]::after {
      flex: 1;
      width: 0;
      border-top: 0;
      border-left: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);
    }
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::before,
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::after {
      border-left-style: dashed;
    }
    /* 垂直态文字不渲染（对齐 antd 5 边界：垂直分割线为纯分隔） */
    .asc-divider-body[data-vertical="true"] .asc-divider-text {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-divider,
    [data-dark] .asc-divider {
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #4d4d4d));
    }
    [dark] .asc-divider-text,
    [data-dark] .asc-divider-text {
      color: var(--auto-color, var(--asc-divider-text-color, #fafafa));
    }
  </style>
  <!-- 变体数据属性承载在 body（编译子树内层元素）；spacing 经 mounted JS 通道写宿主 margin -->
  <span
    class="asc-divider-body"
    :data-vertical="vertical"
    :data-dashed="dashed"
    :data-align="align"
  >
    <span class="asc-divider-text" x-slot></span>
  </span>
</div>
`,Ar=`autospark.divider`;function jr(e){e.components[Ar]=kr}Mr();function Mr(){y(e=>{m(e),jr(e)})}var Nr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——方向/对齐/换行/间距档位绑定全部落在编译子树的内层 body 上
    （body 即 flex 容器，变体直接命中 body 选择器，无需 :has() 反驱宿主）；
    number/字符串/数组形态的间距经 mounted JS 通道写 body 的内联 row-gap/column-gap
    （元素级样式覆盖档位块）。

    插槽出口 display:contents：子项穿透出口成为 body 的直接 flex 项（出口保留包裹层
    不剥标签，display:contents 使其布局透明——漏写则子项嵌套在出口层内、flex 项序
    被破坏，见家族惯例）。子元素正常编译：插槽内容照常走宿主引擎编译。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得；space 不在 data() 声明主题六键，组件内部变体属性亦禁用六个
     通道名——间距档位属性用 data-gap（非通道名），间距尺寸语义与主题 data-spacing
     档位正交（medium 档经 --auto-spacing 联动，其余档直取 --x-spacing-* 标尺） -->
<div
  class="asc-space"
  x-define="autospark.space"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            size: "medium",          // 间距：档位名（x-small/small/medium/large/x-large → CSS 变量档）| number（px）| 任意 CSS 值字符串 | [水平, 垂直] 两轴数组
            direction: "horizontal", // 排列方向：horizontal 水平（缺省）| vertical 垂直
            align: "center",         // 交叉轴对齐：start | center | end | baseline（horizontal=垂直对齐、vertical=水平对齐；缺省 horizontal 居中 / vertical 起缘）
            wrap: false,             // 换行（horizontal 态；行距=垂直轴间距，size 两轴数组的第二项）
        }),
        mounted() {
            // 间距值形态同步（化身路径约束：布局值走 JS 通道写内层 body 内联样式）：
            // 档位名（标尺五档）由 CSS 档位块承接——内联两轴清除即回档位块；number 归一
            // px、字符串 CSS 值透传、数组 [水平, 垂直] 拆两轴（row-gap=垂直、column-gap=水平，
            // 第二项缺省同第一项）。mounted 时化身子树可能尚未挂载（body 不可查），一跳后再
            // 同步（button syncIconStyle 同款时序处理）
            const TIERS = ["x-small", "small", "medium", "large", "x-large"];
            const syncSize = () => {
                const body = this.el.querySelector(".asc-space-body");
                if (!body) return;
                body.style.removeProperty("row-gap");
                body.style.removeProperty("column-gap");
                const s = this.data.size;
                if (s == null || (typeof s === "string" && TIERS.includes(s))) return; // 档位名走 CSS 块
                const norm = (v) => (typeof v === "number" ? v + "px" : String(v));
                let row, col;
                if (Array.isArray(s)) {
                    col = norm(s[0]);         // 水平（column-gap）
                    row = norm(s[1] ?? s[0]); // 垂直（row-gap），缺省同水平
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
    /* 宿主：块级容器（零色彩消费，暗色模式天然无感——无暗色兜底块） */
    .asc-space {
      display: block;
    }
    /* body：唯一 flex 容器；缺省间距 medium 档（--auto-spacing 联动 theme spacing
         档位，theme 档位跟随）；--asc-space-gap 为使用者覆盖通道（压全档） */
    .asc-space-body {
      display: flex;
      flex-direction: row;
      align-items: center; /* horizontal 缺省居中（antd 观感） */
      gap: var(--asc-space-gap, var(--auto-spacing, var(--x-spacing-medium)));
      width: 100%;
      min-width: 0;
    }
    /* 垂直态：纵排 + 缺省起缘（左对齐，antd vertical 观感） */
    .asc-space-body[data-direction="vertical"] {
      flex-direction: column;
      align-items: flex-start;
    }
    /* 交叉轴对齐（显式声明覆盖方向缺省；flex 交叉轴随 direction 自动换轴） */
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
    /* 换行（horizontal 态；行距=row-gap=间距垂直轴） */
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

    /* 插槽出口布局透明：子项穿透成为 body 直接 flex 项 */
    .asc-space-slot {
      display: contents;
    }
  </style>
  <!-- 变体数据属性承载在 body（编译子树内层元素）；size 档位名经 data-gap 绑定命中
         CSS 档位块（非档位名值不命中任何块、由 JS 通道内联接管，两通道互补） -->
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
`,Pr=`autospark.space`;function Fr(e){e.components[Pr]=Nr}Ir();function Ir(){y(e=>{m(e),Fr(e)})}var Lr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——对齐/分布/间隙档位/自适应列模式绑定全部落在编译子树的内层
    body 上（body 即 grid 容器，变体直接命中 body 选择器，无需 :has() 反驱宿主）；
    列数（number/响应式对象）与间隙值形态经 mounted JS 通道写 body 内联
    （--asc-grid-cols 变量 / row-gap+column-gap 两轴，元素级样式覆盖档位块）。

    插槽出口 display:contents：子项穿透出口成为 body 的直接 grid 项（出口保留
    包裹层不剥标签，display:contents 使其布局透明——漏写则子项嵌套在出口层内、
    不参与轨道排布，见家族惯例）。子元素正常编译：插槽内容照常走宿主引擎编译。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得；grid 不在 data() 声明主题六键，组件内部变体属性亦禁用六个
     通道名——间隙档位属性用 data-gap（非通道名），medium 档经 --auto-spacing 联动
     theme spacing 档位，其余档直取 --x-spacing-* 标尺 -->
<div
  class="asc-grid"
  x-define="autospark.grid"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            cols: 3,           // 列数：number 固定列 | "auto" 自适应（auto-fill，最小列宽 --asc-grid-min）| { xs?, sm?, md?, lg?, xl?, xxl? } 响应式档位（视口断点列数，档名对齐 viewport 六档，断点 Bootstrap 5 min-width：sm 576 / md 768 / lg 992 / xl 1200 / xxl 1400）
            gap: 0,            // 间隙：number（px）| 档位名（x-small/small/medium/large/x-large → CSS 变量档）| 任意 CSS 值字符串 | [水平, 垂直] 两轴数组；缺省 0（CSS 原生栅格语义，显式声明才生效）
            justify: "start",  // 轨道水平分布：start | center | end | between | around | evenly（列宽不满容器时有效，如 auto 自适应列）
            align: "stretch",  // 项的块轴对齐：stretch（缺省，随轨道拉伸）| start | center | end | baseline
        }),
        mounted() {
            // ---------- 间隙值形态同步（与 space 组件同构） ----------
            // 档位名（标尺五档）由 CSS 档位块承接——内联两轴清除即回档位块；number 归一
            // px、字符串 CSS 值透传、数组 [水平, 垂直] 拆两轴（row-gap=垂直、column-gap=
            // 水平，第二项缺省同第一项）。mounted 时化身子树可能尚未挂载（body 不可查），
            // 一跳后再同步（button syncIconStyle 同款时序处理）
            const TIERS = ["x-small", "small", "medium", "large", "x-large"];
            const syncGap = () => {
                const body = this.el.querySelector(".asc-grid-body");
                if (!body) return;
                body.style.removeProperty("row-gap");
                body.style.removeProperty("column-gap");
                const s = this.data.gap;
                if (s == null || (typeof s === "string" && TIERS.includes(s))) return; // 档位名走 CSS 块
                const norm = (v) => (typeof v === "number" ? v + "px" : String(v));
                let row, col;
                if (Array.isArray(s)) {
                    col = norm(s[0]);         // 水平（column-gap）
                    row = norm(s[1] ?? s[0]); // 垂直（row-gap），缺省同水平
                } else {
                    row = col = norm(s);
                }
                body.style.rowGap = row;
                body.style.columnGap = col;
            };

            // ---------- 列数同步（cols 三形态） ----------
            // number：列数写 body 的 --asc-grid-cols 变量（CSS repeat() 消费）；
            // "auto"：CSS 档位块接管（data-cols-mode 绑定），不写列数变量；
            // 对象：响应式档位——matchMedia 按断点自高向低探测，取当前最高命中档的
            // 列数（全未命中回退 xs ?? 1；matchMedia 缺席环境同样回退，静默降级）。
            // 档位断点监听：视口跨断点时重算列数（响应式题中之义）；监听对挂 body 的
            // JS 属性（_ascGridMqls，非 data 域）以便 cols 变化重建与 unmounted 清理
            const BREAKPOINTS = { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 }; // xs 无阈值 = 基础档
            const TIER_ORDER = ["xxl", "xl", "lg", "md", "sm"]; // 自高向低探测
            const MQLS_KEY = "_ascGridMqls";
            const unbindMqls = (body) => {
                for (const { mql, fn } of body[MQLS_KEY] ?? []) {
                    if (mql.removeEventListener) mql.removeEventListener("change", fn);
                    else if (mql.removeListener) mql.removeListener(fn); // 旧 API 回退
                }
                body[MQLS_KEY] = [];
            };
            const tierCols = (cols) => {
                for (const t of TIER_ORDER) {
                    if (cols[t] == null) continue;
                    if (typeof window?.matchMedia === "function"
                        && window.matchMedia(\`(min-width: \${BREAKPOINTS[t]}px)\`).matches) return cols[t];
                }
                return cols.xs ?? 1; // 全未命中（窄视口 / 无 matchMedia）回退基础档
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
                            else if (mql.addListener) mql.addListener(fn); // 旧 API 回退
                            pairs.push({ mql, fn });
                        }
                    }
                    body[MQLS_KEY] = pairs;
                    body.style.setProperty("--asc-grid-cols", String(Math.max(1, Math.floor(tierCols(c)))));
                }
                // "auto" / 其他形态：CSS 档位块或缺省 3 列接管，无 JS 通道动作
            };
            setTimeout(() => { syncGap(); syncCols(); }, 0);
            this.watch("gap", () => { setTimeout(syncGap, 0); });
            this.watch("cols", () => { setTimeout(syncCols, 0); });
        },
        unmounted() {
            // 断点监听清理（防泄漏：mql 为全局长命对象，组件拆卸须摘监听）；
            // unmounted 时子树可能已拆（body 不可查则无监听在场，静默通过）
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
    /* 宿主：块级容器（零色彩消费，暗色模式天然无感——无暗色兜底块） */
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

    /* ---------- 项的块轴对齐（align；缺省 stretch 即 CSS 缺省 normal 不写块）---------- */
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

    /* 插槽出口布局透明：子项穿透成为 body 直接 grid 项 */
    .asc-grid-slot {
      display: contents;
    }
  </style>
  <!-- 变体数据属性承载在 body（编译子树内层元素）；gap 档位名经 data-gap 绑定命中
         CSS 档位块（非档位名值不命中任何块、由 JS 通道内联接管，两通道互补）；
         cols="auto" 经 data-cols-mode 切换 CSS 轨道模板 -->
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
`,Rr=`autospark.grid`;function zr(e){e.components[Rr]=Lr}Br();function Br(){y(e=>{m(e),zr(e)})}var Vr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层 body 上，宿主级外观（淡底/语义色边框/圆角等）经 body 上的 data-* 变体属性
    以 :has() 驱动；closed 关闭态在 mounted 钩子经 JS 通道同步宿主 data-closed 属性
    （CSS 消费隐藏，属性驱动而非直接 display:none——使用者可经自定义 CSS 接管动画）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - close：closable 关闭图标点击冒泡，detail 为空（关闭即 closed 置位 + 宿主隐藏）

    与 x-error 指令的边界（ADR-0019）：x-error 是 error 事件通道的就近消费（行为
    指令——捕获子树运行时错误并呈现）；alert 是静态展示组件——内容（title/description）
    全部使用者传入，不监听 error 通道。动态错误呈现用 x-error，静态警示条用 alert，
    两者正交不互相替代。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随（--auto-font-size 基线），
     alert 不设自有字号属性（button 同范式 ADR-0012）；data() 不得声明主题六键，
     组件内部变体属性亦禁用六个通道名（data-type/data-banner 为自有变体轴） -->
<!-- 无内置文案、不接 i18n（ADR-0018 决策 6.1 通道对本件无消费面）：title/description
     均使用者传入 -->
<div
  class="asc-alert"
  x-define="autospark.alert"
  x-define:inherit="autospark.base"
  role="alert"
>
  <script setup>
    {
        data: () => ({
            type: "default",       // 语义色五档：success | warning | danger | info | default（中性，缺省）
            title: "",            // 标题文案（空则不渲染标题行）
            description: "",       // 描述文案（默认插槽内容优先；title 下常规正文色）
            closable: false,       // 关闭按钮：点击 closed 置位（宿主 data-closed → CSS 隐藏）+ close 事件冒泡
            icon: "",             // 图标覆盖：string 图标名 | { name } 对象 | false 关闭图标；空 = 按 type 默认映射内置图标
            banner: false,        // 边缘通栏形态：无圆角满宽（贴容器边缘）
            closed: false,        // 内部状态：关闭置位（外部状态注入亦可驱动——重开通道）
            // computed 简写（普通函数值即计算属性，仅限单表达式）：图标名解析——
            // 显式 icon 优先（false = 关闭不渲染），空则按 type 映射内置图标
            // （success→success / warning→warn / danger→error / info→info / 中性→bell）
            displayIcon: (s) => s.icon === false ? "" : (typeof s.icon === "object" && s.icon) ? (s.icon.name ?? "") : (typeof s.icon === "string" && s.icon ? s.icon : (s.type === "success" ? "success" : s.type === "warning" ? "warn" : s.type === "danger" ? "error" : s.type === "info" ? "info" : "bell"))
        }),
        methods: {
            // 关闭图标点击：阻断原生 click 冒泡（防误触外层点击域）→ closed 置位
            // （mounted 的 watch 同步宿主 data-closed 属性 → CSS 隐藏）→ 广播 close
            // 事件（bubbles，外层消费做联动）
            onCloseClick(event) {
                event.stopPropagation();
                this.data.closed = true;
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
        },
        mounted() {
            // closed → 宿主 data-closed 属性同步（化身路径约束：宿主属性走 JS 通道；
            // 回调收 { value } 信封对象，此处不取值只重查整态——家族惯用法见 overlay/foldable.ts）。
            // 外部经 props 注入 closed（引用外部状态）时本通道兼作重开入口（false → 摘属性）
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
      /* 语义色中转（data-type 注入；中性缺省 = 正文色） */
      --asc-tone: var(--auto-color, var(--asc-alert-default, #606060));
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-alert-padding, 0.8rem));
      display: flex; /* 显式块级：元素名写法化身 HTMLUnknownElement 亦满宽 */
      box-sizing: border-box;
      padding: calc(var(--asc-pad) * 0.7) calc(var(--asc-pad) * 0.85);
      border: var(--auto-border-size, var(--asc-alert-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-tone) 38%, transparent);
      border-radius: var(
        --auto-border-radius,
        var(--asc-alert-radius, 0.5rem)
      );
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
      /* 描述正文色（标题/图标另行取 tone） */
      color: var(--auto-color, var(--asc-alert-color, #606060));
      font-size: var(--auto-font-size, var(--asc-alert-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-alert-line-height, 1.5));
    }
    /* ---------- 语义色五档（:has() 反驱宿主，button 同款 --asc-tone 组织） ---------- */
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

    /* ---------- 通栏形态（banner）：无圆角满宽（贴容器边缘） ---------- */
    .asc-alert:has(> .asc-alert-body[data-banner="true"]) {
      border-radius: 0;
    }

    /* ---------- 关闭态（closed 置位 → 宿主 data-closed 属性通道） ---------- */
    .asc-alert[data-closed] {
      display: none;
    }

    /* ---------- body 布局（编译子树内层，绑定可求值） ---------- */
    .asc-alert-body {
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      min-width: 0;
    }
    /* 图标位：略大于正文（警示感），色随 tone；不收缩（描述多行时图标恒定） */
    .asc-alert-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25em;
      color: var(--asc-tone);
      flex-shrink: 0;
    }
    /* 主文本组：title 与 description 恒纵排（description 在 title 下方） */
    .asc-alert-main {
      display: flex;
      flex-direction: column;
      gap: 0.2em;
      flex: 1;
      min-width: 0;
    }
    /* 标题：语义色 + medium 字重（标尺档；描述为常规正文色由宿主 color 承担） */
    .asc-alert-title {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
    /* 描述出口：空内容不占位（title/description 均空的纯图标条不留行高） */
    .asc-alert-desc:empty {
      display: none;
    }
    /* 关闭按钮：右端淡色小图标（正文色淡化），独立 hover 反馈 */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 变体数据属性承载在 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->
  <div class="asc-alert-body" :data-type="type" :data-banner="banner">
    <!-- 图标位：displayIcon computed 解析（显式 icon 优先，空则按 type 映射内置图标） -->
    <i class="asc-alert-icon" x-if="displayIcon" x-icon="displayIcon"></i>
    <div class="asc-alert-main">
      <!-- 标题行：空 title 不渲染 -->
      <span class="asc-alert-title" x-if="title">{{ title }}</span>
      <!-- 描述出口：插槽内容优先，无内容回退 {{ description }}（组件自身状态求值） -->
      <span class="asc-alert-desc" x-slot>{{ description }}</span>
    </div>
    <!-- 关闭按钮（closable 启用）：内置 no 图标，点击走 methods 通道（绑定表达式不含 methods） -->
    <i
      class="asc-alert-close"
      x-if="closable"
      x-icon="'no'"
      @click="onCloseClick($event)"
    ></i>
  </div>
</div>
`,Hr=`autospark.alert`;function Ur(e){e.components[Hr]=Vr}Wr();function Wr(){y(e=>{m(e),Ur(e)})}var Gr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定（bordered/hoverable/collapsible/collapsed）全部落在编译子树的
    内层 inner 元素上，卡片盒子样式直接命中 inner 的 data-* 属性选择器（宿主 .asc-card
    为透明块壳，仅承载块级排版基线，无需 :has() 反驱）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - collapse：可折叠头部点击翻转后冒泡，detail = { collapsed }（翻转后的新值）；
      外部 props 驱动的 collapsed 变化不广播（防回环）。

    空段隐藏约定：title 空 + header/extra 槽无内容 + 不可折叠 → 整个 header 隐藏；
    footer 槽无内容 → footer 隐藏；body 槽无内容（纯头卡片）→ body 隐藏——:empty 判定
    要求出口内无空白文本节点，出口元素内容必须紧凑书写（button label 同款纪律）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——阴影/圆角/字号档位经主题通道全跟随（卡片阴影即走 data-shadow
     通道消费 --auto-shadow）；card 不在 data() 声明主题六键，内部变体属性亦禁用
     六个通道名 -->
<div
  class="asc-card"
  x-define="autospark.card"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            title: "",          // 头部标题（header 槽可整体重载，槽内容优先于本兜底）
            bordered: true,     // 边框开关（false 边框转透明色，盒模型占位稳定不跳变；绑定通道取反落 data-borderless——假值属性整个移除的家族约定下缺省即有边框）
            hoverable: false,   // 悬停浮起（边框点亮 + 阴影抬升；阴影档位基线仍随 data-shadow 通道）
            collapsible: false, // 头部可折叠（true 时点击标题区/箭头切换 collapsed；extra 区域不触发）
            collapsed: false,   // 折叠态（受控：外部 props 可驱动；内部切换经 collapse 事件广播）
        }),
        methods: {
            // 头部标题区点击（仅 collapsible 生效）：翻转 collapsed + collapse 事件冒泡
            //（detail = { collapsed } 翻转后的新值）；handler 挂在 toggle 组元素上，
            // header 槽内容替换不改变宿主元素的事件绑定；extra 区域不在组内不触发
            onHeadClick() {
                if (!this.data.collapsible) return;
                this.data.collapsed = !this.data.collapsed;
                this.el.dispatchEvent(new CustomEvent("collapse", { bubbles: true, detail: { collapsed: this.data.collapsed } }));
            },
        },
    }
  <\/script>
  <style global id="autospark-components-card">
    /* 宿主：透明块壳（盒子样式全在 inner），仅承载块级排版与字号基线
         （--auto-font-size 随 data-size 档位全跟随，button 同范式 ADR-0012） */
    .asc-card {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-card-font-size, 0.875rem));
    }

    /* ---------- 卡片盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */
    .asc-card-inner {
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族），data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-card-padding, 0.8rem));
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #d9d9d9));
      display: flex;
      flex-direction: column;
      background: var(--auto-bgcolor, var(--asc-card-bg, #ffffff));
      border: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-card-radius, 0.5rem));
      /* 阴影走 theme 手动通道：data-shadow 档位在 theme 在场时覆写 --auto-shadow，
           缺省兜底为极轻投影（对齐 theme 默认 medium 档校准值） */
      box-shadow: var(--auto-shadow, var(--asc-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04)));
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .asc-card-inner[data-borderless="true"] {
      --asc-line: transparent;
    }
    /* 悬停浮起：边框点亮主色 + 阴影抬升（抬升档为组件自有视觉，--asc-card-hover-shadow 可覆盖） */
    .asc-card-inner[data-hoverable="true"]:hover {
      border-color: var(--auto-primary-color, var(--asc-card-primary, #009aff));
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
    }

    /* ---------- header：标题区（toggle 组）+ extra ---------- */
    .asc-card-head {
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);
      border-bottom: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid
        var(--asc-line);
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */
      line-height: 1.4;
    }
    /* 空头隐藏：title 空 + header/extra 槽无内容 + 不可折叠（箭头缺席）→ 整段不占位 */
    .asc-card-head:has(> .asc-card-toggle > .asc-card-head-main:empty):has(
        > .asc-card-extra:empty
      ):not(:has(.asc-card-arrow)) {
      display: none;
    }
    /* 标题区 toggle 组：箭头 + 标题出口（flex:1 把 extra 推向右缘）；可折叠时整组可点 */
    .asc-card-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      min-width: 0;
      flex: 1;
    }
    .asc-card-head[data-collapsible="true"] .asc-card-toggle {
      cursor: pointer;
      user-select: none;
    }
    .asc-card-head-main {
      min-width: 0;
    }
    /* 折叠箭头：缺省展开朝下（rotate 90°），折叠态收回朝右 */
    .asc-card-arrow {
      display: inline-flex;
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(0, 0, 0, 0.35)));
      transform: rotate(90deg);
      transition: transform 0.2s ease;
    }
    .asc-card-head[data-collapsed="true"] .asc-card-arrow {
      transform: rotate(0deg);
    }
    /* extra：header 右缘动作区（toggle 组 flex:1 已推开） */
    .asc-card-extra {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
    }
    .asc-card-extra:empty {
      display: none;
    }

    /* ---------- body：默认插槽出口（出口即容器，投影内容为直接子级） ---------- */
    .asc-card-body {
      flex: 1;
      padding: var(--asc-pad);
    }
    .asc-card-body:empty {
      display: none;
    }

    /* ---------- footer ---------- */
    .asc-card-footer {
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);
      border-top: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-card-footer:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-card-inner,
    [data-dark] .asc-card-inner {
      background: var(--auto-bgcolor, var(--asc-card-bg, #3a3a3a));
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #4d4d4d));
    }
    [dark] .asc-card-inner[data-hoverable="true"]:hover,
    [data-dark] .asc-card-inner[data-hoverable="true"]:hover {
      border-color: var(--auto-primary-color, var(--asc-card-primary, #56baff));
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.4));
    }
    [dark] .asc-card-arrow,
    [data-dark] .asc-card-arrow {
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <!-- 变体数据属性承载在 inner（编译子树内层元素）；body/footer 的折叠显隐组合 x-show
         （spec 约定：可折叠勿引重机制） -->
  <div
    class="asc-card-inner"
    :data-borderless="!bordered"
    :data-hoverable="hoverable"
  >
    <div
      class="asc-card-head"
      :data-collapsible="collapsible"
      :data-collapsed="collapsed"
    >
      <!-- 标题区 toggle 组：箭头（结构元素，在 header 槽出口之外，不随槽内容替换消失）
               + header 槽出口（无内容时回退 {{ title }}——紧凑书写，:empty 判定纪律） -->
      <div class="asc-card-toggle" @click="onHeadClick()">
        <i class="asc-card-arrow" x-if="collapsible" x-icon="'arrow'"></i>
        <div class="asc-card-head-main" x-slot:header>{{ title }}</div>
      </div>
      <div class="asc-card-extra" x-slot:extra></div>
    </div>
    <div class="asc-card-body" x-show="!collapsed" x-slot></div>
    <div class="asc-card-footer" x-show="!collapsed" x-slot:footer></div>
  </div>
</div>
`,Kr=`autospark.card`;function qr(e){e.components[Kr]=Gr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-card`))){if(t.hasAttribute(`x-component`))continue;let e=t.getAttribute(`title`);e!=null&&(t.hasAttribute(`:title`)||t.setAttribute(`:title`,JSON.stringify($(e))),t.removeAttribute(`title`))}})}Jr();function Jr(){y(e=>{m(e),qr(e)})}var Yr=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定（type/variant/closed）落在编译子树的内层 body 上，宿主外观
    （底色/描边/文字色）经 body 的 data-* 变体属性以 :has() 驱动（button 同款范式）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - close：关闭钮点击冒泡，cancelable，detail = { event }（原始点击事件）；
      未 preventDefault 时组件自动置 closed 隐藏整枚，preventDefault 则交由外部
      全权接管关闭时机（受控用法惯用法）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——尺寸档经主题通道 data-size 全跟随（字号/padding 以 em 标定自动
     缩放，无自有尺寸属性）；tag 不在 data() 声明主题六键，内部变体属性亦禁用六通道名 -->
<span
  class="asc-tag"
  x-define="autospark.tag"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "default",   // 语义色（对齐 button 范式 ADR-0012）：primary | success | warning | danger | info | default 中性档
            variant: "light",  // 形态（与语义色正交）：light 淡底（缺省）| solid 实底白字 | outline 描边
            icon: "",          // 前置图标名或 { name } 对象（x-icon 值通道，随状态响应）
            closable: false,   // 关闭钮：点击 close 事件冒泡；未 preventDefault 自动隐藏
            closed: false,     // 关闭态（true 经 :has() 通道隐藏整枚；受控可回 false 重现）
        }),
        methods: {
            // 关闭钮点击：阻断原生点击冒泡（不触发宿主级 @click）→ close 事件冒泡
            //（cancelable，detail = { event } 原始点击事件）→ 未 preventDefault 则
            // 自动置 closed（CSS 通道隐藏整枚）；外部接管关闭时机时 preventDefault
            onCloseClick(event) {
                event.stopPropagation();
                const ev = new CustomEvent("close", { bubbles: true, cancelable: true, detail: { event } });
                this.el.dispatchEvent(ev);
                if (!ev.defaultPrevented) this.data.closed = true;
            },
        },
    }
  <\/script>
  <style global id="autospark-components-tag">
    /* 宿主即标签盒子：--asc-tone 语义色中转（data-type 注入）+ 三通道变量（data-variant 注入）；
         内距以 em 标定——随字号（data-size 档位 → --auto-font-size）自动缩放 */
    .asc-tag {
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));
      --asc-bg: color-mix(in srgb, var(--asc-tone, #606060) 10%, transparent);
      --asc-ink: var(--asc-tone);
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 30%, transparent);
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      padding: 0.15em 0.6em;
      font-size: var(--auto-font-size, var(--asc-tag-font-size, 0.75rem));
      line-height: 1.5;
      border: var(--auto-border-size, var(--asc-tag-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));
      background: var(--asc-bg);
      color: var(--asc-ink);
      cursor: default;
      user-select: none;
      transition: filter 0.15s ease;
    }

    /* ---------- 语义色轴（type）：--asc-tone 中转，button/link 同款范式 ---------- */
    .asc-tag:has(> .asc-tag-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #009aff));
    }
    .asc-tag:has(> .asc-tag-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #22c55e));
    }
    .asc-tag:has(> .asc-tag-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f59e0b));
    }
    .asc-tag:has(> .asc-tag-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #ef4444));
    }
    .asc-tag:has(> .asc-tag-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #71717a));
    }
    /* default：中性档（正文色，base 值即本档——light 淡灰底） */
    .asc-tag:has(> .asc-tag-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));
    }

    /* ---------- 形态轴（variant，与语义色正交）：三通道变量注入 ---------- */
    /* solid：实底白字（语义色底上的白字为恒定设计，非变量映射——ADR-0129 备注） */
    .asc-tag:has(> .asc-tag-body[data-variant="solid"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
      --asc-line: transparent;
    }
    /* outline：透明底 + 语义色描边/文字（描边取 55% 混淡，视觉与文字同级不抢） */
    .asc-tag:has(> .asc-tag-body[data-variant="outline"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 55%, transparent);
    }
    /* light 为缺省形态：base 值即本档（淡底 + 同色文字 + 淡描边），无需变体块 */

    /* ---------- 关闭态（closed）：:has() 通道隐藏整枚 ---------- */
    .asc-tag:has(> .asc-tag-body[data-closed="true"]) {
      display: none;
    }

    /* ---------- body 布局（编译子树内层，绑定可求值） ---------- */
    .asc-tag-body {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      min-width: 0;
    }
    /* 空出口不占位：纯图标用法（插槽无内容）时 label 隐藏，消除 gap 占位 */
    .asc-tag-label:empty {
      display: none;
    }
    /* 关闭钮：小一号 × 图标（内置 no），独立 hover 反馈（按内容色派生淡底） */
    .asc-tag-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: -0.15em;
      padding: 0.05em;
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .asc-tag-close:hover {
      background: color-mix(in srgb, var(--asc-ink, currentColor) 25%, transparent);
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #56baff));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="success"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #5cd07c));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f0a03c));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #e6696a));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="info"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #a1a1aa));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="default"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-tag-color, #fafafa));
    }
  </style>
  <!-- 变体数据属性承载在 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->
  <span
    class="asc-tag-body"
    :data-type="type"
    :data-variant="variant"
    :data-closed="closed"
  >
    <!-- icon 双形态：字符串 = 图标名；对象 = { name }（x-icon 值通道） -->
    <i
      class="asc-tag-icon"
      x-if="typeof icon === 'string' && icon"
      x-icon="icon"
    ></i>
    <i
      class="asc-tag-icon"
      x-if="typeof icon === 'object' && icon && icon.name"
      x-icon="icon.name"
    ></i>
    <!-- 默认插槽出口：标签文字（紧凑书写——:empty 判定纪律） -->
    <span class="asc-tag-label" x-slot></span>
    <!-- 关闭钮（closable）：字面量须带引号——裸 no 会命中 data.no 键 -->
    <i
      class="asc-tag-close"
      x-if="closable"
      x-icon="'no'"
      @click="onCloseClick($event)"
    ></i>
  </span>
</span>
`,Xr=`autospark.tag`;function Zr(e){e.components[Xr]=Yr}Qr();function Qr(){y(e=>{m(e),Zr(e)})}var $r=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——本组件无宿主级变体（视觉全在内层静态结构上），根上零绑定即零风险；
    description / icon 经内层插值与 x-icon 值通道响应（指令值通道响应式）。

    内置文案（ADR-0018 决策 6 约定 1）：description 缺省走 i18n 词典 empty.description
    键——i18n 插件在场时按 $.language 查表（scope 链 → engine 全局 → options.i18n.messages，
    使用者可任意语言覆译，语言切换经响应式重求值即时生效）；未装 i18n / 词典无此键时
    引擎兜底 t 恒等返回键本身，以键等值判定回退硬编码中文「暂无数据」（依赖松弛不强制）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档经主题通道 data-size 全跟随；empty 不在 data() 声明
     主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-empty"
  x-define="autospark.empty"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            description: "",  // 描述文案：空时走 i18n 词典 empty.description 键（回退「暂无数据」，见文件头注释）
            icon: "file",     // 图标：内置图标名或 { name } 对象（image 槽可整体换图；空串不渲染图标）
        }),
    }
  <\/script>
  <style global id="autospark-components-empty">
    /* 宿主：水平居中容器（块级满宽，内容居中） */
    .asc-empty {
      display: flex;
      justify-content: center;
      padding: var(--auto-padding, var(--asc-empty-padding, 0.8rem));
      font-size: var(--auto-font-size, var(--asc-empty-font-size, 0.875rem));
    }
    /* 主体：纵列居中（图 → 描述 → 附加内容） */
    .asc-empty-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 100%;
    }
    /* 图区：image 槽出口即容器（默认兜底为大号内置图标；换图整体替换） */
    .asc-empty-image {
      color: var(--auto-third-color, var(--asc-empty-image-color, rgba(0, 0, 0, 0.35)));
      font-size: 2.6em; /* 相对字号标定：随 data-size 档位缩放 */
      line-height: 1;
    }
    /* 描述：次要文字色（i18n 兜底文案同通道） */
    .asc-empty-desc {
      margin-top: 0.6em;
      color: var(--auto-secondary-color, var(--asc-empty-desc-color, rgba(0, 0, 0, 0.55)));
      font-size: 0.875em;
      line-height: 1.5;
    }
    /* 附加内容（默认插槽）：描述下方动作区（常放按钮组）；空插槽不占位 */
    .asc-empty-extra {
      margin-top: 1em;
    }
    .asc-empty-extra:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
    <!-- image 槽出口：无内容时回退大号内置图标（icon 双形态：字符串 = 图标名；对象 = { name }） -->
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
    <!-- 描述：显式传入优先；缺省走 i18n 词典（键等值判定回退硬编码中文——见文件头注释；
             t 经表达式求值器注入，i18n ready 覆写槽后经 scope.refresh 重求值换血） -->
    <div class="asc-empty-desc">{{ description || (t('empty.description') === 'empty.description' ? '暂无数据' : t('empty.description')) }}</div>
    <!-- 默认插槽出口：附加内容（紧凑书写——:empty 判定纪律） -->
    <div class="asc-empty-extra" x-slot></div>
  </div>
</div>
`,ei=`autospark.empty`;function ti(e){e.components[ei]=$r}ni();function ni(){y(e=>{m(e),ti(e)})}var ri=`<!--
    BaseField 表单域骨架（ADR-0020）——base/ 目录首个产物（ADR-0018 决策 7：form 前瞻
    唯一例外，其余基类演进式抽取）。内部基类、非用户直接消费（无文档页/侧边栏/元素名
    形态，实例化仅得空壳——控件结构由子组件默认段注入）。

    骨架职责（宁薄勿胖——只承担 form 域家族共性，控件本体与装饰一概留给子组件）：
    - 结构：宿主级包裹层（.asc-field 布局基座，class 拼接进子组件宿主）+ 单默认出口
      （.asc-field-body，display:contents 不产生布局层）——子组件全部控件结构经默认段
      替换出口 fallback（继承覆盖，ADR-0081）；盒饰 chrome 为 .asc-field-box 选配类
      （input 类控件用，checkbox/radio/switch 等裸态控件不用）
    - 状态色通道：status（"" | error | success | warning）→ 宿主 data-status 属性 →
      --asc-field-tone 中转变量派生（焦点环/边框色统一消费）；error 态同步 aria-invalid
    - 焦点态追踪：focusin/focusout（焦点在骨架内元素间移动不闪烁）→ 宿主 data-focus
    - disabled / readonly：同步到 [data-autospark-control] 原生控件 + 宿主 data-disabled /
      data-readonly 反射（CSS 淡化与光标通道）
    - 尺寸档位：经 autospark.base 继承链消费主题 data-size 通道（--auto-input-height /
      --auto-input-padding 随档位联动），骨架不设自有尺寸属性（button 同范式 ADR-0012）
    - 与 x-field 分工（ADR-0018 决策 7：不双轨建域）：label/校验/域布局由 engine
      x-form/x-field 指令承担；校验结果经子组件 status props 染色进入（x-field 容器
      形态后代绑定 status: $field.error ? "error" : ""），骨架不感知 x-field

    data-* 标记协议（子组件挂点约定，ADR-0020）：
    - data-autospark-control：原生控件标记——disabled/readonly/aria-invalid 同步目标、
      点击转发焦点的受让者
    - data-autospark-action：交互动作件标记（清除/切换钮等）——点击不转发焦点（自理）
-->
<!-- 继承 autospark.base（ADR-0134）须为非抽象继承：abstract 组件不能再声明
     x-define:inherit（ADR-0134 抽象根约束），而主题档位六键物化必须沿继承链下传——
     故本骨架贡献真实模板（包裹层 + 出口），子组件快照 = 本骨架克隆 + 子默认段替换 +
     子根属性并入（class 拼接：宿主恒得 .asc-field + 子自有类），继承链
     子组件 → base-field → autospark.base 三层（ADR-0020 决策 2） -->
<span
  class="asc-field"
  x-define="autospark.base-field"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            status: "",       // 状态色通道："" 无 | error 危险 | success 成功 | warning 警告（tone 中转变量随动，焦点环/边框消费）
            disabled: false,  // 禁用：同步 [data-autospark-control] 原生控件 + 宿主 data-disabled（CSS 淡化/光标）
            readonly: false,  // 只读：同步 [data-autospark-control]（readOnly 语义）+ 宿主 data-readonly
        }),
        mounted() {
            // —— 控件查询（data-autospark-control 标记协议）：每查现取不缓存——运行时
            //     控件可能随形态切换重建（input ↔ textarea 等），缓存引用会指向已摘除节点
            const control = () => this.el.querySelector("[data-autospark-control]");

            // —— 状态色通道：status → 宿主 data-status（CSS 派生 --asc-field-tone）——
            const applyStatus = () => {
                const v = this.data.status;
                if (typeof v === "string" && v !== "") this.el.setAttribute("data-status", v);
                else this.el.removeAttribute("data-status");
            };

            // —— 控件同步：disabled/readonly 落原生控件 + 宿主反射 + error 态 aria-invalid
            //     （可访问性：组件级状态归一到 aria，与原生约束校验互补）——
            const syncControl = () => {
                const c = control();
                if (c) {
                    c.disabled = !!this.data.disabled;
                    if ("readOnly" in c) c.readOnly = !!this.data.readonly;
                    if (this.data.status === "error") c.setAttribute("aria-invalid", "true");
                    else c.removeAttribute("aria-invalid");
                }
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                this.el.toggleAttribute("data-readonly", !!this.data.readonly);
            };

            // —— 焦点态追踪：focusin/focusout 冒泡承接（骨架内任意可聚焦元素）——
            //     焦点在骨架内部元素间移动（如 input → 清除钮）时 relatedTarget 仍在
            //     骨架内，跳过摘除防闪烁
            this.el.addEventListener("focusin", () => {
                this.el.setAttribute("data-focus", "");
            });
            this.el.addEventListener("focusout", (e) => {
                const to = e.relatedTarget;
                if (to instanceof Node && this.el.contains(to)) return;
                this.el.removeAttribute("data-focus");
            });

            // —— 点击转发焦点：点击盒饰空白区/前后置装饰（非控件非动作件）时焦点落控件
            //     （原生 label 包裹的近似体验；动作件 data-autospark-action 自理不转发）——
            this.el.addEventListener("click", (e) => {
                const t = e.target instanceof Element ? e.target : null;
                if (!t) return;
                if (this.data.disabled) return;
                if (t.closest("[data-autospark-control]")) return;
                if (t.closest("[data-autospark-action]")) return;
                const c = control();
                if (c && typeof c.focus === "function") c.focus();
            });

            // —— 初始化与跟随（mounted 时化身子树与 props 注入均可能未就位，一跳后
            //     首同步；后续 props 变化经 watch 保持——回调收 { value } 信封对象，
            //     此处只用作触发信号，家族惯用法）——
            const syncAll = () => { applyStatus(); syncControl(); };
            setTimeout(syncAll, 0);
            this.watch("status", () => { setTimeout(syncAll, 0); });
            this.watch("disabled", () => { setTimeout(syncAll, 0); });
            this.watch("readonly", () => { setTimeout(syncAll, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-base-field">
    /* ---------- .asc-field 布局基座（无盒饰——chrome 由 .asc-field-box 选配类承担）：
         tone 为状态色中转变量（缺省 primary，data-status 派生），焦点环/边框统一消费；
         尺寸档位经主题 data-size 通道全跟随（字号消费 --auto-font-size 基线） ---------- */
    .asc-field {
      --asc-field-tone: var(--auto-primary-color, var(--asc-field-primary, #009aff));
      display: inline-flex;
      align-items: center;
      font-size: var(--auto-font-size, var(--asc-field-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-field-line-height, 1.4));
      color: var(--auto-color, var(--asc-field-color, #606060));
    }
    /* 状态色派生（data-status 由 mounted 同步）：tone 切语义色，未聚焦也染边框 */
    .asc-field[data-status="error"] {
      --asc-field-tone: var(--auto-danger-color, var(--asc-field-danger, #ef4444));
    }
    .asc-field[data-status="success"] {
      --asc-field-tone: var(--auto-success-color, var(--asc-field-success, #22c55e));
    }
    .asc-field[data-status="warning"] {
      --asc-field-tone: var(--auto-warning-color, var(--asc-field-warning, #f59e0b));
    }

    /* ---------- .asc-field-box 盒饰选配类（input 类控件 chrome；裸态控件不加）：
         高度/内距消费 --auto-input-*（theme data-size/data-spacing 档位联动）；
         边框色经 --asc-field-line 中转（hover/focus/状态/禁用多级覆盖） ---------- */
    .asc-field-box {
      --asc-field-line: var(--auto-border-color, var(--asc-field-border-color, #d9d9d9));
      border: var(--auto-border-size, var(--asc-field-border-size, 1px)) solid
        var(--asc-field-line);
      border-radius: var(--auto-input-radius, var(--asc-field-radius, 0.375rem));
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #ffffff));
      /* 高度兜底随字号自适应（≈字号 × 2.57）：theme 档位块引用的 --x-input-height-* 标尺
         未定义（theme 侧缺陷），档位容器上 --auto-input-height 失效落此级时仍随档位缩放 */
      height: var(
        --auto-input-height,
        var(--asc-field-height, calc(var(--auto-font-size, 0.875rem) * 2.57))
      );
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        background-color 0.15s ease;
      cursor: text;
    }
    .asc-field-box:hover:not([data-disabled]):not([data-readonly]):not([data-status]) {
      --asc-field-line: var(--auto-hover-border-color, var(--asc-field-hover-border, #4098fc));
    }
    /* 焦点态（data-focus 由 focusin/focusout 同步）：边框取 tone + 同色淡晕 */
    .asc-field-box[data-focus] {
      --asc-field-line: var(--asc-field-tone);
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);
    }
    /* 状态在场：未聚焦也染状态色边框（聚焦规则同色调、仅补光晕） */
    .asc-field-box[data-status="error"],
    .asc-field-box[data-status="success"],
    .asc-field-box[data-status="warning"] {
      --asc-field-line: var(--asc-field-tone);
    }
    /* 禁用：边框/底色取禁用语义变量 + 禁点光标（控件字色由 opacity 整体淡化）；
         状态在场时边框让位状态色（status 是显式意图，禁用仅接管底色/光标） */
    .asc-field-box[data-disabled]:not([data-status]) {
      --asc-field-line: var(
        --auto-disable-border-color,
        var(--asc-field-disable-border, #d9d9d9)
      );
      background: var(--auto-disable-bgcolor, var(--asc-field-disable-bg, rgba(0, 0, 0, 0.04)));
      cursor: not-allowed;
    }
    .asc-field-box[data-disabled][data-status] {
      background: var(--auto-disable-bgcolor, var(--asc-field-disable-bg, rgba(0, 0, 0, 0.04)));
      cursor: not-allowed;
    }
    /* 只读：光标归正文（无禁用淡化） */
    .asc-field-box[data-readonly] {
      cursor: default;
    }

    /* ---------- 默认出口包裹层：不产生布局层（子组件控件直接成为骨架 flex 项） ---------- */
    .asc-field-body {
      display: contents;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-field,
    [data-dark] .asc-field {
      --asc-field-tone: var(--auto-primary-color, var(--asc-field-primary, #56baff));
      color: var(--auto-color, var(--asc-field-color, #fafafa));
    }
    [dark] .asc-field[data-status="error"],
    [data-dark] .asc-field[data-status="error"] {
      --asc-field-tone: var(--auto-danger-color, var(--asc-field-danger, #e6696a));
    }
    [dark] .asc-field[data-status="success"],
    [data-dark] .asc-field[data-status="success"] {
      --asc-field-tone: var(--auto-success-color, var(--asc-field-success, #5cd07c));
    }
    [dark] .asc-field[data-status="warning"],
    [data-dark] .asc-field[data-status="warning"] {
      --asc-field-tone: var(--auto-warning-color, var(--asc-field-warning, #f0a03c));
    }
    /* 暗色兜底让位状态色：状态在场时边框取 tone（:not 守卫防高特异性兜底块压掉状态染色） */
    [dark] .asc-field-box:not([data-status]),
    [data-dark] .asc-field-box:not([data-status]) {
      --asc-field-line: var(--auto-border-color, var(--asc-field-border-color, #52525b));
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #3a3a3a));
    }
    [dark] .asc-field-box[data-disabled]:not([data-status]),
    [data-dark] .asc-field-box[data-disabled]:not([data-status]) {
      --asc-field-line: var(--auto-disable-border-color, var(--asc-field-disable-border, #52525b));
      background: var(--auto-disable-bgcolor, var(--asc-field-disable-bg, rgba(255, 255, 255, 0.08)));
    }
  </style>
  <!-- 单默认出口（display:contents）：子组件（input 等）经继承默认段注入全部控件结构；
       消费方实例化内容仍可再覆盖（三层优先级：消费方内容 > 继承覆盖 > 本空 fallback） -->
  <span class="asc-field-body" x-slot></span>
</span>
`,ii=`autospark.base-field`;function ai(e){e.components[ii]=ri}oi();function oi(){y(e=>{m(e),ai(e)})}var si=`<!--
    autospark.input 输入框（ADR-0020）——原生增强路线：真实原生控件（input / textarea）
    + 样式包裹，不自绘输入面（保原生可访问性：键盘/IME/自动填充/移动端兼容，ADR-0018
    决策 7）。继承 autospark.base-field 表单域骨架（状态色通道/焦点态/disabled 同步/
    盒饰 chrome，ADR-0020），本组件专注控件本身。

    值通道（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件——
    宿主为包裹层元素（无原生 value），x-model 写读都落劫持位；内层原生 input 事件
    自然冒泡过宿主，x-model 监听直接命中（无需手动派发——原生控件自带 value 语义，
    桥比 button-group 组值桥更薄）。value props 为非受控初值/单向同步（受控真相走
    x-model）。

    表单提交（ADR-0020）：宿主 name 透传到内层原生控件——原生直提交（input/textarea
    自带提名义，含 Enter 提交语义；对照 state-button 的 hidden input 桥分叉，本组件
    控件即真身无须代理载体）。

    事件出口（组件默认封闭，原生事件经冒泡到外层消费）：
    - input / change：内层原生控件事件自然冒泡（x-model 与外层 @input/@change 直接消费）
    - 清除/眼睛切换为内部动作件（data-autospark-action，点击不转发焦点），不派发自定义事件
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-input + .asc-field-box 盒饰选配）；
     变体与状态属性经 mounted 的 JS 通道同步（data-form / data-over），根上无动态绑定（T4=B） -->
<span
  class="asc-input asc-field-box"
  x-define="autospark.input"
  x-define:inherit="autospark.base-field"
>
  <script setup>
    {
        data: () => ({
            type: "text",          // 文本族：text/password/email/tel/url/search 等（透传原生 input type）| "textarea" 多行形态（元素切换为 textarea；prefix/suffix/清除/计数照常可用，密码切换仅 password 消费）
            value: "",             // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥，ADR-0020）
            placeholder: "",       // 占位文案（同步原生 placeholder）
            maxlength: 0,          // >0 同步原生 maxlength（原生输入截断）+ 计数分母
            rows: 2,               // textarea 行数（仅 textarea 形态消费；原生缺省 2）
            clearable: false,      // 清除钮（值非空且可交互时可见；点击清空 + 派发 input + 焦点回控件）
            showPassword: false,   // 密码可见切换眼睛钮（仅 type=password 消费，其余形态忽略）
            showCount: false,      // 计数器（maxlength 在场显示「len / max」，否则仅 len；超限染 danger）
            prefix: "",            // 前置装饰：string 文本 | { icon: "图标名" } 图标（对象经状态引用注入）
            suffix: "",            // 后置装饰：形态同 prefix
            // —— 内部状态 ——
            passwordVisible: false, // 密码可见态（眼睛切换，内层 type password ↔ text）
            hasValue: false,        // 当前有值（清除钮可见性驱动；JS 通道随输入维护）
            countText: "",          // 计数文本（JS 侧构建——绑定通道对 props 后续注入不重算，ADR-0020）
        }),
        methods: {
            // 清除：清空原生控件 + 手动派发 input（程序赋值不触发原生事件；冒泡过宿主
            // 驱动 x-model 回写 state）+ 焦点回控件；阻断冒泡（内部动作件，click 不外泄）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.el.querySelector(".asc-input-native");
                if (!n) return;
                n.value = "";
                n.dispatchEvent(new Event("input", { bubbles: true }));
                n.focus();
            },
            // 密码可见切换：翻转 passwordVisible + 内层 type password ↔ text + 焦点回控件
            onTogglePassword(event) {
                event.stopPropagation();
                if (this.data.disabled) return;
                this.data.passwordVisible = !this.data.passwordVisible;
                const n = this.el.querySelector(".asc-input-native");
                if (n instanceof HTMLInputElement) {
                    n.type = this.data.passwordVisible ? "text" : (this.data.type || "text");
                }
                if (n) n.focus();
            },
        },
        mounted() {
            // —— 内层控件查询（每查现取：type 形态切换 input ↔ textarea 会重建元素）——
            const native = () => this.el.querySelector(".asc-input-native");
            // 当前值缓存（劫持 getter 的控件缺位兜底 + 形态切换回填）
            let lastValue = "";

            // —— 计数与清除可见性同步（len 由原生控件现值读出；超限染色的 data-over
            //     落宿主属性，CSS 通道消费——JS 直写无 T4=B 约束）——
            const syncLen = () => {
                const n = native();
                const len = n ? String(n.value ?? "").length : 0;
                this.data.hasValue = len > 0;
                const max = Number(this.data.maxlength) || 0;
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;
                this.el.toggleAttribute("data-over", max > 0 && len > max);
            };

            // —— 值同步（外部 → 控件）：形态切换重建后回填 lastValue ——
            const syncValue = () => {
                const n = native();
                if (n) n.value = lastValue;
                syncLen();
            };

            // —— 原生属性同步（props → 控件；绑定通道对 props 晚注入/后续变化不重算，
            //     走 JS 通道——button disabled 同款纪律，ADR-0012）——
            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                const t = String(this.data.type ?? "text");
                if (n instanceof HTMLInputElement) {
                    // type 透传（textarea 形态下本元素不渲染，防御性归一 text）；
                    // 密码可见切换：password + passwordVisible → text
                    n.type = t === "textarea"
                        ? "text"
                        : t === "password" && this.data.passwordVisible ? "text" : (t || "text");
                }
                n.placeholder = String(this.data.placeholder ?? "");
                const ml = Number(this.data.maxlength) || 0;
                if (ml > 0) n.setAttribute("maxlength", String(ml));
                else n.removeAttribute("maxlength");
                if (n instanceof HTMLTextAreaElement) n.rows = Number(this.data.rows) || 2;
                // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
                // 形态标记（CSS 通道：textarea 高度放开，:has() 的 JS 免版）
                if (t === "textarea") this.el.setAttribute("data-form", "textarea");
                else this.el.removeAttribute("data-form");
            };

            // —— 值桥（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件 ——
            // 劫持前快照 expando（x-model 编译期可能已写初值——宿主无原生 value，
            // 编译期写入落 expando）；无 x-model 时回退 props.value 初值
            const prior = this.el.value;
            if (typeof prior === "string" && prior !== "") lastValue = prior;
            else if (this.data.value != null) lastValue = String(this.data.value);
            // 快照归一值 + 初始化窗口标志：编译期初值的**重放识别**。scope.refresh 类机制
            // （如 i18n 插件 ready 的首渲染换血）会以当前 state 重跑 x-model 监听，把编译期
            // 初值（尤其空串——快照序里是「模型缺席」信号，props 兜底胜出）经劫持 setter 二次
            // 落盘，覆盖已按快照序裁定的初值归属。初始化窗口（一跳 setTimeout 前）内与快照
            // 归一值同值的写入即重放，跳过；真实状态变化（值不同）不受影响
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
                },
                configurable: true,
            });

            // —— 输入跟随（原生 input 冒泡经宿主）：len 维护（x-model 回写由宿主监听自理）——
            this.el.addEventListener("input", () => {
                const n = native();
                if (n) lastValue = n.value;
                syncLen();
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                syncAttrs();
                syncValue();
                initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩（此后全量生效）
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("type", () => { setTimeout(() => { syncAttrs(); syncValue(); }, 0); });
            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });
            this.watch("rows", () => { setTimeout(syncAttrs, 0); });
            this.watch("showPassword", () => { setTimeout(syncAttrs, 0); });
            // value props 单向同步（非受控/外部受控无 x-model 场景）：变化才写（与自身
            // 桥写不冲突——guard 防回环）。已见值比对幂等防御（checkbox 同款）：scope.refresh
            // 类无变化重跑（i18n ready 换血等）不得把 x-model expando 注入的初值打回 props
            // 缺省空串——先比对已见 props 值，同值跳过
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
            });
        },
    }
  <\/script>
  <style global id="autospark-components-input">
    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */
    .asc-input-native {
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: inherit;
    }
    .asc-input-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-input-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-input-disable-color, inherit));
    }

    /* ---------- textarea 形态（data-form 由 mounted 同步）：盒饰高度放开随行数增长，
             内层控件高度自适应 + 允许纵向拖拽调距 ---------- */
    .asc-input[data-form="textarea"] {
      height: auto;
      min-height: var(
        --auto-input-height,
        var(--asc-field-height, calc(var(--auto-font-size, 0.875rem) * 2.57))
      );
      align-items: stretch;
      cursor: text;
    }
    .asc-input[data-form="textarea"] .asc-input-native {
      height: auto;
      resize: vertical;
    }

    /* ---------- 前后置装饰：文本/图标混排，次要色 ---------- */
    .asc-input-prefix,
    .asc-input-suffix {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      flex: none;
      white-space: nowrap;
      color: var(--auto-secondary-color, var(--asc-input-affix, rgba(0, 0, 0, 0.55)));
    }
    /* 前置与控件间距、后置与动作件间距（互斥场景各留半距，组合场景自然衔接） */
    .asc-input-prefix {
      margin-right: 0.4em;
    }
    .asc-input-suffix {
      margin-left: 0.4em;
    }

    /* ---------- 动作件（清除/眼睛切换）：内部交互钮，淡色常态 + 悬停正文色 ---------- */
    .asc-input-action {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-input-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-input-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-input-action:hover {
      color: var(--auto-color, var(--asc-input-action-hover, #606060));
    }
    .asc-input-action:active {
      transform: scale(0.92);
    }

    /* ---------- 计数器：小一号辅助色；超限（data-over 由 mounted 同步）染 danger ---------- */
    .asc-input-count {
      flex: none;
      margin-left: 0.45em;
      font-size: 0.75em;
      white-space: nowrap;
      color: var(--auto-third-color, var(--asc-input-count, rgba(0, 0, 0, 0.35)));
    }
    .asc-input[data-over] .asc-input-count {
      color: var(--auto-danger-color, var(--asc-input-count-over, #ef4444));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-input-native::placeholder,
    [data-dark] .asc-input-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-input-prefix,
    [dark] .asc-input-suffix,
    [data-dark] .asc-input-prefix,
    [data-dark] .asc-input-suffix {
      color: var(--auto-secondary-color, var(--asc-input-affix, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-input-action,
    [data-dark] .asc-input-action {
      color: var(--auto-third-color, var(--asc-input-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-input-action:hover,
    [data-dark] .asc-input-action:hover {
      color: var(--auto-color, var(--asc-input-action-hover, #fafafa));
    }
    [dark] .asc-input-count,
    [data-dark] .asc-input-count {
      color: var(--auto-third-color, var(--asc-input-count, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-input[data-over] .asc-input-count,
    [data-dark] .asc-input[data-over] .asc-input-count {
      color: var(--auto-danger-color, var(--asc-input-count-over, #e6696a));
    }
  </style>
  <!-- 默认段（替换 base-field 出口 fallback）：input 的全部控件结构，文档序即呈现序
         [prefix] [控件] [清除] [眼睛] [suffix] [计数]。图标 x-icon 为指令值通道对
         props 注入响应；文本兜底 {{ }} 为插值通道（初始注入即定，prefix 后续变化走
         x-if 切换场景，文档已声明对象 props 经状态引用注入） -->
  <span class="asc-input-prefix" x-if="!!prefix">
    <i
      class="asc-input-icon"
      x-if="typeof prefix === 'object' && prefix && !!prefix.icon"
      x-icon="prefix.icon"
    ></i>
    <span class="asc-input-text" x-if="typeof prefix === 'string' && !!prefix">{{ prefix }}</span>
  </span>
  <input class="asc-input-native" data-autospark-control x-if="type !== 'textarea'" />
  <textarea
    class="asc-input-native"
    data-autospark-control
    x-if="type === 'textarea'"
    rows="2"
  ></textarea>
  <i
    class="asc-input-action asc-input-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i
    class="asc-input-action asc-input-eye"
    data-autospark-action
    x-if="showPassword && type === 'password'"
    x-icon="passwordVisible ? 'input-eye-off' : 'input-eye'"
    @click="onTogglePassword($event)"
  ></i>
  <span class="asc-input-suffix" x-if="!!suffix">
    <i
      class="asc-input-icon"
      x-if="typeof suffix === 'object' && suffix && !!suffix.icon"
      x-icon="suffix.icon"
    ></i>
    <span class="asc-input-text" x-if="typeof suffix === 'string' && !!suffix">{{ suffix }}</span>
  </span>
  <span class="asc-input-count" x-if="showCount">{{ countText }}</span>
</span>
`,ci=`autospark.input`,li=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,ui=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`,di=new Set([`disabled`,`readonly`,`clearable`,`show-password`,`show-count`]);function fi(e){let t=e.icons;t?.add?.(`input-eye`,li),t?.add?.(`input-eye-off`,ui),e.components[ci]=si,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-input, x-textarea`))){let e=document.createElement(`span`),n=[],r=t.tagName===`X-TEXTAREA`;r&&n.push(`type: "textarea"`);for(let i of Array.from(t.attributes)){if(i.name.startsWith(`:`)){n.push(`${Q(Z(i.name.slice(1)))}: (${i.value})`);continue}if(i.name===`class`||i.name===`style`||i.name===`id`||i.name===`name`||i.name===`title`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)){e.setAttribute(i.name,i.value);continue}let t=Z(i.name);t===`type`&&r?n[0]=`type: ${JSON.stringify($(i.value))}`:i.value===``&&di.has(i.name)?n.push(`${Q(t)}: true`):n.push(`${Q(t)}: ${JSON.stringify($(i.value))}`)}let i=t.textContent?.trim()??``,a=n.some(e=>e.startsWith(`value:`)),o=t.children.length>0;for(i!==``&&!a&&!o&&(n.push(`value: ${JSON.stringify(i)}`),t.textContent=``),e.setAttribute(`x-component:${ci}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}pi();function pi(){y(e=>{m(e),fi(e)})}var mi=`<!--
    autospark.checkbox 复选框（ADR-0019 合批 / ADR-0020 BaseField 消费契约）——原生增强
    路线：真实原生 \`<input type="checkbox">\` + 自绘视觉（勾形 / 半选横线经 CSS 伪元素，
    选中态由 :checked / :indeterminate 原生伪类驱动——键盘 / 焦点 / 表单提交 / 组语义等
    原生能力全保留，ADR-0018 决策 7）。

    值通道（x-model 兼容协议）：宿主 el.value 劫持为布尔语域（"true"/"false"，配
    x-model.boolean 保真——state-button 布尔组桥同款）；原生 change 冒泡过宿主时派发
    input（x-model 监听在宿主自身回写 state）。checked props 为非受控初值 / 单向同步值
    （受控真相走宿主 x-model，input value 同款边界）。

    表单提交：内层真 input 即提交载体（勾选提交 name=true、未勾选不提交——原生 checkbox
    语义，无须代理，ADR-0020 决策 6）；宿主 name 透传（x-model 缺省注入 name=路径亦经
    此通道落内层）。

    indeterminate 半选：JS 通道设原生 indeterminate 属性（无 HTML 属性形态），视觉经
    :indeterminate 伪类（真实浏览器支持）；点击半选态 → 勾选（原生行为）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-checkbox——裸态控件不加 .asc-field-box，
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；勾选/半选视觉由原生伪类 +
     :has() 驱动，宿主 data-* 状态属性由骨架 / JS 通道同步，根上无动态绑定（T4=B） -->
<span
  class="asc-checkbox"
  x-define="autospark.checkbox"
  x-define:inherit="autospark.base-field"
>
  <script setup>
    {
        data: () => ({
            label: "",            // 兜底文案（默认插槽内容优先；用户传入，无 i18n）
            checked: false,       // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 布尔语域桥）
            indeterminate: false, // 半选态（JS 通道设原生 indeterminate 属性；点击后按原生行为转为勾选/未勾）
        }),
        mounted() {
            // —— 内层原生控件查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——
            const native = () => this.el.querySelector(".asc-checkbox-input");
            // 当前勾选缓存（劫持 getter 的控件缺位兜底）
            let lastChecked = false;

            // —— 原生属性同步：提交值恒 "true"（原生 checkbox 语义：勾选提交 name=true、
            //     未勾选不提交）；宿主 name 透传（x-model 缺省注入 name=路径同经此落内层）——
            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                n.value = "true";
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
            };

            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false" ——
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）
            const prior = this.el.value;
            lastChecked = typeof prior === "string" && prior !== ""
                ? prior === "true"
                : !!this.data.checked;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const n = native();
                    return String(!!(n ? n.checked : lastChecked));
                },
                set: (v) => {
                    lastChecked = v === true || v === "true";
                    const n = native();
                    if (n) n.checked = lastChecked;
                },
                configurable: true,
            });

            // —— DOM→state 桥：原生 change 冒泡过宿主 → 派发 input（x-model 监听在宿主
            //     自身，读劫持 el.value 回写；state-button 同款非冒泡形态）。原生 change
            //     继续冒泡，外层 @change 直接消费；仅认内层控件事件（宿主自身 change 直通）
            this.el.addEventListener("change", (e) => {
                if (e.target !== native()) return;
                const n = native();
                if (n) lastChecked = n.checked;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                const n = native();
                if (n) {
                    n.checked = lastChecked;
                    n.indeterminate = !!this.data.indeterminate;
                }
                syncAttrs();
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，解构取值——家族惯用法）——
            // checked 单向同步（无 x-model 场景）：变化才写（程序赋值不触发原生事件，无回环）。
            // 已见值比对幂等防御：scope.refresh 等机制会以**当前值**重跑监听（如 i18n 插件
            // ready 的首渲染换血），无变化重跑若照常落盘，会把 x-model expando 注入的勾选
            // 初值打回 props 缺省值 false——同值跳过（真实变化才推进）
            let lastPropsChecked = !!this.data.checked;
            this.watch("checked", ({ value }) => {
                const v = !!value;
                if (v === lastPropsChecked) return;
                lastPropsChecked = v;
                lastChecked = v;
                const n = native();
                if (n && n.checked !== lastChecked) n.checked = lastChecked;
            });
            // indeterminate：JS 通道设原生属性（该属性无 HTML 属性形态，纯 property）
            this.watch("indeterminate", ({ value }) => {
                const n = native();
                if (n) n.indeterminate = !!value;
            });
        },
    }
  <\/script>
  <style global id="autospark-components-checkbox">
    /* ---------- 结构：真实 label 包裹（点击文字/盒子任一处原生切换 + 焦点转发），
         内层原生 input 透明铺满盒子（点击命中区 = 盒子，键盘焦点承载者） ---------- */
    .asc-checkbox-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.45em;
      cursor: pointer;
    }
    /* 盒子：裸态控件无 chrome，仅自有细边框（ADR-0020 决策 3）；尺寸 em 基准随主题
       data-size 档位字号缩放（不设自有尺寸属性，button 同范式 ADR-0012） */
    .asc-checkbox-box {
      position: relative;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 1.15em;
      height: 1.15em;
      border: var(--auto-border-size, var(--asc-checkbox-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-checkbox-border, #d9d9d9));
      border-radius: var(--asc-checkbox-radius, 0.25em);
      background: var(--auto-bgcolor, var(--asc-checkbox-bg, #ffffff));
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .asc-checkbox-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      border: none;
      opacity: 0;
      cursor: inherit;
    }

    /* ---------- 状态色（骨架通道）：status 在场边框染 tone（裸态控件只消费 tone 不吃 chrome）；
             勾选 / 半选底色恒 tone（缺省主色，error/success/warning 随动——开态语义色联动） ---------- */
    .asc-checkbox[data-status] .asc-checkbox-box {
      border-color: var(--asc-field-tone);
    }
    .asc-checkbox-box:has(> .asc-checkbox-input:checked),
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate) {
      background: var(--asc-field-tone);
      border-color: var(--asc-field-tone);
    }

    /* ---------- 勾形（::before 两边框旋转，勾选态 scale 展开）与半选横线（::after） ---------- */
    .asc-checkbox-box::before {
      content: "";
      width: 0.28em;
      height: 0.58em;
      border-right: 0.14em solid
        var(--asc-checkbox-check, #ffffff);
      border-bottom: 0.14em solid
        var(--asc-checkbox-check, #ffffff);
      margin-top: -0.12em;
      transform: rotate(45deg) scale(0);
      transition: transform 0.15s ease;
    }
    .asc-checkbox-box:has(> .asc-checkbox-input:checked)::before {
      transform: rotate(45deg) scale(1);
    }
    .asc-checkbox-box::after {
      content: "";
      position: absolute;
      width: 0.55em;
      height: 0;
      border-top: 0.14em solid var(--asc-checkbox-check, #ffffff);
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::after {
      opacity: 1;
    }
    /* 半选与勾选并置时半选视觉优先（原生呈现惯例：indeterminate 覆盖 checked 勾形） */
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::before {
      transform: rotate(45deg) scale(0);
    }

    /* ---------- 交互态 ---------- */
    .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)) {
      border-color: var(--auto-hover-border-color, var(--asc-checkbox-hover-border, #4098fc));
    }
    /* 键盘焦点环（data-focus 由骨架 focusin/focusout 同步——鼠标点击聚焦亦点亮，
         与盒饰类控件的焦点语义一致）；禁用不点环 */
    .asc-checkbox[data-focus]:not([data-disabled]) .asc-checkbox-box {
      border-color: var(--asc-field-tone);
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（勾选 tone 保留可辨）+ 禁点光标 */
    .asc-checkbox[data-disabled] {
      opacity: 0.55;
    }
    .asc-checkbox[data-disabled] .asc-checkbox-wrap {
      cursor: not-allowed;
    }

    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */
    .asc-checkbox-label:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-checkbox-box,
    [data-dark] .asc-checkbox-box {
      border-color: var(--auto-border-color, var(--asc-checkbox-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-checkbox-bg, #3a3a3a));
    }
    [dark] .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)),
    [data-dark] .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)) {
      border-color: var(--auto-hover-border-color, var(--asc-checkbox-hover-border, #4098fc));
    }
  </style>
  <!-- 默认段（替换 base-field 出口 fallback）：label 包裹的真实 checkbox + 自绘盒子 + 文案。
         勾形/半选视觉由原生伪类 :checked/:indeterminate 经 :has() 驱动（真实浏览器支持）。
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056 内容分段仅认直接子级）——
         消费者内容经 base-field 出口整段替换控件区（逃生通道，input 同款语义），
         故文案走 props（{{ label }} 插值兜底）不开真插槽 -->
  <label class="asc-checkbox-wrap">
    <span class="asc-checkbox-box">
      <input type="checkbox" class="asc-checkbox-input" data-autospark-control />
    </span>
    <span class="asc-checkbox-label">{{ label }}</span>
  </label>
</span>
`,hi=`autospark.checkbox`;function gi(e){e.components[hi]=mi}_i();function _i(){y(e=>{m(e),gi(e)})}var vi=`<!--
    autospark.radio 单选钮（ADR-0019 合批 / ADR-0020 BaseField 消费契约）——原生增强
    路线：真实原生 \`<input type="radio">\` + 自绘视觉（选中圆点经 CSS 伪元素，选中态由
    :checked 原生伪类驱动——键盘 / 焦点 / 表单提交 / 组互斥等原生能力全保留）。

    组语义（不建组容器组件）：**原生 name 同名互斥**——同 x-model 路径的多枚实例经引擎
    缺省 name 注入（name=路径）天然同组；或宿主显式写 name。组样式编排（纵排/横排/间距）
    用 space 组件 / flex 容器配方（组件文档给出配方示例）。受控单选组（按钮形态）由
    button-group 选中模式承接（先例）。

    值通道（x-model 兼容协议，checked 值桥）：宿主 el.value 读 = 本钮 value、写 = 按值
    匹配勾选（state === 本钮 value）——与 x-model 原生 radio 读写语义同构。勾选变化经
    原生 change 冒泡过宿主时派发 input（仅勾选态派发，取消态由被勾选的另一枚接管）。
    checked props 为非受控初值 / 单向同步值（受控真相走宿主 x-model）。

    表单提交：内层真 input 即提交载体（组内勾选项提交 name=value——原生 radio 语义，
    ADR-0020 决策 6）；宿主 name 透传（x-model 缺省注入 name=路径亦经此通道落内层）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-radio——裸态控件不加 .asc-field-box，
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；选中视觉由原生伪类 + :has()
     驱动，宿主 data-* 状态属性由骨架 / JS 通道同步，根上无动态绑定（T4=B） -->
<span
  class="asc-radio"
  x-define="autospark.radio"
  x-define:inherit="autospark.base-field"
>
  <script setup>
    {
        data: () => ({
            label: "",      // 兜底文案（默认插槽内容优先；用户传入，无 i18n）
            value: "",      // 本钮值（组内唯一标识；x-model 按值匹配勾选、勾选时写 state = 此值）
            checked: false, // 非受控初值 / 单向同步值（受控真相走宿主 x-model；组内缺省勾选项用）
        }),
        mounted() {
            // —— 内层原生控件查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——
            const native = () => this.el.querySelector(".asc-radio-input");
            // 本钮值（props.value 现读——不缓存，props 变化时劫持通道取最新）
            const radioValue = () => String(this.data.value ?? "");
            // 当前勾选缓存（劫持 getter 的控件缺位兜底）
            let lastChecked = false;

            // —— 原生属性同步：本钮 value 落内层（x-model 按值匹配的锚点）；宿主 name
            //     透传（x-model 缺省注入 name=路径同经此落内层——同名即组，原生互斥）——
            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                n.value = radioValue();
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
            };

            // —— 值桥（checked 值桥）：宿主 el.value 读 = 本钮 value（勾选时 x-model 写
            //     state 的值）、写 = 按值匹配勾选（与 x-model 原生 radio 语义同构）——
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）
            const prior = this.el.value;
            lastChecked = typeof prior === "string" && prior !== ""
                ? prior === radioValue()
                : !!this.data.checked;
            Object.defineProperty(this.el, "value", {
                get: () => radioValue(),
                set: (v) => {
                    const n = native();
                    if (n) n.checked = String(v) === radioValue();
                },
                configurable: true,
            });

            // —— DOM→state 桥：原生 change 冒泡过宿主 → **仅勾选态**派发 input（x-model
            //     监听在宿主自身，读劫持 el.value（= 本钮 value）回写；取消态不派发——
            //     被勾选的另一枚接管，x-model 原生 radio 同款语义）。原生 change 继续
            //     冒泡，外层 @change 直接消费；仅认内层控件事件（宿主自身 change 直通）
            this.el.addEventListener("change", (e) => {
                if (e.target !== native()) return;
                const n = native();
                if (!n || !n.checked) return;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                const n = native();
                if (n && n.checked !== lastChecked) n.checked = lastChecked;
                syncAttrs();
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，解构取值——家族惯用法）——
            // checked 单向同步（无 x-model 场景）：变化才写（程序赋值不触发原生事件，无回环）。
            // 已见值比对幂等防御（checkbox 同款）：scope.refresh 类无变化重跑（i18n ready
            // 换血等）不得把 x-model expando 按值匹配的勾选初值打回 props 缺省值
            let lastPropsChecked = !!this.data.checked;
            this.watch("checked", ({ value }) => {
                const v = !!value;
                if (v === lastPropsChecked) return;
                lastPropsChecked = v;
                lastChecked = v;
                const n = native();
                if (n && n.checked !== lastChecked) n.checked = lastChecked;
            });
            // value 变化：内层锚点值更新 + 重对齐勾选（x-model 值匹配语义的静态等价）
            this.watch("value", () => {
                setTimeout(() => {
                    syncAttrs();
                    const n = native();
                    if (n && n.checked) n.checked = n.value === radioValue();
                }, 0);
            });
        },
    }
  <\/script>
  <style global id="autospark-components-radio">
    /* ---------- 结构：真实 label 包裹（点击文字/圆环任一处原生切换 + 焦点转发），
         内层原生 input 透明铺满圆环（点击命中区 = 圆环，键盘焦点承载者） ---------- */
    .asc-radio-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.45em;
      cursor: pointer;
    }
    /* 圆环：裸态控件无 chrome，仅自有细边框（ADR-0020 决策 3）；尺寸 em 基准随主题
       data-size 档位字号缩放（不设自有尺寸属性，button 同范式 ADR-0012） */
    .asc-radio-box {
      position: relative;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 1.15em;
      height: 1.15em;
      border: var(--auto-border-size, var(--asc-radio-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-radio-border, #d9d9d9));
      border-radius: 50%;
      background: var(--auto-bgcolor, var(--asc-radio-bg, #ffffff));
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .asc-radio-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      border: none;
      opacity: 0;
      cursor: inherit;
    }

    /* ---------- 状态色（骨架通道）：status 在场边框染 tone（裸态控件只消费 tone 不吃 chrome）；
             选中底色恒 tone（缺省主色，error/success/warning 随动——选中态语义色联动） ---------- */
    .asc-radio[data-status] .asc-radio-box {
      border-color: var(--asc-field-tone);
    }
    .asc-radio-box:has(> .asc-radio-input:checked) {
      border-color: var(--asc-field-tone);
    }

    /* ---------- 选中圆点（::after，选中态展开） ---------- */
    .asc-radio-box::after {
      content: "";
      width: 0.55em;
      height: 0.55em;
      border-radius: 50%;
      background: var(--asc-field-tone);
      transform: scale(0);
      transition: transform 0.15s ease;
    }
    .asc-radio-box:has(> .asc-radio-input:checked)::after {
      transform: scale(1);
    }

    /* ---------- 交互态 ---------- */
    .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)) {
      border-color: var(--auto-hover-border-color, var(--asc-radio-hover-border, #4098fc));
    }
    /* 键盘焦点环（data-focus 由骨架 focusin/focusout 同步——鼠标点击聚焦亦点亮，
         与盒饰类控件的焦点语义一致）；禁用不点环 */
    .asc-radio[data-focus]:not([data-disabled]) .asc-radio-box {
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（选中 tone 保留可辨）+ 禁点光标 */
    .asc-radio[data-disabled] {
      opacity: 0.55;
    }
    .asc-radio[data-disabled] .asc-radio-wrap {
      cursor: not-allowed;
    }

    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */
    .asc-radio-label:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-radio-box,
    [data-dark] .asc-radio-box {
      border-color: var(--auto-border-color, var(--asc-radio-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-radio-bg, #3a3a3a));
    }
    [dark] .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)),
    [data-dark] .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)) {
      border-color: var(--auto-hover-border-color, var(--asc-radio-hover-border, #4098fc));
    }
  </style>
  <!-- 默认段（替换 base-field 出口 fallback）：label 包裹的真实 radio + 自绘圆环 + 文案。
         选中圆点视觉由原生伪类 :checked 经 :has() 驱动（真实浏览器支持）。
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 base-field
         出口整段替换控件区（逃生通道，input 同款语义），文案走 props 兜底不开真插槽 -->
  <label class="asc-radio-wrap">
    <span class="asc-radio-box">
      <input type="radio" class="asc-radio-input" data-autospark-control />
    </span>
    <span class="asc-radio-label">{{ label }}</span>
  </label>
</span>
`,yi=`autospark.radio`;function bi(e){e.components[yi]=vi}xi();function xi(){y(e=>{m(e),bi(e)})}var Si=`<!--
    autospark.switch 开关（ADR-0019 合批 / ADR-0020 BaseField 消费契约）——**自绘开关**
    （无原生对应控件）：轨道 + 滑块纯 CSS 自绘，可访问性自持——role="switch" +
    aria-checked + tabindex + 键盘 Space/Enter 切换（原生 checkbox 方案的对照：彼保真
    原生语义、此自持语义，ADR-0018 决策 7 表单基座策略内的例外形态）。

    值通道（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false"（配
    x-model.boolean 保真——state-button 布尔组桥同款）；切换派发 input（x-model 回写，
    监听在宿主自身非冒泡形态）+ change（detail = { value } 新布尔值，冒泡供外层消费）。
    checked props 为非受控初值 / 单向同步值（受控真相走宿主 x-model）。

    表单提交：内嵌 input[type=hidden] 载体（data-autospark-control 标记——骨架 disabled
    同步落载体，禁用即出表），value = 当前布尔字面串恒提交、name 透传宿主（state-button
    N>2 表单桥同构——value 是受控真相原样提交，true/false 值域服务端约定）。

    交互面：整组热区（轨道 + 文案都触发切换，宿主级事件委托）；loading 态滑块转 CSS
    旋转圈并阻断切换；disabled（骨架通道）阻断 + 淡化；readonly 亦阻断（值不可变语义）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-switch——裸态控件不加 .asc-field-box，
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；data-checked / data-loading
     由 mounted JS 通道同步（无 T4=B 约束），根上无动态绑定 -->
<span
  class="asc-switch"
  x-define="autospark.switch"
  x-define:inherit="autospark.base-field"
>
  <script setup>
    {
        data: () => ({
            label: "",     // 兜底文案（默认插槽内容优先；用户传入，无 i18n）
            checked: false,// 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 布尔语域桥）
            loading: false,// 加载态：滑块转 CSS 旋转圈 + 阻断切换（视觉优先于 disabled，不淡化）
        }),
        mounted() {
            // —— 内层元素查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——
            const track = () => this.el.querySelector(".asc-switch-track");
            const carrier = () => this.el.querySelector(".asc-switch-carrier");

            // —— 全视觉同步（按 data 现值求值，幂等）：aria 语义 + 宿主状态属性 + 表单载体 ——
            const syncVisual = () => {
                const on = !!this.data.checked;
                const t = track();
                if (t) {
                    t.setAttribute("aria-checked", String(on));
                    // 可访问性：loading 亦不可交互（aria-disabled 联动 disabled/loading）
                    t.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.loading)));
                    if (this.data.status === "error") t.setAttribute("aria-invalid", "true");
                    else t.removeAttribute("aria-invalid");
                }
                const c = carrier();
                if (c) {
                    // 提交载体恒随（hidden 恒提交当前布尔；禁用出表由骨架同步，此处双保险）
                    c.value = String(on);
                    c.disabled = !!this.data.disabled;
                }
                this.el.toggleAttribute("data-checked", on);
                this.el.toggleAttribute("data-loading", !!this.data.loading);
            };

            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false" ——
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）
            const prior = this.el.value;
            const initChecked = typeof prior === "string" && prior !== ""
                ? prior === "true"
                : !!this.data.checked;
            Object.defineProperty(this.el, "value", {
                get: () => String(!!this.data.checked),
                set: (v) => {
                    this.data.checked = v === true || v === "true";
                    syncVisual();
                },
                configurable: true,
            });

            // —— 切换动作：可交互判定（disabled / readonly / loading 均阻断）→ 翻转 →
            //     双派发（input→x-model 回写非冒泡；change→外层消费 detail={value}）——
            const toggle = () => {
                if (this.data.disabled || this.data.readonly || this.data.loading) return;
                this.data.checked = !this.data.checked;
                syncVisual();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.checked } }),
                );
            };

            // —— 交互接入（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：
            //     整组热区（轨道 + 文案都触发）；键盘 Space/Enter（自绘控件自持，
            //     role=switch 交互约定；Space 阻断页面滚动）——
            this.el.addEventListener("click", (e) => {
                const t = e.target instanceof Element ? e.target : null;
                if (t && t.closest(".asc-switch-wrap")) toggle();
            });
            this.el.addEventListener("keydown", (e) => {
                if (e.key !== " " && e.key !== "Enter") return;
                const t = e.target instanceof Element ? e.target : null;
                if (!t || !t.closest(".asc-switch-track")) return;
                e.preventDefault();
                toggle();
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：初值落定 +
            //     宿主 name 透传到表单载体 + 首次视觉同步 ——
            setTimeout(() => {
                this.data.checked = initChecked;
                const c = carrier();
                const nameAttr = this.el.getAttribute("name");
                if (c && nameAttr != null) c.name = nameAttr;
                syncVisual();
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("checked", () => { syncVisual(); });
            this.watch("loading", () => { syncVisual(); });
            this.watch("status", () => { setTimeout(syncVisual, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-switch">
    /* ---------- 结构：纯 span 包裹（自绘控件无原生语义可包——不用 label 防表单载体
         转发点击双触发）；轨道 = 交互件（data-autospark-action，点击不转发焦点） ---------- */
    .asc-switch-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.45em;
      cursor: pointer;
    }
    /* 轨道：尺寸 em 基准随主题 data-size 档位字号缩放（不设自有尺寸属性，button 同范式
       ADR-0012）；关态中性色（正文色派生淡灰，主题在场自动换肤） */
    .asc-switch-track {
      --asc-switch-w: 2.6em;
      --asc-switch-h: 1.4em;
      flex: none;
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      width: var(--asc-switch-w);
      height: var(--asc-switch-h);
      padding: 0.1875em;
      border-radius: 9999px;
      background: color-mix(
        in srgb,
        var(--auto-color, var(--asc-switch-off, #606060)) 28%,
        transparent
      );
      transition: background-color 0.2s ease, box-shadow 0.15s ease;
    }
    /* 滑块：白色恒定设计（暗色不换——与背景形成恒定对比）；位移 = 轨道宽 - 高（对称内距） */
    .asc-switch-thumb {
      flex: none;
      width: calc(var(--asc-switch-h) - 0.375em);
      height: calc(var(--asc-switch-h) - 0.375em);
      border-radius: 50%;
      background: var(--asc-switch-thumb, #ffffff);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      transform: translateX(0);
      transition: transform 0.2s ease;
      box-sizing: border-box;
    }

    /* ---------- 开态（data-checked 由 mounted JS 通道同步）：主色实底（status 在场随
             --asc-field-tone 联动——开态语义色，骨架通道） ---------- */
    .asc-switch[data-checked] .asc-switch-track {
      background: var(--asc-field-tone);
    }
    .asc-switch[data-checked] .asc-switch-thumb {
      transform: translateX(calc(var(--asc-switch-w) - var(--asc-switch-h)));
    }

    /* ---------- loading 态（data-loading 由 mounted 同步）：滑块转 CSS 旋转圈（阻断
             切换由 JS 判定；视觉优先于 disabled 不淡化，button loading 同款语义） ---------- */
    .asc-switch[data-loading] .asc-switch-thumb {
      background: transparent;
      box-shadow: none;
      border: 0.125em solid var(--asc-field-tone);
      border-top-color: transparent;
      animation: asc-switch-spin 0.7s linear infinite;
    }
    @keyframes asc-switch-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .asc-switch[data-loading][data-checked] .asc-switch-thumb {
      transform: none;
    }

    /* ---------- 交互态 ---------- */
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——轨道可聚焦即点亮）；禁用不点环 */
    .asc-switch[data-focus]:not([data-disabled]) .asc-switch-track {
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点光标 */
    .asc-switch[data-disabled] {
      opacity: 0.55;
    }
    .asc-switch[data-disabled] .asc-switch-wrap {
      cursor: not-allowed;
    }
    /* loading 光标进度态（不淡化） */
    .asc-switch[data-loading] .asc-switch-wrap {
      cursor: progress;
    }

    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */
    .asc-switch-label:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：关态中性色换暗色校准（正文色反转自动偏白灰，
             兜底字面值切换；开态 tone 与滑块白色为恒定设计不变） ---------- */
    [dark] .asc-switch-track,
    [data-dark] .asc-switch-track {
      background: color-mix(
        in srgb,
        var(--auto-color, var(--asc-switch-off, #fafafa)) 32%,
        transparent
      );
    }
    [dark] .asc-switch-thumb,
    [data-dark] .asc-switch-thumb {
      background: var(--asc-switch-thumb, #ffffff);
    }
  </style>
  <!-- 默认段（替换 base-field 出口 fallback）：表单载体（hidden，骨架 disabled 同步目标）+
         轨道交互件（role=switch 可聚焦）+ 文案。开态/loading 视觉由宿主 data-* 属性驱动。
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 base-field
         出口整段替换控件区（逃生通道，input 同款语义），文案走 props 兜底不开真插槽 -->
  <span class="asc-switch-wrap">
    <input type="hidden" class="asc-switch-carrier" data-autospark-control />
    <span
      class="asc-switch-track"
      role="switch"
      tabindex="0"
      aria-checked="false"
      data-autospark-action
    >
      <span class="asc-switch-thumb"></span>
    </span>
    <span class="asc-switch-label">{{ label }}</span>
  </span>
</span>
`,Ci=`autospark.switch`;function wi(e){e.components[Ci]=Si}Ti();function Ti(){y(e=>{m(e),wi(e)})}};
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
