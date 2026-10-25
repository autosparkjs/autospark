# 常见问题

## 首访会闪一下默认主题，正常吗？

正常，且是**明确接受的取舍**：主题 CSS 由运行时注入，浏览器拿到白页 → 执行模块 → 注入样式，这中间必然有一次默认主题的展现（FOUC）。替代方案（构建期预生成静态主题层）成本高一个量级，且无法覆盖「用户自定义主题色」的恢复。

**回访**用户不会闪：样式快照 + head 内阻塞内联片段可在首帧前还原。见[持久化与回访零闪](../guide/persistence.md)。

## 怎样才能让回访真的零闪？

三个条件缺一不可：

1. 宿主在 `<head>` 里粘了**同步内联**的恢复片段（不能是外链、不能延迟到 `DOMContentLoaded`）；
2. 快照 key 与运行时一致（默认 `autospark-theme-styles`；自定义了 `storageKey` 就要同步改）；
3. 上一个会话说到底发生过一次注入（首次打开站点、且没有任何参数变化时，root 作用域在 `connect()` 时同样会写入快照）。

## `themeManager.update({ dark: true })` 为什么不生效？ {#update-colors-only}

`update()` 只接受**颜色相关**参数（`themeColor`、五个语义色、两个调色板形态参数）。暗色、多彩、四个尺寸都是**属性通道**：

```js
themeManager.dark = true; // ✅
themeManager.size = "small"; // ✅
themeManager.update({ dark: true }); // ❌ 被忽略
```

原因：模式与尺寸要同步写到元素属性（`dark` / `data-size` 等）并进入各自的持久化/注入路径，属性语义比「一次性传入的一组值」更强。

## 构造时传的 `dark` / `size` 为什么没有立即生效？

因为这两个维度是**属性通道**，而属性同步只发生在 setter 与水合路径：

```js
// ⚠️ 属性没写上去，暗色块选不中元素 → 首次看起来没生效
const scope = themeManager.addScope({ id: "s", elements: ["#s"], dark: true, size: "small" });

// ✅ 构造后显式赋值一次
scope.dark = true;
scope.size = "small";
```

