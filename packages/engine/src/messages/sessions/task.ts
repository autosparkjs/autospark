import { MessageSessionBase } from "./base";
import { clampProgress } from "../props";
import type { AutoSparkTaskMessageSession, MessageProps } from "../types";
import type { MessageEntry } from "../entry";

/**
 * task 专属 props（**type 分型**：公共键见 `MessageProps`——`MessageEntry.props` 的通用
 * 引用在 task 路径上窄化为本类型；其他 type 携带这些键 → 运行时 warn + 忽略兜底）。
 */
export interface TaskMessageProps extends MessageProps {
    /** 初始进度 0~100（task 专属）；task 预设组件全权渲染进度槽 */
    progress?: number;
    /** 启用**暂停控制**（默认 false）：预设组件自动带「暂停 / 恢复」按钮（文案随运行态切换） */
    canPause?: boolean;
    /** 启用**取消控制**（默认 false）：自动带「取消」按钮；session 暴露 `signal: AbortSignal`
     *  ——取消瞬间 abort，fetch 等协作式异步挂接即中断（自然完成 / 超时 / remove 不发信号） */
    canCancel?: boolean;
    /** 启用**停止控制**（默认 false）：自动带「停止」按钮（≡ complete()——完成态收口） */
    canStop?: boolean;
}

/**
 * task 会话（type='task'）：七方法管理任务生命周期——进度状态机（`_applyProgress` /
 * `_setPaused`）归本类持有（ADR-0088 职责收束，原 manager 共享管线上移）。行为与渲染
 * 模板同文件（ADR-0083 变体 A 聚合）——`TASK_TEMPLATE` 即本 type 的预设组件
 * （模板绑定契约 = 本文件 `TaskMessageProps` + 运行态投影 progress/paused/completed）。
 *
 * **三控制钮归模板**（ADR-0088，取代 ADR-0083 三控制键二次修订的 action 注入通道）：
 * 按钮显隐与「暂停↔恢复」文案由数据域响应式驱动（`canPause/paused/completed` 整包注入），
 * 点击 `@click` 直调本会话方法——**不发 `message:action`**（控制钮是行为不是 action；
 * 观测走 `message:update`（paused/completed 投影变更照发）+ `message:show/hide`）。
 */
export class MessageTaskSession extends MessageSessionBase implements AutoSparkTaskMessageSession {
    /** 本 type 的预设渲染组件名（全局组件表查找；与 presetComponentName 约定等值） */
    static readonly component = "autospark.messages.task";

    // ── task 域运行态（自 MessageEntry 迁入——通用 entry 只留跨 type 字段；ADR-0088 收束） ──
    /** 进度值（0~100） */
    _progress = 0;
    /** 是否已完成（完成态进入 delayClose 倒计时） */
    _completed = false;
    /** 是否已 start（闸门前置；创建即 started——ADR-0083 二次修订） */
    _started = true;
    /** 闸门：pause 后 progress 调用被忽略 */
    _paused = false;

    /**
     * 初始进度装载（createEntry 尾调用）：初始 progress ≥ 100 直接进入完成态
     * （factory 后台跑完 return 完成卡形态，ADR-0083 二次修订）。
     */
    _initProgress(n: number): void {
        this._progress = clampProgress(n);
        if (this._progress >= 100) this._completed = true;
    }

    // ── type 自治钩子覆写（公共层调用，本类补 task 域——base 默认 no-op） ──

    /** 初始装载：初始进度 + canCancel 时创建协作取消控制器 */
    override initFromProps(merged: MessageProps): void {
        const tp = merged as TaskMessageProps;
        this._initProgress(clampProgress(tp.progress));
        this._abortController = tp.canCancel === true ? new AbortController() : null;
    }

    /** 镜像投影：task 运行态 + 三控制键补进 `$messages.items` 记录 */
    override projectInto(rec: import("../types").AutoSparkMessage): void {
        const p = this._entry?.props as TaskMessageProps | undefined;
        rec.progress = this._progress;
        rec.paused = this._paused;
        rec.completed = this._completed;
        if (p?.canPause !== undefined) rec.canPause = p.canPause;
        if (p?.canCancel !== undefined) rec.canCancel = p.canCancel;
        if (p?.canStop !== undefined) rec.canStop = p.canStop;
    }

