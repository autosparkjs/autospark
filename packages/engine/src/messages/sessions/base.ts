import type { MessageManager } from "../manager";
import type { MessageEntry } from "../entry";
import { SCOPES_KEY } from "../../engine";
import { resolveAnimate } from "../../animate";
import type { AutoSparkScope } from "../../scope";
import type { ComponentDef } from "../../directives/component-def";
import type { SlotContent } from "../../utils/slot";
import { MESSAGE_COLUMN_ATTR } from "../container";
import { resolveMessageShell } from "../shell";
import {
    BASE_PRESET_NAME,
    formatMessageSize,
    messageLevelName,
    presetComponentName,
    type AutoSparkMessageSession,
    type MessageProps,
} from "../types";

/** 卡片尺寸五键（渲染键）：inline 写入卡片根，number = px（formatMessageSize 归一） */
const SIZE_KEYS = ["width", "height", "minWidth", "maxWidth", "minHeight"] as const;

/**
 * 会话基类：跨态生命周期面（自定义 type 的返回类型即本类，ADR-0083）+ **装配管线**
 * （ADR-0088 上移：`mount/unmount` 拥有双层装配、监听绑定、卡片 chrome 换装、计时器
 * 与 hover 暂停——manager 只发指令）。
 *
 * 功能边界（ADR-0083 grilling 共识 + ADR-0088 收束）：**session = 全部业务逻辑与装配**、
 * 渲染组件（presets 组件族）= 纯 UI——行为与渲染 1:1 绑定（`session.el` 即组件根）。
 * 跨态方法在 `queued`（排队未挂载）与 `hidden`（组件已销毁）两态下依然可用（组件实例
 * 不存在，生命周期操作恰在此两态最有意义）。
 *
 * - 死会话：`remove()` 后 `_entry` 为 null，后续方法 no-op + warn，不复活；
 * - factory 挂起期（`_entry` 为 null 且 id 未回填）：`update()` 缓存补丁（return 落地时
 *   合并）、`cancel()/hide()` = 丢弃（resolve 后不入队，ADR-0083 Q12a）。
 */
export class MessageSessionBase implements AutoSparkMessageSession {
    /** 记录 id（add / factory resolve 后回填；挂起期为空串） */
    id = "";
    /** 业务类别（entry 建立时回填；挂起期为 'toast' 占位） */
    type = "toast";
    /** 卡片根（挂载/摘除时由装配管线写） */
    el: HTMLElement | null = null;
    /** 背后 entry（null = 死会话或 factory 挂起期） */
    _entry: MessageEntry | null = null;
    /** factory 挂起期取消标记（resolve 后不入队） */
    _cancelled = false;
    /** factory 挂起期的 update 补丁缓存（return 落地时随初始 props 合并，ADR-0083 Q12a） */
    _pendingPatch: Record<string, any> | null = null;

    constructor(protected readonly manager: MessageManager) {}

    get closed(): boolean {
        const e = this._entry;
        return this._cancelled || !e || e.state === "closed" || e.state === "hidden";
    }
    get read(): boolean {
        return this._entry?.props.read === true;
    }
    get status(): number | string | undefined {
        return this._entry?.props.status;
    }
    get result(): any {
        return this._entry?.props.result;
    }

    /** 重显已隐藏记录（完整展示管线；展示中 / 排队中幂等 no-op；死后 no-op + warn） */
    show(): void {
        const entry = this._entry;
        if (!entry) {
            this._warnDead("show()");
            return;
        }
        if (entry.state === "hidden") {
            entry.state = "queued";
            this.manager._displayEntry(entry);
        }
    }

    /** 关闭（走离场动画；幂等；factory 挂起期 = 取消） */
    hide(): void {
        const entry = this._entry;
        if (entry && (entry.state === "shown" || entry.state === "queued")) {
            this.manager._dismiss(entry, true);
        } else if (!entry) {
            this._cancelled = true; // factory 挂起期：取消（resolve 后不显示）
        }
    }

    /** 硬移除记录（含持久化数据同步删除：local 即写 / remote 即 flush 全量覆盖） */
    remove(): void {
        if (!this._entry) {
            this._warnDead("remove()");
            return;
        }
        this.manager.delete(this.id);
    }

