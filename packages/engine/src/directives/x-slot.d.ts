import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * x-slot：插槽出口（ADR-0056）。
 *
 * 出现在**组件模板**内，声明内容投影的出口位置：
 * - `x-slot:header` / 裸 `x-slot`（= 默认出口 `"default"`）——属性参数承载出口名；
 * - 标记元素保留为真实包裹层（不剥标签）——出口位置即 DOM 位置；
 * - 出口子树 = **fallback**（无对应内容时在组件作用域编译）；
 * - 有对应内容时由内容侧投影填充，内容在**调用方作用域链**求值（不受 ADR-0053 封闭边界约束）；
 * - 作用域形参（出口值=对象字面量、内容值=解构简式）经共享 `locals` 容器注入 + `refresh` 刷新。
 *
 * 内容 map 沿 parent 链**就近**查找（嵌套组件各持独立 map）。持有者由 component/overlay
 * 的 `_instantiate` 懒收集后 stash。例外——插槽转发（ADR-0125）：持有者带
 * `x-component-options.slots` 声明时，名字按声明翻译（显式映射或 `*` 原名）继续上溯，
 * 每级持有者各自翻译逐级接力；并存降级（决策六）——持有者对本名声明转发时其直供段
 * 降级为回退候选（走完链无终局命中时最外层候选兜底），未声明名直供段恒优先。
 *
 * `ownsChildren`：出口子树不进通用 walk——由本指令在 compile 中选择「投影内容」或
 * 「fallback 编译」二选一，避免双重编译。
 *
 * 动态出口名（ADR-0107）：裸 `x-slot="表达式"` 值承名——求值为字符串即出口名；求值为
 * `{ name, params }` 对象则 name 为出口名、params 即形参取值表达式（单一值通道双形态
 * 分流）。名在 created 编译期求值一次静态绑定（不响应式，名变化靠 x-for 重建）；
 * params 走既有 watch 通道保持响应式。无效名 warn + fallback；动态出口不可消费 live
 * 活体段（warn + fallback，活体段仅静态出口可直挂）。
 *
 * 传递绑定（ADR-0108）：内容段携带 `bindingsExpr`（内容侧 `x-slot.bind` 载体）时，
 * 在**调用方作用域** watch 并以 x-bind 展开语义应用到出口元素（调用方赢：出口静态
 * 属性不做 reservedKeys 恒赢）。`.bind` 修饰符写在出口侧无意义 → warn 引导；
 * 裸 `x-slot.bind` 的值仍按动态出口名消费（ADR-0107 向后兼容）。
 */
export declare class SlotDirective extends AutoSparkDirectiveBase {
    /**
     * 介于结构指令（isolate=90/if=80/for=100）之下、component(70)/bind(50) 之间：
     * 出口填充在兄弟普通指令前完成，与 component 实例化错层（不同元素）。
     */
    static readonly priority = 65;
    static readonly singleton = true;
    /** 出口子树 = fallback 或投影内容，均不进通用 walk（ADR-0056 决策八） */
    static ownsChildren(): boolean;
    /** 命中的内容段（null = 无内容，走 fallback） */
    private content;
    /** 内容的调用方基准 scope（内容 scope 的 parent） */
    private callerScope;
    /** 形参容器（与内容 scope.locals 共享引用；出口侧 watch 后原地刷新） */
    private paramData;
    /** 已编译的内容 scopes（destroy 回收；幂等） */
    private contentScopes;
    /** 动态名出口的编译期解析结果（ADR-0107）：null = 静态名模式或无效名 */
    private dynamicResolved;
    /** 动态名求值结果非法（ADR-0107 决策八）：恒按无内容处理（fallback），不写 data-slot */
    private dynamicInvalid;
    /** 出口名（名段重组后，ADR-0124）：compile 期写 data-slot 用 */
    private resolvedAttrName;
    created(): void;
    compile(): void;
    /**
     * 构造 super 句柄（ADR-0084）：内容子树内 x-super 标记的惰性 fallback 编译入口。
     *
     * 每次调用经 `compiler.compileSuperFallback` 在**出口 binding（组件作用域）**链上
     * 独立编译一份（同段多次出现各自展开、各挂各的 watcher）；fallback 事实源与既有
     * fallback 编译路径一致（普通出口 `childNodes` / `<template>` 出口 `.content`，
     * 继承覆盖已替换快照 → 天然展开继承覆盖层）；出口无 fallback 子树 → 静默空（Q8）。
     * 产物 scopes 的销毁：parent=出口 binding 级联 + SuperDirective.destroy 兜底（幂等）。
     */
    private _makeSuperInlet;
    /**
     * 应用内容侧传递绑定（ADR-0108）：`x-slot.bind` 表达式在**调用方作用域链**求值
     * （depth:2 键级响应，与 x-bind 展开同款订阅粒度），以 SpreadBinder 展开到出口元素。
     *
     * - 跨组件优先级：调用方赢——`template: null` 不收集出口静态属性的 reservedKeys
     *   恒赢集，出口自身静态属性可被覆盖；class/style 走既有 diff 合并（组件侧 token 保留、
     *   调用方追加/覆盖）。
     * - watch 挂 callerScope（watcher 由 scope 持有、随调用方卸载回收）；出口 destroy 后
     *   以 `this.content === null` 短路，回调空转、不再写已分离的出口元素。
     * - live 段恒无 bindingsExpr（引擎编程式构造），自然跳过。
     */
    private _applyCallerBindings;
    /**
     * 出口值变化 → 形参容器原地更新 + 内容 scope 刷新（x-for 复用先例，ADR-0056 假设③）。
     *
     * `paramData` 引用永不替换（内容 scope.locals 已绑定该引用）；对象按 `paramData`
     * 键 `Object.assign`，非对象清空为 undefined。contentScopes 在 compile 后才填充——
     * created 期首调 refresh 为空操作，初值已就位供首次编译读取。
     */
    private _applyParams;
    destroy(): void;
}
