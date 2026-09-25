import type { AutoSparkScope } from "../../scope";
import type { ComponentDef } from "../component-def";
import { ComponentDirective } from "./component";
import { OverlayInstance } from "../../overlay/instance";
import { resolveOverlayConfig } from "../../overlay/handle";
import { resolveDataContext, type OverlayConfig } from "../../overlay/types";
import { collectSlotContent } from "../../utils/slot";

/**
 * OverlayDirective：覆盖物消费侧**公共抽象基座**（ADR-0052 修订版——组件化统一，共识 2/3）。
 *
 * 覆盖物不再是独立声明指令，而是「**任意组件被渲染到 body 容器的消费方式**」：内容 = 任意组件
 * （`x-define` 声明 / `options.components` 全局注册 / `x-import` 加载），组件名走消费 attr
 * （`x-dialog:login` 的 `login`）。本类**不注册 `presetDirectives`**（模板无 `x-overlay` 语法，
 * 旧声明指令与 `.global` 修饰符、engine 全局表已删——共识 1）。
 *
 * 继承 `ComponentDirective`（ADR-0054 更名自 UseDirective）组件实例化全套能力（`getComponent` 查找、
 * def 反查、递归深度防护、`_waitForComponent` 等待 x-import、props 注入组件 data 域），仅覆盖三处（共识 3）：
 *
 * 1. **值语义**：组件名来自 attr（与 x-component 同一载体约定）；值专职 visible 布尔控制
 *    （子类解析，见 DialogDirective；对象形态已删除，ADR-0052 v2.3）；
 * 2. **实例化时机**：visible 真值触发 `_open()`（x-component 为编译期一次）；
 * 3. **目的地**：body 容器新实例（`OverlayInstance`，x-component 为宿主原地化身）——跳过
 *    `_mergeComponentRootAttrs` 属性继承。
 *
 * props 通道（ADR-0052 v2.3）：**唯一声明式通道 = 选项成员属性** `x-dialog-options.props`（或定向
 * `x-dialog-options:<组件名>.props`，ADR-0007 修订）——值为表达式，三形态与 x-component 值同构
 * （无属性 = 无 props / 对象字面量（成员任意表达式）/ 纯状态路径按需展开），**持续热更新**：值变
 * 经浅值比较后 `Object.assign` 进活跃实例数据域（组件内部状态不重置）。
 *
 * 配置两级链（v2.3）：`内置默认（基座） < x-dialog-options`（值对象内联层随对象形态删除）。
 * 数据视图基准 dataContext（共识 8；ADR-0053 修订更名自 `scope`）：`'declarer'`（默认，挂声明处
 * scope=定义闭包）| `'host'`（消费处）；硬切无旧键兼容（开发阶段，ADR-0053 修订）。
 */
export abstract class OverlayDirective extends ComponentDirective {
    /**
     * 覆盖物宿主是**触发点/声明点**（按钮标签、触发容器），不是组件化身——
     * 子节点保留在宿主正常渲染（不占有子树）。插槽内容打开时从**只读 template**
     * 克隆收集投影进 body 容器，不清空宿主（对齐 x-dialog 文档的按钮标签模式）。
     */
    static override ownsChildren(): boolean {
        return false;
    }

    /**
     * 同名多实例（对齐 OnDirective 先例）：宿主是纯声明点，同元素多覆盖物消费者
     * （`x-dialog:a` + `x-dialog:b`，不同 attr）各自独立驱动——并存是 ADR-0052 决策 8
     * 「宿主非触发器」的隐含要求，也是选项定向机制（ADR-0007 修订 `x-dialog-options:a.props`）
     * 的前提。同名**同 attr** 重复声明不去重（用户错误，双实例驱动同组件）。
     */
    static override readonly singleton = false;

    /** 覆盖物组件名 = 消费 attr 名（x-dialog:login 的 login） */
    protected get overlayName(): string {
        return this.attr ?? "";
    }

    /** 当前活跃实例（visible 驱动；声明式单驱动点至多一个活跃实例，关闭后残留引用经 destroyed 守卫） */
    protected _overlayInstance: OverlayInstance | null = null;
    /** 当前驱动状态（visible 真值；子类 watch 维护——等待的组件就绪后据此决定是否打开） */
    protected _driveOn = false;
    /** 当前求值 props（选项成员属性 props 的表达式产物；undefined = 无 props） */
    protected _props: Record<string, any> | undefined;
    /** 上次热应用到活跃实例的 props（浅值比较基准，复用 ComponentDirective._propsEqual） */
    private _appliedProps: Record<string, any> | undefined;

