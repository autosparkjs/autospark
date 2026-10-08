# @autospark/theme

CSS 变量驱动的运行时主题库：从单个主题色派生出整套界面变量（基础值 → 派生别名 → 组件类），支持暗色、多彩模式与全局 / 局部作用域。

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
