import type { AutoSparkScope } from "../../scope";
import type { ComponentDataBasis, ComponentDef } from "../component-def";
import { ComponentDirective } from "./component";
import { OverlayInstance } from "../../overlay/instance";
import { resolveOverlayConfig } from "../../overlay/handle";
import type { OverlayConfig } from "../../overlay/types";

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
 * 1. **值语义**：组件名来自 attr（与 x-component 同一载体约定）；值为 visible 驱动（子类解析，见 DialogDirective）；
 * 2. **实例化时机**：visible 真值触发 `_open()`（x-component 为编译期一次）；
 * 3. **目的地**：body 容器新实例（`OverlayInstance`，x-component 为宿主原地化身）——跳过
 *    `_mergeComponentRootAttrs` 属性继承。
 *
 * 配置三级链（共识 6）：`内置默认（基座） < x-dialog-options < 值对象内联保留配置键`；
 * props 统一（共识 7）：值对象/命令式 options 的非保留键全部作 props 注入组件 data 域。
 * scope 基准（共识 8）：`'declarer'`（默认，挂声明处 scope=定义闭包）| `'host'`（消费处）；
 * 废弃值 `'consumer'` 映射 `'host'` + warn。
 */
export abstract class OverlayDirective extends ComponentDirective {
    /** 覆盖物组件名 = 消费 attr 名（x-dialog:login 的 login） */
    protected get overlayName(): string {
        return this.attr ?? "";
    }

    /** 当前活跃实例（visible 驱动；声明式单驱动点至多一个活跃实例，关闭后残留引用经 destroyed 守卫） */
    protected _overlayInstance: OverlayInstance | null = null;
    /** 值对象保留配置键子集（closeOnMask/animate/at/scope，合并链最顶层——共识 6/7） */
    protected _inlineConfig: Record<string, any> | null = null;
    /** 当前驱动状态（visible 真值；子类 watch 维护——等待的组件就绪后据此决定是否打开） */
    protected _driveOn = false;

    /** 模态遮罩外壳（DialogDirective 覆盖 true；基座默认裸面板直挂容器——未来形态定制点） */
    protected get _modalMask(): boolean {
        return false;
    }

    /** 打开（visible 真值路径）：查找 → 防护 → 配置链 → 实例化到 body 容器 */
    protected _open(props?: Record<string, any>): void {
        this._instantiate(this.overlayName, props);
    }

    /** 状态归假的关闭路径：直接 UI 关闭（状态已是唯一真相源，不走写回——ADR-0052 决策 7） */
    protected _close(): void {
        const inst = this._overlayInstance;
        if (inst && !inst.destroyed && inst.visible) inst.close();
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
        // 配置三级链（共识 6）：内置默认 < x-dialog-options（this.options）< 值对象内联保留键
        const config = resolveOverlayConfig(found.def, this.options ?? null, this._inlineConfig);
        const inst = new OverlayInstance(this.engine, name, found.snapshot, found.def, config, {
            parentScope: this._resolveParentScope(config, found.def),
            searchRoot: this.el ?? null,
            mask: this._modalMask,
        });
        this._overlayInstance = inst;
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
     * 数据视图基准挂链解析（共识 8；`scope` 键已更名 `dataContext`）：`'declarer'`（默认）挂
     * **声明处** scope（定义闭包——数据视图沿挂链即声明处上下文；悬空/全局组件无声明 scope →
     * rootless 防御，仅全局视图 + 级联守卫兜底）；`'host'` 挂**消费处** scope。
     *
     * 兼容：旧键 `config.scope`（字符串基准）废弃——兜底解析 + warn；旧值 `'consumer'` 映射
     * `'host'` + warn。
     *
     * 挂链即基准（决策 11 三合一）：表达式上下文 / 数据视图 / 生命周期级联统一由 parentScope 表达，
     * 无需 x-component 的 basis 施加（那是宿主化身场景——scope 留在消费处、数据视图跳声明处的解耦机制）。
     */
    private _resolveParentScope(
        config: OverlayConfig,
        def: ComponentDef | null,
    ): AutoSparkScope | null {
        let basis: ComponentDataBasis | string | undefined = config.dataContext;
        if (basis === undefined && config.scope !== undefined) {
            // 旧键 scope（字符串基准）兜底：warn 更名提示
            this.warn(
                `x-dialog:${this.attr}: 配置键 scope 已更名为 dataContext，本次按 dataContext: '${config.scope}' 处理`,
            );
            basis = config.scope;
        }
        if (basis === "consumer") {
            this.warn(
                `x-dialog:${this.attr}: dataContext: 'consumer' 已更名为 'host'（ADR-0053 修订），本次按 'host' 处理`,
            );
            basis = "host";
        }
        if (basis === "host") return this.binding;
        if (basis !== undefined && basis !== "declarer") {
            this.warn(
                `x-dialog:${this.attr}: 无效 dataContext ${JSON.stringify(basis)}（须 'declarer'|'host'），按默认 'declarer' 处理`,
            );
        }
        // declarer（默认）：挂声明处 scope；悬空守卫（已销毁）与全局组件（无声明 scope）→ rootless
        const declarer = def?.declarerScope ?? null;
        if (!declarer || declarer.destroyed) return null;
        return declarer;
    }

    /**
     * 「请求关闭」写回钩子（UI 触点：ESC / 遮罩 / close action → 实例 requestClose）。
     * 基座无写回目标（仅 UI 关闭）；子类按值形态注入（简单路径 visible 写回 false）。
     */
    protected _makeCloseRequest(): ((inst: OverlayInstance, source: string) => void) | null {
        return null;
    }
}
