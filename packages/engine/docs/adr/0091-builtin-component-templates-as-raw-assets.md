# ADR-0091：内置组件模板迁移为 `?raw` 静态资源

- 状态：已采纳
- 日期：2026-10-08
- 关联：ADR-0022（组件字符串形态）、ADR-0062（overlay shell）、ADR-0088/0089（消息域组件化）

## 背景

内置组件（消息 type 族 / base / actions / 消息 shell / panel-shell / drawer-shell / 内置 error）的模板以
TS 模板字符串常量（`export const XXX_TEMPLATE = \`...\``）存放于源码。顶格爬行式排版是字符串精确性的
妥协：IDE 无 HTML/CSS 语法高亮、无格式化、无校验，编辑体验差且易误改。

## 决策

模板迁移为**同目录同名静态资源文件** + Vite 风格 `?raw` 后缀导入：

- `task.ts` → `task.html`，`shell.ts` → `shell.html` + `shell.css`，以此类推；共 9 个 HTML 模板 + 2 个 CSS 样式表；
- `.ts` 保留并以 `export { default as XXX_TEMPLATE } from "./xxx.html?raw"` re-export——**常量名与导出面零改动**，
  下游（presets.ts / engine.ts / wrappers/index.ts / styles.ts）与测试引用不受影响；
- 组件契约注释（约定键、ADR 回链、设计意图）留在 `.ts` 导出行上方（IDE hover 可见）；`.html` 顶部仅放
  一行 HTML 注释指回所属 ts——契约属于导出面，模板文件保持纯净；
- `.html` 内容按正常 HTML 缩进重排（IDE 友好是本次改造初衷）；含文本内容的行内元素（button/span/a）
  文本保持紧凑不拆行，避免 textContent 引入换行空白。

### 运行链支持矩阵（决策依据）

| 运行链 | `?raw` 后缀 | 裸 `.html` 导入 |
| --- | --- | --- |
| Bun 运行时（bun test） | ✅ 原生 → `string` | ❌ 返回 `HTMLBundle` 对象（非内容） |
| Vite（VitePress 自身管线） | ✅ 原生 | ✅（text loader） |
| esbuild（tsup 构建 / docs dev 的 esbuild watch） | ❌ 不识别 query，需插件 | ✅ `loader: {'.html':'text'}` |

`?raw` 是唯一三方交集方案。裸 `.html` 导入 + esbuild loader 在 bun test 下全线返回 `HTMLBundle`
（实测），直接否决。esbuild 两条链（tsup 三格式产物构建、docs 开发期 `docs/.vitepress/config/index.ts`
的 esbuild watch——它直接构建 engine 源码现场伺服 `/autospark/autospark.js`）由**共享插件**
`packages/engine/scripts/esbuild-raw-assets.ts` 补齐：`onResolve` 截获 `?raw` 导入符剥后缀转入专用
namespace，`onLoad` 读文件以 text loader 内联。两处 import 同一份插件，保证行为强一致（各自内联会漂移）。

TypeScript 侧新增 `src/raw-assets.d.ts`（`declare module "*.html?raw" / "*.css?raw"`，default string）——
本仓库不依赖 vite/client，声明自持。

## 备选与否决理由

- **维持模板字符串**：IDE 收益归零，改造动机落空。
- **裸 `.html` 导入 + esbuild `loader: {'.html': 'text'}`**：零插件，但 Bun 运行时对裸 `.html` 返回
  `HTMLBundle` 对象而非字符串（实测），bun test 全挂；除非再为 Bun 配 loader 兜底，链路复杂化。
- **拆 `.d.ts` + 构建期代码生成**：过度设计（YAGNI），?raw 已是各链原生或近原生能力。

## 约束与后果

- **drawer 的 `DRAWER_SHELL_STYLES` 不迁移**：其内嵌 `${buildSlideRules()}` 运行时插值（四方向滑入
  动画规则生成），本质是动态 CSS 而非静态资产——留在 TS。静态的拆、动态的留（混态但诚实）。
- 注入函数内部的小段样式常量（messages/styles.ts 的 COLUMN_STYLES、tooltip、icons 基础样式表）不在
  本次范围——它们不是组件模板，收益低（YAGNI）。
- **模板改动以归一化校验兜底**：改造时用「原字符串 vs 新文件去除全部空白与注释后逐字符 diff」脚本验证
  11 对资产一致（该方法可复用于后续模板维护，防止重排引入拼写/结构漂移）。
- `.html` / `.css` 为**源码资产**： consumers 经产物（模板已内联）消费，无需随包分发资源文件；
  tsup `noExternal` 打包策略不受影响（?raw 在构建期已内联为字符串）。
