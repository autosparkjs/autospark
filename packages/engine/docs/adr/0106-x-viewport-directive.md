# ADR-0106：x-viewport 视口档位显隐指令——`$.viewport` 的声明式糖

- 状态：已采纳（2026-10-12 两轮 grilling 共识落盘，实施随本 ADR 进行）
- 日期：2026-10-12
- 关联：ADR-0105（viewport 全局特性——`$.viewport` 状态真相源）、ADR-0016（x-show 可见性 /
  x-if 存在性正交拆分）、ADR-0007（修饰符并入指令选项）

## 背景

`$.viewport`（ADR-0105）落地后，按档显隐要写 `x-show="$.viewport === 'md'"` 或多档
`x-show="['xs','sm'].includes($.viewport)"`——高频且冗长。`x-viewport` 提供声明式糖：
`x-viewport="md"` 仅 md 档可见、`x-viewport="xs,sm"` 多档可见、`x-viewport.hide="md"`
除 md 外可见。

## 决策

### 1. 独立指令类而非编译期 desugar

两案权衡：desugar 成 x-show 表达式合成（`title → data-tooltip` 同法）胜在单 display
通道，但会**侵入改写用户已声明的 x-show 表达式**（声明面冲突）；独立指令声明面互不
触碰，display 归属冲突以「不同载体」消解（决策 3）。用户裁决独立指令。

### 2. 值语法

- 逗号分隔档名 + 空白容忍：`"md"` / `"xs, sm"`；
- `.hide` 修饰符反向（经 ADR-0007 并入指令选项，`getOption("hide")`）：列出档隐藏、
  其余可见——反向是显隐指令的对称半边（Bootstrap `hidden-*` 心智）；
- **空值**：warn + 指令整体忽略（意图不可判定，不猜恒隐/恒显）；
- **未知档名**：**静默跳过**（不 warn——用户裁决）；
- 全部无效：指令整体忽略（无动作、不装类）；
- 档名按 `VIEWPORT_TIERS` 固定枚举校验（自定义 breakpoints 只改阈值、不改枚举）；
- 无 `x-viewport-options`（值 + 修饰符足够，无配置项）；
- 范围语法 `md+`（md 及以上）不立项——`['md','lg','xl','xxl'].includes($.viewport)`
  可表达（ADR-0101 预留的未来出口，等真实高频需求）。

### 3. 显隐机制：切类 + `!important`，不碰 inline display

独立指令与 x-show 若都直写 `el.style.display`，同元素组合时后写覆盖先写（物理冲突，
声明面独立解决不了）。本指令隐藏 = 挂 **`autospark-viewport-hidden`** 类（全局样式
`display:none !important`，`static initialize` 幂等注入），可见 = 摘类——完全不碰
inline display（Bootstrap `d-none` 同法）。组合语义一句话：**档位隐藏恒胜**——x-show
的显隐 / 动画 / 用户 CSS 只在档位可见时有话语权。v1 无动画（切类不经 animate 编排；
要动画用 x-show 表达式形态）。

### 4. 数据源与失效语义

`binding.watch("$.viewport")` + 首值同步（x-show 同法：watch 返回初值立即动作）；域内
`x-data` 定义 `$` 键遮蔽全局读（保留键约定，ADR-0105）。**档位未知静默失效**：
`$.viewport` 为 `undefined` 或非法值（`options.viewport: false` / 无 matchMedia / 用户
违约写入）时判定函数短路——不做任何动作（既不加类也不摘类），正向/反向模式均恒可见，
**零告警**（用户裁决：配置错误不告警）。

### 5. 指令形态

Compile kind、singleton、priority 80（显隐家族对齐 x-show）、`presetDirectives` 注册
`viewport`。值解析为纯函数 `parseViewportTiers`（单测直击）。

## 后果

- 实施落盘物：`src/directives/x-viewport.ts` + `directives/index.ts` 注册 +
  `src/__tests__/directives/x-viewport.test.ts` + 指南五段骨架
  （`docs/zh/guide/directives/x-viewport.md`，过 check-doc-structure）+ demo +
  CONTEXT.md 词条 + 本 ADR + viewport.md 交叉链接；
- 测试通道沿 ADR-0105：可控 matchMedia 桩（宽度改值 + 手动触发监听）；
- 同元素组合规则唯一且文档化：档位隐藏恒胜（`!important`）。

## 修订记录

（暂无）
