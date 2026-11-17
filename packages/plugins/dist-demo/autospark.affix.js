(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.affix`;function a(e){e.components[i]=`<!--
    autospark.affix 固钉（组件库 P4 other 长尾件，ADR-0018 清单权威表 other 行 /
    ADR-0030 轻件对 ADR）：滚动过 offset 阈值后内容 fixed 吸附视口（position=top
    吸顶缺省 / bottom 吸底）；原位占位撑高防跳动（脱流前几何快照：宿主写 height
    占位、left/width 经 CSS 变量下发内容层 fixed 定位）+ change 冒泡
    detail = { fixed }。

    触发线语义（v1 简化，ADR-0030 声明）：统一「滚动位置 scrollY >= offset」单线
    触发，position 只决定吸附边与吸附偏移方向（offset 兼触发线与吸附位）——antd
    的 offsetTop/offsetBottom 双线独立判定不采（语义更少歧义、可测面更小）。

    监听清理（grid 的 matchMedia 先例）：scroll/resize 挂全局长命对象 window，
    组件拆卸（unmounted）须摘除——cleanup 存宿主 JS 属性（_ascAffixCleanup）统一
    回收。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——position 形态绑定落编译子树内层 body 上，宿主固钉态
    （data-fixed）与几何下发（CSS 变量）为 JS 通道写宿主。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得；affix 是纯定位件（无色面/字号面），档位仅级联传递给插槽内容——
     不在 data() 声明主题六键，内部变体属性（position）亦禁用六个通道名 -->
<div
  class="asc-affix"
  x-define="autospark.affix"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            offset: 0,       // 触发偏移（px）：滚动位置 >= offset 即吸附；吸附位同值（top: offset / bottom: offset）
            position: "top", // 吸附边：top 吸顶（缺省）| bottom 吸底
        }),
        mounted() {
            const el = this.el;
            let fixed = false; // 当前固钉态（闭包自持——scroll 回调只读不重算 props 之外的状态）

            // —— 滚动位置（scrollY 通道兜 documentElement.scrollTop）——
            const scrollTop = () =>
                (typeof window.scrollY === "number" ? window.scrollY : 0)
                || (document.documentElement ? document.documentElement.scrollTop : 0)
                || 0;

            // —— 触发判定：统一单线 scrollY >= offset（v1 简化语义，ADR-0030 声明）——
            const computeFixed = () => {
                const off = Number(this.data.offset);
                return scrollTop() >= (isFinite(off) ? off : 0);
            };

            // —— 吸附偏移下发（offset 兼触发线与吸附位；CSS 变量沿 DOM 继承给内容层）——
            const syncOffset = () => {
                const off = Number(this.data.offset);
                el.style.setProperty("--asc-affix-off", \`\${isFinite(off) ? off : 0}px\`);
            };

            // —— 固钉态切换（边沿快照：脱流前读宿主原位几何——height 占位撑高、
            //    left/width 下发内容层 fixed 定位；同值短路防密集 scroll 重复派发）——
            const syncFixed = () => {
                const should = computeFixed();
                if (should === fixed) return;
                fixed = should;
                if (should) {
                    const rect = el.getBoundingClientRect();
                    el.style.setProperty("--asc-affix-left", \`\${rect.left}px\`);
                    el.style.setProperty("--asc-affix-width", \`\${rect.width}px\`);
                    el.style.height = \`\${rect.height}px\`; // 占位撑高：内容脱流后宿主顶住文档流防跳动
                    el.setAttribute("data-fixed", "");
                } else {
                    el.style.removeProperty("--asc-affix-left");
                    el.style.removeProperty("--asc-affix-width");
                    el.style.height = "";
                    el.removeAttribute("data-fixed");
                }
                el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { fixed: should } }));
            };

            // —— scroll/resize 监听（passive；fixed 态 resize 重校 left/width——
            //    视口/布局变化后 fixed 定位坐标漂移）；syncFixed 自卫：宿主脱树
            //    （engine 销毁清 DOM）后回调自短路并自摘监听——x-define:inherit
            //    试挂域时序下 mounted 同步段挂的全局监听会随试挂域错拆，挂载
            //    移一跳 setTimeout（float-button 同款既有规避）——
            const onScroll = () => {
                if (!el.isConnected) { el["_ascAffixCleanup"]?.(); return; } // 自愈摘除
                syncFixed();
            };
            const onResize = () => {
                if (!el.isConnected || !fixed) return;
                const rect = el.getBoundingClientRect();
                el.style.setProperty("--asc-affix-left", \`\${rect.left}px\`);
                el.style.setProperty("--asc-affix-width", \`\${rect.width}px\`);
            };
            const bindListeners = () => {
                window.addEventListener("scroll", onScroll, { passive: true });
                window.addEventListener("resize", onResize, { passive: true });
                el["_ascAffixCleanup"] = () => {
                    window.removeEventListener("scroll", onScroll);
                    window.removeEventListener("resize", onResize);
                };
            };

            syncOffset();
            this.watch("offset", () => { syncOffset(); syncFixed(); });
            this.watch("position", () => { /* 吸附边纯 CSS 分支（data-position），无 JS 重算面 */ });

            // props 晚注入一跳对齐（家族惯例）：offset/position 落定后再挂监听 + 首同步
            setTimeout(() => {
                if (!el.isConnected) return; // 试挂域拆除后不再挂载（重建域自会挂）
                bindListeners();
                syncFixed();
            }, 0);
        },
        unmounted() {
            // 监听清理（防泄漏：scroll/resize 挂全局长命对象 window，组件拆卸须摘监听）；
            // this.el 可能已拆（可选链静默通过）
            const cleanup = this.el?.["_ascAffixCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascAffixCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-affix">
    /* 纯定位件：零色面/零字号面（三级回退链只作用于定位通道覆盖变量），
       无暗色兜底变体（暗色下定位语义不变）；吸附层级 --asc-affix-z 覆盖通道（缺省 100） */
    .asc-affix {
      position: relative; /* 水印/浮层类内嵌场景的定位锚（本件自身常流） */
      display: block;
    }

    /* ---------- 固钉态：内容层脱流吸附（left/width/off 经宿主 CSS 变量下发——JS 边沿快照） ---------- */
    .asc-affix[data-fixed] > .asc-affix-body {
      position: fixed;
      left: var(--asc-affix-left, 0px);
      width: var(--asc-affix-width, auto);
      z-index: var(--asc-affix-z, 100);
    }
    .asc-affix[data-fixed] > .asc-affix-body[data-position="top"] {
      top: var(--asc-affix-off, 0px);
    }
    .asc-affix[data-fixed] > .asc-affix-body[data-position="bottom"] {
      bottom: var(--asc-affix-off, 0px);
    }
    .asc-affix-body {
      position: relative; /* 常态随文档流 */
    }
  </style>
  <!-- position 形态绑定落本层（根上动态绑定不求值，T4=B）；默认插槽出口承载固钉内容 -->
  <div class="asc-affix-body" :data-position="position">
    <div class="asc-affix-inner" x-slot></div>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-affix`))){let e=document.createElement(`div`),o=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?o.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):o.push(`${n(t(i.name))}: ${JSON.stringify(i.value===``||r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${o.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.affix.js.map
