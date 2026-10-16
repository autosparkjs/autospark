---
title: Markdown 渲染器
---

# Markdown 渲染器

::: warning 后续实现
Markdown 渲染器**尚未实现**——本页为规划占位，落地后更新为完整指南。
:::

## 规划语义

- **承接内容**：`.md` / `.markdown` 扩展名的远程视图
- **产物**：解析为 HTML 片段，默认按模板渲染（可与 raw 通道组合）
- **注册方式**：预计与 JSON/图片渲染器一致——导出渲染器类，由应用显式注册到 `options.renderers`，不默认自动判定

## 当前的替代方案

在特性落地前，可基于自定义渲染器扩展点自行实现（解析库自选），详见[自定义渲染器](./custom.md)：

```js
import { marked } from "marked";

class MarkdownRenderer extends AutoSparkRouterViewRendererBase {
    test(response, matched) {
        return /\.md$/.test(matched.route?.view ?? "");
    }
    async render(response) {
        const md = await response.text();
        return { value: marked.parse(md) };
    }
}
```
