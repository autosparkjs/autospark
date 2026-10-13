/**
 * 插件机制基础设施（ADR-0111）。
 *
 * script/IIFE 场景的第三方能力分发：插件 = 纯副作用脚本，经全局命名空间
 * `AutoSpark`（类与命名空间一体，jQuery `$` 同构）注册组件/指令/action/图标，
 * 并可经 `AutoSpark.ready(fn)` 拿 engine 实例做命令式操作。本模块是命名空间
 * API 的**通用后端**——ESM（挂类静态）与 IIFE（window 全局）同一份实现：
 *
 * - **ready 回调表**：per-engine 构造末尾各调一次（retain 语义——晚注册对存活
 *   engine 立即补调）；抛错隔离；destroy 摘除；
 * - **存活 engine 表**：广播目标（晚到的指令安装器）；构造入表、destroy 摘除；
 * - **指令安装器队列**：模块内存数组（取代 ADR-0100 的 window 键队列——script
 *   顺序加载保证插件文件后于引擎脚本求值，队列不丢）；构造期全量消费，
 *   晚入队广播存活 engine；
 * - **插件声明表**：`components`（组件模板字符串）/ `actions`（action 声明）——
 *   真全局、可变普通对象。engine 查找链到顶**查询期委托**兜底查表：不复制进
 *   engine、无运行时广播，晚注册天然立即生效；
 * - **全局 def 缓存**：插件组件的编译产物跨 engine 共享（每组件名全局只编译
 *   一次，首个消费的 engine 编译，后续 engine 直接取缓存挂账）。
 *
 * 分层：本模块不运行时引用引擎任何模块（engine 仅 type import）——global-queue
 * （指令域）与 engine 门面（组装根）单向引用本模块。
 */

import type { AutoSpark } from "../../engine/engine";
import type { ActionDecl } from "../action/types";
import type { ComponentDef } from "../component/component-def";

/** 插件就绪回调：每个 engine 构造完成后各调一次（`AutoSpark.ready(fn)` 的元素形态） */
export type PluginReadyCallback = (engine: AutoSpark<any>) => void;

// ── 存活 engine 表（ADR-0100 决策 15 语义沿用：构造入表、destroy 摘除） ──────────

const liveEngines = new Set<AutoSpark<any>>();

// ── ready 回调表（ADR-0111 决策 4） ────────────────────────────────────────────

/** 就绪回调表（Set 天然去重：同一函数引用多次注册只生效一次） */
const readyCallbacks = new Set<PluginReadyCallback>();

/** 执行单个就绪回调（抛错隔离：记日志跳过，不中断其他回调与 engine 构造） */
function runReadyCallback(callback: PluginReadyCallback, engine: AutoSpark<any>): void {
    try {
        callback(engine);
    } catch (e) {
        console.error(
            `AutoSpark.ready: 就绪回调执行失败，已跳过（ADR-0111）: ${e instanceof Error ? e.message : String(e)}`,
        );
    }
}

/**
 * 注册就绪回调（`AutoSpark.ready(fn)` 后端）：入表，并对所有**存活** engine 立即各补调
 * 一次（retain 语义——晚注册不丢已存在的 engine；尚无 engine 时仅入表待构造触发）。
 */
export function registerPluginReady(callback: PluginReadyCallback): void {
    readyCallbacks.add(callback);
    for (const engine of liveEngines) runReadyCallback(callback, engine);
}

/** engine 构造末尾触发（engine.ts 在 `engine/ready` 事件发射处调用）：全部回调各调一次 */
export function firePluginReady(engine: AutoSpark<any>): void {
    for (const callback of readyCallbacks) runReadyCallback(callback, engine);
}

// ── 指令安装器队列（ADR-0111 决策 5：内存队列取代 ADR-0100 的 window 键队列） ────

/** 指令安装器：安装队列元素形态（ADR-0100 决策 2 类型沿用）。每 engine 构造期调用一次 */
export type DirectiveInstaller = (engine: AutoSpark<any>) => void;

/** 安装器内存队列（先到先存；engine 构造期全量消费，晚入队广播存活 engine） */
const directiveInstallers: Array<(engine: AutoSpark<any>) => void> = [];

