import type { AutoSpark } from "../../engine/engine";
import { AutoSparkDirectiveBase } from "./base";
import type { DirectiveKind } from "./base";

/**
 * 外部指令全局安装队列（ADR-0100）。
 *
 * script/IIFE 场景的指令发现机制：`window.__AUTOSPARK_DIRECTIVES__` 是**指令安装器**
 * （`(engine) => void`，领域名见 CONTEXT.md）的先到先存队列——
 *
 * - 指令插件脚本任意时刻 `push` 安装器（先于/后于引擎加载皆可；安装器体执行时引擎必已加载，
 *   体内可安全取 `AutoSparkSpaces.AutoSparkDirectiveBase` 等全局）；
 * - 首个 engine 构造时（惰性，无 window 环境跳过）：将数组替换为 Proxy（push trap 广播存活
 *   engine）+ 全量消费现有队列 → 本 engine；后续构造只消费不重复 Proxy 化；
 * - push trap：晚到的安装器立即对全部存活 engine 执行（晚注册语义见 DirectiveManager.set：
 *   就绪前待 initializeAll、就绪后立即 initialize + Runtime 重扫）。
 *
 * 两条文档约定（Proxy 固有边角，ADR-0100 决策 5 明码标价）：始终经
 * `window.__AUTOSPARK_DIRECTIVES__.push(...)` 触达——缓存原数组引用的 push 不经 trap，只影响
 * 未来 engine；Proxy 化后禁止整体重赋值该属性（丢失监听）。
 */

/** 全局队列挂载的属性名（dunder 形式——「框架握手协议」语义，非日常 API，ADR-0100 决策 1） */
export const GLOBAL_DIRECTIVES_QUEUE = "__AUTOSPARK_DIRECTIVES__";

/** 指令安装器：全局队列元素形态（ADR-0100 决策 2）。每 engine 构造期调用一次 */
export type DirectiveInstaller = (engine: AutoSpark<any>) => void;

/** 存活 engine 表：构造入表（队列消费完成后，杜绝 trap 命中未就绪 engine）、destroy 摘除 */
const liveEngines = new Set<AutoSpark<any>>();

/** 队列是否已完成 Proxy 化（一次性守卫，首个 engine 构造时执行） */
let queueProxied = false;

/**
 * 读当前队列（不存在则初始化为空数组；非数组则 warn 后重置——防用户误塞其他类型）。
 * 仅在 window 存在时被调用（setup / enqueueInstaller 均有 window 判据前置）。
 */
function readQueue(): DirectiveInstaller[] {
    const host = globalThis as any;
    const existing = host[GLOBAL_DIRECTIVES_QUEUE];
    if (Array.isArray(existing)) return existing;
    if (existing !== undefined) {
        console.warn(
            `window.${GLOBAL_DIRECTIVES_QUEUE} 须为数组（收到 ${typeof existing}），已重置（ADR-0100）`,
        );
    }
    const queue: DirectiveInstaller[] = [];
    host[GLOBAL_DIRECTIVES_QUEUE] = queue;
    return queue;
}

/** 安装器入队（defineDirective 通道）：无 window 环境（SSR）静默跳过，调用方照常返回 */
function enqueueInstaller(installer: DirectiveInstaller): void {
    if (typeof window === "undefined") return;
    readQueue().push(installer); // Proxy 化后经 trap 广播存活 engine；否则仅入队待首个构造消费
}

/** 执行单个安装器（抛错隔离，ADR-0100 决策 12：记日志跳过，不中断其它安装器与 engine 构造） */
function runInstaller(installer: DirectiveInstaller, engine: AutoSpark<any>): void {
    try {
        installer(engine);
    } catch (e) {
        engine.logger.error(
            `指令安装器执行失败，已跳过（ADR-0100）: ${e instanceof Error ? e.message : String(e)}`,
        );
    }
}

/**
 * engine 构造期接入（engine.ts 构造中 `DirectiveManager` 创建后、autostart compile 前调用，
 * ADR-0100 决策 3）：安装器先于首次编译注册，保证参与首次编译；就绪前 `install`/`set` 只注册，
 * 由 `initializeAll` 统一 initialize。
 *
 * 首次调用完成 Proxy 化；每次调用全量消费现有队列 → 本 engine（消费幂等由 DirectiveManager
 * 的 Map 语义 + initialized 集合保证，决策 12），最后入存活表。
 */
export function setupGlobalDirectiveQueue(engine: AutoSpark<any>): void {
    if (typeof window !== "undefined" && !queueProxied) {
        queueProxied = true;
        const raw = readQueue();
        (window as any)[GLOBAL_DIRECTIVES_QUEUE] = new Proxy(raw, {
            get(target, prop, receiver) {
                if (prop === "push") {
                    // 只拦 push（队列协议唯一写法，ADR-0100 决策 5）：写入底层后广播存活 engine
                    return (...items: DirectiveInstaller[]): number => {
                        const len = Array.prototype.push.apply(target, items);
                        for (const item of items) {
                            for (const eng of liveEngines) runInstaller(item, eng);
                        }
                        return len;
                    };
                }
                return Reflect.get(target, prop, receiver);
            },
        });
    }
    const queue =
        typeof window === "undefined"
            ? []
            : ((window as any)[GLOBAL_DIRECTIVES_QUEUE] as DirectiveInstaller[]);
    // 活迭代（不快照）：安装器在消费期间再 push 时，本 engine 也能吃到（trap 广播
    // 触达不了尚在构造、未入存活表的本 engine，活迭代补上这条通路）
    for (const installer of queue) runInstaller(installer, engine);
    liveEngines.add(engine);
}

/** engine.destroy 摘除存活表（ADR-0100 决策 15）：销毁后不再触达晚到的安装器 */
export function unregisterLiveEngine(engine: AutoSpark<any>): void {
    liveEngines.delete(engine);
}

/**
 * `defineDirective` 指令定义 spec（最小键集，ADR-0100 决策 10）。
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
 * 定义外部指令并**立即加入全局安装队列**（定义即全局安装，ADR-0100 决策 10）：
 * 造类（继承基类）→ 安装器入队（存活 engine 经 push trap 即时生效；尚无 engine 则待首个
 * 构造消费）→ 返回类本身（可组合、可测试）。
 *
 * - 同名重复 define 走 {@link DirectiveManager.install} 语义（撞预设名 warn + 跳过 /
 *   撞自定义名 warn + 覆盖）；
 * - 无 window 环境（SSR）入队部分静默跳过，类照常返回；
 * - 高级形态（结构指令 / 元素名指令 / 类级钩子 / singleton）不在最小 spec 内，请直接继承基类。
 */
export function defineDirective(spec: DirectiveSpec): typeof AutoSparkDirectiveBase {
    if (typeof spec.name !== "string" || spec.name === "") {
        throw new Error(`AutoSpark.defineDirective: spec.name 必填（指令注册名，如 "highlight"）`);
    }
    class DefinedDirective extends AutoSparkDirectiveBase {}
    for (const key of SPEC_STATIC_KEYS) {
        if (spec[key] !== undefined) (DefinedDirective as any)[key] = spec[key];
    }
    for (const key of SPEC_HOOK_KEYS) {
        const hook = spec[key];
        if (hook) (DefinedDirective.prototype as any)[key] = hook;
    }
    enqueueInstaller((engine) => {
        engine.directives.install(spec.name, DefinedDirective);
    });
    return DefinedDirective;
}
