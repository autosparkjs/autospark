# 登记面五处（registration）

新增组件须登记五处，缺一处即断链（构建不出产物 / 聚合不挂载 / 文档不可达）。

## 目录

- [① 构建清单 CLOSURE_ARTIFACTS](#-构建清单-closure_artifacts)
- [② 聚合入口 src/index.ts](#-聚合入口-srcindexts)
- [③ demo HTML](#-demo-html)
- [④ 组件文档 md](#-组件文档-md)
- [⑤ 侧边栏](#-侧边栏)
- [VitePress 陷阱](#vitepress-陷阱)

## ① 构建清单 CLOSURE_ARTIFACTS

`packages/plugins/vite.config.ts` 的 `CLOSURE_ARTIFACTS` 数组追加一项（**放数组末尾**，首项是聚合产物承担者）：

```ts
const CLOSURE_ARTIFACTS = [
  { entry: "src/index.ts", outFile: "autospark.plugins.js", label: "AutoSparkPlugins (aggregate)" },
  // …既有项…
  { entry: "src/components/<name>/index.ts", outFile: "autospark.<name>.js", label: "<Name>" },
] as const;
```

机制：主构建承担首项（聚合产物），closeBundle 逐项循环构建其余——rollup 多入口会提取共享 chunk 破坏「一产物一自包含闭包」契约，故一产物一次构建；构建成功后自动 gzip 体积日志 + 复制到 `docs/public/`。

## ② 聚合入口 src/index.ts

`packages/plugins/src/index.ts` 末尾追加副作用导入（顺序即注册顺序，注册面互不冲突）：

```ts
import "./components/<name>/index";
```

这让 `autospark.plugins.js`（一标签挂全部官方插件）也包含新组件。

## ③ demo HTML

落位 `docs/demos/components/<name>/basic.html`（复数 `components/` 对应组件插件文档区；勿与单数 `demos/component/`（engine x-component 指令特性）混淆）。多场景可加 `<name>/variants.html` 等。

标准骨架（引擎 + 插件产物双脚本 + 主题 CSS + `.demo-app` 容器）：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>组件名 · 基础用法</title>
    <!-- 引擎先加载；插件脚本随后（自举注册，零手动接线） -->
    <script src="/autospark/autospark.js"></script>
    <script src="/autospark/autospark.<name>.js"></script>
    <!-- 主题双引：静态 CSS 只含基础标尺与部分派生；完整 --auto-* 语义层（含语义色）由 theme 运行时注入，缺它则回退链落到第三级兜底 -->
    <link rel="stylesheet" href="/autospark/autospark-theme.css" />
    <script src="/autospark/autospark.theme.js"></script>
    <link rel="stylesheet" href="/autospark/bulma.min.css" />
  </head>
  <body>
    <div class="demo-app section" x-data="{}">
      <div class="block">
        <!-- x-component:autospark.<name> 实例化；值 = props 注入 -->
        <x-<name> x-component:autospark.<name>="{ label: '基础用法' }"></x-<name>>
      </div>
      <div class="block" data-dark>
        <!-- 暗色态验证：容器裸挂 data-dark -->
      </div>
    </div>
    <script>
      new AutoSpark(document.querySelector(".demo-app"), {});
    </script>
  </body>
</html>
```

要点：

- 实例化宿主用任意元素（button 类组件可直接用 `<button>` 承载，化身后宿主即组件根）
- 主题**双引**：`autospark-theme.css`（静态基础层）+ `autospark.theme.js`（运行时派生层）——只引静态 CSS 时语义色变量（`--auto-primary-color` 等）不存在，回退链落到第三级兜底，主题化展示不完整；两个都不引也能跑（纯兜底形态）
- demo 资源路径以 `/autospark/` 开头（docs/public 映射；本地验证时用 Bun.serve 把 docs/public 挂到 /autospark/）

## ④ 组件文档 md

落位 `docs/zh/components/<name>.md`。骨架：

```markdown
# <Name> 组件

一句话定位（做什么、何时用）。

引入方式：`<script src="autospark.autospark.<name>.js"></script>`（引擎之后），
或聚合产物 `autospark.plugins.js`。

## 基础用法

说明 + 属性表（props 名 / 类型 / 默认值 / 说明）。

<demo html="components/<name>/basic.html"/>

## 变体与尺寸

（type/size 变体、暗色模式等场景，各嵌一个 demo）

<demo html="components/<name>/variants.html"/>

## 主题化

组件消费的 `--auto-*` 语义变量清单 + 使用者覆盖通道（`--asc-<name>-*`）示例。
```

demo 嵌入语法：`<demo html="路径"/>`，路径相对 `docs/demos/`（不带扩展名的目录路径 + 文件名，如 `components/<name>/basic.html`）。

## ⑤ 侧边栏

`docs/.vitepress/config/index.ts` 的 sidebar 对象内，`"/zh/components/"` 键的数组里追加（该键与 nav 的「组件」入口同级并存；若键尚不存在则创建）：

```ts
"/zh/components/": [
  { text: "<Name> 组件", link: "/zh/components/<name>" },
],
```

顶栏 nav 已有「组件」入口指向 `/zh/components/`，无需另动。若该数组后续演化出分组结构，跟随既有分组惯例。

## VitePress 陷阱

1. **行内 code 花括号**：行内 `` `{{ a.b }}` `` 会被 Vue 求值并 SSR 报错——含双花括号的模板表达式一律放代码 fence（fence 才有 v-pre）。
2. **demo 路径**：`<demo html="..."/>` 的路径以 `docs/demos/` 为根且**不带开头斜杠**；写错时文档页 demo 区空白。
3. **文档语言**：全中文（含 demo 标题、属性表头）。