    /**
     * 记录级补丁（`manager.update(id, patch)` 的句柄面）：read / status / result / title /
     * level 等。factory 挂起期为**缓存**——return 的初始展示配置落地时合并（后写胜）。
     */
    update(patch: Partial<MessageProps>): void {
        if (!this._entry) {
            if (this.id !== "") {
                this._warnDead("update()");
                return;
            }
            Object.assign((this._pendingPatch ??= {}), patch); // 挂起缓存（ADR-0083 Q12a）
            return;
        }
        this.manager.update(this.id, patch);
    }

    /**
     * 取消：挂起期 = 丢弃（factory resolve 后不入队）；展示中 / 排队中 = 立即关（无完成态）。
     * Task / Confirm 子类共享本实现（ADR-0077「cancel 同为立即关」语义上移基类）。
     */
    cancel(): void {
        const entry = this._entry;
        if (entry && (entry.state === "shown" || entry.state === "queued")) {
            this.manager._dismiss(entry, true);
        } else if (!entry && this.id === "") {
            this._cancelled = true;
        }
    }

    /** 死会话告警（统一文案） */
    protected _warnDead(method: string): void {
        this.manager.engine.logger.warn(
            `engine.messages: 会话已死亡（记录已 remove），${method} 无效（ADR-0083）`,
        );
    }

    // ── 装配管线（ADR-0088 自 manager `_mount` 上移） ──────────────────

    /**
     * 挂载卡片（容量已由 queue 判定，ADR-0077 双层装配）：type 模板先编译（内容先于
     * shell——overlay 装配序），产物经 `mode:"live"` 段投影进 shell 默认出口；shell 与
     * type 模板**同挂 anchor scope**（兄弟挂链）+ 同引用 `$session` 派生变量两层注入。
     * shell 无默认出口 → warn + type 区丢弃。props 数据域（剥函数整包，ADR-0088）**同权
     * 注入两层**。最后卡片根装配（wrapper 判据 = 非内置 shell）→ 委托监听 → enter 动画 →
     * 计时 → 广播。
     */
    mount(column: HTMLElement): void {
        const entry = this._entry;
        if (!entry || entry.state !== "queued") return;
        const engine = this.manager.engine;
        const shell = this._resolveShell();
        const renderer = this._resolveRenderer(entry.type);
        // anchor 数据视图（决策 14 职责③）：有 anchor 挂链其 scope，无 anchor rootless
        const parentScope = this._anchorScope(entry.anchor);
        // $session 派生变量（ADR-0077）：localData 通道——非响应式、行为专职、不进 state；
        // shell 与 type 模板两层注入同一对象（值即本会话，模板 `@click="$session.hide()"`）
        const sessionVars: Record<string, any> = { $session: entry.session };
        const props = this._buildInjectProps();

        // ① type 模板编译（内容层组件——task 进度槽/控制钮、base 默认内容；无出口则跳过）
        let rendererCompiled: { el: HTMLElement; scope: AutoSparkScope } | null = null;
        const hasOutlet = !!shell.def?.slots?.includes("default");
        if (renderer) {
            if (!hasOutlet) {
                engine.logger.warn(
                    `engine.messages: shell "${shell.name}" 未声明默认出口（裸 x-slot），type="${entry.type}" 内容区已丢弃（ADR-0077）`,
                );
            } else {
                rendererCompiled = engine.compiler.instantiateDetachedComponent(
                    renderer.snapshot.cloneNode(true) as HTMLElement,
                    parentScope,
                    renderer.def,
                    props,
                    undefined,
                    null,
                    null,
                    sessionVars,
                );
            }
        }

        // ② shell 编译（公共骨架）：type 模板产物作为 live 插槽段投影默认出口（活体直挂
        //    不克隆不重编译，销毁权责归 unmount 统一回收双 scope——overlay 同构）
        const shellSlots: Map<string, SlotContent> | null = rendererCompiled
            ? new Map<string, SlotContent>([
                  [
                      "default",
                      {
                          name: "default",
                          nodes: [rendererCompiled.el],
                          params: [],
                          paramsExpr: null,
                          mode: "live",
                      } satisfies SlotContent,
                  ],
              ])
            : null;
        const compiled = engine.compiler.instantiateDetachedComponent(
            shell.snapshot.cloneNode(true) as HTMLElement,
            parentScope,
            shell.def,
            props,
            undefined,
            shellSlots,
            null,
            sessionVars,
        );

        // 卡片根装配（决策 16/21 DOM 契约 + ADR-0077）：内置 shell（或未接管的内置种子）的
        // 组件根即卡片根（模板自带双类名）；用户 shell（components 命中 / uiShells 用户键）
        // 包引擎 wrapper——基类 / pos 标记 / 卡片级动画、收拢与 hover 监听恒挂 wrapper，
        // 用户模板零引擎类污染（不被卡片布局样式干扰）
        let card = compiled.el;
        if (!shell.builtin) {
            const wrapper = document.createElement("div");
            wrapper.appendChild(card);
            card = wrapper;
        }
        entry.scope = compiled.scope;
        entry.rendererScope = rendererCompiled?.scope ?? null;
        entry.el = card;
        entry.session.el = card;
        // slide 方向覆写层依赖（样式表按 data-message-pos 前缀/后缀分派 from 值）
        card.setAttribute(MESSAGE_COLUMN_ATTR, entry.props.pos as string);
        // 业务类别与语义色分派属性（ADR-0079）：引擎静态写入卡片根（ADR-0088——原 shell 的
        // `:data-message-type` 模板绑定改此处统一写，用户 shell 的 wrapper 同享契约）；
        // data-message-level = 严重度名字面（CSS 选择器挂此属性；原地更新经 _applyEntryConfig 刷新）
        card.setAttribute("data-message-type", entry.type);
        card.setAttribute("data-message-level", messageLevelName(entry.record.level ?? 0));
        // 卡片根基类契约（决策 21）：列内卡片查找（.autospark-message 选择器）与 slide 动画
        // 覆写层均依赖该类——内置外壳模板自带，wrapper 初始即设（classList.add 幂等）
        card.classList.add("autospark-message");
        if (entry.props.className) {
            card.classList.add(...String(entry.props.className).trim().split(/\s+/));
            entry.appliedClassName = String(entry.props.className);
        }
        // 内联样式（ADR-0077 styles）：cssText 一次性写入；尺寸五键随后经 setProperty 结构化
        // 写入（后者不互清——cssText 整体覆盖先执行，结构化键最终生效）
        if (entry.props.styles) {
            card.style.cssText = String(entry.props.styles);
            entry.appliedStyles = String(entry.props.styles);
        }
        this._applySizes(card, entry.props);
        // 行为委托：点击（actions + 关闭钮 + 任意点击置已读）与 hover 暂停，监听挂卡片根
        entry.clickHandler = (e: Event) => this.manager._onCardClick(entry, e);
        entry.enterHandler = () => this._pauseTimer();
        entry.leaveHandler = () => this._resumeTimer();
        card.addEventListener("click", entry.clickHandler);
        card.addEventListener("mouseenter", entry.enterHandler);
        card.addEventListener("mouseleave", entry.leaveHandler);

        // 列内定位（ADR-0079 排序移除）：纯到达序 append 列尾
        column.appendChild(card);

        const resolved = resolveAnimate(entry.props.animate);
        entry.leave = resolved.leave;
        engine.animate.enter(card, resolved.enter);
        entry.state = "shown";
        this._startTimer();
        this.manager._emit("message:show", entry);
    }

