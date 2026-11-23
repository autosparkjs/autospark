(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.button-group`,a=[`variant`,`type`,`disabled`],o=new Set([`vertical`,`block`]),s=`x-component:autospark.button`,c=`button[x-component\\:autospark\\.button]`;function l(e,t){return RegExp(`[{,]\\s*${t}\\s*:`).test(e)}function u(e){let t=e.match(/[{,]\s*value:\s*("(?:[^"\\]|\\.)*")/);if(!t)return null;try{let e=JSON.parse(t[1]);return typeof e==`string`?e:String(e)}catch{return null}}function d(e){e.components[i]=`<div
  class="asc-button-group"
  x-define="autospark.button-group"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            gap: 0,
            vertical: false,
            block: false,
            value: "",
            modelBound: false,
        }),
        mounted() {
            const bound = !!this.data.modelBound || (this.data.value != null && this.data.value !== "");
            if (!bound) return;

            const buttons = () => Array.from(this.el.querySelectorAll(".asc-button"));

            let current = "";

            let real = null;

            const applySel = (v) => {
                if (real) real.value = v;
                for (const b of buttons()) b.classList.toggle("asc-group-checked", b.getAttribute("data-value") === v);
            };

            if (this.data.modelBound) {
                real = document.createElement("input");
                real.type = "hidden";
                real.style.display = "none";
                const nameAttr = this.el.getAttribute("name");
                if (nameAttr != null) real.name = nameAttr;
                this.el.appendChild(real);
                const prior = this.el.value;
                if (typeof prior === "string" && prior !== "") current = prior;
                Object.defineProperty(this.el, "value", {
                    get: () => current,
                    set: (v) => { current = String(v ?? ""); applySel(current); },
                    configurable: true,
                });
            }

            setTimeout(() => {
                const dv = this.data.value;
                if (current === "" && dv != null && dv !== "") current = String(dv);
                applySel(current);
            }, 0);

            this.watch("value", ({ value: v }) => {
                if (v == null || v === "") return;
                const s = String(v);
                if (s !== current) { current = s; applySel(s); }
            });

            this.el.addEventListener("click", (e) => {
                const btn = e.target instanceof Element ? e.target.closest(".asc-button") : null;
                if (!btn || !this.el.contains(btn) || btn.disabled) return;
                const v = btn.getAttribute("data-value");
                if (v == null || v === current) return;
                current = v;
                applySel(v);
                if (this.data.modelBound) this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: v } }));
            });
        },
    }
  <\/script>
  <style global id="autospark-components-button-group">
    /* 组为纯布局容器无自有视觉盒：无背景/边框/字色字面值，暗色由子钮各自承担——
       组级无暗色兜底变体（无字面值即无暗色差异） */
    .asc-button-group {
      display: inline-flex;
      vertical-align: middle;
      max-width: 100%;
    }
    /* 布局容器：body 是编译子树内层（绑定可求值），子钮经 items 的 display:contents
         直接成为 body 的 flex 项（x-for 克隆载体同款技巧——出口盒不产生布局盒；
         x-slot 出口元素保留为真实包裹层不剥标签，ADR-0056——无此规则则子钮嵌在
         出口 span 内：融合相邻选择器不命中、gap/等高拉伸全部失效） */
    .asc-button-group-body {
      display: flex;
      align-items: stretch;
      width: 100%;
      min-width: 0;
    }
    .asc-button-group-items {
      display: contents;
    }
    .asc-button-group-body[data-vertical="true"] {
      flex-direction: column;
    }
    .asc-button-group:has(> .asc-button-group-body[data-block="true"]) {
      display: flex;
      width: 100%;
    }
    /* 间隔：gap 经 :style 内联承载（number 按 px / 字符串原样，indent 同款惯例），
         data-fused 仅在 gap 假值（缺省 0）时在场（绑定假值移除） */

    /* 水平：有后邻的钮清尾侧（右）圆角；有前邻的钮清首侧（左）圆角并压叠 1px（后钮边线
         绘制在上——异色分界取后钮色；后钮透明边线时前钮边线透出，分界恒在） */
    .asc-button-group-body[data-fused="true"] .asc-button:has(+ .asc-button) {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
    }
    .asc-button-group-body[data-fused="true"] .asc-button + .asc-button {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
      margin-inline-start: calc(
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))
      );
    }
    .asc-button-group-body[data-fused="true"][data-vertical="true"]
      .asc-button:has(+ .asc-button) {
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }
    .asc-button-group-body[data-fused="true"][data-vertical="true"]
      .asc-button
      + .asc-button {
      border-start-start-radius: 0;
      border-start-end-radius: 0;
      margin-inline-start: 0;
      margin-block-start: calc(
        -1 * var(--auto-border-size, var(--asc-button-border-size, 1px))
      );
    }
    /* 交互/选中钮浮于压叠之上：负 margin 重叠 1px 会令后钮背景盖前钮边缘（选中实底
         钮右缘被切、hover 边缘错位）——交互中的钮抬层级保边缘干净 */
    .asc-button-group-body[data-fused="true"] .asc-button:hover,
    .asc-button-group-body[data-fused="true"] .asc-button.asc-group-checked {
      position: relative;
      z-index: 1;
    }

    /* 组自有 class 驱动（区别于子钮 checkable 的 asc-checked）；--asc-tone 在子钮作用域
         由其 data-type 决定（组级 type 下发后语义色正确），暗色经变量链自适应无需兜底 */
    .asc-button-group .asc-button.asc-group-checked {
      --asc-bg: var(--asc-tone) !important;
      --asc-ink: #fff !important;
      --asc-line: transparent !important;
    }
  </style>
  <span
    class="asc-button-group-body"
    :data-vertical="vertical"
    :data-block="block"
    :data-fused="!gap"
    :style="gap ? { gap: (typeof gap === 'number' ? gap + 'px' : gap) } : undefined"
  >
    <span class="asc-button-group-items" x-slot></span>
  </span>
