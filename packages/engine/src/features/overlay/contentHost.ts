import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";
import type { ComponentDef } from "../component/component-def";
import type { OverlayInstance } from "./instance";
import { normalizeError } from "../../utils/normalizeError";

/**
 * 覆盖物内容宿主共享上下文（ADR-0123）：声明式指令（OverlayDirective）与命令式句柄
 * （OverlayHandle）双通道的公共依赖——宿主生成 / 探测分流 / raise 错误桥 / 错误桥 actions
 * 注入的统一入参。双通道收敛于此（DRY）：渲染全委托 x-component / x-html.compile 的契约
 * 只维护一份，通道差异全部经字段注入。
 */
export interface OverlayHostCtx {
    engine: AutoSpark<any>;
    /** 诊断 warn 通道（自带标签前缀：`x-dialog:name` / `engine.getOverlay("name")`） */
    warn: (msg: string) => void;
    /** x-import 探测管线组件注册位 scope（x-import 同款；null = 仅 global 声明的远程组件可达） */
    registerScope: AutoSparkScope | null;
    /** 组件查找（探测后分流 / retry 重查）：与消费通道同源的查找协议 */
    findComponent: (name: string) => { snapshot: HTMLElement; def: ComponentDef | null } | null;
    /**
     * 内容宿主编译父 scope 解析（ADR-0123 决策 2）：缺省收敛消费处 scope（声明式 =
     * 指令 binding；命令式 = 锚点 scope），显式 dataContext 分派基准。探测命中后 def 才
     * 就绪——'declarer' 基准依赖 def，故以回调形态在宿主生成时现解析。
     */
    resolveParentScope: (def: ComponentDef | null) => AutoSparkScope | null;
    /** 片段数据域注入完成回调（可选；声明式用于维护 _appliedProps 热应用守卫基线） */
    onFragmentApplied?: (props: Record<string, any> | undefined) => void;
}

/**
 * 生成组件宿主并编入面板（ADR-0123 决策 2——已注册 / 探测命中 / pending 三态共用）：
 * 宿主 `<el x-component:名称="props表达式文本">`（点号组件名经 x-component 升序回溯重建，
 * ADR-0088），插槽组克隆移入宿主子级（x-component ownsChildren 收集 + x-slot 分段投影
 * 既有机制承接，ADR-0056）。wrapper-compile 编译（compileChild 对编译根剥指令——宿主直作
 * 根会被剥除永不实例化；wrapper 无指令无副作用），产物 scope（wrapper）作内容 scope——
 * destroy 级联宿主化身 scope（scope.children 递归销毁）。
 *
 * **出口清单校验补位（Q13-2，ADR-0056 决策十修订）**：x-component 组件路径全量收集跳过
 * 校验（ADR-0107 决策五——动态出口名静默闲置），overlay 路径「组件未声明任何出口 + 已提供
 * 内容 → warn 丢弃（不再静默）」在宿主生成处承接——此处是唯一同时持有 def 与插槽组的位置。
 * def null（pending）不判——出口清单未可知 ≠ 未声明，注册后由 x-component 既有投影承接。
 */
export function mountComponentHost(
    ctx: OverlayHostCtx,
    inst: OverlayInstance,
    name: string,
    def: ComponentDef | null,
    propsText: string | null,
    group: ChildNode[] | null,
): void {
    let slotsGroup = group;
    if (def && slotsGroup && slotsGroup.length > 0 && !def.slots?.length) {
        ctx.warn(
            `覆盖物组件 "${name}" 未声明任何 x-slot 出口，已提供的内容无法投影，已丢弃（ADR-0056 决策十修订）`,
        );
        slotsGroup = null;
    }
    const parentScope = ctx.resolveParentScope(def);
    const host = document.createElement("div");
    host.setAttribute(`x-component:${name}`, propsText ?? "");
    // 组件数据基准（ADR-0123 决策 2「数据基准不变」+ ADR-0110 实例级边界覆盖）：overlay 内容
    // 视图恒开放——封闭组件只见自身 data/props + 全局 state，dataContext 基准将失去意义。
    // open + dataContext:'host' 让实例沿结构 parent 链读编译父（= ctx.resolveParentScope 解析
    // 产物：缺省/显式 'host'/元素 = 消费处 scope，显式 'declarer' = def.declarerScope），
    // 等价旧 overlay 基准挂链语义；锚定归 ctx，宿主只声明「开放 + 消费处基准」。
    host.setAttribute("x-component-options", '{ open: true, dataContext: "host" }');
    for (const n of slotsGroup ?? []) host.appendChild(n.cloneNode(true));
    const wrapper = document.createElement("div");
    wrapper.appendChild(host);
    // localData 显式 null（非 {}）：空对象也是 truthy 局部域，会把 x-component props watch
    // 逼进表达式支路（hasLocalContext → depth 失效，纯状态路径深层突变不触发）——null 让
    // 无局部上下文的场景走 watchPath 精准订阅（depth:2 生效），与 plain x-component 语义对齐
    const compiled = ctx.engine.compiler.compileChild(wrapper, parentScope, null, undefined, undefined);
    inst.mountContent(compiled.el.firstElementChild as HTMLElement, compiled.scope, false);
}

