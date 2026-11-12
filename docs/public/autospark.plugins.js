(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var e=`autospark.notifications.shell`;function t(e){return`autospark.notifications.${e}`}var n={NONE:0,INFO:1,SUCCESS:2,WARN:3,ERROR:4},r=[`none`,`info`,`success`,`warn`,`error`];function i(e){if(typeof e==`number`)return Number.isInteger(e)&&e>=0&&e<=4?e:null;if(typeof e==`string`){let t=r.indexOf(e);return t>=0?t:null}return null}function a(e){return r[e]??`none`}var o={NONE:0,SESSION:1,LOCAL:2,REMOTE:3},s=new Set([`top-left`,`top-center`,`top-right`,`bottom-left`,`bottom-center`,`bottom-right`,`center`]),c={info:`info`,success:`yes`,warn:`warn`,error:`error`},l=[`primary`,`success`,`warning`,`danger`,`plain`];function u(e){return l.includes(e)?e:void 0}var d={pos:`top-right`,delayClose:3e3,showCount:5,closeable:!0,animate:`slide`,level:0,persist:0},f=new Set(`id.type.icon.title.description.delayClose.pos.offset.closeable.link.owner.level.read.status.result.persist.actions.anchor.progress.canStart.canPause.canCancel.canStop.closeWhenDone.animate.className.styles.width.height.minWidth.maxWidth.minHeight`.split(`.`));function p(e,t){let n=typeof e==`string`?{title:e}:e;return typeof n!=`object`||!n||Array.isArray(n)?(t(`engine.notifications.add: 入参须为通知字符串或配置对象，已忽略`),null):n}function m(e){return typeof e==`number`?`${e}px`:e}var ee=`$notifications`,te=null;function h(e){te=e}function ne(){return globalThis.AutoSpark??te}function g(e){let t=ne()?.[e];if(t==null)throw Error(`[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${e}"——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）`);return t}function re(e,t){return g(`shallow`)(e,t)}function ie(e){if(e==null||e===!1||e===``)return{enter:null,leave:null};if(typeof e==`string`){let t={name:e};return{enter:t,leave:{...t}}}if(typeof e!=`object`)return{enter:null,leave:null};let t=e,n={};return t.name!=null&&(n.name=String(t.name)),t.duration!=null&&(n.duration=Number(t.duration)),t.delay!=null&&(n.delay=Number(t.delay)),t.easing!=null&&(n.easing=String(t.easing)),{enter:ae(t.enter,n),leave:ae(t.leave,n)}}function ae(e,t){if(e===!1)return null;let n=t.name,{duration:r,delay:i,easing:a}=t;if(typeof e==`string`)n=e;else if(typeof e==`object`){let t=e;t.name!=null&&(n=String(t.name)),t.duration!=null&&(r=Number(t.duration)),t.delay!=null&&(i=Number(t.delay)),t.easing!=null&&(a=String(t.easing))}if(n==null)return null;let o={name:n};return r!=null&&(o.duration=r),i!=null&&(o.delay=i),a!=null&&(o.easing=a),o}function oe(e){return g(`getOverlayContainer`)(e)}function se(e,t){if(globalThis.document===void 0)return;let{id:n,mode:r=`default`,location:i=`head`,el:a}=t??{},o=()=>typeof e==`function`?e():e,s=ce(n,a);if(!s){let e=document.createElement(`style`);return n&&(e.id=n),e.textContent=o(),a?a.appendChild(e):i==`body`?document.body.appendChild(e):document.head.appendChild(e),e}if(r==`replace`)s.textContent=o();else if(r==`patch`){let e=o();s.textContent!==e&&(s.textContent=e)}else r==`append`&&(s.textContent+=o());return s}function ce(e,t){if(!e)return null;let n=e.replace(/["\\]/g,`\\$&`),r=t?.querySelector(`[id="${n}"]`)??document.getElementById(e);return r?.tagName===`STYLE`?r:null}var le=`autospark-notification-column-styles`,ue=`
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
`;function de(){se(ue,{id:le})}var _=new WeakMap,fe=`autospark-notifications`,pe=`data-autospark-notifications`,v=`data-notification-pos`;function me(e){if(typeof document>`u`||!document.body)return null;let t=_.get(e);if(!t){let n=oe(e);if(!n)return null;t=document.createElement(`div`),t.className=fe,t.setAttribute(pe,``),n.appendChild(t),_.set(e,t),de()}return t}function he(e,t,n){let r=me(e);if(!r)return null;let i=r.querySelector(`:scope > [${v}="${t}"]`);return i||(i=document.createElement(`div`),i.className=`autospark-notification-column`,i.setAttribute(v,t),n!=null&&i.style.setProperty(`--autospark-notification-inset`,m(n)),r.appendChild(i)),i}function ge(e){let t=_.get(e);t&&(t.remove(),_.delete(e))}var _e=class{constructor(e){this.manager=e}get _state(){return this.manager._stateRef}createEntry(e,t,n){let r=this.manager._resolveAnchor(e.anchor),i=Date.now();return{id:t,type:n,record:{id:t,type:n,read:e.read===!0,title:e.title,description:e.description,level:e.level,owner:e.owner,status:e.status,result:e.result,link:e.link,createAt:i,updateAt:i},props:e,icon:this.manager._resolveIcon(e.level,e.icon),actions:this.manager._resolveActions(e.actions,r),state:`queued`,instance:null,scope:null,el:null,anchor:r,confirmResolve:null,timer:null,tickTimer:null,deadline:null,pausedRemaining:null,leave:null,clickHandler:null,enterHandler:null,leaveHandler:null,controlOffs:[],startEmitted:!1,appliedClassName:``,appliedStyles:``}}touch(e){e.record.updateAt=Date.now()}mirrorAdd(e){let t=this._state?.items;t&&t.push({...e.record})}mirrorReplace(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e.id);n>=0&&t.splice(n,1,{...e.record})}mirrorRemove(e){let t=this._state?.items;if(!t)return;let n=t.findIndex(t=>t.id===e);n>=0&&t.splice(n,1)}evictOverflow(e){let t=this.manager._maxLen;if(t<=0)return;let n=this.manager;for(;n.size>t;){let t=null;for(let r of n.keys()){let i=n._entryOf(r);i&&i!==e&&(t==null||i.record.createAt<t.record.createAt)&&(t=i)}if(!t)break;n._destroyEntry(t)}}restoreRecords(e,t){let n=this.manager,r=[];for(let i of e){if(typeof i!=`object`||!i)continue;let e={...i,persist:t===`local`?o.LOCAL:o.REMOTE},a=e.id!=null&&e.id!==``?String(e.id):`notification-${++n._autoId}`,s=Number(i.createAt),c=Number(i.updateAt),l=Number.isFinite(s)&&s>0?s:Date.now(),u=Number.isFinite(c)&&c>0?c:l,d=n._entryOf(a);if(d){let t=n._mergeProps({...e,id:a}).merged;n._applyEntryConfig(d,t),d.record.createAt=l,d.record.updateAt=u,r.push(d.instance);continue}let{merged:f,type:p}=n._mergeProps({...e,id:a});n._settleLevel(f);let m=this.createEntry(f,a,p);m.record.createAt=l,m.record.updateAt=u,n._materialize(m)&&(m.state=`hidden`,m.instance&&(m.instance.data.closed=!0),r.push(m.instance))}return r}},ve=class{constructor(e,t){this.manager=e,this.pos=t,this.waiting=[],this.shown=new Set}get _showCount(){return this.manager._showCount}offer(e){e.state===`shown`?this.shown.add(e.id):this.shown.size<this._showCount?(this.shown.add(e.id),this.manager._showEntry(e)):this.waiting.push(e)}remove(e){let t=this.waiting.indexOf(e);t>=0&&this.waiting.splice(t,1)}releaseShown(e){this.shown.delete(e)}flush(){for(;this.waiting.length&&this.shown.size<this._showCount;){let e=this.waiting.shift();this.shown.add(e.id),this.manager._showEntry(e)}}clear(){this.waiting.length=0}},ye=`autospark-notifications`;function be(e){return{...e.record}}function xe(e,t){if(typeof localStorage<`u`)try{localStorage.setItem(ye,JSON.stringify(e))}catch(e){t(`engine.notifications: local 持久化写入失败，已忽略: ${e?.message??e}`)}}function Se(e){if(typeof localStorage>`u`)return[];try{let t=localStorage.getItem(ye);if(!t)return[];let n=JSON.parse(t);return Array.isArray(n)?n.filter(e=>e&&typeof e==`object`&&!Array.isArray(e)):(e(`engine.notifications: local 持久化数据格式异常（非数组），已忽略`),[])}catch(t){return e(`engine.notifications: local 持久化读取失败，已忽略: ${t?.message??t}`),[]}}var Ce=class{constructor(e,t){this.getFetchOptions=e,this.warn=t,this.timer=null,this.pending=null}schedule(e){this.pending=e,this.timer!=null&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null;let e=this.pending;this.pending=null,e&&this.flush(e)},500)}async flush(e,t=!1){this.timer!=null&&(clearTimeout(this.timer),this.timer=null,this.pending=null);let n=this.getFetchOptions();if(typeof fetch<`u`&&n?.url)try{let{url:r,...i}=n,a=await fetch(r,{...i,method:`POST`,headers:{"Content-Type":`application/json`,...i.headers},body:JSON.stringify(e),keepalive:t});a.ok||this.warn(`engine.notifications: remote 持久化失败（HTTP ${a.status}），已忽略`)}catch(e){this.warn(`engine.notifications: remote 持久化失败，已忽略: ${e?.message??e}`)}}cancel(){this.timer!=null&&(clearTimeout(this.timer),this.timer=null),this.pending=null}},we=class{constructor(e){this.manager=e,this.remote=new Ce(()=>this.manager._stateRef?.options.fetchOptions??null,e=>this.manager.engine.logger.warn(e))}collect(){let e=[],t=[];for(let n of Array.from(this.manager.keys())){let r=this.manager._entryOf(n);if(!r)continue;let i=be(r);r.props.persist===o.LOCAL?e.push(i):r.props.persist===o.REMOTE&&t.push(i)}return{locals:e,remotes:t}}schedule(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();xe(e,e=>this.manager.engine.logger.warn(e)),this.remote.schedule(t)}flushNow(){if(!this.manager.enabled)return;let{locals:e,remotes:t}=this.collect();xe(e,e=>this.manager.engine.logger.warn(e)),this.remote.flush(t,!0)}async save(){let{locals:e,remotes:t}=this.collect();xe(e,e=>this.manager.engine.logger.warn(e)),await this.remote.flush(t)}async load(e){let t=this.manager._stateRef?.options.fetchOptions??null,n=e??t?.url;if(!n||typeof fetch>`u`)return this.manager.engine.logger.warn(`engine.notifications: load 缺少 url（参数与 options.notifications.fetchOptions.url 均未配置），已跳过`),[];try{let e=t?{...t}:{};delete e.url;let r=await fetch(n,e);if(!r.ok)return this.manager.engine.logger.warn(`engine.notifications: load 失败（HTTP ${r.status}），已忽略`),[];let i=await r.json();if(!Array.isArray(i))return this.manager.engine.logger.warn(`engine.notifications: load 响应体格式异常（非数组），已忽略`),[];let a=this.manager.records.restoreRecords(i,`remote`);return this.schedule(),a}catch(e){return this.manager.engine.logger.warn(`engine.notifications: load 失败，已忽略: ${e?.message??e}`),[]}}cancelPending(){this.remote.cancel()}};function Te(e){return g(`markRaw`)(e)}function Ee(){return g(`SCOPES_KEY`)}function De(e){for(let t of Array.from(e.attributes)){let e=t.name;if(e===`x-define:inherit`||e.startsWith(`x-define:inherit.`)||e===`x-define:extends`||e.startsWith(`x-define:extends.`))return(t.value??``).trim()}return null}var Oe=[`width`,`height`,`minWidth`,`maxWidth`,`minHeight`];function ke(t,n){let r=t.engine,i=t=>{let n=r._resolveGlobalComponent(t);if(!n||t!==`autospark.notifications.shell`&&De(n)===null&&(n.setAttribute(`x-define:inherit`,e),r._globalComponentDefs.delete(t),n=r._resolveGlobalComponent(t),!n))return null;let i=r.getComponentDef(n)??r.getGlobalComponentDef(t)??null;return{name:t,snapshot:n,def:i}},a=t._options.types?.[n]?.render?.trim()??``;if(a!==``){let e=i(a);if(e)return e}return i(`autospark.notifications.${n}`)??i(`autospark.notifications.shell`)??null}function Ae(e,t){if(!t)return null;let n=t;for(;n;){let t=e.engine.findScopeByEl(n);if(t)return t;n=n.parentElement}return null}function je(e,t){let n={};for(let[e,r]of Object.entries(t.props))typeof r!=`function`&&(typeof HTMLElement<`u`&&r instanceof HTMLElement||e!==`progress`&&e!==`state`&&e!==`paused`&&e!==`completed`&&(n[e]=r));let r=t.record;return n.id=r.id,n.type=r.type,n.read=r.read,n.title=r.title,n.description=r.description,n.level=r.level,n.owner=r.owner,n.status=r.status,n.result=r.result,n.link=r.link,n.icon=t.icon,n.actions=t.actions,n.levelName=a(r.level??0),(t.type===`task`||t.props.canCancel===!0)&&(n._abort=t.instance?.data?._abort??Te(new AbortController)),t.type===`task`&&(n.state=t.instance?.data?.state??(t.props.canStart===!0?`pending`:`running`)),n}function Me(e,t){for(let n of Oe){let r=t[n],i=n.replace(/[A-Z]/g,e=>`-`+e.toLowerCase());r==null||r===``||r===`auto`?e.style.removeProperty(i):e.style.setProperty(i,m(r))}}function Ne(e,t){let n=he(e.engine,t.props.pos,t.props.offset);if(!n)return!1;let r=e.engine,i=Ae(e,t.anchor),a=ke(e,t.type),o=je(e,t);if(!a)return r.logger.warn(`engine.notifications: type "${t.type}" 无可用渲染组件（render 链与 shell 兜底均未命中），已跳过装配`),!1;let s=r.compiler.instantiateDetachedComponent(a.snapshot.cloneNode(!0),i,a.def,o),c=s.el;t.scope=s.scope,t.instance=new(g(`ComponentInstance`))(s.scope),Fe(t.instance,a.def),t.el=c,c.style.display=`none`,c.setAttribute(v,t.props.pos),t.props.className&&(c.classList.add(...String(t.props.className).trim().split(/\s+/)),t.appliedClassName=String(t.props.className)),t.props.styles&&(c.style.cssText=String(t.props.styles),t.appliedStyles=String(t.props.styles)),Me(c,t.props),t.clickHandler=n=>e._onCardClick(t,n),t.enterHandler=()=>e._pauseTimer(t),t.leaveHandler=()=>e._resumeTimer(t),c.addEventListener(`click`,t.clickHandler),c.addEventListener(`mouseenter`,t.enterHandler),c.addEventListener(`mouseleave`,t.leaveHandler),n.appendChild(c),t.leave=ie(t.props.animate).leave,Pe(e,t);let l=t.props.progress;return l!=null&&(t.instance?.data.progress??0)===0&&t.instance&&t.instance.methods.progress?.(Number(l)),!0}function Pe(e,t){let n=t.instance?.scope;if(!n)return;let r=e.engine,i=`${Ee()}.${n.id}`,a=()=>t.instance?.data,o=a()?.holdOpen,s=r.store.watch(`${i}.holdOpen`,()=>{let n=a()?.holdOpen;n!==o&&(o=n,n===!0?e._clearTimer(t):t.state===`shown`&&e._startTimer(t))});t.controlOffs.push(()=>s.off());for(let n of[`progress`,`state`]){let o=a()?.[n],s=r.store.watch(`${i}.${n}`,()=>{let r=a()?.[n];r!==o&&(o=r,e._emit(`update`,t))});t.controlOffs.push(()=>s.off())}}function Fe(e,t){let n=new Set([`el`,`name`,`data`,`props`,`globalState`,`methods`,`super`,`scope`,`then`]);for(let t of[`id`,`type`,`read`,`closed`,`status`,`result`,`visible`,`remaining`])Object.defineProperty(e,t,{get:()=>e.data[t],configurable:!0});Object.defineProperty(e,"abortSignal",{get:()=>e.data?._abort?.signal,configurable:!0});let r=t?.setup?.methods;if(!r)return;let i=new Set(n);i.add(`id`),i.add(`type`),i.add(`read`),i.add(`closed`),i.add(`status`),i.add(`result`),i.add(`visible`),i.add(`remaining`),i.add(`abortSignal`);for(let t of Object.keys(r))i.has(t)||Object.defineProperty(e,t,{get:function(){return e.methods[t]},configurable:!0})}function Ie(e,t){let n=t.el;n&&(t.clickHandler&&n.removeEventListener(`click`,t.clickHandler),t.enterHandler&&n.removeEventListener(`mouseenter`,t.enterHandler),t.leaveHandler&&n.removeEventListener(`mouseleave`,t.leaveHandler),n.remove());for(let e of t.controlOffs.splice(0))try{e()}catch{}let r=t.instance;t.el=null,t.instance=null;let i=t.scope;t.scope=null,i&&i.destroy(),r&&Le(e,r)}function Le(e,t){let n=t=>e.engine.logger.warn(`engine.notifications: 组件实例已销毁（记录已 remove），${t}() 无效（ADR-0083 死会话语义沿用）`);Object.defineProperty(t,"closed",{get:()=>!0,configurable:!0}),Object.defineProperty(t,"visible",{get:()=>!1,configurable:!0});for(let e of Object.getOwnPropertyNames(t)){let r=Object.getOwnPropertyDescriptor(t,e);r?.get&&r.get.name===`flattenMethod`&&Object.defineProperty(t,e,{get(){return n(e),()=>{}},configurable:!0})}}var Re=new Set([`showCount`,`maxLen`,`fetchOptions`,`icons`,`shell`,`shallow`,`types`]);function ze(e,t){let{opts:n,frozen:r,typeDefaults:i,warn:a}=t,o=String(e.type??n.type??`toast`),s=n.types?.[o];if(s)for(let e of Object.keys(s))Re.has(e)&&a(`engine.notifications: types.${o} 不允许管理器级键 "${e}"，已忽略`);let c={...d},l=i?.[o];l&&Object.assign(c,l);for(let e of f)e!==`id`&&e in n&&(c[e]=n[e]),e!==`id`&&(e===`anchor`||e===`actions`)&&r[e]!==void 0&&(c[e]=r[e]),e!==`id`&&s&&e in s&&(c[e]=s[e]);return Object.assign(c,e),{merged:c,type:o}}function Be(e,t){let r=i(e.level);r==null?(t(`engine.notifications: 未知 level "${e.level}"（0~4 或 none/info/success/warn/error，ADR-0079），已回退 ${n.NONE}`),e.level=n.NONE):e.level=r}function y(e,t){s.has(e.pos)||(t(`engine.notifications: 未知 pos "${e.pos}"，已回退 "${d.pos}"`),e.pos=d.pos)}function Ve(e,t){e.persist!=null&&![0,1,2,3].includes(e.persist)&&(t(`engine.notifications: 未知 persist "${e.persist}"（0|1|2|3，ADR-0077），已回退 ${o.NONE}`),e.persist=o.NONE)}function He(e){return String(e??``).replace(/[/]/g,`-`).replace(/\*/g,`-`)}function b(e,t,n){return`notifications/${He(e)}/${He(t)}/${n}`}function Ue(e,n){let r=t(n),i=e._resolveGlobalComponent(r);if(i)return(e.getComponentDef(i)??e.getGlobalComponentDef(r)??null)?.defaults}var We=class extends Map{_entryOf(e){return this._entries.get(e)}get _stateRef(){return this._state}get _options(){return this._state.options}constructor(e){super(),this.PERSIST=o,this._entries=new Map,this._state=null,this._frozen={},this._autoId=0,this._queues=new Map,this._typeDefaultsCache=new Map,this._typeDefaults=new Proxy({},{get:(e,t)=>{if(typeof t==`string`)return this._typeDefaultsCache.has(t)||this._typeDefaultsCache.set(t,Ue(this.engine,t)),this._typeDefaultsCache.get(t)}}),this.engine=e;let t=e.options.notifications;this.enabled=t!==!1;let n=t===!1||t==null?{}:t;if(this._frozen={anchor:n.anchor,actions:n.actions},this.records=new _e(this),this.storage=new we(this),!this.enabled)return;let r={};for(let e of Object.keys(n))e!==`anchor`&&e!==`actions`&&(r[e]=n[e]);for(let e of Object.keys(d))r[e]===void 0&&(r[e]=d[e]);let i=Number(r.shallow)===0?0:1;e.store.state[ee]={items:re([],i),options:r},this._state=e.store.state[ee],this.records.restoreRecords(Se(e=>this.engine.logger.warn(e)),`local`)}add(e,t){if(!this.enabled)return this.engine.logger.warn(`engine.notifications: 通知特性已通过 options.notifications: false 关闭，调用被忽略`),null;if(typeof e==`function`)return this._addAsync(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: add(..., ${typeof t==`string`?`"${t}"`:`props`}) 第二参仅对 factory 形态生效（对象形态请用 type 字段），已忽略`);let n=p(e,e=>this.engine.logger.warn(e));return n?this._enqueueProps(n):null}_addAsync(e,t){let n=typeof t==`object`&&t?t:{},r=t==null?`toast`:typeof t==`string`?String(t).trim()||`toast`:String(n.type??``).trim()||`toast`,{merged:i,type:a}=this._mergeProps({...n,type:r});y(i,e=>this.engine.logger.warn(e)),this._settleLevel(i),Ve(i,e=>this.engine.logger.warn(e));let o=i.id!=null&&i.id!==``?String(i.id):`notification-${++this._autoId}`;i.id=o,i.type=a;let s=this.records.createEntry(i,o,a);if(!this._materialize(s))return null;let c=s.instance;return(async()=>{try{let t=await e(c);if(!this._entries.has(o)||s.state===`closed`)return;if(t==null){this._destroyEntry(s);return}let n=p(t,e=>this.engine.logger.warn(e));if(!n||!String(n.title??``).trim()){this.engine.logger.warn(`engine.notifications: factory 结果缺少 title（空通知），已销毁`),this._destroyEntry(s);return}n.type!=null&&String(n.type)!==r&&(this.engine.logger.warn(`engine.notifications: factory 声明 type "${r}" 与 return props type "${n.type}" 不一致，以声明为准（类型不可变）`),n.type=r);let i=this._mergeProps({...n,id:o,type:r}).merged;this._applyEntryConfig(s,i),s.state=`queued`,this._emit(`add`,s),this._displayEntry(s),this.storage.schedule()}catch(e){this.engine.logger.warn(`engine.notifications: factory 执行失败，已销毁: ${e?.message??e}`),this._destroyEntry(s)}})(),c}_materialize(e){return Ne(this,e)?(this._bindChoice(e),this._entries.set(e.id,e),super.set(e.id,e.instance),this.records.mirrorAdd(e),this.records.evictOverflow(e),!0):!1}_bindChoice(e){if(e.type!==`confirm`||!e.instance)return;let t=new Promise(t=>{e.confirmResolve=t});Object.defineProperty(e.instance,"then",{value:t.then.bind(t),configurable:!0})}_mergeCtx(){return{opts:this.enabled?this._options:{},frozen:this._frozen,typeDefaults:this._typeDefaults,warn:e=>this.engine.logger.warn(e)}}_mergeProps(e){return ze(e,this._mergeCtx())}_settleLevel(e){Be(e,e=>this.engine.logger.warn(e))}_enqueueProps(e){if(!String(e.title??``).trim())return this.engine.logger.warn(`engine.notifications: title 为空，调用被忽略`),null;let{merged:t,type:n}=this._mergeProps(e);y(t,e=>this.engine.logger.warn(e)),this._settleLevel(t),Ve(t,e=>this.engine.logger.warn(e));let r=t.id!=null&&t.id!==``?String(t.id):`notification-${++this._autoId}`;t.id=r,t.type=n;let i=this._entries.get(r);if(i){if(i.state===`shown`||i.state===`queued`)return this._updateInPlace(i,e),this.get(r)??null;let n=this._mergeProps({...t,id:r}).merged;return this._applyEntryConfig(i,n),i.state=`queued`,this._displayEntry(i),this.storage.schedule(),this.get(r)??null}let a=this.records.createEntry(t,r,n);return this._materialize(a)?(this._emit(`add`,a),this._displayEntry(a),this.storage.schedule(),a.instance):null}get _showCount(){let e=this._state?.options.showCount??d.showCount;return typeof e==`number`&&e>0?Math.floor(e):d.showCount}get _maxLen(){let e=this._state?.options.maxLen;return typeof e==`number`&&e>0?Math.floor(e):0}_resolveIcon(e,t){if(t)return t;if(e===0)return``;let n=a(e);return this._options.icons?.[n]??c[n]??n}_resolveAnchor(e){return e==null?null:e instanceof HTMLElement?e:typeof e==`string`?(typeof document<`u`?document.querySelector(e):null)||(this.engine.logger.warn(`engine.notifications: anchor 选择器 "${e}" 未命中，按无 anchor 处理`),null):null}_resolveActions(e,t){let n=[],r=(e,t)=>{let n=u(e?.type);return e?.type!==void 0&&n===void 0&&this.engine.logger.warn(`engine.notifications: action "${t}" 的 type 须为 ${l.join(`/`)}，已忽略（按钮色回退跟随 level）`),n};for(let i of e??[])if(typeof i==`string`){let e=this._resolveActionByName(i,t);if(!e){this.engine.logger.warn(`engine.notifications: action "${i}" 未命中（全局表${t?`与 anchor scope 链`:``}），按钮已剪枝`);continue}n.push({name:i,title:e.title??i,handle:e.handle,hide:e.hide!==!1,hasValue:!1,value:void 0,type:r(e,i)})}else if(i&&typeof i==`object`){let e=`value`in i;n.push({name:String(i.id??i.title??`action`),title:i.title??`action`,handle:typeof i.handle==`function`?i.handle:null,hide:i.hide!==!1,hasValue:e,value:i.value,type:r(i,String(i.title??`action`))})}else this.engine.logger.warn(`engine.notifications: 非法 action 项，已剪枝`);return n}_resolveActionByName(e,t){if(t){let n=t;for(;n;){let t=this.engine.findScopeByEl(n)?.getAction(e);if(t)return t;n=n.parentElement}}return this.engine.actions[e]}_updateInPlace(e,t){`type`in t&&String(t.type)!==e.type&&this.engine.logger.warn(`engine.notifications: 同 id 更新不支持变更 type，已忽略`);let n={...e.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(n[e]=t[e]);y(n,e=>this.engine.logger.warn(e)),this._applyEntryConfig(e,n),e.state===`shown`&&this._startTimer(e),this._emit(`update`,e),this.storage.schedule()}_applyEntryConfig(e,t){let n=e.appliedClassName,r=e.appliedStyles;this._settleLevel(t),e.props=t;for(let n of[`title`,`description`,`owner`,`status`,`result`,`link`,`read`])n in t&&(e.record[n]=t[n]);e.record.level=t.level,this.records.touch(e),e.icon=this._resolveIcon(e.record.level??0,t.icon),e.actions=this._resolveActions(t.actions,e.anchor);let i=je(this,e);e.instance&&Object.assign(e.instance.data,i),t.progress!=null&&e.instance&&e.instance.methods.progress?.(Number(t.progress));let a=t.className?String(t.className).trim():``,o=t.styles?String(t.styles):``;e.el&&(n&&e.el.classList.remove(...n.split(/\s+/)),a&&e.el.classList.add(...a.split(/\s+/)),o!==r&&(e.el.style.cssText=o),Me(e.el,t)),e.appliedClassName=a,e.appliedStyles=o,this.records.mirrorReplace(e)}update(e,t){let n=this._entries.get(e);if(!n||!this._entries.has(e)){this.engine.logger.warn(`engine.notifications: update("${e}") 未命中存活记录，已忽略`);return}p(t,e=>this.engine.logger.warn(e)),`type`in t&&String(t.type)!==n.type&&this.engine.logger.warn(`engine.notifications: update 不支持修改 type，已忽略`);let r=n.props.read===!0,i=n.props.status,a={...n.props};for(let e of Object.keys(t))e!==`id`&&e!==`type`&&e!==`pos`&&e!==`offset`&&(a[e]=t[e]);y(a,e=>this.engine.logger.warn(e)),this._applyEntryConfig(n,a),this._emit(`update`,n),!r&&n.props.read===!0&&this._emit(`read`,n),n.props.status!==i&&this._emit(`status`,n),this.storage.schedule()}_setRead(e){e.props.read!==!0&&(e.props.read=!0,e.record.read=!0,this.records.touch(e),e.instance&&(e.instance.data.read=!0),this.records.mirrorReplace(e),this._emit(`read`,e),this.storage.schedule())}markRead(e){let t=this._entries.get(e);t?this._setRead(t):this.engine.logger.warn(`engine.notifications: markRead("${e}") 未命中存活记录，已忽略`)}markAllRead(e){for(let t of Array.from(this._entries.values()))t.props.read!==!0&&(e==null||t.type===e)&&this._setRead(t)}_queueOf(e){let t=this._queues.get(e);return t||(t=new ve(this,e),this._queues.set(e,t)),t}_displayEntry(e){this._queueOf(e.props.pos).offer(e)}_showEntry(e){e.state!==`shown`&&(e.el&&(e.el.style.display=``),e.state=`shown`,e.instance&&(e.instance.data.visible=!0,e.instance.data.closed=!1),e.el&&this.engine.animate.enter(e.el,ie(e.props.animate).enter),this._startTimer(e),this._emit(`show`,e),this._emitTaskAutoStart(e))}_dequeue(e){this._queues.get(e.props.pos)?.remove(e)}_flushQueue(e){this._queueOf(e).flush()}show(e,t){if(typeof e!=`string`)return this.add(e,t);t!=null&&this.engine.logger.warn(`engine.notifications: show("${e}", ...) 第二参仅对 factory 形态生效，已忽略`);let n=this._entries.get(e);return!n||n.state===`closed`?(this.engine.logger.warn(`engine.notifications: show("${e}") 未命中存活记录（persist=0 的已关通知已销毁）`),null):(n.state===`shown`||n.state===`queued`||(n.state=`queued`,this._displayEntry(n)),this.get(e)??null)}hide(e){let t=this._entries.get(e);t&&t.state!==`closed`&&t.state!==`hidden`&&this._dismiss(t,!0)}toast(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`toast`}},`toast`);let t={...typeof e==`string`?{title:e}:e,type:`toast`};return this.show(t)}confirm(e,t){let n=typeof e==`string`?{title:e}:{...e},r=t?.yes??n.yes,i=t?.no??n.no;return delete n.yes,delete n.no,this.show({...n,type:`confirm`,delayClose:n.delayClose??0,actions:(n.actions?.length?n.actions:void 0)??[{title:r??`确定`,value:!0,type:`primary`},{title:i??`取消`,value:!1,type:`plain`}]})}task(e){if(typeof e==`function`)return this.show(async t=>{let n=await e(t);return n==null?void 0:{...n,type:`task`}},`task`);let t={...typeof e==`string`?{title:e}:e,type:`task`};return this.show(t)}_dismiss(e,t){if(e.state===`closed`||e.state===`hidden`)return;e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.instance&&(e.instance.data.visible=!1),this._emit(`hide`,e);let n=()=>this._settleClose(e),r=t?e.leave:null,i=e.el;r&&i&&i.style.display!==`none`?(i.style.boxSizing=`border-box`,i.style.height=`${i.offsetHeight}px`,i.style.overflow=`hidden`,this.engine.animate.leave(i,r,n)?(i.style.transitionProperty=`transform, opacity, height, padding-top, padding-bottom, margin-bottom, border-top-width, border-bottom-width`,i.style.height=`0px`,i.style.paddingTop=`0px`,i.style.paddingBottom=`0px`,i.style.marginBottom=`-10px`,i.style.borderTopWidth=`0px`,i.style.borderBottomWidth=`0px`):n()):n()}_settleClose(e){let t=Number(e.props.persist??o.NONE);this._queueOf(e.props.pos).releaseShown(e.id),t>=o.SESSION&&t<=o.REMOTE?(e.state=`hidden`,e.el&&(e.el.style.display=`none`),e.instance&&(e.instance.data.closed=!0,e.instance.data.visible=!1)):this._destroyEntry(e),this._flushQueue(e.props.pos),this.storage.schedule()}_destroyEntry(e){e.state===`queued`&&this._dequeue(e),e.state=`closed`,this._clearTimer(e),e.confirmResolve=null,Ie(this,e),this._entries.delete(e.id),super.delete(e.id),this.records.mirrorRemove(e.id),this._queueOf(e.props.pos).releaseShown(e.id)}delete(e){let t=this._entries.get(e);return t?((t.state===`shown`||t.state===`queued`)&&this._emit(`hide`,t),this._destroyEntry(t),this._flushQueue(t.props.pos),this.storage.flushNow(),!0):!1}clear(e=!0){for(let e of this._queues.values())e.clear();for(let t of Array.from(this._entries.values()))t.state===`shown`||t.state===`queued`?this._dismiss(t,e):this._destroyEntry(t);this._state&&this._state.items.splice(0),this.storage.flushNow()}dispose(){this.storage.flushNow();for(let e of this._queues.values())e.clear();for(let e of Array.from(this._entries.values()))(e.state===`shown`||e.state===`queued`||e.state===`hidden`)&&this._destroyEntry(e);ge(this.engine),this._state&&this._state.items.splice(0)}async load(e){return this.storage.load(e)}async save(){await this.storage.save()}_onCardClick(e,t){this._setRead(e);let n=t.target,r=n?.closest?.(`.autospark-notification-action`);if(r){let t=Number(r.getAttribute(`data-notification-action`)),n=e.actions[Number.isInteger(t)?t:-1];n&&this._fireAction(e,n)}else if(n?.closest?.(`.autospark-notification-close`)){let t=e.instance?.methods??{},n=typeof t.close==`function`?t.close:typeof t.cancel==`function`?t.cancel:null;typeof n==`function`?n():this._dismiss(e,!0)}}_fireAction(e,t){t.hasValue&&(e.props.result=t.value,e.record.result=t.value,this.records.touch(e),e.instance&&(e.instance.data.result=t.value),this.records.mirrorReplace(e)),this._emitAction(e,t),e.confirmResolve&&=(e.confirmResolve(t.hasValue?t.value:void 0),null),t.handle?.(),this.storage.schedule(),t.hide&&this._dismiss(e,!0)}_fireConfirmChoice(e,t){let n=e.actions.find(e=>e.hasValue&&e.value===t);n?this._fireAction(e,n):this.engine.logger.warn(`engine.notifications: type='confirm' 会话缺少 value=${t} 的按钮（actions 已被自定义），选择无效（ADR-0077）`)}respond(e,t){let n=this._entries.get(e);n?this._fireConfirmChoice(n,t):this.engine.logger.warn(`engine.notifications: respond("${e}") 未命中存活记录，已忽略`)}_emitControlAction(e,t){let n=this._entries.get(e);if(!n)return;let r=b(n.type,n.props.id,`actions/${t}`),i={notification:n.instance,el:n.el};this.engine.emit(r,i),n.el?.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0})),n.anchor&&n.anchor.dispatchEvent(new CustomEvent(r,{detail:i,bubbles:!0}))}_onControlAction(e,t,n){let r=this._entries.get(e),i=b(r?.type??`task`,e,`actions/${t}`),a=this.engine.on(i,n),o=()=>a.off();return r&&r.controlOffs.push(o),o}_emitTaskAutoStart(e){if(e.type!==`task`||e.startEmitted||e.props.canStart===!0)return;let t=e.instance?.data?.state;t!==`stopped`&&t!==`completed`&&(e.startEmitted=!0,this._emitControlAction(e.props.id,`start`))}_emit(e,t){let n=b(t.type,t.props.id,e),r={notification:t.instance,el:t.el};this.engine.emit(n,r),t.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_emitAction(e,t){let n=b(e.type,e.props.id,`actions/${t.name}`),r={notification:e.instance,el:e.el,action:{title:t.title,hide:t.hide},value:t.hasValue?t.value:void 0};this.engine.emit(n,r),e.el?.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0})),e.anchor&&e.anchor.dispatchEvent(new CustomEvent(n,{detail:r,bubbles:!0}))}_startTimer(e){if(this._clearTimer(e),e.instance?.data.holdOpen===!0)return;let t=e.props.delayClose;typeof t==`number`&&t>0?(e.deadline=Date.now()+t,e.pausedRemaining=null,e.instance&&(e.instance.data.remaining=t),e.tickTimer=setInterval(()=>{e.deadline!=null&&e.instance&&(e.instance.data.remaining=Math.max(0,e.deadline-Date.now()))},1e3),e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)):(e.deadline=null,e.instance&&(e.instance.data.remaining=-1))}_pauseTimer(e){e.timer!=null&&e.deadline!=null&&(clearTimeout(e.timer),e.timer=null,e.pausedRemaining=Math.max(0,e.deadline-Date.now()))}_resumeTimer(e){if(e.pausedRemaining==null||e.state!==`shown`)return;let t=e.pausedRemaining;e.pausedRemaining=null,e.deadline=Date.now()+t,e.timer=setTimeout(()=>{e.timer=null,this._dismiss(e,!0)},t)}_clearTimer(e){e.timer!=null&&(clearTimeout(e.timer),e.timer=null),e.tickTimer!=null&&(clearInterval(e.tickTimer),e.tickTimer=null),e.pausedRemaining=null}},Ge=`ready`,Ke=`__AUTOSPARK_PLUGINS__`;function x(e){let t=globalThis.AutoSpark;if(typeof t?.[Ge]==`function`){e(t);return}let n=globalThis,r=n[Ke]??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var qe=`<div\r
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
`,Je=`<div x-define="autospark.notifications.toast" x-define:inherit="autospark.notifications.shell"></div>\r
`,Ye=`<div x-define="autospark.notifications.task" x-define:inherit="autospark.notifications.shell">\r
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
`,Xe=`<div x-define="autospark.notifications.confirm" x-define:inherit="autospark.notifications.shell">\r
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
`,Ze={[e]:qe,[t(`toast`)]:Je,[t(`task`)]:Ye,[t(`confirm`)]:Xe};function Qe(e){let t=e?.el;return t instanceof HTMLElement?t:null}function $e(e){return{title:`提示`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type??=`toast`,n.anchor??=Qe(this)??void 0,e.notifications.add(n)}}}function et(e){return{title:`确认`,handle:function(t){let{yes:n,no:r,...i}=typeof t==`string`?{title:t}:{...t??{}};return i.anchor??=Qe(this)??void 0,e.notifications.show({...i,type:`confirm`,delayClose:i.delayClose??0,actions:[{title:n??`确定`,value:!0,type:`primary`},{title:r??`取消`,value:!1,type:`plain`}]})}}}function tt(e){return{title:`任务`,handle:function(t){let n=typeof t==`string`?{title:t}:{...t??{}};return n.type=`task`,n.anchor??=Qe(this)??void 0,e.notifications.show(n)}}}var nt={toast:$e,confirm:et,task:tt};function rt(e){let t=e.options.builtinComponents??(e.options.builtinComponents={});for(let[e,n]of Object.entries(Ze))t[e]??(t[e]=n)}function it(e){rt(e);let t=new We(e);e.notifications=t;for(let[t,n]of Object.entries(nt))t in e.actions||(e.actions[t]=n(e));e.on(`engine/destroy/before`,()=>t.dispose())}function at(){x(e=>{h(e),e.ready(it)})}at();var ot=class extends Error{constructor(e,t,n,r){super(e),this.name=`ResourceError`,this.status=t,this.url=n,this.method=r}};function S(e={}){let{where:t,...n}=e,r={...n};return typeof t==`object`&&t?Object.assign(r,t):typeof t==`string`&&t!==``&&(r.where=t),r}var st={get:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`GET`,url:e,query:S(t)}:{method:`GET`,url:`${e}/${t}`},getMany:(e,t={})=>({method:`GET`,url:e,query:S(t)}),add:(e,t)=>({method:`POST`,url:e,body:t}),update:(e,t,n)=>{if(typeof n==`object`&&n)return{method:`PUT`,url:e,query:S(n),body:t};if(Array.isArray(t))return{method:`PUT`,url:e,body:t};let r=t?.id;return r==null?{method:`PUT`,url:e,body:t}:{method:`PUT`,url:`${e}/${r}`,body:t}},delete:(e,t)=>typeof t==`object`&&t&&!Array.isArray(t)?{method:`DELETE`,url:e,query:S(t)}:Array.isArray(t)?{method:`DELETE`,url:e,query:{ids:t.join(`,`)}}:{method:`DELETE`,url:`${e}/${t}`}};function ct(e){let t=[];for(let[n,r]of Object.entries(e)){if(r==null)continue;let e=Array.isArray(r)?r.join(`,`):String(r);t.push(`${encodeURIComponent(n)}=${encodeURIComponent(e)}`)}return t.join(`&`)}async function lt(e,t={}){let n=/^https?:\/\//i.test(e.url)||!t.baseUrl?e.url:`${String(t.baseUrl).replace(/\/+$/,``)}/${e.url.replace(/^\/+/,``)}`,r=e.query?ct(e.query):``,i=r?`${n}${n.includes(`?`)?`&`:`?`}${r}`:n,a={...t.headers},o;e.body!==void 0&&(o=JSON.stringify(e.body),Object.keys(a).some(e=>e.toLowerCase()===`content-type`)||(a[`Content-Type`]=`application/json`));let s=t.fetch??globalThis.fetch,c;try{c=await s(i,{method:e.method,headers:a,body:o})}catch(t){throw new ot(`资源请求网络错误: ${e.method} ${i} (${t?.message??t})`,0,i,e.method)}if(!c.ok)throw new ot(`资源请求失败: ${e.method} ${i} → ${c.status} ${c.statusText}`,c.status,i,e.method);if(c.status===204)return null;let l=await c.text(),u=l===``?null:JSON.parse(l);return t.unwrap?t.unwrap(u,e):u}var ut=new Set([`url`,`mapping`,`baseUrl`,`fetch`,`headers`,`unwrap`]);function dt(e){if(typeof e==`string`)return{url:e,inlineOptions:{},methods:{},inlineMapping:void 0};let t=typeof e.url==`string`?e.url:null,n={},r={},i;for(let[t,a]of Object.entries(e))t===`mapping`?a&&typeof a==`object`&&(i=a):ut.has(t)?a!==void 0&&(n[t]=a):typeof a==`function`&&(r[t]=a);return{url:t,inlineOptions:n,methods:r,inlineMapping:i}}function ft(e,t,n){let r=t?.options?.resources;return{...n,...r,...e}}function pt(e,t,n){return{...st,...n,...e?.options?.resources?.mapping,...t}}function mt(e,t,n,r={}){let{url:i,inlineOptions:a,methods:o,inlineMapping:s}=dt(t),c=pt(n,s,r.mapping),l={};for(let[t,n]of Object.entries(o))l[`${e}.${t}`]=n;if(i)for(let[t,o]of Object.entries(c))l[`${e}.${t}`]||(l[`${e}.${t}`]=function(...e){return lt(o(i,...e),ft(a,this?.engine??n,r))});else if(Object.keys(l).length===0)return l;return l}var ht=class{constructor(e){this._defs=new Map,this._globalOptions={},this.engine=e}get options(){return this.engine?this.engine.options.resources??={}:this._globalOptions}add(e,t){let n=typeof e==`string`?[[e,t]]:Object.entries(e);for(let[e,t]of n){if(t===void 0)continue;(this._defs.has(e)||this._hasAction(`${e}.`))&&console.warn(`[autospark] resources.add: 资源 "${e}" 重复注册，后者覆盖（ADR-0011）`),this._defs.set(e,t);let n=mt(e,t,this.engine,this._globalOptions);Object.keys(n).length===0?console.warn(`[autospark] resources.add: 资源 "${e}" 定义为空（无 url 也无方法），已跳过`):this._write(n)}}get(e){return this._defs.get(e)}has(e){return this._defs.has(e)||this._hasAction(`${e}.`)}_write(e){let t=this._actionTable();if(!t)console.warn(`[autospark] resources.add: AutoSpark 命名空间不可用（插件未自举？），全局注册未生效`);else for(let[n,r]of Object.entries(e))t[n]=r}_actionTable(){if(this.engine)return this.engine.actions;let e=ne();return e&&typeof e==`function`?e.actions:null}_hasAction(e){let t=this._actionTable();return t?Object.keys(t).some(t=>t.startsWith(e)):!1}},gt=null;function _t(){return gt??=new ht}var vt=(e,t,n)=>{let r=e.textContent?.trim();if(!r)return;let i;try{let e=Function(`return (${r})`)();if(!e||typeof e!=`object`||Array.isArray(e)){n.logger.error(`<script type="autospark/resources"> 内容须为对象字面量`);return}i=e}catch(e){n.logger.error(`<script type="autospark/resources"> 解析失败: ${e?.message??e}`);return}let a=_t().options,o=e.hasAttribute(`global`);for(let[e,r]of Object.entries(i)){let i=mt(e,r,n,a);if(Object.keys(i).length===0)n.logger.warn(`资源 "${e}" 定义为空（无 url 也无方法），已跳过（ADR-0011）`);else if(o)for(let[e,t]of Object.entries(i))n.actions[e]=t;else t?n.actionsManager.registerScoped(t,i):n.logger.warn(`资源 "${e}" 局部声明无祖先 scope（顶层游离）——加 global 属性声明 engine 级，或移入任意容器元素内`)}};function yt(){return{name:`resource`,created(){let e=(this.attr??``).trim();if(!e){this.warn(`x-resource: 缺属性参数（形态 x-resource:<资源名>="<url>"），本声明已忽略`);return}let t=String(this.value??``).trim();if(!t){this.warn(`x-resource:${e}: 缺 url 值，本声明已忽略`);return}let n=mt(e,t,this.engine,_t().options);Object.keys(n).length===0?this.warn(`x-resource:${e}: 资源展开为空（映射表不可用？），本声明已忽略`):this.engine.actionsManager.registerScoped(this.binding,n)}}}function bt(){x(e=>{h(e),e.resources||=_t(),e.scriptType(`autospark/resources`,vt),e.directive(yt()),e.ready(e=>{e.resources=new ht(e)})})}bt();var{params:xt}=AutoSpark,St=new WeakMap,Ct=new WeakMap;function wt(e,t){St.set(e,{...St.get(e),...t})}function Tt(e,t){Ct.set(e,{...Ct.get(e),...t})}function C(e){return e.trim().toLowerCase().replace(/_/g,`-`)}function w(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Et(e,t){return Object.prototype.hasOwnProperty.call(e,t)}var Dt=new Set,Ot=new Set;function kt(e){let t=e.store?.state;if(!t)return;let n=t.$?.language;if(typeof n==`string`&&n!==``)return n;let r=e.options.i18n??{},i=r.language??r.default;if(typeof i==`string`&&i!==``){try{t.$||={},t.$.language=i}catch{}return i}}function At(e,t,n){let r=[],i=!1,a=t;for(;a;){let e=St.get(a);e&&(i=!0,Et(e,n)&&w(e[n])&&r.push(e[n])),a=a.parent}let o=Ct.get(e);o&&(i=!0,Et(o,n)&&w(o[n])&&r.push(o[n]));let s=e.options.i18n?.messages;return w(s)&&(i=!0,Et(s,n)&&w(s[n])&&r.push(s[n])),{layers:r,dictPresent:i}}function jt(e,t){if(!e||!t)return;let n=C(t);if(n===``)return;for(let t of Object.keys(e))if(C(t)===n)return e[t];let r=n.split(`-`)[0];for(let t of Object.keys(e))if(C(t).split(`-`)[0]===r)return e[t]}function Mt(e,t){for(let t of e)if(typeof t==`number`)return t;if(t){for(let[e,n]of Object.entries(t))if(e.startsWith(`$`)&&typeof n==`number`)return n}}function Nt(e,t,n){let r=Mt(t,n);return r===void 0?e[e.length-1]:e[Math.min(Math.max(Math.floor(r),0),e.length-1)]}function Pt(e,t,n,...r){let i=null,a=r;r.length>=1&&w(r[0])&&(i=r[0],a=[],r.length>1&&!Ot.has(n)&&(Ot.add(n),e.logger?.warn(`t("${n}"): 对象参数与位置参数混用不受支持，复数请用 {$count} 通道——位置参数已忽略（ADR-0136）`)));let{layers:o,dictPresent:s}=At(e,t,n),c;if(o.length>0){let t=kt(e),n=e.options.i18n??{};for(let e of o)if(c=jt(e,t)??jt(e,n.fallback),c!==void 0)break}Array.isArray(c)&&(c=Nt(c,a,i));let l=c==null?n:String(c),u=i?xt(l,i):xt(l,...a);return c==null&&s&&!Dt.has(n)&&(Dt.add(n),e.logger?.warn(`t("${n}"): 字典中无当前语言的翻译（语言链与 fallback 均未命中），已按原文返回（ADR-0136）`)),u}function Ft(e){return(t,n,...r)=>Pt(e,t,n,...r)}var It=`autospark/locales`,Lt=(e,t,n)=>{let r=e.textContent?.trim();if(!r)return;let i;try{if(i=Function(`return (${r})`)(),!i||typeof i!=`object`||Array.isArray(i)){n.logger.error(`<script type="autospark/locales"> 内容须为字典对象字面量`);return}}catch(e){n.logger.error(`<script type="autospark/locales"> 解析失败: ${e?.message??e}`);return}let a=i;e.hasAttribute(`global`)||!t?Tt(n,a):wt(t,a)},{DirectiveKind:Rt}=AutoSpark;function zt(){return{name:`locales`,kind:Rt.Compile,created(){let e=this.value;if(e==null||e===``)return;let t=this.binding.read(e);t!=null&&(typeof t!=`object`||Array.isArray(t)?this.engine.logger.warn(`x-locales: 值须为字典对象（原文 → {语言码: 译文}），已忽略: ${typeof t}`):wt(this.binding,t))}}}function Bt(e){e.translate=Ft(e),kt(e);let t=e.scopes;if(t)for(let e of t.values())e.refresh()}function Vt(){x(e=>{h(e),e.scriptType(It,Lt),e.directive(zt()),e.ready(Bt)})}Vt();function Ht(e,t){return g(`getVal`)(e.store.state,t)}var Ut=[`hover`,`always`,`click`],Wt=`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`,Gt=`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`,Kt=`var(--auto-danger-color, var(--autospark-ripple-badge-color, #ef4444))`,qt=`var(--auto-danger-color, var(--autospark-spin-badge-color, #ef4444))`,Jt=2147483647,Yt=3e3;function T(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function Xt(e,t,n){let r=T(e,`speed`,t,n)??3e3;return r<=0?(t(`${n}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${Yt}`),Yt):r}function Zt(e,t,n){let r=new Set;e?.trigger!==void 0&&(Ut.includes(e.trigger)?r.add(e.trigger):t(`${n}: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let i of Ut){let a=e?.[i];a===!0?r.add(i):a!==void 0&&a!==!1&&t(`${n}: ${i} 开关须为布尔值，已忽略`)}return Ut.find(e=>r.has(e))??`always`}function Qt(e,t,n,r){let i=new Set;if(!e)return i;for(let a of t){let t=e[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return i}function $t(e,t,n,r,i){if(e)for(let a of t){let t=e[a];t!==void 0&&t!==!1&&r(`${i}: ${a} 是 ${n} 的形态键，已忽略`)}}function en(e,t,n){let r=e?.badge;return r===void 0||r===!1?0:r===!0?8:typeof r==`number`&&Number.isFinite(r)&&r>0?r:(t(`${n}: badge 须为 true 或正数字（直径 px），已忽略`),0)}function tn(e,t,n,r,i){if(e!==void 0){if(typeof e==`string`&&e.trim()!==``)return e;r(`${i}: color 须为非空字符串，已回退默认色`)}return n>0?t.badgeColor:t.color}function nn(){return`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`}function rn(e){return`position:absolute;top:${-e/2}px;right:${-e/2}px;width:${e}px;height:${e}px;border-radius:50%;pointer-events:none;display:block;z-index:${Jt};`}function an(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}var on=class{static{this.probe=an}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!Ht(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??an)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{circle:a}=t.animations(this.config),o=e=>Math.round(e*10)/10,s=this.insideCarrier.circle;s.style.left=`${o(n-i)}px`,s.style.top=`${o(r-i)}px`,s.style.width=`${o(i*2)}px`,s.style.height=`${o(i*2)}px`,s.style.animation=`none`,s.offsetWidth,s.style.animation=a}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.circle.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}},E=new WeakMap;function sn(e,t){function n(){if(!this.el)return;let e=new on(t,this.engine,this.info);e.el=this.el,E.set(this,e),e.mounted()}function r(){let e=E.get(this);E.delete(this),e?.unmounted()}function i(e){E.get(this)?.attrChanged(e)}return{name:e,kind:1,priority:0,mounted:n,unmounted:r,attrChanged:i}}function D(e){x(t=>{h(t),t.directive(e)})}var cn=[`glow`,`ring`,`echo`],ln=[`ring`,`glow`,`echo`],un=[`rotate`,`beam`,`chase`],dn={type:`echo`,trigger:`always`,inside:!1,badge:0,color:Wt,size:12,speed:3e3,gap:0},O=`x-ripple`,k=`x-ripple-on`,A=`x-ripple-echo`,fn=`x-ripple-layer`,pn=`x-ripple-badge`,mn=`x-ripple-inside`,hn=`x-ripple-inside-clip`,gn=`x-ripple-inside-circle`,_n=600,vn=.3,yn=!1,j=new Map,M=null;function bn(){if(yn||typeof document>`u`)return;yn=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-ripple`,``),e.textContent=`
:where(.${O}) { position: relative; }
.${O} {
  --x-ripple-color: ${Wt};
  --x-ripple-size: 12px;
  --x-ripple-duration: 3000ms;
  --x-ripple-anim: x-ripple-echo-3000-0;
  --x-ripple-echo-delay: -1500ms;
  --x-ripple-echo-size: 7.2px;
  --x-ripple-badge-size: 8px;
}
.${O}.${k}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
}
.${O}.${k}.${A}::before {
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
.${O}.${pn}.${k}::after {
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
.${O}.${pn}.${k}.${A}::before {
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
  .${O}.${k}::after,
  .${O}.${k}.${A}::before { animation: none; }
  /* inside 填充圆动画走内联 style——类规则 !important 压过内联（可访问性底线同家族） */
  .${gn} { animation: none !important; }
}`,document.head.appendChild(e)}function xn(e){let t=`${e.type}|${e.speed}|${e.gap}`,n=j.get(t);if(n)return n;let r=`x-ripple-${e.type}-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=i>0?Math.round(e.speed/i*100):100,o;return o=e.type===`glow`?`
  0% { box-shadow: 0 0 0 0 transparent; }
  ${Math.round(a/2)}% { box-shadow: 0 0 var(--x-ripple-size) 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`:`
  0% { box-shadow: 0 0 0 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }`,M||(M=document.createElement(`style`),M.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(M)),M.textContent+=`\n@keyframes ${r} {${o}\n}`,j.set(t,r),r}function Sn(e){let t=`inside|${e.speed}|${e.gap}`,n=j.get(t);if(n)return n;let r=`x-ripple-inside-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=`
  0% { transform: scale(0); opacity: var(--x-ripple-inside-alpha, ${vn}); }
  ${i>0?Math.round(e.speed/i*100):100}% { transform: scale(1); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }`;return M||(M=document.createElement(`style`),M.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(M)),M.textContent+=`\n@keyframes ${r} {${a}\n}`,j.set(t,r),r}function Cn(e,t,n){let r=e.offsetWidth,i=e.offsetHeight,a=r/2,o=i/2;if(n){let t=e.getBoundingClientRect();a=n.clientX-t.left,o=n.clientY-t.top}let s=Math.max(a,r-a),c=Math.max(o,i-o);return{x:a,y:o,r:Math.hypot(s,c)}}function wn(e){return e.trigger===`click`?0:-(e.speed+e.gap)/2}function Tn(e){return e.trigger===`click`?Math.round(e.size*.6*10)/10:e.size}function En(e,t){let n={...dn};if(!e)return n;let r=Qt(e,ln,t,`x-ripple`);e.type!==void 0&&(ln.includes(e.type)?r.add(e.type):t(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let i=cn.find(e=>r.has(e));return i&&(n.type=i),$t(e,un,`x-spin`,t,`x-ripple`),e.inside!==void 0&&(e.inside===!0?n.inside=!0:e.inside!==!1&&t(`x-ripple: inside 开关须为布尔值，已忽略`)),n.trigger=Zt(e,t,`x-ripple`),n.badge=en(e,t,`x-ripple`),n.inside&&n.badge>0&&(t(`x-ripple: badge 与 inside 互斥，badge 优先（inside 已忽略）`),n.inside=!1),n.color=tn(e.color,{color:Wt,badgeColor:Kt},n.badge,t,`x-ripple`),n.size=T(e,`size`,t,`x-ripple`)??dn.size,n.speed=Xt(e,t,`x-ripple`),n.gap=T(e,`gap`,t,`x-ripple`)??0,n.inside&&(r.size>0&&t(`x-ripple: inside 接管渲染，type 形态词表已忽略`),e.size!==void 0&&t(`x-ripple: inside 半径自动几何（起点到最远角），size 已忽略`),e.speed===void 0&&(n.speed=_n)),n}var Dn={hostClass:O,activeClass:k,layerClass:fn,ensureStyles:bn,normalize:En,hostClasses:e=>[...e.badge>0?[pn]:[],...e.inside?[mn]:[]],activeClasses:e=>e.type===`echo`&&!e.inside?[A]:[],animName:e=>xn(e),animationCss:(e,t)=>`${t} ${e.speed+e.gap}ms ease-out infinite`,period:e=>e.speed+e.gap,layerCount:e=>e.type===`echo`?2:1,layerCssText:e=>e.badge>0?`${rn(e.badge)}background:var(--x-ripple-color);`:nn(),applyLayerExtras:(e,t)=>{let n=e[1];n&&(n.style.animationDelay=`${wn(t)}ms`,n.style.setProperty(`--x-ripple-size`,`${Tn(t)}px`))},applyVars:(e,t,n)=>{let r=e.style;r.setProperty(`--x-ripple-color`,t.color||`var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`),r.setProperty(`--x-ripple-size`,`${t.size}px`),r.setProperty(`--x-ripple-duration`,`${t.speed+t.gap}ms`),r.setProperty(`--x-ripple-anim`,n),r.setProperty(`--x-ripple-echo-delay`,`${wn(t)}ms`),r.setProperty(`--x-ripple-echo-size`,`${Tn(t)}px`),t.badge>0&&r.setProperty(`--x-ripple-badge-size`,`${t.badge}px`)},inside:{enabled:e=>e.inside,createCarrier:()=>{let e=document.createElement(`span`);e.className=hn,e.style.cssText=`position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none;display:block;`;let t=document.createElement(`span`);return t.className=gn,t.style.cssText=`position:absolute;border-radius:50%;background:var(--x-ripple-color);pointer-events:none;display:block;`,e.append(t),{clip:e,circle:t}},geometry:Cn,animations:e=>({circle:`${Sn(e)} ${e.speed+e.gap}ms ease-out infinite`})}};function On(){D(sn(`ripple`,Dn))}On();var kn=[`chase`,`rotate`,`beam`],An=[`rotate`,`beam`,`chase`],jn=[`ring`,`glow`,`echo`],Mn={type:`beam`,trigger:`always`,badge:0,color:Gt,size:4,speed:3e3},N=`x-spin`,P=`x-spin-on`,Nn=`x-spin-layer`,Pn=`x-spin-badge`,F=e=>`${N}-${e}`,Fn=`x-spin-angle`,In=!1;function I(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`}}var Ln=`padding:var(--x-spin-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`;function Rn(){if(In||typeof document>`u`)return;In=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spin`,``),e.textContent=`
@property --x-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${Fn} { to { --x-spin-angle: 360deg; } }
:where(.${N}) { position: relative; }
.${N} {
  --x-spin-color: ${Gt};
  --x-spin-size: 4px;
  --x-spin-duration: 3000ms;
  --x-spin-badge-size: 8px;
}
.${N}.${P}::after {
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
  animation: ${Fn} var(--x-spin-duration) linear infinite;
}
.${N}.${Pn}.${P}::after {
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
.${N}.${F(`rotate`)}.${P}::after {
  background: ${I(`rotate`)};
}
.${N}.${F(`beam`)}.${P}::after {
  background: ${I(`beam`)};
}
.${N}.${F(`chase`)}.${P}::after {
  background: ${I(`chase`)};
}
@media (prefers-reduced-motion: reduce) {
  .${N}.${P}::after { animation: none; }
}`,document.head.appendChild(e)}function zn(e,t){let n={...Mn};if(!e)return n;let r=Qt(e,An,t,`x-spin`);e.type!==void 0&&(An.includes(e.type)?r.add(e.type):t(`x-spin: type 取值非法（${JSON.stringify(e.type)}），已回退 "beam"`));let i=kn.find(e=>r.has(e));return i&&(n.type=i),$t(e,jn,`x-ripple`,t,`x-spin`),e.gap!==void 0&&t(`x-spin: gap 仅涟漪支持（x-spin 恒转无静止段），已忽略`),n.trigger=Zt(e,t,`x-spin`),n.badge=en(e,t,`x-spin`),n.color=tn(e.color,{color:Gt,badgeColor:qt},n.badge,t,`x-spin`),n.size=T(e,`size`,t,`x-spin`)??Mn.size,n.speed=Xt(e,t,`x-spin`),n}var Bn={hostClass:N,activeClass:P,layerClass:Nn,ensureStyles:Rn,normalize:zn,hostClasses:e=>[F(e.type),...e.badge>0?[Pn]:[]],activeClasses:()=>[],animName:()=>Fn,animationCss:(e,t)=>`${t} ${e.speed}ms linear infinite`,period:e=>e.speed,layerCount:()=>1,layerCssText:e=>e.badge>0?`${rn(e.badge)}${Ln}background:${I(e.type)};`:`${nn()}${Ln}background:${I(e.type)};`,applyVars:(e,t)=>{let n=e.style;n.setProperty(`--x-spin-color`,t.color||`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`),n.setProperty(`--x-spin-size`,`${t.size}px`),n.setProperty(`--x-spin-duration`,`${t.speed}ms`),t.badge>0&&n.setProperty(`--x-spin-badge-size`,`${t.badge}px`)}};function Vn(){D(sn(`spin`,Bn))}Vn();var L={axis:`both`,width:12,thumbWidth:5,color:`var(--autospark-scrollbar-color, rgba(0,0,0,0.25))`,delay:300,fadeDuration:200,minSize:20},Hn=.25,R=`x-scrollbar`,z=`x-scrollbar-visible`,B=`x-scrollbar-active-x`,V=`x-scrollbar-active-y`,H=`x-scrollbar-rail`,U=`x-scrollbar-rail-x`,W=`x-scrollbar-rail-y`,G=`x-scrollbar-thumb`,K=`x-scrollbar-thumb-drag`,Un=!1;function Wn(){if(Un||typeof document>`u`)return;Un=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-scrollbar`,``),e.textContent=`
:where(.${R}) { position: relative; }
.${R} {
  scrollbar-width: none;
  -ms-overflow-style: none;
  --x-scrollbar-width: 12px;
  --x-scrollbar-thumb: 5px;
  --x-scrollbar-color: rgba(0,0,0,0.25);
  --x-scrollbar-fade: 200ms;
}
.${R}::-webkit-scrollbar { width: 0; height: 0; display: none; }
.${R} .${H} {
  position: absolute;
  display: none;
  opacity: 0;
  transition: opacity var(--x-scrollbar-fade, 200ms) ease;
  pointer-events: none;
  /* 补偿 transform 与合成线程滚动同层应用，减轻 scroll 事件后置补偿的滞后抖动 */
  will-change: transform;
}
.${R}.${V} .${W} { display: block; }
.${R}.${B} .${U} { display: block; }
.${R}.${z} .${H} {
  opacity: 1;
  pointer-events: auto;
}
/* 默认贴宿主内缘全长（thumb 可走满全程）；对向激活时才让位（互向不重叠，点击目标无歧义） */
.${R} .${W} {
  top: 2px;
  right: 2px;
  bottom: 2px;
  width: var(--x-scrollbar-width, 12px);
}
.${R} .${U} {
  left: 2px;
  bottom: 2px;
  right: 2px;
  height: var(--x-scrollbar-width, 12px);
}
.${R}.${B} .${W} {
  bottom: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${R}.${V} .${U} {
  right: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${R} .${G} {
  position: absolute;
  /* 滑块恒无边框——thumb/rail 是裸 span，宿主页面的全局/元素级边框规则可误中，皮肤自持 */
  border: none;
  border-radius: calc(var(--x-scrollbar-thumb, 5px) / 2);
  background: var(--x-scrollbar-color, rgba(0,0,0,0.25));
  user-select: none;
}
.${R} .${W} .${G} {
  right: 0;
  width: var(--x-scrollbar-thumb, 5px);
}
.${R} .${U} .${G} {
  bottom: 0;
  height: var(--x-scrollbar-thumb, 5px);
}
/* hover / 拖拽增粗（+5px，观感反馈内置，perfect-scrollbar 同款节奏） */
.${R} .${W}:hover .${G},
.${R} .${W} .${K} {
  width: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
.${R} .${U}:hover .${G},
.${R} .${U} .${K} {
  height: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
@media (prefers-reduced-motion: reduce) {
  .${R} .${H} { transition: none; }
}`,document.head.appendChild(e)}function Gn(e,t){let n={...L};if(!e)return n;let r=new Set;for(let n of[`x`,`y`]){let i=e[n];i===!0?r.add(n):i!==void 0&&i!==!1&&t(`x-scrollbar: ${n} 开关须为布尔值，已忽略`)}return r.size===1&&(n.axis=r.has(`x`)?`x`:`y`),n.width=T(e,`width`,t,`x-scrollbar`)??L.width,n.thumbWidth=T(e,`thumbWidth`,t,`x-scrollbar`)??L.thumbWidth,n.delay=T(e,`delay`,t,`x-scrollbar`)??L.delay,n.minSize=T(e,`minSize`,t,`x-scrollbar`)??L.minSize,n.fadeDuration=T(e,`fadeDuration`,t,`x-scrollbar`)??L.fadeDuration,e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-scrollbar: color 须为非空字符串，已回退默认色`)),n}var Kn=class e{static scheduleFrame(e){return requestAnimationFrame(e)}static cancelFrame(e){cancelAnimationFrame(e)}constructor(e,t){this.alive=!0,this.enabled=!0,this.drag=null,this.railX=null,this.railY=null,this.thumbX=null,this.thumbY=null,this.hideTimer=null,this.ro=null,this.valueOff=null,this.offs=[],this.wheel=null,this.engine=e,this.info=t,this.value=t?.value,this.config=Gn(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(Wn(),this.applyVars(),this.bindValue(),this.enabled&&this.setup())}unmounted(){this.teardown(),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}if(this.value===`false`){this.setEnabled(!1);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!Ht(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.setup():this.teardown())}setup(){let e=this.el;e&&!this.railY&&(e.classList.add(R),this.applyVars(),this.buildRails(),this.bindEvents(),typeof ResizeObserver<`u`&&(this.ro=new ResizeObserver(()=>this.refresh()),this.ro.observe(e)),setTimeout(()=>this.refresh(),0),this.refresh())}teardown(){this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=null,this.wheel&&=(this.wheel.raf&&e.cancelFrame(this.wheel.raf),null),this.ro?.disconnect(),this.ro=null;for(let e of this.offs)e();this.offs=[],this.endDrag(!0),this.railX?.remove(),this.railY?.remove(),this.railX=this.railY=this.thumbX=this.thumbY=null,this.el?.classList.remove(R,z,B,V)}buildRails(){let e=e=>{let t=document.createElement(`span`);t.className=`${H} ${e}`;let n=document.createElement(`span`);return n.className=G,t.appendChild(n),this.el.appendChild(t),{rail:t,thumb:n}},t=e(W);this.railY=t.rail,this.thumbY=t.thumb;let n=e(U);this.railX=n.rail,this.thumbX=n.thumb}applyVars(){let e=this.el.style;e.setProperty(`--x-scrollbar-width`,`${this.config.width}px`),e.setProperty(`--x-scrollbar-thumb`,`${this.config.thumbWidth}px`),e.setProperty(`--x-scrollbar-color`,this.config.color),e.setProperty(`--x-scrollbar-fade`,`${this.config.fadeDuration}ms`)}listen(e,t,n){e.addEventListener(t,n),this.offs.push(()=>e.removeEventListener(t,n))}bindEvents(){let e=this.el;this.listen(e,`mouseenter`,()=>{this.refresh(),this.show()}),this.listen(e,`mouseleave`,()=>this.scheduleHide()),this.listen(e,`scroll`,()=>{this.drag||this.wheel||(this.updateThumb(`y`),this.updateThumb(`x`))}),this.bindWheel(),this.bindRail(`y`,this.railY,this.thumbY),this.bindRail(`x`,this.railX,this.thumbX)}bindWheel(){this.listen(this.el,`wheel`,e=>{if(e.ctrlKey||this.drag)return;let t=this.el,n=e.deltaMode===1?16:1,r=e.deltaY*n,i=e.deltaX*n,a=t.scrollHeight-t.clientHeight,o=t.scrollWidth-t.clientWidth,s=r!==0&&a>0&&!(r<0&&t.scrollTop<=0)&&!(r>0&&t.scrollTop>=a),c=i!==0&&o>0&&!(i<0&&t.scrollLeft<=0)&&!(i>0&&t.scrollLeft>=o);if(!s&&!c)return;e.preventDefault();let l=this.wheel??={tx:t.scrollLeft,ty:t.scrollTop,raf:0};s&&(l.ty=Math.min(Math.max(l.ty+r,0),a)),c&&(l.tx=Math.min(Math.max(l.tx+i,0),o)),l.raf===0&&this.runWheel()})}runWheel(){let t=this.wheel,n=()=>{t.raf=0;let r=this.el;if(!r||!this.enabled||!this.wheel){this.wheel=null;return}let i=!0,a=t.ty-r.scrollTop;Math.abs(a)>=1?(r.scrollTop+=a*Hn,i=!1):a!==0&&(r.scrollTop=t.ty);let o=t.tx-r.scrollLeft;Math.abs(o)>=1?(r.scrollLeft+=o*Hn,i=!1):o!==0&&(r.scrollLeft=t.tx),this.updateThumb(`y`),this.updateThumb(`x`),i?this.wheel=null:t.raf=e.scheduleFrame(n)};t.raf=e.scheduleFrame(n)}bindRail(e,t,n){this.listen(n,`pointerdown`,r=>this.dragStart(e,r,n,t)),this.listen(n,`pointermove`,e=>this.dragMove(e)),this.listen(n,`pointerup`,e=>this.dragEnd(e)),this.listen(n,`pointercancel`,()=>this.endDrag(!0)),this.listen(t,`pointerdown`,r=>{if(r.button!==0||r.target!==t)return;r.preventDefault();let i=this.el,a=t.getBoundingClientRect(),o=e===`y`?r.clientY-a.top:r.clientX-a.left,s=e===`y`?n.offsetTop:n.offsetLeft,c=e===`y`?i.clientHeight:i.clientWidth;e===`y`?i.scrollTop+=o<s?-c:c:i.scrollLeft+=o<s?-c:c,this.updateThumb(`y`),this.updateThumb(`x`)})}refresh(){if(!this.enabled||!this.el)return;let e=this.el,t=this.config.axis!==`x`&&e.clientHeight>0&&e.scrollHeight>e.clientHeight,n=this.config.axis!==`y`&&e.clientWidth>0&&e.scrollWidth>e.clientWidth;e.classList.toggle(V,t),e.classList.toggle(B,n),t&&this.updateThumb(`y`),n&&this.updateThumb(`x`)}updateThumb(e){let t=this.el,n=e===`y`?this.railY:this.railX,r=e===`y`?this.thumbY:this.thumbX;if(!t||!n||!r)return;let i=e===`y`?t.clientHeight:t.clientWidth,a=e===`y`?t.scrollHeight:t.scrollWidth,o=e===`y`?t.scrollTop:t.scrollLeft;if(a<=i)return;let s=e===`y`?n.offsetHeight:n.offsetWidth;if(s<=0)return;let c=Math.round(Math.min(s,Math.max(this.config.minSize,i/a*s))),l=a-i,u=Math.round(o/l*(s-c));n.style.transform=`translate(${t.scrollLeft}px, ${t.scrollTop}px)`,e===`y`?(r.style.height=`${c}px`,r.style.top=`${u}px`):(r.style.width=`${c}px`,r.style.left=`${u}px`)}show(){this.hideTimer!=null&&(clearTimeout(this.hideTimer),this.hideTimer=null),this.el?.classList.add(z)}scheduleHide(){this.drag||(this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=setTimeout(()=>{this.hideTimer=null,this.el?.classList.remove(z)},this.config.delay))}dragStart(e,t,n,r){if(t.button!==0||this.drag)return;t.preventDefault(),this.show();let i=e===`y`?r.offsetHeight:r.offsetWidth;this.drag={axis:e,pointerId:t.pointerId,start:e===`y`?t.clientY:t.clientX,startScroll:e===`y`?this.el.scrollTop:this.el.scrollLeft,railLen:i,thumbLen:e===`y`?n.offsetHeight:n.offsetWidth,thumb:n},n.classList.add(K);try{n.setPointerCapture(t.pointerId)}catch{}}dragMove(e){let t=this.drag;if(!t||e.pointerId!==t.pointerId)return;let n=this.el,r=t.axis,i=r===`y`?n.clientHeight:n.clientWidth,a=r===`y`?n.scrollHeight:n.scrollWidth,o=t.railLen-t.thumbLen;if(o<=0)return;let s=(r===`y`?e.clientY:e.clientX)-t.start,c=t.startScroll+s/o*(a-i);r===`y`?n.scrollTop=c:n.scrollLeft=c,this.updateThumb(`y`),this.updateThumb(`x`),this.updateThumb(r===`y`?`x`:`y`)}dragEnd(e){if(!this.drag||e.pointerId!==this.drag.pointerId)return;this.endDrag(!1);let t=this.el.getBoundingClientRect();e.clientX>=t.left&&e.clientX<=t.right&&e.clientY>=t.top&&e.clientY<=t.bottom?this.show():this.scheduleHide()}endDrag(e){let t=this.drag;if(t){this.drag=null,t.thumb.classList.remove(K);try{t.thumb.releasePointerCapture(t.pointerId)}catch{}e||this.refresh()}}},q=new WeakMap;function qn(){function e(){if(!this.el)return;let e=new Kn(this.engine,this.info);e.el=this.el,q.set(this,e),e.mounted()}function t(){let e=q.get(this);q.delete(this),e?.unmounted()}function n(e){q.get(this)?.attrChanged(e)}return{name:`scrollbar`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function Jn(){D(qn())}Jn();var Yn={type:`dot`,overflowCount:99,color:`var(--auto-danger-color, var(--autospark-badge-color, #ef4444))`,ripple:!1},J=`x-badge`,Y=`x-badge-mark`,Xn=`x-badge-dot`,Zn=`x-badge-count`,X=`x-badge-ripple`,Qn=`x-badge-waves`,$n=!1;function er(){if($n||typeof document>`u`)return;$n=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-badge`,``),e.textContent=`
:where(.${J}) { position: relative; }
.${J} {
  --x-badge-color: var(--auto-danger-color, var(--autospark-badge-color, #ef4444));
}
.${J} .${Y} {
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
.${J} .${Y}.${Xn} {
  width: 8px;
  height: 8px;
  padding: 0;
}
/* count：数字胶囊——高 16 / 字号 12 / 水平 padding 4 / min-width 16（单数字正圆、多位自适应） */
.${J} .${Y}.${Zn} {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  color: #fff;
}
/* dot + ripple：SMIL 扩散环 SVG——mark 背景即中心点，环自圆边（viewBox r=4）向外扩散 */
.${J} .${Qn} {
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
.${J} .${Y}.${X}::before,
.${J} .${Y}.${X}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 1px solid var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  animation: x-badge-pulse 2s ease-out infinite;
}
.${J} .${Y}.${X}::after {
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
  .${J} .${Y}.${X}::before,
  .${J} .${Y}.${X}::after {
    animation: none;
  }
}`,document.head.appendChild(e)}function tr(e,t){let n={...Yn};if(!e)return n;e.type!==void 0&&(e.type===`dot`||e.type===`count`?n.type=e.type:e.type!==!0&&e.type!==!1&&t(`x-badge: type 须为 'dot' | 'count'，已回退默认 '${Yn.type}'`));let r=e.count===!0?`count`:e.dot===!0?`dot`:null;r&&(e.type===void 0||typeof e.type==`boolean`)&&(n.type=r);let i=T(e,`overflowCount`,t,`x-badge`);if(i!==void 0){let e=Math.floor(i);e>0?n.overflowCount=e:t(`x-badge: overflowCount 须为正数，已回退默认 ${Yn.overflowCount}`)}return e.ripple!==void 0&&(typeof e.ripple==`boolean`?n.ripple=e.ripple:t(`x-badge: ripple 须为布尔值，已忽略`)),e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-badge: color 须为非空字符串，已回退默认色`)),n}var nr=class{constructor(e,t){this.alive=!0,this.mark=null,this.valueOff=null,this.reducedMotion=typeof matchMedia==`function`&&matchMedia(`(prefers-reduced-motion: reduce)`).matches,this.engine=e,this.info=t,this.value=t?.value,this.config=tr(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(er(),this.el.classList.add(J),this.applyVars(),this.bindValue())}unmounted(){this.unmountMark(),this.el?.classList.remove(J),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.render(void 0);return}if(/^\d+$/.test(this.value.trim())){this.render(Number(this.value));return}let e=this.value,t=({value:e})=>{this.alive&&this.render(e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.render(r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.render(Ht(this.engine,e))}}render(e){let t=Number(e);if(e==null||e===``||e===!1||!Number.isFinite(t)||t<=0){this.config.type===`dot`&&this.value==null?this.mountMark():this.unmountMark();return}if(this.config.type===`dot`){this.mountMark();return}this.mountMark();let{overflowCount:n}=this.config;this.mark.textContent=t>n?`${n}+`:String(t)}mountMark(){if(this.mark)return;let{type:e,ripple:t}=this.config,n=document.createElement(`span`);n.className=`${Y} ${e===`count`?Zn:Xn}`,n.setAttribute(`aria-hidden`,`true`),t&&n.classList.add(X),e===`dot`&&t&&!this.reducedMotion&&n.insertAdjacentHTML(`afterbegin`,rr()),this.el.appendChild(n),this.mark=n}unmountMark(){this.mark?.remove(),this.mark=null}applyVars(){this.el.style.setProperty(`--x-badge-color`,this.config.color)}};function rr(){let e=e=>`<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.35"><animate attributeName="r" values="4;11" dur="2s" begin="${e}" repeatCount="indefinite" /><animate attributeName="fill-opacity" values="0.35;0" dur="2s" begin="${e}" repeatCount="indefinite" /></circle>`;return`<svg class="${Qn}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`+e(`0s`)+e(`-1s`)+`</svg>`}var Z=new WeakMap;function ir(){function e(){if(!this.el)return;let e=new nr(this.engine,this.info);e.el=this.el,Z.set(this,e),e.mounted()}function t(){let e=Z.get(this);Z.delete(this),e?.unmounted()}function n(e){Z.get(this)?.attrChanged(e)}return{name:`badge`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function ar(){D(ir())}ar();function Q(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function $(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function or(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var sr=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主，根上的动态\r
    绑定不会求值——布局变体绑定全部落在编译子树内层 body 上（:data-vertical /\r
    :data-block / :data-fused / :style gap），宿主级 block 布局经 :has() 驱动。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - change：选中模式（x-model 在场）点击子钮切换后冒泡，detail = { value: 新组值 }——\r
      表单同步惯用法：外层包裹元素 @change="v = $event.detail.value"\r
-->\r
<!-- 元素名快速写法 <x-button-group> 由 index.ts 的 precompile DOM 变换承载：组变换\r
     须先于 button 变换执行（聚合入口 import 顺序 + 脚本加载顺序契约），承担子钮\r
     缺省下发（variant/type/disabled）与 data-value stamp（选中模式子钮身份） -->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键，名即通道）——宿主化身根物化为同名 data-* 属性，级联整组子钮形成局部主题\r
     （正好承担「一组统一档位」通道）。组件 data() 不得声明这六键；组无自有视觉盒\r
     （布局容器），无暗色兜底字面值需求——视觉全由子钮承担 -->\r
<div\r
  class="asc-button-group"\r
  x-define="autospark.button-group"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            gap: 0,            // 子钮间隔（number 按 px / 字符串原样作 CSS gap 值）；0（缺省）即融合\r
            vertical: false,   // 垂直组合（融合轴自动换上下边线/上下圆角）\r
            block: false,      // 容器占满父宽（不强制子钮等分——等分需求使用者自行 CSS）\r
            value: "",         // 受控选中值（选中模式的当前子钮 data-value；props 单向驱动视觉）\r
            modelBound: false, // x-model 在场标记（precompile 检测 x-model 属性塞入——内部键非公开 API；\r
                               // true 时激活选中协调：单选排他 + 组值桥 + 隐藏 input）\r
        }),\r
        mounted() {\r
            // 选中协调激活（ADR-0014 决策 4/6——ADR-0012 决策 3 checkable 半双工家族范式移植）：\r
            // x-model 在场（modelBound）**或**显式受控 value（props 单向 + 点击翻转 + change\r
            // 冒泡）——两者皆无 = 纯布局组（工具栏用法），本块整体不激活：无选中态、无点击协调。\r
            // el.value 劫持桥与隐藏 input 仅 modelBound 场景（组值回写 state 与表单提交载体）。\r
            const bound = !!this.data.modelBound || (this.data.value != null && this.data.value !== "");\r
            if (!bound) return;\r
\r
            // 子钮查询（data-value stamp 通道，index.ts precompile 落的属性）\r
            const buttons = () => Array.from(this.el.querySelectorAll(".asc-button"));\r
\r
            // 当前选中值（字符串语域——组值是子钮 data-value 字符串，区别于 button checkable\r
            // 桥的布尔语域）\r
            let current = "";\r
\r
            // 隐藏 input（仅 modelBound）：表单提交载体（name 有则透传、value = 选中值、display:none）\r
            let real = null;\r
\r
            // 选中标记迁移：组自有 class（不碰子钮 checkable 的 asc-checked 通道，两机制零冲突）；\r
            // 选中视觉 = tone 实底反白（CSS 内消费子钮作用域已算好的 --asc-tone）\r
            const applySel = (v) => {\r
                if (real) real.value = v;\r
                for (const b of buttons()) b.classList.toggle("asc-group-checked", b.getAttribute("data-value") === v);\r
            };\r
\r
            if (this.data.modelBound) {\r
                real = document.createElement("input");\r
                real.type = "hidden";\r
                real.style.display = "none";\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) real.name = nameAttr;\r
                this.el.appendChild(real);\r
                // el.value 劫持：div 无原生 value，劫持前快照 expando（x-model 编译期可能已写入初值）\r
                const prior = this.el.value;\r
                if (typeof prior === "string" && prior !== "") current = prior;\r
                Object.defineProperty(this.el, "value", {\r
                    get: () => current,\r
                    set: (v) => { current = String(v ?? ""); applySel(current); },\r
                    configurable: true,\r
                });\r
            }\r
\r
            // 一跳首对齐（mounted 时化身子树与 props 均可能未就位，button 家族惯例）：\r
            // current 为空（无 x-model 初值）时重读 props value（晚注入场景），再迁移选中标记\r
            setTimeout(() => {\r
                const dv = this.data.value;\r
                if (current === "" && dv != null && dv !== "") current = String(dv);\r
                applySel(current);\r
            }, 0);\r
\r
            // props value 受控通道（无 x-model 时亦生效）：单向驱动视觉——同值短路防循环；\r
            // 空值跳过（x-model 场景未声明 value prop，data.value 缺省 "" 不得清空选中）\r
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法）\r
            this.watch("value", ({ value: v }) => {\r
                if (v == null || v === "") return;\r
                const s = String(v);\r
                if (s !== current) { current = s; applySel(s); }\r
            });\r
\r
            // 点击选中（组根委托）：命中子钮读 data-value；无值钮不参与；已选不反选（radio 语义）；\r
            // 翻转后 modelBound 场景派发 input（x-model 回写，监听在宿主自身），恒派发 change\r
            // （冒泡 detail={value}，外层 @change="v = $event.detail.value" 一行回写）\r
            this.el.addEventListener("click", (e) => {\r
                const btn = e.target instanceof Element ? e.target.closest(".asc-button") : null;\r
                if (!btn || !this.el.contains(btn) || btn.disabled) return;\r
                const v = btn.getAttribute("data-value");\r
                if (v == null || v === current) return;\r
                current = v;\r
                applySel(v);\r
                if (this.data.modelBound) this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: v } }));\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-button-group">\r
    /* 组为纯布局容器无自有视觉盒：无背景/边框/字色字面值，暗色由子钮各自承担——\r
       组级无暗色兜底变体（无字面值即无暗色差异） */\r
    .asc-button-group {\r
      display: inline-flex;\r
      vertical-align: middle; /* inline-flex 行内基线对齐修正（子钮行内元素惯例） */\r
      max-width: 100%;\r
    }\r
    /* 布局容器：body 是编译子树内层（绑定可求值），子钮经 items 的 display:contents\r
         直接成为 body 的 flex 项（x-for 克隆载体同款技巧——出口盒不产生布局盒；\r
         x-slot 出口元素保留为真实包裹层不剥标签，ADR-0056——无此规则则子钮嵌在\r
         出口 span 内：融合相邻选择器不命中、gap/等高拉伸全部失效） */\r
    .asc-button-group-body {\r
      display: flex;\r
      align-items: stretch; /* 水平融合等高 / 垂直融合等宽 */\r
      width: 100%;\r
      min-width: 0;\r
    }\r
    /* 默认插槽出口盒不产生布局盒：子钮穿透为 body 的直接 flex 项 */\r
    .asc-button-group-items {\r
      display: contents;\r
    }\r
    /* 垂直组合：换轴（融合轴随 data-vertical 自动切换，见下方融合规则） */\r
    .asc-button-group-body[data-vertical="true"] {\r
      flex-direction: column;\r
    }\r
    /* block：容器占满父宽（子钮不强制等分——等分需求使用者自行 CSS） */\r
    .asc-button-group:has(> .asc-button-group-body[data-block="true"]) {\r
      display: flex;\r
      width: 100%;\r
    }\r
    /* 间隔：gap 经 :style 内联承载（number 按 px / 字符串原样，indent 同款惯例），\r
         data-fused 仅在 gap 假值（缺省 0）时在场（绑定假值移除） */\r
\r
    /* ---------- 融合（gap=0，ADR-0014 决策 2）：相邻子钮侧圆角清除 + 负 margin 边线复用 ---------- */\r
    /* 水平：有后邻的钮清尾侧（右）圆角；有前邻的钮清首侧（左）圆角并压叠 1px（后钮边线\r
         绘制在上——异色分界取后钮色；后钮透明边线时前钮边线透出，分界恒在） */\r
    .asc-button-group-body[data-fused="true"] .asc-button:has(+ .asc-button) {\r
      border-start-end-radius: 0;\r
      border-end-end-radius: 0;\r
    }\r
    .asc-button-group-body[data-fused="true"] .asc-button + .asc-button {\r
      border-start-start-radius: 0;\r
      border-end-start-radius: 0;\r
      margin-inline-start: calc(\r
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))\r
      );\r
    }\r
    /* 垂直：融合轴换上下（有后邻清下侧、有前邻清上侧并压叠） */\r
    .asc-button-group-body[data-fused="true"][data-vertical="true"]\r
      .asc-button:has(+ .asc-button) {\r
      border-end-start-radius: 0;\r
      border-end-end-radius: 0;\r
    }\r
    .asc-button-group-body[data-fused="true"][data-vertical="true"]\r
      .asc-button\r
      + .asc-button {\r
      border-start-start-radius: 0;\r
      border-start-end-radius: 0;\r
      margin-inline-start: 0;\r
      margin-block-start: calc(\r
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))\r
      );\r
    }\r
    /* 交互/选中钮浮于压叠之上：负 margin 重叠 1px 会令后钮背景盖前钮边缘（选中实底\r
         钮右缘被切、hover 边缘错位）——交互中的钮抬层级保边缘干净 */\r
    .asc-button-group-body[data-fused="true"] .asc-button:hover,\r
    .asc-button-group-body[data-fused="true"] .asc-button.asc-group-checked {\r
      position: relative;\r
      z-index: 1;\r
    }\r
\r
    /* ---------- 选中视觉（选中模式，ADR-0014 决策 7）：tone 实底反白（solid 语义） ---------- */\r
    /* 组自有 class 驱动（区别于子钮 checkable 的 asc-checked）；--asc-tone 在子钮作用域\r
         由其 data-type 决定（组级 type 下发后语义色正确），暗色经变量链自适应无需兜底 */\r
    .asc-button-group .asc-button.asc-group-checked {\r
      --asc-bg: var(--asc-tone) !important;\r
      --asc-ink: #fff !important;\r
      --asc-line: transparent !important;\r
    }\r
  </style>\r
  <!-- 布局变体绑定全在本层（根上动态绑定不求值，T4=B）；gap 双形态经 :style 内联\r
         （number 按 px / 字符串原样）；data-fused 绑定假值（gap=0 时 !gap 为 true） -->\r
  <span\r
    class="asc-button-group-body"\r
    :data-vertical="vertical"\r
    :data-block="block"\r
    :data-fused="!gap"\r
    :style="gap ? { gap: (typeof gap === 'number' ? gap + 'px' : gap) } : undefined"\r
  >\r
    <!-- 默认插槽出口：子钮（x-button 变换后的 button 元素）投影于此；display:contents\r
             使子钮直接成为 body 的 flex 项（融合/间隔/stretch 作用于子钮本身） -->\r
    <span class="asc-button-group-items" x-slot></span>\r
  </span>\r
</div>\r
`,cr=`autospark.button-group`,lr=[`variant`,`type`,`disabled`],ur=new Set([`vertical`,`block`]);function dr(e){e.components[cr]=sr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button-group`))){let e=Array.from(t.querySelectorAll(`x-button`)).filter(e=>e.closest(`x-button-group`)===t),n=new Map;for(let e of lr)t.hasAttribute(e)&&n.set(e,t.getAttribute(e)),t.hasAttribute(`:${e}`)&&n.set(`:${e}`,t.getAttribute(`:${e}`));for(let t of e){let e=t.getAttribute(`value`);e!=null&&t.setAttribute(`data-value`,e);for(let[e,r]of n)t.hasAttribute(e)||t.hasAttribute(`:${e.slice(1)}`)||t.setAttribute(e,e.startsWith(`:`)?r:e===`disabled`?`true`:r)}let r=document.createElement(`div`),i=[];for(let e of Array.from(t.attributes)){if(e.name.startsWith(`:`)){i.push(`${$(Q(e.name.slice(1)))}: (${e.value})`);continue}if(e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)){r.setAttribute(e.name,e.value);continue}let t=Q(e.name),n=e.value===``&&ur.has(t)?!0:or(e.value);i.push(`${$(t)}: ${JSON.stringify(n)}`)}for(t.hasAttribute(`x-model`)&&i.push(`modelBound: true`),r.setAttribute(`x-component:${cr}`,`{ ${i.join(`, `)} }`);t.firstChild;)r.appendChild(t.firstChild);t.replaceWith(r)}})}fr();function fr(){x(e=>{h(e),dr(e)})}var pr=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /\r
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的\r
    内层元素上：宿主级外观（底色/边框/圆角等）经 body 上的 data-* 变体属性以 :has()\r
    驱动，body 自身的布局变体（对齐/纵排）直接命中 body 选择器；原生 disabled 语义\r
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - tag-click：tags 小圆钮点击冒泡，detail = { name, label, value, tag }（tag 元素上\r
      stopPropagation 阻断冒泡）。勾选/多态切换类需求由 autospark.state-button 承接\r
    （ADR-0016：button 已取消 checkable 特性，迁移动作见该 ADR 后果节）\r
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
            labelPos: "right",       // label 在 icon 的哪侧：right 左图标右文字（默认）| left 右图标左文字（与 tags 互换）| top 文字上 | bottom 文字下 | none 不显示文字（label 转悬停提示）\r
            icon: "",               // 图标名或图标选项对象 { name, size, color, strokeWidth, padding, button, pointer }（对齐 x-icon-options 词面，ADR-0135 后不含 shape）+ 自有角标键 badge（伪元素红点，标量三形态控板距；loading 时被替换）\r
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
            menu: false,            // 菜单项形态：占满宽、透明底、左对齐、hover 淡底\r
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
            // icon 对象形态的视觉透传（与 x-icon 原生内联实现等价）：size/color/padding 直写内联样式、\r
            // strokeWidth 经 --as-icon-sw 变量、badge 走角标类（CSS 伪元素红点 + 板 padding）；\r
            // watch 回调一跳后写（x-if 渲染与回调的 flush 时序不保证先后）\r
            const syncIconStyle = () => {\r
                const i = this.data.icon;\r
                const span = this.el.querySelector(".asc-button-icon");\r
                if (!span) return;\r
                for (const k of ["width", "height", "color", "padding"]) span.style.removeProperty(k);\r
                span.style.removeProperty("--as-icon-sw");\r
                span.classList.remove("asc-button-icon-badge");\r
                if (typeof i !== "object" || !i) return;\r
                if (i.size != null) {\r
                    const px = typeof i.size === "number" ? i.size + "px" : i.size;\r
                    span.style.width = px;\r
                    span.style.height = px;\r
                }\r
                if (typeof i.color === "string" && i.color.trim() !== "") span.style.color = i.color;\r
                if (i.strokeWidth != null) span.style.setProperty("--as-icon-sw", String(i.strokeWidth));\r
                if (i.padding != null) span.style.padding = typeof i.padding === "number" ? i.padding + "px" : i.padding;\r
                // badge（x-icon 同款标量三形态）：true（缺省板距）/ number 板距 px / string CSS 值——形态即启用\r
                if (i.badge === true) { span.classList.add("asc-button-icon-badge"); span.style.padding = "2px"; }\r
                else if (typeof i.badge === "number") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge + "px"; }\r
                else if (typeof i.badge === "string" && i.badge.trim() !== "") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge; }\r
            };\r
            setTimeout(syncIconStyle, 0); // mounted 时化身子树可能尚未挂载（span 不可查），一跳后再同步\r
            this.watch("icon", () => { setTimeout(syncIconStyle, 0); });\r
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
            // checkable 桥已随 ADR-0016 整体移除（button 取消 checkable 特性——机制由\r
            // autospark.state-button 继承骨架后自持，迁移动作见 ADR-0016 后果节）\r
