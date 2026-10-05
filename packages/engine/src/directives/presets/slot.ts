import { AutoSparkDirectiveBase } from "../base";
import type { AutoSparkScope } from "../../scope";
import type { SlotContent, SuperInlet } from "../../utils/slot";

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
 * 内容 map 沿 parent 链**就近**查找（嵌套组件各持独立 map；找到持有者但无本名段 →
 * fallback，不再上溯）。持有者由 component/overlay 的 `_instantiate` 懒收集后 stash。
 *
 * `ownsChildren`：出口子树不进通用 walk——由本指令在 compile 中选择「投影内容」或
 * 「fallback 编译」二选一，避免双重编译。
 */
export class SlotDirective extends AutoSparkDirectiveBase {
    /**
     * 介于结构指令（isolate=90/if=80/for=100）之下、component(70)/bind(50) 之间：
     * 出口填充在兄弟普通指令前完成，与 component 实例化错层（不同元素）。
     */
    static override readonly priority = 65;
    static override readonly singleton = true;
    /** 出口子树 = fallback 或投影内容，均不进通用 walk（ADR-0056 决策八） */
    static override ownsChildren(): boolean {
        return true;
    }

    /** 命中的内容段（null = 无内容，走 fallback） */
    private content: SlotContent | null = null;
    /** 内容的调用方基准 scope（内容 scope 的 parent） */
    private callerScope: AutoSparkScope | null = null;
    /** 形参容器（与内容 scope.locals 共享引用；出口侧 watch 后原地刷新） */
    private paramData: Record<string, any> | null = null;
    /** 已编译的内容 scopes（destroy 回收；幂等） */
    private contentScopes: AutoSparkScope[] = [];

    override created(): void {
        const name = (this.attr ?? "").trim() || "default";
        // 沿 parent 链就近找第一个持有 slotContents 的 scope（嵌套组件隔离）
        let holder: AutoSparkScope | null = this.binding.parent;
        while (holder) {
            if (holder.slotContents) {
                const hit = holder.slotContents.get(name);
                if (hit) {
                    this.content = hit;
                    this.callerScope = holder.slotCallerScope ?? holder;
                }
                break; // 持有者已定：无本名段 → fallback，不上溯（防穿透到外层组件）
            }
            holder = holder.parent;
        }

        // 作用域插槽：内容声明了形参 → 建共享容器 + 在**组件作用域** watch 出口值（假设③）
        if (this.content && this.content.params.length > 0) {
            this.paramData = {};
            for (const k of this.content.params) this.paramData[k] = undefined;
            const raw = this.value == null ? "" : String(this.value).trim();
            if (raw !== "") {
                const initial = this.binding.watch(raw, ({ value }) => this._applyParams(value));
                this._applyParams(initial);
            }
        }
    }

    override compile(): void {
        if (this.content && this.callerScope) {
            // 活体段（ADR-0062 shell 机制）：引擎已编译的组件实例直挂出口——不克隆、不再编译、
            // 不建内容 scope（DOM 挂载不动 scope 上的 watcher/监听；销毁权责归构造方
            // OverlayInstance 对内容/shell 双 scope 的统一回收）
            if (this.content.mode === "live") {
                for (const n of this.content.nodes) this.el.appendChild(n);
                return;
            }
            // 投影：内容在调用方基准下编译、挂到出口元素（原出口子节点不进 DOM）。
            // super 句柄（ADR-0084）随内容 scope 注入——内容子树内 x-super 惰性取本段
            // fallback 的独立编译产物（多次出现各自展开；出口无 fallback 静默空）
            const inlet = this._makeSuperInlet();
            this.contentScopes = this.engine.compiler.compileSlotNodes(
                this.content.nodes,
                this.callerScope,
                this.paramData,
                this.el,
                (s) => {
                    s.superInlet = inlet;
                },
            );
            return;
        }
        // fallback：出口子树在组件作用域编译（出口 scope 链上即组件 data）
        const tpl = this.template;
        if (!tpl) return;
        if (tpl instanceof HTMLTemplateElement) {
            // template 出口：fallback 子节点在 .content（light childNodes 恒空），逐个编译挂载
            const nodes = this.engine.compiler.compileChildNodes(
                Array.from(tpl.content.childNodes),
                this.binding,
            );
            for (const n of nodes) this.el.appendChild(n as ChildNode);
            return;
        }
        this.engine.compiler.compileSubtree(this.el, tpl, this.binding);
    }

    /**
     * 构造 super 句柄（ADR-0084）：内容子树内 x-super 标记的惰性 fallback 编译入口。
     *
     * 每次调用经 `compiler.compileSuperFallback` 在**出口 binding（组件作用域）**链上
     * 独立编译一份（同段多次出现各自展开、各挂各的 watcher）；fallback 事实源与既有
     * fallback 编译路径一致（普通出口 `childNodes` / `<template>` 出口 `.content`，
     * 继承覆盖已替换快照 → 天然展开继承覆盖层）；出口无 fallback 子树 → 静默空（Q8）。
     * 产物 scopes 的销毁：parent=出口 binding 级联 + SuperDirective.destroy 兜底（幂等）。
     */
    private _makeSuperInlet(): SuperInlet {
        return () => {
            const tpl = this.template;
            if (!tpl) return { nodes: [], scopes: [] };
            const source = tpl instanceof HTMLTemplateElement ? tpl.content : tpl;
            if (source.childNodes.length === 0) return { nodes: [], scopes: [] };
            return this.engine.compiler.compileSuperFallback(source, this.binding);
        };
    }

    /**
     * 出口值变化 → 形参容器原地更新 + 内容 scope 刷新（x-for 复用先例，ADR-0056 假设③）。
     *
     * `paramData` 引用永不替换（内容 scope.locals 已绑定该引用）；对象按 `paramData`
     * 键 `Object.assign`，非对象清空为 undefined。contentScopes 在 compile 后才填充——
     * created 期首调 refresh 为空操作，初值已就位供首次编译读取。
     */
    private _applyParams(value: any): void {
        if (!this.paramData) return;
        if (value != null && typeof value === "object" && !Array.isArray(value)) {
            for (const k of Object.keys(this.paramData)) {
                this.paramData[k] = (value as Record<string, any>)[k];
            }
        } else {
            for (const k of Object.keys(this.paramData)) {
                this.paramData[k] = undefined;
            }
        }
        for (const s of this.contentScopes) s.refresh();
    }

    override destroy(): void {
        // 内容 scopes 的 parent 是 caller（可能仍活着）——出口销毁时须显式回收；
        // 若 caller 已先级联销毁，scope.destroyed 幂等守卫使二次 destroy 为 no-op。
        for (const s of this.contentScopes) s.destroy();
        this.contentScopes = [];
        this.content = null;
        this.callerScope = null;
        this.paramData = null;
    }
}
