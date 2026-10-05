/**
 * task type 组件（ADR-0089：一 type 一组件——行为+渲染+数据视图全住组件，取代 ADR-0083/0088
 * 的 MessageTaskSession class）：继承 base 族根（头部/actions 复用），出口覆盖段 = 进度条 +
 * 三控制钮；task 状态机（进度 clamp / pause 闸门 / 完成转计时 / 协作取消）为组件 methods。
 *
 * 约定键（引擎联动，ADR-0089 决策五）：
 * - `progress/paused/completed`：task 运行态（manager watch → `message:update` 广播观测面）
 * - `holdOpen`：进行中恒 true（sticky）；完成态联动置 false——引擎 watch 启动 delayClose 计时
 *
 * `_abort`（AbortController）非约定键——canCancel 时由 manager 注水（数据层造、组件消费），
 * 外部经 `instance.data._abort.signal` 挂接协作取消（fetch 即中断）。
 *
 * 模板内 methods 直达（`@click="pause()"`——$session 已退役，ADR-0089 决策六）；控制钮类名
 * `autospark-message-op` 刻意避开 `.autospark-message-action` 委托契约（控制钮是行为不是
 * action，ADR-0088 沿用）。
 */
export const TASK_TEMPLATE = `
<div x-define="autospark.messages.task" x-define:inherit="autospark.messages.base">
<script setup>
{
    data: () => ({
        progress: 0,
        paused: false,
        completed: false,
        holdOpen: true,
    }),
    methods: {
        start() {},            // 幂等兼容面（创建即 started，ADR-0083 二次修订沿用）
        progress(n) {
            if (this.data.paused || this.data.completed) return;
            const v = Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
            this.data.progress = v;
            if (v >= 100) this._complete();
        },
        pause() { if (!this.data.completed) this.data.paused = true; },
        resume() { this.data.paused = false; },
        stop() { this._complete(); },
        complete() { this._complete(); },
        cancel() {
            this.data._abort?.abort();
            this.engine.messages.hide(this.props.id);
        },
        _complete() {
            if (this.data.completed) return;
            this.data.progress = 100;
            this.data.completed = true;
            this.data.holdOpen = false;
        },
    },
}
</script>
<style>
.autospark-message-progress { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.autospark-message-progress-track { flex: 1; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--autospark-message-accent, #999) 15%, var(--autospark-overlay-bg, #fff)); overflow: hidden; }
.autospark-message-progress-bar { height: 100%; border-radius: 3px; background: var(--autospark-message-accent, #409eff); transition: width 0.2s; }
.autospark-message-progress-text { flex: none; font-size: 12px; opacity: 0.75; min-width: 34px; text-align: right; }
.autospark-message-ops { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 6px; }
.autospark-message-op { flex: none; border: none; background: none; padding: 0; font: inherit; font-size: 13px; color: var(--autospark-message-accent, #409eff); cursor: pointer; }
</style>
<div class="autospark-message-progress">
<div class="autospark-message-progress-track">
<div class="autospark-message-progress-bar" :style="'width:' + (progress ?? 0) + '%'"></div>
</div>
<span class="autospark-message-progress-text" x-text="(progress ?? 0) + '%'"></span>
</div>
<div class="autospark-message-ops" x-show="(canPause || canStop || canCancel) && !completed">
<button class="autospark-message-op" type="button" x-show="canPause" x-text="paused ? '恢复' : '暂停'" @click="paused ? resume() : pause()"></button>
<button class="autospark-message-op" type="button" x-show="canStop" @click="stop()">停止</button>
<button class="autospark-message-op" type="button" x-show="canCancel" @click="cancel()">取消</button>
</div>
</div>`;

/** task 种子默认（合并链 type 种子层：紧凑形态；persist 沿全局默认 0——任务记录跨会话走显式配置） */
export const TASK_DEFAULTS: Record<string, any> = { width: 300 };
