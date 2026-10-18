---
title: image 渲染器
---

# image 渲染器

## 关于

图片渲染器（`AutoSparkImageViewRenderer`）把图片文件视图渲染为 `<img src="最终URL">`——用路由系统展示图片资产，享受统一导航、缓存与出口管理。

::: warning 需显式注册
内置格式自动判定已移除——图片渲染器**仅保留导出**，需显式注册到 `options.renderers` 后按 `test()`（图片扩展名）探测生效。
:::

承接的扩展名：`.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` `.bmp` `.ico` `.avif`（svg 为文本格式，亦按图片处理）。

## 指南

### 注册

```js
const { AutoSparkImageViewRenderer } = AutoSparkRouter;
const router = host.router;
router.viewLoader.renderers.push(new AutoSparkImageViewRenderer(router));
```

注册方式与依赖说明见 [JSON 渲染器](./json.md#注册)与[自定义渲染器](./custom.md)。

### 使用

```json
{
    "path": "/gallery/:name",
    "title": "图片预览",
    "view": "/images/:name.png"
}
```

导航到 `/gallery/cat` 时渲染：

```html
<img class="autospark-image-view" src="/images/cat.png" alt="">
```

`src` 取**插值 + base 前缀处理后的最终视图 URL**，与 fetch 地址一致（`!` 前缀会剥除）。

### 行为细节

- **忽略响应体**：不做字节解析，产物只有 `<img>` 标签
- **仍经 fetch 校验存在性**：图片 404 走加载错误通道（错误页/错误边界），不会渲染出裂图 URL
- `test()` 基于路由声明的视图源扩展名判定（去 query/hash、小写化），与响应 `Content-Type` 无关

### 定制展示

产物为 `<img class="autospark-image-view">`，用 CSS 控制尺寸与观感：

```css
img.autospark-image-view {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 10%);
}
```