    /** 配置应用：progress 补丁通道（update(id, { progress }) 同路） */
    override onEntryProps(entry: MessageEntry, props: MessageProps): void {
        const tp = props as TaskMessageProps;
        if (tp.progress != null) this._applyProgress(entry, Number(tp.progress));
    }

    /** 计时拦截：进行中 sticky（完成态才进入 delayClose 倒计时） */
    override _holdOpen(): boolean {
        return !this._completed;
    }

    /** 注入 props：公共面（super）+ task 运行态投影（进度条与控制钮的数据域驱动源） */
    override _buildInjectProps(): Record<string, any> {
        const out = super._buildInjectProps();
        out.progress = this._progress;
        out.paused = this._paused;
        out.completed = this._completed;
        return out;
    }

    /** 是否允许暂停（canPause 配置投影——启用时预设组件自带「暂停/恢复」按钮） */
    get canPause(): boolean {
        return (this._entry?.props as TaskMessageProps | undefined)?.canPause === true;
    }
    /** 是否允许取消（canCancel 配置投影——启用时自带「取消」按钮 + signal） */
    get canCancel(): boolean {
        return (this._entry?.props as TaskMessageProps | undefined)?.canCancel === true;
    }
    /** 是否允许停止（canStop 配置投影——启用时自带「停止」按钮） */
    get canStop(): boolean {
        return (this._entry?.props as TaskMessageProps | undefined)?.canStop === true;
    }
    /** 协作取消控制器（type 自治：task 专属，随会话私有——公共 entry 不含 type 域字段） */
    private _abortController: AbortController | null = null;

    /** 协作取消信号（canCancel 启用时有效；cancel() 瞬间 abort，fetch 挂接即中断） */
    get signal(): AbortSignal | undefined {
        return this._abortController?.signal;
    }

    /**
     * 开始接受进度推进——**幂等兼容面**（ADR-0083 二次修订：创建即 started，本方法保留为
     * 旧写法兼容，重复调用无效果）。
     */
    start(): void {
        this._started = true;
    }
    /**
     * 推进进度（clamp [0,100]；已 pause / 已完成时调用被忽略）。factory 挂起期（卡片未弹）
     * **缓存**进度值——return 的初始 props 落地时随挂起补丁合并（闭包驱动的早期进度不丢，
     * ADR-0083 二次修订）；死会话 no-op。
     */
    progress(n: number): void {
        const entry = this._entry;
        if (!entry) {
            if (this.id !== "") return; // 死会话 no-op
            Object.assign((this._pendingPatch ??= {}), { progress: n }); // 挂起缓存
            return;
        }
        if (this._paused || this._completed) return;
        this._applyProgress(entry, n);
    }
    /** 闸门关闭：progress(n) 调用被忽略（数据域 paused 刷新——按钮文案切「恢复」） */
    pause(): void {
        const entry = this._entry;
        if (entry) this._setPaused(entry, true);
    }
    /** 闸门打开：恢复接受 progress(n)（按钮文案切「暂停」） */
    resume(): void {
        const entry = this._entry;
        if (entry) this._setPaused(entry, false);
    }
    /** 标记完成（≡ progress(100)）：完成态按 delayClose 展示后关 */
    stop(): void {
        const entry = this._entry;
        if (!this._completed) this._applyProgress(this._entry!, 100);
    }
    /** 完成的显式别名（≡ stop——一个通用名一个语义名，同一实现） */
    complete(): void {
        this.stop();
    }
    /**
     * 取消（task 覆写）：先触发**协作取消信号**（`signal.abort()`——canCancel 启用时 fetch
     * 等挂接即中断；自然完成 / 超时 / remove 不经此），再立即关（基类实现）。
     */
    override cancel(): void {
        this._abortController?.abort();
        super.cancel();
    }

    // ── 进度状态机（ADR-0088 自 manager 上移；manager.update(id,{progress}) 同通道） ──

    /**
     * 进度推进收口：clamp + 写 entry / props + 数据域与镜像同步；到 100 转完成态
     * （进入 delayClose 倒计时——控制钮显隐经 completed 投影响应式滤除，非 action 滤除）。
     */
    _applyProgress(entry: MessageEntry, n: number): void {
        const value = clampProgress(n);
        this._progress = value;
        (entry.props as TaskMessageProps).progress = value; // 配置面留痕（原地更新 / 恢复读取）
        this.syncData();
        this.manager.records.mirrorReplace(entry);
        if (value >= 100 && !this._completed) {
            this._completed = true; // 完成态：进入 delayClose 倒计时（默认 3000）
            this._startTimer();
            this.syncData(); // completed 投影刷新（控制钮 x-show 收起）
            this.manager.records.mirrorReplace(entry);
            // 完成态转换发 message:update（ADR-0088：控制钮失去 message:action 后的观测面）
            this.manager._emit("message:update", entry);
        }
    }

