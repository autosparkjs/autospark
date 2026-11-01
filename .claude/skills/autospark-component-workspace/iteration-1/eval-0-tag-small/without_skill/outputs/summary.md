# autospark.tag 状态标签组件 — 实施摘要

## 做了什么

给 `@autospark/plugins` 新增 **autospark.tag** 组件插件：列表 / 卡片里的状态标记（tag / badge）。完全沿用 autospark.button 组件插件样板（ADR-0003 组件形态）：模板字符串注册进插件全局组件表（`AutoSpark.components["autospark.tag"] = 模板`），经 `installPlugin` 单点双路径自举（直注册 / 预加载队列），运行时零依赖 engine。

**能力面（props 单向注入组件 data 域）：**

- `type` 语义色变体：`default`（中性淡底，缺省）/ `primary` / `success` / `danger` / `warning` / `info`；
- `size` 三档尺寸：`sm`（12px）/ `md`（13px，缺省）/ `lg`（14px）；
- `closable` 可关闭：渲染 `×` 关闭钮（原生 button，键盘可达），点击 → 派发组件事件 `close`（ADR-0117，detail 携 `{ label, type }`，冒泡可经 `@close` 监听）→ 从 DOM 移除；带 `closable` 守卫挡程序化触发隐藏钮；
- `label` 默认插槽兜底文案（宿主裸子节点覆盖）。

## 文件清单

**新增（6）：**

| 文件 | 说明 |
| --- | --- |
| `packages/plugins/src/components/tag/index.ts` | 插件入口：TAG_NAME 常量 + 全局组件表注册 + installPlugin 自举 |
| `packages/plugins/src/components/tag/tag.html` | 组件模板：`<script setup>`（data/methods）+ `<style global>`（主题化样式）+ 插槽出口 + × 关闭钮 |
| `packages/plugins/src/__tests__/components/tag-plugin.test.ts` | 5 个用例：注册 / 化身渲染默认值 / 变体承载 / closable 交互（事件 + DOM 移除）/ 插槽覆盖 |
| `packages/plugins/demo/tag.html` | 插件包 demo 页（dev 5181 / build:demo 自包含） |
| `docs/demos/plugin/tag.html` | 文档站 demo（`<demo html="plugin/tag.html"/>` 内嵌） |
| `docs/zh/guide/plugin/tag.md` | 中文文档：概述 / 快速入门 / 指南（变体、尺寸、可关闭、插槽）/ Props 表 / 事件表 / 主题化 / 注意事项 |

**修改（7）：**

| 文件 | 改动 |
| --- | --- |
| `packages/plugins/src/index.ts` | 聚合入口追加 `import "./components/tag/index"`（注释同步） |
| `packages/plugins/vite.config.ts` | `CLOSURE_ARTIFACTS` 登记 `autospark.tag.js` 产物；`build:demo` rollup input 加 tag 页 |
| `packages/plugins/demo/index.html` | 组件树登记 tag 条目 |
| `packages/plugins/readme.md` | 插件表加 tag 行 |
| `packages/plugins/CONTEXT.md` | 组件型四分类括号补 `button / tag` |
| `docs/zh/guide/plugin/index.md` | 三形态官方样板表加 autospark.tag 行（链文档页） |
| `docs/.vitepress/config/index.ts` | 侧边栏新增「扩展组件」分组（紧跟「扩展指令」之后），登记 autospark.tag 页 |

## 关键决策点

1. **变体承载走 :has() 间接驱动**：遵守化身路径 T4=B 约束（组件快照根的动态绑定不求值）——`:data-type` / `:data-size` 绑在插槽出口内层 span 上，宿主外观经 `.asc-tag:has(> .asc-tag-label[data-type=…])` 选择器驱动，与 button 完全同构。
2. **视觉形态取「淡底描边字」**（区别 button 的语义色实底）：底 = `color-mix` 语义色淡染于面板底（浅色 10% / 暗色 16%），边 = currentColor 22% 淡染，字 = 语义色本体——状态标记轻量不抢焦点。三级主题回退链 `var(--auto-X, var(--asc-tag-X, 校准兜底值))`，兜底字面值取自 theme-token-baseline.md 校准表，`[dark]` / `[data-dark]` 暗色变体齐备。
3. **closable 双步契约**：先 `this.emit("close", detail)`（ADR-0117 组件事件，宿主 / 祖先 `@close` 可监听同步业务 state——文档给出 x-for + filter 的状态同步范式），再 `this.el.closest(".asc-tag")?.remove()` 从 DOM 移除（x-on 场景 `this.el` 是触发元素，closest 回溯组件根，与钩子场景两态兼容）。另加 `if (!this.data.closable) return` 守卫——关闭钮经 x-show 隐藏后真实用户不可达，但程序化 `click()` 仍可直调，守卫封死该通道。
4. **demo 两个坑（端到端实测纠正）**：① 构造第二参是裸状态对象本身，多包一层 `{ state: … }` 会让根状态错位（插值空、列表不渲染）；② x-for 语义是「容器宿主 + 子元素为项模板」——`x-for` 应写在列表容器上、`.card` 作子项，而不是把 card 当重复宿主（否则项内容被扁平拍进容器）。
5. **侧边栏登记**：文档站无既有「插件组件」分组（button 尚无独立文档页），故新建「扩展组件」分组放在指令参考区「扩展指令」之后——与 x-ripple / x-spin 的扩展指令分组形成对称，为后续组件插件留位。

## 构建与验证

| 项 | 结果 |
| --- | --- |
| `bun install` | 通过（335 packages，68s） |
| `packages/plugins && bun run build` | 通过——`autospark.tag.js` 闭包产物 2.93 kB gzip，自动复制 docs/public |
| `bun run build:demo` | 通过（先补建 engine 三格式产物后）——dist-demo 含 tag.html |
| `bun test`（packages/plugins） | 403 pass / 5 fail——5 个失败全部在 **x-ripple inside** 用例，与本改动零交集（其导入链不含任何本次改动文件），为 worktree HEAD 既有失败；tag 新增 5 用例全绿 |
| oxlint（新增 TS） | 0 warnings / 0 errors |
| 浏览器端到端（Bun.serve + Playwright，真实引擎 + 闭包产物） | 六变体色值 / 三档字号（12/13/14px）经 getComputedStyle 精确断言通过；点 × → DOM 移除 + `@close` 计数器递增；x-for 卡片列表关闭联动 state 过滤（3→2→1）；closable 守卫生效（隐藏钮程序化点击不移除） |
