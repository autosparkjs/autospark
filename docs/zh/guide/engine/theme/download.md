# 下载主题

## 概述

`ThemeScope` 提供两个样式导出入口，产物语义按作用域分叉（ADR-0006）：

| 入口 | 返回 | root 作用域 | 局部作用域 |
| --- | --- | --- | --- |
| `toStyles()` | CSS 字符串 | 作用域全量 CSS（基础变量 → 主题标尺 → 语义色，与 connect 注入顺序一致） | 同左 |
| `download()` | 下载 `.css` 文件 | **合规静态主题包**：指纹头 + 三块样式 + 当前维度烘焙守卫块 | 作用域样式快照（`console.warn` 提示不可作静态包） |

两个关键性质：

- **同源**：root 的下载产物与 `generate-theme` CLI 共用同一个组装函数，同参产物**逐字节一致**——不存在「CLI 一套、浏览器一套」的分叉；
- **所见即所得**：烘焙进产物的维度（dark / colorized / size / spacing / shadow / radius）取**下载时刻**的当前生效状态——「在页面上调好主题，下载即得该形态的静态包」。

<demo html="theme/download-overview.html"/>

## 指南

### root 作用域：合规静态主题包

`themeManager.root.download()`（或 `themeManager.download()`）的产物结构：

| 段 | 内容 | 说明 |
| --- | --- | --- |
| 指纹规则块 | `--x-theme-static: 2\|…`（v2 共 15 字段） | 前 9 个颜色字段是静态层匹配契约，后 6 个维度字段仅供首访采纳（ADR-0005） |
| 三块样式 | 基础变量 → 主题标尺 → 语义色 | `toStyles()` 输出，与运行时注入同源 |
| 维度烘焙守卫块 | `:root:not([data-X])` 形默认值 | 仅当下载时维度非库默认才出现；零 JS 首帧即该形态 |

下载后作为静态层在 head 引入，运行时水合后自动接管：

```html
<head>
    <link rel="stylesheet" href="/theme/autospark_root.css" />
    <!-- 静态层在前；运行时水合比对指纹，一致则跳过注入 -->
    <script type="module" src="/app.js"></script>
</head>
```

接管链路与 CLI 产物完全相同：指纹前 9 字段一致 → 跳过三块注入；不一致 → 告警并回退动态注入（ADR-0004）。
因此「页面上交互调主题 → 下载 → 部署为静态层」与「`generate-theme` CLI 生成」是两条等价的交付路径，
前者适合边调边看的调参场景，后者适合固定预设的构建期场景。

<demo html="theme/download-static-package.html"/>

### 局部作用域：样式快照

静态层契约只服务 root 作用域——局部作用域的下载产物选择器是该作用域自身的，
挂 `<link>` 后不会被运行时指纹接管。因此非 root 作用域调用 `download()` 时：

1. `console.warn` 一次（文案注明产物是快照、不可作静态主题包）；
2. 仍导出 `toStyles()` 产物——快照本身有合法用途：SSR 构建期取数、调试导出、
   给「不跑运行时」的局部容器做样式交付。

```js
const scope = themeManager.addScope({ id: "sidebar", cssSelector: ["#sidebar"] });
scope.attach(document.getElementById("sidebar"));
scope.connect();
scope.download(); // warn + 下载 sidebar 作用域的全量 CSS 快照
```

<demo html="theme/download-scope-snapshot.html"/>

### 构建期取数：toStyles()

只需要 CSS 字符串（构建脚本、SSR 内联、自定义落盘管道）时用 `toStyles()`：

```js
// 构建脚本里新建一个不 connect 的 root scope 取全量产物
import { AutoSparkThemeScope } from "@autospark/theme";

const scope = new AutoSparkThemeScope({
    id: "root",
    cssSelector: [":host", ":root"],
    autoConnect: false,
    autoAttach: false,
    persistence: false,
    themeColor: "blue",
    dark: true,
});
writeFileSync("dist/my-theme.css", scope.toStyles());
```

::: tip 要合规静态包（带指纹头）时请走整条组装路径
`toStyles()` 只是三块样式——构建期要指纹头与维度烘焙守卫块时，
用 [`generate-theme` CLI](./static.md)（内部即 `toStyles()` + 指纹 + 守卫块的同一组装），
或浏览器端 `root.download()`。
:::

---

下一步：[API 参考](./api.md)。
