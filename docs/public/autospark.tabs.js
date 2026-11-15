(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.tabs`;function a(e){e.components[i]=`<!--\r
    autospark.tabs 页签（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行 / 决策 3\r
    裁定 segmented 并入本件作 variant）：items（{ key, label, icon?, disabled? }[]，\r
    状态引用注入）驱动页签头 + 默认插槽承载面板区（消费者以 x-show / x-if 家族切面板，\r
    保活走 x-if.keepalive——引擎原生路径，组件不代理面板生命周期）。\r
\r
    值通道（受控单选，button-group 选中模式同构）：value props 单向驱动视觉 + 点击/\r
    键盘激活写组件 data（绑定通道随动迁移 active/aria-selected/tabindex）+ 双派发——\r
    input（x-model 回写，监听在宿主自身非冒泡）+ change（冒泡 detail = { value }，\r
    外层 @change="v = $event.detail.value" 一行回写）。el.value 劫持桥恒在场\r
    （x-model / 程序读写皆经此）。初值落定序：x-model expando > props value >\r
    首个可用项（tablist 恒有一项激活的语义缺省）。\r
\r
    键盘（tablist 语义，WAI-ARIA tabs 模式）：左右移焦 + 自动激活（环形）、Home/End\r
    首末直达；焦点漫游 tabindex（激活项 0 / 其余 -1）经绑定通道随动；禁用项被跳过。\r
\r
    router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router。\r
\r
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定\r
    不会求值——形态绑定（:data-variant）落在编译子树内层 body 上，bar/content 按\r
    body 的 data-variant 命中形态样式块。\r
-->\r
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props\r
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized\r
     六键）自动获得——字号档位经主题通道全跟随；tabs 不在 data() 声明主题六键，\r
     内部变体属性（variant）亦禁用六个通道名 -->\r
<div\r
  class="asc-tabs"\r
  x-define="autospark.tabs"\r
  x-define:inherit="autospark.base"\r
>\r
  <script setup>\r
    {\r
        data: () => ({\r
            value: "",       // 受控激活 key（el.value 桥 + change detail={value}；缺省激活首个可用项）\r
            items: [],       // 页签项 { key, label, icon?, disabled? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底\r
            variant: "line", // 形态：line 下划线（缺省）| card 卡片 | segmented 分段控制器（button-group 选中模式视觉近亲）\r
        }),\r
        methods: {\r
            // 页签激活（点击/键盘共用通道）：禁用跳过、同值短路；写组件 data（绑定通道\r
            // 随动迁移 active/aria-selected/tabindex）+ 双派发（input→x-model 回写非冒泡；\r
            // change→外层消费 detail={value} 冒泡）\r
            onTabClick(item) {\r
                if (!item || item.disabled) return;\r
                const k = String(item.key ?? "");\r
                if (k === "" || k === String(this.data.value ?? "")) return;\r
                this.data.value = k;\r
                this.el.dispatchEvent(new Event("input", { bubbles: false }));\r
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: k } }));\r
            },\r
        },\r
        mounted() {\r
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props\r
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先\r
            const raw = this.el.getAttribute("data-items");\r
            if ((!this.data.items || !this.data.items.length) && raw) {\r
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }\r
                this.el.removeAttribute("data-items");\r
            }\r
\r
            // el.value 劫持桥（受控 value 的 DOM 通道：x-model / 程序读写皆经此）——\r
            // 劫持前快照 expando（x-model 编译期可能已写初值）\r
            const prior = this.el.value;\r
            Object.defineProperty(this.el, "value", {\r
                get: () => String(this.data.value ?? ""),\r
                set: (v) => { this.data.value = String(v ?? ""); },\r
                configurable: true,\r
            });\r
\r
            // 一跳首对齐（mounted 时 props 注入可能未落定，家族惯例）：初值落定序 =\r
            // x-model expando > props value > 首个可用项（tablist 恒有一项激活）\r
            setTimeout(() => {\r
                if (!this.data.value && typeof prior === "string" && prior !== "") {\r
                    this.data.value = prior;\r
                }\r
                if (!this.data.value) {\r
                    const first = (this.data.items || []).find((it) => it && it.key != null && String(it.key) !== "" && !it.disabled);\r
                    if (first) this.data.value = String(first.key);\r
                }\r
            }, 0);\r