    /**
     * 摘除卡片（`_teardown` 的 DOM/scope 部分，ADR-0088 上移）：解绑监听 + DOM 移除 +
     * 双 scope 收口（shell 与 type 模板实例 scope 各自销毁 + 回收私有响应式域——overlay
     * shell 收口同纪律）。记录存续 / 镜像 / 队列补位等编排归 manager `_teardown`。
     */
    unmount(): void {
        const entry = this._entry;
        const el = entry?.el;
        if (el) {
            if (entry!.clickHandler) el.removeEventListener("click", entry!.clickHandler);
            if (entry!.enterHandler) el.removeEventListener("mouseenter", entry!.enterHandler);
            if (entry!.leaveHandler) el.removeEventListener("mouseleave", entry!.leaveHandler);
            el.remove();
        }
        if (!entry) return;
        entry.el = null;
        entry.session.el = null;
        for (const scope of [entry.scope, entry.rendererScope]) {
            if (!scope) continue;
            const scopeId = scope.id;
            scope.destroy(); // 幂等守卫：级联已销毁时 no-op
            const scopes = (this.manager.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[scopeId];
        }
        entry.scope = null;
        entry.rendererScope = null;
    }

    // ── type 自治钩子（公共层调用，子类覆写——默认 no-op / 默认行为） ─────

    /**
     * 初始装载钩子（createEntry 尾调用，绑定 `_entry` 后）：子类据初始 props 初始化
     * 自有运行态（TaskSession 装载初始进度 + 创建协作取消控制器）。默认 no-op。
     */
    initFromProps(_merged: MessageProps): void {}

    /**
     * 镜像投影钩子（buildRecord 尾调用）：子类向 `$messages.items` 记录补 type 专属
     * 投影（TaskSession 补 progress / paused / completed / canXxx）。默认 no-op。
     */
    projectInto(_rec: import("../types").AutoSparkMessage): void {}

    /**
     * 配置应用钩子（_applyEntryConfig 尾调用）：子类响应新配置中的 type 专属键
     * （TaskSession 响应 progress 补丁通道）。默认 no-op。
     */
    onEntryProps(_entry: MessageEntry, _props: MessageProps): void {}

    /** 计时拦截（进行中声明）：返回 true 则 `_startTimer` 不启动倒计时（task 进行中
     *  sticky——TaskSession 覆写为 `!this._completed`）。默认 false（照常计时）。 */
    _holdOpen(): boolean {
        return false;
    }

    // ── 数据域（props 整包注入，ADR-0088） ─────────────────────────────

    /**
     * 注入 props 构建（**公共面**——type 无关）：props 整包透传（剥函数 / DOM 引用，
     * ADR-0088）+ 派生键 icon / actions。**type 专属运行态投影由子类覆写本方法补入**
     * （TaskSession 补 progress / paused / completed——type 自治原则：公共层零 type 知识）。
     */
    _buildInjectProps(): Record<string, any> {
        const entry = this._entry!;
        const out: Record<string, any> = {};
        for (const [key, value] of Object.entries(entry.props)) {
            if (typeof value === "function") continue; // 函数剥除（autostore computed 劫持防线）
            if (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) continue; // anchor（DOM 引用）
            out[key] = value;
        }
        out.icon = entry.icon;
        out.actions = entry.actions;
        return out;
    }

    /**
     * 数据域刷新（响应式活体红利：改 data 域 props 驱动 x-html / 绑定自动更新；两层同权——
     * shell 与 type 模板各自实例 data 域同步刷新。actions 组件为第三层：经 x-component
     * props 表达式深层触发自动联动，不经此处手动同步，ADR-0088）。
     */
    syncData(): void {
        const entry = this._entry;
        if (!entry) return;
        const props = this._buildInjectProps();
        if (entry.scope?.data) Object.assign(entry.scope.data, props);
        if (entry.rendererScope?.data) Object.assign(entry.rendererScope.data, props);
    }

    /**
     * 卡片尺寸五键写入（ADR-0077 渲染键）：inline 经 setProperty 结构化写入（number = px，
     * formatMessageSize 归一），undefined = removeProperty 归位（width/height 归 CSS 的 auto、
     * max-width 归内置 shell 的 `--autospark-message-max-w` 兜底）。幂等。
     */
    _applySizes(el: HTMLElement, props: MessageProps): void {
        for (const key of SIZE_KEYS) {
            const v = (props as any)[key];
            const cssName = key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()); // minWidth → min-width
            if (v == null || v === "" || v === "auto") el.style.removeProperty(cssName);
            else el.style.setProperty(cssName, formatMessageSize(v as number | string));
        }
    }

