(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.image-viewer`]=`<div
  class="asc-image-viewer"
  x-define="autospark.image-viewer"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            images: [],
            visible: false,
            index: 0,
            scale: 1,
            rotate: 0,
        }),
        methods: {
            onPrev() {
                if (this.data.index <= 0) return;
                this.data.index = this.data.index - 1;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: this.data.index } }));
            },
            onNext() {
                if (this.data.index >= this.data.images.length - 1) return;
                this.data.index = this.data.index + 1;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: this.data.index } }));
            },
            onZoom(delta) {
                const next = Math.min(8, Math.max(0.2, Number(this.data.scale) + delta));
                if (next === this.data.scale) return;
                this.data.scale = next;
            },
            onRotate(delta) {
                this.data.rotate = Number(this.data.rotate) + delta;
            },
            onReset() {
                this.data.scale = 1;
                this.data.rotate = 0;
            },
            onRequestClose() {
                this.el.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            },
            onKeydown(e) {
                if (!this.data.visible) return;
                if (e.key === "ArrowLeft") { e.preventDefault(); this.onPrev(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); this.onNext(); }
                else if (e.key === "Escape") { e.preventDefault(); this.onRequestClose(); }
                else if (e.key === "+" || e.key === "=") { e.preventDefault(); this.onZoom(0.2); }
                else if (e.key === "-") { e.preventDefault(); this.onZoom(-0.2); }
            },
        },
        mounted() {
            const preload = (i) => {
                const url = (this.data.images || [])[i];
                if (typeof url === "string" && url !== "") { const img = new Image(); img.src = url; }
            };
            const preloadNeighbors = () => { preload(this.data.index - 1); preload(this.data.index + 1); };
            preloadNeighbors();

            let lastIndex = this.data.index;
            this.watch("index", ({ value: v }) => {
                if (v === lastIndex) return;
                lastIndex = v;
                this.data.scale = 1;
                this.data.rotate = 0;
                preloadNeighbors();
            });

            let wasOpen = !!this.data.visible;
            this.watch("visible", ({ value }) => {
                const open = value === true;
                if (open && !wasOpen) this.onReset();
                wasOpen = open;
            });

            const onDocKey = (e) => this.onKeydown(e);
            document.addEventListener("keydown", onDocKey);
            this.el["_ascImageViewerCleanup"] = () => document.removeEventListener("keydown", onDocKey);
        },
        unmounted() {
            this.el?.["_ascImageViewerCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-image-viewer">
    .asc-image-viewer {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-image-viewer-font-size, 0.875rem));
    }

    .asc-image-viewer-layer {
      position: fixed;
      inset: 0;
      z-index: var(--asc-image-viewer-z, 1000);
      animation: asc-image-viewer-in 0.18s ease;
    }
    @keyframes asc-image-viewer-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .asc-image-viewer-mask {
      position: absolute;
      inset: 0;
      background: var(--asc-image-viewer-mask, rgba(0, 0, 0, 0.72));
    }
    .asc-image-viewer-canvas {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .asc-image-viewer-img {
      max-width: calc(100% - 7rem);
      max-height: calc(100% - 6rem);
      object-fit: contain;
      transition: transform 0.2s ease;
      user-select: none;
    }

    .asc-image-viewer-btn {
      appearance: none;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      box-sizing: border-box;
      border-radius: var(--asc-image-viewer-btn-radius, 0.375rem);
      background: var(--asc-image-viewer-btn-bg, rgba(0, 0, 0, 0.5));
      color: var(--asc-image-viewer-btn-color, #ffffff);
      cursor: pointer;
      transition: background-color 0.15s ease, opacity 0.15s ease;
    }
    .asc-image-viewer-btn:hover {
      background: var(--asc-image-viewer-btn-hover-bg, rgba(0, 0, 0, 0.72));
    }
    .asc-image-viewer-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .asc-image-viewer-btn svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .asc-image-viewer-toolbar {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.375rem;
      z-index: 2;
    }
    .asc-image-viewer-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--asc-image-viewer-nav-radius, 50%);
      z-index: 2;
    }
    .asc-image-viewer-nav svg {
      width: 1.5rem;
      height: 1.5rem;
    }
    .asc-image-viewer-nav[data-nav="prev"] { left: 1rem; }
    .asc-image-viewer-nav[data-nav="next"] { right: 1rem; }
    .asc-image-viewer-counter {
      position: absolute;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      padding: 0.25em 0.9em;
      border-radius: var(--asc-image-viewer-counter-radius, 0.375rem);
      background: var(--asc-image-viewer-counter-bg, rgba(0, 0, 0, 0.5));
      color: var(--asc-image-viewer-counter-color, #ffffff);
      font-size: 0.875em;
      letter-spacing: 0.08em;
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-image-viewer-layer { animation: none; }
      .asc-image-viewer-img { transition: none; }
      .asc-image-viewer-btn { transition: none; }
    }
  </style>
  <div
    class="asc-image-viewer-layer"
    role="dialog"
    aria-modal="true"
    aria-label="图片预览"
    x-show="visible && images.length > 0"
  >
    <div class="asc-image-viewer-mask" @click="onRequestClose()"></div>
    <div class="asc-image-viewer-canvas">
      <img
        class="asc-image-viewer-img"
        :src="images[index] || ''"
        alt=""
        draggable="false"
        :style="'transform: scale(' + scale + ') rotate(' + rotate + 'deg)'"
      />
    </div>
    <div class="asc-image-viewer-toolbar">
      <button type="button" class="asc-image-viewer-btn" title="缩小" aria-label="缩小" @click="onZoom(-0.2)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path><path d="M8 11h6"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="放大" aria-label="放大" @click="onZoom(0.2)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path><path d="M11 8v6"></path><path d="M8 11h6"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="向左旋转" aria-label="向左旋转" @click="onRotate(-90)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="向右旋转" aria-label="向右旋转" @click="onRotate(90)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="重置（1:1）" aria-label="重置" @click="onReset()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>
      </button>
      <button type="button" class="asc-image-viewer-btn" title="关闭" aria-label="关闭" @click="onRequestClose()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
      </button>
    </div>
    <button
      type="button"
      class="asc-image-viewer-btn asc-image-viewer-nav"
      data-nav="prev"
      title="上一张"
      aria-label="上一张"
      x-show="images.length > 1"
      :disabled="index <= 0"
      @click="onPrev()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
    </button>
    <button
      type="button"
      class="asc-image-viewer-btn asc-image-viewer-nav"
      data-nav="next"
      title="下一张"
      aria-label="下一张"
      x-show="images.length > 1"
      :disabled="index >= images.length - 1"
      @click="onNext()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
    </button>
    <div class="asc-image-viewer-counter" x-text="(index + 1) + ' / ' + images.length"></div>
  </div>
</div>
`}n();function n(){e(e=>{t(e)})}};
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

//# sourceMappingURL=autospark.image-viewer.js.map
