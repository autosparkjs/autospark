(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.state-button`;function a(e){e.components[i]=`<!--\r
    继承骨架 + 机制自治（ADR-0016）：x-define:inherit 复用 autospark.button 的纯按钮\r
    视觉全套（快照克隆，模板/CSS 骨架单份），状态机制全套自持于本组件的 setup 与\r
    styles——button 已取消 checkable 特性，本组件是其承接者（迁移动作见 ADR-0016）。\r
\r
    x-button-options（2026-11-11 泛化，即 <x-button> 的选项集）= **button props 全集**（variant/type/ghost/border/shape/\r
    loading/icon/label/memo/ripple/wrap/... 切态整组注入 data——每态可完全自定义按钮的\r
    渲染与形态）+ 状态机制键（value 状态值 / clickable 出边锁 / decorate 额外装饰 /\r
    tooltip 双轨提示 / style cssText / class 附加类——机制键不走 props 注入通道）。\r
\r
    事件与数据出口：\r
    - change：切换实际发生后冒泡，detail = { value, index, state }（新态三元组）\r
    - 原生 click：恒触发（不派发自定义 click——与原生同名双触发不可接受）；state 数据\r
      经宿主常驻 data-value dataset 反射读取（外层 @click="v = $event.currentTarget.dataset.value"）\r
    - 表单桥：布尔二元组（缺省组即此）内嵌 input[type=checkbox]（el.value 布尔语域，\r
      配 x-model.boolean 保真，未勾选不提交）；其余形态内嵌 input[type=hidden]\r
      （value = String(当前值)、name 透传宿主）；N>2 受控通道 = @change（x-model 对\r
      非布尔组字符串化固有，自担）\r
\r
    装饰渲染（states 项键 decorate，取代 button 旧组件级 checkStyle）：\r
    - solid = tone 实底反白 / icon = 最左 yes 占位 / corner = 右上角越界打勾三角 /\r
      ripple = 最左 CSS 自绘涟漪动画占位（mounted 注入的 DOM 无编译通道，x-icon 不可用，\r
      视觉对齐内置 ripple 图标动效语言）——宿主 class 通道：asc-d-<x> 当前态佩戴、\r
      asc-p-check / asc-p-ripple 组内任一佩戴即常驻占位（防布局跳动）\r
    - 灰色无匹配态（asc-unmatched）：value 不在 states 值域——中性灰覆盖 variant/type、\r
      pointer + hover 可点击（与 disabled 的 opacity+not-allowed 明确分野）\r
-->\r
<!-- 子模板不含覆盖段（裸子节点会被收为默认段替换父 label 出口 fallback）——仅资源节点 -->\r
<button\r
  class="asc-state-button"\r
  x-define="autospark.state-button"\r
  x-define:inherit="autospark.button"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            states: undefined,   // 状态集：x-button-options[] | (number|string)[]——x-button-options = button props 全集（variant/type/ghost/shape/loading/icon/label/ripple... 切态整组注入，每态完全自定义按钮渲染与形态）+ 机制键（value/clickable/decorate/tooltip/style/class）；标量即 {value} 简写、对象缺 value 回退下标；undefined 落缺省组\r
            value: undefined,    // 当前状态值（受控真相，组件不擅改——仅点击翻转/缺省初始化写入）；undefined 缺省初始化为 states[0].value（初始态即首态）\r
            autoswitch: true,    // true：点击自动切下一态（change + 原生 click）；false：纯受控（仅原生 click，切换由外部回写 value）\r
        }),\r
        mounted() {\r
            // —— 归一化（幂等纯函数，不写回 data——写回会触发 watch 自环）——\r
            // undefined/null 落缺省组 [{value:false},{value:true,decorate:'corner'}]（零配置即\r
            // 传统双态 check 按钮）；非数组/空数组 → []（无效状态集，恒无匹配灰、不可切态，静默退化）\r
            const DEFAULT_STATES = [{ value: false }, { value: true, decorate: "corner" }];\r
            const norm = () => {\r
                const raw = this.data.states;\r
                const arr = raw == null ? DEFAULT_STATES : Array.isArray(raw) ? raw : [];\r
                return arr.map((item, i) =>\r
                    typeof item === "object" && item !== null\r
                        ? { ...item, value: Object.hasOwn(item, "value") ? item.value : i }\r
                        : { value: item },\r
                );\r
            };\r
            // 布尔二元组判定（缺省组即此）：checkbox 布尔语域桥的前提（el.value 只取 "true"/"false"，\r
            // 配 x-model.boolean 类型保真——对齐原生 checkbox 语义）；非布尔组不劫持 el.value\r
            const boolPair = (() => {\r
                const l = norm();\r
                return l.length === 2 && l.some((s) => s.value === true) && l.some((s) => s.value === false);\r
            })();\r
            // 值序列化（dataset 反射 / hidden input 共用）：对象 JSON 化、其余 String\r
            const serialize = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));\r
