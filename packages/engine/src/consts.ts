/**
 * 跨层共享的运行时常量（ADR-0093 决策 4）。
 *
 * 只收「被多层引用的全局约定」：框架保留键（state 树上的容器键）、指令属性快捷前缀。
 * 特性私有常量（如 icons 的 SVG 命名空间、symbol 正则）不进，留特性内。
 * 本文件属最底层：不得 import 引擎任何其他模块——3 处运行时下行 Symbol
 * （SCOPES_KEY / MESSAGES_KEY / LOCAL_PATHS）抽到此文件即解除了编译器 / 覆盖物 /
 * 消息域对 engine 门面的运行时环。
 */

/** 事件绑定快捷前缀（如 @click） */
export const EVENT_PREFIX = "@";
/** 属性绑定快捷前缀（如 :title） */
export const BIND_PREFIX = ":";

/**
 * 框架保留键：x-data 默认模式的私有响应式数据域在 store.state 下的容器键。
 *
 * engine 初始化自动注入 store.state[SCOPES_KEY] = {}（不存在时）。每个 x-data scope 的
 * 数据存于 store.state[SCOPES_KEY][scope.id]，借 store 响应式自动更新订阅者
 * （collectDependencies 收集 `$scopes.<id>.<field>` 精准路径，实现字段级细粒度更新）。
 *
 * **保留键**：用户 state 树不得使用 "$scopes" 命名，否则将被 engine 覆盖/冲突。
 */
export const SCOPES_KEY = "$scopes";

/**
 * 框架保留键（第二例，ADR-0072）：全局消息子系统的状态暴露容器。
 *
 * MessageManager 构造时注入 `store.state[MESSAGES_KEY] = { items, options }`：
 * - `items`：记录镜像（`shallow(items, 1)`——AutoSparkMessage 纯数据，写通道仅 manager，
 *   模板直写为违约自理）；
 * - `options`：生效全局配置**真身**（可直写——运行时修改对后续操作生效、已展示卡片不回溯）。
 *
 * **保留键**：用户 state 树不得使用 "$messages" 命名，否则将被 engine 覆盖/冲突。
 */
export const MESSAGES_KEY = "$messages";

/**
 * 项局部变量→绝对状态段映射的载体键（ADR-0076）：x-for 在项 localData 上挂
 * `{ [itemName]: ["items", "0"] }` 形态的映射，供 x-field 的 resolveFieldAbsPath
 * 沿 scope 链把 `item.name` 反解为 `items.0.name`（项内字段的表单层——reset/
 * getState/校验——依赖绝对路径读写同位）。
 *
 * 用 Symbol 而非字符串键：不进聚合视图的 string 键命中分支（Proxy get 陷阱仅拦截
 * string 键），也不被 Object.assign 复用更新冲掉。挂在 localData（先于成员 scope
 * 构造）而非 scope 上，保证嵌套 x-for 的内层 created 期能沿链读到外层映射。
 * 仅纯路径源 + 非分页模式记录（表达式源/分页切片无稳定状态路径，不记 → 项内
 * x-field 回退全局路径解释 + warn）。
 */
export const LOCAL_PATHS = Symbol("autospark.localPaths");
