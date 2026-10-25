import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * x-html：将状态值作为原始 HTML 注入元素的 innerHTML。（**默认消毒**，见 ADR-0005）
 *
 * 与 x-text 同构：`created` 经 `scope.watch` 订阅（纯路径走精准 watch，表达式走
 * collectDependencies），用返回的当前值首渲；后续变化由 scheduler 微任务合并后 patch。
 * 差别仅 patch 写 `innerHTML`（解析为 DOM），而非 x-text 的 `textContent`（转义文本）。
 *
 * **安全姿态（safe-by-default）**：默认经 `engine.options.sanitizer`（缺省 = 内置极简
 * `sanitizeHtml`，剥 `<script>`、`on*` 事件属性、危险协议 URL）消毒后再写 innerHTML——与本引擎 `{{}}`
 * 插值默认 XSS 安全（ADR-0004 决策 6）的哲学一致。注入**受信内容**时用 `.raw` 修饰符
 * 退出消毒、原样写入：`<div x-html.raw="trustedHtml"></div>`。
 *
 * **空值占位（ADR-0014）**：与 x-text 同构——`emptyValues`（默认 `[null, undefined, NaN]`）内的值
 * 渲染 `empty` 占位（默认空串，**也过 sanitize**）；`.hide` 修饰符空值隐藏宿主。空值/隐藏逻辑与
 * x-text 共享 `createEmptyRenderer`，差别仅写内容走 `innerHTML`（± sanitize）。
 *
 * **默认不编译注入内容**：注入 HTML 为静态快照，不递归走转换器/不建 scope/不注册 watcher。
 *
 * **`.compile` 修饰符（ADR-0017）**：反转上述定位——把绑定值作为**子模板编译执行**。
 * 注入内容写回 `scope.template` 后调 `recompileSubtree`，建 scope/watcher、继承宿主作用域
 * （localData/data 经 `_linkParent` 自动传递），支持嵌套 x-data/x-for/x-if，与正常模板一致。
 * - **隐式强制跳过消毒**（sanitize 会剥 x-* 指令属性致模板失效），安全等级**高于 `.raw`**：
 *   `.raw` 的 `<script>` 经 innerHTML 不执行，`.compile` 注入的 `x-on` 会真实绑定执行——须确保来源可信。
 * - 每次值变全量销毁旧子树 + 重编译（无 diff）；空值销毁子树 + 清空宿主、忽略 `empty` 文案
 *   （结构空状态无文案占位语义），`.hide` 仍生效。
 * - **样式通道（组件样式管线复用，ADR-0022 决策四 / ADR-0087）**：注入内容中的 `<style>`
 *   按组件同款语义处理——非 global 段提取出模板树，`bind()` 提取为 CSS 变量订阅后经
 *   `rewriteScopedCss` 改写注入 head（宿主 + 编译后代打 `data-cmp-{实例id}`，id 为指令实例级
 *   `getId()` 随机串——bind 变量挂各自宿主，样式表不跨实例共享）；`<style global>` 留模板
 *   原位置随子树编译进结果 DOM（浏览器原生全局生效，随子树重编译回收；global 段 bind 告警
 *   姿态同组件 ADR-0087）。空值 / destroy 同步回收样式表与 bind watcher。
 *
 * **远程异步 HTML 源（ADR-0035 / ADR-0122）**：值以 url 前缀（`/`、`//`、`http(s)://`、`./`、`../`）或
 * `标识符(实参)`（**必须带调用括号**——裸词恒为表达式读状态键，与 x-data 判定的关键差异）
 * 开头即异步形态：url 经 fetch `res.text()` 直取、action 经 getAction 链执行（返回非字符串
 * 按加载失败处理），产物按上述既有双通道消费（默认模式写 innerHTML **维持默认消毒**——
 * 远程比本地更不可信；`.compile` 模式作为远程模板编译）。url `{expr}` 单括号插值依赖变化
 * 自动重取（保旧值不闪断、竞态按序号丢弃、destroy 中止）。反馈三件套：元键注入（`$loading`/`$error`
 * 写宿主 scope locals，模板直读）+ 合成 `x-loading` 字面量切换（`"true"`/`"false"`，
 * 经 attrChanged 驱动显隐）+ 用户可用 x-if/x-else-if/x-else 做条件渲染。同元素双异步
 * （异步 x-data + 异步 x-html）时视觉通道归 x-html 独占（x-data 不合成 overlay）。
 * 合成协议（守卫 / 所有权闸 / options 透传 / 显隐）与元键注入走共享层（ADR-0126）。
 *
 * **与 x-text 同元素**：x-html 确定性胜出（x-text 让步 no-op，见 ADR-0005 决策 6）。
 *
 * **`<script>` 不执行**：`innerHTML=` 本就不执行脚本（浏览器约束），默认消毒还会剥除。
 */
