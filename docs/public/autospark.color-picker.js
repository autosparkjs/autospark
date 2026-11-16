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
`}n();function n(){e(e=>{t(e)})}var r=`<!--
    autospark.color-picker 颜色选择器（ADR-0028）——触发器组件：Field 盒饰形态
    （.asc-field-box，select 同款 chrome）+ 色块预览 + hex 文案。取色面板不自建弹层，
    复用 x-popover 指令机制呈现（trigger:click，ADR-0060）：内层触发器元素即 popover
    宿主，面板组件 autospark-color-panel（panel.html，连字符注册名免疫 attr 参数点号
    切分）渲染进 body 覆盖物容器，固定宽度（无 fit——与 select 宽度匹配的分叉点，
    ADR-0028 决策 6）。

    面板 ↔ 触发器通信走 scope 链（零 DOM 事件、零 uid 配对，ADR-0123 决策 2 同款）：
    - 读：h/s/v（thumb 定位）/ hueColor（SV 面板底色）/ liveHex（hex 输入与色板回显）/
      presets / disabled；
    - 写·直写键：拖拽连续写 h/s/v（连续值每步互异，无同值去重面——对照 select 的哨兵
      键仅用于离散交互）；
    - 写·哨兵键：pickTick/pickValue（预设点击）、applyTick/applyHex（hex 输入应用）、
      commitTick（拖拽结束提交——提交恒在 pointerup，拖拽不刷 change 事件流）；
    - 开合态：面板 mounted/unmounted 沿链写 open（aria-expanded 同步）。

    双真相模型（ADR-0028 决策 7）：value（提交值，"#rrggbb" 六位小写 hex——空值/非法
    归一 #000000，不支持空值态）与 h/s/v（编辑值）两域；liveHex/hueColor 为派生态
    （JS 通道维护——绑定表达式不能调组件 methods，家族纪律）；watch("value") 以
    hsvToHex(h,s,v) === norm 幂等守卫防自写回环（HSV→RGB 整数化往返精确）。

    值桥（x-model 兼容协议，对齐 ADR-0020）：宿主 el.value 劫持 ↔ data.value；
    提交路径（拖拽结束 / 预设点击 / hex 应用）手动派发 input（非冒泡，x-model 回写）+
    change（冒泡，detail = { value }，外层消费）；内嵌 input[type=hidden] 表单载体
    （name 透传，原生直提交）。
-->
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-color-picker + .asc-field-box 盒饰，
     ADR-0020 消费契约）；data-open 由 mounted JS 通道同步，根上无动态绑定（T4=B） -->
