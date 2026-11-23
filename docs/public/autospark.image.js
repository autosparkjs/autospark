(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.image`]=`<div\r
  class="asc-image"\r
  x-define="autospark.image"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            src: "",
            alt: "",
            lazy: false,
            fit: "",
            width: "",
            height: "",
            fallback: "file-error",
            loaded: false,
            failed: false,
            errorArmed: false,
        }),\r
        methods: {\r
            onImgLoad() {\r
                this.data.loaded = true;\r
                this.data.failed = false;\r
            },\r
            onImgError() {\r
                if (!this.data.errorArmed) return;\r
                this.data.loaded = false;\r
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
                this.data.loaded = false;\r
                this.data.failed = false;\r
                rearm();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-image">\r
    .asc-image {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-image-font-size, 0.875rem));\r
    }\r
\r
    .asc-image-inner {\r
      position: relative;\r
      display: block;\r
      width: 100%;\r
      overflow: hidden;\r
      border-radius: var(--auto-border-radius, var(--asc-image-radius, 0.375rem));\r
      background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(0, 0, 0, 0.04)));\r
      min-height: 1em;\r
    }\r
    .asc-image-img {\r
      display: block;\r
      width: 100%;\r
      height: 100%;\r
    }\r
    .asc-image-img[data-fit="fill"] { object-fit: fill; }\r
    .asc-image-img[data-fit="contain"] { object-fit: contain; }\r
    .asc-image-img[data-fit="cover"] { object-fit: cover; }\r
    .asc-image-img[data-fit="none"] { object-fit: none; }\r
    .asc-image-img[data-fit="scale-down"] { object-fit: scale-down; }\r
\r
    .asc-image-spinner {\r
      display: flex;\r
      position: absolute;\r
      inset: 0;\r
      display: flex;\r
      align-items: center;\r
      justify-content: center;\r
      font-size: 1.6em;\r
      color: var(--auto-third-color, var(--asc-image-spinner-color, rgba(0, 0, 0, 0.35)));\r
      pointer-events: none;\r
    }\r
    .asc-image-fallback {\r
      display: flex;\r
      flex-direction: column;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.5em;\r
      min-height: 4em;\r
      padding: 1em;\r
      color: var(--auto-third-color, var(--asc-image-fallback-color, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-image-fallback-img {\r
      display: block;\r
      max-width: 100%;\r
      max-height: 100%;\r
      object-fit: contain;\r
    }\r
    .asc-image-fallback-icon {\r
      font-size: 2.2em;\r
      line-height: 1;\r
    }\r
    .asc-image-fallback-text {\r
      font-size: 0.875em;\r
      color: var(--auto-secondary-color, var(--asc-image-fallback-hint-color, rgba(0, 0, 0, 0.55)));\r
    }\r
    .asc-image-fallback-text:empty {\r
      display: none;\r
    }\r
\r
    [dark] .asc-image-inner,\r
    [data-dark] .asc-image-inner {\r
      background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(255, 255, 255, 0.1)));\r
    }\r
    [dark] .asc-image-spinner,\r
    [data-dark] .asc-image-spinner {\r
      color: var(--auto-third-color, var(--asc-image-spinner-color, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-image-fallback,\r
    [data-dark] .asc-image-fallback {\r
      color: var(--auto-third-color, var(--asc-image-fallback-color, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-image-fallback-text,\r
    [data-dark] .asc-image-fallback-text {\r
      color: var(--auto-secondary-color, var(--asc-image-fallback-hint-color, rgba(255, 255, 255, 0.65)));\r
    }\r
  </style>\r
  <div class="asc-image-inner">\r
    <img\r
      class="asc-image-img"\r
      x-show="src && !failed"\r
      :src="src"\r
      :alt="alt"\r
      :loading="lazy ? 'lazy' : 'eager'"\r
      :width="width"\r
      :height="height"\r
      :data-fit="fit"\r
      @load="onImgLoad()"\r
      @error="onImgError()"\r
    />\r
    <i\r
      class="asc-image-spinner"\r
      x-show="src && !loaded && !failed"\r
      x-icon="'loading'"\r
    ></i>\r
    <div\r
      class="asc-image-fallback"\r
      x-show="!src || failed"\r
    >\r
      <img\r
        class="asc-image-fallback-img"\r
        x-show="typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback))"\r
        :src="(typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback))) ? fallback : ''"\r
        :alt="alt"\r
      />\r
      <i\r
        class="asc-image-fallback-icon"\r
        x-show="!(typeof fallback === 'string' && (fallback.charAt(0) === '/' || fallback.startsWith('./') || fallback.startsWith('../') || /^[a-z][a-z0-9+.-]*:/i.test(fallback)))"\r
        x-icon="fallback"\r
      ></i>\r
      <span class="asc-image-fallback-text" x-text="alt"></span>\r
    </div>\r
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

//# sourceMappingURL=autospark.image.js.map
