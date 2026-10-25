/**
 * x-slot 插槽标记识别与内容收集（ADR-0056）。
 *
 * 纯函数层：不依赖 engine/scope（`import type` 仅类型层、零运行时依赖），供 collect
 * （出口清单）、component/overlay（内容收集）与 SlotDirective（标记解析）共用。
 *
 * 两侧标记同形：
 * - 裸 `x-slot` / `x-slot.mod` → 默认出口/内容（名 `"default"`）；
 * - `x-slot:名称[.mod]` → 命名出口/内容；
 * - `x-slot-options` 等 `-options` 指令选项属性**不是**标记（不匹配 `x-slot` 正身、
 *   `x-slot.` 修饰前缀、`x-slot:` 属性参数前缀三者任一）。
 *
 * 内容侧值 = 解构形参（`{ item, index }` 简式，非 JSON）；出口侧值 = 对象字面量
 * （组件作用域求值）。形参解析只认简单键（无 rename/默认值）。
 *
 * 传递绑定（ADR-0108）：内容侧另可携带 `x-slot.bind="表达式"`（或别名 `x-slot:名.bind`）
 * ——表达式在调用方作用域求值、展开到出口元素；随 {@link SlotContent.bindingsExpr} 顺流
 * 至 SlotDirective（各收集通道共享本文件，组件/overlay/动态出口天然统一）。
 */
import type { AutoSparkScope } from "../engine/scope";
/**
 * super 展开产物（ADR-0084）：本段 fallback 的一次独立编译结果。
 * `nodes` 由 SuperDirective 挂入标记元素内；`scopes` 的 parent = 出口 binding
 * （组件作用域基准，出口销毁级联），SuperDirective.destroy 兜底回收（幂等）。
 */
export interface SuperFallback {
    /** 编译产物节点（未挂载，调用方挂入 x-super 标记元素） */
    nodes: ChildNode[];
    /** 本次编译建立的 scopes */
    scopes: AutoSparkScope[];
}
/**
 * super 句柄（ADR-0084）：插槽内容 scope 携带的惰性 fallback 编译入口。
 * 每次调用**独立编译**一份（同段多个 x-super 各自展开、各挂各的 watcher）；
 * 出口无 fallback 子树 → 返回空产物（静默，Q8）。
 */
export type SuperInlet = () => SuperFallback;
/** 插槽标记（出口侧与内容侧共用的识别结果） */
export interface SlotMarker {
    /** 出口/内容名（裸 `x-slot` = `"default"`） */
    name: string;
    /** 标记命中的原始属性名（剥除时用；含修饰符形态） */
    attrName: string;
}
/** 内容侧一段插槽内容的收集产物（已克隆、已剥根标记属性） */
export interface SlotContent {
    /** 段名（`"default"` 或命名） */
    name: string;
    /**
     * 内容节点（深克隆、根标记属性已剥、深层嵌套标记已 warn+剥）。
     * 命名段恒单元素；默认段可为多根（裸子节点按文档序合并）。
     *
     * `mode: "live"` 时语义变更（ADR-0062 shell 机制）：节点是**引擎已编译的活体组件实例**
     * （自带活 scope）——出口直挂不克隆、不再编译、不建内容 scope（销毁权责归构造方，
     * 如 OverlayInstance 对内容/shell 双 scope 的统一回收）。
     */
    nodes: ChildNode[];
    /** 内容侧解构形参键（裸子节点默认段恒 `[]`——无形参） */
    params: string[];
    /** 形参表达式原文（`{ item, index }`；无值 null）——出口侧 watch 注入时按 params 键抽取 */
    paramsExpr: string | null;
    /**
     * 传递绑定表达式（ADR-0108）：`x-slot.bind="…"` / `x-slot:名.bind="…"` 载体属性的值原文。
     * 出口侧经 `callerScope.watch(expr, …, { depth: 2 })` 响应式求值、以 x-bind 展开语义
     * 应用到出口元素（调用方赢）。无载体 null；live 段恒无（引擎编程式构造）。
     */
    bindingsExpr?: string | null;
    /**
     * 段形态（ADR-0062）：`"template"`（缺省）= 模板态克隆（投影时全量编译建 scope）；
     * `"live"` = 活体组件实例（出口直挂，见 nodes 注记）。收集管道（collectSlotSegments）
     * 恒产出 template 态；live 段仅由引擎编程式构造（shell 机制）。
     */
    mode?: "template" | "live";
}
/** `$slots` 注册表条目（ADR-0107 决策六）：最小元数据——v1 从窄，后续按真实需求再扩 */
export interface SlotRegistryEntry {
    /** 段名（键的冗余，遍历解构便利） */
    name: string;
}
/** `$slots` 注册表（ADR-0107）：名 → 条目的只读冻结快照（组件实例域保留键） */
export type SlotRegistry = Record<string, SlotRegistryEntry>;
/**
 * 构建 `$slots` 注册表（ADR-0107 决策六）：内容段 map → 冻结条目快照。
 *
 * 在组件实例化 stash 点同步构建（instantiateComponent / instantiateDetachedComponent）；
 * null/空 map → 冻结空对象（恒注入，`Object.keys($slots)` 遍历友好）。
 */