<span
  class="asc-color-picker asc-field-box"
  x-define="autospark.color-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "#000000", // "#rrggbb" 非受控初值 / 单向同步值（空值/非法归一 #000000；受控真相走宿主 x-model）
            presets: [],      // 预设色板 ["#rrggbb", ...]（状态引用注入——字面量数组触发 props 更新死循环，ADR-0019 后果 2）
            name: "",         // 表单提交名（元素名形态经属性折叠为 props；值对象形态走宿主 name 属性——props 优先）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            committed: "#000000", // 已提交归一值（真相源：劫持 getter / 载体 / 派发出口。props.value 是
                                  // 引擎注入通道——绑定重复求值会以原始值重写 data.value，归一值不回写
                                  // 该键、由本键承载，select 的 data.value 直写语义在此不可复制）
            h: 0,             // 色相 0-360（面板 H 条 / SV 底色驱动）
            s: 0,             // 饱和度 0-1（面板 SV 横轴）
            v: 0,             // 明度 0-1（面板 SV 纵轴，1 在顶）
            hueColor: "#ff0000", // SV 面板底色（hsv(h,1,1)，绑定通道消费）
            liveHex: "#000000",  // 编辑态色值（hsv 派生；触发器色块/hex 文案/面板回显）
            open: false,      // 面板开合态（面板 mounted/unmounted 沿链写回；aria-expanded 驱动）
            pickTick: 0,      // 预设点击哨兵（自增必变免疫同值去重）
            pickValue: "",    // 预设点击携带色值
            applyTick: 0,     // hex 输入应用哨兵
            applyHex: "",     // hex 输入应用携带文本
            commitTick: 0,    // 拖拽结束提交哨兵（提交恒在 pointerup——拖拽不刷 change 事件流）
        }),
        methods: {
            // —— 归一器：接受 #rgb/#rrggbb/无 # 前缀/大小写；空值与非法归一 #000000
            //    （不支持空值态，ADR-0028 决策 7）——
            normalizeHex(v) {
                if (typeof v !== "string") return "#000000";
                let t = v.trim().replace(/^#/, "");
                if (/^[0-9a-fA-F]{3}$/.test(t)) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
                if (!/^[0-9a-fA-F]{6}$/.test(t)) return "#000000";
                return "#" + t.toLowerCase();
            },
            // —— HSV 模型（标准公式自实现，零第三方库——路线图张力已裁定，ADR-0028 决策 5）——
            hexToRgb(hex) {
                const t = hex.slice(1);
                return [
                    parseInt(t.slice(0, 2), 16),
                    parseInt(t.slice(2, 4), 16),
                    parseInt(t.slice(4, 6), 16),
                ];
            },
            rgbToHsv(r, g, b) {
                r /= 255; g /= 255; b /= 255;
                const mx = Math.max(r, g, b);
                const mn = Math.min(r, g, b);
                const d = mx - mn;
                let h = 0;
                if (d !== 0) {
                    if (mx === r) h = ((g - b) / d) % 6;
                    else if (mx === g) h = (b - r) / d + 2;
                    else h = (r - g) / d + 4;
                    h *= 60;
                    if (h < 0) h += 360;
                }
                return [h, mx === 0 ? 0 : d / mx, mx];
            },
            hsvToRgb(h, s, v) {
                const c = v * s;
                const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
                const m = v - c;
                let r = 0, g = 0, b = 0;
                if (h < 60) { r = c; g = x; }
                else if (h < 120) { r = x; g = c; }
                else if (h < 180) { g = c; b = x; }
                else if (h < 240) { g = x; b = c; }
                else if (h < 300) { r = x; b = c; }
                else { r = c; b = x; }
                return [
                    Math.round((r + m) * 255),
                    Math.round((g + m) * 255),
                    Math.round((b + m) * 255),
                ];
            },
            hsvToHex(h, s, v) {
                const parts = this.hsvToRgb(h, s, v);
                const p = (n) => n.toString(16).padStart(2, "0");
                return "#" + p(parts[0]) + p(parts[1]) + p(parts[2]);
            },
            // 派生态重算（h/s/v 变化 → liveHex/hueColor）
            recomputeLive() {
                const h = Number(this.data.h) || 0;
                const s = Number(this.data.s) || 0;
                const v = Number(this.data.v) || 0;
                this.data.liveHex = this.hsvToHex(h, s, v);
                this.data.hueColor = this.hsvToHex(h, 1, 1);
            },
            // 外部值应用（归一 + hsv 重建 + 派生态 + 载体；幂等守卫防自写回环——
            // 内部 commit 写 value 后本回调再入时 norm === liveHex 短路）。liveHex
            // 直采外部归一值（HSV 往返有 1bit 舍入漂移——thumb 定位取 hsv，回显取 norm）
            applyExternal(v) {
                const norm = this.normalizeHex(v);
                if (norm === this.data.committed) return;
                this.data.committed = norm;
                const rgb = this.hexToRgb(norm);
                const hsv = this.rgbToHsv(rgb[0], rgb[1], rgb[2]);
                this.data.h = hsv[0];
                this.data.s = hsv[1];
                this.data.v = hsv[2];
                this.data.liveHex = norm;
                this.data.hueColor = this.hsvToHex(hsv[0], 1, 1);
                this.syncCarrier();
            },
            // 提交（值落定 + 双派发：input→x-model 回写非冒泡；change→外层 detail={value}）
            commit() {
                this.data.committed = this.data.liveHex;
                this.data.value = this.data.liveHex; // 回写 props 通道（单向同步场景跟随提交值）
                this.syncCarrier();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.committed } }),
                );
            },
            // 表单载体同步（hex 字符串域 + 禁用出表）
            syncCarrier() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                c.value = String(this.data.committed ?? "");
                c.disabled = !!this.data.disabled;
            },
            // 提交名同步（props.name 优先，回退宿主属性——元素名/值对象双形态通道）
            syncName() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-color-picker-trigger");
            },
            // 开合态副作用：aria-expanded 同步（JS 直写无 T4=B 约束）
            syncOpen() {
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(!!this.data.open));
            },
            // 可交互同步：禁用时触发器退出焦点序 + 载体出表
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                this.syncCarrier();
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle）
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 关面板：程序化派发点击走 popover 自有 toggle 通道（声明式面板无命令式句柄，
            //     select 同款绕行，ADR-0022 决策 1）；open 守卫防已关态误开
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            // 触发器键盘：Enter / Space 开面板（面板内键盘调色留 a11y 增量批，ADR-0028 遗留）
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.openPanel();
                }
            },
        },
        mounted() {
            // —— 值桥（x-model 兼容协议，ADR-0028 决策 7 对齐 ADR-0020）：宿主 el.value
            //     劫持为 hex 字符串语域——劫持前快照 expando（x-model 编译期可能已写初值）；
            //     无 x-model 时回退 props.value 初值（快照序：expando > props.value）——
            const prior = this.el.value;
            const initV = typeof prior === "string" && prior !== "" ? prior : this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => self.data.committed,
                set: (v) => {
                    const norm = self.normalizeHex(v);
                    if (norm === self.data.committed) return; // 归一等值守卫（x-model 回写环）
                    self.applyExternal(v);
                },
                configurable: true,
            });
            this.applyExternal(initV);

            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）——
            setTimeout(() => {
                this.syncName();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            // —— props / 哨兵 / 编辑态跟随（回调收 { value } 信封对象，此处只用作触发
            //     信号，家族惯用法）——
            // value 单向同步（props / 劫持 setter / x-model 回读共用收口）。
            // 已见值比对幂等防御（input-number 同款）：x-model 场景 value props 恒缺省
            // （#000000），scope.refresh 类无变化重跑若照常应用会把 expando 注入的初值
            // 打回缺省——同值跳过，真实变化才应用
            let lastPropsValue = this.data.value;
            this.watch("value", ({ value: v }) => {
                if (v === lastPropsValue) return;
                lastPropsValue = v;
                this.applyExternal(v);
            });
            // 拖拽直写键（面板沿链写）：连续重算派生态（提交在 commitTick）
            this.watch("h", () => { this.recomputeLive(); });
            this.watch("s", () => { this.recomputeLive(); });
            this.watch("v", () => { this.recomputeLive(); });
            // 离散交互哨兵：预设点击 / hex 输入应用 / 拖拽结束提交。
            // 哨兵已见值比对幂等防御：scope.refresh 类机制（如 i18n 插件 ready 的首渲染
            // 换血）会以**当前哨兵值**重跑监听——无变化重跑若照常执行回调体，会把「哨兵
            // 未触发时的空载荷（pickValue/applyHex 缺省）」归一成 #000000 误应用，打掉
            // 已注入的初值（实测第 18 批全量 color-picker 9 挂的根因）。同值跳过，哨兵
            // 真正自增才执行（checkbox 值桥同款防御家族）
            const sentineled = (key, fn) => {
                let last = this.data[key];
                this.watch(key, () => {
                    if (this.data[key] === last) return;
                    last = this.data[key];
                    fn();
                });
            };
            sentineled("pickTick", () => {
                const norm = this.normalizeHex(this.data.pickValue);
                if (norm === this.data.committed) return; // 同值不派发
                this.applyExternal(norm);
                this.commit();
            });
            sentineled("applyTick", () => {
                const norm = this.normalizeHex(this.data.applyHex);
                if (norm === this.data.committed) return;
                this.applyExternal(norm);
                this.commit();
            });
            sentineled("commitTick", () => {
                if (this.data.liveHex !== this.data.committed) this.commit(); // 未移动的按压不派发
            });
            this.watch("open", () => { this.syncOpen(); });
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-color-picker">
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（select 同款），光标手型 ---------- */
    .asc-color-picker {
      cursor: pointer;
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */
    .asc-color-picker[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-color-picker[data-disabled] .asc-color-picker-trigger {
      pointer-events: none;
    }

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（select 同款）；可聚焦 ---------- */
    .asc-color-picker-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      margin-inline: calc(-1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem)));
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));
      align-self: stretch;
      outline: none;
    }
    /* 色块预览：底色 = liveHex（内联绑定通道）；边框恒细线（色值过浅时可辨） */
    .asc-color-picker-swatch {
      flex: none;
      box-sizing: border-box;
      width: 1.35em;
      height: 1.35em;
      border: var(--auto-border-size, var(--asc-color-picker-swatch-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-color-picker-swatch-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-color-picker-swatch-radius, 0.25rem));
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    }
    /* hex 文案（编辑态实时回显） */
    .asc-color-picker-hex {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-color-picker-color, #333333));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换（变量链不变） ---------- */
    [dark] .asc-color-picker-hex,
    [data-dark] .asc-color-picker-hex {
      color: var(--auto-color, var(--asc-color-picker-color, #fafafa));
    }

    /* ══════════ 取色面板（autospark-color-panel，渲染进 body 覆盖物容器；样式经
       本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════
       注：SV 面板白/黑叠加与 H 条七色谱为 HSV 色彩模型常数（非语义色，不参与主题化） */
    .asc-color-panel {
      display: block;
      box-sizing: border-box;
      width: var(--asc-color-panel-width, 15em);
      padding: 0.8em;
      font-size: var(--auto-font-size, var(--asc-color-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-color-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-color-panel-color, #333333));
    }
    /* SV 面板：底色 = hueColor（内联绑定）+ 双层渐变叠加（横向白→透明 / 纵向透明→黑）；
       touch-action 拖拽防页面滚动 */
    .asc-color-sv {
      position: relative;
      height: 10em;
      border-radius: var(--auto-border-radius, var(--asc-color-sv-radius, 0.375rem));
      background-image:
        linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0)),
        linear-gradient(to top, #000000, rgba(0, 0, 0, 0));
      cursor: crosshair;
      touch-action: none;
    }
    .asc-color-sv-thumb {
      position: absolute;
      box-sizing: border-box;
      width: 0.9em;
      height: 0.9em;
      border: 0.14em solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
      pointer-events: none; /* 命中交给面板本体（拖拽语义整体承载） */
    }
    /* H 条：七色谱恒定渐变（色环展开，模型常数） */
    .asc-color-hue {
      position: relative;
      margin-top: 0.7em;
      height: 0.7em;
      border-radius: 9999px;
      background: linear-gradient(
        to right,
        #ff0000 0%,
        #ffff00 17%,
        #00ff00 33%,
        #00ffff 50%,
        #0000ff 67%,
        #ff00ff 83%,
        #ff0000 100%
      );
      cursor: crosshair;
      touch-action: none;
    }
    .asc-color-hue-thumb {
      position: absolute;
      top: 50%;
      box-sizing: border-box;
      width: 0.9em;
      height: 0.9em;
      border: 0.14em solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    /* 预设色板：网格排布 + hover 放大轻反馈；当前色 data-active 高亮环 */
    .asc-color-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4em;
      margin-top: 0.7em;
    }
    .asc-color-preset {
      box-sizing: border-box;
      width: 1.4em;
      height: 1.4em;
      padding: 0;
      border: var(--auto-border-size, var(--asc-color-preset-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-color-preset-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-color-preset-radius, 0.25rem));
      cursor: pointer;
      transition: transform 0.12s ease;
    }
    .asc-color-preset:hover {
      transform: scale(1.12);
    }
    .asc-color-preset[data-active] {
      box-shadow: 0 0 0 2px
        color-mix(
          in srgb,
          var(--auto-primary-color, var(--asc-color-panel-primary, #009aff)) 55%,
          transparent
        );
    }
    /* hex 输入行：当前色块回显 + 裸 input（select 过滤框同款形态） */
    .asc-color-hexrow {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-top: 0.7em;
    }
    .asc-color-hex-swatch {
      flex: none;
      box-sizing: border-box;
      width: 1.6em;
      height: 1.6em;
      border: var(--auto-border-size, var(--asc-color-preset-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-color-preset-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-color-swatch-radius, 0.3rem));
    }
    .asc-color-hex-input {
      flex: 1 1 auto;
      min-width: 0;
      box-sizing: border-box;
      border: none;
      outline: none;
      background: transparent;
      padding: 0.2em 0.1em;
      color: inherit;
      font: inherit;
      border-bottom: 1px solid transparent;
    }
    .asc-color-hex-input:focus {
      border-bottom-color: var(--auto-primary-color, var(--asc-color-panel-primary, #009aff));
    }
    /* 面板暗色兜底变体（shell 边框/底色已由 popover-shell 暗色块覆盖） */
    [dark] .asc-color-panel,
    [data-dark] .asc-color-panel {
      color: var(--auto-color, var(--asc-color-panel-color, #fafafa));
    }
    [dark] .asc-color-preset,
    [dark] .asc-color-hex-swatch,
    [data-dark] .asc-color-preset,
    [data-dark] .asc-color-hex-swatch {
      border-color: var(--auto-border-color, var(--asc-color-preset-border, #52525b));
    }
  </style>
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden）+ 触发器（popover 宿主 /
         焦点受让者 / combobox 语义）+ 色块预览 + hex 文案（绑定通道读 liveHex 实时回显） -->
  <input type="hidden" class="asc-color-picker-carrier" />
  <span
    class="asc-color-picker-trigger"
    x-popover:autospark-color-panel
    x-popover-options="{ trigger: 'click', padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="dialog"
    aria-expanded="false"
    aria-label="选择颜色"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-color-picker-swatch" :style="'background-color:' + liveHex"></span>
    <span class="asc-color-picker-hex" x-text="liveHex"></span>
  </span>
</span>
`,i=`<!--
    autospark-color-panel 取色面板（ADR-0028）——color-picker 的内部组件（非用户直接
    消费，无文档页；连字符注册名的成因见 index.ts）：经 x-popover 指令机制（trigger:click）
    渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/关闭触点）由 popover-shell 承载，
    本组件只贡献取色内容：SV 面板（div 双层 CSS 渐变 + thumb 百分比定位）+ H 条（七色谱
    恒定渐变）+ 预设色板 + hex 输入行。

    与触发器组件（autospark.color-picker）的通信走 scope 链（ADR-0123 决策 2，select
    面板同款）：overlay 内容宿主恒以「open + dataContext:'host'」实例化本组件，聚合视图
    沿链读写触发器组件 data 域——
    - 读：h/s/v（thumb 定位）/ hueColor（SV 底色，内联绑定）/ liveHex（hex 输入与色板
      回显，:value 绑定——归一后写回输入框）/ presets / disabled；
    - 写·直写键：拖拽连续写 h/s/v（连续值每步互异，无同值去重面——AutoStore 同值写入
      不通知 watcher，离散交互才需要哨兵）；
    - 写·哨兵键：pickTick/pickValue（预设点击）、applyTick/applyHex（hex 输入应用）、
      commitTick（拖拽结束提交——提交恒在 pointerup）；
    - 开合态：mounted/unmounted 沿链写 open。

    拖拽交互（真浏览器重点验证面）：pointerdown 在面板元素上 setPointerCapture（缺席
    环境降级为元素直挂监听——直派事件仍达）+ pointermove 连续写编辑值 + pointerup 写
    commitTick 提交。SVG 规避（ADR-0021 后果 1）：零 SVG 节点，thumb/渐变全 CSS。

    hex 输入：简式校验（#rgb/#rrggbb/无 # 前缀），非法回显当前色不应用；合法沿链写
    applyTick/applyHex（触发器侧完整归一）。
-->
<div class="asc-color-panel" x-define="autospark-color-panel">
  <script setup>
    {
        // 本组件零 props（overlay 宿主以空值实例化）、零自有状态——全部数据经 scope 链
        // 读写触发器组件域；data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        methods: {
            // 拖拽会话接线：捕获指针（缺席降级）+ move 连续写 + up 提交（写哨兵沿链）
            //   target 面板元素 / apply(ev) 写入函数 / done 提交哨兵键名
            bindDrag(e, selector, apply, doneKey) {
                const el = e.target instanceof Element ? e.target.closest(selector) : null;
                if (!el) return;
                e.preventDefault();
                const move = (ev) => { apply(ev, el); };
                const up = () => {
                    el.removeEventListener("pointermove", move);
                    el.removeEventListener("pointerup", up);
                    el.removeEventListener("pointercancel", up);
                    this.data[doneKey] = Number(this.data[doneKey] || 0) + 1;
                };
                el.setPointerCapture?.(e.pointerId);
                el.addEventListener("pointermove", move);
                el.addEventListener("pointerup", up);
                el.addEventListener("pointercancel", up);
                apply(e, el); // 按下即吸附到当前点位
            },
            // SV 面板按下：横向 → s（0-1 左起）、纵向 → v（1 顶 → 0 底）
            onSvDown(e) {
                if (this.data.disabled) return;
                this.bindDrag(e, ".asc-color-sv", (ev, el) => {
                    const rect = el.getBoundingClientRect();
                    const x = rect.width > 0 ? (ev.clientX - rect.left) / rect.width : 0;
                    const y = rect.height > 0 ? (ev.clientY - rect.top) / rect.height : 0;
                    this.data.s = Math.min(1, Math.max(0, x));
                    this.data.v = 1 - Math.min(1, Math.max(0, y));
                }, "commitTick");
            },
            // H 条按下：横向 → h（0-360 左起）
            onHueDown(e) {
                if (this.data.disabled) return;
                this.bindDrag(e, ".asc-color-hue", (ev, el) => {
                    const rect = el.getBoundingClientRect();
                    const x = rect.width > 0 ? (ev.clientX - rect.left) / rect.width : 0;
                    this.data.h = Math.min(1, Math.max(0, x)) * 360;
                }, "commitTick");
            },
            // 预设色点击：哨兵沿链写回（不关面板——连续试色语义，ADR-0028 决策 7）
            onPresetClick(color) {
                if (this.data.disabled) return;
                this.data.pickTick = Number(this.data.pickTick || 0) + 1;
                this.data.pickValue = color;
            },
            // hex 输入应用（原生 change = Enter/blur）：简式校验，非法回显当前色不应用
            onHexChange(e) {
                if (this.data.disabled) return;
                const input = e.target instanceof Element ? e.target : null;
                const t = String(input?.value ?? "").trim();
                const raw = t.replace(/^#/, "");
                const ok = /^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw);
                if (!ok) {
                    if (input) input.value = this.data.liveHex;
                    return;
                }
                this.data.applyTick = Number(this.data.applyTick || 0) + 1;
                this.data.applyHex = t;
            },
        },
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生 aria-expanded）
            this.data.open = true;
        },
        unmounted() {
            // 面板每次开合都是新实例（popover 无 keepalive，关闭即销毁）——关闭即复位开合态
            this.data.open = false;
        },
    }
  <\/script>
  <!-- SV 面板：底色 hueColor 内联绑定 + 双层渐变（白→透明横 / 透明→黑纵）经样式表叠加；
         thumb 百分比定位（s 横 / 1-v 纵，绑定通道读链上编辑值） -->
  <div class="asc-color-sv" :style="'background-color:' + hueColor" @pointerdown="onSvDown($event)">
    <span
      class="asc-color-sv-thumb"
      :style="'left:' + (s * 100) + '%;top:' + ((1 - v) * 100) + '%'"
    ></span>
  </div>
  <!-- H 条：七色谱恒定渐变（样式表）；thumb 百分比定位（h/360） -->
  <div class="asc-color-hue" @pointerdown="onHueDown($event)">
    <span class="asc-color-hue-thumb" :style="'left:' + (h / 360 * 100) + '%'"></span>
  </div>
  <!-- 预设色板（presets 在场）：色值直出（背景内联绑定）；当前色 data-active 高亮 -->
  <div class="asc-color-presets" x-if="presets && presets.length > 0">
    <template x-for="color of presets" :key="color">
      <button
        type="button"
        class="asc-color-preset"
        :style="'background-color:' + color"
        :data-active="String(color).toLowerCase() === liveHex"
        @click="onPresetClick(color)"
      ></button>
    </template>
  </div>
  <!-- hex 输入行：当前色块回显 + 输入框（:value 绑定归一回写；@change = Enter/blur 应用） -->
  <div class="asc-color-hexrow">
    <span class="asc-color-hex-swatch" :style="'background-color:' + liveHex"></span>
    <input
      class="asc-color-hex-input"
      type="text"
      spellcheck="false"
      :value="liveHex"
      @change="onHexChange($event)"
    />
  </div>
</div>
`,a=`autospark.color-picker`,o=`autospark-color-panel`;function s(e){e.components[a]=r,e.components[o]=i}c();function c(){e(e=>{s(e)})}};
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

//# sourceMappingURL=autospark.color-picker.js.map
