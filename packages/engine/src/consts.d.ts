/**
 * 跨层共享的运行时常量（ADR-0093 决策 4）。
 *
 * 只收「被多层引用的全局约定」：框架保留键（state 树上的容器键）、指令属性快捷前缀。
 * 特性私有常量（如 icons 的 SVG 命名空间、symbol 正则）不进，留特性内。
 * 本文件属最底层：不得 import 引擎任何其他模块——3 处运行时下行 Symbol
 * （SCOPES_KEY / META_KEY / LOCAL_PATHS）抽到此文件即解除了编译器 / 覆盖物 / 通知域
 * 对 engine 门面的运行时环。
 * （NOTIFICATIONS_KEY 已随通知插件迁出——@autospark/plugins ADR-0001。）
 */
/** 事件绑定快捷前缀（如 @click） */
export declare const EVENT_PREFIX = "@";
/** 属性绑定快捷前缀（如 :title） */
export declare const BIND_PREFIX = ":";
/**
 * 框架保留键：x-data 默认模式的私有响应式数据域在 store.state 下的容器键。
 *
 * engine 初始化自动注入 store.state[SCOPES_KEY] = {}（不存在时）。每个 x-data scope 的
 * 数据存于 store.state[SCOPES_KEY][scope.id]，借 store 响应式自动更新订阅者
 * （collectDependencies 收集 `$scopes.<id>.<field>` 精准路径，实现字段级细粒度更新）。
 *
 * **保留键**：用户 state 树不得使用 "$scopes" 命名，否则将被 engine 覆盖/冲突。
 */
export declare const SCOPES_KEY = "$scopes";
/**
 * 框架保留键（第三例，ADR-0105）：引擎内部状态的元容器。
 *
 * engine 构造期由 viewport 特性注入 `store.state[META_KEY] = { viewport: "<档名>" }`：
 * 当前视口档位作为全局响应式真相，模板任意位置 `$.viewport` 直接订阅。后续引擎内部
 * 状态数据逐步迁入本容器。
 *
 * **严格保留键**：用户 state 树不得使用 "$"——构造期发现即 warn + delete + 引擎重建；
 * 框架注入对象经 {@link META_MARK} 标记识别（检测有标记即复用，不误删框架所有物）。
 */
export declare const META_KEY = "$";
/** 元容器的框架所有物标记（Symbol 挂注入对象，经 store 代理可读——LOCAL_PATHS 同法） */
export declare const META_MARK: unique symbol;
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
export declare const LOCAL_PATHS: unique symbol;
