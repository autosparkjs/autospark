# 插件开发

## 概述

插件是**扩展 AutoSpark 的机制**（ADR-0111，jQuery 风格）：不修改 engine、不做静态 import——插件脚本加载时把组件、指令、图标、动作等扩展能力挂到全局 `AutoSpark` 命名空间上，engine 构造期自动消费。官方插件（通知、涟漪、按钮组件等）随 `@autospark/plugins` 包分发，本页聚焦**包与插件开发方式**（API 速查、官方样板、实操守则）；机制语义的权威说明（全局命名空间、`$.ready` retain、查找链、前置加载队列）见[插件](/zh/guide/engine/plugin)。

全局命名空间注册面一览：

| API | 注册什么 | 示例 |
| --- | --- | --- |
| `$.components[name] = 模板` | 全局组件（跨 engine 真全局，晚注册即生效） | `$.components["hello-card"] = "<div x-text='title'></div>"` |
| `$.actions[name] = 声明` | 全局 action（scope 查找链末端兜底） | `$.actions["greet"] = () => "hello"` |
| `$.directive(spec)` | 全局指令（唯一公共入口，参与首编译） | `$.directive({ name: "highlight", kind: 1, mounted() {} })` |
| `$.icons.add(name, svg)` | 全局图标（document 级单例注册表） | `$.icons.add("star", "<svg>...</svg>")` |
| `$.ready(fn)` | 就绪回调（每个 engine 构造完成后各调一次，retain 语义） | `$.ready((engine) => { ... })` |
| `$.precompile(fn)` | 预编译回调（构造开头 DOM 预处理，无 retain） | `$.precompile((engine) => { ... })` |

::: info 词汇纪律
`$` 是插件脚本内的形参缩写习惯，**不是 API 名**（正式名是 `AutoSpark`）；window 注册表方案（`__AUTOSPARK_COMPONENTS__` 等）已否决删除，唯一存活的 window 键是预加载队列 `__AUTOSPARK_PLUGINS__`——它是通道不是表。
:::

## 快速入门

一个插件就是一个 IIFE 脚本：形参 `$` 接住全局 `AutoSpark`，函数体里按需挂载扩展能力，加载即注册。下方 demo 的第一个 `<script>` 块就是一个完整插件——五种注册面各注册一样，页面随后实例化引擎，注册的一切直接生效：

<demo html="plugin/basic.html"/>

