(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.button`;function a(e){e.components[i]=`<!--\r
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /\r
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的\r
    内层元素上：宿主级外观（底色/边框/圆角等）经 body 上的 data-* 变体属性以 :has()\r
    驱动，body 自身的布局变体（对齐/纵排）直接命中 body 选择器；原生 disabled 语义\r
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。\r
\r
    事件出口（组件默认封闭，事件经冒泡到外层消费）：\r
    - tag-click：tags 小圆钮点击冒泡，detail = { name, label, value, tag }（tag 元素上\r
      stopPropagation 阻断冒泡）。勾选/多态切换类需求由 autospark.state-button 承接\r
    （ADR-0016：button 已取消 checkable 特性，迁移动作见该 ADR 后果节）\r
-->\r
<!-- 元素名快速写法 <x-button variant="primary" label="..."> 由 index.ts 的 precompile\r
     DOM 变换承载（ADR-0117 元名形态对全局表惰性组件有时序缺口，见 index.ts 注释） -->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，\r
     名即通道）——宿主化身根物化为同名 data-* 属性，接通 @autospark/theme 手动通道 CSS\r
     形成局部主题；base 缺省不写属性（继承祖先档位），theme 不在场静默无效。\r
     button 不得在 data() 重复声明这六键（子胜会静默击穿主题通道），裸名 size/dark 等留作\r
     组件自有语义；组件内部变体属性亦禁用这六个通道名（theme 在场时会被档位块意外命中） -->\r
<button\r
  class="asc-button"\r
  x-define="autospark.button"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            variant: "default",     // 形态：default 常规描边 | primary 实底 | secondary 次底 | dashed 虚线 | text 文本 | link 链接\r
            type: "primary",        // 语义色：primary | success | warning | danger | info（default 形态不消费）\r
            label: "按钮",          // 兜底文案（插槽无内容时显示；labelPos none 时隐藏并自动转入悬停提示）\r
            labelPos: "right",       // label 在 icon 的哪侧：right 左图标右文字（默认）| left 右图标左文字（与 tags 互换）| top 文字上 | bottom 文字下 | none 不显示文字（label 转悬停提示）\r
            icon: "",               // 图标名或图标选项对象 { name, size, color, strokeWidth, padding, button, pointer }（对齐 x-icon-options 词面，ADR-0135 后不含 shape）+ 自有角标键 badge（伪元素红点，标量三形态控板距；loading 时被替换）\r
            loading: false,         // 加载态：左图标位转圈并禁点（优先于 disabled 视觉）\r
            ghost: false,           // 幽灵：背景透明、内容取语义色（常用在有色背景上）\r
            border: false,          // 装饰性附加边框（不干预 dashed / ghost 的固有边框形态）\r
            block: false,           // 适配父宽度\r
            disabled: false,\r
            ripple: true,           // 点击涟漪（默认开启；页面需已加载 autospark.ripple.js，未加载时静默跳过；ADR-0010）\r
            autoInsertSpace: true,  // label 恰为两个汉字时自动插入空格\r
            shape: "default",       // default | circle（纯图标呈正圆，带文字自动呈胶囊）\r
            wrap: false,            // label 换行：false 单行溢出省略号（截断时自动挂 title，宿主显式 title 优先）；true 折行（按钮高度随行数增长）\r
            align: "center",        // 内容水平对齐：left | center | right\r
            indent: 0,              // 内容额外左缩进（数字 px 或任意 CSS 值如 "2em"）；菜单层级缩进常用\r
            memo: "",               // label 下方的备注（小一号、淡色）\r
            tags: [],               // 右侧小圆钮 {icon?, label?, tooltip?, styles?(cssText), classes?, value?, checkable?, checkValues?, shape?}[]——label 呈胶囊（图标与文字恒 1rem）；value 原样透传进 tag-click detail（checkable 时兼勾选载体：=== 真值即 checked，点击翻转）；checkValues 缺省 [true,false] 真值在前；shape 默认 none 无背景，circle/radius 呈底板\r
            menu: false,            // 菜单项形态：占满宽、透明底、左对齐、hover 淡底\r
            // computed 简写（普通函数值即计算属性，仅限单表达式）：autoInsertSpace 开启且\r
            // label 恰为两个汉字时中间插入空格\r
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label\r
        }),\r
        methods: {\r
            // tag 勾选值域：checkValues 逐项回退 [true, false]（真值在前）；\r
            // ?? 只对 null/undefined 回退——checkValues: [0, 1] 的假值真值 0 不受影响，\r
            // 残缺（如仅 [x]）时缺的项单独回退。模板 :data-checked 为内联表达式同款判定：\r
            // 属性绑定求值域不含组件 methods（宽松求值 undefined → 静默移除），方法仅供事件通道\r
            tagCheckValues(tag) {\r
                return [tag.checkValues?.[0] ?? true, tag.checkValues?.[1] ?? false];\r
            },\r
            // tag 小圆钮点击：阻断冒泡，冒泡 tag-click——detail 平铺\r
            // name（标识）/ label（文字）/ value（使用者数据，原样透传不做处理）+ tag 整对象。\r
            // checkable：点击翻转 value（真值 ↔ 假值）——tag 为 tags 数组项的响应式代理，\r
            // 赋值穿透到外部状态（tags 为引用注入），data-checked 绑定随之重算；tag-click\r
            // 的 detail.value 即切换后新值\r
            onTagClick(tag, event) {\r
                event.stopPropagation();\r
                if (tag.checkable) {\r
                    const vals = this.tagCheckValues(tag);\r
                    tag.value = tag.value === vals[0] ? vals[1] : vals[0];\r
                }\r
                this.el.dispatchEvent(new CustomEvent("tag-click", { bubbles: true, detail: { name: tag.name, label: tag.label, value: tag.value, tag } }));\r
            }\r
        },\r
        mounted() {\r
            // 原生 disabled 同步（loading 即禁点）；后续 props 变化经 watch 保持同步\r
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法见 overlay/foldable.ts）\r
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };\r
            syncDisabled();\r
            this.watch("disabled", ({ value }) => { syncDisabled(); });\r
            this.watch("loading", ({ value }) => { syncDisabled(); });\r
