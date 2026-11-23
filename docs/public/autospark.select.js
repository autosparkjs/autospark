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
  class="asc-select asc-field-box"\r
  x-define="autospark.select"\r
  x-define:inherit="autospark.field"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: null,
            options: [],
            placeholder: "",
            clearable: false,
            filterable: false,
            loading: false,
            virtual: false,
            uid: "",
            hasValue: false,
            labelText: "",
            filteredOptions: [],
            filterText: "",
            activeIndex: -1,
            activeValue: null,
            open: false,
            pickTick: 0,
            pickValue: null,
            keyTick: 0,
            keyDir: 0,
        }),\r
        methods: {\r
            triggerEl() {\r
                return this.el.querySelector(".asc-select-trigger");\r
            },\r
            carrierEl() {\r
                return this.el.querySelector(".asc-select-carrier");\r
            },\r
            syncValue() {\r
                const v = this.data.value;\r
                const has = v != null && v !== "";\r
                this.data.hasValue = has;\r
                const list = this.data.options ?? [];\r
                const opt = has ? list.find((o) => o && String(o.value) === String(v)) : null;\r
                this.data.labelText = opt ? String(opt.label ?? opt.value) : "";\r
                const c = this.carrierEl();\r
                if (c) {\r
                    c.value = has ? String(v) : "";\r
                    c.disabled = !!this.data.disabled;\r
                }\r
            },\r
            syncActive() {\r
                const list = this.data.filteredOptions ?? [];\r
                const i = this.data.activeIndex;\r
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;\r
                else this.data.activeValue = null;\r
            },\r
            rebuildFiltered() {\r
                const list = this.data.options ?? [];\r
                const kw = String(this.data.filterText ?? "").trim().toLowerCase();\r
                this.data.filteredOptions = kw === ""\r
                    ? [...list]\r
                    : list.filter((o) => String(o?.label ?? "").toLowerCase().includes(kw));\r
                const i = this.data.activeIndex;\r
                if (i < 0 || i >= this.data.filteredOptions.length) this.setActiveToValue();\r
                else this.syncActive();\r
            },\r
            setActiveToValue() {\r
                const list = this.data.filteredOptions ?? [];\r
                this.data.activeIndex = list.findIndex(\r
                    (o) => o && String(o.value) === String(this.data.value),\r
                );\r
                this.syncActive();\r
            },\r
            syncOpen() {\r
                const on = !!this.data.open;\r
                this.el.toggleAttribute("data-open", on);\r
                const t = this.triggerEl();\r
                if (t) t.setAttribute("aria-expanded", String(on));\r
                if (on) {\r
                    this.data.filterText = "";\r
                    this.rebuildFiltered();\r
                    this.setActiveToValue();\r
                }\r
            },\r
            syncInteractive() {\r
                const t = this.triggerEl();\r
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;\r
                const c = this.carrierEl();\r
                if (c) c.disabled = !!this.data.disabled;\r
                this.el.toggleAttribute("data-loading", !!this.data.loading);\r
                if (this.data.disabled && this.data.open) this.closePanel();\r
            },\r
            emitChange() {\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(\r
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),\r
                );\r
            },\r
            openPanel() {\r
                if (this.data.disabled) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            closePanel() {\r
                if (!this.data.open) return;\r
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));\r
            },\r
            moveActive(dir) {\r
                const list = this.data.filteredOptions ?? [];\r
                if (list.length === 0) return;\r
                let i = this.data.activeIndex;\r
                for (let step = 0; step < list.length; step++) {\r
                    i = (i + dir + list.length) % list.length;\r
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }\r
                }\r
            },\r
            confirmActive() {\r
                if (this.data.activeValue != null) this.pick(this.data.activeValue);\r
            },\r
            pick(v) {\r
                if (this.data.disabled || this.data.readonly) return;\r
                const list = this.data.options ?? [];\r
                const opt = list.find((o) => o && String(o.value) === String(v));\r
                if (!opt || opt.disabled) return;\r
                if (String(opt.value) === String(this.data.value)) { this.closePanel(); return; }\r
                this.data.value = opt.value;\r
                this.syncValue();\r
                this.emitChange();\r
                this.closePanel();\r
                this.triggerEl()?.focus();\r
            },\r
            onClear(event) {\r
                event.stopPropagation();\r
                if (this.data.disabled || this.data.readonly) return;\r
                if (!this.data.hasValue) return;\r
                this.data.value = null;\r
                this.syncValue();\r
                this.emitChange();\r
                this.triggerEl()?.focus();\r
            },\r
            onTriggerKeydown(event) {\r
                if (this.data.disabled) return;\r
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {\r
                    event.preventDefault();\r
                    if (!this.data.open) { this.openPanel(); return; }\r
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);\r
                } else if (event.key === "Enter") {\r
                    event.preventDefault();\r
                    if (this.data.open) this.confirmActive();\r
                    else this.openPanel();\r
                }\r
            },\r
        },\r
        mounted() {\r
            const prior = this.el.value;\r
            let lastValue = undefined;\r
            if (prior !== undefined && prior !== null && prior !== "") lastValue = prior;\r
            else if (this.data.value != null) lastValue = this.data.value;\r
            const self = this;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => {\r
                    const v = self.data.value;\r
                    return v == null ? "" : v;\r
                },\r
                set: (v) => {\r
                    const norm = v == null ? null : v;\r
                    if (norm === lastValue) return;\r
                    lastValue = norm;\r
                    self.data.value = norm;\r
                    self.syncValue();\r
                },\r
                configurable: true,\r
            });\r
            if (lastValue !== undefined) this.data.value = lastValue;\r