完整注册面示例与逐行说明见[插件 · 快速入门](/zh/guide/engine/plugin#快速入门)。

## 插件闭包与构建工具

插件产物是一段**插件闭包**（ADR-0004）——打包体封进以全局命名空间为参数的 IIFE：

```js
(function (AutoSpark) {
    "use strict";
    /* 打包后的插件体：注册能力经闭包参数落定 */
})(globalThis.AutoSpark);
```

可以直接手写这种形态（上文 demo 即是），也可以用**源码创作糖**：源码里正常写 `import { AutoSpark } from "autospark"`，构建期由官方工具剥除导入、把引用落定到闭包参数——产物依旧零静态导入（脚本即契约，ADR-0003）。工具随 `@autospark/utils` 分发（utils ADR-0002）：

```ts
// vite.config.ts
import { buildAutoSparkPlugin } from "@autospark/utils/vite";

export default {
    plugins: [buildAutoSparkPlugin()],
    build: {
        outDir: "dist",
        rollupOptions: {
            input: { "autospark.my-plugin": "./src/my-plugin.ts" }, // 产物名随消费契约 autospark.<plugin>.js
            output: { entryFileNames: "[name].js" },
        },
    },
};
```

导入剥除规则（`from "autospark"` 的值导入）：

| 源码写法 | 构建产物中的落定 |
| --- | --- |
| `import { AutoSpark } from "autospark"` | 闭包参数直接绑定，零发射 |
| `import { markRaw } from "autospark"`（其他具名） | `const { markRaw } = AutoSpark`（命名空间成员，与运行时桥同构） |
| `import * as NS from "autospark"` / `import Default from "autospark"` | `const NS = AutoSpark` / `const Default = AutoSpark` |
| `import type { ... } from "autospark"` | 原样保留（TS 编译期剥除，产物零痕迹） |

闭包外壳自带**双加载时序**：引擎已加载则插件体即刻执行；`AutoSpark === undefined`（插件先于 `autospark.js` 加载）则插件体推入 `__AUTOSPARK_PLUGINS__` 预加载队列，engine 构造 drain 时以命名空间回放——创作糖源码无须自写自举逻辑，两条时序开箱即用。入口的具名导出在闭包产物中剥离（闭包无 exports 面），`export` 语句残留会在构建期报错。

## 接入时序

插件脚本与 engine 的**双加载顺序兼容**（ADR-0114 预加载队列）：

| 时序 | 路径 |
| --- | --- |
| 插件先于 `autospark.js` 加载 | 全局类尚不存在——插件体推入 `globalThis.__AUTOSPARK_PLUGINS__` 队列，首个 engine 构造开头 drain 执行（早于指令安装与首编译） |
| 插件晚于 `autospark.js`、先于 engine 实例化 | 全局类可达——直接注册（`$.ready` 挂回调 / `$.directive` 入安装器队列，构造期消费） |
| 插件晚于 engine 实例化 | `$.ready` 的 **retain 语义**：立即对全部存活 engine 补调；`$.directive` 广播存活 engine（Runtime 指令即时生效） |

指令插件的**硬时序**（必须先于 engine 实例化注册——晚于首编译则存量 DOM 上的 `x-<name>` 属性已被编译器剥除，指令无从生效）、预加载队列的冻结语义与全部约束清单，见[插件机制](/zh/guide/engine/plugin)。

## 三形态官方样板

`@autospark/plugins` 包内每种扩展形态各有一个官方插件，即插件开发的参照实现：

| 样板 | 形态 | 注册面 | 文档 |
| --- | --- | --- | --- |
| [autospark.button](https://github.com/zhangfisher/autospark/tree/main/packages/plugins/src/components/button) | 组件插件 | `$.components["autospark.button"] = 模板` | [全局组件](../engine/component/global.md) |
| [x-ripple](https://github.com/zhangfisher/autospark/tree/main/packages/plugins/src/directives/x-ripple) | 指令插件 | `$.directive(spec)` spec 重载 + 钩子委托 | [x-ripple](../directives/x-ripple.md) |
| [x-spin](https://github.com/zhangfisher/autospark/tree/main/packages/plugins/src/directives/x-spin) | 指令插件 | `$.directive(spec)` spec 重载 + 钩子委托 | [x-spin](../directives/x-spin.md) |
| [notifications](https://github.com/zhangfisher/autospark/tree/main/packages/plugins/src/modules/notifications) | 复合插件 | `$.ready` + 组件表 + actions 三件套 + 事件清理 | [通知](../engine/notifications/) |

<demo html="plugin/forms.html"/>

## 实操守则

官方插件的工程纪律（`packages/plugins` 内先例），开发自有插件建议沿用：

- **零静态值导入**：插件不 `import "autospark"`——扩展能力全部经全局命名空间在运行期解析；源码级 static import 仅是构建期剥除的创作糖（见[插件闭包与构建工具](#插件闭包与构建工具)），产物零痕迹。
- **产物即插件闭包**：插件只提供 IIFE 闭包产物（ADR-0003 / ADR-0004），`<script>` 直引是唯一官方消费方式；产物命名惯例 `autospark.<plugin>.js`，闭包参数即全局命名空间（旧 `AutoSpark<Plugin>` 全局名已退役，运行时常量改经引擎实例 API 取用，如 `engine.notifications.PERSIST`）。
- **自举双路径**：入口模块尾部执行自举——全局类可达则直注册，否则推预加载队列；两路径殊途同归于正式注册 API。
- **响而不哑**：注册通道关闭、命名空间成员缺失等集成错误显式 error，不静默失效。

::: tip 官方包内部基建
双路径自举收敛为单点 `installPlugin(register)`（家族共享微包 `@autospark/utils`，单回调签名），命名空间捕获收敛于 `@autospark/plugins` 包内 `src/utils/namespace.ts`（ADR-0009 拆自 runtime/bridge.ts）——包内新增插件直接复用，零重复。
:::

## 注意事项

- **不打包 engine**：插件产物零外部运行时依赖（engine 全局除外），消费者自带引擎。
- **命名空间**：组件 / action 注册名统一 `autospark.` 点前缀或自有前缀（如 `autospark.notifications.*`），与用户业务命名零冲突；同名后注册覆盖先注册（查找链与就近覆盖语义见[全局注册表](/zh/guide/engine/plugin#全局注册表)）。
- **全局表覆盖通道**：`$.components` 命中走跨 engine 共享 def 缓存（每组件名全局只编译一次）；需要 per-engine 定制覆盖的组件家族（如通知族）应改在 `$.ready` 里写 engine 级种子（`options.builtinComponents`），见 [notifications 自举](https://github.com/zhangfisher/autospark/blob/main/packages/plugins/src/modules/notifications/bootstrap.ts) 的决策注释。
- **继承家族慎入全局表**：含 `x-define:inherit` 继承链的组件族在全局表按名一次性烘焙，会击穿后续 engine 的覆盖通道（详见通知插件注释）。

---

下一步：机制语义的深入阅读见[插件](/zh/guide/engine/plugin)；安装并使用官方插件——[通知](../engine/notifications/installation.md)、[x-ripple](../directives/x-ripple.md)；自定义指令的完整形态见[自定义指令](../engine/directive/custom.md)。
