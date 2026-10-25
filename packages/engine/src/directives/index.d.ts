export * from "./x-bind";
export * from "./x-bind-spread";
export * from "./x-data";
export * from "./x-form";
export * from "./x-field";
export * from "./x-on";
export * from "./x-for";
export * from "./x-html";
export * from "./x-model";
export * from "./x-switch";
export * from "./x-teleport";
export * from "./x-text";
export * from "./x-tree";
export * from "./x-if";
export * from "./x-else";
export * from "./x-case";
export * from "./x-show";
export * from "./x-loading";
export * from "./x-error";
export * from "./x-isolate";
export * from "./x-scope";
export * from "../features/directive/overlay";
export * from "../features/directive/visible-overlay";
export * from "./x-dialog";
export * from "./x-popover";
export * from "./x-drawer";
export * from "./x-component";
export * from "./x-define";
export * from "./x-slot";
export * from "./x-super";
export * from "./x-icon";
export * from "./x-icons";
export * from "./x-import";
export * from "./x-resizable";
export * from "./x-splitter";
export * from "./x-expandable";
export * from "./x-layout";
export * from "./x-pane";
export * from "./x-foldable";
export * from "./x-container";
export * from "./x-viewport";
export * from "./x-version";
import type { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * 预设指令映射：指令名 → 指令类。
 *
 * 显式映射，避免依赖类的 `Function.name`。注册核心闭环指令（text/html/if/show/for/data/bind/on/loading/isolate）
 * + `scope`（ADR-0022：x-scope 结构占位）
 * + `component`（ADR-0054：x-component:名称 组件实例化指令，更名自 x-use）/ `define`
 * （x-define 组件定义供体，更名自 x-component，承接 ADR-0021/0022）
 * + `import`（ADR-0022：x-import 远程组件加载指令）。
 * `x-class` / `x-style` 经 getDirectives 解析期归一化为 `bind+class` / `bind+style`，无独立指令类。
 * `x-define` 经 compiler 前置 transformer 拦截、永不被实例化，注册仅为合法可发现名位。
 * `x-else` / `x-else-if` 同为名位（分支链逻辑在 IfDirective，剪枝在 compiler 前置 transformer，ADR-0034）；
 * `x-case` / `x-default` 亦为名位（分支选择逻辑在 SwitchDirective，剪枝同走前置 transformer，ADR-0037）。
 *
 * 注意：原 `x-patch` 指令已移除，因为 `x-scope` 指令可以完全替代其功能。
 * `x-scope` 同样是零副作用的 no-op 指令，能让纯静态元素建 scope 进入正向桥，
 * 从而被 `engine.patch` 定位。详见 ADR-0021 和 scope.ts 注释。
 */
export declare const presetDirectives: Record<string, typeof AutoSparkDirectiveBase>;
