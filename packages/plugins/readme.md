# @autospark/plugins

[AutoSpark](https://github.com/zhangfisher/autospark) 官方插件包：插件是扩展 autospark 的机制（ADR-0111 jQuery 风格插件机制 + ADR-0114 预加载队列），插件可以是**组件、指令、图标、动作**等任意扩展 autospark 功能的形态。本包即插件开发方式的官方载体——三种扩展形态各有一个官方样板：

| 插件 | 形态 | 注册面 | 产物 |
| --- | --- | --- | --- |
| notifications | 复合插件 | `AutoSpark.ready` + 组件表 + actions 三件套 | `autospark.notifications.js` |
| x-ripple | 指令插件 | `AutoSpark.directive(spec)` | `autospark.ripple.js` |
| x-spin | 指令插件 | `AutoSpark.directive(spec)` | `autospark.spin.js` |
| autospark.button | 组件插件 | `AutoSpark.components[name] = 模板` | `autospark.button.js` |
| 聚合 | 全部官方插件 | — | `autospark.plugins.js` |

## 使用

插件只提供 IIFE 产物（script 即契约），须**先加载引擎再加载插件**（或插件在前——预加载队列兜底双时序）：

```html
<script src="./lib/autospark.js"></script>
<script src="./lib/autospark.plugins.js"></script>
<!-- 或按需一插件一产物 -->
<script src="./lib/autospark.notifications.js"></script>
```

## 插件开发方式（官方范式）

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

实操守则（ADR-0003）：

- **零静态值导入**：对 `autospark` 仅允许编译期 `import type`，运行时能力经 `src/utils/namespace.ts` 解析（ADR-0009 拆自 runtime/bridge.ts）（`globalThis.AutoSpark` 直取 / 预加载队列插件体第二参捕获）；
- **自举单点**：双路径注册统一走家族共享微包 `@autospark/utils` 的 `installPlugin(register)`（单回调签名）；
- **一插件一文件夹**：按形态四区落位（ADR-0009）——`src/directives/<name>/`（指令型）/ `src/components/<name>/`（组件型）/ `src/features/<name>/`（能力扩展型）/ `src/modules/<name>/`（复合型），文件夹自包含（模板 + 逻辑 + 自举），包根 `src/index.ts` 聚合导入全部官方插件。

## 构建

```bash
bun run build    # vite 闭包构建（ADR-0004）；产物复制到 docs/public/autospark.*.js
```

## 开发 demo

```bash
cd packages/plugins
bun run dev      # http://localhost:5181/
```
