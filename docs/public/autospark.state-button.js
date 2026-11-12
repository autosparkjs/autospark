(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.state-button`;function a(e){e.components[i]=`<!--
    继承骨架 + 机制自治（ADR-0016）：x-define:inherit 复用 autospark.button 的纯按钮
    视觉全套（快照克隆，模板/CSS 骨架单份），状态机制全套自持于本组件的 setup 与
    styles——button 已取消 checkable 特性，本组件是其承接者（迁移动作见 ADR-0016）。

    x-button-options（2026-11-11 泛化，即 <x-button> 的选项集）= **button props 全集**（variant/type/ghost/border/shape/
    loading/icon/label/memo/ripple/wrap/... 切态整组注入 data——每态可完全自定义按钮的
    渲染与形态）+ 状态机制键（value 状态值 / clickable 出边锁 / decorate 额外装饰 /
    tooltip 双轨提示 / style cssText / class 附加类——机制键不走 props 注入通道）。

    事件与数据出口：
    - change：切换实际发生后冒泡，detail = { value, index, state }（新态三元组）
    - 原生 click：恒触发（不派发自定义 click——与原生同名双触发不可接受）；state 数据
      经宿主常驻 data-value dataset 反射读取（外层 @click="v = $event.currentTarget.dataset.value"）
    - 表单桥：布尔二元组（缺省组即此）内嵌 input[type=checkbox]（el.value 布尔语域，
      配 x-model.boolean 保真，未勾选不提交）；其余形态内嵌 input[type=hidden]
      （value = String(当前值)、name 透传宿主）；N>2 受控通道 = @change（x-model 对
      非布尔组字符串化固有，自担）

    装饰渲染（states 项键 decorate，取代 button 旧组件级 checkStyle）：
    - solid = tone 实底反白 / icon = 最左 yes 占位 / corner = 右上角越界打勾三角 /
      ripple = 最左 CSS 自绘涟漪动画占位（mounted 注入的 DOM 无编译通道，x-icon 不可用，
      视觉对齐内置 ripple 图标动效语言）——宿主 class 通道：asc-d-<x> 当前态佩戴、
      asc-p-check / asc-p-ripple 组内任一佩戴即常驻占位（防布局跳动）
    - 灰色无匹配态（asc-unmatched）：value 不在 states 值域——中性灰覆盖 variant/type、
      pointer + hover 可点击（与 disabled 的 opacity+not-allowed 明确分野）
-->
<!-- 子模板不含覆盖段（裸子节点会被收为默认段替换父 label 出口 fallback）——仅资源节点 -->
<button
  class="asc-state-button"
  x-define="autospark.state-button"
  x-define:inherit="autospark.button"
>
  <script setup>
    {
        data: () => ({
            states: undefined,   // 状态集：x-button-options[] | (number|string)[]——x-button-options = button props 全集（variant/type/ghost/shape/loading/icon/label/ripple... 切态整组注入，每态完全自定义按钮渲染与形态）+ 机制键（value/clickable/decorate/tooltip/style/class）；标量即 {value} 简写、对象缺 value 回退下标；undefined 落缺省组
            value: undefined,    // 当前状态值（受控真相，组件不擅改——仅点击翻转/缺省初始化写入）；undefined 缺省初始化为 states[0].value（初始态即首态）
            autoswitch: true,    // true：点击自动切下一态（change + 原生 click）；false：纯受控（仅原生 click，切换由外部回写 value）
        }),
        mounted() {
            // —— 归一化（幂等纯函数，不写回 data——写回会触发 watch 自环）——
            // undefined/null 落缺省组 [{value:false},{value:true,decorate:'corner'}]（零配置即
            // 传统双态 check 按钮）；非数组/空数组 → []（无效状态集，恒无匹配灰、不可切态，静默退化）
            const DEFAULT_STATES = [{ value: false }, { value: true, decorate: "corner" }];
            const norm = () => {
                const raw = this.data.states;
                const arr = raw == null ? DEFAULT_STATES : Array.isArray(raw) ? raw : [];
                return arr.map((item, i) =>
                    typeof item === "object" && item !== null
                        ? { ...item, value: Object.hasOwn(item, "value") ? item.value : i }
                        : { value: item },
                );
            };
            // 布尔二元组判定（缺省组即此）：checkbox 布尔语域桥的前提（el.value 只取 "true"/"false"，
            // 配 x-model.boolean 类型保真——对齐原生 checkbox 语义）；非布尔组不劫持 el.value
            const boolPair = (() => {
                const l = norm();
                return l.length === 2 && l.some((s) => s.value === true) && l.some((s) => s.value === false);
            })();
            // 值序列化（dataset 反射 / hidden input 共用）：对象 JSON 化、其余 String
            const serialize = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));

            // button props 键面（态注入的键清单）：**显式清单驱动**——this.data 是挂链数据视图，
            // Object.keys 枚举出的是根 state 键（含 $scopes/$ 框架保留键），不能用于枚举组件
            // props 面（读穿透组件域可用、枚举不可用）；清单与 button 的 data() 键面一一对应
            // （theme 六键不在 data 域、不参与态注入——档位不随态切换）
            const BUTTON_PROPS = [
                "variant", "type", "label", "labelPos", "icon", "loading", "ghost", "border",
                "block", "disabled", "ripple", "autoInsertSpace", "shape", "wrap", "align",
                "indent", "memo", "tags", "menu",
            ];

            // 底值快照（态注入的回退基准）：一跳后 states/value 注入落定，遍历 data 快照
            // **全部 button props 键**（排除状态机制 props 与 computed 函数值——displayLabel
            // 等不可被态覆盖）+ 宿主原样式；init 前为 null（syncVisual 注入段守卫跳过）
            let base = null;
            // label 覆盖直写通道：{{ displayLabel }} 是父的 computed（组件域 computed 对后续
            // data.label 赋值不重算——仅初始化首求值生效，ADR-0016 实施注记），故态 label
            // 变化直写 span 文本；**fallback 特征探测**——初始文本与底值 label 的派生一致
            // （含两字插空格）才视为 fallback 在场，插槽内容在场时跳过直写（插槽优先）
            let labelSpan = null;
            let labelIsFallback = false;
            const deriveLabel = (t) =>
                this.data.autoInsertSpace && /^[一-龥]{2}$/.test(t ?? "") ? t[0] + " " + t[1] : String(t ?? "");
            // 态 class 上次写入（切态摘旧加新，不碰使用者宿主 class）
            let prevCls = [];
            // 态 tooltip 自挂标记（仅摘自挂的，宿主显式提示永不覆盖）
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";
            let selfTip = false;

            // —— 表单载体：内嵌隐藏 input（display:none、name 透传宿主）——
            const real = document.createElement("input");
            real.type = boolPair ? "checkbox" : "hidden";
            real.style.display = "none";
            const nameAttr = this.el.getAttribute("name");
            if (nameAttr != null) real.name = nameAttr;
            this.el.appendChild(real);

            // —— 全视觉同步（按 data.value 现值求当前态，幂等）——
            const syncVisual = () => {
                const list = norm();
                const cur = list.find((s) => s.value === this.data.value) ?? null;
                const st = cur ?? {};
                // 1. 装饰 class：当前态佩戴 → asc-d-<x>；组内任一佩戴 check/ripple → 常驻占位标记
                for (const k of ["asc-d-solid", "asc-d-check", "asc-d-corner", "asc-d-ripple", "asc-p-check", "asc-p-ripple", "asc-unmatched"]) {
                    this.el.classList.remove(k);
                }
                if (typeof st.decorate === "string" && st.decorate) this.el.classList.add("asc-d-" + st.decorate);
                if (list.some((s) => s.decorate === "check")) this.el.classList.add("asc-p-check");
                if (list.some((s) => s.decorate === "ripple")) this.el.classList.add("asc-p-ripple");
                // 1.5 ripple 指示器在场性 = 组内任一态佩戴（佩戴才注入、无佩戴即移除——运行时
                //     states 整体替换随本函数重跑自动修正；注入的 DOM 无编译通道（x-icon 不可用），
                //     CSS 自绘呼吸点 + 扩散环；恒插 body 最前（指示器恒最前纪律））
                {
                    const body = this.el.querySelector(".asc-button-body");
                    const checkEl = body?.querySelector(":scope > .asc-state-check") ?? null;
                    const hasRipple = list.some((s) => s.decorate === "ripple");
                    if (hasRipple && body && !checkEl) {
                        const el = document.createElement("span");
                        el.className = "asc-state-check";
                        body.prepend(el);
                    } else if (!hasRipple && checkEl) {
                        checkEl.remove();
                    }
                }
                // 2. 灰色无匹配态（无效状态集亦恒无匹配）
                this.el.classList.toggle("asc-unmatched", cur === null);
                // 3. dataset 反射（外层 @click 读取当前值的通道——原生 click 无 detail）
                this.el.setAttribute("data-value", serialize(this.data.value));
                // 4. 表单载体同步：布尔组 checkbox 按真值勾选（提交值 = String(true 态 value)）；
                //    其余 hidden 恒随提交（value 是受控真相，域外值原样提交）
                if (boolPair) {
                    real.checked = cur !== null && cur.value === true;
                    real.value = String(list.find((s) => s.value === true)?.value ?? true);
                } else {
                    real.value = serialize(this.data.value);
                }
                // 5. 态注入（button props 透传，仅当前态生效）：当前态在场的 button props 键
                //    （BUTTON_PROPS 清单内）写入 data（触发父模板既有绑定 :data-variant/:data-type/
                //    x-icon… 与父 mounted 的 watch（disabled/loading/icon/ripple/label）重算），
                //    未声明键回退底值——每态可完全自定义按钮渲染与形态；机制键（clickable/
                //    decorate/tooltip/style/class）不在清单天然不注入；label 另走直写通道
                //    （displayLabel computed 对后续赋值不重算，见上方注释）
                if (base) {
                    for (const k of BUTTON_PROPS) {
                        this.data[k] = Object.hasOwn(st, k) ? st[k] : base[k];
                    }
                }
                if (labelSpan && labelIsFallback) labelSpan.textContent = deriveLabel(Object.hasOwn(st, "label") && st.label != null ? st.label : base?.label ?? "");
                // 6. 态 style（cssText，对齐 tags.styles 通道）：宿主原样式为基底整写（追加态样式）
                this.el.style.cssText = base.cssText + (typeof st.style === "string" && st.style.trim() ? (base.cssText.trim().endsWith(";") || !base.cssText.trim() ? "" : ";") + st.style : "");
                // 7. 态 class：摘旧加新（不碰使用者宿主 class）
                if (prevCls.length) for (const c of prevCls) this.el.classList.remove(c);
                prevCls = typeof st.class === "string" && st.class.trim() ? st.class.trim().split(/\\s+/) : [];
                for (const c of prevCls) this.el.classList.add(c);
                // 8. 态 tooltip（双轨）：当前态佩戴则挂（无条件挂——优先级高于父的溢出自动提示，
                //    ADR-0016 决策 8）；态消失只摘自挂的；宿主显式提示优先（未自挂且在场则不动）
                if (st.tooltip != null && String(st.tooltip) !== "") {
                    if (!selfTip && this.el.getAttribute(tipAttr)) {
                        // 在场的可能是父挂的溢出自动提示（低优先级，覆盖之）或宿主显式提示——
                        // 无法可靠区分，按「态佩戴意图明确」覆盖（已知温和竞争，ADR-0016 注记）
                    }
                    this.el.setAttribute(tipAttr, String(st.tooltip));
                    selfTip = true;
                } else if (selfTip) {
                    this.el.removeAttribute(tipAttr);
                    selfTip = false;
                }
            };

            // —— el.value 劫持（布尔组化身 checkbox，x-model 桥）：布尔语域 "true"/"false" ——
            // x-model 写 el.value → data.value 落真布尔（默认组与注入组的字符串解释一致，
            // props 晚注入时序天然免疫）；非布尔组不劫持（x-model 字符串化固有语义自担）
            const proto = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, "value");
            if (boolPair) {
                Object.defineProperty(this.el, "value", {
                    get: () => proto.get.call(this.el),
                    set: (v) => {
                        proto.set.call(this.el, v);
                        this.data.value = v === "true";
                        setTimeout(syncVisual, 0);
                    },
                    configurable: true,
                });
            }

            // —— 点击切换（循环 next + 四重判定链，ADR-0016 决策 4/5/6）——
            // 生效条件：autoswitch !== false && 当前态 clickable !== false && !disabled && !loading
            // （disabled 由原生 button 物理拦截 click，无需判）；命中 states[i] → states[(i+1)%N]
            // （无匹配 → states[0]），写 value + syncVisual 后派发 change（新态三元组）；
            // 布尔组另派发 input（x-model 回写监听在宿主自身）
            this.el.addEventListener("click", () => {
                if (this.el.disabled || this.data.autoswitch === false) return;
                const list = norm();
                if (list.length < 2) return; // 无效状态集：不可切态
                const cur = list.find((s) => s.value === this.data.value) ?? null;
                if (cur && cur.clickable === false) return; // 出边锁：该态点击零效果
                const index = cur ? (list.indexOf(cur) + 1) % list.length : 0;
                const next = list[index];
                this.data.value = next.value;
                syncVisual();
                // 布尔组：写底层 el.value（布尔语域）后派发 input——x-model 监听在宿主自身，
                // 读 el.value 回写 state（配 .boolean 类型保真）
                if (boolPair) {
                    proto.set.call(this.el, String(next.value === true));
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));
                }
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next.value, index, state: next } }));
            });

            // —— corner 按压预览（下一态佩戴 corner 时预显描边——松手切换正式化）——
            const previewCorner = (on) => {
                this.el.classList.toggle("asc-corner-preview", on);
            };
            this.el.addEventListener("pointerdown", () => {
                if (this.el.disabled || this.data.autoswitch === false) return;
                const list = norm();
                if (list.length < 2) return;
                const cur = list.find((s) => s.value === this.data.value) ?? null;
                if (cur && cur.clickable === false) return;
                const next = cur ? list[(list.indexOf(cur) + 1) % list.length] : list[0];
                previewCorner(next?.decorate === "corner");
            });
            this.el.addEventListener("pointerup", () => previewCorner(false));
            this.el.addEventListener("pointerleave", () => previewCorner(false));
            this.el.addEventListener("pointercancel", () => previewCorner(false));

            // —— 一跳后初始化：states/value 注入落定 → 缺省 value = states[0].value、底值快照、
            // 首次视觉同步（mounted 时化身子树与 props 均可能未就位，家族惯用法）——
            setTimeout(() => {
                const list = norm();
                // 重对齐（布尔组）：底层 el.value（x-model 编译期已写，布尔语域）优先于缺省初始化
                if (boolPair) {
                    const raw = proto.get.call(this.el);
                    if (raw === "true") this.data.value = true;
                    else if (raw === "false") this.data.value = false;
                }
                if (this.data.value === undefined && list.length > 0) this.data.value = list[0].value;
                base = { cssText: this.el.style.cssText };
                for (const k of BUTTON_PROPS) base[k] = this.data[k];
                // label 直写通道探测：首帧插值已完成（显示底值 label 派生），特征匹配即许可直写
                const span = this.el.querySelector(".asc-button-label");
                if (span && span.textContent === deriveLabel(base.label)) {
                    labelSpan = span;
                    labelIsFallback = true;
                }
                syncVisual();
            }, 0);
            // 受控通道：外部改 value → 视觉跟随（states 替换同理重对齐——value 不在新值域时
            // 保持无匹配回灰，value 是受控真相不被擅改）
            this.watch("value", () => { syncVisual(); });
            this.watch("states", () => { setTimeout(syncVisual, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-state-button">
    /* ---------- 装饰 solid：当前态佩戴 = tone 实底 + 反白字（覆盖 variant 表达；!important
         压过 :has 变体规则族——继承拼接的父样式在前，级联后者胜 + important 双保险） ---------- */
    .asc-state-button.asc-d-solid {
      --asc-bg: var(--asc-tone) !important;
      --asc-ink: #fff !important;
      --asc-line: transparent !important;
    }

    /* ---------- 装饰 check：组内任一态佩戴（asc-p-check）即 body 最前常驻 1.2em 占位
         （未佩戴态留空、零布局跳动）；当前态佩戴（asc-d-check）显 tone 色 yes ---------- */
    .asc-state-button.asc-p-check > .asc-button-body::before {
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
    .asc-state-button.asc-d-check > .asc-button-body::before {
      content: "✓";
    }

    /* ---------- 装饰 corner：当前态佩戴 = tone 外描边 + 右上角 tone 小三角内嵌反白小勾 ---------- */
    /* 三角 = 渐变盒（对角线分割、右上半着色）越出盒外 1px 与外描边同色融合（弧线无缝相接）；
         尺寸 = min(圆角半径 ×2.5, 2.5em, 按钮高 50%)——高度基准 + aspect-ratio 方形推导，
         圆角档位切换自动跟随；外描边走 box-shadow（视觉等价 outline、跟随圆角、绘制路径独立，
         不受涟漪载体播放期色块遮挡） */
    .asc-state-button.asc-d-corner {
      --asc-corner: min(
        calc(var(--auto-border-radius, 0.5rem) * 2.5),
        2.5em,
        50%
      );
      box-shadow: 0 0 0 1px var(--asc-tone);
      position: relative; /* 三角/描边定位上下文（x-ripple 载体另有 relative 兜底，此处显式自持） */
    }
    .asc-state-button.asc-d-corner::after {
      content: "";
      position: absolute;
      top: -1px;
      right: -1px;
      height: calc(var(--asc-corner) + 1px);
      aspect-ratio: 1 / 1;
      border-top-right-radius: min(
        calc(var(--auto-border-radius, 0.5rem) + 1px),
        1.4em
      );
      background: linear-gradient(
        to bottom left,
        var(--asc-tone) 49.5%,
        transparent 50%
      );
      z-index: 1;
    }
    /* 反白小勾：定位于三角重心（对角线中点向直角方向）——系数基准同 --asc-corner（含 50%
         高度上限同步缩放），-1px 补偿三角盒越出量，确保落在三角内部 */
    .asc-state-button.asc-d-corner::before {
      content: "";
      position: absolute;
      top: calc(var(--asc-corner) * 0.24 - 1px);
      right: calc(var(--asc-corner) * 0.14 - 1px);
      z-index: 2;
      width: calc(var(--asc-corner) * 0.36);
      aspect-ratio: 2 / 1;
      border-left: 1.5px solid var(--auto-bgcolor, #fff);
      border-bottom: 1.5px solid var(--auto-bgcolor, #fff);
      transform: rotate(-45deg);
    }
    /* 按压预览：下一态佩戴 corner 时 JS 挂 asc-corner-preview 预显描边（松手切换正式化、
         按住拖出取消随按压消失——化解「松手才见描边」迟滞感；当前已佩戴则本体描边在场不重复） */
    .asc-state-button.asc-corner-preview:not(.asc-d-corner) {
      box-shadow: 0 0 0 1px var(--asc-tone);
    }

    /* ---------- 装饰 ripple：最左 1.2em 常驻占位（组内任一态佩戴），当前态佩戴显
         tone 色 CSS 自绘涟漪动画（呼吸点 + 扩散环错峰——mounted 注入的 DOM 无编译通道，
         x-icon 不可用，视觉对齐内置 ripple 图标动效语言，ADR-0016 实施注记） ---------- */
    .asc-state-check {
      display: none; /* 缺省隐藏（组内无 ripple 佩戴零占位） */
    }
    .asc-state-button.asc-p-ripple > .asc-button-body > .asc-state-check {
      display: inline-flex;
      flex: none;
      width: 1.2em;
      align-items: center;
      justify-content: center;
      position: relative;
      visibility: hidden; /* 未佩戴态留空占位 */
    }
    .asc-state-button.asc-d-ripple > .asc-button-body > .asc-state-check {
      visibility: visible;
    }
    .asc-state-button.asc-d-ripple .asc-state-check::before {
      content: "";
      position: absolute;
      width: 0.28em;
      height: 0.28em;
      border-radius: 50%;
      background: var(--asc-tone); /* 指示色统一 tone（与 icon/corner 同口径） */
      animation: asc-state-check-dot 1.6s ease-in-out infinite;
    }
    .asc-state-button.asc-d-ripple .asc-state-check::after {
      content: "";
      position: absolute;
      width: 0.9em;
      height: 0.9em;
      border-radius: 50%;
      border: 1.5px solid var(--asc-tone);
      animation: asc-state-check-ring 1.6s ease-out infinite;
    }
    /* primary 实底下 --asc-tone 与背景同色（指示器隐形），改取反白内容色保对比
       （实底反白字语境；default 面板底 / secondary 淡底的 tone 指示器对比充分不受限） */
    .asc-state-button.asc-d-ripple:has(
        > .asc-button-body[data-variant="primary"]
      )
      .asc-state-check::before {
      background: var(--asc-ink, #fff);
    }
    .asc-state-button.asc-d-ripple:has(
        > .asc-button-body[data-variant="primary"]
      )
      .asc-state-check::after {
      border-color: var(--asc-ink, #fff);
    }
    @keyframes asc-state-check-dot {
      0%,
      100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(0.55);
        opacity: 0.6;
      }
    }
    @keyframes asc-state-check-ring {
      0% {
        transform: scale(0.3);
        opacity: 0.9;
      }
      100% {
        transform: scale(1.25);
        opacity: 0;
      }
    }

    /* ---------- 灰色无匹配态：中性灰覆盖 variant/type（「未处于任何状态」的元语义不属于
         任何形态/语义色表达）；pointer + hover 轻反馈——可点击是硬需求，与 disabled 的
         opacity 0.55 + not-allowed 明确分野 ---------- */
    .asc-state-button.asc-unmatched {
      --asc-bg: transparent;
      --asc-ink: color-mix(
        in srgb,
        var(--auto-color, #606060) 60%,
        transparent
      ) !important;
      --asc-line: color-mix(
        in srgb,
        var(--auto-color, #606060) 40%,
        transparent
      ) !important;
      cursor: pointer;
    }
    .asc-state-button.asc-unmatched:hover:not([disabled]) {
      filter: none;
      background: var(
        --auto-hover-bgcolor,
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))
      );
    }
    /* 暗色兜底（ADR-0129）：灰阶字色走 dark 校准值（--auto-color 暗色下自动反转，
       此处仅兜第三级字面值） */
    [dark] .asc-state-button.asc-unmatched,
    [data-dark] .asc-state-button.asc-unmatched {
      --asc-ink: color-mix(
        in srgb,
        var(--auto-color, #fafafa) 55%,
        transparent
      ) !important;
    }
  </style>
</button>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-state-button`))){let e=document.createElement(`button`),o=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?o.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name===`name`||i.name===`title`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):o.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${o.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.state-button.js.map