/**
 * 生成片段宿主并编入面板（ADR-0123 决策 2——探测未命中分支）：宿主
 * `<el x-html.compile="url">` 全权承接远程片段加载（url fetch → 子模板编译，
 * `$loading`/`$error` 元键写宿主 scope locals、竞态丢弃、中止、消毒策略全继承，
 * ADR-0035/0017/0122）。**片段 props 数据域**（决策 3）：模板片段没有 props 概念——
 * `getInitialProps()` 求值快照经 compileChild initialData 注入 wrapper scope 响应式
 * data 域（x-data 同语义，子树可读）；热更新由消费通道自行 Object.assign（浅值比较守卫）。
 * **失败检测**（决策 4）：watch 宿主 scope `$error` 元键——x-html `_setMeta` 写 locals 后
 * refresh 驱动 update 闭包无条件重求值（locals 不进 store 依赖收集为空，靠 refresh 驱动）；
 * `|| null` 保证表达式支路（非简单路径），lastSeen 去重守卫。watcher 随宿主 scope 销毁
 * 自动 off（scope.destroy 清 watchers）。
 */
export function mountFragmentHost(
    ctx: OverlayHostCtx,
    inst: OverlayInstance,
    url: string,
    getInitialProps: () => Record<string, any> | undefined,
): void {
    const parentScope = ctx.resolveParentScope(null);
    const initialProps = getInitialProps();
    const host = document.createElement("div");
    host.setAttribute("x-html.compile", url);
    // wrapper-compile（同组件形态，localData null 同因）：wrapper scope 兼片段数据域——props
    // 快照经 initialData 注入响应式 data 域（injectInitialData 路径），片段内容沿 scope 链消费
    const wrapper = document.createElement("div");
    wrapper.appendChild(host);
    const compiled = ctx.engine.compiler.compileChild(
        wrapper,
        parentScope,
        null,
        undefined,
        initialProps ? { ...initialProps } : undefined,
    );
    const hostEl = compiled.el.firstElementChild as HTMLElement;
    const hostScope = ctx.engine.findScopeByEl(hostEl);
    if (hostScope) {
        let lastSeen: unknown = null;
        hostScope.watch("$error || null", ({ value }) => {
            if (value && value !== lastSeen) {
                lastSeen = value;
                raiseOverlayError(ctx.warn, inst, value as Error, url);
            }
        });
    }
    inst.mountContent(hostEl, compiled.scope, true);
    ctx.onFragmentApplied?.(initialProps);
}

/**
 * 探测分流（ADR-0123 决策 2）：组件未注册且声明 url——经 x-import 管线注册尝试
 * （fetch + 解析 + 组件注册 + url 缓存 + 循环引用防护，注册到 ctx.registerScope——
 * x-import 同款），随后按内容分流：
 * - **同名 x-define 命中** → 组件形态（{@link mountComponentHost}；远程模板其余内容
 *   放弃——x-define 已注册备用、HTML 不渲染，Q9 裁决）；
 * - **未命中** → 片段宿主（{@link mountFragmentHost}；插槽组 warn 丢弃——片段无出口概念）。
 * 中止经 `signal`（消费通道持有 AbortController：retry 重载 / 指令销毁抢占旧探测）。
 * 失败 → x-error 边界 raise 呈现（不自动关；`remoteFailed` 置位——失败不进 keepalive
 * 挂起，重开自然重试）。
 */
