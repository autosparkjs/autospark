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
`}n();function n(){e(e=>{t(e)})}var r=`<!--
    autospark.time-select 时间点下拉（ADR-0025）——触发器组件：select 范式直系克隆
    （ADR-0022）：Field 盒饰形态 + 选中值展示 + 时钟图标；起止/步长生成离散时间
    点列表作 options。列表面板不自建弹层，复用 x-popover 指令机制呈现（trigger:click
    形态——点击切换 / 面板外点击 / ESC 关闭均机制继承）：内层触发器元素即 popover
    宿主，面板组件 autospark-time-select-panel（同插件注册，panel.html）渲染进 body
    覆盖物容器；**fit 宽度匹配 + uid 配对 min-width 两段合成**（select 决策 1 同款：
    fit 基准是触发器内容区，面板 mounted 按 uid 配对测盒饰宽补 min-width——面板与
    select 下拉同款观感）。

    面板 ↔ 触发器通信走 scope 链：面板经聚合视图沿链读写本组件 data 域——读
    options/activeValue/value 呈现，写哨兵键（pickTick/pickValue 选项点击、keyTick/
    keyDir 键盘导航）回传交互；面板 mounted/unmounted 沿链写 open 开合态。

    值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持 ↔ data.value；
    选中 / 清除路径手动派发 input（非冒泡）+ change（冒泡 detail = { value }）；内嵌
    input[type=hidden] 表单载体（name 透传，原生直提交）。

    键盘（select 同款）：上下移动高亮（首尾环绕）/ Enter 确认（未开先开）/ ESC 归
    popover 打开栈（机制继承）不拦截 / Tab 自然移焦。

    离散列表生成（ADR-0025 决策 3）：start（"00:00"）→ end（"23:00"）含端按 step
    （"00:30"）分钟步进；非法步长（≤0 分钟）回退 30；列表长度防御上限 2000（病态
    配置兜底）；start>end 之类空区间渲染空态（i18n time-select.empty 回退「暂无数据」）。
-->
<!-- 根 class 拼接进骨架宿主；data-open / data-has-value 由 mounted JS 通道同步，
     根上无动态绑定（T4=B） -->
