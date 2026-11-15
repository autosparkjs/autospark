(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.field`]=`<!--\r
    Field 表单域骨架（ADR-0020）——base/ 目录首个产物（ADR-0018 决策 7：form 前瞻\r
    唯一例外，其余基类演进式抽取）。2026-11-14 修订：转公开文档组件（侧边栏「表单」组\r
    + demo + 文档页）——可直接实例化（默认出口装任意控件内容即得骨架能力：状态色/\r
    焦点态/禁用只读同步/盒饰），同时仍是 form 域家族（input/checkbox/radio/switch/\r
    select/input-number…）的继承基座。\r
\r
    骨架职责（宁薄勿胖——只承担 form 域家族共性，控件本体与装饰一概留给子组件）：\r
    - 结构：宿主级包裹层（.asc-field 布局基座，class 拼接进子组件宿主）+ 三出口——\r
      默认出口（.asc-field-body，display:contents 不产生布局层；子组件全部控件结构\r
      经默认段替换出口 fallback（继承覆盖，ADR-0081），直接实例化时消费方内容同位）\r
      + prefix / suffix 具名装饰出口（body 兄弟位，DOM 序固定\r
      [slot:prefix][body][slot:suffix]；span 载体 + display:contents + 空 fallback\r
      ——无内容零布局，裸态控件组件继承亦无害。注：engine ADR-0137 template 载体\r
      是更优形态（无内容出口静默消失、零多余 DOM），但真浏览器实测不展开（缺陷\r
      待引擎修复），修复后一行切回 template 载体）；盒饰 chrome 为 .asc-field-box\r
      选配类（input 类控件用，checkbox/radio/switch 等裸态控件不用）\r
    - 轻装饰/重装饰分层（2026-11-14 修订）：子组件 props 前后置（input 的\r
      prefix/suffix 文本|图标）是轻装饰（组件内贴控件），插槽前后置是重装饰\r
      （消费方任意 HTML，恒在轻装饰外侧），两者共存不互斥；插槽内容默认次要色、\r
      点击转发焦点到控件（消费方放交互件须自标 data-autospark-action 自理）；\r
      disabled/readonly 不对插槽内容做专门处理（与 props 装饰对齐）\r
    - 状态色通道：status（"" | error | success | warning）→ 宿主 data-status 属性 →\r
      --asc-field-tone 中转变量派生（焦点环/边框色统一消费）；error 态同步 aria-invalid\r
    - 焦点态追踪：focusin/focusout（焦点在骨架内元素间移动不闪烁）→ 宿主 data-focus\r
    - disabled / readonly：同步到 [data-autospark-control] 原生控件 + 宿主 data-disabled /\r
      data-readonly 反射（CSS 淡化与光标通道）\r
    - 尺寸档位：经 autospark.base 继承链消费主题 data-size 通道（--auto-input-height /\r
      --auto-input-padding 随档位联动），骨架不设自有尺寸属性（button 同范式 ADR-0012）\r
    - 与 x-field 分工（ADR-0018 决策 7：不双轨建域）：label/校验/域布局由 engine\r
      x-form/x-field 指令承担；校验结果经子组件 status props 染色进入（x-field 容器\r
      形态后代绑定 status: $field.error ? "error" : ""），骨架不感知 x-field\r
\r
    data-* 标记协议（子组件挂点约定，ADR-0020）：\r
    - data-autospark-control：原生控件标记——disabled/readonly/aria-invalid 同步目标、\r
      点击转发焦点的受让者\r
    - data-autospark-action：交互动作件标记（清除/切换钮等）——点击不转发焦点（自理）\r
-->\r
<!-- 继承 autospark.base（ADR-0134）须为非抽象继承：abstract 组件不能再声明\r
     x-define:inherit（ADR-0134 抽象根约束），而主题档位六键物化必须沿继承链下传——\r
     故本骨架贡献真实模板（包裹层 + 三出口），子组件快照 = 本骨架克隆 + 子默认段替换 +\r
     子根属性并入（class 拼接：宿主恒得 .asc-field + 子自有类），继承链\r
     子组件 → field → autospark.base 三层（ADR-0020 决策 2） -->\r
<span\r
  class="asc-field"\r
  x-define="autospark.field"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            status: "",       // 状态色通道："" 无 | error 危险 | success 成功 | warning 警告（tone 中转变量随动，焦点环/边框消费）\r
            disabled: false,  // 禁用：同步 [data-autospark-control] 原生控件 + 宿主 data-disabled（CSS 淡化/光标）\r
            readonly: false,  // 只读：同步 [data-autospark-control]（readOnly 语义）+ 宿主 data-readonly\r
        }),\r
        mounted() {\r
            // —— 控件查询（data-autospark-control 标记协议）：每查现取不缓存——运行时\r
            //     控件可能随形态切换重建（input ↔ textarea 等），缓存引用会指向已摘除节点\r
            const control = () => this.el.querySelector("[data-autospark-control]");\r
\r
            // —— 状态色通道：status → 宿主 data-status（CSS 派生 --asc-field-tone）——\r
            const applyStatus = () => {\r
                const v = this.data.status;\r
                if (typeof v === "string" && v !== "") this.el.setAttribute("data-status", v);\r
                else this.el.removeAttribute("data-status");\r
            };\r
\r
            // —— 控件同步：disabled/readonly 落原生控件 + 宿主反射 + error 态 aria-invalid\r
            //     （可访问性：组件级状态归一到 aria，与原生约束校验互补）——\r
            const syncControl = () => {\r
                const c = control();\r
                if (c) {\r
                    c.disabled = !!this.data.disabled;\r
                    if ("readOnly" in c) c.readOnly = !!this.data.readonly;\r
                    if (this.data.status === "error") c.setAttribute("aria-invalid", "true");\r
                    else c.removeAttribute("aria-invalid");\r
                }\r
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);\r
                this.el.toggleAttribute("data-readonly", !!this.data.readonly);\r
            };\r
