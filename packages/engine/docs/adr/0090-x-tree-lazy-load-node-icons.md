# ADR-0090：x-tree 懒加载与节点图标（loadedField 判据、双事件契约、节点图标状态机）

- **状态**：Accepted（grilling 三轮十三问 + domain-modeling 定稿）
- **日期**：2026-10-05
- **修订**（同日最终裁决，三项）：① 决策 4——加载完成由**引擎自动置 `loaded = true`**（children 到达即翻转），宿主只写 children，原「宿主同批写回 + 漏写防呆 warn」废除；② 决策 6——原「失败零建模」推翻，`tree:load` detail 携带 `fail(err)` 回调，错误挂行生命周期（红图标 + 行 tooltip + `$error`）；③ 决策 11——图标优先级链插入错误态 `file-error`，循环变量增至十二元组。
- **关联**：[ADR-0040](0040-x-tree-rendering.md)（P3 懒加载未做项收口、决策 11 事件契约 detail 修订）、[ADR-0007](0007-directive-options-and-modifiers.md)（选项回退链）、[ADR-0058](0058-icon-symbol-and-icon-domain.md)（x-icon symbol 机制与内置图标注册表）、[ADR-0061]（全局 tooltip `data-tooltip` 委托——错误消息提示载体）、[CONTEXT.md](../../CONTEXT.md)（「懒加载节点 / 加载指示字段」「树事件」「树循环变量」「节点图标」词条）

## 背景

ADR-0040 把懒加载排进 P3 并预留了 `tree:load` 事件（决策 11：「load 另带 `children`」），但 P3 实际未交付——文档结论明确写着「未交付」。本次收口并同批交付**节点图标状态机**（默认模板三态复选图标改内置图标后顺势补齐的节点类型图标）。

三次根本裁决（每轮拷问的收敛点）：

1. **判据形态**——「节点是否未加载」用什么信号判定；
2. **取数责任**——谁去真正取 children（引擎执行器 vs 宿主事件响应）；
3. **图标默认值**——默认模板的节点图标默认开还是显式启用。

## 决策

### 1. 判据：显式 `loadedField`，值严格 `false` 即未加载

`loadedField` 选项（默认 `"loaded"`）指名加载指示字段。行为门统一为 `node[loadedField] === false`：

- `true` / 其他值 / **字段不存在** → 已加载或非懒加载节点（字段缺失天然非懒，无需单独存在性检查）；
- 否决 children 缺失隐式判据（`childrenField` 不存在无法区分「确定叶子」与「未加载」，叶子恒被误判为未加载）。

**未加载 ≠ 叶子**：`$leaf` 对未加载节点恒为 `false`（判据 = `children.length === 0 && !isUnloaded`）——否则箭头随 `--leaf` 隐藏，节点无从点开。

### 2. 取数责任：事件契约（宿主取数），否决首版 loader 执行器

引擎只广播、不取数。loader 执行器形态（x-for `.paging` 的 AsyncSourceRunner / `$loading` 体系）留作后续可叠加通道，首版不建模。

### 3. 双事件：`tree:load`（请求）/ `tree:loaded`（完成）

- `tree:load`：请求事件，detail `{id, node, level, fail}`，在触发门命中时广播一次；`fail(err)` 为**失败回调**（修订决策 6），宿主取数 reject 时调用挂错误态（非 Error 入参归一为 `Error`）；
- `tree:loaded`：完成事件，detail 在请求事件基础上**另带 `children`**（到达快照）。

ADR-0040 决策 11 中「load 另带 `children`」的 detail 表述由本 ADR 修正归属 `tree:loaded`——请求事件发出时 children 尚不存在，无从携带。`tree:loaded` 仅在**在途请求被结算**时广播（fail 后宿主补写 children 属迟到成功：恢复渲染但不补发完成事件）。

### 4. 写回责任（修订）：宿主只写 children，引擎自动置 `loaded = true`

加载完成的唯一可观测信号是 **children 到达**：children 字段 watcher 命中且节点 `loaded === false` 时，引擎写 `node[loadedField] = true`（宿主零字段管理；手动补写 `true` 与自动翻转幂等兼容）。写入失败（只读数据）按节点去重 warn 一次。

- **翻转只挂 children 到达路径**：`loaded` 字段写入是宿主**权威信号**——`false` = 失效重载（决策 8 的触发源），同批自动翻转会把失效写回吃掉（实现期发现的边界，测试覆盖）；
- 原「children 到达而 loaded 仍 false → 漏写防呆 warn」废除——引擎代写后不可能漏写；
- 原始矛盾态（出生即 `loaded:false` + 已有 children）不代偿：按 `loaded` 权威照常渲染，展开过渡照常发 `tree:load`（宿主若不想要请求，出生时写 `loaded:true` 即可）。

