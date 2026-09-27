# ADR-0058：图标机制 symbol 化与图标域（x-icons / x-icon / IconifyJSON 远程源）

- **状态**：Accepted（grill-with-docs，三轮）
- **日期**：2026-09-27
- **关联**：**取代** [ADR-0046](0046-x-icon-directive.md)（渲染机制部分：mask 管线 / 规范形 data URL 侧 / URL 工厂 / 样式下发 / 颜色模型）、[ADR-0047](0047-x-icon-async-source.md)（整体）、[ADR-0048](0048-icon-persistent-cache.md)（整体）；[ADR-0049](0049-x-icon-button.md)（图标按钮——盒模型层机制无关，继续有效）；[ADR-0007](0007-directive-options-and-modifiers.md)（选项体系——带值修饰符的否决依据）；[ADR-0022](0022-x-component.md)（scope 链就近 + 全局兜底查找协议先例）；[CONTEXT.md](../../CONTEXT.md)（「图标层」词条）

## 背景

用户提案：①CSS mask 机制整体更换为 SVG symbol + `<use>`；②`x-icon-define`（单图标）废弃为 `x-icons`（`<template>` 内多个带 id 的 `<svg>` 批量声明）；③图标定义默认 scope 局部（后代就近使用）、`x-icons.global` 全局；④`x-icon` 经 `<use>` 引用 symbol；⑤`x-icons-options` 支持远程批量加载（url / icons / modify，fetch 返回 IconifyJSON 转 symbol）。

拷问暴露的接缝：①`<use href>` 按 id **文档全局解析**——「scope 局部图标」与 DOM 全局解析的张力；②提案示例 `x-icons.icons="save,home"` 是**带值修饰符**，与 ADR-0007「修饰符无值」词条及「位置参数修饰符已废弃」正面冲突；③strokeWidth 在 shadow DOM 中被 presentation attribute 优先级挡住继承的交付通道；④既有 per-icon 远程物种（ADR-0047/0048）与批量 JSON 双协议的存废；⑤异步 fetch 到达序与同名覆盖胜者的确定性；⑥IconifyJSON → symbol 的转换规则（viewBox 合成 / 变换 / aliases / 原名还是后缀名注册）；⑦「加载中」与「未声明」两个未就绪语义的分离；⑧孤立声明（无 scope 祖先）的处置。

## 决策

### 1. symbol 机制与单一 sprite

CSS mask 管线整体下线（data URL / URL 工厂 / `--as-icon-<名>` 变量 / 裸名类规则 / 远程属性选择器规则全删）。替代：**document 级唯一 sprite**——隐藏 `<svg width="0" height="0" style="position:absolute" aria-hidden="true">`，幂等创建；全部 symbol（全局 + 局部）同住其中，靠 id 前缀区分（决策 2）。x-icon 渲染：宿主元素不变（任意元素），注入**唯一子节点** `<svg aria-hidden="true"><use href="#as-…"/></svg>`（撑满宿主）。值两栖（表达式优先、空值形匹配回退字面量）与响应式切换照旧（ADR-0046 决策 7 语义原样迁移）。

### 2. symbol 前缀与解析协议：局部性靠前缀 + 链式查找，非 DOM 隔离

`<use href="#id">` 文档全局解析，scope 局部只能由**id 前缀 + 查找协议**实现：全局 symbol id = `as-{name}`；局部 = `as-i{声明令牌}-{name}`（**实现修订**：初稿为 `as-{scopeId}-{name}`，落地时改为**声明令牌**——见决策 3 的哈希令牌去重；令牌按声明内容哈希生成，克隆同源天然同 token，是「克隆不放大」的实现根基，scopeId 无法跨克隆保持）。x-icon 解析**镜像 getComponent**（ADR-0022）：自身 scope 沿 parent 链就近（内层遮蔽外层）→ 全局注册表兜底。`as-` 为引擎保留前缀（页面手写 svg id 避让）。图标名约束沿用 ADR-0046 决策 10（`[A-Za-z0-9_-]`、非数字开头、`as-icon` 保留）——symbol id 机制下本可放宽，收紧无成本且天然挡住旧远程形 `集/名` 静默误用（斜杠非法 → 求值 NaN → 空占位，对齐「含点路径不回退字面量」先例——**实现修订**：初稿写「未命中 → 默认图标」，落地为空占位：斜杠形是除法表达式求值 NaN，值两栖机制按复杂形态处理维持空占位，不触发误导性未注册 warn）。

