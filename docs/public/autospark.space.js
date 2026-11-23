(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.space`]=`<div
  class="asc-space"
  x-define="autospark.space"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            size: "medium",
            direction: "horizontal",
            align: "center",
            wrap: false,
        }),
        mounted() {
            const TIERS = ["x-small", "small", "medium", "large", "x-large"];
            const syncSize = () => {
                const body = this.el.querySelector(".asc-space-body");
                if (!body) return;
                body.style.removeProperty("row-gap");
                body.style.removeProperty("column-gap");
                const s = this.data.size;
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
            setTimeout(syncSize, 0);
            this.watch("size", () => { setTimeout(syncSize, 0); });
        },
    }
  <\/script>
  <style global id="autospark-components-space">
    .asc-space {
      display: block;
    }
    /* body：唯一 flex 容器；缺省间距 medium 档（--auto-spacing 联动 theme spacing
         档位，theme 档位跟随）；--asc-space-gap 为使用者覆盖通道（压全档） */
    .asc-space-body {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--asc-space-gap, var(--auto-spacing, var(--x-spacing-medium)));
      width: 100%;
      min-width: 0;
    }
    .asc-space-body[data-direction="vertical"] {
      flex-direction: column;
      align-items: flex-start;
    }
    .asc-space-body[data-align="start"] {
      align-items: flex-start;
    }
    .asc-space-body[data-align="center"] {
      align-items: center;
    }
    .asc-space-body[data-align="end"] {
      align-items: flex-end;
    }
    .asc-space-body[data-align="baseline"] {
      align-items: baseline;
    }
    .asc-space-body[data-wrap="true"] {
      flex-wrap: wrap;
    }

    /* ---------- 间距档位（CSS 变量档）：--x-spacing-* 标尺五档直取（语义层无间距
         梯度派生变量）；medium 档经 --auto-spacing 接通 theme spacing 档位 ---------- */
    .asc-space-body[data-gap="x-small"] {
      gap: var(--asc-space-gap, var(--x-spacing-x-small));
    }
    .asc-space-body[data-gap="small"] {
      gap: var(--asc-space-gap, var(--x-spacing-small));
    }
    .asc-space-body[data-gap="medium"] {
      gap: var(--asc-space-gap, var(--auto-spacing, var(--x-spacing-medium)));
    }
    .asc-space-body[data-gap="large"] {
      gap: var(--asc-space-gap, var(--x-spacing-large));
    }
    .asc-space-body[data-gap="x-large"] {
      gap: var(--asc-space-gap, var(--x-spacing-x-large));
    }

    .asc-space-slot {
      display: contents;
    }
  </style>
  <div
    class="asc-space-body"
    :data-direction="direction"
    :data-align="align"
    :data-wrap="wrap"
    :data-gap="size"
  >
    <div class="asc-space-slot" x-slot></div>
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

//# sourceMappingURL=autospark.space.js.map
