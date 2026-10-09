import { SCOPES_KEY } from "../../consts";
import { resolveAnimate } from "../animate/animate";
import { ComponentInstance } from "../component/component-instance";
import type { AutoSparkScope } from "../../engine/scope";
import type { ComponentDef } from "../component/component-def";
import { readInheritAttr } from "../../engine/compile/inherit";
import { NOTIFICATION_COLUMN_ATTR } from "./container";
import { getNotificationColumn } from "./container";
import type { NotificationEntry } from "./entry";
import type { NotificationManager } from "./manager";
import { BASE_PRESET_NAME, formatNotificationSize, notificationLevelName } from "./types";

/** 卡片尺寸五键（渲染键）：inline 写入卡片根，number = px（formatNotificationSize 归一） */
const SIZE_KEYS = ["width", "height", "minWidth", "maxWidth", "minHeight"] as const;

/**
 * 通知卡片装配管线（ADR-0088 自 manager `_mount` 上移 sessions/base → **ADR-0089 归位
 * 独立模块**——session class 退役，装配为纯函数）：双层装配（type 组件先编译、产物经
 * `mode:"live"` 段投影进 shell 默认出口）+ 卡片根装配 + 监听绑定 + 约定键 watch 联动。
 *
 * **display 模型（ADR-0089 决策四）**：装配即挂 DOM 且 `display:none`（挂起/排队态）——
 * 可见性纯样式切换（`showCard`），remove/淘汰才摘 DOM 销毁（`unmountCard`）。实例与 DOM
 * 与记录三者同生命周期。
 *
 * `$session` 派生变量已退役（ADR-0089 决策六）：组件模板内 methods 直达；shell 的 close
 * 钮与用户 actions 点击走卡片根委托。
 */

/** type 组件解析结果（ADR-0083 专属区链 + ADR-0088 base 兜底） */
interface RendererRef {
    name: string;
    snapshot: HTMLElement;
    def: ComponentDef | null;
}

/**
 * type 组件解析 + **强制继承 base**（ADR-0089 决策二；ADR-0095 单层化——type 实例即完整卡片）：
 * `types[type].render`（用户 type 级）→ 全局组件表按预设名 `autospark.notifications.<type>` →
 * base 兜底。未显式声明 `x-define:inherit` 的 type 组件（非 base/actions 自身）装配前自动补写
 * 并重解析 def（懒预编译缓存失效重构建
 * ——`_globalComponentDefs` 内部缓存口的 notifications 侧唯一越界点）。
 */
function resolveRenderer(manager: NotificationManager, type: string): RendererRef | null {
    const engine = manager.engine;
    const pick = (name: string): RendererRef | null => {
        // 强制继承 base：snapshot 未带 inherit 属性（未解析继承的原始快照）→ 补写 + 重解析
        let snapshot = engine._resolveGlobalComponent(name);
        if (!snapshot) return null;
        if (name !== BASE_PRESET_NAME && name !== "autospark.notifications.actions" && readInheritAttr(snapshot) === null) {
            snapshot.setAttribute("x-define:inherit", BASE_PRESET_NAME);
            (engine as any)._globalComponentDefs.delete(name);
            snapshot = engine._resolveGlobalComponent(name);
            if (!snapshot) return null;
        }
        const def = engine.getComponentDef(snapshot) ?? engine.getGlobalComponentDef(name) ?? null;
        return { name, snapshot, def };
    };
    const renderName = manager._options.types?.[type]?.render?.trim() ?? "";
    if (renderName !== "") {
        const ref = pick(renderName);
        if (ref) return ref; 
    }
    // 预设名顺位 → base 兜底（ADR-0088）
    return pick(`autospark.notifications.${type}`) ?? pick(BASE_PRESET_NAME) ?? null;
}

/** anchor 数据视图（决策 14 职责③）：自 anchor 向上找最近 scope 作组件实例父挂链 */
function anchorScopeOf(manager: NotificationManager, anchor: HTMLElement | null): AutoSparkScope | null {
    if (!anchor) return null;
    let el: HTMLElement | null = anchor;
    while (el) {
        const scope = manager.engine.findScopeByEl(el);
        if (scope) return scope;
        el = el.parentElement;
    }
    return null;
}

