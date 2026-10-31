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
import { DialogDirective } from "./x-dialog";
import { DrawerDirective } from "./x-drawer";
import { PopoverDirective } from "./x-popover";
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
import { ResizableDirective } from "./x-resizable";
import { SplitterDirective } from "./x-splitter";
import { ExpandableDirective } from "./x-expandable";
import { LayoutDirective } from "./x-layout";
import { PaneDirective } from "./x-pane";
import { FoldableDirective } from "./x-foldable";
import { ContainerDirective } from "./x-container";
import { ViewportDirective } from "./x-viewport";
import { VersionDirective } from "./x-version";

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
    // 覆盖物体系（ADR-0052 修订版）：x-dialog 模态形态消费者（OverlayDirective 基座不注册——
    // 模板无 x-overlay 语法，覆盖物内容 = 任意组件，消费 attr 名即组件名）
    dialog: DialogDirective,
    // x-popover 悬浮形态消费者（ADR-0060）：宿主 mouseenter 触发、共享 hover 域 + hover 链
    popover: PopoverDirective,
    // x-drawer 贴边抽屉形态消费者（ADR-0063）：屏幕贴边默认 + 元素贴边锚定（长轴=锚边长）
    drawer: DrawerDirective,
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
    // x-resizable 尺寸调节（ADR-0064 更名版，原名 x-resize 已退役）：自绘手柄拖拽调宿主尺寸
    //（可选值双向 + resize:* 事件）；overlay 家族的 resize 选项复用其 ResizeSession 核心（写路径走 shell 面板）
    resizable: ResizableDirective,
    // x-splitter 分割器（ADR-0067）：两面板分割布局 + 分隔条拖拽调节 + collapsible 折叠把手
    splitter: SplitterDirective,
    // x-expandable 展开折叠（ADR-0069）：值为显式展开态布尔（双向绑定），把手 + collapse
    // 双通道滑出/收缩；后续阶段 x-splitter collapsible 与 x-drawer 把手将组合本指令
    expandable: ExpandableDirective,
    // x-layout 布局容器（ADR-0072）：grid 骨架 + x-pane 布局窗格（through 贯穿、存在性回流、
    // 行为组合 expandable/resize/splitter）；x-pane 为名位标记（收集/剪枝由 layout 接管，孤儿 warn）
    layout: LayoutDirective,
    pane: PaneDirective,
    // x-foldable 溢出折叠容器（ADR-0098 更名版，原名 x-block 已退役）：flex nowrap 布局 +
    // 溢出子元素折叠进 popover 面板（默认内置 shell，x-popover hover 接管，stash 真实搬移跨开关保态）
    foldable: FoldableDirective,
    // x-container 响应式容器（ADR-0101 立 / ADR-0105 重写）：Bootstrap .container 视觉契约；
    // 档位真相全局唯一（订阅 $.viewport 切 data-breakpoint，指令自身不做断点判定），
    // 视觉走纯 CSS media query（engine 阈值 × 实例 maxWidths 指纹），.fluid 关按档 max-width
    container: ContainerDirective,
    // x-viewport 视口档位显隐（ADR-0106）：$.viewport 声明式糖——切 autospark-viewport-hidden
    // 类（display:none !important），不碰 inline display（档位隐藏恒胜 x-show）；.hide 反向；
    // 档位未知静默失效恒可见
    viewport: ViewportDirective,
    // x-version 版本显隐（ADR-0119）：$.version 版本匹配表达式声明式糖——切
    // autospark-version-hidden 类（display:none !important），不碰 inline display
    //（版本隐藏恒胜 x-show）；空值 / $.version 未知静默恒渲染，非法子句 warn 整体忽略
    version: VersionDirective,
};
