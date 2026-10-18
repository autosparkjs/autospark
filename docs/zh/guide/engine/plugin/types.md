# 类型扩展

## 概述

插件在**运行时**注册组件、action、指令、图标（见[插件](../plugin.md)）；类型面是另一半：宿主应用的 TypeScript 代码在**写构造选项、读状态、订阅事件**时，要拿到插件带来的类型与补全。AutoSpark 的类型面是开放的——三处接缝是 `interface`，经 TypeScript 的**声明合并**（`declare module "autospark"`）扩展，插件的 `.d.ts` 写一次，所有安装该插件的应用自动生效：

| 要扩展 | 接缝 | 合并后的效果 |
| --- | --- | --- |
| 构造选项（Options） | `interface AutoSparkOptions` | `new AutoSpark(el, state, { 插件键 })` 与 `engine.options.插件键` 获得类型检查与补全 |
| 根状态（State） | 不是接缝——走**类泛型** `AutoSpark<State>`（见[根状态](#根状态-类泛型与-interface-extends)） | `engine.state.xxx` 按应用状态接口检查 |
| 元状态 `state.$` | `interface AutoSparkMeta` | `engine.state.$.插件元变量` 类型化（ADR-0112） |
| 事件（Events） | `interface AutoSparkEvents` | `engine.on(事件名)` 的回调 payload、`engine.emit(事件名, payload)` 类型化 |

最小示例（三个接缝一把声明）：

```typescript
// 插件包的 d.ts——必须是模块形态（文件里有 import/export，见下文「写在插件包里」）
import "autospark";

declare module "autospark" {
    // 构造选项：宿主 new AutoSpark(el, state, { locale: {...} }) 合法化
    interface AutoSparkOptions {
        locale?: { timezone?: string };
    }
    // 元状态容器 state.$：引擎预置字段在 AutoSparkPresetVars，本 interface 是消费者的合并接缝
    interface AutoSparkMeta {
        tenant: string;
    }
    // 事件契约：新增事件键 + 载荷类型
    interface AutoSparkEvents {
        "locale/changed": { timezone: string };
    }
}
```

::: tip 接缝是 interface，不是 type
声明合并只对 `interface` 生效（`type` 别名不能合并）。`AutoSparkOptions` / `AutoSparkMeta` / `AutoSparkEvents` 三个接缝都从包根导出（`import type { … } from "autospark"`），可直接指名引用；`AutoSparkPresetVars` 是**引擎自有字段**（`viewport` / `version` / `language`），不参与合并，不要试图覆盖它（见 ADR-0112）。
:::

## Options：扩展构造选项

插件有配置项时，往 `AutoSparkOptions` 追加可选键即可——宿主传参与插件读取两侧同时获得类型：

```typescript
// 插件侧：声明（d.ts）
declare module "autospark" {
    interface AutoSparkOptions {
        locale?: { timezone?: string };
    }
}
```

```typescript
// 宿主侧：写选项——多出来的键合法且可补全（第三参是 Partial<AutoSparkOptions<State>>）
new AutoSpark("#app", state, { locale: { timezone: "Asia/Shanghai" } });
```

```typescript
// 插件侧：运行时读取（$.ready 回调内拿 engine 实例，见插件文档）
$.ready((engine) => {
    const tz = engine.options.locale?.timezone ?? "UTC"; // engine.options 即 AutoSparkOptions<State>
});
```

::: warning 合并只加类型，不加行为
`declare module` 不会让引擎认识这个选项——引擎不消费、不校验、不给默认值。默认值合并、配置消费逻辑由插件在 `$.ready`（或自己的初始化代码）里实现；类型只是把这份契约写进 `.d.ts`。
:::

## State：扩展状态类型

状态有两层，扩展方式不同：**根状态**是应用自己的数据树，走类泛型；**元状态 `state.$`** 是框架保留容器，走声明合并。

### 根状态：类泛型与 interface extends

`AutoSpark` 是泛型类：`new AutoSpark<AppState>(el, state)`，`engine.state`、`engine.store.state`、组件实例门面的 `globalState` / `data` 全局通道都按 `AppState` 检查。插件要「让宿主状态带上自己的片段」时，导出一个 `interface`，宿主用 `interface … extends` 合并进自己的状态接口（两个 `interface` 同名继承即自动合并，无需 `declare module`）：

```typescript
// 插件包：导出它的状态片段
export interface LocaleState {
    locale: { timezone: string };
}
```

```typescript
// 宿主应用：组装自己的 AppState
import type { LocaleState } from "my-locale-plugin";

interface AppState extends LocaleState {
    user: { name: string };
}

const app = new AutoSpark<AppState>("#app", {
    locale: { timezone: "UTC" }, // 必填字段被检查
    user: { name: "li" },
});

app.state.locale.timezone; // ✅ 类型化
app.state.locale;          // ❌ 缺字段在构造期即报错
```

插件负责在运行时**写入**它声明的状态片段（`$.ready((engine) => { engine.state.locale ??= { timezone: "UTC" }; })` 或要求宿主在初始状态里提供）——类型声明与运行时写入是两件事。

### 元状态：`state.$` 走 `AutoSparkMeta`

`state.$` 是框架保留的元状态容器（`$.viewport` 等引擎字段住这里），引擎预置部分在 `AutoSparkPresetVars`，对外的 `AutoSparkMeta` 是**专门留出的声明合并接缝**（ADR-0112）：

```typescript
declare module "autospark" {
    interface AutoSparkMeta {
        tenant: string; // 插件的元变量
    }
}

app.state.$.tenant;    // ✅ string
app.state.$.viewport;  // ✅ 引擎预置字段照常可用
```

| 通道 | 扩展方式 | 运行时写入方 |
| --- | --- | --- |
| 根状态 `engine.state.xxx` | 类泛型 `AutoSpark<State>` + 宿主 `interface … extends` | 宿主初始状态 / 插件 `$.ready` 内写入 |
| 元状态 `engine.state.$.xxx` | `declare module` 合并 `AutoSparkMeta` | 插件 `$.ready` 内写入（引擎字段由引擎维护） |

::: warning `$` 容器的已知偏差
`state.$` 类型上恒为必选，但 `options.viewport === false` 或环境无 `matchMedia` 时容器**不注入**——读取方自担（ADR-0112 的既定取舍）。
:::

## 事件：扩展事件面

插件广播自己的生命周期 / 业务信号时，把事件键与载荷写进 `AutoSparkEvents`——**订阅与发射两侧同时类型化**（`engine.on` / `engine.once` / `engine.emit` 的类型都由这张表推导）：

```typescript
// 插件侧：声明事件契约
declare module "autospark" {
    interface AutoSparkEvents {
        "locale/changed": { timezone: string };
        "locale/imported": { count: number };
    }
}
```

```typescript
// 插件侧：发射（payload 形态受检查）
$.ready((engine) => {
    engine.emit("locale/changed", { timezone: "Asia/Shanghai" }); // ✅
    engine.emit("locale/changed", { timezone: 1 });               // ❌ 类型报错
});
```

```typescript
// 宿主侧：订阅（回调的 m.payload 类型化）
app.on("locale/changed", (m) => {
    m.payload.timezone; // ✅ string
});
```

要点：

- **只对声明过的键生效**：未写进 `AutoSparkEvents` 的事件名不会报错（`on` 的事件名参数是宽松的 `string`），payload 退化为宽松类型——类型收益完全取决于你声明了哪些键；
- **引擎自带事件不受影响**：`engine/ready`、`components/<名>/registered`、`actions/*/resolved` 等内置键（含通配符形态）的载荷类型照常可用，合并只是**追加**新键；
- **类型不改变运行时**：事件仍需真的 `emit` 才会被收到；合并不会注册任何事件、不会产生 retain——retain 语义由引擎按事件名自行处理（见[组件注册事件](../component/index.md#组件注册事件)）。

## 写在插件包里：d.ts 的形态要求

承载 `declare module "autospark"` 的 `.d.ts` 必须是**模块形态**——文件里至少有一个 `import` / `export`：

```typescript
// ✅ 模块形态：含 import/export，是「对 autospark 的模块增强」
import "autospark";
declare module "autospark" {
    interface AutoSparkOptions {
        myPlugin?: { debug?: boolean };
    }
}
export interface MyPluginOptions {
    debug?: boolean;
}
```

```typescript
// ❌ 全局脚本形态：无任何 import/export —— declare module 会变成 ambient 模块声明，
//    遮蔽真实包，宿主 `import { AutoSpark } from "autospark"` 直接 TS2305 找不到导出
declare module "autospark" {
    interface AutoSparkOptions {
        myPlugin?: { debug?: boolean };
    }
}
```

两种常见落位：

| 落位 | 说明 |
| --- | --- |
| 插件包自带 `.d.ts`（模块形态） | 随包发布，宿主 `import "my-plugin"` 时自动载入增强，无需宿主做任何事 |
| 宿主项目里手写增强 | 单个插件、或给自己的应用补类型：写在任意被 `tsconfig.include` 收录的 `.ts` / `.d.ts` 里即可 |

## 不开放合并的部分

- **注册表按键类型**：`$.components` 是 `Record<string, string>`、`$.actions` 是 `Record<string, ActionDecl>`——声明合并**不能**给单个组件名 / action 名加类型。需要按名类型时，插件导出常量类型由宿主自行引用（如 `const NAME = "hello-card" as const`）；
- **脚本（IIFE）场景没有类型面**：`<script src="autospark.js">` 纯 JS 写法谈不上类型；类型扩展只服务于 ESM + TypeScript 的宿主；
- **引擎内部类型**：`AutoSparkPresetVars`、`AutoSparkPatchOptions`、指令选项等是引擎自有具体用途类型，不在开放接缝清单里——发现缺口请提 issue，而不是绕过合并硬转 `as any`。

## 深入阅读

- [插件](../plugin.md)——运行时注册面：全局注册表、`$.directive`、`$.ready`、前置加载
- [状态](../state.md)——状态模型与保留键（`$` / `$scopes`）
- [动作](../action.md)——action 声明形态与 `this` 上下文
- ADR-0112（`packages/engine/docs/adr/0112-state-typed-meta-container.md`）——`state.$` 类型化与 `AutoSparkMeta` 合并接缝的由来
