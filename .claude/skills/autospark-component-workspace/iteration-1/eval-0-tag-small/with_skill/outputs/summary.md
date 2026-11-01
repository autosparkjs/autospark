# tag 组件实施总结

## 实施摘要

按 autospark-component skill 工作流（先读 SKILL.md + template-anatomy / theme-vars / registration 三参考）给 `@autospark/plugins` 新增 **autospark.tag 标签组件**：用于列表、卡片状态标记的小体量行内标签。规模判定为**小型组件**（纯展示 + closable 点击移除，无浮层/注入/尺寸响应信号），照 button 样板两文件自包含落地，IIFE 产物 `autospark.tag.js`（gzip 3.01 kB），五处登记面齐全，另补了组件测试（对照 button-plugin.test.ts 先例）。

功能面：

- **type 语义色六变体**：default / primary / success / danger / warning / info
- **size 三档**：sm / md / lg（md 即基础样式；档位直取 `--x-font-size-*` 标尺 + 字面值兜底）
- **closable 可关闭**：内层 `×` 按钮经 `x-show="closable"` 显隐（点击走 `methods.close()` → `this.el.remove()` 从 DOM 移除化身宿主）

## 文件清单

**新增（6 个源文件 + 1 个构建产物）**：

| 文件 | 说明 |
| --- | --- |
| `packages/plugins/src/components/tag/index.ts` | 插件入口：installPlugin 自举 + captureNamespace，注册 `autospark.components["autospark.tag"]` |
| `packages/plugins/src/components/tag/tag.html` | 组件模板：`x-define` + `<script setup>`（data/methods）+ `<style global id="autospark-components-tag">` |
| `packages/plugins/src/__tests__/components/tag-plugin.test.ts` | 5 用例：注册 / 化身渲染（T4=B）/ 插槽优先 / closable 显隐 / 点击移除 |
| `docs/demos/components/tag/basic.html` | demo：基础用法 + 六语义色 + 列表场景（引主题 css） |
| `docs/demos/components/tag/variants.html` | demo：三档尺寸 + closable 交互 + data-dark 暗色块（不引主题 css，演示兜底形态） |
| `docs/zh/components/tag.md` | 中文文档：props 表 / demo 嵌入 / 暗色双路径 / 主题化变量清单与覆盖通道 |
| `docs/public/autospark.tag.js` | 构建自动复制的 IIFE 产物（非手写） |

**修改（3 个既有文件）**：

| 文件 | 改动 |
| --- | --- |
| `packages/plugins/vite.config.ts` | `CLOSURE_ARTIFACTS` 末尾追加 tag 产物项 |
| `packages/plugins/src/index.ts` | 聚合入口追加 `import "./components/tag/index"` + 头部注释清单更新 |
| `docs/.vitepress/config/index.ts` | sidebar 新增 `"/zh/components/"` 键（含「Tag 标签」条目） |

## 关键决策点

1. **小型形态**：closable 只是「点击移除 DOM」轻交互，不构成大型信号（无浮层/样式注入/尺寸响应/多子组件），不拆 bootstrap/types。
2. **tinted 语义色（而非实底白字）**：tag 是状态标记，采用「accent 中转变量 + `color-mix` 调浅底/边 + accent 本色文字」（notification-shell 先例），与 button 的实底白字形成组件角色分野；`color-mix` 在插件包与 theme 包均有先例。
3. **closable 用 x-show 不用 x-if**：规避「共享快照 templateScopeMap 串台」已知缺陷（多实例 + x-if 组合）；且 tag 场景天然多实例同屏。
4. **`methods.close()` 而非模板表达式**：`@click="close()"` 走 getMethod 组件方法查找（仅标识符调用形态支持，task.html 注释确认）；`this.el.remove()` 直摘化身宿主。
5. **variants demo 不引主题 css**：静态 `autospark-theme.css` 现状不含 `--auto-*` 派生变量（旧版产物），引了也展示不出主题化；不引可让暗色块吃 `[data-dark]` 兜底变体获得真实暗色对比。basic demo 仍按 skill 骨架引上（向前兼容）。
6. **尺寸取 `var(--x-font-size-*, 字面值)`**：主题在场吃标尺、不在场字面兜底，兼顾 skill 红线与独立可用性。

## skill 评价

**最有用**：

- 「化身路径约束（T4=B）」红线——变体绑定落内层插槽出口 + `:has()` 驱动宿主 + 原生属性 mounted 同步，直接决定了模板结构，这是不看 skill 最容易犯的错；
- 登记面五处清单 + registration.md 的精确模板（含 VitePress 陷阱：demo 路径不带开头斜杠、行内 code 花括号）；
- theme-vars 的三级回退链写法与暗色兜底「只切兜底字面值、变量链不变」原则。

**最缺 / 与现状偏差**：

- registration.md 称顶栏 nav「已有组件入口指向 /zh/components/，无需另动」——现状 nav 无组件入口（「插件」入口指向的 `/zh/plugins/` 目录本身也不存在，属既有死链）。本次未动 nav（超任务范围），sidebar 键按 skill「尚不存在则创建」处理。
- skill 称 demo 默认引 `autospark-theme.css`「展示主题化效果」——现状该静态产物不含 `--auto-*` 派生变量（theme 已转向 `autospark.theme.js` 运行时主题），引了组件实际吃兜底链。以现状为准，demo 保留引用但主题化展示不成立（总结于此注明）。
- skill 未提组件测试样板（button 有 `button-plugin.test.ts` 先例但 registration 五处不含测试）；本次自行对照补齐。
- 聚合入口现状只挂 4 插件（tree/version/layout 不在 `src/index.ts`，与 CLOSURE_ARTIFACTS 不同步）——非本任务范围未动。

## 构建与验证

| 项 | 结果 |
| --- | --- |
| `bun install`（worktree 无 node_modules） | 成功，335 包，43.5s |
| `cd packages/plugins && bun run build` | 成功，`Tag plugin Gzipped size: 3.01 kB`，产物已复制 `docs/public/autospark.tag.js` |
| `bun test src/__tests__/components/tag-plugin.test.ts` | 5 pass / 0 fail |
| 浏览器端到端（Bun.serve 挂 docs/demos + docs/public + Playwright） | 全部通过 |

端到端验证明细：basic 页 12 个 tag 渲染，六 type 色值/兜底链正确；variants 页 sm/md/lg 字号 12/13/16px 与 padding 梯度正确，closable 按钮显隐正确（flex/none），点击 × 后 tag 数 17→16 且宿主脱离 DOM；`data-dark` 块内 default 变白字深底（#fafafa / rgba(129,129,129,0.45)）、primary accent 切暗色提亮版 #56baff——暗色兜底变体真实生效。
