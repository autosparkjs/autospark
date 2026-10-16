---
title: 渲染器
---

# 渲染器

## 关于

渲染器（renderer）决定"远程取回的内容如何变成视图"——模板编译、原样直插、JSON 美化、图片展示皆由不同渲染器承担。router 内置两种渲染器（模板、raw），另提供两种**可选注册**的内置渲染器（JSON、图片），并开放自定义渲染器扩展点。

## 渲染器选择链

加载视图时（fetch 响应后）按以下优先级选择渲染器（ADR-0008 修订）：

| 优先级 | 来源 | 说明 |
| --- | --- | --- |
| 0 | 视图 URL 带 `!` 前缀 | **强制 raw**，最高优先级（前缀在 fetch 前剥除，与业务 query 零冲突） |
| 1 | 路由级显式 `view.renderer` | 配置对象形态声明的渲染器实例，绕过探测 |
| 2 | `options.renderers` 逐个 `test()` | 自定义渲染器按**注册顺序**探测，首个命中的生效 |
| 3 | 模板渲染器兜底 | `test()` 恒真，永远兜底 |

::: warning 无自动格式判定
内置的 JSON、图片渲染器**仅保留导出，不自动生效**——需显式注册到 `options.renderers` 才会按 `test()`（扩展名）探测启用。这是有意设计：探测链保持可预测，格式判定交给应用声明。
:::

## 渲染降级链

选中渲染器**加工失败**（抛异常或返回 `error`）时按固定链条降级：

```txt
选中渲染器失败 → 模板渲染器重试 → 仍失败 → raw 通道原样输出 → 全链失败才落错误页
```

- 降级重读响应体使用**预克隆的 Response**（首次渲染会消费 body）
- **fetch 本身失败不降级**——网络错误/404/超时直接走加载错误通道

## 渲染器一览

| 渲染器 | 类名 | 状态 | 承接内容 |
| --- | --- | --- | --- |
| [默认（模板）](./default.md) | `AutoSparkTemplateViewRenderer` | 内置 | HTML/HTM 及一切其余格式，按 AutoSpark 模板编译，全响应式 |
| [html（raw）](./html.md) | `AutoSparkRawViewRenderer` | 内置 | 原样直插 DOM，不经编译（性能旁路） |
| [Markdown](./markdown.md) | — | 规划中 | 后续实现 |
| [JSON](./json.md) | `AutoSparkJsonViewRenderer` | 需显式注册 | `.json` 渲染为 `<pre>` 美化文本 |
| [image](./image.md) | `AutoSparkImageViewRenderer` | 需显式注册 | 图片扩展名渲染为 `<img>` |
| [自定义](./custom.md) | 继承 `AutoSparkRouterViewRendererBase` | 扩展点 | 任意内容形态 |

## 注册自定义渲染器

```js
class XmlViewRenderer extends AutoSparkRouterViewRendererBase {
    test(response, matched) {
        return (matched.route?.view ?? "").endsWith(".xml");
    }
    async render(response, matched, options) {
        const text = await response.text();
        return { value: `<pre>${escapeXml(text)}</pre>` };
    }
}

const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    renderers: [new XmlViewRenderer(engine)]   // 注册顺序即探测顺序
});
```

详见[自定义渲染器](./custom.md)。
