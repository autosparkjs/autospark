# ADR-0112：`state.$` 元状态容器类型化

- 状态：已接受（2026-10-13；2026-10-16 修订：类型更名 `AutoSparkVars` → `AutoSparkMeta`，见文末修订记录）
- 关联：承接 **ADR-0105**（`$` 元状态容器与视口档位——本 ADR 只加类型，不改其运行时语义）、**ADR-0057**（`globalState` 通道更名）、**ADR-0044**（store 自建与所有权）；并列 **ADR-0091/0094**（`?raw` 类型声明纪律）

## 背景

`state.$` 是 ADR-0105 定下的引擎元状态容器（严格保留键 `$`，`$.viewport` 为首个居民），但类型系统完全不认识它：`AutoSpark<State>` 的 `State` 只装用户态，`store.state` 落在 `ComputedState<State>` 上，于是 `engine.state.$.viewport` 拿到的是 `any`（`State` 默认 `Record<string, any>`）。`AutoSparkMeta` 早已定义并导出，却在 `engine.ts` 里是个零引用的死导入。

结果是**消费通道越多，漏越多**：`engine.state`、`engine.store.state`、`scope.globalState`、`ComponentInstance.globalState`、`ComponentMethodContext.globalState`、`AutoSparkActionContext.globalState` 六条通道各自为政，其中四条写死了 `Record<string, any>`。

## 决策

### 决策 1：命名类型 `AutoSparkState<State>` 收口全部通道

```ts
export type AutoSparkState<State extends Dict = Record<string, any>> =
    ComputedState<State> & { $: AutoSparkMeta };
```

落点（六条通道同一类型，杜绝认知漂移）：

| 通道 | 位置 |
|---|---|
| `store` 字段 | `AutoStore<State & { $: AutoSparkMeta }>` |
| `state` getter | `AutoSparkState<State>` |
| `scope.globalState` | 无注解，随 `engine.state` 自动跟随 |
| `ComponentInstance.globalState` | `AutoSparkState<Record<string, any>>` |
| `ComponentMethodContext.globalState` | 同上 |
| `AutoSparkActionContext.globalState` | 同上 |

非泛型语境统一用 `AutoSparkState<Record<string, any>>`——`ComputedState<Record<string, any>>` 保有字符串索引签名，`globalState.anyKey` 照旧可用，只是额外多了强类型的 `$`。

### 决策 2：`$` 标为**必选**，以 JSDoc 承认例外

`$` 是**必选**而非 `$?`。默认配置下 `ViewportManager` 构造期必注入，裸写 `engine.state.$.viewport` 是主流用法；标可选会让每个读取处被迫 `?.` 或非空断言，为一种非默认配置惩罚全部主流场景。

类型在 `options.viewport === false` 或环境无 `matchMedia` 时**是错的**（容器不注入，值为 `undefined`）。此偏差写进 `AutoSparkState.$` 与 `state` getter 的 JSDoc，读取方自担。

### 决策 3：`AutoSparkPresetVars` 诚实化

```ts
export type AutoSparkPresetVars = {
    version?: string;   // 无运行时写入方
    language?: string;  // 无运行时写入方
    viewport: ViewportTier;  // 收紧自 string（六档联合）
};
```

- `version` / `language` 全仓库**没有任何写入方**，标必选等于让 `engine.state.$.version` 编译期 `string`、运行期 `undefined` → 转可选。
- `viewport` 收紧为 `ViewportTier`（`"xs" | "sm" | "md" | "lg" | "xl" | "xxl"`，复用 `features/viewport/types`）——该模块零 import，`types/index.ts` 反向引用不成环。

`AutoSparkMeta` 保持空 interface 并 `extends AutoSparkPresetVars`：它是**消费者的声明合并接缝**（`declare module "autospark" { interface AutoSparkMeta { tenant: string } }`），引擎自有字段留在 `AutoSparkPresetVars` 不参与合并。

### 决策 4：断言收敛单点，公共选项面不动

唯一断言在 `_createStore` 返回处（`as unknown as AutoStore<State & { $: AutoSparkMeta }>`）。**`AutoSparkOptions<State>.storeOptions` 维持 `AutoStoreOptions<State>` 不变**——`AutoStore` 对 `State` 是不变位，把它一并拓宽是拿公共 API 去赌 `AutoStoreOptions` 的变位（未验证），收益只是省一处断言。断言落在「engine 保证构造期注入 `$`」这一事实上，位置正当。