### 3. x-icons 批量声明；x-icon-define 硬移除

`<template x-icons>` 内多个带 `id` 的 `<svg>` 子元素，每个收集为一个 symbol。compiler 前置 collector 收集后剪枝（不进结果 DOM），指令类仅一等名位（永不被实例化——x-define / x-icon-define 先例）。**同一声明源模板只收集一次**——**实现修订**：初稿定「按源模板 identity 去重」，但克隆链（x-for 项模板 / 组件快照）不保留源节点引用、标记属性也会被克隆链路洗掉，落地为**内容哈希令牌**：每份声明按「内联内容 + url + modify + 清单」哈希得稳定令牌，局部 symbol id 前缀 `as-i{令牌}-`，跨 scope / 克隆共享同一组 symbol；令牌**引用计数**随收集它的 scope 增减，归零摘 symbol（x-for N 项 = N 份引用、一组 symbol）。x-for 项模板等**克隆链**的直接子声明经 compileOneChild 的 fallback scope 归属（快照根 parentElement 断链的兜底，语义即「最近祖先 scope」）。

`x-icon-define` **硬移除**（用户裁决）：注册表不注册、静默失效，无 warn 无迁移（x-use 先例）；词条进 CONTEXT.md 已废弃清单。

### 4. 图标域：默认 scope 局部、`.global` 全局、孤立静默归全局

非 global 声明归**最近祖先 scope**（任意深度，跨无 scope 的纯容器——x-define 归属同构）；`x-icons.global` ≡ `x-icons-options="{global:true}"`（ADR-0007 修饰符 = 布尔选项快捷写法）。孤立声明（沿链无任何 scope 祖先）**静默归全局**——图标是纯资源无数据视图，x-define 的「warn + 丢弃」惩罚没有必要对齐（用户裁决：归全局、不警告）。

生命周期：局部 symbol **随 scope 销毁回收**（结构指令 detach / engine.destroy 摘除 scope 时按前缀清理）；全局 symbol document 级共享、engine destroy 不清理（ADR-0046 决策 2 先例）。

### 5. 语法载体：值简写 + options 整包；不引入带值修饰符；纯静态

`x-icons="save,home"` 值形态 = `icons` 清单简写（等效 `x-icons-options.icons`）；无值 = 纯内联声明。`url` / `modify` / `global` 走 `x-icons-options` 整包（relaxed-json；**修订追加 `cache`**——TTL 持久缓存键，见决策 8）。提案示例的 `x-icons.icons="..."` 带值修饰符**否决**——与 ADR-0007「修饰符是句点后无参数的开关项」及已废弃的「位置参数修饰符」正面冲突，不为单指令开口子。同一 template 内联 svg 与远程清单**合并**进同一图标域（收集器本就双通道）。**纯静态**：值与 options 编译期一次求值，不 watch、不支持响应式重取（声明性资源，对齐 x-define 冻结快照哲学；响应式清单无真实场景）。

### 6. strokeWidth 交付：规范形哲学延续 + CSS 变量；color 语义迁移

收集期**剥离全部 stroke-width**（「宽度不是图标的一部分，是渲染参数」，ADR-0046 决策 4 原样延续；多笔画异宽限制照旧）；缺 stroke 才补 currentColor（作者显式属性不动）。**xmlns 补齐不再需要**（symbol 住 DOM，不走 data URL 图像解析）。生效宽度经基础规则 `.as-icon{stroke-width:var(--as-icon-sw,1.25)}` 下发，四级配置链（指令 > 宿主 > `AutoSpark.icons.options` > 内置 1.25）算出生效值——与默认一致不内联（零内联纪律），非默认才内联 `--as-icon-sw` 变量。CSS `stroke-width` 是继承属性且收集期已 strip，继承直达 use shadow 内容、覆盖永远可靠（symbol 保留作者宽度的方案否决：presentation attribute 优先级高于宿主继承值，覆盖不可靠）。

`color` 选项语义迁移：`background-color` → **`color`**（currentColor 经 CSS 继承直达 use 内容——mask 时代「data URL 内 currentColor 解析为黑」的间接层消失）。`size` / `padding` / `badge` / `button` / `pointer` 为盒模型层选项，照旧（ADR-0049 不受影响）。

### 7. 注册表 API 收窄：AutoSpark.icons = 图标域的全局兜底层

