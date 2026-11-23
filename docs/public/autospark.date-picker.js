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
`}n();function n(){e(e=>{t(e)})}var r=`<span
  class="asc-date-picker asc-field-box"
  x-define="autospark.date-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",
            placeholder: "",
            clearable: false,
            name: "",
            hasValue: false,
            open: false,
            viewYear: 0,
            viewMonth: 0,
            days: [],
            weekdayLabels: [],
            headerText: "",
            todayValue: "",
            todayText: "今天",
            activeValue: "",
            pickTick: 0,
            pickValue: null,
            monthTick: 0,
            monthDelta: 0,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-date-picker-trigger");
            },
            carrierEl() {
                return this.el.querySelector(".asc-date-picker-carrier");
            },
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            parseYmd(s) {
                if (typeof s !== "string") return null;
                const p = s.split("-");
                if (p.length !== 3) return null;
                const y = Number(p[0]), m = Number(p[1]) - 1, d = Number(p[2]);
                if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
                if (m < 0 || m > 11 || d < 1 || d > 31) return null;
                return { y: y, m: m, d: d };
            },
            fmtYmd(y, m, d) {
                return y + "-" + this.pad2(m + 1) + "-" + this.pad2(d);
            },
            tOr(key, fallback, namedArgs) {
                try {
                    const engine = this.engine;
                    if (engine && typeof engine.translate === "function") {
                        const out = namedArgs
                            ? engine.translate(this.scope, key, namedArgs)
                            : engine.translate(this.scope, key);
                        if (out !== key) return String(out);
                    }
                } catch (e) { /* 查表异常回退 */ }
                return fallback;
            },
            refreshLocale() {
                const wd = this.tOr("date-picker.weekdays", "日,一,二,三,四,五,六");
                this.data.weekdayLabels = String(wd).split(",");
                this.data.todayText = this.tOr("date-picker.today", "今天");
                const n = new Date();
                this.data.todayValue = this.fmtYmd(n.getFullYear(), n.getMonth(), n.getDate());
            },
            rebuild() {
                const y = this.data.viewYear, m = this.data.viewMonth;
                if (!Number.isFinite(y) || !Number.isFinite(m) || m < 0 || m > 11) return;
                const first = new Date(y, m, 1);
                const start = new Date(y, m, 1 - first.getDay());
                const today = this.data.todayValue;
                const cells = [];
                for (let i = 0; i < 42; i++) {
                    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                    const v = this.fmtYmd(d.getFullYear(), d.getMonth(), d.getDate());
                    cells.push({ value: v, day: d.getDate(), out: d.getMonth() !== m, today: v === today });
                }
                this.data.days = cells;
                this.data.headerText = this.tOr(
                    "date-picker.month-format",
                    y + "年" + (m + 1) + "月",
                    { y: y, m: m + 1 },
                );
            },
            syncValue() {
                const has = this.data.value != null && this.data.value !== "";
                this.data.hasValue = has;
                const c = this.carrierEl();
                if (c) {
                    c.value = has ? String(this.data.value) : "";
                    c.disabled = !!this.data.disabled;
                }
            },
            syncOpen() {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) {
                    this.refreshLocale();
                    const v = this.parseYmd(this.data.value);
                    const n = new Date();
                    const base = v || { y: n.getFullYear(), m: n.getMonth() };
                    this.data.viewYear = base.y;
                    this.data.viewMonth = base.m;
                    this.data.activeValue = v ? this.data.value : this.data.todayValue;
                    this.rebuild();
                }
            },
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                const c = this.carrierEl();
                if (c) c.disabled = !!this.data.disabled;
                if (this.data.disabled && this.data.open) this.closePanel();
            },
            emitChange() {
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.value } }),
                );
            },
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            shiftMonth(delta) {
                let y = this.data.viewYear, m = this.data.viewMonth + (delta > 0 ? 1 : -1);
                if (m > 11) { y += 1; m = 0; }
                if (m < 0) { y -= 1; m = 11; }
                this.data.viewYear = y;
                this.data.viewMonth = m;
                this.rebuild();
            },
            moveActive(deltaDays) {
                const cur = this.parseYmd(this.data.activeValue) || this.parseYmd(this.data.todayValue);
                if (!cur) return;
                const t = new Date(cur.y, cur.m, cur.d + deltaDays);
                const vy = t.getFullYear(), vm = t.getMonth();
                if (vy !== this.data.viewYear || vm !== this.data.viewMonth) {
                    this.data.viewYear = vy;
                    this.data.viewMonth = vm;
                }
                this.data.activeValue = this.fmtYmd(vy, vm, t.getDate());
                this.rebuild();
            },
            confirmActive() {
                if (this.data.activeValue) this.pick(this.data.activeValue);
            },
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                if (typeof v !== "string" || v === "") return;
                if (v === this.data.value) { this.closePanel(); return; }
                this.data.value = v;
                this.syncValue();
                const p = this.parseYmd(v);
                if (p) {
                    this.data.viewYear = p.y;
                    this.data.viewMonth = p.m;
                    this.rebuild();
                }
                this.emitChange();
                this.closePanel();
                this.triggerEl()?.focus();
            },
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                if (!this.data.hasValue) return;
                this.data.value = "";
                this.syncValue();
                this.emitChange();
                this.triggerEl()?.focus();
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                const k = event.key;
                if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.moveActive(k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : k === "ArrowUp" ? -7 : 7);
                } else if (k === "PageUp" || k === "PageDown") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.shiftMonth(k === "PageUp" ? -1 : 1);
                } else if (k === "Enter") {
                    event.preventDefault();
                    if (this.data.open) this.confirmActive();
                    else this.openPanel();
                }
            },
        },
        mounted() {
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
                this.refreshLocale();
                const v = this.parseYmd(this.data.value);
                const n = new Date();
                const base = v || { y: n.getFullYear(), m: n.getMonth() };
                this.data.viewYear = base.y;
                this.data.viewMonth = base.m;
                this.rebuild();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("viewYear", () => this.rebuild());
            this.watch("viewMonth", () => this.rebuild());
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("monthTick", () => { this.shiftMonth(Number(this.data.monthDelta) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-date-picker">
    .asc-date-picker {
      cursor: pointer;
    }
    /* 禁用（骨架通道 [data-disabled]）：整体淡化 + 禁点（触发器 pointer-events 阻断
       popover 点击 toggle——popover 宿主监听不知禁用态，CSS 层拦截） */
    .asc-date-picker[data-disabled] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .asc-date-picker[data-disabled] .asc-date-picker-trigger {
      pointer-events: none;
    }
    .asc-date-picker[data-readonly] {
      cursor: default;
    }

    /* ---------- 触发器热区：负 margin 全铺盒饰内距（点击 toggle 覆盖整个盒面）；
             可聚焦（tabindex 由 JS 通道维护禁用态） ---------- */
    .asc-date-picker-trigger {
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
    .asc-date-picker-value {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-date-picker-color, #333333));
    }
    .asc-date-picker-placeholder {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-input-placeholder, var(--asc-date-picker-placeholder, rgba(0, 0, 0, 0.35)));
    }

    .asc-date-picker-clear {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-date-picker-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-date-picker-clear:hover {
      color: var(--auto-color, var(--asc-date-picker-action-hover, #606060));
    }
    .asc-date-picker-clear:active {
      transform: scale(0.92);
    }
    .asc-date-picker-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      color: var(--auto-third-color, var(--asc-date-picker-icon, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-date-picker[data-open] .asc-date-picker-icon {
      color: var(--asc-field-tone, var(--auto-primary-color, var(--asc-date-picker-primary, #009aff)));
    }

    [dark] .asc-date-picker-value,
    [data-dark] .asc-date-picker-value {
      color: var(--auto-color, var(--asc-date-picker-color, #fafafa));
    }
    [dark] .asc-date-picker-placeholder,
    [data-dark] .asc-date-picker-placeholder {
      color: var(--auto-input-placeholder, var(--asc-date-picker-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-date-picker-clear,
    [dark] .asc-date-picker-icon,
    [data-dark] .asc-date-picker-clear,
    [data-dark] .asc-date-picker-icon {
      color: var(--auto-third-color, var(--asc-date-picker-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-date-picker-clear:hover,
    [data-dark] .asc-date-picker-clear:hover {
      color: var(--auto-color, var(--asc-date-picker-action-hover, #fafafa));
    }

    /* ══════════ 日历面板（autospark-date-picker-panel，渲染进 body 覆盖物容器；
       样式经本 style 段随插件注入——面板与触发器同产物加载，id 幂等键单一）══════════
       语义色组织（ADR-0025 视觉对齐）：--asc-tone 中转变量（alert/tag 定型结构），
       选中实底 tone + 白字，hover/active 走 color-mix 派生 */
    .asc-date-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-date-picker-primary, #009aff));
      display: block;
      padding: 0.6em;
      font-size: var(--auto-font-size, var(--asc-date-picker-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-date-picker-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-date-picker-panel-color, #333333));
    }
    .asc-date-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4em;
    }
    .asc-date-picker-nav {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2em;
      height: 2em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-nav-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-date-picker-nav, rgba(0, 0, 0, 0.45)));
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-date-picker-nav:hover {
      background: var(--auto-hover-bgcolor, var(--asc-date-picker-nav-hover-bg, rgba(0, 0, 0, 0.045)));
      color: var(--auto-color, var(--asc-date-picker-nav-hover, #333333));
    }
    .asc-date-picker-nav-prev {
      transform: rotate(180deg);
    }
    .asc-date-picker-title {
      flex: 1 1 auto;
      text-align: center;
      font-weight: var(--auto-font-weight, var(--asc-date-picker-title-weight, 500));
      color: var(--auto-color, var(--asc-date-picker-title, #333333));
    }
    .asc-date-picker-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 2.4em);
      justify-content: center;
    }
    .asc-date-picker-weekday {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.2em;
      color: var(--auto-third-color, var(--asc-date-picker-weekday, rgba(0, 0, 0, 0.45)));
    }
    /* 日格：单层 42 格扁平数组（不嵌套 x-for——内层渲染晚一跳边界规避），CSS 七列
       自然分行；**固定 em 轨道**（面板是 auto 宽弹层，1fr 轨道会塌到内容宽——面板
       宽度由 7×2.4em 定形，随字号档位 em 基准缩放） */
    .asc-date-picker-grid {
      display: grid;
      grid-template-columns: repeat(7, 2.4em);
      justify-content: center;
      row-gap: 0.1em;
    }
    .asc-date-picker-day {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2.2em;
      width: 100%;
      border-radius: var(--x-border-radius-circle, var(--asc-date-picker-day-radius, 50%));
      cursor: pointer;
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-date-picker-day:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    .asc-date-picker-day[data-active] {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--asc-tone) 45%, transparent);
    }
    .asc-date-picker-day[data-selected] {
      background: var(--asc-tone);
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-selected]:hover {
      background: var(--asc-tone);
    }
    .asc-date-picker-day[data-today] {
      color: var(--asc-tone);
      font-weight: var(--auto-font-weight, var(--asc-date-picker-today-weight, 500));
    }
    .asc-date-picker-day[data-today]:not([data-selected]) {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--asc-tone) 35%, transparent);
    }
    .asc-date-picker-day[data-today][data-selected] {
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-out] {
      color: var(--auto-third-color, var(--asc-date-picker-day-out, rgba(0, 0, 0, 0.28)));
    }
    .asc-date-picker-day[data-out][data-today],
    .asc-date-picker-day[data-out][data-selected] {
      color: var(--asc-date-picker-day-selected-ink, #ffffff);
    }
    .asc-date-picker-day[data-out][data-today] {
      color: var(--asc-tone);
    }
    .asc-date-picker-footer {
      display: flex;
      justify-content: center;
      margin-top: 0.4em;
      padding-top: 0.4em;
      border-top: var(--auto-border-size, var(--asc-date-picker-footer-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-date-picker-footer-border, #f0f0f0));
    }
    .asc-date-picker-today {
      border: none;
      background: transparent;
      padding: 0.25em 0.75em;
      cursor: pointer;
      font: inherit;
      border-radius: var(--auto-border-radius, var(--asc-date-picker-today-radius, 0.25rem));
      color: var(--asc-tone);
      transition: background-color 0.12s ease;
    }
    .asc-date-picker-today:hover {
      background: color-mix(in srgb, var(--asc-tone) 10%, transparent);
    }
    [dark] .asc-date-picker-panel,
    [data-dark] .asc-date-picker-panel {
      --asc-tone: var(--auto-primary-color, var(--asc-date-picker-primary, #56baff));
      color: var(--auto-color, var(--asc-date-picker-panel-color, #fafafa));
    }
    [dark] .asc-date-picker-nav,
    [dark] .asc-date-picker-weekday,
    [data-dark] .asc-date-picker-nav,
    [data-dark] .asc-date-picker-weekday {
      color: var(--auto-third-color, var(--asc-date-picker-nav, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-date-picker-nav:hover,
    [data-dark] .asc-date-picker-nav:hover {
      background: var(--auto-hover-bgcolor, var(--asc-date-picker-nav-hover-bg, rgba(255, 255, 255, 0.08)));
      color: var(--auto-color, var(--asc-date-picker-nav-hover, #fafafa));
    }
    [dark] .asc-date-picker-day[data-out],
    [data-dark] .asc-date-picker-day[data-out] {
      color: var(--auto-third-color, var(--asc-date-picker-day-out, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-date-picker-footer,
    [data-dark] .asc-date-picker-footer {
      border-top-color: var(--auto-border-color, var(--asc-date-picker-footer-border, #52525b));
    }
  </style>
  <input type="hidden" class="asc-date-picker-carrier" />
  <span
    class="asc-date-picker-trigger"
    x-popover:autospark-date-picker-panel
    x-popover-options="{ trigger: 'click', padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
    tabindex="0"
    role="combobox"
    aria-haspopup="grid"
    aria-expanded="false"
    data-autospark-control
    @keydown="onTriggerKeydown($event)"
  >
    <span class="asc-date-picker-value" x-if="hasValue" x-text="value"></span>
    <span
      class="asc-date-picker-placeholder"
      x-if="!hasValue"
      x-text="placeholder || (t('date-picker.placeholder') === 'date-picker.placeholder' ? '请选择日期' : t('date-picker.placeholder'))"
    ></span>
  </span>
  <i
    class="asc-date-picker-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i class="asc-date-picker-icon" data-autospark-action x-icon="'date-calendar'"></i>
</span>
`,i=`<div class="asc-date-picker-panel" x-define="autospark-date-picker-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <div class="asc-date-picker-header">
    <i
      class="asc-date-picker-nav asc-date-picker-nav-prev"
      @click="monthTick = monthTick + 1, monthDelta = -1"
      x-icon="'arrow'"
    ></i>
    <span class="asc-date-picker-title" x-text="headerText"></span>
    <i
      class="asc-date-picker-nav"
      @click="monthTick = monthTick + 1, monthDelta = 1"
      x-icon="'arrow'"
    ></i>
  </div>
  <div class="asc-date-picker-weekdays">
    <template x-for="w of weekdayLabels" :key="w">
      <span class="asc-date-picker-weekday" x-text="w"></span>
    </template>
  </div>
  <div class="asc-date-picker-grid" role="grid">
    <template x-for="day of days" :key="day.value">
      <span
        class="asc-date-picker-day"
        role="gridcell"
        x-bind:data-out="day.out"
        x-bind:data-today="day.today"
        x-bind:data-selected="day.value === value"
        x-bind:data-active="day.value === activeValue"
        x-on:click="pickTick = pickTick + 1, pickValue = day.value"
        x-text="day.day"
      ></span>
    </template>
  </div>
  <div class="asc-date-picker-footer">
    <button
      type="button"
      class="asc-date-picker-today"
      x-text="todayText"
      @click="pickTick = pickTick + 1, pickValue = todayValue"
    ></button>
  </div>
</div>
`,a=`autospark.date-picker`,o=`autospark-date-picker-panel`,s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`;function c(e){e.icons?.add?.(`date-calendar`,s),e.components[a]=r,e.components[o]=i}l();function l(){e(e=>{c(e)})}};
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

//# sourceMappingURL=autospark.date-picker.js.map
