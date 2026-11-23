(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.float-button`;function a(e){e.components[i]=`<button
  type="button"
  class="asc-float-button"
  x-define="autospark.float-button"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "default",
            icon: "",
            visibilityHeight: 400,
            right: 40,
            bottom: 40,
            shape: "circle",
        }),
        mounted() {
            const el = this.el;

            const toPos = (v) => {
                if (typeof v === "number" && isFinite(v)) return \`\${v}px\`;
                if (typeof v === "string" && v.trim() !== "") return v.trim();
                return null;
            };
            const syncPos = () => {
                const r = toPos(this.data.right);
                const b = toPos(this.data.bottom);
                if (r) el.style.setProperty("right", r);
                else el.style.removeProperty("right");
                if (b) el.style.setProperty("bottom", b);
                else el.style.removeProperty("bottom");
            };

            const scrollTop = () =>
                (typeof window.scrollY === "number" ? window.scrollY : 0)
                || (document.documentElement ? document.documentElement.scrollTop : 0)
                || 0;
            const syncVisible = () => {
                const threshold = Number(this.data.visibilityHeight);
                const visible = scrollTop() >= (isFinite(threshold) ? threshold : 0);
                if (visible) el.setAttribute("data-visible", "");
                else el.removeAttribute("data-visible");
            };

            let cleanupScroll = null;
            const bindScroll = () => {
                if (cleanupScroll) { cleanupScroll(); cleanupScroll = null; }
                if (String(this.data.type) !== "back-to-top") {
                    el.removeAttribute("data-visible");
                    return;
                }
                const onScroll = () => { syncVisible(); };
                window.addEventListener("scroll", onScroll, { passive: true });
                cleanupScroll = () => window.removeEventListener("scroll", onScroll);
                syncVisible();
            };

            syncPos();
            setTimeout(() => { bindScroll(); }, 0);
            this.watch("right", () => { syncPos(); });
            this.watch("bottom", () => { syncPos(); });
            this.watch("type", () => { setTimeout(bindScroll, 0); });
            this.watch("visibilityHeight", () => { syncVisible(); });

            el.addEventListener("click", () => {
                if (String(this.data.type) !== "back-to-top") return;
                const reduced = typeof window?.matchMedia === "function"
                    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
            });

            el["_ascFloatButtonCleanup"] = () => {
                if (cleanupScroll) cleanupScroll();
            };
        },
        unmounted() {
            const cleanup = this.el?.["_ascFloatButtonCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascFloatButtonCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-float-button">
    .asc-float-button {
      /* 阴影走 theme 手动通道：data-shadow 档位在 theme 在场时覆写 --auto-shadow，
         缺省兜底为悬浮钮档投影（对齐 theme 默认档校准值，card 同款注释） */
      position: fixed;
      right: var(--asc-float-button-right, 40px);
      bottom: var(--asc-float-button-bottom, 40px);
      z-index: var(--asc-float-button-z, 100);
      appearance: none;
      border: var(--auto-border-size, var(--asc-float-button-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-float-button-border, #d9d9d9));
      background: var(--auto-bgcolor, var(--asc-float-button-bg, #ffffff));
      color: var(--auto-color, var(--asc-float-button-color, #606060));
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.12)));
      border-radius: var(--x-border-radius-circle, 50%);
      width: var(--asc-float-button-size, 2.5rem);
      height: var(--asc-float-button-size, 2.5rem);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375em;
      padding: 0;
      margin: 0;
      font: inherit;
      line-height: 1;
      font-size: var(--auto-font-size, var(--asc-float-button-font-size, 0.875rem));
      cursor: pointer;
      transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease,
        box-shadow 0.15s ease, opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
    }
    .asc-float-button:focus-visible {
      outline: none;
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.12))),
        inset 0 0 0 2px color-mix(in srgb, var(--auto-primary-color, var(--asc-float-button-primary, #009aff)) 28%, transparent);
    }
    .asc-float-button:not(:disabled):hover {
      color: var(--auto-primary-color, var(--asc-float-button-primary, #009aff));
      border-color: color-mix(in srgb, var(--auto-primary-color, var(--asc-float-button-primary, #009aff)) 45%, transparent);
    }

    .asc-float-button:has(> .asc-float-button-body[data-shape="square"]) {
      border-radius: var(--auto-border-radius, var(--asc-float-button-radius, 0.5rem));
    }

    .asc-float-button:has(.asc-float-button-label:not(:empty)) {
      width: auto;
      min-width: var(--asc-float-button-size, 2.5rem);
      padding: 0 0.875em;
    }

    .asc-float-button:has(> .asc-float-button-body[data-type="back-to-top"]):not([data-visible]) {
      opacity: 0;
      visibility: hidden;
      transform: translateY(0.5rem);
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-float-button {
        transition: none;
      }
    }

    .asc-float-button-icon {
      display: inline-flex;
      font-size: 1.25em;
    }
    .asc-float-button-body[data-type="back-to-top"] .asc-float-button-icon[data-default-icon] {
      transform: rotate(-90deg);
    }
    .asc-float-button-label:empty {
      display: none;
    }

    [dark] .asc-float-button,
    [data-dark] .asc-float-button {
      background: var(--auto-bgcolor, var(--asc-float-button-bg, #3a3a3a));
      color: var(--auto-color, var(--asc-float-button-color, #fafafa));
      border-color: var(--auto-border-color, var(--asc-float-button-border, #52525b));
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.4)));
    }
  </style>
  <span class="asc-float-button-body" :data-type="type" :data-shape="shape">
    <i
      class="asc-float-button-icon"
      :data-default-icon="icon ? null : ''"
      x-icon="icon || (type === 'back-to-top' ? 'arrow' : '')"
    ></i>
    <span class="asc-float-button-label" x-slot></span>
  </span>
</button>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-float-button`))){let e=document.createElement(`button`);e.setAttribute(`type`,`button`);let o=a.hasAttribute(`back-to-top`);a.removeAttribute(`back-to-top`);let s=a.hasAttribute(`type`)||a.hasAttribute(`:type`),c=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?c.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):c.push(`${n(t(i.name))}: ${JSON.stringify(i.value===``||r(i.value))}`);for(o&&!s&&c.push(`type: ${JSON.stringify(`back-to-top`)}`),e.setAttribute(`x-component:${i}`,`{ ${c.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.float-button.js.map
