(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.button`;function a(e){e.components[i]=`<button\r
  class="asc-button"\r
  x-define="autospark.button"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            variant: "default",\r
            type: "primary",\r
            label: "按钮",\r
            labelPos: "right",\r
            icon: "",\r
            loading: false,\r
            ghost: false,\r
            border: false,\r
            block: false,\r
            disabled: false,\r
            ripple: true,\r
            autoInsertSpace: true,\r
            shape: "default",\r
            wrap: false,\r
            align: "center",\r
            indent: 0,\r
            memo: "",\r
            tags: [],\r
            caret: "none",\r
            menu: false,\r
            checkable: false,\r
            value: false,\r
            checkValues: [true, false],\r
            checkStyle: "corner",\r
            checkMark: false,\r
            state: null,\r
            collapsed: false,\r
            hideTags: false,\r
            // floatCaret 值域：false（缺省，不浮动）| 'top' | 'center' | 'bottom'（浮动垂直档位，\r
            // 裸布尔 true 归一为 'center'——绑定通道统一产出三档字符串或 null）\r
            floatCaret: false,\r
            states: null,\r
            displayLabel: (s) => (s.autoInsertSpace && /^[一-龥]{2}$/.test(s.label ?? "")) ? (s.label[0] + " " + s.label[1]) : s.label\r
        }),\r
        methods: {\r
            tagCheckValues(tag) {\r
                return [tag.checkValues?.[0] ?? true, tag.checkValues?.[1] ?? false];\r
            },\r
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
            const syncDisabled = () => { this.el.disabled = !!this.data.disabled || !!this.data.loading; };\r
            syncDisabled();\r
            this.watch("disabled", ({ value }) => { syncDisabled(); });\r
            this.watch("loading", ({ value }) => { syncDisabled(); });\r
\r
            const syncIconBadge = () => {\r
                const i = this.data.icon;\r
                const span = this.el.querySelector(".asc-button-icon");\r
                if (!span) return;\r
                const hadPad = span.classList.contains("asc-button-icon-badge-pad");\r
                span.classList.remove("asc-button-icon-badge", "asc-button-icon-badge-pad");\r
                if (hadPad && (typeof i !== "object" || !i || i.padding == null || i.padding === "")) {\r
                    span.style.removeProperty("padding");\r
                }\r
                if (typeof i !== "object" || !i) return;\r
                const badge = i.badge;\r
                const on = badge === true\r
                    || typeof badge === "number"\r
                    || (typeof badge === "string" && badge.trim() !== "");\r
                if (!on) return;\r
                span.classList.add("asc-button-icon-badge");\r
                if (typeof badge === "number") {\r
                    span.style.padding = badge + "px";\r
                    span.classList.add("asc-button-icon-badge-pad");\r
                } else if (typeof badge === "string") {\r
                    span.style.padding = badge;\r
                    span.classList.add("asc-button-icon-badge-pad");\r
                }\r
            };\r
            setTimeout(syncIconBadge, 0);\r
            this.watch("icon", () => { setTimeout(syncIconBadge, 0); });\r
\r
            const tipAttr = this.engine?.tooltip?.enabled ? "data-tooltip" : "title";\r
            let selfTip = false;\r
            const syncTip = () => {\r
                if (this.data.labelPos === "none") {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return;\r
                    this.el.setAttribute(tipAttr, String(this.data.label ?? ""));\r
                    selfTip = true;\r
                    return;\r
                }\r
                const span = this.el.querySelector(".asc-button-label");\r
                if (!span) return;\r
                if (span.scrollWidth > span.clientWidth) {\r
                    if (this.el.getAttribute(tipAttr) && !selfTip) return;\r
                    this.el.setAttribute(tipAttr, span.textContent);\r
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
            if (!this.data.checkable && this.data.checkMark) {\r
                this.el.classList.add("asc-check-" + (this.data.checkStyle || "check"));\r
                this.watch("checkStyle", ({ value: s }) => {\r
                    for (const k of ["solid", "check", "corner", "ripple"]) this.el.classList.remove("asc-check-" + k);\r
                    this.el.classList.add("asc-check-" + (s || "check"));\r
                });\r
            }\r
\r
            if (this.data.checkable) {\r
                this.el.classList.add("asc-check-" + this.data.checkStyle);\r
                const proto = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, "value");\r
                const real = document.createElement("input");\r
                real.type = "checkbox";\r
                real.style.display = "none";\r
                const vals = () => this.data.checkValues;\r
                const nameAttr = this.el.getAttribute("name");\r
                if (nameAttr != null) real.name = nameAttr;\r
                this.el.appendChild(real);\r
                let rippleBase = this.data.ripple;\r
                const applyChecked = (on) => {\r
                    const [onV, offV] = vals();\r
                    this.data.value = on ? onV : offV;\r
                    real.checked = !!on;\r
                    this.el.classList.toggle("asc-checked", !!on);\r
                    if (this.data.checkStyle === "ripple") {\r
                        this.data.ripple = on ? { trigger: "always", inside: false, type: "echo" } : rippleBase;\r
                    }\r
                };\r
                Object.defineProperty(this.el, "value", {\r
                    get: () => proto.get.call(this.el),\r
                    set: (v) => { proto.set.call(this.el, v); applyChecked(v === "true"); },\r
                    configurable: true,\r
                });\r
                const resync = () => {\r
                    real.value = String(vals()[0]);\r
                    const raw = proto.get.call(this.el);\r
                    if (raw === "true") applyChecked(true);\r
                    else if (raw === "false") applyChecked(false);\r
                    else if (this.data.value === vals()[0]) applyChecked(true);\r
                    else if (this.data.value === vals()[1]) applyChecked(false);\r
                };\r
                setTimeout(resync, 0);\r
                this.watch("checkValues", () => { setTimeout(resync, 0); });\r
                this.watch("checkStyle", ({ value: s }) => {\r
                    for (const k of ["solid", "check", "corner", "ripple"]) this.el.classList.remove("asc-check-" + k);\r
                    this.el.classList.add("asc-check-" + s);\r
                });\r
                this.watch("value", ({ value: v }) => {\r
                    if (v === vals()[0] || v === vals()[1]) resync();\r
                });\r
                this.el.addEventListener("click", () => {\r
                    if (!this.data.checkable || this.el.disabled) return;\r
                    const [onVal, offVal] = vals();\r
                    const next = this.data.value === onVal ? offVal : onVal;\r
                    this.el.value = String(next === onVal);\r
                    this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                    this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));\r
                });\r
            }\r
