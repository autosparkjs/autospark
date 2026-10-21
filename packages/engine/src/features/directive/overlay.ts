import type { AutoSparkScope } from "../../engine/scope";
import type { ComponentDef } from "../component/component-def";
import { ComponentDirective } from "../../directives/x-component";
import {
    OverlayInstance,
    type OverlayInstanceOptions,
    type OverlayShellDef,
} from "../overlay/instance";
import { resolveOverlayConfig } from "../overlay/handle";
import {
    buildOverlayCacheKey,
    resolveDataContext,
    type OverlayConfig,
} from "../overlay/types";
import type { AutoSparkAction } from "../action/types";
import { collectSlotGroups, collectSlotSegments, getSlotMarker, type SlotContent } from "../../utils/slot";
import {
    injectErrorBridge,
    mountComponentHost,
    probeAndMount,
    type OverlayHostCtx,
} from "../overlay/contentHost";
import {
    DIALOG_SHELL_NAME,
    DRAWER_SHELL_NAME,
    POPOVER_SHELL_NAME,
} from "../../components";
import {
    ResizeSession,
    resolveHandles,
    resolveResizeConstraints,
    type ResizeDirection,
    type ResizeOptions,
} from "../../directives/x-resizable";

/**
 * OverlayDirective：覆盖物消费侧**公共抽象基座**（ADR-0052 修订版——组件化统一，共识 2/3）。
 *
 * 覆盖物不再是独立声明指令，而是「**任意组件被渲染到 body 容器的消费方式**」：内容 = 任意组件
 * （`x-define` 声明 / `options.components` 全局注册 / `x-import` 加载），组件名走消费 attr
 * （`x-dialog:login` 的 `login`）。本类**不注册 `presetDirectives`**（模板无 `x-overlay` 语法，
 * 旧声明指令与 `.global` 修饰符、engine 全局表已删——共识 1）。
 *
 * 继承 `ComponentDirective`（ADR-0054 更名自 UseDirective）组件查找能力（`getComponentDeclaration`
 * 查找、def 反查、递归深度防护），仅覆盖关键分歧（共识 3）：
 *
 * 1. **值语义**：组件名来自 attr（与 x-component 同一载体约定）；值专职 visible 布尔控制
 *    （子类解析，见 DialogDirective；对象形态已删除，ADR-0052 v2.3）；
 * 2. **实例化时机**：visible 真值触发 `_open()`（x-component 为编译期一次）；
 * 3. **目的地**：body 容器新实例（`OverlayInstance`，x-component 为宿主原地化身）——跳过
 *    `_mergeComponentRootAttrs` 属性继承。
 *
 * **内容宿主双委托（ADR-0123）**：overlay 不再自渲染内容——按组件注册状态生成内容宿主元素
 * 以消费处 scope 为父 wrapper-compile 编译进 shell 出口的 x-error 边界，渲染全委托：
 * - **组件已注册 / 探测命中 / pending（未注册无 url）** → 宿主 `x-component:名称="props表达式文本"`
 *   （指令值 props 通道，ADR-0110——三形态 + 持续热更新契约零变化；pending 占位 +
 *   component/registered 重试为 x-component 既有能力，ADR-0022 R6=B）；
 * - **未注册 + 声明 url** → 探测管线（importComponentsFromUrl：fetch + 解析 + 注册到消费处
 *   scope + url 缓存，x-import 同款）后分流——同名 `x-define` 命中转组件形态（远程模板其余
 *   内容放弃），未命中转片段宿主 `x-html.compile="url"`（url 形态 fetch → 子模板编译，
 *   `$loading`/`$error` 元键、竞态丢弃、中止策略全继承，ADR-0035/0017/0122）。
 *
 * **props 契约（ADR-0123 决策 3）**：组件路径 props 表达式文本直接作 x-component 指令值；
 * 片段路径模板没有 props 概念——props 求值快照经 compileChild initialData 注入 wrapper
 * scope 响应式 data 域（x-data 同语义），`_onPropsChange` 热应用 `Object.assign`（浅值
 * 比较守卫）。**时序统一「shell 先开」**：三态一律先开面板（x-error 边界兼加载锚呈现
 * x-loading 骨架），pending 从「不开面板只 warn」改为开面板 + 占位。
 *
 * **错误通道（ADR-0123 决策 4）**：探测失败 / 片段加载失败（watch 宿主 scope `$error` 元键）
 * 统一在 x-error 边界上派发 raise 同款 error 事件（ADR-0118 契约），呈现归边界 x-error 就近
 * 捕获；retry/close 经 `overlayRetry`/`overlayClose` 自定义 action（注入边界 scope 的
 * actions 通道）——retry 销毁内容宿主重走探测/生成（原位重载），close 请求关闭面板。
 *
 * props 通道（ADR-0052 v2.3）：**唯一声明式通道 = 选项成员属性** `x-dialog-options.props`（或定向
 * `x-dialog-options:<组件名>.props`，ADR-0007 修订）——值为表达式，三形态与 x-component 值同构
 * （无属性 = 无 props / 对象字面量（成员任意表达式）/ 纯状态路径按需展开），**持续热更新**。
 *
 * 配置两级链（v2.3）：`内置默认（基座） < x-dialog-options`（值对象内联层随对象形态删除）。
 * 数据视图基准 dataContext（共识 8；ADR-0053 修订更名自 `scope`）：显式声明经
 * `resolveDataContext` 解析保留；**缺省收敛消费处 scope**（宿主编译父 = `this.binding`——
 * props 表达式上下文与既有 watch 严格对齐，ADR-0123 决策 2）。
 */
