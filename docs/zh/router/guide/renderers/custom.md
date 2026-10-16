---
title: 自定义渲染器
---

# 自定义渲染器

## 关于

自定义渲染器是 router 的内容处理扩展点：继承 `AutoSparkRouterViewRendererBase`，实现 `test()`（是否承接）与 `render()`（如何加工），注册到 `options.renderers` 即进入渲染器选择链——注册顺序即探测顺序。

## 指南

### 渲染器接口

```ts
class AutoSparkRouterViewRendererBase {
    router: AutoSparkRouter;
    // 是否承接本次响应（选择链逐个探测，首个 true 生效）
    test(response: Response, matched: AutoSparkMatchedRouteItem): boolean;
    // 加工内容：返回 { value, error?, meta? }
    render(
        response: Response,
        matched: AutoSparkMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<ViewRenderResult> | ViewRenderResult;
}

type ViewRenderResult = {
    value: string;              // 产物 HTML 字符串，交出口渲染
    error?: Error | null;       // 返回 error 触发渲染降级链
    meta?: Record<string, any>; // 元信息（如 raw: true 贯通至出口数据域）
};

type ViewRenderOptions = {
    selector?: string;      // 视图配置声明的提取选择器
    hash: string;           // 本次加载的视图哈希
    signal: AbortSignal;    // 中止信号（超时/导航取消）
    url?: string;           // 最终视图 URL（插值 + base 前缀 + 剥 ! 后）
};
```

`matched` 为当前匹配项：`matched.route` 是路由项声明（`view`/`data`/`params` 等），`matched.params`/`matched.query` 是参数解析结果。

### 编写一个渲染器

以 XML 高亮渲染器为例：

```js
class XmlViewRenderer extends AutoSparkRouterViewRendererBase {
    // 只承接路由声明为 .xml 的视图
    test(response, matched) {
        const view = matched.route?.view;
        return typeof view === "string" && view.split("?")[0].endsWith(".xml");
    }

    async render(response, matched, options) {
        options.signal.throwIfAborted();          // 响应中止立即退出
        const text = await response.text();
        try {
            const escaped = text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            return {
                value: `<pre class="xml-view">${escaped}</pre>`,
                meta: { format: "xml" }
            };
        } catch (e) {
            // 加工失败：返回 error 交渲染降级链（模板 → raw）处置
            return { value: "", error: e };
        }
    }
}
```

### 注册

```js
const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    renderers: [new XmlViewRenderer()]   // 注册顺序即探测顺序
});
```

选择链位置：`!` 前缀 > 路由级显式 `view.renderer` > **`options.renderers` 逐个 test()** > 模板渲染器兜底。详见[渲染器](./index.md#渲染器选择链)。

### 生命周期与降级

- 渲染器抛异常**或返回 `error`** 都触发降级：模板渲染器重试 → raw 兜底 → 全链失败才落错误页
- 降级重读响应体由 router 预克隆 Response 保证——渲染器正常消费 body 即可，无需自行 clone
- `test()` 抛异常视为**不匹配**，静默继续下一个渲染器
- 产物 `meta` 会贯通至出口数据域（`meta.raw: true` 即切换为不编译的直插通道）——自定义渲染器可借 meta 与出口层协同

### 无 router 依赖的轻量渲染器

渲染器基类构造函数接收 router 实例（供日志等能力）。不依赖 router 的渲染器可以忽略该引用，经 engine 构造 options 一步注册（无需等挂载后再 push）：

```js
const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    renderers: [new XmlViewRenderer()]  // 构造函数签名兼容即可
});
```

::: tip 内置渲染器也走同一扩展点
JSON、图片渲染器就是两个"内置的自定义渲染器"——同样继承基类、同样需要注册才生效。需要参考实现时直接阅读其源码（`renderers/json.ts`、`renderers/image.ts`）。
:::
