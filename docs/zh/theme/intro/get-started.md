# 快速入门

本页带你从零搭起一个「可换肤的界面」——分几步走，每步引入一两个能力，最后拼成一个带全局主题、局部主题与回访恢复的完整页面。

> 不熟悉「主题色」「语义色」「作用域」这些词？先花两分钟读一遍[名词解释](./glossary.md)。

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

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
<script type="module">
    import { themeManager } from "@autospark/theme";
</script>
```

`themeManager` 是模块级单例：**引入即初始化**——根作用域挂到 `document.documentElement`，基础变量与主题标尺随之注入 `<head>`。不需要手动 `new`。

::: tip 静态层与运行时层
CSS 文件负责 reset / 工具类 / 组件类；JS 负责注入主题变量。两者都引，组件类才会随主题变化。详见[静态样式层](../guide/static.md)。
:::

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

详见[显示模式与色彩维度](../guide/mode.md)。

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

详见[尺寸参数](../guide/size.md)。

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
`themeColor` 可以直接写在 `addScope` 的选项里；但 `dark` / `colorized` / 四个尺寸**必须经 setter 赋值**才会立即写元素属性并生效——写在构造选项里需要等下一次水合（刷新）才看到效果。详见[尺寸参数 · 注意事项](../guide/size.md#sync-pitfall)。
:::

作用域创建后：

- 其 CSS 选择器（默认 `[data-theme-scope='preview']`）命中的元素**及其后代**读取这套变量；
- 作用域外的元素完全不受影响；
- 每个作用域的参数**独立持久化**，下次打开页面仍是该预览区的主题。

不再需要时移除：

```js
themeManager.removeScope("preview"); // 断开样式并清掉它的参数持久化
```

详见[主题作用域](../guide/scope.md)。

## 第 6 步：回访零闪（可选）

主题样式由运行时注入，所以**首访**会闪一次默认主题（FOUC，本轮明确接受）；**回访**则可以零闪烁——在 `<head>` 里粘一段阻塞内联脚本，赶在首帧前把上次的主题样式插回去：

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

详见[持久化与回访零闪](../guide/persistence.md)。

## 第 7 步：完整示例

```html
<!doctype html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8" />
        <link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
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

贯穿全程的两条心智模型：

1. **变量是接口**：组件只消费 `--auto-*`，主题只改上游种子——换肤不需要动组件。
2. **主题是作用域的属性**：全局主题是 root 作用域，局部主题是 `addScope` 出来的作用域，二者的参数、持久化、样式注入完全同构。

## 下一步

- 构造与生命周期：[初始化](../guide/initial.md)
- 主题色与调色板：[主题色](../guide/color.md)
- 语义色与对比度：[语义色](../guide/semantic.md)
- 变量分层全景：[变量体系](../guide/variables.md)
- 组件类清单与用法：[内置组件与工具类](../guide/components.md)
