# ADR-0119：x-version 版本显隐指令——版本匹配表达式与 `$.version` 元状态

- 状态：已采纳（2026-10-19 grilling 共识落盘，实施随本 ADR 进行）
- 日期：2026-10-19
- 关联：ADR-0106（x-viewport——类方案显隐与「隐藏恒胜 x-show」组合先例）、ADR-0016
  （x-show 可见性 / x-if 存在性正交）、ADR-0007（修饰符并入指令选项）、ADR-0105
  （`$.viewport` 元状态先例）

## 背景

应用版本门控要写 `x-show="$.version === '2'"`、多条件 `x-show="['1','2'].includes($.version)"`
——比较语义（`<=3`、`!=2`）与正则匹配无法在表达式里简洁书写。`x-version` 提供**版本匹配
表达式**的声明式糖：`x-version="2"` 仅版本 2 可见、`x-version="<=3,=1,2"` 任一子句命中
即可见。数据源是元状态容器的 `$.version`（`AutoSparkPresetMeta.version` 预留字段，此前
无写入方）。配套由 router 侧承接版本化内容 URL（router ADR-0014，**后于 engine
ADR-0120 废弃**——版本收敛为 engine 渲染侧纯元状态），本 ADR 只管指令面。

## 决策

### 1. 可见性机制：x-show 族、切类不碰 inline display

用户裁决走 **x-show 机制**（可见性）而非 x-if 存在性——不匹配仅不显示，子树恒编译，
`$.version` 快速切换即时显隐（版本切换预览场景）。实现不直写 inline display：与 x-show
同元素会互相覆盖（后写胜）。采用 x-viewport 同构类方案（ADR-0106 决策 3）：隐藏 = 挂
**`autospark-version-hidden`** 类（全局样式 `display:none !important`，`static initialize`
幂等注入），可见 = 摘类。组合语义：

- **x-show**：版本隐藏恒胜——x-show 的显隐 / 动画 / 用户 CSS 只在版本可见时有话语权；
- **x-viewport**：两个类独立生效，任一命中即隐藏；
- **x-if / x-for / x-switch**：正交可共存（本指令不占子树，无 ownsChildren 冲突）。

v1 无动画（要动画用 `x-show="..."` 表达式形态）。

### 2. 版本匹配表达式（DSL）

逗号分隔子句、**任一子句命中即可见（OR）**；v1 无 AND（组合需求嵌套元素表达）。

- **算子**：`= != < <= > >=`；**裸值 ≡ `=`**（`x-version="2"` 即 `=2`）；子句空白容忍；
- **相等**：trim 后字符串全等；不等但两侧均可解析为有限数值时数值相等兜底
  （容 `$.version` 被写成数字 `2`）；
- **有序比较**（`< <= > >=`）：两侧均可解析为有限数值 → 数值比较；两侧均为点分数字段
  （`2.1.3`）→ 逐段数值比较、短段补零（semver 风格）；其余不可比 → 该子句 false；
- **正则**：必须 `/pattern/flags` 斜杠定界（无定界符一律按字面值），对 `$.version`
  原始字符串 `test`；tokenizer 感知 `/.../` 区间——**正则内逗号不被分割**（`/1,2/` 合法）；
- **空值**：`x-version=""` / 缺值 → **静默忽略**、元素恒渲染（有意的「不门控」声明，
  不 warn）；
- **非法子句**（悬空运算符、未闭合正则、纯运算符）→ **warn 一次 + 指令整体忽略**
  （恒渲染）——手写短串 fail-fast，宽松跳过会吞掉 `"<3"` 误写 `<=3` 一类错误；
- 无 `x-version-options`（无 `.hide` 反向修饰符——`!=` 与正则已覆盖反向语义）。

### 3. 数据源与失效语义

`binding.watch("$.version")` + 首值同步（x-show / x-viewport 同法）响应式重算切类。
**`$.version` 为 undefined（版本未知）→ 静默短路、恒渲染零告警**——与 x-viewport 的
「失效恒可见」同向：版本未知时执行门控是语义错误（用户裁决，异于首轮推荐的恒不匹配）。
singleton、Compile kind、priority 80（显隐家族对齐）。值解析为纯函数（单测直击）。

### 4. 与版本清单解耦

指令**只认 `$.version`**，不感知 `versions` 清单（ADR-0120 修订：清单已归 engine 渲染
侧、仅用于构造期归一初值）——未配置 `versions` 的纯 engine 应用中 x-version 照常工作。
清单项是否「合法版本」不由 engine 校验（校验只发生在构造期归一，见 ADR-0120）。

### 5. `$.version` 写入入口

新增 `AutoSparkOptions.version?: string`（engine 自有类型面——`$.version` 是 engine
预置元状态，初值入口与 `options.viewport` 同级；`versions` 清单与 `getVersionUrl` 归
router 侧 augment，router ADR-0014——**ADR-0120 修订**：`versions` 收归 engine 自有
类型，`getVersionUrl` 与路由版本化整体废弃）：构造期同步写入 `state.$.version`
（消灭首渲染空版本），运行时直接赋值 `$.version` 是切换入口（router 侧接管重载语义；
**ADR-0120 修订**：无导航语义——纯响应式写入，显隐即时重算）。engine 自身不监听
清单、不做归一（**ADR-0120 修订**：`versions` 清单非空时构造期归一初值——预置命中
尊重 / 空缺回退末项默认版本 / 未命中 warn 回退末项）。

## 后果

- 实施落盘物：`src/directives/x-version.ts`（解析纯函数 + 指令类）+ `directives/index.ts`
  注册 + `src/__tests__/directives/x-version.test.ts`（表达式矩阵 / 失效语义 / 组合）+
  指南页 + CONTEXT.md 词条 + 本 ADR；
- 类型：`AutoSparkOptions.version` 落 engine 自有 options 类型（`$.version` 已在
  `AutoSparkPresetMeta` 预留，无状态类型增量）；
- 同元素组合规则唯一且文档化：版本隐藏恒胜 x-show（`!important`）、与 x-viewport 并列。

## 修订记录

（暂无）
