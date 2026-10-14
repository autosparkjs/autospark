# 持久化与回访零闪

## 概述

主题 CSS 全部依赖运行时注入，因此**回访用户首帧必然闪一次默认主题**——除非把上次的产物提前还给他。持久化机制做两件事（`ADR-0003`）：

1. **样式快照**：全部已连接作用域生成的 CSS 合成一个字符串，存进 localStorage；
2. **参数持久化**：每个作用域的用户可感参数独立存储。

回访时由宿主粘贴在 `<head>` 的**阻塞内联片段**把快照回插，先于首帧还原主题；运行时启动后重算重写、接管画面。

## 快速入门

```html
<head>
    <!-- 必须在模块脚本之前、首帧绘制之前执行 -->
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

```js
themeManager.dark = true; // 参数自动持久化；样式快照自动重写
```

## 指南

### key schema

| key | 内容 | 写入时机 |
| --- | --- | --- |
| `{storageKey}-styles` | 样式快照（全部作用域 CSS 的合成串） | 任意作用域的注入内容变化后全量重写 |
| `{storageKey}-scope-{id}` | 该作用域的参数 JSON | 参数值变化时 |
| — | 恢复片段插入的标签 id 为 `autospark-theme-restore` | 宿主片段写入，运行时移除 |

`storageKey` 默认 `autospark-theme`，由 `ThemeManager` 统一下发给各作用域。

::: warning key schema 是发布后的公共接口
宿主恢复片段**硬编码**了默认前缀，改名即破坏性变更。同源多应用必须用不同前缀：

```js
new ThemeManager({ storageKey: "myapp" }); // myapp-styles / myapp-scope-{id}
```
:::

### 参数范围

只有**用户可感**的七个参数进快照：

```json
{ "themeColor": "#722ed1", "dark": true, "colorized": false, "size": "medium", "radius": "small", "spacing": "medium", "shadow": "medium" }
```

**语义色与调色板形态参数不入快照**——它们属宿主级定制：若被写进本地，宿主升级默认值后会被旧参数钉死。

注意 `themeColor` 存的是**解析后的 hex**（预设名在写入时已被解析），所以预设表改名不会让老用户的主题失效。

### 快照怎么合成

```js
// 数据源：root + 全部局部作用域的注入缓存（不查 DOM）
const sources = [root, ...Object.values(scopes)];
const css = sources.filter((s) => s.persistence).flatMap((s) => s.cssChunks).join("\n");
```

- 只取**参与持久化**的作用域（`persistence: false` 的照常渲染、不进快照）；
- 按注册序拼接，`root` 在最前；
- 合成结果与上次相同时跳过写 IO。

### 自愈：为什么不需要版本号

运行时每次注入变化都会**全量重写**快照。于是：

> 库升级改变了生成输出 → 回访用户先看到旧快照（JS 就绪前的几秒窗口）→ 模块执行、注入重算 → 快照被覆盖为新产物。

过期快照的最坏结果与「无持久化」的现状等价（都是闪一次旧主题），因此刻意**不设版本号、不用 JSON 信封**：版本机制只能优化那几秒窗口，复杂度不值。

### 水合顺序：先参数、后注入

`connect()` 的顺序是刻意设计的：

```
水合参数（从 {storageKey}-scope-{id} 读） 
  → 注入（注入值即恢复值） 
  → 同步 DOM 属性（水合值不经 setter，属性在此补齐） 
  → root 接管时移除 #autospark-theme-restore 
  → 持久化参数（以水合结果预填去重基线，一致时零写 IO）
```

如果先注入默认值再水合，用户会看到「恢复 → 默认 → 恢复」的二次闪烁。

### 去重：把高频写入收敛

| 去重点 | 机制 |
| --- | --- |
| 注入内容 | `_cssMap`（styleId → css）：内容未变则跳过重解析与快照重写 |
| 样式快照 | `_lastStylesSnapshot`：合成结果未变则跳过 localStorage 写 |
| 参数 | `_lastParamsJson`：序列化结果未变则跳过写 |

取色器拖动的逐像素 `@input` 与 DOM 观察回环由此收敛为「值真变才写一次」。`disconnect()` 会清空 `_cssMap`——标签已删，重连必须重新注入（去重的失效补偿）。

### 关闭持久化

```js
// 局部作用域：只影响自己
themeManager.addScope({ id: "scratch", persistence: false });
```

该作用域照常注入渲染，但**不**读写 localStorage、**不**参与快照合成。

::: warning root 作用域目前没有关闭入参
`ThemeManagerOptions` 只暴露 `storageKey`。若确实要关掉 root 的持久化，可改 `storageKey` 落到另一命名空间，或在库外清理对应 key。
:::

### 清理

```js
themeManager.removeScope("preview");
```

会一并：断开样式、从快照摘除该作用域的 CSS 片段、删除它的参数 key（`{storageKey}-scope-preview`）。

### 环境降级

所有 localStorage 读写都包在 `try/catch` 中：iOS 隐私模式等不可写环境**静默降级为无持久化**，功能不受影响（只是回访会闪）。

## 行为矩阵

| 场景 | 首帧 | 稳定后 |
| --- | --- | --- |
| 首次访问 | 默认主题（FOUC，接受） | 应用参数后的主题 |
| 回访（片段 + 快照齐全） | 上次主题（零闪） | 重算重写，与首帧一致 |
| 回访（库升级改变了输出） | 旧主题 | 新产物覆盖快照（自愈窗口） |
| 回访（localStorage 不可用） | 默认主题 | 应用当前参数（不落盘） |
| `persistence: false` 的作用域 | 不参与快照 | 照常注入渲染 |

## 验证

`packages/theme/src/__tests__/persistence.test.ts` 覆盖了全链路：root 连接即写快照、`dark` 变化只写参数不重写快照、`themeColor` 切换重写快照且参数存解析值、同值重设零写入、新实例从参数 key 水合、`persistence: false` 不落盘、`removeScope` 清理参数并摘除片段。

---

下一步：[静态样式层与预设主题](./static.md)。
