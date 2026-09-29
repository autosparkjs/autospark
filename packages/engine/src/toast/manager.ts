import type { AutoSpark } from "../engine";
import { SCOPES_KEY } from "../engine";
import { resolveAnimate, type PhaseAnim } from "../animate";
import type { AutoSparkScope } from "../scope";
import type { ComponentDef } from "../directives/component-def";
import { releaseComponentStyle } from "../utils/scopedStyle";
import { getToastColumn, removeToastContainer, TOAST_COLUMN_ATTR } from "./container";
import { TOAST_COLUMN_GAP } from "./styles";
import { resolveBuiltinToastShell } from "./shell";
import {
    parseToastProps,
    TOAST_DEFAULTS,
    TOAST_POS,
    TOAST_RESERVED_KEYS,
    TOAST_TYPES,
    TOAST_TYPE_ICONS,
    type ResolvedToastAction,
    type ToastOptions,
    type ToastPos,
    type ToastProps,
    type ToastTask,
    type ToastType,
} from "./types";

/**
 * ToastManager：全局轻提示引擎级子系统（ADR-0068 决策 1）。
 *
 * 三层结构（决策 2）：本管理器（队列 / 生命周期 / 原地更新）> 分区列（引擎结构，container.ts）
 * > 单项卡片 = toast-shell 内置私有组件实例（`instantiateDetachedComponent` 管道，rootless
 * 挂链，真响应式活体——原地更新写 data 域 props 自动响应）。
 *
 * - **Map 语义**（决策 5）：继承 `Map<string, ToastTask>`，键恒为 string id（缺省自动生成）；
 *   `get()` 即原生；`delete(id)` 覆写为**立即销毁**（无动画，Map 硬移除语义，与 `hide()`
 *   的动画关闭区分）；`clear(animated?)` 覆写为清全部（含等待队列，默认带离场动画）。
 * - **按 pos 分区 FIFO 队列**（决策 8）：每列独立上限 `showCount`（默认 5），满员排队、
 *   append 列尾、自动关闭后按序补位；离场后兄弟直接回流（不动画补位）。
 * - **生命周期**（决策 9/10）：`delay` 默认 3000、`0` = sticky；hover 暂停 / 移出恢复
 *   （剩余时间制）；`engine.stop()` 不感知（无锚非树内），`dispose()`（destroy 调用）全部
 *   立即销毁 + 容器整体移除。
 * - **原地更新**（决策 5）：同 id 重复 show = 换内容域 props（scope.data 响应式赋值）+
 *   显示中重置 delay 满额计时；不重播进场动画；pos / offset 忽略（不迁移列）。
 * - **行为委托**（决策 11 契约分工）：按钮与关闭钮的点击由本类挂**卡片根委托监听**
 *   （`data-toast-action` 索引 → 预解析 actions 表；`.autospark-toast-close` 类名命中），
 *   `hide` 键（默认 true）点击后关 toast——模板不绑 `@click`，行为归引擎、形态归外壳。
 * - **事件双通道**（决策 17）：`toast:show` / `toast:hide` 引擎总线 + 卡片元素
 *   dispatchEvent，payload `{ toast, el }`；一切移除路径均广播 hide。
 * - **动画**（决策 16）：显隐经 `engine.animate`（ADR-0039），默认 `'slide'` + 按
 *   `data-toast-pos` 的方向自适应覆写层（shell.ts 样式表）。
 * - **全关语义**（决策 6）：`options.toast: false` 时构造即短路（不建容器、不注样式），
 *   `show()` warn + 返回死句柄（hide 无效、closed 恒真）。
 */
export class ToastManager extends Map<string, ToastTask> {
    readonly engine: AutoSpark<any>;
    /** 特性开关（options.toast !== false）；false 时构造即短路 */
    readonly enabled: boolean;

    /** 全局默认配置（options.toast 配置对象；缺省空对象走 TOAST_DEFAULTS） */
    private _globalOptions: ToastOptions;

    /** 自动 id 计数器 */
    private _autoId = 0;
    /** 等待队列（按 pos 分区）：满员 FIFO，自动关闭后按序补位 */
    private _queues = new Map<ToastPos, ToastEntry[]>();

