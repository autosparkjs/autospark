# ADR-0046：x-icon / x-icon-define 图标指令（CSS mask 方案 + 全局图标注册表）

- **状态**：Accepted（grill-with-docs，四轮二十二问）
- **日期**：2026-09-19
- **关联**：[ADR-0022](0022-x-component.md)（声明性资源 collector 剪枝先例）、[ADR-0007](0007-directive-options-and-modifiers.md)（`x-icon-options` 配置形态）、[ADR-0036](0036-action-descriptor-metadata.md)（ActionDesc.icon 元数据键——未来消费方，不在本 ADR 范围）、[ADR-0047](0047-x-icon-async-source.md)（x-icon 远程物种：Iconify API 异步图标源）、[CONTEXT.md](../../CONTEXT.md)（「图标层」词条）

## 背景

需求：模板内声明式定义 SVG 图标，`x-icon` 按名渲染。用户原始提案：`<template name="名" x-icon-define="svg 数据"/>`（SVG 放指令值、名称放 name 属性）+ base64 data URL + `--as-icon-icon-*` 变量 + `.as-icon.<名>` mask 规则 + 默认 `stroke=currentColor`/`strokeWidth=1.25`。

拷问暴露的接缝：① SVG 放属性值的转义地狱与名称载体选择；② 注册表归属（全局 vs engine 实例）；③ mask 的颜色模型（data URL 内 currentColor 无页面 CSS 继承、mask 只取 alpha 通道）；④ 每实例 strokeWidth 与「定义期烘焙进 data URL」的矛盾；⑤ fill 型 / stroke 型图标共存；⑥ base64 vs URL 编码；⑦ 动态注册/移除与已渲染实例的联动；⑧ 未命中姿态。

## 决策

### 1. 定义 API 与实现通道：template 内容装 SVG、指令值装名、collector 剪枝

`<template x-icon-define="名称"><svg>…</svg></template>`——名称走指令值（对齐 x-component：`compiler._collectComponent` 读 `x-component` 值的先例），SVG 走 template 内容（浏览器原生不渲染 template 内容，是零转义的天然容器）。compiler 前置 collector 拦截：取**首个 `<svg>` 子元素** → 上交图标注册表 → 剪枝（不进结果 DOM）；`IconDefineDirective` 类仅为一等名位（永不被实例化，x-component 同构）。无 svg 子元素 warn + 跳过；svg 之外的多余根节点 warn 但仍取首个 svg。动态区域（x-for 项模板 / x-html.compile / 组件快照）内的定义幂等重注册，无害（见决策 10 的 warn 去重）。

### 2. 全局图标注册表：IconRegistry extends Set

模块级单例，`AutoSpark.icons` 静态暴露，document 级多 engine 共享（注入的样式表天然 document 级，engine 实例隔离是假隔离）。

- `add(name, svg)` 双参注册（显式扩展 Set 契约——单值无法携带 SVG）；
- 移除**仅 `delete`**（Set 原生契约；`remove` 别名否决——不为同义双名扩面），删除不存在的名称静默返回 `false`；
- 遍历产出**名称字符串**（SVG 数据不外露，规范形与 URL 缓存是内部细节）；
- `engine.destroy()` 不清理注册表与样式表（对齐基类 `dispose` 不移除 document 级共享资源的先例，`base.ts`）。

### 3. 声明入口三通道

模板 `x-icon-define` / 编程 `AutoSpark.icons.add(name, svg)` / 构造 `options.icons` 种子（`Record<名称, svg>`，构造期并入全局注册表，同名 warn + 覆盖）。对齐 actions 三入口惯例；种子先于编译期模板定义生效，模板同名者后到覆盖。

### 4. 规范形 SVG：strip 全部 stroke-width、缺省才补 stroke / xmlns

