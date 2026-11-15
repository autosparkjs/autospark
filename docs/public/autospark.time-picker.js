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
`}n();function n(){e(e=>{t(e)})}var r=`<!--
    autospark.time-picker 时间选择器（ADR-0025）——触发器组件：Field 盒饰形态
    （.asc-field-box，input/select 同款 chrome）+ 选中值展示 + 时钟图标。时间面板
    不自建弹层，复用 x-popover 指令机制呈现（trigger:click 形态——点击切换 / 面板
    外点击 / ESC 关闭均机制继承）：内层触发器元素即 popover 宿主，面板组件
    autospark-time-picker-panel（同插件注册，panel.html）渲染进 body 覆盖物容器。

    面板 ↔ 触发器通信走 scope 链：面板经聚合视图沿链读写本组件 data 域——读
    hourList/minuteList/curHour/curMinute 呈现，写哨兵键（hTick/hVal、mTick/mVal——
    时/分格点选，面板模板不能跨组件边界调本组件方法，ADR-0022 决策 3）回传交互；
    面板 mounted/unmounted 沿链写 open 开合态。

    选择语义（ADR-0025 决策 2，与 select 的关键分叉）：点选时/分格**部分提交**——
    更新 value 对应位 + change 派发 + **面板保持开**（两列需连续两次点选，选中即关
    会让「选时→选分」断裂）；面板关闭走 popover 机制通道（外点/ESC）或再点触发器。
    空值状态点选时列 → "HH:00"（分位缺省 0）、点选分列 → "00:MM"（时位缺省 0）。

    值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持 ↔ data.value；
    选中 / 清除路径手动派发 input（非冒泡）+ change（冒泡 detail = { value }）；
    内嵌 input[type=hidden] 表单载体（name 透传，原生直提交）。

    键盘（按简，ADR-0025 边界声明）：面板内不做两列间漫游；触发器 Enter/ArrowDown
    开面板、面板开时 Enter 收起；ESC/Tab 归 popover 打开栈与原生移焦（机制继承）。
-->
<!-- 根 class 拼接进骨架宿主；data-open / data-has-value 由 mounted JS 通道同步，
     根上无动态绑定（T4=B） -->
