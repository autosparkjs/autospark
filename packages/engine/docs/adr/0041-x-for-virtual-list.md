# x-for 虚拟列表（Virtual Scrolling）

为 x-for 添加 `.virtual` 修饰符，启用虚拟列表模式：只渲染可见项 + 缓冲区，回收池复用离开视口的 DOM 节点，解决大数据集（10000+ 项）的性能瓶颈。

## 背景

x-for 的默认模式是全量渲染：10000 项即创建 10000 组 DOM 节点和 scope/订阅。当列表数据量大时，首次渲染慢、滚动卡顿、内存占用高。虚拟列表通过「只渲染可见项」解决此问题，是业界标准方案（react-window、vue-virtual-scroller 等）。

## 决策

### 1. API 形态：修饰符扩展

`x-for.virtual="item of items"` — 在现有 x-for 上添加 `.virtual` 修饰符启用虚拟模式。

理由：
- 语义延续：虚拟列表仍是「列表渲染」，只是渲染策略不同
- 与 `.keepalive`/`.compile` 等修饰符模式一致
- 向后兼容：不声明 `.virtual` 时行为不变

### 2. 行高模式：固定行高（可选配置）

`itemHeight` 通过指令选项声明：`x-for-options="{itemHeight:40}"`。

**自动检测**：未指定 `itemHeight` 时，首次渲染取第一项的实际高度作为基准。

理由：
- 固定行高是 O(1) 计算可见范围的基础
- 自动检测提高易用性，用户无需手动测量
- 文档明确要求用户通过 CSS 保证项等高

### 3. 滚动容器：宿主元素 + 动态高度

x-for 宿主元素作为滚动容器，**不限制高度**（支持固定高度和自适应高度）。

通过 ResizeObserver 监听容器尺寸变化，重新计算可见项。

理由：
- 用户显式声明 `style="height:400px;overflow:auto"` 或由内容撑开
- 无歧义：不需要猜测哪个祖先该滚动
- 动态高度支持响应式布局

### 4. 可见范围计算：像素偏移量

`firstVisibleIndex = Math.floor(scrollTop / itemHeight)`

`visibleCount = Math.ceil(viewportHeight / itemHeight)`

理由：
- O(1) 计算，性能最优
- 配合固定行高，计算简单可靠

### 5. 缓冲区（overscan）：固定项数

默认 `overscan: 5`（可见区域外上下各多渲染 5 项），通过 `x-for-options="{overscan:10}"` 配置。

理由：
- 与固定行高配合，计算简单
- 用户心智模型清晰（"多渲染 5 项"比"多渲染 200px"更直觉）
- 默认值 5 是业界惯例

### 6. 回收池：自适应大小

池大小 = `visibleCount × 2`，无需用户配置。

理由：
- 与视口大小挂钩：视口能显示 20 项，池保留 40 项足够应对快速滚动
- 自动适配不同屏幕尺寸

### 7. 滚动事件处理：passive + rAF

`scroll` 事件使用 `passive: true`，用 `requestAnimationFrame` 限制每帧最多重算一次。

理由：
- 被动监听不阻塞滚动（浏览器优化）
- rAF 自动适配屏幕刷新率
- 业界标准做法

### 8. 与 x-show / x-if 交互：联动暂停

x-show=false 或 x-if=false 时暂停虚拟列表的滚动监听，恢复可见时重新计算。

理由：
- 容器不可见时继续监听滚动/resize 是浪费 CPU
- 恢复可见时需要重算（数据可能已变化）

### 9. 滚动位置绑定：data-index

通过 `:data-index` 绑定状态变量，实现声明式滚动位置控制：

```html
<div x-for.virtual="item of items" :data-index="currentIndex">
  <li x-text="item.name"></li>
</div>
```

- **读**：滚动时 `currentIndex` 自动更新为第一个可见项索引
- **写**：设置 `currentIndex` 自动滚动到对应索引
- **属性反射**：`data-index` 属性始终反映当前索引（即使未绑定状态），便于调试
- **更新频率**：与可见项计算同步，rAF 节流（每帧最多一次）

废弃 `scope.scrollTo(index)`：`scope` 是引擎内部概念，开发者通常不直接感知；`data-index` 绑定提供声明式替代方案，更符合 AutoSpark 响应式哲学。

理由：
- 声明式绑定与 AutoSpark 响应式体系一致
- 减少 API 表面积，降低学习成本
- `data-index` 属性始终可读，便于调试

### 10. 现有特性交互

- **x-empty**：生效（空状态独立于虚拟列表）
- **复合项模板**：支持（回收池按「一组节点」为单位复用）
- **:key**：必须提供（回收池复用依赖 key），无 :key 时 warn + 退化为 index

### 11. 滚动位置：数据变化时保持

