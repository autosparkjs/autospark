import { AutoSparkDirectiveBase } from "./base";
import type { DirectiveKind } from "./base";
import { enqueueDirectiveInstaller, type DirectiveInstaller } from "../plugin";

export type { DirectiveInstaller };

/**
 * 外部指令定义通道（ADR-0111，取代 ADR-0100 的 window 安装队列）。
 *
 * `AutoSpark.directive` 是插件侧指令定义的**唯一公共入口**（spec / 类双重载，见
 * engine.ts 静态成员）；本模块是其 spec 重载的实现体：定义即全局安装——造类（继承基类）
 * → 安装器入**插件机制的模块内存队列**（`features/plugin`，ADR-0111 决策 5；原
 * `window.__AUTOSPARK_DIRECTIVES__` 载体已退役）→ 返回类本身。
 *
 * - 队列元素（指令安装器）在 engine 构造期被消费（先于首次编译，保证参与首次编译）；
 *   晚入队广播全部存活 engine（Runtime 指令即时生效 / Compile 指令只影响未来编译）；
 * - 同名重复 define 走 {@link DirectiveManager.install} 语义（撞预设名 warn + 跳过 /
 *   撞自定义名 warn + 覆盖）；
 * - 高级形态（结构指令 / 元素名指令 / 类级钩子 / singleton）不在最小 spec 内——经
 *   `$.directive(name, Cls)` 类重载安装。
 */

/**
 * 指令定义 spec（最小键集，ADR-0100 决策 10 类型沿用）。
 *
 * 覆盖简单指令的绝大多数场景：注册名 + 通道 + 优先级 + 六个实例钩子。结构指令
 * （`ownsChildren`）、元素名指令（`elementName`）、类级钩子（`initialize`/`dispose`）、
 * `singleton` 等高级形态不在 spec 内——请直接继承 {@link AutoSparkDirectiveBase}。
 */
export interface DirectiveSpec {
    /** 注册名（必填，缺失抛错）：`x-<name>` 的 `<name>`，如 `"highlight"` */
    name: string;
    /** 执行通道（缺省 Compile）：0=编译时（scope 通道）/ 1=运行时（observer 通道）/ 2=混合 */
    kind?: DirectiveKind;
    /** 优先级（缺省 0）：数字越大越先执行 */
    priority?: number;
    /** scope 通道：建立订阅的时机（Compile / Hybrid；订阅退订由 scope 统一管理） */
    created?(this: AutoSparkDirectiveBase): void;
    /** scope 通道：编译期首次渲染 */
    compile?(
        this: AutoSparkDirectiveBase,
        context: Record<string, any>,
        parent: HTMLElement,
    ): HTMLElement | undefined | void;
    /** scope 通道：元素移除 / scope 销毁时清理 */
    destroy?(this: AutoSparkDirectiveBase, el: HTMLElement): void;
    /** observer 通道：元素挂载（Runtime / Hybrid；经 `this.el` / `this.value` 访问宿主与属性原值） */
    mounted?(this: AutoSparkDirectiveBase): void;
    /** observer 通道：元素移除 */
    unmounted?(this: AutoSparkDirectiveBase): void;
    /** observer 通道：同名属性值变化（原地更新，不重挂） */
    attrChanged?(this: AutoSparkDirectiveBase, newVal: string, oldVal?: string): void;
}

/** spec 静态键 → 挂类上；钩子键 → 挂原型。键表即 spec 契约面（扩键须同步 {@link DirectiveSpec}） */
const SPEC_STATIC_KEYS = ["kind", "priority"] as const;
const SPEC_HOOK_KEYS = [
    "created",
    "compile",
    "destroy",
    "mounted",
    "unmounted",
    "attrChanged",
] as const;

/**
 * spec 重载实现体（`AutoSpark.directive(spec)` 转发至此）：造类（继承基类）→ 安装器入
 * 插件机制的内存队列（存活 engine 经广播即时生效；尚无 engine 则待首个构造消费）→
 * 返回类本身（可组合、可测试）。
 */
export function defineDirective(spec: DirectiveSpec): typeof AutoSparkDirectiveBase {
    if (typeof spec.name !== "string" || spec.name === "") {
        throw new Error(`AutoSpark.directive: spec.name 必填（指令注册名，如 "highlight"）`);
    }
    class DefinedDirective extends AutoSparkDirectiveBase {}
    for (const key of SPEC_STATIC_KEYS) {
        if (spec[key] !== undefined) (DefinedDirective as any)[key] = spec[key];
    }
    for (const key of SPEC_HOOK_KEYS) {
        const hook = spec[key];
        if (hook) (DefinedDirective.prototype as any)[key] = hook;
    }
    enqueueDirectiveInstaller((engine) => {
        engine.directives.install(spec.name, DefinedDirective);
    });
    return DefinedDirective;
}
