/**
 * notifications 插件自举（@autospark/plugins ADR-0001 决策 4；形态逐项对称 router
 * 插件 ADR-0011）：通知以 AutoSpark 插件形态挂载，无独立入口。
 *
 * 模块加载期执行 {@link bootstrapNotificationsPlugin}，双路径注册（ADR-0114）：
 *
 * - `window.AutoSpark` 已存在（引擎脚本先加载）→ 经类静态 `AutoSpark.ready` 挂载
 *   per-engine 逻辑；
 * - 否则（IIFE 先于引擎加载 / ESM 无全局）→ 包成插件体推入
 *   `globalThis.__AUTOSPARK_PLUGINS__` 预加载队列，首个 engine 构造开头 drain 执行。
 *
 * **ready 自举序列**（每 engine 各一次，retain 语义——晚加载对存活 engine 补挂载）：
 *
 * 1. 注册 4 内置组件模板进 **engine 实例** `options.builtinComponents` 种子（构造期已与
 *    BUILTIN_COMPONENTS 及用户声明合并的 per-engine 副本；**占用检查**：用户同名声明优先）。
 *    不入插件静态全局表（`AutoSpark.components`）：该表命中走跨 engine 共享 def 缓存，会把
 *    「继承自 shell 的 type def」按名一次性烘焙，击穿后续 engine 的 options.components
 *    覆盖；且静态表查找序先于 builtinComponents，令该覆盖通道失效——per-engine 种子
 *    与迁出前 engine 行为逐位一致；
 * 2. 构造 `NotificationManager`（读 `options.notifications`，注入 `$notifications` 保留键、
 *    恢复 local 持久化记录；`notifications: false` 时构造即短路）；
 * 3. 挂 `engine.notifications` 实例属性；
 * 4. 注册三件套 action（toast/confirm/task）进 `engine.actions` Proxy——**占用检查**：
 *    用户同名声明优先（对齐内置补齐「只补未占用键」纪律，ADR-0001 后果节）；
 * 5. 监听 `engine/destroy/before` 清理（dispose：无动画硬销毁 + 持久化 flush + 容器移除）。
 *
 * 未装插件时的行为（硬切，不留薄桥）：`toast/confirm/task` action 查找失败报错、通知
 * 组件缺失——报错本身即「该装插件了」的引导（ADR-0001 决策 3）。
 */

import type { ActionDecl, AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { NotificationManager } from "./runtime/manager";
import { NOTIFICATION_COMPONENTS } from "./components";
import { createToastSpec } from "./actions/toast";
import { createConfirmSpec } from "./actions/confirm";
import { createTaskSpec } from "./actions/task";

/** 三件套 action 注册表：注册键 → 执行体工厂（闭包绑定本 engine 实例） */
const NOTIFICATION_ACTIONS: Record<string, (engine: AutoSpark<any>) => ActionDecl> = {
    toast: createToastSpec,
    confirm: createConfirmSpec,
    task: createTaskSpec,
};

/**
 * 注册 4 内置组件模板：写入 engine 实例的 builtinComponents 种子（构造期已合并
 * BUILTIN_COMPONENTS 与用户声明的 per-engine 副本），只补未占用键。
 */
function registerComponents(engine: AutoSpark<any>): void {
    const seed = engine.options.builtinComponents ?? (engine.options.builtinComponents = {});
    for (const [name, code] of Object.entries(NOTIFICATION_COMPONENTS)) {
        if (seed[name] == null) seed[name] = code;
    }
}

/**
 * ready 回调：per-engine 挂载通知子系统。
 */
function mountNotifications(engine: AutoSpark<any>): void {
    registerComponents(engine);
    // manager 构造（enabled=false 短路形态照常挂属性——add() warn + no-op 语义延续）
    const manager = new NotificationManager(engine);
    (engine as any).notifications = manager;
    // 三件套 action：只补用户未占用的键（engine.actions Proxy set trap 自动规范化包装，
    // 生命周期广播绑定本 engine）
    for (const [name, create] of Object.entries(NOTIFICATION_ACTIONS)) {
        if (name in engine.actions) continue;
        engine.actions[name] = create(engine);
    }
    // destroy 清理：dispose 为无动画硬销毁 + flushNow + 容器移除，语义与旧引擎
    // destroy 尾部的直调等价（时序提前到 destroy/before，scope 级联前的自查无损）
    engine.on("engine/destroy/before", () => manager.dispose());
}

/**
 * 双路径注册（模块加载期执行一次，单点收敛于 {@link installPlugin}；见模块注释）。
 */
export function bootstrapNotificationsPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（脚本场景 globalThis 直取；队列路径插件体注入）
        autospark.ready(mountNotifications);
    });
}
