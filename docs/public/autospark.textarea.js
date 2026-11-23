(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}function i(e){e.components[`autospark.field`]=`<span\r
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
`}a();function a(){e(e=>{i(e)})}var o=`<span
  class="asc-textarea asc-field-box"
  x-define="autospark.textarea"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        data: () => ({
            value: "",
            placeholder: "",
            maxlength: 0,
            rows: 2,
            minRows: 0,
            maxRows: 8,
            autosize: true,
            resize: "",
            clearable: false,
            showCount: false,
            hasValue: false,
            countText: "",
            countVisible: false,
        }),
        methods: {
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.el.querySelector(".asc-textarea-native");
                if (!n) return;
                n.value = "";
                n.dispatchEvent(new Event("input", { bubbles: true }));
                n.focus();
            },
        },
        mounted() {
            const native = () => this.el.querySelector(".asc-textarea-native");
            let lastValue = "";

            const autoResize = () => {
                const n = native();
                if (!n) return;
                if (!this.data.autosize) {
                    n.style.height = "";
                    n.style.overflowY = "auto";
                    return;
                }
                const cs = getComputedStyle(n);
                const lineHeight = parseFloat(cs.lineHeight) || 0;
                const padY =
                    (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
                const borderY =
                    (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
                const minRows = Math.max(
                    1,
                    Number(this.data.minRows) || Number(this.data.rows) || 2,
                );
                const maxRows = Math.max(0, Number(this.data.maxRows) || 0);
                const minHeight = lineHeight > 0 ? lineHeight * minRows + padY + borderY : 0;
                const maxHeight =
                    lineHeight > 0 && maxRows > 0
                        ? lineHeight * maxRows + padY + borderY
                        : Infinity;
                n.style.height = "auto";
                const contentHeight = n.scrollHeight + borderY;
                n.style.height = \`\${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px\`;
                n.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
            };

            const syncLen = () => {
                const n = native();
                const len = n ? String(n.value ?? "").length : 0;
                this.data.hasValue = len > 0;
                const max = Number(this.data.maxlength) || 0;
                this.data.countText = max > 0 ? \`\${len} / \${max}\` : \`\${len}\`;
                this.data.countVisible = !!this.data.showCount || max > 0;
                this.el.toggleAttribute("data-over", max > 0 && len > max);
            };

            const syncValue = () => {
                const n = native();
                if (n) n.value = lastValue;
                syncLen();
                autoResize();
            };

            const syncAttrs = () => {
                const n = native();
                if (!n) return;
                n.placeholder = String(this.data.placeholder ?? "");
                const ml = Number(this.data.maxlength) || 0;
                if (ml > 0) n.setAttribute("maxlength", String(ml));
                else n.removeAttribute("maxlength");
                n.rows = Math.max(1, Number(this.data.rows) || 2);
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) n.name = nameAttr;
                n.style.resize = this.data.autosize
                    ? "none"
                    : String(this.data.resize) || "vertical";
                autoResize();
            };

            const prior = this.el.value;
            if (typeof prior === "string" && prior !== "") lastValue = prior;
            else if (this.data.value != null) lastValue = String(this.data.value);
            const snapshotNorm = String(prior ?? "");
            let initDone = false;
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const n = native();
                    return n ? n.value : lastValue;
                },
                set: (v) => {
                    if (!initDone && String(v ?? "") === snapshotNorm) return;
                    lastValue = String(v ?? "");
                    const n = native();
                    if (n) n.value = lastValue;
                    syncLen();
                    autoResize();
                },
                configurable: true,
            });

            this.el.addEventListener("input", () => {
                const n = native();
                if (n) lastValue = n.value;
                syncLen();
                autoResize();
            });

            if (typeof ResizeObserver !== "undefined") {
                let lastWidth = 0;
                const ro = new ResizeObserver((entries) => {
                    const width = entries[0]?.contentRect?.width ?? 0;
                    if (Math.abs(width - lastWidth) < 1) return;
                    lastWidth = width;
                    autoResize();
                });
                const n = native();
                if (n) ro.observe(n);
            }

            setTimeout(() => {
                syncAttrs();
                syncValue();
                initDone = true;
                if (Array.isArray(this.data.actions) && this.data.actions.length > 0) {
                    this.engine?.logger?.warn("autospark.textarea: 不支持 actions（ADR-0032 修订，多行形态已取消融合动作），注入已忽略");
                }
            }, 0);

            this.watch("placeholder", () => { setTimeout(syncAttrs, 0); });
            this.watch("maxlength", () => { setTimeout(() => { syncAttrs(); syncLen(); }, 0); });
            this.watch("showCount", () => { setTimeout(syncLen, 0); });
            this.watch("rows", () => { setTimeout(() => { syncAttrs(); autoResize(); }, 0); });
            this.watch("minRows", () => { setTimeout(autoResize, 0); });
            this.watch("maxRows", () => { setTimeout(autoResize, 0); });
            this.watch("autosize", () => { setTimeout(syncAttrs, 0); });
            this.watch("resize", () => { setTimeout(syncAttrs, 0); });
            let lastPropsValue = String(this.data.value ?? "");
            this.watch("value", ({ value }) => {
                const v = String(value ?? "");
                if (v === lastPropsValue) return;
                lastPropsValue = v;
                if (v === lastValue) return;
                lastValue = v;
                const n = native();
                if (n) n.value = v;
                syncLen();
                autoResize();
            });
        },
    }
  <\/script>
  <style global id="autospark-components-textarea">
    /* ---------- 满宽惯例：多行输入默认占满可用宽（field 基座 inline-flex 收缩内容宽，
         input 等单行形态靠消费方给宽；textarea 惯例块级满宽——子样式拼接序在骨架后，胜） ---------- */
    .asc-textarea {
      width: 100%;
    }

    .asc-textarea-native {
      box-sizing: border-box;
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      height: auto;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      line-height: inherit;
      cursor: inherit;
      resize: none;
      overflow-y: hidden;
    }
    .asc-textarea-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-textarea-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-textarea-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-textarea-disable-color, inherit));
    }

    .asc-textarea.asc-field-box {
      position: relative;
      height: auto;
      flex-direction: column;
      align-items: stretch;
      cursor: text;
    }

    .asc-textarea-clear {
      position: absolute;
      top: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2);
      inset-inline-end: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 2);
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-textarea-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-textarea-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-textarea-clear:hover {
      color: var(--auto-color, var(--asc-textarea-action-hover, #606060));
    }
    .asc-textarea-clear:active {
      transform: scale(0.92);
    }

    /* ---------- 计数器：绝对定位右下角（不占文本行宽；控件底部预留内距避免压字）；
         超限（data-over 由 mounted 同步）染 danger ---------- */
    .asc-textarea-count {
      position: absolute;
      inset-block-end: calc(var(--auto-input-padding, var(--asc-field-padding, 0.8rem)) / 4);
      inset-inline-end: var(--auto-input-padding, var(--asc-field-padding, 0.8rem));
      font-size: 0.75em;
      line-height: 1;
      white-space: nowrap;
      pointer-events: none;
      color: var(--auto-third-color, var(--asc-textarea-count, rgba(0, 0, 0, 0.35)));
    }
    .asc-textarea[data-over] .asc-textarea-count {
      color: var(--auto-danger-color, var(--asc-textarea-count-over, #ef4444));
    }

    .asc-textarea:has(.asc-textarea-clear) .asc-textarea-native {
      padding-inline-end: 1.5em;
    }
    .asc-textarea:has(.asc-textarea-count) .asc-textarea-native {
      padding-block-end: 1.25em;
    }

    /* ---------- actions 不支持（ADR-0032 修订，2026-11-17 取消）：多行形态取消融合
         动作——field 渲染段整段屏蔽（display:none，注入静默忽略；mounted 对非空
         actions warn 一次）。此前「上/下整行布局」方案废止 ---------- */
    .asc-textarea .asc-field-actions {
      display: none;
    }

    [dark] .asc-textarea-native::placeholder,
    [data-dark] .asc-textarea-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-textarea-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-textarea-clear,
    [data-dark] .asc-textarea-clear {
      color: var(--auto-third-color, var(--asc-textarea-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-textarea-clear:hover,
    [data-dark] .asc-textarea-clear:hover {
      color: var(--auto-color, var(--asc-textarea-action-hover, #fafafa));
    }
    [dark] .asc-textarea-count,
    [data-dark] .asc-textarea-count {
      color: var(--auto-third-color, var(--asc-textarea-count, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-textarea[data-over] .asc-textarea-count,
    [data-dark] .asc-textarea[data-over] .asc-textarea-count {
      color: var(--auto-danger-color, var(--asc-textarea-count-over, #e6696a));
    }
  </style>
  <textarea class="asc-textarea-native" data-autospark-control rows="2"></textarea>
  <i
    class="asc-textarea-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <span class="asc-textarea-count" x-if="countVisible">{{ countText }}</span>
</span>
`,s=`autospark.textarea`,c=new Set([`disabled`,`readonly`,`clearable`,`show-count`,`autosize`]);function l(e){e.components[s]=o,e.precompile?.(e=>{for(let i of Array.from(e.el.querySelectorAll(`x-textarea`))){let e=document.createElement(`span`),a=[];for(let o of Array.from(i.attributes)){if(o.name.startsWith(`:`)){a.push(`${n(t(o.name.slice(1)))}: (${o.value})`);continue}if(o.name===`class`||o.name===`style`||o.name===`id`||o.name===`name`||o.name===`title`||o.name.startsWith(`data-`)||o.name.startsWith(`x-`)||o.name.startsWith(`@`)){e.setAttribute(o.name,o.value);continue}let i=t(o.name);o.value===``&&c.has(o.name)?a.push(`${n(i)}: true`):a.push(`${n(i)}: ${JSON.stringify(r(o.value))}`)}let o=i.textContent?.trim()??``,l=a.some(e=>e.startsWith(`value:`)),u=i.children.length>0;for(o!==``&&!l&&!u&&(a.push(`value: ${JSON.stringify(o)}`),i.textContent=``),e.setAttribute(`x-component:${s}`,`{ ${a.join(`, `)} }`);i.firstChild;)e.appendChild(i.firstChild);i.replaceWith(e)}})}u();function u(){e(e=>{l(e)})}};
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

//# sourceMappingURL=autospark.textarea.js.map
