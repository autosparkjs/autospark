# ADR-0008：渲染器管线与 raw 旁路通道

- **状态**：Accepted
- **日期**：2026-10-15
- **关联**：[CONTEXT.md](../../CONTEXT.md)（渲染器 / raw 标记 / raw 视图 / 渲染器选择链）、[ADR-0002](0002-engine-render-pipeline.md)（engine 渲染管线）、[ADR-0003](0003-outlet-props-keepalive-mode.md)（出口组件数据域）

## 背景

渲染器框架此前只有骨架：`AutoSparkRouterViewRendererBase`（`test` + `render`）与单一 HTML 渲染器（`test()` 恒真兜底），`json.ts` / `image.ts` 为空壳（且 json.ts 类名错写为 `AutoSparkRouterImageViewRenderer`）、`markdown.ts` 纯空文件。渲染器选择只有「路由级显式 `view.renderer` > 自定义 `renderers` 的 `test()` > HTML 兜底」一条链，没有按文件格式的默认判定，也没有渲染失败后的降级。所有视图内容一律经 outlet 的 `x-html.compile` 编译激活——对纯静态内容（第三方导出页、图片、JSON 数据文件）而言编译成本纯浪费。

## 决策

1. **渲染器选择链**（fetch 后的 `onResponse` 内，优先级从高到低）：
   1. 路由级显式 `view.renderer`（`_viewOptions.renderer`，既有能力）
   2. 全局 `options.getRenderer(ctx)`——**同步**函数，返回**渲染器**而非渲染结果；返回值三形态：渲染器实例 / 裸渲染函数（`AutoSparkRendererRenderFn`，内部适配为 `test()` 恒 false 的轻量渲染器，不参与自动探测）/ `undefined | null`（不接管，落回默认链）；抛异常 = warn 后视为未接管。`ctx = { url, matched, response }`，`url` 为插值 + base 前缀 + 剥除 raw 标记后的最终视图 URL
   3. `options.renderers` 自定义渲染器逐个 `test()`
   4. 内置格式判定——实现为四个内置渲染器按固定顺序的 `test()`，追加在自定义渲染器之后：**Raw**（raw 标记）→ **Json**（`.json` 扩展名）→ **Image**（图片扩展名）→ **Template**（`.html`/`.htm` 及其余一切，`test()` 恒真兜底）

2. **四个内置渲染器**（均继承 `AutoSparkRouterViewRendererBase`，从包入口导出，可显式实例化注册）：
   - **Template**（`AutoSparkTemplateViewRenderer`，原 `AutoSparkRouterHTMLViewRenderer` 重命名，包未发布无兼容负担）：DOMParser 解析 + x-outlet 简写改写 + selector 提取 → 产物经 engine 编译全响应式
   - **Raw**（`AutoSparkRawViewRenderer`）：零加工，响应体原样字符串，`meta.raw = true`
   - **Json**（`AutoSparkJsonViewRenderer`）：`<pre>` 内 pretty-print（2 格缩进、HTML 转义、零依赖；解析失败按渲染失败处理）
   - **Image**（`AutoSparkImageViewRenderer`）：`<img src="最终URL">`，忽略响应体；扩展名 `png jpg jpeg gif webp svg bmp ico avif`（svg 亦按 image 处理）；仍 fetch 以校验存在性

3. **raw 标记**：视图 URL 查询串存在 `raw` 或 `.raw` 键（`?raw` / `?.raw` 等价，不限参数值、不限扩展名）即 raw，优先于一切格式判定；fetch 前**剥除**标记键（服务器收到干净 URL）；检测基于路由声明的视图源字符串。

4. **两级降级兜底链**：选中渲染器 `render()` 抛异常或返回 `{error}` → 先试 **Template** 渲染 → Template 也失败 → **Raw 通道**（innerHTML 直挂原样输出）；全链失败落既有错误页。约束：fetch 本身失败（404/网络错/超时）不触发兜底（无内容可降级）；兜底链去重、每个渲染器至多尝试一次、每次降级记 warn；原始文本经预克隆的 response 获取（首次渲染已消费 body）。

