import type {
    ComponentDef,
    ComponentHooks,
    ComponentSetup,
} from "../directives/component-def";
import type { StyleBind } from "../utils/styleBind";
import { resolveComponentData } from "./setup";
import {
    extractBoundaryOptions,
    finalizeBoundaryOptions,
    isDeclarativeResourceNode,
} from "./collect";
import { collectSlotSegments, getSlotMarker, type SlotContent } from "../utils/slot";

/**
 * 组件继承解析（ADR-0081）：`x-define:inherit="父名"` 的编译期一次性展开。
 *
 * 输入子组件的独立 def（`buildComponentDef` 产物——setup/styles 已提取，其快照弃用），
 * 输出**已解析** def：快照 = 父已解析快照的深克隆（出口 fallback 被子覆盖段替换、子根属性并入），
 * setup/hooks 按层合并，styles 拼接，边界子重声明胜否则继承父，出口清单 = 父全量。
 * 解析失败（值空 / 指向自身 / 父未找到 / 继承链成环）warn + 返回 null → 调用方拒绝注册。
 *
 * 覆盖段复用既有插槽内容分段规则（ADR-0056，零新规则）：子定义直接子节点剔除
 * `<script setup>` / `<style>` 资源节点后，`<template x-slot:名>`=命名段、裸子节点=默认段，
 * 无对应父出口 warn + 丢弃；替换落在出口的 **fallback 子树**上（出口标记保留为包裹层，
 * 消费方实例化时内容仍可再覆盖——三层优先级：消费方内容 > 继承覆盖 > 父 fallback）。
 */

/**
 * 读取元素上的继承声明（`x-define:inherit` 属性参数，ADR-0081；`x-define:extends` 为同义别名）。
 *
 * @returns trim 后的父组件名；未声明返回 null（空串 = 声明了但值为空，由解析器 warn + 拒绝）
 */
export function readInheritAttr(el: HTMLElement): string | null {
    for (const attr of Array.from(el.attributes)) {
        const n = attr.name;
        if (
            n === "x-define:inherit" ||
            n.startsWith("x-define:inherit.") ||
            n === "x-define:extends" ||
            n.startsWith("x-define:extends.")
        ) {
            return (attr.value ?? "").trim();
        }
    }
    return null;
}

/** 继承解析入参（compiler / engine 远程注册路径组装） */
export interface ComponentInheritInput {
    /** 子定义原元素（读覆盖段子节点、根属性、边界声明） */
    componentEl: HTMLElement;
    /** 子组件名 */
    name: string;
    /** 父组件名（`x-define:inherit` 值，已 trim） */
    inherit: string;
    /** `.open` 修饰符（compiler 解析期产出；远程路径未解析修饰符时传 false） */
    modifierOpen: boolean;
    /** 子组件独立 def（setup/hooks/styles/declarerScope 已就位；其 snapshot 不再使用） */
    childDef: ComponentDef;
    /** 父查找：名 → 已解析 def（scope 链就近 + 全局兜底，由调用方闭包组装）；未命中返回 null */
    lookupParent: (name: string) => ComponentDef | null;
    /** warn 日志函数 */
    warn: (msg: string) => void;
    /**
     * 父未找到时**挂起**而非终局拒绝（ADR-0083）：返回 {@link PENDING_PARENT} 哨兵（不 warn），
     * 调用方压入 engine pending 表、等 `components/<名>/registered` 排水重试——支持 x-import 异步父。
     */
    deferMissingParent?: boolean;
}

/** 父未就绪哨兵（`deferMissingParent` 模式下父查找 miss 的返回值，ADR-0083） */
export const PENDING_PARENT = "__autospark_pending_parent__";
/** 继承解析返回值：已解析 def | 终局失败（已 warn）| 父未就绪（挂起重试） */
export type InheritResolveResult = ComponentDef | null | typeof PENDING_PARENT;

/**
 * 解析组件继承，产出已解析 def；终局失败 warn + 返回 null（调用方拒绝注册）；
 * `deferMissingParent` 下父未找到返回 PENDING_PARENT 哨兵（调用方挂起等异步注册，ADR-0083）。
 *
 * 环检测为 belt-and-braces：文档序收集下父恒先于子解析、链天然 DAG，防御程序化注册旁路。
 */
