(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.carousel`;function a(e){e.components[i]=`<div
  class="asc-carousel"
  x-define="autospark.carousel"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            items: [],
            autoplay: 0,
            loop: false,
            indicator: "bottom",
            arrows: true,
            effect: "scroll",
            current: 0,
            settleTarget: -1,
        }),
        methods: {
            prev() { this.goTo(this.data.current - 1); },
            next() { this.goTo(this.data.current + 1); },
            goTo(i) {
                const len = (this.data.items || []).length;
                if (!len) return;
                let t = Math.round(Number(i) || 0);
                if (this.data.loop) t = ((t % len) + len) % len;
                else t = Math.min(len - 1, Math.max(0, t));
                if (t === this.data.current) return;
                this.data.current = t;
                this.emitChange(t);
                if (this.data.effect === "scroll") this.applyScroll(t);
            },
            emitChange(i) {
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { index: i } }));
            },
            applyScroll(i) {
                const track = this.el.querySelector(".asc-carousel-track");
                if (!track) return;
                this.data.settleTarget = i;
                const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
                track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
            },
            onKeydown(e) {
                if (e.key === "ArrowLeft") { e.preventDefault(); this.prev(); }
                else if (e.key === "ArrowRight") { e.preventDefault(); this.next(); }
            },
        },
        mounted() {
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            Object.defineProperty(this.el, "value", {
                get: () => this.data.current,
                set: (v) => { this.goTo(Number(v)); },
                configurable: true,
            });

            const track = this.el.querySelector(".asc-carousel-track");
            const onScroll = () => {
                const w = track ? track.clientWidth : 0;
                if (!track || w <= 0) return;
                const idx = Math.round(track.scrollLeft / w);
                if (this.data.settleTarget >= 0) {
                    if (idx === this.data.settleTarget) this.data.settleTarget = -1;
                    return;
                }
                if (idx !== this.data.current) {
                    this.data.current = idx;
                    this.emitChange(idx);
                }
            };
            track?.addEventListener("scroll", onScroll);

            const onResize = () => {
                if (this.data.effect !== "scroll" || !track) return;
                this.data.settleTarget = this.data.current;
                track.scrollTo({ left: this.data.current * track.clientWidth, behavior: "auto" });
            };
            window.addEventListener("resize", onResize);

            let timer = null;
            const stopAuto = () => { if (timer) { clearInterval(timer); timer = null; } };
            const startAuto = () => {
                stopAuto();
                const ms = Number(this.data.autoplay) || 0;
                if (ms <= 0) return;
                if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
                timer = setInterval(() => {
                    const len = (this.data.items || []).length;
                    if (!len) return;
                    let n = this.data.current + 1;
                    if (n > len - 1) {
                        if (this.data.loop) n = 0;
                        else { stopAuto(); return; }
                    }
                    this.goTo(n);
                }, ms);
            };
            startAuto();
            this.watch("autoplay", () => startAuto());

            this.el["_ascCarouselCleanup"] = () => {
                stopAuto();
                track?.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onResize);
            };
        },
        unmounted() {
            this.el?.["_ascCarouselCleanup"]?.();
        },
    }
  <\/script>
  <style global id="autospark-components-carousel">
    .asc-carousel {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-carousel-font-size, 0.875rem));
    }

    .asc-carousel-body {
      position: relative;
    }
    .asc-carousel-stage {
      position: relative;
      overflow: hidden;
      border-radius: var(--auto-border-radius, var(--asc-carousel-radius, 0.5rem));
      background: var(--auto-third-bgcolor, var(--asc-carousel-bg, rgba(0, 0, 0, 0.04)));
    }
    .asc-carousel-stage:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--auto-primary-color, var(--asc-carousel-primary, #009aff)) 30%, transparent);
    }

    .asc-carousel-body[data-effect="scroll"] .asc-carousel-track {
      display: flex;
      width: 100%;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      overscroll-behavior-x: contain;
    }
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-track::-webkit-scrollbar {
      display: none;
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-stage {
      height: var(--asc-carousel-height, 16rem);
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-track {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-item {
      position: absolute;
      inset: 0;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-item[data-active] {
      opacity: 1;
      visibility: visible;
    }

    .asc-carousel-item {
      position: relative;
      box-sizing: border-box;
    }
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-item {
      flex: 0 0 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }
    .asc-carousel-item-img {
      display: block;
      width: 100%;
      object-fit: var(--asc-carousel-fit, cover);
      user-select: none;
    }
    /* scroll 档无定高链（stage 高度由内容撑）：图片高度缺省随内容，可经
         --asc-carousel-height 统一定高（与 fade 档同一变量） */
    .asc-carousel-body[data-effect="scroll"] .asc-carousel-item-img {
      height: var(--asc-carousel-height, auto);
    }
    .asc-carousel-body[data-effect="fade"] .asc-carousel-item-img {
      height: 100%;
    }
    .asc-carousel-item-html {
      width: 100%;
      height: 100%;
      padding: var(--asc-carousel-html-pad, 1.25em);
      box-sizing: border-box;
      overflow: auto;
      color: var(--auto-color, var(--asc-carousel-color, #606060));
    }
    .asc-carousel-item-caption {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 1.6em 1em 0.7em;
      background: linear-gradient(transparent, var(--asc-carousel-caption-veil, rgba(0, 0, 0, 0.55)));
      color: var(--asc-carousel-caption-color, #ffffff);
      font-size: 0.875em;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .asc-carousel-arrow {
      appearance: none;
      border: none;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border-radius: var(--asc-carousel-arrow-radius, 50%);
      background: var(--asc-carousel-arrow-bg, rgba(0, 0, 0, 0.4));
      color: var(--asc-carousel-arrow-color, #ffffff);
      cursor: pointer;
      z-index: 2;
      opacity: 0;
      transition: opacity 0.2s ease, background-color 0.15s ease;
    }
    .asc-carousel-stage:hover .asc-carousel-arrow,
    .asc-carousel-arrow:focus-visible {
      opacity: 1;
    }
    @media (hover: none) {
      .asc-carousel-arrow { opacity: 1; }
    }
    .asc-carousel-arrow:hover {
      background: var(--asc-carousel-arrow-hover-bg, rgba(0, 0, 0, 0.65));
    }
    .asc-carousel-arrow:disabled {
      opacity: 0;
      cursor: not-allowed;
      pointer-events: none;
    }
    .asc-carousel-arrow[data-arrow="prev"] { left: 0.75rem; }
    .asc-carousel-arrow[data-arrow="next"] { right: 0.75rem; }
    .asc-carousel-arrow[data-arrow="prev"] .asc-carousel-arrow-icon {
      display: inline-block;
      transform: rotate(180deg);
    }
    .asc-carousel-arrow-icon {
      font-size: 1.25rem;
      color: inherit;
    }

    .asc-carousel-indicator {
      position: absolute;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      padding: 0.55em 0;
      z-index: 2;
      pointer-events: none;
    }
    .asc-carousel-body[data-indicator="bottom"] .asc-carousel-indicator { bottom: 0; }
    .asc-carousel-body[data-indicator="top"] .asc-carousel-indicator { top: 0; }
    .asc-carousel-dots {
      display: inline-flex;
      gap: 0.4em;
      pointer-events: auto;
    }
    .asc-carousel-dot {
      appearance: none;
      border: none;
      width: 0.5em;
      height: 0.5em;
      min-width: 6px;
      min-height: 6px;
      padding: 0;
      margin: 0;
      border-radius: var(--asc-carousel-dot-radius, 999px);
      background: var(--asc-carousel-dot-bg, rgba(255, 255, 255, 0.55));
      cursor: pointer;
      transition: width 0.2s ease, background-color 0.2s ease;
    }
    .asc-carousel-dot:hover {
      background: var(--asc-carousel-dot-hover-bg, rgba(255, 255, 255, 0.85));
    }
    .asc-carousel-dot[data-active] {
      width: 1.2em;
      background: var(--asc-carousel-dot-active-bg, #ffffff);
    }

    [dark] .asc-carousel-stage,
    [data-dark] .asc-carousel-stage {
      background: var(--auto-third-bgcolor, var(--asc-carousel-bg, rgba(255, 255, 255, 0.1)));
    }
    [dark] .asc-carousel-item-html,
    [data-dark] .asc-carousel-item-html {
      color: var(--auto-color, var(--asc-carousel-color, #fafafa));
    }

    @media (prefers-reduced-motion: reduce) {
      .asc-carousel-body[data-effect="fade"] .asc-carousel-item { transition: none; }
      .asc-carousel-body[data-effect="scroll"] .asc-carousel-track { scroll-behavior: auto; }
      .asc-carousel-dot,
      .asc-carousel-arrow { transition: none; }
    }
  </style>
  <div
    class="asc-carousel-body"
    :data-effect="effect === 'fade' ? 'fade' : 'scroll'"
    :data-indicator="indicator === false ? 'off' : (indicator === 'top' ? 'top' : 'bottom')"
  >
    <div
      class="asc-carousel-stage"
      tabindex="0"
      role="region"
      aria-roledescription="carousel"
      @keydown="onKeydown($event)"
    >
      <div class="asc-carousel-track" x-for="item of items">
        <div class="asc-carousel-item" :data-active="$index === current ? '' : null">
          <img
            class="asc-carousel-item-img"
            x-show="typeof item === 'string' || (item && !!item.src)"
            :src="typeof item === 'string' ? item : (item && item.src) || ''"
            :alt="typeof item === 'object' && item !== null ? (item.alt ?? '') : ''"
            draggable="false"
          />
          <div
            class="asc-carousel-item-html"
            x-show="typeof item === 'object' && item !== null && !item.src && !!item.html"
            x-html="typeof item === 'object' && item !== null ? (item.html ?? '') : ''"
          ></div>
          <div
            class="asc-carousel-item-caption"
            x-show="typeof item === 'object' && item !== null && !!item.caption"
            x-text="typeof item === 'object' && item !== null ? (item.caption ?? '') : ''"
          ></div>
        </div>
      </div>
      <button
        type="button"
        class="asc-carousel-arrow"
        data-arrow="prev"
        x-show="arrows"
        aria-label="上一页"
        :disabled="!loop && current <= 0"
        @click="prev()"
      >
        <i class="asc-carousel-arrow-icon" x-icon="'arrow'"></i>
      </button>
      <button
        type="button"
        class="asc-carousel-arrow"
        data-arrow="next"
        x-show="arrows"
        aria-label="下一页"
        :disabled="!loop && current >= items.length - 1"
        @click="next()"
      >
        <i class="asc-carousel-arrow-icon" x-icon="'arrow'"></i>
      </button>
    </div>
    <div class="asc-carousel-indicator" x-show="indicator !== false">
      <div class="asc-carousel-dots" x-for="item of items">
        <button
          type="button"
          class="asc-carousel-dot"
          :data-active="$index === current ? '' : null"
          :aria-label="'第 ' + ($index + 1) + ' 页'"
          @click="goTo($index)"
        ></button>
      </div>
    </div>
  </div>
</div>
`,e.precompile?.(e=>{for(let a of Array.from(e.el.querySelectorAll(`x-carousel`))){let e=document.createElement(`div`),o=Array.from(a.children).filter(e=>e.tagName.toLowerCase()===`x-carousel-item`),s=a.getAttribute(`items`),c=a.hasAttribute(`:items`);if(a.removeAttribute(`items`),(o.length>0||s!=null&&s!==``)&&!c){let t=null;if(o.length)t=o.map(e=>{let t={},n=e.getAttribute(`src`),r=e.getAttribute(`alt`),i=e.getAttribute(`caption`);n!=null&&(t.src=n),r!=null&&(t.alt=r),i!=null&&(t.caption=i);let a=(e.innerHTML||``).trim();return a!==``&&(t.html=a),t});else try{let e=JSON.parse(s);Array.isArray(e)&&(t=e)}catch{}t&&e.setAttribute(`data-items`,JSON.stringify(t))}for(let e of o)e.remove();let l=[];for(let i of Array.from(a.attributes))i.name.startsWith(`:`)?l.push(`${n(t(i.name.slice(1)))}: (${i.value})`):i.name===`class`||i.name===`style`||i.name===`id`||i.name.startsWith(`data-`)||i.name.startsWith(`x-`)||i.name.startsWith(`@`)?e.setAttribute(i.name,i.value):i.value===``?l.push(`${n(t(i.name))}: true`):l.push(`${n(t(i.name))}: ${JSON.stringify(r(i.value))}`);e.setAttribute(`x-component:${i}`,`{ ${l.join(`, `)} }`),a.replaceWith(e)}})}o();function o(){e(e=>{a(e)})}};
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

//# sourceMappingURL=autospark.carousel.js.map