\r
            setTimeout(() => {\r
                const nameAttr = this.el.getAttribute("name");\r
                const c = this.carrierEl();\r
                if (c && nameAttr != null) c.name = nameAttr;\r
                this.data.uid = "asc-select-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);\r
                this.el.setAttribute("data-asc-select-uid", this.data.uid);\r
                this.rebuildFiltered();\r
                this.syncValue();\r
                this.syncOpen();\r
                this.syncInteractive();\r
            }, 0);\r
\r
            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });\r
            this.watch("options", () => { setTimeout(() => { this.rebuildFiltered(); this.syncValue(); }, 0); });\r
            this.watch("filterText", () => { this.rebuildFiltered(); });\r
            this.watch("activeIndex", () => { this.syncActive(); });\r
            this.watch("open", () => { this.syncOpen(); });\r
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });\r
            this.watch("loading", () => { this.el.toggleAttribute("data-loading", !!this.data.loading); });\r
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });\r
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-select">\r
    .asc-select {\r
      cursor: pointer;\r
    }\r
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断\r
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */\r
    .asc-select[data-disabled] {\r
      cursor: not-allowed;\r
      opacity: 0.55;\r
    }\r
    .asc-select[data-disabled] .asc-select-trigger {\r
      pointer-events: none;\r
    }\r
    .asc-select[data-readonly] {\r
      cursor: default;\r
    }\r