/**
 * 注水面构建（ADR-0089 决策九：组件可见**全量** = record 面 + 组件面 + 派生键）：
 * props 剥函数（autostore computed 劫持防线）/ anchor（DOM 引用）/ **运行约定键**
 * （progress/paused/completed——运行态唯组件 data 域是尊，return props / update 补丁
 * 不回拨闭包已推值，ADR-0089 决策八）；补派生键 icon / actions / `_abort`（canCancel 时
 * manager 侧造、组件 cancel method 消费——外部 `instance.data._abort.signal` 挂接协作取消）。
 */
export function buildInjectProps(manager: NotificationManager, entry: NotificationEntry): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(entry.props)) {
        if (typeof value === "function") continue;
        if (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) continue;
        if (key === "progress" || key === "paused" || key === "completed") continue;
        out[key] = value;
    }
    // record 面键以 record 为单一数据源（归一值：read 恒布尔 / type 恒字符串——instance
    // 扁平 getter 与模板注水同源；props 面的同名 undefined 不覆盖）
    const rec = entry.record;
    out.id = rec.id;
    out.type = rec.type;
    out.read = rec.read;
    out.title = rec.title;
    out.description = rec.description;
    out.level = rec.level;
    out.owner = rec.owner;
    out.status = rec.status;
    out.result = rec.result;
    out.link = rec.link;
    out.icon = entry.icon;
    out.actions = entry.actions;
    // 语义色分派名派生键（ADR-0095 契约绑定化——shell 模板自绑 `:data-notification-level`，
    // 归一名引擎注入，模板零逻辑）
    out.levelName = notificationLevelName(rec.level ?? 0);
    if ((entry.props as any).canCancel === true) out._abort = new AbortController();
    return out;
}

/**
 * 卡片尺寸五键写入（ADR-0077 渲染键）：inline 经 setProperty 结构化写入，undefined =
 * removeProperty 归位。幂等。（manager `_applyEntryConfig` 换装路径共用——单一落点）
 */
export function applyCardSizes(el: HTMLElement, props: Record<string, any>): void {
    for (const key of SIZE_KEYS) {
        const v = props[key];
        const cssName = key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()); // minWidth → min-width
        if (v == null || v === "" || v === "auto") el.style.removeProperty(cssName);
        else el.style.setProperty(cssName, formatNotificationSize(v as number | string));
    }
}

/**
 * 装配卡片（add 即调——display:none 挂起/排队态；显示经 manager `_showEntry`）：
 * **单层装配**（ADR-0095 终态——type 组件经继承族根即完整卡片，无独立 shell 实例化与
 * live 投影）：type 组件实例化（ComponentInstance 包装回填 entry.instance，卡片根 = 实例根）
 * → 监听 → 挂列尾 → 约定键 watch。SSR（无容器）返回 false。
 */
