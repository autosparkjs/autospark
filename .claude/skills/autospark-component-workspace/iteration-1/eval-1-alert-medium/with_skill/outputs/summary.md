# alert 警告条组件插件 · 实施总结

## 实施摘要

按 autospark-component skill 完整工作流，向 `@autospark/plugins` 新增 `autospark.alert` 警告条组件插件（组件 = 插件合一，IIFE 产物 `autospark.alert.js`，gzip 3.80 kB），并配套 demo、中文文档与侧边栏登记。

功能四要素全部落地：

- **语义色四种**：`type` = info / success / warning / danger，浅底深字配色（底/边框由 `--auto-*-color` 语义主色经 `color-mix` 派生，三级回退链完整）
- **标题 + 描述两行布局**：`title` / `description` props；描述缺省自然收成单行；默认插槽出口在正文区——宿主提供子内容时投影替换标准两行，图标 / 关闭 / 配色外壳保留
- **closable 关闭**：`closable: true` 显示右侧 × 按钮；点击后组件域立即收起 + 经 `this.emit`（ADR-0117）派发冒泡 `close` 事件；父组件在组件外包裹元素 `@close` 同步源状态，`visible` prop 由父状态注入即可控制重新显示（完整闭环在 demo 中验证）
- **可选左侧图标**：`icon`（默认 true）；四个内联 SVG 按 type 自动切换，零外部依赖

规模判定：小型组件（无浮层 / 注入 / 尺寸响应），照 button 两文件样板落地。

## 文件清单

新增（5）：

- `packages/plugins/src/components/alert/index.ts` — 插件入口（installPlugin 自举 + captureNamespace，注册 `autospark.components["autospark.alert"]`）
- `packages/plugins/src/components/alert/alert.html` — 组件模板（x-define / script setup / style global / 插槽出口，含主题化样式与暗色兜底）
- `docs/demos/components/alert/basic.html` — 基础 demo（四语义色 / 单行 / 图标开关 / 插槽 / 暗色块）
- `docs/demos/components/alert/closable.html` — 交互 demo（自治关闭 / 父状态闭环重开 / 初始隐藏按需出现）
- `docs/zh/components/alert.md` — 中文文档（props 表 / 变体 / 插槽 / 关闭闭环 / 主题化覆盖通道）

修改（3）：

- `packages/plugins/vite.config.ts` — `CLOSURE_ARTIFACTS` 追加 alert 产物项（按 skill 指引放数组末尾）
- `packages/plugins/src/index.ts` — 聚合入口追加 `import "./components/alert/index"`（聚合产物同步含 alert）
- `docs/.vitepress/config/index.ts` — 侧边栏新建 `"/zh/components/"` 键并登记 Alert 条目（置于 /zh/examples/ 之前）

## 关键决策点

