(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.button`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层元素（插槽出口 span）上，经 :has() 选择器驱动宿主外观；原生 disabled 语义
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。
-->
<button class="asc-button" x-define="autospark.button">
  <script setup>
    {
        data: () => ({
            type: "default",
            size: "md",
            label: "按钮",
            disabled: false
        }),
        mounted() {
            // 原生 disabled 语义同步到宿主（化身后 this.el 即组件根）；
            // 后续 props 变化经 watch 保持同步
            this.el.disabled = !!this.data.disabled;
            this.watch("disabled", (v) => { this.el.disabled = !!v; });
        },
    }
  <\/script>
  <style global id="autospark-components-button">
    .asc-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      border: 1px solid transparent;
      border-radius: var(--asc-button-radius, 6px);
      cursor: pointer;
      font: inherit;
      line-height: 1.4;
      padding: 0.375rem 0.875rem;
      font-size: 0.875rem;
      background: var(--asc-button-bg, #f1f3f5);
      color: var(--asc-button-color, #212529);
      transition: filter 0.15s ease;
    }
    .asc-button:hover:not([disabled]) {
      filter: brightness(0.95);
    }
    .asc-button:active:not([disabled]) {
      filter: brightness(0.88);
    }
    .asc-button[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }
    /* type 外观变体（变体数据在内层出口元素上，经 :has() 驱动宿主） */
    .asc-button:has(> .asc-button-label[data-type="primary"]) {
      background: var(--asc-button-primary-bg, #339af0);
      color: var(--asc-button-primary-color, #fff);
    }
    .asc-button:has(> .asc-button-label[data-type="success"]) {
      background: var(--asc-button-success-bg, #37b24d);
      color: var(--asc-button-success-color, #fff);
    }
    .asc-button:has(> .asc-button-label[data-type="danger"]) {
      background: var(--asc-button-danger-bg, #f03e3e);
      color: var(--asc-button-danger-color, #fff);
    }
    /* size 尺寸变体（md 即基础样式） */
    .asc-button:has(> .asc-button-label[data-size="sm"]) {
      padding: 0.125rem 0.625rem;
      font-size: 0.75rem;
    }
    .asc-button:has(> .asc-button-label[data-size="lg"]) {
      padding: 0.5rem 1.25rem;
      font-size: 1rem;
    }
  </style>
  <!-- 默认插槽出口：未提供内容时显示 {{ label }}（组件自身状态求值）；
         变体数据属性随出口元素承载（见文件头注释） -->
  <span class="asc-button-label" :data-type="type" :data-size="size" x-slot>{{ label }}</span>
</button>
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

//# sourceMappingURL=autospark.button.js.map