\r
    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面，\r
             含盒饰 padding 区域）；可聚焦（tabindex 由 JS 通道维护禁用态） ---------- */\r
    .asc-select-trigger {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      margin-inline: calc(\r
        -1 * var(--auto-input-padding, var(--asc-field-padding, 0.6rem))\r
      );\r
      padding-inline: var(--auto-input-padding, var(--asc-field-padding, 0.6rem));\r
      align-self: stretch;\r
      outline: none;\r
    }\r
    .asc-select-value {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-color, var(--asc-select-color, #333333));\r
    }\r
    .asc-select-placeholder {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      color: var(--auto-input-placeholder, var(--asc-select-placeholder, rgba(0, 0, 0, 0.35)));\r
    }\r
\r
    .asc-select-clear {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      cursor: pointer;\r
      border-radius: var(--auto-border-radius, var(--asc-select-action-radius, 0.25rem));\r
      color: var(--auto-third-color, var(--asc-select-action, rgba(0, 0, 0, 0.35)));\r
      transition: color 0.15s ease;\r
    }\r
    .asc-select-clear:hover {\r
      color: var(--auto-color, var(--asc-select-action-hover, #606060));\r
    }\r
    .asc-select-clear:active {\r
      transform: scale(0.92);\r
    }\r
    /* 下拉箭头：开合旋转 180°（data-open 由 JS 通道同步）；loading 态换旋转图标\r
       （图标自带旋转动画，方向旋转停用） */\r
    .asc-select-arrow {\r
      flex: none;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      margin-left: 0.35em;\r
      color: var(--auto-third-color, var(--asc-select-arrow, rgba(0, 0, 0, 0.35)));\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-select[data-open] .asc-select-arrow {\r
      transform: rotate(180deg);\r
    }\r
    .asc-select[data-loading] .asc-select-arrow {\r
      transform: none;\r
      color: var(--asc-field-tone);\r
    }\r
\r
    [dark] .asc-select-value,\r
    [data-dark] .asc-select-value {\r
      color: var(--auto-color, var(--asc-select-color, #fafafa));\r
    }\r
    [dark] .asc-select-placeholder,\r
    [data-dark] .asc-select-placeholder {\r
      color: var(--auto-input-placeholder, var(--asc-select-placeholder, rgba(255, 255, 255, 0.4)));\r
    }\r
    [dark] .asc-select-clear,\r
    [dark] .asc-select-arrow,\r
    [data-dark] .asc-select-clear,\r
    [data-dark] .asc-select-arrow {\r
      color: var(--auto-third-color, var(--asc-select-action, rgba(255, 255, 255, 0.45)));\r
    }\r
    [dark] .asc-select-clear:hover,\r
    [data-dark] .asc-select-clear:hover {\r
      color: var(--auto-color, var(--asc-select-action-hover, #fafafa));\r
    }\r
\r
    /* ══════════ 下拉面板（autospark-select-panel，渲染进 body 覆盖物容器；样式经\r
       本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════ */\r
    .asc-select-panel {\r
      display: block;\r
      min-width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-select-panel-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, var(--asc-select-panel-line-height, 1.4));\r
      color: var(--auto-color, var(--asc-select-panel-color, #333333));\r
    }\r
    .asc-select-filter {\r
      padding: 0.4em 0.6em;\r
      border-bottom: var(--auto-border-size, var(--asc-select-filter-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-select-filter-border, #f0f0f0));\r
    }\r
    .asc-select-filter-input {\r
      box-sizing: border-box;\r
      width: 100%;\r
      border: none;\r
      outline: none;\r
      background: transparent;\r
      padding: 0.25em 0.1em;\r
      border-bottom: 1px solid transparent;\r
      color: inherit;\r
      font: inherit;\r
    }\r
    .asc-select-filter-input:focus {\r
      border-bottom-color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-select-primary, #009aff)));\r
    }\r
    .asc-select-list {\r
      max-height: var(--asc-select-max-height, 15em);\r
      overflow-y: auto;\r
      padding: 0.25em 0;\r
      box-sizing: border-box;\r
    }\r
    /* 虚拟分支行高固定 32px（虚拟化需确定项高——规范用法显式声明，与字号档位解耦，\r
       ADR-0022 决策 4；与 x-for-options 的 itemHeight: 32 配套） */\r
    .asc-select-virtual .asc-select-option {\r
      height: 32px;\r
      min-height: 0;\r
      box-sizing: border-box;\r
    }\r
    /* 选项：行式热区；悬停/高亮/选中/禁用态经 data-* 属性选择器驱动（绑定通道写\r
       属性——假值整个移除即无态，绑定语义天然契合） */\r
    .asc-select-option {\r
      display: flex;\r
      align-items: center;\r
      gap: 0.4em;\r
      min-height: 2.2em;\r
      padding: 0.3em 0.75em;\r
      cursor: pointer;\r
      transition: background-color 0.12s ease;\r
    }\r
    .asc-select-option-label {\r
      flex: 1 1 auto;\r
      min-width: 0;\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
    }\r
    .asc-select-option-check {\r
      flex: none;\r
      display: none;\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #009aff));\r
    }\r
    .asc-select-option[data-selected] {\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #009aff));\r
    }\r
    .asc-select-option[data-selected] .asc-select-option-check {\r
      display: inline-flex;\r
    }\r
    .asc-select-option[data-active]:not([data-selected]) {\r
      background: var(--auto-hover-bgcolor, var(--asc-select-option-hover-bg, rgba(0, 0, 0, 0.045)));\r
    }\r
    .asc-select-option[data-disabled] {\r
      color: var(--auto-disable-color, var(--asc-select-option-disabled, rgba(0, 0, 0, 0.28)));\r
      cursor: not-allowed;\r
      background: transparent;\r
    }\r
    .asc-select-option[data-disabled]:hover {\r
      background: transparent;\r
    }\r
    .asc-select-empty {\r
      padding: 0.9em 0.75em;\r
      text-align: center;\r
      color: var(--auto-third-color, var(--asc-select-empty, rgba(0, 0, 0, 0.35)));\r
    }\r
    [dark] .asc-select-panel,\r
    [data-dark] .asc-select-panel {\r
      color: var(--auto-color, var(--asc-select-panel-color, #fafafa));\r
    }\r
    [dark] .asc-select-filter,\r
    [data-dark] .asc-select-filter {\r
      border-bottom-color: var(--auto-border-color, var(--asc-select-filter-border, #52525b));\r
    }\r
    [dark] .asc-select-option[data-active]:not([data-selected]),\r
    [data-dark] .asc-select-option[data-active]:not([data-selected]) {\r
      background: var(--auto-hover-bgcolor, var(--asc-select-option-hover-bg, rgba(255, 255, 255, 0.08)));\r
    }\r
    [dark] .asc-select-option[data-selected],\r
    [data-dark] .asc-select-option[data-selected] {\r
      color: var(--auto-primary-color, var(--asc-select-panel-primary, #56baff));\r
    }\r
    [dark] .asc-select-option[data-disabled],\r
    [data-dark] .asc-select-option[data-disabled] {\r
      color: var(--auto-disable-color, var(--asc-select-option-disabled, rgba(255, 255, 255, 0.25)));\r
    }\r
    [dark] .asc-select-empty,\r
    [data-dark] .asc-select-empty {\r
      color: var(--auto-third-color, var(--asc-select-empty, rgba(255, 255, 255, 0.45)));\r
    }\r
  </style>\r
  <input type="hidden" class="asc-select-carrier" />\r
  <span\r
    class="asc-select-trigger"\r
    x-popover:autospark-select-panel\r
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"\r
    tabindex="0"\r
    role="combobox"\r
    aria-haspopup="listbox"\r
    aria-expanded="false"\r
    data-autospark-control\r
    @keydown="onTriggerKeydown($event)"\r
  >\r
    <span class="asc-select-value" x-if="hasValue" x-text="labelText"></span>\r
    <span\r
      class="asc-select-placeholder"\r
      x-if="!hasValue"\r
      x-text="placeholder || (t('select.placeholder') === 'select.placeholder' ? '请选择' : t('select.placeholder'))"\r
    ></span>\r
  </span>\r
  <i\r
    class="asc-select-clear"\r
    data-autospark-action\r
    x-if="clearable && hasValue"\r
    x-icon="'no'"\r
    @click="onClear($event)"\r
  ></i>\r
  <i\r
    class="asc-select-arrow"\r
    data-autospark-action\r
    x-icon="loading ? 'loading' : 'select-down'"\r
  ></i>\r
</span>\r
`,i=`<div class="asc-select-panel" x-define="autospark-select-panel">\r
  <script setup>\r
    {\r
        data: () => ({}),\r
        methods: {\r
            onFilterKeydown(event) {\r
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {\r
                    event.preventDefault();\r
                    this.data.keyTick = Number(this.data.keyTick || 0) + 1;\r
                    this.data.keyDir = event.key === "ArrowDown" ? 1 : -1;\r
                } else if (event.key === "Enter") {\r
                    event.preventDefault();\r
                    if (this.data.activeValue != null) {\r
                        this.data.pickTick = Number(this.data.pickTick || 0) + 1;\r
                        this.data.pickValue = this.data.activeValue;\r
                    }\r
                }\r
            },\r
        },\r
        mounted() {\r
            this.data.open = true;\r
            const uid = this.data.uid;\r
            if (uid) {\r
                const box = document.querySelector('[data-asc-select-uid="' + uid + '"]');\r
                const shellPanel = this.el.closest("[data-overlay]");\r
                if (box && shellPanel) {\r
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";\r
                }\r
            }\r
            const scrollActive = () => {\r
                const el = this.el.querySelector(\r
                    ".asc-select-option[data-active], .asc-select-option[data-selected]",\r
                );\r
                el?.scrollIntoView?.({ block: "nearest" });\r
            };\r
            setTimeout(scrollActive, 0);\r
            this.watch("activeValue", () => { setTimeout(scrollActive, 0); });\r
        },\r
        unmounted() {\r
            this.data.open = false;\r
        },\r
    }\r
  <\/script>\r
  <div class="asc-select-filter" x-if="filterable">\r
    <input\r
      class="asc-select-filter-input"\r
      type="text"\r
      x-on:input="filterText = $event.target.value"\r
      x-on:keydown="onFilterKeydown($event)"\r
    />\r
  </div>\r
  <div class="asc-select-list" x-if="!virtual" x-loading="loading">\r
    <template x-for="option of filteredOptions" :key="option.value">\r
      <div\r
        class="asc-select-option"\r
        x-bind:data-selected="String(option.value) === String(value)"\r
        x-bind:data-active="option.value === activeValue"\r
        x-bind:data-disabled="!!option.disabled"\r
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"\r
      >\r
        <span class="asc-select-option-label" x-text="option.label"></span>\r
        <i class="asc-select-option-check" x-icon="'yes'" x-if="String(option.value) === String(value)"></i>\r
      </div>\r
    </template>\r
    <div\r
      class="asc-select-empty"\r
      x-if="!loading && !(filteredOptions && filteredOptions.length > 0)"\r
      x-text="t('select.empty') === 'select.empty' ? '暂无数据' : t('select.empty')"\r
    ></div>\r
  </div>\r
  <div class="asc-select-virtual" x-if="virtual">\r
    <div\r
      class="asc-select-list"\r
      x-for.virtual="option of filteredOptions"\r
      :key="option.value"\r
      x-for-options="{ itemHeight: 32 }"\r
      x-loading="loading"\r
    >\r
      <div\r
        class="asc-select-option"\r
        x-bind:data-selected="String(option.value) === String(value)"\r
        x-bind:data-active="option.value === activeValue"\r
        x-bind:data-disabled="!!option.disabled"\r
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"\r
      >\r
        <span class="asc-select-option-label" x-text="option.label"></span>\r
        <i class="asc-select-option-check" x-icon="'yes'" x-if="String(option.value) === String(value)"></i>\r
      </div>\r
    </div>\r
    <div\r
      class="asc-select-empty"\r
      x-if="!loading && !(filteredOptions && filteredOptions.length > 0)"\r
      x-text="t('select.empty') === 'select.empty' ? '暂无数据' : t('select.empty')"\r
    ></div>\r
  </div>\r
</div>\r
`,a=`autospark.select`,o=`autospark-select-panel`,s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;function c(e){e.icons?.add?.(`select-down`,s),e.components[a]=r,e.components[o]=i}l();function l(){e(e=>{c(e)})}};
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

//# sourceMappingURL=autospark.select.js.map