\r
            // icon 对象形态的视觉透传（与 x-icon 原生内联实现等价）：size/color/padding 直写内联样式、\r
            // strokeWidth 经 --as-icon-sw 变量、badge 走角标类（CSS 伪元素红点 + 板 padding）；\r
            // watch 回调一跳后写（x-if 渲染与回调的 flush 时序不保证先后）\r
            const syncIconStyle = () => {\r
                const i = this.data.icon;\r
                const span = this.el.querySelector(".asc-button-icon");\r
                if (!span) return;\r
                for (const k of ["width", "height", "color", "padding"]) span.style.removeProperty(k);\r
                span.style.removeProperty("--as-icon-sw");\r
                span.classList.remove("asc-button-icon-badge");\r
                if (typeof i !== "object" || !i) return;\r
                if (i.size != null) {\r
                    const px = typeof i.size === "number" ? i.size + "px" : i.size;\r
                    span.style.width = px;\r
                    span.style.height = px;\r
                }\r
                if (typeof i.color === "string" && i.color.trim() !== "") span.style.color = i.color;\r
                if (i.strokeWidth != null) span.style.setProperty("--as-icon-sw", String(i.strokeWidth));\r
                if (i.padding != null) span.style.padding = typeof i.padding === "number" ? i.padding + "px" : i.padding;\r
                // badge（x-icon 同款标量三形态）：true（缺省板距）/ number 板距 px / string CSS 值——形态即启用\r
                if (i.badge === true) { span.classList.add("asc-button-icon-badge"); span.style.padding = "2px"; }\r
                else if (typeof i.badge === "number") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge + "px"; }\r
                else if (typeof i.badge === "string" && i.badge.trim() !== "") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge; }\r
            };\r
            setTimeout(syncIconStyle, 0); // mounted 时化身子树可能尚未挂载（span 不可查），一跳后再同步\r
            this.watch("icon", () => { setTimeout(syncIconStyle, 0); });\r
