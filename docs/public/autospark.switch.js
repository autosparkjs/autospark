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
`}n();function n(){e(e=>{t(e)})}var r=`<!--\r
    autospark.switch 开关（ADR-0019 合批 / ADR-0020 Field 消费契约）——**自绘开关**\r
    （无原生对应控件）：轨道 + 滑块纯 CSS 自绘，可访问性自持——role="switch" +\r
    aria-checked + tabindex + 键盘 Space/Enter 切换（原生 checkbox 方案的对照：彼保真\r
    原生语义、此自持语义，ADR-0018 决策 7 表单基座策略内的例外形态）。\r
\r
    值通道（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false"（配\r
    x-model.boolean 保真——state-button 布尔组桥同款）；切换派发 input（x-model 回写，\r
    监听在宿主自身非冒泡形态）+ change（detail = { value } 新布尔值，冒泡供外层消费）。\r
    checked props 为非受控初值 / 单向同步值（受控真相走宿主 x-model）。\r
\r
    表单提交：内嵌 input[type=hidden] 载体（data-autospark-control 标记——骨架 disabled\r
    同步落载体，禁用即出表），value = 当前布尔字面串恒提交、name 透传宿主（state-button\r
    N>2 表单桥同构——value 是受控真相原样提交，true/false 值域服务端约定）。\r
\r
    交互面：整组热区（轨道 + 文案都触发切换，宿主级事件委托）；loading 态滑块转 CSS\r
    旋转圈并阻断切换；disabled（骨架通道）阻断 + 淡化；readonly 亦阻断（值不可变语义）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-switch——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；data-checked / data-loading\r
     由 mounted JS 通道同步（无 T4=B 约束），根上无动态绑定 -->\r
<span\r
  class="asc-switch"\r
  x-define="autospark.switch"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",     // 兜底文案（默认插槽内容优先；用户传入，无 i18n）\r
            checked: false,// 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 布尔语域桥）\r
            loading: false,// 加载态：滑块转 CSS 旋转圈 + 阻断切换（视觉优先于 disabled，不淡化）\r
        }),\r
        mounted() {\r
            // —— 内层元素查询（mounted 时子树可能未挂载，查询恒延后一跳现取）——\r
            const track = () => this.el.querySelector(".asc-switch-track");\r
            const carrier = () => this.el.querySelector(".asc-switch-carrier");\r
\r
            // —— 全视觉同步（按 data 现值求值，幂等）：aria 语义 + 宿主状态属性 + 表单载体 ——\r
            const syncVisual = () => {\r
                const on = !!this.data.checked;\r
                const t = track();\r
                if (t) {\r
                    t.setAttribute("aria-checked", String(on));\r
                    // 可访问性：loading 亦不可交互（aria-disabled 联动 disabled/loading）\r
                    t.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.loading)));\r
                    if (this.data.status === "error") t.setAttribute("aria-invalid", "true");\r
                    else t.removeAttribute("aria-invalid");\r
                }\r
                const c = carrier();\r
                if (c) {\r
                    // 提交载体恒随（hidden 恒提交当前布尔；禁用出表由骨架同步，此处双保险）\r
                    c.value = String(on);\r
                    c.disabled = !!this.data.disabled;\r
                }\r
                this.el.toggleAttribute("data-checked", on);\r
                this.el.toggleAttribute("data-loading", !!this.data.loading);\r
            };\r
\r
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为布尔语域 "true"/"false" ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.checked 初值（劫持快照序：expando > props.checked，input 同款）\r
            const prior = this.el.value;\r
            const initChecked = typeof prior === "string" && prior !== ""\r
                ? prior === "true"\r
                : !!this.data.checked;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(!!this.data.checked),\r
                set: (v) => {\r
                    this.data.checked = v === true || v === "true";\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            // —— 切换动作：可交互判定（disabled / readonly / loading 均阻断）→ 翻转 →\r
            //     双派发（input→x-model 回写非冒泡；change→外层消费 detail={value}）——\r
            const toggle = () => {\r
                if (this.data.disabled || this.data.readonly || this.data.loading) return;\r
                this.data.checked = !this.data.checked;\r
                syncVisual();\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.checked } }),\r
                );\r
            };\r
