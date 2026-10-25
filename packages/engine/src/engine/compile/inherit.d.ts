import type { ComponentDef } from "../../features/component/component-def";
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
export declare function readInheritAttr(el: HTMLElement): string | null;
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
export declare const PENDING_PARENT = "__autospark_pending_parent__";
/** 继承解析返回值：已解析 def | 终局失败（已 warn）| 父未就绪（挂起重试） */
export type InheritResolveResult = ComponentDef | null | typeof PENDING_PARENT;
/**
 * 解析组件继承，产出已解析 def；终局失败 warn + 返回 null（调用方拒绝注册）；
 * `deferMissingParent` 下父未找到返回 PENDING_PARENT 哨兵（调用方挂起等异步注册，ADR-0083）。
 *
 * 环检测为 belt-and-braces：文档序收集下父恒先于子解析、链天然 DAG，防御程序化注册旁路。
 */
export declare function resolveComponentInheritance(input: ComponentInheritInput): InheritResolveResult;
