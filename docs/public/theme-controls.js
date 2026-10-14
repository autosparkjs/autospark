/* 文档站 theme demo 共享控制面板（对应 packages/theme/examples/theme-controls.ts 的原生 JS 版）
 *
 * 用法：demo 页面放 <div id="controls"></div>，引入 autospark-theme.js 后引入本文件：
 *   <div class="demo-panel"><div id="controls"></div></div>
 *   <script src="/autospark/autospark-theme.js"></script>
 *   <script src="/autospark/theme-controls.js"></script>
 *   <script>ThemeControls.mount();</script>
 *
 * 面板消费从 :root 继承的 --auto-* 变量，主题切换时面板随动；
 * 全局主题状态经 ThemePro（themeManager 单例）作用于整篇 demo 页面。
 */
(function (global) {
    "use strict";

    /** 视觉密度档（圆角/间距/阴影）：含 none（直角/零间距/无阴影） */
    var SIZES = ["none", "x-small", "small", "medium", "large", "x-large"];
    /** 字号档：字号无「归零」语义（sizeVars 未定义 none 档），不提供 none 选项 */
    var FONT_SIZES = ["x-small", "small", "medium", "large", "x-large"];

    var SIZE_ATTRS = [
        { attr: "size", label: "尺寸", sizes: FONT_SIZES },
        { attr: "radius", label: "圆角", sizes: SIZES },
        { attr: "spacing", label: "间距", sizes: SIZES },
        { attr: "shadow", label: "阴影", sizes: SIZES },
    ];

    var STYLE = [
        ":host, #controls { display:block; font-size:0.85rem; color:var(--auto-color,#333); box-sizing:border-box; }",
        "#controls h3 { margin:0 0 0.75rem; font-size:0.95rem; color:var(--auto-secondary-color,#666); }",
        "#controls .group { margin-bottom:1.1rem; }",
        "#controls .group-title { margin-bottom:0.4rem; color:var(--auto-third-color,#999); font-size:0.75rem; }",
        "#controls .swatches { display:flex; flex-wrap:wrap; gap:0.35rem; }",
        "#controls .swatch { width:1.3rem; height:1.3rem; border-radius:var(--auto-border-radius,4px); cursor:pointer; border:1px solid var(--auto-border-color,#e9e9e9); }",
        "#controls .swatch.active { outline:2px solid var(--auto-theme-color,#1677ff); outline-offset:2px; }",
        "#controls .color-row { display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; }",
        "#controls input[type=color] { width:2.2rem; height:1.6rem; padding:0; border:1px solid var(--auto-border-color,#e9e9e9); border-radius:var(--auto-border-radius,4px); background:none; cursor:pointer; }",
        "#controls .switch-row { display:flex; align-items:center; justify-content:space-between; padding:0.3rem 0; cursor:pointer; }",
        "#controls .switch { width:2.4rem; height:1.25rem; border-radius:9999px; background:var(--auto-border-color,#d9d9d9); position:relative; transition:background 0.2s; }",
        "#controls .switch::after { content:''; position:absolute; top:0.125rem; left:0.125rem; width:1rem; height:1rem; border-radius:50%; background:#fff; transition:left 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.2); }",
        "#controls .switch.on { background:var(--auto-theme-color,#1677ff); }",
        "#controls .switch.on::after { left:1.27rem; }",
        "#controls .size-group { margin-bottom:0.6rem; }",
        "#controls .size-label { font-size:0.75rem; color:var(--auto-third-color,#999); margin-bottom:0.25rem; }",
        "#controls input[type=range] { width:100%; accent-color:var(--auto-theme-color,#1677ff); cursor:pointer; }",
    ].join("\n");

    /** 待应用的主题色（rAF 合帧的挂起值）：@input 逐像素触发，每帧至多应用一次 */
    var pendingColor = null;
    var colorRaf = 0;

    function setThemeColor(value, state) {
        state.currentColor = value; // 选中态即时反馈
        pendingColor = value;
        if (colorRaf) return;
        colorRaf = requestAnimationFrame(function () {
            colorRaf = 0;
            if (pendingColor !== null) global.ThemePro.themeColor = pendingColor;
        });
    }

    function render(host) {
        var TP = global.ThemePro;
        var state = host.__tc || (host.__tc = { dark: !!TP.dark, colorized: !!TP.colorized, currentColor: "blue", sizeValues: { size: "medium", radius: "medium", spacing: "medium", shadow: "medium" } });

        var swatches = Object.keys(TP.presets)
            .map(function (name) {
                var theme = TP.presets[name];
                var active = state.currentColor === name || state.currentColor === theme.color;
                return '<span class="swatch' + (active ? " active" : "") + '" title="' + theme.title + " (" + name + ')" data-color="' + name + '" style="background-color:' + theme.color + ';"></span>';
            })
            .join("");

        var sizeGroups = SIZE_ATTRS.map(function (item) {
            var value = state.sizeValues[item.attr];
            return (
                '<div class="size-group">' +
                '<div class="size-label">' + item.label + "（" + item.attr + "）：" + value + "</div>" +
                '<input type="range" min="0" max="' + (item.sizes.length - 1) + '" step="1" value="' + item.sizes.indexOf(value) + '" data-size-attr="' + item.attr + '" />' +
                "</div>"
            );
        }).join("");

        host.innerHTML =
            "<style>" + STYLE + "</style>" +
            "<h3>主题控制</h3>" +
            '<div class="group"><div class="group-title">主题色</div><div class="swatches">' + swatches + "</div>" +
            '<div class="color-row"><input type="color" title="自定义主题色" /><span>自定义颜色</span></div></div>' +
            '<div class="group"><div class="group-title">模式</div>' +
            '<div class="switch-row" data-switch="dark"><span>暗色模式</span><span class="switch' + (state.dark ? " on" : "") + '"></span></div>' +
            '<div class="switch-row" data-switch="colorized"><span>多彩模式</span><span class="switch' + (state.colorized ? " on" : "") + '"></span></div></div>' +
            '<div class="group"><div class="group-title">尺寸参数（ThemeSize）</div>' + sizeGroups + "</div>";

        // 事件委托：色块选预设 / 色盘逐像素换色 / 开关走属性通道 / 滑块走尺寸属性通道
        host.addEventListener("click", function (e) {
            var target = e.target;
            if (target.classList.contains("swatch")) setThemeColor(target.getAttribute("data-color"), state);
            else {
                var sw = target.closest("[data-switch]");
                if (sw) {
                    var key = sw.getAttribute("data-switch");
                    state[key] = !state[key];
                    TP[key] = state[key];
                    render(host); // 重绘以同步开关态
                }
            }
        });
        host.addEventListener("input", function (e) {
            var target = e.target;
            if (target.type === "color") setThemeColor(target.value, state);
            else if (target.hasAttribute("data-size-attr")) {
                var attr = target.getAttribute("data-size-attr");
                var def = SIZE_ATTRS.filter(function (d) { return d.attr === attr; })[0];
                var value = def.sizes[Number(target.value)];
                state.sizeValues[attr] = value;
                TP[attr] = value; // 尺寸走属性通道（写 DOM 属性 + 持久化）
                render(host);
            }
        });
    }

    global.ThemeControls = {
        /** 把控制面板渲染进 sel（默认 #controls）；重复调用会替换内容 */
        mount: function (sel) {
            var host = typeof sel === "string" ? document.querySelector(sel) : sel || document.getElementById("controls");
            if (!host) return;
            if (!global.ThemePro) throw new Error("ThemePro 未加载：请先引入 autospark-theme.js");
            render(host);
        },
    };
})(window);