/**
 * 形态键（`overlayKind`，兼 `options.overlay.{kind}` 配置键）→ 内置 shell 注册名
 * （`autospark.{kind}` 点前缀，ADR-0094 命名空间）映射：两个键域不同，兜底查找须换键。
 * 未知形态键回退 dialog（基座历史语义）。
 */
const KIND_SHELL_NAMES: Record<string, string> = {
    dialog: DIALOG_SHELL_NAME,
    popover: POPOVER_SHELL_NAME,
    drawer: DRAWER_SHELL_NAME,
};

/**
 * overlay chrome 出口名集合（ADR-0124 决策 11）：消费侧分段按名裁决的 chrome 判定基准。
 * 裸 `actions` 先归一为 `actions.right` 再比对；`default` / `body` 及其余名字恒内容组
 * （body 是 overlay 骨架的内容直通位，default 是面板内容本体）。
 */
const OVERLAY_CHROME_SLOT_NAMES: ReadonlySet<string> = new Set([
    "title",
    "header",
    "footer",
    "actions.top",
    "actions.left",
    "actions.right",
]);

export abstract class OverlayDirective extends ComponentDirective {
    /**
     * 覆盖物宿主是**触发点/声明点**（按钮标签、触发容器），不是组件化身——
     * 子节点保留在宿主正常渲染（不占有子树）。插槽内容打开时从**只读 template**
     * 克隆收集投影进 body 容器，不清空宿主（对齐 x-dialog 文档的按钮标签模式）。
     */
    static override ownsChildren(): boolean {
        return false;
    }

    /**
     * 同名多实例（对齐 OnDirective 先例）：宿主是纯声明点，同元素多覆盖物消费者
     * （`x-dialog:a` + `x-dialog:b`，不同 attr）各自独立驱动——并存是 ADR-0052 决策 8
     * 「宿主非触发器」的隐含要求，也是选项定向机制（ADR-0007 修订 `x-dialog-options:a.props`）
     * 的前提。同名**同 attr** 重复声明不去重（用户错误，双实例驱动同组件）。
     */
    static override readonly singleton = false;

    /** 覆盖物消费者标记（基类静态字段的唯一覆写点）：供 compiler 内容剪枝与 x-component 冲突检测按类判定 */
    static override readonly overlayConsumer = true;

    /**
     * 覆盖物组件名 = 消费 attr 名（x-dialog:login 的 login）。keepalive 修饰符糖（ADR-0119）
     * 无需在此剥离——解析器把 `:` 后首段定为 attr、`.` 后段定为 modifiers（getDirectives），
     * attr 天然不含修饰符段；糖义经 modifier→options 注入（ADR-0007：无参开关等价
     * options[name]=true，显式选项优先）自动进入配置合并链。点号组件名（`autospark.*`）
     * 经 x-component `_resolveComponentName` 升序回溯重建（ADR-0088），宿主 attr 原样写全名。
     */
    protected get overlayName(): string {
        return this.attr ?? "";
    }

    /**
     * 覆盖物形态键（ADR-0062）：引擎级默认 shell 的配置键（`options.overlay.{kind}.shell`）。
     * 基座空串（无引擎级默认键）；子类覆写——DialogDirective `'dialog'`、PopoverDirective `'popover'`。
     */
    protected overlayKind = "";

    /**
     * warn 消息前缀指令名（诊断用）：基座历史即 dialog 语义（'x-dialog'）；子类覆写为自身指令名
     * （x-popover / x-drawer），继承基座的 warn（未找到组件/props/shell 等）才不打错前缀。
     */
    protected directiveLabel = "x-dialog";

