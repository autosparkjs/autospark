import type { ComponentDef, ComponentDataContext } from "../../features/component/component-def";
import type { AutoSparkScope } from "../scope";
/**
 * 判定节点是否为组件**声明资源节点**（`<script setup>` / 旧写法 setup 脚本 / `<style>`）——
 * 继承解析收集覆盖段时须从子定义子节点中剔除（ADR-0081），它们不参与插槽分段。
 */
export declare function isDeclarativeResourceNode(node: Node): boolean;
/**
 * 元素是否带 x-define 声明属性（含修饰符形态，ADR-0053；指令名 ADR-0054）。
 *
 * 命中形态：`x-define`（正身）与 `x-define.open` 等带 `.` 修饰符段的属性名；
 * `x-define-options`（指令选项属性）**不是**声明形态——不命中（`x-define-` 前缀
 * 与 `x-define.` 修饰符前缀是两个不同边界，与 dispatcher 的保留规则同构）。
 * 实例化指令 `x-component:名称` 亦不命中（属性名整体是 `x-component:xxx`，与上述前缀均不同）。
 */
export declare function hasComponentDeclareAttr(el: HTMLElement): boolean;
/**
 * 解析 x-define 声明属性：组件名（值，无值 `default`）+ 修饰符段（属性名 `.` 后段）+
 * 继承声明（属性参数 `x-define:inherit="父名"`，ADR-0081）。
 *
 * 未知修饰符 / 未知属性参数 warn + 忽略；`open` 修饰符注入边界开关（ADR-0053）、
 * `global` 修饰符注入全局注册开关（ADR-0115）——两者均是同名 x-define-options 布尔键的
 * 快捷写法（手工解析通道对齐 ADR-0007，options 显式布尔含 false 优先，见
 * {@link extractBoundaryOptions} / {@link extractGlobalOption}）。
 * 编译期收集器（`_collectComponent`）与运行时注册（`engine.registerComponent`，ADR-0086；
 * x-import 远程注册，ADR-0115）共用本函数——声明语义只有一处实现，避免各注册路径对
 * 「名 / 修饰符 / 继承」的读法漂移。
 *
 * @param el   带声明属性的元素（须已过 {@link hasComponentDeclareAttr} 门禁）
 * @param warn warn 日志函数
 * @returns 解析结果；元素**未命中**声明属性时返回 `null`
 */
export declare function parseComponentDeclare(el: HTMLElement, warn: (msg: string) => void): {
    name: string;
    modifierOpen: boolean;
    modifierGlobal: boolean;
    inherit: string | null;
} | null;
/**
 * 扫描组件根后代，warn「嵌套声明资源节点」（ADR-0086）。
 *
 * `<script setup>` / `<style>` **仅根的直接子级**被收集（`buildComponentDef` 只遍历直接子级），
 * 嵌套层级的同名节点会被原样留在快照里、不参与组件语义——对作者是易踩的静默失效。
 * 本函数只补一条 warn，**不改变收集行为**（ADR-0022 决策四的既有判定保持不变）。
 *
 * `<template>` 内容不在 `querySelectorAll` 结果内（inert 片段本就不渲染），无需覆盖。
 */
export declare function warnNestedResourceNodes(root: HTMLElement, warn: (msg: string) => void): void;
/**
 * 提取组件数据边界声明的**原始声明值**（ADR-0053；ADR-0081 继承改造拆层）：
 * `open` / `dataContext` 均以「undefined = 未声明」返回，与「声明为 false」区分——
 * 继承场景须凭此判定「子重声明胜（含显式关闭）否则继承父」。
 * 值的合法性校验（类型 / 枚举）在本层完成；「dataContext 须配合 open」的耦合校验
 * 延迟到 `finalizeBoundaryOptions`（独立组件以 false 为基准、继承以生效 open 为基准）。
 */
