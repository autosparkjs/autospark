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
`}a();function a(){e(e=>{i(e)})}var o=`<!--
    autospark.textarea 多行文本框（ADR-0032）——原生增强路线：真实原生 <textarea>
    + 样式包裹，不自绘输入面（保原生可访问性：键盘 / IME / 自动填充 / 移动端兼容，
    ADR-0018 决策 7）。继承 autospark.field 表单域骨架（状态色通道 / 焦点态 /
    disabled 同步 / 盒饰 chrome，ADR-0020），本组件专注多行控件本身。

    与 autospark.input 的分工（ADR-0032 推翻 ADR-0020 决策 4「textarea 是 type 变体」）：
    多行能力独立成件，input 不再内置 textarea 形态。两者共享表单域骨架与主题令牌，
    但控件实现、样式细节、测试各自持有——值桥 / 计数 / 清除逻辑按「复制而非嵌套」
    先例在组件内自持（ADR-0021 方法论），避免 textarea → input 的依赖链与单行专属
    逻辑渗透。

    autosize（默认开启）：控件高度随内容自动增长，minRows（缺省取 rows）/ maxRows
    （默认 8，0 = 不限高）夹取，到顶后内部滚动；宽度变化经 ResizeObserver 重算。
    autosize 开启时强制 resize:none；关闭后尊重 resize 属性（缺省 vertical）。

    值通道（x-model 兼容协议，ADR-0020）：宿主 el.value 劫持 ↔ 内层原生控件——
    宿主为包裹层元素（无原生 value），x-model 写读都落劫持位；内层原生 textarea 的
    input 事件自然冒泡过宿主，x-model 监听直接命中。value props 为非受控初值 /
    单向同步（受控真相走 x-model）。

    表单提交（ADR-0020）：宿主 name 透传到内层原生 textarea——原生直提交。

    事件出口（组件默认封闭，原生事件经冒泡到外层消费）：
    - input / change：内层原生控件事件自然冒泡（x-model 与外层 @input/@change 直接消费）
    - 清除为内部动作件（data-autospark-action，点击不转发焦点），不派发自定义事件

    装饰面（ADR-0032）：不提供 prefix / suffix（单行 affix 习惯，多行盒内布局成本高）；
    actions 由 field 骨架继承，但本组件把融合按钮段由横向改排到控件上方 / 下方
    （pos: before 在上、after 在下），不与文本抢行宽。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-textarea + .asc-field-box 盒饰）；
     状态属性经 mounted 的 JS 通道同步（data-over），根上无动态绑定（T4=B） -->
