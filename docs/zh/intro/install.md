# 安装

`autospark` 是 [AutoStore](https://zhangfisher.github.io/autostore/) 生态的声明式模板渲染引擎。**autostore 已打包进 `autospark` 并全量转导出**——只需安装本包，无需单独安装 `autostore`：

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

在浏览器中用 `<script>` 标签引入 IIFE 产物，挂载在全局 `AutoSparkSpaces` 下：

```html
<script src="https://unpkg.com/autospark/dist/index.global.js"></script>
<script>
    const engine = new AutoSparkSpaces.AutoSpark(document.getElementById("app"), {
        user: { name: "张三" },
    });
</script>
```

::: tip 传入裸状态即可
构造器第二参直接传**裸状态对象**——引擎会自动建立 store（并默认配备 configManager，`@` 配置绑定开箱即用）。无需手动 `new AutoStore`。详见[初始化](../guide/initial.md)。
:::

### CommonJS

```javascript
const { AutoSpark } = require("autospark");
```

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