    /** 当前活跃实例（visible 驱动；声明式单驱动点至多一个活跃实例，关闭后残留引用经 destroyed 守卫） */
    protected _overlayInstance: OverlayInstance | null = null;
    /** 当前驱动状态（visible 真值；子类 watch 维护） */
    protected _driveOn = false;
    /** 当前求值 props（选项成员属性 props 的表达式产物；undefined = 无 props）——片段数据域热应用源 */
    protected _props: Record<string, any> | undefined;
    /** 上次热应用到片段数据域的 props（浅值比较基准，复用 ComponentDirective._propsEqual） */
    private _appliedProps: Record<string, any> | undefined;
    /** keepalive 挂起实例缓存（ADR-0119）：cacheKey → 实例——同键复用防重复堆叠；指令销毁统一回收 */
    private _keepaliveCache = new Map<string, OverlayInstance>();
    /** 进行中的探测中止器（ADR-0119 → ADR-0123 保留：retry 重载/指令销毁抢占旧探测） */
    private _remoteAbort: AbortController | null = null;
    /**
     * 消费侧收集裁决的内容组缓存（ADR-0124 决策 11）：chrome 分段剥离后的原始子组，供
     * retry 重载复用（重收集会让 chrome 段再入内容宿主）；undefined = 尚未裁决。
     */
    private _splitContent: ChildNode[] | null | undefined;

    /** 模态遮罩外壳（DialogDirective 覆盖 true；基座默认裸面板直挂容器——未来形态定制点） */
    protected get _modalMask(): boolean {
        return false;
    }