export function assembleCard(manager: NotificationManager, entry: NotificationEntry): boolean {
    const column = getNotificationColumn(manager.engine, entry.props.pos as any, entry.props.offset);
    if (!column) return false;
    const engine = manager.engine;
    const parentScope = anchorScopeOf(manager, entry.anchor);
    const renderer = resolveRenderer(manager, entry.type);
    const props = buildInjectProps(manager, entry);

    // type 组件实例化（行为+数据+渲染宿主——ADR-0089；经继承族根含外观容器与内容结构，
    // 即完整卡片。无 renderer（无内置 type 且无 base 可兜底）理论不可达——防御跳过）
    if (!renderer) {
        engine.logger.warn(
            `engine.notifications: type "${entry.type}" 无可用渲染组件（render 链与 base 兜底均未命中），已跳过装配`,
        );
        return false;
    }
    const compiled = engine.compiler.instantiateDetachedComponent(
        renderer.snapshot.cloneNode(true) as HTMLElement,
        parentScope,
        renderer.def,
        props,
    );

    // 卡片根 = type 实例根（ADR-0095「模板即契约」：内置族根模板自绑引擎类与分派属性；
    // 引擎运行态写入——display / 列属性 / 渲染键 / 行为监听——直挂实例根，不垫任何 DOM）
    const card = compiled.el;
    entry.scope = compiled.scope;
    entry.instance = new ComponentInstance(compiled.scope);
    flattenMethods(entry.instance, renderer.def); // 实例方法直调（ADR-0089 决策七）
    entry.el = card;
    // display 模型（ADR-0089 决策四）：装配即挂 DOM、初始不可见——显示纯样式切换
    card.style.display = "none";
    card.setAttribute(NOTIFICATION_COLUMN_ATTR, entry.props.pos as string);
    if (entry.props.className) {
        card.classList.add(...String(entry.props.className).trim().split(/\s+/));
        entry.appliedClassName = String(entry.props.className);
    }
    if (entry.props.styles) {
        card.style.cssText = String(entry.props.styles);
        entry.appliedStyles = String(entry.props.styles);
    }
    applyCardSizes(card, entry.props);
    // 行为委托：点击（actions + 关闭钮 + 任意点击置已读）与 hover 暂停，监听挂卡片根
    entry.clickHandler = (e: Event) => manager._onCardClick(entry, e);
    entry.enterHandler = () => manager._pauseTimer(entry);
    entry.leaveHandler = () => manager._resumeTimer(entry);
    card.addEventListener("click", entry.clickHandler);
    card.addEventListener("mouseenter", entry.enterHandler);
    card.addEventListener("mouseleave", entry.leaveHandler);

    // 列内定位（ADR-0079 排序移除）：纯到达序 append 列尾
    column.appendChild(card);

    const resolved = resolveAnimate(entry.props.animate);
    entry.leave = resolved.leave;

    // 约定键联动（ADR-0089 决策五）：holdOpen（计时拦截）+ task 运行键（notification:update 观测面）
    bindContractWatches(manager, entry);
    // 初始进度一次性应用（props.progress——闭包胜：挂起期已推（data > 0）则跳过）
    const initialProgress = (entry.props as any).progress;
    if (initialProgress != null && (entry.instance?.data.progress ?? 0) === 0 && entry.instance) {
        entry.instance.methods.progress?.(Number(initialProgress));
    }
    return true;
}

/**
 * 约定键联动（装配后挂、unmountCard 随收）：经 `engine.store.watch` 全局路径精准订阅
 * （`$scopes.<id>.<key>`——autostore 原生通道；scope.watch 相对求值在组件域不可靠）：
 * - `holdOpen`：true → 清计时；false 且展示中 → 启动计时（task 完成态联动转倒计时）
 * - `progress/paused/completed`（task 运行键）：变更广播 `notification:update`（控制钮失去
 *   notification:action 后的观测面，ADR-0088 沿用）；首跑跳过（watch 建立即激活的首次求值非变更）
 */
function bindContractWatches(manager: NotificationManager, entry: NotificationEntry): void {
    const scope = entry.instance?.scope;
    if (!scope) return;
    const engine = manager.engine;
    const base = `${SCOPES_KEY}.${scope.id}`; // store.watch 点路径精准订阅（探针验证有效；'/' 分隔不触发）
    let holdFirst = true;
    engine.store.watch(`${base}.holdOpen`, (...args: any[]) => {
        const v = args[args.length - 1]; // autostore watch 回调末参 = 新值（重载形态兼容）
        if (holdFirst) {
            holdFirst = false;
            return;
        }
        if (v === true) manager._clearTimer(entry);
        else if (entry.state === "shown") manager._startTimer(entry);
    });
    for (const key of ["progress", "paused", "completed"]) {
        let first = true;
        engine.store.watch(`${base}.${key}`, () => {
            if (first) {
                first = false;
                return;
            }
            manager._emit("notification:update", entry);
        });
    }
}

