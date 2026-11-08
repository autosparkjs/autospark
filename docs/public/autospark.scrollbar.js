(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function n(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}(class{static{this.probe=n}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??n)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{circle:a}=t.animations(this.config),o=e=>Math.round(e*10)/10,s=this.insideCarrier.circle;s.style.left=`${o(n-i)}px`,s.style.top=`${o(r-i)}px`,s.style.width=`${o(i*2)}px`,s.style.height=`${o(i*2)}px`,s.style.animation=`none`,s.offsetWidth,s.style.animation=a}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.circle.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}});function r(t){e(e=>{e.directive(t)})}var i={axis:`both`,width:12,thumbWidth:5,color:`var(--autospark-scrollbar-color, rgba(0,0,0,0.25))`,delay:300,fadeDuration:200,minSize:20},a=.25,o=`x-scrollbar`,s=`x-scrollbar-visible`,c=`x-scrollbar-active-x`,l=`x-scrollbar-active-y`,u=`x-scrollbar-rail`,d=`x-scrollbar-rail-x`,f=`x-scrollbar-rail-y`,p=`x-scrollbar-thumb`,m=`x-scrollbar-thumb-drag`,h=!1;function g(){if(h||typeof document>`u`)return;h=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-scrollbar`,``),e.textContent=`
:where(.${o}) { position: relative; }
.${o} {
  scrollbar-width: none;
  -ms-overflow-style: none;
  --x-scrollbar-width: 12px;
  --x-scrollbar-thumb: 5px;
  --x-scrollbar-color: rgba(0,0,0,0.25);
  --x-scrollbar-fade: 200ms;
}
.${o}::-webkit-scrollbar { width: 0; height: 0; display: none; }
.${o} .${u} {
  position: absolute;
  display: none;
  opacity: 0;
  transition: opacity var(--x-scrollbar-fade, 200ms) ease;
  pointer-events: none;
  /* 补偿 transform 与合成线程滚动同层应用，减轻 scroll 事件后置补偿的滞后抖动 */
  will-change: transform;
}
.${o}.${l} .${f} { display: block; }
.${o}.${c} .${d} { display: block; }
.${o}.${s} .${u} {
  opacity: 1;
  pointer-events: auto;
}
/* 默认贴宿主内缘全长（thumb 可走满全程）；对向激活时才让位（互向不重叠，点击目标无歧义） */
.${o} .${f} {
  top: 2px;
  right: 2px;
  bottom: 2px;
  width: var(--x-scrollbar-width, 12px);
}
.${o} .${d} {
  left: 2px;
  bottom: 2px;
  right: 2px;
  height: var(--x-scrollbar-width, 12px);
}
.${o}.${c} .${f} {
  bottom: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${o}.${l} .${d} {
  right: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${o} .${p} {
  position: absolute;
  /* 滑块恒无边框——thumb/rail 是裸 span，宿主页面的全局/元素级边框规则可误中，皮肤自持 */
  border: none;
  border-radius: calc(var(--x-scrollbar-thumb, 5px) / 2);
  background: var(--x-scrollbar-color, rgba(0,0,0,0.25));
  user-select: none;
}
.${o} .${f} .${p} {
  right: 0;
  width: var(--x-scrollbar-thumb, 5px);
}
.${o} .${d} .${p} {
  bottom: 0;
  height: var(--x-scrollbar-thumb, 5px);
}
/* hover / 拖拽增粗（+5px，观感反馈内置，perfect-scrollbar 同款节奏） */
.${o} .${f}:hover .${p},
.${o} .${f} .${m} {
  width: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
.${o} .${d}:hover .${p},
.${o} .${d} .${m} {
  height: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
@media (prefers-reduced-motion: reduce) {
  .${o} .${u} { transition: none; }
}`,document.head.appendChild(e)}function _(e,n){let r={...i};if(!e)return r;let a=new Set;for(let t of[`x`,`y`]){let r=e[t];r===!0?a.add(t):r!==void 0&&r!==!1&&n(`x-scrollbar: ${t} 开关须为布尔值，已忽略`)}return a.size===1&&(r.axis=a.has(`x`)?`x`:`y`),r.width=t(e,`width`,n,`x-scrollbar`)??i.width,r.thumbWidth=t(e,`thumbWidth`,n,`x-scrollbar`)??i.thumbWidth,r.delay=t(e,`delay`,n,`x-scrollbar`)??i.delay,r.minSize=t(e,`minSize`,n,`x-scrollbar`)??i.minSize,r.fadeDuration=t(e,`fadeDuration`,n,`x-scrollbar`)??i.fadeDuration,e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?r.color=e.color:n(`x-scrollbar: color 须为非空字符串，已回退默认色`)),r}var v=class e{static scheduleFrame(e){return requestAnimationFrame(e)}static cancelFrame(e){cancelAnimationFrame(e)}constructor(e,t){this.alive=!0,this.enabled=!0,this.drag=null,this.railX=null,this.railY=null,this.thumbX=null,this.thumbY=null,this.hideTimer=null,this.ro=null,this.valueOff=null,this.offs=[],this.wheel=null,this.engine=e,this.info=t,this.value=t?.value,this.config=_(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(g(),this.applyVars(),this.bindValue(),this.enabled&&this.setup())}unmounted(){this.teardown(),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}if(this.value===`false`){this.setEnabled(!1);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!this.engine.store.read?.(e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.setup():this.teardown())}setup(){let e=this.el;e&&!this.railY&&(e.classList.add(o),this.applyVars(),this.buildRails(),this.bindEvents(),typeof ResizeObserver<`u`&&(this.ro=new ResizeObserver(()=>this.refresh()),this.ro.observe(e)),setTimeout(()=>this.refresh(),0),this.refresh())}teardown(){this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=null,this.wheel&&=(this.wheel.raf&&e.cancelFrame(this.wheel.raf),null),this.ro?.disconnect(),this.ro=null;for(let e of this.offs)e();this.offs=[],this.endDrag(!0),this.railX?.remove(),this.railY?.remove(),this.railX=this.railY=this.thumbX=this.thumbY=null,this.el?.classList.remove(o,s,c,l)}buildRails(){let e=e=>{let t=document.createElement(`span`);t.className=`${u} ${e}`;let n=document.createElement(`span`);return n.className=p,t.appendChild(n),this.el.appendChild(t),{rail:t,thumb:n}},t=e(f);this.railY=t.rail,this.thumbY=t.thumb;let n=e(d);this.railX=n.rail,this.thumbX=n.thumb}applyVars(){let e=this.el.style;e.setProperty(`--x-scrollbar-width`,`${this.config.width}px`),e.setProperty(`--x-scrollbar-thumb`,`${this.config.thumbWidth}px`),e.setProperty(`--x-scrollbar-color`,this.config.color),e.setProperty(`--x-scrollbar-fade`,`${this.config.fadeDuration}ms`)}listen(e,t,n){e.addEventListener(t,n),this.offs.push(()=>e.removeEventListener(t,n))}bindEvents(){let e=this.el;this.listen(e,`mouseenter`,()=>{this.refresh(),this.show()}),this.listen(e,`mouseleave`,()=>this.scheduleHide()),this.listen(e,`scroll`,()=>{this.drag||this.wheel||(this.updateThumb(`y`),this.updateThumb(`x`))}),this.bindWheel(),this.bindRail(`y`,this.railY,this.thumbY),this.bindRail(`x`,this.railX,this.thumbX)}bindWheel(){this.listen(this.el,`wheel`,e=>{if(e.ctrlKey||this.drag)return;let t=this.el,n=e.deltaMode===1?16:1,r=e.deltaY*n,i=e.deltaX*n,a=t.scrollHeight-t.clientHeight,o=t.scrollWidth-t.clientWidth,s=r!==0&&a>0&&!(r<0&&t.scrollTop<=0)&&!(r>0&&t.scrollTop>=a),c=i!==0&&o>0&&!(i<0&&t.scrollLeft<=0)&&!(i>0&&t.scrollLeft>=o);if(!s&&!c)return;e.preventDefault();let l=this.wheel??={tx:t.scrollLeft,ty:t.scrollTop,raf:0};s&&(l.ty=Math.min(Math.max(l.ty+r,0),a)),c&&(l.tx=Math.min(Math.max(l.tx+i,0),o)),l.raf===0&&this.runWheel()})}runWheel(){let t=this.wheel,n=()=>{t.raf=0;let r=this.el;if(!r||!this.enabled||!this.wheel){this.wheel=null;return}let i=!0,o=t.ty-r.scrollTop;Math.abs(o)>=1?(r.scrollTop+=o*a,i=!1):o!==0&&(r.scrollTop=t.ty);let s=t.tx-r.scrollLeft;Math.abs(s)>=1?(r.scrollLeft+=s*a,i=!1):s!==0&&(r.scrollLeft=t.tx),this.updateThumb(`y`),this.updateThumb(`x`),i?this.wheel=null:t.raf=e.scheduleFrame(n)};t.raf=e.scheduleFrame(n)}bindRail(e,t,n){this.listen(n,`pointerdown`,r=>this.dragStart(e,r,n,t)),this.listen(n,`pointermove`,e=>this.dragMove(e)),this.listen(n,`pointerup`,e=>this.dragEnd(e)),this.listen(n,`pointercancel`,()=>this.endDrag(!0)),this.listen(t,`pointerdown`,r=>{if(r.button!==0||r.target!==t)return;r.preventDefault();let i=this.el,a=t.getBoundingClientRect(),o=e===`y`?r.clientY-a.top:r.clientX-a.left,s=e===`y`?n.offsetTop:n.offsetLeft,c=e===`y`?i.clientHeight:i.clientWidth;e===`y`?i.scrollTop+=o<s?-c:c:i.scrollLeft+=o<s?-c:c,this.updateThumb(`y`),this.updateThumb(`x`)})}refresh(){if(!this.enabled||!this.el)return;let e=this.el,t=this.config.axis!==`x`&&e.clientHeight>0&&e.scrollHeight>e.clientHeight,n=this.config.axis!==`y`&&e.clientWidth>0&&e.scrollWidth>e.clientWidth;e.classList.toggle(l,t),e.classList.toggle(c,n),t&&this.updateThumb(`y`),n&&this.updateThumb(`x`)}updateThumb(e){let t=this.el,n=e===`y`?this.railY:this.railX,r=e===`y`?this.thumbY:this.thumbX;if(!t||!n||!r)return;let i=e===`y`?t.clientHeight:t.clientWidth,a=e===`y`?t.scrollHeight:t.scrollWidth,o=e===`y`?t.scrollTop:t.scrollLeft;if(a<=i)return;let s=e===`y`?n.offsetHeight:n.offsetWidth;if(s<=0)return;let c=Math.round(Math.min(s,Math.max(this.config.minSize,i/a*s))),l=a-i,u=Math.round(o/l*(s-c));n.style.transform=`translate(${t.scrollLeft}px, ${t.scrollTop}px)`,e===`y`?(r.style.height=`${c}px`,r.style.top=`${u}px`):(r.style.width=`${c}px`,r.style.left=`${u}px`)}show(){this.hideTimer!=null&&(clearTimeout(this.hideTimer),this.hideTimer=null),this.el?.classList.add(s)}scheduleHide(){this.drag||(this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=setTimeout(()=>{this.hideTimer=null,this.el?.classList.remove(s)},this.config.delay))}dragStart(e,t,n,r){if(t.button!==0||this.drag)return;t.preventDefault(),this.show();let i=e===`y`?r.offsetHeight:r.offsetWidth;this.drag={axis:e,pointerId:t.pointerId,start:e===`y`?t.clientY:t.clientX,startScroll:e===`y`?this.el.scrollTop:this.el.scrollLeft,railLen:i,thumbLen:e===`y`?n.offsetHeight:n.offsetWidth,thumb:n},n.classList.add(m);try{n.setPointerCapture(t.pointerId)}catch{}}dragMove(e){let t=this.drag;if(!t||e.pointerId!==t.pointerId)return;let n=this.el,r=t.axis,i=r===`y`?n.clientHeight:n.clientWidth,a=r===`y`?n.scrollHeight:n.scrollWidth,o=t.railLen-t.thumbLen;if(o<=0)return;let s=(r===`y`?e.clientY:e.clientX)-t.start,c=t.startScroll+s/o*(a-i);r===`y`?n.scrollTop=c:n.scrollLeft=c,this.updateThumb(`y`),this.updateThumb(`x`),this.updateThumb(r===`y`?`x`:`y`)}dragEnd(e){if(!this.drag||e.pointerId!==this.drag.pointerId)return;this.endDrag(!1);let t=this.el.getBoundingClientRect();e.clientX>=t.left&&e.clientX<=t.right&&e.clientY>=t.top&&e.clientY<=t.bottom?this.show():this.scheduleHide()}endDrag(e){let t=this.drag;if(t){this.drag=null,t.thumb.classList.remove(m);try{t.thumb.releasePointerCapture(t.pointerId)}catch{}e||this.refresh()}}},y=new WeakMap;function b(){function e(){if(!this.el)return;let e=new v(this.engine,this.info);e.el=this.el,y.set(this,e),e.mounted()}function t(){let e=y.get(this);y.delete(this),e?.unmounted()}function n(e){y.get(this)?.attrChanged(e)}return{name:`scrollbar`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function x(){r(b())}x();};
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

//# sourceMappingURL=autospark.scrollbar.js.map
