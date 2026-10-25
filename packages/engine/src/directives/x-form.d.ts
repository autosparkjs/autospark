import { DataDirective } from "./x-data";
import { type Watcher } from "autostore";
import { type AutoSparkScope } from "../engine/scope";
import type { FieldDirective } from "./x-field";
/**
 * 字段注册条目（x-form 中心化监听的登记单元，ADR-0045 决策 4）。
 *
 * x-field 编译期向所属 x-form 注册，form 统一建立 value / 元数据订阅并分发；
 * entry 承载该字段的快照（reset 回滚用）与桥接副本（error / dirty）。
 */
export interface FormFieldEntry {
    /** 注册者（x-field 实例，逆查 warn / 分发用） */
    field: FieldDirective;
    /** 字段绝对状态路径（从 store.state 根起算，含 `$scopes.<id>.` 前缀） */
    absPath: string;
    /** 注册时的初始值深快照（reset 回滚 + dirty 判定基准） */
    initial: any;
    /** 桥接副本：当前校验错误（store.errors 非响应式，经 value watcher 回调刷新，ADR-0045 决策 5） */
    error: string | undefined;
    /** 桥接副本：字段值是否偏离初始快照 */
    dirty: boolean;
    /** value 订阅（unregisterField 时 off；ADR-0076 生命周期注销——x-for 删项防悬垂） */
    valueWatcher?: Watcher;
    /** schema 元数据订阅（同上；仅 configManager 有该字段 schema 时存在） */
    schemaWatcher?: Watcher;
}
/**
 * 解析简单路径的**绝对状态路径**（从 store.state 根起算）：
 * 路径首段沿 parent 链查找所属容器——命中某层项映射（x-for 的 `item → items.<index>`，
 * ADR-0076）或 `_data`（私有域 / 挂载容器）则拼对应前缀；全链未命中视为全局路径原样返回。
 *
 * 供 x-form / x-field 统一推导字段绝对路径（form 的精准订阅 / 快照 / getState(true) 与
 * 控件形态内部 model 的读写目标都依赖它——绝对路径保证 with 求值与 setVal 写入同位）。
 * 命中序「项映射 > _data」与聚合视图的「locals > data」一致。
 */
export declare function resolveFieldAbsPath(scope: AutoSparkScope, expr: string): string;
/**
 * x-form：表单域指令（仅 `<form>` 元素，ADR-0045）。
 *
 * **表单行为壳**：submit 拦截 + 校验门 + reset 快照回滚 + 元数据中心化监听 + `$form` 注入。
 * 只处理表单逻辑，不处理模板和渲染。
 *
 * ## 状态基座（ADR-0045 决策 1/2）
 *
 * 继承 DataDirective——literal / url / action 三值形态与 `<script type="autospark/data">`
 * stash 消费全额继承；mount **强制 local**（恒私有域 `$scopes[id]`，mount/global 选项拦截 + warn）。
 *
 * ## 值形态终表（决策 2）
 *
 * - `x-form`（空）/ `x-form="{...}"` / url / action：走 x-data 同款数据管道（空值建空域）；
 * - `x-form="login"`（状态路径）：**不建域**——binding.read 命中（`$scopes` 祖先链优先、全局
 *   兜底，聚合视图天然实现该序）即建立**路径上下文**（后代 x-field 相对路径拼接，决策 4），
 *   未命中 warn 后退化为行为壳；此形态下数据脚本 stash 冲突忽略 + warn。
 *
 * ## 中心化监听（决策 4）
 *
 * x-field 编译期注册（`registerField`），form 统一建立并持有订阅，destroy 统一回收：
 * - **value watcher**（`store.watch(absPath)`）：字段值变更 → 刷新 error 副本（errors 非响应式，
 *   但校验只发生在写入路径——value 回调时 errors 已就绪，天然闭环）+ dirty 重算 + refresh；
 * - **schema watcher**（`cm.watch(fullKey, {depth:2})`，schema 存在时）：元数据字面量改写
 *   （enable/visible 等）→ refresh 驱动 `$field` 元数据读取重求值。
 *
 * ## 表单行为（决策 8）
 *
 * - **submit**：恒 `preventDefault`（拦截原生提交，`action` 属性留给无 JS 降级）；
 *   `validateOnSubmit`（默认开）时逐注册字段跑 schema.validate（同步直调）+ `store.errors`
 *   存量检查，任一存在错 → `stopImmediatePropagation` 阻止放行（`@submit` action 不触发）；
 *   校验通过 → 放行后续 listener（action 执行）。form 的 listener 先于 `@submit` 注册
 *  （priority 200 > on 50），`stopImmediatePropagation` 即「校验门」。
 * - **reset**：恒 `preventDefault` + 逐字段 `setVal` 回初始深快照 + 清 error/dirty + refresh
 *  （原生 reset 只重置 DOM 不重置 state，状态驱动架构下必须接管）。
 *
 * ## `$form`（决策 7）
 *
 * 注入宿主 scope 的 locals 层：`getState()`（无参 `{name:值}` / `getState(true)` `{path:value}`）、
 * `valid`、`errors`、`dirty`、`reset()`（与 reset 事件同管道）。均为桥接副本读取
 * （依赖收集不可见），更新经 refresh 驱动重求值。
 */