    /** 模态遮罩外壳（DialogDirective 覆盖 true；基座默认裸面板直挂容器——未来形态定制点） */
    protected get _modalMask(): boolean {
        return false;
    }

    override created(): void {
        // 宿主 x-options 的 props 键不被接受（ADR-0007 修订：props 不参与宿主回退——数据走
        // 指令级通道，元素级配置容器不承载）：warn + 忽略
        if (this.binding?.hostOptions && "props" in this.binding.hostOptions) {
            this.warn(
                `x-dialog:${this.attr}: 宿主 x-options 中的 props 键不被接受（props 走 x-dialog-options.props 指令级通道），已忽略`,
            );
        }
        // props 通道（ADR-0052 v2.3）：先于通用管道单独订阅（纯状态路径形态需 depth:2 深层响应，
        // 对齐 x-component props 的订阅参数），通用管道跳过 props 键避免同一表达式双 watcher。
        const propsExpr = this.info.optionExprs?.props;
        let skip: string[] | undefined;
        if (propsExpr !== undefined) {
            skip = ["props"];
            if (propsExpr.trim() === "") {
                this.warn(
                    `x-dialog:${this.attr}: props 成员属性的值为空（须提供表达式：对象字面量或状态路径），已忽略`,
                );
            } else {
                const initial = this.binding.watch(
                    propsExpr,
                    ({ value }) => this._onPropsChange(value),
                    { depth: 2 },
                );
                this._onPropsChange(initial);
            }
        } else {
            // 整包内嵌 props（静态字面量子集，v2.3）：无 watch 无热更新，作初始 props——
            // 成员属性形态（表达式）整键覆盖本形态
            const staticProps = this.options?.props;
            if (staticProps !== undefined) this._onPropsChange(staticProps);
        }
        // 选项表达式统一管道（ADR-0007 修订）：其余配置成员（closeOnMask/at 等）建订阅——
        // 应用点 = 每次打开经 resolveOverlayConfig 现读（重开生效，配置不热应用）
        this._watchOptionExprs(skip);
    }

    /** 打开（visible 真值路径）：查找 → 防护 → 配置链 → 实例化到 body 容器（props 取当前求值值） */
    protected _open(): void {
        this._instantiate(this.overlayName, this._props);
    }

    /** 状态归假的关闭路径：直接 UI 关闭（状态已是唯一真相源，不走写回——ADR-0052 决策 7） */
    protected _close(): void {
        const inst = this._overlayInstance;
        if (inst && !inst.destroyed && inst.visible) inst.close();
    }

    /**
     * props 值变化（对齐 x-component `_onValueChange` 容错）：对象 → props 集合（v-bind="obj" 心智）；
     * null/undefined → 无 props（绑定的状态对象尚未就绪，静默）；数组/标量 → warn 忽略。
     * 活跃实例在场 → 浅值比较后**热应用**（`Object.assign` 进实例数据域，只覆盖出现键、组件内部
     * 状态不被重置——v2.3 唯一热应用成员）；组件 pending 中 → 更新 pendingProps（就绪重试用最新值）。
     */
    private _onPropsChange(value: any): void {
        let props: Record<string, any> | undefined;
        if (Array.isArray(value)) {
            this.warn(
                `x-dialog:${this.attr}: props 值须为对象（字面量或状态对象），数组已忽略: ${JSON.stringify(value)}`,
            );
        } else if (value != null && typeof value === "object") {
            props = value as Record<string, any>;
        } else if (value !== undefined && value !== null) {
            this.warn(
                `x-dialog:${this.attr}: props 值须为对象（字面量或状态对象），已忽略: ${JSON.stringify(value)}`,
            );
        }
        this._props = props;
        const inst = this._overlayInstance;
        if (inst && !inst.destroyed && inst.visible && inst.instanceScope?.data) {
            if (!this._propsEqual(props, this._appliedProps)) {
                if (props) Object.assign(inst.instanceScope.data, props);
                this._appliedProps = props;
            }
            return;
        }
        if (this.pendingName) this.pendingProps = props;
    }

