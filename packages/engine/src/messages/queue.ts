import type { MessagePos } from "./types";
import type { MessageEntry } from "./entry";
import type { MessageManager } from "./manager";

/**
 * 分区等待队列（ADR-0088 → **ADR-0089 display 模型简化**——offer/flush 补位**挂载**机制
 * 退役，装配在 add 期已完成）：`showCount` 容量判定（state 真身现读）+ 满员排队 + FIFO
 * 补位**显示**（display 切换）。可见计数（shown 簿记）与列内 DOM 数解耦——display:none
 * 的隐藏/排队记录不占可见容量。
 */
export class MessageQueue {
    /** 等待队列（满员排队，补位按队首 FIFO） */
    private waiting: MessageEntry[] = [];
    /** 本分区当前可见（shown）的 entry id 簿记——容量判定的计数源 */
    private shown = new Set<string>();

    constructor(
        private readonly manager: MessageManager,
        readonly pos: MessagePos,
    ) {}

    /** 同屏上限（管理器级键现读 state——运行时修改即刻生效） */
    private get _showCount(): number {
        return this.manager._showCount;
    }

    /**
     * 容量判定与显示入口（manager `_displayEntry` 的收口）：有坑即 display 切换显示，
     * 满员排队。SSR / 无 body（装配已失败）不会到达此处。
     */
    offer(entry: MessageEntry): void {
        if (entry.state === "shown") {
            this.shown.add(entry.id);
            return;
        }
        if (this.shown.size < this._showCount) {
            this.shown.add(entry.id);
            this.manager._showEntry(entry);
        } else {
            this.waiting.push(entry);
        }
    }

    /** 出等待队列（关闭前置——防止补位显示已关闭 entry） */
    remove(entry: MessageEntry): void {
        const i = this.waiting.indexOf(entry);
        if (i >= 0) this.waiting.splice(i, 1);
    }

    /** 可见簿记释放（关闭收口调——display 模型下隐藏/销毁均释放容量） */
    releaseShown(id: string): void {
        this.shown.delete(id);
    }

    /** 补位：该分区有空坑时按队首 FIFO 显示等待队列 */
    flush(): void {
        while (this.waiting.length && this.shown.size < this._showCount) {
            const entry = this.waiting.shift()!;
            this.shown.add(entry.id);
            this.manager._showEntry(entry);
        }
    }

    /** 清空等待队列（clear / dispose 前置——防 dismiss 收口的补位显示排队 entry） */
    clear(): void {
        this.waiting.length = 0;
    }

}