1. **skill 与代码库现状的出入（以现状为准 + skill 指引创建）**：worktree 中不存在 `docs/demos/components/`、`docs/zh/components/` 与侧边栏 `/zh/components/` 键（现役组件插件 button 无 docs demo / 文档，只有 `packages/plugins/demo/` vite 站）。因任务明确要求「demo + 中文文档 + 进侧边栏」，按 skill 指定的路径新建了这三个位置。顶栏 nav 未加「组件」入口（skill 称已有、实际没有；任务只要求侧边栏，为最小改动面未动 nav，文档页经 `/zh/components/alert` 直达，侧边栏键前缀匹配生效）。
2. **visible 的双通道设计**：props 注入（父状态 → 组件 data，值变 Object.assign）负责外部驱动；close 点击写组件域 `data.visible = false` 负责即时收起（不依赖父监听，响而不哑）；`close` 冒泡事件供父同步源状态避免分叉。display 属 DOM 层控制，在 mounted 里经 JS 通道同步到宿主根（红线 4 的「原生属性 mounted 同步」精神）；type 变体走内层 `:data-type` + `:has()`，两通道不混。
3. **修复了 skill 样板里潜伏的 watch 信封缺陷**：`scope.watch` 的 listener 在路径支路与表达式支路统一以 `{ value }` 对象信封调用（`scope.ts` watchPath 与 watchExpression 两处均为 `listener({ value })`），而 button 样板（及 template-anatomy.md 文档）写的是裸值 `(v) => ...` —— `{value:false}` 恒 truthy，条件分支恒走真侧。首版照抄样板导致「点关闭 display 不变」，浏览器端到端验证暴露后改为 `({ value: v }) => ...` 修复。建议 skill 修正该示例。
4. **close 事件用引擎现成通道**：`this.emit("close")`（ADR-0117 组件事件发射，getMethodThis 白名单 framework key）替代手写 `dispatchEvent(new CustomEvent(...))`，更地道。
5. **插槽出口位置**：放在正文区 main 上（而非整个内容行 body），宿主自定义内容时保留图标、关闭按钮与配色外壳。
6. **props 对象成员用纯状态路径**：demo 中 `visible: synced` 直取状态键；避免 `visible: !flag` 这类含运算符的成员表达式（对象字面量成员以纯路径最稳）。

## skill 哪部分最有用 / 最缺

最有用：

- **登记面五处清单 + 精确模板**（registration.md）：CLOSURE_ARTIFACTS / 聚合入口 / demo 路径 / 文档骨架 / 侧边栏键，照抄即可不断链；「数组末尾追加」「demo 路径不带开头斜杠」这类细节省了试错。
- **化身路径约束（T4=B）**（template-anatomy.md）：`:data-type` 落内层 + `:has()` 驱动宿主 + 原生属性 mounted 同步——alert 的变体与 visible 设计直接建立在这条红线上。
- **主题合规三级回退链 + 暗色兜底**（theme-vars.md）：变量全表 + color-mix 派生浅底的写法让配色一次成型，暗色态视觉验证一次通过。

最缺（按本次实际踩坑排序）：

1. **`scope.watch` 的 `{ value }` 信封语义完全没提**，且样板（button 的 disabled watch / template-anatomy.md 示例）按裸值写法**本身是错的**——运行时改 prop 会静默失效。这是本次唯一的功能性返工点。
2. **`this.emit` 组件事件通道（ADR-0117）没提**——做 closable / 可交互组件时的关键 API，样板里无先例（我首版手写 dispatchEvent）。
3. skill 预设的 docs 落位（demos/components、zh/components、侧边栏键、nav「组件」入口）与 worktree 现状不符——worktree 里这些都不存在；skill 宜注明「若不存在则创建」及现状差异（registration.md 只对侧边栏键写了这句话）。
4. `@click` 的 method 调用形态限制（须裸标识符，三元表达式走 with 求值必失败）散落在 notifications 源码注释里，skill/template-anatomy 未收录——做带交互组件必踩。

## 构建与验证

- `bun install`（26.6s，335 包）+ `cd packages/plugins && bun run build` **通过**：`Alert plugin Gzipped size: 3.80 kB`，产物 `dist/autospark.alert.js` 生成并自动复制到 `docs/public/`，聚合产物 `autospark.plugins.js` 同步包含 alert。
- 浏览器端到端验证（Bun.serve 临时映射 docs/demos 与 docs/public + Playwright）：
  - basic.html：12 条 alert 全渲染、四语义色 / 图标切换 / 两行布局 / 单行 / 无图标 / 插槽投影 / 暗色块均正常（截图 + 视觉模型复核），零 console 错误；
  - closable.html：六项断言全过——初始隐藏（visible:false 注入）、自治关闭（点 × 收起）、close 事件同步父状态（synced 翻转 + 重开按钮出现）、父状态重开（重新显示）、初始隐藏条按需唤起、再关闭回初始态。
- 修复 watch 信封缺陷后重建并全量回归通过；诊断用临时文件已清理，未 commit / push。
