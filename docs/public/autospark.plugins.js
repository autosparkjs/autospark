(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var e=`autospark.notifications.shell`;function t(e){return`autospark.notifications.${e}`}var n={NONE:0,INFO:1,SUCCESS:2,WARN:3,ERROR:4},r=[`none`,`info`,`success`,`warn`,`error`];function i(e){if(typeof e==`number`)return Number.isInteger(e)&&e>=0&&e<=4?e:null;if(typeof e==`string`){let t=r.indexOf(e);return t>=0?t:null}return null}function a(e){return r[e]??`none`}var o={NONE:0,SESSION:1,LOCAL:2,REMOTE:3},s=new Set([`top-left`,`top-center`,`top-right`,`bottom-left`,`bottom-center`,`bottom-right`,`center`]),c={info:`info`,success:`yes`,warn:`warn`,error:`error`},l=[`primary`,`success`,`warning`,`danger`,`plain`];function u(e){return l.includes(e)?e:void 0}var d={pos:`top-right`,delayClose:3e3,showCount:5,closeable:!0,animate:`slide`,level:0,persist:0},f=new Set(`id.type.icon.title.description.delayClose.pos.offset.closeable.link.owner.level.read.status.result.persist.actions.anchor.progress.canStart.canPause.canCancel.canStop.closeWhenDone.animate.className.styles.width.height.minWidth.maxWidth.minHeight`.split(`.`));function p(e,t){let n=typeof e==`string`?{title:e}:e;return typeof n!=`object`||!n||Array.isArray(n)?(t(`engine.notifications.add: 入参须为通知字符串或配置对象，已忽略`),null):n}function m(e){return typeof e==`number`?`${e}px`:e}var h=`$notifications`,ee=null;function g(e){ee=e}function te(){return globalThis.AutoSpark??ee}function _(e){let t=te()?.[e];if(t==null)throw Error(`[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${e}"——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）`);return t}function ne(e,t){return _(`shallow`)(e,t)}function v(e){if(e==null||e===!1||e===``)return{enter:null,leave:null};if(typeof e==`string`){let t={name:e};return{enter:t,leave:{...t}}}if(typeof e!=`object`)return{enter:null,leave:null};let t=e,n={};return t.name!=null&&(n.name=String(t.name)),t.duration!=null&&(n.duration=Number(t.duration)),t.delay!=null&&(n.delay=Number(t.delay)),t.easing!=null&&(n.easing=String(t.easing)),{enter:y(t.enter,n),leave:y(t.leave,n)}}function y(e,t){if(e===!1)return null;let n=t.name,{duration:r,delay:i,easing:a}=t;if(typeof e==`string`)n=e;else if(typeof e==`object`){let t=e;t.name!=null&&(n=String(t.name)),t.duration!=null&&(r=Number(t.duration)),t.delay!=null&&(i=Number(t.delay)),t.easing!=null&&(a=String(t.easing))}if(n==null)return null;let o={name:n};return r!=null&&(o.duration=r),i!=null&&(o.delay=i),a!=null&&(o.easing=a),o}function re(e){return _(`getOverlayContainer`)(e)}function ie(e,t){if(globalThis.document===void 0)return;let{id:n,mode:r=`default`,location:i=`head`,el:a}=t??{},o=()=>typeof e==`function`?e():e,s=ae(n,a);if(!s){let e=document.createElement(`style`);return n&&(e.id=n),e.textContent=o(),a?a.appendChild(e):i==`body`?document.body.appendChild(e):document.head.appendChild(e),e}if(r==`replace`)s.textContent=o();else if(r==`patch`){let e=o();s.textContent!==e&&(s.textContent=e)}else r==`append`&&(s.textContent+=o());return s}function ae(e,t){if(!e)return null;let n=e.replace(/["\\]/g,`\\$&`),r=t?.querySelector(`[id="${n}"]`)??document.getElementById(e);return r?.tagName===`STYLE`?r:null}var oe=`autospark-notification-column-styles`,se=`
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
`;function ce(){ie(se,{id:oe})}var b=new WeakMap,le=`autospark-notifications`,ue=`data-autospark-notifications`,x=`data-notification-pos`;function de(e){if(typeof document>`u`||!document.body)return null;let t=b.get(e);if(!t){let n=re(e);if(!n)return null;t=document.createElement(`div`),t.className=le,t.setAttribute(ue,``),n.appendChild(t),b.set(e,t),ce()}return t}function fe(e,t,n){let r=de(e);if(!r)return null;let i=r.querySelector(`:scope > [${x}="${t}"]`);return i||(i=document.createElement(`div`),i.className=`autospark-notification-column`,i.setAttribute(x,t),n!=null&&i.style.setProperty(`--autospark-notification-inset`,m(n)),r.appendChild(i)),i}function pe(e){let t=b.get(e);t&&(t.remove(),b.delete(e))}var me=class{constructor(e){this.manager=e}get _state(){return this.manager._stateRef}createEntry(e,t,n){let r=this.manager._resolveAnchor(e.anchor),i=Date.now();return{id:t,type:n,record:{id:t,type:n,read:e.read===!0,title:e.title,description:e.description,level:e.level,owner:e.owner,status:e.status,result:e.result,link:e.link,createAt:i,updateAt:i},props:e,icon:this.manager._resolveIcon(e.level,e.icon),actions:this.manager._resolveActions(e.actions,r),state:`queued`,instance:null,scope:null,el:null,anchor:r,confirmResolve:null,timer:null,tickTimer:null,deadline:null,pausedRemaining:null,leave:null,clickHandler:null,enterHandler:null,leaveHandler:null,controlOffs:[],startEmitted:!1,appliedClassName:``,appliedStyles:``}}touch(e){e.record.updateAt=Date.now()}mirrorAdd(e){let t=this._state?.items;t&&t.push({...e.record})}mirrorReplace(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e.id);n>=0&&t.splice(n,1,{...e.record})}mirrorRemove(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e);n>=0&&t.splice(n,1)}evictOverflow(e){let t=this.manager._maxLen;if(t<=0)return;let n=this.manager;for(;n.size>t;){let t=null;for(let r of n.keys()){let i=n._entryOf(r);i&&i!==e&&(t==null||i.record.createAt<t.record.createAt)&&(t=i)}if(!t)break;n._destroyEntry(t)}}restoreRecords(e,t){let n=this.manager,r=[];for(let i of e){if(typeof i!=`object`||!i)continue;let e={...i,persist:t===`local`?o.LOCAL:o.REMOTE},a=e.id!=null&&e.id!==``?String(e.id):`notification-${++n._autoId}`,s=Number(i.createAt),c=Number(i.updateAt),l=Number.isFinite(s)&&s>0?s:Date.now(),u=Number.isFinite(c)&&c>0?c:l,d=n._entryOf(a);if(d){let t=n._mergeProps({...e,id:a}).merged;n._applyEntryConfig(d,t),d.record.createAt=l,d.record.updateAt=u,r.push(d.instance);continue}let{merged:f,type:p}=n._mergeProps({...e,id:a});n._settleLevel(f);let m=this.createEntry(f,a,p);m.record.createAt=l,m.record.updateAt=u,n._materialize(m)&&(m.state=`hidden`,m.instance&&(m.instance.data.closed=!0),r.push(m.instance))}return r}},he=class{constructor(e,t){this.manager=e,this.pos=t,this.waiting=[],this.shown=new Set}get _showCount(){return this.manager._showCount}offer(e){e.state===`shown`?this.shown.add(e.id):this.shown.size<this._showCount?(this.shown.add(e.id),this.manager._showEntry(e)):this.waiting.push(e)}remove(e){let t=this.waiting.indexOf(e);t>=0&&this.waiting.splice(t,1)}releaseShown(e){this.shown.delete(e)}flush(){for(;this.waiting.length&&this.shown.size<this._showCount;){let e=this.waiting.shift();this.shown.add(e.id),this.manager._showEntry(e)}}clear(){this.waiting.length=0}},ge=`autospark-notifications`;function _e(e){return{...e.record}}function S(e,t){if(typeof localStorage<`u`)try{localStorage.setItem(ge,JSON.stringify(e))}catch(e){t(`engine.notifications: local 持久化写入失败，已忽略: ${e?.message??e}`)}}function ve(e){if(typeof localStorage>`u`)return[];try{let t=localStorage.getItem(ge);if(!t)return[];let n=JSON.parse(t);return Array.isArray(n)?n.filter(e=>e&&typeof e==`object`&&!Array.isArray(e)):(e(`engine.notifications: local 持久化数据格式异常（非数组），已忽略`),[])}catch(t){return e(`engine.notifications: local 持久化读取失败，已忽略: ${t?.message??t}`),[]}}var ye=class{constructor(e,t){this.getFetchOptions=e,this.warn=t,this.timer=null,this.pending=null}schedule(e){this.pending=e,this.timer!=null&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null;let e=this.pending;this.pending=null,e&&this.flush(e)},500)}async flush(e,t=!1){this.timer!=null&&(clearTimeout(this.timer),this.timer=null,this.pending=null);let n=this.getFetchOptions();if(typeof fetch<`u`&&n?.url)try{let{url:r,...i}=n,a=await fetch(r,{...i,method:`POST`,headers:{"Content-Type":`application/json`,...i.headers},body:JSON.stringify(e),keepalive:t});a.ok||this.warn(`engine.notifications: remote 持久化失败（HTTP ${a.status}），已忽略`)}catch(e){this.warn(`engine.notifications: remote 持久化失败，已忽略: ${e?.message??e}`)}}cancel(){this.timer!=null&&(clearTimeout(this.timer),this.timer=null),this.pending=null}},be=class{constructor(e){this.manager=e,this.remote=new ye(()=>this.manager._stateRef?.options.fetchOptions??null,e=>this.manager.engine.logger.warn(e))}collect(){let e=[],t=[];for(let n of Array.from(this.manager.keys())){let r=this.manager._entryOf(n);if(!r)continue;let i=_e(r);r.props.persist===o.LOCAL?e.push(i):r.props.persist===o.REMOTE&&t.push(i)}return{locals:e,remotes:t}}schedule(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();S(e,e=>this.manager.engine.logger.warn(e)),this.remote.schedule(t)}flushNow(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();S(e,e=>this.manager.engine.logger.warn(e)),this.remote.flush(t,!0)}async save(){let{locals:e,remotes:t}=this.collect();S(e,e=>this.manager.engine.logger.warn(e)),await this.remote.flush(t)}async load(e){let t=this.manager._stateRef?.options.fetchOptions??null,n=e??t?.url;if(!n||typeof fetch>`u`)return this.manager.engine.logger.warn(`engine.notifications: load 缺少 url（参数与 options.notifications.fetchOptions.url 均未配置），已跳过`),[];try{let e=t?{...t}:{};delete e.url;let r=await fetch(n,e);if(!r.ok)return this.manager.engine.logger.warn(`engine.notifications: load 失败（HTTP ${r.status}），已忽略`),[];let i=await r.json();if(!Array.isArray(i))return this.manager.engine.logger.warn(`engine.notifications: load 响应体格式异常（非数组），已忽略`),[];let a=this.manager.records.restoreRecords(i,`remote`);return this.schedule(),a}catch(e){return this.manager.engine.logger.warn(`engine.notifications: load 失败，已忽略: ${e?.message??e}`),[]}}cancelPending(){this.remote.cancel()}};function xe(e){return _(`markRaw`)(e)}function Se(){return _(`SCOPES_KEY`)}function Ce(e){for(let t of Array.from(e.attributes)){let e=t.name;if(e===`x-define:inherit`||e.startsWith(`x-define:inherit.`)||e===`x-define:extends`||e.startsWith(`x-define:extends.`))return(t.value??``).trim()}return null}var we=[`width`,`height`,`minWidth`,`maxWidth`,`minHeight`];function Te(t,n){let r=t.engine,i=t=>{let n=r._resolveGlobalComponent(t);if(!n||t!==`autospark.notifications.shell`&&Ce(n)===null&&(n.setAttribute(`x-define:inherit`,e),r._globalComponentDefs.delete(t),n=r._resolveGlobalComponent(t),!n))return null;let i=r.getComponentDef(n)??r.getGlobalComponentDef(t)??null;return{name:t,snapshot:n,def:i}},a=t._options.types?.[n]?.render?.trim()??``;if(a!==``){let e=i(a);if(e)return e}return i(`autospark.notifications.${n}`)??i(`autospark.notifications.shell`)??null}function Ee(e,t){if(!t)return null;let n=t;for(;n;){let t=e.engine.findScopeByEl(n);if(t)return t;n=n.parentElement}return null}function C(e,t){let n={};for(let[e,r]of Object.entries(t.props))typeof r!=`function`&&(typeof HTMLElement<`u`&&r instanceof HTMLElement||e!==`progress`&&e!==`state`&&e!==`paused`&&e!==`completed`&&(n[e]=r));let r=t.record;return n.id=r.id,n.type=r.type,n.read=r.read,n.title=r.title,n.description=r.description,n.level=r.level,n.owner=r.owner,n.status=r.status,n.result=r.result,n.link=r.link,n.icon=t.icon,n.actions=t.actions,n.levelName=a(r.level??0),(t.type===`task`||t.props.canCancel===!0)&&(n._abort=t.instance?.data?._abort??xe(new AbortController)),t.type===`task`&&(n.state=t.instance?.data?.state??(t.props.canStart===!0?`pending`:`running`)),n}function w(e,t){for(let n of we){let r=t[n],i=n.replace(/[A-Z]/g,e=>`-`+e.toLowerCase());r==null||r===``||r===`auto`?e.style.removeProperty(i):e.style.setProperty(i,m(r))}}function De(e,t){let n=fe(e.engine,t.props.pos,t.props.offset);if(!n)return!1;let r=e.engine,i=Ee(e,t.anchor),a=Te(e,t.type),o=C(e,t);if(!a)return r.logger.warn(`engine.notifications: type "${t.type}" 无可用渲染组件（render 链与 shell 兜底均未命中），已跳过装配`),!1;let s=r.compiler.instantiateDetachedComponent(a.snapshot.cloneNode(!0),i,a.def,o),c=s.el;t.scope=s.scope,t.instance=new(_(`ComponentInstance`))(s.scope),ke(t.instance,a.def),t.el=c,c.style.display=`none`,c.setAttribute(x,t.props.pos),t.props.className&&(c.classList.add(...String(t.props.className).trim().split(/\s+/)),t.appliedClassName=String(t.props.className)),t.props.styles&&(c.style.cssText=String(t.props.styles),t.appliedStyles=String(t.props.styles)),w(c,t.props),t.clickHandler=n=>e._onCardClick(t,n),t.enterHandler=()=>e._pauseTimer(t),t.leaveHandler=()=>e._resumeTimer(t),c.addEventListener(`click`,t.clickHandler),c.addEventListener(`mouseenter`,t.enterHandler),c.addEventListener(`mouseleave`,t.leaveHandler),n.appendChild(c),t.leave=v(t.props.animate).leave,Oe(e,t);let l=t.props.progress;return l!=null&&(t.instance?.data.progress??0)===0&&t.instance&&t.instance.methods.progress?.(Number(l)),!0}function Oe(e,t){let n=t.instance?.scope;if(!n)return;let r=e.engine,i=`${Se()}.${n.id}`,a=()=>t.instance?.data,o=a()?.holdOpen,s=r.store.watch(`${i}.holdOpen`,()=>{let n=a()?.holdOpen;n!==o&&(o=n,n===!0?e._clearTimer(t):t.state===`shown`&&e._startTimer(t))});t.controlOffs.push(()=>s.off());for(let n of[`progress`,`state`]){let o=a()?.[n],s=r.store.watch(`${i}.${n}`,()=>{let r=a()?.[n];r!==o&&(o=r,e._emit(`update`,t))});t.controlOffs.push(()=>s.off())}}function ke(e,t){let n=new Set([`el`,`name`,`data`,`props`,`globalState`,`methods`,`super`,`scope`,`then`]);for(let t of[`id`,`type`,`read`,`closed`,`status`,`result`,`visible`,`remaining`])Object.defineProperty(e,t,{get:()=>e.data[t],configurable:!0});Object.defineProperty(e,"abortSignal",{get:()=>e.data?._abort?.signal,configurable:!0});let r=t?.setup?.methods;if(!r)return;let i=new Set(n);i.add(`id`),i.add(`type`),i.add(`read`),i.add(`closed`),i.add(`status`),i.add(`result`),i.add(`visible`),i.add(`remaining`),i.add(`abortSignal`);for(let t of Object.keys(r))i.has(t)||Object.defineProperty(e,t,{get:function(){return e.methods[t]},configurable:!0})}function Ae(e,t){let n=t.el;n&&(t.clickHandler&&n.removeEventListener(`click`,t.clickHandler),t.enterHandler&&n.removeEventListener(`mouseenter`,t.enterHandler),t.leaveHandler&&n.removeEventListener(`mouseleave`,t.leaveHandler),n.remove());for(let e of t.controlOffs.splice(0))try{e()}catch{}let r=t.instance;t.el=null,t.instance=null;let i=t.scope;t.scope=null,i&&i.destroy(),r&&je(e,r)}function je(e,t){let n=t=>e.engine.logger.warn(`engine.notifications: 组件实例已销毁（记录已 remove），${t}() 无效（ADR-0083 死会话语义沿用）`);Object.defineProperty(t,"closed",{get:()=>!0,configurable:!0}),Object.defineProperty(t,"visible",{get:()=>!1,configurable:!0});for(let e of Object.getOwnPropertyNames(t)){let r=Object.getOwnPropertyDescriptor(t,e);r?.get&&r.get.name===`flattenMethod`&&Object.defineProperty(t,e,{get(){return n(e),()=>{}},configurable:!0})}}var Me=new Set([`showCount`,`maxLen`,`fetchOptions`,`icons`,`shell`,`shallow`,`types`]);function Ne(e,t){let{opts:n,frozen:r,typeDefaults:i,warn:a}=t,o=String(e.type??n.type??`toast`),s=n.types?.[o];if(s)for(let e of Object.keys(s))Me.has(e)&&a(`engine.notifications: types.${o} 不允许管理器级键 "${e}"，已忽略`);let c={...d},l=i?.[o];l&&Object.assign(c,l);for(let e of f)e!==`id`&&e in n&&(c[e]=n[e]),e!==`id`&&(e===`anchor`||e===`actions`)&&r[e]!==void 0&&(c[e]=r[e]),e!==`id`&&s&&e in s&&(c[e]=s[e]);return Object.assign(c,e),{merged:c,type:o}}function Pe(e,t){let r=i(e.level);r==null?(t(`engine.notifications: 未知 level "${e.level}"（0~4 或 none/info/success/warn/error，ADR-0079），已回退 ${n.NONE}`),e.level=n.NONE):e.level=r}function T(e,t){s.has(e.pos)||(t(`engine.notifications: 未知 pos "${e.pos}"，已回退 "${d.pos}"`),e.pos=d.pos)}function E(e,t){e.persist!=null&&![0,1,2,3].includes(e.persist)&&(t(`engine.notifications: 未知 persist "${e.persist}"（0|1|2|3，ADR-0077），已回退 ${o.NONE}`),e.persist=o.NONE)}function D(e){return String(e??``).replace(/[/]/g,`-`).replace(/\*/g,`-`)}function O(e,t,n){return`notifications/${D(e)}/${D(t)}/${n}`}function Fe(e,n){let r=t(n),i=e._resolveGlobalComponent(r);if(i)return(e.getComponentDef(i)??e.getGlobalComponentDef(r)??null)?.defaults}var Ie=class extends Map{_entryOf(e){return this._entries.get(e)}get _stateRef(){return this._state}get _options(){return this._state.options}constructor(e){super(),this.PERSIST=o,this._entries=new Map,this._state=null,this._frozen={},this._autoId=0,this._queues=new Map,this._typeDefaultsCache=new Map,this._typeDefaults=new Proxy({},{get:(e,t)=>{if(typeof t==`string`)return this._typeDefaultsCache.has(t)||this._typeDefaultsCache.set(t,Fe(this.engine,t)),this._typeDefaultsCache.get(t)}}),this.engine=e;let t=e.options.notifications;this.enabled=t!==!1;let n=t===!1||t==null?{}:t;if(this._frozen={anchor:n.anchor,actions:n.actions},this.records=new me(this),this.storage=new be(this),!this.enabled)return;let r={};for(let e of Object.keys(n))e!==`anchor`&&e!==`actions`&&(r[e]=n[e]);for(let e of Object.keys(d))r[e]===void 0&&(r[e]=d[e]);let i=Number(r.shallow)===0?0:1;e.store.state[h]={items:ne([],i),options:r},this._state=e.store.state[h],this.records.restoreRecords(ve(e=>this.engine.logger.warn(e)),`local`)}add(e,t){if(!this.enabled)return this.engine.logger.warn(`engine.notifications: 通知特性已通过 options.notifications: false 关闭，调用被忽略`),null;if(typeof e==`function`)return this._addAsync(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: add(..., ${typeof t==`string`?`"${t}"`:`props`}) 第二参仅对 factory 形态生效（对象形态请用 type 字段），已忽略`);let n=p(e,e=>this.engine.logger.warn(e));return n?this._enqueueProps(n):null}_addAsync(e,t){let n=typeof t==`object`&&t?t:{},r=t==null?`toast`:typeof t==`string`?String(t).trim()||`toast`:String(n.type??``).trim()||`toast`,{merged:i,type:a}=this._mergeProps({...n,type:r});T(i,e=>this.engine.logger.warn(e)),this._settleLevel(i),E(i,e=>this.engine.logger.warn(e));let o=i.id!=null&&i.id!==``?String(i.id):`notification-${++this._autoId}`;i.id=o,i.type=a;let s=this.records.createEntry(i,o,a);if(!this._materialize(s))return null;let c=s.instance;return(async()=>{try{let t=await e(c);if(!this._entries.has(o)||s.state===`closed`)return;if(t==null){this._destroyEntry(s);return}let n=p(t,e=>this.engine.logger.warn(e));if(!n||!String(n.title??``).trim()){this.engine.logger.warn(`engine.notifications: factory 结果缺少 title（空通知），已销毁`),this._destroyEntry(s);return}n.type!=null&&String(n.type)!==r&&(this.engine.logger.warn(`engine.notifications: factory 声明 type "${r}" 与 return props type "${n.type}" 不一致，以声明为准（类型不可变）`),n.type=r);let i=this._mergeProps({...n,id:o,type:r}).merged;this._applyEntryConfig(s,i),s.state=`queued`,this._emit(`add`,s),this._displayEntry(s),this.storage.schedule()}catch(e){this.engine.logger.warn(`engine.notifications: factory 执行失败，已销毁: ${e?.message??e}`),this._destroyEntry(s)}})(),c}_materialize(e){return De(this,e)?(this._bindChoice(e),this._entries.set(e.id,e),super.set(e.id,e.instance),this.records.mirrorAdd(e),this.records.evictOverflow(e),!0):!1}_bindChoice(e){if(e.type!==`confirm`||!e.instance)return;let t=new Promise(t=>{e.confirmResolve=t});Object.defineProperty(e.instance,"then",{value:t.then.bind(t),configurable:!0})}_mergeCtx(){return{opts:this.enabled?this._options:{},frozen:this._frozen,typeDefaults:this._typeDefaults,warn:e=>this.engine.logger.warn(e)}}_mergeProps(e){return Ne(e,this._mergeCtx())}_settleLevel(e){Pe(e,e=>this.engine.logger.warn(e))}_enqueueProps(e){if(!String(e.title??``).trim())return this.engine.logger.warn(`engine.notifications: title 为空，调用被忽略`),null;let{merged:t,type:n}=this._mergeProps(e);T(t,e=>this.engine.logger.warn(e)),this._settleLevel(t),E(t,e=>this.engine.logger.warn(e));let r=t.id!=null&&t.id!==``?String(t.id):`notification-${++this._autoId}`;t.id=r,t.type=n;let i=this._entries.get(r);if(i){if(i.state===`shown`||i.state===`queued`)return this._updateInPlace(i,e),this.get(r)??null;let n=this._mergeProps({...t,id:r}).merged;return this._applyEntryConfig(i,n),i.state=`queued`,this._displayEntry(i),this.storage.schedule(),this.get(r)??null}let a=this.records.createEntry(t,r,n);return this._materialize(a)?(this._emit(`add`,a),this._displayEntry(a),this.storage.schedule(),a.instance):null}get _showCount(){let e=this._state?.options.showCount??d.showCount;return typeof e==`number`&&e>0?Math.floor(e):d.showCount}get _maxLen(){let e=this._state?.options.maxLen;return typeof e==`number`&&e>0?Math.floor(e):0}_resolveIcon(e,t){if(t)return t;if(e===0)return``;let n=a(e);return this._options.icons?.[n]??c[n]??n}_resolveAnchor(e){return e==null?null:e instanceof HTMLElement?e:typeof e==`string`?(typeof document<`u`?document.querySelector(e):null)||(this.engine.logger.warn(`engine.notifications: anchor 选择器 "${e}" 未命中，按无 anchor 处理`),null):null}_resolveActions(e,t){let n=[],r=(e,t)=>{let n=u(e?.type);return e?.type!==void 0&&n===void 0&&this.engine.logger.warn(`engine.notifications: action "${t}" 的 type 须为 ${l.join(`/`)}，已忽略（按钮色回退跟随 level）`),n};for(let i of e??[])if(typeof i==`string`){let e=this._resolveActionByName(i,t);if(!e){this.engine.logger.warn(`engine.notifications: action "${i}" 未命中（全局表${t?`与 anchor scope 链`:``}），按钮已剪枝`);continue}n.push({name:i,title:e.title??i,handle:e.handle,hide:e.hide!==!1,hasValue:!1,value:void 0,type:r(e,i)})}else if(i&&typeof i==`object`){let e=`value`in i;n.push({name:String(i.id??i.title??`action`),title:i.title??`action`,handle:typeof i.handle==`function`?i.handle:null,hide:i.hide!==!1,hasValue:e,value:i.value,type:r(i,String(i.title??`action`))})}else this.engine.logger.warn(`engine.notifications: 非法 action 项，已剪枝`);return n}_resolveActionByName(e,t){if(t){let n=t;for(;n;){let t=this.engine.findScopeByEl(n)?.getAction(e);if(t)return t;n=n.parentElement}}return this.engine.actions[e]}_updateInPlace(e,t){`type`in t&&String(t.type)!==e.type&&this.engine.logger.warn(`engine.notifications: 同 id 更新不支持变更 type，已忽略`);let n={...e.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(n[e]=t[e]);T(n,e=>this.engine.logger.warn(e)),this._applyEntryConfig(e,n),e.state===`shown`&&this._startTimer(e),this._emit(`update`,e),this.storage.schedule()}_applyEntryConfig(e,t){let n=e.appliedClassName,r=e.appliedStyles;this._settleLevel(t),e.props=t;for(let n of[`title`,`description`,`owner`,`status`,`result`,`link`,`read`])n in t&&(e.record[n]=t[n]);e.record.level=t.level,this.records.touch(e),e.icon=this._resolveIcon(e.record.level??0,t.icon),e.actions=this._resolveActions(t.actions,e.anchor);let i=C(this,e);e.instance&&Object.assign(e.instance.data,i),t.progress!=null&&e.instance&&e.instance.methods.progress?.(Number(t.progress));let a=t.className?String(t.className).trim():``,o=t.styles?String(t.styles):``;e.el&&(n&&e.el.classList.remove(...n.split(/\s+/)),a&&e.el.classList.add(...a.split(/\s+/)),o!==r&&(e.el.style.cssText=o),w(e.el,t)),e.appliedClassName=a,e.appliedStyles=o,this.records.mirrorReplace(e)}update(e,t){let n=this._entries.get(e);if(!n||!this._entries.has(e)){this.engine.logger.warn(`engine.notifications: update("${e}") 未命中存活记录，已忽略`);return}p(t,e=>this.engine.logger.warn(e)),`type`in t&&String(t.type)!==n.type&&this.engine.logger.warn(`engine.notifications: update 不支持修改 type，已忽略`);let r=n.props.read===!0,i=n.props.status,a={...n.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(a[e]=t[e]);T(a,e=>this.engine.logger.warn(e)),this._applyEntryConfig(n,a),this._emit(`update`,n),!r&&n.props.read===!0&&this._emit(`read`,n),n.props.status!==i&&this._emit(`status`,n),this.storage.schedule()}_setRead(e){e.props.read!==!0&&(e.props.read=!0,e.record.read=!0,this.records.touch(e),e.instance&&(e.instance.data.read=!0),this.records.mirrorReplace(e),this._emit(`read`,e),this.storage.schedule())}markRead(e){let t=this._entries.get(e);t?this._setRead(t):this.engine.logger.warn(`engine.notifications: markRead("${e}") 未命中存活记录，已忽略`)}markAllRead(e){for(let t of Array.from(this._entries.values()))t.props.read!==!0&&(e==null||t.type===e)&&this._setRead(t)}_queueOf(e){let t=this._queues.get(e);return t||(t=new he(this,e),this._queues.set(e,t)),t}_displayEntry(e){this._queueOf(e.props.pos).offer(e)}_showEntry(e){e.state!==`shown`&&(e.el&&(e.el.style.display=``),e.state=`shown`,e.instance&&(e.instance.data.visible=!0,e.instance.data.closed=!1),e.el&&this.engine.animate.enter(e.el,v(e.props.animate).enter),this._startTimer(e),this._emit(`show`,e),this._emitTaskAutoStart(e))}_dequeue(e){this._queues.get(e.props.pos)?.remove(e)}_flushQueue(e){this._queueOf(e).flush()}show(e,t){if(typeof e!=`string`)return this.add(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: show("${e}", ...) 第二参仅对 factory 形态生效，已忽略`);let n=this._entries.get(e);return!n||n.state===`closed`?(this.engine.logger.warn(`engine.notifications: show("${e}") 未命中存活记录（persist=0 的已关通知已销毁）`),null):(n.state===`shown`||n.state===`queued`||(n.state=`queued`,this._displayEntry(n)),this.get(e)??null)}hide(e){let t=this._entries.get(e);t&&t.state!==`closed`&&t.state!==`hidden`&&this._dismiss(t,!0)}toast(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`toast`}},`toast`);let t={...typeof e==`string`?{title:e}:e,type:`toast`};return this.show(t)}confirm(e,t){let n=typeof e==`string`?{title:e}:{...e},r=t?.yes??n.yes,i=t?.no??n.no;return delete n.yes,delete n.no,this.show({...n,type:`confirm`,delayClose:n.delayClose??0,actions:(n.actions?.length?n.actions:void 0)??[{title:r??`确定`,value:!0,type:`primary`},{title:i??`取消`,value:!1,type:`plain`}]})}task(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`task`}},`task`);let t={...typeof e==`string`?{title:e}:e,type:`task`};return this.show(t)}_dismiss(e,t){if(e.state===`closed`||e.state===`hidden`)return;e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.instance&&(e.instance.data.visible=!1),this._emit(`hide`,e);let n=()=>this._settleClose(e),r=t?e.leave:null,i=e.el;r&&i&&i.style.display!==`none`?(i.style.boxSizing=`border-box`,i.style.height=`${i.offsetHeight}px`,i.style.overflow=`hidden`,this.engine.animate.leave(i,r,n)?(i.style.transitionProperty=`transform, opacity, height, padding-top, padding-bottom, margin-bottom, border-top-width, border-bottom-width`,i.style.height=`0px`,i.style.paddingTop=`0px`,i.style.paddingBottom=`0px`,i.style.marginBottom=`-10px`,i.style.borderTopWidth=`0px`,i.style.borderBottomWidth=`0px`):n()):n()}_settleClose(e){let t=Number(e.props.persist??o.NONE);this._queueOf(e.props.pos).releaseShown(e.id),t>=o.SESSION&&t<=o.REMOTE?(e.state=`hidden`,e.el&&(e.el.style.display=`none`),e.instance&&(e.instance.data.closed=!0,e.instance.data.visible=!1)):this._destroyEntry(e),this._flushQueue(e.props.pos),this.storage.schedule()}_destroyEntry(e){e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.confirmResolve=null,Ae(this,e),this._entries.delete(e.id),super.delete(e.id),this.records.mirrorRemove(e.id),this._queueOf(e.props.pos).releaseShown(e.id)}delete(e){let t=this._entries.get(e);return t?((t.state===`shown`||t.state===`queued`)&&this._emit(`hide`,t),this._destroyEntry(t),this._flushQueue(t.props.pos),this.storage.flushNow(),!0):!1}clear(e=!0){for(let e of this._queues.values())e.clear();for(let t of Array.from(this._entries.values()))t.state===`shown`||t.state===`queued`?this._dismiss(t,e):this._destroyEntry(t);this._state&&this._state.items.splice(0),this.storage.flushNow()}dispose(){this.storage.flushNow();for(let e of this._queues.values())e.clear();for(let e of Array.from(this._entries.values()))(e.state===`shown`||e.state===`queued`||e.state===`hidden`)&&this._destroyEntry(e);pe(this.engine),this._state&&this._state.items.splice(0)}async load(e){return this.storage.load(e)}async save(){await this.storage.save()}_onCardClick(e,t){this._setRead(e);let n=t.target,r=n?.closest?.(`.autospark-notification-action`);if(r){let t=Number(r.getAttribute(`data-notification-action`)),n=e.actions[Number.isInteger(t)?t:-1];n&&this._fireAction(e,n)}else if(n?.closest?.(`.autospark-notification-close`)){let t=e.instance?.methods??{},n=typeof t.close==`function`?t.close:typeof t.cancel==`function`?t.cancel:null;typeof n==`function`?n():this._dismiss(e,!0)}}_fireAction(e,t){t.hasValue&&(e.props.result=t.value,e.record.result=t.value,this.records.touch(e),e.instance&&(e.instance.data.result=t.value),this.records.mirrorReplace(e)),this._emitAction(e,t),e.confirmResolve&&=(e.confirmResolve(t.hasValue?t.value:void 0),null),t.handle?.(),this.storage.schedule(),t.hide&&this._dismiss(e,!0)}_fireConfirmChoice(e,t){let n=e.actions.find(e=>e.hasValue&&e.value===t);n?this._fireAction(e,n):this.engine.logger.warn(`engine.notifications: type='confirm' 会话缺少 value=${t} 的按钮（actions 已被自定义），选择无效（ADR-0077）`)}respond(e,t){let n=this._entries.get(e);n?this._fireConfirmChoice(n,t):this.engine.logger.warn(`engine.notifications: respond("${e}") 未命中存活记录，已忽略`)}_emitControlAction(e,t){let n=this._entries.get(e);if(!n)return;let r=O(n.type,n.props.id,`actions/${t}`),i={notification:n.instance,el:n.el};this.engine.emit(r,i),n.el?.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0})),n.anchor&&n.anchor.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0}))}_onControlAction(e,t,n){let r=this._entries.get(e),i=O(r?.type??`task`,e,`actions/${t}`),a=this.engine.on(i,n),o=()=>a.off();return r&&r.controlOffs.push(o),o}_emitTaskAutoStart(e){if(e.type!==`task`||e.startEmitted||e.props.canStart===!0)return;let t=e.instance?.data?.state;t!==`stopped`&&t!==`completed`&&(e.startEmitted=!0,this._emitControlAction(e.props.id,`start`))}_emit(e,t){let n=O(t.type,t.props.id,e),r={notification:t.instance,el:t.el};this.engine.emit(n,r),t.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_emitAction(e,t){let n=O(e.type,e.props.id,`actions/${t.name}`),r={notification:e.instance,el:e.el,action:{title:t.title,hide:t.hide},value:t.hasValue?t.value:void 0};this.engine.emit(n,r),e.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0})),e.anchor&&e.anchor.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_startTimer(e){if(this._clearTimer(e),e.instance?.data.holdOpen===!0)return;let t=e.props.delayClose;typeof t==`number`&&t>0?(e.deadline=Date.now()+t,e.pausedRemaining=null,e.instance&&(e.instance.data.remaining=t),e.tickTimer=setInterval(()=>{e.deadline!=null&&e.instance&&(e.instance.data.remaining=Math.max(0,e.deadline-Date.now()))},1e3),e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)):(e.deadline=null,e.instance&&(e.instance.data.remaining=-1))}_pauseTimer(e){e.timer!=null&&e.deadline!=null&&(clearTimeout(e.timer),e.timer=null,e.pausedRemaining=Math.max(0,e.deadline-Date.now()))}_resumeTimer(e){if(e.pausedRemaining==null||e.state!==`shown`)return;let t=e.pausedRemaining;e.pausedRemaining=null,e.deadline=Date.now()+t,e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)}_clearTimer(e){e.timer!=null&&(clearTimeout(e.timer),e.timer=null),e.tickTimer!=null&&(clearInterval(e.tickTimer),e.tickTimer=null),e.pausedRemaining=null}},Le=`ready`,Re=`__AUTOSPARK_PLUGINS__`;function k(e){let t=globalThis.AutoSpark;if(typeof t?.[Le]==`function`){e(t);return}let n=globalThis,r=n[Re]??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var ze=`<div\r
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
`,Be=`<div x-define="autospark.notifications.toast" x-define:inherit="autospark.notifications.shell"></div>\r
`,Ve=`<div x-define="autospark.notifications.task" x-define:inherit="autospark.notifications.shell">\r
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
`,He=`<div x-define="autospark.notifications.confirm" x-define:inherit="autospark.notifications.shell">\r
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
`,Ue={[e]:ze,[t(`toast`)]:Be,[t(`task`)]:Ve,[t(`confirm`)]:He};function A(e){let t=e?.el;return t instanceof HTMLElement?t:null}function We(e){return{title:`提示`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type??=`toast`,n.anchor??=A(this)??void 0,e.notifications.add(n)}}}function Ge(e){return{title:`确认`,handle:function(t){let{yes:n,no:r,...i}=typeof t==`string`?{title:t}:{...t??{}};return i.anchor??=A(this)??void 0,e.notifications.show({...i,type:`confirm`,delayClose:i.delayClose??0,actions:[{title:n??`确定`,value:!0,type:`primary`},{title:r??`取消`,value:!1,type:`plain`}]})}}}function Ke(e){return{title:`任务`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type=`task`,n.anchor??=A(this)??void 0,e.notifications.show(n)}}}var qe={toast:We,confirm:Ge,task:Ke};function Je(e){let t=e.options.builtinComponents??(e.options.builtinComponents={});for(let[e,n]of Object.entries(Ue))t[e]??(t[e]=n)}function Ye(e){Je(e);let t=new Ie(e);e.notifications=t;for(let[t,n]of Object.entries(qe))t in e.actions||(e.actions[t]=n(e));e.on(`engine/destroy/before`,()=>t.dispose())}function Xe(){k(e=>{g(e),e.ready(Ye)})}Xe();var j=class extends Error{constructor(e,t,n,r){super(e),this.name=`ResourceError`,this.status=t,this.url=n,this.method=r}};function M(e={}){let{where:t,...n}=e,r={...n};return typeof t==`object`&&t?Object.assign(r,t):typeof t==`string`&&t!==``&&(r.where=t),r}var Ze={get:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`GET`,url:e,query:M(t)}:{method:`GET`,url:`${e}/${t}`},getMany:(e,t={})=>({method:`GET`,url:e,query:M(t)}),add:(e,t)=>({method:`POST`,url:e,body:t}),update:(e,t,n)=>{if(typeof n==`object`&&n)return{method:`PUT`,url:e,query:M(n),body:t};if(Array.isArray(t))return{method:`PUT`,url:e,body:t};let r=t?.id;return r==null?{method:`PUT`,url:e,body:t}:{method:`PUT`,url:`${e}/${r}`,body:t}},delete:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`DELETE`,url:e,query:M(t)}:Array.isArray(t)?{method:`DELETE`,url:e,query:{ids:t.join(`,`)}}:{method:`DELETE`,url:`${e}/${t}`}};function Qe(e){let t=[];for(let[n,r]of Object.entries(e)){if(r==null)continue;let e=Array.isArray(r)?r.join(`,`):String(r);t.push(`${encodeURIComponent(n)}=${encodeURIComponent(e)}`)}return t.join(`&`)}async function $e(e,t={}){let n=/^https?:\/\//i.test(e.url)||!t.baseUrl?e.url:`${String(t.baseUrl).replace(/\/+$/,``)}/${e.url.replace(/^\/+/,``)}`,r=e.query?Qe(e.query):``,i=r?`${n}${n.includes(`?`)?`&`:`?`}${r}`:n,a={...t.headers},o;e.body!==void 0&&(o=JSON.stringify(e.body),Object.keys(a).some(e=>e.toLowerCase()===`content-type`)||(a[`Content-Type`]=`application/json`));let s=t.fetch??globalThis.fetch,c;try{c=await s(i,{method:e.method,headers:a,body:o})}catch(t){throw new j(`资源请求网络错误: ${e.method} ${i} (${t?.message??t})`,0,i,e.method)}if(!c.ok)throw new j(`资源请求失败: ${e.method} ${i} → ${c.status} ${c.statusText}`,c.status,i,e.method);if(c.status===204)return null;let l=await c.text(),u=l===``?null:JSON.parse(l);return t.unwrap?t.unwrap(u,e):u}var et=new Set([`url`,`mapping`,`baseUrl`,`fetch`,`headers`,`unwrap`]);function tt(e){if(typeof e==`string`)return{url:e,inlineOptions:{},methods:{},inlineMapping:void 0};let t=typeof e.url==`string`?e.url:null,n={},r={},i;for(let[t,a]of Object.entries(e))t===`mapping`?a&&typeof a==`object`&&(i=a):et.has(t)?a!==void 0&&(n[t]=a):typeof a==`function`&&(r[t]=a);return{url:t,inlineOptions:n,methods:r,inlineMapping:i}}function nt(e,t,n){let r=t?.options?.resources;return{...n,...r,...e}}function rt(e,t,n){return{...Ze,...n,...e?.options?.resources?.mapping,...t}}function N(e,t,n,r={}){let{url:i,inlineOptions:a,methods:o,inlineMapping:s}=tt(t),c=rt(n,s,r.mapping),l={};for(let[t,n]of Object.entries(o))l[`${e}.${t}`]=n;if(i)for(let[t,o]of Object.entries(c))l[`${e}.${t}`]||(l[`${e}.${t}`]=function(...e){return $e(o(i,...e),nt(a,this?.engine??n,r))});else if(Object.keys(l).length===0)return l;return l}var P=class{constructor(e){this._defs=new Map,this._globalOptions={},this.engine=e}get options(){return this.engine?this.engine.options.resources??={}:this._globalOptions}add(e,t){let n=typeof e==`string`?[[e,t]]:Object.entries(e);for(let[e,t]of n){if(t===void 0)continue;(this._defs.has(e)||this._hasAction(`${e}.`))&&console.warn(`[autospark] resources.add: 资源 "${e}" 重复注册，后者覆盖（ADR-0011）`),this._defs.set(e,t);let n=N(e,t,this.engine,this._globalOptions);Object.keys(n).length===0?console.warn(`[autospark] resources.add: 资源 "${e}" 定义为空（无 url 也无方法），已跳过`):this._write(n)}}get(e){return this._defs.get(e)}has(e){return this._defs.has(e)||this._hasAction(`${e}.`)}_write(e){let t=this._actionTable();if(!t)console.warn(`[autospark] resources.add: AutoSpark 命名空间不可用（插件未自举？），全局注册未生效`);else for(let[n,r]of Object.entries(e))t[n]=r}_actionTable(){if(this.engine)return this.engine.actions;let e=te();return e&&typeof e==`function`?e.actions:null}_hasAction(e){let t=this._actionTable();return t?Object.keys(t).some(t=>t.startsWith(e)):!1}},it=null;function F(){return it??=new P}var at=(e,t,n)=>{let r=e.textContent?.trim();if(!r)return;let i;try{let e=Function(`return (${r})`)();if(!e||typeof e!=`object`||Array.isArray(e)){n.logger.error(`<script type="autospark/resources"> 内容须为对象字面量`);return}i=e}catch(e){n.logger.error(`<script type="autospark/resources"> 解析失败: ${e?.message??e}`);return}let a=F().options,o=e.hasAttribute(`global`);for(let[e,r]of Object.entries(i)){let i=N(e,r,n,a);if(Object.keys(i).length===0)n.logger.warn(`资源 "${e}" 定义为空（无 url 也无方法），已跳过（ADR-0011）`);else if(o)for(let[e,t]of Object.entries(i))n.actions[e]=t;else t?n.actionsManager.registerScoped(t,i):n.logger.warn(`资源 "${e}" 局部声明无祖先 scope（顶层游离）——加 global 属性声明 engine 级，或移入任意容器元素内`)}};function ot(){return{name:`resource`,created(){let e=(this.attr??``).trim();if(!e){this.warn(`x-resource: 缺属性参数（形态 x-resource:<资源名>="<url>"），本声明已忽略`);return}let t=String(this.value??``).trim();if(!t){this.warn(`x-resource:${e}: 缺 url 值，本声明已忽略`);return}let n=N(e,t,this.engine,F().options);Object.keys(n).length===0?this.warn(`x-resource:${e}: 资源展开为空（映射表不可用？），本声明已忽略`):this.engine.actionsManager.registerScoped(this.binding,n)}}}function st(){k(e=>{g(e),e.resources||=F(),e.scriptType(`autospark/resources`,at),e.directive(ot()),e.ready(e=>{e.resources=new P(e)})})}st();var I=[`hover`,`always`,`click`],L=`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`,R=`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`,ct=`var(--auto-danger-color, var(--autospark-ripple-badge-color, #ef4444))`,lt=`var(--auto-danger-color, var(--autospark-spin-badge-color, #ef4444))`,ut=2147483647,z=3e3;function B(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function dt(e,t,n){let r=B(e,`speed`,t,n)??3e3;return r<=0?(t(`${n}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${z}`),z):r}function ft(e,t,n){let r=new Set;e?.trigger!==void 0&&(I.includes(e.trigger)?r.add(e.trigger):t(`${n}: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let i of I){let a=e?.[i];a===!0?r.add(i):a!==void 0&&a!==!1&&t(`${n}: ${i} 开关须为布尔值，已忽略`)}return I.find(e=>r.has(e))??`always`}function pt(e,t,n,r){let i=new Set;if(!e)return i;for(let a of t){let t=e[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return i}function mt(e,t,n,r,i){if(e)for(let a of t){let t=e[a];t!==void 0&&t!==!1&&r(`${i}: ${a} 是 ${n} 的形态键，已忽略`)}}function ht(e,t,n){let r=e?.badge;return r===void 0||r===!1?0:r===!0?8:typeof r==`number`&&Number.isFinite(r)&&r>0?r:(t(`${n}: badge 须为 true 或正数字（直径 px），已忽略`),0)}function gt(e,t,n,r,i){if(e!==void 0){if(typeof e==`string`&&e.trim()!==``)return e;r(`${i}: color 须为非空字符串，已回退默认色`)}return n>0?t.badgeColor:t.color}function _t(){return`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`}function vt(e){return`position:absolute;top:${-e/2}px;right:${-e/2}px;width:${e}px;height:${e}px;border-radius:50%;pointer-events:none;display:block;z-index:${ut};`}function yt(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}var bt=class{static{this.probe=yt}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??yt)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{core:a,halo:o}=t.animations(this.config),s=e=>Math.round(e*10)/10,c=(e,t)=>{e.style.left=`${s(n-i)}px`,e.style.top=`${s(r-i)}px`,e.style.width=`${s(i*2)}px`,e.style.height=`${s(i*2)}px`,e.style.animation=`none`,e.offsetWidth,e.style.animation=t};c(this.insideCarrier.core,a),c(this.insideCarrier.halo,o)}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.core.style.animation=``,this.insideCarrier.halo.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}},V=new WeakMap;function xt(e,t){function n(){if(!this.el)return;let e=new bt(t,this.engine,this.info);e.el=this.el,V.set(this,e),e.mounted()}function r(){let e=V.get(this);V.delete(this),e?.unmounted()}function i(e){V.get(this)?.attrChanged(e)}return{name:e,kind:1,priority:0,mounted:n,unmounted:r,attrChanged:i}}function St(e){k(t=>{g(t),t.directive(e)})}var Ct=[`glow`,`ring`,`echo`],wt=[`ring`,`glow`,`echo`],Tt=[`rotate`,`beam`,`chase`],Et={type:`echo`,trigger:`always`,inside:!1,badge:0,color:L,size:12,speed:3e3,gap:0},H=`x-ripple`,U=`x-ripple-on`,W=`x-ripple-echo`,Dt=`x-ripple-layer`,G=`x-ripple-badge`,Ot=`x-ripple-inside`,kt=`x-ripple-inside-clip`,At=`x-ripple-inside-core`,jt=`x-ripple-inside-halo`,Mt=600,Nt=2,Pt=.3,Ft=.5,It=!1,K=new Map,q=null;function Lt(){if(It||typeof document>`u`)return;It=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-ripple`,``),e.textContent=`
:where(.${H}) { position: relative; }
.${H} {
  --x-ripple-color: ${L};
  --x-ripple-size: 12px;
  --x-ripple-duration: 3000ms;
  --x-ripple-anim: x-ripple-echo-3000-0;
  --x-ripple-echo-delay: -1500ms;
  --x-ripple-echo-size: 7.2px;
  --x-ripple-badge-size: 8px;
}
.${H}.${U}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
}
.${H}.${U}.${W}::before {
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
.${H}.${G}.${U}::after {
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
.${H}.${G}.${U}.${W}::before {
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
  .${H}.${U}::after,
  .${H}.${U}.${W}::before { animation: none; }
  /* inside 芯/环动画走内联 style——类规则 !important 压过内联（可访问性底线同家族） */
  .${At},
  .${jt} { animation: none !important; }
}`,document.head.appendChild(e)}function Rt(e){let t=`${e.type}|${e.speed}|${e.gap}`,n=K.get(t);if(n)return n;let r=`x-ripple-${e.type}-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=i>0?Math.round(e.speed/i*100):100,o;return o=e.type===`glow`?`
  0% { box-shadow: 0 0 0 0 transparent; }
  ${Math.round(a/2)}% { box-shadow: 0 0 var(--x-ripple-size) 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`:`
  0% { box-shadow: 0 0 0 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }`,q||(q=document.createElement(`style`),q.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(q)),q.textContent+=`\n@keyframes ${r} {${o}\n}`,K.set(t,r),r}function zt(e,t){let n=`inside-${t}|${e.speed}|${e.gap}`,r=K.get(n);if(r)return r;let i=`x-ripple-inside-${t}-${e.speed}-${e.gap}`,a=e.speed+e.gap,o=a>0?Math.round(e.speed/a*100):100,s=`
  0% { transform: scale(0); opacity: var(--x-ripple-${t===`core`?`core`:`halo`}-alpha, ${t===`core`?Pt:Ft}); }
  ${o}% { transform: scale(1); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }`;return q||(q=document.createElement(`style`),q.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(q)),q.textContent+=`\n@keyframes ${i} {${s}\n}`,K.set(n,i),i}function Bt(e,t,n){let r=e.offsetWidth,i=e.offsetHeight,a=r/2,o=i/2;if(n){let t=e.getBoundingClientRect();a=n.clientX-t.left,o=n.clientY-t.top}let s=Math.max(a,r-a),c=Math.max(o,i-o);return{x:a,y:o,r:Math.hypot(s,c)}}function Vt(e){return e.trigger===`click`?0:-(e.speed+e.gap)/2}function Ht(e){return e.trigger===`click`?Math.round(e.size*.6*10)/10:e.size}function Ut(e,t){let n={...Et};if(!e)return n;let r=pt(e,wt,t,`x-ripple`);e.type!==void 0&&(wt.includes(e.type)?r.add(e.type):t(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let i=Ct.find(e=>r.has(e));return i&&(n.type=i),mt(e,Tt,`x-spin`,t,`x-ripple`),e.inside!==void 0&&(e.inside===!0?n.inside=!0:e.inside!==!1&&t(`x-ripple: inside 开关须为布尔值，已忽略`)),n.trigger=ft(e,t,`x-ripple`),n.badge=ht(e,t,`x-ripple`),n.inside&&n.badge>0&&(t(`x-ripple: badge 与 inside 互斥，badge 优先（inside 已忽略）`),n.inside=!1),n.color=gt(e.color,{color:L,badgeColor:ct},n.badge,t,`x-ripple`),n.size=B(e,`size`,t,`x-ripple`)??Et.size,n.speed=dt(e,t,`x-ripple`),n.gap=B(e,`gap`,t,`x-ripple`)??0,n.inside&&(r.size>0&&t(`x-ripple: inside 接管渲染，type 形态词表已忽略`),e.size!==void 0&&t(`x-ripple: inside 半径自动几何（起点到最远角），size 已忽略`),e.speed===void 0&&(n.speed=Mt)),n}var Wt={hostClass:H,activeClass:U,layerClass:Dt,ensureStyles:Lt,normalize:Ut,hostClasses:e=>[...e.badge>0?[G]:[],...e.inside?[Ot]:[]],activeClasses:e=>e.type===`echo`&&!e.inside?[W]:[],animName:e=>Rt(e),animationCss:(e,t)=>`${t} ${e.speed+e.gap}ms ease-out infinite`,period:e=>e.speed+e.gap,layerCount:e=>e.type===`echo`?2:1,layerCssText:e=>e.badge>0?`${vt(e.badge)}background:var(--x-ripple-color);`:_t(),applyLayerExtras:(e,t)=>{let n=e[1];n&&(n.style.animationDelay=`${Vt(t)}ms`,n.style.setProperty(`--x-ripple-size`,`${Ht(t)}px`))},applyVars:(e,t,n)=>{let r=e.style;r.setProperty(`--x-ripple-color`,t.color||`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`),r.setProperty(`--x-ripple-size`,`${t.size}px`),r.setProperty(`--x-ripple-duration`,`${t.speed+t.gap}ms`),r.setProperty(`--x-ripple-anim`,n),r.setProperty(`--x-ripple-echo-delay`,`${Vt(t)}ms`),r.setProperty(`--x-ripple-echo-size`,`${Ht(t)}px`),t.badge>0&&r.setProperty(`--x-ripple-badge-size`,`${t.badge}px`)},inside:{enabled:e=>e.inside,createCarrier:()=>{let e=document.createElement(`span`);e.className=kt,e.style.cssText=`position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;display:block;`;let t=document.createElement(`span`);t.className=At,t.style.cssText=`position:absolute;border-radius:50%;background:var(--x-ripple-color);pointer-events:none;display:block;`;let n=document.createElement(`span`);return n.className=jt,n.style.cssText=`position:absolute;border-radius:50%;box-sizing:border-box;border:var(--x-ripple-halo-width, ${Nt}px) solid var(--x-ripple-color);pointer-events:none;display:block;`,e.append(t,n),{clip:e,core:t,halo:n}},geometry:Bt,animations:e=>({core:`${zt(e,`core`)} ${e.speed+e.gap}ms ease-out infinite`,halo:`${zt(e,`halo`)} ${e.speed+e.gap}ms ease-out infinite`})}};function Gt(){St(xt(`ripple`,Wt))}Gt();var Kt=[`chase`,`rotate`,`beam`],qt=[`rotate`,`beam`,`chase`],Jt=[`ring`,`glow`,`echo`],Yt={type:`beam`,trigger:`always`,badge:0,color:R,size:4,speed:3e3},J=`x-spin`,Y=`x-spin-on`,Xt=`x-spin-layer`,Zt=`x-spin-badge`,X=e=>`${J}-${e}`,Z=`x-spin-angle`,Qt=!1;function Q(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`}}var $=`padding:var(--x-spin-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`;function $t(){if(Qt||typeof document>`u`)return;Qt=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spin`,``),e.textContent=`
@property --x-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${Z} { to { --x-spin-angle: 360deg; } }
:where(.${J}) { position: relative; }
.${J} {
  --x-spin-color: ${R};
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
.${J}.${Zt}.${Y}::after {
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
}`,document.head.appendChild(e)}function en(e,t){let n={...Yt};if(!e)return n;let r=pt(e,qt,t,`x-spin`);e.type!==void 0&&(qt.includes(e.type)?r.add(e.type):t(`x-spin: type 取值非法（${JSON.stringify(e.type)}），已回退 "beam"`));let i=Kt.find(e=>r.has(e));return i&&(n.type=i),mt(e,Jt,`x-ripple`,t,`x-spin`),e.gap!==void 0&&t(`x-spin: gap 仅涟漪支持（x-spin 恒转无静止段），已忽略`),n.trigger=ft(e,t,`x-spin`),n.badge=ht(e,t,`x-spin`),n.color=gt(e.color,{color:R,badgeColor:lt},n.badge,t,`x-spin`),n.size=B(e,`size`,t,`x-spin`)??Yt.size,n.speed=dt(e,t,`x-spin`),n}var tn={hostClass:J,activeClass:Y,layerClass:Xt,ensureStyles:$t,normalize:en,hostClasses:e=>[X(e.type),...e.badge>0?[Zt]:[]],activeClasses:()=>[],animName:()=>Z,animationCss:(e,t)=>`${t} ${e.speed}ms linear infinite`,period:e=>e.speed,layerCount:()=>1,layerCssText:e=>e.badge>0?`${vt(e.badge)}${$}background:${Q(e.type)};`:`${_t()}${$}background:${Q(e.type)};`,applyVars:(e,t)=>{let n=e.style;n.setProperty(`--x-spin-color`,t.color||`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`),n.setProperty(`--x-spin-size`,`${t.size}px`),n.setProperty(`--x-spin-duration`,`${t.speed}ms`),t.badge>0&&n.setProperty(`--x-spin-badge-size`,`${t.badge}px`)}};function nn(){St(xt(`spin`,tn))}nn();var rn=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层元素上：宿主级外观（底色/边框/圆角等）经 body 上的 data-* 变体属性以 :has()
    驱动，body 自身的布局变体（对齐/纵排）直接命中 body 选择器；原生 disabled 语义
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - change：checkable 模式点击翻转后冒泡，detail = { value: 新值 }——
      表单同步惯用法：外层包裹元素 @change="flag = $event.detail.value"
    - tag-click：tags 小圆钮点击冒泡，detail = { name, tag }（tag 元素上
      stopPropagation，不触发宿主 checkable 翻转）
-->
<!-- 元素名快速写法 <x-button variant="primary" label="..."> 由 index.ts 的 precompile
     DOM 变换承载（ADR-0117 元名形态对全局表惰性组件有时序缺口，见 index.ts 注释） -->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）——宿主化身根物化为同名 data-* 属性，接通 @autospark/theme 手动通道 CSS
     形成局部主题；base 缺省不写属性（继承祖先档位），theme 不在场静默无效。
     button 不得在 data() 重复声明这六键（子胜会静默击穿主题通道），裸名 size/dark 等留作
     组件自有语义；组件内部变体属性亦禁用这六个通道名（theme 在场时会被档位块意外命中） -->
<button class="asc-button" x-define="autospark.button" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            variant: "default",     // 形态：default 常规描边 | primary 实底 | secondary 次底 | dashed 虚线 | text 文本 | link 链接
            type: "primary",        // 语义色：primary | success | warning | danger | info（default 形态不消费，勾选态仍生效）
            label: "按钮",          // 兜底文案（插槽无内容时显示）
            icon: "",               // 图标名（x-icon 渲染；loading 时被 loading 图标替换）
            loading: false,         // 加载态：左图标位转圈并禁点（优先于 disabled 视觉）
            ghost: false,           // 幽灵：背景透明、内容取语义色（常用在有色背景上）
            border: false,          // 装饰性附加边框（不干预 dashed / ghost 的固有边框形态）
            block: false,           // 适配父宽度
            disabled: false,
            ripple: true,           // 点击涟漪（默认开启；页面需已加载 autospark.ripple.js，未加载时静默跳过；ADR-0010）
            autoInsertSpace: true,  // label 恰为两个汉字时自动插入空格
            shape: "default",       // default | circle（纯图标呈正圆，带文字自动呈胶囊）
            labelBelow: false,      // label 显示在图标下方（纵排）
            value: false,           // 勾选值（checkable 模式；true 时使用与 type 匹配的背景色）
            checkable: false,       // 可勾选模式：点击自动翻转 value 并冒泡 change 事件
            align: "center",        // 内容水平对齐：left | center | right
            memo: "",               // label 下方的备注（小一号、淡色）
            tags: [],               // 右侧小圆钮 {icon?,tooltip?,name?}[]；点击冒泡 tag-click 事件
            menu: false,            // 菜单项形态：占满宽、透明底、左对齐、hover 淡底
            // computed 简写（普通函数值即计算属性，x-data 惯用法）：autoInsertSpace 开启且
            // label 恰为两个汉字时中间插入空格
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label
        }),
        methods: {
            // tag 小圆钮点击：阻断冒泡（不触发宿主 checkable 翻转），冒泡 tag-click 携带 name
            onTagClick(tag, event) {
                event.stopPropagation();
                this.el.dispatchEvent(new CustomEvent("tag-click", { bubbles: true, detail: { name: tag.name, tag } }));
            }
        },
        mounted() {
            // 原生 disabled 同步（loading 即禁点）；后续 props 变化经 watch 保持同步
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法见 overlay/foldable.ts）
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };
            syncDisabled();
            this.watch("disabled", ({ value }) => { syncDisabled(); });
            this.watch("loading", ({ value }) => { syncDisabled(); });

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

            // checkable 点击翻转：组件内自动取反 + 冒泡 change（受控显示方向经 props 单向注入天然响应）
            this.el.addEventListener("click", () => {
                if (!this.data.checkable || this.el.disabled) return;
                this.data.value = !this.data.value;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }));
            });
        },
    }
  <\/script>
  <style global id="autospark-components-button">
    /* 主题化（ADR-0129）：三级回退链 var(--auto-X, var(--asc-button-X, 校准兜底值))；
         --asc-button-* 前缀保留（既有覆盖面零改名）；实底上的白字非映射（恒定设计）；
         尺寸不设组件级档位——字号/圆角/图标消费 theme 变量，内距以 --auto-padding 为基准（data-spacing 档位
         全局调节生效），data-size / data-spacing 档位切换自动跟随；暗色兜底变体见块尾 */

    /* ---------- 宿主基础：形态中转变量层（--asc-bg/ink/line 由各变体块注入，一处消费） ---------- */
    .asc-button {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #009aff)); /* 语义色中转（data-type 注入） */
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      --asc-line: transparent;
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-button-padding, 0.8rem));
      display: inline-flex;
      border: var(--auto-border-size, var(--asc-button-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-button-radius, 0.5rem));
      background: var(--asc-bg);
      color: var(--asc-ink);
      font: inherit;
      font-size: var(--auto-font-size, var(--asc-button-font-size, 0.875rem));
      line-height: 1.4;
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.8);
      cursor: pointer;
      user-select: none;
      transition: filter 0.15s ease, background-color 0.15s ease;
    }

    /* ---------- 装饰性边框开关（先于形态/ghost——只落在本就无边的形态上，Q4 语义） ---------- */
    .asc-button:has(> .asc-button-body[data-border="true"]) {
      --asc-line: var(--auto-border-color, var(--asc-button-border-color, #d9d9d9));
    }

    /* ---------- 语义色 → tone 注入（五种） ---------- */
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

    /* ---------- 形态（variant）→ 底/字/边注入 ---------- */
    /* default：常规按钮（缺省形态）——面板实色底 + 正文色、无边框（描边完全交 border prop 开关）；
         与 secondary（次级淡底）以底色层次区分；非 primary 语义色呈语义描边与文字 */
    .asc-button:has(> .asc-button-body[data-variant="default"]) {
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #ffffff));
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
    }
    .asc-button:has(> .asc-button-body[data-variant="default"][data-type="success"]),
    .asc-button:has(> .asc-button-body[data-variant="default"][data-type="warning"]),
    .asc-button:has(> .asc-button-body[data-variant="default"][data-type="danger"]),
    .asc-button:has(> .asc-button-body[data-variant="default"][data-type="info"]) {
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
    }
    /* primary：实底语义色 + 反白字 */
    .asc-button:has(> .asc-button-body[data-variant="primary"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
    }
    /* secondary：次级底 + 正文色（描边交给 border 开关） */
    .asc-button:has(> .asc-button-body[data-variant="secondary"]) {
      --asc-bg: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(245, 245, 245, 0.45)));
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
      border-radius: var(--auto-border-radius, var(--asc-button-radius, 0.375rem));
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);
      text-align: left;
    }

    /* ---------- 勾选态（checkable && value）：与 color 匹配的实底（Q5）；menu 下为左竖条 + 淡底（Q8） ---------- */
    .asc-button:has(> .asc-button-body[data-checked="true"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
      --asc-line: transparent;
    }
    .asc-button:has(> .asc-button-body[data-menu="true"][data-checked="true"]) {
      --asc-bg: var(--auto-selected-bgcolor, var(--asc-button-selected-bg, color-mix(in srgb, var(--asc-tone) 20%, transparent)));
      --asc-ink: var(--auto-selected-color, var(--asc-tone));
      box-shadow: inset 3px 0 0 var(--asc-tone);
    }

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
    .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not([disabled]),
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not([disabled]),
    .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not([disabled]),
    .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not([disabled]) {
      filter: none;
      background: var(--auto-hover-bgcolor, var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05)));
    }
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not([disabled]) {
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
    .asc-button-body[data-align="left"] { justify-content: flex-start; }
    .asc-button-body[data-align="right"] { justify-content: flex-end; }
    .asc-button-body[data-menu="true"] { justify-content: flex-start; } /* 菜单项恒左对齐 */
    .asc-button-body[data-menu="true"] .asc-button-main { align-items: flex-start; } /* label/memo 文本亦居左（与 memo 折行/短 label 对齐左缘） */
    .asc-button-body[data-label-below="true"] { flex-direction: column; gap: 0.15em; } /* label 纵排 */

    /* 图标位：尺寸随字号（x-icon 默认 1em），loading 转圈自带 SMIL 动画 */
    .asc-button-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* 主文本组：label 与 memo 恒纵排（memo 在 label 下方） */
    .asc-button-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 0;
    }
    /* 空内容不占位：纯图标用法（label 空）时出口与主文本组整体隐藏，消除 gap/行高占位；
         插槽有内容时出口非空不命中，不受影响 */
    .asc-button-label:empty { display: none; }
    .asc-button-main:has(> .asc-button-label:empty):not(:has(> .asc-button-memo)) { display: none; }
    .asc-button-body[data-align="left"] .asc-button-main { align-items: flex-start; }
    .asc-button-body[data-align="right"] .asc-button-main { align-items: flex-end; }

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
      gap: 0.25em;
      margin-left: 0.35em;
    }
    /* x-for 克隆载体盒消失，圆钮直接成为容器 flex 项 */
    .asc-button-tag-item { display: contents; }
    .asc-button-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.8em;
      height: 1.8em;
      font-size: 0.75em;
      border-radius: 50%;
      color: var(--asc-ink);
      cursor: pointer;
      /* 常态即与按钮主背景形成色差：按内容色派生淡底（实底上呈淡白、透明底上呈淡灰/淡语义色） */
      background: color-mix(in srgb, var(--asc-ink, currentColor) 12%, transparent);
      transition: background-color 0.15s ease, transform 0.1s ease;
    }
    .asc-button-tag:hover {
      background: color-mix(in srgb, var(--asc-ink, currentColor) 28%, transparent);
    }
    /* 按压反馈：底色加深 + 轻微缩放（松手经 transition 弹回） */
    .asc-button-tag:active {
      background: color-mix(in srgb, var(--asc-ink, currentColor) 45%, transparent);
      transform: scale(0.88);
    }
    .asc-button-tag-icon {
      display: inline-flex;
      width: 1em;
      height: 1em;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-button,
    [data-dark] .asc-button {
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
      --asc-bg: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(129, 129, 129, 0.45)));
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="primary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="primary"]) {
      --asc-bg: var(--auto-primary-color, var(--asc-button-primary, #56baff));
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]) {
      --asc-bg: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(129, 129, 129, 0.45)));
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
    [dark] .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not([disabled]),
    [dark] .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not([disabled]),
    [dark] .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not([disabled]),
    [dark] .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not([disabled]) {
      background: var(--auto-hover-bgcolor, var(--asc-button-hover-bg, rgba(255, 255, 255, 0.08)));
    }
  </style>
  <!-- 变体数据属性全部承载在 body（编译子树内层元素，经 :has() 驱动宿主外观——见文件头注释） -->
  <span class="asc-button-body"
    :data-variant="variant" :data-type="type" :data-ghost="ghost" :data-border="border"
    :data-shape="shape" :data-label-below="labelBelow" :data-align="align" :data-menu="menu"
    :data-block="block" :data-checked="checkable && value" :data-loading="loading">
    <!-- loading 图标替换左图标位（字面量须带引号——裸 loading 会命中 data.loading 布尔值） -->
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>
    <span class="asc-button-icon" x-if="!loading && icon" x-icon="icon"></span>
    <span class="asc-button-main">
      <!-- 默认插槽出口：未提供内容时显示 {{ displayLabel }}（组件自身状态求值） -->
      <span class="asc-button-label" x-slot>{{ displayLabel }}</span>
      <span class="asc-button-memo" x-if="memo">{{ memo }}</span>
    </span>
    <span class="asc-button-tags" x-if="tags && tags.length">
      <!-- x-for 宿主自身的绑定不被编译（ownsChildren 接管子树编译），故宿主为纯克隆载体，
             tag 圆钮与绑定（title/点击）在内层元素上，x-for locals（tag）在内层可见 -->
      <span class="asc-button-tag-item" x-for="tag of tags" :key="tag.name || tag.icon">
        <i class="asc-button-tag" :title="tag.tooltip" @click="onTagClick(tag, $event)">
          <i class="asc-button-tag-icon" x-if="tag.icon" x-icon="tag.icon"></i>
        </i>
      </span>
    </span>
  </span>
</button>
`,an=`autospark.button`;function on(e){e.components[an]=rn}sn();function sn(){k(e=>{g(e),on(e)})}};
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
