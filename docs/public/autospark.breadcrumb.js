(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.breadcrumb`;function a(e){e.components[i]=`<nav\r
  class="asc-breadcrumb"\r
  x-define="autospark.breadcrumb"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],
            separator: "/",
        }),\r
        mounted() {\r
            const raw = this.el.getAttribute("data-items");\r
            if ((!this.data.items || !this.data.items.length) && raw) {\r
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空路径） */ }\r
                this.el.removeAttribute("data-items");\r
            }\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-breadcrumb">\r
    .asc-breadcrumb {\r
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012）；\r
         缺省文案色为次要色（路径导航的视觉降噪惯例），当前页项另覆正文色 */\r
      display: inline-flex;\r
      max-width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-breadcrumb-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, 1.5);\r
      color: var(--auto-secondary-color, var(--asc-breadcrumb-color, rgba(0, 0, 0, 0.55)));\r
    }\r
    .asc-breadcrumb-list {\r
      display: flex;\r
      flex-wrap: wrap;\r
      align-items: center;\r
      list-style: none;\r
      margin: 0;\r
      padding: 0;\r
      min-width: 0;\r
    }\r
    .asc-breadcrumb-item {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      min-width: 0;\r
    }\r
    .asc-breadcrumb-link {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      min-width: 0;\r
      color: var(--auto-primary-color, var(--asc-breadcrumb-link, #009aff));\r
      text-decoration: none;\r
      cursor: pointer;\r
      transition: color 0.15s ease, filter 0.15s ease;\r
    }\r
    .asc-breadcrumb-link:hover {\r
      filter: brightness(0.9);\r
    }\r
    .asc-breadcrumb-current {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      min-width: 0;\r
      color: var(--auto-color, var(--asc-breadcrumb-current, #606060));\r
    }\r
    .asc-breadcrumb-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
    }\r
    .asc-breadcrumb-sep {\r
      display: inline-flex;\r
      align-items: center;\r
      color: var(--auto-third-color, var(--asc-breadcrumb-sep, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-breadcrumb-item:last-child .asc-breadcrumb-sep {\r
      display: none;\r
    }\r
\r
    [dark] .asc-breadcrumb,\r
    [data-dark] .asc-breadcrumb {\r
      color: var(--auto-secondary-color, var(--asc-breadcrumb-color, rgba(255, 255, 255, 0.65)));\r
    }\r
    [dark] .asc-breadcrumb-link,\r
    [data-dark] .asc-breadcrumb-link {\r
      color: var(--auto-primary-color, var(--asc-breadcrumb-link, #56baff));\r
    }\r
    [dark] .asc-breadcrumb-current,\r
    [data-dark] .asc-breadcrumb-current {\r
      color: var(--auto-color, var(--asc-breadcrumb-current, #fafafa));\r
    }\r
    [dark] .asc-breadcrumb-sep,\r
    [data-dark] .asc-breadcrumb-sep {\r
      color: var(--auto-third-color, var(--asc-breadcrumb-sep, rgba(255, 255, 255, 0.45)));\r
    }\r
  </style>\r
  <ol class="asc-breadcrumb-list" x-for="item of items" :key="item.label">\r
    <li class="asc-breadcrumb-item">\r
      <a class="asc-breadcrumb-link" x-show="item.href" :href="item.href" :aria-current="$index === items.length - 1 ? 'page' : null">\r
        <i class="asc-breadcrumb-icon" x-show="item.icon" x-icon="item.icon"></i>\r
        <span class="asc-breadcrumb-label">{{ item.label }}</span>\r
      </a>\r
      <span class="asc-breadcrumb-current" x-show="!item.href" :aria-current="$index === items.length - 1 ? 'page' : null">\r
        <i class="asc-breadcrumb-icon" x-show="item.icon" x-icon="item.icon"></i>\r
        <span class="asc-breadcrumb-label">{{ item.label }}</span>\r
      </span>\r
      <span class="asc-breadcrumb-sep" aria-hidden="true">\r
        <i class="asc-breadcrumb-sep-icon" x-show="separator === 'arrow'" x-icon="'arrow'"></i>\r
        <span class="asc-breadcrumb-sep-text" x-show="separator !== 'arrow'">{{ separator }}</span>\r
      </span>\r
    </li>\r
  </ol>\r
</nav>\r
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-breadcrumb`))){let e=document.createElement(`nav`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-breadcrumb-item`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={label:e.getAttribute(`label`)??``},n=e.getAttribute(`href`);n!=null&&(t.href=n);let r=e.getAttribute(`icon`);return r!=null&&(t.icon=r),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):l.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.breadcrumb.js.map