export function resolveComponentInheritance(input: ComponentInheritInput): InheritResolveResult {
    const { componentEl, name, inherit, modifierOpen, childDef, lookupParent, warn } = input;

    if (inherit === "") {
        warn(`x-define "${name}": x-define:inherit 值为空（须为父组件名），组件未注册（ADR-0081）`);
        return null;
    }
    if (inherit === name) {
        warn(`x-define "${name}": 继承声明指向自身，组件未注册（ADR-0081）`);
        return null;
    }
    const parentDef = lookupParent(inherit);
    if (!parentDef) {
        if (input.deferMissingParent) return PENDING_PARENT;
        warn(
            `x-define "${name}": 未找到父组件 "${inherit}"（父组件须先于子组件声明且同步可解析；` +
                `x-import 异步父 V1 不支持），组件未注册（ADR-0081）`,
        );
        return null;
    }
    // 环检测：沿父链上溯（父 def 均已解析，`inherit` 字段即链指针），回到已见名 = 成环
    const seen = new Set<string>([name, inherit]);
    let cursor = parentDef.inherit ?? null;
    while (cursor != null && !seen.has(cursor)) {
        seen.add(cursor);
        cursor = lookupParent(cursor)?.inherit ?? null;
    }
    if (cursor != null) {
        warn(
            `x-define "${name}": 继承链成环（经 "${inherit}" 回到 "${cursor}"），组件未注册（ADR-0081）`,
        );
        return null;
    }

    // 1) 覆盖段：子定义直接子节点剔除资源节点后按既有插槽分段规则收集（出口清单 = 父全量）
    const segChildren = Array.from(componentEl.childNodes).filter(
        (n) => !isDeclarativeResourceNode(n),
    );
    const segments = collectSlotSegments(segChildren, parentDef.slots, warn);
    // 覆盖段不支持作用域形参（ADR-0081：继承覆盖走 fallback 通道，无形参语义）——warn + 忽略
    for (const seg of segments?.values() ?? []) {
        if (seg.params.length > 0) {
            warn(
                `x-define "${name}": 覆盖段 "${seg.name}" 的作用域形参不支持` +
                    `（继承覆盖替换父出口 fallback，无形参语义，ADR-0081），已忽略`,
            );
        }
    }

    // 2) 有效快照：父已解析快照深克隆（父永不被变异，多子继承同一父互不干扰）→
    //    出口 fallback 替换 → 子根属性并入 → 剥声明族属性
    const snapshot = parentDef.snapshot.cloneNode(true) as HTMLElement;
    applyOverrides(snapshot, segments);
    mergeChildRootAttrs(snapshot, componentEl);
    stripDeclareFamilyAttrs(snapshot);

    // 3) setup 合并：[父, 子] 扁平合并（data / methods / locals 子同名胜）、hooks 按 phase
    //    串接（父先子后）。**不**把两侧 def 的 setup 直接喂 mergeComponentSetups——父 def 的
    //    hooks 存于 def.hooks（setup 顶层无 phase 键）会静默丢失，且其归一化工厂的
    //    「对象先、工厂后」池序会让父工厂覆盖子字面量（破坏子胜），故本层手工合并。
    const setup = mergeSetups(parentDef.setup, childDef.setup);
    const hooks = mergeHooks(parentDef.hooks, childDef.hooks);

    // 4) styles / styleBinds：父子拼接（子在后，级联后者胜）；bind 按内容去重
    //   （同表达式派生同变量名，双份实例化期会重复 watch 同一变量）
    const styles = [...(parentDef.styles ?? []), ...(childDef.styles ?? [])];
    const styleBinds = dedupeStyleBinds([
        ...(parentDef.styleBinds ?? []),
        ...(childDef.styleBinds ?? []),
    ]);

    // 5) 边界：子重声明胜（含显式 false 关闭继承来的开放）否则继承父；dataContext 耦合
    //    校验以生效 open 为准（子声明 dataContext + 父 open 的组合同样合法）
    const { open, dataContext } = finalizeBoundaryOptions(
        extractBoundaryOptions(componentEl, modifierOpen, warn),
        { open: parentDef.open, dataContext: parentDef.dataContext },
        warn,
    );

    return {
        name,
        snapshot,
        setup,
        hooks,
        styles: styles.length > 0 ? styles : undefined,
        styleBinds: styleBinds.length > 0 ? styleBinds : undefined,
        open,
        dataContext,
        declarerScope: childDef.declarerScope,
        slots: parentDef.slots,
        inherit,
        // 方法声明层表（ADR-0082）：[子声明层, ...父层表]——已解析父自带层表；
        // 独立父（非继承 def / 全局父）以其 setup.methods 为单层
        methodLayers: buildMethodLayers(childDef, parentDef),
    };
}

/**
 * 构建方法声明层表（ADR-0082 super 引用）：`[自身声明层 → 链根]`。
 *
 * 已解析父携带自身层表（`parentDef.methodLayers`）直接续接；独立父（无层表——非继承 def，
 * 含全局父）以其 `setup.methods` 为单层（其合并结果即自身声明）。子无声明方法时不插自有层
 * （继承方法的词法层归属父层，super 解析随声明层走）。全链无 methods 返回 undefined。
 */
function buildMethodLayers(
    childDef: ComponentDef,
    parentDef: ComponentDef,
): Array<Record<string, (...args: any[]) => any>> | undefined {
    const parentLayers = parentDef.methodLayers ??
        (parentDef.setup?.methods ? [parentDef.setup.methods] : []);
    const ownLayer = childDef.setup?.methods;
    if (ownLayer) return [ownLayer, ...parentLayers];
    return parentLayers.length > 0 ? parentLayers : undefined;
}

