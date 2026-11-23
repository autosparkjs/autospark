(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.anchor`;function a(e){e.components[i]=`<nav
  class="asc-anchor"
  x-define="autospark.anchor"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            current: "",
            items: [],
            offset: 0,
            affix: false,
        }),
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            const resolveTarget = (item) => {
                if (!item || item.key == null) return null;
                const href = String(item.href || \`#\${item.key}\`);
                if (href.startsWith("#")) {
                    const id = href.slice(1);
                    if (!id) return null;
                    return document.getElementById(id) ?? null;
                }
                try { return document.querySelector(href); } catch { return null; }
            };

            const computeCurrent = () => {
                const offset = Number(this.data.offset) || 0;
                let cur = "";
                for (const it of (this.data.items || [])) {
                    const target = resolveTarget(it);
                    if (!target || typeof target.getBoundingClientRect !== "function") continue;
                    if (target.getBoundingClientRect().top - offset <= 1) cur = String(it.key);
                }
                return cur;
            };

            const syncActive = () => {
                const k = computeCurrent();
                if (k === String(this.data.current ?? "")) return;
                this.data.current = k;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { key: k } }));
            };

            const onScroll = () => { syncActive(); };
            const onResize = () => { syncActive(); };
            window.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("resize", onResize, { passive: true });
            this.el["_ascAnchorCleanup"] = () => {
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onResize);
            };

            setTimeout(() => { syncActive(); }, 0);

            this.el.addEventListener("click", (e) => {
                const link = e.target instanceof Element ? e.target.closest(".asc-anchor-link") : null;
                if (!link || !this.el.contains(link)) return;
                e.preventDefault();
                const key = link.getAttribute("data-key") ?? "";
                const item = (this.data.items || []).find((it) => it && String(it.key) === key);
                const target = item ? resolveTarget(item) : null;
                if (!target) return;
                const offset = Number(this.data.offset) || 0;
                const top = target.getBoundingClientRect().top + (window.scrollY || 0) - offset;
                const reduced = typeof window?.matchMedia === "function"
                    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
                if (key !== String(this.data.current ?? "")) {
                    this.data.current = key;
                    this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { key } }));
                }
            });
        },
        unmounted() {
            const cleanup = this.el?.["_ascAnchorCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascAnchorCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-anchor">
    .asc-anchor {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-anchor-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-anchor:has(> .asc-anchor-body[data-affix]) {
      position: fixed;
      top: var(--asc-anchor-affix-top, 5rem);
      right: var(--asc-anchor-affix-right, 2rem);
      z-index: var(--asc-anchor-affix-z, 100);
      width: auto;
      max-width: min(30vw, 14rem);
    }

    .asc-anchor-link {
      --asc-tone: var(--auto-primary-color, var(--asc-anchor-primary, #009aff));
      display: flex;
      align-items: center;
      padding: 0.375em 0.75em;
      border-left: 2px solid var(--auto-border-color, var(--asc-anchor-ink, #d9d9d9));
      color: var(--auto-secondary-color, var(--asc-anchor-link-color, rgba(0, 0, 0, 0.55)));
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease;
    }
    .asc-anchor-link:not([data-active]):hover {
      color: var(--asc-tone);
    }
    .asc-anchor-link[data-active] {
      color: var(--asc-tone);
      font-weight: var(--x-font-weight-large, 600);
      border-left-color: var(--asc-tone);
    }
    .asc-anchor-label {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    [dark] .asc-anchor-link,
    [data-dark] .asc-anchor-link {
      --asc-tone: var(--auto-primary-color, var(--asc-anchor-primary, #56baff));
      color: var(--auto-secondary-color, var(--asc-anchor-link-color, rgba(255, 255, 255, 0.65)));
      border-left-color: var(--auto-border-color, var(--asc-anchor-ink, #52525b));
    }
    [dark] .asc-anchor-link[data-active],
    [data-dark] .asc-anchor-link[data-active] {
      color: var(--asc-tone);
      border-left-color: var(--asc-tone);
    }
  </style>
  <div class="asc-anchor-body" :data-affix="affix ? '' : null">
    <div class="asc-anchor-list" x-for="item of items" :key="item.key">
      <a
        class="asc-anchor-link"
        :data-key="String(item.key)"
        :href="item.href || ('#' + item.key)"
        :data-active="String(item.key) === String(current) ? '' : null"
        :aria-current="String(item.key) === String(current) ? 'true' : null"
      >
        <span class="asc-anchor-label">{{ item.label }}</span>
      </a>
    </div>
  </div>
</nav>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-anchor`))){let e=document.createElement(`nav`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-anchor-item`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={key:e.getAttribute(`key`)??``,label:e.getAttribute(`label`)??``},n=e.getAttribute(`href`);return n!=null&&(t.href=n),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):l.push(`${n(t(i.name))}: ${JSON.stringify(i.value===``||r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.anchor.js.map