    constructor(engine: AutoSpark<any>) {
        super();
        this.engine = engine;
        const cfg = engine.options.toast;
        this.enabled = cfg !== false;
        this._globalOptions = cfg === false || cfg == null ? {} : cfg;
    }

    // ── 显示入口（ADR-0068 决策 4：三态入参） ─────────────────────────

    /**
     * 发起一条 toast：字符串简写 ≡ `{ message }`；async factory resolve `undefined`/`void`
     * → 静默跳过，挂起期 `task.hide()` = 取消。空 message warn + no-op（不给白板 toast）。
     * `options.toast: false` 时 warn + 死句柄（全关语义，决策 6）。
     */
    show(input: string | ToastProps | (() => Promise<ToastProps | void | undefined>)): ToastTask {
        if (!this.enabled) {
            this.engine.logger.warn(
                "engine.toast: toast 特性已通过 options.toast: false 关闭，调用被忽略",
            );
            return DEAD_TASK;
        }
        if (typeof input === "function") return this._showAsync(input);
        const parsed = parseToastProps(input, (m) => this.engine.logger.warn(m));
        if (!parsed) return DEAD_TASK;
        return this._enqueue(parsed);
    }

    /** async factory 形态：同步返回挂起句柄，resolve 后入队（undefined → 静默跳过） */
    private _showAsync(factory: () => Promise<ToastProps | void | undefined>): ToastTask {
        const task = this._createTask();
        factory()
            .then((props) => {
                if (task._cancelled) return; // 挂起期 hide() = 取消
                if (props == null) {
                    // undefined / void → 条件通知：内容就绪才弹，静默跳过（终态：视为已取消）
                    task._cancelled = true;
                    return;
                }
                const parsed =
                    parseToastProps(typeof props === "string" ? props : (props as ToastProps), (m) =>
                        this.engine.logger.warn(m),
                    ) ?? null;
                if (!parsed || !String(parsed.message ?? "").trim()) {
                    this.engine.logger.warn("engine.toast: factory 结果缺少 message（空消息），已跳过");
                    return;
                }
                this._enqueue(parsed, task);
            })
            .catch((e: any) => {
                this.engine.logger.warn(`engine.toast: factory 执行失败，已跳过: ${e?.message ?? e}`);
            });
        return task;
    }

    /** 入队 / 原地更新（同 id）唯一入口：props 校验归一 → 已存在则更新，否则创建 entry 排队 */
    private _enqueue(userProps: ToastProps, reuseTask?: ToastTaskImpl): ToastTask {
        // 空消息 no-op（含字符串简写形态；factory 路径已先行校验）
        if (!String(userProps.message ?? "").trim()) {
            this.engine.logger.warn("engine.toast: message 为空，调用被忽略");
            if (reuseTask) reuseTask._cancelled = true; // factory 复用句柄进入终态
            return DEAD_TASK;
        }
        // 合并链（决策 6）：内置默认 < options.toast 全局默认 < 单次 props（按保留键逐层覆盖）。
        // `id` 仅单次层生效——全局默认若携带 id 会让所有 toast 同 id 互相原地更新成一条。
        const merged: Record<string, any> = { ...TOAST_DEFAULTS };
        for (const key of TOAST_RESERVED_KEYS) {
            if (key !== "id" && key in this._globalOptions) merged[key] = (this._globalOptions as any)[key];
            if (key in userProps) merged[key] = (userProps as any)[key];
        }
        // 枚举校验：非法值 warn + 回退（决策 7 / 12）
        if (!TOAST_POS.has(merged.pos)) {
            this.engine.logger.warn(`engine.toast: 未知 pos "${merged.pos}"，已回退 "${TOAST_DEFAULTS.pos}"`);
            merged.pos = TOAST_DEFAULTS.pos;
        }
        if (!TOAST_TYPES.has(merged.type)) {
            this.engine.logger.warn(`engine.toast: 未知 type "${merged.type}"，已回退 "none"`);
            merged.type = "none";
        }
        const id = merged.id != null && merged.id !== "" ? String(merged.id) : `toast-${++this._autoId}`;

        // 同 id 原地更新（决策 5）：排队中只换内容，显示中换内容 + 重置计时；不重播动画。
        // 传 **userProps**（非合并链产物）——更新基准是 entry 当前生效配置（未传键保留原值，
        // 如进度场景 toast({id}) 不带 delay 不丢首次时长），而非回落全局默认
        const existing = super.get(id);
        if (existing) {
            const entry = (existing as ToastTaskImpl)._entry;
            if (entry && entry.state !== "closed") {
                this._updateInPlace(entry, userProps);
                return existing;
            }
        }

        const entry: ToastEntry = {
            id,
            props: merged as ToastProps,
            icon: this._resolveIcon(merged.type as ToastType),
            actions: this._resolveActions(merged.actions),
            state: "queued",
            scope: null,
            el: null,
            timer: null,
            deadline: null,
            pausedRemaining: null,
            leave: null,
            clickHandler: null,
            enterHandler: null,
            leaveHandler: null,
            appliedClassName: "",
        };
        const task = reuseTask ?? this._createTask();
        task._entry = entry;
        task.id = id;
        entry.task = task;
        super.set(id, task);

        // 容量判定（按 pos 分区各计，决策 8）：有坑即显示，满员排队
        const column = getToastColumn(this.engine, merged.pos as ToastPos, merged.offset);
        if (column && column.childElementCount < this._showCount) {
            this._mount(entry, column);
        } else if (column) {
            const queue = this._queues.get(merged.pos as ToastPos) ?? [];
            queue.push(entry);
            this._queues.set(merged.pos as ToastPos, queue);
        }
        // column 为 null（SSR / 无 body）：保持 queued（无 flush 时机，文档不承诺 SSR 显示）
        return task;
    }

