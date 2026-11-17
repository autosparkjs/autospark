(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.anchor`;function a(e){e.components[i]=`<!--
    autospark.anchor 锚点导航（组件库 P3 导航轻件，ADR-0018 清单权威表 navigation 行 /
    ADR-0029 轻件对 ADR）：items（{ key, label, href? }[]，状态引用注入——href 缺省
    key 作锚 id #key）驱动侧边文字列表；scroll + getBoundingClientRect 监听高亮当前锚
    （offset 判定线：锚顶越线即当前，全未达线不高亮——antd 缺省语义）；点击平滑滚动
    到锚（不写 hash：纯滚动语义不打断 smooth，router 隔离 ADR-0018 决策 6 约定 2）+
    change 冒泡 detail = { key }。

    监听清理（grid 的 matchMedia 先例）：scroll/resize 挂全局长命对象 window，组件
    拆卸（unmounted）须摘除——cleanup 存宿主 JS 属性（_ascAnchorCleanup）统一回收。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——affix 形态绑定落编译子树内层 body 上，宿主 fixed 定位经 :has() 驱动。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道全跟随；anchor 不在 data() 声明主题六键，
     内部变体属性（affix）亦禁用六个通道名 -->
<nav
  class="asc-anchor"
  x-define="autospark.anchor"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            current: "",  // 当前锚 key（scroll 监听高亮迁移；change 冒泡 detail={key}——清空也是变化）
            items: [],    // 锚点项 { key, label, href? }[]——状态引用注入（字面量数组死环规避）；声明形态经 data-items 通道兜底
            offset: 0,    // 滚动判定偏移（px）：锚顶越过「offset 线」即视为当前（吸顶导航高度补偿）；点击滚动目标同线对齐
            affix: false, // 固定侧栏形态：fixed 定位右缘悬浮（T4=B：绑定落 body，宿主 :has() 驱动）
        }),
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 指令值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try { this.data.items = JSON.parse(raw); } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // —— 锚目标解析：href 缺省 key 作锚 id（#key）；#id 走 getElementById，
            //    其余形态按选择器 querySelector（目标缺席的项静默跳过）——
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

            // —— 当前锚计算：items 序自上而下扫，最后一个「锚顶已越过判定线」的项即
            //    当前锚（判定线 = offset + 1px 容差；全未达线不高亮——antd 缺省语义，
            //    页顶无高亮、滚入首区亮首项）——
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

            // 高亮迁移 + change 广播（同值短路：滚动事件密集，无谓派发防御）
            const syncActive = () => {
                const k = computeCurrent();
                if (k === String(this.data.current ?? "")) return;
                this.data.current = k;
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { key: k } }));
            };

            // —— scroll/resize 监听（passive；resize 兜布局变化后的位置漂移）——
            const onScroll = () => { syncActive(); };
            const onResize = () => { syncActive(); };
            window.addEventListener("scroll", onScroll, { passive: true });
            window.addEventListener("resize", onResize, { passive: true });
            this.el["_ascAnchorCleanup"] = () => {
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onResize);
            };

            // props 晚注入一跳对齐（家族惯例）：items/offset 落定后再做首同步
            setTimeout(() => { syncActive(); }, 0);

            // 点击（事件委托：克隆体内链接无独立绑定，宿主单点收口）：拦原生 hash 瞬跳
            // + 平滑滚动（目标位置 = 锚顶 + 滚动偏移 - 判定线，reduced-motion 瞬时归位）
            // + 即时高亮迁移（smooth 途中 scroll 事件逐步接管校正）
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
            // 监听清理（防泄漏：scroll/resize 挂全局长命对象 window，组件拆卸须摘监听）；
            // this.el 可能已拆（可选链静默通过）
            const cleanup = this.el?.["_ascAnchorCleanup"];
            if (typeof cleanup === "function") cleanup();
            if (this.el) this.el["_ascAnchorCleanup"] = null;
        },
    }
  <\/script>
  <style global id="autospark-components-anchor">
    .asc-anchor {
      /* 排版基线：字号经主题档位通道（data-size → --auto-font-size 全跟随，button 同范式 ADR-0012） */
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-anchor-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- affix 固定侧栏形态：fixed 右缘悬浮（位置经 --asc-anchor-affix-* 覆盖通道） ---------- */
    .asc-anchor:has(> .asc-anchor-body[data-affix]) {
      position: fixed;
      top: var(--asc-anchor-affix-top, 5rem);
      right: var(--asc-anchor-affix-right, 2rem);
      z-index: var(--asc-anchor-affix-z, 100);
      width: auto;
      max-width: min(30vw, 14rem);
    }

    /* ---------- link：文字列表项（高亮与 tabs 激活同源——--asc-tone 主色中转 + 文字色链一致） ---------- */
    .asc-anchor-link {
      /* 语义色中转（激活/悬停块消费，tabs 同源） */
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
      font-weight: var(--x-font-weight-large, 600); /* 语义层无强调字重变量，直取基础标尺（tabs 同款） */
      border-left-color: var(--asc-tone);
    }
    .asc-anchor-label {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 形态绑定落本层（根上动态绑定不求值，T4=B）；激活态/aria-current 全为克隆体内
         绑定（指令值通道响应）；x-for 容器宿主形态（list 为容器，其子 a 才是逐项克隆
         模板，:key 在容器上）；点击走宿主事件委托（data-key 回查项数据） -->
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
