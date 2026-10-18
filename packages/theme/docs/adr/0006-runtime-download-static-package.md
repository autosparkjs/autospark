# 运行时 download() 同源导出合规静态主题包

ADR-0004/0005 确立了静态主题包的完整契约：指纹头（v2 15 字段）+ 三块样式 + 维度烘焙守卫块，且物理上只有 `generateStaticThemeCss` 一条组装路径。但运行时 `ThemeScope.download()`——宣称「把当前主题下载为 .css，可作静态主题包使用」——走的是 `toStyles()` 这块**第二组装路径**：产物无指纹头、无守卫块，块顺序（base→semantics→colors）与静态包（base→colors→semantics）字节不一致。后果是下载产物挂 `<link>` 后运行时读不到指纹，`_satisfiedByStaticLayer` 直接返回 false——不跳过注入、连失配告警都没有，「静态包」之名完全落空；且第二条路径不受 golden 快照与同源断言保护，漂移无兜底。本决策让 download 回归同源：**root 作用域的下载产物即合规静态主题包**。

## 机制

- **组装函数下沉，消灭入口分叉**：「指纹 + 三块 + 守卫块」的组装抽为不依赖 scope 的纯函数模块 `utils/staticThemeCss.ts`（`assembleStaticThemeCss` + `bakeDimensionGuards`）。`generateStaticTheme.ts` 不能反向被 scope.ts import（它 import scope，循环引用——文件头既有约束），故 CLI 与运行时共用的是**组装函数**而非生成器入口：CLI 路径 `generateStaticThemeCss` = 新建非 connect root scope 的 `toStyles()` 交给组装；运行时路径 `ThemeScope._resolveDownloadCss()`（root 分支）= 自身 `toStyles()` 交给同一个组装。两条产物逐字节一致，由 static-theme.test.ts 的 ADR-0006 用例断言。
- **烘焙维度取下载时刻归一 options**：`_resolveDownloadCss` 直接把 `this.options`（`Required<ThemeOptions>`，构造归一 + 水合 + setter 切换后的当前生效值）传给组装函数——「下载的就是我现在看到的」，含当前维度烘焙与指纹维度字段；首访采纳、显式化配套等链路复用 ADR-0005 既有机制，无新增状态。
- **非 root 降级快照并告警**：静态层契约只服务 root（ADR-0004 同一边界），局部作用域产物挂 `<link>` 永远不会被指纹识别。非 root 分支 `console.warn` 一次（文案注明「作用域样式快照，不可作静态主题包」）后仍导出 `toStyles()`——不破坏既有 API 行为，防误用。
- **产物选择器恒 `:host,:root`**（root 分支）：静态包契约固定选择器，不追随 root scope 的自定义 `cssSelector`——与 CLI 产物对齐，指纹契约才有意义。
- **API 二合一**：`toStyles()` 与 `generate()` 本是近重复的双公开方法（文档自己都得写「同 toStyles 但带注释分段」），是第二路径得以存在的温床。保留 `generate()` 的字节形态（base → colors → semantics 带 `/* colors */` / `/* Semantic Colors */` 分段注释——同源断言与 golden 锚定它），名字留引用面更大的 `toStyles`，删除 `generate()`——公开 API 零破坏。
- **顺手修纯缺陷**：下载文件名 `autoaprkd_` typo 改 `autospark_${id}.css`，MIME `text/plain` 改 `text/css`。

## Considered Options

- **download 维持快照语义，只修 typo/MIME**：「可作静态主题包」的宣称继续落空，无指纹产物挂 link 后静默冗余（动态注入后胜出盖住它，正确性无损但首帧目的完全达不到）——名不副实比没有此 API 更糟。
- **双模式（`download()` 快照 / `download({static:true})` 合规包）**：同一方法两种产物语义，调用方必须先理解静态包契约才能选对参数；而 root 快照形态无任何独有场景（要快照有 `toStyles()`），双形态只增加认知负担与文档篇幅。
- **scope.ts 直接 import `generateStaticThemeCss`**：语义最直白，但构成 scope ↔ generateStaticTheme 循环引用（后者 import scope 构造内部 scope）。ESM 运行期可解（两处调用都延迟到函数体），但打包器对循环依赖的处理是脆弱点；组装函数下沉后两边都是单向依赖，物理无环。
- **保留 `toStyles` 字节形态（base→semantics→colors）让静态包迁就它**：golden 快照、同源断言、CLI 产物全部锚定 `generate()` 形态，撬动面大一个数量级；且 connect 注入顺序本就是 base → colors → semantics，`generate()` 形态才是与运行时一致的形态。
- **非 root download 拒绝导出（throw/return）**：局部快照本身有合法用途（SSR 取数、调试），既有 API 行为不应因「不能作静态包」而破坏；warn 足够传达边界。

## 附：遗留边界

- root scope 经 `manager.root` 以外途径自定义了 `cssSelector` 时，下载产物仍按契约输出 `:host,:root`（见上机制）；该场景实质是「拿 root id 做非标准事」，不专门支持。
- `docs/public/autospark-theme.js` 是文档站内置旧版产物副本，随下次文档站构建自然更新，本轮不手改。
