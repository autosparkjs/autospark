# ADR-0050：x-field 消费 schema toInput/toState——字段的视图转换通道

- **状态**：Accepted（grill-with-docs，三轮十二问）
- **日期**：2026-09-20
- **关联**：[ADR-0045](0045-x-form-and-x-field.md)（x-form/x-field 正身——组合 model、$field Proxy、覆盖链）、[ADR-0020](0020-x-model-metadata-driven.md)（元数据自动注入——schema 侧能力先例）、[ADR-0027](0027-x-model-empty-backfill.md)（空值回填——被 toInput 接管的机制）、[ADR-0026](0026-x-model-select.md)（select 多选逐项管道）、[ADR-0018](0018-x-model-two-way-binding.md)（get/set 表达式——relaxed-json 不支持函数的实证）

## 背景

autostore 的 `AutoStateSchemaBase` 原生定义了 `toInput`/`toState` 元数据键（state↔输入值的双向转换函数，如 `sex: 1 ↔ "男"`），engine 侧此前完全未消费。需求：x-field 让它们生效。

拷问暴露的接缝：① 生效通道（控件形态 model 管道 / 容器形态 $field 读写）；② 与模板侧显式 `get`/`set` 的共存（控件形态的 `set` 被硬编码直写表达式覆写——`set` 无竞争者，实际只有 `get` 需裁决）；③ checkbox 是否参与（布尔语义 vs state 存 1/0 的诉求）；④ 空值喂不喂 toInput、ADR-0027 default 回填是否仍在管道里；⑤ 函数的来源与响应式边界；⑥ 失败语义。

## 决策

### 1. 全通道生效；`$field.value` 语义改为「字段输入值」

控件形态（内部 model 读写管道）与容器形态（`$field.value` getter/setter、`onInput`/`onChange` handler）全部接入。getter 过 toInput、setter 过 toState——`x-bind="$field"` 展开喂控件自动正确，`{{ $field.value }}` 插值显示「男」符合直觉。未声明转换时即状态值，行为零变化。CONTEXT.md 的 `$field` 词条由「字段状态值」修订为「字段输入值」。

### 2. 显式 `get` 优先；toState 无竞争者

`get` 与 toInput 同槽同职责，同存时模板侧赢（不叠加、不 warn）——与 ADR-0019 Q13「显式绑定优先抑制合成」哲学一致。写方向无对应问题：x-field 控件形态的 `set` 恒为直写表达式（ADR-0045），用户的 `set` 本就不生效，toState 落在直写之前。

### 3. 管道位置：读同槽、写走统一出口

- **读**：`state → [get | toInput] → 写控件`——toInput 占据 get 的同一插槽（二者互斥，决策 2）。
- **写**：`el.value/checked → 修饰符(.trim/.number/.boolean) → toState → 写 state`——修饰符（输入规范化）在前，toState（业务转换）在后。落点 = `_writeToState` 统一出口**入口处**：用户输入、select autoSelect 回写、多选过滤回写自动全覆盖，无需逐处补丁。
- **数组逐项**（select multiple）：对齐 ADR-0026 决策 8 的逐项修饰符管道。

### 4. 全部 ControlKind 参与含 checkbox

- **checkbox 写方向**：读恒 `el.checked` 布尔，toState 是让 state 存 `1/0` 而非 `true/false` 的**唯一**通道（修饰符管道对 checkbox 本就空转）；
- **checkbox 读方向**：`state → toInput → Boolean() coerce → el.checked`——coerce 行为不变，约束落在文档：「toInput 须返回经 Boolean() 能得到正确勾选态的值」；
- radio/select：toInput 产物须与 option.value（字符串）严格 `===` 匹配——数字 state ↔ 字符串 option 的类型鸿沟正是 toInput 的解药（mismatch warn 的补救提示已增补 toInput）。

### 5. 空值接管：声明 toInput 即空值处理权开关（核心语义）

- toInput **恒被调用**（`undefined`/`null`/`NaN` 照喂）——空值处理是用户函数的职责（`v => v===1?'男':v===0?'女':''` 天然兜住）；
- **声明 toInput → ADR-0027 空值逻辑整体退出**：default 回填、select 首项兜底均不参与，toInput 产物直出控件（「未知」这类显示完全归用户函数）；
- **未声明 → ADR-0027 全套照旧**（空值判定 → default 回填），行为与历史完全一致；
- **写方向恒喂 toState 不判空**：空串是合法输入（清空字段），空值语义由用户函数自决（如 `v => v === '' ? null : v`）。

### 6. 来源 schema only；created 期静态缓存

函数字面量进不了 relaxed-json（ADR-0018 实证），`x-field-options` 属性路径无法承载——覆盖链（决策 9）对函数键不延伸，来源仅 configurable schema。created 期静态读取缓存（同 `_schemaDefault` 模式）：schema 后注册、函数热替换不生效，与 `synthesizeSchemaBindings`「牺牲后注册动态性换静默」取舍一致。能力保持 x-field 专属（x-model 模板侧无函数入口），但钩子实现在 model 层（决策 7），为将来留口。

### 7. 失败不破坏 + 防循环标志回滚

用户函数 throw → warn（per-instance 去重一次）后：
- **读方向**：该项回退原值（数组逐项回退），不切回框架兜底（warn 已出声，行为可预测）；
- **写方向**：放弃**整次**写入（数组任一项失败即整体放弃）——对齐 set 求值失败、validate throw 的既有「warn 不写不打断」语义；
- **实现时序要点**：写方向放弃时**必须回滚 `_selfWriting` 标志**——调用方（`_handleInput`/autoSelect 回写）先置位再进 `_writeToState`，不回滚会误吞下一次外部变更的 read 回调（显示与 state 分叉一次）。

### 8. form 层恒原始状态值

`$form.getState()`/`dirty`/初始快照/reset 均用原始值——toInput/toState 是视图转换，不改状态真相；转换后落盘值才进 validate 校验。

### 9. 实现落点：ModelDirective 公开注入点 + 共享工具

- `ModelDirective.toInputFn`/`toStateFn` 公开字段：FieldDirective 控件形态组合注入（created 前赋值）；读插槽在 `writeToDom`（get 分支旁）、写插槽在 `_writeToState` 入口；
- 容器形态不组合 model：FieldDirective 侧 `_applyToInput`/`_applyToState` 直连 `$field.value` getter/setter、handler、spread 的 `checked` 键（`toInput → Boolean`，与控件形态读方向同构）;
- 转换语义（逐项、失败、ABORT 哨兵）内聚 `directives/utils/schema-fn.ts` 单一真相源，两处共用。

## 后果

- `$field.value` 语义随声明分叉（输入值/状态值）——文档与 CONTEXT.md 已写明「未声明即状态值」；依赖 `$field.value` 拿原始值的模板在 schema 声明 toInput 后需改用 `toInput` 逆变换意识。
- radio/select 的 toInput 产物、checkbox 的 Boolean 可转换性是**文档约束**而非运行时强制——声明错误表现为不勾中 + 既有 mismatch warn 出声。
- schema 后注册/函数热替换静默不生效——与全部既有 schema 元数据键（default/autoSelect/choices…）同一取舍。
- autoSelect 与 toState 组合时字段应**成对声明** toInput/toState：toState 写回非字符串后，读方向靠 toInput 桥接回选项集（实测缺 toInput 会触发 mismatch warn + 不勾中）。