<span
  class="asc-textarea asc-field-box"
  x-define="autospark.textarea"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",             // 非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥）
            placeholder: "",       // 占位文案（同步原生 placeholder）
            maxlength: 0,          // >0 同步原生 maxlength（原生输入截断）+ 计数分母（自动显示计数）
            rows: 2,               // 初始行数（原生 rows；同时作为 minRows 缺省值）
            minRows: 0,            // autosize 最小行数（0 = 取 rows）
            maxRows: 8,            // autosize 最大行数（0 = 不限高，到顶后内部滚动）
            autosize: true,        // 自动增高（默认开启；开启时强制 resize:none）
            resize: "",            // autosize 关闭时的原生拖拽："" 取 vertical ｜ none | vertical | horizontal | both
            clearable: false,      // 清除钮（值非空且可交互时可见；点击清空 + 派发 input + 焦点回控件）
            showCount: false,      // 计数显式开关（maxlength > 0 时无需开启即显示「len / max」）
            // —— 内部状态 ——
            hasValue: false,       // 当前有值（清除钮可见性驱动）
            countText: "",         // 计数文本（JS 侧构建——绑定通道对 props 后续注入不重算）
            countVisible: false,   // 计数可见性（showCount 或 maxlength > 0）
        }),
        methods: {
            // 清除：清空原生控件 + 手动派发 input（程序赋值不触发原生事件；冒泡过宿主
            // 驱动 x-model 回写 state）+ 焦点回控件；阻断冒泡（内部动作件，click 不外泄）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.el.querySelector(".asc-textarea-native");
                if (!n) return;
                n.value = "";
                n.dispatchEvent(new Event("input", { bubbles: true }));
                n.focus();
            },
        },
        mounted() {
            // —— 内层控件查询（每查现取，家族惯例）——
            const native = () => this.el.querySelector(".asc-textarea-native");
            // 当前值缓存（劫持 getter 的控件缺位兜底）
            let lastValue = "";

            // —— 自动增高：行高 × 行数夹取，内容超高时转内部滚动 ——
            // 宽度变化会改变折行数，故除 value 外还经 ResizeObserver 监听宽度
            const autoResize = () => {
                const n = native();
                if (!n) return;
                if (!this.data.autosize) {
                    // 交还原生拖拽：清内联高度 + 溢出转 auto（基类样式为 autosize
                    // 场景预设 overflow-y:hidden，关闭后须显式放开，否则内容被裁）
                    n.style.height = "";
                    n.style.overflowY = "auto";
                    return;
                }
                const cs = getComputedStyle(n);
                const lineHeight = parseFloat(cs.lineHeight) || 0;
                const padY =
                    (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
                const borderY =
                    (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
                const minRows = Math.max(
                    1,
                    Number(this.data.minRows) || Number(this.data.rows) || 2,
                );
                const maxRows = Math.max(0, Number(this.data.maxRows) || 0);
                // 行高不可读（consumer 把 line-height 设为 normal 等 → parseFloat 得 NaN）
                // 时放弃行数夹取：只随内容增高，避免 maxHeight 退化成内距高而误裁内容
                const minHeight = lineHeight > 0 ? lineHeight * minRows + padY + borderY : 0;
                const maxHeight =
                    lineHeight > 0 && maxRows > 0
                        ? lineHeight * maxRows + padY + borderY
                        : Infinity;
                n.style.height = "auto"; // 先归零再量内容（scrollHeight 才反映真实内容高）
                const contentHeight = n.scrollHeight + borderY;
                n.style.height = \`\${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px\`;
                n.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
            };

            // —— 计数与清除可见性同步（len 由原生控件现值读出；超限染色的 data-over
            //     落宿主属性，CSS 通道消费——JS 直写无 T4=B 约束）——
            const syncLen = () => {
                const n = native();
                const len = n ? String(n.value ?? "").length : 0;
                this.data.hasValue = len > 0;
                const max = Number(this.data.maxlength) || 0;
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;
                this.data.countVisible = !!this.data.showCount || max > 0;
                this.el.toggleAttribute("data-over", max > 0 && len > max);
            };

            // —— 值同步（外部 → 控件）——
            const syncValue = () => {
                const n = native();
                if (n) n.value = lastValue;
                syncLen();
                autoResize();
            };

            // —— 原生属性同步（props → 控件；绑定通道对 props 晚注入/后续变化不重算，
            //     走 JS 通道——button disabled 同款纪律，ADR-0012）——
            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                n.placeholder = String(this.data.placeholder ?? "");
                const ml = Number(this.data.maxlength) || 0;
                if (ml > 0) n.setAttribute("maxlength", String(ml));
                else n.removeAttribute("maxlength");
                n.rows = Math.max(1, Number(this.data.rows) || 2);
                // 表单提交载体：宿主 name 透传到原生控件（原生直提交，ADR-0020）
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
                // autosize 与原生拖拽互斥：开启时强制 none，关闭后尊重 resize 属性
                n.style.resize = this.data.autosize
                    ? "none"
                    : String(this.data.resize) || "vertical";
                autoResize();
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
                    autoResize();
                },
                configurable: true,
            });

            // —— 输入跟随（原生 input 冒泡经宿主）：值缓存 / 计数 / 自动增高 ——
            this.el.addEventListener("input", () => {
                const n = native();
                if (n) lastValue = n.value;
                syncLen();
                autoResize();
            });

            // —— 宽度变化重算（侧栏展开 / 窗口缩放改变折行数；只认宽度变化，避免
            //     自身写高度触发回环）——
            if (typeof ResizeObserver !== "undefined") {
                let lastWidth = 0;
                const ro = new ResizeObserver((entries) => {
                    const width = entries[0]?.contentRect?.width ?? 0;
                    if (Math.abs(width - lastWidth) < 1) return;
                    lastWidth = width;
                    autoResize();
                });
                const n = native();
                if (n) ro.observe(n);
            }

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                syncAttrs();
                syncValue();
                initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩（此后全量生效）
            }, 0);

            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });
            this.watch("showCount", () => { setTimeout(syncLen, 0); });
            this.watch("rows", () => { setTimeout(() => { syncAttrs(); autoResize(); }, 0); });
            this.watch("minRows", () => { setTimeout(autoResize, 0); });
            this.watch("maxRows", () => { setTimeout(autoResize, 0); });
            this.watch("autosize", () => { setTimeout(syncAttrs, 0); });
            this.watch("resize", () => { setTimeout(syncAttrs, 0); });
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
                autoResize();
            });
        },
    }
  <\/script>
  <style global id="autospark-components-textarea">
    /* ---------- 满宽惯例：多行输入默认占满可用宽（field 基座 inline-flex 收缩内容宽，
         input 等单行形态靠消费方给宽；textarea 惯例块级满宽——子样式拼接序在骨架后，胜） ---------- */
    .asc-textarea {
      width: 100%;
    }

    /* ---------- 原生控件裸化：外观由骨架盒饰（.asc-field-box）承载，控件本体透明铺满 ---------- */
    .asc-textarea-native {
      box-sizing: border-box;
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      height: auto;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      line-height: inherit;
      cursor: inherit;
      resize: none;
      overflow-y: hidden;
    }
    .asc-textarea-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-textarea-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-textarea-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-textarea-disable-color, inherit));
    }

    /* ---------- 宿主布局：纵向排布（控件 + 计数浮层 + actions 段），高度随内容放开 ---------- */
    .asc-textarea.asc-field-box {
      position: relative;
      height: auto;
      flex-direction: column;
      align-items: stretch;
      cursor: text;
    }

    /* ---------- 清除钮：绝对定位右上角（不占文本行宽；控件右侧预留内距避免压字） ---------- */
    .asc-textarea-clear {
      position: absolute;
      top: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2);
      inset-inline-end: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2);
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-textarea-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-textarea-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-textarea-clear:hover {
      color: var(--auto-color, var(--asc-textarea-action-hover, #606060));
    }
    .asc-textarea-clear:active {
      transform: scale(0.92);
    }

    /* ---------- 计数器：绝对定位右下角（不占文本行宽；控件底部预留内距避免压字）；
         超限（data-over 由 mounted 同步）染 danger ---------- */
    .asc-textarea-count {
      position: absolute;
      inset-block-end: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 4);
      inset-inline-end: var(--auto-input-padding, var(--asc-field-padding, 0.8rem));
      font-size: 0.75em;
      line-height: 1;
      white-space: nowrap;
      pointer-events: none;
      color: var(--auto-third-color, var(--asc-textarea-count, rgba(0, 0, 0, 0.35)));
    }
    .asc-textarea[data-over] .asc-textarea-count {
      color: var(--auto-danger-color, var(--asc-textarea-count-over, #ef4444));
    }

    /* 浮层在场时预留内距（:has 驱动，形态与 field 既有 :has 用法一致） */
    .asc-textarea:has(.asc-textarea-clear) .asc-textarea-native {
      padding-inline-end: 1.5em;
    }
    .asc-textarea:has(.asc-textarea-count) .asc-textarea-native {
      padding-block-end: 1.25em;
    }

    /* ---------- actions 段：field 的横向融合在本组件改为控件上 / 下整行（pos: before 在上、
         after 在下，右对齐）——按钮恢复自有描边与圆角，不与文本抢行宽。field 的融合规则
         用 !important 解除（选择器特异性跨产物顺序不稳定，显式让位最稳） ---------- */
    .asc-textarea .asc-field-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4em;
      justify-content: flex-end;
      width: 100%;
    }
    .asc-textarea .asc-field-actions-before {
      order: -1;
      margin-block-end: 0.4em;
    }
    .asc-textarea .asc-field-actions-after {
      margin-block-start: 0.4em;
    }
    .asc-textarea .asc-field-actions .asc-field-action {
      align-self: center !important;
      margin: 0 !important;
      border-width: var(--auto-border-size, var(--asc-field-border-size, 1px)) !important;
      border-style: solid !important;
      border-radius: var(--auto-border-radius, var(--asc-field-radius, 0.5rem)) !important;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-textarea-native::placeholder,
    [data-dark] .asc-textarea-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-textarea-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-textarea-clear,
    [data-dark] .asc-textarea-clear {
      color: var(--auto-third-color, var(--asc-textarea-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-textarea-clear:hover,
    [data-dark] .asc-textarea-clear:hover {
      color: var(--auto-color, var(--asc-textarea-action-hover, #fafafa));
    }
    [dark] .asc-textarea-count,
    [data-dark] .asc-textarea-count {
      color: var(--auto-third-color, var(--asc-textarea-count, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-textarea[data-over] .asc-textarea-count,
    [data-dark] .asc-textarea[data-over] .asc-textarea-count {
      color: var(--auto-danger-color, var(--asc-textarea-count-over, #e6696a));
    }
  </style>
  <!-- 默认段（替换 field 出口 fallback）：控件本体 + 功能动作件。计数与清除为浮层
       （不占文本行宽）；actions 由 field 渲染段承载，位置由上方 CSS 改为控件上 / 下 -->
  <textarea class="asc-textarea-native" data-autospark-control rows="2"></textarea>
  <i
    class="asc-textarea-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <span class="asc-textarea-count" x-if="countVisible">{{ countText }}</span>
</span>
`,s=`autospark.textarea`,c=new Set([`disabled`,`readonly`,`clearable`,`show-count`,`autosize`]);function l(e){e.components[s]=o,e.precompile?.(e=>{for(let i of Array.from(e.el.querySelectorAll(`x-textarea`))){let e=document.createElement(`span`),a=[];for(let o of Array.from(i.attributes)){if(o.name.startsWith(`:`)){a.push(`${n(t(o.name.slice(1)))}: (${o.value})`);continue}if(o.name===`class`||o.name===`style`||o.name===`id`||o.name===`name`||o.name===`title`||o.name.startsWith(`data-`)||o.name.startsWith(`x-`)||o.name.startsWith(`@`)){e.setAttribute(o.name,o.value);continue}let i=t(o.name);o.value===``&&c.has(o.name)?a.push(`${n(i)}: true`):a.push(`${n(i)}: ${JSON.stringify(r(o.value))}`)}let o=i.textContent?.trim()??``,l=a.some(e=>e.startsWith(`value:`)),u=i.children.length>0;for(o!==``&&!l&&!u&&(a.push(`value: ${JSON.stringify(o)}`),i.textContent=``),e.setAttribute(`x-component:${s}`,`{ ${a.join(`, `)} }`);i.firstChild;)e.appendChild(i.firstChild);i.replaceWith(e)}})}u();function u(){e(e=>{l(e)})}};
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

//# sourceMappingURL=autospark.textarea.js.map
