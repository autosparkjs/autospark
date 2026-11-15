(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){return e.replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function n(e){return/^[A-Za-z_$][\w$]*$/.test(e)?e:JSON.stringify(e)}function r(e){let t=e.trim();if(t===``)return``;if(/^-?\d+(\.\d+)?$/.test(t))return Number(t);if(t===`true`)return!0;if(t===`false`)return!1;if(t.startsWith(`{`)||t.startsWith(`[`))try{return JSON.parse(t)}catch{return e}return e}var i=`autospark.collapse`;function a(e){e.components[i]=`<!--
    autospark.collapse 折叠面板组（组件库 P2 展示件，ADR-0018 清单权威表 display 行）：
    面板元信息双形态——items 数据形态（content HTML 字符串经 x-html）/ 子元素声明形态
    （<x-collapse-item> 经 index.ts precompile 展开为面板结构、默认插槽投影）。

    开合驱动（两形态统一 JS 通道）：展开 key 集 = 组件 data.value（受控数组 + el.value
    桥 + change detail={value}）；mounted 的同步通道把开合态写到每个面板容器的
    data-open 属性 + 各 header 的 aria-expanded——CSS 消费 data-open 驱动内容体
    grid-template-rows 0fr→1fr 高度过渡与图标旋转（DOM 子树恒保留：表单输入态/
    滚动位不丢，x-if 摘挂语义的对立面）。头部点击经组件根 JS 委托（数据形态克隆体
    与声明形态投影结构两通道统一），手风琴互斥在 toggle 内收敛（accordion：开新关旧）。

    与 x-foldable 的边界：x-foldable 是 nowrap flex 容器的行内溢出折叠（溢出子元素收进
    more 弹出面板，ADR-0098），无受控 value 集/无互斥/弹出非原地展开——与本件「内容面板
    垂直展开」语义不同构，故自实现 CSS 高度过渡（详见 index.ts 文件头取舍声明）。

    事件出口（组件默认封闭，事件经冒泡到外层消费）：
    - change：头部切换后冒泡，detail = { value }（切换后的新 key 数组）；外部 props
      驱动的 value 变化不广播（防回环）。
    - input：非冒泡，x-model 回写通道（与 change 同时机）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——expandIconPosition 绑定（:data-expand-position）落在编译子树的内层
    body 上，header 布局按 body 的数据属性命中 start/end 形态块。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized 六键，
     名即通道）自动获得——字号档位经主题通道 data-size 全跟随，collapse 不设自有字号
     属性；data() 不得声明主题六键，组件内部变体属性亦禁用六个通道名
     （data-expand-position 为自有变体轴） -->
<div
  class="asc-collapse"
  x-define="autospark.collapse"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: [],           // 展开 key 集（受控：数组注入；逗号/空格分隔字符串归一为数组；el.value 桥 + change detail={value}）
            items: [],           // 数据形态面板 { key, title, disabled?, content? }[]——状态引用注入（字面量数组死环规避）；content 为 HTML 字符串经 x-html；声明形态经 data-items 通道兜底
            accordion: false,   // 手风琴互斥：开新面板时关闭已开面板（同时仅一开）
            expandIconPosition: "end", // 展开图标位置：end 标题右（缺省）| start 标题左
        }),
        methods: {
            // 值归一：数组 | 逗号/空格分隔字符串 → string[]（过滤空段）
            toArray(v) {
                if (v == null) return [];
                if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
                return String(v).split(/[,\\s]+/).map((x) => x.trim()).filter(Boolean);
            },
            // 面板切换（头部点击共用通道）：已开移除；未开追加（accordion 互斥——新集只含
            // 新 key）；写 value 触发 watch 同步通道 → 双派发（input→x-model 回写非冒泡；
            // change→外层消费 detail={value} 冒泡）
            toggle(key) {
                if (key == null || String(key) === "") return;
                const k = String(key);
                const cur = this.toArray(this.data.value);
                const next = cur.includes(k) ? cur.filter((x) => x !== k) : (this.data.accordion ? [k] : cur.concat(k));
                this.data.value = next;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: next } }));
            },
            // 开合态同步通道：每个面板容器 data-open 属性 + 各 header aria-expanded
            // （CSS 消费 data-open 驱动高度过渡与图标旋转；幂等——同值重写无副作用）
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
            // 头部点击委托（组件根承载——数据形态克隆体与声明形态投影结构两通道统一；
            // 原生 disabled 按钮点击不派发 click，天然拦截）
            onRootClick(event) {
                const t = event.target instanceof Element ? event.target : null;
                const header = t ? t.closest(".asc-collapse-header") : null;
                if (!header || !this.el.contains(header)) return;
                this.toggle(header.getAttribute("data-key"));
            },
        },
        mounted() {
            // 声明形态兜底（precompile 变换落盘的 data-items JSON 字符串）：items props
            // 缺席时解析写组件 data（x-for 值通道响应，随写随渲染）；props 在场恒优先
            const raw = this.el.getAttribute("data-items");
            if ((!this.data.items || !this.data.items.length) && raw) {
                try {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) this.data.items = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省空组） */ }
                this.el.removeAttribute("data-items");
            }

            // 值归一（分隔字符串 / 数字 key 语域 → string[]）
            this.data.value = this.toArray(this.data.value);

            // el.value 劫持桥（受控 value 的 DOM 通道：x-model / 程序读写皆经此）——
            // 读 = 展开 key 数组快照；写 = 数组/分隔字符串归一（受控写经 watch 同步，不广播）
            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => this.toArray(this.data.value).slice(),
                set: (v) => { this.data.value = this.toArray(v); },
                configurable: true,
            });

            // 开合同步通道：初始 + value/items 订阅（items 整体替换后克隆体重建，
            // 延后一跳再同步——x-for 重渲染经调度器微任务合并；同步幂等）
            this.syncOpenState();
            this.watch("value", () => this.syncOpenState());
            this.watch("items", () => setTimeout(() => this.syncOpenState(), 0));

            // 头部点击委托
            this.el.addEventListener("click", (e) => this.onRootClick(e));

            // 一跳首对齐（mounted 时 x-model expando 可能未落定，家族惯例）+
            // 克隆体渲染后的开合态补同步
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
    /* 宿主：透明块壳（字号基线随 data-size 档位全跟随，button 同范式 ADR-0012） */
    .asc-collapse {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-collapse-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- body：面板组容器（编译子树内层，绑定可求值）—— 组级边框 + 圆角 ---------- */
    .asc-collapse-body {
      --asc-line: var(--auto-border-color, var(--asc-collapse-border-color, #d9d9d9));
      display: block;
      border: var(--auto-border-size, var(--asc-collapse-border-size, 1px)) solid var(--asc-line);
      border-radius: var(--auto-border-radius, var(--asc-collapse-radius, 0.5rem));
      background: var(--auto-bgcolor, var(--asc-collapse-bg, #ffffff));
      overflow: hidden; /* 圆角裁切（内容体展开动画不溢出边框） */
    }
    /* 数据形态克隆容器：display:contents（克隆面板直接参与 body 布局，包裹层不留盒） */
    .asc-collapse-items {
      display: contents;
    }
    /* 声明形态投影出口：display:contents（投影面板直接参与 body 布局，包裹层不留盒） */
    .asc-collapse-slot {
      display: contents;
    }
    .asc-collapse-slot:empty {
      display: none;
    }
    /* 空组不占位（数据形态空渲染 + 声明形态无投影 → 组级壳隐藏） */
    .asc-collapse-body:not(:has(.asc-collapse-item)) {
      display: none;
    }

    /* ---------- 面板项：header + content（两形态同名结构，CSS 单源） ---------- */
    /* 面板间隔线：同容器内相邻项 + 两形态容器交界（display:contents 不改变 DOM 相邻语义） */
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
    /* 标题：flex:1 把图标推向对侧 */
    .asc-collapse-title {
      flex: 1;
      min-width: 0;
      font-weight: var(--x-font-weight-medium, 500);
    }
    /* 展开图标：内置 arrow（右向），开合旋转（闭=右、开=下 90°） */
    .asc-collapse-icon {
      display: inline-flex;
      color: var(--auto-third-color, var(--asc-collapse-icon-color, rgba(0, 0, 0, 0.35)));
      transform: rotate(0deg);
      transition: transform 0.2s ease;
    }
    .asc-collapse-item[data-open] .asc-collapse-icon {
      transform: rotate(90deg);
    }
    /* 图标位置 start：标题与图标对调（row-reverse + 标题不再 flex:1 推挤） */
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-header {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .asc-collapse-body[data-expand-position="start"] .asc-collapse-title {
      flex: 0 1 auto;
      text-align: end;
    }

    /* ---------- 内容体：grid 高度过渡（0fr→1fr，DOM 恒保留——表单态/滚动位不丢） ---------- */
    .asc-collapse-content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.25s ease;
    }
    .asc-collapse-item[data-open] > .asc-collapse-content {
      grid-template-rows: 1fr;
    }
    /* 裁剪层：grid-rows 过渡的标准结构（单子层 overflow hidden + min-height 0） */
    .asc-collapse-inner {
      overflow: hidden;
      min-height: 0;
      padding: 0 calc(0.8em + 0.2em);
    }
    .asc-collapse-item[data-open] > .asc-collapse-content > .asc-collapse-inner {
      padding-block: 0.6em;
    }
    /* 动效可及性：减动效偏好停播过渡（瞬时开合） */
    @media (prefers-reduced-motion: reduce) {
      .asc-collapse-content,
      .asc-collapse-icon {
        transition: none;
      }
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
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
  <!-- 图标位置绑定落本层（T4=B：根上动态绑定不求值）；两形态面板结构同名类，
         开合态经 data-open 属性通道由 CSS 驱动（见文件头注释） -->
  <div class="asc-collapse-body" :data-expand-position="expandIconPosition">
    <!-- 数据形态：items 状态引用驱动（x-for 容器宿主形态——容器不克隆、子元素为逐项
             克隆模板；克隆模板为单包裹层 .asc-collapse-item 承载 data-key/data-open，
             content HTML 字符串经 x-html——富模板（绑定/指令）请用子元素声明形态） -->
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
    <!-- 声明形态：precompile 展开的面板结构经默认插槽投影（display:contents 出口，
             投影面板直接参与 body 布局；出口紧凑书写——:empty 隐藏纪律） -->
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
