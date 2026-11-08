(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}var t=`autospark.button`;function n(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}function r(e){e.components[t]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性是静态并入宿主（class 拼接 /
    style 合并 / 其他属性复制），根上的动态绑定不会求值——变体绑定须落在编译子树的
    内层元素上：宿主级外观（底色/边框/圆角等）经 body 上的 data-* 变体属性以 :has()
    驱动，body 自身的布局变体（对齐/纵排）直接命中 body 选择器；原生 disabled 语义
    在 mounted 钩子同步到宿主（this.el 即化身后的组件根）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - change：checkable 模式点击翻转后冒泡，detail = { value: 新值 }——
      表单同步惯用法：外层包裹元素 @change="flag = $event.detail.value"
    - tag-click：tags 小圆钮点击冒泡，detail = { name, tag }（tag 元素上
      stopPropagation，不触发宿主 checkable 翻转）
-->
<!-- 元素名快速写法 <x-button variant="primary" label="..."> 由 index.ts 的 precompile
     DOM 变换承载（ADR-0117 元名形态对全局表惰性组件有时序缺口，见 index.ts 注释） -->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：自动获得主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）——宿主化身根物化为同名 data-* 属性，接通 @autospark/theme 手动通道 CSS
     形成局部主题；base 缺省不写属性（继承祖先档位），theme 不在场静默无效。
     button 不得在 data() 重复声明这六键（子胜会静默击穿主题通道），裸名 size/dark 等留作
     组件自有语义；组件内部变体属性亦禁用这六个通道名（theme 在场时会被档位块意外命中） -->
<button
  class="asc-button"
  x-define="autospark.button"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            variant: "default",     // 形态：default 常规描边 | primary 实底 | secondary 次底 | dashed 虚线 | text 文本 | link 链接
            type: "primary",        // 语义色：primary | success | warning | danger | info（default 形态不消费，勾选态仍生效）
            label: "按钮",          // 兜底文案（插槽无内容时显示）
            iconPlacement: "start", // 图标位置：start 内容区前（横排左/纵排上）| end 内容区末（横排右/纵排下，并与 tags 互换）
            icon: "",               // 图标名或图标选项对象 { name, size, color, strokeWidth, padding, button, pointer }（对齐 x-icon-options 词面，ADR-0135 后不含 shape）+ 自有角标键 badge（伪元素红点，标量三形态控板距；loading 时被替换）
            loading: false,         // 加载态：左图标位转圈并禁点（优先于 disabled 视觉）
            ghost: false,           // 幽灵：背景透明、内容取语义色（常用在有色背景上）
            border: false,          // 装饰性附加边框（不干预 dashed / ghost 的固有边框形态）
            block: false,           // 适配父宽度
            disabled: false,
            ripple: true,           // 点击涟漪（默认开启；页面需已加载 autospark.ripple.js，未加载时静默跳过；ADR-0010）
            autoInsertSpace: true,  // label 恰为两个汉字时自动插入空格
            shape: "default",       // default | circle（纯图标呈正圆，带文字自动呈胶囊）
            labelBelow: false,      // label 显示在图标下方（纵排）
            wrap: false,            // label 换行：false 单行溢出省略号（截断时自动挂 title，宿主显式 title 优先）；true 折行（按钮高度随行数增长）
            value: false,           // 勾选值（checkable 模式；等于 checkValues[0] 时为选中态）
            checkable: false,       // 可勾选模式：点击自动翻转 value 并冒泡 change 事件；化身 checkbox（x-model 可绑宿主，见 mounted 桥）
            checkValues: [true, false], // 勾选二元组 [checked 值, unchecked 值]（任意类型，严格相等判定）
            checkStyle: "solid",    // 选中渲染：solid 实底 | icon 左侧 yes 图标占位 | corner outline+右上角打勾小三角
            align: "center",        // 内容水平对齐：left | center | right
            indent: 0,              // 内容额外左缩进（数字 px 或任意 CSS 值如 "2em"）；菜单层级缩进常用
            memo: "",               // label 下方的备注（小一号、淡色）
            tags: [],               // 右侧小圆钮 {icon?,tooltip?,name?}[]；点击冒泡 tag-click 事件
            menu: false,            // 菜单项形态：占满宽、透明底、左对齐、hover 淡底
            // computed 简写（普通函数值即计算属性，仅限单表达式）：autoInsertSpace 开启且
            // label 恰为两个汉字时中间插入空格
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label
        }),
        methods: {
            // tag 小圆钮点击：阻断冒泡（不触发宿主 checkable 翻转），冒泡 tag-click 携带 name
            onTagClick(tag, event) {
                event.stopPropagation();
                this.el.dispatchEvent(new CustomEvent("tag-click", { bubbles: true, detail: { name: tag.name, tag } }));
            }
        },
        mounted() {
            // 原生 disabled 同步（loading 即禁点）；后续 props 变化经 watch 保持同步
            // （回调收 { value } 信封对象须解构——裸值写法恒真，家族惯用法见 overlay/foldable.ts）
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };
            syncDisabled();
            this.watch("disabled", ({ value }) => { syncDisabled(); });
            this.watch("loading", ({ value }) => { syncDisabled(); });

            // icon 对象形态的视觉透传（与 x-icon 原生内联实现等价）：size/color/padding 直写内联样式、
            // strokeWidth 经 --as-icon-sw 变量、badge 走角标类（CSS 伪元素红点 + 板 padding）；
            // watch 回调一跳后写（x-if 渲染与回调的 flush 时序不保证先后）
            const syncIconStyle = () => {
                const i = this.data.icon;
                const span = this.el.querySelector(".asc-button-icon");
                if (!span) return;
                for (const k of ["width", "height", "color", "padding"]) span.style.removeProperty(k);
                span.style.removeProperty("--as-icon-sw");
                span.classList.remove("asc-button-icon-badge");
                if (typeof i !== "object" || !i) return;
                if (i.size != null) {
                    const px = typeof i.size === "number" ? i.size + "px" : i.size;
                    span.style.width = px;
                    span.style.height = px;
                }
                if (typeof i.color === "string" && i.color.trim() !== "") span.style.color = i.color;
                if (i.strokeWidth != null) span.style.setProperty("--as-icon-sw", String(i.strokeWidth));
                if (i.padding != null) span.style.padding = typeof i.padding === "number" ? i.padding + "px" : i.padding;
                // badge（x-icon 同款标量三形态）：true（缺省板距）/ number 板距 px / string CSS 值——形态即启用
                if (i.badge === true) { span.classList.add("asc-button-icon-badge"); span.style.padding = "2px"; }
                else if (typeof i.badge === "number") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge + "px"; }
                else if (typeof i.badge === "string" && i.badge.trim() !== "") { span.classList.add("asc-button-icon-badge"); span.style.padding = i.badge; }
            };
            setTimeout(syncIconStyle, 0); // mounted 时化身子树可能尚未挂载（span 不可查），一跳后再同步
            this.watch("icon", () => { setTimeout(syncIconStyle, 0); });

            // label 溢出自动挂提示（ADR-0012 补记，双轨修订）：纯静态检测——mounted 一跳首查 +
            // label / wrap 变化时重查，不引入 ResizeObserver（按钮为高频组件，零观察资源；容器宽度
            // 单独变化后提示可能过期为已知温和妥协，CSS 截断本身自适应不受影响）。
            // 挂载属性双轨（与 x-bind title 重定向同判定口径）：tooltip 特性在场（engine.tooltip?.enabled，
            // autospark.tooltip.js 已加载）→ 挂 data-tooltip（插件接管、样式统一）；缺席 → 挂原生 title
            // （浏览器黄框兜底）。挂/摘规则：仅截断态挂（scrollWidth > clientWidth）、宿主显式
            // title/data-tooltip 永不覆盖、溢出消失只摘自挂的（闭包标记）
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";
            let selfTip = false;
            const syncTip = () => {
                const span = this.el.querySelector(".asc-button-label");
                if (!span) return;
                if (span.scrollWidth > span.clientWidth) {
                    if (this.el.getAttribute(tipAttr) && !selfTip) return; // 显式提示在场，永不覆盖
                    this.el.setAttribute(tipAttr, span.textContent); // label 变文本后仍溢出 → 同步换新文本
                    selfTip = true;
                } else if (selfTip) {
                    this.el.removeAttribute(tipAttr);
                    selfTip = false;
                }
            };
            setTimeout(syncTip, 0);
            this.watch("label", () => { setTimeout(syncTip, 0); });
            this.watch("wrap", () => { setTimeout(syncTip, 0); });

            // checkable 桥（化身 checkbox）：宿主上 x-model 走 text 分型（读写 el.value + 监听 input）。
            // x-model 域恒布尔语域——el.value 只取 "true"/"false"（对齐原生 checkbox 的 checked 布尔语义，
            // 配 x-model.boolean 类型保真）；checkValues 任意值服务于 props value 通道与表单提交值
            // （内嵌真 input[type=checkbox]：display:none 载体、name 透传宿主、提交值 = String(checkValues[0])、
            // 未勾选不提交）。点击翻转写布尔语域后派发 input 回写 state。
            // 布尔语域使默认组与注入组的字符串解释一致——props 晚注入的时序天然免疫。
            if (this.data.checkable) {
                this.el.classList.add("asc-check-" + this.data.checkStyle);
                const proto = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, "value");
                const real = document.createElement("input");
                real.type = "checkbox";
                real.style.display = "none";
                const vals = () => this.data.checkValues;
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) real.name = nameAttr;
                this.el.appendChild(real);
                // 勾选态同步 JS class（.asc-checked / .asc-check-<style>）：宿主级勾选规则一律 class 驱动——
                // Chromium :active 粘滞期间 :has(属性变化) 不重算（点击描边延迟到下次交互才现的根因），
                // class 变化是强失效信号，绕开该失效雷；checkStyle 静态一次性挂
                const applyChecked = (on) => { const [onV, offV] = vals(); this.data.value = on ? onV : offV; real.checked = !!on; this.el.classList.toggle("asc-checked", !!on); };
                Object.defineProperty(this.el, "value", {
                    get: () => proto.get.call(this.el),
                    set: (v) => { proto.set.call(this.el, v); applyChecked(v === "true"); },
                    configurable: true,
                });
                // 重对齐：底层 value（x-model 已写，布尔语域）优先、否则按 data.value 对 checkValues 的归属
                const resync = () => {
                    real.value = String(vals()[0]);
                    const raw = proto.get.call(this.el);
                    if (raw === "true") applyChecked(true);
                    else if (raw === "false") applyChecked(false);
                    else if (this.data.value === vals()[0]) applyChecked(true);
                    else if (this.data.value === vals()[1]) applyChecked(false);
                };
                setTimeout(resync, 0); // mounted 时化身子树与 props 均可能未就位，一跳后首对齐
                this.watch("checkValues", () => { setTimeout(resync, 0); });
                this.watch("value", ({ value: v }) => { // props value 受控通道（无 x-model 时）
                    if (v === vals()[0] || v === vals()[1]) resync();
                });
            }

            // 涟漪动态挂载（ADR-0010 运行时契约：不经编译、直接写属性即生效）；
            // 配置走 x-ripple-options 通道（裸 x-ripple 的值只参与三态判定、不承载配置）；
            // ripple 即该配置的 props 值：false 不启用；启用时缺省 { trigger: "click", inside: true }
            // （点击播一个周期自止、约束按钮内部），对象形态全键可覆盖缺省；
            // options 运行时改值无效（ADR-0010 决策 7）——变化时先摘 x-ripple 触发重挂再重读；
            // 需页面已加载 autospark.ripple.js，未加载时属性无人消费、静默无害
            const syncRipple = () => {
                const conf = this.data.ripple;
                this.el.removeAttribute("x-ripple");
                this.el.removeAttribute("x-ripple-options");
                if (conf) {
                    this.el.setAttribute("x-ripple-options", JSON.stringify(typeof conf === "object" ? { trigger: "click", inside: true, ...conf } : { trigger: "click", inside: true }));
                    this.el.setAttribute("x-ripple", "");
                }
            };
            syncRipple();
            this.watch("ripple", () => { syncRipple(); });

            // checkable 点击翻转：按 checkValues 二元组切换，桥值写布尔语域（"true"/"false"）后派发
            // input（x-model 回写，配 .boolean 类型保真）与 change（detail 携带 checkValues 语域值）
            this.el.addEventListener("click", () => {
                if (!this.data.checkable || this.el.disabled) return;
                const [onVal, offVal] = this.data.checkValues;
                const next = this.data.value === onVal ? offVal : onVal;
                const nextOn = next === onVal;
                this.el.value = String(nextOn); // 劫持 setter 同步视觉与内嵌 input（布尔语域）
                this.el.dispatchEvent(new Event("input", { bubbles: false })); // x-model 监听在宿主自身
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));
            });
        },
    }
  <\/script>
  <style global id="autospark-components-button">
    .asc-button {
      --asc-tone: var(
        --auto-primary-color,
        var(--asc-button-primary, #009aff)
      ); /* 语义色中转（data-type 注入） */
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      --asc-line: transparent;
      /* 内距基准：消费 --auto-padding（--auto-spacing 速写族）——容器 data-spacing 档位全局调节生效 */
      --asc-pad: var(--auto-padding, var(--asc-button-padding, 0.8rem));
      display: inline-flex;
      border: var(--auto-border-size, var(--asc-button-border-size, 1px)) solid
        var(--asc-line);
      border-radius: var(
        --auto-border-radius,
        var(--asc-button-radius, 0.5rem)
      );
      background: var(--asc-bg);
      color: var(--asc-ink);
      font: inherit;
      font-size: var(--auto-font-size, var(--asc-button-font-size, 0.875rem));
      line-height: 1.4;
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.8);
      cursor: pointer;
      user-select: none;
      transition:
        filter 0.15s ease,
        background-color 0.15s ease;
    }
    .asc-button:has(> .asc-button-body[data-border="true"]) {
      --asc-line: var(
        --auto-border-color,
        var(--asc-button-border-color, #d9d9d9)
      );
    }

    .asc-button:has(> .asc-button-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #009aff));
    }
    .asc-button:has(> .asc-button-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #22c55e));
    }
    .asc-button:has(> .asc-button-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f59e0b));
    }
    .asc-button:has(> .asc-button-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #ef4444));
    }
    .asc-button:has(> .asc-button-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #71717a));
    }
    .asc-button:has(> .asc-button-body[data-variant="default"]) {
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #ffffff));
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
    }
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="success"]
    ),
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="warning"]
    ),
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="danger"]
    ),
    .asc-button:has(
      > .asc-button-body[data-variant="default"][data-type="info"]
    ) {
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
    }
    .asc-button:has(> .asc-button-body[data-variant="primary"]) {
      --asc-bg: var(--asc-tone);
      --asc-ink: #fff;
    }
    /* secondary：次级底 + 正文色（描边交给 border 开关） */
    .asc-button:has(> .asc-button-body[data-variant="secondary"]) {
      --asc-bg: var(
        --auto-secondary-bgcolor,
        var(--asc-button-bg, rgba(245, 245, 245, 0.45))
      );
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
    }
    /* dashed：透明底 + 语义色虚线边 + 语义色字 */
    .asc-button:has(> .asc-button-body[data-variant="dashed"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
      border-style: dashed;
    }
    /* text：透明底 + 正文色 */
    .asc-button:has(> .asc-button-body[data-variant="text"]) {
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);
    }
    /* link：透明底 + 语义色字、无内距（inline 链接感） */
    .asc-button:has(> .asc-button-body[data-variant="link"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      padding: 0;
    }

    /* ---------- 幽灵（ghost）：透明底 + 语义色内容/描边，可与任意形态组合 ---------- */
    .asc-button:has(> .asc-button-body[data-ghost="true"]) {
      --asc-bg: transparent;
      --asc-ink: var(--asc-tone);
      --asc-line: var(--asc-tone);
    }

    /* ---------- 菜单项形态（menu）：占满宽、透明底、左对齐、hover 淡底 ---------- */
    .asc-button:has(> .asc-button-body[data-menu="true"]) {
      --asc-bg: transparent;
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));
      display: flex;
      width: 100%;
      border-radius: var(
        --auto-border-radius,
        var(--asc-button-radius, 0.375rem)
      );
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);
      text-align: left;
    }

    /* ---------- 勾选渲染（checkStyle）：指示色统一 --asc-tone（theme 主色，type 非默认时语义色） ---------- */
    /* solid（默认）：勾选 = tone 实底 + 反白字 */
    .asc-button.asc-checked.asc-check-solid,
    .asc-button:has(
      > .asc-button-body:not([data-check-style])[data-checked="true"]
    ) {
      --asc-bg: var(--asc-tone) !important;
      --asc-ink: #fff !important;
      --asc-line: transparent !important;
    }
    /* icon：最左 1.2em 固定占位（未勾选留空、无布局跳动），勾选显 tone 色 yes 指示；
         背景维持原 variant 形态（Q12：仅指示器变化） */
    .asc-button-body[data-check-style="icon"] {
      position: relative;
    }
    .asc-button-body[data-check-style="icon"]::before {
      content: "";
      flex: none;
      width: 1.2em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--asc-tone);
      font-size: 0.9em;
      font-weight: bold;
    }
    .asc-button:has(
        > .asc-button-body[data-check-style="icon"][data-checked="true"]
      )
      .asc-button-body[data-check-style="icon"]::before {
      content: "✓";
    }
    /* corner：勾选 = tone 描边 outline + 右上角 tone 小三角内嵌反白小勾；背景维持原 variant。
         三角 = 渐变盒（对角线分割、右上半着色）越出盒外 1px 与外描边同色融合（弧线无缝相接）；
         尺寸 = min(圆角半径 ×2.5, 2.5em, 按钮高 50%)——高度基准 + aspect-ratio 方形推导，
         超过按钮高一半时以 50% 封顶；圆角档位切换自动跟随 */
    .asc-button.asc-checked.asc-check-corner {
      --asc-corner: min(
        calc(var(--auto-border-radius, 0.5rem) * 2.5),
        2.5em,
        50%
      ) !important;
      /* 外描边（默认 offset 0，画在盒外）——不受涟漪载体（inset:0 覆盖盒内）播放期色块遮挡 */
      box-shadow: 0 0 0 1px var(--asc-tone) !important; /* 外描边走 box-shadow（视觉等价 outline、跟随圆角、绘制路径独立，规避 outline 重绘问题 */
    }
    .asc-button.asc-checked.asc-check-corner::after {
      content: "" !important;
      position: absolute !important;
      top: -1px !important;
      right: -1px !important;
      height: calc(var(--asc-corner) + 1px) !important;
      aspect-ratio: 1 / 1 !important;
      border-top-right-radius: min(
        calc(var(--auto-border-radius, 0.5rem) + 1px),
        1.4em
      );
      background: linear-gradient(
        to bottom left,
        var(--asc-tone) 49.5%,
        transparent 50%
      );
      z-index: 1 !important;
    }
    /* 反白小勾：定位于三角重心（对角线中点向直角方向）——系数基准同 --asc-corner（含 50% 高度
         上限同步缩放），-1px 补偿三角盒越出量，确保落在三角内部 */
    .asc-button.asc-checked.asc-check-corner::before {
      content: "" !important;
      position: absolute !important;
      top: calc(var(--asc-corner) * 0.24 - 1px) !important;
      right: calc(var(--asc-corner) * 0.14 - 1px) !important;
      z-index: 2 !important;
      width: calc(var(--asc-corner) * 0.36) !important;
      aspect-ratio: 2 / 1 !important;
      border-left: 1.5px solid var(--auto-bgcolor, #fff) !important;
      border-bottom: 1.5px solid var(--auto-bgcolor, #fff) !important;
      transform: rotate(-45deg) !important;
    }
    /* 按压预览（corner 按压即预显描边——松手勾选正式化、按住拖出取消随按压消失；
         化解「松手才见描边」的迟滞感，涟漪芯在盒内与此描边（盒外）无覆盖冲突） */
    .asc-button.asc-check-corner:active:not([disabled]):not(.asc-checked) {
      box-shadow: 0 0 0 1px var(--asc-tone) !important; /* 外描边走 box-shadow（视觉等价 outline、跟随圆角、绘制路径独立，规避 outline 重绘问题 */
    }
    /* 三角/描边定位基准（宿主需定位上下文；x-ripple 的 .x-ripple 已有 relative 兜底，此处显式自持） */
    .asc-button.asc-checked.asc-check-corner {
      position: relative !important;
    }

    /* ---------- 形状（shape）：circle 恒胶囊半径——纯图标时内容等宽高自然呈正圆，带文字自动胶囊 ---------- */
    .asc-button:has(> .asc-button-body[data-shape="circle"]) {
      border-radius: 9999px;
      padding: calc(var(--asc-pad) * 0.55);
    }

    /* ---------- 适配父宽度 ---------- */
    .asc-button:has(> .asc-button-body[data-block="true"]) {
      display: flex;
      width: 100%;
    }

    /* ---------- 交互态 ---------- */
    .asc-button:hover:not([disabled]) {
      filter: brightness(0.96);
    }
    .asc-button:active:not([disabled]) {
      filter: brightness(0.9);
    }
    /* text / link / ghost / menu 淡形态：亮度反馈无感，改用悬停淡底 */
    .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(
        [disabled]
      ),
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ),
    .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(
        [disabled]
      ),
    .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(
        [disabled]
      ) {
      filter: none;
      background: var(
        --auto-hover-bgcolor,
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))
      );
    }
    .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ) {
      text-decoration: underline;
    }
    .asc-button[disabled] {
      opacity: 0.55;
      cursor: not-allowed;
      filter: none;
    }
    /* loading 即禁点但视觉不淡化（优先于 disabled，Q9） */
    .asc-button:has(> .asc-button-body[data-loading="true"]) {
      opacity: 1;
      cursor: progress;
    }

    /* ---------- body 布局（body 是编译子树内层，绑定可求值，直接命中选择器） ---------- */
    .asc-button-body {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      width: 100%;
      min-width: 0;
    }
    .asc-button-body[data-align="left"] {
      justify-content: flex-start;
    }
    .asc-button-body[data-align="right"] {
      justify-content: flex-end;
    }
    .asc-button-body[data-menu="true"] {
      justify-content: flex-start;
    } /* 菜单项恒左对齐 */
    .asc-button-body[data-menu="true"] .asc-button-main {
      align-items: flex-start;
    } /* label/memo 文本亦居左（与 memo 折行/短 label 对齐左缘） */
    .asc-button-body[data-label-below="true"] {
      flex-direction: column;
      gap: 0.15em;
    } /* label 纵排 */

    /* 图标位：尺寸随字号（x-icon 默认 1em），loading 转圈自带 SMIL 动画 */
    .asc-button-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    /* iconPlacement: end——图标（含 loading 位）移内容区末尾并与 tags 互换（icon 恒最末）；
         横排 = 右侧、纵排（labelBelow）= 下方；checkStyle icon 的 yes 占位（body::before）恒最前不受影响 */
    .asc-button-body[data-icon-placement="end"] .asc-button-icon {
      order: 5;
    }
    /* 图标角标（icon.badge 标量三形态启用）：板 padding 承载留白，伪元素红点取 danger 语义色 */
    .asc-button-icon-badge {
      position: relative;
    }
    .asc-button-icon-badge::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 0.4em;
      height: 0.4em;
      border-radius: 50%;
      background: var(--auto-danger-color, var(--asc-button-danger, #ef4444));
    }

    /* 主文本组：label 与 memo 恒纵排（memo 在 label 下方） */
    .asc-button-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 0;
    }
    /* label 单行截断（wrap 默认 false，ADR-0012 补记）：溢出显示省略号——截断只在按钮
         宽度受约束时发生（block / menu / 容器挤压；inline-flex 收缩到内容宽永不触发）；
         max-width 钳制是关键——nowrap 下 min-content 涨至全文宽，column flex 的
         align-items 非 stretch 使 label 取 fit-content，无钳制会被 min-content 抬出
         可用宽（截断失效）；截断发生时由 mounted 静态检测自动挂 title；wrap=true 回
         折行（按钮高度随行数增长，显式声明才换行，防布局被意外撑开） */
    .asc-button-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .asc-button-body[data-wrap="true"] .asc-button-label {
      white-space: normal;
    }
    /* 空内容不占位：纯图标用法（label 空）时出口与主文本组整体隐藏，消除 gap/行高占位；
         插槽有内容时出口非空不命中，不受影响 */
    .asc-button-label:empty {
      display: none;
    }
    .asc-button-main:has(> .asc-button-label:empty):not(
        :has(> .asc-button-memo)
      ) {
      display: none;
    }
    .asc-button-body[data-align="left"] .asc-button-main {
      align-items: flex-start;
    }
    .asc-button-body[data-align="right"] .asc-button-main {
      align-items: flex-end;
    }

    /* 备注：小一号 + 相对内容色的淡化（color-mix 跟随 --asc-ink，实底上自然呈淡白）；
         最多两行，超出截断显示省略号（line-clamp） */
    .asc-button-memo {
      font-size: 0.75em;
      line-height: 1.2;
      color: color-mix(in srgb, var(--asc-ink, currentColor) 70%, transparent);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow: hidden;
    }
    /* memo 在场时图标默认 2 倍大（与 label+memo 双行文本块视觉配平）；
         图标与文本块的垂直居中由 body 的 align-items: center 承担 */
    .asc-button:has(.asc-button-memo) .asc-button-icon {
      font-size: 2em;
    }

    /* tags 小圆钮：右侧小一号圆形，独立 hover 反馈 */
    .asc-button-tags {
      display: inline-flex;
      gap: 0.25em;
      margin-left: 0.35em;
    }
    /* x-for 克隆载体盒消失，圆钮直接成为容器 flex 项 */
    .asc-button-tag-item {
      display: contents;
    }
    .asc-button-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.8em;
      height: 1.8em;
      font-size: 0.75em;
      border-radius: 50%;
      color: var(--asc-ink);
      cursor: pointer;
      /* 常态即与按钮主背景形成色差：按内容色派生淡底（实底上呈淡白、透明底上呈淡灰/淡语义色） */
      background: color-mix(
        in srgb,
        var(--asc-ink, currentColor) 12%,
        transparent
      );
      transition:
        background-color 0.15s ease,
        transform 0.1s ease;
    }
    .asc-button-tag:hover {
      background: color-mix(
        in srgb,
        var(--asc-ink, currentColor) 28%,
        transparent
      );
    }
    /* 按压反馈：底色加深 + 轻微缩放（松手经 transition 弹回） */
    .asc-button-tag:active {
      background: color-mix(
        in srgb,
        var(--asc-ink, currentColor) 45%,
        transparent
      );
      transform: scale(0.88);
    }
    .asc-button-tag-icon {
      display: inline-flex;
      width: 1em;
      height: 1em;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-button,
    [data-dark] .asc-button {
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
      --asc-bg: var(
        --auto-secondary-bgcolor,
        var(--asc-button-bg, rgba(129, 129, 129, 0.45))
      );
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="primary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="primary"]) {
      --asc-bg: var(--auto-primary-color, var(--asc-button-primary, #56baff));
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="secondary"]) {
      --asc-bg: var(
        --auto-secondary-bgcolor,
        var(--asc-button-bg, rgba(129, 129, 129, 0.45))
      );
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
    }
    [dark] .asc-button:has(> .asc-button-body[data-variant="default"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-variant="default"]) {
      --asc-bg: var(--auto-bgcolor, var(--asc-button-bg, #3a3a3a));
      --asc-ink: var(--auto-color, var(--asc-button-color, #fafafa));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="primary"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="primary"]) {
      --asc-tone: var(--auto-primary-color, var(--asc-button-primary, #56baff));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="success"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="success"]) {
      --asc-tone: var(--auto-success-color, var(--asc-button-success, #5cd07c));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="warning"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="warning"]) {
      --asc-tone: var(--auto-warning-color, var(--asc-button-warning, #f0a03c));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="danger"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="danger"]) {
      --asc-tone: var(--auto-danger-color, var(--asc-button-danger, #e6696a));
    }
    [dark] .asc-button:has(> .asc-button-body[data-type="info"]),
    [data-dark] .asc-button:has(> .asc-button-body[data-type="info"]) {
      --asc-tone: var(--auto-info-color, var(--asc-button-info, #a1a1aa));
    }
    [dark]
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(
        [disabled]
      ),
    [dark]
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ),
    [dark]
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(
        [disabled]
      ),
    [dark]
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-variant="text"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-variant="link"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-ghost="true"]):hover:not(
        [disabled]
      ),
    [data-dark]
      .asc-button:has(> .asc-button-body[data-menu="true"]):hover:not(
        [disabled]
      ) {
      background: var(
        --auto-hover-bgcolor,
        var(--asc-button-hover-bg, rgba(255, 255, 255, 0.08))
      );
    }
  </style>
  <!-- 变体数据属性全部承载在 body（编译子树内层元素，经 :has() 驱动宿主外观——见文件头注释）；
         indent（原始值）经 :style 加性内联（body 无 padding，不影响宿主内距） -->
  <span
    class="asc-button-body"
    :data-variant="variant"
    :data-type="type"
    :data-ghost="ghost"
    :data-border="border"
    :data-shape="shape"
    :data-label-below="labelBelow"
    :data-wrap="wrap"
    :data-align="align"
    :data-menu="menu"
    :data-block="block"
    :data-checked="checkable && value === checkValues[0]"
    :data-loading="loading"
    :data-check-style="checkable ? checkStyle : undefined" :data-icon-placement="iconPlacement"
    :style="indent ? { paddingLeft: (typeof indent === 'number' ? indent + 'px' : indent) } : undefined"
  >
    <!-- loading 图标替换左图标位（字面量须带引号——裸 loading 会命中 data.loading 布尔值） -->
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>
    <!-- icon 双形态：字符串 = 图标名；对象 = { name, size, color, strokeWidth, padding }——name 经 x-icon 值消费，
         视觉键由 mounted 的 syncIconStyle 以内联样式透传（与 x-icon 原生内联实现等价；
         绑定表达式通道对 props 晚注入不重算，故走 JS 同步通道） -->
    <span
      class="asc-button-icon"
      x-if="!loading && typeof icon === 'string' && icon"
      x-icon="icon"
    ></span>
    <span
      class="asc-button-icon"
      x-if="!loading && typeof icon === 'object' && icon"
      x-icon="icon.name"
    ></span>
    <span class="asc-button-main">
      <!-- 默认插槽出口：未提供内容时显示 {{ displayLabel }}（组件自身状态求值） -->
      <span class="asc-button-label" x-slot>{{ displayLabel }}</span>
      <span class="asc-button-memo" x-if="memo">{{ memo }}</span>
    </span>
    <span class="asc-button-tags" x-if="tags && tags.length">
      <!-- x-for 宿主自身的绑定不被编译（ownsChildren 接管子树编译），故宿主为纯克隆载体，
             tag 圆钮与绑定（title/点击）在内层元素上，x-for locals（tag）在内层可见 -->
      <span
        class="asc-button-tag-item"
        x-for="tag of tags"
        :key="tag.name || tag.icon"
      >
        <i
          class="asc-button-tag"
          :title="tag.tooltip"
          @click="onTagClick(tag, $event)"
        >
          <i class="asc-button-tag-icon" x-if="tag.icon" x-icon="tag.icon"></i>
        </i>
      </span>
    </span>
  </span>
</button>
`,e.precompile?.(e=>{for(let r of Array.from(e.el.querySelectorAll(`x-button`))){let e=document.createElement(`button`),i=e=>e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase()),a=e=>/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e),o=[];for(let t of Array.from(r.attributes))t.name.startsWith(`:`)?o.push(`${a(i(t.name.slice(1)))}: (${t.value})`):t.name===`class`||t.name===`style`||t.name===`id`||t.name===`name`||t.name.startsWith(`data-`)||t.name.startsWith(`x-`)||t.name.startsWith(`@`)?e.setAttribute(t.name,t.value):o.push(`${a(i(t.name))}: ${JSON.stringify(n(t.value))}`);for(e.setAttribute(`x-component:${t}`,`{ ${o.join(`, `)} }`);r.firstChild;)e.appendChild(r.firstChild);r.replaceWith(e)}})}i();function i(){e(e=>{r(e)})}};
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
