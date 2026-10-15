/* 文档站 theme demo 共享小工具（每个 demo 页面在 theme-controls.js 之后引入）
 *
 * 三件事，全部由 data-* 属性声明、按需生效：
 *
 * 1) 十阶梯度条：<div class="theme-strip" data-strip="--x-color-theme-"></div>
 *    生成 10 个色块，背景依次取 {前缀}0 … {前缀}9；带 data-strip-label 时块内显示档位号。
 *
 * 2) 独立样式域开关：<button data-toggle-attr="data-dark" data-toggle-target="#card-a">…</button>
 *    点击翻转目标元素上的该属性（元素域章节的交互演示），开态按钮加 .on 类。
 *
 * 3) 作用域参数开关：<button data-scope-id="preview" data-scope-prop="dark">…</button>
 *    经 ThemePro.scopes[id] 改参数——dark / colorized 为布尔翻转；size / radius / spacing /
 *    shadow 按 data-scope-value 设值、缺省循环换档；themeColor 取 data-scope-value 的色名或色值。
 */
(function (global) {
    "use strict";

    var SCALE_PROPS = ["size", "radius", "spacing", "shadow"];
    var SCALE_VALUES = ["none", "x-small", "small", "medium", "large", "x-large"];

    /** 档位循环：字号无 none 档，从 x-small 起循环 */
    function nextScale(prop, current) {
        var list = prop === "size" ? SCALE_VALUES.slice(1) : SCALE_VALUES;
        var index = list.indexOf(current);
        return list[(index + 1) % list.length];
    }

    function buildStrips(root) {
        (root || document).querySelectorAll("[data-strip]").forEach(function (el) {
            if (el.dataset.stripReady) return;
            el.dataset.stripReady = "1";
            var prefix = el.getAttribute("data-strip");
            var count = Number(el.getAttribute("data-strip-count") || 10);
            var labeled = el.hasAttribute("data-strip-label");
            for (var i = 0; i < count; i++) {
                var cell = document.createElement("span");
                cell.style.backgroundColor = "var(" + prefix + i + ")";
                if (labeled) cell.textContent = i;
                el.appendChild(cell);
            }
        });
    }

    /** 元素域：按钮翻转目标元素上的 data-* 属性，并按属性现状回写按钮态与文案 */
    function bindAttrToggles(root) {
        (root || document).querySelectorAll("[data-toggle-attr]").forEach(function (btn) {
            if (btn.dataset.toggleReady) return;
            btn.dataset.toggleReady = "1";
            var sync = function () {
                var target = document.querySelector(btn.getAttribute("data-toggle-target"));
                var on = target && target.hasAttribute(btn.getAttribute("data-toggle-attr"));
                btn.classList.toggle("on", !!on);
                if (btn.hasAttribute("data-toggle-label")) {
                    var name = btn.getAttribute("data-toggle-attr");
                    btn.textContent = name + "：" + (on ? "开" : "关");
                }
            };
            btn.addEventListener("click", function () {
                var target = document.querySelector(btn.getAttribute("data-toggle-target"));
                if (target) target.toggleAttribute(btn.getAttribute("data-toggle-attr"));
                sync();
            });
            sync();
        });
    }

    /** 作用域参数：按钮改 ThemePro.scopes[id] 上的参数（走 setter → 同步 DOM 属性 + 持久化） */
    function bindScopeControls(root) {
        (root || document).querySelectorAll("[data-scope-prop]").forEach(function (btn) {
            if (btn.dataset.scopeReady) return;
            btn.dataset.scopeReady = "1";
            var id = btn.getAttribute("data-scope-id");
            var prop = btn.getAttribute("data-scope-prop");
            var sync = function () {
                var scope = global.ThemePro && global.ThemePro.scopes && global.ThemePro.scopes[id];
                if (!scope) return;
                if (SCALE_PROPS.indexOf(prop) >= 0 || prop === "themeColor") return;
                var on = !!scope[prop];
                btn.classList.toggle("on", on);
                if (btn.hasAttribute("data-scope-label")) btn.textContent = prop + "：" + (on ? "开" : "关");
            };
            btn.addEventListener("click", function () {
                var scope = global.ThemePro && global.ThemePro.scopes && global.ThemePro.scopes[id];
                if (!scope) return;
                var fixed = btn.getAttribute("data-scope-value");
                if (fixed !== null) {
                    scope[prop] = prop === "themeColor" ? fixed : fixed === "true";
                } else if (SCALE_PROPS.indexOf(prop) >= 0) {
                    scope[prop] = nextScale(prop, scope[prop]);
                } else {
                    scope[prop] = !scope[prop];
                }
                sync();
            });
            sync();
        });
    }

    function enhance(root) {
        buildStrips(root);
        bindAttrToggles(root);
        bindScopeControls(root);
        syncFrameHeight();
    }

    /* 4) iframe 自适应高度（自保机制）
     *    vitepress-demo-plugin 用自身 rAF 循环把内部 documentElement.offsetHeight
     *    回写到 <iframe> 及其包裹 div 的 style.height；但同一页面放多个 <demo> 时
     *    该回写会失效（iframe 停在模板默认 height:auto 的 150px，内容被裁掉）。
     *    srcdoc 同源，iframe 内可访问 window.frameElement，这里独立做一次回写：
     *    ResizeObserver 即时响应 + 200ms 定时器保底，内容高度变化（换档 / 暗色 /
     *    字体加载）都会收敛。独立打开 demo（无 frameElement）时跳过。 */
    function syncFrameHeight() {
        var frame = global.frameElement;
        if (!frame || !frame.style) return;
        var wrapper = frame.parentElement;

        function write() {
            var h;
            try {
                /* 根元素 offsetHeight 在 iframe 中返回的是视口高度（靠写回自稳定），
                   内容先高后缩时会卡在旧视口值；body.scrollHeight 恒等于内容高度 */
                h = global.document.body ? global.document.body.scrollHeight : 0;
            } catch (e) {
                return;
            }
            if (!h) return;
            var px = h + "px";
            try {
                if (frame.style.height !== px) frame.style.height = px;
                if (wrapper && wrapper.style && wrapper.style.height !== px) wrapper.style.height = px;
            } catch (e) {
                /* 跨域或节点被替换时静默：下一拍自然重试 */
            }
        }

        /* 主动即时同步：尺寸一旦变化（换档 / 暗色 / 折叠）立即回写 */
        if (typeof global.ResizeObserver === "function") {
            new global.ResizeObserver(write).observe(global.document.documentElement);
        }
        global.addEventListener("load", write);
        /* 常驻 rAF 回写：本回调每帧重新注册、必然排在插件自身 rAF 循环之后，
           保证每帧最后一次写入是我们的正确值——插件用根元素 offsetHeight
           （溢出时等于视口高度）做写回，会形成「视口锁死在旧值」的反馈环，
           只有逐帧后写才能打破。值未变化时是零开销比较。 */
        (function loop() {
            write();
            global.requestAnimationFrame(loop);
        })();
        /* 定时器保底层：rAF 在后台标签会被暂停，200ms 轮询保证离屏时仍收敛 */
        global.setInterval(write, 200);
    }

    global.ThemeDemo = { enhance: enhance };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            enhance(document);
        });
    } else {
        enhance(document);
    }
})(window);