<span
  class="asc-time-select asc-field-box"
  x-define="autospark.time-select"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",       // 当前值（"HH:mm" 字符串语域，""=空；落在列表内才有选中标记；受控真相走宿主 x-model）
            placeholder: "", // 占位文案（空时走 i18n 词典 time-select.placeholder 键，回退「请选择时间」）
            clearable: false, // 清除钮（有值且可交互时可见：清空 + input/change 双派发 + 焦点回触发器）
            start: "00:00",  // 起始时间（含端）
            end: "23:00",    // 结束时间（含端）
            step: "00:30",   // 步长（"HH:mm"，分钟粒度解析）
            name: "",        // 表单载体名（元素名写法下 name 属性折叠为 props——与宿主属性双通道，mounted 合取）
            // —— 内部状态（JS 通道维护——绑定通道对 props 晚注入不重算，家族纪律）——
            uid: "",               // 实例唯一标识（根 data-asc-time-select-uid 属性载体——面板宽度匹配的
                                   // 配对键，select 决策 1 两段合成同款）
            hasValue: false,       // 当前有值（清除钮可见性 / 占位切换）
            open: false,           // 面板开合态（面板 mounted/unmounted 沿链写回）
            options: [],           // 离散时间点列表 [{ label, value }]（start/end/step 变化时重建）
            activeIndex: -1,       // 键盘高亮索引（options 内；-1 无高亮）
            activeValue: null,     // 高亮项值（面板 :data-active 比较基准——索引对模板不可见，值通道免疫重建）
            pickTick: 0,           // 选中哨兵（选项点击写：自增必变免疫同值去重；触发本组件选中流程）
            pickValue: null,       // 选中哨兵携带值
            keyTick: 0,            // 键盘导航哨兵（触发器键盘经方法直调，键位预留 select 协议对称）
            keyDir: 0,             // 键盘导航方向（1 下 / -1 上）
        }),
        methods: {
            // 触发器元素（popover 宿主 / 焦点受让者；每查现取不缓存，家族惯用法）
            triggerEl() {
                return this.el.querySelector(".asc-time-select-trigger");
            },
            // 表单载体（hidden input；每查现取）
            carrierEl() {
                return this.el.querySelector(".asc-time-select-carrier");
            },
            // 两位补零
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            // "HH:mm" 解析为分钟数（h*60+mi；非法形态回 null）
            parseHmMinutes(s) {
                if (typeof s !== "string") return null;
                const p = s.split(":");
                if (p.length !== 2) return null;
                const h = Number(p[0]), mi = Number(p[1]);
                if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
                if (h < 0 || mi < 0) return null;
                return h * 60 + mi;
            },
            // 分钟数 → "HH:mm"（>23 时不进位截断到日内——起止语域本就该在 0-23 时内，防御归一）
            fmtMinutes(total) {
                const t = ((total % 1440) + 1440) % 1440;
                return this.pad2(Math.floor(t / 60)) + ":" + this.pad2(t % 60);
            },
            // 离散列表重建：起止含端按步长生成；非法步长（≤0 分钟）回退 30；长度防御
            //     上限 2000；activeIndex 越界时回落当前选中项
            rebuildOptions() {
                const s = this.parseHmMinutes(this.data.start);
                const e = this.parseHmMinutes(this.data.end);
                if (s == null || e == null || s > e) {
                    this.data.options = [];
                } else {
                    const stepRaw = this.parseHmMinutes(this.data.step);
                    const stepMin = stepRaw != null && stepRaw > 0 ? stepRaw : 30;
                    const list = [];
                    for (let t = s; t <= e && list.length < 2000; t += stepMin) {
                        const label = this.fmtMinutes(t);
                        list.push({ label: label, value: label });
                    }
                    this.data.options = list;
                }
                this.setActiveToValue();
            },
            // 高亮同步（activeValue 为面板比较基准）
            syncActive() {
                const list = this.data.options ?? [];
                const i = this.data.activeIndex;
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;
                else this.data.activeValue = null;
            },
            // 高亮落当前选中项（打开面板时的定位基准；无选中回落首项——键盘起步可达）
            setActiveToValue() {
                const list = this.data.options ?? [];
                let i = list.findIndex((o) => o && String(o.value) === String(this.data.value));
                if (i < 0 && list.length > 0) i = 0;
                this.data.activeIndex = i;
                this.syncActive();
            },
            // 选中呈现同步（JS 通道：值即展示——"HH:mm" 直出，无 label 解析层）
            syncValue() {
                const has = this.data.value != null && this.data.value !== "";
                this.data.hasValue = has;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(this.data.value) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            // 开合态副作用：aria-expanded / data-open 同步 + 打开时高亮落当前选中项
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) this.setActiveToValue();
            },
            // 可交互同步：禁用时触发器退出焦点序（tabindex -1）+ 载体出表 + 关面板
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            // 值变更出口（选中/清除共用）：input 非冒泡（x-model 监听在宿主自身）+
            //     change 冒泡 detail={value}（外层消费）
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            // 开面板：程序化派发点击（popover click 触发模型 toggle；readonly 可开浏览
            //     但选中被 pick guard 阻断）
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
            // 高亮移动（dir = 1 下 / -1 上）：首尾环绕（生成物无禁用项，环找直通）
            moveActive(dir) {
                const list = this.data.options ?? [];
                if (list.length === 0) return;
                const i = this.data.activeIndex;
                this.data.activeIndex = (i + dir + list.length) % list.length;
                this.syncActive();
            },
            // Enter 确认当前高亮项
            confirmActive() {
                if (this.data.activeValue != null) this.pick(this.data.activeValue);
            },
            // 选中流程（选项哨兵 / 触发器键盘汇聚点）：禁用与只读阻断；同值仅关面板；
            //     写值 + 双派发 + 关面板 + 焦点回触发器（选中即关——单列离散选项语义，
            //     与 time-picker 两列部分提交分叉）
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                const list = this.data.options ?? [];
                const opt = list.find((o) => o && String(o.value) === String(v));
                if (!opt) return;
                if (String(opt.value) === String(this.data.value)) { this.closePanel(); return; }
                this.data.value = opt.value;
                this.syncValue();
                this.emitChange();
                this.closePanel();
                this.triggerEl()?.focus();
            },
            // 清除（内部动作件，点击不转发焦点）：清空 + 双派发 + 焦点回触发器 +
            //     阻断冒泡（防途经触发器 popover 宿主引发 toggle 开面板）
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            // 触发器键盘导航（select 同款）：上下移动高亮（未开先开）/ Enter 确认
            //     （未开先开）/ ESC 与 Tab 不拦截
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (this.data.open) this.confirmActive();
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
            //     双通道 + 实例 uid（面板宽度配对键）+ 列表构建 + 全量首同步
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
                this.data.uid = "asc-time-select-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
                this.el.setAttribute("data-asc-time-select-uid", this.data.uid);
                this.rebuildOptions();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            // —— props / 哨兵 / 内部状态跟随（回调收 { value } 信封对象，此处只用作
            //     触发信号，家族惯用法）——
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("start", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("end", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("step", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            // 面板哨兵：选中（pickTick）/ 键盘导航（keyTick——协议对称预留）
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-time-select">
    /* ---------- 触发器：盒饰 chrome 由 .asc-field-box 承载（input/select 同款），光标手型 ---------- */
    .asc-time-select {
      cursor: pointer;
    }
    .asc-time-select[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-time-select[data-disabled] .asc-time-select-trigger {
      pointer-events: none;
    }
    .asc-time-select[data-readonly] {
      cursor: default;
    }

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面） ---------- */
    .asc-time-select-trigger {
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
    .asc-time-select-value {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-time-select-color, #333333));
    }
    .asc-time-select-placeholder {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-input-placeholder, var(--asc-time-select-placeholder, rgba(0, 0, 0, 0.35)));
    }

    /* ---------- 尾部动作件：清除钮与时钟图标（开面板染 tone） ---------- */
    .asc-time-select-clear {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-time-select-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-time-select-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-select-clear:hover {
      color: var(--auto-color, var(--asc-time-select-action-hover, #606060));
    }
    .asc-time-select-clear:active {
      transform: scale(0.92);
    }
    .asc-time-select-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      color: var(--auto-third-color, var(--asc-time-select-icon, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-time-select[data-open] .asc-time-select-icon {
      color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-time-select-primary, #009aff)));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换（变量链不变） ---------- */
    [dark] .asc-time-select-value,
    [data-dark] .asc-time-select-value {
      color: var(--auto-color, var(--asc-time-select-color, #fafafa));
    }
    [dark] .asc-time-select-placeholder,
    [data-dark] .asc-time-select-placeholder {
      color: var(--auto-input-placeholder, var(--asc-time-select-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-time-select-clear,
    [dark] .asc-time-select-icon,
    [data-dark] .asc-time-select-clear,
    [data-dark] .asc-time-select-icon {
      color: var(--auto-third-color, var(--asc-time-select-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-time-select-clear:hover,
    [data-dark] .asc-time-select-clear:hover {
      color: var(--auto-color, var(--asc-time-select-action-hover, #fafafa));
    }

    /* ══════════ 时间点列表面板（autospark-time-select-panel，渲染进 body 覆盖物
       容器）——select 下拉面板同款观感（fit + uid 配对 min-width + 同 hover/选中
       token，ADR-0025 视觉对齐）══════════ */
    .asc-time-select-panel {
      display: block;
      min-width: 100%;
      font-size: var(--auto-font-size, var(--asc-time-select-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-time-select-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-time-select-panel-color, #333333));
    }
    /* 选项列表：最大高度限档 + 纵向滚动（select 列表同款） */
    .asc-time-select-list {
      max-height: var(--asc-time-select-max-height, 15em);
      overflow-y: auto;
      padding: 0.25em 0;
      box-sizing: border-box;
    }
    /* 选项：行式热区（select 选项同款）；悬停/高亮/选中态经 data-* 属性选择器驱动
       （x-bind 假值整属性移除 = 无态）；选中标记 check 图标纯 CSS 父选择器驱动
       （克隆体内零 x-if——共享快照串台规避，ADR-0021 边界 3） */
    .asc-time-select-option {
      display: flex;
      align-items: center;
      gap: 0.4em;
      min-height: 2.2em;
      padding: 0.3em 0.75em;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .asc-time-select-option-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* 选中标记 check 图标：DOM 恒渲染（克隆体内零 x-if），显隐走 :not(data-selected)
       高特异性选择器——压制 x-icon 注入的 .as-icon 基类 display（同为单类特异性时
       运行时注入序在后者胜出，实证） */
    .asc-time-select-option:not([data-selected]) .asc-time-select-option-check {
      display: none;
    }
    .asc-time-select-option[data-selected] .asc-time-select-option-check {
      display: inline-flex;
    }
    .asc-time-select-option-check {
      flex: none;
      color: var(--auto-primary-color, var(--asc-time-select-panel-primary, #009aff));
    }
    .asc-time-select-option[data-selected] {
      color: var(--auto-primary-color, var(--asc-time-select-panel-primary, #009aff));
    }
    .asc-time-select-option[data-selected] .asc-time-select-option-check {
      display: inline-flex;
    }
    .asc-time-select-option[data-active]:not([data-selected]) {
      background: var(--auto-hover-bgcolor, var(--asc-time-select-option-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    /* 空态（病态起止配置兜底）：居中辅助色文案 */
    .asc-time-select-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-time-select-empty, rgba(0, 0, 0, 0.35)));
    }
    /* 面板暗色兜底变体：兜底字面值切换（shell 边框/底色/阴影已由 popover-shell 暗色块覆盖） */
    [dark] .asc-time-select-panel,
    [data-dark] .asc-time-select-panel {
      color: var(--auto-color, var(--asc-time-select-panel-color, #fafafa));
    }
    [dark] .asc-time-select-option[data-active]:not([data-selected]),
    [data-dark] .asc-time-select-option[data-active]:not([data-selected]) {
      background: var(--auto-hover-bgcolor, var(--asc-time-select-option-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-time-select-option[data-selected],
    [data-dark] .asc-time-select-option[data-selected] {
      color: var(--auto-primary-color, var(--asc-time-select-panel-primary, #56baff));
    }
    [dark] .asc-time-select-empty,
    [data-dark] .asc-time-select-empty {
      color: var(--auto-third-color, var(--asc-time-select-empty, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <!-- 默认段（替换 field 出口 fallback）：表单载体 + 触发器（popover 宿主 /
         combobox 语义，fit 面板宽随触发器）+ 清除钮 + 时钟图标 -->
  <input type="hidden" class="asc-time-select-carrier" />
  <span
    class="asc-time-select-trigger"
    x-popover:autospark-time-select-panel
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded="false"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-time-select-value" x-if="hasValue" x-text="value"></span>
    <span
      class="asc-time-select-placeholder"
      x-if="!hasValue"
      x-text="placeholder || (t('time-select.placeholder') === 'time-select.placeholder' ? '请选择时间' : t('time-select.placeholder'))"
    ></span>
  </span>
  <i
    class="asc-time-select-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i class="asc-time-select-icon" data-autospark-action x-icon="'time-clock'"></i>
</span>
`,i=`<!--
    autospark-time-select-panel 时间点列表面板（ADR-0025）——time-select 的内部组件
    （非用户直接消费，无文档页；连字符注册名的成因见 index.ts）：select 下拉面板的
    直系克隆（非 filter/virtual 子集，ADR-0022 范式）——经 x-popover 指令机制
    （trigger:click）渲染进 body 覆盖物容器，面板外壳（边框/阴影/定位/宽度 fit 随
    触发器）由 popover-shell 承载，本组件只贡献离散时间点选项列表内容。

    与触发器组件（autospark.time-select）的通信走 scope 链：聚合视图沿链读写触发器
    组件 data 域——
    - 读：options（x-for 数据源）/ activeValue（高亮基准）/ value（选中基准）；
    - 写：哨兵键 pickTick/pickValue（选项点击——面板模板不能跨组件边界调触发器组件
      method，ADR-0022 决策 3；自增哨兵免疫同值去重；事件表达式用逗号运算符单表达式
      形态）；
    - 开合态：mounted/unmounted 沿链写 open。

    克隆体内零 x-if（共享快照多实例串台规避，ADR-0021 边界 3）——选中标记 check 图标
    恒渲染、显隐走 data-selected 父选择器纯 CSS 驱动；空态行是 template 的同级兄弟
    （非克隆体）。
-->
<div class="asc-time-select-panel" x-define="autospark-time-select-panel">
  <script setup>
    {
        // 本组件零 props、零自有状态——全部数据经 scope 链读写触发器组件域；
        // data() 空对象占位以建立自有 data 层（聚合视图的链上桥点）
        data: () => ({}),
        mounted() {
            // 开合态沿链写回（触发器侧 watch open 派生图标染色 / aria-expanded / 高亮定位）
            this.data.open = true;
            // 宽度匹配触发器盒饰（select 决策 1 两段合成同款，ADR-0025）：popover 的
            // fit 基准是触发器内容区（popover 宿主元素，不含盒饰 padding）——按 uid
            // 配对测盒饰宽，补写 shell 面板 min-width（fit 持续写 width，min-width 抬到
            // 盒宽；每次打开新实例重测，盒宽变化随重开自适应）
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-time-select-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
            // 高亮项滚动跟随（键盘导航可见性；初次打开定位到选中项/首项；列表在面板内现查）
            const scrollActive = () => {
                const el = this.el.querySelector(
                    ".asc-time-select-option[data-active], .asc-time-select-option[data-selected]",
                );
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
  <!-- 选项列表：template 形态 x-for（字号档位全跟随）；选中标记 check 图标恒渲染、
         显隐走 data-selected 父选择器纯 CSS（克隆体内零 x-if，ADR-0021 边界 3） -->
  <div class="asc-time-select-list">
    <template x-for="option of options" :key="option.value">
      <div
        class="asc-time-select-option"
        x-bind:data-selected="String(option.value) === String(value)"
        x-bind:data-active="option.value === activeValue"
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"
      >
        <span class="asc-time-select-option-label" x-text="option.label"></span>
        <i class="asc-time-select-option-check" x-icon="'yes'"></i>
      </div>
    </template>
    <!-- 空态（template 同级兄弟，非克隆体）：病态起止配置兜底，i18n time-select.empty -->
    <div
      class="asc-time-select-empty"
      x-if="!(options && options.length > 0)"
      x-text="t('time-select.empty') === 'time-select.empty' ? '暂无数据' : t('time-select.empty')"
    ></div>
  </div>
</div>
`,a=`autospark.time-select`,o=`autospark-time-select-panel`,s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;function c(e){e.icons?.add?.(`time-clock`,s),e.components[a]=r,e.components[o]=i}l();function l(){e(e=>{c(e)})}};
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

//# sourceMappingURL=autospark.time-select.js.map
