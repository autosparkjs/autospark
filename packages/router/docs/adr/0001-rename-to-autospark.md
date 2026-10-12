# ADR-0001：品牌更名为 AutoSparkRouter（Kylin → AutoSpark 词根统一）

- **状态**：Accepted
- **日期**：2026-10-12
- **关联**：[CONTEXT.md](../../CONTEXT.md)（「已废弃词条」节）、engine [ADR-0030](../../../engine/docs/adr/0030-rename-to-autospark.md)（同型先例：AutoTemplate → AutoSpark）

## 背景

本包原为 Kylin 品牌下的独立路由产品：类型冠 `Kylin*` 前缀（20+ 个）、自定义元素名 `kylin-*`（6 个）、CSS 类/动画名/style id 亦用 `kylin-` 词根。并入 AutoSpark monorepo 后 npm 包名已定 `@autospark/router`，代码标识符与运行时契约却仍停留旧名，双品牌并存。包版本 0.0.0 **从未发布、全仓零外部消费者**（engine 与 docs 均无引用），是零成本 breaking 窗口。

## 决策

统一词根机械替换，单条规则三种大小写形态全覆盖：`Kylin` → `AutoSpark`、`kylin` → `autospark`、`KYLIN` → `AUTOSPARK`。覆盖面：类/类型/接口、自定义元素名、CSS 类与动画名、style id、错误 `name` 字符串、日志前缀、测试断言、example HTML。**不留旧名兼容别名**（YAGNI——别名会让死词条在代码库继续还魂，engine ADR-0030 同裁决）。

曾评估「去前缀化」（`KylinRouteItem` → `RouteItem`）被否：router 类型在消费者侧易与 engine 类型撞名，且破坏「单条规则、机械可验证」的执行性。`types/index.ts` 中既有的**去前缀短名导出**（`AutoSparkRenderMode as RenderMode` / `AutoSparkRouteViewContext as RenderContext` / `AutoSparkRenderOptions as RenderOptions`）是有意的消费者友好 API，非旧名遗留，予以保留。

## 后果

- 运行时 DOM 契约整体更名（`autospark-outlet` 等 6 个自定义元素、`autospark-modal-*` 样式族），无迁移负担（无已发布消费者）。
- 顺带清除：`src/features/dataLoader copy.ts`（零引用遗留副本）、`index.ts` typo 导出名 `KylinRouterOptiopns`。
- `packages/theme` 的 `KylinBits*` 词根属独立品牌议题，不在本次范围（CONTEXT.md 已废弃节存目）。
- 本 ADR 为本包序列首号（`docs/adr/`），与 engine 的 ADR 序列相互独立、编号互不连续。
