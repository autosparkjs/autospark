import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSparkScope } from "../engine/scope";
import type { SlotContent, SuperInlet } from "../utils/slot";
import { SpreadBinder } from "./x-bind-spread";

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
    /** 动态名出口的编译期解析结果（ADR-0107）：null = 静态名模式或无效名 */
    private dynamicResolved: { name: string } | null = null;
    /** 动态名求值结果非法（ADR-0107 决策八）：恒按无内容处理（fallback），不写 data-slot */
    private dynamicInvalid = false;

    override created(): void {
        const attrName = (this.attr ?? "").trim();
        let name = attrName || "default";
        /** 动态名模式：形参取值表达式 = 整个指令值，形参取 value.params（ADR-0107） */
        let dynamic = false;
        const rawValue = this.value == null ? "" : String(this.value).trim();
        // ADR-0108：`.bind` 是调用方（使用处）内容侧的传递绑定语法，出口侧不承载透传语义
        if (this.modifiers?.includes("bind")) {
            if (attrName === "") {
                this.warn(
                    `x-slot.bind 是调用方（使用处）的传递绑定语法，出口侧不支持——请改用 x-bind（值非空时仍按动态出口名处理以兼容 ADR-0107，ADR-0108）`,
                );
            } else {
                this.warn(
                    `x-slot:${attrName}.bind 是调用方（使用处）的传递绑定语法，出口侧请改用 x-bind（修饰符已忽略，ADR-0108）`,
                );
            }
        }
        if (attrName === "" && rawValue !== "") {
            // 动态出口名（ADR-0107 决策二/三）：值承名，编译期求值一次静态绑定
            dynamic = true;
            const resolved = this.binding.read(rawValue);
            const r = resolved as Record<string, any> | null | undefined;
            if (typeof resolved === "string" && resolved.trim() !== "") {
                name = resolved.trim();
                this.dynamicResolved = { name };
            } else if (
                resolved != null &&
                typeof resolved === "object" &&
                !Array.isArray(resolved) &&
                typeof r?.name === "string" &&
                r.name.trim() !== ""
            ) {
                name = r.name.trim();
                this.dynamicResolved = { name };
            } else {
                this.dynamicInvalid = true;
                this.warn(
                    `x-slot: 动态出口名无效（"${rawValue}" 求值结果须为非空字符串或 { name, params } 对象），出口按无内容处理（渲染 fallback）（ADR-0107）`,
                );
            }
        }
        // 沿 parent 链就近找第一个持有 slotContents 的 scope（嵌套组件隔离）
        if (!this.dynamicInvalid) {
            let holder: AutoSparkScope | null = this.binding.parent;
            while (holder) {
                if (holder.slotContents) {
                    const hit = holder.slotContents.get(name);
                    if (hit) {
                        if (dynamic && hit.mode === "live") {
                            // 动态出口不可消费活体段（ADR-0107 决策七）：live 段不可克隆/再编译，
                            // 多出口消费即 DOM reparent 静默丢失——warn + fallback
                            this.warn(
                                `x-slot: 动态出口 "${name}" 不可消费活体内容段（live 段仅静态出口可直挂），已按无内容处理（渲染 fallback）（ADR-0107）`,
                            );
                        } else {
                            this.content = hit;
                            this.callerScope = holder.slotCallerScope ?? holder;
                        }
                    }
                    break; // 持有者已定：无本名段 → fallback，不上溯（防穿透到外层组件）
                }
                holder = holder.parent;
            }
        }

        // 作用域插槽：内容声明了形参 → 建共享容器 + 在**组件作用域** watch 出口值（假设③）。
        // 静态出口值即形参取值表达式；动态出口 watch 整个值表达式、形参取 value.params
        //（ADR-0107 决策三：name 编译期静态绑定不响应式，params 保持响应式）
        if (this.content && this.content.params.length > 0) {
            this.paramData = {};
            for (const k of this.content.params) this.paramData[k] = undefined;
            if (rawValue !== "") {
                const extract = (v: any): any =>
                    dynamic && v != null && typeof v === "object" && !Array.isArray(v)
                        ? (v as Record<string, any>).params
                        : v;
                const initial = this.binding.watch(rawValue, ({ value }) =>
                    this._applyParams(extract(value)),
                );
                this._applyParams(extract(initial));
            }
        }
    }

    override compile(): void {
        // 出口运行态标记：`x-slot` 属性随编译剥除，出口元素留 `data-slot`（=出口名）作
        // 稳定寻址锚——运行期 DOM 注入通道（如 x-foldable 折叠面板中继）据此定位出口。
        // 动态出口写求值结果名；无效名不写（ADR-0107 决策八）
        if (!this.dynamicInvalid) {
            this.el.dataset.slot =
                this.dynamicResolved?.name ?? ((this.attr ?? "").trim() || "default");
        }
        if (this.content && this.callerScope) {
            // 传递绑定（ADR-0108）：内容侧 x-slot.bind 载体 → 调用方作用域 watch → 出口元素展开
            this._applyCallerBindings();
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
    private _applyCallerBindings(): void {
        const expr = this.content?.bindingsExpr;
        const caller = this.callerScope;
        if (!expr || !caller) return;
        const binder = new SpreadBinder({
            engine: this.engine,
            el: this.el,
            template: null,
            getOption: () => undefined,
        });
        const initial = caller.watch(
            expr,
            ({ value }) => {
                if (!this.content) return; // 出口已销毁：watcher 存续期间空转
                binder.apply(value);
            },
            { depth: 2, context: "caller" },
        );
        binder.apply(initial);
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
        this.dynamicResolved = null;
        this.dynamicInvalid = false;
    }
}
