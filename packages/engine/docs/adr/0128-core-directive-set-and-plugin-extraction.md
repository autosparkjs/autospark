# ADR-0128: 核心指令集定界与官方插件外移

- 状态：已接受（Accepted，2026-10-29）
- 日期：2026-10-29
- 关联：plugins 包 ADR-0008（本决策的迁移执行侧）；ADR-0030（更名与三格式发行）、ADR-0093（四层结构）、ADR-0111（插件机制）、ADR-0114（预加载队列）、ADR-0041（x-for 虚拟列表，本决策将其策略外移）、ADR-0042（x-for 分页，同）、ADR-0052/0060/0063（overlay 家族，机制随产物外移）、ADR-0061（tooltip，薄壳化）、ADR-0106/0119（viewport/version 糖指令外移、状态源留核）

## 背景

engine 经 127 册 ADR 演进为全功能应用引擎，`presetDirectives` 注册面达 41 个名位、src 约 38,000 行；入口对指令的静态聚合使 ESM tree-shaking 失效——任何消费者全量携带全部指令。同时 `@autospark/plugins` 的插件机制（ADR-0111/0114）已验证指令/组件/复合三种插件形态（x-ripple/x-spin/button/notifications）。

经 grilling 逐轮收敛，定下**核心收敛**判据：engine = 响应式语言核心（绑定 + 结构 + 组件骨架 + 反馈闭环），应用级构造块（布局、覆盖物、树、装饰、提示）外移至官方插件包，以**选择性引入**（页面级 script 组合）取代全量携带。

## 决策

### 决策 1：核心指令集定界（presetDirectives 缩核终态）

核心保留（约 22 名位，语义判据非体量判据）：

- **响应绑定**：text / html / bind / bind-spread / on / **model**（双向绑定是语言核心体验，虽 1,163 行不因体量外移）
- **结构**：if / else-if / else / switch / case / default / show / **for**（本体保留，渲染策略外移见决策 3）/ isolate / teleport
- **作用域**：data（`$scopes` 铁律，ADR-0029）/ scope
- **组件骨架**：component / define / slot / super / import
- **反馈闭环**：loading / error（action 生命周期信号消费是核心反馈面；x-error 的 `behavior:'overlay'` 为自建轻量 DOM 覆盖层，与 overlay 特性无关）

外移（详见 plugins ADR-0008，七产物）：tree / layout+pane / splitter / expandable / resizable / container / viewport / version / dialog / popover / drawer / foldable / tooltip / for 的 `.virtual`+`.paging` 策略。

**状态源与糖指令分离**：`$.viewport`（features/viewport/manager）与 `$.version`（engine 构造期写入，ADR-0119/0120）**状态源留核心**，糖指令（x-viewport/x-container/x-version）外移后经公开状态路径运行时订阅——多消费者基础设施归核心，消费端归插件。

### 决策 2：overlay 机制主体外移，核心留 getOverlayContainer 薄层

`features/overlay/`（instance/anchor/contentHost/handle/registry/stack/wrappers/types）与 `features/directive/overlay.ts` 基座、visible-overlay **随 autospark.overlay.js 产物外移**——其指令侧消费者（dialog/popover/drawer/foldable）全部在外移清单内；tooltip 经查证**不依赖**本机制（自建浮层，仅事件委托渐进覆盖 overlay 容器），x-error 的 overlay 形态为命名巧合（自建覆盖层）。

核心保留：

- `getOverlayContainer`（engine 渲染根下的 overlay 容器宿主查询/懒建薄层）——公开 API 不断（notifications 插件经 `nsMember` 消费），mask/样式注入等重逻辑随产物走；
- `engine.ts` 对 overlay 的销毁期引用改由插件指令的 `static dispose(engine)` 生命周期承接（机制现成）。

### 决策 3：ForRenderStrategy 扩展点（策略插件通道）

x-for 核心缩回纯列表渲染（约 850 行），开放**渲染策略注册表**：`.virtual` / `.paging` 修饰符声明时查注册表，策略实例由 `autospark.virtual.js` / `autospark.paging.js` 插件注册（可见区计算/垫片/回收/监听等策略职责）。

