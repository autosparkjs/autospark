/**
 * RemoteLoadSession —— 远程加载会话骨架（中止 / 竞态丢弃 / 判重 / 销毁守卫）。
 *
 * 引擎内每个远程加载入口（x-import、x-component loader、overlay 远程、x-isolate remote、
 * AsyncSourceRunner 的 x-data / x-html 异步源）都需要同一套约 15 行的样板：
 *
 * - 新一轮发起时 **abort 旧请求**；
 * - **判重**（依赖变化但求值结果未变 → 跳过重取）；
 * - `await` 之后**落地前**判断结果是否已过期（新轮已抢占 / 已销毁）→ 丢弃；
 * - `destroy` 后**拒收一切在途结果**。
 *
 * 在 `RemoteLoadSession` 抽出之前，这段骨架被逐字实现了 6 遍（且 x-import 的 abort 因为
 * 忘记把 signal 透传给 fetch 而空转——「各写各的」直接导致的不一致）。本类把它收敛为
 * **无 DOM、无 scope、无 engine 依赖**的纯会话对象，可独立单测。
 *
 * @example
 * ```ts
 * private session = new RemoteLoadSession();
 *
 * private async _load(url: string): Promise<void> {
 *     const round = this.session.begin(url); // url 变化判重 + abort 旧轮；null = 应跳过
 *     if (!round) return;
 *     try {
 *         const text = await fetchHtml(url, round.signal);
 *         if (this.session.isStale(round)) return; // 已被新轮抢占 / 已销毁
 *         this.render(text);
 *     } catch (e) {
 *         if (this.session.isStale(round)) return; // abort 抛的 AbortError 静默
 *         this.warn(String(e));
 *     }
 * }
 *
 * override destroy() {
 *     this.session.destroy();
 * }
 * ```
 *
 * **会话层与取数层的分工**：本类只管「这一轮还值不值得落地」，不管「怎么取数」
 * （url 插值 watch、action 链、method/header 选项等属于取数层——见 `AsyncSourceRunner`）。
 * 也不管反馈 UI（占位 / fallback / 覆盖层）——那是各指令的产物消费差异，不是重复。
 */

/** 一轮加载的凭证（`begin` 返回；落地前用它问会话「还算不算数」） */
export interface RemoteLoadRound {
    /** 本轮请求的中止信号——透传给 `fetch` / `importComponentsFromUrl` */
    signal: AbortSignal;
    /** 本轮序号（后端判重依据，外部无需读取） */
    seq: number;
}

export class RemoteLoadSession {
    /** 请求序号：竞态丢弃过期响应（后发先至的旧响应直接扔，ADR-0033 决策 5） */
    private seq = 0;
    /** 进行中请求的中止器（新轮开启 / destroy 时 abort） */
    private ctrl: AbortController | null = null;
    /** 上次已请求的 key（判重：依赖变化但求值结果未变 → 跳过重取） */
    private lastKey: string | null = null;
    /** destroy 后拒收一切在途结果 */
    private destroyed = false;

    /**
     * 开启新一轮加载：abort 旧轮 + 序号递增（+ 可选判重）。
     *
     * @param key 判重键（通常为最终 url）。**同 key 连续调用只跑第一轮**；省略则不判重
     *             （适用于 action 形态等无稳定 key 的场景）。
     * @returns 本轮凭证；`null` = 应跳过（已销毁 / 同 key 去重命中）。
     */
    begin(key?: string): RemoteLoadRound | null {
        if (this.destroyed) return null;
        if (key !== undefined && key === this.lastKey) return null;
        if (key !== undefined) this.lastKey = key;
        this.ctrl?.abort();
        const ctrl = (this.ctrl = new AbortController());
        return { signal: ctrl.signal, seq: ++this.seq };
    }

    /**
     * 判定本轮是否已**过期**——`await` 之后、落地之前必须检查。
     *
     * 过期 = 会话已销毁 / 已有新轮开启 / 信号被中止。为 true 时调用方应**静默丢弃**
     * （渲染到已销毁宿主、或被更新的一轮覆盖，都比不渲染更糟）。
     */
    isStale(round: RemoteLoadRound): boolean {
        return this.destroyed || round.seq !== this.seq || round.signal.aborted;
    }

    /**
     * 中止当前轮但**不销毁会话**（供「换 url 前先拆旧」这类场景：x-isolate 先 teardown
     * child engine 再发起新轮）。后续 `begin` 照常可用。
     */
    abort(): void {
        this.ctrl?.abort();
        this.ctrl = null;
    }

    /** 销毁：中止进行中请求 + 序号失效 + 拒收此后一切 `begin`（ADR-0033 决策 7） */
    destroy(): void {
        this.destroyed = true;
        this.seq++;
        this.ctrl?.abort();
        this.ctrl = null;
    }
}
