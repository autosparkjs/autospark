# @autospark/theme

CSS 变量驱动的运行时主题库：从单个主题色派生出整套界面变量（基础值 → 派生别名 → 组件类），支持暗色、多彩模式与全局 / 局部作用域。

## 零 JS 正确首帧：静态主题包（可选）

主题变量默认由 JS 运行时注入，首帧（尤其 JS 未下载完成的弱网/SSR 场景）会短暂缺少主题变量。构建期生成的**静态主题包**与运行时注入同源，在 head 静态引入即可让首帧零 JS 即拿到完整主题：

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/themes/blue.css" />
<!-- 之后才是库脚本 -->
<script type="module" src="/app.js"></script>
```

12 个预设色随包发布（`blue` / `red` / `volcano` / `orange` / `lime` / `gold` / `green` / `cyan` / `geekblue` / `techblue` / `purple` / `magenta`），经包导出消费：

```js
import "@autospark/theme/themes/blue.css";
```

自定义品牌色、维度形态或调色板参数，在本仓库用生成器单独产出（bun 直跑，ADR-0004 / ADR-0005）：

```bash
bun scripts/generate-theme.ts blue                      # 预设 → dist/blue.css
bun scripts/generate-theme.ts --theme-color blue        # 同上（--theme-color 与位置参数恰居其一）
bun scripts/generate-theme.ts '#3b82f6' -o dist/brand.css        # 自定义 hex（必须 -o）
bun scripts/generate-theme.ts --all                     # 构建期批量：src/themes.json 全部条目
bun scripts/generate-theme.ts '#3b82f6' -o dist/brand.css --gap 2 --cap 1.3 --success '#16a34a'
```

**维度烘焙（可选）**：除主题色外还可把显示模式与规模档位的「首访默认」烘进包里，零 JS 首帧即呈该形态：

```bash
bun scripts/generate-theme.ts --theme-color blue --dark --size large --radius small -o dist/blue-dark.css
# --dark / --colorized           布尔旗（出现即 true）
# --size / --spacing / --shadow / --radius <档>   档位枚举 x-small/small/medium/large/x-large（spacing·shadow·radius 另有 none；size 无 none）
```

工作原理：烘焙维度以守卫块（`:root:not([data-X]) { … }`）追加在包尾部——只在对应属性缺席时（零 JS 首帧窗口）生效；库加载后若是首访（无 localStorage 参数），自动采纳包声明的维度默认并写入 `<html>` 属性、落盘到 localStorage，此后守卫块自然失效、由标准机制以同值接管。两个推论：

- **用户选择恒优先**：回访用户水合出的维度与包声明不同是常态，不告警、不回退，维度字段不参与指纹匹配；
- **回退库默认要显式写属性**：烘焙 `dark` 的页面上切亮写 `data-light`（而非移除 `dark`）、烘焙 `size: large` 的页面上回 medium 写 `data-size="medium"`、烘焙 `colorized` 的页面上退灰写 `data-uncolored`——「无属性」的语义即烘焙值。

`--all` 读 `src/themes.json`（key 即产物名 `dist/<key>.css`），条目可声明同名维度与颜色覆盖字段：

```jsonc
{
  "blue": { "color": "blue", "title": "拂晓蓝" },
  "blue-dark": { "color": "blue", "dark": true, "size": "large" }
}
```

条目字段白名单校验（未知字段/非法档位直接报错）；`--all` 与单包标志同现时静默忽略后者——批量产物是清单的纯函数。

指纹匹配：每个文件头部带一条指纹（`--x-theme-static: v2|生效hex|gap|cap|五个语义色种子|六个维度默认`）。ThemeManager 初始化、水合 localStorage 参数后读取指纹比对前 9 个颜色字段——**完全一致**才跳过运行时样式注入（静态文件即永久样式来源）；指纹存在但不一致（文件过期、包升级改变输出、回访用户上次选了别的颜色）会在控制台告警并自动回退动态注入，外观始终正确。升级主题库后若看到该告警，重新运行生成器即可。

### 与恢复片段共存时的 head 顺序

同时使用静态主题包与[回访恢复片段](#回访零闪恢复片段可选)时，**静态 link 在前、恢复片段在后**——用户运行时切换出的主题（回访快照）优先于编译期默认色；水合色恰好等于静态包时才真正跳过注入：

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/themes/blue.css" />
<script>
  (function () {
    /* 恢复片段（见下节），必须位于静态 link 之后 */
  })();
</script>
<script type="module" src="/app.js"></script>
```

边界：静态主题包只覆盖全局（root）作用域，局部作用域与运行时换肤仍由 ThemeManager 动态注入；详见 ADR-0004。

浏览器端 `themeManager.root.download()` 是同源导出通道：root 作用域的下载产物带指纹头、并把下载时刻的维度状态（dark/size 等）一并烘焙，与 `generate-theme` CLI 同参产物逐字节一致——「在页面上调好主题，下载即得合规静态包」（局部作用域的下载产物仅为作用域快照，不可作静态包）；详见 ADR-0006。

## 回访零闪：恢复片段（可选）

主题样式由运行时注入并自动持久化到 localStorage（样式快照 + 各作用域参数，ADR-0003）。宿主在 `<head>` 粘贴以下阻塞内联片段，回访用户即可在首帧前还原上次主题，无任何闪烁：

```html
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
```

要求：

- 片段必须是 `<head>` 内的**同步内联脚本**（先于任何模块脚本执行，且先于首帧绘制）；
- 库加载后运行时会重算注入并自动移除 `#autospark-theme-restore` 标签，无需宿主清理；
- 同源多应用自定义了 `storageKey` 前缀时，片段中的 key 需同步改为 `{storageKey}-styles`；
- 关闭某作用域持久化：`addScope({ persistence: false })`；自定义前缀：`new ThemeManager({ storageKey: "myapp" })`。
