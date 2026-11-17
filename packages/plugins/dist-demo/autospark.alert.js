(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.alert`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层 body 上，宿主级外观（淡底/语义色边框/圆角等）经 body 上的 data-* 变体属性
    以 :has() 驱动；closed 关闭态在 mounted 钩子经 JS 通道同步宿主 data-closed 属性
    （CSS 消费隐藏，属性驱动而非直接 display:none——使用者可经自定义 CSS 接管动画）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - close：closable 关闭图标点击冒泡，detail 为空（关闭即 closed 置位 + 宿主隐藏）

    与 x-error 指令的边界（ADR-0019）：x-error 是 error 事件通道的就近消费（行为
    指令——捕获子树运行时错误并呈现）；alert 是静态展示组件——内容（title/description）
    全部使用者传入，不监听 error 通道。动态错误呈现用 x-error，静态警示条用 alert，
    两者正交不互相替代。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随（--auto-font-size 基线），
     alert 不设自有字号属性（button 同范式 ADR-0012）；data() 不得声明主题六键，
     组件内部变体属性亦禁用六个通道名（data-type/data-banner 为自有变体轴） -->
<!-- 无内置文案、不接 i18n（ADR-0018 决策 6.1 通道对本件无消费面）：title/description
     均使用者传入 -->
<div
  class="asc-alert"
  x-define="autospark.alert"
  x-define:inherit="autospark.base"
  role="alert"
>
  <script setup>
    {
        data: () => ({
            type: "default",       // 语义色五档：success | warning | danger | info | default（中性，缺省）
            title: "",            // 标题文案（空则不渲染标题行）
            description: "",       // 描述文案（默认插槽内容优先；title 下常规正文色）
            closable: false,       // 关闭按钮：点击 closed 置位（宿主 data-closed → CSS 隐藏）+ close 事件冒泡
            icon: "",             // 图标覆盖：string 图标名 | { name } 对象 | false 关闭图标；空 = 按 type 默认映射内置图标
            banner: false,        // 边缘通栏形态：无圆角满宽（贴容器边缘）
            closed: false,        // 内部状态：关闭置位（外部状态注入亦可驱动——重开通道）
            // computed 简写（普通函数值即计算属性，仅限单表达式）：图标名解析——
            // 显式 icon 优先（false = 关闭不渲染），空则按 type 映射内置图标
            // （success→success / warning→warn / danger→error / info→info / 中性→bell）
            displayIcon: (s) => s.icon === false ? "" : (typeof s.icon === "object" && s.icon) ? (s.icon.name ?? "") : (typeof s.icon === "string" && s.icon ? s.icon : (s.type === "success" ? "success" : s.type === "warning" ? "warn" : s.type === "danger" ? "error" : s.type === "info" ? "info" : "bell"))
        }),
        methods: {
            // 关闭图标点击：阻断原生 click 冒泡（防误触外层点击域）→ closed 置位
            // （mounted 的 watch 同步宿主 data-closed 属性 → CSS 隐藏）→ 广播 close
            // 事件（bubbles，外层消费做联动）
            onCloseClick(event) {
                event.stopPropagation();
                this.data.closed = true;
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
        },
        mounted() {
            // closed → 宿主 data-closed 属性同步（化身路径约束：宿主属性走 JS 通道；
            // 回调收 { value } 信封对象，此处不取值只重查整态——家族惯用法见 overlay/foldable.ts）。
            // 外部经 props 注入 closed（引用外部状态）时本通道兼作重开入口（false → 摘属性）
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
      /* 语义色中转（data-type 注入；中性缺省 = 正文色） */
      --asc-tone: var(--auto-color, var(--asc-alert-default, #606060));
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-alert-padding, 0.8rem));
      display: flex; /* 显式块级：元素名写法化身 HTMLUnknownElement 亦满宽 */
      box-sizing: border-box;
      padding: calc(var(--asc-pad) * 0.7) calc(var(--asc-pad) * 0.85);
      border: var(--auto-border-size, var(--asc-alert-border-size, 1px)) solid
        color-mix(in srgb, var(--asc-tone) 38%, transparent);
      border-radius: var(
        --auto-border-radius,
        var(--asc-alert-radius, 0.5rem)
      );
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
      /* 描述正文色（标题/图标另行取 tone） */
      color: var(--auto-color, var(--asc-alert-color, #606060));
      font-size: var(--auto-font-size, var(--asc-alert-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-alert-line-height, 1.5));
    }
    /* ---------- 语义色五档（:has() 反驱宿主，button 同款 --asc-tone 组织） ---------- */
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

    /* ---------- 通栏形态（banner）：无圆角满宽（贴容器边缘） ---------- */
    .asc-alert:has(> .asc-alert-body[data-banner="true"]) {
      border-radius: 0;
    }

    /* ---------- 关闭态（closed 置位 → 宿主 data-closed 属性通道） ---------- */
    .asc-alert[data-closed] {
      display: none;
    }

    /* ---------- body 布局（编译子树内层，绑定可求值） ---------- */
    .asc-alert-body {
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      min-width: 0;
    }
    /* 图标位：略大于正文（警示感），色随 tone；不收缩（描述多行时图标恒定） */
    .asc-alert-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25em;
      color: var(--asc-tone);
      flex-shrink: 0;
    }
    /* 主文本组：title 与 description 恒纵排（description 在 title 下方） */
    .asc-alert-main {
      display: flex;
      flex-direction: column;
      gap: 0.2em;
      flex: 1;
      min-width: 0;
    }
    /* 标题：语义色 + medium 字重（标尺档；描述为常规正文色由宿主 color 承担） */
    .asc-alert-title {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
    /* 描述出口：空内容不占位（title/description 均空的纯图标条不留行高） */
    .asc-alert-desc:empty {
      display: none;
    }
    /* 关闭按钮：右端淡色小图标（正文色淡化），独立 hover 反馈 */
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

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 变体数据属性承载在 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->
  <div class="asc-alert-body" :data-type="type" :data-banner="banner">
    <!-- 图标位：displayIcon computed 解析（显式 icon 优先，空则按 type 映射内置图标） -->
    <i class="asc-alert-icon" x-if="displayIcon" x-icon="displayIcon"></i>
    <div class="asc-alert-main">
      <!-- 标题行：空 title 不渲染 -->
      <span class="asc-alert-title" x-if="title">{{ title }}</span>
      <!-- 描述出口：插槽内容优先，无内容回退 {{ description }}（组件自身状态求值） -->
      <span class="asc-alert-desc" x-slot>{{ description }}</span>
    </div>
    <!-- 关闭按钮（closable 启用）：内置 no 图标，点击走 methods 通道（绑定表达式不含 methods） -->
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
