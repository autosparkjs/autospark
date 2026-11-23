(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.alert`]=`<div
  class="asc-alert"
  x-define="autospark.alert"
  x-define:inherit="autospark.base"
  role="alert"
>
  <script setup>
    {
        data: () => ({
            type: "default",
            title: "",
            description: "",
            closable: false,
            icon: "",
            banner: false,
            closed: false,
            displayIcon: (s) => s.icon === false ? "" : (typeof s.icon === "object" && s.icon) ? (s.icon.name ?? "") : (typeof s.icon === "string" && s.icon ? s.icon : (s.type === "success" ? "success" : s.type === "warning" ? "warn" : s.type === "danger" ? "error" : s.type === "info" ? "info" : "bell"))
        }),
        methods: {
            onCloseClick(event) {
                event.stopPropagation();
                this.data.closed = true;
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
        },
        mounted() {
            const syncClosed = () => {
                if (this.data.closed) this.el.setAttribute("data-closed", "");
                else this.el.removeAttribute("data-closed");
            };
            syncClosed();
            this.watch("closed", () => { syncClosed(); });
        },
    }
  <\/script>
  <style global id="autospark-components-alert">
    /* 语义色基线（ADR-0018 决策 6.4，语义色体系在非 button 组件的首个落地——组织方式
       可复制）：--asc-tone 中转变量 + body data-type 变体属性经 :has() 反驱宿主，
       与 button ADR-0012 同款结构；警示条形态 = 语义色淡底（tone 10%）+ 语义色
       半透明边框（tone 38%）+ 标题/图标取 tone、描述取正文色 */
    .asc-alert {
      --asc-tone: var(--auto-color, var(--asc-alert-default, #606060));
      --asc-pad: var(--auto-padding, var(--asc-alert-padding, 0.8rem));
      display: flex;
      box-sizing: border-box;
      padding: calc(var(--asc-pad) * 0.7) calc(var(--asc-pad) * 0.85);
      border: var(--auto-border-size, var(--asc-alert-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-tone) 38%, transparent);
      border-radius: var(
        --auto-border-radius,
        var(--asc-alert-radius, 0.5rem)
      );
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
      color: var(--auto-color, var(--asc-alert-color, #606060));
      font-size: var(--auto-font-size, var(--asc-alert-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-alert-line-height, 1.5));
    }
    .asc-alert:has(> .asc-alert-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-alert-success, #22c55e));
    }
    .asc-alert:has(> .asc-alert-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-alert-warning, #f59e0b));
    }
    .asc-alert:has(> .asc-alert-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-alert-danger, #ef4444));
    }
    .asc-alert:has(> .asc-alert-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-alert-info, #71717a));
    }

    .asc-alert:has(> .asc-alert-body[data-banner="true"]) {
      border-radius: 0;
    }

    .asc-alert[data-closed] {
      display: none;
    }

    .asc-alert-body {
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      min-width: 0;
    }
    .asc-alert-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25em;
      color: var(--asc-tone);
      flex-shrink: 0;
    }
    .asc-alert-main {
      display: flex;
      flex-direction: column;
      gap: 0.2em;
      flex: 1;
      min-width: 0;
    }
    .asc-alert-title {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
    .asc-alert-desc:empty {
      display: none;
    }
    .asc-alert-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.15em;
      color: var(
        --auto-third-color,
        var(--asc-alert-close-color, rgba(0, 0, 0, 0.35))
      );
      cursor: pointer;
      flex-shrink: 0;
      border-radius: var(
        --auto-border-radius,
        var(--asc-alert-close-radius, 0.25rem)
      );
      transition: color 0.15s ease;
    }
    .asc-alert-close:hover {
      color: var(--auto-color, var(--asc-alert-close-hover, #606060));
    }

    [dark] .asc-alert,
    [data-dark] .asc-alert {
      --asc-tone: var(--auto-color, var(--asc-alert-default, #fafafa));
      color: var(--auto-color, var(--asc-alert-color, #fafafa));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="success"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-alert-success, #5cd07c));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="warning"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-alert-warning, #f0a03c));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="danger"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-alert-danger, #e6696a));
    }
    [dark] .asc-alert:has(> .asc-alert-body[data-type="info"]),
    [data-dark] .asc-alert:has(> .asc-alert-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-alert-info, #a1a1aa));
    }
    [dark] .asc-alert-close,
    [data-dark] .asc-alert-close {
      color: var(
        --auto-third-color,
        var(--asc-alert-close-color, rgba(255, 255, 255, 0.45))
      );
    }
    [dark] .asc-alert-close:hover,
    [data-dark] .asc-alert-close:hover {
      color: var(--auto-color, var(--asc-alert-close-hover, #fafafa));
    }
  </style>
  <div class="asc-alert-body" :data-type="type" :data-banner="banner">
    <i class="asc-alert-icon" x-if="displayIcon" x-icon="displayIcon"></i>
    <div class="asc-alert-main">
      <span class="asc-alert-title" x-if="title">{{ title }}</span>
      <span class="asc-alert-desc" x-slot>{{ description }}</span>
    </div>
    <i
      class="asc-alert-close"
      x-if="closable"
      x-icon="'no'"
      @click="onCloseClick($event)"
    ></i>
  </div>
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

//# sourceMappingURL=autospark.alert.js.map
