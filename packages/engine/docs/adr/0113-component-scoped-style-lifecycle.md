# ADR-0113：组件作用域样式生命周期（页面级常驻 + patch 更新）

- 状态：已采纳
- 日期：2026-10-14
- 关联：[ADR-0022](0022-x-component.md)（决策四-4 scoped CSS，本 ADR 修订其移除模型）、[ADR-0087](0087-component-global-style.md)（global 段生命周期，姿态对齐）、[ADR-0001](0001-directive-kind-system.md)（共享资源归属：dispose 不移除文档级共享资源）、[ADR-0083](0083-message-session-class-presets.md)（决策 7：def 级稳定 scoped id）

## 背景

评估「组件反复加载/卸载是否会在 head 插入多个 `<style>`」，四个事实（测试探针实测背书）：

1. **重复插入不存在**：注入统一走 `injectStylesheet` 按 id 查重（`autospark-cmp-style-{n}`，编号来自 `componentScopedId(defName)` def 级稳定分配），反复装卸恒为 1 个元素。此层幂等，无泄露。
2. **引用计数释放承诺空转**：ADR-0022 承诺「引用计数管理移除」，但 `injectComponentStyle` 的 +1 挂在 `compiler.instantiateComponent` / `instantiateDetachedComponent` 两条实例化路径，`releaseComponentStyle` 全仓仅 overlay `instance.destroy` 一处消费——`x-component` 宿主路径（主路径）**从不释放**。计数只增不减，永不归零，「归零移除」永不发生。
3. **`engine.destroy()` 残留**：destroy 只收 global 段（ADR-0087），scoped `<style data-cmp-def>` 与模块级 `styleRefCount` / `defScopedIds` 两张 Map 永不清空。
4. **覆盖声明幽灵旧样式**：`injectStylesheet` `default` 模式已存在不覆写内容——同名组件重声明（x-import 重取、模板重编译）后 head 中仍是旧 CSS。`globalStyle.ts` 注释声称「与 scoped 侧天然覆盖对齐」与代码矛盾。

## 决策

### 一、scoped 样式页面级常驻，删除引用计数

- `styleRefCount` Map 与 `releaseComponentStyle` **删除**；`injectComponentStyle` 退化为纯幂等注入（返回既有元素）；
- scoped `<style>` 生命周期 = **页面**而非 engine：不随实例卸载移除，不随 `engine.destroy()` 移除；
- 修订 ADR-0022 决策四-4「引用计数管理移除」表述。

理由：移除的收益只有每组件 1 个有界 `<style>` 元素，代价是三条注入路径的计数对称维护（现状即不对称）+ x-if 高频开关的样式表摘插抖动。多 engine 共页同名组件**共享同一元素**（模块级 `componentScopedId` 按 defName 寻址），单方无法判定最后使用者——与 ADR-0001/0087 同款两难，取同一答案：不移除。

### 二、`engine.destroy()` 不清理 scoped 段

对齐 ADR-0087（destroy 只收 global 段）。残留按 defName 有界、幂等、无语义危害（内容经决策三恒为最新声明）。SPA 反复重建引擎时 head 保留各组件最后一份样式。

### 三、`injectStylesheet` 增 `patch` 模式，覆盖声明按需更新

`mode: "patch"`——内容与既有不同才覆写 `textContent`，等值零开销（不触发浏览器重解析）。`injectComponentStyle` 改用 `patch`：高频挂载（内容不变）零写入，覆盖声明真正变化时写一次。修掉背景事实 4。

## 否决项

- **补对称释放**（`ComponentDirective.destroy` 补 -1）：兑现承诺但引入摘插抖动 + 三路径对称维护，且与 ADR-0001「共享资源不移除」立场冲突；
- **账本按 engine 拆段**（照 `globalStyle` 三级账本）：scoped 样式是改写后整段替换语义，按 engine 拆段要重写改写管线，复杂度不抵「最后一位使用者离场的洁癖」；
- **保留 no-op 计数函数**：给未来读者埋「这里曾有计数」的困惑（全仓 grep 确认消费方仅 overlay 与测试）；
- **无条件 `replace`**：每次实例化都覆写 → 高频挂载每次重解析，纯浪费。

## 测试

- 反复装卸 5 轮 `style[data-cmp-def]` 恒 1（防未来删 id 查重）；
- 重注入复用同一元素 + 常驻契约；
- 覆盖声明内容更新（单元级 + x-define 集成级）；
- `engine.destroy` 后 scoped 样式仍在（契约断言，原「残留」探针语义反转）；
- `injectStylesheet` patch 模式单测（`inject-stylesheet.test.ts`）。
