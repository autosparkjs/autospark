(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.breadcrumb`;function a(e){e.components[i]=`<!--\r
    autospark.breadcrumb 面包屑（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行）：\r
    数据驱动 items（{ label, href?, icon? }[]）渲染层级路径——末项恒为「当前页」\r
    （aria-current="page"）；有 href 的项渲染为真 a 链接（primary 色，原生导航语义\r
    保真），无 href 的项渲染为纯文本（正文色）。\r
\r
    两形态（mounted 统一收敛到 items 数据面渲染）：\r
    - items 状态引用注入：<nav x-component:autospark.breadcrumb="{ items: crumbs }">——\r
      引擎对值对象内的字面量数组 props 存在 _propsEqual 引用比较死环缺陷（P0 固化\r
      规避清单第 1 条），items 恒走状态引用；\r
    - 子元素声明（静态路径）：<x-breadcrumb-item label href icon> 由 index.ts 的\r
      precompile 变换折叠为 items JSON 落 data-* 通道（字符串标量，规避字面量数组\r
      props），mounted 解析写组件 data → x-for 响应渲染。\r
\r
    分隔符（separator）："arrow" = x-icon 内置箭头 | 其他任意字符串原样文本（缺省 "/"）；\r
    末项分隔符经 :last-child 隐藏。\r
\r
    router 隔离（ADR-0018 决策 6 约定 2）：组件纯状态驱动、不 import router——点击\r
    拦截由外层包裹元素 @click.capture 判 a[href] preventDefault 接管（配方见组件文档）。\r
\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——本组件无宿主级变体外观，绑定全落在编译子树内层（克隆体内部元素）。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——字号档位经主题通道全跟随；breadcrumb 不在 data() 声明主题六键，\r
     内部变体属性亦禁用六个通道名 -->\r
<nav\r
  class="asc-breadcrumb"\r
  x-define="autospark.breadcrumb"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],      // 面包屑项 { label, href?, icon? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底\r
            separator: "/", // 分隔符："arrow" = x-icon 内置箭头 | 其他任意字符串原样文本（缺省 "/"）\r
        }),\r
        mounted() {\r
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props\r
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先\r
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
    /* 项载体：x-for 克隆载体（li 本体），链接/当前/分隔符横排 */\r
    .asc-breadcrumb-item {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      min-width: 0;\r
    }\r
    /* 链接项：primary 色（可点击语义引导），hover 压暗（link 同款交互惯例） */\r
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
    /* 当前项（无 href）：正文色（末项恒 aria-current="page"，绑定通道随项数变化响应） */\r
    .asc-breadcrumb-current {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      min-width: 0;\r
      color: var(--auto-color, var(--asc-breadcrumb-current, #606060));\r
    }\r
    /* 文案：单行截断（宽度受约束时省略号） */\r
    .asc-breadcrumb-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
    }\r
    /* 分隔符：辅助色弱化；末项分隔符隐藏（当前页后无路径） */\r
    .asc-breadcrumb-sep {\r
      display: inline-flex;\r
      align-items: center;\r
      color: var(--auto-third-color, var(--asc-breadcrumb-sep, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-breadcrumb-item:last-child .asc-breadcrumb-sep {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- x-for 容器宿主形态（engine 惯用语义）：ol 为容器（不克隆），其子 li 才是逐项\r
         克隆模板（:key 在容器上）；克隆体内条件显隐一律 x-show（不用 x-if）：共享快照\r
         多实例 + items 晚注入下 x-if 延迟编译会挂错 scope 链（P0 固化规避清单第 4 条，\r
         button-group 同款纪律）——href 在场 → 真 a 链接，缺席 → 纯文本当前项（互补双\r
         分支）；末项恒 aria-current（$index 判位）；分隔符双形态（arrow 图标 / 文本\r
         字符），末项经 :last-child 隐藏；icon 空值时 x-icon 渲染默认图标（x-show 隐藏\r
         不可见） -->\r
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