    /** 同屏上限（管理器级键，不进单次合并链） */
    private get _showCount(): number {
        const n = this._globalOptions.showCount ?? TOAST_DEFAULTS.showCount;
        return typeof n === "number" && n > 0 ? Math.floor(n) : TOAST_DEFAULTS.showCount;
    }

    /** type → 图标名（ADR-0068 决策 12）：icons 重映射 > 同名词默认；none 无图标 */
    private _resolveIcon(type: ToastType): string {
        if (type === "none") return "";
        return this._globalOptions.icons?.[type] ?? TOAST_TYPE_ICONS[type] ?? type;
    }

    /**
     * actions 预解析（ADR-0068 决策 14）：字符串查 `engine.actions` 全局表（toast API 无 el
     * 无法定位 scope 链，不支持局部 scope action）；未命中 warn + 剪枝。产物注入 props——
     * shell（含自定义）拿到即解析后形态。
     */
    private _resolveActions(items: ToastProps["actions"]): ResolvedToastAction[] {
        const resolved: ResolvedToastAction[] = [];
        for (const item of items ?? []) {
            if (typeof item === "string") {
                const desc = this.engine.actions[item];
                if (!desc) {
                    this.engine.logger.warn(
                        `engine.toast: action "${item}" 未在全局 action 表命中，按钮已剪枝`,
                    );
                    continue;
                }
                resolved.push({
                    title: (desc.title as string) ?? item,
                    handle: desc.handle,
                    hide: (desc as any).hide !== false,
                });
            } else if (item && typeof item === "object" && typeof item.handle === "function") {
                resolved.push({
                    title: item.title ?? "action",
                    handle: item.handle,
                    hide: item.hide !== false,
                });
            } else {
                this.engine.logger.warn(`engine.toast: 非法 action 项（缺 handle），已剪枝`);
            }
        }
        return resolved;
    }

    // ── 挂载（shell 实例化 + 行为接线） ────────────────────────────────

