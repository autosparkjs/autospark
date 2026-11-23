(function (AutoSpark) {
    "use strict";
var run = function (AutoSpark) {
function e(e){let t=globalThis.AutoSpark;if(typeof t?.ready==`function`){e(t);return}let n=globalThis,r=n.__AUTOSPARK_PLUGINS__??=[];Object.isFrozen(r)?console.error(`installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`):r.push((t,n)=>e(n))}function t(e){e.components[`autospark.statistic`]=`<div
  class="asc-statistic"
  x-define="autospark.statistic"
  x-define:inherit="autospark.base"
>
  <script setup>
    {
        data: () => ({
            value: 0,
            precision: null,
            grouping: true,
            groupSeparator: "",
            prefix: "",
            suffix: "",
            title: "",
            valueStyle: null,
        }),
        methods: {
            currentLanguage() {
                const g = this.globalState;
                return (g && g.$ && g.$.language) || "zh";
            },
            formatValue() {
                const v = this.data.value;
                if (typeof v === "number" && isFinite(v)) {
                    const opts = { useGrouping: !!this.data.grouping };
                    const p = this.data.precision == null ? NaN : Number(this.data.precision);
                    if (isFinite(p) && p >= 0 && Math.floor(p) === p) {
                        opts.minimumFractionDigits = p;
                        opts.maximumFractionDigits = p;
                    }
                    let nf;
                    try { nf = new Intl.NumberFormat(this.currentLanguage(), opts); }
                    catch { nf = new Intl.NumberFormat("zh", opts); }
                    let text = nf.format(v);
                    const sep = this.data.groupSeparator;
                    if (sep) {
                        const groupPart = nf.formatToParts(v).find((x) => x.type === "group");
                        if (groupPart) text = text.split(groupPart.value).join(sep);
                    }
                    return text;
                }
                return v == null ? "" : String(v);
            },
            syncValue() {
                const el = this.el.querySelector(".asc-statistic-value-text");
                if (el) el.textContent = this.formatValue();
            },
            syncStyle() {
                const el = this.el.querySelector(".asc-statistic-value");
                if (!el) return;
                el.removeAttribute("style");
                const s = this.data.valueStyle;
                if (s && typeof s === "object") {
                    for (const key of Object.keys(s)) {
                        if (key.startsWith("--")) el.style.setProperty(key, String(s[key]));
                        else el.style[key] = s[key];
                    }
                }
            },
        },
        mounted() {
            this.syncValue();
            this.syncStyle();
            this.watch("value", () => this.syncValue());
            this.watch("precision", () => this.syncValue());
            this.watch("grouping", () => this.syncValue());
            this.watch("groupSeparator", () => this.syncValue());
            this.watch("$ && $.language", () => this.syncValue());
            this.watch("valueStyle", () => this.syncStyle());
        },
    }
  <\/script>
  <style global id="autospark-components-statistic">
    .asc-statistic {
      display: block;
      width: 100%;
      font-size: var(--auto-font-size, var(--asc-statistic-font-size, 0.875rem));
      line-height: var(--auto-line-height, 1.5);
    }
    .asc-statistic-title {
      color: var(--auto-secondary-color, var(--asc-statistic-title-color, rgba(0, 0, 0, 0.55)));
    }
    .asc-statistic-title:empty {
      display: none;
    }
    .asc-statistic-value {
      display: inline-flex;
      align-items: baseline;
      gap: 0.15em;
      font-size: 1.5em;
      font-weight: var(--x-font-weight-large, 600);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
      color: var(--auto-color, var(--asc-statistic-value-color, #303030));
    }
    .asc-statistic-prefix,
    .asc-statistic-suffix {
      font-size: 0.667em;
    }
    .asc-statistic-prefix:empty,
    .asc-statistic-suffix:empty {
      display: none;
    }
    .asc-statistic-value-text {
      min-width: 0;
    }

    [dark] .asc-statistic-title,
    [data-dark] .asc-statistic-title {
      color: var(--auto-secondary-color, var(--asc-statistic-title-color, rgba(255, 255, 255, 0.65)));
    }
    [dark] .asc-statistic-value,
    [data-dark] .asc-statistic-value {
      color: var(--auto-color, var(--asc-statistic-value-color, #fafafa));
    }
  </style>
  <div class="asc-statistic-inner">
    <div class="asc-statistic-title" x-slot:title>{{ title }}</div>
    <div class="asc-statistic-value">
      <span class="asc-statistic-prefix" x-slot:prefix>{{ prefix }}</span>
      <span class="asc-statistic-value-text"></span>
      <span class="asc-statistic-suffix" x-slot:suffix>{{ suffix }}</span>
    </div>
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

//# sourceMappingURL=autospark.statistic.js.map