注册表存储归一化形态：移除 root `<svg>` 及**所有后代元素**的 `stroke-width` 属性；root 缺 `stroke` 属性才补 `currentColor`、缺 `xmlns` 才补 `http://www.w3.org/2000/svg`（作者显式属性不动——fill 型图标（Material/FontAwesome 风）自带 `fill="currentColor"` 不被破坏）。**xmlns 是 data URL 的硬约束**：mask 引用的 SVG 按 XML 图像解析，缺声明直接解析失败 → mask 无图 → 图标隐形（实现期实测踩坑）；inline HTML 中浏览器自动归 SVG 命名空间故模板无需手写，但 `outerHTML` 序列化**不会**补上——规范形统一补齐。字符串级处理 root 标签，不 DOMParser。生效 strokeWidth 是**渲染参数而非图标数据**，渲染期注入 root（「宽度不是图标的一部分」）。多笔画故意异宽的图标失去表现力，为已知限制（文档化 caveat）。

### 5. URL 工厂：(名称, strokeWidth) 缓存 + encodeURIComponent

`规范形 SVG + 生效 strokeWidth → data:image/svg+xml,${encodeURIComponent(svg)}`，按 `(名称, sw)` 缓存——同一组合全页只编码一次，回应「数据重复」关切：重复的只是缓存条目，注册表只存一份规范形。base64 否决：体积 +33%，且 btoa 无法直接处理非 Latin1 字符（含中文的 SVG 抛错，需 utf8 中转 hack）。

### 6. 样式下发：惰性建表 + 全量重生成

首次注册时惰性创建 `<style id="autospark-icons">`（`typeof document` 守卫，SSR 安全；幂等）。每图标两条规则：

```css
:root { --as-icon-<名>: url("<默认 sw=1.25 的工厂产物>"); }
.as-icon.<名> { -webkit-mask-image: var(--as-icon-<名>); mask-image: var(--as-icon-<名>); }
```

注册表任一变更（add/delete）全量重生成 `textContent`（图标量级小，O(n) 字符串拼接可忽略，且天然正确处理覆盖与移除）。修正用户原案三处：变量名统一 `--as-icon-<名>`（原案引用侧多了 icon 段）；裸名类保留（复合选择器 `.as-icon.<名>` 把作用域自限在图标元素上，残余同名冲突文档化为 caveat）；`-moz-mask-image` 不存在（Firefox 53+ 支持无前缀，只写 `-webkit-` + 标准两条）。基础规则另内置**排版免疫**：`box-sizing:content-box`（免疫全局 border-box reset，size=图形区 / padding 恒为外补、总占位 size+2×padding）、`flex:none`（flex 行内不伸不缩——flex-shrink 默认 1 且空内容 min-width:auto=0，挤压即变形）；显式宽高天然免疫 grid/flex 项默认 stretch（只作用于 auto 尺寸）。

### 7. 渲染指令 IconDirective：颜色主权在宿主（配置四级链）

配置读取四级链：**指令选项（`x-icon-options`）> 宿主选项（`x-options`，ADR-0007 回退）> 全局默认（`AutoSpark.icons.options`，实现期增补）> 内置默认**（1em / sw 1.25 / currentColor / 无 padding）——指令级键级覆盖（声明 size 不影响全局 color 继续生效）。全局 `strokeWidth` 是**生效默认**：参与本地 `:root` 变量与远程属性规则的烘焙（默认路径始终共享规则零内联，仅指令级覆盖才内联）；全局配置**整体赋值**（setter）重建样式表、清空远程规则表重升格、广播 `options` 变更重渲染已渲染实例（深修改不广播，文档化——主题切换走整体赋值）。选项静态样式每次渲染对称写/清（全局变更可回收旧内联值）。

kind=Compile、priority=0、singleton。输出：`class` 追加 `as-icon <名>`（合并不清空宿主已有类）+ 内联 `width`/`height`（size 选项，默认 `1em`，数字 → `Npx`、字符串直传；padding 默认 0 同规则）。

**颜色模型**：mask 只取 alpha 通道，data URL 内的 `currentColor` 解析为黑（SVG-as-image 无页面 CSS 继承）——实际颜色 = 宿主 `background-color`。`.as-icon` 基础规则：`display:inline-block; background-color:currentColor` + mask 三件套（`mask-size:contain; mask-repeat:no-repeat; mask-position:center` 及 `-webkit-` 镜像）。`color` 选项 → 内联 `background-color` 覆盖。