    /**
     * shell 解析（决策 2 查找协议）：`options.toast.shell` 组件名 → 全局组件表
     * （toast 无 el，不查 scope 链）→ 未命中 warn 回退内置 toast-shell。
     */
    private _resolveShell(): { name: string; snapshot: HTMLElement; def: ComponentDef | null } {
        const name = this._globalOptions.shell?.trim() ?? "";
        if (name !== "") {
            const snapshot = this.engine._resolveGlobalComponent(name);
            if (snapshot) {
                const def =
                    this.engine.getComponentDef(snapshot) ??
                    this.engine.getGlobalComponentDef(name) ??
                    null;
                return { name, snapshot, def };
            }
            this.engine.logger.warn(
                `toast: 自定义 shell "${name}" 未在全局组件表命中，回退内置 toast-shell（ADR-0068 决策 2）`,
            );
        }
        return { name: "toast-shell", ...resolveBuiltinToastShell() };
    }

    /** 注入 props（预解析形态，决策 11）：内容域 + 派生键（icon / actions） */
    private _buildInjectProps(entry: ToastEntry): Record<string, any> {
        return {
            type: entry.props.type,
            message: entry.props.message ?? "",
            icon: entry.icon,
            actions: entry.actions,
            closable: entry.props.closable === true,
        };
    }

    /** 挂载卡片（容量已判定）：shell 实例化 → pos 标记 → 委托监听 → enter 动画 → 计时 → 广播 */
    private _mount(entry: ToastEntry, column: HTMLElement): void {
        const shell = this._resolveShell();
        const clone = shell.snapshot.cloneNode(true) as HTMLElement;
        const compiled = this.engine.compiler.instantiateDetachedComponent(
            clone,
            null, // rootless 挂链：shell 形态组件不依赖声明上下文，生命周期归本管理器
            shell.def,
            this._buildInjectProps(entry),
        );
        entry.scope = compiled.scope;
        entry.el = compiled.el;
        entry.task.el = compiled.el;
        // slide 方向覆写层依赖（shell.ts 样式表按此属性前缀/后缀分派 from 值）
        compiled.el.setAttribute(TOAST_COLUMN_ATTR, entry.props.pos as string);
        if (entry.props.className) {
            compiled.el.classList.add(...String(entry.props.className).trim().split(/\s+/));
            entry.appliedClassName = String(entry.props.className);
        }
        // 行为委托（决策 11）：点击（actions + 关闭钮）与 hover 暂停，监听挂卡片根随卡片生死
        entry.clickHandler = (e: Event) => this._onCardClick(entry, e);
        entry.enterHandler = () => this._pauseTimer(entry);
        entry.leaveHandler = () => this._resumeTimer(entry);
        compiled.el.addEventListener("click", entry.clickHandler);
        compiled.el.addEventListener("mouseenter", entry.enterHandler);
        compiled.el.addEventListener("mouseleave", entry.leaveHandler);

        column.appendChild(compiled.el); // append 列尾（先来在上，决策 8）

        const resolved = resolveAnimate(entry.props.animate);
        entry.leave = resolved.leave;
        this.engine.animate.enter(compiled.el, resolved.enter);
        entry.state = "shown";
        this._startTimer(entry);
        this._emit("toast:show", entry);
    }

    /** 卡片点击委托：按钮（data-toast-action 索引 → 预解析表，hide 键收口）/ 关闭钮 */
    private _onCardClick(entry: ToastEntry, e: Event): void {
        const target = e.target as Element | null;
        const actionBtn = target?.closest?.(".autospark-toast-action") as HTMLElement | null;
        if (actionBtn) {
            const index = Number(actionBtn.getAttribute("data-toast-action"));
            const action = entry.actions[Number.isInteger(index) ? index : -1];
            if (action) {
                action.handle();
                if (action.hide) this._dismiss(entry, true);
            }
            return;
        }
        if (target?.closest?.(".autospark-toast-close")) {
            this._dismiss(entry, true);
        }
    }

    // ── delay 计时与 hover 暂停（决策 9：剩余时间制） ──────────────────

    /** 启动自动关闭计时（`delay > 0`；`0` = sticky 永不自动关，不计时） */
    private _startTimer(entry: ToastEntry): void {
        this._clearTimer(entry);
        const delay = entry.props.delay;
        if (typeof delay === "number" && delay > 0) {
            entry.deadline = Date.now() + delay;
            entry.pausedRemaining = null;
            entry.timer = setTimeout(() => {
                entry.timer = null;
                this._dismiss(entry, true);
            }, delay);
        } else {
            entry.deadline = null; // sticky
        }
    }