export declare function buildSlotsRegistry(map: Map<string, SlotContent> | null | undefined): SlotRegistry;
/**
 * 插槽转发声明（ADR-0125）：`x-component-options.slots` 静态清单的一次解析产物，
 * stash 于被消费组件的实例 scope（出口查找链上的持有者）。出口 SlotDirective 查找时
 * 按声明翻译名字（显式映射优先于通配）逐级接力上溯；静态一次解析不响应式。
 */
export interface SlotForwarding {
    /** `*` 通配：未命中显式映射的名字原名上溯（运行时动态集合，覆盖动态出口与闲置段） */
    wildcard: boolean;
    /** 显式映射：本级出口名 → 对外名（裸名直通 = 同名键值；优先于通配） */
    map: Map<string, string>;
}
/**
 * 解析 slots 转发静态清单（ADR-0125 决策三）：逗号清单，项形态 `*`（通配）/
 * 裸名（同名直通）/ `出口名:对外名`（ES 解构 rename 惯例重导出）。
 * 语法非法项（多冒号、空名、项内空白）逐项 warn + 忽略，不拖累整清单。
 */
export declare function parseForwardSlots(raw: string, warn: (msg: string) => void): SlotForwarding;
/**
 * 属性名是否为**归属容器**标记（`x-slots` 正身 / `x-slots.修饰` / `x-slots:参数`）。
 *
 * 与 {@link isSlotAttrName} 是两个不同边界：`x-slots` 不以 `x-slot` 整身或 `x-slot.` /
 * `x-slot:` 前缀开头（多一个 `s`），故不会被误判为插槽标记；反之亦然。
 */
export declare function isSlotsContainerAttrName(name: string): boolean;
/** 归属容器标记（`x-slots="覆盖物组件名"`）的识别结果 */
export interface SlotsContainerMarker {
    /** 命中的原始属性名（剥除时用；含修饰符 / 参数形态） */
    attrName: string;
    /** 归属的覆盖物组件名（属性值，静态字符串；空串 = 未提供） */
    name: string;
}
/**
 * 识别元素上的归属容器标记。
 *
 * 归属名走**值**（同 `x-define="名"`），不经属性参数——修饰符 / 参数形态只做识别
 * （防止残留进运行 DOM），不承载语义。
 *
 * @returns 标记（属性名 + 归属名）；无标记返回 null
 */
export declare function getSlotsContainer(el: HTMLElement): SlotsContainerMarker | null;
/**
 * 识别元素上的插槽标记。
 *
 * **普通标记优先、纯绑定载体仅作兜底**（ADR-0108）：绑定属性与标记同元素合写时
 * （`<template x-slot.bind x-slot:header>` 任意书写顺序），名/形参权威属性（plain 形态）
 * 恒为标记位来源——绑定载体不抢标记，顺序无关。
 *
 * @returns 标记（名 + 原始属性名）；无标记返回 null
 */
export declare function getSlotMarker(el: HTMLElement): SlotMarker | null;
/** 传递绑定载体属性（ADR-0108）：内容侧 `x-slot.bind` / `x-slot:名.bind` 的识别结果 */
export interface SlotBindingsAttr {
    /** 命中的原始属性名（剥除时用） */
    attrName: string;
    /** 所属槽名（裸形态 = `"default"`；具名别名 = `:` 后段） */
    name: string;
    /** 绑定表达式原文（调用方作用域求值，值语义 = x-bind 属性展开 ADR-0043） */
    value: string;
}
/**
 * 识别元素上的**传递绑定**载体属性（ADR-0108）。
 *
 * 三形态：`x-slot.bind="表达式"`（default 槽）、`x-slot:名.bind="表达式"`（具名别名，
 * 双属性正典下的同元素合写亦命中）、`x-slot.修饰.bind`（修饰符中含 bind 即命中）。
 *
 * 与 {@link getSlotMarker} 正交：标记认名、本函数认绑定载体——同一元素可同时携带
 * 形参标记属性与 `x-slot.bind`（形参与绑定正交共存）。仅内容侧承载语义；
 * 出口侧（x-define 模板内）遇 `.bind` 由 SlotDirective warn + 兼容处理（ADR-0108）。
 *
 * @returns 绑定载体属性（属性名 + 所属槽名 + 表达式原文）；无返回 null
 */
