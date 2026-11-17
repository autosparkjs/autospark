(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var e=null;function t(t){e=t}function n(){return globalThis.AutoSpark??e}function r(e){let t=n()?.[e];if(t==null)throw Error(`[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${e}"——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）`);return t}function i(e,t){return r(`getVal`)(e.store.state,t)}function a(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function o(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function s(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}(class{static{this.probe=s}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!i(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??s)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{circle:a}=t.animations(this.config),o=e=>Math.round(e*10)/10,s=this.insideCarrier.circle;s.style.left=`${o(n-i)}px`,s.style.top=`${o(r-i)}px`,s.style.width=`${o(i*2)}px`,s.style.height=`${o(i*2)}px`,s.style.animation=`none`,s.offsetWidth,s.style.animation=a}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.circle.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}});function c(e){a(n=>{t(n),n.directive(e)})}var l={type:`dot`,overflowCount:99,color:`var(--auto-danger-color, var(--autospark-badge-color, #ef4444))`,ripple:!1},u=`x-badge`,d=`x-badge-mark`,f=`x-badge-dot`,p=`x-badge-count`,m=`x-badge-ripple`,h=`x-badge-waves`,g=!1;function _(){if(g||typeof document>`u`)return;g=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-badge`,``),e.textContent=`
:where(.${u}) { position: relative; }
.${u} {
  --x-badge-color: var(--auto-danger-color, var(--autospark-badge-color, #ef4444));
}
.${u} .${d} {
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
.${u} .${d}.${f} {
  width: 8px;
  height: 8px;
  padding: 0;
}
/* count：数字胶囊——高 16 / 字号 12 / 水平 padding 4 / min-width 16（单数字正圆、多位自适应） */
.${u} .${d}.${p} {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  color: #fff;
}
/* dot + ripple：SMIL 扩散环 SVG——mark 背景即中心点，环自圆边（viewBox r=4）向外扩散 */
.${u} .${h} {
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
.${u} .${d}.${m}::before,
.${u} .${d}.${m}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 1px solid var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  animation: x-badge-pulse 2s ease-out infinite;
}
.${u} .${d}.${m}::after {
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
  .${u} .${d}.${m}::before,
  .${u} .${d}.${m}::after {
    animation: none;
  }
}`,document.head.appendChild(e)}function v(e,t){let n={...l};if(!e)return n;e.type!==void 0&&(e.type===`dot`||e.type===`count`?n.type=e.type:e.type!==!0&&e.type!==!1&&t(`x-badge: type 须为 'dot' | 'count'，已回退默认 '${l.type}'`));let r=e.count===!0?`count`:e.dot===!0?`dot`:null;r&&(e.type===void 0||typeof e.type==`boolean`)&&(n.type=r);let i=o(e,`overflowCount`,t,`x-badge`);if(i!==void 0){let e=Math.floor(i);e>0?n.overflowCount=e:t(`x-badge: overflowCount 须为正数，已回退默认 ${l.overflowCount}`)}return e.ripple!==void 0&&(typeof e.ripple==`boolean`?n.ripple=e.ripple:t(`x-badge: ripple 须为布尔值，已忽略`)),e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-badge: color 须为非空字符串，已回退默认色`)),n}var y=class{constructor(e,t){this.alive=!0,this.mark=null,this.valueOff=null,this.reducedMotion=typeof matchMedia==`function`&&matchMedia(`(prefers-reduced-motion: reduce)`).matches,this.engine=e,this.info=t,this.value=t?.value,this.config=v(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(_(),this.el.classList.add(u),this.applyVars(),this.bindValue())}unmounted(){this.unmountMark(),this.el?.classList.remove(u),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.render(void 0);return}if(/^\d+$/.test(this.value.trim())){this.render(Number(this.value));return}let e=this.value,t=({value:e})=>{this.alive&&this.render(e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.render(r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.render(i(this.engine,e))}}render(e){let t=Number(e);if(e==null||e===``||e===!1||!Number.isFinite(t)||t<=0){this.config.type===`dot`&&this.value==null?this.mountMark():this.unmountMark();return}if(this.config.type===`dot`){this.mountMark();return}this.mountMark();let{overflowCount:n}=this.config;this.mark.textContent=t>n?`${n}+`:String(t)}mountMark(){if(this.mark)return;let{type:e,ripple:t}=this.config,n=document.createElement(`span`);n.className=`${d} ${e===`count`?p:f}`,n.setAttribute(`aria-hidden`,`true`),t&&n.classList.add(m),e===`dot`&&t&&!this.reducedMotion&&n.insertAdjacentHTML(`afterbegin`,b()),this.el.appendChild(n),this.mark=n}unmountMark(){this.mark?.remove(),this.mark=null}applyVars(){this.el.style.setProperty(`--x-badge-color`,this.config.color)}};function b(){let e=e=>`<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.35"><animate attributeName="r" values="4;11" dur="2s" begin="${e}" repeatCount="indefinite" /><animate attributeName="fill-opacity" values="0.35;0" dur="2s" begin="${e}" repeatCount="indefinite" /></circle>`;return`<svg class="${h}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`+e(`0s`)+e(`-1s`)+`</svg>`}var x=new WeakMap;function S(){function e(){if(!this.el)return;let e=new y(this.engine,this.info);e.el=this.el,x.set(this,e),e.mounted()}function t(){let e=x.get(this);x.delete(this),e?.unmounted()}function n(e){x.get(this)?.attrChanged(e)}return{name:`badge`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function C(){c(S())}C();};
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

//# sourceMappingURL=autospark.badge.js.map
