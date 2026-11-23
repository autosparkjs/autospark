(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.dropdown`,a=new Set([`disabled`]);function o(e){let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`icon`);return n!=null&&(t.icon=n),e.hasAttribute(`disabled`)&&(t.disabled=!0),e.hasAttribute(`divided`)&&(t.divided=!0),e.hasAttribute(`danger`)&&(t.danger=!0),t}function s(e){e.components[i]=`<div
  class="asc-dropdown"
  x-define="autospark.dropdown"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],
            trigger: "hover",
            placement: "bottom-start",
            disabled: false,
            open: false,
            activeKey: null,
            pickTick: 0,
            pickKey: null,
            hoverTick: 0,
            hoverKey: null,
        }),
        methods: {
            triggerEl() {
                return this.el.querySelector(".asc-dropdown-trigger");
            },
            triggerMode() {
                return String(this.data.trigger ?? "hover") === "click" ? "click" : "hover";
            },
            openPanel() {
                if (this.data.disabled) return;
                if (this.data.open) return;
                const t = this.triggerEl();
                if (!t) return;
                if (this.triggerMode() === "click") {
                    t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    t.dispatchEvent(new MouseEvent("mouseenter"));
                }
            },
            closePanel() {
                if (!this.data.open) return;
                const t = this.triggerEl();
                if (!t) return;
                if (this.triggerMode() === "click") {
                    t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                } else {
                    t.dispatchEvent(new MouseEvent("mouseleave"));
                }
            },
            setActive(key) {
                const list = this.data.items ?? [];
                const i = list.findIndex((o) => o && String(o.key) === String(key));
                if (i >= 0 && !list[i].disabled) this.data.activeKey = list[i].key;
            },
            moveActive(dir) {
                const list = this.data.items ?? [];
                if (list.length === 0) return;
                let i = list.findIndex((o) => o && String(o.key) === String(this.data.activeKey));
                for (let step = 0; step < list.length; step++) {
                    i = (i + dir + list.length) % list.length;
                    if (!list[i].disabled) { this.data.activeKey = list[i].key; return; }
                }
            },
            pick(key) {
                if (this.data.disabled) return;
                const list = this.data.items ?? [];
                const item = list.find((o) => o && String(o.key) === String(key));
                if (!item || item.disabled) return;
                this.emit("select", { key: item.key, item: { ...item } });
                this.data.activeKey = null;
                this.closePanel();
            },
            onTriggerKeydown(event) {
                if (this.data.disabled) return;
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!this.data.open) { this.openPanel(); return; }
                    this.moveActive(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter") {
                    if (this.data.open) {
                        event.preventDefault();
                        if (this.data.activeKey != null) this.pick(this.data.activeKey);
                        else this.closePanel();
                    }
                }
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            setTimeout(() => {
                const t = this.triggerEl();
                if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                this.el.toggleAttribute("data-disabled", !!this.data.disabled);
            }, 0);

            this.watch("open", () => {
                const on = !!this.data.open;
                this.el.toggleAttribute("data-open", on);
                const t = this.triggerEl();
                if (t) t.setAttribute("aria-expanded", String(on));
                if (on) this.data.activeKey = null;
            });
            this.watch("disabled", () => {
                setTimeout(() => {
                    const t = this.triggerEl();
                    if (t) t.tabIndex = this.data.disabled ? -1 : 0;
                    this.el.toggleAttribute("data-disabled", !!this.data.disabled);
                }, 0);
                if (this.data.disabled) this.closePanel();
            });
            this.watch("pickTick", () => { this.pick(this.data.pickKey); });
            this.watch("hoverTick", () => { this.setActive(this.data.hoverKey); });
        },
    }
  <\/script>
  <style global id="autospark-components-dropdown">
    .asc-dropdown {
      display: inline-flex;
      font-size: var(--auto-font-size, var(--asc-dropdown-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    /* 触发器包裹层（popover 宿主 + 键盘监听点）：紧贴插槽内容；tabindex 聚焦位（文本
       触发区键盘可达——JS 通道维护禁用态退出焦点序） */
    .asc-dropdown-trigger {
      display: inline-flex;
      align-items: center;
      outline: none;
      border-radius: var(--auto-border-radius, var(--asc-dropdown-trigger-radius, 0.375rem));
    }
    .asc-dropdown-trigger:focus-visible {
      box-shadow: inset 0 0 0 2px
        color-mix(in srgb, var(--auto-primary-color, var(--asc-dropdown-primary, #009aff)) 28%, transparent);
    }
    /* 出口即触发器本体：使用者内容直接成为宿主子级（出口与宿主同元素的成因见
       模板尾注——ADR-0056 决策十的覆盖物内容标记判定），无须额外包裹层 */
    /* 禁用：整体淡化 + 触发器 pointer-events 阻断开面板（popover 宿主监听不知禁用态，
       CSS 层拦截——click 与 hover 两模型一并阻断） */
    .asc-dropdown[data-disabled] {
      opacity: 0.55;
    }
    .asc-dropdown[data-disabled] .asc-dropdown-trigger {
      pointer-events: none;
    }

    /* ══════════ 菜单面板（autospark-dropdown-panel，渲染进 body 覆盖物容器；外壳
       边框/阴影/定位归 popover-shell；菜单项语义色 token 与 menu 同源、面板结构与
       select 下拉面板同款，ADR-0027 决策 9 ══════════ */
    .asc-dropdown-panel {
      display: block;
      min-width: max-content;
      font-size: var(--auto-font-size, var(--asc-dropdown-panel-font-size, 0.875rem));
      line-height: var(--auto-line-height, var(--asc-dropdown-panel-line-height, 1.4));
      color: var(--auto-color, var(--asc-dropdown-panel-color, #333333));
    }
    .asc-dropdown-menu {
      list-style: none;
      margin: 0;
      padding: 0.25em 0;
      max-height: var(--asc-dropdown-max-height, 15em);
      overflow-y: auto;
      box-sizing: border-box;
    }
    /* 菜单项：行式热区；高亮/禁用/分隔线/危险态经 data-* 属性选择器驱动（绑定通道写
       属性——假值整个移除即无态，绑定语义天然契合）；语义色 token 与 menu 同源 */
    .asc-dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5em;
      min-height: 2.2em;
      padding: 0.3em 0.75em;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 0.12s ease, color 0.12s ease;
    }
    .asc-dropdown-item[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-dropdown-item-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-dropdown-item-icon {
      display: inline-flex;
      flex: none;
      color: var(--auto-third-color, var(--asc-dropdown-item-icon, rgba(0, 0, 0, 0.35)));
    }
    .asc-dropdown-item[data-active] .asc-dropdown-item-icon {
      color: var(--auto-secondary-color, var(--asc-dropdown-item-icon-active, rgba(0, 0, 0, 0.55)));
    }
    .asc-dropdown-item-label {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
    }
    .asc-dropdown-item[data-divided] {
      border-top: var(--auto-border-size, var(--asc-dropdown-item-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-dropdown-item-border, #f0f0f0));
    }
    .asc-dropdown-item[data-danger] {
      color: var(--auto-danger-color, var(--asc-dropdown-item-danger, #ef4444));
    }
    .asc-dropdown-item[data-danger]:not([data-disabled])[data-active] {
      background: color-mix(
        in srgb,
        var(--auto-danger-color, var(--asc-dropdown-item-danger, #ef4444)) 8%,
        transparent
      );
    }
    .asc-dropdown-item[data-disabled] {
      color: var(--auto-disable-color, var(--asc-dropdown-item-disabled, rgba(0, 0, 0, 0.28)));
      cursor: not-allowed;
      background: transparent;
    }
    .asc-dropdown-item[data-disabled]:hover {
      background: transparent;
    }
    .asc-dropdown-empty {
      padding: 0.9em 0.75em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-dropdown-empty, rgba(0, 0, 0, 0.35)));
    }

    [dark] .asc-dropdown,
    [data-dark] .asc-dropdown {
      color: var(--auto-color, var(--asc-dropdown-color, #fafafa));
    }
    [dark] .asc-dropdown-trigger:focus-visible,
    [data-dark] .asc-dropdown-trigger:focus-visible {
      box-shadow: inset 0 0 0 2px
        color-mix(in srgb, var(--auto-primary-color, var(--asc-dropdown-primary, #56baff)) 28%, transparent);
    }
    [dark] .asc-dropdown-panel,
    [data-dark] .asc-dropdown-panel {
      color: var(--auto-color, var(--asc-dropdown-panel-color, #fafafa));
    }
    [dark] .asc-dropdown-item[data-active],
    [data-dark] .asc-dropdown-item[data-active] {
      background: var(--auto-hover-bgcolor, var(--asc-dropdown-item-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-dropdown-item-icon,
    [data-dark] .asc-dropdown-item-icon {
      color: var(--auto-third-color, var(--asc-dropdown-item-icon, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-dropdown-item[data-active] .asc-dropdown-item-icon,
    [data-dark] .asc-dropdown-item[data-active] .asc-dropdown-item-icon {
      color: var(--auto-secondary-color, var(--asc-dropdown-item-icon-active, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-dropdown-item[data-divided],
    [data-dark] .asc-dropdown-item[data-divided] {
      border-top-color: var(--auto-border-color, var(--asc-dropdown-item-border, #52525b));
    }
    [dark] .asc-dropdown-item[data-danger],
    [data-dark] .asc-dropdown-item[data-danger] {
      color: var(--auto-danger-color, var(--asc-dropdown-item-danger, #e6696a));
    }
    [dark] .asc-dropdown-item[data-disabled],
    [data-dark] .asc-dropdown-item[data-disabled] {
      color: var(--auto-disable-color, var(--asc-dropdown-item-disabled, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-dropdown-empty,
    [data-dark] .asc-dropdown-empty {
      color: var(--auto-third-color, var(--asc-dropdown-empty, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <span
    class="asc-dropdown-trigger"
    tabindex="0"
    aria-haspopup="menu"
    aria-expanded="false"
    x-popover:autospark-dropdown-panel
    x-popover-options="{ padding: 0, closeable: false, at: { arrow: false, offset: 4 } }"
    x-popover-options.trigger="trigger"
    x-popover-options.at="{ placement: placement }"
    @keydown="onTriggerKeydown($event)"
    x-slot
  ></span>
</div>
`,e.components[`autospark-dropdown-panel`]=`<div class="asc-dropdown-panel" x-define="autospark-dropdown-panel">
  <script setup>
    {
        data: () => ({}),
        mounted() {
            this.data.open = true;
            const scrollActive = () => {
                const el = this.el.querySelector(".asc-dropdown-item[data-active]");
                el?.scrollIntoView?.({ block: "nearest" });
            };
            setTimeout(scrollActive, 0);
            this.watch("activeKey", () => { setTimeout(scrollActive, 0); });
        },
        unmounted() {
            this.data.open = false;
        },
    }
  <\/script>
  <ul class="asc-dropdown-menu" role="menu" x-for="item of items" :key="item.key">
    <li
      class="asc-dropdown-item"
      role="menuitem"
      x-bind:data-active="activeKey != null && String(item.key) === String(activeKey)"
      x-bind:data-disabled="!!item.disabled"
      x-bind:data-divided="!!item.divided"
      x-bind:data-danger="!!item.danger"
      x-bind:aria-disabled="item.disabled ? 'true' : null"
      x-on:click="pickTick = pickTick + 1, pickKey = item.key"
      x-on:mouseenter="hoverTick = hoverTick + 1, hoverKey = item.key"
    >
      <i class="asc-dropdown-item-icon" x-show="item.icon" x-icon="item.icon"></i>
      <span class="asc-dropdown-item-label">{{ item.label }}</span>
    </li>
  </ul>
  <div
    class="asc-dropdown-empty"
    x-if="!(items && items.length > 0)"
    x-text="t('dropdown.empty') === 'dropdown.empty' ? '暂无数据' : t('dropdown.empty')"
  ></div>
</div>
`,e.precompile?.(e=>{for(let s of Array.from(e.el.querySelectorAll(`x-dropdown`))){let e=document.createElement(`span`),c=Array.from(s.children).filter(e=>e.tagName.toLowerCase()===`x-dropdown-item`),l=s.getAttribute(`items`),u=s.hasAttribute(`:items`);if(s.removeAttribute(`items`),(c.length>0||l!=null&&l!==``)&&!u){let t=null;if(c.length)t=c.map(o);else try{let e=JSON.parse(l);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of c)e.remove();let d=[];for(let i of Array.from(s.attributes))i.name.startsWith(`:`)?d.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):i.value===``&&a.has(i.name)?d.push(`${n(t(i.name))}: true`):d.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${d.join(`, `)} }`);s.firstChild;)e.appendChild(s.firstChild);s.replaceWith(e)}})}c();function c(){e(e=>{s(e)})}};
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

//# sourceMappingURL=autospark.dropdown.js.map
