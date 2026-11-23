(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.state-button`;function a(e){e.components[i]=`<button\r
  class="asc-state-button"\r
  x-define="autospark.state-button"\r
  x-define:inherit="autospark.button"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            states: undefined,
            value: undefined,
            autoswitch: true,
        }),\r
        mounted() {\r
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
            const boolPair = (() => {\r
                const l = norm();\r
                return l.length === 2 && l.some((s) => s.value === true) && l.some((s) => s.value === false);\r
            })();\r
            const serialize = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));\r
\r
            const BUTTON_PROPS = [\r
                "variant", "type", "label", "labelPos", "icon", "loading", "ghost", "border",\r
                "block", "disabled", "ripple", "autoInsertSpace", "shape", "wrap", "align",\r
                "indent", "memo", "tags", "menu",\r
            ];\r
\r
            let base = null;\r
            let labelSpan = null;\r
            let labelIsFallback = false;\r
            const deriveLabel = (t) =>\r
                this.data.autoInsertSpace && /^[一-龥]{2}$/.test(t ?? "") ? t[0] + " " + t[1] : String(t ?? "");\r
            let prevCls = [];\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
\r
            const real = document.createElement("input");\r
            real.type = boolPair ? "checkbox" : "hidden";\r
            real.style.display = "none";\r
            const nameAttr = this.el.getAttribute("name");\r
            if (nameAttr != null) real.name = nameAttr;\r
            this.el.appendChild(real);\r
\r
            const syncVisual = () => {\r
                const list = norm();\r
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                const st = cur ?? {};\r
                for (const k of ["asc-d-solid", "asc-d-check", "asc-d-corner", "asc-d-ripple", "asc-p-check", "asc-p-ripple", "asc-unmatched"]) {\r
                    this.el.classList.remove(k);\r
                }\r
                if (typeof st.decorate === "string" && st.decorate) this.el.classList.add("asc-d-" + st.decorate);\r
                if (list.some((s) => s.decorate === "check")) this.el.classList.add("asc-p-check");\r
                if (list.some((s) => s.decorate === "ripple")) this.el.classList.add("asc-p-ripple");\r
                this.el.classList.toggle("asc-unmatched", cur === null);\r
                this.el.setAttribute("data-value", serialize(this.data.value));\r
                if (boolPair) {\r
                    real.checked = cur !== null && cur.value === true;\r
                    real.value = String(list.find((s) => s.value === true)?.value ?? true);\r
                } else {\r
                    real.value = serialize(this.data.value);\r
                }\r
                if (base) {\r
                    let rippleInjected;\r
                    for (const k of BUTTON_PROPS) {\r
                        if (k === "ripple") {\r
                            rippleInjected = Object.hasOwn(st, k) ? st[k] : base[k];\r
                            continue;\r
                        }\r
                        this.data[k] = Object.hasOwn(st, k) ? st[k] : base[k];\r
                    }\r
                    this.data.ripple = this.el.classList.contains("asc-d-ripple")\r
                        ? { trigger: "always", inside: false, type: "echo" }\r
                        : rippleInjected;\r
                }\r
                if (labelSpan && labelIsFallback) labelSpan.textContent = deriveLabel(Object.hasOwn(st, "label") && st.label != null ? st.label : base?.label ?? "");\r
                this.el.style.cssText = base.cssText + (typeof st.style === "string" && st.style.trim() ? (base.cssText.trim().endsWith(";") || !base.cssText.trim() ? "" : ";") + st.style : "");\r
                if (prevCls.length) for (const c of prevCls) this.el.classList.remove(c);\r
                prevCls = typeof st.class === "string" && st.class.trim() ? st.class.trim().split(/\\s+/) : [];\r
                for (const c of prevCls) this.el.classList.add(c);\r
                if (st.tooltip != null && String(st.tooltip) !== "") {\r
                    if (!selfTip && this.el.getAttribute(tipAttr)) {\r
                    }\r
                    this.el.setAttribute(tipAttr, String(st.tooltip));\r
                    selfTip = true;\r
                } else if (selfTip) {\r
                    this.el.removeAttribute(tipAttr);\r
                    selfTip = false;\r
                }\r
            };\r
\r
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
            this.el.addEventListener("click", () => {\r
                if (this.el.disabled || this.data.autoswitch === false) return;\r
                const list = norm();\r
                if (list.length < 2) return;
                const cur = list.find((s) => s.value === this.data.value) ?? null;\r
                if (cur && cur.clickable === false) return;
                const index = cur ? (list.indexOf(cur) + 1) % list.length : 0;\r
                const next = list[index];\r
                this.data.value = next.value;\r
                syncVisual();\r
                if (boolPair) {\r
                    proto.set.call(this.el, String(next.value === true));\r
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                }\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next.value, index, state: next } }));\r
            });\r
\r
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
            setTimeout(() => {\r
                const list = norm();\r
                if (boolPair) {\r
                    const raw = proto.get.call(this.el);\r
                    if (raw === "true") this.data.value = true;\r
                    else if (raw === "false") this.data.value = false;\r
                }\r
                if (this.data.value === undefined && list.length > 0) this.data.value = list[0].value;\r
                base = { cssText: this.el.style.cssText };\r
                for (const k of BUTTON_PROPS) base[k] = this.data[k];\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (span && span.textContent === deriveLabel(base.label)) {\r
                    labelSpan = span;\r
                    labelIsFallback = true;\r
                }\r
                syncVisual();\r
            }, 0);\r
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
      position: relative;
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
