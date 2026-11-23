(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.grid`]=`<div
  class="asc-grid"
  x-define="autospark.grid"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            cols: 3,
            gap: 0,
            justify: "start",
            align: "stretch",
        }),
        mounted() {
            const TIERS = ["x-small", "small", "medium", "large", "x-large"];
            const syncGap = () => {
                const body = this.el.querySelector(".asc-grid-body");
                if (!body) return;
                body.style.removeProperty("row-gap");
                body.style.removeProperty("column-gap");
                const s = this.data.gap;
                if (s == null || (typeof s === "string" && TIERS.includes(s))) return;
                const norm = (v) => (typeof v === "number" ? v + "px" : String(v));
                let row, col;
                if (Array.isArray(s)) {
                    col = norm(s[0]);
                    row = norm(s[1] ?? s[0]);
                } else {
                    row = col = norm(s);
                }
                body.style.rowGap = row;
                body.style.columnGap = col;
            };

            const BREAKPOINTS = { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 };
            const TIER_ORDER = ["xxl", "xl", "lg", "md", "sm"];
            const MQLS_KEY = "_ascGridMqls";
            const unbindMqls = (body) => {
                for (const { mql, fn } of body[MQLS_KEY] ?? []) {
                    if (mql.removeEventListener) mql.removeEventListener("change", fn);
                    else if (mql.removeListener) mql.removeListener(fn);
                }
                body[MQLS_KEY] = [];
            };
            const tierCols = (cols) => {
                for (const t of TIER_ORDER) {
                    if (cols[t] == null) continue;
                    if (typeof window?.matchMedia === "function"
                        && window.matchMedia(\`(min-width: \${BREAKPOINTS[t]}px)\`).matches) return cols[t];
                }
                return cols.xs ?? 1;
            };
            const syncCols = () => {
                const body = this.el.querySelector(".asc-grid-body");
                if (!body) return;
                body.style.removeProperty("--asc-grid-cols");
                unbindMqls(body);
                const c = this.data.cols;
                if (typeof c === "number") {
                    body.style.setProperty("--asc-grid-cols", String(Math.max(1, Math.floor(c))));
                } else if (c && typeof c === "object") {
                    const pairs = [];
                    if (typeof window?.matchMedia === "function") {
                        for (const t of TIER_ORDER) {
                            if (c[t] == null) continue;
                            const mql = window.matchMedia(\`(min-width: \${BREAKPOINTS[t]}px)\`);
                            const fn = () => { setTimeout(syncCols, 0); };
                            if (mql.addEventListener) mql.addEventListener("change", fn);
                            else if (mql.addListener) mql.addListener(fn);
                            pairs.push({ mql, fn });
                        }
                    }
                    body[MQLS_KEY] = pairs;
                    body.style.setProperty("--asc-grid-cols", String(Math.max(1, Math.floor(tierCols(c)))));
                }
            };
            setTimeout(() => { syncGap(); syncCols(); }, 0);
            this.watch("gap", () => { setTimeout(syncGap, 0); });
            this.watch("cols", () => { setTimeout(syncCols, 0); });
        },
        unmounted() {
            const body = this.el?.querySelector?.(".asc-grid-body");
            if (body) {
                for (const { mql, fn } of body["_ascGridMqls"] ?? []) {
                    if (mql.removeEventListener) mql.removeEventListener("change", fn);
                    else if (mql.removeListener) mql.removeListener(fn);
                }
                body["_ascGridMqls"] = [];
            }
        },
    }
  <\/script>
  <style global id="autospark-components-grid">
    .asc-grid {
      display: block;
    }
    /* body：唯一 grid 容器；列数经 --asc-grid-cols 变量（JS 通道写入，使用者亦可
         在祖先声明同名变量定制——元素级内联优先）；minmax(0, 1fr) 防子项
         min-width:auto 撑破轨道（长文本/媒体不换行陷阱）；--asc-grid-gap 为
         间隙使用者覆盖通道 */
    .asc-grid-body {
      display: grid;
      grid-template-columns: repeat(var(--asc-grid-cols, 3), minmax(0, 1fr));
      gap: var(--asc-grid-gap, 0);
      width: 100%;
    }
    /* 自适应列（cols="auto"）：auto-fill 按容器宽自动列数，最小列宽
         --asc-grid-min（缺省 16rem，使用者覆盖通道） */
    .asc-grid-body[data-cols-mode="auto"] {
      grid-template-columns: repeat(auto-fill, minmax(var(--asc-grid-min, 16rem), 1fr));
    }
    /* ---------- 间隙档位（CSS 变量档）：与 space 同构（--x-spacing-* 标尺五档；
         medium 档经 --auto-spacing 接通 theme spacing 档位）---------- */
    .asc-grid-body[data-gap="x-small"] {
      gap: var(--asc-grid-gap, var(--x-spacing-x-small));
    }
    .asc-grid-body[data-gap="small"] {
      gap: var(--asc-grid-gap, var(--x-spacing-small));
    }
    .asc-grid-body[data-gap="medium"] {
      gap: var(--asc-grid-gap, var(--auto-spacing, var(--x-spacing-medium)));
    }
    .asc-grid-body[data-gap="large"] {
      gap: var(--asc-grid-gap, var(--x-spacing-large));
    }
    .asc-grid-body[data-gap="x-large"] {
      gap: var(--asc-grid-gap, var(--x-spacing-x-large));
    }

    /* ---------- 轨道水平分布（justify，列宽不满容器时有效；缺省 start 即 CSS
         缺省 normal 不写块）---------- */
    .asc-grid-body[data-justify="center"] {
      justify-content: center;
    }
    .asc-grid-body[data-justify="end"] {
      justify-content: end;
    }
    .asc-grid-body[data-justify="between"] {
      justify-content: space-between;
    }
    .asc-grid-body[data-justify="around"] {
      justify-content: space-around;
    }
    .asc-grid-body[data-justify="evenly"] {
      justify-content: space-evenly;
    }

    .asc-grid-body[data-align="start"] {
      align-items: start;
    }
    .asc-grid-body[data-align="center"] {
      align-items: center;
    }
    .asc-grid-body[data-align="end"] {
      align-items: end;
    }
    .asc-grid-body[data-align="baseline"] {
      align-items: baseline;
    }

    .asc-grid-slot {
      display: contents;
    }
  </style>
  <div
    class="asc-grid-body"
    :data-justify="justify"
    :data-align="align"
    :data-gap="gap"
    :data-cols-mode="cols === 'auto' ? 'auto' : null"
  >
    <div class="asc-grid-slot" x-slot></div>
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

//# sourceMappingURL=autospark.grid.js.map
