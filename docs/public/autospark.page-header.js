(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.page-header`]=`<!--
    autospark.page-header 页头（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
    title / subtitle 标题对 + back 返回钮 + extra（右侧动作区）/ 默认（内容区）双插槽。
    纯结构件。

    back 三态：false（缺省）不渲染 / true 图标钮（无文案）/ 文案字符串 = 图标 + 文案。
    点击派发 back 冒泡事件（detail 空）——组件不执行 history.back / router.back
    （router 隔离，ADR-0018 决策 6 约定 2，接管动作由消费者 @back 决定）。无 i18n
    文案：返回钮缺省图标无字，aria-label 以 back 文案或标题自描述（零内置文案的
    可访问性标注通道，rate 同款惯例）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——back 显隐/文案绑定全落在编译子树内层元素上。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随；page-header 不在 data() 声明主题六键 -->
<div
  class="asc-page-header"
  x-define="autospark.page-header"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            title: "",    // 页面标题
            subtitle: "", // 副标题（空不渲染）
            back: false,  // 返回钮：false 缺省不渲染 | true 图标钮（无文案）| 文案字符串 = 图标 + 文案
        }),
        methods: {
            // 返回钮点击：派发 back 冒泡事件（detail 空）——接管动作（history.back /
            // router.back / 自定义）由消费者 @back 决定，组件零副作用
            onBack() {
                this.el.dispatchEvent(new CustomEvent("back", { bubbles: true }));
            },
        },
    }
  <\/script>
  <style global id="autospark-components-page-header">
    .asc-page-header {
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012）；
         标题以 em 相对放大（1.375em，随档位整体缩放）；主色经 --asc-tone 中转（tabs 同款约定） */
      --asc-tone: var(--auto-primary-color, var(--asc-page-header-primary, #009aff));
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-page-header-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    /* ---------- 头行：返回钮 + 标题对 + extra（右缘动作区） ---------- */
    .asc-page-header-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75em;
      min-height: 2.5em;
      padding-bottom: 0.625em;
      border-bottom: var(--auto-border-size, var(--asc-page-header-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-page-header-border, #d9d9d9));
    }
    .asc-page-header-main {
      display: flex;
      align-items: center;
      gap: 0.5em;
      min-width: 0;
      flex: 1 1 auto;
    }
    /* 返回钮：自绘轻量图标钮（quiet 形态——透明底 + hover 浅底，button 范式的
       ghost 视觉近亲；不嵌套消费 autospark.button，保按需加载自包含） */
    .asc-page-header-back {
      appearance: none;
      border: none;
      background: transparent;
      font: inherit;
      line-height: inherit;
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      flex: none;
      margin: 0;
      padding: 0.3em;
      border-radius: var(--auto-border-radius, var(--asc-page-header-radius, 0.375em));
      color: var(--auto-secondary-color, var(--asc-page-header-back-color, rgba(0, 0, 0, 0.55)));
      cursor: pointer;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .asc-page-header-back:hover {
      color: var(--auto-color, var(--asc-page-header-color, #303133));
      background: var(--auto-hover-bgcolor, var(--asc-page-header-hover-bg, rgba(0, 0, 0, 0.06)));
    }
    .asc-page-header-back:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    /* 返回箭头：内置 arrow 图标指右，旋转 180° 指左 */
    .asc-page-header-back-icon {
      display: inline-flex;
      transform: rotate(180deg);
    }
    .asc-page-header-back-text {
      color: var(--auto-secondary-color, var(--asc-page-header-back-color, rgba(0, 0, 0, 0.55)));
    }
    /* 标题对：标题随档位相对放大，副标题次要色小字（空不占位） */
    .asc-page-header-titles {
      display: flex;
      align-items: baseline;
      gap: 0.625em;
      flex-wrap: wrap;
      min-width: 0;
    }
    .asc-page-header-title {
      margin: 0;
      min-width: 0;
      font-size: 1.375em;
      font-weight: var(--x-font-weight-large, 600); /* 语义层无标题字重变量，直取基础标尺 */
      line-height: 1.3;
      color: var(--auto-color, var(--asc-page-header-title-color, #303133));
    }
    .asc-page-header-subtitle {
      min-width: 0;
      color: var(--auto-secondary-color, var(--asc-page-header-subtitle, rgba(0, 0, 0, 0.55)));
    }
    /* extra：右侧动作区（推至右缘；空不占位） */
    .asc-page-header-extra {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      margin-left: auto;
    }
    .asc-page-header-extra:empty {
      display: none;
    }
    /* ---------- 内容区：默认插槽（空不占位） ---------- */
    .asc-page-header-content {
      padding-top: 0.75em;
    }
    .asc-page-header-content:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-page-header,
    [data-dark] .asc-page-header {
      --asc-tone: var(--auto-primary-color, var(--asc-page-header-primary, #56baff));
    }
    [dark] .asc-page-header-row,
    [data-dark] .asc-page-header-row {
      border-bottom-color: var(--auto-border-color, var(--asc-page-header-border, #52525b));
    }
    [dark] .asc-page-header-back,
    [data-dark] .asc-page-header-back {
      color: var(--auto-secondary-color, var(--asc-page-header-back-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-page-header-back:hover,
    [data-dark] .asc-page-header-back:hover {
      color: var(--auto-color, var(--asc-page-header-color, #fafafa));
      background: var(--auto-hover-bgcolor, var(--asc-page-header-hover-bg, rgba(255, 255, 255, 0.1)));
    }
    [dark] .asc-page-header-back-text,
    [dark] .asc-page-header-subtitle,
    [data-dark] .asc-page-header-back-text,
    [data-dark] .asc-page-header-subtitle {
      color: var(--auto-secondary-color, var(--asc-page-header-subtitle, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-page-header-title,
    [data-dark] .asc-page-header-title {
      color: var(--auto-color, var(--asc-page-header-title-color, #fafafa));
    }
  </style>
  <!-- back 显隐/文案绑定落内层（根上动态绑定不求值，T4=B）；无 back 时钮不渲染
         （x-show 隐藏不可见不占位）；aria-label 以 back 文案或标题自描述（零内置文案） -->
  <div class="asc-page-header-row">
    <div class="asc-page-header-main">
      <button
        type="button"
        class="asc-page-header-back"
        x-show="back"
        :aria-label="typeof back === 'string' && back ? back : title"
        @click="onBack()"
      >
        <i class="asc-page-header-back-icon" x-icon="'arrow'"></i>
        <span class="asc-page-header-back-text" x-show="typeof back === 'string' && back">{{ back }}</span>
      </button>
      <div class="asc-page-header-titles">
        <h1 class="asc-page-header-title">{{ title }}</h1>
        <span class="asc-page-header-subtitle" x-show="subtitle">{{ subtitle }}</span>
      </div>
    </div>
    <div class="asc-page-header-extra" x-slot:extra></div>
  </div>
  <!-- 内容区：默认插槽出口（出口须紧凑书写——:empty 判定） -->
  <div class="asc-page-header-content" x-slot></div>
</div>
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

//# sourceMappingURL=autospark.page-header.js.map