    /**
     * 目的地覆盖（共识 3-3）：body 容器新实例（x-component 为宿主原地化身）——跳过 `_mergeComponentRootAttrs`。
     * 共享 x-component 的查找（`_findComponentDef`）、递归防护（`_recursiveDepth`）、等待
     * （`_waitForComponent`，组件经 x-import 就绪后自动重试）。
     */
    protected override _instantiate(name: string, props: Record<string, any> | undefined): void {
        const found = this._findComponentDef(name);
        if (!found) {
            // 未命中（可能正被 x-import 异步加载）：warn + 等待就绪（visible 仍真则自动打开）
            this.warn(
                `x-dialog:${this.attr}: 未找到覆盖物组件 "${name}"（scope 链与全局均未命中，等待 x-import 就绪后重试）`,
            );
            this._waitForComponent(name, props);
            return;
        }
        // 递归深度防护（T5=A，与 x-component 共享）
        if (this._recursiveDepth(name) >= ComponentDirective.MAX_DEPTH) {
            this.warn(
                `x-dialog:${this.attr}: 组件 "${name}" 递归实例化深度超过上限（${ComponentDirective.MAX_DEPTH}），已停止（疑似无终止条件递归）。`,
            );
            return;
        }
        // 配置两级链（v2.3）：内置默认 < x-dialog-options（静态整包层 + 成员表达式层，各自
        // 归一化后 deepMerge——标量键表达式整键覆盖静态；at 等结构键简写经逐层归一化保留
        // 上层其余成员，v2.1 简写局部覆盖语义不变）。整包内嵌的 props 键已剥离（数据不走配置链）。
        const { props: _staticProps, ...optionLayer } = this.options ?? {};
        const config = resolveOverlayConfig(optionLayer, this._optionExprValues);
        const { parentScope, scopeEl } = this._resolveParentScope(config, found.def);
        // 插槽内容懒收集（ADR-0056 决策十）：仅组件声明了出口才收集（避免按钮标签等
        // 裸子节点被误收为 default 段并 warn 丢弃）；从只读 template 克隆，宿主子节点保留。
        const slots = found.def?.slots;
        const slotContents =
            this.template && slots?.length
                ? collectSlotContent(this.template, slots, (m) =>
                      this.warn(`x-dialog:${this.attr}: ${m}`),
                  )
                : null;
        // 宿主不清空：ownsChildren=false 下子节点是宿主自身内容（按钮标签等），照常保留
        const inst = new OverlayInstance(this.engine, name, found.snapshot, found.def, config, {
            parentScope,
            searchRoot: this.el ?? null,
            scopeEl,
            mask: this._modalMask,
            slotContents,
            slotCallerScope: this.binding,
        });
        this._overlayInstance = inst;
        this._appliedProps = props;
        inst.onCloseRequest = this._makeCloseRequest();
        inst.open(props);
    }

    /** 等待的组件就绪重试：visible 已归假（等待期间关闭）则放弃打开 */
    protected override _retryPendingComponent(): void {
        if (!this._driveOn) {
            this._clearPending();
            return;
        }
        super._retryPendingComponent();
    }

    /**
     * 数据视图基准挂链解析（共识 8；`scope` 键已更名 `dataContext`，ADR-0053 修订）：缺省按
     * `'declarer'` 归一后统一经 `resolveDataContext` 两栖分派——`'declarer'`（默认）挂**声明处**
     * scope（定义闭包——数据视图沿挂链即声明处上下文；悬空/全局组件无声明 scope → rootless 防御，
     * 仅全局视图 + 级联守卫兜底）；`'host'` 挂**消费处** scope；元素（声明式理论不可达，防御统一）
     * 按基准载体分派。
     *
     * 挂链即基准（决策 11 三合一）：表达式上下文 / 数据视图 / 生命周期级联统一由 parentScope 表达，
     * 无需 x-component 的 basis 施加（那是宿主化身场景——scope 留在消费处、数据视图跳声明处的解耦机制）。
     */
    private _resolveParentScope(
        config: OverlayConfig,
        def: ComponentDef | null,
    ): { parentScope: AutoSparkScope | null; scopeEl: HTMLElement | null } {
        const ctx = config.dataContext === undefined ? "declarer" : config.dataContext;
        return resolveDataContext(ctx, def, this.binding, this.engine, (m) =>
            this.warn(`x-dialog:${this.attr}: ${m}`),
        );
    }

    /**
     * 「请求关闭」写回钩子（UI 触点：ESC / 遮罩 / close action → 实例 requestClose）。
     * 基座无写回目标（仅 UI 关闭）；子类按值形态注入（简单路径 visible 写回 false）。
     */
    protected _makeCloseRequest(): ((inst: OverlayInstance, source: string) => void) | null {
        return null;
    }
}