\r
            // label 溢出自动挂提示（ADR-0012 补记，双轨修订）：纯静态检测——mounted 一跳首查 +\r
            // label / wrap 变化时重查，不引入 ResizeObserver（按钮为高频组件，零观察资源；容器宽度\r
            // 单独变化后提示可能过期为已知温和妥协，CSS 截断本身自适应不受影响）。\r
            // 挂载属性双轨（与 x-bind title 重定向同判定口径）：tooltip 特性在场（engine.tooltip?.enabled，\r
            // autospark.tooltip.js 已加载）→ 挂 data-tooltip（插件接管、样式统一）；缺席 → 挂原生 title\r
            // （浏览器黄框兜底）。挂/摘规则：仅截断态挂（scrollWidth > clientWidth）、宿主显式\r
            // title/data-tooltip 永不覆盖、溢出消失只摘自挂的（闭包标记）\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
            const syncTip = () => {\r
                // labelPos none：label 不渲染（main 整体隐藏）——宿主无显式提示时 label 文本转挂（双轨同 attr）\r
                if (this.data.labelPos === "none") {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖\r
                    this.el.setAttribute(tipAttr, String(this.data.label ?? ""));\r
                    selfTip = true;\r
                    return;\r
                }\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (!span) return;\r
                if (span.scrollWidth > span.clientWidth) {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖\r
                    this.el.setAttribute(tipAttr, span.textContent); // label 变文本后仍溢出 → 同步换新文本\r
                    selfTip = true;\r
                } else if (selfTip) {\r
                    this.el.removeAttribute(tipAttr);\r
                    selfTip = false;\r
                }\r
            };\r
            setTimeout(syncTip, 0);\r
            this.watch("label", () => { setTimeout(syncTip, 0); });\r
            this.watch("wrap", () => { setTimeout(syncTip, 0); });\r
            this.watch("labelPos", () => { setTimeout(syncTip, 0); });\r
\r
            // checkable 桥已随 ADR-0016 整体移除（button 取消 checkable 特性——机制由\r
            // autospark.state-button 继承骨架后自持，迁移动作见 ADR-0016 后果节）\r
