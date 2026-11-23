(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.tag`]=`<span\r
  class="asc-tag"\r
  x-define="autospark.tag"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            type: "default",
            variant: "light",
            icon: "",
            closable: false,
            closed: false,
        }),\r
        methods: {\r
            onCloseClick(event) {\r
                event.stopPropagation();\r
                const ev = new CustomEvent("close", { bubbles: true, cancelable: true, detail: { event } });\r
                this.el.dispatchEvent(ev);\r
                if (!ev.defaultPrevented) this.data.closed = true;\r
            },\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-tag">\r
    /* 宿主即标签盒子：--asc-tone 语义色中转（data-type 注入）+ 三通道变量（data-variant 注入）；\r
         内距以 em 标定——随字号（data-size 档位 → --auto-font-size）自动缩放 */\r
    .asc-tag {\r
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));\r
      --asc-bg: color-mix(in srgb, var(--asc-tone, #606060) 10%, transparent);\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 38%, transparent);\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.25em;\r
      padding: 0.15em 0.6em;\r
      font-size: var(--auto-font-size, var(--asc-tag-font-size, 0.75rem));\r
      line-height: 1.5;\r
      border: var(--auto-border-size, var(--asc-tag-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));\r
      background: var(--asc-bg);\r
      color: var(--asc-ink);\r
      cursor: default;\r
      user-select: none;\r
      transition: filter 0.15s ease;\r
    }\r
\r
    .asc-tag:has(> .asc-tag-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #009aff));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #22c55e));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f59e0b));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #ef4444));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #71717a));\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-type="default"]) {\r
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));\r
    }\r
\r
    .asc-tag:has(> .asc-tag-body[data-variant="solid"]) {\r
      --asc-bg: var(--asc-tone);\r
      --asc-ink: #fff;\r
      --asc-line: transparent;\r
    }\r
    .asc-tag:has(> .asc-tag-body[data-variant="outline"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 55%, transparent);\r
    }\r
\r
    .asc-tag:has(> .asc-tag-body[data-closed="true"]) {\r
      display: none;\r
    }\r
\r
    .asc-tag-body {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.25em;\r
      min-width: 0;\r
    }\r
    .asc-tag-label:empty {\r
      display: none;\r
    }\r
    .asc-tag-close {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-right: -0.15em;\r
      padding: 0.05em;\r
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));\r
      cursor: pointer;\r
      transition: background-color 0.15s ease;\r
    }\r
    .asc-tag-close:hover {\r
      background: color-mix(in srgb, var(--asc-ink, currentColor) 25%, transparent);\r
    }\r
\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #56baff));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="success"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #5cd07c));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f0a03c));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #e6696a));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="info"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #a1a1aa));\r
    }\r
    [dark] .asc-tag:has(> .asc-tag-body[data-type="default"]),\r
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="default"]) {\r
      --asc-tone: var(--auto-color, var(--asc-tag-color, #fafafa));\r
    }\r
  </style>\r
  <span\r
    class="asc-tag-body"\r
    :data-type="type"\r
    :data-variant="variant"\r
    :data-closed="closed"\r
  >\r
    <i\r
      class="asc-tag-icon"\r
      x-if="typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></i>\r
    <i\r
      class="asc-tag-icon"\r
      x-if="typeof icon === 'object' && icon && icon.name"\r
      x-icon="icon.name"\r
    ></i>\r
    <span class="asc-tag-label" x-slot></span>\r
    <i\r
      class="asc-tag-close"\r
      x-if="closable"\r
      x-icon="'no'"\r
      @click="onCloseClick($event)"\r
    ></i>\r
  </span>\r
</span>\r
`}n();function n(){e(e=>{t(e)})}};
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

//# sourceMappingURL=autospark.tag.js.map
