(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.field`]=`<span\r
  class="asc-field"\r
  x-define="autospark.field"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            status: "",
            disabled: false,
            readonly: false,
            actions: [],
        }),\r
        mounted() {\r
            const control = () => this.el.querySelector("[data-autospark-control]");\r
\r
            const applyStatus = () => {\r
                const v = this.data.status;\r
                if (typeof v === "string" && v !== "") this.el.setAttribute("data-status", v);\r
                else this.el.removeAttribute("data-status");\r
            };\r
\r
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
            this.el.addEventListener("focusin", () => {\r
                this.el.setAttribute("data-focus", "");\r
            });\r
            this.el.addEventListener("focusout", (e) => {\r
                const to = e.relatedTarget;\r
                if (to instanceof Node && this.el.contains(to)) return;\r
                this.el.removeAttribute("data-focus");\r
            });\r
\r
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
    .asc-field-box[data-focus] {\r
      --asc-field-line: var(--asc-field-tone);\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
    }\r
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
`}n();function n(){e(e=>{t(e)})}var r=`<span\r
  class="asc-checkbox"\r
  x-define="autospark.checkbox"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            label: "",
            checked: false,
            indeterminate: false,
        }),\r
        mounted() {\r
            const native = () => this.el.querySelector(".asc-checkbox-input");\r
            let lastChecked = false;\r
\r
            const syncAttrs = () => {\r
                const n = native();\r
                if (!n) return;\r
                n.value = "true";\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) n.name = nameAttr;\r
            };\r
\r
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
            this.el.addEventListener("change", (e) => {\r
                if (e.target !== native()) return;\r
                const n = native();\r
                if (n) lastChecked = n.checked;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
            });\r
\r
            setTimeout(() => {\r
                const n = native();\r
                if (n) {\r
                    n.checked = lastChecked;\r
                    n.indeterminate = !!this.data.indeterminate;\r
                }\r
                syncAttrs();\r
            }, 0);\r
\r
            let lastPropsChecked = !!this.data.checked;\r
            this.watch("checked", ({ value }) => {\r
                const v = !!value;\r
                if (v === lastPropsChecked) return;\r
                lastPropsChecked = v;\r
                lastChecked = v;\r
                const n = native();\r
                if (n && n.checked !== lastChecked) n.checked = lastChecked;\r
            });\r
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
    .asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)::before {\r
      transform: rotate(45deg) scale(0);\r
    }\r
\r
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
    .asc-checkbox[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-checkbox[data-disabled] .asc-checkbox-wrap {\r
      cursor: not-allowed;\r
    }\r
\r
    .asc-checkbox-label:empty {\r
      display: none;\r
    }\r
\r
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
  <label class="asc-checkbox-wrap">\r
    <span class="asc-checkbox-box">\r
      <input type="checkbox" class="asc-checkbox-input" data-autospark-control />\r
    </span>\r
    <span class="asc-checkbox-label">{{ label }}</span>\r
  </label>\r
</span>\r
`,i=`autospark.checkbox`;function a(e){e.components[i]=r}o();function o(){e(e=>{a(e)})}var s=`<div class="asc-transfer" x-define="autospark.transfer" x-define:inherit="autospark.base">
  <script setup>
    {
        data: () => ({
            data: [],
            value: [],
            titles: [],
            filterable: false,
            disabled: false,
            name: "",
            sourceItems: [],
            targetItems: [],
            sourceView: [],
            targetView: [],
            sourceFilter: "",
            targetFilter: "",
            pickedKeys: [],
            sourceAll: false,
            sourceHalf: false,
            targetAll: false,
            targetHalf: false,
            canRight: false,
            canLeft: false,
        }),
        methods: {
            items() {
                return Array.isArray(this.data.data) ? this.data.data : [];
            },
            valueKeys() {
                return Array.isArray(this.data.value) ? this.data.value : [];
            },
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
            syncSelection() {
                const valid = new Set(this.items().map((i) => String(i?.key)));
                const pickedArr = [...new Set((this.data.pickedKeys ?? []).map(String))]
                    .filter((k) => valid.has(k));
                if (pickedArr.length !== (this.data.pickedKeys ?? []).length) {
                    this.data.pickedKeys = pickedArr;
                }
                const pickSet = new Set(pickedArr);
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
                const srcKeys = new Set((this.data.sourceItems ?? []).map((i) => String(i.key)));
                const tgtKeys = new Set((this.data.targetItems ?? []).map((i) => String(i.key)));
                const dis = !!this.data.disabled;
                this.data.canRight = !dis && pickedArr.some((k) => srcKeys.has(k));
                this.data.canLeft = !dis && pickedArr.some((k) => tgtKeys.has(k));
            },
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
            onRowClick(item, event) {
                if (event && event.target instanceof Element && event.target.closest(".asc-checkbox")) return;
                if (!item || item.disabled) return;
                this.togglePick(item.key);
            },
            onToggleSourceAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.sourceView);
            },
            onToggleTargetAll(event) {
                if (event && typeof event.stopPropagation === "function") event.stopPropagation();
                this.toggleAll(this.data.targetView);
            },
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
            syncCarrier() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                c.value = this.valueKeys().map((k) => String(k)).join(",");
                c.disabled = !!this.data.disabled;
            },
            syncName() {
                const c = this.el.querySelector(".asc-transfer-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            syncInteractive() {
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                this.syncCarrier();
                this.syncSelection();
            },
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
        },
        mounted() {
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
                    if (arr === self.data.value) return;
                    self.data.value = arr;
                    self.rebuild();
                },
                configurable: true,
            });
            this.data.value = initV;

            setTimeout(() => {
                this.syncName();
                this.rebuild();
                this.syncInteractive();
            }, 0);

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

    .asc-transfer-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

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

    .asc-transfer-empty {
      padding: 1.2em 0.85em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-transfer-empty, rgba(0, 0, 0, 0.35)));
    }

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
  <input type="hidden" class="asc-transfer-carrier" />
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
