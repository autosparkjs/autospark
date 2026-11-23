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
  class="asc-rate"\r
  x-define="autospark.rate"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: 0,
            max: 5,
            allowHalf: false,
            clearable: false,
            stars: [],
        }),\r
        mounted() {\r
            const starsEl = () => this.el.querySelector(".asc-rate-stars");\r
            const carrier = () => this.el.querySelector(".asc-rate-carrier");\r
            const items = () => Array.from(this.el.querySelectorAll(".asc-rate-item"));\r
\r
            const num = (v) => {\r
                const n = typeof v === "number" ? v : parseFloat(String(v ?? "").trim());\r
                return Number.isFinite(n) ? n : null;\r
            };\r
            const maxNum = () => Math.max(1, Math.floor(num(this.data.max) ?? 5));\r
            const half = () => !!this.data.allowHalf;\r
            const clamp = (n) => Math.max(0, Math.min(maxNum(), num(n) ?? 0));\r
\r
            const rebuild = () => {\r
                this.data.stars = Array.from({ length: maxNum() }, (_, i) => i + 1);\r
            };\r
\r
            let lastValue = 0;\r
            let hoverValue = null;
\r
            const syncVisual = () => {\r
                const v = hoverValue != null ? hoverValue : lastValue;\r
                const s = starsEl();\r
                if (s) {\r
                    s.setAttribute("aria-valuenow", String(v));\r
                    s.setAttribute("aria-valuemax", String(maxNum()));\r
                    s.setAttribute("aria-disabled", String(!!(this.data.disabled || this.data.readonly)));\r
                    if (this.data.status === "error") s.setAttribute("aria-invalid", "true");\r
                    else s.removeAttribute("aria-invalid");\r
                }\r
                const c = carrier();\r
                if (c) {\r
                    c.value = String(lastValue);
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
                if (this.data.clearable && v === lastValue) {\r
                    commit(0);\r
                    return;\r
                }\r
                commit(v);\r
            });\r
\r
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
            const prior = this.el.value;\r
            const initV = num(prior) != null ? num(prior) : num(this.data.value);\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(lastValue),\r
                set: (v) => {\r
                    const n = clamp(v);\r
                    if (n === lastValue) return;
                    lastValue = n;\r
                    syncVisual();\r
                },\r
                configurable: true,\r
            });\r
\r
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
            this.watch("value", ({ value: v }) => {\r
                const n = clamp(v);\r
                if (n === lastValue) return;\r
                lastValue = n;\r
                syncVisual();\r
            });\r
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
    /* 焦点环（data-focus 由骨架 focusin/focusout 同步——星组可聚焦即点亮）；\r
       禁用不点环 */\r
    .asc-rate[data-focus]:not([data-disabled]) .asc-rate-stars {\r
      box-shadow: 0 0 0 2px\r
        color-mix(in srgb, var(--asc-field-tone) 22%, transparent);\r
      border-radius: var(--auto-border-radius, var(--asc-rate-focus-radius, 0.25em));\r
    }\r
    .asc-rate[data-disabled] {\r
      opacity: 0.55;\r
    }\r
    .asc-rate[data-disabled] .asc-rate-stars {\r
      cursor: not-allowed;\r
    }\r
    .asc-rate[data-readonly] .asc-rate-stars {\r
      cursor: default;\r
    }\r
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
