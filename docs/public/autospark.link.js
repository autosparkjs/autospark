(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.link`;function a(e){e.components[i]=`<a
  class="asc-link"
  x-define="autospark.link"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            label: "",
            href: "",
            target: "",
            type: "primary",
            icon: "",
            disabled: false,
            underline: "hover",
        }),
        mounted() {
            const syncNative = () => {
                const el = this.el;
                const d = this.data;
                const explicitRel = el.getAttribute("rel");
                if (d.disabled) {
                    el.removeAttribute("href");
                    el.setAttribute("aria-disabled", "true");
                } else {
                    el.removeAttribute("aria-disabled");
                    if (d.href) el.setAttribute("href", d.href);
                    else el.removeAttribute("href");
                    if (String(d.target).includes("_blank") && !explicitRel) el.setAttribute("rel", "noopener");
                    else if (!explicitRel) el.removeAttribute("rel");
                }
                if (d.target) el.setAttribute("target", d.target);
                else el.removeAttribute("target");
            };
            syncNative();
            this.watch("href", () => { syncNative(); });
            this.watch("target", () => { syncNative(); });
            this.watch("disabled", () => { syncNative(); });

            this.el.addEventListener("click", (e) => {
                if (this.data.disabled) e.preventDefault();
            });
        },
    }
  <\/script>
  <style global id="autospark-components-link">
    .asc-link {
      /* 语义色中转（data-type 注入）+ 排版基线：字号经主题档位通道（data-size →
         --auto-font-size 全跟随，button 同范式 ADR-0012） */
      --asc-tone: var(--auto-primary-color, var(--asc-link-primary, #009aff));
      color: var(--asc-tone);
      font-size: var(--auto-font-size, var(--asc-link-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.15s ease, filter 0.15s ease;
    }
    .asc-link:has(> .asc-link-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-link-primary, #009aff));
    }
    .asc-link:has(> .asc-link-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-link-success, #22c55e));
    }
    .asc-link:has(> .asc-link-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-link-warning, #f59e0b));
    }
    .asc-link:has(> .asc-link-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-link-danger, #ef4444));
    }
    .asc-link:has(> .asc-link-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-link-info, #71717a));
    }
    .asc-link:has(> .asc-link-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-link-color, #606060));
    }

    .asc-link:has(> .asc-link-body[data-underline="hover"]):hover:not([aria-disabled="true"]) {
      text-decoration: underline;
    }
    .asc-link:has(> .asc-link-body[data-underline="always"]) {
      text-decoration: underline;
    }

    .asc-link:hover:not([aria-disabled="true"]) {
      filter: brightness(0.9);
    }
    .asc-link[aria-disabled="true"] {
      color: var(--auto-disable-color, var(--asc-link-disable-color, rgba(0, 0, 0, 0.25)));
      cursor: not-allowed;
      filter: none;
    }
    /* 非链接态（href 空）：呈现为可交互文本提示（无下划线、常规指针），语义色保留；
         禁用态（同无 href）保持 not-allowed 指针——排除以免后位覆盖 */
    .asc-link:not([href]):not([aria-disabled="true"]) {
      cursor: default;
    }
    .asc-link:not([href]):hover {
      filter: none;
    }

    .asc-link-body {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      min-width: 0;
    }
    .asc-link-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .asc-link-label:empty {
      display: none;
    }

    [dark] .asc-link,
    [data-dark] .asc-link {
      --asc-tone: var(--auto-primary-color, var(--asc-link-primary, #56baff));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="success"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-link-success, #5cd07c));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="warning"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-link-warning, #f0a03c));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="danger"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-link-danger, #e6696a));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="info"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-link-info, #a1a1aa));
    }
    [dark] .asc-link:has(> .asc-link-body[data-type="default"]),
    [data-dark] .asc-link:has(> .asc-link-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-link-color, #fafafa));
    }
    [dark] .asc-link[aria-disabled="true"],
    [data-dark] .asc-link[aria-disabled="true"] {
      color: var(--auto-disable-color, var(--asc-link-disable-color, rgba(255, 255, 255, 0.25)));
    }
  </style>
  <span
    class="asc-link-body"
    :data-type="type"
    :data-underline="underline"
  >
    <i
      class="asc-link-icon"
      x-if="typeof icon === 'string' && icon"
      x-icon="icon"
    ></i>
    <i
      class="asc-link-icon"
      x-if="typeof icon === 'object' && icon && icon.name"
      x-icon="icon.name"
    ></i>
    <span class="asc-link-label" x-slot>{{ label }}</span>
  </span>
</a>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-link`))){let e=document.createElement(`a`),o=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?o.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name===`rel`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):o.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${o.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.link.js.map
