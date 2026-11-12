(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}function i(e){e.components[`autospark.base-field`]=`<!--
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
`}a();function a(){e(e=>{i(e)})}var o=`<!--
    autospark.input 输入框（ADR-0020）——原生增强路线：真实原生控件（input / textarea）
    + 样式包裹，不自绘输入面（保原生可访问性：键盘/IME/自动填充/移动端兼容，ADR-0018
    决策 7）。继承 autospark.base-field 表单域骨架（状态色通道/焦点态/disabled 同步/
    盒饰 chrome，ADR-0020），本组件专注控件本身。

    值通道（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件——
    宿主为包裹层元素（无原生 value），x-model 写读都落劫持位；内层原生 input 事件
    自然冒泡过宿主，x-model 监听直接命中（无需手动派发——原生控件自带 value 语义，
    桥比 button-group 组值桥更薄）。value props 为非受控初值/单向同步（受控真相走
    x-model）。

    表单提交（ADR-0020）：宿主 name 透传到内层原生控件——原生直提交（input/textarea
    自带提名义，含 Enter 提交语义；对照 state-button 的 hidden input 桥分叉，本组件
    控件即真身无须代理载体）。

    事件出口（组件默认封闭，原生事件经冒泡到外层消费）：
    - input / change：内层原生控件事件自然冒泡（x-model 与外层 @input/@change 直接消费）
    - 清除/眼睛切换为内部动作件（data-autospark-action，点击不转发焦点），不派发自定义事件
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-input + .asc-field-box 盒饰选配）；
     变体与状态属性经 mounted 的 JS 通道同步（data-form / data-over），根上无动态绑定（T4=B） -->
<span
  class="asc-input asc-field-box"
  x-define="autospark.input"
  x-define:inherit="autospark.base-field"
>
  <script setup>
    {
        data: () => ({
            type: "text",          // 文本族：text/password/email/tel/url/search 等（透传原生 input type）| "textarea" 多行形态（元素切换为 textarea；prefix/suffix/清除/计数照常可用，密码切换仅 password 消费）
            value: "",             // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥，ADR-0020）
            placeholder: "",       // 占位文案（同步原生 placeholder）
            maxlength: 0,          // >0 同步原生 maxlength（原生输入截断）+ 计数分母
            rows: 2,               // textarea 行数（仅 textarea 形态消费；原生缺省 2）
            clearable: false,      // 清除钮（值非空且可交互时可见；点击清空 + 派发 input + 焦点回控件）
            showPassword: false,   // 密码可见切换眼睛钮（仅 type=password 消费，其余形态忽略）
            showCount: false,      // 计数器（maxlength 在场显示「len / max」，否则仅 len；超限染 danger）
            prefix: "",            // 前置装饰：string 文本 | { icon: "图标名" } 图标（对象经状态引用注入）
            suffix: "",            // 后置装饰：形态同 prefix
            // —— 内部状态 ——
            passwordVisible: false, // 密码可见态（眼睛切换，内层 type password ↔ text）
            hasValue: false,        // 当前有值（清除钮可见性驱动；JS 通道随输入维护）
            countText: "",          // 计数文本（JS 侧构建——绑定通道对 props 后续注入不重算，ADR-0020）
        }),
        methods: {
            // 清除：清空原生控件 + 手动派发 input（程序赋值不触发原生事件；冒泡过宿主
            // 驱动 x-model 回写 state）+ 焦点回控件；阻断冒泡（内部动作件，click 不外泄）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.el.querySelector(".asc-input-native");
                if (!n) return;
                n.value = "";
                n.dispatchEvent(new Event("input", { bubbles: true }));
                n.focus();
            },
            // 密码可见切换：翻转 passwordVisible + 内层 type password ↔ text + 焦点回控件
            onTogglePassword(event) {
                event.stopPropagation();
                if (this.data.disabled) return;
                this.data.passwordVisible = !this.data.passwordVisible;
                const n = this.el.querySelector(".asc-input-native");
                if (n instanceof HTMLInputElement) {
                    n.type = this.data.passwordVisible ? "text" : (this.data.type || "text");
                }
                if (n) n.focus();
            },
        },
        mounted() {
            // —— 内层控件查询（每查现取：type 形态切换 input ↔ textarea 会重建元素）——
            const native = () => this.el.querySelector(".asc-input-native");
            // 当前值缓存（劫持 getter 的控件缺位兜底 + 形态切换回填）
            let lastValue = "";

            // —— 计数与清除可见性同步（len 由原生控件现值读出；超限染色的 data-over
            //     落宿主属性，CSS 通道消费——JS 直写无 T4=B 约束）——
            const syncLen = () => {
                const n = native();
                const len = n ? String(n.value ?? "").length : 0;
                this.data.hasValue = len > 0;
                const max = Number(this.data.maxlength) || 0;
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;
                this.el.toggleAttribute("data-over", max > 0 && len > max);
            };

            // —— 值同步（外部 → 控件）：形态切换重建后回填 lastValue ——
            const syncValue = () => {
                const n = native();
                if (n) n.value = lastValue;
                syncLen();
            };

            // —— 原生属性同步（props → 控件；绑定通道对 props 晚注入/后续变化不重算，
            //     走 JS 通道——button disabled 同款纪律，ADR-0012）——
            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                const t = String(this.data.type ?? "text");
                if (n instanceof HTMLInputElement) {
                    // type 透传（textarea 形态下本元素不渲染，防御性归一 text）；
                    // 密码可见切换：password + passwordVisible → text
                    n.type = t === "textarea"
                        ? "text"
                        : t === "password" && this.data.passwordVisible ? "text" : (t || "text");
                }
                n.placeholder = String(this.data.placeholder ?? "");
                const ml = Number(this.data.maxlength) || 0;
                if (ml > 0) n.setAttribute("maxlength", String(ml));
                else n.removeAttribute("maxlength");
                if (n instanceof HTMLTextAreaElement) n.rows = Number(this.data.rows) || 2;
                // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
                // 形态标记（CSS 通道：textarea 高度放开，:has() 的 JS 免版）
                if (t === "textarea") this.el.setAttribute("data-form", "textarea");
                else this.el.removeAttribute("data-form");
            };

            // —— 值桥（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件 ——
            // 劫持前快照 expando（x-model 编译期可能已写初值——宿主无原生 value，
            // 编译期写入落 expando）；无 x-model 时回退 props.value 初值
            const prior = this.el.value;
            if (typeof prior === "string" && prior !== "") lastValue = prior;
            else if (this.data.value != null) lastValue = String(this.data.value);
            // 快照归一值 + 初始化窗口标志：编译期初值的**重放识别**。scope.refresh 类机制
            // （如 i18n 插件 ready 的首渲染换血）会以当前 state 重跑 x-model 监听，把编译期
            // 初值（尤其空串——快照序里是「模型缺席」信号，props 兜底胜出）经劫持 setter 二次
            // 落盘，覆盖已按快照序裁定的初值归属。初始化窗口（一跳 setTimeout 前）内与快照
            // 归一值同值的写入即重放，跳过；真实状态变化（值不同）不受影响
            const snapshotNorm = String(prior ?? "");
            let initDone = false;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const n = native();
                    return n ? n.value : lastValue;
                },
                set: (v) => {
                    if (!initDone && String(v ?? "") === snapshotNorm) return;
                    lastValue = String(v ?? "");
                    const n = native();
                    if (n) n.value = lastValue;
                    syncLen();
                },
                configurable: true,
            });

            // —— 输入跟随（原生 input 冒泡经宿主）：len 维护（x-model 回写由宿主监听自理）——
            this.el.addEventListener("input", () => {
                const n = native();
                if (n) lastValue = n.value;
                syncLen();
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                syncAttrs();
                syncValue();
                initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩（此后全量生效）
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("type", () => { setTimeout(() => { syncAttrs(); syncValue(); }, 0); });
            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });
            this.watch("rows", () => { setTimeout(syncAttrs, 0); });
            this.watch("showPassword", () => { setTimeout(syncAttrs, 0); });
            // value props 单向同步（非受控/外部受控无 x-model 场景）：变化才写（与自身
            // 桥写不冲突——guard 防回环）。已见值比对幂等防御（checkbox 同款）：scope.refresh
            // 类无变化重跑（i18n ready 换血等）不得把 x-model expando 注入的初值打回 props
            // 缺省空串——先比对已见 props 值，同值跳过
            let lastPropsValue = String(this.data.value ?? "");
            this.watch("value", ({ value }) => {
                const v = String(value ?? "");
                if (v === lastPropsValue) return;
                lastPropsValue = v;
                if (v === lastValue) return;
                lastValue = v;
                const n = native();
                if (n) n.value = v;
                syncLen();
            });
        },
    }
  <\/script>
  <style global id="autospark-components-input">
    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */
    .asc-input-native {
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: inherit;
    }
    .asc-input-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-input-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-input-disable-color, inherit));
    }

    /* ---------- textarea 形态（data-form 由 mounted 同步）：盒饰高度放开随行数增长，
             内层控件高度自适应 + 允许纵向拖拽调距 ---------- */
    .asc-input[data-form="textarea"] {
      height: auto;
      min-height: var(
        --auto-input-height,
        var(--asc-field-height, calc(var(--auto-font-size, 0.875rem) * 2.57))
      );
      align-items: stretch;
      cursor: text;
    }
    .asc-input[data-form="textarea"] .asc-input-native {
      height: auto;
      resize: vertical;
    }

    /* ---------- 前后置装饰：文本/图标混排，次要色 ---------- */
    .asc-input-prefix,
    .asc-input-suffix {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      flex: none;
      white-space: nowrap;
      color: var(--auto-secondary-color, var(--asc-input-affix, rgba(0, 0, 0, 0.55)));
    }
    /* 前置与控件间距、后置与动作件间距（互斥场景各留半距，组合场景自然衔接） */
    .asc-input-prefix {
      margin-right: 0.4em;
    }
    .asc-input-suffix {
      margin-left: 0.4em;
    }

    /* ---------- 动作件（清除/眼睛切换）：内部交互钮，淡色常态 + 悬停正文色 ---------- */
    .asc-input-action {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-input-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-input-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-input-action:hover {
      color: var(--auto-color, var(--asc-input-action-hover, #606060));
    }
    .asc-input-action:active {
      transform: scale(0.92);
    }

    /* ---------- 计数器：小一号辅助色；超限（data-over 由 mounted 同步）染 danger ---------- */
    .asc-input-count {
      flex: none;
      margin-left: 0.45em;
      font-size: 0.75em;
      white-space: nowrap;
      color: var(--auto-third-color, var(--asc-input-count, rgba(0, 0, 0, 0.35)));
    }
    .asc-input[data-over] .asc-input-count {
      color: var(--auto-danger-color, var(--asc-input-count-over, #ef4444));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-input-native::placeholder,
    [data-dark] .asc-input-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-input-prefix,
    [dark] .asc-input-suffix,
    [data-dark] .asc-input-prefix,
    [data-dark] .asc-input-suffix {
      color: var(--auto-secondary-color, var(--asc-input-affix, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-input-action,
    [data-dark] .asc-input-action {
      color: var(--auto-third-color, var(--asc-input-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-input-action:hover,
    [data-dark] .asc-input-action:hover {
      color: var(--auto-color, var(--asc-input-action-hover, #fafafa));
    }
    [dark] .asc-input-count,
    [data-dark] .asc-input-count {
      color: var(--auto-third-color, var(--asc-input-count, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-input[data-over] .asc-input-count,
    [data-dark] .asc-input[data-over] .asc-input-count {
      color: var(--auto-danger-color, var(--asc-input-count-over, #e6696a));
    }
  </style>
  <!-- 默认段（替换 base-field 出口 fallback）：input 的全部控件结构，文档序即呈现序
         [prefix] [控件] [清除] [眼睛] [suffix] [计数]。图标 x-icon 为指令值通道对
         props 注入响应；文本兜底 {{ }} 为插值通道（初始注入即定，prefix 后续变化走
         x-if 切换场景，文档已声明对象 props 经状态引用注入） -->
  <span class="asc-input-prefix" x-if="!!prefix">
    <i
      class="asc-input-icon"
      x-if="typeof prefix === 'object' && prefix && !!prefix.icon"
      x-icon="prefix.icon"
    ></i>
    <span class="asc-input-text" x-if="typeof prefix === 'string' && !!prefix">{{ prefix }}</span>
  </span>
  <input class="asc-input-native" data-autospark-control x-if="type !== 'textarea'" />
  <textarea
    class="asc-input-native"
    data-autospark-control
    x-if="type === 'textarea'"
    rows="2"
  ></textarea>
  <i
    class="asc-input-action asc-input-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i
    class="asc-input-action asc-input-eye"
    data-autospark-action
    x-if="showPassword && type === 'password'"
    x-icon="passwordVisible ? 'input-eye-off' : 'input-eye'"
    @click="onTogglePassword($event)"
  ></i>
  <span class="asc-input-suffix" x-if="!!suffix">
    <i
      class="asc-input-icon"
      x-if="typeof suffix === 'object' && suffix && !!suffix.icon"
      x-icon="suffix.icon"
    ></i>
    <span class="asc-input-text" x-if="typeof suffix === 'string' && !!suffix">{{ suffix }}</span>
  </span>
  <span class="asc-input-count" x-if="showCount">{{ countText }}</span>
</span>
`,s=`autospark.input`,c=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,l=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`,u=new Set([`disabled`,`readonly`,`clearable`,`show-password`,`show-count`]);function d(e){let i=e.icons;i?.add?.(`input-eye`,c),i?.add?.(`input-eye-off`,l),e.components[s]=o,e.precompile?.(e=>{for(let i of Array.from(e.el.querySelectorAll(`x-input, x-textarea`))){let e=document.createElement(`span`),a=[],o=i.tagName===`X-TEXTAREA`;o&&a.push(`type: "textarea"`);for(let s of Array.from(i.attributes)){if(s.name.startsWith(`:`)){a.push(`${n(t(s.name.slice(1)))}: (${s.value})`);continue}if(s.name===`class`||s.name===`style`||s.name===`id`||s.name===`name`||s.name===`title`||s.name.startsWith(`data-`)||s.name.startsWith(`x-`)||s.name.startsWith(`@`)){e.setAttribute(s.name,s.value);continue}let i=t(s.name);i===`type`&&o?a[0]=`type: ${JSON.stringify(r(s.value))}`:s.value===``&&u.has(s.name)?a.push(`${n(i)}: true`):a.push(`${n(i)}: ${JSON.stringify(r(s.value))}`)}let c=i.textContent?.trim()??``,l=a.some(e=>e.startsWith(`value:`)),d=i.children.length>0;for(c!==``&&!l&&!d&&(a.push(`value: ${JSON.stringify(c)}`),i.textContent=``),e.setAttribute(`x-component:${s}`,`{ ${a.join(`, `)} }`);i.firstChild;)e.appendChild(i.firstChild);i.replaceWith(e)}})}f();function f(){e(e=>{d(e)})}};
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

//# sourceMappingURL=autospark.input.js.map
