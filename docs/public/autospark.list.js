(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.list`]=`<div\r
  class="asc-list"\r
  x-define="autospark.list"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],
            virtual: false,
            loading: false,
            bordered: true,
            split: true,
        }),\r
    }\r
  <\/script>\r
  <style global id="autospark-components-list">\r
    .asc-list {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-list-font-size, 0.875rem));\r
    }\r
\r
    .asc-list-inner {\r
      --asc-line: var(--auto-border-color, var(--asc-list-border-color, #d9d9d9));\r
      position: relative;
      display: block;\r
      background: var(--auto-bgcolor, var(--asc-list-bg, #ffffff));\r
      border: var(--auto-border-size, var(--asc-list-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(--auto-border-radius, var(--asc-list-radius, 0.5rem));\r
    }\r
    .asc-list-inner[data-borderless="true"] {\r
      --asc-line: transparent;\r
    }\r
\r
    /* ---------- 行：插槽出口即行容器（投影内容为直接子级；分隔线取相邻行命中——\r
         虚拟垫片（div[aria-hidden]）与空态段不参与相邻判定） ---------- */\r
    .asc-list-item {\r
      display: block;\r
      padding: 0.6em 1em;\r
      min-height: 2.4em;\r
      box-sizing: border-box;\r
    }\r
    .asc-list-inner[data-split="true"] .asc-list-item + .asc-list-item {\r
      border-top: var(--auto-border-size, var(--asc-list-border-size, 1px)) solid\r
        color-mix(in srgb, var(--asc-line, #d9d9d9) 60%, transparent);\r
    }\r
    .asc-list-item-text {\r
      display: block;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-color, var(--asc-list-color, #606060));\r
    }\r
\r
    .asc-list-inner[data-virtual="true"] .asc-list-body {\r
      height: var(--asc-list-virtual-height, 20em);\r
      overflow-y: auto;\r
      overscroll-behavior: contain;\r
    }\r
    /* 等高行假设：行定高与 x-for-options 的 itemHeight 同值（虚拟列表等高约束——\r
         autoDetect 在首渲染容器空时自败，显式声明是唯一稳定通道；自定义行高须同时\r
         覆盖 --asc-list-item-height 与 x-for-options，文档披露）。border-box 含分隔线 */\r
    .asc-list-inner[data-virtual="true"] .asc-list-item {\r
      height: var(--asc-list-item-height, 36px);\r
      min-height: 0;\r
      padding: 0 1em;\r
      line-height: 35px;\r
    }\r
\r
    .asc-list-empty {\r
      padding: 1.2em 1em;\r
    }\r
\r
    [dark] .asc-list-inner,\r
    [data-dark] .asc-list-inner {\r
      background: var(--auto-bgcolor, var(--asc-list-bg, #3a3a3a));\r
      --asc-line: var(--auto-border-color, var(--asc-list-border-color, #52525b));\r
    }\r
    [dark] .asc-list-item-text,\r
    [data-dark] .asc-list-item-text {\r
      color: var(--auto-color, var(--asc-list-color, #fafafa));\r
    }\r
  </style>\r
  <div\r
    class="asc-list-inner"\r
    :data-borderless="!bordered"\r
    :data-split="split"\r
    :data-virtual="virtual"\r
    :x-loading="loading ? 'true' : 'false'"\r
  >\r
    <div x-if="virtual">\r
      <div\r
        class="asc-list-body"\r
        x-for="item of items"\r
        x-for-options="{ virtual: true, itemHeight: 36 }"\r
      >\r
        <div class="asc-list-item" x-slot="{ name: 'row', params: { item, $index } }">\r
          <span\r
            class="asc-list-item-text"\r
            x-text="typeof item === 'object' && item !== null ? (item.label ?? item.title ?? item.name ?? item.value ?? '') : item"\r
          ></span>\r
        </div>\r
        <div class="asc-list-empty" x-empty>\r
          <div class="asc-list-empty-outlet" x-slot="{ name: 'empty' }">\r
            <x-empty></x-empty>\r
          </div>\r
        </div>\r
      </div>\r
    </div>\r
    <div x-if="!virtual">\r
      <div class="asc-list-body" x-for="item of items">\r
        <div class="asc-list-item" x-slot="{ name: 'row', params: { item, $index } }">\r
          <span\r
            class="asc-list-item-text"\r
            x-text="typeof item === 'object' && item !== null ? (item.label ?? item.title ?? item.name ?? item.value ?? '') : item"\r
          ></span>\r
        </div>\r
        <div class="asc-list-empty" x-empty>\r
          <div class="asc-list-empty-outlet" x-slot="{ name: 'empty' }">\r
            <x-empty></x-empty>\r
          </div>\r
        </div>\r
      </div>\r
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

//# sourceMappingURL=autospark.list.js.map