/**
 * 安装器入队（`$.directive` 两重载的共用后端）：入内存队列 + 广播全部存活 engine（晚注册即时
 * 生效——Runtime 指令重扫 / Compile 指令只影响未来编译）。抛错隔离：安装器执行失败
 * 记日志跳过，不中断其它安装器与调用方。
 */
export function enqueueDirectiveInstaller(
    installer: (engine: AutoSpark<any>) => void,
): void {
    directiveInstallers.push(installer);
    for (const engine of liveEngines) {
        try {
            installer(engine);
        } catch (e) {
            console.error(
                `指令安装器执行失败，已跳过（ADR-0111）: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
    }
}

// ── 构造期接入 / 摘除 ──────────────────────────────────────────────────────────

/**
 * engine 构造期接入（engine.ts 构造中 `DirectiveManager` 创建后、autostart compile 前
 * 调用——安装器先于首次编译注册，保证参与首次编译）：全量消费现有队列 → 本 engine
 * （消费幂等由 DirectiveManager 的 Map 语义 + initialized 集合保证），并入存活表。
 *
 * 活迭代（不快照）：安装器在消费期间再入队时，广播触达不了尚在构造、未入存活表的
 * 本 engine，活迭代补上这条通路。
 */
export function setupPluginQueue(engine: AutoSpark<any>): void {
    for (let i = 0; i < directiveInstallers.length; i++) {
        try {
            directiveInstallers[i](engine);
        } catch (e) {
            console.error(
                `指令安装器执行失败，已跳过（ADR-0111）: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
    }
    liveEngines.add(engine);
}

/** engine.destroy 摘除存活表：销毁后不再触达晚到的安装器与就绪回调 */
export function unregisterPluginEngine(engine: AutoSpark<any>): void {
    liveEngines.delete(engine);
}

// ── 插件组件声明表 + 全局 def 缓存（ADR-0111 决策 5） ──────────────────────────

/**
 * 全局组件声明表（`AutoSpark.components` 的底层对象）：名字 → 模板字符串（与
 * `options.components` 同构的声明形态）。查询期委托：engine 查找链兜底读本表，
 * 晚注册天然立即生效；同名后注册覆盖先注册。
 */
export const pluginComponents: Record<string, string> = {};

/**
 * 全局 def 缓存：插件组件的编译产物跨 engine 共享（每组件名全局只编译一次）。
 * 值语义：`ComponentDef` = 共享产物；`null` = 「编译过且失败」的未命中标记（避免各
 * engine 重复尝试失败声明）；无条目 = 未编译过。
 */
const sharedComponentDefs = new Map<string, ComponentDef | null>();

/** 查声明表（engine `_resolveGlobalComponent` 查找链的插件层）：返回原始模板字符串 */
export function getPluginComponentRaw(name: string): string | undefined {
    return pluginComponents[name];
}

/** 声明表是否已有该名（`_hasGlobalComponentSource` 覆盖 warn 判据的一层） */
export function hasPluginComponent(name: string): boolean {
    return pluginComponents[name] != null;
}

/** 读全局 def 缓存：`undefined` = 未编译过；`null` = 历史编译失败；def = 共享产物 */
export function takeSharedComponentDef(name: string): ComponentDef | null | undefined {
    return sharedComponentDefs.get(name);
}

/** 写全局 def 缓存（编译成功回写产物、失败回写 null 标记） */
export function putSharedComponentDef(name: string, def: ComponentDef | null): void {
    sharedComponentDefs.set(name, def);
}

// ── 插件 action 声明表（ADR-0111 决策 5） ──────────────────────────────────────

/**
 * 全局 action 声明表（`AutoSpark.actions` 的底层对象）：声明形态（函数简写 | 对象写法，
 * ADR-0036）。engine `getAction` 链末端兜底查表，命中即经**触发 engine** 的
 * ActionManager 惰性物化（规范化 + buildAction 包装绑定本 engine 的总线与生命周期
 * 广播）——同一声明在多实例中各绑定各的触发上下文，声明无状态即可安全共享。
 */
export const pluginActions: Record<string, ActionDecl> = {};

/** 查声明表（scope `getAction` 链末端的插件层） */
export function getPluginActionDecl(name: string): ActionDecl | undefined {
    return pluginActions[name];
}

/** 删除声明表条目（惰性物化遇非法声明时清除，避免每次查找重复报错） */
export function deletePluginActionDecl(name: string): void {
    delete pluginActions[name];
}
