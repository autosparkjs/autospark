(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var t=[`hover`,`always`,`click`],n=`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`,r=`var(--auto-danger-color, var(--autospark-spin-badge-color, #ef4444))`,i=2147483647,a=3e3;function o(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function s(e,t,n){let r=o(e,`speed`,t,n)??3e3;return r<=0?(t(`${n}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${a}`),a):r}function c(e,n,r){let i=new Set;e?.trigger!==void 0&&(t.includes(e.trigger)?i.add(e.trigger):n(`${r}: trigger 取值非法（${JSON.stringify(e.trigger)}），已忽略`));for(let a of t){let t=e?.[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return t.find(e=>i.has(e))??`always`}function l(e,t,n,r){let i=new Set;if(!e)return i;for(let a of t){let t=e[a];t===!0?i.add(a):t!==void 0&&t!==!1&&n(`${r}: ${a} 开关须为布尔值，已忽略`)}return i}function u(e,t,n,r,i){if(e)for(let a of t){let t=e[a];t!==void 0&&t!==!1&&r(`${i}: ${a} 是 ${n} 的形态键，已忽略`)}}function d(e,t,n){let r=e?.badge;return r===void 0||r===!1?0:r===!0?8:typeof r==`number`&&Number.isFinite(r)&&r>0?r:(t(`${n}: badge 须为 true 或正数字（直径 px），已忽略`),0)}function f(e,t,n,r,i){if(e!==void 0){if(typeof e==`string`&&e.trim()!==``)return e;r(`${i}: color 须为非空字符串，已回退默认色`)}return n>0?t.badgeColor:t.color}function p(){return`position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`}function m(e){return`position:absolute;top:${-e/2}px;right:${-e/2}px;width:${e}px;height:${e}px;border-radius:50%;pointer-events:none;display:block;z-index:${i};`}function h(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}var g=class{static{this.probe=h}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=()=>{this.enabled&&!this.playing&&this.requestStart()};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(){this.playing||(this.carrier==null?(this.pendingStart=!0,this.probeTimer??this.probeCarrier()):this.start())}probeCarrier(){this.probeTimer=setTimeout(()=>{this.probeTimer=null,this.el?.isConnected?(this.carrier=(this.constructor.probe??h)(this.el)?`element`:`pseudo`,this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.carrier===`element`&&this.injectLayers(),this.pendingStart&&(this.pendingStart=!1,this.start())):(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier()},0)}start(){this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars();let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}},_=new WeakMap;function v(e,t){function n(){if(!this.el)return;let e=new g(t,this.engine,this.info);e.el=this.el,_.set(this,e),e.mounted()}function r(){let e=_.get(this);_.delete(this),e?.unmounted()}function i(e){_.get(this)?.attrChanged(e)}return{name:e,kind:1,priority:0,mounted:n,unmounted:r,attrChanged:i}}function y(t){e(e=>{e.directive(t)})}var b=[`chase`,`rotate`,`beam`],x=[`rotate`,`beam`,`chase`],S=[`ring`,`glow`,`echo`],C={type:`beam`,trigger:`always`,badge:0,color:n,size:4,speed:3e3},w=`x-spin`,T=`x-spin-on`,E=`x-spin-layer`,D=`x-spin-badge`,O=e=>`${w}-${e}`,k=`x-spin-angle`,A=!1;function j(e){switch(e){case`beam`:return`conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;case`chase`:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;default:return`conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`}}var M=`padding:var(--x-spin-size);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;`;function N(){if(A||typeof document>`u`)return;A=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-spin`,``),e.textContent=`
@property --x-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${k} { to { --x-spin-angle: 360deg; } }
:where(.${w}) { position: relative; }
.${w} {
  --x-spin-color: ${n};
  --x-spin-size: 4px;
  --x-spin-duration: 3000ms;
  --x-spin-badge-size: 8px;
}
.${w}.${T}::after {
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
  animation: ${k} var(--x-spin-duration) linear infinite;
}
.${w}.${D}.${T}::after {
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
.${w}.${O(`rotate`)}.${T}::after {
  background: ${j(`rotate`)};
}
.${w}.${O(`beam`)}.${T}::after {
  background: ${j(`beam`)};
}
.${w}.${O(`chase`)}.${T}::after {
  background: ${j(`chase`)};
}
@media (prefers-reduced-motion: reduce) {
  .${w}.${T}::after { animation: none; }
}`,document.head.appendChild(e)}function P(e,t){let i={...C};if(!e)return i;let a=l(e,x,t,`x-spin`);e.type!==void 0&&(x.includes(e.type)?a.add(e.type):t(`x-spin: type 取值非法（${JSON.stringify(e.type)}），已回退 "beam"`));let p=b.find(e=>a.has(e));return p&&(i.type=p),u(e,S,`x-ripple`,t,`x-spin`),e.gap!==void 0&&t(`x-spin: gap 仅涟漪支持（x-spin 恒转无静止段），已忽略`),i.trigger=c(e,t,`x-spin`),i.badge=d(e,t,`x-spin`),i.color=f(e.color,{color:n,badgeColor:r},i.badge,t,`x-spin`),i.size=o(e,`size`,t,`x-spin`)??C.size,i.speed=s(e,t,`x-spin`),i}var F={hostClass:w,activeClass:T,layerClass:E,ensureStyles:N,normalize:P,hostClasses:e=>[O(e.type),...e.badge>0?[D]:[]],activeClasses:()=>[],animName:()=>k,animationCss:(e,t)=>`${t} ${e.speed}ms linear infinite`,period:e=>e.speed,layerCount:()=>1,layerCssText:e=>e.badge>0?`${m(e.badge)}${M}background:${j(e.type)};`:`${p()}${M}background:${j(e.type)};`,applyVars:(e,t)=>{let n=e.style;n.setProperty(`--x-spin-color`,t.color||`var(--auto-theme-color, var(--autospark-spin-color, #009aff))`),n.setProperty(`--x-spin-size`,`${t.size}px`),n.setProperty(`--x-spin-duration`,`${t.speed}ms`),t.badge>0&&n.setProperty(`--x-spin-badge-size`,`${t.badge}px`)}};function I(){y(v(`spin`,F))}I();};
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

//# sourceMappingURL=autospark.spin.js.map
