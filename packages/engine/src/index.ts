// 导出核心类
export * from "./engine";
// 组件实例门面（ADR-0080：engine.getComponent(el) 的返回类型）
export * from "./component-instance";
// 图标注册表（ADR-0046/0047：AutoSpark.icons 同一实例的类型与单例导出）
export * from "./icons/registry";
// action 声明/描述符类型（ADR-0036 ActionDesc/ActionDecl，纯类型导出）
export * from "./actions/types";
// 组件定义类型（ADR-0086：`engine.registerComponent` 的返回类型，消费者可指名标注）
export type {
    ComponentDef,
    ComponentSetup,
    ComponentHooks,
    ComponentDataBasis,
    ComponentDataContext,
} from "./directives/component-def";
// 消息体系类型（ADR-0071 MessageManager/MessageTask/ProgressTask/MessageProps/MessageOptions，manager 运行时随 engine 引入）
export * from "./messages/types";
// 全量转导出 autostore：消费者仅需安装 autospark 即可获得 AutoStore 完整 API（ADR-0030）
export * from "autostore";
export * from "./types";
export * from "./scope";