\r
            // 键盘导航（tablist 语义）：左右移焦环形 + 自动激活、Home/End 首末直达；\r
            // 禁用项滤除（原生 disabled 不可聚焦，键盘序列跳过）；焦点漫游 tabindex 由\r
            // 绑定通道随动（激活项 0 / 其余 -1），此处只管移焦与激活复用点击通道\r
            this.el.addEventListener("keydown", (e) => {\r
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;\r
                const t = e.target instanceof Element ? e.target : null;\r
                const tab = t ? t.closest(".asc-tabs-tab") : null;\r
                if (!tab || !this.el.contains(tab)) return;\r
                e.preventDefault();\r
                const tabs = Array.from(this.el.querySelectorAll(".asc-tabs-tab")).filter((b) => !b.disabled);\r
                if (!tabs.length) return;\r
                const idx = tabs.indexOf(tab);\r
                let next = 0;\r
                if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;\r
                else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;\r
                else if (e.key === "Home") next = 0;\r
                else next = tabs.length - 1;\r
                tabs[next].focus();\r
                tabs[next].click();\r
            });\r
        },\r
    }\r
  <\/script>\r
  <style global id="autospark-components-tabs">\r
    .asc-tabs {\r
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012） */\r
      display: block;\r
      width: 100%;\r
      font-size: var(--auto-font-size, var(--asc-tabs-font-size, 0.875rem));\r
      line-height: var(--auto-line-height, 1.5);\r
    }\r
\r
    /* ---------- bar：页签头容器（role=tablist，x-for 容器宿主——子按钮逐项克隆） ---------- */\r
    .asc-tabs-bar {\r
      display: flex;\r
      align-items: stretch;\r
      max-width: 100%;\r
      min-width: 0;\r
    }\r
    .asc-tabs-tab {\r
      /* 语义色中转（形态块按需消费） */\r
      --asc-tone: var(--auto-primary-color, var(--asc-tabs-primary, #009aff));\r
      appearance: none;\r
      border: none;\r
      background: transparent;\r
      font: inherit;\r
      line-height: inherit;\r
      color: var(--auto-secondary-color, var(--asc-tabs-tab-color, rgba(0, 0, 0, 0.55)));\r
      display: inline-flex;\r
      align-items: center;\r
      gap: 0.35em;\r
      padding: 0.5em 1em;\r
      margin: 0;\r
      cursor: pointer;\r
      position: relative;\r
      white-space: nowrap;\r
      transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;\r
    }\r
    .asc-tabs-tab:focus-visible {\r
      outline: none;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-focus-radius, 0.25em));\r
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);\r
    }\r
    .asc-tabs-tab:disabled {\r
      color: var(--auto-disable-color, var(--asc-tabs-disable-color, rgba(0, 0, 0, 0.25)));\r
      cursor: not-allowed;\r
    }\r
    .asc-tabs-tab-label {\r
      overflow: hidden;\r
      text-overflow: ellipsis;\r
      max-width: 100%;\r
    }\r
    /* 图标位：随字号（x-icon 默认 1em） */\r
\r
    /* ---------- line 形态（缺省）：底线 + 激活下划线 ---------- */\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-bar {\r
      border-bottom: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab::after {\r
      content: "";\r
      position: absolute;\r
      left: 0;\r
      right: 0;\r
      bottom: calc(-1 * var(--auto-border-size, var(--asc-tabs-border-size, 1px)));\r
      height: 2px;\r
      background: var(--asc-tone);\r
      transform: scaleX(0);\r
      transition: transform 0.2s ease;\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tone);\r
      font-weight: var(--x-font-weight-large, 600); /* 语义层无强调字重变量，直取基础标尺 */\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active]::after {\r
      transform: scaleX(1);\r
    }\r
    .asc-tabs-body[data-variant="line"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--asc-tone);\r
    }\r
\r
    /* ---------- card 形态：卡片页签 + 内容区连线（激活卡盖底线 + z 抬层） ---------- */\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-bar {\r
      border-bottom: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab {\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid transparent;\r
      border-bottom: none;\r
      border-radius: 0.375em 0.375em 0 0;\r
      /* 压叠 bar 底线（激活卡以面板实底盖线，形成与内容区的视觉连线） */\r
      margin-bottom: calc(-1 * var(--auto-border-size, var(--asc-tabs-border-size, 1px)));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--asc-tone);\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(0, 0, 0, 0.04)));\r
    }\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tone);\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #ffffff));\r
      border-color: var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
      position: relative;\r
      z-index: 1; /* 盖住 bar 底线（与内容区上缘连线的关键） */\r
    }\r