\r
            // 涟漪动态挂载（ADR-0010 运行时契约：不经编译、直接写属性即生效）；\r
            // 配置走 x-ripple-options 通道（裸 x-ripple 的值只参与三态判定、不承载配置）；\r
            // ripple 即该配置的 props 值：false 不启用；启用时缺省 { trigger: "click", inside: true }\r
            // （点击播一个周期自止、约束按钮内部），对象形态全键可覆盖缺省；\r
            // options 运行时改值无效（ADR-0010 决策 7）——变化时先摘 x-ripple 触发重挂再重读；\r
            // 需页面已加载 autospark.ripple.js，未加载时属性无人消费、静默无害\r
            const syncRipple = () => {\r
                const conf = this.data.ripple;\r
                this.el.removeAttribute("x-ripple");\r
                this.el.removeAttribute("x-ripple-options");\r
                if (conf) {\r
                    this.el.setAttribute("x-ripple-options", JSON.stringify(typeof conf === "object" ? { trigger: "click", inside: true, ...conf } : { trigger: "click", inside: true }));\r
                    this.el.setAttribute("x-ripple", "");\r
                }\r
            };\r
            syncRipple();\r
            this.watch("ripple", () => { syncRipple(); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-button">\r
    .asc-button {\r
      --asc-tone: var(\r
        --auto-primary-color,\r
        var(--asc-button-primary, #009aff)\r
      ); /* 语义色中转（data-type 注入） */\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      --asc-line: transparent;\r
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */\r
      --asc-pad: var(--auto-padding, var(--asc-button-padding, 0.8rem));\r
      display: inline-flex;\r
      border: var(--auto-border-size, var(--asc-button-border-size, 1px)) solid\r
        var(--asc-line);\r
      border-radius: var(\r
        --auto-border-radius,\r
        var(--asc-button-radius, 0.5rem)\r
      );\r
      background: var(--asc-bg);\r
      color: var(--asc-ink);\r
      font: inherit;\r
      font-size: var(--auto-font-size, var(--asc-button-font-size, 0.875rem));\r
      line-height: 1.4;\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.8);\r
      cursor: pointer;\r
      user-select: none;\r
      transition:\r
        filter 0.15s ease,\r
        background-color 0.15s ease;\r
    }\r
    .asc-button:has(> .asc-button-body[data-border="true"]) {\r
      --asc-line: var(\r
        --auto-border-color,\r
        var(--asc-button-border-color, #d9d9d9)\r
      );\r
    }\r
\r
    .asc-button:has(> .asc-button-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #009aff));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #22c55e));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f59e0b));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #ef4444));\r
    }\r
    .asc-button:has(> .asc-button-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #71717a));\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="default"]) {\r
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #ffffff));\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
    }\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="success"]\r
    ),\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="warning"]\r
    ),\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="danger"]\r
    ),\r
    .asc-button:has(\r
      > .asc-button-body[data-variant="default"][data-type="info"]\r
    ) {\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="primary"]) {\r
      --asc-bg: var(--asc-tone);\r
      --asc-ink: #fff;\r
    }\r
    /* secondary：次级底 + 正文色（描边交给 border 开关） */\r
    .asc-button:has(> .asc-button-body[data-variant="secondary"]) {\r
      --asc-bg: var(\r
        --auto-secondary-bgcolor,\r
        var(--asc-button-bg, rgba(245, 245, 245, 0.45))\r
      );\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
    }\r
    /* dashed：透明底 + 语义色虚线边 + 语义色字 */\r
    .asc-button:has(> .asc-button-body[data-variant="dashed"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
      border-style: dashed;\r
    }\r
    /* text：透明底 + 正文色 */\r
    .asc-button:has(> .asc-button-body[data-variant="text"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);\r
    }\r
    /* link：透明底 + 语义色字、无内距（inline 链接感） */\r
    .asc-button:has(> .asc-button-body[data-variant="link"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      padding: 0;\r
    }\r
\r
    /* ---------- 幽灵（ghost）：透明底 + 语义色内容/描边，可与任意形态组合 ---------- */\r
    .asc-button:has(> .asc-button-body[data-ghost="true"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
    }\r
\r
    /* ---------- 菜单项形态（menu）：占满宽、透明底、左对齐、hover 淡底 ---------- */\r
    .asc-button:has(> .asc-button-body[data-menu="true"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      display: flex;\r
      width: 100%;\r
      border-radius: var(\r
        --auto-border-radius,\r
        var(--asc-button-radius, 0.375rem)\r
      );\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);\r
      text-align: left;\r
    }\r
\r
    /* ---------- 勾选渲染（checkStyle 四形态）已随 ADR-0016 整体移除 ----------\r
       装饰渲染（solid/icon/corner/ripple）由 autospark.state-button 的 styles 自持\r
       （decorate 项键语义，宿主 class 通道），本组件不再携带任何勾选视觉 */\r
\r
    /* ---------- 形状（shape）：circle 恒胶囊半径——纯图标时内容等宽高自然呈正圆，带文字自动胶囊 ---------- */\r
    .asc-button:has(> .asc-button-body[data-shape="circle"]) {\r
      border-radius: 9999px;\r
      padding: calc(var(--asc-pad) * 0.55);\r
    }\r
\r
    /* ---------- 适配父宽度 ---------- */\r
    .asc-button:has(> .asc-button-body[data-block="true"]) {\r
      display: flex;\r
      width: 100%;\r
    }\r
\r
    /* ---------- 交互态 ---------- */\r
    .asc-button:hover:not([disabled]) {\r
      filter: brightness(0.96);\r
    }\r
    .asc-button:active:not([disabled]) {\r
      filter: brightness(0.9);\r
    }\r
    /* text / link / ghost / menu 淡形态：亮度反馈无感，改用悬停淡底 */\r
    .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(\r
        [disabled]\r
      ),\r
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ),\r
    .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(\r
        [disabled]\r
      ),\r
    .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(\r
        [disabled]\r
      ) {\r
      filter: none;\r
      background: var(\r
        --auto-hover-bgcolor,\r
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))\r
      );\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ) {\r
      text-decoration: underline;\r
    }\r
    .asc-button[disabled] {\r
      opacity: 0.55;\r
      cursor: not-allowed;\r
      filter: none;\r
    }\r
    /* loading 即禁点但视觉不淡化（优先于 disabled，Q9） */\r
    .asc-button:has(> .asc-button-body[data-loading="true"]) {\r
      opacity: 1;\r
      cursor: progress;\r
    }\r
