(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}function n(e){e.components[`autospark.card`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定（bordered/hoverable/collapsible/collapsed）全部落在编译子树的
    内层 inner 元素上，卡片盒子样式直接命中 inner 的 data-* 属性选择器（宿主 .asc-card
    为透明块壳，仅承载块级排版基线，无需 :has() 反驱）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - collapse：可折叠头部点击翻转后冒泡，detail = { collapsed }（翻转后的新值）；
      外部 props 驱动的 collapsed 变化不广播（防回环）。

    空段隐藏约定：title 空 + header/extra 槽无内容 + 不可折叠 → 整个 header 隐藏；
    footer 槽无内容 → footer 隐藏；body 槽无内容（纯头卡片）→ body 隐藏——:empty 判定
    要求出口内无空白文本节点，出口元素内容必须紧凑书写（button label 同款纪律）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——阴影/圆角/字号档位经主题通道全跟随（卡片阴影即走 data-shadow
     通道消费 --auto-shadow）；card 不在 data() 声明主题六键，内部变体属性亦禁用
     六个通道名 -->
<div
  class="asc-card"
  x-define="autospark.card"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            title: "",          // 头部标题（header 槽可整体重载，槽内容优先于本兜底）
            bordered: true,     // 边框开关（false 边框转透明色，盒模型占位稳定不跳变；绑定通道取反落 data-borderless——假值属性整个移除的家族约定下缺省即有边框）
            hoverable: false,   // 悬停浮起（边框点亮 + 阴影抬升；阴影档位基线仍随 data-shadow 通道）
            collapsible: false, // 头部可折叠（true 时点击标题区/箭头切换 collapsed；extra 区域不触发）
            collapsed: false,   // 折叠态（受控：外部 props 可驱动；内部切换经 collapse 事件广播）
        }),
        methods: {
            // 头部标题区点击（仅 collapsible 生效）：翻转 collapsed + collapse 事件冒泡
            //（detail = { collapsed } 翻转后的新值）；handler 挂在 toggle 组元素上，
            // header 槽内容替换不改变宿主元素的事件绑定；extra 区域不在组内不触发
            onHeadClick() {
                if (!this.data.collapsible) return;
                this.data.collapsed = !this.data.collapsed;
                this.el.dispatchEvent(new CustomEvent("collapse", { bubbles: true, detail: { collapsed: this.data.collapsed } }));
            },
        },
    }
  <\/script>
  <style global id="autospark-components-card">
    /* 宿主：透明块壳（盒子样式全在 inner），仅承载块级排版与字号基线
         （--auto-font-size 随 data-size 档位全跟随，button 同范式 ADR-0012） */
    .asc-card {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-card-font-size, 0.875rem));
    }

    /* ---------- 卡片盒子：变体数据属性直接命中 inner（编译子树内层） ---------- */
    .asc-card-inner {
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族），data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-card-padding, 0.8rem));
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #d9d9d9));
      display: flex;
      flex-direction: column;
      background: var(--auto-bgcolor, var(--asc-card-bg, #ffffff));
      border: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-card-radius, 0.5rem));
      /* 阴影走 theme 手动通道：data-shadow 档位在 theme 在场时覆写 --auto-shadow，
           缺省兜底为极轻投影（对齐 theme 默认 medium 档校准值） */
      box-shadow: var(--auto-shadow, var(--asc-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04)));
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .asc-card-inner[data-borderless="true"] {
      --asc-line: transparent;
    }
    /* 悬停浮起：边框点亮主色 + 阴影抬升（抬升档为组件自有视觉，--asc-card-hover-shadow 可覆盖） */
    .asc-card-inner[data-hoverable="true"]:hover {
      border-color: var(--auto-primary-color, var(--asc-card-primary, #009aff));
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
    }

    /* ---------- header：标题区（toggle 组）+ extra ---------- */
    .asc-card-head {
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);
      border-bottom: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid
        var(--asc-line);
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */
      line-height: 1.4;
    }
    /* 空头隐藏：title 空 + header/extra 槽无内容 + 不可折叠（箭头缺席）→ 整段不占位 */
    .asc-card-head:has(> .asc-card-toggle > .asc-card-head-main:empty):has(
        > .asc-card-extra:empty
      ):not(:has(.asc-card-arrow)) {
      display: none;
    }
    /* 标题区 toggle 组：箭头 + 标题出口（flex:1 把 extra 推向右缘）；可折叠时整组可点 */
    .asc-card-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      min-width: 0;
      flex: 1;
    }
    .asc-card-head[data-collapsible="true"] .asc-card-toggle {
      cursor: pointer;
      user-select: none;
    }
    .asc-card-head-main {
      min-width: 0;
    }
    /* 折叠箭头：缺省展开朝下（rotate 90°），折叠态收回朝右 */
    .asc-card-arrow {
      display: inline-flex;
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(0, 0, 0, 0.35)));
      transform: rotate(90deg);
      transition: transform 0.2s ease;
    }
    .asc-card-head[data-collapsed="true"] .asc-card-arrow {
      transform: rotate(0deg);
    }
    /* extra：header 右缘动作区（toggle 组 flex:1 已推开） */
    .asc-card-extra {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
    }
    .asc-card-extra:empty {
      display: none;
    }

    /* ---------- body：默认插槽出口（出口即容器，投影内容为直接子级） ---------- */
    .asc-card-body {
      flex: 1;
      padding: var(--asc-pad);
    }
    .asc-card-body:empty {
      display: none;
    }

    /* ---------- footer ---------- */
    .asc-card-footer {
      padding: calc(var(--asc-pad) * 0.75) var(--asc-pad);
      border-top: var(--auto-border-size, var(--asc-card-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-card-footer:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-card-inner,
    [data-dark] .asc-card-inner {
      background: var(--auto-bgcolor, var(--asc-card-bg, #3a3a3a));
      --asc-line: var(--auto-border-color, var(--asc-card-border-color, #4d4d4d));
    }
    [dark] .asc-card-inner[data-hoverable="true"]:hover,
    [data-dark] .asc-card-inner[data-hoverable="true"]:hover {
      border-color: var(--auto-primary-color, var(--asc-card-primary, #56baff));
      box-shadow: var(--asc-card-hover-shadow, 0 4px 12px rgba(0, 0, 0, 0.4));
    }
    [dark] .asc-card-arrow,
    [data-dark] .asc-card-arrow {
      color: var(--auto-third-color, var(--asc-card-arrow-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <!-- 变体数据属性承载在 inner（编译子树内层元素）；body/footer 的折叠显隐组合 x-show
         （spec 约定：可折叠勿引重机制） -->
  <div
    class="asc-card-inner"
    :data-borderless="!bordered"
    :data-hoverable="hoverable"
  >
    <div
      class="asc-card-head"
      :data-collapsible="collapsible"
      :data-collapsed="collapsed"
    >
      <!-- 标题区 toggle 组：箭头（结构元素，在 header 槽出口之外，不随槽内容替换消失）
               + header 槽出口（无内容时回退 {{ title }}——紧凑书写，:empty 判定纪律） -->
      <div class="asc-card-toggle" @click="onHeadClick()">
        <i class="asc-card-arrow" x-if="collapsible" x-icon="'arrow'"></i>
        <div class="asc-card-head-main" x-slot:header>{{ title }}</div>
      </div>
      <div class="asc-card-extra" x-slot:extra></div>
    </div>
    <div class="asc-card-body" x-show="!collapsed" x-slot></div>
    <div class="asc-card-footer" x-show="!collapsed" x-slot:footer></div>
  </div>
</div>
`,e.precompile?.(e=>{for(let n of Array.from(e.el.querySelectorAll(`x-card`))){if(n.hasAttribute(`x-component`))continue;let e=n.getAttribute(`title`);e!=null&&(n.hasAttribute(`:title`)||n.setAttribute(`:title`,JSON.stringify(t(e))),n.removeAttribute(`title`))}})}r();function r(){e(e=>{n(e)})}};
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
