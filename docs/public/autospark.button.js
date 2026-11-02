(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.button`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层元素上：宿主级外观（底色/边框/圆角等）经 body 上的 data-* 变体属性以 :has()
    驱动，body 自身的布局变体（对齐/纵排）直接命中 body 选择器；原生 disabled 语义
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - change：checkable 模式点击翻转后冒泡，detail = { value: 新值 }——
      表单同步惯用法：外层包裹元素 @change="flag = $event.detail.value"
    - tag-click：tags 小圆钮点击冒泡，detail = { name, tag }（tag 元素上
      stopPropagation，不触发宿主 checkable 翻转）
-->
<button class="asc-button" x-define="autospark.button">
  <script setup>
    {
        data: () => ({
            type: "primary",        // 形态：primary 实底 | secondary 次底 | dashed 虚线 | text 文本 | link 链接
            color: "primary",       // 语义色：primary | success | warning | danger | info
            label: "按钮",          // 兜底文案（插槽无内容时显示）
            icon: "",               // 图标名（x-icon 渲染；loading 时被 loading 图标替换）
            loading: false,         // 加载态：左图标位转圈并禁点（优先于 disabled 视觉）
            ghost: false,           // 幽灵：背景透明、内容取语义色（常用在有色背景上）
            border: false,          // 装饰性附加边框（不干预 dashed / ghost 的固有边框形态）
            block: false,           // 适配父宽度
            disabled: false,
            ripple: false,          // 点击涟漪（页面需已加载 autospark.ripple.js；动态挂载 inside 形态，ADR-0010）
            autoInsertSpace: true,  // label 恰为两个汉字时自动插入空格
            shape: "default",       // default | circle（纯图标呈正圆，带文字自动呈胶囊）
            labelBelow: false,      // label 显示在图标下方（纵排）
            value: false,           // 勾选值（checkable 模式；true 时使用与 color 匹配的背景色）
            checkable: false,       // 可勾选模式：点击自动翻转 value 并冒泡 change 事件
            align: "center",        // 内容水平对齐：left | center | right
            memo: "",               // label 下方的备注（小一号、淡色）
            tags: [],               // 右侧小圆钮 {icon?,tooltip?,name?}[]；点击冒泡 tag-click 事件
            menu: false,            // 菜单项形态：占满宽、透明底、左对齐、hover 淡底
            // computed 简写（普通函数值即计算属性，x-data 惯用法）：autoInsertSpace 开启且
            // label 恰为两个汉字时中间插入空格
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label
        }),
        methods: {
            // tag 小圆钮点击：阻断冒泡（不触发宿主 checkable 翻转），冒泡 tag-click 携带 name
            onTagClick(tag, event) {
                event.stopPropagation();
                this.el.dispatchEvent(new CustomEvent("tag-click", { bubbles: true, detail: { name: tag.name, tag } }));
            }
        },
        mounted() {
            // 原生 disabled 同步（loading 即禁点）；后续 props 变化经 watch 保持同步
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法见 overlay/foldable.ts）
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };
            syncDisabled();
            this.watch("disabled", ({ value }) => { syncDisabled(); });
            this.watch("loading", ({ value }) => { syncDisabled(); });

            // 涟漪动态挂载（ADR-0010 运行时契约：不经编译、直接写属性即生效）；
            // 需页面已加载 autospark.ripple.js，未加载时属性无人消费、静默无害
            const syncRipple = () => {
                const conf = this.data.ripple;
                if (conf) this.el.setAttribute("x-ripple", JSON.stringify(typeof conf === "object" ? { ...conf, inside: true } : { inside: true }));
                else this.el.removeAttribute("x-ripple");
            };
            syncRipple();
            this.watch("ripple", () => { syncRipple(); });

            // checkable 点击翻转：组件内自动取反 + 冒泡 change（受控显示方向经 props 单向注入天然响应）
            this.el.addEventListener("click", () => {
                if (!this.data.checkable || this.el.disabled) return;
                this.data.value = !this.data.value;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }));
            });
        },
    }
  <\/script>
  <style global id="autospark-components-button">
    /* 主题化（ADR-0129）：三级回退链 var(--auto-X, var(--asc-button-X, 校准兜底值))；
         --asc-button-* 前缀保留（既有覆盖面零改名）；实底上的白字非映射（恒定设计）；
         尺寸不设组件级档位——字号/圆角/图标全部消费 theme 变量，padding/gap 以 em 相对
         字号缩放，data-size 档位切换自动跟随；暗色兜底变体见块尾 */

    /* ---------- 宿主基础：形态中转变量层（--asc-bg/ink/line 由各变体块注入，一处消费） ---------- */
    .asc-button {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #009aff)); /* 语义色中转（data-color 注入） */
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      --asc-line: transparent;
      display: inline-flex;
      border: var(--auto-border-size, var(--asc-button-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-button-radius, 0.5rem));
      background: var(--asc-bg);
      color: var(--asc-ink);
      font: inherit;
      font-size: var(--auto-font-size, var(--asc-button-font-size, 0.875rem));
      line-height: 1.4;
      padding: 0.45em 1em;
      cursor: pointer;
      user-select: none;
      transition: filter 0.15s ease, background-color 0.15s ease;
    }

    /* ---------- 装饰性边框开关（先于形态/ghost——只落在本就无边的形态上，Q4 语义） ---------- */
    .asc-button:has(> .asc-button-body[data-border="true"]) {
      --asc-line: var(--auto-border-color, var(--asc-button-border-color, #d9d9d9));
    }

    /* ---------- 语义色 → tone 注入（五种） ---------- */
    .asc-button:has(> .asc-button-body[data-color="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #009aff));
    }
    .asc-button:has(> .asc-button-body[data-color="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #22c55e));
    }
    .asc-button:has(> .asc-button-body[data-color="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f59e0b));
    }
    .asc-button:has(> .asc-button-body[data-color="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #ef4444));
    }
    .asc-button:has(> .asc-button-body[data-color="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #71717a));
    }

    /* ---------- 形态（type）→ 底/字/边注入 ---------- */
    /* primary：实底语义色 + 反白字 */
    .asc-button:has(> .asc-button-body[data-type="primary"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
    }
    /* secondary：次级底 + 正文色（描边交给 border 开关） */
    .asc-button:has(> .asc-button-body[data-type="secondary"]) {
      --asc-bg: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(245, 245, 245, 0.45)));
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
    }
    /* dashed：透明底 + 语义色虚线边 + 语义色字 */
    .asc-button:has(> .asc-button-body[data-type="dashed"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
      border-style: dashed;
    }
    /* text：透明底 + 正文色 */
    .asc-button:has(> .asc-button-body[data-type="text"]) {
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      padding: 0.45em 0.75em;
    }
    /* link：透明底 + 语义色字、无内距（inline 链接感） */
    .asc-button:has(> .asc-button-body[data-type="link"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      padding: 0;
    }

    /* ---------- 幽灵（ghost）：透明底 + 语义色内容/描边，可与任意形态组合 ---------- */
    .asc-button:has(> .asc-button-body[data-ghost="true"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
    }

    /* ---------- 菜单项形态（menu）：占满宽、透明底、左对齐、hover 淡底 ---------- */
    .asc-button:has(> .asc-button-body[data-menu="true"]) {
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      display: flex;
      width: 100%;
      border-radius: var(--auto-border-radius, var(--asc-button-radius, 0.375rem));
      padding: 0.45em 0.75em;
      text-align: left;
    }

    /* ---------- 勾选态（checkable && value）：与 color 匹配的实底（Q5）；menu 下为左竖条 + 淡底（Q8） ---------- */
    .asc-button:has(> .asc-button-body[data-checked="true"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
      --asc-line: transparent;
    }
    .asc-button:has(> .asc-button-body[data-menu="true"][data-checked="true"]) {
      --asc-bg: var(--auto-selected-bgcolor, var(--asc-button-selected-bg, color-mix(in srgb, var(--asc-tone) 20%, transparent)));
      --asc-ink: var(--auto-selected-color, var(--asc-tone));
      box-shadow: inset 3px 0 0 var(--asc-tone);
    }

    /* ---------- 形状（shape）：circle 恒胶囊半径——纯图标时内容等宽高自然呈正圆，带文字自动胶囊 ---------- */
    .asc-button:has(> .asc-button-body[data-shape="circle"]) {
      border-radius: 9999px;
      padding: 0.45em;
    }

    /* ---------- 适配父宽度 ---------- */
    .asc-button:has(> .asc-button-body[data-block="true"]) {
      display: flex;
      width: 100%;
    }

    /* ---------- 交互态 ---------- */
    .asc-button:hover:not([disabled]) {
      filter: brightness(0.96);
    }
    .asc-button:active:not([disabled]) {
      filter: brightness(0.9);
    }
    /* text / link / ghost / menu 淡形态：亮度反馈无感，改用悬停淡底 */
    .asc-button:has(> .asc-button-body[data-type="text"]):hover:not([disabled]),
    .asc-button:has(> .asc-button-body[data-type="link"]):hover:not([disabled]),
    .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not([disabled]),
    .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not([disabled]) {
      filter: none;
      background: var(--auto-hover-bgcolor, var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05)));
    }
    .asc-button:has(> .asc-button-body[data-type="link"]):hover:not([disabled]) {
      text-decoration: underline;
    }
    .asc-button[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
      filter: none;
    }
    /* loading 即禁点但视觉不淡化（优先于 disabled，Q9） */
    .asc-button:has(> .asc-button-body[data-loading="true"]) {
      opacity: 1;
      cursor: progress;
    }

    /* ---------- body 布局（body 是编译子树内层，绑定可求值，直接命中选择器） ---------- */
    .asc-button-body {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      width: 100%;
      min-width: 0;
    }
    .asc-button-body[data-align="left"] { justify-content: flex-start; }
    .asc-button-body[data-align="right"] { justify-content: flex-end; }
    .asc-button-body[data-menu="true"] { justify-content: flex-start; } /* 菜单项恒左对齐 */
    .asc-button-body[data-label-below="true"] { flex-direction: column; gap: 0.15em; } /* label 纵排 */

    /* 图标位：尺寸随字号（x-icon 默认 1em），loading 转圈自带 SMIL 动画 */
    .asc-button-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* 主文本组：label 与 memo 恒纵排（memo 在 label 下方） */
    .asc-button-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 0;
    }
    .asc-button-body[data-align="left"] .asc-button-main { align-items: flex-start; }
    .asc-button-body[data-align="right"] .asc-button-main { align-items: flex-end; }

    /* 备注：小一号 + 相对内容色的淡化（color-mix 跟随 --asc-ink，实底上自然呈淡白） */
    .asc-button-memo {
      font-size: 0.75em;
      line-height: 1.2;
      color: color-mix(in srgb, var(--asc-ink, currentColor) 70%, transparent);
    }

    /* tags 小圆钮：右侧小一号圆形，独立 hover 反馈 */
    .asc-button-tags {
      display: inline-flex;
      gap: 0.25em;
      margin-left: 0.35em;
    }
    .asc-button-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.8em;
      height: 1.8em;
      font-size: 0.75em;
      border-radius: 50%;
      color: var(--asc-ink);
      cursor: pointer;
    }
    .asc-button-tag:hover {
      background: color-mix(in srgb, currentColor 15%, transparent);
    }
    .asc-button-tag-icon {
      display: inline-flex;
      width: 1em;
      height: 1em;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-button,
    [data-dark] .asc-button {
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
      --asc-bg: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(129, 129, 129, 0.45)));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="primary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="primary"]) {
      --asc-bg: var(--auto-primary-color, var(--asc-button-primary, #56baff));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="secondary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="secondary"]) {
      --asc-bg: var(--auto-secondary-bgcolor, var(--asc-button-bg, rgba(129, 129, 129, 0.45)));
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
    }
    [dark] .asc-button:has(> .asc-button-body[data-color="primary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-color="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #56baff));
    }
    [dark] .asc-button:has(> .asc-button-body[data-color="success"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-color="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #5cd07c));
    }
    [dark] .asc-button:has(> .asc-button-body[data-color="warning"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-color="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f0a03c));
    }
    [dark] .asc-button:has(> .asc-button-body[data-color="danger"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-color="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #e6696a));
    }
    [dark] .asc-button:has(> .asc-button-body[data-color="info"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-color="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #a1a1aa));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="text"]):hover:not([disabled]),
    [dark] .asc-button:has(> .asc-button-body[data-type="link"]):hover:not([disabled]),
    [dark] .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not([disabled]),
    [dark] .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="text"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="link"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not([disabled]),
    [data-dark] .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not([disabled]) {
      background: var(--auto-hover-bgcolor, var(--asc-button-hover-bg, rgba(255, 255, 255, 0.08)));
    }
  </style>
  <!-- 变体数据属性全部承载在 body（编译子树内层元素，经 :has() 驱动宿主外观——见文件头注释） -->
  <span class="asc-button-body"
    :data-type="type" :data-color="color" :data-ghost="ghost" :data-border="border"
    :data-shape="shape" :data-label-below="labelBelow" :data-align="align" :data-menu="menu"
    :data-block="block" :data-checked="checkable && value" :data-loading="loading">
    <!-- loading 图标替换左图标位（字面量须带引号——裸 loading 会命中 data.loading 布尔值） -->
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>
    <span class="asc-button-icon" x-if="!loading && icon" x-icon="icon"></span>
    <span class="asc-button-main">
      <!-- 默认插槽出口：未提供内容时显示 {{ displayLabel }}（组件自身状态求值） -->
      <span class="asc-button-label" x-slot>{{ displayLabel }}</span>
      <span class="asc-button-memo" x-if="memo">{{ memo }}</span>
    </span>
    <span class="asc-button-tags" x-if="tags && tags.length">
      <span class="asc-button-tag" x-for="tag of tags" :key="tag.name || tag.icon"
        :title="tag.tooltip" @click="onTagClick(tag, $event)">
        <i class="asc-button-tag-icon" x-if="tag.icon" x-icon="tag.icon"></i>
      </span>
    </span>
  </span>
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
