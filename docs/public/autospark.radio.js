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
    autospark.radio 单选钮（ADR-0019 合批 / ADR-0020 BaseField 消费契约）——原生增强
    路线：真实原生 \`<input type="radio">\` + 自绘视觉（选中圆点经 CSS 伪元素，选中态由
    :checked 原生伪类驱动——键盘 / 焦点 / 表单提交 / 组互斥等原生能力全保留）。

    组语义（不建组容器组件）：**原生 name 同名互斥**——同 x-model 路径的多枚实例经引擎
    缺省 name 注入（name=路径）天然同组；或宿主显式写 name。组样式编排（纵排/横排/间距）
    用 space 组件 / flex 容器配方（组件文档给出配方示例）。受控单选组（按钮形态）由
    button-group 选中模式承接（先例）。

    值通道（x-model 兼容协议，checked 值桥）：宿主 el.value 读 = 本钮 value、写 = 按值
    匹配勾选（state === 本钮 value）——与 x-model 原生 radio 读写语义同构。勾选变化经
    原生 change 冒泡过宿主时派发 input（仅勾选态派发，取消态由被勾选的另一枚接管）。
    checked props 为非受控初值 / 单向同步值（受控真相走宿主 x-model）。

    表单提交：内层真 input 即提交载体（组内勾选项提交 name=value——原生 radio 语义，
    ADR-0020 决策 6）；宿主 name 透传（x-model 缺省注入 name=路径亦经此通道落内层）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-radio——裸态控件不加 .asc-field-box，
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；选中视觉由原生伪类 + :has()
     驱动，宿主 data-* 状态属性由骨架 / JS 通道同步，根上无动态绑定（T4=B） -->
<span
  class="asc-radio"
  x-define="autospark.radio"
  x-define:inherit="autospark.base-field"
>
  <script setup>
    {
        data: () => ({
            label: "",      // 兜底文案（默认插槽内容优先；用户传入，无 i18n）
            value: "",      // 本钮值（组内唯一标识；x-model 按值匹配勾选、勾选时写 state = 此值）
            checked: false, // 非受控初值 / 单向同步值（受控真相走宿主 x-model；组内缺省勾选项用）
        }),
        mounted() {
            // —— 内层原生控件查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——
            const native = () => this.el.querySelector(".asc-radio-input");
            // 本钮值（props.value 现读——不缓存，props 变化时劫持通道取最新）
            const radioValue = () => String(this.data.value ?? "");
            // 当前勾选缓存（劫持 getter 的控件缺位兜底）
            let lastChecked = false;

            // —— 原生属性同步：本钮 value 落内层（x-model 按值匹配的锚点）；宿主 name
            //     透传（x-model 缺省注入 name=路径同经此落内层——同名即组，原生互斥）——
            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                n.value = radioValue();
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
            };

            // —— 值桥（checked 值桥）：宿主 el.value 读 = 本钮 value（勾选时 x-model 写
            //     state 的值）、写 = 按值匹配勾选（与 x-model 原生 radio 语义同构）——
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）
            const prior = this.el.value;
            lastChecked = typeof prior === "string" && prior !== ""
                ? prior === radioValue()
                : !!this.data.checked;
            Object.defineProperty(this.el, "value", {
                get: () => radioValue(),
                set: (v) => {
                    const n = native();
                    if (n) n.checked = String(v) === radioValue();
                },
                configurable: true,
            });

            // —— DOM→state 桥：原生 change 冒泡过宿主 → **仅勾选态**派发 input（x-model
            //     监听在宿主自身，读劫持 el.value（= 本钮 value）回写；取消态不派发——
            //     被勾选的另一枚接管，x-model 原生 radio 同款语义）。原生 change 继续
            //     冒泡，外层 @change 直接消费；仅认内层控件事件（宿主自身 change 直通）
            this.el.addEventListener("change", (e) => {
                if (e.target !== native()) return;
                const n = native();
                if (!n || !n.checked) return;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                const n = native();
                if (n && n.checked !== lastChecked) n.checked = lastChecked;
                syncAttrs();
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，解构取值——家族惯用法）——
            // checked 单向同步（无 x-model 场景）：变化才写（程序赋值不触发原生事件，无回环）。
            // 已见值比对幂等防御（checkbox 同款）：scope.refresh 类无变化重跑（i18n ready
            // 换血等）不得把 x-model expando 按值匹配的勾选初值打回 props 缺省值
            let lastPropsChecked = !!this.data.checked;
            this.watch("checked", ({ value }) => {
                const v = !!value;
                if (v === lastPropsChecked) return;
                lastPropsChecked = v;
                lastChecked = v;
                const n = native();
                if (n && n.checked !== lastChecked) n.checked = lastChecked;
            });
            // value 变化：内层锚点值更新 + 重对齐勾选（x-model 值匹配语义的静态等价）
            this.watch("value", () => {
                setTimeout(() => {
                    syncAttrs();
                    const n = native();
                    if (n && n.checked) n.checked = n.value === radioValue();
                }, 0);
            });
        },
    }
  <\/script>
  <style global id="autospark-components-radio">
    /* ---------- 结构：真实 label 包裹（点击文字/圆环任一处原生切换 + 焦点转发），
         内层原生 input 透明铺满圆环（点击命中区 = 圆环，键盘焦点承载者） ---------- */
    .asc-radio-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.45em;
      cursor: pointer;
    }
    /* 圆环：裸态控件无 chrome，仅自有细边框（ADR-0020 决策 3）；尺寸 em 基准随主题
       data-size 档位字号缩放（不设自有尺寸属性，button 同范式 ADR-0012） */
    .asc-radio-box {
      position: relative;
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 1.15em;
      height: 1.15em;
      border: var(--auto-border-size, var(--asc-radio-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-radio-border, #d9d9d9));
      border-radius: 50%;
      background: var(--auto-bgcolor, var(--asc-radio-bg, #ffffff));
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .asc-radio-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      border: none;
      opacity: 0;
      cursor: inherit;
    }

    /* ---------- 状态色（骨架通道）：status 在场边框染 tone（裸态控件只消费 tone 不吃 chrome）；
             选中底色恒 tone（缺省主色，error/success/warning 随动——选中态语义色联动） ---------- */
    .asc-radio[data-status] .asc-radio-box {
      border-color: var(--asc-field-tone);
    }
    .asc-radio-box:has(> .asc-radio-input:checked) {
      border-color: var(--asc-field-tone);
    }

    /* ---------- 选中圆点（::after，选中态展开） ---------- */
    .asc-radio-box::after {
      content: "";
      width: 0.55em;
      height: 0.55em;
      border-radius: 50%;
      background: var(--asc-field-tone);
      transform: scale(0);
      transition: transform 0.15s ease;
    }
    .asc-radio-box:has(> .asc-radio-input:checked)::after {
      transform: scale(1);
    }

    /* ---------- 交互态 ---------- */
    .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)) {
      border-color: var(--auto-hover-border-color, var(--asc-radio-hover-border, #4098fc));
    }
    /* 键盘焦点环（data-focus 由骨架 focusin/focusout 同步——鼠标点击聚焦亦点亮，
         与盒饰类控件的焦点语义一致）；禁用不点环 */
    .asc-radio[data-focus]:not([data-disabled]) .asc-radio-box {
      box-shadow: 0 0 0 2px
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（选中 tone 保留可辨）+ 禁点光标 */
    .asc-radio[data-disabled] {
      opacity: 0.55;
    }
    .asc-radio[data-disabled] .asc-radio-wrap {
      cursor: not-allowed;
    }

    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */
    .asc-radio-label:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-radio-box,
    [data-dark] .asc-radio-box {
      border-color: var(--auto-border-color, var(--asc-radio-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-radio-bg, #3a3a3a));
    }
    [dark] .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)),
    [data-dark] .asc-radio-wrap:hover .asc-radio-box:not(:has(> .asc-radio-input:checked)):not(:has(> .asc-radio-input:disabled)) {
      border-color: var(--auto-hover-border-color, var(--asc-radio-hover-border, #4098fc));
    }
  </style>
  <!-- 默认段（替换 base-field 出口 fallback）：label 包裹的真实 radio + 自绘圆环 + 文案。
         选中圆点视觉由原生伪类 :checked 经 :has() 驱动（真实浏览器支持）。
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 base-field
         出口整段替换控件区（逃生通道，input 同款语义），文案走 props 兜底不开真插槽 -->
  <label class="asc-radio-wrap">
    <span class="asc-radio-box">
      <input type="radio" class="asc-radio-input" data-autospark-control />
    </span>
    <span class="asc-radio-label">{{ label }}</span>
  </label>
</span>
`,i=`autospark.radio`;function a(e){e.components[i]=r}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.radio.js.map
