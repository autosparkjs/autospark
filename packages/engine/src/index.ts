// 导出核心类
export * from "./engine";
// 图标注册表（ADR-0046/0047：AutoSpark.icons 同一实例的类型与单例导出）
export * from "./icons/registry";
// action 声明/描述符类型（ADR-0036 ActionDesc/ActionDecl，纯类型导出）
export * from "./actions/types";
// 全量转导出 autostore：消费者仅需安装 autospark 即可获得 AutoStore 完整 API（ADR-0030）
export * from "autostore";
