# 局部主题

## 概述

**主题作用域（`ThemeScope`）** 是一套完整主题参数的载体，也是「主题作用到哪些元素」的边界定义。
`ThemeManager` 里的 root 作用域覆盖整篇文档，`addScope()` 创建的作用域覆盖指定子树；
两者的参数、注入与持久化链路完全同构。

```js
const scope = themeManager.addScope({
    id: "preview", // 必填：作用域标识
    elements: ["#preview"], // 自动给命中的元素挂 data-theme-scope="preview"
    themeColor: "magenta",
});
scope.dark = true; // 模式 / 尺寸经 setter 立即写属性
scope.radius = "small";
```

<demo html="theme/local-scope-overview.html"/>

## 指南

### 创建与销毁

```js
const scope = themeManager.addScope({ id: "preview", elements: ["#preview"] });

themeManager.hasScope("preview"); // true
themeManager.removeScope("preview"); // 断开 + 删参数 key + 从快照摘除片段
```

`addScope` 做的事，按顺序：

1. 同 `id` 已存在 → 直接返回 `undefined`（不覆盖）；
2. `new ThemeScope({ storageKey: manager 的 storageKey, ...options })`；
3. 注入协调器（`coordinator`），使该作用域的 CSS 参与全局样式快照；
4. 若构造期已连接（`autoConnect: true`，默认），立即补写一次快照。

<demo html="theme/local-scope-create-destroy.html"/>

### 作用域选项 {#scope-options}

```typescript
type ThemeOptions = {
    id: string; // 作用域标识（不传则随机生成）
    cssSelector?: string[]; // 样式选择器；缺省 [data-theme-scope='{id}']
    elements?: string[]; // 自动 attach 的选择器列表
    autoConnect?: boolean; // 构造时立即注入样式，默认 true
    autoAttach?: boolean; // 构造时自动查找 [data-theme-scope='{id}']，默认 true
    docRoot?: HTMLElement; // 文档根，默认 document.documentElement（影子根请显式传）
    themeColor?: string; // 主题色，默认 "blue"
    dark?: boolean; // 暗色，默认 false
    colorized?: boolean; // 多彩，默认 false
    size?: ThemeSize; // 默认 "medium"
    radius?: ThemeSize; // 默认 "medium"
    spacing?: ThemeSize; // 默认 "medium"
    shadow?: ThemeSize; // 默认 "medium"
    border?: string; // 预留项，当前运行时未消费
    primary?: string; // 语义色，默认 var(--auto-theme-color)
    success?: string; // 默认 #22c55e
    warning?: string; // 默认 #f59e0b
    danger?: string; // 默认 #ef4444
    info?: string; // 默认 #71717a
    seedLightnessGap?: number; // 调色板形态参数，默认 1.7
    chromaBoostCap?: number; // 调色板形态参数，默认 1.25
    persistence?: boolean; // 是否参与持久化，默认 true
    storageKey?: string; // 持久化前缀（由 manager 统一下发）
};
```

### 构造选项里的模式 / 尺寸不会立即生效 {#sync-pitfall}

`themeColor`、语义色、调色板参数可以直接写在 `addScope` 的选项里；但 `dark` / `colorized` /
`size` / `radius` / `spacing` / `shadow` **只在水合路径与 setter 里同步到元素属性**——
写在构造选项里要等下一次水合（刷新）才看到效果。

同一份参数仍会被写入持久化，所以下次加载时经水合路径（`_syncPersistedAttrs`）会补齐属性并生效——
表现就是「第一次打开只记住，刷新后才看到」。给元素**手写** `data-dark` / `data-size` 等属性可完全绕开这一路径。

需要立即生效时，构造后显式赋值一次：

```js
const scope = themeManager.addScope({ id: "preview", elements: ["#preview"], dark: true });
scope.dark = true; // 立即把 dark 属性写到 #preview 上
```