\r
    /* ---------- body 布局（body 是编译子树内层，绑定可求值，直接命中选择器） ---------- */\r
    .asc-button-body {\r
      display: flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.4em;\r
      width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-button-body[data-align="left"] {\r
      justify-content: flex-start;\r
    }\r
    .asc-button-body[data-align="right"] {\r
      justify-content: flex-end;\r
    }\r
    .asc-button-body[data-menu="true"] {\r
      justify-content: flex-start;\r
    } /* 菜单项恒左对齐 */\r
    .asc-button-body[data-menu="true"] .asc-button-main {\r
      align-items: flex-start;\r
    } /* label/memo 文本亦居左（与 memo 折行/短 label 对齐左缘） */\r
    .asc-button-body[data-label-pos="top"],\r
    .asc-button-body[data-label-pos="bottom"] {\r
      flex-direction: column;\r
      gap: 0.15em;\r
    } /* label 纵排（top = 文字上/图标下；bottom = 图标上/文字下） */\r
    /* labelPos top：文字在图标上方（main 排 icon 前） */\r
    .asc-button-body[data-label-pos="top"] .asc-button-icon {\r
      order: 2;\r
    }\r
\r
    /* 图标位：尺寸随字号（x-icon 默认 1em），loading 转圈自带 SMIL 动画 */\r
    .asc-button-icon {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
    }\r
    /* labelPos left：图标（含 loading 位）移内容区末尾并与 tags 互换（icon 恒最末）；\r
         横排 = 右侧、纵排 = 下方 */\r
    .asc-button-body[data-label-pos="left"] .asc-button-icon {\r
      order: 5;\r
    }\r
    /* 图标角标（icon.badge 标量三形态启用）：板 padding 承载留白，伪元素红点取 danger 语义色 */\r
    .asc-button-icon-badge {\r
      position: relative;\r
    }\r
    .asc-button-icon-badge::after {\r
      content: "";\r
      position: absolute;\r
      top: 0;\r
      right: 0;\r
      width: 0.4em;\r
      height: 0.4em;\r
      border-radius: 50%;\r
      background: var(--auto-danger-color, var(--asc-button-danger, #ef4444));\r
    }\r
\r
    /* 主文本组：label 与 memo 恒纵排（memo 在 label 下方） */\r
    .asc-button-main {\r
      display: flex;\r
      flex-direction: column;\r
      align-items: center;\r
      min-width: 0;\r
    }\r
    /* label 单行截断（wrap 默认 false，ADR-0012 补记）：溢出显示省略号——截断只在按钮\r
         宽度受约束时发生（block / menu / 容器挤压；inline-flex 收缩到内容宽永不触发）；\r
         max-width 钳制是关键——nowrap 下 min-content 涨至全文宽，column flex 的\r
         align-items 非 stretch 使 label 取 fit-content，无钳制会被 min-content 抬出\r
         可用宽（截断失效）；截断发生时由 mounted 静态检测自动挂 title；wrap=true 回\r
         折行（按钮高度随行数增长，显式声明才换行，防布局被意外撑开） */\r
    .asc-button-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
    }\r
    .asc-button-body[data-wrap="true"] .asc-button-label {\r
      white-space: normal;\r
    }\r
    /* 空内容不占位：纯图标用法（label 空）时出口与主文本组整体隐藏，消除 gap/行高占位；\r
         插槽有内容时出口非空不命中，不受影响 */\r
    .asc-button-label:empty {\r
      display: none;\r
    }\r
    .asc-button-main:has(> .asc-button-label:empty):not(\r
        :has(> .asc-button-memo)\r
      ) {\r
      display: none;\r
    }\r
    .asc-button-body[data-align="left"] .asc-button-main {\r
      align-items: flex-start;\r
    }\r
    .asc-button-body[data-align="right"] .asc-button-main {\r
      align-items: flex-end;\r
    }\r
\r
    /* 备注：小一号 + 相对内容色的淡化（color-mix 跟随 --asc-ink，实底上自然呈淡白）；\r
         最多两行，超出截断显示省略号（line-clamp） */\r
    .asc-button-memo {\r
      font-size: 0.75em;\r
      line-height: 1.2;\r
      color: color-mix(in srgb, var(--asc-ink, currentColor) 70%, transparent);\r
      display: -webkit-box;\r
      -webkit-box-orient: vertical;\r
      -webkit-line-clamp: 2;\r
      line-clamp: 2;\r
      overflow: hidden;\r
    }\r
    /* memo 在场时图标默认 2 倍大（与 label+memo 双行文本块视觉配平）；\r
         图标与文本块的垂直居中由 body 的 align-items: center 承担 */\r
    .asc-button:has(.asc-button-memo) .asc-button-icon {\r
      font-size: 2em;\r
    }\r
\r
    /* tags 小圆钮：右侧小一号圆形，独立 hover 反馈 */\r
    .asc-button-tags {\r
      display: inline-flex;\r
      gap: 0.15em;\r
      margin-left: 0.35em;\r
    }\r
    /* x-for 克隆载体盒消失，圆钮直接成为容器 flex 项 */\r
    .asc-button-tag-item {\r
      display: contents;\r
    }\r
    .asc-button-tag {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.25em;\r
      height: 1.8rem;\r
      width: 1.8rem; /* 无 label 恒正圆（等宽高）；带 label 被胶囊规则放开 */\r
      padding: 0;\r
      font-size: 1rem; /* 图标与 label 恒 1rem——不随 data-size 档位（视觉稳定优先） */\r
      border-radius: 50%;\r
      color: var(--asc-ink);\r
      cursor: pointer;\r
      /* 常态即与按钮主背景形成色差：按内容色派生淡底（实底上呈淡白、透明底上呈淡灰/淡语义色） */\r
      background: transparent; /* 常态无背景（shape 默认 none）；shape 板色见后续规则 */\r
      transition: background-color 0.15s ease, transform 0.1s ease;\r
    }\r
    .asc-button-tag:hover {\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-ink, currentColor) 28%,\r
        transparent\r
      );\r
    }\r
    /* shape 底板（默认 none 无背景）：circle 圆形底板 / radius 主题圆角底板——板色按内容色\r
         派生淡底（与按钮主背景形成层次）；胶囊 tag 的 9999px 规则后位覆盖 radius 呈胶囊板 */\r
    .asc-button-tag[data-shape="circle"],\r
    .asc-button-tag[data-shape="radius"] {\r
      background: color-mix(in srgb, var(--asc-ink, currentColor) 12%, transparent);\r
    }\r
    .asc-button-tag[data-shape="radius"] {\r
      border-radius: var(--auto-border-radius, 0.25rem);\r
    }\r
    /* 带 label 的 tag 呈胶囊：放开定宽随内容、横向 padding 撑开；label 恒 1rem 继承 */\r
    .asc-button-tag:has(> .asc-button-tag-label) {\r
      width: auto;\r
      padding: 0 0.6rem;\r
      border-radius: 9999px;\r
    }\r
    .asc-button-tag-label {\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
    /* 按压反馈：底色加深 + 轻微缩放（松手经 transition 弹回） */\r
    .asc-button-tag:active {\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-ink, currentColor) 45%,\r
        transparent\r
      );\r
      transform: scale(0.88);\r
    }\r
    /* checkable 勾选态（data-checked 属性绑定通道）：语义色（--asc-tone 随宿主 type）淡底 +\r
         内容色转语义色——与常态 hover（ink 淡灰）形成「点亮」区分；同特异性后位覆盖 shape\r
         底板色，hover 加深一档 */\r
    .asc-button-tag[data-checked] {\r
      color: var(--asc-tone, #009aff);\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-tone, #009aff) 22%,\r
        transparent\r
      );\r
    }\r
    .asc-button-tag[data-checked]:hover {\r
      background: color-mix(\r
        in srgb,\r
        var(--asc-tone, #009aff) 34%,\r
        transparent\r
      );\r
    }\r
    /* tag 图标钉死 1rem：不消费 --auto-icon-size（theme 档位 1.2× 会放大）也不随 data-size——\r
         tag 为紧凑小圆钮图标恒小；.as-icon 双类选择器（0,2,0）压过引擎 .as-icon 基础规则\r
         （同特异性但 icon 样式表惰性后注入），svg 撑满宿主规则一并覆盖 */\r
    .asc-button-tag-icon.as-icon,\r
    .asc-button-tag-icon.as-icon > svg {\r
      width: 1rem;\r
      height: 1rem;\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-button,\r
    [data-dark] .asc-button {\r
      /* 只兜字色——bg 不在此兜底：各 variant 的专属 dark 块已承接（default/secondary 有暗色底、\r
         primary 恒 tone）；通配 bg 会以同特异性后位覆盖 primary 形态的 --asc-bg: var(--asc-tone)，\r
         dark 下 secondary-bgcolor 派生为主题系色 → 所有语义色实底钮同色（本次修复的回归根因） */\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-variant="primary"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="primary"]) {\r
      /* bg 走 tone 中转（与 light 一致）——直引 --auto-primary-color 会无视 data-type 的语义色，\r
         dark 下所有语义色实底钮同变主色（本次修复的回归根因之二）；dark 兜底值经 tone 第二级 */\r
      --asc-bg: var(--asc-tone);\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]) {\r
      --asc-bg: var(\r
        --auto-secondary-bgcolor,\r
        var(--asc-button-bg, rgba(129, 129, 129, 0.45))\r
      );\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-variant="default"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="default"]) {\r
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #3a3a3a));\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="primary"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="primary"]) {\r
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #56baff));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="success"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="success"]) {\r
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #5cd07c));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="warning"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="warning"]) {\r
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f0a03c));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="danger"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="danger"]) {\r
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #e6696a));\r
    }\r
    [dark] .asc-button:has(> .asc-button-body[data-type="info"]),\r
    [data-dark] .asc-button:has(> .asc-button-body[data-type="info"]) {\r
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #a1a1aa));\r
    }\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(\r
        [disabled]\r
      ),\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ),\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(\r
        [disabled]\r
      ),\r
    [dark]\r
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(\r
        [disabled]\r
      ),\r
    [data-dark]\r
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(\r
        [disabled]\r
      ) {\r
      background: var(\r
        --auto-hover-bgcolor,\r
        var(--asc-button-hover-bg, rgba(255, 255, 255, 0.08))\r
      );\r
    }\r
  </style>\r
  <!-- 变体数据属性全部承载在 body（编译子树内层元素，经 :has() 驱动宿主外观——见文件头注释）；\r
         indent（原始值）经 :style 加性内联（body 无 padding，不影响宿主内距） -->\r
  <span\r
    class="asc-button-body"\r
    :data-variant="variant"\r
    :data-type="type"\r
    :data-ghost="ghost"\r
    :data-border="border"\r
    :data-shape="shape"\r
    :data-wrap="wrap"\r
    :data-align="align"\r
    :data-menu="menu"\r
    :data-block="block"\r
    :data-loading="loading"\r
    :data-label-pos="labelPos"\r
    :style="indent ? { paddingLeft: (typeof indent === 'number' ? indent + 'px' : indent) } : undefined"\r
  >\r
    <!-- loading 图标替换左图标位（字面量须带引号——裸 loading 会命中 data.loading 布尔值） -->\r
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>\r
    <!-- icon 双形态：字符串 = 图标名；对象 = { name, size, color, strokeWidth, padding }——name 经 x-icon 值消费，\r
         视觉键由 mounted 的 syncIconStyle 以内联样式透传（与 x-icon 原生内联实现等价；\r
         绑定表达式通道对 props 晚注入不重算，故走 JS 同步通道） -->\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></span>\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'object' && icon"\r
      x-icon="icon.name"\r
    ></span>\r
    <span class="asc-button-main" x-show="labelPos !== 'none'">\r
      <!-- 默认插槽出口：未提供内容时显示 {{ displayLabel }}（组件自身状态求值） -->\r
      <span class="asc-button-label" x-slot>{{ displayLabel }}</span>\r
      <span class="asc-button-memo" x-if="memo">{{ memo }}</span>\r
    </span>\r
    <span class="asc-button-tags" x-if="tags && tags.length">\r
      <!-- x-for 宿主自身的绑定不被编译（ownsChildren 接管子树编译），故宿主为纯克隆载体，\r
             tag 圆钮与绑定（title/点击）在内层元素上，x-for locals（tag）在内层可见。\r
             data-checked 为内联表达式（非方法调用）——属性绑定求值域不含组件 methods，\r
             方法形态会宽松求值 undefined 而静默移除；checkValues 逐项 ?? 回退（假值真值如 0 不受影响） -->\r
      <span\r
        class="asc-button-tag-item"\r
        x-for="tag of tags"\r
        :key="tag.name || tag.icon"\r
      >\r
        <i\r
          class="asc-button-tag"\r
          :class="tag.classes"\r
          :title="tag.tooltip"\r
          :style="tag.styles"\r
          :data-shape="tag.shape"\r
          :data-checked="!tag.checkable ? null : (tag.value === (tag.checkValues?.[0] ?? true) ? '' : null)"\r
          @click="onTagClick(tag, $event)"\r
        >\r
          <i class="asc-button-tag-icon" x-if="tag.icon" x-icon="tag.icon"></i>\r
          <span class="asc-button-tag-label" x-if="tag.label">{{ tag.label }}</span>\r
        </i>\r
      </span>\r
    </span>\r
  </span>\r
</button>\r
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-button`))){let e=document.createElement(`button`),o=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?o.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name===`name`||i.name===`title`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):o.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${o.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.button.js.map