    override created(): void {
        // 宿主 x-options 的 props 键不被接受（ADR-0007 修订：props 不参与宿主回退——数据走
        // 指令级通道，元素级配置容器不承载）：warn + 忽略
        if (this.binding?.hostOptions && "props" in this.binding.hostOptions) {
            this.warn(
                `${this.directiveLabel}:${this.attr}: 宿主 x-options 中的 props 键不被接受（props 走 x-dialog-options.props 指令级通道），已忽略`,
            );
        }
        // props 通道（ADR-0052 v2.3）：先于通用管道单独订阅（纯状态路径形态需 depth:2 深层响应，
        // 对齐 x-component props 的订阅参数），通用管道跳过 props 键避免同一表达式双 watcher。
        // 求值产物（_props）供片段数据域热应用（ADR-0123 决策 3）；组件路径 props 走
        // x-component 指令值通道自治，本 watcher 求值仅为维护片段热应用源。
        const propsExpr = this.info.optionExprs?.props;
        let skip: string[] | undefined;
        if (propsExpr !== undefined) {
            skip = ["props"];
            if (propsExpr.trim() === "") {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: props 成员属性的值为空（须提供表达式：对象字面量或状态路径），已忽略`,
                );
            } else {
                const initial = this.binding.watch(
                    propsExpr,
                    ({ value }) => this._onPropsChange(value),
                    { depth: 2 },
                );
                this._onPropsChange(initial);
            }
        } else {
            // 整包内嵌 props（静态字面量子集，v2.3）：无 watch 无热更新，作初始 props——
            // 成员属性形态（表达式）整键覆盖本形态
            const staticProps = this.options?.props;
            if (staticProps !== undefined) this._onPropsChange(staticProps);
        }
        // 选项表达式统一管道（ADR-0007 修订）：其余配置成员（closeOnMask/at 等）建订阅——
        // 应用点 = 每次打开经 resolveOverlayConfig 现读（重开生效，配置不热应用）
        this._watchOptionExprs(skip);
    }

    /** 打开（visible 真值路径）：查找 → 防护 → 配置链 → 实例化到 body 容器（props 走指令值通道） */
    protected _open(): void {
        this._instantiate(this.overlayName);
    }

    /** 状态归假的关闭路径：直接 UI 关闭（状态已是唯一真相源，不走写回——ADR-0052 决策 7） */
    protected _close(): void {
        const inst = this._overlayInstance;
        if (inst && !inst.destroyed && inst.visible) inst.close();
    }

    /**
     * props 值变化（对齐 x-component `_onValueChange` 容错）：对象 → props 集合（v-bind="obj" 心智）；
     * null/undefined → 无 props（绑定的状态对象尚未就绪，静默）；数组/标量 → warn 忽略。
     * 片段形态活跃实例在场 → 浅值比较后**热应用**（`Object.assign` 进片段数据域，只覆盖出现键
     * ——ADR-0123 决策 3）；组件形态 props 走 x-component 指令值通道自治（宿主生成时的表达式
     * 文本 + x-component watch），此处不双重热应用。
     */
    private _onPropsChange(value: any): void {
        let props: Record<string, any> | undefined;
        if (Array.isArray(value)) {
            this.warn(
                `${this.directiveLabel}:${this.attr}: props 值须为对象（字面量或状态对象），数组已忽略: ${JSON.stringify(value)}`,
            );
        } else if (value != null && typeof value === "object") {
            props = value as Record<string, any>;
        } else if (value !== undefined && value !== null) {
            this.warn(
                `${this.directiveLabel}:${this.attr}: props 值须为对象（字面量或状态对象），已忽略: ${JSON.stringify(value)}`,
            );
        }
        this._props = props;
        const inst = this._overlayInstance;
        if (inst && !inst.destroyed && inst.isFragment && inst.instanceScope?.data) {
            if (!this._propsEqual(props, this._appliedProps)) {
                if (props) Object.assign(inst.instanceScope.data, props);
                this._appliedProps = props;
            }
        }
    }

    /**
     * 目的地覆盖（共识 3-3）：body 容器新实例（x-component 为宿主原地化身）——跳过 `_mergeComponentRootAttrs`。
     * 共享 x-component 的查找（`_findComponentDef`）、递归深度防护（`_recursiveDepth`）。
     *
     * **ADR-0123 统一编排**：keepalive 缓存身份（`组件名 + key + url`）同键挂起实例复用（open
     * 恢复）；实例创建即写入缓存（**打开即准入**，决策 5——pending 占位挂起无害）。实例 open
     * （shell 先开 + x-error 边界加载锚）后注入错误桥 actions，再按组件注册状态生成内容宿主
     * （共享实现见 `overlay/contentHost.ts`）：已注册 → 组件宿主；未注册 + url → 探测分流；
     * 未注册无 url → pending 宿主（x-component 占位 + registered 重试，warn 保留）。
     */
    protected override _instantiate(name: string): void {
        // 配置两级链（v2.3）：内置默认 < x-dialog-options（静态整包层 + 成员表达式层，各自
        // 归一化后 deepMerge——标量键表达式整键覆盖静态；at 等结构键简写经逐层归一化保留
        // 上层其余成员，v2.1 简写局部覆盖语义不变）。整包内嵌的 props 键已剥离（数据不走配置链）。
        // keepalive 修饰符糖（`x-dialog:name.keepalive`）已由解析器注入本层（keepalive: true）。
        const { props: _staticProps, ...optionLayer } = this.options ?? {};
        const config = this._resolveConfig(optionLayer);
        // keepalive 缓存身份（ADR-0119）：`组件名 + key + url` 复合键——同键挂起实例复用
        const cacheKey = buildOverlayCacheKey(name, config);
        if (config.keepalive === true) {
            const cached = this._keepaliveCache.get(cacheKey);
            if (cached && !cached.destroyed) {
                this._overlayInstance = cached;
                cached.open(); // 挂起态 → 恢复；已可见 → no-op（防重复堆叠）
                return;
            }
            if (cached) this._keepaliveCache.delete(cacheKey); // 已销毁残留：清位
        }
        const url = typeof config.url === "string" ? config.url.trim() : "";
        const found = this._findComponentDef(name);
        // 递归深度防护（T5=A，与 x-component 共享；未注册组件无递归风险，仅已注册路径前置判定）
        if (found && this._recursiveDepth(name) >= ComponentDirective.MAX_DEPTH) {
            this.warn(
                `${this.directiveLabel}:${this.attr}: 组件 "${name}" 递归实例化深度超过上限（${ComponentDirective.MAX_DEPTH}），已停止（疑似无终止条件递归）。`,
            );
            return;
        }
        // 插槽内容预收集（原始子节点，ADR-0056 决策十修订）：组件宿主克隆移入宿主子级
        // （x-component 收集分段投影承接）；片段路径无出口概念——生成时 warn 丢弃
        const group = this._collectSlotGroup(name);
        // 消费侧收集裁决（ADR-0124 决策 11）：chrome 分段（title/header/footer/actions.*，
        // 裸 actions 归一）自内容组剥离 stash 实例（open 前就位，_buildShellAndMount 并入
        // shell 内容集），其余保持原始子组走内容宿主管线；内容组缓存供 retry 重载复用。
        // 消费组件已声明的出口名优先（显式优先——同名段归属组件自出口，不入 chrome）。
        const split = this._splitOverlaySlots(group, found?.def?.slots);
        this._splitContent = split.content;
        // actions 双通道合并（ADR-0124 决策 7）：链上声明式（engine.actions + scope 链，
        // 显式 pos 准入，远→近覆盖）+ config.actions 配置式最后进；回写后随 config 整包
        // 注入 shell data 域 → 内嵌 overlay 组件 props.actions。
        const mergedActions = this._mergeOverlayActions(config.actions);
        if (mergedActions) config.actions = mergedActions;
        // shell 解析（ADR-0062）：面板外壳组件（config.shell > 引擎级默认 > 内置默认）
        const shell = this._resolveShell(config);
        // 宿主不清空：ownsChildren=false 下子节点是宿主自身内容（按钮标签等），照常保留
        const inst = new OverlayInstance(this.engine, name, document.createElement("div"), null, config, {
            parentScope: this.binding,
            searchRoot: this.el ?? null,
            mask: this._modalMask,
            shell,
            positioner: this._positioner(),
            onPanelReady: (ctx) => this._attachResize(ctx),
            cacheKey,
        });
        // chrome 段就位（open 前——_buildShellAndMount 并入 shell 内容集，ADR-0124 决策 11）
        inst.chromeSlots = split.chrome;
        inst.onCloseRequest = this._makeCloseRequest();
        this._overlayInstance = inst;
        // keepalive 打开即准入（ADR-0123 决策 5）：pending 占位/加载中挂起无害（watcher 存活）
        if (config.keepalive === true) this._keepaliveCache.set(cacheKey, inst);
        inst.open();
        // 错误桥 actions 注入 + 三态分流生成内容宿主（ADR-0123，声明式/命令式共享实现见
        // contentHost.ts）：初始挂载与 retry 重载共用同一三分支选择器
        const ctx = this._hostCtx(config);
        const regenerate = () => this._regenerateContent(inst, config, name, url);
        injectErrorBridge(ctx, inst, regenerate);
        regenerate();
    }

    /**
     * 内容宿主共享上下文（ADR-0123）：声明式通道差异全部注入——warn 前缀、探测注册位
     * （`this.binding.parent`，x-import 同款）、组件查找（x-component 同源协议）、宿主编译父
     * 解析（缺省收敛消费处 scope `this.binding`——props 表达式上下文与既有 watch 严格对齐，
     * 决策 2；显式 dataContext 经 `_resolveParentScope` 两栖分派）、片段 props 热应用守卫
     * 基线维护。
     */
    private _hostCtx(config: OverlayConfig): OverlayHostCtx {
        return {
            engine: this.engine,
            warn: (m) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`),
            registerScope: this.binding.parent,
            findComponent: (n) => this._findComponentDef(n),
            resolveParentScope: (def) =>
                config.dataContext === undefined
                    ? this.binding
                    : this._resolveParentScope(config, def).parentScope,
            onFragmentApplied: (p) => {
                this._appliedProps = p;
            },
        };
    }

