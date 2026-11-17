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
      [slot:prefix][body][slot:suffix]；template 载体（ADR-0137，2026-11-15 切换）\r
      ——class 经属性活注入落投影内容首根（间距/防收缩规则随类落内容根本身），\r
      无内容整出口静默消失、零多余 DOM，裸态控件组件继承亦无害；多根装饰仅首根\r
      得注入类——装饰出口建议单根，多根后续节点消费方自理）；盒饰 chrome 为 .asc-field-box\r
      选配类（input 类控件用，checkbox/radio/switch 等裸态控件不用）\r
    - 轻装饰/重装饰分层（2026-11-14 修订）：子组件 props 前后置（input 的\r
      prefix/suffix 文本|图标）是轻装饰（组件内贴控件），插槽前后置是重装饰\r
      （消费方任意 HTML，恒在轻装饰外侧），两者共存不互斥；插槽内容默认次要色、\r
      点击转发焦点到控件（消费方放交互件须自标 data-autospark-action 自理）；\r
      disabled/readonly 不对插槽内容做专门处理（与 props 装饰对齐）\r
    - 融合动作 actions（2026-11-16 修订二，ADR-0020 决策 3）：props 驱动渲染段\r
      （非插槽出口——数据→视图）——button props 数组 + 自有键 pos（before|after\r
      分侧，缺省 after）/name/value；组合复用 autospark.button（产物依赖其同页\r
      加载），融合复用 button-group 负 margin 边线复用范式（ADR-0014）；field\r
      disabled 联动合并项 disabled；点击组包派发 action-click（detail =\r
      {index,name,value,item}）+ 原生 click 双通道；空数组整段不渲染零 DOM\r
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
            disabled: false,  // 禁用：同步 [data-autospark-control] 原生控件 + 宿主 data-disabled（CSS 淡化/光标）+ 融合动作按钮联动\r
            readonly: false,  // 只读：同步 [data-autospark-control]（readOnly 语义）+ 宿主 data-readonly\r
            actions: [],      // 融合动作（2026-11-16 修订二）：button props 数组 + 自有键 pos（"before"|"after" 分侧，缺省 after）/ name（标识）/ value（原样透传 action-click detail）——数组 props 经状态引用注入（:actions="myActions"，引擎字面量数组死环缺陷 HEAD 未修）\r
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
            // —— 融合动作组包（ADR-0020 修订二）：按钮原生 click 冒泡经宿主——按\r
            //     DOM 序（容器内 .asc-field-action 集合的 indexOf）回查 actions\r
            //     原始项，组包派发 action-click（bubbles，detail =\r
            //     {index, name, value, item}）；原生 click 照常冒泡（双通道）；\r
            //     禁用按钮原生阻断、不到达此处 ——\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t) return;\r
                const btn = t.closest(".asc-field-action");\r
                if (!btn || !this.el.contains(btn)) return;\r
                const wrap = btn.closest(".asc-field-actions");\r
                if (!wrap) return;\r
                const side = wrap.classList.contains("asc-field-actions-before") ? "before" : "after";\r
                const list = (Array.isArray(this.data.actions) ? this.data.actions : [])\r
                    .filter((a) => a && (a.pos || "after") === side);\r
                const i = Array.from(wrap.querySelectorAll(".asc-field-action")).indexOf(btn);\r
                const item = list[i];\r
                if (!item) return;\r
                this.el.dispatchEvent(new CustomEvent("action-click", {\r
                    bubbles: true,\r
                    detail: { index: i, name: item.name, value: item.value, item },\r
                }));\r
            });\r