export declare class HtmlDirective extends AutoSparkDirectiveBase {
    static readonly priority = 0;
    static readonly singleton = true;
    created(): void;
    /**
     * 默认模式：把绑定值作为原始 HTML 写入 innerHTML（± sanitize + 空值占位）。
     *
     * `.raw` 退出消毒；否则用 engine 注入的 sanitizer，缺省回退内置极简 `sanitizeHtml`。
     * 空值/隐藏逻辑与 x-text 共享 `createEmptyRenderer`（ADR-0007 决策 1，统一经 getOption 读取）。
     */
    private _createdDefault;
    /**
     * `.compile` 模式：把绑定值作为子模板编译进宿主子树（ADR-0017）。
     *
     * 与默认模式的差异：
     * - **不消毒**：compile 隐式强制跳过 sanitize（sanitize 会剥 `x-on`/`@*`/`:*` 指令属性致模板失效）。
     * - **作为子模板编译**：写回 `this.template.innerHTML` 后调 `recompileSubtree`，建 scope +
     *   watcher + 绑定（反转 x-html「不编译注入内容」的原定位）。
     * - **空值**：清空 template → recompileSubtree 销毁旧子树 + 清空 el，忽略 `empty` 文案
     *   （结构空状态无文案占位语义）。
     * - **`.hide`**：仍生效（控宿主可见性，与内容来源正交）。
     *
     * `template` 是共享模板树元素，写回即污染（设计要求，ADR-0017）：编译器的 `_linkParent` 靠
     * 模板树位置继承作用域，离树编译会断链。
     */
    private _createdCompile;
    /** 实例级 scoped 作用域 id（首次注入时生成，实例内稳定——重取/值变复用同一属性后缀与样式表 id） */
    private styleScopeId;
    /** 本轮注入的 scoped 样式表（head 级，值变 replace / 空值 / destroy 时移除） */
    private styleEl;
    /** 本轮 bind 订阅的 watcher（宿主 scope 无「内容级」销毁时机，指令自持换血防孤儿累积） */
    private bindWatchers;
    /** 本轮已写入宿主的 CSS 变量名（释放时 removeProperty——变量无规则引用后是纯脏数据） */
    private bindVarNames;
    /**
     * 注入内容统一编译入口（`.compile` 同步通道与远程异步通道共用）：
     * 写回 template → 提取样式 → recompileSubtree → 挂载 scoped 样式与 bind 订阅。
     */
    private _compileInjected;
    /**
     * 样式提取（写回 template 后、recompileSubtree 前——结果树由模板树克隆而来）：
     * - 非 global `<style>`：摘出模板树（不进结果 DOM），`bind()` 提取为 CSS 变量清单后
     *   交 `_mountStyles` 改写注入 head（组件同款管线）；
     * - `<style global>`：**留模板原位置**、剥 `global` 属性（语义已被本通道消费，剥除避免
     *   误触编译器「global 仅 x-define 生效」告警），随子树编译进结果 DOM 浏览器原生全局生效
     *   ——随子树重编译自然回收，与组件「注册期注入 head 永驻」有意分歧（内容是动态的）。
     */
    private _extractStyles;
    /**
     * 挂载本轮样式：换血（释放上一轮样式表 + off 旧 bind watcher）→ 打 scoped 属性 →
     * 注入改写样式（head）→ 建 bind 订阅（变量挂宿主 el，宿主 scope 求值——祖先 x-data 可读，
     * 与普通模板同一数据视图）。
     */
    private _mountStyles;
    /** 释放样式资源：off 并摘出本轮 bind watcher + 移除 scoped 样式表 + 清宿主 CSS 变量 */
    private _releaseStyles;
    /** 共享取数执行器（ADR-0035 决策 5）：本指令只消费回调（text 校验 / 双通道注入 / 反馈） */
    private runner;
    /** 在途请求标志（onLoading/onResult/onError 维护）——元键 $loading 写入依据 */
    private loading;
    /** 最近一次失败（新一轮请求发起时清空，对应 x-data「发起时清 $error」语义） */
    private lastError;
    /** 首次成功注入标志（保留：重取保旧值不闪断语义的判定依据之一） */
    private hasArrived;
    /** destroy 后拒收一切在途结果 */
    private destroyed;
    /** 合成遮罩句柄（ADR-0126 共享层）：守卫 / 所有权闸 / toggle 显隐状态内聚 */
    private loadingMask;
    /**
     * 异步形态初始化（ADR-0035 / ADR-0122）：x-loading 合成（ADR-0122：无互斥，恒合成）→
     * runner 首取 + 依赖 watch。元键 $loading/$error 经 runner 回调注入宿主 locals。
     */
    private _createdAsync;
    /**
     * 请求发起：在途置位 + 清上一轮失败 + 元键注入（$loading=true, $error=undefined）。
     *
     * x-loading 覆盖层合成协议（ADR-0035 决策 3 / ADR-0122 决策 3 / ADR-0126 共享层）：合成
     * `x-loading` 字面量属性（Runtime 指令属性保留在结果 DOM，值切换 `"true"`/`"false"` 经
     * attrChanged 驱动显隐）。ADR-0122 移除「有 x-fallback 不合成」互斥默认与双异步让位——
     * 恒合成，仅 `loading:false` 恒关、宿主手写 x-loading 不叠加（守卫 + 所有权闸状态机见
     * {@link createLoadingMask}）。字符串形态 → `message` 包装透传（ADR-0126 决策 2 词汇对齐）。
     */
    private _beginLoad;
    /**
     * 元键注入宿主 scope locals（ADR-0122 决策 2，ADR-0126 起走共享层
     * {@link injectLoadMeta}）：`$loading`/`$error` 为普通对象字段，经 scope 链对子树可见
     * （locals 优先级最高）。
     *
     * 注意：只刷新子 scope，不刷宿主 scope 自身——宿主 scope 上的 AsyncSourceRunner watcher
     * 监听 args 数据依赖，不应被 $loading/$error 变化触发，否则会形成
     * _setMeta → refresh → invokeAction → _beginLoad → _setMeta 的死循环。
     */
    private _setMeta;
    /**
     * 产物到达（决策 2）：text-only——非字符串（action 返回对象/数字等）按加载失败处理
     * （与 x-data 对象-only 姿态对称：产物类型不符是 bug 信号，注入垃圾比显示错误更糟）。
     * 空串照既有语义清空宿主（空串不在默认 emptyValues 内，同步行为照旧）。
     */
    private _arrive;
    /** 加载失败：warn + 保旧值（不写内容）+ 元键落地（$error） */
    private _fail;
    destroy(): void;
}
