(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.tabs`;function a(e){e.components[i]=`<div\r
  class="asc-tabs"\r
  x-define="autospark.tabs"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: "",
            items: [],
            variant: "line",
        }),\r
        methods: {\r
            onTabClick(item) {\r
                if (!item || item.disabled) return;\r
                const k = String(item.key ?? "");\r
                if (k === "" || k === String(this.data.value ?? "")) return;\r
                this.data.value = k;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: k } }));\r
            },\r
        },\r
        mounted() {\r
            const raw = this.el.getAttribute("data-items");\r
            if ((!this.data.items || !this.data.items.length) && raw) {\r
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }\r
                this.el.removeAttribute("data-items");\r
            }\r
\r
            const prior = this.el.value;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(this.data.value ?? ""),\r
                set: (v) => { this.data.value = String(v ?? ""); },\r
                configurable: true,\r
            });\r
\r
            setTimeout(() => {\r
                if (!this.data.value && typeof prior === "string" && prior !== "") {\r
                    this.data.value = prior;\r
                }\r
                if (!this.data.value) {\r
                    const first = (this.data.items || []).find((it) => it && it.key != null && String(it.key) !== "" && !it.disabled);\r
                    if (first) this.data.value = String(first.key);\r
                }\r
            }, 0);\r
\r
            this.el.addEventListener("keydown", (e) => {\r
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;\r
                const t = e.target instanceof Element ? e.target : null;\r
                const tab = t ? t.closest(".asc-tabs-tab") : null;\r
                if (!tab || !this.el.contains(tab)) return;\r
                e.preventDefault();\r
                const tabs = Array.from(this.el.querySelectorAll(".asc-tabs-tab")).filter((b) => !b.disabled);\r
                if (!tabs.length) return;\r
                const idx = tabs.indexOf(tab);\r
                let next = 0;\r
                if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;\r
                else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;\r
                else if (e.key === "Home") next = 0;\r
                else next = tabs.length - 1;\r
                tabs[next].focus();\r
                tabs[next].click();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-tabs">\r
    .asc-tabs {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-tabs-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, 1.5);\r
    }\r
\r
    .asc-tabs-bar {\r
      display: flex;\r
      align-items: stretch;\r
      max-width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-tabs-tab {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tabs-primary, #009aff));\r
      appearance: none;\r
      border: none;\r
      background: transparent;\r
      font: inherit;\r
      line-height: inherit;\r
      color: var(--auto-secondary-color, var(--asc-tabs-tab-color, rgba(0, 0, 0, 0.55)));\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      padding: 0.5em 1em;\r
      margin: 0;\r
      cursor: pointer;\r
      position: relative;\r
      white-space: nowrap;\r
      transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;\r
    }\r
    .asc-tabs-tab:focus-visible {\r
      outline: none;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-focus-radius, 0.25em));\r
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);\r
    }\r
    .asc-tabs-tab:disabled {\r
      color: var(--auto-disable-color, var(--asc-tabs-disable-color, rgba(0, 0, 0, 0.25)));\r
      cursor: not-allowed;\r
    }\r
    .asc-tabs-tab-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      max-width: 100%;\r
    }\r
\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-bar {\r
      border-bottom: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab::after {\r
      content: "";\r
      position: absolute;\r
      left: 0;\r
      right: 0;\r
      bottom: calc(-1 * var(--auto-border-size, var(--asc-tabs-border-size, 1px)));\r
      height: 2px;\r
      background: var(--asc-tone);\r
      transform: scaleX(0);\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tone);\r
      font-weight: var(--x-font-weight-large, 600);
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active]::after {\r
      transform: scaleX(1);\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--asc-tone);\r
    }\r
\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-bar {\r
      border-bottom: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab {\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid transparent;\r
      border-bottom: none;\r
      border-radius: 0.375em 0.375em 0 0;\r
      margin-bottom: calc(-1 * var(--auto-border-size, var(--asc-tabs-border-size, 1px)));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--asc-tone);\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(0, 0, 0, 0.04)));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tone);\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #ffffff));\r
      border-color: var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
      position: relative;\r
      z-index: 1;
    }\r
\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar {\r
      display: inline-flex;\r
      gap: 0.125em;\r
      padding: 0.1875em;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-seg-radius, 0.5em));\r
      background: var(--auto-secondary-bgcolor, var(--asc-tabs-seg-bg, rgba(245, 245, 245, 0.45)));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab {\r
      padding: 0.3125em 0.875em;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-seg-tab-radius, 0.375em));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--auto-color, var(--asc-tabs-color, #606060));\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(0, 0, 0, 0.04)));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tabs-seg-ink, #ffffff);\r
      background: var(--asc-tone);\r
    }\r
\r
    .asc-tabs-content {\r
      padding: 0.75em 0.125em;\r
    }\r
    .asc-tabs-content:empty {\r
      display: none;\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-content {\r
      padding: var(--asc-tabs-content-pad, 0.8em 1em);\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
      border-top: none;\r
      border-radius: 0 0 0.375em 0.375em;\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #ffffff));\r
    }\r
\r
    [dark] .asc-tabs-tab,\r
    [data-dark] .asc-tabs-tab {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tabs-primary, #56baff));\r
      color: var(--auto-secondary-color, var(--asc-tabs-tab-color, rgba(255, 255, 255, 0.65)));\r
    }\r
    [dark] .asc-tabs-tab:disabled,\r
    [data-dark] .asc-tabs-tab:disabled {\r
      color: var(--auto-disable-color, var(--asc-tabs-disable-color, rgba(255, 255, 255, 0.25)));\r
    }\r
    [dark] .asc-tabs-body[data-variant="line"] .asc-tabs-bar,\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="line"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-bar {\r
      border-bottom-color: var(--auto-border-color, var(--asc-tabs-border, #52525b));\r
    }\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(255, 255, 255, 0.08)));\r
    }\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--auto-color, var(--asc-tabs-color, #fafafa));\r
    }\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active],\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-content,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active],\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-content {\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #3a3a3a));\r
      border-color: var(--auto-border-color, var(--asc-tabs-border, #52525b));\r
    }\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar {\r
      background: var(--auto-secondary-bgcolor, var(--asc-tabs-seg-bg, rgba(129, 129, 129, 0.45)));\r
    }\r
  </style>\r
  <div class="asc-tabs-body" :data-variant="variant">\r
    <div class="asc-tabs-bar" role="tablist" x-for="item of items" :key="item.key">\r
      <button\r
        type="button"\r
        class="asc-tabs-tab"\r
        role="tab"\r
        :data-active="String(item.key) === String(value) ? '' : null"\r
        :aria-selected="String(item.key) === String(value) ? 'true' : 'false'"\r
        :tabindex="String(item.key) === String(value) ? '0' : '-1'"\r
        :disabled="item.disabled"\r
        @click="onTabClick(item)"\r
      >\r
        <i class="asc-tabs-tab-icon" x-show="item.icon" x-icon="item.icon"></i>\r
        <span class="asc-tabs-tab-label">{{ item.label }}</span>\r
      </button>\r
    </div>\r
    <div class="asc-tabs-content" x-slot></div>\r
  </div>\r
</div>\r
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-tabs`))){let e=document.createElement(`div`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-tab`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);return n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):l.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.tabs.js.map
