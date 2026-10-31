# 安装

`autospark` 是 [AutoStore](https://zhangfisher.github.io/autostore/) 生态的**全功能的响应式前端应用引擎**。**autostore 已打包进 `autospark` 并全量转导出**——只需安装本包，无需单独安装 `autostore`：

```js
import { AutoSpark, AutoStore } from "autospark";
```

## 包管理器安装

::: code-group

```bash [npm]
npm install autospark
```

```bash [pnpm]
pnpm add autospark
```

```bash [yarn]
yarn add autospark
```

```bash [bun]
bun add autospark
```

:::

## 引入方式

### ES Module（推荐）

```javascript
import { AutoSpark } from "autospark";

const engine = new AutoSpark(document.getElementById("app"), {
    user: { name: "张三" },
});
```

### IIFE（浏览器直接引入）

在浏览器中用 `<script>` 标签引入 IIFE 产物——全局 `AutoSpark` 即类本身（库的其他导出如 `AutoStore` 挂为类静态，ADR-0111）：

```html
<script src="https://unpkg.com/autospark/dist/index.global.js"></script>
<script>
    const engine = new AutoSpark(document.getElementById("app"), {
        user: { name: "张三" },
    });
</script>
```

::: tip 兼容别名
旧全局名 `AutoSparkSpaces` 保留为指向同一对象的别名（`AutoSparkSpaces.AutoSpark === AutoSpark`），既有代码不受影响。
:::

::: tip 传入裸状态即可
构造器第二参直接传**裸状态对象**——引擎会自动建立 store（并默认配备 configManager，`@` 配置绑定开箱即用）。无需手动 `new AutoStore`。详见[初始化](../guide/initial.md)。
:::

### CommonJS

```javascript
const { AutoSpark } = require("autospark");
```

## 官方插件包（@autospark/plugins）

应用级构造块（布局 / 覆盖物 / 树 / 版本糖 / 装饰动效 / 工具提示 / 通知 / 按钮 / for 渲染策略）不随 `autospark` 主包发行，按域外移至官方插件包（ADR-0128 核心集定界）——**选择性引入**：引哪个产物就有哪个指令，不引不负担。

::: code-group

```bash [npm]
npm install @autospark/plugins
```

```bash [pnpm]
pnpm add @autospark/plugins
```

```bash [yarn]
yarn add @autospark/plugins
```

```bash [bun]
bun add @autospark/plugins
```

:::

### 产物清单

| 产物                         | 内容                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `autospark.tree.js`          | x-tree 树形渲染                                                        |
| `autospark.layout.js`        | 布局家族：x-layout / x-pane / x-splitter / x-expandable / x-resizable / x-container / x-viewport |
| `autospark.version.js`       | x-version 版本显隐                                                     |
| `autospark.overlay.js`       | 覆盖物家族：x-dialog / x-popover / x-drawer / x-foldable               |
| `autospark.virtual.js`       | x-for `.virtual` 渲染策略                                              |
| `autospark.paging.js`        | x-for `.paging` 渲染策略                                               |
| `autospark.tooltip.js`       | 工具提示（data-tooltip / title 自动转换 / engine.tooltip）             |
| `autospark.ripple.js` / `autospark.spin.js` | x-ripple / x-spin 装饰动效                              |
| `autospark.notifications.js` | 通知子系统                                                             |
| `autospark.button.js`        | 按钮组件                                                               |
| `autospark.plugins.js`       | 聚合全家桶（一个标签包含全部官方插件）                                  |

### 引入

本包产物为 **IIFE 脚本**（脚本即契约）：插件能力经 `<script>` 标签加载。npm 安装后自 `node_modules/@autospark/plugins/dist/` 取得产物文件复制进项目（或经构建工具 copy）；script 直引场景（CDN / 复制文件）无需安装：

```html
<script src="https://unpkg.com/autospark/dist/index.global.js"></script>
<script src="https://unpkg.com/@autospark/plugins/dist/autospark.layout.js"></script>
```

- 加载顺序：插件与引擎脚本**任意先后**皆可（预加载队列保证，ADR-0114），但都须**早于 `new AutoSpark()`**；
- 未加载对应产物时：指令属性被编译器剥除（静默失效）；`.virtual` / `.paging` 策略声明得到 warn + **退化全量渲染**；
- 各指令文档页均有对应的引入说明（如 [x-tree](../directives/x-tree.md)）。

## 依赖说明

`autostore` 与 `really-relaxed-json` 已**打包进产物**（运行时零加载外部包）；`AutoStore` 完整 API 经本包全量转导出，`import { AutoStore } from "autospark"` 即可使用。

类型解析依赖 `fastevent` / `flex-tools` / `type-fest` 三个小包，随 `autospark` 自动安装，无需手动处理。

## TypeScript

`autospark` 自带类型声明（含转导出的 autostore 类型），开箱即用：

```typescript
import { AutoSpark } from "autospark";
import type { AutoSparkOptions } from "autospark";

const options: Partial<AutoSparkOptions> = { debug: true };
const engine = new AutoSpark(el, state, options);
```

---

安装完成后，前往[快速入门](./get-started.md)写下第一个模板。