\r
            // 涟漪动态挂载（ADR-0010 运行时契约：不经编译、直接写属性即生效）；\r
            // 配置走 x-ripple-options 通道（裸 x-ripple 的值只参与三态判定、不承载配置）；\r
            // ripple 即该配置的 props 值：false 不启用；启用时缺省 { trigger: "click", inside: true }\r
            // （点击播一个周期自止、约束按钮内部），对象形态全键可覆盖缺省；\r
            // options 运行时改值无效（ADR-0010 决策 7）——变化时先摘 x-ripple 触发重挂再重读；\r
            // 需页面已加载 autospark.ripple.js，未加载时属性无人消费、静默无害\r
            const syncRipple = () => {\r
                const conf = this.data.ripple;\r
                this.el.removeAttribute("x-ripple");\r
                this.el.removeAttribute("x-ripple-options");\r
                if (conf) {\r
                    this.el.setAttribute("x-ripple-options", JSON.stringify(typeof conf === "object" ? { trigger: "click", inside: true, ...conf } : { trigger: "click", inside: true }));\r
                    this.el.setAttribute("x-ripple", "");\r
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
    /* ---------- 勾选渲染（checkStyle 四形态）已随 ADR-0016 整体移除 ----------\r
       装饰渲染（solid/icon/corner/ripple）由 autospark.state-button 的 styles 自持\r
       （decorate 项键语义，宿主 class 通道），本组件不再携带任何勾选视觉 */\r
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
    /* 图标角标（icon.badge 标量三形态启用）：板 padding 承载留白，伪元素红点取 danger 语义色 */\r
    .asc-button-icon-badge {\r
      position: relative;\r
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
    /* memo 在场时图标默认 2 倍大（与 label+memo 双行文本块视觉配平）；\r
         图标与文本块的垂直居中由 body 的 align-items: center 承担 */\r
    .asc-button:has(.asc-button-memo) .asc-button-icon {\r
      font-size: 2em;\r
    }\r
\r
    /* tags 小圆钮：右侧小一号圆形，独立 hover 反馈 */\r
    .asc-button-tags {\r
      display: inline-flex;\r
      gap: 0.15em;\r
      margin-left: 0.35em;\r
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
    <!-- icon 双形态：字符串 = 图标名；对象 = { name, size, color, strokeWidth, padding }——name 经 x-icon 值消费，\r
         视觉键由 mounted 的 syncIconStyle 以内联样式透传（与 x-icon 原生内联实现等价；\r
         绑定表达式通道对 props 晚注入不重算，故走 JS 同步通道） -->\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></span>\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'object' && icon"\r
      x-icon="icon.name"\r
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
  </span>\r
</button>\r
`,mr=`autospark.button`;function hr(e){e.components[mr]=pr,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-button`))){let e=document.createElement(`button`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${$(Q(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${$(Q(r.name))}: ${JSON.stringify(or(r.value))}`);for(e.setAttribute(`x-component:${mr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}gr();function gr(){x(e=>{h(e),hr(e)})}var _r=`<!--\r
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
                // 1.5 ripple 指示器在场性 = 组内任一态佩戴（佩戴才注入、无佩戴即移除——运行时\r
                //     states 整体替换随本函数重跑自动修正；注入的 DOM 无编译通道（x-icon 不可用），\r
                //     CSS 自绘呼吸点 + 扩散环；恒插 body 最前（指示器恒最前纪律））\r
                {\r
                    const body = this.el.querySelector(".asc-button-body");\r
                    const checkEl = body?.querySelector(":scope > .asc-state-check") ?? null;\r
                    const hasRipple = list.some((s) => s.decorate === "ripple");\r
                    if (hasRipple && body && !checkEl) {\r
                        const el = document.createElement("span");\r
                        el.className = "asc-state-check";\r
                        body.prepend(el);\r
                    } else if (!hasRipple && checkEl) {\r
                        checkEl.remove();\r
                    }\r
                }\r
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
                    for (const k of BUTTON_PROPS) {\r
                        this.data[k] = Object.hasOwn(st, k) ? st[k] : base[k];\r
                    }\r
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
    /* 三角 = 渐变盒（对角线分割、右上半着色）越出盒外 1px 与外描边同色融合（弧线无缝相接）；\r
         尺寸 = min(圆角半径 ×2.5, 2.5em, 按钮高 50%)——高度基准 + aspect-ratio 方形推导，\r
         圆角档位切换自动跟随；外描边走 box-shadow（视觉等价 outline、跟随圆角、绘制路径独立，\r
         不受涟漪载体播放期色块遮挡） */\r
    .asc-state-button.asc-d-corner {\r
      --asc-corner: min(\r
        calc(var(--auto-border-radius, 0.5rem) * 2.5),\r
        2.5em,\r
        50%\r
      );\r
      box-shadow: 0 0 0 1px var(--asc-tone);\r
      position: relative; /* 三角/描边定位上下文（x-ripple 载体另有 relative 兜底，此处显式自持） */\r
    }\r
    .asc-state-button.asc-d-corner::after {\r
      content: "";\r
      position: absolute;\r
      top: -1px;\r
      right: -1px;\r
      height: calc(var(--asc-corner) + 1px);\r
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
         高度上限同步缩放），-1px 补偿三角盒越出量，确保落在三角内部 */\r
    .asc-state-button.asc-d-corner::before {\r
      content: "";\r
      position: absolute;\r
      top: calc(var(--asc-corner) * 0.24 - 1px);\r
      right: calc(var(--asc-corner) * 0.14 - 1px);\r
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
      box-shadow: 0 0 0 1px var(--asc-tone);\r
    }\r
\r
    /* ---------- 装饰 ripple：最左 1.2em 常驻占位（组内任一态佩戴），当前态佩戴显\r
         tone 色 CSS 自绘涟漪动画（呼吸点 + 扩散环错峰——mounted 注入的 DOM 无编译通道，\r
         x-icon 不可用，视觉对齐内置 ripple 图标动效语言，ADR-0016 实施注记） ---------- */\r
    .asc-state-check {\r
      display: none; /* 缺省隐藏（组内无 ripple 佩戴零占位） */\r
    }\r
    .asc-state-button.asc-p-ripple > .asc-button-body > .asc-state-check {\r
      display: inline-flex;\r
      flex: none;\r
      width: 1.2em;\r
      align-items: center;\r
      justify-content: center;\r
      position: relative;\r
      visibility: hidden; /* 未佩戴态留空占位 */\r
    }\r
    .asc-state-button.asc-d-ripple > .asc-button-body > .asc-state-check {\r
      visibility: visible;\r
    }\r
    .asc-state-button.asc-d-ripple .asc-state-check::before {\r
      content: "";\r
      position: absolute;\r
      width: 0.28em;\r
      height: 0.28em;\r
      border-radius: 50%;\r
      background: var(--asc-tone); /* 指示色统一 tone（与 icon/corner 同口径） */\r
      animation: asc-state-check-dot 1.6s ease-in-out infinite;\r
    }\r
    .asc-state-button.asc-d-ripple .asc-state-check::after {\r
      content: "";\r
      position: absolute;\r
      width: 0.9em;\r
      height: 0.9em;\r
      border-radius: 50%;\r
      border: 1.5px solid var(--asc-tone);\r
      animation: asc-state-check-ring 1.6s ease-out infinite;\r
    }\r
    /* primary 实底下 --asc-tone 与背景同色（指示器隐形），改取反白内容色保对比\r
       （实底反白字语境；default 面板底 / secondary 淡底的 tone 指示器对比充分不受限） */\r
    .asc-state-button.asc-d-ripple:has(\r
        > .asc-button-body[data-variant="primary"]\r
      )\r
      .asc-state-check::before {\r
      background: var(--asc-ink, #fff);\r
    }\r
    .asc-state-button.asc-d-ripple:has(\r
        > .asc-button-body[data-variant="primary"]\r
      )\r
      .asc-state-check::after {\r
      border-color: var(--asc-ink, #fff);\r
    }\r
    @keyframes asc-state-check-dot {\r
      0%,\r
      100% {\r
        transform: scale(1);\r
        opacity: 1;\r
      }\r
      50% {\r
        transform: scale(0.55);\r
        opacity: 0.6;\r
      }\r
    }\r
    @keyframes asc-state-check-ring {\r
      0% {\r
        transform: scale(0.3);\r
        opacity: 0.9;\r
      }\r
      100% {\r
        transform: scale(1.25);\r
        opacity: 0;\r
      }\r
    }\r
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
`,vr=`autospark.state-button`;function yr(e){e.components[vr]=_r,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-state-button`))){let e=document.createElement(`button`),n=[];for(let r of Array.from(t.attributes))r.name.startsWith(`:`)?n.push(`${$(Q(r.name.slice(1)))}: (${r.value})`):r.name===`class`||r.name===`style`||r.name===`id`||r.name===`name`||r.name===`title`||r.name.startsWith(`data-`)||r.name.startsWith(`x-`)||r.name.startsWith(`@`)?e.setAttribute(r.name,r.value):n.push(`${$(Q(r.name))}: ${JSON.stringify(or(r.value))}`);for(e.setAttribute(`x-component:${vr}`,`{ ${n.join(`, `)} }`);t.firstChild;)e.appendChild(t.firstChild);t.replaceWith(e)}})}br();function br(){x(e=>{h(e),yr(e)})}};
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