    /**
     * 探测管线执行（AbortController 归本指令持有）：retry 重载 / 指令销毁抢占旧探测——
     * 新探测发起先 abort 旧在途，finally 清理句柄。信号与失败分流归共享
     * {@link probeAndMount}。
     */
    private _probe(
        ctx: OverlayHostCtx,
        inst: OverlayInstance,
        name: string,
        url: string,
        group: ChildNode[] | null,
        propsText: string | null,
    ): Promise<void> {
        this._remoteAbort?.abort();
        const ctrl = (this._remoteAbort = new AbortController());
        return probeAndMount(ctx, inst, name, url, group, propsText, () => this._props, ctrl.signal)
            .finally(() => {
                if (this._remoteAbort === ctrl) this._remoteAbort = null;
            });
    }

    /**
     * 三态分流选择器（ADR-0123 决策 2）：初始挂载与 retry 重载共用——重查组件注册
     * （重试间隙组件可能已就绪：x-import 其他入口/手动注册），已注册 → 组件宿主；
     * 未注册 + url → 探测分流；未注册无 url → pending 宿主（x-component 占位 +
     * registered 重试，ADR-0022 R6=B）。
     */
    private _regenerateContent(
        inst: OverlayInstance,
        config: OverlayConfig,
        name: string,
        url: string,
    ): void {
        const ctx = this._hostCtx(config);
        const found = ctx.findComponent(name);
        // 内容组用消费侧裁决缓存（ADR-0124 决策 11）：chrome 段已剥离 stash 实例，retry
        // 重载不得重新收集（会再入内容宿主）；undefined = 尚未裁决（防御回退全量收集）
        const group =
            this._splitContent === undefined ? this._collectSlotGroup(name) : this._splitContent;
        const propsText = this._propsValueText();
        if (found) {
            mountComponentHost(ctx, inst, name, found.def, propsText, group);
        } else if (url !== "") {
            void this._probe(ctx, inst, name, url, group, propsText);
        } else {
            // pending（ADR-0123 决策 1）：面板先开 + x-component pending 占位（注册后自动挂载）
            this.warn(
                `${this.directiveLabel}:${this.attr}: 未找到覆盖物组件 "${name}"（scope 链与全局均未命中），面板已开并显示加载占位——组件注册后自动挂载（ADR-0123）`,
            );
            mountComponentHost(ctx, inst, name, null, propsText, group);
        }
    }

