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
  class="asc-time-select asc-field-box"
  x-define="autospark.time-select"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",
            placeholder: "",
            clearable: false,
            start: "00:00",
            end: "23:00",
            step: "00:30",
            name: "",
            uid: "",
            hasValue: false,
            open: false,
            options: [],
            activeIndex: -1,
            activeValue: null,
            pickTick: 0,
            pickValue: null,
            keyTick: 0,
            keyDir: 0,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-time-select-trigger");
            },
            carrierEl() {
                return this.el.querySelector(".asc-time-select-carrier");
            },
            pad2(n) {
                return String(n).padStart(2, "0");
            },
            parseHmMinutes(s) {
                if (typeof s !== "string") return null;
                const p = s.split(":");
                if (p.length !== 2) return null;
                const h = Number(p[0]), mi = Number(p[1]);
                if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
                if (h < 0 || mi < 0) return null;
                return h * 60 + mi;
            },
            fmtMinutes(total) {
                const t = ((total % 1440) + 1440) % 1440;
                return this.pad2(Math.floor(t / 60)) + ":" + this.pad2(t % 60);
            },
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
            syncActive() {
                const list = this.data.options ?? [];
                const i = this.data.activeIndex;
                if (i >= 0 && i < list.length) this.data.activeValue = list[i].value ?? null;
                else this.data.activeValue = null;
            },
            setActiveToValue() {
                const list = this.data.options ?? [];
                let i = list.findIndex((o) => o && String(o.value) === String(this.data.value));
                if (i < 0 && list.length > 0) i = 0;
                this.data.activeIndex = i;
                this.syncActive();
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
                if (on) this.setActiveToValue();
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
            moveActive(dir) {
                const list = this.data.options ?? [];
                if (list.length === 0) return;
                const i = this.data.activeIndex;
                this.data.activeIndex = (i + dir + list.length) % list.length;
                this.syncActive();
            },
            confirmActive() {
                if (this.data.activeValue != null) this.pick(this.data.activeValue);
            },
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
                this.data.uid = "asc-time-select-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
                this.el.setAttribute("data-asc-time-select-uid", this.data.uid);
                this.rebuildOptions();
                this.syncValue();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            this.watch("value", () => { lastValue = this.data.value; this.syncValue(); });
            this.watch("start", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("end", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("step", () => setTimeout(() => this.rebuildOptions(), 0));
            this.watch("open", () => this.syncOpen());
            this.watch("disabled", () => setTimeout(() => this.syncInteractive(), 0));
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("keyTick", () => { this.moveActive(Number(this.data.keyDir) || 1); });
        },
    }
  <\/script>
  <style global id="autospark-components-time-select">
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
    .asc-time-select-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-time-select-empty, rgba(0, 0, 0, 0.35)));
    }
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
`,i=`<div class="asc-time-select-panel" x-define="autospark-time-select-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-time-select-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
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
            this.data.open = false;
        },
    }
  <\/script>
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