\r
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
         边框 = 组合令牌打底 + border-color longhand 色通道（ADR-0020 决策 7\r
         2026-11-17 修订）：shorthand 消费 --auto-input-border（theme input 域\r
         组合令牌，size+color 成对校准；缺省回退拆分链保持无 theme 观感），\r
         随后 border-color 接 --asc-field-line 中转（hover/focus/状态/禁用只换\r
         色不动粗——longhand 覆盖 shorthand 色分量，状态重染色机制完整保留） ---------- */\r
    .asc-field-box {\r
      --asc-field-line: var(\r
        --auto-border-color,\r
        var(--asc-field-border-color, #f0f0f0)\r
      );\r
      box-sizing: border-box;\r
      border: var(\r
        --auto-input-border,\r
        var(--asc-field-border-size, 1px) solid\r
          var(--asc-field-border-color, #f0f0f0)\r
      );\r
      border-color: var(--asc-field-line);\r
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
    /* ---------- 具名装饰出口 prefix/suffix（2026-11-15 切 template 载体，ADR-0137）：\r
         出口无包裹层——类经属性活注入落投影内容首根，内容根即骨架 flex 项：\r
         次要色设在内容根（消费方设色自然覆盖）+ 防收缩换行（控件 width:100% 会挤压\r
         装饰至 min-content，flex:none 镜像 .asc-input-prefix 同款保护）与间距（0.4em\r
         镜像 .asc-input-prefix/suffix 惯例）直接落内容根本身。无内容整出口静默消失\r
         （零多余 DOM，裸态控件组件继承亦无害）；多根装饰仅首根得注入类——装饰出口\r
         建议单根，多根后续节点消费方自理 ---------- */\r
    .asc-field-prefix,\r
    .asc-field-suffix {\r
      color: var(\r
        --auto-secondary-color,\r
        var(--asc-field-affix, rgba(96, 96, 96, 0.75))\r
      );\r
    }\r
    .asc-field-prefix {\r
      flex: none;\r
      margin-inline-end: 0.4em;\r
    }\r
    .asc-field-suffix {\r
      flex: none;\r
      margin-inline-start: 0.4em;\r
    }\r
\r
    /* ---------- 默认出口包裹层：不产生布局层（子组件控件直接成为骨架 flex 项） ---------- */\r
    .asc-field-body {\r
      display: contents;\r
    }\r
\r
    /* ---------- 融合动作 actions（2026-11-16 修订二）：渲染段容器 display:contents\r
         （按钮直接成盒饰 flex 项）；融合仅在盒饰层（.asc-field-box 后代——裸态控件\r
         无盒饰融合线不生效）——复用 button-group 负 margin 边线复用范式（ADR-0014\r
         决策 2）：按钮边框色让位 --asc-field-line 共享线（status/disabled 联动天然\r
         继承——变量定义在 box 上随状态覆盖），相邻按钮侧线压叠单线、组首/尾与盒\r
         边框重合（负距吃掉单侧内距+边框）；首/尾钮外侧圆角匹配盒饰、其余清除。\r
         **上下边框单线让位（2026-11-16 修订三）**：按钮不画自己的上下边框、纵向\r
         负距不吃盒边框（从线内缘起）——盒线独享、连续穿过按钮段。此前「两线对齐」\r
         形态（按钮自带上下线 + 负距全高贴边）在非整数缩放下两条各自取整的 1px 线\r
         会差出 1 物理像素（重合不严），且实心/无边框 variant 的按钮背景会盖住盒线\r
         段；单线让位结构性消灭两类缺陷（线只有一个绘制者）。左右侧线照常由按钮\r
         绘制（--asc-field-line） ---------- */\r
    .asc-field-actions {\r
      display: contents;\r
    }\r
    .asc-field-box .asc-field-action {\r
      border-color: var(--asc-field-line);\r
      border-top-width: 0;\r
      border-bottom-width: 0;\r
      border-radius: 0;\r
      align-self: stretch;\r
      margin-block: calc(\r
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2\r
      );\r
    }\r
    /* before 组首钮左贴盒左线（负距吃左内距+边框）+ 外侧圆角匹配盒饰。\r
       首尾用 *-of-type：x-for 的 template 宿主渲染后追加在项元素之后（DOM 序\r
       [钮…, template]），:last-child 会误中 template */\r
    .asc-field-box .asc-field-actions-before .asc-field-action:first-of-type {\r
      margin-inline-start: calc(\r
        -1 *\r
          (\r
            var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) +\r
              var(--auto-border-size, var(--asc-field-border-size, 1px))\r
          )\r
      );\r
      border-start-start-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
      border-end-start-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
    }\r
    /* after 组尾钮右贴盒右线 + 外侧圆角匹配盒饰 */\r
    .asc-field-box .asc-field-actions-after .asc-field-action:last-of-type {\r
      margin-inline-end: calc(\r
        -1 *\r
          (\r
            var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) +\r
              var(--auto-border-size, var(--asc-field-border-size, 1px))\r
          )\r
      );\r
      border-start-end-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
      border-end-end-radius: var(\r
        --auto-input-radius,\r
        var(--asc-field-radius, 0.5rem)\r
      );\r
    }\r
    /* 组内相邻按钮：侧线压叠单线（每钮压前邻右线，共享一条 --asc-field-line） */\r
    .asc-field-box .asc-field-action + .asc-field-action {\r
      margin-inline-start: calc(\r
        -1 * var(--auto-border-size, var(--asc-field-border-size, 1px))\r
      );\r
    }\r
    /* 钮组与控件位间距（2026-11-16）：贴盒边融合保留（首/尾钮负距吃盒内距+边框，\r
       控件与钮零距贴死）——组靠控件侧一钮留 0.4em 缝（镜像装饰出口间距标尺）。\r
       伪类须 *-of-type：x-for 的 template 锚点追加在项后（同款坑见上方贴边规则），\r
       :last-child 永不命中（template 在最后） */\r
    .asc-field-box .asc-field-actions-before .asc-field-action:last-of-type {\r
      margin-inline-end: 0.4em;\r
    }\r
    .asc-field-box .asc-field-actions-after .asc-field-action:first-of-type {\r
      margin-inline-start: 0.4em;\r
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
       prefix / suffix 具名装饰出口 template 载体（ADR-0137，2026-11-15 切换）——无\r
       内容整出口静默消失，消费方经宿主直接子级标记 <template x-slot:prefix> 投影\r
       任意内容（class 活注入落内容首根：次要色/间距/防收缩随类落根，恒在子组件\r
       props 轻装饰外侧）；默认出口被子组件默认段替换（继承覆盖，ADR-0081）——\r
       直接实例化时消费方内容同位，三层优先级：消费方内容 > 继承覆盖 > 本空 fallback -->\r
  <!-- 融合动作渲染段（2026-11-16 修订二，ADR-0020 决策 3）：props 驱动非插槽出口——\r
       空 actions 整段 x-if 不渲染（零 DOM）；双段按 pos 过滤分侧，DOM 序恒\r
       [before actions][prefix][body][suffix][after actions]（动作按钮最外层包壳）。\r
       值 = Object.assign 全键透传项（button props 全集 + disabled 与 field 联动合并，\r
       自有键 pos/name/value 入 button data 域被忽略无害）；按钮宿主自动标\r
       data-autospark-action（点击自理）；x-for 值表达式 = 官方 filter 形态\r
       （引擎 x-for 测试覆盖，with 求值通道响应 actions 注入） -->\r
  <span class="asc-field-actions asc-field-actions-before" x-if="!!(actions && actions.length)">\r
    <template x-for="item of actions.filter(a => a && a.pos === 'before')">\r
      <span\r
        class="asc-field-action"\r
        data-autospark-action\r
        x-component:autospark.button="Object.assign({}, item, { disabled: item.disabled || !!disabled })"\r
      ></span>\r
    </template>\r
  </span>\r
  <template class="asc-field-prefix" x-slot:prefix></template>\r
  <span class="asc-field-body" x-slot></span>\r
  <template class="asc-field-suffix" x-slot:suffix></template>\r
  <span class="asc-field-actions asc-field-actions-after" x-if="!!(actions && actions.length)">\r
    <template x-for="item of actions.filter(a => !a || a.pos !== 'before')">\r
      <span\r
        class="asc-field-action"\r
        data-autospark-action\r
        x-component:autospark.button="Object.assign({}, item, { disabled: item.disabled || !!disabled })"\r
      ></span>\r
    </template>\r
  </span>\r
</span>\r
`}n();function n(){e(e=>{t(e)})}var r=`<!--\r
    autospark.select 下拉选择器（ADR-0022）——触发器组件：Field 盒饰形态\r
    （.asc-field-box，input 同款 chrome）+ 选中值展示 + 下拉箭头。下拉面板不自建弹层，\r
    复用 x-popover 指令机制呈现（trigger:click 形态——点击切换 / 面板外点击 / ESC 关闭\r
    均机制继承，ADR-0060）：内层触发器元素即 popover 宿主，面板组件 autospark.select-panel\r
    （同插件注册，panel.html）渲染进 body 覆盖物容器，fit 选项使面板宽度随触发器。\r
\r
    面板 ↔ 触发器通信走 scope 链（零 DOM 事件、零 uid 配对）：overlay 内容宿主恒以\r
    「open + dataContext:host」实例化面板组件（ADR-0123 决策 2），面板经聚合视图沿链\r
    读写本组件 data 域——读 filteredOptions/activeValue 等呈现，写哨兵键\r
    （pickTick/pickValue、keyTick/keyDir、filterText）回传交互；面板 mounted/unmounted\r
    沿链写 open 开合态（箭头旋转 / aria-expanded / 过滤词复位）。\r
\r
    值桥（x-model 兼容协议，对齐 ADR-0020 input 范式 / switch hidden 载体先例）：\r
    宿主 el.value 劫持 ↔ data.value；选中 / 清除路径手动派发 input（非冒泡，x-model\r
    宿主监听回写 state）+ change（冒泡，detail = { value }，外层消费）；内嵌\r
    input[type=hidden] 表单载体（name 透传，原生直提交）。\r
\r
    键盘（触发器焦点）：上下移动高亮（跳过禁用项）/ Enter 确认或开面板 / ESC 归 popover\r
    打开栈（机制继承）不拦截；filterable 时过滤框内键盘经面板哨兵键走同一导航。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-select + .asc-field-box 盒饰选配，\r
     ADR-0020 消费契约）；data-open / data-has-value / data-loading 由 mounted JS 通道\r
     同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-select asc-field-box"\r
  x-define="autospark.select"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: null,       // 当前值（单选起步，string | number；受控真相走宿主 x-model——el.value 桥，ADR-0022）\r
            options: [],       // 选项数组 [{ label, value, disabled? }]（经 x-data 状态引用注入——字面量数组有引擎死环缺陷，ADR-0022）\r
            placeholder: "",   // 占位文案（空时走 i18n 词典 select.placeholder 键，回退「请选择」）\r
            clearable: false,  // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）\r
            filterable: false, // 本地过滤（P1 简实现：面板顶部过滤框，对 label 不区分大小写包含匹配）\r
            loading: false,    // 加载态：面板列表 x-loading 遮罩 + 触发器箭头转旋转图标\r
            virtual: false,    // 长列表虚拟渲染开关（面板切 x-for.virtual；须加载 autospark.virtual.js，缺席时引擎降级全量渲染，ADR-0022）\r
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——\r
            uid: "",               // 实例唯一标识（根 data-asc-select-uid 属性载体——面板宽度\r
                                   // 匹配的配对键：popover 的 fit 基准是触发器内容区宽，不含\r
                                   // 盒饰 padding，面板 mounted 按 uid 测盒饰宽补 min-width）\r
            hasValue: false,       // 当前有值（清除钮可见性 / 占位切换）\r
            labelText: "",         // 选中项文案（options/value 经 JS 重解析；countText 同款通道）\r
            filteredOptions: [],   // 过滤产物（面板 x-for 数据源；options/filterText 变化时重建）\r
            filterText: "",        // 过滤词（面板过滤框写回；面板关闭时复位）\r
            activeIndex: -1,       // 键盘高亮索引（filteredOptions 内；-1 无高亮）\r
            activeValue: null,     // 高亮项值（面板 :data-active 比较基准——索引对模板不可见，值通道免疫过滤重建）\r
            open: false,           // 面板开合态（面板 mounted/unmounted 沿链写回；箭头旋转/aria/复位驱动）\r
            pickTick: 0,           // 选中哨兵（面板点击/过滤框 Enter 写：自增必变免疫同值去重；触发本组件选中流程）\r
            pickValue: null,       // 选中哨兵携带值\r
            keyTick: 0,            // 键盘导航哨兵（过滤框内上下键写——面板模板不能跨组件边界调本组件方法，ADR-0022 决策 3）\r
            keyDir: 0,             // 键盘导航方向（1 下 / -1 上）\r
        }),\r
        methods: {\r
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）\r
            triggerEl() {\r
                return this.el.querySelector(".asc-select-trigger");\r
            },\r
            // 表单载体（hidden input；每查现取）\r
            carrierEl() {\r
                return this.el.querySelector(".asc-select-carrier");\r
            },\r
            // 选中呈现同步（JS 通道：labelText 由 options/value 重解析——props 晚注入 /\r
            //     options 引用内容变化都经 watch 收口到这里）。选项匹配走字符串归一比较\r
            //     （x-model 对 text 控件语义会把值往返归一为字符串——7 与 "7" 须互认）\r
            syncValue() {\r
                const v = this.data.value;\r
                const has = v != null && v !== "";\r
                this.data.hasValue = has;\r
                const list = this.data.options ?? [];\r
                const opt = has ? list.find((o) => o && String(o.value) === String(v)) : null;\r
                this.data.labelText = opt ? String(opt.label ?? opt.value) : "";\r
                const c = this.carrierEl();\r
                if (c) {\r
                    c.value = has ? String(v) : "";\r
                    c.disabled = !!this.data.disabled;\r
                }\r
            },\r
            // 高亮同步（activeValue 为面板比较基准）\r
            syncActive() {\r
                const list = this.data.filteredOptions ?? [];\r
                const i = this.data.activeIndex;\r
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;\r
                else this.data.activeValue = null;\r
            },\r
            // 过滤重建（options / filterText 变化；activeIndex 越界时回落选中项）\r
            rebuildFiltered() {\r
                const list = this.data.options ?? [];\r
                const kw = String(this.data.filterText ?? "").trim().toLowerCase();\r
                this.data.filteredOptions = kw === ""\r
                    ? [...list]\r
                    : list.filter((o) => String(o?.label ?? "").toLowerCase().includes(kw));\r
                const i = this.data.activeIndex;\r
                if (i < 0 || i >= this.data.filteredOptions.length) this.setActiveToValue();\r
                else this.syncActive();\r
            },\r
            // 高亮落当前选中项（打开面板时的定位基准；字符串归一比较同 syncValue）\r
            setActiveToValue() {\r
                const list = this.data.filteredOptions ?? [];\r
                this.data.activeIndex = list.findIndex(\r
                    (o) => o && String(o.value) === String(this.data.value),\r
                );\r
                this.syncActive();\r
            },\r
            // 开合态副作用：复位过滤词与高亮定位（打开时高亮落当前选中项）+\r
            //     aria-expanded / data-open 同步（JS 直写无 T4=B 约束）\r
            syncOpen() {\r
                const on = !!this.data.open;\r
                this.el.toggleAttribute("data-open", on);\r
                const t = this.triggerEl();\r
                if (t) t.setAttribute("aria-expanded", String(on));\r
                if (on) {\r
                    this.data.filterText = "";\r
                    this.rebuildFiltered();\r
                    this.setActiveToValue();\r
                }\r
            },\r
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板\r
            syncInteractive() {\r
                const t = this.triggerEl();\r
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;\r
                const c = this.carrierEl();\r
                if (c) c.disabled = !!this.data.disabled;\r
                this.el.toggleAttribute("data-loading", !!this.data.loading);\r
                if (this.data.disabled && this.data.open) this.closePanel();\r
            },\r
            // 值变更出口（选中/清除共用）：input 非冒泡（x-model 监听在宿主自身，\r
            //     checkbox/switch 同款）+ change 冒泡 detail={value}（外层消费）\r
            emitChange() {\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),\r
                );\r
            },\r
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览\r
            //     但选中被 pick guard 阻断——只读可见可选不了，文档已声明）\r
            openPanel() {\r
                if (this.data.disabled) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（「再点宿主关闭」——与\r
            // 用户操作同一关闭路径；命令式 engine.getOverlay().close 只回收命令式通道\r
            // 打开的实例，声明式 x-popover 面板不入实例注册表，对指令面板无效）。open\r
            // 守卫防已关态误开（toggle 语义）；overlay 插件缺席时 open 恒 false 自然跳过\r
            closePanel() {\r
                if (!this.data.open) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            // 高亮移动（dir = 1 下 / -1 上）：环找下一个非禁用项（首尾环绕；全禁用不动）\r
            moveActive(dir) {\r
                const list = this.data.filteredOptions ?? [];\r
                if (list.length === 0) return;\r
                let i = this.data.activeIndex;\r
                for (let step = 0; step < list.length; step++) {\r
                    i = (i + dir + list.length) % list.length;\r
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }\r
                }\r
            },\r
            // Enter 确认当前高亮项\r
            confirmActive() {\r
                if (this.data.activeValue != null) this.pick(this.data.activeValue);\r
            },\r
            // 选中流程（面板点击哨兵 / 触发器键盘 / 过滤框 Enter 汇聚点）：禁用与只读\r
            // 阻断；同值仅关面板；写值 + 双派发 + 关面板 + 焦点回触发器（匹配同\r
            // syncValue 的字符串归一比较）\r
            pick(v) {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const list = this.data.options ?? [];\r
                const opt = list.find((o) => o && String(o.value) === String(v));\r
                if (!opt || opt.disabled) return;\r
                if (String(opt.value) === String(this.data.value)) { this.closePanel(); return; }\r
                this.data.value = opt.value;\r
                this.syncValue();\r
                this.emitChange();\r
                this.closePanel();\r
                this.triggerEl()?.focus();\r
            },\r
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +\r
            // 阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）\r
            onClear(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled || this.data.readonly) return;\r
                if (!this.data.hasValue) return;\r
                this.data.value = null;\r
                this.syncValue();\r
                this.emitChange();\r
                this.triggerEl()?.focus();\r
            },\r
            // 触发器键盘导航：上下移动高亮（未开先开）/ Enter 确认（未开先开）/\r
            // ESC 与 Tab 不拦截（ESC 归 popover 打开栈——机制继承；Tab 自然移焦）\r
            onTriggerKeydown(event) {\r
                if (this.data.disabled) return;\r
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {\r
                    event.preventDefault();\r
                    if (!this.data.open) { this.openPanel(); return; }\r
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);\r
                } else if (event.key === "Enter") {\r
                    event.preventDefault();\r
                    if (this.data.open) this.confirmActive();\r
                    else this.openPanel();\r
                }\r
            },\r
        },\r
        mounted() {\r
            // —— 值桥（x-model 兼容协议，ADR-0022 对齐 ADR-0020）：宿主 el.value 劫持 ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.value 初值（快照序：expando > props.value，input 同款）；setter\r
            //     等值守卫防 x-model 回写环（guard 值经闭包持有——watch 侧同步维护）\r
            const prior = this.el.value;\r
            let lastValue = undefined;\r
            if (prior !== undefined && prior !== null && prior !== "") lastValue = prior;\r
            else if (this.data.value != null) lastValue = this.data.value;\r
            const self = this;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const v = self.data.value;\r
                    return v == null ? "" : v;\r
                },\r
                set: (v) => {\r
                    const norm = v == null ? null : v;\r
                    if (norm === lastValue) return;\r
                    lastValue = norm;\r
                    self.data.value = norm;\r
                    self.syncValue();\r
                },\r
                configurable: true,\r
            });\r
            if (lastValue !== undefined) this.data.value = lastValue;\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：表单载体\r
            //     name 透传（原生直提交，ADR-0020 决策 6 同款载体语义）+ 全量首同步 ——\r
            setTimeout(() => {\r
                const nameAttr = this.el.getAttribute("name");\r
                const c = this.carrierEl();\r
                if (c && nameAttr != null) c.name = nameAttr;\r
                // 实例唯一标识落根属性（面板宽度配对键，ADR-0022 决策 2 注记）\r
                this.data.uid = "asc-select-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);\r
                this.el.setAttribute("data-asc-select-uid", this.data.uid);\r
                this.rebuildFiltered();\r
                this.syncValue();\r
                this.syncOpen();\r
                this.syncInteractive();\r
            }, 0);\r
