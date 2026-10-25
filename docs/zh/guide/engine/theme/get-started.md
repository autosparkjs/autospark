# 快速入门

本页带你从零搭起一个「可换肤的界面」——分几步走，每步引入一两个能力，最后拼成一个带全局主题、局部主题与回访恢复的完整页面。

> 不熟悉「主题色」「语义色」「作用域」这些词？先花两分钟读一遍[名词解释](./glossary.md)。

<demo html="theme/get-started.html"/>

上面的 demo 就是这条动线的完整落地：卡片 1–5 覆盖第 1–7 步的纯库能力（引入即生效、主题色、暗色多彩、尺寸、局部作用域），卡片 6 额外演示 engine 共存时的插件协同（`state.$.theme` 七键投影单向同步，对应[插件形态](./install.md#插件形态-与-engine-协同)）。

最终效果大致是这样：

```html
<div class="toolbar">
    <button class="auto-btn primary" @click="toggleDark">暗色</button>
    <button class="auto-btn" @click="nextColor">换主题色</button>
</div>

<div class="auto-card">
    <div class="auto-card-header"><span class="auto-card-title">全局主题</span></div>
    <div class="auto-card-body">
        <input class="auto-input" placeholder="随主题变化…" />
        <p>这段文字、边框、背景都消费 <code>--auto-*</code> 变量。</p>
    </div>
</div>

<div id="preview" class="auto-card">
    <div class="auto-card-body">局部主题区域（自己的主题色与暗色）</div>
</div>
```

## 第 1 步：引入样式与运行时

**主题化 AutoSpark 应用**的基本引入是三件套（`autospark.theme.js` 是一个**插件**，与引擎 script 直引搭配即自动接驳）：

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
<script src="/path/to/@autospark/theme/dist/autospark.theme.js"></script>
<script src="/path/to/autospark.js"></script>
```

- **静态样式层**（CSS）：reset / 工具类 / 组件类；
- **主题插件**（`autospark.theme.js`）：立即执行外壳，脚本加载即创建单例并挂 `globalThis.AutoSparkThemeManager`——**引入即生效**，不需要手动 `new`；
- **引擎**（`autospark.js`）：构造期经预加载队列接驳主题插件——`engine.themeManager` 即单例引用，根状态多出 `state.$.theme` 七键投影（`theme.dark` 等模板表达式直接驱动主题）。

不装引擎时，主题库以纯库身份工作（ESM 形态）：

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
<script type="module">
    import { themeManager } from "@autospark/theme";
</script>
```

两种形态的操作面完全一致（`themeManager` 单例 + CSS 变量 + 组件类），后续步骤通用。加载顺序细节见[安装 · 插件形态](./install.md#插件形态-与-engine-协同)。

## 第 2 步：换主题色

主题色是整套变量的种子。给预设名或任意 CSS 颜色即可：

```js
themeManager.themeColor = "purple"; // 预设名（themeManager.presets 可查全表）
themeManager.themeColor = "#13c2c2"; // 任意色值
themeManager.themeColor = "light"; // 关闭主题色通道（不注入标尺）
```

改完之后，页面里所有消费 `--auto-theme-color` / `--auto-primary-color` / 背景层次 / 边框的组件立刻跟随——

```html
<button class="auto-btn primary">主操作按钮</button>
```

::: warning 读回的是解析后的值
`themeManager.themeColor = "purple"` 之后，再读 `themeManager.themeColor` 得到的是**解析后的 hex**（`#722ed1`），不是 `"purple"`。持久化写入的也是这个值。
:::

## 第 3 步：暗色与多彩

两个维度各自独立、可叠加：

```js
themeManager.dark = true; // 暗色
themeManager.colorized = true; // 多彩
```

- **暗色**：明度标尺互换、主题梯度反转、语义色提亮、阴影换黑色系、输入框下沉；
- **多彩**：灰阶幕布换主题色浸染的色阶；
- **叠加**：两者同时开启即「暗多彩」，映射由暗色模式块声明，无需额外配置。

两个开关都是**属性**（走 DOM 属性 + 持久化），写 `themeManager.update({ dark: true })` 是无效的——`update()` 只处理颜色。

还可以**局部**启用：任意元素裸挂 `data-*` 属性即可，不需要作用域：

```html
<div data-dark>这块是暗色（页面其余部分照旧）</div>
<div data-colorized data-uncolored>多彩语境下退灰</div>
```

详见[明暗主题](../guide/color-dark.md)与[多彩模式](../guide/color-colorized.md)。

## 第 4 步：调节尺寸

四个正交维度，各六档：

```js
themeManager.size = "small"; // 字号 / 行高 / 控件高度整体收紧
themeManager.radius = "large"; // 圆角
themeManager.spacing = "small"; // 内外间距
themeManager.shadow = "none"; // 阴影
```

`medium` 是默认态（等价于不写属性）；`size` 没有 `none` 档（字号没有「归零」语义）。

局部覆盖同样用属性：

```html
<div data-size="x-large" data-radius="none">这块字大、无圆角</div>
```

详见[字体](../guide/font.md)、[圆角](../guide/radius.md)、[阴影](../guide/shadow.md)与[间距](../guide/spacing.md)。

## 第 5 步：局部作用域

想让「预览区」拥有自己的主题色、自己的暗色，用 `addScope`：

```js
const preview = themeManager.addScope({
    id: "preview",
    elements: ["#preview"], // 自动给这些元素挂 data-theme-scope="preview"
});

// 主题参数用 setter 赋值（只影响本子树）
preview.themeColor = "magenta";
preview.dark = true;
preview.radius = "small";
```

::: warning 构造参数 vs setter
`themeColor` 可以直接写在 `addScope` 的选项里；但 `dark` / `colorized` / 四个尺寸**必须经 setter 赋值**才会立即写元素属性并生效——写在构造选项里需要等下一次水合（刷新）才看到效果。详见[局部主题 · 构造选项](../guide/local-scope.md#sync-pitfall)。
:::

作用域创建后：

- 其 CSS 选择器（默认 `[data-theme-scope='preview']`）命中的元素**及其后代**读取这套变量；
- 作用域外的元素完全不受影响；
- 每个作用域的参数**独立持久化**，下次打开页面仍是该预览区的主题。

不再需要时移除：

```js
themeManager.removeScope("preview"); // 断开样式并清掉它的参数持久化
```

详见[局部主题](../guide/local-scope.md)。

## 第 6 步：首屏与回访零闪（可选）

主题样式由运行时动态合并注入，首访会闪一次默认主题（FOUC），且注入发生在 JS 执行期。要进一步优化首屏，**直接换用静态主题包**——`<link>` 一行，浏览器并行加载 CSS，首帧就是主题色：

```html
<head>
    <!-- 静态主题包：构建期从主题色种子派生的完整标尺，与运行时产物同源 -->
    <link rel="stylesheet" href="/path/to/@autospark/theme/dist/blue.css" />
    <script src="/path/to/@autospark/theme/dist/autospark.theme.js"></script>
</head>
```

要点：

- 产物在 `dist/<色>.css`（12 个预设各一份，`blue` / `red` / `green` …），也可用 CLI 从任意 hex 生成；
- 静态包**在前**、主题插件在后：运行时 connect 水合后比对指纹（`--x-theme-static`），与静态层完全一致时**跳过注入**——零 IO、零重排，只保留运行时切换能力；
- 之后改主题色（`themeManager.themeColor = "purple"`）会自动回退动态注入，静态 link 留着无害；
- 静态包只服务 root 作用域，与恢复片段同用时**静态 link 在前、片段在后**（head 顺序约定）。

不走静态包时，**回访**零闪靠恢复片段——在 `<head>` 里粘一段阻塞内联脚本，赶在首帧前把上次的主题样式从 localStorage 插回去：

```html
<head>
    <!-- 必须在任何模块脚本之前、且在首帧绘制之前执行 -->
    <script>
        (function () {
            try {
                var css = localStorage.getItem("autospark-theme-styles");
                if (!css) return;
                var s = document.createElement("style");
                s.id = "autospark-theme-restore";
                s.textContent = css;
                document.head.appendChild(s);
            } catch (e) {}
        })();
    </script>
</head>
```

要点：

- 片段是**同步内联**脚本，先于模块脚本、先于首帧绘制；
- 运行时启动后会重算注入并**自动移除** `#autospark-theme-restore` 标签，宿主不需要清理；
- 运行时**先水合参数、再注入**，避免「恢复 → 默认 → 恢复」的二次闪烁；
- 同源多应用自定义了 `storageKey` 时，片段里的 key 要同步改成 `{storageKey}-styles`。

详见[持久化与回访零闪](../guide/persistence.md)与[静态主题包](../guide/static.md)。

## 第 7 步：完整示例

```html
<!doctype html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8" />
        <link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
        <!-- 首屏优化（可选）：换用/加用静态主题包，运行时指纹匹配即跳过注入 -->
        <!-- <link rel="stylesheet" href="/path/to/@autospark/theme/dist/blue.css" /> -->
        <script>
            (function () {
                try {
                    var css = localStorage.getItem("autospark-theme-styles");
                    if (!css) return;
                    var s = document.createElement("style");
                    s.id = "autospark-theme-restore";
                    s.textContent = css;
                    document.head.appendChild(s);
                } catch (e) {}
            })();
        </script>
    </head>
    <body>
        <div class="toolbar">
            <button class="auto-btn primary" id="btn-dark">切换暗色</button>
            <button class="auto-btn" id="btn-color">换个主题色</button>
        </div>

        <div class="auto-card">
            <div class="auto-card-header"><span class="auto-card-title">全局主题</span></div>
            <div class="auto-card-body">
                <input class="auto-input" placeholder="输入点什么…" />
                <div class="auto-alert success">
                    <div class="title">保存成功<span class="closeable"></span></div>
                    <div class="description">这条提示的颜色来自语义色 success。</div>
                </div>
            </div>
        </div>

        <div id="preview" class="auto-card">
            <div class="auto-card-header"><span class="auto-card-title">局部主题</span></div>
            <div class="auto-card-body">这个卡片有自己的主题色与暗色。</div>
        </div>

        <script type="module">
            import { themeManager } from "@autospark/theme";

            // 全局：暗色 / 主题色
            document.getElementById("btn-dark").onclick = () => {
                themeManager.dark = !themeManager.dark;
            };
            const colors = ["blue", "purple", "green", "volcano", "magenta"];
            let i = 0;
            document.getElementById("btn-color").onclick = () => {
                themeManager.themeColor = colors[++i % colors.length];
            };

            // 局部：预览区独立主题（模式 / 尺寸用 setter 赋值才即时生效）
            const preview = themeManager.addScope({
                id: "preview",
                elements: ["#preview"],
                themeColor: "magenta",
            });
            preview.dark = true;
            preview.radius = "small";
        </script>
    </body>
</html>
```

## 小结

| 步骤 | 引入的能力 | 关键 API / 属性 |
| --- | --- | --- |
| 1 | 引入静态层与运行时 | `import { themeManager }`、`index.css` |
| 2 | 换主题色 | `themeManager.themeColor`、`themeManager.presets` |
| 3 | 暗色 / 多彩（含局部） | `themeManager.dark` / `.colorized`、`data-dark` / `data-colorized` / `data-uncolored` |
| 4 | 尺寸调节（含局部） | `.size` / `.radius` / `.spacing` / `.shadow`、`data-size` 等 |
| 5 | 局部作用域 | `addScope()` / `removeScope()`、`data-theme-scope` |
| 6 | 回访零闪 | 恢复片段 + 自动持久化 |
| 7 | 整合成型 | 静态类名 + 运行时开关 |
| 8 | engine 应用（可选） | `engine.themeManager`、`state.$.theme` 七键投影（见[插件形态](./install.md#插件形态-与-engine-协同)） |

贯穿全程的两条心智模型：

1. **变量是接口**：组件只消费 `--auto-*`，主题只改上游种子——换肤不需要动组件。
2. **主题是作用域的属性**：全局主题是 root 作用域，局部主题是 `addScope` 出来的作用域，二者的参数、持久化、样式注入完全同构。

## 下一步

- 构造与生命周期：[初始化](../guide/initial.md)
- 从种子到变量的全过程：[工作原理](../guide/how-it-works.md)
- 颜色要素六节：[主题要素 · 颜色](../guide/color.md)
- 组件变量分组：[组件变量](../guide/component.md)
- 元素域与局部主题：[元素域](../guide/element-scope.md)、[局部主题](../guide/local-scope.md)
