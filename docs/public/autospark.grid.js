(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.grid`]=`<!--
    化身路径约束（x-component T4=B）：组件快照根的属性静态并入宿主，根上的动态
    绑定不会求值——对齐/分布/间隙档位/自适应列模式绑定全部落在编译子树的内层
    body 上（body 即 grid 容器，变体直接命中 body 选择器，无需 :has() 反驱宿主）；
    列数（number/响应式对象）与间隙值形态经 mounted JS 通道写 body 内联
    （--asc-grid-cols 变量 / row-gap+column-gap 两轴，元素级样式覆盖档位块）。

    插槽出口 display:contents：子项穿透出口成为 body 的直接 grid 项（出口保留
    包裹层不剥标签，display:contents 使其布局透明——漏写则子项嵌套在出口层内、
    不参与轨道排布，见家族惯例）。子元素正常编译：插槽内容照常走宿主引擎编译。
-->
<!-- 继承 autospark.base（ADR-0134，engine 内置抽象基组件）：主题档位 props
     （data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized
     六键）自动获得；grid 不在 data() 声明主题六键，组件内部变体属性亦禁用六个
     通道名——间隙档位属性用 data-gap（非通道名），medium 档经 --auto-spacing 联动
     theme spacing 档位，其余档直取 --x-spacing-* 标尺 -->
<div
  class="asc-grid"
  x-define="autospark.grid"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            cols: 3,           // 列数：number 固定列 | "auto" 自适应（auto-fill，最小列宽 --asc-grid-min）| { xs?, sm?, md?, lg?, xl?, xxl? } 响应式档位（视口断点列数，档名对齐 viewport 六档，断点 Bootstrap 5 min-width：sm 576 / md 768 / lg 992 / xl 1200 / xxl 1400）
            gap: 0,            // 间隙：number（px）| 档位名（x-small/small/medium/large/x-large → CSS 变量档）| 任意 CSS 值字符串 | [水平, 垂直] 两轴数组；缺省 0（CSS 原生栅格语义，显式声明才生效）
            justify: "start",  // 轨道水平分布：start | center | end | between | around | evenly（列宽不满容器时有效，如 auto 自适应列）
            align: "stretch",  // 项的块轴对齐：stretch（缺省，随轨道拉伸）| start | center | end | baseline
        }),
        mounted() {
            // ---------- 间隙值形态同步（与 space 组件同构） ----------
            // 档位名（标尺五档）由 CSS 档位块承接——内联两轴清除即回档位块；number 归一
            // px、字符串 CSS 值透传、数组 [水平, 垂直] 拆两轴（row-gap=垂直、column-gap=
            // 水平，第二项缺省同第一项）。mounted 时化身子树可能尚未挂载（body 不可查），
            // 一跳后再同步（button syncIconStyle 同款时序处理）
            const TIERS = ["x-small", "small", "medium", "large", "x-large"];
            const syncGap = () => {
                const body = this.el.querySelector(".asc-grid-body");
                if (!body) return;
                body.style.removeProperty("row-gap");
                body.style.removeProperty("column-gap");
                const s = this.data.gap;
                if (s == null || (typeof s === "string" && TIERS.includes(s))) return; // 档位名走 CSS 块
                const norm = (v) => (typeof v === "number" ? v + "px" : String(v));
                let row, col;
                if (Array.isArray(s)) {
                    col = norm(s[0]);         // 水平（column-gap）
                    row = norm(s[1] ?? s[0]); // 垂直（row-gap），缺省同水平
                } else {
                    row = col = norm(s);
                }
                body.style.rowGap = row;
                body.style.columnGap = col;
            };

            // ---------- 列数同步（cols 三形态） ----------
            // number：列数写 body 的 --asc-grid-cols 变量（CSS repeat() 消费）；
            // "auto"：CSS 档位块接管（data-cols-mode 绑定），不写列数变量；
            // 对象：响应式档位——matchMedia 按断点自高向低探测，取当前最高命中档的
            // 列数（全未命中回退 xs ?? 1；matchMedia 缺席环境同样回退，静默降级）。
            // 档位断点监听：视口跨断点时重算列数（响应式题中之义）；监听对挂 body 的
            // JS 属性（_ascGridMqls，非 data 域）以便 cols 变化重建与 unmounted 清理
            const BREAKPOINTS = { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 }; // xs 无阈值 = 基础档
            const TIER_ORDER = ["xxl", "xl", "lg", "md", "sm"]; // 自高向低探测
            const MQLS_KEY = "_ascGridMqls";
            const unbindMqls = (body) => {
                for (const { mql, fn } of body[MQLS_KEY] ?? []) {
                    if (mql.removeEventListener) mql.removeEventListener("change", fn);
                    else if (mql.removeListener) mql.removeListener(fn); // 旧 API 回退
                }
                body[MQLS_KEY] = [];
            };
            const tierCols = (cols) => {
                for (const t of TIER_ORDER) {
                    if (cols[t] == null) continue;
                    if (typeof window?.matchMedia === "function"
                        && window.matchMedia(\`(min-width: \${BREAKPOINTS[t]}px)\`).matches) return cols[t];
                }
                return cols.xs ?? 1; // 全未命中（窄视口 / 无 matchMedia）回退基础档
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
                            else if (mql.addListener) mql.addListener(fn); // 旧 API 回退
                            pairs.push({ mql, fn });
                        }
                    }
                    body[MQLS_KEY] = pairs;
                    body.style.setProperty("--asc-grid-cols", String(Math.max(1, Math.floor(tierCols(c)))));
                }
                // "auto" / 其他形态：CSS 档位块或缺省 3 列接管，无 JS 通道动作
            };
            setTimeout(() => { syncGap(); syncCols(); }, 0);
            this.watch("gap", () => { setTimeout(syncGap, 0); });
            this.watch("cols", () => { setTimeout(syncCols, 0); });
        },
        unmounted() {
            // 断点监听清理（防泄漏：mql 为全局长命对象，组件拆卸须摘监听）；
            // unmounted 时子树可能已拆（body 不可查则无监听在场，静默通过）
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
    /* 宿主：块级容器（零色彩消费，暗色模式天然无感——无暗色兜底块） */
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

    /* ---------- 项的块轴对齐（align；缺省 stretch 即 CSS 缺省 normal 不写块）---------- */
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

    /* 插槽出口布局透明：子项穿透成为 body 直接 grid 项 */
    .asc-grid-slot {
      display: contents;
    }
  </style>
  <!-- 变体数据属性承载在 body（编译子树内层元素）；gap 档位名经 data-gap 绑定命中
         CSS 档位块（非档位名值不命中任何块、由 JS 通道内联接管，两通道互补）；
         cols="auto" 经 data-cols-mode 切换 CSS 轨道模板 -->
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
