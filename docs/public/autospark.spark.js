(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e,t,n){let r=globalThis.AutoSpark,i=r?.[t];if(typeof i==`function`||t!==`ready`&&t!==`directive`&&i!=null){n(r);return}let a=globalThis.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(a)?console.error(`${e}: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):a.push((e,t)=>n(t))}var t=[`spin`,`ripple`],n=[`hover`,`always`,`click`],r={type:`ripple`,rippleMode:`echo`,spinMode:`beam`,trigger:`always`,badge:0,color:`var(--auto-theme-color, #1677ff)`,size:12,speed:3e3,gap:0},i=`var(--auto-theme-color, #1677ff)`,a=`x-spark`,o=`x-spark-on`,s=`x-spark-echo`,c=`x-spark-spin`,l=`x-spark-layer`,u=`x-spark-badge`,d=8,f=`var(--auto-danger-color, #ff4d4f)`,p=2147483647,m=4,h=3e3,g=e=>`${c}-${e}`;function _(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spark-angle), transparent 0deg, var(--x-spark-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spark-angle), var(--x-spark-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spark-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spark-angle), var(--x-spark-color), transparent 75%)`}}var v=`padding:var(--x-spark-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`,y=!1,b=new Map,x=null,S=`x-spark-rotate`;function C(){if(y||typeof document>`u`)return;y=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spark`,``),e.textContent=`
@property --x-spark-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${S} { to { --x-spark-angle: 360deg; } }
:where(.${a}) { position: relative; }
.${a} {
  --x-spark-color: ${i};
  --x-spark-size: 12px;
  --x-spark-duration: ${h}ms;
  --x-spark-anim: x-spark-ring-${h}-0;
  --x-spark-echo-delay: -${h/2}ms;
  --x-spark-echo-size: 7.2px;
  --x-spark-badge-size: 8px;
}
.${a}.${o}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-spark-anim) var(--x-spark-duration) ease-out infinite;
}
.${a}.${o}.${s}::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* click 触发器双环同时起波：第二环同心缩小（--x-spark-echo-size），与主环同拍收束；
     always/hover 维持负延迟错相位（同尺寸）——第二环尺寸仅在 click 下有别于主环 */
  --x-spark-size: var(--x-spark-echo-size);
  animation: var(--x-spark-anim) var(--x-spark-duration) ease-out infinite;
  animation-delay: var(--x-spark-echo-delay);
}
.${a}.${u}.${o}::after {
  /* badge 徽标形态：载体缩为宿主右上角正圆（圆心恰在角点），实底圆点 + 波环自圆边扩散 */
  inset: auto;
  top: calc(-1 * var(--x-spark-badge-size) / 2);
  right: calc(-1 * var(--x-spark-badge-size) / 2);
  width: var(--x-spark-badge-size);
  height: var(--x-spark-badge-size);
  border-radius: 50%;
  background: var(--x-spark-color);
  z-index: ${p};
}
.${a}.${u}.${o}.${s}::before {
  /* echo 第二环同 badge 几何（双环同心，仅 delay/spread 通道区分） */
  inset: auto;
  top: calc(-1 * var(--x-spark-badge-size) / 2);
  right: calc(-1 * var(--x-spark-badge-size) / 2);
  width: var(--x-spark-badge-size);
  height: var(--x-spark-badge-size);
  border-radius: 50%;
  background: var(--x-spark-color);
  z-index: ${p};
}
.${a}.${c}.${o}::after {
  /* spin 载体（伪元素形态）：conic 渐变环带绕宿主边界匀速旋转——mask 挖出内环
     （padding = 环宽 size，content-box exclude），border-radius 继承贴合宿主圆角。
     渐变 background 不在本公共规则声明——三形态各自由下方规则直写（直接引用角度变量，
     经未注册变量中转的间接链在部分 Chromium 上不触发重绘），并保持置于 badge 规则之后：
     badge+spin 组合下 background 覆盖实底圆点，几何继承 badge 规则（色环画在角标圆内） */
  padding: var(--x-spark-size);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: ${S} var(--x-spark-duration) linear infinite;
}
.${a}.${g(`rotate`)}.${o}::after {
  background: ${_(`rotate`)};
}
.${a}.${g(`beam`)}.${o}::after {
  background: ${_(`beam`)};
}
.${a}.${g(`chase`)}.${o}::after {
  background: ${_(`chase`)};
}
@media (prefers-reduced-motion: reduce) {
  .${a}.${o}::after,
  .${a}.${o}.${s}::before,
  .${a}.${c}.${o}::after { animation: none; }
}`,document.head.appendChild(e)}function w(e){let t=`${e.rippleMode}|${e.speed}|${e.gap}`,n=b.get(t);if(n)return n;let r=`x-spark-${e.rippleMode}-${e.speed}-${e.gap}`,i=e.speed+e.gap,a=i>0?Math.round(e.speed/i*100):100,o;return o=e.rippleMode===`glow`?`
  0% { box-shadow: 0 0 0 0 transparent; }
  ${Math.round(a/2)}% { box-shadow: 0 0 var(--x-spark-size) 0 var(--x-spark-color); }
  ${a}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`:`
  0% { box-shadow: 0 0 0 0 var(--x-spark-color); }
  ${a}% { box-shadow: 0 0 0 var(--x-spark-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-spark-size) transparent; }`,x||(x=document.createElement(`style`),x.setAttribute(`data-x-spark-keyframes`,``),document.head.appendChild(x)),x.textContent+=`\n@keyframes ${r} {${o}\n}`,b.set(t,r),r}function T(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}function E(e,i){let a={...r};if(!e)return a;let o=new Set;e.type!==void 0&&(e.type===`ripple`||e.type===`spin`?o.add(e.type):i(`x-spark: type 取值非法（${JSON.stringify(e.type)}），已回退 "ripple"（涟漪形态请用 rippleMode 声明）`));for(let t of[`spin`,`ripple`]){let n=e[t];n===!0?o.add(t):n!==void 0&&n!==!1&&i(`x-spark: ${t} 开关须为布尔值，已忽略`)}let s=t.find(e=>o.has(e));s&&(a.type=s);let c=new Set;e.trigger!==void 0&&(e.trigger===`always`||e.trigger===`hover`||e.trigger===`click`?c.add(e.trigger):i(`x-spark: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let t of[`hover`,`always`,`click`]){let n=e[t];n===!0?c.add(t):n!==void 0&&n!==!1&&i(`x-spark: ${t} 开关须为布尔值，已忽略`)}let l=n.find(e=>c.has(e));l&&(a.trigger=l),e.rippleMode!==void 0&&(a.type===`ripple`?e.rippleMode===`ring`||e.rippleMode===`glow`||e.rippleMode===`echo`?a.rippleMode=e.rippleMode:i(`x-spark: rippleMode 取值非法（${JSON.stringify(e.rippleMode)}），已回退 "echo"`):i(`x-spark: rippleMode 仅在 type:'ripple' 下生效，已忽略`)),e.spinMode!==void 0&&(a.type===`spin`?e.spinMode===`rotate`||e.spinMode===`beam`||e.spinMode===`chase`?a.spinMode=e.spinMode:i(`x-spark: spinMode 取值非法（${JSON.stringify(e.spinMode)}），已回退 "beam"`):i(`x-spark: spinMode 仅在 type:'spin' 下生效，已忽略`)),e.badge!==void 0&&e.badge!==!1&&(e.badge===!0?a.badge=d:typeof e.badge==`number`&&Number.isFinite(e.badge)&&e.badge>0?a.badge=e.badge:i(`x-spark: badge 须为 true 或正数字（直径 px），已忽略`));let u=!1;e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?(a.color=e.color,u=!0):i(`x-spark: color 须为非空字符串，已回退默认色`)),a.badge>0&&!u&&(a.color=f);let p=!1;for(let t of[`size`,`speed`]){let n=e[t];n!==void 0&&(typeof n!=`number`||!Number.isFinite(n)||n<0?i(`x-spark: ${t} 须为非负数字，已回退默认值`):(t===`size`&&(p=!0),a[t]=n))}return p||(a.size=a.type===`spin`?m:r.size),a.speed<=0&&(i(`x-spark: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${h}`),a.speed=h),e.gap!==void 0&&(a.type===`spin`?i(`x-spark: gap 仅涟漪支持（spin 恒转无静止段），已忽略`):typeof e.gap!=`number`||!Number.isFinite(e.gap)||e.gap<0?i(`x-spark: gap 须为非负数字，已回退默认值`):a.gap=e.gap),a}var D=class{static{this.probe=T}constructor(e,t){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.engine=e,this.info=t,this.value=t?.value,this.config=E(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}get isSpin(){return this.config.type===`spin`}mounted(){this.el&&(C(),this.applyCssVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.el?.classList.remove(a,o,s,u,c,g(`rotate`),g(`beam`),g(`chase`)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=()=>{this.enabled&&!this.playing&&this.requestStart()};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(){this.playing||(this.carrier==null?(this.pendingStart=!0,this.probeTimer??this.probeCarrier()):this.start())}probeCarrier(){this.probeTimer=setTimeout(()=>{this.probeTimer=null,this.el?.isConnected?(this.carrier=(this.constructor.probe??T)(this.el)?`element`:`pseudo`,this.el.classList.add(a),this.isSpin&&this.el.classList.add(c,g(this.config.spinMode)),this.config.badge>0&&this.el.classList.add(u),this.carrier===`element`&&this.injectLayers(),this.pendingStart&&(this.pendingStart=!1,this.start())):(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier()},0)}start(){this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyCssVars();let e=this.isSpin?`${S} ${this.config.speed}ms linear infinite`:`${this.animName} ${this.config.speed+this.config.gap}ms ease-out infinite`;this.carrier===`pseudo`?(this.el.classList.add(o),!this.isSpin&&this.config.rippleMode===`echo`&&this.el.classList.add(s)):this.layers.forEach((t,n)=>{t.style.animation=e,!this.isSpin&&n>0&&(t.style.animationDelay=`${this.echoDelay}ms`,t.style.setProperty(`--x-spark-size`,`${this.echoSize}px`))}),this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.config.speed+this.config.gap,t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.carrier===`pseudo`)this.el.classList.remove(o,s);else for(let e of this.layers)e.style.animation=``},n)}get animName(){return this.isSpin?S:w(this.config)}get echoDelay(){let e=this.config.speed+this.config.gap;return this.config.trigger===`click`?0:-e/2}get echoSize(){return this.config.trigger===`click`?Math.round(this.config.size*.6*10)/10:this.config.size}applyCssVars(){let e=this.el.style;e.setProperty(`--x-spark-color`,this.config.color||i),e.setProperty(`--x-spark-size`,`${this.config.size}px`),e.setProperty(`--x-spark-duration`,`${this.config.speed+this.config.gap}ms`),e.setProperty(`--x-spark-anim`,this.animName),e.setProperty(`--x-spark-echo-delay`,`${this.echoDelay}ms`),e.setProperty(`--x-spark-echo-size`,`${this.echoSize}px`),this.config.badge>0&&e.setProperty(`--x-spark-badge-size`,`${this.config.badge}px`)}injectLayers(){let e=!this.isSpin&&this.config.rippleMode===`echo`?2:1,t=this.config.badge>0?this.config.badge:0;for(let n=0;n<e;n++){let e=document.createElement(`span`);e.className=l,e.style.cssText=t?`position:absolute;top:${-t/2}px;right:${-t/2}px;width:${t}px;height:${t}px;border-radius:50%;pointer-events:none;display:block;z-index:${p};`+(this.isSpin?`${v}background:${_(this.config.spinMode)};`:`background:var(--x-spark-color);`):`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`+(this.isSpin?`${v}background:${_(this.config.spinMode)};`:``),this.el.appendChild(e),this.layers.push(e)}}},O=new WeakMap;function k(){if(!this.el)return;let e=new D(this.engine,this.info);e.el=this.el,O.set(this,e),e.mounted()}function A(){let e=O.get(this);O.delete(this),e?.unmounted()}function j(e,t){O.get(this)?.attrChanged(e,t)}var M={name:`spark`,kind:1,priority:0,mounted:k,unmounted:A,attrChanged:j};function N(){e(`x-spark`,`directive`,e=>{e.directive(M)})}N();};
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

//# sourceMappingURL=autospark.spark.js.map
