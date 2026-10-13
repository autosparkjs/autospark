# 插件

## 概述

AutoSpark 提供 jQuery 风格的插件机制：**插件就是一个 js 文件**，在 `autospark.js` 之后引入即生效——无需注册协议、无需构建步骤，与脚本场景（`<script>` 直引）天然契合。插件可注册全局组件、指令、action、图标，也可通过就绪回调拿到引擎实例做命令式操作。

```html
<!-- my-plugin.js -->
<script>
    (function ($) {
        $.components["hello-card"] = "<div x-text='title'></div>"; // 全局组件
        $.actions["greet"] = () => "hello";                        // 全局 action
        $.directive({ name: "highlight", kind: 1, mounted() {} }); // 全局指令
        $.icons.add("star", "<svg>...</svg>");                     // 全局图标
        $.ready((engine) => { /* 拿到引擎实例 */ });                // 就绪回调
    })(AutoSpark);
</script>
```

## 快速入门

下方 demo 的第一个 `<script>` 块就是一个完整的插件（内联模拟 `my-plugin.js`）：注册全局组件 `hello-card`、全局 action `plugGreet`，并通过 `$.ready` 在引擎实例化后写入日志。页面随后实例化引擎，插件注册的一切**直接生效**。

<demo html="plugin/basic.html"/>

## 指南

### 全局命名空间

IIFE 产物的全局变量 `AutoSpark` **既是构造类又是命名空间**（jQuery 的 `$` 同构）：

```html
<script src="autospark.js"></script>
<script>
    typeof AutoSpark;             // "function" —— 就是 AutoSpark 类
    AutoSpark.AutoStore;          // 库的全量转导出成员挂为类静态
    AutoSpark.AutoSpark;          // 自引用（保留成员式访问）
    new AutoSpark(el, state);     // 直接实例化
</script>
```

`window.AutoSparkSpaces` 保留为指向同一对象的**兼容别名**——旧代码 `AutoSparkSpaces.AutoSpark` / `AutoSparkSpaces.AutoStore` 不受影响，新代码请用短名。

ESM 场景取同一后端（API 挂在类静态上）：

```typescript
import { AutoSpark } from "autospark";
AutoSpark.ready((engine) => { /* ... */ });
```

### $.ready(fn)：就绪回调

注册的回调对**每个引擎实例化后**各调用一次（回调收 `engine` 实例）：

```javascript
$.ready((engine) => {
    // 仅供本引擎的资源在这里走引擎级注册位
    engine.actions.localOnly = () => { /* ... */ };
    engine.on("engine/ready", ({ el }) => { /* ... */ });
});
```

- 插件文件晚于引擎实例化加载时，注册立即对**所有存活引擎**补调（retain 语义）；
- 回调抛错被隔离（记日志跳过），不影响其余回调与引擎构造；
- `engine.destroy()` 后的实例不再收到回调。

### 全局注册表：真全局 vs 引擎级

`$.components` / `$.actions` 是**跨引擎的真全局声明表**（可变普通对象）；`options.components` / `options.actions` 是引擎级注册位。引擎查找链到顶后**兜底遍历全局表**——注册不复制进引擎、无运行时广播，晚注册对已建引擎同样立即生效：

| 资源 | 查找链（就近优先） |
| --- | --- |
| 组件 | scope 局部（x-define）→ `options.components` → **`$.components`** → `options.builtinComponents` |
| action | scope 局部 script → `options.actions` / `engine.actions` → **`$.actions`** |
| 指令 | 经 `$.directive(spec)` 定义即全局安装（广播全部存活引擎） |
| 图标 | `$.icons.add(name, svg)` —— document 级共享注册表 |

```javascript
// 引擎级同名声明覆盖插件全局默认（就近优先）
new AutoSpark(el, state, { components: { "hello-card": "定制版" } });
```

- 插件组件**惰性预编译且全局共享**：每个组件名全局只编译一次，多个引擎实例（含后建的）直接复用编译产物；
- 插件 action 以**触发引擎**的上下文惰性物化——同一声明在多实例页面中各绑定各的 `this`（`el`/`globalState`/生命周期广播），声明无状态即可安全共享；
- 同名后注册覆盖先注册；仅供指定引擎的资源请在 `$.ready` 回调内走引擎级注册位。

### 自定义指令

`$.directive` 是指令定义的**唯一入口，双重载**按实参形态分派（ESM 与脚本同一后端）：

```javascript
// spec 重载：简单指令（最小键集）
$.directive({
    name: "highlight",
    kind: 1, // Runtime（observer 通道）
    mounted() {
        this.el.style.background = "yellow";
    },
});

// 类重载：高级形态（结构指令 / 元素名指令 / 类级钩子 / singleton）
$.directive("reverse", class extends $.AutoSparkDirectiveBase {
    static kind = 0;
    static ownsChildren() { return true; }
    created() { /* 编译期改写子树 */ }
});
```

- 引擎实例化**之前**定义：安装器在首次编译前注册，参与首次编译；
- 引擎实例化**之后**定义：立即广播所有存活引擎（Runtime 指令即时生效）；
- spec 键集与类形态的完整说明见[自定义指令](/zh/guide/directive/custom)。

### 约束与注意事项

::: warning 加载顺序是硬约束
插件必须在 `autospark.js` **之后**引入（script 标签顺序加载天然保证）。晚于引擎实例化的组件/action 经查询期委托依然立即生效，但**已被查询过且未命中**的组件名会按「编译过且失败」缓存——修正声明后请更换组件名或刷新页面。
:::

- **无插件卸载**：全局注册表不随 `engine.destroy()` 回滚（全局资源生命周期即页面生命周期）；
- **无插件表**：引擎不感知「插件」概念，重复加载同一插件是页面作者的责任；
- **不开原型扩展口**：没有 `$.fn` / `$.extend`——「修改引擎」请用 `$.ready` 回调内的公开 API（actions 赋值、事件订阅、`engine.patch` 等）。