    // ── delayClose 计时与 hover 暂停（剩余时间制，ADR-0088 上移） ──────

    /** 启动自动关闭计时（子类可覆写 `_holdOpen()` 拦截——task 进行中 sticky 即此实现） */
    _startTimer(): void {
        const entry = this._entry;
        if (!entry) return;
        this._clearTimer();
        if (this._holdOpen()) return; // 进行中不计时（type 自治——子类声明，公共层零 type 判定）
        const delay = entry.props.delayClose;
        if (typeof delay === "number" && delay > 0) {
            entry.deadline = Date.now() + delay;
            entry.pausedRemaining = null;
            entry.timer = setTimeout(() => {
                entry.timer = null;
                this.manager._dismiss(entry, true);
            }, delay);
        } else {
            entry.deadline = null; // sticky
        }
    }

    /** hover 暂停：记剩余时间、停表（sticky 无表，no-op） */
    _pauseTimer(): void {
        const entry = this._entry;
        if (!entry || entry.timer == null || entry.deadline == null) return;
        clearTimeout(entry.timer);
        entry.timer = null;
        entry.pausedRemaining = Math.max(0, entry.deadline - Date.now());
    }

    /** hover 移出恢复：按剩余时间续表 */
    _resumeTimer(): void {
        const entry = this._entry;
        if (!entry || entry.pausedRemaining == null || entry.state !== "shown") return;
        const remaining = entry.pausedRemaining;
        entry.pausedRemaining = null;
        entry.deadline = Date.now() + remaining;
        entry.timer = setTimeout(() => {
            entry.timer = null;
            this.manager._dismiss(entry, true);
        }, remaining);
    }

