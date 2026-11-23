(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.divider`]=`<div\r
  class="asc-divider"\r
  x-define="autospark.divider"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            vertical: false,
            dashed: false,
            align: "center",
            spacing: "",
        }),\r
        mounted() {\r
            const syncSpacing = () => {\r
                const el = this.el;\r
                el.style.removeProperty("margin-top");\r
                el.style.removeProperty("margin-bottom");\r
                el.style.removeProperty("margin-left");\r
                el.style.removeProperty("margin-right");\r
                const s = this.data.spacing;\r
                if (s === "" || s == null) return;\r
                const v = typeof s === "number" ? s + "px" : s;\r
                if (this.data.vertical) {\r
                    el.style.marginLeft = v;\r
                    el.style.marginRight = v;\r
                } else {\r
                    el.style.marginTop = v;\r
                    el.style.marginBottom = v;\r
                }\r
            };\r
            syncSpacing();\r
            this.watch("spacing", () => { syncSpacing(); });\r
            this.watch("vertical", () => { syncSpacing(); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-divider">\r
    .asc-divider {\r
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #d9d9d9));\r
      border: 0;\r
      margin: 0;\r
      font-size: var(--auto-font-size, var(--asc-divider-font-size, 0.875rem));\r
    }\r
    .asc-divider {\r
      display: block;\r
      width: 100%;\r
    }\r
    .asc-divider-body {\r
      display: flex;\r
      align-items: center;\r
      width: 100%;\r
    }\r
    .asc-divider-body::before,\r
    .asc-divider-body::after {\r
      content: "";\r
      flex: 1;\r
      border-top: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);\r
    }\r
    .asc-divider-body[data-dashed="true"]::before,\r
    .asc-divider-body[data-dashed="true"]::after {\r
      border-top-style: dashed;\r
    }\r
\r
    .asc-divider-body[data-align="left"]::before {\r
      flex: 0 0 0.5em;\r
    }\r
    .asc-divider-body[data-align="right"]::after {\r
      flex: 0 0 0.5em;\r
    }\r
\r
    .asc-divider-text {\r
      margin: 0 1em;\r
      color: var(--auto-color, var(--asc-divider-text-color, #606060));\r
      white-space: nowrap;\r
    }\r
    .asc-divider-text:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 垂直态（vertical）：宿主行内化、body 纵排、线段换 border-left；\r
         高度默认 0.9em（--asc-divider-length 可覆盖；flex 容器内由使用者以\r
         class/样式控制满高）---------- */\r
    .asc-divider:has(> .asc-divider-body[data-vertical="true"]) {\r
      display: inline-block;\r
      width: auto;\r
      height: var(--asc-divider-length, 0.9em);\r
      vertical-align: middle;\r
    }\r
    .asc-divider-body[data-vertical="true"] {\r
      display: inline-flex;\r
      flex-direction: column;\r
      align-items: center;\r
      width: auto;\r
      height: 100%;\r
    }\r
    .asc-divider-body[data-vertical="true"]::before,\r
    .asc-divider-body[data-vertical="true"]::after {\r
      flex: 1;\r
      width: 0;\r
      border-top: 0;\r
      border-left: var(--auto-border-size, var(--asc-divider-border-size, 1px)) solid var(--asc-line);\r
    }\r
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::before,\r
    .asc-divider-body[data-vertical="true"][data-dashed="true"]::after {\r
      border-left-style: dashed;\r
    }\r
    .asc-divider-body[data-vertical="true"] .asc-divider-text {\r
      display: none;\r
    }\r
\r
    [dark] .asc-divider,\r
    [data-dark] .asc-divider {\r
      --asc-line: var(--auto-border-color, var(--asc-divider-color, #52525b));\r
    }\r
    [dark] .asc-divider-text,\r
    [data-dark] .asc-divider-text {\r
      color: var(--auto-color, var(--asc-divider-text-color, #fafafa));\r
    }\r
  </style>\r
  <span\r
    class="asc-divider-body"\r
    :data-vertical="vertical"\r
    :data-dashed="dashed"\r
    :data-align="align"\r
  >\r
    <span class="asc-divider-text" x-slot></span>\r
  </span>\r
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

//# sourceMappingURL=autospark.divider.js.map
