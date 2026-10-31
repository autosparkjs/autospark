// 导出核心类
export * from "./engine/engine";
// 指令基类与通道枚举（ADR-0111：外部指令扩展面——ESM 具名导入 / IIFE 经全局 AutoSpark 取用）
export { AutoSparkDirectiveBase, DirectiveKind } from "./features/directive/base";
export type { RuntimeDirective } from "./features/directive/base";
// 插件机制（ADR-0111 / ADR-0114）：$.directive 的 spec 类型 + 安装器/就绪回调/
// 预加载队列元素类型（运行时机制随 engine 引入）
export type { DirectiveSpec } from "./features/directive/global-queue";
export type {
    DirectiveInstaller,
    PluginBootstrap,
    PluginPrecompileCallback,
    PluginReadyCallback,
} from "./features/plugin";
// 组件实例门面（ADR-0080：engine.getComponent(el) 的返回类型）
export * from "./features/component/component-instance";
// 图标注册表（ADR-0046/0047：AutoSpark.icons 同一实例的类型与单例导出）
export * from "./features/icons/registry";
// action 声明/描述符类型（ADR-0036 ActionDesc/ActionDecl，纯类型导出）
export * from "./features/action/types";
// 组件定义类型（ADR-0086：`engine.registerComponent` 的返回类型，消费者可指名标注）
export type {
    ComponentDef,
    ComponentSetup,
    ComponentHooks,
    ComponentDataBasis,
    ComponentDataContext,
} from "./features/component/component-def";
// 覆盖物容器（@autospark/plugins ADR-0001：通知插件等 overlay 挂载消费者取用——
// engine 唯一为插件新增的公开面，此前仅 overlay 家族内部使用）
export { getOverlayContainer } from "./features/overlay/container";
// 动画解析（ADR-0128 决策 5：指令插件消费面——外移指令的进出场动画解析依赖，
// overlay 家族与 tooltip 同款取用）
export { resolveAnimate } from "./features/animate/animate";
export type { ResolvedAnimate } from "./features/animate/animate";
// 指令信息类型（ADR-0128 决策 5：插件结构指令 ownsChildren(info) 的参数类型）
export type { AutoDirectiveInfo } from "./features/directive/types";
// scope 注册表键（x-data 数据域容器，store.state[SCOPES_KEY][scope.id]）：插件生态按路径
// 精准订阅 scope 数据的公开坐标（同步 fire 语义的基石——scope.watch 经 scheduler 微任务
// 合并会吞连续写入的中间值，契约广播类订阅必须走 store 点路径）
export { SCOPES_KEY } from "./consts";
// 全量转导出 autostore：消费者仅需安装 autospark 即可获得 AutoStore 完整 API（ADR-0030）
export * from "autostore";
export * from "./types";
export * from "./engine/scope";

// 插件生态运行时取值面：库成员挂为类静态（ADR-0111 决策 1 的源码级实现——IIFE 产物经
// 构建后处理挂全量导出，此处补齐 ESM/CJS 形态的同构面）。消费方：@autospark/plugins
// 运行时桥（src/runtime/bridge.ts）经 `globalThis.AutoSpark` / 预加载队列捕获的命名空间
// 解析 autospark 能力——名单须与桥消费面同步，plugins 测试锁漂移（缺位即红）。
import { AutoSpark } from "./engine/engine";
import { getOverlayContainer } from "./features/overlay/container";
import { ComponentInstance } from "./features/component/component-instance";
import { SCOPES_KEY } from "./consts";
import { markRaw, shallow } from "autostore";

(AutoSpark as any).getOverlayContainer ??= getOverlayContainer;
(AutoSpark as any).markRaw ??= markRaw;
(AutoSpark as any).shallow ??= shallow;
(AutoSpark as any).ComponentInstance ??= ComponentInstance;
(AutoSpark as any).SCOPES_KEY ??= SCOPES_KEY;