<span
  class="asc-time-picker asc-field-box"
  x-define="autospark.time-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",       // 当前值（"HH:mm" 字符串语域，""=空；受控真相走宿主 x-model——el.value 桥）
            placeholder: "", // 占位文案（空时走 i18n 词典 time-picker.placeholder 键，回退「请选择时间」）
            clearable: false, // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）
            name: "",        // 表单载体名（元素名写法下 name 属性折叠为 props——与宿主属性双通道，mounted 合取）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            hasValue: false,   // 当前有值（清除钮可见性 / 占位切换）
            open: false,       // 面板开合态（面板 mounted/unmounted 沿链写回）
            curHour: -1,       // 当前时位（-1 无值——面板 data-selected 比较基准）
            curMinute: -1,     // 当前分位（-1 无值）
            hourList: [],      // 时列（0-23，{v,label}——面板 x-for 数据源）
            minuteList: [],    // 分列（0-59，{v,label}）
            hTick: 0,          // 时格点选哨兵（自增必变免疫同值去重；触发本组件时位提交流程）
            hVal: null,        // 时格点选携带值（0-23）
            mTick: 0,          // 分格点选哨兵
            mVal: null,        // 分格点选携带值（0-59）
        }),
        methods: {
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-time-picker-trigger");
            },
            // 表单载体（hidden input；每查现取）
            carrierEl() {
                return this.el.querySelector(".asc-time-picker-carrier");
            },
            // 两位补零（时/分格式化）
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            // "HH:mm" 解析（非法形态回 null）
            parseHm(s) {
                if (typeof s !== "string") return null;
                const p = s.split(":");
                if (p.length !== 2) return null;
                const h = Number(p[0]), mi = Number(p[1]);
                if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
                if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
                return { h: h, mi: mi };
            },
            // 时分 → "HH:mm"
            fmtHm(h, mi) {
                return this.pad2(h) + ":" + this.pad2(mi);
            },
            // 时/分列构建（24 时 / 60 分静态刻度）
            buildLists() {
                const hours = [], minutes = [];
                for (let i = 0; i < 24; i++) hours.push({ v: i, label: this.pad2(i) });
                for (let i = 0; i < 60; i++) minutes.push({ v: i, label: this.pad2(i) });
                this.data.hourList = hours;
                this.data.minuteList = minutes;
            },
            // 选中呈现同步（JS 通道：值即展示——"HH:mm" 直出；curHour/curMinute 供面板选中标记）
            syncValue() {
                const v = this.data.value;
                const has = v != null && v !== "";
                this.data.hasValue = has;
                const p = has ? this.parseHm(String(v)) : null;
                this.data.curHour = p ? p.h : -1;
                this.data.curMinute = p ? p.mi : -1;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(v) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            // 开合态副作用：aria-expanded / data-open 同步（JS 直写无 T4=B 约束）
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
            },
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            // 值变更出口（部分提交/清除共用）：input 非冒泡（x-model 监听在宿主自身）
            //     + change 冒泡 detail={value}（外层消费）——两列连续点选会连发两次
            //     （值确实变了两次，诚实语义，ADR-0025）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览
            //     但点选被 guard 阻断——只读可见选不了）
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（声明式面板不入 overlay
            //     实例注册表，ADR-0022 同款绕行）；open 守卫防已关态误开
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 部分提交（时/分格哨兵汇聚点）：只更新对应位，另一位缺省 0；面板保持开
            //     （两列连续选择语义）；禁用/只读阻断；同值幂等跳过（不派发）
            applyPart(isHour, v) {
                if (this.data.disabled || this.data.readonly) return;
                if (v == null || v === "") return; // 载荷空值守卫：Number(null)===0 的数字转换坑（哨兵无载荷重跑防御第二道）
                const n = Number(v);
                if (!Number.isFinite(n)) return;
                if (isHour && (n < 0 || n > 23)) return;
                if (!isHour && (n < 0 || n > 59)) return;
                const h = isHour ? n : (this.data.curHour >= 0 ? this.data.curHour : 0);
                const mi = !isHour ? n : (this.data.curMinute >= 0 ? this.data.curMinute : 0);
                const next = this.fmtHm(h, mi);
                if (next === this.data.value) return;
                this.data.value = next;
                this.syncValue();
                this.emitChange();
            },
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +
            //     阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）；字符串空语域
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            // 触发器键盘（按简）：Enter/ArrowDown 开面板、面板开时 Enter 收起确认；
            //     ESC 与 Tab 不拦截
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "Enter" || event.key === "ArrowDown") {
                    event.preventDefault();
                    if (this.data.open) this.closePanel();
                    else this.openPanel();
                }
            },
        },
        mounted() {
            // —— 值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持——
            //     劫持前快照 expando；无 x-model 回退 props.value 初值；setter 等值守卫
            //     防 x-model 回写环（guard 值经闭包持有——watch 侧同步维护）
            const prior = this.el.value;
            let lastValue = undefined;
            if (prior !== undefined && prior !== null && prior !== "") lastValue = prior;
            else if (this.data.value != null && this.data.value !== "") lastValue = this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const v = self.data.value;
                    return v == null ? "" : v;
                },
                set: (v) => {
                    const norm = v == null ? "" : String(v);
                    if (norm === lastValue) return;
                    lastValue = norm;
                    self.data.value = norm;
                    self.syncValue();
                },
                configurable: true,
            });
            if (lastValue !== undefined) this.data.value = lastValue;

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：布尔 props
            //     元素名写法归一（裸属性折叠为空串——"" → true，ADR-0025）+ 载体 name
            //     双通道 + 时分列构建 + 全量首同步
            setTimeout(() => {
                if (this.data.clearable === "") this.data.clearable = true;
                if (this.data.disabled === "") this.data.disabled = true;
                if (this.data.readonly === "") this.data.readonly = true;
                const nameProp = this.data.name;
                const nameAttr = typeof nameProp === "string" && nameProp !== ""
                    ? nameProp
                    : this.el.getAttribute("name");
                const c = this.carrierEl();
                if (c && nameAttr != null && nameAttr !== "") c.name = nameAttr;
                this.buildLists();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            // —— props / 哨兵跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            // 面板哨兵：时/分格点选（hTick/mTick——面板模板不能跨组件边界调本组件方法，
            //     经哨兵键沿链写回，ADR-0022 决策 3）。
            //     已见值比对幂等防御（color-picker 同款）：scope.refresh 类机制（i18n
            //     ready 换血等）以**当前哨兵值**重跑监听——无变化重跑若照常执行，会把
            //     空载荷（hVal/mVal 缺省 null）数字化成 0（Number(null)===0）打掉已注入
            //     的初值。同值跳过，哨兵真正自增才执行
            const sentineled = (key, fn) => {
                let last = this.data[key];
                this.watch(key, () => {
                    if (this.data[key] === last) return;
                    last = this.data[key];
                    fn();
                });
            };
            sentineled("hTick", () => { this.applyPart(true, this.data.hVal); });
            sentineled("mTick", () => { this.applyPart(false, this.data.mVal); });
        },
    }
  <\/script>
  <style global id="autospark-components-time-picker">
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input/select 同款），光标手型 ---------- */
    .asc-time-picker {
      cursor: pointer;
    }
    .asc-time-picker[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-time-picker[data-disabled] .asc-time-picker-trigger {
      pointer-events: none;
    }
    .asc-time-picker[data-readonly] {
      cursor: default;
    }

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面） ---------- */
    .asc-time-picker-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      margin-inline: calc(
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem))
      );
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      align-self: stretch;
      outline: none;
    }
    .asc-time-picker-value {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-time-picker-color, #333333));
    }
    .asc-time-picker-placeholder {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-input-placeholder, var(--asc-time-picker-placeholder, rgba(0, 0, 0, 0.35)));
    }

    /* ---------- 尾部动作件：清除钮与时钟图标（开面板染 tone） ---------- */
    .asc-time-picker-clear {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-time-picker-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-time-picker-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-picker-clear:hover {
      color: var(--auto-color, var(--asc-time-picker-action-hover, #606060));
    }
    .asc-time-picker-clear:active {
      transform: scale(0.92);
    }
    .asc-time-picker-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      color: var(--auto-third-color, var(--asc-time-picker-icon, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-picker[data-open] .asc-time-picker-icon {
      color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-time-picker-primary, #009aff)));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换（变量链不变） ---------- */
    [dark] .asc-time-picker-value,
    [data-dark] .asc-time-picker-value {
      color: var(--auto-color, var(--asc-time-picker-color, #fafafa));
    }
    [dark] .asc-time-picker-placeholder,
    [data-dark] .asc-time-picker-placeholder {
      color: var(--auto-input-placeholder, var(--asc-time-picker-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-time-picker-clear,
    [dark] .asc-time-picker-icon,
    [data-dark] .asc-time-picker-clear,
    [data-dark] .asc-time-picker-icon {
      color: var(--auto-third-color, var(--asc-time-picker-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-time-picker-clear:hover,
    [data-dark] .asc-time-picker-clear:hover {
      color: var(--auto-color, var(--asc-time-picker-action-hover, #fafafa));
    }

    /* ══════════ 时间面板（autospark-time-picker-panel，渲染进 body 覆盖物容器）══════════
       语义色组织（ADR-0025 视觉对齐）：--asc-tone 中转（alert/tag 定型结构），选中实底
       tone + 白字，hover 走 color-mix 派生——与 select 选项 / date-picker 日格同源 */
    .asc-time-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-time-picker-primary, #009aff));
      display: block;
      padding: 0.25em;
      font-size: var(--auto-font-size, var(--asc-time-picker-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-time-picker-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-time-picker-panel-color, #333333));
    }
    /* 两列布局：时/分等宽列（固定 em 轨道定形面板宽——auto 宽弹层内 flex 收缩防护），
       各自纵向滚动（select 列表同款 max-height 限档） */
    .asc-time-picker-cols {
      display: flex;
      gap: 0.25em;
    }
    .asc-time-picker-col {
      flex: 1 1 5.5em;
      width: 5.5em;
      max-height: var(--asc-time-picker-max-height, 15em);
      overflow-y: auto;
      padding: 0.25em 0;
      box-sizing: border-box;
    }
    /* 时/分格：居中热区（克隆体内零 x-if——选中标记走 x-bind 布尔属性 + CSS） */
    .asc-time-picker-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 2.2em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-time-picker-cell-radius, 0.25rem));
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-time-picker-cell:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    .asc-time-picker-cell[data-selected] {
      background: var(--asc-tone);
      color: var(--asc-time-picker-cell-selected-ink, #ffffff);
      font-weight: var(--auto-font-weight, var(--asc-time-picker-selected-weight, 500));
    }
    .asc-time-picker-cell[data-selected]:hover {
      background: var(--asc-tone);
    }
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
    [dark] .asc-time-picker-panel,
    [data-dark] .asc-time-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-time-picker-primary, #56baff));
      color: var(--auto-color, var(--asc-time-picker-panel-color, #fafafa));
    }
  </style>
  <!-- 默认段（替换 field 出口 fallback）：表单载体 + 触发器（popover 宿主 /
         combobox 语义）+ 清除钮 + 时钟图标 -->
  <input type="hidden" class="asc-time-picker-carrier" />
  <span
    class="asc-time-picker-trigger"
    x-popover:autospark-time-picker-panel
    x-popover-options="{ trigger: 'click', padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded="false"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-time-picker-value" x-if="hasValue" x-text="value"></span>
    <span
      class="asc-time-picker-placeholder"
      x-if="!hasValue"
      x-text="placeholder || (t('time-picker.placeholder') === 'time-picker.placeholder' ? '请选择时间' : t('time-picker.placeholder'))"
    ></span>
  </span>
  <i
    class="asc-time-picker-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i class="asc-time-picker-icon" data-autospark-action x-icon="'time-clock'"></i>
</span>
`,i=`<!--
    autospark-time-picker-panel 时间面板（ADR-0025）——time-picker 的内部组件（非用户
    直接消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制
    （trigger:click）渲染进 body 覆盖物容器，面板外壳由 popover-shell 承载，本组件
    只贡献两列滚动列表（时 0-23 / 分 0-59）内容。

    与触发器组件（autospark.time-picker）的通信走 scope 链：聚合视图沿链读写触发器
    组件 data 域——
    - 读：hourList/minuteList（x-for 数据源）、curHour/curMinute（选中比较基准）；
    - 写：哨兵键 hTick/hVal 与 mTick/mVal（时/分格点选——面板模板不能跨组件边界调
      触发器组件 method，ADR-0022 决策 3；自增哨兵免疫同值去重；事件表达式用逗号
      运算符单表达式形态）；
    - 开合态：mounted/unmounted 沿链写 open。

    选择语义（ADR-0025 决策 2）：点选**部分提交**且面板保持开（两列连续选择）；关闭
    走 popover 机制通道（外点/ESC）或再点触发器。mounted 时两列各滚动定位到当前选中
    格（无选中落列首）。克隆体内零 x-if——选中标记走 x-bind 布尔属性 + CSS。
-->
<div class="asc-time-picker-panel" x-define="autospark-time-picker-panel">
  <script setup>
    {
        // 本组件零 props、零自有状态——全部数据经 scope 链读写触发器组件域；
        // data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生图标染色 / aria-expanded）
            this.data.open = true;
            // 两列各自滚动定位到当前选中格（无选中落列首——scrollIntoView 平滑兜底，
            // happy-dom 无布局环境下可选链静默跳过）
            const scrollCol = (col) => {
                const sel = col.querySelector(".asc-time-picker-cell[data-selected]");
                (sel || col.querySelector(".asc-time-picker-cell"))?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(() => {
                this.el.querySelectorAll(".asc-time-picker-col").forEach(scrollCol);
            }, 0);
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 时/分两列：静态刻度（触发器域 hourList/minuteList），点选沿链写哨兵键
         （部分提交，面板保持开——ADR-0025 决策 2） -->
  <div class="asc-time-picker-cols">
    <div class="asc-time-picker-col" role="listbox">
      <template x-for="h of hourList" :key="h.v">
        <span
          class="asc-time-picker-cell"
          role="option"
          x-bind:data-selected="h.v === curHour"
          x-on:click="hTick = hTick + 1, hVal = h.v"
          x-text="h.label"
        ></span>
      </template>
    </div>
    <div class="asc-time-picker-col" role="listbox">
      <template x-for="m of minuteList" :key="m.v">
        <span
          class="asc-time-picker-cell"
          role="option"
          x-bind:data-selected="m.v === curMinute"
          x-on:click="mTick = mTick + 1, mVal = m.v"
          x-text="m.label"
        ></span>
      </template>
    </div>
  </div>
</div>
`,a=`autospark.time-picker`,o=`autospark-time-picker-panel`,s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;function c(e){e.icons?.add?.(`time-clock`,s),e.components[a]=r,e.components[o]=i}l();function l(){e(e=>{c(e)})}};
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

//# sourceMappingURL=autospark.time-picker.js.map
