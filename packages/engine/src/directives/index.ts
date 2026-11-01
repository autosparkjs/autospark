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
export * from "./x-if";
export * from "./x-else";
export * from "./x-case";
export * from "./x-show";
export * from "./x-loading";
export * from "./x-error";
export * from "./x-isolate";
export * from "./x-scope";
export * from "./x-component";
export * from "./x-define";
export * from "./x-slot";
export * from "./x-super";
export * from "./x-icon";
export * from "./x-icons";
export * from "./x-import";

import type { AutoSparkDirectiveBase } from "../features/directive/base";
import { TextDirective } from "./x-text";
import { HtmlDirective } from "./x-html";
import { IfDirective } from "./x-if";
import { ElseDirective } from "./x-else";
import { SwitchDirective } from "./x-switch";
import { CaseDirective } from "./x-case";
import { ShowDirective } from "./x-show";
import { ForDirective } from "./x-for";
import { DataDirective } from "./x-data";
import { BindDirective } from "./x-bind";
import { OnDirective } from "./x-on";
import { LoadingDirective } from "./x-loading";
import { ErrorDirective } from "./x-error";
import { IsolateDirective } from "./x-isolate";
import { TeleportDirective } from "./x-teleport";
import { ModelDirective } from "./x-model";
import { ScopeDirective } from "./x-scope";
import { ComponentDirective } from "./x-component";
import { DefineDirective } from "./x-define";
import { SlotDirective } from "./x-slot";
import { SuperDirective } from "./x-super";
import { ImportDirective } from "./x-import";
import { FormDirective } from "./x-form";
import { FieldDirective } from "./x-field";
import { IconDirective } from "./x-icon";
import { IconsDirective } from "./x-icons";

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
 *
 * **核心集定界（ADR-0128）**：tree / version / 布局域七指令（resizable / splitter /
 * expandable / layout / pane / container / viewport）与 overlay 家族四指令（dialog /
 * popover / drawer / foldable）已外移 `@autospark/plugins`（autospark.tree.js /
 * autospark.version.js / autospark.layout.js / autospark.overlay.js，选择性引入）。
 * overlay 机制薄层（features/overlay/{container,handle,types}）留核心——getOverlay
 * 公开 API 与 getOverlayContainer 消费面连续（ADR-0128 决策 2）。
 */
export const presetDirectives: Record<string, typeof AutoSparkDirectiveBase> = {
    text: TextDirective,
    html: HtmlDirective,
    if: IfDirective,
    "else-if": ElseDirective,
    else: ElseDirective,
    switch: SwitchDirective,
    case: CaseDirective,
    default: CaseDirective,
    show: ShowDirective,
    for: ForDirective,
    data: DataDirective,
    bind: BindDirective,
    on: OnDirective,
    model: ModelDirective,
    loading: LoadingDirective,
    // x-error 运行时错误捕获与呈现（ADR-0118）：就近消费 error 事件（action 桥接 / raise），
    // behavior 三态（none/addErrorClass/overlay），单错误槽新替旧
    error: ErrorDirective,
    isolate: IsolateDirective,
    // x-teleport 传送（ADR-0059）：一次性静态结构指令（ownsChildren 延迟编译 + dataContext 基准）
    teleport: TeleportDirective,
    scope: ScopeDirective,
    component: ComponentDirective,
    define: DefineDirective,
    slot: SlotDirective,
    // x-super 插槽 fallback 展开标记（ADR-0084）：引擎首个元素名形态指令
    //（static elementName = "x-super"，无属性形态——元素名即触发）
    super: SuperDirective,
    import: ImportDirective,
    form: FormDirective,
    field: FieldDirective,
    icon: IconDirective,
    // x-icons 图标集声明（ADR-0058）：经 compiler 前置 transformer 拦截、永不被实例化，
    // 注册仅为合法可发现名位（x-define 同构）。旧 `x-icon-define` 已硬移除（不注册、静默失效）。
    icons: IconsDirective,
};
