(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.base-field`]=`<!--
    BaseField 表单域骨架（ADR-0020）——base/ 目录首个产物（ADR-0018 决策 7：form 前瞻
    唯一例外，其余基类演进式抽取）。内部基类、非用户直接消费（无文档页/侧边栏/元素名
    形态，实例化仅得空壳——控件结构由子组件默认段注入）。

    骨架职责（宁薄勿胖——只承担 form 域家族共性，控件本体与装饰一概留给子组件）：
    - 结构：宿主级包裹层（.asc-field 布局基座，class 拼接进子组件宿主）+ 单默认出口
      （.asc-field-body，display:contents 不产生布局层）——子组件全部控件结构经默认段
      替换出口 fallback（继承覆盖，ADR-0081）；盒饰 chrome 为 .asc-field-box 选配类
      （input 类控件用，checkbox/radio/switch 等裸态控件不用）
    - 状态色通道：status（"" | error | success | warning）→ 宿主 data-status 属性 →
      --asc-field-tone 中转变量派生（焦点环/边框色统一消费）；error 态同步 aria-invalid
    - 焦点态追踪：focusin/focusout（焦点在骨架内元素间移动不闪烁）→ 宿主 data-focus
    - disabled / readonly：同步到 [data-autospark-control] 原生控件 + 宿主 data-disabled /
      data-readonly 反射（CSS 淡化与光标通道）
    - 尺寸档位：经 autospark.base 继承链消费主题 data-size 通道（--auto-input-height /
      --auto-input-padding 随档位联动），骨架不设自有尺寸属性（button 同范式 ADR-0012）
    - 与 x-field 分工（ADR-0018 决策 7：不双轨建域）：label/校验/域布局由 engine
      x-form/x-field 指令承担；校验结果经子组件 status props 染色进入（x-field 容器
      形态后代绑定 status: $field.error ? "error" : ""），骨架不感知 x-field

    data-* 标记协议（子组件挂点约定，ADR-0020）：
    - data-autospark-control：原生控件标记——disabled/readonly/aria-invalid 同步目标、
      点击转发焦点的受让者
    - data-autospark-action：交互动作件标记（清除/切换钮等）——点击不转发焦点（自理）
-->
<!-- 继承 autospark.base（ADR-0134）须为非抽象继承：abstract 组件不能再声明
     x-define:inherit（ADR-0134 抽象根约束），而主题档位六键物化必须沿继承链下传——
     故本骨架贡献真实模板（包裹层 + 出口），子组件快照 = 本骨架克隆 + 子默认段替换 +
     子根属性并入（class 拼接：宿主恒得 .asc-field + 子自有类），继承链
     子组件 → base-field → autospark.base 三层（ADR-0020 决策 2） -->
<span
  class="asc-field"
  x-define="autospark.base-field"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            status: "",       // 状态色通道："" 无 | error 危险 | success 成功 | warning 警告（tone 中转变量随动，焦点环/边框消费）
            disabled: false,  // 禁用：同步 [data-autospark-control] 原生控件 + 宿主 data-disabled（CSS 淡化/光标）
            readonly: false,  // 只读：同步 [data-autospark-control]（readOnly 语义）+ 宿主 data-readonly
        }),
        mounted() {
            // —— 控件查询（data-autospark-control 标记协议）：每查现取不缓存——运行时
            //     控件可能随形态切换重建（input ↔ textarea 等），缓存引用会指向已摘除节点
            const control = () => this.el.querySelector("[data-autospark-control]");

            // —— 状态色通道：status → 宿主 data-status（CSS 派生 --asc-field-tone）——
            const applyStatus = () => {
                const v = this.data.status;
                if (typeof v === "string" && v !== "") this.el.setAttribute("data-status", v);
                else this.el.removeAttribute("data-status");
            };

            // —— 控件同步：disabled/readonly 落原生控件 + 宿主反射 + error 态 aria-invalid
            //     （可访问性：组件级状态归一到 aria，与原生约束校验互补）——
            const syncControl = () => {
                const c = control();
                if (c) {
                    c.disabled = !!this.data.disabled;
                    if ("readOnly" in c) c.readOnly = !!this.data.readonly;
                    if (this.data.status === "error") c.setAttribute("aria-invalid", "true");
                    else c.removeAttribute("aria-invalid");
                }
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                this.el.toggleAttribute("data-readonly", !!this.data.readonly);
            };

            // —— 焦点态追踪：focusin/focusout 冒泡承接（骨架内任意可聚焦元素）——
            //     焦点在骨架内部元素间移动（如 input → 清除钮）时 relatedTarget 仍在
            //     骨架内，跳过摘除防闪烁
            this.el.addEventListener("focusin", () => {
                this.el.setAttribute("data-focus", "");
            });
            this.el.addEventListener("focusout", (e) => {
                const to = e.relatedTarget;
                if (to instanceof Node && this.el.contains(to)) return;
                this.el.removeAttribute("data-focus");
            });

            // —— 点击转发焦点：点击盒饰空白区/前后置装饰（非控件非动作件）时焦点落控件
            //     （原生 label 包裹的近似体验；动作件 data-autospark-action 自理不转发）——
            this.el.addEventListener("click", (e) => {
                const t = e.target instanceof Element ? e.target : null;
                if (!t) return;
                if (this.data.disabled) return;
                if (t.closest("[data-autospark-control]")) return;
                if (t.closest("[data-autospark-action]")) return;
                const c = control();
                if (c && typeof c.focus === "function") c.focus();
            });

            // —— 初始化与跟随（mounted 时化身子树与 props 注入均可能未就位，一跳后
            //     首同步；后续 props 变化经 watch 保持——回调收 { value } 信封对象，
            //     此处只用作触发信号，家族惯用法）——
            const syncAll = () => { applyStatus(); syncControl(); };
            setTimeout(syncAll, 0);
            this.watch("status", () => { setTimeout(syncAll, 0); });
            this.watch("disabled", () => { setTimeout(syncAll, 0); });
            this.watch("readonly", () => { setTimeout(syncAll, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-base-field">
    /* ---------- .asc-field 布局基座（无盒饰——chrome 由 .asc-field-box 选配类承担）：
         tone 为状态色中转变量（缺省 primary，data-status 派生），焦点环/边框统一消费；
         尺寸档位经主题 data-size 通道全跟随（字号消费 --auto-font-size 基线） ---------- */
    .asc-field {
      --asc-field-tone: var(--auto-primary-color, var(--asc-field-primary, #009aff));
      display: inline-flex;
      align-items: center;
      font-size: var(--auto-font-size, var(--asc-field-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-field-line-height, 1.4));
      color: var(--auto-color, var(--asc-field-color, #606060));
    }
    /* 状态色派生（data-status 由 mounted 同步）：tone 切语义色，未聚焦也染边框 */
    .asc-field[data-status="error"] {
      --asc-field-tone: var(--auto-danger-color, var(--asc-field-danger, #ef4444));
    }
    .asc-field[data-status="success"] {
      --asc-field-tone: var(--auto-success-color, var(--asc-field-success, #22c55e));
    }
    .asc-field[data-status="warning"] {
      --asc-field-tone: var(--auto-warning-color, var(--asc-field-warning, #f59e0b));
    }

    /* ---------- .asc-field-box 盒饰选配类（input 类控件 chrome；裸态控件不加）：
         高度/内距消费 --auto-input-*（theme data-size/data-spacing 档位联动）；
         边框色经 --asc-field-line 中转（hover/focus/状态/禁用多级覆盖） ---------- */
    .asc-field-box {
      --asc-field-line: var(--auto-border-color, var(--asc-field-border-color, #d9d9d9));
      border: var(--auto-border-size, var(--asc-field-border-size, 1px)) solid
        var(--asc-field-line);
      border-radius: var(--auto-input-radius, var(--asc-field-radius, 0.375rem));
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #ffffff));
      /* 高度兜底随字号自适应（≈字号 × 2.57）：theme 档位块引用的 --x-input-height-* 标尺
         未定义（theme 侧缺陷），档位容器上 --auto-input-height 失效落此级时仍随档位缩放 */
      height: var(
        --auto-input-height,
        var(--asc-field-height, calc(var(--auto-font-size, 0.875rem) * 2.57))
      );
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        background-color 0.15s ease;
      cursor: text;
    }
    .asc-field-box:hover:not([data-disabled]):not([data-readonly]):not([data-status]) {
      --asc-field-line: var(--auto-hover-border-color, var(--asc-field-hover-border, #4098fc));
    }
    /* 焦点态（data-focus 由 focusin/focusout 同步）：边框取 tone + 同色淡晕 */
    .asc-field-box[data-focus] {
      --asc-field-line: var(--asc-field-tone);
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);
    }
    /* 状态在场：未聚焦也染状态色边框（聚焦规则同色调、仅补光晕） */
    .asc-field-box[data-status="error"],
    .asc-field-box[data-status="success"],
    .asc-field-box[data-status="warning"] {
      --asc-field-line: var(--asc-field-tone);
    }
    /* 禁用：边框/底色取禁用语义变量 + 禁点光标（控件字色由 opacity 整体淡化）；
         状态在场时边框让位状态色（status 是显式意图，禁用仅接管底色/光标） */
    .asc-field-box[data-disabled]:not([data-status]) {
      --asc-field-line: var(
        --auto-disable-border-color,
        var(--asc-field-disable-border, #d9d9d9)
      );
      background: var(--auto-disable-bgcolor, var(--asc-field-disable-bg, rgba(0, 0, 0, 0.04)));
      cursor: not-allowed;
    }
    .asc-field-box[data-disabled][data-status] {
      background: var(--auto-disable-bgcolor, var(--asc-field-disable-bg, rgba(0, 0, 0, 0.04)));
      cursor: not-allowed;
    }
    /* 只读：光标归正文（无禁用淡化） */
    .asc-field-box[data-readonly] {
      cursor: default;
    }

    /* ---------- 默认出口包裹层：不产生布局层（子组件控件直接成为骨架 flex 项） ---------- */
    .asc-field-body {
      display: contents;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-field,
    [data-dark] .asc-field {
      --asc-field-tone: var(--auto-primary-color, var(--asc-field-primary, #56baff));
      color: var(--auto-color, var(--asc-field-color, #fafafa));
    }
    [dark] .asc-field[data-status="error"],
    [data-dark] .asc-field[data-status="error"] {
      --asc-field-tone: var(--auto-danger-color, var(--asc-field-danger, #e6696a));
    }
    [dark] .asc-field[data-status="success"],
    [data-dark] .asc-field[data-status="success"] {
      --asc-field-tone: var(--auto-success-color, var(--asc-field-success, #5cd07c));
    }
    [dark] .asc-field[data-status="warning"],
    [data-dark] .asc-field[data-status="warning"] {
      --asc-field-tone: var(--auto-warning-color, var(--asc-field-warning, #f0a03c));
    }
    /* 暗色兜底让位状态色：状态在场时边框取 tone（:not 守卫防高特异性兜底块压掉状态染色） */
    [dark] .asc-field-box:not([data-status]),
    [data-dark] .asc-field-box:not([data-status]) {
      --asc-field-line: var(--auto-border-color, var(--asc-field-border-color, #52525b));
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #3a3a3a));
    }
    [dark] .asc-field-box[data-disabled]:not([data-status]),
    [data-dark] .asc-field-box[data-disabled]:not([data-status]) {
      --asc-field-line: var(--auto-disable-border-color, var(--asc-field-disable-border, #52525b));
      background: var(--auto-disable-bgcolor, var(--asc-field-disable-bg, rgba(255, 255, 255, 0.08)));
    }
  </style>
  <!-- 单默认出口（display:contents）：子组件（input 等）经继承默认段注入全部控件结构；
       消费方实例化内容仍可再覆盖（三层优先级：消费方内容 > 继承覆盖 > 本空 fallback） -->
  <span class="asc-field-body" x-slot></span>
</span>
`}n();function n(){e(e=>{t(e)})}var r=`<!--
    autospark.switch 开关（ADR-0019 合批 / ADR-0020 BaseField 消费契约）——**自绘开关**
    （无原生对应控件）：轨道 + 滑块纯 CSS 自绘，可访问性自持——role="switch" +
    aria-checked + tabindex + 键盘 Space/Enter 切换（原生 checkbox 方案的对照：彼保真
    原生语义、此自持语义，ADR-0018 决策 7 表单基座策略内的例外形态）。

    值通道（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false"（配
    x-model.boolean 保真——state-button 布尔组桥同款）；切换派发 input（x-model 回写，
    监听在宿主自身非冒泡形态）+ change（detail = { value } 新布尔值，冒泡供外层消费）。
    checked props 为非受控初值 / 单向同步值（受控真相走宿主 x-model）。

    表单提交：内嵌 input[type=hidden] 载体（data-autospark-control 标记——骨架 disabled
    同步落载体，禁用即出表），value = 当前布尔字面串恒提交、name 透传宿主（state-button
    N>2 表单桥同构——value 是受控真相原样提交，true/false 值域服务端约定）。

    交互面：整组热区（轨道 + 文案都触发切换，宿主级事件委托）；loading 态滑块转 CSS
    旋转圈并阻断切换；disabled（骨架通道）阻断 + 淡化；readonly 亦阻断（值不可变语义）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-switch——裸态控件不加 .asc-field-box，
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；data-checked / data-loading
     由 mounted JS 通道同步（无 T4=B 约束），根上无动态绑定 -->
<span
  class="asc-switch"
  x-define="autospark.switch"
  x-define:inherit="autospark.base-field"
>
  <script setup>
    {
        data: () => ({
            label: "",     // 兜底文案（默认插槽内容优先；用户传入，无 i18n）
            checked: false,// 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 布尔语域桥）
            loading: false,// 加载态：滑块转 CSS 旋转圈 + 阻断切换（视觉优先于 disabled，不淡化）
        }),
        mounted() {
            // —— 内层元素查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——
            const track = () => this.el.querySelector(".asc-switch-track");
            const carrier = () => this.el.querySelector(".asc-switch-carrier");

            // —— 全视觉同步（按 data 现值求值，幂等）：aria 语义 + 宿主状态属性 + 表单载体 ——
            const syncVisual = () => {
                const on = !!this.data.checked;
                const t = track();
                if (t) {
                    t.setAttribute("aria-checked", String(on));
                    // 可访问性：loading 亦不可交互（aria-disabled 联动 disabled/loading）
                    t.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.loading)));
                    if (this.data.status === "error") t.setAttribute("aria-invalid", "true");
                    else t.removeAttribute("aria-invalid");
                }
                const c = carrier();
                if (c) {
                    // 提交载体恒随（hidden 恒提交当前布尔；禁用出表由骨架同步，此处双保险）
                    c.value = String(on);
                    c.disabled = !!this.data.disabled;
                }
                this.el.toggleAttribute("data-checked", on);
                this.el.toggleAttribute("data-loading", !!this.data.loading);
            };

            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false" ——
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）
            const prior = this.el.value;
            const initChecked = typeof prior === "string" && prior !== ""
                ? prior === "true"
                : !!this.data.checked;
            Object.defineProperty(this.el, "value", {
                get: () => String(!!this.data.checked),
                set: (v) => {
                    this.data.checked = v === true || v === "true";
                    syncVisual();
                },
                configurable: true,
            });

            // —— 切换动作：可交互判定（disabled / readonly / loading 均阻断）→ 翻转 →
            //     双派发（input→x-model 回写非冒泡；change→外层消费 detail={value}）——
            const toggle = () => {
                if (this.data.disabled || this.data.readonly || this.data.loading) return;
                this.data.checked = !this.data.checked;
                syncVisual();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.checked } }),
                );
            };

            // —— 交互接入（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：
            //     整组热区（轨道 + 文案都触发）；键盘 Space/Enter（自绘控件自持，
            //     role=switch 交互约定；Space 阻断页面滚动）——
            this.el.addEventListener("click", (e) => {
                const t = e.target instanceof Element ? e.target : null;
                if (t && t.closest(".asc-switch-wrap")) toggle();
            });
            this.el.addEventListener("keydown", (e) => {
                if (e.key !== " " && e.key !== "Enter") return;
                const t = e.target instanceof Element ? e.target : null;
                if (!t || !t.closest(".asc-switch-track")) return;
                e.preventDefault();
                toggle();
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：初值落定 +
            //     宿主 name 透传到表单载体 + 首次视觉同步 ——
            setTimeout(() => {
                this.data.checked = initChecked;
                const c = carrier();
                const nameAttr = this.el.getAttribute("name");
                if (c && nameAttr != null) c.name = nameAttr;
                syncVisual();
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("checked", () => { syncVisual(); });
            this.watch("loading", () => { syncVisual(); });
            this.watch("status", () => { setTimeout(syncVisual, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-switch">
    /* ---------- 结构：纯 span 包裹（自绘控件无原生语义可包——不用 label 防表单载体
         转发点击双触发）；轨道 = 交互件（data-autospark-action，点击不转发焦点） ---------- */
    .asc-switch-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.45em;
      cursor: pointer;
    }
    /* 轨道：尺寸 em 基准随主题 data-size 档位字号缩放（不设自有尺寸属性，button 同范式
       ADR-0012）；关态中性色（正文色派生淡灰，主题在场自动换肤） */
    .asc-switch-track {
      --asc-switch-w: 2.6em;
      --asc-switch-h: 1.4em;
      flex: none;
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      width: var(--asc-switch-w);
      height: var(--asc-switch-h);
      padding: 0.1875em;
      border-radius: 9999px;
      background: color-mix(
        in srgb,
        var(--auto-color, var(--asc-switch-off, #606060)) 28%,
        transparent
      );
      transition: background-color 0.2s ease, box-shadow 0.15s ease;
    }
    /* 滑块：白色恒定设计（暗色不换——与背景形成恒定对比）；位移 = 轨道宽 - 高（对称内距） */
    .asc-switch-thumb {
      flex: none;
      width: calc(var(--asc-switch-h) - 0.375em);
      height: calc(var(--asc-switch-h) - 0.375em);
      border-radius: 50%;
      background: var(--asc-switch-thumb, #ffffff);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      transform: translateX(0);
      transition: transform 0.2s ease;
      box-sizing: border-box;
    }

    /* ---------- 开态（data-checked 由 mounted JS 通道同步）：主色实底（status 在场随
             --asc-field-tone 联动——开态语义色，骨架通道） ---------- */
    .asc-switch[data-checked] .asc-switch-track {
      background: var(--asc-field-tone);
    }
    .asc-switch[data-checked] .asc-switch-thumb {
      transform: translateX(calc(var(--asc-switch-w) - var(--asc-switch-h)));
    }

    /* ---------- loading 态（data-loading 由 mounted 同步）：滑块转 CSS 旋转圈（阻断
             切换由 JS 判定；视觉优先于 disabled 不淡化，button loading 同款语义） ---------- */
    .asc-switch[data-loading] .asc-switch-thumb {
      background: transparent;
      box-shadow: none;
      border: 0.125em solid var(--asc-field-tone);
      border-top-color: transparent;
      animation: asc-switch-spin 0.7s linear infinite;
    }
    @keyframes asc-switch-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .asc-switch[data-loading][data-checked] .asc-switch-thumb {
      transform: none;
    }

    /* ---------- 交互态 ---------- */
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——轨道可聚焦即点亮）；禁用不点环 */
    .asc-switch[data-focus]:not([data-disabled]) .asc-switch-track {
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点光标 */
    .asc-switch[data-disabled] {
      opacity: 0.55;
    }
    .asc-switch[data-disabled] .asc-switch-wrap {
      cursor: not-allowed;
    }
    /* loading 光标进度态（不淡化） */
    .asc-switch[data-loading] .asc-switch-wrap {
      cursor: progress;
    }

    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */
    .asc-switch-label:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：关态中性色换暗色校准（正文色反转自动偏白灰，
             兜底字面值切换；开态 tone 与滑块白色为恒定设计不变） ---------- */
    [dark] .asc-switch-track,
    [data-dark] .asc-switch-track {
      background: color-mix(
        in srgb,
        var(--auto-color, var(--asc-switch-off, #fafafa)) 32%,
        transparent
      );
    }
    [dark] .asc-switch-thumb,
    [data-dark] .asc-switch-thumb {
      background: var(--asc-switch-thumb, #ffffff);
    }
  </style>
  <!-- 默认段（替换 base-field 出口 fallback）：表单载体（hidden，骨架 disabled 同步目标）+
         轨道交互件（role=switch 可聚焦）+ 文案。开态/loading 视觉由宿主 data-* 属性驱动。
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 base-field
         出口整段替换控件区（逃生通道，input 同款语义），文案走 props 兜底不开真插槽 -->
  <span class="asc-switch-wrap">
    <input type="hidden" class="asc-switch-carrier" data-autospark-control />
    <span
      class="asc-switch-track"
      role="switch"
      tabindex="0"
      aria-checked="false"
      data-autospark-action
    >
      <span class="asc-switch-thumb"></span>
    </span>
    <span class="asc-switch-label">{{ label }}</span>
  </span>
</span>
`,i=`autospark.switch`;function a(e){e.components[i]=r}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.switch.js.map
