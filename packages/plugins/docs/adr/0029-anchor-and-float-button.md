# ADR-0029: P3 轻件对——anchor 锚点导航与 float-button 悬浮按钮

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——清单权威表 navigation/other 行与四条全局约定；修订：float-button 补入 other/P3 并吸收原 backtop 独立条目为 back-to-top 形态，antd 5 同款路线）、ADR-0019/0021/0024（P0/P1/P2 轻件合批先例与规避清单）、ADR-0133（元素名快速写法 precompile 变换）、ADR-0134（autospark.base 继承）

## 背景

P3 批 11 件中 anchor 与 float-button 为轻件（重件各自独立 ADR 不入本对），按 ADR-0018 决策 8 合批一个 ADR。两件均为滚动监听类组件（共享「window 全局长命监听 + unmounted 清理」纪律，grid 的 matchMedia 先例）。float-button 原为 other 分类首件，2026-11-13 经用户裁决改归 **general 常规组**（归类变更按 ADR-0017 决策 3 在本 ADR 声明）——目录/测试镜像/文档/侧边栏全链迁移至 general/。

全局约定（i18n / router 隔离 / 排除域 / button 范式）与视觉对齐基线（ADR-0024 后果节）继承 ADR-0018 决策 6，不在本 ADR 重复。

## 决策

### 1. anchor 锚点导航（navigation，P3）

**归类声明**：`src/components/navigation/anchor/`，产物 `autospark.anchor.js`，注册名 `autospark.anchor`。ADR-0018 清单权威表 navigation 行「anchor（P3）」。

**API 面**：items（`{ key, label, href? }[]`）双形态——状态引用注入 + `<x-anchor-item key label href>` 子元素声明（precompile 折叠 data-items 标量通道，breadcrumb/tabs 范式）；`offset` 滚动判定线（锚顶越线即当前，吸顶导航高度补偿，判定线同时作用于高亮与点击滚动目标）；`affix` 固定侧栏（fixed 右缘悬浮，`:has()` 驱动）；事件 `change`（冒泡 `detail = { key }`，清空也是变化、同值短路）。无插槽（列表自渲染）。

**技术路线裁定：scroll + getBoundingClientRect，不用 IntersectionObserver**——判定语义是「最后一个锚顶越线」（有序阈值判定），IO 的进入/离开回调模型需自行维护排序与阈值换算反而更繁；元素级 gBCR 在 scroll 回调内直读，密集事件下计算量可控（items 规模小）。**无命中不高亮**（antd 缺省语义：页顶无高亮、滚入首区亮首项）；`current` props 仅作初值，初始一跳 syncActive 即以判定为权威源校正。

**router 隔离（ADR-0018 决策 6 约定 2 具体化）**：点击 `preventDefault` 拦原生 hash 瞬跳 + `window.scrollTo` 平滑滚动，**不写 location.hash**——写 hash 会触发浏览器瞬移跳转打断 smooth 滚动，且 hash 变更属路由域语义；纯滚动即零路由耦合，router 侧联动（锚点 → 路由参数）以配方文档交付。

**监听清理**：scroll/resize 挂 window（passive），cleanup 存宿主 JS 属性，unmounted 统一回收（grid 的 matchMedia 先例，ADR-0019 规避清单纪律）。

**视觉对齐（用户硬性要求）**：激活态与 tabs 激活同源——`--asc-tone: var(--auto-primary-color, var(--asc-anchor-primary, #009aff))` 主色中转 + 字重 `--x-font-weight-large` + 左墨线点亮（tabs line 形态下划线的纵向同构）；文字色链一致（次要色 → 激活 tone）。

### 2. float-button 悬浮按钮（general，P3；原 other 归类 2026-11-13 迁移）

