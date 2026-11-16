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
`}n();function n(){e(e=>{t(e)})}var r=`<!--\r
    autospark.rate 评分（自绘路线，无原生对应控件）——引擎内置 star 星形图标 ×N\r
    （x-for 渲染，max 可配），off 灰星底层 + on 亮星覆盖层（clip-path 百分比裁剪，\r
    100% 整星 / 50% 半星）。可访问性自持：role=slider 单焦点键盘模型（tabindex +\r
    aria-valuemin/now/max + Arrow 方向调分 + Home/End 归位），switch 的 role=switch\r
    同款自持范式（ADR-0018 决策 7 表单基座策略内的自绘例外形态）。继承\r
    autospark.field 骨架（状态色通道/焦点态/disabled 同步，裸态无盒饰）。\r
\r
    值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域（"0".."N"[.5]）——\r
    提交（点击/键盘）派发 input（x-model 回写非冒泡）+ change（detail={ value }\r
    冒泡供外层 @change="v = $event.detail.value" 一行回写）。value props 为非受控\r
    初值 / 单向同步值（受控真相走宿主 x-model）。\r
\r
    交互面：悬停预览（mousemove 半星粒度判定，mouseleave 恢复）；点击提交\r
    （clearable 在场时再次点击同分清零）；disabled/readonly 阻断（readonly 保留\r
    预览禁用——值不可变语义）。\r
\r
    表单提交：内嵌 input[type=hidden] 载体（data-autospark-control 标记——骨架\r
    disabled 同步落载体，禁用即出表），value = 当前数字字面串恒提交、name 透传宿主\r
    （state-button/switch 自绘控件同款代理——无原生真身，对照 slider 的 range 直\r
    提交分叉，ADR-0020 决策 6）。\r
-->\r
<!-- 根 class 拼接进骨架宿主（.asc-field + .asc-rate——裸态控件不加 .asc-field-box，\r
     状态色仍经 --asc-field-tone 消费，ADR-0020 决策 3）；aria/fill 由 mounted JS\r
     通道同步，根上无动态绑定（T4=B） -->\r
