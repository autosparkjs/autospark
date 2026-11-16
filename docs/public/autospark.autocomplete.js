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
         边框重合（负距吃掉单侧内距+边框）；首/尾钮外侧圆角匹配盒饰、其余清除；\r
         stretch 等高 + 纵向负距全高贴上下边框（textarea 形态照常随盒高） ---------- */\r
    .asc-field-actions {\r
      display: contents;\r
    }\r
    .asc-field-box .asc-field-action {\r
      border-color: var(--asc-field-line);\r
      border-radius: 0;\r
      align-self: stretch;\r
      margin-block: calc(\r
        -1 *\r
          (\r
            var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2 +\r
              var(--auto-border-size, var(--asc-field-border-size, 1px))\r
          )\r
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
       控件与钮零距贴死）——组靠控件侧一钮留 0.4em 缝（镜像装饰出口间距标尺），\r
       DOM 序中 prefix/suffix 出口为空时同样成立 */\r
    .asc-field-box .asc-field-actions-before .asc-field-action:last-child {\r
      margin-inline-end: 0.4em;\r
    }\r
    .asc-field-box .asc-field-actions-after .asc-field-action:first-child {\r
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
`}a();function a(){e(e=>{i(e)})}var o=`<!--
    autospark.autocomplete 自动补全输入（ADR-0027）——触发器组件：**复制 input 结构
    而非嵌套消费**（input-number 先例：输入事件被建议管道消费，嵌套则两层语义互渗 +
    跨插件产物依赖；共享面已由 field 骨架继承覆盖，ADR-0020）。真原生 input +
    .asc-field-box 盒饰（input 同款 chrome），原生键盘/IME/自动填充全保留。

    建议面板（panel.html，内部组件 autospark-autocomplete-panel）不自建弹层——复用
    x-popover 指令机制（trigger:click 形态，ADR-0022 协议沿袭）：触发器包裹 span 即
    popover 宿主，面板渲染进 body 覆盖物容器，fit 两段合成宽度匹配（uid 配对测盒饰宽
    补 min-width，select 同款）。面板 ↔ 触发器通信走 scope 链：面板读 items/
    activeValue/loading 呈现，写哨兵键 pickTick/pickValue（选项点击）、hoverTick/
    hoverValue（悬停高亮）回传，mounted/unmounted 沿链写 open。

    开合模型（ADR-0027 决策 5）：popover click toggle 为底座，组件补 focus 确保开
    （真实点击 latch 防双 toggle 竞态）/ 输入确保开（已关状态输入即重开）/ 建议空自动关。

    建议数据源双通道（决策 3）：fetch props 函数引用在场全权接管（(query)=>Promise，
    次序守卫防过期回包）；缺席走 suggestions 本地包含过滤（query 空显示全量）。
    debounce 默认 300ms；IME 组合态守卫（composing 期不驱动建议管道）。

    值桥（文本语域，ADR-0020 input 范式对齐）：宿主 el.value 劫持 ↔ 内层原生控件；
    输入路径原生事件自然冒泡（x-model 直收零手动派发）；pick 路径程序化写控件后
    三派发——input（冒泡自原生控件，x-model 回写）+ change（detail={value}）+
    select（detail={value}，仅选中建议时触发）；清除路径 input 派发（静默不驱动建议）。

    键盘（决策 8，select 同款高亮漫游模型）：上下移动高亮（跳过禁用项、首尾环绕，
    未开先开）/ Enter 开态确认当前高亮（preventDefault 防误触发表单；无高亮关面板；
    关态原生放行）/ ESC 归 popover 打开栈（机制继承）/ Tab 自然移焦。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-autocomplete + .asc-field-box 盒饰）；
     data-open 由 mounted JS 通道同步，根上无动态绑定（T4=B）；disabled/readonly/status
     经 field 骨架通道（data() 不重复声明，ADR-0020 决策 3） -->
<span
  class="asc-autocomplete asc-field-box"
  x-define="autospark.autocomplete"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        // —— 实例私有变量（_locals 通道：非响应式、不进聚合视图，仅 this.<key> 访问；
        //     定时器句柄/防抖标记/竞态旗是官方典型用途，ADR-0057）——
        debounceTimer: null,   // 待发防抖计时器句柄（null 无待发）
        fetchSeq: 0,           // fetch 在途次序号（自增；回包序号不一致即过期丢弃）
        silent: false,         // 静默旗（pick/清除路径手动派发 input 不驱动建议管道）
        lastHostClickAt: 0,    // 组件内真实点击时刻（focus 确保开的竞态 latch，决策 5）
        composing: false,      // IME 组合态（composing 期不驱动建议管道，决策 3）
        focused: false,        // 控件聚焦态（focusin/focusout 维护——比 activeElement 现查稳）
        lastValue: "",         // 值缓存（劫持 getter 的控件缺位兜底 / 外部同步防回环基准）
        initDone: false,       // 初始化窗口标志（劫持 setter 重放识别门闩，ADR-0020）
        data: () => ({
            value: "",        // 文本语域非受控初值 / 单向同步值（受控真相走宿主 x-model——el.value 桥，ADR-0020）
            suggestions: [],  // 建议源 string[] | { value, label?, disabled? }[]（经状态引用注入——字面量数组有引擎死环缺陷）
            fetch: null,      // 异步建议通道：action 名字符串（经 scope.getAction 延迟解析，ADR-0027 决策 3）或函数引用（兼容位）；在场全权接管本地过滤
            debounce: 300,    // 输入防抖 ms（0 即时；fetch 与本地过滤共用）
            placeholder: "",  // 占位文案（空时走 i18n 词典 autocomplete.placeholder 键，回退「请输入」）
            clearable: false, // 清除钮（值非空且可交互时可见）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            uid: "",          // 实例唯一标识（根 data-asc-autocomplete-uid 载体——面板宽度配对键，select 同款）
            items: [],        // 归一化建议列表 [{ value, label, disabled }]（面板 x-for 数据源；解析管道整体替换）
            activeIndex: -1,  // 键盘高亮索引（items 内；-1 无高亮；建议重建即复位）
            activeValue: null,// 高亮项值（面板 :data-active 比较基准——值通道免疫列表重建）
            loading: false,   // fetch 在途（触发器 loading 图标 + 面板 x-loading 遮罩）
            hasValue: false,  // 当前有值（清除钮可见性驱动）
            open: false,      // 建议面板开合态（面板 mounted/unmounted 沿链写回）
            pickTick: 0,      // 选中哨兵（面板选项点击写：自增必变免疫同值去重；触发本组件选中流程，ADR-0022 决策 2）
            pickValue: null,  // 选中哨兵携带值
            hoverTick: 0,     // 悬停高亮哨兵（面板 mouseenter 写——高亮跟随指针，ADR-0027 新增协议成员）
            hoverValue: null, // 悬停哨兵携带值
        }),
        methods: {
            // 触发器包裹 span（popover 宿主；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-autocomplete-trigger");
            },
            // 内层原生控件（每查现取）
            nativeEl() {
                return this.el.querySelector(".asc-autocomplete-native");
            },
            // 建议归一化：string 元素升格 { value, label }；对象元素补 label 缺省与 disabled 布尔化
            normalizeList(list) {
                return (Array.isArray(list) ? list : []).map((s) => {
                    if (typeof s === "object" && s !== null) {
                        return {
                            value: s.value,
                            label: s.label != null ? s.label : s.value,
                            disabled: !!s.disabled,
                        };
                    }
                    return { value: s, label: s, disabled: false };
                });
            },
            // 本地过滤（fetch 缺席通道）：query 空显示全量；否则对 label·value 不区分大小写包含匹配
            filterLocal(query) {
                const kw = String(query ?? "").trim().toLowerCase();
                const src = this.normalizeList(this.data.suggestions);
                if (kw === "") return src;
                return src.filter(
                    (o) =>
                        String(o.label ?? "").toLowerCase().includes(kw) ||
                        String(o.value ?? "").toLowerCase().includes(kw),
                );
            },
            // fetch 通道在场判定（action 名或函数引用均可接管本地过滤）
            hasFetch() {
                return !!this.resolveFetch();
            },
            // 建议应用（解析出口统一收口）：整体替换 + 高亮复位 + 开合规则
            // （建议在场且控件聚焦确保开 / 建议空自动关）
            applyItems(list) {
                this.data.items = list;
                this.data.activeIndex = -1;
                this.syncActive();
                if (list.length > 0) {
                    if (this.focused) this.openPanel();
                } else {
                    this.closePanel();
                }
            },
            // fetch 通道解析（ADR-0027 决策 3）：action 名字符串经 scope.getAction 延迟
            // 解析（支持晚注册；engine.actions[name] 与 getAction 返回描述符，命令式
            // 调用取 .handle）；函数引用形态为兼容位（autostore 对状态函数见函数即求值
            // ——props 值对象里的函数引用经表达式读取即被求值，常态不可达）
            resolveFetch() {
                const raw = this.data.fetch;
                if (typeof raw === "function") return raw;
                if (typeof raw === "string" && raw.trim() !== "") {
                    const act = this.scope.getAction(raw.trim());
                    if (act && typeof act.handle === "function") return act.handle;
                }
                return null;
            },
            // 即时解析：fetch 通道（次序守卫：过期回包静默丢弃）或本地过滤
            resolveNow(query) {
                if (this.data.disabled || this.data.readonly) return;
                const fn = this.resolveFetch();
                if (fn) {
                    const cur = ++this.fetchSeq;
                    this.data.loading = true;
                    Promise.resolve()
                        .then(() => fn.call(null, query))
                        .then((r) => {
                            if (cur !== this.fetchSeq) return; // 过期回包（期间又有新输入/选中）
                            this.data.loading = false;
                            this.applyItems(this.normalizeList(r));
                        })
                        .catch(() => {
                            if (cur !== this.fetchSeq) return;
                            this.data.loading = false;
                            this.applyItems([]);
                        });
                } else {
                    this.applyItems(this.filterLocal(query));
                }
            },
            // 防抖调度（immediate = true 跳过防抖即时解析）：重排前清旧计时器；到期时
            // 值已被新输入取代则跳过（新输入自会重排）
            scheduleResolve(immediate) {
                const n = this.nativeEl();
                if (!n || this.data.disabled || this.data.readonly) return;
                const q = String(n.value ?? "");
                this.cancelPending();
                const ms = Math.max(0, Number(this.data.debounce) || 0);
                const self = this;
                const run = () => {
                    self.debounceTimer = null;
                    const now = self.nativeEl();
                    if (!now || String(now.value ?? "") !== q) return; // 已被新输入取代
                    self.resolveNow(q);
                };
                if (immediate || ms === 0) run();
                else this.debounceTimer = setTimeout(run, ms);
            },
            // 取消待发防抖与在途回包判定（pick / 清除后防旧建议重开面板）
            cancelPending() {
                if (this.debounceTimer !== null) {
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = null;
                }
                this.fetchSeq++; // 在途回包即刻过期
            },
            // 开面板：程序化派发触发器点击（popover click 触发模型 toggle；open 守卫防已开态误关）
            openPanel() {
                if (this.data.disabled || this.data.readonly) return;
                if (this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（「再点宿主关闭」——命令式
            // close 只回收命令式实例，声明式面板须走 toggle 模拟，ADR-0022 决策 1）
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 高亮同步（activeValue 为面板比较基准）
            syncActive() {
                const list = this.data.items ?? [];
                const i = this.data.activeIndex;
                this.data.activeValue = i >= 0 && i < list.length ? (list[i].value ?? null) : null;
            },
            // 高亮移动（dir = 1 下 / -1 上）：环找下一个非禁用项（首尾环绕；全禁用不动）
            moveActive(dir) {
                const list = this.data.items ?? [];
                if (list.length === 0) return;
                let i = this.data.activeIndex;
                for (let step = 0; step < list.length; step++) {
                    i = (i + dir + list.length) % list.length;
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }
                }
            },
            // 内部静默派发 input（pick / 清除路径的程序化赋值不触发原生事件；手动派发冒泡
            //     过宿主驱动 x-model 回写，但静默旗隔离建议管道）
            emitInput(n) {
                this.silent = true;
                try {
                    n.dispatchEvent(new Event("input", { bubbles: true }));
                } finally {
                    this.silent = false;
                }
            },
            // 选中流程（面板点击哨兵 / 键盘 Enter 汇聚点）：禁用与只读阻断；取消在途管道；
            //     写原生控件 + 三派发（input→x-model 回写 / change / select——detail 恒
            //     { value }）+ 关面板 + 焦点回控件（字符串归一比较，文本语域 7 与 "7" 互认）
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                const list = this.data.items ?? [];
                const item = list.find((o) => String(o.value) === String(v));
                if (!item || item.disabled) return;
                const n = this.nativeEl();
                if (!n) return;
                this.cancelPending();
                n.value = String(item.value);
                this.emitInput(n);
                this.data.hasValue = n.value !== "";
                this.data.activeIndex = -1;
                this.syncActive();
                this.emit("change", { value: item.value });
                this.emit("select", { value: item.value });
                this.closePanel();
                n.focus();
            },
            // 清除（内部动作件，点击不转发焦点）：清空 + input 静默派发 + 收面板 + 焦点回
            //     控件 + 阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.nativeEl();
                if (!n || n.value === "") return;
                this.cancelPending();
                n.value = "";
                this.emitInput(n);
                this.data.hasValue = false;
                this.data.items = [];
                this.data.activeIndex = -1;
                this.syncActive();
                this.closePanel();
                n.focus();
            },
            // 输入控件键盘导航：上下移动高亮（未开先开——建议在场直接开，否则即时解析一次）/
            //     Enter 开态确认或关面板（preventDefault 防误触发表单提交；关态原生放行）；
            //     ESC 与 Tab 不拦截（ESC 归 popover 打开栈——机制继承；Tab 自然移焦）
            onInputKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!this.data.open) {
                        if ((this.data.items ?? []).length > 0) this.openPanel();
                        else this.scheduleResolve(true);
                        return;
                    }
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                    if (this.data.open) {
                        event.preventDefault();
                        if (this.data.activeValue != null) this.pick(this.data.activeValue);
                        else this.closePanel();
                    }
                }
            },
        },
        mounted() {
            // —— 内层控件查询（每查现取，家族纪律）——
            const native = () => this.el.querySelector(".asc-autocomplete-native");

            // —— 值同步辅助（清除可见性驱动）——
            const syncLen = () => {
                const n = native();
                this.data.hasValue = !!n && String(n.value ?? "") !== "";
            };

            // —— 值桥（x-model 兼容协议，ADR-0020 决策 5 全套）：劫持前快照 expando
            //     （x-model 编译期可能已写初值）；快照归一值 + 初始化窗口标志 = 重放识别
            //     （scope.refresh 类换血不得把初值归属打回）；setter 经控件落值 + 值缓存 ——
            const prior = this.el.value;
            if (typeof prior === "string" && prior !== "") this.lastValue = prior;
            else if (this.data.value != null) this.lastValue = String(this.data.value);
            const snapshotNorm = String(prior ?? "");
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const n = native();
                    return n ? n.value : this.lastValue;
                },
                set: (v) => {
                    if (!this.initDone && String(v ?? "") === snapshotNorm) return;
                    this.lastValue = String(v ?? "");
                    const n = native();
                    if (n) n.value = this.lastValue;
                    syncLen();
                },
                configurable: true,
            });

            // —— 输入跟随（原生 input 冒泡经宿主；x-model 回写由宿主监听自理）：静默旗内
            //     的手动派发跳过；IME composing 期只同步值不驱动建议 ——
            this.el.addEventListener("input", (e) => {
                if (this.silent) return;
                const n = native();
                if (!n || e.target !== n) return;
                this.lastValue = n.value;
                syncLen();
                if (e.isComposing || this.composing) return;
                this.scheduleResolve();
            });
            // —— IME 组合态守卫（composition 事件冒泡，监听挂宿主委托）——
            this.el.addEventListener("compositionstart", (e) => {
                if (e.target === native()) this.composing = true;
            });
            this.el.addEventListener("compositionend", (e) => {
                if (e.target !== native()) return;
                this.composing = false;
                this.scheduleResolve();
            });

            // —— 真实点击 latch（capture 层，先于 popover 宿主 bubble 监听）：focus 确保
            //     开与 popover click toggle 的竞态防护基准（ADR-0027 决策 5）——
            this.el.addEventListener(
                "click",
                () => { this.lastHostClickAt = Date.now(); },
                true,
            );

            // —— 焦点态维护（focused 旗：applyItems 自动开面板的判据——比 activeElement
            //     现查稳，detached 容器/测试环境 activeElement 语义不一）+ focus 确保开
            //     （决策 5）：Tab 聚焦也开面板——建议在场直接开；fetch 通道缺席建议时
            //     不发空词请求（等输入驱动，antd 同款）；本地通道解析全量。真实点击短窗
            //     内跳过（该点击已由 popover click toggle 自理，防双 toggle 互关）——
            this.el.addEventListener("focusin", (e) => {
                if (e.target !== native()) return;
                this.focused = true;
                setTimeout(() => {
                    if (this.data.open) return;
                    if (Date.now() - this.lastHostClickAt < 400) return;
                    if ((this.data.items ?? []).length > 0) {
                        this.openPanel();
                        return;
                    }
                    if (!this.hasFetch()) this.scheduleResolve(true);
                }, 0);
            });
            this.el.addEventListener("focusout", (e) => {
                if (e.target !== native()) return;
                const to = e.relatedTarget;
                if (to instanceof Node && this.el.contains(to)) return; // 焦点组件内移动不置失焦
                this.focused = false;
            });

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：name 表单桥
            //     透传（原生直提交，ADR-0020 决策 6）+ uid 配对键落根属性 + 初值同步 +
            //     首次建议解析（仅本地通道——fetch 通道建议由输入驱动，空词不发请求，
            //     antd 同款）+ 劫持门闩放开 ——
            setTimeout(() => {
                const n = native();
                if (n) {
                    const nameAttr = this.el.getAttribute("name");
                    if (nameAttr != null) n.name = nameAttr;
                    n.value = this.lastValue;
                }
                syncLen();
                this.data.uid =
                    "asc-ac-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
                this.el.setAttribute("data-asc-autocomplete-uid", this.data.uid);
                this.initDone = true; // 初始化完成：劫持 setter 放开重放识别门闩
                if (!this.hasFetch()) this.scheduleResolve(true);
            }, 0);

            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作触发信号）——
            // value props 单向同步（非受控/外部受控无 x-model 场景）：值缓存防回环
            this.watch("value", ({ value }) => {
                const v = String(value ?? "");
                if (v === this.lastValue) return;
                this.lastValue = v;
                const n = native();
                if (n) n.value = v;
                syncLen();
            });
            // 建议源变化：本地通道即时重析（fetch 通道由 fetch props 全权接管，不消费 suggestions）。
            // 已见值比对幂等防御（color-picker 哨兵同款）：scope.refresh 类机制（i18n
            // ready 换血等）以**当前值**重跑监听——无变化重跑若照常重析，fetch 通道用例
            // 的「防抖窗口内只发一次请求」「IME composing 期不驱动」断言被多余解析打掉
            let lastSuggestions = this.data.suggestions;
            this.watch("suggestions", () => {
                if (this.data.suggestions === lastSuggestions) return;
                lastSuggestions = this.data.suggestions;
                setTimeout(() => {
                    if (!this.hasFetch()) this.resolveNow(String(native()?.value ?? ""));
                }, 0);
            });
            // fetch 函数变化（含首次注入）：即时重析一次（已见值比对幂等，同上）
            let lastFetch = this.data.fetch;
            this.watch("fetch", () => {
                if (this.data.fetch === lastFetch) return;
                lastFetch = this.data.fetch;
                setTimeout(() => this.resolveNow(String(native()?.value ?? "")), 0);
            });
            this.watch("activeIndex", () => { this.syncActive(); });
            this.watch("open", () => {
                this.el.toggleAttribute("data-open", !!this.data.open);
            });
            // 面板哨兵：选中（pickTick）/ 悬停高亮（hoverTick——值通道定位，未命中或禁用不动）
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("hoverTick", () => {
                const list = this.data.items ?? [];
                const i = list.findIndex(
                    (o) => String(o.value) === String(this.data.hoverValue),
                );
                if (i >= 0 && !list[i].disabled) this.data.activeIndex = i;
            });
        },
    }
  <\/script>
  <style global id="autospark-components-autocomplete">
    /* ---------- 触发器包裹层（popover 宿主）：盒内铺满，输入区即热区 ---------- */
    .asc-autocomplete-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      align-self: stretch;
      outline: none;
    }
    /* 原生控件裸化：外观由骨架盒饰承载（input 结构复制，ADR-0027 决策 1） */
    .asc-autocomplete-native {
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: inherit;
    }
    .asc-autocomplete-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-autocomplete-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-autocomplete-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-autocomplete-disable-color, inherit));
    }
    /* 禁用（骨架通道 [data-disabled]）：触发器 pointer-events 阻断 popover 点击
       toggle（popover 宿主监听不知禁用态，CSS 层拦截，select 同款） */
    .asc-autocomplete[data-disabled] .asc-autocomplete-trigger {
      pointer-events: none;
    }

    /* ---------- 动作件（清除钮 / loading 指示）：内部交互件，淡色常态 + 悬停正文色 ---------- */
    .asc-autocomplete-action {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-autocomplete-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-autocomplete-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-autocomplete-action:hover {
      color: var(--auto-color, var(--asc-autocomplete-action-hover, #606060));
    }
    .asc-autocomplete-action:active {
      transform: scale(0.92);
    }
    /* loading 指示（非交互件：不抢光标，图标自带旋转动画） */
    .asc-autocomplete-loading {
      cursor: default;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-autocomplete-native::placeholder,
    [data-dark] .asc-autocomplete-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-autocomplete-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-autocomplete-action,
    [data-dark] .asc-autocomplete-action {
      color: var(--auto-third-color, var(--asc-autocomplete-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-autocomplete-action:hover,
    [data-dark] .asc-autocomplete-action:hover {
      color: var(--auto-color, var(--asc-autocomplete-action-hover, #fafafa));
    }

    /* ══════════ 建议面板（autospark-autocomplete-panel，渲染进 body 覆盖物容器；
       外壳边框/阴影/定位归 popover-shell；样式与 select 下拉面板同款，ADR-0027 决策 9 ══════════ */
    .asc-autocomplete-panel {
      display: block;
      min-width: 100%;
      font-size: var(--auto-font-size, var(--asc-autocomplete-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-autocomplete-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-autocomplete-panel-color, #333333));
    }
    .asc-autocomplete-list {
      max-height: var(--asc-autocomplete-max-height, 15em);
      overflow-y: auto;
      padding: 0.25em 0;
      box-sizing: border-box;
    }
    /* 建议项：行式热区；悬停/高亮/禁用态经 data-* 属性选择器驱动（绑定通道写属性——
       假值整个移除即无态，绑定语义天然契合） */
    .asc-autocomplete-option {
      display: flex;
      align-items: center;
      gap: 0.4em;
      min-height: 2.2em;
      padding: 0.3em 0.75em;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .asc-autocomplete-option-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .asc-autocomplete-option[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-autocomplete-option-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-autocomplete-option[data-disabled] {
      color: var(--auto-disable-color, var(--asc-autocomplete-option-disabled, rgba(0, 0, 0, 0.28)));
      cursor: not-allowed;
      background: transparent;
    }
    .asc-autocomplete-option[data-disabled]:hover {
      background: transparent;
    }
    /* 空态（含过滤无匹配）：居中辅助色文案 */
    .asc-autocomplete-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-autocomplete-empty, rgba(0, 0, 0, 0.35)));
    }
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
    [dark] .asc-autocomplete-panel,
    [data-dark] .asc-autocomplete-panel {
      color: var(--auto-color, var(--asc-autocomplete-panel-color, #fafafa));
    }
    [dark] .asc-autocomplete-option[data-active],
    [data-dark] .asc-autocomplete-option[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-autocomplete-option-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-autocomplete-option[data-disabled],
    [data-dark] .asc-autocomplete-option[data-disabled] {
      color: var(--auto-disable-color, var(--asc-autocomplete-option-disabled, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-autocomplete-empty,
    [data-dark] .asc-autocomplete-empty {
      color: var(--auto-third-color, var(--asc-autocomplete-empty, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <!-- 默认段（替换 field 出口 fallback）：触发器包裹 span（popover 宿主；combobox
         语义与 aria 在内层真 input 上——ARIA combobox 模式）+ 清除钮（动作件）+
         loading 指示。占位文案走 props 与 i18n 词典（继承形态嵌套插槽出口被忽略，
         ADR-0056——不开真插槽，select 同款） -->
  <span
    class="asc-autocomplete-trigger"
    x-popover:autospark-autocomplete-panel
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
  >
    <input
      class="asc-autocomplete-native"
      data-autospark-control
      type="text"
      role="combobox"
      aria-haspopup="listbox"
      aria-autocomplete="list"
      :aria-expanded="open ? 'true' : 'false'"
      :placeholder="placeholder || (t('autocomplete.placeholder') === 'autocomplete.placeholder' ? '请输入' : t('autocomplete.placeholder'))"
      @keydown="onInputKeydown($event)"
    />
  </span>
  <i
    class="asc-autocomplete-action asc-autocomplete-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i
    class="asc-autocomplete-action asc-autocomplete-loading"
    x-if="loading"
    x-icon="'loading'"
  ></i>
</span>
`,s=`<!--
    autospark-autocomplete-panel 建议面板（ADR-0027）——autocomplete 的内部组件
    （非用户直接消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令
    机制（trigger:click）渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/宽度 fit
    随触发器）由 popover-shell 承载，本组件只贡献建议列表内容。

    与触发器组件（autospark.autocomplete）的通信走 scope 链（ADR-0022 决策 2 同款）：
    overlay 内容宿主恒以「open + dataContext:'host'」实例化本组件，聚合视图沿链读写
    触发器组件 data 域——
    - 读：items（x-for 数据源）/ activeValue（高亮基准）/ loading（x-loading 遮罩）；
    - 写：哨兵键 pickTick/pickValue（建议项点击）、hoverTick/hoverValue（悬停高亮
      回传）——面板模板不能跨组件边界调触发器组件 method（x-on 组件 method 查找不
      穿透父组件），自增哨兵免疫同值去重；事件表达式用逗号运算符单表达式形态（分号
      多语句依赖新版引擎回退，旧产物不可用）；
    - 开合态：mounted/unmounted 沿链写 open（触发器侧 data-open 同步）。

    宽度匹配触发器盒饰（select 同款两段合成）：popover 的 fit 基准是触发器内容区
    （popover 宿主元素，不含盒饰 padding）——按根属性 data-asc-autocomplete-uid 配对
    测盒饰宽，补写 shell 面板 min-width（fit 持续写 width，min-width 抬到盒宽；每次
    打开新实例重测）。空态文案走 i18n 词典 autocomplete.empty 键（回退「暂无建议」）。
-->
<div class="asc-autocomplete-panel" x-define="autospark-autocomplete-panel">
  <script setup>
    {
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生 data-open）
            this.data.open = true;
            // 宽度匹配触发器盒饰：按 uid 配对测盒饰宽补 shell 面板 min-width
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-autocomplete-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
            // 高亮项滚动跟随（键盘导航可见性；列表在面板内现查）
            const scrollActive = () => {
                const el = this.el.querySelector(".asc-autocomplete-option[data-active]");
                el?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(scrollActive, 0);
            this.watch("activeValue", () => { setTimeout(scrollActive, 0); });
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- 建议列表：x-loading 遮罩（fetch 在途）+ template 形态 x-for（空态行随容器） -->
  <div class="asc-autocomplete-list" x-loading="loading">
    <template x-for="option of items" :key="option.value">
      <div
        class="asc-autocomplete-option"
        x-bind:data-active="activeValue != null && String(option.value) === String(activeValue)"
        x-bind:data-disabled="!!option.disabled"
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"
        x-on:mouseenter="hoverTick = hoverTick + 1, hoverValue = option.value"
      >
        <span class="asc-autocomplete-option-label" x-text="option.label"></span>
      </div>
    </template>
    <div
      class="asc-autocomplete-empty"
      x-if="!loading && !(items && items.length > 0)"
      x-text="t('autocomplete.empty') === 'autocomplete.empty' ? '暂无建议' : t('autocomplete.empty')"
    ></div>
  </div>
</div>
`,c=`autospark.autocomplete`,l=`autospark-autocomplete-panel`,u=new Set([`disabled`,`readonly`,`clearable`]);function d(e){e.components[c]=o,e.components[l]=s,e.precompile?.(e=>{for(let i of Array.from(e.el.querySelectorAll(`x-autocomplete`))){let e=document.createElement(`span`),a=[];for(let o of Array.from(i.attributes))o.name.startsWith(`:`)?a.push(`${n(t(o.name.slice(1)))}: (${o.value})`):o.name===`class`||o.name===`style`||o.name===`id`||o.name===`name`||o.name.startsWith(`data-`)||o.name.startsWith(`x-`)||o.name.startsWith(`@`)?e.setAttribute(o.name,o.value):o.value===``&&u.has(o.name)?a.push(`${n(t(o.name))}: true`):a.push(`${n(t(o.name))}: ${JSON.stringify(r(o.value))}`);for(e.setAttribute(`x-component:${c}`,`{ ${a.join(`, `)} }`);i.firstChild;)e.appendChild(i.firstChild);i.replaceWith(e)}})}f();function f(){e(e=>{d(e)})}};
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

//# sourceMappingURL=autospark.autocomplete.js.map
