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
      padding: calc(\r
          var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2\r
        )\r
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
      /* 内侧分隔线（钮↔钮、钮↔控件）与盒边框同色（--asc-field-line 共享线，随\r
         hover/focus/status/disabled 状态同步染——2026-11-17 回归：variant 缺省\r
         secondary 的半透明衬底（叠盒底成浅罩）已保证与线色的对比，此前「暗色\r
         湮灭」前提（plain 实底与盒线同色）不复存在，独立 divider 分档退役）；\r
         上下线不画（单线让位） */\r
      border-color: var(--asc-field-line);\r
      border-top-width: 0;\r
      border-bottom-width: 0;\r
      border-radius: 0;\r
      align-self: stretch;\r
      margin-block: calc(\r
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2\r
      );\r
    }\r
    /* 外侧竖线让位盒线（首钮左 / 尾钮右不画——盒线独享整圈外框，同上下线单线让位\r
       哲学：防按钮线与状态染色的盒线在贴边处双色并排） */\r
    .asc-field-box .asc-field-actions-before .asc-field-action:first-of-type {\r
      border-left-width: 0;\r
    }\r
    .asc-field-box .asc-field-actions-after .asc-field-action:last-of-type {\r
      border-right-width: 0;\r
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
       值 = Object.assign 全键透传项（默认 variant: 'secondary' 打底——项显式\r
       variant 胜；button props 全集 + disabled 与 field 联动合并，自有键\r
       pos/name/value 入 button data 域被忽略无害）；按钮宿主自动标\r
       data-autospark-action（点击自理）；x-for 值表达式 = 官方 filter 形态\r
       （引擎 x-for 测试覆盖，with 求值通道响应 actions 注入） -->\r
  <span\r
    class="asc-field-actions asc-field-actions-before"\r
    x-if="!!(actions && actions.length)"\r
  >\r
    <template x-for="item of actions.filter(a => a && a.pos === 'before')">\r
      <span\r
        class="asc-field-action"\r
        data-autospark-action\r
        x-component:autospark.button="Object.assign({ variant: 'secondary' }, item, { disabled: item.disabled || !!disabled })"\r
      ></span>\r
    </template>\r
  </span>\r
  <template class="asc-field-prefix" x-slot:prefix></template>\r
  <span class="asc-field-body" x-slot></span>\r
  <template class="asc-field-suffix" x-slot:suffix></template>\r
  <span\r
    class="asc-field-actions asc-field-actions-after"\r
    x-if="!!(actions && actions.length)"\r
  >\r
    <template x-for="item of actions.filter(a => !a || a.pos !== 'before')">\r
      <span\r
        class="asc-field-action"\r
        data-autospark-action\r
        x-component:autospark.button="Object.assign({ variant: 'secondary' }, item, { disabled: item.disabled || !!disabled })"\r
      ></span>\r
    </template>\r
  </span>\r
</span>\r
`}n();function n(){e(e=>{t(e)})}var r=`<!--
    autospark.date-picker 日期选择器（ADR-0025）——触发器组件：Field 盒饰形态
    （.asc-field-box，input/select 同款 chrome）+ 选中值展示 + 日历图标。日历面板
    不自建弹层，复用 x-popover 指令机制呈现（trigger:click 形态——点击切换 / 面板
    外点击 / ESC 关闭均机制继承，ADR-0060）：内层触发器元素即 popover 宿主，面板组件
    autospark-date-picker-panel（同插件注册，panel.html）渲染进 body 覆盖物容器；
    日历面板宽度由内容自定（不用 fit——触发器常窄于面板，bottom-start 左对齐）。

    面板 ↔ 触发器通信走 scope 链（零 DOM 事件、零 uid 配对）：面板经聚合视图沿链读写
    本组件 data 域——读 days/weekdayLabels/headerText/activeValue 等呈现，写哨兵键
    （pickTick/pickValue 日格点击与今天快捷、monthTick/monthDelta 月份切换）回传交互；
    面板 mounted/unmounted 沿链写 open 开合态（图标染色 / aria-expanded / 视图归位）。

    值桥（x-model 兼容协议，"YYYY-MM-DD" 字符串语域，对齐 ADR-0020/0022）：宿主
    el.value 劫持 ↔ data.value；选中 / 清除路径手动派发 input（非冒泡，x-model 宿主
    监听回写 state）+ change（冒泡，detail = { value }，外层消费）；内嵌
    input[type=hidden] 表单载体（name 透传，原生直提交）。

    键盘（触发器焦点，按简实现）：Left/Right/Up/Down 日间漫游（±1/±7 天，Date 滚动
    自然跨月——越月时视图跟随）/ PageUp/PageDown 切月 / Enter 确认（未开先开）/
    ESC 与 Tab 不拦截（ESC 归 popover 打开栈——机制继承；Tab 自然移焦）。

    i18n 四键（ADR-0025 键设计：词典数组值 = 复数模式，列表类文案用单键逗号串）：
    date-picker.placeholder（占位）/ weekdays（星期表头，逗号串 split）/
    month-format（"{y}年{m}月" 插值）/ today（今天快捷钮）——未装 i18n 或无键时
    回退硬编码中文；语言切换以下次开面板生效为界（syncOpen 重算）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-date-picker + .asc-field-box 盒饰选配，
     ADR-0020 消费契约）；data-open / data-has-value 由 mounted JS 通道同步，根上无
     动态绑定（T4=B） -->
<span
  class="asc-date-picker asc-field-box"
  x-define="autospark.date-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",       // 当前值（"YYYY-MM-DD" 字符串语域，""=空；受控真相走宿主 x-model——el.value 桥）
            placeholder: "", // 占位文案（空时走 i18n 词典 date-picker.placeholder 键，回退「请选择日期」）
            clearable: false, // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）
            name: "",        // 表单载体名（元素名写法下 name 属性折叠为 props——与宿主属性双通道，mounted 合取）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            hasValue: false,       // 当前有值（清除钮可见性 / 占位切换）
            open: false,           // 面板开合态（面板 mounted/unmounted 沿链写回；图标染色/aria/视图归位驱动）
            viewYear: 0,           // 日历视图年（打开时归位到值所在月，无值落当月）
            viewMonth: 0,          // 日历视图月（0 基，Date 语义）
            days: [],              // 日格数据（42 格扁平数组——单层 x-for 规避嵌套 x-for 晚一跳边界；CSS grid 七列自然分行）
            weekdayLabels: [],     // 星期表头（i18n date-picker.weekdays 逗号串 split 产物）
            headerText: "",        // 年月标题（i18n date-picker.month-format 插值产物）
            todayValue: "",        // 今天快捷钮携带值（"YYYY-MM-DD"，mounted/on open 重算）
            todayText: "今天",     // 今天快捷钮文案（i18n date-picker.today）
            activeValue: "",       // 键盘高亮日（"YYYY-MM-DD" 字符串通道——免疫日格数组重建，面板 :data-active 比较基准）
            pickTick: 0,           // 选中哨兵（日格点击/今天快捷钮写：自增必变免疫同值去重；触发本组件选中流程）
            pickValue: null,       // 选中哨兵携带值
            monthTick: 0,          // 月份切换哨兵（面板前后钮写——面板模板不能跨组件边界调本组件方法，ADR-0022 决策 3）
            monthDelta: 0,         // 月份切换方向（1 下月 / -1 上月）
        }),
        methods: {
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-date-picker-trigger");
            },
            // 表单载体（hidden input；每查现取）
            carrierEl() {
                return this.el.querySelector(".asc-date-picker-carrier");
            },
            // 两位补零（时/分/日格式化）
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            // "YYYY-MM-DD" 解析（月 0 基对齐 Date；非法形态回 null）
            parseYmd(s) {
                if (typeof s !== "string") return null;
                const p = s.split("-");
                if (p.length !== 3) return null;
                const y = Number(p[0]), m = Number(p[1]) - 1, d = Number(p[2]);
                if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
                if (m < 0 || m > 11 || d < 1 || d > 31) return null;
                return { y: y, m: m, d: d };
            },
            // 年月日 → "YYYY-MM-DD"
            fmtYmd(y, m, d) {
                return y + "-" + this.pad2(m + 1) + "-" + this.pad2(d);
            },
            // i18n 词典查询（模板表达式的 t 经 engine.translate 槽同源，methods 内无注入
            //     标识符——经 this.engine 直达槽；恒等兜底（未装 i18n / 词典无键）回退
            //     硬编码中文，pagination 模板表达式同款判定纪律）
            tOr(key, fallback, namedArgs) {
                try {
                    const engine = this.engine;
                    if (engine && typeof engine.translate === "function") {
                        const out = namedArgs
                            ? engine.translate(this.scope, key, namedArgs)
                            : engine.translate(this.scope, key);
                        if (out !== key) return String(out);
                    }
                } catch (e) { /* 查表异常回退 */ }
                return fallback;
            },
            // 本地文案重算（星期表头/今天钮/今天值；mounted 与每次开面板时调用——语言
            //     切换的刷新边界：下次开面板生效，ADR-0025）
            refreshLocale() {
                const wd = this.tOr("date-picker.weekdays", "日,一,二,三,四,五,六");
                this.data.weekdayLabels = String(wd).split(",");
                this.data.todayText = this.tOr("date-picker.today", "今天");
                const n = new Date();
                this.data.todayValue = this.fmtYmd(n.getFullYear(), n.getMonth(), n.getDate());
            },
            // 日历重建：42 格（周日起始——weekdayLabels[0] 恒为周日）+ 年月标题；
            //     viewYear/viewMonth/value 变化时经 watch 收口到这里
            rebuild() {
                const y = this.data.viewYear, m = this.data.viewMonth;
                if (!Number.isFinite(y) || !Number.isFinite(m) || m < 0 || m > 11) return;
                const first = new Date(y, m, 1);
                const start = new Date(y, m, 1 - first.getDay());
                const today = this.data.todayValue;
                const cells = [];
                for (let i = 0; i < 42; i++) {
                    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                    const v = this.fmtYmd(d.getFullYear(), d.getMonth(), d.getDate());
                    cells.push({ value: v, day: d.getDate(), out: d.getMonth() !== m, today: v === today });
                }
                this.data.days = cells;
                this.data.headerText = this.tOr(
                    "date-picker.month-format",
                    y + "年" + (m + 1) + "月",
                    { y: y, m: m + 1 },
                );
            },
            // 选中呈现同步（JS 通道：值即展示——缺省格式 value 直出，无 label 解析层）
            syncValue() {
                const has = this.data.value != null && this.data.value !== "";
                this.data.hasValue = has;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(this.data.value) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            // 开合态副作用：aria-expanded / data-open 同步（JS 直写无 T4=B 约束）+
            //     打开时视图归位（值所在月，无值落当月）+ 高亮落值（无值落今天）+ 文案重算
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) {
                    this.refreshLocale();
                    const v = this.parseYmd(this.data.value);
                    const n = new Date();
                    const base = v || { y: n.getFullYear(), m: n.getMonth() };
                    this.data.viewYear = base.y;
                    this.data.viewMonth = base.m;
                    this.data.activeValue = v ? this.data.value : this.data.todayValue;
                    this.rebuild();
                }
            },
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            // 值变更出口（选中/清除共用）：input 非冒泡（x-model 监听在宿主自身，
            //     checkbox/switch/select 同款）+ change 冒泡 detail={value}（外层消费）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览
            //     但选中被 pick guard 阻断——只读可见可选不了，文档已声明）
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（「再点宿主关闭」——与
            //     用户操作同一关闭路径；声明式 x-popover 面板不入 overlay 实例注册表，
            //     命令式 close 对指令面板无效，ADR-0022 同款绕行）。open 守卫防已关态
            //     误开（toggle 语义）；overlay 插件缺席时 open 恒 false 自然跳过
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 月份切换（面板前后钮哨兵 / PageUp/PageDown）：年 rollover（12 月→次年 1 月）
            shiftMonth(delta) {
                let y = this.data.viewYear, m = this.data.viewMonth + (delta > 0 ? 1 : -1);
                if (m > 11) { y += 1; m = 0; }
                if (m < 0) { y -= 1; m = 11; }
                this.data.viewYear = y;
                this.data.viewMonth = m;
                this.rebuild();
            },
            // 键盘日间漫游（deltaDays = ±1 水平 / ±7 垂直）：Date 滚动自然跨月——
            //     越月时视图跟随切换（重开面板时 syncOpen 也会按值归位）
            moveActive(deltaDays) {
                const cur = this.parseYmd(this.data.activeValue) || this.parseYmd(this.data.todayValue);
                if (!cur) return;
                const t = new Date(cur.y, cur.m, cur.d + deltaDays);
                const vy = t.getFullYear(), vm = t.getMonth();
                if (vy !== this.data.viewYear || vm !== this.data.viewMonth) {
                    this.data.viewYear = vy;
                    this.data.viewMonth = vm;
                }
                this.data.activeValue = this.fmtYmd(vy, vm, t.getDate());
                this.rebuild();
            },
            // Enter 确认当前高亮日
            confirmActive() {
                if (this.data.activeValue) this.pick(this.data.activeValue);
            },
            // 选中流程（日格哨兵 / 今天快捷 / 触发器键盘汇聚点）：禁用与只读阻断；同值
            //     仅关面板；写值 + 双派发 + 视图随选中月 + 关面板 + 焦点回触发器
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                if (typeof v !== "string" || v === "") return;
                if (v === this.data.value) { this.closePanel(); return; }
                this.data.value = v;
                this.syncValue();
                const p = this.parseYmd(v);
                if (p) {
                    this.data.viewYear = p.y;
                    this.data.viewMonth = p.m;
                    this.rebuild();
                }
                this.emitChange();
                this.closePanel();
                this.triggerEl()?.focus();
            },
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +
            //     阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）；字符串空语域
            //     detail={value:""}（select 的 null 语域分叉声明，ADR-0025）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            // 触发器键盘导航（按简）：方向键漫游（未开先开）/ PageUp/PageDown 切月 /
            //     Enter 确认（未开先开）/ ESC 与 Tab 不拦截
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                const k = event.key;
                if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.moveActive(k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : k === "ArrowUp" ? -7 : 7);
                } else if (k === "PageUp" || k === "PageDown") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.shiftMonth(k === "PageUp" ? -1 : 1);
                } else if (k === "Enter") {
                    event.preventDefault();
                    if (this.data.open) this.confirmActive();
                    else this.openPanel();
                }
            },
        },
        mounted() {
            // —— 值桥（x-model 兼容协议，ADR-0025 对齐 ADR-0020/0022）：宿主 el.value
            //     劫持——劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时
            //     回退 props.value 初值（快照序：expando > props.value）；setter 等值守卫
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
            //     元素名写法归一（裸属性折叠为空串——"" → true 的 HTML presence 语义，
            //     ADR-0025；="true"/"false" 与 :绑定 形态不受影响）+ 载体 name 双通道
            //     （元素名写法下 name 折叠为 props，值对象写法下留宿主属性）+ 全量首同步
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
                this.refreshLocale();
                const v = this.parseYmd(this.data.value);
                const n = new Date();
                const base = v || { y: n.getFullYear(), m: n.getMonth() };
                this.data.viewYear = base.y;
                this.data.viewMonth = base.m;
                this.rebuild();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作
            //     触发信号，家族惯用法）——
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("viewYear", () => this.rebuild());
            this.watch("viewMonth", () => this.rebuild());
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            // 面板哨兵：选中（pickTick——日格点击/今天快捷）/ 月份切换（monthTick——
            //     面板模板不能跨组件边界调本组件方法，经哨兵键沿链写回，ADR-0022 决策 3）
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("monthTick", () => { this.shiftMonth(Number(this.data.monthDelta) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-date-picker">
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input/select 同款），光标手型 ---------- */
    .asc-date-picker {
      cursor: pointer;
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */
    .asc-date-picker[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-date-picker[data-disabled] .asc-date-picker-trigger {
      pointer-events: none;
    }
    /* 只读：光标归正文（面板可开浏览，选中被 pick guard 阻断） */
    .asc-date-picker[data-readonly] {
      cursor: default;
    }

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面）；
             可聚焦（tabindex 由 JS 通道维护禁用态） ---------- */
    .asc-date-picker-trigger {
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
    /* 选中值展示：占位与值两态（x-if 切换），占位走次要淡化色 */
    .asc-date-picker-value {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-date-picker-color, #333333));
    }
    .asc-date-picker-placeholder {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-input-placeholder, var(--asc-date-picker-placeholder, rgba(0, 0, 0, 0.35)));
    }

    /* ---------- 尾部动作件：清除钮（内部交互件，不转发焦点）与日历图标 ---------- */
    .asc-date-picker-clear {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-date-picker-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-date-picker-clear:hover {
      color: var(--auto-color, var(--asc-date-picker-action-hover, #606060));
    }
    .asc-date-picker-clear:active {
      transform: scale(0.92);
    }
    /* 日历图标：开面板染 tone（不旋转——日历造型旋转语义弱，与 select 箭头旋转分叉） */
    .asc-date-picker-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      color: var(--auto-third-color, var(--asc-date-picker-icon, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-date-picker[data-open] .asc-date-picker-icon {
      color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-date-picker-primary, #009aff)));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-date-picker-value,
    [data-dark] .asc-date-picker-value {
      color: var(--auto-color, var(--asc-date-picker-color, #fafafa));
    }
    [dark] .asc-date-picker-placeholder,
    [data-dark] .asc-date-picker-placeholder {
      color: var(--auto-input-placeholder, var(--asc-date-picker-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-date-picker-clear,
    [dark] .asc-date-picker-icon,
    [data-dark] .asc-date-picker-clear,
    [data-dark] .asc-date-picker-icon {
      color: var(--auto-third-color, var(--asc-date-picker-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-date-picker-clear:hover,
    [data-dark] .asc-date-picker-clear:hover {
      color: var(--auto-color, var(--asc-date-picker-action-hover, #fafafa));
    }

    /* ══════════ 日历面板（autospark-date-picker-panel，渲染进 body 覆盖物容器；
       样式经本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════
       语义色组织（ADR-0025 视觉对齐）：--asc-tone 中转变量（alert/tag 定型结构），
       选中实底 tone + 白字，hover/active 走 color-mix 派生 */
    .asc-date-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-date-picker-primary, #009aff));
      display: block;
      padding: 0.6em;
      font-size: var(--auto-font-size, var(--asc-date-picker-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-date-picker-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-date-picker-panel-color, #333333));
    }
    /* 头部：月份导航（内置 arrow 图标，上月在旋 180°）+ 年月标题居中 */
    .asc-date-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4em;
    }
    .asc-date-picker-nav {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2em;
      height: 2em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-nav-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-date-picker-nav, rgba(0, 0, 0, 0.45)));
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-date-picker-nav:hover {
      background: var(--auto-hover-bgcolor, var(--asc-date-picker-nav-hover-bg, rgba(0, 0, 0, 0.045)));
      color: var(--auto-color, var(--asc-date-picker-nav-hover, #333333));
    }
    .asc-date-picker-nav-prev {
      transform: rotate(180deg);
    }
    .asc-date-picker-title {
      flex: 1 1 auto;
      text-align: center;
      font-weight: var(--auto-font-weight, var(--asc-date-picker-title-weight, 500));
      color: var(--auto-color, var(--asc-date-picker-title, #333333));
    }
    /* 星期表头：七列行（与日格同列宽——固定 em 轨道，面板宽度由内容定形），辅助色 */
    .asc-date-picker-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 2.4em);
      justify-content: center;
    }
    .asc-date-picker-weekday {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.2em;
      color: var(--auto-third-color, var(--asc-date-picker-weekday, rgba(0, 0, 0, 0.45)));
    }
    /* 日格：单层 42 格扁平数组（不嵌套 x-for——内层渲染晚一跳边界规避），CSS 七列
       自然分行；**固定 em 轨道**（面板是 auto 宽弹层，1fr 轨道会塌到内容宽——面板
       宽度由 7×2.4em 定形，随字号档位 em 基准缩放） */
    .asc-date-picker-grid {
      display: grid;
      grid-template-columns: repeat(7, 2.4em);
      justify-content: center;
      row-gap: 0.1em;
    }
    .asc-date-picker-day {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.2em;
      width: 100%;
      border-radius: var(--x-border-radius-circle, var(--asc-date-picker-day-radius, 50%));
      cursor: pointer;
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-date-picker-day:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    /* 键盘高亮：tone 描边环（与 hover 同源派生） */
    .asc-date-picker-day[data-active] {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--asc-tone) 45%, transparent);
    }
    /* 选中：实底 tone + 白字（语义色底上的白字是恒定设计，非变量映射） */
    .asc-date-picker-day[data-selected] {
      background: var(--asc-tone);
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-selected]:hover {
      background: var(--asc-tone);
    }
    /* 今天：tone 文字 + 描边环标记（与选中可叠加——选中态优先实底，今天环让位内衬线） */
    .asc-date-picker-day[data-today] {
      color: var(--asc-tone);
      font-weight: var(--auto-font-weight, var(--asc-date-picker-today-weight, 500));
    }
    .asc-date-picker-day[data-today]:not([data-selected]) {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--asc-tone) 35%, transparent);
    }
    .asc-date-picker-day[data-today][data-selected] {
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    /* 邻月格：淡化（可点击漫游过去——哨兵携带完整日期值，选中后视图随值归位） */
    .asc-date-picker-day[data-out] {
      color: var(--auto-third-color, var(--asc-date-picker-day-out, rgba(0, 0, 0, 0.28)));
    }
    .asc-date-picker-day[data-out][data-today],
    .asc-date-picker-day[data-out][data-selected] {
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-out][data-today] {
      color: var(--asc-tone);
    }
    /* 底部：今天快捷钮（文本钮，tone 文字） */
    .asc-date-picker-footer {
      display: flex;
      justify-content: center;
      margin-top: 0.4em;
      padding-top: 0.4em;
      border-top: var(--auto-border-size, var(--asc-date-picker-footer-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-date-picker-footer-border, #f0f0f0));
    }
    .asc-date-picker-today {
      border: none;
      background: transparent;
      padding: 0.25em 0.75em;
      cursor: pointer;
      font: inherit;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-today-radius, 0.25rem));
      color: var(--asc-tone);
      transition: background-color 0.12s ease;
    }
    .asc-date-picker-today:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
    [dark] .asc-date-picker-panel,
    [data-dark] .asc-date-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-date-picker-primary, #56baff));
      color: var(--auto-color, var(--asc-date-picker-panel-color, #fafafa));
    }
    [dark] .asc-date-picker-nav,
    [dark] .asc-date-picker-weekday,
    [data-dark] .asc-date-picker-nav,
    [data-dark] .asc-date-picker-weekday {
      color: var(--auto-third-color, var(--asc-date-picker-nav, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-date-picker-nav:hover,
    [data-dark] .asc-date-picker-nav:hover {
      background: var(--auto-hover-bgcolor, var(--asc-date-picker-nav-hover-bg, rgba(255, 255, 255, 0.08)));
      color: var(--auto-color, var(--asc-date-picker-nav-hover, #fafafa));
    }
    [dark] .asc-date-picker-day[data-out],
    [data-dark] .asc-date-picker-day[data-out] {
      color: var(--auto-third-color, var(--asc-date-picker-day-out, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-date-picker-footer,
    [data-dark] .asc-date-picker-footer {
      border-top-color: var(--auto-border-color, var(--asc-date-picker-footer-border, #52525b));
    }
  </style>
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden——提交值载体，禁用
         出表由 JS 同步）+ 触发器（popover 宿主 / 焦点受让者 / combobox 语义）+
         清除钮（动作件）+ 日历图标。文案走 props 与 i18n 词典（继承形态嵌套插槽出口
         被忽略，ADR-0056——不开真插槽，select 同款边界） -->
  <input type="hidden" class="asc-date-picker-carrier" />
  <span
    class="asc-date-picker-trigger"
    x-popover:autospark-date-picker-panel
    x-popover-options="{ trigger: 'click', padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="grid"
    aria-expanded="false"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-date-picker-value" x-if="hasValue" x-text="value"></span>
    <span
      class="asc-date-picker-placeholder"
      x-if="!hasValue"
      x-text="placeholder || (t('date-picker.placeholder') === 'date-picker.placeholder' ? '请选择日期' : t('date-picker.placeholder'))"
    ></span>
  </span>
  <i
    class="asc-date-picker-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i class="asc-date-picker-icon" data-autospark-action x-icon="'date-calendar'"></i>
</span>
`,i=`<!--
    autospark-date-picker-panel 日历面板（ADR-0025）——date-picker 的内部组件（非用户
    直接消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制
    （trigger:click）渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位）由 popover-shell
    承载，本组件只贡献日历内容（头部月份导航 + 星期表头 + 6×7 日格 + 今天快捷钮）。
    面板宽度由内容自定（popover 无 fit——日历面板宽度与触发器解耦）。

    与触发器组件（autospark.date-picker）的通信走 scope 链：overlay 内容宿主恒以
    「open + dataContext:'host'」实例化本组件（ADR-0123 决策 2），聚合视图沿链读写
    触发器组件 data 域——
    - 读：days（日格数据源）/ weekdayLabels（星期表头）/ headerText（年月标题）/
      value（选中基准）/ activeValue（键盘高亮基准）/ todayValue / todayText（今天钮）；
    - 写：哨兵键 pickTick/pickValue（日格点击与今天快捷）、monthTick/monthDelta（月份
      前后钮）——面板模板不能跨组件边界调触发器组件 method（x-on 组件 method 查找不
      穿透父组件，ADR-0022 决策 3），自增哨兵免疫同值去重；事件表达式用逗号运算符
      单表达式形态（分号多语句依赖新版引擎回退，旧产物不可用）；
    - 开合态：mounted/unmounted 沿链写 open（图标染色 / aria-expanded / 视图归位）。

    日格克隆体内零 x-if/x-show（共享快照多实例串台规避，ADR-0021 边界 3）——状态全走
    x-bind 布尔属性（假值整属性移除 = 无态，绑定语义天然契合）。月份导航用 engine 内置
    arrow 图标（上月钮 CSS 旋转 180° 复用，page-header 同款纪律）。
-->
<div class="asc-date-picker-panel" x-define="autospark-date-picker-panel">
  <script setup>
    {
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生图标染色 / aria-expanded / 视图归位）
            this.data.open = true;
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 头部：月份前后钮（哨兵沿链写回，触发器侧 shiftMonth 做年 rollover）+ 年月标题 -->
  <div class="asc-date-picker-header">
    <i
      class="asc-date-picker-nav asc-date-picker-nav-prev"
      @click="monthTick = monthTick + 1, monthDelta = -1"
      x-icon="'arrow'"
    ></i>
    <span class="asc-date-picker-title" x-text="headerText"></span>
    <i
      class="asc-date-picker-nav"
      @click="monthTick = monthTick + 1, monthDelta = 1"
      x-icon="'arrow'"
    ></i>
  </div>
  <!-- 星期表头：七列（i18n date-picker.weekdays 逗号串 split 产物，触发器域维护） -->
  <div class="asc-date-picker-weekdays">
    <template x-for="w of weekdayLabels" :key="w">
      <span class="asc-date-picker-weekday" x-text="w"></span>
    </template>
  </div>
  <!-- 日格：42 格扁平数组单层 x-for（不嵌套——内层渲染晚一跳边界规避），CSS 七列
         自然分行；状态 x-bind 布尔属性驱动（假值整属性移除 = 无态）——data-out 邻月
         淡化 / data-today 今天 / data-selected 选中 / data-active 键盘高亮 -->
  <div class="asc-date-picker-grid" role="grid">
    <template x-for="day of days" :key="day.value">
      <span
        class="asc-date-picker-day"
        role="gridcell"
        x-bind:data-out="day.out"
        x-bind:data-today="day.today"
        x-bind:data-selected="day.value === value"
        x-bind:data-active="day.value === activeValue"
        x-on:click="pickTick = pickTick + 1, pickValue = day.value"
        x-text="day.day"
      ></span>
    </template>
  </div>
  <!-- 底部：今天快捷钮（哨兵携带 todayValue——点击即选中今天，触发器侧视图随值归位） -->
  <div class="asc-date-picker-footer">
    <button
      type="button"
      class="asc-date-picker-today"
      x-text="todayText"
      @click="pickTick = pickTick + 1, pickValue = todayValue"
    ></button>
  </div>
</div>
`,a=`autospark.date-picker`,o=`autospark-date-picker-panel`,s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`;function c(e){e.icons?.add?.(`date-calendar`,s),e.components[a]=r,e.components[o]=i}l();function l(){e(e=>{c(e)})}};
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

//# sourceMappingURL=autospark.date-picker.js.map