### 5. 触发双路径：展开过渡 + 初始展开，统一门

触发门（三者同时满足）：`loaded === false` && 有效展开 && 模板递归（含 `x-tree-children`——非递归模板无子容器可填充，静默不发）。

触发路径：

- **用户 toggle 展开**：经 syncVisibility → show() 补发；
- **初始展开**（`defaultExpandLevel` / `expandField` 预置、拖拽收纳 inside 写回 expand 等一切进入展开态的路径——统一收敛到 createEntry 初定位与 show() 两个入口）。

初始展开的 `tree:load` **延一拍广播**：首渲在 `compile()` 的 `flushAll` 内同步发生，宿主监听器（构造后挂载）在其后——延至微任务保证可监听；行在广播前已销毁则跳过（防悬挂请求）。

### 6. 在途与去重：`$loading` 派生不落盘，去重挂行生命周期（修订：错误态建模）

- `$loading` 为派生局部量（对齐 `$indeterminate` 惯例），不写入节点；
- 同次展开连点不重发（entry 级 `loading` 标志去重）；
- **eager 折叠销毁子层时同步清在途与错误** → 再展开即重发，构成免 API 的失败重试通道；keepalive 折叠保留（子层保活，响应到达照常结算）；
- **失败建模（修订，推翻原「失败零建模」）**：宿主调 `detail.fail(err)` → 错误挂**行生命周期**（`entry.error`，不落盘）——`$loading` 转 `false`、`$icon` 转 `file-error`（红）、行挂 `data-tooltip = err.message` 与 `data-x-tree-error` 样式钩子。无 `$error` 落盘、无超时、无 `tree:load-error` 事件（宿主自己知道失败）；
- **错误清除三条路径**：① 完成信号到达（children 写入 / 手动 `loaded:true`——即使无在途，fail 后补写即恢复）；② 重新发出 `tree:load`（写回 `loaded:false` 原位重载 / 折叠再展开，重发即清）；③ eager 折叠（与在途完全对称，keepalive 保留）。迟到 `fail`（行已销毁或无在途）忽略；
- 错误态期间点击行仍可展开/折叠——`$error` 是派生读量，宿主也可经自定义模板自行渲染（`$error.message`）。

### 7. 到达与刷新：三字段 watcher + 行局部刷新

每层新增三个字段订阅（`path.*.{childrenField, loadedField, iconField}`，单根数据根层特判为 `path.{field}`，同 expandField 既有惯例）：

- children / loaded 到达 → 结算在途（清 `loading`、按需广播 `tree:loaded`、防呆 warn）+ 本层行局部刷新——`localData` 非响应式，`$children` / `$leaf` / `$icon` / `$loading` 必须显式重算 + `scope.refresh()`（同 syncVisibility 刷新 `$expanded` 的既有模式）；
- icon 字段变化 → 仅刷新（不结算）。

已展开的未加载节点在 children 到达时由既有结构 watcher（`path.*`）照常建行，本决策不改结构渲染路径。

### 8. 失效零 API：写回 `loaded: false` 即重载

缓存即 state 本身。宿主写回 `loaded: false`（loadedField watcher 结算分支外的失效路径）：

- 节点**已展开** → 立即重发 `tree:load`（原位失效重载）；
- 节点**已折叠** → 不发，等下次展开过渡（决策 5 的门照常生效）。

在途期间的 `loaded: false` 写入不打断在途（去重优先，决策 6）。

### 9. 级联边界：只作用已加载部分，不回溯继承

`cascadeDown` 经 `childrenOf` 递归，未加载节点 children 为空 → 天然终止；勾选不跨未加载边界传播，到达后不回溯继承旧意图（否决「待继承意图」建模——引擎不在数据到达时机替宿主做业务写入）。无需新增代码，行为即现状。

### 10. 图标三件套：`icon`（默认 true）+ `iconField` + `$icon`

- `icon` 选项（默认 `true`）：只开关**默认模板**的节点图标元素；`false` 回到无图标布局（默认模板非稳定契约，关闭即逃生口）——否决默认 `false`（默认模板的价值在开箱即用的完整视觉）；
- `iconField`（选项，默认 `"icon"`）：节点数据上的图标覆盖字段，对齐 `nameField` 等字段可配惯例；
- 图标值两形态：单图标名（两态同图）或 `"close,open"` 逗号对（首项收起态、次项展开态；叶子静默取首项）——否决 `{close, open}` 对象形态（数据面冗余、与字符串字段惯例不一致）；
- `$icon` 派生局部量**恒注入** localData（不受 `icon` 开关影响）——自定义模板一行 `x-icon="$icon"` 即可消费（决策 11 的数据面与决策 10 的模板面解耦）。

