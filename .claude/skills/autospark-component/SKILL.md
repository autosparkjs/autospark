---
name: autospark-component
description: 在 autospark monorepo 内创建官方组件（每个组件同时是一个 AutoSpark 组件型插件，IIFE 产物）+ demo + 文档 + 侧边栏登记的完整工作流。当用户要求新增/创建 autospark 组件、给 @autospark/plugins 加组件、做一个 xxx 组件插件、为组件写 demo 或组件文档时使用本 skill——即使用户没有说出「插件」二字，只要是往 packages/plugins 里加带样式的 UI 组件就属于本 skill 范围。
---

# AutoSpark 组件创建

核心心智模型：**每个组件同时是一个 AutoSpark 插件**（组件 = 插件合一，ADR-0003 / ADR-0111）。

- 组件型插件住在 `packages/plugins/src/components/<name>/`（ADR-0009 四区落位），一插件一文件夹自包含
- **交付产物是 `autospark.<name>.js`（IIFE 格式）**——脚本即契约，无 ESM/CJS、无 exports map；构建后生成于 `dist/` 并复制到 `docs/public/`；运行时零静态依赖 engine，经 `installPlugin`（@autospark/utils）双路径自举，先后于引擎加载都能正确注册
- 模板自包含：`x-define` + `<script setup>` + `<style global>` 随模板整体注册，无独立样式交付通道
- 样式**必须**基于 @autospark/theme 的 CSS 变量体系构建（三级回退链，见下文「主题合规红线」）

## 工作流总览

1. 命名与规模判定（本文件）
2. 创建文件关键约定（本文件；完整样板 → `references/template-anatomy.md`）
3. 主题合规样式（红线在下方，变量全表 → `references/theme-vars.md`）
4. 登记面五处（→ `references/registration.md`）
5. 构建验证（本文件）
6. 按检查清单自查

## 第一步：命名（一处定四处）

`<name>` 一经确定，四个面随之派生（全部小写/kebab-case——DOM 会把属性参数**小写化**，大写或驼峰组件名会静默 MISS）：

| 面 | 规则 | 示例（name=button） |
|---|---|---|
| 组件注册名 | `autospark.<name>`（点前缀命名空间，ADR-0094） | `autospark.button` |
| IIFE 产物名 | `autospark.<name>.js` | `autospark.button.js` |
| CSS 类前缀 | `.asc-<name>`（组件根及内部元素） | `.asc-button` |
| CSS 覆盖变量 | `--asc-<name>-*`（使用者覆盖通道） | `--asc-button-bg` |

源文件为 `src/components/<name>/index.ts` + `<name>.html`。

## 第二步：规模判定（小型 vs 大型）

分界标准是**代码量与文件组织**，不是功能复杂度：

**小型组件**——代码量在单组件样板内装得下（`index.ts` + `<name>.html` 两文件）：照 button 样板落地（`references/template-anatomy.md` 的完整样板，含 installPlugin 自举），IIFE 构建管线零额外代码。有浮层、样式注入等需求**依然可以是小型**——出现功能信号就查 `references/utils-catalog.md` 选工具，单文件内消费即可。

**大型组件**——代码量太多、单文件装不下，**需要拆分为多个文件**时（主模板过长、类型定义独立、多子组件各自注册、bootstrap 拆出、注册 action）：

- 目录内多文件组织（参考 `src/modules/notifications/` 与 `src/modules/resource/` 的 bootstrap 拆分模式）
- 采用 @autospark/utils 与 `src/utils/` 家族工具函数承载逻辑（工具目录见 `references/utils-catalog.md`），共享纯函数住 `src/utils/`（一函数一文件）而不是复制进组件目录

功能信号（浮层定位 / 全局样式注入 / 尺寸响应 / 读 engine 成员）与规模正交：出现即查 utils-catalog 选工具，小型组件同样可用。无论规模，入口 `index.ts` 的 `installPlugin` 自举结构不变——这是 IIFE「引入即可」契约的根基。

## 第三步：创建文件时的关键约定

- 模板文件经 `?raw` 字符串导入内联进产物：`import template from "./<name>.html?raw"`——模板以字符串形态随 IIFE 交付，无独立模板加载通道
- **style 段默认 global**：`<style global id="autospark-components-<name>">`——注册期原样注入 head，id 作幂等键，主题变量回退链与暗色兜底选择器全局直命中。scoped 段（无 `global` 属性）仅在需要实例级样式隔离或 `bind()` 响应式样式时使用（ADR-0087 混排自由）
- 完整样板（index.ts + html 逐段职责）见 `references/template-anatomy.md`

## 第四步：主题合规红线