\r
            let rippleMountTimer = 0;\r
            const syncRipple = () => {\r
                const conf = this.data.ripple;\r
                clearTimeout(rippleMountTimer);\r
                this.el.removeAttribute("x-ripple");\r
                this.el.removeAttribute("x-ripple-options");\r
                if (conf) {\r
                    this.el.setAttribute("x-ripple-options", JSON.stringify(typeof conf === "object" ? { trigger: "click", inside: true, ...conf } : { trigger: "click", inside: true }));\r
                    rippleMountTimer = setTimeout(() => this.el.setAttribute("x-ripple", ""), 0);\r
                }\r
            };\r
            syncRipple();\r
            this.watch("ripple", () => { syncRipple(); });\r
\r
            // ---------- 命名状态覆盖（state/states + collapsed 快捷糖，2026-11-22 共识） ----------\r
            // state（激活键，唯一真相）命中 states 表时，该键的 props 覆盖集整组 assign 进 data\r
            // 接管按钮渲染；切走时按快照守卫还原（激活期间被外部改过的键外部值赢）。\r
            // collapsed 是 state 的快捷写入糖：true ≡ state='collapsed'、false ≡ state=null。\r
            // menu:false——折叠图标条时退出菜单形态（占满宽/左对齐解除，按钮收缩到内容宽），\r
            // 宽度收窄归消费方 data-state CSS（零几何内建不变）\r
            const BUILTIN_COLLAPSED = { labelPos: "none", indent: 0, hideTags: true, menu: false };\r
            const isOverrideMap = (v) => v != null && typeof v === "object" && !Array.isArray(v);\r
            // 双层合并：表与内置 collapsed 预设浅合并，用户 collapsed 键再与预设浅合并（部分定制\r
            // 保留默认形态），其余自定义键所见即所得（值对象整体生效、未写的键不碰）。\r
            // states 非纯对象（state-button 继承场景的数组）时机制整体静默跳过。\r
            const resolveStates = () => {\r
                const user = this.data.states;\r
                if (user == null) return { collapsed: { ...BUILTIN_COLLAPSED } };\r
                if (!isOverrideMap(user)) return null;\r
                const merged = Object.assign({ collapsed: { ...BUILTIN_COLLAPSED } }, user);\r
                if (user.collapsed != null && isOverrideMap(user.collapsed)) {\r
                    merged.collapsed = Object.assign({ ...BUILTIN_COLLAPSED }, user.collapsed);\r
                }\r
                return merged;\r
            };\r
            let stateSnap = null; // { key, recs: { 键: { orig, applied } } }\r
            const warnedStateKeys = new Set();\r
            const revertState = () => {\r
                if (!stateSnap) return;\r
                for (const [k, rec] of Object.entries(stateSnap.recs)) {\r
                    // 守卫：仅还原「当前值仍严格等于激活时写入值」的键——被外部改过的保持外部值\r
                    if (this.data[k] === rec.applied) this.data[k] = rec.orig;\r
                }\r
                this.el.removeAttribute("data-state");\r
                stateSnap = null;\r
            };\r
            const applyState = (key) => {\r
                const table = resolveStates();\r
                const overrides = table == null ? undefined : table[key];\r
                revertState();\r
                if (table == null) return; // states 非纯对象（数组等，state-button 继承语境）：机制整体静默跳过\r
                if (!isOverrideMap(overrides)) {\r
                    // null/''/undefined = 合法取消（静默恢复）；非空字符串不在表 = miss，warn 一次\r
                    if (typeof key === "string" && key !== "" && !warnedStateKeys.has(key)) {\r
                        warnedStateKeys.add(key);\r
                        console.warn(\`[autospark.button] state="\${key}" 不在 states 表中，已按无状态渲染\`);\r
                    }\r
                    return;\r
                }\r
                const recs = {};\r
                for (const [k, v] of Object.entries(overrides)) {\r
                    recs[k] = { orig: this.data[k], applied: v };\r
                    this.data[k] = v;\r
                }\r
                stateSnap = { key, recs };\r
                this.el.setAttribute("data-state", key);\r
            };\r
            // 初始快捷方式：state 显式声明（非空）赢、collapsed 忽略；否则 collapsed=true 初始化折叠键\r
            if ((this.data.state == null || this.data.state === "") && this.data.collapsed) {\r
                this.data.state = "collapsed";\r
            }\r
            // 初始 apply 走微任务：i18n 插件在场时其 $.ready 换血（构造末尾 scope.refresh 重跑\r
            // 值闭包）会整组重注入 props，把 mounted 同步覆盖的、外部 props 显式声明的键冲回\r
            // 外部值——微任务化使覆盖稳定发生在换血之后；运行时切换走 watch 同步 apply 不受影响\r
            queueMicrotask(() => { applyState(this.data.state ?? null); });\r
            this.watch("state", ({ value }) => { applyState(value ?? null); });\r
            // 激活期间 states 表替换：用新表重放当前键（revert 旧覆盖集 + apply 新覆盖集；\r
            // 键从新表消失走 miss 口径——warn 一次 + 恢复常态）\r
            this.watch("states", () => { if (stateSnap) applyState(stateSnap.key); });\r
            // collapsed 运行时翻转恒写 state（最近操作赢）；值未变的首跑（若有）跳过，\r
            // 保住上方「初始 state 显式声明赢」的优先级\r
            let lastCollapsed = !!this.data.collapsed;\r
            this.watch("collapsed", ({ value }) => {\r
                const on = !!value;\r
                if (on === lastCollapsed) return;\r
                lastCollapsed = on;\r
                this.data.state = on ? "collapsed" : null;\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-button">\r
    .asc-button {\r
      --asc-tone: var(\r
        --auto-primary-color,\r
        var(--asc-button-primary, #009aff)\r
      );\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      --asc-line: transparent;\r
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
    .asc-button:has(> .asc-button-body[data-variant="secondary"]) {\r
      --asc-bg: var(\r
        --auto-secondary-bgcolor,\r
        var(--asc-button-bg, rgba(245, 245, 245, 0.45))\r
      );\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="dashed"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
      border-style: dashed;\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="text"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--auto-color, var(--asc-button-color, #606060));\r
      padding: calc(var(--asc-pad) * 0.55) calc(var(--asc-pad) * 0.6);\r
    }\r
    .asc-button:has(> .asc-button-body[data-variant="link"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      padding: 0;\r
    }\r
\r
    .asc-button:has(> .asc-button-body[data-ghost="true"]) {\r
      --asc-bg: transparent;\r
      --asc-ink: var(--asc-tone);\r
      --asc-line: var(--asc-tone);\r
    }\r
\r
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
    /* ---------- 勾选渲染（checkable / checkStyle 四值，2026-11-13 回归——ADR-0016 修订记：\r
       decorate 四值渲染下沉为组件级 checkStyle）。指示色统一 --asc-tone（theme 主色，type\r
       非默认时语义色）；宿主 class 驱动（.asc-checked 勾选态 + .asc-check-<style> 静态形态类\r
       ——Chromium :active 粘滞期间 :has(属性变化) 不重算，class 是强失效信号） ---------- */\r
    .asc-button.asc-checked.asc-check-solid {\r
      --asc-bg: var(--asc-tone) !important;\r
      --asc-ink: #fff !important;\r
      --asc-line: transparent !important;\r
    }\r
    .asc-button.asc-check-check > .asc-button-body::before {\r
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
    /* asc-marked：外部 class 驱动的勾选显影（checkMark 占位列的勾选态，menu v2 写入——\r
       不走 checkable 行为桥，避免与宿主组件的点击处理双写） */\r
    .asc-button.asc-checked.asc-check-check > .asc-button-body::before,\r
    .asc-button.asc-marked.asc-check-check > .asc-button-body::before {\r
      content: "✓";\r
    }\r
    /* corner：勾选 = tone 外描边（box-shadow，视觉等价 outline 且跟随圆角）+ 右上角 tone 小三角\r
         （渐变盒对角线分割）内嵌反白小勾；尺寸 = min(圆角 ×2.5, 2.5em, 高 50%) 随圆角档位与\r
         按钮高度自适应。**无缝贴合**：描边画在 border 外缘，而 absolute 定位基准是 padding\r
         box（border 内缘）——故 border 消隐（--asc-line: transparent，占位保留零布局影响）、\r
         三角 -2px 跨过 1px border 区直抵描边内缘（三角与描边零间隙） */\r
    .asc-button.asc-checked.asc-check-corner {\r
      --asc-corner: min(\r
        calc(var(--auto-border-radius, 0.5rem) * 2.5),\r
        2.5em,\r
        50%\r
      ) !important;\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone) !important;\r
      position: relative !important;\r
    }\r
    .asc-button.asc-checked.asc-check-corner::after {\r
      content: "" !important;\r
      position: absolute !important;\r
      top: -2px !important;\r
      right: -2px !important;\r
      height: calc(var(--asc-corner) + 2px) !important;\r
      aspect-ratio: 1 / 1 !important;\r
      border-top-right-radius: min(\r
        calc(var(--auto-border-radius, 0.5rem) + 1px),\r
        1.4em\r
      );\r
      background: linear-gradient(\r
        to bottom left,\r
        var(--asc-tone) 49.5%,\r
        transparent 50%\r
      );\r
      z-index: 1 !important;\r
    }\r
    .asc-button.asc-checked.asc-check-corner::before {\r
      content: "" !important;\r
      position: absolute !important;\r
      top: calc(var(--asc-corner) * 0.24 - 2px) !important;\r
      right: calc(var(--asc-corner) * 0.14 - 2px) !important;\r
      z-index: 2 !important;\r
      width: calc(var(--asc-corner) * 0.36) !important;\r
      aspect-ratio: 2 / 1 !important;\r
      border-left: 1.5px solid var(--auto-bgcolor, #fff) !important;\r
      border-bottom: 1.5px solid var(--auto-bgcolor, #fff) !important;\r
      transform: rotate(-45deg) !important;\r
    }\r
    /* 按压预览（corner）：未勾选按压即预显描边——松手勾选正式化、按住拖出取消随按压消失；\r
         border 同步消隐防预览描边与 border 间的 1px 间隙（同勾选态无缝口径） */\r
    .asc-button.asc-check-corner:active:not([disabled]):not(.asc-checked) {\r
      --asc-line: transparent !important;\r
      box-shadow: 0 0 0 1px var(--asc-tone) !important;\r
    }\r
    /* ripple：勾选视觉 = 宿主整体恒开 echo 双环涟漪（mounted 经 data.ripple 单通道由父\r
       syncRipple 挂载 { trigger: "always", inside: false, type: "echo" }——需页面加载\r
       autospark.ripple.js，未加载静默无指示）；无占位指示器、背景维持原 variant */\r
\r
    .asc-button:has(> .asc-button-body[data-shape="circle"]) {\r
      border-radius: 9999px;\r
      padding: calc(var(--asc-pad) * 0.55);\r
    }\r
\r
    .asc-button:has(> .asc-button-body[data-block="true"]) {\r
      display: flex;\r
      width: 100%;\r
    }\r
\r
    .asc-button:hover:not([disabled]) {\r
      filter: brightness(0.96);\r
    }\r
    .asc-button:active:not([disabled]) {\r
      filter: brightness(0.9);\r
    }\r
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
    .asc-button:has(> .asc-button-body[data-loading="true"]) {\r
      opacity: 1;\r
      cursor: progress;\r
    }\r
\r
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
    }\r
    .asc-button-body[data-label-pos="top"],\r
    .asc-button-body[data-label-pos="bottom"] {\r
      flex-direction: column;\r
      gap: 0.15em;\r
    }\r
    .asc-button-body[data-label-pos="top"] .asc-button-icon {\r
      order: 2;\r
    }\r
    /* 图标放大内建 1.5×（ADR-0138，2026-11-16 修订：memo 并入统一倍率）：纵排（top/bottom）\r
         或 memo 在场即放大，倍率乘在 --auto-icon-size 上（width/height 覆盖载体，theme 档位\r
         绝对值与 1em 回落两态一致生效——font-size 载体在 theme 在场时撑不动绝对宽高，勿用；\r
         svg 恒 100% 撑满宿主自动跟随）；loading 位同容器天然吃内建 1.5×；caret / tag 独立\r
         容器不命中；显式 size / size×scale 乘积走 x-icon 内联恒压本规则（显式即接管） */\r
    .asc-button-body[data-label-pos="top"] .asc-button-icon.as-icon,\r
    .asc-button-body[data-label-pos="bottom"] .asc-button-icon.as-icon,\r
    .asc-button:has(.asc-button-memo) .asc-button-icon.as-icon {\r
      width: calc(var(--auto-icon-size, 1em) * 1.5);\r
      height: calc(var(--auto-icon-size, 1em) * 1.5);\r
    }\r
\r
    .asc-button-icon {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
    }\r
    /* labelPos left：图标（含 loading 位）移 main 之后即按钮内容右端（2026-11-22 布局\r
         调整：tags/caret 已入标签行随 main，原先「与 tags 互换」的 order 协同不再成立）；\r
         横排 = 右侧、纵排 = 下方 */\r
    .asc-button-body[data-label-pos="left"] .asc-button-icon {\r
      order: 5;\r
    }\r
    /* 图标角标（icon.badge 标量三形态启用）：板 padding 承载留白（缺省 2px，可被显式\r
         badge 数值/字符串或 x-icon 的 padding 选项内联覆盖），伪元素红点取 danger 语义色 */\r
    .asc-button-icon-badge {\r
      position: relative;\r
      padding: 2px;\r
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
    .asc-button-main {\r
      display: flex;\r
      flex-direction: column;\r
      /* stretch + 占满 body 主轴剩余：行容器（line）满宽——tags/caret 的 auto margin\r
         才能贴到按钮右缘；body 的 justify（内容组对齐）随之让位给 line 的行内 justify */\r
      align-items: stretch;\r
      flex: 1 1 auto;\r
      min-width: 0;\r
    }\r
    /* 标签行：label + tags + caret 恒同一行，memo 独占次行（2026-11-22 布局调整）——\r
         对齐（align / menu 左对齐）派生为行内 justify：tags/caret 的 auto margin 优先于\r
         justify，贴右不受对齐影响（无 tags/caret 时 label 按对齐落位） */\r
    .asc-button-line {\r
      display: flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.4em;\r
      min-width: 0;\r
    }\r
    .asc-button-body[data-align="left"] .asc-button-line,\r
    .asc-button-body[data-menu="true"] .asc-button-line {\r
      justify-content: flex-start;\r
    }\r
    .asc-button-body[data-align="right"] .asc-button-line {\r
      justify-content: flex-end;\r
    }\r
    /* label 单行截断（wrap 默认 false，ADR-0012 补记）：溢出显示省略号——截断只在按钮\r
         宽度受约束时发生（block / menu / 容器挤压；inline-flex 收缩到内容宽永不触发）；\r
         max-width 钳制 + 行内 min-width:0（flex item 默认 min-width:auto 不可收缩）是\r
         关键——nowrap 下 min-content 涨至全文宽，无钳制会被 min-content 抬出可用宽\r
         （截断失效）；截断发生时由 mounted 静态检测自动挂 title；wrap=true 回折行\r
         （按钮高度随行数增长，显式声明才换行，防布局被意外撑开） */\r
    .asc-button-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      white-space: nowrap;\r
      max-width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-button-body[data-wrap="true"] .asc-button-label {\r
      white-space: normal;\r
    }\r
    /* 空内容不占位：纯图标用法（label 空）或 labelPos=none 时，行内无可承载体（无可见\r
         label、无 tags、无 caret）且无 memo 则 main 整体隐藏，消除 body gap/行高占位；\r
         tags/caret 在场则保留（labelPos=none 折叠图标条 + 箭头/小圆钮是合法形态）；\r
         插槽有内容时出口非空不命中，不受影响 */\r
    .asc-button-label:empty {\r
      display: none;\r
    }\r
    .asc-button-body:not([data-label-pos="none"])\r
      .asc-button-main:has(> .asc-button-line > .asc-button-label:empty):not(\r
        :has(.asc-button-memo)\r
      ):not(:has(.asc-button-tags)):not(:has(.asc-button-caret)),\r
    .asc-button-body[data-label-pos="none"]\r
      .asc-button-main:not(:has(.asc-button-tags)):not(\r
        :has(.asc-button-caret)\r
      ):not(:has(.asc-button-memo)) {\r
      display: none;\r
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
    /* memo 视觉配平：图标放大已并入上方统一 1.5× 规则（ADR-0138 修订，原独立 2× 规则废除）；\r
         图标与 label+memo 文本块的垂直居中由 body 的 align-items: center 承担 */\r
\r
    /* tags 小圆钮：恒贴标签行右端（margin-left:auto 吸收剩余空间；按钮收缩到内容宽时\r
         退化为紧跟 label，最小间距由行容器 line 的 gap 保证），独立 hover 反馈 */\r
    .asc-button-tags {\r
      display: inline-flex;\r
      gap: 0.15em;\r
      margin-left: auto;\r
    }\r
    /* 尾部方向箭头（caret）：恒居标签行（line）最右；无 tags 时自身吸收剩余空间贴右，\r
         有 tags 时由 tags 的 auto margin 统一推至右端（两个 auto margin 会分摊剩余空间，\r
         使 tags 落点内缩）。方向经 x-icon 的 rotate 选项旋转同一枚 arrow 图标（svg 载体\r
         自带 transition，切换即连续旋转） */\r
    .asc-button-caret {\r
      display: inline-flex;\r
      margin-left: auto;\r
    }\r
    .asc-button-line:has(> .asc-button-tags) > .asc-button-caret {\r
      margin-left: 0;\r
    }\r
    /* 浮动箭头（floatCaret）：脱离标签行流，绝对定位到按钮**右缘**（right 2px）、垂直\r
         三档可选——'top'（右上角，top 与 right 等距 2px）/ 'center'（缺省档，垂直居中\r
         ——横排下即与图标中心线一致）/ 'bottom'（右下角，bottom 与 right 对称 2px）；\r
         尺寸减半（0.5×，宿主+svg 双载体同 tag 图标手法）；叠加形态：不占行内空间，与\r
         tags 并存时叠于其上、label 截断可用宽不含 caret（尾部可能被压，组合自担）。\r
         裸布尔 true 经绑定通道归一 'center' */\r
    .asc-button:has(> .asc-button-body[data-float-caret]) {\r
      position: relative;\r
    }\r
    .asc-button-body[data-float-caret] .asc-button-caret {\r
      position: absolute;\r
      right: 2px;\r
      margin-left: 0;\r
    }\r
    .asc-button-body[data-float-caret="top"] .asc-button-caret {\r
      top: 2px;\r
    }\r
    .asc-button-body[data-float-caret="center"] .asc-button-caret {\r
      top: 50%;\r
      transform: translateY(-50%);\r
    }\r
    .asc-button-body[data-float-caret="bottom"] .asc-button-caret {\r
      bottom: 2px;\r
    }\r
    .asc-button-body[data-float-caret] .asc-button-caret.as-icon,\r
    .asc-button-body[data-float-caret] .asc-button-caret.as-icon > svg {\r
      width: calc(var(--auto-icon-size, 1em) * 0.5);\r
      height: calc(var(--auto-icon-size, 1em) * 0.5);\r
    }\r
    .asc-button-tag-item {\r
      display: contents;\r
    }\r
    .asc-button-tag {\r
      display: inline-flex;\r
      align-items: center;\r
      justify-content: center;\r
      gap: 0.25em;\r
      height: 1.8rem;\r
      width: 1.8rem;\r
      padding: 0;\r
      font-size: 1rem;\r
      border-radius: 50%;\r
      color: var(--asc-ink);\r
      cursor: pointer;\r
      background: transparent;\r
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
    .asc-button-tag:has(> .asc-button-tag-label) {\r
      width: auto;\r
      padding: 0 0.6rem;\r
      border-radius: 9999px;\r
    }\r
    .asc-button-tag-label {\r
      line-height: 1;\r
      white-space: nowrap;\r
    }\r
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
    :data-float-caret="typeof floatCaret === 'string' && floatCaret ? floatCaret : (floatCaret === true ? 'center' : null)"\r
    :style="indent ? { paddingLeft: (typeof indent === 'number' ? indent + 'px' : indent) } : undefined"\r
  >\r
    <span class="asc-button-icon" x-if="loading" x-icon="'loading'"></span>\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'string' && icon"\r
      x-icon="icon"\r
    ></span>\r
    <span\r
      class="asc-button-icon"\r
      x-if="!loading && typeof icon === 'object' && icon"\r
      x-icon="icon.name"\r
      x-icon-options:size="(labelPos==='top'||labelPos==='bottom'||!!memo) ? (icon.size==null ? (typeof icon.scale==='number'&&icon.scale>0 ? 'calc(var(--auto-icon-size, 1em) * '+icon.scale+')' : undefined) : (typeof icon.size==='number' ? icon.size*(typeof icon.scale==='number'&&icon.scale>0?icon.scale:1.5)+'px' : 'calc('+icon.size+' * '+(typeof icon.scale==='number'&&icon.scale>0?icon.scale:1.5)+')')) : icon.size"\r
      x-icon-options:color="icon.color"\r
      x-icon-options:stroke-width="icon.strokeWidth"\r
      x-icon-options:padding="icon.padding"\r
      x-icon-options:shape="icon.shape"\r
      x-icon-options:button="icon.button"\r
      x-icon-options:pointer="icon.pointer"\r
      x-icon-options:rotate="icon.rotate"\r
    ></span>\r
    <span class="asc-button-main">\r
      <span class="asc-button-line">\r
        <span class="asc-button-label" x-show="labelPos !== 'none'" x-slot>{{ displayLabel }}</span>\r
        <span class="asc-button-tags" x-if="tags && tags.length && !hideTags">\r
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
        <span\r
          class="asc-button-caret"\r
          x-if="caret !== 'none'"\r
          x-icon="'arrow'"\r
          :data-caret="caret"\r
          x-icon-options:rotate="caret === 'left' ? 180 : caret === 'bottom' ? 90 : caret === 'top' ? -90 : 0"\r
        ></span>\r
      </span>\r
      <span class="asc-button-memo" x-if="memo && labelPos !== 'none'">{{ memo }}</span>\r
    </span>\r
  </span>\r
</button>\r
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-button`))){let e=/^x-(popover|dialog|drawer)([:.-]|$|-options$)/,o=Array.from(a.attributes).filter(t=>e.test(t.name)),s=null;if(o.length){s=document.createElement(`span`);for(let e of o)s.setAttribute(e.name,e.value),a.removeAttribute(e.name)}let c=document.createElement(`button`),l=[];for(let e of Array.from(a.attributes))e.name.startsWith(`:`)?l.push(`${n(t(e.name.slice(1)))}: (${e.value})`):e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)?c.setAttribute(e.name,e.value):l.push(`${n(t(e.name))}: ${JSON.stringify(r(e.value))}`);c.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);let u=[];for(let e of Array.from(a.children))e.hasAttribute(`x-define`)&&u.push(e);if(s){a.replaceWith(s);for(let e of u)s.appendChild(e);s.appendChild(c)}else a.replaceWith(c);for(;a.firstChild;)c.appendChild(a.firstChild)}})}o();function o(){e(e=>{a(e)})}};
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
