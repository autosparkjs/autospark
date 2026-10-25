import { AutoSparkDirectiveBase, type RuntimeDirective } from "../features/directive/base";
export declare class ErrorDirective extends AutoSparkDirectiveBase implements RuntimeDirective {
    /** 运行时指令：走 observer 通道（由 engine 级 RuntimeObserverDispatcher 驱动，ADR-0003 决策 7） */
    static readonly kind: 1;
    /** 当前呈现态（单错误槽；未呈现为 null） */
    private _current;
    /** 未注册名的合成透传 descriptor 缓存（按名复用，ADR-0038 决策 4；随实例生死） */
    private _synthetics;
    /** 表达式通道（props/actions）最新求值值 */
    private _exprValues;
    /** error 事件监听（字段箭头函数保证 add/remove 同引用） */
    private _onError;
    /** 元素挂载（dispatcher 检测到 add / 初始扫描）：解析配置 + 挂 error 监听 */
    mounted(): void;
    /** 元素移除（dispatcher 检测到 remove）：清监听 / 清呈现 / off watcher */
    unmounted(): void;
    /**
     * 属性值变化（dispatcher 检测到 setAttribute）：指令值 = 组件名简写，仅影响下次呈现；
     * 若正在呈现则以同错误按新解析链重挂（语义可预期）。
     */
    attrChanged(newVal: string, _oldVal?: string): void;
    /**
     * 静态字面量字段读取（behavior/overlay/errorClass/overlayAt/closeable/retryable）：
     * 成员形态（optionExprs，表达式文本）去引号取字面量 > 整包形态（options，解析期静态值）。
     * 非字面量（表达式）warn 并回退（呈现结构配置不支持状态驱动）。
     */
    private _staticOption;
    /**
     * 表达式通道绑定（props/actions，决策 4）：成员形态 = 全局 store 表达式（collectDependencies
     * 收集依赖后订阅，x-loading `_bindValue` 同款）；整包形态 = 解析期静态值直接取用。
     * 求值异常静默回 undefined（呈现时容错——坏配置不应阻断错误呈现自身）。
     */
    private _bindExprOption;
    /**
     * error 事件捕获（决策 3）：就近消费——捕获即 stopPropagation（含 behavior:none 纯消费），
     * 嵌套时内层优先、外层不再收到。归一化后按 behavior 呈现（单错误槽新替旧）。
     */
    private _handleError;
    /**
     * 呈现错误（单错误槽：先清旧再呈新）。
     *
     * @param error     归一化错误对象
     * @param detail    事件层 detail（含 raise 第二参透传的 props/closeable/retryable/actions）
     * @param triggerEl error 事件 target（retry ctx 的 el）
     * @param retryLoad load 源重试弹药（dispatchLoadError detail.retry）
     */
    private _present;
    /**
     * 清除当前呈现（close 回调 / 新错误替换 / retry resolved / unmounted 共用）：
     * overlay 态 = 销毁块 scope + 回收 $scopes[id] + 移除 DOM（重建式，非 display 隐藏）；
     * addErrorClass 态 = 移除错误 class。
     */
    clear(): void;
    /** behavior 读取（静态字面量；非法值 warn 回退 overlay） */
    private _behavior;
    /**
     * 构建并挂载错误覆盖层（决策 5，x-loading mountOverlay 同款路径）：
     * 组件解析链 options.overlay > 指令值简写 > autospark.error → 深克隆 → compileChild
     * 编译（parentScope = 宿主 scope 继承数据上下文；data 经 initialData 在 compile 前注入）→
     * 壳样式（absolute+inset:0，目标须 relative）→ 挂到 overlayAt 目标 → data-action 点击委托。
     */
    private _mountOverlay;
    /**
     * 解析动作按钮数据视图 `[{name, title, icon?}]`（决策 7）：
     * string 经 getAction 链解析（宿主 scope 链就近 + 全局兜底）；ActionDesc 对象取
     * `name`/`title ?? name`/`icon`；非法元素 warn 剪枝。
     */
    private _actionsData;
    /**
     * retry 语义（决策 7）：action 源以**原 args** 重调失败 action；load 源执行
     * `detail.retry`（= loader.refresh()）——resolved → 自动清除呈现；rejected →
     * 桥接/派发的新 error 事件经单错误槽自然更新呈现（此处无需处理）。
     */
    private _retry;
    /**
     * 取未注册 id 的合成透传 descriptor（ADR-0038 决策 4）：`{id, title:id, handle:(p)=>p}`
     * 经 buildAction 包装（总线 + DOM 双发），按 id 缓存复用。
     */
    private _syntheticAction;
    /**
     * 覆盖层级 click 委托（ADR-0038 决策 3 同款）：块内任意 `data-action="<name>"` 元素点击
     * 即触发——已注册走真 action（getAction 链），未注册走合成透传 descriptor，均以标准
     * AutoSparkActionContext 调用 → buildAction 双通道广播。点击后**不自动清除**——错误呈现
     * 的生命周期归 close / retry / 新错误替换（需要关闭在 actions 里放 "close" 由用户 UI 自行处理）。
     */
    private _onOverlayClick;
}
