import { getMessageColumn } from "./container";
import type { MessagePos } from "./types";
import type { MessageEntry } from "./entry";
import type { MessageManager } from "./manager";

/**
 * 分区等待队列（ADR-0088 模块拆分：自 manager `_queues` 簿记收束为类——每 pos 一实例）：
 * 持有该分区的**列元素懒建**（吃掉 manager 对 container 的直接触达）、`showCount` 容量
 * 判定（state 真身现读——运行时改即刻生效）、满员排队、关闭后按队首 FIFO 补位、出队。
 *
 * 挂载触发经编排：有坑即 `session.mount(column)`（装配管线归会话，ADR-0088）；入列
 * `records.sessionListAdd`（queued + shown 均入展示序，ADR-0083 Q11a——由 offer 统一收口）。
 * maxLen 淘汰是跨 pos 的记录级策略，归 records（与本类的展示分区职责正交）。
 */
export class MessageQueue {
    /** 等待队列（满员排队，补位按队首 FIFO） */
    private waiting: MessageEntry[] = [];

    constructor(
        private readonly manager: MessageManager,
        readonly pos: MessagePos,
    ) {}

    /** 同屏上限（管理器级键现读 state——运行时修改即刻生效） */
    private get _showCount(): number {
        return this.manager._showCount;
    }

    /**
     * 容量判定与挂载入口（manager `_displayEntry` 的收口）：有坑即 mount，满员排队。
     * SSR / 无 body（列不可建）保持 queued 不入队（文档不承诺 SSR 显示）。
     */
    offer(entry: MessageEntry): void {
        const column = getMessageColumn(this.manager.engine, this.pos, entry.props.offset);
        if (!column) return;
        this.manager.records.sessionListAdd(entry.id); // queued + shown 均入展示序列（Q11a）
        if (column.childElementCount < this._showCount) {
            entry.session.mount(column);
        } else {
            this.waiting.push(entry);
        }
    }

    /** 出等待队列（dismiss 前置——防止补位 flush 挂载已关闭 entry） */
    remove(entry: MessageEntry): void {
        const i = this.waiting.indexOf(entry);
        if (i >= 0) this.waiting.splice(i, 1);
    }

    /** 补位：该分区列有空坑时按队首 FIFO 挂载等待队列（teardown 后调用） */
    flush(): void {
        if (!this.waiting.length) return;
        const column = getMessageColumn(this.manager.engine, this.pos);
        while (this.waiting.length && column && column.childElementCount < this._showCount) {
            this.waiting.shift()!.session.mount(column);
        }
    }

    /** 清空等待队列（clear / dispose 前置——防 dismiss 同步 teardown 的补位 flush 挂载排队 entry） */
    clear(): void {
        this.waiting.length = 0;
    }

    /** 等待中的 entry 数（测试观察面） */
    get size(): number {
        return this.waiting.length;
    }
}
