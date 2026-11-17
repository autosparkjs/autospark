(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.pagination`]=`<!--
    autospark.pagination 分页器（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
    受控 page（el.value 桥 + change detail={page,pageSize} + input 回写 x-model）+
    pageSize / total / pageSizes（条数切换 select）/ simple（极简形态）。

    页码窗口（watch 维护幂等：序列化签名比对、同值不写——i18n refresh 等同值重跑不污染）：
    总页数 <= 7 全量直出；> 7 时 1 + [省略号] + 当前页±2 五宽窗口 + [省略号] + 末页。
    上/下一页与首/末页按钮：单/双箭头形态（内置 arrow 图标旋转 180° 得左向），边界禁用。

    内置文案走 i18n 词典（ADR-0018 决策 6 约定 1）：pagination.first / prev / next /
    last / total（"共 {n} 条"插值）/ pageSize（"{n} 条/页"插值）——t 经表达式求值器注入，
    键等值判定（未装 i18n / 词典无键时 t(键)===键）回退硬编码中文。

    与 x-for.paging 的边界（ADR-0018 复用素材列）：.paging 是数据层切片机制（loader /
    :data-paging 双向 / 项内 $page），本组件是页码 UI 控件——组合配方：x-for.paging 容器
    :data-paging="paging" 绑状态对象，本组件 @change="paging.page = $event.detail.page"
    一行打通（组件文档配方节）。

    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态绑定
    不会求值——形态绑定（:data-simple）落在编译子树的内层 body 上。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得——字号档位经主题通道 data-size 全跟随（分页器高度/间距随字号缩放），
     pagination 不设自有字号属性（button 同范式 ADR-0012）；data() 不得声明主题六键，
     组件内部变体属性亦禁用六个通道名 -->
<div
  class="asc-pagination"
  x-define="autospark.pagination"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            page: 1,       // 受控当前页（1-based；越界自动钳位到 [1,pageCount]；el.value 桥 + change detail={page,pageSize}）
            pageSize: 10,  // 每页条数（pageSizes 切换时内部写 1 重置页码）
            total: 0,      // 总条数（0 条时单页空态：仅页码 1、翻页全禁用）
            pageSizes: [], // 每页条数切换数组（状态引用注入——字面量数组死环规避；元素名形态经 data-page-sizes JSON 通道）
            simple: false, // 极简形态：‹ 3 / 20 ›（隐藏总数/条数切换/页码窗口/首末钮）
            pages: [],     // 页码窗口项 { type:'page'|'more', page, key }[]——watch 维护（重算见 computePages）
            // computed 简写（普通函数值即计算属性，仅限单表达式）：总页数（total/pageSize
            // 向上取整，至少 1——total=0 的单页空态；除零/NaN 归 1）
            pageCount: (s) => Math.max(1, Math.ceil((Number(s.total) || 0) / (Number(s.pageSize) || 10)) || 1),
        }),
        methods: {
            // 静默归位：钳位 [1,pageCount] 写 page，返回是否变化（el.value 桥 / props 对齐共用）
            applyPage(n) {
                const pc = Number(this.data.pageCount) || 1;
                const target = Math.min(Math.max(1, Number(n) || 1), pc);
                if (target === Number(this.data.page)) return false;
                this.data.page = target;
                return true;
            },
            // 翻页（页码/首/末/上下页按钮共用通道）：静默归位成功才双派发——
            // input（非冒泡，x-model 回写）+ change（冒泡，detail={page,pageSize}，外层一行回写）
            onGo(n) {
                if (!this.applyPage(n)) return;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: Number(this.data.page), pageSize: Number(this.data.pageSize) } }));
            },
            // 条数切换（原生 select）：截断原生 change 冒泡（detail undefined——外层消费方
            // @change 按 detail={page,pageSize} 解构会炸，alert 关闭钮同款纪律）→ 同值短路 →
            // 写 pageSize + 页码归 1 → 组件语义 change 自派发（detail 携新对）
            onSizeChange(event) {
                event.stopPropagation();
                const size = Number(event.target.value);
                if (!size || size === Number(this.data.pageSize)) return;
                this.data.pageSize = size;
                this.data.page = 1;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: 1, pageSize: size } }));
            },
            // 页码窗口重算（幂等：JSON 签名比对同值不写——watch 同值重跑 / i18n refresh 不污染）
            computePages() {
                const pc = Number(this.data.pageCount) || 1;
                const page = Number(this.data.page) || 1;
                const items = [];
                if (pc <= 7) {
                    for (let i = 1; i <= pc; i++) items.push({ type: "page", page: i, key: "p" + i });
                } else {
                    items.push({ type: "page", page: 1, key: "p1" });
                    const start = Math.max(2, page - 2);
                    const end = Math.min(pc - 1, page + 2);
                    if (start > 2) items.push({ type: "more", key: "ml" });
                    for (let i = start; i <= end; i++) items.push({ type: "page", page: i, key: "p" + i });
                    if (end < pc - 1) items.push({ type: "more", key: "mr" });
                    items.push({ type: "page", page: pc, key: "p" + pc });
                }
                const sig = JSON.stringify(items);
                if (sig !== this._pagesSig) {
                    this._pagesSig = sig;
                    this.data.pages = items;
                }
            },
        },
        mounted() {
            // 元素名形态兜底（precompile 改道落盘的 data-page-sizes JSON 字符串）：
            // pageSizes props 缺席时解析写组件 data（x-for 值通道响应）；props 在场恒优先
            const rawSizes = this.el.getAttribute("data-page-sizes");
            if ((!this.data.pageSizes || !this.data.pageSizes.length) && rawSizes) {
                try {
                    const arr = JSON.parse(rawSizes);
                    if (Array.isArray(arr)) this.data.pageSizes = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省无条数切换） */ }
                this.el.removeAttribute("data-page-sizes");
            }

            // el.value 劫持桥（受控 page 的 DOM 通道：x-model / 程序读写皆经此）——
            // 劫持前快照 expando（x-model 编译期可能已写初值）；静默归位不广播（受控语义）
            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => Number(this.data.page) || 1,
                set: (v) => { this.applyPage(v); },
                configurable: true,
            });

            // 页码窗口初始重算 + 源订阅（page 翻页 / pageCount 随 total·pageSize 变化 →
            // 窗口重排 + page 钳位归位）
            this.computePages();
            this.watch("page", () => this.computePages());
            this.watch("pageCount", () => { this.applyPage(this.data.page); this.computePages(); });

            // 一跳首对齐（mounted 时 x-model expando 可能未落定，家族惯例）：
            // 初值落定序 = x-model expando > props page > 1；applyPage 兼任越界钳位
            // （page > pageCount 归位末页——props 注入越界值的一跳收敛）
            setTimeout(() => {
                this.applyPage(typeof prior === "number" && prior > 0 ? prior : this.data.page);
                this.computePages();
            }, 0);
        },
    }
  <\/script>
  <style global id="autospark-components-pagination">
    /* 宿主：透明块壳（字号基线随 data-size 档位全跟随，button 同范式 ADR-0012） */
    .asc-pagination {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-pagination-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    /* ---------- body：横向布局载体（编译子树内层，绑定可求值） ---------- */
    .asc-pagination-body {
      --asc-tone: var(--auto-primary-color, var(--asc-pagination-primary, #009aff));
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 0.5em;
      color: var(--auto-color, var(--asc-pagination-color, #606060));
    }
    /* 极简形态：紧凑居左（‹ 3 / 20 › 单行，无总数与条数切换） */
    .asc-pagination-body[data-simple="true"] {
      justify-content: flex-start;
      gap: 0.375em;
    }

    /* ---------- 总条数（i18n 兜底文案同通道）：次要文字色 ---------- */
    .asc-pagination-total {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      white-space: nowrap;
    }

    /* ---------- 条数切换（原生 select 原生增强：轻盒饰随主题） ---------- */
    .asc-pagination-sizes {
      display: inline-flex;
      align-items: center;
    }
    .asc-pagination-select {
      font: inherit;
      color: inherit;
      padding: 0.2em 0.5em;
      border: var(--auto-border-size, var(--asc-pagination-border-size, 1px)) solid
        var(--auto-border-color, var(--asc-pagination-border, #d9d9d9));
      border-radius: var(--auto-border-radius, var(--asc-pagination-radius, 0.375em));
      background: var(--auto-bgcolor, var(--asc-pagination-bg, #ffffff));
      cursor: pointer;
    }
    .asc-pagination-select:focus-visible {
      outline: none;
      border-color: var(--asc-tone);
    }

    /* ---------- 页码区：按钮组 ---------- */
    .asc-pagination-pages,
    .asc-pagination-simple {
      display: inline-flex;
      align-items: center;
      gap: 0.3125em;
    }
    .asc-pagination-item {
      display: inline-flex;
    }
    .asc-pagination-btn {
      appearance: none;
      font: inherit;
      line-height: inherit;
      color: var(--auto-color, var(--asc-pagination-color, #606060));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.0625em; /* 双箭头首末钮的两枚图标间距 */
      min-width: 2em;
      height: 2em;
      padding: 0 0.375em;
      margin: 0;
      border: none;
      background: transparent;
      border-radius: var(--auto-border-radius, var(--asc-pagination-radius, 0.375em));
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    .asc-pagination-btn:hover:not(:disabled) {
      color: var(--asc-tone);
      background: var(--auto-hover-bgcolor, var(--asc-pagination-hover-bg, rgba(0, 0, 0, 0.04)));
    }
    .asc-pagination-btn:disabled {
      color: var(--auto-disable-color, var(--asc-pagination-disable-color, rgba(0, 0, 0, 0.25)));
      cursor: not-allowed;
    }
    .asc-pagination-btn:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--asc-tone) 28%, transparent);
    }
    /* 激活页：语义色实底反白（语义色底白字为恒定设计，非变量映射） */
    .asc-pagination-btn[data-active] {
      color: var(--asc-pagination-active-ink, #ffffff);
      background: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
    /* 箭头图标：内置 arrow（右向单箭头），左向经旋转 180° */
    .asc-pagination-icon {
      font-size: 1em;
      line-height: 1;
    }
    .asc-pagination-icon-flip {
      transform: rotate(180deg);
    }
    /* 省略号：辅助色不可点（折叠区段占位；显隐由克隆体 x-show 内联驱动——基样式
       不得写 display:none，否则样式表恒压过 x-show 的显示态） */
    .asc-pagination-ellipsis {
      display: inline-block;
      min-width: 1.5em;
      text-align: center;
      color: var(--auto-third-color, var(--asc-pagination-ellipsis-color, rgba(0, 0, 0, 0.35)));
      letter-spacing: 0.125em;
    }
    /* 极简形态文本：3 / 20（次要色） */
    .asc-pagination-simple-text {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      padding: 0 0.25em;
      white-space: nowrap;
    }

    /* ---------- 暗色兜底变体（ADR-0129）：兜底字面值切换为 theme 默认暗色校准值（变量链不变） ---------- */
    [dark] .asc-pagination-body,
    [data-dark] .asc-pagination-body {
      --asc-tone: var(--auto-primary-color, var(--asc-pagination-primary, #56baff));
      color: var(--auto-color, var(--asc-pagination-color, #fafafa));
    }
    [dark] .asc-pagination-total,
    [dark] .asc-pagination-simple-text,
    [data-dark] .asc-pagination-total,
    [data-dark] .asc-pagination-simple-text {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-pagination-select,
    [data-dark] .asc-pagination-select {
      border-color: var(--auto-border-color, var(--asc-pagination-border, #52525b));
      background: var(--auto-bgcolor, var(--asc-pagination-bg, #3a3a3a));
    }
    [dark] .asc-pagination-btn:disabled,
    [data-dark] .asc-pagination-btn:disabled {
      color: var(--auto-disable-color, var(--asc-pagination-disable-color, rgba(255, 255, 255, 0.25)));
    }
    [dark] .asc-pagination-btn:hover:not(:disabled),
    [data-dark] .asc-pagination-btn:hover:not(:disabled) {
      background: var(--auto-hover-bgcolor, var(--asc-pagination-hover-bg, rgba(255, 255, 255, 0.08)));
    }
    [dark] .asc-pagination-ellipsis,
    [data-dark] .asc-pagination-ellipsis {
      color: var(--auto-third-color, var(--asc-pagination-ellipsis-color, rgba(255, 255, 255, 0.45)));
    }
  </style>
  <!-- 形态绑定落本层（T4=B：根上动态绑定不求值）；翻页边界 disabled 随 page/pageCount 联动 -->
  <div class="asc-pagination-body" :data-simple="simple">
    <!-- 总条数（i18n：pagination.total "{n}" 插值，键等值判定回退硬编码中文） -->
    <span class="asc-pagination-total" x-show="!simple">
      {{ t('pagination.total', { n: total }) === 'pagination.total' ? ('共 ' + total + ' 条') : t('pagination.total', { n: total }) }}
    </span>
    <!-- 条数切换：原生 select（x-for 容器宿主形态，option 逐项克隆；:selected 桥接当前值） -->
    <span class="asc-pagination-sizes" x-show="!simple && pageSizes && pageSizes.length">
      <select
        class="asc-pagination-select"
        x-for="s of pageSizes"
        :key="String(s)"
        @change="onSizeChange($event)"
      >
        <option
          class="asc-pagination-option"
          :value="String(s)"
          :selected="Number(s) === Number(pageSize) ? true : null"
        >{{ t('pagination.pageSize', { n: s }) === 'pagination.pageSize' ? (s + ' 条/页') : t('pagination.pageSize', { n: s }) }}</option>
      </select>
    </span>
    <!-- 页码窗口：首/上/窗口/下/末（首末为双箭头） -->
    <span class="asc-pagination-pages" x-show="!simple">
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) <= 1"
        :aria-label="t('pagination.first') === 'pagination.first' ? '首页' : t('pagination.first')"
        @click="onGo(1)"
      >
        <i class="asc-pagination-icon asc-pagination-icon-flip" x-icon="'arrow'"></i><i
          class="asc-pagination-icon asc-pagination-icon-flip"
          x-icon="'arrow'"
        ></i>
      </button>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) <= 1"
        :aria-label="t('pagination.prev') === 'pagination.prev' ? '上一页' : t('pagination.prev')"
        @click="onGo(Number(page) - 1)"
      >
        <i class="asc-pagination-icon asc-pagination-icon-flip" x-icon="'arrow'"></i>
      </button>
      <!-- 窗口项：页码钮 / 省略号两态（x-for 克隆体内禁 x-if，一律 x-show——P0 规避清单第 4 条） -->
      <span class="asc-pagination-item" x-for="p of pages" :key="p.key">
        <button
          type="button"
          class="asc-pagination-btn"
          x-show="p.type === 'page'"
          :data-active="String(p.page) === String(page) ? '' : null"
          @click="onGo(p.page)"
        >{{ p.page }}</button>
        <span class="asc-pagination-ellipsis" x-show="p.type === 'more'">···</span>
      </span>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) >= Number(pageCount)"
        :aria-label="t('pagination.next') === 'pagination.next' ? '下一页' : t('pagination.next')"
        @click="onGo(Number(page) + 1)"
      >
        <i class="asc-pagination-icon" x-icon="'arrow'"></i>
      </button>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) >= Number(pageCount)"
        :aria-label="t('pagination.last') === 'pagination.last' ? '末页' : t('pagination.last')"
        @click="onGo(pageCount)"
      >
        <i class="asc-pagination-icon" x-icon="'arrow'"></i><i
          class="asc-pagination-icon"
          x-icon="'arrow'"
        ></i>
      </button>
    </span>
    <!-- 极简形态：‹ 3 / 20 › -->
    <span class="asc-pagination-simple" x-show="simple">
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) <= 1"
        :aria-label="t('pagination.prev') === 'pagination.prev' ? '上一页' : t('pagination.prev')"
        @click="onGo(Number(page) - 1)"
      >
        <i class="asc-pagination-icon asc-pagination-icon-flip" x-icon="'arrow'"></i>
      </button>
      <span class="asc-pagination-simple-text">{{ page }} / {{ pageCount }}</span>
      <button
        type="button"
        class="asc-pagination-btn"
        :disabled="Number(page) >= Number(pageCount)"
        :aria-label="t('pagination.next') === 'pagination.next' ? '下一页' : t('pagination.next')"
        @click="onGo(Number(page) + 1)"
      >
        <i class="asc-pagination-icon" x-icon="'arrow'"></i>
      </button>
    </span>
  </div>
</div>
`,e.precompile?.(e=>{for(let t of Array.from(e.el.querySelectorAll(`x-pagination`))){let e=t.getAttribute(`page-sizes`);e!=null&&e!==``&&!t.hasAttribute(`:page-sizes`)&&t.setAttribute(`data-page-sizes`,e),t.removeAttribute(`page-sizes`)}})}n();function n(){e(e=>{t(e)})}};
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

//# sourceMappingURL=autospark.pagination.js.map