列表数据变化（增删项、重新排序）后，scrollTop 不变，重新计算可见项。

理由：
- 最简单：数据变化时只重算可见范围
- 用户体验可预测：不会意外跳位

### 12. 高度一致性：严格模式

假设所有项等高，不运行时检测。文档要求用户通过 CSS 保证项等高。

理由：
- MVP 阶段保持简单
- 过度检测增加复杂度，且「warn 了用户也未必改」

### 13. 默认滚动条样式

为虚拟列表容器注入轻量级滚动条样式：

```css
/* 虚拟列表容器默认滚动条样式 */
[autospark-virtual] {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}
[autospark-virtual]::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
[autospark-virtual]::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}
[autospark-virtual]::-webkit-scrollbar-track {
  background: transparent;
}
```

- **注入时机**：`ForDirective.initialize(engine)` 时注入一次（类级，与动画样式注入同构）
- **属性标记**：虚拟列表容器自动添加 `autospark-virtual` 属性，用于样式选择器
- **用户覆盖**：用户可通过 CSS 覆盖默认样式（选择器优先级相同，后声明胜出）
- **跨浏览器**：Firefox 用 `scrollbar-width`/`scrollbar-color`，Chrome/Safari 用 `::-webkit-scrollbar` 伪元素

理由：
- 默认细滚动条（thin）视觉干扰小，符合现代 UI 趋势
- 透明轨道 + 半透明滑块，与多数设计系统兼容
- 用户可通过 CSS 轻松覆盖，不强制风格

### 14. 性能验收指标

10000 项列表，滚动时 FPS ≥ 55（不掉帧）。

### 15. 错误处理：itemHeight 边界

`itemHeight` 为 0、负数或非数字时：`logger.warn` + **退化为全量渲染**（禁用虚拟列表，回退为普通 x-for）。

理由：
- 降级而非崩溃，用户体验更好
- 虚拟列表是性能优化，退化为全量渲染功能不受影响
- warn 提醒用户修复配置

### 16. 边界数据场景

- **空列表**（items 为空数组）：退化，不启用回收池（无项可回收），x-empty 生效
- **单项**：退化，不启用回收池（无滚动）
- **项高度超出视口**：仍按固定行高计算，项可能被裁切（用户通过 CSS 处理）

### 17. 无障碍访问（a11y）

MVP 阶段不处理。虚拟列表移除 DOM 的项对屏幕阅读器不可见，后续版本可添加：
- `aria-rowcount`/`aria-rowindex` 属性
- `aria-activedescendant` 指向当前聚焦项

理由：
- 无障碍增强需要深入的 a11y 专业知识
- 业界方案（react-window、vue-virtual-scroller）也是后续版本添加 a11y
- 可作为独立 ADR 设计

### 18. 浏览器兼容性

支持现代浏览器：Chrome 80+、Firefox 80+、Safari 14+、Edge 80+。

- ResizeObserver 在现代浏览器广泛支持，无需 polyfill
- IE11 已停止支持（2022 年 6 月），不提供 polyfill
- scrollbar 样式：Firefox 用 `scrollbar-width`/`scrollbar-color`，Chrome/Safari 用 `::-webkit-scrollbar`

### 19. 测试策略

单元测试覆盖计算逻辑（可见范围、overscan）+ 集成测试覆盖端到端滚动行为。

### 20. 文档位置

在现有 x-for 文档中新增「虚拟列表」章节，并在 `docs/demos/` 下添加可运行示例。

理由：
- 虚拟列表是 x-for 的修饰符，不是独立功能
- 用户学习 x-for 时自然看到虚拟列表选项
- 示例优先，降低学习曲线

## Considered Options

- **独立指令 `x-virtual-list`**：替代 x-for。拒绝理由：语义割裂，虚拟列表仍是列表渲染，不应分裂为两个指令。
- **动态行高**：每项高度可不同。拒绝理由：实现复杂度显著更高（需要 IntersectionObserver 或运行时测量），可作为后续 ADR。
- **无限滚动 / 实时数据流**：MVP 聚焦静态大数据集，这些场景留作后续扩展。
- **编程式 API 丰富版**：`scrollTo(index, { behavior, align })`。拒绝理由：过度设计，简单版覆盖 90% 场景。

## Consequences

- 用户需保证项等高（CSS 约束），否则滚动位置计算会偏移
- `.virtual` 与 `.keepalive` 等修饰符可组合，但与动态行高方案不兼容（后续 ADR 独立设计）
- `data-index` 属性由虚拟列表引擎管理，用户不应在同元素上使用其他 `data-index` 绑定
- 需要 ResizeObserver 和 scroll 事件监听，浏览器兼容性需确认（IE11 不支持 ResizeObserver，需 polyfill 或降级）