export declare function extractBoundaryOptions(componentEl: HTMLElement, modifierOpen: boolean, warn: (msg: string) => void): {
    open: boolean | undefined;
    dataContext: ComponentDataContext | undefined;
};
/**
 * 边界声明收口（ADR-0081）：以**生效 open**（子声明 ?? 继承基准；独立组件基准为 false——
 * 传空 base 即得原行为）完成耦合校验与继承——子未重声明则 dataContext 随 open 一并继承父值。
 */
export declare function finalizeBoundaryOptions(raw: {
    open: boolean | undefined;
    dataContext: ComponentDataContext | undefined;
}, base: {
    open?: boolean;
    dataContext?: ComponentDataContext;
}, warn: (msg: string) => void): {
    open: boolean | undefined;
    dataContext: ComponentDataContext | undefined;
};
/**
 * 提取组件全局注册声明的**生效布尔值**（ADR-0115）：`x-define.global` 修饰符 ≡
 * `x-define-options="{global:true}"`——x-define 手工解析通道对 ADR-0007 决策 1
 * （修饰符即同名布尔选项，显式选项含 false 优先）的对等实现，与 {@link extractBoundaryOptions}
 * 的 open 读法完全对称。
 *
 * - options 显式布尔（含 `false`）优先于修饰符——`{global:false}` 可关掉 `.global`；
 * - options 值非布尔（且已声明）→ warn + 回退修饰符值；
 * - 未声明 options 键 → 取修饰符值。
 *
 * 编译期收集器（全局分支跳过 owner 归属查找）、运行时 `engine.registerComponent`
 * （声明为准，ADR-0115 决策 8）与 x-import 远程注册循环共用本函数。
 */
export declare function extractGlobalOption(componentEl: HTMLElement, modifierGlobal: boolean, warn: (msg: string) => void): boolean;
/**
 * 提取组件元素名指令声明（ADR-0117）：`x-define-options.tag` 键——组件**缺省即注册**
 * 为元素名形态指令（标签自动推导 `x-{组件名}`），模板中直接写元素标签（如 `<x-counter>`）
 * 即实例化组件；`tag: false` 显式关闭。
 *
 * - 未声明 / `true`：标签自动推导为 `x-{组件名}`（小写化——HTML 元素名被 DOM 全量小写化，
 *   注册表以小写为基准，`findByElementName` 的查找归一与之对齐）——缺省开启；
 * - 非空且含连字符的字符串：自定义元素名（小写化；连字符为自定义元素惯例，防与原生/
 *   语义标签撞车）；
 * - `false`：不注册（显式关闭）；
 * - 其余值（数字 / 空串 / 无连字符字符串 / 对象等）：warn + 忽略该值，回落缺省（自动推导）。
 */
export declare function extractTagOption(componentEl: HTMLElement, name: string, warn: (msg: string) => void): string | undefined;
/**
 * 从组件元素（含 `<script setup>`/`<style>` 子节点）提取并组装组件定义（ADR-0022 决策二/四）。
 *
 * 核心步骤：
 * 1. 在原树收集所有 `<script setup>` 的文本内容与 `<style>` 的文本内容（克隆前读，引用稳定）；
 * 2. 深克隆元素为冻结快照，并在快照上**移除**这些 `<script setup>`/`<style>` 子节点（不进实例化 DOM）；
 * 3. 求值各 `<script setup>`（new Function，信任代码，失败 warn 丢弃，决策四-2/3）；
 * 4. 合并 setups（data 收集、methods 浅合并、同名 hooks 串行，决策四-1/R3=A）；
 * 5. 组装 ComponentDef（snapshot/setup/hooks/styles）。
 *
 * @param componentEl   原树中的 x-define 元素（读取子节点结构）
 * @param name          组件名
 * @param warn          warn 日志函数
 * @param declarerScope 声明处 scope（收集时归属的最近祖先 scope；全局组件无声明 scope 传 null）
 * @param modifierOpen  `.open` 修饰符（`x-define.open` 属性名形态）注入的 open:true
 * @returns 组件定义（snapshot 已剥离 script/style 子节点）
 */
export declare function buildComponentDef(componentEl: HTMLElement, name: string, warn: (msg: string) => void, declarerScope?: AutoSparkScope | null, modifierOpen?: boolean): ComponentDef;