保留：`add(name, svg)` / `delete` / 遍历产名 / `onChange` 变更通知（miss 唤醒依赖）、构造 `options.icons` 种子（三通道惯例演进为：模板 `x-icons.global` / 编程 add / 构造种子）、`options` 字段（四级链第三级，剩 strokeWidth / size 等渲染参数键；整体赋值广播重渲染纪律照旧）。内部实现换为全局 symbol 注入 / 移除（svg 字符串进，提取 viewBox 与内容生成 `as-{name}`）。**删除**：`baseUrl` / `persist` / `prefetch` / 并发限流（随决策 8 的旧物种连带）。**局部图标无编程入口**（模板 x-icons 是唯一局部通道）。

### 8. 远程源：声明处批量 IconifyJSON（取代 per-icon 物种）

ADR-0047 的 per-icon 远程物种（`x-icon="集/名"` 值形 + `baseUrl/<集>/<名>.svg` 协议）与 ADR-0048 的 localStorage 持久层 / prefetch / 限流**整体移除**——双协议并存意味着双缓存层、双错误姿态、双文档，而「用到才 fetch」的懒加载价值被批量预载 + symbol 晚到自动显形大幅稀释。

新物种：编译期收集即发起 fetch。`x-icons-options`：

- `url`（默认 `https://api.iconify.design/material-symbols-light.json?icons={modify-icons}`，可覆盖——**实现修订**：默认清单占位符用 `{modify-icons}` 而非 `{icons}`：未声明 modify 时二者等价，声明后默认 url 自动取后缀变体（否则 modify 与默认 url 组合取回原名键、解引用落空））；
- `icons`（逗号分隔清单）；
- `modify`（值域 `rounded|sharp|outline|outline-rounded|outline-sharp`，越界 warn + 按无 modify 处理；后缀是否真实存在于目标图标集引擎不校验——拼错走 `not_found`）；
- `cache`（**修订追加**：TTL 持久缓存时长毫秒，正数启用、默认 0——fetch 成功把 IconifyJSON 落 localStorage（键 `autospark:icon-cache:v1:{url}`，条目 `{t, ttl, data}`），TTL 内含跨会话零网络、过期条目读取时即弃、隐私/配额异常静默降级内存缓存；与被否决的「持久缓存延续」差异：声明级 opt-in + TTL 过期即弃，无 LRU / 无全局开关 / 无预取）。

url 插值：`{icons}` 原名清单**原始直书零编码**（Iconify API 直收逗号）；`{modify}` 未声明 → 空串；`{modify-icons}` 未声明 → 退化为 `{icons}`；未知占位符保留原样 + warn 一次。缓存：**会话内存缓存 + in-flight 合并**（同 url 多声明只 fetch 一次）+ **可选 TTL 持久层（`cache` 选项，修订追加——初版「无持久化」立场由其收窄为「默认无、声明级 opt-in」）**、无限流。

### 9. 原名注册：x-icon 不感知 modify

`icons=save` + `modify=rounded` → url 用 `save-rounded` 取数，symbol 以**原名** `save` 注册——响应键按编译期构建的「后缀名 → 原名」表回填（按请求对构建，非字符串反解，清单同时含 `save` 与 `save-rounded` 时映射无歧义）。`{icons}` 插值用原名清单、`{modify-icons}` 用后缀清单。`not_found` 中的后缀名 → 对应原名按加载失败处理。「x-icon 写原名、引擎自动拼后缀解析」的间接层否决——解析需反查每层声明的 modify 配置，且原名与后缀名并存声明时无法裁决。

### 10. IconifyJSON → symbol 转换规则

symbol id = 图标名（**不含** prefix——同一 template 可混多来源，名字即身份）；viewBox = `{left??0} {top??0} {width??16} {height??16}`，图标级缺省**继承 JSON 根层级**默认；`rotate`（90°×n）/ `hFlip` / `vFlip` → symbol 内包一层 `<g transform>`（围绕 viewBox 中心；转换期一次定型，无运行时样式污染——CSS transform 方案否决）；aliases 解引用（可选属性 alias 覆盖 parent、变换按 Iconify 语义合成、循环引用 warn + 丢弃）；`body` 直塞 symbol（Iconify body 自带 currentColor 体系，零加工）；symbol 上**不补** stroke 系属性（Iconify 是 fill 体系）。

### 11. 待定名：加载窗口期的语义分离