export declare class FormDirective extends DataDirective {
    /** 注册字段（文档序）；键 = 字段绝对路径（去重：同路径多 x-field 只注册一次订阅） */
    private fields;
    /** 字段名注册表（getState 无参形态的键冲突检测：后者覆盖 + warn，ADR-0045 决策 7） */
    private fieldNames;
    /** 路径形态解析出的相对路径上下文（`x-form="login"` → "login"）；其余形态为 null */
    pathContext: string | null;
    /** 宿主元素事件回调（submit/reset，箭头函数绑定 this 供移除同引用） */
    private onSubmit;
    private onReset;
    /** 事件实际挂载的宿主（容器自身形态下为 engine.el，见 created 宿主修正） */
    private _hostEl;
    /** x-form-options.onInvalid 缓存（submit 校验门的消息回退来源之一） */
    private formOnInvalid;
    created(): void;
    /** mount/global 恒不声明（resolveMode 读不到 → 恒 local，ADR-0045 决策 2） */
    getOption(key: string): any;
    /**
     * x-field 编译期注册（中心化监听入口，ADR-0045 决策 4）。
     *
     * - 同路径重复注册（一个字段多个 x-field 引用）：仅登记 field 引用（订阅一份）；
     * - value watcher：变更 → error 副本刷新（写入即校验，errors 已就绪）+ dirty 重算 + refresh；
     * - schema watcher：configManager 有该字段 schema 时 `cm.watch(fullKey,{depth:2})`——
     *   字面量元数据改写（enable/visible 等）驱动 refresh 重读。
     */
    registerField(field: FieldDirective): FormFieldEntry;
    /**
     * 字段注销（ADR-0076 生命周期对称）：x-field 销毁时移除注册条目——x-for 删项/rebind
     * 会销毁项内字段，不注销则条目悬垂（reset 对已删路径 setVal 会在根上重建幽灵节点、
     * watcher 空转）。**引用校验删除**：仅当条目 field 引用即注销者本人时删除——两阶段
     * rebind 的注册间隙内条目可能已被后来者接管，谁拥有谁删除。
     */
    unregisterField(field: FieldDirective): void;
    /** 字段注册条目读取（$field.error 桥接副本的读取通道；无条目返回 undefined） */
    getFieldEntry(absPath: string): FormFieldEntry | undefined;
    /**
     * 字段名解析（三层链，ADR-0045 决策 7/9）：
     * `x-field-options="{name}"` > `configurable(v,{name})` schema > 路径末段。
     * 注册时检测同名冲突（后者覆盖 + warn，决策 7）。
     */
    resolveFieldName(field: FieldDirective, schema: any): string;
    /** 校验门（决策 8）：schema.validate 同步直调 + store.errors 存量，任一存在错即返回 false */
    private _validateAll;
    private _handleSubmit;
    private _handleReset;
    /**
     * reset 管道（决策 8）：逐字段回初始深快照（拷贝回写，快照不被运行时变更污染）+ 清态 + refresh。
     *
     * 曾评估改用 autostore `reset(absPath)`（ADR-0076 调研），实验三重否决：
     * ① entry 仅支持**对象节点**快照（`deep`/`$scopes.f1` 二层对象生效），叶子标量路径
     *   （`g`、`$scopes.5.username`——form 字段形态）静默无效；② x-form 域为运行时注入，
     *   对象节点也无快照记录（`reset("$scopes.5")` 无效）；③ 域内数组结构变更后整树/子树
     *   reset 会把数组键抹成 undefined。无参 `reset()` 虽生效但是全 store 回滚（波及无关
     *   域与全局）。故维持自管快照管道；engine 自建 store 的 `resetable:true`（engine.ts）
     *   保留——零冲突，未来 autostore 修复上述限制后可 revisit。
     */
    reset(): void;
    /** 桥接刷新：scheduler 微任务内重跑宿主 scope 全部绑定（含后代，ADR-0045 决策 5 refresh 通道） */
    private _scheduleRefresh;
    /** `$form` 上下文对象（决策 7）：桥接副本 getter + 方法 */
    private _buildFormContext;
    destroy(): void;
}