    /**
     * 闸门翻转收口（session.pause()/resume() 的落点）：paused 写入 + 数据域/镜像同步
     * + message:update 广播（ADR-0088：控制钮失去 message:action 后的观测面）——按钮文案
     * 切换由数据域响应式驱动（不再需要不可变 actions 成员更新）。
     */
    _setPaused(entry: MessageEntry, paused: boolean): void {
        if (this._paused === paused) return;
        this._paused = paused;
        this.syncData();
        this.manager.records.mirrorReplace(entry);
        this.manager._emit("message:update", entry);
    }
}
/**
 * task 预设组件模板（ADR-0088 自有布局——不再继承 base）：主行（icon + title/link +
 * description + 进度槽）+ **三控制钮行**（x-show 数据域驱动、`@click` 直调 `$session`
 * 方法）+ actions 组件组合。头部与 base 重复 ~6 行（YAGNI 裁决——公共复用件只 actions 一件）。
 *
 * **样式经 `<style>` 组件 scoped（ADR-0022）**（ADR-0083 修订沿用）——组件被用户同名
 * 覆盖 / types.task.render 接管时样式随定义同生命周期自动消失（死样式零泄漏）；语义色随
 * 卡片根 `data-message-level` 的 accent 变量联动（CSS 变量继承不受 scoped 影响）。引擎
 * 结构契约样式（wrapper 类 / 收拢 / slide 覆写 / 分区列 / actions 行）不在此——归
 * styles.ts 全局注入（分界见 ADR-0083 实现要点 8）。
 *
 * 控制钮类名 `autospark-message-op` **刻意避开** `.autospark-message-action` 委托契约
 * （点击闭环只认用户 actions——控制钮是行为不是 action，ADR-0088）。
 */
export const TASK_TEMPLATE = `
<div x-define="autospark.messages.task">
<style>
.autospark-message-progress { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.autospark-message-progress-track { flex: 1; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--autospark-message-accent, #999) 15%, var(--autospark-overlay-bg, #fff)); overflow: hidden; }
.autospark-message-progress-bar { height: 100%; border-radius: 3px; background: var(--autospark-message-accent, #409eff); transition: width 0.2s; }
.autospark-message-progress-text { flex: none; font-size: 12px; opacity: 0.75; min-width: 34px; text-align: right; }
.autospark-message-ops { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 6px; }
.autospark-message-op { flex: none; border: none; background: none; padding: 0; font: inherit; font-size: 13px; color: var(--autospark-message-accent, #409eff); cursor: pointer; }
</style>
<div class="autospark-message-main">
<i class="autospark-message-icon" x-icon="icon" x-show="icon" aria-hidden="true"></i>
<div class="autospark-message-content">
<div class="autospark-message-title-row">
<span class="autospark-message-title" x-html="title"></span>
<a class="autospark-message-link" x-show="link" :href="link" target="_blank" rel="noopener noreferrer" aria-label="查看详情"><i class="autospark-message-link-icon" x-icon="'external'" aria-hidden="true"></i></a>
</div>
<div class="autospark-message-description" x-html="description" x-show="description"></div>
<div class="autospark-message-progress">
<div class="autospark-message-progress-track">
<div class="autospark-message-progress-bar" :style="'width:' + (progress ?? 0) + '%'"></div>
</div>
<span class="autospark-message-progress-text" x-text="(progress ?? 0) + '%'"></span>
</div>
</div>
</div>
<div class="autospark-message-ops" x-show="(canPause || canStop || canCancel) && !completed">
<button class="autospark-message-op" type="button" x-show="canPause" x-text="paused ? '恢复' : '暂停'" @click="paused ? $session.resume() : $session.pause()"></button>
<button class="autospark-message-op" type="button" x-show="canStop" @click="$session.stop()">停止</button>
<button class="autospark-message-op" type="button" x-show="canCancel" @click="$session.cancel()">取消</button>
</div>
<div x-component:autospark.messages.actions="{ actions }"></div>
</div>`;