\r
            // —— 焦点态追踪：focusin/focusout 冒泡承接（骨架内任意可聚焦元素）——\r
            //     焦点在骨架内部元素间移动（如 input → 清除钮）时 relatedTarget 仍在\r
            //     骨架内，跳过摘除防闪烁\r
            this.el.addEventListener("focusin", () => {\r
                this.el.setAttribute("data-focus", "");\r
            });\r
            this.el.addEventListener("focusout", (e) => {\r
                const to = e.relatedTarget;\r
                if (to instanceof Node && this.el.contains(to)) return;\r
                this.el.removeAttribute("data-focus");\r
            });\r
\r
            // —— 点击转发焦点：点击盒饰空白区/前后置装饰（非控件非动作件）时焦点落控件\r
            //     （原生 label 包裹的近似体验；动作件 data-autospark-action 自理不转发；\r
            //     插槽装饰内容同此——消费方放交互件须自标 data-autospark-action）——\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t) return;\r
                if (this.data.disabled) return;\r
                if (t.closest("[data-autospark-control]")) return;\r
                if (t.closest("[data-autospark-action]")) return;\r
                const c = control();\r
                if (c && typeof c.focus === "function") c.focus();\r
            });\r
\r
            // —— 初始化与跟随（mounted 时化身子树与 props 注入均可能未就位，一跳后\r
            //     首同步；后续 props 变化经 watch 保持——回调收 { value } 信封对象，\r
            //     此处只用作触发信号，家族惯用法）——\r
            const syncAll = () => { applyStatus(); syncControl(); };\r
            setTimeout(syncAll, 0);\r
            this.watch("status", () => { setTimeout(syncAll, 0); });\r
            this.watch("disabled", () => { setTimeout(syncAll, 0); });\r
            this.watch("readonly", () => { setTimeout(syncAll, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-field">\r
    /* ---------- .asc-field 布局基座（无盒饰——chrome 由 .asc-field-box 选配类承担）：\r
         tone 为状态色中转变量（缺省 primary，data-status 派生），焦点环/边框统一消费；\r
         尺寸档位经主题 data-size 通道全跟随（字号/行高/字体族消费 --auto-font-* 基线，\r
         字面级校准 theme-token-baseline.md：无 theme 环境与 theme 默认档观感归一） ---------- */\r
    .asc-field {\r
      --asc-field-tone: var(\r
        --auto-primary-color,\r
        var(--asc-field-primary, #009aff)\r
      );\r
      display: inline-flex;\r
      align-items: center;\r
      font-family: var(\r
        --auto-font-family,\r
        var(--asc-field-font-family, inherit)\r
      );\r
      font-size: var(--auto-font-size, var(--asc-field-font-size, 1rem));\r
      line-height: var(--auto-line-height, var(--asc-field-line-height, 1.5));\r
      color: var(--auto-color, var(--asc-field-color, #606060));\r
    }\r
    /* 状态色派生（data-status 由 mounted 同步）：tone 切语义色，未聚焦也染边框 */\r
    .asc-field[data-status="error"] {\r
      --asc-field-tone: var(\r
        --auto-danger-color,\r
        var(--asc-field-danger, #ef4444)\r
      );\r
    }\r
    .asc-field[data-status="success"] {\r
      --asc-field-tone: var(\r
        --auto-success-color,\r
        var(--asc-field-success, #22c55e)\r
      );\r
    }\r
    .asc-field[data-status="warning"] {\r
      --asc-field-tone: var(\r
        --auto-warning-color,\r
        var(--asc-field-warning, #f59e0b)\r
      );\r
    }\r
\r
    /* ---------- .asc-field-box 盒饰选配类（input 类控件 chrome；裸态控件不加）：\r
         高度/内距消费 --auto-input-*（theme data-size/data-spacing 档位联动）；\r
         边框色经 --asc-field-line 中转（hover/focus/状态/禁用多级覆盖）。\r
         边框维持 size + color 拆分消费（ADR-0020 决策 7 口径②）——组合令牌\r
         --auto-input-border 无法只换色，状态重染色机制依赖拆分 ---------- */\r
    .asc-field-box {\r
      --asc-field-line: var(\r
        --auto-border-color,\r
        var(--asc-field-border-color, #f0f0f0)\r
      );\r
      box-sizing: border-box;\r
      border: var(--auto-border-size, var(--asc-field-border-size, 1px)) solid\r
        var(--asc-field-line);\r
      border-radius: var(--auto-input-radius, var(--asc-field-radius, 0.5rem));\r
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #ffffff));\r
      /* 高度兜底随字号自适应（≈字号 × 2.57）：theme 档位块引用的 --x-input-height-* 标尺\r
         未定义（theme 侧缺陷），档位容器上 --auto-input-height 失效落此级时仍随档位缩放 */\r
      height: var(\r
        --auto-input-height,\r
        var(--asc-field-height, calc(var(--auto-font-size, 1rem) * 2.57))\r
      );\r
      /* 最小高度守卫（max）：theme 基值 --auto-input-height 实为行高（24px，未含内距预算），\r
         纵向内距在场时固定高度会把控件压扁——令牌不足时以「行内容高 + 纵向距×2 + 边框×2」\r
         兜底（token 为盒高语义保持，theme 补标尺后天然让位；--auto-line-height 为 rem 制\r
         长度，直接作行内容高消费，勿与 font-size 相乘） */\r
      min-height: max(\r
        var(\r
          --auto-input-height,\r
          var(--asc-field-height, calc(var(--auto-font-size, 1rem) * 2.57))\r
        ),\r
        calc(\r
          var(--auto-line-height, 1.5rem) + var(--auto-border-size, 1px) * 2 +\r
            var(--auto-input-padding, var(--asc-field-padding, 0.8rem))\r
        )\r
      );\r
      /* 四向内距（纵向取横向半距——输入框惯例；固定高度形态（border-box）纵向被\r
         高度+flex 居中吸收，height:auto 形态（textarea / theme 在场标尺缺陷回退）\r
         由纵向半距撑起呼吸感，全档位随 --auto-input-padding 联动） */\r
      padding: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2)\r
        var(--auto-input-padding, var(--asc-field-padding, 0.8rem));\r
      transition:\r
        border-color 0.15s ease,\r
        box-shadow 0.15s ease,\r
        background-color 0.15s ease;\r
      cursor: text;\r
    }\r
    .asc-field-box:hover:not([data-disabled]):not([data-readonly]):not(\r
        [data-status]\r
      ) {\r
      --asc-field-line: var(\r
        --auto-hover-border-color,\r
        var(--asc-field-hover-border, #009aff)\r
      );\r
    }\r
    /* 焦点态（data-focus 由 focusin/focusout 同步）：边框取 tone + 同色淡晕 */\r
    .asc-field-box[data-focus] {\r
      --asc-field-line: var(--asc-field-tone);\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    /* 状态在场：未聚焦也染状态色边框（聚焦规则同色调、仅补光晕） */\r
    .asc-field-box[data-status="error"],\r
    .asc-field-box[data-status="success"],\r
    .asc-field-box[data-status="warning"] {\r
      --asc-field-line: var(--asc-field-tone);\r
    }\r
    /* 禁用：边框/底色取禁用语义变量 + 禁点光标（控件字色由 opacity 整体淡化）；\r
         状态在场时边框让位状态色（status 是显式意图，禁用仅接管底色/光标） */\r
    .asc-field-box[data-disabled]:not([data-status]) {\r
      --asc-field-line: var(\r
        --auto-disable-border-color,\r
        var(--asc-field-disable-border, #bdbdbd)\r
      );\r
      background: var(\r
        --auto-disable-bgcolor,\r
        var(--asc-field-disable-bg, rgba(96, 96, 96, 0.2))\r
      );\r
      cursor: not-allowed;\r
    }\r
    .asc-field-box[data-disabled][data-status] {\r
      background: var(\r
        --auto-disable-bgcolor,\r
        var(--asc-field-disable-bg, rgba(96, 96, 96, 0.2))\r
      );\r
      cursor: not-allowed;\r
    }\r
    /* 只读：光标归正文（无禁用淡化） */\r
    .asc-field-box[data-readonly] {\r
      cursor: default;\r
    }\r
\r
    /* ---------- 具名装饰出口 prefix/suffix（2026-11-14 修订）：display:contents\r
         出口包裹层不产生布局层——无内容零布局（裸态控件组件继承亦无害）；\r
         内容默认次要色（消费方设色自然覆盖）+ 出口子元素逐项间距\r
         （0.4em 镜像 .asc-input-prefix/suffix 惯例，多子项自然连续）。\r
         注：待 engine ADR-0137 template 载体真浏览器缺陷修复后切换（无内容出口\r
         静默消失），届时间距/防收缩规则随活注入改落内容根本身 ---------- */\r
    .asc-field-prefix,\r
    .asc-field-suffix {\r
      display: contents;\r
      color: var(\r
        --auto-secondary-color,\r
        var(--asc-field-affix, rgba(96, 96, 96, 0.75))\r
      );\r
    }\r
    /* 防收缩换行：控件 width:100% 会挤压装饰至 min-content（flex:none 镜像 .asc-input-prefix 同款保护） */\r
    .asc-field-prefix > * {\r
      flex: none;\r
      margin-inline-end: 0.4em;\r
    }\r
    .asc-field-suffix > * {\r
      flex: none;\r
      margin-inline-start: 0.4em;\r
    }\r
\r
    /* ---------- 默认出口包裹层：不产生布局层（子组件控件直接成为骨架 flex 项） ---------- */\r
    .asc-field-body {\r
      display: contents;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-field,\r
    [data-dark] .asc-field {\r
      --asc-field-tone: var(\r
        --auto-primary-color,\r
        var(--asc-field-primary, #56baff)\r
      );\r
      color: var(--auto-color, var(--asc-field-color, #fafafa));\r
    }\r
    [dark] .asc-field[data-status="error"],\r
    [data-dark] .asc-field[data-status="error"] {\r
      --asc-field-tone: var(\r
        --auto-danger-color,\r
        var(--asc-field-danger, #e6696a)\r
      );\r
    }\r
    [dark] .asc-field[data-status="success"],\r
    [data-dark] .asc-field[data-status="success"] {\r
      --asc-field-tone: var(\r
        --auto-success-color,\r
        var(--asc-field-success, #5cd07c)\r
      );\r
    }\r
    [dark] .asc-field[data-status="warning"],\r
    [data-dark] .asc-field[data-status="warning"] {\r
      --asc-field-tone: var(\r
        --auto-warning-color,\r
        var(--asc-field-warning, #f7d352)\r
      );\r
    }\r
    /* 暗色兜底让位状态色：状态在场时边框取 tone（:not 守卫防高特异性兜底块压掉状态染色） */\r
    [dark] .asc-field-box:not([data-status]),\r
    [data-dark] .asc-field-box:not([data-status]) {\r
      --asc-field-line: var(\r
        --auto-border-color,\r
        var(--asc-field-border-color, #606060)\r
      );\r
      background: var(--auto-input-bgcolor, var(--asc-field-bg, #3c3c3c));\r
    }\r
    [dark] .asc-field-box[data-disabled]:not([data-status]),\r
    [data-dark] .asc-field-box[data-disabled]:not([data-status]) {\r
      --asc-field-line: var(\r
        --auto-disable-border-color,\r
        var(--asc-field-disable-border, #7a7a7a)\r
      );\r
      background: var(\r
        --auto-disable-bgcolor,\r
        var(--asc-field-disable-bg, rgba(250, 250, 250, 0.2))\r
      );\r
    }\r
    [dark] .asc-field-prefix,\r
    [dark] .asc-field-suffix,\r
    [data-dark] .asc-field-prefix,\r
    [data-dark] .asc-field-suffix {\r
      color: var(\r
        --auto-secondary-color,\r
        var(--asc-field-affix, rgba(250, 250, 250, 0.75))\r
      );\r
    }\r
  </style>\r
  <!-- 三出口（文档序即呈现序 [slot:prefix][默认段][slot:suffix]，2026-11-14 修订）：\r
       prefix / suffix 具名装饰出口空 fallback——无内容零布局（display:contents），\r
       消费方经宿主直接子级标记 <template x-slot:prefix> 投影任意内容（默认次要色，\r
       恒在子组件 props 轻装饰外侧）；默认出口被子组件默认段替换（继承覆盖，\r
       ADR-0081）——直接实例化时消费方内容同位，三层优先级：\r
       消费方内容 > 继承覆盖 > 本空 fallback -->\r
  <span class="asc-field-prefix" x-slot:prefix></span>\r
  <span class="asc-field-body" x-slot></span>\r
  <span class="asc-field-suffix" x-slot:suffix></span>\r
</span>\r
`}n();function n(){e(e=>{t(e)})}var r=`<!--\r
    autospark.input-number 数字输入框（ADR-0018 决策 7 原生增强）——真实原生 input\r
    （inputmode=decimal，键盘/IME/自动填充全保留）+ 盒饰包裹 + 步进钮组。复制 input\r
    结构而非嵌套消费（值桥语域分叉 + 自包含产物，见 index.ts 头注释）；继承\r
    autospark.field 骨架（状态色/焦点态/disabled 同步/盒饰 chrome，ADR-0020）。\r
\r
    值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域（""=空）——\r
    - 输入过程（原生 input 冒泡，组件 capture 先于 x-model 冒泡监听更新缓存）：\r
      合法即缓存（不夹取不修约，"1." / "-" 等中间态自由显示）、清空归 null、\r
      其余非法字符保持旧值（antd 同款语义）；\r
    - change（原生 change = blur/Enter，capture 归位后阻断重派发）：夹取（min/max）\r
      + 修约（precision）+ 规范文本 + 派发 change detail={ value }（冒泡供外层\r
      @change="v = $event.detail.value" 一行回写）；\r
    - 步进（钮点击 / ArrowUp·ArrowDown）：基值 = 当前值 ?? min ?? 0，按 step 步进\r
      后夹取修约，双派发（input→x-model 回写非冒泡 + change detail）；\r
    - NaN 防御：一切外部值（props.value / setter / 文本解析）经归一函数，非法得\r
      null 保持空态。\r
\r
    表单提交（ADR-0020 决策 6 同款）：宿主 name 透传到内层原生控件——原生直提交\r
    （控件即真身，无须 hidden 代理）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-input-number + .asc-field-box 盒饰）；\r
     aria/state 属性经 mounted JS 通道同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-input-number asc-field-box"\r
  x-define="autospark.input-number"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: null,      // number 非受控初值 / 单向同步值（NaN 防御：非法解析忽略保持空；受控真相走宿主 x-model）\r
            min: null,        // 下界（null 无界；非数字忽略）\r
            max: null,        // 上界（null 无界；非数字忽略）\r
            step: 1,          // 步长（<=0 或非法视为 1）\r
            precision: -1,    // 小数位（<0 自适应不修约；>=0 固定小数位——显示与修约双通道）\r
            controls: true,   // 步进钮组开关（false 时纯数字输入形态）\r
            placeholder: "",  // 占位文案（同步原生属性，用户传入无 i18n）\r
        }),\r
        mounted() {\r
            // —— 内层控件查询（每查现取，家族纪律——控件可能随形态重建）——\r
            const native = () => this.el.querySelector(".asc-input-number-native");\r
\r
            // —— 数值工具（NaN 防御核心：一切外部输入经归一，非法得 null）——\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const clamp = (n) => {\r
                if (n == null) return null;\r
                const mn = num(this.data.min), mx = num(this.data.max);\r
                if (mn != null && n < mn) return mn;\r
                if (mx != null && n > mx) return mx;\r
                return n;\r
            };\r
            // 固定小数位取值（<0 自适应直通）\r
            const prec = () => {\r
                const p = num(this.data.precision);\r
                return p != null && p >= 0 ? Math.floor(Math.min(p, 100)) : null;\r
            };\r
            const fix = (n) => {\r
                const p = prec();\r
                return p != null && n != null ? parseFloat(n.toFixed(p)) : n;\r
            };\r
            const fmt = (n) => {\r
                const p = prec();\r
                return p != null && n != null ? n.toFixed(p) : n == null ? "" : String(n);\r
            };\r
\r
            // —— 合法值缓存（受控语域真相；null = 空）——\r
            let lastValue = null;\r
\r
            // —— 显示写（等值短路：显示文本已是目标形态不重写——中间态保护）——\r
            const show = (n) => {\r
                const el = native();\r
                if (!el) return;\r
                const t = fmt(n);\r
                if (el.value !== t) el.value = t;\r
            };\r
\r
            // —— 全视觉同步：role=spinbutton aria 语义 + 宿主状态属性 ——\r
            const syncVisual = () => {\r
                const el = native();\r
                if (el) {\r
                    const mn = num(this.data.min), mx = num(this.data.max);\r
                    if (mn != null) el.setAttribute("aria-valuemin", String(mn));\r
                    else el.removeAttribute("aria-valuemin");\r
                    if (mx != null) el.setAttribute("aria-valuemax", String(mx));\r
                    else el.removeAttribute("aria-valuemax");\r
                    if (lastValue != null) el.setAttribute("aria-valuenow", String(lastValue));\r
                    else el.removeAttribute("aria-valuenow");\r
                }\r
                this.el.toggleAttribute("data-has-value", lastValue != null);\r
            };\r
\r
            // —— 提交（值落定 + 双派发：input→x-model 回写非冒泡；change→外层 detail={value}）——\r
            const commit = (n) => {\r
                lastValue = n;\r
                show(n);\r
                syncVisual();\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: lastValue } }),\r
                );\r
            };\r
\r
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域（""=空）——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.value 初值（劫持快照序：expando > props.value，input 同款）。\r
            //     初值在劫持安装前同步落定（mounted 时 props 可能晚注入——由 watch("value")\r
            //     兜底；不得延后到一跳再赋值，会踩掉外部联动方在 mounted~setTimeout 间\r
            //     经劫持 setter 写入的值，slider showInput 联动即此场景）\r
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            lastValue = initV != null ? fix(clamp(initV)) : null;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => (lastValue == null ? "" : String(lastValue)),\r
                set: (v) => {\r
                    const n = fix(clamp(num(v)));\r
                    if (n === lastValue) return; // 等值短路（不动显示——输入中间态保护）\r
                    lastValue = n;\r
                    show(n);\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            // —— 输入跟随（capture 先于 x-model 冒泡监听：缓存先更新，x-model 读到新值）——\r
            //     合法即缓存（不夹取不修约）；清空归 null；其余非法保持旧值\r
            this.el.addEventListener(\r
                "input",\r
                (e) => {\r
                    if (e.target !== native()) return;\r
                    const el = native();\r
                    const t = el ? String(el.value ?? "") : "";\r
                    const n = num(t);\r
                    if (n != null) lastValue = n;\r
                    else if (t === "") lastValue = null;\r
                    syncVisual();\r
                },\r
                true,\r
            );\r
\r
            // —— 确认归位（原生 change = blur/Enter）：夹取 + 修约 + 规范文本 + 重派发 detail ——\r
            //     capture 阶段先归位再阻断（x-model.lazy 的宿主冒泡监听读到的是归位后\r
            //     的劫持 getter；原生 change 不外泄，恒派发自定义 detail 版本）\r
            this.el.addEventListener(\r
                "change",\r
                (e) => {\r
                    if (e.target !== native()) return;\r
                    e.stopPropagation();\r
                    const el = native();\r
                    lastValue = fix(clamp(num(el ? el.value : "")));\r
                    show(lastValue);\r
                    syncVisual();\r
                    this.el.dispatchEvent(\r
                        new CustomEvent("change", {\r
                            bubbles: true,\r
                            detail: { value: lastValue },\r
                        }),\r
                    );\r
                },\r
                true,\r
            );\r
\r
            // —— 步进（dir: 1 上 / -1 下）：基值空时从 min（无 min 从 0）起；边界顶死不派发 ——\r
            const stepBy = (dir) => {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const st = num(this.data.step);\r
                const delta = (st != null && st > 0 ? st : 1) * dir;\r
                const base = lastValue != null ? lastValue : (num(this.data.min) ?? 0);\r
                const n = fix(clamp(base + delta));\r
                if (n === lastValue) return;\r
                commit(n);\r
            };\r
\r
            // —— 交互接入（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：\r
            //     步进钮点击（内部动作件，click 不外泄）+ 键盘 ArrowUp/ArrowDown ——\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t) return;\r
                const up = t.closest(".asc-input-number-up");\r
                if (up) {\r
                    e.stopPropagation();\r
                    stepBy(1);\r
                    return;\r
                }\r
                if (t.closest(".asc-input-number-down")) {\r
                    e.stopPropagation();\r
                    stepBy(-1);\r
                }\r
            });\r
            this.el.addEventListener("keydown", (e) => {\r
                if (e.target !== native()) return;\r
                if (e.key === "ArrowUp") {\r
                    e.preventDefault(); // 阻断光标移首行为\r
                    stepBy(1);\r
                } else if (e.key === "ArrowDown") {\r
                    e.preventDefault();\r
                    stepBy(-1);\r
                }\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：属性同步 +\r
            //     首次视觉落位（lastValue 已在劫持安装前落定，此处不重算——防踩联动值）——\r
            setTimeout(() => {\r
                const el = native();\r
                if (el) {\r
                    el.placeholder = String(this.data.placeholder ?? "");\r
                    el.setAttribute("role", "spinbutton");\r
                    // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）\r
                    const nameAttr = this.el.getAttribute("name");\r
                    if (nameAttr != null) el.name = nameAttr;\r
                }\r
                show(lastValue);\r
                syncVisual();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            // value 单向同步（无 x-model 场景）：变化才写（与劫持 setter 等值短路防回环）。\r
            // 已见值比对幂等防御（input 同款）：scope.refresh 类无变化重跑（i18n ready\r
            // 换血等）不得把 x-model expando 注入的初值打回 props 缺省 null\r
            let lastPropsN = fix(clamp(num(this.data.value)));\r
            this.watch("value", ({ value: v }) => {\r
                const n = fix(clamp(num(v)));\r
                if (n === lastPropsN) return;\r
                lastPropsN = n;\r
                if (n === lastValue) return;\r
                lastValue = n;\r
                show(n);\r
                syncVisual();\r
            });\r
            // 边界变化：当前值即时夹取（越界值归位）+ aria 同步\r
            const reBound = () => {\r
                lastValue = fix(clamp(lastValue));\r
                show(lastValue);\r
                syncVisual();\r
            };\r
            this.watch("min", () => { setTimeout(reBound, 0); });\r
            this.watch("max", () => { setTimeout(reBound, 0); });\r
            this.watch("precision", () => { setTimeout(reBound, 0); });\r
            this.watch("placeholder", () => {\r
                const el = native();\r
                if (el) el.placeholder = String(this.data.placeholder ?? "");\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-input-number">\r
    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */\r
    .asc-input-number-native {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      width: 100%;\r
      height: 100%;\r
      border: none;\r
      outline: none;\r
      background: transparent;\r
      padding: 0;\r
      margin: 0;\r
      color: inherit;\r
      font: inherit;\r
      cursor: inherit;\r
    }\r
    .asc-input-number-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-number-placeholder, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-input-number-native:disabled {\r
      cursor: not-allowed;\r
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-input-number-disable-color, inherit));\r
    }\r
\r
    /* ---------- 步进钮组（controls 由 x-if 控显隐）：竖排双钮撑满盒高，左侧细分隔线；\r
             钮为自绘图标钮（内嵌 chevron SVG，非原生 button 不抢焦点——点击焦点留控件） ---------- */\r
    .asc-input-number-step {\r
      flex: none;\r
      display: inline-flex;\r
      flex-direction: column;\r
      align-self: stretch;\r
      margin-left: 0.4em;\r
      border-left: var(--auto-border-size, var(--asc-input-number-border-size, 1px)) solid\r
        var(--asc-field-line, var(--auto-border-color, var(--asc-input-number-border, #d9d9d9)));\r
    }\r
    .asc-input-number-btn {\r
      flex: 1 1 0;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      min-width: 1.7em;\r
      padding: 0 0.3em;\r
      cursor: pointer;\r
      user-select: none;\r
      color: var(--auto-third-color, var(--asc-input-number-step, rgba(0, 0, 0, 0.35)));\r
      transition: color 0.15s ease;\r
    }\r
    .asc-input-number-btn svg {\r
      width: 0.85em;\r
      height: 0.85em;\r
    }\r
    .asc-input-number-btn:hover {\r
      color: var(--auto-color, var(--asc-input-number-step-hover, #606060));\r
    }\r
    .asc-input-number-btn:active {\r
      transform: scale(0.9);\r
    }\r
    /* 上下钮夹一条淡分隔线（与组左边线同源淡色） */\r
    .asc-input-number-up {\r
      border-bottom: var(--auto-border-size, var(--asc-input-number-border-size, 1px)) solid\r
        color-mix(in srgb, var(--auto-border-color, var(--asc-input-number-border, #d9d9d9)) 55%, transparent);\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：钮禁点 + 光标随盒饰禁用态 */\r
    .asc-input-number[data-disabled] .asc-input-number-btn {\r
      cursor: not-allowed;\r
      color: var(--auto-disable-color, var(--asc-input-number-step-disable, rgba(0, 0, 0, 0.25)));\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-input-number-native::placeholder,\r
    [data-dark] .asc-input-number-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-number-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-input-number-step,\r
    [data-dark] .asc-input-number-step {\r
      border-left-color: var(--asc-field-line, var(--auto-border-color, var(--asc-input-number-border, #52525b)));\r
    }\r
    [dark] .asc-input-number-btn,\r
    [data-dark] .asc-input-number-btn {\r
      color: var(--auto-third-color, var(--asc-input-number-step, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-input-number-btn:hover,\r
    [data-dark] .asc-input-number-btn:hover {\r
      color: var(--auto-color, var(--asc-input-number-step-hover, #fafafa));\r
    }\r
    [dark] .asc-input-number[data-disabled] .asc-input-number-btn,\r
    [data-dark] .asc-input-number[data-disabled] .asc-input-number-btn {\r
      color: var(--auto-disable-color, var(--asc-input-number-step-disable, rgba(255, 255, 255, 0.25)));\r
    }\r
  </style>\r
  <!-- 默认段（替换 field 出口 fallback）：原生控件 + 步进钮组。钮上 aria-hidden\r
         （纯视觉件，键盘等价通道 ArrowUp/ArrowDown 在控件上承载） -->\r
  <input\r
    class="asc-input-number-native"\r
    data-autospark-control\r
    type="text"\r
    inputmode="decimal"\r
    autocomplete="off"\r
  />\r
  <span class="asc-input-number-step" x-if="controls !== false">\r
    <i class="asc-input-number-btn asc-input-number-up" data-autospark-action aria-hidden="true">\r
      <svg\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
        fill="none"\r
        stroke="currentColor"\r
        stroke-width="2"\r
        stroke-linecap="round"\r
        stroke-linejoin="round"\r
      >\r
        <path d="m18 15-6-6-6 6" />\r
      </svg>\r
    </i>\r
    <i class="asc-input-number-btn asc-input-number-down" data-autospark-action aria-hidden="true">\r
      <svg\r
        xmlns="http://www.w3.org/2000/svg"\r
        viewBox="0 0 24 24"\r
        fill="none"\r
        stroke="currentColor"\r
        stroke-width="2"\r
        stroke-linecap="round"\r
        stroke-linejoin="round"\r
      >\r
        <path d="m6 9 6 6 6-6" />\r
      </svg>\r
    </i>\r
  </span>\r
</span>\r
`,i=`autospark.input-number`;function a(e){e.components[i]=r}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.input-number.js.map