    /**
     * props 指令值文本（ADR-0123 决策 3）：成员表达式原文直作 x-component 指令值（三形态 +
     * 持续热更新契约由 x-component 通道承接）；整包静态 props 经 JSON 序列化为对象字面量
     * 文本（求值一次语义等价）。setAttribute 程序化写值天然防表达式内引号截断（注记 7）。
     */
    private _propsValueText(): string | null {
        const expr = this.info.optionExprs?.props;
        if (expr !== undefined && expr.trim() !== "") return expr;
        const staticProps = this.options?.props;
        if (staticProps !== undefined) {
            try {
                return JSON.stringify(staticProps);
            } catch (e: any) {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: 静态 props 序列化失败，已忽略: ${e?.message ?? e}`,
                );
                return null;
            }
        }
        return null;
    }

    /**
     * 配置合并链出口（形态默认注入点）：两级链（`内置默认 < x-{name}-options`）归一后产出
     * 生效配置。子类覆写以叠加形态默认——如 PopoverDirective 注入默认锚（宿主元素）与
     * placement 'bottom'（ADR-0060），不必复制 `_instantiate` 全段。
     */
    protected _resolveConfig(optionLayer: Record<string, any>): OverlayConfig {
        return resolveOverlayConfig(optionLayer, this._optionExprValues);
    }

    /**
     * 实例定位策略钩子（形态特化，ADR-0063）：默认 undefined——实例走内置「锚定/退居中」
     * 两态；子类覆写注入形态定位（x-drawer：屏幕贴边默认 + 锚定长轴同步，并接管未命中
     * 回退措辞「退屏幕贴边」）。
     */
    protected _positioner(): OverlayInstanceOptions["positioner"] | undefined {
        return undefined;
    }

    /**
     * shell 解析（ADR-0062 → ADR-0094 标准链）：面板外壳组件按配置链取组件名——
     * `config.shell`（成员表达式打开时求值一次）> 引擎级 `options.overlay.{overlayKind}.shell`
     * > 内置 shell 注册名兜底（形态键映射，见 {@link KIND_SHELL_NAMES}）。显式名走与内容组件
     * 同源的查找协议（scope 链 x-define →
     * `components` > `builtinComponents` 双注册位全局），未命中 warn + 回退内置默认
     * （弹窗照常工作，失效可发现；不等待 x-import——shell 是结构骨架，异步回退内置的错误
     * 形态比延迟打开更糟，ADR-0062）。
     */
    protected _resolveShell(config: OverlayConfig): OverlayShellDef {
        const kind = this.overlayKind;
        const engineDefault = kind
            ? (this.engine.options.overlay as Record<string, { shell?: string }> | undefined)?.[
                  kind
              ]?.shell
            : undefined;
        const explicit = config.shell ?? engineDefault;
        const name = explicit == null ? "" : String(explicit).trim();
        if (name !== "") {
            const found = this._findComponentDef(name);
            if (found) return { name, snapshot: found.snapshot, def: found.def };
            this.warn(
                `${this.directiveLabel}:${this.attr}: shell "${name}" 未命中（scope 链与全局组件表均无），回退内置默认 shell（若来自 x-import 请先注册再打开）（ADR-0062）`,
            );
        }
        // 内置 shell 兜底（ADR-0094 点前缀命名空间：形态键（overlayKind）是配置键
        // `options.overlay.{kind}`，注册键是 `autospark.{kind}`——两个键域不同，须映射；
        // 用户任一注册位同名覆盖天然生效，内置种子恒在组件表，断言安全）
        const shellKey = (kind != null && KIND_SHELL_NAMES[kind]) || DIALOG_SHELL_NAME;
        return { name: shellKey, ...this.engine._resolveGlobalComponentFull(shellKey)! };
    }

    /**
     * 宿主直接子节点按归属分组后取本消费者名组（原始 ChildNode[]，ADR-0119 → ADR-0123）：
     * 组件宿主生成时克隆移入宿主子级（x-component 收集分段投影承接）；片段路径无出口概念
     * （生成时 warn 丢弃）。分段不再由 overlay 预处理——出口清单的消费归 x-component 编译期。
     */
    private _collectSlotGroup(name: string): ChildNode[] | null {
        if (!this.template) return null;
        const warn = (m: string) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`);
        const groups = collectSlotGroups(this.template, this._overlayConsumers(), warn);
        return groups.get(name) ?? null;
    }

    /** 宿主上全部覆盖物消费者的组件名（同宿主多 x-dialog 的归属校验与隐式归属基准） */
    private _overlayConsumers(): string[] {
        return this.binding.directives
            .filter((d): d is OverlayDirective => d instanceof OverlayDirective)
            .map((d) => d.overlayName)
            .filter((n) => n !== "");
    }

    /**
     * 消费侧收集裁决（ADR-0124 决策 11）：消费者分段按名三分——
     * - 段名为消费组件**已声明出口**（def.slots 命中）→ 内容组（显式优先：同名段归属
     *   组件自出口，即使名字撞 chrome 域）；
     * - 否则名归一（裸 `actions` → `actions.right`）后命中 {@link OVERLAY_CHROME_SLOT_NAMES}
     *   → chrome 组（键为归一名，经 collectSlotSegments 正式分段产出 SlotContent）；
     * - 其余（`default` / `body` / 未知名 / 裸子节点与空白注释）→ 内容组。
     *
     * 输入是归属分组的**原始子节点**（标记属性未剥）：内容组按原序重组交内容宿主管线
     * （mountComponentHost 克隆进宿主，x-component 编译期再分段投影）；chrome 组节点经
     * 分段克隆 + 剥标记，stash OverlayInstance（chromeSlots）。全 chrome 输入时内容组为
     * null（内容宿主无段可挂）。
     */
    private _splitOverlaySlots(
        group: ChildNode[] | null,
        declared: readonly string[] | undefined,
    ): { content: ChildNode[] | null; chrome: Map<string, SlotContent> | null } {
        if (!group || group.length === 0) return { content: group, chrome: null };
        const declaredSet = declared && declared.length > 0 ? new Set(declared) : null;
        const contentNodes: ChildNode[] = [];
        const chromeNodes: ChildNode[] = [];
        for (const child of group) {
            const marker = child instanceof HTMLElement ? getSlotMarker(child) : null;
            const name = marker ? marker.name : "default";
            const normalized = name === "actions" ? "actions.right" : name;
            if (!declaredSet?.has(name) && OVERLAY_CHROME_SLOT_NAMES.has(normalized)) {
                chromeNodes.push(child);
            } else {
                contentNodes.push(child);
            }
        }
        if (chromeNodes.length === 0) return { content: group, chrome: null };
        const warn = (m: string) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`);
        const segments = collectSlotSegments(chromeNodes, undefined, warn, { skipValidation: true });
        const chrome = new Map<string, SlotContent>();
        for (const [name, seg] of segments ?? []) {
            const key = name === "actions" ? "actions.right" : name;
            if (chrome.has(key)) {
                warn(`x-slot: chrome 内容 "${key}" 重复（裸 actions 与 actions.right 并存），后者已生效`);
            }
            chrome.set(key, seg);
        }
        return {
            content: contentNodes.length > 0 ? contentNodes : null,
            chrome: chrome.size > 0 ? chrome : null,
        };
    }

    /**
     * actions 双通道合并（ADR-0124 决策 7）：声明式 = engine.actions（getAction 查找链
     * 终点，最远端）+ 消费处 scope 链局部 action 注册表（`<script type="autospark/actions">`
     * 注入），**仅显式 pos ∈ {top,left,right} 准入**（全局注册表大量与覆盖物无关的 action，
     * 无 pos 不上屏）；配置式 = config.actions 最后进，同 id 覆盖声明式。遍历序远→近
     * （近层同 id 覆盖远层）。无执行体条目剪枝（链上静默——注册期已规范化；配置式 warn）。
     * 合并产物回写 config.actions（调用方负责）——打开前就位，随 config 整包注入 shell
     * data 域 → 内嵌 overlay 组件 props.actions（pos 归位渲染归 overlay 组件 regroup）。
     *
     * @returns 合并数组；空集返回 null（调用方不动 config.actions——无动作时不注入空数组）
     */
    private _mergeOverlayActions(configActions: OverlayConfig["actions"]): AutoSparkAction[] | null {
        const merged = new Map<string, AutoSparkAction>();
        const admit = (id: string, a: AutoSparkAction | undefined) => {
            if (!a || typeof a.handle !== "function") return;
            if (a.pos !== "top" && a.pos !== "left" && a.pos !== "right") return;
            merged.set(id, a);
        };
        // 全局表（最远端——getAction 查找序 scope 链之后的终点）
        for (const [id, a] of Object.entries(
            this.engine.actions as unknown as Record<string, AutoSparkAction>,
        )) {
            admit(id, a);
        }
        // scope 链远→近（近层同 id 覆盖远层）
        const chain: AutoSparkScope[] = [];
        for (let s: AutoSparkScope | null = this.binding; s; s = s.parent) chain.push(s);
        for (let i = chain.length - 1; i >= 0; i--) {
            const actions = chain[i]!.actions;
            if (!actions) continue;
            for (const [id, a] of Object.entries(actions)) admit(id, a);
        }
        // 配置式最后进（同 id 覆盖声明式）；无 pos 条目放行（pos 归位归 overlay 组件 regroup）
        (configActions ?? []).forEach((a, i) => {
            if (!a || typeof a.handle !== "function") {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: config.actions 第 ${i} 项缺执行体（handle），已忽略（ADR-0124）`,
                );
                return;
            }
            const id = typeof a.id === "string" && a.id !== "" ? a.id : `__overlay_config_${i}`;
            merged.set(id, a);
        });
        return merged.size > 0 ? Array.from(merged.values()) : null;
    }

    /**
     * 消费者销毁（ADR-0119 → ADR-0123）：中止进行中的探测 + 回收 keepalive 缓存内全部实例
     * （挂起中/打开中/关闭动画中—— VisibleOverlayDirective.destroy 已先对活跃可见实例
     * requestClose，keepalive 语义下将挂起回缓存，此处统一销毁兜底）。
     */
    override destroy(): void {
        this._remoteAbort?.abort();
        this._remoteAbort = null;
        if (this._keepaliveCache.size) {
            for (const inst of [...this._keepaliveCache.values()]) {
                if (!inst.destroyed) inst.destroy();
            }
            this._keepaliveCache.clear();
        }
        super.destroy();
    }

    /**
     * 数据视图基准挂链解析（共识 8；`scope` 键已更名 `dataContext`，ADR-0053 修订）：
     * **仅显式声明路径**（ADR-0123 决策 2——缺省收敛消费处 scope，宿主编译父 = `this.binding`，
     * props 表达式上下文与既有 watch 严格对齐）。显式声明统一经 `resolveDataContext` 两栖分派
     * ——`'declarer'` 挂**声明处** scope（定义闭包；def 未知时悬空防御 → rootless，仅全局
     * 视图 + 级联守卫兜底）；`'host'` 挂**消费处** scope；元素按基准载体分派。
     */
    private _resolveParentScope(
        config: OverlayConfig,
        def: ComponentDef | null,
    ): { parentScope: AutoSparkScope | null; scopeEl: HTMLElement | null } {
        const ctx = config.dataContext === undefined ? "declarer" : config.dataContext;
        return resolveDataContext(ctx, def, this.binding, this.engine, (m) =>
            this.warn(`${this.directiveLabel}:${this.attr}: ${m}`),
        );
    }

    /**
     * 「请求关闭」写回钩子（UI 触点：ESC / 遮罩 / close action → 实例 requestClose）。
     * 基座无写回目标（仅 UI 关闭）；子类按值形态注入（简单路径 visible 写回 false）。
     */
    protected _makeCloseRequest(): ((inst: OverlayInstance, source: string) => void) | null {
        return null;
    }

    // ── 面板尺寸拖拽调节（resize 选项，ADR-0064 决策八）────────────────

    /**
     * 会话内尺寸记忆：拖出尺寸存指令实例状态（跨实例保留——每次打开新 OverlayInstance，
     * 指令实例长存），重开沿用、优先于声明 `size` / CSS 尺寸；engine destroy 随指令实例消亡。
     */
    protected _resizeMem: { width: number; height: number } | null = null;

    /**
     * 形态合法方向集（null = 形态不支持 resize）：子类覆写——drawer 贴边内侧单边
     * （placement 推导）、dialog 四角（`ne,nw,se,sw`）。`handles` 声明只能在此集内收窄。
     */
    protected _resizeAllowedHandles(): ResizeDirection[] | null {
        return null;
    }

    /**
     * resize 尺寸落点（形态差异点）：默认写面板两轴（dialog——居中锚定下宽高直改、
     * transform/flex 居中自动适应）；drawer 覆写只写短轴（长轴由 inset 对拉/锚定同步管理）。
     */
    protected _applyResize(
        panel: HTMLElement,
        width: number,
        height: number,
        dir: ResizeDirection,
    ): void {
        panel.style.width = `${width}px`;
        panel.style.height = `${height}px`;
        void dir;
    }

    /**
     * 面板就绪钩子（onPanelReady 消费，ADR-0064）：读 `config.resize` 建调节会话并挂手柄——
     * `true`（形态合法全集 + 默认约束）| 对象（字段与 x-resizable 同构；handles 收窄校验，
     * 越界 warn + 忽略）。钳制/手柄/指针核心复用 ResizeSession，写路径走 shell 面板
     * （{@link _applyResize}）；`resize:*` 事件派发在**指令宿主**（非面板，绑定语法不变）；
     * 不写回 store（事件 detail 即出口）；拖出尺寸进会话记忆（{@link _resizeMem}）。
     * 会话销毁随实例 cleanup（手柄随面板 DOM 消亡，此处保证幂等干净）。
     */
    protected _attachResize(ctx: {
        panel: HTMLElement;
        config: OverlayConfig;
        registerCleanup: (fn: () => void) => void;
    }): void {
        const cfg = ctx.config.resize;
        if (cfg == null || cfg === false) return;
        const warn = (m: string) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`);
        const allowed = this._resizeAllowedHandles();
        if (!allowed) {
            warn(`resize 选项在该形态不受支持，已忽略（ADR-0064）`);
            return;
        }
        let handles: ResizeDirection[] = allowed;
        let opts: ResizeOptions | null = null;
        if (cfg !== true) {
            if (typeof cfg !== "object") {
                warn(`resize 须为 true 或选项对象（与 x-resizable 选项同构），已忽略: ${JSON.stringify(cfg)}`);
                return;
            }
            opts = cfg as ResizeOptions;
            if (opts.handles != null) {
                const declared = resolveHandles(opts, warn);
                handles = declared.filter((d) => allowed.includes(d));
                const dropped = declared.filter((d) => !allowed.includes(d));
                if (dropped.length) {
                    warn(
                        `resize.handles 方向 ${dropped.join(",")} 不在形态合法集 ${allowed.join(",")} 内，已忽略（handles 只能收窄，ADR-0064）`,
                    );
                }
            }
        }
        if (handles.length === 0) {
            warn(`resize 手柄集为空，跳过挂载`);
            return;
        }
        const session = new ResizeSession({
            target: ctx.panel,
            eventTarget: this.el,
            handles,
            constraints: () => resolveResizeConstraints(opts, ctx.panel, warn),
            apply: (w, h, dir) => this._applyResize(ctx.panel, w, h, dir),
            onApplied: (w, h) => {
                this._resizeMem = { width: w, height: h };
            },
            warn,
        });
        session.attach();
        ctx.registerCleanup(() => session.destroy());
    }
}
