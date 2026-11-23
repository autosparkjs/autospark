(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.pagination`]=`<div
  class="asc-pagination"
  x-define="autospark.pagination"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            page: 1,
            pageSize: 10,
            total: 0,
            pageSizes: [],
            simple: false,
            pages: [],
            pageCount: (s) => Math.max(1, Math.ceil((Number(s.total) || 0) / (Number(s.pageSize) || 10)) || 1),
        }),
        methods: {
            applyPage(n) {
                const pc = Number(this.data.pageCount) || 1;
                const target = Math.min(Math.max(1, Number(n) || 1), pc);
                if (target === Number(this.data.page)) return false;
                this.data.page = target;
                return true;
            },
            onGo(n) {
                if (!this.applyPage(n)) return;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: Number(this.data.page), pageSize: Number(this.data.pageSize) } }));
            },
            onSizeChange(event) {
                event.stopPropagation();
                const size = Number(event.target.value);
                if (!size || size === Number(this.data.pageSize)) return;
                this.data.pageSize = size;
                this.data.page = 1;
                this.el.dispatchEvent(new Event("input", { bubbles: false }));
                this.el.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { page: 1, pageSize: size } }));
            },
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
            const rawSizes = this.el.getAttribute("data-page-sizes");
            if ((!this.data.pageSizes || !this.data.pageSizes.length) && rawSizes) {
                try {
                    const arr = JSON.parse(rawSizes);
                    if (Array.isArray(arr)) this.data.pageSizes = arr;
                } catch { /* 非法 JSON 静默忽略（容错缺省无条数切换） */ }
                this.el.removeAttribute("data-page-sizes");
            }

            const prior = this.el.value;
            Object.defineProperty(this.el, "value", {
                get: () => Number(this.data.page) || 1,
                set: (v) => { this.applyPage(v); },
                configurable: true,
            });

            this.computePages();
            this.watch("page", () => this.computePages());
            this.watch("pageCount", () => { this.applyPage(this.data.page); this.computePages(); });

            setTimeout(() => {
                this.applyPage(typeof prior === "number" && prior > 0 ? prior : this.data.page);
                this.computePages();
            }, 0);
        },
    }
  <\/script>
  <style global id="autospark-components-pagination">
    .asc-pagination {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-pagination-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }

    .asc-pagination-body {
      --asc-tone: var(--auto-primary-color, var(--asc-pagination-primary, #009aff));
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 0.5em;
      color: var(--auto-color, var(--asc-pagination-color, #606060));
    }
    .asc-pagination-body[data-simple="true"] {
      justify-content: flex-start;
      gap: 0.375em;
    }

    .asc-pagination-total {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      white-space: nowrap;
    }

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
      gap: 0.0625em;
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
    .asc-pagination-btn[data-active] {
      color: var(--asc-pagination-active-ink, #ffffff);
      background: var(--asc-tone);
      font-weight: var(--x-font-weight-medium, 500);
    }
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
    .asc-pagination-simple-text {
      color: var(--auto-secondary-color, var(--asc-pagination-total-color, rgba(0, 0, 0, 0.55)));
      padding: 0 0.25em;
      white-space: nowrap;
    }

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
  <div class="asc-pagination-body" :data-simple="simple">
    <span class="asc-pagination-total" x-show="!simple">
      {{ t('pagination.total', { n: total }) === 'pagination.total' ? ('共 ' + total + ' 条') : t('pagination.total', { n: total }) }}
    </span>
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
