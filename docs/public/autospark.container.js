(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.container`,a={"x-container-header":`header`,"x-container-aside":`aside`,"x-container-footer":`footer`,"x-container-main":null};function o(e){e.components[i]=`<div
  class="asc-container"
  x-define="autospark.container"
  x-define:inherit="autospark.base"
  x-define-options="{tag:false}"
>
  <script setup>
    {
        data: () => ({
            asidePosition: "start",
        }),
    }
  <\/script>
  <style global id="autospark-components-container">
    /* 宿主：透明块壳（高度语义：满父高——容器壳的价值在四区自分割，父级应给定高度；
         未给定高度时 1fr 主区退化为内容高） */
    .asc-container {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 12rem;
      font-size: var(--auto-font-size, var(--asc-container-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
      color: var(--auto-color, var(--asc-container-color, #606060));
    }

    /* ---------- body：四区 grid 版式载体（编译子树内层，绑定可求值） ----------
       区域模板（start 缺省）：header 横贯顶 / aside 左栏 / main 主区 / footer 横贯底 */
    .asc-container-body {
      --asc-line: var(--auto-border-color, var(--asc-container-border-color, #d9d9d9));
      display: grid;
      width: 100%;
      height: 100%;
      grid-template-columns: auto 1fr;
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        "header header"
        "aside main"
        "footer footer";
    }
    .asc-container-body[data-aside="end"] {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "header header"
        "main aside"
        "footer footer";
    }

    .asc-container-header {
      grid-area: header;
      display: flex;
      align-items: center;
      gap: 0.6em;
      min-width: 0;
      padding: calc(var(--auto-padding, var(--asc-container-padding, 0.8rem)) * 0.75)
        var(--auto-padding, var(--asc-container-padding, 0.8rem));
      background: var(--auto-panel-header-bgcolor, var(--auto-secondary-bgcolor, var(--asc-container-header-bg, rgba(245, 245, 245, 0.45))));
      border-bottom: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
      font-weight: var(--x-font-weight-large, 600);
    }
    .asc-container-aside {
      grid-area: aside;
      display: block;
      min-width: 0;
      width: var(--asc-container-aside-width, auto);
      padding: var(--auto-padding, var(--asc-container-padding, 0.8rem));
      background: var(--auto-secondary-bgcolor, var(--asc-container-aside-bg, rgba(245, 245, 245, 0.25)));
      overflow: auto;
    }
    .asc-container-body[data-aside="end"] .asc-container-aside {
      border-left: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
    }
    .asc-container-body:not([data-aside="end"]) .asc-container-aside {
      border-right: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
    }
    .asc-container-main {
      grid-area: main;
      display: block;
      min-width: 0;
      min-height: 0;
      padding: var(--auto-padding, var(--asc-container-padding, 0.8rem));
      overflow: auto;
    }
    .asc-container-footer {
      grid-area: footer;
      display: flex;
      align-items: center;
      gap: 0.6em;
      min-width: 0;
      padding: calc(var(--auto-padding, var(--asc-container-padding, 0.8rem)) * 0.75)
        var(--auto-padding, var(--asc-container-padding, 0.8rem));
      border-top: var(--auto-border-size, var(--asc-container-border-size, 1px)) solid var(--asc-line);
    }
    .asc-container-header:empty,
    .asc-container-aside:empty,
    .asc-container-main:empty,
    .asc-container-footer:empty {
      display: none;
    }

    [dark] .asc-container,
    [data-dark] .asc-container {
      color: var(--auto-color, var(--asc-container-color, #fafafa));
    }
    [dark] .asc-container-body,
    [data-dark] .asc-container-body {
      --asc-line: var(--auto-border-color, var(--asc-container-border-color, #52525b));
    }
    [dark] .asc-container-header,
    [data-dark] .asc-container-header {
      background: var(--auto-panel-header-bgcolor, var(--auto-secondary-bgcolor, var(--asc-container-header-bg, rgba(129, 129, 129, 0.18))));
    }
    [dark] .asc-container-aside,
    [data-dark] .asc-container-aside {
      background: var(--auto-secondary-bgcolor, var(--asc-container-aside-bg, rgba(129, 129, 129, 0.1)));
    }
  </style>
  <div class="asc-container-body" :data-aside="asidePosition">
    <header class="asc-container-header" x-slot:header></header>
    <aside class="asc-container-aside" x-slot:aside></aside>
    <main class="asc-container-main" x-slot></main>
    <footer class="asc-container-footer" x-slot:footer></footer>
  </div>
</div>
`,e.precompile?.(e=>{for(let o of Array.from(e.el.querySelectorAll(`x-container`))){let e=document.createElement(`div`);for(let e of Array.from(o.children)){let t=a[e.tagName.toLowerCase()];if(t===void 0)continue;if(t===null){e.replaceWith(...Array.from(e.childNodes));continue}let n=document.createElement(`template`);for(n.setAttribute(`x-slot:${t}`,``);e.firstChild;)n.content.appendChild(e.firstChild);e.replaceWith(n)}let s=[];for(let i of Array.from(o.attributes))i.name.startsWith(`:`)?s.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):s.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${s.join(`, `)} }`);o.firstChild;)e.appendChild(o.firstChild);o.replaceWith(e)}})}s();function s(){e(e=>{o(e)})}};
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

//# sourceMappingURL=autospark.container.js.map
