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
            //     控件可能被重建（x-if 条件渲染等），缓存引用会指向已摘除节点\r
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
         高度+flex 居中吸收，height:auto 形态（多行控件 autospark.textarea / theme\r
         在场标尺缺陷回退）由纵向半距撑起呼吸感，全档位随 --auto-input-padding 联动） */\r
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
`}a();function a(){e(e=>{i(e)})}var o=`<!--\r
    autospark.input 输入框（ADR-0020；2026-11-17 修订 ADR-0032——多行能力拆出\r
    autospark.textarea，本组件不再内置 textarea 形态）——原生增强路线：真实原生\r
    input 控件 + 样式包裹，不自绘输入面（保原生可访问性：键盘/IME/自动填充/移动端\r
    兼容，ADR-0018 决策 7）。继承 autospark.field 表单域骨架（状态色通道/焦点态/\r
    disabled 同步/盒饰 chrome，ADR-0020），本组件专注控件本身。\r
\r
    值通道（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件——\r
    宿主为包裹层元素（无原生 value），x-model 写读都落劫持位；内层原生 input 事件\r
    自然冒泡过宿主，x-model 监听直接命中（无需手动派发——原生控件自带 value 语义，\r
    桥比 button-group 组值桥更薄）。value props 为非受控初值/单向同步（受控真相走\r
    x-model）。\r
\r
    表单提交（ADR-0020）：宿主 name 透传到内层原生控件——原生直提交（input 自带\r
    提名义，含 Enter 提交语义；对照 state-button 的 hidden input 桥分叉，本组件\r
    控件即真身无须代理载体）。\r
\r
    事件出口（组件默认封闭，原生事件经冒泡到外层消费）：\r
    - input / change：内层原生控件事件自然冒泡（x-model 与外层 @input/@change 直接消费）\r
    - 清除为内部动作件（data-autospark-action，点击不转发焦点），不派发自定义事件\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-input + .asc-field-box 盒饰选配）；\r
     变体与状态属性经 mounted 的 JS 通道同步（data-over），根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-input asc-field-box"\r
  x-define="autospark.input"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            type: "text",          // 文本族：text/password/email/tel/url/search 等（透传原生 input type）\r
            value: "",             // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥，ADR-0020）\r
            placeholder: "",       // 占位文案（同步原生 placeholder）\r
            maxlength: 0,          // >0 同步原生 maxlength（原生输入截断）\r
            clearable: false,      // 清除钮（值非空且可交互时可见；点击清空 + 派发 input + 焦点回控件）\r
            prefix: "",            // 前置装饰：string 文本 | { icon: "图标名" } 图标（对象经状态引用注入）\r
            suffix: "",            // 后置装饰：形态同 prefix\r
            // —— 内部状态 ——\r
            hasValue: false,        // 当前有值（清除钮可见性驱动；JS 通道随输入维护）\r
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
        },\r
        mounted() {\r
            // —— 内层控件查询（每查现取：运行时控件可能被重建）——\r
            const native = () => this.el.querySelector(".asc-input-native");\r
            // 当前值缓存（劫持 getter 的控件缺位兜底）\r
            let lastValue = "";\r
\r
            // —— 清除可见性同步（len 由原生控件现值读出）——\r
            const syncLen = () => {\r
                const n = native();\r
                this.data.hasValue = n ? String(n.value ?? "").length > 0 : false;\r
            };\r
\r
            // —— 值同步（外部 → 控件）——\r
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
                    // type 透传\r
                    n.type = t || "text";\r
                }\r
                n.placeholder = String(this.data.placeholder ?? "");\r
                const ml = Number(this.data.maxlength) || 0;\r
                if (ml > 0) n.setAttribute("maxlength", String(ml));\r
                else n.removeAttribute("maxlength");\r
                // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
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
            this.watch("maxlength", () => { setTimeout(syncAttrs, 0); });\r
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
    /* ---------- 前后置装饰容器（2026-11-16 装饰上提，ADR-0020 修订）：props 装饰经\r
         template 覆盖段上提 field 出口——次要色/间距/防收缩由出口注入类\r
         .asc-field-prefix/.asc-field-suffix 落本容器（活注入取首个元素根，单根容器\r
         承接防多根裸奔）；容器只管混排内距（图标 + 文本 0.35em）与不换行 ---------- */\r
    .asc-input-affix {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      white-space: nowrap;\r
    }\r