    _clearTimer(): void {
        const entry = this._entry;
        if (!entry) return;
        if (entry.timer != null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }
        entry.pausedRemaining = null;
    }

    // ── 渲染解析（shell 链 / type 链 / anchor 挂链，ADR-0088 上移） ────

    /**
     * shell 解析（ADR-0077 公共骨架链，每卡现读——`options.messages.shell` 运行时直写换键
     * 对后续 add 生效）：选择器名（默认 'message'）→ getComponentDeclaration 链（用户自定义
     * 组件）→ `options.uiShells` 引擎级注册表（内置种子 + 用户覆盖）→ 内置 shell 兜底。
     * `builtin` 标记决定装配形态（内置模板自带引擎类名契约根即卡片根；用户模板包 wrapper）。
     */
    private _resolveShell(): { name: string; snapshot: HTMLElement; def: ComponentDef | null; builtin: boolean } {
        const engine = this.manager.engine;
        const name = String(this.manager._options.shell ?? "").trim() || "message";
        // ① getComponentDeclaration 链（用户自定义 shell——消息无树内宿主，实际查全局组件表）
        const snapshot = engine._resolveGlobalComponent(name);
        if (snapshot) {
            const def = engine.getComponentDef(snapshot) ?? engine.getGlobalComponentDef(name) ?? null;
            return { name, snapshot, def, builtin: false };
        }
        // ② options.uiShells 引擎级注册表（ADR-0077：内置种子 + 用户同键覆盖）
        const ui = engine._resolveUiShell(name);
        if (ui) return { name, ...ui, builtin: engine._isBuiltinUiShell(name) };
        // ③ 兜底内置 shell（名配错——可发现）
        engine.logger.warn(
            `engine.messages: shell "${name}" 未命中（全局组件表与 options.uiShells 均无），回退内置默认（ADR-0077）`,
        );
        return { name: "message", ...resolveMessageShell(), builtin: true };
    }

    /**
     * type 模板解析（ADR-0083 专属区链 + **ADR-0088 base 兜底**，与 shell 链正交）：
     * `types[type].render`（用户 type 级）→ 全局组件表按预设名 `autospark.messages.<type>`
     * （继承组件族——用户同名覆盖 / 可继承）→ **`autospark.messages.base` 默认内容模板**
     * （自定义 type 零配置得标准内容卡——「出口空置」退役，ADR-0088）。用户 render 名走
     * 全局组件表查找，未命中 warn + 按预设名顺位回退。
     */
    private _resolveRenderer(type: string): { snapshot: HTMLElement; def: ComponentDef | null } | null {
        const engine = this.manager.engine;
        const renderName = this.manager._options.types?.[type]?.render?.trim() ?? "";
        if (renderName !== "") {
            const snapshot = engine._resolveGlobalComponent(renderName);
            if (snapshot) {
                const def = engine.getComponentDef(snapshot) ?? engine.getGlobalComponentDef(renderName) ?? null;
                return { snapshot, def };
            }
            engine.logger.warn(
                `engine.messages: 自定义 render "${renderName}"（types.${type}.render）未在全局组件表命中，按预设组件顺位回退（ADR-0083）`,
            );
        }
        // 预设名顺位 → base 兜底（ADR-0088）
        for (const name of [presetComponentName(type), BASE_PRESET_NAME]) {
            const snapshot = engine._resolveGlobalComponent(name);
            if (snapshot) {
                const def = engine.getComponentDef(snapshot) ?? engine.getGlobalComponentDef(name) ?? null;
                return { snapshot, def };
            }
        }
        return null;
    }

    /** anchor 数据视图（决策 14 职责③）：自 anchor 向上找最近 scope 作 render 实例父挂链 */
    private _anchorScope(anchor: HTMLElement | null): AutoSparkScope | null {
        if (!anchor) return null;
        let el: HTMLElement | null = anchor;
        while (el) {
            const scope = this.manager.engine.findScopeByEl(el);
            if (scope) return scope;
            el = el.parentElement;
        }
        return null;
    }
}
