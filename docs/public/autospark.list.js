(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.list`]=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——变体绑定（bordered/split/virtual）与 loading 组合全部落在编译子树的\r
    内层 inner 元素上（card 同款范式，宿主为透明块壳）。\r
\r
    内部装配（ADR-0018 决策 2「内部装配、对外开箱」）：\r
    - x-for（引擎）：items 渲染——行模板 = row 插槽出口（作用域插槽：出口值\r
      \`{ name, params }\` 动态名对象形态，params \`{ item, $index }\` 在项 localData\r
      作用域求值，调用方经 \`<template x-slot:row="{ item, $index }">\` 解构消费；\r
      无插槽时 fallback 行做 label/title/name/value 四键探测 + 标量兜底）；\r
    - x-empty（引擎结构标记）：空数组的 special 空态——empty 插槽可整体重载，\r
      fallback 组合 autospark.empty 组件（其 description 走 i18n「暂无数据」通道）；\r
    - x-loading（引擎运行时指令）：loading props 经绑定通道写字面量值（"true"/"false"\r
      三态），覆盖层铺满 inner；裸属性值变化触发 attrChanged（无修饰符）；\r
    - x-for.virtual（features/virtual 插件）：virtual=true 经 x-if 结构分叉启用\r
      （x-for 编译期选项无法响应 props，分叉是静态模板的响应式接线形态）；\r
      行定高假设由 CSS 行高保证（等高行，策略首项实测项高）。\r
\r
    出口声明形态（重要）：virtual 分叉与普通分叉各持一份 row/empty 出口（分叉结构\r
    所需），而快照收集期的同名出口静态去重会剥除后者标记（ADR-0056「重复声明后者\r
    忽略」）——故两份出口统一走**动态名对象形态** \`x-slot="{ name, params }"\`\r
    （ADR-0107）：动态名出口不入静态清单、不参与同名去重，运行期仅活跃分叉（x-if\r
    剪枝后）实例化投影，双分叉共享调用方同一份内容段（静态克隆段可多次消费）。\r
\r
    items 变更通道：props 为调用方状态**引用**注入——整体替换（state.xx = [...]）\r
    驱动重渲；调用方对原数组的**原地**增删（push/splice）经全局路径发信号、不经\r
    组件域（autostore 路径驱动响应式的跨域边界），不触发重渲（文档披露）。\r
\r
    事件出口：行内交互经行元素原生冒泡（插槽内容在调用方作用域编译，@click 等\r
    直接写在行模板内容上）——组件零内建事件。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——字号/内距随 data-size 档位缩放（em 基准）；list 不在 data()\r
     声明主题六键，内部变体属性亦禁用六个通道名 -->\r
<div\r
  class="asc-list"\r
  x-define="autospark.list"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            items: [],      // 数据源：数组（状态引用注入——字面量数组触发 props 更新死循环，ADR-0019 后果 2）\r
            virtual: false, // 虚拟滚动（x-for.virtual 组合；须同页引入 autospark.virtual.js，缺位退化全量渲染）\r
            loading: false, // 加载态（引擎 x-loading 覆盖层组合，铺满列表）\r
            bordered: true, // 边框开关（false 转透明色，盒模型占位稳定不跳变）\r
            split: true,    // 行间分隔线（相邻行 border-top；末行/首行无线）\r
        }),\r
    }\r
  <\/script>\r
  <style global id="autospark-components-list">\r
    /* 宿主：块级满宽透明壳，字号基线经 data-size 档位全跟随（行内距/行高以 em 标定缩放） */\r
    .asc-list {\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-list-font-size, 0.875rem));\r
    }\r
\r
    /* ---------- 列表盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */\r
    .asc-list-inner {\r
      --asc-line: var(--auto-border-color, var(--asc-list-border-color, #d9d9d9));\r
      position: relative; /* x-loading 覆盖层定位基准 */\r
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
    /* 默认行文本：单行省略（对象字段探测值可能长；自定义行插槽不受此约束） */\r
    .asc-list-item-text {\r
      display: block;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-color, var(--asc-list-color, #606060));\r
    }\r
\r
    /* ---------- 虚拟滚动：定高滚动容器（x-for 容器即滚动宿主，策略监听其 scrollTop） ---------- */\r
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
    /* ---------- 空态段（x-empty special 渲染位） ---------- */\r
    .asc-list-empty {\r
      padding: 1.2em 1em;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 变体数据属性 + loading 组合承载在 inner（编译子树内层元素）；\r
         loading 三态字面量（"true"/"false"）——裸 x-loading 值变化触发 attrChanged，\r
         假态显式 "false" 而非移除（增删触发 mounted/unmounted 通道同样有效，取值态\r
         让覆盖层重建路径统一走 attrChanged） -->\r
  <div\r
    class="asc-list-inner"\r
    :data-borderless="!bordered"\r
    :data-split="split"\r
    :data-virtual="virtual"\r
    :x-loading="loading ? 'true' : 'false'"\r
  >\r
    <!-- 虚拟滚动分叉：virtual=true（x-for 的 virtual 是编译期选项，props 响应式经\r
             x-if 结构分叉接线；未加载 virtual 插件时策略缺位 warn 退化全量渲染） -->\r
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
    <!-- 普通分叉：virtual=false（缺省） -->\r
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
