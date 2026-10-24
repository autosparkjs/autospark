import { markRaw, nsMember, scopesKey } from "../../../runtime/bridge";
import { resolveAnimate } from "../internal/animate";
import type { ComponentInstance } from "autospark";
import type { AutoSparkScope } from "autospark";
import type { ComponentDef } from "autospark";
import { readInheritAttr } from "../internal/inherit";
import { NOTIFICATION_COLUMN_ATTR } from "./container";
import { getNotificationColumn } from "./container";
import type { NotificationEntry } from "./entry";
import type { NotificationManager } from "./manager";
import { SHELL_PRESET_NAME, formatNotificationSize, notificationLevelName } from "./types";

/** 卡片尺寸五键（渲染键）：inline 写入卡片根，number = px（formatNotificationSize 归一） */
const SIZE_KEYS = ["width", "height", "minWidth", "maxWidth", "minHeight"] as const;

/**
 * 通知卡片装配管线（ADR-0088 自 manager `_mount` 上移 sessions/base → **ADR-0089 归位
 * 独立模块**——session class 退役，装配为纯函数）：**单层装配**（ADR-0095 终态——type 组件
 * 经继承族根即完整卡片，无独立 shell 实例化与 live 投影）+ 卡片根装配 + 监听绑定 + 约定键
 * watch 联动。
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
 * type 组件解析 + **强制继承 shell 族根**（ADR-0089 决策二；ADR-0095 单层化——type 实例即
 * 完整卡片；族根正名 base → shell，ADR-0097）：`types[type].render`（用户 type 级）→ 全局
 * 组件表按预设名 `autospark.notifications.<type>` → shell 兜底。未显式声明 `x-define:inherit`
 * 的 type 组件（非 shell 自身）装配前自动补写并重解析 def（懒预编译缓存失效重构建
 * ——`_globalComponentDefs` 内部缓存口的 notifications 侧唯一越界点）。
 */
