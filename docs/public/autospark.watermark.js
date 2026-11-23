(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.watermark`;function a(e){e.components[i]=`<div
  class="asc-watermark"
  x-define="autospark.watermark"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            content: "",
            font: "",
            fontSize: 16,
            color: "",
            opacity: 1,
            rotate: -22,
            gap: null,
            zIndex: 9,
            fullPage: false,
        }),
        mounted() {
            const el = this.el;
            let layer = null;
            let layerInBody = false;
            let lastSign = null;

            const normLines = (v) => {
                if (Array.isArray(v)) return v.map((x) => String(x ?? "")).filter((s) => s !== "");
                if (typeof v === "string" && v.trim() !== "") {
                    const t = v.trim();
                    if (t.startsWith("[")) {
                        try {
                            const parsed = JSON.parse(t);
                            if (Array.isArray(parsed)) {
                                return parsed.map((x) => String(x ?? "")).filter((s) => s !== "");
                            }
                        } catch { /* 非法 JSON 当普通文本 */ }
                    }
                    return [v];
                }
                return [];
            };

            const normGap = (v) => {
                if (typeof v === "number" && isFinite(v)) return [v, v];
                if (Array.isArray(v) && v.length === 2) {
                    const gx = Number(v[0]), gy = Number(v[1]);
                    return [isFinite(gx) ? gx : 100, isFinite(gy) ? gy : 100];
                }
                return [100, 100];
            };

            const seedDeclared = () => {
                const rawContent = el.getAttribute("data-content");
                if (rawContent != null && (this.data.content == null || this.data.content === "")) {
                    try { this.data.content = JSON.parse(rawContent); } catch { /* 非法 JSON 静默忽略 */ }
                    el.removeAttribute("data-content");
                }
                const rawGap = el.getAttribute("data-gap");
                if (rawGap != null && this.data.gap == null) {
                    try { this.data.gap = JSON.parse(rawGap); } catch { /* 非法 JSON 静默忽略 */ }
                    el.removeAttribute("data-gap");
                }
            };

            const syncContainer = () => {
                if (!layer) return;
                const wantFull = !!this.data.fullPage;
                if (wantFull && !layerInBody) {
                    document.body.appendChild(layer);
                    layerInBody = true;
                } else if (!wantFull && layerInBody) {
                    el.appendChild(layer);
                    layerInBody = false;
                }
                if (wantFull) layer.style.setProperty("position", "fixed");
                else layer.style.removeProperty("position");
            };

            const draw = () => {
                if (!layer || !el.isConnected) return;
                const lines = normLines(this.data.content);
                const rotate = Number(this.data.rotate);
                const rot = isFinite(rotate) ? rotate : 0;
                const [gx, gy] = normGap(this.data.gap);
                const fontSize = Number(this.data.fontSize);
                const fs = isFinite(fontSize) && fontSize > 0 ? fontSize : 16;
                const sign = JSON.stringify([lines, String(this.data.font ?? ""), fs, String(this.data.color ?? ""), this.data.opacity, rot, gx, gy, !!this.data.fullPage]);
                if (sign === lastSign) return;
                lastSign = sign;

                syncContainer();
                if (this.data.color) layer.style.setProperty("color", String(this.data.color));
                else layer.style.removeProperty("color");
                const op = Number(this.data.opacity);
                layer.style.opacity = String(isFinite(op) ? op : 1);
                const z = Number(this.data.zIndex);
                layer.style.zIndex = String(isFinite(z) ? z : 9);

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext ? canvas.getContext("2d") : null;
                if (!ctx || !lines.length) {
                    layer.style.backgroundImage = "";
                    layer.style.backgroundSize = "";
                    return;
                }
                const computed = getComputedStyle(layer);
                const family = (computed.fontFamily && String(computed.fontFamily).trim()) || "sans-serif";
                const font = this.data.font
                    ? String(this.data.font)
                    : \`\${fs}px \${family}\`;
                ctx.font = font;
                const widths = lines.map((line) => ctx.measureText(line).width);
                const textW = Math.ceil(Math.max(...widths, 1));
                const lineH = Math.ceil(fs * 1.3);
                const textH = lineH * lines.length;
                const rad = (rot * Math.PI) / 180;
                const cos = Math.abs(Math.cos(rad));
                const sin = Math.abs(Math.sin(rad));
                const w = Math.ceil(textW * cos + textH * sin) + 8;
                const h = Math.ceil(textW * sin + textH * cos) + 8;
                canvas.width = w;
                canvas.height = h;
                ctx.font = font;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = (computed.color && String(computed.color).trim()) || "rgba(0, 0, 0, 0.15)";
                ctx.translate(w / 2, h / 2);
                ctx.rotate(rad);
                lines.forEach((line, i) => {
                    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineH);
                });
                layer.style.backgroundImage = \`url(\${canvas.toDataURL("image/png")})\`;
                layer.style.backgroundRepeat = "repeat";
                layer.style.backgroundSize = \`\${w + gx}px \${h + gy}px\`;
                layer.style.backgroundPosition = "0 0";
            };

            const redraw = () => { draw(); };
            setTimeout(() => {
                if (!el.isConnected) return;
                seedDeclared();
                layer = el.querySelector(":scope > .asc-watermark-layer");
                this.watch("content", redraw);
                this.watch("font", redraw);
                this.watch("fontSize", redraw);
                this.watch("color", redraw);
                this.watch("opacity", redraw);
                this.watch("rotate", redraw);
                this.watch("gap", redraw);
                this.watch("zIndex", redraw);
                this.watch("fullPage", redraw);
                draw();
            }, 0);

            el["_ascWatermarkCleanup"] = () => {
                if (layer && layerInBody) layer.remove();
            };
        },
        unmounted() {
            const cleanup = this.el?.["_ascWatermarkCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascWatermarkCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-watermark">
    .asc-watermark {
      position: relative;
      display: block;
    }
    .asc-watermark:has(> .asc-watermark-body[data-full-page]) {
      display: contents;
    }

    .asc-watermark-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      color: var(--auto-secondary-color, var(--asc-watermark-color, rgba(0, 0, 0, 0.15)));
      font-family: var(--auto-font-family, var(--asc-watermark-font-family, sans-serif));
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变）。
       fullPage 层挂 body 时仅 [dark] 全局通道命中（data-dark 局部容器域不覆盖 body 子树——边界声明） */
    [dark] .asc-watermark-layer,
    [data-dark] .asc-watermark-layer {
      color: var(--auto-secondary-color, var(--asc-watermark-color, rgba(255, 255, 255, 0.18)));
    }
  </style>
  <div class="asc-watermark-body" :data-full-page="fullPage ? '' : null">
    <div class="asc-watermark-content" x-slot></div>
  </div>
  <div class="asc-watermark-layer"></div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-watermark`))){let e=document.createElement(`div`),o=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?o.push(`${n(t(i.name.slice(1)))}: (${i.value})`):(i.name===`content`||i.name===`gap`)&&i.value.trim().startsWith(`[`)?e.setAttribute(`data-${i.name}`,i.value):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):o.push(`${n(t(i.name))}: ${JSON.stringify(i.value===``||r(i.value))}`);for(e.setAttribute(`x-component:${i}`,`{ ${o.join(`, `)} }`);a.firstChild;)e.appendChild(a.firstChild);a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.watermark.js.map
