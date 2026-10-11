import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import type { AutoSpark } from "../../engine/engine";

/**
 * task 控制与生命周期（ADR-0104）：
 * - 状态机 `state ∈ pending/running/paused/stopped/completed`（旧 paused/completed 布尔
 *   并入）；progress 仅 running 态生效；
 * - 六控制动词 start/pause/resume/stop/cancel/close 各发 `actions/<动词>` 事件——**方法级
 *   单一真相源**（按钮点击与程序直调同发）；
 * - 语义分野：停止 = abort + 「已停止」终态留卡（closeWhenDone 对 stopped 同生效）；
 *   取消 = abort + 立即隐藏；× = 独立 close 动词（非终态先 abort）；
 * - `session.abortSignal`：task 恒注入（canCancel 未声明也有）；原地 update 不换发 controller；
 * - `session.onStart/onPause/onResume/onStop/onCancel/onClose`：具体名订阅（裸 payload）、
 *   返回退订函数、卡销毁自动清残留侦听；
 * - canStart 手动门控：pending 态等「开始」，自动模式首次显示补发一次 actions/start
 *   （factory 闭包内挂的 onStart 不丢事件），重显不重发。
 */

describe("task 控制与生命周期（ADR-0104）", () => {
    const spawned: AutoSpark[] = [];
    afterEach(() => {
        for (const e of spawned) {
            try {
                e.destroy();
            } catch {
                // 幂等销毁吞错
            }
        }
        spawned.length = 0;
        document.querySelectorAll("[data-notification-pos]").forEach((n) => n.remove());
    });

    const spawn = (html: string, state: any = {}, options?: Parameters<typeof mount>[2]) => {
        const m = mount(html, state, options);
        spawned.push(m.engine);
        return m;
    };

    const cardOf = () => document.querySelector<HTMLElement>("[data-notification-pos] > *");

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    /** 假 controller（happy-dom 的 AbortSignal.abort 在事件派发链内重入触发内部 bug——
     * 断言引擎路由用，见 notifications-events.test.ts 同款注释） */
    class FakeAbort {
        aborted = false;
        get signal() {
            return { aborted: this.aborted };
        }
        abort() {
            this.aborted = true;
        }
    }

    const opButton = (text: string) => {
        const ops = Array.from(cardOf()?.querySelectorAll(".autospark-notification-op") ?? []);
        return ops.find((b) => b.textContent?.trim() === text) as HTMLElement | undefined;
    };

    test("控制动词方法级派发：程序直调 pause/resume 同发 actions 事件（单一真相源）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const verbs: string[] = [];
        const task = engine.notifications.task({ id: "v1", title: "任务", delayClose: 0 });
        await nextTick();
        for (const v of ["start", "pause", "resume", "stop", "cancel", "close"] as const) {
            engine.on(`notifications/task/v1/actions/${v}`, () => verbs.push(v));
        }
        task?.methods.pause();
        task?.methods.resume();
        await sleep(20);
        expect(verbs).toEqual(["pause", "resume"]); // 按钮零参与——方法即事件源
        expect(task?.data.state).toBe("running");
    });

    test("stop 语义：abort + 「已停止」终态留卡（默认常驻），进度定格", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "st1", title: "任务", delayClose: 0, canStop: true });
        task?.methods.progress(40);
        await nextTick();
        const fake = new FakeAbort();
        (task?.data as any)._abort = fake;
        let stopVerb = false;
        engine.on("notifications/task/st1/actions/stop", () => (stopVerb = true));
        task?.methods.stop();
        await sleep(40);
        expect(fake.aborted).toBe(true); // 中止信号
        expect(stopVerb).toBe(true);
        expect(task?.data.state).toBe("stopped");
        expect(task?.data.progress).toBe(40); // 进度定格
        expect(cardOf()).not.toBeNull(); // 留卡（结果可查）
        expect(task?.data.holdOpen).toBe(true); // 未交还计时器
    });

    test("stop 后 closeWhenDone: number(ms) 对 stopped 终态同样生效", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let hidden = false;
        engine.on("notifications/task/st2/hide", () => (hidden = true));
        const task = engine.notifications.task({ id: "st2", title: "任务", delayClose: 0, closeWhenDone: 60 });
        task?.methods.progress(50);
        await nextTick();
        task?.methods.stop();
        await sleep(30);
        expect(cardOf()).not.toBeNull(); // 60ms 未到
        expect(task?.data.holdOpen).toBe(false); // 已交还计时器
        await sleep(80);
        expect(hidden).toBe(true); // stopped 终态按 closeWhenDone 收口
    });

    test("cancel 语义：abort + 立即隐藏 + actions/cancel 事件", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "ca1", title: "任务", delayClose: 0 });
        task?.methods.progress(30);
        await nextTick();
        const fake = new FakeAbort();
        (task?.data as any)._abort = fake;
        let cancelVerb = false;
        engine.on("notifications/task/ca1/actions/cancel", () => (cancelVerb = true));
        task?.methods.cancel();
        await sleep(30);
        expect(fake.aborted).toBe(true);
        expect(cancelVerb).toBe(true);
        expect(cardOf()).toBeNull(); // 立即关——不留结果
    });

    test("completed 守卫：完成后的 × 不发无用 abort（ADR-0102 沿用）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "cg1", title: "任务", delayClose: 0 });
        task?.methods.progress(100);
        await nextTick();
        const fake = new FakeAbort();
        (task?.data as any)._abort = fake;
        let closeVerb = false;
        engine.on("notifications/task/cg1/actions/close", () => (closeVerb = true));
        task?.methods.close(); // 程序化 ×（引擎 × 分支同路）
        await sleep(30);
        expect(fake.aborted).toBe(false); // 终态仅关卡
        expect(closeVerb).toBe(true);
        expect(cardOf()).toBeNull();
    });

    test("progress 态门控：paused / 终态 / pending 下的推进被忽略", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "g1", title: "任务", delayClose: 0 });
        await nextTick();
        task?.methods.pause();
        task?.methods.progress(50); // paused：忽略
        expect(task?.data.progress).toBe(0);
        task?.methods.resume();
        task?.methods.progress(60); // running：生效
        expect(task?.data.progress).toBe(60);
        task?.methods.stop();
        task?.methods.progress(80); // stopped：忽略
        expect(task?.data.progress).toBe(60);
    });

    test("canStart 手动门控：pending 态等「开始」——按钮触发 start 事件后才跑", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "m1", title: "任务", delayClose: 0, canStart: true });
        await nextTick();
        expect(task?.data.state).toBe("pending"); // 门控：不自动开跑
        task?.methods.progress(30); // pending：忽略
        expect(task?.data.progress).toBe(0);
        let started = false;
        engine.on("notifications/task/m1/actions/start", () => (started = true));
        opButton("开始")?.click();
        await nextTick();
        await sleep(20);
        expect(started).toBe(true);
        expect(task?.data.state).toBe("running");
        task?.methods.progress(30);
        expect(task?.data.progress).toBe(30); // 启动后推进生效
    });

    test("自动模式 start 补发：首次显示发一次 actions/start，重显不重发", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let starts = 0;
        engine.on("notifications/task/a1/actions/start", () => starts++);
        engine.notifications.task({ id: "a1", title: "任务", delayClose: 0, persist: 1 });
        await nextTick();
        await sleep(20);
        expect(starts).toBe(1); // 首次显示自动补发
        engine.notifications.hide("a1");
        await sleep(30);
        engine.notifications.show("a1");
        await sleep(30);
        expect(starts).toBe(1); // 重显不重发
    });

    test("factory 形态：session.onStart 在闭包内挂接不丢自动 start（时序护栏）", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        let got = false;
        engine.notifications.task(async (session) => {
            session.onStart(() => (got = true));
            return { title: "下载", delayClose: 0 };
        });
        await nextTick();
        await sleep(40);
        expect(got).toBe(true); // show 后补发——晚挂的监听也收到
    });

    test("onXxx 便捷订阅：裸 payload + 退订函数 + 卡销毁自动清残留", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "o1", title: "任务", delayClose: 0 });
        await nextTick();
        expect(typeof task?.onPause).toBe("function"); // 便捷面扁平直达
        let hits = 0;
        let last: any = null;
        const off = task?.onPause((env: any) => {
            hits++;
            last = env?.payload ?? env; // FastLiteEvent 信封：payload 在 .payload 上
        });
        task?.methods.pause();
        await sleep(20);
        expect(hits).toBe(1);
        expect(last?.notification?.props?.id).toBe("o1");
        // 手动退订
        (off as () => void)();
        task?.methods.resume();
        task?.methods.pause();
        await sleep(20);
        expect(hits).toBe(1); // 退订后不再收
        // 销毁自动清：重挂监听后删卡，手动重放同名事件不应到达
        let after = 0;
        task?.onPause(() => after++);
        engine.notifications.delete("o1");
        await sleep(20);
        engine.emit("notifications/task/o1/actions/pause", {} as any);
        expect(after).toBe(0); // 残留侦听已随卡清理
    });

    test("abortSignal 便捷面：task 恒注入（无 canCancel 也有），update 换装不换发", async () => {
        const { engine } = spawn(`<div><span>x</span></div>`, {});
        const task = engine.notifications.task({ id: "ab1", title: "任务", delayClose: 0 });
        await nextTick();
        expect(task?.abortSignal).toBeDefined(); // 未声明 canCancel 也恒有（ADR-0104）
        expect(task?.abortSignal).toBe((task?.data as any)._abort.signal);
        const first = task?.abortSignal;
        engine.notifications.update("ab1", { title: "任务（改）" });
        await sleep(20);
        expect(task?.abortSignal).toBe(first); // 原地更新复用既有 controller
    });
});