\r
    /* ---------- 动作件（清除钮）：内部交互钮，淡色常态 + 悬停正文色 ---------- */\r
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
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-input-native::placeholder,\r
    [data-dark] .asc-input-native::placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-input-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-input-affix,\r
    [data-dark] .asc-input-affix {\r
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
  </style>\r
  <!-- 命名覆盖段（2026-11-16 装饰上提，ADR-0020 修订）：props 前后置装饰经 template\r
         覆盖段上提 field 的 prefix/suffix 出口（继承覆盖链中间层：消费方投影 > 本段\r
         > field 空载体）。注入属性集随段整段替换（ADR-0137 决策三-b：覆盖段即新声明、\r
         不与父合并）——故 class="asc-field-*" 须在本段重声明（次要色/间距/防收缩的\r
         规则载体），落单根容器 .asc-input-affix（活注入取首个元素根，多根裸奔防御）；\r
         装饰缺席容器不渲染 → 出口零 DOM。图标 x-icon 为指令值通道对 props 注入响应；\r
         文本兜底 {{ }} 为插值通道（对象 props 经状态引用注入，文档已声明） -->\r
  <template x-slot:prefix class="asc-field-prefix">\r
    <span class="asc-input-affix" x-if="!!prefix">\r
      <i class="asc-input-icon" x-if="typeof prefix === 'object' && prefix && !!prefix.icon" x-icon="prefix.icon"></i>\r
      <span class="asc-input-text" x-if="typeof prefix === 'string' && !!prefix">{{ prefix }}</span>\r
    </span>\r
  </template>\r
  <template x-slot:suffix class="asc-field-suffix">\r
    <span class="asc-input-affix" x-if="!!suffix">\r
      <i class="asc-input-icon" x-if="typeof suffix === 'object' && suffix && !!suffix.icon" x-icon="suffix.icon"></i>\r
      <span class="asc-input-text" x-if="typeof suffix === 'string' && !!suffix">{{ suffix }}</span>\r
    </span>\r
  </template>\r
  <!-- 默认段（替换 field 出口 fallback）：控件本体与功能动作件，文档序即呈现序\r
         [控件] [清除]——props 前后置装饰已上提 field 出口（见上方命名覆盖段）；\r
         功能件（清除）刻意留 body：不进可被消费方投影顶掉的出口 fallback 位\r
         （ADR-0020 修订取舍）。眼睛切换/计数已随 show-password/show-count 一并移除\r
         （2026-11-18 API 删减，ADR-0020 修订三） -->\r
  <input class="asc-input-native" data-autospark-control />\r
  <i\r
    class="asc-input-action asc-input-clear"\r
    data-autospark-action\r
    x-if="clearable && hasValue"\r
    x-icon="'no'"\r
    @click="onClear($event)"\r
  ></i>\r
</span>\r
`,s=`autospark.input`,c=new Set([`disabled`,`readonly`,`clearable`]);function l(e){e.components[s]=o,e.precompile?.(e=>{for(let i of Array.from(e.el.querySelectorAll(`x-input`))){let e=document.createElement(`span`),a=[];for(let o of Array.from(i.attributes)){if(o.name.startsWith(`:`)){a.push(`${n(t(o.name.slice(1)))}: (${o.value})`);continue}if(o.name===`class`||o.name===`style`||o.name===`id`||o.name===`name`||o.name===`title`||o.name.startsWith(`data-`)||o.name.startsWith(`x-`)||o.name.startsWith(`@`)){e.setAttribute(o.name,o.value);continue}let i=t(o.name);o.value===``&&c.has(o.name)?a.push(`${n(i)}: true`):a.push(`${n(i)}: ${JSON.stringify(r(o.value))}`)}let o=i.textContent?.trim()??``,l=a.some(e=>e.startsWith(`value:`)),u=i.children.length>0;for(o!==``&&!l&&!u&&(a.push(`value: ${JSON.stringify(o)}`),i.textContent=``),e.setAttribute(`x-component:${s}`,`{ ${a.join(`, `)} }`);i.firstChild;)e.appendChild(i.firstChild);i.replaceWith(e)}})}u();function u(){e(e=>{l(e)})}var d=`<!--
    autospark.password 密码框（ADR-0034）——真继承 autospark.input（继承链
    password → input → field → autospark.base）：值桥（宿主 el.value 劫持）、原生
    属性同步（placeholder / maxlength / name）、清除钮、prefix / suffix props、
    styles 拼接全部复用；本组件只贡献密码场景的两个附加件——前缀钥匙装饰（key）
    与明文可见切换（眼睛钮）。

    默认段整段重声明（继承覆盖 ADR-0081：出口 fallback 不随父模板传导）：
    [input][clear][eye]。功能动作件刻意留 body——不进可被消费方投影顶掉的出口位
    （ADR-0020 装饰上提纪律），眼睛钮若落 suffix 出口会被消费方投影顶掉、密码框
    失去核心能力（ADR-0034 决策 3）。

    明文态（内部 revealed，ADR-0034 决策 2）：只改原生 input.type（password ↔ text），
    不改值、不派发事件、不参与 x-model 通道。type 由组件冻结为 password——外部注入
    的 type 经 data 归一压回，任何路径下都不会停留在非密码形态。

    无内置文案、不接 i18n（ADR-0018 决策 1）；动作件的 aria-label 为可访问性语义
    文案（「显示密码」/「隐藏密码」），非可见 UI 文案。
-->
<span class="asc-password" x-define="autospark.password" x-define:inherit="autospark.input">
  <script setup>
    {
        data: () => ({
            type: "password",      // 冻结：组件身份即密码框（外部传值被压回，ADR-0034 决策 2）
            viewable: true,        // 明文可见切换能力开关：false = 不渲染眼睛钮（ADR-0034 决策 3）
            minlength: 0,          // >0 同步原生 minlength（仅原生约束校验，无内置提示/计数）
            autocomplete: "",      // 原生 autocomplete 提示（current-password / new-password 等）
            // —— 内部状态 ——
            revealed: false,       // 明文态：true = 原生 type 为 text（仅表现，不落值通道）
        }),
        methods: {
            // 明文态落原生控件（含选区保位）：切换 input.type 会丢失/移动选区，
            // 切前暂存、切后复原（password / text 均支持选区通道）
            applyRevealed() {
                const n = this.el.querySelector(".asc-input-native");
                if (!(n instanceof HTMLInputElement)) return;
                const start = n.selectionStart;
                const end = n.selectionEnd;
                n.type = this.data.revealed ? "text" : "password";
                if (start != null && end != null) {
                    try {
                        n.setSelectionRange(start, end);
                    } catch {
                        // type 不支持选区时静默跳过（当前两态均支持，防御未来扩展）
                    }
                }
            },
            // 眼睛钮：翻转明文态 + 焦点回控件（点击动作件本身不获焦；aria-label 随态经绑定通道换）
            onToggleReveal() {
                if (this.data.disabled) return; // 禁用态零效果（与清除钮一致）
                this.data.revealed = !this.data.revealed;
                this.applyRevealed();
                const n = this.el.querySelector(".asc-input-native");
                if (n && typeof n.focus === "function") n.focus();
            },
        },
        mounted() {
            // —— 内层控件查询（每查现取：控件可能被运行时重建）——
            const native = () => this.el.querySelector(".asc-input-native");

            // —— type 归一：父层 data.type 缺省 text，外部经 props 注入的任意值一律压回
            //     password（组件身份冻结）。写 data 触发父层 type watcher 的 syncAttrs，
            //     下游原生 type 由本层 applyRevealed 最终裁定（子层 setTimeout 注册于父层
            //     之后，宏任务序保证后手）
            const normalizeType = () => {
                if (this.data.type !== "password") this.data.type = "password";
            };

            // —— 密码场景专属原生属性透传：父层 syncAttrs 只管 placeholder / maxlength /
            //     type / name（ADR-0020）；minlength / autocomplete 在本层补齐 ——
            const syncOwnAttrs = () => {
                const n = native();
                if (!n) return;
                const min = Number(this.data.minlength) || 0;
                if (min > 0) n.setAttribute("minlength", String(min));
                else n.removeAttribute("minlength");
                const ac = String(this.data.autocomplete ?? "");
                if (ac) n.setAttribute("autocomplete", ac);
                else n.removeAttribute("autocomplete");
            };

            // —— 明文态复位（清空 / 能力关闭共用）：回掩码形态并撤状态 ——
            const hide = () => {
                if (!this.data.revealed) return;
                this.data.revealed = false;
                this.applyRevealed();
            };

            // —— 清空即复位：清除钮的清空会派发原生 input 冒泡经宿主（ADR-0020 值桥），
            //     手输到空同样命中——值空了就回到掩码态，避免后续输入裸奔 ——
            this.el.addEventListener("input", () => {
                const n = native();
                if (!n || String(n.value ?? "") === "") hide();
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                normalizeType();
                syncOwnAttrs();
                this.applyRevealed();
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象）——
            this.watch("minlength", () => { setTimeout(syncOwnAttrs, 0); });
            this.watch("autocomplete", () => { setTimeout(syncOwnAttrs, 0); });
            // 能力关闭：强制复位隐藏（防「明文但无钮可关」悬空态，ADR-0034 决策 3）
            this.watch("viewable", ({ value }) => { if (!value) hide(); });
            // type 兜底：外部注入触发父层 syncAttrs 后重新归一 + 重裁定明文态
            this.watch("type", () => {
                setTimeout(() => {
                    normalizeType();
                    this.applyRevealed();
                }, 0);
            });
        },
    }
  <\/script>
  <style global id="autospark-components-password">
    /* ---------- 抑制浏览器原生密码显露钮（Edge/IE ::-ms-reveal / ::-ms-clear）：
        本组件的眼睛钮 / 清除钮是唯一动作面，若放任 UA 钮并排会出现两套语义相同的
        控件（ADR-0034 决策 3；旧 input 的「原生显示密码钮未协调」边界在此收口） ---------- */
    .asc-password .asc-input-native::-ms-reveal,
    .asc-password .asc-input-native::-ms-clear {
      display: none;
    }
  </style>
  <!-- 前缀装饰覆盖段（整段替换 input 的同名段，ADR-0137 决策三-b 不合并）：key 恒在
       最左、消费方 prefix props 装饰紧随其后；单根容器承接出口注入类（次要色/间距/
       防收缩落首根），多根裸奔防御。消费方投影 prefix 插槽时整段让位（显式接管） -->
  <template x-slot:prefix class="asc-field-prefix">
    <span class="asc-input-affix">
      <i class="asc-input-icon asc-password-key" x-icon="'key'"></i>
      <i class="asc-input-icon" x-if="typeof prefix === 'object' && prefix && !!prefix.icon" x-icon="prefix.icon"></i>
      <span class="asc-input-text" x-if="typeof prefix === 'string' && !!prefix">{{ prefix }}</span>
    </span>
  </template>
  <!-- 默认段（替换 field 出口 fallback）：[控件][清除][眼睛]——功能动作件留 body；
       suffix props 装饰仍走继承来的 suffix 覆盖段（眼睛恒在其内侧） -->
  <input class="asc-input-native" data-autospark-control />
  <i
    class="asc-input-action asc-input-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <!-- 眼睛钮：viewable 关闭时整钮零 DOM；aria-pressed 表达明文态（动作件键盘可达性
       缺口与清除钮同轨，文档「已知边界」有档）；点击照常冒泡（不 stopPropagation——
       与清除钮的阻断语义有意不同，ADR-0034 决策 3） -->
  <i
    class="asc-input-action asc-password-eye"
    data-autospark-action
    role="button"
    x-if="viewable"
    :aria-label="revealed ? '隐藏密码' : '显示密码'"
    :aria-pressed="revealed ? 'true' : 'false'"
    x-icon="revealed ? 'eye-off' : 'eye'"
    @click="onToggleReveal()"
  ></i>
</span>
`,f=`autospark.password`,p=new Set([`disabled`,`readonly`,`clearable`,`viewable`]);function m(e){e.components[f]=d,e.precompile?.(e=>{for(let i of Array.from(e.el.querySelectorAll(`x-password`))){let e=document.createElement(`span`),a=[];for(let o of Array.from(i.attributes)){if(o.name.startsWith(`:`)){a.push(`${n(t(o.name.slice(1)))}: (${o.value})`);continue}if(o.name===`type`)continue;if(o.name===`class`||o.name===`style`||o.name===`id`||o.name===`name`||o.name===`title`||o.name.startsWith(`data-`)||o.name.startsWith(`x-`)||o.name.startsWith(`@`)){e.setAttribute(o.name,o.value);continue}let i=t(o.name);o.value===``&&p.has(o.name)?a.push(`${n(i)}: true`):a.push(`${n(i)}: ${JSON.stringify(r(o.value))}`)}let o=i.textContent?.trim()??``,s=a.some(e=>e.startsWith(`value:`)),c=i.children.length>0;for(o!==``&&!s&&!c&&(a.push(`value: ${JSON.stringify(o)}`),i.textContent=``),e.setAttribute(`x-component:${f}`,`{ ${a.join(`, `)} }`);i.firstChild;)e.appendChild(i.firstChild);i.replaceWith(e)}})}h();function h(){e(e=>{m(e)})}};
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

//# sourceMappingURL=autospark.password.js.map