### 11. 节点图标状态机（`$icon` 优先级链，修订：插入错误态）

```
loading（在途）
  > file-error（fail(err) 错误态，行标红 + data-tooltip=错误消息）
    > 未加载 unknown
      > node[iconField] 覆盖（逗号对按 $expanded 取项）
        > 有子：$expanded ? folder-open : folder
          > 叶子：file
```

- 错误态压过节点覆盖：异常必须可见，宿主覆盖不得吞掉 `file-error`；
- 红色经引擎注入 CSS（`li[data-x-tree-row][data-x-tree-error] .x-tree-type-ico{color:#e5484d}`——默认模板零配置变红，`data-x-tree-error` 属性同时是自定义模板的样式钩子）；错误消息载体为行级 `data-tooltip`（ADR-0061 全局委托，运行时属性即生效；接管前保存宿主原值、清除时还原）；
- 循环变量增至**十二元组**：新增 `$error`（`Error | null`，派生不落盘，同 `$loading` 惯例）——自定义模板一行 `x-text="$error?.message"` 即可消费；
- 图标名用注册表实际名 `folder-open` / `file-error`（连字符，ADR-0058 内置注册表）；
- 默认模板布局：箭头 → 图标 → 复选 → 文本——箭头与图标**共存**（箭头 = 可展开信号、图标 = 身份信号），加载中箭头维持不动（箭头状态由 `$leaf` 决定，加载中恒非叶子）；
- 表达式数据源（childrenPath 为 null）无字段订阅，懒加载不额外处理——继承 ADR-0040 既有降级（仅结构变化可响应）。

## 被否决的方案

- **children 缺失隐式判据**：分不清「确定叶子」与「未加载」，叶子被永久误判（否决于决策 1）；
- **首版 loader 执行器**（AsyncSourceRunner / x-for paging 形态）：引擎介入取数职责，与事件契约二选一，首版从简（否决于决策 2）；
- **`tree:load` 单事件兼两义**：请求与完成语义混杂（否决于决策 3）； ~~引擎翻转 `loaded` / 引擎监测到达自动翻转~~——**已随修订决策 4 采纳**（children 到达即翻转，仅限 children 路径）；~~引擎永不写 loaded~~ 同步废止（引擎写数据面在 expandField / checkedField / selectedField 之外新增 loadedField 的 children 到达自动翻转一处）；
- **级联回溯继承 / 待继承意图**：引擎在数据到达时机替宿主做业务写入（否决于决策 9）；
- **`$loading` 落盘 `node.$loading`**：污染数据面，派生量一律不落盘（否决于决策 6，`$error` 同）；
- ~~**首版失败建模**（`$error` / 超时 / `tree:load-error`）留未来执行器通道~~——**已随修订决策 6 部分采纳**：`detail.fail(err)` + 行挂错误态 + `$error` 派生量落地；**超时与 `tree:load-error` 事件仍否决**（引擎无从感知宿主失败时机之外的超时语义）；
- **独立 reload API / 递归重置**：写回 `loaded: false` 已零成本达成（否决于决策 8）；
- **`icon` 默认 false** / **固定键 `icon` 不可配** / **对象形态 `{close, open}`** / **图标兼任箭头**（身份信号与可展开信号合并）：均否决于决策 10/11；
- **宿主手动写回 `loaded:true` 的漏写防呆 warn**：引擎代写后无从发生（随修订决策 4 废除）。

## 后果

- `$leaf` 语义收窄：自定义模板中 `$leaf` 不再等价「无 children」——未加载节点恒非叶子（ADR-0040 循环变量语义修订，CONTEXT「树循环变量」词条同步）；
- 循环变量十一元组 → **十二元组**（`$error`）；默认模板新增图标列（`icon: false` 逃生口）+ 错误态红图标/行 tooltip；每层新增三个字段订阅（children / loaded / icon），行创建多一个 x-icon 实例；
- 引擎写数据面扩一处：`loadedField` 的 **children 到达自动翻转**（修订决策 4）；漏写防呆 warn 废除、改挂写入失败去重 warn；
- ADR-0040 决策 11 的「load 另带 children」表述由本 ADR 修正为 `tree:loaded`；`tree:load` detail 新增 `fail(err)`；
- 交付物：`tree.ts` + `x-tree.test.ts` + `docs/zh/guide/directives/x-tree.md` + `docs/demos/tree/lazy.html` + `CONTEXT.md` 词条 + 本 ADR。
