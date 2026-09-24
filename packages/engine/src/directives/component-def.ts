import type { AutoSparkScope } from "../scope";
import type { StyleBind } from "../utils/styleBind";

/**
 * 组件数据视图基准名（ADR-0053；原 `ComponentScopeBasis` 更名——`scope` 与 x-scope/AutoSparkScope
 * 撞名，配置键同步更名 `dataContext`）。
 *
 * `open` 开放边界后，实例数据视图继承哪个上下文：
 * - `'host'`：**消费处**上下文（实例 scope 的结构 parent 链，≈ 封闭化之前的既有行为）；
 * - `'declarer'`：**声明处**上下文（词法基准——组件读它声明处所能见的域，与消费处无关）。
 */
export type ComponentDataContext = "host" | "declarer";

/**
 * 组件实例的数据基准（ADR-0053）：x-component 实例化时经解析链得出的最终形态。
 *
 * - `'closed'`：封闭（默认）——实例只见自身 data/locals/props + 全局 state；
 * - `'host'` / `'declarer'`：开放，按基准继承上下文。
 */
export type ComponentDataBasis = "closed" | ComponentDataContext;

/**
 * 组件定义的生命周期钩子集合（ADR-0022 决策三）。
 *
 * 四阶段钩子，实例化时从 `<script setup>` 求值结果中按名收集为数组，串行调用（try-catch 容错，
 * 单个失败不影响其余）。挂到实例 scope 的 `hooks` 字段，由 compileChild 实例化流程在对应阶段触发。
 *
 * **砍掉的钩子**（与本引擎架构不契合）：
 * - `activated`/`deactivated`：引擎无组件实例缓存层（scope 销毁即销毁），无自然触发点。
 * - `beforeUpdate`/`updated`：细粒度响应式无"组件整体重渲染"节点。
 */
export type ComponentHookPhase = "created" | "mounted" | "beforeUnmount" | "unmounted";

/**
 * 组件实例 methods 执行时的 this 上下文（ADR-0022 决策二-3；ADR-0057 数据模型 v2）。
 *
 * 复用 `AutoSparkActionContext` 形态——`data` 是 `scope.getContext()` 聚合视图（组件自有
 * data+props 为自有层，聚合范围受 open/封闭边界控制），`props` 是 `data` 的等价别名，
 * `globalState` 是全局 `engine.store.state` 无遮蔽通道。组件 methods 由 x-on 的 action
 * 求值器（`on/eval.ts`）经 `scope.getMethodThis()` 的 Proxy 调用。
 *
 * 本接口与 `AutoSparkActionContext` 字段一致，单独声明以表达"组件 methods 的 this"语义。
 */
export interface ComponentMethodContext {
    /** 触发元素（x-on 的目标元素，组件内任意指令元素） */
    el: HTMLElement;
    /** 原生事件（仅 x-on 场景有值） */
    $event?: Event;
    /** 组件聚合数据视图（自有 data+props → 祖先近层 → 全局 state），响应式、可写 */
    data: Record<string, any>;
    /** `data` 的完全等价别名（同一聚合视图引用）；props 注入键位于聚合的自有层 */
    props: Record<string, any>;
    /** 全局状态（engine.store.state）——聚合视图同名键自有层优先遮蔽，取全局值用此通道 */
    globalState: Record<string, any>;
    /** 当前 scope */
    scope: AutoSparkScope;
    [key: string]: any;
}

/**
 * `<script setup>` 对象字面量求值后的标准形态（ADR-0022 决策四-1/2；数据模型 v2 见 ADR-0057）。
 *
 * 由 `new Function('return ' + scriptText)()` 求值得到。多个 `<script setup>` 按段分类合并
 * （`data` 工厂/对象分类收集、实例化时产生 per-instance 值；`methods` 浅合并；`locals` 浅合并；
 * 同名 hooks 串行）。setup **顶层其余键**（非保留键）收进 `locals`（组件私有变量）。
 *
 * - `data`：组件初始**响应式数据**（ADR-0057 回归 data 名，更名自 state()）——对象字面量
 *   （per-instance 深克隆）或工厂函数（每实例调用一次），注入 `scope._data` 响应式域，
 *   **先于** x-component props、后者同名覆盖。
 * - `methods`：组件方法对象（this=ComponentMethodContext）。
 * - `locals`：组件实例的**非响应式私有变量**（HTML 形式即 setup 顶层键，程序化定义用此字段；
 *   注入 `scope._locals`）。
 * - `created`/`mounted`/`beforeUnmount`/`unmounted`：四阶段生命周期钩子函数。
 */