\r
            // button props 键面（态注入的键清单）：**显式清单驱动**——this.data 是挂链数据视图，\r
            // Object.keys 枚举出的是根 state 键（含 $scopes/$ 框架保留键），不能用于枚举组件\r
            // props 面（读穿透组件域可用、枚举不可用）；清单与 button 的 data() 键面一一对应\r
            // （theme 六键不在 data 域、不参与态注入——档位不随态切换）\r
            const BUTTON_PROPS = [\r
                "variant", "type", "label", "labelPos", "icon", "loading", "ghost", "border",\r
                "block", "disabled", "ripple", "autoInsertSpace", "shape", "wrap", "align",\r
                "indent", "memo", "tags", "menu",\r
            ];\r
\r
            // 底值快照（态注入的回退基准）：一跳后 states/value 注入落定，遍历 data 快照\r
            // **全部 button props 键**（排除状态机制 props 与 computed 函数值——displayLabel\r
            // 等不可被态覆盖）+ 宿主原样式；init 前为 null（syncVisual 注入段守卫跳过）\r
            let base = null;\r
            // label 覆盖直写通道：{{ displayLabel }} 是父的 computed（组件域 computed 对后续\r
            // data.label 赋值不重算——仅初始化首求值生效，ADR-0016 实施注记），故态 label\r
            // 变化直写 span 文本；**fallback 特征探测**——初始文本与底值 label 的派生一致\r
            // （含两字插空格）才视为 fallback 在场，插槽内容在场时跳过直写（插槽优先）\r
            let labelSpan = null;\r
            let labelIsFallback = false;\r
            const deriveLabel = (t) =>\r
                this.data.autoInsertSpace && /^[一-龥]{2}$/.test(t ?? "") ? t[0] + " " + t[1] : String(t ?? "");\r
            // 态 class 上次写入（切态摘旧加新，不碰使用者宿主 class）\r
            let prevCls = [];\r
            // 态 tooltip 自挂标记（仅摘自挂的，宿主显式提示永不覆盖）\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
\r
            // —— 表单载体：内嵌隐藏 input（display:none、name 透传宿主）——\r
            const real = document.createElement("input");\r
            real.type = boolPair ? "checkbox" : "hidden";\r
            real.style.display = "none";\r
            const nameAttr = this.el.getAttribute("name");\r
            if (nameAttr != null) real.name = nameAttr;\r
            this.el.appendChild(real);\r
