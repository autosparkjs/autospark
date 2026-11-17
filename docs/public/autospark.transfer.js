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
    autospark.checkbox 复选框（ADR-0019 合批 / ADR-0020 Field 消费契约）——原生增强\r
    路线：真实原生 \`<input type="checkbox">\` + 自绘视觉（勾形 / 半选横线经 CSS 伪元素，\r
    选中态由 :checked / :indeterminate 原生伪类驱动——键盘 / 焦点 / 表单提交 / 组语义等\r
    原生能力全保留，ADR-0018 决策 7）。\r
\r
    值通道（x-model 兼容协议）：宿主 el.value 劫持为布尔语域（"true"/"false"，配\r
    x-model.boolean 保真——state-button 布尔组桥同款）；原生 change 冒泡过宿主时派发\r
    input（x-model 监听在宿主自身回写 state）。checked props 为非受控初值 / 单向同步值\r
    （受控真相走宿主 x-model，input value 同款边界）。\r
\r
    表单提交：内层真 input 即提交载体（勾选提交 name=true、未勾选不提交——原生 checkbox\r
    语义，无须代理，ADR-0020 决策 6）；宿主 name 透传（x-model 缺省注入 name=路径亦经\r
    此通道落内层）。\r
\r
    indeterminate 半选：JS 通道设原生 indeterminate 属性（无 HTML 属性形态），视觉经\r
    :indeterminate 伪类（真实浏览器支持）；点击半选态 → 勾选（原生行为）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-checkbox——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；勾选/半选视觉由原生伪类 +\r
     :has() 驱动，宿主 data-* 状态属性由骨架 / JS 通道同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-checkbox"\r
  x-define="autospark.checkbox"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",            // 兜底文案（默认插槽内容优先；用户传入，无 i18n）\r
            checked: false,       // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 布尔语域桥）\r
            indeterminate: false, // 半选态（JS 通道设原生 indeterminate 属性；点击后按原生行为转为勾选/未勾）\r
        }),\r
        mounted() {\r
            // —— 内层原生控件查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——\r
            const native = () => this.el.querySelector(".asc-checkbox-input");\r
            // 当前勾选缓存（劫持 getter 的控件缺位兜底）\r
            let lastChecked = false;\r
\r
            // —— 原生属性同步：提交值恒 "true"（原生 checkbox 语义：勾选提交 name=true、\r
            //     未勾选不提交）；宿主 name 透传（x-model 缺省注入 name=路径同经此落内层）——\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                n.value = "true";\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false" ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）\r
            const prior = this.el.value;\r
            lastChecked = typeof prior === "string" && prior !== ""\r
                ? prior === "true"\r
                : !!this.data.checked;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const n = native();\r
                    return String(!!(n ? n.checked : lastChecked));\r
                },\r
                set: (v) => {\r
                    lastChecked = v === true || v === "true";\r
                    const n = native();\r
                    if (n) n.checked = lastChecked;\r
                },\r
                configurable: true,\r
            });\r
\r
            // —— DOM→state 桥：原生 change 冒泡过宿主 → 派发 input（x-model 监听在宿主\r
            //     自身，读劫持 el.value 回写；state-button 同款非冒泡形态）。原生 change\r
            //     继续冒泡，外层 @change 直接消费；仅认内层控件事件（宿主自身 change 直通）\r
            this.el.addEventListener("change", (e) => {\r
                if (e.target !== native()) return;\r
                const n = native();\r
                if (n) lastChecked = n.checked;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——\r
            setTimeout(() => {\r
                const n = native();\r
                if (n) {\r
                    n.checked = lastChecked;\r
                    n.indeterminate = !!this.data.indeterminate;\r
                }\r
                syncAttrs();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，解构取值——家族惯用法）——\r
            // checked 单向同步（无 x-model 场景）：变化才写（程序赋值不触发原生事件，无回环）。\r
            // 已见值比对幂等防御：scope.refresh 等机制会以**当前值**重跑监听（如 i18n 插件\r
            // ready 的首渲染换血），无变化重跑若照常落盘，会把 x-model expando 注入的勾选\r
            // 初值打回 props 缺省值 false——同值跳过（真实变化才推进）\r
            let lastPropsChecked = !!this.data.checked;\r
            this.watch("checked", ({ value }) => {\r
                const v = !!value;\r
                if (v === lastPropsChecked) return;\r
                lastPropsChecked = v;\r
                lastChecked = v;\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
            });\r
            // indeterminate：JS 通道设原生属性（该属性无 HTML 属性形态，纯 property）\r
            this.watch("indeterminate", ({ value }) => {\r
                const n = native();\r
                if (n) n.indeterminate = !!value;\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-checkbox">\r
    /* ---------- 结构：真实 label 包裹（点击文字/盒子任一处原生切换 + 焦点转发），\r
         内层原生 input 透明铺满盒子（点击命中区 = 盒子，键盘焦点承载者） ---------- */\r
    .asc-checkbox-wrap {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.45em;\r
      cursor: pointer;\r
    }\r
    /* 盒子：裸态控件无 chrome，仅自有细边框（ADR-0020 决策 3）；尺寸 em 基准随主题\r
       data-size 档位字号缩放（不设自有尺寸属性，button 同范式 ADR-0012） */\r
    .asc-checkbox-box {\r
      position: relative;\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      box-sizing: border-box;\r
      width: 1.15em;\r
      height: 1.15em;\r
      border: var(--auto-border-size, var(--asc-checkbox-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-checkbox-border, #d9d9d9));\r
      border-radius: var(--asc-checkbox-radius, 0.25em);\r
      background: var(--auto-bgcolor, var(--asc-checkbox-bg, #ffffff));\r
      transition:\r
        background-color 0.15s ease,\r
        border-color 0.15s ease,\r
        box-shadow 0.15s ease;\r
    }\r
    .asc-checkbox-input {\r
      position: absolute;\r
      inset: 0;\r
      width: 100%;\r
      height: 100%;\r
      margin: 0;\r
      padding: 0;\r
      border: none;\r
      opacity: 0;\r
      cursor: inherit;\r
    }\r
\r
    /* ---------- 状态色（骨架通道）：status 在场边框染 tone（裸态控件只消费 tone 不吃 chrome）；\r
             勾选 / 半选底色恒 tone（缺省主色，error/success/warning 随动——开态语义色联动） ---------- */\r
    .asc-checkbox[data-status] .asc-checkbox-box {\r
      border-color: var(--asc-field-tone);\r
    }\r
    .asc-checkbox-box:has(> .asc-checkbox-input:checked),\r
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate) {\r
      background: var(--asc-field-tone);\r
      border-color: var(--asc-field-tone);\r
    }\r
\r
    /* ---------- 勾形（::before 两边框旋转，勾选态 scale 展开）与半选横线（::after） ---------- */\r
    .asc-checkbox-box::before {\r
      content: "";\r
      width: 0.28em;\r
      height: 0.58em;\r
      border-right: 0.14em solid\r
        var(--asc-checkbox-check, #ffffff);\r
      border-bottom: 0.14em solid\r
        var(--asc-checkbox-check, #ffffff);\r
      margin-top: -0.12em;\r
      transform: rotate(45deg) scale(0);\r
      transition: transform 0.15s ease;\r
    }\r
    .asc-checkbox-box:has(> .asc-checkbox-input:checked)::before {\r
      transform: rotate(45deg) scale(1);\r
    }\r
    .asc-checkbox-box::after {\r
      content: "";\r
      position: absolute;\r
      width: 0.55em;\r
      height: 0;\r
      border-top: 0.14em solid var(--asc-checkbox-check, #ffffff);\r
      opacity: 0;\r
      transition: opacity 0.15s ease;\r
    }\r
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::after {\r
      opacity: 1;\r
    }\r
    /* 半选与勾选并置时半选视觉优先（原生呈现惯例：indeterminate 覆盖 checked 勾形） */\r
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::before {\r
      transform: rotate(45deg) scale(0);\r
    }\r
\r
    /* ---------- 交互态 ---------- */\r
    .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)) {\r
      border-color: var(--auto-hover-border-color, var(--asc-checkbox-hover-border, #4098fc));\r
    }\r
    /* 键盘焦点环（data-focus 由骨架 focusin/focusout 同步——鼠标点击聚焦亦点亮，\r
         与盒饰类控件的焦点语义一致）；禁用不点环 */\r
    .asc-checkbox[data-focus]:not([data-disabled]) .asc-checkbox-box {\r
      border-color: var(--asc-field-tone);\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（勾选 tone 保留可辨）+ 禁点光标 */\r
    .asc-checkbox[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-checkbox[data-disabled] .asc-checkbox-wrap {\r
      cursor: not-allowed;\r
    }\r
\r
    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */\r
    .asc-checkbox-label:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-checkbox-box,\r
    [data-dark] .asc-checkbox-box {\r
      border-color: var(--auto-border-color, var(--asc-checkbox-border, #52525b));\r
      background: var(--auto-bgcolor, var(--asc-checkbox-bg, #3a3a3a));\r
    }\r
    [dark] .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)),\r
    [data-dark] .asc-checkbox-wrap:hover .asc-checkbox-box:not(:has(> .asc-checkbox-input:checked)):not(:has(> .asc-checkbox-input:disabled)) {\r
      border-color: var(--auto-hover-border-color, var(--asc-checkbox-hover-border, #4098fc));\r
    }\r
  </style>\r
  <!-- 默认段（替换 field 出口 fallback）：label 包裹的真实 checkbox + 自绘盒子 + 文案。\r
         勾形/半选视觉由原生伪类 :checked/:indeterminate 经 :has() 驱动（真实浏览器支持）。\r
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056 内容分段仅认直接子级）——\r
         消费者内容经 field 出口整段替换控件区（逃生通道，input 同款语义），\r
         故文案走 props（{{ label }} 插值兜底）不开真插槽 -->\r
  <label class="asc-checkbox-wrap">\r
    <span class="asc-checkbox-box">\r
      <input type="checkbox" class="asc-checkbox-input" data-autospark-control />\r
    </span>\r
    <span class="asc-checkbox-label">{{ label }}</span>\r
  </label>\r
</span>\r
`,i=`autospark.checkbox`;function a(e){e.components[i]=r}o();function o(){e(e=>{a(e)})}var s=`<!--
    autospark.transfer 穿梭框（ADR-0028）——双列表（源/目标）+ 中间穿梭钮复合控件。

    内部装配（ADR-0018 决策 2「内部装配、对外开箱」，取舍见 ADR-0028）：
    - 列表区**复制** list 结构（非嵌套消费）：视觉同源经 CSS 变量达成（边框/圆角/行距/
      hover 同档），结构四段（头部全选 + 过滤框 + 滚动体 + 底部计数）与 list 单段行容器
      不同构（ADR-0028 决策 1）；
    - 复选项**组合** autospark.checkbox（table 行选择先例直承）：checked props 绑定
      pickedKeys.includes（**整体替换驱动全行重求值**），@change 事件通道回写选中集；
      头部全选额外消费 indeterminate 半选（ADR-0028 决策 2/4）；
    - 穿梭钮自绘原生 button（button 同档 chrome + 亮度反馈，组合 autospark.button 的
      props 接线收益为负，ADR-0028 决策 4 备选节）。

    值桥（x-model 兼容协议，ADR-0028 决策 3）：宿主 el.value 劫持为**数组语域**（目标侧
    key 数组，value 顺序恒为 data 声明序——canonical 重建）；穿梭路径派发 input（非冒泡，
    x-model 回写）+ change（冒泡 detail={ value }，外层消费）；内嵌 input[type=hidden]
    载体 value = key 逗号拼接（表单提交字符串域）、name 透传（元素名形态折叠 props /
    值对象形态宿主属性双通道，props 优先）、禁用出表。

    选中集单集制（ADR-0028 决策 4）：pickedKeys 跨两侧共用（key 任一时刻只在一侧）；
    全选作用于当前过滤视图的可用项；canRight/canLeft 由「选中集 ∩ 侧全集（跨过滤
    维度）」派生——过滤词不清选中集（antd 同款语义）。

    items/value 变更通道：props 为调用方状态**引用**注入——整体替换驱动重渲；原地
    增删不发信号（autostore 跨域边界，文档披露）。
-->
<!-- 继承 autospark.base（ADR-0134）：主题档位六键自动获得；transfer 是复合控件不继承
     field（无盒饰/焦点环语义面，disabled 自持，ADR-0028 决策 2）；data-disabled
     由 mounted JS 通道同步，根上无动态绑定（T4=B） -->
<div class="asc-transfer" x-define="autospark.transfer" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            data: [],        // 数据源 [{ key, label, disabled? }]（经状态引用注入——字面量数组触发 props 更新死循环，ADR-0019 后果 2）
            value: [],       // 目标侧 key 数组（非受控初值 / 单向同步值；受控真相走宿主 x-model——el.value 数组语域桥）
            titles: [],      // 双列表标题 [源标题, 目标题]（缺省无标题）
            filterable: false, // 本地搜索（每侧独立过滤框，label 不区分大小写包含匹配）
            disabled: false, // 整体禁用（选中/穿梭/搜索全阻断 + 载体出表）
            name: "",        // 表单提交名（元素名形态经属性折叠为 props；值对象形态走宿主 name 属性——props 优先）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            sourceItems: [],   // 源侧全集（data 按 value 划分）
            targetItems: [],   // 目标侧全集
            sourceView: [],    // 源侧过滤视图（行渲染数据源）
            targetView: [],    // 目标侧过滤视图
            sourceFilter: "",  // 源侧过滤词（过滤框写回；关闭不清——过滤词非开合态）
            targetFilter: "",  // 目标侧过滤词
            pickedKeys: [],    // 选中集（字符串归一 key，跨两侧共用单集制；整体替换驱动全行重求值）
            sourceAll: false,  // 源侧全选态（按过滤视图可用项派生）
            sourceHalf: false, // 源侧半选态
            targetAll: false,  // 目标侧全选态
            targetHalf: false, // 目标侧半选态
            canRight: false,   // 穿梭钮态：选中集 ∩ 源侧非空且未禁用
            canLeft: false,    // 穿梭钮态：选中集 ∩ 目标侧非空且未禁用
        }),
        methods: {
            // 数据源归一（props 晚注入/异常形态防御）
            items() {
                return Array.isArray(this.data.data) ? this.data.data : [];
            },
            // 值数组归一
            valueKeys() {
                return Array.isArray(this.data.value) ? this.data.value : [];
            },
            // 全量重建：按 value 划分两侧 + 过滤视图 + 选中派生态（幂等，一切变更的收口）
            rebuild() {
                const valSet = new Set(this.valueKeys().map((k) => String(k)));
                const src = [];
                const tgt = [];
                for (const it of this.items()) {
                    if (it == null) continue;
                    (valSet.has(String(it.key)) ? tgt : src).push(it);
                }
                this.data.sourceItems = src;
                this.data.targetItems = tgt;
                const kwS = String(this.data.sourceFilter ?? "").trim().toLowerCase();
                const kwT = String(this.data.targetFilter ?? "").trim().toLowerCase();
                this.data.sourceView = kwS === ""
                    ? src
                    : src.filter((i) => String(i.label ?? "").toLowerCase().includes(kwS));
                this.data.targetView = kwT === ""
                    ? tgt
                    : tgt.filter((i) => String(i.label ?? "").toLowerCase().includes(kwT));
                this.syncSelection();
            },
            // 选中派生态：选中集合法化（剔除不在 data 的 key）+ 全选/半选 + 穿梭钮联动
            syncSelection() {
                const valid = new Set(this.items().map((i) => String(i?.key)));
                const pickedArr = [...new Set((this.data.pickedKeys ?? []).map(String))]
                    .filter((k) => valid.has(k));
                if (pickedArr.length !== (this.data.pickedKeys ?? []).length) {
                    this.data.pickedKeys = pickedArr;
                }
                const pickSet = new Set(pickedArr);
                // 全选/半选：按过滤视图可用项（disabled 项跳过）
                const calc = (view) => {
                    const enabled = (view ?? []).filter((i) => i && !i.disabled);
                    const n = enabled.filter((i) => pickSet.has(String(i.key))).length;
                    return [enabled.length > 0 && n === enabled.length, n > 0 && n < enabled.length];
                };
                const [sa, sh] = calc(this.data.sourceView);
                this.data.sourceAll = sa;
                this.data.sourceHalf = sh;
                const [ta, th] = calc(this.data.targetView);
                this.data.targetAll = ta;
                this.data.targetHalf = th;
                // 穿梭钮联动：选中集 ∩ 侧全集（跨过滤维度——被过滤隐藏的选中仍可穿梭）
                const srcKeys = new Set((this.data.sourceItems ?? []).map((i) => String(i.key)));
                const tgtKeys = new Set((this.data.targetItems ?? []).map((i) => String(i.key)));
                const dis = !!this.data.disabled;
                this.data.canRight = !dis && pickedArr.some((k) => srcKeys.has(k));
                this.data.canLeft = !dis && pickedArr.some((k) => tgtKeys.has(k));
            },
            // 行勾选切换（checkbox @change 与行点击汇聚点；disabled 项 guard）。
            //     原生 change 在此拦截不外泄（外层 @change 只应收到本组件 detail={value} 派发）
            togglePick(key, event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                if (this.data.disabled) return;
                const k = String(key);
                const it = this.items().find((i) => i && String(i.key) === k);
                if (!it || it.disabled) return;
                const picked = this.data.pickedKeys ?? [];
                this.data.pickedKeys = picked.includes(k)
                    ? picked.filter((x) => x !== k)
                    : [...picked, k];
                this.syncSelection();
            },
            // 行点击切换（点行文字与点 checkbox 等价；checkbox 区内点击自理不双触发）
            onRowClick(item, event) {
                if (event && event.target instanceof Element && event.target.closest(".asc-checkbox")) return;
                if (!item || item.disabled) return;
                this.togglePick(item.key);
            },
            // 头部全选切换（作用于当前过滤视图可用项；半选态点击 → 全选，原生行为对齐；
            //     原生 change 同样拦截不外泄）
            onToggleSourceAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.sourceView);
            },
            onToggleTargetAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.targetView);
            },
            // 过滤框输入（原生 input 在此拦截不外泄——宿主 x-model 监听 input，原生冒泡
            //     会触发无谓回读）
            onSourceFilterInput(event) {
                this.data.sourceFilter = event?.target?.value ?? "";
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
            },
            onTargetFilterInput(event) {
                this.data.targetFilter = event?.target?.value ?? "";
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
            },
            toggleAll(view) {
                if (this.data.disabled) return;
                const keys = (view ?? [])
                    .filter((i) => i && !i.disabled)
                    .map((i) => String(i.key));
                if (keys.length === 0) return;
                const picked = new Set(this.data.pickedKeys ?? []);
                const all = keys.every((k) => picked.has(k));
                for (const k of keys) {
                    if (all) picked.delete(k);
                    else picked.add(k);
                }
                this.data.pickedKeys = [...picked];
                this.syncSelection();
            },
            // 穿梭（dir: "right" 移入目标 / "left" 移回源）：选中集 ∩ 侧并入/剔除 +
            // canonical 重建（value 顺序恒为 data 声明序）+ 仅清移动侧选中 + 双派发
            moveRight() { this.moveTo("right"); },
            moveLeft() { this.moveTo("left"); },
            moveTo(dir) {
                if (this.data.disabled) return;
                const picked = new Set((this.data.pickedKeys ?? []).map(String));
                if (picked.size === 0) return;
                const sideKeys = new Set(
                    (dir === "right" ? this.data.sourceItems : this.data.targetItems)
                        .map((i) => String(i.key)),
                );
                const valSet = new Set(this.valueKeys().map((k) => String(k)));
                let moved = false;
                for (const k of picked) {
                    if (!sideKeys.has(k)) continue;
                    if (dir === "right") valSet.add(k);
                    else valSet.delete(k);
                    moved = true;
                }
                if (!moved) return;
                this.data.value = this.items()
                    .filter((i) => i != null && valSet.has(String(i.key)))
                    .map((i) => i.key);
                this.data.pickedKeys = [...picked].filter((k) => !sideKeys.has(k));
                this.rebuild();
                this.syncCarrier();
                this.emitChange();
            },
            // 表单载体同步（value 逗号拼接字符串域 + 禁用出表）
            syncCarrier() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                c.value = this.valueKeys().map((k) => String(k)).join(",");
                c.disabled = !!this.data.disabled;
            },
            // 提交名同步（props.name 优先，回退宿主属性——元素名/值对象双形态通道）
            syncName() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            // 可交互同步：宿主禁用反射 + 载体 + 穿梭钮派生态
            syncInteractive() {
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                this.syncCarrier();
                this.syncSelection();
            },
            // 值变更出口：input 非冒泡（x-model 监听在宿主自身，checkbox/select 同款）+
            // change 冒泡 detail={ value }（外层消费）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
        },
        mounted() {
            // —— 值桥（x-model 兼容协议，ADR-0028 决策 3）：宿主 el.value 劫持为数组语域 ——
            //     x-model 对 text-like 控件的 state→DOM 写入恒 String() 归一（引擎语义，
            //     ADR-0023 决策 1 同族）——数组经 x-model 通道往返呈逗号拼接字符串形态，
            //     桥须双向兼容：setter 解析逗号串（key 域约束：不含逗号——hidden 载体
            //     提交本就是逗号拼接域，约束一致）；劫持前快照 expando（x-model 编译期
            //     可能已写初值）；无 x-model 时回退 props.value 初值（快照序：
            //     expando > props.value，input 同款）
            const toArr = (v) => {
                if (Array.isArray(v)) return v;
                if (v == null || v === "") return [];
                if (typeof v === "string") return v.split(",").filter((k) => k !== "");
                return [v];
            };
            const prior = this.el.value;
            const initV = prior !== undefined && prior !== null ? toArr(prior) : this.valueKeys();
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => (Array.isArray(self.data.value) ? self.data.value : []),
                set: (v) => {
                    const arr = toArr(v);
                    if (arr === self.data.value) return; // 引用等值（x-model 回写环守卫）
                    self.data.value = arr;
                    self.rebuild();
                },
                configurable: true,
            });
            this.data.value = initV;

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                this.syncName();
                this.rebuild();
                this.syncInteractive();
            }, 0);

            // —— props / 内部状态跟随（回调收 { value } 信封对象，此处只用作触发信号，
            //     家族惯用法）——
            this.watch("data", () => { setTimeout(() => this.rebuild(), 0); });
            this.watch("value", () => { this.rebuild(); this.syncCarrier(); });
            this.watch("sourceFilter", () => { this.rebuild(); });
            this.watch("targetFilter", () => { this.rebuild(); });
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });
            this.watch("name", () => { this.syncName(); });
        },
    }
  <\/script>
  <style global id="autospark-components-transfer">
    /* ---------- 宿主：块级满宽复合控件（非盒饰单控件，继承 autospark.base 取主题档位）；
             字号 em 基准随 data-size 档位缩放 ---------- */
    .asc-transfer {
      display: flex;
      align-items: center;
      gap: 0.75em;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-transfer-font-size, 0.875rem));
    }
    /* 禁用：整体淡化 + 行/钮禁点（各元素 cursor 自理） */
    .asc-transfer[data-disabled] {
      opacity: 0.55;
    }

    /* ---------- 列表盒：与 list 同源（边框/圆角/底色/行距，视觉对齐用户硬性要求）；
             定高 + 滚动体 ---------- */
    .asc-transfer-list {
      --asc-line: var(--auto-border-color, var(--asc-transfer-border-color, #d9d9d9));
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      flex: 1 1 0;
      min-width: 10em;
      height: var(--asc-transfer-height, 17em);
      background: var(--auto-bgcolor, var(--asc-transfer-bg, #ffffff));
      border: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-transfer-radius, 0.5rem));
      overflow: hidden;
    }

    /* ---------- 头部：全选 checkbox + 标题 ---------- */
    .asc-transfer-header {
      flex: none;
      display: flex;
      align-items: center;
      gap: 0.5em;
      padding: 0.55em 0.85em;
      border-bottom: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-transfer-title {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
      color: var(--auto-color, var(--asc-transfer-color, #333333));
    }
    .asc-transfer-title:empty {
      display: none;
    }

    /* ---------- 过滤框（filterable）：裸 input 复制（input-number 复制先例，ADR-0028） ---------- */
    .asc-transfer-search {
      flex: none;
      padding: 0.4em 0.6em;
      border-bottom: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid
        var(--asc-line);
    }
    .asc-transfer-search-input {
      box-sizing: border-box;
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0.25em 0.1em;
      color: inherit;
      font: inherit;
      border-bottom: 1px solid transparent;
    }
    .asc-transfer-search-input:focus {
      border-bottom-color: var(--auto-primary-color, var(--asc-transfer-primary, #009aff));
    }
    .asc-transfer-search-input::placeholder {
      color: var(--auto-input-placeholder, var(--asc-transfer-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-transfer[data-disabled] .asc-transfer-search-input {
      cursor: not-allowed;
    }

    /* ---------- 体：滚动窗口 ---------- */
    .asc-transfer-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    /* ---------- 行：checkbox + 文案；hover 同 list 档（淡底轻反馈） ---------- */
    .asc-transfer-item {
      display: flex;
      align-items: center;
      gap: 0.5em;
      min-height: 2.2em;
      padding: 0.35em 0.85em;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .asc-transfer-item:hover {
      background: var(
        --auto-hover-bgcolor,
        var(--asc-transfer-item-hover-bg, rgba(0, 0, 0, 0.045))
      );
    }
    .asc-transfer-item[data-disabled] {
      cursor: not-allowed;
    }
    .asc-transfer-item[data-disabled]:hover {
      background: transparent;
    }
    .asc-transfer-item-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-transfer-color, #606060));
    }
    .asc-transfer-item[data-disabled] .asc-transfer-item-label {
      color: var(--auto-disable-color, var(--asc-transfer-item-disable, rgba(0, 0, 0, 0.28)));
    }

    /* ---------- 空态（含过滤无匹配） ---------- */
    .asc-transfer-empty {
      padding: 1.2em 0.85em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-transfer-empty, rgba(0, 0, 0, 0.35)));
    }

    /* ---------- 底部计数「N / M 项」 ---------- */
    .asc-transfer-footer {
      flex: none;
      padding: 0.45em 0.85em;
      border-top: var(--auto-border-size, var(--asc-transfer-border-size, 1px)) solid
        var(--asc-line);
      color: var(--auto-third-color, var(--asc-transfer-footer, rgba(0, 0, 0, 0.45)));
      font-size: 0.9em;
    }

    /* ---------- 穿梭钮：与 button 同档（default 形态 chrome + 亮度反馈 + 禁用淡化）；
             :disabled 由 canRight/canLeft 绑定驱动（选中集联动，用户硬性要求） ---------- */
    .asc-transfer-actions {
      flex: none;
      display: flex;
      flex-direction: column;
      gap: 0.5em;
    }
    .asc-transfer-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 2.2em;
      height: 2.2em;
      padding: 0;
      border: var(--auto-border-size, var(--asc-transfer-btn-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-transfer-btn-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-transfer-btn-radius, 0.5rem));
      background: var(--auto-bgcolor, var(--asc-transfer-btn-bg, #ffffff));
      color: var(--auto-color, var(--asc-transfer-btn-color, #606060));
      font: inherit;
      cursor: pointer;
      user-select: none;
      transition: filter 0.15s ease;
    }
    .asc-transfer-btn svg {
      width: 1em;
      height: 1em;
    }
    .asc-transfer-btn:hover:not([disabled]) {
      filter: brightness(0.96);
    }
    .asc-transfer-btn:active:not([disabled]) {
      filter: brightness(0.9);
    }
    .asc-transfer-btn[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-transfer-list,
    [data-dark] .asc-transfer-list {
      --asc-line: var(--auto-border-color, var(--asc-transfer-border-color, #52525b));
      background: var(--auto-bgcolor, var(--asc-transfer-bg, #3a3a3a));
    }
    [dark] .asc-transfer-title,
    [data-dark] .asc-transfer-title {
      color: var(--auto-color, var(--asc-transfer-color, #fafafa));
    }
    [dark] .asc-transfer-search-input::placeholder,
    [data-dark] .asc-transfer-search-input::placeholder {
      color: var(
        --auto-input-placeholder,
        var(--asc-transfer-placeholder, rgba(255, 255, 255, 0.4))
      );
    }
    [dark] .asc-transfer-item:hover,
    [data-dark] .asc-transfer-item:hover {
      background: var(
        --auto-hover-bgcolor,
        var(--asc-transfer-item-hover-bg, rgba(255, 255, 255, 0.08))
      );
    }
    [dark] .asc-transfer-item-label,
    [data-dark] .asc-transfer-item-label {
      color: var(--auto-color, var(--asc-transfer-color, #fafafa));
    }
    [dark] .asc-transfer-item[data-disabled] .asc-transfer-item-label,
    [data-dark] .asc-transfer-item[data-disabled] .asc-transfer-item-label {
      color: var(--auto-disable-color, var(--asc-transfer-item-disable, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-transfer-empty,
    [data-dark] .asc-transfer-empty {
      color: var(--auto-third-color, var(--asc-transfer-empty, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-transfer-footer,
    [data-dark] .asc-transfer-footer {
      color: var(--auto-third-color, var(--asc-transfer-footer, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-transfer-btn,
    [data-dark] .asc-transfer-btn {
      border-color: var(--auto-border-color, var(--asc-transfer-btn-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-transfer-btn-bg, #3a3a3a));
      color: var(--auto-color, var(--asc-transfer-btn-color, #fafafa));
    }
  </style>
  <!-- 表单载体（hidden——提交值 = key 逗号拼接字符串域，禁用出表由 JS 同步） -->
  <input type="hidden" class="asc-transfer-carrier" />
  <!-- 源列表（data 划分左侧）：行模板 = template 形态 x-for（克隆体禁 x-if / 宿主绑定
         不编译——行绑定全部落克隆体内层元素，家族纪律） -->
  <div class="asc-transfer-list">
    <div class="asc-transfer-header">
      <span
        class="asc-transfer-check"
        x-component:autospark.checkbox="{ checked: sourceAll, indeterminate: sourceHalf, disabled: disabled }"
        @change="onToggleSourceAll($event)"
      ></span>
      <span class="asc-transfer-title" x-text="(titles && titles[0]) || ''"></span>
    </div>
    <div class="asc-transfer-search" x-if="filterable">
      <input
        class="asc-transfer-search-input"
        type="text"
        :placeholder="t('transfer.search') === 'transfer.search' ? '请输入搜索内容' : t('transfer.search')"
        x-on:input="onSourceFilterInput($event)"
      />
    </div>
    <div class="asc-transfer-body">
      <template x-for="item of sourceView" :key="item.key">
        <div
          class="asc-transfer-item"
          :data-disabled="!!item.disabled"
          @click="onRowClick(item, $event)"
        >
          <span
            class="asc-transfer-item-check"
            x-component:autospark.checkbox="{ checked: pickedKeys.includes(String(item.key)), disabled: disabled || !!item.disabled }"
            @change="togglePick(item.key, $event)"
          ></span>
          <span class="asc-transfer-item-label" x-text="item.label"></span>
        </div>
      </template>
      <div
        class="asc-transfer-empty"
        x-if="!(sourceView && sourceView.length > 0)"
        x-text="t('transfer.empty') === 'transfer.empty' ? '暂无数据' : t('transfer.empty')"
      ></div>
    </div>
    <div class="asc-transfer-footer">
      <span
        x-text="sourceItems.length + ' / ' + data.length + (t('transfer.total') === 'transfer.total' ? ' 项' : ' ' + t('transfer.total'))"
      ></span>
    </div>
  </div>
  <!-- 穿梭钮（自绘原生 button，button 同档视觉；:disabled 由选中集联动派生态驱动） -->
  <div class="asc-transfer-actions">
    <button
      type="button"
      class="asc-transfer-btn"
      :disabled="!canRight"
      @click="moveRight()"
      aria-label="移入目标"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
    <button
      type="button"
      class="asc-transfer-btn"
      :disabled="!canLeft"
      @click="moveLeft()"
      aria-label="移回源"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  </div>
  <!-- 目标列表（value 侧）：与源列表镜像（标题 titles[1] / 过滤词 targetFilter /
         视图 targetView / 全选 targetAll） -->
  <div class="asc-transfer-list">
    <div class="asc-transfer-header">
      <span
        class="asc-transfer-check"
        x-component:autospark.checkbox="{ checked: targetAll, indeterminate: targetHalf, disabled: disabled }"
        @change="onToggleTargetAll($event)"
      ></span>
      <span class="asc-transfer-title" x-text="(titles && titles[1]) || ''"></span>
    </div>
    <div class="asc-transfer-search" x-if="filterable">
      <input
        class="asc-transfer-search-input"
        type="text"
        :placeholder="t('transfer.search') === 'transfer.search' ? '请输入搜索内容' : t('transfer.search')"
        x-on:input="onTargetFilterInput($event)"
      />
    </div>
    <div class="asc-transfer-body">
      <template x-for="item of targetView" :key="item.key">
        <div
          class="asc-transfer-item"
          :data-disabled="!!item.disabled"
          @click="onRowClick(item, $event)"
        >
          <span
            class="asc-transfer-item-check"
            x-component:autospark.checkbox="{ checked: pickedKeys.includes(String(item.key)), disabled: disabled || !!item.disabled }"
            @change="togglePick(item.key, $event)"
          ></span>
          <span class="asc-transfer-item-label" x-text="item.label"></span>
        </div>
      </template>
      <div
        class="asc-transfer-empty"
        x-if="!(targetView && targetView.length > 0)"
        x-text="t('transfer.empty') === 'transfer.empty' ? '暂无数据' : t('transfer.empty')"
      ></div>
    </div>
    <div class="asc-transfer-footer">
      <span
        x-text="targetItems.length + ' / ' + data.length + (t('transfer.total') === 'transfer.total' ? ' 项' : ' ' + t('transfer.total'))"
      ></span>
    </div>
  </div>
</div>
`,c=`autospark.transfer`;function l(e){e.components[c]=s}u();function u(){e(e=>{l(e)})}};
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

//# sourceMappingURL=autospark.transfer.js.map