export interface ComponentSetup {
    /**
     * 组件响应式数据（ADR-0057 更名自 state()，双形态）：对象字面量或工厂函数。
     * 注入 `scope._data` 响应式域（模板表达式可见、改动驱动更新），**先于** x-component props
     * 注入、后者同名覆盖。对象字面量实例化时深克隆（多实例不共享引用）；工厂每实例调用一次。
     */
    data?: Record<string, any> | (() => Record<string, any>);
    methods?: Record<string, (...args: any[]) => any>;
    /**
     * 组件实例的非响应式私有变量（ADR-0057；HTML 形式为 setup 顶层非保留键的收集结果）。
     *
     * 注入 `scope._locals`（普通对象、**不进聚合视图**）——模板表达式 `{{x}}` 读不到，仅经
     * Proxy this 的 `this.<key>` 访问（method/framework key/_data 优先级高于 _locals）。
     * 典型用途：定时器句柄、缓存、防抖标记等实例内部数据。多 `<script setup>` **浅合并**；
     * 与内置上下文键（props/globalState/engine/scope/el/$parent）重名时 warn + 忽略。
     */
    locals?: Record<string, any>;
    created?: () => void;
    mounted?: () => void;
    beforeUnmount?: () => void;
    unmounted?: () => void;
}

/**
 * 合并后的组件钩子表：每阶段一个函数数组（多个 `<script setup>` 同名 hook 串行）。
 */
export type ComponentHooks = Record<ComponentHookPhase, Array<() => void>>;

/**
 * 组件定义（ADR-0022 决策二-1）。
 *
 * compiler 前置 transformer 命中 x-define 元素时，提取其 `<script setup>` / `<style>` 子节点、
 * 求值合并 setup、深克隆剩余 DOM 为冻结快照，组装成本对象。
 *
 * `getComponent(name)` 返回 HTMLElement 快照（保持 x-loading 等消费者契约不变）；ComponentDef 的额外
 * 元数据（setup/hooks/styles）经 engine 的 `_componentDefs`（WeakMap，以快照根为 key）反查，供 x-component
 * 实例化时取用。
 *
 * **嵌套私有子组件无需定义链**：x-component 实例化父组件 A 时 `compileSubtree` 编译 A 快照子树，内层
 * `x-define="B"` 经 transformElement 再次命中收集器，B 归属到 **A 的实例 scope**
 * （`A实例scope.components`）——运行期 scope 链天然实现严格私有（U5=A），不需定义 scope 链。
 */
export interface ComponentDef {
    /** 组件名（无值 x-define 取 "default"） */
    name: string;
    /** 冻结快照根元素（深克隆、保留指令属性、**已移除** `<script setup>`/`<style>` 子节点、未编译） */
    snapshot: HTMLElement;
    /** 合并后的 setup（data、methods、locals）；无 `<script setup>` 时为 undefined */
    setup: ComponentSetup | undefined;
    /** 合并后的钩子表（从 setup 提取，实例化时克隆到 scope.hooks）；无钩子时为 undefined */
    hooks: ComponentHooks | undefined;
    /** 合并后的组件作用域 CSS 文本数组（每个 `<style>` 一项，**已提取 bind** 后的改写文本）；无 `<style>` 时为 undefined */
    styles: string[] | undefined;
    /**
     * 响应式 `<style>` bind 清单（ADR-0022 决策四-4.1）。
     *
     * 编译期 `extractStyleBinds` 从 `<style>` 声明值的 `bind(expr)` 提取、跨块按 expr 全局去重，
     * 派生 CSS 变量名（纯路径 → `--{路径}`，表达式 → `--h{hash}`）。声明性清单，多实例共享只读、无实例状态。
     * 实例化期（`instantiateComponent`）遍历此清单调 `hostScope.watch(expr)`，求值结果写入组件根元素的
     * CSS 变量（每实例独立）；null/undefined 不写、走 `var(--name, unset)` 回退。无 bind 时为 undefined。
     */
    styleBinds: StyleBind[] | undefined;
    /**
     * 数据边界开关（ADR-0053）：true = 开放数据边界（实例上下文按 `dataContext` 继承）。
     * 缺省 = **封闭**——实例只见自身 data()/locals、x-component props 与全局 state。
     * 声明侧专属契约：`x-define.open` 修饰符或 `x-define-options="{open:true}"`；
     * 消费侧（x-component-options）只能覆盖已开放组件的基准，不能打开封闭组件。
     */
    open?: boolean;
    /**
     * 开放状态下的数据视图基准（ADR-0053）：`'host'`（默认，消费处上下文）| `'declarer'`（声明处上下文）。
     * 仅 `open` 为 true 时有意义；解析期已校验合法值，`dataContext` 声明而无 `open` 时 warn + 忽略（保持 undefined）。
     */
    dataContext?: ComponentDataContext;
    /**
     * 声明处 scope（ADR-0053 declarer 基准的数据视图挂链目标）：收集时归属的最近祖先 scope。
     * 全局组件（options.components 字符串，无声明 scope）为 null/缺省——declarer 基准首次实例化时
     * 退化为封闭行为 + warn。嵌套私有组件的声明 scope 是外层组件的**实例 scope**（运行期 scope 链）。
     */
    declarerScope?: AutoSparkScope | null;
    /**
     * 插槽出口清单（ADR-0056）：编译期从模板自动推断的出口名列表（裸 `x-slot` 记 `"default"`）。
     *
     * 由 `buildComponentDef` 扫描快照后代的 `x-slot*` 标记收集；无出口时为 undefined。
     * 内容侧收集（`collectSlotContent`）按此清单校验——无对应出口的段 warn + 丢弃。
     * 声明侧不做运行时校验（首个出口胜出，重复者剥属性）。
     */
    slots?: string[];
}