\r
            // —— 全视觉同步（按 data.value 现值求当前态，幂等）——\r
            const syncVisual = () => {\r
                const list = norm();\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                const st = cur ?? {};\r
                // 1. 装饰 class：当前态佩戴 → asc-d-<x>；组内任一佩戴 check/ripple → 常驻占位标记\r
                for (const k of ["asc-d-solid", "asc-d-check", "asc-d-corner", "asc-d-ripple", "asc-p-check", "asc-p-ripple", "asc-unmatched"]) {\r
                    this.el.classList.remove(k);\r
                }\r
                if (typeof st.decorate === "string" && st.decorate) this.el.classList.add("asc-d-" + st.decorate);\r
                if (list.some((s) => s.decorate === "check")) this.el.classList.add("asc-p-check");\r
                if (list.some((s) => s.decorate === "ripple")) this.el.classList.add("asc-p-ripple");\r
                // 1.5 ripple 装饰（2026-11-13 二调）：佩戴视觉 = **宿主整体恒开 echo 双环涟漪**\r
                //     （外扩形态非 inside、无占位指示器）——经 data.ripple 单通道写入（父\r
                //     syncRipple 的 watch 消费挂载，与 ripple prop 注入同一决策点、无双写竞争）：\r
                //     佩戴置 { trigger: "always", inside: false, type: "echo" }（装饰优先于\r
                //     态声明的 ripple 键），未佩戴回退注入循环写入的原值；需页面已加载\r
                //     autospark.ripple.js，未加载时属性无人消费静默\r
                // 2. 灰色无匹配态（无效状态集亦恒无匹配）\r
                this.el.classList.toggle("asc-unmatched", cur === null);\r
                // 3. dataset 反射（外层 @click 读取当前值的通道——原生 click 无 detail）\r
                this.el.setAttribute("data-value", serialize(this.data.value));\r
                // 4. 表单载体同步：布尔组 checkbox 按真值勾选（提交值 = String(true 态 value)）；\r
                //    其余 hidden 恒随提交（value 是受控真相，域外值原样提交）\r
                if (boolPair) {\r
                    real.checked = cur !== null && cur.value === true;\r
                    real.value = String(list.find((s) => s.value === true)?.value ?? true);\r
                } else {\r
                    real.value = serialize(this.data.value);\r
                }\r
                // 5. 态注入（button props 透传，仅当前态生效）：当前态在场的 button props 键\r
                //    （BUTTON_PROPS 清单内）写入 data（触发父模板既有绑定 :data-variant/:data-type/\r
                //    x-icon… 与父 mounted 的 watch（disabled/loading/icon/ripple/label）重算），\r
                //    未声明键回退底值——每态可完全自定义按钮渲染与形态；机制键（clickable/\r
                //    decorate/tooltip/style/class）不在清单天然不注入；label 另走直写通道\r
                //    （displayLabel computed 对后续赋值不重算，见上方注释）\r
                if (base) {\r
                    let rippleInjected;\r
                    for (const k of BUTTON_PROPS) {\r
                        if (k === "ripple") {\r
                            rippleInjected = Object.hasOwn(st, k) ? st[k] : base[k];\r
                            continue;\r
                        }\r
                        this.data[k] = Object.hasOwn(st, k) ? st[k] : base[k];\r
                    }\r
                    // ripple 键延迟写入（注入值先留底，装饰接管决策后一并落）——佩戴 ripple\r
                    // 装饰时恒开 echo 双环优先于态声明的 ripple 配置（1.5 注释的单通道）\r
                    this.data.ripple = this.el.classList.contains("asc-d-ripple")\r
                        ? { trigger: "always", inside: false, type: "echo" }\r
                        : rippleInjected;\r
                }\r
                if (labelSpan && labelIsFallback) labelSpan.textContent = deriveLabel(Object.hasOwn(st, "label") && st.label != null ? st.label : base?.label ?? "");\r
                // 6. 态 style（cssText，对齐 tags.styles 通道）：宿主原样式为基底整写（追加态样式）\r
                this.el.style.cssText = base.cssText + (typeof st.style === "string" && st.style.trim() ? (base.cssText.trim().endsWith(";") || !base.cssText.trim() ? "" : ";") + st.style : "");\r
                // 7. 态 class：摘旧加新（不碰使用者宿主 class）\r
                if (prevCls.length) for (const c of prevCls) this.el.classList.remove(c);\r
                prevCls = typeof st.class === "string" && st.class.trim() ? st.class.trim().split(/\\s+/) : [];\r
                for (const c of prevCls) this.el.classList.add(c);\r
                // 8. 态 tooltip（双轨）：当前态佩戴则挂（无条件挂——优先级高于父的溢出自动提示，\r
                //    ADR-0016 决策 8）；态消失只摘自挂的；宿主显式提示优先（未自挂且在场则不动）\r
                if (st.tooltip != null && String(st.tooltip) !== "") {\r
                    if (!selfTip && this.el.getAttribute(tipAttr)) {\r
                        // 在场的可能是父挂的溢出自动提示（低优先级，覆盖之）或宿主显式提示——\r
                        // 无法可靠区分，按「态佩戴意图明确」覆盖（已知温和竞争，ADR-0016 注记）\r
                    }\r
                    this.el.setAttribute(tipAttr, String(st.tooltip));\r
                    selfTip = true;\r
                } else if (selfTip) {\r
                    this.el.removeAttribute(tipAttr);\r
                    selfTip = false;\r
                }\r
            };\r