function resolveRenderer(manager: NotificationManager, type: string): RendererRef | null {
    const engine = manager.engine;
    const pick = (name: string): RendererRef | null => {
        // 强制继承 shell：snapshot 未带 inherit 属性（未解析继承的原始快照）→ 补写 + 重解析
        let snapshot = engine._resolveGlobalComponent(name);
        if (!snapshot) return null;
        if (name !== SHELL_PRESET_NAME && readInheritAttr(snapshot) === null) {
            snapshot.setAttribute("x-define:inherit", SHELL_PRESET_NAME);
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
    // 预设名顺位 → shell 兜底（ADR-0088 → ADR-0097 正名）
    return pick(`autospark.notifications.${type}`) ?? pick(SHELL_PRESET_NAME) ?? null;
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
 * （progress/state——运行态唯组件 data 域是尊，return props / update 补丁不回拨闭包
 * 已推值，ADR-0089 决策八；旧 paused/completed 布尔随 ADR-0104 状态机并入 state）；
 * 补派生键 icon / actions / `_abort`（task 恒注入〔ADR-0104——stop/cancel/close 三动词
 * 共用，UI 开关不该决定信号存废〕、其他 type 沿 canCancel 门控；原地更新换装时复用
 * 既有 controller——中途 update() 不换发新信号孤儿化已挂接的监听）。
 */
export function buildInjectProps(manager: NotificationManager, entry: NotificationEntry): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(entry.props)) {
        if (typeof value === "function") continue;
        if (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) continue;
        if (key === "progress" || key === "state" || key === "paused" || key === "completed") continue;
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
    if (entry.type === "task" || (entry.props as any).canCancel === true) {
        // markRaw：_abort 落响应式 data 域后须免代理——经代理 this 调原生 abort 会
        // Illegal invocation（AbortController 品牌校验），自有函数属性又会被计算属性
        // 语义劫持。raw 包装后读到的恒是原生 controller（abort / signal 均原生可用）。
        // 复用既有实例（原地更新换装不换发新 controller，ADR-0104）
        out._abort = (entry.instance?.data as any)?._abort ?? markRaw(new AbortController());
    }
    // task 状态机初值注水（ADR-0104）：data.state 声明缺省 'pending'，经 props 覆盖通道
    // 归位——canStart 门控卡留 pending 等「开始」，自动模式即 running（挂起/排队期闭包
    // progress 直写不丢）。原地更新换装时读现值回填（运行态唯 data 域是尊，同 progress）
    if (entry.type === "task") {
        out.state = (entry.instance?.data as any)?.state ?? ((entry.props as any).canStart === true ? "pending" : "running");
    }
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
    // 即完整卡片。无 renderer（无内置 type 且无 shell 可兜底）理论不可达——防御跳过）
    if (!renderer) {
        engine.logger.warn(
            `engine.notifications: type "${entry.type}" 无可用渲染组件（render 链与 shell 兜底均未命中），已跳过装配`,
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
    // 组件实例类经运行时桥解析（engine 导出类，new (scope) => ComponentInstance）
    entry.instance = new (nsMember("ComponentInstance"))(compiled.scope);
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

    // 约定键联动（ADR-0089 决策五）：holdOpen（计时拦截）+ task 运行键（update 事件观测面）
    bindContractWatches(manager, entry);
    // 初始进度一次性应用（props.progress——闭包胜：挂起期已推（data > 0）则跳过）
    const initialProgress = (entry.props as any).progress;
    if (initialProgress != null && (entry.instance?.data.progress ?? 0) === 0 && entry.instance) {
        entry.instance.methods.progress?.(Number(initialProgress));
    }
    return true;
}

/**
 * 约定键联动（装配后挂、unmountCard 随收）：经 `engine.store.watch` 全局点路径精准订阅
 * （`SCOPES_KEY.<scope.id>.<key>`——autostore 原生通道，逐写入**同步 fire**）：
 * - `holdOpen`：true → 清计时；false 且展示中 → 启动计时（task 完成态联动转倒计时，closeWhenDone）
 * - `progress/state`（task 运行键）：变更广播 `update` 事件（控制动词的语义迁移各自发
 *   `actions/<动词>` 事件，ADR-0104；update 是数据面观测）
 *
 * **为什么不用 scope.watch**：其回调经 engine.scheduler 微任务合并——连续写入只保留末值，
 * 「首个真实变更不吞」（ADR-0102）语义被破坏；契约广播类订阅必须走 store 点路径。
 * SCOPES_KEY 经运行时桥解析（engine 公开导出 + 类静态补挂）。
 *
 * **值比对去重（ADR-0102 修复）**：watch 建立即激活的首次求值并非确定发生（实测可能缺席），
 * 「数 fire 跳首次」会把首个真实变更吞掉——task 的 holdOpen true→false 完成转换一生仅一次，
 * 恰是被吞的那次（完成永不收口）。故 bind 时记初值、fire 时读 `data` 现值、同值跳过——
 * bind 首评在场被去重消解、缺席也不误伤；同时不依赖 watch 回调参数取值（末参形态不稳定）。
 */
function bindContractWatches(manager: NotificationManager, entry: NotificationEntry): void {
    const scope = entry.instance?.scope;
    if (!scope) return;
    const engine = manager.engine;
    const base = `${scopesKey()}.${scope.id}`;
    const data = () => entry.instance?.data;
    let lastHold = data()?.holdOpen;
    let holdWatcher = engine.store.watch(`${base}.holdOpen`, () => {
        const v = data()?.holdOpen;
        if (v === lastHold) return;
        lastHold = v;
        if (v === true) manager._clearTimer(entry);
        else if (entry.state === "shown") manager._startTimer(entry);
    });
    entry.controlOffs.push(() => holdWatcher.off());
    for (const key of ["progress", "state"] as const) {
        let last = data()?.[key];
        const watcher = engine.store.watch(`${base}.${key}`, () => {
            const v = data()?.[key];
            if (v === last) return;
            last = v;
            manager._emit("update", entry);
        });
        entry.controlOffs.push(() => watcher.off());
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
    // 中止信号便捷面（ADR-0104）：`session.abortSignal`——data._abort.signal 的公共读法
    // （未注入 _abort 的 type 为 undefined）
    Object.defineProperty(instance, "abortSignal", {
        get: () => (instance.data as any)?._abort?.signal,
        configurable: true,
    });
    const methods = def?.setup?.methods;
    if (!methods) return;
    const defined = new Set<string>(reserved);
    defined.add("id"), defined.add("type"), defined.add("read"), defined.add("closed");
    defined.add("status"), defined.add("result"), defined.add("visible"), defined.add("remaining");
    defined.add("abortSignal");
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
    // 控制订阅自动退订（ADR-0104）：onXxx 挂的引擎级侦听随卡销毁清理（id 唯一使残留
    // 侦听永不再触发，纯泄漏）；调用方手动提前退订过的 off 幂等 no-op
    for (const off of entry.controlOffs.splice(0)) {
        try {
            off();
        } catch {
            // 退订异常不阻断销毁
        }
    }
    const instance = entry.instance;
    entry.el = null;
    entry.instance = null;
    const scope = entry.scope;
    entry.scope = null;
    if (scope) {
        scope.destroy(); // 幂等守卫：级联已销毁时 no-op；注册表条目由 scope.destroy 统一回收
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