/**
 * 组件 methods 扁平转发到实例（ADR-0089 决策七「实例方法直调」）：`instance.progress(45)` /
 * `instance.remove()` 直调（免 `.methods.` 前缀）；同时转发常用数据视图键（id/type/read/
 * closed/status/result/visible/remaining——旧 session 只读 getter 面的等价物，`instance.read`
 * 直读）。引擎保留键（el/data/props/methods/super/name/globalState/scope/then）优先——
 * 同名组件 method / 数据键不遮蔽。
 */
function flattenMethods(instance: ComponentInstance, def: ComponentDef | null): void {
    const reserved = new Set(["el", "name", "data", "props", "globalState", "methods", "super", "scope", "then"]);
    for (const key of ["id", "type", "read", "closed", "status", "result", "visible", "remaining"]) {
        Object.defineProperty(instance, key, {
            get: () => instance.data[key],
            configurable: true,
        });
    }
    const methods = def?.setup?.methods;
    if (!methods) return;
    const defined = new Set<string>(reserved);
    defined.add("id"), defined.add("type"), defined.add("read"), defined.add("closed");
    defined.add("status"), defined.add("result"), defined.add("visible"), defined.add("remaining");
    for (const key of Object.keys(methods)) {
        if (defined.has(key)) continue;
        // 命名转发（flattenMethod）——markInstanceDead 以函数名识别 method 转发位做死亡标记
        const forward = function flattenMethod(this: void) {
            return (instance.methods as any)[key];
        };
        Object.defineProperty(instance, key, {
            get: forward,
            configurable: true,
        });
    }
}

/**
 * 摘除卡片（remove/淘汰/引擎销毁——display 模型下唯一销毁路径）：解绑监听 + DOM 移除 +
 * 单 scope 收口（ADR-0095 单层化——type 实例 scope 即卡片 scope，销毁 + 回收私有响应式域）。
 * 记录存续编排（persist 转隐藏 / 镜像 / Map）归 manager。
 *
 * **死亡语义（旧「死会话」的组件化等价物，ADR-0083 沿用）**：销毁前对外部持有的实例引用
 * 打死亡标记——`closed` 定格 true / `visible` 定格 false、已转发的 methods 全部 no-op + warn
 * （不复活、不抛错——调用方零防御）。
 */
export function unmountCard(manager: NotificationManager, entry: NotificationEntry): void {
    const el = entry.el;
    if (el) {
        if (entry.clickHandler) el.removeEventListener("click", entry.clickHandler);
        if (entry.enterHandler) el.removeEventListener("mouseenter", entry.enterHandler);
        if (entry.leaveHandler) el.removeEventListener("mouseleave", entry.leaveHandler);
        el.remove();
    }
    const instance = entry.instance;
    entry.el = null;
    entry.instance = null;
    const scope = entry.scope;
    entry.scope = null;
    if (scope) {
        const scopeId = scope.id;
        scope.destroy(); // 幂等守卫：级联已销毁时 no-op
        const scopes = (manager.engine.store.state as Record<string, any>)[SCOPES_KEY] as
            | Record<string, any>
            | undefined;
        if (scopes) delete scopes[scopeId];
    }
    if (instance) markInstanceDead(manager, instance);
}

/** 死实例标记：closed/visible 定格 + methods no-op 化（warn 可发现性——沿用死会话纪律） */
function markInstanceDead(manager: NotificationManager, instance: ComponentInstance): void {
    const warn = (method: string) =>
        manager.engine.logger.warn(
            `engine.notifications: 组件实例已销毁（记录已 remove），${method}() 无效（ADR-0083 死会话语义沿用）`,
        );
    Object.defineProperty(instance, "closed", { get: () => true, configurable: true });
    Object.defineProperty(instance, "visible", { get: () => false, configurable: true });
    for (const key of Object.getOwnPropertyNames(instance)) {
        const desc = Object.getOwnPropertyDescriptor(instance, key);
        if (!desc?.get || desc.get.name !== "flattenMethod") continue;
        Object.defineProperty(instance, key, {
            get() {
                warn(key);
                return () => {};
            },
            configurable: true,
        });
    }
}
