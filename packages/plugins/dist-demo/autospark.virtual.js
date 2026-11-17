(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var t=`autospark-virtual`,n=`x-for-virtual-styles`;function r(){if(typeof document>`u`||document.getElementById(n))return;let e=document.createElement(`style`);e.id=n,e.textContent=`
/* x-for 虚拟列表默认滚动条样式 */
[${t}] {
  scrollbar-width: thin;
  scrollbar-color: var(--autospark-scrollbar-color, rgba(96, 96, 96, 0.55)) transparent;
}
[${t}]::-webkit-scrollbar { width: 6px; height: 6px; }
[${t}]::-webkit-scrollbar-thumb {
  background: var(--autospark-scrollbar-color, rgba(96, 96, 96, 0.55));
  border-radius: 3px;
}
[${t}]::-webkit-scrollbar-track { background: transparent; }
/* 暗色兜底变体（ADR-0129）：滚动条色属非映射声明（保持两级），兜底按 theme 校准切换 */
[dark] [${t}], [data-dark] [${t}] {
  scrollbar-color: var(--autospark-scrollbar-color, rgba(250, 250, 250, 0.55)) transparent;
}
[dark] [${t}]::-webkit-scrollbar-thumb, [data-dark] [${t}]::-webkit-scrollbar-thumb {
  background: var(--autospark-scrollbar-color, rgba(250, 250, 250, 0.55));
}`,document.head.appendChild(e)}var i=class{constructor(e,t,n){this.autoHeight=0,this.firstVisible=0,this.rafId=null,this.resizeObserver=null,this.dataIndexBinding=null,this.scrollingToIndex=!1,this.updatingDataIndex=!1,this.dataIndexObserver=null,this.onScroll=()=>{this.scrollingToIndex||this.rafId===null&&(this.rafId=requestAnimationFrame(()=>{this.rafId=null,this.handleScroll()}))},this.host=e,this.declaredHeight=t,this.overscan=n}attach(){let{container:e}=this.host;e.setAttribute(t,``),r(),this.detectDataIndexBinding(),e.addEventListener(`scroll`,this.onScroll,{passive:!0}),typeof ResizeObserver<`u`&&(this.resizeObserver=new ResizeObserver(()=>this.recalc()),this.resizeObserver.observe(e)),typeof MutationObserver<`u`&&this.dataIndexBinding&&(this.dataIndexObserver=new MutationObserver(()=>this.scrollToDataIndex()),this.dataIndexObserver.observe(e,{attributes:!0,attributeFilter:[`data-index`]}))}detectDataIndexBinding(){let e=this.host.templateAttr(`:data-index`)??this.host.templateAttr(`x-bind:data-index`);this.dataIndexBinding=e?e.trim():null}itemHeight(){return this.declaredHeight>0?this.declaredHeight:this.autoHeight>0?this.autoHeight:0}autoDetect(){if(this.declaredHeight>0||this.autoHeight>0)return;let e=this.host.container.firstElementChild;if(e){let t=e.getBoundingClientRect().height;t>0&&(this.autoHeight=t)}}onSourceChange(){this.host.specialActive()||this.renderWindow()}handleScroll(){if(this.host.specialActive())return;let e=this.host.items();if(e.length===0)return;let t=this.itemHeight();if(t<=0)return;let n=Math.max(0,Math.min(Math.floor(this.host.container.scrollTop/t),e.length-1));n!==this.firstVisible&&(this.firstVisible=n,this.renderWindow())}recalc(){this.host.specialActive()||this.renderWindow()}renderWindow(){let e=this.host.items();this.autoDetect();let t=this.itemHeight();if(t<=0){this.host.warn(`x-for.virtual: 无法确定 itemHeight（容器无子元素或高度为 0），退化为全量渲染`),this.host.fallbackToFull();return}let n=this.host.container.clientHeight,r=Math.ceil(n/t)+this.overscan*2,i=Math.max(0,this.firstVisible-this.overscan),a=Math.min(e.length,i+r);this.host.setSpacers(i*t,Math.max(0,e.length-a)*t),this.host.renderRange(i,a),this.updateDataIndex(this.firstVisible)}updateDataIndex(e){this.updatingDataIndex=!0;try{this.host.container.setAttribute(`data-index`,String(e));let t=this.dataIndexBindingOf();t&&this.host.writeState(t,e)}finally{this.updatingDataIndex=!1}}dataIndexBindingOf(){return this.dataIndexBinding}scrollToDataIndex(){if(this.updatingDataIndex)return;let e=this.itemHeight();if(e<=0)return;let t=Number(this.host.container.getAttribute(`data-index`));!Number.isFinite(t)||t<0||(this.scrollingToIndex=!0,this.host.container.scrollTop=t*e,requestAnimationFrame(()=>{this.scrollingToIndex=!1}))}destroy(){this.host.container.removeEventListener(`scroll`,this.onScroll),this.rafId!==null&&cancelAnimationFrame(this.rafId),this.rafId=null,this.resizeObserver?.disconnect(),this.resizeObserver=null,this.dataIndexObserver?.disconnect(),this.dataIndexObserver=null,this.host.container.removeAttribute(t)}},a={setup(e,t){let n=0;if(t.itemHeight!==void 0){let r=Number(t.itemHeight);if(!Number.isFinite(r)||r<=0)return e.warn(`x-for.virtual: itemHeight 值无效（${JSON.stringify(t.itemHeight)}），退化为全量渲染`),null;n=r}let r=5;if(t.overscan!==void 0){let e=Number(t.overscan);Number.isFinite(e)&&e>=0&&(r=Math.floor(e))}let a=new i(e,n,r);return a.attach(),a}};function o(){e(e=>{e.forStrategy(`virtual`,a)})}o();};
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

//# sourceMappingURL=autospark.virtual.js.map