**退化语义**：声明 `.virtual`/`.paging` 而对应策略未注册 → `logger.warn` + **退化全量渲染**（ADR-0041 决策 15「降级而非崩溃」的自然延伸）。`.paging` + `.virtual` 并存互斥语义不变。

### 决策 4：tooltip 薄壳化（特性插件通道）

`features/tooltip/`（约 800 行）整体外移为 `autospark.tooltip.js`：

- **选择性引入即开关**：加载插件 = 启用；不加载 = `title` 保持原生行为。核心编译期 title→data-tooltip 转换去 tooltip 化——转换开关从 `tooltipManager.enabled` 改为特性注册查询（实施期于「转换留核心 + 注册表查询」与「编译期转换钩子」两候选中定夺，语义恒为：插件未注册时 title 原样保留）；
- `engine.tooltip` 命令式 getter 薄壳留核心，实现委托插件注册的管理器；插件未加载时调用 warn + no-op；
- tooltip 对 overlay 容器的渐进覆盖关系不变：查核心 `getOverlayContainer`，容器存在（overlay 产物已加载）则追加监听点——插件查核心，方向恒正。

### 决策 5：公开导出面扩充（插件消费契约）

- `AutoSparkDirectiveBase` / `DirectiveSpec`（已有）——插件指令类的运行时基座（`nsMember("AutoSparkDirectiveBase")`）；
- `resolveAnimate`（新增）——overlay 家族与 tooltip 的动画解析依赖；
- `getOverlayContainer`（已有）——overlay 容器宿主与渐进监听。

### 决策 6：发行形态——三格式同步缩核、硬切无兜底

缩核为**源码级**决策，esm/cjs/iife 三格式同步失去外移指令；**不发** `autospark.full.js` 兜底产物，聚合产物 `autospark.plugins.js`（官方全家桶）承担等价旧行为的角色。npm ESM 消费者在 plugins 增设 ESM 产物前无补装通道，接受为二等公民（script-first 生态定位）；未来 plugins 增设 ESM 属纯增量兼容操作，不构成本决策的反悔理由。

## 备选方案

- **engine 双产物（core/full 双 entry，源码零改动）**：否决——两套扩展机制并存的认知成本高于迁移成本，且 ESM tree-shaking 依旧失效。
- **overlay 机制整体留核心、产物做薄壳**：否决——「tooltip 消费同一机制」论据经查证不成立（tooltip 自建浮层），机制的核心侧消费者仅 getOverlayContainer 转导出与 engine.ts 销毁引用两处，均可薄层化；留核心违背核心收敛判据。
- **一指令一产物**：否决——overlay 机制三份内联（约 2,000 行 × 3）、ResizeSession 五处重复，违反「产物间零重复」；改为同类域组合（plugins ADR-0008）。
- **运行时懒加载（引擎启动后动态注入）**：否决——Compile/Hybrid 指令编译期剪枝，晚到策略不被已编译树识别；重编译语义复杂度不配收益。
- **x-tree 之外的响应核心外移（x-for/x-model/x-component 按体量裁）**：否决——判据是核心收敛（语义）非瘦身（体量），结构指令与组件骨架是语言核心。

## 后果

- engine src 约 38,126 → 约 26,230 行（-31.6%），`autospark.js` IIFE 估减 170-210KB（实测以构建为准）；
- engine `__tests__` 对应目录、`docs/zh/guide/directives/` 对应文档页、`docs/demos/` 对应目录随产物迁移（check-doc-structure 同步适配）；
- `components/*.html` 中 overlay 家族 shell 模板等数据资产随域外移；
- CONTEXT.md 新增词条：指令插件 / 策略插件 / 选择性引入（「按需加载」因歧义列入 Avoid）；
- 第二批遗留立项：form/field（与 model/action 运行时联动）、icon/icons（compiler 前置 transformer 耦合，需「编译期插件」形态独立 ADR）；
- breaking change：使用外移指令的页面须新增对应 `<script>` 标签（或引聚合产物），于 major 版本公告与迁移指南说明。
