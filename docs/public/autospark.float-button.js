(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.float-button`;function a(e){e.components[i]=`<!--
    autospark.float-button 悬浮按钮（组件库 P3 other 分类首件，ADR-0018 清单权威表
    other 行 / 修订吸收原 backtop 独立条目——antd 5 同款路线 / ADR-0029 轻件对 ADR）：
    fixed 右下悬浮钮。type 双形态：default 常规（icon 必选 + click 原生冒泡事件出口）|
    back-to-top 回顶（滚动超 visibilityHeight 阈值渐显 + 点击回顶 window.scrollTo smooth）。

    监听清理（grid 的 matchMedia 先例）：scroll 挂全局长命对象 window，组件拆卸
    （unmounted）须摘除——cleanup 存宿主 JS 属性（_ascFloatButtonCleanup）统一回收；
    type 动态切换时旧监听先行摘除再按新形态重挂（幂等）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——形态绑定（:data-type / :data-shape）落编译子树内层 body 上，宿主经
    :has() 驱动；渐显标记（data-visible）与定位偏移（right/bottom）为 JS 通道写宿主。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——阴影/圆角/字号档位经主题通道全跟随（阴影即走 data-shadow）；
     float-button 不在 data() 声明主题六键，内部变体属性（type/shape）亦禁用六个通道名 -->
<button
  type="button"
  class="asc-float-button"
  x-define="autospark.float-button"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            type: "default",        // 形态：default 常规（icon 必选）| back-to-top 回顶（渐显 + 点击回顶）
            icon: "",               // 图标名（x-icon 渲染）；back-to-top 缺省内置 arrow 上旋指顶，常规形态必选（空值渲染 default 占位图）
            visibilityHeight: 400,  // back-to-top 显现阈值（px）：滚动超出渐显、回落隐藏
            right: 40,              // 右缘偏移（number → px；string 带单位原样）——JS 通道写宿主内联，覆盖 CSS 缺省
            bottom: 40,             // 下缘偏移（同上）
            shape: "circle",        // 形状：circle 正圆（缺省）| square 圆角方（圆角走 --auto-border-radius 档位）
        }),
        mounted() {
            const el = this.el;

            // —— 定位偏移 JS 通道（number → px 归一；非空 string 带单位原样；空值不写走 CSS 缺省）——
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

            // —— back-to-top 渐显判定：滚动位置 ≥ visibilityHeight 落宿主 data-visible
            //    （CSS 渐显；scrollY 通道兜 documentElement.scrollTop）——
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

            // —— scroll 监听生命周期（仅 back-to-top 形态挂载；type 动态切换重挂，
            //    常规形态恒显——data-visible 摘除）——
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
            // props 晚注入一跳对齐（家族惯例）：type/visibilityHeight 落定后再挂监听
            setTimeout(() => { bindScroll(); }, 0);
            this.watch("right", () => { syncPos(); });
            this.watch("bottom", () => { syncPos(); });
            this.watch("type", () => { setTimeout(bindScroll, 0); });
            this.watch("visibilityHeight", () => { syncVisible(); });

            // —— 点击出口：常规形态原生 click 冒泡即事件出口（外层 @click 消费，组件
            //    默认封闭）；back-to-top 内建回顶（reduced-motion 瞬时归位）——
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
            // 监听清理（防泄漏：scroll 挂全局长命对象 window，组件拆卸须摘监听）；
            // this.el 可能已拆（可选链静默通过）
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

    /* ---------- square 形态：圆角走 --auto-border-radius 档位 ---------- */
    .asc-float-button:has(> .asc-float-button-body[data-shape="square"]) {
      border-radius: var(--auto-border-radius, var(--asc-float-button-radius, 0.5rem));
    }

    /* ---------- 带 label：宽幅胶囊形态（label 非空时自适应放宽） ---------- */
    .asc-float-button:has(.asc-float-button-label:not(:empty)) {
      width: auto;
      min-width: var(--asc-float-button-size, 2.5rem);
      padding: 0 0.875em;
    }

    /* ---------- back-to-top 渐显：未越阈值隐藏（opacity/位移渐出 + visibility 收尾 + 交互阻断） ---------- */
    .asc-float-button:has(> .asc-float-button-body[data-type="back-to-top"]):not([data-visible]) {
      opacity: 0;
      visibility: hidden;
      transform: translateY(0.5rem);
      pointer-events: none;
    }

    /* ---------- reduced-motion：停播过渡（渐显/交互动效全部瞬时） ---------- */
    @media (prefers-reduced-motion: reduce) {
      .asc-float-button {
        transition: none;
      }
    }

    /* ---------- 图标与文案 ---------- */
    .asc-float-button-icon {
      display: inline-flex;
      font-size: 1.25em; /* 图标随档位字号放大（x-icon 默认 1em，悬浮钮取大半档） */
    }
    /* back-to-top 缺省图标：内置 arrow 上旋指顶（自定义 icon 不旋——data-default-icon 仅空 icon 落标） */
    .asc-float-button-body[data-type="back-to-top"] .asc-float-button-icon[data-default-icon] {
      transform: rotate(-90deg);
    }
    .asc-float-button-label:empty {
      display: none;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-float-button,
    [data-dark] .asc-float-button {
      background: var(--auto-bgcolor, var(--asc-float-button-bg, #3a3a3a));
      color: var(--auto-color, var(--asc-float-button-color, #fafafa));
      border-color: var(--auto-border-color, var(--asc-float-button-border, #52525b));
      box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.4)));
    }
  </style>
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；data-default-icon 标记空 icon
         （缺省 arrow 的上旋判定）；默认插槽出口承载可选 label（无内容不占位） -->
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