\r
            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作\r
            //     触发信号，家族惯用法）——\r
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });\r
            this.watch("options", () => { setTimeout(() => { this.rebuildFiltered(); this.syncValue(); }, 0); });\r
            this.watch("filterText", () => { this.rebuildFiltered(); });\r
            this.watch("activeIndex", () => { this.syncActive(); });\r
            this.watch("open", () => { this.syncOpen(); });\r
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });\r
            this.watch("loading", () => { this.el.toggleAttribute("data-loading", !!this.data.loading); });\r
            // 面板哨兵：选中（pickTick）/ 过滤框键盘导航（keyTick——面板模板不能跨组件\r
            // 边界调本组件方法，经哨兵键沿链写回，ADR-0022 决策 3）\r
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });\r
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-select">\r
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input 同款），光标手型 ---------- */\r
    .asc-select {\r
      cursor: pointer;\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断\r
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */\r
    .asc-select[data-disabled] {\r
      cursor: not-allowed;\r
      opacity: 0.55;\r
    }\r
    .asc-select[data-disabled] .asc-select-trigger {\r
      pointer-events: none;\r
    }\r
    /* 只读：光标归正文（面板可开浏览，选中被 pick guard 阻断） */\r
    .asc-select[data-readonly] {\r
      cursor: default;\r
    }\r
\r
    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面，\r
             含盒饰 padding 区域）；可聚焦（tabindex 由 JS 通道维护禁用态） ---------- */\r
    .asc-select-trigger {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      margin-inline: calc(\r
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem))\r
      );\r
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));\r
      align-self: stretch;\r
      outline: none;\r
    }\r
    /* 选中值展示：占位与值两态（x-if 切换），占位走次要淡化色 */\r
    .asc-select-value {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-color, var(--asc-select-color, #333333));\r
    }\r
    .asc-select-placeholder {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-input-placeholder, var(--asc-select-placeholder, rgba(0, 0, 0, 0.35)));\r
    }\r
