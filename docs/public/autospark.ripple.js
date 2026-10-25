(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e,t,n){let r=globalThis.AutoSpark,i=r?.[t];if(typeof i==`function`||t!==`ready`&&t!==`directive`&&i!=null){n(r);return}let a=globalThis.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(a)?console.error(`${e}: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):a.push((e,t)=>n(t))}var t=[`hover`,`always`,`click`],n=`var(--auto-theme-color, #1677ff)`,r=`var(--auto-danger-color, #ff4d4f)`,i=2147483647,a=3e3;function o(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function s(e,t,n){let r=o(e,`speed`,t,n)??3e3;return r<=0?(t(`${n}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${a}`),a):r}function c(e,n,r){let i=new Set;e?.trigger!==void 0&&(t.includes(e.trigger)?i.add(e.trigger):n(`${r}: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let a of t){let t=e?.[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return t.find(e=>i.has(e))??`always`}function l(e,t,n,r){let i=new Set;if(!e)return i;for(let a of t){let t=e[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return i}function u(e,t,n,r,i){if(e)for(let a of t){let t=e[a];t!==void 0&&t!==!1&&r(`${i}: ${a} 是 ${n} 的形态键，已忽略`)}}function d(e,t,n){let r=e?.badge;return r===void 0||r===!1?0:r===!0?8:typeof r==`number`&&Number.isFinite(r)&&r>0?r:(t(`${n}: badge 须为 true 或正数字（直径 px），已忽略`),0)}function f(e,t,i,a){if(e!==void 0){if(typeof e==`string`&&e.trim()!==``)return e;i(`${a}: color 须为非空字符串，已回退默认色`)}return t>0?r:n}function p(){return`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`}function m(e){return`position:absolute;top:${-e/2}px;right:${-e/2}px;width:${e}px;height:${e}px;border-radius:50%;pointer-events:none;display:block;z-index:${i};`}function h(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}var g=class{static{this.probe=h}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=()=>{this.enabled&&!this.playing&&this.requestStart()};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(){this.playing||(this.carrier==null?(this.pendingStart=!0,this.probeTimer??this.probeCarrier()):this.start())}probeCarrier(){this.probeTimer=setTimeout(()=>{this.probeTimer=null,this.el?.isConnected?(this.carrier=(this.constructor.probe??h)(this.el)?`element`:`pseudo`,this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.carrier===`element`&&this.injectLayers(),this.pendingStart&&(this.pendingStart=!1,this.start())):(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier()},0)}start(){this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars();let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}},_=new WeakMap;function v(e,t){function n(){if(!this.el)return;let e=new g(t,this.engine,this.info);e.el=this.el,_.set(this,e),e.mounted()}function r(){let e=_.get(this);_.delete(this),e?.unmounted()}function i(e){_.get(this)?.attrChanged(e)}return{name:e,kind:1,priority:0,mounted:n,unmounted:r,attrChanged:i}}function y(t,n){e(t,`directive`,e=>{e.directive(n)})}var b=[`glow`,`ring`,`echo`],x=[`ring`,`glow`,`echo`],S=[`rotate`,`beam`,`chase`],C={type:`echo`,trigger:`always`,badge:0,color:n,size:12,speed:3e3,gap:0},w=`x-ripple`,T=`x-ripple-on`,E=`x-ripple-echo`,D=`x-ripple-layer`,O=`x-ripple-badge`,k=!1,A=new Map,j=null;function M(){if(k||typeof document>`u`)return;k=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-ripple`,``),e.textContent=`
:where(.${w}) { position: relative; }
.${w} {
  --x-ripple-color: ${n};
  --x-ripple-size: 12px;
  --x-ripple-duration: 3000ms;
  --x-ripple-anim: x-ripple-echo-3000-0;
  --x-ripple-echo-delay: -1500ms;
  --x-ripple-echo-size: 7.2px;
  --x-ripple-badge-size: 8px;
}
.${w}.${T}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
}
.${w}.${T}.${E}::before {
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
.${w}.${O}.${T}::after {
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
.${w}.${O}.${T}.${E}::before {
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
  .${w}.${T}::after,
  .${w}.${T}.${E}::before { animation: none; }
}`,document.head.appendChild(e)}function N(e){let t=`${e.type}|${e.speed}|${e.gap}`,n=A.get(t);if(n)return n;let r=`x-ripple-${e.type}-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=i>0?Math.round(e.speed/i*100):100,o;return o=e.type===`glow`?`
  0% { box-shadow: 0 0 0 0 transparent; }
  ${Math.round(a/2)}% { box-shadow: 0 0 var(--x-ripple-size) 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`:`
  0% { box-shadow: 0 0 0 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }`,j||(j=document.createElement(`style`),j.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(j)),j.textContent+=`\n@keyframes ${r} {${o}\n}`,A.set(t,r),r}function P(e){return e.trigger===`click`?0:-(e.speed+e.gap)/2}function F(e){return e.trigger===`click`?Math.round(e.size*.6*10)/10:e.size}function I(e,t){let n={...C};if(!e)return n;let r=l(e,x,t,`x-ripple`);e.type!==void 0&&(x.includes(e.type)?r.add(e.type):t(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let i=b.find(e=>r.has(e));return i&&(n.type=i),u(e,S,`x-spin`,t,`x-ripple`),n.trigger=c(e,t,`x-ripple`),n.badge=d(e,t,`x-ripple`),n.color=f(e.color,n.badge,t,`x-ripple`),n.size=o(e,`size`,t,`x-ripple`)??C.size,n.speed=s(e,t,`x-ripple`),n.gap=o(e,`gap`,t,`x-ripple`)??0,n}var L={hostClass:w,activeClass:T,layerClass:D,ensureStyles:M,normalize:I,hostClasses:e=>e.badge>0?[O]:[],activeClasses:e=>e.type===`echo`?[E]:[],animName:e=>N(e),animationCss:(e,t)=>`${t} ${e.speed+e.gap}ms ease-out infinite`,period:e=>e.speed+e.gap,layerCount:e=>e.type===`echo`?2:1,layerCssText:e=>e.badge>0?`${m(e.badge)}background:var(--x-ripple-color);`:p(),applyLayerExtras:(e,t)=>{let n=e[1];n&&(n.style.animationDelay=`${P(t)}ms`,n.style.setProperty(`--x-ripple-size`,`${F(t)}px`))},applyVars:(e,t,n)=>{let r=e.style;r.setProperty(`--x-ripple-color`,t.color||`var(--auto-theme-color, #1677ff)`),r.setProperty(`--x-ripple-size`,`${t.size}px`),r.setProperty(`--x-ripple-duration`,`${t.speed+t.gap}ms`),r.setProperty(`--x-ripple-anim`,n),r.setProperty(`--x-ripple-echo-delay`,`${P(t)}ms`),r.setProperty(`--x-ripple-echo-size`,`${F(t)}px`),t.badge>0&&r.setProperty(`--x-ripple-badge-size`,`${t.badge}px`)}};function R(){y(`x-ripple`,v(`ripple`,L))}R();};
    if (AutoSpark === undefined) {
        // 插件先于引擎加载（ADR-0114）：入预加载队列，engine 构造 drain 时以命名空间回放
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

//# sourceMappingURL=autospark.ripple.js.map