这些是硬性规范（@autospark/theme 驱动），违反即返工：

1. **禁止硬编码语义色值**。颜色一律走 CSS 变量，优先用 `--auto-*` 语义变量（`--auto-color` / `--auto-bgcolor` / `--auto-primary-color` / `--auto-border` / `--auto-font` …），全表见 `references/theme-vars.md`。
2. **三级回退链**（ADR-0129）：`var(--auto-X, var(--asc-<name>-X, 校准兜底值))`——主题在场吃主题，不在场吃使用者覆盖变量，都没有吃兜底字面值。组件脱离主题独立可用，接入主题自动换肤。
3. **暗色兜底变体**：`[dark] .asc-<name>, [data-dark] .asc-<name> { ... }` 切换兜底字面值（变量链不变）。
4. **化身路径约束（T4=B，最常见缺陷）**：组件模板**根上的动态绑定不会求值**（静态并入宿主）。变体绑定（`:data-type` / `:data-size`）必须落在编译子树的内层元素（通常是插槽出口），经 `:has()` 选择器驱动宿主外观；原生属性（如 `disabled`）在 `mounted()` 里同步到 `this.el`。
5. 尺寸变体惯例：内层元素 `data-size` + `.asc-<name>:has(> .xxx[data-size="sm"])` 模式，尺寸梯度取 `--x-font-size-*` / `--x-spacing-*` 标尺。

## 第五步：登记面（缺一处即断链）

新增组件须登记**五处**，具体模板与位置见 `references/registration.md`：

1. `packages/plugins/vite.config.ts` 的 `CLOSURE_ARTIFACTS`（IIFE 产物构建清单）
2. `packages/plugins/src/index.ts` 聚合入口（副作用导入）
3. demo：`docs/demos/components/<name>/basic.html`（纯 HTML 可运行）
4. 文档：`docs/zh/components/<name>.md`
5. 侧边栏：`docs/.vitepress/config/index.ts` 中 `"/zh/components/": []` 数组

## 第六步：构建与验证

```bash
cd packages/plugins && bun run build
```

成功标志：产物 `dist/autospark.<name>.js` 生成、gzip 体积日志打印、自动复制到 `docs/public/`。构建失败直接读报错修复；产物缺失先回查 `CLOSURE_ARTIFACTS` 登记。

浏览器验证两条路：

1. **文档站**：`bun run dev`（根目录，5173）后打开 `docs/zh/components/<name>.md` 对应页面——dev 中间件已接管 `/autospark/autospark.<name>.js`（源码变更自动触发插件包构建并伺服新产物），demo iframe 即真实产物。
2. **裸 demo**（方法见记忆 verify-demos-via-bun-serve-playwright）：`Bun.serve` 把 `docs/demos/components/<name>/` 与 `docs/public/`（挂 `/autospark/`）映射为站点，Playwright 打开 demo 确认组件渲染、变体切换、暗色模式三态。

无论哪条路，验证三态：默认态 / type·size 变体态 / 暗色态（demo 容器裸挂 `data-dark`）。

样式若异常，优先怀疑：兜底值对比度不足、`--auto-*` 变量名拼写、根绑定未内移（红线 4）。

## 完成检查清单

- [ ] 注册名 `autospark.<name>` 小写 kebab，四处派生名一致
- [ ] `index.ts` 经 `installPlugin` 自举 + `captureNamespace`，注册写 `autospark.components[...]`
- [ ] 模板经 `?raw` 导入：`import template from "./<name>.html?raw"`
- [ ] `<name>.html` 含 `x-define` / `<script setup>` / `<style global id="autospark-components-<name>">`
- [ ] 样式零硬编码语义色；三级回退链；暗色兜底变体在场
- [ ] 根上无动态绑定；原生属性 mounted 同步
- [ ] 五处登记面齐全
- [ ] 交付产物 `autospark.<name>.js`（IIFE）已生成于 `dist/` 并复制到 `docs/public/`
- [ ] demo 浏览器验证：默认态 / 变体态 / 暗色态均正常
- [ ] 新代码注释为中文，缩进 4 空格，与周边文件一致

## 参考文件索引

| 文件 | 何时读 |
|---|---|
| `references/template-anatomy.md` | 创建任何组件前——index.ts 完整样板 + html 模板解剖 + 大型组织模式 |
| `references/theme-vars.md` | 写样式时——`--auto-*` 语义变量全表 + `--x-*` 标尺 + 回退链写法示例 |
| `references/utils-catalog.md` | 大型组件选工具时——家族工具目录与决策表 |
| `references/registration.md` | 登记时——五处登记的精确位置、模板与 VitePress 陷阱 |