\r
            // —— el.value 劫持（布尔组化身 checkbox，x-model 桥）：布尔语域 "true"/"false" ——\r
            // x-model 写 el.value → data.value 落真布尔（默认组与注入组的字符串解释一致，\r
            // props 晚注入时序天然免疫）；非布尔组不劫持（x-model 字符串化固有语义自担）\r
            const proto = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, "value");\r
            if (boolPair) {\r
                Object.defineProperty(this.el, "value", {\r
                    get: () => proto.get.call(this.el),\r
                    set: (v) => {\r
                        proto.set.call(this.el, v);\r
                        this.data.value = v === "true";\r
                        setTimeout(syncVisual, 0);\r
                    },\r
                    configurable: true,\r
                });\r
            }\r
\r
            // —— 点击切换（循环 next + 四重判定链，ADR-0016 决策 4/5/6）——\r
            // 生效条件：autoswitch !== false && 当前态 clickable !== false && !disabled && !loading\r
            // （disabled 由原生 button 物理拦截 click，无需判）；命中 states[i] → states[(i+1)%N]\r
            // （无匹配 → states[0]），写 value + syncVisual 后派发 change（新态三元组）；\r
            // 布尔组另派发 input（x-model 回写监听在宿主自身）\r
            this.el.addEventListener("click", () => {\r
                if (this.el.disabled || this.data.autoswitch === false) return;\r
                const list = norm();\r
                if (list.length < 2) return; // 无效状态集：不可切态\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                if (cur && cur.clickable === false) return; // 出边锁：该态点击零效果\r
                const index = cur ? (list.indexOf(cur) + 1) % list.length : 0;\r
                const next = list[index];\r
                this.data.value = next.value;\r
                syncVisual();\r
                // 布尔组：写底层 el.value（布尔语域）后派发 input——x-model 监听在宿主自身，\r
                // 读 el.value 回写 state（配 .boolean 类型保真）\r
                if (boolPair) {\r
                    proto.set.call(this.el, String(next.value === true));\r
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                }\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next.value, index, state: next } }));\r
            });\r
\r
            // —— corner 按压预览（下一态佩戴 corner 时预显描边——松手切换正式化）——\r
            const previewCorner = (on) => {\r
                this.el.classList.toggle("asc-corner-preview", on);\r
            };\r
            this.el.addEventListener("pointerdown", () => {\r
                if (this.el.disabled || this.data.autoswitch === false) return;\r
                const list = norm();\r
                if (list.length < 2) return;\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                if (cur && cur.clickable === false) return;\r
                const next = cur ? list[(list.indexOf(cur) + 1) % list.length] : list[0];\r
                previewCorner(next?.decorate === "corner");\r
            });\r
            this.el.addEventListener("pointerup", () => previewCorner(false));\r
            this.el.addEventListener("pointerleave", () => previewCorner(false));\r
            this.el.addEventListener("pointercancel", () => previewCorner(false));\r
