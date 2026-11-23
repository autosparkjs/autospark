(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.affix`;function a(e){e.components[i]=`<div
  class="asc-affix"
  x-define="autospark.affix"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            offset: 0,
            position: "top",
        }),
        mounted() {
            const el = this.el;
            let fixed = false;

            const scrollTop = () =>
                (typeof window.scrollY === "number" ? window.scrollY : 0)
                || (document.documentElement ? document.documentElement.scrollTop : 0)
                || 0;

            const computeFixed = () => {
                const off = Number(this.data.offset);
                return scrollTop() >= (isFinite(off) ? off : 0);
            };

            const syncOffset = () => {
                const off = Number(this.data.offset);
                el.style.setProperty("--asc-affix-off", \`\${isFinite(off) ? off : 0}px\`);
            };

            const syncFixed = () => {
                const should = computeFixed();
                if (should === fixed) return;
                fixed = should;
                if (should) {
                    const rect = el.getBoundingClientRect();
                    el.style.setProperty("--asc-affix-left", \`\${rect.left}px\`);
                    el.style.setProperty("--asc-affix-width", \`\${rect.width}px\`);
                    el.style.height = \`\${rect.height}px\`;
                    el.setAttribute("data-fixed", "");
                } else {
                    el.style.removeProperty("--asc-affix-left");
                    el.style.removeProperty("--asc-affix-width");
                    el.style.height = "";
                    el.removeAttribute("data-fixed");
                }
                el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { fixed: should } }));
            };

            const onScroll = () => {
                if (!el.isConnected) { el["_ascAffixCleanup"]?.(); return; }
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

            setTimeout(() => {
                if (!el.isConnected) return;
                bindListeners();
                syncFixed();
            }, 0);
        },
        unmounted() {
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
      position: relative;
      display: block;
    }

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
      position: relative;
    }
  </style>
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