5. **raw 旁路通道**（outlet 组件内实现，engine 零改动）：`meta.raw` 随视图载荷贯通至 outlet 数据域（视图条目 / 临时槽带 `raw` 标志）；outlet 模板对 raw 条目用普通 `x-html`（innerHTML 直挂，不编译）渲染，非 raw 条目维持 `x-html.compile`。keepAlive / tabs 语义不变——raw 视图同样进视图清单、同样 DOM 常驻复用，仅内容不编译。

6. **raw 视图四条边界**（文档化）：(a) 跳过路由数据注入（`autospark/data` script 对不编译的内容永不消费）；(b) `selector` 选项无效（raw 不做 HTML 加工）；(c) 内容中 `<script>` 不执行（innerHTML 浏览器限制，与编译通道一致）；(d) 内容中 x-outlet 不激活——嵌套路由在 raw 视图下不可用，子层按「出口回退」（ADR-0005）挂到上一层出口。

## 后果

- 纯静态内容（raw / json / image）绕过 engine 编译，消除不必要的编译成本；raw 的动机是**性能**而非安全隔离（无 sanitize，不受信内容需应用层自行处理）。
- outlet 模板每个视图容器变为双分支（compile / 非 compile 各一，`x-show` 互斥），视图条目与临时槽数据域增加 `raw` 字段。
- `renderers/types.ts` 的 `ViewRenderOptions` 增加 `url`（最终视图 URL），baseLoader 新增 `prepareFetchUrl` 钩子供 ViewLoader 剥除 raw 标记。
- 空壳清理：`markdown.ts` 删除（需求外存目）；`json.ts` 类名错误修复。
- 导出面新增：四个内置渲染器类 + `RendererGetter` + `AutoSparkRendererContext` + `AutoSparkRendererRenderFn` 类型。

## 修订（2026-10-15，设计评审后）

**变更 1：raw 指定方式由查询键标记改为 URL `!` 前缀。**
原 `?raw` / `?.raw` 查询键方案与业务 query 冲突——形如 `/a/b/?count=1` 的 URL 已占用查询串，
追加 raw 标记会与业务参数争抢键空间、产生歧义。改为 URL `!` 前缀（`!/path/page.html`）：
fetch 前剥除（在插值与 base 拼接之前，避免前缀被当作路径字符）、强制 raw 渲染，
**优先级最高**（高于路由级显式渲染器）。

**变更 2：移除内置格式判定链与 `options.getRenderer`。**
`.json` / 图片扩展名的自动格式判定取消，`getRenderer` 上下文钩子取消。渲染器选择链收敛为：

1. URL `!` 前缀 → 强制 raw 渲染（最高优先级）
2. 路由级显式 `view.renderer`
3. `options.renderers` 自定义渲染器逐个 `test()`（注册顺序即探测顺序）
4. 模板渲染器兜底（`test()` 恒真）

**后续影响**：
- Json / Image 渲染器类**保留导出**，降级为可选注册的内置渲染器——用户显式加入
  `options.renderers` 后按 `test()`（扩展名探测）生效；不再自动接管。
- 裸渲染函数适配器（`AutoSparkRouterFnViewRenderer` / `normalizeRenderer`）与
  `AutoSparkRendererGetter` / `AutoSparkRendererContext` / `AutoSparkRendererRenderFn`
  类型随 `getRenderer` 一并移除。
- raw 标记工具迁移：`utils/rawMarker.ts` → `utils/rawPrefix.ts`
  （`hasRawMarker`/`stripRawMarker` → `hasRawPrefix`/`stripRawPrefix`）。

其余决策（两级降级链、raw 旁路通道、四条边界、导出面）不变。