export declare function getSlotBindingsAttr(el: HTMLElement): SlotBindingsAttr | null;
/**
 * 解析内容侧解构形参 `{ item, index }` → 键列表。
 *
 * 仅认简单键（字母/数字/`_`/`$` 起头的标识符，无 rename、无默认值）。
 *
 * @returns 键列表；空 `{}` / 无值 → `[]`；形态非法（非对象字面量 / 含 rename）→ null（调用方 warn）
 */
export declare function parseSlotParams(raw: string | null | undefined): string[] | null;
/** 剥除元素自身的全部插槽标记属性（内容克隆根 / 出口重复剥除 / 深层标记放行共用） */
export declare function stripOwnSlotAttrs(el: HTMLElement): void;
/**
 * 从宿主**直接子级**收集插槽内容并按名分段（ADR-0056 决策三/七/九）。
 *
 * 分段规则：
 * - 带 `x-slot:名称` 的直接子元素 → 命名段（标记元素保留为包裹层，深克隆）；
 * - 其余（裸文本 / 未标记元素 / 裸 `x-slot` 标记）参与**默认段**；
 * - 默认段归属按文档序「首个胜出」：先见裸子节点则裸段胜（后见裸 `x-slot` 标记 warn 丢弃），
 *   反之标记胜（后见裸子节点 warn 丢弃）；两者只择其一。
 * - 裸子节点 trim 后全纯空白 → 默认段**未提供**（不构成内容）；
 *   命名标记元素**存在即提供**（空/纯空白也覆盖 fallback）。
 * - 同名多段 → 首个胜 + warn。
 * - 逐段比对出口清单 `slots`：无对应出口 → warn + 丢弃（`slots` 缺省视为无出口，全丢）。
 *
 * 模板只读契约（ADR-0002）：一律 `cloneNode(true)`，不摘模板原节点。
 *
 * @param host  宿主（x-component / x-dialog 的 template——ownsChildren 下内容留在模板）
 * @param slots 组件出口清单（`ComponentDef.slots`；undefined = 无出口）
 * @param warn  warn 日志
 * @returns 名 → 内容段；无任何有效段返回 null
 */
export declare function collectSlotContent(host: HTMLElement, slots: string[] | undefined, warn: (msg: string) => void, options?: CollectSlotOptions): Map<string, SlotContent> | null;
/**
 * 按**给定的直接子节点序列**分段并校验出口清单（{@link collectSlotContent} 的主体）。
 *
 * 分段规则与 `collectSlotContent` 完全一致；调用方负责先确定「哪些子节点参与分段」——
 * 覆盖物路径经 {@link collectSlotGroups} 按归属容器分组后逐组调用（ADR-0056 决策十修订）。
 *
 * @param children 参与分段的直接子节点（已在归属容器层面裁剪过）
 * @param slots    组件出口清单（`ComponentDef.slots`；undefined = 无出口）
 * @param warn     warn 日志
 * @returns 名 → 内容段；无任何有效段返回 null
 */
/** 收集选项（ADR-0107）：`skipValidation` = 跳过出口清单校验（组件路径全量收集） */
export interface CollectSlotOptions {
    /**
     * 跳过出口清单校验（ADR-0107 决策五）：动态出口名运行期才可知，命名段全量放行——
     * 未被动态出口消费的段静默闲置不 warn。缺省 false（覆盖物/继承路径维持清单校验）。
     */
    skipValidation?: boolean;
}
export declare function collectSlotSegments(children: ChildNode[], slots: string[] | undefined, warn: (msg: string) => void, options?: CollectSlotOptions): Map<string, SlotContent> | null;
/**
 * 把覆盖物宿主的直接子节点按**归属**分组（ADR-0056 决策十修订）。
 *
 * 分组规则：
 * - 带 `x-slots="组件名"` 的直接子元素 → 具名组，容器子节点为该组内容（容器自身不进组）；
 *   归属名为空 / 与宿主上的消费者不匹配 / 同名重复 → warn + 丢弃。
 * - 带 `x-slot` 标记但**无容器包裹**的直接子元素 → 隐式组：
 *   宿主只有一个覆盖物消费者时归属它；多个消费者无法判定 → warn + 丢弃。
 * - **裸子节点（文本、未标记元素、注释）不参与**——宿主子节点只属于宿主（按钮标签等，
 *   Q1）；容器**内**的裸子节点才是该组的默认段（写容器即显式归属声明）。
 *
 * @param host      覆盖物宿主（只读 template）
 * @param consumers 宿主上全部覆盖物消费者的组件名（用于隐式归属与校验）
 * @param warn      warn 日志
 * @returns 归属名 → 待分段的子节点；无任何组返回空 Map
 */
export declare function collectSlotGroups(host: HTMLElement, consumers: string[], warn: (msg: string) => void): Map<string, ChildNode[]>;
