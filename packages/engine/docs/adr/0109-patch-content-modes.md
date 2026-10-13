# ADR-0109：engine.patch 内容投放模式（replace / inner / prepend / append）

- 状态：已采纳（2026-10-13 grilling 三轮共识落盘，实施随本 ADR 进行）
- 日期：2026-10-13
- 关联：ADR-0002（动态 patch——selector + updater 四态语义）、ADR-0003（engine 事件总线）

## 背景

ADR-0002 的 `engine.patch(selector, updater)` 只有单一语义：新内容**替换命中元素 T
本身**。「往既有容器里放内容」——清空重填、尾部追加（load-more）、首部插顶——没有
命令式出口：replace 会把容器自身连带替换，无法承载「容器固定、内容换装」的形态
（路由 outlet、增量列表等）。

## 决策

### 1. API 形态：第二参放宽为联合类型，mode 作第三参选项

```ts
patch(selector, content: string | Node | updater, options?: { mode? }): this
```

函数形态保持 ADR-0002 原貌（不传 options 行为逐字节不变）；string/Node 直投 =
「内容直投」心智，mode 决定放置方式。拒绝破坏性换签名（第二参只收 template）——
现有调用方、测试与文档承诺全保留。

### 2. 四模式语义矩阵（T = 命中的 scope 元素）

| mode | 语义 | 空串/空片段 |
| --- | --- | --- |
| `replace`（缺省） | 内容**替换 T 本身**（ADR-0002 原语义不变） | 删除 T |
| `inner` | 清空 T 全部子级（旧子 scope 逐个 destroy）后放入；T 自身及指令保留 | 仅清空（等价 `innerHTML=''`） |
| `prepend` | 插为 T 第一个子节点（多节点全插） | no-op |
| `append` | 插为 T 最后一个子节点（多节点全插） | no-op |

命名对齐 DOM 惯例（`el.append/prepend` = 子级首尾插入）。用户裁决：append/prepend
取**容器语义**（T 的子级首尾），非兄弟位置语义；「before/after 兄弟插入」不立项。

### 3. 函数形态与 mode 的组合语义

- `replace` + 函数 = 四态原样；
- 插入模式 + 函数：返回 string/Node 即待插入内容（可读 T 现状决定增量，如「读列表
  长度追加下一项」）；`undefined`/`T` **静默 no-op**；`null` **warn no-op**——replace
  的删除语义在插入模式无意义，显式提示防静默埋 bug。

### 4. 插入模式编译先行，失败零副作用

inner/prepend/append 先经 `compileChildNodes(nodes, T 的 scope)` 编译，成功才动
模板/运行两侧 DOM；编译失败回滚编译期新建的 scope（`scope.children` 快照差集逐个
destroy），两侧树不变。replace 保持 ADR-0002 既有失败姿态（模板先替换、编译失败仅
error log），不顺带重构（最小爆炸半径）。

### 5. 守卫与校验口径（所有模式一致）

- T 必须命中且为 scope 元素（裸元素挂 `x-scope` 哨兵，既有口径）；scope.el 须存活；
- 动态区域守卫沿用（`_isInDynamicRegion`：T 自身或祖先链含 ownsChildren 结构指令即拒绝）；
- 非法 mode **值**：warn + no-op（参数不可信时不执行破坏性操作）；
- options 未知**键**：静默忽略（对齐 options 消费普遍风格，用户裁决 C）。

### 6. 插入节点挂 T 的 scope

`compileChildNodes(nodes, scope(T))`——插入内容继承容器数据上下文，顶层插值文本注册
到 T 的 scope 持续响应；对比 replace 挂 `scope.parent`（T 自身被替换，新内容与其平级）。

### 7. 事件载荷带 mode

`engine/patch/before` → `{ selector, el, mode }`；`engine/patch/after` →
`{ selector, mode }`。types 中 ADR-0002 时期的占位键 `patch/before|after`（payload
形状早已与实际 emit 漂移）修正为真实键名 `engine/patch/before|after`。

### 8. options.ref 锚点（prepend/append 专享）

`ref` 为容器**内**锚点元素（CSS 选择器）：指定时 prepend/append 改插到锚点**前/后**，
实现列表中间定点插入。口径：

- ref 为空（未传/空串）= 容器首/尾（默认语义）；
- 锚点**须命中 scope 元素**（`querySelector` 从容器内找）——纯静态子元素无正向桥、
  运行化身不可得，与容器资格同口径（指引给锚点挂 `x-scope`）；未命中/非 scope =
  **warn + no-op**（不静默退回首尾，防错位）；
- ref 解析前置于编译（失败发生在任何副作用之前）；inner/replace 忽略 ref
  （inner 清空后锚点已不存在，replace 替换 T 本身位置无意义）。

## 后果

- 「容器固定、内容换装」有了命令式出口（路由 outlet / load-more / 插顶横幅等）；
- replace 行为逐字节不变，现有调用方零迁移；
- 「before/after 兄弟插入」与「任意静态容器免 x-scope 直投」明确不立项——前者无真实
  场景，后者需引入模板↔运行树 index-walk 新机制（依赖静态区域同构假设，核查面大），
  等真实需求再议。