</div>
`,e.precompile?.(e=>{for(let d of Array.from(e.el.querySelectorAll(`x-button-group`))){let e=Array.from(d.querySelectorAll(`x-button, ${c}`)).filter(e=>e.closest(`x-button-group`)===d),f=new Map;for(let e of a)d.hasAttribute(e)&&f.set(e,d.getAttribute(e)),d.hasAttribute(`:${e}`)&&f.set(`:${e}`,d.getAttribute(`:${e}`));for(let t of e){if(t.tagName===`X-BUTTON`){let e=t.getAttribute(`value`);e!=null&&t.setAttribute(`data-value`,e);for(let[e,n]of f)t.hasAttribute(e)||t.hasAttribute(`:${e.slice(1)}`)||t.setAttribute(e,e.startsWith(`:`)?n:e===`disabled`?`true`:n);continue}let e=t.getAttribute(s)??`{ }`,n=[];if(t.getAttribute(`data-value`)==null){let n=u(e);n!=null&&t.setAttribute(`data-value`,n)}for(let[t,i]of f){let a=t.startsWith(`:`)?t.slice(1):t;l(e,a)||n.push(`${a}: ${t.startsWith(`:`)?`(${i})`:JSON.stringify(t===`disabled`||r(i))}`)}if(n.length>0){let r=e.replace(/\}\s*$/,``).replace(/\s+$/,``),i=r.endsWith(`{`)?r:`${r},`;t.setAttribute(s,`${i} ${n.join(`, `)} }`)}}let p=document.createElement(`div`),m=[];for(let e of Array.from(d.attributes)){if(e.name.startsWith(`:`)){m.push(`${n(t(e.name.slice(1)))}: (${e.value})`);continue}if(e.name===`class`||e.name===`style`||e.name===`id`||e.name===`name`||e.name===`title`||e.name.startsWith(`data-`)||e.name.startsWith(`x-`)||e.name.startsWith(`@`)){p.setAttribute(e.name,e.value);continue}let i=t(e.name),a=e.value===``&&o.has(i)?!0:r(e.value);m.push(`${n(i)}: ${JSON.stringify(a)}`)}for(d.hasAttribute(`x-model`)&&m.push(`modelBound: true`),p.setAttribute(`x-component:${i}`,`{ ${m.join(`, `)} }`);d.firstChild;)p.appendChild(d.firstChild);d.replaceWith(p)}})}f();function f(){e(e=>{d(e)})}};
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

//# sourceMappingURL=autospark.button-group.js.map