\r
            // —— 一跳后初始化：states/value 注入落定 → 缺省 value = states[0].value、底值快照、\r
            // 首次视觉同步（mounted 时化身子树与 props 均可能未就位，家族惯用法）——\r
            setTimeout(() => {\r
                const list = norm();\r
                // 重对齐（布尔组）：底层 el.value（x-model 编译期已写，布尔语域）优先于缺省初始化\r
                if (boolPair) {\r
                    const raw = proto.get.call(this.el);\r
                    if (raw === "true") this.data.value = true;\r
                    else if (raw === "false") this.data.value = false;\r
                }\r
                if (this.data.value === undefined && list.length > 0) this.data.value = list[0].value;\r
                base = { cssText: this.el.style.cssText };\r
                for (const k of BUTTON_PROPS) base[k] = this.data[k];\r
                // label 直写通道探测：首帧插值已完成（显示底值 label 派生），特征匹配即许可直写\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (span && span.textContent === deriveLabel(base.label)) {\r
                    labelSpan = span;\r
                    labelIsFallback = true;\r
                }\r
                syncVisual();\r
            }, 0);\r
            // 受控通道：外部改 value → 视觉跟随（states 替换同理重对齐——value 不在新值域时\r
            // 保持无匹配回灰，value 是受控真相不被擅改）\r
            this.watch("value", () => { syncVisual(); });\r
            this.watch("states", () => { setTimeout(syncVisual, 0); });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-state-button">\r
    /* ---------- 装饰 solid：当前态佩戴 = tone 实底 + 反白字（覆盖 variant 表达；!important\r
         压过 :has 变体规则族——继承拼接的父样式在前，级联后者胜 + important 双保险） ---------- */\r
    .asc-state-button.asc-d-solid {\r
      --asc-bg: var(--asc-tone) !important;\r
      --asc-ink: #fff !important;\r
      --asc-line: transparent !important;\r
    }\r
\r
    /* ---------- 装饰 check：组内任一态佩戴（asc-p-check）即 body 最前常驻 1.2em 占位\r
         （未佩戴态留空、零布局跳动）；当前态佩戴（asc-d-check）显 tone 色 yes ---------- */\r
    .asc-state-button.asc-p-check > .asc-button-body::before {\r
      content: "";\r
      flex: none;\r
      width: 1.2em;\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      color: var(--asc-tone);\r
      font-size: 0.9em;\r
      font-weight: bold;\r
    }\r
    .asc-state-button.asc-d-check > .asc-button-body::before {\r
      content: "✓";\r
    }\r