<span\r
  class="asc-rate"\r
  x-define="autospark.rate"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: 0,        // number 非受控初值 / 单向同步值（0-N；受控真相走宿主 x-model——el.value 数字语域桥）\r
            max: 5,          // 星形总数（>=1，非法归 5）\r
            allowHalf: false,// 半星粒度（悬停与提交均按 0.5 步进）\r
            clearable: false,// 再次点击同分清零\r
            // —— 内部状态 ——\r
            stars: [],       // 星形渲染数据源 [1..max]（x-for 消费；max 变化时重建）\r
        }),\r
        mounted() {\r
            // —— 内层元素查询（每查现取，家族纪律）——\r
            const starsEl = () => this.el.querySelector(".asc-rate-stars");\r
            const carrier = () => this.el.querySelector(".asc-rate-carrier");\r
            const items = () => Array.from(this.el.querySelectorAll(".asc-rate-item"));\r
\r
            // —— 数值工具（NaN 防御：非法归 0）——\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const maxNum = () => Math.max(1, Math.floor(num(this.data.max) ?? 5));\r
            const half = () => !!this.data.allowHalf;\r
            const clamp = (n) => Math.max(0, Math.min(maxNum(), num(n) ?? 0));\r
\r
            // —— 星形数组重建（响应式赋值驱动 x-for 重渲染）——\r
            const rebuild = () => {\r
                this.data.stars = Array.from({ length: maxNum() }, (_, i) => i + 1);\r
            };\r
\r
            // —— 合法值缓存（受控语域真相）与悬停预览态 ——\r
            let lastValue = 0;\r
            let hoverValue = null; // null = 非预览态\r
\r
            // —— 全视觉同步：aria 语义 + 表单载体 + 逐星点亮（预览态优先于实际值）——\r
            const syncVisual = () => {\r
                const v = hoverValue != null ? hoverValue : lastValue;\r
                const s = starsEl();\r
                if (s) {\r
                    s.setAttribute("aria-valuenow", String(v));\r
                    s.setAttribute("aria-valuemax", String(maxNum()));\r
                    // 可访问性：disabled/readonly 均不可交互（aria-disabled 联动）\r
                    s.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.readonly)));\r
                    if (this.data.status === "error") s.setAttribute("aria-invalid", "true");\r
                    else s.removeAttribute("aria-invalid");\r
                }\r
                const c = carrier();\r
                if (c) {\r
                    c.value = String(lastValue); // 提交载体恒随实际值（悬停预览不落载体）\r
                    c.disabled = !!this.data.disabled;\r
                }\r
                this.el.toggleAttribute("data-hover", hoverValue != null);\r
                const its = items();\r
                for (let idx = 0; idx < its.length; idx++) {\r
                    const i = idx + 1;\r
                    let fill = 0;\r
                    if (v >= i) fill = 100;\r
                    else if (half() && v >= i - 0.5) fill = 50;\r
                    its[idx].style.setProperty("--asc-rate-fill", \`\${fill}%\`);\r
                }\r
            };\r
\r
            // —— 提交（值落定 + 双派发：input→x-model 回写非冒泡；change→外层 detail={value}）——\r
            const commit = (v) => {\r
                lastValue = clamp(v);\r
                hoverValue = null;\r
                syncVisual();\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: lastValue } }),\r
                );\r
            };\r
\r
            // —— 指针定位：目标星 + 左右半判定（allowHalf 粒度）——\r
            const posTo = (e) => {\r
                const t = e.target instanceof Element ? e.target.closest(".asc-rate-item") : null;\r
                if (!t || !this.el.contains(t)) return null;\r
                const idx = items().indexOf(t);\r
                if (idx < 0) return null;\r
                const i = idx + 1;\r
                if (!half()) return i;\r
                const rect = t.getBoundingClientRect();\r
                const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 1;\r
                return ratio < 0.5 ? i - 0.5 : i;\r
            };\r
\r
            // —— 指针交互（宿主级事件委托——mounted 时子树可能未挂载，委托恒安全）：\r
            //     悬停预览（readonly 保留禁预览——值不可变语义）/ 移出恢复 / 点击提交 ——\r
            this.el.addEventListener("mousemove", (e) => {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const v = posTo(e);\r
                if (v == null) {\r
                    if (hoverValue != null) {\r
                        hoverValue = null;\r
                        syncVisual();\r
                    }\r
                    return;\r
                }\r
                if (v !== hoverValue) {\r
                    hoverValue = v;\r
                    syncVisual();\r
                }\r
            });\r
            this.el.addEventListener("mouseleave", () => {\r
                if (hoverValue != null) {\r
                    hoverValue = null;\r
                    syncVisual();\r
                }\r
            });\r
            this.el.addEventListener("click", (e) => {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const v = posTo(e);\r
                if (v == null) return;\r
                // clearable：再次点击同分清零（悬停预览值 = 提交值时判定）\r
                if (this.data.clearable && v === lastValue) {\r
                    commit(0);\r
                    return;\r
                }\r
                commit(v);\r
            });\r
\r
            // —— 键盘交互（role=slider 单焦点模型）：Arrow 调分 + Home/End 归位\r
            //     （Space 阻断滚动；半星粒度 0.5 步进）——\r
            this.el.addEventListener("keydown", (e) => {\r
                const t = e.target instanceof Element ? e.target : null;\r
                if (!t || !t.closest(".asc-rate-stars")) return;\r
                if (this.data.disabled || this.data.readonly) return;\r
                const d = half() ? 0.5 : 1;\r
                let v;\r
                switch (e.key) {\r
                    case "ArrowRight":\r
                    case "ArrowUp":\r
                        v = lastValue + d;\r
                        break;\r
                    case "ArrowLeft":\r
                    case "ArrowDown":\r
                        v = lastValue - d;\r
                        break;\r
                    case "Home":\r
                        v = 0;\r
                        break;\r
                    case "End":\r
                        v = maxNum();\r
                        break;\r
                    default:\r
                        return;\r
                }\r
                e.preventDefault();\r
                commit(clamp(v));\r
            });\r
\r
            // —— 值桥（x-model 兼容协议）：宿主 el.value 劫持为数字语域 ——\r
            //     劫持前快照 expando（x-model 编译期可能已写初值）；无 x-model 时回退\r
            //     props.value 初值（劫持快照序：expando > props.value，input 同款）\r
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(lastValue),\r
                set: (v) => {\r
                    const n = clamp(v);\r
                    if (n === lastValue) return; // 等值短路\r
                    lastValue = n;\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
            // —— 一跳后初始化（化身子树挂载与 props 注入落定，家族惯用法）：星形\r
            //     渲染（rebuild 赋值 → x-for 重渲染须再一跳）+ 初值落定 + name /\r
            //     aria-label 透传（可访问性标注通道——零内置文案的标注出口）——\r
            rebuild();\r
            setTimeout(() => {\r
                lastValue = initV != null ? clamp(initV) : 0;\r
                const c = carrier();\r
                if (c) {\r
                    const nameAttr = this.el.getAttribute("name");\r
                    if (nameAttr != null) c.name = nameAttr;\r
                }\r
                const s = starsEl();\r
                if (s) {\r
                    const al = this.el.getAttribute("aria-label");\r
                    if (al != null) s.setAttribute("aria-label", al);\r
                }\r
                syncVisual();\r
            }, 0);\r
\r
            // —— props 变化跟随（回调收 { value } 信封对象，此处只用作触发信号）——\r
            // value 单向同步（无 x-model 场景）：变化才写（与劫持 setter 等值短路防回环）\r
            this.watch("value", ({ value: v }) => {\r
                const n = clamp(v);\r
                if (n === lastValue) return;\r
                lastValue = n;\r
                syncVisual();\r
            });\r
            // max 变化：星形重建（x-for 重渲染须再一跳对齐视觉）+ 当前值夹取\r
            this.watch("max", () => {\r
                rebuild();\r
                lastValue = clamp(lastValue);\r
                setTimeout(syncVisual, 0);\r
            });\r
            this.watch("status", () => { setTimeout(syncVisual, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-rate">\r
    /* ---------- 结构：星组（role=slider 交互件，data-autospark-action 点击不转发\r
             焦点——骨架空白区点击转发逻辑不干扰）；每星双层（off 灰星底层撑尺寸 +\r
             on 亮星覆盖层 clip-path 裁剪） ---------- */\r
    .asc-rate-stars {\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.3em;\r
      cursor: pointer;\r
      outline: none;\r
    }\r
    /* x-for 循环容器（渲染一次）：不产生布局层，星项穿透为星组直接 flex 项 */\r
    .asc-rate-items {\r
      display: contents;\r
    }\r
    /* 星尺寸 em 基准随主题 data-size 档位字号缩放（不设自有尺寸属性，button 同范式\r
       ADR-0012） */\r
    .asc-rate-item {\r
      position: relative;\r
      display: inline-flex;\r
      font-size: 1.4em;\r
      line-height: 1;\r
      --asc-rate-fill: 0%;\r
    }\r
    .asc-rate-off,\r
    .asc-rate-on {\r
      display: flex;\r
    }\r
    .asc-rate-off svg,\r
    .asc-rate-on svg {\r
      width: 1em;\r
      height: 1em;\r
      display: block;\r
    }\r
    /* 灰星底层：中性色（主题在场自动换肤） */\r
    .asc-rate-off {\r
      color: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-rate-off, #606060)) 30%,\r
        transparent\r
      );\r
    }\r
    /* 亮星覆盖层：tone 色（缺省主色，status 在场随 --asc-field-tone 联动——骨架\r
       通道）；clip-path 右侧裁剪承载半星（fill 50% 显左半；不影响布局，svg 恒满宽） */\r
    .asc-rate-on {\r
      position: absolute;\r
      inset: 0;\r
      color: var(--asc-field-tone);\r
      clip-path: inset(0 calc(100% - var(--asc-rate-fill)) 0 0);\r
    }\r
\r
    /* ---------- 交互态 ---------- */\r
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——星组可聚焦即点亮）；\r
       禁用不点环 */\r
    .asc-rate[data-focus]:not([data-disabled]) .asc-rate-stars {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
      border-radius: var(--auto-border-radius, var(--asc-rate-focus-radius, 0.25em));\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化（点亮 tone 保留可辨）+ 禁点光标 */\r
    .asc-rate[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-rate[data-disabled] .asc-rate-stars {\r
      cursor: not-allowed;\r
    }\r
    /* 只读：光标归正文（预览与提交均阻断，无禁用淡化） */\r
    .asc-rate[data-readonly] .asc-rate-stars {\r
      cursor: default;\r
    }\r
    /* 悬停预览态（data-hover 由 mounted 同步）：预览粒度跟随光标（含半星） */\r
    .asc-rate[data-hover] .asc-rate-stars {\r
      cursor: pointer;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：灰星底层兜底字面值切换为 theme 默认暗色\r
             校准（正文色反转自动偏白灰）；点亮 tone 与亮色为骨架通道恒定设计 ---------- */\r
    [dark] .asc-rate-off,\r
    [data-dark] .asc-rate-off {\r
      color: color-mix(\r
        in srgb,\r
        var(--auto-color, var(--asc-rate-off, #fafafa)) 32%,\r
        transparent\r
      );\r
    }\r
  </style>\r
  <!-- 默认段（替换 field 出口 fallback）：表单载体（hidden，骨架 disabled 同步\r
         目标）+ 星组交互件（role=slider 可聚焦）。x-for 宿主为纯克隆载体（自身绑定\r
         不编译，:key 例外），星形双层结构在内层；star 为引擎内置图标。注意：嵌套\r
         x-slot 出口在继承形态下被忽略（ADR-0056）——消费者内容经 field 出口\r
         整段替换控件区（逃生通道，input 同款语义），故不开真插槽 -->\r
  <input type="hidden" class="asc-rate-carrier" data-autospark-control />\r
  <span\r
    class="asc-rate-stars"\r
    role="slider"\r
    tabindex="0"\r
    aria-valuemin="0"\r
    aria-valuemax="5"\r
    aria-valuenow="0"\r
    data-autospark-action\r
  >\r
    <!-- x-for 容器形态（宿主渲染一次、子节点为项模板重复 N 次）：items 容器\r
         display:contents 不产生布局层，星项直接成为星组 flex 项 -->\r
    <span class="asc-rate-items" x-for="s of stars" :key="s">\r
      <span class="asc-rate-item">\r
        <i class="asc-rate-off" x-icon="'star'"></i>\r
        <i class="asc-rate-on" x-icon="'star'"></i>\r
      </span>\r
    </span>\r
  </span>\r
</span>\r
`,i=`autospark.rate`;function a(e){e.components[i]=r}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.rate.js.map