export async function probeAndMount(
    ctx: OverlayHostCtx,
    inst: OverlayInstance,
    name: string,
    url: string,
    group: ChildNode[] | null,
    propsText: string | null,
    getInitialProps: () => Record<string, any> | undefined,
    signal?: AbortSignal,
): Promise<void> {
    try {
        const registered = await ctx.engine.importComponentsFromUrl(
            url,
            ctx.registerScope,
            false,
            undefined,
            signal,
        );
        if (signal?.aborted || inst.destroyed) return;
        if (registered === null) {
            raiseOverlayError(ctx.warn, inst, new Error(`远程内容加载失败`), url);
            return;
        }
        const found = ctx.findComponent(name);
        if (found) {
            mountComponentHost(ctx, inst, name, found.def, propsText, group);
            return;
        }
        if (registered.length > 0) {
            // 注册了其他名组件——提示名字不匹配（typo 可发现性），非失败
            ctx.warn(
                `远程内容（${url}）未声明覆盖物组件 "${name}"（实际注册: ${registered.join(", ")}），已按片段渲染——若意图消费组件请核对消费名 "${name}" 与远程 x-define 名（ADR-0123）`,
            );
        }
        if (group && group.length > 0) {
            ctx.warn(`url 片段路径不支持插槽内容投影，已丢弃（片段无组件出口，ADR-0123）`);
        }
        mountFragmentHost(ctx, inst, url, getInitialProps);
    } catch (e: any) {
        if (signal?.aborted || inst.destroyed) return;
        raiseOverlayError(ctx.warn, inst, e instanceof Error ? e : new Error(String(e)), url);
    }
}

/**
 * raise 错误桥（ADR-0123 决策 4）：在 x-error 边界上派发 raise 同款 error 事件
 * （ADR-0118 契约：CustomEvent("error", {bubbles, composed, detail})，AT_TARGET 相位
 * 边界自家监听器即捕获）——错误呈现归边界 x-error 就近接管（面板内）。
 * `closeable/retryable` 显式 false：避开 raise 源内建 retry 死路 warn（无源可重）与
 * 内建 close 语义错位（clear 仅清呈现 ≠ 关面板），动作经 `overlayRetry`/`overlayClose`
 * 自定义 action（{@link injectErrorBridge} 注入边界 scope）。
 * `remoteFailed` 置位：close 走销毁（失败不进 keepalive 挂起——重开自然重试，ADR-0119）。
 */
export function raiseOverlayError(
    warn: (msg: string) => void,
    inst: OverlayInstance,
    err: Error,
    url?: string,
): void {
    if (inst.destroyed) return;
    inst.remoteFailed = true;
    // 归一（ADR-0121 load 源）：url 元信息并入（NormalizedError 普通对象展开保留字段）
    const detail = {
        ...normalizeError(err, "load"),
        ...(url ? { url } : {}),
    };
    warn(`覆盖物内容加载失败: ${detail.message}${url ? `（${url}）` : ""}`);
    inst.boundary?.dispatchEvent(
        new CustomEvent("error", {
            bubbles: true,
            composed: true,
            detail: {
                error: detail,
                message: detail.message,
                closeable: false,
                retryable: false,
                actions: [
                    { name: "overlayRetry", title: "重试" },
                    { name: "overlayClose", title: "关闭" },
                ],
            },
        }),
    );
}

/**
 * 错误桥 actions 注入（ADR-0123 决策 4）：`overlayRetry` / `overlayClose` 写入 x-error
 * 边界 scope 的 actions 通道——错误呈现块的 getAction 链（呈现块 scope → 边界 scope）
 * 命中，错误组件 actions 按钮点击即触发（ADR-0038 data-action 委托）。
 * `overlayRetry` = 销毁内容宿主 → **重建边界**（{@link OverlayInstance.rebuildBoundary}
 * ——错误呈现后的边界元素已被呈现块占用，摘旧建新才能清空呈现态）→ 重注入 actions
 * （新边界 scope 为空）→ `regenerate()` 重走三态生成/探测（原位重载）；
 * `overlayClose` = 请求关闭面板。
 */
export function injectErrorBridge(
    ctx: OverlayHostCtx,
    inst: OverlayInstance,
    regenerate: () => void,
): void {
    const scope = inst.boundaryScope;
    if (!scope) return;
    scope.actions = {
        ...(scope.actions ?? {}),
        overlayRetry: {
            id: "overlayRetry",
            title: "重试",
            handle: () => {
                if (inst.destroyed) return;
                inst.destroyContent();
                inst.rebuildBoundary();
                injectErrorBridge(ctx, inst, regenerate); // 新边界 scope 重新注入
                regenerate();
            },
        } as any,
        overlayClose: {
            id: "overlayClose",
            title: "关闭",
            handle: () => inst.requestClose("error-close"),
        } as any,
    } as Record<string, any>;
}