\r
    /* ---------- segmented 形态（分段控制器，button-group 选中模式视觉近亲）： ---------- */\r
    /* ---------- 浅底容器 + 激活 tone 实底反白（语义色底白字为恒定设计，非变量映射） ---------- */\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar {\r
      display: inline-flex;\r
      gap: 0.125em;\r
      padding: 0.1875em;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-seg-radius, 0.5em));\r
      background: var(--auto-secondary-bgcolor, var(--asc-tabs-seg-bg, rgba(245, 245, 245, 0.45)));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab {\r
      padding: 0.3125em 0.875em;\r
      border-radius: var(--auto-border-radius, var(--asc-tabs-seg-tab-radius, 0.375em));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--auto-color, var(--asc-tabs-color, #606060));\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(0, 0, 0, 0.04)));\r
    }\r
    .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab[data-active] {\r
      color: var(--asc-tabs-seg-ink, #ffffff);\r
      background: var(--asc-tone);\r
    }\r
\r
    /* ---------- content：默认插槽面板区（:empty 隐藏——纯页签头用法无空盒占位） ---------- */\r
    .asc-tabs-content {\r
      padding: 0.75em 0.125em;\r
    }\r
    .asc-tabs-content:empty {\r
      display: none;\r
    }\r
    /* card 形态内容区：三边线 + 上缘与 bar 底线压叠（连线闭环） */\r
    .asc-tabs-body[data-variant="card"] .asc-tabs-content {\r
      padding: var(--asc-tabs-content-pad, 0.8em 1em);\r
      border: var(--auto-border-size, var(--asc-tabs-border-size, 1px)) solid\r
        var(--auto-border-color, var(--asc-tabs-border, #d9d9d9));\r
      border-top: none;\r
      border-radius: 0 0 0.375em 0.375em;\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #ffffff));\r
    }\r
\r
    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */\r
    [dark] .asc-tabs-tab,\r
    [data-dark] .asc-tabs-tab {\r
      --asc-tone: var(--auto-primary-color, var(--asc-tabs-primary, #56baff));\r
      color: var(--auto-secondary-color, var(--asc-tabs-tab-color, rgba(255, 255, 255, 0.65)));\r
    }\r
    [dark] .asc-tabs-tab:disabled,\r
    [data-dark] .asc-tabs-tab:disabled {\r
      color: var(--auto-disable-color, var(--asc-tabs-disable-color, rgba(255, 255, 255, 0.25)));\r
    }\r
    [dark] .asc-tabs-body[data-variant="line"] .asc-tabs-bar,\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="line"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-bar {\r
      border-bottom-color: var(--auto-border-color, var(--asc-tabs-border, #52525b));\r
    }\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      background: var(--auto-hover-bgcolor, var(--asc-tabs-hover-bg, rgba(255, 255, 255, 0.08)));\r
    }\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-tab:not([data-active]):not(:disabled):hover {\r
      color: var(--auto-color, var(--asc-tabs-color, #fafafa));\r
    }\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active],\r
    [dark] .asc-tabs-body[data-variant="card"] .asc-tabs-content,\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active],\r
    [data-dark] .asc-tabs-body[data-variant="card"] .asc-tabs-content {\r
      background: var(--auto-bgcolor, var(--asc-tabs-bg, #3a3a3a));\r
      border-color: var(--auto-border-color, var(--asc-tabs-border, #52525b));\r
    }\r
    [dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar,\r
    [data-dark] .asc-tabs-body[data-variant="segmented"] .asc-tabs-bar {\r
      background: var(--auto-secondary-bgcolor, var(--asc-tabs-seg-bg, rgba(129, 129, 129, 0.45)));\r
    }\r
  </style>\r
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；激活态/aria/tabindex 全为克隆体内\r
         绑定（指令值通道响应，props 晚注入/内部写值随动）；key 归一 String 比较（数字\r
         key 语域兼容） -->\r
  <div class="asc-tabs-body" :data-variant="variant">\r
    <!-- x-for 容器宿主形态（engine 惯用语义）：bar 为容器（不克隆），其子 button 才是\r
             逐项克隆模板（:key 在容器上）；克隆体内条件显隐用 x-show（共享快照多实例 +\r
             items 晚注入下 x-if 延迟编译挂错 scope 链，P0 规避清单第 4 条）——icon 空值\r
             x-icon 渲染默认图标（x-show 隐藏不可见） -->\r
    <div class="asc-tabs-bar" role="tablist" x-for="item of items" :key="item.key">\r
      <button\r
        type="button"\r
        class="asc-tabs-tab"\r
        role="tab"\r
        :data-active="String(item.key) === String(value) ? '' : null"\r
        :aria-selected="String(item.key) === String(value) ? 'true' : 'false'"\r
        :tabindex="String(item.key) === String(value) ? '0' : '-1'"\r
        :disabled="item.disabled"\r
        @click="onTabClick(item)"\r
      >\r
        <i class="asc-tabs-tab-icon" x-show="item.icon" x-icon="item.icon"></i>\r
        <span class="asc-tabs-tab-label">{{ item.label }}</span>\r
      </button>\r
    </div>\r
    <!-- 默认插槽面板区：未提供内容时无空盒占位（:empty 隐藏；出口须紧凑书写）。\r
             面板切换由消费者以 x-show / x-if(.keepalive) 承载（组件文档配方） -->\r
    <div class="asc-tabs-content" x-slot></div>\r
  </div>\r
</div>\r
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-tabs`))){let e=document.createElement(`div`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-tab`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);return n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):l.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.tabs.js.map
