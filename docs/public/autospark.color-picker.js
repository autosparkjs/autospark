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
  class="asc-color-picker asc-field-box"
  x-define="autospark.color-picker"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "#000000",
            presets: [],
            name: "",
            committed: "#000000",
            h: 0,
            s: 0,
            v: 0,
            hueColor: "#ff0000",
            liveHex: "#000000",
            open: false,
            pickTick: 0,
            pickValue: "",
            applyTick: 0,
            applyHex: "",
            commitTick: 0,
        }),
        methods: {
            normalizeHex(v) {
                if (typeof v !== "string") return "#000000";
                let t = v.trim().replace(/^#/, "");
                if (/^[0-9a-fA-F]{3}$/.test(t)) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
                if (!/^[0-9a-fA-F]{6}$/.test(t)) return "#000000";
                return "#" + t.toLowerCase();
            },
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
            recomputeLive() {
                const h = Number(this.data.h) || 0;
                const s = Number(this.data.s) || 0;
                const v = Number(this.data.v) || 0;
                this.data.liveHex = this.hsvToHex(h, s, v);
                this.data.hueColor = this.hsvToHex(h, 1, 1);
            },
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
            commit() {
                this.data.committed = this.data.liveHex;
                this.data.value = this.data.liveHex;
                this.syncCarrier();
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(
                    new CustomEvent("change", { bubbles: true, detail: { value: this.data.committed } }),
                );
            },
            syncCarrier() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                c.value = String(this.data.committed ?? "");
                c.disabled = !!this.data.disabled;
            },
            syncName() {
                const c = this.el.querySelector(".asc-color-picker-carrier");
                if (!c) return;
                const n = this.data.name || this.el.getAttribute("name");
                if (n) c.name = n;
            },
            triggerEl() {
                return this.el.querySelector(".asc-color-picker-trigger");
            },
            syncOpen() {
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(!!this.data.open));
            },
            syncInteractive() {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                this.syncCarrier();
            },
            openPanel() {
                if (this.data.disabled) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.openPanel();
                }
            },
        },
        mounted() {
            const prior = this.el.value;
            const initV = typeof prior === "string" && prior !== "" ? prior : this.data.value;
            const self = this;
            Object.defineProperty(this.el, "value", {
                get: () => self.data.committed,
                set: (v) => {
                    const norm = self.normalizeHex(v);
                    if (norm === self.data.committed) return;
                    self.applyExternal(v);
                },
                configurable: true,
            });
            this.applyExternal(initV);

            setTimeout(() => {
                this.syncName();
                this.syncOpen();
                this.syncInteractive();
            }, 0);

            let lastPropsValue = this.data.value;
            this.watch("value", ({ value: v }) => {
                if (v === lastPropsValue) return;
                lastPropsValue = v;
                this.applyExternal(v);
            });
            this.watch("h", () => { this.recomputeLive(); });
            this.watch("s", () => { this.recomputeLive(); });
            this.watch("v", () => { this.recomputeLive(); });
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
                if (norm === this.data.committed) return;
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
                if (this.data.liveHex !== this.data.committed) this.commit();
            });
            this.watch("open", () => { this.syncOpen(); });
            this.watch("disabled", () => { setTimeout(() => this.syncInteractive(), 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-color-picker">
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
    .asc-color-picker-hex {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--auto-color, var(--asc-color-picker-color, #333333));
    }

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
      pointer-events: none;
    }
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
`,i=`<div class="asc-color-panel" x-define="autospark-color-panel">
  <script setup>
    {
        data: () => ({}),
        methods: {
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
                apply(e, el);
            },
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
            onHueDown(e) {
                if (this.data.disabled) return;
                this.bindDrag(e, ".asc-color-hue", (ev, el) => {
                    const rect = el.getBoundingClientRect();
                    const x = rect.width > 0 ? (ev.clientX - rect.left) / rect.width : 0;
                    this.data.h = Math.min(1, Math.max(0, x)) * 360;
                }, "commitTick");
            },
            onPresetClick(color) {
                if (this.data.disabled) return;
                this.data.pickTick = Number(this.data.pickTick || 0) + 1;
                this.data.pickValue = color;
            },
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
            this.data.open = true;
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <div class="asc-color-sv" :style="'background-color:' + hueColor" @pointerdown="onSvDown($event)">
    <span
      class="asc-color-sv-thumb"
      :style="'left:' + (s * 100) + '%;top:' + ((1 - v) * 100) + '%'"
    ></span>
  </div>
  <div class="asc-color-hue" @pointerdown="onHueDown($event)">
    <span class="asc-color-hue-thumb" :style="'left:' + (h / 360 * 100) + '%'"></span>
  </div>
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
