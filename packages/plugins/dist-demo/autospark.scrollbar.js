(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
var e=null;function t(t){e=t}function n(){return globalThis.AutoSpark??e}function r(e){let t=n()?.[e];if(t==null)throw Error(`[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${e}"——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）`);return t}function i(e,t){return r(`getVal`)(e.store.state,t)}function a(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function o(e,t,n,r){let i=e?.[t];if(i!==void 0){if(typeof i!=`number`||!Number.isFinite(i)||i<0)n(`${r}: ${t} 须为非负数字，已回退默认值`);else return i}}function s(e){try{let t=getComputedStyle(e,`::after`)?.content;return t!==void 0&&t!==`none`&&t!==`normal`}catch{return!1}}(class{static{this.probe=s}constructor(e,t,n){this.alive=!0,this.enabled=!0,this.playing=!1,this.carrier=null,this.layers=[],this.stopTimer=null,this.probeTimer=null,this.activatedAt=0,this.pendingStart=!1,this.offHover=null,this.offClick=null,this.valueOff=null,this.insideOn=!1,this.insideCarrier=null,this.strategy=e,this.engine=t,this.info=n,this.value=n?.value,this.config=e.normalize(n?.options,e=>this.warn(e)),this.insideOn=e.inside?.enabled(this.config)??!1}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(this.strategy.ensureStyles(),this.applyVars(),this.bindValue(),this.config.trigger===`hover`?(this.bindHover(),this.probeCarrier()):this.config.trigger===`click`?(this.bindClick(),this.probeCarrier()):this.enabled&&this.requestStart())}unmounted(){this.alive=!1,this.stopTimer!=null&&clearTimeout(this.stopTimer),this.stopTimer=null,this.probeTimer!=null&&clearTimeout(this.probeTimer),this.probeTimer=null,this.valueOff?.(),this.valueOff=null,this.offHover?.(),this.offHover=null,this.offClick?.(),this.offClick=null;for(let e of this.layers)e.remove();this.layers=[],this.insideCarrier?.clip.remove(),this.insideCarrier=null,this.el?.classList.remove(this.strategy.hostClass,this.strategy.activeClass,...this.strategy.hostClasses(this.config),...this.strategy.activeClasses(this.config)),this.playing=!1}attrChanged(e){this.value=e===``?void 0:e,this.enabled=!0,this.valueOff?.(),this.valueOff=null,this.playing&&this.scheduleStop(),this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!i(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.config.trigger===`always`&&this.requestStart():(this.pendingStart=!1,this.playing&&this.scheduleStop()))}bindHover(){let e=this.el,t=()=>{this.enabled&&this.requestStart()},n=()=>{this.playing&&this.scheduleStop()};e.addEventListener(`mouseenter`,t),e.addEventListener(`mouseleave`,n),this.offHover=()=>{e.removeEventListener(`mouseenter`,t),e.removeEventListener(`mouseleave`,n)}}bindClick(){let e=this.el,t=e=>{this.enabled&&(this.insideOn?this.requestStart(e):this.playing||this.requestStart())};e.addEventListener(`click`,t),this.offClick=()=>e.removeEventListener(`click`,t)}requestStart(e){(!this.playing||this.insideOn)&&(this.carrier==null?(this.pendingStart=!0,this.pendingEv=e,this.probeTimer??this.probeCarrier()):this.start(e))}probeCarrier(){this.probeTimer=setTimeout(()=>{if(this.probeTimer=null,!this.el?.isConnected)(this.pendingStart||this.config.trigger!==`always`)&&this.probeCarrier();else if(this.el.classList.add(this.strategy.hostClass,...this.strategy.hostClasses(this.config)),this.insideOn?(this.carrier=`element`,this.injectInsideCarrier()):(this.carrier=(this.constructor.probe??s)(this.el)?`element`:`pseudo`,this.carrier===`element`&&this.injectLayers()),this.pendingStart){this.pendingStart=!1;let e=this.pendingEv;this.pendingEv=void 0,this.start(e)}},0)}start(e){if(this.stopTimer!=null&&(clearTimeout(this.stopTimer),this.stopTimer=null),this.applyVars(),this.insideOn)this.playInside(e);else{let e=this.strategy.animationCss(this.config,this.strategy.animName(this.config));if(this.carrier===`pseudo`)this.el.classList.add(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else{for(let t of this.layers)t.style.animation=e;this.strategy.applyLayerExtras?.(this.layers,this.config)}}this.activatedAt=performance.now(),this.playing=!0,this.config.trigger===`click`&&this.scheduleStop()}playInside(e){if(!this.insideCarrier)return;this.insideCarrier.clip.style.display=``;let t=this.strategy.inside,{x:n,y:r,r:i}=t.geometry(this.el,this.config,e),{circle:a}=t.animations(this.config),o=e=>Math.round(e*10)/10,s=this.insideCarrier.circle;s.style.left=`${o(n-i)}px`,s.style.top=`${o(r-i)}px`,s.style.width=`${o(i*2)}px`,s.style.height=`${o(i*2)}px`,s.style.animation=`none`,s.offsetWidth,s.style.animation=a}injectInsideCarrier(){if(this.insideCarrier)return;let e=this.strategy.inside.createCarrier();e.clip.style.display=`none`,this.el.appendChild(e.clip),this.insideCarrier=e}scheduleStop(){this.stopTimer!=null&&clearTimeout(this.stopTimer);let e=this.strategy.period(this.config),t=performance.now()-this.activatedAt,n=Math.max(0,e-t%e);this.stopTimer=setTimeout(()=>{if(this.stopTimer=null,this.playing=!1,this.insideOn)this.insideCarrier&&(this.insideCarrier.clip.style.display=`none`,this.insideCarrier.circle.style.animation=``);else if(this.carrier===`pseudo`)this.el.classList.remove(this.strategy.activeClass,...this.strategy.activeClasses(this.config));else for(let e of this.layers)e.style.animation=``},n)}applyVars(){this.strategy.applyVars(this.el,this.config,this.strategy.animName(this.config))}injectLayers(){let e=this.strategy.layerCount(this.config);for(let t=0;t<e;t++){let e=document.createElement(`span`);e.className=this.strategy.layerClass,e.style.cssText=this.strategy.layerCssText(this.config),this.el.appendChild(e),this.layers.push(e)}}});function c(e){a(n=>{t(n),n.directive(e)})}var l={axis:`both`,width:12,thumbWidth:5,color:`var(--autospark-scrollbar-color, rgba(0,0,0,0.25))`,delay:300,fadeDuration:200,minSize:20},u=.25,d=`x-scrollbar`,f=`x-scrollbar-visible`,p=`x-scrollbar-active-x`,m=`x-scrollbar-active-y`,h=`x-scrollbar-rail`,g=`x-scrollbar-rail-x`,_=`x-scrollbar-rail-y`,v=`x-scrollbar-thumb`,y=`x-scrollbar-thumb-drag`,b=!1;function x(){if(b||typeof document>`u`)return;b=!0;let e=document.createElement(`style`);e.setAttribute(`data-x-scrollbar`,``),e.textContent=`
:where(.${d}) { position: relative; }
.${d} {
  scrollbar-width: none;
  -ms-overflow-style: none;
  --x-scrollbar-width: 12px;
  --x-scrollbar-thumb: 5px;
  --x-scrollbar-color: rgba(0,0,0,0.25);
  --x-scrollbar-fade: 200ms;
}
.${d}::-webkit-scrollbar { width: 0; height: 0; display: none; }
.${d} .${h} {
  position: absolute;
  display: none;
  opacity: 0;
  transition: opacity var(--x-scrollbar-fade, 200ms) ease;
  pointer-events: none;
  /* 补偿 transform 与合成线程滚动同层应用，减轻 scroll 事件后置补偿的滞后抖动 */
  will-change: transform;
}
.${d}.${m} .${_} { display: block; }
.${d}.${p} .${g} { display: block; }
.${d}.${f} .${h} {
  opacity: 1;
  pointer-events: auto;
}
/* 默认贴宿主内缘全长（thumb 可走满全程）；对向激活时才让位（互向不重叠，点击目标无歧义） */
.${d} .${_} {
  top: 2px;
  right: 2px;
  bottom: 2px;
  width: var(--x-scrollbar-width, 12px);
}
.${d} .${g} {
  left: 2px;
  bottom: 2px;
  right: 2px;
  height: var(--x-scrollbar-width, 12px);
}
.${d}.${p} .${_} {
  bottom: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${d}.${m} .${g} {
  right: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${d} .${v} {
  position: absolute;
  /* 滑块恒无边框——thumb/rail 是裸 span，宿主页面的全局/元素级边框规则可误中，皮肤自持 */
  border: none;
  border-radius: calc(var(--x-scrollbar-thumb, 5px) / 2);
  background: var(--x-scrollbar-color, rgba(0,0,0,0.25));
  user-select: none;
}
.${d} .${_} .${v} {
  right: 0;
  width: var(--x-scrollbar-thumb, 5px);
}
.${d} .${g} .${v} {
  bottom: 0;
  height: var(--x-scrollbar-thumb, 5px);
}
/* hover / 拖拽增粗（+5px，观感反馈内置，perfect-scrollbar 同款节奏） */
.${d} .${_}:hover .${v},
.${d} .${_} .${y} {
  width: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
.${d} .${g}:hover .${v},
.${d} .${g} .${y} {
  height: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
@media (prefers-reduced-motion: reduce) {
  .${d} .${h} { transition: none; }
}`,document.head.appendChild(e)}function S(e,t){let n={...l};if(!e)return n;let r=new Set;for(let n of[`x`,`y`]){let i=e[n];i===!0?r.add(n):i!==void 0&&i!==!1&&t(`x-scrollbar: ${n} 开关须为布尔值，已忽略`)}return r.size===1&&(n.axis=r.has(`x`)?`x`:`y`),n.width=o(e,`width`,t,`x-scrollbar`)??l.width,n.thumbWidth=o(e,`thumbWidth`,t,`x-scrollbar`)??l.thumbWidth,n.delay=o(e,`delay`,t,`x-scrollbar`)??l.delay,n.minSize=o(e,`minSize`,t,`x-scrollbar`)??l.minSize,n.fadeDuration=o(e,`fadeDuration`,t,`x-scrollbar`)??l.fadeDuration,e.color!==void 0&&(typeof e.color==`string`&&e.color.trim()!==``?n.color=e.color:t(`x-scrollbar: color 须为非空字符串，已回退默认色`)),n}var C=class e{static scheduleFrame(e){return requestAnimationFrame(e)}static cancelFrame(e){cancelAnimationFrame(e)}constructor(e,t){this.alive=!0,this.enabled=!0,this.drag=null,this.railX=null,this.railY=null,this.thumbX=null,this.thumbY=null,this.hideTimer=null,this.ro=null,this.valueOff=null,this.offs=[],this.wheel=null,this.engine=e,this.info=t,this.value=t?.value,this.config=S(t?.options,e=>this.warn(e))}warn(e){this.engine.logger.warn(e)}mounted(){this.el&&(x(),this.applyVars(),this.bindValue(),this.enabled&&this.setup())}unmounted(){this.teardown(),this.alive=!1,this.valueOff?.(),this.valueOff=null}attrChanged(e){this.value=e===``?void 0:e,this.valueOff?.(),this.valueOff=null,this.bindValue()}bindValue(){if(this.value==null){this.setEnabled(!0);return}if(this.value===`false`){this.setEnabled(!1);return}let e=this.value,t=({value:e})=>{this.alive&&this.setEnabled(!!e)},n=this.engine.findScopeByEl(this.el);if(n&&typeof n.watch==`function`){let r=n.watch(e,t);this.setEnabled(!!r)}else{let n=this.engine.store.watch(e,t);this.valueOff=()=>n?.off?.(),this.setEnabled(!!i(this.engine,e))}}setEnabled(e){this.enabled!==e&&(this.enabled=e,e?this.setup():this.teardown())}setup(){let e=this.el;e&&!this.railY&&(e.classList.add(d),this.applyVars(),this.buildRails(),this.bindEvents(),typeof ResizeObserver<`u`&&(this.ro=new ResizeObserver(()=>this.refresh()),this.ro.observe(e)),setTimeout(()=>this.refresh(),0),this.refresh())}teardown(){this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=null,this.wheel&&=(this.wheel.raf&&e.cancelFrame(this.wheel.raf),null),this.ro?.disconnect(),this.ro=null;for(let e of this.offs)e();this.offs=[],this.endDrag(!0),this.railX?.remove(),this.railY?.remove(),this.railX=this.railY=this.thumbX=this.thumbY=null,this.el?.classList.remove(d,f,p,m)}buildRails(){let e=e=>{let t=document.createElement(`span`);t.className=`${h} ${e}`;let n=document.createElement(`span`);return n.className=v,t.appendChild(n),this.el.appendChild(t),{rail:t,thumb:n}},t=e(_);this.railY=t.rail,this.thumbY=t.thumb;let n=e(g);this.railX=n.rail,this.thumbX=n.thumb}applyVars(){let e=this.el.style;e.setProperty(`--x-scrollbar-width`,`${this.config.width}px`),e.setProperty(`--x-scrollbar-thumb`,`${this.config.thumbWidth}px`),e.setProperty(`--x-scrollbar-color`,this.config.color),e.setProperty(`--x-scrollbar-fade`,`${this.config.fadeDuration}ms`)}listen(e,t,n){e.addEventListener(t,n),this.offs.push(()=>e.removeEventListener(t,n))}bindEvents(){let e=this.el;this.listen(e,`mouseenter`,()=>{this.refresh(),this.show()}),this.listen(e,`mouseleave`,()=>this.scheduleHide()),this.listen(e,`scroll`,()=>{this.drag||this.wheel||(this.updateThumb(`y`),this.updateThumb(`x`))}),this.bindWheel(),this.bindRail(`y`,this.railY,this.thumbY),this.bindRail(`x`,this.railX,this.thumbX)}bindWheel(){this.listen(this.el,`wheel`,e=>{if(e.ctrlKey||this.drag)return;let t=this.el,n=e.deltaMode===1?16:1,r=e.deltaY*n,i=e.deltaX*n,a=t.scrollHeight-t.clientHeight,o=t.scrollWidth-t.clientWidth,s=r!==0&&a>0&&!(r<0&&t.scrollTop<=0)&&!(r>0&&t.scrollTop>=a),c=i!==0&&o>0&&!(i<0&&t.scrollLeft<=0)&&!(i>0&&t.scrollLeft>=o);if(!s&&!c)return;e.preventDefault();let l=this.wheel??={tx:t.scrollLeft,ty:t.scrollTop,raf:0};s&&(l.ty=Math.min(Math.max(l.ty+r,0),a)),c&&(l.tx=Math.min(Math.max(l.tx+i,0),o)),l.raf===0&&this.runWheel()})}runWheel(){let t=this.wheel,n=()=>{t.raf=0;let r=this.el;if(!r||!this.enabled||!this.wheel){this.wheel=null;return}let i=!0,a=t.ty-r.scrollTop;Math.abs(a)>=1?(r.scrollTop+=a*u,i=!1):a!==0&&(r.scrollTop=t.ty);let o=t.tx-r.scrollLeft;Math.abs(o)>=1?(r.scrollLeft+=o*u,i=!1):o!==0&&(r.scrollLeft=t.tx),this.updateThumb(`y`),this.updateThumb(`x`),i?this.wheel=null:t.raf=e.scheduleFrame(n)};t.raf=e.scheduleFrame(n)}bindRail(e,t,n){this.listen(n,`pointerdown`,r=>this.dragStart(e,r,n,t)),this.listen(n,`pointermove`,e=>this.dragMove(e)),this.listen(n,`pointerup`,e=>this.dragEnd(e)),this.listen(n,`pointercancel`,()=>this.endDrag(!0)),this.listen(t,`pointerdown`,r=>{if(r.button!==0||r.target!==t)return;r.preventDefault();let i=this.el,a=t.getBoundingClientRect(),o=e===`y`?r.clientY-a.top:r.clientX-a.left,s=e===`y`?n.offsetTop:n.offsetLeft,c=e===`y`?i.clientHeight:i.clientWidth;e===`y`?i.scrollTop+=o<s?-c:c:i.scrollLeft+=o<s?-c:c,this.updateThumb(`y`),this.updateThumb(`x`)})}refresh(){if(!this.enabled||!this.el)return;let e=this.el,t=this.config.axis!==`x`&&e.clientHeight>0&&e.scrollHeight>e.clientHeight,n=this.config.axis!==`y`&&e.clientWidth>0&&e.scrollWidth>e.clientWidth;e.classList.toggle(m,t),e.classList.toggle(p,n),t&&this.updateThumb(`y`),n&&this.updateThumb(`x`)}updateThumb(e){let t=this.el,n=e===`y`?this.railY:this.railX,r=e===`y`?this.thumbY:this.thumbX;if(!t||!n||!r)return;let i=e===`y`?t.clientHeight:t.clientWidth,a=e===`y`?t.scrollHeight:t.scrollWidth,o=e===`y`?t.scrollTop:t.scrollLeft;if(a<=i)return;let s=e===`y`?n.offsetHeight:n.offsetWidth;if(s<=0)return;let c=Math.round(Math.min(s,Math.max(this.config.minSize,i/a*s))),l=a-i,u=Math.round(o/l*(s-c));n.style.transform=`translate(${t.scrollLeft}px, ${t.scrollTop}px)`,e===`y`?(r.style.height=`${c}px`,r.style.top=`${u}px`):(r.style.width=`${c}px`,r.style.left=`${u}px`)}show(){this.hideTimer!=null&&(clearTimeout(this.hideTimer),this.hideTimer=null),this.el?.classList.add(f)}scheduleHide(){this.drag||(this.hideTimer!=null&&clearTimeout(this.hideTimer),this.hideTimer=setTimeout(()=>{this.hideTimer=null,this.el?.classList.remove(f)},this.config.delay))}dragStart(e,t,n,r){if(t.button!==0||this.drag)return;t.preventDefault(),this.show();let i=e===`y`?r.offsetHeight:r.offsetWidth;this.drag={axis:e,pointerId:t.pointerId,start:e===`y`?t.clientY:t.clientX,startScroll:e===`y`?this.el.scrollTop:this.el.scrollLeft,railLen:i,thumbLen:e===`y`?n.offsetHeight:n.offsetWidth,thumb:n},n.classList.add(y);try{n.setPointerCapture(t.pointerId)}catch{}}dragMove(e){let t=this.drag;if(!t||e.pointerId!==t.pointerId)return;let n=this.el,r=t.axis,i=r===`y`?n.clientHeight:n.clientWidth,a=r===`y`?n.scrollHeight:n.scrollWidth,o=t.railLen-t.thumbLen;if(o<=0)return;let s=(r===`y`?e.clientY:e.clientX)-t.start,c=t.startScroll+s/o*(a-i);r===`y`?n.scrollTop=c:n.scrollLeft=c,this.updateThumb(`y`),this.updateThumb(`x`),this.updateThumb(r===`y`?`x`:`y`)}dragEnd(e){if(!this.drag||e.pointerId!==this.drag.pointerId)return;this.endDrag(!1);let t=this.el.getBoundingClientRect();e.clientX>=t.left&&e.clientX<=t.right&&e.clientY>=t.top&&e.clientY<=t.bottom?this.show():this.scheduleHide()}endDrag(e){let t=this.drag;if(t){this.drag=null,t.thumb.classList.remove(y);try{t.thumb.releasePointerCapture(t.pointerId)}catch{}e||this.refresh()}}},w=new WeakMap;function T(){function e(){if(!this.el)return;let e=new C(this.engine,this.info);e.el=this.el,w.set(this,e),e.mounted()}function t(){let e=w.get(this);w.delete(this),e?.unmounted()}function n(e){w.get(this)?.attrChanged(e)}return{name:`scrollbar`,kind:1,priority:0,mounted:e,unmounted:t,attrChanged:n}}function E(){c(T())}E();};
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
