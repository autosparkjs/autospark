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
  100% { transform: scale(1); opacity: 0; }`;return j||(j=document.createElement(`style`),j.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(j)),j.textContent+=`\n@keyframes ${r} {${a}\n}`,A.set(t,r),r}function wn(e,t,n){let r=e.offsetWidth,i=e.offsetHeight,a=r/2,o=i/2;if(n){let t=e.getBoundingClientRect();a=n.clientX-t.left,o=n.clientY-t.top}let s=Math.max(a,r-a),c=Math.max(o,i-o);return{x:a,y:o,r:Math.hypot(s,c)}}function Tn(e){return e.trigger===`click`?0:-(e.speed+e.gap)/2}function En(e){return e.trigger===`click`?Math.round(e.size*.6*10)/10:e.size}function Dn(e,t){let n={...fn};if(!e)return n;let r=$t(e,un,t,`x-ripple`);e.type!==void 0&&(un.includes(e.type)?r.add(e.type):t(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let i=ln.find(e=>r.has(e));return i&&(n.type=i),en(e,dn,`x-spin`,t,`x-ripple`),e.inside!==void 0&&(e.inside===!0?n.inside=!0:e.inside!==!1&&t(`x-ripple: inside 开关须为布尔值，已忽略`)),n.trigger=Qt(e,t,`x-ripple`),n.badge=tn(e,t,`x-ripple`),n.inside&&n.badge>0&&(t(`x-ripple: badge 与 inside 互斥，badge 优先（inside 已忽略）`),n.inside=!1),n.color=nn(e.color,{color:Gt,badgeColor:qt},n.badge,t,`x-ripple`),n.size=w(e,`size`,t,`x-ripple`)??fn.size,n.speed=Zt(e,t,`x-ripple`),n.gap=w(e,`gap`,t,`x-ripple`)??0,n.inside&&(r.size>0&&t(`x-ripple: inside 接管渲染，type 形态词表已忽略`),e.size!==void 0&&t(`x-ripple: inside 半径自动几何（起点到最远角），size 已忽略`),e.speed===void 0&&(n.speed=vn)),n}var On={hostClass:D,activeClass:O,layerClass:pn,ensureStyles:xn,normalize:Dn,hostClasses:e=>[...e.badge>0?[mn]:[],...e.inside?[hn]:[]],activeClasses:e=>e.type===`echo`&&!e.inside?[k]:[],animName:e=>Sn(e),animationCss:(e,t)=>`${t} ${e.speed+e.gap}ms ease-out infinite`,period:e=>e.speed+e.gap,layerCount:e=>e.type===`echo`?2:1,layerCssText:e=>e.badge>0?`${an(e.badge)}background:var(--x-ripple-color);`:rn(),applyLayerExtras:(e,t)=>{let n=e[1];n&&(n.style.animationDelay=`${Tn(t)}ms`,n.style.setProperty(`--x-ripple-size`,`${En(t)}px`))},applyVars:(e,t,n)=>{let r=e.style;r.setProperty(`--x-ripple-color`,t.color||`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`),r.setProperty(`--x-ripple-size`,`${t.size}px`),r.setProperty(`--x-ripple-duration`,`${t.speed+t.gap}ms`),r.setProperty(`--x-ripple-anim`,n),r.setProperty(`--x-ripple-echo-delay`,`${Tn(t)}ms`),r.setProperty(`--x-ripple-echo-size`,`${En(t)}px`),t.badge>0&&r.setProperty(`--x-ripple-badge-size`,`${t.badge}px`)},inside:{enabled:e=>e.inside,createCarrier:()=>{let e=document.createElement(`span`);e.className=gn,e.style.cssText=`position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;display:block;`;let t=document.createElement(`span`);return t.className=_n,t.style.cssText=`position:absolute;border-radius:50%;background:var(--x-ripple-color);pointer-events:none;display:block;`,e.append(t),{clip:e,circle:t}},geometry:wn,animations:e=>({circle:`${Cn(e)} ${e.speed+e.gap}ms ease-out infinite`})}};function kn(){E(cn(`ripple`,On))}kn();var An=[`chase`,`rotate`,`beam`],jn=[`rotate`,`beam`,`chase`],Mn=[`ring`,`glow`,`echo`],Nn={type:`beam`,trigger:`always`,badge:0,color:Kt,size:4,speed:3e3},M=`x-spin`,N=`x-spin-on`,Pn=`x-spin-layer`,Fn=`x-spin-badge`,P=e=>`${M}-${e}`,In=`x-spin-angle`,Ln=!1;function F(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`}}var Rn=`padding:var(--x-spin-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`;function zn(){if(Ln||typeof document>`u`)return;Ln=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spin`,``),e.textContent=`
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
}`,document.head.appendChild(e)}function nr(e,t){let n={...Xn};if(!e)return n;e.type!==void 0&&(e.type===`dot`||e.type===`count`?n.type=e.type:e.type!==!0&&e.type!==!1&&t(`x-badge: type 须为 'dot' | 'count'，已回退默认 '${Xn.type}'`));let r=e.count===!0?`count`:e.dot===!0?`dot`:null;r&&(e.type===void 0||typeof e.type==`boolean`)&&(n.type=r);let i=w(e,`overflowCount`,t,`x-badge`);if(i!==void 0){let e=Math.floor(i);e>0?n.overflowCount=e:t(`x-badge: overflowCount 须为正数，已回退默认 ${Xn.overflowCount}`)}return e.ripple!==void 0&&(typeof e.ripple==`boolean`?n.ripple=e.ripple:t(`x-badge: ripple 须为布尔值，已忽略`)),e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-badge: color 须为非空字符串，已回退默认色`)),n}var rr=class{constructor(e,t){this.alive=!0,this.mark=null,this.valueOff=null,this.reducedMotion=typeof matchMedia==`function`&&matchMedia(`(prefers-reduced-motion: reduce)`).matches,this.engine=e,this.info=t,this.value=t?.value,this.config=nr(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(tr(),this.el.classList.add(q),this.applyVars(),this.bindValue())}unmounted(){this.unmountMark(),this.el?.classList.remove(q),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.render(void 0);return}if(/^\d+$/.test(this.value.trim())){this.render(Number(this.value));return}let e=this.value,t=({value:e})=>{this.alive&&this.render(e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.render(r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.render(Ut(this.engine,e))}}render(e){let t=Number(e);if(e==null||e===``||e===!1||!Number.isFinite(t)||t<=0){this.config.type===`dot`&&this.value==null?this.mountMark():this.unmountMark();return}if(this.config.type===`dot`){this.mountMark();return}this.mountMark();let{overflowCount:n}=this.config;this.mark.textContent=t>n?`${n}+`:String(t)}mountMark(){if(this.mark)return;let{type:e,ripple:t}=this.config,n=document.createElement(`span`);n.className=`${J} ${e===`count`?Qn:Zn}`,n.setAttribute(`aria-hidden`,`true`),t&&n.classList.add(Y),e===`dot`&&t&&!this.reducedMotion&&n.insertAdjacentHTML(`afterbegin`,ir()),this.el.appendChild(n),this.mark=n}unmountMark(){this.mark?.remove(),this.mark=null}applyVars(){this.el.style.setProperty(`--x-badge-color`,this.config.color)}};function ir(){let e=e=>`<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.35"><animate attributeName="r" values="4;11" dur="2s" begin="${e}" repeatCount="indefinite" /><animate attributeName="fill-opacity" values="0.35;0" dur="2s" begin="${e}" repeatCount="indefinite" /></circle>`;return`<svg class="${$n}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`+e(`0s`)+e(`-1s`)+`</svg>`}var X=new WeakMap;function ar(){function e(){if(!this.el)return;let e=new rr(this.engine,this.info);e.el=this.el,X.set(this,e),e.mounted()}function t(){let e=X.get(this);X.delete(this),e?.unmounted()}function n(e){X.get(this)?.attrChanged(e)}return{name:`badge`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function or(){E(ar())}or();function Z(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function Q(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function $(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var sr=`<!--
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
`,cr=`autospark.button-group`,lr=[`variant`,`type`,`disabled`],ur=new Set([`vertical`,`block`]),dr=`x-component:autospark.button`,fr=`button[x-component\\:autospark\\.button]`;function pr(e,t){return RegExp(`[{,]\\s*${t}\\s*:`).test(e)}function mr(e){let t=e.match(/[{,]\s*value:\s*("(?:[^"\\]|\\.)*")/);if(!t)return null;try{let e=JSON.parse(t[1]);return typeof e==`string`?e:String(e)}catch{return null}}function hr(e){e.components[cr]=sr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button-group`))){let e=Array.from(t.querySelectorAll(`x-button, ${fr}`)).filter(e=>e.closest(`x-button-group`)===t),n=new Map;for(let e of lr)t.hasAttribute(e)&&n.set(e,t.getAttribute(e)),t.hasAttribute(`:${e}`)&&n.set(`:${e}`,t.getAttribute(`:${e}`));for(let t of e){if(t.tagName===`X-BUTTON`){let e=t.getAttribute(`value`);e!=null&&t.setAttribute(`data-value`,e);for(let[e,r]of n)t.hasAttribute(e)||t.hasAttribute(`:${e.slice(1)}`)||t.setAttribute(e,e.startsWith(`:`)?r:e===`disabled`?`true`:r);continue}let e=t.getAttribute(dr)??`{ }`,r=[];if(t.getAttribute(`data-value`)==null){let n=mr(e);n!=null&&t.setAttribute(`data-value`,n)}for(let[t,i]of n){let n=t.startsWith(`:`)?t.slice(1):t;pr(e,n)||r.push(`${n}: ${t.startsWith(`:`)?`(${i})`:JSON.stringify(t===`disabled`||$(i))}`)}if(r.length>0){let n=e.replace(/\}\s*$/,``).replace(/\s+$/,``),i=n.endsWith(`{`)?n:`${n},`;t.setAttribute(dr,`${i} ${r.join(`, `)} }`)}}let r=document.createElement(`div`),i=[];for(let e of Array.from(t.attributes)){if(e.name.startsWith(`:`)){i.push(`${Q(Z(e.name.slice(1)))}: (${e.value})`);continue}if(e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)){r.setAttribute(e.name,e.value);continue}let t=Z(e.name),n=e.value===``&&ur.has(t)?!0:$(e.value);i.push(`${Q(t)}: ${JSON.stringify(n)}`)}for(t.hasAttribute(`x-model`)&&i.push(`modelBound: true`),r.setAttribute(`x-component:${cr}`,`{ ${i.join(`, `)} }`);t.firstChild;)r.appendChild(t.firstChild);t.replaceWith(r)}})}gr();function gr(){y(e=>{m(e),hr(e)})}var _r=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /\r
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的\r
    内层元素上：宿主级外观（底色/边框/圆角等）经 body 上的 data-* 变体属性以 :has()\r
    驱动，body 自身的布局变体（对齐/纵排）直接命中 body 选择器；原生 disabled 语义\r
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - change：checkable 模式点击翻转后冒泡，detail = { value: 新值 }——\r
      表单同步惯用法：外层包裹元素 @change="flag = $event.detail.value"\r
    - tag-click：tags 小圆钮点击冒泡，detail = { name, label, value, tag }（tag 元素上\r
      stopPropagation 阻断冒泡）。N(>2) 态循环切换需求由 autospark.state-button 承接\r
    （ADR-0016：二元勾选 2026-11-13 回归本组件，多态循环归 state-button）\r
-->\r
<!-- 元素名快速写法 <x-button variant="primary" label="..."> 由 index.ts 的 precompile\r
     DOM 变换承载（ADR-0117 元名形态对全局表惰性组件有时序缺口，见 index.ts 注释） -->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，\r
     名即通道）——宿主化身根物化为同名 data-* 属性，接通 @autospark/theme 手动通道 CSS\r
     形成局部主题；base 缺省不写属性（继承祖先档位），theme 不在场静默无效。\r
     button 不得在 data() 重复声明这六键（子胜会静默击穿主题通道），裸名 size/dark 等留作\r
     组件自有语义；组件内部变体属性亦禁用这六个通道名（theme 在场时会被档位块意外命中） -->\r
<button\r
  class="asc-button"\r
  x-define="autospark.button"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            variant: "default",     // 形态：default 常规描边 | primary 实底 | secondary 次底 | dashed 虚线 | text 文本 | link 链接\r
            type: "primary",        // 语义色：primary | success | warning | danger | info（default 形态不消费）\r
            label: "按钮",          // 兜底文案（插槽无内容时显示；labelPos none 时隐藏并自动转入悬停提示）\r
            labelPos: "right",       // label 在 icon 的哪侧：right 左图标右文字（默认）| left 右图标左文字（与 tags 互换，caret 恒在其后）| top 文字上 | bottom 文字下 | none 不显示文字（label 转悬停提示）\r
            icon: "",               // 图标名（string）或图标选项对象 { name, ...x-icon-options }：视觉键 size / color / strokeWidth / padding / shape / button / pointer / rotate 经 x-icon-options 成员表达式逐键透传（等价 x-icon 原生能力）+ 自有键 badge（伪元素红点，标量三形态控板距；loading 时被替换）与 scale（图标放大倍率，ADR-0138 修订：图标放大场景（纵排 top/bottom 或 memo 在场）参与、其余静默忽略；缺省 1.5 由 CSS 内建承载（memo 场景同值复用）；与 size 叠加（size × scale 经内联乘积）、显式即接管压过内建 1.5；非法值（0/负/NaN）静默剪枝；字符串 icon 形态无此通道仅吃内建）\r
            loading: false,         // 加载态：左图标位转圈并禁点（优先于 disabled 视觉）\r
            ghost: false,           // 幽灵：背景透明、内容取语义色（常用在有色背景上）\r
            border: false,          // 装饰性附加边框（不干预 dashed / ghost 的固有边框形态）\r
            block: false,           // 适配父宽度\r
            disabled: false,\r
            ripple: true,           // 点击涟漪（默认开启；页面需已加载 autospark.ripple.js，未加载时静默跳过；ADR-0010）\r
            autoInsertSpace: true,  // label 恰为两个汉字时自动插入空格\r
            shape: "default",       // default | circle（纯图标呈正圆，带文字自动呈胶囊）\r
            wrap: false,            // label 换行：false 单行溢出省略号（截断时自动挂 title，宿主显式 title 优先）；true 折行（按钮高度随行数增长）\r
            align: "center",        // 内容水平对齐：left | center | right\r
            indent: 0,              // 内容额外左缩进（数字 px 或任意 CSS 值如 "2em"）；菜单层级缩进常用\r
            memo: "",               // label 下方的备注（小一号、淡色）\r
            tags: [],               // 右侧小圆钮 {icon?, label?, tooltip?, styles?(cssText), classes?, value?, checkable?, checkValues?, shape?}[]——label 呈胶囊（图标与文字恒 1rem）；value 原样透传进 tag-click detail（checkable 时兼勾选载体：=== 真值即 checked，点击翻转）；checkValues 缺省 [true,false] 真值在前；shape 默认 none 无背景，circle/radius 呈底板\r
            caret: "none",          // 尾部方向箭头：none | left | top | right | bottom——内容区最右端渲染 x-icon arrow，按方向旋转（切换经 x-icon rotate 选项连续旋转）\r
            menu: false,            // 菜单项形态：占满宽、透明底、左对齐、hover 淡底\r
            checkable: false,       // 可复选（2026-11-13 回归，ADR-0016 修订记）：true 时化身 checkbox 表单字段——内嵌真 input[type=checkbox]、x-model 可绑宿主、点击翻转 value 并冒泡 change；false（缺省）为普通按钮非表单字段\r
            value: false,           // 勾选值（checkable 模式；=== checkValues[0] 即选中态）\r
            checkValues: [true, false], // 勾选二元组 [checked 值, unchecked 值]（任意类型，严格相等判定；对象须路径引用）\r
            checkStyle: "corner",   // 选中渲染：solid 实底 | check 最左打勾占位 | corner 右上角打勾三角 | ripple 最左涟漪动画占位（四值语义同 state-button 的 decorate 项键）\r
            // computed 简写（普通函数值即计算属性，仅限单表达式）：autoInsertSpace 开启且\r
            // label 恰为两个汉字时中间插入空格\r
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label\r
        }),\r
        methods: {\r
            // tag 勾选值域：checkValues 逐项回退 [true, false]（真值在前）；\r
            // ?? 只对 null/undefined 回退——checkValues: [0, 1] 的假值真值 0 不受影响，\r
            // 残缺（如仅 [x]）时缺的项单独回退。模板 :data-checked 为内联表达式同款判定：\r
            // 属性绑定求值域不含组件 methods（宽松求值 undefined → 静默移除），方法仅供事件通道\r
            tagCheckValues(tag) {\r
                return [tag.checkValues?.[0] ?? true, tag.checkValues?.[1] ?? false];\r
            },\r
            // tag 小圆钮点击：阻断冒泡，冒泡 tag-click——detail 平铺\r
            // name（标识）/ label（文字）/ value（使用者数据，原样透传不做处理）+ tag 整对象。\r
            // checkable：点击翻转 value（真值 ↔ 假值）——tag 为 tags 数组项的响应式代理，\r
            // 赋值穿透到外部状态（tags 为引用注入），data-checked 绑定随之重算；tag-click\r
            // 的 detail.value 即切换后新值\r
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
            // 原生 disabled 同步（loading 即禁点）；后续 props 变化经 watch 保持同步\r
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法见 overlay/foldable.ts）\r
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };\r
            syncDisabled();\r
            this.watch("disabled", ({ value }) => { syncDisabled(); });\r
            this.watch("loading", ({ value }) => { syncDisabled(); });\r
\r
            // icon 角标（按钮自有键 badge）：视觉样式已由模板上的 x-icon-options 成员表达式透传\r
            // （size/color/strokeWidth/padding/shape/button/pointer/rotate），此处只维护角标类与\r
            // 角标专属板距——不触碰 x-icon 写入的其它内联样式；watch 回调一跳后写（x-if 渲染与\r
            // 回调的 flush 时序不保证先后）\r
            const syncIconBadge = () => {\r
                const i = this.data.icon;\r
                const span = this.el.querySelector(".asc-button-icon");\r
                if (!span) return;\r
                const hadPad = span.classList.contains("asc-button-icon-badge-pad");\r
                span.classList.remove("asc-button-icon-badge", "asc-button-icon-badge-pad");\r
                // 回收本通道写过的角标板距；icon 自带 padding 选项时保留（x-icon 已写入，勿覆盖）\r
                if (hadPad && (typeof i !== "object" || !i || i.padding == null || i.padding === "")) {\r
                    span.style.removeProperty("padding");\r
                }\r
                if (typeof i !== "object" || !i) return;\r
                // badge（标量三形态）：true（缺省板距由角标类 CSS 承载）/ number 板距 px / string CSS 值\r
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
            setTimeout(syncIconBadge, 0); // mounted 时化身子树可能尚未挂载（span 不可查），一跳后再同步\r
            this.watch("icon", () => { setTimeout(syncIconBadge, 0); });\r
\r
            // label 溢出自动挂提示（ADR-0012 补记，双轨修订）：纯静态检测——mounted 一跳首查 +\r
            // label / wrap 变化时重查，不引入 ResizeObserver（按钮为高频组件，零观察资源；容器宽度\r
            // 单独变化后提示可能过期为已知温和妥协，CSS 截断本身自适应不受影响）。\r
            // 挂载属性双轨（与 x-bind title 重定向同判定口径）：tooltip 特性在场（engine.tooltip?.enabled，\r
            // autospark.tooltip.js 已加载）→ 挂 data-tooltip（插件接管、样式统一）；缺席 → 挂原生 title\r
            // （浏览器黄框兜底）。挂/摘规则：仅截断态挂（scrollWidth > clientWidth）、宿主显式\r
            // title/data-tooltip 永不覆盖、溢出消失只摘自挂的（闭包标记）\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
            const syncTip = () => {\r
                // labelPos none：label 不渲染（main 整体隐藏）——宿主无显式提示时 label 文本转挂（双轨同 attr）\r
                if (this.data.labelPos === "none") {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖\r
                    this.el.setAttribute(tipAttr, String(this.data.label ?? ""));\r
                    selfTip = true;\r
                    return;\r
                }\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (!span) return;\r
                if (span.scrollWidth > span.clientWidth) {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖\r
                    this.el.setAttribute(tipAttr, span.textContent); // label 变文本后仍溢出 → 同步换新文本\r
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
            // checkable 桥（化身 checkbox，2026-11-13 回归——ADR-0016 修订记：decorate 四值\r
            // 渲染下沉为组件级 checkStyle）：内嵌真 input[type=checkbox]（display:none 载体、\r
            // name 透传宿主、提交值 = String(checkValues[0])、未勾选不提交）——button 成为标准\r
            // checkbox 表单字段；checkable=false（缺省）不嵌 input、非表单字段。宿主上 x-model\r
            // 走 text 分型经组件桥转布尔语域（el.value 只取 "true"/"false"，配 .boolean 类型\r
            // 保真）；checkValues 任意值服务 props value 通道与表单提交值。勾选视觉 JS class\r
            // 驱动（.asc-checked / .asc-check-<style>）——Chromium :active 粘滞期间 :has(属性\r
            // 变化) 不重算（点击描边延迟到下次交互才现的根因），class 变化是强失效信号\r
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
                // ripple 形态（2026-11-13 二调）：勾选视觉 = **宿主整体恒开 echo 双环涟漪**\r
                // （x-ripple 承载、外扩形态非 inside）——经 data.ripple 单通道写入（父\r
                // syncRipple 的 watch 消费挂载，与 ripple prop 同一决策点、无双写竞争）：\r
                // 勾选置 { trigger: "always", inside: false, type: "echo" }，取消回退用户\r
                // ripple 原值；需页面已加载 autospark.ripple.js，未加载时属性无人消费静默\r
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
                // 重对齐：底层 value（x-model 已写，布尔语域）优先、否则按 data.value 对 checkValues 的归属\r
                const resync = () => {\r
                    real.value = String(vals()[0]);\r
                    const raw = proto.get.call(this.el);\r
                    if (raw === "true") applyChecked(true);\r
                    else if (raw === "false") applyChecked(false);\r
                    else if (this.data.value === vals()[0]) applyChecked(true);\r
                    else if (this.data.value === vals()[1]) applyChecked(false);\r
                };\r
                setTimeout(resync, 0); // mounted 时化身子树与 props 均可能未就位，一跳后首对齐\r
                this.watch("checkValues", () => { setTimeout(resync, 0); });\r
                this.watch("checkStyle", ({ value: s }) => { // 渲染样式热切换：摘旧类挂新类\r
                    for (const k of ["solid", "check", "corner", "ripple"]) this.el.classList.remove("asc-check-" + k);\r
                    this.el.classList.add("asc-check-" + s);\r
                });\r
                this.watch("value", ({ value: v }) => { // props value 受控通道（无 x-model 时）\r
                    if (v === vals()[0] || v === vals()[1]) resync();\r
                });\r
                // 点击翻转：按 checkValues 二元组切换，桥值写布尔语域后派发 input（x-model 回写）\r
                // 与 change（detail 携带 checkValues 语域值）\r
                this.el.addEventListener("click", () => {\r
                    if (!this.data.checkable || this.el.disabled) return;\r
                    const [onVal, offVal] = vals();\r
                    const next = this.data.value === onVal ? offVal : onVal;\r
                    this.el.value = String(next === onVal); // 劫持 setter 同步视觉与内嵌 input\r
                    this.el.dispatchEvent(new Event("input", { bubbles: false })); // x-model 监听在宿主自身\r
                    this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));\r
                });\r
            }\r
\r
            // 涟漪动态挂载（ADR-0010 运行时契约：不经编译、直接写属性即生效）；\r
            // 配置走 x-ripple-options 通道（裸 x-ripple 的值只参与三态判定、不承载配置）；\r
            // ripple 即该配置的 props 值：false 不启用；启用时缺省 { trigger: "click", inside: true }\r
            // （点击播一个周期自止、约束按钮内部），对象形态全键可覆盖缺省；\r
            // options 运行时改值无效（ADR-0010 决策 7）——变化时先摘 x-ripple 触发重挂再重读；\r
            // 需页面已加载 autospark.ripple.js，未加载时属性无人消费、静默无害\r
            // **跨拍摘挂**（ADR-0010 决策 7）：decorate 家族 attrChanged 只重绑值订阅、\r
            // options 静态求值一次——同批摘挂 x-ripple 经 observer 批合并后不触发重挂，\r
            // 新 options 永不被读（checkStyle=ripple 勾选换 always/echo 配置失效的根因）。\r
            // 摘（同步）→ observer 微任务 unmount → 下一拍挂（setTimeout 宏任务）→\r
            // mount 重读 options；连续变化 clearTimeout 合并、只挂末次\r
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
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-button">\r
    .asc-button {\r
      --asc-tone: var(\r
        --auto-primary-color,\r
        var(--asc-button-primary, #009aff)\r
      ); /* 语义色中转（data-type 注入） */\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      --asc-line: transparent;\r
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */\r
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
    /* secondary：次级底 + 正文色（描边交给 border 开关） */\r
    .asc-button:has(> .asc-button-body[data-variant="secondary"]) {\r
      --asc-bg: var(\r
        --auto-secondary-bgcolor,\r
        var(--asc-button-bg, rgba(245, 245, 245, 0.45))\r
      );\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
    }\r
    /* dashed：透明底 + 语义色虚线边 + 语义色字 */\r
    .asc-button:has(> .asc-button-body[data-variant="dashed"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
      border-style: dashed;\r
    }\r
    /* text：透明底 + 正文色 */\r
    .asc-button:has(> .asc-button-body[data-variant="text"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);\r
    }\r
    /* link：透明底 + 语义色字、无内距（inline 链接感） */\r
    .asc-button:has(> .asc-button-body[data-variant="link"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      padding: 0;\r
    }\r
\r
    /* ---------- 幽灵（ghost）：透明底 + 语义色内容/描边，可与任意形态组合 ---------- */\r
    .asc-button:has(> .asc-button-body[data-ghost="true"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
    }\r
\r
    /* ---------- 菜单项形态（menu）：占满宽、透明底、左对齐、hover 淡底 ---------- */\r
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
    /* solid：勾选 = tone 实底 + 反白字（覆盖 variant 表达，!important 压过 :has 变体规则族） */\r
    .asc-button.asc-checked.asc-check-solid {\r
      --asc-bg: var(--asc-tone) !important;\r
      --asc-ink: #fff !important;\r
      --asc-line: transparent !important;\r
    }\r
    /* check：最左 1.2em 常驻占位（未勾选留空、零布局跳动），勾选显 tone 色 ✓；背景维持原 variant */\r
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
    .asc-button.asc-checked.asc-check-check > .asc-button-body::before {\r
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
    /* 反白小勾：定位于三角重心（系数基准同 --asc-corner），-2px 补偿三角盒越出量 */\r
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
    /* ---------- 形状（shape）：circle 恒胶囊半径——纯图标时内容等宽高自然呈正圆，带文字自动胶囊 ---------- */\r
    .asc-button:has(> .asc-button-body[data-shape="circle"]) {\r
      border-radius: 9999px;\r
      padding: calc(var(--asc-pad) * 0.55);\r
    }\r
\r
    /* ---------- 适配父宽度 ---------- */\r
    .asc-button:has(> .asc-button-body[data-block="true"]) {\r
      display: flex;\r
      width: 100%;\r
    }\r
\r
    /* ---------- 交互态 ---------- */\r
    .asc-button:hover:not([disabled]) {\r
      filter: brightness(0.96);\r
    }\r
    .asc-button:active:not([disabled]) {\r
      filter: brightness(0.9);\r
    }\r
    /* text / link / ghost / menu 淡形态：亮度反馈无感，改用悬停淡底 */\r
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
    /* loading 即禁点但视觉不淡化（优先于 disabled，Q9） */\r
    .asc-button:has(> .asc-button-body[data-loading="true"]) {\r
      opacity: 1;\r
      cursor: progress;\r
    }\r
\r
    /* ---------- body 布局（body 是编译子树内层，绑定可求值，直接命中选择器） ---------- */\r
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
    } /* 菜单项恒左对齐 */\r
    .asc-button-body[data-menu="true"] .asc-button-main {\r
      align-items: flex-start;\r
    } /* label/memo 文本亦居左（与 memo 折行/短 label 对齐左缘） */\r
    .asc-button-body[data-label-pos="top"],\r
    .asc-button-body[data-label-pos="bottom"] {\r
      flex-direction: column;\r
      gap: 0.15em;\r
    } /* label 纵排（top = 文字上/图标下；bottom = 图标上/文字下） */\r
    /* labelPos top：文字在图标上方（main 排 icon 前） */\r
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
    /* 图标位：尺寸随字号（x-icon 默认 1em），loading 转圈自带 SMIL 动画 */\r
    .asc-button-icon {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
    }\r
    /* labelPos left：图标（含 loading 位）移内容区末尾并与 tags 互换（icon 恒最末）；\r
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
    /* 主文本组：label 与 memo 恒纵排（memo 在 label 下方） */\r
    .asc-button-main {\r
      display: flex;\r
      flex-direction: column;\r
      align-items: center;\r
      min-width: 0;\r
    }\r
    /* label 单行截断（wrap 默认 false，ADR-0012 补记）：溢出显示省略号——截断只在按钮\r
         宽度受约束时发生（block / menu / 容器挤压；inline-flex 收缩到内容宽永不触发）；\r
         max-width 钳制是关键——nowrap 下 min-content 涨至全文宽，column flex 的\r
         align-items 非 stretch 使 label 取 fit-content，无钳制会被 min-content 抬出\r
         可用宽（截断失效）；截断发生时由 mounted 静态检测自动挂 title；wrap=true 回\r
         折行（按钮高度随行数增长，显式声明才换行，防布局被意外撑开） */\r
    .asc-button-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
    }\r
    .asc-button-body[data-wrap="true"] .asc-button-label {\r
      white-space: normal;\r
    }\r
    /* 空内容不占位：纯图标用法（label 空）时出口与主文本组整体隐藏，消除 gap/行高占位；\r
         插槽有内容时出口非空不命中，不受影响 */\r
    .asc-button-label:empty {\r
      display: none;\r
    }\r
    .asc-button-main:has(> .asc-button-label:empty):not(\r
        :has(> .asc-button-memo)\r
      ) {\r
      display: none;\r
    }\r
    .asc-button-body[data-align="left"] .asc-button-main {\r
      align-items: flex-start;\r
    }\r
    .asc-button-body[data-align="right"] .asc-button-main {\r
      align-items: flex-end;\r
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
    /* tags 小圆钮：恒贴内容区右端（margin-left:auto 吸收剩余空间；按钮收缩到内容宽时\r
         退化为紧跟主文本，最小间距由 body 的 gap 保证），独立 hover 反馈 */\r
    .asc-button-tags {\r
      display: inline-flex;\r
      gap: 0.15em;\r
      margin-left: auto;\r
    }\r
    /* 尾部方向箭头（caret）：恒居内容区最右（order 6 高于 labelPos=left 的图标 5）；\r
         无 tags 时自身吸收剩余空间贴右，有 tags 时由 tags 的 auto margin 统一推至右端\r
         （两个 auto margin 会分摊剩余空间，使 tags 落点内缩）。方向经 x-icon 的 rotate\r
         选项旋转同一枚 arrow 图标（svg 载体自带 transition，切换即连续旋转） */\r
    .asc-button-caret {\r
      display: inline-flex;\r
      order: 6;\r
      margin-left: auto;\r
    }\r
    .asc-button-body:has(> .asc-button-tags) > .asc-button-caret {\r
      margin-left: 0;\r
    }\r
    /* x-for 克隆载体盒消失，圆钮直接成为容器 flex 项 */\r
    .asc-button-tag-item {\r
      display: contents;\r
    }\r
    .asc-button-tag {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.25em;\r
      height: 1.8rem;\r
      width: 1.8rem; /* 无 label 恒正圆（等宽高）；带 label 被胶囊规则放开 */\r
      padding: 0;\r
      font-size: 1rem; /* 图标与 label 恒 1rem——不随 data-size 档位（视觉稳定优先） */\r
      border-radius: 50%;\r
      color: var(--asc-ink);\r
      cursor: pointer;\r
      /* 常态即与按钮主背景形成色差：按内容色派生淡底（实底上呈淡白、透明底上呈淡灰/淡语义色） */\r
      background: transparent; /* 常态无背景（shape 默认 none）；shape 板色见后续规则 */\r
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
    /* 带 label 的 tag 呈胶囊：放开定宽随内容、横向 padding 撑开；label 恒 1rem 继承 */\r
    .asc-button-tag:has(> .asc-button-tag-label) {\r
      width: auto;\r
      padding: 0 0.6rem;\r
      border-radius: 9999px;\r
    }\r
    .asc-button-tag-label {\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
    /* 按压反馈：底色加深 + 轻微缩放（松手经 transition 弹回） */\r
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
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 变体数据属性全部承载在 body（编译子树内层元素，经 :has() 驱动宿主外观——见文件头注释）；\r
         indent（原始值）经 :style 加性内联（body 无 padding，不影响宿主内距） -->\r
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
    :style="indent ? { paddingLeft: (typeof indent === 'number' ? indent + 'px' : indent) } : undefined"\r
  >\r
    <!-- loading 图标替换左图标位（字面量须带引号——裸 loading 会命中 data.loading 布尔值） -->\r
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>\r
    <!-- icon 双形态：字符串 = 图标名；对象 = { name, ...x-icon-options }——name 经 x-icon 值消费，\r
         其余视觉选项经 **成员表达式** 逐键透传（x-icon-options="icon" 整包按 relaxed-JSON 解析，\r
         无法消费状态路径）；badge 为按钮自有键，由 mounted 的 syncIconBadge 维护；scale 为\r
         按钮自有倍率键（ADR-0138，修订后），乘入 size 通道——图标放大场景（纵排 top/bottom\r
         或 memo 在场）参与：size 有值 → 乘积（number×scale 出 px / 字符串 size 包\r
         calc()），size 缺省 → 仅 scale 显式合法时输出 calc 接管（否则 undefined 交 CSS 内建\r
         1.5×）；非放大场景原样透传 icon.size（scale 静默忽略）。显式乘积为内联宽高、恒压\r
         CSS 放大规则（显式即接管）；loading 位独立分支无此通道、只吃 CSS 内建；表达式须\r
         内联（绑定通道天然响应式，且求值域不含组件 methods） -->\r
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
    <span class="asc-button-main" x-show="labelPos !== 'none'">\r
      <!-- 默认插槽出口：未提供内容时显示 {{ displayLabel }}（组件自身状态求值） -->\r
      <span class="asc-button-label" x-slot>{{ displayLabel }}</span>\r
      <span class="asc-button-memo" x-if="memo">{{ memo }}</span>\r
    </span>\r
    <span class="asc-button-tags" x-if="tags && tags.length">\r
      <!-- x-for 宿主自身的绑定不被编译（ownsChildren 接管子树编译），故宿主为纯克隆载体，\r
             tag 圆钮与绑定（title/点击）在内层元素上，x-for locals（tag）在内层可见。\r
             data-checked 为内联表达式（非方法调用）——属性绑定求值域不含组件 methods，\r
             方法形态会宽松求值 undefined 而静默移除；checkValues 逐项 ?? 回退（假值真值如 0 不受影响） -->\r
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
</button>\r
`,vr=`autospark.button`;function yr(e){e.components[vr]=_r,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button`))){let e=document.createElement(`button`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${vr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}br();function br(){y(e=>{m(e),yr(e)})}var xr=`<!--\r
    继承骨架 + 机制自治（ADR-0016）：x-define:inherit 复用 autospark.button 的纯按钮\r
    视觉全套（快照克隆，模板/CSS 骨架单份），状态机制全套自持于本组件的 setup 与\r
    styles——button 已取消 checkable 特性，本组件是其承接者（迁移动作见 ADR-0016）。\r
\r
    x-button-options（2026-11-11 泛化，即 <x-button> 的选项集）= **button props 全集**（variant/type/ghost/border/shape/\r
    loading/icon/label/memo/ripple/wrap/... 切态整组注入 data——每态可完全自定义按钮的\r
    渲染与形态）+ 状态机制键（value 状态值 / clickable 出边锁 / decorate 额外装饰 /\r
    tooltip 双轨提示 / style cssText / class 附加类——机制键不走 props 注入通道）。\r
\r
    事件与数据出口：\r
    - change：切换实际发生后冒泡，detail = { value, index, state }（新态三元组）\r
    - 原生 click：恒触发（不派发自定义 click——与原生同名双触发不可接受）；state 数据\r
      经宿主常驻 data-value dataset 反射读取（外层 @click="v = $event.currentTarget.dataset.value"）\r
    - 表单桥：布尔二元组（缺省组即此）内嵌 input[type=checkbox]（el.value 布尔语域，\r
      配 x-model.boolean 保真，未勾选不提交）；其余形态内嵌 input[type=hidden]\r
      （value = String(当前值)、name 透传宿主）；N>2 受控通道 = @change（x-model 对\r
      非布尔组字符串化固有，自担）\r
\r
    装饰渲染（states 项键 decorate，取代 button 旧组件级 checkStyle）：\r
    - solid = tone 实底反白 / icon = 最左 yes 占位 / corner = 右上角越界打勾三角 /\r
      ripple = 最左 CSS 自绘涟漪动画占位（mounted 注入的 DOM 无编译通道，x-icon 不可用，\r
      视觉对齐内置 ripple 图标动效语言）——宿主 class 通道：asc-d-<x> 当前态佩戴、\r
      asc-p-check / asc-p-ripple 组内任一佩戴即常驻占位（防布局跳动）\r
    - 灰色无匹配态（asc-unmatched）：value 不在 states 值域——中性灰覆盖 variant/type、\r
      pointer + hover 可点击（与 disabled 的 opacity+not-allowed 明确分野）\r
-->\r
<!-- 子模板不含覆盖段（裸子节点会被收为默认段替换父 label 出口 fallback）——仅资源节点 -->\r
<button\r
  class="asc-state-button"\r
  x-define="autospark.state-button"\r
  x-define:inherit="autospark.button"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            states: undefined,   // 状态集：x-button-options[] | (number|string)[]——x-button-options = button props 全集（variant/type/ghost/shape/loading/icon/label/ripple... 切态整组注入，每态完全自定义按钮渲染与形态）+ 机制键（value/clickable/decorate/tooltip/style/class）；标量即 {value} 简写、对象缺 value 回退下标；undefined 落缺省组\r
            value: undefined,    // 当前状态值（受控真相，组件不擅改——仅点击翻转/缺省初始化写入）；undefined 缺省初始化为 states[0].value（初始态即首态）\r
            autoswitch: true,    // true：点击自动切下一态（change + 原生 click）；false：纯受控（仅原生 click，切换由外部回写 value）\r
        }),\r
        mounted() {\r
            // —— 归一化（幂等纯函数，不写回 data——写回会触发 watch 自环）——\r
            // undefined/null 落缺省组 [{value:false},{value:true,decorate:'corner'}]（零配置即\r
            // 传统双态 check 按钮）；非数组/空数组 → []（无效状态集，恒无匹配灰、不可切态，静默退化）\r
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
            // 布尔二元组判定（缺省组即此）：checkbox 布尔语域桥的前提（el.value 只取 "true"/"false"，\r
            // 配 x-model.boolean 类型保真——对齐原生 checkbox 语义）；非布尔组不劫持 el.value\r
            const boolPair = (() => {\r
                const l = norm();\r
                return l.length === 2 && l.some((s) => s.value === true) && l.some((s) => s.value === false);\r
            })();\r
            // 值序列化（dataset 反射 / hidden input 共用）：对象 JSON 化、其余 String\r
            const serialize = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));\r
\r
            // button props 键面（态注入的键清单）：**显式清单驱动**——this.data 是挂链数据视图，\r
            // Object.keys 枚举出的是根 state 键（含 $scopes/$ 框架保留键），不能用于枚举组件\r
            // props 面（读穿透组件域可用、枚举不可用）；清单与 button 的 data() 键面一一对应\r
            // （theme 六键不在 data 域、不参与态注入——档位不随态切换）\r
            const BUTTON_PROPS = [\r
                "variant", "type", "label", "labelPos", "icon", "loading", "ghost", "border",\r
                "block", "disabled", "ripple", "autoInsertSpace", "shape", "wrap", "align",\r
                "indent", "memo", "tags", "menu",\r
            ];\r
\r
            // 底值快照（态注入的回退基准）：一跳后 states/value 注入落定，遍历 data 快照\r
            // **全部 button props 键**（排除状态机制 props 与 computed 函数值——displayLabel\r
            // 等不可被态覆盖）+ 宿主原样式；init 前为 null（syncVisual 注入段守卫跳过）\r
            let base = null;\r
            // label 覆盖直写通道：{{ displayLabel }} 是父的 computed（组件域 computed 对后续\r
            // data.label 赋值不重算——仅初始化首求值生效，ADR-0016 实施注记），故态 label\r
            // 变化直写 span 文本；**fallback 特征探测**——初始文本与底值 label 的派生一致\r
            // （含两字插空格）才视为 fallback 在场，插槽内容在场时跳过直写（插槽优先）\r
            let labelSpan = null;\r
            let labelIsFallback = false;\r
            const deriveLabel = (t) =>\r
                this.data.autoInsertSpace && /^[一-龥]{2}$/.test(t ?? "") ? t[0] + " " + t[1] : String(t ?? "");\r
            // 态 class 上次写入（切态摘旧加新，不碰使用者宿主 class）\r
            let prevCls = [];\r
            // 态 tooltip 自挂标记（仅摘自挂的，宿主显式提示永不覆盖）\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
\r
            // —— 表单载体：内嵌隐藏 input（display:none、name 透传宿主）——\r
            const real = document.createElement("input");\r
            real.type = boolPair ? "checkbox" : "hidden";\r
            real.style.display = "none";\r
            const nameAttr = this.el.getAttribute("name");\r
            if (nameAttr != null) real.name = nameAttr;\r
            this.el.appendChild(real);\r
\r
            // —— 全视觉同步（按 data.value 现值求当前态，幂等）——\r
            const syncVisual = () => {\r
                const list = norm();\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                const st = cur ?? {};\r
                // 1. 装饰 class：当前态佩戴 → asc-d-<x>；组内任一佩戴 check/ripple → 常驻占位标记\r
                for (const k of ["asc-d-solid", "asc-d-check", "asc-d-corner", "asc-d-ripple", "asc-p-check", "asc-p-ripple", "asc-unmatched"]) {\r
                    this.el.classList.remove(k);\r
                }\r
                if (typeof st.decorate === "string" && st.decorate) this.el.classList.add("asc-d-" + st.decorate);\r
                if (list.some((s) => s.decorate === "check")) this.el.classList.add("asc-p-check");\r
                if (list.some((s) => s.decorate === "ripple")) this.el.classList.add("asc-p-ripple");\r
                // 1.5 ripple 装饰（2026-11-13 二调）：佩戴视觉 = **宿主整体恒开 echo 双环涟漪**\r
                //     （外扩形态非 inside、无占位指示器）——经 data.ripple 单通道写入（父\r
                //     syncRipple 的 watch 消费挂载，与 ripple prop 注入同一决策点、无双写竞争）：\r
                //     佩戴置 { trigger: "always", inside: false, type: "echo" }（装饰优先于\r
                //     态声明的 ripple 键），未佩戴回退注入循环写入的原值；需页面已加载\r
                //     autospark.ripple.js，未加载时属性无人消费静默\r
                // 2. 灰色无匹配态（无效状态集亦恒无匹配）\r
                this.el.classList.toggle("asc-unmatched", cur === null);\r
                // 3. dataset 反射（外层 @click 读取当前值的通道——原生 click 无 detail）\r
                this.el.setAttribute("data-value", serialize(this.data.value));\r
                // 4. 表单载体同步：布尔组 checkbox 按真值勾选（提交值 = String(true 态 value)）；\r
                //    其余 hidden 恒随提交（value 是受控真相，域外值原样提交）\r
                if (boolPair) {\r
                    real.checked = cur !== null && cur.value === true;\r
                    real.value = String(list.find((s) => s.value === true)?.value ?? true);\r
                } else {\r
                    real.value = serialize(this.data.value);\r
                }\r
                // 5. 态注入（button props 透传，仅当前态生效）：当前态在场的 button props 键\r
                //    （BUTTON_PROPS 清单内）写入 data（触发父模板既有绑定 :data-variant/:data-type/\r
                //    x-icon… 与父 mounted 的 watch（disabled/loading/icon/ripple/label）重算），\r
                //    未声明键回退底值——每态可完全自定义按钮渲染与形态；机制键（clickable/\r
                //    decorate/tooltip/style/class）不在清单天然不注入；label 另走直写通道\r
                //    （displayLabel computed 对后续赋值不重算，见上方注释）\r
                if (base) {\r
                    let rippleInjected;\r
                    for (const k of BUTTON_PROPS) {\r
                        if (k === "ripple") {\r
                            rippleInjected = Object.hasOwn(st, k) ? st[k] : base[k];\r
                            continue;\r
                        }\r
                        this.data[k] = Object.hasOwn(st, k) ? st[k] : base[k];\r
                    }\r
                    // ripple 键延迟写入（注入值先留底，装饰接管决策后一并落）——佩戴 ripple\r
                    // 装饰时恒开 echo 双环优先于态声明的 ripple 配置（1.5 注释的单通道）\r
                    this.data.ripple = this.el.classList.contains("asc-d-ripple")\r
                        ? { trigger: "always", inside: false, type: "echo" }\r
                        : rippleInjected;\r
                }\r
                if (labelSpan && labelIsFallback) labelSpan.textContent = deriveLabel(Object.hasOwn(st, "label") && st.label != null ? st.label : base?.label ?? "");\r
                // 6. 态 style（cssText，对齐 tags.styles 通道）：宿主原样式为基底整写（追加态样式）\r
                this.el.style.cssText = base.cssText + (typeof st.style === "string" && st.style.trim() ? (base.cssText.trim().endsWith(";") || !base.cssText.trim() ? "" : ";") + st.style : "");\r
                // 7. 态 class：摘旧加新（不碰使用者宿主 class）\r
                if (prevCls.length) for (const c of prevCls) this.el.classList.remove(c);\r
                prevCls = typeof st.class === "string" && st.class.trim() ? st.class.trim().split(/\\s+/) : [];\r
                for (const c of prevCls) this.el.classList.add(c);\r
                // 8. 态 tooltip（双轨）：当前态佩戴则挂（无条件挂——优先级高于父的溢出自动提示，\r
                //    ADR-0016 决策 8）；态消失只摘自挂的；宿主显式提示优先（未自挂且在场则不动）\r
                if (st.tooltip != null && String(st.tooltip) !== "") {\r
                    if (!selfTip && this.el.getAttribute(tipAttr)) {\r
                        // 在场的可能是父挂的溢出自动提示（低优先级，覆盖之）或宿主显式提示——\r
                        // 无法可靠区分，按「态佩戴意图明确」覆盖（已知温和竞争，ADR-0016 注记）\r
                    }\r
                    this.el.setAttribute(tipAttr, String(st.tooltip));\r
                    selfTip = true;\r
                } else if (selfTip) {\r
                    this.el.removeAttribute(tipAttr);\r
                    selfTip = false;\r
                }\r
            };\r
\r
            // —— el.value 劫持（布尔组化身 checkbox，x-model 桥）：布尔语域 "true"/"false" ——\r
            // x-model 写 el.value → data.value 落真布尔（默认组与注入组的字符串解释一致，\r
            // props 晚注入时序天然免疫）；非布尔组不劫持（x-model 字符串化固有语义自担）\r
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
            // —— 点击切换（循环 next + 四重判定链，ADR-0016 决策 4/5/6）——\r
            // 生效条件：autoswitch !== false && 当前态 clickable !== false && !disabled && !loading\r
            // （disabled 由原生 button 物理拦截 click，无需判）；命中 states[i] → states[(i+1)%N]\r
            // （无匹配 → states[0]），写 value + syncVisual 后派发 change（新态三元组）；\r
            // 布尔组另派发 input（x-model 回写监听在宿主自身）\r
            this.el.addEventListener("click", () => {\r
                if (this.el.disabled || this.data.autoswitch === false) return;\r
                const list = norm();\r
                if (list.length < 2) return; // 无效状态集：不可切态\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                if (cur && cur.clickable === false) return; // 出边锁：该态点击零效果\r
                const index = cur ? (list.indexOf(cur) + 1) % list.length : 0;\r
                const next = list[index];\r
                this.data.value = next.value;\r
                syncVisual();\r
                // 布尔组：写底层 el.value（布尔语域）后派发 input——x-model 监听在宿主自身，\r
                // 读 el.value 回写 state（配 .boolean 类型保真）\r
                if (boolPair) {\r
                    proto.set.call(this.el, String(next.value === true));\r
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                }\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next.value, index, state: next } }));\r
            });\r
\r
            // —— corner 按压预览（下一态佩戴 corner 时预显描边——松手切换正式化）——\r
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
            // —— 一跳后初始化：states/value 注入落定 → 缺省 value = states[0].value、底值快照、\r
            // 首次视觉同步（mounted 时化身子树与 props 均可能未就位，家族惯用法）——\r
            setTimeout(() => {\r
                const list = norm();\r
                // 重对齐（布尔组）：底层 el.value（x-model 编译期已写，布尔语域）优先于缺省初始化\r
                if (boolPair) {\r
                    const raw = proto.get.call(this.el);\r
                    if (raw === "true") this.data.value = true;\r
                    else if (raw === "false") this.data.value = false;\r
                }\r
                if (this.data.value === undefined && list.length > 0) this.data.value = list[0].value;\r
                base = { cssText: this.el.style.cssText };\r
                for (const k of BUTTON_PROPS) base[k] = this.data[k];\r
                // label 直写通道探测：首帧插值已完成（显示底值 label 派生），特征匹配即许可直写\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (span && span.textContent === deriveLabel(base.label)) {\r
                    labelSpan = span;\r
                    labelIsFallback = true;\r
                }\r
                syncVisual();\r
            }, 0);\r
            // 受控通道：外部改 value → 视觉跟随（states 替换同理重对齐——value 不在新值域时\r
            // 保持无匹配回灰，value 是受控真相不被擅改）\r
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
    /* ---------- 装饰 corner：当前态佩戴 = tone 外描边 + 右上角 tone 小三角内嵌反白小勾 ---------- */\r
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
      position: relative; /* 三角/描边定位上下文（x-ripple 载体另有 relative 兜底，此处显式自持） */\r
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
    /* border 同步消隐防预览描边与 border 间的 1px 间隙（同佩戴态无缝口径） */\r
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
`,Sr=`autospark.state-button`;function Cr(e){e.components[Sr]=xr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-state-button`))){let e=document.createElement(`button`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Sr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}wr();function wr(){y(e=>{m(e),Cr(e)})}var Tr=`<!--
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
`,Er=`autospark.text`;function Dr(e){e.components[Er]=Tr}Or();function Or(){y(e=>{m(e),Dr(e)})}var kr=`<!--
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
`,Ar=`autospark.link`;function jr(e){e.components[Ar]=kr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-link`))){let e=document.createElement(`a`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`rel`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Ar}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Mr();function Mr(){y(e=>{m(e),jr(e)})}var Nr=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态\r
    绑定不会求值——方向/虚线/对齐变体绑定落在编译子树的内层 body 上，宿主的\r
    块级/行内切换经 :has() 驱动；spacing（宿主 margin）在 mounted 钩子经 JS 通道\r
    同步（vertical 切换会换 margin 轴，故 vertical 变化时一并重同步）。\r
\r
    布局结构：body 为 flex 线容器，两段线由 body 的 ::before / ::after 伪元素\r
    承担（flex:1 满铺）；文字（默认插槽）居中嵌入，空插槽时出口隐藏、两段线\r
    自然连成整线，无文字态与带文字态共用同一结构。垂直态不带文字（文字被忽略\r
    不渲染——对齐 antd 5 边界，垂直分割线场景为纯分隔）。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark /\r
     data-colorized 六键）自动获得；divider 不在 data() 声明主题六键——间距走\r
     自有 spacing prop（JS 通道写 margin，不占用 data-spacing 主题通道名） -->\r
<div\r
  class="asc-divider"\r
  x-define="autospark.divider"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            vertical: false,   // 垂直分割线（缺省水平）；垂直态文字不渲染（纯分隔场景）\r
            dashed: false,     // 虚线（缺省实线）\r
            align: "center",   // 文字位置（水平态带文字时生效）：left | center | right\r
            spacing: "",       // 与相邻内容的间距：number px 或任意 CSS 值；水平态 = 上下 margin、垂直态 = 左右 margin（缺省无边距）\r
        }),\r
        mounted() {\r
            // 间距同步（化身路径约束：宿主级样式走 JS 通道）：number 归一为 px 字符串，\r
            // 按方向写宿主 margin 对应轴；vertical 切换换轴重写（watch 回调收 { value }\r
            // 信封对象，此处读整组状态无需解构）\r
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
    /* 线色基准（--auto-* 语义变量三级回退链，ADR-0129；兜底值对齐 button 边框校准值） */\r
    .asc-divider {\r
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #d9d9d9));\r
      border: 0;\r
      margin: 0;\r
      font-size: var(--auto-font-size, var(--asc-divider-font-size, 0.875rem));\r
    }\r
    /* 水平态（缺省）：块级满宽，body 承载 flex 线容器 */\r
    .asc-divider {\r
      display: block;\r
      width: 100%;\r
    }\r
    .asc-divider-body {\r
      display: flex;\r
      align-items: center;\r
      width: 100%;\r
    }\r
    /* 两段线：伪元素 border-top 承担（dashed 切 border-style），flex:1 满铺 */\r
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
    /* ---------- 文字位置（align，带文字时生效）：短线侧 flex 收窄 ---------- */\r
    /* left：文字靠左（首段短线 0.5em，尾段满铺） */\r
    .asc-divider-body[data-align="left"]::before {\r
      flex: 0 0 0.5em;\r
    }\r
    .asc-divider-body[data-align="right"]::after {\r
      flex: 0 0 0.5em;\r
    }\r
\r
    /* 文字出口：插槽内容；空插槽隐藏（两段线连成整线，无 gap 占位） */\r
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
    /* 垂直态文字不渲染（对齐 antd 5 边界：垂直分割线为纯分隔） */\r
    .asc-divider-body[data-vertical="true"] .asc-divider-text {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-divider,\r
    [data-dark] .asc-divider {\r
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #52525b));\r
    }\r
    [dark] .asc-divider-text,\r
    [data-dark] .asc-divider-text {\r
      color: var(--auto-color, var(--asc-divider-text-color, #fafafa));\r
    }\r
  </style>\r
  <!-- 变体数据属性承载在 body（编译子树内层元素）；spacing 经 mounted JS 通道写宿主 margin -->\r
  <span\r
    class="asc-divider-body"\r
    :data-vertical="vertical"\r
    :data-dashed="dashed"\r
    :data-align="align"\r
  >\r
    <span class="asc-divider-text" x-slot></span>\r
  </span>\r
</div>\r
`,Pr=`autospark.divider`;function Fr(e){e.components[Pr]=Nr}Ir();function Ir(){y(e=>{m(e),Fr(e)})}var Lr=`<!--
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
`,Rr=`autospark.space`;function zr(e){e.components[Rr]=Lr}Br();function Br(){y(e=>{m(e),zr(e)})}var Vr=`<!--
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
`,Hr=`autospark.grid`;function Ur(e){e.components[Hr]=Vr}Wr();function Wr(){y(e=>{m(e),Ur(e)})}var Gr=`<!--
    autospark.container 页面容器壳（组件库 P2 布局件，ADR-0018 清单权威表 layout 行）：
    header / aside / main / footer 四区 grid 版式（纯样式结构壳——无状态无事件无 JS 机制）。
    四区内容：命名插槽 header/aside/footer + 默认插槽（main）；子元素声明形态
    （<x-container-header> 等）经 index.ts precompile 变换折叠为插槽声明。

    三方名字撞车边界消歧（必读，详见 index.ts 文件头 / P2 合批 ADR）：
    - 本组件 autospark.container = 四区版式结构壳；
    - x-layout 指令 = grid 窗格布局机制（窗格分割/调节）；
    - x-container 指令（属性形态 <div x-container>）= 响应式断点容器（按档 max-width 居中）。
    本模板 x-define-options="{tag:false}" 关闭元素名自动推导（x-container 标签与同名
    指令撞名，ADR-0133 撞名规则 fail-fast）；<x-container> 元素形态由 precompile 变换
    独占承载，属性形态恒指断点容器指令——两通道互不干扰。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——侧栏位置绑定（:data-aside）落在编译子树的内层 body 上，grid 区域模板
    按 body 的数据属性命中 start/end 形态块。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——区间距/内距经 data-spacing 档位全局调节（--auto-padding 族），
     container 不设自有字号属性；data() 不得声明主题六键，组件内部变体属性亦禁用
     六个通道名（data-aside 为自有变体轴） -->
<div
  class="asc-container"
  x-define="autospark.container"
  x-define:inherit="autospark.base"
  x-define-options="{tag:false}"
>
  <script setup>
    {
        data: () => ({
            asidePosition: "start", // 侧栏位置：start 左（缺省）| end 右（grid 区域模板对调）
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
      min-height: 12rem; /* 未定高父级的下限占位（空壳不塌陷为零） */
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
    /* 侧栏位置 end：区域模板对调（main 在左、aside 在右），列轨随之对调 */
    .asc-container-body[data-aside="end"] {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "header header"
        "main aside"
        "footer footer";
    }

    /* ---------- 四区：区域落位 + 区间分隔线（相邻即线，region 空内容不占位） ---------- */
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
      width: var(--asc-container-aside-width, auto); /* 侧栏宽度：内容自适应，可经覆盖变量定宽 */
      padding: var(--auto-padding, var(--asc-container-padding, 0.8rem));
      background: var(--auto-secondary-bgcolor, var(--asc-container-aside-bg, rgba(245, 245, 245, 0.25)));
      overflow: auto;
    }
    /* 侧栏位置 end：分隔线换到左缘 */
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
      overflow: auto; /* 主区滚动容器（四区壳内滚动收敛在 main） */
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
    /* 空区不占位：槽位无内容时区段整段退出（grid 轨道自动塌缩）——出口紧凑书写纪律 */
    .asc-container-header:empty,
    .asc-container-aside:empty,
    .asc-container-main:empty,
    .asc-container-footer:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 侧栏位置绑定落本层（T4=B：根上动态绑定不求值）；四区 = 命名插槽出口 + 默认插槽（main） -->
  <div class="asc-container-body" :data-aside="asidePosition">
    <header class="asc-container-header" x-slot:header></header>
    <aside class="asc-container-aside" x-slot:aside></aside>
    <main class="asc-container-main" x-slot></main>
    <footer class="asc-container-footer" x-slot:footer></footer>
  </div>
</div>
`,Kr=`autospark.container`,qr={"x-container-header":`header`,"x-container-aside":`aside`,"x-container-footer":`footer`,"x-container-main":null};function Jr(e){e.components[Kr]=Gr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-container`))){let e=document.createElement(`div`);for(let e of Array.from(t.children)){let t=qr[e.tagName.toLowerCase()];if(t===void 0)continue;if(t===null){e.replaceWith(...Array.from(e.childNodes));continue}let n=document.createElement(`template`);for(n.setAttribute(`x-slot:${t}`,``);e.firstChild;)n.content.appendChild(e.firstChild);e.replaceWith(n)}let n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Kr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Yr();function Yr(){y(e=>{m(e),Jr(e)})}var Xr=`<!--
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
`,Zr=`autospark.alert`;function Qr(e){e.components[Zr]=Xr}$r();function $r(){y(e=>{m(e),Qr(e)})}var ei=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体/状态绑定（:data-variant /
    :data-status）与 strokeWidth 内联变量全部落在编译子树的内层 body 上，宿主级语义色
    经 body 数据属性以 :has() 驱动；aria-valuenow/min/max（原生属性语义）在 mounted
    钩子经 JS 通道同步宿主（化身后 this.el 即组件根），percent 变化经 watch 保持同步。

    SVG 子树编译边界（引擎已知行为规避）：compiler 的 transformer filter 只认
    HTMLElement，SVGElement 不命中——SVG 子树内的指令属性（:r / x-show 等）不被编译、
    原样泄漏为字面文本。故 circle 圆环几何（r / stroke-width / dasharray / dashoffset）
    走 mounted JS 通道（同一元素 setAttribute 更新，CSS 过渡保持有效）；line / circle
    形态互斥走 body data-variant 的纯 CSS 显隐分支（结构恒在场，不重建）。

    纯展示组件（ADR-0018 清单权威表 feedback 行）：无事件出口；进度由外部状态单向驱动
    （percent 经 props 注入，指令值通道响应式——外部状态变化即时重求值）。

    过渡动效纪律（badge 先例同款）：填充 width / 圆环 stroke-dashoffset 的 CSS 过渡在
    prefers-reduced-motion: reduce 下停播（值直接跳变，无中间帧）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随（--auto-font-size 基线），
     progress 不设自有字号属性（button 同范式 ADR-0012）；data() 不得声明主题六键，
     组件内部变体属性亦禁用六个通道名（data-variant/data-status 为自有变体轴） -->
<!-- 无内置文案、不接 i18n（ADR-0018 决策 6.1 通道对本件无消费面）：百分比数字自表述 -->
<div
  class="asc-progress"
  x-define="autospark.progress"
  x-define:inherit="autospark.base"
  role="progressbar"
>
  <script setup>
    {
        data: () => ({
            percent: 0,        // 进度百分比：钳制 [0,100]（负数归 0、超百归 100、非数字归 0）；>=100 且 status 缺省自动升 success
            variant: "line",   // 形态：line 轨道条（width 百分比过渡）| circle 圆环（SVG stroke-dashoffset 过渡）
            status: "",        // 状态语义色：success | error | warning 显式指定优先；缺省 = percent>=100 自动 success（antd 同款「完成后自动成功」）
            showText: true,    // 百分比文本：line 态在条右侧 / circle 态在环心；status 态换语义图标（success/error/warn）
            strokeWidth: 6,    // 线宽（px，number | CSS 长度字符串）：line 态 = 轨道高度 / circle 态 = 圆环粗细；经 --asc-progress-sw 变量 :style 内联下发
            // computed 简写（普通函数值即计算属性，仅限单表达式）：钳制后的展示百分比
            displayPercent: (s) => Math.min(100, Math.max(0, Number(s.percent) || 0)),
            // computed：生效状态档——显式 status 优先；缺省时 percent>=100 自动 success，
            // 未满且未指定返回 null（绑定通道假值移除——空串会落 data-status="" 残留属性）
            displayStatus: (s) => s.status ? s.status : (Number(s.percent) >= 100 ? "success" : null),
        }),
        mounted() {
            // aria 值同步（化身路径约束：宿主原生属性走 JS 通道；回调收 { value } 信封对象，
            // 此处不取值只重查整态——alert syncClosed 同款惯用法）
            const syncAria = () => {
                const v = Math.min(100, Math.max(0, Number(this.data.percent) || 0));
                this.el.setAttribute("aria-valuemin", "0");
                this.el.setAttribute("aria-valuemax", "100");
                this.el.setAttribute("aria-valuenow", String(v));
            };
            syncAria();
            this.watch("percent", () => { syncAria(); });

            // circle 圆环几何同步（引擎边界规避：compiler 的 transformer filter 只认
            // HTMLElement，SVGElement 不命中——SVG 子树内的属性绑定不被编译、原样泄漏为
            // 字面文本；故 r / stroke-width / dasharray / dashoffset 走 JS 通道。同一元素上
            // setAttribute 更新，CSS stroke-dashoffset 过渡保持有效（重建元素不播过渡））
            const syncCircle = () => {
                const svg = this.el.querySelector(".asc-progress-svg");
                if (!svg) return;
                const raw = this.data.strokeWidth;
                // strokeWidth 双形态：number 按 viewBox 单位 / 字符串取数值（CSS 长度单位在 viewBox 坐标系无意义）
                const sw = typeof raw === "number" ? raw : parseFloat(String(raw)) || 6;
                const r = Math.max(0, 50 - sw / 2); // r 内缩 strokeWidth/2 防截边
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
            setTimeout(syncCircle, 0); // mounted 一跳首同步（化身子树挂载时序，button syncIconStyle 同款）
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
      display: flex; /* 显式块级：元素名写法化身 HTMLUnknownElement 亦满宽 */
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

    /* ---------- body：形态布局载体（编译子树内层，绑定可求值） ---------- */
    /* line 态 = 横排（轨道 flex:1 + 文本）；circle 态 = 定宽高方块（svg 满铺 + 文本绝对居中） */
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

    /* ---------- line 形态：轨道 + 填充（width 百分比过渡） ---------- */
    .asc-progress-track {
      flex: 1;
      min-width: 0;
      height: var(--asc-progress-sw, 6px);
      border-radius: 9999px;
      overflow: hidden; /* 填充窄段圆角不越轨 */
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

    /* ---------- circle 形态：SVG 圆环（stroke-dashoffset 过渡） ---------- */
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

    /* ---------- 文本（showText）：line 态条右 / circle 态环心 ---------- */
    .asc-progress-text {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 2.5em;
      font-size: 0.75em;
      color: var(--auto-secondary-color, var(--asc-progress-text-color, rgba(0, 0, 0, 0.55)));
      white-space: nowrap;
    }
    /* status 态换语义图标：色随 tone（成功/出错/警告的图文本一致语义） */
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

    /* ---------- 动效停播（badge 先例）：过渡直接跳变 ---------- */
    @media (prefers-reduced-motion: reduce) {
      .asc-progress-bar,
      .asc-progress-ring-bar {
        transition: none;
      }
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 变体/状态绑定与 strokeWidth 全落 body（T4=B——见文件头注释）；strokeWidth 经
         --asc-progress-sw 变量 :style 内联下发（number 归一 px / 字符串原样；自定义属性键引擎走 setProperty 通道） -->
  <div
    class="asc-progress-body"
    :data-variant="variant"
    :data-status="displayStatus"
    :style="{ '--asc-progress-sw': (typeof strokeWidth === 'number' ? strokeWidth + 'px' : strokeWidth) }"
  >
    <!-- line 形态：轨道 + 填充（width = 钳制百分比，CSS 过渡承担增量动画；
             显隐由 CSS data-variant 分支承担——SVG 上指令不被编译的引擎边界，
             形态切换统一纯 CSS） -->
    <span class="asc-progress-track">
      <span class="asc-progress-bar" :style="{ width: displayPercent + '%' }"></span>
    </span>
    <!-- circle 形态：SVG 圆环——几何静态初值按缺省 strokeWidth=6（r=47），mounted
             一跳内由 JS 通道按 strokeWidth 与 percent 重算（SVG 子树内属性绑定
             不被编译——见文件头注释与 mounted syncCircle）；dashoffset 过渡由
             CSS 承担（同一元素 setAttribute 更新） -->
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
    <!-- 文本（showText）：status 态换语义图标（success/error/warn），常态百分比；
             两形态同一出口，摆位由 body data-variant 的 CSS 分支承担 -->
    <span class="asc-progress-text" x-show="showText">
      <i class="asc-progress-icon" x-if="displayStatus === 'success'" x-icon="'success'"></i>
      <i class="asc-progress-icon" x-if="displayStatus === 'error'" x-icon="'error'"></i>
      <i class="asc-progress-icon" x-if="displayStatus === 'warning'" x-icon="'warn'"></i>
      <span class="asc-progress-pct" x-if="!displayStatus">{{ displayPercent + '%' }}</span>
    </span>
  </div>
</div>
`,ti=`autospark.progress`;function ni(e){e.components[ti]=ei}ri();function ri(){y(e=>{m(e),ni(e)})}var ii=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——本组件无宿主级变体（骨架块
    形态全在内层 body 上按 data-variant 后代选择器驱动），根上零绑定即零风险。

    插槽切换（核心用法）：loading=true 显示骨架块组 / false 显示默认插槽真实内容。
    投影在编译期发生、显隐走 x-show（不摘 DOM 不重建）——真容内的运行态（输入焦点/
    滚动位置）在 loading 往返间保留；骨架块组 aria-hidden（纯装饰无语义）。

    与 x-loading 指令的边界（ADR-0018 决策 3 消歧）：x-loading 是 action 通道的就近
    消费（行为指令——按钮/动作执行期间自动呈现 loading 遮罩或占位），本组件是静态
    结构占位（数据未到时的骨架结构，loading props 手动驱动、插槽切换骨架/真容）。
    动作级反馈用 x-loading，数据级占位用 skeleton，两者正交可同用。

    动效纪律（badge 先例）：闪烁动画（渐变扫过）在 prefers-reduced-motion: reduce 下
    停播（静态淡底直接呈现）；animated=false 逐实例关闭。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随（骨架块尺寸随 --auto-font-size
     以 em 缩放），skeleton 不设自有字号属性；data() 不得声明主题六键，组件内部变体属性
     亦禁用六个通道名（data-variant/data-animated/data-last 为自有变体轴） -->
<!-- 无内置文案、不接 i18n（ADR-0018 决策 6.1 通道对本件无消费面）：骨架无文案 -->
<div
  class="asc-skeleton"
  x-define="autospark.skeleton"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            variant: "text",  // 骨架块形态：text 行块（多行）| circle 圆（头像/图标位）| rect 矩形块（媒体/封面位）
            rows: 0,         // text 形态行数（缺省/0/非法值归 1；circle/rect 恒单块——多行无语义）
            loading: true,    // true 骨架态 / false 渲染默认插槽真实内容（插槽切换骨架/真容，核心用法）
            animated: true,   // 闪烁动画开关（false 静态淡底；prefers-reduced-motion 恒停播）
            // computed 简写（普通函数值即计算属性，仅限单表达式）：行号序列 [1..n]——
            // x-for 迭代源须为数组（引擎边界：of number 迭代 0 项）；circle/rect 恒单块 [1]，
            // text 钳正整数（0/非法/缺省归 1）。末行判定 = i === rowList.length
            rowList: (s) => Array.from({ length: (s.variant === "text" ? Math.max(1, Math.floor(Number(s.rows) || 1)) : 1) }, (_, k) => k + 1),
        }),
    }
  <\/script>
  <style global id="autospark-components-skeleton">
    /* 淡底双色经 --auto-color 派生（color-mix）：主题/暗色自动跟随，单源换色 */
    .asc-skeleton {
      --asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 10%, transparent);
      --asc-skel-hi: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 5%, transparent);
      display: flex; /* 显式块级：元素名写法化身 HTMLUnknownElement 亦满宽 */
      box-sizing: border-box;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-skeleton-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-skeleton-line-height, 1.5));
    }
    /* 骨架块组与真容出口：纵向满宽（行块序列自上而下排布） */
    .asc-skeleton-items,
    .asc-skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 0.6em;
      width: 100%;
      min-width: 0;
    }

    /* ---------- 骨架块（形态按 body data-variant 后代选择器分流） ---------- */
    /* text 行块：行高块满宽，末行（data-last 绑定真值时在场）半宽收尾 */
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
    /* circle 圆：正圆（直径 2.5em 随档位缩放——头像/图标位占位） */
    .asc-skeleton-body[data-variant="circle"] .asc-skeleton-item {
      width: 2.5em;
      height: 2.5em;
      border-radius: 50%;
    }
    /* rect 矩形块：大块（高度 5em 满宽——媒体/封面/卡片位占位） */
    .asc-skeleton-body[data-variant="rect"] .asc-skeleton-item {
      height: 5em;
      border-radius: var(--auto-border-radius, var(--asc-skeleton-radius, 0.5rem));
    }

    /* ---------- 闪烁动画（animated）：渐变扫过（antd 同款观感） ---------- */
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
    /* 动效停播（badge 先例）：系统减弱动效偏好恒停播（静态淡底直接呈现） */
    @media (prefers-reduced-motion: reduce) {
      .asc-skeleton-items[data-animated="true"] .asc-skeleton-item {
        animation: none;
      }
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-skeleton,
    [data-dark] .asc-skeleton {
      --asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #fafafa)) 12%, transparent);
      --asc-skel-hi: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #fafafa)) 6%, transparent);
    }
  </style>
  <!-- 形态/动画绑定落 body（编译子树内层元素，绑定可求值）；骨架块形态由 body
         data-variant 的后代选择器驱动（宿主无级变体，无需 :has() 反驱） -->
  <div class="asc-skeleton-body" :data-variant="variant">
    <!-- 默认插槽出口：loading=false 渲染真实内容（投影编译期完成，x-show 只切显隐——
             真容运行态在 loading 往返间保留） -->
    <span class="asc-skeleton-content" x-show="!loading" x-slot></span>
    <!-- 骨架块组：loading=true 显示；aria-hidden 纯装饰；animated 经 data-animated
             驱动动画（绑定假值整个移除属性——缺席即静态淡底）；x-for 宿主为纯克隆载体，
             行块与末行标记在内层元素上（x-for 宿主自身绑定不被编译的家族纪律） -->
    <span class="asc-skeleton-items" x-show="loading" aria-hidden="true" :data-animated="animated">
      <span class="asc-skeleton-row" x-for="i of rowList" :key="i">
        <i class="asc-skeleton-item" :data-last="(i === rowList.length)"></i>
      </span>
    </span>
  </div>
</div>
`,ai=`autospark.skeleton`;function oi(e){e.components[ai]=ii}si();function si(){y(e=>{m(e),oi(e)})}var ci=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——type 变体绑定（:data-type）
    落在编译子树的内层 body 上，宿主级语义色（图标色/确认钮色联动）经 body 数据属性
    以 :has() 驱动。

    组合壳边界（ADR-0018 决策 3——与 x-dialog 的边界声明）：x-dialog 是通用弹层指令
    （遮罩/居中/ESC/关闭回写等模态机制，内容全自定义）；本组件是 x-dialog 的**确认
    语义开箱件**——只提供询问内容（type 图标 + 标题/内容 + 确认/取消双钮），弹层机制
    全部组合消费 x-dialog（勿自建弹层）。消费形态：宿主声明 x-dialog:message-box
    ="visible 状态"（值通道专职开关），props 经 x-dialog-options.props 注入（与 x-dialog
    的 props 通道同构）。覆盖物消费用无点别名 message-box（overlay 指令属性参数句点被
    切为修饰符且无点号候选回溯——autospark.message-box 全名会被截断 miss，别名注册见
    index.ts MESSAGE_BOX_ALIAS）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - confirm / cancel：动作钮点击冒泡，detail 为空——先广播、后关闭（action:close 信号
      冒泡被 overlay 实例根接住走「请求关闭」链，visible 可回写时自动回写 false）。
      物理边界（与 overlay:close 同款）：覆盖物 DOM 渲染在 body 容器内、不在 engine
      宿主树内——消费处用 document.addEventListener("confirm"|"cancel", ...) 或模板外
      JS 监听（模板里 @confirm 收不到）。

    组合依赖：确认/取消钮组合消费 autospark.button（嵌套 x-component 化身，宿主为真
    button 元素保原生语义）——按需加载场景须同页加载 autospark.button.js；聚合产物
    autospark.plugins.js 无此问题。文案走 button 的 label props（继承形态下嵌套插槽
    出口被忽略的引擎边界，ADR-0019 后果节规避 1 同款纪律），i18n 回退表达式内联在值
    对象成员（t 经表达式求值器注入，empty 先例）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随（双钮尺寸随档位），
     message-box 不设自有字号属性；data() 不得声明主题六键，组件内部变体属性亦禁用
     六个通道名（data-type 为自有变体轴） -->
<!-- i18n 消费（ADR-0018 决策 6 约定 1）：confirmText/cancelText 缺省走词典
     message-box.confirm / message-box.cancel 键（回退「确定」「取消」） -->
<div
  class="asc-message-box"
  x-define="autospark.message-box"
  x-define:inherit="autospark.base"
  role="alertdialog"
  aria-modal="true"
>
  <script setup>
    {
        data: () => ({
            type: "info",      // info | success | warning | danger：图标映射 + 语义色（alert 同款映射，询问场景无 default 档）
            title: "",        // 标题（空则不渲染标题行——图标+内容仍成体）
            content: "",       // 内容文案（默认插槽内容优先——富内容可换）
            confirmText: "",    // 确认钮文案：空走 i18n 词典 message-box.confirm 键（回退「确定」）
            cancelText: "",    // 取消钮文案：空走 i18n 词典 message-box.cancel 键（回退「取消」）
            confirmType: "",    // 确认钮语义色覆盖：空 = 按 type 联动（danger 询问配 danger 色实底、其余 primary）
            showCancel: true,   // 取消钮开关（纯确认提示可关——取消缺席时确认钮独占动作区）
            // computed 简写（普通函数值即计算属性，仅限单表达式）：确认钮语义色——
            // 显式覆盖优先，缺省按 type 联动（danger 询问的确认钮即 danger 色）
            confirmBtnType: (s) => s.confirmType || (s.type === "danger" ? "danger" : "primary"),
            // computed：图标名解析——type 映射内置图标（alert 同款：success→success /
            // warning→warn / danger→error / info→info，经 engine 内置 x-icon 渲染）
            displayIcon: (s) => (s.type === "success" ? "success" : s.type === "warning" ? "warn" : s.type === "danger" ? "error" : "info"),
        }),
        methods: {
            // 动作钮点击（actions 容器委托）：命中 data-mb-action（confirm | cancel）先广播
            // 同名事件（detail 空，bubbles——物理边界见文件头注释），后 action:close 信号
            // 冒泡（内置信号动作的等价广播——overlay 实例根接住走「请求关闭」链，visible
            // 可回写时自动回写 false）；禁用钮不动作（button 化身宿主 disabled 由其
            // mounted 同步，原生语义完整）
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
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-message-box-padding, 0.8rem));
      display: flex; /* 显式块级（overlay shell body 内满宽） */
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

    /* ---------- body：内容布局载体（编译子树内层，绑定可求值） ---------- */
    .asc-message-box-body {
      display: flex;
      flex-direction: column;
      gap: calc(var(--asc-pad) * 1.1);
      width: 100%;
      min-width: 0;
    }
    /* 主区：图标 + 文本组横排（图标与首行标题视觉居中对齐） */
    .asc-message-box-main {
      display: flex;
      align-items: flex-start;
      gap: 0.7em;
      min-width: 0;
    }
    /* 图标位：略大于正文（警示感），色随 tone；不收缩（内容多行时图标恒定） */
    .asc-message-box-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      line-height: 1;
      color: var(--asc-tone);
      flex-shrink: 0;
    }
    /* 文本组：标题与内容恒纵排 */
    .asc-message-box-text {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      flex: 1;
      min-width: 0;
      padding-top: 0.1em; /* 与图标基线微调（图标 1.5em 的视觉重心） */
    }
    /* 标题：medium 字重 + 略大（询问主旨） */
    .asc-message-box-title {
      font-size: 1.1em;
      font-weight: var(--x-font-weight-medium, 500);
      color: var(--auto-color, var(--asc-message-box-title-color, #303030));
    }
    /* 内容：次要文字色（默认插槽出口，富内容同通道） */
    .asc-message-box-content {
      color: var(--auto-secondary-color, var(--asc-message-box-content-color, rgba(0, 0, 0, 0.55)));
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* ---------- 动作区：右对齐（取消在左、确认在右——对话框惯例） ---------- */
    .asc-message-box-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.6em;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- type 变体落 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->
  <div class="asc-message-box-body" :data-type="type">
    <!-- 主区：图标（type 映射）+ 文本组（标题/内容） -->
    <div class="asc-message-box-main">
      <i class="asc-message-box-icon" x-icon="displayIcon"></i>
      <div class="asc-message-box-text">
        <div class="asc-message-box-title" x-if="title">{{ title }}</div>
        <!-- 内容出口：插槽内容优先，无内容回退 {{ content }}（组件自身状态求值） -->
        <div class="asc-message-box-content" x-slot>{{ content }}</div>
      </div>
    </div>
    <!-- 动作区（容器委托点击——文案走 label props 的原因见文件头注释；i18n 回退
             表达式内联在值对象成员：t 经表达式求值器注入，键等值判定回退硬编码中文） -->
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
`,li=`autospark.message-box`,ui=`message-box`;function di(e){e.components[li]=ci,e.components[ui]=ci}fi();function fi(){y(e=>{m(e),di(e)})}var pi=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——type 语义色绑定（:data-type）
    落在编译子树的内层 body 上，宿主级语义色（大图标色）经 body 数据属性以 :has() 驱动。

    与 alert 的边界（见 index.ts 文件头）：alert 是页内警示条（行内横条）；本组件是
    操作终态页（居中纵排：大图标 + 标题 + 描述 + 动作区）。无状态无事件（纯展示）。

    插槽出口：icon 插槽整体换图（缺省按 type 映射内置图标经 x-icon 渲染）；默认插槽
    为动作区（button 组合配方位，未提供时无占位）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随（图标/标题/间距随档缩放），
     result 不设自有字号属性；data() 不得声明主题六键，组件内部变体属性亦禁用
     六个通道名（data-type 为自有变体轴） -->
<!-- 无内置文案、不接 i18n（ADR-0018 决策 6 约定 1 通道对本件无消费面）：title/description
     均使用者传入 -->
<div
  class="asc-result"
  x-define="autospark.result"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "info",       // 语义色四档：success | error | warning | info（缺省 info）
            title: "",         // 标题文案（操作结果主旨，空则不渲染标题行）
            description: "",    // 描述文案（补充说明，次要文字色，空则不渲染）
            // computed 简写（普通函数值即计算属性，仅限单表达式）：图标名解析——
            // type 映射内置图标（success→success / error→error / warning→warn / info→info，
            // 经 engine 内置 x-icon 渲染；icon 插槽在场时整体换图、本映射不消费）
            displayIcon: (s) => (s.type === "success" ? "success" : s.type === "error" ? "error" : s.type === "warning" ? "warn" : "info"),
        }),
    }
  <\/script>
  <style global id="autospark-components-result">
    /* 语义色组织（alert 同款定型结构，ADR-0018 决策 6.4）：--asc-tone 中转变量 +
       body data-type 变体属性经 :has() 反驱宿主——大图标色单源 */
    .asc-result {
      --asc-tone: var(--auto-info-color, var(--asc-result-info, #71717a));
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-result-padding, 0.8rem));
      display: flex; /* 显式块级：元素名写法化身 HTMLUnknownElement 亦满宽 */
      justify-content: center; /* 终态页居中语义：内容列水平居中（垂直定位由容器承载） */
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

    /* ---------- body：居中纵排布局载体（编译子树内层，绑定可求值） ---------- */
    .asc-result-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.6em;
      max-width: 100%;
      min-width: 0;
    }
    /* 大图标位：终态页视觉锚（4em 大图标，色随 tone）；icon 插槽整体换图同位同尺寸 */
    .asc-result-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 4em;
      line-height: 1;
      color: var(--asc-tone);
    }
    /* 标题：操作结果主旨（1.25em + medium 字重） */
    .asc-result-title {
      font-size: 1.25em;
      font-weight: var(--x-font-weight-medium, 500);
      color: var(--auto-color, var(--asc-result-title-color, #303030));
    }
    /* 描述：次要文字色（长文案自动换行） */
    .asc-result-desc {
      max-width: 36em;
      color: var(--auto-secondary-color, var(--asc-result-desc-color, rgba(0, 0, 0, 0.55)));
      word-break: break-word;
    }
    /* 动作区（默认插槽）：横排居中 + 顶部留白；未提供内容时无占位（出口紧凑书写纪律） */
    .asc-result-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.6em;
      margin-top: 0.6em;
    }
    .asc-result-actions:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- type 变体落 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->
  <div class="asc-result-body" :data-type="type">
    <!-- 大图标位：icon 插槽整体换图，缺省按 type 映射内置图标（displayIcon computed） -->
    <span class="asc-result-icon" x-slot:icon><i class="asc-result-glyph" x-icon="displayIcon"></i></span>
    <!-- 标题行：空 title 不渲染 -->
    <div class="asc-result-title" x-if="title">{{ title }}</div>
    <!-- 描述行：空 description 不渲染 -->
    <div class="asc-result-desc" x-if="description">{{ description }}</div>
    <!-- 动作区：默认插槽（button 组合配方位，出口紧凑书写——:empty 隐藏纪律） -->
    <div class="asc-result-actions" x-slot></div>
  </div>
</div>
`,mi=`autospark.result`;function hi(e){e.components[mi]=pi}gi();function gi(){y(e=>{m(e),hi(e)})}var _i=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——变体绑定（bordered/hoverable/collapsible/collapsed）全部落在编译子树的\r
    内层 inner 元素上，卡片盒子样式直接命中 inner 的 data-* 属性选择器（宿主 .asc-card\r
    为透明块壳，仅承载块级排版基线，无需 :has() 反驱）。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - collapse：可折叠头部点击翻转后冒泡，detail = { collapsed }（翻转后的新值）；\r
      外部 props 驱动的 collapsed 变化不广播（防回环）。\r
\r
    空段隐藏约定：title 空 + header/extra 槽无内容 + 不可折叠 → 整个 header 隐藏；\r
    footer 槽无内容 → footer 隐藏；body 槽无内容（纯头卡片）→ body 隐藏——:empty 判定\r
    要求出口内无空白文本节点，出口元素内容必须紧凑书写（button label 同款纪律）。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——阴影/圆角/字号档位经主题通道全跟随（卡片阴影即走 data-shadow\r
     通道消费 --auto-shadow）；card 不在 data() 声明主题六键，内部变体属性亦禁用\r
     六个通道名 -->\r
<div\r
  class="asc-card"\r
  x-define="autospark.card"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            title: "",          // 头部标题（header 槽可整体重载，槽内容优先于本兜底）\r
            bordered: true,     // 边框开关（false 边框转透明色，盒模型占位稳定不跳变；绑定通道取反落 data-borderless——假值属性整个移除的家族约定下缺省即有边框）\r
            hoverable: false,   // 悬停浮起（边框点亮 + 阴影抬升；阴影档位基线仍随 data-shadow 通道）\r
            collapsible: false, // 头部可折叠（true 时点击标题区/箭头切换 collapsed；extra 区域不触发）\r
            collapsed: false,   // 折叠态（受控：外部 props 可驱动；内部切换经 collapse 事件广播）\r
        }),\r
        methods: {\r
            // 头部标题区点击（仅 collapsible 生效）：翻转 collapsed + collapse 事件冒泡\r
            //（detail = { collapsed } 翻转后的新值）；handler 挂在 toggle 组元素上，\r
            // header 槽内容替换不改变宿主元素的事件绑定；extra 区域不在组内不触发\r
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
    /* ---------- 卡片盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */\r
    .asc-card-inner {\r
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族），data-spacing 档位全局调节生效 */\r
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
    /* 悬停浮起：边框点亮主色 + 阴影抬升（抬升档为组件自有视觉，--asc-card-hover-shadow 可覆盖） */\r
    .asc-card-inner[data-hoverable="true"]:hover {\r
      border-color: var(--auto-primary-color, var(--asc-card-primary, #009aff));\r
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));\r
    }\r
\r
    /* ---------- header：标题区（toggle 组）+ extra ---------- */\r
    .asc-card-head {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-bottom: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */\r
      line-height: 1.4;\r
    }\r
    /* 空头隐藏：title 空 + header/extra 槽无内容 + 不可折叠（箭头缺席）→ 整段不占位 */\r
    .asc-card-head:has(> .asc-card-toggle > .asc-card-head-main:empty):has(\r
        > .asc-card-extra:empty\r
      ):not(:has(.asc-card-arrow)) {\r
      display: none;\r
    }\r
    /* 标题区 toggle 组：箭头 + 标题出口（flex:1 把 extra 推向右缘）；可折叠时整组可点 */\r
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
    /* 折叠箭头：缺省展开朝下（rotate 90°），折叠态收回朝右 */\r
    .asc-card-arrow {\r
      display: inline-flex;\r
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(0, 0, 0, 0.35)));\r
      transform: rotate(90deg);\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-card-head[data-collapsed="true"] .asc-card-arrow {\r
      transform: rotate(0deg);\r
    }\r
    /* extra：header 右缘动作区（toggle 组 flex:1 已推开） */\r
    .asc-card-extra {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.4em;\r
    }\r
    .asc-card-extra:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- body：默认插槽出口（出口即容器，投影内容为直接子级） ---------- */\r
    .asc-card-body {\r
      flex: 1;\r
      padding: var(--asc-pad);\r
    }\r
    .asc-card-body:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- footer ---------- */\r
    .asc-card-footer {\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-top: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
    }\r
    .asc-card-footer:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 变体数据属性承载在 inner（编译子树内层元素）；body/footer 的折叠显隐组合 x-show\r
         （spec 约定：可折叠勿引重机制） -->\r
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
      <!-- 标题区 toggle 组：箭头（结构元素，在 header 槽出口之外，不随槽内容替换消失）\r
               + header 槽出口（无内容时回退 {{ title }}——紧凑书写，:empty 判定纪律） -->\r
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
`,vi=`autospark.card`;function yi(e){e.components[vi]=_i}bi();function bi(){y(e=>{m(e),yi(e)})}var xi=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——变体绑定（type/variant/closed）落在编译子树的内层 body 上，宿主外观\r
    （底色/描边/文字色）经 body 的 data-* 变体属性以 :has() 驱动（button 同款范式）。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - close：关闭钮点击冒泡，cancelable，detail = { event }（原始点击事件）；\r
      未 preventDefault 时组件自动置 closed 隐藏整枚，preventDefault 则交由外部\r
      全权接管关闭时机（受控用法惯用法）。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——尺寸档经主题通道 data-size 全跟随（字号/padding 以 em 标定自动\r
     缩放，无自有尺寸属性）；tag 不在 data() 声明主题六键，内部变体属性亦禁用六通道名 -->\r
<span\r
  class="asc-tag"\r
  x-define="autospark.tag"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            type: "default",   // 语义色（对齐 button 范式 ADR-0012）：primary | success | warning | danger | info | default 中性档\r
            variant: "light",  // 形态（与语义色正交）：light 淡底（缺省）| solid 实底白字 | outline 描边\r
            icon: "",          // 前置图标名或 { name } 对象（x-icon 值通道，随状态响应）\r
            closable: false,   // 关闭钮：点击 close 事件冒泡；未 preventDefault 自动隐藏\r
            closed: false,     // 关闭态（true 经 :has() 通道隐藏整枚；受控可回 false 重现）\r
        }),\r
        methods: {\r
            // 关闭钮点击：阻断原生点击冒泡（不触发宿主级 @click）→ close 事件冒泡\r
            //（cancelable，detail = { event } 原始点击事件）→ 未 preventDefault 则\r
            // 自动置 closed（CSS 通道隐藏整枚）；外部接管关闭时机时 preventDefault\r
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
    /* ---------- 语义色轴（type）：--asc-tone 中转，button/link 同款范式 ---------- */\r
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
    /* default：中性档（正文色，base 值即本档——light 淡灰底） */\r
    .asc-tag:has(> .asc-tag-body[data-type="default"]) {\r
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));\r
    }\r
\r
    /* ---------- 形态轴（variant，与语义色正交）：三通道变量注入 ---------- */\r
    /* solid：实底白字（语义色底上的白字为恒定设计，非变量映射——ADR-0129 备注） */\r
    .asc-tag:has(> .asc-tag-body[data-variant="solid"]) {\r
      --asc-bg: var(--asc-tone);\r
      --asc-ink: #fff;\r
      --asc-line: transparent;\r
    }\r
    /* outline：透明底 + 语义色描边/文字（描边取 55% 混淡，视觉与文字同级不抢） */\r
    .asc-tag:has(> .asc-tag-body[data-variant="outline"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 55%, transparent);\r
    }\r
    /* light 为缺省形态：base 值即本档（淡底 + 同色文字 + 淡描边），无需变体块 */\r
\r
    /* ---------- 关闭态（closed）：:has() 通道隐藏整枚 ---------- */\r
    .asc-tag:has(> .asc-tag-body[data-closed="true"]) {\r
      display: none;\r
    }\r
\r
    /* ---------- body 布局（编译子树内层，绑定可求值） ---------- */\r
    .asc-tag-body {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.25em;\r
      min-width: 0;\r
    }\r
    /* 空出口不占位：纯图标用法（插槽无内容）时 label 隐藏，消除 gap 占位 */\r
    .asc-tag-label:empty {\r
      display: none;\r
    }\r
    /* 关闭钮：小一号 × 图标（内置 no），独立 hover 反馈（按内容色派生淡底） */\r
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
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 变体数据属性承载在 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->\r
  <span\r
    class="asc-tag-body"\r
    :data-type="type"\r
    :data-variant="variant"\r
    :data-closed="closed"\r
  >\r
    <!-- icon 双形态：字符串 = 图标名；对象 = { name }（x-icon 值通道） -->\r
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
    <!-- 默认插槽出口：标签文字（紧凑书写——:empty 判定纪律） -->\r
    <span class="asc-tag-label" x-slot></span>\r
    <!-- 关闭钮（closable）：字面量须带引号——裸 no 会命中 data.no 键 -->\r
    <i\r
      class="asc-tag-close"\r
      x-if="closable"\r
      x-icon="'no'"\r
      @click="onCloseClick($event)"\r
    ></i>\r
  </span>\r
</span>\r
`,Si=`autospark.tag`;function Ci(e){e.components[Si]=xi}wi();function wi(){y(e=>{m(e),Ci(e)})}var Ti=`<!--
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
`,Ei=`autospark.empty`;function Di(e){e.components[Ei]=Ti}Oi();function Oi(){y(e=>{m(e),Di(e)})}var ki=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——变体绑定（shape/failed）落在编译子树的内层 inner 元素上，头像盒子\r
    样式直接命中 inner 的 data-* 属性选择器（card 同款范式，宿主为透明壳）。\r
\r
    回退链（三源优先级）：src 在场且未失败 → 图片；icon 在场 → x-icon 图标；\r
    label 在场 → 首字符（Array.from 取码点，emoji/扩展区安全）；三源皆空 → 内置\r
    default 图标兜底（视觉不空白）。图片加载失败（@error）置 failed 回退，\r
    src 变化时重置 failed 重试新地址。\r
\r
    角标不内建（ADR-0018 决策 3「指令即终态」）：x-badge 已覆盖角标能力，使用者\r
    外挂组合（文档配方示例），组件不建双轨。\r
\r
    回退层显隐一律用 x-show（display 切换，勿用 x-if）：共享快照多实例场景下\r
    x-if 的延迟编译（假→真切换时才编译子树）会挂错 scope 链致跨实例 props 串台\r
    （engine 已知缺陷，记忆 templateScopeMap 串台），x-show 无编译期回避之。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——尺寸经主题通道 data-size 全跟随（头像以 em 标定，字号档变即\r
     整体缩放，无自有尺寸属性）；avatar 不在 data() 声明主题六键，内部变体属性亦\r
     禁用六个通道名 -->\r
<span\r
  class="asc-avatar"\r
  x-define="autospark.avatar"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",         // 图片地址（加载失败自动回退 icon/label 首字符）\r
            icon: "",        // 图标回退：内置图标名或 { name } 对象（x-icon 值通道；src 缺席或失败时生效）\r
            label: "",       // 字符回退源（首字符；兼职图片 alt）\r
            shape: "circle", // 形状：circle 圆（缺省）| square 方（圆角随 data-radius 档位）\r
            failed: false,   // 内部状态：图片加载失败标记（非 props；src 变化时重置重试）\r
            errorArmed: false, // 内部状态：@error 武装位（一跳后置 true，见 mounted——非 props）\r
        }),\r
        methods: {\r
            // 图片加载失败：置 failed 触发回退链切换（x-if 通道重建，img 移除）。\r
            // 武装位守卫：构造窗口内（scope.refresh 等机制重跑 :src 绑定 → 同值\r
            // setAttribute('src') → happy-dom **同步**派发 error）的伪 error 不接——\r
            // 真实浏览器网络失败恒在构造同步块之后（fetch 异步 + 任务队列），一跳后\r
            // 武装不丢真失败\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.failed = true;\r
            },\r
        },\r
        mounted() {\r
            // @error 一跳后武装：挂起一个宏任务置位（mounted 时化身子树可能未挂载，\r
            // 家族同款一跳；期间到达的 error 均为构造窗口伪 error——scope.refresh 等\r
            // 机制重跑 :src 绑定 → 同值 setAttribute('src') → happy-dom **同步**派发）\r
            setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            // src 变化：解除武装 + 重置 failed 重试新地址（回调收 { value } 信封对象——\r
            // 解构取值），一跳后对新地址重新武装。真实新值写入引发的伪 error（happy-dom\r
            // 对任何 src 写都同步派发）无论落在本回调前后：落在前 → 先置 failed 再被\r
            // 本重置清掉；落在后 → 未武装直接忽略——两序净效果一致。\r
            // 已见值比对幂等防御：scope.refresh 类无变化重跑（i18n ready 换血等）同值\r
            // 跳过，不解除武装、不误重置 failed（真实浏览器网络失败恒晚于构造同步块）\r
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
    /* 宿主：行内透明壳，字号基线经 data-size 档位全跟随（--auto-font-size，em 标定的缩放源） */\r
    .asc-avatar {\r
      display: inline-flex;\r
      font-size: var(--auto-font-size, var(--asc-avatar-font-size, 0.875rem));\r
      vertical-align: middle;\r
    }\r
\r
    /* ---------- 头像盒子：形状经 data-shape 命中 inner（编译子树内层） ---------- */\r
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
    /* square：方角——圆角走 --auto-border-radius（data-radius 档位通道在场即跟随） */\r
    .asc-avatar-inner[data-shape="square"] {\r
      border-radius: var(--auto-border-radius, var(--asc-avatar-radius, 0.375rem));\r
    }\r
\r
    /* 图片层：铺满盒子（形状裁切由盒子 overflow:hidden 承担） */\r
    .asc-avatar-img {\r
      width: 100%;\r
      height: 100%;\r
      object-fit: cover;\r
    }\r
    /* 图标回退层：约 60% 盒面（1.5em 相对字号，随档位缩放） */\r
    .asc-avatar-icon {\r
      display: inline-flex;\r
      font-size: 1.5em;\r
      line-height: 1;\r
    }\r
    /* 首字符回退层：正文字号微放大，字重加粗（对齐主题标题字重标尺） */\r
    .asc-avatar-char {\r
      font-size: 1.1em;\r
      font-weight: var(--x-font-weight-large, 600);\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-avatar-inner,\r
    [data-dark] .asc-avatar-inner {\r
      background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(255, 255, 255, 0.14)));\r
      color: var(--auto-secondary-color, var(--asc-avatar-color, rgba(255, 255, 255, 0.65)));\r
    }\r
  </style>\r
  <!-- 变体数据属性承载在 inner（编译子树内层元素）；回退链按三源优先级互斥渲染 -->\r
  <span class="asc-avatar-inner" :data-shape="shape">\r
    <!-- ① 图片：src 在场且未失败（失败经 @error 置 failed 切回退层） -->\r
    <img\r
      class="asc-avatar-img"\r
      x-show="src && !failed"\r
      :src="src"\r
      :alt="label"\r
      @error="onImgError()"\r
    />\r
    <!-- ② 图标回退：src 缺席或加载失败时生效（字符串图标名 / { name } 对象双形态，tag 同款） -->\r
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
    <!-- ③ 首字符回退：label 取首个码点（Array.from 防代理对截半） -->\r
    <span\r
      class="asc-avatar-char"\r
      x-show="(!src || failed) && !icon && label"\r
      x-text="Array.from(String(label).trim())[0]"\r
    ></span>\r
    <!-- ④ 三源皆空：内置 default 图标兜底（字面量须带引号——裸 default 会命中 data.default） -->\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && !icon && !label"\r
      x-icon="'default'"\r
    ></i>\r
  </span>\r
</span>\r
`,Ai=`autospark.avatar`;function ji(e){e.components[Ai]=ki}Mi();function Mi(){y(e=>{m(e),ji(e)})}var Ni=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——状态绑定（loaded/failed/fit/lazy/width/height）全部落在编译子树的\r
    内层 inner / img 元素上（card 同款范式，宿主为透明块壳）。\r
\r
    生命周期三态：src 在场未完成 → 加载态（内置 loading 图标 SMIL 自转，零 CSS 动画）；\r
    @load → loaded 置位摘转圈；@error → failed 置位切 fallback 占位（图标名或图片 URL\r
    双形态，URL 形态以协议/根斜杠/相对段开头判定）。src 变化时重置 loaded/failed\r
    重试新地址。lazy 走原生 loading=lazy（按简——IntersectionObserver 自实现不引入）；\r
    width/height 经绑定通道透传 img 原生属性（假值属性移除家族约定）。\r
\r
    三态层显隐一律用 x-show（display 切换，勿用 x-if）：共享快照多实例场景下\r
    x-if 的延迟编译（假→真切换时才编译子树）会挂错 scope 链致跨实例 props 串台\r
    （engine 已知缺陷，记忆 templateScopeMap 串台），x-show 无编译期回避之。\r
\r
    点击预览不做（P2 image-viewer 承接，ADR-0018 清单表边界）：点击原生冒泡，\r
    使用者自行挂 @click 接入预览层。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——加载态/占位字号随 data-size 档位缩放；image 不在 data() 声明\r
     主题六键，内部变体属性亦禁用六个通道名 -->\r
<div\r
  class="asc-image"\r
  x-define="autospark.image"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",             // 图片地址\r
            alt: "",             // 替代文本（兼 fallback 占位提示行）\r
            lazy: false,         // 懒加载（原生 loading=lazy）\r
            fit: "",             // object-fit：fill | contain | cover | none | scale-down（空=浏览器缺省）\r
            width: "",           // 宽透传（img 原生属性；空不写）\r
            height: "",          // 高透传（img 原生属性；空不写）\r
            fallback: "file-error", // 加载失败占位：内置图标名或图片 URL 双形态（URL 以 http(s)://、data:、//、/、./ 开头判定）\r
            loaded: false,       // 内部状态：@load 置位（摘加载态；非 props）\r
            failed: false,       // 内部状态：@error 置位（切 fallback；非 props）\r
            errorArmed: false,   // 内部状态：@error 武装位（一跳后置 true，见 mounted——非 props）\r
        }),\r
        methods: {\r
            // 图片加载成功：摘加载态（failed 同步复位防陈旧标记）\r
            onImgLoad() {\r
                this.data.loaded = true;\r
                this.data.failed = false;\r
            },\r
            // 图片加载失败：切 fallback 占位（x-if 通道重建，主图移除）。\r
            // 武装位守卫（avatar 同款）：构造窗口内（scope.refresh 等机制重跑 :src 绑定 →\r
            // 同值 setAttribute('src') → happy-dom **同步**派发 error）的伪 error 不接——\r
            // 真实浏览器网络失败恒在构造同步块之后，一跳后武装不丢真失败\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.loaded = false;\r
                this.data.failed = true;\r
            },\r
        },\r
        mounted() {\r
            // @error 一跳后武装：挂起一个宏任务置位（mounted 时化身子树可能未挂载，\r
            // 家族同款一跳；期间到达的 error 均为构造窗口伪 error）\r
            setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            // src 变化：解除武装 + 重置 loaded/failed 重试新地址（回调收 { value } 信封\r
            // 对象——解构取值），一跳后对新地址重新武装——新值写入引发的伪 error 无论\r
            // 落在本回调前后净效果一致（avatar 同款两序分析）。\r
            // 已见值比对幂等防御：scope.refresh 类无变化重跑（i18n ready 换血等）同值\r
            // 跳过，不解除武装、不误重置已置位的三态\r
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
    /* 宿主：块级满宽透明壳，字号基线经 data-size 档位跟随（加载态/占位以 em 标定缩放） */\r
    .asc-image {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-image-font-size, 0.875rem));\r
    }\r
\r
    /* ---------- inner：图片盒子（状态数据属性直接命中，编译子树内层） ---------- */\r
    .asc-image-inner {\r
      position: relative;\r
      display: block;\r
      width: 100%;\r
      overflow: hidden;\r
      border-radius: var(--auto-border-radius, var(--asc-image-radius, 0.375rem));\r
      background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(0, 0, 0, 0.04)));\r
      /* 无宽高声明时给最小占位防塌陷（宽高透传时 img 原生属性决定盒子尺寸） */\r
      min-height: 1em;\r
    }\r
    /* 主图：铺满盒子 */\r
    .asc-image-img {\r
      display: block;\r
      width: 100%;\r
      height: 100%;\r
    }\r
    /* fit 五档：data-fit 属性选择器（空值属性移除即浏览器缺省 fill） */\r
    .asc-image-img[data-fit="fill"] { object-fit: fill; }\r
    .asc-image-img[data-fit="contain"] { object-fit: contain; }\r
    .asc-image-img[data-fit="cover"] { object-fit: cover; }\r
    .asc-image-img[data-fit="none"] { object-fit: none; }\r
    .asc-image-img[data-fit="scale-down"] { object-fit: scale-down; }\r
\r
    /* 加载态：居中转圈（内置 loading 图标 SMIL 自转，容器居中；随字号档位缩放） */\r
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
    /* fallback 占位：纵列居中（占位图/图标 + alt 提示行） */\r
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
    /* alt 提示行：次要文字色（空 alt 不占位——:empty 家族纪律） */\r
    .asc-image-fallback-text {\r
      font-size: 0.875em;\r
      color: var(--auto-secondary-color, var(--asc-image-fallback-hint-color, rgba(0, 0, 0, 0.55)));\r
    }\r
    .asc-image-fallback-text:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 状态数据属性承载在 inner（编译子树内层元素）；width/height/loading 经绑定通道透传 img -->\r
  <div class="asc-image-inner">\r
    <!-- 主图：src 在场即渲染（failed 经 @error 置位移除；真加载态由浏览器事件驱动） -->\r
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
    <!-- 加载态：src 在场未完成未失败（loaded 经 @load 置位移除；图标 SMIL 自转零 CSS 动画） -->\r
    <i\r
      class="asc-image-spinner"\r
      x-show="src && !loaded && !failed"\r
      x-icon="'loading'"\r
    ></i>\r
    <!-- fallback 占位：src 缺席（结构占位）或加载失败时渲染；URL 形态判定 = 根斜杠 /\r
             ./ ../ 相对段 / 通用协议前缀（正则内禁斜杠——指令值清洗会破坏 \\/ 转义，\r
             协议段 [a-z][a-z0-9+.-]*: 无斜杠安全） -->\r
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
      <!-- alt 提示行（紧凑书写——:empty 判定纪律） -->\r
      <span class="asc-image-fallback-text" x-text="alt"></span>\r
    </div>\r
  </div>\r
</div>\r
`,Pi=`autospark.image`;function Fi(e){e.components[Pi]=Ni}Ii();function Ii(){y(e=>{m(e),Fi(e)})}var Li=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——变体绑定（bordered/split/virtual）与 loading 组合全部落在编译子树的\r
    内层 inner 元素上（card 同款范式，宿主为透明块壳）。\r
\r
    内部装配（ADR-0018 决策 2「内部装配、对外开箱」）：\r
    - x-for（引擎）：items 渲染——行模板 = row 插槽出口（作用域插槽：出口值\r
      \`{ name, params }\` 动态名对象形态，params \`{ item, $index }\` 在项 localData\r
      作用域求值，调用方经 \`<template x-slot:row="{ item, $index }">\` 解构消费；\r
      无插槽时 fallback 行做 label/title/name/value 四键探测 + 标量兜底）；\r
    - x-empty（引擎结构标记）：空数组的 special 空态——empty 插槽可整体重载，\r
      fallback 组合 autospark.empty 组件（其 description 走 i18n「暂无数据」通道）；\r
    - x-loading（引擎运行时指令）：loading props 经绑定通道写字面量值（"true"/"false"\r
      三态），覆盖层铺满 inner；裸属性值变化触发 attrChanged（无修饰符）；\r
    - x-for.virtual（features/virtual 插件）：virtual=true 经 x-if 结构分叉启用\r
      （x-for 编译期选项无法响应 props，分叉是静态模板的响应式接线形态）；\r
      行定高假设由 CSS 行高保证（等高行，策略首项实测项高）。\r
\r
    出口声明形态（重要）：virtual 分叉与普通分叉各持一份 row/empty 出口（分叉结构\r
    所需），而快照收集期的同名出口静态去重会剥除后者标记（ADR-0056「重复声明后者\r
    忽略」）——故两份出口统一走**动态名对象形态** \`x-slot="{ name, params }"\`\r
    （ADR-0107）：动态名出口不入静态清单、不参与同名去重，运行期仅活跃分叉（x-if\r
    剪枝后）实例化投影，双分叉共享调用方同一份内容段（静态克隆段可多次消费）。\r
\r
    items 变更通道：props 为调用方状态**引用**注入——整体替换（state.xx = [...]）\r
    驱动重渲；调用方对原数组的**原地**增删（push/splice）经全局路径发信号、不经\r
    组件域（autostore 路径驱动响应式的跨域边界），不触发重渲（文档披露）。\r
\r
    事件出口：行内交互经行元素原生冒泡（插槽内容在调用方作用域编译，@click 等\r
    直接写在行模板内容上）——组件零内建事件。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——字号/内距随 data-size 档位缩放（em 基准）；list 不在 data()\r
     声明主题六键，内部变体属性亦禁用六个通道名 -->\r
<div\r
  class="asc-list"\r
  x-define="autospark.list"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],      // 数据源：数组（状态引用注入——字面量数组触发 props 更新死循环，ADR-0019 后果 2）\r
            virtual: false, // 虚拟滚动（x-for.virtual 组合；须同页引入 autospark.virtual.js，缺位退化全量渲染）\r
            loading: false, // 加载态（引擎 x-loading 覆盖层组合，铺满列表）\r
            bordered: true, // 边框开关（false 转透明色，盒模型占位稳定不跳变）\r
            split: true,    // 行间分隔线（相邻行 border-top；末行/首行无线）\r
        }),\r
    }\r
  <\/script>\r
  <style global id="autospark-components-list">\r
    /* 宿主：块级满宽透明壳，字号基线经 data-size 档位全跟随（行内距/行高以 em 标定缩放） */\r
    .asc-list {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-list-font-size, 0.875rem));\r
    }\r
\r
    /* ---------- 列表盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */\r
    .asc-list-inner {\r
      --asc-line: var(--auto-border-color, var(--asc-list-border-color, #d9d9d9));\r
      position: relative; /* x-loading 覆盖层定位基准 */\r
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
    /* 默认行文本：单行省略（对象字段探测值可能长；自定义行插槽不受此约束） */\r
    .asc-list-item-text {\r
      display: block;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-color, var(--asc-list-color, #606060));\r
    }\r
\r
    /* ---------- 虚拟滚动：定高滚动容器（x-for 容器即滚动宿主，策略监听其 scrollTop） ---------- */\r
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
    /* ---------- 空态段（x-empty special 渲染位） ---------- */\r
    .asc-list-empty {\r
      padding: 1.2em 1em;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 变体数据属性 + loading 组合承载在 inner（编译子树内层元素）；\r
         loading 三态字面量（"true"/"false"）——裸 x-loading 值变化触发 attrChanged，\r
         假态显式 "false" 而非移除（增删触发 mounted/unmounted 通道同样有效，取值态\r
         让覆盖层重建路径统一走 attrChanged） -->\r
  <div\r
    class="asc-list-inner"\r
    :data-borderless="!bordered"\r
    :data-split="split"\r
    :data-virtual="virtual"\r
    :x-loading="loading ? 'true' : 'false'"\r
  >\r
    <!-- 虚拟滚动分叉：virtual=true（x-for 的 virtual 是编译期选项，props 响应式经\r
             x-if 结构分叉接线；未加载 virtual 插件时策略缺位 warn 退化全量渲染） -->\r
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
    <!-- 普通分叉：virtual=false（缺省） -->\r
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
`,Ri=`autospark.list`;function zi(e){e.components[Ri]=Li}Bi();function Bi(){y(e=>{m(e),zi(e)})}var Vi=`<!--
    autospark.descriptions 描述列表（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行）：
    键值对网格展示——内部装配引擎 x-for 渲染 items（{ label, value, span? }[]），
    span 经克隆体 :style 内联下发 grid-column: span N（跨列位）。

    两形态（mounted 统一收敛到 items 数据面渲染，breadcrumb 同款）：
    - items 状态引用注入：<div x-component:autospark.descriptions="{ items: rows }">——
      引擎对值对象内的字面量数组 props 存在 _propsEqual 引用比较死环缺陷（P0 固化
      规避清单第 1 条），items 恒走状态引用；
    - 子元素声明（静态描述）：<x-descriptions-item label span> 由 index.ts 的
      precompile 变换折叠为 items JSON 落 data-* 通道（字符串标量），mounted 解析
      写组件 data → x-for 响应渲染。

    布局通道（columns / layout / bordered 经 JS 通道同步到 body 容器）：x-for 容器
    宿主的 :attr/@event 绑定不被编译（ownsChildren 静默失效，:key 例外）——列数网格
    模板与变体数据属性由 mounted + watch 写入（divider/space 同款 JS 通道范式）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——本组件无宿主级变体外观，绑定全落在编译子树内层。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号/内距档位经主题通道全跟随；descriptions 不在 data() 声明
     主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-descriptions"
  x-define="autospark.descriptions"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],        // 描述项 { label, value, span? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底
            columns: 3,       // 每行列数（项位；span 跨项位）——经 JS 通道写 body 的 grid-template-columns
            bordered: false,  // 边框表格形态（gap 1px 间隙显线 + label 格灰底；缺省简洁形态）
            title: "",        // 标题（空时整段不占位）
            layout: "horizontal", // 标签排布：horizontal 缺省（label: value 横排）| vertical（标签在上）
        }),
        methods: {
            // 布局同步：columns 网格模板 + layout/bordered 变体数据属性写 body 容器
            //（x-for 宿主绑定不编译，JS 通道是唯一稳定通道）
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
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应）；props 在场恒优先
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

    /* ---------- 标题：空值不占位（:empty 判定纪律——出口内容紧凑书写） ---------- */
    .asc-descriptions-head {
      margin-bottom: 0.75em;
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */
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
    /* 简洁 horizontal：label 后中文冒号引导 */
    .asc-descriptions-body[data-bordered="false"][data-layout="horizontal"] .asc-descriptions-label::after {
      content: "：";
    }
    /* vertical：标签在上（简洁与 bordered 双形态共用） */
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
      overflow-wrap: anywhere; /* 长值换行（URL/串号类值防撑破网格） */
      color: var(--auto-color, var(--asc-descriptions-value-color, #606060));
    }

    /* ---------- bordered 表格形态：gap 1px 间隙显线 + 外框收口 + label 格灰底 ---------- */
    .asc-descriptions-body[data-bordered="true"] {
      --asc-line: var(--auto-border-color, var(--asc-descriptions-border-color, #d9d9d9));
      gap: 1px;
      background: var(--asc-line);
      border: var(--auto-border-size, var(--asc-descriptions-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-descriptions-radius, 0.5rem));
      overflow: hidden; /* 圆角裁切格线 */
      row-gap: 1px;
    }
    /* 项 = label 格 + value 格（grid 两列；vertical 单列两行） */
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
    /* 格子：内距落格子自身（label 灰底铺满其格；外层 gap 即格线宽） */
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-value {
      padding: 0.55em 1em;
      align-self: stretch;
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label {
      background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #fafafa));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 标题出口（空值 :empty 不占位）；项模板 = x-for 克隆体（li 形态的 div）：
         span 跨项位经 :style 内联（grid-column: span N，缺省 1）——克隆体内绑定可求值 -->
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
`,Hi=`autospark.descriptions`;function Ui(e){e.components[Hi]=Vi,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-descriptions`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-descriptions-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={label:e.getAttribute(`label`)??``,value:(e.textContent??``).trim()},n=e.getAttribute(`span`);return n!=null&&n!==``&&(t.span=$(n)),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${Hi}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Wi();function Wi(){y(e=>{m(e),Ui(e)})}var Gi=`<!--
    autospark.timeline 时间线（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行）：
    内部装配引擎 x-for 渲染 items（{ content, time?, icon?, type?, hollow? }[]）——
    每项 = 轴线段（tail，末项隐藏）+ 节点（head：语义色圆点 / 空心 / 自定义图标）+
    内容区（time 弱化行 + content 正文行）。

    两形态（mounted 统一收敛到 items 数据面渲染，breadcrumb 同款）：
    - items 状态引用注入：<div x-component:autospark.timeline="{ items: steps }">——
      引擎对值对象内的字面量数组 props 存在 _propsEqual 引用比较死环缺陷（P0 固化
      规避清单第 1 条），items 恒走状态引用；
    - 子元素声明（静态时间线）：<x-timeline-item time icon type hollow> 由 index.ts
      的 precompile 变换折叠为 items JSON 落 data-* 通道（字符串标量），mounted
      解析写组件 data → x-for 响应渲染。

    mode（标签侧，左/交错/右三形态）经 JS 通道同步到 body 容器 data-mode——x-for
    容器宿主的 :attr/@event 绑定不被编译（ownsChildren 静默失效，:key 例外）；
    alternate 交错经 nth-child 奇偶纯 CSS 分流，right 为 left 的镜像。

    克隆体纪律（P0 固化规避清单第 4 条）：x-for 克隆体内条件显隐一律 x-show
    （共享快照多实例 + items 晚注入下 x-if 延迟编译会挂错 scope 链）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——本组件无宿主级变体外观，绑定全落在编译子树内层（克隆体自身即内层）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随（间距以 em 标定自动缩放）；timeline
     不在 data() 声明主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-timeline"
  x-define="autospark.timeline"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],   // 时间线项 { content, time?, icon?, type?, hollow? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底
            mode: "left", // 标签侧：left 缺省（内容在轴右）| alternate（奇偶交错）| right（内容在轴左）
        }),
        methods: {
            // 模式同步：data-mode 写 body 容器（x-for 宿主绑定不编译，JS 通道是唯一稳定通道）
            syncMode() {
                const body = this.el.querySelector(".asc-timeline-body");
                if (!body) return;
                const m = this.data.mode;
                body.setAttribute("data-mode", m === "alternate" || m === "right" ? m : "left");
            },
        },
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应）；props 在场恒优先
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

    /* ---------- 项：轴线段 + 节点 + 内容区（left 缺省——内容在轴右） ---------- */
    .asc-timeline-item {
      position: relative;
      padding: 0 0 1.4em 1.9em; /* 左侧留节点/轴线空间；底部段距衔接轴线 */
      min-height: 1em;
    }
    /* 轴线段：贯穿到下一项（负 bottom 衔接段距）；末项隐藏（时间线终止） */
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

    /* ---------- 节点圆点：--asc-dot 语义色中转（tag 同款范式）；hollow 空心 / icon 自定义 ---------- */
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
    /* 语义色轴（type）：default 中性档取边框灰 */
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
    /* 空心节点：面板底 + 语义色描边 */
    .asc-timeline-item-head[data-hollow="true"] {
      background: var(--auto-bgcolor, var(--asc-timeline-dot-bg, #ffffff));
      border: 2px solid var(--asc-dot);
    }
    /* 自定义节点（icon）：图标替代圆点（尺寸随字号，色随语义色中转） */
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

    /* ---------- 内容区：time 弱化行 + content 正文行 ---------- */
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

    /* ---------- alternate 交错：轴居中，奇偶内容分侧 ---------- */
    .asc-timeline-body[data-mode="alternate"] .asc-timeline-item {
      padding: 0 2.2em 1.4em 50%; /* 奇数项：内容在轴右 */
    }
    .asc-timeline-body[data-mode="alternate"] .asc-timeline-item:nth-child(even) {
      padding: 0 50% 1.4em 2.2em; /* 偶数项：内容在轴左（右对齐） */
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

    /* ---------- right 右侧：left 的镜像（内容在轴左，右对齐） ---------- */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 项模板 = x-for 克隆体（ul 容器不克隆，li 为克隆模板）：克隆体内条件显隐一律
         x-show（x-if 串台缺陷规避）；节点变体绑定（type/hollow/icon）在克隆体 head
         上可求值；mode 由 mounted + watch 写 body 容器 data-mode（容器宿主绑定不编译） -->
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
`,Ki=`autospark.timeline`;function qi(e){e.components[Ki]=Gi,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-timeline`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-timeline-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={content:(e.textContent??``).trim()};for(let n of[`time`,`icon`,`type`]){let r=e.getAttribute(n);r!=null&&r!==``&&(t[n]=r)}let n=e.getAttribute(`hollow`);return n!=null&&n!==``&&(t.hollow=$(n)),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${Ki}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ji();function Ji(){y(e=>{m(e),qi(e)})}var Yi=`<!--
    autospark.statistic 统计数值（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行）：
    title（标题）+ value（数值区：prefix 前缀 + 格式化数值 + suffix 后缀）。

    格式化通道（mounted + watch JS 直写）：value 为 number 且有限时经
    Intl.NumberFormat 按语言环境格式化（precision 修约 / grouping 千分位 /
    groupSeparator 自定义分组符替换）；string 原样直出；null/undefined 渲染空。
    绑定表达式不含组件 methods（引擎求值域边界），数值文本经 methods 格式化后
    span 直写（button label 同款纪律）。

    语言环境联动：locale 取全局状态 \`$.language\`（i18n 插件在场时的当前语言）——
    组件封闭域的 parentView 即全局 state（ADR-0053），watch 表达式 \`$ && $.language\`
    经聚合视图求值并收集依赖（\`$\` 容器缺席时短路安全），语言切换即时重算；
    未装 i18n / 未设置时回退 zh 缺省（依赖松弛不强制，ADR-0018 决策 6 精神）。

    倒计时形态不做——countdown 独立件 P4（边界声明，见合批 ADR）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——本组件无宿主级变体外观，数值文本/样式全经 JS 通道直写内层元素。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——数值区字号以 em 标定（1.5em），随 data-size 档位全跟随；
     statistic 不在 data() 声明主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-statistic"
  x-define="autospark.statistic"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: 0,         // 数值：number 经 Intl 格式化 | string 原样直出
            precision: null,  // 小数位数（>=0 整数时修约；null/负数/非整数忽略——保留原精度）
            grouping: true,   // 千分位开关（false 时 useGrouping:false 纯数字串）
            groupSeparator: "", // 自定义分组符（空 = 按语言环境缺省符；非空时替换 Intl 分组符，如 "_" / " "）
            prefix: "",       // 前缀文本（prefix 槽可重载；如货币符号 "¥"）
            suffix: "",       // 后缀文本（suffix 槽可重载；如单位 "个"）
            title: "",        // 标题（title 槽可重载；空时整行不占位）
            valueStyle: null, // 数值区内联样式对象（{ color: "red", fontWeight: 600 }；状态引用注入——字面量对象 props 死环规避）
        }),
        methods: {
            // 当前语言：i18n 在场取 $.language（BCP 47 语言码即 Intl locale），缺席回退 zh
            currentLanguage() {
                const g = this.globalState;
                return (g && g.$ && g.$.language) || "zh";
            },
            // 数值格式化：number → Intl.NumberFormat(locale)；string 原样直出
            formatValue() {
                const v = this.data.value;
                if (typeof v === "number" && isFinite(v)) {
                    const opts = { useGrouping: !!this.data.grouping };
                    // null（缺省）与非数字/负数/非整数忽略——保留 locale 缺省精度
                    //（注意 Number(null) === 0，须先判空再转数）
                    const p = this.data.precision == null ? NaN : Number(this.data.precision);
                    if (isFinite(p) && p >= 0 && Math.floor(p) === p) {
                        opts.minimumFractionDigits = p;
                        opts.maximumFractionDigits = p;
                    }
                    let nf;
                    try { nf = new Intl.NumberFormat(this.currentLanguage(), opts); }
                    catch { nf = new Intl.NumberFormat("zh", opts); } // 非法语言码兜底
                    let text = nf.format(v);
                    const sep = this.data.groupSeparator;
                    if (sep) {
                        // 自定义分组符：按 locale 实际分组符全量替换（formatToParts 定位）
                        const groupPart = nf.formatToParts(v).find((x) => x.type === "group");
                        if (groupPart) text = text.split(groupPart.value).join(sep);
                    }
                    return text;
                }
                return v == null ? "" : String(v);
            },
            // 数值文本直写（幂等：重算 + 覆写，watcher 同值重跑安全——i18n refresh 防污染加固）
            syncValue() {
                const el = this.el.querySelector(".asc-statistic-value-text");
                if (el) el.textContent = this.formatValue();
            },
            // 数值区样式应用：valueStyle 对象展开为内联样式（先清后写，幂等）；
            // 自定义属性 --x 走 setProperty（Chromium style["--x"]=v 赋值静默失效的规避）
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
            // 语言联动：\`$ && $.language\` 短路安全（$ 容器缺席时求值 undefined 不抛错），
            // 经聚合视图收集 $.language 依赖——i18n 语言切换即时重算（未装则恒不触发）
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
    /* 标题：次要色弱化引导；空值不占位（:empty 判定纪律——出口内容紧凑书写） */
    .asc-statistic-title {
      color: var(--auto-secondary-color, var(--asc-statistic-title-color, rgba(0, 0, 0, 0.55)));
    }
    .asc-statistic-title:empty {
      display: none;
    }
    /* 数值区：大号字重数值（em 标定随 data-size 档位缩放）+ 等宽数字（数值对齐惯例） */
    .asc-statistic-value {
      display: inline-flex;
      align-items: baseline;
      gap: 0.15em;
      font-size: 1.5em;
      font-weight: var(--x-font-weight-large, 600); /* 语义层无大号字重变量，直取基础标尺 */
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
      color: var(--auto-color, var(--asc-statistic-value-color, #303030));
    }
    /* 前后缀：随数值缩放略小一号；空值不占位（gap 消除） */
    .asc-statistic-prefix,
    .asc-statistic-suffix {
      font-size: 0.667em; /* 相对 1.5em 数值区 = 宿主基准字号 */
    }
    .asc-statistic-prefix:empty,
    .asc-statistic-suffix:empty {
      display: none;
    }
    .asc-statistic-value-text {
      min-width: 0;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-statistic-title,
    [data-dark] .asc-statistic-title {
      color: var(--auto-secondary-color, var(--asc-statistic-title-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-statistic-value,
    [data-dark] .asc-statistic-value {
      color: var(--auto-color, var(--asc-statistic-value-color, #fafafa));
    }
  </style>
  <!-- 标题/前后缀出口（槽优先，props 兜底——紧凑书写，:empty 判定纪律）；
         数值文本由 mounted + watch JS 直写（绑定表达式不含 methods 的引擎边界规避） -->
  <div class="asc-statistic-inner">
    <div class="asc-statistic-title" x-slot:title>{{ title }}</div>
    <div class="asc-statistic-value">
      <span class="asc-statistic-prefix" x-slot:prefix>{{ prefix }}</span>
      <span class="asc-statistic-value-text"></span>
      <span class="asc-statistic-suffix" x-slot:suffix>{{ suffix }}</span>
    </div>
  </div>
</div>
`,Xi=`autospark.statistic`;function Zi(e){e.components[Xi]=Yi}Qi();function Qi(){y(e=>{m(e),Zi(e)})}var $i=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——全屏层及其内部绑定全部落在编译子树的内层 layer 元素上，宿主为透明块壳。

    形态裁定（自建 fixed 全屏层，不组合 x-dialog）：image-viewer 是全屏暗色遮罩语境的
    查看器而非居中对话框——x-dialog 壳的复用面（chrome/header/footer/padding/边框/
    阴影/居中面板）几乎全数需要反向覆盖，组合成本高于收益；且组合将引入跨插件产物
    依赖（按需加载须同页 autospark.overlay.js）。ESC / 遮罩点击关闭自实现（各约数行），
    本件零跨插件产物依赖（工具栏为自绘图标钮，不组合 autospark.button）。

    受控语义：visible / index 均为受控 props——内部动作（切换/键盘）写组件 data 并
    广播事件，由调用方回写状态闭环：
    - change：detail = { index }（前后翻页/键盘左右切换；外层 @change 一行回写）
    - close：detail 空（ESC / 关闭钮 / 遮罩点击请求关闭；调用方回写 visible=false，
      不监听则保持打开——受控不自行其是）
    自建层渲染在 engine 宿主树内（非 teleport），事件沿 DOM 树冒泡，外层 @close /
      @change 可直接收到（区别于渲染进 body 容器的 overlay 家族物理边界）。
    已知边界：宿主祖先链上有 transform/filter 时 fixed 层会相对该祖先定位（CSS 含有块
    规则）——避免在变换容器内实例化（文档披露）。

    缩放/旋转为内部状态（scale 步进 0.2 夹取 [0.2, 8]，rotate 步进 90°）：切图或打开
    时重置 1:1（watch 同值幂等守卫——防无关 refresh 污染，ADR-0021 规避清单第 9 条）；
    相邻图经 new Image() 预加载（切页零等待）。

    全屏恒暗色声明：遮罩/工具栏/计数器为图上浮层的恒暗设计（全屏预览国际惯例，不随
    主题明暗切换，ADR-0129 暗色兜底变体不适用——无明色态即无切换）；覆盖通道
    --asc-image-viewer-*（mask / btn-bg / btn-color / counter-bg / z …）。

    图标：工具栏/翻页钮自绘内联 SVG（stroke currentColor；引擎内置图标集无缩放/旋转
    图形，SVG 子树不挂指令属性——静态 SVG 仅作结构，规避「SVG 内指令不编译」边界）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——计数器/工具栏字号随 data-size 档位缩放（em 基准）；本件不在
     data() 声明主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-image-viewer"
  x-define="autospark.image-viewer"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            images: [],     // 图片 url 数组（状态引用注入——字面量数组触发 props 更新死循环，ADR-0021 规避 5）
            visible: false, // 受控显隐（true 打开全屏层；关闭经 close 事件由调用方回写）
            index: 0,       // 受控当前图（props 单向驱动 + 内部切换写 data 广播 change）
            scale: 1,       // 内部状态：缩放倍率（步进 0.2，夹取 [0.2, 8]；切图/打开重置 1）
            rotate: 0,      // 内部状态：旋转角度（步进 90°；切图/打开重置 0）
        }),
        methods: {
            // 上一张（首页不动作；disabled 绑定兜底 + 键盘通道共用）：
            // 写 data.index（watch 通道统一重置视图）+ change 广播
            onPrev() {
                if (this.data.index <= 0) return;
                this.data.index = this.data.index - 1;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: this.data.index } }));
            },
            // 下一张（末页不动作）
            onNext() {
                if (this.data.index >= this.data.images.length - 1) return;
                this.data.index = this.data.index + 1;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: this.data.index } }));
            },
            // 缩放（delta 正负步进；夹取 [0.2, 8] 防退化与爆表）
            onZoom(delta) {
                const next = Math.min(8, Math.max(0.2, Number(this.data.scale) + delta));
                if (next === this.data.scale) return;
                this.data.scale = next;
            },
            // 旋转（delta 正负 90 步进）
            onRotate(delta) {
                this.data.rotate = Number(this.data.rotate) + delta;
            },
            // 重置视图（1:1 / 0°）
            onReset() {
                this.data.scale = 1;
                this.data.rotate = 0;
            },
            // 请求关闭（ESC / 关闭钮 / 遮罩点击）：close 广播，由调用方回写 visible=false
            onRequestClose() {
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
            // 键盘路由（document 级监听转发——仅 visible 响应）：
            // 左右切换 / ESC 关 / +与=放大 / -缩小
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
            // 相邻图预加载（当前页 ±1 经 new Image 预热，切页零等待）
            const preload = (i) => {
                const url = (this.data.images || [])[i];
                if (typeof url === "string" && url !== "") { const img = new Image(); img.src = url; }
            };
            const preloadNeighbors = () => { preload(this.data.index - 1); preload(this.data.index + 1); };
            preloadNeighbors();

            // 切图重置视图：同值幂等守卫（props 重注入/无关 refresh 同值重跑不重置——
            // ADR-0021 规避清单第 9 条）；重置后预热新相邻图
            let lastIndex = this.data.index;
            this.watch("index", ({ value: v }) => {
                if (v === lastIndex) return;
                lastIndex = v;
                this.data.scale = 1;
                this.data.rotate = 0;
                preloadNeighbors();
            });

            // 打开重置视图：仅 false→true 边沿（同值重跑幂等——无关 refresh 污染不
            // 清用户已缩放视图，ADR-0021 规避清单第 9 条）
            let wasOpen = !!this.data.visible;
            this.watch("visible", ({ value }) => {
                const open = value === true;
                if (open && !wasOpen) this.onReset();
                wasOpen = open;
            });

            // 键盘监听挂 document（全屏语境 Esc/左右全局响应）；清理器落宿主 expando，
            // unmounted 摘除（grid 断点监听同款纪律）
            const onDocKey = (e) => this.onKeydown(e);
            document.addEventListener("keydown", onDocKey);
            this.el["_ascImageViewerCleanup"] = () => document.removeEventListener("keydown", onDocKey);
        },
        unmounted() {
            // document 级监听摘除（长命对象，防泄漏；宿主可能已拆——可选链静默通过）
            this.el?.["_ascImageViewerCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-image-viewer">
    /* 宿主：透明块壳（全屏层在内层），字号基线经 data-size 档位跟随（计数器以 em 标定） */
    .asc-image-viewer {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-image-viewer-font-size, 0.875rem));
    }

    /* ---------- 全屏层：fixed 遮罩语境（恒暗色设计声明，见文件头注释） ---------- */
    .asc-image-viewer-layer {
      position: fixed;
      inset: 0;
      z-index: var(--asc-image-viewer-z, 1000);
      animation: asc-image-viewer-in 0.18s ease; /* display 显现即重播淡入 */
    }
    @keyframes asc-image-viewer-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    /* 遮罩：点击请求关闭（@click 在场） */
    .asc-image-viewer-mask {
      position: absolute;
      inset: 0;
      background: var(--asc-image-viewer-mask, rgba(0, 0, 0, 0.72));
    }
    /* 画布：图片居中区（transform 之外的留白由 max-width/max-height 让出） */
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

    /* ---------- 控件基座：半透明深底反白钮（图上浮层恒定设计，非主题映射） ---------- */
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

    /* 工具栏：右上（放大/缩小/左旋/右旋/重置/关闭） */
    .asc-image-viewer-toolbar {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.375rem;
      z-index: 2;
    }
    /* 翻页钮：左右中部大钮（圆形） */
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
    /* 计数器：底部中央（当前页/总数） */
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

    /* ---------- 动效可访问性：reduced-motion 停播（淡入与 transform 过渡） ---------- */
    @media (prefers-reduced-motion: reduce) {
      .asc-image-viewer-layer { animation: none; }
      .asc-image-viewer-img { transition: none; }
      .asc-image-viewer-btn { transition: none; }
    }
  </style>
  <!-- 全屏层：visible 受控显隐（x-show 切 display——display:none↔block 切换天然重播
         淡入 animation）；images 空时不亮相（空黑屏无意义） -->
  <div
    class="asc-image-viewer-layer"
    role="dialog"
    aria-modal="true"
    aria-label="图片预览"
    x-show="visible && images.length > 0"
  >
    <!-- 遮罩：点击请求关闭 -->
    <div class="asc-image-viewer-mask" @click="onRequestClose()"></div>
    <!-- 主图：scale/rotate 经 :style 内联（字符串 cssText 整体替换）；max 尺寸为
             翻页钮/工具栏让位 -->
    <div class="asc-image-viewer-canvas">
      <img
        class="asc-image-viewer-img"
        :src="images[index] || ''"
        alt=""
        draggable="false"
        :style="'transform: scale(' + scale + ') rotate(' + rotate + 'deg)'"
      />
    </div>
    <!-- 工具栏：缩小/放大/左旋/右旋/重置/关闭（自绘 SVG，stroke currentColor） -->
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
    <!-- 翻页钮：首页/末页 disabled（clamp 语义）；单图场景整体隐藏 -->
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
    <!-- 计数器：当前页 / 总数（紧凑书写） --><div class="asc-image-viewer-counter" x-text="(index + 1) + ' / ' + images.length"></div>
  </div>
</div>
`,ea=`autospark.image-viewer`;function ta(e){e.components[ea]=$i}na();function na(){y(e=>{m(e),ta(e)})}var ra=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——形态/指示器绑定（:data-effect / :data-indicator）落在编译子树的内层
    body 上，宿主为透明块壳。

    实现取舍（scroll-snap 真滚动 vs transform 位移）：scroll 档走 CSS scroll-snap
    （原生滚动/触摸惯性免费；切换经 track.scrollTo 驱动——程序滚动的 smooth 中间态
    以 settleTarget 旗吞掉（到达目标页即收旗），用户拖动实时反推同步）；fade 档纯
    CSS 叠放透明度切换（stage 定高 --asc-carousel-height，缺省 16rem——绝对叠放项
    不撑高容器，定高是 fade 档的结构前提，文档披露）。两档共用同一切换通道
    （goTo：写 data.index + change 广播 + scroll 档 applyScroll）。

    x-for 容器宿主纪律：track / dots 为 x-for 容器（宿主上动态绑定不编译——记忆
    xfor-host-bindings），项级绑定（:data-active / :src / x-show / @click）全部落在
    克隆体内；克隆体内条件显隐一律 x-show（共享快照多实例 + items 晚注入下 x-if
    延迟编译挂错 scope 链，ADR-0021 规避清单第 3 条）。键盘监听挂 stage（非 x-for
    宿主，tabindex=0 焦点域——focus 后左右翻页）。

    items 双形态：状态引用注入（items props——字面量数组触发 props 更新死循环，
    ADR-0021 规避清单第 5 条；调用方对原数组的原地变异不发信号，变更须整体替换）
    或子元素声明（<x-carousel-item>，index.ts precompile 折叠为 data-items JSON，
    mounted 解析写 data；props 在场恒优先）。项形态：string（图片 url）|
    { src?, alt?, caption?, html? }（src 图片幻灯 / html 内容幻灯 / caption 底部
    说明条——绑定表达式内联（绑定通道不含组件方法，方法仅事件通道），克隆体内
    item 四键探测与 list 默认行同款纪律）。

    事件出口：change（detail = { index }，切换广播——箭头/指示点/键盘/autoplay/
    用户拖动殊途同归）；el.value 劫持桥（读当前页 / 写 goTo）。

    autoplay：间隔毫秒（0 关）；prefers-reduced-motion 停播（reduce 用户不被自动
    动效打扰——CSS 过渡同步停播）；非循环末页自然停播。

    图上浮层（箭头/指示点/说明条）：半透明深底反白的恒定设计（同 image-viewer 恒暗
    语义——浮在任意图片明暗之上均成立，不随主题明暗切换）；容器级样式（背景/圆角/
    内容文字色）走主题变量链 + 暗色兜底（ADR-0129）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——说明条/内容文字随 data-size 档位缩放（em 基准）；本件不在
     data() 声明主题六键，内部变体属性（effect/indicator）亦禁用六个通道名 -->
<div
  class="asc-carousel"
  x-define="autospark.carousel"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],          // 幻灯项：string（图片 url）| { src?, alt?, caption?, html? }——状态引用注入；声明形态经 data-items 通道
            autoplay: 0,        // 自动播放间隔毫秒（0 关；prefers-reduced-motion 停播；非循环末页停播）
            loop: false,        // 循环（末页 next 回首页；false 首末页箭头 disabled）
            indicator: "bottom", // 指示器位置："top" | "bottom" | false（关）
            arrows: true,       // 前后箭头开关（图上浮层，悬停显影——触屏恒显）
            effect: "scroll",   // 切换效果：scroll 真滚动（scroll-snap）| fade 淡入淡出
            current: 0,        // 内部状态：当前页（change 广播 detail={index}；el.value 桥读写）——键名避开 x-for 缺省循环索引名 index（克隆体内 localData 注入的 index 会遮蔽组件 data 同名键）
            settleTarget: -1,   // 内部状态：程序滚动目标页（-1 空闲；scroll 档滚动同步吞 smooth 中间态）
        }),
        methods: {
            // 上一页 / 下一页（goTo 统一夹取/环形/去重/广播）
            prev() { this.goTo(this.data.current - 1); },
            next() { this.goTo(this.data.current + 1); },
            // 切页统一通道：loop 环形归一 / 非 loop 夹取；同值短路；写 data.index +
            // change 广播 + scroll 档 applyScroll（settleTarget 置位）
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
            // change 广播（箭头/指示点/键盘/autoplay/用户拖动殊途同归的出口）
            emitChange(i) {
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: i } }));
            },
            // scroll 档位置应用：settleTarget 置位（滚动同步吞中间态）；reduce 用户
            // 关平滑（behavior auto）
            applyScroll(i) {
                const track = this.el.querySelector(".asc-carousel-track");
                if (!track) return;
                this.data.settleTarget = i;
                const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
                track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
            },
            // 键盘路由（stage 焦点域）：左右翻页
            onKeydown(e) {
                if (e.key === "ArrowLeft") { e.preventDefault(); this.prev(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); this.next(); }
            },
        },
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // el.value 劫持桥（当前页的 DOM 通道：读 index / 写 goTo）
            Object.defineProperty(this.el, "value", {
                get: () => this.data.current,
                set: (v) => { this.goTo(Number(v)); },
                configurable: true,
            });

            // —— scroll 档滚动同步：程序滚动（settleTarget >= 0）吞 smooth 中间态、
            // 到达目标页即收旗；用户拖动（settleTarget = -1）实时反推同步并广播 ——
            const track = this.el.querySelector(".asc-carousel-track");
            const onScroll = () => {
                const w = track ? track.clientWidth : 0;
                if (!track || w <= 0) return; // 无布局（测试环境）静默跳过
                const idx = Math.round(track.scrollLeft / w);
                if (this.data.settleTarget >= 0) {
                    if (idx === this.data.settleTarget) this.data.settleTarget = -1; // 到达收旗
                    return; // 中间态吞掉（防路过页误同步/误广播）
                }
                if (idx !== this.data.current) {
                    this.data.current = idx;
                    this.emitChange(idx);
                }
            };
            track?.addEventListener("scroll", onScroll);

            // 容器尺寸变化重定位（scroll 档：页宽变化后按当前页重贴齐，instant 无动画）
            const onResize = () => {
                if (this.data.effect !== "scroll" || !track) return;
                this.data.settleTarget = this.data.current;
                track.scrollTo({ left: this.data.current * track.clientWidth, behavior: "auto" });
            };
            window.addEventListener("resize", onResize);

            // —— autoplay：间隔毫秒（0 关）；reduce 停播；非循环末页自然停播 ——
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
            this.watch("autoplay", () => startAuto()); // 间隔调整热重启（0 即停）

            // 清理器落宿主 expando（unmounted 摘除——grid 断点监听同款纪律）
            this.el["_ascCarouselCleanup"] = () => {
                stopAuto();
                track?.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onResize);
            };
        },
        unmounted() {
            // 定时器与全局监听摘除（长命对象防泄漏；宿主可能已拆——可选链静默通过）
            this.el?.["_ascCarouselCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-carousel">
    /* 宿主：块级满宽透明壳，字号基线经 data-size 档位跟随（说明条/内容以 em 标定缩放） */
    .asc-carousel {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-carousel-font-size, 0.875rem));
    }

    /* ---------- body：形态/指示器数据属性载体（编译子树内层，绑定可求值） ---------- */
    .asc-carousel-body {
      position: relative; /* 指示器定位基准 */
    }
    .asc-carousel-stage {
      position: relative; /* 箭头定位基准 */
      overflow: hidden;
      border-radius: var(--auto-border-radius, var(--asc-carousel-radius, 0.5rem));
      background: var(--auto-third-bgcolor, var(--asc-carousel-bg, rgba(0, 0, 0, 0.04)));
    }
    .asc-carousel-stage:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--auto-primary-color, var(--asc-carousel-primary, #009aff)) 30%, transparent);
    }

    /* ---------- track：x-for 容器（幻灯项逐项克隆；本元素是容器宿主——动态绑定禁上） ---------- */
    /* scroll 档（缺省）：横向真滚动 + scroll-snap（原生滚动/触摸惯性免费） */
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-track {
      display: flex;
      width: 100%;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none; /* 滚动条隐藏（指示点即位置反馈） */
      overscroll-behavior-x: contain;
    }
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-track::-webkit-scrollbar {
      display: none;
    }
    /* fade 档：叠放透明度切换（stage 定高是结构前提——绝对叠放项不撑高容器） */
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

    /* ---------- 幻灯项（x-for 克隆体） ---------- */
    .asc-carousel-item {
      position: relative; /* 说明条定位基准 */
      box-sizing: border-box;
    }
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-item {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always; /* 一次手势一页（防连滑跨页） */
    }
    .asc-carousel-item-img {
      display: block;
      width: 100%;
      object-fit: var(--asc-carousel-fit, cover); /* 图片填充形态可覆盖 */
      user-select: none;
    }
    /* scroll 档无定高链（stage 高度由内容撑）：图片高度缺省随内容，可经
         --asc-carousel-height 统一定高（与 fade 档同一变量） */
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-item-img {
      height: var(--asc-carousel-height, auto);
    }
    /* fade 档：stage 定高 → 满高填充 */
    .asc-carousel-body[data-effect="fade"] .asc-carousel-item-img {
      height: 100%;
    }
    /* 内容幻灯（html 项）：可滚动留白容器，文字色走主题链 */
    .asc-carousel-item-html {
      width: 100%;
      height: 100%;
      padding: var(--asc-carousel-html-pad, 1.25em);
      box-sizing: border-box;
      overflow: auto;
      color: var(--auto-color, var(--asc-carousel-color, #606060));
    }
    /* 说明条：底部渐变反白（图上浮层恒定设计——见文件头声明；底部让出指示器位） */
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

    /* ---------- 前后箭头：图上浮层（悬停显影，触屏恒显；disabled 隐藏） ---------- */
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
      opacity: 0; /* 悬停显影（focus 兜底键盘通道） */
      transition: opacity 0.2s ease, background-color 0.15s ease;
    }
    .asc-carousel-stage:hover .asc-carousel-arrow,
    .asc-carousel-arrow:focus-visible {
      opacity: 1;
    }
    @media (hover: none) {
      .asc-carousel-arrow { opacity: 1; } /* 触屏无 hover——恒显 */
    }
    .asc-carousel-arrow:hover {
      background: var(--asc-carousel-arrow-hover-bg, rgba(0, 0, 0, 0.65));
    }
    .asc-carousel-arrow:disabled {
      opacity: 0;
      cursor: not-allowed;
      pointer-events: none; /* 非循环首末页收箭头 */
    }
    .asc-carousel-arrow[data-arrow="prev"] { left: 0.75rem; }
    .asc-carousel-arrow[data-arrow="next"] { right: 0.75rem; }
    /* 左箭头 = 内置 arrow 图标旋转 180°（引擎图标集无独立左箭头） */
    .asc-carousel-arrow[data-arrow="prev"] .asc-carousel-arrow-icon {
      display: inline-block;
      transform: rotate(180deg);
    }
    .asc-carousel-arrow-icon {
      font-size: 1.25rem;
      color: inherit;
    }

    /* ---------- 指示器：图上浮层（恒白点设计——见文件头声明） ---------- */
    .asc-carousel-indicator {
      position: absolute;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      padding: 0.55em 0;
      z-index: 2;
      pointer-events: none; /* 容器透传，点钮恢复可点 */
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
    /* 激活点：胶囊拉长 + 实白（图上浮层恒定设计） */
    .asc-carousel-dot[data-active] {
      width: 1.2em;
      background: var(--asc-carousel-dot-active-bg, #ffffff);
    }

    /* ---------- 暗色兜底变体（ADR-0129）：容器级字面值切换（图上浮层恒定不参与） ---------- */
    [dark] .asc-carousel-stage,
    [data-dark] .asc-carousel-stage {
      background: var(--auto-third-bgcolor, var(--asc-carousel-bg, rgba(255, 255, 255, 0.1)));
    }
    [dark] .asc-carousel-item-html,
    [data-dark] .asc-carousel-item-html {
      color: var(--auto-color, var(--asc-carousel-color, #fafafa));
    }

    /* ---------- 动效可访问性：reduced-motion 停播（fade 过渡/点钮拉伸） ---------- */
    @media (prefers-reduced-motion: reduce) {
      .asc-carousel-body[data-effect="fade"] .asc-carousel-item { transition: none; }
      .asc-carousel-body[data-effect="scroll"] .asc-carousel-track { scroll-behavior: auto; }
      .asc-carousel-dot,
      .asc-carousel-arrow { transition: none; }
    }
  </style>
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；effect 归一 fade/scroll 双态、
         indicator 归一 top/bottom/off 三态 -->
  <div
    class="asc-carousel-body"
    :data-effect="effect === 'fade' ? 'fade' : 'scroll'"
    :data-indicator="indicator === false ? 'off' : (indicator === 'top' ? 'top' : 'bottom')"
  >
    <!-- 舞台：键盘焦点域（tabindex——非 x-for 宿主，绑定可求值） -->
    <div
      class="asc-carousel-stage"
      tabindex="0"
      role="region"
      aria-roledescription="carousel"
      @keydown="onKeydown($event)"
    >
      <!-- 幻灯轨道：x-for 容器宿主（静态属性保留；项级绑定全在克隆体） -->
      <div class="asc-carousel-track" x-for="item of items">
        <div class="asc-carousel-item" :data-active="$index === current ? '' : null">
          <!-- 图片幻灯：string 项或对象项 src 字段（克隆体内显隐一律 x-show） -->
          <img
            class="asc-carousel-item-img"
            x-show="typeof item === 'string' || (item && !!item.src)"
            :src="typeof item === 'string' ? item : (item && item.src) || ''"
            :alt="typeof item === 'object' && item !== null ? (item.alt ?? '') : ''"
            draggable="false"
          />
          <!-- 内容幻灯：对象项 html 字段（x-html 直出——内容安全由调用方数据自负） -->
          <div
            class="asc-carousel-item-html"
            x-show="typeof item === 'object' && item !== null && !item.src && !!item.html"
            x-html="typeof item === 'object' && item !== null ? (item.html ?? '') : ''"
          ></div>
          <!-- 说明条：对象项 caption 字段（紧凑书写——渐变底不留缝） -->
          <div
            class="asc-carousel-item-caption"
            x-show="typeof item === 'object' && item !== null && !!item.caption"
            x-text="typeof item === 'object' && item !== null ? (item.caption ?? '') : ''"
          ></div>
        </div>
      </div>
      <!-- 前后箭头：非循环首末页 disabled（x-icon 内置 arrow，prev 经 CSS 旋转） -->
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
    <!-- 指示器：dots 为 x-for 容器（宿主动态绑定禁上）；点钮激活态在克隆体 -->
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
`,ia=`autospark.carousel`;function aa(e){e.components[ia]=ra,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-carousel`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-carousel-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={},n=e.getAttribute(`src`),r=e.getAttribute(`alt`),i=e.getAttribute(`caption`);n!=null&&(t.src=n),r!=null&&(t.alt=r),i!=null&&(t.caption=i);let a=(e.innerHTML||``).trim();return a!==``&&(t.html=a),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``?a.push(`${Q(Z(n.name))}: true`):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);e.setAttribute(`x-component:${ia}`,`{ ${a.join(`, `)} }`),t.replaceWith(e)}})}oa();function oa(){y(e=>{m(e),aa(e)})}var sa=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定（bordered/striped/selectable/virtual）与 loading 组合全部落在
    编译子树的内层 inner 元素上（list 同款范式，宿主为透明块壳）。

    内部装配（ADR-0018 决策 2「内部装配、对外开箱」，接线细节见 ADR-0023）：
    - 双 x-for：行循环（viewRows——rows × 排序态的 JS 通道派生视图）× 列循环（columns，
      template 形态挂行内——项经 template.parentElement 落位行元素，静态选择列与循环列
      共存同一行；嵌套 x-for 沿 scope 链解析组件域 columns，克隆体内组件实例/值通道
      均已实证可用）；
    - 普通分叉走 **CSS display:table 全 div 结构**（.asc-table-tablebox 表盒 + table-row/
      table-cell 系）：语义 <table> 在 happy-dom 下 <template> 子节点 content 丢失
      （table 语境模板解析边界），div 结构免疫且列宽随内容自动分配（table-layout:auto），
      语义经 ARIA role（table/row/columnheader/cell）承载；
    - 虚拟分叉走 **CSS grid 网格**：tbody 无法独立滚动而 virtual 策略要求 x-for 容器即
      滚动宿主——网格行（--asc-table-cols 自定义属性经 inner 继承贯通表头/数据行，JS
      通道 setProperty 同步——Chromium 自定义属性赋值须走 setProperty）+ 定高滚动容器
      （行定高 40px 显式声明，与字号档位解耦）；表头恒渲染不虚拟化（滚动容器外置 +
      scrollLeft JS 跟随）；
    - 单元格自定义：col-<key> 动态名出口（x-slot="{ name, params }" 对象形态，ADR-0107
      ——动态列键无静态出口可投 + 双分叉同名出口绕开静态去重 ADR-0056；形参
      { row, column, rowIndex, colIndex }），缺省单元格做 null 收敛 + 标量直出 + 对象
      JSON 序列化兜底；
    - 排序：表头点击三态轮转（无 → 升 → 降 → 无），本地排序经 viewRows 整体重排
      （remoteSort=true 只发 sort-change 事件不动数据，交调用方远端取数）；
    - 行选择：checkbox 列组合消费 autospark.checkbox（props 值通道携带 checked/
      indeterminate 布尔），全选/半选经表头 checkbox；选中集内部自持 selectedKeys
      （整体替换驱动全行重求值），selection props 单向内同步 + selection-change 事件外发；
    - loading（x-loading 经绑定通道写三态字面量）/ empty（autospark.empty 组合 + empty
      插槽重载；经 x-show 兄弟段驱动而非 x-empty special——分叉结构与虚拟策略互持更简）。

    出口声明形态：virtual/普通双分叉各持一份 col-<key>/empty 出口，统一走动态名对象
    形态（不入静态清单、不参与同名去重，运行期仅活跃分叉实例化投影——list 先例）。

    items 类数据变更通道：columns/rows/selection 均为调用方状态**引用**注入——整体替换
    驱动；原地增删不发信号（跨域边界，文档披露）。克隆体内一律 x-show（共享快照 x-if
    串台缺陷规避，ADR-0021 后果 3）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号/行距随 data-size 档位缩放（em 基准）；table 不在 data()
     声明主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-table"
  x-define="autospark.table"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            columns: [],        // 列定义 [{ key, title?, width?, align?, sortable? }]（状态引用注入——字面量数组死环规避）
            rows: [],           // 数据数组（状态引用注入；变更整体替换驱动重渲）
            rowKey: "id",       // 行键字段名（选择集键定位；缺失回退行索引——排序后跟随位置，文档披露）
            selectable: false,  // 行选择开关（前置 checkbox 列，组合消费 autospark.checkbox）
            selection: [],      // 受控选中集（行键数组，状态引用注入；单向内同步）
            remoteSort: false,  // 远端排序（true 时表头点击只发 sort-change 事件，不本地重排）
            loading: false,     // 加载态（引擎 x-loading 覆盖层组合，铺满表格）
            bordered: true,     // 外框开关（false 转透明色，占位稳定不跳变）
            striped: false,     // 斑马纹（偶数行浅底，:data-alt="$even" 数据通道——虚拟垫片不破奇偶）
            virtual: false,     // 虚拟滚动（网格分叉 + x-for.virtual；须同页引入 autospark.virtual.js，缺位退化全量）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            viewRows: [],       // 排序视图（rows × 排序态派生；行 x-for 数据源）
            sortKey: "",        // 当前排序列 key（空 = 无排序）
            sortOrder: "",      // 排序方向 asc | desc | ""
            selectedKeys: [],   // 内部选中行键集（整体替换驱动全行 checkbox 重求值）
            allChecked: false,  // 全选态（表头 checkbox checked）
            halfChecked: false, // 半选态（表头 checkbox indeterminate）
        }),
        methods: {
            // 行键提取（rowKey 字段缺失回退行索引——选择集跟随位置而非数据，限制披露）
            keyOf(row, index) {
                const k = row == null ? undefined : row[this.data.rowKey];
                return k === undefined || k === null ? index : k;
            },
            // 排序比较器：数值差分 / 字符串 localeCompare（null 视空，确定性优先；数字字符串不隐式数值化，文档披露）
            cmpCells(x, y) {
                const a = x == null ? "" : x;
                const b = y == null ? "" : y;
                if (typeof a === "number" && typeof b === "number") return a - b;
                return String(a).localeCompare(String(b));
            },
            // 重建排序视图（rows / 排序态变化收口；整体替换驱动 x-for 重渲）
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
            // 选中集派生态同步（全选 / 半选——表头 checkbox 值通道）
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
            // 表头点击排序：三态轮转 无 → 升 → 降 → 无（remoteSort 只发事件不动数据）
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
            // 行勾选切换（事件通道；整体替换 selectedKeys 驱动全行 checkbox 重求值）
            onRowCheck(row, index) {
                const key = this.keyOf(row, index);
                const keys = this.data.selectedKeys ?? [];
                this.data.selectedKeys = keys.includes(key)
                    ? keys.filter((k) => k !== key)
                    : [...keys, key];
                this.syncSelection();
                this.emitSelection();
            },
            // 表头全选切换（半选态点击 → 全选，原生行为对齐）
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
            // 选中集变更出口（detail 标量投影——键数组）
            emitSelection() {
                this.el.dispatchEvent(
                    new CustomEvent("selection-change", {
                        bubbles: true,
                        detail: { keys: [...(this.data.selectedKeys ?? [])] },
                    }),
                );
            },
            // 虚拟网格列模板同步：--asc-table-cols 自定义属性落 inner（继承贯通 vhead/vrow，
            // 一处 setProperty 全表收口；列宽 number→px / 缺省 minmax 均分）
            syncGridCols() {
                const cols = Array.isArray(this.data.columns) ? this.data.columns : [];
                const parts = cols.map((c) => {
                    if (c && c.width) return typeof c.width === "number" ? c.width + "px" : String(c.width);
                    return "minmax(6em, 1fr)";
                });
                if (this.data.selectable) parts.unshift("3em");
                this.el.style.setProperty("--asc-table-cols", parts.join(" "));
            },
            // 虚拟表头横向滚动跟随（vhead 在滚动容器外，vbody scroll → scrollLeft JS 同步；
            // 处理器引用挂元素 expando，重绑/卸载经同键回收）
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
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                // 受控选中集初值内同步（props 注入可晚于 watch 注册——初值在此收口统一读取；
                //     空数组跳过，不打回内部态）
                const init = Array.isArray(this.data.selection) ? [...this.data.selection] : [];
                if (init.length > 0) this.data.selectedKeys = init;
                this.rebuildView();
                this.syncSelection();
                this.syncGridCols();
                this.bindVHeadSync();
            }, 0);

            // —— props / 内部状态跟随（回调收 { value } 信封对象，家族惯用法；
            //     同值重跑幂等——i18n ready 等换血场景防打回，ADR-0021 后果 9）——
            this.watch("rows", () => { this.rebuildView(); this.syncSelection(); });
            this.watch("columns", () => {
                // 排序列消失时复位排序态（防悬挂 key 空转）
                if (this.data.sortKey && !(this.data.columns ?? []).some((c) => c && c.key === this.data.sortKey)) {
                    this.data.sortKey = "";
                    this.data.sortOrder = "";
                    this.rebuildView();
                }
                this.syncGridCols();
            });
            this.watch("selectable", () => { this.syncGridCols(); });
            // 受控选中集单向内同步：外部整体替换生效；同值跳过（内发事件不回环）
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
    /* 宿主：块级满宽透明壳，字号基线经 data-size 档位全跟随（行内距/行高以 em 标定缩放） */
    .asc-table {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-table-font-size, 0.875rem));
    }

    /* ---------- 盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */
    .asc-table-inner {
      --asc-line: var(--auto-border-color, var(--asc-table-border-color, #d9d9d9));
      /* 语义选中色中转（alert 定型 --asc-tone 组织）：选中行 color-mix 派生唯一源 */
      --asc-tone: var(--auto-primary-color, var(--asc-table-primary, #009aff));
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效（card 同款） */
      --asc-pad: var(--auto-padding, var(--asc-table-padding, 0.8rem));
      position: relative; /* x-loading 覆盖层定位基准 */
      display: block;
      background: var(--auto-bgcolor, var(--asc-table-bg, #ffffff));
      border: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-table-radius, 0.5rem));
      overflow: hidden; /* 圆角裁切内部滚动内容 */
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
    /* 表头单元格：面板头底色 + 底部分隔线（内距 --asc-pad calc 派生，card 同款） */
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
    /* 数据单元格：相邻行分隔线（内距 --asc-pad calc 派生） */
    .asc-table-td {
      display: table-cell;
      padding: calc(var(--asc-pad, 0.8rem) * 0.65) calc(var(--asc-pad, 0.8rem) * 1.1);
      border-top: var(--auto-border-size, var(--asc-table-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-line, #d9d9d9) 60%, transparent);
    }
    /* 对齐变体（th/td/vh/vtd 同名通道；普通分叉 text-align，虚拟分叉 justify-content） */
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
    /* 选中行高亮：--asc-tone 中转 + color-mix 派生（alert 定型语义色组织，:has() 探内层勾选态） */
    .asc-table-inner[data-selectable="true"] .asc-table-row:has(.asc-table-td-sel .asc-checkbox-input:checked),
    .asc-table-inner[data-selectable="true"] .asc-table-vrow:has(.asc-table-vtd-sel .asc-checkbox-input:checked) {
      background: color-mix(in srgb, var(--asc-tone) 8%, transparent);
    }
    /* 数据行：斑马纹（:data-alt="$even" 数据通道——虚拟垫片不破奇偶）+ 语义色悬停（末位声明悬停胜出） */
    .asc-table-inner[data-striped="true"] .asc-table-row[data-alt],
    .asc-table-inner[data-striped="true"] .asc-table-vrow[data-alt] {
      background: var(--auto-secondary-bgcolor, var(--asc-table-stripe-bg, rgba(245, 245, 245, 0.45)));
    }
    .asc-table-row:hover,
    .asc-table-vrow:hover {
      background: var(--auto-hover-bgcolor, var(--asc-table-row-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    /* 默认单元格文本：单行省略（自定义列插槽不受此约束） */
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
    /* 选择列：居中窄列（普通分叉经 width 提示；虚拟分叉经 --asc-table-cols 首段 3em） */
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
      overflow: hidden; /* 横向跟随 vbody（scrollLeft JS 同步） */
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
      height: 40px; /* 虚拟化定高：与 x-for-options itemHeight: 40 配套（覆盖须同改两处，文档披露） */
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

    /* ---------- 空态段（x-show 兄弟段；满宽铺展，非列内单元格） ---------- */
    .asc-table-empty {
      padding: calc(var(--asc-pad, 0.8rem) * 1.5) var(--asc-pad, 0.8rem);
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 变体数据属性 + loading 组合承载在 inner（编译子树内层元素）；loading 三态字面量
         （list 同款：假态显式 "false" 走 attrChanged 通道） -->
  <div
    class="asc-table-inner"
    :data-borderless="!bordered"
    :data-striped="striped"
    :data-selectable="selectable"
    :data-virtual="virtual"
    :x-loading="loading ? 'true' : 'false'"
  >
    <!-- 普通分叉：CSS display:table（virtual=false 缺省）。列循环 template 形态挂行内——
             项落 template.parentElement（单元格直挂行元素），静态选择列与循环列共存同一行 -->
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
        <!-- 空态段（x-show 兄弟段——满宽铺展；empty 插槽可整体重载，缺省组合 autospark.empty） -->
        <div class="asc-table-empty" x-show="!(viewRows && viewRows.length > 0)">
          <div class="asc-table-empty-outlet" x-slot="{ name: 'empty' }">
            <x-empty></x-empty>
          </div>
        </div>
      </div>
    </div>
    <!-- 虚拟分叉：CSS grid 网格（virtual=true）。vbody 即 x-for.virtual 容器 = 滚动宿主
             （策略要求）；表头外置恒渲染（横向 scrollLeft JS 跟随）；网格列模板经
             --asc-table-cols 继承（inner 一处 setProperty）；行定高 40px 显式声明 -->
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
      <!-- 空态段（x-show 兄弟段，virtual 分叉共享 empty 插槽） -->
      <div class="asc-table-empty" x-show="!(viewRows && viewRows.length > 0)">
        <div class="asc-table-empty-outlet" x-slot="{ name: 'empty' }">
          <x-empty></x-empty>
        </div>
      </div>
    </div>
  </div>
</div>
`,ca=`autospark.table`;function la(e){e.components[ca]=sa}ua();function ua(){y(e=>{m(e),la(e)})}var da=`<!--
    autospark.collapse 折叠面板组（组件库 P2 展示件，ADR-0018 清单权威表 display 行）：
    面板元信息双形态——items 数据形态（content HTML 字符串经 x-html）/ 子元素声明形态
    （<x-collapse-item> 经 index.ts precompile 展开为面板结构、默认插槽投影）。

    开合驱动（两形态统一 JS 通道）：展开 key 集 = 组件 data.value（受控数组 + el.value
    桥 + change detail={value}）；mounted 的同步通道把开合态写到每个面板容器的
    data-open 属性 + 各 header 的 aria-expanded——CSS 消费 data-open 驱动内容体
    grid-template-rows 0fr→1fr 高度过渡与图标旋转（DOM 子树恒保留：表单输入态/
    滚动位不丢，x-if 摘挂语义的对立面）。头部点击经组件根 JS 委托（数据形态克隆体
    与声明形态投影结构两通道统一），手风琴互斥在 toggle 内收敛（accordion：开新关旧）。

    与 x-foldable 的边界：x-foldable 是 nowrap flex 容器的行内溢出折叠（溢出子元素收进
    more 弹出面板，ADR-0098），无受控 value 集/无互斥/弹出非原地展开——与本件「内容面板
    垂直展开」语义不同构，故自实现 CSS 高度过渡（详见 index.ts 文件头取舍声明）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - change：头部切换后冒泡，detail = { value }（切换后的新 key 数组）；外部 props
      驱动的 value 变化不广播（防回环）。
    - input：非冒泡，x-model 回写通道（与 change 同时机）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——expandIconPosition 绑定（:data-expand-position）落在编译子树的内层
    body 上，header 布局按 body 的数据属性命中 start/end 形态块。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随，collapse 不设自有字号
     属性；data() 不得声明主题六键，组件内部变体属性亦禁用六个通道名
     （data-expand-position 为自有变体轴） -->
<div
  class="asc-collapse"
  x-define="autospark.collapse"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: [],           // 展开 key 集（受控：数组注入；逗号/空格分隔字符串归一为数组；el.value 桥 + change detail={value}）
            items: [],           // 数据形态面板 { key, title, disabled?, content? }[]——状态引用注入（字面量数组死环规避）；content 为 HTML 字符串经 x-html；声明形态经 data-items 通道兜底
            accordion: false,   // 手风琴互斥：开新面板时关闭已开面板（同时仅一开）
            expandIconPosition: "end", // 展开图标位置：end 标题右（缺省）| start 标题左
        }),
        methods: {
            // 值归一：数组 | 逗号/空格分隔字符串 → string[]（过滤空段）
            toArray(v) {
                if (v == null) return [];
                if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
                return String(v).split(/[,\\s]+/).map((x) => x.trim()).filter(Boolean);
            },
            // 面板切换（头部点击共用通道）：已开移除；未开追加（accordion 互斥——新集只含
            // 新 key）；写 value 触发 watch 同步通道 → 双派发（input→x-model 回写非冒泡；
            // change→外层消费 detail={value} 冒泡）
            toggle(key) {
                if (key == null || String(key) === "") return;
                const k = String(key);
                const cur = this.toArray(this.data.value);
                const next = cur.includes(k) ? cur.filter((x) => x !== k) : (this.data.accordion ? [k] : cur.concat(k));
                this.data.value = next;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));
            },
            // 开合态同步通道：每个面板容器 data-open 属性 + 各 header aria-expanded
            // （CSS 消费 data-open 驱动高度过渡与图标旋转；幂等——同值重写无副作用）
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
            // 头部点击委托（组件根承载——数据形态克隆体与声明形态投影结构两通道统一；
            // 原生 disabled 按钮点击不派发 click，天然拦截）
            onRootClick(event) {
                const t = event.target instanceof Element ? event.target : null;
                const header = t ? t.closest(".asc-collapse-header") : null;
                if (!header || !this.el.contains(header)) return;
                this.toggle(header.getAttribute("data-key"));
            },
        },
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) this.data.items = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // 值归一（分隔字符串 / 数字 key 语域 → string[]）
            this.data.value = this.toArray(this.data.value);

            // el.value 劫持桥（受控 value 的 DOM 通道：x-model / 程序读写皆经此）——
            // 读 = 展开 key 数组快照；写 = 数组/分隔字符串归一（受控写经 watch 同步，不广播）
            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => this.toArray(this.data.value).slice(),
                set: (v) => { this.data.value = this.toArray(v); },
                configurable: true,
            });

            // 开合同步通道：初始 + value/items 订阅（items 整体替换后克隆体重建，
            // 延后一跳再同步——x-for 重渲染经调度器微任务合并；同步幂等）
            this.syncOpenState();
            this.watch("value", () => this.syncOpenState());
            this.watch("items", () => setTimeout(() => this.syncOpenState(), 0));

            // 头部点击委托
            this.el.addEventListener("click", (e) => this.onRootClick(e));

            // 一跳首对齐（mounted 时 x-model expando 可能未落定，家族惯例）+
            // 克隆体渲染后的开合态补同步
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
    /* 宿主：透明块壳（字号基线随 data-size 档位全跟随，button 同范式 ADR-0012） */
    .asc-collapse {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-collapse-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- body：面板组容器（编译子树内层，绑定可求值）—— 组级边框 + 圆角 ---------- */
    .asc-collapse-body {
      --asc-line: var(--auto-border-color, var(--asc-collapse-border-color, #d9d9d9));
      display: block;
      border: var(--auto-border-size, var(--asc-collapse-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-collapse-radius, 0.5rem));
      background: var(--auto-bgcolor, var(--asc-collapse-bg, #ffffff));
      overflow: hidden; /* 圆角裁切（内容体展开动画不溢出边框） */
    }
    /* 数据形态克隆容器：display:contents（克隆面板直接参与 body 布局，包裹层不留盒） */
    .asc-collapse-items {
      display: contents;
    }
    /* 声明形态投影出口：display:contents（投影面板直接参与 body 布局，包裹层不留盒） */
    .asc-collapse-slot {
      display: contents;
    }
    .asc-collapse-slot:empty {
      display: none;
    }
    /* 空组不占位（数据形态空渲染 + 声明形态无投影 → 组级壳隐藏） */
    .asc-collapse-body:not(:has(.asc-collapse-item)) {
      display: none;
    }

    /* ---------- 面板项：header + content（两形态同名结构，CSS 单源） ---------- */
    /* 面板间隔线：同容器内相邻项 + 两形态容器交界（display:contents 不改变 DOM 相邻语义） */
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
    /* 标题：flex:1 把图标推向对侧 */
    .asc-collapse-title {
      flex: 1;
      min-width: 0;
      font-weight: var(--x-font-weight-medium, 500);
    }
    /* 展开图标：内置 arrow（右向），开合旋转（闭=右、开=下 90°） */
    .asc-collapse-icon {
      display: inline-flex;
      color: var(--auto-third-color, var(--asc-collapse-icon-color, rgba(0, 0, 0, 0.35)));
      transform: rotate(0deg);
      transition: transform 0.2s ease;
    }
    .asc-collapse-item[data-open] .asc-collapse-icon {
      transform: rotate(90deg);
    }
    /* 图标位置 start：标题与图标对调（row-reverse + 标题不再 flex:1 推挤） */
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-header {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-title {
      flex: 0 1 auto;
      text-align: end;
    }

    /* ---------- 内容体：grid 高度过渡（0fr→1fr，DOM 恒保留——表单态/滚动位不丢） ---------- */
    .asc-collapse-content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.25s ease;
    }
    .asc-collapse-item[data-open] > .asc-collapse-content {
      grid-template-rows: 1fr;
    }
    /* 裁剪层：grid-rows 过渡的标准结构（单子层 overflow hidden + min-height 0） */
    .asc-collapse-inner {
      overflow: hidden;
      min-height: 0;
      padding: 0 calc(0.8em + 0.2em);
    }
    .asc-collapse-item[data-open] > .asc-collapse-content > .asc-collapse-inner {
      padding-block: 0.6em;
    }
    /* 动效可及性：减动效偏好停播过渡（瞬时开合） */
    @media (prefers-reduced-motion: reduce) {
      .asc-collapse-content,
      .asc-collapse-icon {
        transition: none;
      }
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 图标位置绑定落本层（T4=B：根上动态绑定不求值）；两形态面板结构同名类，
         开合态经 data-open 属性通道由 CSS 驱动（见文件头注释） -->
  <div class="asc-collapse-body" :data-expand-position="expandIconPosition">
    <!-- 数据形态：items 状态引用驱动（x-for 容器宿主形态——容器不克隆、子元素为逐项
             克隆模板；克隆模板为单包裹层 .asc-collapse-item 承载 data-key/data-open，
             content HTML 字符串经 x-html——富模板（绑定/指令）请用子元素声明形态） -->
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
    <!-- 声明形态：precompile 展开的面板结构经默认插槽投影（display:contents 出口，
             投影面板直接参与 body 布局；出口紧凑书写——:empty 隐藏纪律） -->
    <div class="asc-collapse-slot" x-slot></div>
  </div>
</div>
`,fa=`autospark.collapse`;function pa(e){e.components[fa]=da,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-collapse`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-collapse-item`);for(let e of n){let t=e.getAttribute(`key`)??``,n=document.createElement(`div`);n.className=`asc-collapse-item`,n.setAttribute(`data-key`,t);let r=document.createElement(`button`);r.type=`button`,r.className=`asc-collapse-header`,r.setAttribute(`data-key`,t),e.hasAttribute(`disabled`)&&r.setAttribute(`disabled`,``);let i=document.createElement(`span`);i.className=`asc-collapse-title`,i.textContent=e.getAttribute(`title`)??``;let a=document.createElement(`i`);a.className=`asc-collapse-icon`,a.setAttribute(`x-icon`,`'arrow'`),r.appendChild(i),r.appendChild(a);let o=document.createElement(`div`);o.className=`asc-collapse-content`;let s=document.createElement(`div`);for(s.className=`asc-collapse-inner`;e.firstChild;)s.appendChild(e.firstChild);o.appendChild(s),n.appendChild(r),n.appendChild(o),e.replaceWith(n)}let r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),r!=null&&r!==``&&!i&&!n.length)try{Array.isArray(JSON.parse(r))&&e.setAttribute(`data-items`,r)}catch{}let a=[];for(let n of Array.from(t.attributes)){if(n.name.startsWith(`:`)){a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`);continue}if(n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)){e.setAttribute(n.name,n.value);continue}let t=n.name===`accordion`&&n.value===``||$(n.value);a.push(`${Q(Z(n.name))}: ${JSON.stringify(t)}`)}for(e.setAttribute(`x-component:${fa}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}ma();function ma(){y(e=>{m(e),pa(e)})}var ha=`<!--\r
    Field 表单域骨架（ADR-0020）——base/ 目录首个产物（ADR-0018 决策 7：form 前瞻\r
    唯一例外，其余基类演进式抽取）。2026-11-14 修订：转公开文档组件（侧边栏「表单」组\r
    + demo + 文档页）——可直接实例化（默认出口装任意控件内容即得骨架能力：状态色/\r
    焦点态/禁用只读同步/盒饰），同时仍是 form 域家族（input/checkbox/radio/switch/\r
    select/input-number…）的继承基座。\r
\r
    骨架职责（宁薄勿胖——只承担 form 域家族共性，控件本体与装饰一概留给子组件）：\r
    - 结构：宿主级包裹层（.asc-field 布局基座，class 拼接进子组件宿主）+ 三出口——\r
      默认出口（.asc-field-body，display:contents 不产生布局层；子组件全部控件结构\r
      经默认段替换出口 fallback（继承覆盖，ADR-0081），直接实例化时消费方内容同位）\r
      + prefix / suffix 具名装饰出口（body 兄弟位，DOM 序固定\r
      [slot:prefix][body][slot:suffix]；template 载体（ADR-0137，2026-11-15 切换）\r
      ——class 经属性活注入落投影内容首根（间距/防收缩规则随类落内容根本身），\r
      无内容整出口静默消失、零多余 DOM，裸态控件组件继承亦无害；多根装饰仅首根\r
      得注入类——装饰出口建议单根，多根后续节点消费方自理）；盒饰 chrome 为 .asc-field-box\r
      选配类（input 类控件用，checkbox/radio/switch 等裸态控件不用）\r
    - 轻装饰/重装饰分层（2026-11-14 修订）：子组件 props 前后置（input 的\r
      prefix/suffix 文本|图标）是轻装饰（组件内贴控件），插槽前后置是重装饰\r
      （消费方任意 HTML，恒在轻装饰外侧），两者共存不互斥；插槽内容默认次要色、\r
      点击转发焦点到控件（消费方放交互件须自标 data-autospark-action 自理）；\r
      disabled/readonly 不对插槽内容做专门处理（与 props 装饰对齐）\r
    - 融合动作 actions（2026-11-16 修订二，ADR-0020 决策 3）：props 驱动渲染段\r
      （非插槽出口——数据→视图）——button props 数组 + 自有键 pos（before|after\r
      分侧，缺省 after）/name/value；组合复用 autospark.button（产物依赖其同页\r
      加载），融合复用 button-group 负 margin 边线复用范式（ADR-0014）；field\r
      disabled 联动合并项 disabled；点击组包派发 action-click（detail =\r
      {index,name,value,item}）+ 原生 click 双通道；空数组整段不渲染零 DOM\r
    - 状态色通道：status（"" | error | success | warning）→ 宿主 data-status 属性 →\r
      --asc-field-tone 中转变量派生（焦点环/边框色统一消费）；error 态同步 aria-invalid\r
    - 焦点态追踪：focusin/focusout（焦点在骨架内元素间移动不闪烁）→ 宿主 data-focus\r
    - disabled / readonly：同步到 [data-autospark-control] 原生控件 + 宿主 data-disabled /\r
      data-readonly 反射（CSS 淡化与光标通道）\r
    - 尺寸档位：经 autospark.base 继承链消费主题 data-size 通道（--auto-input-height /\r
      --auto-input-padding 随档位联动），骨架不设自有尺寸属性（button 同范式 ADR-0012）\r
    - 与 x-field 分工（ADR-0018 决策 7：不双轨建域）：label/校验/域布局由 engine\r
      x-form/x-field 指令承担；校验结果经子组件 status props 染色进入（x-field 容器\r
      形态后代绑定 status: $field.error ? "error" : ""），骨架不感知 x-field\r
\r
    data-* 标记协议（子组件挂点约定，ADR-0020）：\r
    - data-autospark-control：原生控件标记——disabled/readonly/aria-invalid 同步目标、\r
      点击转发焦点的受让者\r
    - data-autospark-action：交互动作件标记（清除/切换钮等）——点击不转发焦点（自理）\r
-->\r
<!-- 继承 autospark.base（ADR-0134）须为非抽象继承：abstract 组件不能再声明\r
     x-define:inherit（ADR-0134 抽象根约束），而主题档位六键物化必须沿继承链下传——\r
     故本骨架贡献真实模板（包裹层 + 三出口），子组件快照 = 本骨架克隆 + 子默认段替换 +\r
     子根属性并入（class 拼接：宿主恒得 .asc-field + 子自有类），继承链\r
     子组件 → field → autospark.base 三层（ADR-0020 决策 2） -->\r
<span\r
  class="asc-field"\r
  x-define="autospark.field"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            status: "",       // 状态色通道："" 无 | error 危险 | success 成功 | warning 警告（tone 中转变量随动，焦点环/边框消费）\r
            disabled: false,  // 禁用：同步 [data-autospark-control] 原生控件 + 宿主 data-disabled（CSS 淡化/光标）+ 融合动作按钮联动\r
            readonly: false,  // 只读：同步 [data-autospark-control]（readOnly 语义）+ 宿主 data-readonly\r
            actions: [],      // 融合动作（2026-11-16 修订二）：button props 数组 + 自有键 pos（"before"|"after" 分侧，缺省 after）/ name（标识）/ value（原样透传 action-click detail）——数组 props 经状态引用注入（:actions="myActions"，引擎字面量数组死环缺陷 HEAD 未修）\r
        }),\r
        mounted() {\r
            // —— 控件查询（data-autospark-control 标记协议）：每查现取不缓存——运行时\r
            //     控件可能被重建（x-if 条件渲染等），缓存引用会指向已摘除节点\r
            const control = () => this.el.querySelector("[data-autospark-control]");\r
\r
            // —— 状态色通道：status → 宿主 data-status（CSS 派生 --asc-field-tone）——\r
            const applyStatus = () => {\r
                const v = this.data.status;\r
                if (typeof v === "string" && v !== "") this.el.setAttribute("data-status", v);\r
                else this.el.removeAttribute("data-status");\r
            };\r
\r
            // —— 控件同步：disabled/readonly 落原生控件 + 宿主反射 + error 态 aria-invalid\r
            //     （可访问性：组件级状态归一到 aria，与原生约束校验互补）——\r
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
            // —— 焦点态追踪：focusin/focusout 冒泡承接（骨架内任意可聚焦元素）——\r
            //     焦点在骨架内部元素间移动（如 input → 清除钮）时 relatedTarget 仍在\r
            //     骨架内，跳过摘除防闪烁\r
            this.el.addEventListener("focusin", () => {\r
                this.el.setAttribute("data-focus", "");\r
            });\r
            this.el.addEventListener("focusout", (e) => {\r
                const to = e.relatedTarget;\r
                if (to instanceof Node && this.el.contains(to)) return;\r
                this.el.removeAttribute("data-focus");\r
            });\r
\r
            // —— 点击转发焦点：点击盒饰空白区/前后置装饰（非控件非动作件）时焦点落控件\r
            //     （原生 label 包裹的近似体验；动作件 data-autospark-action 自理不转发；\r
            //     插槽装饰内容同此——消费方放交互件须自标 data-autospark-action）——\r
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
            // —— 初始化与跟随（mounted 时化身子树与 props 注入均可能未就位，一跳后\r
            //     首同步；后续 props 变化经 watch 保持——回调收 { value } 信封对象，\r
            //     此处只用作触发信号，家族惯用法）——\r
            // —— 融合动作组包（ADR-0020 修订二）：按钮原生 click 冒泡经宿主——按\r
            //     DOM 序（容器内 .asc-field-action 集合的 indexOf）回查 actions\r
            //     原始项，组包派发 action-click（bubbles，detail =\r
            //     {index, name, value, item}）；原生 click 照常冒泡（双通道）；\r
            //     禁用按钮原生阻断、不到达此处 ——\r
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
    /* 状态色派生（data-status 由 mounted 同步）：tone 切语义色，未聚焦也染边框 */\r
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
    /* 焦点态（data-focus 由 focusin/focusout 同步）：边框取 tone + 同色淡晕 */\r
    .asc-field-box[data-focus] {\r
      --asc-field-line: var(--asc-field-tone);\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    /* 状态在场：未聚焦也染状态色边框（聚焦规则同色调、仅补光晕） */\r
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
    /* 只读：光标归正文（无禁用淡化） */\r
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
    /* ---------- 默认出口包裹层：不产生布局层（子组件控件直接成为骨架 flex 项） ---------- */\r
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
    /* after 组尾钮右贴盒右线 + 外侧圆角匹配盒饰 */\r
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
    /* 组内相邻按钮：侧线压叠单线（每钮压前邻右线，共享一条 --asc-field-line） */\r
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
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
    /* 暗色兜底让位状态色：状态在场时边框取 tone（:not 守卫防高特异性兜底块压掉状态染色） */\r
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
  <!-- 三出口（文档序即呈现序 [slot:prefix][默认段][slot:suffix]，2026-11-14 修订）：\r
       prefix / suffix 具名装饰出口 template 载体（ADR-0137，2026-11-15 切换）——无\r
       内容整出口静默消失，消费方经宿主直接子级标记 <template x-slot:prefix> 投影\r
       任意内容（class 活注入落内容首根：次要色/间距/防收缩随类落根，恒在子组件\r
       props 轻装饰外侧）；默认出口被子组件默认段替换（继承覆盖，ADR-0081）——\r
       直接实例化时消费方内容同位，三层优先级：消费方内容 > 继承覆盖 > 本空 fallback -->\r
  <!-- 融合动作渲染段（2026-11-16 修订二，ADR-0020 决策 3）：props 驱动非插槽出口——\r
       空 actions 整段 x-if 不渲染（零 DOM）；双段按 pos 过滤分侧，DOM 序恒\r
       [before actions][prefix][body][suffix][after actions]（动作按钮最外层包壳）。\r
       值 = Object.assign 全键透传项（默认 variant: 'secondary' 打底——项显式\r
       variant 胜；button props 全集 + disabled 与 field 联动合并，自有键\r
       pos/name/value 入 button data 域被忽略无害）；按钮宿主自动标\r
       data-autospark-action（点击自理）；x-for 值表达式 = 官方 filter 形态\r
       （引擎 x-for 测试覆盖，with 求值通道响应 actions 注入） -->\r
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
`,ga=`autospark.field`;function _a(e){e.components[ga]=ha}va();function va(){y(e=>{m(e),_a(e)})}var ya=`<!--\r
    autospark.input 输入框（ADR-0020；2026-11-17 修订 ADR-0032——多行能力拆出\r
    autospark.textarea，本组件不再内置 textarea 形态）——原生增强路线：真实原生\r
    input 控件 + 样式包裹，不自绘输入面（保原生可访问性：键盘/IME/自动填充/移动端\r
    兼容，ADR-0018 决策 7）。继承 autospark.field 表单域骨架（状态色通道/焦点态/\r
    disabled 同步/盒饰 chrome，ADR-0020），本组件专注控件本身。\r
\r
    值通道（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件——\r
    宿主为包裹层元素（无原生 value），x-model 写读都落劫持位；内层原生 input 事件\r
    自然冒泡过宿主，x-model 监听直接命中（无需手动派发——原生控件自带 value 语义，\r
    桥比 button-group 组值桥更薄）。value props 为非受控初值/单向同步（受控真相走\r
    x-model）。\r
\r
    表单提交（ADR-0020）：宿主 name 透传到内层原生控件——原生直提交（input 自带\r
    提名义，含 Enter 提交语义；对照 state-button 的 hidden input 桥分叉，本组件\r
    控件即真身无须代理载体）。\r
\r
    事件出口（组件默认封闭，原生事件经冒泡到外层消费）：\r
    - input / change：内层原生控件事件自然冒泡（x-model 与外层 @input/@change 直接消费）\r
    - 清除/眼睛切换为内部动作件（data-autospark-action，点击不转发焦点），不派发自定义事件\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-input + .asc-field-box 盒饰选配）；\r
     变体与状态属性经 mounted 的 JS 通道同步（data-over），根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-input asc-field-box"\r
  x-define="autospark.input"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            type: "text",          // 文本族：text/password/email/tel/url/search 等（透传原生 input type）\r
            value: "",             // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥，ADR-0020）\r
            placeholder: "",       // 占位文案（同步原生 placeholder）\r
            maxlength: 0,          // >0 同步原生 maxlength（原生输入截断）+ 计数分母\r
            clearable: false,      // 清除钮（值非空且可交互时可见；点击清空 + 派发 input + 焦点回控件）\r
            showPassword: false,   // 密码可见切换眼睛钮（仅 type=password 消费，其余形态忽略）\r
            showCount: false,      // 计数器（maxlength 在场显示「len / max」，否则仅 len；超限染 danger）\r
            prefix: "",            // 前置装饰：string 文本 | { icon: "图标名" } 图标（对象经状态引用注入）\r
            suffix: "",            // 后置装饰：形态同 prefix\r
            // —— 内部状态 ——\r
            passwordVisible: false, // 密码可见态（眼睛切换，内层 type password ↔ text）\r
            hasValue: false,        // 当前有值（清除钮可见性驱动；JS 通道随输入维护）\r
            countText: "",          // 计数文本（JS 侧构建——绑定通道对 props 后续注入不重算，ADR-0020）\r
        }),\r
        methods: {\r
            // 清除：清空原生控件 + 手动派发 input（程序赋值不触发原生事件；冒泡过宿主\r
            // 驱动 x-model 回写 state）+ 焦点回控件；阻断冒泡（内部动作件，click 不外泄）\r
            onClear(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled || this.data.readonly) return;\r
                const n = this.el.querySelector(".asc-input-native");\r
                if (!n) return;\r
                n.value = "";\r
                n.dispatchEvent(new Event("input", { bubbles: true }));\r
                n.focus();\r
            },\r
            // 密码可见切换：翻转 passwordVisible + 内层 type password ↔ text + 焦点回控件\r
            onTogglePassword(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled) return;\r
                this.data.passwordVisible = !this.data.passwordVisible;\r
                const n = this.el.querySelector(".asc-input-native");\r
                if (n instanceof HTMLInputElement) {\r
                    n.type = this.data.passwordVisible ? "text" : (this.data.type || "text");\r
                }\r
                if (n) n.focus();\r
            },\r
        },\r
        mounted() {\r
            // —— 内层控件查询（每查现取：运行时控件可能被重建）——\r
            const native = () => this.el.querySelector(".asc-input-native");\r
            // 当前值缓存（劫持 getter 的控件缺位兜底）\r
            let lastValue = "";\r
\r
            // —— 计数与清除可见性同步（len 由原生控件现值读出；超限染色的 data-over\r
            //     落宿主属性，CSS 通道消费——JS 直写无 T4=B 约束）——\r
            const syncLen = () => {\r
                const n = native();\r
                const len = n ? String(n.value ?? "").length : 0;\r
                this.data.hasValue = len > 0;\r
                const max = Number(this.data.maxlength) || 0;\r
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;\r
                this.el.toggleAttribute("data-over", max > 0 && len > max);\r
            };\r
\r
            // —— 值同步（外部 → 控件）——\r
            const syncValue = () => {\r
                const n = native();\r
                if (n) n.value = lastValue;\r
                syncLen();\r
            };\r
\r
            // —— 原生属性同步（props → 控件；绑定通道对 props 晚注入/后续变化不重算，\r
            //     走 JS 通道——button disabled 同款纪律，ADR-0012）——\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                const t = String(this.data.type ?? "text");\r
                if (n instanceof HTMLInputElement) {\r
                    // type 透传（密码可见切换：password + passwordVisible → text）\r
                    n.type = t === "password" && this.data.passwordVisible ? "text" : (t || "text");\r
                }\r
                n.placeholder = String(this.data.placeholder ?? "");\r
                const ml = Number(this.data.maxlength) || 0;\r
                if (ml > 0) n.setAttribute("maxlength", String(ml));\r
                else n.removeAttribute("maxlength");\r
                // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
            // —— 值桥（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件 ——\r
            // 劫持前快照 expando（x-model 编译期可能已写初值——宿主无原生 value，\r
            // 编译期写入落 expando）；无 x-model 时回退 props.value 初值\r
            const prior = this.el.value;\r
            if (typeof prior === "string" && prior !== "") lastValue = prior;\r
            else if (this.data.value != null) lastValue = String(this.data.value);\r
            // 快照归一值 + 初始化窗口标志：编译期初值的**重放识别**。scope.refresh 类机制\r
            // （如 i18n 插件 ready 的首渲染换血）会以当前 state 重跑 x-model 监听，把编译期\r
            // 初值（尤其空串——快照序里是「模型缺席」信号，props 兜底胜出）经劫持 setter 二次\r
            // 落盘，覆盖已按快照序裁定的初值归属。初始化窗口（一跳 setTimeout 前）内与快照\r
            // 归一值同值的写入即重放，跳过；真实状态变化（值不同）不受影响\r
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
            // —— 输入跟随（原生 input 冒泡经宿主）：len 维护（x-model 回写由宿主监听自理）——\r
            this.el.addEventListener("input", () => {\r
                const n = native();\r
                if (n) lastValue = n.value;\r
                syncLen();\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——\r
            setTimeout(() => {\r
                syncAttrs();\r
                syncValue();\r
                initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩（此后全量生效）\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            this.watch("type", () => { setTimeout(() => { syncAttrs(); syncValue(); }, 0); });\r
            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });\r
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });\r
            this.watch("showPassword", () => { setTimeout(syncAttrs, 0); });\r
            // value props 单向同步（非受控/外部受控无 x-model 场景）：变化才写（与自身\r
            // 桥写不冲突——guard 防回环）。已见值比对幂等防御（checkbox 同款）：scope.refresh\r
            // 类无变化重跑（i18n ready 换血等）不得把 x-model expando 注入的初值打回 props\r
            // 缺省空串——先比对已见 props 值，同值跳过\r
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
    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */\r
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
    /* ---------- 动作件（清除/眼睛切换）：内部交互钮，淡色常态 + 悬停正文色 ---------- */\r
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
    /* ---------- 计数器：小一号辅助色；超限（data-over 由 mounted 同步）染 danger ---------- */\r
    .asc-input-count {\r
      flex: none;\r
      margin-left: 0.45em;\r
      font-size: 0.75em;\r
      white-space: nowrap;\r
      color: var(--auto-third-color, var(--asc-input-count, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-input[data-over] .asc-input-count {\r
      color: var(--auto-danger-color, var(--asc-input-count-over, #ef4444));\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
    [dark] .asc-input-count,\r
    [data-dark] .asc-input-count {\r
      color: var(--auto-third-color, var(--asc-input-count, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-input[data-over] .asc-input-count,\r
    [data-dark] .asc-input[data-over] .asc-input-count {\r
      color: var(--auto-danger-color, var(--asc-input-count-over, #e6696a));\r
    }\r
  </style>\r
  <!-- 命名覆盖段（2026-11-16 装饰上提，ADR-0020 修订）：props 前后置装饰经 template\r
         覆盖段上提 field 的 prefix/suffix 出口（继承覆盖链中间层：消费方投影 > 本段\r
         > field 空载体）。注入属性集随段整段替换（ADR-0137 决策三-b：覆盖段即新声明、\r
         不与父合并）——故 class="asc-field-*" 须在本段重声明（次要色/间距/防收缩的\r
         规则载体），落单根容器 .asc-input-affix（活注入取首个元素根，多根裸奔防御）；\r
         装饰缺席容器不渲染 → 出口零 DOM。图标 x-icon 为指令值通道对 props 注入响应；\r
         文本兜底 {{ }} 为插值通道（对象 props 经状态引用注入，文档已声明） -->\r
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
  <!-- 默认段（替换 field 出口 fallback）：控件本体与功能动作件，文档序即呈现序\r
         [控件] [清除] [眼睛] [计数]——props 前后置装饰已上提 field 出口（见上方命名\r
         覆盖段）；功能件（清除/眼睛/计数）刻意留 body：不进可被消费方投影顶掉的\r
         出口 fallback 位（ADR-0020 修订取舍） -->\r
  <input class="asc-input-native" data-autospark-control />\r
  <i\r
    class="asc-input-action asc-input-clear"\r
    data-autospark-action\r
    x-if="clearable && hasValue"\r
    x-icon="'no'"\r
    @click="onClear($event)"\r
  ></i>\r
  <i\r
    class="asc-input-action asc-input-eye"\r
    data-autospark-action\r
    x-if="showPassword && type === 'password'"\r
    x-icon="passwordVisible ? 'input-eye-off' : 'input-eye'"\r
    @click="onTogglePassword($event)"\r
  ></i>\r
  <span class="asc-input-count" x-if="showCount">{{ countText }}</span>\r
</span>\r
`,ba=`autospark.input`,xa=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,Sa=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`,Ca=new Set([`disabled`,`readonly`,`clearable`,`show-password`,`show-count`]);function wa(e){let t=e.icons;t?.add?.(`input-eye`,xa),t?.add?.(`input-eye-off`,Sa),e.components[ba]=ya,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-input`))){let e=document.createElement(`span`),n=[];for(let r of Array.from(t.attributes)){if(r.name.startsWith(`:`)){n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`);continue}if(r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)){e.setAttribute(r.name,r.value);continue}let t=Z(r.name);r.value===``&&Ca.has(r.name)?n.push(`${Q(t)}: true`):n.push(`${Q(t)}: ${JSON.stringify($(r.value))}`)}let r=t.textContent?.trim()??``,i=n.some(e=>e.startsWith(`value:`)),a=t.children.length>0;for(r!==``&&!i&&!a&&(n.push(`value: ${JSON.stringify(r)}`),t.textContent=``),e.setAttribute(`x-component:${ba}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ta();function Ta(){y(e=>{m(e),wa(e)})}var Ea=`<!--
    autospark.textarea 多行文本框（ADR-0032）——原生增强路线：真实原生 <textarea>
    + 样式包裹，不自绘输入面（保原生可访问性：键盘 / IME / 自动填充 / 移动端兼容，
    ADR-0018 决策 7）。继承 autospark.field 表单域骨架（状态色通道 / 焦点态 /
    disabled 同步 / 盒饰 chrome，ADR-0020），本组件专注多行控件本身。

    与 autospark.input 的分工（ADR-0032 推翻 ADR-0020 决策 4「textarea 是 type 变体」）：
    多行能力独立成件，input 不再内置 textarea 形态。两者共享表单域骨架与主题令牌，
    但控件实现、样式细节、测试各自持有——值桥 / 计数 / 清除逻辑按「复制而非嵌套」
    先例在组件内自持（ADR-0021 方法论），避免 textarea → input 的依赖链与单行专属
    逻辑渗透。

    autosize（默认开启）：控件高度随内容自动增长，minRows（缺省取 rows）/ maxRows
    （默认 8，0 = 不限高）夹取，到顶后内部滚动；宽度变化经 ResizeObserver 重算。
    autosize 开启时强制 resize:none；关闭后尊重 resize 属性（缺省 vertical）。

    值通道（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件——
    宿主为包裹层元素（无原生 value），x-model 写读都落劫持位；内层原生 textarea 的
    input 事件自然冒泡过宿主，x-model 监听直接命中。value props 为非受控初值 /
    单向同步（受控真相走 x-model）。

    表单提交（ADR-0020）：宿主 name 透传到内层原生 textarea——原生直提交。

    事件出口（组件默认封闭，原生事件经冒泡到外层消费）：
    - input / change：内层原生控件事件自然冒泡（x-model 与外层 @input/@change 直接消费）
    - 清除为内部动作件（data-autospark-action，点击不转发焦点），不派发自定义事件

    装饰面（ADR-0032）：不提供 prefix / suffix（单行 affix 习惯，多行盒内布局成本高）；
    actions 由 field 骨架继承，但本组件把融合按钮段由横向改排到控件上方 / 下方
    （pos: before 在上、after 在下），不与文本抢行宽。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-textarea + .asc-field-box 盒饰）；
     状态属性经 mounted 的 JS 通道同步（data-over），根上无动态绑定（T4=B） -->
<span
  class="asc-textarea asc-field-box"
  x-define="autospark.textarea"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",             // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥）
            placeholder: "",       // 占位文案（同步原生 placeholder）
            maxlength: 0,          // >0 同步原生 maxlength（原生输入截断）+ 计数分母（自动显示计数）
            rows: 2,               // 初始行数（原生 rows；同时作为 minRows 缺省值）
            minRows: 0,            // autosize 最小行数（0 = 取 rows）
            maxRows: 8,            // autosize 最大行数（0 = 不限高，到顶后内部滚动）
            autosize: true,        // 自动增高（默认开启；开启时强制 resize:none）
            resize: "",            // autosize 关闭时的原生拖拽："" 取 vertical ｜ none | vertical | horizontal | both
            clearable: false,      // 清除钮（值非空且可交互时可见；点击清空 + 派发 input + 焦点回控件）
            showCount: false,      // 计数显式开关（maxlength > 0 时无需开启即显示「len / max」）
            // —— 内部状态 ——
            hasValue: false,       // 当前有值（清除钮可见性驱动）
            countText: "",         // 计数文本（JS 侧构建——绑定通道对 props 后续注入不重算）
            countVisible: false,   // 计数可见性（showCount 或 maxlength > 0）
        }),
        methods: {
            // 清除：清空原生控件 + 手动派发 input（程序赋值不触发原生事件；冒泡过宿主
            // 驱动 x-model 回写 state）+ 焦点回控件；阻断冒泡（内部动作件，click 不外泄）
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
            // —— 内层控件查询（每查现取，家族惯例）——
            const native = () => this.el.querySelector(".asc-textarea-native");
            // 当前值缓存（劫持 getter 的控件缺位兜底）
            let lastValue = "";

            // —— 自动增高：行高 × 行数夹取，内容超高时转内部滚动 ——
            // 宽度变化会改变折行数，故除 value 外还经 ResizeObserver 监听宽度
            const autoResize = () => {
                const n = native();
                if (!n) return;
                if (!this.data.autosize) {
                    // 交还原生拖拽：清内联高度 + 溢出转 auto（基类样式为 autosize
                    // 场景预设 overflow-y:hidden，关闭后须显式放开，否则内容被裁）
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
                // 行高不可读（consumer 把 line-height 设为 normal 等 → parseFloat 得 NaN）
                // 时放弃行数夹取：只随内容增高，避免 maxHeight 退化成内距高而误裁内容
                const minHeight = lineHeight > 0 ? lineHeight * minRows + padY + borderY : 0;
                const maxHeight =
                    lineHeight > 0 && maxRows > 0
                        ? lineHeight * maxRows + padY + borderY
                        : Infinity;
                n.style.height = "auto"; // 先归零再量内容（scrollHeight 才反映真实内容高）
                const contentHeight = n.scrollHeight + borderY;
                n.style.height = \`\${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px\`;
                n.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
            };

            // —— 计数与清除可见性同步（len 由原生控件现值读出；超限染色的 data-over
            //     落宿主属性，CSS 通道消费——JS 直写无 T4=B 约束）——
            const syncLen = () => {
                const n = native();
                const len = n ? String(n.value ?? "").length : 0;
                this.data.hasValue = len > 0;
                const max = Number(this.data.maxlength) || 0;
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;
                this.data.countVisible = !!this.data.showCount || max > 0;
                this.el.toggleAttribute("data-over", max > 0 && len > max);
            };

            // —— 值同步（外部 → 控件）——
            const syncValue = () => {
                const n = native();
                if (n) n.value = lastValue;
                syncLen();
                autoResize();
            };

            // —— 原生属性同步（props → 控件；绑定通道对 props 晚注入/后续变化不重算，
            //     走 JS 通道——button disabled 同款纪律，ADR-0012）——
            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                n.placeholder = String(this.data.placeholder ?? "");
                const ml = Number(this.data.maxlength) || 0;
                if (ml > 0) n.setAttribute("maxlength", String(ml));
                else n.removeAttribute("maxlength");
                n.rows = Math.max(1, Number(this.data.rows) || 2);
                // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
                // autosize 与原生拖拽互斥：开启时强制 none，关闭后尊重 resize 属性
                n.style.resize = this.data.autosize
                    ? "none"
                    : String(this.data.resize) || "vertical";
                autoResize();
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
                    autoResize();
                },
                configurable: true,
            });

            // —— 输入跟随（原生 input 冒泡经宿主）：值缓存 / 计数 / 自动增高 ——
            this.el.addEventListener("input", () => {
                const n = native();
                if (n) lastValue = n.value;
                syncLen();
                autoResize();
            });

            // —— 宽度变化重算（侧栏展开 / 窗口缩放改变折行数；只认宽度变化，避免
            //     自身写高度触发回环）——
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

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                syncAttrs();
                syncValue();
                initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩（此后全量生效）
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });
            this.watch("showCount", () => { setTimeout(syncLen, 0); });
            this.watch("rows", () => { setTimeout(() => { syncAttrs(); autoResize(); }, 0); });
            this.watch("minRows", () => { setTimeout(autoResize, 0); });
            this.watch("maxRows", () => { setTimeout(autoResize, 0); });
            this.watch("autosize", () => { setTimeout(syncAttrs, 0); });
            this.watch("resize", () => { setTimeout(syncAttrs, 0); });
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
                autoResize();
            });
        },
    }
  <\/script>
  <style global id="autospark-components-textarea">
    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */
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

    /* ---------- 宿主布局：纵向排布（控件 + 计数浮层 + actions 段），高度随内容放开 ---------- */
    .asc-textarea.asc-field-box {
      position: relative;
      height: auto;
      flex-direction: column;
      align-items: stretch;
      cursor: text;
    }

    /* ---------- 清除钮：绝对定位右上角（不占文本行宽；控件右侧预留内距避免压字） ---------- */
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

    /* 浮层在场时预留内距（:has 驱动，形态与 field 既有 :has 用法一致） */
    .asc-textarea:has(.asc-textarea-clear) .asc-textarea-native {
      padding-inline-end: 1.5em;
    }
    .asc-textarea:has(.asc-textarea-count) .asc-textarea-native {
      padding-block-end: 1.25em;
    }

    /* ---------- actions 段：field 的横向融合在本组件改为控件上 / 下整行（pos: before 在上、
         after 在下，右对齐）——按钮恢复自有描边与圆角，不与文本抢行宽。field 的融合规则
         用 !important 解除（选择器特异性跨产物顺序不稳定，显式让位最稳） ---------- */
    .asc-textarea .asc-field-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4em;
      justify-content: flex-end;
      width: 100%;
    }
    .asc-textarea .asc-field-actions-before {
      order: -1;
      margin-block-end: 0.4em;
    }
    .asc-textarea .asc-field-actions-after {
      margin-block-start: 0.4em;
    }
    .asc-textarea .asc-field-actions .asc-field-action {
      align-self: center !important;
      margin: 0 !important;
      border-width: var(--auto-border-size, var(--asc-field-border-size, 1px)) !important;
      border-style: solid !important;
      border-radius: var(--auto-border-radius, var(--asc-field-radius, 0.5rem)) !important;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 默认段（替换 field 出口 fallback）：控件本体 + 功能动作件。计数与清除为浮层
       （不占文本行宽）；actions 由 field 渲染段承载，位置由上方 CSS 改为控件上 / 下 -->
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
`,Da=`autospark.textarea`,Oa=new Set([`disabled`,`readonly`,`clearable`,`show-count`,`autosize`]);function ka(e){e.components[Da]=Ea,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-textarea`))){let e=document.createElement(`span`),n=[];for(let r of Array.from(t.attributes)){if(r.name.startsWith(`:`)){n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`);continue}if(r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)){e.setAttribute(r.name,r.value);continue}let t=Z(r.name);r.value===``&&Oa.has(r.name)?n.push(`${Q(t)}: true`):n.push(`${Q(t)}: ${JSON.stringify($(r.value))}`)}let r=t.textContent?.trim()??``,i=n.some(e=>e.startsWith(`value:`)),a=t.children.length>0;for(r!==``&&!i&&!a&&(n.push(`value: ${JSON.stringify(r)}`),t.textContent=``),e.setAttribute(`x-component:${Da}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Aa();function Aa(){y(e=>{m(e),ka(e)})}var ja=`<!--\r
    autospark.checkbox 复选框（ADR-0019 合批 / ADR-0020 Field 消费契约）——原生增强\r
    路线：真实原生 \`<input type="checkbox">\` + 自绘视觉（勾形 / 半选横线经 CSS 伪元素，\r
    选中态由 :checked / :indeterminate 原生伪类驱动——键盘 / 焦点 / 表单提交 / 组语义等\r
    原生能力全保留，ADR-0018 决策 7）。\r
\r
    值通道（x-model 兼容协议）：宿主 el.value 劫持为布尔语域（"true"/"false"，配\r
    x-model.boolean 保真——state-button 布尔组桥同款）；原生 change 冒泡过宿主时派发\r
    input（x-model 监听在宿主自身回写 state）。checked props 为非受控初值 / 单向同步值\r
    （受控真相走宿主 x-model，input value 同款边界）。\r
\r
    表单提交：内层真 input 即提交载体（勾选提交 name=true、未勾选不提交——原生 checkbox\r
    语义，无须代理，ADR-0020 决策 6）；宿主 name 透传（x-model 缺省注入 name=路径亦经\r
    此通道落内层）。\r
\r
    indeterminate 半选：JS 通道设原生 indeterminate 属性（无 HTML 属性形态），视觉经\r
    :indeterminate 伪类（真实浏览器支持）；点击半选态 → 勾选（原生行为）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-checkbox——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；勾选/半选视觉由原生伪类 +\r
     :has() 驱动，宿主 data-* 状态属性由骨架 / JS 通道同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-checkbox"\r
  x-define="autospark.checkbox"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",            // 兜底文案（默认插槽内容优先；用户传入，无 i18n）\r
            checked: false,       // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 布尔语域桥）\r
            indeterminate: false, // 半选态（JS 通道设原生 indeterminate 属性；点击后按原生行为转为勾选/未勾）\r
        }),\r
        mounted() {\r
            // —— 内层原生控件查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——\r
            const native = () => this.el.querySelector(".asc-checkbox-input");\r
            // 当前勾选缓存（劫持 getter 的控件缺位兜底）\r
            let lastChecked = false;\r
\r
            // —— 原生属性同步：提交值恒 "true"（原生 checkbox 语义：勾选提交 name=true、\r
            //     未勾选不提交）；宿主 name 透传（x-model 缺省注入 name=路径同经此落内层）——\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                n.value = "true";\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false" ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）\r
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
            // —— DOM→state 桥：原生 change 冒泡过宿主 → 派发 input（x-model 监听在宿主\r
            //     自身，读劫持 el.value 回写；state-button 同款非冒泡形态）。原生 change\r
            //     继续冒泡，外层 @change 直接消费；仅认内层控件事件（宿主自身 change 直通）\r
            this.el.addEventListener("change", (e) => {\r
                if (e.target !== native()) return;\r
                const n = native();\r
                if (n) lastChecked = n.checked;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——\r
            setTimeout(() => {\r
                const n = native();\r
                if (n) {\r
                    n.checked = lastChecked;\r
                    n.indeterminate = !!this.data.indeterminate;\r
                }\r
                syncAttrs();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，解构取值——家族惯用法）——\r
            // checked 单向同步（无 x-model 场景）：变化才写（程序赋值不触发原生事件，无回环）。\r
            // 已见值比对幂等防御：scope.refresh 等机制会以**当前值**重跑监听（如 i18n 插件\r
            // ready 的首渲染换血），无变化重跑若照常落盘，会把 x-model expando 注入的勾选\r
            // 初值打回 props 缺省值 false——同值跳过（真实变化才推进）\r
            let lastPropsChecked = !!this.data.checked;\r
            this.watch("checked", ({ value }) => {\r
                const v = !!value;\r
                if (v === lastPropsChecked) return;\r
                lastPropsChecked = v;\r
                lastChecked = v;\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
            });\r
            // indeterminate：JS 通道设原生属性（该属性无 HTML 属性形态，纯 property）\r
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
    /* ---------- 勾形（::before 两边框旋转，勾选态 scale 展开）与半选横线（::after） ---------- */\r
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
    /* 半选与勾选并置时半选视觉优先（原生呈现惯例：indeterminate 覆盖 checked 勾形） */\r
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::before {\r
      transform: rotate(45deg) scale(0);\r
    }\r
\r
    /* ---------- 交互态 ---------- */\r
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
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（勾选 tone 保留可辨）+ 禁点光标 */\r
    .asc-checkbox[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-checkbox[data-disabled] .asc-checkbox-wrap {\r
      cursor: not-allowed;\r
    }\r
\r
    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */\r
    .asc-checkbox-label:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 默认段（替换 field 出口 fallback）：label 包裹的真实 checkbox + 自绘盒子 + 文案。\r
         勾形/半选视觉由原生伪类 :checked/:indeterminate 经 :has() 驱动（真实浏览器支持）。\r
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056 内容分段仅认直接子级）——\r
         消费者内容经 field 出口整段替换控件区（逃生通道，input 同款语义），\r
         故文案走 props（{{ label }} 插值兜底）不开真插槽 -->\r
  <label class="asc-checkbox-wrap">\r
    <span class="asc-checkbox-box">\r
      <input type="checkbox" class="asc-checkbox-input" data-autospark-control />\r
    </span>\r
    <span class="asc-checkbox-label">{{ label }}</span>\r
  </label>\r
</span>\r
`,Ma=`autospark.checkbox`;function Na(e){e.components[Ma]=ja}Pa();function Pa(){y(e=>{m(e),Na(e)})}var Fa=`<!--\r
    autospark.radio 单选钮（ADR-0019 合批 / ADR-0020 Field 消费契约）——原生增强\r
    路线：真实原生 \`<input type="radio">\` + 自绘视觉（选中圆点经 CSS 伪元素，选中态由\r
    :checked 原生伪类驱动——键盘 / 焦点 / 表单提交 / 组互斥等原生能力全保留）。\r
\r
    组语义（不建组容器组件）：**原生 name 同名互斥**——同 x-model 路径的多枚实例经引擎\r
    缺省 name 注入（name=路径）天然同组；或宿主显式写 name。组样式编排（纵排/横排/间距）\r
    用 space 组件 / flex 容器配方（组件文档给出配方示例）。受控单选组（按钮形态）由\r
    button-group 选中模式承接（先例）。\r
\r
    值通道（x-model 兼容协议，checked 值桥）：宿主 el.value 读 = 本钮 value、写 = 按值\r
    匹配勾选（state === 本钮 value）——与 x-model 原生 radio 读写语义同构。勾选变化经\r
    原生 change 冒泡过宿主时派发 input（仅勾选态派发，取消态由被勾选的另一枚接管）。\r
    checked props 为非受控初值 / 单向同步值（受控真相走宿主 x-model）。\r
\r
    表单提交：内层真 input 即提交载体（组内勾选项提交 name=value——原生 radio 语义，\r
    ADR-0020 决策 6）；宿主 name 透传（x-model 缺省注入 name=路径亦经此通道落内层）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-radio——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；选中视觉由原生伪类 + :has()\r
     驱动，宿主 data-* 状态属性由骨架 / JS 通道同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-radio"\r
  x-define="autospark.radio"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",      // 兜底文案（默认插槽内容优先；用户传入，无 i18n）\r
            value: "",      // 本钮值（组内唯一标识；x-model 按值匹配勾选、勾选时写 state = 此值）\r
            checked: false, // 非受控初值 / 单向同步值（受控真相走宿主 x-model；组内缺省勾选项用）\r
        }),\r
        mounted() {\r
            // —— 内层原生控件查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——\r
            const native = () => this.el.querySelector(".asc-radio-input");\r
            // 本钮值（props.value 现读——不缓存，props 变化时劫持通道取最新）\r
            const radioValue = () => String(this.data.value ?? "");\r
            // 当前勾选缓存（劫持 getter 的控件缺位兜底）\r
            let lastChecked = false;\r
\r
            // —— 原生属性同步：本钮 value 落内层（x-model 按值匹配的锚点）；宿主 name\r
            //     透传（x-model 缺省注入 name=路径同经此落内层——同名即组，原生互斥）——\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                n.value = radioValue();\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
            // —— 值桥（checked 值桥）：宿主 el.value 读 = 本钮 value（勾选时 x-model 写\r
            //     state 的值）、写 = 按值匹配勾选（与 x-model 原生 radio 语义同构）——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）\r
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
            // —— DOM→state 桥：原生 change 冒泡过宿主 → **仅勾选态**派发 input（x-model\r
            //     监听在宿主自身，读劫持 el.value（= 本钮 value）回写；取消态不派发——\r
            //     被勾选的另一枚接管，x-model 原生 radio 同款语义）。原生 change 继续\r
            //     冒泡，外层 @change 直接消费；仅认内层控件事件（宿主自身 change 直通）\r
            this.el.addEventListener("change", (e) => {\r
                if (e.target !== native()) return;\r
                const n = native();\r
                if (!n || !n.checked) return;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——\r
            setTimeout(() => {\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
                syncAttrs();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，解构取值——家族惯用法）——\r
            // checked 单向同步（无 x-model 场景）：变化才写（程序赋值不触发原生事件，无回环）。\r
            // 已见值比对幂等防御（checkbox 同款）：scope.refresh 类无变化重跑（i18n ready\r
            // 换血等）不得把 x-model expando 按值匹配的勾选初值打回 props 缺省值\r
            let lastPropsChecked = !!this.data.checked;\r
            this.watch("checked", ({ value }) => {\r
                const v = !!value;\r
                if (v === lastPropsChecked) return;\r
                lastPropsChecked = v;\r
                lastChecked = v;\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
            });\r
            // value 变化：内层锚点值更新 + 重对齐勾选（x-model 值匹配语义的静态等价）\r
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
        var(--auto-border-color, var(--asc-radio-border, #d9d9d9));\r
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
\r
    /* ---------- 状态色（骨架通道）：status 在场边框染 tone（裸态控件只消费 tone 不吃 chrome）；\r
             选中底色恒 tone（缺省主色，error/success/warning 随动——选中态语义色联动） ---------- */\r
    .asc-radio[data-status] .asc-radio-box {\r
      border-color: var(--asc-field-tone);\r
    }\r
    .asc-radio-box:has(> .asc-radio-input:checked) {\r
      border-color: var(--asc-field-tone);\r
    }\r
\r
    /* ---------- 选中圆点（::after，选中态展开） ---------- */\r
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
    /* ---------- 交互态 ---------- */\r
    .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)) {\r
      border-color: var(--auto-hover-border-color, var(--asc-radio-hover-border, #4098fc));\r
    }\r
    /* 键盘焦点环（data-focus 由骨架 focusin/focusout 同步——鼠标点击聚焦亦点亮，\r
         与盒饰类控件的焦点语义一致）；禁用不点环 */\r
    .asc-radio[data-focus]:not([data-disabled]) .asc-radio-box {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（选中 tone 保留可辨）+ 禁点光标 */\r
    .asc-radio[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-radio[data-disabled] .asc-radio-wrap {\r
      cursor: not-allowed;\r
    }\r
\r
    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */\r
    .asc-radio-label:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-radio-box,\r
    [data-dark] .asc-radio-box {\r
      border-color: var(--auto-border-color, var(--asc-radio-border, #52525b));\r
      background: var(--auto-bgcolor, var(--asc-radio-bg, #3a3a3a));\r
    }\r
    [dark] .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)),\r
    [data-dark] .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)) {\r
      border-color: var(--auto-hover-border-color, var(--asc-radio-hover-border, #4098fc));\r
    }\r
  </style>\r
  <!-- 默认段（替换 field 出口 fallback）：label 包裹的真实 radio + 自绘圆环 + 文案。\r
         选中圆点视觉由原生伪类 :checked 经 :has() 驱动（真实浏览器支持）。\r
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 field\r
         出口整段替换控件区（逃生通道，input 同款语义），文案走 props 兜底不开真插槽 -->\r
  <label class="asc-radio-wrap">\r
    <span class="asc-radio-box">\r
      <input type="radio" class="asc-radio-input" data-autospark-control />\r
    </span>\r
    <span class="asc-radio-label">{{ label }}</span>\r
  </label>\r
</span>\r
`,Ia=`autospark.radio`;function La(e){e.components[Ia]=Fa}Ra();function Ra(){y(e=>{m(e),La(e)})}var za=`<!--\r
    autospark.switch 开关（ADR-0019 合批 / ADR-0020 Field 消费契约）——**自绘开关**\r
    （无原生对应控件）：轨道 + 滑块纯 CSS 自绘，可访问性自持——role="switch" +\r
    aria-checked + tabindex + 键盘 Space/Enter 切换（原生 checkbox 方案的对照：彼保真\r
    原生语义、此自持语义，ADR-0018 决策 7 表单基座策略内的例外形态）。\r
\r
    值通道（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false"（配\r
    x-model.boolean 保真——state-button 布尔组桥同款）；切换派发 input（x-model 回写，\r
    监听在宿主自身非冒泡形态）+ change（detail = { value } 新布尔值，冒泡供外层消费）。\r
    checked props 为非受控初值 / 单向同步值（受控真相走宿主 x-model）。\r
\r
    表单提交：内嵌 input[type=hidden] 载体（data-autospark-control 标记——骨架 disabled\r
    同步落载体，禁用即出表），value = 当前布尔字面串恒提交、name 透传宿主（state-button\r
    N>2 表单桥同构——value 是受控真相原样提交，true/false 值域服务端约定）。\r
\r
    交互面：整组热区（轨道 + 文案都触发切换，宿主级事件委托）；loading 态滑块转 CSS\r
    旋转圈并阻断切换；disabled（骨架通道）阻断 + 淡化；readonly 亦阻断（值不可变语义）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-switch——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；data-checked / data-loading\r
     由 mounted JS 通道同步（无 T4=B 约束），根上无动态绑定 -->\r
<span\r
  class="asc-switch"\r
  x-define="autospark.switch"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",     // 兜底文案（默认插槽内容优先；用户传入，无 i18n）\r
            checked: false,// 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 布尔语域桥）\r
            loading: false,// 加载态：滑块转 CSS 旋转圈 + 阻断切换（视觉优先于 disabled，不淡化）\r
        }),\r
        mounted() {\r
            // —— 内层元素查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——\r
            const track = () => this.el.querySelector(".asc-switch-track");\r
            const carrier = () => this.el.querySelector(".asc-switch-carrier");\r
\r
            // —— 全视觉同步（按 data 现值求值，幂等）：aria 语义 + 宿主状态属性 + 表单载体 ——\r
            const syncVisual = () => {\r
                const on = !!this.data.checked;\r
                const t = track();\r
                if (t) {\r
                    t.setAttribute("aria-checked", String(on));\r
                    // 可访问性：loading 亦不可交互（aria-disabled 联动 disabled/loading）\r
                    t.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.loading)));\r
                    if (this.data.status === "error") t.setAttribute("aria-invalid", "true");\r
                    else t.removeAttribute("aria-invalid");\r
                }\r
                const c = carrier();\r
                if (c) {\r
                    // 提交载体恒随（hidden 恒提交当前布尔；禁用出表由骨架同步，此处双保险）\r
                    c.value = String(on);\r
                    c.disabled = !!this.data.disabled;\r
                }\r
                this.el.toggleAttribute("data-checked", on);\r
                this.el.toggleAttribute("data-loading", !!this.data.loading);\r
            };\r
\r
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false" ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）\r
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
            // —— 切换动作：可交互判定（disabled / readonly / loading 均阻断）→ 翻转 →\r
            //     双派发（input→x-model 回写非冒泡；change→外层消费 detail={value}）——\r
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
            // —— 交互接入（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：\r
            //     整组热区（轨道 + 文案都触发）；键盘 Space/Enter（自绘控件自持，\r
            //     role=switch 交互约定；Space 阻断页面滚动）——\r
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
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：初值落定 +\r
            //     宿主 name 透传到表单载体 + 首次视觉同步 ——\r
            setTimeout(() => {\r
                this.data.checked = initChecked;\r
                const c = carrier();\r
                const nameAttr = this.el.getAttribute("name");\r
                if (c && nameAttr != null) c.name = nameAttr;\r
                syncVisual();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
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
    /* 滑块：白色恒定设计（暗色不换——与背景形成恒定对比）；位移 = 轨道宽 - 高（对称内距） */\r
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
    /* ---------- 交互态 ---------- */\r
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——轨道可聚焦即点亮）；禁用不点环 */\r
    .asc-switch[data-focus]:not([data-disabled]) .asc-switch-track {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点光标 */\r
    .asc-switch[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-switch[data-disabled] .asc-switch-wrap {\r
      cursor: not-allowed;\r
    }\r
    /* loading 光标进度态（不淡化） */\r
    .asc-switch[data-loading] .asc-switch-wrap {\r
      cursor: progress;\r
    }\r
\r
    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */\r
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
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden，骨架 disabled 同步目标）+\r
         轨道交互件（role=switch 可聚焦）+ 文案。开态/loading 视觉由宿主 data-* 属性驱动。\r
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 field\r
         出口整段替换控件区（逃生通道，input 同款语义），文案走 props 兜底不开真插槽 -->\r
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
`,Ba=`autospark.switch`;function Va(e){e.components[Ba]=za}Ha();function Ha(){y(e=>{m(e),Va(e)})}var Ua=`<!--\r
    autospark.input-number 数字输入框（ADR-0018 决策 7 原生增强）——真实原生 input\r
    （inputmode=decimal，键盘/IME/自动填充全保留）+ 盒饰包裹 + 步进钮组。复制 input\r
    结构而非嵌套消费（值桥语域分叉 + 自包含产物，见 index.ts 头注释）；继承\r
    autospark.field 骨架（状态色/焦点态/disabled 同步/盒饰 chrome，ADR-0020）。\r
\r
    值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域（""=空）——\r
    - 输入过程（原生 input 冒泡，组件 capture 先于 x-model 冒泡监听更新缓存）：\r
      合法即缓存（不夹取不修约，"1." / "-" 等中间态自由显示）、清空归 null、\r
      其余非法字符保持旧值（antd 同款语义）；\r
    - change（原生 change = blur/Enter，capture 归位后阻断重派发）：夹取（min/max）\r
      + 修约（precision）+ 规范文本 + 派发 change detail={ value }（冒泡供外层\r
      @change="v = $event.detail.value" 一行回写）；\r
    - 步进（钮点击 / ArrowUp·ArrowDown）：基值 = 当前值 ?? min ?? 0，按 step 步进\r
      后夹取修约，双派发（input→x-model 回写非冒泡 + change detail）；\r
    - NaN 防御：一切外部值（props.value / setter / 文本解析）经归一函数，非法得\r
      null 保持空态。\r
\r
    表单提交（ADR-0020 决策 6 同款）：宿主 name 透传到内层原生控件——原生直提交\r
    （控件即真身，无须 hidden 代理）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-input-number + .asc-field-box 盒饰）；\r
     aria/state 属性经 mounted JS 通道同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-input-number asc-field-box"\r
  x-define="autospark.input-number"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: null,      // number 非受控初值 / 单向同步值（NaN 防御：非法解析忽略保持空；受控真相走宿主 x-model）\r
            min: null,        // 下界（null 无界；非数字忽略）\r
            max: null,        // 上界（null 无界；非数字忽略）\r
            step: 1,          // 步长（<=0 或非法视为 1）\r
            precision: -1,    // 小数位（<0 自适应不修约；>=0 固定小数位——显示与修约双通道）\r
            controls: true,   // 步进钮组开关（false 时纯数字输入形态）\r
            placeholder: "",  // 占位文案（同步原生属性，用户传入无 i18n）\r
        }),\r
        mounted() {\r
            // —— 内层控件查询（每查现取，家族纪律——控件可能随形态重建）——\r
            const native = () => this.el.querySelector(".asc-input-number-native");\r
\r
            // —— 数值工具（NaN 防御核心：一切外部输入经归一，非法得 null）——\r
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
            // 固定小数位取值（<0 自适应直通）\r
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
            // —— 合法值缓存（受控语域真相；null = 空）——\r
            let lastValue = null;\r
\r
            // —— 显示写（等值短路：显示文本已是目标形态不重写——中间态保护）——\r
            const show = (n) => {\r
                const el = native();\r
                if (!el) return;\r
                const t = fmt(n);\r
                if (el.value !== t) el.value = t;\r
            };\r
\r
            // —— 全视觉同步：role=spinbutton aria 语义 + 宿主状态属性 ——\r
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
            // —— 提交（值落定 + 双派发：input→x-model 回写非冒泡；change→外层 detail={value}）——\r
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
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域（""=空）——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.value 初值（劫持快照序：expando > props.value，input 同款）。\r
            //     初值在劫持安装前同步落定（mounted 时 props 可能晚注入——由 watch("value")\r
            //     兜底；不得延后到一跳再赋值，会踩掉外部联动方在 mounted~setTimeout 间\r
            //     经劫持 setter 写入的值，slider showInput 联动即此场景）\r
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            lastValue = initV != null ? fix(clamp(initV)) : null;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => (lastValue == null ? "" : String(lastValue)),\r
                set: (v) => {\r
                    const n = fix(clamp(num(v)));\r
                    if (n === lastValue) return; // 等值短路（不动显示——输入中间态保护）\r
                    lastValue = n;\r
                    show(n);\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            // —— 输入跟随（capture 先于 x-model 冒泡监听：缓存先更新，x-model 读到新值）——\r
            //     合法即缓存（不夹取不修约）；清空归 null；其余非法保持旧值\r
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
            // —— 确认归位（原生 change = blur/Enter）：夹取 + 修约 + 规范文本 + 重派发 detail ——\r
            //     capture 阶段先归位再阻断（x-model.lazy 的宿主冒泡监听读到的是归位后\r
            //     的劫持 getter；原生 change 不外泄，恒派发自定义 detail 版本）\r
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
            // —— 步进（dir: 1 上 / -1 下）：基值空时从 min（无 min 从 0）起；边界顶死不派发 ——\r
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
            // —— 交互接入（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：\r
            //     步进钮点击（内部动作件，click 不外泄）+ 键盘 ArrowUp/ArrowDown ——\r
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
                    e.preventDefault(); // 阻断光标移首行为\r
                    stepBy(1);\r
                } else if (e.key === "ArrowDown") {\r
                    e.preventDefault();\r
                    stepBy(-1);\r
                }\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：属性同步 +\r
            //     首次视觉落位（lastValue 已在劫持安装前落定，此处不重算——防踩联动值）——\r
            setTimeout(() => {\r
                const el = native();\r
                if (el) {\r
                    el.placeholder = String(this.data.placeholder ?? "");\r
                    el.setAttribute("role", "spinbutton");\r
                    // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）\r
                    const nameAttr = this.el.getAttribute("name");\r
                    if (nameAttr != null) el.name = nameAttr;\r
                }\r
                show(lastValue);\r
                syncVisual();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            // value 单向同步（无 x-model 场景）：变化才写（与劫持 setter 等值短路防回环）。\r
            // 已见值比对幂等防御（input 同款）：scope.refresh 类无变化重跑（i18n ready\r
            // 换血等）不得把 x-model expando 注入的初值打回 props 缺省 null\r
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
            // 边界变化：当前值即时夹取（越界值归位）+ aria 同步\r
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
    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */\r
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
    /* 上下钮夹一条淡分隔线（与组左边线同源淡色） */\r
    .asc-input-number-up {\r
      border-bottom: var(--auto-border-size, var(--asc-input-number-border-size, 1px)) solid\r
        color-mix(in srgb, var(--auto-border-color, var(--asc-input-number-border, #d9d9d9)) 55%, transparent);\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：钮禁点 + 光标随盒饰禁用态 */\r
    .asc-input-number[data-disabled] .asc-input-number-btn {\r
      cursor: not-allowed;\r
      color: var(--auto-disable-color, var(--asc-input-number-step-disable, rgba(0, 0, 0, 0.25)));\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 默认段（替换 field 出口 fallback）：原生控件 + 步进钮组。钮上 aria-hidden\r
         （纯视觉件，键盘等价通道 ArrowUp/ArrowDown 在控件上承载） -->\r
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
`,Wa=`autospark.input-number`;function Ga(e){e.components[Wa]=Ua}Ka();function Ka(){y(e=>{m(e),Ga(e)})}var qa=`<!--\r
    autospark.slider 滑动条（ADR-0018 决策 7 原生增强）——真实原生 <input type=range>\r
    藏起仍可交互（opacity:0 覆盖层：点击跳值/拖拽跟随/键盘方向键/触屏原生行为与\r
    可访问性全保留），轨道/已填充段/滑块视觉自绘。继承 autospark.field 骨架\r
    （状态色通道/焦点态/disabled 同步，裸态无盒饰，ADR-0020）。\r
\r
    值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域——原生 input 事件自然\r
    冒泡过宿主被 x-model 直接监听（原生控件自带 value 语义，桥比 button-group 更薄，\r
    ADR-0020 决策 5 同款）；change（松手确认）capture 归位（clamp + step 刻度防御）\r
    后阻断重派发 detail={ value }（外层 @change="v = $event.detail.value" 一行回写）。\r
\r
    表单提交：宿主 name 透传到内层 range——原生直提交（range 是原生表单控件自带\r
    提名义，控件即真身无须 hidden 代理，ADR-0020 决策 6 同款；对照 switch 自绘控件\r
    的 hidden 载体分叉）。\r
\r
    视觉同步：填充段宽度与滑块位置同源（--asc-slider-pos 百分比变量挂轨道，JS 通道\r
    随 input/setter/watch 维护）；readonly 无原生语义（range 忽略 readOnly），JS 通道\r
    pointer-events 阻断交互。\r
\r
    showInput（可选）：在场渲染 autospark.input-number 双向联动——跨产物组合（模板\r
    字符串引用不构成构建依赖），按需加载场景须同引 autospark.input-number.js。\r
    range 双滑块 P3 按需（ADR-0018 边界声明）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-slider——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；data-readonly/data-disabled\r
     由骨架反射，--asc-slider-pos 由 mounted JS 通道同步，根上无动态绑定（T4=B） -->\r
<span class="asc-slider" x-define="autospark.slider" x-define:inherit="autospark.field">\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: 0,        // number 非受控初值 / 单向同步值（NaN 防御：非法归 min；受控真相走宿主 x-model）\r
            min: 0,          // 下界\r
            max: 100,        // 上界（<= min 时视为 min + 1 防除零）\r
            step: 1,         // 步长（<=0 或非法视为 1）\r
            showInput: false,// 数值输入联动（在场渲染 autospark.input-number；须同引其产物）\r
        }),\r
        mounted() {\r
            // —— 内层元素查询（每查现取，家族纪律）——\r
            const native = () => this.el.querySelector(".asc-slider-native");\r
            const track = () => this.el.querySelector(".asc-slider-track");\r
            // showInput 联动宿主（化身后的 autospark.input-number 根，自有 el.value 劫持）\r
            const numHost = () => this.el.querySelector(".asc-input-number");\r
\r
            // —— 数值工具（NaN 防御：非法值归界值，恒不抛）——\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const bounds = () => {\r
                let mn = num(this.data.min) ?? 0;\r
                let mx = num(this.data.max) ?? 100;\r
                if (mx <= mn) mx = mn + 1; // 除零/倒界防御\r
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
            // —— 原生属性同步（props → range：min/max/step 原生刻度语义）——\r
            const syncAttrs = () => {\r
                const r = native();\r
                if (!r) return;\r
                const [mn, mx] = bounds();\r
                r.min = String(mn);\r
                r.max = String(mx);\r
                r.step = String(stepSize());\r
                // 表单提交载体：宿主 name 透传到 range（原生直提交）\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) r.name = nameAttr;\r
            };\r
\r
            // —— 视觉同步：填充/滑块位置百分比（同源变量挂轨道）——\r
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
            // —— 值写（受控语义：clamp 后落原生控件 + 视觉）——\r
            const setVal = (v, { fromNum = false } = {}) => {\r
                const n = clamp(num(v) ?? bounds()[0]);\r
                const r = native();\r
                if (r) r.value = String(n);\r
                syncVisual();\r
                if (!fromNum) {\r
                    const nh = numHost();\r
                    if (nh) nh.value = String(n); // 联动输入框（写其劫持 setter，不派发无回环）\r
                }\r
            };\r
\r
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域 ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.value 初值（劫持快照序：expando > props.value，input 同款）\r
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
            // —— 拖动跟随（原生 input 冒泡过宿主；capture 先于 x-model 冒泡监听）：\r
            //     视觉 + showInput 联动（x-model 回写由宿主监听自理）——\r
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
            // —— 确认归位（原生 change = 松手）：clamp 防御 + 阻断重派发 detail ——\r
            //     capture 阶段先归位再阻断（x-model.lazy 读到归位后的劫持 getter）\r
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
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——\r
            setTimeout(() => {\r
                syncAttrs();\r
                setVal(initV != null ? initV : bounds()[0]);\r
                // showInput 联动接线（其组件劫持已就位）：初值下发 + 输入侧反向同步\r
                // （input-number 的 input 派发非冒泡在自身——直接挂其宿主监听；\r
                // 程序赋值不触发事件，天然无回环）\r
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
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            // value 单向同步（无 x-model 场景）：变化才写（劫持 setter 不派发，无回环）\r
            this.watch("value", ({ value: v }) => {\r
                const n = num(v);\r
                if (n == null) return;\r
                const r = native();\r
                if (r && num(r.value) === clamp(n)) return;\r
                setVal(n);\r
            });\r
            // 边界/步长变化：属性重同步 + 当前值夹取归位\r
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
    /* 已填充段：tone 色（缺省主色，status 在场随 --asc-field-tone 联动——骨架通道） */\r
    .asc-slider-fill {\r
      position: absolute;\r
      inset-block: 0;\r
      inset-inline-start: 0;\r
      width: var(--asc-slider-pos);\r
      border-radius: 9999px;\r
      background: var(--asc-field-tone);\r
    }\r
    /* 滑块：白底细边 tone（暗色不换——恒定对比设计，switch 滑块同款）；尺寸 em 基准 */\r
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
      pointer-events: none; /* 命中交给覆盖层原生 range（拖拽语义原生承载） */\r
    }\r
    /* 原生 range：透明覆盖层（藏起仍可交互——点击/拖拽/键盘/触屏原生行为全保留） */\r
    .asc-slider-native {\r
      position: absolute;\r
      inset: -0.5em 0; /* 纵向命中区放大（滑块直径溢出轨道高） */\r
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
    /* 禁用（骨架通道 [data-disabled]：range.disabled 原生阻断 + 宿主反射）：淡化 + 禁点 */\r
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
    /* ---------- showInput 联动框：定宽收窄（数值场景无需通栏） ---------- */\r
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
  <!-- 默认段（替换 field 出口 fallback）：轨道（自绘视觉 + 原生覆盖层）+\r
         可选联动输入框。注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——\r
         文案/刻度等消费方内容经 field 出口整段替换控件区（逃生通道，input 同款） -->\r
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
`,Ja=`autospark.slider`;function Ya(e){e.components[Ja]=qa}Xa();function Xa(){y(e=>{m(e),Ya(e)})}var Za=`<!--\r
    autospark.rate 评分（自绘路线，无原生对应控件）——引擎内置 star 星形图标 ×N\r
    （x-for 渲染，max 可配），off 灰星底层 + on 亮星覆盖层（clip-path 百分比裁剪，\r
    100% 整星 / 50% 半星）。可访问性自持：role=slider 单焦点键盘模型（tabindex +\r
    aria-valuemin/now/max + Arrow 方向调分 + Home/End 归位），switch 的 role=switch\r
    同款自持范式（ADR-0018 决策 7 表单基座策略内的自绘例外形态）。继承\r
    autospark.field 骨架（状态色通道/焦点态/disabled 同步，裸态无盒饰）。\r
\r
    值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域（"0".."N"[.5]）——\r
    提交（点击/键盘）派发 input（x-model 回写非冒泡）+ change（detail={ value }\r
    冒泡供外层 @change="v = $event.detail.value" 一行回写）。value props 为非受控\r
    初值 / 单向同步值（受控真相走宿主 x-model）。\r
\r
    交互面：悬停预览（mousemove 半星粒度判定，mouseleave 恢复）；点击提交\r
    （clearable 在场时再次点击同分清零）；disabled/readonly 阻断（readonly 保留\r
    预览禁用——值不可变语义）。\r
\r
    表单提交：内嵌 input[type=hidden] 载体（data-autospark-control 标记——骨架\r
    disabled 同步落载体，禁用即出表），value = 当前数字字面串恒提交、name 透传宿主\r
    （state-button/switch 自绘控件同款代理——无原生真身，对照 slider 的 range 直\r
    提交分叉，ADR-0020 决策 6）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-rate——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；aria/fill 由 mounted JS\r
     通道同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-rate"\r
  x-define="autospark.rate"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: 0,        // number 非受控初值 / 单向同步值（0-N；受控真相走宿主 x-model——el.value 数字语域桥）\r
            max: 5,          // 星形总数（>=1，非法归 5）\r
            allowHalf: false,// 半星粒度（悬停与提交均按 0.5 步进）\r
            clearable: false,// 再次点击同分清零\r
            // —— 内部状态 ——\r
            stars: [],       // 星形渲染数据源 [1..max]（x-for 消费；max 变化时重建）\r
        }),\r
        mounted() {\r
            // —— 内层元素查询（每查现取，家族纪律）——\r
            const starsEl = () => this.el.querySelector(".asc-rate-stars");\r
            const carrier = () => this.el.querySelector(".asc-rate-carrier");\r
            const items = () => Array.from(this.el.querySelectorAll(".asc-rate-item"));\r
\r
            // —— 数值工具（NaN 防御：非法归 0）——\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const maxNum = () => Math.max(1, Math.floor(num(this.data.max) ?? 5));\r
            const half = () => !!this.data.allowHalf;\r
            const clamp = (n) => Math.max(0, Math.min(maxNum(), num(n) ?? 0));\r
\r
            // —— 星形数组重建（响应式赋值驱动 x-for 重渲染）——\r
            const rebuild = () => {\r
                this.data.stars = Array.from({ length: maxNum() }, (_, i) => i + 1);\r
            };\r
\r
            // —— 合法值缓存（受控语域真相）与悬停预览态 ——\r
            let lastValue = 0;\r
            let hoverValue = null; // null = 非预览态\r
\r
            // —— 全视觉同步：aria 语义 + 表单载体 + 逐星点亮（预览态优先于实际值）——\r
            const syncVisual = () => {\r
                const v = hoverValue != null ? hoverValue : lastValue;\r
                const s = starsEl();\r
                if (s) {\r
                    s.setAttribute("aria-valuenow", String(v));\r
                    s.setAttribute("aria-valuemax", String(maxNum()));\r
                    // 可访问性：disabled/readonly 均不可交互（aria-disabled 联动）\r
                    s.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.readonly)));\r
                    if (this.data.status === "error") s.setAttribute("aria-invalid", "true");\r
                    else s.removeAttribute("aria-invalid");\r
                }\r
                const c = carrier();\r
                if (c) {\r
                    c.value = String(lastValue); // 提交载体恒随实际值（悬停预览不落载体）\r
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
            // —— 提交（值落定 + 双派发：input→x-model 回写非冒泡；change→外层 detail={value}）——\r
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
            // —— 指针定位：目标星 + 左右半判定（allowHalf 粒度）——\r
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
            // —— 指针交互（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：\r
            //     悬停预览（readonly 保留禁预览——值不可变语义）/ 移出恢复 / 点击提交 ——\r
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
                // clearable：再次点击同分清零（悬停预览值 = 提交值时判定）\r
                if (this.data.clearable && v === lastValue) {\r
                    commit(0);\r
                    return;\r
                }\r
                commit(v);\r
            });\r
\r
            // —— 键盘交互（role=slider 单焦点模型）：Arrow 调分 + Home/End 归位\r
            //     （Space 阻断滚动；半星粒度 0.5 步进）——\r
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
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域 ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.value 初值（劫持快照序：expando > props.value，input 同款）\r
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(lastValue),\r
                set: (v) => {\r
                    const n = clamp(v);\r
                    if (n === lastValue) return; // 等值短路\r
                    lastValue = n;\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：星形\r
            //     渲染（rebuild 赋值 → x-for 重渲染须再一跳）+ 初值落定 + name /\r
            //     aria-label 透传（可访问性标注通道——零内置文案的标注出口）——\r
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
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            // value 单向同步（无 x-model 场景）：变化才写（与劫持 setter 等值短路防回环）\r
            this.watch("value", ({ value: v }) => {\r
                const n = clamp(v);\r
                if (n === lastValue) return;\r
                lastValue = n;\r
                syncVisual();\r
            });\r
            // max 变化：星形重建（x-for 重渲染须再一跳对齐视觉）+ 当前值夹取\r
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
    /* x-for 循环容器（渲染一次）：不产生布局层，星项穿透为星组直接 flex 项 */\r
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
    /* 灰星底层：中性色（主题在场自动换肤） */\r
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
    /* ---------- 交互态 ---------- */\r
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——星组可聚焦即点亮）；\r
       禁用不点环 */\r
    .asc-rate[data-focus]:not([data-disabled]) .asc-rate-stars {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
      border-radius: var(--auto-border-radius, var(--asc-rate-focus-radius, 0.25em));\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（点亮 tone 保留可辨）+ 禁点光标 */\r
    .asc-rate[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-rate[data-disabled] .asc-rate-stars {\r
      cursor: not-allowed;\r
    }\r
    /* 只读：光标归正文（预览与提交均阻断，无禁用淡化） */\r
    .asc-rate[data-readonly] .asc-rate-stars {\r
      cursor: default;\r
    }\r
    /* 悬停预览态（data-hover 由 mounted 同步）：预览粒度跟随光标（含半星） */\r
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
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden，骨架 disabled 同步\r
         目标）+ 星组交互件（role=slider 可聚焦）。x-for 宿主为纯克隆载体（自身绑定\r
         不编译，:key 例外），星形双层结构在内层；star 为引擎内置图标。注意：嵌套\r
         x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 field 出口\r
         整段替换控件区（逃生通道，input 同款语义），故不开真插槽 -->\r
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
    <!-- x-for 容器形态（宿主渲染一次、子节点为项模板重复 N 次）：items 容器\r
         display:contents 不产生布局层，星项直接成为星组 flex 项 -->\r
    <span class="asc-rate-items" x-for="s of stars" :key="s">\r
      <span class="asc-rate-item">\r
        <i class="asc-rate-off" x-icon="'star'"></i>\r
        <i class="asc-rate-on" x-icon="'star'"></i>\r
      </span>\r
    </span>\r
  </span>\r
</span>\r
`,Qa=`autospark.rate`;function $a(e){e.components[Qa]=Za}eo();function eo(){y(e=>{m(e),$a(e)})}var to=`<!--\r
    autospark.select 下拉选择器（ADR-0022）——触发器组件：Field 盒饰形态\r
    （.asc-field-box，input 同款 chrome）+ 选中值展示 + 下拉箭头。下拉面板不自建弹层，\r
    复用 x-popover 指令机制呈现（trigger:click 形态——点击切换 / 面板外点击 / ESC 关闭\r
    均机制继承，ADR-0060）：内层触发器元素即 popover 宿主，面板组件 autospark.select-panel\r
    （同插件注册，panel.html）渲染进 body 覆盖物容器，fit 选项使面板宽度随触发器。\r
\r
    面板 ↔ 触发器通信走 scope 链（零 DOM 事件、零 uid 配对）：overlay 内容宿主恒以\r
    「open + dataContext:host」实例化面板组件（ADR-0123 决策 2），面板经聚合视图沿链\r
    读写本组件 data 域——读 filteredOptions/activeValue 等呈现，写哨兵键\r
    （pickTick/pickValue、keyTick/keyDir、filterText）回传交互；面板 mounted/unmounted\r
    沿链写 open 开合态（箭头旋转 / aria-expanded / 过滤词复位）。\r
\r
    值桥（x-model 兼容协议，对齐 ADR-0020 input 范式 / switch hidden 载体先例）：\r
    宿主 el.value 劫持 ↔ data.value；选中 / 清除路径手动派发 input（非冒泡，x-model\r
    宿主监听回写 state）+ change（冒泡，detail = { value }，外层消费）；内嵌\r
    input[type=hidden] 表单载体（name 透传，原生直提交）。\r
\r
    键盘（触发器焦点）：上下移动高亮（跳过禁用项）/ Enter 确认或开面板 / ESC 归 popover\r
    打开栈（机制继承）不拦截；filterable 时过滤框内键盘经面板哨兵键走同一导航。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-select + .asc-field-box 盒饰选配，\r
     ADR-0020 消费契约）；data-open / data-has-value / data-loading 由 mounted JS 通道\r
     同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-select asc-field-box"\r
  x-define="autospark.select"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: null,       // 当前值（单选起步，string | number；受控真相走宿主 x-model——el.value 桥，ADR-0022）\r
            options: [],       // 选项数组 [{ label, value, disabled? }]（经 x-data 状态引用注入——字面量数组有引擎死环缺陷，ADR-0022）\r
            placeholder: "",   // 占位文案（空时走 i18n 词典 select.placeholder 键，回退「请选择」）\r
            clearable: false,  // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）\r
            filterable: false, // 本地过滤（P1 简实现：面板顶部过滤框，对 label 不区分大小写包含匹配）\r
            loading: false,    // 加载态：面板列表 x-loading 遮罩 + 触发器箭头转旋转图标\r
            virtual: false,    // 长列表虚拟渲染开关（面板切 x-for.virtual；须加载 autospark.virtual.js，缺席时引擎降级全量渲染，ADR-0022）\r
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——\r
            uid: "",               // 实例唯一标识（根 data-asc-select-uid 属性载体——面板宽度\r
                                   // 匹配的配对键：popover 的 fit 基准是触发器内容区宽，不含\r
                                   // 盒饰 padding，面板 mounted 按 uid 测盒饰宽补 min-width）\r
            hasValue: false,       // 当前有值（清除钮可见性 / 占位切换）\r
            labelText: "",         // 选中项文案（options/value 经 JS 重解析；countText 同款通道）\r
            filteredOptions: [],   // 过滤产物（面板 x-for 数据源；options/filterText 变化时重建）\r
            filterText: "",        // 过滤词（面板过滤框写回；面板关闭时复位）\r
            activeIndex: -1,       // 键盘高亮索引（filteredOptions 内；-1 无高亮）\r
            activeValue: null,     // 高亮项值（面板 :data-active 比较基准——索引对模板不可见，值通道免疫过滤重建）\r
            open: false,           // 面板开合态（面板 mounted/unmounted 沿链写回；箭头旋转/aria/复位驱动）\r
            pickTick: 0,           // 选中哨兵（面板点击/过滤框 Enter 写：自增必变免疫同值去重；触发本组件选中流程）\r
            pickValue: null,       // 选中哨兵携带值\r
            keyTick: 0,            // 键盘导航哨兵（过滤框内上下键写——面板模板不能跨组件边界调本组件方法，ADR-0022 决策 3）\r
            keyDir: 0,             // 键盘导航方向（1 下 / -1 上）\r
        }),\r
        methods: {\r
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）\r
            triggerEl() {\r
                return this.el.querySelector(".asc-select-trigger");\r
            },\r
            // 表单载体（hidden input；每查现取）\r
            carrierEl() {\r
                return this.el.querySelector(".asc-select-carrier");\r
            },\r
            // 选中呈现同步（JS 通道：labelText 由 options/value 重解析——props 晚注入 /\r
            //     options 引用内容变化都经 watch 收口到这里）。选项匹配走字符串归一比较\r
            //     （x-model 对 text 控件语义会把值往返归一为字符串——7 与 "7" 须互认）\r
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
            // 高亮同步（activeValue 为面板比较基准）\r
            syncActive() {\r
                const list = this.data.filteredOptions ?? [];\r
                const i = this.data.activeIndex;\r
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;\r
                else this.data.activeValue = null;\r
            },\r
            // 过滤重建（options / filterText 变化；activeIndex 越界时回落选中项）\r
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
            // 高亮落当前选中项（打开面板时的定位基准；字符串归一比较同 syncValue）\r
            setActiveToValue() {\r
                const list = this.data.filteredOptions ?? [];\r
                this.data.activeIndex = list.findIndex(\r
                    (o) => o && String(o.value) === String(this.data.value),\r
                );\r
                this.syncActive();\r
            },\r
            // 开合态副作用：复位过滤词与高亮定位（打开时高亮落当前选中项）+\r
            //     aria-expanded / data-open 同步（JS 直写无 T4=B 约束）\r
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
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板\r
            syncInteractive() {\r
                const t = this.triggerEl();\r
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;\r
                const c = this.carrierEl();\r
                if (c) c.disabled = !!this.data.disabled;\r
                this.el.toggleAttribute("data-loading", !!this.data.loading);\r
                if (this.data.disabled && this.data.open) this.closePanel();\r
            },\r
            // 值变更出口（选中/清除共用）：input 非冒泡（x-model 监听在宿主自身，\r
            //     checkbox/switch 同款）+ change 冒泡 detail={value}（外层消费）\r
            emitChange() {\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),\r
                );\r
            },\r
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览\r
            //     但选中被 pick guard 阻断——只读可见可选不了，文档已声明）\r
            openPanel() {\r
                if (this.data.disabled) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（「再点宿主关闭」——与\r
            // 用户操作同一关闭路径；命令式 engine.getOverlay().close 只回收命令式通道\r
            // 打开的实例，声明式 x-popover 面板不入实例注册表，对指令面板无效）。open\r
            // 守卫防已关态误开（toggle 语义）；overlay 插件缺席时 open 恒 false 自然跳过\r
            closePanel() {\r
                if (!this.data.open) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            // 高亮移动（dir = 1 下 / -1 上）：环找下一个非禁用项（首尾环绕；全禁用不动）\r
            moveActive(dir) {\r
                const list = this.data.filteredOptions ?? [];\r
                if (list.length === 0) return;\r
                let i = this.data.activeIndex;\r
                for (let step = 0; step < list.length; step++) {\r
                    i = (i + dir + list.length) % list.length;\r
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }\r
                }\r
            },\r
            // Enter 确认当前高亮项\r
            confirmActive() {\r
                if (this.data.activeValue != null) this.pick(this.data.activeValue);\r
            },\r
            // 选中流程（面板点击哨兵 / 触发器键盘 / 过滤框 Enter 汇聚点）：禁用与只读\r
            // 阻断；同值仅关面板；写值 + 双派发 + 关面板 + 焦点回触发器（匹配同\r
            // syncValue 的字符串归一比较）\r
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
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +\r
            // 阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）\r
            onClear(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled || this.data.readonly) return;\r
                if (!this.data.hasValue) return;\r
                this.data.value = null;\r
                this.syncValue();\r
                this.emitChange();\r
                this.triggerEl()?.focus();\r
            },\r
            // 触发器键盘导航：上下移动高亮（未开先开）/ Enter 确认（未开先开）/\r
            // ESC 与 Tab 不拦截（ESC 归 popover 打开栈——机制继承；Tab 自然移焦）\r
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
            // —— 值桥（x-model 兼容协议，ADR-0022 对齐 ADR-0020）：宿主 el.value 劫持 ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.value 初值（快照序：expando > props.value，input 同款）；setter\r
            //     等值守卫防 x-model 回写环（guard 值经闭包持有——watch 侧同步维护）\r
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
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：表单载体\r
            //     name 透传（原生直提交，ADR-0020 决策 6 同款载体语义）+ 全量首同步 ——\r
            setTimeout(() => {\r
                const nameAttr = this.el.getAttribute("name");\r
                const c = this.carrierEl();\r
                if (c && nameAttr != null) c.name = nameAttr;\r
                // 实例唯一标识落根属性（面板宽度配对键，ADR-0022 决策 2 注记）\r
                this.data.uid = "asc-select-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);\r
                this.el.setAttribute("data-asc-select-uid", this.data.uid);\r
                this.rebuildFiltered();\r
                this.syncValue();\r
                this.syncOpen();\r
                this.syncInteractive();\r
            }, 0);\r
\r
            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作\r
            //     触发信号，家族惯用法）——\r
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });\r
            this.watch("options", () => { setTimeout(() => { this.rebuildFiltered(); this.syncValue(); }, 0); });\r
            this.watch("filterText", () => { this.rebuildFiltered(); });\r
            this.watch("activeIndex", () => { this.syncActive(); });\r
            this.watch("open", () => { this.syncOpen(); });\r
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });\r
            this.watch("loading", () => { this.el.toggleAttribute("data-loading", !!this.data.loading); });\r
            // 面板哨兵：选中（pickTick）/ 过滤框键盘导航（keyTick——面板模板不能跨组件\r
            // 边界调本组件方法，经哨兵键沿链写回，ADR-0022 决策 3）\r
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });\r
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-select">\r
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input 同款），光标手型 ---------- */\r
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
    /* 只读：光标归正文（面板可开浏览，选中被 pick guard 阻断） */\r
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
    /* 选中值展示：占位与值两态（x-if 切换），占位走次要淡化色 */\r
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
    /* ---------- 尾部动作件：清除钮（内部交互件，不转发焦点）与下拉箭头 ---------- */\r
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
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
    /* 过滤框（filterable）：面板顶部，原生 input 裸化 + 底部细分隔线 */\r
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
    /* 选项列表：最大高度限档 + 纵向滚动（虚拟化形态由 x-for.virtual 接管窗口渲染） */\r
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
    /* 空态（含过滤无匹配）：居中辅助色文案 */\r
    .asc-select-empty {\r
      padding: 0.9em 0.75em;\r
      text-align: center;\r
      color: var(--auto-third-color, var(--asc-select-empty, rgba(0, 0, 0, 0.35)));\r
    }\r
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */\r
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
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden——提交值载体，禁用\r
         出表由 JS 同步）+ 触发器（popover 宿主 / 焦点受让者 / combobox 语义）+\r
         清除钮（动作件）+ 下拉箭头。文案走 props 与 i18n 词典（继承形态嵌套插槽出口\r
         被忽略，ADR-0056——不开真插槽，ADR-0022） -->\r
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
`,no=`<!--\r
    autospark-select-panel 下拉面板（ADR-0022）——select 的内部组件（非用户直接消费，\r
    无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制（trigger:click）\r
    渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/宽度 fit 随触发器）由 popover-shell\r
    承载，本组件只贡献选项列表内容。\r
\r
    与触发器组件（autospark.select）的通信走 scope 链：overlay 内容宿主恒以\r
    「open + dataContext:'host'」实例化本组件（ADR-0123 决策 2），聚合视图沿链读写触发器\r
    组件 data 域——\r
    - 读：filteredOptions（x-for 数据源）/ activeValue（高亮基准）/ value（选中基准）/\r
      filterable / virtual / loading（形态与状态呈现）；\r
    - 写：filterText（过滤框输入）、哨兵键 pickTick/pickValue（选项点击与过滤框 Enter\r
      确认）与 keyTick/keyDir（过滤框上下键导航）——面板模板不能跨组件边界调触发器\r
      组件 method（x-on 组件 method 查找不穿透父组件，ADR-0022 决策 3），自增哨兵免疫\r
      同值去重；事件表达式用逗号运算符单表达式形态（分号多语句依赖新版引擎回退，旧产物\r
      不可用）；\r
    - 开合态：mounted/unmounted 沿链写 open（箭头旋转 / aria-expanded / 过滤词复位）。\r
\r
    列表渲染双分支（ADR-0022 决策 4）：普通分支 template 形态 x-for（缺省）；虚拟分支\r
    **容器形态** x-for.virtual 直接挂列表容器（规范用法——template 形态下惰性内容让\r
    itemHeight 自动检测取 0 退化全量），须加载 autospark.virtual.js（渐进增强，缺席时\r
    引擎 warn + 降级全量渲染）。空态文案走 i18n 词典 select.empty 键（回退「暂无数据」）。\r
-->\r
<div class="asc-select-panel" x-define="autospark-select-panel">\r
  <script setup>\r
    {\r
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链\r
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）\r
        data: () => ({}),\r
        methods: {\r
            // 过滤框键盘导航（哨兵沿链写回，ADR-0022 决策 3）：上下键移动高亮 /\r
            // Enter 确认当前高亮项；ESC 不拦截（归 popover 打开栈——机制继承）\r
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
            // 开合态沿链写回（触发器侧 watch open 派生箭头旋转 / aria-expanded / 复位）\r
            this.data.open = true;\r
            // 宽度匹配触发器盒饰（ADR-0022 决策 2 注记）：popover 的 fit 基准是触发器\r
            // 内容区（popover 宿主元素，不含盒饰 padding）——按 uid 配对测盒饰宽，补写\r
            // shell 面板 min-width（fit 持续写 width，min-width 抬到盒宽；每次打开新\r
            // 实例重测，盒宽变化随重开自适应）\r
            const uid = this.data.uid;\r
            if (uid) {\r
                const box = document.querySelector('[data-asc-select-uid="' + uid + '"]');\r
                const shellPanel = this.el.closest("[data-overlay]");\r
                if (box && shellPanel) {\r
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";\r
                }\r
            }\r
            // 高亮项滚动跟随（键盘导航可见性；初次打开定位到选中项；列表在面板内现查）\r
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
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态\r
            this.data.open = false;\r
        },\r
    }\r
  <\/script>\r
  <!-- 过滤框（filterable）：本地过滤输入（P1 简实现——对 label 不区分大小写包含匹配，\r
         过滤词沿链写触发器域，重建 filteredOptions） -->\r
  <div class="asc-select-filter" x-if="filterable">\r
    <input\r
      class="asc-select-filter-input"\r
      type="text"\r
      x-on:input="filterText = $event.target.value"\r
      x-on:keydown="onFilterKeydown($event)"\r
    />\r
  </div>\r
  <!-- 选项列表·普通分支（缺省）：template 形态 x-for（容器内追加空态行） -->\r
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
  <!-- 选项列表·虚拟分支（virtual 开关）：容器形态 x-for.virtual 直接挂列表容器（规范\r
         用法）+ **固定行高 32px 显式声明**（首渲染前无子元素可测，自动检测是鸡生蛋问题\r
         ——规范用法恒显式传 itemHeight，ADR-0022 决策 4）——长列表（>100）只渲染可见窗口，\r
         须加载 autospark.virtual.js（渐进增强；缺席时引擎 warn + 降级全量渲染）。\r
         x-if 分叉包一层避免与 x-for 同元素互斥（结构指令独占宿主） -->\r
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
`,ro=`autospark.select`,io=`autospark-select-panel`,ao=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;function oo(e){e.icons?.add?.(`select-down`,ao),e.components[ro]=to,e.components[io]=no}so();function so(){y(e=>{m(e),oo(e)})}var co=`<!--
    autospark.transfer 穿梭框（ADR-0028）——双列表（源/目标）+ 中间穿梭钮复合控件。

    内部装配（ADR-0018 决策 2「内部装配、对外开箱」，取舍见 ADR-0028）：
    - 列表区**复制** list 结构（非嵌套消费）：视觉同源经 CSS 变量达成（边框/圆角/行距/
      hover 同档），结构四段（头部全选 + 过滤框 + 滚动体 + 底部计数）与 list 单段行容器
      不同构（ADR-0028 决策 1）；
    - 复选项**组合** autospark.checkbox（table 行选择先例直承）：checked props 绑定
      pickedKeys.includes（**整体替换驱动全行重求值**），@change 事件通道回写选中集；
      头部全选额外消费 indeterminate 半选（ADR-0028 决策 2/4）；
    - 穿梭钮自绘原生 button（button 同档 chrome + 亮度反馈，组合 autospark.button 的
      props 接线收益为负，ADR-0028 决策 4 备选节）。

    值桥（x-model 兼容协议，ADR-0028 决策 3）：宿主 el.value 劫持为**数组语域**（目标侧
    key 数组，value 顺序恒为 data 声明序——canonical 重建）；穿梭路径派发 input（非冒泡，
    x-model 回写）+ change（冒泡 detail={ value }，外层消费）；内嵌 input[type=hidden]
    载体 value = key 逗号拼接（表单提交字符串域）、name 透传（元素名形态折叠 props /
    值对象形态宿主属性双通道，props 优先）、禁用出表。

    选中集单集制（ADR-0028 决策 4）：pickedKeys 跨两侧共用（key 任一时刻只在一侧）；
    全选作用于当前过滤视图的可用项；canRight/canLeft 由「选中集 ∩ 侧全集（跨过滤
    维度）」派生——过滤词不清选中集（antd 同款语义）。

    items/value 变更通道：props 为调用方状态**引用**注入——整体替换驱动重渲；原地
    增删不发信号（autostore 跨域边界，文档披露）。
-->
<!-- 继承 autospark.base（ADR-0134）：主题档位六键自动获得；transfer 是复合控件不继承
     field（无盒饰/焦点环语义面，disabled 自持，ADR-0028 决策 2）；data-disabled
     由 mounted JS 通道同步，根上无动态绑定（T4=B） -->
<div class="asc-transfer" x-define="autospark.transfer" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            data: [],        // 数据源 [{ key, label, disabled? }]（经状态引用注入——字面量数组触发 props 更新死循环，ADR-0019 后果 2）
            value: [],       // 目标侧 key 数组（非受控初值 / 单向同步值；受控真相走宿主 x-model——el.value 数组语域桥）
            titles: [],      // 双列表标题 [源标题, 目标题]（缺省无标题）
            filterable: false, // 本地搜索（每侧独立过滤框，label 不区分大小写包含匹配）
            disabled: false, // 整体禁用（选中/穿梭/搜索全阻断 + 载体出表）
            name: "",        // 表单提交名（元素名形态经属性折叠为 props；值对象形态走宿主 name 属性——props 优先）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            sourceItems: [],   // 源侧全集（data 按 value 划分）
            targetItems: [],   // 目标侧全集
            sourceView: [],    // 源侧过滤视图（行渲染数据源）
            targetView: [],    // 目标侧过滤视图
            sourceFilter: "",  // 源侧过滤词（过滤框写回；关闭不清——过滤词非开合态）
            targetFilter: "",  // 目标侧过滤词
            pickedKeys: [],    // 选中集（字符串归一 key，跨两侧共用单集制；整体替换驱动全行重求值）
            sourceAll: false,  // 源侧全选态（按过滤视图可用项派生）
            sourceHalf: false, // 源侧半选态
            targetAll: false,  // 目标侧全选态
            targetHalf: false, // 目标侧半选态
            canRight: false,   // 穿梭钮态：选中集 ∩ 源侧非空且未禁用
            canLeft: false,    // 穿梭钮态：选中集 ∩ 目标侧非空且未禁用
        }),
        methods: {
            // 数据源归一（props 晚注入/异常形态防御）
            items() {
                return Array.isArray(this.data.data) ? this.data.data : [];
            },
            // 值数组归一
            valueKeys() {
                return Array.isArray(this.data.value) ? this.data.value : [];
            },
            // 全量重建：按 value 划分两侧 + 过滤视图 + 选中派生态（幂等，一切变更的收口）
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
            // 选中派生态：选中集合法化（剔除不在 data 的 key）+ 全选/半选 + 穿梭钮联动
            syncSelection() {
                const valid = new Set(this.items().map((i) => String(i?.key)));
                const pickedArr = [...new Set((this.data.pickedKeys ?? []).map(String))]
                    .filter((k) => valid.has(k));
                if (pickedArr.length !== (this.data.pickedKeys ?? []).length) {
                    this.data.pickedKeys = pickedArr;
                }
                const pickSet = new Set(pickedArr);
                // 全选/半选：按过滤视图可用项（disabled 项跳过）
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
                // 穿梭钮联动：选中集 ∩ 侧全集（跨过滤维度——被过滤隐藏的选中仍可穿梭）
                const srcKeys = new Set((this.data.sourceItems ?? []).map((i) => String(i.key)));
                const tgtKeys = new Set((this.data.targetItems ?? []).map((i) => String(i.key)));
                const dis = !!this.data.disabled;
                this.data.canRight = !dis && pickedArr.some((k) => srcKeys.has(k));
                this.data.canLeft = !dis && pickedArr.some((k) => tgtKeys.has(k));
            },
            // 行勾选切换（checkbox @change 与行点击汇聚点；disabled 项 guard）。
            //     原生 change 在此拦截不外泄（外层 @change 只应收到本组件 detail={value} 派发）
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
            // 行点击切换（点行文字与点 checkbox 等价；checkbox 区内点击自理不双触发）
            onRowClick(item, event) {
                if (event && event.target instanceof Element && event.target.closest(".asc-checkbox")) return;
                if (!item || item.disabled) return;
                this.togglePick(item.key);
            },
            // 头部全选切换（作用于当前过滤视图可用项；半选态点击 → 全选，原生行为对齐；
            //     原生 change 同样拦截不外泄）
            onToggleSourceAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.sourceView);
            },
            onToggleTargetAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.targetView);
            },
            // 过滤框输入（原生 input 在此拦截不外泄——宿主 x-model 监听 input，原生冒泡
            //     会触发无谓回读）
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
            // 穿梭（dir: "right" 移入目标 / "left" 移回源）：选中集 ∩ 侧并入/剔除 +
            // canonical 重建（value 顺序恒为 data 声明序）+ 仅清移动侧选中 + 双派发
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
            // 表单载体同步（value 逗号拼接字符串域 + 禁用出表）
            syncCarrier() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                c.value = this.valueKeys().map((k) => String(k)).join(",");
                c.disabled = !!this.data.disabled;
            },
            // 提交名同步（props.name 优先，回退宿主属性——元素名/值对象双形态通道）
            syncName() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            // 可交互同步：宿主禁用反射 + 载体 + 穿梭钮派生态
            syncInteractive() {
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                this.syncCarrier();
                this.syncSelection();
            },
            // 值变更出口：input 非冒泡（x-model 监听在宿主自身，checkbox/select 同款）+
            // change 冒泡 detail={ value }（外层消费）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
        },
        mounted() {
            // —— 值桥（x-model 兼容协议，ADR-0028 决策 3）：宿主 el.value 劫持为数组语域 ——
            //     x-model 对 text-like 控件的 state→DOM 写入恒 String() 归一（引擎语义，
            //     ADR-0023 决策 1 同族）——数组经 x-model 通道往返呈逗号拼接字符串形态，
            //     桥须双向兼容：setter 解析逗号串（key 域约束：不含逗号——hidden 载体
            //     提交本就是逗号拼接域，约束一致）；劫持前快照 expando（x-model 编译期
            //     可能已写初值）；无 x-model 时回退 props.value 初值（快照序：
            //     expando > props.value，input 同款）
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
                    if (arr === self.data.value) return; // 引用等值（x-model 回写环守卫）
                    self.data.value = arr;
                    self.rebuild();
                },
                configurable: true,
            });
            this.data.value = initV;

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                this.syncName();
                this.rebuild();
                this.syncInteractive();
            }, 0);

            // —— props / 内部状态跟随（回调收 { value } 信封对象，此处只用作触发信号，
            //     家族惯用法）——
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
    /* 禁用：整体淡化 + 行/钮禁点（各元素 cursor 自理） */
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

    /* ---------- 头部：全选 checkbox + 标题 ---------- */
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

    /* ---------- 过滤框（filterable）：裸 input 复制（input-number 复制先例，ADR-0028） ---------- */
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

    /* ---------- 体：滚动窗口 ---------- */
    .asc-transfer-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    /* ---------- 行：checkbox + 文案；hover 同 list 档（淡底轻反馈） ---------- */
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

    /* ---------- 空态（含过滤无匹配） ---------- */
    .asc-transfer-empty {
      padding: 1.2em 0.85em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-transfer-empty, rgba(0, 0, 0, 0.35)));
    }

    /* ---------- 底部计数「N / M 项」 ---------- */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 表单载体（hidden——提交值 = key 逗号拼接字符串域，禁用出表由 JS 同步） -->
  <input type="hidden" class="asc-transfer-carrier" />
  <!-- 源列表（data 划分左侧）：行模板 = template 形态 x-for（克隆体禁 x-if / 宿主绑定
         不编译——行绑定全部落克隆体内层元素，家族纪律） -->
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
  <!-- 穿梭钮（自绘原生 button，button 同档视觉；:disabled 由选中集联动派生态驱动） -->
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
  <!-- 目标列表（value 侧）：与源列表镜像（标题 titles[1] / 过滤词 targetFilter /
         视图 targetView / 全选 targetAll） -->
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
`,lo=`autospark.transfer`;function uo(e){e.components[lo]=co}fo();function fo(){y(e=>{m(e),uo(e)})}var po=`<!--
    autospark.color-picker 颜色选择器（ADR-0028）——触发器组件：Field 盒饰形态
    （.asc-field-box，select 同款 chrome）+ 色块预览 + hex 文案。取色面板不自建弹层，
    复用 x-popover 指令机制呈现（trigger:click，ADR-0060）：内层触发器元素即 popover
    宿主，面板组件 autospark-color-panel（panel.html，连字符注册名免疫 attr 参数点号
    切分）渲染进 body 覆盖物容器，固定宽度（无 fit——与 select 宽度匹配的分叉点，
    ADR-0028 决策 6）。

    面板 ↔ 触发器通信走 scope 链（零 DOM 事件、零 uid 配对，ADR-0123 决策 2 同款）：
    - 读：h/s/v（thumb 定位）/ hueColor（SV 面板底色）/ liveHex（hex 输入与色板回显）/
      presets / disabled；
    - 写·直写键：拖拽连续写 h/s/v（连续值每步互异，无同值去重面——对照 select 的哨兵
      键仅用于离散交互）；
    - 写·哨兵键：pickTick/pickValue（预设点击）、applyTick/applyHex（hex 输入应用）、
      commitTick（拖拽结束提交——提交恒在 pointerup，拖拽不刷 change 事件流）；
    - 开合态：面板 mounted/unmounted 沿链写 open（aria-expanded 同步）。

    双真相模型（ADR-0028 决策 7）：value（提交值，"#rrggbb" 六位小写 hex——空值/非法
    归一 #000000，不支持空值态）与 h/s/v（编辑值）两域；liveHex/hueColor 为派生态
    （JS 通道维护——绑定表达式不能调组件 methods，家族纪律）；watch("value") 以
    hsvToHex(h,s,v) === norm 幂等守卫防自写回环（HSV→RGB 整数化往返精确）。

    值桥（x-model 兼容协议，对齐 ADR-0020）：宿主 el.value 劫持 ↔ data.value；
    提交路径（拖拽结束 / 预设点击 / hex 应用）手动派发 input（非冒泡，x-model 回写）+
    change（冒泡，detail = { value }，外层消费）；内嵌 input[type=hidden] 表单载体
    （name 透传，原生直提交）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-color-picker + .asc-field-box 盒饰，
     ADR-0020 消费契约）；data-open 由 mounted JS 通道同步，根上无动态绑定（T4=B） -->
<span
  class="asc-color-picker asc-field-box"
  x-define="autospark.color-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "#000000", // "#rrggbb" 非受控初值 / 单向同步值（空值/非法归一 #000000；受控真相走宿主 x-model）
            presets: [],      // 预设色板 ["#rrggbb", ...]（状态引用注入——字面量数组触发 props 更新死循环，ADR-0019 后果 2）
            name: "",         // 表单提交名（元素名形态经属性折叠为 props；值对象形态走宿主 name 属性——props 优先）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            committed: "#000000", // 已提交归一值（真相源：劫持 getter / 载体 / 派发出口。props.value 是
                                  // 引擎注入通道——绑定重复求值会以原始值重写 data.value，归一值不回写
                                  // 该键、由本键承载，select 的 data.value 直写语义在此不可复制）
            h: 0,             // 色相 0-360（面板 H 条 / SV 底色驱动）
            s: 0,             // 饱和度 0-1（面板 SV 横轴）
            v: 0,             // 明度 0-1（面板 SV 纵轴，1 在顶）
            hueColor: "#ff0000", // SV 面板底色（hsv(h,1,1)，绑定通道消费）
            liveHex: "#000000",  // 编辑态色值（hsv 派生；触发器色块/hex 文案/面板回显）
            open: false,      // 面板开合态（面板 mounted/unmounted 沿链写回；aria-expanded 驱动）
            pickTick: 0,      // 预设点击哨兵（自增必变免疫同值去重）
            pickValue: "",    // 预设点击携带色值
            applyTick: 0,     // hex 输入应用哨兵
            applyHex: "",     // hex 输入应用携带文本
            commitTick: 0,    // 拖拽结束提交哨兵（提交恒在 pointerup——拖拽不刷 change 事件流）
        }),
        methods: {
            // —— 归一器：接受 #rgb/#rrggbb/无 # 前缀/大小写；空值与非法归一 #000000
            //    （不支持空值态，ADR-0028 决策 7）——
            normalizeHex(v) {
                if (typeof v !== "string") return "#000000";
                let t = v.trim().replace(/^#/, "");
                if (/^[0-9a-fA-F]{3}$/.test(t)) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
                if (!/^[0-9a-fA-F]{6}$/.test(t)) return "#000000";
                return "#" + t.toLowerCase();
            },
            // —— HSV 模型（标准公式自实现，零第三方库——路线图张力已裁定，ADR-0028 决策 5）——
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
            // 派生态重算（h/s/v 变化 → liveHex/hueColor）
            recomputeLive() {
                const h = Number(this.data.h) || 0;
                const s = Number(this.data.s) || 0;
                const v = Number(this.data.v) || 0;
                this.data.liveHex = this.hsvToHex(h, s, v);
                this.data.hueColor = this.hsvToHex(h, 1, 1);
            },
            // 外部值应用（归一 + hsv 重建 + 派生态 + 载体；幂等守卫防自写回环——
            // 内部 commit 写 value 后本回调再入时 norm === liveHex 短路）。liveHex
            // 直采外部归一值（HSV 往返有 1bit 舍入漂移——thumb 定位取 hsv，回显取 norm）
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
            // 提交（值落定 + 双派发：input→x-model 回写非冒泡；change→外层 detail={value}）
            commit() {
                this.data.committed = this.data.liveHex;
                this.data.value = this.data.liveHex; // 回写 props 通道（单向同步场景跟随提交值）
                this.syncCarrier();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.committed } }),
                );
            },
            // 表单载体同步（hex 字符串域 + 禁用出表）
            syncCarrier() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                c.value = String(this.data.committed ?? "");
                c.disabled = !!this.data.disabled;
            },
            // 提交名同步（props.name 优先，回退宿主属性——元素名/值对象双形态通道）
            syncName() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-color-picker-trigger");
            },
            // 开合态副作用：aria-expanded 同步（JS 直写无 T4=B 约束）
            syncOpen() {
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(!!this.data.open));
            },
            // 可交互同步：禁用时触发器退出焦点序 + 载体出表
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                this.syncCarrier();
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle）
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（声明式面板无命令式句柄，
            //     select 同款绕行，ADR-0022 决策 1）；open 守卫防已关态误开
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 触发器键盘：Enter / Space 开面板（面板内键盘调色留 a11y 增量批，ADR-0028 遗留）
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.openPanel();
                }
            },
        },
        mounted() {
            // —— 值桥（x-model 兼容协议，ADR-0028 决策 7 对齐 ADR-0020）：宿主 el.value
            //     劫持为 hex 字符串语域——劫持前快照 expando（x-model 编译期可能已写初值）；
            //     无 x-model 时回退 props.value 初值（快照序：expando > props.value）——
            const prior = this.el.value;
            const initV = typeof prior === "string" && prior !== "" ? prior : this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => self.data.committed,
                set: (v) => {
                    const norm = self.normalizeHex(v);
                    if (norm === self.data.committed) return; // 归一等值守卫（x-model 回写环）
                    self.applyExternal(v);
                },
                configurable: true,
            });
            this.applyExternal(initV);

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                this.syncName();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            // —— props / 哨兵 / 编辑态跟随（回调收 { value } 信封对象，此处只用作触发
            //     信号，家族惯用法）——
            // value 单向同步（props / 劫持 setter / x-model 回读共用收口）。
            // 已见值比对幂等防御（input-number 同款）：x-model 场景 value props 恒缺省
            // （#000000），scope.refresh 类无变化重跑若照常应用会把 expando 注入的初值
            // 打回缺省——同值跳过，真实变化才应用
            let lastPropsValue = this.data.value;
            this.watch("value", ({ value: v }) => {
                if (v === lastPropsValue) return;
                lastPropsValue = v;
                this.applyExternal(v);
            });
            // 拖拽直写键（面板沿链写）：连续重算派生态（提交在 commitTick）
            this.watch("h", () => { this.recomputeLive(); });
            this.watch("s", () => { this.recomputeLive(); });
            this.watch("v", () => { this.recomputeLive(); });
            // 离散交互哨兵：预设点击 / hex 输入应用 / 拖拽结束提交。
            // 哨兵已见值比对幂等防御：scope.refresh 类机制（如 i18n 插件 ready 的首渲染
            // 换血）会以**当前哨兵值**重跑监听——无变化重跑若照常执行回调体，会把「哨兵
            // 未触发时的空载荷（pickValue/applyHex 缺省）」归一成 #000000 误应用，打掉
            // 已注入的初值（实测第 18 批全量 color-picker 9 挂的根因）。同值跳过，哨兵
            // 真正自增才执行（checkbox 值桥同款防御家族）
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
                if (norm === this.data.committed) return; // 同值不派发
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
                if (this.data.liveHex !== this.data.committed) this.commit(); // 未移动的按压不派发
            });
            this.watch("open", () => { this.syncOpen(); });
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-color-picker">
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（select 同款），光标手型 ---------- */
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

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（select 同款）；可聚焦 ---------- */
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
    /* 色块预览：底色 = liveHex（内联绑定通道）；边框恒细线（色值过浅时可辨） */
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
    /* hex 文案（编辑态实时回显） */
    .asc-color-picker-hex {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-color-picker-color, #333333));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换（变量链不变） ---------- */
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
      pointer-events: none; /* 命中交给面板本体（拖拽语义整体承载） */
    }
    /* H 条：七色谱恒定渐变（色环展开，模型常数） */
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
    /* 预设色板：网格排布 + hover 放大轻反馈；当前色 data-active 高亮环 */
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
    /* hex 输入行：当前色块回显 + 裸 input（select 过滤框同款形态） */
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
    /* 面板暗色兜底变体（shell 边框/底色已由 popover-shell 暗色块覆盖） */
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
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden）+ 触发器（popover 宿主 /
         焦点受让者 / combobox 语义）+ 色块预览 + hex 文案（绑定通道读 liveHex 实时回显） -->
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
`,mo=`<!--
    autospark-color-panel 取色面板（ADR-0028）——color-picker 的内部组件（非用户直接
    消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制（trigger:click）
    渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/关闭触点）由 popover-shell 承载，
    本组件只贡献取色内容：SV 面板（div 双层 CSS 渐变 + thumb 百分比定位）+ H 条（七色谱
    恒定渐变）+ 预设色板 + hex 输入行。

    与触发器组件（autospark.color-picker）的通信走 scope 链（ADR-0123 决策 2，select
    面板同款）：overlay 内容宿主恒以「open + dataContext:'host'」实例化本组件，聚合视图
    沿链读写触发器组件 data 域——
    - 读：h/s/v（thumb 定位）/ hueColor（SV 底色，内联绑定）/ liveHex（hex 输入与色板
      回显，:value 绑定——归一后写回输入框）/ presets / disabled；
    - 写·直写键：拖拽连续写 h/s/v（连续值每步互异，无同值去重面——AutoStore 同值写入
      不通知 watcher，离散交互才需要哨兵）；
    - 写·哨兵键：pickTick/pickValue（预设点击）、applyTick/applyHex（hex 输入应用）、
      commitTick（拖拽结束提交——提交恒在 pointerup）；
    - 开合态：mounted/unmounted 沿链写 open。

    拖拽交互（真浏览器重点验证面）：pointerdown 在面板元素上 setPointerCapture（缺席
    环境降级为元素直挂监听——直派事件仍达）+ pointermove 连续写编辑值 + pointerup 写
    commitTick 提交。SVG 规避（ADR-0021 后果 1）：零 SVG 节点，thumb/渐变全 CSS。

    hex 输入：简式校验（#rgb/#rrggbb/无 # 前缀），非法回显当前色不应用；合法沿链写
    applyTick/applyHex（触发器侧完整归一）。
-->
<div class="asc-color-panel" x-define="autospark-color-panel">
  <script setup>
    {
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        methods: {
            // 拖拽会话接线：捕获指针（缺席降级）+ move 连续写 + up 提交（写哨兵沿链）
            //   target 面板元素 / apply(ev) 写入函数 / done 提交哨兵键名
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
                apply(e, el); // 按下即吸附到当前点位
            },
            // SV 面板按下：横向 → s（0-1 左起）、纵向 → v（1 顶 → 0 底）
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
            // H 条按下：横向 → h（0-360 左起）
            onHueDown(e) {
                if (this.data.disabled) return;
                this.bindDrag(e, ".asc-color-hue", (ev, el) => {
                    const rect = el.getBoundingClientRect();
                    const x = rect.width > 0 ? (ev.clientX - rect.left) / rect.width : 0;
                    this.data.h = Math.min(1, Math.max(0, x)) * 360;
                }, "commitTick");
            },
            // 预设色点击：哨兵沿链写回（不关面板——连续试色语义，ADR-0028 决策 7）
            onPresetClick(color) {
                if (this.data.disabled) return;
                this.data.pickTick = Number(this.data.pickTick || 0) + 1;
                this.data.pickValue = color;
            },
            // hex 输入应用（原生 change = Enter/blur）：简式校验，非法回显当前色不应用
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
            // 开合态沿链写回（触发器侧 watch open 派生 aria-expanded）
            this.data.open = true;
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- SV 面板：底色 hueColor 内联绑定 + 双层渐变（白→透明横 / 透明→黑纵）经样式表叠加；
         thumb 百分比定位（s 横 / 1-v 纵，绑定通道读链上编辑值） -->
  <div class="asc-color-sv" :style="'background-color:' + hueColor" @pointerdown="onSvDown($event)">
    <span
      class="asc-color-sv-thumb"
      :style="'left:' + (s * 100) + '%;top:' + ((1 - v) * 100) + '%'"
    ></span>
  </div>
  <!-- H 条：七色谱恒定渐变（样式表）；thumb 百分比定位（h/360） -->
  <div class="asc-color-hue" @pointerdown="onHueDown($event)">
    <span class="asc-color-hue-thumb" :style="'left:' + (h / 360 * 100) + '%'"></span>
  </div>
  <!-- 预设色板（presets 在场）：色值直出（背景内联绑定）；当前色 data-active 高亮 -->
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
  <!-- hex 输入行：当前色块回显 + 输入框（:value 绑定归一回写；@change = Enter/blur 应用） -->
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
`,ho=`autospark.color-picker`,go=`autospark-color-panel`;function _o(e){e.components[ho]=po,e.components[go]=mo}vo();function vo(){y(e=>{m(e),_o(e)})}var yo=`<!--
    autospark.date-picker 日期选择器（ADR-0025）——触发器组件：Field 盒饰形态
    （.asc-field-box，input/select 同款 chrome）+ 选中值展示 + 日历图标。日历面板
    不自建弹层，复用 x-popover 指令机制呈现（trigger:click 形态——点击切换 / 面板
    外点击 / ESC 关闭均机制继承，ADR-0060）：内层触发器元素即 popover 宿主，面板组件
    autospark-date-picker-panel（同插件注册，panel.html）渲染进 body 覆盖物容器；
    日历面板宽度由内容自定（不用 fit——触发器常窄于面板，bottom-start 左对齐）。

    面板 ↔ 触发器通信走 scope 链（零 DOM 事件、零 uid 配对）：面板经聚合视图沿链读写
    本组件 data 域——读 days/weekdayLabels/headerText/activeValue 等呈现，写哨兵键
    （pickTick/pickValue 日格点击与今天快捷、monthTick/monthDelta 月份切换）回传交互；
    面板 mounted/unmounted 沿链写 open 开合态（图标染色 / aria-expanded / 视图归位）。

    值桥（x-model 兼容协议，"YYYY-MM-DD" 字符串语域，对齐 ADR-0020/0022）：宿主
    el.value 劫持 ↔ data.value；选中 / 清除路径手动派发 input（非冒泡，x-model 宿主
    监听回写 state）+ change（冒泡，detail = { value }，外层消费）；内嵌
    input[type=hidden] 表单载体（name 透传，原生直提交）。

    键盘（触发器焦点，按简实现）：Left/Right/Up/Down 日间漫游（±1/±7 天，Date 滚动
    自然跨月——越月时视图跟随）/ PageUp/PageDown 切月 / Enter 确认（未开先开）/
    ESC 与 Tab 不拦截（ESC 归 popover 打开栈——机制继承；Tab 自然移焦）。

    i18n 四键（ADR-0025 键设计：词典数组值 = 复数模式，列表类文案用单键逗号串）：
    date-picker.placeholder（占位）/ weekdays（星期表头，逗号串 split）/
    month-format（"{y}年{m}月" 插值）/ today（今天快捷钮）——未装 i18n 或无键时
    回退硬编码中文；语言切换以下次开面板生效为界（syncOpen 重算）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-date-picker + .asc-field-box 盒饰选配，
     ADR-0020 消费契约）；data-open / data-has-value 由 mounted JS 通道同步，根上无
     动态绑定（T4=B） -->
<span
  class="asc-date-picker asc-field-box"
  x-define="autospark.date-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",       // 当前值（"YYYY-MM-DD" 字符串语域，""=空；受控真相走宿主 x-model——el.value 桥）
            placeholder: "", // 占位文案（空时走 i18n 词典 date-picker.placeholder 键，回退「请选择日期」）
            clearable: false, // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）
            name: "",        // 表单载体名（元素名写法下 name 属性折叠为 props——与宿主属性双通道，mounted 合取）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            hasValue: false,       // 当前有值（清除钮可见性 / 占位切换）
            open: false,           // 面板开合态（面板 mounted/unmounted 沿链写回；图标染色/aria/视图归位驱动）
            viewYear: 0,           // 日历视图年（打开时归位到值所在月，无值落当月）
            viewMonth: 0,          // 日历视图月（0 基，Date 语义）
            days: [],              // 日格数据（42 格扁平数组——单层 x-for 规避嵌套 x-for 晚一跳边界；CSS grid 七列自然分行）
            weekdayLabels: [],     // 星期表头（i18n date-picker.weekdays 逗号串 split 产物）
            headerText: "",        // 年月标题（i18n date-picker.month-format 插值产物）
            todayValue: "",        // 今天快捷钮携带值（"YYYY-MM-DD"，mounted/on open 重算）
            todayText: "今天",     // 今天快捷钮文案（i18n date-picker.today）
            activeValue: "",       // 键盘高亮日（"YYYY-MM-DD" 字符串通道——免疫日格数组重建，面板 :data-active 比较基准）
            pickTick: 0,           // 选中哨兵（日格点击/今天快捷钮写：自增必变免疫同值去重；触发本组件选中流程）
            pickValue: null,       // 选中哨兵携带值
            monthTick: 0,          // 月份切换哨兵（面板前后钮写——面板模板不能跨组件边界调本组件方法，ADR-0022 决策 3）
            monthDelta: 0,         // 月份切换方向（1 下月 / -1 上月）
        }),
        methods: {
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-date-picker-trigger");
            },
            // 表单载体（hidden input；每查现取）
            carrierEl() {
                return this.el.querySelector(".asc-date-picker-carrier");
            },
            // 两位补零（时/分/日格式化）
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            // "YYYY-MM-DD" 解析（月 0 基对齐 Date；非法形态回 null）
            parseYmd(s) {
                if (typeof s !== "string") return null;
                const p = s.split("-");
                if (p.length !== 3) return null;
                const y = Number(p[0]), m = Number(p[1]) - 1, d = Number(p[2]);
                if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
                if (m < 0 || m > 11 || d < 1 || d > 31) return null;
                return { y: y, m: m, d: d };
            },
            // 年月日 → "YYYY-MM-DD"
            fmtYmd(y, m, d) {
                return y + "-" + this.pad2(m + 1) + "-" + this.pad2(d);
            },
            // i18n 词典查询（模板表达式的 t 经 engine.translate 槽同源，methods 内无注入
            //     标识符——经 this.engine 直达槽；恒等兜底（未装 i18n / 词典无键）回退
            //     硬编码中文，pagination 模板表达式同款判定纪律）
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
            // 本地文案重算（星期表头/今天钮/今天值；mounted 与每次开面板时调用——语言
            //     切换的刷新边界：下次开面板生效，ADR-0025）
            refreshLocale() {
                const wd = this.tOr("date-picker.weekdays", "日,一,二,三,四,五,六");
                this.data.weekdayLabels = String(wd).split(",");
                this.data.todayText = this.tOr("date-picker.today", "今天");
                const n = new Date();
                this.data.todayValue = this.fmtYmd(n.getFullYear(), n.getMonth(), n.getDate());
            },
            // 日历重建：42 格（周日起始——weekdayLabels[0] 恒为周日）+ 年月标题；
            //     viewYear/viewMonth/value 变化时经 watch 收口到这里
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
            // 选中呈现同步（JS 通道：值即展示——缺省格式 value 直出，无 label 解析层）
            syncValue() {
                const has = this.data.value != null && this.data.value !== "";
                this.data.hasValue = has;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(this.data.value) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            // 开合态副作用：aria-expanded / data-open 同步（JS 直写无 T4=B 约束）+
            //     打开时视图归位（值所在月，无值落当月）+ 高亮落值（无值落今天）+ 文案重算
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
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            // 值变更出口（选中/清除共用）：input 非冒泡（x-model 监听在宿主自身，
            //     checkbox/switch/select 同款）+ change 冒泡 detail={value}（外层消费）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览
            //     但选中被 pick guard 阻断——只读可见可选不了，文档已声明）
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（「再点宿主关闭」——与
            //     用户操作同一关闭路径；声明式 x-popover 面板不入 overlay 实例注册表，
            //     命令式 close 对指令面板无效，ADR-0022 同款绕行）。open 守卫防已关态
            //     误开（toggle 语义）；overlay 插件缺席时 open 恒 false 自然跳过
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 月份切换（面板前后钮哨兵 / PageUp/PageDown）：年 rollover（12 月→次年 1 月）
            shiftMonth(delta) {
                let y = this.data.viewYear, m = this.data.viewMonth + (delta > 0 ? 1 : -1);
                if (m > 11) { y += 1; m = 0; }
                if (m < 0) { y -= 1; m = 11; }
                this.data.viewYear = y;
                this.data.viewMonth = m;
                this.rebuild();
            },
            // 键盘日间漫游（deltaDays = ±1 水平 / ±7 垂直）：Date 滚动自然跨月——
            //     越月时视图跟随切换（重开面板时 syncOpen 也会按值归位）
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
            // Enter 确认当前高亮日
            confirmActive() {
                if (this.data.activeValue) this.pick(this.data.activeValue);
            },
            // 选中流程（日格哨兵 / 今天快捷 / 触发器键盘汇聚点）：禁用与只读阻断；同值
            //     仅关面板；写值 + 双派发 + 视图随选中月 + 关面板 + 焦点回触发器
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
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +
            //     阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）；字符串空语域
            //     detail={value:""}（select 的 null 语域分叉声明，ADR-0025）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            // 触发器键盘导航（按简）：方向键漫游（未开先开）/ PageUp/PageDown 切月 /
            //     Enter 确认（未开先开）/ ESC 与 Tab 不拦截
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
            // —— 值桥（x-model 兼容协议，ADR-0025 对齐 ADR-0020/0022）：宿主 el.value
            //     劫持——劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时
            //     回退 props.value 初值（快照序：expando > props.value）；setter 等值守卫
            //     防 x-model 回写环（guard 值经闭包持有——watch 侧同步维护）
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

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：布尔 props
            //     元素名写法归一（裸属性折叠为空串——"" → true 的 HTML presence 语义，
            //     ADR-0025；="true"/"false" 与 :绑定 形态不受影响）+ 载体 name 双通道
            //     （元素名写法下 name 折叠为 props，值对象写法下留宿主属性）+ 全量首同步
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

            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作
            //     触发信号，家族惯用法）——
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("viewYear", () => this.rebuild());
            this.watch("viewMonth", () => this.rebuild());
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            // 面板哨兵：选中（pickTick——日格点击/今天快捷）/ 月份切换（monthTick——
            //     面板模板不能跨组件边界调本组件方法，经哨兵键沿链写回，ADR-0022 决策 3）
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("monthTick", () => { this.shiftMonth(Number(this.data.monthDelta) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-date-picker">
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input/select 同款），光标手型 ---------- */
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
    /* 只读：光标归正文（面板可开浏览，选中被 pick guard 阻断） */
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
    /* 选中值展示：占位与值两态（x-if 切换），占位走次要淡化色 */
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

    /* ---------- 尾部动作件：清除钮（内部交互件，不转发焦点）与日历图标 ---------- */
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
    /* 日历图标：开面板染 tone（不旋转——日历造型旋转语义弱，与 select 箭头旋转分叉） */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
    /* 头部：月份导航（内置 arrow 图标，上月在旋 180°）+ 年月标题居中 */
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
    /* 星期表头：七列行（与日格同列宽——固定 em 轨道，面板宽度由内容定形），辅助色 */
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
    /* 键盘高亮：tone 描边环（与 hover 同源派生） */
    .asc-date-picker-day[data-active] {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--asc-tone) 45%, transparent);
    }
    /* 选中：实底 tone + 白字（语义色底上的白字是恒定设计，非变量映射） */
    .asc-date-picker-day[data-selected] {
      background: var(--asc-tone);
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-selected]:hover {
      background: var(--asc-tone);
    }
    /* 今天：tone 文字 + 描边环标记（与选中可叠加——选中态优先实底，今天环让位内衬线） */
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
    /* 邻月格：淡化（可点击漫游过去——哨兵携带完整日期值，选中后视图随值归位） */
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
    /* 底部：今天快捷钮（文本钮，tone 文字） */
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
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
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
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden——提交值载体，禁用
         出表由 JS 同步）+ 触发器（popover 宿主 / 焦点受让者 / combobox 语义）+
         清除钮（动作件）+ 日历图标。文案走 props 与 i18n 词典（继承形态嵌套插槽出口
         被忽略，ADR-0056——不开真插槽，select 同款边界） -->
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
`,bo=`<!--
    autospark-date-picker-panel 日历面板（ADR-0025）——date-picker 的内部组件（非用户
    直接消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制
    （trigger:click）渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位）由 popover-shell
    承载，本组件只贡献日历内容（头部月份导航 + 星期表头 + 6×7 日格 + 今天快捷钮）。
    面板宽度由内容自定（popover 无 fit——日历面板宽度与触发器解耦）。

    与触发器组件（autospark.date-picker）的通信走 scope 链：overlay 内容宿主恒以
    「open + dataContext:'host'」实例化本组件（ADR-0123 决策 2），聚合视图沿链读写
    触发器组件 data 域——
    - 读：days（日格数据源）/ weekdayLabels（星期表头）/ headerText（年月标题）/
      value（选中基准）/ activeValue（键盘高亮基准）/ todayValue / todayText（今天钮）；
    - 写：哨兵键 pickTick/pickValue（日格点击与今天快捷）、monthTick/monthDelta（月份
      前后钮）——面板模板不能跨组件边界调触发器组件 method（x-on 组件 method 查找不
      穿透父组件，ADR-0022 决策 3），自增哨兵免疫同值去重；事件表达式用逗号运算符
      单表达式形态（分号多语句依赖新版引擎回退，旧产物不可用）；
    - 开合态：mounted/unmounted 沿链写 open（图标染色 / aria-expanded / 视图归位）。

    日格克隆体内零 x-if/x-show（共享快照多实例串台规避，ADR-0021 边界 3）——状态全走
    x-bind 布尔属性（假值整属性移除 = 无态，绑定语义天然契合）。月份导航用 engine 内置
    arrow 图标（上月钮 CSS 旋转 180° 复用，page-header 同款纪律）。
-->
<div class="asc-date-picker-panel" x-define="autospark-date-picker-panel">
  <script setup>
    {
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生图标染色 / aria-expanded / 视图归位）
            this.data.open = true;
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 头部：月份前后钮（哨兵沿链写回，触发器侧 shiftMonth 做年 rollover）+ 年月标题 -->
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
  <!-- 星期表头：七列（i18n date-picker.weekdays 逗号串 split 产物，触发器域维护） -->
  <div class="asc-date-picker-weekdays">
    <template x-for="w of weekdayLabels" :key="w">
      <span class="asc-date-picker-weekday" x-text="w"></span>
    </template>
  </div>
  <!-- 日格：42 格扁平数组单层 x-for（不嵌套——内层渲染晚一跳边界规避），CSS 七列
         自然分行；状态 x-bind 布尔属性驱动（假值整属性移除 = 无态）——data-out 邻月
         淡化 / data-today 今天 / data-selected 选中 / data-active 键盘高亮 -->
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
  <!-- 底部：今天快捷钮（哨兵携带 todayValue——点击即选中今天，触发器侧视图随值归位） -->
  <div class="asc-date-picker-footer">
    <button
      type="button"
      class="asc-date-picker-today"
      x-text="todayText"
      @click="pickTick = pickTick + 1, pickValue = todayValue"
    ></button>
  </div>
</div>
`,xo=`autospark.date-picker`,So=`autospark-date-picker-panel`,Co=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`;function wo(e){e.icons?.add?.(`date-calendar`,Co),e.components[xo]=yo,e.components[So]=bo}To();function To(){y(e=>{m(e),wo(e)})}var Eo=`<!--
    autospark.time-picker 时间选择器（ADR-0025）——触发器组件：Field 盒饰形态
    （.asc-field-box，input/select 同款 chrome）+ 选中值展示 + 时钟图标。时间面板
    不自建弹层，复用 x-popover 指令机制呈现（trigger:click 形态——点击切换 / 面板
    外点击 / ESC 关闭均机制继承）：内层触发器元素即 popover 宿主，面板组件
    autospark-time-picker-panel（同插件注册，panel.html）渲染进 body 覆盖物容器。

    面板 ↔ 触发器通信走 scope 链：面板经聚合视图沿链读写本组件 data 域——读
    hourList/minuteList/curHour/curMinute 呈现，写哨兵键（hTick/hVal、mTick/mVal——
    时/分格点选，面板模板不能跨组件边界调本组件方法，ADR-0022 决策 3）回传交互；
    面板 mounted/unmounted 沿链写 open 开合态。

    选择语义（ADR-0025 决策 2，与 select 的关键分叉）：点选时/分格**部分提交**——
    更新 value 对应位 + change 派发 + **面板保持开**（两列需连续两次点选，选中即关
    会让「选时→选分」断裂）；面板关闭走 popover 机制通道（外点/ESC）或再点触发器。
    空值状态点选时列 → "HH:00"（分位缺省 0）、点选分列 → "00:MM"（时位缺省 0）。

    值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持 ↔ data.value；
    选中 / 清除路径手动派发 input（非冒泡）+ change（冒泡 detail = { value }）；
    内嵌 input[type=hidden] 表单载体（name 透传，原生直提交）。

    键盘（按简，ADR-0025 边界声明）：面板内不做两列间漫游；触发器 Enter/ArrowDown
    开面板、面板开时 Enter 收起；ESC/Tab 归 popover 打开栈与原生移焦（机制继承）。
-->
<!-- 根 class 拼接进骨架宿主；data-open / data-has-value 由 mounted JS 通道同步，
     根上无动态绑定（T4=B） -->
<span
  class="asc-time-picker asc-field-box"
  x-define="autospark.time-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",       // 当前值（"HH:mm" 字符串语域，""=空；受控真相走宿主 x-model——el.value 桥）
            placeholder: "", // 占位文案（空时走 i18n 词典 time-picker.placeholder 键，回退「请选择时间」）
            clearable: false, // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）
            name: "",        // 表单载体名（元素名写法下 name 属性折叠为 props——与宿主属性双通道，mounted 合取）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            hasValue: false,   // 当前有值（清除钮可见性 / 占位切换）
            open: false,       // 面板开合态（面板 mounted/unmounted 沿链写回）
            curHour: -1,       // 当前时位（-1 无值——面板 data-selected 比较基准）
            curMinute: -1,     // 当前分位（-1 无值）
            hourList: [],      // 时列（0-23，{v,label}——面板 x-for 数据源）
            minuteList: [],    // 分列（0-59，{v,label}）
            hTick: 0,          // 时格点选哨兵（自增必变免疫同值去重；触发本组件时位提交流程）
            hVal: null,        // 时格点选携带值（0-23）
            mTick: 0,          // 分格点选哨兵
            mVal: null,        // 分格点选携带值（0-59）
        }),
        methods: {
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-time-picker-trigger");
            },
            // 表单载体（hidden input；每查现取）
            carrierEl() {
                return this.el.querySelector(".asc-time-picker-carrier");
            },
            // 两位补零（时/分格式化）
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            // "HH:mm" 解析（非法形态回 null）
            parseHm(s) {
                if (typeof s !== "string") return null;
                const p = s.split(":");
                if (p.length !== 2) return null;
                const h = Number(p[0]), mi = Number(p[1]);
                if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
                if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
                return { h: h, mi: mi };
            },
            // 时分 → "HH:mm"
            fmtHm(h, mi) {
                return this.pad2(h) + ":" + this.pad2(mi);
            },
            // 时/分列构建（24 时 / 60 分静态刻度）
            buildLists() {
                const hours = [], minutes = [];
                for (let i = 0; i < 24; i++) hours.push({ v: i, label: this.pad2(i) });
                for (let i = 0; i < 60; i++) minutes.push({ v: i, label: this.pad2(i) });
                this.data.hourList = hours;
                this.data.minuteList = minutes;
            },
            // 选中呈现同步（JS 通道：值即展示——"HH:mm" 直出；curHour/curMinute 供面板选中标记）
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
            // 开合态副作用：aria-expanded / data-open 同步（JS 直写无 T4=B 约束）
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
            },
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            // 值变更出口（部分提交/清除共用）：input 非冒泡（x-model 监听在宿主自身）
            //     + change 冒泡 detail={value}（外层消费）——两列连续点选会连发两次
            //     （值确实变了两次，诚实语义，ADR-0025）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览
            //     但点选被 guard 阻断——只读可见选不了）
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（声明式面板不入 overlay
            //     实例注册表，ADR-0022 同款绕行）；open 守卫防已关态误开
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 部分提交（时/分格哨兵汇聚点）：只更新对应位，另一位缺省 0；面板保持开
            //     （两列连续选择语义）；禁用/只读阻断；同值幂等跳过（不派发）
            applyPart(isHour, v) {
                if (this.data.disabled || this.data.readonly) return;
                if (v == null || v === "") return; // 载荷空值守卫：Number(null)===0 的数字转换坑（哨兵无载荷重跑防御第二道）
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
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +
            //     阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）；字符串空语域
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            // 触发器键盘（按简）：Enter/ArrowDown 开面板、面板开时 Enter 收起确认；
            //     ESC 与 Tab 不拦截
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
            // —— 值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持——
            //     劫持前快照 expando；无 x-model 回退 props.value 初值；setter 等值守卫
            //     防 x-model 回写环（guard 值经闭包持有——watch 侧同步维护）
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

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：布尔 props
            //     元素名写法归一（裸属性折叠为空串——"" → true，ADR-0025）+ 载体 name
            //     双通道 + 时分列构建 + 全量首同步
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

            // —— props / 哨兵跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            // 面板哨兵：时/分格点选（hTick/mTick——面板模板不能跨组件边界调本组件方法，
            //     经哨兵键沿链写回，ADR-0022 决策 3）。
            //     已见值比对幂等防御（color-picker 同款）：scope.refresh 类机制（i18n
            //     ready 换血等）以**当前哨兵值**重跑监听——无变化重跑若照常执行，会把
            //     空载荷（hVal/mVal 缺省 null）数字化成 0（Number(null)===0）打掉已注入
            //     的初值。同值跳过，哨兵真正自增才执行
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
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input/select 同款），光标手型 ---------- */
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

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面） ---------- */
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

    /* ---------- 尾部动作件：清除钮与时钟图标（开面板染 tone） ---------- */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换（变量链不变） ---------- */
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
    /* 时/分格：居中热区（克隆体内零 x-if——选中标记走 x-bind 布尔属性 + CSS） */
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
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
    [dark] .asc-time-picker-panel,
    [data-dark] .asc-time-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-time-picker-primary, #56baff));
      color: var(--auto-color, var(--asc-time-picker-panel-color, #fafafa));
    }
  </style>
  <!-- 默认段（替换 field 出口 fallback）：表单载体 + 触发器（popover 宿主 /
         combobox 语义）+ 清除钮 + 时钟图标 -->
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
`,Do=`<!--
    autospark-time-picker-panel 时间面板（ADR-0025）——time-picker 的内部组件（非用户
    直接消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制
    （trigger:click）渲染进 body 覆盖物容器，面板外壳由 popover-shell 承载，本组件
    只贡献两列滚动列表（时 0-23 / 分 0-59）内容。

    与触发器组件（autospark.time-picker）的通信走 scope 链：聚合视图沿链读写触发器
    组件 data 域——
    - 读：hourList/minuteList（x-for 数据源）、curHour/curMinute（选中比较基准）；
    - 写：哨兵键 hTick/hVal 与 mTick/mVal（时/分格点选——面板模板不能跨组件边界调
      触发器组件 method，ADR-0022 决策 3；自增哨兵免疫同值去重；事件表达式用逗号
      运算符单表达式形态）；
    - 开合态：mounted/unmounted 沿链写 open。

    选择语义（ADR-0025 决策 2）：点选**部分提交**且面板保持开（两列连续选择）；关闭
    走 popover 机制通道（外点/ESC）或再点触发器。mounted 时两列各滚动定位到当前选中
    格（无选中落列首）。克隆体内零 x-if——选中标记走 x-bind 布尔属性 + CSS。
-->
<div class="asc-time-picker-panel" x-define="autospark-time-picker-panel">
  <script setup>
    {
        // 本组件零 props、零自有状态——全部数据经 scope 链读写触发器组件域；
        // data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生图标染色 / aria-expanded）
            this.data.open = true;
            // 两列各自滚动定位到当前选中格（无选中落列首——scrollIntoView 平滑兜底，
            // happy-dom 无布局环境下可选链静默跳过）
            const scrollCol = (col) => {
                const sel = col.querySelector(".asc-time-picker-cell[data-selected]");
                (sel || col.querySelector(".asc-time-picker-cell"))?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(() => {
                this.el.querySelectorAll(".asc-time-picker-col").forEach(scrollCol);
            }, 0);
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 时/分两列：静态刻度（触发器域 hourList/minuteList），点选沿链写哨兵键
         （部分提交，面板保持开——ADR-0025 决策 2） -->
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
`,Oo=`autospark.time-picker`,ko=`autospark-time-picker-panel`,Ao=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;function jo(e){e.icons?.add?.(`time-clock`,Ao),e.components[Oo]=Eo,e.components[ko]=Do}Mo();function Mo(){y(e=>{m(e),jo(e)})}var No=`<!--
    autospark.time-select 时间点下拉（ADR-0025）——触发器组件：select 范式直系克隆
    （ADR-0022）：Field 盒饰形态 + 选中值展示 + 时钟图标；起止/步长生成离散时间
    点列表作 options。列表面板不自建弹层，复用 x-popover 指令机制呈现（trigger:click
    形态——点击切换 / 面板外点击 / ESC 关闭均机制继承）：内层触发器元素即 popover
    宿主，面板组件 autospark-time-select-panel（同插件注册，panel.html）渲染进 body
    覆盖物容器；**fit 宽度匹配 + uid 配对 min-width 两段合成**（select 决策 1 同款：
    fit 基准是触发器内容区，面板 mounted 按 uid 配对测盒饰宽补 min-width——面板与
    select 下拉同款观感）。

    面板 ↔ 触发器通信走 scope 链：面板经聚合视图沿链读写本组件 data 域——读
    options/activeValue/value 呈现，写哨兵键（pickTick/pickValue 选项点击、keyTick/
    keyDir 键盘导航）回传交互；面板 mounted/unmounted 沿链写 open 开合态。

    值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持 ↔ data.value；
    选中 / 清除路径手动派发 input（非冒泡）+ change（冒泡 detail = { value }）；内嵌
    input[type=hidden] 表单载体（name 透传，原生直提交）。

    键盘（select 同款）：上下移动高亮（首尾环绕）/ Enter 确认（未开先开）/ ESC 归
    popover 打开栈（机制继承）不拦截 / Tab 自然移焦。

    离散列表生成（ADR-0025 决策 3）：start（"00:00"）→ end（"23:00"）含端按 step
    （"00:30"）分钟步进；非法步长（≤0 分钟）回退 30；列表长度防御上限 2000（病态
    配置兜底）；start>end 之类空区间渲染空态（i18n time-select.empty 回退「暂无数据」）。
-->
<!-- 根 class 拼接进骨架宿主；data-open / data-has-value 由 mounted JS 通道同步，
     根上无动态绑定（T4=B） -->
<span
  class="asc-time-select asc-field-box"
  x-define="autospark.time-select"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",       // 当前值（"HH:mm" 字符串语域，""=空；落在列表内才有选中标记；受控真相走宿主 x-model）
            placeholder: "", // 占位文案（空时走 i18n 词典 time-select.placeholder 键，回退「请选择时间」）
            clearable: false, // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）
            start: "00:00",  // 起始时间（含端）
            end: "23:00",    // 结束时间（含端）
            step: "00:30",   // 步长（"HH:mm"，分钟粒度解析）
            name: "",        // 表单载体名（元素名写法下 name 属性折叠为 props——与宿主属性双通道，mounted 合取）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            uid: "",               // 实例唯一标识（根 data-asc-time-select-uid 属性载体——面板宽度匹配的
                                   // 配对键，select 决策 1 两段合成同款）
            hasValue: false,       // 当前有值（清除钮可见性 / 占位切换）
            open: false,           // 面板开合态（面板 mounted/unmounted 沿链写回）
            options: [],           // 离散时间点列表 [{ label, value }]（start/end/step 变化时重建）
            activeIndex: -1,       // 键盘高亮索引（options 内；-1 无高亮）
            activeValue: null,     // 高亮项值（面板 :data-active 比较基准——索引对模板不可见，值通道免疫重建）
            pickTick: 0,           // 选中哨兵（选项点击写：自增必变免疫同值去重；触发本组件选中流程）
            pickValue: null,       // 选中哨兵携带值
            keyTick: 0,            // 键盘导航哨兵（触发器键盘经方法直调，键位预留 select 协议对称）
            keyDir: 0,             // 键盘导航方向（1 下 / -1 上）
        }),
        methods: {
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-time-select-trigger");
            },
            // 表单载体（hidden input；每查现取）
            carrierEl() {
                return this.el.querySelector(".asc-time-select-carrier");
            },
            // 两位补零
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            // "HH:mm" 解析为分钟数（h*60+mi；非法形态回 null）
            parseHmMinutes(s) {
                if (typeof s !== "string") return null;
                const p = s.split(":");
                if (p.length !== 2) return null;
                const h = Number(p[0]), mi = Number(p[1]);
                if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
                if (h < 0 || mi < 0) return null;
                return h * 60 + mi;
            },
            // 分钟数 → "HH:mm"（>23 时不进位截断到日内——起止语域本就该在 0-23 时内，防御归一）
            fmtMinutes(total) {
                const t = ((total % 1440) + 1440) % 1440;
                return this.pad2(Math.floor(t / 60)) + ":" + this.pad2(t % 60);
            },
            // 离散列表重建：起止含端按步长生成；非法步长（≤0 分钟）回退 30；长度防御
            //     上限 2000；activeIndex 越界时回落当前选中项
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
            // 高亮同步（activeValue 为面板比较基准）
            syncActive() {
                const list = this.data.options ?? [];
                const i = this.data.activeIndex;
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;
                else this.data.activeValue = null;
            },
            // 高亮落当前选中项（打开面板时的定位基准；无选中回落首项——键盘起步可达）
            setActiveToValue() {
                const list = this.data.options ?? [];
                let i = list.findIndex((o) => o && String(o.value) === String(this.data.value));
                if (i < 0 && list.length > 0) i = 0;
                this.data.activeIndex = i;
                this.syncActive();
            },
            // 选中呈现同步（JS 通道：值即展示——"HH:mm" 直出，无 label 解析层）
            syncValue() {
                const has = this.data.value != null && this.data.value !== "";
                this.data.hasValue = has;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(this.data.value) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            // 开合态副作用：aria-expanded / data-open 同步 + 打开时高亮落当前选中项
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) this.setActiveToValue();
            },
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            // 值变更出口（选中/清除共用）：input 非冒泡（x-model 监听在宿主自身）+
            //     change 冒泡 detail={value}（外层消费）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览
            //     但选中被 pick guard 阻断）
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（声明式面板不入 overlay
            //     实例注册表，ADR-0022 同款绕行）；open 守卫防已关态误开
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 高亮移动（dir = 1 下 / -1 上）：首尾环绕（生成物无禁用项，环找直通）
            moveActive(dir) {
                const list = this.data.options ?? [];
                if (list.length === 0) return;
                const i = this.data.activeIndex;
                this.data.activeIndex = (i + dir + list.length) % list.length;
                this.syncActive();
            },
            // Enter 确认当前高亮项
            confirmActive() {
                if (this.data.activeValue != null) this.pick(this.data.activeValue);
            },
            // 选中流程（选项哨兵 / 触发器键盘汇聚点）：禁用与只读阻断；同值仅关面板；
            //     写值 + 双派发 + 关面板 + 焦点回触发器（选中即关——单列离散选项语义，
            //     与 time-picker 两列部分提交分叉）
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
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +
            //     阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            // 触发器键盘导航（select 同款）：上下移动高亮（未开先开）/ Enter 确认
            //     （未开先开）/ ESC 与 Tab 不拦截
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
            // —— 值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持——
            //     劫持前快照 expando；无 x-model 回退 props.value 初值；setter 等值守卫
            //     防 x-model 回写环（guard 值经闭包持有——watch 侧同步维护）
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

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：布尔 props
            //     元素名写法归一（裸属性折叠为空串——"" → true，ADR-0025）+ 载体 name
            //     双通道 + 实例 uid（面板宽度配对键）+ 列表构建 + 全量首同步
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

            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作
            //     触发信号，家族惯用法）——
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("start", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("end", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("step", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            // 面板哨兵：选中（pickTick）/ 键盘导航（keyTick——协议对称预留）
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-time-select">
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input/select 同款），光标手型 ---------- */
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

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面） ---------- */
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

    /* ---------- 尾部动作件：清除钮与时钟图标（开面板染 tone） ---------- */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换（变量链不变） ---------- */
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
    /* 选项列表：最大高度限档 + 纵向滚动（select 列表同款） */
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
    /* 空态（病态起止配置兜底）：居中辅助色文案 */
    .asc-time-select-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-time-select-empty, rgba(0, 0, 0, 0.35)));
    }
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
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
  <!-- 默认段（替换 field 出口 fallback）：表单载体 + 触发器（popover 宿主 /
         combobox 语义，fit 面板宽随触发器）+ 清除钮 + 时钟图标 -->
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
`,Po=`<!--
    autospark-time-select-panel 时间点列表面板（ADR-0025）——time-select 的内部组件
    （非用户直接消费，无文档页；连字符注册名的成因见 index.ts）：select 下拉面板的
    直系克隆（非 filter/virtual 子集，ADR-0022 范式）——经 x-popover 指令机制
    （trigger:click）渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/宽度 fit 随
    触发器）由 popover-shell 承载，本组件只贡献离散时间点选项列表内容。

    与触发器组件（autospark.time-select）的通信走 scope 链：聚合视图沿链读写触发器
    组件 data 域——
    - 读：options（x-for 数据源）/ activeValue（高亮基准）/ value（选中基准）；
    - 写：哨兵键 pickTick/pickValue（选项点击——面板模板不能跨组件边界调触发器组件
      method，ADR-0022 决策 3；自增哨兵免疫同值去重；事件表达式用逗号运算符单表达式
      形态）；
    - 开合态：mounted/unmounted 沿链写 open。

    克隆体内零 x-if（共享快照多实例串台规避，ADR-0021 边界 3）——选中标记 check 图标
    恒渲染、显隐走 data-selected 父选择器纯 CSS 驱动；空态行是 template 的同级兄弟
    （非克隆体）。
-->
<div class="asc-time-select-panel" x-define="autospark-time-select-panel">
  <script setup>
    {
        // 本组件零 props、零自有状态——全部数据经 scope 链读写触发器组件域；
        // data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生图标染色 / aria-expanded / 高亮定位）
            this.data.open = true;
            // 宽度匹配触发器盒饰（select 决策 1 两段合成同款，ADR-0025）：popover 的
            // fit 基准是触发器内容区（popover 宿主元素，不含盒饰 padding）——按 uid
            // 配对测盒饰宽，补写 shell 面板 min-width（fit 持续写 width，min-width 抬到
            // 盒宽；每次打开新实例重测，盒宽变化随重开自适应）
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-time-select-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
            // 高亮项滚动跟随（键盘导航可见性；初次打开定位到选中项/首项；列表在面板内现查）
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
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 选项列表：template 形态 x-for（字号档位全跟随）；选中标记 check 图标恒渲染、
         显隐走 data-selected 父选择器纯 CSS（克隆体内零 x-if，ADR-0021 边界 3） -->
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
    <!-- 空态（template 同级兄弟，非克隆体）：病态起止配置兜底，i18n time-select.empty -->
    <div
      class="asc-time-select-empty"
      x-if="!(options && options.length > 0)"
      x-text="t('time-select.empty') === 'time-select.empty' ? '暂无数据' : t('time-select.empty')"
    ></div>
  </div>
</div>
`,Fo=`autospark.time-select`,Io=`autospark-time-select-panel`,Lo=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;function Ro(e){e.icons?.add?.(`time-clock`,Lo),e.components[Fo]=No,e.components[Io]=Po}zo();function zo(){y(e=>{m(e),Ro(e)})}var Bo=`<!--
    autospark.autocomplete 自动补全输入（ADR-0027）——触发器组件：**复制 input 结构
    而非嵌套消费**（input-number 先例：输入事件被建议管道消费，嵌套则两层语义互渗 +
    跨插件产物依赖；共享面已由 field 骨架继承覆盖，ADR-0020）。真原生 input +
    .asc-field-box 盒饰（input 同款 chrome），原生键盘/IME/自动填充全保留。

    建议面板（panel.html，内部组件 autospark-autocomplete-panel）不自建弹层——复用
    x-popover 指令机制（trigger:click 形态，ADR-0022 协议沿袭）：触发器包裹 span 即
    popover 宿主，面板渲染进 body 覆盖物容器，fit 两段合成宽度匹配（uid 配对测盒饰宽
    补 min-width，select 同款）。面板 ↔ 触发器通信走 scope 链：面板读 items/
    activeValue/loading 呈现，写哨兵键 pickTick/pickValue（选项点击）、hoverTick/
    hoverValue（悬停高亮）回传，mounted/unmounted 沿链写 open。

    开合模型（ADR-0027 决策 5）：popover click toggle 为底座，组件补 focus 确保开
    （真实点击 latch 防双 toggle 竞态）/ 输入确保开（已关状态输入即重开）/ 建议空自动关。

    建议数据源双通道（决策 3）：fetch props 函数引用在场全权接管（(query)=>Promise，
    次序守卫防过期回包）；缺席走 suggestions 本地包含过滤（query 空显示全量）。
    debounce 默认 300ms；IME 组合态守卫（composing 期不驱动建议管道）。

    值桥（文本语域，ADR-0020 input 范式对齐）：宿主 el.value 劫持 ↔ 内层原生控件；
    输入路径原生事件自然冒泡（x-model 直收零手动派发）；pick 路径程序化写控件后
    三派发——input（冒泡自原生控件，x-model 回写）+ change（detail={value}）+
    select（detail={value}，仅选中建议时触发）；清除路径 input 派发（静默不驱动建议）。

    键盘（决策 8，select 同款高亮漫游模型）：上下移动高亮（跳过禁用项、首尾环绕，
    未开先开）/ Enter 开态确认当前高亮（preventDefault 防误触发表单；无高亮关面板；
    关态原生放行）/ ESC 归 popover 打开栈（机制继承）/ Tab 自然移焦。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-autocomplete + .asc-field-box 盒饰）；
     data-open 由 mounted JS 通道同步，根上无动态绑定（T4=B）；disabled/readonly/status
     经 field 骨架通道（data() 不重复声明，ADR-0020 决策 3） -->
<span
  class="asc-autocomplete asc-field-box"
  x-define="autospark.autocomplete"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        // —— 实例私有变量（_locals 通道：非响应式、不进聚合视图，仅 this.<key> 访问；
        //     定时器句柄/防抖标记/竞态旗是官方典型用途，ADR-0057）——
        debounceTimer: null,   // 待发防抖计时器句柄（null 无待发）
        fetchSeq: 0,           // fetch 在途次序号（自增；回包序号不一致即过期丢弃）
        silent: false,         // 静默旗（pick/清除路径手动派发 input 不驱动建议管道）
        lastHostClickAt: 0,    // 组件内真实点击时刻（focus 确保开的竞态 latch，决策 5）
        composing: false,      // IME 组合态（composing 期不驱动建议管道，决策 3）
        focused: false,        // 控件聚焦态（focusin/focusout 维护——比 activeElement 现查稳）
        lastValue: "",         // 值缓存（劫持 getter 的控件缺位兜底 / 外部同步防回环基准）
        initDone: false,       // 初始化窗口标志（劫持 setter 重放识别门闩，ADR-0020）
        data: () => ({
            value: "",        // 文本语域非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥，ADR-0020）
            suggestions: [],  // 建议源 string[] | { value, label?, disabled? }[]（经状态引用注入——字面量数组有引擎死环缺陷）
            fetch: null,      // 异步建议通道：action 名字符串（经 scope.getAction 延迟解析，ADR-0027 决策 3）或函数引用（兼容位）；在场全权接管本地过滤
            debounce: 300,    // 输入防抖 ms（0 即时；fetch 与本地过滤共用）
            placeholder: "",  // 占位文案（空时走 i18n 词典 autocomplete.placeholder 键，回退「请输入」）
            clearable: false, // 清除钮（值非空且可交互时可见）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            uid: "",          // 实例唯一标识（根 data-asc-autocomplete-uid 载体——面板宽度配对键，select 同款）
            items: [],        // 归一化建议列表 [{ value, label, disabled }]（面板 x-for 数据源；解析管道整体替换）
            activeIndex: -1,  // 键盘高亮索引（items 内；-1 无高亮；建议重建即复位）
            activeValue: null,// 高亮项值（面板 :data-active 比较基准——值通道免疫列表重建）
            loading: false,   // fetch 在途（触发器 loading 图标 + 面板 x-loading 遮罩）
            hasValue: false,  // 当前有值（清除钮可见性驱动）
            open: false,      // 建议面板开合态（面板 mounted/unmounted 沿链写回）
            pickTick: 0,      // 选中哨兵（面板选项点击写：自增必变免疫同值去重；触发本组件选中流程，ADR-0022 决策 2）
            pickValue: null,  // 选中哨兵携带值
            hoverTick: 0,     // 悬停高亮哨兵（面板 mouseenter 写——高亮跟随指针，ADR-0027 新增协议成员）
            hoverValue: null, // 悬停哨兵携带值
        }),
        methods: {
            // 触发器包裹 span（popover 宿主；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-autocomplete-trigger");
            },
            // 内层原生控件（每查现取）
            nativeEl() {
                return this.el.querySelector(".asc-autocomplete-native");
            },
            // 建议归一化：string 元素升格 { value, label }；对象元素补 label 缺省与 disabled 布尔化
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
            // 本地过滤（fetch 缺席通道）：query 空显示全量；否则对 label·value 不区分大小写包含匹配
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
            // fetch 通道在场判定（action 名或函数引用均可接管本地过滤）
            hasFetch() {
                return !!this.resolveFetch();
            },
            // 建议应用（解析出口统一收口）：整体替换 + 高亮复位 + 开合规则
            // （建议在场且控件聚焦确保开 / 建议空自动关）
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
            // fetch 通道解析（ADR-0027 决策 3）：action 名字符串经 scope.getAction 延迟
            // 解析（支持晚注册；engine.actions[name] 与 getAction 返回描述符，命令式
            // 调用取 .handle）；函数引用形态为兼容位（autostore 对状态函数见函数即求值
            // ——props 值对象里的函数引用经表达式读取即被求值，常态不可达）
            resolveFetch() {
                const raw = this.data.fetch;
                if (typeof raw === "function") return raw;
                if (typeof raw === "string" && raw.trim() !== "") {
                    const act = this.scope.getAction(raw.trim());
                    if (act && typeof act.handle === "function") return act.handle;
                }
                return null;
            },
            // 即时解析：fetch 通道（次序守卫：过期回包静默丢弃）或本地过滤
            resolveNow(query) {
                if (this.data.disabled || this.data.readonly) return;
                const fn = this.resolveFetch();
                if (fn) {
                    const cur = ++this.fetchSeq;
                    this.data.loading = true;
                    Promise.resolve()
                        .then(() => fn.call(null, query))
                        .then((r) => {
                            if (cur !== this.fetchSeq) return; // 过期回包（期间又有新输入/选中）
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
            // 防抖调度（immediate = true 跳过防抖即时解析）：重排前清旧计时器；到期时
            // 值已被新输入取代则跳过（新输入自会重排）
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
                    if (!now || String(now.value ?? "") !== q) return; // 已被新输入取代
                    self.resolveNow(q);
                };
                if (immediate || ms === 0) run();
                else this.debounceTimer = setTimeout(run, ms);
            },
            // 取消待发防抖与在途回包判定（pick / 清除后防旧建议重开面板）
            cancelPending() {
                if (this.debounceTimer !== null) {
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = null;
                }
                this.fetchSeq++; // 在途回包即刻过期
            },
            // 开面板：程序化派发触发器点击（popover click 触发模型 toggle；open 守卫防已开态误关）
            openPanel() {
                if (this.data.disabled || this.data.readonly) return;
                if (this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（「再点宿主关闭」——命令式
            // close 只回收命令式实例，声明式面板须走 toggle 模拟，ADR-0022 决策 1）
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 高亮同步（activeValue 为面板比较基准）
            syncActive() {
                const list = this.data.items ?? [];
                const i = this.data.activeIndex;
                this.data.activeValue = i >= 0 && i < list.length ? (list[i].value ?? null) : null;
            },
            // 高亮移动（dir = 1 下 / -1 上）：环找下一个非禁用项（首尾环绕；全禁用不动）
            moveActive(dir) {
                const list = this.data.items ?? [];
                if (list.length === 0) return;
                let i = this.data.activeIndex;
                for (let step = 0; step < list.length; step++) {
                    i = (i + dir + list.length) % list.length;
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }
                }
            },
            // 内部静默派发 input（pick / 清除路径的程序化赋值不触发原生事件；手动派发冒泡
            //     过宿主驱动 x-model 回写，但静默旗隔离建议管道）
            emitInput(n) {
                this.silent = true;
                try {
                    n.dispatchEvent(new Event("input", { bubbles: true }));
                } finally {
                    this.silent = false;
                }
            },
            // 选中流程（面板点击哨兵 / 键盘 Enter 汇聚点）：禁用与只读阻断；取消在途管道；
            //     写原生控件 + 三派发（input→x-model 回写 / change / select——detail 恒
            //     { value }）+ 关面板 + 焦点回控件（字符串归一比较，文本语域 7 与 "7" 互认）
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
            // 清除（内部动作件，点击不转发焦点）：清空 + input 静默派发 + 收面板 + 焦点回
            //     控件 + 阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）
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
            // 输入控件键盘导航：上下移动高亮（未开先开——建议在场直接开，否则即时解析一次）/
            //     Enter 开态确认或关面板（preventDefault 防误触发表单提交；关态原生放行）；
            //     ESC 与 Tab 不拦截（ESC 归 popover 打开栈——机制继承；Tab 自然移焦）
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
            // —— 内层控件查询（每查现取，家族纪律）——
            const native = () => this.el.querySelector(".asc-autocomplete-native");

            // —— 值同步辅助（清除可见性驱动）——
            const syncLen = () => {
                const n = native();
                this.data.hasValue = !!n && String(n.value ?? "") !== "";
            };

            // —— 值桥（x-model 兼容协议，ADR-0020 决策 5 全套）：劫持前快照 expando
            //     （x-model 编译期可能已写初值）；快照归一值 + 初始化窗口标志 = 重放识别
            //     （scope.refresh 类换血不得把初值归属打回）；setter 经控件落值 + 值缓存 ——
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

            // —— 输入跟随（原生 input 冒泡经宿主；x-model 回写由宿主监听自理）：静默旗内
            //     的手动派发跳过；IME composing 期只同步值不驱动建议 ——
            this.el.addEventListener("input", (e) => {
                if (this.silent) return;
                const n = native();
                if (!n || e.target !== n) return;
                this.lastValue = n.value;
                syncLen();
                if (e.isComposing || this.composing) return;
                this.scheduleResolve();
            });
            // —— IME 组合态守卫（composition 事件冒泡，监听挂宿主委托）——
            this.el.addEventListener("compositionstart", (e) => {
                if (e.target === native()) this.composing = true;
            });
            this.el.addEventListener("compositionend", (e) => {
                if (e.target !== native()) return;
                this.composing = false;
                this.scheduleResolve();
            });

            // —— 真实点击 latch（capture 层，先于 popover 宿主 bubble 监听）：focus 确保
            //     开与 popover click toggle 的竞态防护基准（ADR-0027 决策 5）——
            this.el.addEventListener(
                "click",
                () => { this.lastHostClickAt = Date.now(); },
                true,
            );

            // —— 焦点态维护（focused 旗：applyItems 自动开面板的判据——比 activeElement
            //     现查稳，detached 容器/测试环境 activeElement 语义不一）+ focus 确保开
            //     （决策 5）：Tab 聚焦也开面板——建议在场直接开；fetch 通道缺席建议时
            //     不发空词请求（等输入驱动，antd 同款）；本地通道解析全量。真实点击短窗
            //     内跳过（该点击已由 popover click toggle 自理，防双 toggle 互关）——
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
                if (to instanceof Node && this.el.contains(to)) return; // 焦点组件内移动不置失焦
                this.focused = false;
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：name 表单桥
            //     透传（原生直提交，ADR-0020 决策 6）+ uid 配对键落根属性 + 初值同步 +
            //     首次建议解析（仅本地通道——fetch 通道建议由输入驱动，空词不发请求，
            //     antd 同款）+ 劫持门闩放开 ——
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
                this.initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩
                if (!this.hasFetch()) this.scheduleResolve(true);
            }, 0);

            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            // value props 单向同步（非受控/外部受控无 x-model 场景）：值缓存防回环
            this.watch("value", ({ value }) => {
                const v = String(value ?? "");
                if (v === this.lastValue) return;
                this.lastValue = v;
                const n = native();
                if (n) n.value = v;
                syncLen();
            });
            // 建议源变化：本地通道即时重析（fetch 通道由 fetch props 全权接管，不消费 suggestions）。
            // 已见值比对幂等防御（color-picker 哨兵同款）：scope.refresh 类机制（i18n
            // ready 换血等）以**当前值**重跑监听——无变化重跑若照常重析，fetch 通道用例
            // 的「防抖窗口内只发一次请求」「IME composing 期不驱动」断言被多余解析打掉
            let lastSuggestions = this.data.suggestions;
            this.watch("suggestions", () => {
                if (this.data.suggestions === lastSuggestions) return;
                lastSuggestions = this.data.suggestions;
                setTimeout(() => {
                    if (!this.hasFetch()) this.resolveNow(String(native()?.value ?? ""));
                }, 0);
            });
            // fetch 函数变化（含首次注入）：即时重析一次（已见值比对幂等，同上）
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
            // 面板哨兵：选中（pickTick）/ 悬停高亮（hoverTick——值通道定位，未命中或禁用不动）
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
    /* ---------- 触发器包裹层（popover 宿主）：盒内铺满，输入区即热区 ---------- */
    .asc-autocomplete-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      align-self: stretch;
      outline: none;
    }
    /* 原生控件裸化：外观由骨架盒饰承载（input 结构复制，ADR-0027 决策 1） */
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

    /* ---------- 动作件（清除钮 / loading 指示）：内部交互件，淡色常态 + 悬停正文色 ---------- */
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
    /* loading 指示（非交互件：不抢光标，图标自带旋转动画） */
    .asc-autocomplete-loading {
      cursor: default;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
    /* 空态（含过滤无匹配）：居中辅助色文案 */
    .asc-autocomplete-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-autocomplete-empty, rgba(0, 0, 0, 0.35)));
    }
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
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
  <!-- 默认段（替换 field 出口 fallback）：触发器包裹 span（popover 宿主；combobox
         语义与 aria 在内层真 input 上——ARIA combobox 模式）+ 清除钮（动作件）+
         loading 指示。占位文案走 props 与 i18n 词典（继承形态嵌套插槽出口被忽略，
         ADR-0056——不开真插槽，select 同款） -->
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
`,Vo=`<!--
    autospark-autocomplete-panel 建议面板（ADR-0027）——autocomplete 的内部组件
    （非用户直接消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令
    机制（trigger:click）渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/宽度 fit
    随触发器）由 popover-shell 承载，本组件只贡献建议列表内容。

    与触发器组件（autospark.autocomplete）的通信走 scope 链（ADR-0022 决策 2 同款）：
    overlay 内容宿主恒以「open + dataContext:'host'」实例化本组件，聚合视图沿链读写
    触发器组件 data 域——
    - 读：items（x-for 数据源）/ activeValue（高亮基准）/ loading（x-loading 遮罩）；
    - 写：哨兵键 pickTick/pickValue（建议项点击）、hoverTick/hoverValue（悬停高亮
      回传）——面板模板不能跨组件边界调触发器组件 method（x-on 组件 method 查找不
      穿透父组件），自增哨兵免疫同值去重；事件表达式用逗号运算符单表达式形态（分号
      多语句依赖新版引擎回退，旧产物不可用）；
    - 开合态：mounted/unmounted 沿链写 open（触发器侧 data-open 同步）。

    宽度匹配触发器盒饰（select 同款两段合成）：popover 的 fit 基准是触发器内容区
    （popover 宿主元素，不含盒饰 padding）——按根属性 data-asc-autocomplete-uid 配对
    测盒饰宽，补写 shell 面板 min-width（fit 持续写 width，min-width 抬到盒宽；每次
    打开新实例重测）。空态文案走 i18n 词典 autocomplete.empty 键（回退「暂无建议」）。
-->
<div class="asc-autocomplete-panel" x-define="autospark-autocomplete-panel">
  <script setup>
    {
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生 data-open）
            this.data.open = true;
            // 宽度匹配触发器盒饰：按 uid 配对测盒饰宽补 shell 面板 min-width
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-autocomplete-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
            // 高亮项滚动跟随（键盘导航可见性；列表在面板内现查）
            const scrollActive = () => {
                const el = this.el.querySelector(".asc-autocomplete-option[data-active]");
                el?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(scrollActive, 0);
            this.watch("activeValue", () => { setTimeout(scrollActive, 0); });
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 建议列表：x-loading 遮罩（fetch 在途）+ template 形态 x-for（空态行随容器） -->
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
`,Ho=`autospark.autocomplete`,Uo=`autospark-autocomplete-panel`,Wo=new Set([`disabled`,`readonly`,`clearable`]);function Go(e){e.components[Ho]=Bo,e.components[Uo]=Vo,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-autocomplete`))){let e=document.createElement(`span`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):r.value===``&&Wo.has(r.name)?n.push(`${Q(Z(r.name))}: true`):n.push(`${Q(Z(r.name))}: ${JSON.stringify($(r.value))}`);for(e.setAttribute(`x-component:${Ho}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ko();function Ko(){y(e=>{m(e),Go(e)})}var qo=`<!--\r
    autospark.breadcrumb 面包屑（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行）：\r
    数据驱动 items（{ label, href?, icon? }[]）渲染层级路径——末项恒为「当前页」\r
    （aria-current="page"）；有 href 的项渲染为真 a 链接（primary 色，原生导航语义\r
    保真），无 href 的项渲染为纯文本（正文色）。\r
\r
    两形态（mounted 统一收敛到 items 数据面渲染）：\r
    - items 状态引用注入：<nav x-component:autospark.breadcrumb="{ items: crumbs }">——\r
      引擎对值对象内的字面量数组 props 存在 _propsEqual 引用比较死环缺陷（P0 固化\r
      规避清单第 1 条），items 恒走状态引用；\r
    - 子元素声明（静态路径）：<x-breadcrumb-item label href icon> 由 index.ts 的\r
      precompile 变换折叠为 items JSON 落 data-* 通道（字符串标量，规避字面量数组\r
      props），mounted 解析写组件 data → x-for 响应渲染。\r
\r
    分隔符（separator）："arrow" = x-icon 内置箭头 | 其他任意字符串原样文本（缺省 "/"）；\r
    末项分隔符经 :last-child 隐藏。\r
\r
    router 隔离（ADR-0018 决策 6 约定 2）：组件纯状态驱动、不 import router——点击\r
    拦截由外层包裹元素 @click.capture 判 a[href] preventDefault 接管（配方见组件文档）。\r
\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——本组件无宿主级变体外观，绑定全落在编译子树内层（克隆体内部元素）。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——字号档位经主题通道全跟随；breadcrumb 不在 data() 声明主题六键，\r
     内部变体属性亦禁用六个通道名 -->\r
<nav\r
  class="asc-breadcrumb"\r
  x-define="autospark.breadcrumb"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],      // 面包屑项 { label, href?, icon? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底\r
            separator: "/", // 分隔符："arrow" = x-icon 内置箭头 | 其他任意字符串原样文本（缺省 "/"）\r
        }),\r
        mounted() {\r
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props\r
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先\r
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
    /* 项载体：x-for 克隆载体（li 本体），链接/当前/分隔符横排 */\r
    .asc-breadcrumb-item {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      min-width: 0;\r
    }\r
    /* 链接项：primary 色（可点击语义引导），hover 压暗（link 同款交互惯例） */\r
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
    /* 当前项（无 href）：正文色（末项恒 aria-current="page"，绑定通道随项数变化响应） */\r
    .asc-breadcrumb-current {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      min-width: 0;\r
      color: var(--auto-color, var(--asc-breadcrumb-current, #606060));\r
    }\r
    /* 文案：单行截断（宽度受约束时省略号） */\r
    .asc-breadcrumb-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
    }\r
    /* 分隔符：辅助色弱化；末项分隔符隐藏（当前页后无路径） */\r
    .asc-breadcrumb-sep {\r
      display: inline-flex;\r
      align-items: center;\r
      color: var(--auto-third-color, var(--asc-breadcrumb-sep, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-breadcrumb-item:last-child .asc-breadcrumb-sep {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- x-for 容器宿主形态（engine 惯用语义）：ol 为容器（不克隆），其子 li 才是逐项\r
         克隆模板（:key 在容器上）；克隆体内条件显隐一律 x-show（不用 x-if）：共享快照\r
         多实例 + items 晚注入下 x-if 延迟编译会挂错 scope 链（P0 固化规避清单第 4 条，\r
         button-group 同款纪律）——href 在场 → 真 a 链接，缺席 → 纯文本当前项（互补双\r
         分支）；末项恒 aria-current（$index 判位）；分隔符双形态（arrow 图标 / 文本\r
         字符），末项经 :last-child 隐藏；icon 空值时 x-icon 渲染默认图标（x-show 隐藏\r
         不可见） -->\r
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
`,Jo=`autospark.breadcrumb`;function Yo(e){e.components[Jo]=qo,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-breadcrumb`))){let e=document.createElement(`nav`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-breadcrumb-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={label:e.getAttribute(`label`)??``},n=e.getAttribute(`href`);n!=null&&(t.href=n);let r=e.getAttribute(`icon`);return r!=null&&(t.icon=r),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${Jo}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Xo();function Xo(){y(e=>{m(e),Yo(e)})}var Zo=`<!--\r
    autospark.tabs 页签（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行 / 决策 3\r
    裁定 segmented 并入本件作 variant）：items（{ key, label, icon?, disabled? }[]，\r
    状态引用注入）驱动页签头 + 默认插槽承载面板区（消费者以 x-show / x-if 家族切面板，\r
    保活走 x-if.keepalive——引擎原生路径，组件不代理面板生命周期）。\r
\r
    值通道（受控单选，button-group 选中模式同构）：value props 单向驱动视觉 + 点击/\r
    键盘激活写组件 data（绑定通道随动迁移 active/aria-selected/tabindex）+ 双派发——\r
    input（x-model 回写，监听在宿主自身非冒泡）+ change（冒泡 detail = { value }，\r
    外层 @change="v = $event.detail.value" 一行回写）。el.value 劫持桥恒在场\r
    （x-model / 程序读写皆经此）。初值落定序：x-model expando > props value >\r
    首个可用项（tablist 恒有一项激活的语义缺省）。\r
\r
    键盘（tablist 语义，WAI-ARIA tabs 模式）：左右移焦 + 自动激活（环形）、Home/End\r
    首末直达；焦点漫游 tabindex（激活项 0 / 其余 -1）经绑定通道随动；禁用项被跳过。\r
\r
    router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router。\r
\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——形态绑定（:data-variant）落在编译子树内层 body 上，bar/content 按\r
    body 的 data-variant 命中形态样式块。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——字号档位经主题通道全跟随；tabs 不在 data() 声明主题六键，\r
     内部变体属性（variant）亦禁用六个通道名 -->\r
<div\r
  class="asc-tabs"\r
  x-define="autospark.tabs"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: "",       // 受控激活 key（el.value 桥 + change detail={value}；缺省激活首个可用项）\r
            items: [],       // 页签项 { key, label, icon?, disabled? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底\r
            variant: "line", // 形态：line 下划线（缺省）| card 卡片 | segmented 分段控制器（button-group 选中模式视觉近亲）\r
        }),\r
        methods: {\r
            // 页签激活（点击/键盘共用通道）：禁用跳过、同值短路；写组件 data（绑定通道\r
            // 随动迁移 active/aria-selected/tabindex）+ 双派发（input→x-model 回写非冒泡；\r
            // change→外层消费 detail={value} 冒泡）\r
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
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props\r
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先\r
            const raw = this.el.getAttribute("data-items");\r
            if ((!this.data.items || !this.data.items.length) && raw) {\r
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }\r
                this.el.removeAttribute("data-items");\r
            }\r
\r
            // el.value 劫持桥（受控 value 的 DOM 通道：x-model / 程序读写皆经此）——\r
            // 劫持前快照 expando（x-model 编译期可能已写初值）\r
            const prior = this.el.value;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(this.data.value ?? ""),\r
                set: (v) => { this.data.value = String(v ?? ""); },\r
                configurable: true,\r
            });\r
\r
            // 一跳首对齐（mounted 时 props 注入可能未落定，家族惯例）：初值落定序 =\r
            // x-model expando > props value > 首个可用项（tablist 恒有一项激活）\r
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
            // 键盘导航（tablist 语义）：左右移焦环形 + 自动激活、Home/End 首末直达；\r
            // 禁用项滤除（原生 disabled 不可聚焦，键盘序列跳过）；焦点漫游 tabindex 由\r
            // 绑定通道随动（激活项 0 / 其余 -1），此处只管移焦与激活复用点击通道\r
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
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012） */\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-tabs-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, 1.5);\r
    }\r
\r
    /* ---------- bar：页签头容器（role=tablist，x-for 容器宿主——子按钮逐项克隆） ---------- */\r
    .asc-tabs-bar {\r
      display: flex;\r
      align-items: stretch;\r
      max-width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-tabs-tab {\r
      /* 语义色中转（形态块按需消费） */\r
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
    /* 图标位：随字号（x-icon 默认 1em） */\r
\r
    /* ---------- line 形态（缺省）：底线 + 激活下划线 ---------- */\r
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
      font-weight: var(--x-font-weight-large, 600); /* 语义层无强调字重变量，直取基础标尺 */\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active]::after {\r
      transform: scaleX(1);\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--asc-tone);\r
    }\r
\r
    /* ---------- card 形态：卡片页签 + 内容区连线（激活卡盖底线 + z 抬层） ---------- */\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-bar {\r
      border-bottom: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab {\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid transparent;\r
      border-bottom: none;\r
      border-radius: 0.375em 0.375em 0 0;\r
      /* 压叠 bar 底线（激活卡以面板实底盖线，形成与内容区的视觉连线） */\r
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
      z-index: 1; /* 盖住 bar 底线（与内容区上缘连线的关键） */\r
    }\r
\r
    /* ---------- segmented 形态（分段控制器，button-group 选中模式视觉近亲）： ---------- */\r
    /* ---------- 浅底容器 + 激活 tone 实底反白（语义色底白字为恒定设计，非变量映射） ---------- */\r
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
    /* ---------- content：默认插槽面板区（:empty 隐藏——纯页签头用法无空盒占位） ---------- */\r
    .asc-tabs-content {\r
      padding: 0.75em 0.125em;\r
    }\r
    .asc-tabs-content:empty {\r
      display: none;\r
    }\r
    /* card 形态内容区：三边线 + 上缘与 bar 底线压叠（连线闭环） */\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-content {\r
      padding: var(--asc-tabs-content-pad, 0.8em 1em);\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
      border-top: none;\r
      border-radius: 0 0 0.375em 0.375em;\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #ffffff));\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；激活态/aria/tabindex 全为克隆体内\r
         绑定（指令值通道响应，props 晚注入/内部写值随动）；key 归一 String 比较（数字\r
         key 语域兼容） -->\r
  <div class="asc-tabs-body" :data-variant="variant">\r
    <!-- x-for 容器宿主形态（engine 惯用语义）：bar 为容器（不克隆），其子 button 才是\r
             逐项克隆模板（:key 在容器上）；克隆体内条件显隐用 x-show（共享快照多实例 +\r
             items 晚注入下 x-if 延迟编译挂错 scope 链，P0 规避清单第 4 条）——icon 空值\r
             x-icon 渲染默认图标（x-show 隐藏不可见） -->\r
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
    <!-- 默认插槽面板区：未提供内容时无空盒占位（:empty 隐藏；出口须紧凑书写）。\r
             面板切换由消费者以 x-show / x-if(.keepalive) 承载（组件文档配方） -->\r
    <div class="asc-tabs-content" x-slot></div>\r
  </div>\r
</div>\r
`,Qo=`autospark.tabs`;function $o(e){e.components[Qo]=Zo,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-tabs`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-tab`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);return n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${Qo}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}es();function es(){y(e=>{m(e),$o(e)})}var ts=`<!--
    autospark.menu 导航菜单（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
    items（{ key, label, icon?, disabled?, children?[]（一层子菜单嵌套）}[]，状态引用
    注入）驱动菜单树，<x-menu-item> 子元素声明（含一层嵌套 children）经 data-items
    通道兜底（字面量数组 props 死环规避，P0 固化规避清单第 1 条）。

    值通道（受控单选，tabs 同构）：value props 单向驱动视觉 + 点击叶子项写组件 data
    （绑定通道随动迁移 data-active）+ 双派发——input（x-model 回写，非冒泡）+ change
    （冒泡 detail = { value }）。el.value 劫持桥恒在场。初值落定序：x-model expando >
    props value > 空（菜单缺省无激活项——与 tablist 恒有一项激活不同）。

    子菜单展开：openKeys 组件内部维护（{ [父项 key]: true }，整体替换驱动——原地变异
    不发信号，规避清单第 2 条），点击父项切换；激活值落定（初值/受控变化）时祖先链
    自动展开（antd 同款体验）。vertical 形态经 grid-rows 动画收张；horizontal 形态
    子菜单为 hover 浮层下拉（CSS 悬停驱动，openKeys 点击切换对横向无效）；collapsed
    （vertical 专属）收起为图标条，子菜单右飞浮层。

    取舍（v1 按简）：inline 内联形态不做（vertical + 展开常驻即近似形态）；children
    嵌套仅一层（模板静态结构，深层 grandchildren 不渲染）；键盘漫游不做（叶子项为真
    button，原生 Tab 序聚焦可用）。

    router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router——配方见组件文档。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——形态绑定（:data-mode / :data-collapsed）落在编译子树内层 body 上，
    各形态按 body 的数据属性命中样式块。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随；menu 不在 data() 声明主题六键，
     内部变体属性（mode / collapsed）亦禁用六个通道名 -->
<div
  class="asc-menu"
  x-define="autospark.menu"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: "",      // 受控激活 key（el.value 桥 + change detail={value}；缺省无激活项）
            items: [],      // 菜单项 { key, label, icon?, disabled?, children?[] }[]——状态引用注入；声明形态经 data-items 通道兜底
            mode: "vertical",   // 形态：vertical 垂直（缺省）| horizontal 横向（子菜单 hover 浮层）
            collapsed: false,   // 垂直收起为图标条（vertical 专属；子菜单右飞浮层）
            openKeys: {},   // 子菜单展开态 { [父项 key]: true }——内部维护（整体替换驱动）；也可经状态引用注入初始展开
        }),
        methods: {
            // 菜单项点击（叶子与父项共用通道）：禁用跳过；父项（有 children）切换展开，
            // 叶子项激活 + 双派发（input→x-model 回写非冒泡；change→外层消费 detail={value} 冒泡）
            onItemClick(item) {
                if (!item || item.disabled) return;
                const kids = Array.isArray(item.children) ? item.children : [];
                if (kids.length) {
                    this.toggleSub(item);
                    return;
                }
                const k = String(item.key ?? "");
                if (k === "" || k === String(this.data.value ?? "")) return;
                this.data.value = k;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: k } }));
            },
            // 子菜单展开切换：openKeys 整体替换（原地变异不发信号，规避清单第 2 条）
            toggleSub(item) {
                const k = String(item.key ?? "");
                if (k === "") return;
                const open = { ...this.data.openKeys };
                if (open[k]) delete open[k];
                else open[k] = true;
                this.data.openKeys = open;
            },
            // 激活值祖先链自动展开：定位目标项的父项链并逐一置开（同值幂等——链上已全开
            // 则不写，防 watcher 同值重跑抖动，规避清单第 9 条）
            expandTo(key) {
                const target = String(key ?? "");
                if (target === "") return;
                const chain = [];
                const walk = (list, parents) => {
                    for (const it of list) {
                        if (!it) continue;
                        const kids = Array.isArray(it.children) ? it.children : [];
                        if (!kids.length && String(it.key ?? "") === target) {
                            chain.push(...parents);
                            return true;
                        }
                        if (kids.length && walk(kids, parents.concat(String(it.key ?? "")))) {
                            return true;
                        }
                    }
                    return false;
                };
                if (!walk(this.data.items || [], [])) return;
                const open = { ...this.data.openKeys };
                let dirty = false;
                for (const k of chain) {
                    if (!open[k]) {
                        open[k] = true;
                        dirty = true;
                    }
                }
                if (dirty) this.data.openKeys = open;
            },
        },
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // el.value 劫持桥（受控 value 的 DOM 通道：x-model / 程序读写皆经此）——
            // 劫持前快照 expando（x-model 编译期可能已写初值）；写值同时祖先链跟随展开
            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => String(this.data.value ?? ""),
                set: (v) => {
                    this.data.value = String(v ?? "");
                    this.expandTo(v);
                },
                configurable: true,
            });

            // 一跳首对齐（mounted 时 props 注入可能未落定，家族惯例）：初值落定序 =
            // x-model expando > props value（menu 缺省无激活项）；落定后祖先链自动展开
            setTimeout(() => {
                if (!this.data.value && typeof prior === "string" && prior !== "") {
                    this.data.value = prior;
                }
                if (this.data.value) this.expandTo(this.data.value);
            }, 0);

            // 受控 value 变化：祖先链跟随展开（props 驱动不广播 change，防回环）
            this.watch("value", ({ value }) => { this.expandTo(value); });
        },
    }
  <\/script>
  <style global id="autospark-components-menu">
    .asc-menu {
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012） */
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-menu-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-menu-body {
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #009aff));
    }
    .asc-menu-list,
    .asc-menu-sub {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    /* 菜单项载体（叶子与父项同构）：父项经 :data-sub 标记（展开箭头/浮层定位消费） */
    .asc-menu-item {
      position: relative;
    }
    .asc-menu-link {
      appearance: none;
      border: none;
      background: transparent;
      font: inherit;
      line-height: inherit;
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      padding: 0.5em 0.75em;
      margin: 0;
      border-radius: var(--auto-border-radius, var(--asc-menu-radius, 0.375em));
      color: var(--auto-color, var(--asc-menu-color, #606060));
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .asc-menu-link:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    .asc-menu-link:disabled {
      color: var(--auto-disable-color, var(--asc-menu-disable-color, rgba(0, 0, 0, 0.25)));
      cursor: not-allowed;
    }
    .asc-menu-link:not(:disabled):hover {
      color: var(--asc-tone);
      background: var(--auto-hover-bgcolor, var(--asc-menu-hover-bg, rgba(0, 0, 0, 0.04)));
    }
    /* 激活项：主色文字 + 主色浅底（10% tint 为恒定视觉设计，非变量映射） */
    .asc-menu-link[data-active] {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-large, 600); /* 语义层无强调字重变量，直取基础标尺 */
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    .asc-menu-icon {
      display: inline-flex;
      flex: none;
    }
    .asc-menu-label {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
    }
    /* 展开箭头：内置 arrow 图标指右，垂直/横向形态统一闭态朝下（rotate 90°）、开态朝上 */
    .asc-menu-arrow {
      display: inline-flex;
      flex: none;
      color: var(--auto-third-color, var(--asc-menu-arrow-color, rgba(0, 0, 0, 0.35)));
      transform: rotate(90deg);
      transition: transform 0.2s ease;
    }

    /* ---------- vertical 形态（缺省）：子菜单点击展开（grid-rows 动画收张） ---------- */
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
    }
    /* 子项缩进：图标位 + 一档留白 */
    .asc-menu-subitem .asc-menu-link {
      padding-inline-start: 2.25em;
    }
    /* 开态箭头朝上（subwrap 与 link 为兄弟，经 :has() 反查） */
    .asc-menu-item:has(> .asc-menu-subwrap[data-open]) > .asc-menu-link .asc-menu-arrow {
      transform: rotate(-90deg);
    }

    /* ---------- 浮层形态公共面板体：horizontal 下拉 / collapsed 右飞（位置各定，面板样式共享） ---------- */
    .asc-menu-body[data-mode="horizontal"] .asc-menu-item[data-sub] > .asc-menu-subwrap,
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-item[data-sub] > .asc-menu-subwrap {
      position: absolute;
      z-index: 10;
      display: block;
      grid-template-rows: none;
      min-width: max(100%, 10em);
      padding: 0.25em;
      border: var(--auto-border-size, var(--asc-menu-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-menu-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-menu-radius, 0.375em));
      background: var(--auto-bgcolor, var(--asc-menu-panel-bg, #ffffff));
      box-shadow: var(--auto-shadow, var(--asc-menu-shadow, 0 6px 16px rgba(0, 0, 0, 0.08)));
      visibility: hidden;
      opacity: 0;
      transition: opacity 0.15s ease, visibility 0.15s ease;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-item[data-sub] > .asc-menu-subwrap {
      top: 100%;
      left: 0;
      margin-top: 0.25em;
    }
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-item[data-sub] > .asc-menu-subwrap {
      left: 100%;
      top: 0;
      margin-left: 0.25em;
    }
    /* 悬停/子树聚焦展开（键盘 Tab 进子项时 focus-within 维持可见） */
    .asc-menu-body[data-mode="horizontal"] .asc-menu-item[data-sub]:hover > .asc-menu-subwrap,
    .asc-menu-body[data-mode="horizontal"] .asc-menu-item[data-sub]:focus-within > .asc-menu-subwrap,
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-item[data-sub]:hover > .asc-menu-subwrap,
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-item[data-sub]:focus-within > .asc-menu-subwrap {
      visibility: visible;
      opacity: 1;
    }
    /* 浮层内箭头朝右（层级指引，不旋转） */
    .asc-menu-body[data-mode="horizontal"] .asc-menu-item[data-sub] > .asc-menu-link .asc-menu-arrow,
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-item[data-sub] > .asc-menu-link .asc-menu-arrow {
      transform: rotate(0deg);
    }

    /* ---------- horizontal 形态：横向排布（子菜单 hover 浮层，箭头朝下） ---------- */
    .asc-menu-body[data-mode="horizontal"] .asc-menu-list {
      display: flex;
      align-items: stretch;
      max-width: 100%;
      min-width: 0;
      row-gap: 0.125em;
      flex-wrap: wrap;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-link {
      width: auto;
    }
    .asc-menu-body[data-mode="horizontal"] .asc-menu-item + .asc-menu-item {
      margin-left: 0.125em;
    }

    /* ---------- collapsed 形态（vertical 专属）：图标条——顶层文字/箭头隐藏 ---------- */
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-list {
      width: 3.25em;
    }
    .asc-menu-body[data-mode="vertical"][data-collapsed] > .asc-menu-list > .asc-menu-item > .asc-menu-link {
      justify-content: center;
      padding-inline: 0;
    }
    .asc-menu-body[data-mode="vertical"][data-collapsed] > .asc-menu-list > .asc-menu-item > .asc-menu-link > .asc-menu-label,
    .asc-menu-body[data-mode="vertical"][data-collapsed] > .asc-menu-list > .asc-menu-item > .asc-menu-link > .asc-menu-arrow {
      display: none;
    }
    /* 右飞浮层内子项恢复常规缩进与文字 */
    .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-subitem .asc-menu-link {
      padding-inline-start: 0.75em;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-menu-link,
    [data-dark] .asc-menu-link {
      color: var(--auto-color, var(--asc-menu-color, rgba(255, 255, 255, 0.75)));
    }
    [dark] .asc-menu-body,
    [data-dark] .asc-menu-body {
      --asc-tone: var(--auto-primary-color, var(--asc-menu-primary, #56baff));
    }
    [dark] .asc-menu-link:disabled,
    [data-dark] .asc-menu-link:disabled {
      color: var(--auto-disable-color, var(--asc-menu-disable-color, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-menu-link:not(:disabled):hover,
    [data-dark] .asc-menu-link:not(:disabled):hover {
      background: var(--auto-hover-bgcolor, var(--asc-menu-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-menu-arrow,
    [data-dark] .asc-menu-arrow {
      color: var(--auto-third-color, var(--asc-menu-arrow-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-menu-body[data-mode="horizontal"] .asc-menu-item[data-sub] > .asc-menu-subwrap,
    [dark] .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-item[data-sub] > .asc-menu-subwrap,
    [data-dark] .asc-menu-body[data-mode="horizontal"] .asc-menu-item[data-sub] > .asc-menu-subwrap,
    [data-dark] .asc-menu-body[data-mode="vertical"][data-collapsed] .asc-menu-item[data-sub] > .asc-menu-subwrap {
      border-color: var(--auto-border-color, var(--asc-menu-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-menu-panel-bg, #3a3a3a));
      box-shadow: var(--auto-shadow, var(--asc-menu-shadow, 0 6px 16px rgba(0, 0, 0, 0.4)));
    }
  </style>
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；激活态/aria/禁用全为克隆体内绑定
         （指令值通道响应，props 晚注入/内部写值随动）；key 归一 String 比较（数字
         key 语域兼容）；克隆体内条件显隐一律 x-show（共享快照多实例 + items 晚注入
         下 x-if 延迟编译挂错 scope 链，P0 规避清单第 4 条）——icon 空值 x-icon 渲染
         默认图标（x-show 隐藏不可见） -->
  <div class="asc-menu-body" :data-mode="mode" :data-collapsed="collapsed ? '' : null">
    <!-- x-for 容器宿主形态（engine 惯用语义）：list 为容器（不克隆），其子 li 才是
             逐项克隆模板（:key 在容器上）；嵌套 x-for（子菜单）为 engine 既有支持路径 -->
    <ul class="asc-menu-list" role="menu" x-for="item of items" :key="item.key">
      <li class="asc-menu-item" :data-sub="item.children && item.children.length ? '' : null">
        <button
          type="button"
          class="asc-menu-link"
          role="menuitem"
          :data-active="String(item.key) === String(value) ? '' : null"
          :aria-expanded="item.children && item.children.length ? (openKeys[item.key] ? 'true' : 'false') : null"
          :disabled="item.disabled"
          @click="onItemClick(item)"
        >
          <i class="asc-menu-icon" x-show="item.icon" x-icon="item.icon"></i>
          <span class="asc-menu-label">{{ item.label }}</span>
          <i class="asc-menu-arrow" x-show="item.children && item.children.length" x-icon="'arrow'"></i>
        </button>
        <!-- 子菜单出口：x-show 判有 children（克隆体内禁 x-if）；:data-open 随
                 openKeys 命中（vertical 收张动画 / 箭头朝向消费）；horizontal/collapsed
                 形态下被浮层面板样式覆写（hover 驱动，忽略 openKeys） -->
        <div class="asc-menu-subwrap" x-show="item.children && item.children.length" :data-open="openKeys[item.key] ? '' : null">
          <ul class="asc-menu-sub" role="menu" x-for="child of item.children" :key="child.key">
            <li class="asc-menu-subitem">
              <button
                type="button"
                class="asc-menu-link"
                role="menuitem"
                :data-active="String(child.key) === String(value) ? '' : null"
                :disabled="child.disabled"
                @click="onItemClick(child)"
              >
                <i class="asc-menu-icon" x-show="child.icon" x-icon="child.icon"></i>
                <span class="asc-menu-label">{{ child.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</div>
`,ns=`autospark.menu`;function rs(e){let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0);let r=Array.from(e.children).filter(e=>e.tagName.toLowerCase()===`x-menu-item`);return r.length&&(t.children=r.map(rs)),t}function is(e){e.components[ns]=ts,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-menu`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-menu-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(rs);else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``?a.push(`${Q(Z(n.name))}: true`):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${ns}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}as();function as(){y(e=>{m(e),is(e)})}var os=`<!--
    autospark.steps 步骤条（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
    items（{ title, description?, icon? }[]，状态引用注入）或 <x-step> 子元素声明
    （data-items 通道，字面量数组 props 死环规避，P0 固化规避清单第 1 条）双形态。

    状态机（每步 data-state，克隆体内联表达式驱动——绑定表达式不含组件方法，
    全部内联）：序号 < current → finish（打勾）；=== current → status 取值
    （process 缺省 / finish 打勾 / error 叉号 danger 色）；> current → wait。
    连接线（.asc-step-line）随所属步 finish 染主色（进度染色）。

    值通道（受控，tabs 同构）：current props 单向驱动 + clickable 开启时点击步
    切换写组件 data + 双派发——input（x-model 回写，非冒泡）+ change（冒泡
    detail = { current }）。el.value 劫持桥恒在场（number 语域，负值/NaN 归 0）。

    direction：horizontal 缺省（横排 + 步后横线）/ vertical（纵排 + 步下竖线）。

    取舍（v1 按简）：键盘漫游不做（步为 li 载体 + clickable 时 cursor 指引）；
    current 越界不钳制上界（> 末序 → 全部 finish，视觉合法）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——形态绑定（:data-direction / :data-status / :data-clickable）
    落在编译子树内层 body 上。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随；steps 不在 data() 声明主题六键，
     内部变体属性（direction）亦禁用六个通道名 -->
<div
  class="asc-steps"
  x-define="autospark.steps"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            current: 0,        // 当前步序号（0 起，受控缺省 0；el.value 桥 number 语域）
            items: [],         // 步骤项 { title, description?, icon? }[]——状态引用注入；声明形态经 data-items 通道兜底
            status: "process", // 当前步状态：process 进行中（缺省）| finish 已完成（当前步打勾）| error 异常（danger 色）
            direction: "horizontal", // 排向：horizontal 横排（缺省）| vertical 纵排
            clickable: false,  // 可点切换：开启后点击步切换 current + change 冒泡 detail={current}
        }),
        methods: {
            // 步点击（clickable 开启时）：同值短路；写组件 data + 双派发
            // （input→x-model 回写非冒泡；change→外层消费 detail={current} 冒泡）
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
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // current 归一（number 语域：负值/NaN/字符串数字收敛为非负整数）
            const normalize = (v) => {
                const n = Math.round(Number(v));
                return Number.isFinite(n) && n > 0 ? n : 0;
            };
            this.data.current = normalize(this.data.current);

            // el.value 劫持桥（受控 current 的 DOM 通道：x-model / 程序读写皆经此，
            // number 语域）；劫持前快照 expando（x-model 编译期可能已写初值）
            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => normalize(this.data.current),
                set: (v) => { this.data.current = normalize(v); },
                configurable: true,
            });

            // 一跳首对齐（mounted 时 props 注入可能未落定，家族惯例）：初值落定序 =
            // x-model expando > props current（缺省 0）；受控变化持续归一（同值幂等，
            // 字符串数字注入收敛，规避清单第 9 条）
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
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012） */
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

    /* ---------- 节点圆：状态四态（process 实底反白 / finish 描边主色打勾 / error 实底 danger 叉 / wait 描边灰） ---------- */
    .asc-step {
      /* 横排缺省布局：等宽步（flex 1），节点圆 + 信息块 + 步后横线（线填满剩余宽到下一点） */
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
      font-weight: var(--x-font-weight-large, 600); /* 语义层无强调字重变量，直取基础标尺 */
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    /* 进行中：主色实底反白（语义色底白字为恒定设计，非变量映射） */
    .asc-step[data-state="process"] .asc-step-dot {
      border-color: var(--asc-tone);
      background: var(--asc-tone);
      color: var(--asc-steps-dot-ink, #ffffff);
    }
    /* 已完成：主色描边 + 主色对勾 */
    .asc-step[data-state="finish"] .asc-step-dot {
      border-color: var(--asc-tone);
      color: var(--asc-tone);
    }
    /* 异常：danger 实底反白叉号 */
    .asc-step[data-state="error"] .asc-step-dot {
      border-color: var(--asc-danger);
      background: var(--asc-danger);
      color: var(--asc-steps-dot-ink, #ffffff);
    }
    /* 图标位尺寸随节点圆（x-show 承载状态显隐——display 基线由 x-show 内联接管） */
    .asc-step-check,
    .asc-step-error,
    .asc-step-custom {
      font-size: 0.9em;
    }

    /* ---------- 信息块 ---------- */
    .asc-step-info {
      flex: 0 1 auto;
      min-width: 0;
    }
    .asc-step-title {
      font-weight: var(--x-font-weight-large, 600); /* 语义层无强调字重变量，直取基础标尺 */
      color: var(--auto-color, var(--asc-steps-title-color, #303133));
      transition: color 0.2s ease;
    }
    /* 未达步标题弱化；当前步主色；异常步 danger */
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

    /* ---------- 连接线：随所属步 finish 染主色（进度染色）；末步无线 ---------- */
    .asc-step-line {
      flex: 1 1 1em;
      align-self: flex-start;
      margin-top: calc((1.75em - 1px) / 2); /* 对齐节点圆心高度 */
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

    /* ---------- vertical 排向：纵排 + 步下竖线（绝对定位于节点圆正下方延至下一步） ---------- */
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
      bottom: -0.625em; /* 跨步间距延至下一步节点圆上缘 */
      width: 1px;
      height: auto;
      margin: 0;
      flex: none;
      align-self: auto; /* 解除基础规则的 flex-start（abspos 子项对齐参与高度解析，flex-start 退化为内容高 0） */
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 形态/状态绑定落本层与克隆体（根上动态绑定不求值，T4=B）；状态机全内联表达式
         （绑定表达式不含组件 methods）；克隆体内条件显隐一律 x-show（P0 规避清单第 4 条）；
         图标三态互斥：finish 打勾（yes）/ error 叉号（no）/ 自定义 icon / 序号缺省 -->
  <div class="asc-steps-body" :data-direction="direction" :data-clickable="clickable ? '' : null">
    <!-- x-for 容器宿主形态：ol 为容器（不克隆），其子 li 才是逐项克隆模板（:key 在容器上） -->
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
`,ss=`autospark.steps`;function cs(e){e.components[ss]=os,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-steps`))){let e=document.createElement(`div`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-step`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={title:e.getAttribute(`title`)??``},n=e.getAttribute(`description`);n!=null&&(t.description=n);let r=e.getAttribute(`icon`);return r!=null&&(t.icon=r),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``?a.push(`${Q(Z(n.name))}: true`):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${ss}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}ls();function ls(){y(e=>{m(e),cs(e)})}var us=`<!--
    autospark.page-header 页头（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
    title / subtitle 标题对 + back 返回钮 + extra（右侧动作区）/ 默认（内容区）双插槽。
    纯结构件。

    back 三态：false（缺省）不渲染 / true 图标钮（无文案）/ 文案字符串 = 图标 + 文案。
    点击派发 back 冒泡事件（detail 空）——组件不执行 history.back / router.back
    （router 隔离，ADR-0018 决策 6 约定 2，接管动作由消费者 @back 决定）。无 i18n
    文案：返回钮缺省图标无字，aria-label 以 back 文案或标题自描述（零内置文案的
    可访问性标注通道，rate 同款惯例）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——back 显隐/文案绑定全落在编译子树内层元素上。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随；page-header 不在 data() 声明主题六键 -->
<div
  class="asc-page-header"
  x-define="autospark.page-header"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            title: "",    // 页面标题
            subtitle: "", // 副标题（空不渲染）
            back: false,  // 返回钮：false 缺省不渲染 | true 图标钮（无文案）| 文案字符串 = 图标 + 文案
        }),
        methods: {
            // 返回钮点击：派发 back 冒泡事件（detail 空）——接管动作（history.back /
            // router.back / 自定义）由消费者 @back 决定，组件零副作用
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
    /* ---------- 头行：返回钮 + 标题对 + extra（右缘动作区） ---------- */
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
    /* 返回箭头：内置 arrow 图标指右，旋转 180° 指左 */
    .asc-page-header-back-icon {
      display: inline-flex;
      transform: rotate(180deg);
    }
    .asc-page-header-back-text {
      color: var(--auto-secondary-color, var(--asc-page-header-back-color, rgba(0, 0, 0, 0.55)));
    }
    /* 标题对：标题随档位相对放大，副标题次要色小字（空不占位） */
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
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */
      line-height: 1.3;
      color: var(--auto-color, var(--asc-page-header-title-color, #303133));
    }
    .asc-page-header-subtitle {
      min-width: 0;
      color: var(--auto-secondary-color, var(--asc-page-header-subtitle, rgba(0, 0, 0, 0.55)));
    }
    /* extra：右侧动作区（推至右缘；空不占位） */
    .asc-page-header-extra {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      margin-left: auto;
    }
    .asc-page-header-extra:empty {
      display: none;
    }
    /* ---------- 内容区：默认插槽（空不占位） ---------- */
    .asc-page-header-content {
      padding-top: 0.75em;
    }
    .asc-page-header-content:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- back 显隐/文案绑定落内层（根上动态绑定不求值，T4=B）；无 back 时钮不渲染
         （x-show 隐藏不可见不占位）；aria-label 以 back 文案或标题自描述（零内置文案） -->
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
  <!-- 内容区：默认插槽出口（出口须紧凑书写——:empty 判定） -->
  <div class="asc-page-header-content" x-slot></div>
</div>
`,ds=`autospark.page-header`;function fs(e){e.components[ds]=us}ps();function ps(){y(e=>{m(e),fs(e)})}var ms=`<!--
    autospark.pagination 分页器（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
    受控 page（el.value 桥 + change detail={page,pageSize} + input 回写 x-model）+
    pageSize / total / pageSizes（条数切换 select）/ simple（极简形态）。

    页码窗口（watch 维护幂等：序列化签名比对、同值不写——i18n refresh 等同值重跑不污染）：
    总页数 <= 7 全量直出；> 7 时 1 + [省略号] + 当前页±2 五宽窗口 + [省略号] + 末页。
    上/下一页与首/末页按钮：单/双箭头形态（内置 arrow 图标旋转 180° 得左向），边界禁用。

    内置文案走 i18n 词典（ADR-0018 决策 6 约定 1）：pagination.first / prev / next /
    last / total（"共 {n} 条"插值）/ pageSize（"{n} 条/页"插值）——t 经表达式求值器注入，
    键等值判定（未装 i18n / 词典无键时 t(键)===键）回退硬编码中文。

    与 x-for.paging 的边界（ADR-0018 复用素材列）：.paging 是数据层切片机制（loader /
    :data-paging 双向 / 项内 $page），本组件是页码 UI 控件——组合配方：x-for.paging 容器
    :data-paging="paging" 绑状态对象，本组件 @change="paging.page = $event.detail.page"
    一行打通（组件文档配方节）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——形态绑定（:data-simple）落在编译子树的内层 body 上。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道 data-size 全跟随（分页器高度/间距随字号缩放），
     pagination 不设自有字号属性（button 同范式 ADR-0012）；data() 不得声明主题六键，
     组件内部变体属性亦禁用六个通道名 -->
<div
  class="asc-pagination"
  x-define="autospark.pagination"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            page: 1,       // 受控当前页（1-based；越界自动钳位到 [1,pageCount]；el.value 桥 + change detail={page,pageSize}）
            pageSize: 10,  // 每页条数（pageSizes 切换时内部写 1 重置页码）
            total: 0,      // 总条数（0 条时单页空态：仅页码 1、翻页全禁用）
            pageSizes: [], // 每页条数切换数组（状态引用注入——字面量数组死环规避；元素名形态经 data-page-sizes JSON 通道）
            simple: false, // 极简形态：‹ 3 / 20 ›（隐藏总数/条数切换/页码窗口/首末钮）
            pages: [],     // 页码窗口项 { type:'page'|'more', page, key }[]——watch 维护（重算见 computePages）
            // computed 简写（普通函数值即计算属性，仅限单表达式）：总页数（total/pageSize
            // 向上取整，至少 1——total=0 的单页空态；除零/NaN 归 1）
            pageCount: (s) => Math.max(1, Math.ceil((Number(s.total) || 0) / (Number(s.pageSize) || 10)) || 1),
        }),
        methods: {
            // 静默归位：钳位 [1,pageCount] 写 page，返回是否变化（el.value 桥 / props 对齐共用）
            applyPage(n) {
                const pc = Number(this.data.pageCount) || 1;
                const target = Math.min(Math.max(1, Number(n) || 1), pc);
                if (target === Number(this.data.page)) return false;
                this.data.page = target;
                return true;
            },
            // 翻页（页码/首/末/上下页按钮共用通道）：静默归位成功才双派发——
            // input（非冒泡，x-model 回写）+ change（冒泡，detail={page,pageSize}，外层一行回写）
            onGo(n) {
                if (!this.applyPage(n)) return;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: Number(this.data.page), pageSize: Number(this.data.pageSize) } }));
            },
            // 条数切换（原生 select）：截断原生 change 冒泡（detail undefined——外层消费方
            // @change 按 detail={page,pageSize} 解构会炸，alert 关闭钮同款纪律）→ 同值短路 →
            // 写 pageSize + 页码归 1 → 组件语义 change 自派发（detail 携新对）
            onSizeChange(event) {
                event.stopPropagation();
                const size = Number(event.target.value);
                if (!size || size === Number(this.data.pageSize)) return;
                this.data.pageSize = size;
                this.data.page = 1;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: 1, pageSize: size } }));
            },
            // 页码窗口重算（幂等：JSON 签名比对同值不写——watch 同值重跑 / i18n refresh 不污染）
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
            // 元素名形态兜底（precompile 改道落盘的 data-page-sizes JSON 字符串）：
            // pageSizes props 缺席时解析写组件 data（x-for 值通道响应）；props 在场恒优先
            const rawSizes = this.el.getAttribute("data-page-sizes");
            if ((!this.data.pageSizes || !this.data.pageSizes.length) && rawSizes) {
                try {
                    const arr = JSON.parse(rawSizes);
                    if (Array.isArray(arr)) this.data.pageSizes = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省无条数切换） */ }
                this.el.removeAttribute("data-page-sizes");
            }

            // el.value 劫持桥（受控 page 的 DOM 通道：x-model / 程序读写皆经此）——
            // 劫持前快照 expando（x-model 编译期可能已写初值）；静默归位不广播（受控语义）
            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => Number(this.data.page) || 1,
                set: (v) => { this.applyPage(v); },
                configurable: true,
            });

            // 页码窗口初始重算 + 源订阅（page 翻页 / pageCount 随 total·pageSize 变化 →
            // 窗口重排 + page 钳位归位）
            this.computePages();
            this.watch("page", () => this.computePages());
            this.watch("pageCount", () => { this.applyPage(this.data.page); this.computePages(); });

            // 一跳首对齐（mounted 时 x-model expando 可能未落定，家族惯例）：
            // 初值落定序 = x-model expando > props page > 1；applyPage 兼任越界钳位
            // （page > pageCount 归位末页——props 注入越界值的一跳收敛）
            setTimeout(() => {
                this.applyPage(typeof prior === "number" && prior > 0 ? prior : this.data.page);
                this.computePages();
            }, 0);
        },
    }
  <\/script>
  <style global id="autospark-components-pagination">
    /* 宿主：透明块壳（字号基线随 data-size 档位全跟随，button 同范式 ADR-0012） */
    .asc-pagination {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-pagination-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- body：横向布局载体（编译子树内层，绑定可求值） ---------- */
    .asc-pagination-body {
      --asc-tone: var(--auto-primary-color, var(--asc-pagination-primary, #009aff));
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 0.5em;
      color: var(--auto-color, var(--asc-pagination-color, #606060));
    }
    /* 极简形态：紧凑居左（‹ 3 / 20 › 单行，无总数与条数切换） */
    .asc-pagination-body[data-simple="true"] {
      justify-content: flex-start;
      gap: 0.375em;
    }

    /* ---------- 总条数（i18n 兜底文案同通道）：次要文字色 ---------- */
    .asc-pagination-total {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      white-space: nowrap;
    }

    /* ---------- 条数切换（原生 select 原生增强：轻盒饰随主题） ---------- */
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

    /* ---------- 页码区：按钮组 ---------- */
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
      gap: 0.0625em; /* 双箭头首末钮的两枚图标间距 */
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
    /* 激活页：语义色实底反白（语义色底白字为恒定设计，非变量映射） */
    .asc-pagination-btn[data-active] {
      color: var(--asc-pagination-active-ink, #ffffff);
      background: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
    /* 箭头图标：内置 arrow（右向单箭头），左向经旋转 180° */
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
    /* 极简形态文本：3 / 20（次要色） */
    .asc-pagination-simple-text {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      padding: 0 0.25em;
      white-space: nowrap;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 形态绑定落本层（T4=B：根上动态绑定不求值）；翻页边界 disabled 随 page/pageCount 联动 -->
  <div class="asc-pagination-body" :data-simple="simple">
    <!-- 总条数（i18n：pagination.total "{n}" 插值，键等值判定回退硬编码中文） -->
    <span class="asc-pagination-total" x-show="!simple">
      {{ t('pagination.total', { n: total }) === 'pagination.total' ? ('共 ' + total + ' 条') : t('pagination.total', { n: total }) }}
    </span>
    <!-- 条数切换：原生 select（x-for 容器宿主形态，option 逐项克隆；:selected 桥接当前值） -->
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
    <!-- 页码窗口：首/上/窗口/下/末（首末为双箭头） -->
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
      <!-- 窗口项：页码钮 / 省略号两态（x-for 克隆体内禁 x-if，一律 x-show——P0 规避清单第 4 条） -->
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
    <!-- 极简形态：‹ 3 / 20 › -->
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
`,hs=`autospark.pagination`;function gs(e){e.components[hs]=ms,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-pagination`))){let e=t.getAttribute(`page-sizes`);e!=null&&e!==``&&!t.hasAttribute(`:page-sizes`)&&t.setAttribute(`data-page-sizes`,e),t.removeAttribute(`page-sizes`)}})}_s();function _s(){y(e=>{m(e),gs(e)})}var vs=`<!--
    autospark.anchor 锚点导航（组件库 P3 导航轻件，ADR-0018 清单权威表 navigation 行 /
    ADR-0029 轻件对 ADR）：items（{ key, label, href? }[]，状态引用注入——href 缺省
    key 作锚 id #key）驱动侧边文字列表；scroll + getBoundingClientRect 监听高亮当前锚
    （offset 判定线：锚顶越线即当前，全未达线不高亮——antd 缺省语义）；点击平滑滚动
    到锚（不写 hash：纯滚动语义不打断 smooth，router 隔离 ADR-0018 决策 6 约定 2）+
    change 冒泡 detail = { key }。

    监听清理（grid 的 matchMedia 先例）：scroll/resize 挂全局长命对象 window，组件
    拆卸（unmounted）须摘除——cleanup 存宿主 JS 属性（_ascAnchorCleanup）统一回收。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——affix 形态绑定落编译子树内层 body 上，宿主 fixed 定位经 :has() 驱动。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随；anchor 不在 data() 声明主题六键，
     内部变体属性（affix）亦禁用六个通道名 -->
<nav
  class="asc-anchor"
  x-define="autospark.anchor"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            current: "",  // 当前锚 key（scroll 监听高亮迁移；change 冒泡 detail={key}——清空也是变化）
            items: [],    // 锚点项 { key, label, href? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底
            offset: 0,    // 滚动判定偏移（px）：锚顶越过「offset 线」即视为当前（吸顶导航高度补偿）；点击滚动目标同线对齐
            affix: false, // 固定侧栏形态：fixed 定位右缘悬浮（T4=B：绑定落 body，宿主 :has() 驱动）
        }),
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // —— 锚目标解析：href 缺省 key 作锚 id（#key）；#id 走 getElementById，
            //    其余形态按选择器 querySelector（目标缺席的项静默跳过）——
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

            // —— 当前锚计算：items 序自上而下扫，最后一个「锚顶已越过判定线」的项即
            //    当前锚（判定线 = offset + 1px 容差；全未达线不高亮——antd 缺省语义，
            //    页顶无高亮、滚入首区亮首项）——
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

            // 高亮迁移 + change 广播（同值短路：滚动事件密集，无谓派发防御）
            const syncActive = () => {
                const k = computeCurrent();
                if (k === String(this.data.current ?? "")) return;
                this.data.current = k;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { key: k } }));
            };

            // —— scroll/resize 监听（passive；resize 兜布局变化后的位置漂移）——
            const onScroll = () => { syncActive(); };
            const onResize = () => { syncActive(); };
            window.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("resize", onResize, { passive: true });
            this.el["_ascAnchorCleanup"] = () => {
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onResize);
            };

            // props 晚注入一跳对齐（家族惯例）：items/offset 落定后再做首同步
            setTimeout(() => { syncActive(); }, 0);

            // 点击（事件委托：克隆体内链接无独立绑定，宿主单点收口）：拦原生 hash 瞬跳
            // + 平滑滚动（目标位置 = 锚顶 + 滚动偏移 - 判定线，reduced-motion 瞬时归位）
            // + 即时高亮迁移（smooth 途中 scroll 事件逐步接管校正）
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
            // 监听清理（防泄漏：scroll/resize 挂全局长命对象 window，组件拆卸须摘监听）；
            // this.el 可能已拆（可选链静默通过）
            const cleanup = this.el?.["_ascAnchorCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascAnchorCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-anchor">
    .asc-anchor {
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012） */
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-anchor-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- affix 固定侧栏形态：fixed 右缘悬浮（位置经 --asc-anchor-affix-* 覆盖通道） ---------- */
    .asc-anchor:has(> .asc-anchor-body[data-affix]) {
      position: fixed;
      top: var(--asc-anchor-affix-top, 5rem);
      right: var(--asc-anchor-affix-right, 2rem);
      z-index: var(--asc-anchor-affix-z, 100);
      width: auto;
      max-width: min(30vw, 14rem);
    }

    /* ---------- link：文字列表项（高亮与 tabs 激活同源——--asc-tone 主色中转 + 文字色链一致） ---------- */
    .asc-anchor-link {
      /* 语义色中转（激活/悬停块消费，tabs 同源） */
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
      font-weight: var(--x-font-weight-large, 600); /* 语义层无强调字重变量，直取基础标尺（tabs 同款） */
      border-left-color: var(--asc-tone);
    }
    .asc-anchor-label {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；激活态/aria-current 全为克隆体内
         绑定（指令值通道响应）；x-for 容器宿主形态（list 为容器，其子 a 才是逐项克隆
         模板，:key 在容器上）；点击走宿主事件委托（data-key 回查项数据） -->
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
`,ys=`autospark.anchor`;function bs(e){e.components[ys]=vs,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-anchor`))){let e=document.createElement(`nav`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-anchor-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(e=>{let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`href`);return n!=null&&(t.href=n),t});else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):a.push(`${Q(Z(n.name))}: ${JSON.stringify(n.value===``||$(n.value))}`);for(e.setAttribute(`x-component:${ys}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}xs();function xs(){y(e=>{m(e),bs(e)})}var Ss=`<!--
    autospark.dropdown 下拉菜单（ADR-0027）——触发器组件：动作触发型轻量菜单（与
    autospark.menu 的边界：menu = 页面导航区常驻组件——路由激活态 / 子菜单展开态 /
    自身状态域；本组件 = 按钮旁弹出的动作菜单，即点即走、select 后即复位，菜单项
    语义自持不嵌套消费 menu，ADR-0027 决策 6）。

    触发区 = 默认插槽：任意内容（button / 文本 / 图标）经插槽出口投影进触发器包裹
    span（display:contents 出口不产生布局层）；包裹 span 即 popover 宿主 + 键盘监听
    点 + tabindex=0 聚焦位（文本触发区键盘可达；button 内容时多一个停靠点，文档已
    注记）+ aria-haspopup="menu" / aria-expanded（JS 通道随开合同步）。

    菜单面板（panel.html，内部组件 autospark-dropdown-panel）复用 x-popover 指令机制：
    trigger（hover 缺省 | click）/ placement 经 x-popover-options 成员属性表达式通道
    透传（热切换；打开中的面板不重估，切换自下一次触发生效——机制语义）；面板经
    scope 链哨兵键回传（pickTick/pickKey 选中、hoverTick/hoverKey 悬停高亮），
    mounted/unmounted 沿链写 open。

    程序化开合按触发模型分派（决策 7）：click 模型派宿主 click（toggle 通道）；
    hover 模型派宿主 mouseenter / mouseleave（relatedTarget 空 → 离开共享 hover 域
    → delayHide 宽限后关闭——两模型各有原生关闭链，不绕开机制自建关闭）。

    键盘（WAI-ARIA menu 模式，select 同款高亮漫游模型——焦点恒留触发区）：上下移动
    高亮（跳过禁用项、首尾环绕、未开先开）/ Enter 开态触发当前高亮（preventDefault
    防误触发表单提交；无高亮关面板；关态原生放行）/ ESC 归 popover 打开栈（机制继承
    不拦截）/ Tab 自然移焦。select 事件 detail = { key, item }（触发即关面板 + 高亮
    复位，动作菜单无激活态持久语义）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随；dropdown 不在 data() 声明主题六键，
     内部无自有变体属性（trigger / placement 不占通道名） -->
<div
  class="asc-dropdown"
  x-define="autospark.dropdown"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],           // 菜单项 { key, label, icon?, disabled?, divided?, danger? }[]——状态引用注入；声明形态经 data-items 通道兜底
            trigger: "hover",    // 触发方式：hover 悬浮（缺省，antd 同款）| click 点击开关——透传 popover 触发模型
            placement: "bottom-start", // 定位方向（popover at.placement 12 方向透传；缺省左对齐下拉惯例）
            disabled: false,     // 禁用：触发器退出焦点序 + CSS 拦截开面板（popover 宿主监听不知禁用态）
            // —— 内部状态（JS 通道维护）——
            open: false,         // 面板开合态（面板 mounted/unmounted 沿链写回；aria-expanded / data-open 驱动）
            activeKey: null,     // 键盘/悬停高亮项 key（面板 :data-active 比较基准——值通道；开面板即复位，select 后归 null）
            pickTick: 0,         // 选中哨兵（面板菜单项点击写：自增必变免疫同值去重，ADR-0022 决策 2）
            pickKey: null,       // 选中哨兵携带 key
            hoverTick: 0,        // 悬停高亮哨兵（面板 mouseenter 写——高亮跟随指针）
            hoverKey: null,      // 悬停哨兵携带 key
        }),
        methods: {
            // 触发器包裹 span（popover 宿主 / 键盘监听点；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-dropdown-trigger");
            },
            // 当前触发模型（缺省 hover；非法值交由 popover warn 回退，此处只归一判定）
            triggerMode() {
                return String(this.data.trigger ?? "hover") === "click" ? "click" : "hover";
            },
            // 开面板（键盘路径）：按触发模型分派（ADR-0027 决策 7）——click 派宿主点击
            // （toggle 通道）；hover 派 mouseenter（含 delayShow 悬浮延迟，原生打开链）
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
            // 关面板（选中 / 禁用联动）：click 派宿主点击（toggle）；hover 派 mouseleave
            // （relatedTarget 空 → 离开共享 hover 域 → delayHide 宽限后关闭）
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
            // 高亮定位（key 值通道；未命中或禁用项不动）
            setActive(key) {
                const list = this.data.items ?? [];
                const i = list.findIndex((o) => o && String(o.key) === String(key));
                if (i >= 0 && !list[i].disabled) this.data.activeKey = list[i].key;
            },
            // 高亮移动（dir = 1 下 / -1 上）：环找下一个非禁用项（首尾环绕；全禁用不动）
            moveActive(dir) {
                const list = this.data.items ?? [];
                if (list.length === 0) return;
                let i = list.findIndex((o) => o && String(o.key) === String(this.data.activeKey));
                for (let step = 0; step < list.length; step++) {
                    i = (i + dir + list.length) % list.length;
                    if (!list[i].disabled) { this.data.activeKey = list[i].key; return; }
                }
            },
            // 选中流程（面板点击哨兵 / 键盘 Enter 汇聚点）：禁用跳过；select 事件
            // detail = { key, item }（冒泡供外层消费）+ 关面板 + 高亮复位（动作菜单
            // 无激活态持久语义——select 后归 null，重开从头漫游）
            pick(key) {
                if (this.data.disabled) return;
                const list = this.data.items ?? [];
                const item = list.find((o) => o && String(o.key) === String(key));
                if (!item || item.disabled) return;
                this.emit("select", { key: item.key, item: { ...item } });
                this.data.activeKey = null;
                this.closePanel();
            },
            // 触发器键盘导航（WAI-ARIA menu 模式，高亮漫游）：上下移动高亮（未开先开）/
            //     Enter 开态触发当前高亮（preventDefault 防误触发表单提交；无高亮关
            //     面板；关态原生放行——触发内容自身的按钮语义归使用者）；ESC 与 Tab
            //     不拦截（ESC 归 popover 打开栈——机制继承；Tab 自然移焦）
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
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：可交互同步
            //     （data-disabled 根反射 = CSS 拦截开面板的通道，select 同款）——
            setTimeout(() => {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
            }, 0);

            // —— 状态跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            // 开合态：aria-expanded（触发器）+ data-open（根，使用者 CSS 钩子）；
            // 打开时高亮复位（动作菜单无激活态持久语义）
            this.watch("open", () => {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) this.data.activeKey = null;
            });
            // 禁用联动：根反射（CSS 拦截）+ 退出焦点序 + 关面板
            this.watch("disabled", () => {
                setTimeout(() => {
                    const t = this.triggerEl();
                    if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                    this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                }, 0);
                if (this.data.disabled) this.closePanel();
            });
            // 面板哨兵：选中（pickTick）/ 悬停高亮（hoverTick）
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
    /* 分隔线（divided）：顶部分隔（首项 divided 也画——显式意图直书） */
    .asc-dropdown-item[data-divided] {
      border-top: var(--auto-border-size, var(--asc-dropdown-item-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-dropdown-item-border, #f0f0f0));
    }
    /* 危险项（danger）：danger 语义色 + 悬停红染（menu 激活 10% tint 同手法） */
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
    /* 空态：居中辅助色文案 */
    .asc-dropdown-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-dropdown-empty, rgba(0, 0, 0, 0.35)));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 触发器 = 默认插槽出口本体（popover 宿主 + 键盘监听 + 聚焦位合一）：出口标记
         不能落在覆盖物宿主的**子树内**（ADR-0056 决策十：宿主子树内的 x-slot 会被判
         为覆盖物内容标记而剪枝——出口与宿主同元素则不命中该判定，consumer 内容直接
         成为宿主子级，点击即 toggle）。trigger / placement 经 x-popover-options 成员
         属性表达式透传（热切换；at 结构键跨层成员级合并，selector 恒回退宿主）；
         aria-expanded 由 mounted JS 通道随 open 同步 -->
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
`,Cs=`<!--
    autospark-dropdown-panel 菜单面板（ADR-0027）——dropdown 的内部组件（非用户直接
    消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制渲染进
    body 覆盖物容器，面板外壳（边框/阴影/定位）由 popover-shell 承载，本组件只贡献
    菜单列表内容（菜单项语义自持——不嵌套消费 autospark.menu，动作菜单一层平铺）。

    与触发器组件（autospark.dropdown）的通信走 scope 链（ADR-0022 决策 2 同款）：
    overlay 内容宿主恒以「open + dataContext:'host'」实例化本组件，聚合视图沿链读写
    触发器组件 data 域——
    - 读：items（x-for 数据源）/ activeKey（高亮基准）；
    - 写：哨兵键 pickTick/pickKey（菜单项点击）、hoverTick/hoverKey（悬停高亮回传）
      ——面板模板不能跨组件边界调触发器组件 method（x-on 组件 method 查找不穿透父
      组件），自增哨兵免疫同值去重；事件表达式用逗号运算符单表达式形态（分号多语句
      依赖新版引擎回退，旧产物不可用）；
    - 开合态：mounted/unmounted 沿链写 open（触发器侧 aria-expanded / data-open 同步）。

    列表渲染：x-for 容器宿主形态（engine 惯用语义——ul 为容器，li 为逐项克隆模板，
    :key 在容器上，menu 同款）；克隆体内条件显隐一律 x-show（共享快照多实例 x-if
    串台规避，P0 清单第 4 条——icon 空值 x-icon 渲染默认图标，x-show 隐藏不可见）。
    空态文案走 i18n 词典 dropdown.empty 键（回退「暂无数据」）。
-->
<div class="asc-dropdown-panel" x-define="autospark-dropdown-panel">
  <script setup>
    {
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生 aria-expanded / data-open / 高亮复位）
            this.data.open = true;
            // 高亮项滚动跟随（键盘导航可见性；列表在面板内现查）
            const scrollActive = () => {
                const el = this.el.querySelector(".asc-dropdown-item[data-active]");
                el?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(scrollActive, 0);
            this.watch("activeKey", () => { setTimeout(scrollActive, 0); });
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 菜单列表：x-for 容器宿主形态（ul 容器 + li 克隆模板）+ 空态行随容器 -->
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
`,ws=`autospark.dropdown`,Ts=`autospark-dropdown-panel`,Es=new Set([`disabled`]);function Ds(e){let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);return n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0),e.hasAttribute(`divided`)&&(t.divided=!0),e.hasAttribute(`danger`)&&(t.danger=!0),t}function Os(e){e.components[ws]=Ss,e.components[Ts]=Cs,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-dropdown`))){let e=document.createElement(`span`),n=Array.from(t.children).filter(e=>e.tagName.toLowerCase()===`x-dropdown-item`),r=t.getAttribute(`items`),i=t.hasAttribute(`:items`);if(t.removeAttribute(`items`),(n.length>0||r!=null&&r!==``)&&!i){let t=null;if(n.length)t=n.map(Ds);else try{let e=JSON.parse(r);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of n)e.remove();let a=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?a.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):n.value===``&&Es.has(n.name)?a.push(`${Q(Z(n.name))}: true`):a.push(`${Q(Z(n.name))}: ${JSON.stringify($(n.value))}`);for(e.setAttribute(`x-component:${ws}`,`{ ${a.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}ks();function ks(){y(e=>{m(e),Os(e)})}var As=`<!--
    autospark.float-button 悬浮按钮（组件库 P3 other 分类首件，ADR-0018 清单权威表
    other 行 / 修订吸收原 backtop 独立条目——antd 5 同款路线 / ADR-0029 轻件对 ADR）：
    fixed 右下悬浮钮。type 双形态：default 常规（icon 必选 + click 原生冒泡事件出口）|
    back-to-top 回顶（滚动超 visibilityHeight 阈值渐显 + 点击回顶 window.scrollTo smooth）。

    监听清理（grid 的 matchMedia 先例）：scroll 挂全局长命对象 window，组件拆卸
    （unmounted）须摘除——cleanup 存宿主 JS 属性（_ascFloatButtonCleanup）统一回收；
    type 动态切换时旧监听先行摘除再按新形态重挂（幂等）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——形态绑定（:data-type / :data-shape）落编译子树内层 body 上，宿主经
    :has() 驱动；渐显标记（data-visible）与定位偏移（right/bottom）为 JS 通道写宿主。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——阴影/圆角/字号档位经主题通道全跟随（阴影即走 data-shadow）；
     float-button 不在 data() 声明主题六键，内部变体属性（type/shape）亦禁用六个通道名 -->
<button
  type="button"
  class="asc-float-button"
  x-define="autospark.float-button"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "default",        // 形态：default 常规（icon 必选）| back-to-top 回顶（渐显 + 点击回顶）
            icon: "",               // 图标名（x-icon 渲染）；back-to-top 缺省内置 arrow 上旋指顶，常规形态必选（空值渲染 default 占位图）
            visibilityHeight: 400,  // back-to-top 显现阈值（px）：滚动超出渐显、回落隐藏
            right: 40,              // 右缘偏移（number → px；string 带单位原样）——JS 通道写宿主内联，覆盖 CSS 缺省
            bottom: 40,             // 下缘偏移（同上）
            shape: "circle",        // 形状：circle 正圆（缺省）| square 圆角方（圆角走 --auto-border-radius 档位）
        }),
        mounted() {
            const el = this.el;

            // —— 定位偏移 JS 通道（number → px 归一；非空 string 带单位原样；空值不写走 CSS 缺省）——
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

            // —— back-to-top 渐显判定：滚动位置 ≥ visibilityHeight 落宿主 data-visible
            //    （CSS 渐显；scrollY 通道兜 documentElement.scrollTop）——
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

            // —— scroll 监听生命周期（仅 back-to-top 形态挂载；type 动态切换重挂，
            //    常规形态恒显——data-visible 摘除）——
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
            // props 晚注入一跳对齐（家族惯例）：type/visibilityHeight 落定后再挂监听
            setTimeout(() => { bindScroll(); }, 0);
            this.watch("right", () => { syncPos(); });
            this.watch("bottom", () => { syncPos(); });
            this.watch("type", () => { setTimeout(bindScroll, 0); });
            this.watch("visibilityHeight", () => { syncVisible(); });

            // —— 点击出口：常规形态原生 click 冒泡即事件出口（外层 @click 消费，组件
            //    默认封闭）；back-to-top 内建回顶（reduced-motion 瞬时归位）——
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
            // 监听清理（防泄漏：scroll 挂全局长命对象 window，组件拆卸须摘监听）；
            // this.el 可能已拆（可选链静默通过）
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

    /* ---------- square 形态：圆角走 --auto-border-radius 档位 ---------- */
    .asc-float-button:has(> .asc-float-button-body[data-shape="square"]) {
      border-radius: var(--auto-border-radius, var(--asc-float-button-radius, 0.5rem));
    }

    /* ---------- 带 label：宽幅胶囊形态（label 非空时自适应放宽） ---------- */
    .asc-float-button:has(.asc-float-button-label:not(:empty)) {
      width: auto;
      min-width: var(--asc-float-button-size, 2.5rem);
      padding: 0 0.875em;
    }

    /* ---------- back-to-top 渐显：未越阈值隐藏（opacity/位移渐出 + visibility 收尾 + 交互阻断） ---------- */
    .asc-float-button:has(> .asc-float-button-body[data-type="back-to-top"]):not([data-visible]) {
      opacity: 0;
      visibility: hidden;
      transform: translateY(0.5rem);
      pointer-events: none;
    }

    /* ---------- reduced-motion：停播过渡（渐显/交互动效全部瞬时） ---------- */
    @media (prefers-reduced-motion: reduce) {
      .asc-float-button {
        transition: none;
      }
    }

    /* ---------- 图标与文案 ---------- */
    .asc-float-button-icon {
      display: inline-flex;
      font-size: 1.25em; /* 图标随档位字号放大（x-icon 默认 1em，悬浮钮取大半档） */
    }
    /* back-to-top 缺省图标：内置 arrow 上旋指顶（自定义 icon 不旋——data-default-icon 仅空 icon 落标） */
    .asc-float-button-body[data-type="back-to-top"] .asc-float-button-icon[data-default-icon] {
      transform: rotate(-90deg);
    }
    .asc-float-button-label:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-float-button,
    [data-dark] .asc-float-button {
      background: var(--auto-bgcolor, var(--asc-float-button-bg, #3a3a3a));
      color: var(--auto-color, var(--asc-float-button-color, #fafafa));
      border-color: var(--auto-border-color, var(--asc-float-button-border, #52525b));
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.4)));
    }
  </style>
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；data-default-icon 标记空 icon
         （缺省 arrow 的上旋判定）；默认插槽出口承载可选 label（无内容不占位） -->
  <span class="asc-float-button-body" :data-type="type" :data-shape="shape">
    <i
      class="asc-float-button-icon"
      :data-default-icon="icon ? null : ''"
      x-icon="icon || (type === 'back-to-top' ? 'arrow' : '')"
    ></i>
    <span class="asc-float-button-label" x-slot></span>
  </span>
</button>
`,js=`autospark.float-button`;function Ms(e){e.components[js]=As,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-float-button`))){let e=document.createElement(`button`);e.setAttribute(`type`,`button`);let n=t.hasAttribute(`back-to-top`);t.removeAttribute(`back-to-top`);let r=t.hasAttribute(`type`)||t.hasAttribute(`:type`),i=[];for(let n of Array.from(t.attributes))n.name.startsWith(`:`)?i.push(`${Q(Z(n.name.slice(1)))}: (${n.value})`):n.name===`class`||n.name===`style`||n.name===`id`||n.name.startsWith(`data-`)||n.name.startsWith(`x-`)||n.name.startsWith(`@`)?e.setAttribute(n.name,n.value):i.push(`${Q(Z(n.name))}: ${JSON.stringify(n.value===``||$(n.value))}`);for(n&&!r&&i.push(`type: ${JSON.stringify(`back-to-top`)}`),e.setAttribute(`x-component:${js}`,`{ ${i.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ns();function Ns(){y(e=>{m(e),Ms(e)})}var Ps=`<!--
    autospark.affix 固钉（组件库 P4 other 长尾件，ADR-0018 清单权威表 other 行 /
    ADR-0030 轻件对 ADR）：滚动过 offset 阈值后内容 fixed 吸附视口（position=top
    吸顶缺省 / bottom 吸底）；原位占位撑高防跳动（脱流前几何快照：宿主写 height
    占位、left/width 经 CSS 变量下发内容层 fixed 定位）+ change 冒泡
    detail = { fixed }。

    触发线语义（v1 简化，ADR-0030 声明）：统一「滚动位置 scrollY >= offset」单线
    触发，position 只决定吸附边与吸附偏移方向（offset 兼触发线与吸附位）——antd
    的 offsetTop/offsetBottom 双线独立判定不采（语义更少歧义、可测面更小）。

    监听清理（grid 的 matchMedia 先例）：scroll/resize 挂全局长命对象 window，
    组件拆卸（unmounted）须摘除——cleanup 存宿主 JS 属性（_ascAffixCleanup）统一
    回收。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——position 形态绑定落编译子树内层 body 上，宿主固钉态
    （data-fixed）与几何下发（CSS 变量）为 JS 通道写宿主。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得；affix 是纯定位件（无色面/字号面），档位仅级联传递给插槽内容——
     不在 data() 声明主题六键，内部变体属性（position）亦禁用六个通道名 -->
<div
  class="asc-affix"
  x-define="autospark.affix"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            offset: 0,       // 触发偏移（px）：滚动位置 >= offset 即吸附；吸附位同值（top: offset / bottom: offset）
            position: "top", // 吸附边：top 吸顶（缺省）| bottom 吸底
        }),
        mounted() {
            const el = this.el;
            let fixed = false; // 当前固钉态（闭包自持——scroll 回调只读不重算 props 之外的状态）

            // —— 滚动位置（scrollY 通道兜 documentElement.scrollTop）——
            const scrollTop = () =>
                (typeof window.scrollY === "number" ? window.scrollY : 0)
                || (document.documentElement ? document.documentElement.scrollTop : 0)
                || 0;

            // —— 触发判定：统一单线 scrollY >= offset（v1 简化语义，ADR-0030 声明）——
            const computeFixed = () => {
                const off = Number(this.data.offset);
                return scrollTop() >= (isFinite(off) ? off : 0);
            };

            // —— 吸附偏移下发（offset 兼触发线与吸附位；CSS 变量沿 DOM 继承给内容层）——
            const syncOffset = () => {
                const off = Number(this.data.offset);
                el.style.setProperty("--asc-affix-off", \`\${isFinite(off) ? off : 0}px\`);
            };

            // —— 固钉态切换（边沿快照：脱流前读宿主原位几何——height 占位撑高、
            //    left/width 下发内容层 fixed 定位；同值短路防密集 scroll 重复派发）——
            const syncFixed = () => {
                const should = computeFixed();
                if (should === fixed) return;
                fixed = should;
                if (should) {
                    const rect = el.getBoundingClientRect();
                    el.style.setProperty("--asc-affix-left", \`\${rect.left}px\`);
                    el.style.setProperty("--asc-affix-width", \`\${rect.width}px\`);
                    el.style.height = \`\${rect.height}px\`; // 占位撑高：内容脱流后宿主顶住文档流防跳动
                    el.setAttribute("data-fixed", "");
                } else {
                    el.style.removeProperty("--asc-affix-left");
                    el.style.removeProperty("--asc-affix-width");
                    el.style.height = "";
                    el.removeAttribute("data-fixed");
                }
                el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { fixed: should } }));
            };

            // —— scroll/resize 监听（passive；fixed 态 resize 重校 left/width——
            //    视口/布局变化后 fixed 定位坐标漂移）；syncFixed 自卫：宿主脱树
            //    （engine 销毁清 DOM）后回调自短路并自摘监听——x-define:inherit
            //    试挂域时序下 mounted 同步段挂的全局监听会随试挂域错拆，挂载
            //    移一跳 setTimeout（float-button 同款既有规避）——
            const onScroll = () => {
                if (!el.isConnected) { el["_ascAffixCleanup"]?.(); return; } // 自愈摘除
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

            // props 晚注入一跳对齐（家族惯例）：offset/position 落定后再挂监听 + 首同步
            setTimeout(() => {
                if (!el.isConnected) return; // 试挂域拆除后不再挂载（重建域自会挂）
                bindListeners();
                syncFixed();
            }, 0);
        },
        unmounted() {
            // 监听清理（防泄漏：scroll/resize 挂全局长命对象 window，组件拆卸须摘监听）；
            // this.el 可能已拆（可选链静默通过）
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
      position: relative; /* 水印/浮层类内嵌场景的定位锚（本件自身常流） */
      display: block;
    }

    /* ---------- 固钉态：内容层脱流吸附（left/width/off 经宿主 CSS 变量下发——JS 边沿快照） ---------- */
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
      position: relative; /* 常态随文档流 */
    }
  </style>
  <!-- position 形态绑定落本层（根上动态绑定不求值，T4=B）；默认插槽出口承载固钉内容 -->
  <div class="asc-affix-body" :data-position="position">
    <div class="asc-affix-inner" x-slot></div>
  </div>
</div>
`,Fs=`autospark.affix`;function Is(e){e.components[Fs]=Ps,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-affix`))){let e=document.createElement(`div`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify(r.value===``||$(r.value))}`);for(e.setAttribute(`x-component:${Fs}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Ls();function Ls(){y(e=>{m(e),Is(e)})}var Rs=`<!--
    autospark.watermark 水印（组件库 P4 other 长尾件，ADR-0018 清单权威表 other 行 /
    ADR-0030 轻件对 ADR）：容器形态（缺省，absolute 覆盖默认插槽内容）或全页形态
    （fullPage，水印层挂 body fixed 铺满视口）；canvas 离屏绘制旋转文本单元 →
    data URL 作 background-image 平铺（技术路线声明见 ADR-0030）。

    props 变化签名比对幂等重绘（pagination 同款纪律：同值不重绘防 watcher 抖动）；
    无 canvas 2D 上下文环境静默降级（层透明，不炸）。

    内容保护（pointer-events 拦截层）与 MutationObserver 防删除按简不做
    （ADR-0030 边界声明）——水印层恒 pointer-events: none。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——fullPage 形态绑定落编译子树内层 body 上（宿主 display: contents
    经 :has() 驱动）；水印层全部样式走 JS 通道内联（canvas dataURL 本就 JS 产物）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得；水印是覆盖装饰件（色值经水印层 color 三级回退链解析进 canvas），
     不在 data() 声明主题六键，内部变体属性（fullPage）亦禁用六个通道名 -->
<div
  class="asc-watermark"
  x-define="autospark.watermark"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            content: "",   // 水印文案：string 单行 | string[] 多行（数组走状态引用 / data-content JSON 通道）
            font: "",      // CSS font 速写（完整覆盖，如 "bold 20px serif"）；空 = fontSize + 主题字体族合成
            fontSize: 16,  // 字号（px，font 缺省时的合成档）
            color: "",     // 色（空 = 水印层 computed color——主题 secondary 三级回退；显式值 JS 内联覆盖）
            opacity: 1,    // 水印层整体不透明度（0-1，叠加在 color 之上）
            rotate: -22,   // 旋转角（度，负值逆时针）
            gap: null,     // 平铺间隙 [x, y] | number（等两轴）；null = [100, 100]
            zIndex: 9,     // 层级（fullPage 全页形态常需压到内容之上）
            fullPage: false, // 全页形态：水印层挂 body fixed 铺满视口（缺省容器覆盖形态）
        }),
        mounted() {
            const el = this.el;
            let layer = null;      // 水印层元素引用（fullPage 时被挪挂 body——unmounted 须收）
            let layerInBody = false; // 层当前是否挂在 body（fullPage 形态旗）
            let lastSign = null;   // 上次绘制签名（幂等：同值不重绘）

            // —— 文案归一：string[] 直收 / string 单行 / JSON 数组字符串（[ 开头）拆多行 ——
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

            // —— 间隙归一：number 等两轴 / [x, y] 直收 / 缺省 [100, 100] ——
            const normGap = (v) => {
                if (typeof v === "number" && isFinite(v)) return [v, v];
                if (Array.isArray(v) && v.length === 2) {
                    const gx = Number(v[0]), gy = Number(v[1]);
                    return [isFinite(gx) ? gx : 100, isFinite(gy) ? gy : 100];
                }
                return [100, 100];
            };

            // —— 声明形态兜底（precompile 数组面标量分流落盘的 data-content/data-gap）——
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

            // —— 层定位：fullPage 挂 body（内联 fixed 铺满）/ 缺省归位组件树
            //    （position 走 CSS 声明的 absolute——JS 内联仅覆写全页形态）——
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

            // —— 绘制管线：canvas 离屏单元 → data URL 平铺；签名幂等；宿主脱树
            //    （engine 销毁清 DOM）后自短路——watch 回调在域销毁信号下仍可能
            //    晚触发一跳（isConnected 自卫使残留触发无害）——
            const draw = () => {
                if (!layer || !el.isConnected) return;
                const lines = normLines(this.data.content);
                const rotate = Number(this.data.rotate);
                const rot = isFinite(rotate) ? rotate : 0;
                const [gx, gy] = normGap(this.data.gap);
                const fontSize = Number(this.data.fontSize);
                const fs = isFinite(fontSize) && fontSize > 0 ? fontSize : 16;
                const sign = JSON.stringify([lines, String(this.data.font ?? ""), fs, String(this.data.color ?? ""), this.data.opacity, rot, gx, gy, !!this.data.fullPage]);
                if (sign === lastSign) return; // 同值短路（watcher 抖动防御）
                lastSign = sign;

                syncContainer();
                // 覆盖样式通道：color 显式值内联（缺省走 CSS 回退链 computed 值——主题在场自动跟随）
                if (this.data.color) layer.style.setProperty("color", String(this.data.color));
                else layer.style.removeProperty("color");
                const op = Number(this.data.opacity);
                layer.style.opacity = String(isFinite(op) ? op : 1);
                const z = Number(this.data.zIndex);
                layer.style.zIndex = String(isFinite(z) ? z : 9);

                // —— canvas 单元绘制（无 2D 上下文环境静默降级：层透明，不炸）——
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext ? canvas.getContext("2d") : null;
                if (!ctx || !lines.length) {
                    layer.style.backgroundImage = "";
                    layer.style.backgroundSize = "";
                    return;
                }
                const computed = getComputedStyle(layer);
                // 字体：font 速写优先；缺省 fontSize + 层 computed 字体族（主题对齐免费）
                const family = (computed.fontFamily && String(computed.fontFamily).trim()) || "sans-serif";
                const font = this.data.font
                    ? String(this.data.font)
                    : \`\${fs}px \${family}\`;
                ctx.font = font;
                const widths = lines.map((line) => ctx.measureText(line).width);
                const textW = Math.ceil(Math.max(...widths, 1));
                const lineH = Math.ceil(fs * 1.3);
                const textH = lineH * lines.length;
                // 单元尺寸 = 旋转外接矩形（文字块对角扩展）+ 余量
                const rad = (rot * Math.PI) / 180;
                const cos = Math.abs(Math.cos(rad));
                const sin = Math.abs(Math.sin(rad));
                const w = Math.ceil(textW * cos + textH * sin) + 8;
                const h = Math.ceil(textW * sin + textH * cos) + 8;
                canvas.width = w;
                canvas.height = h;
                ctx.font = font; // 尺寸重设清空画布状态（font 需重写）
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

            // props 变化统一重绘（签名幂等；watch 回调收 { value } 信封——本件读全量 data 不解构）；
            // 注册与层引用/首绘统一移一跳 setTimeout（x-define:inherit 试挂域时序下
            // mounted 同步段的副作用会随试挂域错拆——float-button 同款既有规避）
            const redraw = () => { draw(); };
            setTimeout(() => {
                if (!el.isConnected) return; // 试挂域拆除后不再接线（重建域自会接）
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
                if (layer && layerInBody) layer.remove(); // body 残留收除（fullPage 形态）
            };
        },
        unmounted() {
            // 清理：fullPage 水印层挂 body（组件树外），组件拆卸须显式收除；
            // this.el 可能已拆（可选链静默通过）
            const cleanup = this.el?.["_ascWatermarkCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascWatermarkCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-watermark">
    .asc-watermark {
      position: relative; /* 容器形态的水印层定位锚 */
      display: block;
    }
    /* fullPage 形态：宿主不占布局（水印层已挂 body，内容出口空不渲染） */
    .asc-watermark:has(> .asc-watermark-body[data-full-page]) {
      display: contents;
    }

    /* ---------- 水印层：缺省 absolute 覆盖容器（fullPage 时 JS 内联改 fixed + 挂 body） ---------- */
    .asc-watermark-layer {
      position: absolute;
      inset: 0;
      pointer-events: none; /* 水印恒不拦交互（内容保护 v1 不做——ADR-0030 边界声明） */
      overflow: hidden;
      /* 取色源（canvas fillStyle 消费 computed 值）：主题在场吃 --auto-*，暗色自动跟随 */
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
  <!-- 内容出口先行（水印层覆盖其上）；fullPage 形态绑定落本层（根上动态绑定不求值，T4=B）；
         默认插槽承载被覆盖内容（fullPage 时通常空——层已全页） -->
  <div class="asc-watermark-body" :data-full-page="fullPage ? '' : null">
    <div class="asc-watermark-content" x-slot></div>
  </div>
  <div class="asc-watermark-layer"></div>
</div>
`,zs=`autospark.watermark`;function Bs(e){e.components[zs]=Rs,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-watermark`))){let e=document.createElement(`div`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${Q(Z(r.name.slice(1)))}: (${r.value})`):(r.name===`content`||r.name===`gap`)&&r.value.trim().startsWith(`[`)?e.setAttribute(`data-${r.name}`,r.value):r.name===`class`||r.name===`style`||r.name===`id`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${Q(Z(r.name))}: ${JSON.stringify(r.value===``||$(r.value))}`);for(e.setAttribute(`x-component:${zs}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}Vs();function Vs(){y(e=>{m(e),Bs(e)})}var Hs=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——遮罩高亮框与气泡全部落在编译子树的内层元素上，宿主为透明块壳。

    形态裁定（自绘 fixed 遮罩 + 气泡，不组合 x-popover 指令——ADR-0031 选型声明）：
    x-popover 由宿主 hover/click 驱动（无程序化 visible 通道）且锚定宿主即声明元素，
    tour 需步进程序驱动 + 锚定组件外动态目标（steps[i].target 选择器），两点结构性
    不适配——按 image-viewer 自建 fixed 层先例自绘，渲染在 engine 宿主树内（非
    teleport），事件沿 DOM 冒泡外层 @close / @change 直接可收。已知边界：宿主祖先链
    transform/filter 时 fixed 相对该祖先（CSS 含有块规则）。

    遮罩高亮选型（box-shadow 大投影，ADR-0031）：高亮框单 fixed 元素，
    box-shadow 0 0 0 100vmax 半透明黑即全页遮罩（intro.js 同款）——圆角高亮免费、
    步进过渡走 CSS transition。高亮框 pointer-events:none：遮罩为纯视觉层不拦截
    页面交互（设计取舍非缺陷，拦截式后续 props 化增补）。

    首开零闪烁协议（ADR-0031）：气泡/高亮框 :not([data-placed]) 时 visibility
    hidden（display 经 x-show 生效但坐标未写定前不可见），JS 通道写完坐标后落
    data-placed——首帧直接到位；data-placed 在场后 transition 生效（步进平滑）。

    受控语义：visible（el.value 桥：读 = 当前开关、写 = 开关经 watch 定位，不广播）
    + current（props 单向驱动 + 内部步进写 data + change detail={current}）。
    末步自动关：末步「完成」点击即内部写 visible=false + close 广播 + input 非冒泡
    （x-model 回写通道）——未接线调用方亦能自然关闭，接线方回写状态闭环。
    打开边沿不重置 current（纯受控；重开从头建议调用方随 close 一并归零）。

    i18n 消费（ADR-0018 决策 6 约定 1）：动作钮文案走词典 tour.prev / next / skip /
    finish 键，键等值判定（未装 i18n / 词典无键时 t(键)===键）回退硬编码中文。

    目标 miss 跳步：steps[i].target 未命中 → console.warn + 跳下一步（链式重入）；
    全 miss / 末步 miss → warn + 关闭链。steps 空数组打开为无操作（均不亮相）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——气泡字号以 em 标定随 data-size 档位全跟随；本件不在 data()
     声明主题六键，内部变体属性亦禁用六个通道名 -->
<div class="asc-tour" x-define="autospark.tour" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            steps: [],     // 步骤 { target（CSS 选择器）, title?, content }[]——状态引用注入（字面量数组死环规避，ADR-0021 规避 5；变更须整体替换）
            visible: false, // 受控开关（true 打开引导；末步完成/跳过自动关——close 广播 + input 回写）
            current: 0,    // 当前步（受控缺省 0；props 单向驱动 + 内部步进写 data + change 广播）
            // computed 简写（普通函数值即计算属性，仅限单表达式，message-box 同款）
            stepCount: (s) => (s.steps || []).length,
            curStep: (s) => (s.steps || [])[s.current] || null,
            isLast: (s) => s.current >= (s.steps || []).length - 1,
        }),
        methods: {
            // 目标解析：document 范围 querySelector（全页引导语境，目标可在任意处）
            resolveTarget(step) {
                if (!step || typeof step.target !== "string" || !step.target) return null;
                try { return document.querySelector(step.target); }
                catch { return null; } // 非法选择器按 miss 处理（不抛出）
            },
            // 定位同步（立即路径：几何重算，scroll/resize 高频通道）：
            // 高亮框写 rect（呼吸边 pad）→ 气泡下方优先/上翻 + 水平 clamp → data-placed 落位
            syncPosition() {
                if (!this.data.visible) return;
                const steps = this.data.steps || [];
                if (!steps.length) return; // 空步骤无操作（props 注入未达/纯空——不亮相不关闭，x-show 已兜）
                const hi = this.el.querySelector(".asc-tour-highlight");
                const bubble = this.el.querySelector(".asc-tour-bubble");
                if (!hi || !bubble) return;
                // —— 目标 miss 跳步（链式重入）：warn + 跳下一步；全 miss / 末步 miss → 关闭 ——
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
                // —— 高亮框：目标 rect + 呼吸边（fixed 坐标系 = 视口坐标，rect 直读） ——
                const rect = target.getBoundingClientRect();
                const pad = 6;
                hi.style.left = (rect.left - pad) + "px";
                hi.style.top = (rect.top - pad) + "px";
                hi.style.width = (rect.width + pad * 2) + "px";
                hi.style.height = (rect.height + pad * 2) + "px";
                hi.setAttribute("data-placed", "");
                // —— 气泡：目标下方优先，视口空间不足上翻（data-side 驱动方向视觉）；
                //    水平 clamp 视口 8px 边距 ——
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
            // 延迟一跳定位（内容更新通道：visible/current/steps 变化后，气泡内容与
            // x-show 显隐经调度器微任务落定，setTimeout 0 宏任务必在其后——offsetWidth
            // 读到真实值）
            scheduleSync() {
                setTimeout(() => this.syncPosition(), 0);
            },
            // 步切换广播（detail={current}，冒泡——外层 @change 一行回写）
            emitChange() {
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { current: this.data.current } }));
            },
            // 关闭链：内部写 visible=false（末步自动关成立——未接线调用方亦能关）+
            // input 非冒泡（x-model 回写通道）+ close 冒泡（接线方知情）
            closeTour() {
                if (!this.data.visible) return;
                this.data.visible = false;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
            // 上一步（首步不动作；disabled 绑定兜底）
            onPrev() {
                if (this.data.current <= 0) return;
                this.data.current = this.data.current - 1;
                this.emitChange();
                this.scheduleSync();
            },
            // 下一步：末步 = 完成语义 → 自动关；否则步进 + 广播
            onNext() {
                const len = (this.data.steps || []).length;
                if (this.data.current >= len - 1) { this.closeTour(); return; }
                this.data.current = this.data.current + 1;
                this.emitChange();
                this.scheduleSync();
            },
            // 跳过引导（关闭链同款）
            onSkip() {
                this.closeTour();
            },
        },
        mounted() {
            // el.value 劫持桥（受控 visible 的 DOM 通道：x-model / 程序读写皆经此）——
            // 读 = 当前开关；写 = 开关（经 watch 走定位同步，不广播）
            Object.defineProperty(this.el, "value", {
                get: () => !!this.data.visible,
                set: (v) => { this.data.visible = !!v; },
                configurable: true,
            });

            // 受控驱动：visible / current / steps 变化 → 延迟一跳定位（内容更新后）
            this.watch("visible", () => { if (this.data.visible) this.scheduleSync(); });
            this.watch("current", () => this.scheduleSync());
            this.watch("steps", () => this.scheduleSync());
            // 初值打开（props 注入早于 mounted 的 watch 注册，无变化不触发——首挂即开场景补定位）
            if (this.data.visible) this.scheduleSync();

            // 滚动/resize 跟随：window scroll capture（整页任意滚动容器——子容器滚动
            // 不冒泡 window，capture 在 window 侧截获）+ resize；仅 visible 时重算
            const onTrack = () => { if (this.data.visible) this.syncPosition(); };
            window.addEventListener("scroll", onTrack, true);
            window.addEventListener("resize", onTrack);

            // 目标尺寸突变跟随（条件渲染/动态内容等；happy-dom 等无 RO 环境静默退化）
            let ro = null;
            if (typeof ResizeObserver !== "undefined") {
                ro = new ResizeObserver(() => { if (this.data.visible) this.syncPosition(); });
                ro.observe(document.documentElement);
            }

            // 监听卫生（document/window 级长命对象，防泄漏——image-viewer 同款纪律）：
            // 清理器落宿主 expando，unmounted 摘除
            this.el["_ascTourCleanup"] = () => {
                window.removeEventListener("scroll", onTrack, true);
                window.removeEventListener("resize", onTrack);
                if (ro) ro.disconnect();
            };
        },
        unmounted() {
            // 宿主可能已拆——可选链静默通过
            this.el?.["_ascTourCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-tour">
    /* 宿主：透明块壳（fixed 层在内层），字号基线经 data-size 档位跟随（气泡以 em 标定） */
    .asc-tour {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-tour-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- 高亮框：fixed + box-shadow 大投影遮罩（单元素选型，ADR-0031） ---------- */
    .asc-tour-highlight {
      position: fixed;
      left: 0;
      top: 0;
      z-index: var(--asc-tour-z, 1000);
      border-radius: var(--auto-border-radius, var(--asc-tour-highlight-radius, 0.375rem));
      /* 大投影即全页遮罩（100vmax 任意页面尺寸全覆盖）；遮罩色恒半透明黑（明暗通吃，
         非主题映射——遮罩语境恒暗，image-viewer 同款声明） */
      box-shadow: 0 0 0 100vmax var(--asc-tour-mask, rgba(0, 0, 0, 0.55));
      pointer-events: none; /* 纯视觉层不拦截页面交互（ADR-0031 设计取舍） */
      /* 首开零闪烁协议：定位未落位不可见；落位后步进过渡平滑（四几何属性） */
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

    /* ---------- 气泡：fixed 定位（JS 通道写 left/top）+ 面板盒饰 ---------- */
    .asc-tour-bubble {
      position: fixed;
      left: 0;
      top: 0;
      z-index: calc(var(--asc-tour-z, 1000) + 1); /* 恒在高亮框之上 */
      box-sizing: border-box;
      width: min(20rem, calc(100vw - 1rem));
      padding: var(--auto-padding, var(--asc-tour-padding, 0.9rem));
      background: var(--auto-bgcolor, var(--asc-tour-bg, #ffffff));
      border-radius: var(--auto-border-radius, var(--asc-tour-radius, 0.5rem));
      box-shadow: var(--auto-shadow, var(--asc-tour-shadow, 0 4px 16px rgba(0, 0, 0, 0.16)));
      color: var(--auto-color, var(--asc-tour-color, #606060));
      visibility: hidden; /* 首开零闪烁协议（同高亮框） */
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
    /* 标题：medium 字重 + 略大（引导主旨，message-box 同款语言）；缺席不占位 */
    .asc-tour-title {
      font-size: 1.1em;
      font-weight: var(--x-font-weight-medium, 500);
      color: var(--auto-color, var(--asc-tour-title-color, #303030));
    }
    .asc-tour-title:empty {
      display: none;
    }
    /* 内容：次要文字色 */
    .asc-tour-content {
      color: var(--auto-secondary-color, var(--asc-tour-content-color, rgba(0, 0, 0, 0.55)));
      word-break: break-word;
    }

    /* ---------- 动作区：跳过（链接式）+ 步指示 + 上一步/下一步（自绘轻量钮） ---------- */
    .asc-tour-footer {
      display: flex;
      align-items: center;
      gap: 0.6em;
    }
    /* 跳过：链接式文本钮（无边框，次要色弱化） */
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
    /* 步指示：当前/总数，辅助色；右钮组推开 */
    .asc-tour-indicator {
      flex: 1;
      text-align: center;
      font-size: 0.875em;
      color: var(--auto-third-color, var(--asc-tour-indicator-color, rgba(0, 0, 0, 0.45)));
      font-variant-numeric: tabular-nums;
    }
    /* 自绘轻量钮（page-header 先例：钮盒饰成本低于跨产物依赖，保按需加载自包含） */
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
    /* 主钮（下一步/完成）：主色实底白字——语义色底上的白字恒定设计（非变量映射） */
    .asc-tour-btn-primary {
      border-color: transparent;
      background: var(--auto-primary-color, var(--asc-tour-primary, #2563eb));
      color: var(--asc-tour-primary-color, #ffffff);
    }
    .asc-tour-btn-primary:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-tour-primary-hover, #1d4ed8));
      color: var(--asc-tour-primary-color, #ffffff);
    }

    /* ---------- 动效可访问性：reduced-motion 停播（步进过渡） ---------- */
    @media (prefers-reduced-motion: reduce) {
      .asc-tour-highlight,
      .asc-tour-bubble {
        transition: none;
      }
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 高亮框：visible 且有步时亮相（x-show 切 display；坐标 JS 通道写，data-placed 前不可见） -->
  <div class="asc-tour-highlight" x-show="visible && stepCount > 0"></div>
  <!-- 气泡：标题/内容/动作区（编译子树内层，绑定可求值）；文案 i18n 键等值判定回退中文 -->
  <div
    class="asc-tour-bubble"
    role="dialog"
    aria-label="漫游引导"
    x-show="visible && stepCount > 0"
  >
    <div class="asc-tour-bubble-body">
      <!-- 标题：插值 + :empty 不占位（多实例 x-if 串台缺陷规避，statistic 同款纪律） -->
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
`,Us=`autospark.tour`;function Ws(e){e.components[Us]=Hs}Gs();function Gs(){y(e=>{m(e),Ws(e)})}var Ks=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——本组件无宿主级变体外观，数值文本经 JS 通道直写内层元素（statistic
    同款纪律：绑定表达式不含组件 methods）。

    与 statistic 的边界（ADR-0024 statistic 边界声明的承接）：statistic 是静态数值
    展示（Intl 语言环境格式化，值由调用方给）；countdown 是时间衰减动态组件（内部
    驱动、随时间自走）——正交。样式复用 statistic 的数值排版语言：tabular-nums
    等宽数字 + 1.5em 大字重 + em 基准随 data-size 档位全跟随。

    计时引擎（ADR-0031 定夺）：真值恒为 deadline - Date.now()（mounted 时
    deadline = Date.now() + time）——tick 只触发重渲染不累积误差；递归 setTimeout
    每跳对齐 deadline 整秒边界（remain % 1000）：走秒无相位漂移、finish 在截止时刻
    精确触发。页面隐藏无须显式暂停：后台定时器被浏览器节流只影响刷新频率不影响
    正确性（真值是绝对时间，回页即正确）；visibilitychange 回页监听仅做一次即时
    重算 + finish 补触发（节流下 finish 至多迟到 1min，回页即时补发）。unmounted
    清理定时器与 document 监听（image-viewer 监听卫生同款纪律）。

    引擎边界实证（真浏览器发现）：methods this 上下文的 expando（this.timer =
    ...）在同类多实例间共享——deadline 被后挂载实例覆盖，全组件同值衰减（本件
    三实例同页全部跟随 60s 实例）。规避：per-instance 状态挂 this.el expando
    （化身宿主元素实例唯一，image-viewer 清理器同款纪律）；单测 happy-dom 下
    各用例独立 mount 未暴露此缺陷（多实例同挂才触发）。

    语域定夺（time 毫秒时长，非绝对时间戳）：time 变化即重启新一轮（验证码重发/
    秒杀补货一行接线）；绝对时刻场景调用方表达式 :time="deadline - Date.now()"。

    format token 模板：{d} 天（不补零）/ {h} 时 / {m} 分 / {s} 秒（补零两位）；模板
    含 {d} 时 {h} 为日内余时（0-23），不含时为总小时（可超 24）——antd 同款语义。
    token 替换走 split/join（零正则字面量——指令值正则规避纪律的延伸，机制通道
    script setup 内同守）。显示取整 Math.ceil（剩 59.95s 显示 60 秒——倒计时直觉）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——数值区字号以 em 标定（1.5em）随 data-size 档位全跟随；
     本件不在 data() 声明主题六键，内部变体属性亦禁用六个通道名 -->
<div class="asc-countdown" x-define="autospark.countdown" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            time: 0,   // 倒计时总时长（毫秒）：变化即重启新一轮（deadline 重算）；0 即刻归零 + finish
            format: "", // 格式模板：{d}{h}{m}{s} token（空 = "{h}:{m}:{s}" 时:分:秒）
        }),
        methods: {
            // 实例状态存取：挂宿主 el expando（this 上下文的 expando 在同类多实例间共享，
            // deadline/timer/finished 串台即全组件同值衰减——el 是化身宿主元素，实例唯一）
            deadline() { return this.el["_ascCdDeadline"] || 0; },
            setDeadline(v) { this.el["_ascCdDeadline"] = v; },
            timer() { return this.el["_ascCdTimer"] || 0; },
            setTimer(v) { this.el["_ascCdTimer"] = v; },
            finished() { return !!this.el["_ascCdFinished"]; },
            setFinished(v) { this.el["_ascCdFinished"] = v; },
            // 格式化：绝对 deadline 真值 → token 替换（split/join 零正则；补零两位 padStart）
            formatText() {
                const fmt = this.data.format || "{h}:{m}:{s}";
                const remain = Math.max(0, this.deadline() - Date.now());
                const totalSec = Math.ceil(remain / 1000); // ceil：剩 59.95s 显示 60 秒（倒计时直觉）
                const hasDay = fmt.indexOf("{d}") >= 0;
                const d = Math.floor(totalSec / 86400);
                // {h}：含 {d} 时为日内余时（0-23）；不含时为总小时（可超 24）——antd 同款语义
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
            // 数值文本直写（幂等：重算 + 覆写，watcher 同值重跑安全）
            syncValue() {
                const el = this.el.querySelector(".asc-countdown-value");
                if (el) el.textContent = this.formatText();
            },
            // 停表（清定时器，幂等）
            stop() {
                if (this.timer()) { clearTimeout(this.timer()); this.setTimer(0); }
            },
            // 归零事件：防重发标志守卫（tick 与 visibilitychange 补触发双通道只发一次）
            fireFinish() {
                if (this.finished()) return;
                this.setFinished(true);
                this.stop();
                this.syncValue(); // 归零渲染（全零形态）
                this.el.dispatchEvent(new CustomEvent("finish", { bubbles: true }));
            },
            // 递归走秒：每跳对齐 deadline 整秒边界（remain % 1000——相位无漂移、finish 精确）
            tickOn() {
                const remain = this.deadline() - Date.now();
                const delay = Math.min(1000, Math.max(16, remain % 1000 || 1000));
                this.setTimer(setTimeout(() => {
                    this.syncValue();
                    if (Date.now() >= this.deadline()) { this.fireFinish(); return; }
                    this.tickOn();
                }, delay));
            },
            // 启动新一轮：deadline 重算 + 立即渲染 + time<=0 即刻归零（合法边界非错误）
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
            // time 变化 = 重启新一轮（验证码重发/秒杀补货一行接线）；format 变化即时重排
            this.watch("time", () => this.start());
            this.watch("format", () => this.syncValue());

            // 回页补触发（节流免疫协议的收尾一环）：visibility visible 时即时重算，
            // 已过期则立即补 finish（后台节流下 finish 至多迟到 1min，回页即时补发）
            const onVis = () => {
                if (document.visibilityState === "visible" && !this.finished()) {
                    this.syncValue();
                    if (Date.now() >= this.deadline()) this.fireFinish();
                }
            };
            document.addEventListener("visibilitychange", onVis);

            // 监听卫生（document 级长命对象，防泄漏——image-viewer 同款纪律）：
            // 清理器落宿主 expando，unmounted 摘除
            this.el["_ascCountdownCleanup"] = () => {
                this.stop();
                document.removeEventListener("visibilitychange", onVis);
            };
        },
        unmounted() {
            // 宿主可能已拆——可选链静默通过
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
      font-weight: var(--x-font-weight-large, 600); /* 语义层无大号字重变量，直取基础标尺 */
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
      color: var(--auto-color, var(--asc-countdown-value-color, #303030));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-countdown-value,
    [data-dark] .asc-countdown-value {
      color: var(--auto-color, var(--asc-countdown-value-color, #fafafa));
    }
  </style>
  <!-- 数值文本由 mounted + watch JS 直写（绑定表达式不含 methods 的引擎边界规避） -->
  <div class="asc-countdown-body">
    <span class="asc-countdown-value"></span>
  </div>
</div>
`,qs=`autospark.countdown`;function Js(e){e.components[qs]=Ks}Ys();function Ys(){y(e=>{m(e),Js(e)})}};
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
