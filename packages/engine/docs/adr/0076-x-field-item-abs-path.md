# ADR-0076：x-field 项内绝对化——x-for 项字段进表单层、两阶段渲染事务、生命周期注销

- **状态**：Accepted
- **日期**：2026-09-30
- **关联**：[ADR-0045](0045-x-form-and-x-field.md)（x-form/x-field 表单指令系统——absPath/中心化注册的既有地基）、[ADR-0075](0075-x-model-write-symmetry.md)（x-model 写回落点对称化——对照范式）、[ADR-0029](0029-x-data-mount.md)（`$scopes` 挂载模型——域前缀解析）、[CONTEXT.md](../../CONTEXT.md)（「字段绝对路径」「项映射」词条）
- **共识来源**：grilling 探针实测（x-for 项内 `$field.value` 恒 undefined、reset 幽灵键 + 不回滚；autostore `reset(entry)` 三重实验否决）→ 用户裁决按 (a) 修绝对化 + `store.reset` 引擎替换（后者经实验证伪回退，见「被否决」）

## 背景

排查「x-field 是否存在 ADR-0075 同款读写分裂」发现：**x-field 主通道无此病**——它是「编译期一次绝对化」范式（`resolveFieldAbsPath` 把绑定值解析成从 store 根起算的绝对路径，此后读写同位），与 x-model 的「运行期相对解释」相对。但绝对化在 created 期执行，存在三类盲区（探针实测）：

1. **x-for 项内字段**（`x-field="item.name"`）：`item` 首段在 locals，`resolveFieldAbsPath` 只查 `_data` → absPath 未绝对化 → 控件层碰巧正常（组合 ModelDirective 的 set 表达式经聚合视图写 locals.item 引用的真身），但表单层全错位：`$field.value` 读恒 undefined、`form.reset` 对根写幽灵键且真字段不回滚。
2. **注册表悬垂**：`fields` Map 只注册无注销（field destroy 不通知 form）——x-for 删项后条目残留，reset 对已删路径回写会**复活已删项**。
3. **rebind 竞态**：x-for「同 key + index 变 → 销毁旧 scope 重订」的逐项串行处理中，同路径注销/注册交叉——互换/头部插入推挤（可编辑列表高频操作）时，后处理者的注销删掉先处理者刚注册的条目（字段失联）、或新项撞上尚未销毁的活条目错拿 initial。

## 决策

### 一、项映射（LOCAL_PATHS）：x-for 记录项变量 → 绝对状态段

x-for 在项 localData 上挂 `{ [itemName]: [...源绝对段, String(index)] }` 映射（Symbol 键：不进聚合视图的 string 命中分支、不被 Object.assign 复用更新冲掉）。挂载在 localData（先于成员 scope 构造）保证**嵌套 x-for** 的内层 created 期能沿链读到外层映射（内层源 `row.cells` 经外层映射展开为 `rows.2.cells`）。

`resolveFieldAbsPath` 扩展：首段沿链就近命中——项映射 > `_data` 域 > 全局原样（命中序与聚合视图的 locals > data 一致）。

**记录条件**：纯路径源（`isSimpleStatePath`）且非分页。表达式源（`items.filter(...)`）与分页切片无稳定状态路径，不记映射（项内 x-field 回退全局解释）；虚拟列表的 index 是原数组真下标，天然正确。

**无陈旧性问题**：x-for 既有铁律「同 key + index 变 → 销毁旧 scope 重建」使 FieldDirective 随 rebind 重新 created → absPath 自动重解析——无需运行期重解析机制（曾被评估为 (a) 的最大成本，被既有机制化解）。

### 二、两阶段渲染事务：所有注销先于所有注册

render 的 Pass 1 改为「决策与复用在循环内，重编译统一延迟」：

```
Pass 1 循环：(A) 复用原地更新 ｜ (B) rebind 收集 ｜ (C) 新建收集
清场阶段：销毁全部 (B) 旧 scope + Pass 2 消失 key 销毁（全部注销）
编译阶段：统一注册 (B) rebind + (C) 新建
Pass 3 重排 / Pass 4 refresh（不变）
```

Pass 2 的销毁**必须在编译阶段之前**——删中间项推挤场景中，后项 rebind 注册会撞上被删项尚未销毁的活条目（错拿 initial）。虚拟列表渲染路径同款两阶段。

### 三、生命周期注销（引用校验删除）

`field.destroy()` 通知 `form.unregisterField(field)`：仅当条目的 `entry.field === field` 时删除条目并 off 其 value/schema watcher（watcher 引用从 formWatchers 数组改存 entry）——两阶段注册间隙内条目可能已被后来者接管，「谁拥有谁删除」。`fieldNames` 逆向表同步清理（值匹配才删）。

### 四、异步数据未就绪：warn 边界（完整修复立后续）

x-field created 期沿链存在「`_data` 未建」的 DataDirective（异步源 in-flight）时按全局路径解析 + warn 一次（控件层经聚合视图照常，表单层错位）。数据晚到不重解析——「挂起注册 + 就绪重解析」牵动 form 中心化注册/快照时序，立独立 ADR 设计。

## 被否决的方案

- **form.reset 改用 autostore `reset(entry)`**（用户初裁，实验三重证伪回退）：
  ① entry 仅支持**对象节点**快照——叶子标量路径（form 字段形态：`g`、`$scopes.5.username`）静默无效；② x-form 域为运行时注入，对象节点也无快照记录（`reset("$scopes.5")` 无效）；③ 域内数组结构变更后整树/子树 reset 把数组键抹成 undefined。无参 `reset()` 虽生效但是全 store 回滚（波及无关域）。维持自管快照 `setVal` 管道；engine 自建 store 的 `resetable:true` 保留（零冲突，上游修复后可 revisit）。
- **运行期重解析 absPath**（(a) 完整形态的成本项）：被 x-for「index 变则销毁重建」铁律化解，无需引入。
- **warn-only**（Q1 选项 b）：用户裁决直接修语义（项内表单层是真实需求）。

## 后果

- **行为变更**：x-for 项内 x-field 的表单层（`$field.value` / reset / getState / dirty / 校验取值）从静默错位变为正确工作；域内字段 reset 不再写根幽灵键。
- **语义边界（文档钉死）**：reset 只回值不回数组结构（删的项不复活、新增项不消失）；索引路径的 schema/configManager 通道仍空白（元数据注入/校验配置不生效，值通道完整）；表达式源/分页切片的项内 x-field 不记映射；reset 的 dirty 基准在 rebind 后重取（基准 = 项就位时）。
- **测试**：`field-write-symmetry.test.ts`（域内对称/项内就位/删项无悬垂/头部插入与互换竞态/异步 warn 边界）。
- **上游依赖**（不阻塞，建议反馈 autostore）：`reset(entry)` 的叶子路径/动态注入/数组结构三重限制。

## 修订记录

- 2026-09-30 初版（含 store.reset 调研否决的实验附录）。
