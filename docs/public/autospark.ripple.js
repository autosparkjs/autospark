(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e,t,n){let r=globalThis.AutoSpark,i=r?.[t];if(typeof i==`function`||t!==`ready`&&t!==`directive`&&i!=null){n(r);return}let a=globalThis.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(a)?console.error(`${e}: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):a.push((e,t)=>n(t))}var t=[`hover`,`always`,`click`],n={type:`echo`,trigger:`always`,badge:0,color:`var(--auto-theme-color, #1677ff)`,size:12,speed:2e3,gap:0},r=`var(--auto-theme-color, #1677ff)`,i=`x-ripple`,a=`x-ripple-on`,o=`x-ripple-echo`,s=`x-ripple-layer`,c=`x-ripple-badge`,l=8,u=`var(--auto-danger-color, #ff4d4f)`,d=2147483647,f=!1,p=new Map,m=null;function h(){if(f||typeof document>`u`)return;f=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-ripple`,``),e.textContent=`
:where(.${i}) { position: relative; }
.${i} {
  --x-ripple-color: ${r};
  --x-ripple-size: 12px;
  --x-ripple-duration: 2000ms;
  --x-ripple-anim: x-ripple-ring-2000-0;
  --x-ripple-echo-delay: -1000ms;
  --x-ripple-echo-size: 7.2px;
  --x-ripple-badge-size: 8px;
}
.${i}.${a}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
}
.${i}.${a}.${o}::before {
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
.${i}.${c}.${a}::after {
  /* badge 徽标形态：载体缩为宿主右上角正圆（圆心恰在角点），实底圆点 + 波环自圆边扩散 */
  inset: auto;
  top: calc(-1 * var(--x-ripple-badge-size) / 2);
  right: calc(-1 * var(--x-ripple-badge-size) / 2);
  width: var(--x-ripple-badge-size);
  height: var(--x-ripple-badge-size);
  border-radius: 50%;
  background: var(--x-ripple-color);
  z-index: ${d};
}
.${i}.${c}.${a}.${o}::before {
  /* echo 第二环同 badge 几何（双环同心，仅 delay/spread 通道区分） */
  inset: auto;
  top: calc(-1 * var(--x-ripple-badge-size) / 2);
  right: calc(-1 * var(--x-ripple-badge-size) / 2);
  width: var(--x-ripple-badge-size);
  height: var(--x-ripple-badge-size);
  border-radius: 50%;
  background: var(--x-ripple-color);
  z-index: ${d};
}
@media (prefers-reduced-motion: reduce) {
  .${i}.${a}::after,
  .${i}.${a}.${o}::before { animation: none; }
}`,document.head.appendChild(e)}function g(e){let t=`${e.type}|${e.speed}|${e.gap}`,n=p.get(t);if(n)return n;let r=`x-ripple-${e.type}-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=i>0?Math.round(e.speed/i*100):100,o;return o=e.type===`glow`?`
  0% { box-shadow: 0 0 0 0 transparent; }
  ${Math.round(a/2)}% { box-shadow: 0 0 var(--x-ripple-size) 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`:`
  0% { box-shadow: 0 0 0 0 var(--x-ripple-color); }
  ${a}% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }`,m||(m=document.createElement(`style`),m.setAttribute(`data-x-ripple-keyframes`,``),document.head.appendChild(m)),m.textContent+=`\n@keyframes ${r} {${o}\n}`,p.set(t,r),r}function _(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}function v(e,r){let i={...n};if(!e)return i;e.type!==void 0&&(e.type===`ring`||e.type===`glow`||e.type===`echo`?i.type=e.type:r(`x-ripple: type 取值非法（${JSON.stringify(e.type)}），已回退 "echo"`));let a=new Set;e.trigger!==void 0&&(e.trigger===`always`||e.trigger===`hover`||e.trigger===`click`?a.add(e.trigger):r(`x-ripple: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let t of[`hover`,`always`,`click`]){let n=e[t];n===!0?a.add(t):n!==void 0&&n!==!1&&r(`x-ripple: ${t} 开关须为布尔值，已忽略`)}let o=t.find(e=>a.has(e));o&&(i.trigger=o),e.badge!==void 0&&e.badge!==!1&&(e.badge===!0?i.badge=l:typeof e.badge==`number`&&Number.isFinite(e.badge)&&e.badge>0?i.badge=e.badge:r(`x-ripple: badge 须为 true 或正数字（直径 px），已忽略`));let s=!1;e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?(i.color=e.color,s=!0):r(`x-ripple: color 须为非空字符串，已回退默认色`)),i.badge>0&&!s&&(i.color=u);for(let t of[`size`,`speed`,`gap`]){let n=e[t];n!==void 0&&(typeof n!=`number`||!Number.isFinite(n)||n<0?r(`x-ripple: ${t} 须为非负数字，已回退默认值`):i[t]=n)}return i.speed<=0&&(r(`x-ripple: speed 须为正数（总周期为 0 将无法产生动画），已回退 2000`),i.speed=2e3),i}var y=class{static{this.probe=_}constructor(e,t){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.engine=e,this.info=t,this.value=t?.value,this.config=v(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(h(),this.applyCssVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.el?.classList.remove(i,a,o,c),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=()=>{this.enabled&&!this.playing&&this.requestStart()};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(){this.playing||(this.carrier==null?(this.pendingStart=!0,this.probeTimer??this.probeCarrier()):this.start())}probeCarrier(){this.probeTimer=setTimeout(()=>{this.probeTimer=null,this.el?.isConnected?(this.carrier=(this.constructor.probe??_)(this.el)?`element`:`pseudo`,this.el.classList.add(i),this.config.badge>0&&this.el.classList.add(c),this.carrier===`element`&&this.injectLayers(),this.pendingStart&&(this.pendingStart=!1,this.start())):(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier()},0)}start(){this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyCssVars();let e=`${this.animName} ${this.config.speed+this.config.gap}ms ease-out infinite`;this.carrier===`pseudo`?(this.el.classList.add(a),this.config.type===`echo`&&this.el.classList.add(o)):this.layers.forEach((t,n)=>{t.style.animation=e,n>0&&(t.style.animationDelay=`${this.echoDelay}ms`,t.style.setProperty(`--x-ripple-size`,`${this.echoSize}px`))}),this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.config.speed+this.config.gap,t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.carrier===`pseudo`)this.el.classList.remove(a,o);else for(let e of this.layers)e.style.animation=``},n)}get animName(){return g(this.config)}get echoDelay(){let e=this.config.speed+this.config.gap;return this.config.trigger===`click`?0:-e/2}get echoSize(){return this.config.trigger===`click`?Math.round(this.config.size*.6*10)/10:this.config.size}applyCssVars(){let e=this.el.style;e.setProperty(`--x-ripple-color`,this.config.color||r),e.setProperty(`--x-ripple-size`,`${this.config.size}px`),e.setProperty(`--x-ripple-duration`,`${this.config.speed+this.config.gap}ms`),e.setProperty(`--x-ripple-anim`,this.animName),e.setProperty(`--x-ripple-echo-delay`,`${this.echoDelay}ms`),e.setProperty(`--x-ripple-echo-size`,`${this.echoSize}px`),this.config.badge>0&&e.setProperty(`--x-ripple-badge-size`,`${this.config.badge}px`)}injectLayers(){let e=this.config.type===`echo`?2:1,t=this.config.badge>0?this.config.badge:0;for(let n=0;n<e;n++){let e=document.createElement(`span`);e.className=s,e.style.cssText=t?`position:absolute;top:${-t/2}px;right:${-t/2}px;width:${t}px;height:${t}px;border-radius:50%;background:var(--x-ripple-color);pointer-events:none;display:block;z-index:${d};`:`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`,this.el.appendChild(e),this.layers.push(e)}}},b=new WeakMap;function x(){if(!this.el)return;let e=new y(this.engine,this.info);e.el=this.el,b.set(this,e),e.mounted()}function S(){let e=b.get(this);b.delete(this),e?.unmounted()}function C(e,t){b.get(this)?.attrChanged(e,t)}var w={name:`ripple`,kind:1,priority:0,mounted:x,unmounted:S,attrChanged:C};function T(){e(`x-ripple`,`directive`,e=>{e.directive(w)})}T();};
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