    /** hover 暂停：记剩余时间、停表（sticky 无表，no-op） */
    private _pauseTimer(entry: ToastEntry): void {
        if (entry.timer == null || entry.deadline == null) return;
        clearTimeout(entry.timer);
        entry.timer = null;
        entry.pausedRemaining = Math.max(0, entry.deadline - Date.now());
    }

    /** hover 移出恢复：按剩余时间续表 */
    private _resumeTimer(entry: ToastEntry): void {
        if (entry.pausedRemaining == null || entry.state !== "shown") return;
        const remaining = entry.pausedRemaining;
        entry.pausedRemaining = null;
        entry.deadline = Date.now() + remaining;
        entry.timer = setTimeout(() => {
            entry.timer = null;
            this._dismiss(entry, true);
        }, remaining);
    }

    private _clearTimer(entry: ToastEntry): void {
        if (entry.timer != null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }
        entry.pausedRemaining = null;
    }

    // ── 原地更新（决策 5：同 id） ─────────────────────────────────────

    /**
     * 同 id 更新：以 entry 当前生效配置为基准、userProps 显式键打补丁（未传键保留原值——
     * 进度场景重复 toast({id, message}) 不丢首次 delay/pos 等），经 scope.data 响应式赋值
     * 驱动 x-html / x-show / 属性绑定自动刷新（shell 活体红利）。
     * pos / offset / id **忽略**（不迁移已建列，决策 7 同约定）。显示中重置 delay 满额计时；
     * 不重播进场动画。
     */
    private _updateInPlace(entry: ToastEntry, userProps: ToastProps): void {
        const merged: Record<string, any> = { ...entry.props };
        for (const key of TOAST_RESERVED_KEYS) {
            if (key === "id") continue; // id 恒不变
            if (key in userProps) merged[key] = (userProps as any)[key];
        }
        // 枚举校验与首入队同规（非法值 warn + 回退）
        if (!TOAST_POS.has(merged.pos)) merged.pos = TOAST_DEFAULTS.pos;
        if (!TOAST_TYPES.has(merged.type)) merged.type = "none";
        const prevClassName = entry.appliedClassName;
        entry.props = merged as ToastProps;
        entry.icon = this._resolveIcon(merged.type as ToastType);
        entry.actions = this._resolveActions(merged.actions);
        if (entry.scope?.data) {
            Object.assign(entry.scope.data, this._buildInjectProps(entry));
        }
        // className 换装（移除旧追加新——响应式之外的非绑定属性，引擎直管）
        const nextClassName = merged.className ? String(merged.className).trim() : "";
        if (entry.el) {
            if (prevClassName) entry.el.classList.remove(...prevClassName.split(/\s+/));
            if (nextClassName) entry.el.classList.add(...nextClassName.split(/\s+/));
        }
        entry.appliedClassName = nextClassName;
        if (entry.state === "shown") this._startTimer(entry); // 重置满额计时（sticky 判定同步重算）
    }

    // ── 关闭与收口（决策 10 / 17） ────────────────────────────────────