/** 声明族属性边界（ADR-0054 正身/选项/修饰符 + ADR-0081 属性参数） */
function isDeclareFamilyAttr(attrName: string): boolean {
    return (
        attrName === "x-define" ||
        attrName === "x-define-options" ||
        attrName.startsWith("x-define.") ||
        attrName.startsWith("x-define:")
    );
}

/**
 * 出口 fallback 替换：遍历解析快照后代的出口标记，命中覆盖段则替换其子树。
 *
 * 出口标记元素**保留为包裹层**（`x-slot` 属性不动，实例化时 SlotDirective 照常实例化、
 * 消费方内容仍可再覆盖）；`<template>` 出口的 fallback 在 `.content`，普通出口在子节点。
 */
function applyOverrides(snapshot: HTMLElement, segments: Map<string, SlotContent> | null): void {
    if (!segments) return;
    for (const el of Array.from(snapshot.querySelectorAll("*"))) {
        if (!(el instanceof HTMLElement)) continue;
        const marker = getSlotMarker(el);
        if (!marker) continue;
        const seg = segments.get(marker.name);
        if (!seg) continue;
        if (el instanceof HTMLTemplateElement) {
            el.content.replaceChildren(...seg.nodes);
        } else {
            el.replaceChildren(...seg.nodes);
        }
    }
}

/**
 * 子定义根属性并入解析快照根（子是特化方）：class 拼接、style 合并（子在后冲突键子胜）、
 * 其他属性补充不覆盖——对齐消费侧 `_mergeComponentRootAttrs` 的合并语义。
 */
function mergeChildRootAttrs(snapshot: HTMLElement, childEl: HTMLElement): void {
    for (const attr of Array.from(childEl.attributes)) {
        if (isDeclareFamilyAttr(attr.name)) continue;
        if (attr.name === "class") {
            const merged = ((snapshot.getAttribute("class") ?? "") + " " + attr.value).trim();
            if (merged) snapshot.setAttribute("class", merged);
            continue;
        }
        if (attr.name === "style") {
            const base = snapshot.getAttribute("style") ?? "";
            const merged = (base ? base + ";" : "") + attr.value;
            if (merged) snapshot.setAttribute("style", merged);
            continue;
        }
        if (!snapshot.hasAttribute(attr.name)) snapshot.setAttribute(attr.name, attr.value);
    }
}

/** 剥除解析快照根上的全部声明族属性（父快照携带的 x-define 族 + 防御性兜底） */
function stripDeclareFamilyAttrs(snapshot: HTMLElement): void {
    for (const attr of Array.from(snapshot.attributes)) {
        if (isDeclareFamilyAttr(attr.name)) snapshot.removeAttribute(attr.name);
    }
}

/**
 * setup 跨 def 合并（[父, 子] 语义）。
 *
 * data：单侧声明原样保留（保住对象字面量形态的深克隆语义）；双侧声明归一化为工厂——
 * 每实例先取父初始值（工厂调用 / 字面量深克隆）再浅覆盖子值（子同名键胜）。
 * methods / locals：浅合并子胜。钩子不在 setup 上（走 def.hooks），此处不涉。
 */
function mergeSetups(
    parent: ComponentSetup | undefined,
    child: ComponentSetup | undefined,
): ComponentSetup | undefined {
    if (!parent) return child;
    if (!child) return parent;
    const merged: ComponentSetup = {};
    if (parent.data !== undefined || child.data !== undefined) {
        if (child.data === undefined) {
            merged.data = parent.data;
        } else if (parent.data === undefined) {
            merged.data = child.data;
        } else {
            const p = parent.data;
            const c = child.data;
            merged.data = () => {
                const out = resolveComponentData({ data: p }) ?? {};
                Object.assign(out, resolveComponentData({ data: c }) ?? {});
                return out;
            };
        }
    }
    if (parent.methods || child.methods) {
        merged.methods = { ...parent.methods, ...child.methods };
    }
    if (parent.locals || child.locals) {
        merged.locals = { ...parent.locals, ...child.locals };
    }
    return merged;
}

/** hooks 按 phase 串接（父先子后，链式继承时祖先钩子恒最先） */
function mergeHooks(
    parent: ComponentHooks | undefined,
    child: ComponentHooks | undefined,
): ComponentHooks | undefined {
    if (!parent) return child;
    if (!child) return parent;
    return {
        created: [...parent.created, ...child.created],
        mounted: [...parent.mounted, ...child.mounted],
        beforeUnmount: [...parent.beforeUnmount, ...child.beforeUnmount],
        unmounted: [...parent.unmounted, ...child.unmounted],
    };
}

/** styleBinds 按内容去重（同表达式两侧均声明时只留一份，派生变量名相同） */
function dedupeStyleBinds(binds: StyleBind[]): StyleBind[] {
    const seen = new Set<string>();
    return binds.filter((b) => {
        const key = JSON.stringify(b);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
