# ADR-0047：x-icon 异步图标源（`baseUrl/<图标集>/<图标名>.svg` 通用远程协议，默认源 Iconify）

- **状态**：Accepted（grill-with-docs，一轮七问）
- **日期**：2026-09-19
- **关联**：[ADR-0046](0046-x-icon-directive.md)（x-icon 本地物种：注册表 / 规范形 / URL 工厂 / 渲染管线——本物种全盘继承）、[ADR-0033](0033-x-data-async-source.md) / [ADR-0035](0035-x-html-async-source.md)（异步源家族先例物种）、[ADR-0035](0035-x-html-async-source.md) 决策 5（AsyncSourceRunner 共享执行器，注释预留「第三家异步源即持即用」）、[ADR-0048](0048-icon-persistent-cache.md)（在其缓存层之上叠加 localStorage 持久层与 prefetch）、[CONTEXT.md](../../CONTEXT.md)（「图标层 / 异步图标源」词条）

## 背景

需求：`<span x-icon="mdi/home">` 直接使用 Iconify 公共 API 在线图标，免 `x-icon-define` 声明。API 事实（官方文档取证）：`https://api.iconify.design/<prefix>/<name>.svg` 返回 SVG（默认 currentColor + 1em）；查询参数仅 `height` / `color` / `box` / `download`——**无 stroke-width**，`color` 仅对 monotone 图标有效；服务开源可自托管；生态 notation 是冒号形（`mdi:home`），URL 是斜杠形（`mdi/home`）。

接缝：① notation 与本地/远程通道判定；② 获取管线（fetch 文本 vs mask 直指远程 URL）；③ 远程图标的缓存归属；④ 异步三态姿态；⑤ API base 可配置；⑥ 响应式跨通道切换与执行器接入姿势；⑦ 文档处置。

## 决策

### 1. notation 单一斜杠形 + 通道判定

`prefix/name`（`mdi/home`）。**冒号形（`mdi:home`）废除**——初版曾双开等价（生态复制是冒号形），后经用户修订收窄：**值含 `/` 才走远程通道**（判定正则 `^[a-z0-9-]+\/[a-z0-9-]+$`，各段小写字母数字连字符，防 URL 注入——`?`、`..` 混不进）；本地图标名受 CSS ident 硬约束（ADR-0046 决策 10）天然不含 `/`，**两通道零冲突、无优先级问题**。不匹配远程形者落回本地通道，由本地未命中姿态统一兜底（不另设错误分支）。

### 2. 获取管线：fetch 文本走全管线 + 规则化复用

fetch **裸 `.svg`**（不带查询参数）→ 规范形（strip 全部 stroke-width、缺省补 currentColor / xmlns）→ 注入生效 sw → `encodeURIComponent` data URL。颜色仍走宿主 `background-color`（alpha mask 模型不变）；sw / size / color / padding 选项与本地物种**同构生效**。

**规则化复用（实现期修订，取代初版「全程内联 mask-image」）**：取回后把默认 sw 形态**升格为属性选择器规则**——`.as-icon[data-as-icon="集/名"]{mask-image:url("...")}` 注入指令自管样式表（`<style id="autospark-icons-remote">`，对齐 x-tree/x-for 指令级样式惯例，与注册表的 `autospark-icons` 互不耦合脏标记）；实例只挂 `data-as-icon` 短属性复用同一条规则。**不设缓存登记机制——样式表本身即登记表**（升格幂等：选择器已存在则跳过；用户裁决取消初版 `_iconCache` 静态 Map 提案）。属性选择器取代派生类名的理由：`集/名` 不是合法 CSS ident，类名须编码且撞车（`mdi/home` vs 本地 `mdi-home`）；属性值直书原始名，零编码零碰撞、DOM 可读。**不进 `:root` 变量**（名字非法 ident，编码后用户也认不出，CSS 覆写价值≈0）。非默认 sw 仍内联工厂产物覆盖（本地物种同构）。会话级只增不删（远程缓存不可变）。

否决 mask-image 直指远程 URL（+ `?color=%23xxx`）：颜色被服务器端烘焙死（且仅 monotone 有效），破坏 currentColor 模型；无 stroke-width 参数，sw 选项失效；每次换色都是新请求。

### 3. 缓存归属：不进注册表，模块级远程缓存 + 并发限流