    /**
     * 关闭（一切移除路径终点）：hide 广播在发起时（语义对齐 tooltip:hide / overlay:close
     * 请求时点）；离场动画完成后 `_teardown`（摘 DOM + scope 收口 + 出 Map + 补位 flush）。
     *
     * 离场收拢（ADR-0068 fast-follow「兄弟平滑跟进」）：transform/opacity 不参与布局，
     * 卡片 remove 瞬间兄弟会跳位——故离场相同时把 height/padding/border 垂直收拢进同一条
     * 过渡链（inline transition 覆写扩展属性集），布局高度平滑归零、兄弟随流平滑上移；
     * `margin-bottom: -GAP` 抵消收拢卡后侧的列 gap，remove 瞬间零跳变。结束检测按
     * computed transition-property 收齐全部分属事件（animate._registerEnd 契约）；
     * 自定义动画（fade 等无 transform 相位）个别属性不发事件时由超时兜底 +50ms 收口。
     */
    private _dismiss(entry: ToastEntry, animated: boolean): void {
        if (entry.state === "closed") return;
        entry.state = "closed";
        this._clearTimer(entry);
        this._emit("toast:hide", entry);
        const finish = () => this._teardown(entry);
        const leave = animated ? entry.leave : null;
        if (leave && entry.el) {
            const el = entry.el;
            // ① 收拢起始帧（先于 leave）：锁定自然高度（height auto → px 才可过渡；
            //    offsetHeight 为 border-box 渲染高，box-sizing 同步对齐——expand 同款）。
            //    只设布局属性——transition 系列留待 ②：leave 起手 cancel 会还原在播动画
            //    的 inline 备份（enter ①帧备份含 transition），设在 ① 会被抹掉。
            //    happy-dom 无布局环境 offsetHeight 恒 0，锁定 0 → 归零 0→0 无变化无害。
            el.style.boxSizing = "border-box";
            el.style.height = `${el.offsetHeight}px`;
            el.style.overflow = "hidden";
            const started = this.engine.animate.leave(el, leave, finish);
            if (!started) {
                finish();
            } else {
                // ② 收拢目标帧：仅扩展 transition-property（duration/easing 沿用类与用户
                //    inline 配置——shorthand 会重置时长，故只动属性集），与 leave-to 类
                //    同帧归零——height/padding/margin/border 与 transform/opacity 同链
                //    过渡，布局高度平滑归零、兄弟随流上移。结束检测 expected 已在 leave
                //    内按 transform/opacity 计（need=2），8 事件同刻到达第 2 个即 finish
                //    同步收口，无早收。唯一卡场景 -GAP 无后侧 gap 抵消、淡出中轻微上移，
                //    可忽略（KISS 不特判）
                el.style.transitionProperty =
                    "transform, opacity, height, padding-top, padding-bottom, margin-bottom, border-top-width, border-bottom-width";
                el.style.height = "0px";
                el.style.paddingTop = "0px";
                el.style.paddingBottom = "0px";
                el.style.marginBottom = `${-TOAST_COLUMN_GAP}px`;
                el.style.borderTopWidth = "0px";
                el.style.borderBottomWidth = "0px";
            }
        } else {
            finish();
        }
    }

    /** 摘除卡片：解绑监听 + DOM 移除 + scope 收口（$scopes 键删除 + scoped 样式释放）+ 补位 */
    private _teardown(entry: ToastEntry): void {
        const el = entry.el;
        if (el) {
            if (entry.clickHandler) el.removeEventListener("click", entry.clickHandler);
            if (entry.enterHandler) el.removeEventListener("mouseenter", entry.enterHandler);
            if (entry.leaveHandler) el.removeEventListener("mouseleave", entry.leaveHandler);
            el.remove();
        }
        entry.el = null;
        entry.task.el = null;
        if (entry.scope) {
            const scopeId = entry.scope.id;
            entry.scope.destroy(); // 幂等守卫：级联已销毁时 no-op
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[scopeId]; // 回收私有响应式域（overlay shell 收口同纪律）
            entry.scope = null;
        }
        // 内置 toast-shell 无 scoped 样式（registerShellStyles 共享注入，非引用计数），
        // 自定义 shell 若自带 <style>，其引用计数随 scope.destroy 内部对称释放
        super.delete(entry.id);
        this._flushQueue(entry.props.pos as ToastPos);
    }

    /** 补位（决策 8）：该分区列有空坑时按 FIFO 顺序挂载等待队列 */
    private _flushQueue(pos: ToastPos): void {
        const queue = this._queues.get(pos);
        if (!queue?.length) return;
        const column = getToastColumn(this.engine, pos);
        while (queue.length && column && column.childElementCount < this._showCount) {
            this._mount(queue.shift()!, column);
        }
    }

    // ── Map 覆写与批量操作 ────────────────────────────────────────────

    /**
     * 覆写 `Map.delete`：立即销毁（**无动画**——Map 硬移除语义，与 `task.hide()` 的动画关闭
     * 区分）。不存在返回 false。
     */
    delete(id: string): boolean {
        const task = super.get(id);
        if (!task) return false;
        const entry = (task as ToastTaskImpl)._entry;
        if (entry && entry.state !== "closed") this._dismiss(entry, false);
        return true;
    }