**归类声明**：`src/components/general/float-button/`（2026-11-13 自 other/ 迁移，用户裁决），产物 `autospark.float-button.js`，注册名 `autospark.float-button`。ADR-0018 清单权威表 other 行「float-button 含 back-to-top 形态（P3，吸收原 backtop 独立条目）」——归类随本 ADR 修订为 general。

**API 面**：`type`（`default` | `back-to-top`）；`icon`（x-icon 渲染，常规形态必选、back-to-top 缺省内置 `arrow` 上旋指顶——自定义 icon 不旋）；`visibilityHeight`（渐显阈值，缺省 400）；`right` / `bottom`（定位偏移，number→px / string 带单位，JS 通道写宿主内联）；`shape`（circle 缺省 / square——圆角走 `--auto-border-radius`）；默认插槽可选 label（非空宽幅胶囊）。事件出口：click 原生冒泡（组件默认封闭）+ back-to-top 内建回顶。

**back-to-top 形态裁定：`type="back-to-top"` 字符串值，不做布尔形态**——与 type 通道单值正交（后续形态扩展零面变更）；另提供 `back-to-top` 裸属性糖（precompile 归一 `type: "back-to-top"`，显式 type 在场时糖失效）照顾书写习惯。渐显语义：滚动位置 ≥ 阈值落宿主 `data-visible`（CSS opacity/位移过渡 + visibility 收尾 + pointer-events 阻断）；reduced-motion 停播过渡且回顶 `behavior: "auto"` 瞬时归位。

**组形态（group）边界声明**：v1 单钮；组形态（多钮聚组 + 展开菜单，antd FloatButton.Group 同款）为 **P4 增补面**——本件 type 通道与定位偏移面已为组容器预留兼容（组内子钮消费同一 right/bottom 基准），增补时以本 ADR 修订或独立 ADR 承载。

**视觉对齐**：语义色/底色/边框/阴影三级回退走 `--auto-*`（阴影即走 `data-shadow` 主题手动通道，card 同款注释）；square 圆角走 `--auto-border-radius`；hover 边框主色点亮（color-mix）；暗色兜底变体在场。

**监听清理**：仅 back-to-top 形态挂 scroll（type 动态切换时旧监听先行摘除再按新形态重挂，幂等）；unmounted 统一回收（同 anchor 纪律）。

### 3. 元素名写法新规范（2026-11-13 用户指令，两件首发执行）

demo 与文档示例**一律用元素名组件写法**（`<x-anchor :items="secs">`、`<x-float-button back-to-top>`），不用 `x-component:autospark.*="{...}"` 值对象形态（写法对照小节可保留值形态示例）。配套两项变换层补丁（anchor/float-button 的 precompile 先行，家族既有件不回改）：

1. **裸属性布尔归一**：`inferPropValue("")` 返回空串（falsy），裸属性（`<x-anchor affix>`）折成 `affix: ""` 会静默失效——变换层对 `attr.value === ""` 归一 `true`（HTML 裸属性语义）；
2. **`back-to-top` 裸属性糖**：非 props 键（折叠会得到无意义的 `backTop: true`），显式归一 `type: "back-to-top"`。

## 后果

- 两件全量入册；float-button 改归 general 后 other 分类仍由 P4 批（affix/watermark/tour/countdown）填充。
- 登记面五处 + 惯例同步由并行收口任务执行（本 ADR 交付时组件/测试/demo/文档已就位，登记信息随任务回报）。
- 规避清单继承（ADR-0019/0021/0024）：字面量数组 props 死环（items 恒引用/标量通道）、watch 回调信封、T4=B 根绑定禁、props 晚注入一跳、x-for 克隆体内 x-show（本对未触发克隆体条件显隐）、组件状态键避开 `index`（anchor 用 `current`）。
- 引擎边界零新增发现（本对未触新缺陷）；真浏览器 e2e 重点面：anchor 滚动高亮链路与 back-to-top 渐显（happy-dom 无真实滚动，单测以元素级 gBCR/scrollY 补丁注入确定性值覆盖判定逻辑）。