### 决策 5：范围只含 `$`

`$scopes` / `$notifications` 另两个顶层保留键**本次不动**：`$notifications` 已有 `AutoSparkNotificationsState` 但清理会牵动几十处 cast，`$scopes` 是开放字典、类型化收益低。两者各立课题。

## 考虑过的选项

### 否决：改运行时无条件注入 `$` 容器

构造期恒注入 `$`（`viewport` 只决定要不要写该字段），类型即永远为真，并对齐 ADR-0105「后续引擎内部数据逐步迁入本容器」的既定方向。

否决理由：超出「加类型」的字面范围，会连带改动 `viewport.test.ts`（`expect(state.$).toBeUndefined()`）与 CONTEXT.md 词条。**复活路径**：若日后 `$` 确实要常驻承载更多引擎内部数据，无条件注入 + 保持必选类型是顺理成章的下一步，届时决策 2 的偏差即自动消失。

### 否决：双类型参数派生方案

```ts
export class AutoSpark<
    UserState extends Record<string, any> = Record<string, any>,
    State = UserState & { $: AutoSparkMeta },
>
```

意图是让类体内代码「自动继承」。实测（TypeScript 探针）：

- **原样编译不过**——`State` 无约束，`AutoStore<State>` 要求 `State extends Dict`（TS2344）。
- **核心声称在类体内不成立**——类体里 `State` 是裸类型参数，TS 只看约束面不看默认值，`store.state.$` 与裸 `s.$` 都取不到（TS2339）。
- **断言一个没省**——`user as State` 反被判「类型不充分重叠」，需 `as unknown as`，比现状更难。
- 补上 `State extends UserState & { $: AutoSparkMeta }` 后全部成立（类体内可取、`store` 写法更简、getter 零断言、第二参数覆盖被约束堵死）。

最终否决，理由：三项收益全是**引擎内部写法便利**，而对外消费者能力与本 ADR 方案**完全等价**（`e.state.$` 两边都已是 `AutoSparkMeta`）；代价是 engine.ts 内 16 处 `State` 需逐一分类为输入位 / 输出位——**输入位误写 `State` 会强制消费者传 `$`，炸掉 196 个调用点**（其中 `constructor(state)` 与 `options?: AutoSparkOptions<State>` 两处最危险，后者正是决策 4 明确否决的拓宽）。用永久的双参数公共 API 承诺 + 误配风险换内部少一个 `as`，不成比例。

## 后果

- `engine.state.$` / `engine.store.state.$` / `*.globalState.$` 三处从 `any` 收紧为 `AutoSparkMeta`；`$.viewport` 是六档联合而非 `string`，`$.version` 可选。
- `AutoSparkPresetVars` 的 `version` / `language` 从必选转可选——**若日后有真实写入方，改回必选是 breaking change**。
- `state.$` 必选是**已知的类型谎言**（决策 2），见决策 2 的 JSDoc；不要据此写无保护的 `.viewport` 直取于可能关闭 viewport 的场景。
- `AutoSparkMeta` 是空 interface 这一形态有实际用途：消费者声明合并接缝。**不要**改成 type alias，会切断合并能力。
- `CONTEXT.md` 不需要改动：「元状态容器 / `$`」「视口档位状态 / `$.viewport`」两词条描述的是领域语义，类型注解属实现细节。

## 修订记录（2026-10-16：类型更名）

声明合并接缝由 `AutoSparkVars` 更名为 **`AutoSparkMeta`**（`AutoSparkPresetVars` 不动）：本文正名「元状态容器（Meta State）」，接缝类型随之用 `Meta`——`Vars` 与引擎自有字段类型 `AutoSparkPresetVars` 同族易混，「哪些参与合并、哪些不参与」这条关键区分被名字掩盖。

- **无兼容别名**（开发期硬切，TS 消费者编译期可发现）：旧的 `declare module "autospark" { interface AutoSparkVars { … } }` 不再命中原接缝，须改为 `interface AutoSparkMeta`；
- 形态约束不变：仍是**空 interface** + `extends AutoSparkPresetVars`（合并能力之所在），不得改 type alias；
- 本文正文已按新名改写（无独立更名 ADR，本文即该类型的定义文档）。