构造选项里的参数仍会被**持久化**，所以下次加载时经水合会补齐属性（表现就是「刷新后才生效」）。颜色类参数（`themeColor` / 语义色）不受影响，可以直接写在构造选项里。详见[局部主题 · 构造选项里的模式 / 尺寸不会立即生效](../guide/local-scope.md#sync-pitfall)。

## 主题色改了，为什么读回来是 hex？

预设名在写入时就被**解析**了：

```js
themeManager.themeColor = "purple";
themeManager.themeColor; // "#722ed1"
```

持久化的也是解析后的值——这样回水合时不必再依赖预设表，预设改名也不会让老用户的主题失效。

## 局部作用域的元素没有生效，怎么排查？

按顺序检查：

1. **元素是否真的被作用域选中**：默认选择器是 `[data-theme-scope='{id}']`。用 `addScope({ id, elements: ["#preview"] })` 或 `autoAttach` 时属性会自动写入；如果你传了自定义 `cssSelector`，请确认元素确实命中该选择器。
2. **作用域是否已连接**：`scope.isConnected()` 会检查样式标签是否存在。构造时 `autoConnect: false` 的作用域需要手动 `scope.connect()`。
3. **变量是否被上游覆盖**：作用域内消费 `--auto-*` 的元素应当生效；若某处显式写死了颜色，变量自然管不到。
4. **是否在 shadow DOM 里**：此时 `docRoot` 必须指向 `shadowRoot`，选择器也要用 `:host` 系列，见下文。

## 如何在 WebComponent / shadow DOM 里使用？

作用域支持 `docRoot` 指向 `shadowRoot`，选择器用 `:host`：

```js
const scope = new ThemeScope({
    id: "wc",
    docRoot: this.shadowRoot, // 注入与查询都在影子根内进行
    cssSelector: [":host"],
    themeColor: "green",
});
```

注意：模块级单例 `themeManager` 的 root 作用域面向 `document.documentElement`；组件内主题请自行 `new ThemeScope(...)`（或经 `new ThemeManager()` 建独立管理器），避免把全局 root 的样式注入到组件里。

## 能彻底关闭持久化吗？

- **局部作用域**：`addScope({ id, persistence: false })` —— 照常注入渲染，只不读写 localStorage、不参与快照合成；
- **root 作用域**：目前 `ThemeManagerOptions` 只暴露 `storageKey`，没有关闭持久化的入参。若确实需要，可改 `storageKey` 让读写落到另一个命名空间，或在库外清空对应 key。

## 同源部署了多个应用，主题会串吗？

会共用同一套 key，除非自定义前缀：

```js
new ThemeManager({ storageKey: "myapp" }); // 读写 myapp-styles / myapp-scope-{id}
```

前缀是**发布后的公共接口**（宿主恢复片段硬编码默认值 `autospark-theme`），改名属破坏性变更。

## AutoSpark engine 应用里怎么用主题？

什么都不用做：`@autospark/theme` 是插件形态的库型插件（ADR-0007），engine 共存时自动接驳——

- `engine.themeManager` 就是那个全局单例（多 engine 共享同一实例）；
- 根状态多出 `state.$.theme` 七键投影（`dark` / `themeColor` / `size` / `spacing` / `shadow` / `radius` / `colorized`），模板表达式直写即换肤：`@click="theme.dark = !theme.dark"`。

注意**单向同步**：写 `state.$.theme.*` 会驱动 manager；但直接改 `themeManager`（或经 theme-controls 组件）**不会回写**投影——混用两条通道时以 manager 为准。详见[插件形态](./install.md#插件形态-与-engine-协同)。

## 为什么 `size` 没有 `none` 档？

字号没有「归零」语义——`size: "none"` 会让整个界面没有字号。所以：

| 参数 | 可选档位 |
| --- | --- |
| `size` | `x-small` / `small` / `medium` / `large` / `x-large` |
| `radius` / `spacing` / `shadow` | 上述五档 + `none` |

`none` 在圆角/间距/阴影上分别是「直角 / 零间距 / 无阴影」。

## `data-dark` 和 `dark` 属性有什么区别？

| 通道 | 写法 | 语义 |
| --- | --- | --- |
| JS setter 通道 | `themeManager.dark = true`（写作用域元素上的 `dark` 属性） | 作用域开关，随作用域整体切换并持久化 |
| 独立样式域 | 任意元素挂 `data-dark` | 元素级手动开关，只影响该元素及其后代 |

两者**并存**：`dark` 是「这套作用域现在是暗色」，`data-dark` 是「这个元素独立启用暗色」。同样地，`colorized` ↔ `data-colorized`、`data-uncolored`（无彩）、`data-light`（在暗语境里切回亮色）。

::: warning 组合属性要落在同一元素
`data-dark` + `data-colorized` 的叠加块要求两个属性在**同一元素**上；`html[dark]` + 后代 `[data-colorized]` 这种跨元素组合不命中叠加块。这是既有语义，降级手段是给该元素挂 `data-uncolored`。详见[多彩模式](../guide/color-colorized.md)。
:::

## 为什么暗色下主色比亮色"浅"了？

有意为之：暗色下主题梯度**方向反转**，且 `--auto-theme-color` 从 `theme-5` 提到 `theme-6`（`darkDerivedVars`）——深底上需要更浅的主色才够对比度。边框、禁用态、输入框背景同理都有一档暗色专属取值。见[明暗主题](../guide/color-dark.md)。

## 如何自定义语义色？

构造时传入，或运行时 `update()`：

```js
themeManager.addScope({ id: "s", primary: "#722ed1", danger: "#ff4d4f" });
themeManager.update({ success: "#00b96b" }); // 运行时改（只重注入语义色块）
```

传**品牌基准色**，不要传已调浅的颜色——它会被当作梯度种子展开成 10 阶标尺。`var()` 引用会被豁免梯度化（默认 `primary: var(--auto-theme-color)` 即此情形）。见[语义颜色](../guide/color-semantic.md)。

## 组件类（`.auto-btn` / `.auto-card` …）没样式？

按两点排查：

1. 是否引入了静态样式层 `@autospark/theme/index.css`；
2. 组件类（`card` / `button` / `alert` / `closeable` / `input`）**未**聚合进聚合入口链，需要单独引入对应 CSS 或 Less 文件。见[静态样式层与预设主题](../guide/static.md)。

## 怎么把当前主题导出成 CSS？

```js
themeManager.root.toStyles(); // 作用域全量 CSS（基础变量 → 主题标尺 → 语义色）
themeManager.root.download(); // 直接下载为文件——root 产物即合规静态主题包（带指纹，可作 <link> 静态层，ADR-0006）
```

作用域内的 `cssChunks` 是该作用域参与快照的 CSS 片段集合。见 [API 参考](../guide/api.md)。

## 有对比度检查工具吗？

有，且与实现同源：

```bash
cd packages/theme && bun scripts/check-dark-contrast.ts
```

26 项检查覆盖正文 / 次要文字 / 主色 / 语义色 / 交互态 / 边框 / 禁用态在亮暗与多彩矩阵下的对比度，任一 FAIL 退出码为 1，可直接挂 CI。见[语义颜色 · 对比度验收](../guide/color-semantic.md#contrast-check)。

## 没有 `document` 的环境（SSR / 单测）会报错吗？

不会：`injectStylesheet` 在无 DOM 时直接 no-op。`ThemeScope` 的 `docRoot` 默认取 `document?.documentElement`，SSR 下建议延迟到客户端构造，或用 `toStyles()` 于构建期取 CSS 字符串。

---

还有疑问？按[指南](../guide/initial.md)里的章节顺序逐个参数查阅，或直接读[工作原理](../guide/how-it-works.md)确认某个变量的来源与用途。
