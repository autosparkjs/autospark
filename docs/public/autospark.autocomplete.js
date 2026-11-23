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
  class="asc-autocomplete asc-field-box"
  x-define="autospark.autocomplete"
  x-define:inherit="autospark.field"
>
  <script setup>
    {
        debounceTimer: null,
        fetchSeq: 0,
        silent: false,
        lastHostClickAt: 0,
        composing: false,
        focused: false,
        lastValue: "",
        initDone: false,
        data: () => ({
            value: "",
            suggestions: [],
            fetch: null,
            debounce: 300,
            placeholder: "",
            clearable: false,
            uid: "",
            items: [],
            activeIndex: -1,
            activeValue: null,
            loading: false,
            hasValue: false,
            open: false,
            pickTick: 0,
            pickValue: null,
            hoverTick: 0,
            hoverValue: null,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-autocomplete-trigger");
            },
            nativeEl() {
                return this.el.querySelector(".asc-autocomplete-native");
            },
            normalizeList(list) {
                return (Array.isArray(list) ? list : []).map((s) => {
                    if (typeof s === "object" && s !== null) {
                        return {
                            value: s.value,
                            label: s.label != null ? s.label : s.value,
                            disabled: !!s.disabled,
                        };
                    }
                    return { value: s, label: s, disabled: false };
                });
            },
            filterLocal(query) {
                const kw = String(query ?? "").trim().toLowerCase();
                const src = this.normalizeList(this.data.suggestions);
                if (kw === "") return src;
                return src.filter(
                    (o) =>
                        String(o.label ?? "").toLowerCase().includes(kw) ||
                        String(o.value ?? "").toLowerCase().includes(kw),
                );
            },
            hasFetch() {
                return !!this.resolveFetch();
            },
            applyItems(list) {
                this.data.items = list;
                this.data.activeIndex = -1;
                this.syncActive();
                if (list.length > 0) {
                    if (this.focused) this.openPanel();
                } else {
                    this.closePanel();
                }
            },
            resolveFetch() {
                const raw = this.data.fetch;
                if (typeof raw === "function") return raw;
                if (typeof raw === "string" && raw.trim() !== "") {
                    const act = this.scope.getAction(raw.trim());
                    if (act && typeof act.handle === "function") return act.handle;
                }
                return null;
            },
            resolveNow(query) {
                if (this.data.disabled || this.data.readonly) return;
                const fn = this.resolveFetch();
                if (fn) {
                    const cur = ++this.fetchSeq;
                    this.data.loading = true;
                    Promise.resolve()
                        .then(() => fn.call(null, query))
                        .then((r) => {
                            if (cur !== this.fetchSeq) return;
                            this.data.loading = false;
                            this.applyItems(this.normalizeList(r));
                        })
                        .catch(() => {
                            if (cur !== this.fetchSeq) return;
                            this.data.loading = false;
                            this.applyItems([]);
                        });
                } else {
                    this.applyItems(this.filterLocal(query));
                }
            },
            scheduleResolve(immediate) {
                const n = this.nativeEl();
                if (!n || this.data.disabled || this.data.readonly) return;
                const q = String(n.value ?? "");
                this.cancelPending();
                const ms = Math.max(0, Number(this.data.debounce) || 0);
                const self = this;
                const run = () => {
                    self.debounceTimer = null;
                    const now = self.nativeEl();
                    if (!now || String(now.value ?? "") !== q) return;
                    self.resolveNow(q);
                };
                if (immediate || ms === 0) run();
                else this.debounceTimer = setTimeout(run, ms);
            },
            cancelPending() {
                if (this.debounceTimer !== null) {
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = null;
                }
                this.fetchSeq++;
            },
            openPanel() {
                if (this.data.disabled || this.data.readonly) return;
                if (this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            closePanel() {
                if (!this.data.open) return;
                this.triggerEl()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            },
            syncActive() {
                const list = this.data.items ?? [];
                const i = this.data.activeIndex;
                this.data.activeValue = i >= 0 && i < list.length ? (list[i].value ?? null) : null;
            },
            moveActive(dir) {
                const list = this.data.items ?? [];
                if (list.length === 0) return;
                let i = this.data.activeIndex;
                for (let step = 0; step < list.length; step++) {
                    i = (i + dir + list.length) % list.length;
                    if (!list[i].disabled) { this.data.activeIndex = i; return; }
                }
            },
            emitInput(n) {
                this.silent = true;
                try {
                    n.dispatchEvent(new Event("input", { bubbles: true }));
                } finally {
                    this.silent = false;
                }
            },
            pick(v) {
                if (this.data.disabled || this.data.readonly) return;
                const list = this.data.items ?? [];
                const item = list.find((o) => String(o.value) === String(v));
                if (!item || item.disabled) return;
                const n = this.nativeEl();
                if (!n) return;
                this.cancelPending();
                n.value = String(item.value);
                this.emitInput(n);
                this.data.hasValue = n.value !== "";
                this.data.activeIndex = -1;
                this.syncActive();
                this.emit("change", { value: item.value });
                this.emit("select", { value: item.value });
                this.closePanel();
                n.focus();
            },
            onClear(event) {
                event.stopPropagation();
                if (this.data.disabled || this.data.readonly) return;
                const n = this.nativeEl();
                if (!n || n.value === "") return;
                this.cancelPending();
                n.value = "";
                this.emitInput(n);
                this.data.hasValue = false;
                this.data.items = [];
                this.data.activeIndex = -1;
                this.syncActive();
                this.closePanel();
                n.focus();
            },
            onInputKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!this.data.open) {
                        if ((this.data.items ?? []).length > 0) this.openPanel();
                        else this.scheduleResolve(true);
                        return;
                    }
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                    if (this.data.open) {
                        event.preventDefault();
                        if (this.data.activeValue != null) this.pick(this.data.activeValue);
                        else this.closePanel();
                    }
                }
            },
        },
        mounted() {
            const native = () => this.el.querySelector(".asc-autocomplete-native");

            const syncLen = () => {
                const n = native();
                this.data.hasValue = !!n && String(n.value ?? "") !== "";
            };

            const prior = this.el.value;
            if (typeof prior === "string" && prior !== "") this.lastValue = prior;
            else if (this.data.value != null) this.lastValue = String(this.data.value);
            const snapshotNorm = String(prior ?? "");
            Object.defineProperty(this.el, "value", {
                get: () => {
                    const n = native();
                    return n ? n.value : this.lastValue;
                },
                set: (v) => {
                    if (!this.initDone && String(v ?? "") === snapshotNorm) return;
                    this.lastValue = String(v ?? "");
                    const n = native();
                    if (n) n.value = this.lastValue;
                    syncLen();
                },
                configurable: true,
            });

            this.el.addEventListener("input", (e) => {
                if (this.silent) return;
                const n = native();
                if (!n || e.target !== n) return;
                this.lastValue = n.value;
                syncLen();
                if (e.isComposing || this.composing) return;
                this.scheduleResolve();
            });
            this.el.addEventListener("compositionstart", (e) => {
                if (e.target === native()) this.composing = true;
            });
            this.el.addEventListener("compositionend", (e) => {
                if (e.target !== native()) return;
                this.composing = false;
                this.scheduleResolve();
            });

            this.el.addEventListener(
                "click",
                () => { this.lastHostClickAt = Date.now(); },
                true,
            );

            this.el.addEventListener("focusin", (e) => {
                if (e.target !== native()) return;
                this.focused = true;
                setTimeout(() => {
                    if (this.data.open) return;
                    if (Date.now() - this.lastHostClickAt < 400) return;
                    if ((this.data.items ?? []).length > 0) {
                        this.openPanel();
                        return;
                    }
                    if (!this.hasFetch()) this.scheduleResolve(true);
                }, 0);
            });
            this.el.addEventListener("focusout", (e) => {
                if (e.target !== native()) return;
                const to = e.relatedTarget;
                if (to instanceof Node && this.el.contains(to)) return;
                this.focused = false;
            });

            setTimeout(() => {
                const n = native();
                if (n) {
                    const nameAttr = this.el.getAttribute("name");
                    if (nameAttr != null) n.name = nameAttr;
                    n.value = this.lastValue;
                }
                syncLen();
                this.data.uid =
                    "asc-ac-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
                this.el.setAttribute("data-asc-autocomplete-uid", this.data.uid);
                this.initDone = true;
                if (!this.hasFetch()) this.scheduleResolve(true);
            }, 0);

            this.watch("value", ({ value }) => {
                const v = String(value ?? "");
                if (v === this.lastValue) return;
                this.lastValue = v;
                const n = native();
                if (n) n.value = v;
                syncLen();
            });
            let lastSuggestions = this.data.suggestions;
            this.watch("suggestions", () => {
                if (this.data.suggestions === lastSuggestions) return;
                lastSuggestions = this.data.suggestions;
                setTimeout(() => {
                    if (!this.hasFetch()) this.resolveNow(String(native()?.value ?? ""));
                }, 0);
            });
            let lastFetch = this.data.fetch;
            this.watch("fetch", () => {
                if (this.data.fetch === lastFetch) return;
                lastFetch = this.data.fetch;
                setTimeout(() => this.resolveNow(String(native()?.value ?? "")), 0);
            });
            this.watch("activeIndex", () => { this.syncActive(); });
            this.watch("open", () => {
                this.el.toggleAttribute("data-open", !!this.data.open);
            });
            this.watch("pickTick", () => { this.pick(this.data.pickValue); });
            this.watch("hoverTick", () => {
                const list = this.data.items ?? [];
                const i = list.findIndex(
                    (o) => String(o.value) === String(this.data.hoverValue),
                );
                if (i >= 0 && !list[i].disabled) this.data.activeIndex = i;
            });
        },
    }
  <\/script>
  <style global id="autospark-components-autocomplete">
    .asc-autocomplete-trigger {
      flex: 1 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      align-self: stretch;
      outline: none;
    }
    .asc-autocomplete-native {
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: inherit;
    }
    .asc-autocomplete-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-autocomplete-placeholder, rgba(0, 0, 0, 0.35)));
    }
    .asc-autocomplete-native:disabled {
      cursor: not-allowed;
      -webkit-text-fill-color: var(--auto-disable-color, var(--asc-autocomplete-disable-color, inherit));
    }
    /* 禁用（骨架通道 [data-disabled]）：触发器 pointer-events 阻断 popover 点击
       toggle（popover 宿主监听不知禁用态，CSS 层拦截，select 同款） */
    .asc-autocomplete[data-disabled] .asc-autocomplete-trigger {
      pointer-events: none;
    }

    .asc-autocomplete-action {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.35em;
      cursor: pointer;
      border-radius: var(--auto-border-radius, var(--asc-autocomplete-action-radius, 0.25rem));
      color: var(--auto-third-color, var(--asc-autocomplete-action, rgba(0, 0, 0, 0.35)));
      transition: color 0.15s ease;
    }
    .asc-autocomplete-action:hover {
      color: var(--auto-color, var(--asc-autocomplete-action-hover, #606060));
    }
    .asc-autocomplete-action:active {
      transform: scale(0.92);
    }
    .asc-autocomplete-loading {
      cursor: default;
    }

    [dark] .asc-autocomplete-native::placeholder,
    [data-dark] .asc-autocomplete-native::placeholder {
      color: var(--auto-input-placeholder, var(--asc-autocomplete-placeholder, rgba(255, 255, 255, 0.4)));
    }
    [dark] .asc-autocomplete-action,
    [data-dark] .asc-autocomplete-action {
      color: var(--auto-third-color, var(--asc-autocomplete-action, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-autocomplete-action:hover,
    [data-dark] .asc-autocomplete-action:hover {
      color: var(--auto-color, var(--asc-autocomplete-action-hover, #fafafa));
    }

    /* ══════════ 建议面板（autospark-autocomplete-panel，渲染进 body 覆盖物容器；
       外壳边框/阴影/定位归 popover-shell；样式与 select 下拉面板同款，ADR-0027 决策 9 ══════════ */
    .asc-autocomplete-panel {
      display: block;
      min-width: 100%;
      font-size: var(--auto-font-size, var(--asc-autocomplete-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-autocomplete-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-autocomplete-panel-color, #333333));
    }
    .asc-autocomplete-list {
      max-height: var(--asc-autocomplete-max-height, 15em);
      overflow-y: auto;
      padding: 0.25em 0;
      box-sizing: border-box;
    }
    /* 建议项：行式热区；悬停/高亮/禁用态经 data-* 属性选择器驱动（绑定通道写属性——
       假值整个移除即无态，绑定语义天然契合） */
    .asc-autocomplete-option {
      display: flex;
      align-items: center;
      gap: 0.4em;
      min-height: 2.2em;
      padding: 0.3em 0.75em;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .asc-autocomplete-option-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .asc-autocomplete-option[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-autocomplete-option-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-autocomplete-option[data-disabled] {
      color: var(--auto-disable-color, var(--asc-autocomplete-option-disabled, rgba(0, 0, 0, 0.28)));
      cursor: not-allowed;
      background: transparent;
    }
    .asc-autocomplete-option[data-disabled]:hover {
      background: transparent;
    }
    .asc-autocomplete-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-autocomplete-empty, rgba(0, 0, 0, 0.35)));
    }
    [dark] .asc-autocomplete-panel,
    [data-dark] .asc-autocomplete-panel {
      color: var(--auto-color, var(--asc-autocomplete-panel-color, #fafafa));
    }
    [dark] .asc-autocomplete-option[data-active],
    [data-dark] .asc-autocomplete-option[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-autocomplete-option-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-autocomplete-option[data-disabled],
    [data-dark] .asc-autocomplete-option[data-disabled] {
      color: var(--auto-disable-color, var(--asc-autocomplete-option-disabled, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-autocomplete-empty,
    [data-dark] .asc-autocomplete-empty {
      color: var(--auto-third-color, var(--asc-autocomplete-empty, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <span
    class="asc-autocomplete-trigger"
    x-popover:autospark-autocomplete-panel
    x-popover-options="{ trigger: 'click', fit: true, padding: 0, closeable: false, at: { placement: 'bottom-start', arrow: false, offset: 4 } }"
  >
    <input
      class="asc-autocomplete-native"
      data-autospark-control
      type="text"
      role="combobox"
      aria-haspopup="listbox"
      aria-autocomplete="list"
      :aria-expanded="open ? 'true' : 'false'"
      :placeholder="placeholder || (t('autocomplete.placeholder') === 'autocomplete.placeholder' ? '请输入' : t('autocomplete.placeholder'))"
      @keydown="onInputKeydown($event)"
    />
  </span>
  <i
    class="asc-autocomplete-action asc-autocomplete-clear"
    data-autospark-action
    x-if="clearable && hasValue"
    x-icon="'no'"
    @click="onClear($event)"
  ></i>
  <i
    class="asc-autocomplete-action asc-autocomplete-loading"
    x-if="loading"
    x-icon="'loading'"
  ></i>
</span>
`,s=`<div class="asc-autocomplete-panel" x-define="autospark-autocomplete-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
            const uid = this.data.uid;
            if (uid) {
                const box = document.querySelector('[data-asc-autocomplete-uid="' + uid + '"]');
                const shellPanel = this.el.closest("[data-overlay]");
                if (box && shellPanel) {
                    shellPanel.style.minWidth = box.getBoundingClientRect().width + "px";
                }
            }
            const scrollActive = () => {
                const el = this.el.querySelector(".asc-autocomplete-option[data-active]");
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
  <div class="asc-autocomplete-list" x-loading="loading">
    <template x-for="option of items" :key="option.value">
      <div
        class="asc-autocomplete-option"
        x-bind:data-active="activeValue != null && String(option.value) === String(activeValue)"
        x-bind:data-disabled="!!option.disabled"
        x-on:click="pickTick = pickTick + 1, pickValue = option.value"
        x-on:mouseenter="hoverTick = hoverTick + 1, hoverValue = option.value"
      >
        <span class="asc-autocomplete-option-label" x-text="option.label"></span>
      </div>
    </template>
    <div
      class="asc-autocomplete-empty"
      x-if="!loading && !(items && items.length > 0)"
      x-text="t('autocomplete.empty') === 'autocomplete.empty' ? '暂无建议' : t('autocomplete.empty')"
    ></div>
  </div>
</div>
`,c=`autospark.autocomplete`,l=`autospark-autocomplete-panel`,u=new Set([`disabled`,`readonly`,`clearable`]);function d(e){e.components[c]=o,e.components[l]=s,e.precompile?.(e=>{for(let i of Array.from(e.el.querySelectorAll(`x-autocomplete`))){let e=document.createElement(`span`),a=[];for(let o of Array.from(i.attributes))o.name.startsWith(`:`)?a.push(`${n(t(o.name.slice(1)))}: (${o.value})`):o.name===`class`||o.name===`style`||o.name===`id`||o.name===`name`||o.name.startsWith(`data-`)||o.name.startsWith(`x-`)||o.name.startsWith(`@`)?e.setAttribute(o.name,o.value):o.value===``&&u.has(o.name)?a.push(`${n(t(o.name))}: true`):a.push(`${n(t(o.name))}: ${JSON.stringify(r(o.value))}`);for(e.setAttribute(`x-component:${c}`,`{ ${a.join(`, `)} }`);i.firstChild;)e.appendChild(i.firstChild);i.replaceWith(e)}})}f();function f(){e(e=>{d(e)})}};
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

//# sourceMappingURL=autospark.autocomplete.js.map