    /**
     * 覆写 `Map.clear`：清全部（含等待队列），默认带离场动画；`clear(false)` 立即清空。
     */
    clear(animated: boolean = true): void {
        for (const task of Array.from(super.values())) {
            const entry = (task as ToastTaskImpl)._entry;
            if (entry && entry.state !== "closed") this._dismiss(entry, animated);
        }
        this._queues.clear();
    }

    /** engine.destroy() 收口（决策 10）：全部立即销毁（无动画）+ 容器整体移除 */
    dispose(): void {
        for (const task of Array.from(super.values())) {
            const entry = (task as ToastTaskImpl)._entry;
            if (entry && entry.state !== "closed") this._dismiss(entry, false);
        }
        this._queues.clear();
        removeToastContainer(this.engine);
    }

    // ── 工具 ──────────────────────────────────────────────────────────

    /** 双通道事件（决策 17）：引擎总线 + 卡片元素 dispatchEvent（body 侧，树内收不到冒泡） */
    private _emit(type: "toast:show" | "toast:hide", entry: ToastEntry): void {
        if (!entry.el) return;
        const detail = { toast: entry.task, el: entry.el };
        this.engine.emit(type, detail);
        entry.el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
    }

    /** 任务句柄工厂（闭包对象：el / id 可变、closed 走 entry 状态） */
    private _createTask(): ToastTaskImpl {
        const manager = this;
        const task: ToastTaskImpl = {
            id: "",
            el: null,
            _entry: null,
            _cancelled: false,
            hide() {
                const entry = this._entry;
                if (entry) {
                    // 已入队：走动画关闭（幂等——closed 状态守卫在 _dismiss 内）
                    manager._dismiss(entry, true);
                } else {
                    // factory 挂起期：取消（resolve 后不显示）
                    this._cancelled = true;
                }
            },
            get closed() {
                return this._cancelled || this._entry?.state === "closed";
            },
        };
        return task;
    }
}

/** 全关 / 无效调用返回的死句柄（共享单例：hide 无效、closed 恒真） */
const DEAD_TASK: ToastTask = {
    id: "",
    el: null,
    hide() {},
    get closed() {
        return true;
    },
};

/** 单条 toast 的运行时 entry（task 的闭包背后态） */
interface ToastEntry {
    id: string;
    /** 合并链后的生效配置（原地更新时整引用换新） */
    props: ToastProps;
    /** 预解析图标名（决策 11 派生键） */
    icon: string;
    /** 预解析按钮表（决策 14） */
    actions: ResolvedToastAction[];
    /** 生命周期状态：queued（排队）→ shown（显示中）→ closed（已关闭） */
    state: "queued" | "shown" | "closed";
    /** shell 实例 scope（rootless；teardown 统一收口） */
    scope: AutoSparkScope | null;
    /** 卡片根元素（排队未挂 / 已摘除为 null） */
    el: HTMLElement | null;
    task: ToastTaskImpl;
    /** 自动关闭计时器（sticky 恒 null） */
    timer: ReturnType<typeof setTimeout> | null;
    /** 满额计时的到期时刻（hover 暂停换算剩余时间用；sticky 为 null） */
    deadline: number | null;
    /** hover 暂停时的剩余 ms（null = 未暂停） */
    pausedRemaining: number | null;
    /** 离场相配置（mount 时解析缓存，leave 相在隐藏时复用，避免二次解析） */
    leave: PhaseAnim | null;
    /** 卡片根委托监听（teardown 解绑） */
    clickHandler: ((e: Event) => void) | null;
    enterHandler: (() => void) | null;
    leaveHandler: (() => void) | null;
    /** 已应用的附加类名（原地更新换装用） */
    appliedClassName: string;
}

/** 任务句柄的可变实现形态（对外只暴露 ToastTask 只读面） */
interface ToastTaskImpl {
    id: string;
    el: HTMLElement | null;
    _entry: ToastEntry | null;
    _cancelled: boolean;
    hide(): void;
    readonly closed: boolean;
}