\r
            // —— 交互接入（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：\r
            //     整组热区（轨道 + 文案都触发）；键盘 Space/Enter（自绘控件自持，\r
            //     role=switch 交互约定；Space 阻断页面滚动）——\r
            this.el.addEventListener("click", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (t && t.closest(".asc-switch-wrap")) toggle();\r
            });\r
            this.el.addEventListener("keydown", (e) => {\r
                if (e.key !== " " && e.key !== "Enter") return;\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t || !t.closest(".asc-switch-track")) return;\r
                e.preventDefault();\r
                toggle();\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：初值落定 +\r
            //     宿主 name 透传到表单载体 + 首次视觉同步 ——\r
            setTimeout(() => {\r
                this.data.checked = initChecked;\r
                const c = carrier();\r
                const nameAttr = this.el.getAttribute("name");\r
                if (c && nameAttr != null) c.name = nameAttr;\r
                syncVisual();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            this.watch("checked", () => { syncVisual(); });\r
            this.watch("loading", () => { syncVisual(); });\r
            this.watch("status", () => { setTimeout(syncVisual, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-switch">\r
    /* ---------- 结构：纯 span 包裹（自绘控件无原生语义可包——不用 label 防表单载体\r
         转发点击双触发）；轨道 = 交互件（data-autospark-action，点击不转发焦点） ---------- */\r
    .asc-switch-wrap {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.45em;\r
      cursor: pointer;\r
    }\r
    /* 轨道：尺寸 em 基准随主题 data-size 档位字号缩放（不设自有尺寸属性，button 同范式\r
       ADR-0012）；关态中性色（正文色派生淡灰，主题在场自动换肤） */\r
    .asc-switch-track {\r
      --asc-switch-w: 2.6em;\r
      --asc-switch-h: 1.4em;\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      box-sizing: border-box;\r
      width: var(--asc-switch-w);\r
      height: var(--asc-switch-h);\r
      padding: 0.1875em;\r
      border-radius: 9999px;\r
      background: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-switch-off, #606060)) 28%,\r
        transparent\r
      );\r
      transition: background-color 0.2s ease, box-shadow 0.15s ease;\r
    }\r
    /* 滑块：白色恒定设计（暗色不换——与背景形成恒定对比）；位移 = 轨道宽 - 高（对称内距） */\r
    .asc-switch-thumb {\r
      flex: none;\r
      width: calc(var(--asc-switch-h) - 0.375em);\r
      height: calc(var(--asc-switch-h) - 0.375em);\r
      border-radius: 50%;\r
      background: var(--asc-switch-thumb, #ffffff);\r
      box-shadow: var(--asc-switch-thumb-shadow, 0 1px 2px rgba(0, 0, 0, 0.25));\r
      transform: translateX(0);\r
      transition: transform 0.2s ease;\r
      box-sizing: border-box;\r
    }\r
\r
    /* ---------- 开态（data-checked 由 mounted JS 通道同步）：主色实底（status 在场随\r
             --asc-field-tone 联动——开态语义色，骨架通道） ---------- */\r
    .asc-switch[data-checked] .asc-switch-track {\r
      background: var(--asc-field-tone);\r
    }\r
    .asc-switch[data-checked] .asc-switch-thumb {\r
      transform: translateX(calc(var(--asc-switch-w) - var(--asc-switch-h)));\r
    }\r
\r
    /* ---------- loading 态（data-loading 由 mounted 同步）：滑块转 CSS 旋转圈（阻断\r
             切换由 JS 判定；视觉优先于 disabled 不淡化，button loading 同款语义） ---------- */\r
    .asc-switch[data-loading] .asc-switch-thumb {\r
      background: transparent;\r
      box-shadow: none;\r
      border: 0.125em solid var(--asc-field-tone);\r
      border-top-color: transparent;\r
      animation: asc-switch-spin 0.7s linear infinite;\r
    }\r
    @keyframes asc-switch-spin {\r
      to {\r
        transform: rotate(360deg);\r
      }\r
    }\r
    .asc-switch[data-loading][data-checked] .asc-switch-thumb {\r
      transform: none;\r
    }\r
\r
    /* ---------- 交互态 ---------- */\r
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——轨道可聚焦即点亮）；禁用不点环 */\r
    .asc-switch[data-focus]:not([data-disabled]) .asc-switch-track {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点光标 */\r
    .asc-switch[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-switch[data-disabled] .asc-switch-wrap {\r
      cursor: not-allowed;\r
    }\r
    /* loading 光标进度态（不淡化） */\r
    .asc-switch[data-loading] .asc-switch-wrap {\r
      cursor: progress;\r
    }\r
\r
    /* ---------- 文案：空文案不占位（消 gap 空隙） ---------- */\r
    .asc-switch-label:empty {\r
      display: none;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：关态中性色换暗色校准（正文色反转自动偏白灰，\r
             兜底字面值切换；开态 tone 与滑块白色为恒定设计不变） ---------- */\r
    [dark] .asc-switch-track,\r
    [data-dark] .asc-switch-track {\r
      background: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-switch-off, #fafafa)) 32%,\r
        transparent\r
      );\r
    }\r
    [dark] .asc-switch-thumb,\r
    [data-dark] .asc-switch-thumb {\r
      background: var(--asc-switch-thumb, #ffffff);\r
    }\r
  </style>\r
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden，骨架 disabled 同步目标）+\r
         轨道交互件（role=switch 可聚焦）+ 文案。开态/loading 视觉由宿主 data-* 属性驱动。\r
         注意：嵌套 x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 field\r
         出口整段替换控件区（逃生通道，input 同款语义），文案走 props 兜底不开真插槽 -->\r
  <span class="asc-switch-wrap">\r
    <input type="hidden" class="asc-switch-carrier" data-autospark-control />\r
    <span\r
      class="asc-switch-track"\r
      role="switch"\r
      tabindex="0"\r
      aria-checked="false"\r
      data-autospark-action\r
    >\r
      <span class="asc-switch-thumb"></span>\r
    </span>\r
    <span class="asc-switch-label">{{ label }}</span>\r
  </span>\r
</span>\r
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