值为响应式表达式（纯标识符路径走精准订阅，对齐 x-text），切换时摘旧名类、挂新名类。**值两栖（实现期补充决策）**：裸图标名 / 远程形不是合法 JS 表达式（`close` 求值 undefined、`mdi/home` 是除法得 NaN、`mdi:home` 抛标签语法错）——求值抛错时原值作字面量；求值为空（null/undefined/NaN/""）时原值**形匹配**（图标名/远程形）才回退字面量（`state.icon` 之类含点形态不回退、维持空占位，避免误导性未注册 warn）；状态命中优先，字面量只是空值兜底。**非默认 strokeWidth**：实例内联 `style.mask-image = url(工厂产物)` 覆盖类规则（变体 CSS 变量方案否决——custom property 名不含 `.`，`1.25→1_25` 编码丑且样式表膨胀）。

### 8. 未命中姿态：默认图标替换（统一未注册与已删除）

未命中（未注册或已删除）→ warn + 渲染**内置默认图标**（保留尺寸，「缺图不破相」）。内置图标以条目 `default` 驻注册表，用户可同名覆盖自定义；`delete("default")` 后未命中退回空占位（默认图标的兜底）。grilling 早期裁决「未注册 → 空占位」由本决策**统一取代**——未注册与已删除同姿态，避免「从未存在」与「已被删除」呈现不一致。

### 9. 动态联动：变更通知唤醒待决实例

注册表发变更通知；x-icon 实例处于未命中态时登记待决表，`add` 后按 name 精准唤醒重试（默认图标 → 真图标），`delete` 后使用中实例回退默认图标。「先渲染后注册」合法——引擎的响应式立身之本延伸到资源注册。

### 10. 名称约束：CSS ident + 保留名 + warn 去重

图标名同时是 CSS 类名与自定义属性名，受 ident 硬约束：`[A-Za-z0-9_-]`、不得以数字开头（`close-2` 合法，`2x`/`箭头.右` 非法）。`as-icon` 保留禁用。非法名 warn + 拒绝注册（转义编码会让 CSS 里的名字与作者所写对不上）。同名覆盖 warn **按 name 去重**（动态区域幂等重注册不刷屏）。

## 被否决的方案

- **SVG 放指令值 / name 属性装名（用户原案）**：属性值内 `"` `<` `>` `&` 全量转义不可手写；名称载体与 x-component 惯例相悖。→ template 内容 + 指令值（决策 1）。
- **engine 实例注册表**：样式表 document 级跨 engine 共享，实例隔离是假隔离。→ 全局注册表（决策 2）。
- **base64 编码**：体积 +33%、btoa Unicode 陷阱。→ encodeURIComponent（决策 5）。
- **强制覆盖 stroke 默认**：fill 型图标被强加描边直接损坏。→ 缺省才注入（决策 4）。
- **DOMParser 规范化**：字符串级注入已足。→ 否决（决策 4）。
- **变体 CSS 变量（`--as-icon-x-sw1_25`）**：custom property 名不含 `.`，编码丑、样式表膨胀。→ 非默认 sw 内联 mask-image（决策 7）。
- **`remove` 别名**：Set 已有 `delete`，同义双名徒增 API 面（用户裁决废除）。→ 仅 `delete`（决策 2）。
- **`options.icons` 不做（YAGNI 提案）**：用户裁决要——三通道对齐 actions 惯例。→ 保留（决策 3）。
- **未命中空占位 / 破坏性抛错**：warn + 默认图标替换 / 拒绝注册更友好且姿态统一。→ 决策 8/10。

## 后果

- ✅ 声明式图标零依赖单包即用；颜色与文字色系统天然一致（currentColor 模型，`color` 级联即换色）。
- ✅ 每实例 strokeWidth 支持且无注册表数据重复（工厂缓存条目级复用）。
- ✅ 动态注册/移除闭环（待决表 + 变更通知），「先渲染后注册」合法。
- 🔴 新增 document 级全局态（注册表 + 样式表）：跨 engine 同名定义后到者胜（warn 可见），属全局资产的既定纪律。
- ⚠️ stroke-width 全 strip：多笔画异宽图标失去表现力（已知限制，文档化）。
- ⚠️ 测试环境（happy-dom 同文件共享 document）：全局注册表跨用例残留，测试需按文件隔离或显式 `delete` 清理。
- ⚠️ 裸名类残余冲突（页面手写 `.as-icon.<名>` 规则撞车）：复合选择器已大幅缓解，接受为文档化 caveat。
