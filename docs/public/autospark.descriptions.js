(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.descriptions`;function a(e){e.components[i]=`<!--
    autospark.descriptions 描述列表（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行）：
    键值对网格展示——内部装配引擎 x-for 渲染 items（{ label, value, span? }[]），
    span 经克隆体 :style 内联下发 grid-column: span N（跨列位）。

    两形态（mounted 统一收敛到 items 数据面渲染，breadcrumb 同款）：
    - items 状态引用注入：<div x-component:autospark.descriptions="{ items: rows }">——
      引擎对值对象内的字面量数组 props 存在 _propsEqual 引用比较死环缺陷（P0 固化
      规避清单第 1 条），items 恒走状态引用；
    - 子元素声明（静态描述）：<x-descriptions-item label span> 由 index.ts 的
      precompile 变换折叠为 items JSON 落 data-* 通道（字符串标量），mounted 解析
      写组件 data → x-for 响应渲染。

    布局通道（columns / layout / bordered 经 JS 通道同步到 body 容器）：x-for 容器
    宿主的 :attr/@event 绑定不被编译（ownsChildren 静默失效，:key 例外）——列数网格
    模板与变体数据属性由 mounted + watch 写入（divider/space 同款 JS 通道范式）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——本组件无宿主级变体外观，绑定全落在编译子树内层。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号/内距档位经主题通道全跟随；descriptions 不在 data() 声明
     主题六键，内部变体属性亦禁用六个通道名 -->
<div
  class="asc-descriptions"
  x-define="autospark.descriptions"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],        // 描述项 { label, value, span? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底
            columns: 3,       // 每行列数（项位；span 跨项位）——经 JS 通道写 body 的 grid-template-columns
            bordered: false,  // 边框表格形态（gap 1px 间隙显线 + label 格灰底；缺省简洁形态）
            title: "",        // 标题（空时整段不占位）
            layout: "horizontal", // 标签排布：horizontal 缺省（label: value 横排）| vertical（标签在上）
        }),
        methods: {
            // 布局同步：columns 网格模板 + layout/bordered 变体数据属性写 body 容器
            //（x-for 宿主绑定不编译，JS 通道是唯一稳定通道）
            syncLayout() {
                const body = this.el.querySelector(".asc-descriptions-body");
                if (!body) return;
                const cols = parseInt(this.data.columns, 10);
                body.style.gridTemplateColumns = \`repeat(\${Number.isFinite(cols) && cols > 0 ? cols : 3}, minmax(0, 1fr))\`;
                body.setAttribute("data-layout", this.data.layout === "vertical" ? "vertical" : "horizontal");
                body.setAttribute("data-bordered", this.data.bordered ? "true" : "false");
            },
        },
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空表） */ }
                this.el.removeAttribute("data-items");
            }
            this.syncLayout();
            this.watch("columns", () => this.syncLayout());
            this.watch("layout", () => this.syncLayout());
            this.watch("bordered", () => this.syncLayout());
        },
    }
  <\/script>
  <style global id="autospark-components-descriptions">
    .asc-descriptions {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-descriptions-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- 标题：空值不占位（:empty 判定纪律——出口内容紧凑书写） ---------- */
    .asc-descriptions-head {
      margin-bottom: 0.75em;
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */
      color: var(--auto-color, var(--asc-descriptions-title-color, #303030));
    }
    .asc-descriptions-head:empty {
      display: none;
    }

    /* ---------- 项位网格：每项一格（span 跨项位经克隆体 :style 内联） ----------
         简洁形态（缺省）：行间距 + 列间距；bordered 形态经 data-bordered 切换为
         gap 1px 间隙显线（容器背景即线色，格子实底遮线——任意 span 布局单线不双线） */
    .asc-descriptions-body {
      display: grid;
      row-gap: 0.75em;
      column-gap: 2em;
    }
    .asc-descriptions-item {
      display: flex;
      align-items: baseline;
      gap: 0.5em;
      min-width: 0;
    }
    /* 简洁 horizontal：label 后中文冒号引导 */
    .asc-descriptions-body[data-bordered="false"][data-layout="horizontal"] .asc-descriptions-label::after {
      content: "：";
    }
    /* vertical：标签在上（简洁与 bordered 双形态共用） */
    .asc-descriptions-body[data-layout="vertical"] .asc-descriptions-item {
      flex-direction: column;
      gap: 0.2em;
    }
    .asc-descriptions-label {
      flex-shrink: 0;
      color: var(--auto-secondary-color, var(--asc-descriptions-label-color, rgba(0, 0, 0, 0.55)));
    }
    .asc-descriptions-value {
      min-width: 0;
      overflow-wrap: anywhere; /* 长值换行（URL/串号类值防撑破网格） */
      color: var(--auto-color, var(--asc-descriptions-value-color, #606060));
    }

    /* ---------- bordered 表格形态：gap 1px 间隙显线 + 外框收口 + label 格灰底 ---------- */
    .asc-descriptions-body[data-bordered="true"] {
      --asc-line: var(--auto-border-color, var(--asc-descriptions-border-color, #d9d9d9));
      gap: 1px;
      background: var(--asc-line);
      border: var(--auto-border-size, var(--asc-descriptions-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-descriptions-radius, 0.5rem));
      overflow: hidden; /* 圆角裁切格线 */
      row-gap: 1px;
    }
    /* 项 = label 格 + value 格（grid 两列；vertical 单列两行） */
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item {
      display: grid;
      grid-template-columns: minmax(5em, max-content) minmax(0, 1fr);
      gap: 0;
      align-items: stretch;
      background: var(--auto-bgcolor, var(--asc-descriptions-bg, #ffffff));
    }
    .asc-descriptions-body[data-bordered="true"][data-layout="vertical"] .asc-descriptions-item {
      grid-template-columns: minmax(0, 1fr);
    }
    /* 格子：内距落格子自身（label 灰底铺满其格；外层 gap 即格线宽） */
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-value {
      padding: 0.55em 1em;
      align-self: stretch;
    }
    .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label {
      background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #fafafa));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-descriptions-head,
    [data-dark] .asc-descriptions-head {
      color: var(--auto-color, var(--asc-descriptions-title-color, #fafafa));
    }
    [dark] .asc-descriptions-label,
    [data-dark] .asc-descriptions-label {
      color: var(--auto-secondary-color, var(--asc-descriptions-label-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-descriptions-value,
    [data-dark] .asc-descriptions-value {
      color: var(--auto-color, var(--asc-descriptions-value-color, #fafafa));
    }
    [dark] .asc-descriptions-body[data-bordered="true"],
    [data-dark] .asc-descriptions-body[data-bordered="true"] {
      --asc-line: var(--auto-border-color, var(--asc-descriptions-border-color, #52525b));
    }
    [dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item,
    [data-dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-item {
      background: var(--auto-bgcolor, var(--asc-descriptions-bg, #3a3a3a));
    }
    [dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,
    [data-dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label {
      background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #303030));
    }
  </style>
  <!-- 标题出口（空值 :empty 不占位）；项模板 = x-for 克隆体（li 形态的 div）：
         span 跨项位经 :style 内联（grid-column: span N，缺省 1）——克隆体内绑定可求值 -->
  <div class="asc-descriptions-inner">
    <div class="asc-descriptions-head">{{ title }}</div>
    <div class="asc-descriptions-body" x-for="item of items">
      <div
        class="asc-descriptions-item"
        :style="'grid-column: span ' + (item.span > 0 ? item.span : 1)"
      >
        <span class="asc-descriptions-label">{{ item.label }}</span>
        <span class="asc-descriptions-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-descriptions`))){let e=document.createElement(`div`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-descriptions-item`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={label:e.getAttribute(`label`)??``,value:(e.textContent??``).trim()},n=e.getAttribute(`span`);return n!=null&&n!==``&&(t.span=r(n)),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):l.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.descriptions.js.map