远程 x-icons 收集期即登记**待定名**（pending）。x-icon 遇待定名渲染**空占位**（不闪默认图标——「声明了没到」与「根本没声明」两个语义分离，后者才走默认图标「缺图不破相」）。symbol 注入后 `<use>` 自动显形；引擎同时保留 onChange 唯一唤醒重渲染兜底（重写 href 强制重解析——浏览器对「后到 id」的 use 解析行为历史不一，双保险）。fetch 失败 / JSON 解析失败 / 非 200 → 该批原名逐个 warn + 按未命中处理（默认图标）。

### 12. 同名胜者：编译期声明序 + 所有权登记（与网络时序无关）

同名冲突**静默覆盖**（不 warn，用户裁决）。胜者判定：编译期按**声明序**登记「名字 → 所有权」（同 scope 后声明覆盖先声明），fetch 到达时**非所有权持有者无注入权**——结果与网络时序无关、可复现。同一 template 内**远程覆盖内联**（用户裁决，推翻「内联优先」推荐）：内联同步可用、加载窗口期先显形，远程到达后替换。跨 scope 就近遮蔽照旧（决策 4）。

## 被否决的方案

- **带值修饰符 `x-icons.icons="..."`（用户原案示例）**：与 ADR-0007「修饰符无值」词条及已废弃的位置参数修饰符正面冲突，为单指令开口子。→ 值简写 + options 整包（决策 5）。
- **`asv-` 前缀（用户示例）**：统一 `as-` 家族（`as-icon` 类名先例）。→ 决策 2。
- **同名 warn（推荐案）**：用户裁决静默覆盖。→ 决策 12。
- **per-icon 远程物种共存 / 保留 mask 遗留通道**：双协议双缓存双姿态双文档。→ 整体移除（决策 8）。
- **x-icon-define warn + 剪枝 / warn + 自动迁移（推荐案）**：用户裁决硬移除（x-use 先例，静默失效）。→ 决策 3。
- **x-icon 感知 modify（自动拼后缀解析）**：解析反查声明配置、原名与后缀名并存无法裁决。→ 原名注册（决策 9）。
- **symbol 保留作者 stroke-width、选项 CSS 尽力覆盖**：presentation attribute 优先级高于继承，覆盖因图标而异不可靠。→ strip + CSS 变量（决策 6）。
- **响应式图标清单**：无真实场景（YAGNI），牵出增量注入 / 失效回收整串生命周期。→ 纯静态（决策 5）。
- **孤立 x-icons warn + 丢弃（x-define 先例，推荐案）**：图标纯资源，丢弃过罚。→ 静默归全局（决策 4，用户裁决）。
- **持久缓存延续（localStorage）**：批量声明天然少量请求。→ 会话内存一层（决策 8）。**修订注**：后续经 `cache` 选项以「声明级 opt-in + TTL」的受限形态回归（见决策 8 修订追加），与本条否决的无条件持久层（无过期 + LRU + 全局开关 + 预取）不是同一方案。
- **fetch 到达序覆盖**：结果取决于网络时序、不可复现。→ 声明序所有权登记（决策 12）。
- **同一 template 内联覆盖远程（推荐案）**：用户裁决远程覆盖内联。→ 决策 12。
- **变换丢给 CSS（transform on use）**：运行时样式污染。→ `<g transform>` 转换期定型（决策 10）。

## 后果

- ✅ 颜色模型回归 CSS 继承正轨：currentColor 直接继承，无 mask alpha 间接层；`color` / `stroke-width` / 尺寸全部 CSS 可控。
- ✅ symbol 晚到自动显形（use 引用幂等）+ onChange 唤醒双保险，异步协调成本趋零。
- ✅ 图标域与组件 / action / data 的链式查找范式统一（就近遮蔽 + 全局兜底）。
- 🔴 mask 机制整体下线：`background-color` 换色写法失效（`color` 选项语义迁移）、`mdi/home` 值形失效（未命中 → 默认图标 + warn）、`baseUrl` / `persist` / `prefetch` API 删除——均为有意的破坏性变更。
- ⚠️ 单一 sprite 是 document 级全局态新载体（`as-` 保留前缀纪律，对齐注册表既有纪律）。
- ⚠️ 局部 symbol 随 scope 回收：结构指令 detach / engine.destroy 的清理路径是实现重点（漏清则 sprite 泄漏，误清则跨 scope 误伤——scopeId 前缀隔离是正确性根基）。
- ⚠️ 测试重写面大：x-icon.test.ts 主体（mask 断言全废）+ x-icons / 图标域 / 远程源新用例；happy-dom 下 `<use>` 解析行为需实测（渲染断言可能需落在 symbol 注入与 href 写值而非视觉结果）。
