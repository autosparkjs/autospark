(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.card`]=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——变体绑定（bordered/hoverable/collapsible/collapsed）全部落在编译子树的\r
    内层 inner 元素上，卡片盒子样式直接命中 inner 的 data-* 属性选择器（宿主 .asc-card\r
    为透明块壳，仅承载块级排版基线，无需 :has() 反驱）。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - collapse：可折叠头部点击翻转后冒泡，detail = { collapsed }（翻转后的新值）；\r
      外部 props 驱动的 collapsed 变化不广播（防回环）。\r
\r
    空段隐藏约定：title 空 + header/extra 槽无内容 + 不可折叠 → 整个 header 隐藏；\r
    footer 槽无内容 → footer 隐藏；body 槽无内容（纯头卡片）→ body 隐藏——:empty 判定\r
    要求出口内无空白文本节点，出口元素内容必须紧凑书写（button label 同款纪律）。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——阴影/圆角/字号档位经主题通道全跟随（卡片阴影即走 data-shadow\r
     通道消费 --auto-shadow）；card 不在 data() 声明主题六键，内部变体属性亦禁用\r
     六个通道名 -->\r
<div\r
  class="asc-card"\r
  x-define="autospark.card"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            title: "",          // 头部标题（header 槽可整体重载，槽内容优先于本兜底）\r
            bordered: true,     // 边框开关（false 边框转透明色，盒模型占位稳定不跳变；绑定通道取反落 data-borderless——假值属性整个移除的家族约定下缺省即有边框）\r
            hoverable: false,   // 悬停浮起（边框点亮 + 阴影抬升；阴影档位基线仍随 data-shadow 通道）\r
            collapsible: false, // 头部可折叠（true 时点击标题区/箭头切换 collapsed；extra 区域不触发）\r
            collapsed: false,   // 折叠态（受控：外部 props 可驱动；内部切换经 collapse 事件广播）\r
        }),\r
        methods: {\r
            // 头部标题区点击（仅 collapsible 生效）：翻转 collapsed + collapse 事件冒泡\r
            //（detail = { collapsed } 翻转后的新值）；handler 挂在 toggle 组元素上，\r
            // header 槽内容替换不改变宿主元素的事件绑定；extra 区域不在组内不触发\r
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
    /* ---------- 卡片盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */\r
    .asc-card-inner {\r
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族），data-spacing 档位全局调节生效 */\r
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
    /* 悬停浮起：边框点亮主色 + 阴影抬升（抬升档为组件自有视觉，--asc-card-hover-shadow 可覆盖） */\r
    .asc-card-inner[data-hoverable="true"]:hover {\r
      border-color: var(--auto-primary-color, var(--asc-card-primary, #009aff));\r
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));\r
    }\r
\r
    /* ---------- header：标题区（toggle 组）+ extra ---------- */\r
    .asc-card-head {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.5em;\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-bottom: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */\r
      line-height: 1.4;\r
    }\r
    /* 空头隐藏：title 空 + header/extra 槽无内容 + 不可折叠（箭头缺席）→ 整段不占位 */\r
    .asc-card-head:has(> .asc-card-toggle > .asc-card-head-main:empty):has(\r
        > .asc-card-extra:empty\r
      ):not(:has(.asc-card-arrow)) {\r
      display: none;\r
    }\r
    /* 标题区 toggle 组：箭头 + 标题出口（flex:1 把 extra 推向右缘）；可折叠时整组可点 */\r
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
    /* 折叠箭头：缺省展开朝下（rotate 90°），折叠态收回朝右 */\r
    .asc-card-arrow {\r
      display: inline-flex;\r
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(0, 0, 0, 0.35)));\r
      transform: rotate(90deg);\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-card-head[data-collapsed="true"] .asc-card-arrow {\r
      transform: rotate(0deg);\r
    }\r
    /* extra：header 右缘动作区（toggle 组 flex:1 已推开） */\r
    .asc-card-extra {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.4em;\r
    }\r
    .asc-card-extra:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- body：默认插槽出口（出口即容器，投影内容为直接子级） ---------- */\r
    .asc-card-body {\r
      flex: 1;\r
      padding: var(--asc-pad);\r
    }\r
    .asc-card-body:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- footer ---------- */\r
    .asc-card-footer {\r
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);\r
      border-top: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid\r
        var(--asc-line);\r
    }\r
    .asc-card-footer:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
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
  <!-- 变体数据属性承载在 inner（编译子树内层元素）；body/footer 的折叠显隐组合 x-show\r
         （spec 约定：可折叠勿引重机制） -->\r
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
      <!-- 标题区 toggle 组：箭头（结构元素，在 header 槽出口之外，不随槽内容替换消失）\r
               + header 槽出口（无内容时回退 {{ title }}——紧凑书写，:empty 判定纪律） -->\r
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
