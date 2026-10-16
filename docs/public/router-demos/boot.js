/**
 * 文档站路由 demo 环境自举（docs 专用，非 router 运行时依赖）。
 *
 * <demo> 插件将 demo 页以 document.write 写入 about:blank iframe——该文档没有
 * 可用于 URL 解析的 base，view / data 通道的绝对路径 fetch（"/autospark/..."）
 * 会因 base URL 非法而静默失败。此处把路径绝对形式补全为 origin 绝对形式
 * （iframe 继承父页面 origin）；router 内部按调用时取用 window.fetch，polyfill 即时生效。
 * 真实页面（非 about:blank）直接跳过，零影响。
 */
(function () {
    if (document.URL !== "about:blank") return;
    var origin = window.location.origin;
    var rawFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        if (typeof input === "string" && input.charAt(0) === "/") input = origin + input;
        return rawFetch(input, init);
    };
})();
