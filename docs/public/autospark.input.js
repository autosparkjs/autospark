(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}function i(e){e.components[`autospark.field`]=`<!--\r
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
`}a();function a(){e(e=>{i(e)})}var o=`<!--\r
    autospark.input 输入框（ADR-0020）——原生增强路线：真实原生控件（input / textarea）\r
    + 样式包裹，不自绘输入面（保原生可访问性：键盘/IME/自动填充/移动端兼容，ADR-0018\r
    决策 7）。继承 autospark.field 表单域骨架（状态色通道/焦点态/disabled 同步/\r
    盒饰 chrome，ADR-0020），本组件专注控件本身。\r
\r
    值通道（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件——\r
    宿主为包裹层元素（无原生 value），x-model 写读都落劫持位；内层原生 input 事件\r
    自然冒泡过宿主，x-model 监听直接命中（无需手动派发——原生控件自带 value 语义，\r
    桥比 button-group 组值桥更薄）。value props 为非受控初值/单向同步（受控真相走\r
    x-model）。\r
\r
    表单提交（ADR-0020）：宿主 name 透传到内层原生控件——原生直提交（input/textarea\r
    自带提名义，含 Enter 提交语义；对照 state-button 的 hidden input 桥分叉，本组件\r
    控件即真身无须代理载体）。\r
\r
    事件出口（组件默认封闭，原生事件经冒泡到外层消费）：\r
    - input / change：内层原生控件事件自然冒泡（x-model 与外层 @input/@change 直接消费）\r
    - 清除/眼睛切换为内部动作件（data-autospark-action，点击不转发焦点），不派发自定义事件\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-input + .asc-field-box 盒饰选配）；\r
     变体与状态属性经 mounted 的 JS 通道同步（data-form / data-over），根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-input asc-field-box"\r
  x-define="autospark.input"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            type: "text",          // 文本族：text/password/email/tel/url/search 等（透传原生 input type）| "textarea" 多行形态（元素切换为 textarea；prefix/suffix/清除/计数照常可用，密码切换仅 password 消费）\r
            value: "",             // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥，ADR-0020）\r
            placeholder: "",       // 占位文案（同步原生 placeholder）\r
            maxlength: 0,          // >0 同步原生 maxlength（原生输入截断）+ 计数分母\r
            rows: 2,               // textarea 行数（仅 textarea 形态消费；原生缺省 2）\r
            clearable: false,      // 清除钮（值非空且可交互时可见；点击清空 + 派发 input + 焦点回控件）\r
            showPassword: false,   // 密码可见切换眼睛钮（仅 type=password 消费，其余形态忽略）\r
            showCount: false,      // 计数器（maxlength 在场显示「len / max」，否则仅 len；超限染 danger）\r
            prefix: "",            // 前置装饰：string 文本 | { icon: "图标名" } 图标（对象经状态引用注入）\r
            suffix: "",            // 后置装饰：形态同 prefix\r
            // —— 内部状态 ——\r
            passwordVisible: false, // 密码可见态（眼睛切换，内层 type password ↔ text）\r
            hasValue: false,        // 当前有值（清除钮可见性驱动；JS 通道随输入维护）\r
            countText: "",          // 计数文本（JS 侧构建——绑定通道对 props 后续注入不重算，ADR-0020）\r
        }),\r
        methods: {\r
            // 清除：清空原生控件 + 手动派发 input（程序赋值不触发原生事件；冒泡过宿主\r
            // 驱动 x-model 回写 state）+ 焦点回控件；阻断冒泡（内部动作件，click 不外泄）\r
            onClear(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled || this.data.readonly) return;\r
                const n = this.el.querySelector(".asc-input-native");\r
                if (!n) return;\r
                n.value = "";\r
                n.dispatchEvent(new Event("input", { bubbles: true }));\r
                n.focus();\r
            },\r
            // 密码可见切换：翻转 passwordVisible + 内层 type password ↔ text + 焦点回控件\r
            onTogglePassword(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled) return;\r
                this.data.passwordVisible = !this.data.passwordVisible;\r
                const n = this.el.querySelector(".asc-input-native");\r
                if (n instanceof HTMLInputElement) {\r
                    n.type = this.data.passwordVisible ? "text" : (this.data.type || "text");\r
                }\r
                if (n) n.focus();\r
            },\r
        },\r
        mounted() {\r
            // —— 内层控件查询（每查现取：type 形态切换 input ↔ textarea 会重建元素）——\r
            const native = () => this.el.querySelector(".asc-input-native");\r
            // 当前值缓存（劫持 getter 的控件缺位兜底 + 形态切换回填）\r
            let lastValue = "";\r
\r
            // —— 计数与清除可见性同步（len 由原生控件现值读出；超限染色的 data-over\r
            //     落宿主属性，CSS 通道消费——JS 直写无 T4=B 约束）——\r
            const syncLen = () => {\r
                const n = native();\r
                const len = n ? String(n.value ?? "").length : 0;\r
                this.data.hasValue = len > 0;\r
                const max = Number(this.data.maxlength) || 0;\r
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;\r
                this.el.toggleAttribute("data-over", max > 0 && len > max);\r
            };\r
\r
            // —— 值同步（外部 → 控件）：形态切换重建后回填 lastValue ——\r
            const syncValue = () => {\r
                const n = native();\r
                if (n) n.value = lastValue;\r
                syncLen();\r
            };\r
\r
            // —— 原生属性同步（props → 控件；绑定通道对 props 晚注入/后续变化不重算，\r
            //     走 JS 通道——button disabled 同款纪律，ADR-0012）——\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                const t = String(this.data.type ?? "text");\r
                if (n instanceof HTMLInputElement) {\r
                    // type 透传（textarea 形态下本元素不渲染，防御性归一 text）；\r
                    // 密码可见切换：password + passwordVisible → text\r
                    n.type = t === "textarea"\r
                        ? "text"\r
                        : t === "password" && this.data.passwordVisible ? "text" : (t || "text");\r
                }\r
                n.placeholder = String(this.data.placeholder ?? "");\r
                const ml = Number(this.data.maxlength) || 0;\r
                if (ml > 0) n.setAttribute("maxlength", String(ml));\r
                else n.removeAttribute("maxlength");\r
                if (n instanceof HTMLTextAreaElement) n.rows = Number(this.data.rows) || 2;\r
                // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
                // 形态标记（CSS 通道：textarea 高度放开，:has() 的 JS 免版）\r
                if (t === "textarea") this.el.setAttribute("data-form", "textarea");\r
                else this.el.removeAttribute("data-form");\r
            };\r
\r
            // —— 值桥（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件 ——\r
            // 劫持前快照 expando（x-model 编译期可能已写初值——宿主无原生 value，\r
            // 编译期写入落 expando）；无 x-model 时回退 props.value 初值\r
            const prior = this.el.value;\r
            if (typeof prior === "string" && prior !== "") lastValue = prior;\r
            else if (this.data.value != null) lastValue = String(this.data.value);\r
            // 快照归一值 + 初始化窗口标志：编译期初值的**重放识别**。scope.refresh 类机制\r
            // （如 i18n 插件 ready 的首渲染换血）会以当前 state 重跑 x-model 监听，把编译期\r
            // 初值（尤其空串——快照序里是「模型缺席」信号，props 兜底胜出）经劫持 setter 二次\r
            // 落盘，覆盖已按快照序裁定的初值归属。初始化窗口（一跳 setTimeout 前）内与快照\r
            // 归一值同值的写入即重放，跳过；真实状态变化（值不同）不受影响\r
            const snapshotNorm = String(prior ?? "");\r
            let initDone = false;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const n = native();\r
                    return n ? n.value : lastValue;\r
                },\r
                set: (v) => {\r
                    if (!initDone && String(v ?? "") === snapshotNorm) return;\r
                    lastValue = String(v ?? "");\r
                    const n = native();\r
                    if (n) n.value = lastValue;\r
                    syncLen();\r
                },\r
                configurable: true,\r
            });\r
\r
            // —— 输入跟随（原生 input 冒泡经宿主）：len 维护（x-model 回写由宿主监听自理）——\r
            this.el.addEventListener("input", () => {\r
                const n = native();\r
                if (n) lastValue = n.value;\r
                syncLen();\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——\r
            setTimeout(() => {\r
                syncAttrs();\r
                syncValue();\r
                initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩（此后全量生效）\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            this.watch("type", () => { setTimeout(() => { syncAttrs(); syncValue(); }, 0); });\r
            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });\r
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });\r
            this.watch("rows", () => { setTimeout(syncAttrs, 0); });\r
            this.watch("showPassword", () => { setTimeout(syncAttrs, 0); });\r
            // value props 单向同步（非受控/外部受控无 x-model 场景）：变化才写（与自身\r
            // 桥写不冲突——guard 防回环）。已见值比对幂等防御（checkbox 同款）：scope.refresh\r
            // 类无变化重跑（i18n ready 换血等）不得把 x-model expando 注入的初值打回 props\r
            // 缺省空串——先比对已见 props 值，同值跳过\r
            let lastPropsValue = String(this.data.value ?? "");\r
            this.watch("value", ({ value }) => {\r
                const v = String(value ?? "");\r
                if (v === lastPropsValue) return;\r
                lastPropsValue = v;\r
                if (v === lastValue) return;\r
                lastValue = v;\r
                const n = native();\r
                if (n) n.value = v;\r
                syncLen();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-input">\r
    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */\r
    .asc-input-native {\r
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
    .asc-input-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-input-native:disabled {\r
      cursor: not-allowed;\r
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-input-disable-color, inherit));\r
    }\r
\r
    /* ---------- textarea 形态（data-form 由 mounted 同步）：盒饰高度放开随行数增长，\r
             内层控件高度自适应 + 允许纵向拖拽调距 ---------- */\r
    .asc-input[data-form="textarea"] {\r
      height: auto;\r
      min-height: var(\r
        --auto-input-height,\r
        var(--asc-field-height, calc(var(--auto-font-size, 0.875rem) * 2.57))\r
      );\r
      align-items: stretch;\r
      cursor: text;\r
    }\r
    .asc-input[data-form="textarea"] .asc-input-native {\r
      height: auto;\r
      resize: vertical;\r
    }\r
\r
    /* ---------- 前后置装饰：文本/图标混排，次要色 ---------- */\r
    .asc-input-prefix,\r
    .asc-input-suffix {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      flex: none;\r
      white-space: nowrap;\r
      color: var(--auto-secondary-color, var(--asc-input-affix, rgba(0, 0, 0, 0.55)));\r
    }\r
    /* 前置与控件间距、后置与动作件间距（互斥场景各留半距，组合场景自然衔接） */\r
    .asc-input-prefix {\r
      margin-right: 0.4em;\r
    }\r
    .asc-input-suffix {\r
      margin-left: 0.4em;\r
    }\r
\r
    /* ---------- 动作件（清除/眼睛切换）：内部交互钮，淡色常态 + 悬停正文色 ---------- */\r
    .asc-input-action {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      cursor: pointer;\r
      border-radius: var(--auto-border-radius, var(--asc-input-action-radius, 0.25rem));\r
      color: var(--auto-third-color, var(--asc-input-action, rgba(0, 0, 0, 0.35)));\r
      transition: color 0.15s ease;\r
    }\r
    .asc-input-action:hover {\r
      color: var(--auto-color, var(--asc-input-action-hover, #606060));\r
    }\r
    .asc-input-action:active {\r
      transform: scale(0.92);\r
    }\r
\r
    /* ---------- 计数器：小一号辅助色；超限（data-over 由 mounted 同步）染 danger ---------- */\r
    .asc-input-count {\r
      flex: none;\r
      margin-left: 0.45em;\r
      font-size: 0.75em;\r
      white-space: nowrap;\r
      color: var(--auto-third-color, var(--asc-input-count, rgba(0, 0, 0, 0.35)));\r
    }\r
    .asc-input[data-over] .asc-input-count {\r
      color: var(--auto-danger-color, var(--asc-input-count-over, #ef4444));\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-input-native::placeholder,\r
    [data-dark] .asc-input-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-input-prefix,\r
    [dark] .asc-input-suffix,\r
    [data-dark] .asc-input-prefix,\r
    [data-dark] .asc-input-suffix {\r
      color: var(--auto-secondary-color, var(--asc-input-affix, rgba(255, 255, 255, 0.65)));\r
    }\r
    [dark] .asc-input-action,\r
    [data-dark] .asc-input-action {\r
      color: var(--auto-third-color, var(--asc-input-action, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-input-action:hover,\r
    [data-dark] .asc-input-action:hover {\r
      color: var(--auto-color, var(--asc-input-action-hover, #fafafa));\r
    }\r
    [dark] .asc-input-count,\r
    [data-dark] .asc-input-count {\r
      color: var(--auto-third-color, var(--asc-input-count, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-input[data-over] .asc-input-count,\r
    [data-dark] .asc-input[data-over] .asc-input-count {\r
      color: var(--auto-danger-color, var(--asc-input-count-over, #e6696a));\r
    }\r
  </style>\r
  <!-- 默认段（替换 field 出口 fallback）：input 的全部控件结构，文档序即呈现序\r
         [prefix] [控件] [清除] [眼睛] [suffix] [计数]。图标 x-icon 为指令值通道对\r
         props 注入响应；文本兜底 {{ }} 为插值通道（初始注入即定，prefix 后续变化走\r
         x-if 切换场景，文档已声明对象 props 经状态引用注入） -->\r
  <span class="asc-input-prefix" x-if="!!prefix">\r
    <i\r
      class="asc-input-icon"\r
      x-if="typeof prefix === 'object' && prefix && !!prefix.icon"\r
      x-icon="prefix.icon"\r
    ></i>\r
    <span class="asc-input-text" x-if="typeof prefix === 'string' && !!prefix">{{ prefix }}</span>\r
  </span>\r
  <input class="asc-input-native" data-autospark-control x-if="type !== 'textarea'" />\r
  <textarea\r
    class="asc-input-native"\r
    data-autospark-control\r
    x-if="type === 'textarea'"\r
    rows="2"\r
  ></textarea>\r
  <i\r
    class="asc-input-action asc-input-clear"\r
    data-autospark-action\r
    x-if="clearable && hasValue"\r
    x-icon="'no'"\r
    @click="onClear($event)"\r
  ></i>\r
  <i\r
    class="asc-input-action asc-input-eye"\r
    data-autospark-action\r
    x-if="showPassword && type === 'password'"\r
    x-icon="passwordVisible ? 'input-eye-off' : 'input-eye'"\r
    @click="onTogglePassword($event)"\r
  ></i>\r
  <span class="asc-input-suffix" x-if="!!suffix">\r
    <i\r
      class="asc-input-icon"\r
      x-if="typeof suffix === 'object' && suffix && !!suffix.icon"\r
      x-icon="suffix.icon"\r
    ></i>\r
    <span class="asc-input-text" x-if="typeof suffix === 'string' && !!suffix">{{ suffix }}</span>\r
  </span>\r
  <span class="asc-input-count" x-if="showCount">{{ countText }}</span>\r
</span>\r
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
