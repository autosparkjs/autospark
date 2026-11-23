(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.collapse`;function a(e){e.components[i]=`<div
  class="asc-collapse"
  x-define="autospark.collapse"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: [],
            items: [],
            accordion: false,
            expandIconPosition: "end",
        }),
        methods: {
            toArray(v) {
                if (v == null) return [];
                if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
                return String(v).split(/[,\\s]+/).map((x) => x.trim()).filter(Boolean);
            },
            toggle(key) {
                if (key == null || String(key) === "") return;
                const k = String(key);
                const cur = this.toArray(this.data.value);
                const next = cur.includes(k) ? cur.filter((x) => x !== k) : (this.data.accordion ? [k] : cur.concat(k));
                this.data.value = next;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));
            },
            syncOpenState() {
                const keys = this.toArray(this.data.value);
                for (const item of Array.from(this.el.querySelectorAll(".asc-collapse-item[data-key]"))) {
                    const k = String(item.getAttribute("data-key"));
                    if (keys.includes(k)) item.setAttribute("data-open", "");
                    else item.removeAttribute("data-open");
                }
                for (const h of Array.from(this.el.querySelectorAll(".asc-collapse-header[data-key]"))) {
                    h.setAttribute("aria-expanded", keys.includes(String(h.getAttribute("data-key"))) ? "true" : "false");
                }
            },
            onRootClick(event) {
                const t = event.target instanceof Element ? event.target : null;
                const header = t ? t.closest(".asc-collapse-header") : null;
                if (!header || !this.el.contains(header)) return;
                this.toggle(header.getAttribute("data-key"));
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) this.data.items = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            this.data.value = this.toArray(this.data.value);

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => this.toArray(this.data.value).slice(),
                set: (v) => { this.data.value = this.toArray(v); },
                configurable: true,
            });

            this.syncOpenState();
            this.watch("value", () => this.syncOpenState());
            this.watch("items", () => setTimeout(() => this.syncOpenState(), 0));

            this.el.addEventListener("click", (e) => this.onRootClick(e));

            setTimeout(() => {
                if (Array.isArray(prior) && prior.length && !this.toArray(this.data.value).length) {
                    this.data.value = this.toArray(prior);
                }
                this.syncOpenState();
            }, 0);
        },
    }
  <\/script>
  <style global id="autospark-components-collapse">
    .asc-collapse {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-collapse-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-collapse-body {
      --asc-line: var(--auto-border-color, var(--asc-collapse-border-color, #d9d9d9));
      display: block;
      border: var(--auto-border-size, var(--asc-collapse-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-collapse-radius, 0.5rem));
      background: var(--auto-bgcolor, var(--asc-collapse-bg, #ffffff));
      overflow: hidden;
    }
    .asc-collapse-items {
      display: contents;
    }
    .asc-collapse-slot {
      display: contents;
    }
    .asc-collapse-slot:empty {
      display: none;
    }
    .asc-collapse-body:not(:has(.asc-collapse-item)) {
      display: none;
    }

    .asc-collapse-item + .asc-collapse-item,
    .asc-collapse-items + .asc-collapse-slot .asc-collapse-item:first-child {
      border-top: var(--auto-border-size, var(--asc-collapse-border-size, 1px)) solid var(--asc-line);
    }
    .asc-collapse-header {
      appearance: none;
      font: inherit;
      line-height: inherit;
      display: flex;
      align-items: center;
      gap: 0.5em;
      width: 100%;
      padding: 0.6em calc(0.8em + 0.2em);
      border: none;
      background: transparent;
      color: var(--auto-color, var(--asc-collapse-color, #606060));
      text-align: start;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .asc-collapse-header:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-collapse-hover-bg, rgba(0, 0, 0, 0.045)));
    }
    .asc-collapse-header:disabled {
      color: var(--auto-disable-color, var(--asc-collapse-disable-color, rgba(0, 0, 0, 0.25)));
      cursor: not-allowed;
    }
    .asc-collapse-header:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--auto-primary-color, var(--asc-collapse-primary, #009aff)) 28%, transparent);
    }
    .asc-collapse-title {
      flex: 1;
      min-width: 0;
      font-weight: var(--x-font-weight-medium, 500);
    }
    .asc-collapse-icon {
      display: inline-flex;
      color: var(--auto-third-color, var(--asc-collapse-icon-color, rgba(0, 0, 0, 0.35)));
      transform: rotate(0deg);
      transition: transform 0.2s ease;
    }
    .asc-collapse-item[data-open] .asc-collapse-icon {
      transform: rotate(90deg);
    }
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-header {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-title {
      flex: 0 1 auto;
      text-align: end;
    }

    .asc-collapse-content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.25s ease;
    }
    .asc-collapse-item[data-open] > .asc-collapse-content {
      grid-template-rows: 1fr;
    }
    .asc-collapse-inner {
      overflow: hidden;
      min-height: 0;
      padding: 0 calc(0.8em + 0.2em);
    }
    .asc-collapse-item[data-open] > .asc-collapse-content > .asc-collapse-inner {
      padding-block: 0.6em;
    }
    @media (prefers-reduced-motion: reduce) {
      .asc-collapse-content,
      .asc-collapse-icon {
        transition: none;
      }
    }

    [dark] .asc-collapse-body,
    [data-dark] .asc-collapse-body {
      --asc-line: var(--auto-border-color, var(--asc-collapse-border-color, #52525b));
      background: var(--auto-bgcolor, var(--asc-collapse-bg, #3a3a3a));
    }
    [dark] .asc-collapse-header,
    [data-dark] .asc-collapse-header {
      color: var(--auto-color, var(--asc-collapse-color, #fafafa));
    }
    [dark] .asc-collapse-header:disabled,
    [data-dark] .asc-collapse-header:disabled {
      color: var(--auto-disable-color, var(--asc-collapse-disable-color, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-collapse-header:hover:not(:disabled),
    [data-dark] .asc-collapse-header:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-collapse-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-collapse-icon,
    [data-dark] .asc-collapse-icon {
      color: var(--auto-third-color, var(--asc-collapse-icon-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <div class="asc-collapse-body" :data-expand-position="expandIconPosition">
    <div class="asc-collapse-items" x-for="item of items" :key="String(item.key)">
      <div class="asc-collapse-item" :data-key="String(item.key)">
        <button
          type="button"
          class="asc-collapse-header"
          :data-key="String(item.key)"
          :disabled="item.disabled"
        >
          <span class="asc-collapse-title">{{ item.title }}</span>
          <i class="asc-collapse-icon" x-icon="'arrow'"></i>
        </button>
        <div class="asc-collapse-content">
          <div class="asc-collapse-inner" x-html="item.content"></div>
        </div>
      </div>
    </div>
    <div class="asc-collapse-slot" x-slot></div>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-collapse`))){let e=document.createElement(`div`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-collapse-item`);for(let e of o){let t=e.getAttribute(`key`)??``,n=document.createElement(`div`);n.className=`asc-collapse-item`,n.setAttribute(`data-key`,t);let r=document.createElement(`button`);r.type=`button`,r.className=`asc-collapse-header`,r.setAttribute(`data-key`,t),e.hasAttribute(`disabled`)&&r.setAttribute(`disabled`,``);let i=document.createElement(`span`);i.className=`asc-collapse-title`,i.textContent=e.getAttribute(`title`)??``;let a=document.createElement(`i`);a.className=`asc-collapse-icon`,a.setAttribute(`x-icon`,`'arrow'`),r.appendChild(i),r.appendChild(a);let o=document.createElement(`div`);o.className=`asc-collapse-content`;let s=document.createElement(`div`);for(s.className=`asc-collapse-inner`;e.firstChild;)s.appendChild(e.firstChild);o.appendChild(s),n.appendChild(r),n.appendChild(o),e.replaceWith(n)}let s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),s!=null&&s!==``&&!c&&!o.length)try{Array.isArray(JSON.parse(s))&&e.setAttribute(`data-items`,s)}catch{}let l=[];for(let i of Array.from(a.attributes)){if(i.name.startsWith(`:`)){l.push(`${n(t(i.name.slice(1)))}: (${i.value})`);continue}if(i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)){e.setAttribute(i.name,i.value);continue}let a=i.name===`accordion`&&i.value===``||r(i.value);l.push(`${n(t(i.name))}: ${JSON.stringify(a)}`)}for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.collapse.js.map
