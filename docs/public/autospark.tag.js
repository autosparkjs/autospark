(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.tag`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——变体绑定（type/variant/closed）落在编译子树的内层 body 上，宿主外观
    （底色/描边/文字色）经 body 的 data-* 变体属性以 :has() 驱动（button 同款范式）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - close：关闭钮点击冒泡，cancelable，detail = { event }（原始点击事件）；
      未 preventDefault 时组件自动置 closed 隐藏整枚，preventDefault 则交由外部
      全权接管关闭时机（受控用法惯用法）。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——尺寸档经主题通道 data-size 全跟随（字号/padding 以 em 标定自动
     缩放，无自有尺寸属性）；tag 不在 data() 声明主题六键，内部变体属性亦禁用六通道名 -->
<span
  class="asc-tag"
  x-define="autospark.tag"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "default",   // 语义色（对齐 button 范式 ADR-0012）：primary | success | warning | danger | info | default 中性档
            variant: "light",  // 形态（与语义色正交）：light 淡底（缺省）| solid 实底白字 | outline 描边
            icon: "",          // 前置图标名或 { name } 对象（x-icon 值通道，随状态响应）
            closable: false,   // 关闭钮：点击 close 事件冒泡；未 preventDefault 自动隐藏
            closed: false,     // 关闭态（true 经 :has() 通道隐藏整枚；受控可回 false 重现）
        }),
        methods: {
            // 关闭钮点击：阻断原生点击冒泡（不触发宿主级 @click）→ close 事件冒泡
            //（cancelable，detail = { event } 原始点击事件）→ 未 preventDefault 则
            // 自动置 closed（CSS 通道隐藏整枚）；外部接管关闭时机时 preventDefault
            onCloseClick(event) {
                event.stopPropagation();
                const ev = new CustomEvent("close", { bubbles: true, cancelable: true, detail: { event } });
                this.el.dispatchEvent(ev);
                if (!ev.defaultPrevented) this.data.closed = true;
            },
        },
    }
  <\/script>
  <style global id="autospark-components-tag">
    /* 宿主即标签盒子：--asc-tone 语义色中转（data-type 注入）+ 三通道变量（data-variant 注入）；
         内距以 em 标定——随字号（data-size 档位 → --auto-font-size）自动缩放 */
    .asc-tag {
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));
      --asc-bg: color-mix(in srgb, var(--asc-tone, #606060) 10%, transparent);
      --asc-ink: var(--asc-tone);
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 30%, transparent);
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      padding: 0.15em 0.6em;
      font-size: var(--auto-font-size, var(--asc-tag-font-size, 0.75rem));
      line-height: 1.5;
      border: var(--auto-border-size, var(--asc-tag-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));
      background: var(--asc-bg);
      color: var(--asc-ink);
      cursor: default;
      user-select: none;
      transition: filter 0.15s ease;
    }

    /* ---------- 语义色轴（type）：--asc-tone 中转，button/link 同款范式 ---------- */
    .asc-tag:has(> .asc-tag-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #009aff));
    }
    .asc-tag:has(> .asc-tag-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #22c55e));
    }
    .asc-tag:has(> .asc-tag-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f59e0b));
    }
    .asc-tag:has(> .asc-tag-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #ef4444));
    }
    .asc-tag:has(> .asc-tag-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #71717a));
    }
    /* default：中性档（正文色，base 值即本档——light 淡灰底） */
    .asc-tag:has(> .asc-tag-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-tag-color, #606060));
    }

    /* ---------- 形态轴（variant，与语义色正交）：三通道变量注入 ---------- */
    /* solid：实底白字（语义色底上的白字为恒定设计，非变量映射——ADR-0129 备注） */
    .asc-tag:has(> .asc-tag-body[data-variant="solid"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
      --asc-line: transparent;
    }
    /* outline：透明底 + 语义色描边/文字（描边取 55% 混淡，视觉与文字同级不抢） */
    .asc-tag:has(> .asc-tag-body[data-variant="outline"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: color-mix(in srgb, var(--asc-tone, #606060) 55%, transparent);
    }
    /* light 为缺省形态：base 值即本档（淡底 + 同色文字 + 淡描边），无需变体块 */

    /* ---------- 关闭态（closed）：:has() 通道隐藏整枚 ---------- */
    .asc-tag:has(> .asc-tag-body[data-closed="true"]) {
      display: none;
    }

    /* ---------- body 布局（编译子树内层，绑定可求值） ---------- */
    .asc-tag-body {
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      min-width: 0;
    }
    /* 空出口不占位：纯图标用法（插槽无内容）时 label 隐藏，消除 gap 占位 */
    .asc-tag-label:empty {
      display: none;
    }
    /* 关闭钮：小一号 × 图标（内置 no），独立 hover 反馈（按内容色派生淡底） */
    .asc-tag-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: -0.15em;
      padding: 0.05em;
      border-radius: var(--auto-border-radius, var(--asc-tag-radius, 0.25rem));
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .asc-tag-close:hover {
      background: color-mix(in srgb, var(--asc-ink, currentColor) 25%, transparent);
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-tag-primary, #56baff));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="success"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-tag-success, #5cd07c));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-tag-warning, #f0a03c));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #e6696a));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="info"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-tag-info, #a1a1aa));
    }
    [dark] .asc-tag:has(> .asc-tag-body[data-type="default"]),
    [data-dark] .asc-tag:has(> .asc-tag-body[data-type="default"]) {
      --asc-tone: var(--auto-color, var(--asc-tag-color, #fafafa));
    }
  </style>
  <!-- 变体数据属性承载在 body（编译子树内层元素，宿主经 :has() 驱动——见文件头注释） -->
  <span
    class="asc-tag-body"
    :data-type="type"
    :data-variant="variant"
    :data-closed="closed"
  >
    <!-- icon 双形态：字符串 = 图标名；对象 = { name }（x-icon 值通道） -->
    <i
      class="asc-tag-icon"
      x-if="typeof icon === 'string' && icon"
      x-icon="icon"
    ></i>
    <i
      class="asc-tag-icon"
      x-if="typeof icon === 'object' && icon && icon.name"
      x-icon="icon.name"
    ></i>
    <!-- 默认插槽出口：标签文字（紧凑书写——:empty 判定纪律） -->
    <span class="asc-tag-label" x-slot></span>
    <!-- 关闭钮（closable）：字面量须带引号——裸 no 会命中 data.no 键 -->
    <i
      class="asc-tag-close"
      x-if="closable"
      x-icon="'no'"
      @click="onCloseClick($event)"
    ></i>
  </span>
</span>
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

//# sourceMappingURL=autospark.tag.js.map