\r
    /* ---------- 尾部动作件：清除钮（内部交互件，不转发焦点）与下拉箭头 ---------- */\r
    .asc-select-clear {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      cursor: pointer;\r
      border-radius: var(--auto-border-radius, var(--asc-select-action-radius, 0.25rem));\r
      color: var(--auto-third-color, var(--asc-select-action, rgba(0, 0, 0, 0.35)));\r
      transition: color 0.15s ease;\r
    }\r
    .asc-select-clear:hover {\r
      color: var(--auto-color, var(--asc-select-action-hover, #606060));\r
    }\r
    .asc-select-clear:active {\r
      transform: scale(0.92);\r
    }\r
    /* 下拉箭头：开合旋转 180°（data-open 由 JS 通道同步）；loading 态换旋转图标\r
       （图标自带旋转动画，方向旋转停用） */\r
    .asc-select-arrow {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      color: var(--auto-third-color, var(--asc-select-arrow, rgba(0, 0, 0, 0.35)));\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-select[data-open] .asc-select-arrow {\r
      transform: rotate(180deg);\r
    }\r
    .asc-select[data-loading] .asc-select-arrow {\r
      transform: none;\r
      color: var(--asc-field-tone);\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-select-value,\r
    [data-dark] .asc-select-value {\r
      color: var(--auto-color, var(--asc-select-color, #fafafa));\r
    }\r
    [dark] .asc-select-placeholder,\r
    [data-dark] .asc-select-placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-select-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-select-clear,\r
    [dark] .asc-select-arrow,\r
    [data-dark] .asc-select-clear,\r
    [data-dark] .asc-select-arrow {\r
      color: var(--auto-third-color, var(--asc-select-action, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-select-clear:hover,\r
    [data-dark] .asc-select-clear:hover {\r
      color: var(--auto-color, var(--asc-select-action-hover, #fafafa));\r
    }\r
\r
    /* ══════════ 下拉面板（autospark-select-panel，渲染进 body 覆盖物容器；样式经\r
       本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════ */\r
    .asc-select-panel {\r
      display: block;\r
      min-width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-select-panel-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, var(--asc-select-panel-line-height, 1.4));\r
      color: var(--auto-color, var(--asc-select-panel-color, #333333));\r
    }\r
    /* 过滤框（filterable）：面板顶部，原生 input 裸化 + 底部细分隔线 */\r
    .asc-select-filter {\r
      padding: 0.4em 0.6em;\r
      border-bottom: var(--auto-border-size, var(--asc-select-filter-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-select-filter-border, #f0f0f0));\r
    }\r
    .asc-select-filter-input {\r
      box-sizing: border-box;\r
      width: 100%;\r
      border: none;\r
      outline: none;\r
      background: transparent;\r
      padding: 0.25em 0.1em;\r
      border-bottom: 1px solid transparent;\r
      color: inherit;\r
      font: inherit;\r
    }\r
    .asc-select-filter-input:focus {\r
      border-bottom-color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-select-primary, #009aff)));\r
    }\r
    /* 选项列表：最大高度限档 + 纵向滚动（虚拟化形态由 x-for.virtual 接管窗口渲染） */\r
    .asc-select-list {\r
      max-height: var(--asc-select-max-height, 15em);\r
      overflow-y: auto;\r
      padding: 0.25em 0;\r
      box-sizing: border-box;\r
    }\r
    /* 虚拟分支行高固定 32px（虚拟化需确定项高——规范用法显式声明，与字号档位解耦，\r
       ADR-0022 决策 4；与 x-for-options 的 itemHeight: 32 配套） */\r
    .asc-select-virtual .asc-select-option {\r
      height: 32px;\r
      min-height: 0;\r
      box-sizing: border-box;\r
    }\r
    /* 选项：行式热区；悬停/高亮/选中/禁用态经 data-* 属性选择器驱动（绑定通道写\r
       属性——假值整个移除即无态，绑定语义天然契合） */\r
    .asc-select-option {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.4em;\r
      min-height: 2.2em;\r
      padding: 0.3em 0.75em;\r
      cursor: pointer;\r
      transition: background-color 0.12s ease;\r
    }\r
    .asc-select-option-label {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
    }\r
    .asc-select-option-check {\r
      flex: none;\r
      display: none;\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #009aff));\r
    }\r
    .asc-select-option[data-selected] {\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #009aff));\r
    }\r
    .asc-select-option[data-selected] .asc-select-option-check {\r
      display: inline-flex;\r
    }\r
    .asc-select-option[data-active]:not([data-selected]) {\r
      background: var(--auto-hover-bgcolor, var(--asc-select-option-hover-bg, rgba(0, 0, 0, 0.045)));\r
    }\r
    .asc-select-option[data-disabled] {\r
      color: var(--auto-disable-color, var(--asc-select-option-disabled, rgba(0, 0, 0, 0.28)));\r
      cursor: not-allowed;\r
      background: transparent;\r
    }\r
    .asc-select-option[data-disabled]:hover {\r
      background: transparent;\r
    }\r
    /* 空态（含过滤无匹配）：居中辅助色文案 */\r
    .asc-select-empty {\r
      padding: 0.9em 0.75em;\r
      text-align: center;\r
      color: var(--auto-third-color, var(--asc-select-empty, rgba(0, 0, 0, 0.35)));\r
    }\r
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */\r
    [dark] .asc-select-panel,\r
    [data-dark] .asc-select-panel {\r
      color: var(--auto-color, var(--asc-select-panel-color, #fafafa));\r
    }\r
    [dark] .asc-select-filter,\r
    [data-dark] .asc-select-filter {\r
      border-bottom-color: var(--auto-border-color, var(--asc-select-filter-border, #52525b));\r
    }\r
    [dark] .asc-select-option[data-active]:not([data-selected]),\r
    [data-dark] .asc-select-option[data-active]:not([data-selected]) {\r
      background: var(--auto-hover-bgcolor, var(--asc-select-option-hover-bg, rgba(255, 255, 255, 0.08)));\r
    }\r
    [dark] .asc-select-option[data-selected],\r
    [data-dark] .asc-select-option[data-selected] {\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #56baff));\r
    }\r
    [dark] .asc-select-option[data-disabled],\r
    [data-dark] .asc-select-option[data-disabled] {\r
      color: var(--auto-disable-color, var(--asc-select-option-disabled, rgba(255, 255, 255, 0.25)));\r
    }\r
    [dark] .asc-select-empty,\r
    [data-dark] .asc-select-empty {\r
      color: var(--auto-third-color, var(--asc-select-empty, rgba(255, 255, 255, 0.45)));\r
    }\r
  </style>\r
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden——提交值载体，禁用\r
         出表由 JS 同步）+ 触发器（popover 宿主 / 焦点受让者 / combobox 语义）+\r
         清除钮（动作件）+ 下拉箭头。文案走 props 与 i18n 词典（继承形态嵌套插槽出口\r
         被忽略，ADR-0056——不开真插槽，ADR-0022） -->\r
  <input type="hidden" class="asc-select-carrier" />\r
  <span\r
    class="asc-select-trigger"\r
    x-popover:autospark-select-panel\r
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"\r
    tabindex="0"\r
    role="combobox"\r
    aria-haspopup="listbox"\r
    aria-expanded="false"\r
    data-autospark-control\r
    @keydown="onTriggerKeydown($event)"\r
  >\r
    <span class="asc-select-value" x-if="hasValue" x-text="labelText"></span>\r
    <span\r
      class="asc-select-placeholder"\r
      x-if="!hasValue"\r
      x-text="placeholder || (t('select.placeholder') === 'select.placeholder' ? '请选择' : t('select.placeholder'))"\r
    ></span>\r
  </span>\r
  <i\r
    class="asc-select-clear"\r
    data-autospark-action\r
    x-if="clearable && hasValue"\r
    x-icon="'no'"\r
    @click="onClear($event)"\r
  ></i>\r
  <i\r
    class="asc-select-arrow"\r
    data-autospark-action\r
    x-icon="loading ? 'loading' : 'select-down'"\r
  ></i>\r
</span>\r
`,i=`<!--\r
    autospark-select-panel 下拉面板（ADR-0022）——select 的内部组件（非用户直接消费，\r
    无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制（trigger:click）\r
    渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/宽度 fit 随触发器）由 popover-shell\r
    承载，本组件只贡献选项列表内容。\r
\r
    与触发器组件（autospark.select）的通信走 scope 链：overlay 内容宿主恒以\r
    「open + dataContext:'host'」实例化本组件（ADR-0123 决策 2），聚合视图沿链读写触发器\r
    组件 data 域——\r
    - 读：filteredOptions（x-for 数据源）/ activeValue（高亮基准）/ value（选中基准）/\r
      filterable / virtual / loading（形态与状态呈现）；\r
    - 写：filterText（过滤框输入）、哨兵键 pickTick/pickValue（选项点击与过滤框 Enter\r
      确认）与 keyTick/keyDir（过滤框上下键导航）——面板模板不能跨组件边界调触发器\r
      组件 method（x-on 组件 method 查找不穿透父组件，ADR-0022 决策 3），自增哨兵免疫\r
      同值去重；事件表达式用逗号运算符单表达式形态（分号多语句依赖新版引擎回退，旧产物\r
      不可用）；\r
    - 开合态：mounted/unmounted 沿链写 open（箭头旋转 / aria-expanded / 过滤词复位）。\r
\r
    列表渲染双分支（ADR-0022 决策 4）：普通分支 template 形态 x-for（缺省）；虚拟分支\r
    **容器形态** x-for.virtual 直接挂列表容器（规范用法——template 形态下惰性内容让\r
    itemHeight 自动检测取 0 退化全量），须加载 autospark.virtual.js（渐进增强，缺席时\r
    引擎 warn + 降级全量渲染）。空态文案走 i18n 词典 select.empty 键（回退「暂无数据」）。\r
-->\r
<div class="asc-select-panel" x-define="autospark-select-panel">\r
  <script setup>\r
    {\r
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链\r
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）\r
        data: () => ({}),\r
        methods: {\r
            // 过滤框键盘导航（哨兵沿链写回，ADR-0022 决策 3）：上下键移动高亮 /\r
            // Enter 确认当前高亮项；ESC 不拦截（归 popover 打开栈——机制继承）\r
            onFilterKeydown(event) {\r
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {\r
                    event.preventDefault();\r
                    this.data.keyTick = Number(this.data.keyTick || 0) + 1;\r
                    this.data.keyDir = event.key === "ArrowDown" ? 1 : -1;\r
                } else if (event.key === "Enter") {\r
                    event.preventDefault();\r
                    if (this.data.activeValue != null) {\r
                        this.data.pickTick = Number(this.data.pickTick || 0) + 1;\r
                        this.data.pickValue = this.data.activeValue;\r
                    }\r
                }\r
            },\r
        },\r
        mounted() {\r
            // 开合态沿链写回（触发器侧 watch open 派生箭头旋转 / aria-expanded / 复位）\r
            this.data.open = true;\r
            // 宽度匹配触发器盒饰（ADR-0022 决策 2 注记）：popover 的 fit 基准是触发器\r
            // 内容区（popover 宿主元素，不含盒饰 padding）——按 uid 配对测盒饰宽，补写\r
            // shell 面板 min-width（fit 持续写 width，min-width 抬到盒宽；每次打开新\r
            // 实例重测，盒宽变化随重开自适应）\r
            const uid = this.data.uid;\r
            if (uid) {\r
                const box = document.querySelector('[data-asc-select-uid="' + uid + '"]');\r
                const shellPanel = this.el.closest("[data-overlay]");\r
                if (box && shellPanel) {\r
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";\r
                }\r
            }\r
            // 高亮项滚动跟随（键盘导航可见性；初次打开定位到选中项；列表在面板内现查）\r
            const scrollActive = () => {\r
                const el = this.el.querySelector(\r
                    ".asc-select-option[data-active], .asc-select-option[data-selected]",\r
                );\r
                el?.scrollIntoView?.({ block: "nearest" });\r
            };\r
            setTimeout(scrollActive, 0);\r
            this.watch("activeValue", () => { setTimeout(scrollActive, 0); });\r
        },\r
        unmounted() {\r
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态\r
            this.data.open = false;\r
        },\r
    }\r
  <\/script>\r
  <!-- 过滤框（filterable）：本地过滤输入（P1 简实现——对 label 不区分大小写包含匹配，\r
         过滤词沿链写触发器域，重建 filteredOptions） -->\r
  <div class="asc-select-filter" x-if="filterable">\r
    <input\r
      class="asc-select-filter-input"\r
      type="text"\r
      x-on:input="filterText = $event.target.value"\r
      x-on:keydown="onFilterKeydown($event)"\r
    />\r
  </div>\r
  <!-- 选项列表·普通分支（缺省）：template 形态 x-for（容器内追加空态行） -->\r
  <div class="asc-select-list" x-if="!virtual" x-loading="loading">\r
    <template x-for="option of filteredOptions" :key="option.value">\r
      <div\r
        class="asc-select-option"\r
        x-bind:data-selected="String(option.value) === String(value)"\r
        x-bind:data-active="option.value === activeValue"\r
        x-bind:data-disabled="!!option.disabled"\r
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"\r
      >\r
        <span class="asc-select-option-label" x-text="option.label"></span>\r
        <i class="asc-select-option-check" x-icon="'yes'" x-if="String(option.value) === String(value)"></i>\r
      </div>\r
    </template>\r
    <div\r
      class="asc-select-empty"\r
      x-if="!loading && !(filteredOptions && filteredOptions.length > 0)"\r
      x-text="t('select.empty') === 'select.empty' ? '暂无数据' : t('select.empty')"\r
    ></div>\r
  </div>\r
  <!-- 选项列表·虚拟分支（virtual 开关）：容器形态 x-for.virtual 直接挂列表容器（规范\r
         用法）+ **固定行高 32px 显式声明**（首渲染前无子元素可测，自动检测是鸡生蛋问题\r
         ——规范用法恒显式传 itemHeight，ADR-0022 决策 4）——长列表（>100）只渲染可见窗口，\r
         须加载 autospark.virtual.js（渐进增强；缺席时引擎 warn + 降级全量渲染）。\r
         x-if 分叉包一层避免与 x-for 同元素互斥（结构指令独占宿主） -->\r
  <div class="asc-select-virtual" x-if="virtual">\r
    <div\r
      class="asc-select-list"\r
      x-for.virtual="option of filteredOptions"\r
      :key="option.value"\r
      x-for-options="{ itemHeight: 32 }"\r
      x-loading="loading"\r
    >\r
      <div\r
        class="asc-select-option"\r
        x-bind:data-selected="String(option.value) === String(value)"\r
        x-bind:data-active="option.value === activeValue"\r
        x-bind:data-disabled="!!option.disabled"\r
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"\r
      >\r
        <span class="asc-select-option-label" x-text="option.label"></span>\r
        <i class="asc-select-option-check" x-icon="'yes'" x-if="String(option.value) === String(value)"></i>\r
      </div>\r
    </div>\r
    <div\r
      class="asc-select-empty"\r
      x-if="!loading && !(filteredOptions && filteredOptions.length > 0)"\r
      x-text="t('select.empty') === 'select.empty' ? '暂无数据' : t('select.empty')"\r
    ></div>\r
  </div>\r
</div>\r
`,a=`autospark.select`,o=`autospark-select-panel`,s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;function c(e){e.icons?.add?.(`select-down`,s),e.components[a]=r,e.components[o]=i}l();function l(){e(e=>{c(e)})}};
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

//# sourceMappingURL=autospark.select.js.map
