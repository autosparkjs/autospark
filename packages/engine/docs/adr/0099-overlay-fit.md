# ADR-0099：覆盖物面板尺寸跟随宿主（x-popover `fit` 选项）

- 状态：已采纳（2026-10-10 共识落盘并实施）
- 日期：2026-10-10
- 关联：ADR-0060（x-popover 悬浮触发模型——本选项的首个消费面）、ADR-0052（覆盖物
  定位锚 at 配置——`fit` 与 `at` 的层级分界）、ADR-0061（tooltip 共享 floating 底座——
  `fitToEl` 落在共享层 `utils/floating.ts`）、ADR-0063（`onPositioned` 形态特化钩子
  先例——`fitToEl` 同通道注入）

## 背景

典型场景（工具栏折叠收纳、菜单按钮与弹出菜单等宽对齐）需要弹出面板的**一条轴与宿主
元素尺寸一致**：上下弹出时面板宽度 = 宿主宽度，左右弹出时面板高度 = 宿主高度。现有
覆盖物定位管线只管位置（floating-ui），面板尺寸完全由 shell 组件 CSS 自持，没有
「跟随宿主」通道。grilling 会话闭合全部决策面（一轮 7 问全数确认），本文记录定案。

## 决策

### 1. 顶层 `fit: boolean`（默认 false），不入 `at`

`fit` 是**面板尺寸策略**，与定位方向相关但独立于锚配置——`at` 的语义是「定位锚
配置」（ADR-0052 决策 21：selector/placement/offset/shift/flip/arrow 键名对齐
floating-ui），塞入 fit 破坏该边界。顶层键与 `mask` / `shell` / `resize` 同级，
走既有配置链（`内置默认 < x-popover-options`，deepMerge 整键合并）。

### 2. 尺寸基准 = 指令宿主（`this.el`），非定位锚

popover 支持换锚（`at.selector` 指向别元素），但 fit 跟随的恒为**宿主**——
「与宿主元素一致」是用户语义；且 ADR-0060 明确「换锚只改显示位置，不改变触发
关系」（触发器恒为宿主），尺寸跟随同一基准才自洽。实现上经 `OverlayInstance` 的
`searchRoot`（声明式恒 = 指令宿主）取基准元素。

### 3. 按**最终 placement** 主向选轴（跟随 flip 翻转与 autoPlacement）

- 左右系（`left` / `right` × 任意后缀）→ 面板 `height` = 宿主 `offsetHeight`；
- 上下系（`top` / `bottom` × 任意后缀）→ 面板 `width` = 宿主 `offsetWidth`。

否决「按原始配置方向」：用户看到的是翻转后的面板，尺寸必须匹配视觉方向。
autoPlacement（`placement: 'auto'`）选定的方向同理生效——判定取
`computePosition` 回调的**最终 placement**（split 主向），配置方向只是输入。

### 4. 每次定位重算（inline style + autoUpdate 持续生效）

fit 写 inline 尺寸（与定位逻辑的 inline `left`/`top` 同一通道，优先级天然高于
样式表），且每次 `computePosition` 完成后重写——autoUpdate（宿主滚动/resize/内容
变化）触发重定位时自动跟随宿主尺寸变化。非定时机（如宿主尺寸单独变化而无重定位）
不主动监听，YAGNI。

### 5. 约束面板外壳（shell 根），与 shell 机制正交

fit 作用于 floating-ui 的定位目标（`data-overlay` 标记的 shell 产物根）——任意
自定义 shell 照常生效；shell 内部布局如何消化被约束的宽高由组件 CSS 决定。与
`resize`（拖拽调节）、`size`（drawer 短轴）三键正交，互不干扰。

### 6. 实现通道：`fitToEl` 经 `AnchorPositionOptions` → `FloatingContract`

复用 ADR-0063 的形态特化钩子通道：`instance.ts` 内置两态在 `config.fit` 为真时
把 `searchRoot` 注入 `AnchorPositionOptions.fitToEl`，经 `applyAnchorPosition`
透传到共享层 `FloatingContract.fitToEl`，在 `applyFloatingPosition` 的
`computePosition().then()` 中（placement 写回之后、`onPositioned` 之前）按主向
写尺寸。共享层（overlay / tooltip 同底座）因此获得通用 fit 能力，tooltip 侧
当前不消费（无 fit 配置入口）。

> 实施修正：`fitToEl` 最初挂在 `FloatingPositionOptions`（opts 参数）——但
> `applyAnchorPosition` 传入的 opts 实为 `anchor`（`OverlayAnchorConfig`），字段
> 不可达，测试红。修正为挂 `FloatingContract`（消费方契约参数）：fit 是消费方
> 决定的面板策略，与 `flipDefault` / `onPositioned` 同属契约面，语义也更准。

## 未采纳

- **`at.fit`（锚配置成员）**：破坏 `at` = floating-ui 键名对齐的边界（决策 1）；
- **跟随锚点元素**：与用户语义（宿主）和 ADR-0060 触发关系（宿主恒触发器）均
  不自洽（决策 2）；
- **CSS 变量 / 类分派**：与既有定位 inline 通道不一致，且变量在 autoUpdate 重算
  路径需经 style 属性间接写，多一层间接（决策 4）；
- **fit 监听宿主 ResizeObserver**：宿主 resize 多数场景经滚动/布局变化连带触发
  autoUpdate 已覆盖，独立监听增加订阅管理成本，YAGNI（决策 4）。

## 验证

`src/__tests__/directives/x-popover.test.ts`：fit=true 上下弹出（宽度跟随）、
fit=true 左右弹出（高度跟随）、fit 缺省（不写尺寸），三用例经 stub
`offsetWidth/offsetHeight` 断言 inline 尺寸；全量 x-popover 21 pass。
