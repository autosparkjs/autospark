(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.card`]=`<div\r
  class="asc-card"\r
  x-define="autospark.card"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            title: "",
            bordered: true,
            hoverable: false,
            collapsible: false,
            collapsed: false,
        }),\r
        methods: {\r
            onHeadClick() {\r
                if (!this.data.collapsible) return;\r
                this.data.collapsed = !this.data.collapsed;\r
                this.el.dispatchEvent(new CustomEvent("collapse", { bubbles: true, detail: { collapsed: this.data.collapsed } }));\r
            },\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-card">\r
    /* 宿主：透明块壳（盒子样式全在 inner），仅承载块级排版与字号基线\r
         （--auto-font-size 随 data-size 档位全跟随，button 同范式 ADR-0012） */\r
    .asc-card {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-card-font-size, 0.875rem));\r
    }\r
\r
    .asc-card-inner {\r
      --asc-pad: var(--auto-padding, var(--asc-card-padding, 0.8rem));\r
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #d9d9d9));\r
      display: flex;\r
      flex-direction: column;\r
      background: var(--auto-bgcolor, var(--asc-card-bg, #ffffff));\r
      border: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(--auto-border-radius, var(--asc-card-radius, 0.5rem));\r
      /* 阴影走 theme 手动通道：data-shadow 档位在 theme 在场时覆写 --auto-shadow，\r
           缺省兜底为极轻投影（对齐 theme 默认 medium 档校准值） */\r
      box-shadow: var(--auto-shadow, var(--asc-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04)));\r
      transition: box-shadow 0.2s ease, border-color 0.2s ease;\r
    }\r
    .asc-card-inner[data-borderless="true"] {\r
      --asc-line: transparent;\r
    }\r
    .asc-card-inner[data-hoverable="true"]:hover {\r
      border-color: var(--auto-primary-color, var(--asc-card-primary, #009aff));\r
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));\r
    }\r
\r
    .asc-card-head {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-bottom: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
      font-weight: var(--x-font-weight-large, 600);
      line-height: 1.4;\r
    }\r
    .asc-card-head:has(> .asc-card-toggle > .asc-card-head-main:empty):has(\r
        > .asc-card-extra:empty\r
      ):not(:has(.asc-card-arrow)) {\r
      display: none;\r
    }\r
    .asc-card-toggle {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.4em;\r
      min-width: 0;\r
      flex: 1;\r
    }\r
    .asc-card-head[data-collapsible="true"] .asc-card-toggle {\r
      cursor: pointer;\r
      user-select: none;\r
    }\r
    .asc-card-head-main {\r
      min-width: 0;\r
    }\r
    .asc-card-arrow {\r
      display: inline-flex;\r
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(0, 0, 0, 0.35)));\r
      transform: rotate(90deg);\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-card-head[data-collapsed="true"] .asc-card-arrow {\r
      transform: rotate(0deg);\r
    }\r
    .asc-card-extra {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.4em;\r
    }\r
    .asc-card-extra:empty {\r
      display: none;\r
    }\r
\r
    .asc-card-body {\r
      flex: 1;\r
      padding: var(--asc-pad);\r
    }\r
    .asc-card-body:empty {\r
      display: none;\r
    }\r
\r
    .asc-card-footer {\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-top: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
    }\r
    .asc-card-footer:empty {\r
      display: none;\r
    }\r
\r
    [dark] .asc-card-inner,\r
    [data-dark] .asc-card-inner {\r
      background: var(--auto-bgcolor, var(--asc-card-bg, #3a3a3a));\r
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #52525b));\r
    }\r
    [dark] .asc-card-inner[data-hoverable="true"]:hover,\r
    [data-dark] .asc-card-inner[data-hoverable="true"]:hover {\r
      border-color: var(--auto-primary-color, var(--asc-card-primary, #56baff));\r
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.4));\r
    }\r
    [dark] .asc-card-arrow,\r
    [data-dark] .asc-card-arrow {\r
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(255, 255, 255, 0.45)));\r
    }\r
  </style>\r
  <div\r
    class="asc-card-inner"\r
    :data-borderless="!bordered"\r
    :data-hoverable="hoverable"\r
  >\r
    <div\r
      class="asc-card-head"\r
      :data-collapsible="collapsible"\r
      :data-collapsed="collapsed"\r
    >\r
      <div class="asc-card-toggle" @click="onHeadClick()">\r
        <i class="asc-card-arrow" x-if="collapsible" x-icon="'arrow'"></i>\r
        <div class="asc-card-head-main" x-slot:header>{{ title }}</div>\r
      </div>\r
      <div class="asc-card-extra" x-slot:extra></div>\r
    </div>\r
    <div class="asc-card-body" x-show="!collapsed" x-slot></div>\r
    <div class="asc-card-footer" x-show="!collapsed" x-slot:footer></div>\r
  </div>\r
</div>\r
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

//# sourceMappingURL=autospark.card.js.map
