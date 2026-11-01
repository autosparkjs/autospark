# alert 警告条组件插件 · 实施摘要

## 实施摘要

往 `@autospark/plugins` 新增 **autospark.alert** 组件插件（组件形态官方样板同 autospark.button）：四种语义色警告条，标题 + 描述两行布局，closable 点击收起（父组件状态经 `open` 受控键可控制重新显示），可选左侧图标。配套插件包 demo、docs 文档站三个可运行 demo、中文文档页并登记侧边栏，另附 happy-dom 组件测试 6 例。

### 组件契约

- **注册**：`AutoSpark.components["autospark.alert"] = 模板`（插件全局组件表，业务侧 `options.components` 同名覆盖通道完好）；产物 `autospark.alert.js`（IIFE 闭包，script 直引），并进聚合产物 `autospark.plugins.js`。
- **props**：`type`（info/success/warning/danger，缺省 info，响应式）| `title` / `description`（纯文本两行，空则不渲染该行）| `icon`（`true`=缺省按 type 取语义图标 info/success/warn/error、字符串=自定义图标名、`false`=关闭）| `closable`（缺省 false，显式开启）| `open`（缺省 true，受控显隐键）。
- **关闭与重显**：点 × → 内部 `closed` 置位 → 宿主整块隐藏（不留空盒），同时 `this.emit("close")` 派发冒泡 CustomEvent（监听写组件外包裹元素——组件封闭域）；`open` 假→真翻转复位 `closed` 实现重新显示，推荐 `@close` 同步父状态后 `show = true` 即重显。
- **主题化**：三级回退链 `var(--auto-X, var(--asc-alert-X, 校准兜底值))` + `[dark]` 暗色校准变体（对齐 ADR-0129 / button、notification 样板）。

## 文件清单

### 新增（9）

| 文件 | 说明 |
| --- | --- |
| `packages/plugins/src/components/alert/alert.html` | 组件模板（script setup + style global + body 结构） |
| `packages/plugins/src/components/alert/index.ts` | 插件入口（installPlugin 双路径自举 + 全局组件表注册） |
| `packages/plugins/src/__tests__/components/alert-plugin.test.ts` | 组件测试 6 例（注册/化身渲染/图标/closable/open 受控/响应式 type） |
| `packages/plugins/demo/alert.html` | 插件包 demo 页（语义色/图标/closable/受控四节） |
| `docs/demos/alert/basic.html` | 文档 demo：快速入门（四语义色 + 仅标题） |
| `docs/demos/alert/closable.html` | 文档 demo：closable 关闭 + open 重新显示 |
| `docs/demos/alert/icon.html` | 文档 demo：图标三态 + 响应式 type 切换 |
| `docs/zh/guide/components/alert.md` | 中文文档页（概述/快速入门/指南/配置选项/注意事项） |
| `docs/public/autospark.alert.js` | 构建产物（IIFE 闭包，9.8 kB / gzip 3.36 kB） |

### 修改（7）

| 文件 | 说明 |
| --- | --- |
| `packages/plugins/src/index.ts` | 聚合入口追加 alert 副作用导入（注释同步） |
| `packages/plugins/vite.config.ts` | CLOSURE_ARTIFACTS 登记 alert 产物；build:demo 多入口追加 alert 页 |
| `packages/plugins/demo/index.html` | 组件树登记 alert 项 |
| `packages/plugins/readme.md` | 插件清单表追加 alert 行 |
| `packages/plugins/CONTEXT.md` | 组件型形态词条补 alert |
| `docs/.vitepress/config/index.ts` | 侧边栏新增「组件插件」分组，登记 autospark.alert 警告条 |
| `docs/public/autospark.plugins.js` | 聚合产物重建（现含 alert 组件） |

## 关键决策点

1. **化身路径根绑定约束（T4=B）**：组件快照根上的动态绑定不求值（字面泄漏）——模板根只带静态 `class="asc-alert"`；语义色 `:data-type` 与收起 `:data-hidden` 标记全部落在内层 body 元素，经 `:has()` 选择器驱动宿主外观与隐藏（button 样板同款手法）。
2. **收起不留空盒**：`x-show` 藏 body + `data-hidden` 标记经 `.asc-alert:has(> .asc-alert-body[data-hidden])` 藏宿主整块，双保险。
3. **重新显示通道**：内部 `closed` 标记 + `open` 受控键解耦——`open` 转 true（watch 复位 closed）实现重显，兼容「父状态直接控制显隐」与「@close 同步后一键重显」两种用法；非受控用法重显须重挂（文档已注明）。
4. **图标三态**：`true`/缺省按 type 映射语义图标（warning→warn、danger→error 对齐 engine 内置图标名），mounted 内 watch(type/icon) 同步 `iconName` 保持响应式；`x-icon="iconName || ''"` 空串守卫避开 x-icon 裸标识符空值回退字面量的 warn 陷阱。
5. **closable 缺省 false**：警告条是常驻内容，关闭是显式交互授权（主流 alert 组件语义；与 notifications 的 closeable 常显约定不同，文档已对照说明）。
6. **close 事件**：`this.emit("close")`（ADR-0117 组件事件发射，冒泡）；监听写组件外包裹元素（封闭域，宿主表达式见不到外层状态）。
7. **视觉语言**：语义描边 `color-mix(accent 45%)` + 8% 浅色底（notification 样板的 color-mix 混底手法 + 更柔和的横幅描边），`--asc-alert-mix-bg` 中转变量暗色只改一处。

## 构建与验证

- `bun install`（worktree 无 node_modules）✅
- `cd packages/plugins && bun run build` ✅ —— 全部 9 个闭包产物构建成功，`Alert plugin Gzipped size: 3.36 kB`，复制 `docs/public/autospark.alert.js` ✅
- `bun run build:demo` ✅（先构建 engine IIFE 后通过；alert.html 3.99 kB 页面产物）
- `bun test src/__tests__/components/` ✅ —— 12 pass / 0 fail（alert 6 例 + 既有 button/installPlugin 6 例）
- `oxlint packages/plugins/src/components/alert/` ✅ 0 警告 0 错误（oxfmt 本环境不可用，格式手工对齐周边）
- **浏览器端到端验证** ✅（Bun.serve + Playwright 实测构建产物）：四语义色 computed 边框/底色正确、宿主属性无绑定字面泄漏、closable=false 关闭钮隐藏、点 × 宿主 display:none 且 data-hidden 置位、父状态重显后 data-hidden 移除、响应式 type 切换边框 info→danger + 图标 #as-info→#as-error 联动。多行 props 形态由测试用例覆盖（open 受控用例即多行 props）。

### 说明

- 未纳入 outputs 的构建伴生变更：`docs/public/` 下 button/ripple/spin/tree/version/layout/notifications 及引擎 `autospark.js` 等产物因全量构建被重写（含基线既有改动与重建抖动，非本特性语义变更，均未复制）；`packages/plugins/dist*` 为 gitignore 构建输出（dist-demo 验证后已清理）。
- 文档站未整体 `bun run build`（vitepress 全量构建耗时长）；侧边栏登记为纯配置追加，demo 引用与文档链接目标均已核对存在。