\r
    /* ---------- 装饰 corner：当前态佩戴 = tone 外描边 + 右上角 tone 小三角内嵌反白小勾 ---------- */\r
    /* 三角 = 渐变盒（对角线分割、右上半着色）；尺寸 = min(圆角半径 ×2.5, 2.5em, 按钮高 50%)\r
         ——高度基准 + aspect-ratio 方形推导，圆角档位切换自动跟随；外描边走 box-shadow（视觉\r
         等价 outline、跟随圆角、绘制路径独立，不受涟漪载体播放期色块遮挡）。**无缝贴合**：\r
         描边画在 border 外缘、absolute 定位基准是 padding box（border 内缘）——border 消隐\r
         （--asc-line: transparent，占位保留零布局影响）、三角 -2px 跨过 1px border 区直抵\r
         描边内缘（三角与描边零间隙） */\r
    .asc-state-button.asc-d-corner {\r
      --asc-corner: min(\r
        calc(var(--auto-border-radius, 0.5rem) * 2.5),\r
        2.5em,\r
        50%\r
      );\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone);\r
      position: relative; /* 三角/描边定位上下文（x-ripple 载体另有 relative 兜底，此处显式自持） */\r
    }\r
    .asc-state-button.asc-d-corner::after {\r
      content: "";\r
      position: absolute;\r
      top: -2px;\r
      right: -2px;\r
      height: calc(var(--asc-corner) + 2px);\r
      aspect-ratio: 1 / 1;\r
      border-top-right-radius: min(\r
        calc(var(--auto-border-radius, 0.5rem) + 1px),\r
        1.4em\r
      );\r
      background: linear-gradient(\r
        to bottom left,\r
        var(--asc-tone) 49.5%,\r
        transparent 50%\r
      );\r
      z-index: 1;\r
    }\r
    /* 反白小勾：定位于三角重心（对角线中点向直角方向）——系数基准同 --asc-corner（含 50%\r
         高度上限同步缩放），-2px 补偿三角盒越出量，确保落在三角内部 */\r
    .asc-state-button.asc-d-corner::before {\r
      content: "";\r
      position: absolute;\r
      top: calc(var(--asc-corner) * 0.24 - 2px);\r
      right: calc(var(--asc-corner) * 0.14 - 2px);\r
      z-index: 2;\r
      width: calc(var(--asc-corner) * 0.36);\r
      aspect-ratio: 2 / 1;\r
      border-left: 1.5px solid var(--auto-bgcolor, #fff);\r
      border-bottom: 1.5px solid var(--auto-bgcolor, #fff);\r
      transform: rotate(-45deg);\r
    }\r
    /* 按压预览：下一态佩戴 corner 时 JS 挂 asc-corner-preview 预显描边（松手切换正式化、\r
         按住拖出取消随按压消失——化解「松手才见描边」迟滞感；当前已佩戴则本体描边在场不重复） */\r
    /* border 同步消隐防预览描边与 border 间的 1px 间隙（同佩戴态无缝口径） */\r
    .asc-state-button.asc-corner-preview:not(.asc-d-corner) {\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone);\r
    }\r
\r
    /* ---------- 装饰 ripple：佩戴视觉 = 宿主整体恒开 echo 双环涟漪（mounted 经 data.ripple\r
         单通道由父 syncRipple 挂载 { trigger: "always", inside: false, type: "echo" }——\r
         需页面加载 autospark.ripple.js，未加载静默无指示）；无占位指示器 ---------- */\r
\r
    /* ---------- 灰色无匹配态：中性灰覆盖 variant/type（「未处于任何状态」的元语义不属于\r
         任何形态/语义色表达）；pointer + hover 轻反馈——可点击是硬需求，与 disabled 的\r
         opacity 0.55 + not-allowed 明确分野 ---------- */\r
    .asc-state-button.asc-unmatched {\r
      --asc-bg: transparent;\r
      --asc-ink: color-mix(\r
        in srgb,\r
        var(--auto-color, #606060) 60%,\r
        transparent\r
      ) !important;\r
      --asc-line: color-mix(\r
        in srgb,\r
        var(--auto-color, #606060) 40%,\r
        transparent\r
      ) !important;\r
      cursor: pointer;\r
    }\r
    .asc-state-button.asc-unmatched:hover:not([disabled]) {\r
      filter: none;\r
      background: var(\r
        --auto-hover-bgcolor,\r
        var(--asc-button-hover-bg, rgba(0, 0, 0, 0.05))\r
      );\r
    }\r
    /* 暗色兜底（ADR-0129）：灰阶字色走 dark 校准值（--auto-color 暗色下自动反转，\r
       此处仅兜第三级字面值） */\r
    [dark] .asc-state-button.asc-unmatched,\r
    [data-dark] .asc-state-button.asc-unmatched {\r
      --asc-ink: color-mix(\r
        in srgb,\r
        var(--auto-color, #fafafa) 55%,\r
        transparent\r
      ) !important;\r
    }\r
  </style>\r
</button>\r
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
