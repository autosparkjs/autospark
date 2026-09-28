export * from "./bind";
export * from "./bind-spread";
export * from "./data";
export * from "./form";
export * from "./field";
export * from "./on";
export * from "./for";
export * from "./html";
export * from "./model";
export * from "./switch";
export * from "./teleport";
export * from "./text";
export * from "./tree";
export * from "./if";
export * from "./else";
export * from "./case";
export * from "./show";
export * from "./loading";
export * from "./isolate";
export * from "./scope";
export * from "./overlay";
export * from "./visible-overlay";
export * from "./dialog";
export * from "./popover";
export * from "./drawer";
export * from "./component";
export * from "./define";
export * from "./slot";
export * from "./icon";
export * from "./icons";
export * from "./import";
export * from "./resize";

import type { AutoSparkDirectiveBase } from "../base";
import { TextDirective } from "./text";
import { HtmlDirective } from "./html";
import { IfDirective } from "./if";
import { ElseDirective } from "./else";
import { SwitchDirective } from "./switch";
import { CaseDirective } from "./case";
import { ShowDirective } from "./show";
import { ForDirective } from "./for";
import { TreeDirective } from "./tree";
import { DataDirective } from "./data";
import { BindDirective } from "./bind";
import { OnDirective } from "./on";
import { LoadingDirective } from "./loading";
import { IsolateDirective } from "./isolate";
import { TeleportDirective } from "./teleport";
import { DialogDirective } from "./dialog";
import { DrawerDirective } from "./drawer";
import { PopoverDirective } from "./popover";
import { ModelDirective } from "./model";
import { ScopeDirective } from "./scope";
import { ComponentDirective } from "./component";
import { DefineDirective } from "./define";
import { SlotDirective } from "./slot";
import { ImportDirective } from "./import";
import { FormDirective } from "./form";
import { FieldDirective } from "./field";
import { IconDirective } from "./icon";
import { IconsDirective } from "./icons";
import { ResizeDirective } from "./resize";

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
    tree: TreeDirective,
    data: DataDirective,
    bind: BindDirective,
    on: OnDirective,
    model: ModelDirective,
    loading: LoadingDirective,
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
    import: ImportDirective,
    form: FormDirective,
    field: FieldDirective,
    icon: IconDirective,
    // x-icons 图标集声明（ADR-0058）：经 compiler 前置 transformer 拦截、永不被实例化，
    // 注册仅为合法可发现名位（x-define 同构）。旧 `x-icon-define` 已硬移除（不注册、静默失效）。
    icons: IconsDirective,
    // x-resize 尺寸调节（ADR-0064）：自绘手柄拖拽调宿主尺寸（可选值双向 + resize:* 事件）；
    // overlay 家族的 resize 选项复用其 ResizeSession 核心（写路径走 shell 面板）
    resize: ResizeDirective,
};