::: warning `border` 当前是预留项
`ThemeOptions.border` 有类型定义（注释写「默认 1px」），但运行时并未读取它——
边框宽度实际来自派生变量 `--auto-border-size: 1px`。要改边框宽度请覆盖该变量。
:::

<demo html="theme/local-scope-setter.html"/>

### 选择器与附着：三件事别混

| 概念 | 作用 | 谁来做 |
| --- | --- | --- |
| **选择器**（`cssSelector`） | 决定生成的 CSS 命中哪些元素 | 缺省 `[data-theme-scope='{id}']` |
| **附着**（`attach`） | 把 `data-theme-scope="{id}"` 写到元素上 | `elements` / `autoAttach` / 手动调用 |
| **连接**（`connect`） | 生成并注入样式 | `autoConnect`（默认）或手动调用 |

```js
const scope = new ThemeScope({
    id: "manual",
    cssSelector: [".my-theme"], // 自己写选择器
    autoConnect: false,
    autoAttach: false,
});
scope.attach(".my-theme"); // 挂 data-theme-scope（并记录元素，供 setter 同步属性）
scope.connect(); // 注入样式
```

要点：

- `attach(el | selector)`：元素不是 `document.documentElement` 时会写 `data-theme-scope`；
- 作用域会记住被附着的元素（弱引用），各 setter 通过它们同步 DOM 属性（如 `dark` / `data-size`）；
- `detach(selector)` 移除属性与记录；
- 遍历时会顺带清理已失效的弱引用。

### 局部主题的语义

作用域生成的 CSS 选择器形如：

```css
/* 根域：直接命中文档根 */
:host,
:root [dark],
[data-dark] { … }

/* 局部作用域：收敛到「作用域自身 + 其后代」 */
[data-theme-scope='preview'],
[data-theme-scope='preview'][data-light],
[data-theme-scope='preview'] [data-light] { … }
```

**为什么局部域要收敛？** 自定义属性继承的是**解析后的值**：如果 `data-dark` 用裸属性全局命中，
局部作用域里的元素可能错拿别的作用域的字面量梯度。因此 root 作用域裸属性追加、局部作用域收敛为「自身 + 后代」两式。
细节见[元素域 · 作用域内的收敛](./element-scope.md#作用域内的收敛)。

### 作用域内的元素域微调

```html
<div data-theme-scope="editor">
    这块区域独立主题；<span data-colorized>这里还能单独多彩</span>
</div>
```

作用域内消费 `--auto-*` 的组件全部跟随；`data-colorized` 因为是「自身式」命中，作用域约束下同样生效，
且多彩映射取的是**本作用域**的梯度（不会错拿根域的值）。**跨作用域的裸命中不会生效**，这是刻意设计。

<demo html="theme/local-scope-element-tweak.html"/>

### WebComponent / shadow DOM

```js
const scope = new ThemeScope({
    id: "wc",
    docRoot: this.shadowRoot, // 注入与查询都在影子根内进行
    cssSelector: [":host"], // 影子根内用 :host
    themeColor: "green",
});
```

`docRoot` 同时决定注入位置与查询范围；`isConnected()` 也在 `docRoot.ownerDocument` 中查找样式标签。
文档站的 `<theme-controls>` 控制面板就是这类用法：样式经 Shadow DOM 自包含，配色从宿主继承 `--auto-*`。

<demo html="theme/local-scope-webcomponent.html"/>

### 作用域与持久化

每个作用域的参数**独立持久化**（`{storageKey}-scope-{id}`），水合发生在 `connect()` 的最开始——先水合、再注入，
注入值即恢复值，避免「恢复 → 默认 → 恢复」的二次闪烁。

```js
// 局部作用域可以单独退出持久化（照常渲染，只是不落盘）
themeManager.addScope({ id: "scratch", persistence: false });
```

`removeScope(id)` 会同步清理该作用域的参数 key，并把它的 CSS 片段从样式快照中摘掉。
详见[持久化](./persistence.md)。

---

下一步：[持久化](./persistence.md)。
