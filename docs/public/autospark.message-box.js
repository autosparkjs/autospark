(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var t=`<div
  class="asc-message-box"
  x-define="autospark.message-box"
  x-define:inherit="autospark.base"
  role="alertdialog"
  aria-modal="true"
>
  <script setup>
    {
        data: () => ({
            type: "info",
            title: "",
            content: "",
            confirmText: "",
            cancelText: "",
            confirmType: "",
            showCancel: true,
            confirmBtnType: (s) => s.confirmType || (s.type === "danger" ? "danger" : "primary"),
            displayIcon: (s) => (s.type === "success" ? "success" : s.type === "warning" ? "warn" : s.type === "danger" ? "error" : "info"),
        }),
        methods: {
            onAction(event) {
                const btn = event.target instanceof Element ? event.target.closest("[data-mb-action]") : null;
                if (!btn || btn.disabled) return;
                const action = btn.getAttribute("data-mb-action");
                if (action !== "confirm" && action !== "cancel") return;
                this.el.dispatchEvent(new CustomEvent(action, { bubbles: true }));
                this.el.dispatchEvent(new CustomEvent("action:close", { bubbles: true }));
            },
        },
    }
  <\/script>
  <style global id="autospark-components-message-box">
    /* 语义色组织（alert 同款已定型结构，ADR-0018 决策 6.4）：--asc-tone 中转变量 +
       body data-type 变体属性经 :has() 反驱宿主——图标/确认钮色联动单源 */
    .asc-message-box {
      --asc-tone: var(--auto-info-color, var(--asc-message-box-info, #71717a));
      --asc-pad: var(--auto-padding, var(--asc-message-box-padding, 0.8rem));
      display: flex;
      box-sizing: border-box;
      min-width: 22rem;
      max-width: 32rem;
      padding: calc(var(--asc-pad) * 0.9) calc(var(--asc-pad) * 1.1);
      font-size: var(--auto-font-size, var(--asc-message-box-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-message-box-line-height, 1.5));
      color: var(--auto-color, var(--asc-message-box-color, #606060));
    }
    .asc-message-box:has(> .asc-message-box-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-message-box-success, #22c55e));
    }
    .asc-message-box:has(> .asc-message-box-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-message-box-warning, #f59e0b));
    }
    .asc-message-box:has(> .asc-message-box-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-message-box-danger, #ef4444));
    }

    .asc-message-box-body {
      display: flex;
      flex-direction: column;
      gap: calc(var(--asc-pad) * 1.1);
      width: 100%;
      min-width: 0;
    }
    .asc-message-box-main {
      display: flex;
      align-items: flex-start;
      gap: 0.7em;
      min-width: 0;
    }
    .asc-message-box-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      line-height: 1;
      color: var(--asc-tone);
      flex-shrink: 0;
    }
    .asc-message-box-text {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      flex: 1;
      min-width: 0;
      padding-top: 0.1em;
    }
    .asc-message-box-title {
      font-size: 1.1em;
      font-weight: var(--x-font-weight-medium, 500);
      color: var(--auto-color, var(--asc-message-box-title-color, #303030));
    }
    .asc-message-box-content {
      color: var(--auto-secondary-color, var(--asc-message-box-content-color, rgba(0, 0, 0, 0.55)));
      white-space: pre-wrap;
      word-break: break-word;
    }

    .asc-message-box-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.6em;
    }

    [dark] .asc-message-box,
    [data-dark] .asc-message-box {
      --asc-tone: var(--auto-info-color, var(--asc-message-box-info, #a1a1aa));
      color: var(--auto-color, var(--asc-message-box-color, #fafafa));
    }
    [dark] .asc-message-box:has(> .asc-message-box-body[data-type="success"]),
    [data-dark] .asc-message-box:has(> .asc-message-box-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-message-box-success, #5cd07c));
    }
    [dark] .asc-message-box:has(> .asc-message-box-body[data-type="warning"]),
    [data-dark] .asc-message-box:has(> .asc-message-box-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-message-box-warning, #f0a03c));
    }
    [dark] .asc-message-box:has(> .asc-message-box-body[data-type="danger"]),
    [data-dark] .asc-message-box:has(> .asc-message-box-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-message-box-danger, #e6696a));
    }
    [dark] .asc-message-box-title,
    [data-dark] .asc-message-box-title {
      color: var(--auto-color, var(--asc-message-box-title-color, #fafafa));
    }
    [dark] .asc-message-box-content,
    [data-dark] .asc-message-box-content {
      color: var(--auto-secondary-color, var(--asc-message-box-content-color, rgba(255, 255, 255, 0.65)));
    }
  </style>
  <div class="asc-message-box-body" :data-type="type">
    <div class="asc-message-box-main">
      <i class="asc-message-box-icon" x-icon="displayIcon"></i>
      <div class="asc-message-box-text">
        <div class="asc-message-box-title" x-if="title">{{ title }}</div>
        <div class="asc-message-box-content" x-slot>{{ content }}</div>
      </div>
    </div>
    <div class="asc-message-box-actions" @click="onAction($event)">
      <span class="asc-message-box-cancel" x-if="showCancel">
        <button
          x-component:autospark.button="{
            variant: 'default',
            autoInsertSpace: false,
            label: cancelText || (t('message-box.cancel') === 'message-box.cancel' ? '取消' : t('message-box.cancel'))
          }"
          data-mb-action="cancel"
        ></button>
      </span>
      <button
        x-component:autospark.button="{
          variant: 'primary',
          type: confirmBtnType,
          autoInsertSpace: false,
          label: confirmText || (t('message-box.confirm') === 'message-box.confirm' ? '确定' : t('message-box.confirm'))
        }"
        data-mb-action="confirm"
      ></button>
    </div>
  </div>
</div>
`;function n(e){e.components[`autospark.message-box`]=t,e.components[`message-box`]=t}r();function r(){e(e=>{n(e)})}};
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

//# sourceMappingURL=autospark.message-box.js.map