- 模块级缓存 `Map<prefix/name, SVG 文本>`（跨 engine 共享，对齐 document 级纪律）；
- in-flight promise 合并（同图标多实例同 tick 只发一次请求）；
- 浏览器 HTTP 缓存（API 带 cache headers）第三层兜底；
- **并发限流（4 路）+ 429 退避重试（400ms 递增，至多 2 次）**——实现期修正：缓存只解**重复**请求，不解**冷启动并发**风暴（32 图标整页首开实测触发 Iconify 公共 API 429，16 成功 / 25 被拒）；超出上限的请求排队放行，退避等待发生在槽内即天然背压。

注册表语义保持「**用户声明的资产**」纯净：遍历不外露引擎自动缓存、`delete` 不误伤；且 `mdi/home` 非法 CSS ident 本就进不了类名/变量体系（远程物种渲染全程内联 mask-image，不生成 `:root` 变量与类规则）。批量端点（一次多图标的 CSS 生成接口）不做（YAGNI——限流队列已解冷启动风暴，且批量 CSS 产物与本物种 SVG 文本管线不同构）。

### 4. 异步三态

加载中 = 空占位（保留尺寸，安静）；失败（HTTP / 网络错）= warn + **默认图标**（与本地未命中同姿态，词汇统一）；完成 = 占位 → 图标（与本地「先渲染后注册」联动同构）。不做 x-fallback 子节点（YAGNI——图标单字位，无整块替换态需求）。

### 5. base 配置：`AutoSpark.icons.baseUrl`（通用协议，不限于 Iconify）

远程取图 URL 约定为 `baseUrl/<图标集>/<图标名>.svg`——**通用协议**：默认 baseUrl 指向 Iconify 公共 API（`https://api.iconify.design`），指向任何按此布局伺服 SVG 的服务即可（自建图标服务 / 内网镜像，内网 / 隐私 / 离线场景）。挂在注册表对象上（用户裁决，否决独立静态 `AutoSpark.iconifyBase` 提案）——图标域配置聚一处，且与注册表同属全局资产纪律。跨 engine 生效。

### 6. 执行器接入姿势：复用骨架，不套用 start()

`AsyncSourceRunner`（ADR-0035 决策 5）的 `start()` 走 `detectDataForm` 判 url/action **声明形**（x-data 的值是 url 字符串 / action 名），而 x-icon 的值是**标准表达式**（求值后才得到 `mdi/home`）。故第三物种接入姿势：**值 watch 与通道判定在物种侧自有，fetch 竞态（请求序号丢弃）/ AbortController / destroy 中止复用 runner 骨架**。SSR：`typeof fetch` / `typeof document` 守卫。

### 7. 响应式跨通道切换

值变每值重判通道（本地 `close` ↔ 远程 `mdi/a` 自由切换）；远程重取**保旧图不闪断**（家族「重取保旧值」语义）；请求序号竞态丢弃防快速切换串台；destroy 中止在途请求。

## 被否决的方案

- **mask-image 直指远程 URL + `?color`**：颜色烘焙死 + 仅 monotone + sw 失效。→ fetch 文本全管线（决策 2）。
- **远程图标进全局注册表**：遍历 / delete 语义被引擎缓存污染，非法 ident 进不了类名体系。→ 独立模块级缓存（决策 3）。
- **`AutoSpark.iconifyBase` 独立静态（提案）**：base 挂注册表 `AutoSpark.icons.baseUrl`（用户裁决）。
- **批量 CSS 端点**：YAGNI，三层缓存已解请求风暴。
- **x-fallback 子节点**：图标单字位无整块替换需求。
- **冒号形 notation（`mdi:home`，初版 Q23 双开裁决）**：用户修订废除——值含 `/` 才走远程，判定更简、免冒号与表达式语境的潜在歧义。→ 仅斜杠形（决策 1）。
- **整体套用 runner.start()**：形态判定模型不符（url/action 声明形 vs 表达式值）。→ 骨架复用（决策 6）。

## 后果

- ✅ 零声明用图标：`x-icon="mdi/home"` 开箱即用，直连 300,000+ 图标池。
- ✅ 本地 / 远程同一条渲染管线，选项与颜色模型完全同构（维护单管线）。
- 🔴 第三方公共 API 依赖（在线可用性 / 隐私 / 内网封锁）：自托管 `baseUrl` 缓解，文档化使用者责任。
- ⚠️ 远程缓存无失效策略（会话级内存命中，图标更新需刷新页面）：Iconify 图标版本不可变语义下可接受。
