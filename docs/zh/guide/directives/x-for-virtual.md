# 虚拟列表

当列表数据量较大（如上万条）时，全量渲染会导致性能问题。`x-for.virtual` 通过**虚拟列表**技术解决这一问题：只渲染当前可见区域的项，滚动时动态替换内容，大幅提升渲染性能。

## 快速入门

<demo html="for/virtual-basic.html"/>

```html
<div class="list-container"
     x-for.virtual="item of items"
     :key="item.id"
     x-for-options="{itemHeight:50}">
  <div class="list-item">
    <span x-text="item.name"></span>
  </div>
</div>
```

**关键配置**：
- `.virtual` 修饰符：启用虚拟列表模式
- `itemHeight`：每项的固定高度（像素），必须指定或可自动检测
- 容器必须设置 `height` + `overflow: auto` 才能生效

## 工作原理

虚拟列表的核心思想是**空间换时间**：

1. **容器作为视口**：设置固定高度和 `overflow: auto`
2. **双垫片撑高度**：容器首尾各插入一个 invisible 垫片元素——顶部垫片高度 = 起始项索引 × itemHeight，底部垫片高度 = 剩余未渲染项 × itemHeight，二者之和保证正确的滚动条总高度
3. **计算可见区域**：根据 `scrollTop` 和 `itemHeight` 确定当前可见的项范围
4. **预留缓冲区**：通过 `overscan` 配置在可见区域外多渲染几项，减少滚动白屏
5. **动态替换**：滚动时销毁不可见的项，创建新进入可见区域的项

## itemHeight

`itemHeight` 指定列表项的固定高度（像素）。有两种配置方式：

**方式一：通过 x-for-options 显式指定**

```html
<div x-for.virtual="item of items" x-for-options="{itemHeight:50}">
  <!-- 每项高度固定 50px -->
</div>
```

**方式二：自动检测（首项高度）**

如果不指定 `itemHeight`，引擎会尝试从第一项的高度自动检测。但这种方式有以下限制：
- 必须有至少一项数据
- 首项高度必须与其他项一致
- 如果检测失败，会退化为全量渲染

<demo html="for/virtual-basic.html"/>

```html
<!-- 自动检测：第一项渲染后测量其高度 -->
<div x-for.virtual="item of items" :key="item.id">
  <div class="list-item" x-text="item.name"></div>
</div>
```

::: warning itemHeight 无效时的退化行为
如果 `itemHeight` 值无效（如 0、负数、非数字），会输出警告并退化为**全量渲染**。这是为了保证功能可用性，但性能会受影响。
:::

## 滚动位置绑定

通过 `:data-index` 可以实现滚动位置与状态的**双向绑定**：

- **读方向**：滚动列表时，`data-index` 会自动更新绑定的状态值
- **写方向**：改变状态值时，列表会自动滚动到对应项

<demo html="for/virtual-scroll-index.html"/>

```html
<div id="app">
  <input type="number" x-model="targetIndex">
  <button @click="scrollTo(targetIndex)">跳转</button>
  <span>当前索引：<strong x-text="currentIndex"></strong></span>

  <div class="list-container"
       x-for.virtual="item of items"
       :key="item.id"
       :data-index="currentIndex"
       x-for-options="{itemHeight:50}">
    <div class="list-item" x-text="item.name"></div>
  </div>
</div>
```

```javascript
// 状态定义 + actions
const engine = new AutoSpark(engineEl, {
  items: [...],
  currentIndex: 0,
  targetIndex: 0
}, {
  actions: {
    // 跳转到指定索引
    scrollTo(index) {
      engine.state.currentIndex = Number(index) || 0;
    }
  }
});
```

## 动态容器高度

当容器高度动态变化时（如响应式布局），虚拟列表会通过 `ResizeObserver` 自动监听尺寸变化并重新计算可见区域。

<demo html="for/virtual-dynamic-height.html"/>

```html
<div class="list-container"
     x-for.virtual="item of items"
     :key="item.id"
     x-for-options="{itemHeight:60}"
     :style="'height:' + containerHeight + 'px'">
  <div class="list-item">
    <div x-text="item.title"></div>
    <div x-text="item.desc"></div>
  </div>
</div>
```

```javascript
// 容器高度变化时，虚拟列表会自动重新计算
store.state.containerHeight = 400;
```

## Overscan 配置

`overscan` 控制在可见区域外额外渲染的项数。值越大，滚动时越流畅（减少白屏），但初始渲染和内存占用会增加。

<demo html="for/virtual-overscan.html"/>

```html
<div x-for.virtual="item of items"
     :key="item.id"
     x-for-options="{itemHeight:50,overscan:5}">
  <!-- 可见区域外上下各多渲染 5 项 -->
</div>
```

| overscan 值 | 适用场景 | 权衡 |
|-------------|----------|------|
| 0 | 数据量小、滚动不频繁 | 最小内存占用，快速滚动时可能白屏 |
| 2-5（默认） | 大多数场景 | 平衡性能与流畅度 |
| 10+ | 快速滚动、低端设备 | 更流畅，但内存占用增加 |

## 空列表状态

虚拟列表完全兼容 `x-empty` 空状态指令。当列表为空时显示空状态，有数据时显示列表项。

<demo html="for/virtual-empty.html"/>

```html
<div x-for.virtual="item of items"
     :key="item.id"
     x-for-options="{itemHeight:50}">
  <div class="list-item" x-text="item.name"></div>
  <div x-empty class="empty-state">暂无数据</div>
</div>
```

## 滚动条样式

虚拟列表默认注入细滚动条样式（宽度 6px，半透明灰色，悬停时加深），提升视觉体验。样式会在 `ForDirective` 初始化时自动注入，且只注入一次。

如果你需要自定义滚动条样式，可以通过 CSS 覆盖：

```css
/* 覆盖默认滚动条样式 */
.autospark-virtual-list::-webkit-scrollbar {
  width: 8px;
}
.autospark-virtual-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}
```

## 注意事项

- **容器必须设置高度**：`height` + `overflow: auto` 是必需的，否则虚拟列表无法计算可见区域
- **itemHeight 应固定**：虚拟列表假设所有项高度相同。如果项高度不固定，可能导致滚动位置计算错误
- **与 x-if 组合**：虚拟列表可以与 `x-if` 组合使用，但 `x-if` 必须在项模板内部
- **与动画兼容**：虚拟列表可以与进出场动画（`animate`）配合使用
- **销毁清理**：引擎销毁时会自动清理虚拟列表的事件监听、回收池等资源

::: tip 何时使用虚拟列表
- 列表数据量 **> 1000 项**
- 需要 **流畅滚动** 体验
- 对 **内存占用** 敏感
- 不确定时，可以先用全量渲染，遇到性能问题再启用
:::

## 配置

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `itemHeight` | 自动检测 | ✅ `.virtual` | 列表项固定高度（像素），虚拟列表专用 |
| `overscan` | `5` | ✅ `.virtual` | 可见区域外额外渲染的项数 |
| `:data-index` | - | ✅ `.virtual` | 滚动位置绑定的状态路径（双向绑定） |
