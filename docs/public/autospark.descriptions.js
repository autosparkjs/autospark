(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.descriptions`;function a(e){e.components[i]=`<div
  class="asc-descriptions"
  x-define="autospark.descriptions"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],
            columns: 3,
            bordered: false,
            title: "",
            layout: "horizontal",
        }),
        methods: {
            syncLayout() {
                const body = this.el.querySelector(".asc-descriptions-body");
                if (!body) return;
                const cols = parseInt(this.data.columns, 10);
                body.style.gridTemplateColumns = \`repeat(\${Number.isFinite(cols) && cols > 0 ? cols : 3}, minmax(0, 1fr))\`;
                body.setAttribute("data-layout", this.data.layout === "vertical" ? "vertical" : "horizontal");
                body.setAttribute("data-bordered", this.data.bordered ? "true" : "false");
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空表） */ }
                this.el.removeAttribute("data-items");
            }
            this.syncLayout();
            this.watch("columns", () => this.syncLayout());
            this.watch("layout", () => this.syncLayout());
            this.watch("bordered", () => this.syncLayout());
        },
    }
  <\/script>
  <style global id="autospark-components-descriptions">
    .asc-descriptions {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-descriptions-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-descriptions-head {
      margin-bottom: 0.75em;
      font-weight: var(--x-font-weight-large, 600);
      color: var(--auto-color, var(--asc-descriptions-title-color, #303030));
    }
    .asc-descriptions-head:empty {
      display: none;
    }

    /* ---------- 项位网格：每项一格（span 跨项位经克隆体 :style 内联） ----------
         简洁形态（缺省）：行间距 + 列间距；bordered 形态经 data-bordered 切换为
         gap 1px 间隙显线（容器背景即线色，格子实底遮线——任意 span 布局单线不双线） */
    .asc-descriptions-body {
      display: grid;
      row-gap: 0.75em;
      column-gap: 2em;
    }
    .asc-descriptions-item {
      display: flex;
      align-items: baseline;
      gap: 0.5em;
      min-width: 0;
    }
    .asc-descriptions-body[data-bordered="false"][data-layout="horizontal"] .asc-descriptions-label::after {
      content: "：";
    }
    .asc-descriptions-body[data-layout="vertical"] .asc-descriptions-item {
      flex-direction: column;
      gap: 0.2em;
    }
    .asc-descriptions-label {
      flex-shrink: 0;
      color: var(--auto-secondary-color, var(--asc-descriptions-label-color, rgba(0, 0, 0, 0.55)));
    }
    .asc-descriptions-value {
      min-width: 0;
      overflow-wrap: anywhere;
      color: var(--auto-color, var(--asc-descriptions-value-color, #606060));
    }

    .asc-descriptions-body[data-bordered="true"] {
      --asc-line: var(--auto-border-color, var(--asc-descriptions-border-color, #d9d9d9));
      gap: 1px;
      background: var(--asc-line);
      border: var(--auto-border-size, var(--asc-descriptions-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-descriptions-radius, 0.5rem));
      overflow: hidden;
      row-gap: 1px;
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item {
      display: grid;
      grid-template-columns: minmax(5em, max-content) minmax(0, 1fr);
      gap: 0;
      align-items: stretch;
      background: var(--auto-bgcolor, var(--asc-descriptions-bg, #ffffff));
    }
    .asc-descriptions-body[data-bordered="true"][data-layout="vertical"] .asc-descriptions-item {
      grid-template-columns: minmax(0, 1fr);
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-value {
      padding: 0.55em 1em;
      align-self: stretch;
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label {
      background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #fafafa));
    }

    [dark] .asc-descriptions-head,
    [data-dark] .asc-descriptions-head {
      color: var(--auto-color, var(--asc-descriptions-title-color, #fafafa));
    }
    [dark] .asc-descriptions-label,
    [data-dark] .asc-descriptions-label {
      color: var(--auto-secondary-color, var(--asc-descriptions-label-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-descriptions-value,
    [data-dark] .asc-descriptions-value {
      color: var(--auto-color, var(--asc-descriptions-value-color, #fafafa));
    }
    [dark] .asc-descriptions-body[data-bordered="true"],
    [data-dark] .asc-descriptions-body[data-bordered="true"] {
      --asc-line: var(--auto-border-color, var(--asc-descriptions-border-color, #52525b));
    }
    [dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item,
    [data-dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item {
      background: var(--auto-bgcolor, var(--asc-descriptions-bg, #3a3a3a));
    }
    [dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,
    [data-dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label {
      background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #303030));
    }
  </style>
  <div class="asc-descriptions-inner">
    <div class="asc-descriptions-head">{{ title }}</div>
    <div class="asc-descriptions-body" x-for="item of items">
      <div
        class="asc-descriptions-item"
        :style="'grid-column: span ' + (item.span > 0 ? item.span : 1)"
      >
        <span class="asc-descriptions-label">{{ item.label }}</span>
        <span class="asc-descriptions-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-descriptions`))){let e=document.createElement(`div`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-descriptions-item`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={label:e.getAttribute(`label`)??``,value:(e.textContent??``).trim()},n=e.getAttribute(`span`);return n!=null&&n!==``&&(t.span=r(n)),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):l.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.descriptions.js.map
