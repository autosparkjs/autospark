---
title: 渲染器
---

# 渲染器 API

## 关于

渲染器决定视图响应如何变成最终内容。自定义渲染器继承 `AutoSparkRouterViewRendererBase`，实例化后注册到 `options.renderers`。各内置渲染器的行为说明见[指南 · 渲染器](../guide/renderers/)。

## 基类

```ts
export type ViewRenderResult = {
    /** 渲染产物（HTML 字符串或原始文本） */
    value: string;
    /** 渲染错误（null/undefined 表示成功） */
    error?: Error | null;
    /** 渲染元信息 */
    meta?: Record<string, any>;
};

export type ViewRenderOptions = {
    /** 自定义内容提取选择器（从加载的 HTML 中提取匹配内容） */
    selector?: string;
    /** 视图哈希标识 */
    hash: string;
    /** 中止信号（导航取消时触发） */
    signal: AbortSignal;
    /** 最终视图 URL（插值 + base 前缀 + 剥除 "!" raw 前缀后），供 <img src> 等使用 */
    url?: string;
};

export class AutoSparkRouterViewRendererBase {
    router: AutoSparkRouter;
    constructor(router: AutoSparkRouter);
    /** 是否选用本渲染器：返回 true 即中选（按注册顺序首个命中） */
    test(_response: Response, _matched: AutoSparkMatchedRouteItem): boolean;
    /** 执行渲染 */
    render(
        _response: Response,
        _matched: AutoSparkMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<ViewRenderResult>;
}
```

## 渲染器选择优先级

选中顺序固定为（ADR-0008 及其修订）：

1. `!` 前缀强制 raw（`view` URL 以 `!` 开头，fetch 前剥除该前缀）
2. 路由级显式 `renderer`（`view` 为配置对象时的 `renderer` 字段）
3. `options.renderers` 逐个 `test()`
4. 模板渲染器兜底

**降级链**：选中渲染器失败 → 模板渲染器重试 → 仅模板也失败才走 raw 通道兜底。

::: warning 无自动格式判定
内置 JSON / Image 渲染器**仅保留导出**，需显式注册到 `options.renderers` 才生效；`!` 前缀与业务查询参数无冲突。
:::

## 内置渲染器类

全部可从 `autospark/router` 导入，需实例化注册（构造函数接收 router 实例）：

| 类 | 说明 |
| --- | --- |
| `AutoSparkTemplateViewRenderer` | 模板渲染器：经 engine 编译激活指令与组件（兜底渲染器） |
| `AutoSparkRawViewRenderer` | raw 渲染器：普通 x-html 直挂，不经 engine 编译，保证性能 |
| `AutoSparkJsonViewRenderer` | JSON 渲染器：格式化展示 JSON 响应（需显式注册） |
| `AutoSparkImageViewRenderer` | Image 渲染器：以 `<img>` 呈现图片响应（需显式注册）；同包导出 `IMAGE_EXTENSIONS` 常量（图片扩展名集合，供 `test` 判定参考） |

```js
import { AutoSparkJsonViewRenderer } from "autospark/router";

const engine = new AutoSpark(host, {}, { routes: [/* ... */] });
const router = host.router; // router 已挂载（routes 声明存在即挂载）

// 渲染器构造依赖 router 实例——推荐先挂载、后注册
router.viewLoader.renderers.push(new AutoSparkJsonViewRenderer(router));
```

::: tip 注册位置
渲染器最终服务于视图加载器 `router.viewLoader.renderers`。经构造 options `renderers` 数组注册要求渲染器**不依赖 router 引用**（如自定义的无状态渲染器）；内置渲染器构造需要 router，故用上述后注册方式。注册顺序即 `test()` 优先级。
:::

## 自定义渲染器

```js
import { AutoSparkRouterViewRendererBase } from "autospark/router";

class MarkdownRenderer extends AutoSparkRouterViewRendererBase {
  test(response, matched) {
    return (matched.route?.view ?? "").endsWith(".md");
  }
  async render(response, matched, options) {
    const text = await response.text();
    return { value: markdownToHtml(text) }; // { value, error?, meta? }
  }
}

// 无 router 引用的渲染器可直接经构造 options 注册
new AutoSpark(host, {}, {
  routes: [/* ... */],
  renderers: [new MarkdownRenderer()],
});
```

`render` 收到的 `response` 是**预克隆的响应**（避免 body 已被消费影响降级链重试），可放心读取；`options.signal` 已触发时应尽快返回或抛出中断。
