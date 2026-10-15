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
