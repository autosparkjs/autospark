(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.steps`;function a(e){e.components[i]=`<div
  class="asc-steps"
  x-define="autospark.steps"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            current: 0,
            items: [],
            status: "process",
            direction: "horizontal",
            clickable: false,
        }),
        methods: {
            onStepClick(i) {
                if (!this.data.clickable) return;
                const n = Math.max(0, Math.round(Number(i) || 0));
                if (n === this.data.current) return;
                this.data.current = n;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { current: n } }));
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            const normalize = (v) => {
                const n = Math.round(Number(v));
                return Number.isFinite(n) && n > 0 ? n : 0;
            };
            this.data.current = normalize(this.data.current);

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => normalize(this.data.current),
                set: (v) => { this.data.current = normalize(v); },
                configurable: true,
            });

            setTimeout(() => {
                if (normalize(this.data.current) === 0 && typeof prior === "string" && prior !== "" && Number(prior) > 0) {
                    this.data.current = normalize(prior);
                }
            }, 0);
            this.watch("current", ({ value }) => {
                if (typeof value !== "number") this.data.current = normalize(value);
            });
        },
    }
  <\/script>
  <style global id="autospark-components-steps">
    .asc-steps {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-steps-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-steps-body {
      --asc-tone: var(--auto-primary-color, var(--asc-steps-primary, #009aff));
      --asc-danger: var(--auto-danger-color, var(--asc-steps-danger, #ef4444));
    }
    .asc-steps-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .asc-steps-body[data-clickable] .asc-step {
      cursor: pointer;
    }
    .asc-steps-body[data-clickable] .asc-step:hover .asc-step-title {
      color: var(--asc-tone);
    }

    .asc-step {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      align-items: flex-start;
      gap: 0.5em;
    }
    .asc-step-dot {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75em;
      height: 1.75em;
      border-radius: 50%;
      border: var(--asc-steps-dot-border, 1px) solid var(--auto-border-color, var(--asc-steps-border, #d9d9d9));
      color: var(--auto-third-color, var(--asc-steps-wait-color, rgba(0, 0, 0, 0.45)));
      font-weight: var(--x-font-weight-large, 600);
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    .asc-step[data-state="process"] .asc-step-dot {
      border-color: var(--asc-tone);
      background: var(--asc-tone);
      color: var(--asc-steps-dot-ink, #ffffff);
    }
    .asc-step[data-state="finish"] .asc-step-dot {
      border-color: var(--asc-tone);
      color: var(--asc-tone);
    }
    .asc-step[data-state="error"] .asc-step-dot {
      border-color: var(--asc-danger);
      background: var(--asc-danger);
      color: var(--asc-steps-dot-ink, #ffffff);
    }
    .asc-step-check,
    .asc-step-error,
    .asc-step-custom {
      font-size: 0.9em;
    }

    .asc-step-info {
      flex: 0 1 auto;
      min-width: 0;
    }
    .asc-step-title {
      font-weight: var(--x-font-weight-large, 600);
      color: var(--auto-color, var(--asc-steps-title-color, #303133));
      transition: color 0.2s ease;
    }
    .asc-step[data-state="wait"] .asc-step-title {
      color: var(--auto-secondary-color, var(--asc-steps-wait-title, rgba(0, 0, 0, 0.55)));
      font-weight: var(--auto-font-weight, var(--x-font-weight-medium, 400));
    }
    .asc-step[data-state="process"] .asc-step-title {
      color: var(--asc-tone);
    }
    .asc-step[data-state="error"] .asc-step-title {
      color: var(--asc-danger);
    }
    .asc-step-desc {
      margin-top: 0.125em;
      font-size: 0.85em;
      color: var(--auto-third-color, var(--asc-steps-desc-color, rgba(0, 0, 0, 0.45)));
    }

    .asc-step-line {
      flex: 1 1 1em;
      align-self: flex-start;
      margin-top: calc((1.75em - 1px) / 2);
      height: 1px;
      background: var(--auto-border-color, var(--asc-steps-border, #d9d9d9));
      transition: background-color 0.3s ease;
    }
    .asc-step[data-state="finish"] .asc-step-line {
      background: var(--asc-tone);
    }
    .asc-step:last-child .asc-step-line {
      display: none;
    }

    .asc-steps-body[data-direction="vertical"] .asc-steps-list {
      flex-direction: column;
    }
    .asc-steps-body[data-direction="vertical"] .asc-step {
      flex: 0 0 auto;
      position: relative;
      gap: 0.75em;
      padding-bottom: 1.25em;
    }
    .asc-steps-body[data-direction="vertical"] .asc-step:last-child {
      padding-bottom: 0;
    }
    .asc-steps-body[data-direction="vertical"] .asc-step-line {
      position: absolute;
      left: calc(1.75em / 2);
      top: calc(1.75em + 0.375em);
      bottom: -0.625em;
      width: 1px;
      height: auto;
      margin: 0;
      flex: none;
      align-self: auto;
    }

    [dark] .asc-steps-body,
    [data-dark] .asc-steps-body {
      --asc-tone: var(--auto-primary-color, var(--asc-steps-primary, #56baff));
      --asc-danger: var(--auto-danger-color, var(--asc-steps-danger, #e6696a));
    }
    [dark] .asc-step-dot,
    [data-dark] .asc-step-dot {
      border-color: var(--auto-border-color, var(--asc-steps-border, #52525b));
      color: var(--auto-third-color, var(--asc-steps-wait-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-step-title,
    [data-dark] .asc-step-title {
      color: var(--auto-color, var(--asc-steps-title-color, #fafafa));
    }
    [dark] .asc-step[data-state="wait"] .asc-step-title,
    [data-dark] .asc-step[data-state="wait"] .asc-step-title {
      color: var(--auto-secondary-color, var(--asc-steps-wait-title, rgba(255, 255, 255, 0.55)));
    }
    [dark] .asc-step-desc,
    [data-dark] .asc-step-desc {
      color: var(--auto-third-color, var(--asc-steps-desc-color, rgba(255, 255, 255, 0.45)));
    }
    [dark] .asc-step-line,
    [data-dark] .asc-step-line {
      background: var(--auto-border-color, var(--asc-steps-border, #52525b));
    }
    [dark] .asc-step[data-state="finish"] .asc-step-line,
    [data-dark] .asc-step[data-state="finish"] .asc-step-line {
      background: var(--asc-tone);
    }
  </style>
  <div class="asc-steps-body" :data-direction="direction" :data-clickable="clickable ? '' : null">
    <ol class="asc-steps-list" x-for="item of items" :key="item.title">
      <li
        class="asc-step"
        :data-state="$index < current ? 'finish' : ($index === current ? (status === 'error' ? 'error' : (status === 'finish' ? 'finish' : 'process')) : 'wait')"
        :aria-current="$index === current ? 'step' : null"
        @click="onStepClick($index)"
      >
        <div class="asc-step-dot">
          <i class="asc-step-check" x-show="$index < current || ($index === current && status === 'finish')" x-icon="'yes'"></i>
          <i class="asc-step-error" x-show="$index === current && status === 'error'" x-icon="'no'"></i>
          <i class="asc-step-custom" x-show="item.icon && ($index > current || ($index === current && status === 'process'))" x-icon="item.icon"></i>
          <span class="asc-step-num" x-show="!item.icon && ($index > current || ($index === current && status === 'process'))">{{ $index + 1 }}</span>
        </div>
        <div class="asc-step-info">
          <div class="asc-step-title">{{ item.title }}</div>
          <div class="asc-step-desc" x-show="item.description">{{ item.description }}</div>
        </div>
        <div class="asc-step-line" aria-hidden="true"></div>
      </li>
    </ol>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-steps`))){let e=document.createElement(`div`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-step`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={title:e.getAttribute(`title`)??``},n=e.getAttribute(`description`);n!=null&&(t.description=n);let r=e.getAttribute(`icon`);return r!=null&&(t.icon=r),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):i.value===``?l.push(`${n(t(i.name))}: true`):l.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.steps.js.map
