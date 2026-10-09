// 导出核心类
export * from "./engine/engine";
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
// 通知体系类型（ADR-0071 NotificationManager/NotificationTask/ProgressTask/NotificationProps/NotificationOptions，manager 运行时随 engine 引入）
export * from "./features/notifications/types";
// 全量转导出 autostore：消费者仅需安装 autospark 即可获得 AutoStore 完整 API（ADR-0030）
export * from "autostore";
export * from "./types";
export * from "./engine/scope";
