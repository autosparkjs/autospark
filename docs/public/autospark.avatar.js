(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.avatar`]=`<span\r
  class="asc-avatar"\r
  x-define="autospark.avatar"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",
            icon: "",
            label: "",
            shape: "circle",
            failed: false,
            errorArmed: false,
        }),\r
        methods: {\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.failed = true;\r
            },\r
        },\r
        mounted() {\r
            setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            const rearm = () => setTimeout(() => { this.data.errorArmed = true; }, 0);\r
            let lastSrc = String(this.data.src ?? "");\r
            this.watch("src", ({ value }) => {\r
                const v = String(value ?? "");\r
                if (v === lastSrc) return;\r
                lastSrc = v;\r
                this.data.errorArmed = false;\r
                this.data.failed = false;\r
                rearm();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-avatar">\r
    .asc-avatar {\r
      display: inline-flex;\r
      font-size: var(--auto-font-size, var(--asc-avatar-font-size, 0.875rem));\r
      vertical-align: middle;\r
    }\r
\r
    .asc-avatar-inner {\r
      position: relative;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      width: 2.6em;\r
      height: 2.6em;\r
      overflow: hidden;\r
      flex: none;\r
      background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(0, 0, 0, 0.06)));\r
      border-radius: 50%;\r
      color: var(--auto-secondary-color, var(--asc-avatar-color, rgba(0, 0, 0, 0.55)));\r
      user-select: none;\r
    }\r
    .asc-avatar-inner[data-shape="square"] {\r
      border-radius: var(--auto-border-radius, var(--asc-avatar-radius, 0.375rem));\r
    }\r
\r
    .asc-avatar-img {\r
      width: 100%;\r
      height: 100%;\r
      object-fit: cover;\r
    }\r
    .asc-avatar-icon {\r
      display: inline-flex;\r
      font-size: 1.5em;\r
      line-height: 1;\r
    }\r
    .asc-avatar-char {\r
      font-size: 1.1em;\r
      font-weight: var(--x-font-weight-large, 600);\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
\r
    [dark] .asc-avatar-inner,\r
    [data-dark] .asc-avatar-inner {\r
      background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(255, 255, 255, 0.14)));\r
      color: var(--auto-secondary-color, var(--asc-avatar-color, rgba(255, 255, 255, 0.65)));\r
    }\r
  </style>\r
  <span class="asc-avatar-inner" :data-shape="shape">\r
    <img\r
      class="asc-avatar-img"\r
      x-show="src && !failed"\r
      :src="src"\r
      :alt="label"\r
      @error="onImgError()"\r
    />\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></i>\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && typeof icon === 'object' && icon && icon.name"\r
      x-icon="icon.name"\r
    ></i>\r
    <span\r
      class="asc-avatar-char"\r
      x-show="(!src || failed) && !icon && label"\r
      x-text="Array.from(String(label).trim())[0]"\r
    ></span>\r
    <i\r
      class="asc-avatar-icon"\r
      x-show="(!src || failed) && !icon && !label"\r
      x-icon="'default'"\r
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

//# sourceMappingURL=autospark.avatar.js.map
